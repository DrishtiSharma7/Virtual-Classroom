const { MemoryCache } = require("./cache");
const {
  cacheMiddleware,
  invalidateCache,
  invalidateOnSuccess,
} = require("../middleware/cache.middleware");

describe("MemoryCache Utility", () => {
  let cache;

  beforeEach(() => {
    cache = new MemoryCache({ maxItems: 3, defaultTTL: 2, cleanupIntervalMs: 0 });
  });

  afterEach(() => {
    cache.destroy();
  });

  test("stores and retrieves values correctly", () => {
    cache.set("key1", { data: 123 }, 10);
    expect(cache.get("key1")).toEqual({ data: 123 });
    expect(cache.has("key1")).toBe(true);
  });

  test("returns null for non-existent keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
    expect(cache.has("nonexistent")).toBe(false);
  });

  test("expires values after TTL", async () => {
    cache.set("shortKey", "hello", 0.05); // 50ms TTL
    expect(cache.get("shortKey")).toBe("hello");

    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(cache.get("shortKey")).toBeNull();
  });

  test("evicts oldest items when maxItems is reached (LRU)", () => {
    cache.set("a", 1, 10);
    cache.set("b", 2, 10);
    cache.set("c", 3, 10);

    // Reading 'a' marks it as recently used
    cache.get("a");

    // Adding 4th item should evict 'b' (oldest unread item)
    cache.set("d", 4, 10);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeNull();
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  test("delPrefix deletes all matching keys", () => {
    cache.set("dashboard:1", "data1", 10);
    cache.set("dashboard:2", "data2", 10);
    cache.set("analytics:1", "data3", 10);

    const deleted = cache.delPrefix("dashboard:");
    expect(deleted).toBe(2);
    expect(cache.get("dashboard:1")).toBeNull();
    expect(cache.get("dashboard:2")).toBeNull();
    expect(cache.get("analytics:1")).toBe("data3");
  });

  test("wrap executes fetchFn only once when cached", async () => {
    const fetchFn = jest.fn().mockResolvedValue({ count: 42 });

    const first = await cache.wrap("computed", fetchFn, 10);
    const second = await cache.wrap("computed", fetchFn, 10);

    expect(first).toEqual({ count: 42 });
    expect(second).toEqual({ count: 42 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test("tracks hits, misses and hitRate in getStats", () => {
    cache.set("hitKey", "value", 10);
    cache.get("hitKey"); // hit
    cache.get("missKey"); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe("0.50");
  });
});

describe("Cache Middleware", () => {
  beforeEach(() => {
    invalidateCache(["test", "api"]);
  });

  test("intercepts 200 responses and caches them", () => {
    const middleware = cacheMiddleware({ ttl: 60, prefix: "test" });

    const req = {
      method: "GET",
      originalUrl: "/test-endpoint",
      headers: {},
      user: { id: "user1", role: "teacher" },
    };

    let setHeaders = {};
    const res = {
      statusCode: 200,
      setHeader: (name, val) => {
        setHeaders[name] = val;
      },
      json: jest.fn((body) => body),
    };

    const next = jest.fn(() => {
      // Simulate controller sending response
      res.json({ message: "Hello World" });
    });

    // First request - MISS
    middleware(req, res, next);
    expect(setHeaders["X-Cache"]).toBe("MISS");
    expect(res.json).toHaveBeenCalledWith({ message: "Hello World" });

    // Second request - HIT
    let hitHeaders = {};
    const resHit = {
      statusCode: 200,
      setHeader: (name, val) => {
        hitHeaders[name] = val;
      },
      json: jest.fn((body) => body),
    };
    const nextHit = jest.fn();

    middleware(req, resHit, nextHit);
    expect(hitHeaders["X-Cache"]).toBe("HIT");
    expect(resHit.json).toHaveBeenCalledWith({ message: "Hello World" });
    expect(nextHit).not.toHaveBeenCalled();
  });

  test("bypasses caching when X-Skip-Cache header is present", () => {
    const middleware = cacheMiddleware({ ttl: 60, prefix: "test" });
    const req = {
      method: "GET",
      originalUrl: "/test-endpoint",
      headers: { "x-skip-cache": "true" },
      user: { id: "user1" },
    };

    let setHeaders = {};
    const res = {
      setHeader: (name, val) => {
        setHeaders[name] = val;
      },
      json: jest.fn(),
    };
    const next = jest.fn();

    middleware(req, res, next);
    expect(setHeaders["X-Cache"]).toBe("BYPASS");
    expect(next).toHaveBeenCalled();
  });

  test("ignores non-GET requests", () => {
    const middleware = cacheMiddleware({ ttl: 60, prefix: "test" });
    const req = { method: "POST" };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  test("invalidateCache removes matching cached keys", () => {
    const middleware = cacheMiddleware({ ttl: 60, prefix: "test" });
    const req = {
      method: "GET",
      originalUrl: "/test-resource",
      headers: {},
      user: { id: "user99" },
    };

    const res = {
      statusCode: 200,
      setHeader: jest.fn(),
      json: jest.fn((body) => body),
    };

    middleware(req, res, () => {
      res.json({ status: "ok" });
    });

    // Invalidate
    invalidateCache("test");

    // Next request should be MISS
    let newHeaders = {};
    const res2 = {
      statusCode: 200,
      setHeader: (name, val) => {
        newHeaders[name] = val;
      },
      json: jest.fn((body) => body),
    };
    const next2 = jest.fn();

    middleware(req, res2, next2);
    expect(newHeaders["X-Cache"]).toBe("MISS");
  });

  test("invalidateOnSuccess invalidates cache when response is successful", () => {
    const readMiddleware = cacheMiddleware({ ttl: 60, prefix: "resource" });
    const invalidateMiddleware = invalidateOnSuccess("resource");

    const getReq = {
      method: "GET",
      originalUrl: "/items",
      headers: {},
      user: { id: "user1" },
    };

    // Cache an item
    const getRes = {
      statusCode: 200,
      setHeader: jest.fn(),
      json: jest.fn((body) => body),
    };
    readMiddleware(getReq, getRes, () => {
      getRes.json({ items: [1, 2, 3] });
    });

    // Verify it is cached
    const hitRes = {
      statusCode: 200,
      setHeader: jest.fn(),
      json: jest.fn((body) => body),
    };
    readMiddleware(getReq, hitRes, jest.fn());
    expect(hitRes.setHeader).toHaveBeenCalledWith("X-Cache", "HIT");

    // Perform mutation with invalidateOnSuccess
    const postReq = { method: "POST" };
    const postRes = {
      statusCode: 201,
      json: jest.fn((body) => body),
    };
    invalidateMiddleware(postReq, postRes, () => {
      postRes.json({ created: true });
    });

    // Verify cache was cleared
    const afterRes = {
      statusCode: 200,
      setHeader: jest.fn(),
      json: jest.fn((body) => body),
    };
    readMiddleware(getReq, afterRes, jest.fn());
    expect(afterRes.setHeader).toHaveBeenCalledWith("X-Cache", "MISS");
  });
});
