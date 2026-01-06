import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export function initWebVitals() {
    // Core Web Vitals
    onCLS((metric) => {
        console.log('CLS:', metric);
        sendToAnalytics(metric);
    });

    onFID((metric) => {
        console.log('FID:', metric);
        sendToAnalytics(metric);
    });

    onLCP((metric) => {
        console.log('LCP:', metric);
        sendToAnalytics(metric);
    });

    // Additional metrics
    onFCP((metric) => {
        console.log('FCP:', metric);
        sendToAnalytics(metric);
    });

    onTTFB((metric) => {
        console.log('TTFB:', metric);
        sendToAnalytics(metric);
    });

    onINP((metric) => {
        console.log('INP:', metric);
        sendToAnalytics(metric);
    });
}

function sendToAnalytics(metric: any) {
    // Send to analytics service (Google Analytics, custom endpoint, etc.)
    const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
    });

    // Example: send to custom endpoint
    if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/web-vitals', body);
    } else {
        fetch('/api/analytics/web-vitals', {
            method: 'POST',
            body,
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
        }).catch(console.error);
    }
}

// Custom performance observer for offline operations
export function trackOfflineOperation(operationName: string, duration: number) {
    const metric = {
        name: `offline_${operationName}`,
        value: duration,
        timestamp: Date.now(),
    };

    console.log('Offline Operation:', metric);

    // Store locally and send when back online
    try {
        const stored = localStorage.getItem('offline_metrics') || '[]';
        const metrics = JSON.parse(stored);
        metrics.push(metric);
        localStorage.setItem('offline_metrics', JSON.stringify(metrics));
    } catch (e) {
        console.error('Failed to store metric:', e);
    }
}

// Flush offline metrics when coming back online
export function flushOfflineMetrics() {
    try {
        const stored = localStorage.getItem('offline_metrics');
        if (!stored) return;

        const metrics = JSON.parse(stored);
        if (metrics.length === 0) return;

        fetch('/api/analytics/offline-metrics', {
            method: 'POST',
            body: JSON.stringify({ metrics }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(() => {
                localStorage.removeItem('offline_metrics');
                console.log(`Flushed ${metrics.length} offline metrics`);
            })
            .catch(console.error);
    } catch (e) {
        console.error('Failed to flush metrics:', e);
    }
}
