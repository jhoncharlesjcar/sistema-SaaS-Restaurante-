import { Product } from './api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
    product: Product;
    onEdit?: (product: Product) => void;
    onDelete?: (id: string) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
    return (
        <Card
            className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
            role="article"
            aria-label={`Producto: ${product.name}`}
        >
            <CardContent className="p-0">
                {/* Imagen del producto */}
                <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={`Imagen de ${product.name}`}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            loading="lazy"
                        />
                    ) : (
                        <div className="text-4xl" role="img" aria-label="Icono de plato">🍽️</div>
                    )}
                </div>

                {/* Contenido */}
                <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                        {product.categories && (
                            <Badge variant="secondary" className="ml-2">
                                {product.categories.name}
                            </Badge>
                        )}
                    </div>

                    {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {product.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-2xl font-bold text-primary">
                                S/ {product.price.toFixed(2)}
                            </p>
                            {product.cost && (
                                <p className="text-xs text-gray-500">
                                    Costo: S/ {product.cost.toFixed(2)}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            {!product.is_available && (
                                <Badge variant="destructive">No disponible</Badge>
                            )}
                            {product.track_inventory && (
                                <Badge variant={product.stock_quantity > 10 ? "default" : "destructive"}>
                                    Stock: {product.stock_quantity}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2" role="group" aria-label="Acciones del producto">
                        {onEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 transition-all hover:scale-105"
                                onClick={() => onEdit(product)}
                                aria-label={`Editar ${product.name}`}
                            >
                                Editar
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1 transition-all hover:scale-105"
                                onClick={() => onDelete(product.id)}
                                aria-label={`Eliminar ${product.name}`}
                            >
                                Eliminar
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
