'use strict';

require('dotenv').config();

const express    = require('express');
const path       = require('path');
const provider   = require('./provider');
const interaction = require('./routes/interaction');

const app  = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('provider', provider);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Interaction routes (login / register / consent / abort)
app.use('/interaction', interaction);

// All other routes handled by oidc-provider
app.use(provider.callback());

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).send(err.message);
});

app.listen(PORT, () => {
  console.log(`\n  OIDC Server running at http://localhost:${PORT}`);
  console.log(`  Issuer:   ${process.env.ISSUER || 'http://localhost:' + PORT}`);
  console.log(`  Config:   ${process.env.CLIENTS_FILE || path.join(__dirname, '../config/clients.json')}`);
  console.log(`  Users:    ${process.env.USERS_FILE  || path.join(__dirname, '../config/users.json')}\n`);
});
