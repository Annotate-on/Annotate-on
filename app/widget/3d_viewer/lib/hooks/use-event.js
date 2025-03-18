import { useEffect, useCallback } from 'react';

function useEventListener(eventName, handler) {
    useEffect(() => {
        window.addEventListener(eventName, handler);

        // Remove event listener on cleanup
        return () => {
            window.removeEventListener(eventName, handler);
        };
    }, [eventName, handler]); // Re-run if eventName or handler changes
}

function useEventTrigger(eventName) {
    // Event trigger function
    const triggerEvent = useCallback(
        (detail) => {
            const event = new CustomEvent(eventName, { detail });
            window.dispatchEvent(event);
        },
        [eventName]
    );

    return triggerEvent;
}

export { useEventListener, useEventTrigger };
