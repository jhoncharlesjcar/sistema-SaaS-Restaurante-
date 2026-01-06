import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
    constructor(
        @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    ) { }

    async findAll(restaurantId: string) {
        const { data, error } = await this.supabase
            .from('tables')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('table_number', { ascending: true });

        if (error) {
            throw new Error(`Error al obtener mesas: ${error.message}`);
        }

        return data;
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase
            .from('tables')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Mesa con ID ${id} no encontrada`);
        }

        return data;
    }

    async create(createTableDto: CreateTableDto) {
        const { data, error } = await this.supabase
            .from('tables')
            .insert([createTableDto])
            .select()
            .single();

        if (error) {
            throw new Error(`Error al crear mesa: ${error.message}`);
        }

        return data;
    }

    async update(id: string, updateTableDto: UpdateTableDto) {
        const { data, error } = await this.supabase
            .from('tables')
            .update(updateTableDto)
            .eq('id', id)
            .select()
            .single();

        if (error || !data) {
            throw new NotFoundException(`Mesa con ID ${id} no encontrada`);
        }

        return data;
    }

    async updateStatus(id: string, status: string) {
        return this.update(id, { status });
    }

    async remove(id: string) {
        const { data, error } = await this.supabase
            .from('tables')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error || !data) {
            throw new NotFoundException(`Mesa con ID ${id} no encontrada`);
        }

        return { message: 'Mesa eliminada exitosamente', data };
    }
}
