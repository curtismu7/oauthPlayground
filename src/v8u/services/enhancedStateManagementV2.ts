import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// Types
export interface FlowState {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastModified: Date;
  metadata: Record<string, unknown>;
}

export interface UnifiedFlowState {
  flows: Record<string, FlowState>;
  selectedFlow: string | null;
  history: {
    past: FlowState[][];
    present: FlowState[];
    future: FlowState[][];
  };
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export type UnifiedFlowAction =
  | { type: 'ADD_FLOW'; payload: FlowState }
  | { type: 'UPDATE_FLOW'; payload: { id: string; updates: Partial<FlowState> } }
  | { type: 'DELETE_FLOW'; payload: string }
  | { type: 'SELECT_FLOW'; payload: string | null }
  | { type: 'SET_UI_STATE'; payload: Partial<UnifiedFlowState['ui']> }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_STATE'; payload: Partial<UnifiedFlowState> };

// Initial state
const initialState: UnifiedFlowState = {
  flows: {},
  selectedFlow: null,
  history: {
    past: [],
    present: [],
    future: [],
  },
  ui: {
    sidebarOpen: true,
    theme: 'light',
    notifications: true,
  },
};

// Reducer
function unifiedFlowReducer(state: UnifiedFlowState, action: UnifiedFlowAction): UnifiedFlowState {
  switch (action.type) {
    case 'ADD_FLOW': {
      const newFlows = { ...state.flows, [action.payload.id]: action.payload };
      return {
        ...state,
        flows: newFlows,
        history: {
          ...state.history,
          past: [...state.history.past, Object.values(state.flows)],
          present: Object.values(newFlows),
          future: [],
        },
      };
    }
    case 'UPDATE_FLOW': {
      const { id, updates } = action.payload;
      if (!state.flows[id]) return state;
      
      const updatedFlow = { ...state.flows[id], ...updates, lastModified: new Date() };
      const newFlows = { ...state.flows, [id]: updatedFlow };
      
      return {
        ...state,
        flows: newFlows,
        history: {
          ...state.history,
          past: [...state.history.past, Object.values(state.flows)],
          present: Object.values(newFlows),
          future: [],
        },
      };
    }
    case 'DELETE_FLOW': {
      const { [action.payload]: deleted, ...newFlows } = state.flows;
      return {
        ...state,
        flows: newFlows,
        selectedFlow: state.selectedFlow === action.payload ? null : state.selectedFlow,
        history: {
          ...state.history,
          past: [...state.history.past, Object.values(state.flows)],
          present: Object.values(newFlows),
          future: [],
        },
      };
    }
    case 'SELECT_FLOW':
      return {
        ...state,
        selectedFlow: action.payload,
      };
    case 'SET_UI_STATE':
      return {
        ...state,
        ui: { ...state.ui, ...action.payload },
      };
    case 'UNDO':
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, state.history.past.length - 1);
      
      const pastFlows = previous.reduce((acc: Record<string, FlowState>, flow: FlowState) => {
        acc[flow.id] = flow;
        return acc;
      }, {});
      
      return {
        ...state,
        flows: pastFlows,
        history: {
          past: newPast,
          present: previous,
          future: [state.history.present, ...state.history.future],
        },
      };
    case 'REDO':
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      
      const nextFlows = next.reduce((acc: Record<string, FlowState>, flow: FlowState) => {
        acc[flow.id] = flow;
        return acc;
      }, {});
      
      return {
        ...state,
        flows: nextFlows,
        history: {
          past: [...state.history.past, state.history.present],
          present: next,
          future: newFuture,
        },
      };
    case 'LOAD_STATE':
      return {
        ...initialState,
        ...action.payload,
        history: {
          past: [],
          present: Object.values(action.payload?.flows || {}),
          future: [],
        },
      };
    default:
      return state;
  }
}

// Context
const UnifiedFlowContext = createContext<{
  state: UnifiedFlowState;
  dispatch: React.Dispatch<UnifiedFlowAction>;
} | null>(null);

// Provider
export const UnifiedFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(unifiedFlowReducer, initialState);

  const contextValue = { state, dispatch };

  return React.createElement(
    UnifiedFlowContext.Provider,
    { value: contextValue },
    children
  );
};

// Hook
export const useUnifiedFlowState = () => {
  const context = useContext(UnifiedFlowContext);
  if (!context) {
    throw new Error('useUnifiedFlowState must be used within a UnifiedFlowProvider');
  }
  return context;
};

// Utilities
export const stateUtils = {
  // Flow operations
  createFlow: (name: string, metadata: Record<string, unknown> = {}): FlowState => ({
    id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    status: 'inactive',
    lastModified: new Date(),
    metadata,
  }),

  // Export/Import
  exportState: (state: UnifiedFlowState): string => {
    return JSON.stringify({
      flows: state.flows,
      selectedFlow: state.selectedFlow,
      ui: state.ui,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },

  importState: (jsonString: string): Partial<UnifiedFlowState> => {
    try {
      const parsed = JSON.parse(jsonString);
      return {
        flows: parsed.flows || {},
        selectedFlow: parsed.selectedFlow || null,
        ui: { ...initialState.ui, ...parsed.ui },
      };
    } catch (error) {
      console.error('Failed to import state:', error);
      return {};
    }
  },

  // Validation
  validateFlowState: (flow: FlowState): boolean => {
    return !!(flow.id && flow.name && ['active', 'inactive', 'error'].includes(flow.status));
  },

  // Search/Filter
  searchFlows: (flows: Record<string, FlowState>, query: string): FlowState[] => {
    const lowercaseQuery = query.toLowerCase();
    return Object.values(flows).filter(flow =>
      flow.name.toLowerCase().includes(lowercaseQuery) ||
      flow.id.toLowerCase().includes(lowercaseQuery)
    );
  },

  filterFlowsByStatus: (flows: Record<string, FlowState>, status: FlowState['status']): FlowState[] => {
    return Object.values(flows).filter(flow => flow.status === status);
  },

  // Analytics
  getFlowStats: (flows: Record<string, FlowState>) => {
    const allFlows = Object.values(flows);
    return {
      total: allFlows.length,
      active: allFlows.filter(f => f.status === 'active').length,
      inactive: allFlows.filter(f => f.status === 'inactive').length,
      error: allFlows.filter(f => f.status === 'error').length,
    };
  },

  // Time utilities
  getRecentlyModified: (flows: Record<string, FlowState>, hours: number = 24): FlowState[] => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Object.values(flows).filter(flow => flow.lastModified > cutoff);
  },
};

// Export initial state
export { initialState };
