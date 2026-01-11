# CollabCanvas

A real-time collaborative design tool with AI-powered canvas manipulation. Built with Next.js, Firebase, and OpenAI.

## Features

### Canvas
- Pan and zoom with smooth scrolling (mousewheel + drag)
- Multiple shape types: rectangles, circles, triangles, stars, lines, text, images, frames
- Shape transformations: move, resize, rotate, scale
- Multi-select with shift-click or selection box
- Keyboard shortcuts for quick actions
- Grid and snap-to-grid support
- Smart guides for shape alignment
- Undo/redo history (50+ levels)
- Image upload with drag-and-drop
- Frames/artboards for organizing designs
- Blend modes (16 types: normal, multiply, screen, overlay, etc.)
- Shadow effects (color, blur, offset)

### Real-time Collaboration
- Live cursor tracking across users
- Real-time shape synchronization (<100ms latency)
- Presence indicators showing online users with connection status
- Optimistic updates for responsive feel
- Conflict resolution with last-write-wins
- Supports 5+ concurrent users

### Collaborative Comments
- Add comments/annotations to the canvas
- Thread-based replies on comments
- Resolve/unresolve comments
- Filter by resolved/unresolved
- Comment markers on canvas with hover preview

### AI Canvas Agent (24+ commands)
- Natural language commands to create and modify shapes
- Supported commands:
  - **Creation**: Create shapes, text, buttons, frames
  - **Manipulation**: Move, resize, rotate, scale, duplicate
  - **Styling**: Change colors, opacity, stroke, blend mode
  - **Layout**: Arrange in grid, row, column; align; distribute; space evenly
  - **Complex UI**: Create login forms, navigation bars, cards
  - **Canvas**: Clear canvas, list shapes, get canvas state
- Example commands:
  - "Create a blue rectangle at position 100, 100"
  - "Add text saying 'Hello World'"
  - "Create a 3x3 grid of circles"
  - "Create a login form"
  - "Align all shapes left"
  - "Scale the circle by 2x"
  - "Create a primary button with text 'Submit'"

### Export
- Export canvas as PNG (high-quality raster)
- Export canvas as SVG (scalable vector)
- Export canvas as JSON (backup/restore)

### Advanced Features
- Layers panel with visibility and lock controls
- Property panel for precise editing
- Alignment and distribution tools
- Shape grouping and ungrouping
- Z-index management (bring to front/send to back)
- Version history with save/restore points
- Smart guides with snap-to-shape
- Component/symbol system for reusable elements
- Design tokens (color palette, text styles)
- Blend mode support for advanced compositing
- Shadow effects with customizable properties

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript 5, Tailwind CSS
- **Canvas**: Konva.js / react-konva
- **State Management**: Zustand with subscribeWithSelector
- **Authentication**: Firebase Auth (Email/Password, Google)
- **Database**: Firebase Firestore (shapes), Firebase Realtime Database (cursors/presence)
- **AI**: OpenAI GPT-4o with function calling
- **Testing**: Jest, React Testing Library, Playwright (E2E)

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

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password and Google sign-in
3. Create a Firestore database
4. Create a Realtime Database
5. Copy your Firebase config to `.env.local`

### Firebase Security Rules

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

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run E2E tests with Playwright
npm run test:e2e:ui  # Run E2E tests with Playwright UI
```

## Deployment on Vercel

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - All `NEXT_PUBLIC_FIREBASE_*` variables
   - `OPENAI_API_KEY`
4. Deploy

The project is configured for seamless Vercel deployment with:
- Automatic builds from Git pushes
- Environment variable support
- Edge functions for API routes
- Optimized builds with Turbopack

## Project Structure

```
src/
  app/                    # Next.js app router
    api/ai/route.ts       # AI API endpoint
    page.tsx              # Main entry point
  components/
    canvas/               # Canvas components
      Canvas.tsx          # Main canvas with Konva
      CanvasShape.tsx     # Shape renderer (with blend modes, shadows)
      Grid.tsx            # Grid overlay
      SmartGuides.tsx     # Alignment guides
      CommentMarker.tsx   # Comment indicators
    toolbar/              # Toolbar and property panel
    panels/               # Layers, presence, comments, version history
    auth/                 # Authentication components
    ai/                   # AI chat interface
  hooks/                  # Custom React hooks
    useAuth.ts            # Authentication hook
    useRealtimeSync.ts    # Real-time sync hook
    useAIAgent.ts         # AI agent hook
  store/                  # Zustand stores
    canvasStore.ts        # Canvas state (shapes, history, selection)
    userStore.ts          # User state (presence, cursors)
    commentStore.ts       # Comments state
    componentStore.ts     # Components and design tokens
  lib/
    firebase/             # Firebase configuration
    ai/                   # AI agent implementation (24+ tools)
    exportUtils.ts        # PNG/SVG/JSON export utilities
    smartGuidesUtils.ts   # Snap guide calculations
  types/                  # TypeScript types (with blend modes, components)
  __tests__/              # Unit test files (110+ tests)
e2e/                      # Playwright E2E tests
```

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
| Cmd/Ctrl+\ | Toggle layers panel |
| Cmd/Ctrl+P | Toggle properties panel |
| Cmd/Ctrl+Shift+E | Export as PNG |

## Performance

- 60 FPS canvas rendering
- <100ms object synchronization
- <50ms cursor synchronization
- Support for 500+ objects on canvas
- 5+ concurrent users
- Debounced shape syncing
- Throttled cursor updates
- Lazy Firebase initialization

## Testing

Run the test suite:
```bash
npm test           # Unit tests (110+ tests)
npm run test:e2e   # E2E tests with Playwright
```

Test coverage includes:
- Canvas store operations (add, update, delete, select, undo/redo)
- User store state management
- Comment store CRUD operations
- Component store (components, design tokens)
- Export utilities (SVG, JSON)
- Smart guides calculations
- Component rendering
- E2E tests for page loading, toolbar, keyboard shortcuts

## License

MIT
