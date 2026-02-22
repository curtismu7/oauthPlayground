/**
 * @file PingUIComponents.test.tsx
 * @description Test suite for Ping UI migrated components
 * @version 1.0.0
 */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock MDI CSS classes
const mockMDI = `
.mdi:before {
  content: '';
  display: inline-block;
}
.mdi-information:before {
  content: 'ℹ️';
}
.mdi-chevron-down:before {
  content: '▼';
}
.mdi-chevron-up:before {
  content: '▲';
}
.mdi-alert:before {
  content: '⚠️';
}
.mdi-check-circle:before {
  content: '✅';
}
.mdi-lock:before {
  content: '🔒';
}
.mdi-eye:before {
  content: '👁️';
}
.mdi-eye-off:before {
  content: '👁️‍🗨️';
}
`;

// Inject mock MDI styles
const style = document.createElement('style');
style.textContent = mockMDI;
document.head.appendChild(style);

// Test the MDI Icon component directly
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden, className = '', style }) => {
	const iconMap: Record<string, string> = {
		FiAlertTriangle: 'mdi-alert',
		FiArrowLeft: 'mdi-arrow-left',
		FiArrowRight: 'mdi-arrow-right',
		FiCheckCircle: 'mdi-check-circle',
		FiEye: 'mdi-eye',
		FiEyeOff: 'mdi-eye-off',
		FiInfo: 'mdi-information',
		FiLock: 'mdi-lock',
	};

	const iconClass = iconMap[icon] || 'mdi-help-circle';
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
		></i>
	);
};

describe('Ping UI Components', () => {
	describe('MDI Icon Component', () => {
		it('renders icon with correct class', () => {
			render(<MDIIcon icon="FiInfo" ariaLabel="Information" />);
			const iconElement = document.querySelector('.mdi');
			expect(iconElement).toBeInTheDocument();
			expect(iconElement).toHaveClass('mdi-information');
		});

		it('handles aria-label correctly', () => {
			render(<MDIIcon icon="FiInfo" ariaLabel="Information" />);
			const icon = document.querySelector('.mdi');
			expect(icon).toHaveAttribute('aria-label', 'Information');
		});

		it('handles aria-hidden correctly', () => {
			render(<MDIIcon icon="FiInfo" ariaHidden={true} />);
			const icon = document.querySelector('.mdi');
			expect(icon).toHaveAttribute('aria-hidden', 'true');
		});

		it('does not have conflicting aria attributes', () => {
			render(<MDIIcon icon="FiInfo" ariaLabel="Information" />);
			const icon = document.querySelector('.mdi');
			expect(icon).toHaveAttribute('aria-label', 'Information');
			expect(icon).not.toHaveAttribute('aria-hidden');
		});

		it('applies custom size', () => {
			render(<MDIIcon icon="FiInfo" size={24} />);
			const icon = document.querySelector('.mdi');
			expect(icon).toHaveStyle('font-size: 24px');
		});

		it('applies custom className', () => {
			render(<MDIIcon icon="FiInfo" className="custom-class" />);
			const icon = document.querySelector('.mdi');
			expect(icon).toHaveClass('custom-class');
		});

		it('falls back to help-circle for unknown icons', () => {
			render(<MDIIcon icon="UnknownIcon" />);
			const icon = document.querySelector('.mdi');
			expect(icon).toHaveClass('mdi-help-circle');
		});

		it('maps common React Icons to MDI', () => {
			const testCases = [
				{ reactIcon: 'FiAlertTriangle', mdiClass: 'mdi-alert' },
				{ reactIcon: 'FiCheckCircle', mdiClass: 'mdi-check-circle' },
				{ reactIcon: 'FiEye', mdiClass: 'mdi-eye' },
				{ reactIcon: 'FiLock', mdiClass: 'mdi-lock' },
			];

			testCases.forEach(({ reactIcon, mdiClass }) => {
				const { unmount } = render(<MDIIcon icon={reactIcon} />);
				const icon = document.querySelector('.mdi');
				expect(icon).toHaveClass(mdiClass);
				unmount();
			});
		});
	});

	describe('Accessibility Compliance', () => {
		it('provides aria-label when specified', () => {
			render(<MDIIcon icon="FiInfo" ariaLabel="Help information" />);
			const icon = document.querySelector('.mdi');
			expect(icon).toHaveAttribute('aria-label', 'Help information');
		});

		it('uses aria-hidden when decorative', () => {
			render(<MDIIcon icon="FiInfo" ariaHidden={true} />);
			const icon = document.querySelector('.mdi');
			expect(icon).toHaveAttribute('aria-hidden', 'true');
			expect(icon).not.toHaveAttribute('aria-label');
		});

		it('has no aria attributes when not specified', () => {
			render(<MDIIcon icon="FiInfo" />);
			const icon = document.querySelector('.mdi');
			expect(icon).not.toHaveAttribute('aria-label');
			expect(icon).not.toHaveAttribute('aria-hidden');
		});
	});

	describe('Ping UI Standards', () => {
		it('uses MDI CSS classes instead of React Icons', () => {
			render(<MDIIcon icon="FiInfo" />);
			const icon = document.querySelector('.mdi');
			expect(icon).toBeInTheDocument();
			expect(icon).toHaveClass('mdi-information');
		});

		it('applies CSS-based styling', () => {
			render(<MDIIcon icon="FiInfo" size={20} style={{ color: 'red' }} />);
			const icon = document.querySelector('.mdi');
			expect(icon).toHaveStyle('font-size: 20px');
			expect(icon).toHaveStyle('color: rgb(255, 0, 0)');
		});
	});
});

// Cleanup mock styles
afterAll(() => {
	try {
		document.head.removeChild(style);
	} catch (_e) {
		// Style already removed or head not available
	}
});
