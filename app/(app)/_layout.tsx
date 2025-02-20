import { Redirect, Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth/AuthContext';

type TabBarIconProps = {
  focused: boolean;
  color: string;
};

export default function AppLayout() {
  const { session } = useAuth();

  // Redirect to auth if not authenticated
  if (!session) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 85,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#fff',
          paddingBottom: 15,
          paddingTop: 15,
          justifyContent: 'space-evenly'
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666'
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused, color }: TabBarIconProps) => (
            <MaterialCommunityIcons 
              name={focused ? "home" : "home-outline"} 
              size={32} 
              color={color} 
            />
          )
        }}
      />
      <Tabs.Screen
        name="(transport)"
        options={{
          tabBarIcon: ({ focused, color }: TabBarIconProps) => (
            <MaterialCommunityIcons 
              name="car" 
              size={32} 
              color={color} 
            />
          ),
          href: "/(app)/(transport)",
          tabBarLabel: () => null
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          tabBarIcon: ({ focused, color }: TabBarIconProps) => (
            <MaterialCommunityIcons 
              name="food" 
              size={32} 
              color={color} 
            />
          )
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          tabBarIcon: ({ focused, color }: TabBarIconProps) => (
            <MaterialCommunityIcons 
              name="book" 
              size={32} 
              color={color} 
            />
          )
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: ({ focused, color }: TabBarIconProps) => (
            <MaterialCommunityIcons 
              name="account-group" 
              size={32} 
              color={color} 
            />
          )
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused, color }: TabBarIconProps) => (
            <MaterialCommunityIcons 
              name="bell-badge" 
              size={32} 
              color={color} 
            />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }: TabBarIconProps) => (
            <MaterialCommunityIcons 
              name="account" 
              size={32} 
              color={color} 
            />
          ),
          headerShown: false,
          tabBarLabel: () => null
        }}
      />
    </Tabs>
  );
} 