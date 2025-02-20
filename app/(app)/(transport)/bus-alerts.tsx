import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Text, Card, IconButton, SegmentedButtons, Portal, Modal, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth/AuthContext';
import { busNotificationService } from '../../../lib/notifications/BusNotificationService';
import BusStopsMap from '../../../components/transport/BusStopsMap';
import BackButton from '../../../components/common/BackButton';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// Create notification channel for Android with better configuration
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('bus-reminders', {
    name: 'تذكيرات الباص',
    description: 'تنبيهات لمواعيد الباصات',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    enableVibrate: true,
    enableLights: true,
    sound: 'bus-alaram-notfication.wav', // Updated sound file name
  });
}

type City = 'jenin' | 'tulkarm' | 'nablus' | 'tubas';
type Direction = 'outbound' | 'return';

interface Schedule {
  id: string;
  route_name: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string;
  arrival_time: string;
  days_of_week: string[];
  city: string;
  notes: string | null;
  schedule_type: 'regular' | 'flexible' | 'continuous' | 'last' | 'return';
}

type CitySchedules = Record<City, Record<Direction, Schedule[]>>;

const schedules: CitySchedules = {
  nablus: {
    outbound: [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        route_name: 'نابلس - رحلة الذهاب الأولى',
        departure_location: 'نابلس',
        arrival_location: 'الجامعة',
        departure_time: '07:10',
        arrival_time: '08:10',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'nablus',
        notes: null,
        schedule_type: 'regular'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        route_name: 'نابلس - رحلة الذهاب الثانية',
        departure_location: 'نابلس',
        arrival_location: 'الجامعة',
        departure_time: '07:30',
        arrival_time: '08:30',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'nablus',
        notes: null,
        schedule_type: 'regular'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        route_name: 'نابلس - رحلة الذهاب الثالثة',
        departure_location: 'نابلس',
        arrival_location: 'الجامعة',
        departure_time: '09:00',
        arrival_time: '10:00',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'nablus',
        notes: 'احتمال وجود الباص',
        schedule_type: 'flexible'
      }
    ],
    return: [
      {
        id: '123e4567-e89b-12d3-a456-426614174004',
        route_name: 'نابلس - رحلة العودة الأولى',
        departure_location: 'الجامعة',
        arrival_location: 'نابلس',
        departure_time: '13:30',
        arrival_time: '14:30',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'nablus',
        notes: null,
        schedule_type: 'return'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174005',
        route_name: 'نابلس - رحلة العودة الثانية',
        departure_location: 'الجامعة',
        arrival_location: 'نابلس',
        departure_time: '15:10',
        arrival_time: '16:10',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'nablus',
        notes: null,
        schedule_type: 'return'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174006',
        route_name: 'نابلس - آخر رحلة',
        departure_location: 'الجامعة',
        arrival_location: 'نابلس',
        departure_time: '16:30',
        arrival_time: '17:30',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'nablus',
        notes: 'آخر رحلة',
        schedule_type: 'last'
      }
    ]
  },
  tulkarm: {
    outbound: [
      {
        id: '123e4567-e89b-12d3-a456-426614174007',
        route_name: 'طولكرم - رحلة الذهاب',
        departure_location: 'طولكرم',
        arrival_location: 'الجامعة',
        departure_time: '07:00',
        arrival_time: '08:00',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'tulkarm',
        notes: 'رحلة الذهاب',
        schedule_type: 'regular'
      }
    ],
    return: [
      {
        id: '123e4567-e89b-12d3-a456-426614174008',
        route_name: 'طولكرم - رحلة العودة الأولى',
        departure_location: 'الجامعة',
        arrival_location: 'طولكرم',
        departure_time: '13:30',
        arrival_time: '14:30',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'tulkarm',
        notes: 'رحلة العودة',
        schedule_type: 'return'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174009',
        route_name: 'طولكرم - رحلة العودة الثانية',
        departure_location: 'الجامعة',
        arrival_location: 'طولكرم',
        departure_time: '14:30',
        arrival_time: '15:30',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'tulkarm',
        notes: 'رحلة العودة',
        schedule_type: 'return'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174010',
        route_name: 'طولكرم - رحلة العودة الثالثة',
        departure_location: 'الجامعة',
        arrival_location: 'طولكرم',
        departure_time: '15:30',
        arrival_time: '16:30',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'tulkarm',
        notes: 'رحلة العودة',
        schedule_type: 'return'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174011',
        route_name: 'طولكرم - آخر رحلة',
        departure_location: 'الجامعة',
        arrival_location: 'طولكرم',
        departure_time: '16:30',
        arrival_time: '17:30',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'tulkarm',
        notes: 'آخر رحلة للعودة',
        schedule_type: 'last'
      }
    ]
  },
  jenin: {
    outbound: [
      {
        id: '123e4567-e89b-12d3-a456-426614174012',
        route_name: 'جنين - أول رحلة',
        departure_location: 'جنين',
        arrival_location: 'الجامعة',
        departure_time: '07:45',
        arrival_time: '08:00',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'jenin',
        notes: 'أول رحلة',
        schedule_type: 'regular'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174013',
        route_name: 'جنين - رحلة ثانية',
        departure_location: 'جنين',
        arrival_location: 'الجامعة',
        departure_time: '08:00',
        arrival_time: '08:15',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'jenin',
        notes: null,
        schedule_type: 'regular'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174014',
        route_name: 'جنين - رحلات متفرقة',
        departure_location: 'جنين',
        arrival_location: 'الجامعة',
        departure_time: '08:00',
        arrival_time: '12:30',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'jenin',
        notes: 'عدة رحلات حسب عدد الطلاب',
        schedule_type: 'flexible'
      }
    ],
    return: [
      {
        id: '123e4567-e89b-12d3-a456-426614174015',
        route_name: 'جنين - رحلة العودة',
        departure_location: 'الجامعة',
        arrival_location: 'جنين',
        departure_time: '17:00',
        arrival_time: '17:30',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'jenin',
        notes: 'آخر موعد للعودة - أحيانا تمتد حتى 05:30 مساءً',
        schedule_type: 'last'
      }
    ]
  },
  tubas: {
    outbound: [
      {
        id: '123e4567-e89b-12d3-a456-426614174016',
        route_name: 'طوباس - رحلة الذهاب الأولى',
        departure_location: 'طوباس',
        arrival_location: 'الجامعة',
        departure_time: '08:00',
        arrival_time: '11:00',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'tubas',
        notes: 'رحلة الذهاب',
        schedule_type: 'regular'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174018',
        route_name: 'طوباس - رحلات متفرقة',
        departure_location: 'طوباس',
        arrival_location: 'الجامعة',
        departure_time: '08:00 - 12:30',
        arrival_time: '12:30',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'tubas',
        notes: 'عدة رحلات حسب عدد الطلاب',
        schedule_type: 'flexible'
      }
    ],
    return: [
      {
        id: '123e4567-e89b-12d3-a456-426614174017',
        route_name: 'طوباس - آخر رحلة',
        departure_location: 'الجامعة',
        arrival_location: 'طوباس',
        departure_time: '16:30',
        arrival_time: '17:00',
        days_of_week: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        city: 'tubas',
        notes: 'آخر موعد للعودة',
        schedule_type: 'last'
      }
    ]
  }
};

