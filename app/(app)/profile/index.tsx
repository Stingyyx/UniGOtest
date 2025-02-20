import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, I18nManager } from 'react-native';
import { Text, Avatar, Button, Card, useTheme, ActivityIndicator, Portal, Dialog, Divider, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Link, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useLanguage } from '../../../lib/i18n/LanguageContext';
import { supabase } from '../../../lib/supabase';
import { DefaultAvatar } from '../../../assets';

type Gender = 'male' | 'female' | 'other';

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  gender: Gender | null;
  college_id: string | null;
  created_at: string;
  updated_at: string;
};

const GENDER_ICONS: Record<Gender, keyof typeof MaterialCommunityIcons.glyphMap> = {
  male: 'gender-male',
  female: 'gender-female',
  other: 'gender-male-female'
};

const GENDER_COLORS: Record<Gender, string> = {
  male: '#2196F3',
  female: '#E91E63',
  other: '#4CAF50'
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const { isRTL } = useLanguage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signOutLoading, setSignOutLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, username, email, avatar_url, gender, college_id, created_at, updated_at')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          const baseUsername = user.email?.split('@')[0] || '';
          let username = baseUsername;
          let counter = 1;

          while (true) {
            const { data: existingUser } = await supabase
              .from('profiles')
              .select('username')
              .eq('username', username)
              .single();

            if (!existingUser) break;
            username = `${baseUsername}${counter}`;
            counter++;
          }

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: user.email,
              username: username,
              full_name: user.email?.split('@')[0] || null,
              gender: null,
              avatar_url: null
            }])
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
        } else {
          throw fetchError;
        }
      } else {
        setProfile(existingProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(t('common.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSignOutLoading(true);
      await signOut();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setSignOutLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              size={120}
              source={profile?.avatar_url ? { uri: profile.avatar_url } : DefaultAvatar}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialCommunityIcons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.name}>{profile?.full_name || t('personal.name')}</Text>
            <Text style={styles.username}>@{profile?.username}</Text>
            <Text style={styles.email}>{profile?.email || user?.email}</Text>
            {profile?.college_id && (
              <Text style={styles.collegeId}>
                {t('personal.profile.collegeId')}: {profile.college_id}
              </Text>
            )}
            {profile?.gender && (
              <Chip 
                mode="outlined"
                style={[styles.genderChip, { borderColor: GENDER_COLORS[profile.gender as Gender] }]}
                textStyle={{ color: GENDER_COLORS[profile.gender as Gender] }}
                icon={() => (
                  <MaterialCommunityIcons 
                    name={GENDER_ICONS[profile.gender as Gender]} 
                    size={20} 
                    color={GENDER_COLORS[profile.gender as Gender]} 
                  />
                )}
              >
                {t(`personal.profile.gender.${profile.gender}`)}
              </Chip>
            )}
          </View>

          <Link href="/(app)/profile/edit" asChild>
            <Button 
              mode="contained" 
              icon={isRTL ? undefined : "account-edit"}
              style={styles.editButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              {...(isRTL && { 
                children: (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.buttonLabel, { marginLeft: 8 }]}>
                      {t('personal.profile.editProfile')}
                    </Text>
                    <MaterialCommunityIcons name="account-edit" size={20} color="#fff" />
                  </View>
                )
              })}
            >
              {!isRTL && t('personal.profile.editProfile')}
            </Button>
          </Link>
        </Card>

        {/* Settings Card */}
        <Card style={styles.settingsCard}>
          <Card.Title
            title={t('personal.settings.title')}
            titleStyle={styles.settingsTitle}
            left={(props) => <MaterialCommunityIcons name="cog" size={24} color="#000" />}
          />
          <Divider style={styles.divider} />
          <Card.Content>
            {/* Notifications Setting */}
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <MaterialCommunityIcons name="bell-outline" size={24} color="#000" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingText}>{t('personal.settings.push')}</Text>
                <View style={styles.settingBadges}>
                  <Chip 
                    mode="outlined" 
                    style={styles.settingBadge}
                    textStyle={{ color: '#4CAF50' }}
                  >
                    {t('personal.settings.notifications.pushEnabled')}
                  </Chip>
                </View>
              </View>
              <MaterialCommunityIcons 
                name={isRTL ? "chevron-right" : "chevron-left"} 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>

            {/* Theme Setting */}
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <MaterialCommunityIcons name="theme-light-dark" size={24} color="#000" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingText}>{t('personal.settings.theme')}</Text>
                <Text style={styles.settingValue}>{t('personal.settings.light')}</Text>
              </View>
              <MaterialCommunityIcons 
                name={isRTL ? "chevron-right" : "chevron-left"} 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Account Actions */}
        <Card style={styles.accountCard}>
          <Card.Title
            title={t('personal.settings.account.title')}
            titleStyle={styles.settingsTitle}
            left={(props) => <MaterialCommunityIcons name="account-cog" size={24} color="#000" />}
          />
          <Divider style={styles.divider} />
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleSignOut}
              loading={signOutLoading}
              style={styles.signOutButton}
              contentStyle={styles.signOutButtonContent}
              icon={({ size, color }) => (
                <MaterialCommunityIcons 
                  name="logout" 
                  size={20} 
                  color="#FF3B30" 
                  style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                />
              )}
              labelStyle={styles.signOutButtonLabel}
            >
              {t('personal.settings.account.signOut')}
            </Button>
            
            <Button
              mode="outlined"
              style={styles.deleteAccountButton}
              contentStyle={styles.deleteAccountButtonContent}
              icon="account-remove"
              labelStyle={styles.deleteAccountButtonLabel}
            >
              {t('personal.settings.account.deleteAccount')}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Loading Dialog */}
      <Portal>
        <Dialog visible={signOutLoading} dismissable={false}>
          <Dialog.Content style={styles.loadingContent}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>{t('common.pleaseWait')}</Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500'
  },
  content: {
    flex: 1,
    padding: 16
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    color: '#000'
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  },
  editButton: {
    marginTop: 16,
    backgroundColor: '#000',
    borderRadius: 12
  },
  buttonContent: {
    height: 48
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  settingsCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden'
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right'
  },
  divider: {
    backgroundColor: '#E5E7EB',
    height: 1
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500'
  },
  settingValue: {
    fontSize: 16,
    color: '#666'
  },
  signOutButton: {
    marginTop: 8,
    marginBottom: 32,
    borderColor: '#FF3B30',
    borderRadius: 12
  },
  signOutButtonContent: {
    height: 48
  },
  signOutButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30'
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000'
  },
  genderChip: {
    marginTop: 8,
    backgroundColor: 'transparent'
  },
  settingBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  settingBadge: {
    backgroundColor: 'transparent',
    borderColor: '#4CAF50',
  },
  accountCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden'
  },
  deleteAccountButton: {
    marginTop: 8,
    borderColor: '#FF3B30',
    borderRadius: 12
  },
  deleteAccountButtonContent: {
    height: 48
  },
  deleteAccountButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30'
  },
  collegeId: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Arial'
  }
}); 