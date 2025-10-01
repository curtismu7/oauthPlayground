import React, { useEffect, useState } from 'react';

interface TypewriterProps {
	text: string;
	speed?: number; // ms per char
	instant?: boolean;
	className?: string;
}

const Typewriter: React.FC<TypewriterProps> = ({
	text,
	speed = 10,
	instant = false,
	className,
}) => {
	const [displayed, setDisplayed] = useState(instant ? text : '');

	useEffect(() => {
		if (instant) {
			setDisplayed(text);
			return;
		}
		setDisplayed('');
		let i = 0;
		const id = setInterval(() => {
			i++;
			setDisplayed(text.slice(0, i));
			if (i >= text.length) clearInterval(id);
		}, speed);
		return () => clearInterval(id);
	}, [text, speed, instant]);

	return (
		<pre
			className={className}
			style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}
		>
			{displayed}
		</pre>
	);
};

export default Typewriter;
