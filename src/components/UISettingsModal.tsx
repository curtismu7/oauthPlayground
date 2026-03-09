import React, { useState } from 'react';
import styled from 'styled-components';
import { useUISettings } from '../contexts/UISettingsContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: var(--color-background, white);
  border: 1px solid var(--color-border, V9_COLORS.TEXT.GRAY_LIGHTER);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border, V9_COLORS.TEXT.GRAY_LIGHTER);
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: var(--color-text-primary, #1e293b);
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--color-text-secondary, V9_COLORS.TEXT.GRAY_MEDIUM);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: var(--color-surface, V9_COLORS.BG.GRAY_LIGHT);
    color: var(--color-text-primary, #1e293b);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border, V9_COLORS.TEXT.GRAY_LIGHTER);
  background: var(--color-surface, V9_COLORS.BG.GRAY_LIGHT);
`;

const SaveButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-success, V9_COLORS.PRIMARY.GREEN);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-success-dark, V9_COLORS.PRIMARY.GREEN_DARK);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.saved {
    background: var(--color-success-dark, #047857);
    
    &:hover {
      background: var(--color-success-darker, V9_COLORS.PRIMARY.GREEN_DARK);
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      transform: none;
    }
  }
`;

const SaveStatus = styled.span`
  font-size: 0.875rem;
  color: var(--color-text-secondary, V9_COLORS.TEXT.GRAY_MEDIUM);
  font-style: italic;
`;

const Section = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: var(--color-text-primary, #1e293b);
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border, V9_COLORS.TEXT.GRAY_LIGHTER);
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SettingName = styled.span`
  color: var(--color-text-primary, #1e293b);
  font-weight: 500;
`;

const SettingDescription = styled.span`
  color: var(--color-text-secondary, V9_COLORS.TEXT.GRAY_MEDIUM);
  font-size: 0.875rem;
`;

const Toggle = styled.button<{ $active: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.$active ? 'var(--color-primary, V9_COLORS.PRIMARY.BLUE)' : 'var(--color-border, V9_COLORS.TEXT.GRAY_LIGHTER)')};
  
  &:before {
    content: '';
    position: absolute;
    top: 2px;
    left: ${(props) => (props.$active ? '22px' : '2px')};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid var(--color-border, V9_COLORS.TEXT.GRAY_LIGHTER);
  border-radius: 6px;
  background: var(--color-background, white);
  color: var(--color-text-primary, #1e293b);
  font-size: 0.875rem;
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary, V9_COLORS.PRIMARY.BLUE);
    box-shadow: 0 0 0 3px var(--color-primary-bg, #dbeafe);
  }
`;

const ColorSchemeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ColorSchemeButton = styled.button<{ $color: string; $active: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid ${(props) => (props.$active ? 'var(--color-text-primary, #1e293b)' : 'transparent')};
  background: ${(props) => {
		const colors = {
			blue: '#3b82f6',
			green: '#10b981',
			purple: '#8b5cf6',
			orange: '#f97316',
			red: '#ef4444',
		};
		return colors[props.$color as keyof typeof colors] || '#3b82f6';
	}};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

interface UISettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const UISettingsModal: React.FC<UISettingsModalProps> = ({ isOpen, onClose }) => {
	const { settings, updateSetting, saveSettings } = useUISettings();
	const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

	if (!isOpen) return null;

	const handleSave = async () => {
		setSaveStatus('saving');
		try {
			await saveSettings();
			setSaveStatus('saved');
			setTimeout(() => setSaveStatus('idle'), 2000);
		} catch (error) {
			log.error('UISettingsModal', 'Failed to save settings:', undefined, error as Error);
			setSaveStatus('idle');
		}
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<ModalOverlay onClick={handleOverlayClick}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>
						<span>⚙️</span>
						UI Settings
					</ModalTitle>
					<CloseButton onClick={onClose}>
						<span style={{ fontSize: '20px' }}>❌</span>
					</CloseButton>
				</ModalHeader>

				<ModalBody>
					{/* Theme Settings */}
					<Section>
						<SectionTitle>
							<span>☀️</span>
							Theme
						</SectionTitle>

						<SettingRow>
							<SettingLabel>
								<SettingName>Dark Mode</SettingName>
								<SettingDescription>Switch between light and dark themes</SettingDescription>
							</SettingLabel>
							<Toggle
								$active={settings.darkMode}
								onClick={() => updateSetting('darkMode', !settings.darkMode)}
							/>
						</SettingRow>

						<SettingRow>
							<SettingLabel>
								<SettingName>Font Size</SettingName>
								<SettingDescription>Adjust text size throughout the app</SettingDescription>
							</SettingLabel>
							<Select
								value={settings.fontSize}
								onChange={(e) =>
									updateSetting('fontSize', e.target.value as 'small' | 'medium' | 'large')
								}
							>
								<option value="small">Small</option>
								<option value="medium">Medium</option>
								<option value="large">Large</option>
							</Select>
						</SettingRow>

						<SettingRow>
							<SettingLabel>
								<SettingName>Color Scheme</SettingName>
								<SettingDescription>Choose your preferred accent color</SettingDescription>
							</SettingLabel>
							<ColorSchemeGrid>
								{(['blue', 'green', 'purple', 'orange', 'red'] as const).map((color) => (
									<ColorSchemeButton
										key={color}
										$color={color}
										$active={settings.colorScheme === color}
										onClick={() => updateSetting('colorScheme', color)}
										title={color.charAt(0).toUpperCase() + color.slice(1)}
									/>
								))}
							</ColorSchemeGrid>
						</SettingRow>
					</Section>

					{/* Behavior Settings - TEMPORARILY HIDDEN */}
					{/* <Section>
						<SectionTitle>
							<FiEye />
							Behavior
						</SectionTitle>

						<SettingRow>
							<SettingLabel>
								<SettingName>Auto-advance Steps</SettingName>
								<SettingDescription>Automatically progress through flow steps</SettingDescription>
							</SettingLabel>
							<Toggle
								$active={settings.autoAdvanceSteps}
								onClick={() => updateSetting('autoAdvanceSteps', !settings.autoAdvanceSteps)}
							/>
						</SettingRow>

						<SettingRow>
							<SettingLabel>
								<SettingName>Collapsible Sections</SettingName>
								<SettingDescription>Default state for expandable sections</SettingDescription>
							</SettingLabel>
							<Select
								value={settings.collapsibleDefaultState}
								onChange={(e) =>
									updateSetting(
										'collapsibleDefaultState',
										e.target.value as 'collapsed' | 'expanded'
									)
								}
							>
								<option value="collapsed">Collapsed</option>
								<option value="expanded">Expanded</option>
							</Select>
						</SettingRow>

						<SettingRow>
							<SettingLabel>
								<SettingName>Show Code Examples</SettingName>
								<SettingDescription>
									Display curl commands and API usage examples in OAuth flows
								</SettingDescription>
							</SettingLabel>
							<Toggle
								$active={settings.showApiCallExamples}
								onClick={() => updateSetting('showApiCallExamples', !settings.showApiCallExamples)}
							/>
						</SettingRow>
					</Section> */}

					{/* Developer Settings */}
					<Section>
						<SectionTitle>
							<span>❓</span>
							Developer
						</SectionTitle>

						<SettingRow>
							<SettingLabel>
								<SettingName>Console Logging Level</SettingName>
								<SettingDescription>Amount of debug information logged</SettingDescription>
							</SettingLabel>
							<Select
								value={settings.consoleLoggingLevel}
								onChange={(e) =>
									updateSetting(
										'consoleLoggingLevel',
										e.target.value as 'minimal' | 'normal' | 'verbose'
									)
								}
							>
								<option value="minimal">Minimal</option>
								<option value="normal">Normal</option>
								<option value="verbose">Verbose</option>
							</Select>
						</SettingRow>

						<SettingRow>
							<SettingLabel>
								<SettingName>Error Detail Level</SettingName>
								<SettingDescription>How much error information to show</SettingDescription>
							</SettingLabel>
							<Select
								value={settings.errorDetailLevel}
								onChange={(e) =>
									updateSetting('errorDetailLevel', e.target.value as 'basic' | 'detailed')
								}
							>
								<option value="basic">Basic</option>
								<option value="detailed">Detailed</option>
							</Select>
						</SettingRow>

						<SettingRow>
							<SettingLabel>
								<SettingName>Copy Button Behavior</SettingName>
								<SettingDescription>Show confirmation when copying text</SettingDescription>
							</SettingLabel>
							<Select
								value={settings.copyButtonBehavior}
								onChange={(e) =>
									updateSetting('copyButtonBehavior', e.target.value as 'confirmation' | 'silent')
								}
							>
								<option value="confirmation">Show Confirmation</option>
								<option value="silent">Silent</option>
							</Select>
						</SettingRow>
					</Section>
				</ModalBody>

				<ModalFooter>
					<SaveStatus>
						{saveStatus === 'saving' && 'Saving settings...'}
						{saveStatus === 'saved' && 'Settings saved successfully!'}
						{saveStatus === 'idle' && 'Settings are automatically saved'}
					</SaveStatus>
					<SaveButton
						onClick={handleSave}
						className={saveStatus === 'saved' ? 'saved' : ''}
						disabled={saveStatus === 'saving'}
					>
						<span>✅</span>
						{saveStatus === 'saving'
							? 'Saving...'
							: saveStatus === 'saved'
								? 'Saved!'
								: 'Save Settings'}
					</SaveButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};

export default UISettingsModal;
