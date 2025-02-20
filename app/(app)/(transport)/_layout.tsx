import { Stack } from 'expo-router';
import { AuthProvider } from '../../../lib/auth/AuthContext';

export default function TransportLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="rideshare" />
        <Stack.Screen name="offer-ride" />
        <Stack.Screen name="ride/[id]" />
        <Stack.Screen name="bus-alerts" />
        <Stack.Screen name="campus-map" />
        <Stack.Screen name="chat/[id]" />
      </Stack>
    </AuthProvider>
  );
} 