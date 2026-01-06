import { Module } from '@nestjs/common';
import { KdsGateway } from './kds.gateway';

@Module({
    providers: [KdsGateway],
    exports: [KdsGateway],
})
export class KdsModule { }
