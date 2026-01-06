import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/kitchen',
})
export class KdsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedClients: Map<string, { restaurantId: string; socket: Socket }> = new Map();

    handleConnection(client: Socket) {
        console.log(`Kitchen client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Kitchen client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }

    @SubscribeMessage('join_kitchen')
    handleJoinKitchen(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { restaurantId: string },
    ) {
        const room = `kitchen_${data.restaurantId}`;
        client.join(room);
        this.connectedClients.set(client.id, { restaurantId: data.restaurantId, socket: client });
        console.log(`Client ${client.id} joined kitchen room: ${room}`);
        return { success: true, room };
    }

    // Emitir nueva orden a la cocina
    emitNewOrder(restaurantId: string, order: any) {
        const room = `kitchen_${restaurantId}`;
        this.server.to(room).emit('order:new', order);
        console.log(`Emitted new order to room ${room}:`, order.order_number);
    }

    // Emitir actualización de orden
    emitOrderUpdate(restaurantId: string, order: any) {
        const room = `kitchen_${restaurantId}`;
        this.server.to(room).emit('order:updated', order);
        console.log(`Emitted order update to room ${room}:`, order.order_number);
    }

    // Emitir item listo
    emitItemReady(restaurantId: string, itemId: string, orderId: string) {
        const room = `kitchen_${restaurantId}`;
        this.server.to(room).emit('item:ready', { itemId, orderId });
    }

    @SubscribeMessage('update_item_status')
    async handleUpdateItemStatus(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { itemId: string; status: string; orderId: string },
    ) {
        // Este mensaje puede ser procesado por el servicio de órdenes
        // Por ahora, solo lo retransmitimos
        const clientData = this.connectedClients.get(client.id);
        if (clientData) {
            const room = `kitchen_${clientData.restaurantId}`;
            this.server.to(room).emit('item:status_changed', data);
        }
        return { success: true };
    }

    @SubscribeMessage('update_order_status')
    async handleUpdateOrderStatus(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { orderId: string; status: string },
    ) {
        const clientData = this.connectedClients.get(client.id);
        if (clientData) {
            const room = `kitchen_${clientData.restaurantId}`;
            this.server.to(room).emit('order:status_changed', data);
        }
        return { success: true };
    }
}
