import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays, isSameDay, startOfWeek, isToday, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { bookingsApi, Booking } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { BOOKING_STATUS_COLORS } from '../../types';

export default function BookingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['bookings', formattedDate],
    queryFn: async () => {
      const params: any = { date: formattedDate };
      if (user?.showroomId) {
        params.showroomId = user.showroomId;
      }
      const response = await bookingsApi.getAll(params);
      return response.data as Booking[];
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert('Success', 'Booking marked as complete');
    },
    onError: () => Alert.alert('Error', 'Failed to complete booking'),
  });

  const noShowMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.markNoShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert('Success', 'Booking marked as no-show');
    },
    onError: () => Alert.alert('Error', 'Failed to mark as no-show'),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleComplete = (booking: Booking) => {
    Alert.alert(
      'Complete Booking',
      `Mark ${booking.customer.firstName}'s test drive as complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => completeMutation.mutate(booking.id) },
      ]
    );
  };

  const handleNoShow = (booking: Booking) => {
    Alert.alert(
      'No Show',
      `Mark ${booking.customer.firstName} as no-show?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'No Show', style: 'destructive', onPress: () => noShowMutation.mutate(booking.id) },
      ]
    );
  };

  // Generate week days for horizontal scroll (3 days before and 7 days after selected)
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 7; i++) {
      days.push(addDays(new Date(), i));
    }
    return days;
  }, []);

  // Generate calendar grid for the modal
  const calendarDays = useMemo(() => {
    const start = startOfWeek(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1));
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [calendarMonth]);

  const renderBooking = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => router.push(`/booking/${item.id}`)}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.time}>{item.startTime} - {item.endTime}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: BOOKING_STATUS_COLORS[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: BOOKING_STATUS_COLORS[item.status] }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>
          {item.customer.firstName} {item.customer.lastName}
        </Text>
        <Text style={styles.customerPhone}>{item.customer.phone}</Text>
      </View>

      <View style={styles.carInfo}>
        <Ionicons name="car-sport-outline" size={16} color="#666" />
        <Text style={styles.carText}>
          {item.carUnit.carModel.brand} {item.carUnit.carModel.model}
        </Text>
        {item.carUnit.color && (
          <Text style={styles.carColor}>• {item.carUnit.color}</Text>
        )}
      </View>

      {item.status === 'CONFIRMED' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleComplete(item)}
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.noShowButton]}
            onPress={() => handleNoShow(item)}
          >
            <Ionicons name="close-circle" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>No Show</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const confirmedBookings = bookings?.filter(b => b.status === 'CONFIRMED') || [];
  const otherBookings = bookings?.filter(b => b.status !== 'CONFIRMED') || [];
  const sortedBookings = [...confirmedBookings, ...otherBookings];

  return (
    <View style={styles.container}>
      {/* Header with Date */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>
            {isToday(selectedDate) ? "Today's Bookings" : 'Bookings'}
          </Text>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar" size={24} color="#0066cc" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerDate}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Text>
      </View>

      {/* Horizontal Day Selector */}
      <View style={styles.daySelector}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorContent}
        >
          {weekDays.map((day, index) => {
            const isSelected = isSameDay(day, selectedDate);
            const dayIsToday = isToday(day);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayItem,
                  isSelected && styles.dayItemSelected,
                  dayIsToday && !isSelected && styles.dayItemToday,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[
                  styles.dayName,
                  isSelected && styles.dayTextSelected,
                ]}>
                  {format(day, 'EEE')}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  isSelected && styles.dayTextSelected,
                  dayIsToday && !isSelected && styles.dayNumberToday,
                ]}>
                  {format(day, 'd')}
                </Text>
                {dayIsToday && (
                  <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Bookings List */}
      {sortedBookings.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            No bookings for {isToday(selectedDate) ? 'today' : format(selectedDate, 'MMM d')}
          </Text>
          <TouchableOpacity
            style={styles.goToTodayButton}
            onPress={() => setSelectedDate(new Date())}
          >
            <Text style={styles.goToTodayText}>Go to Today</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedBookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              >
                <Ionicons name="chevron-back" size={24} color="#0066cc" />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {format(calendarMonth, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity
                onPress={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              >
                <Ionicons name="chevron-forward" size={24} color="#0066cc" />
              </TouchableOpacity>
            </View>

            {/* Day Labels */}
            <View style={styles.dayLabels}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.dayLabel}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                const isSelected = isSameDay(day, selectedDate);
                const dayIsToday = isToday(day);

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                      dayIsToday && !isSelected && styles.calendarDayToday,
                    ]}
                    onPress={() => {
                      setSelectedDate(day);
                      setShowCalendar(false);
                    }}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      !isCurrentMonth && styles.calendarDayTextOther,
                      isSelected && styles.calendarDayTextSelected,
                      dayIsToday && !isSelected && styles.calendarDayTextToday,
                    ]}>
                      {format(day, 'd')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  setSelectedDate(new Date());
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.quickActionText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  setSelectedDate(addDays(new Date(), 1));
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.quickActionText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  setSelectedDate(addDays(new Date(), 7));
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.quickActionText}>Next Week</Text>
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
  header: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  calendarButton: {
    padding: 8,
  },
  headerDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  daySelector: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  daySelectorContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dayItem: {
    width: 52,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 4,
  },
  dayItemSelected: {
    backgroundColor: '#0066cc',
  },
  dayItemToday: {
    backgroundColor: '#e6f0ff',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayNumberToday: {
    color: '#0066cc',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0066cc',
    marginTop: 4,
  },
  todayDotSelected: {
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerInfo: {
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carText: {
    fontSize: 14,
    color: '#666',
  },
  carColor: {
    fontSize: 14,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  completeButton: {
    backgroundColor: '#22c55e',
  },
  noShowButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  goToTodayButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0066cc',
    borderRadius: 8,
  },
  goToTodayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dayLabels: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySelected: {
    backgroundColor: '#0066cc',
    borderRadius: 20,
  },
  calendarDayToday: {
    backgroundColor: '#e6f0ff',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  calendarDayTextOther: {
    color: '#ccc',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarDayTextToday: {
    color: '#0066cc',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  quickAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  quickActionText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
});
