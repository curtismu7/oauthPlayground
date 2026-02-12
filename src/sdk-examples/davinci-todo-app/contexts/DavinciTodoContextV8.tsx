// src/sdk-examples/davinci-todo-app/contexts/DavinciTodoContextV8.tsx
// React Context for DaVinci Todo App state management - SWE-15 compliant

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import DavinciTodoServiceV8, { Todo, DavinciFlow, DavinciCollector } from '../services/davinciTodoServiceV8';

// Action types
type DavinciTodoAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: { id: string; email: string; name: string } | null }
  | { type: 'SET_FLOW'; payload: DavinciFlow | null }
  | { type: 'SET_TODOS'; payload: Todo[] }
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'UPDATE_TODO'; payload: { id: string; updates: Partial<Todo> } }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: string }
  | { type: 'RESET_STATE' };

// Initial state
const initialState = {
  user: null,
  flow: null,
  todos: [],
  isLoading: false,
  error: null,
};

// Reducer function
function davinciTodoReducer(state: typeof initialState, action: DavinciTodoAction): typeof initialState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'SET_FLOW':
      return {
        ...state,
        flow: action.payload,
      };

    case 'SET_TODOS':
      return {
        ...state,
        todos: action.payload,
        isLoading: false,
      };

    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, action.payload],
      };

    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.id
            ? { ...todo, ...action.payload.updates }
            : todo
        ),
      };

    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
      };

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() }
            : todo
        ),
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context interface
interface DavinciTodoContextType {
  // State
  user: { id: string; email: string; name: string } | null;
  flow: DavinciFlow | null;
  todos: Todo[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: { id: string; email: string; name: string } | null) => void;
  setFlow: (flow: DavinciFlow | null) => void;
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  resetState: () => void;

  // Service methods
  initializeClient: () => Promise<{ success: boolean; error?: string }>;
  getFlows: () => Promise<DavinciFlow[]>;
  startFlow: (flowId: string) => Promise<{ sessionId: string; firstCollector: DavinciCollector | null }>;
  submitCollector: (sessionId: string, collectorName: string, data: Record<string, unknown>) => Promise<{
    nextCollector: DavinciCollector | null;
    completed: boolean;
    result: unknown;
  }>;
  loadTodos: (sessionId?: string) => Promise<void>;
  createTodo: (title: string, description?: string) => Promise<Todo>;
  updateTodoService: (todoId: string, updates: Partial<Todo>) => Promise<Todo>;
  deleteTodoService: (todoId: string) => Promise<void>;
  getCurrentUser: () => { id: string; email: string; name: string } | null;
  setCurrentUser: (user: { id: string; email: string; name: string }) => void;
  clearCurrentUser: () => void;
  validateCollectorData: (collector: DavinciCollector, data: Record<string, unknown>) => { isValid: boolean; errors: string[] };
  getClientStatus: () => { initialized: boolean; error: string | null };
  getConfiguration: () => {
    serverUrl: string;
    realm: string;
    clientId: string;
    redirectUri: string;
    scope: string;
  };
  cleanup: () => void;

  // Computed properties
  isAuthenticated: boolean;
  todoStats: {
    total: number;
    completed: number;
    pending: number;
  };
}

// Create context
const DavinciTodoContextValue = createContext<DavinciTodoContextType | undefined>(undefined);

// Provider component
interface DavinciTodoProviderProps {
  children: ReactNode;
}

