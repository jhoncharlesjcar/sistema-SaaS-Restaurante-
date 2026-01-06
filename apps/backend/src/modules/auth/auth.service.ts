import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Autenticar con Supabase
        const { data: authData, error: authError } =
            await this.supabase.auth.signInWithPassword({
                email,
                password,
            });

        if (authError || !authData.user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Obtener información adicional del usuario desde la tabla users
        const { data: userData, error: userError } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (userError || !userData) {
            throw new UnauthorizedException('Usuario no encontrado en el sistema');
        }

        // Verificar que el usuario esté activo
        if (!userData.is_active) {
            throw new UnauthorizedException('Usuario inactivo');
        }

        return {
            user: {
                id: userData.id,
                email: userData.email,
                full_name: userData.full_name,
                role: userData.role,
                restaurant_id: userData.restaurant_id,
            },
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
        };
    }

    async logout(accessToken: string) {
        await this.supabase.auth.admin.signOut(accessToken);
        return { message: 'Sesión cerrada exitosamente' };
    }

    async getCurrentUser(accessToken: string) {
        // Obtener usuario desde el token
        const {
            data: { user },
            error,
        } = await this.supabase.auth.getUser(accessToken);

        if (error || !user) {
            throw new UnauthorizedException('Token inválido');
        }

        // Obtener datos adicionales
        const { data: userData, error: userError } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (userError || !userData) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        return {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            restaurant_id: userData.restaurant_id,
        };
    }

    async refreshToken(refreshToken: string) {
        const { data, error } = await this.supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (error || !data.session) {
            throw new UnauthorizedException('Refresh token inválido');
        }

        return {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
        };
    }
}
