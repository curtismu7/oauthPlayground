import React, { useEffect, useState } from 'react';
import RedirectlessLoginModal from './RedirectlessLoginModal';

// Standardized V9 wrapper for redirectless login modal
export const RedirectlessLoginModalV9: React.FC<{
	isOpen: boolean;
	onClose: () => void;
	onLogin: (username: string, password: string) => Promise<void>;
	title?: string;
	subtitle?: string;
	isLoading?: boolean;
	error?: string | null;
}> = (props) => {
	// Optionally add V9-specific logic here (e.g. logging, analytics)
	return (
		<RedirectlessLoginModal
			{...props}
			title={props.title || 'Redirectless V9 Authentication'}
			subtitle={props.subtitle || 'Enter credentials for redirectless V9 flow'}
		/>
	);
};

export default RedirectlessLoginModalV9;
