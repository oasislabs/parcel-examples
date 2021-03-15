import express from 'express';
import path from 'path';

// #region snippet-oidc-config
const AUTH_URL = process.env.AUTH_URL ?? 'https://auth.oasislabs.com';
const AUTH_ISS = process.env.AUTH_ISS ?? AUTH_URL;

const oidcConfig = {
  authority: AUTH_URL,
  metadata: {
    issuer: AUTH_ISS,
    authorization_endpoint: AUTH_URL + '/oauth/authorize',
    jwks_uri: AUTH_URL + '/oauth/keys',
    token_endpoint: AUTH_URL + '/oauth/token',
  },
  // Replace with your app's front-end client ID.
  client_id: 'CErM9iRkfYdAJ9TCbJvV3gQ', // Client 4.
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
  console.log('Account linking app listening at http://localhost:%s', port);
});
