import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';

interface BackButtonProps {
  style?: StyleProp<ViewStyle>;
}

export default function BackButton({ style }: BackButtonProps) {
  const router = useRouter();

  return (
    <IconButton
      icon="arrow-right"
      mode="contained"
      onPress={() => router.back()}
      style={style}
    />
  );
} 