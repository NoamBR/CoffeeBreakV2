import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import { Users, Share2, Check } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useReferralStore } from '@/stores/referralStore';
import { useUserStore } from '@/stores/userStore';
import { useEffect } from 'react';

export default function ReferralWidget() {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const { referralCount, referralCode, generateCode } = useReferralStore();
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    if (user?.id) {
      generateCode(user.id);
    }
  }, [user?.id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `הצטרפו להפסקת קפה! ☕ הורידו את האפליקציה וקבלו משקה ראשון חינם. קוד הזמנה: ${referralCode}`,
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>הזמינו חברים</Text>
        <Users size={20} color={colors.primary} />
      </View>

      <Text style={styles.headline}>הזמינו חבר ושניכם תרוויחו!</Text>

      <View style={styles.benefits}>
        <View style={styles.benefitRow}>
          <Text style={styles.benefitText}>החבר מקבל: משקה ראשון חינם</Text>
          <Check size={16} color={colors.success} />
        </View>
        <View style={styles.benefitRow}>
          <Text style={styles.benefitText}>אתם מקבלים: חותמת בונוס</Text>
          <Check size={16} color={colors.success} />
        </View>
      </View>

      {referralCount > 0 && (
        <Text style={styles.countText}>
          הזמנתם: {referralCount} חברים
        </Text>
      )}

      <Pressable
        style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
        onPress={handleShare}
      >
        <Share2 size={18} color={colors.white} />
        <Text style={styles.shareBtnText}>שתפו קישור</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headline: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 12,
  },
  benefits: {
    gap: 8,
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
    marginBottom: 12,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareBtnPressed: {
    opacity: 0.8,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
