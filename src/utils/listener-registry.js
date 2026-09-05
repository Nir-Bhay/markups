const registered = new Set();

export function trackedAddEventListener(target, type, handler, opts) {
    target.addEventListener(type, handler, opts);
    registered.add({ target, type, handler, opts });
    return handler;
}

export function removeAllTrackedListeners() {
    for (const { target, type, handler, opts } of registered) {
        target.removeEventListener(type, handler, opts);
    }
    registered.clear();
}

export function getTrackedCount() {
    return registered.size;
}
