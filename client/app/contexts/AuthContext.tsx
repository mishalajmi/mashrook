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
import { authService, type User, type RegisterRequest } from "@/services/auth.service";
import { getAccessToken, clearTokens } from "@/lib/jwt";

/**
 * Authentication context type definition
 */
export interface AuthContextType {
	/** Current authenticated user or null */
	user: User | null;
	/** Whether the user is currently authenticated */
	isAuthenticated: boolean;
	/** Whether the initial auth check is in progress */
	isLoading: boolean;
	/** Login with email and password */
	login: (email: string, password: string) => Promise<void>;
	/** Logout the current user */
	logout: () => Promise<void>;
	/** Register a new user */
	register: (data: RegisterRequest) => Promise<void>;
}

/**
 * Auth context with undefined default value
 * Consumers must be wrapped in AuthProvider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
	children: ReactNode;
}

/**
 * Authentication Provider Component
 *
 * Wraps the application to provide authentication state and methods.
 * Handles initial auth state hydration from stored tokens.
 */
export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	/**
	 * Computed authentication state
	 */
	const isAuthenticated = user !== null;

	/**
	 * Hydrate auth state on mount
	 * Checks for existing token and fetches user data if available
	 */
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

	/**
	 * Login with email and password
	 * Updates user state on successful login
	 */
	const login = useCallback(async (email: string, password: string) => {
		const response = await authService.login(email, password);
		setUser(response.user);
	}, []);

	/**
	 * Logout the current user
	 * Clears user state regardless of API success
	 */
	const logout = useCallback(async () => {
		try {
			await authService.logout();
		} catch {
			// Silently handle errors - we still want to clear state locally
		} finally {
			setUser(null);
		}
	}, []);

	/**
	 * Register a new user
	 * Updates user state on successful registration
	 */
	const register = useCallback(async (data: RegisterRequest) => {
		const response = await authService.register(data);
		setUser(response.user);
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

/**
 * Custom hook to access authentication context
 *
 * @throws Error if used outside of AuthProvider
 * @returns AuthContextType with user state and auth methods
 */
export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}
