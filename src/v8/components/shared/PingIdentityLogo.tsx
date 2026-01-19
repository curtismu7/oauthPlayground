import React from 'react';

export const PingIdentityLogo: React.FC<{ size?: number }> = ({ size = 40 }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 100 100"
		xmlns="http://www.w3.org/2000/svg"
	>
		<rect width="100" height="100" fill="#00A4E4" />
		<path
			d="M20 30 L80 30 L80 70 L20 70 Z"
			fill="white"
		/>
		<text
			x="50"
			y="55"
			fontFamily="Arial, sans-serif"
			fontSize="24"
			fontWeight="bold"
			textAnchor="middle"
			fill="#00A4E4"
		>
			PING
		</text>
	</svg>
);
