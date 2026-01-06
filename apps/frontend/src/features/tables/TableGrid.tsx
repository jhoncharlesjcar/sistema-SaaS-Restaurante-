import { useState } from 'react';
import { useTables, useUpdateTableStatus } from './useTables';
import TableCard from './TableCard';
import { Button } from '@/components/ui/button';
import type { RestaurantTable } from './api';

export default function TableGrid() {
    const { data: tables, isLoading, error } = useTables();
    const updateStatus = useUpdateTableStatus();
    const [filter, setFilter] = useState<string>('all');

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await updateStatus.mutateAsync({ id, status });
        } catch (error) {
            alert('Error al actualizar estado de la mesa');
        }
    };

    const filteredTables = tables?.filter((table: RestaurantTable) =>
        filter === 'all' || table.status === filter
    );

    // Agrupar por ubicación
    const tablesByLocation = filteredTables?.reduce((acc: any, table: RestaurantTable) => {
        const location = table.location || 'Sin ubicación';
        if (!acc[location]) acc[location] = [];
        acc[location].push(table);
        return acc;
    }, {});

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando mesas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-md">
                Error al cargar mesas: {(error as Error).message}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Mesas</h1>
                    <p className="text-gray-600">Control de mesas y ocupación</p>
                </div>
                <Button size="lg">
                    + Nueva Mesa
                </Button>
            </div>

            {/* Filtros de estado */}
            <div className="flex gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    Todas ({tables?.length || 0})
                </Button>
                <Button
                    variant={filter === 'available' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('available')}
                >
                    Disponibles ({tables?.filter((t: RestaurantTable) => t.status === 'available').length || 0})
                </Button>
                <Button
                    variant={filter === 'occupied' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('occupied')}
                >
                    Ocupadas ({tables?.filter((t: RestaurantTable) => t.status === 'occupied').length || 0})
                </Button>
            </div>

            {/* Grid de mesas agrupadas por ubicación */}
            {tablesByLocation && Object.entries(tablesByLocation).map(([location, locationTables]: [string, any]) => (
                <div key={location} className="space-y-4">
                    <h2 className="text-xl font-semibold border-b pb-2">
                        📍 {location} ({locationTables.length} mesas)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {locationTables.map((table: RestaurantTable) => (
                            <TableCard
                                key={table.id}
                                table={table}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {filteredTables && filteredTables.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <div className="text-6xl mb-4">🪑</div>
                    <h3 className="text-xl font-semibold mb-2">No hay mesas</h3>
                    <p className="text-gray-600 mb-4">
                        {filter === 'all' ? 'Agrega mesas para comenzar' : `No hay mesas ${filter}`}
                    </p>
                </div>
            )}
        </div>
    );
}
