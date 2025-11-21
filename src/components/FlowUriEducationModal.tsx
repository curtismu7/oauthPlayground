import React, { useMemo } from 'react';
import {
	FiBookOpen,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiLink2,
	FiTarget,
} from 'react-icons/fi';
import styled from 'styled-components';
import type { FlowUriEducationEntry } from '../services/flowUriEducationService';
import { flowUriEducationService } from '../services/flowUriEducationService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { DraggableModal } from './DraggableModal';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Intro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #1e293b;
`;

const IntroTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const IntroCopy = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #475569;
`;

const TableContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
`;

const THead = styled.thead`
  background: #f1f5f9;
`;

const TH = styled.th`
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  color: #0f172a;
  border-bottom: 1px solid #e2e8f0;
`;

const TR = styled.tr<{ $highlight?: boolean }>`
  background: ${({ $highlight }) => ($highlight ? 'rgba(37, 99, 235, 0.05)' : '#ffffff')};

  &:nth-child(even) {
    background: ${({ $highlight }) => ($highlight ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc')};
  }
`;

const TD = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
  color: #1f2937;
`;

const UriCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const UriRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  background: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  padding: 0.45rem 0.65rem;
  overflow-x: auto;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Note = styled.p<{ $muted?: boolean }>`
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: ${({ $muted }) => ($muted ? '#94a3b8' : '#64748b')};
  display: flex;
  gap: 0.35rem;
  align-items: flex-start;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  border-radius: 9999px;
  padding: 0.15rem 0.65rem;
  font-weight: 600;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 0.5rem;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  transition: background 120ms ease;

  ${({ $variant }) =>
		$variant === 'secondary'
			? `
    background: #e2e8f0;
    color: #1f2937;

    &:hover {
      background: #cbd5f5;
    }
  `
			: `
    background: #2563eb;
    color: #ffffff;

    &:hover {
      background: #1d4ed8;
    }
  `}
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 2rem;
  align-items: center;
  justify-content: center;
  color: #64748b;
`;

const EmptyTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
`;

const EmptyCopy = styled.p`
  margin: 0;
  font-size: 0.9rem;
  text-align: center;
`;

const highlightEntry = (entry: FlowUriEducationEntry, focusFlowType?: string) =>
	focusFlowType ? entry.flowType.toLowerCase().includes(focusFlowType.toLowerCase()) : false;

const specUrlFromText = (spec: string): string | undefined => {
	if (!spec) return undefined;

	const lowered = spec.toLowerCase();

	if (lowered.includes('rfc 6749')) {
		return 'https://datatracker.ietf.org/doc/html/rfc6749';
	}
	if (lowered.includes('oidc core')) {
		return 'https://openid.net/specs/openid-connect-core-1_0.html';
	}
	if (lowered.includes('rfc 8628')) {
		return 'https://datatracker.ietf.org/doc/html/rfc8628';
	}
	if (lowered.includes('rfc 9126')) {
		return 'https://datatracker.ietf.org/doc/html/rfc9126';
	}
	if (lowered.includes('rfc 9396')) {
		return 'https://datatracker.ietf.org/doc/html/rfc9396';
	}
	if (lowered.includes('rfc 7523')) {
		return 'https://datatracker.ietf.org/doc/html/rfc7523';
	}
	if (lowered.includes('rfc 7522')) {
		return 'https://datatracker.ietf.org/doc/html/rfc7522';
	}

	return undefined;
};

const openSpec = (spec: string) => {
	const url = specUrlFromText(spec);
	if (url) {
		window.open(url, '_blank', 'noopener,noreferrer');
	} else {
		v4ToastManager.showInfo('Specification link not available for this entry.');
	}
};

const FlowUriEducationModal: React.FC<{
	isOpen: boolean;
	onClose: () => void;
	flowType?: string;
	onSelectRedirect?: (uri: string) => void;
	onSelectLogout?: (uri: string) => void;
	onSelectBoth?: (redirectUri: string, logoutUri: string) => void;
}> = ({ isOpen, onClose, flowType, onSelectRedirect, onSelectLogout, onSelectBoth }) => {
	const entries = useMemo(
		() => flowUriEducationService.getEntries(flowType ? { focusFlowType: flowType } : undefined),
		[flowType]
	);

	const educationCopy = useMemo(
		() => flowUriEducationService.getEducationBlurb(flowType),
		[flowType]
	);

	const handleCopy = (uri: string, label: string) => {
		navigator.clipboard.writeText(uri);
		v4ToastManager.showSuccess(`${label} copied to clipboard`);
	};

	const handleSelect = (uri: string, type: 'redirect' | 'logout') => {
		if (type === 'redirect' && onSelectRedirect) {
			onSelectRedirect(uri);
			onClose();
		}
		if (type === 'logout' && onSelectLogout) {
			onSelectLogout(uri);
			onClose();
		}
	};

	const handleSelectBoth = (entry: FlowUriEducationEntry) => {
		if (onSelectBoth && entry.requiresRedirectUri && entry.requiresLogoutUri) {
			onSelectBoth(entry.redirectUri, entry.logoutUri);
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<DraggableModal
			isOpen={isOpen}
			onClose={onClose}
			title="Redirect & Logout URI Reference"
			width="min(980px, calc(100vw - 2rem))"
			maxHeight="calc(100vh - 4rem)"
		>
			<Content>
				<Intro>
					<IntroTitle>
						<FiBookOpen /> URI Requirements for PingOne Applications
					</IntroTitle>
					<IntroCopy>{educationCopy}</IntroCopy>
				</Intro>

				{entries.length === 0 ? (
					<EmptyState>
						<FiInfo size={32} />
						<EmptyTitle>No URI definitions available</EmptyTitle>
						<EmptyCopy>
							We did not find any redirect/logout URI definitions for this flow. Please add them
							manually in PingOne.
						</EmptyCopy>
					</EmptyState>
				) : (
					<TableContainer>
						<Table>
							<THead>
								<TR>
									<TH style={{ width: '20%' }}>Flow</TH>
									<TH style={{ width: '35%' }}>Redirect URI</TH>
									<TH style={{ width: '25%' }}>Logout URI</TH>
									<TH style={{ width: '20%' }}>Notes & Spec</TH>
								</TR>
							</THead>
							<tbody>
								{entries.map((entry) => {
									const isFocus = highlightEntry(entry, flowType);
									return (
										<TR key={entry.flowType} $highlight={isFocus}>
											<TD>
												<UriCell>
													<span style={{ fontWeight: 600, color: '#0f172a' }}>{entry.title}</span>
													<Tag>
														<FiTarget size={12} />
														{entry.flowType}
													</Tag>
												</UriCell>
											</TD>
											<TD>
												<UriCell>
													{entry.requiresRedirectUri ? (
														<>
															<UriRow>
																<FiLink2 size={14} color="#1d4ed8" />
																{entry.redirectUri}
															</UriRow>
															<ActionRow>
																<Button
																	onClick={() =>
																		handleCopy(entry.redirectUri, `${entry.title} Redirect URI`)
																	}
																>
																	<FiCopy size={14} /> Copy Redirect
																</Button>
																{onSelectRedirect && (
																	<Button
																		$variant="secondary"
																		onClick={() => handleSelect(entry.redirectUri, 'redirect')}
																	>
																		Use Redirect URI
																	</Button>
																)}
																{onSelectBoth &&
																	entry.requiresRedirectUri &&
																	entry.requiresLogoutUri && (
																		<Button
																			onClick={() => handleSelectBoth(entry)}
																			style={{
																				background: '#3b82f6',
																				color: '#ffffff',
																				border: '1px solid #2563eb',
																			}}
																		>
																			<FiCheckCircle size={14} /> Use Both in App
																		</Button>
																	)}
															</ActionRow>
															<Note>
																<FiInfo size={12} />
																{entry.note}
															</Note>
														</>
													) : (
														<Note $muted>
															<FiInfo size={12} />
															Redirect URI not required for this flow type.
														</Note>
													)}
												</UriCell>
											</TD>
											<TD>
												<UriCell>
													{entry.requiresLogoutUri ? (
														<>
															<UriRow>
																<FiLink2 size={14} color="#15803d" />
																{entry.logoutUri}
															</UriRow>
															<ActionRow>
																<Button
																	onClick={() =>
																		handleCopy(entry.logoutUri, `${entry.title} Logout URI`)
																	}
																>
																	<FiCopy size={14} /> Copy Logout
																</Button>
																{onSelectLogout && (
																	<Button
																		$variant="secondary"
																		onClick={() => handleSelect(entry.logoutUri, 'logout')}
																	>
																		Use Logout URI
																	</Button>
																)}
																{onSelectBoth &&
																	entry.requiresRedirectUri &&
																	entry.requiresLogoutUri && (
																		<Button
																			onClick={() => handleSelectBoth(entry)}
																			style={{
																				background: '#3b82f6',
																				color: '#ffffff',
																				border: '1px solid #2563eb',
																			}}
																		>
																			<FiCheckCircle size={14} /> Use Both in App
																		</Button>
																	)}
															</ActionRow>
															<Note>
																<FiInfo size={12} />
																{entry.logoutNote}
															</Note>
														</>
													) : (
														<Note $muted>
															<FiInfo size={12} />
															Logout URI not used for this flow type.
														</Note>
													)}
												</UriCell>
											</TD>
											<TD>
												<UriCell>
													<Tag>
														{entry.requiresRedirectUri ? 'Redirect required' : 'Redirect optional'}
													</Tag>
													<Tag
														style={{
															background: entry.requiresLogoutUri
																? 'rgba(16, 185, 129, 0.14)'
																: 'rgba(148, 163, 184, 0.16)',
															color: entry.requiresLogoutUri ? '#047857' : '#475569',
														}}
													>
														{entry.requiresLogoutUri ? 'Logout required' : 'Logout optional'}
													</Tag>
													{onSelectBoth && entry.requiresRedirectUri && entry.requiresLogoutUri && (
														<ActionRow style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
															<Button
																onClick={() => handleSelectBoth(entry)}
																style={{
																	background: '#10b981',
																	color: '#ffffff',
																	fontWeight: 600,
																	padding: '0.5rem 1rem',
																	fontSize: '0.8rem',
																}}
															>
																<FiCheckCircle size={14} /> Apply Both URIs to Credentials
															</Button>
														</ActionRow>
													)}
													<ActionRow>
														<Button
															$variant="secondary"
															onClick={() =>
																handleCopy(
																	entry.defaultRedirectUri,
																	`${entry.title} Default Redirect`
																)
															}
															disabled={!entry.requiresRedirectUri}
														>
															<FiCopy size={14} /> Default
														</Button>
														<Button
															$variant="secondary"
															onClick={() =>
																handleCopy(entry.defaultLogoutUri, `${entry.title} Default Logout`)
															}
															disabled={!entry.requiresLogoutUri}
														>
															<FiCopy size={14} /> Default Logout
														</Button>
													</ActionRow>
													<ActionRow>
														<Button
															$variant="secondary"
															onClick={() => openSpec(entry.specification)}
														>
															<FiExternalLink size={14} /> Spec
														</Button>
													</ActionRow>
												</UriCell>
											</TD>
										</TR>
									);
								})}
							</tbody>
						</Table>
					</TableContainer>
				)}
			</Content>
		</DraggableModal>
	);
};

export { FlowUriEducationModal };
