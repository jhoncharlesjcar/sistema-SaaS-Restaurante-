import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { TablesModule } from './modules/tables/tables.module';
import { OrdersModule } from './modules/orders/orders.module';
import { KdsModule } from './modules/kds/kds.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        SupabaseModule,
        AuthModule,
        ProductsModule,
        TablesModule,
        OrdersModule,
        KdsModule,
        AnalyticsModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }


