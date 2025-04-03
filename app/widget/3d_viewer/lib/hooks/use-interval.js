import { useEffect, useRef } from 'react';

function useInterval(callback, delay) {
    const callbackRef = useRef(callback);

    // Update the callback if it changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Set up the interval
    useEffect(() => {
        const interval = setInterval(() => {
            callbackRef.current();
        }, delay);

        // Clear the interval if the delay changes
        return () => clearInterval(interval);
    }, [delay]);
}

export default useInterval;