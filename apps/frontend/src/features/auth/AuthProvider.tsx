import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase';

console.log('🌐 Frontend: Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

interface User {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
    restaurant_id: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const initializing = useRef(true);

    const fetchUserProfile = async (token: string) => {
        const url = `${API_URL}/auth/me`;
        console.log('🔍 Auth: Fetching profile from URL:', url);
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('🔍 Auth: Response status:', response.status, 'ok:', response.ok);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`❌ Auth: Profile fetch failed [${response.status}] for ${url}:`, errorBody);
                if (response.status === 401) {
                    console.warn('🔐 Auth: Session invalid on backend');
                }
                throw new Error(`Failed to fetch user profile: ${response.status} ${errorBody}`);
            }

            const contentType = response.headers.get('content-type');
            console.log('🔍 Auth: Content-Type:', contentType);
            
            if (!contentType || !contentType.includes('application/json')) {
                const textBody = await response.text();
                console.error('❌ Auth: Response is not JSON:', textBody);
                throw new Error(`Backend returned non-JSON response: ${textBody}`);
            }

            const userData = await response.json();
            console.log('🔍 Auth: User profile loaded successfully');
            return userData as User;
        } catch (error) {
            console.error('🔐 Auth: Error fetching user profile:', error);
            throw error;
        }
    };

    const handleAuthEvent = async (event: string, session: any) => {
        console.log(`🔐 Auth: Event [${event}] triggered`);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            if (session?.access_token) {
                try {
                    setLoading(true);
                    const profile = await fetchUserProfile(session.access_token);
                    setUser(profile);
                } catch (error) {
                    console.error('🔐 Auth: Failed to set user state after login event', error);
                    await supabase.auth.signOut();
                    setUser(null);
                } finally {
                    setLoading(false);
                }
            }
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('🔐 Auth: Provider mounted, subscribing to events...');

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            await handleAuthEvent(event, session);

            if (initializing.current) {
                initializing.current = false;
                setLoading(false);
            }
        });

        // Verificación inicial de sesión para casos donde onAuthStateChange no se dispare inmediatamente
        const checkInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && !user) {
                await handleAuthEvent('INITIAL_SESSION', session);
            }
            setLoading(false);
        };

        checkInitialSession();

        return () => {
            console.log('🔐 Auth: Unsubscribing from events');
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en el inicio de sesión');
            }

            // setSession disparará onAuthStateChange('SIGNED_IN')
            // lo cual a su vez llamará a handleAuthEvent y fetchUserProfile
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: data.access_token,
                refresh_token: data.refresh_token,
            });

            if (sessionError) throw sessionError;

            // Esperamos a que el evento SIGNED_IN maneje la carga del perfil
            // No llamamos a setUser(data.user) aquí para evitar doble flujo
        } catch (error) {
            setLoading(false);
            console.error('🔐 Auth: Login process error:', error);
            throw error;
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                }).catch(e => console.warn('Logout notification error', e));
            }
        } finally {
            await supabase.auth.signOut();
            // onAuthStateChange('SIGNED_OUT') manejará setUser(null) y setLoading(false)
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
