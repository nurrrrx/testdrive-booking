import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';
import { schedulingApi, SalesExecSchedule, User } from '../lib/api';
import { useAuthStore } from '../stores/auth';

export default function ScheduleScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [availableFrom, setAvailableFrom] = useState('09:00');
  const [availableTo, setAvailableTo] = useState('18:00');

  const isManager = user?.role === 'SHOWROOM_MANAGER' || user?.role === 'ADMIN';

  const weekEnd = useMemo(() => endOfWeek(currentWeekStart, { weekStartsOn: 0 }), [currentWeekStart]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  }, [currentWeekStart]);

  // Fetch team schedule for managers, or my schedule for sales execs
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['schedule', format(currentWeekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'), isManager],
    queryFn: async () => {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd');

      if (isManager) {
        const response = await schedulingApi.getTeamSchedule(startDate, endDate);
        return response.data as SalesExecSchedule[];
      } else {
        const response = await schedulingApi.getMySchedule(startDate, endDate);
        return response.data as SalesExecSchedule[];
      }
    },
  });

  // Set availability mutation
  const setAvailabilityMutation = useMutation({
    mutationFn: (data: { userId?: string; date: string; availableFrom: string; availableTo: string }) =>
      schedulingApi.setAvailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', 'Availability updated');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update availability';
      Alert.alert('Error', message);
    },
  });

  // Remove availability mutation
  const removeAvailabilityMutation = useMutation({
    mutationFn: (data: { userId?: string; date: string }) =>
      schedulingApi.removeAvailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      Alert.alert('Success', 'Availability removed');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to remove availability';
      Alert.alert('Error', message);
    },
  });

  const resetForm = () => {
    setSelectedDate(null);
    setSelectedUserId(null);
    setAvailableFrom('09:00');
    setAvailableTo('18:00');
  };

  const handleAddAvailability = () => {
    if (!selectedDate) {
      Alert.alert('Select Date', 'Please select a date');
      return;
    }

    setAvailabilityMutation.mutate({
      userId: isManager ? selectedUserId || undefined : undefined,
      date: format(selectedDate, 'yyyy-MM-dd'),
      availableFrom,
      availableTo,
    });
  };

  const handleRemoveAvailability = (schedule: SalesExecSchedule) => {
    Alert.alert(
      'Remove Availability',
      `Remove availability for ${format(new Date(schedule.date), 'MMM d')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeAvailabilityMutation.mutate({
            userId: isManager ? schedule.userId : undefined,
            date: schedule.date,
          }),
        },
      ]
    );
  };

  const openAddModal = (date: Date) => {
    setSelectedDate(date);
    // For sales exec, no user selection needed
    if (!isManager) {
      setSelectedUserId(user?.id || null);
    }
    setShowAddModal(true);
  };

  // Group schedules by user for managers
  const schedulesByUser = useMemo(() => {
    if (!scheduleData) return {};

    const grouped: Record<string, { user: User | undefined; schedules: SalesExecSchedule[] }> = {};

    scheduleData.forEach((schedule) => {
      const userId = schedule.userId;
      if (!grouped[userId]) {
        grouped[userId] = {
          user: schedule.user,
          schedules: [],
        };
      }
      grouped[userId].schedules.push(schedule);
    });

    return grouped;
  }, [scheduleData]);

  // Get schedule for a specific date
  const getScheduleForDate = (date: Date, userId?: string): SalesExecSchedule | undefined => {
    if (!scheduleData) return undefined;
    return scheduleData.find((s) => {
      const matches = isSameDay(new Date(s.date), date);
      return userId ? matches && s.userId === userId : matches;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart((prev) =>
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  const timeOptions = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00',
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isManager ? 'Team Schedule' : 'My Schedule'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#0066cc" />
        </TouchableOpacity>
        <Text style={styles.weekText}>
          {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </Text>
        <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#0066cc" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0066cc" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.content}>
          {/* Week Days Grid */}
          <View style={styles.weekGrid}>
            {weekDays.map((day) => {
              const daySchedule = !isManager ? getScheduleForDate(day) : null;
              const dayIsToday = isToday(day);

              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[
                    styles.dayCard,
                    dayIsToday && styles.dayCardToday,
                    daySchedule && styles.dayCardScheduled,
                  ]}
                  onPress={() => openAddModal(day)}
                  onLongPress={() => daySchedule && handleRemoveAvailability(daySchedule)}
                >
                  <Text style={[styles.dayCardName, dayIsToday && styles.dayCardTextToday]}>
                    {format(day, 'EEE')}
                  </Text>
                  <Text style={[styles.dayCardDate, dayIsToday && styles.dayCardTextToday]}>
                    {format(day, 'd')}
                  </Text>
                  {!isManager && daySchedule && (
                    <View style={styles.scheduleIndicator}>
                      <Text style={styles.scheduleTime}>
                        {daySchedule.availableFrom}
                      </Text>
                      <Text style={styles.scheduleTimeTo}>-</Text>
                      <Text style={styles.scheduleTime}>
                        {daySchedule.availableTo}
                      </Text>
                    </View>
                  )}
                  {!isManager && !daySchedule && (
                    <Text style={styles.offText}>Off</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Team View for Managers */}
          {isManager && Object.keys(schedulesByUser).length > 0 && (
            <View style={styles.teamSection}>
              <Text style={styles.sectionTitle}>Team Availability</Text>
              {Object.entries(schedulesByUser).map(([userId, { user: teamMember, schedules }]) => (
                <View key={userId} style={styles.teamMemberCard}>
                  <View style={styles.memberHeader}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {teamMember?.firstName?.[0]}{teamMember?.lastName?.[0]}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {teamMember?.firstName} {teamMember?.lastName}
                      </Text>
                      <Text style={styles.memberRole}>Sales Executive</Text>
                    </View>
                  </View>
                  <View style={styles.memberSchedule}>
                    {weekDays.map((day) => {
                      const schedule = schedules.find((s) => isSameDay(new Date(s.date), day));
                      return (
                        <View
                          key={day.toISOString()}
                          style={[
                            styles.memberDayCell,
                            schedule && styles.memberDayCellActive,
                          ]}
                        >
                          <Text style={styles.memberDayLabel}>{format(day, 'EEE')}</Text>
                          {schedule ? (
                            <Text style={styles.memberDayTime}>{schedule.availableFrom}</Text>
                          ) : (
                            <Text style={styles.memberDayOff}>-</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>How to use</Text>
            <Text style={styles.instructionsText}>
              • Tap a day to set your availability{'\n'}
              • Long press a scheduled day to remove it{'\n'}
              • Swipe left/right to change weeks
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Add Availability Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Availability</Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedDate && (
              <Text style={styles.selectedDateText}>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </Text>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Available From</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timeScroll}
              >
                {timeOptions.slice(0, timeOptions.indexOf(availableTo)).map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      availableFrom === time && styles.timeOptionSelected,
                    ]}
                    onPress={() => setAvailableFrom(time)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        availableFrom === time && styles.timeOptionTextSelected,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Available To</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timeScroll}
              >
                {timeOptions.slice(timeOptions.indexOf(availableFrom) + 1).map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      availableTo === time && styles.timeOptionSelected,
                    ]}
                    onPress={() => setAvailableTo(time)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        availableTo === time && styles.timeOptionTextSelected,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, setAvailabilityMutation.isPending && styles.buttonDisabled]}
              onPress={handleAddAvailability}
              disabled={setAvailabilityMutation.isPending}
            >
              {setAvailabilityMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Availability</Text>
              )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerRight: {
    width: 40,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  navButton: {
    padding: 8,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayCard: {
    width: '13.5%',
    aspectRatio: 0.8,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardToday: {
    borderColor: '#0066cc',
  },
  dayCardScheduled: {
    backgroundColor: '#e6f0ff',
  },
  dayCardName: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  dayCardDate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginVertical: 2,
  },
  dayCardTextToday: {
    color: '#0066cc',
  },
  scheduleIndicator: {
    marginTop: 4,
    alignItems: 'center',
  },
  scheduleTime: {
    fontSize: 9,
    color: '#0066cc',
    fontWeight: '600',
  },
  scheduleTimeTo: {
    fontSize: 8,
    color: '#999',
  },
  offText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  teamSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  teamMemberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  memberRole: {
    fontSize: 12,
    color: '#666',
  },
  memberSchedule: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memberDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  memberDayCellActive: {
    backgroundColor: '#e6f0ff',
  },
  memberDayLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  memberDayTime: {
    fontSize: 10,
    color: '#0066cc',
    fontWeight: '600',
    marginTop: 2,
  },
  memberDayOff: {
    fontSize: 10,
    color: '#ccc',
    marginTop: 2,
  },
  instructions: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectedDateText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  timeScroll: {
    flexGrow: 0,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeOptionSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  timeOptionTextSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
