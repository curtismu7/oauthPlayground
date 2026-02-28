import React, { useEffect, useState } from 'react';
import {
	FiLoader,
	FiLogOut,
	FiPlus,
	FiTrash,
	FiTrash2
} from '@icons';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { DavinciTodoProvider, useDavinciTodo } from './contexts/DavinciTodoContext';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.h1`
  color: #333;
  margin-bottom: 1rem;
  font-size: 2.5rem;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #007bff;
  text-decoration: none;
  margin-bottom: 2rem;
  font-weight: 500;
  
  &:hover {
    color: #0056b3;
  }
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-style: italic;
  justify-content: center;
  padding: 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 2rem;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e0e0e0;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
`;

const FixedStatusPanel = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  z-index: 1000;
`;

const StatusPanelHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  color: #333;
`;

const StatusPanelContent = styled.div`
  padding: 1rem;
`;

const APILogEntry = styled.div`
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
`;

const APILogTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
`;

const APILogDetails = styled.div`
  margin-bottom: 0.5rem;
`;

const APILogCode = styled.pre`
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0.5rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const TodoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TodoItem = styled.div<{ completed: boolean }>`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;

  ${(props) =>
		props.completed &&
		`
    opacity: 0.7;
    background: #f8f9fa;
  `}

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const TodoCheckbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const TodoText = styled.span<{ completed: boolean }>`
  flex: 1;
  ${(props) =>
		props.completed &&
		`
    text-decoration: line-through;
    color: #666;
  `}
`;

const TodoActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f0f0;
    color: #333;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddTodoForm = styled.form`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TodoInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #0056b3;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const LogoutButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background: #545b62;
    color: #ffffff !important;
  }
