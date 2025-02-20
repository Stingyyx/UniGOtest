import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Text, TextInput, Button, useTheme, RadioButton, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAuth } from '../../../lib/auth/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const FORM_PADDING = 20;

export default function OfferRideScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    currentLocation: '',
    destination: '',
    departureTime: new Date(),
    seats: '',
    gender: 'any' as 'any' | 'male' | 'female',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add time validation
  const validateDepartureTime = (time: Date) => {
    const now = new Date();
    const minTime = new Date(now.getTime() + 15 * 60000); // 15 minutes from now
    const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60000); // 7 days from now
    
    if (time < minTime) {
      return 'وقت الانطلاق يجب أن يكون بعد 15 دقيقة على الأقل من الآن';
    }
    
    if (time > maxTime) {
      return 'وقت الانطلاق يجب أن يكون خلال 7 أيام من الآن';
    }
    
    return null;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentTime = formData.departureTime;
      selectedDate.setHours(currentTime.getHours());
      selectedDate.setMinutes(currentTime.getMinutes());
      
      const timeError = validateDepartureTime(selectedDate);
      if (timeError) {
        setError(timeError);
        return;
      }
      
      setFormData(prev => ({ ...prev, departureTime: selectedDate }));
      setError(null);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(formData.departureTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      
      const timeError = validateDepartureTime(newDateTime);
      if (timeError) {
        setError(timeError);
        return;
      }
      
      setFormData(prev => ({ ...prev, departureTime: newDateTime }));
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('يجب تسجيل الدخول لإنشاء رحلة');
      return;
    }

    // Validate required fields
    if (!formData.currentLocation.trim()) {
      setError('يرجى تحديد نقطة الانطلاق');
      return;
    }

    if (!formData.destination.trim()) {
      setError('يرجى تحديد الوجهة');
      return;
    }

    if (!formData.seats || parseInt(formData.seats) < 1) {
      setError('يرجى تحديد عدد المقاعد المتاحة');
      return;
    }

    const seatsCount = parseInt(formData.seats);
    if (seatsCount > 20) {
      setError('الحد الأقصى للمقاعد هو 20 مقعد');
      return;
    }

    // Validate departure time
    const timeError = validateDepartureTime(formData.departureTime);
    if (timeError) {
      setError(timeError);
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);

      // Check if user already has an active ride
      const { data: existingRides, error: checkError } = await supabase
        .from('rides')
        .select('id, status')
        .eq('driver_id', user.id)
        .in('status', ['active', 'full'])
        .limit(1);

      if (checkError) throw checkError;

      if (existingRides && existingRides.length > 0) {
        setError('لا يمكنك إنشاء رحلة جديدة حتى تكتمل أو تلغي رحلتك الحالية');
        return;
      }
      
      const rideData = {
        driver_id: user.id,
        from_location: formData.currentLocation.trim(),
        to_location: formData.destination.trim(),
        departure_time: formData.departureTime.toISOString(),
        available_seats: seatsCount,
        total_seats: seatsCount,
        gender_preference: formData.gender,
        status: 'active',
        description: formData.description.trim() || null
      };

      const { data, error } = await supabase
        .from('rides')
        .insert([rideData])
        .select()
        .single();

      if (error) throw error;
      
      Alert.alert('تم', 'تم إنشاء الرحلة بنجاح', [
        {
          text: 'موافق',
          onPress: () => {
            setFormData({
              currentLocation: '',
              destination: '',
              departureTime: new Date(),
              seats: '',
              gender: 'any',
              description: ''
            });
            router.replace('/(app)/(transport)/rideshare');
          }
        }
      ]);
    } catch (error) {
      console.error('[Cursor] Error creating ride:', error);
      setError('حدث خطأ أثناء إنشاء الرحلة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>العودة</Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.languageText}>English</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{t('transport.offerRide')}</Text>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          keyboardDismissMode="interactive"
        >
          <Card style={styles.formCard}>
            <Card.Content style={styles.form}>
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              <TextInput
                mode="outlined"
                label="الموقع الحالي"
                value={formData.currentLocation}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, currentLocation: text }));
                  setError(null);
                }}
                style={styles.input}
                right={<TextInput.Icon icon="map-marker" />}
                error={!!error && !formData.currentLocation.trim()}
              />

              <TextInput
                mode="outlined"
                label="الوجهة النهائية"
                value={formData.destination}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, destination: text }));
                  setError(null);
                }}
                style={styles.input}
                right={<TextInput.Icon icon="map-marker-check" />}
                error={!!error && !formData.destination.trim()}
              />

              <View style={styles.timeSection}>
                <Text style={styles.timeSectionTitle}>موعد الانطلاق</Text>
                
                <View style={styles.timeButtons}>
                  <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)}
                    style={styles.timeButton}
                  >
                    <Text style={styles.timeLabel}>التاريخ</Text>
                    <View style={styles.timeValue}>
                      <Text style={styles.timeValueText}>
                        {formData.departureTime.toLocaleDateString('ar-SA')}
                      </Text>
                      <MaterialCommunityIcons name="calendar" size={24} color="#666" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => setShowTimePicker(true)}
                    style={styles.timeButton}
                  >
                    <Text style={styles.timeLabel}>الوقت</Text>
                    <View style={styles.timeValue}>
                      <Text style={styles.timeValueText}>
                        {formData.departureTime.toLocaleTimeString('ar-SA', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </Text>
                      <MaterialCommunityIcons name="clock-outline" size={24} color="#666" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.departureTime}
                  mode="date"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  maximumDate={new Date(Date.now() + 7 * 24 * 60 * 60000)}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={formData.departureTime}
                  mode="time"
                  onChange={handleTimeChange}
                  minuteInterval={5}
                />
              )}

              <TextInput
                mode="outlined"
                label={t('transport.availableSeats')}
                value={formData.seats}
                onChangeText={(text) => {
                  // Only allow numbers 1-20
                  const num = parseInt(text);
                  if (text === '' || (num >= 1 && num <= 20)) {
                    setFormData(prev => ({ ...prev, seats: text }));
                    setError(null);
                  }
                }}
                keyboardType="numeric"
                style={styles.input}
                right={<TextInput.Icon icon="seat" />}
                maxLength={2}
                error={!!error && (!formData.seats || parseInt(formData.seats) < 1)}
              />

              <View style={styles.genderSection}>
                <Text style={styles.genderLabel}>{t('transport.genderPreference')}</Text>
                <RadioButton.Group
                  onValueChange={value => {
                    setFormData(prev => ({ ...prev, gender: value as 'any' | 'male' | 'female' }));
                    setError(null);
                  }}
                  value={formData.gender}
                >
                  <View style={styles.radioRow}>
                    <RadioButton.Item label={t('transport.any')} value="any" />
                    <RadioButton.Item label={t('transport.male')} value="male" />
                    <RadioButton.Item label={t('transport.female')} value="female" />
                  </View>
                </RadioButton.Group>
              </View>

              <TextInput
                mode="outlined"
                label={t('transport.notes')}
                value={formData.description}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, description: text }));
                  setError(null);
                }}
                multiline
                numberOfLines={3}
                style={styles.input}
                right={<TextInput.Icon icon="note-text" />}
              />

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                style={styles.submitButton}
              >
                {t('transport.createRide')}
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backText: {
    marginRight: 8
  },
  languageText: {
    color: '#666'
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'right',
    padding: 16,
    paddingBottom: 24
  },
  content: {
    flex: 1,
    paddingHorizontal: FORM_PADDING,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 24,
  },
  form: {
    gap: 16
  },
  input: {
    backgroundColor: '#fff'
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8
  },
  dateButtonText: {
    fontSize: 16
  },
  genderSection: {
    gap: 8
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '500'
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 8
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'right',
    fontSize: 14
  },
  timeSection: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  timeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
    marginBottom: 8,
  },
  timeButtons: {
    gap: 12,
  },
  timeButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
  },
  timeValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeValueText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
}); 