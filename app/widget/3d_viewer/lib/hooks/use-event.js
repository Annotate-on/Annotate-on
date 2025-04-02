import {useCallback, useEffect} from 'react';

function useEventListener(eventName, handler) {
    useEffect(() => {
        window.addEventListener(eventName, handler);

        // Remove event listener on cleanup
        return () => {
            window.removeEventListener(eventName, handler);
        };
    }, [eventName, handler]); // Re-run if eventName or handler changes
}

// Event trigger function
function useEventTrigger(eventName) {
    return useCallback(
        (detail) => {
            const event = new CustomEvent(eventName, {detail});
            window.dispatchEvent(event);
        },
        [eventName]
    );
}

export { useEventListener, useEventTrigger };
