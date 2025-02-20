import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { supabase } from '../../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type BusStop = {
  id: string;
  name: string;
  type: 'bus_stop';
  latitude: number;
  longitude: number;
  description?: string;
};

type Props = {
  city?: string;
  onStopPress?: (stop: BusStop) => void;
};

const cityCoordinates = {
  jenin: { latitude: 32.4635, longitude: 35.2936 },
  tulkarm: { latitude: 32.3100, longitude: 35.0286 },
  nablus: { latitude: 32.2227, longitude: 35.2590 },
  tubas: { latitude: 32.3209, longitude: 35.3699 }
};

export default function BusStopsMap({ city, onStopPress }: Props) {
  const { t } = useTranslation();
  const [stops, setStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);

  useEffect(() => {
    loadBusStops();
  }, [city]);

  const loadBusStops = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedStop(null);
      
      let query = supabase
        .from('map_locations')
        .select('*')
        .eq('type', 'bus_stop');

      if (city) {
        query = query.ilike('description', `%${city}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data || data.length === 0) {
        setError(t('transport.bus_alerts.no_stops_found'));
        return;
      }

      setStops(data as BusStop[]);
    } catch (error) {
      console.error('Error loading bus stops:', error);
      setError(t('transport.bus_alerts.error_loading_stops'));
    } finally {
      setLoading(false);
    }
  };

  const getInitialRegion = (): Region => {
    if (city && city in cityCoordinates) {
      const coords = cityCoordinates[city as keyof typeof cityCoordinates];
      return {
        ...coords,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    // Default to Jenin coordinates
    return {
      latitude: 32.4635,
      longitude: 35.2936,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  };

  const handleStopPress = (stop: BusStop) => {
    setSelectedStop(stop);
    onStopPress?.(stop);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('transport.bus_alerts.loading_stops')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert" size={48} color="#FF5252" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadBusStops} style={styles.retryButton}>
          {t('common.retry')}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
      >
        {stops.map(stop => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            title={stop.name}
            description={stop.description}
            onPress={() => handleStopPress(stop)}
          >
            <MaterialCommunityIcons
              name="bus-stop"
              size={24}
              color={selectedStop?.id === stop.id ? '#4CAF50' : '#2196F3'}
            />
          </Marker>
        ))}
      </MapView>
      {selectedStop && (
        <View style={styles.stopDetails}>
          <Text style={styles.stopName}>{selectedStop.name}</Text>
          {selectedStop.description && (
            <Text style={styles.stopDescription}>{selectedStop.description}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  stopDetails: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  stopName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stopDescription: {
    fontSize: 14,
    color: '#666',
  },
}); 