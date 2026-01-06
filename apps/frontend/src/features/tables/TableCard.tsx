import { RestaurantTable } from './api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TableCardProps {
    table: RestaurantTable;
    onStatusChange?: (id: string, status: string) => void;
    onEdit?: (table: RestaurantTable) => void;
}

const statusConfig = {
    available: { label: 'Disponible', color: 'bg-green-500', variant: 'default' as const },
    occupied: { label: 'Ocupada', color: 'bg-red-500', variant: 'destructive' as const },
    reserved: { label: 'Reservada', color: 'bg-yellow-500', variant: 'secondary' as const },
    maintenance: { label: 'Mantenimiento', color: 'bg-gray-500', variant: 'outline' as const },
};

export default function TableCard({ table, onStatusChange, onEdit }: TableCardProps) {
    const statusInfo = statusConfig[table.status];

    return (
        <Card className={`overflow-hidden hover:shadow-lg transition-all ${table.status === 'occupied' ? 'ring-2 ring-red-400' : ''}`}>
            <CardContent className="p-0">
                {/* Header de la mesa */}
                <div className={`${statusInfo.color} p-4 text-white`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold">Mesa {table.table_number}</h3>
                            {table.table_name && (
                                <p className="text-sm opacity-90">{table.table_name}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-3xl">👥</div>
                            <p className="text-xs">{table.capacity} pers.</p>
                        </div>
                    </div>
                </div>

                {/* Información */}
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estado:</span>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>

                    {table.location && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Ubicación:</span>
                            <span className="text-sm font-medium">{table.location}</span>
                        </div>
                    )}

                    {/* Botones de acción */}
                    <div className="pt-2 space-y-2">
                        {table.status === 'available' && (
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={() => onStatusChange?.(table.id, 'occupied')}
                            >
                                Marcar Ocupada
                            </Button>
                        )}

                        {table.status === 'occupied' && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => onStatusChange?.(table.id, 'available')}
                            >
                                Liberar Mesa
                            </Button>
                        )}

                        {onEdit && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="w-full"
                                onClick={() => onEdit(table)}
                            >
                                Editar
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
