import React from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  Image,
  Dimensions,
  ScrollView
} from 'react-native';
import { Text } from 'react-native-paper';
import BackButton from '../../../components/common/BackButton';

const { width, height } = Dimensions.get('window');

export default function CampusMapScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
      </View>

      {/* Map Image in ScrollView for pinch zoom */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        maximumZoomScale={3}
        minimumZoomScale={1}
      >
        <Image
          source={require('../../../assets/images/map.png')}
          style={styles.mapImage}
          resizeMode="contain"
        />
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: {
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff'
  },
  scrollContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  mapImage: {
    width: width,
    height: height - 100,
    marginVertical: 20
  }
}); 