import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Link, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth/AuthContext';
import BackButton from '../../components/common/BackButton';

type Feature = {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  href: string;
};

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();

  const features: Feature[] = [
    {
      id: 'transport',
      title: 'المواصلات',
      icon: 'car',
      href: '/(app)/(transport)',
    },
    {
      id: 'food',
      title: 'الطعام',
      icon: 'food',
      href: '/(app)/food',
    },
    {
      id: 'study',
      title: 'الدراسة والأكاديمية',
      icon: 'book',
      href: '/(app)/study',
    },
    {
      id: 'university',
      title: 'أخبار الجامعة',
      icon: 'account-group',
      href: '/(app)/social',
    },
    {
      id: 'notifications',
      title: 'الإشعارات',
      icon: 'bell-badge',
      href: '/(app)/notifications',
    },
    {
      id: 'profile',
      title: 'الملف الشخصي',
      icon: 'account',
      href: '/(app)/profile',
    },
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={toggleLanguage} style={styles.langButton}>
              <MaterialCommunityIcons name="translate" size={28} color="#000" />
              <Text style={styles.langText}>{i18n.language === 'ar' ? 'English' : 'عربي'}</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <BackButton />
          ),
        }}
      />

      <View style={styles.header}>
        <Text style={styles.logo}>UniGO | يوني جو</Text>
        <Text style={styles.welcome}>مرحباً {user?.user_metadata?.username || 'Izza3068'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.grid}>
          {features.map((feature) => (
            <Link href={feature.href as any} key={feature.id} asChild>
              <TouchableOpacity style={styles.card}>
                <MaterialCommunityIcons name={feature.icon} size={64} color="#000" />
                <Text style={styles.cardTitle}>{feature.title}</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 40 : 60,
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: '#fff',
    marginBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  welcome: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  content: {
    flex: 1,
    padding: 12,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    justifyContent: 'flex-start',
    marginBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    width: '48.5%',
    aspectRatio: 0.85,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#000',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  langText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
}); 