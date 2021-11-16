import express from 'express';
import { generators, Issuer } from 'openid-client';

import Parcel from '@oasislabs/parcel';

// #region snippet-openid-client-config
// Configure OpenID Connect client.
const PARCEL_AUTH_URL = process.env.PARCEL_AUTH_URL ?? 'https://auth.oasislabs.com';

const issuer = await Issuer.discover(PARCEL_AUTH_URL);

const client = new issuer.Client(
  {
    // Replace with your app's back-end client ID.
    client_id: process.env.ACME_BACKEND_CLIENT_ID!,
    redirect_uris: ['http://localhost:4050/callback'],
    response_types: ['code'],
    token_endpoint_auth_method: 'private_key_jwt',
    token_endpoint_auth_signing_alg: 'ES256',
    id_token_signed_response_alg: 'ES256',
  },
  {
    keys: [
      {
        // Back-end client private key.
        // Note: Make sure kid matches the one you added in portal.
        kid: 'acme-backend-client',
        use: 'sig',
        kty: 'EC',
        crv: 'P-256',
        alg: 'ES256',
        x: 'mqlepd4Gr5L4zEauL2V-3x46cvXFTP10LY4AfOyCjd4',
        y: 'iTMKFMDJVqDDf-Tbt3fVxVs4F84_6nSpMji9uDCE3hY',
        d: 'SjSlVeiDxJ9wFBLIky2WSoUTI3NBJgm2YpbxBpfPQr0',
      },
    ],
  },
);
// #endregion snippet-openid-client-config

// #region snippet-generators-snippet
const state = generators.state(10);
const nonce = generators.nonce(10);
const codeVerifier = generators.codeVerifier();
const codeChallenge = generators.codeChallenge(codeVerifier);
// #endregion snippet-generators-snippet

const app = express();
app.use(express.static('public'));
app.set('view engine', 'pug');
app.set('views', 'views/');

const port = 4050;

// #region snippet-initialize-login
app.get('/', (req: express.Request, res: express.Response) => {
  // Obtain authorization URL.
  const authorizationUrl = client.authorizationUrl({
    scope: 'openid profile email parcel.public',
    audience: 'https://api.oasislabs.com/parcel',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  res.render('index', {
    authUrl: authorizationUrl,
  });
});
// #endregion snippet-initialize-login

app.get('/callback', async (req: express.Request, res: express.Response) => {
  // #region snippet-login-callback
  const callbackParams = client.callbackParams(req.url);

  // Exchange code for tokens.
  const tokenSet = await client.callback(
    'http://localhost:4050/callback',
    callbackParams,
    {
      code_verifier: codeVerifier,
      state,
      nonce,
      response_type: 'code',
    },
    {
      exchangeBody: {
        audience: 'https://api.oasislabs.com/parcel',
      },
    },
  );
  // #endregion snippet-login-callback

  // #region snippet-create-parcel-instance
  // Use Parcel API to count the number of owned documents.
  const parcel = new Parcel(tokenSet.access_token!);
  const parcelId = (await parcel.getCurrentIdentity()).id;
  const { results } = await parcel.searchDocuments({
    selectedByCondition: {
      'document.owner': {
        $eq: parcelId,
      },
    },
  });

  res.render('callback', {
    parcelId,
    documentCount: results.length,
  });
  // #endregion snippet-create-parcel-instance
});

app.listen(port, () => {
  console.log('Login with Oasis (back-end) app listening at http://localhost:%s', port);
});
