import { View, Text, StyleSheet } from 'react-native';

let QRCodeSvg: any = null;
try { QRCodeSvg = require('react-native-qrcode-svg').default; } catch {}

type Props = {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
};

export default function QRCode({ value, size = 200, backgroundColor = '#FFFFFF', color = '#000000' }: Props) {
  if (!QRCodeSvg) {
    // Fallback: show barcode as text if QR lib unavailable
    return (
      <View style={[styles.container, styles.fallback, { backgroundColor }]}>
        <Text style={[styles.fallbackText, { color }]}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <QRCodeSvg
        value={value}
        size={size}
        backgroundColor={backgroundColor}
        color={color}
        ecl="M"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
  },
  fallback: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
});
