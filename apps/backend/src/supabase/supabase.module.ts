import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';
export const SUPABASE_AUTH_CLIENT = 'SUPABASE_AUTH_CLIENT';

@Global()
@Module({
    providers: [
        // Cliente con SERVICE_ROLE_KEY para operaciones administrativas en BD
        {
            provide: SUPABASE_CLIENT,
            useFactory: (configService: ConfigService): SupabaseClient => {
                const supabaseUrl = configService.get<string>('SUPABASE_URL');
                const supabaseKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

                if (!supabaseUrl || !supabaseKey) {
                    throw new Error('Supabase URL y SERVICE_ROLE_KEY son requeridos en .env');
                }

                return createClient(supabaseUrl, supabaseKey);
            },
            inject: [ConfigService],
        },
        // Cliente con ANON_KEY para validar tokens de auth
        {
            provide: SUPABASE_AUTH_CLIENT,
            useFactory: (configService: ConfigService): SupabaseClient => {
                const supabaseUrl = configService.get<string>('SUPABASE_URL');
                const anonKey = configService.get<string>('SUPABASE_ANON_KEY');

                if (!supabaseUrl || !anonKey) {
                    throw new Error('Supabase URL y ANON_KEY son requeridos en .env');
                }

                return createClient(supabaseUrl, anonKey);
            },
            inject: [ConfigService],
        },
    ],
    exports: [SUPABASE_CLIENT, SUPABASE_AUTH_CLIENT],
})
export class SupabaseModule { }
