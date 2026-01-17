'use client';

import { useEffect } from 'react';

/**
 * Next-Gen Car Damage Detection: Service Worker Cleaner
 * 
 * This component ensures that any stale service workers from other projects
 * running on the same origin (e.g., localhost:3000) are cleared.
 * This prevents the "sw.js:80 Uncaught (in promise) ReferenceError: _async_to_generator" error.
 */
export default function ServiceWorkerCleaner() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const clean = async () => {
                let changed = false;

                // 1. Unregister Service Workers
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    if (registrations.length > 0) {
                        await Promise.all(registrations.map(r => r.unregister()));
                        console.log('[SW] Cleared', registrations.length, 'workers');
                        changed = true;
                    }
                }

                // 2. Clear Caches (Very Important to break SW intercept)
                if ('caches' in window) {
                    const keys = await caches.keys();
                    if (keys.length > 0) {
                        await Promise.all(keys.map(k => caches.delete(k)));
                        console.log('[SW] Cleared', keys.length, 'cache buckets');
                        changed = true;
                    }
                }

                if (changed) {
                    console.log('[SW] System sanitized, reloading...');
                    window.location.reload();
                }
            };

            clean();
        }
    }, []);

    return (
        <div className="fixed bottom-4 left-4 z-[9999] opacity-30">
            <span className="text-[10px] font-mono text-gray-400">Security Sanitizer Active</span>
        </div>
    );
}
