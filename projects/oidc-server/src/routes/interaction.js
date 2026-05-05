'use strict';

const express  = require('express');
const Accounts = require('../accounts');
const router   = express.Router();

// ── GET /interaction/:uid  ─────────────────────────────────────────────────
router.get('/:uid', async (req, res, next) => {
  try {
    const provider    = req.app.get('provider');
    const interaction = await provider.interactionDetails(req, res);
    const { prompt, params } = interaction;

    if (prompt.name === 'login') {
      return res.render('login', { uid: interaction.uid, params, error: null, mode: 'login' });
    }
    if (prompt.name === 'consent') {
      return res.render('consent', { uid: interaction.uid, params, interaction });
    }
    return next(new Error(`Unknown prompt: ${prompt.name}`));
  } catch (err) { next(err); }
});

// ── POST /interaction/:uid/login  ──────────────────────────────────────────
router.post('/:uid/login', async (req, res, next) => {
  try {
    const provider = req.app.get('provider');
    const interaction = await provider.interactionDetails(req, res);
    const { uid, params } = interaction;
    const { username, password } = req.body;

    const accountId = await Accounts.authenticate(username, password);
    if (!accountId) {
      return res.render('login', { uid, params, error: 'Invalid username or password', mode: 'login' });
    }

    const result = { login: { accountId } };
    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
  } catch (err) { next(err); }
});

// ── POST /interaction/:uid/register  ──────────────────────────────────────
router.post('/:uid/register', async (req, res, next) => {
  try {
    const provider    = req.app.get('provider');
    const interaction = await provider.interactionDetails(req, res);
    const { uid, params } = interaction;
    const { username, name, email, password } = req.body;

    if (!username || !email || !password) {
      return res.render('login', { uid, params, error: 'All fields are required', mode: 'register' });
    }

    let accountId;
    try {
      accountId = await Accounts.register({ username, name, email, password });
    } catch (e) {
      return res.render('login', { uid, params, error: e.message, mode: 'register' });
    }

    const result = { login: { accountId } };
    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
  } catch (err) { next(err); }
});

// ── POST /interaction/:uid/confirm  ───────────────────────────────────────
router.post('/:uid/confirm', async (req, res, next) => {
  try {
    const provider    = req.app.get('provider');
    const interaction = await provider.interactionDetails(req, res);
    const { prompt: { details }, params, session } = interaction;

    const grant = interaction.grantId
      ? await provider.Grant.find(interaction.grantId)
      : new provider.Grant({ accountId: session.accountId, clientId: params.client_id });

    if (details.missingOIDCScope)   grant.addOIDCScope(details.missingOIDCScope.join(' '));
    if (details.missingOIDCClaims)  grant.addOIDCClaims(details.missingOIDCClaims);
    if (details.missingResourceScopes) {
      for (const [indicator, scope] of Object.entries(details.missingResourceScopes)) {
        grant.addResourceScope(indicator, scope.join(' '));
      }
    }

    const grantId = await grant.save();
    const result = { consent: { grantId } };
    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
  } catch (err) { next(err); }
});

// ── GET /interaction/:uid/abort  ──────────────────────────────────────────
router.get('/:uid/abort', async (req, res, next) => {
  try {
    const provider = req.app.get('provider');
    const result = { error: 'access_denied', error_description: 'User denied access' };
    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
  } catch (err) { next(err); }
});

module.exports = router;
