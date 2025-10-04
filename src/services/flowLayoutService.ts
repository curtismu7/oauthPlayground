// src/services/flowLayoutService.ts
// Centralized styled components and layout management for V5 flows
// Matches exact styling from OAuth Implicit and Authorization Code flows

import styled from 'styled-components';

export interface FlowLayoutConfig {
	flowType: string;
	theme: 'green' | 'orange' | 'blue' | 'purple' | 'red';
	stepCount: number;
	hasPkce?: boolean;
	hasTokenExchange?: boolean;
	hasUserInfo?: boolean;
}

export class FlowLayoutService {
	// Container and wrapper components - matches OAuth Implicit/AuthZ flows exactly
	static getContainerStyles() {
		return styled.div`
      min-height: 100vh;
      background-color: #f9fafb;
      padding: 2rem 0 6rem;
    `;
	}

	static getContentWrapperStyles() {
		return styled.div`
      max-width: 64rem;
      margin: 0 auto;
      padding: 0 1rem;
    `;
	}

	static getMainCardStyles() {
		return styled.div`
      background-color: #ffffff;
      border-radius: 1rem;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    `;
	}

	// Step header components - matches OAuth Implicit/AuthZ flows exactly
	static getStepHeaderStyles(theme: string) {
		const gradients = {
			green: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
			orange: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
			blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
			purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
			red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
		};

		return styled.div`
      background: ${gradients[theme as keyof typeof gradients] || gradients.green};
      color: #ffffff;
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
	}

	static getStepHeaderLeftStyles() {
		return styled.div`
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `;
	}

	static getStepHeaderRightStyles() {
		return styled.div`
      text-align: right;
    `;
	}

	static getVersionBadgeStyles(theme: string) {
		const themeColors = {
			green: {
				background: 'rgba(22, 163, 74, 0.2)',
				border: '#4ade80',
				color: '#bbf7d0',
			},
			orange: {
				background: 'rgba(249, 115, 22, 0.2)',
				border: '#fb923c',
				color: '#fed7aa',
			},
			blue: {
				background: 'rgba(59, 130, 246, 0.2)',
				border: '#3b82f6',
				color: '#dbeafe',
			},
			purple: {
				background: 'rgba(139, 92, 246, 0.2)',
				border: '#8b5cf6',
				color: '#ede9fe',
			},
			red: {
				background: 'rgba(239, 68, 68, 0.2)',
				border: '#ef4444',
				color: '#fecaca',
			},
		};

		const colors = themeColors[theme as keyof typeof themeColors] || themeColors.green;

		return styled.span`
      align-self: flex-start;
      background: ${colors.background};
      border: 1px solid ${colors.border};
      color: ${colors.color};
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    `;
	}

	static getStepHeaderTitleStyles() {
		return styled.h2`
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
    `;
	}

	static getStepHeaderSubtitleStyles() {
		return styled.p`
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
    `;
	}

	static getStepNumberStyles() {
		return styled.div`
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1;
    `;
	}

	static getStepTotalStyles() {
		return styled.div`
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.75);
      letter-spacing: 0.05em;
    `;
	}

	static getStepContentWrapperStyles() {
		return styled.div`
      padding: 2rem;
      background: #ffffff;
    `;
	}

	// Collapsible section components - matches OAuth Implicit/AuthZ flows exactly
	static getCollapsibleSectionStyles() {
		return styled.section`
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
      background-color: #ffffff;
      box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
    `;
	}

	static getCollapsibleHeaderButtonStyles(theme: string) {
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

		const colors = themeColors[theme as keyof typeof themeColors] || themeColors.green;

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

	static getCollapsibleTitleStyles() {
		return styled.span`
      display: flex;
      align-items: center;
      gap: 0.75rem;
    `;
	}

	static getCollapsibleToggleIconStyles(theme: string) {
		const themeColors = {
			green: '#16a34a',
			orange: '#ea580c',
			blue: '#3b82f6',
			purple: '#8b5cf6',
			red: '#ef4444',
		};

		const color = themeColors[theme as keyof typeof themeColors] || themeColors.green;

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

	static getCollapsibleContentStyles() {
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

	// Info box components - matches OAuth Implicit/AuthZ flows exactly
	static getInfoBoxStyles() {
		return styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'danger' }>`
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      border: 1px solid
        ${({ $variant }) => {
					if ($variant === 'warning') return '#f59e0b';
					if ($variant === 'success') return '#22c55e';
					if ($variant === 'danger') return '#ef4444';
					return '#3b82f6';
				}};
      background-color:
        ${({ $variant }) => {
					if ($variant === 'warning') return '#fef3c7';
					if ($variant === 'success') return '#dcfce7';
					if ($variant === 'danger') return '#fee2e2';
					return '#dbeafe';
				}};
    `;
	}

	static getInfoTitleStyles() {
		return styled.h3`
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
    `;
	}

	static getInfoTextStyles() {
		return styled.p`
      font-size: 0.95rem;
      color: #3f3f46;
      line-height: 1.7;
      margin: 0;
    `;
	}

	static getInfoListStyles() {
		return styled.ul`
      font-size: 0.875rem;
      color: #334155;
      line-height: 1.5;
      margin: 0.5rem 0 0;
      padding-left: 1.5rem;
    `;
	}

	// Requirements indicator - matches OAuth Implicit/AuthZ flows exactly
	static getRequirementsIndicatorStyles() {
		return styled.div`
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    `;
	}

	static getRequirementsIconStyles() {
		return styled.div`
      color: #d97706;
      font-size: 1.25rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    `;
	}

	static getRequirementsTextStyles() {
		return styled.div`
      color: #92400e;
      font-size: 0.875rem;
      line-height: 1.5;

