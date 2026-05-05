'use strict';

const bcrypt = require('bcryptjs');

// Demo user store. In production, use a database.
// All passwords are "password123"
const USERS = [
  {
    id: '1',
    username: 'alice',
    email: 'alice@example.com',
    password: bcrypt.hashSync('password123', 10),
    name: 'Alice Smith',
  },
  {
    id: '2',
    username: 'bob',
    email: 'bob@example.com',
    password: bcrypt.hashSync('password123', 10),
    name: 'Bob Jones',
  },
  {
    id: '3',
    username: 'charlie',
    email: 'charlie@example.com',
    password: bcrypt.hashSync('password123', 10),
    name: 'Charlie Davis',
  },
];

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
    if (USERS.find((u) => u.username === username || u.email === email)) {
      throw new Error('Username or email already exists');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: String(USERS.length + 1),
      username,
      email,
      password: hashed,
      name: name || username,
    };
    USERS.push(user);
    return new Account(user);
  }
}

module.exports = Account;
