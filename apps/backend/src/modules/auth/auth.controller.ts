import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión', description: 'Autenticar usuario y obtener tokens JWT' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Login exitoso. Retorna tokens y datos del usuario.' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
    @ApiResponse({ status: 429, description: 'Demasiados intentos. Límite: 5/minuto' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cerrar sesión', description: 'Invalidar la sesión actual' })
    @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
    async logout(@Headers('authorization') authorization: string) {
        const token = authorization?.replace('Bearer ', '');
        if (!token) {
            return { message: 'No autorizado' };
        }
        return this.authService.logout(token);
    }

    @Get('me')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtener usuario actual', description: 'Obtener perfil del usuario autenticado' })
    @ApiResponse({ status: 200, description: 'Datos del usuario actual' })
    @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
    async getCurrentUser(@Headers('authorization') authorization: string) {
        const token = authorization?.replace('Bearer ', '');
        if (!token) {
            throw new Error('No autorizado');
        }
        return this.authService.getCurrentUser(token);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refrescar token', description: 'Obtener nuevos tokens usando refresh token' })
    @ApiBody({ schema: { properties: { refresh_token: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Tokens renovados exitosamente' })
    @ApiResponse({ status: 401, description: 'Refresh token inválido' })
    async refreshToken(@Body() body: { refresh_token: string }) {
        return this.authService.refreshToken(body.refresh_token);
    }
}
