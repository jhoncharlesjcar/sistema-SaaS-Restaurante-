import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('daily-summary')
    async getDailySummary(
        @Query('restaurant_id') restaurantId: string,
        @Query('date') date?: string,
    ) {
        return this.analyticsService.getDailySummary(restaurantId, date);
    }

    @Get('sales-by-hour')
    async getSalesByHour(
        @Query('restaurant_id') restaurantId: string,
        @Query('date') date?: string,
    ) {
        return this.analyticsService.getSalesByHour(restaurantId, date);
    }

    @Get('top-products')
    async getTopProducts(
        @Query('restaurant_id') restaurantId: string,
        @Query('limit') limit?: string,
        @Query('days') days?: string,
    ) {
        return this.analyticsService.getTopProducts(
            restaurantId,
            limit ? parseInt(limit) : 10,
            days ? parseInt(days) : 7,
        );
    }

    @Get('sales-by-period')
    async getSalesByPeriod(
        @Query('restaurant_id') restaurantId: string,
        @Query('start_date') startDate: string,
        @Query('end_date') endDate: string,
    ) {
        return this.analyticsService.getSalesByPeriod(restaurantId, startDate, endDate);
    }

    @Get('table-metrics')
    async getTableMetrics(@Query('restaurant_id') restaurantId: string) {
        return this.analyticsService.getTableMetrics(restaurantId);
    }
}
