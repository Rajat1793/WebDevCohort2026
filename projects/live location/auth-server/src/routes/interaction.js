'use strict';

const express = require('express');
const provider = require('../oidc/provider');
const Account = require('../oidc/accounts');

const router = express.Router();
const parse = express.urlencoded({ extended: false });

function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}

// Clients that are first-party — consent screen is skipped automatically
const FIRST_PARTY_CLIENTS = new Set(['live-location-app']);

router.get('/:uid', noCache, async (req, res, next) => {
  try {
    const interactionDetails = await provider.interactionDetails(req, res);
    const { uid, prompt, params, session } = interactionDetails;

    switch (prompt.name) {
      case 'login':
        return res.render('login', { uid, params, error: null, mode: 'login' });

      case 'consent': {
        // Auto-grant for first-party clients — skip the consent screen entirely
        if (FIRST_PARTY_CLIENTS.has(params.client_id)) {
          const { details } = prompt;
          let { grantId } = interactionDetails;
          let grant;
          if (grantId) {
            grant = await provider.Grant.find(grantId);
          } else {
            grant = new provider.Grant({ accountId: session.accountId, clientId: params.client_id });
          }
          if (details.missingOIDCScope)    grant.addOIDCScope(details.missingOIDCScope.join(' '));
          if (details.missingOIDCClaims)   grant.addOIDCClaims(details.missingOIDCClaims);
          if (details.missingResourceScopes) {
            for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
              grant.addResourceScope(indicator, scopes.join(' '));
            }
          }
          grantId = await grant.save();
          const consent = interactionDetails.grantId ? {} : { grantId };
          return provider.interactionFinished(req, res, { consent }, { mergeWithLastSubmission: true });
        }
        return res.render('consent', { uid, params, prompt });
      }

      default:
        return next(new Error(`Unsupported prompt: ${prompt.name}`));
    }
  } catch (err) { return next(err); }
});

router.post('/:uid/login', noCache, parse, async (req, res, next) => {
  try {
    const { uid, params } = await provider.interactionDetails(req, res);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render('login', { uid, params, error: 'Username and password are required', mode: 'login' });
    }

    const account = await Account.authenticate(username, password);
    if (!account) {
      return res.render('login', { uid, params, error: 'Invalid username or password', mode: 'login' });
    }

    await provider.interactionFinished(req, res, { login: { accountId: account.accountId } }, { mergeWithLastSubmission: false });
  } catch (err) { next(err); }
});

router.post('/:uid/register', noCache, parse, async (req, res, next) => {
  try {
    const { uid, params } = await provider.interactionDetails(req, res);
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
      return res.render('login', { uid, params, error: 'All fields are required', mode: 'register' });
    }

    let account;
    try {
      account = await Account.register({ username, email, password, name });
    } catch (e) {
      return res.render('login', { uid, params, error: e.message, mode: 'register' });
    }

    await provider.interactionFinished(req, res, { login: { accountId: account.accountId } }, { mergeWithLastSubmission: false });
  } catch (err) { next(err); }
});

router.post('/:uid/confirm', noCache, parse, async (req, res, next) => {
  try {
    const interactionDetails = await provider.interactionDetails(req, res);
    const { prompt: { name, details }, params, session: { accountId } } = interactionDetails;

    if (name !== 'consent') return next(new Error('Expected consent prompt'));

    let { grantId } = interactionDetails;
    let grant;
    if (grantId) {
      grant = await provider.Grant.find(grantId);
    } else {
      grant = new provider.Grant({ accountId, clientId: params.client_id });
    }

    if (details.missingOIDCScope) grant.addOIDCScope(details.missingOIDCScope.join(' '));
    if (details.missingOIDCClaims) grant.addOIDCClaims(details.missingOIDCClaims);
    if (details.missingResourceScopes) {
      for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
        grant.addResourceScope(indicator, scopes.join(' '));
      }
    }

    grantId = await grant.save();
    const consent = interactionDetails.grantId ? {} : { grantId };
    await provider.interactionFinished(req, res, { consent }, { mergeWithLastSubmission: true });
  } catch (err) { next(err); }
});

router.get('/:uid/abort', noCache, async (req, res, next) => {
  try {
    await provider.interactionFinished(req, res, {
      error: 'access_denied',
      error_description: 'User aborted the authentication flow',
    }, { mergeWithLastSubmission: false });
  } catch (err) { next(err); }
});

module.exports = router;
