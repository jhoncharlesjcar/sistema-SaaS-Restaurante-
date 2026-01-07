import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { IProductsRepository, Product, ProductWithCategory } from './interfaces/products.interface';

@Injectable()
export class ProductsRepository implements IProductsRepository {
    constructor(
        @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    ) { }

    async findAll(restaurantId: string, categoryId?: string): Promise<ProductWithCategory[]> {
        let query = this.supabase
            .from('products')
            .select('*, categories(*)')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Error al obtener productos: ${error.message}`);
        }

        return data || [];
    }

    async findOne(id: string): Promise<ProductWithCategory | null> {
        const { data, error } = await this.supabase
            .from('products')
            .select('*, categories(*)')
            .eq('id', id)
            .single();

        if (error) {
            return null;
        }

        return data;
    }

    async create(productData: Partial<Product>): Promise<ProductWithCategory> {
        const { data, error } = await this.supabase
            .from('products')
            .insert([productData])
            .select('*, categories(*)')
            .single();

        if (error || !data) {
            throw new Error(`Error al crear producto: ${error?.message}`);
        }

        return data;
    }

    async update(id: string, productData: Partial<Product>): Promise<ProductWithCategory | null> {
        const { data, error } = await this.supabase
            .from('products')
            .update(productData)
            .eq('id', id)
            .select('*, categories(*)')
            .single();

        if (error) {
            return null;
        }

        return data;
    }

    async delete(id: string): Promise<Product | null> {
        // Soft delete: mark as unavailable instead of deleting
        const { data, error } = await this.supabase
            .from('products')
            .update({ is_available: false })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return null;
        }

        return data;
    }

    async findByCategory(categoryId: string, restaurantId: string): Promise<ProductWithCategory[]> {
        const { data, error } = await this.supabase
            .from('products')
            .select('*, categories(*)')
            .eq('category_id', categoryId)
            .eq('restaurant_id', restaurantId)
            .order('name', { ascending: true });

        if (error) {
            throw new Error(`Error al obtener productos: ${error.message}`);
        }

        return data || [];
    }
}