const cityNames = {
  nablus: 'نابلس',
  tulkarm: 'طولكرم',
  jenin: 'جنين',
  tubas: 'طوباس'
};

export default function BusAlertsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState<City>('nablus');
  const [selectedTab, setSelectedTab] = useState<Direction>('outbound');
  const [mapVisible, setMapVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [activeNotifications, setActiveNotifications] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
    loadActiveNotifications();
  }, []);

  const loadActiveNotifications = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('bus_schedule_favorites')
      .select('schedule_id')
      .eq('user_id', user.id);

    if (data) {
      setActiveNotifications(new Set(data.map(item => item.schedule_id)));
    }
  };

  const checkNotificationPermission = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'تنبيه',
        'نحتاج إذن الإشعارات لتذكيرك بمواعيد الباص',
        [{ text: 'حسناً' }]
      );
      return false;
    }
    return true;
  };

  const scheduleNotification = async (schedule: Schedule) => {
    try {
      setLoading(true);

      const notificationContent = {
        title: '',  // Will be set by the service
        body: '',   // Will be set by the service
        data: { scheduleId: schedule.id },
        sound: true,
        priority: 'max',
        vibrate: [0, 250, 250, 250]
      };

      await busNotificationService.scheduleNotification(schedule, notificationContent);
      
      // Update UI optimistically
      setActiveNotifications(prev => new Set([...prev, schedule.id]));
      
      // Show success message
      Alert.alert(
        'تم بنجاح',
        'سيتم تذكيرك بموعد الباص قبل 3 دقائق من موعد المغادرة'
      );

    } catch (error) {
      console.error('Error scheduling notification:', error);
      
      // Show user-friendly error message
      Alert.alert(
        'تنبيه',
        error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      );
      
      // Rollback UI state
      setActiveNotifications(prev => new Set([...prev].filter(id => id !== schedule.id)));
    } finally {
      setLoading(false);
    }
  };

  const cancelNotification = async (schedule: Schedule) => {
    try {
      setLoading(true);
      
      // Update UI optimistically
      setActiveNotifications(prev => new Set([...prev].filter(id => id !== schedule.id)));
      
      await busNotificationService.cancelNotification(schedule.id);
      
      // Show success message
      Alert.alert(
        'تم بنجاح',
        'تم إلغاء التذكير بنجاح'
      );

    } catch (error) {
      console.error('Error canceling notification:', error);
      
      // Show user-friendly error message
      Alert.alert(
        'تنبيه',
        error instanceof Error ? error.message : 'فشل في إلغاء التذكير'
      );
      
      // Rollback UI state
      setActiveNotifications(prev => new Set([...prev, schedule.id]));
    } finally {
      setLoading(false);
    }
  };

  const cities = [
    { id: 'nablus' as const, name: cityNames.nablus, icon: 'office-building-marker' as const },
    { id: 'tulkarm' as const, name: cityNames.tulkarm, icon: 'city-variant-outline' as const },
    { id: 'jenin' as const, name: cityNames.jenin, icon: 'home-city-outline' as const },
    { id: 'tubas' as const, name: cityNames.tubas, icon: 'city-variant' as const }
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
      {/* Header */}
      <View style={styles.header}>
          <BackButton style={styles.backButton} />
      </View>

        <Text style={styles.title}>ذكرني بالباص</Text>

        {/* City Selection */}
        <View style={styles.cityGrid}>
          {cities.map((city) => (
            <TouchableOpacity
              key={city.id}
              onPress={() => setSelectedCity(city.id)}
              style={[
                styles.cityCard,
                selectedCity === city.id && styles.selectedCityCard,
              ]}
            >
              <MaterialCommunityIcons
                name={city.icon}
                size={36}
                color={selectedCity === city.id ? '#000' : '#666'}
              />
              <Text style={[
                styles.cityName,
                selectedCity === city.id && styles.selectedCityName,
              ]}>
                {city.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Schedule Tabs */}
        <View style={styles.tabsContainer}>
          <SegmentedButtons
            value={selectedTab}
            onValueChange={(value) => setSelectedTab(value as Direction)}
            buttons={[
              {
                value: 'outbound',
                label: 'رحلات الذهاب',
                icon: 'bus',
                style: { backgroundColor: selectedTab === 'outbound' ? '#000' : '#f5f5f5' },
                labelStyle: { color: selectedTab === 'outbound' ? '#fff' : '#000' },
                checkedColor: '#fff',
                uncheckedColor: '#000'
              },
              {
                value: 'return',
                label: 'رحلات العودة',
                icon: 'swap-horizontal',
                style: { backgroundColor: selectedTab === 'return' ? '#000' : '#f5f5f5' },
                labelStyle: { color: selectedTab === 'return' ? '#fff' : '#000' },
                checkedColor: '#fff',
                uncheckedColor: '#000'
              },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Schedule List */}
        <View style={styles.scheduleList}>
          {schedules[selectedCity][selectedTab].map((schedule: Schedule) => (
            <Card key={schedule.id} style={styles.scheduleCard}>
              <Card.Content style={styles.scheduleContent}>
                <View style={styles.scheduleInfo}>
                  <View style={styles.timeIcon}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={20}
                      color="#666"
                    />
                  </View>
                  <View style={styles.timeInfo}>
                    <Text style={styles.departureTime}>
                      {selectedCity === 'jenin' && schedule.schedule_type === 'flexible' 
                        ? `${schedule.departure_time} - ${schedule.arrival_time}`
                        : schedule.departure_time}
                    </Text>
                    <Text style={styles.scheduleNote}>{schedule.notes || schedule.route_name}</Text>
                  </View>
                </View>
                <IconButton
                  icon={activeNotifications.has(schedule.id) ? "bell" : "bell-outline"}
                  size={24}
                  onPress={() => {
                    if (activeNotifications.has(schedule.id)) {
                      cancelNotification(schedule);
                    } else {
                      scheduleNotification(schedule);
                    }
                  }}
                  style={styles.bellIcon}
                  iconColor={activeNotifications.has(schedule.id) ? "#007AFF" : "#666"}
                />
            </Card.Content>
          </Card>
        ))}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={mapVisible}
          onDismiss={() => setMapVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <BusStopsMap city={selectedCity} />
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  cityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
    gap: 8,
  },
  cityCard: {
    flex: 1,
    margin: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    minHeight: 100,
  },
  selectedCityCard: {
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  cityName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    width: '100%',
    flexWrap: 'nowrap',
  },
  selectedCityName: {
    color: '#000',
    fontWeight: '600',
  },
  tabsContainer: {
    marginBottom: 24,
  },
  segmentedButtons: {
    backgroundColor: '#f5f5f5',
  },
  scheduleList: {
    gap: 16,
  },
  scheduleCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scheduleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timeIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  timeInfo: {
    gap: 4,
  },
  departureTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  scheduleNote: {
    fontSize: 14,
    color: '#666',
  },
  bellIcon: {
    margin: 0,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    height: '70%',
    padding: 20,
  },
  backButton: {
    marginRight: 'auto',
  },
  snackbar: {
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
  },
}); 