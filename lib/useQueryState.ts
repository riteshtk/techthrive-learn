// State kept in the address (?query), for the static pages: the query is
// read once after mount, then the state is written back with replaceState
// as it changes. Nothing is written until the value read has taken
// effect, so the address never flashes the defaults, and the #hash stays.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export function useQueryState<T>(
  initial: T,
  /** The value a query asks for (location.search), or the default. */
  fromQuery: (search: string) => T,
  /** The query for a value: "" or "?…". */
  toQuery: (value: T) => string,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState({ value: initial, read: false });
  const codec = useRef({ fromQuery, toQuery });
  useEffect(() => {
    codec.current = { fromQuery, toQuery };
  });

  useEffect(() => {
    const asked = codec.current.fromQuery(location.search);
    queueMicrotask(() => setState({ value: asked, read: true }));
  }, []);
  useEffect(() => {
    if (!state.read) return;
    const url = `${location.pathname}${codec.current.toQuery(state.value)}${location.hash}`;
    history.replaceState(history.state, "", url);
  }, [state]);

  const set = useCallback<Dispatch<SetStateAction<T>>>(
    (next) =>
      setState((s) => ({
        ...s,
        value:
          typeof next === "function" ? (next as (prev: T) => T)(s.value) : next,
      })),
    [],
  );
  return [state.value, set, state.read];
}
