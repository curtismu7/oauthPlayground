# UserSearchDropdownV8 - Quick Reference Guide

## 🚀 Quick Start

### Basic Usage
```tsx
import { UserSearchDropdownV8 } from '../../../v8/components/UserSearchDropdownV8';

<UserSearchDropdownV8
  environmentId={environmentId}
  value={username}
  onChange={setUsername}
  placeholder="Search for username..."
  onGetToken={() => handleTokenRequirement()}
/>
```

## 📋 Props Reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `environmentId` | `string` | ✅ Yes | - | PingOne environment ID for user search |
| `value` | `string` | ✅ Yes | - | Current selected username |
| `onChange` | `(username: string) => void` | ✅ Yes | - | Callback when username is selected |
| `placeholder` | `string` | ❌ No | `"Search for a user..."` | Input placeholder text |
| `disabled` | `boolean` | ❌ No | `false` | Disable the dropdown |
| `id` | `string` | ❌ No | - | HTML id attribute |
| `autoLoad` | `boolean` | ❌ No | `true` | Auto-load users on mount |
| `onGetToken` | `() => void` | ❌ No | - | Callback when worker token is needed |

## 🔧 Environment ID Integration

### Method 1: From Props
```tsx
interface ComponentProps {
  environmentId: string;
}

const MyComponent = ({ environmentId }) => {
  return (
    <UserSearchDropdownV8
      environmentId={environmentId}
      // ... other props
    />
  );
};
```

### Method 2: From Service
```tsx
import { EnvironmentIdServiceV8 } from '../../../v8/services/environmentIdServiceV8';

const MyComponent = () => {
  const [environmentId, setEnvironmentId] = useState('');

  useEffect(() => {
    const envId = EnvironmentIdServiceV8.getEnvironmentId();
    setEnvironmentId(envId || '');
  }, []);

  return (
    <UserSearchDropdownV8
      environmentId={environmentId}
      // ... other props
    />
  );
};
```

### Method 3: From Controller
```tsx
const MyComponent = ({ controller }) => {
  return (
    <UserSearchDropdownV8
      environmentId={controller.credentials.environmentId}
      // ... other props
    />
  );
};
```

## 🎨 Common Patterns

### Login Form Pattern
```tsx
const LoginForm = ({ environmentId }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState(null);

  return (
    <form>
      <UserSearchDropdownV8
        environmentId={environmentId}
        value={formData.username}
        onChange={(username) => {
          setFormData(prev => ({ ...prev, username }));
          if (error) setError(null); // Clear error on selection
        }}
        placeholder="Search for username..."
        onGetToken={() => {
          setError('Worker token required. Please configure worker token to search users.');
        }}
      />
      
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        placeholder="Password"
      />
    </form>
  );
};
```

### User Management Pattern
```tsx
const UserManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [environmentId, setEnvironmentId] = useState('');

  useEffect(() => {
    const envId = EnvironmentIdServiceV8.getEnvironmentId();
    setEnvironmentId(envId || '');
  }, []);

  return (
    <div>
      <h2>User Management</h2>
      <UserSearchDropdownV8
        environmentId={environmentId}
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search by username or email..."
        onGetToken={() => {
          console.log('Worker token required for user search');
        }}
      />
      
      {/* User list display */}
    </div>
  );
};
```

### Password Reset Pattern
```tsx
const PasswordResetForm = ({ environmentId }) => {
  const [identifier, setIdentifier] = useState('');
  const [user, setUser] = useState(null);

  return (
    <div>
      <UserSearchDropdownV8
        environmentId={environmentId}
        value={identifier}
        onChange={(username) => {
          setIdentifier(username);
          // Auto-lookup user when selected
          if (username) {
            lookupUser(username);
          }
        }}
        placeholder="Search for user to reset password..."
        onGetToken={() => {
          console.log('Worker token required for user search in password reset');
        }}
      />
      
      {user && (
        <div>
          <p>Selected: {user.username}</p>
          <button>Reset Password</button>
        </div>
      )}
    </div>
  );
};
```

## 🚨 Error Handling

### Worker Token Required
```tsx
<UserSearchDropdownV8
  environmentId={environmentId}
  // ... other props
  onGetToken={() => {
    // Option 1: Show inline error
    setError('Worker token required. Please configure worker token to search users.');
    
    // Option 2: Show toast notification
    toast.error('Worker token required for user search');
    
    // Option 3: Open worker token modal
    openWorkerTokenModal();
    
    // Option 4: Console logging (development)
    console.log('Worker token required for user search in [ComponentName]');
  }}
/>
```

