// src/services/flowComponentService.tsx
// FlowComponentService - Reusable flow components and UI patterns

import styled from 'styled-components';

export interface ActionConfig {
	label: string;
	variant: 'primary' | 'success' | 'secondary' | 'danger' | 'outline';
	action: string;
	disabled?: boolean;
	icon?: React.ReactNode;
}

export interface CollapsibleSectionConfig {
	key: string;
	title: string;
	icon?: string;
	defaultCollapsed?: boolean;
	content: React.ReactNode;
}

export interface RequirementsIndicatorConfig {
	requirements: string[];
	variant?: 'warning' | 'info' | 'success' | 'danger';
}

export class FlowComponentService {
	/**
	 * Create a flow container with consistent styling
	 */
	static createFlowContainer() {
		return styled.div`
      min-height: 100vh;
      background-color: #f9fafb;
      padding: 2rem 0 6rem;
    `;
	}

	/**
	 * Create a content wrapper with consistent max-width and padding
	 */
	static createContentWrapper() {
		return styled.div`
      max-width: 64rem;
      margin: 0 auto;
      padding: 0 1rem;
    `;
	}

	/**
	 * Create a main card with consistent styling
	 */
	static createMainCard() {
		return styled.div`
      background-color: #ffffff;
      border-radius: 1rem;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    `;
	}

	/**
	 * Create a step header with theme-specific styling
	 */
	static createStepHeader(theme: string = 'blue') {
		const themeColors = {
			blue: {
				background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
				border: '#3b82f6',
				text: '#ffffff',
			},
			green: {
				background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
				border: '#10b981',
				text: '#ffffff',
			},
			purple: {
				background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
				border: '#8b5cf6',
				text: '#ffffff',
			},
			orange: {
				background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
				border: '#f97316',
				text: '#ffffff',
			},
			red: {
				background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
				border: '#ef4444',
				text: '#ffffff',
			},
		};

		const colors = themeColors[theme as keyof typeof themeColors] || themeColors.blue;

		return styled.div`
      background: ${colors.background};
      color: ${colors.text};
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
	}

	/**
	 * Create a step header left section
	 */
	static createStepHeaderLeft() {
		return styled.div`
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `;
	}

	/**
	 * Create a step header right section
	 */
	static createStepHeaderRight() {
		return styled.div`
      text-align: right;
    `;
	}

	/**
	 * Create a version badge with theme-specific styling
	 */
	static createVersionBadge(theme: string = 'blue') {
		const themeColors = {
			blue: {
				background: 'rgba(59, 130, 246, 0.2)',
				border: '#3b82f6',
				text: '#dbeafe',
			},
			green: {
				background: 'rgba(16, 185, 129, 0.2)',
				border: '#10b981',
				text: '#d1fae5',
			},
			purple: {
				background: 'rgba(139, 92, 246, 0.2)',
				border: '#8b5cf6',
				text: '#ede9fe',
			},
			orange: {
				background: 'rgba(249, 115, 22, 0.2)',
				border: '#f97316',
				text: '#fed7aa',
			},
			red: {
				background: 'rgba(239, 68, 68, 0.2)',
				border: '#ef4444',
				text: '#fecaca',
			},
		};

		const colors = themeColors[theme as keyof typeof themeColors] || themeColors.blue;

		return styled.span`
      align-self: flex-start;
      background: ${colors.background};
      border: 1px solid ${colors.border};
      color: ${colors.text};
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    `;
	}

	/**
	 * Create a step header title
	 */
	static createStepHeaderTitle() {
		return styled.h2`
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
    `;
	}

	/**
	 * Create a step header subtitle
	 */
	static createStepHeaderSubtitle() {
		return styled.p`
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
    `;
	}

	/**
	 * Create a step number display
	 */
	static createStepNumber() {
		return styled.div`
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1;
    `;
	}

	/**
	 * Create a step total display
	 */
	static createStepTotal() {
		return styled.div`
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.75);
      letter-spacing: 0.05em;
    `;
	}

	/**
	 * Create a step content wrapper
	 */
	static createStepContentWrapper() {
		return styled.div`
      padding: 2rem;
      background: #ffffff;
    `;
	}

	/**
	 * Create a collapsible section - matches OAuth Implicit/AuthZ flows exactly
	 */
	static createCollapsibleSection() {
		return styled.section`
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
      background-color: #ffffff;
      box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
    `;
	}

	/**
	 * Create a collapsible header button with theme support - matches OAuth Implicit/AuthZ flows exactly
	 */
	static createCollapsibleHeaderButton(theme: string = 'blue') {
		const themeColors = {
			green: {
				background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%)',
				hover: 'linear-gradient(135deg, #dcfce7 0%, #ecfdf3 100%)',
				color: '#14532d',
			},
			orange: {
				background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
				hover: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
				color: '#7c2d12',
			},
			blue: {
				background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
				hover: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
				color: '#0c4a6e',
			},
			purple: {
				background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
				hover: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
				color: '#581c87',
			},
			red: {
				background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
				hover: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
				color: '#7f1d1d',
			},
		};

		const colors = themeColors[theme as keyof typeof themeColors] || themeColors.blue;

		return styled.button<{ $collapsed?: boolean }>`
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 1.25rem 1.5rem;
      background: ${colors.background};
      border: none;
      border-radius: 0.75rem;
      cursor: pointer;
      font-size: 1.1rem;
      font-weight: 600;
      color: ${colors.color};
      transition: background 0.2s ease;

