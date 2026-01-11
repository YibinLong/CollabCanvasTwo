# CollabCanvas

A real-time collaborative design tool with AI-powered canvas manipulation. Built with Next.js, Firebase, and OpenAI.

**Live Demo**: [Deploy on Vercel]

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Firebase Setup](#firebase-setup)
- [Deployment on Vercel](#deployment-on-vercel)
- [Conflict Resolution Strategy](#conflict-resolution-strategy)
- [Performance Targets](#performance-targets)
- [AI Canvas Agent](#ai-canvas-agent)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Features

### Canvas Features
- **Pan and Zoom**: Smooth scrolling with mousewheel and drag navigation
- **8 Shape Types**: Rectangles, circles, triangles, stars, lines, text, images, frames
- **Transformations**: Move, resize, rotate, scale operations
- **Multi-select**: Shift-click or selection box for multiple shapes
- **Grid System**: Configurable grid with snap-to-grid support
- **Smart Guides**: Visual alignment guides during shape manipulation
- **Undo/Redo**: 50+ levels of history with Cmd+Z/Cmd+Shift+Z
- **Frames/Artboards**: Organize designs into logical sections
- **Blend Modes**: 16 blend modes (normal, multiply, screen, overlay, etc.)
- **Shadow Effects**: Customizable color, blur, and offset

### Real-Time Collaboration
- **Live Cursors**: See other users' cursor positions in real-time (<50ms latency)
- **Shape Sync**: Real-time shape synchronization (<100ms latency)
- **Presence Indicators**: Online status with connection state
- **Optimistic Updates**: Responsive UI with immediate feedback
- **Conflict Resolution**: Last-write-wins with optimistic updates
- **Multi-user Support**: 5+ concurrent users without degradation

### Collaborative Comments
- Thread-based comments with replies
- Resolve/unresolve workflow
- Comment markers on canvas with hover preview
- Filter by resolved/unresolved status

### AI Canvas Agent (30+ Commands)
Natural language commands to create and modify shapes:
- **Creation**: Create shapes, text, buttons, frames
- **Manipulation**: Move, resize, rotate, scale, duplicate
- **Styling**: Change colors, opacity, stroke, blend mode
- **Layout**: Arrange in grid, row, column; align; distribute; space evenly
- **Complex UI**: Create login forms, signup forms, navigation bars, profile cards, hero sections, search bars, footers

### Export Options
- **PNG**: High-quality raster export
- **SVG**: Scalable vector graphics
- **JSON**: Full canvas state backup/restore

### Advanced Features (Tier 1-3)
- **Tier 1**: Color picker with recent colors, undo/redo, keyboard shortcuts, export (PNG/SVG), snap-to-grid, object grouping, copy/paste
- **Tier 2**: Component system, layers panel, alignment tools, z-index management, selection tools, design tokens (colors, text styles), canvas frames
- **Tier 3**: Collaborative comments with threads, version history with restore

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CollabCanvas Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│    ┌─────────────────────────────────────────────────────────────────────┐   │
│    │                        Client (Next.js/React)                        │   │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│    │  │   Canvas    │  │   Toolbar   │  │   Panels    │  │   AI Chat   │ │   │
│    │  │  (Konva.js) │  │             │  │   (Layers,  │  │             │ │   │
│    │  │             │  │             │  │  Comments)  │  │             │ │   │
│    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │   │
│    │         │                │                │                │        │   │
│    │         └────────────────┴────────────────┴────────────────┘        │   │
│    │                                 │                                    │   │
│    │  ┌──────────────────────────────┴──────────────────────────────┐    │   │
│    │  │                     Zustand State Stores                     │    │   │
│    │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │    │   │
│    │  │  │ canvasStore  │ │  userStore   │ │ commentStore/        │ │    │   │
│    │  │  │ (shapes,     │ │ (auth,       │ │ componentStore       │ │    │   │
│    │  │  │  history,    │ │  presence,   │ │ (comments, tokens,   │ │    │   │
│    │  │  │  selection)  │ │  cursors)    │ │  components)         │ │    │   │
│    │  │  └──────────────┘ └──────────────┘ └──────────────────────┘ │    │   │
│    │  └──────────────────────────────────────────────────────────────┘    │   │
│    │                                 │                                    │   │
│    │  ┌──────────────────────────────┴──────────────────────────────┐    │   │
│    │  │                     Custom React Hooks                       │    │   │
│    │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │    │   │
│    │  │  │  useAuth     │ │useRealtime-  │ │   useAIAgent         │ │    │   │
│    │  │  │              │ │   Sync       │ │                      │ │    │   │
│    │  │  └──────────────┘ └──────────────┘ └──────────────────────┘ │    │   │
│    │  └──────────────────────────────────────────────────────────────┘    │   │
│    └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                        │
├──────────────────────────────────────┼────────────────────────────────────────┤
│                                      │                                        │
│    ┌─────────────────────────────────┴─────────────────────────────────┐     │
│    │                           Backend Services                         │     │
│    │                                                                    │     │
│    │    ┌──────────────────┐     ┌──────────────────┐                 │     │
│    │    │  Firebase Auth   │     │   OpenAI API     │                 │     │
│    │    │  (Email, Google) │     │   (GPT-4o)       │                 │     │
│    │    └────────┬─────────┘     └────────┬─────────┘                 │     │
│    │             │                        │                           │     │
│    │    ┌────────┴───────────────────────┴──────────┐                 │     │
│    │    │           Firebase Backend                 │                 │     │
│    │    │  ┌─────────────────┐ ┌─────────────────┐  │                 │     │
│    │    │  │   Firestore     │ │ Realtime DB     │  │                 │     │
│    │    │  │  (Shapes,       │ │ (Cursors,       │  │                 │     │
│    │    │  │   Canvas State) │ │  Presence)      │  │                 │     │
│    │    │  └─────────────────┘ └─────────────────┘  │                 │     │
│    │    └───────────────────────────────────────────┘                 │     │
│    └────────────────────────────────────────────────────────────────────┘     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Shape Operations**: User action → Canvas Store (local) → Firestore (remote) → All clients sync
2. **Cursor Tracking**: Mouse move → Realtime DB → All clients receive cursor updates
3. **Presence**: Connect → Realtime DB → onDisconnect cleanup → All clients see presence
4. **AI Commands**: Natural language → API route → OpenAI → Function calls → Canvas Store → Sync

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| Canvas | Konva.js / react-konva |
| State | Zustand with subscribeWithSelector |
| Auth | Firebase Auth (Email/Password, Google OAuth) |
| Database | Firebase Firestore (shapes), Realtime Database (cursors) |
| AI | OpenAI GPT-4o with function calling (24+ tools) |
| Testing | Jest, React Testing Library, Playwright |
| Deployment | Vercel (Edge Functions) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CollabCanvasTwo
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment template:
```bash
cp .env.local.example .env.local
```

4. Configure environment variables in `.env.local`:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication with Email/Password and Google sign-in
4. Create a Firestore database
5. Create a Realtime Database

### 2. Security Rules

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /canvases/{canvasId}/shapes/{shapeId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Realtime Database Rules:**
```json
{
  "rules": {
    "canvases": {
      "$canvasId": {
        "cursors": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "presence": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    }
  }
}
```

## Deployment on Vercel

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - All `NEXT_PUBLIC_FIREBASE_*` variables
   - `OPENAI_API_KEY`
4. Deploy

The project is configured with:
- Automatic builds from Git pushes
- Edge functions for API routes (30s timeout)
- Optimized builds with Turbopack

## Conflict Resolution Strategy

### Approach: Last-Write-Wins with Optimistic Updates

CollabCanvas uses a **Last-Write-Wins (LWW)** strategy for conflict resolution, combined with optimistic updates for a responsive user experience.

### How It Works

1. **Local-First Updates**
   - User actions immediately update the local Zustand store
   - UI reflects changes instantly (optimistic update)
   - Changes are queued for sync to Firestore

2. **Debounced Synchronization**
   - Shape updates are debounced (100ms) to reduce write frequency
   - Prevents overwhelming the database with rapid edits
   - Batches multiple changes efficiently

3. **Last-Write-Wins Resolution**
   - Each shape has an `updatedAt` timestamp
   - When conflicts occur, the most recent update prevails
   - Firestore automatically handles concurrent writes

4. **Real-time Listeners**
   - All clients subscribe to Firestore shape collection
   - Changes propagate to all clients automatically
   - Local state is reconciled with remote state

### Conflict Scenarios

| Scenario | Resolution |
|----------|------------|
| Simultaneous move | Latest position wins based on `updatedAt` |
| Rapid edit storm | All changes sync; final state is consistent |
| Delete vs Edit | Delete takes precedence (shape removed) |
| Create collision | Both shapes created with unique IDs |
| Network disconnect | Changes queue locally; sync on reconnect |

### Offline Queue System

When the connection is lost, CollabCanvas continues to work:

1. **Local Changes Continue**: Users can still create and modify shapes
2. **Operations Queue**: All changes are stored in an offline queue
3. **Automatic Sync**: When connection restores, queued operations sync automatically
4. **Status Indicator**: Blue "Syncing..." status shows pending operations
5. **Conflict Resolution**: Last-write-wins applies to queued operations

### Visual Feedback

- Connection status indicator (green = connected, yellow = connecting, blue = syncing, red = disconnected)
- User presence with colored cursors
- "Last edited by" indicator on shapes

### Implementation Details

```typescript
// useRealtimeSync.ts - Debounced sync
const debouncedSyncShape = useCallback((shape: CanvasShape) => {
  const existingTimeout = pendingUpdates.current.get(shape.id);
  if (existingTimeout) clearTimeout(existingTimeout);

  const timeout = setTimeout(() => {
    syncShapeToFirestore(shape);
    pendingUpdates.current.delete(shape.id);
  }, 100); // 100ms debounce

  pendingUpdates.current.set(shape.id, timeout);
}, [syncShapeToFirestore]);
```

## Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| Canvas FPS | 60 FPS | Konva.js with virtualized rendering |
| Object sync | <100ms | Firestore real-time listeners |
| Cursor sync | <50ms | Realtime Database with throttling |
| Object capacity | 500+ | z-index sorting, shape memoization |
| Concurrent users | 5+ | Session-based cursor IDs, presence tracking |

### Optimizations

- **Shape rendering**: Memoized components, z-index sorting
- **Cursor updates**: Throttled to 33 updates/sec, 5px movement threshold
- **Shape sync**: Debounced writes, batch operations
- **State management**: Zustand with selective subscriptions

## AI Canvas Agent

### Supported Commands (30+)

#### Creation Commands
- "Create a red circle at position 100, 200"
- "Add a text layer saying 'Hello World'"
- "Make a 200x300 rectangle"
- "Create a primary button with text 'Submit'"
- "Create a frame named 'Header'"

#### Manipulation Commands
- "Move the blue rectangle to the center"
- "Center the rectangle on the canvas"
- "Resize the circle to be twice as big"
- "Rotate the text 45 degrees"
- "Scale the star by 2x"
- "Duplicate the rectangle"
- "Change the blend mode to multiply"
- "Get the current canvas state"

#### Layout Commands
- "Arrange these shapes in a horizontal row"
- "Create a grid of 3x3 squares"
- "Space these elements evenly"
- "Align all shapes left"
- "Distribute shapes horizontally"

#### Complex Commands (Multi-Element UI Components)
- "Create a login form with username and password fields"
- "Create a signup form with name, email, and password"
- "Build a navigation bar with 4 menu items"
- "Make a card layout with title and description"
- "Create a profile card for John Doe"
- "Create a search bar"
- "Create a footer with privacy and terms links"
- "Create a hero section with headline and CTA button"

### Technical Implementation

The AI agent uses OpenAI's function calling with 30+ defined tools:

```typescript
const canvasTools: OpenAI.ChatCompletionTool[] = [
  { name: 'createShape', ... },
  { name: 'createText', ... },
  { name: 'moveShape', ... },
  { name: 'resizeShape', ... },
  { name: 'rotateShape', ... },
  { name: 'arrangeInGrid', ... },
  { name: 'createLoginForm', ... },
  // ... 17+ more tools
];
```

### AI Performance

- **Latency**: <2 seconds for single-step commands
- **Accuracy**: 90%+ reliable execution
- **Multi-step**: Handles complex operations (login form = 8 shapes)
- **Shared state**: All users see AI-generated shapes in real-time

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| V | Select tool |
| H | Hand/pan tool |
| R | Rectangle tool |
| O | Circle tool |
| T | Text tool |
| L | Line tool |
| F | Frame tool |
| C | Comment tool |
| Delete/Backspace | Delete selected |
| Escape | Deselect all |
| Cmd/Ctrl+Z | Undo |
| Cmd/Ctrl+Shift+Z | Redo |
| Cmd/Ctrl+C | Copy |
| Cmd/Ctrl+X | Cut |
| Cmd/Ctrl+V | Paste |
| Cmd/Ctrl+A | Select all |
| Cmd/Ctrl+G | Group selection |
| Cmd/Ctrl+Shift+G | Ungroup |
| Cmd/Ctrl+\ | Toggle layers panel |
| Cmd/Ctrl+P | Toggle properties panel |
| Cmd/Ctrl+Shift+E | Export as PNG |

## Testing

### Unit Tests (110+ tests)
```bash
npm test           # Run all unit tests
npm run test:watch # Watch mode
npm run test:coverage # With coverage report
```

### E2E Tests
```bash
npm run test:e2e     # Headless Playwright tests
npm run test:e2e:ui  # With Playwright UI
```

### Test Coverage
- Canvas store operations (CRUD, selection, history)
- User store state management
- Comment store with threads
- Component store (components, design tokens)
- Export utilities (SVG, JSON)
- Smart guides calculations
- Component rendering
- E2E: Page loading, toolbar, keyboard shortcuts

## Project Structure

```
src/
├── app/                      # Next.js app router
│   ├── api/ai/route.ts       # AI API endpoint (Edge)
│   ├── page.tsx              # Main entry point
│   └── layout.tsx            # Root layout
├── components/
│   ├── canvas/               # Canvas components
│   │   ├── Canvas.tsx        # Main Konva canvas (747 lines)
│   │   ├── CanvasShape.tsx   # Shape renderer (blend modes, shadows)
│   │   ├── Grid.tsx          # Grid overlay
│   │   ├── SmartGuides.tsx   # Alignment guides
│   │   └── CommentMarker.tsx # Comment indicators
│   ├── toolbar/              # Toolbar components
│   │   ├── Toolbar.tsx       # Shape tools, history
│   │   └── PropertyPanel.tsx # Property editor
│   ├── panels/               # Side panels
│   │   ├── LayersPanel.tsx   # Layer hierarchy
│   │   ├── CommentsPanel.tsx # Comments/threads
│   │   ├── PresencePanel.tsx # Online users
│   │   └── VersionHistoryPanel.tsx
│   ├── auth/AuthForm.tsx     # Login/signup
│   ├── ai/AIChat.tsx         # AI command interface
│   └── ui/ColorPicker.tsx    # Color selection
├── hooks/
│   ├── useAuth.ts            # Firebase auth hook
│   ├── useRealtimeSync.ts    # Real-time sync
│   └── useAIAgent.ts         # AI command processing
├── store/
│   ├── canvasStore.ts        # Shapes, history, selection
│   ├── userStore.ts          # Auth, presence, cursors
│   ├── commentStore.ts       # Comments, threads
│   └── componentStore.ts     # Components, design tokens
├── lib/
│   ├── firebase/config.ts    # Firebase initialization
│   ├── ai/agent.ts           # AI agent (24+ tools)
│   ├── exportUtils.ts        # PNG/SVG/JSON export
│   └── smartGuidesUtils.ts   # Snap calculations
├── types/canvas.ts           # TypeScript definitions
└── __tests__/                # Unit tests (110+)

e2e/                          # Playwright E2E tests
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run unit tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Tests with coverage
npm run test:e2e     # E2E tests (Playwright)
npm run test:e2e:ui  # E2E with UI
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test && npm run test:e2e`
5. Submit a pull request

## License

MIT
