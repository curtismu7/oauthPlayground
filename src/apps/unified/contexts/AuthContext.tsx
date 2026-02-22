/**
 * @file AuthContext.tsx
 * @module v8u/contexts
 * @description Authentication context for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React, { createContext, ReactNode, useContext, useState } from 'react';

interface User {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
}

interface AuthContextType {
	user: User | null;
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);

	const login = async (username: string, _password: string): Promise<void> => {
		// Mock login logic
		// In a real app, this would make an API call
		const mockUser: User = {
			id: '1',
			username,
			email: `${username}@example.com`,
			firstName: 'John',
			lastName: 'Doe',
			role: 'admin',
		};
		setUser(mockUser);
	};

	const logout = () => {
		setUser(null);
	};

	const isAuthenticated = !!user;

	const value: AuthContextType = {
		user,
		login,
		logout,
		isAuthenticated,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
