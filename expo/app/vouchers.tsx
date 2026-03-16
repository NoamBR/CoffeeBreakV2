import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ticket } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useReferralStore } from '@/stores/referralStore';
import { useUserStore } from '@/stores/userStore';
import VoucherCard from '@/components/VoucherCard';
import { Voucher } from '@/types';
import * as vouchersService from '@/services/vouchersService';

type Tab = 'active' | 'redeemed';

export default function VouchersScreen() {
  const router = useRouter();
  const vouchers = useReferralStore((s) => s.vouchers);
  const syncVouchers = useReferralStore((s) => s.syncVouchers);
  const updateVoucherFromServer = useReferralStore((s) => s.updateVoucherFromServer);
  const addVoucherFromServer = useReferralStore((s) => s.addVoucherFromServer);
  const userId = useUserStore((s) => s.user?.id);
  const [tab, setTab] = useState<Tab>('active');
  const colors = useThemeColors();
  const styles = getStyles(colors);

  // Sync vouchers from server on mount
  useEffect(() => {
    if (userId) {
      syncVouchers(userId);
    }
  }, [userId]);

  // Subscribe to realtime voucher updates
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = vouchersService.subscribeToVouchers(
      userId,
      (newVoucher) => addVoucherFromServer(newVoucher),
      (updatedVoucher) => updateVoucherFromServer(updatedVoucher),
    );

    return unsubscribe;
  }, [userId]);

  const active = useMemo(() => vouchers.filter((v) => v.status === 'active' && !v.redeemedAt), [vouchers]);
  const redeemed = useMemo(() => vouchers.filter((v) => v.status === 'redeemed' || !!v.redeemedAt), [vouchers]);
  const data = tab === 'active' ? active : redeemed;

  const handleVoucherPress = (voucher: Voucher) => {
    router.push({ pathname: '/voucher-display', params: { id: voucher.id } });
  };

  return (
    <View style={styles.wrapper}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'active' && styles.tabActive]}
          onPress={() => setTab('active')}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
            פעילים ({active.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'redeemed' && styles.tabActive]}
          onPress={() => setTab('redeemed')}
        >
          <Text style={[styles.tabText, tab === 'redeemed' && styles.tabTextActive]}>
            מומשו ({redeemed.length})
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VoucherCard voucher={item} onPress={handleVoucherPress} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ticket size={56} color={colors.inactive} />
            <Text style={styles.emptyTitle}>
              {tab === 'active' ? 'אין קופונים פעילים' : 'אין קופונים מומשים'}
            </Text>
            <Text style={styles.emptyDesc}>
              {tab === 'active'
                ? 'קופונים חדשים יתווספו כשתצברו חותמות או תזמינו חברים'
                : 'קופונים שמומשו יופיעו כאן'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  list: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
