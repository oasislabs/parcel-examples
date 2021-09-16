import fs from 'fs';

import Parcel, { AppId, IdentityId } from '@oasislabs/parcel';

// Connect to Acme's identity.
const parcel = new Parcel({
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

// By default, documents are owned by the uploading identity
// #region snippet-upload-default-owner
const acmeIdentity = await parcel.getCurrentIdentity();
console.log(`Uploading data with identity: ${acmeIdentity.id}`);

const data = 'Eggs and Emmentaler is the best!';
const documentDetails = { title: 'Favorite sando', tags: ['lang:en'] };
const acmeDocument = await parcel.uploadDocument(data, {
  details: documentDetails,
  toApp: undefined,
}).finished;
console.log(`Created document ${acmeDocument.id} with owner ${acmeDocument.owner}`);
// #endregion snippet-upload-default-owner

// Document owners can always download their data
// #region snippet-download-owner
console.log(`Downloading document ${acmeDocument.id} with identity ${acmeIdentity.id}`);
let download = parcel.downloadDocument(acmeDocument.id);
let saver = fs.createWriteStream(`./acme_document`);
await download.pipeTo(saver);
console.log(`Document ${acmeDocument.id} downloaded to ./acme_document`);

const acmeData = fs.readFileSync('./acme_document', 'utf-8');
console.log(`Here's the data: ${acmeData}`);
// #endregion snippet-download-owner

// Upload a document and assign ownership to a sample end user (e.g. "Bob")
// #region snippet-upload-user-data
const bobId = process.env.BOB_IDENTITY_ID! as IdentityId; // REPLACE ME
const appId = process.env.ACME_APP_ID! as AppId; // REPLACE ME
console.log(`Uploading data for end user Bob (ID: ${bobId}) for your app (ID: ${appId})`);
const bobDocument = await parcel.uploadDocument(data, {
  details: documentDetails,
  owner: bobId,
  toApp: appId,
}).finished;
console.log(`Created document ${bobDocument.id} with owner ${bobDocument.owner}`);
// #endregion snippet-upload-user-data

// By default, we do not have permission to access data owned by other users
// #region snippet-download-acme-error
download = parcel.downloadDocument(bobDocument.id);
saver = fs.createWriteStream(`./bob_data_by_acme`);
try {
  console.log(
    `Attempting to access Bob's document using Acme's identity ${acmeIdentity.id} and without permission...`,
  );
  await download.pipeTo(saver);
} catch (error: any) {
  console.log(`Acme was not able to access Bob's data (this was expected): ${error}`);
}
// #endregion snippet-download-acme-error

// At this point, we need Bob to grant the app permission to use his data.
// #region snippet-create-grant
console.log(
  `Bob granting Acme app ${process.env.ACME_APP_ID} permission to access document ${bobDocument.id}...`,
);
const parcelBob = new Parcel({
  clientId: process.env.BOB_SERVICE_CLIENT_ID!,
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
await parcelBob.createGrant({
  grantee: process.env.ACME_APP_ID! as AppId,
  condition: { 'document.id': { $eq: bobDocument.id } },
});
// #endregion snippet-create-grant

// Periodically check, if the access was granted.
// #region snippet-download-bob-success
console.log(
  `Attempting to access Bob's document using Acme's identity ${acmeIdentity.id} and with his permission...`,
);
download = parcel.downloadDocument(bobDocument.id);
saver = fs.createWriteStream(`./bob_data_by_acme`);
await download.pipeTo(saver);
console.log(`Document ${bobDocument.id} has been downloaded to ./bob_data_by_acme`);
const bobData = fs.readFileSync('./bob_data_by_acme', 'utf-8');
console.log(`Here's the data: ${bobData}`);
// #endregion snippet-download-bob-success

// Print Bob's document access history.
// #region snippet-document-history
console.log(`Access log for document ${bobDocument.id}:`);
for (const event of (await bobDocument.history()).results) {
  console.log(`${event.accessor} accessed this document on ${event.createdAt.toISOString()}`);
}
// #endregion snippet-document-history

// Perform another access and print the access history.
// #region snippet-document-history-again
console.log(`Downloading document ${bobDocument.id} again...`);
download = parcel.downloadDocument(bobDocument.id);
saver = fs.createWriteStream(`./bob_data_by_acme_again`);
await download.pipeTo(saver);

console.log(`Access log for document ${bobDocument.id}:`);
for (const event of (await bobDocument.history()).results) {
  console.log(`${event.accessor} accessed this document on ${event.createdAt.toISOString()}`);
}

// #endregion snippet-document-history-again

console.log();
