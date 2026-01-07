// Order entity interface
export interface Order {
    id: string;
    restaurant_id: string;
    table_id?: string;
    user_id?: string;
    order_number: string;
    customer_name?: string;
    customer_count: number;
    status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    tip_amount: number;
    total: number;
    sent_to_kitchen_at?: Date;
    ready_at?: Date;
    delivered_at?: Date;
    paid_at?: Date;
    cancelled_at?: Date;
    notes?: string;
    cancellation_reason?: string;
    created_at: Date;
    updated_at: Date;
    synced_at?: Date;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id?: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    kitchen_status: string;
    prepared_at?: Date;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}

export interface OrderWithRelations extends Order {
    order_items?: OrderItem[];
    tables?: any;
    users?: any;
}

// Repository interface for data access
export interface IOrdersRepository {
    findAll(restaurantId: string, status?: string, tableId?: string): Promise<OrderWithRelations[]>;
    findOne(id: string): Promise<OrderWithRelations | null>;
    create(orderData: Partial<Order>): Promise<Order>;
    update(id: string, orderData: Partial<Order>): Promise<Order | null>;
    delete(id: string): Promise<Order | null>;

    // Order items
    createItems(items: Partial<OrderItem>[]): Promise<void>;
    findItems(orderId: string): Promise<OrderItem[]>;
    updateItem(itemId: string, data: Partial<OrderItem>): Promise<OrderItem | null>;
    deleteItem(itemId: string): Promise<OrderItem | null>;

    // Special operations
    generateOrderNumber(restaurantId: string): Promise<string>;
    updateTableStatus(tableId: string, status: string): Promise<void>;
}
