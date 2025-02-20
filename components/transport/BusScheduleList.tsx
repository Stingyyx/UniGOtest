import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

import { useAuth } from '../../lib/auth';
import { getBusSchedules, getFavoriteBusSchedules, toggleBusScheduleFavorite, BusSchedule } from '../../lib/api/transport';

export function BusScheduleList() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<BusSchedule[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [schedulesData, favoritesData] = await Promise.all([
        getBusSchedules(),
        user ? getFavoriteBusSchedules(user.id) : Promise.resolve([]),
      ]);
      setSchedules(schedulesData);
      setFavorites(new Set(favoritesData.map((fav) => fav.schedule_id)));
    } catch (error) {
      console.error('Error loading bus schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleToggleFavorite = async (scheduleId: string) => {
    if (!user) return;

    try {
      await toggleBusScheduleFavorite(user.id, scheduleId);
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(scheduleId)) {
          next.delete(scheduleId);
        } else {
          next.add(scheduleId);
        }
        return next;
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const renderScheduleCard = ({ item: schedule }: { item: BusSchedule }) => {
    const dateLocale = i18n.language === 'ar' ? ar : enUS;
    const isFavorite = favorites.has(schedule.id);

    return (
      <Card style={styles.card} mode="outlined">
        <Card.Title
          title={schedule.route_name}
          right={(props) =>
            user && (
              <IconButton
                {...props}
                icon={isFavorite ? 'star' : 'star-outline'}
                onPress={() => handleToggleFavorite(schedule.id)}
                iconColor={isFavorite ? theme.colors.primary : undefined}
              />
            )
          }
        />
        <Card.Content>
          <View style={styles.scheduleDetails}>
            <View style={styles.locationContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                {t('transport.from')}:
              </Text>
              <Text variant="bodyMedium">{schedule.departure_location}</Text>
            </View>
            <View style={styles.locationContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                {t('transport.to')}:
              </Text>
              <Text variant="bodyMedium">{schedule.arrival_location}</Text>
            </View>
            <View style={styles.timeContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                {t('transport.departureTime')}:
              </Text>
              <Text variant="bodyMedium">
                {format(new Date(`2000-01-01T${schedule.departure_time}`), 'p', {
                  locale: dateLocale,
                })}
              </Text>
            </View>
            <View style={styles.daysContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                {t('transport.daysOfWeek')}:
              </Text>
              <Text variant="bodyMedium">
                {schedule.days_of_week
                  .map((day) => t(`transport.days.${day.toLowerCase()}`))
                  .join(', ')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (schedules.length === 0) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge">{t('transport.noSchedulesAvailable')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={schedules}
      renderItem={renderScheduleCard}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  scheduleDetails: {
    gap: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 