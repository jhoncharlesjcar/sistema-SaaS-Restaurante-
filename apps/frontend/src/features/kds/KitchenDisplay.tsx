import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthProvider';
import { useOrders, useUpdateOrderStatus } from '../orders/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order, OrderItem } from '../orders/api';

const WS_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

// Configuración de estado de items
const itemStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-yellow-500' },
    preparing: { label: 'Preparando', color: 'bg-blue-500' },
    ready: { label: 'Listo', color: 'bg-green-500' },
    delivered: { label: 'Entregado', color: 'bg-gray-500' },
};

export default function KitchenDisplay() {
    const { user } = useAuth();
    const { data: orders, refetch } = useOrders();
    const updateStatus = useUpdateOrderStatus();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);

    // Filtrar órdenes relevantes para cocina
    const kitchenOrders = orders?.filter((o: Order) =>
        ['sent_to_kitchen', 'in_preparation'].includes(o.status)
    ) || [];

    // Conectar WebSocket
    useEffect(() => {
        if (!user?.restaurant_id) return;

        const newSocket = io(`${WS_URL}/kitchen`, {
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            console.log('Connected to kitchen WebSocket');
            setConnected(true);
            newSocket.emit('join_kitchen', { restaurantId: user.restaurant_id });
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from kitchen WebSocket');
            setConnected(false);
        });

        newSocket.on('order:new', (order) => {
            console.log('New order received:', order);
            if (audioEnabled) {
                playNotificationSound();
            }
            refetch();
        });

        newSocket.on('order:updated', () => {
            refetch();
        });

        newSocket.on('order:status_changed', () => {
            refetch();
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user?.restaurant_id, audioEnabled, refetch, playNotificationSound]);

    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => console.log('Audio autoplay blocked'));
        } catch {
            console.log('Audio not available');
        }
    }, []);

    const handleStartPreparing = async (orderId: string) => {
        try {
            await updateStatus.mutateAsync({ id: orderId, status: 'in_preparation' });
            socket?.emit('update_order_status', { orderId, status: 'in_preparation' });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleOrderReady = async (orderId: string) => {
        try {
            await updateStatus.mutateAsync({ id: orderId, status: 'ready' });
            socket?.emit('update_order_status', { orderId, status: 'ready' });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Calcular tiempo transcurrido
    const getElapsedTime = (createdAt: string) => {
        const created = new Date(createdAt);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) {
            return `${diffMins}m`;
        }
        return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
    };

    // Color basado en tiempo (urgencia)
    const getTimeColor = (createdAt: string) => {
        const created = new Date(createdAt);
        const now = new Date();
        const diffMins = Math.floor((now.getTime() - created.getTime()) / 60000);

        if (diffMins < 10) return 'text-green-600';
        if (diffMins < 20) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">🍳 Cocina</h1>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${connected ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300' : 'bg-red-300'} animate-pulse`}></span>
                        {connected ? 'Conectado' : 'Desconectado'}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant={audioEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className={audioEnabled ? 'bg-green-600' : 'bg-gray-600'}
                    >
                        {audioEnabled ? '🔊 Sonido ON' : '🔇 Sonido OFF'}
                    </Button>
                    <span className="text-gray-400">
                        {kitchenOrders.length} órdenes pendientes
                    </span>
                </div>
            </div>

            {/* Grid de órdenes */}
            {kitchenOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {kitchenOrders.map((order: Order) => (
                        <Card
                            key={order.id}
                            className={`bg-gray-800 border-2 ${order.status === 'sent_to_kitchen'
                                    ? 'border-yellow-500'
                                    : 'border-blue-500'
                                }`}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl text-white">
                                        #{order.order_number?.split('-').pop()}
                                    </CardTitle>
                                    <Badge className={
                                        order.status === 'sent_to_kitchen'
                                            ? 'bg-yellow-600'
                                            : 'bg-blue-600'
                                    }>
                                        {order.status === 'sent_to_kitchen' ? 'NUEVO' : 'PREPARANDO'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">
                                        {order.tables ? `Mesa ${order.tables.table_number}` : 'Para llevar'}
                                    </span>
                                    <span className={`font-bold ${getTimeColor(order.created_at)}`}>
                                        ⏱️ {getElapsedTime(order.created_at)}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Items */}
                                <div className="space-y-2 border-t border-gray-700 pt-3">
                                    {order.order_items?.map((item: OrderItem) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between bg-gray-700 rounded p-2"
                                        >
                                            <div>
                                                <span className="font-bold text-lg text-yellow-400">
                                                    {item.quantity}x
                                                </span>
                                                <span className="ml-2">{item.product_name}</span>
                                            </div>
                                            <Badge className={itemStatusConfig[item.kitchen_status || 'pending']?.color}>
                                                {itemStatusConfig[item.kitchen_status || 'pending']?.label}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>

                                {/* Notas */}
                                {order.notes && (
                                    <div className="bg-red-900/50 text-red-200 p-2 rounded text-sm">
                                        📝 {order.notes}
                                    </div>
                                )}

                                {/* Acciones */}
                                <div className="pt-2 space-y-2">
                                    {order.status === 'sent_to_kitchen' && (
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                                            onClick={() => handleStartPreparing(order.id)}
                                        >
                                            🍳 Iniciar Preparación
                                        </Button>
                                    )}
                                    {order.status === 'in_preparation' && (
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                                            onClick={() => handleOrderReady(order.id)}
                                        >
                                            ✅ Listo para Servir
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
                    <div className="text-8xl mb-4">👨‍🍳</div>
                    <h2 className="text-2xl font-semibold mb-2">Sin órdenes pendientes</h2>
                    <p>Las nuevas órdenes aparecerán aquí automáticamente</p>
                </div>
            )}
        </div>
    );
}
