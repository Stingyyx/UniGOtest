import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, IconButton, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth/AuthContext';

type BusSchedule = {
  id: string;
  route_name: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string;
  arrival_time: string;
  days_of_week: string[];
  is_favorite: boolean;
};

export default function BusAlertsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [schedules, setSchedules] = useState<BusSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
    loadSchedules();
  }, []);

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationPermission(status === 'granted');
  };

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationPermission(status === 'granted');
  };

  const loadSchedules = async () => {
    try {
      // Load bus schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('bus_schedules')
        .select('*')
        .eq('is_active', true);

      if (schedulesError) throw schedulesError;

      // Load user's favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('bus_schedule_favorites')
        .select('schedule_id')
        .eq('user_id', user.id);

      if (favoritesError) throw favoritesError;

      const favoriteIds = new Set(favoritesData.map(f => f.schedule_id));
      
      setSchedules(schedulesData.map(schedule => ({
        ...schedule,
        is_favorite: favoriteIds.has(schedule.id)
      })));
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleFavorite = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    try {
      if (schedule.is_favorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('bus_schedule_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('schedule_id', scheduleId);

        if (error) throw error;

        // Remove notification
        const notificationId = 'bus_' + scheduleId;
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('bus_schedule_favorites')
          .insert([
            {
              user_id: user.id,
              schedule_id: scheduleId
            }
          ]);

        if (error) throw error;

        // Schedule notification if permission granted
        if (notificationPermission) {
          const [hours, minutes] = schedule.departure_time.split(':');
          const trigger = {
            hour: parseInt(hours, 10),
            minute: parseInt(minutes, 10) - 15, // 15 minutes before departure
            repeats: true
          };

          await Notifications.scheduleNotificationAsync({
            identifier: 'bus_' + scheduleId,
            content: {
              title: t('transport.busAlertTitle'),
              body: t('transport.busAlertBody', {
                route: schedule.route_name,
                time: schedule.departure_time
              })
            },
            trigger,
          });
        }
      }

      // Update local state
      setSchedules(prev =>
        prev.map(s =>
          s.id === scheduleId ? { ...s, is_favorite: !s.is_favorite } : s
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSchedules();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>العودة</Text>
          <MaterialCommunityIcons name="arrow-right" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.languageText}>English</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{t('transport.busSchedules')}</Text>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!notificationPermission && (
          <Card style={styles.permissionCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.permissionText}>
                {t('transport.enableNotifications')}
              </Text>
              <Button
                mode="contained"
                onPress={requestNotificationPermission}
                style={styles.permissionButton}
              >
                {t('transport.allowNotifications')}
              </Button>
            </Card.Content>
          </Card>
        )}

        {schedules.map((schedule) => (
          <Card style={styles.scheduleCard} key={schedule.id}>
            <Card.Title
              title={schedule.route_name}
              subtitle={schedule.departure_location + ' → ' + schedule.arrival_location}
              right={(props) => (
                <IconButton
                  {...props}
                  icon={schedule.is_favorite ? 'bell' : 'bell-outline'}
                  onPress={() => toggleFavorite(schedule.id)}
                />
              )}
            />
            <Card.Content>
              <View style={styles.scheduleDetails}>
                <View style={styles.timeContainer}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
                  <Text style={styles.timeText}>{schedule.departure_time}</Text>
                </View>
                <View style={styles.daysContainer}>
                  {schedule.days_of_week.map((day) => (
                    <Chip key={day} style={styles.dayChip}>
                      {t('transport.days.' + day)}
                    </Chip>
                  ))}
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backText: {
    marginRight: 8
  },
  languageText: {
    color: '#666'
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'right',
    padding: 16,
    paddingBottom: 24
  },
  content: {
    flex: 1,
    padding: 16
  },
  scheduleCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  scheduleDetails: {
    marginTop: 8
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  timeText: {
    fontSize: 14,
    color: '#666'
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  dayChip: {
    backgroundColor: '#f3f4f6'
  },
  permissionCard: {
    marginBottom: 16,
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1
  },
  permissionText: {
    marginBottom: 12,
    color: '#92400E'
  },
  permissionButton: {
    backgroundColor: '#F59E0B'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
}); 