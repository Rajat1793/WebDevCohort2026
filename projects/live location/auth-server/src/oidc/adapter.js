'use strict';

// In-memory adapter for oidc-provider.
// All adapter instances for different models share the same underlying storage Map.
// In production, replace with a Redis or database adapter.

const storage = new Map();

function grantKeyFor(id) {
  return `grant:${id}`;
}

function sessionUidKeyFor(uid) {
  return `sessionUid:${uid}`;
}

function userCodeKeyFor(userCode) {
  return `userCode:${userCode}`;
}

class MemoryAdapter {
  constructor(name) {
    this.name = name;
  }

  key(id) {
    return `${this.name}:${id}`;
  }

  async upsert(id, payload, expiresIn) {
    const key = this.key(id);

    if (this.name === 'Session') {
      storage.set(sessionUidKeyFor(payload.uid), id);
    }

    const grantId = payload.grantId || (payload.grant && payload.grant.jti);
    if (grantId) {
      const grantKey = grantKeyFor(grantId);
      const existing = storage.get(grantKey);
      if (!existing) {
        storage.set(grantKey, [key]);
      } else {
        existing.push(key);
      }
    }

    if (payload.userCode) {
      storage.set(userCodeKeyFor(payload.userCode), id);
    }

    storage.set(key, {
      payload,
      ...(expiresIn ? { expiresAt: Date.now() + expiresIn * 1000 } : undefined),
    });
  }

  async find(id) {
    const stored = storage.get(this.key(id));
    if (!stored) return undefined;
    const { payload, expiresAt } = stored;
    if (expiresAt && Date.now() > expiresAt) {
      storage.delete(this.key(id));
      return undefined;
    }
    return payload;
  }

  async findByUid(uid) {
    const id = storage.get(sessionUidKeyFor(uid));
    return this.find(id);
  }

  async findByUserCode(userCode) {
    const id = storage.get(userCodeKeyFor(userCode));
    return this.find(id);
  }

  async destroy(id) {
    const key = this.key(id);
    const stored = storage.get(key);
    if (stored) {
      const grantId = stored.payload.grantId || (stored.payload.grant && stored.payload.grant.jti);
      if (grantId) {
        const grantKey = grantKeyFor(grantId);
        const grantKeys = storage.get(grantKey);
        if (grantKeys) {
          const idx = grantKeys.indexOf(key);
          if (idx !== -1) grantKeys.splice(idx, 1);
        }
      }
    }
    storage.delete(key);
  }

  async revokeByGrantId(grantId) {
    const grantKey = grantKeyFor(grantId);
    const keys = storage.get(grantKey);
    if (keys) {
      keys.forEach((key) => storage.delete(key));
      storage.delete(grantKey);
    }
  }

  async consume(id) {
    const stored = storage.get(this.key(id));
    if (stored) {
      stored.payload.consumed = Math.floor(Date.now() / 1000);
    }
  }
}

module.exports = MemoryAdapter;
