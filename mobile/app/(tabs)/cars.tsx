import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { carsApi, CarUnit } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { STATUS_COLORS, CarUnitStatus } from '../../types';

const STATUS_OPTIONS: CarUnitStatus[] = [
  'AVAILABLE',
  'OUT_FOR_TEST_DRIVE',
  'MAINTENANCE',
  'IN_TRANSIT',
  'RESERVED',
  'SOLD',
];

export default function CarsScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<CarUnitStatus | 'ALL'>('ALL');

  const { data: cars, isLoading, refetch } = useQuery({
    queryKey: ['cars'],
    queryFn: async () => {
      const params: any = {};
      if (user?.showroomId) {
        params.showroomId = user.showroomId;
      }
      const response = await carsApi.getUnits(params);
      return response.data as CarUnit[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      carsApi.updateUnitStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      Alert.alert('Success', 'Car status updated');
    },
    onError: () => Alert.alert('Error', 'Failed to update status'),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleStatusChange = (car: CarUnit) => {
    Alert.alert(
      'Update Status',
      `Change status for ${car.carModel.brand} ${car.carModel.model}`,
      STATUS_OPTIONS.map((status) => ({
        text: status.replace(/_/g, ' '),
        onPress: () => updateStatusMutation.mutate({ id: car.id, status }),
      })).concat([{ text: 'Cancel', style: 'cancel' } as any])
    );
  };

  const filteredCars = cars?.filter((car) => {
    const matchesSearch =
      !searchQuery ||
      car.vin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.carModel.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.carModel.model.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || car.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const renderCar = ({ item }: { item: CarUnit }) => (
    <TouchableOpacity style={styles.carCard} onPress={() => handleStatusChange(item)}>
      <View style={styles.carContent}>
        {/* Car Image */}
        {item.carModel.imageUrl ? (
          <Image
            source={{ uri: item.carModel.imageUrl }}
            style={styles.carImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.carImagePlaceholder}>
            <Ionicons name="car-sport" size={40} color="#ccc" />
          </View>
        )}

        <View style={styles.carInfo}>
          <View style={styles.carHeader}>
            <View style={styles.carHeaderText}>
              <Text style={styles.carName}>
                {item.carModel.brand} {item.carModel.model}
              </Text>
              <Text style={styles.carYear}>{item.carModel.year} • {item.carModel.variant || 'Standard'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                {item.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          <View style={styles.carDetails}>
            {item.vin && (
              <View style={styles.detailRow}>
                <Ionicons name="barcode-outline" size={14} color="#666" />
                <Text style={styles.detailText} numberOfLines={1}>{item.vin}</Text>
              </View>
            )}
            {item.color && (
              <View style={styles.detailRow}>
                <Ionicons name="color-palette-outline" size={14} color="#666" />
                <Text style={styles.detailText}>{item.color}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.showroom.name}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tapHint}>
        <Text style={styles.tapHintText}>Tap to change status</Text>
        <Ionicons name="chevron-forward" size={16} color="#999" />
      </View>
    </TouchableOpacity>
  );

  const statusCounts = cars?.reduce(
    (acc, car) => {
      acc[car.status] = (acc[car.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by VIN, brand, or model"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Pills - Horizontally Scrollable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterPill, filterStatus === 'ALL' && styles.filterPillActive]}
          onPress={() => setFilterStatus('ALL')}
        >
          <Text style={[styles.filterPillText, filterStatus === 'ALL' && styles.filterPillTextActive]}>
            All ({cars?.length || 0})
          </Text>
        </TouchableOpacity>
        {STATUS_OPTIONS.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterPill,
              filterStatus === status && styles.filterPillActive,
              { borderColor: STATUS_COLORS[status] },
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterPillText,
                filterStatus === status && styles.filterPillTextActive,
              ]}
            >
              {status.replace(/_/g, ' ')} ({statusCounts?.[status] || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Car List */}
      {filteredCars?.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-sport-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No cars found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCars}
          renderItem={renderCar}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  filterScrollView: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 40,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  filterPillText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  carCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  carContent: {
    flexDirection: 'row',
  },
  carImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
  },
  carImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carInfo: {
    flex: 1,
    padding: 12,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  carHeaderText: {
    flex: 1,
    marginRight: 8,
  },
  carName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  carYear: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  carDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tapHintText: {
    fontSize: 12,
    color: '#999',
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
});
