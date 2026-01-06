import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useCreateOrder } from './useOrders';
import TableSelector from './TableSelector';
import ProductSelector from './ProductSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '../products/api';
import type { OrderItem } from './api';

interface OrderFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const TAX_RATE = 0.18; // IGV Perú

export default function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
    const { user } = useAuth();
    const createOrder = useCreateOrder();

    // Debug user data
    console.log('OrderForm - User data:', user);

    const [step, setStep] = useState(1);
    const [tableId, setTableId] = useState<string | undefined>();
    const [customerName, setCustomerName] = useState('');
    const [customerCount, setCustomerCount] = useState(1);
    const [items, setItems] = useState<OrderItem[]>([]);

    // Cálculos
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = subtotal * TAX_RATE;
    const total = subtotal + taxAmount;

    const handleAddItem = (product: Product) => {
        const newItem: OrderItem = {
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            unit_price: product.price,
            subtotal: product.price,
        };
        setItems([...items, newItem]);
    };

    const handleUpdateQuantity = (productId: string, quantity: number) => {
        setItems(items.map(item => {
            if (item.product_id === productId) {
                return {
                    ...item,
                    quantity,
                    subtotal: item.unit_price * quantity,
                };
            }
            return item;
        }));
    };

    const handleRemoveItem = (productId: string) => {
        setItems(items.filter(item => item.product_id !== productId));
    };

    const handleSubmit = async (sendToKitchen: boolean = false) => {
        if (!user) {
            alert('Error: Usuario no autenticado. Por favor, inicie sesión nuevamente.');
            return;
        }
        if (!user.restaurant_id || !user.id) {
            console.error('User data:', user);
            alert('Error: Datos de usuario incompletos. Por favor, cierre sesión e inicie nuevamente.');
            return;
        }
        if (items.length === 0) {
            alert('Debe agregar al menos un producto');
            return;
        }

        const orderData = {
            restaurant_id: user.restaurant_id,
            table_id: tableId,
            user_id: user.id,
            customer_name: customerName || undefined,
            customer_count: customerCount,
            items,
            subtotal,
            tax_amount: taxAmount,
            total,
            status: sendToKitchen ? 'sent_to_kitchen' : 'draft',
        };

        console.log('Creating order with data:', orderData);

        try {
            await createOrder.mutateAsync(orderData);
            onSuccess?.();
        } catch (error) {
            console.error('Order creation error:', error);
            alert('Error al crear la orden. Verifique la consola para más detalles.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header con pasos */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex gap-4">
                    <Button
                        variant={step === 1 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStep(1)}
                    >
                        1. Mesa
                    </Button>
                    <Button
                        variant={step === 2 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStep(2)}
                    >
                        2. Productos
                    </Button>
                    <Button
                        variant={step === 3 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStep(3)}
                    >
                        3. Confirmar
                    </Button>
                </div>
                {onCancel && (
                    <Button variant="ghost" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
            </div>

            {/* Paso 1: Selección de Mesa */}
            {step === 1 && (
                <div className="space-y-4">
                    <TableSelector
                        selectedTableId={tableId}
                        onSelect={setTableId}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Nombre del Cliente (opcional)</Label>
                            <Input
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>
                        <div>
                            <Label>Comensales</Label>
                            <Input
                                type="number"
                                min={1}
                                value={customerCount}
                                onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={() => setStep(2)}>
                            Siguiente: Productos →
                        </Button>
                    </div>
                </div>
            )}

            {/* Paso 2: Selección de Productos */}
            {step === 2 && (
                <div className="space-y-4">
                    <ProductSelector
                        items={items}
                        onAddItem={handleAddItem}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                    />

                    {/* Resumen rápido */}
                    {items.length > 0 && (
                        <Card className="bg-gray-50">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                    <span>{items.reduce((sum, i) => sum + i.quantity, 0)} productos</span>
                                    <span className="font-bold text-xl text-primary">
                                        S/ {total.toFixed(2)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            ← Anterior
                        </Button>
                        <Button onClick={() => setStep(3)} disabled={items.length === 0}>
                            Siguiente: Confirmar →
                        </Button>
                    </div>
                </div>
            )}

            {/* Paso 3: Confirmación */}
            {step === 3 && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen de la Orden</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Info de mesa */}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Mesa:</span>
                                <span className="font-medium">
                                    {tableId ? `Mesa seleccionada` : 'Para llevar'}
                                </span>
                            </div>

                            {customerName && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Cliente:</span>
                                    <span className="font-medium">{customerName}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Comensales:</span>
                                <span className="font-medium">{customerCount}</span>
                            </div>

                            {/* Lista de items */}
                            <div className="border-t pt-4 space-y-2">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.product_name}</span>
                                        <span>S/ {item.subtotal.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Totales */}
                            <div className="border-t pt-4 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>S/ {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>IGV (18%):</span>
                                    <span>S/ {taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total:</span>
                                    <span className="text-primary">S/ {total.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between gap-4">
                        <Button variant="outline" onClick={() => setStep(2)}>
                            ← Anterior
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleSubmit(false)}
                                disabled={createOrder.isPending}
                            >
                                Guardar Borrador
                            </Button>
                            <Button
                                onClick={() => handleSubmit(true)}
                                disabled={createOrder.isPending}
                            >
                                {createOrder.isPending ? 'Creando...' : 'Enviar a Cocina'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
