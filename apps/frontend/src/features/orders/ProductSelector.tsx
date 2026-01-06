import { useState } from 'react';
import { useProducts } from '../products/useProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Product } from '../products/api';
import type { OrderItem } from './api';

interface ProductSelectorProps {
    items: OrderItem[];
    onAddItem: (product: Product) => void;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onRemoveItem: (productId: string) => void;
}

export default function ProductSelector({
    items,
    onAddItem,
    onUpdateQuantity,
    onRemoveItem,
}: ProductSelectorProps) {
    const { data: products, isLoading } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    const filteredProducts = products?.filter((p: Product) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || p.category_id === categoryFilter;
        return matchesSearch && matchesCategory && p.is_available;
    });

    // Obtener categorías únicas
    const categories = products?.reduce((acc: any[], p: Product) => {
        if (p.categories && !acc.find(c => c.id === p.categories?.id)) {
            acc.push(p.categories);
        }
        return acc;
    }, []);

    const getItemQuantity = (productId: string) => {
        return items.find(i => i.product_id === productId)?.quantity || 0;
    };

    if (isLoading) {
        return <div className="text-center py-4">Cargando productos...</div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seleccionar Productos</h3>

            {/* Búsqueda */}
            <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Filtro de categorías */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={!categoryFilter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter(null)}
                >
                    Todas
                </Button>
                {categories?.map((cat: any) => (
                    <Button
                        key={cat.id}
                        variant={categoryFilter === cat.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategoryFilter(cat.id)}
                    >
                        {cat.name}
                    </Button>
                ))}
            </div>

            {/* Grid de productos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                {filteredProducts?.map((product: Product) => {
                    const quantity = getItemQuantity(product.id);

                    return (
                        <Card
                            key={product.id}
                            className={`cursor-pointer transition-all ${quantity > 0 ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-primary'
                                }`}
                            onClick={() => quantity === 0 && onAddItem(product)}
                        >
                            <CardContent className="p-3">
                                <div className="font-medium text-sm line-clamp-2 mb-1">
                                    {product.name}
                                </div>
                                {product.categories && (
                                    <Badge variant="secondary" className="text-xs mb-2">
                                        {product.categories.name}
                                    </Badge>
                                )}
                                <div className="font-bold text-primary">
                                    S/ {product.price.toFixed(2)}
                                </div>

                                {/* Controles de cantidad */}
                                {quantity > 0 && (
                                    <div className="flex items-center justify-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 w-8 p-0"
                                            onClick={() => quantity === 1 ? onRemoveItem(product.id) : onUpdateQuantity(product.id, quantity - 1)}
                                        >
                                            -
                                        </Button>
                                        <span className="w-8 text-center font-bold">{quantity}</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 w-8 p-0"
                                            onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                                        >
                                            +
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredProducts?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No se encontraron productos
                </div>
            )}
        </div>
    );
}
