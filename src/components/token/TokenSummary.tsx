import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { FiCheck, FiCopy, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import { copyToClipboard } from '../../utils/clipboard';

interface TokenSet {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	[key: string]: unknown;
}

type TokenType = 'access' | 'id' | 'refresh';

interface TokenSummaryProps {
	tokens?: TokenSet | null;
	title?: string;
	subtitle?: string;
	onAnalyze?: (tokenType: TokenType) => void;
	analyzeLabels?: Partial<Record<TokenType, string>>;
	showMetadata?: boolean;
}

const Container = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #475569;
  font-size: 0.9rem;
`;

const TokenSection = styled.div<{ $variant: TokenType }>`
  background: #ffffff;
  border: 1px solid
    ${({ $variant }) => {
			switch ($variant) {
				case 'access':
					return '#bfdbfe';
				case 'id':
					return '#fde68a';
				case 'refresh':
					return '#bbf7d0';
				default:
					return '#e2e8f0';
			}
		}};
  border-radius: 10px;
  padding: 1.25rem;
  box-shadow: 0 4px 8px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TokenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
`;

const TokenLabel = styled.div<{ $variant: TokenType }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $variant }) => {
		switch ($variant) {
			case 'access':
				return '#1d4ed8';
			case 'id':
				return '#b45309';
			case 'refresh':
				return '#047857';
			default:
				return '#0f172a';
		}
	}};
`;

const TokenActions = styled.div`
  display: inline-flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  border: none;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $variant }) => ($variant === 'primary' ? '#1d4ed8' : '#94a3b8')};
  color: #ffffff;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TokenValue = styled.pre<{ $variant: TokenType }>`
  margin: 0;
  padding: 1rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid
    ${({ $variant }) => {
			switch ($variant) {
				case 'access':
					return '#bfdbfe';
				case 'id':
					return '#fde68a';
				case 'refresh':
					return '#bbf7d0';
				default:
					return '#e2e8f0';
			}
		}};
  font-family: "SFMono-Regular", "Menlo", monospace;
  font-size: 0.8rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-all;
  color: #0f172a;
`;

const MetadataCard = styled.div`
  display: grid;
  gap: 0.5rem;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 0.9rem;
  border: 1px solid #e2e8f0;
`;

const MetadataRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.85rem;
`;

const MetadataLabel = styled.span`
  color: #475569;
  font-weight: 600;
`;

const MetadataValue = styled.span`
  font-family: "SFMono-Regular", "Menlo", monospace;
  color: #0f172a;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f1f5f9;
  border: 1px dashed #cbd5f5;
  border-radius: 10px;
  padding: 1rem;
  color: #475569;
  font-size: 0.9rem;
`;

const tokenMeta: Record<TokenType, { label: string; icon: React.ReactNode }> = {
	access: { label: 'Access Token', icon: <FiShield aria-hidden="true" /> },
	id: { label: 'ID Token', icon: <FiShield aria-hidden="true" /> },
	refresh: { label: 'Refresh Token', icon: <FiShield aria-hidden="true" /> },
};

const tokenKeys: TokenType[] = ['access', 'id', 'refresh'];

const mapKeyToProperty = (key: TokenType) => `${key}_token` as const;

const maskValue = (value: string) => {
	if (value.length <= 24) return value;
	return `${value.slice(0, 12)}…${value.slice(-12)}`;
};

const formatExpiresIn = (seconds: number) => {
	if (Number.isNaN(seconds)) return `${seconds}`;
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
	if (minutes > 0) return `${minutes}m ${secs}s`;
	return `${secs}s`;
};

const TokenSummary: React.FC<TokenSummaryProps> = ({
	tokens,
	title = 'Token Summary',
	subtitle,
	onAnalyze,
	analyzeLabels,
	showMetadata = true,
}) => {
	const [maskedStates, setMaskedStates] = useState<Record<TokenType, boolean>>({
		access: true,
		id: true,
		refresh: true,
	});
	const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

	const availableTokens = useMemo(() => {
		if (!tokens) return [] as TokenType[];
		return tokenKeys.filter((key) => {
			const property = mapKeyToProperty(key);
			return typeof tokens[property] === 'string' && tokens[property];
		});
	}, [tokens]);

	const handleCopy = async (key: TokenType, value: string) => {
		await copyToClipboard(value, tokenMeta[key].label);
		setCopiedStates((prev) => ({ ...prev, [key]: true }));
		setTimeout(() => {
			setCopiedStates((prev) => ({ ...prev, [key]: false }));
		}, 2000);
	};

	const toggleMask = (key: TokenType) => {
		setMaskedStates((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	if (!tokens || availableTokens.length === 0) {
		return (
			<Container>
				<Header>
					<Title>{title}</Title>
					{subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
				</Header>
				<EmptyState>
					<FiShield aria-hidden="true" />
					<span>No tokens are available yet. Complete the previous steps to retrieve tokens.</span>
				</EmptyState>
			</Container>
		);
	}

	return (
		<Container>
			<Header>
				<Title>{title}</Title>
				{subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
			</Header>

			{availableTokens.map((tokenType) => {
				const prop = mapKeyToProperty(tokenType);
				const rawValue = tokens[prop] as string;
				const isMasked = maskedStates[tokenType];
				const displayValue = isMasked ? maskValue(rawValue) : rawValue;

				return (
					<TokenSection key={tokenType} $variant={tokenType}>
						<TokenHeader>
							<TokenLabel $variant={tokenType}>
								{tokenMeta[tokenType].icon}
								{tokenMeta[tokenType].label}
							</TokenLabel>
							<TokenActions>
								<ActionButton
									$variant="secondary"
									type="button"
									onClick={() => toggleMask(tokenType)}
									aria-label={
										isMasked
											? `Show ${tokenMeta[tokenType].label}`
											: `Mask ${tokenMeta[tokenType].label}`
									}
								>
									{isMasked ? <FiEye aria-hidden="true" /> : <FiEyeOff aria-hidden="true" />}
									{isMasked ? 'Show' : 'Mask'}
								</ActionButton>
								<ActionButton
									$variant="primary"
									type="button"
									onClick={() => handleCopy(tokenType, rawValue)}
									aria-label={`Copy ${tokenMeta[tokenType].label}`}
								>
									{copiedStates[tokenType] ? (
										<FiCheck aria-hidden="true" />
									) : (
										<FiCopy aria-hidden="true" />
									)}
									{copiedStates[tokenType] ? 'Copied' : 'Copy'}
								</ActionButton>
								{onAnalyze ? (
									<ActionButton
										type="button"
										onClick={() => onAnalyze(tokenType)}
										aria-label={`Analyze ${tokenMeta[tokenType].label}`}
									>
										{analyzeLabels?.[tokenType] ?? 'Analyze'}
									</ActionButton>
								) : null}
							</TokenActions>
						</TokenHeader>
						<TokenValue $variant={tokenType}>{displayValue}</TokenValue>
					</TokenSection>
				);
			})}

			{showMetadata && (tokens.token_type || tokens.expires_in || tokens.scope) ? (
				<MetadataCard>
					{tokens.token_type ? (
						<MetadataRow>
							<MetadataLabel>Token Type</MetadataLabel>
							<MetadataValue>{tokens.token_type}</MetadataValue>
						</MetadataRow>
					) : null}
					{typeof tokens.expires_in === 'number' ? (
						<MetadataRow>
							<MetadataLabel>Expires In</MetadataLabel>
							<MetadataValue>{formatExpiresIn(tokens.expires_in)}</MetadataValue>
						</MetadataRow>
					) : null}
					{tokens.scope ? (
						<MetadataRow>
							<MetadataLabel>Scope</MetadataLabel>
							<MetadataValue>{tokens.scope}</MetadataValue>
						</MetadataRow>
					) : null}
				</MetadataCard>
			) : null}
		</Container>
	);
};

export default TokenSummary;
