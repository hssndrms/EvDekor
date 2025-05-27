
import { useState, useEffect } from 'react';

// T is the type of the value being stored
function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T) // initialValue can be T or a function that returns T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // This function is the initializer for useState. It runs once on mount.
    // It needs to return a value of type T.
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T; // Found in localStorage
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      // Fall through to use initialValue if reading from localStorage fails
    }

    // Not found in localStorage or error during read. Use initialValue.
    if (typeof initialValue === 'function') {
      // If initialValue is a function, call it to get the actual value.
      return (initialValue as () => T)();
    } else {
      // If initialValue is a direct value, use it.
      return initialValue;
    }
  });

  // Effect to update localStorage when storedValue changes
  useEffect(() => {
    try {
      // storedValue is of type T.
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
