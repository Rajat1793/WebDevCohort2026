'use strict';

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const USERS_FILE = path.join(__dirname, '../../config/users.json');

// Load users from disk; fall back to empty array if file is missing
function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

// Persist the in-memory array to disk so registrations survive restarts
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Mutable in-memory array backed by config/users.json
let USERS = loadUsers();

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff&size=128`;
}

class Account {
  constructor(user) {
    this.accountId = user.id;
    this.user = user;
  }

  // Called by oidc-provider to populate ID token and userinfo claims
  async claims(use, scope) {
    return {
      sub: this.accountId,
      name: this.user.name,
      preferred_username: this.user.username,
      email: this.user.email,
      email_verified: true,
      picture: avatarUrl(this.user.name),
      updated_at: Math.floor(Date.now() / 1000),
    };
  }

  // Called by oidc-provider when it needs to look up an account (e.g., from a token)
  static async findAccount(ctx, id) {
    const user = USERS.find((u) => u.id === id);
    if (!user) return undefined;
    return new Account(user);
  }

  // Verify credentials during the login interaction
  static async authenticate(username, password) {
    const user = USERS.find(
      (u) => u.username === username || u.email === username,
    );
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    return new Account(user);
  }

  // Register a new user during the register interaction
  static async register({ username, email, password, name }) {
    // Reload from disk so any out-of-process changes are picked up
    USERS = loadUsers();

    const dupUsername = USERS.find((u) => u.username === username);
    const dupEmail    = USERS.find((u) => u.email    === email);

    console.log('[Register] attempt:', { username, email });
    console.log('[Register] dup check — username match:', dupUsername?.username, '| email match:', dupEmail?.email);

    if (dupUsername) {
      throw new Error('Username already taken — try a different username or log in');
    }
    if (dupEmail) {
      throw new Error('Email already registered — try logging in instead');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: randomUUID(),
      username,
      email,
      password: hashed,
      name: name || username,
    };
    USERS.push(user);
    saveUsers(USERS);

    console.log('[Register] new user saved:', username, '(id:', user.id, ')');
    return new Account(user);
  }
}

module.exports = Account;
