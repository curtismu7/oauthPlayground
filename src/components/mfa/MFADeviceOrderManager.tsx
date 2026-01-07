import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import React, { useState } from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';
import { FaArrowDown, FaArrowUp, FaGripVertical, FaSave, FaTimes } from 'react-icons/fa';
import useMFADeviceOrder from '../../hooks/useMFADeviceOrder';
import { useMFADevices } from '../../hooks/useMFADevices';

interface MFADeviceOrderManagerProps {
	accessToken: string;
	environmentId: string;
	userId: string;
	onOrderUpdated?: () => void;
}

const MFADeviceOrderManager: React.FC<MFADeviceOrderManagerProps> = ({
	accessToken,
	environmentId,
	userId,
	onOrderUpdated,
}) => {
	const { devices, isLoading, loadDevices } = useMFADevices({ accessToken, environmentId, userId });
	const { updateDeviceOrder, isUpdating } = useMFADeviceOrder({
		environmentId,
		userId,
	});

	const [localDevices, setLocalDevices] = useState(devices);
	const [isEditing, setIsEditing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Update local state when devices change
	React.useEffect(() => {
		setLocalDevices(devices);
	}, [devices]);

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) return;

		const items = Array.from(localDevices);
		const [reorderedItem] = items.splice(result.source.index, 1);
		items.splice(result.destination.index, 0, reorderedItem);

		setLocalDevices(items);
	};

	const moveDevice = (index: number, direction: 'up' | 'down') => {
		const items = [...localDevices];
		const newIndex = direction === 'up' ? index - 1 : index + 1;

		if (newIndex < 0 || newIndex >= items.length) return;

		[items[index], items[newIndex]] = [items[newIndex], items[index]];
		setLocalDevices(items);
	};

	const handleSaveOrder = async () => {
		try {
			setError(null);
			await updateDeviceOrder(localDevices.map((device) => device.id));
			await loadDevices(); // Refresh devices to ensure we have the latest order
			setIsEditing(false);
			onOrderUpdated?.();
		} catch (err) {
			setError('Failed to update device order. Please try again.');
			console.error('Error updating device order:', err);
		}
	};

	const handleCancel = () => {
		setLocalDevices(devices); // Reset to original order
		setIsEditing(false);
		setError(null);
	};

	const getDeviceTypeLabel = (type: string) => {
		switch (type) {
			case 'SMS':
				return 'SMS';
			case 'TOTP':
				return 'Authenticator App';
			case 'FIDO2':
				return 'Security Key';
			case 'EMAIL':
				return 'Email';
			default:
				return type;
		}
	};

	const getDeviceIcon = (type: string) => {
		switch (type) {
			case 'SMS':
				return '📱';
			case 'TOTP':
				return '🔐';
			case 'FIDO2':
				return '🔑';
			case 'EMAIL':
				return '📧';
			default:
				return '📱';
		}
	};

	if (isLoading) {
		return (
			<div className="d-flex justify-content-center my-4">
				<Spinner animation="border" role="status">
					<span className="visually-hidden">Loading devices...</span>
				</Spinner>
			</div>
		);
	}

	if (devices.length === 0) {
		return (
			<Alert variant="info" className="mt-3">
				No MFA devices found for this user.
			</Alert>
		);
	}

	return (
		<Card className="mt-4">
			<Card.Header className="d-flex justify-content-between align-items-center">
				<h5 className="mb-0">MFA Device Order</h5>
				{!isEditing ? (
					<Button
						variant="outline-primary"
						size="sm"
						onClick={() => setIsEditing(true)}
						disabled={devices.length <= 1}
					>
						Reorder Devices
					</Button>
				) : (
					<div>
						<Button
							variant="success"
							size="sm"
							className="me-2"
							onClick={handleSaveOrder}
							disabled={isUpdating}
						>
							{isUpdating ? (
								<>
									<Spinner as="span" size="sm" animation="border" role="status" className="me-1" />
									Saving...
								</>
							) : (
								<>
									<FaSave className="me-1" /> Save Order
								</>
							)}
						</Button>
						<Button
							variant="outline-secondary"
							size="sm"
							onClick={handleCancel}
							disabled={isUpdating}
						>
							<FaTimes className="me-1" /> Cancel
						</Button>
					</div>
				)}
			</Card.Header>
			<Card.Body>
				{error && <Alert variant="danger">{error}</Alert>}

				{isEditing ? (
					<div>
						{/* Drag and Drop Interface */}
						<DragDropContext onDragEnd={handleDragEnd}>
							<Droppable droppableId="devices">
								{(provided) => (
									<div {...provided.droppableProps} ref={provided.innerRef}>
										{localDevices.map((device, index) => (
											<Draggable key={device.id} draggableId={device.id} index={index}>
												{(provided, snapshot) => (
													<div
														ref={provided.innerRef}
														{...provided.draggableProps}
														className={`d-flex align-items-center p-3 mb-2 border rounded ${
															snapshot.isDragging ? 'shadow-lg' : ''
														}`}
													>
														<div
															{...provided.dragHandleProps}
															className="me-3 text-muted"
															style={{ cursor: 'grab' }}
														>
															<FaGripVertical />
														</div>
														<div className="flex-grow-1">
															<div className="d-flex align-items-center">
																<span className="me-2">{getDeviceIcon(device.type)}</span>
																<div className="fw-bold">{getDeviceTypeLabel(device.type)}</div>
															</div>
															{device.phoneNumber && (
																<div className="text-muted small">{device.phoneNumber}</div>
															)}
															{device.emailAddress && (
																<div className="text-muted small">{device.emailAddress}</div>
															)}
															{device.name && <div className="text-muted small">{device.name}</div>}
														</div>
														<div className="d-flex align-items-center">
															<div className="me-3">
																<Button
																	variant="outline-secondary"
																	size="sm"
																	onClick={() => moveDevice(index, 'up')}
																	disabled={index === 0}
																	className="me-1"
																>
																	<FaArrowUp />
																</Button>
																<Button
																	variant="outline-secondary"
																	size="sm"
																	onClick={() => moveDevice(index, 'down')}
																	disabled={index === localDevices.length - 1}
																>
																	<FaArrowDown />
																</Button>
															</div>
															<div className="badge bg-light text-dark">
																{device.status === 'ACTIVE' ? 'Active' : 'Inactive'}
															</div>
														</div>
													</div>
												)}
											</Draggable>
										))}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</DragDropContext>

						<div className="mt-3 text-muted small">
							<p className="mb-1">
								<strong>Instructions:</strong> Drag devices to reorder or use the arrow buttons.
							</p>
							<p className="mb-0">
								The first device in the list will be used as the primary MFA method.
							</p>
						</div>
					</div>
				) : (
					<div>
						<div className="list-group">
							{localDevices.map((device, index) => (
								<div
									key={device.id}
									className="list-group-item d-flex justify-content-between align-items-center"
								>
									<div>
										<div className="d-flex align-items-center">
											<span className="me-2">{getDeviceIcon(device.type)}</span>
											<div className="fw-bold">
												{index + 1}. {getDeviceTypeLabel(device.type)}
											</div>
										</div>
										{device.phoneNumber && (
											<div className="text-muted small">{device.phoneNumber}</div>
										)}
										{device.emailAddress && (
											<div className="text-muted small">{device.emailAddress}</div>
										)}
										{device.name && <div className="text-muted small">{device.name}</div>}
									</div>
									<span
										className={`badge ${device.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}
									>
										{device.status === 'ACTIVE' ? 'Active' : 'Inactive'}
									</span>
								</div>
							))}
						</div>

						<div className="mt-3 text-muted small">
							<p className="mb-1">
								<strong>Current Order:</strong> The first device (#{1}) is the primary MFA method.
							</p>
							<p className="mb-0">To change the order, click "Reorder Devices" above.</p>
						</div>
					</div>
				)}
			</Card.Body>
		</Card>
	);
};

export default MFADeviceOrderManager;
