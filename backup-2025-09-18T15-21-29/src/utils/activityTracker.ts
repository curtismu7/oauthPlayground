 
// Activity tracking utility for dashboard
export interface ActivityItem {
  id: string;
  action: string;
  flowType?: string;
  timestamp: number;
  success: boolean;
  details?: string;
}

const ACTIVITY_KEY = 'pingone_playground_recent_activity';
const MAX_ACTIVITIES = 20;

export const trackActivity = (activity: Omit<ActivityItem, 'id' | 'timestamp'>): void => {
  try {
    const existingActivities = getRecentActivity();
    const newActivity: ActivityItem = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    const updatedActivities = [newActivity, ...existingActivities].slice(0, MAX_ACTIVITIES);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updatedActivities));
  } catch (_error) {
    console.error('Failed to track activity:', _error);
  }
};

export const getRecentActivity = (): ActivityItem[] => {
  try {
    const stored = localStorage.getItem(ACTIVITY_KEY);
    if (!stored) return [];
    
    const activities = JSON.parse(stored);
    return Array.isArray(activities) ? activities : [];
  } catch (_error) {
    console.error('Failed to get recent activity:', _error);
    return [];
  }
};

export const clearActivity = (): void => {
  try {
    localStorage.removeItem(ACTIVITY_KEY);
  } catch (_error) {
    console.error('Failed to clear activity:', _error);
  }
};

// Helper functions for common activities
export const trackOAuthFlow = (flowType: string, success: boolean, details?: string): void => {
  trackActivity({
    action: `${success ? 'Completed' : 'Failed'} ${flowType} Flow`,
    flowType,
    success,
    details,
  });
};

export const trackTokenOperation = (operation: string, success: boolean, details?: string): void => {
  trackActivity({
    action: `${success ? 'Successfully' : 'Failed to'} ${operation} Token`,
    success,
    details,
  });
};

export const trackConfigurationChange = (change: string, success: boolean): void => {
  trackActivity({
    action: `${success ? 'Updated' : 'Failed to update'} Configuration: ${change}`,
    success,
  });
};
