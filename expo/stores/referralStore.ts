import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '@/lib/secureStorage';
import { Voucher, VoucherType } from '@/types';
import * as vouchersService from '@/services/vouchersService';
import { CreateVoucherParams } from '@/services/vouchersService';

/**
 * Create a local placeholder voucher pending server sync.
 * Uses LOCAL- prefix to distinguish from server-generated barcodes.
 * The real barcode is assigned server-side via create_voucher().
 */
function createVoucherLocal(type: VoucherType, title: string, description: string, value?: number): Voucher {
  // Use crypto.getRandomValues for better entropy than Math.random
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    id: `local-${Date.now()}-${hex.slice(0, 8)}`,
    type,
    status: 'pending',
    title,
    description,
    value,
    barcode: `LOCAL-${hex.toUpperCase()}`, // Placeholder — replaced after server sync
    source: inferSource(title),
    earnedAt: new Date().toISOString(),
  };
}

// ─── Source mapping ──────────────────────────────────────────
function inferSource(title: string): string {
  if (title.includes('כרטיס נאמנות')) return 'loyalty';
  if (title.includes('כרטיס גירוד')) return 'scratch';
  if (title.includes('הזמנת חבר') || title.includes('שגריר')) return 'referral';
  if (title.includes('יום הולדת')) return 'birthday';
  return 'system';
}

// ─── Store types ─────────────────────────────────────────────
type PendingCreation = CreateVoucherParams & { localId: string };

