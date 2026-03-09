import React from 'react';

type SeparatorProps = React.HTMLAttributes<HTMLHRElement>;

export const Separator: React.FC<SeparatorProps> = ({ className, ...props }) => (
	<hr
		className={['my-4 h-px w-full bg-gray-200 border-0', className].filter(Boolean).join(' ')}
		{...props}
	/>
);

export default Separator;
