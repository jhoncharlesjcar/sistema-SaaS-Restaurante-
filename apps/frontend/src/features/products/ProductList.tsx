import { useProducts } from './useProducts';
import { useAuth } from '../auth/AuthProvider';
import ProductCard from './ProductCard';
import { useEffect } from 'react';

export default function ProductList() {
    const { user, isAuthenticated } = useAuth();
    const { data: products, isLoading, error, isFetching } = useProducts();

    useEffect(() => {
        console.log('📦 ProductList Debug:', {
            isAuthenticated,
            user: user ? { id: user.id, restaurant_id: user.restaurant_id } : null,
            isLoading,
            isFetching,
            productsCount: products?.length || 0,
            error: error?.message || null,
        });
    }, [user, isLoading, isFetching, error, products, isAuthenticated]);

    if (!user) {
        return (
            <div className="p-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2">⚠️ No autenticado</h2>
                    <p className="text-gray-700">Por favor, inicia sesión para ver productos.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-4">Productos</h1>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <p className="text-gray-700">Cargando productos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-4">Productos</h1>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2">❌ Error</h2>
                    <p className="text-gray-700">{error instanceof Error ? error.message : 'Error desconocido'}</p>
                    <details className="mt-4 text-xs text-gray-600">
                        <summary>Detalles técnicos</summary>
                        <pre className="mt-2 bg-gray-100 p-2 overflow-auto">
                            {JSON.stringify({ restaurantId: user.restaurant_id, error }, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Productos</h1>
            <p className="text-gray-600 mb-6">Gestiona tu menú y precios</p>

            {!products || products.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2">📦 No hay productos</h2>
                    <p className="text-gray-700">
                        Aún no tienes productos registrados. Crea uno para empezar.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
