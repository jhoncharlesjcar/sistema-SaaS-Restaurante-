import { supabase } from "@/lib/supabase";

// Re-export shared types or alias them
export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  kitchen_status: string;
  notes?: string;
  product?: any;
  // Legacy support (optional, for transition)
  plato_id?: string;
  cantidad?: number;
  precio_unitario?: number;
  estado?: string;
  notas?: string;
};

export interface Order {
  id: string;
  restaurant_id?: string;
  tenant_id?: string;
  table_id?: string;
  mozo_id?: string;
  user_id?: string;
  status: string;
  total: number;
  notes?: string;
  created_at: string;
  order_number?: string;
  order_items?: OrderItem[];
  mesas?: any;
  tables?: any;
  usuarios?: any;
}

export type CreateOrderInput = {
  tenant_id: string;
  table_id?: string;
  user_id: string;
  status?: string;
  total: number;
  subtotal: number;
  tax_amount: number;
  notes?: string;
  metadata?: Record<string, any>;
  items: any[]; // Using any to simplify mapping from OrderForm/SharedSchema
};

// Mappings are no longer needed as we use English consistently
export async function getOrders(
  tenantId: string,
  status?: string,
  tableId?: string,
): Promise<Order[]> {
  console.log("🔍 getOrders API: tenantId =", tenantId, "status =", status);

  let query = supabase
    .from("orders")
    .select("*, order_items(*, product:products(*)), table:tables(*)")
    .eq("restaurant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (tableId) query = query.eq("table_id", tableId);

  const { data, error } = await query;
  console.log("📦 getOrders API: returned", data?.length || 0, "orders");
  if (error) throw error;

  // Map for UI compatibility if needed, but schema should be aligned now
  return (data || []).map((o) => ({
    ...o,
    order_number: o.order_number || o.id.slice(-4).toUpperCase(),
    tables: o.table,
    order_items: (o.order_items || []).map((item: any) => ({
      ...item,
      product_name:
        item.product?.name ||
        item.product_name ||
        `Product #${item.product_id?.slice(0, 4)}`,
      quantity: item.quantity,
      unit_price: item.unit_price,
      product_id: item.product_id,
    })),
  })) as any;
}

export async function getOrderById(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, order_items(*, product:products(*)), table:tables(*), user:users(*)",
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return {
    ...data,
    order_number: data.order_number || data.id.slice(-4).toUpperCase(),
    tables: data.table,
    order_items: (data.order_items || []).map((item: any) => ({
      ...item,
      product_name:
        item.product?.name ||
        item.product_name ||
        `Product #${item.product_id?.slice(0, 4)}`,
      quantity: item.quantity,
      unit_price: item.unit_price,
      product_id: item.product_id,
    })),
  } as any;
}

export async function createOrder(order: CreateOrderInput): Promise<Order> {
  console.log("📦 Supabase createOrder - Sending:", order);

  // 1. Insert order
  const { data: createdOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: order.tenant_id,
      table_id: order.table_id,
      user_id: order.user_id,
      status: order.status || "draft",
      total: order.total,
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      notes: order.notes,
      metadata: order.metadata,
      order_number: `ORD-${Date.now()}`, // Fallback if RPC fails, though backend usually handles it
    })
    .select()
    .single();

  if (orderError) {
    console.error("❌ Error inserting order:", orderError);
    throw orderError;
  }

  // 2. Insert items
  if (order.items && order.items.length > 0) {
    const items = order.items.map((item) => ({
      order_id: createdOrder.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      kitchen_status: "pending",
      notes: item.notes,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items);

    if (itemsError) {
      console.error("❌ Error inserting order_items:", itemsError);
      throw itemsError;
    }
  }

  return createdOrder as any;
}

export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({ status: status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

export async function deleteOrder(id: string): Promise<any> {
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) throw error;
  return { message: "Order deleted" };
}

export async function updateOrder(
  id: string,
  order: Partial<CreateOrderInput>,
): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({
      table_id: order.table_id,
      user_id: order.user_id,
      status: order.status,
      total: order.total,
      notes: order.notes,
      metadata: order.metadata,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

export async function addOrderItem(
  orderId: string,
  item: OrderItem,
): Promise<any> {
  const { data, error } = await supabase
    .from("order_items")
    .insert({
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      kitchen_status: item.kitchen_status || item.estado || "pending",
      notes: item.notes || item.notas,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrderItem(
  itemId: string,
  updates: Partial<OrderItem>,
): Promise<any> {
  const { data, error } = await supabase
    .from("order_items")
    .update({
      quantity: updates.quantity,
      unit_price: updates.unit_price,
      subtotal: updates.subtotal,
      kitchen_status: updates.kitchen_status || updates.estado,
      notes: updates.notes || updates.notas,
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOrderItem(itemId: string): Promise<any> {
  const { error } = await supabase
    .from("order_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
  return { message: "Item deleted" };
}
