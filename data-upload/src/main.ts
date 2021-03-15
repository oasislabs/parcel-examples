import Parcel, { Document } from '@oasislabs/parcel';

import * as fs from 'fs';

// #region snippet-configuration
const apiCreds = {
  // Client ID
  clientId: 'C92EAFfH67w4bGkVMjihvkQ',
  // Client key
  privateKey: {
    // Note: Make sure kid matches the one you added in portal.
    kid: 'example-client-1',
    use: 'sig',
    kty: 'EC',
    crv: 'P-256',
    alg: 'ES256',
    x: 'ej4slEdbZpwYG-4T-WfLHpMBWPf6FItNNGFEHsjdyK4',
    y: 'e4Q4ygapmkxku_olSuc-WhSJaWiNCvuPqIWaOV6P9pE',
    d: '_X2VJCigbOYXOq0ilXATJdh9c2DdaSzZlxXVV6yuCXg',
  },
} as const;
// #endregion snippet-configuration

// #region snippet-connect
const parcel = new Parcel(apiCreds);
// #endregion snippet-connect

// #region snippet-document-upload
const data = 'Hello private world!';
const documentDetails = { title: 'My first document', tags: ['greeting', 'english'] };
let document: Document;
try {
  document = await parcel.uploadDocument(data, { details: documentDetails }).finished;
} catch (error: any) {
  console.error('Failed to upload document');
  throw error;
}

console.log(`Created document ${document.id} with title ${document.details.title}`);
// #endregion snippet-document-upload

// #region snippet-document-download
// Let's download the above document using its ID.
// By default, the document owner can download the data.
const download = parcel.downloadDocument(document.id);
const saver = fs.createWriteStream(`./user_data`);
try {
  await download.pipeTo(saver);
  console.log(`Document ${document.id} has been downloaded to ./user_data`);
} catch (error: any) {
  console.error(`Failed to download document ${document.id}`);
  throw error;
}

const secretData = fs.readFileSync('./user_data', 'utf-8');
console.log(`Hey document owner! Here's your data: ${secretData}\n`);
// #endregion snippet-document-download
