// src/components/CredentialStatusPanel.tsx
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiClock,
	FiRefreshCw,
	FiServer,
	FiShield,
	FiXCircle,
} from "react-icons/fi";
import styled from "styled-components";
import { useAuth } from "../contexts/NewAuthContext";
import { showGlobalError, showGlobalSuccess } from "../hooks/useNotifications";
import {
	credentialManager,
	type PermanentCredentials,
} from "../utils/credentialManager";
import { logger } from "../utils/logger";
import ServerStatusModal from "./ServerStatusModal";

const StatusPanel = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
  }
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #374151;
  border: 2px solid #d1d5db;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
    border-color: #9ca3af;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    background: #f9fafb;
    color: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StatusButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border: 2px solid #93c5fd;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
    border-color: #60a5fa;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const StatusIndicators = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const StatusIndicator = styled.div<{ $type: "tokens" | "environment" }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background: ${(props) => {
		switch (props.$type) {
			case "tokens":
				return "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)";
			case "environment":
				return "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)";
		}
	}};
  color: ${(props) => {
		switch (props.$type) {
			case "tokens":
				return "#991b1b";
			case "environment":
				return "#166534";
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$type) {
			case "tokens":
				return "#fecaca";
			case "environment":
				return "#bbf7d0";
		}
	}};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const FlowStatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const FlowStatusCard = styled.div<{
	$status: "configured" | "partial" | "missing";
}>`
  background: ${(props) => {
		switch (props.$status) {
			case "configured":
				return "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)";
			case "partial":
				return "linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%)";
			case "missing":
				return "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)";
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$status) {
			case "configured":
				return "#bbf7d0";
			case "partial":
				return "#fed7aa";
			case "missing":
				return "#fecaca";
		}
	}};
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(props) => {
			switch (props.$status) {
				case "configured":
					return "linear-gradient(90deg, #10b981, #34d399)";
				case "partial":
					return "linear-gradient(90deg, #f59e0b, #fbbf24)";
				case "missing":
					return "linear-gradient(90deg, #ef4444, #f87171)";
			}
		}};
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: ${(props) => {
			switch (props.$status) {
				case "configured":
					return "#86efac";
				case "partial":
					return "#fcd34d";
				case "missing":
					return "#fca5a5";
			}
		}};
  }
`;

const FlowName = styled.h4`
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusBadge = styled.div<{
	$status: "configured" | "partial" | "missing";
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: ${(props) => {
		switch (props.$status) {
			case "configured":
				return "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)";
			case "partial":
				return "linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)";
			case "missing":
				return "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)";
		}
	}};
  color: ${(props) => {
		switch (props.$status) {
			case "configured":
				return "#166534";
			case "partial":
				return "#92400e";
			case "missing":
				return "#991b1b";
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.$status) {
			case "configured":
				return "#86efac";
			case "partial":
				return "#fcd34d";
			case "missing":
				return "#fca5a5";
		}
	}};
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
`;

