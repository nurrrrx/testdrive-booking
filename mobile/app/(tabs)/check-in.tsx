import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Vibration,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { carsApi, CarUnit, CheckInRecord, showroomsApi, Showroom } from '../../lib/api';
import { CHECK_IN_TYPE_LABELS, STATUS_COLORS, CheckInType } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.75;

export default function CheckInScreen() {
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerActive, setScannerActive] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarUnit | null>(null);
  const [selectedType, setSelectedType] = useState<CheckInType | null>(null);
  const [notes, setNotes] = useState('');
  const [toShowroomId, setToShowroomId] = useState<string | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  const { data: showrooms } = useQuery({
    queryKey: ['showrooms'],
    queryFn: async () => {
      const response = await showroomsApi.getAll();
      return response.data as Showroom[];
    },
  });

  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ['checkInHistory'],
    queryFn: async () => {
      const response = await carsApi.getCheckInHistory({ limit: 5 });
      return response.data as CheckInRecord[];
    },
  });

  const searchMutation = useMutation({
    mutationFn: (vin: string) => carsApi.getUnitByVin(vin),
    onSuccess: (response) => {
      setSelectedCar(response.data as CarUnit);
      setScannerActive(false);
      Vibration.vibrate(100);
    },
    onError: () => {
      Alert.alert('Not Found', 'No car found with this VIN. Please try again.');
      lastScannedRef.current = null;
      setScannedData(null);
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (data: { carUnitId: string; type: CheckInType; notes?: string; toShowroomId?: string }) =>
      carsApi.checkIn(data),
    onSuccess: () => {
      Vibration.vibrate([0, 100, 50, 100]);
      Alert.alert('Success! ✓', 'Check-in recorded successfully', [
        { text: 'OK', onPress: resetForm }
      ]);
      queryClient.invalidateQueries({ queryKey: ['checkInHistory'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to record check-in');
    },
  });

  const resetForm = () => {
    setSelectedCar(null);
    setSelectedType(null);
    setNotes('');
    setManualInput('');
    setToShowroomId(null);
    setScannedData(null);
    lastScannedRef.current = null;
    setScannerActive(true);
    refetchHistory();
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    const { data } = result;
    // Prevent multiple scans of the same code
    if (data && data !== lastScannedRef.current && !searchMutation.isPending) {
      lastScannedRef.current = data;
      setScannedData(data.toUpperCase());
      searchMutation.mutate(data.toUpperCase());
    }
  };

  const handleManualSearch = () => {
    if (manualInput.trim()) {
      searchMutation.mutate(manualInput.trim().toUpperCase());
      setShowManualInput(false);
    }
  };

  const handleCheckIn = () => {
    if (!selectedCar || !selectedType) {
      Alert.alert('Error', 'Please select an action type');
      return;
    }

    if (selectedType === 'SENT_OUT' && !toShowroomId) {
      Alert.alert('Error', 'Please select destination showroom');
      return;
    }

    checkInMutation.mutate({
      carUnitId: selectedCar.id,
      type: selectedType,
      notes: notes || undefined,
      toShowroomId: selectedType === 'SENT_OUT' ? toShowroomId! : undefined,
    });
  };

  const checkInTypes: { type: CheckInType; icon: keyof typeof Ionicons.glyphMap; color: string; label: string }[] = [
    { type: 'RECEIVED', icon: 'arrow-down-circle', color: '#22c55e', label: 'Receive' },
    { type: 'SENT_OUT', icon: 'arrow-up-circle', color: '#a855f7', label: 'Send Out' },
    { type: 'RETURNED', icon: 'refresh-circle', color: '#3b82f6', label: 'Returned' },
    { type: 'OUT_FOR_DRIVE', icon: 'car-sport', color: '#f97316', label: 'Test Drive' },
  ];

  // Permission not determined yet
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera" size={64} color="#0066cc" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            To scan VIN barcodes, please allow camera access
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualEntryLink}
            onPress={() => setShowManualInput(true)}
          >
            <Text style={styles.manualEntryLinkText}>Or enter VIN manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Car selected - show action form
  if (selectedCar) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Car Info Card */}
        <View style={styles.carCard}>
          <View style={styles.carIconContainer}>
            <Ionicons name="car-sport" size={40} color="#0066cc" />
          </View>
          <Text style={styles.carBrand}>{selectedCar.carModel.brand}</Text>
          <Text style={styles.carModel}>{selectedCar.carModel.model}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedCar.status] }]}>
            <Text style={styles.statusBadgeText}>{selectedCar.status.replace(/_/g, ' ')}</Text>
          </View>

          <View style={styles.carDetailsRow}>
            <View style={styles.carDetailItem}>
              <Text style={styles.carDetailLabel}>VIN</Text>
              <Text style={styles.carDetailValue}>{selectedCar.vin}</Text>
            </View>
            <View style={styles.carDetailItem}>
              <Text style={styles.carDetailLabel}>Color</Text>
              <Text style={styles.carDetailValue}>{selectedCar.color || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.locationText}>{selectedCar.showroom.name}</Text>
          </View>
        </View>

        {/* Action Selection */}
        <Text style={styles.sectionTitle}>Select Action</Text>
        <View style={styles.actionGrid}>
          {checkInTypes.map(({ type, icon, color, label }) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.actionButton,
                selectedType === type && { backgroundColor: color, borderColor: color },
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Ionicons
                name={icon}
                size={28}
                color={selectedType === type ? '#fff' : color}
              />
              <Text style={[
                styles.actionButtonText,
                selectedType === type && { color: '#fff' },
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Destination Showroom */}
        {selectedType === 'SENT_OUT' && showrooms && (
          <View style={styles.showroomSection}>
            <Text style={styles.sectionTitle}>Destination Showroom</Text>
            {showrooms
              .filter((s) => s.id !== selectedCar.showroom.id)
              .map((showroom) => (
                <TouchableOpacity
                  key={showroom.id}
                  style={[
                    styles.showroomOption,
                    toShowroomId === showroom.id && styles.showroomOptionSelected,
                  ]}
                  onPress={() => setToShowroomId(showroom.id)}
                >
                  <Ionicons
                    name={toShowroomId === showroom.id ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={toShowroomId === showroom.id ? '#0066cc' : '#999'}
                  />
                  <Text style={[
                    styles.showroomOptionText,
                    toShowroomId === showroom.id && styles.showroomOptionTextSelected,
                  ]}>
                    {showroom.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Notes */}
        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add any notes about this check-in..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Action Buttons */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedType || checkInMutation.isPending) && styles.submitButtonDisabled,
          ]}
          onPress={handleCheckIn}
          disabled={!selectedType || checkInMutation.isPending}
        >
          {checkInMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.submitButtonText}>Confirm Check-In</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
          <Text style={styles.cancelButtonText}>Scan Another Car</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Main Scanner View
  return (
    <View style={styles.scannerContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['code128', 'code39', 'qr', 'ean13', 'ean8', 'codabar'],
        }}
        onBarcodeScanned={scannerActive ? handleBarCodeScanned : undefined}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top section */}
        <View style={styles.overlayTop}>
          <Text style={styles.scanTitle}>Scan VIN Barcode</Text>
          <Text style={styles.scanSubtitle}>Position the barcode within the frame</Text>
        </View>

        {/* Middle section with scan area */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanArea}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Scanning indicator */}
            {searchMutation.isPending && (
              <View style={styles.scanningIndicator}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.scanningText}>Looking up VIN...</Text>
              </View>
            )}
          </View>
          <View style={styles.overlaySide} />
        </View>

        {/* Bottom section */}
        <View style={styles.overlayBottom}>
          {scannedData && (
            <View style={styles.scannedDataBox}>
              <Text style={styles.scannedDataLabel}>Scanned:</Text>
              <Text style={styles.scannedDataValue}>{scannedData}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setShowManualInput(true)}
          >
            <Ionicons name="keypad" size={20} color="#fff" />
            <Text style={styles.manualButtonText}>Enter VIN Manually</Text>
          </TouchableOpacity>

          {/* Recent History */}
          {history && history.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent Check-ins</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {history.map((record) => (
                  <View key={record.id} style={styles.recentItem}>
                    <Text style={styles.recentItemCar}>
                      {record.carUnit.carModel.brand} {record.carUnit.carModel.model}
                    </Text>
                    <Text style={styles.recentItemType}>
                      {CHECK_IN_TYPE_LABELS[record.type]}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter VIN Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., JTJHY7AX5L00001"
              value={manualInput}
              onChangeText={setManualInput}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowManualInput(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSearchButton, !manualInput.trim() && styles.modalSearchButtonDisabled]}
                onPress={handleManualSearch}
                disabled={!manualInput.trim() || searchMutation.isPending}
              >
                {searchMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSearchText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },

  // Permission styles
  permissionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    maxWidth: 320,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manualEntryLink: {
    marginTop: 16,
  },
  manualEntryLinkText: {
    color: '#0066cc',
    fontSize: 14,
  },

  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  scanTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scanSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#0066cc',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanningIndicator: {
    alignItems: 'center',
  },
  scanningText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  overlayBottom: {
    flex: 1.5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  scannedDataBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  scannedDataLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  scannedDataValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  recentSection: {
    marginTop: 24,
  },
  recentTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentItem: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    minWidth: 140,
  },
  recentItemCar: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  recentItemType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSearchButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0066cc',
    alignItems: 'center',
  },
  modalSearchButtonDisabled: {
    backgroundColor: '#99c2e8',
  },
  modalSearchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Car card styles
  carCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  carIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e6f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  carBrand: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  carModel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  carDetailsRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
  },
  carDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  carDetailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  carDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },

  // Action styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    width: (SCREEN_WIDTH - 44) / 2,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  showroomSection: {
    marginBottom: 24,
  },
  showroomOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
    gap: 12,
  },
  showroomOptionSelected: {
    backgroundColor: '#e6f0ff',
  },
  showroomOptionText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  showroomOptionTextSelected: {
    fontWeight: '600',
    color: '#0066cc',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#99c2e8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#0066cc',
    fontSize: 15,
    fontWeight: '500',
  },
});
