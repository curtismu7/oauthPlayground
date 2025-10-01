import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
	tokenLifecycleManager,
	TokenSecurityAnalysis,
	TokenLifecycleInfo,
} from '../utils/tokenLifecycle';

const SecurityContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SecurityHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const SecurityTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
`;

const SecurityScore = styled.div<{ score: number }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 1.125rem;
  
  ${({ score }) => {
		if (score >= 80) {
			return `
        background-color: #dcfce7;
        color: #166534;
        border: 2px solid #22c55e;
      `;
		} else if (score >= 60) {
			return `
        background-color: #fef3c7;
        color: #92400e;
        border: 2px solid #f59e0b;
      `;
		} else {
			return `
        background-color: #fecaca;
        color: #991b1b;
        border: 2px solid #ef4444;
      `;
		}
	}}
`;

const ScoreCircle = styled.div<{ score: number }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  
  ${({ score }) => {
		if (score >= 80) {
			return `
        background-color: #22c55e;
        color: white;
      `;
		} else if (score >= 60) {
			return `
        background-color: #f59e0b;
        color: white;
      `;
		} else {
			return `
        background-color: #ef4444;
        color: white;
      `;
		}
	}}
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  list-style: none;
`;

const ListItem = styled.li<{ type: 'strength' | 'warning' | 'vulnerability' | 'recommendation' }>`
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  
  ${({ type }) => {
		switch (type) {
			case 'strength':
				return `
          background-color: #dcfce7;
          color: #166534;
          border-left: 4px solid #22c55e;
        `;
			case 'warning':
				return `
          background-color: #fef3c7;
          color: #92400e;
          border-left: 4px solid #f59e0b;
        `;
			case 'vulnerability':
				return `
          background-color: #fecaca;
          color: #991b1b;
          border-left: 4px solid #ef4444;
        `;
			case 'recommendation':
				return `
          background-color: #dbeafe;
          color: #1e40af;
          border-left: 4px solid #3b82f6;
        `;
		}
	}}
  
  &::before {
    content: '${({ type }) => {
			switch (type) {
				case 'strength':
					return '';
				case 'warning':
					return '';
				case 'vulnerability':
					return '';
				case 'recommendation':
					return '';
			}
		}}';
    margin-right: 0.5rem;
  }
`;

const TokenInfo = styled.div`
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 500;
  color: #6b7280;
`;

const InfoValue = styled.span`
  color: #1f2937;