const FlowDetails = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.75rem;
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .field-name {
    font-weight: 500;
  }
  
  .field-status {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  
  .icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
`;

interface FlowCredentialStatus {
	flowName: string;
	flowType: "config" | "authz" | "implicit";
	credentials: PermanentCredentials;
	status: "configured" | "partial" | "missing";
	lastUpdated?: number;
}

const CredentialStatusPanel: React.FC = () => {
	const { tokens, isAuthenticated } = useAuth();
	const [flowStatuses, setFlowStatuses] = useState<FlowCredentialStatus[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [_lastRefresh, setLastRefresh] = useState<Date>(new Date());
	const [showServerStatusModal, setShowServerStatusModal] = useState(false);

	const checkCredentials = useCallback(
		(
			credentials: PermanentCredentials,
		): "configured" | "partial" | "missing" => {
			const hasRequired =
				credentials.environmentId &&
				credentials.clientId &&
				credentials.redirectUri;
			const hasOptional =
				credentials.clientSecret ||
				credentials.authEndpoint ||
				credentials.tokenEndpoint;

			if (hasRequired && hasOptional) return "configured";
			if (hasRequired) return "partial";
			return "missing";
		},
		[],
	);

	const refreshStatuses = useCallback(async () => {
		console.log(
			"🔄 [CredentialStatusPanel] Refreshing statuses - button clicked",
		);
		setIsLoading(true);
		try {
			console.log("🔄 [CredentialStatusPanel] Loading credentials...");
			const configCredentials = credentialManager.loadConfigCredentials();
			const authzFlowCredentials = credentialManager.loadAuthzFlowCredentials();
			const implicitFlowCredentials =
				credentialManager.loadImplicitFlowCredentials();

			console.log("🔄 [CredentialStatusPanel] Loaded credentials:", {
				config: configCredentials,
				authz: authzFlowCredentials,
				implicit: implicitFlowCredentials,
			});

			logger.debug("CredentialStatusPanel", "Loaded credentials", {
				config: configCredentials,
				authz: authzFlowCredentials,
				implicit: implicitFlowCredentials,
			});

			const statuses: FlowCredentialStatus[] = [
				{
					flowName: "Dashboard Configuration",
					flowType: "config",
					credentials: configCredentials || {},
					status: checkCredentials(configCredentials || {}),
					lastUpdated: configCredentials?.lastUpdated,
				},
				{
					flowName: "Authorization Code Flow",
					flowType: "authz",
					credentials: authzFlowCredentials || {},
					status: checkCredentials(authzFlowCredentials || {}),
					lastUpdated: authzFlowCredentials?.lastUpdated,
				},
				{
					flowName: "Implicit Flow",
					flowType: "implicit",
					credentials: implicitFlowCredentials || {},
					status: checkCredentials(implicitFlowCredentials || {}),
					lastUpdated: implicitFlowCredentials?.lastUpdated,
				},
			];

			console.log("🔄 [CredentialStatusPanel] Setting new statuses:", statuses);
			setFlowStatuses(statuses);
			setLastRefresh(new Date());

			console.log("🔄 [CredentialStatusPanel] Statuses updated successfully");
			logger.debug("CredentialStatusPanel", "Statuses updated", statuses);
			showGlobalSuccess(
				"🔄 System Status Refreshed",
				"All credential statuses have been updated successfully",
			);
		} catch (error) {
			logger.error("CredentialStatusPanel", "Error refreshing statuses", error);
			showGlobalError(
				"❌ Refresh Failed",
				"Failed to refresh system status. Please try again.",
			);
		} finally {
			setIsLoading(false);
		}
	}, [checkCredentials]);

	// Load initial statuses
	useEffect(() => {
		refreshStatuses();
	}, [refreshStatuses]);

	const getStatusIcon = (status: "configured" | "partial" | "missing") => {
		switch (status) {
			case "configured":
				return <FiCheckCircle size={16} color="#10b981" />;
			case "partial":
				return <FiAlertTriangle size={16} color="#f59e0b" />;
			case "missing":
				return <FiXCircle size={16} color="#ef4444" />;
		}
	};

	const getStatusText = (status: "configured" | "partial" | "missing") => {
		switch (status) {
			case "configured":
				return "Fully Configured";
			case "partial":
				return "Partially Configured";
			case "missing":
				return "Not Configured";
		}
	};

	const formatLastUpdated = (timestamp?: number) => {
		if (!timestamp) return "Never";
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
		return date.toLocaleDateString();
	};

	return (
		<StatusPanel>
			<StatusHeader>
				<h3>System Status</h3>
				<ButtonGroup>
					<RefreshButton
						onClick={(e) => {
							console.log(
								"🔄 [CredentialStatusPanel] Refresh button clicked!",
								e,
							);
							showFlowSuccess(
								"🔄 Refreshing System Status",
								"Loading all credential statuses...",
							);
							refreshStatuses();
						}}
						disabled={isLoading}
					>
						<FiRefreshCw
							size={16}
							className={isLoading ? "animate-spin" : ""}
						/>
						{isLoading ? "Refreshing..." : "Refresh"}
					</RefreshButton>
					<StatusButton
						onClick={() => {
							setShowServerStatusModal(true);
							showFlowSuccess(
								"🖥️ Server Status Modal Opened",
								"Checking status of frontend and backend servers",
							);
						}}
					>
						<FiServer size={16} />
						Server Status
					</StatusButton>
				</ButtonGroup>
			</StatusHeader>

			<StatusIndicators>
				<StatusIndicator $type="tokens">
					<FiClock size={16} />
					{tokens && isAuthenticated ? "Active Tokens" : "No Active Tokens"}
				</StatusIndicator>
				<StatusIndicator $type="environment">
					<FiShield size={16} />
					Environment Configured
				</StatusIndicator>
			</StatusIndicators>

			{flowStatuses.length === 0 ? (
				<EmptyState>
					<div className="icon">🔍</div>
					<p>No credential information available</p>
				</EmptyState>
			) : (
				<FlowStatusGrid>
					{flowStatuses.map((flow) => (
						<FlowStatusCard key={flow.flowType} $status={flow.status}>
							<FlowName>
								{getStatusIcon(flow.status)}
								{flow.flowName}
							</FlowName>

							<StatusBadge $status={flow.status}>
								{getStatusIcon(flow.status)}
								{getStatusText(flow.status)}
							</StatusBadge>

							<FlowDetails>
								<div className="detail-row">
									<span className="field-name">Environment ID:</span>
									<span className="field-status">
										{flow.credentials.environmentId ? (
											<>
												<FiCheckCircle size={12} />
												{flow.credentials.environmentId.substring(0, 8)}...
											</>
										) : (
											<>
												<FiXCircle size={12} />
												Missing
											</>
										)}
									</span>
								</div>

								<div className="detail-row">
									<span className="field-name">Client ID:</span>
									<span className="field-status">
										{flow.credentials.clientId ? (
											<>
												<FiCheckCircle size={12} />
												{flow.credentials.clientId.substring(0, 8)}...
											</>
										) : (
											<>
												<FiXCircle size={12} />
												Missing
											</>
										)}
									</span>
								</div>

								<div className="detail-row">
									<span className="field-name">Redirect URI:</span>
									<span className="field-status">
										{flow.credentials.redirectUri ? (
											<>
												<FiCheckCircle size={12} />
												Configured
											</>
										) : (
											<>
												<FiXCircle size={12} />
												Missing
											</>
										)}
									</span>
								</div>

								<div className="detail-row">
									<span className="field-name">Last Updated:</span>
									<span className="field-status">
										{formatLastUpdated(flow.lastUpdated)}
									</span>
								</div>
							</FlowDetails>
						</FlowStatusCard>
					))}
				</FlowStatusGrid>
			)}

			{/* Server Status Modal */}
			<ServerStatusModal
				isOpen={showServerStatusModal}
				onClose={() => setShowServerStatusModal(false)}
			/>
		</StatusPanel>
	);
};

export default CredentialStatusPanel;
