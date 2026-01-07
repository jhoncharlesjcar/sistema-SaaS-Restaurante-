import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/db/schema';
import { toast } from 'sonner';

interface LoginData {
    email: string;
    password: string;
}

interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        full_name: string;
        role: string;
        restaurant_id: string;
        is_active: boolean;
    };
    restaurant?: {
        id: string;
        name: string;
        ruc: string;
        timezone: string;
        currency: string;
        tax_rate: number;
    };
}

export function useAuth() {
    const { setAuth, logout: storeLogout, isAuthenticated, user, restaurant, isLoading } = useAuthStore();
    const queryClient = useQueryClient();

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: async (data: LoginData): Promise<AuthResponse> => {
            const API_URL = import.meta.env.VITE_API_URL || '/api';

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al iniciar sesión');
            }

            return response.json();
        },
        onSuccess: (data) => {
            setAuth({
                user: data.user,
                restaurant: data.restaurant || null,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
            });
            toast.success(`¡Bienvenido, ${data.user.full_name}!`);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al iniciar sesión');
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: async () => {
            await supabase.auth.signOut();
        },
        onSuccess: async () => {
            // Clear local data
            storeLogout();
            queryClient.clear();

            // Optionally clear IndexedDB
            try {
                await db.delete();
                await db.open();
            } catch (e) {
                console.error('Error clearing local DB:', e);
            }

            toast.info('Sesión cerrada');
        },
    });

    // Refresh session
    const refreshSession = async () => {
        const { refreshToken } = useAuthStore.getState();

        if (!refreshToken) {
            storeLogout();
            return;
        }

        try {
            const { data, error } = await supabase.auth.refreshSession({
                refresh_token: refreshToken,
            });

            if (error || !data.session) {
                storeLogout();
                return;
            }

            // Update tokens in store
            useAuthStore.setState({
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
            });
        } catch {
            storeLogout();
        }
    };

    return {
        // State
        isAuthenticated,
        user,
        restaurant,
        isLoading,

        // Mutations
        login: loginMutation.mutate,
        loginAsync: loginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error,

        logout: logoutMutation.mutate,
        isLoggingOut: logoutMutation.isPending,

        // Actions
        refreshSession,
    };
}
