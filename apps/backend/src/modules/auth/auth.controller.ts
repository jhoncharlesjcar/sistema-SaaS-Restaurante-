import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Headers('authorization') authorization: string) {
        const token = authorization?.replace('Bearer ', '');
        if (!token) {
            return { message: 'No autorizado' };
        }
        return this.authService.logout(token);
    }

    @Get('me')
    async getCurrentUser(@Headers('authorization') authorization: string) {
        const token = authorization?.replace('Bearer ', '');
        if (!token) {
            throw new Error('No autorizado');
        }
        return this.authService.getCurrentUser(token);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() body: { refresh_token: string }) {
        return this.authService.refreshToken(body.refresh_token);
    }
}
