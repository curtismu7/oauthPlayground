import React, { useEffect, useMemo, useState } from 'react';
import {
	FiCalendar,
	FiCheckCircle,
	FiClock,
	FiEdit3,
	FiInbox,
	FiPlus,
	FiTrash2,
} from 'react-icons/fi';
import styled from 'styled-components';

const Page = styled.div`
	min-height: 100vh;
	padding: 2.5rem clamp(1rem, 4vw, 3rem);
	background: radial-gradient(circle at top, #eef2ff, #e0e7ff 45%, #f8fafc 100%);
	font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	color: #0f172a;
`;

const AppShell = styled.div`
	max-width: 1180px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`;

const GlassPanel = styled.section`
	background: rgba(255, 255, 255, 0.9);
	border-radius: 1.25rem;
	padding: clamp(1.5rem, 3vw, 2rem);
	box-shadow: 0 25px 50px rgba(15, 23, 42, 0.12);
	border: 1px solid rgba(148, 163, 184, 0.2);
`;

const HeaderRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
	flex-wrap: wrap;
`;

const TitleGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Title = styled.h1`
	font-size: clamp(2rem, 3vw, 2.5rem);
	margin: 0;
	font-weight: 700;
	color: #0f172a;
`;

const Subtitle = styled.p`
	margin: 0;
	color: #475569;
	font-size: 1rem;
`;

const GlowingBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.85rem;
	border-radius: 999px;
	background: linear-gradient(120deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.3));
	color: #1d4ed8;
	font-weight: 600;
	font-size: 0.95rem;
`;

const StatsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 1rem;
`;

const StatCard = styled.div`
	background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(99, 102, 241, 0.12));
	border-radius: 1rem;
	padding: 1.25rem;
	border: 1px solid rgba(59, 130, 246, 0.1);
	backdrop-filter: blur(10px);
`;

const StatLabel = styled.p`
	margin: 0;
	font-size: 0.9rem;
	color: #475569;
`;

const StatValue = styled.p`
	margin: 0.15rem 0 0;
	font-size: 2rem;
	font-weight: 700;
	color: #1d4ed8;
`;

const FiltersRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-top: 1rem;
	align-items: center;
`;

const FilterLabel = styled.span`
	font-size: 0.85rem;
	font-weight: 600;
	letter-spacing: 0.04em;
	color: #64748b;
	text-transform: uppercase;
`;

const FilterChip = styled.button<{ $active?: boolean }>`
	border: none;
	border-radius: 999px;
	padding: 0.45rem 1.1rem;
	font-weight: 600;
	font-size: 0.9rem;
	color: ${(props) => (props.$active ? '#0f172a' : '#475569')};
	background: ${(props) => (props.$active ? '#c7d2fe' : 'rgba(148, 163, 184, 0.2)')};
	cursor: pointer;
	transition: all 0.2s ease;
	backdrop-filter: blur(6px);
	&:hover {
		background: ${(props) => (props.$active ? '#a5b4fc' : 'rgba(148, 163, 184, 0.35)')};
	}
`;

const ContentGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
	gap: 1.5rem;
	flex-wrap: wrap;
	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

const TaskList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const TaskCard = styled.div<{ $status: string }>`
	border-radius: 1rem;
	padding: 1.25rem;
	background: ${(props) =>
		props.$status === 'completed'
			? 'linear-gradient(135deg, #ecfccb, #dcfce7)'
			: 'linear-gradient(135deg, #ffffff, #eef2ff)'};
	border: 1px solid rgba(148, 163, 184, 0.25);
	box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const TaskHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
	flex-wrap: wrap;
`;

const TaskTitle = styled.h3`
	margin: 0;
	font-size: 1.25rem;
	color: #0f172a;
`;

const TaskDescription = styled.p`
	margin: 0;
	color: #475569;
	line-height: 1.6;
`;

const MetaRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	align-items: center;
`;

const MetaChip = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.35rem 0.85rem;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.08);
	font-size: 0.85rem;
	color: #0f172a;
`;

