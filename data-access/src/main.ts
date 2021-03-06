import Parcel, { IdentityId } from '@oasislabs/parcel';
import fs from 'fs';

// #region snippet-config
const tokenSource = {
  clientId: 'C92EAFfH67w4bGkVMjihvkQ',
  privateKey: {
    kid: 'example-client-1',
    kty: 'EC',
    alg: 'ES256',
    use: 'sig',
    crv: 'P-256',
    x: 'ej4slEdbZpwYG-4T-WfLHpMBWPf6FItNNGFEHsjdyK4',
    y: 'e4Q4ygapmkxku_olSuc-WhSJaWiNCvuPqIWaOV6P9pE',
    d: '_X2VJCigbOYXOq0ilXATJdh9c2DdaSzZlxXVV6yuCXg',
  },
} as const;
// #endregion snippet-config

// #region snippet-identity-acme-connect
// Connect to ACME's identity.
const parcel = new Parcel(tokenSource);
// #endregion snippet-identity-acme-connect

// By default, documents are owned by the uploading identity
// #region snippet-upload-default-owner
const acmeIdentity = await parcel.getCurrentIdentity();
console.log(`Uploading data with identity: ${acmeIdentity.id}`);

const data = 'The weather will be sunny tomorrow and cloudy on Tuesday.';
const documentDetails = { title: 'Weather forecast summary', tags: ['english'] };
const acmeDocument = await parcel.uploadDocument(data, {
  details: documentDetails,
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
const bobId = 'IJ5kvpUafgext6vuCuCH36L' as IdentityId; // REPLACE ME
const appId = 'AVNidsM1HR76CFTJvGrrTrd'; // REPLACE ME
documentDetails.tags.push(appId);
console.log(`Uploading data for end user Bob (ID: ${bobId}) for your app (ID: ${appId})`);
const bobDocument = await parcel.uploadDocument(data, {
  details: documentDetails,
  owner: bobId,
}).finished;
console.log(`Created document ${bobDocument.id} with owner ${bobDocument.owner}`);
// #endregion snippet-upload-user-data

// By default, we do not have permission to access data owned by other users
// #region snippet-download-acme-error
download = parcel.downloadDocument(bobDocument.id);
saver = fs.createWriteStream(`./bob_data_by_acme`);
try {
  console.log(`Attempting to access Bob's document without permission...`);
  await download.pipeTo(saver);
} catch (error: any) {
  console.log(`ACME was not able to access Bob's data (this was expected): ${error}`);
}
// #endregion snippet-download-acme-error

console.log();

/**
 * At this point, we need Bob to grant us permission to use his data.
 * Specifically, we need to:
 *  - Redirect Bob to steward.oasislabs.com/apps/:id/join
 *  - Have Bob grant us permission
 */

// Now, accessing the document succeeds
// #region snippet-download-bob-success
console.log(`Attempting to access Bob's document with ACME identity ${acmeIdentity.id}`);
download = parcel.downloadDocument(bobDocument.id);
saver = fs.createWriteStream(`./bob_data_by_acme`);
await download.pipeTo(saver);
console.log(`Document ${bobDocument.id} has been downloaded to ./bob_data_by_acme`);

const bobData = fs.readFileSync('./bob_data_by_acme', 'utf-8');
console.log(`Here's the data: ${bobData}`);
// #endregion snippet-download-bob-success

console.log();
