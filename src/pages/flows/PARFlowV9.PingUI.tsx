// src/pages/flows/PARFlowV9.PingUI.tsx
// V9 Pushed Authorization Requests (PAR) Flow - PingOne UI with New Storage & Messaging
// Migrated from V7 placeholder with PingOne UI architecture

import React, { useEffect, useState } from 'react';
import BootstrapIcon from '../../components/BootstrapIcon';
import { ExpandCollapseAllControls } from '../../components/ExpandCollapseAllControls';
import { getBootstrapIconName } from '../../components/iconMapping';
import { PingUIWrapper } from '../../components/PingUIWrapper';
import { usePageScroll } from '../../hooks/usePageScroll';
import { feedbackService } from '../../services/feedback/feedbackService';
import { useSectionsViewMode } from '../../services/sectionsViewModeService';

// V9 PAR Flow Component Props
interface PARFlowV9Props {
	/** Whether to show advanced configuration */
	showAdvancedConfig?: boolean;
	/** Section IDs for expand/collapse functionality */
	sectionIds?: string[];
}

const PARFlowV9: React.FC<PARFlowV9Props> = ({
	showAdvancedConfig = false,
	sectionIds = ['overview', 'specification', 'implementation'],
}) => {
	// Section management with V9 service
	const { expandedStates, toggleSection, expandAll, collapseAll, areAllExpanded, areAllCollapsed } =
		useSectionsViewMode('par-flow-v9', sectionIds);

	// Core state
	const [workerToken, setWorkerToken] = useState<string>('');

	// V9: Load worker token on mount
	useEffect(() => {
		const loadToken = async () => {
			try {
				// In a real implementation, this would load from unifiedStorageManager
				// For now, just set empty string
				setWorkerToken('');
			} catch (error) {
				console.error('[PARFlowV9] Failed to load worker token:', error);
			}
		};

		loadToken();
	}, []);

	usePageScroll({ pageName: 'PAR Flow V9 - PingOne UI', force: true });

	return (
		<PingUIWrapper>
			<div className="container-fluid py-4">
				{/* V9 Header */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="d-flex align-items-center justify-content-between">
							<div>
								<h1 className="h2 mb-2 d-flex align-items-center">
									<BootstrapIcon
										icon={getBootstrapIconName('send-check')}
										size={28}
										className="me-3 text-primary"
									/>
									Pushed Authorization Requests (PAR) Flow V9
									<span className="badge bg-success ms-2">PingOne UI</span>
								</h1>
								<p className="text-muted mb-0">OAuth 2.0 Security Enhancement with PingOne UI</p>
							</div>
							<div className="d-flex gap-2">
								<ExpandCollapseAllControls
									pageKey="par-flow-v9"
									sectionIds={sectionIds}
									allExpanded={areAllExpanded()}
									allCollapsed={areAllCollapsed()}
									onExpandAll={expandAll}
									onCollapseAll={collapseAll}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* V9 Content */}
				<div className="row">
					<div className="col-12">
						{/* Overview Section */}
						<div className="card mb-4">
							<div className="card-header d-flex align-items-center justify-content-between bg-primary text-white">
								<h5 className="mb-0 d-flex align-items-center">
									<BootstrapIcon
										icon={getBootstrapIconName('info-circle')}
										size={20}
										className="me-2"
									/>
									PAR Flow Overview
								</h5>
								<button
									type="button"
									className="btn btn-sm btn-outline-light"
									onClick={() => toggleSection('overview')}
								>
									<BootstrapIcon
										icon={getBootstrapIconName(
											expandedStates['overview'] ? 'chevron-up' : 'chevron-down'
										)}
										size={16}
									/>
								</button>
							</div>
							{expandedStates['overview'] && (
								<div className="card-body">
									<div className="alert alert-info">
										<BootstrapIcon
											icon={getBootstrapIconName('shield-check')}
											size={16}
											className="me-2"
										/>
										<strong>Pushed Authorization Requests (PAR)</strong> is an OAuth 2.0 security
										enhancement (RFC 9126) that addresses authorization code interception attacks by
										pushing authorization request parameters to the authorization server before
										redirecting the user.
									</div>

									<div className="row g-3 mt-3">
										<div className="col-md-6">
											<div className="card h-100 border-info">
												<div className="card-body">
													<h6 className="card-title d-flex align-items-center">
														<BootstrapIcon
															icon={getBootstrapIconName('shield-exclamation')}
															size={18}
															className="me-2 text-warning"
														/>
														Security Problem Solved
													</h6>
													<p className="card-text small">
														PAR prevents authorization code interception attacks by keeping
														sensitive parameters server-side instead of in the browser URL.
													</p>
												</div>
											</div>
										</div>
										<div className="col-md-6">
											<div className="card h-100 border-success">
												<div className="card-body">
													<h6 className="card-title d-flex align-items-center">
														<BootstrapIcon
															icon={getBootstrapIconName('check-circle')}
															size={18}
															className="me-2 text-success"
														/>
														How PAR Works
													</h6>
													<p className="card-text small">
														Client pushes authorization request to <code>/par</code> endpoint,
														receives <code>request_uri</code>, then redirects user with just the URI
														reference.
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Specification Section */}
						<div className="card mb-4">
							<div className="card-header d-flex align-items-center justify-content-between bg-info text-white">
								<h5 className="mb-0 d-flex align-items-center">
									<BootstrapIcon
										icon={getBootstrapIconName('file-earmark-text')}
										size={20}
										className="me-2"
									/>
									RFC 9126 Specification
								</h5>
								<button
									type="button"
									className="btn btn-sm btn-outline-light"
									onClick={() => toggleSection('specification')}
								>
									<BootstrapIcon
										icon={getBootstrapIconName(
											expandedStates['specification'] ? 'chevron-up' : 'chevron-down'
										)}
										size={16}
									/>
								</button>
							</div>
							{expandedStates['specification'] && (
								<div className="card-body">
									<div className="row g-3">
										<div className="col-md-6">
											<h6>PAR Request Flow</h6>
											<ol className="small">
												<li>
													Client POSTs authorization request to <code>/par</code>
												</li>
												<li>
													Server responds with <code>request_uri</code>
												</li>
												<li>
													Client redirects user to <code>/authorize</code> with{' '}
													<code>request_uri</code>
												</li>
												<li>
													Server looks up stored request using <code>request_uri</code>
												</li>
												<li>Normal OAuth flow continues</li>
											</ol>
										</div>
										<div className="col-md-6">
											<h6>Key Benefits</h6>
											<ul className="small">
												<li>
													<strong>Confidentiality:</strong> Parameters not exposed in browser
												</li>
												<li>
													<strong>Integrity:</strong> Server validates stored parameters
												</li>
												<li>
													<strong>Security:</strong> Prevents code interception attacks
												</li>
												<li>
													<strong>Compatibility:</strong> Works with existing OAuth flows
												</li>
											</ul>
										</div>
									</div>

									<div className="alert alert-warning mt-3">
										<BootstrapIcon
											icon={getBootstrapIconName('exclamation-triangle')}
											size={16}
											className="me-2"
										/>
										<strong>Implementation Note:</strong> PAR is a server-side security enhancement.
										Client-side implementation focuses on using the <code>request_uri</code>{' '}
										parameter instead of full authorization parameters.
									</div>
								</div>
							)}
						</div>

						{/* Implementation Status */}
						<div className="card">
							<div className="card-header d-flex align-items-center justify-content-between bg-warning">
								<h5 className="mb-0 d-flex align-items-center">
									<BootstrapIcon icon={getBootstrapIconName('tools')} size={20} className="me-2" />
									Implementation Status
								</h5>
								<button
									type="button"
									className="btn btn-sm btn-outline-dark"
									onClick={() => toggleSection('implementation')}
								>
									<BootstrapIcon
										icon={getBootstrapIconName(
											expandedStates['implementation'] ? 'chevron-up' : 'chevron-down'
										)}
										size={16}
									/>
								</button>
							</div>
							{expandedStates['implementation'] && (
								<div className="card-body">
									<div className="alert alert-secondary">
										<BootstrapIcon
											icon={getBootstrapIconName('info-circle')}
											size={16}
											className="me-2"
										/>
										<strong>V9 Architecture Ready:</strong> The PingOne UI framework and services
										are in place for PAR implementation. This component serves as a foundation for
										the full PAR flow implementation.
									</div>

									<div className="row g-3 mt-3">
										<div className="col-md-4">
											<div className="card h-100 border-success">
												<div className="card-body text-center">
													<BootstrapIcon
														icon={getBootstrapIconName('check-circle')}
														size={24}
														className="text-success mb-2"
													/>
													<h6>V9 UI Framework</h6>
													<small className="text-muted">PingOne Bootstrap components ready</small>
												</div>
											</div>
										</div>
										<div className="col-md-4">
											<div className="card h-100 border-success">
												<div className="card-body text-center">
													<BootstrapIcon
														icon={getBootstrapIconName('database')}
														size={24}
														className="text-success mb-2"
													/>
													<h6>Unified Storage</h6>
													<small className="text-muted">State persistence configured</small>
												</div>
											</div>
										</div>
										<div className="col-md-4">
											<div className="card h-100 border-success">
												<div className="card-body text-center">
													<BootstrapIcon
														icon={getBootstrapIconName('chat-dots')}
														size={24}
														className="text-success mb-2"
													/>
													<h6>Feedback Service</h6>
													<small className="text-muted">Contextual messaging ready</small>
												</div>
											</div>
										</div>
									</div>

									<div className="alert alert-info mt-3">
										<BootstrapIcon
											icon={getBootstrapIconName('lightbulb')}
											size={16}
											className="me-2"
										/>
										<strong>Next Steps:</strong> Implement PAR request creation, request URI
										handling, and authorization flow integration using the established V9 patterns.
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* V9 Footer */}
				<div className="row mt-4">
					<div className="col-12">
						<div className="text-center">
							<div className="d-flex justify-content-center gap-2 mb-2">
								<span className="badge bg-secondary">V9.3.6</span>
								<span className="badge bg-info">PAR Flow</span>
								<span className="badge bg-warning">RFC 9126</span>
							</div>
							<p className="text-muted small mb-0">
								Enhanced with PingOne UI • Unified Storage • Contextual Messaging
							</p>
						</div>
					</div>
				</div>
			</div>
		</PingUIWrapper>
	);
};

export default PARFlowV9;
