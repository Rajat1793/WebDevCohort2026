'use strict';

// In-memory adapter for oidc-provider.
// For production, replace with a Redis or database adapter.

const store = new Map();
const grantable = new Set(['AccessToken','AuthorizationCode','RefreshToken','DeviceCode','BackchannelAuthenticationRequest']);

class MemoryAdapter {
  constructor(name) { this.name = name; }

  key(id) { return `${this.name}:${id}`; }

  async upsert(id, payload, expiresIn) {
    const key = this.key(id);
    if (this.name === 'Session') {
      store.set(key, { payload, expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined });
    } else {
      const existing = store.get(key) || {};
      store.set(key, { payload: { ...existing.payload, ...payload }, expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined });
    }
  }

  async find(id) {
    const data = store.get(this.key(id));
    if (!data) return undefined;
    if (data.expiresAt && Date.now() > data.expiresAt) { store.delete(this.key(id)); return undefined; }
    return data.payload;
  }

  async findByUserCode(userCode) {
    for (const [, { payload }] of store) {
      if (payload?.userCode === userCode) return payload;
    }
  }

  async findByUid(uid) {
    for (const [, { payload }] of store) {
      if (payload?.uid === uid) return payload;
    }
  }

  async consume(id) {
    const data = store.get(this.key(id));
    if (data) data.payload.consumed = Math.floor(Date.now() / 1000);
  }

  async destroy(id) { store.delete(this.key(id)); }

  async revokeByGrantId(grantId) {
    for (const [key, { payload }] of store) {
      if (payload?.grantId === grantId) store.delete(key);
    }
  }
}

module.exports = MemoryAdapter;
