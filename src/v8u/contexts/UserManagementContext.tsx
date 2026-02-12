/**
 * @file UserManagementContext.tsx
 * @module v8u/contexts
 * @description User management context for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React, { createContext, useContext, ReactNode } from 'react';

interface UserManagementContextType {
	users: any[];
	loading: boolean;
	refreshUsers: () => void;
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

interface UserManagementProviderProps {
	children: ReactNode;
}

export const UserManagementProvider: React.FC<UserManagementProviderProps> = ({ children }) => {
	const [users, setUsers] = React.useState<any[]>([]);
	const [loading, setLoading] = React.useState(false);

	const refreshUsers = () => {
	// Mock refresh logic
		setLoading(true);
		setTimeout(() => {
			setLoading(false);
		}, 1000);
	};

	const value: UserManagementContextType = {
		users,
		loading,
		refreshUsers,
	};

	return <UserManagementContext.Provider value={value}>{children}</UserManagementContext.Provider>;
};

export const useUserManagement = (): UserManagementContextType => {
	const context = useContext(UserManagementContext);
	if (context === undefined) {
		throw new Error('useUserManagement must be used within a UserManagementProvider');
	}
	return context;
};
