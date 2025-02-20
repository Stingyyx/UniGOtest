import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';

export default function SplashScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace('/(app)/home' as const);
      } else {
        router.replace('/(auth)/login' as const);
      }
    }
  }, [session, loading]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>يوني جو | UniGo</Text>
      <Text style={styles.subtitle}>رفيقك في الحرم الجامعي</Text>
      <ActivityIndicator size="large" color="#000" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  loader: {
    marginTop: 24,
  },
}); 