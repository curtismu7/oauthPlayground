# Category Dropdown Structure

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [1. Authorization] [2. Worker Token] [3. Device Selection] ...         │  ← Flow Tabs
├─────────────────────────────────────────────────────────────────────────┤
│  Category: [Frontend ▼] │ Code Type: [Ping SDK (JavaScript) ▼] │       │  ← Category Panel
│                          │                                       │       │
│  Language: [TypeScript ▼]                                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Environment ID: [YOUR_ENVIRONMENT_ID]                                  │  ← Config Panel
│  Client ID: [YOUR_CLIENT_ID]                                            │
│  ...                                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  [Copy Code] [Download] [Format] [Reset]              [🌙 Dark]        │  ← Toolbar
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  // Code Editor (Monaco)                                                │
│  const client = new PingOneClient({...});                               │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Frontend │ Ping SDK (JavaScript) │ 1. Authorization │ Lines: 45       │  ← Status Bar
└─────────────────────────────────────────────────────────────────────────┘
```

## Dropdown Hierarchy

### Category Dropdown
```
┌─────────────────┐
│ Frontend        │ ← Selected
│ Backend         │
│ Mobile          │
└─────────────────┘
```

### Code Type Dropdown (Frontend Selected)
```
┌──────────────────────────┐
│ Ping SDK (JavaScript)    │ ← Selected
│ REST API (Fetch)         │
│ REST API (Axios)         │
│ React                    │
│ Angular                  │
│ Vue.js                   │
│ Next.js                  │
│ Vanilla JavaScript       │
└──────────────────────────┘
```

### Code Type Dropdown (Backend Selected)
```
┌──────────────────────────┐
│ Ping SDK (Node.js)       │ ← Selected
│ REST API (Node.js)       │
│ Python (Requests)        │
│ Ping SDK (Python)        │
│ Ping SDK (Java)          │
│ Go (HTTP)                │
│ Ruby (HTTP)              │
│ C# (HTTP)                │
└──────────────────────────┘
```

### Code Type Dropdown (Mobile Selected)
```
┌──────────────────────────┐
│ Ping SDK (iOS)           │ ← Selected
│ Ping SDK (Android)       │
│ React Native             │
│ Flutter                  │
│ Swift (Native)           │
│ Kotlin (Native)          │
└──────────────────────────┘
```

### Language Dropdown (Syntax Highlighting)
```
┌──────────────────────────┐
│ Web                      │
│   JavaScript             │
│   TypeScript             │ ← Selected
│   React                  │
│   Angular                │
│   Vanilla JS             │
│ Mobile                   │
│   React Native           │
│   Flutter/Dart           │
│   Swift (iOS)            │
│   Kotlin (Android)       │
│ Backend                  │
│   Python                 │
│   Go                     │
│   Ruby                   │
│   Java                   │
│   C#                     │
│   Perl                   │
└──────────────────────────┘
```

## User Flow

1. **User selects "Frontend" category**
   - Code Type dropdown updates to show Frontend options
   - First option (Ping SDK JavaScript) auto-selected

2. **User selects "Ping SDK (JavaScript)" code type**
   - Code editor updates with Ping SDK implementation
   - Language selector shows TypeScript (default)

3. **User clicks "3. Device Selection" tab**
   - Code updates to show Device Selection step
   - Still using Ping SDK (JavaScript) implementation

4. **User switches to "Backend" category**
   - Code Type dropdown updates to Backend options
   - First option (Ping SDK Node.js) auto-selected
   - Code regenerates for Backend implementation

5. **User switches to "Mobile" category**
   - Code Type dropdown updates to Mobile options
   - First option (Ping SDK iOS) auto-selected
   - Code regenerates for iOS implementation

## Benefits

✅ **Organized**: Clear separation between Frontend, Backend, and Mobile
✅ **Flexible**: Multiple implementation options per category
✅ **Ping SDK Prominent**: Ping SDK options listed first in each category
✅ **Dynamic**: Code Type options change based on selected category
✅ **Intuitive**: Natural workflow from category → type → language → flow step
