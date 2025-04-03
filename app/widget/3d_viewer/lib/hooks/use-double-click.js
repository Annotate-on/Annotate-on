import { useCallback, useRef } from 'react';

const useDoubleClick = (doubleClick, timeout = 500) => {
    const clickTimeout = useRef(undefined);

    const clearClickTimeout = () => {
        if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;
        }
    };

    return useCallback(
        (event) => {
            if (event.button !== 0) {
                return;
            }

            clearClickTimeout();
            if (event.detail % 2 === 0) {
                doubleClick(event);
            }
        },
        [doubleClick, timeout]
    );
};

export default useDoubleClick;