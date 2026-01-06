import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    ) { }

    async findAll(restaurantId: string, categoryId?: string) {
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

        return data;
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase
            .from('products')
            .select('*, categories(*)')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Producto con ID ${id} no encontrado`);
        }

        return data;
    }

    async create(createProductDto: CreateProductDto) {
        const { data, error } = await this.supabase
            .from('products')
            .insert([createProductDto])
            .select('*, categories(*)')
            .single();

        if (error) {
            throw new Error(`Error al crear producto: ${error.message}`);
        }

        return data;
    }

    async update(id: string, updateProductDto: UpdateProductDto) {
        const { data, error } = await this.supabase
            .from('products')
            .update(updateProductDto)
            .eq('id', id)
            .select('*, categories(*)')
            .single();

        if (error || !data) {
            throw new NotFoundException(`Producto con ID ${id} no encontrado`);
        }

        return data;
    }

    async remove(id: string) {
        // Soft delete: marcar como no disponible en lugar de eliminar
        const { data, error } = await this.supabase
            .from('products')
            .update({ is_available: false })
            .eq('id', id)
            .select()
            .single();

        if (error || !data) {
            throw new NotFoundException(`Producto con ID ${id} no encontrado`);
        }

        return { message: 'Producto eliminado exitosamente', data };
    }

    async findByCategory(categoryId: string, restaurantId: string) {
        const { data, error } = await this.supabase
            .from('products')
            .select('*, categories(*)')
            .eq('category_id', categoryId)
            .eq('restaurant_id', restaurantId)
            .order('name', { ascending: true });

        if (error) {
            throw new Error(`Error al obtener productos: ${error.message}`);
        }

        return data;
    }
}
