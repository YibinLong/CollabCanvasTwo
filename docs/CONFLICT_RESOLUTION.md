# Conflict Resolution Strategy

## Overview

CollabCanvas implements a **Last-Write-Wins (LWW)** conflict resolution strategy for real-time collaborative editing. This document explains how the system handles concurrent edits and maintains consistency across all connected users.

## Strategy: Last-Write-Wins (LWW)

### Why LWW?

For a real-time collaborative canvas application, LWW provides:
- **Simplicity**: Easy to implement and understand
- **Low latency**: No complex merge operations required
- **Predictability**: Users always see the most recent change
- **Good UX**: Changes appear immediately without blocking

### How It Works

1. **Timestamp-based Resolution**: Each shape update includes a server timestamp from Firebase
2. **Optimistic Updates**: Changes appear immediately in the local UI
3. **Server Arbitration**: Firebase Firestore and Realtime Database handle ordering
4. **Automatic Sync**: All clients receive updates in consistent order

## Implementation Details

### Shape Updates

```typescript
// Each shape update includes a server timestamp
await setDoc(shapeRef, {
  ...shape,
  updatedAt: Timestamp.now(),  // Server timestamp for ordering
});
```

When two users edit the same shape simultaneously:
1. Both users see their local changes immediately (optimistic update)
2. Updates are sent to Firebase with server timestamps
3. Firebase broadcasts all changes to all clients in order
4. The last update (by timestamp) becomes the final state
5. All clients converge to the same state

### Cursor Updates

Cursor positions use Firebase Realtime Database for low-latency sync:
- Updates are throttled to ~30ms intervals
- Stale cursor data is automatically cleaned up on disconnect
- No conflict resolution needed (each user has their own cursor)

### Presence Management

User presence uses automatic cleanup:
```typescript
// Set up disconnect cleanup
onDisconnect(presenceRef).remove();
onDisconnect(cursorRef).remove();
```

## Conflict Scenarios

### Scenario 1: Simultaneous Move

**User A** and **User B** both drag the same rectangle at the same time.

**Resolution:**
- Both users see their own drag in real-time (optimistic)
- When they release, the last position update wins
- Both users converge to the same final position

### Scenario 2: Rapid Edit Storm

**User A** resizes an object while **User B** changes its color while **User C** moves it.

**Resolution:**
- All changes are processed independently
- Each property update is atomic
- Final state includes: A's size, B's color, C's position
- No data loss for non-conflicting properties

### Scenario 3: Delete vs Edit Race

**User A** deletes an object while **User B** is actively editing it.

**Resolution:**
- If delete arrives first: Object is removed, B's edit is lost
- If edit arrives first: Edit is applied, then object is deleted
- User B sees the object disappear (delete wins)

### Scenario 4: Create Collision

Two users create objects at nearly identical timestamps.

**Resolution:**
- Each object has a unique ID (nanoid)
- Both objects are created successfully
- No collision possible

## Visual Feedback

### Connection Status Indicator

The UI shows real-time connection status:
- **Green dot**: Connected
- **Yellow dot (pulsing)**: Connecting/Reconnecting
- **Red dot**: Disconnected

### Last Editor Tracking

Each shape tracks:
- `createdBy`: User who created the shape
- `lastEditedBy`: User who last modified the shape
- `updatedAt`: Timestamp of last modification

## Persistence & Reconnection

### State Persistence

- All canvas state is persisted in Firebase Firestore
- Shapes survive all users disconnecting
- No data loss on browser refresh

### Reconnection Handling

1. **Connection Lost**:
   - Connection status shows "disconnected"
   - Local changes are queued

2. **Reconnection**:
   - Status shows "reconnecting"
   - Queued changes are synced
   - Full state is reconciled

3. **Connection Restored**:
   - Status shows "connected"
   - All users see consistent state

## Performance Considerations

### Debouncing

Shape updates are debounced (100ms) to reduce write frequency:
```typescript
const timeout = setTimeout(() => {
  syncShapeToFirestore(shape);
}, 100);
```

### Cursor Throttling

Cursor updates are throttled to maximum 30 updates/second:
```typescript
cursorUpdateTimeout.current = setTimeout(() => {
  // Update cursor
}, 30);
```

### Batch Operations

Multiple shape changes can be batched:
```typescript
const batch = writeBatch(db);
shapesToSync.forEach((shape) => {
  batch.set(shapeRef, shape);
});
await batch.commit();
```

## Trade-offs

### Advantages of LWW

1. **Simple implementation**: No complex merge logic
2. **Low latency**: Changes appear immediately
3. **Predictable behavior**: Last change always wins
4. **Firebase native**: Works well with Firestore/RTDB

### Limitations

1. **Potential data loss**: Concurrent edits to same property
2. **No automatic merging**: Can't combine concurrent changes
3. **Race conditions**: Delete can win over edit

### Mitigations

1. **Property-level updates**: Only changed properties are updated
2. **Unique IDs**: No ID collision possible
3. **Visual feedback**: Users see who last edited each shape
4. **Undo/Redo**: Users can recover from unwanted changes

## Future Improvements

For more sophisticated conflict resolution, consider:

1. **CRDT (Conflict-free Replicated Data Types)**:
   - Automatic merge without conflicts
   - Better for text editing

2. **Operational Transformation (OT)**:
   - Transform concurrent operations
   - Used by Google Docs

3. **Vector Clocks**:
   - Track causality of changes
   - Detect true conflicts

## References

- [Firebase Realtime Database Transactions](https://firebase.google.com/docs/database/web/read-and-write#save_data_as_transactions)
- [Firestore Data Contention](https://firebase.google.com/docs/firestore/best-practices#updates_in_transactions)
- [Martin Kleppmann - Designing Data-Intensive Applications](https://dataintensive.net/)
