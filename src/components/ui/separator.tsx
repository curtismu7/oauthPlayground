import React from 'react';

type SeparatorProps = React.HTMLAttributes<HTMLDivElement>;

export const Separator: React.FC<SeparatorProps> = ({ className, ...props }) => (
	<div
		className={['my-4 h-px w-full bg-gray-200', className].filter(Boolean).join(' ')}
		role="separator"
		{...props}
	/>
);

export default Separator;


