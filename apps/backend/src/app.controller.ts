import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller()
export class AppController {
    @Get()
    healthCheck(@Req() req: Request) {
        console.log(`[HEALTH CHECK] Request to: ${req.url} (Original: ${req.originalUrl})`);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        return {
            status: 'ok',
            message: 'Backend POS API is running',
            timestamp: new Date().toISOString(),
            receivedUrl: req.originalUrl,
        };
    }
}
