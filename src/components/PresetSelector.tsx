// src/components/PresetSelector.tsx
// Preset selection component for the Application Generator

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
	type BuilderAppType,
	type ConfigurationPreset,
	presetManagerService,
} from '../services/presetManagerService';
import { performAutoMigration } from '../utils/presetMigration';

import { logger } from '../utils/logger';
const Container = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 247, 255, 0.92) 100%);
  border-radius: 1.25rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 28px 75px -40px rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.35);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0;
`;

const Description = styled.p`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  margin: 0.5rem 0 1.5rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const CategorySection = styled.div`
  margin-bottom: 2rem;
`;

const CategoryTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const PresetCard = styled.div<{ selected: boolean; category: 'built-in' | 'custom' }>`
  background: ${({ selected }) => (selected ? 'linear-gradient(135deg, V9_COLORS.BG.GRAY_LIGHT 0%, #dbeafe 100%)' : 'white')};
  border: 2px solid ${({ selected, theme }) => (selected ? theme.colors.primary : 'rgba(148, 163, 184, 0.25)')};
  border-radius: 0.75rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  ${({ category }) =>
		category === 'built-in' &&
		`
    &::before {
      content: '';
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 8px;
      height: 8px;
      background: V9_COLORS.PRIMARY.GREEN;
      border-radius: 50%;
    }
  `}
`;

const PresetHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const PresetName = styled.h5`
  font-size: 1rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0;
  line-height: 1.3;
`;

const PresetBadge = styled.span<{ category: 'built-in' | 'custom' }>`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background: ${({ category }) => (category === 'built-in' ? '#ecfdf5' : '#fef3c7')};
  color: ${({ category }) => (category === 'built-in' ? '#059669' : '#d97706')};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const PresetDescription = styled.p`
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0 0 1rem 0;
`;

const PresetMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const MetaTag = styled.span<{ $variant: 'security' | 'type' | 'tag' }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'security':
				return `
          background: V9_COLORS.BG.ERROR;
          color: V9_COLORS.PRIMARY.RED_DARK;
          border: 1px solid V9_COLORS.BG.ERROR_BORDER;
        `;
			case 'type':
				return `
          background: V9_COLORS.BG.GRAY_LIGHT;
          color: V9_COLORS.PRIMARY.BLUE_DARK;
          border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
        `;
			case 'tag':
				return `
          background: #f3f4f6;
          color: V9_COLORS.TEXT.GRAY_DARK;
          border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
        `;
		}
	}}
`;

const PresetActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const SelectButton = styled.button<{ selected: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${({ selected, theme }) =>
		selected
			? `
    background: ${theme.colors.primary};
    color: white;
    &:hover {
      background: ${theme.colors.primaryDark};
    }
  `
			: `
    background: white;
    color: ${theme.colors.gray700};
    border-color: V9_COLORS.TEXT.GRAY_LIGHTER;
    &:hover {
      background: #f9fafb;
      border-color: ${theme.colors.primary};
    }
  `}
`;

const InfoButton = styled.button`
  padding: 0.5rem;
  border: none;
  background: none;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  
  &:hover {
    background: #f3f4f6;
    color: V9_COLORS.TEXT.GRAY_DARK;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  
  svg {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: V9_COLORS.TEXT.GRAY_LIGHT;
  }
`;

const FilterSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button.withConfig({
	shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  
  ${({ active, theme }) =>
		active
			? `
    background: ${theme.colors.primary};
    color: white;
    border-color: ${theme.colors.primary};
  `
			: `
    background: white;
    color: V9_COLORS.TEXT.GRAY_DARK;
    &:hover {
      background: #f9fafb;
      border-color: ${theme.colors.primary};
    }
  `}
`;

interface PresetSelectorProps {
	selectedAppType: BuilderAppType | null;
	selectedPreset: string | null;
	onPresetSelect: (presetId: string | null) => void;
	onPresetApply: (presetId: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
	selectedAppType,
	selectedPreset,
	onPresetSelect,
	onPresetApply,
}) => {
	const [presets, setPresets] = useState<ConfigurationPreset[]>([]);
	const [filter, setFilter] = useState<'all' | 'built-in' | 'custom'>('all');
	const [loading, setLoading] = useState(true);

	const loadPresets = useCallback(async () => {
		try {
			setLoading(true);

			// Perform auto-migration if needed
			const migrationResult = performAutoMigration();
			if (!migrationResult.success) {
				logger.warn('PresetSelector', '[PresetSelector] Migration warnings:', {
					warnings: migrationResult.warnings,
				});
			}

			// Load all presets
			const allPresets = presetManagerService.getAllPresets();
			setPresets(allPresets);
		} catch (error) {
			logger.error(
				'PresetSelector',
				'[PresetSelector] Failed to load presets:',
				undefined,
				error as Error
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadPresets();
	}, [loadPresets]);

	const filteredPresets = presets.filter((preset) => {
		// Filter by app type if selected
		if (selectedAppType && preset.appType !== selectedAppType) {
			return false;
		}

		// Filter by category
		if (filter !== 'all' && preset.category !== filter) {
			return false;
		}

		return true;
	});

	const groupedPresets = filteredPresets.reduce(
		(groups, preset) => {
			const category = preset.category;
			if (!groups[category]) {
				groups[category] = [];
			}
			groups[category].push(preset);
			return groups;
		},
		{} as Record<string, ConfigurationPreset[]>
	);

	const handlePresetClick = (presetId: string) => {
		if (selectedPreset === presetId) {
			// Deselect if already selected
			onPresetSelect(null);
		} else {
			// Select and apply preset
			onPresetSelect(presetId);
			onPresetApply(presetId);
		}
	};

	if (loading) {
		return (
			<Container>
				<Header>
					<span>⚙️</span>
					<Title>Configuration Presets</Title>
				</Header>
				<Description>Loading presets...</Description>
			</Container>
		);
	}

	return (
		<Container>
			<Header>
				<span>⚙️</span>
				<Title>Configuration Presets</Title>
			</Header>

			<Description>
				Choose from predefined configuration templates or your custom presets to quickly set up
				applications with best practices.
				{selectedAppType ? (
					<strong style={{ color: '#ef4444' }}>
						{' '}
						Templates are filtered for {selectedAppType.replace(/_/g, ' ')} applications.
					</strong>
				) : (
					<strong> Select an application type above to see relevant templates.</strong>
				)}
			</Description>

			<FilterSection>
				<FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
					All Presets ({filteredPresets.length})
				</FilterButton>
				<FilterButton active={filter === 'built-in'} onClick={() => setFilter('built-in')}>
					Built-in (
					{
						presets.filter(
							(p) =>
								p.category === 'built-in' && (!selectedAppType || p.appType === selectedAppType)
						).length
					}
					)
				</FilterButton>
				<FilterButton active={filter === 'custom'} onClick={() => setFilter('custom')}>
					Custom (
					{
						presets.filter(
							(p) => p.category === 'custom' && (!selectedAppType || p.appType === selectedAppType)
						).length
					}
					)
				</FilterButton>
			</FilterSection>

			{filteredPresets.length === 0 ? (
				<EmptyState>
					<span>⚙️</span>
					<div>
						{selectedAppType
							? `No presets available for ${selectedAppType.replace(/_/g, ' ')}`
							: 'No presets available'}
					</div>
					{filter === 'custom' && (
						<div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
							Create custom presets by configuring an application and saving it as a template.
						</div>
					)}
				</EmptyState>
			) : (
				Object.entries(groupedPresets).map(([category, categoryPresets]) => (
					<CategorySection key={category}>
						<CategoryTitle>
							{category === 'built-in' ? <span>⭐</span> : <span>👤</span>}
							{category === 'built-in' ? 'Built-in Presets' : 'Custom Presets'}
							<span style={{ color: '#6b7280', fontWeight: 'normal' }}>
								({categoryPresets.length})
							</span>
						</CategoryTitle>

						<PresetGrid>
							{categoryPresets.map((preset) => (
								<PresetCard
									key={preset.id}
									selected={selectedPreset === preset.id}
									category={preset.category}
									onClick={() => handlePresetClick(preset.id)}
								>
									<PresetHeader>
										<PresetName>{preset.name}</PresetName>
										<PresetBadge category={preset.category}>
											{preset.category === 'built-in' ? (
												<span style={{ fontSize: '12px' }}>⭐</span>
											) : (
												<span style={{ fontSize: '12px' }}>👤</span>
											)}
											{preset.category === 'built-in' ? 'Built-in' : 'Custom'}
										</PresetBadge>
									</PresetHeader>

									<PresetDescription>{preset.description}</PresetDescription>

									<PresetMeta>
										<MetaTag $variant="security">{preset.metadata.securityLevel}</MetaTag>
										<MetaTag $variant="type">{preset.appType.replace(/_/g, ' ')}</MetaTag>
										{preset.metadata.tags.slice(0, 2).map((tag) => (
											<MetaTag key={tag} $variant="tag">
												{tag}
											</MetaTag>
										))}
									</PresetMeta>

									<PresetActions>
										<SelectButton
											selected={selectedPreset === preset.id}
											onClick={(e) => {
												e.stopPropagation();
												handlePresetClick(preset.id);
											}}
										>
											{selectedPreset === preset.id ? (
												<>
													<span style={{ fontSize: '16px' }}>✅</span>
													Selected
												</>
											) : (
												'Select Preset'
											)}
										</SelectButton>

										<InfoButton
											onClick={(e) => {
												e.stopPropagation();
												// TODO: Show preset details modal
												logger.info('Show preset details:', preset);
											}}
											title="View preset details"
										>
											<span style={{ fontSize: '16px' }}>ℹ️</span>
										</InfoButton>
									</PresetActions>
								</PresetCard>
							))}
						</PresetGrid>
					</CategorySection>
				))
			)}
		</Container>
	);
};
