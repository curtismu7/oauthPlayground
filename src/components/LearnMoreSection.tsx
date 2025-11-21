import React from 'react';

interface LearnMoreSectionProps {
	title: string;
	items: string[];
}

export const LearnMoreSection: React.FC<LearnMoreSectionProps> = ({ title, items }) => {
	return (
		<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
			<h3 className="text-sm font-semibold text-blue-900 mb-3">{title}</h3>
			<ul className="space-y-2">
				{items.map((item, index) => (
					<li key={index} className="text-sm text-blue-800 flex items-start">
						<span className="text-blue-600 mr-2">•</span>
						{item}
					</li>
				))}
			</ul>
		</div>
	);
};
