import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { MapPin, Phone, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import storeInfo from '@/data/storeInfo';

export default function StoreStatus() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { isOpen, statusText } = useStoreStatus();

  const openWaze = () => {
    const url = `https://waze.com/ul?ll=${storeInfo.latitude},${storeInfo.longitude}&navigate=yes`;
    Linking.openURL(url);
  };

  const callStore = () => {
    Linking.openURL(`tel:${storeInfo.phone}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Clock size={16} color={isOpen ? colors.success : colors.error} />
        <View style={[styles.dot, isOpen ? styles.dotOpen : styles.dotClosed]} />
        <Text style={[styles.statusText, isOpen ? styles.openText : styles.closedText]}>
          {statusText}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={openWaze}>
          <MapPin size={18} color={colors.primary} />
          <Text style={styles.actionText}>נווט אלינו</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={callStore}>
          <Phone size={18} color={colors.primary} />
          <Text style={styles.actionText}>התקשרו</Text>
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'flex-end',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOpen: {
    backgroundColor: colors.success,
  },
  dotClosed: {
    backgroundColor: colors.error,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openText: {
    color: colors.success,
  },
  closedText: {
    color: colors.error,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accentLight,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
