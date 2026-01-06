import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    create(@Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(createOrderDto);
    }

    @Get()
    findAll(
        @Query('restaurant_id') restaurantId: string,
        @Query('status') status?: string,
        @Query('table_id') tableId?: string,
    ) {
        return this.ordersService.findAll(restaurantId, status, tableId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
        return this.ordersService.update(id, updateOrderDto);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
        return this.ordersService.updateStatus(id, body.status);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.ordersService.remove(id);
    }

    // Gestión de items
    @Post(':id/items')
    addItem(@Param('id') id: string, @Body() item: any) {
        return this.ordersService.addItem(id, item);
    }

    @Patch('items/:itemId')
    updateItem(@Param('itemId') itemId: string, @Body() updates: any) {
        return this.ordersService.updateItem(itemId, updates);
    }

    @Delete('items/:itemId')
    removeItem(@Param('itemId') itemId: string) {
        return this.ordersService.removeItem(itemId);
    }
}
