import { useState, useEffect } from 'react';
import { DEBOUNCE_DELAY_MS } from '../config/constants';

export function useDebounce(value, delay = DEBOUNCE_DELAY_MS) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}
