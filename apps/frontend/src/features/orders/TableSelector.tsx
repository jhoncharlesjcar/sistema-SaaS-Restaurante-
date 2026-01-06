import { useState } from 'react';
import { useTables } from '../tables/useTables';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { RestaurantTable } from '../tables/api';

interface TableSelectorProps {
    selectedTableId?: string;
    onSelect: (tableId: string | undefined) => void;
}

export default function TableSelector({ selectedTableId, onSelect }: TableSelectorProps) {
    const { data: tables, isLoading } = useTables();
    const [showAll, setShowAll] = useState(false);

    const availableTables = tables?.filter((t: RestaurantTable) =>
        t.status === 'available' || t.id === selectedTableId
    );

    if (isLoading) {
        return <div className="text-center py-4">Cargando mesas...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Seleccionar Mesa</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelect(undefined)}
                    className={!selectedTableId ? 'bg-primary text-primary-foreground' : ''}
                >
                    Para Llevar
                </Button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {availableTables?.map((table: RestaurantTable) => (
                    <Card
                        key={table.id}
                        className={`cursor-pointer transition-all ${selectedTableId === table.id
                                ? 'ring-2 ring-primary bg-primary/10'
                                : 'hover:border-primary'
                            }`}
                        onClick={() => onSelect(table.id)}
                    >
                        <CardContent className="p-3 text-center">
                            <div className="text-2xl font-bold">{table.table_number}</div>
                            <div className="text-xs text-gray-500">{table.capacity} pers.</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {availableTables?.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                    No hay mesas disponibles
                </div>
            )}
        </div>
    );
}
