'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const provider = require('./oidc/provider');
const interactionRouter = require('./routes/interaction');

const PORT = process.env.PORT || 3000;
const app = express();

app.set('trust proxy', 1);

// EJS for login/consent views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mount interaction routes BEFORE the OIDC provider middleware
// (provider uses its own internal router; interaction routes must come first)
app.use('/interaction', interactionRouter);

// Mount the OIDC provider — handles all standard OIDC endpoints:
//   GET  /.well-known/openid-configuration
//   GET  /jwks
//   POST /token
//   GET  /userinfo  (GET+POST)
//   GET  /authorize
//   POST /session/end  (RP-initiated logout)
app.use(provider.callback());

// Error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[Auth Server] Unhandled error:', err.message);
  res.status(err.status || 500).send(err.message);
});

app.listen(PORT, () => {
  console.log(`[Auth Server] OIDC Provider running → http://localhost:${PORT}`);
  console.log(`[Auth Server] Discovery endpoint  → http://localhost:${PORT}/.well-known/openid-configuration`);
});