type ReferralState = {
  referralCount: number;
  referralCode: string;
  isAmbassador: boolean;
  ambassadorJoinedAt: string | null;
  vouchers: Voucher[];
  pendingCreations: PendingCreation[];
  lastSyncedAt: string | null;
  isSyncing: boolean;
  migrationVersion: number;

  // Referral actions
  incrementReferral: () => void;
  generateCode: (userId: string) => void;
  joinAmbassador: () => void;

  // Voucher actions (preserved interface)
  addVoucher: (type: VoucherType, title: string, description: string, value?: number) => void;
  redeemVoucher: (voucherId: string) => void;
  getActiveVouchers: () => Voucher[];
  getRedeemedVouchers: () => Voucher[];
  findVoucherByBarcode: (barcode: string) => Voucher | undefined;

  // Server sync actions
  syncVouchers: (userId: string) => Promise<void>;
  syncPendingCreations: (userId: string) => Promise<void>;
  migrateLocalVouchers: (userId: string) => Promise<void>;
  updateVoucherFromServer: (voucher: Voucher) => void;
  addVoucherFromServer: (voucher: Voucher) => void;
};

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      referralCount: 0,
      referralCode: '',
      isAmbassador: false,
      ambassadorJoinedAt: null,
      vouchers: [],
      pendingCreations: [],
      lastSyncedAt: null,
      isSyncing: false,
      migrationVersion: 0,

      // ─── Referral actions (unchanged) ─────────────────────
      incrementReferral: () => {
        set((state) => ({ referralCount: state.referralCount + 1 }));
        if (get().isAmbassador) {
          get().addVoucher('free_coffee', 'קפה חינם — הזמנת חבר', 'קיבלת קפה חינם כי הזמנת חבר להפסקת קפה!');
        }
      },

      generateCode: (_userId: string) => {
        if (get().referralCode) return;
        // Generate cryptographically strong referral code (6 alphanumeric chars)
        // Previous: CB + last 4 hex of userId = 65K possibilities (brute-forceable)
        // New: CB + 6 random chars from 36-char alphabet = ~2.2 billion possibilities
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const bytes = new Uint8Array(6);
        crypto.getRandomValues(bytes);
        const code = 'CB' + Array.from(bytes).map(b => chars[b % chars.length]).join('');
        set({ referralCode: code });
      },

      joinAmbassador: () => {
        const now = new Date().toISOString();
        get().addVoucher('free_coffee', 'קפה חינם — מתנת הצטרפות', 'קפה חינם כמתנת הצטרפות לתוכנית שגריר קפה!');
        get().addVoucher('free_coffee', 'קפה חינם — מתנת הצטרפות', 'קפה חינם כמתנת הצטרפות לתוכנית שגריר קפה!');
        set({ isAmbassador: true, ambassadorJoinedAt: now });
      },

      // ─── Voucher actions (with server sync) ───────────────

      addVoucher: (type, title, description, value) => {
        const voucher = createVoucherLocal(type, title, description, value);
        set((state) => ({
          vouchers: [...state.vouchers, voucher],
        }));
      },

      redeemVoucher: (voucherId: string) => {
        // Local state update (for backward compat)
        set((state) => ({
          vouchers: state.vouchers.map((v) =>
            v.id === voucherId ? { ...v, status: 'redeemed' as const, redeemedAt: new Date().toISOString() } : v
          ),
        }));
      },

      getActiveVouchers: () => get().vouchers.filter((v) => v.status === 'active' && !v.redeemedAt),

      getRedeemedVouchers: () => get().vouchers.filter((v) => v.status === 'redeemed' || !!v.redeemedAt),

      findVoucherByBarcode: (barcode: string) =>
        get().vouchers.find((v) => v.barcode === barcode),

      // ─── Server sync ──────────────────────────────────────

      syncVouchers: async (userId: string) => {
        if (get().isSyncing) return;
        set({ isSyncing: true });

        try {
          // Run migration if needed
          if (get().migrationVersion < 1) {
            await get().migrateLocalVouchers(userId);
          }

          // Sync pending creations
          await get().syncPendingCreations(userId);

          // Fetch authoritative state from server
          const serverVouchers = await vouchersService.fetchUserVouchers(userId);

          // Merge: server is source of truth, but keep local-only vouchers that are still pending
          const pendingLocalIds = new Set(get().pendingCreations.map((p) => p.localId));
          const localOnlyVouchers = get().vouchers.filter(
            (v) => v.barcode.startsWith('LOCAL-') && pendingLocalIds.has(v.id)
          );

          set({
            vouchers: [...serverVouchers, ...localOnlyVouchers],
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('[referralStore] sync failed:', err);
        } finally {
          set({ isSyncing: false });
        }
      },

      syncPendingCreations: async (userId: string) => {
        const pending = get().pendingCreations;
        if (pending.length === 0) return;

        const succeeded: string[] = [];

        for (const item of pending) {
          try {
            const created = await vouchersService.createVoucher({
              userId,
              type: item.type,
              title: item.title,
              description: item.description,
              value: item.value,
              source: item.source,
            });

            // Replace local voucher with server voucher
            set((state) => ({
              vouchers: state.vouchers.map((v) =>
                v.id === item.localId ? created : v
              ),
            }));

            succeeded.push(item.localId);
          } catch (err) {
            console.error('[referralStore] pending creation failed:', err);
            // Keep in queue for next sync attempt
          }
        }

        // Remove succeeded items from pending queue
        if (succeeded.length > 0) {
          set((state) => ({
            pendingCreations: state.pendingCreations.filter(
              (p) => !succeeded.includes(p.localId)
            ),
          }));
        }
      },

      migrateLocalVouchers: async (userId: string) => {
        const localVouchers = get().vouchers.filter(
          (v) => !v.redeemedAt && !v.barcode.startsWith('LOCAL-')
        );

        for (const v of localVouchers) {
          try {
            await vouchersService.createVoucher({
              userId,
              type: v.type,
              title: v.title,
              description: v.description,
              value: v.value,
              source: 'migration',
            });
          } catch (err) {
            console.error('[referralStore] migration failed for voucher:', v.id, err);
          }
        }

        set({ migrationVersion: 1 });
      },

      updateVoucherFromServer: (voucher: Voucher) => {
        set((state) => ({
          vouchers: state.vouchers.map((v) =>
            v.id === voucher.id ? voucher : v
          ),
        }));
      },

      addVoucherFromServer: (voucher: Voucher) => {
        const exists = get().vouchers.some((v) => v.id === voucher.id);
        if (!exists) {
          set((state) => ({
            vouchers: [...state.vouchers, voucher],
          }));
        }
      },
    }),
    {
      name: 'coffeebreak-referral',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        referralCount: state.referralCount,
        referralCode: state.referralCode,
        isAmbassador: state.isAmbassador,
        ambassadorJoinedAt: state.ambassadorJoinedAt,
        vouchers: state.vouchers,
        pendingCreations: state.pendingCreations,
        lastSyncedAt: state.lastSyncedAt,
        migrationVersion: state.migrationVersion,
      }),
    }
  )
);
