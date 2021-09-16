import express from 'express';

const app = express();
const port = 4050;

// #region snippet-oidc-config
const PARCEL_AUTH_URL = process.env.PARCEL_AUTH_URL ?? 'https://auth.oasislabs.com';

const oidcConfig = {
  authority: PARCEL_AUTH_URL,
  // Replace with your app's frontend client ID.
  client_id: process.env.ACME_FRONTEND_CLIENT_ID!,
  redirect_uri: `http://localhost:${port}/callback`,
  response_type: 'code',
  scope: 'openid profile email parcel.public',
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

app.use(express.static('public'));

app.get('/index.html', (req: express.Request, res: express.Response) => {
  res.sendFile('index.html');
});

app.get('/getOidcConfig', (req: express.Request, res: express.Response) => {
  res
    .set('Content-Type', 'text/javascript')
    .send(`let oidcConfig = ${JSON.stringify(oidcConfig)};`);
});

app.listen(port, () => {
  console.log('Login with Oasis app listening at http://localhost:%s', port);
});
