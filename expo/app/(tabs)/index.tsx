import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Coffee, Bell } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore } from '@/stores/userStore';
import { useInAppNotificationsStore } from '@/stores/inAppNotificationsStore';
import LoyaltyCard from '@/components/LoyaltyCard';
import HeroBanner from '@/components/HeroBanner';
import StoreStatus from '@/components/StoreStatus';
import StreakWidget from '@/components/StreakWidget';
import YourUsualWidget from '@/components/YourUsualWidget';
import TierBadge from '@/components/TierBadge';
import QuickStatsWidget from '@/components/QuickStatsWidget';
import storeInfo from '@/data/storeInfo';
import type { ColorScheme } from '@/constants/colors';

export default function HomeScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { user } = useUserStore();
  const router = useRouter();
  const customerNotifs = useInAppNotificationsStore((s) => s.customerNotifications);
  const customerUnread = customerNotifs.filter((n) => !n.read).length;
  const markAllRead = useInAppNotificationsStore((s) => s.markAllRead);
  const latestUnread = customerNotifs.find((n) => !n.read);

  const greeting = getGreeting();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Tier Badge */}
        <LinearGradient
          colors={colors.headerGradient}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <View style={styles.logoRow}>
                <Coffee size={28} color={colors.white} />
                <Text style={styles.logoText}>{storeInfo.nameHe}</Text>
              </View>
              <Text style={styles.greeting}>
                {greeting}{user?.name ? `, ${user.name}` : ''}!
              </Text>
              <Text style={styles.welcomeSub}>שמחים לראות אותך שוב</Text>
              <View style={styles.tierRow}>
                <TierBadge size="small" />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Customer Notification Banner */}
        {latestUnread && (
          <Pressable
            style={styles.notifBanner}
            onPress={() => markAllRead('customer')}
          >
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>{latestUnread.title}</Text>
              <Text style={styles.notifBody} numberOfLines={1}>{latestUnread.body}</Text>
            </View>
            <View style={styles.notifIcon}>
              <Bell size={20} color={colors.white} />
              {customerUnread > 1 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{customerUnread}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}

        {/* 1. Your Usual — HERO position */}
        <View style={styles.section}>
          <YourUsualWidget />
        </View>

        {/* 2. Loyalty Card Widget */}
        <View style={styles.section}>
          <Pressable onPress={() => router.push('/(tabs)/loyalty')}>
            <LoyaltyCard compact />
          </Pressable>
        </View>

        {/* 3. Daily Streak */}
        <View style={styles.section}>
          <StreakWidget />
        </View>

        {/* 4. Quick Menu CTA */}
        <View style={styles.section}>
          <Pressable
            style={styles.menuCta}
            onPress={() => router.push('/(tabs)/menu')}
          >
            <Text style={styles.menuCtaText}>לתפריט המלא</Text>
            <Coffee size={20} color={colors.white} />
          </Pressable>
        </View>

        {/* 5. Promo Banner */}
        <View style={styles.sectionNopad}>
          <Text style={styles.sectionTitle}>מבצעים חמים</Text>
          <HeroBanner />
        </View>

        {/* 6. Store Status */}
        <View style={styles.section}>
          <StoreStatus />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 17) return 'צהריים טובים';
  if (hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'flex-end',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'right',
  },
  welcomeSub: {
    fontSize: 14,
    color: colors.gold,
    textAlign: 'right',
    marginTop: 2,
  },
  tierRow: {
    marginTop: 10,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  sectionNopad: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  menuCta: {
    backgroundColor: colors.highlight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  menuCtaText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  bottomSpacer: {
    height: 20,
  },
  // Notification banner
  notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  notifIcon: {
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
  },
  notifContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  notifBody: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
