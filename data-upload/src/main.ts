import * as fs from 'fs';

import Parcel, { AppId, Document } from '@oasislabs/parcel';

// #region snippet-connect
const parcel = new Parcel({
  // Replace with your service client ID, e.g. "C92EAFfH67w4bGkVMjihvkQ"
  clientId: process.env.ACME_SERVICE_CLIENT_ID!,
  // Replace with the private key of your service client.
  privateKey: {
    use: 'sig',
    kty: 'EC',
    crv: 'P-256',
    alg: 'ES256',
    x: 'ej4slEdbZpwYG-4T-WfLHpMBWPf6FItNNGFEHsjdyK4',
    y: 'e4Q4ygapmkxku_olSuc-WhSJaWiNCvuPqIWaOV6P9pE',
    d: '_X2VJCigbOYXOq0ilXATJdh9c2DdaSzZlxXVV6yuCXg',
  },
});
// #endregion snippet-connect

// #region snippet-document-upload
const data = 'Hello private world!';
const documentDetails = { title: 'My first document', tags: ['greeting', 'english'] };
let document: Document;
try {
  document = await parcel.uploadDocument(data, {
    details: documentDetails,
    // Replace with your app ID, e.g. "AXstH3HzQoEhESWzTqxup9d"
    toApp: process.env.ACME_APP_ID! as AppId,
  }).finished;
} catch (error: any) {
  console.error('Failed to upload document');
  throw error;
}

console.log(`Created document ${document.id} with title ${document.details.title}`);
// #endregion snippet-document-upload

// #region snippet-document-search
const uploadedDocuments = (
  await parcel.searchDocuments({
    selectedByCondition: { 'document.creator': { $eq: (await parcel.getCurrentIdentity()).id } },
  })
).results;
for (const d of uploadedDocuments) {
  console.log(`Found document ${d.id} named ${d.details.title}`);
}
// #endregion snippet-document-search

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

const output = fs.readFileSync('./user_data', 'utf-8');
console.log(`Hey document owner! Here's your data: ${output}\n`);
// #endregion snippet-document-download
