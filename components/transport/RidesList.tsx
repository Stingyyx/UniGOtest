import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

import { useAuth } from '../../lib/auth';
import { getRides, Ride } from '../../lib/api/transport';
import { IMAGES } from '../../lib/constants/assets';

export function RidesList() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRides = async () => {
    try {
      const data = await getRides({
        status: 'active',
        from_date: new Date().toISOString(),
      });
      setRides(data);
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  useEffect(() => {
    loadRides();
  }, []);

  const renderRideCard = ({ item: ride }: { item: Ride }) => {
    const isDriver = ride.driver_id === user?.id;
    const dateLocale = i18n.language === 'ar' ? ar : enUS;

    return (
      <Card style={styles.card} mode="outlined">
        <Card.Title
          title={ride.driver?.full_name || t('transport.unknownDriver')}
          subtitle={format(new Date(ride.created_at), 'PPp', { locale: dateLocale })}
          left={(props) => (
            <Avatar.Image
              {...props}
              source={
                ride.driver?.avatar_url
                  ? { uri: ride.driver.avatar_url }
                  : IMAGES.DEFAULT_AVATAR
              }
            />
          )}
        />
        <Card.Content>
          <View style={styles.rideDetails}>
            <View style={styles.locationContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                {t('transport.from')}:
              </Text>
              <Text variant="bodyMedium">{ride.pickup_location}</Text>
            </View>
            <View style={styles.locationContainer}>
              <Text variant="bodyLarge" style={styles.label}>
                {t('transport.to')}:
              </Text>
              <Text variant="bodyMedium">{ride.destination}</Text>
            </View>
            <View style={styles.chipContainer}>
              <Chip icon="clock" style={styles.chip}>
                {format(new Date(ride.departure_time), 'p', { locale: dateLocale })}
              </Chip>
              <Chip icon="account-multiple" style={styles.chip}>
                {t('transport.seatsAvailable', { count: ride.available_seats })}
              </Chip>
              {ride.gender !== 'any' && (
                <Chip icon="gender-male-female" style={styles.chip}>
                  {t(`transport.gender.${ride.gender}`)}
                </Chip>
              )}
            </View>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => {
              router.push({
                pathname: '/(app)/transport/ride/[id]',
                params: { id: ride.id }
              });
            }}
          >
            {isDriver ? t('transport.viewRequests') : t('transport.requestRide')}
          </Button>
        </Card.Actions>
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

  if (rides.length === 0) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge">{t('transport.noRidesAvailable')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rides}
      renderItem={renderRideCard}
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
  rideDetails: {
    gap: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 