      strong {
        font-weight: 600;
        display: block;
        margin-bottom: 0.5rem;
      }

      ul {
        margin: 0;
        padding-left: 1.25rem;
      }

      li {
        margin-bottom: 0.25rem;
      }
    `;
	}

	// Action row and buttons - matches OAuth Implicit/AuthZ flows exactly
	static getActionRowStyles() {
		return styled.div`
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      margin-top: 1.5rem;
    `;
	}

	static getButtonStyles() {
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

	static getHighlightedActionButtonStyles() {
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

	// Form components - matches OAuth Implicit/AuthZ flows exactly
	static getFormGroupStyles() {
		return styled.div`
      margin-bottom: 1rem;
    `;
	}

	static getLabelStyles() {
		return styled.label`
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    `;
	}

	static getInputStyles() {
		return styled.input`
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      &:disabled {
        background-color: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
      }
    `;
	}

	static getPasswordInputWrapperStyles() {
		return styled.div`
      position: relative;
      display: flex;
      align-items: center;
    `;
	}

	static getPasswordToggleButtonStyles() {
		return styled.button`
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: #374151;
      }
    `;
	}

	static getSelectStyles() {
		return styled.select`
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      &:disabled {
        background-color: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
      }
    `;
	}

	static getTextAreaStyles() {
		return styled.textarea`
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      min-height: 100px;
      resize: vertical;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      &:disabled {
        background-color: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
      }
    `;
	}

	// Results panel components - matches OAuth Implicit/AuthZ flows exactly
	static getResultsPanelStyles() {
		return styled.div`
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin: 1.5rem 0;
    `;
	}

	static getResultsSectionStyles() {
		return styled.div`
      margin-bottom: 1.5rem;

      &:last-child {
        margin-bottom: 0;
      }
    `;
	}

	static getResultsHeadingStyles() {
		return styled.h3`
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
	}

	static getParameterGridStyles() {
		return styled.div`
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    `;
	}

	static getParameterGridItemStyles() {
		return styled.div`
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
    `;
	}

	static getCodeBlockStyles() {
		return styled.pre`
      background: #1f2937;
      color: #f9fafb;
      padding: 1rem;
      border-radius: 0.5rem;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      overflow-x: auto;
      margin: 0;
    `;
	}

	// Explanation section components - matches OAuth Implicit/AuthZ flows exactly
	static getExplanationSectionStyles() {
		return styled.div`
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin: 1.5rem 0;
    `;
	}

	static getExplanationHeadingStyles() {
		return styled.h3`
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
	}

	// Step navigation components - matches OAuth Implicit/AuthZ flows exactly
	static getStepNavigationStyles() {
		return styled.div`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    `;
	}

	static getStepNavigationButtonStyles() {
		return styled.button<{
			$variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
			$disabled?: boolean;
		}>`
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
      transition: all 0.2s;
      border: 1px solid transparent;
      opacity: ${(props) => (props.$disabled ? 0.6 : 1)};

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
				$variant === 'secondary' &&
				`
        background-color: #6b7280;
        color: #ffffff;
        &:hover:not(:disabled) {
          background-color: #4b5563;
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
        color: #6b7280;
        border-color: #d1d5db;
        &:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
      `}
    `;
	}

	static getStepNavigationButtonTextStyles() {
		return styled.span`
      font-weight: 600;
    `;
	}

	static getStepNavigationButtonIconStyles() {
		return styled.span`
      display: flex;
      align-items: center;
      justify-content: center;
    `;
	}

	static getStepNavigationProgressStyles() {
		return styled.div`
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
	}

	static getStepNavigationProgressBarStyles() {
		return styled.div`
      display: flex;
      align-items: center;
      gap: 0.25rem;
    `;
	}

	static getStepNavigationProgressFillStyles() {
		return styled.div<{ $progress: number }>`
      width: 100px;
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;

      &::after {
        content: '';
        display: block;
        width: ${({ $progress }) => $progress}%;
        height: 100%;
        background: #3b82f6;
        transition: width 0.3s ease;
      }
    `;
	}

	static getStepNavigationProgressTextStyles() {
		return styled.span`
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    `;
	}

	static getStepNavigationProgressDotStyles() {
		return styled.div<{
			$status:
				| 'completed'
				| 'current'
				| 'upcoming'
				| 'disabled'
				| 'error'
				| 'warning'
				| 'info'
				| 'success'
				| 'danger';
		}>`
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${({ $status }) => {
				switch ($status) {
					case 'completed':
						return '#22c55e';
					case 'current':
						return '#3b82f6';
					case 'upcoming':
						return '#d1d5db';
					case 'disabled':
						return '#f3f4f6';
					case 'error':
						return '#ef4444';
					case 'warning':
						return '#f59e0b';
					case 'info':
						return '#3b82f6';
					case 'success':
						return '#22c55e';
					case 'danger':
						return '#ef4444';
					default:
						return '#d1d5db';
				}
			}};
      border: ${({ $status }) => {
				switch ($status) {
					case 'current':
						return '2px solid #3b82f6';
					case 'completed':
						return '2px solid #22c55e';
					case 'error':
						return '2px solid #ef4444';
					case 'warning':
						return '2px solid #f59e0b';
					case 'info':
						return '2px solid #3b82f6';
					case 'success':
						return '2px solid #22c55e';
					case 'danger':
						return '2px solid #ef4444';
					default:
						return '2px solid transparent';
				}
			}};
      transition: all 0.2s ease;
    `;
	}

	// Utility methods
	static getThemeColors(theme: string) {
		const themes = {
			green: {
				primary: '#16a34a',
				primaryHover: '#15803d',
				secondary: '#22c55e',
				secondaryHover: '#16a34a',
				background: 'rgba(22, 163, 74, 0.2)',
				border: '#4ade80',
				text: '#bbf7d0',
			},
			orange: {
				primary: '#f97316',
				primaryHover: '#ea580c',
				secondary: '#fb923c',
				secondaryHover: '#f97316',
				background: 'rgba(249, 115, 22, 0.2)',
				border: '#fb923c',
				text: '#fed7aa',
			},
			blue: {
				primary: '#3b82f6',
				primaryHover: '#2563eb',
				secondary: '#60a5fa',
				secondaryHover: '#3b82f6',
				background: 'rgba(59, 130, 246, 0.2)',
				border: '#3b82f6',
				text: '#dbeafe',
			},
			purple: {
				primary: '#8b5cf6',
				primaryHover: '#7c3aed',
				secondary: '#a78bfa',
				secondaryHover: '#8b5cf6',
				background: 'rgba(139, 92, 246, 0.2)',
				border: '#8b5cf6',
				text: '#ede9fe',
			},
			red: {
				primary: '#ef4444',
				primaryHover: '#dc2626',
				secondary: '#f87171',
				secondaryHover: '#ef4444',
				background: 'rgba(239, 68, 68, 0.2)',
				border: '#ef4444',
				text: '#fecaca',
			},
		};

		return themes[theme as keyof typeof themes] || themes.green;
	}

	static getFlowLayoutConfig(flowType: string): FlowLayoutConfig {
		const configs: Record<string, FlowLayoutConfig> = {
			implicit: {
				flowType: 'implicit',
				theme: 'orange',
				stepCount: 5,
				hasPkce: false,
				hasTokenExchange: false,
				hasUserInfo: false,
			},
			'authorization-code': {
				flowType: 'authorization-code',
				theme: 'green',
				stepCount: 7,
				hasPkce: true,
				hasTokenExchange: true,
				hasUserInfo: false,
			},
			'client-credentials': {
				flowType: 'client-credentials',
				theme: 'green',
				stepCount: 4,
				hasPkce: false,
				hasTokenExchange: false,
				hasUserInfo: false,
			},
			'device-authorization': {
				flowType: 'device-authorization',
				theme: 'purple',
				stepCount: 6,
				hasPkce: false,
				hasTokenExchange: true,
				hasUserInfo: false,
			},
			'resource-owner-password': {
				flowType: 'resource-owner-password',
				theme: 'red',
				stepCount: 4,
				hasPkce: false,
				hasTokenExchange: false,
				hasUserInfo: false,
			},
			'jwt-bearer': {
				flowType: 'jwt-bearer',
				theme: 'blue',
				stepCount: 4,
				hasPkce: false,
				hasTokenExchange: false,
				hasUserInfo: false,
			},
		};

		return (
			configs[flowType] || {
				flowType,
				theme: 'blue',
				stepCount: 4,
				hasPkce: false,
				hasTokenExchange: false,
				hasUserInfo: false,
			}
		);
	}
}

export default FlowLayoutService;
