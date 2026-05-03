'use strict';

const { Issuer, generators } = require('openid-client');
const config = require('../config');

let client = null;

// Lazy-init: discover the OIDC provider metadata on first use.
// Uses the standard /.well-known/openid-configuration endpoint on the auth server.
async function getOidcClient() {
  if (client) return client;

  const issuer = await Issuer.discover(config.oidc.issuerUrl);
  client = new issuer.Client({
    client_id: config.oidc.clientId,
    client_secret: config.oidc.clientSecret,
    redirect_uris: [config.oidc.callbackUrl],
    response_types: ['code'],
  });

  console.log(`[OIDC] Client initialized → issuer: ${config.oidc.issuerUrl}`);
  return client;
}

module.exports = { getOidcClient, generators };
