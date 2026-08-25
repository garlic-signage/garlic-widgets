/**
 * Cache
 * localStorage-based cache with TTL.
 * Default TTL: 1 hour.
 */
export class Cache {
    #ttl;
    #prefix;

    /**
     * @param {number} ttlMs - Time-to-live in milliseconds (default: 3600000 = 1h)
     */
    constructor(ttlMs = 60 * 60 * 1000) {
        this.#ttl = ttlMs;
        this.#prefix = 'weather_widget_';
    }

    /**
     * Get value from cache. Returns null if not found or expired.
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {
        try {
            const raw = localStorage.getItem(this.#prefix + key);
            if (!raw) return null;

            const entry = JSON.parse(raw);
            if (Date.now() > entry.expiresAt) {
                this.delete(key);
                return null;
            }
            return entry.value;
        } catch {
            return null;
        }
    }

    /**
     * Write value to cache.
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
        try {
            const entry = {value, expiresAt: Date.now() + this.#ttl};
            localStorage.setItem(this.#prefix + key, JSON.stringify(entry));
        } catch (e) {
            // localStorage full or unavailable — fail silently
            console.warn('Cache: Write failed.', e);
        }
    }

    /**
     * @param {string} key
     */
    delete(key) {
        localStorage.removeItem(this.#prefix + key);
    }

    /**
     * Clear all weather widget cache entries.
     */
    clear() {
        Object.keys(localStorage)
            .filter(k => k.startsWith(this.prefix))
            .forEach(k => localStorage.removeItem(k));
    }

    /**
     * Build a cache key from request parameters.
     * @param {string}      provider
     * @param {string|null} city
     * @param {number|null} lat
     * @param {number|null} lon
     * @returns {string}
     */
    static buildKey(provider, city, lat, lon) {
        if (lat !== null && lon !== null) return `${provider}_${lat}_${lon}`;
        return `${provider}_${city.toLowerCase().trim()}`;
    }
}
