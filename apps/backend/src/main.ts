import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Habilitar CORS para el frontend
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    });

    // Validación automática de DTOs
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Prefijo global de API
    app.setGlobalPrefix('api');

    // Configuración de Swagger
    const config = new DocumentBuilder()
        .setTitle('POS Offline-First API')
        .setDescription(`
            API REST para el Sistema POS Offline-First de Restaurantes.
            
            ## Autenticación
            La mayoría de endpoints requieren autenticación JWT.
            Use el endpoint /api/auth/login para obtener un token.
            
            ## Rate Limiting
            - General: 100 requests por minuto
            - Login: 5 requests por minuto
        `)
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            },
            'JWT-auth',
        )
        .addTag('auth', 'Endpoints de autenticación')
        .addTag('orders', 'Gestión de órdenes')
        .addTag('products', 'Gestión de productos')
        .addTag('tables', 'Gestión de mesas')
        .addTag('kds', 'Kitchen Display System')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`🚀 Backend corriendo en: http://localhost:${port}/api`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