const PriorityPill = styled.span<{ $priority: string }>`
	padding: 0.35rem 0.75rem;
	border-radius: 999px;
	font-weight: 600;
	font-size: 0.8rem;
	color: #0f172a;
	background: ${(props) => {
		if (props.$priority === 'high') return '#fecdd3';
		if (props.$priority === 'medium') return '#fde68a';
		return '#d9f99d';
	}};
`;

const StatusBadge = styled.button<{ $status: string }>`
	padding: 0.45rem 0.9rem;
	border-radius: 999px;
	border: none;
	font-weight: 600;
	font-size: 0.85rem;
	color: ${(props) => (props.$status === 'completed' ? '#065f46' : '#1e3a8a')};
	background: ${(props) =>
		props.$status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.25)'};
	cursor: pointer;
	transition: transform 0.15s ease;
	&:hover {
		transform: translateY(-1px);
	}
`;

const TaskActions = styled.div`
	display: flex;
	gap: 0.5rem;
`;

const IconButton = styled.button`
	width: 40px;
	height: 40px;
	border-radius: 12px;
	border: 1px solid rgba(148, 163, 184, 0.4);
	background: white;
	color: #0f172a;
	font-size: 1rem;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
	&:hover {
		box-shadow: 0 15px 35px rgba(15, 23, 42, 0.15);
		transform: translateY(-2px);
	}
`;

const SidePanel = styled(GlassPanel)`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`;

const PanelTitle = styled.h2`
	margin: 0;
	font-size: 1.35rem;
	color: #0f172a;
`;

const PanelDescription = styled.p`
	margin: 0;
	color: #475569;
	line-height: 1.5;
`;

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const Input = styled.input`
	border: 1px solid rgba(148, 163, 184, 0.4);
	border-radius: 0.85rem;
	padding: 0.75rem 1rem;
	font-size: 0.95rem;
	background: rgba(255, 255, 255, 0.9);
	&:focus {
		outline: none;
		border-color: #818cf8;
		box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.25);
	}
`;

const TextArea = styled.textarea`
	border: 1px solid rgba(148, 163, 184, 0.4);
	border-radius: 1rem;
	padding: 0.75rem 1rem;
	font-size: 0.95rem;
	background: rgba(255, 255, 255, 0.9);
	min-height: 120px;
	resize: none;
	&:focus {
		outline: none;
		border-color: #818cf8;
		box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.25);
	}
`;

const SelectRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 0.75rem;
`;

const Select = styled.select`
	border: 1px solid rgba(148, 163, 184, 0.4);
	border-radius: 0.85rem;
	padding: 0.65rem 0.9rem;
	font-size: 0.95rem;
	background: rgba(255, 255, 255, 0.95);
	appearance: none;
	&:focus {
		outline: none;
		border-color: #818cf8;
		box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.25);
	}
