import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, startOfWeek, isSameDay, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { schedulingApi, SalesExecSchedule } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

export default function TeamScheduleScreen() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const monthStart = format(startOfMonth(calendarMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(calendarMonth), 'yyyy-MM-dd');

  const { data: teamSchedule, refetch } = useQuery({
    queryKey: ['team-schedule', monthStart, monthEnd],
    queryFn: async () => {
      const response = await schedulingApi.getTeamSchedule(monthStart, monthEnd);
      return response.data as SalesExecSchedule[];
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Get schedules for a specific date
  const getSchedulesForDate = (date: Date): SalesExecSchedule[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return teamSchedule?.filter(s => s.date.startsWith(dateStr)) || [];
  };

  // Get all unique dates that have schedules
  const datesWithSchedules = useMemo(() => {
    const dates = new Set<string>();
    teamSchedule?.forEach(s => {
      dates.add(s.date.split('T')[0]);
    });
    return dates;
  }, [teamSchedule]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1));
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [calendarMonth]);

  const selectedSchedules = getSchedulesForDate(selectedDate);

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Team Schedule</Text>
          <Text style={styles.headerSubtitle}>View your sales team's availability</Text>
        </View>

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
            const schedulesCount = getSchedulesForDate(day).length;
            const hasSchedules = schedulesCount > 0;

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
                ]}>
                  {format(day, 'd')}
                </Text>
                {hasSchedules && isCurrentMonth && (
                  <View style={[
                    styles.scheduleBadge,
                    isSelected && styles.scheduleBadgeSelected,
                  ]}>
                    <Text style={[
                      styles.scheduleBadgeText,
                      isSelected && styles.scheduleBadgeTextSelected,
                    ]}>
                      {schedulesCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Details */}
        <View style={styles.selectedDayCard}>
          <View style={styles.selectedDayHeader}>
            <Text style={styles.selectedDayTitle}>
              {format(selectedDate, 'EEEE, MMMM d')}
            </Text>
            <View style={styles.countBadge}>
              <Ionicons name="people" size={16} color="#0066cc" />
              <Text style={styles.countText}>{selectedSchedules.length} working</Text>
            </View>
          </View>

          {selectedSchedules.length > 0 ? (
            <View style={styles.teamList}>
              {selectedSchedules.map((schedule) => (
                <View key={schedule.id} style={styles.teamMember}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {schedule.user?.firstName?.[0] || 'S'}
                      {schedule.user?.lastName?.[0] || 'E'}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {schedule.user?.firstName} {schedule.user?.lastName}
                    </Text>
                    <View style={styles.memberTimeRow}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <Text style={styles.memberTime}>
                        {schedule.availableFrom} - {schedule.availableTo}
                      </Text>
                    </View>
                    {schedule.user?.phone && (
                      <View style={styles.memberTimeRow}>
                        <Ionicons name="call-outline" size={14} color="#666" />
                        <Text style={styles.memberPhone}>{schedule.user.phone}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.statusIndicator}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Available</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noTeamInfo}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.noTeamText}>No team members scheduled</Text>
              <Text style={styles.noTeamSubtext}>
                No sales executives have set their availability for this day
              </Text>
            </View>
          )}
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>This Month</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={24} color="#0066cc" />
              <Text style={styles.statNumber}>{datesWithSchedules.size}</Text>
              <Text style={styles.statLabel}>Days Covered</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#22c55e" />
              <Text style={styles.statNumber}>
                {new Set(teamSchedule?.map(s => s.userId) || []).size}
              </Text>
              <Text style={styles.statLabel}>Active Staff</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginTop: 1,
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
  scheduleBadge: {
    position: 'absolute',
    top: 2,
    right: 6,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleBadgeSelected: {
    backgroundColor: '#fff',
  },
  scheduleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 4,
  },
  scheduleBadgeTextSelected: {
    color: '#0066cc',
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
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0066cc',
  },
  teamList: {
    gap: 12,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  memberTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  memberTime: {
    fontSize: 13,
    color: '#666',
  },
  memberPhone: {
    fontSize: 13,
    color: '#666',
  },
  statusIndicator: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '500',
  },
  noTeamInfo: {
    alignItems: 'center',
    padding: 24,
  },
  noTeamText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginTop: 12,
  },
  noTeamSubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  spacer: {
    height: 32,
  },
});
