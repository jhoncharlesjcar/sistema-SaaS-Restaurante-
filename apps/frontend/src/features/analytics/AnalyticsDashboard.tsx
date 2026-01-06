import { useAuth } from '../auth/AuthProvider';
import { useDailySummary, useSalesByHour, useTopProducts, useTableMetrics } from './useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsDashboard() {
    const { user } = useAuth();
    const restaurantId = user?.restaurant_id || '';

    const { data: summary, isLoading: loadingSummary } = useDailySummary(restaurantId);
    const { data: hourlyData } = useSalesByHour(restaurantId);
    const { data: topProducts } = useTopProducts(restaurantId, 5, 7);
    const { data: tableMetrics } = useTableMetrics(restaurantId);

    // Encontrar la hora pico
    const peakHour = hourlyData?.reduce((max, h) => h.total > max.total ? h : max, { hour: 0, total: 0 });

    // Formato de moneda
    const formatCurrency = (value: number) => `S/ ${value.toFixed(2)}`;

    if (loadingSummary) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">📊 Analytics</h1>
                    <p className="text-gray-600">Resumen del día: {summary?.date || 'Hoy'}</p>
                </div>
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Ventas totales */}
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Ventas del Día</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {formatCurrency(summary?.totalSales || 0)}
                        </div>
                        <p className="text-sm opacity-75 mt-1">
                            IGV: {formatCurrency(summary?.totalTax || 0)}
                        </p>
                    </CardContent>
                </Card>

                {/* Órdenes */}
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Órdenes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {summary?.paidOrders || 0}
                        </div>
                        <p className="text-sm opacity-75 mt-1">
                            {summary?.activeOrders || 0} activas • {summary?.cancelledOrders || 0} canceladas
                        </p>
                    </CardContent>
                </Card>

                {/* Ticket promedio */}
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Ticket Promedio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {formatCurrency(summary?.averageTicket || 0)}
                        </div>
                        <p className="text-sm opacity-75 mt-1">
                            Por orden pagada
                        </p>
                    </CardContent>
                </Card>

                {/* Ocupación de mesas */}
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Mesas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {tableMetrics?.occupied || 0}/{tableMetrics?.total || 0}
                        </div>
                        <p className="text-sm opacity-75 mt-1">
                            {(tableMetrics?.occupancyRate || 0).toFixed(0)}% ocupación
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Segunda fila: Gráfico de ventas por hora y Top productos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ventas por hora */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>📈 Ventas por Hora</span>
                            {peakHour && peakHour.total > 0 && (
                                <Badge variant="secondary">
                                    Hora pico: {peakHour.hour}:00
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48 flex items-end gap-1">
                            {hourlyData?.filter((_, i) => i >= 8 && i <= 22).map((h) => {
                                const maxTotal = Math.max(...(hourlyData?.map(x => x.total) || [1]));
                                const height = maxTotal > 0 ? (h.total / maxTotal) * 100 : 0;
                                return (
                                    <div key={h.hour} className="flex-1 flex flex-col items-center">
                                        <div
                                            className={`w-full rounded-t ${h.total > 0 ? 'bg-primary' : 'bg-gray-200'}`}
                                            style={{ height: `${Math.max(height, 2)}%` }}
                                            title={`${h.hour}:00 - ${formatCurrency(h.total)}`}
                                        />
                                        <span className="text-xs text-gray-500 mt-1">{h.hour}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Top productos */}
                <Card>
                    <CardHeader>
                        <CardTitle>🏆 Top Productos (7 días)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topProducts && topProducts.length > 0 ? (
                            <div className="space-y-3">
                                {topProducts.map((product, index) => (
                                    <div key={product.id} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                    index === 2 ? 'bg-orange-600' :
                                                        'bg-gray-300'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {product.quantity} vendidos
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-primary">
                                                {formatCurrency(product.revenue)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No hay datos de ventas aún
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Estado de mesas */}
            <Card>
                <CardHeader>
                    <CardTitle>🪑 Estado de Mesas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="p-4 rounded-lg bg-green-50">
                            <div className="text-3xl font-bold text-green-600">{tableMetrics?.available || 0}</div>
                            <div className="text-sm text-green-700">Disponibles</div>
                        </div>
                        <div className="p-4 rounded-lg bg-red-50">
                            <div className="text-3xl font-bold text-red-600">{tableMetrics?.occupied || 0}</div>
                            <div className="text-sm text-red-700">Ocupadas</div>
                        </div>
                        <div className="p-4 rounded-lg bg-yellow-50">
                            <div className="text-3xl font-bold text-yellow-600">{tableMetrics?.reserved || 0}</div>
                            <div className="text-sm text-yellow-700">Reservadas</div>
                        </div>
                        <div className="p-4 rounded-lg bg-gray-50">
                            <div className="text-3xl font-bold text-gray-600">{tableMetrics?.total || 0}</div>
                            <div className="text-sm text-gray-700">Total</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