`;

const SubmitButton = styled.button`
	border: none;
	border-radius: 1rem;
	padding: 0.9rem 1.25rem;
	font-size: 1rem;
	font-weight: 600;
	background: linear-gradient(135deg, #6366f1, #8b5cf6);
	color: white;
	box-shadow: 0 20px 35px rgba(99, 102, 241, 0.35);
	cursor: pointer;
	transition: transform 0.2s ease;
	&:hover {
		transform: translateY(-2px);
	}
`;

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	padding: 3rem 1rem;
	color: #94a3b8;
	background: rgba(248, 250, 252, 0.85);
	border-radius: 1rem;
	border: 1px dashed rgba(148, 163, 184, 0.5);
`;

type TaskPriority = 'low' | 'medium' | 'high';
type TaskStatus = 'backlog' | 'in-progress' | 'completed';

type Task = {
	id: string;
	title: string;
	description: string;
	priority: TaskPriority;
	dueDate: string;
	estimate: string;
	status: TaskStatus;
};

const STORAGE_KEY = 'task-list-app.v1';

const TaskListApp: React.FC = () => {
	const seedTasks = useMemo<Task[]>(
		() => [
			{
				id: '1',
				title: 'Finalize onboarding flow screens',
				description:
					'Polish copy, add micro-interactions, and ensure accessibility for keyboard-only navigation.',
				priority: 'high',
				dueDate: '2025-12-08',
				estimate: '6h',
				status: 'in-progress',
			},
			{
				id: '2',
				title: 'Prep product roadmap workshop',
				description: 'Gather research insights, craft workshop agenda, and prep exercises.',
				priority: 'medium',
				dueDate: '2025-12-05',
				estimate: '3h',
				status: 'backlog',
			},
			{
				id: '3',
				title: 'QA pass for payments revamp',
				description: 'Validate regression suite, confirm analytics, and document release notes.',
				priority: 'low',
				dueDate: '2025-12-02',
				estimate: '4h',
				status: 'completed',
			},
		],
		[]
	);

	const [tasks, setTasks] = useState<Task[]>(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? (JSON.parse(stored) as Task[]) : seedTasks;
	});
	const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
	const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
	const [newTask, setNewTask] = useState({
		title: '',
		description: '',
		priority: 'medium' as TaskPriority,
		dueDate: '',
		estimate: '',
	});

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
	}, [tasks]);

	const filteredTasks = useMemo(() => {
		return tasks.filter((task) => {
			const statusMatch = statusFilter === 'all' || task.status === statusFilter;
			const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
			return statusMatch && priorityMatch;
		});
	}, [tasks, statusFilter, priorityFilter]);

	const stats = useMemo(
		() => ({
			planned: tasks.length,
			inProgress: tasks.filter((task) => task.status === 'in-progress').length,
			completed: tasks.filter((task) => task.status === 'completed').length,
			focus: tasks.filter((task) => task.priority === 'high').length,
		}),
		[tasks]
	);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!newTask.title.trim()) {
			return;
		}
		const task: Task = {
			id: crypto.randomUUID(),
			title: newTask.title.trim(),
			description: newTask.description.trim() || 'No additional context provided.',
			priority: newTask.priority,
			dueDate: newTask.dueDate || new Date().toISOString().slice(0, 10),
			estimate: newTask.estimate || '1h',
			status: 'backlog',
		};
		setTasks((prev) => [task, ...prev]);
		setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', estimate: '' });
	};

	const toggleTaskStatus = (id: string) => {
		setTasks((prev) =>
			prev.map((task) => {
				if (task.id !== id) return task;
				const nextStatus: TaskStatus =
					task.status === 'completed' ? 'in-progress' : task.status === 'in-progress' ? 'completed' : 'in-progress';
				return { ...task, status: nextStatus };
			})
		);
	};

	const deleteTask = (id: string) => {
		setTasks((prev) => prev.filter((task) => task.id !== id));
	};

	return (
		<Page>
			<AppShell>
				<GlassPanel>
					<HeaderRow>
						<TitleGroup>
							<GlowingBadge>
								<FiInbox /> Productivity Hub
							</GlowingBadge>
							<Title>Task List</Title>
							<Subtitle>Plan, prioritize, and celebrate your progress.</Subtitle>
						</TitleGroup>
						<FiltersRow>
							<FilterLabel>Status</FilterLabel>
							{(['all', 'backlog', 'in-progress', 'completed'] as const).map((filterKey) => (
								<FilterChip
									key={filterKey}
									$active={statusFilter === filterKey}
									onClick={() => setStatusFilter(filterKey)}
								>
									{filterKey === 'all'
										? 'All Work'
										: filterKey
											.replace('-', ' ')
											.replace(/\b\w/g, (char) => char.toUpperCase())}
								</FilterChip>
							))}
						</FiltersRow>
						<FiltersRow>
							<FilterLabel>Priority</FilterLabel>
							{(['all', 'high', 'medium', 'low'] as const).map((priorityKey) => (
								<FilterChip
									key={priorityKey}
									$active={priorityFilter === priorityKey}
									onClick={() => setPriorityFilter(priorityKey)}
								>
									{priorityKey === 'all'
										? 'All Levels'
										: `${priorityKey.charAt(0).toUpperCase()}${priorityKey.slice(1)}`}
								</FilterChip>
							))}
						</FiltersRow>
					</HeaderRow>

					<StatsGrid>
						<StatCard>
							<StatLabel>Total Planned</StatLabel>
							<StatValue>{stats.planned}</StatValue>
						</StatCard>
						<StatCard>
							<StatLabel>In Progress</StatLabel>
							<StatValue>{stats.inProgress}</StatValue>
						</StatCard>
						<StatCard>
							<StatLabel>Completed</StatLabel>
							<StatValue>{stats.completed}</StatValue>
						</StatCard>
						<StatCard>
							<StatLabel>High Focus</StatLabel>
							<StatValue>{stats.focus}</StatValue>
						</StatCard>
					</StatsGrid>
				</GlassPanel>

				<ContentGrid>
					<GlassPanel>
						<TaskList>
							{filteredTasks.length === 0 && (
								<EmptyState>
									<FiCalendar size={36} />
									<strong>No tasks found</strong>
									<span>Try changing the filters or add something new.</span>
								</EmptyState>
							)}

							{filteredTasks.map((task) => (
								<TaskCard key={task.id} $status={task.status}>
									<TaskHeader>
										<div>
											<TaskTitle>{task.title}</TaskTitle>
											<TaskDescription>{task.description}</TaskDescription>
										</div>
										<TaskActions>
											<IconButton onClick={() => toggleTaskStatus(task.id)} title="Toggle status">
												{task.status === 'completed' ? <FiEdit3 /> : <FiCheckCircle />}
											</IconButton>
											<IconButton onClick={() => deleteTask(task.id)} title="Delete task">
												<FiTrash2 />
											</IconButton>
										</TaskActions>
									</TaskHeader>
									<MetaRow>
										<PriorityPill $priority={task.priority}>
											{task.priority.toUpperCase()} priority
										</PriorityPill>
										<MetaChip>
											<FiCalendar /> {new Date(task.dueDate).toLocaleDateString()}
										</MetaChip>
										<MetaChip>
											<FiClock /> {task.estimate}
										</MetaChip>
										<StatusBadge $status={task.status} onClick={() => toggleTaskStatus(task.id)}>
											{task.status.replace('-', ' ')}
										</StatusBadge>
									</MetaRow>
								</TaskCard>
							))}
						</TaskList>
					</GlassPanel>

					<SidePanel>
						<div>
							<PanelTitle>Quick Add</PanelTitle>
							<PanelDescription>
								Capture momentum by adding tasks while ideas are still fresh.
							</PanelDescription>
						</div>
						<Form onSubmit={handleSubmit}>
							<Input
								type="text"
								placeholder="Task title"
								value={newTask.title}
								onChange={(event) => setNewTask((prev) => ({ ...prev, title: event.target.value }))}
							/>
							<TextArea
								placeholder="Add context, links, or next steps"
								value={newTask.description}
								onChange={(event) => setNewTask((prev) => ({ ...prev, description: event.target.value }))}
							/>
							<SelectRow>
								<Select
									value={newTask.priority}
									onChange={(event) => setNewTask((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
								>
									<option value="high">High priority</option>
									<option value="medium">Medium priority</option>
									<option value="low">Low priority</option>
								</Select>
								<Input
									type="date"
									value={newTask.dueDate}
									onChange={(event) => setNewTask((prev) => ({ ...prev, dueDate: event.target.value }))}
								/>
								<Input
									type="text"
									placeholder="Estimate"
									value={newTask.estimate}
									onChange={(event) => setNewTask((prev) => ({ ...prev, estimate: event.target.value }))}
								/>
							</SelectRow>
							<SubmitButton type="submit">
								<FiPlus /> Add Task
							</SubmitButton>
						</Form>
					</SidePanel>
				</ContentGrid>
			</AppShell>
		</Page>
	);
};

export default TaskListApp;
