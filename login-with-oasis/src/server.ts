import express from 'express';
import path from 'path';

// #region snippet-oidc-config
const PARCEL_AUTH_URL = process.env.PARCEL_AUTH_URL ?? 'https://auth.oasislabs.com';

const oidcConfig = {
  authority: PARCEL_AUTH_URL,
  metadata: {
    issuer: PARCEL_AUTH_URL,
    authorization_endpoint: PARCEL_AUTH_URL + '/oauth/authorize',
    jwks_uri: PARCEL_AUTH_URL + '/.well-known/jwks.json',
    token_endpoint: PARCEL_AUTH_URL + '/oauth/token',
  },
  // Replace with your app's front-end client ID.
  client_id: process.env.ACME_FRONTEND_CLIENT_ID!,
  redirect_uri: 'http://localhost:4050/callback',
  response_type: 'code',
  scope: 'openid',
  filterProtocolClaims: false,
  loadUserInfo: false,
  extraQueryParams: {
    audience: 'https://api.oasislabs.com/parcel',
  },
  extraTokenParams: {
    audience: 'https://api.oasislabs.com/parcel',
  },
};
// #endregion snippet-oidc-config

const app = express();
const port = 4050;

app.use(express.static('public'));

app.get('/index.html', (req: express.Request, res: express.Response) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/getOidcConfig', (req: express.Request, res: express.Response) => {
  res
    .set('Content-Type', 'text/javascript')
    .send(`let oidcConfig = ${JSON.stringify(oidcConfig)};`);
});

// #region snippet-finalize-login
// #endregion snippet-finalize-login

app.listen(port, () => {
  console.log('Login with Oasis app listening at http://localhost:%s', port);
});
