import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, startOfWeek, isSameDay, isToday, startOfMonth, endOfMonth, isBefore, startOfDay } from 'date-fns';
import { schedulingApi, SalesExecSchedule } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00',
];

export default function MyScheduleScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState('18:00');
  const [refreshing, setRefreshing] = useState(false);

  const monthStart = format(startOfMonth(calendarMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(calendarMonth), 'yyyy-MM-dd');

  const { data: schedule, refetch } = useQuery({
    queryKey: ['my-schedule', monthStart, monthEnd],
    queryFn: async () => {
      const response = await schedulingApi.getMySchedule(monthStart, monthEnd);
      return response.data as SalesExecSchedule[];
    },
  });

  const setAvailabilityMutation = useMutation({
    mutationFn: (data: { date: string; availableFrom: string; availableTo: string }) =>
      schedulingApi.setAvailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-schedule'] });
      Alert.alert('Success', 'Availability set successfully');
      setShowTimeModal(false);
    },
    onError: () => Alert.alert('Error', 'Failed to set availability'),
  });

  const removeAvailabilityMutation = useMutation({
    mutationFn: (date: string) => schedulingApi.removeAvailability({ date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-schedule'] });
      Alert.alert('Success', 'Availability removed');
    },
    onError: () => Alert.alert('Error', 'Failed to remove availability'),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Get schedule for a specific date
  const getScheduleForDate = (date: Date): SalesExecSchedule | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedule?.find(s => s.date.startsWith(dateStr));
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1));
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [calendarMonth]);

  const selectedSchedule = getScheduleForDate(selectedDate);
  const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(new Date()));

  const handleSetAvailability = () => {
    if (isPastDate) {
      Alert.alert('Error', 'Cannot set availability for past dates');
      return;
    }
    setShowTimeModal(true);
  };

  const handleConfirmAvailability = () => {
    setAvailabilityMutation.mutate({
      date: format(selectedDate, 'yyyy-MM-dd'),
      availableFrom: selectedStartTime,
      availableTo: selectedEndTime,
    });
  };

  const handleRemoveAvailability = () => {
    Alert.alert(
      'Remove Availability',
      'Are you sure you want to mark this day as not working?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeAvailabilityMutation.mutate(format(selectedDate, 'yyyy-MM-dd')),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
          >
            <Ionicons name="chevron-back" size={28} color="#0066cc" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{format(calendarMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity
            onPress={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
          >
            <Ionicons name="chevron-forward" size={28} color="#0066cc" />
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
            const daySchedule = getScheduleForDate(day);
            const hasSchedule = !!daySchedule;
            const isPast = isBefore(startOfDay(day), startOfDay(new Date()));

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  isSelected && styles.calendarDaySelected,
                  dayIsToday && !isSelected && styles.calendarDayToday,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[
                  styles.calendarDayText,
                  !isCurrentMonth && styles.calendarDayTextOther,
                  isSelected && styles.calendarDayTextSelected,
                  dayIsToday && !isSelected && styles.calendarDayTextToday,
                  isPast && !isSelected && styles.calendarDayTextPast,
                ]}>
                  {format(day, 'd')}
                </Text>
                {hasSchedule && isCurrentMonth && (
                  <View style={[
                    styles.scheduleDot,
                    isSelected && styles.scheduleDotSelected,
                  ]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Details */}
        <View style={styles.selectedDayCard}>
          <Text style={styles.selectedDayTitle}>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>

          {selectedSchedule ? (
            <View style={styles.scheduleInfo}>
              <View style={styles.scheduleStatus}>
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                <Text style={styles.scheduleStatusText}>Working</Text>
              </View>
              <View style={styles.scheduleTime}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.scheduleTimeText}>
                  {selectedSchedule.availableFrom} - {selectedSchedule.availableTo}
                </Text>
              </View>
              {!isPastDate && (
                <View style={styles.scheduleActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleSetAvailability}
                  >
                    <Ionicons name="create-outline" size={18} color="#0066cc" />
                    <Text style={styles.editButtonText}>Edit Hours</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveAvailability}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                    <Text style={styles.removeButtonText}>Mark as Off</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noScheduleInfo}>
              <View style={styles.scheduleStatus}>
                <Ionicons name="close-circle" size={24} color="#999" />
                <Text style={styles.noScheduleText}>Not Working</Text>
              </View>
              {!isPastDate && (
                <TouchableOpacity
                  style={styles.setAvailabilityButton}
                  onPress={handleSetAvailability}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.setAvailabilityText}>Set Working Hours</Text>
                </TouchableOpacity>
              )}
              {isPastDate && (
                <Text style={styles.pastDateText}>This date has passed</Text>
              )}
            </View>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>Working day</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#e6f0ff', borderWidth: 1, borderColor: '#0066cc' }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
      </ScrollView>

      {/* Time Selection Modal */}
      <Modal
        visible={showTimeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timeModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Working Hours</Text>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {format(selectedDate, 'EEEE, MMMM d')}
            </Text>

            {/* Start Time */}
            <View style={styles.timeSection}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeSlots}>
                  {TIME_SLOTS.slice(0, -1).map(time => (
                    <TouchableOpacity
                      key={`start-${time}`}
                      style={[
                        styles.timeSlot,
                        selectedStartTime === time && styles.timeSlotSelected,
                      ]}
                      onPress={() => setSelectedStartTime(time)}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedStartTime === time && styles.timeSlotTextSelected,
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* End Time */}
            <View style={styles.timeSection}>
              <Text style={styles.timeLabel}>End Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeSlots}>
                  {TIME_SLOTS.slice(1).map(time => (
                    <TouchableOpacity
                      key={`end-${time}`}
                      style={[
                        styles.timeSlot,
                        selectedEndTime === time && styles.timeSlotSelected,
                        time <= selectedStartTime && styles.timeSlotDisabled,
                      ]}
                      onPress={() => {
                        if (time > selectedStartTime) {
                          setSelectedEndTime(time);
                        }
                      }}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedEndTime === time && styles.timeSlotTextSelected,
                        time <= selectedStartTime && styles.timeSlotTextDisabled,
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmAvailability}
              disabled={setAvailabilityMutation.isPending}
            >
              <Text style={styles.confirmButtonText}>
                {setAvailabilityMutation.isPending ? 'Saving...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
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
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dayLabels: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingBottom: 8,
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
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingBottom: 16,
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
  calendarDayTextPast: {
    color: '#999',
  },
  scheduleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginTop: 2,
  },
  scheduleDotSelected: {
    backgroundColor: '#fff',
  },
  selectedDayCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  scheduleInfo: {
    gap: 12,
  },
  scheduleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleStatusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#22c55e',
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleTimeText: {
    fontSize: 16,
    color: '#666',
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e6f0ff',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066cc',
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
  },
  noScheduleInfo: {
    gap: 16,
  },
  noScheduleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  setAvailabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#0066cc',
  },
  setAvailabilityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pastDateText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 32,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  timeModal: {
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
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 12,
  },
  timeSection: {
    paddingVertical: 16,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  timeSlots: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  timeSlotSelected: {
    backgroundColor: '#0066cc',
  },
  timeSlotDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  timeSlotTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  timeSlotTextDisabled: {
    color: '#ccc',
  },
  confirmButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0066cc',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
