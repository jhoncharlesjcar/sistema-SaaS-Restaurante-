import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { db } from './db/schema';
import { syncManager } from './features/sync/SyncManager';
import { AuthProvider } from './features/auth/AuthProvider';
import Login from './features/auth/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ProductList from './features/products/ProductList';
import TableGrid from './features/tables/TableGrid';
import OrderList from './features/orders/OrderList';
import KitchenDisplay from './features/kds/KitchenDisplay';

// Crear instancia de QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos (garbage collection)
            retry: 1,
        },
    },
});

function App() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Inicializar SyncManager
    useEffect(() => {
        console.log('SyncManager initialized:', syncManager);
    }, []);

    useEffect(() => {
        // Verificar que Dexie esté disponible (se abre automáticamente al primer uso)
        db.restaurants.count()
            .then(() => {
                console.log('✅ IndexedDB (Dexie) disponible y listo');
            })
            .catch((error: Error) => {
                console.error('❌ Error con IndexedDB:', error.message);
                console.log('ℹ️  La aplicación continuará funcionando sin persistencia local');
            });

        // Detectar estado online/offline
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard isOnline={isOnline} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/productos"
                        element={
                            <ProtectedRoute>
                                <div className="min-h-screen bg-background">
                                    <div className="fixed top-4 right-4 z-50">
                                        {isOnline ? (
                                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                                                🟢 Conectado
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
                                                🔴 Modo Offline
                                            </div>
                                        )}
                                    </div>
                                    <div className="container mx-auto p-8">
                                        <ProductList />
                                    </div>
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/mesas"
                        element={
                            <ProtectedRoute>
                                <div className="min-h-screen bg-background">
                                    <div className="fixed top-4 right-4 z-50">
                                        {isOnline ? (
                                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                                                🟢 Conectado
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
                                                🔴 Modo Offline
                                            </div>
                                        )}
                                    </div>
                                    <div className="container mx-auto p-8">
                                        <TableGrid />
                                    </div>
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/ordenes"
                        element={
                            <ProtectedRoute>
                                <div className="min-h-screen bg-background">
                                    <div className="fixed top-4 right-4 z-50">
                                        {isOnline ? (
                                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                                                🟢 Conectado
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
                                                🔴 Modo Offline
                                            </div>
                                        )}
                                    </div>
                                    <div className="container mx-auto p-8">
                                        <OrderList />
                                    </div>
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/cocina"
                        element={
                            <ProtectedRoute>
                                <KitchenDisplay />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
            <Toaster richColors position="top-center" />
            </AuthProvider>
        </QueryClientProvider>
    );
}

// Dashboard component (protected)
function Dashboard({ isOnline }: { isOnline: boolean }) {
    return (
        <div className="min-h-screen bg-background">
            {/* Indicador de estado de conexión */}
            <div className="fixed top-4 right-4 z-50">
                {isOnline ? (
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                        🟢 Conectado
                    </div>
                ) : (
                    <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
                        🔴 Modo Offline
                    </div>
                )}
            </div>

            <HomePage />
        </div>
    );
}

// Componente temporal de inicio
function HomePage() {
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-4xl font-bold mb-4">
                🍽️ Sistema POS Offline-First
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
                Bienvenido al sistema de gestión para restaurantes
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a href="/ordenes" className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                    <h2 className="text-xl font-semibold mb-2">📋 Órdenes</h2>
                    <p className="text-muted-foreground">
                        Gestión de comandas y pedidos
                    </p>
                </a>

                <a href="/productos" className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                    <h2 className="text-xl font-semibold mb-2">🍕 Productos</h2>
                    <p className="text-muted-foreground">
                        Administra tu menú y precios
                    </p>
                </a>

                <a href="/mesas" className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                    <h2 className="text-xl font-semibold mb-2">🪑 Mesas</h2>
                    <p className="text-muted-foreground">
                        Control de mesas y ocupación
                    </p>
                </a>

                <div className="border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2">🧾 Facturación</h2>
                    <p className="text-muted-foreground">
                        Integración con SUNAT
                    </p>
                </div>

                <a href="/cocina" className="border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all cursor-pointer bg-gray-900 text-white">
                    <h2 className="text-xl font-semibold mb-2">👨‍🍳 KDS</h2>
                    <p className="text-gray-400">
                        Display para cocina en tiempo real
                    </p>
                </a>

                <div className="border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2">📊 Reportes</h2>
                    <p className="text-muted-foreground">
                        Analíticas y estadísticas
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;
