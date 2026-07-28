import React, { createContext, useContext, useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface User {
    id: number;
    email: string;
    nombre_usuario: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            // Limpia la sesión de Google para que vuelva a pedir cuenta la próxima vez
            const isSignedIn = GoogleSignin.hasPreviousSignIn();
            if (isSignedIn) {
                await GoogleSignin.signOut();
            }
        } catch (error) {
            console.error('Error al cerrar sesión de Google:', error);
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
