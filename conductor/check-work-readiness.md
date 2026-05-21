# Plan: Implementing 'Check My Work' Readiness State

## Objective
Prevent the "Check My Work" button from being used until the student has actually modified the initial code in the editor.

## Key Changes
1.  **State Tracking:** Introduce a `isEditorDirty` flag in `app.js` for the current lesson.
2.  **UI State Management:**
    *   Initialize the "Check My Work" button as disabled (via `disabled` attribute and visual styling).
    *   Attach an `input` event listener to the editor.
    *   Set `isEditorDirty` to `true` when the content changes and enable the button.
3.  **Reset Logic:** Reset `isEditorDirty` to `false` and disable the button whenever `loadLesson` is called (new lesson).

## Implementation Steps
1.  **Modify `loadLesson` in `app.js`**:
    *   Initialize `isEditorDirty = false`.
    *   Update button styles/attributes to indicate "disabled" (e.g., `opacity-50 cursor-not-allowed`).
2.  **Modify `editor` event listener in `app.js`**:
    *   Update the input listener to set `isEditorDirty = true`.
    *   Enable the button (remove disabled styles/attributes).
3.  **Update `checkWorkBtn` handler**:
    *   Add a check for `isEditorDirty` just to be safe, though UI controls should handle this.

## Verification
*   Verify the button is disabled immediately after loading a lesson.
*   Verify the button becomes enabled after typing one character in the editor.
*   Verify the button returns to disabled state when switching to a different lesson.
