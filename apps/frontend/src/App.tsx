import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { db } from './db/schema';
import { AuthProvider } from './features/auth/AuthProvider';
import { NotificationProvider } from './lib/NotificationProvider';
import { NotificationContainer } from './components/NotificationContainer';
import { SkipNavigation } from './components/SkipNavigation';
import Login from './features/auth/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ProductList from './features/products/ProductList';
import TableGrid from './features/tables/TableGrid';
import OrderList from './features/orders/OrderList';
import KitchenDisplay from './features/kds/KitchenDisplay';
import AnalyticsDashboard from './features/analytics/AnalyticsDashboard';
import SyncStatusBar from './components/SyncStatusBar';

function App() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

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
        <NotificationProvider>
            <AuthProvider>
                <BrowserRouter>
                    <SkipNavigation />
                    <NotificationContainer />
                    <SyncStatusBar />
                    <main id="main-content">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <div className="min-h-screen bg-background">
                                            <div className="container mx-auto p-8">
                                                <h1 className="text-4xl font-bold mb-4">Dashboard POS</h1>
                                                <p className="text-gray-600 mb-8">Sistema de Punto de Venta Offline-First</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <a href="/productos" className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                                                        <h2 className="text-2xl font-semibold mb-2">📦 Productos</h2>
                                                        <p className="text-gray-600">Gestiona tu menú y precios</p>
                                                    </a>
                                                    <a href="/mesas" className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                                                        <h2 className="text-2xl font-semibold mb-2">🪑 Mesas</h2>
                                                        <p className="text-gray-600">Administra las mesas del restaurante</p>
                                                    </a>
                                                    <a href="/ordenes" className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                                                        <h2 className="text-2xl font-semibold mb-2">📋 Órdenes</h2>
                                                        <p className="text-gray-600">Ver y gestionar todas las órdenes</p>
                                                    </a>
                                                    <a href="/cocina" className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                                                        <h2 className="text-2xl font-semibold mb-2">👨‍🍳 Cocina</h2>
                                                        <p className="text-gray-600">Kitchen Display System</p>
                                                    </a>
                                                    <a href="/analytics" className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                                                        <h2 className="text-2xl font-semibold mb-2">📊 Analytics</h2>
                                                        <p className="text-gray-600">Reportes y estadísticas</p>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
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
                                        <div className="min-h-screen bg-background">
                                            <div className="container mx-auto p-8">
                                                <KitchenDisplay />
                                            </div>
                                        </div>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/analytics"
                                element={
                                    <ProtectedRoute>
                                        <div className="min-h-screen bg-background">
                                            <div className="container mx-auto p-8">
                                                <AnalyticsDashboard />
                                            </div>
                                        </div>
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </main>
                </BrowserRouter>
            </AuthProvider>
        </NotificationProvider>
    );
}

export default App;
