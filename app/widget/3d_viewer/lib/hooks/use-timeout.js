import { useEffect, useRef } from 'react';

function useTimeout(callback, delay, dependencies) {
    const callbackRef = useRef(callback);

    // Update the callback if it changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Set up the timeout
    useEffect(() => {
        const timeout = setTimeout(() => {
            callbackRef.current();
        }, delay);

        // Clear the timeout if the dependencies change
        return () => clearTimeout(timeout);
    }, dependencies);
}

export default useTimeout;