      &:hover {
        background: ${colors.hover};
      }
    `;
	}

	/**
	 * Create a collapsible title - matches OAuth Implicit/AuthZ flows exactly
	 */
	static createCollapsibleTitle() {
		return styled.span`
      display: flex;
      align-items: center;
      gap: 0.75rem;
    `;
	}

	/**
	 * Create a collapsible toggle icon with theme support - matches OAuth Implicit/AuthZ flows exactly
	 */
	static createCollapsibleToggleIcon(theme: string = 'blue') {
		const themeColors = {
			green: '#16a34a',
			orange: '#ea580c',
			blue: '#3b82f6',
			purple: '#8b5cf6',
			red: '#ef4444',
		};

		const color = themeColors[theme as keyof typeof themeColors] || themeColors.blue;

		return styled.span<{ $collapsed?: boolean }>`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${color};
      color: white;
      transition: transform 0.2s ease;
      transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};

      svg {
        width: 16px;
        height: 16px;
      }

      &:hover {
        transform: ${({ $collapsed }) =>
					$collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'};
      }
    `;
	}

	/**
	 * Create a collapsible content area - matches OAuth Implicit/AuthZ flows exactly
	 */
	static createCollapsibleContent() {
		return styled.div`
      padding: 1.5rem;
      padding-top: 0;
      animation: fadeIn 0.2s ease;

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `;
	}

	/**
	 * Create a requirements indicator
	 */
	static createRequirementsIndicator() {
		return styled.div<{ $variant?: 'warning' | 'info' | 'success' | 'danger' }>`
      background: ${({ $variant }) => {
				switch ($variant) {
					case 'warning':
						return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
					case 'info':
						return 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
					case 'success':
						return 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)';
					case 'danger':
						return 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
					default:
						return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
				}
			}};
      border: 1px solid ${({ $variant }) => {
				switch ($variant) {
					case 'warning':
						return '#f59e0b';
					case 'info':
						return '#3b82f6';
					case 'success':
						return '#22c55e';
					case 'danger':
						return '#ef4444';
					default:
						return '#f59e0b';
				}
			}};
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    `;
	}

	/**
	 * Create a requirements icon
	 */
	static createRequirementsIcon() {
		return styled.div`
      color: #d97706;
      font-size: 1.25rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    `;
	}

	/**
	 * Create a requirements text
	 */
	static createRequirementsText() {
		return styled.div`
      flex: 1;
      font-size: 0.875rem;
      color: #92400e;

      strong {
        display: block;
        margin-bottom: 0.5rem;
        color: #78350f;
      }

      ul {
        margin: 0;
        padding-left: 1.25rem;

        li {
          margin-bottom: 0.25rem;
        }
      }
    `;
	}

	/**
	 * Create an info box
	 */
	static createInfoBox() {
		return styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'danger' }>`
      border-radius: 0;
      padding: 1.5rem;
      margin: 0;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      border: 1px solid ${({ $variant }) => {
				switch ($variant) {
					case 'warning':
						return '#f59e0b';
					case 'success':
						return '#22c55e';
					case 'danger':
						return '#ef4444';
					default:
						return '#3b82f6';
				}
			}};
      background-color: ${({ $variant }) => {
				switch ($variant) {
					case 'warning':
						return '#fef3c7';
					case 'success':
						return '#dcfce7';
					case 'danger':
						return '#fee2e2';
					default:
						return '#dbeafe';
				}
			}};
    `;
	}

	/**
	 * Create an info title
	 */
	static createInfoTitle() {
		return styled.h3`
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
    `;
	}

	/**
	 * Create an info text
	 */
	static createInfoText() {
		return styled.p`
      font-size: 0.95rem;
      color: #3f3f46;
      line-height: 1.7;
      margin: 0;
    `;
	}

	/**
	 * Create an info list
	 */
	static createInfoList() {
		return styled.ul`
      font-size: 0.875rem;
      color: #334155;
      line-height: 1.5;
      margin: 0.5rem 0 0;
      padding-left: 1.5rem;
    `;
	}

	/**
	 * Create an action row
	 */
	static createActionRow() {
		return styled.div`
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      margin-top: 1.5rem;
    `;
	}

	/**
	 * Create a button with theme-specific styling
	 */
	static createButton() {
		return styled.button<{
			$variant?: 'primary' | 'success' | 'secondary' | 'danger' | 'outline';
		}>`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
      transition: all 0.2s;
      border: 1px solid transparent;
      opacity: ${(props) => (props.disabled ? 0.6 : 1)};

      ${({ $variant }) =>
				$variant === 'primary' &&
				`
        background-color: #3b82f6;
        color: #ffffff;
        &:hover:not(:disabled) {
          background-color: #2563eb;
        }
      `}

      ${({ $variant }) =>
				$variant === 'success' &&
				`
        background-color: #22c55e;
        color: #ffffff;
        &:hover:not(:disabled) {
          background-color: #16a34a;
        }
      `}

      ${({ $variant }) =>
				$variant === 'secondary' &&
				`
        background-color: #0ea5e9;
        color: #ffffff;
        &:hover:not(:disabled) {
          background-color: #0284c7;
        }
      `}

      ${({ $variant }) =>
				$variant === 'danger' &&
				`
        background-color: #ef4444;
        color: #ffffff;
        &:hover:not(:disabled) {
          background-color: #dc2626;
        }
      `}

      ${({ $variant }) =>
				$variant === 'outline' &&
				`
        background-color: transparent;
        color: #3b82f6;
        border-color: #3b82f6;
        &:hover:not(:disabled) {
          background-color: #f8fafc;
          border-color: #2563eb;
        }
      `}
    `;
	}

	/**
	 * Create a highlighted action button
	 */
	static createHighlightedActionButton() {
		return styled.button<{ $priority: 'primary' | 'success' }>`
      position: relative;
      background: ${({ $priority }) =>
				$priority === 'primary'
					? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
					: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'};
      box-shadow: ${({ $priority }) =>
				$priority === 'primary'
					? '0 6px 18px rgba(59, 130, 246, 0.35)'
					: '0 6px 18px rgba(34, 197, 94, 0.35)'};
      color: #ffffff;
      padding-right: 2.5rem;

      &:hover {
        transform: scale(1.02);
      }

      &:disabled {
        background: ${({ $priority }) =>
					$priority === 'primary'
						? 'linear-gradient(135deg, rgba(59,130,246,0.6) 0%, rgba(37,99,235,0.6) 100%)'
						: 'linear-gradient(135deg, rgba(34,197,94,0.6) 0%, rgba(22,163,74,0.6) 100%)'};
        box-shadow: none;
      }
    `;
	}
}

export default FlowComponentService;
