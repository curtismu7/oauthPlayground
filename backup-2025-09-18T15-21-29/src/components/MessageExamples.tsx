 
import React from 'react';
import StandardMessage from './StandardMessage';

/**
 * Example component demonstrating the standardized message system
 * This shows the proper color scheme:
 * - Green for success messages
 * - Red for error messages  
 * - Yellow for warning/caution messages
 * - Blue for info messages
 */
export const MessageExamples: React.FC = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Standardized Message System</h2>
      <p>This demonstrates the consistent color scheme for all messages across the application.</p>
      
      <StandardMessage
        type="success"
        title="Success!"
        message="Your configuration has been saved successfully."
      />
      
      <StandardMessage
        type="error"
        title="Error"
        message="Failed to save configuration. Please check your input and try again."
      />
      
      <StandardMessage
        type="warning"
        title="Warning"
        message="This action will overwrite your current settings. Are you sure you want to continue?"
      />
      
      <StandardMessage
        type="info"
        title="Information"
        message="This feature requires additional setup. Please configure your environment first."
      />
      
      <StandardMessage
        type="success"
        message="Simple success message without title."
      />
      
      <StandardMessage
        type="error"
        message="Simple error message without title."
      />
    </div>
  );
};

export default MessageExamples;
