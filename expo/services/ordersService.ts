import { supabase } from '@/lib/supabase';
import { FullOrder, OrderStatus } from '@/types';

// ─── DB row types ────────────────────────────────────────────
type OrderRow = {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  pickup_time: string;
  notes: string | null;
  placed_at: string;
  status_updated_at: string;
  ready_at: string | null;
  completed_at: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  price_snapshot: number;
  quantity: number;
  customizations: string | null;
  line_total: number;
};

type OrderWithItems = OrderRow & {
  order_items: OrderItemRow[];
};

// ─── Helpers ─────────────────────────────────────────────────

function rowToFullOrder(row: OrderWithItems): FullOrder {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    status: row.status,
    total: row.total,
    discount: row.discount,
    pickupTime: row.pickup_time,
    notes: row.notes ?? undefined,
    date: row.placed_at,
    statusUpdatedAt: row.status_updated_at,
    readyAt: row.ready_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    items: row.order_items.map((oi) => ({
      itemId: oi.menu_item_id,
      itemName: oi.item_name,
      price: oi.price_snapshot,
      quantity: oi.quantity,
      customizations: oi.customizations ?? undefined,
    })),
  };
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Place a new order with its items in a single transaction.
 */
export async function placeOrder(
  order: Omit<FullOrder, 'date' | 'statusUpdatedAt'>,
  userId?: string
): Promise<FullOrder> {
  const subtotal = order.total + order.discount;

  // 1. Insert the order
  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .insert({
      id: order.id,
      user_id: userId ?? null,
      customer_name: order.customerName ?? '',
      customer_phone: order.customerPhone ?? '',
      status: order.status,
      subtotal,
      discount: order.discount,
      total: order.total,
      pickup_time: order.pickupTime,
      notes: order.notes ?? null,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 2. Insert order items
  const itemRows = order.items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.itemId,
    item_name: item.itemName,
    price_snapshot: item.price,
    quantity: item.quantity,
    customizations: item.customizations ?? null,
    line_total: item.price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemRows);

  if (itemsError) throw itemsError;

  return {
    ...order,
    date: orderRow.placed_at,
    statusUpdatedAt: orderRow.status_updated_at,
  };
}

/**
 * Fetch active orders (placed, preparing, ready) — used by staff dashboard.
 * Sorted FIFO (oldest first = most urgent).
 */
export async function fetchActiveOrders(): Promise<FullOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .in('status', ['placed', 'preparing', 'ready'])
    .order('placed_at', { ascending: true });

  if (error) throw error;
  return (data as OrderWithItems[]).map(rowToFullOrder);
}

/**
 * Fetch order history for a specific user — newest first.
 */
export async function fetchUserOrders(userId: string): Promise<FullOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('placed_at', { ascending: false });

  if (error) throw error;
  return (data as OrderWithItems[]).map(rowToFullOrder);
}

/**
 * Fetch all orders (for admin analytics). Supports pagination.
 */
export async function fetchAllOrders(
  page = 0,
  pageSize = 50
): Promise<{ orders: FullOrder[]; count: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('orders')
    .select('*, order_items(*)', { count: 'exact' })
    .order('placed_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return {
    orders: (data as OrderWithItems[]).map(rowToFullOrder),
    count: count ?? 0,
  };
}

/**
 * Update order status. The DB trigger handles timestamp updates.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<FullOrder> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select('*, order_items(*)')
    .single();

  if (error) throw error;
  return rowToFullOrder(data as OrderWithItems);
}

/**
 * Fetch a single order by ID with its items.
 */
export async function fetchOrderById(orderId: string): Promise<FullOrder | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  return rowToFullOrder(data as OrderWithItems);
}

/**
 * Subscribe to real-time order changes (for staff dashboard).
 * Returns an unsubscribe function.
 */
export function subscribeToOrders(
  onInsert: (order: FullOrder) => void,
  onUpdate: (order: FullOrder) => void
) {
  const channel = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      async (payload) => {
        // Fetch full order with items
        const full = await fetchOrderById(payload.new.id as string);
        if (full) onInsert(full);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      async (payload) => {
        const full = await fetchOrderById(payload.new.id as string);
        if (full) onUpdate(full);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get "Your Usual" — most ordered items (3+ times) for a user.
 * Uses the DB function for optimized query.
 */
export async function getUserUsual(userId: string) {
  const { data, error } = await supabase.rpc('get_user_usual', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data as {
    menu_item_id: string;
    item_name: string;
    order_count: number;
    last_customizations: string | null;
  }[];
}
