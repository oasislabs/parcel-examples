import Parcel, { AppId } from '@oasislabs/parcel';

// #region snippet-connect
const parcel = new Parcel({
  // Replace with your service client ID, e.g. "C92EAFfH67w4bGkVMjihvkQ"
  clientId: process.env.BOB_SERVICE_CLIENT_ID!,
  // Replace with the private key of your service client.
  privateKey: {
    kid: 'bob-service-client',
    use: 'sig',
    kty: 'EC',
    crv: 'P-256',
    alg: 'ES256',
    x: 'kbhoJYKyOgY645Y9t-Vewwhke9ZRfLh6_TBevIA6SnQ',
    y: 'SEu0xuCzTH95-q_-FSZc-P6hCSnq6qH00MQ52vOVVpA',
    d: '10sS7lgM_YWxf79x21mWalCkAcZZOmX0ZRE_YwEXcmc',
  },
});
// #endregion snippet-connect

// #region snippet-database-create
const name = 'Blockchain Security Database';

const database = await parcel.createDatabase({ name });

console.log(`Created database ${database.id} with name: ${database.name}`);
// #endregion snippet-database-create

// #region snippet-database-list
const allDatabases = (
  await parcel.listDatabases({
    owner: (await parcel.getCurrentIdentity()).id,
  })
).results;
for (const d of allDatabases) {
  console.log(`Found database ${d.id} with name: ${d.name}`);
}
// #endregion snippet-database-list

// #region snippet-database-query-create
const create = {
  sql: 'CREATE TABLE threat_intels (wallet TEXT, intel JSON, time DATETIME, severity INTEGER)',
  params: {},
};
await parcel.queryDatabase(database.id, create);
// #endregion snippet-database-query-create

// #region snippet-database-query-insert
let insert = {
  sql: 'INSERT INTO threat_intels VALUES ($wallet, $intel, $time, $severity)',
  params: {
    $wallet: '0x1234',
    $intel: { event: 'transfer', value: 9999 },
    $time: new Date(),
    $severity: 3,
  },
};
await parcel.queryDatabase(database.id, insert);
// #endregion snippet-database-query-insert

// #region snippet-database-query-select
const select = {
  sql: 'SELECT * FROM threat_intels WHERE severity = $severity',
  params: {
    $severity: 3,
  },
};
const results = await parcel.queryDatabase(database.id, select);
console.log(`Result row ${JSON.stringify(results[0])}`);
// #endregion snippet-database-query-select

// #region snippet-database-grant
await parcel.createGrant({
  grantee: process.env.ACME_APP_ID as AppId,
  condition: {
    'database.id': {
      $eq: database.id,
    },
  },
});
// #endregion snippet-database-grant
const parcelAcme = new Parcel({
  clientId: process.env.ACME_SERVICE_CLIENT_ID!,
  privateKey: {
    kid: 'acme-service-client',
    use: 'sig',
    kty: 'EC',
    crv: 'P-256',
    alg: 'ES256',
    x: 'ej4slEdbZpwYG-4T-WfLHpMBWPf6FItNNGFEHsjdyK4',
    y: 'e4Q4ygapmkxku_olSuc-WhSJaWiNCvuPqIWaOV6P9pE',
    d: '_X2VJCigbOYXOq0ilXATJdh9c2DdaSzZlxXVV6yuCXg',
  },
});

insert = {
  sql: 'INSERT INTO threat_intels VALUES ($wallet, $intel, $time, $severity)',
  params: {
    $wallet: '0x5678',
    $intel: { event: 'transfer', value: 150 },
    $time: new Date('2021-10-18T15:15:36.035Z'),
    $severity: 5,
  },
};
await parcel.queryDatabase(database.id, insert);

const updatedResults = await parcelAcme.queryDatabase(database.id, select);
console.log(`Result row ${JSON.stringify(updatedResults[0])}`);
