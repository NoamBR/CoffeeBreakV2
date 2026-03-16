import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { X, Camera } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  onScan: (data: string) => void;
  onClose: () => void;
};

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const colors = useThemeColors();
  const [scanned, setScanned] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const lastScan = useRef('');
  const CameraViewRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const cam = require('expo-camera');
        CameraViewRef.current = cam.CameraView;
        const { status } = await cam.Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        setCameraAvailable(true);
      } catch {
        setCameraAvailable(false);
      }
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || data === lastScan.current) return;
    setScanned(true);
    lastScan.current = data;
    onScan(data);
  };

  // Camera not available (web or missing module)
  if (!cameraAvailable || Platform.OS === 'web') {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Camera size={48} color={colors.textSecondary} />
        <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
          מצלמה לא זמינה
        </Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          השתמשו בהקלדת קוד ידנית
        </Text>
        <Pressable style={styles.closeTextBtn} onPress={onClose}>
          <Text style={[styles.closeTextBtnText, { color: colors.accent }]}>חזרה</Text>
        </Pressable>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          טוען מצלמה...
        </Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Camera size={48} color={colors.primary} />
        <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
          נדרשת גישה למצלמה
        </Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          כדי לסרוק קודי QR של קופונים, יש לאשר גישה למצלמה
        </Text>
        <Pressable style={styles.closeTextBtn} onPress={onClose}>
          <Text style={[styles.closeTextBtnText, { color: colors.textSecondary }]}>ביטול</Text>
        </Pressable>
      </View>
    );
  }

  const CameraViewComponent = CameraViewRef.current;
  if (!CameraViewComponent) {
    onClose();
    return null;
  }

  return (
    <View style={styles.container}>
      <CameraViewComponent
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Targeting overlay */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.targetBox}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.hintText}>כוונו את המצלמה לקוד QR של הקופון</Text>
          {scanned && (
            <Pressable
              style={styles.rescanBtn}
              onPress={() => {
                setScanned(false);
                lastScan.current = '';
              }}
            >
              <Text style={styles.rescanBtnText}>סרוק שוב</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Close button */}
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <X size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const SCAN_BOX_SIZE = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  closeTextBtn: {
    paddingVertical: 12,
  },
  closeTextBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_BOX_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  targetBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 32,
    gap: 16,
  },
  hintText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  rescanBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  rescanBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