`;

const RefreshButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2563eb;
  }
  
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

interface TokenSecurityAnalysisProps {
	tokenId: string;
	onRefresh?: () => void;
}

const TokenSecurityAnalysisComponent: React.FC<TokenSecurityAnalysisProps> = ({
	tokenId,
	onRefresh,
}) => {
	const [analysis, setAnalysis] = useState<TokenSecurityAnalysis | null>(null);
	const [tokenInfo, setTokenInfo] = useState<TokenLifecycleInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadAnalysis = async () => {
			try {
				setLoading(true);
				setError(null);

				const lifecycleInfo = tokenLifecycleManager.getTokenLifecycleInfo(tokenId);
				if (!lifecycleInfo) {
					// For bad tokens, create a minimal analysis
					setAnalysis({
						tokenId,
						securityScore: 0,
						recommendations: ['This token is invalid or malformed'],
						warnings: ['Token validation failed'],
						strengths: [],
						vulnerabilities: ['Invalid token format or signature']
					});
					setLoading(false);
					return;
				}

				setTokenInfo(lifecycleInfo);

				try {
					const securityAnalysis = tokenLifecycleManager.analyzeTokenSecurity(tokenId);
					setAnalysis(securityAnalysis);
				} catch (analysisError) {
					// If analysis fails, create a failed analysis result
					setAnalysis({
						tokenId,
						securityScore: 0,
						recommendations: ['This token could not be analyzed'],
						warnings: ['Token analysis failed'],
						strengths: [],
						vulnerabilities: ['Token validation failed']
					});
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load analysis');
			} finally {
				setLoading(false);
			}
		};

		loadAnalysis();
	}, [tokenId]);

	const handleRefresh = () => {
		if (onRefresh) {
			onRefresh();
		}
		// Reload analysis
		const lifecycleInfo = tokenLifecycleManager.getTokenLifecycleInfo(tokenId);
		if (lifecycleInfo) {
			setTokenInfo(lifecycleInfo);
			const securityAnalysis = tokenLifecycleManager.analyzeTokenSecurity(tokenId);
			setAnalysis(securityAnalysis);
		}
	};

	if (loading) {
		return (
			<SecurityContainer>
				<div>Loading security analysis...</div>
			</SecurityContainer>
		);
	}

	if (error) {
		return (
			<SecurityContainer>
				<div style={{ color: '#ef4444' }}>Error: {error}</div>
			</SecurityContainer>
		);
	}

	if (!analysis || !tokenInfo) {
		return (
			<SecurityContainer>
				<div>No analysis available</div>
			</SecurityContainer>
		);
	}

	return (
		<SecurityContainer>
			<SecurityHeader>
				<SecurityTitle>Token Security Analysis</SecurityTitle>
				<SecurityScore score={analysis.securityScore}>
					<ScoreCircle score={analysis.securityScore}>{analysis.securityScore}</ScoreCircle>
					Security Score
				</SecurityScore>
			</SecurityHeader>

			<TokenInfo>
				<InfoRow>
					<InfoLabel>Token ID:</InfoLabel>
					<InfoValue>{tokenInfo.tokenId}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Flow Type:</InfoLabel>
					<InfoValue>{tokenInfo.flowType}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Flow Name:</InfoLabel>
					<InfoValue>{tokenInfo.flowName}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Created:</InfoLabel>
					<InfoValue>{tokenInfo.createdAt.toLocaleString()}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Expires:</InfoLabel>
					<InfoValue>{tokenInfo.expiresAt.toLocaleString()}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Usage Count:</InfoLabel>
					<InfoValue>{tokenInfo.usageCount}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Status:</InfoLabel>
					<InfoValue style={{ color: tokenInfo.isExpired ? '#ef4444' : '#22c55e' }}>
						{tokenInfo.isExpired ? 'Expired' : 'Active'}
					</InfoValue>
				</InfoRow>
			</TokenInfo>

			{analysis.strengths.length > 0 && (
				<Section>
					<SectionTitle>Strengths</SectionTitle>
					<List>
						{analysis.strengths.map((strength, index) => (
							<ListItem key={index} type="strength">
								{strength}
							</ListItem>
						))}
					</List>
				</Section>
			)}

			{analysis.warnings.length > 0 && (
				<Section>
					<SectionTitle>Warnings</SectionTitle>
					<List>
						{analysis.warnings.map((warning, index) => (
							<ListItem key={index} type="warning">
								{warning}
							</ListItem>
						))}
					</List>
				</Section>
			)}

			{analysis.vulnerabilities.length > 0 && (
				<Section>
					<SectionTitle>Vulnerabilities</SectionTitle>
					<List>
						{analysis.vulnerabilities.map((vulnerability, index) => (
							<ListItem key={index} type="vulnerability">
								{vulnerability}
							</ListItem>
						))}
					</List>
				</Section>
			)}

			{analysis.recommendations.length > 0 && (
				<Section>
					<SectionTitle>Recommendations</SectionTitle>
					<List>
						{analysis.recommendations.map((recommendation, index) => (
							<ListItem key={index} type="recommendation">
								{recommendation}
							</ListItem>
						))}
					</List>
				</Section>
			)}

			<div style={{ marginTop: '1rem', textAlign: 'right' }}>
				<RefreshButton onClick={handleRefresh}>Refresh Analysis</RefreshButton>
			</div>
		</SecurityContainer>
	);
};

export default TokenSecurityAnalysisComponent;
