import { useState } from 'react';
import { useOrders, useUpdateOrderStatus } from './useOrders';
import OrderForm from './OrderForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order } from './api';

const statusConfig: Record<string, { label: string; variant: any; color: string }> = {
    draft: { label: 'Borrador', variant: 'outline', color: 'text-gray-600' },
    sent_to_kitchen: { label: 'En Cocina', variant: 'secondary', color: 'text-blue-600' },
    in_preparation: { label: 'Preparando', variant: 'default', color: 'text-orange-600' },
    ready: { label: 'Listo', variant: 'default', color: 'text-green-600' },
    delivered: { label: 'Entregado', variant: 'secondary', color: 'text-purple-600' },
    paid: { label: 'Pagado', variant: 'default', color: 'text-green-700' },
    cancelled: { label: 'Cancelado', variant: 'destructive', color: 'text-red-600' },
};

export default function OrderList() {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showForm, setShowForm] = useState(false);
    const { data: orders, isLoading, error } = useOrders(statusFilter === 'all' ? undefined : statusFilter);
    const updateStatus = useUpdateOrderStatus();

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await updateStatus.mutateAsync({ id, status });
        } catch (error) {
            alert('Error al actualizar estado');
        }
    };

    const activeOrders = orders?.filter((o: Order) =>
        o.status !== 'paid' && o.status !== 'cancelled'
    );

    // Mostrar formulario de creación
    if (showForm) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Nueva Orden</h1>
                </div>
                <OrderForm
                    onSuccess={() => setShowForm(false)}
                    onCancel={() => setShowForm(false)}
                />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando órdenes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-md">
                Error al cargar órdenes: {(error as Error).message}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Órdenes</h1>
                    <p className="text-gray-600">Gestión de comandas y pedidos</p>
                </div>
                <Button size="lg" onClick={() => setShowForm(true)}>
                    + Nueva Orden
                </Button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                >
                    Todas ({orders?.length || 0})
                </Button>
                <Button
                    variant={statusFilter === 'sent_to_kitchen' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('sent_to_kitchen')}
                >
                    En Cocina
                </Button>
                <Button
                    variant={statusFilter === 'in_preparation' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('in_preparation')}
                >
                    Preparando
                </Button>
                <Button
                    variant={statusFilter === 'ready' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('ready')}
                >
                    Listo
                </Button>
            </div>

            {/* Lista de órdenes */}
            {activeOrders && activeOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeOrders.map((order: Order) => {
                        const statusInfo = statusConfig[order.status] || statusConfig.draft;

                        return (
                            <Card key={order.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">
                                            Orden #{order.order_number}
                                        </CardTitle>
                                        <Badge variant={statusInfo.variant}>
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                    {order.tables && (
                                        <p className="text-sm text-gray-600">
                                            Mesa {order.tables.table_number}
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Items */}
                                    <div className="space-y-1">
                                        {order.order_items?.slice(0, 3).map((item: any) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span>{item.quantity}x {item.product_name}</span>
                                                <span className="text-gray-600">S/ {item.subtotal.toFixed(2)}</span>
                                            </div>
                                        ))}
                                        {order.order_items && order.order_items.length > 3 && (
                                            <p className="text-xs text-gray-500">
                                                +{order.order_items.length - 3} items más
                                            </p>
                                        )}
                                    </div>

                                    {/* Total */}
                                    <div className="pt-2 border-t">
                                        <div className="flex justify-between font-bold">
                                            <span>Total:</span>
                                            <span className="text-primary">S/ {order.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Acciones rápidas */}
                                    <div className="pt-2 space-y-2">
                                        {order.status === 'draft' && (
                                            <Button
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleStatusChange(order.id, 'sent_to_kitchen')}
                                            >
                                                Enviar a Cocina
                                            </Button>
                                        )}
                                        {order.status === 'sent_to_kitchen' && (
                                            <Button
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleStatusChange(order.id, 'in_preparation')}
                                            >
                                                Iniciar Preparación
                                            </Button>
                                        )}
                                        {order.status === 'in_preparation' && (
                                            <Button
                                                size="sm"
                                                className="w-full bg-green-600 hover:bg-green-700"
                                                onClick={() => handleStatusChange(order.id, 'ready')}
                                            >
                                                Marcar Listo
                                            </Button>
                                        )}
                                        {order.status === 'ready' && (
                                            <Button
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleStatusChange(order.id, 'delivered')}
                                            >
                                                Entregar
                                            </Button>
                                        )}
                                        {order.status === 'delivered' && (
                                            <Button
                                                size="sm"
                                                className="w-full bg-purple-600 hover:bg-purple-700"
                                                onClick={() => handleStatusChange(order.id, 'paid')}
                                            >
                                                Marcar Pagado
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold mb-2">No hay órdenes activas</h3>
                    <p className="text-gray-600 mb-4">
                        Las órdenes aparecerán aquí cuando se creen
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                        + Crear Primera Orden
                    </Button>
                </div>
            )}
        </div>
    );
}
