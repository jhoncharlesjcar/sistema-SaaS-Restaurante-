import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user] = useState<User | null>(null);
    const [loading] = useState(false);

    const login = async (email: string, password: string) => {
        console.log('Login:', email, password);
        // Temporary mock - to be implemented
    };

    const logout = async () => {
        console.log('Logout');
        // To be implemented
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
