/**
 * @file DeleteAllUsersFlow.tsx
 * @module apps/user-management/components
 * @description Step-based flow for bulk user deletion with MFA-style UI patterns
 * @version 8.0.0
 * @since 2026-02-20
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiArrowLeft,
	FiArrowRight,
	FiCheckCircle,
	FiClock,
	FiShield,
	FiTrash2,
	FiUsers,
} from 'react-icons/fi';
import { MFAErrorBoundary } from '@/apps/mfa/components/shared/MFAErrorBoundary';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import {
	type BulkOperationState,
	BulkOperationStateManager,
} from '../services/bulkOperationStateManager';
// Import new services
import {
	type BulkUserDeletionOptions,
	type BulkUserDeletionResult,
	DeleteAllUsersService,
	type UserDeletionProgress,
	type UserSummary,
} from '../services/deleteAllUsersService';

// ============================================================================
// TYPES
// ============================================================================

export type DeleteUsersStep = 'CONFIGURATION' | 'REVIEW' | 'CONFIRMATION' | 'EXECUTION' | 'RESULTS';

interface DeleteAllUsersFlowProps {
	environmentId: string;
	onComplete?: (result: BulkUserDeletionResult) => void;
	onCancel?: () => void;
	initialStep?: DeleteUsersStep;
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

const ConfigurationStep: React.FC<{
	options: BulkUserDeletionOptions;
	onChange: (options: BulkUserDeletionOptions) => void;
	onNext: () => void;
	onBack: () => void;
	isLoading: boolean;
}> = ({ options, onChange, onNext, onBack, isLoading }) => {
	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<FiTrash2 className="w-8 h-8 text-red-600" />
				</div>
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Delete Users Configuration</h2>
				<p className="text-gray-600">Configure the bulk user deletion operation</p>
			</div>

			<div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
				<div>
					<label
						className="block text-sm font-medium text-gray-700 mb-2"
						htmlFor="userstatusfilter"
					>
						User Status Filter
					</label>
					<select
						value={options.userFilters?.status || 'all'}
						onChange={(e) =>
							onChange({
								...options,
								userFilters: {
									...options.userFilters,
									status: e.target.value as any,
								},
							})
						}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
					>
						<option value="all">All Users</option>
						<option value="active">Active Only</option>
						<option value="inactive">Inactive Only</option>
						<option value="pending">Pending Only</option>
					</select>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="batchsize">
						Batch Size
					</label>
					<input
						type="number"
						min="1"
						max="100"
						value={options.batchSize || 50}
						onChange={(e) =>
							onChange({
								...options,
								batchSize: parseInt(e.target.value, 10) || 50,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
					/>
					<p className="text-xs text-gray-500 mt-1">
						Number of users to process in each batch (1-100)
					</p>
				</div>

				<div className="flex items-center">
					<input
						type="checkbox"
						id="dryRun"
						checked={options.dryRun || false}
						onChange={(e) =>
							onChange({
								...options,
								dryRun: e.target.checked,
							})
						}
						className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
					/>
					<label
						htmlFor="dryRun"
						className="ml-2 text-sm text-gray-700"
						htmlFor="dryrunpreviewwithoutactualdeletion"
					>
						Dry Run (Preview without actual deletion)
					</label>
				</div>
			</div>

			<div className="flex justify-between">
				<button
					type="button"
					onClick={onBack}
					className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
				>
					<FiArrowLeft className="w-4 h-4 mr-2 inline" />
					Back
				</button>
				<button
					type="button"
					onClick={onNext}
					disabled={isLoading}
					className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? (
						<>
							<ButtonSpinner size="sm" className="mr-2" />
							Loading...
						</>
					) : (
						<>
							Next
							<FiArrowRight className="w-4 h-4 ml-2 inline" />
						</>
					)}
				</button>
			</div>
		</div>
	);
};

const ReviewStep: React.FC<{
	options: BulkUserDeletionOptions;
	users: UserSummary[];
	onNext: () => void;
	onBack: () => void;
	isLoading: boolean;
}> = ({ options, users, onNext, onBack, isLoading }) => {
	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<FiAlertTriangle className="w-8 h-8 text-yellow-600" />
				</div>
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Review Deletion Plan</h2>
				<p className="text-gray-600">Review the users that will be deleted</p>
			</div>

			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="text-center p-4 bg-gray-50 rounded-lg">
						<div className="text-2xl font-bold text-gray-900">{users.length}</div>
						<div className="text-sm text-gray-600">Total Users</div>
					</div>
					<div className="text-center p-4 bg-red-50 rounded-lg">
						<div className="text-2xl font-bold text-red-600">{users.length}</div>
						<div className="text-sm text-gray-600">Will Be Deleted</div>
					</div>
					<div className="text-center p-4 bg-blue-50 rounded-lg">
						<div className="text-2xl font-bold text-blue-600">{options.batchSize || 50}</div>
						<div className="text-sm text-gray-600">Batch Size</div>
					</div>
				</div>

				<div className="space-y-2">
					<h3 className="font-medium text-gray-900">
						Sample Users ({Math.min(5, users.length)} of {users.length}):
					</h3>
					<div className="max-h-48 overflow-y-auto space-y-2">
						{users.slice(0, 5).map((user) => (
							<div
								key={user.id}
								className="flex items-center justify-between p-2 bg-gray-50 rounded"
							>
								<div className="flex items-center space-x-3">
									<div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
										<FiUsers className="w-4 h-4 text-gray-600" />
									</div>
									<div>
										<div className="font-medium text-gray-900">{user.username}</div>
										<div className="text-sm text-gray-500">{user.email}</div>
									</div>
								</div>
								<div className="text-sm text-gray-500">
									<span
										className={`px-2 py-1 rounded-full text-xs font-medium ${
											user.status === 'active'
												? 'bg-green-100 text-green-800'
												: user.status === 'inactive'
													? 'bg-gray-100 text-gray-800'
													: 'bg-yellow-100 text-yellow-800'
										}`}
									>
										{user.status}
									</span>
								</div>
							</div>
						))}
						{users.length > 5 && (
							<div className="text-center text-sm text-gray-500 py-2">
								... and {users.length - 5} more users
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="flex justify-between">
				<button
					type="button"
					onClick={onBack}
					className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
				>
					<FiArrowLeft className="w-4 h-4 mr-2 inline" />
					Back
				</button>
				<button
					type="button"
					onClick={onNext}
					disabled={isLoading || users.length === 0}
					className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? (
						<>
							<ButtonSpinner size="sm" className="mr-2" />
							Loading...
						</>
					) : (
						<>
							Continue to Confirmation
							<FiArrowRight className="w-4 h-4 ml-2 inline" />
						</>
					)}
				</button>
			</div>
		</div>
	);
};

const ConfirmationStep: React.FC<{
	options: BulkUserDeletionOptions;
	users: UserSummary[];
	onConfirm: () => void;
	onBack: () => void;
	isLoading: boolean;
}> = ({ options, users, onConfirm, onBack, isLoading }) => {
	const [confirmed, setConfirmed] = useState(false);
	const [confirmationText, setConfirmationText] = useState('');

	const handleConfirm = () => {
		if (confirmed && confirmationText === 'DELETE') {
			onConfirm();
		}
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<FiShield className="w-8 h-8 text-red-600" />
				</div>
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Final Confirmation</h2>
				<p className="text-gray-600">This action cannot be undone</p>
			</div>

			<div className="bg-red-50 border border-red-200 rounded-lg p-6">
				<h3 className="font-semibold text-red-900 mb-4">⚠️ Warning: Irreversible Action</h3>
				<ul className="space-y-2 text-red-800">
					<li>• {users.length} users will be permanently deleted</li>
					<li>• All user data and associated devices will be removed</li>
					<li>• This action cannot be undone</li>
					<li>
						•{' '}
						{options.dryRun
							? 'This is a dry run - no actual deletion will occur'
							: 'This is a live deletion operation'}
					</li>
				</ul>
			</div>

			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="space-y-4">
					<div className="flex items-center">
						<input
							type="checkbox"
							id="confirm"
							checked={confirmed}
							onChange={(e) => setConfirmed(e.target.checked)}
							className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
						/>
						<label
							htmlFor="confirm"
							className="ml-2 text-sm text-gray-700"
							htmlFor="iunderstandthatthisactionispermanentandcannotbeundone"
						>
							I understand that this action is permanent and cannot be undone
						</label>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-gray-700 mb-2"
							htmlFor="typedeletetoconfirm"
						>
							Type "DELETE" to confirm
						</label>
						<input
							type="text"
							value={confirmationText}
							onChange={(e) => setConfirmationText(e.target.value)}
							placeholder="Type DELETE"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
						/>
					</div>
				</div>
			</div>

			<div className="flex justify-between">
				<button
					type="button"
					onClick={onBack}
					className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
				>
					<FiArrowLeft className="w-4 h-4 mr-2 inline" />
					Back
				</button>
				<button
					type="button"
					onClick={handleConfirm}
					disabled={!confirmed || confirmationText !== 'DELETE' || isLoading}
					className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? (
						<>
							<ButtonSpinner size="sm" className="mr-2" />
							Processing...
						</>
					) : (
						<>
							<FiTrash2 className="w-4 h-4 mr-2 inline" />
							{options.dryRun ? 'Start Dry Run' : 'Delete Users'}
						</>
					)}
				</button>
			</div>
		</div>
	);
};

const ExecutionStep: React.FC<{
	options: BulkUserDeletionOptions;
	progress: UserDeletionProgress | null;
	result: BulkUserDeletionResult | null;
	onCancel: () => void;
}> = ({ options, progress, result, onCancel }) => {
	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
					{result ? (
						<FiCheckCircle className="w-8 h-8 text-green-600" />
					) : (
						<FiClock className="w-8 h-8 text-blue-600" />
					)}
				</div>
				<h2 className="text-2xl font-bold text-gray-900 mb-2">
					{result ? 'Operation Complete' : 'Executing Deletion'}
				</h2>
				<p className="text-gray-600">
					{result ? 'The bulk deletion operation has completed' : 'Processing users in batches...'}
				</p>
			</div>

			{progress && !result && (
				<div className="bg-white rounded-lg border border-gray-200 p-6">
					<div className="space-y-4">
						<div>
							<div className="flex justify-between text-sm text-gray-600 mb-2">
								<span>Progress</span>
								<span>
									{progress.current} / {progress.total} ({progress.percentage}%)
								</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className="bg-blue-600 h-2 rounded-full transition-all duration-300"
									style={{ width: `${progress.percentage}%` }}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-gray-600">Current Batch:</span>
								<span className="ml-2 font-medium">
									{progress.currentBatch} / {progress.totalBatches}
								</span>
							</div>
							<div>
								<span className="text-gray-600">Est. Time Remaining:</span>
								<span className="ml-2 font-medium">
									{progress.estimatedTimeRemaining > 0
										? `${Math.round(progress.estimatedTimeRemaining / 1000)}s`
										: 'Calculating...'}
								</span>
							</div>
						</div>

						{progress.currentUser && (
							<div className="bg-gray-50 rounded-lg p-3">
								<div className="text-sm text-gray-600">Currently Processing:</div>
								<div className="font-medium text-gray-900">{progress.currentUser.username}</div>
								<div className="text-sm text-gray-500">{progress.currentUser.email}</div>
							</div>
						)}
					</div>
				</div>
			)}

			{result && (
				<div className="bg-white rounded-lg border border-gray-200 p-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div className="text-center p-4 bg-green-50 rounded-lg">
							<div className="text-2xl font-bold text-green-600">{result.successful}</div>
							<div className="text-sm text-gray-600">Successfully Deleted</div>
						</div>
						<div className="text-center p-4 bg-red-50 rounded-lg">
							<div className="text-2xl font-bold text-red-600">{result.failed}</div>
							<div className="text-sm text-gray-600">Failed</div>
						</div>
						<div className="text-center p-4 bg-blue-50 rounded-lg">
							<div className="text-2xl font-bold text-blue-600">
								{Math.round(result.duration / 1000)}s
							</div>
							<div className="text-sm text-gray-600">Duration</div>
						</div>
					</div>

					{result.errors.length > 0 && (
						<div>
							<h3 className="font-medium text-gray-900 mb-2">Errors:</h3>
							<div className="max-h-32 overflow-y-auto space-y-1">
								{result.errors.slice(0, 5).map((error, index) => (
									<div key={index} className="text-sm text-red-600">
										{error.username}: {error.error}
									</div>
								))}
								{result.errors.length > 5 && (
									<div className="text-sm text-gray-500">
										... and {result.errors.length - 5} more errors
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			)}

			<div className="flex justify-center">
				{result ? (
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
					>
						<FiCheckCircle className="w-4 h-4 mr-2 inline" />
						Done
					</button>
				) : (
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
					>
						Cancel Operation
					</button>
				)}
			</div>
		</div>
	);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const DeleteAllUsersFlow: React.FC<DeleteAllUsersFlowProps> = ({
	environmentId,
	onComplete,
	onCancel,
	initialStep = 'CONFIGURATION',
}) => {
	const [currentStep, setCurrentStep] = useState<DeleteUsersStep>(initialStep);
	const [options, setOptions] = useState<BulkUserDeletionOptions>({
		environmentId,
		batchSize: 50,
		dryRun: true,
	});
	const [users, setUsers] = useState<UserSummary[]>([]);
	const [progress, setProgress] = useState<UserDeletionProgress | null>(null);
	const [result, setResult] = useState<BulkUserDeletionResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [operationState, setOperationState] = useState<BulkOperationState | null>(null);

	// Initialize operation state
	useEffect(() => {
		const state = BulkOperationStateManager.createInitialState(
			'delete-users',
			{
				environmentId,
				batchSize: options.batchSize || 50,
				dryRun: options.dryRun || false,
			},
			'current-user'
		);
		setOperationState(state);
		BulkOperationStateManager.saveState(state);
	}, [environmentId, options.batchSize, options.dryRun]);

	// Load users for review
	const loadUsers = useCallback(async () => {
		if (!options.environmentId) return;

		setIsLoading(true);
		try {
			const { users: userList } = await DeleteAllUsersService.getUsersSummary(options);
			setUsers(userList);
		} catch (error) {
			toastV8.error('Failed to load users summary');
			console.error('Failed to load users:', error);
		} finally {
			setIsLoading(false);
		}
	}, [options]);

	// Execute deletion
	const executeDeletion = useCallback(async () => {
		if (!operationState) return;

		setIsLoading(true);
		try {
			// Update status to running
			BulkOperationStateManager.updateStatus(operationState.operationId, 'running');

			const deletionResult = await DeleteAllUsersService.deleteUsers(options, (progressUpdate) => {
				setProgress(progressUpdate);
				BulkOperationStateManager.updateProgress(operationState.operationId, progressUpdate);
			});

			setResult(deletionResult);
			setCurrentStep('RESULTS');

			// Update status to completed
			BulkOperationStateManager.updateStatus(operationState.operationId, 'completed', {
				duration: deletionResult.duration,
			});

			if (onComplete) {
				onComplete(deletionResult);
			}

			toastV8.success(
				`Deletion completed: ${deletionResult.successful} successful, ${deletionResult.failed} failed`
			);
		} catch (error) {
			toastV8.error('Deletion operation failed');
			console.error('Deletion failed:', error);

			// Update status to failed
			BulkOperationStateManager.updateStatus(operationState.operationId, 'failed');
		} finally {
			setIsLoading(false);
		}
	}, [options, operationState, onComplete]);

	// Step navigation
	const handleNext = useCallback(() => {
		const steps: DeleteUsersStep[] = [
			'CONFIGURATION',
			'REVIEW',
			'CONFIRMATION',
			'EXECUTION',
			'RESULTS',
		];
		const currentIndex = steps.indexOf(currentStep);
		if (currentIndex < steps.length - 1) {
			const nextStep = steps[currentIndex + 1];
			setCurrentStep(nextStep);

			// Load users when moving to review step
			if (nextStep === 'REVIEW') {
				loadUsers();
			}

			// Execute deletion when moving to execution step
			if (nextStep === 'EXECUTION') {
				executeDeletion();
			}
		}
	}, [currentStep, loadUsers, executeDeletion]);

	const handleBack = useCallback(() => {
		const steps: DeleteUsersStep[] = [
			'CONFIGURATION',
			'REVIEW',
			'CONFIRMATION',
			'EXECUTION',
			'RESULTS',
		];
		const currentIndex = steps.indexOf(currentStep);
		if (currentIndex > 0) {
			setCurrentStep(steps[currentIndex - 1]);
		}
	}, [currentStep]);

	const handleCancel = useCallback(() => {
		if (operationState) {
			BulkOperationStateManager.updateStatus(operationState.operationId, 'cancelled');
		}
		if (onCancel) {
			onCancel();
		}
	}, [operationState, onCancel]);

	// Render current step
	const renderStep = () => {
		switch (currentStep) {
			case 'CONFIGURATION':
				return (
					<ConfigurationStep
						options={options}
						onChange={setOptions}
						onNext={handleNext}
						onBack={handleCancel}
						isLoading={isLoading}
					/>
				);
			case 'REVIEW':
				return (
					<ReviewStep
						options={options}
						users={users}
						onNext={handleNext}
						onBack={handleBack}
						isLoading={isLoading}
					/>
				);
			case 'CONFIRMATION':
				return (
					<ConfirmationStep
						options={options}
						users={users}
						onConfirm={handleNext}
						onBack={handleBack}
						isLoading={isLoading}
					/>
				);
			case 'EXECUTION':
			case 'RESULTS':
				return (
					<ExecutionStep
						options={options}
						progress={progress}
						result={result}
						onCancel={handleCancel}
					/>
				);
			default:
				return null;
		}
	};

	// Progress indicator
	const steps: DeleteUsersStep[] = [
		'CONFIGURATION',
		'REVIEW',
		'CONFIRMATION',
		'EXECUTION',
		'RESULTS',
	];
	const currentStepIndex = steps.indexOf(currentStep);

	return (
		<MFAErrorBoundary>
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-4xl mx-auto px-4">
					{/* Progress indicator */}
					<div className="mb-8">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center space-x-2">
								<FiTrash2 className="w-5 h-5 text-red-600" />
								<span className="text-sm font-medium text-gray-700">Bulk User Deletion</span>
							</div>
							<span className="text-sm text-gray-500">
								Step {currentStepIndex + 1} of {steps.length}
							</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-red-600 h-2 rounded-full transition-all duration-300"
								style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
							/>
						</div>
						<div className="flex justify-between mt-2">
							{steps.map((step, index) => (
								<div
									key={step}
									className={`text-xs font-medium ${
										index <= currentStepIndex ? 'text-red-600' : 'text-gray-400'
									}`}
								>
									{step.charAt(0) + step.slice(1).toLowerCase()}
								</div>
							))}
						</div>
					</div>

					{/* Step content */}
					<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
						{renderStep()}
					</div>
				</div>
			</div>
		</MFAErrorBoundary>
	);
};
