"use client"
import {
  useCallback,
  useMemo,
  useSyncExternalStore,
  type SetStateAction,
} from "react"
const fallback = new Map<string, string>()
function read(key: string) {
  if (fallback.has(key)) return fallback.get(key)!
  try {
    return localStorage.getItem(key) || "[]"
  } catch {
    return "[]"
  }
}
function parse<T>(raw: string, valid: (value: unknown) => value is T): T[] {
  try {
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(valid).slice(0, 100) : []
  } catch {
    return []
  }
}
export function useLocalList<T>(
  key: string,
  valid: (value: unknown) => value is T
) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const storage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) {
          fallback.delete(key)
          notify()
        }
      }
      window.addEventListener("storage", storage)
      window.addEventListener(`crownhouse:${key}`, notify)
      return () => {
        window.removeEventListener("storage", storage)
        window.removeEventListener(`crownhouse:${key}`, notify)
      }
    },
    [key]
  )
  const snapshot = useSyncExternalStore(
    subscribe,
    useCallback(() => read(key), [key]),
    () => "[]"
  )
  const list = useMemo(() => parse(snapshot, valid), [snapshot, valid])
  const setList = useCallback(
    (update: SetStateAction<T[]>) => {
      const previous = parse(read(key), valid)
      const next = typeof update === "function" ? update(previous) : update
      const value = JSON.stringify(next.slice(0, 100))
      try {
        localStorage.setItem(key, value)
        fallback.delete(key)
      } catch {
        fallback.set(key, value)
      }
      window.dispatchEvent(new Event(`crownhouse:${key}`))
    },
    [key, valid]
  )
  return [list, setList] as const
}
