# CollabCanvas

A real-time collaborative design tool with AI-powered canvas manipulation. Built with Next.js, Firebase, and OpenAI.

## Features

### Canvas
- Pan and zoom with smooth scrolling
- Multiple shape types: rectangles, circles, triangles, stars, lines, text
- Shape transformations: move, resize, rotate, scale
- Multi-select with shift-click or selection box
- Keyboard shortcuts for quick actions
- Grid and snap-to-grid support
- Undo/redo history

### Real-time Collaboration
- Live cursor tracking across users
- Real-time shape synchronization
- Presence indicators showing online users
- Optimistic updates for responsive feel
- Conflict resolution with last-write-wins

### AI Canvas Agent
- Natural language commands to create and modify shapes
- Supported commands:
  - Create shapes: "Create a blue rectangle at position 100, 100"
  - Create text: "Add text saying 'Hello World'"
  - Move shapes: "Move the rectangle to 200, 300"
  - Resize shapes: "Make the circle bigger"
  - Change colors: "Change the rectangle to red"
  - Delete shapes: "Delete the star"
  - Arrange shapes: "Create a 3x3 grid of circles"
  - Create UI components: "Create a login form"

### Advanced Features
- Layers panel with visibility and lock controls
- Property panel for precise editing
- Alignment and distribution tools
- Shape grouping and ungrouping
- Z-index management (bring to front/send to back)
- Export to PNG/SVG (client-side)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Canvas**: Konva.js / react-konva
- **State Management**: Zustand
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore (shapes), Firebase Realtime Database (cursors/presence)
- **AI**: OpenAI GPT-4o with function calling

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
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## Deployment on Vercel

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

The project is configured for seamless Vercel deployment with:
- Automatic builds from Git pushes
- Environment variable support
- Edge functions for API routes

## Project Structure

```
src/
  app/                    # Next.js app router
    api/ai/route.ts       # AI API endpoint
    page.tsx              # Main entry point
  components/
    canvas/               # Canvas components (Canvas, CanvasShape, Grid, etc.)
    toolbar/              # Toolbar and property panel
    panels/               # Layers and presence panels
    auth/                 # Authentication components
    ai/                   # AI chat interface
  hooks/                  # Custom React hooks
    useAuth.ts            # Authentication hook
    useRealtimeSync.ts    # Real-time sync hook
    useAIAgent.ts         # AI agent hook
  store/                  # Zustand stores
    canvasStore.ts        # Canvas state
    userStore.ts          # User state
  lib/
    firebase/             # Firebase configuration
    ai/                   # AI agent implementation
  types/                  # TypeScript types
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| V | Select tool |
| H | Hand/pan tool |
| R | Rectangle tool |
| C | Circle tool |
| T | Text tool |
| Delete/Backspace | Delete selected |
| Escape | Deselect all |
| Cmd/Ctrl+Z | Undo |
| Cmd/Ctrl+Shift+Z | Redo |

## Performance

- 60 FPS canvas rendering
- <100ms object synchronization
- <50ms cursor synchronization
- Debounced shape syncing
- Throttled cursor updates
- Lazy Firebase initialization

## License

MIT
