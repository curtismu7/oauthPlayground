import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Footer Component
 * 
 * Application footer with information and links.
 */
export const Footer: React.FC = () => {
	const { currentTheme } = useTheme();

	return (
		<footer 
			className="border-t"
			style={{
				backgroundColor: currentTheme.colors.surface,
				borderColor: '#e5e7eb',
			}}
		>
			<div className="px-6 py-4">
				<div className="flex items-center justify-between">
					<div 
						className="text-sm"
						style={{ color: currentTheme.colors.textSecondary }}
					>
						© 2024 PingOne Protect. All rights reserved.
					</div>
					<div className="flex space-x-4">
						<a 
							href="https://docs.pingidentity.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm hover:underline"
							style={{ color: currentTheme.colors.textSecondary }}
						>
							Documentation
						</a>
						<a 
							href="https://support.pingidentity.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm hover:underline"
							style={{ color: currentTheme.colors.textSecondary }}
						>
							Support
						</a>
						<a 
							href="https://www.pingidentity.com/en/privacy-policy.html"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm hover:underline"
							style={{ color: currentTheme.colors.textSecondary }}
						>
							Privacy Policy
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
};
