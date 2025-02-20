import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../../lib/i18n/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../lib/auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import { colors } from '../../../lib/constants/colors';

type Ride = {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  available_seats: number;
  gender_preference: 'any' | 'male' | 'female';
  status: 'active' | 'full' | 'cancelled' | 'completed';
  description: string | null;
  created_at: string;
  updated_at: string;
  driver: {
    full_name: string;
    avatar_url: string | null;
  };
};

export default function RidesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles(full_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRides();
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const handleCancelRide = async (rideId: string) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', rideId);

      if (error) throw error;
      loadRides();
    } catch (error) {
      console.error('Error cancelling ride:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>العودة</Text>
          <MaterialCommunityIcons name="arrow-right" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : rides.length > 0 ? (
          rides.map((ride) => (
            <Card key={ride.id} style={styles.rideCard}>
              <Link 
                href={`/(app)/(transport)/ride/${ride.id}`}
                asChild
              >
                <TouchableOpacity>
                  <Card.Title
                    title={ride.driver.full_name}
                    subtitle={new Date(ride.departure_time).toLocaleString()}
                    left={(props) => (
                      <MaterialCommunityIcons name="account" size={24} color="#666" />
                    )}
                  />
                  <Card.Content>
                    <View style={styles.rideDetails}>
                      <View style={styles.locationContainer}>
                        <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
                        <Text style={styles.locationText}>
                          {ride.from_location} → {ride.to_location}
                        </Text>
                      </View>
                      <View style={styles.seatsInfo}>
                        <MaterialCommunityIcons name="car-seat" size={20} color="#666" />
                        <Text style={styles.seatsText}>{ride.available_seats}/4</Text>
                      </View>
                    </View>
                  </Card.Content>
                </TouchableOpacity>
              </Link>
              <Card.Content>
                <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/(app)/(transport)/ride/${ride.id}/requests`);
                    }}
                  >
                    <MaterialCommunityIcons name="account-group" size={20} color="#000" />
                    <Text style={styles.actionButtonText}>الطلبات</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCancelRide(ride.id);
                    }}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="#DC2626" />
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>إلغاء الرحلة</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text style={styles.noRides}>
            {language === 'ar' ? 'لا توجد رحلات متاحة' : 'No rides available'}
          </Text>
        )}
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
    alignItems: 'center',
    gap: 8
  },
  backText: {
    fontSize: 16,
    color: '#666'
  },
  content: {
    flex: 1,
    padding: 16
  },
  rideCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3
  },
  rideDetails: {
    gap: 12
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  locationText: {
    fontSize: 16,
    color: '#666'
  },
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  seatsText: {
    fontSize: 16,
    color: '#666'
  },
  seatsChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.transport.active
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  noRides: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  actionButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center'
  },
  cancelButton: {
    backgroundColor: '#FFF1F1',
    borderColor: '#FFCDD2'
  },
  cancelButtonText: {
    color: '#DC2626'
  }
}); 