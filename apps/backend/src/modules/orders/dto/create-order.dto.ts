import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
    @IsString()
    @IsNotEmpty()
    product_id: string;

    @IsString()
    @IsNotEmpty()
    product_name: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsNumber()
    @Min(0)
    unit_price: number;

    @IsNumber()
    @Min(0)
    subtotal: number;

    @IsString()
    @IsOptional()
    special_instructions?: string;
}

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    restaurant_id: string;

    @IsString()
    @IsOptional()
    table_id?: string;

    @IsString()
    @IsNotEmpty()
    user_id: string;

    @IsString()
    @IsOptional()
    customer_name?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    customer_count?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    @IsOptional()
    items?: CreateOrderItemDto[];

    @IsNumber()
    @Min(0)
    subtotal: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    discount_amount?: number;

    @IsNumber()
    @Min(0)
    tax_amount: number;

    @IsNumber()
    @Min(0)
    total: number;

    @IsEnum(['draft', 'sent_to_kitchen', 'in_preparation', 'ready', 'delivered', 'paid', 'cancelled'])
    @IsOptional()
    status?: string;
}