`;

interface APILog {
	id: string;
	timestamp: Date;
	method: string;
	url: string;
	requestHeaders?: Record<string, string>;
	requestBody?: unknown;
	responseStatus?: number;
	responseHeaders?: Record<string, string>;
	responseBody?: unknown;
	error?: string;
}

const DavinciTodoApp: React.FC = () => {
	const {
		todos,
		isLoading,
		error,
		isAuthenticated,
		todoStats,
		loadTodos,
		createTodo,
		deleteTodoService,
		toggleTodo,
		clearCurrentUser,
	} = useDavinciTodo();

	const [newTodoTitle, setNewTodoTitle] = useState('');
	const [isCreating, setIsCreating] = useState(false);
	const [apiLogs, setApiLogs] = useState<APILog[]>([]);

	const addAPILog = (log: Omit<APILog, 'id' | 'timestamp'>) => {
		const newLog: APILog = {
			...log,
			id: Date.now().toString(),
			timestamp: new Date(),
		};
		setApiLogs((prev) => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
	};

	useEffect(() => {
		if (isAuthenticated) {
			loadTodos();
		}
	}, [isAuthenticated, loadTodos]);

	const handleCreateTodo = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTodoTitle.trim()) return;

		setIsCreating(true);

		addAPILog({
			method: 'POST',
			url: '/api/davinci-todos',
			requestHeaders: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ...',
			},
			requestBody: {
				title: newTodoTitle,
				description: '',
			},
		});

		try {
			await createTodo(newTodoTitle);
			setNewTodoTitle('');

			addAPILog({
				method: 'POST',
				url: '/api/davinci-todos',
				responseStatus: 201,
				responseBody: {
					id: `todo-${Date.now()}`,
					title: newTodoTitle,
					completed: false,
					createdAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			addAPILog({
				method: 'POST',
				url: '/api/davinci-todos',
				responseStatus: 500,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		} finally {
			setIsCreating(false);
		}
	};

	const handleToggle = async (id: string) => {
		const todo = todos.find((t) => t.id === id);
		if (!todo) return;

		addAPILog({
			method: 'PATCH',
			url: `/api/davinci-todos/${id}`,
			requestHeaders: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ...',
			},
			requestBody: {
				completed: !todo.completed,
			},
		});

		try {
			await toggleTodo(id);

			addAPILog({
				method: 'PATCH',
				url: `/api/davinci-todos/${id}`,
				responseStatus: 200,
				responseBody: {
					id,
					completed: !todo.completed,
					updatedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			addAPILog({
				method: 'PATCH',
				url: `/api/davinci-todos/${id}`,
				responseStatus: 500,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	};

	const handleDelete = async (id: string) => {
		addAPILog({
			method: 'DELETE',
			url: `/api/davinci-todos/${id}`,
			requestHeaders: {
				Authorization: 'Bearer ...',
			},
		});

		try {
			await deleteTodoService(id);

			addAPILog({
				method: 'DELETE',
				url: `/api/davinci-todos/${id}`,
				responseStatus: 204,
			});
		} catch (error) {
			addAPILog({
				method: 'DELETE',
				url: `/api/davinci-todos/${id}`,
				responseStatus: 500,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	};

	if (!isAuthenticated) {
		return (
			<Container>
				<BackButton to="/sdk-examples">← Back to SDK Examples</BackButton>
				<Header>DaVinci Todo App</Header>
				<Description>
					Complete todo application demonstrating PingOne DaVinci workflow integration with dynamic
					form rendering and real-time updates.
				</Description>
				<LoadingMessage>
					<FiLoader />
					Initializing authentication...
				</LoadingMessage>
			</Container>
		);
	}

	return (
		<Container>
			<BackButton to="/sdk-examples">← Back to SDK Examples</BackButton>
			<Header>DaVinci Todo App</Header>
			<Description>
				Complete todo application demonstrating PingOne DaVinci workflow integration with dynamic
				form rendering and real-time updates.
			</Description>

			<FixedStatusPanel>
				<StatusPanelHeader>API Activity Log</StatusPanelHeader>
				<StatusPanelContent>
					{apiLogs.length === 0 ? (
						<div style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>
							No API calls yet. Perform an action to see the logs.
						</div>
					) : (
						apiLogs.map((log) => (
							<APILogEntry key={log.id}>
								<APILogTitle>
									{log.method} {log.url}
									{log.responseStatus && (
										<span
											style={{
												color:
													log.responseStatus < 400
														? '#28a745'
														: log.responseStatus < 500
															? '#ffc107'
															: '#dc3545',
												marginLeft: '0.5rem',
											}}
										>
											[{log.responseStatus}]
										</span>
									)}
								</APILogTitle>
								<div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
									{log.timestamp.toLocaleTimeString()}
								</div>
								{log.requestHeaders && (
									<APILogDetails>
										<strong>Request Headers:</strong>
										<APILogCode>{JSON.stringify(log.requestHeaders, null, 2)}</APILogCode>
									</APILogDetails>
								)}
								{log.requestBody && (
									<APILogDetails>
										<strong>Request Body:</strong>
										<APILogCode>{JSON.stringify(log.requestBody, null, 2)}</APILogCode>
									</APILogDetails>
								)}
								{log.responseHeaders && (
									<APILogDetails>
										<strong>Response Headers:</strong>
										<APILogCode>{JSON.stringify(log.responseHeaders, null, 2)}</APILogCode>
									</APILogDetails>
								)}
								{log.responseBody && (
									<APILogDetails>
										<strong>Response Body:</strong>
										<APILogCode>{JSON.stringify(log.responseBody, null, 2)}</APILogCode>
									</APILogDetails>
								)}
								{log.error && (
									<APILogDetails>
										<strong>Error:</strong>
										<APILogCode style={{ color: '#dc3545' }}>{log.error}</APILogCode>
									</APILogDetails>
								)}
							</APILogEntry>
						))
					)}
				</StatusPanelContent>
			</FixedStatusPanel>

			<LogoutButton onClick={clearCurrentUser}>
				<FiLogOut />
				Logout
			</LogoutButton>

			{error && <ErrorMessage>Error: {error}</ErrorMessage>}

			<StatsContainer>
				<StatCard>
					<StatNumber>{todoStats.total}</StatNumber>
					<StatLabel>Total Todos</StatLabel>
				</StatCard>
				<StatCard>
					<StatNumber>{todoStats.completed}</StatNumber>
					<StatLabel>Completed</StatLabel>
				</StatCard>
				<StatCard>
					<StatNumber>{todoStats.pending}</StatNumber>
					<StatLabel>Pending</StatLabel>
				</StatCard>
			</StatsContainer>

			<AddTodoForm onSubmit={handleCreateTodo}>
				<TodoInput
					type="text"
					placeholder="Add a new todo..."
					value={newTodoTitle}
					onChange={(e) => setNewTodoTitle(e.target.value)}
					disabled={isCreating}
				/>
				<Button type="submit" disabled={isCreating || !newTodoTitle.trim()}>
					{isCreating ? <FiLoader /> : <FiPlus />}
					Add Todo
				</Button>
			</AddTodoForm>

			{isLoading ? (
				<LoadingMessage>
					<FiLoader />
					Loading todos...
				</LoadingMessage>
			) : todos.length === 0 ? (
				<EmptyState>No todos yet. Add one above to get started!</EmptyState>
			) : (
				<TodoList>
					{todos.map((todo) => (
						<TodoItem key={todo.id} completed={todo.completed}>
							<TodoCheckbox
								type="checkbox"
								checked={todo.completed}
								onChange={() => handleToggle(todo.id)}
							/>
							<TodoText completed={todo.completed}>{todo.title}</TodoText>
							<TodoActions>
								<ActionButton onClick={() => handleDelete(todo.id)}>
									<FiTrash2 />
								</ActionButton>
							</TodoActions>
						</TodoItem>
					))}
				</TodoList>
			)}
		</Container>
	);
};

const AppWithProvider: React.FC = () => (
	<DavinciTodoProvider>
		<DavinciTodoApp />
	</DavinciTodoProvider>
);

export default AppWithProvider;
