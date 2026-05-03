'use strict';

const bcrypt = require('bcryptjs');
const path   = require('path');

const USERS_FILE = process.env.USERS_FILE || path.join(__dirname, '../config/users.json');
let users = [];

function loadUsers() {
  try {
    delete require.cache[require.resolve(USERS_FILE)];
    users = require(USERS_FILE);
  } catch {
    users = [];
  }
}

loadUsers();

const Accounts = {
  findAccount: async (ctx, id) => {
    const u = users.find(u => u.id === id);
    if (!u) return undefined;
    return {
      accountId: u.id,
      async claims(use, scope) {
        const base = { sub: u.id };
        if (scope.includes('profile')) {
          Object.assign(base, {
            name: u.name,
            preferred_username: u.username,
            picture: u.avatar || null,
            updated_at: Math.floor(Date.now() / 1000),
          });
        }
        if (scope.includes('email')) {
          Object.assign(base, {
            email: u.email,
            email_verified: true,
          });
        }
        return base;
      },
    };
  },

  authenticate: async (username, password) => {
    loadUsers(); // reload on each auth so adding users doesn't need restart
    const u = users.find(u => u.username === username || u.email === username);
    if (!u) return null;
    const ok = await bcrypt.compare(password, u.password);
    return ok ? u.id : null;
  },

  register: async ({ username, name, email, password }) => {
    loadUsers();
    if (users.find(u => u.username === username || u.email === email)) {
      throw new Error('Username or email already taken');
    }
    const fs   = require('fs');
    const hash = await bcrypt.hash(password, 10);
    const newUser = {
      id: 'user_' + Date.now(),
      username,
      name: name || username,
      email,
      password: hash,
    };
    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return newUser.id;
  },
};

module.exports = Accounts;
