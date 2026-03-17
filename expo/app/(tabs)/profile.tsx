import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert, TextInput, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Coffee, Phone, Instagram, LogOut, ChevronLeft, Heart, Leaf, Users, Navigation, Facebook, Clock, ClipboardList, Lock, X, Moon } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserStore } from '@/stores/userStore';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useAdminStore } from '@/stores/adminStore';
import storeInfo, { brandStory } from '@/data/storeInfo';
import TierBadge from '@/components/TierBadge';
import AmbassadorWidget from '@/components/AmbassadorWidget';
import type { ColorScheme } from '@/constants/colors';

const VALUE_ICONS = {
  heart: Heart,
  leaf: Leaf,
  users: Users,
} as const;

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const themePreference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const isDark = themePreference === 'dark';
  const { user, reset: resetUser } = useUserStore();
  const { totalRewards } = useLoyaltyStore();
  const { authenticateStaff, isLoading: staffLoading, loginError } = useAdminStore();
  const [staffLoginVisible, setStaffLoginVisible] = useState(false);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const handleStaffLongPress = () => {
    setStaffEmail('');
    setStaffPassword('');
    setStaffLoginVisible(true);
  };

  const handleStaffLoginSubmit = async () => {
    if (!staffEmail || !staffPassword) return;
    const success = await authenticateStaff(staffEmail, staffPassword);
    if (success) {
      setStaffLoginVisible(false);
      setStaffEmail('');
      setStaffPassword('');
      const role = useAdminStore.getState().currentRole;
      setTimeout(() => router.push(role === 'manager' ? '/admin' : '/worker'), 100);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'התנתקות',
      'האם אתה בטוח שברצונך להתנתק? כל הנתונים יימחקו.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'התנתק',
          style: 'destructive',
          onPress: () => resetUser(),
        },
      ]
    );
  };

  const initials = user?.name ? user.name.slice(0, 2) : '?';

  return (
    <View style={styles.wrapper}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Header */}
        <LinearGradient
          colors={colors.headerGradient}
          style={styles.heroGradient}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.heroContent}>
              <Pressable onLongPress={handleStaffLongPress} delayLongPress={3000} style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </Pressable>

              <Text style={styles.userName}>{user?.name ?? 'אורח'}</Text>

              <TierBadge />

              {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
              {user?.joinedAt && (
                <Text style={styles.userSince}>
                  לקוח מאז {new Date(user.joinedAt).toLocaleDateString('he-IL')}
                </Text>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user?.totalCoffees ?? 0}</Text>
                  <Text style={styles.statLabel}>כוסות קפה</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalRewards}</Text>
                  <Text style={styles.statLabel}>מתנות</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {/* Order History Link */}
          <Pressable
            style={styles.orderHistoryRow}
            onPress={() => router.push('/order-history')}
          >
            <ChevronLeft size={16} color={colors.inactive} />
            <View style={styles.orderHistoryInfo}>
              <Text style={styles.orderHistoryLabel}>היסטוריית הזמנות</Text>
              <Text style={styles.orderHistoryDesc}>צפייה בהזמנות קודמות והזמנה חוזרת</Text>
            </View>
            <View style={styles.orderHistoryIcon}>
              <ClipboardList size={20} color={colors.accent} />
            </View>
          </Pressable>

          {/* Dark Mode Toggle */}
          <View style={styles.themeRow}>
            <Switch
              value={isDark}
              onValueChange={(v) => setPreference(v ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
            <View style={styles.themeInfo}>
              <Text style={styles.themeLabel}>מצב כהה</Text>
            </View>
            <View style={styles.themeIconWrap}>
              <Moon size={20} color={colors.accent} />
            </View>
          </View>

          {/* Referral Widget */}
          <AmbassadorWidget />

          {/* Brand Story */}
          <View style={styles.storyCard}>
            <View style={styles.storyHeader}>
              <Coffee size={20} color={colors.accent} />
              <Text style={styles.storyHeadline}>{brandStory.headline}</Text>
            </View>
            <Text style={styles.storyText}>{brandStory.text}</Text>
          </View>

          {/* Values */}
          <Text style={styles.sectionTitle}>מה מנחה אותנו</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.valuesScroll}
          >
            {brandStory.values.map((value, index) => {
              const Icon = VALUE_ICONS[value.icon];
              return (
                <View key={index} style={styles.valueCard}>
                  <View style={styles.valueIconWrap}>
                    <Icon size={22} color={colors.accent} />
                  </View>
                  <Text style={styles.valueTitle}>{value.title}</Text>
                  <Text style={styles.valueDescription} numberOfLines={3}>{value.description}</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Contact */}
          <Text style={styles.sectionTitle}>בואו לבקר אותנו</Text>
          <View style={styles.contactCard}>
            <Pressable
              style={styles.contactRow}
              onPress={() =>
                Linking.openURL(
                  `https://waze.com/ul?ll=${storeInfo.latitude},${storeInfo.longitude}&navigate=yes`
                )
              }
            >
              <ChevronLeft size={16} color={colors.inactive} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>נווטו אלינו</Text>
                <Text style={styles.contactValue}>{storeInfo.address}</Text>
              </View>
              <View style={styles.contactIconWrap}>
                <Navigation size={20} color={colors.accent} />
              </View>
            </Pressable>

            <Pressable
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${storeInfo.phone}`)}
            >
              <ChevronLeft size={16} color={colors.inactive} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>דברו איתנו</Text>
                <Text style={styles.contactValue}>{storeInfo.phone}</Text>
              </View>
              <View style={styles.contactIconWrap}>
                <Phone size={20} color={colors.accent} />
              </View>
            </Pressable>

            {storeInfo.instagram && (
              <Pressable
                style={styles.contactRow}
                onPress={() =>
                  Linking.openURL(`https://instagram.com/${storeInfo.instagram}`)
                }
              >
                <ChevronLeft size={16} color={colors.inactive} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>עקבו אחרינו</Text>
                  <Text style={styles.contactValue}>@{storeInfo.instagram}</Text>
                </View>
                <View style={styles.contactIconWrap}>
                  <Instagram size={20} color={colors.accent} />
                </View>
              </Pressable>
            )}

            {storeInfo.facebook && (
              <Pressable
                style={[styles.contactRow, { borderBottomWidth: 0 }]}
                onPress={() =>
                  Linking.openURL(`https://facebook.com/${storeInfo.facebook}`)
                }
              >
                <ChevronLeft size={16} color={colors.inactive} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>הצטרפו לקהילה</Text>
                  <Text style={styles.contactValue}>{storeInfo.facebook}</Text>
                </View>
                <View style={styles.contactIconWrap}>
                  <Facebook size={20} color={colors.accent} />
                </View>
              </Pressable>
            )}
          </View>

          {/* Hours */}
          <View style={styles.hoursChip}>
            <Clock size={16} color={colors.success} />
            <Text style={styles.hoursChipText}>פתוח 24/7</Text>
          </View>

          {/* Logout */}
          {user && (
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={18} color={colors.error} />
              <Text style={styles.logoutText}>התנתק ומחק נתונים</Text>
            </Pressable>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Staff Login Modal — Email/Password (Supabase Auth) */}
      <Modal visible={staffLoginVisible} transparent animationType="fade" onRequestClose={() => setStaffLoginVisible(false)}>
        <View style={styles.adminOverlay}>
          <View style={styles.adminModal}>
            <Pressable style={styles.adminClose} onPress={() => setStaffLoginVisible(false)}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>

            <Lock size={36} color={colors.textPrimary} />
            <Text style={styles.adminTitle}>כניסת צוות</Text>

            <TextInput
              style={styles.adminEmailInput}
              value={staffEmail}
              onChangeText={setStaffEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="אימייל"
              placeholderTextColor={colors.inactive}
              textAlign="right"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextInput
              ref={passwordRef}
              style={styles.adminEmailInput}
              value={staffPassword}
              onChangeText={setStaffPassword}
              secureTextEntry
              placeholder="סיסמה"
              placeholderTextColor={colors.inactive}
              textAlign="right"
              returnKeyType="go"
              onSubmitEditing={handleStaffLoginSubmit}
            />

            {loginError ? (
              <Text style={{ fontSize: 13, color: colors.error, textAlign: 'center' }}>{loginError}</Text>
            ) : null}

            <Pressable
              style={[styles.adminSubmitBtn, (!staffEmail || !staffPassword || staffLoading) && { opacity: 0.4 }]}
              onPress={handleStaffLoginSubmit}
              disabled={!staffEmail || !staffPassword || staffLoading}
            >
              <Text style={styles.adminSubmitText}>{staffLoading ? 'מתחבר...' : 'כניסה'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Hero Header
  heroGradient: {
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
  },
  userPhone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
  userSince: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Body
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // Order History
  orderHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
  },
  orderHistoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderHistoryInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  orderHistoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  orderHistoryDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Dark Mode Toggle
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 8,
    marginBottom: 4,
  },
  themeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Brand Story
  storyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  storyHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  storyText: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'right',
  },

  // Values
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    marginTop: 24,
    marginBottom: 12,
  },
  valuesScroll: {
    gap: 12,
    paddingRight: 0,
  },
  valueCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    width: 160,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  valueIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 4,
  },
  valueDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'right',
  },

  // Contact
  contactCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  contactValue: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Hours chip
  hoursChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  hoursChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.success,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  bottomSpacer: {
    height: 40,
  },

  // Admin PIN Modal
  adminOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  adminModal: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  adminClose: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 4,
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  adminEmailInput: {
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: colors.border,
  },
  adminSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  adminSubmitText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
});
