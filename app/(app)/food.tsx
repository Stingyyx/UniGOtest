import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Text, SegmentedButtons, Card, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import BackButton from '../../components/common/BackButton';

type FoodTab = 'preorder' | 'orders' | 'restaurants' | 'ratings';

export default function FoodScreen() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<FoodTab>('preorder');

  const foodServices = [
    {
      id: 'preorder',
      title: 'اطلب الآن',
      description: 'اطلب طعامك مسبقاً من الكافتيريا',
      icon: 'food',
      route: '/food/preorder'
    },
    {
      id: 'orders',
      title: 'طلباتي',
      description: 'تتبع حالة طلباتك',
      icon: 'clipboard-list',
      route: '/food/orders'
    },
    {
      id: 'restaurants',
      title: 'المطاعم',
      description: 'استعرض المطاعم القريبة',
      icon: 'store',
      route: '/food/restaurants'
    },
    {
      id: 'ratings',
      title: 'التقييمات',
      description: 'قيم خدمات الطعام',
      icon: 'star',
      route: '/food/ratings'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton style={styles.backButton} />
        </View>

        <Text style={styles.title}>الطعام</Text>

        {/* Service Cards */}
        <View style={styles.servicesGrid}>
          {foodServices.map((service) => (
            <Link href={service.route} key={service.id} asChild>
              <Card style={styles.serviceCard}>
                <Card.Content style={styles.cardContent}>
                  <MaterialCommunityIcons
                    name={service.icon as any}
                    size={32}
                    color="#000"
                  />
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDescription}>
                    {service.description}
                  </Text>
                </Card.Content>
              </Card>
            </Link>
          ))}
        </View>
      </ScrollView>
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
  backButton: {
    marginRight: 'auto',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#000',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '47%',
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 