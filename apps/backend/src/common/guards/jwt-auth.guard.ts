import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route is marked as public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;

        if (!authorization) {
            throw new UnauthorizedException('Token de autenticación no proporcionado');
        }

        const token = authorization.replace('Bearer ', '');

        if (!token) {
            throw new UnauthorizedException('Token de autenticación inválido');
        }

        try {
            // Verify token with Supabase
            const { data: { user }, error } = await this.supabase.auth.getUser(token);

            if (error || !user) {
                throw new UnauthorizedException('Token expirado o inválido');
            }

            // Get user profile from public.users table
            const { data: userProfile, error: profileError } = await this.supabase
                .from('users')
                .select('id, email, full_name, role, restaurant_id, is_active')
                .eq('id', user.id)
                .single();

            if (profileError || !userProfile) {
                throw new UnauthorizedException('Perfil de usuario no encontrado');
            }

            if (!userProfile.is_active) {
                throw new UnauthorizedException('Usuario desactivado');
            }

            // Attach user to request for use in controllers
            request.user = {
                id: userProfile.id,
                email: userProfile.email,
                full_name: userProfile.full_name,
                role: userProfile.role,
                restaurant_id: userProfile.restaurant_id,
            };

            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Error de autenticación');
        }
    }
}
