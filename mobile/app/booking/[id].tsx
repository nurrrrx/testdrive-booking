import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { bookingsApi, Booking } from '../../lib/api';
import { BOOKING_STATUS_COLORS } from '../../types';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response = await bookingsApi.getById(id!);
      return response.data as Booking;
    },
    enabled: !!id,
  });

  const completeMutation = useMutation({
    mutationFn: () => bookingsApi.complete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      Alert.alert('Success', 'Booking marked as complete');
    },
    onError: () => Alert.alert('Error', 'Failed to complete booking'),
  });

  const noShowMutation = useMutation({
    mutationFn: () => bookingsApi.markNoShow(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      Alert.alert('Success', 'Booking marked as no-show');
    },
    onError: () => Alert.alert('Error', 'Failed to mark as no-show'),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => bookingsApi.cancel(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      Alert.alert('Success', 'Booking cancelled');
      router.back();
    },
    onError: () => Alert.alert('Error', 'Failed to cancel booking'),
  });

  const handleCall = () => {
    if (booking?.customer.phone) {
      Linking.openURL(`tel:${booking.customer.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (booking?.customer.phone) {
      // Remove any non-digit characters
      let phone = booking.customer.phone.replace(/\D/g, '');
      // If phone starts with 0, replace with UAE country code 971
      if (phone.startsWith('0')) {
        phone = '971' + phone.substring(1);
      }
      // If phone doesn't start with country code, add UAE code
      if (!phone.startsWith('971') && phone.length <= 10) {
        phone = '971' + phone;
      }
      const message = `Hi ${booking.customer.firstName}, this is regarding your test drive booking (Ref: ${booking.referenceNumber}) scheduled for ${format(new Date(booking.date), 'MMMM d')} at ${booking.startTime}.`;
      Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ]
    );
  };

  if (isLoading || !booking) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Reference & Status */}
      <View style={styles.headerCard}>
        <View style={styles.refContainer}>
          <Text style={styles.refLabel}>Reference</Text>
          <Text style={styles.refNumber}>{booking.referenceNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: BOOKING_STATUS_COLORS[booking.status] }]}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>

      {/* Date & Time */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Schedule</Text>
        <View style={styles.scheduleRow}>
          <Ionicons name="calendar-outline" size={20} color="#0066cc" />
          <View>
            <Text style={styles.scheduleDate}>
              {format(new Date(booking.date), 'EEEE, MMMM d, yyyy')}
            </Text>
            <Text style={styles.scheduleTime}>
              {booking.startTime} - {booking.endTime}
            </Text>
          </View>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer</Text>
        <View style={styles.customerRow}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>
              {booking.customer.firstName?.[0]}
            </Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {booking.customer.firstName} {booking.customer.lastName}
            </Text>
            <TouchableOpacity onPress={handleCall}>
              <Text style={styles.customerPhoneClickable}>{booking.customer.phone}</Text>
            </TouchableOpacity>
            {booking.customer.email && (
              <Text style={styles.customerEmail}>{booking.customer.email}</Text>
            )}
          </View>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Car Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vehicle</Text>
        <View style={styles.carInfo}>
          <Ionicons name="car-sport" size={32} color="#0066cc" />
          <View style={styles.carDetails}>
            <Text style={styles.carName}>
              {booking.carUnit.carModel.brand} {booking.carUnit.carModel.model}
            </Text>
            <Text style={styles.carMeta}>
              {booking.carUnit.carModel.year} • {booking.carUnit.carModel.variant}
            </Text>
            {booking.carUnit.color && (
              <Text style={styles.carColor}>Color: {booking.carUnit.color}</Text>
            )}
            {booking.carUnit.vin && (
              <Text style={styles.carVin}>VIN: {booking.carUnit.vin}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Showroom */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Showroom</Text>
        <View style={styles.showroomInfo}>
          <Ionicons name="location" size={20} color="#666" />
          <View>
            <Text style={styles.showroomName}>{booking.showroom.name}</Text>
            <Text style={styles.showroomAddress}>{booking.showroom.address}</Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      {booking.notes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.notes}>{booking.notes}</Text>
        </View>
      )}

      {/* Actions */}
      {booking.status === 'CONFIRMED' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.noShowButton]}
            onPress={() => noShowMutation.mutate()}
            disabled={noShowMutation.isPending}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>No Show</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancel}
            disabled={cancelMutation.isPending}
          >
            <Ionicons name="ban" size={20} color="#ef4444" />
            <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
  },
  refContainer: {},
  refLabel: {
    fontSize: 12,
    color: '#666',
  },
  refNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  scheduleDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  customerPhoneClickable: {
    fontSize: 14,
    color: '#0066cc',
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  whatsappButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  carDetails: {
    flex: 1,
  },
  carName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  carMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  carColor: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  carVin: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  showroomInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  showroomName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  showroomAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsContainer: {
    padding: 16,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  completeButton: {
    backgroundColor: '#22c55e',
  },
  noShowButton: {
    backgroundColor: '#f97316',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  spacer: {
    height: 32,
  },
});
