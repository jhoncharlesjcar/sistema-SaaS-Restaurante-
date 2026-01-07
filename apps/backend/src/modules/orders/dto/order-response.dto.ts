import { Expose, Type } from 'class-transformer';

export class OrderItemResponseDto {
    @Expose()
    id: string;

    @Expose()
    order_id: string;

    @Expose()
    product_id: string;

    @Expose()
    product_name: string;

    @Expose()
    quantity: number;

    @Expose()
    unit_price: number;

    @Expose()
    subtotal: number;

    @Expose()
    kitchen_status: string;

    @Expose()
    notes?: string;

    @Expose()
    prepared_at?: Date;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;
}

export class TableResponseDto {
    @Expose()
    id: string;

    @Expose()
    table_number: string;

    @Expose()
    table_name?: string;

    @Expose()
    status: string;

    @Expose()
    capacity: number;
}

export class UserResponseDto {
    @Expose()
    id: string;

    @Expose()
    email: string;

    @Expose()
    full_name: string;

    @Expose()
    role: string;
}

export class OrderResponseDto {
    @Expose()
    id: string;

    @Expose()
    restaurant_id: string;

    @Expose()
    table_id?: string;

    @Expose()
    user_id?: string;

    @Expose()
    order_number: string;

    @Expose()
    customer_name?: string;

    @Expose()
    customer_count: number;

    @Expose()
    status: string;

    @Expose()
    subtotal: number;

    @Expose()
    tax_amount: number;

    @Expose()
    discount_amount: number;

    @Expose()
    tip_amount: number;

    @Expose()
    total: number;

    @Expose()
    notes?: string;

    @Expose()
    sent_to_kitchen_at?: Date;

    @Expose()
    ready_at?: Date;

    @Expose()
    delivered_at?: Date;

    @Expose()
    paid_at?: Date;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;

    @Expose()
    @Type(() => OrderItemResponseDto)
    order_items?: OrderItemResponseDto[];

    @Expose()
    @Type(() => TableResponseDto)
    tables?: TableResponseDto;

    @Expose()
    @Type(() => UserResponseDto)
    users?: UserResponseDto;
}

export class OrderListResponseDto {
    @Expose()
    @Type(() => OrderResponseDto)
    data: OrderResponseDto[];

    @Expose()
    total: number;
}