export function DavinciTodoProvider({ children }: DavinciTodoProviderProps) {
  const [state, dispatch] = useReducer(davinciTodoReducer, initialState);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = DavinciTodoServiceV8.getCurrentUser();
    if (storedUser) {
      dispatch({ type: 'SET_USER', payload: storedUser });
    }
  }, []);

  // Action creators
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setUser = (user: { id: string; email: string; name: string } | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const setFlow = (flow: DavinciFlow | null) => {
    dispatch({ type: 'SET_FLOW', payload: flow });
  };

  const setTodos = (todos: Todo[]) => {
    dispatch({ type: 'SET_TODOS', payload: todos });
  };

  const addTodo = (todo: Todo) => {
    dispatch({ type: 'ADD_TODO', payload: todo });
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    dispatch({ type: 'UPDATE_TODO', payload: { id, updates } });
  };

  const deleteTodo = (id: string) => {
    dispatch({ type: 'DELETE_TODO', payload: id });
  };

  const toggleTodo = (id: string) => {
    dispatch({ type: 'TOGGLE_TODO', payload: id });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  // Service methods
  const initializeClient = async () => {
    setLoading(true);
    try {
      const result = await DavinciTodoServiceV8.initializeClient();
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getFlows = async () => {
    setLoading(true);
    try {
      const flows = await DavinciTodoServiceV8.getFlows();
      return flows;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const startFlow = async (flowId: string) => {
    setLoading(true);
    try {
      const result = await DavinciTodoServiceV8.startFlow(flowId);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const submitCollector = async (sessionId: string, collectorName: string, data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const result = await DavinciTodoServiceV8.submitCollector(sessionId, collectorName, data);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadTodos = async (sessionId?: string) => {
    setLoading(true);
    try {
      const todos = await DavinciTodoServiceV8.getTodos(sessionId);
      setTodos(todos);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (title: string, description?: string) => {
    setLoading(true);
    try {
      const newTodo = await DavinciTodoServiceV8.createTodo(title, description);
      addTodo(newTodo);
      return newTodo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTodoService = async (todoId: string, updates: Partial<Todo>) => {
    setLoading(true);
    try {
      const updatedTodo = await DavinciTodoServiceV8.updateTodo(todoId, updates);
      updateTodo(todoId, updates);
      return updatedTodo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTodoService = async (todoId: string) => {
    setLoading(true);
    try {
      await DavinciTodoServiceV8.deleteTodo(todoId);
      deleteTodo(todoId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = () => {
    return DavinciTodoServiceV8.getCurrentUser();
  };

  const setCurrentUser = (user: { id: string; email: string; name: string }) => {
    DavinciTodoServiceV8.setCurrentUser(user);
    setUser(user);
  };

  const clearCurrentUser = () => {
    DavinciTodoServiceV8.clearCurrentUser();
    setUser(null);
  };

  const validateCollectorData = (collector: DavinciCollector, data: Record<string, unknown>) => {
    return DavinciTodoServiceV8.validateCollectorData(collector, data);
  };

  const getClientStatus = () => {
    return DavinciTodoServiceV8.getClientStatus();
  };

  const getConfiguration = () => {
    return DavinciTodoServiceV8.getConfiguration();
  };

  const cleanup = () => {
    DavinciTodoServiceV8.cleanup();
    resetState();
  };

  // Computed properties
  const isAuthenticated = Boolean(state.user);

  const todoStats = {
    total: state.todos.length,
    completed: state.todos.filter(todo => todo.completed).length,
    pending: state.todos.filter(todo => !todo.completed).length,
  };

  // Context value
  const contextValue: DavinciTodoContextType = {
    ...state,
    setLoading,
    setError,
    setUser,
    setFlow,
    setTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    resetState,
    initializeClient,
    getFlows,
    startFlow,
    submitCollector,
    loadTodos,
    createTodo,
    updateTodoService,
    deleteTodoService,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    validateCollectorData,
    getClientStatus,
    getConfiguration,
    cleanup,
    isAuthenticated,
    todoStats,
  };

  return (
    <DavinciTodoContextValue.Provider value={contextValue}>
      {children}
    </DavinciTodoContextValue.Provider>
  );
}

// Hook to use the context
export function useDavinciTodo() {
  const context = useContext(DavinciTodoContextValue);
  if (context === undefined) {
    throw new Error('useDavinciTodo must be used within a DavinciTodoProvider');
  }
  return context;
}

export default DavinciTodoContextValue;
