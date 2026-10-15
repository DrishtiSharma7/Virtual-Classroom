const { cache } = require("../utils/cache");

/**
 * Default cache key generator:
 * Uses prefix, authenticated user ID/role, and req.originalUrl (which includes query params).
 */
function defaultKeyGenerator(prefix, req) {
  const userId = req.user?.id || req.user?._id || "anon";
  const userRole = req.user?.role || "user";
  const url = req.originalUrl || req.url;
  return `${prefix}:${userId}:${userRole}:${url}`;
}

/**
 * Express caching middleware for GET requests.
 *
 * @param {Object} options
 * @param {number} options.ttl - TTL in seconds (default: 60)
 * @param {string} options.prefix - Cache key prefix namespace (default: "api")
 * @param {Function} options.keyGenerator - Custom key generator function (optional)
 */
function cacheMiddleware({ ttl = 60, prefix = "api", keyGenerator } = {}) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Allow cache bypass with header if needed (e.g. for forced refresh)
    if (req.headers["x-skip-cache"] === "true") {
      res.setHeader("X-Cache", "BYPASS");
      return next();
    }

    const key = keyGenerator
      ? keyGenerator(req)
      : defaultKeyGenerator(prefix, req);

    try {
      const cached = cache.get(key);

      if (cached !== null) {
        res.setHeader("X-Cache", "HIT");
        // Ensure proper content type
        if (typeof cached === "object") {
          return res.json(cached);
        }
        return res.send(cached);
      }
    } catch (err) {
      // If cache lookup ever errors, fail open to avoid disrupting the request
      console.error("[Cache] Read error:", err);
    }

    res.setHeader("X-Cache", "MISS");

    // Intercept res.json to capture response body
    const originalJson = res.json;
    res.json = function (body) {
      // Restore original method
      res.json = originalJson;

      // Only cache successful 2xx responses
      if (res.statusCode >= 200 && res.statusCode < 300 && body !== undefined) {
        try {
          cache.set(key, body, ttl);
        } catch (err) {
          console.error("[Cache] Write error:", err);
        }
      }

      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Invalidate cache entries by prefix or exact key.
 *
 * @param {string|string[]} prefixes - Prefix or array of prefixes to invalidate
 */
function invalidateCache(prefixes) {
  const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
  let totalInvalidated = 0;

  for (const prefix of prefixList) {
    if (prefix) {
      totalInvalidated += cache.delPrefix(prefix);
    }
  }

  return totalInvalidated;
}

/**
 * Middleware that invalidates designated cache prefixes when a mutation request succeeds (2xx).
 *
 * @param {string|string[]} prefixes - Cache prefix or array of prefixes to invalidate
 */
function invalidateOnSuccess(prefixes) {
  return (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
      res.json = originalJson;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          invalidateCache(prefixes);
        } catch (err) {
          console.error("[Cache] Invalidation error:", err);
        }
      }

      return originalJson.call(this, body);
    };

    next();
  };
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateOnSuccess,
  cache,
};
