// src/sdk-examples/davinci-todo-app/DavinciTodoApp.tsx
// Main DaVinci Todo App component

import React, { useEffect, useState } from 'react';
import { FiLoader, FiLogOut, FiPlus, FiSettings, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { DavinciTodoProvider, useDavinciTodo } from './contexts/DavinciTodoContext';
import DavinciTodoService from './services/davinciTodoService';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
`;

const Title = styled.h1`
  color: #333;
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #666;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 1rem;
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

const TodoContent = styled.div<{ completed: boolean }>`
  flex: 1;
  
  ${(props) =>
		props.completed &&
		`
    text-decoration: line-through;
    color: #666;
  `}
`;

const TodoTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const TodoDescription = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const TodoActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  background: none;
  border: 1px solid #ddd;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #f8f9fa;
    border-color: #007bff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${(props) => {
		switch (props.variant) {
			case 'primary':
				return '#007bff';
			case 'secondary':
				return '#6c757d';
			case 'danger':
				return '#dc3545';
			default:
				return '#007bff';
		}
	}};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${(props) => {
			switch (props.variant) {
				case 'primary':
					return '#0056b3';
				case 'secondary':
					return '#545b62';
				case 'danger':
					return '#c82333';
				default:
					return '#0056b3';
			}
		}};
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const AddTodoForm = styled.form`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
`;

const TodoInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #6c757d;
  color: #ffffff !important;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 2rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: #545b62;
    color: #ffffff !important;
  }
`;

// Main App Component
function DavinciTodoAppComponent() {
	const {
		user,
		todos,
		isLoading,
		error,
		isAuthenticated,
		todoStats,
		loadTodos,
		createTodo,
		updateTodoService,
		deleteTodoService,
		toggleTodo,
		clearCurrentUser,
		initializeClient,
		getClientStatus,
		getConfiguration,
	} = useDavinciTodo();

	const [newTodoTitle, setNewTodoTitle] = useState('');
	const [isCreating, setIsCreating] = useState(false);

	useEffect(() => {
		if (isAuthenticated) {
			loadTodos();
		}
	}, [isAuthenticated, loadTodos]);

	const handleCreateTodo = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTodoTitle.trim()) return;

		setIsCreating(true);
		try {
			await createTodo(newTodoTitle.trim());
			setNewTodoTitle('');
		} catch (error) {
			console.error('Failed to create todo:', error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleToggleTodo = async (id: string) => {
		try {
			toggleTodo(id);
			const todo = todos.find((t) => t.id === id);
			if (todo) {
				await updateTodoService(id, { completed: !todo.completed });
			}
		} catch (error) {
			console.error('Failed to toggle todo:', error);
		}
	};

	const handleDeleteTodo = async (id: string) => {
		try {
			await deleteTodoService(id);
		} catch (error) {
			console.error('Failed to delete todo:', error);
		}
	};

	const handleLogout = () => {
		clearCurrentUser();
	};

	const handleInitialize = async () => {
		try {
			await initializeClient();
			console.log('DaVinci client initialized successfully');
			console.log('Configuration:', getConfiguration());
		} catch (error) {
			console.error('Failed to initialize client:', error);
		}
	};

	if (!isAuthenticated) {
		return (
			<Container>
				<Header>
					<Title>DaVinci Todo App</Title>
					<Button onClick={handleInitialize} disabled={isLoading}>
						{isLoading ? <FiLoader /> : <FiSettings />}
						Initialize
					</Button>
				</Header>

				<div style={{ textAlign: 'center', padding: '3rem' }}>
					<h2>Welcome to DaVinci Todo App</h2>
					<p style={{ color: '#666', marginBottom: '2rem' }}>
						This is a demonstration of the PingOne DaVinci SDK integration. In a real
						implementation, this would authenticate you through a DaVinci flow.
					</p>
					<Button
						variant="primary"
						onClick={() => {
							// Production authentication through DaVinci flow
							DavinciTodoService.initializeClient().then((result) => {
								if (result.success) {
									// Authentication successful, user will be redirected to DaVinci flow
									window.location.href = '/davinci-todo/auth';
								} else {
									console.error('Authentication failed:', result.error);
								}
							});
							window.location.reload();
						}}
					>
						Sign In (Demo)
					</Button>
				</div>
			</Container>
		);
	}

	return (
		<Container>
			<BackButton to="/sdk-examples">← Back to SDK Examples</BackButton>
			<Header>
				<Title>DaVinci Todo App</Title>
				<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
					<UserInfo>Welcome, {user?.name}!</UserInfo>
					<Button variant="secondary" onClick={handleLogout}>
						<FiLogOut />
						Logout
					</Button>
				</div>
			</Header>

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
				<EmptyState>
					<EmptyStateIcon>📝</EmptyStateIcon>
					<h3>No todos yet</h3>
					<p>Add your first todo to get started!</p>
				</EmptyState>
			) : (
				<TodoList>
					{todos.map((todo) => (
						<TodoItem key={todo.id} completed={todo.completed}>
							<TodoCheckbox
								type="checkbox"
								checked={todo.completed}
								onChange={() => handleToggleTodo(todo.id)}
							/>
							<TodoContent completed={todo.completed}>
								<TodoTitle>{todo.title}</TodoTitle>
								{todo.description && <TodoDescription>{todo.description}</TodoDescription>}
							</TodoContent>
							<TodoActions>
								<IconButton onClick={() => handleDeleteTodo(todo.id)} title="Delete todo">
									<FiTrash2 />
								</IconButton>
							</TodoActions>
						</TodoItem>
					))}
				</TodoList>
			)}
		</Container>
	);
}

// Wrapper with Provider
export default function DavinciTodoApp() {
	return (
		<DavinciTodoProvider>
			<DavinciTodoAppComponent />
		</DavinciTodoProvider>
	);
}
