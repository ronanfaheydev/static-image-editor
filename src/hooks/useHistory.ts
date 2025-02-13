import { useState, useCallback } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialPresent: T) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });
  const [lastModified, setLastModified] = useState<Date>(new Date());

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const undo = useCallback(() => {
    setState((currentState) => {
      if (currentState.past.length === 0) return currentState;

      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((currentState) => {
      if (currentState.future.length === 0) return currentState;

      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const updatePresent = useCallback(
    (newPresent: T | ((currentPresent: T) => T)) => {
      setLastModified(new Date());
      setState((currentState) => {
        const updatedPresent =
          typeof newPresent === "function"
            ? (newPresent as (current: T) => T)(currentState.present)
            : newPresent;

        return {
          past: [...currentState.past, currentState.present],
          present: updatedPresent,
          future: [],
        };
      });
    },
    []
  );

  return {
    state: state.present,
    setState: updatePresent,
    undo,
    redo,
    canUndo,
    canRedo,
    history: state,
    lastModified,
  };
}
