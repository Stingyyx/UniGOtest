import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  I18nManager,
  TextInput
} from 'react-native';
import {
  Text,
  Avatar,
  ActivityIndicator,
  IconButton,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../../lib/auth/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../../lib/i18n/LanguageContext';
import { DefaultAvatar } from '../../../../assets';

type MessageStatus = 'sending' | 'sent' | 'error';

type Message = {
  id: string;
  ride_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  status?: MessageStatus;
  sender: {
    full_name: string;
    avatar_url: string | null;
    is_driver?: boolean;
  };
};

type RideDetails = {
  id: string;
  driver_id: string;
  status: 'active' | 'full' | 'cancelled' | 'completed';
  driver: {
    full_name: string;
    avatar_url: string | null;
  };
};

type RequestUpdate = {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const subscriptionRef = useRef<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
  const messageQueue = useRef<{ content: string; timestamp: Date }[]>([]);
  const typingTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadData();
    setupRealtime();
    return () => {
      cleanupChat();
    };
  }, []);

  const setupRealtime = () => {
    try {
      // Subscribe to ride changes and new messages
      subscriptionRef.current = supabase
        .channel(`ride_chat_${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rides',
            filter: `id=eq.${id}`
          },
          (payload) => {
            if (payload.new) {
              setRide(prev => prev ? { ...prev, ...payload.new as RideDetails } : null);
              // Recheck permission when ride changes
              checkPermission();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ride_requests',
            filter: `ride_id=eq.${id}`,
          },
          (payload) => {
            if (payload.new && user && (payload.new as RequestUpdate).passenger_id === user.id) {
              // Recheck permission when user's request status changes
              checkPermission();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `ride_id=eq.${id}`
          },
          async (payload) => {
            if (payload.new) {
              // Load the new message with sender details
              const { data: messageData, error } = await supabase
                .from('messages')
                .select(`
                  *,
                  sender:profiles(full_name, avatar_url)
                `)
                .eq('id', payload.new.id)
                .single();

              if (!error && messageData) {
                setMessages(prev => [...prev, messageData]);
                // Scroll to bottom
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error setting up real-time:', error);
      setError(t('transport.chat.errorRealtime'));
    }
  };

  const cleanupChat = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load ride details
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select(`
          id,
          driver_id,
          status,
          driver:profiles!inner(full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (rideError) throw rideError;
      
      const transformedRide: RideDetails = {
        id: rideData.id,
        driver_id: rideData.driver_id,
        status: rideData.status,
        driver: rideData.driver[0]
      };
      
      setRide(transformedRide);

      // Load messages
      await loadMessages();
    } catch (error: any) {
      console.error('Error loading chat data:', error);
      setError(error.message || t('transport.chat.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(full_name, avatar_url)
        `)
        .eq('ride_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Scroll to bottom after messages load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setError(error.message || t('transport.chat.errorLoading'));
    }
  };

  // Check if user has permission to access chat
  const checkPermission = async () => {
    if (!user || !ride) return false;

    try {
      // Check if user is driver
      if (ride.driver_id === user.id) {
        setHasPermission(true);
        return true;
      }

      // Check if user is accepted passenger
      const { data: request, error } = await supabase
        .from('ride_requests')
        .select('status')
        .eq('ride_id', id)
        .eq('passenger_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No request found
          setHasPermission(false);
          return false;
        }
        throw error;
      }

      const hasAccess = request?.status === 'accepted';
      setHasPermission(hasAccess);
      return hasAccess;
    } catch (error) {
      console.error('Error checking permission:', error);
      setHasPermission(false);
      return false;
    }
  };

  useEffect(() => {
    checkPermission();
  }, [ride, user]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    setIsTyping(true);
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  }, []);

  // Validate message before sending
  const validateMessage = (message: string): string | null => {
    if (!message.trim()) {
      return t('transport.chat.errorEmptyMessage');
    }
    if (message.length > 500) {
      return t('transport.chat.errorMessageTooLong');
    }
    if (lastSentTime && new Date().getTime() - lastSentTime.getTime() < 500) {
      return t('transport.chat.errorTooManyMessages');
    }
    if (!hasPermission) {
      return t('transport.chat.errorNoPermission');
    }
    if (ride?.status === 'cancelled' || ride?.status === 'completed') {
      return t('transport.chat.errorRideEnded');
    }
    return null;
  };

  const handleSend = async () => {
    if (!user || !ride || !newMessage.trim()) return;

    const validationError = validateMessage(newMessage);
    if (validationError) {
      Alert.alert(t('common.error'), validationError);
      return;
    }

    try {
      setSending(true);
      setError(null);

      const messageContent = newMessage.trim();
      
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        ride_id: id as string,
        sender_id: user.id,
        content: messageContent,
        created_at: new Date().toISOString(),
        status: 'sending',
        sender: {
          full_name: user.email || '',
          avatar_url: null,
          is_driver: ride.driver_id === user.id
        }
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      inputRef.current?.clear();

      // Send message to database
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            ride_id: id,
            sender_id: user.id,
            content: messageContent
          }
        ])
        .select(`
          *,
          sender:profiles(full_name, avatar_url)
        `)
        .single();

      if (messageError) throw messageError;

      // Update the optimistic message with real data
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? messageData : msg
        )
      );

      // Update last sent time
      setLastSentTime(new Date());

    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || t('transport.chat.errorSending'));
      Alert.alert(t('common.error'), t('transport.chat.errorSending'));

      // Update optimistic message to show error
      setMessages(prev => 
        prev.map(msg => 
          msg.id.startsWith('temp-') 
            ? { ...msg, status: 'error' }
            : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const isDriver = item.sender.is_driver || item.sender_id === ride?.driver_id;
    const messageDate = new Date(item.created_at);
    const formattedTime = format(messageDate, 'h:mm a');

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <View>
            <Avatar.Image
              size={40}
              source={item.sender.avatar_url ? { uri: item.sender.avatar_url } : DefaultAvatar}
              style={styles.avatar}
            />
            {isDriver && (
              <View style={styles.driverBadge}>
                <MaterialCommunityIcons name="steering" size={12} color="#fff" />
              </View>
            )}
          </View>
        )}
        <View style={[
          styles.messageContent,
          isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent,
          item.status === 'sending' && styles.sendingMessage,
          item.status === 'error' && styles.errorMessage
        ]}>
          {!isOwnMessage && (
            <Text style={[
              styles.senderName,
              isDriver && styles.driverName
            ]}>
              {item.sender.full_name}
              {isDriver && ` (${t('transport.chat.driver')})`}
            </Text>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={styles.timeText}>{formattedTime}</Text>
            {item.status === 'sending' && (
              <ActivityIndicator size={12} color="#666" style={styles.sendingIndicator} />
            )}
            {item.status === 'error' && (
              <MaterialCommunityIcons name="alert-circle" size={12} color="#FF3B30" />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadData} style={styles.retryButton}>
          {t('common.retry')}
        </Button>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {user?.id === ride?.driver_id 
            ? t('transport.chat.noAcceptedPassengers')
            : t('transport.chat.noPermission')}
        </Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.retryButton}>
          {t('common.back')}
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons 
            name="arrow-left"
            size={24} 
            color="#000" 
          />
          <Text style={styles.backText}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('transport.chat.title')}</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('transport.chat.noMessages')}</Text>
            </View>
          }
        />

        {(ride?.status === 'cancelled' || ride?.status === 'completed') ? (
          <View style={styles.endedContainer}>
            <Text style={styles.endedText}>
              {ride.status === 'completed' 
                ? t('transport.chat.rideCompleted')
                : t('transport.chat.rideCancelled')
              }
            </Text>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              value={newMessage}
              onChangeText={(text) => {
                setNewMessage(text);
                handleTyping();
              }}
              placeholder={t('transport.chat.typeMessage')}
              style={styles.input}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <IconButton
              icon="send"
              size={24}
              onPress={handleSend}
              disabled={sending || !newMessage.trim()}
              loading={sending}
              style={styles.sendButton}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 8
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 40
  },
  content: {
    flex: 1
  },
  messagesList: {
    padding: 16
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%'
  },
  ownMessage: {
    alignSelf: 'flex-end'
  },
  otherMessage: {
    alignSelf: 'flex-start'
  },
  avatar: {
    marginRight: 8
  },
  messageContent: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%'
  },
  ownMessageContent: {
    backgroundColor: '#000',
    borderTopRightRadius: 4
  },
  otherMessageContent: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 4
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  messageText: {
    fontSize: 16,
    color: '#000'
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    textAlign: 'left'
  },
  sendButton: {
    margin: 0,
    backgroundColor: '#000'
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#000'
  },
  driverBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#000',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  driverName: {
    color: '#000',
    fontWeight: '600'
  },
  sendingMessage: {
    opacity: 0.7
  },
  errorMessage: {
    borderColor: '#FF3B30',
    borderWidth: 1
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4
  },
  sendingIndicator: {
    marginLeft: 4
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  endedContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  endedText: {
    fontSize: 16,
    color: '#666'
  },
  ownMessageText: {
    color: '#fff'
  },
  otherMessageText: {
    color: '#000'
  }
}); 