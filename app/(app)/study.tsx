import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const PADDING = 16;
const CARD_WIDTH = (width - (PADDING * 3)) / 2;

const studyOptions: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  titleAr: string;
}[] = [
  {
    icon: 'book',
    titleAr: 'طلب كتب',
  },
  {
    icon: 'book-open-page-variant',
    titleAr: 'استعارة كتب',
  },
  {
    icon: 'bell',
    titleAr: 'تنبيهات الامتحانات',
  }
];

export default function StudyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.languageButton}>
          <Text style={styles.languageText}>English</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>العودة</Text>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>الدراسة والمساعدات</Text>

      <View style={styles.grid}>
        {studyOptions.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.card}
            onPress={() => {/* Handle navigation */}}
          >
            <MaterialCommunityIcons name={option.icon} size={48} color="#000" />
            <Text style={styles.optionTitle}>{option.titleAr}</Text>
          </TouchableOpacity>
        ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: PADDING,
    paddingTop: 48,
  },
  languageButton: {
    padding: 8,
  },
  languageText: {
    fontSize: 16,
    color: '#666',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'right',
    padding: PADDING,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: PADDING,
    gap: PADDING,
  },
  card: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
  },
  optionTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 