### Environment ID Missing
```tsx
<UserSearchDropdownV8
  environmentId={environmentId || 'default-env'}
  // ... other props
/>
```

## 🧪 Testing Examples

### Basic Component Test
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserSearchDropdownV8 } from '../../../v8/components/UserSearchDropdownV8';

describe('UserSearchDropdownV8', () => {
  test('renders with placeholder', () => {
    render(
      <UserSearchDropdownV8
        environmentId="test-env"
        value=""
        onChange={jest.fn()}
        onGetToken={jest.fn()}
      />
    );
    
    expect(screen.getByPlaceholderText('Search for a user...')).toBeInTheDocument();
  });

  test('calls onChange when user is selected', () => {
    const mockOnChange = jest.fn();
    render(
      <UserSearchDropdownV8
        environmentId="test-env"
        value=""
        onChange={mockOnChange}
        onGetToken={jest.fn()}
      />
    );
    
    // Simulate user selection
    const dropdown = screen.getByRole('combobox');
    fireEvent.click(dropdown);
    
    // Select a user (implementation depends on your dropdown library)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'testuser' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    
    expect(mockOnChange).toHaveBeenCalledWith('testuser');
  });
});
```

### Integration Test with Environment ID
```tsx
test('integrates with environment service', async () => {
  jest.mock('../../../v8/services/environmentIdServiceV8');
  const { getEnvironmentId } = require('../../../v8/services/environmentIdServiceV8');
  getEnvironmentId.mockReturnValue('test-env-id');

  const TestComponent = () => {
    const [envId, setEnvId] = useState('');
    
    useEffect(() => {
      const id = EnvironmentIdServiceV8.getEnvironmentId();
      setEnvId(id || '');
    }, []);

    return (
      <UserSearchDropdownV8
        environmentId={envId}
        value=""
        onChange={jest.fn()}
        onGetToken={jest.fn()}
      />
    );
  };

  render(<TestComponent />);
  
  await waitFor(() => {
    expect(getEnvironmentId).toHaveBeenCalled();
  });
});
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Worker token required" error
**Solution**: Ensure worker token is configured and valid
```tsx
// Check worker token status
import { checkWorkerTokenStatusSync } from '../../../v8/services/workerTokenStatusServiceV8';

const status = checkWorkerTokenStatusSync();
if (!status.isValid) {
  // Handle missing/invalid token
}
```

#### 2. Environment ID is empty
**Solution**: Verify environment ID is properly loaded
```tsx
useEffect(() => {
  const envId = EnvironmentIdServiceV8.getEnvironmentId();
  console.log('Environment ID:', envId); // Debug log
  setEnvironmentId(envId || '');
}, []);
```

#### 3. Dropdown not loading users
**Solution**: Check API connectivity and permissions
```tsx
// Verify MFA service is working
import { MFAServiceV8 } from '../../../v8/services/mfaServiceV8';

const testConnection = async () => {
  try {
    const result = await MFAServiceV8.listUsers(environmentId, '', 10, 0);
    console.log('Users loaded:', result.users.length);
  } catch (error) {
    console.error('Failed to load users:', error);
  }
};
```

## 🎯 Best Practices

### ✅ Do's
- Always provide environment ID
- Handle worker token requirements gracefully
- Clear form errors when user selects username
- Use descriptive placeholder text
- Test with different environment configurations

### ❌ Don'ts
- Don't hardcode environment IDs
- Don't ignore onGetToken callback
- Don't use manual username inputs alongside UserSearchDropdownV8
- Don't forget to update form validation logic
- Don't assume worker token is always available

## 📚 Related Components

- **BaseLoginForm.tsx** - Example implementation in login forms
- **UserManagementPage.tsx** - Example in user management
- **UserLookupForm.tsx** - Example in password reset flows
- **RedirectlessFlowV9_Real.tsx** - Example in flow components

## 🔄 Migration from Manual Inputs

### Before
```tsx
<input
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  placeholder="Enter username"
/>
```

### After
```tsx
<UserSearchDropdownV8
  environmentId={environmentId}
  value={username}
  onChange={setUsername}
  placeholder="Search for username..."
  onGetToken={() => handleTokenRequirement()}
/>
```

## 📞 Support

For issues or questions about UserSearchDropdownV8:
1. Check this reference guide
2. Review the implementation documentation
3. Test with the provided examples
4. Verify environment and worker token configuration
