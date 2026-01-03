/**
 * Authentication Context
 *
 * Provides global authentication state management using React Context.
 * Tracks user authentication status and provides auth methods.
 */

import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from "react";
import {authService, type User, type RegisterRequest, type UserAuthority} from "@/services/auth.service";
import { getAccessToken, clearTokens } from "@/lib/jwt";

export interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	register: (data: RegisterRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const isAuthenticated = user !== null;

	useEffect(() => {
		// SSR guard - only run in browser environment
		if (typeof window === "undefined") return;

		async function hydrateAuth() {
			const token = getAccessToken();

			if (!token) {
				setIsLoading(false);
				return;
			}

			try {
				const currentUser = await authService.getCurrentUser();
				setUser(currentUser);
			} catch {
				// Token is invalid or expired, clear it
				clearTokens();
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		}

		hydrateAuth();
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		await authService.login(email, password);
		// Fetch user data after successful login (token is now stored)
		const currentUser = await authService.getCurrentUser();
		setUser(currentUser);
	}, []);

	const logout = useCallback(async () => {
		try {
			await authService.logout();
		} catch {
			// Silently handle errors - we still want to clear state locally
		} finally {
			setUser(null);
		}
	}, []);


	const register = useCallback(async (data: RegisterRequest) => {
		await authService.register(data);
	}, []);

	const value: AuthContextType = {
		user,
		isAuthenticated,
		isLoading,
		login,
		logout,
		register,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}
