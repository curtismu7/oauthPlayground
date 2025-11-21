# PingOne Access Control Scopes Added to Resources API Flow

## New Content Added

### 🔑 PingOne Access Control Scopes Section

Added a comprehensive new topic covering PingOne's custom access control scopes with real-world examples.

## What's Included

### 1. **Concept Explanation**
- What are PingOne access control scopes
- Custom scope syntax: `p1:read:user:{suffix}` and `p1:update:user:{suffix}`
- How they limit access to specific user attributes

### 2. **Real-World Example: HR System**
Complete walkthrough showing:
- **3 different permission levels:**
  - Email-only updates (self-service portal)
  - Basic profile read (employee directory)
  - Full HR access (HR admins)
- **Authorization requests** for each level
- **Resulting access tokens** showing attribute differences

### 3. **Additional Industry Examples**

#### Healthcare Application
- Patient portal (view own records)
- Nurse station (update vitals only)
- Doctor portal (full medical access)

#### Financial Services
- Customer app (view balance)
- Teller system (process transactions)
- Compliance team (audit access)

#### Education Platform
- Student portal (view grades)
- Teacher portal (update grades)
- Registrar (full academic access)

### 4. **Hands-On Instructions**
Step-by-step guide for users to:
1. Log into PingOne admin console
2. Navigate to Resources
3. Create custom scope
4. Add specific attributes
5. Test in OAuth flow

### 5. **Key Benefits**
- Principle of least privilege
- Data privacy
- Compliance (HIPAA, GDPR)
- Security
- Flexibility

## Visual Design

### New Card
- **Color:** Red (#ef4444) - Stands out as important security topic
- **Icon:** Key (FiKey) - Represents access control
- **Title:** PingOne Access Control
- **Description:** Custom scopes for user data with real-world examples

### Card Position
Now 7 total cards (was 6):
1. Resources Overview
2. Create a Resource
3. Define Scopes
4. Resource Attributes
5. **PingOne Access Control** ← NEW!
6. Auth Flow Integration
7. Best Practices

## Code Examples Included

### Custom Scope Creation
```
p1:update:user:email-only
p1:read:user:basic-profile
p1:update:user:hr-full
```

### Authorization Requests
Shows how different apps request different scopes

### Access Token Comparison
Side-by-side comparison showing how tokens differ based on scopes

### Industry-Specific Examples
Healthcare, Financial, Education scenarios with actual scope names

## Educational Value

### Before
- Users learned about generic resources and scopes
- No PingOne-specific guidance
- No real-world context

### After
- Users understand PingOne's built-in access control
- See exactly how to create custom scopes
- Have 4 complete industry examples to reference
- Know how to test in their own environment
- Understand security and compliance benefits

## Integration with Existing Content

The new section fits naturally between:
- **Resource Attributes** (general custom claims)
- **PingOne Access Control** (PingOne-specific scopes) ← NEW
- **Auth Flow Integration** (using scopes in flows)

## External Links

Added link to official documentation:
- [Access Services Through Scopes and Roles](https://docs.pingidentity.com/r/en-us/pingone/p1_c_scopes_and_roles)

## User Journey

1. Learn about resources (Overview)
2. Create a resource (Create Resource)
3. Add scopes (Define Scopes)
4. Add custom claims (Resource Attributes)
5. **Learn PingOne access control** (PingOne Access Control) ← NEW!
6. Use in auth flows (Integration)
7. Follow best practices (Best Practices)

## Status

✅ **COMPLETE** - PingOne Access Control Scopes section fully integrated!

The Resources API flow now includes:
- 7 comprehensive topics (up from 6)
- Real-world industry examples
- Hands-on instructions
- Complete code samples
- Security best practices
- Direct links to PingOne documentation
