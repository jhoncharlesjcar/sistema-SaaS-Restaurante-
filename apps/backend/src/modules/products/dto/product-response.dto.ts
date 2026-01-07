import { Expose, Type } from 'class-transformer';

export class CategoryResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    color?: string;

    @Expose()
    icon?: string;
}

export class ProductResponseDto {
    @Expose()
    id: string;

    @Expose()
    restaurant_id: string;

    @Expose()
    category_id?: string;

    @Expose()
    name: string;

    @Expose()
    description?: string;

    @Expose()
    sku?: string;

    @Expose()
    image_url?: string;

    @Expose()
    price: number;

    @Expose()
    cost?: number;

    @Expose()
    is_available: boolean;

    @Expose()
    track_inventory: boolean;

    @Expose()
    stock_quantity: number;

    @Expose()
    is_taxable: boolean;

    @Expose()
    preparation_time?: number;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;

    @Expose()
    @Type(() => CategoryResponseDto)
    category?: CategoryResponseDto;
}

export class ProductListResponseDto {
    @Expose()
    @Type(() => ProductResponseDto)
    data: ProductResponseDto[];

    @Expose()
    total: number;
}
