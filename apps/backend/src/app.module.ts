import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { TablesModule } from './modules/tables/tables.module';
import { OrdersModule } from './modules/orders/orders.module';
import { KdsModule } from './modules/kds/kds.module';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { validate } from './config/env.validation';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            validate,
        }),
        // Rate limiting - 100 requests per minute per IP
        ThrottlerModule.forRoot([{
            ttl: 60000, // 60 seconds in milliseconds
            limit: 100,
        }]),
        SupabaseModule,
        AuthModule,
        ProductsModule,
        TablesModule,
        OrdersModule,
        KdsModule,
    ],
    controllers: [AppController],
    providers: [
        // Global Exception Filter
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        // Global Logging Interceptor
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        // Global Rate Limiting Guard
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        // Global JWT Authentication Guard
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        // Global Roles Authorization Guard
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule { }
