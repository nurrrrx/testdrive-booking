import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, startOfDay } from 'date-fns';
import { carsApi, bookingsApi, availabilityApi, CarModel } from '../lib/api';
import { useAuthStore } from '../stores/auth';

type TimeSlot = {
  time: string;
  available: boolean;
  endTime: string;
};

export default function NewBookingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Form state
  const [step, setStep] = useState(1);
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [notes, setNotes] = useState('');

  // Fetch car models
  const { data: carModels, isLoading: modelsLoading } = useQuery({
    queryKey: ['carModels'],
    queryFn: async () => {
      const response = await carsApi.getModels();
      return response.data as CarModel[];
    },
  });

  // Fetch available slots when model and date are selected
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['availableSlots', user?.showroomId, format(selectedDate, 'yyyy-MM-dd'), selectedModel?.id],
    queryFn: async () => {
      if (!user?.showroomId) return null;
      const response = await availabilityApi.getSlots(
        user.showroomId,
        format(selectedDate, 'yyyy-MM-dd'),
        selectedModel?.id
      );
      return response.data as { slots: TimeSlot[] };
    },
    enabled: !!user?.showroomId && step === 2,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: () => {
      if (!user?.showroomId || !selectedTime) {
        throw new Error('Missing required fields');
      }
      return bookingsApi.create({
        showroomId: user.showroomId,
        carModelId: selectedModel?.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime,
        customerInfo: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          phone: customerInfo.phone,
          email: customerInfo.email || undefined,
        },
        source: 'WALK_IN',
        notes: notes || undefined,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert(
        'Booking Created',
        `Booking reference: ${response.data.referenceNumber}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create booking';
      Alert.alert('Error', message);
    },
  });

  // Generate dates for selection (today + 7 days)
  const availableDates = useMemo(() => {
    const dates = [];
    const today = startOfDay(new Date());
    for (let i = 0; i <= 7; i++) {
      dates.push(addDays(today, i));
    }
    return dates;
  }, []);

  const availableSlots = slotsData?.slots?.filter(s => s.available) || [];

  const handleNext = () => {
    if (step === 1 && !selectedModel) {
      Alert.alert('Select Car', 'Please select a car model');
      return;
    }
    if (step === 2 && !selectedTime) {
      Alert.alert('Select Time', 'Please select a time slot');
      return;
    }
    if (step === 3) {
      if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim() || !customerInfo.phone.trim()) {
        Alert.alert('Missing Info', 'Please fill in customer first name, last name, and phone');
        return;
      }
      // Submit booking
      createBookingMutation.mutate();
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep(step - 1);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Car Model</Text>
      {modelsLoading ? (
        <ActivityIndicator size="large" color="#0066cc" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.modelList}>
          {carModels?.map((model) => (
            <TouchableOpacity
              key={model.id}
              style={[
                styles.modelCard,
                selectedModel?.id === model.id && styles.modelCardSelected,
              ]}
              onPress={() => setSelectedModel(model)}
            >
              <View style={styles.modelInfo}>
                <Text style={styles.modelBrand}>{model.brand}</Text>
                <Text style={styles.modelName}>{model.model}</Text>
                <Text style={styles.modelMeta}>
                  {model.year} • {model.variant || 'Standard'}
                </Text>
              </View>
              {selectedModel?.id === model.id && (
                <Ionicons name="checkmark-circle" size={24} color="#0066cc" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Date & Time</Text>

      {/* Date Selection */}
      <Text style={styles.sectionLabel}>Date</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateScroll}
        contentContainerStyle={styles.dateContainer}
      >
        {availableDates.map((date) => {
          const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[styles.dateCard, isSelected && styles.dateCardSelected]}
              onPress={() => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
            >
              <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>
                {format(date, 'EEE')}
              </Text>
              <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                {format(date, 'd')}
              </Text>
              <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                {format(date, 'MMM')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time Slots */}
      <Text style={styles.sectionLabel}>Available Times</Text>
      {slotsLoading ? (
        <ActivityIndicator size="large" color="#0066cc" style={{ marginTop: 20 }} />
      ) : availableSlots.length === 0 ? (
        <View style={styles.noSlotsContainer}>
          <Ionicons name="calendar-outline" size={48} color="#ccc" />
          <Text style={styles.noSlotsText}>No available slots for this date</Text>
        </View>
      ) : (
        <View style={styles.timeGrid}>
          {availableSlots.map((slot) => (
            <TouchableOpacity
              key={slot.time}
              style={[
                styles.timeSlot,
                selectedTime === slot.time && styles.timeSlotSelected,
              ]}
              onPress={() => setSelectedTime(slot.time)}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTime === slot.time && styles.timeSlotTextSelected,
                ]}
              >
                {slot.time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.stepContainer}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Customer Details</Text>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={customerInfo.firstName}
            onChangeText={(text) => setCustomerInfo({ ...customerInfo, firstName: text })}
            placeholder="Enter first name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={customerInfo.lastName}
            onChangeText={(text) => setCustomerInfo({ ...customerInfo, lastName: text })}
            placeholder="Enter last name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Phone *</Text>
          <TextInput
            style={styles.input}
            value={customerInfo.phone}
            onChangeText={(text) => setCustomerInfo({ ...customerInfo, phone: text })}
            placeholder="+971501234567"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Email (Optional)</Text>
          <TextInput
            style={styles.input}
            value={customerInfo.email}
            onChangeText={(text) => setCustomerInfo({ ...customerInfo, email: text })}
            placeholder="customer@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special requests or notes"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Car:</Text>
            <Text style={styles.summaryValue}>
              {selectedModel?.brand} {selectedModel?.model}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{selectedTime}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Booking</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                step >= s && styles.progressDotActive,
              ]}
            >
              {step > s ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={[styles.progressDotText, step >= s && styles.progressDotTextActive]}>
                  {s}
                </Text>
              )}
            </View>
            <Text style={[styles.progressLabel, step >= s && styles.progressLabelActive]}>
              {s === 1 ? 'Car' : s === 2 ? 'Time' : 'Details'}
            </Text>
          </View>
        ))}
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </View>

      {/* Footer with Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, createBookingMutation.isPending && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={createBookingMutation.isPending}
        >
          {createBookingMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === 3 ? 'Create Booking' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 40,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: '#0066cc',
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  progressDotTextActive: {
    color: '#fff',
  },
  progressLabel: {
    fontSize: 12,
    color: '#999',
  },
  progressLabelActive: {
    color: '#0066cc',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  modelList: {
    flex: 1,
  },
  modelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modelCardSelected: {
    borderColor: '#0066cc',
    backgroundColor: '#f0f7ff',
  },
  modelInfo: {
    flex: 1,
  },
  modelBrand: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  modelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 2,
  },
  modelMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginTop: 16,
  },
  dateScroll: {
    flexGrow: 0,
  },
  dateContainer: {
    gap: 10,
    paddingVertical: 4,
  },
  dateCard: {
    width: 60,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  dateDayName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginVertical: 2,
  },
  dateMonth: {
    fontSize: 12,
    color: '#666',
  },
  dateTextSelected: {
    color: '#fff',
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSlotsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeSlotSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  nextButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
