// src/components/LocalesParameterInput.tsx
// UI and Claims Locales Parameter Input - Internationalization support
import React from 'react';
import { FiGlobe, FiInfo } from '@icons';
import styled from 'styled-components';

type LocalesType = 'ui' | 'claims';

interface LocalesParameterInputProps {
	type: LocalesType;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

const Container = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const LabelIcon = styled.div`
	color: #3b82f6;
	font-size: 1rem;
`;

const InputWrapper = styled.div`
	position: relative;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', monospace;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const HelperText = styled.div`
	margin-top: 0.5rem;
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.5;
`;

const ExamplesBox = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 0.75rem;
`;

const ExampleTag = styled.button<{ $selected: boolean }>`
	padding: 0.375rem 0.75rem;
	background: ${(props) => (props.$selected ? '#dbeafe' : '#f3f4f6')};
	border: 1px solid ${(props) => (props.$selected ? '#3b82f6' : '#e5e7eb')};
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	color: ${(props) => (props.$selected ? '#1e40af' : '#6b7280')};
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: ${(props) => (props.$selected ? '#dbeafe' : '#e5e7eb')};
		border-color: #3b82f6;
	}
`;

const InfoBox = styled.div`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.5rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	color: #1e40af;
	line-height: 1.5;
`;

const InfoIcon = styled.div`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: #3b82f6;
`;

const commonLocales = [
	{ code: 'en-US', label: 'English (US)' },
	{ code: 'en-GB', label: 'English (UK)' },
	{ code: 'fr-FR', label: 'French (France)' },
	{ code: 'fr-CA', label: 'French (Canada)' },
	{ code: 'de-DE', label: 'German (Germany)' },
	{ code: 'de-CH', label: 'German (Switzerland)' },
	{ code: 'es-ES', label: 'Spanish (Spain)' },
	{ code: 'es-MX', label: 'Spanish (Mexico)' },
	{ code: 'ja-JP', label: 'Japanese (Japan)' },
	{ code: 'zh-CN', label: 'Chinese (Simplified)' },
	{ code: 'pt-BR', label: 'Portuguese (Brazil)' },
	{ code: 'it-IT', label: 'Italian (Italy)' },
];

export const LocalesParameterInput: React.FC<LocalesParameterInputProps> = ({
	type,
	value,
	onChange,
	disabled = false,
}) => {
	const isUILocales = type === 'ui';

	const handleExampleClick = (locale: string) => {
		// Toggle or add to space-separated list
		const currentLocales = value.split(/\s+/).filter(Boolean);
		const index = currentLocales.indexOf(locale);

		if (index >= 0) {
			// Remove if already present
			currentLocales.splice(index, 1);
		} else {
			// Add if not present
			currentLocales.push(locale);
		}

		onChange(currentLocales.join(' '));
	};

	const currentLocales = value.split(/\s+/).filter(Boolean);

	return (
		<Container>
			<Label>
				<LabelIcon>
					<FiGlobe />
				</LabelIcon>
				{isUILocales ? 'UI Locales' : 'Claims Locales'} (OIDC Internationalization)
			</Label>

			<InputWrapper>
				<Input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					placeholder={isUILocales ? 'en-US fr-CA de-CH' : 'en-US de-CH'}
				/>
			</InputWrapper>

			<HelperText>
				{isUILocales ? (
					<>
						Space-separated list of <strong>BCP47 language tags</strong> for the{' '}
						<strong>user interface</strong>. The authorization server will display the UI in the
						first supported language.
					</>
				) : (
					<>
						Space-separated list of <strong>BCP47 language tags</strong> for{' '}
						<strong>claim values</strong>. Different from ui_locales - this affects the data
						returned, not the UI display.
					</>
				)}
			</HelperText>

			<ExamplesBox>
				{commonLocales.slice(0, 8).map((locale) => (
					<ExampleTag
						key={locale.code}
						type="button"
						$selected={currentLocales.includes(locale.code)}
						onClick={() => handleExampleClick(locale.code)}
						disabled={disabled}
						title={locale.label}
					>
						{locale.code}
					</ExampleTag>
				))}
			</ExamplesBox>

			<InfoBox>
				<InfoIcon>
					<FiInfo />
				</InfoIcon>
				<div>
					<strong>About {isUILocales ? 'UI' : 'Claims'} Locales:</strong>
					<div style={{ marginTop: '0.5rem' }}>
						{isUILocales ? (
							<>
								The <code>ui_locales</code> parameter tells the authorization server which
								language(s) to use for the <strong>authentication UI</strong> (login page, consent
								screen, etc.). The server tries each language in order until it finds one it
								supports.
							</>
						) : (
							<>
								The <code>claims_locales</code> parameter specifies which language(s) to use for
								<strong>claim values</strong> returned in the ID token or from UserInfo. For
								example, requesting French would return "given_name": "François" instead of
								"Francis".
							</>
						)}
					</div>
					<div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', fontStyle: 'italic' }}>
						💡 <strong>BCP47</strong> language tags combine language code + country code (e.g.,{' '}
						<code>en-US</code>, <code>fr-CA</code>). Multiple values create a preference order (most
						preferred first).
					</div>
				</div>
			</InfoBox>
		</Container>
	);
};

export default LocalesParameterInput;
