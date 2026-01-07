// Product entity interface
export interface Product {
    id: string;
    restaurant_id: string;
    category_id?: string;
    name: string;
    description?: string;
    sku?: string;
    image_url?: string;
    price: number;
    cost?: number;
    is_available: boolean;
    track_inventory: boolean;
    stock_quantity: number;
    is_taxable: boolean;
    preparation_time?: number;
    created_at: Date;
    updated_at: Date;
    synced_at?: Date;
}

export interface Category {
    id: string;
    restaurant_id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    sort_order: number;
    is_active: boolean;
}

export interface ProductWithCategory extends Product {
    categories?: Category;
}

// Repository interface for data access
export interface IProductsRepository {
    findAll(restaurantId: string, categoryId?: string): Promise<ProductWithCategory[]>;
    findOne(id: string): Promise<ProductWithCategory | null>;
    create(productData: Partial<Product>): Promise<ProductWithCategory>;
    update(id: string, productData: Partial<Product>): Promise<ProductWithCategory | null>;
    delete(id: string): Promise<Product | null>;
    findByCategory(categoryId: string, restaurantId: string): Promise<ProductWithCategory[]>;
}
