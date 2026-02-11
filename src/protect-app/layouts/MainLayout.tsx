import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Footer } from '../components/layout/Footer';
import { useTheme } from '../../contexts/ThemeContext';

interface MainLayoutProps {
	children?: ReactNode;
}

/**
 * Main Layout Component
 * 
 * The main layout for authenticated pages, including:
 * - Header with navigation and user profile
 * - Sidebar with main navigation menu
 * - Main content area
 * - Footer with application information
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	const { currentTheme } = useTheme();

	return (
		<div 
			className="min-h-screen flex flex-col"
			style={{
				backgroundColor: currentTheme.colors.background,
				color: currentTheme.colors.text,
			}}
		>
			{/* Header */}
			<Header />

			<div className="flex flex-1">
				{/* Sidebar */}
				<Sidebar />

				{/* Main Content */}
				<main className="flex-1 overflow-auto">
					<div className="p-6">
						{children || <Outlet />}
					</div>
				</main>
			</div>

			{/* Footer */}
			<Footer />
		</div>
	);
};
