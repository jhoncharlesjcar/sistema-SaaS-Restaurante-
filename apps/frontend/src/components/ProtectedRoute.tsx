import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuth();

    console.log('🛡️ ProtectedRoute: Render', { isAuthenticated, loading });

    if (loading) {
        console.log('🛡️ ProtectedRoute: Loading...');
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log('🛡️ ProtectedRoute: Not authenticated, redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    console.log('🛡️ ProtectedRoute: Authenticated, rendering content');
    return <>{children}</>;
}
