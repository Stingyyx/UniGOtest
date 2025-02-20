import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Link, useRouter, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../../lib/i18n/LanguageContext';
import { useTranslation } from 'react-i18next';
import BackButton from '../../../components/common/BackButton';

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const GRID_SPACING = 20;
const ITEM_WIDTH = (width - GRID_PADDING * 2 - GRID_SPACING) / 2;

export default function TransportIndex() {
  return <Redirect href="/(app)/(transport)/bus-alerts" />;
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: GRID_PADDING,
    gap: GRID_SPACING,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gridItem: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    elevation: 3
  },
  itemText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: '#000'
  }
}); 