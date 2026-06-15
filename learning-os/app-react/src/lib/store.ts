import { useEffect, useState } from "react";
import { defaultState, type State } from "./engine";

const KEY = "moneyzoo.v1";

export function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    return defaultState();
  }
}

/** React state hook that persists to localStorage.
 *  (Capacitor uses the webview's localStorage; can swap to @capacitor/preferences later.) */
export function usePersistentState(): [State, React.Dispatch<React.SetStateAction<State>>] {
  const [state, setState] = useState<State>(loadState);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  return [state, setState];
}
