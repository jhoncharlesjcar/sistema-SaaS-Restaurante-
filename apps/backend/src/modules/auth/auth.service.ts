import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
        private readonly configService: ConfigService,
    ) {
        console.log('🌐 Backend: Supabase URL:', this.configService.get('SUPABASE_URL'));
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        console.log('--- LOGIN ATTEMPT ---');

        // Autenticar con Supabase
        const { data: authData, error: authError } =
            await this.supabase.auth.signInWithPassword({
                email,
                password,
            });

        if (authError || !authData.user) {
            console.error('Supabase Auth Error:', authError?.message);
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Asegurar que el perfil del usuario exista (JIT Provisioning)
        const userData = await this.ensureUserProfile(
            authData.user.id,
            authData.user.email,
            authData.user.user_metadata?.full_name || 'Usuario Demo'
        );

        console.log('Login successful, returning token.');

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
        console.log('📝 Backend: getCurrentUser called');
        console.log('📝 Backend: Token type:', typeof accessToken, 'Length:', accessToken?.length || 0);
        
        try {
            // Decodificar JWT manualmente sin validar firma (ya fue validado por Supabase en login)
            const decoded = this.decodeToken(accessToken);
            console.log('📝 Backend: Token decoded, user ID:', decoded.sub);

            const userId = decoded.sub;
            const email = decoded.email;
            const fullName = decoded.user_metadata?.full_name || 'Usuario Demo';

            // Asegurar que el perfil exista (JIT Provisioning)
            const userData = await this.ensureUserProfile(userId, email, fullName);

            return {
                id: userData.id,
                email: userData.email,
                full_name: userData.full_name,
                role: userData.role,
                restaurant_id: userData.restaurant_id,
            };
        } catch (error) {
            console.error('❌ Backend: Token validation error:', error);
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }

    /**
     * Decodifica un JWT sin validar la firma (ya fue validada por Supabase)
     */
    private decodeToken(token: string): any {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Token inválido: no tiene 3 partes');
            }

            // Decodificar el payload (segunda parte)
            const payload = parts[1];
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
            console.log('📝 Backend: Decoded payload:', { sub: decoded.sub, email: decoded.email });
            return decoded;
        } catch (error) {
            console.error('❌ Backend: Error decoding token:', error);
            throw new Error(`Token inválido: ${error.message}`);
        }
    }

    /**
     * Asegura que el usuario tenga un perfil en la tabla public.users.
     * Si no existe, lo crea vinculado al Restaurante Demo.
     */
    private async ensureUserProfile(id: string, email: string, fullName: string) {
        console.log(`📝 Backend: ensureUserProfile for ${id}`);
        // 1. Intentar obtener el perfil existente
        const { data: userData, error: userError } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (userData) {
            console.log('📝 Backend: User profile found in DB');
            if (!userData.is_active) throw new UnauthorizedException('Usuario inactivo');
            return userData;
        }

        if (userError && userError.code !== 'PGRST116') {
            console.error('❌ Backend: DB Error checking user:', userError);
        }

        console.log(`🚀 JIT: Creando perfil para ${email} (${id})...`);

        try {
            // 2. Asegurar que el Restaurante Demo existe
            const demoRestId = '00000000-0000-0000-0000-000000000001';
            console.log('📝 Backend: Upserting demo restaurant...');
            const { error: restError } = await this.supabase.from('restaurants').upsert({
                id: demoRestId,
                name: 'Restaurante Demo',
                ruc: '20123456789',
                timezone: 'America/Lima',
                currency: 'PEN',
                tax_rate: 0.18
            });

            if (restError) {
                console.error('❌ Backend: Restaurant upsert error:', restError);
                throw restError;
            }

            // 3. Actualizar o crear el perfil de usuario
            console.log('📝 Backend: Updating or creating user profile...');
            
            // Intentar actualizar por ID primero
            console.log('📝 Backend: Attempting to update user by ID...');
            const { data: updateData, error: updateErr } = await this.supabase
                .from('users')
                .update({
                    email,
                    full_name: fullName,
                    restaurant_id: demoRestId,
                    role: 'admin',
                    is_active: true
                })
                .eq('id', id)
                .select()
                .single();

            if (updateData) {
                // Update fue exitoso
                console.log('📝 Backend: User updated successfully');
                return updateData;
            }

            // Si el UPDATE falló, intentar INSERT
            console.log('📝 Backend: User not found, attempting to insert...');
            const { data: newUser, error: createError } = await this.supabase
                .from('users')
                .insert({
                    id,
                    email,
                    full_name: fullName,
                    restaurant_id: demoRestId,
                    role: 'admin',
                    is_active: true
                })
                .select()
                .single();

            if (createError) {
                console.error('❌ Backend: User insert error:', createError);
                // Si falla el insert con clave única, significa que el user existe pero con otro ID
                // Intentar buscar por email y actualizar
                console.log('📝 Backend: Trying to find user by email and update...');
                const { data: existingUsers, error: findError } = await this.supabase
                    .from('users')
                    .select('id')
                    .eq('email', email);

                if (findError || !existingUsers || existingUsers.length === 0) {
                    console.error('❌ Backend: Could not find user by email:', findError);
                    throw new UnauthorizedException('Error al crear perfil de usuario automático');
                }

                // Actualizar el user existente con el ID correcto
                const existingUserId = existingUsers[0].id;
                const { data: existingUser, error: updateExistingErr } = await this.supabase
                    .from('users')
                    .update({
                        restaurant_id: demoRestId,
                        role: 'admin',
                        is_active: true
                    })
                    .eq('id', existingUserId)
                    .select()
                    .single();

                if (updateExistingErr || !existingUser) {
                    console.error('❌ Backend: Could not update existing user:', updateExistingErr);
                    throw new UnauthorizedException('Error al crear perfil de usuario automático');
                }

                return existingUser;
            }

            console.log('📝 Backend: JIT Provisioning success');
            return newUser;
        } catch (err) {
            console.error('❌ Backend: JIT Fatal Error:', err);
            throw new UnauthorizedException('Fallo en la auto-provisión');
        }
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
