import { useState, useCallback, useEffect } from "react";

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(initialState: T, maxHistory: number = 5) {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const set = useCallback((newPresent: T) => {
    setState(prevState => ({
      past: [...prevState.past.slice(-maxHistory + 1), prevState.present],
      present: newPresent,
      future: [],
    }));
  }, [maxHistory]);

  const undo = useCallback(() => {
    setState(prevState => {
      if (prevState.past.length === 0) return prevState;

      const newPast = prevState.past.slice(0, -1);
      const newPresent = prevState.past[prevState.past.length - 1];
      const newFuture = [prevState.present, ...prevState.future];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prevState => {
      if (prevState.future.length === 0) return prevState;

      const newPresent = prevState.future[0];
      const newFuture = prevState.future.slice(1);
      const newPast = [...prevState.past, prevState.present];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    state: state.present,
    setState: set,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
