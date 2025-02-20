import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, Button, Portal, Modal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth/AuthContext';
import BackButton from '../../../components/common/BackButton';

interface OrderItem {
  item_id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  special_instructions: string | null;
  estimated_preparation_time: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  created_at: string;
}

export default function OrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('food_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '#FFA000';
      case 'preparing':
        return '#1976D2';
      case 'ready':
        return '#43A047';
      case 'completed':
        return '#424242';
      case 'cancelled':
        return '#D32F2F';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'preparing':
        return 'قيد التحضير';
      case 'ready':
        return 'جاهز للاستلام';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton style={styles.backButton} />
        </View>

        <Text style={styles.title}>طلباتي</Text>

        {/* Orders List */}
        <View style={styles.ordersList}>
          {orders.map((order) => (
            <Card 
              key={order.id} 
              style={styles.orderCard}
              onPress={() => setSelectedOrder(order)}
            >
              <Card.Content style={styles.orderContent}>
                <View style={styles.orderHeader}>
                  <Chip 
                    mode="flat"
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(order.status) }
                    ]}
                    textStyle={styles.statusText}
                  >
                    {getStatusText(order.status)}
                  </Chip>
                  <Text style={styles.orderDate}>
                    {formatDate(order.created_at)}
                  </Text>
                </View>

                <View style={styles.orderItems}>
                  {order.items.map((item, index) => (
                    <Text key={index} style={styles.orderItem}>
                      {item.quantity}x {item.name}
                    </Text>
                  ))}
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.totalAmount}>
                    المجموع: {order.total_amount} ₪
                  </Text>
                  {order.status === 'preparing' && (
                    <Text style={styles.preparationTime}>
                      وقت التحضير المتبقي: {order.estimated_preparation_time} دقائق
                    </Text>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Order Details Modal */}
      <Portal>
        <Modal
          visible={!!selectedOrder}
          onDismiss={() => setSelectedOrder(null)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedOrder && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>تفاصيل الطلب</Text>
                <Chip 
                  mode="flat"
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(selectedOrder.status) }
                  ]}
                  textStyle={styles.statusText}
                >
                  {getStatusText(selectedOrder.status)}
                </Chip>
              </View>

              <Text style={styles.modalDate}>
                {formatDate(selectedOrder.created_at)}
              </Text>

              <View style={styles.modalItems}>
                {selectedOrder.items.map((item, index) => (
                  <View key={index} style={styles.modalItem}>
                    <View style={styles.modalItemInfo}>
                      <Text style={styles.modalItemName}>{item.name}</Text>
                      <Text style={styles.modalItemQuantity}>
                        {item.quantity}x
                      </Text>
                    </View>
                    <Text style={styles.modalItemPrice}>
                      {item.subtotal} ₪
                    </Text>
                  </View>
                ))}
              </View>

              {selectedOrder.special_instructions && (
                <View style={styles.modalInstructions}>
                  <Text style={styles.modalInstructionsTitle}>
                    تعليمات خاصة:
                  </Text>
                  <Text style={styles.modalInstructionsText}>
                    {selectedOrder.special_instructions}
                  </Text>
                </View>
              )}

              <View style={styles.modalTotal}>
                <Text style={styles.modalTotalText}>المجموع:</Text>
                <Text style={styles.modalTotalAmount}>
                  {selectedOrder.total_amount} ₪
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={() => setSelectedOrder(null)}
                style={styles.modalButton}
              >
                إغلاق
              </Button>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  backButton: {
    marginRight: 'auto',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#000',
  },
  ordersList: {
    gap: 16,
  },
  orderCard: {
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderContent: {
    gap: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderItems: {
    gap: 4,
  },
  orderItem: {
    fontSize: 14,
  },
  orderFooter: {
    gap: 4,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  preparationTime: {
    fontSize: 14,
    color: '#1976D2',
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  modalItems: {
    gap: 12,
    marginBottom: 24,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalItemName: {
    fontSize: 16,
  },
  modalItemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalInstructions: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  modalInstructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInstructionsText: {
    fontSize: 14,
    color: '#666',
  },
  modalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTotalText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalTotalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalButton: {
    borderRadius: 12,
  },
}); 