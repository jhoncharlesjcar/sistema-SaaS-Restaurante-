import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    restaurant_id: string;
    is_active: boolean;
}

interface Restaurant {
    id: string;
    name: string;
    ruc: string;
    address?: string;
    phone?: string;
    timezone: string;
    currency: string;
    tax_rate: number;
}

interface AuthState {
    // State
    user: User | null;
    restaurant: Restaurant | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setAuth: (data: {
        user: User;
        restaurant: Restaurant | null;
        accessToken: string;
        refreshToken: string;
    }) => void;
    updateUser: (user: Partial<User>) => void;
    updateRestaurant: (restaurant: Partial<Restaurant>) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            // Initial state
            user: null,
            restaurant: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: true,

            // Actions
            setAuth: (data) =>
                set({
                    user: data.user,
                    restaurant: data.restaurant,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    isAuthenticated: true,
                    isLoading: false,
                }),

            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),

            updateRestaurant: (restaurantData) =>
                set((state) => ({
                    restaurant: state.restaurant
                        ? { ...state.restaurant, ...restaurantData }
                        : null,
                })),

            setLoading: (loading) =>
                set({ isLoading: loading }),

            logout: () =>
                set({
                    user: null,
                    restaurant: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                }),
        }),
        {
            name: 'pos-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                user: state.user,
                restaurant: state.restaurant,
            }),
        }
    )
);

// Selector hooks for optimized re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useRestaurant = () => useAuthStore((state) => state.restaurant);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
