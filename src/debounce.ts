/**
 * Debounce utility function.
 *
 * @param func The function that should be debounced.
 * @param wait The number of milliseconds to wait before calling `func`.
 * @returns A debounced version of `func`.
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait = 300) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function debouncedFunction(...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, wait);
    };
}
