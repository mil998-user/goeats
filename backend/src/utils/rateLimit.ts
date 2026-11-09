import { NextFunction, Request, Response } from "express";

interface Counter {
  count: number;
  resetAt: number;
}

const MAX_TRACKED_KEYS = 50000;

// Counters live in memory: they reset on restart and aren't shared between server instances.
export class AttemptLimiter {
  private counters = new Map<string, Counter>();

  constructor(private readonly max: number, private readonly windowMs: number) {}

  private current(key: string) {
    const counter = this.counters.get(key);
    if (counter && counter.resetAt <= Date.now()) {
      this.counters.delete(key);
      return undefined;
    }
    return counter;
  }

  private makeRoom() {
    if (this.counters.size < MAX_TRACKED_KEYS) return;

    const now = Date.now();
    for (const [key, counter] of this.counters) {
      if (counter.resetAt <= now) this.counters.delete(key);
    }

    if (this.counters.size >= MAX_TRACKED_KEYS) {
      const oldestKey = this.counters.keys().next().value;
      if (oldestKey !== undefined) this.counters.delete(oldestKey);
    }
  }

  // Seconds left until the key can try again, 0 when it isn't blocked
  retryAfter(key: string) {
    const counter = this.current(key);
    if (!counter || counter.count < this.max) return 0;
    return Math.ceil((counter.resetAt - Date.now()) / 1000);
  }

  hit(key: string) {
    const counter = this.current(key);
    if (counter) {
      counter.count += 1;
      return;
    }
    this.makeRoom();
    this.counters.set(key, { count: 1, resetAt: Date.now() + this.windowMs });
  }

  forgive(key: string) {
    const counter = this.current(key);
    if (counter) counter.count = Math.max(0, counter.count - 1);
  }

  reset(key: string) {
    this.counters.delete(key);
  }
}

export function sendTooManyAttempts(res: Response, retryAfter: number, message: string) {
  res.setHeader("Retry-After", String(retryAfter));
  return res.status(429).json({ success: false, message });
}

export function limitRequests(max: number, windowMs: number, message: string) {
  const limiter = new AttemptLimiter(max, windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const retryAfter = limiter.retryAfter(key);
    if (retryAfter > 0) {
      return sendTooManyAttempts(res, retryAfter, message);
    }
    limiter.hit(key);
    next();
  };
}
