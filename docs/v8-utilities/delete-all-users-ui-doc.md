# V8 Utility - Delete All Users UI Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Audience:** End Users  
**Utility Type:** Delete All Users Utility

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Understanding the Results](#understanding-the-results)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Overview

The **Delete All Users Utility** is a management tool that allows administrators to delete multiple users from a PingOne environment in bulk. This utility provides filtering options to target specific users, bulk selection capabilities, and detailed results reporting.

### Key Characteristics

- ✅ **Bulk Operations**: Delete multiple users in a single operation
- ✅ **Filtering Options**: Filter users by status, population, username, or email
- ✅ **Selective Deletion**: Choose which users to delete from the filtered list
- ✅ **Results Reporting**: Detailed success/failure counts and error information
- ✅ **Worker Token Required**: Uses worker token for secure API authentication

### When to Use

- Cleaning up test users in a development environment
- Removing users who have left the organization
- Bulk user management operations
- Environment cleanup and maintenance

### Prerequisites

- **PingOne Admin Access**: Administrator access to PingOne Admin Console
- **Environment ID**: Your PingOne Environment ID (UUID format)
- **Worker Token**: A valid worker token with `p1:delete:user` scope
- **Permissions**: Appropriate permissions to delete users in the environment

---

## Getting Started

### Prerequisites

Before using the Delete All Users Utility, ensure you have:

1. **PingOne Account**: Access to PingOne Admin Console
2. **Environment ID**: Your PingOne Environment ID
   - Format: UUID (e.g., `12345678-1234-1234-1234-123456789012`)
   - Where to find: PingOne Admin Console → Environments
3. **Worker Token**: A valid worker token with deletion permissions
   - Required scope: `p1:delete:user`
   - Where to get: Use the "Get Worker Token" button in the utility

### Accessing the Utility

1. Navigate to the Delete All Users Utility page: `/v8/delete-all-users`
2. The utility will automatically load your Environment ID from global storage (if available)
3. Configure your filters and load users
4. Select users to delete and confirm

---

## Step-by-Step Guide

### Step 1: Configure Environment and Authentication

**Purpose**: Set up your environment ID and worker token for API access.

#### Required Information

1. **Environment ID** *(Required)*
   - Your PingOne Environment ID
   - Format: UUID (e.g., `12345678-1234-1234-1234-123456789012`)
   - **Auto-loaded**: Automatically loaded from global storage if available
   - Where to find: PingOne Admin Console → Environments

2. **Worker Token** *(Required)*
   - A valid worker token with `p1:delete:user` scope
   - **Get Token**: Click "Get Worker Token" button to open worker token modal
   - **Token Status**: Green indicator shows valid token
   - ⚠️ **Security**: Keep your worker token secure

#### Optional Filter Configuration

3. **Population Filter** *(Optional)*
   - Filter users by population
   - Format: Population ID (UUID)
   - **Default**: All populations
   - Where to find: PingOne Admin Console → Populations

4. **User Status Filter** *(Optional)*
   - Filter users by status
   - Options:
     - **All Statuses**: Include all users regardless of status
     - **Active**: Only active users
     - **Locked**: Only locked users
     - **Disabled**: Only disabled users
   - **Default**: All Statuses

5. **Username Pattern** *(Optional)*
   - Filter users by username pattern
   - Supports wildcards (e.g., `test*`, `*admin*`)
   - **Example**: `test*` matches all usernames starting with "test"

6. **Email Pattern** *(Optional)*
   - Filter users by email pattern
   - Supports wildcards (e.g., `*@example.com`, `test*`)
   - **Example**: `*@test.com` matches all emails ending with "@test.com"

#### What Happens

- Your configuration is validated
- Environment ID is saved to global storage
- Worker token status is checked
- "Load Users" button becomes enabled when ready

#### Tips

- 💡 **Use Filters**: Use filters to narrow down the user list before deletion
- 💡 **Worker Token**: Ensure your worker token has `p1:delete:user` scope
- 💡 **Test First**: Test with a small filter first to verify results

---

### Step 2: Load and Select Users

**Purpose**: Load users matching your filters and select which ones to delete.

#### What You'll See

1. **Load Users Button**
   - "Load Users" button to fetch users
   - Executes API call to list users
   - Shows loading indicator during fetch

2. **User List Table**
   - Displays users matching your filters
   - Shows: Username, Email, Status, Population, Created At
   - Sortable columns
   - Checkboxes for selection

3. **Selection Controls**
   - **Select All**: Select all users in the list
   - **Select None**: Clear all selections
   - **Individual Selection**: Toggle individual users
   - **Selection Count**: Shows number of selected users

#### What Happens When You Click "Load Users"

1. **API Request**: POST request to `/api/pingone/users/list`
2. **Filtering**: Users filtered by your criteria
3. **Display**: User list displayed in table
4. **Selection**: All users auto-selected (can be changed)

#### User List Information

**Displayed Fields**:
- **Username**: User's username (primary identifier)
- **Email**: User's email address
- **Status**: User status (ACTIVE, LOCKED, DISABLED)
- **Population**: Population name/ID (if applicable)
- **Created At**: When the user was created
- **User ID**: UUID (for reference, not displayed by default)

#### Selection Features

- **Select All**: Click to select all users in the current list
- **Select None**: Click to clear all selections
- **Individual Checkboxes**: Toggle individual users on/off
- **Selection Count**: Displays "X of Y users selected"

#### Tips

- 💡 **Use Filters**: Apply filters before loading to reduce list size
- 💡 **Review List**: Review the user list carefully before deletion
- 💡 **Selective Deletion**: You can select specific users, not just all

---

### Step 3: Delete Selected Users

**Purpose**: Delete the selected users and view results.

#### What You'll See

1. **Delete Selected Button**
   - "Delete Selected Users" button
   - Shows count of selected users
   - Disabled if no users selected

2. **Confirmation Modal**
   - Appears when you click "Delete Selected Users"
   - Shows count of users to be deleted
   - Warning message about permanent deletion
   - "Delete" and "Cancel" buttons

3. **Deletion Progress**
   - Progress indicator during deletion
   - Shows "Deleting user X of Y..."
   - Cannot be cancelled once started

4. **Results Display**
   - Success count
   - Failed count
   - Error details (expandable)
   - Processing time

#### What Happens When You Click "Delete Selected Users"

1. **Confirmation**: Confirmation modal appears
2. **User Confirmation**: You confirm deletion
3. **Bulk Deletion**: Users deleted one by one via API
4. **Progress Tracking**: Success/failure tracked for each user
5. **Results Display**: Summary and detailed results shown

#### Deletion Process

**For Each User**:
1. **API Call**: `DELETE /api/pingone/user/:userId`
2. **Authentication**: Worker token in Authorization header
3. **Response**: 204 No Content (success) or error response
4. **Tracking**: Success/failure recorded

**Bulk Operation**:
- Users processed sequentially (one at a time)
- Continues even if individual deletions fail
- All results collected and displayed at the end

#### Deletion Results

**Success Indicators**:
- ✅ **Green Success Count**: Number of successfully deleted users
- ✅ **Success Message**: "Successfully deleted X user(s)"

**Failure Indicators**:
- ❌ **Red Failed Count**: Number of failed deletions
- ❌ **Error Details**: Expandable list showing which users failed and why
- ⚠️ **Warning Message**: "Deleted X user(s), but Y failed. Check details below."

#### Understanding Error Details

**Error Information**:
- **User ID**: Which user failed
- **Username**: Username of failed user
- **Error Message**: Why the deletion failed

**Common Error Reasons**:
- User not found (already deleted)
- Insufficient permissions
- User has dependencies (cannot be deleted)
- Network/server errors

#### Tips

- 💡 **Review Before Deleting**: Always review the user list before confirming
- 💡 **Start Small**: Test with a small number of users first
- 💡 **Check Results**: Review error details to understand failures
- 💡 **Retry Failed**: You can retry failed deletions individually

---

## Understanding the Results

### What You Receive

#### Success Count

- **Purpose**: Number of users successfully deleted
- **Format**: Integer (e.g., `5`)
- **Meaning**: These users have been permanently removed from PingOne

#### Failed Count

- **Purpose**: Number of users that could not be deleted
- **Format**: Integer (e.g., `2`)
- **Meaning**: These users remain in PingOne (deletion failed)

#### Error Details

- **Purpose**: Detailed information about failed deletions
- **Format**: List of error objects
- **Contents**:
  - User ID
  - Username
  - Error message (reason for failure)

#### Processing Time

- **Purpose**: Total time taken for the deletion operation
- **Format**: Duration (e.g., "2.5 seconds")
- **Meaning**: Time from start to completion of bulk deletion

### Result States

**All Successful**:
- ✅ Success count = total selected users
- ✅ Failed count = 0
- ✅ No error details shown
- ✅ Success message displayed

**Partial Success**:
- ✅ Success count < total selected users
- ⚠️ Failed count > 0
- ⚠️ Error details shown (expandable)
- ⚠️ Warning message displayed

**All Failed**:
- ❌ Success count = 0
- ❌ Failed count = total selected users
- ❌ Error details shown (expandable)
- ❌ Error message displayed

---

## Troubleshooting

### Common Issues

#### "Missing required fields: environmentId and workerToken"

**Problem**: Error when trying to load users.

**Solutions**:
1. Enter Environment ID in the configuration section
2. Click "Get Worker Token" to generate a worker token
3. Ensure worker token is valid (green indicator)

#### "Worker token is invalid or expired"

**Problem**: Error about invalid worker token.

**Solutions**:
1. Click "Get Worker Token" to generate a new token
2. Ensure worker token has `p1:delete:user` scope
3. Check token expiration time

#### "Insufficient permissions"

**Problem**: Error when trying to delete users.

**Solutions**:
1. Check worker token has `p1:delete:user` scope
2. Verify your PingOne account has user deletion permissions
3. Generate a new worker token with correct scopes

#### "User not found"

**Problem**: Error when deleting a specific user.

**Solutions**:
1. User may have been deleted already
2. User may have been deleted by another process
3. This is expected - operation continues for other users

#### "No users found"

**Problem**: User list is empty after loading.

**Solutions**:
1. Check your filters - they may be too restrictive
2. Try removing filters to see all users
3. Verify users exist in the environment
4. Check Environment ID is correct

#### "Failed to load users"

**Problem**: Error when clicking "Load Users".

**Solutions**:
1. Check Environment ID is correct
2. Verify worker token is valid
3. Check network connection
4. Verify worker token has `p1:read:user` scope (for listing)

---

## FAQ

### General Questions

**Q: Can I undo user deletion?**  
A: No, user deletion is permanent and cannot be undone. Always review your selection carefully before confirming.

**Q: How many users can I delete at once?**  
A: There's no hard limit, but very large operations may take time. The utility processes users sequentially.

**Q: What happens to user data when deleted?**  
A: User data is permanently removed from PingOne according to your data retention policies.

**Q: Can I delete users from multiple populations?**  
A: Yes, if you don't filter by population, you can delete users from all populations (if you have permissions).

### Technical Questions

**Q: What scopes does my worker token need?**  
A: Your worker token needs `p1:delete:user` scope for deletion and `p1:read:user` scope for listing users.

**Q: How long does bulk deletion take?**  
A: Depends on the number of users. Each user deletion takes ~100-500ms, so 100 users might take 10-50 seconds.

**Q: What if some deletions fail?**  
A: The utility continues processing other users. Failed deletions are reported in the error details section.

**Q: Can I cancel a deletion in progress?**  
A: No, once deletion starts, it cannot be cancelled. The operation will complete for all selected users.

### Security Questions

**Q: Is this safe to use in production?**  
A: Use with extreme caution. Always test in a development environment first. User deletion is permanent.

**Q: Who can use this utility?**  
A: Users with appropriate PingOne permissions and a valid worker token with deletion scopes.

**Q: Are deleted users logged?**  
A: Yes, user deletions are logged in PingOne audit logs. Check PingOne Admin Console → Audit Logs.

**Q: Can I recover deleted users?**  
A: No, deleted users cannot be recovered. You would need to recreate them manually.

---

## Additional Resources

- [PingOne User Management API](https://apidocs.pingidentity.com/pingone/platform/v1/api/#users)
- [PingOne Worker Token Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#worker-tokens)
- [PingOne Admin Console](https://admin.pingone.com)

---

## Support

If you encounter issues not covered in this documentation:

1. Check the **Troubleshooting** section above
2. Review PingOne Admin Console permissions
3. Verify worker token scopes
4. Check browser console for error messages
5. Contact PingOne support if configuration issues persist
