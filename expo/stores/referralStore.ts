import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Voucher, VoucherType } from '@/types';
import * as vouchersService from '@/services/vouchersService';
import { CreateVoucherParams } from '@/services/vouchersService';

// ─── Local barcode generator (fallback for offline-created vouchers) ───
function generateLocalBarcode(): string {
  const a = Math.random().toString(36).substring(2, 6).toUpperCase();
  const b = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LOCAL-${a}-${b}`;
}

function createLocalVoucher(type: VoucherType, title: string, description: string, value?: number): Voucher {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    type,
    status: 'active',
    title,
    description,
    value,
    barcode: generateLocalBarcode(),
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

      generateCode: (userId: string) => {
        if (get().referralCode) return;
        const code = `CB${userId.slice(-4).toUpperCase()}`;
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
        // 1. Optimistic local insert (immediate UI update)
        const localVoucher = createLocalVoucher(type, title, description, value);
        set((state) => ({
          vouchers: [...state.vouchers, localVoucher],
        }));

        // 2. Queue for server creation
        const source = inferSource(title);
        set((state) => ({
          pendingCreations: [
            ...state.pendingCreations,
            {
              localId: localVoucher.id,
              userId: '', // filled during sync
              type,
              title,
              description,
              value,
              source,
            },
          ],
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
      storage: createJSONStorage(() => AsyncStorage),
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
