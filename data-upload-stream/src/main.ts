import fs from 'fs';
import crypto from 'crypto';

import Parcel, { AppId } from '@oasislabs/parcel';

// Prefix of the file we randomly generate, upload and download back.
const filename = 'random-100MB';

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

// Helper functions for printing upload/download progress to stdout.
// #region snippet-document-upload-progress
function printUploadProgress(readStream: fs.ReadStream) {
  let stat: fs.Stats;
  readStream.on('open', (fd) => {
    stat = fs.fstatSync(fd);
  });
  readStream.on('data', () => {
    const percent = (100 * readStream.bytesRead) / stat.size;
    process.stdout.write(`Uploading... ${percent.toFixed(1)}% (${readStream.bytesRead}) \r`);
  });
}

// #endregion snippet-document-upload-progress
// #region snippet-document-download-progress
function printDownloadProgress(writeStream: fs.WriteStream, documentSize: number) {
  writeStream.on('drain', () => {
    const percent = (100 * writeStream.bytesWritten) / documentSize;
    process.stdout.write(`Downloading... ${percent.toFixed(1)}% (${writeStream.bytesWritten}) \r`);
  });
}
// #endregion snippet-document-download-progress

// Generate a 100 MB file of random data.
await fs.promises.writeFile(`${filename}-upload`, crypto.randomBytes(100_000_000));

// Upload and re-download it to another file.
// #region snippet-document-upload-download-stream
const readStream = fs.createReadStream(`${filename}-upload`);
printUploadProgress(readStream);
const document = await parcel.uploadDocument(readStream, {
  // Replace with your app ID, e.g. "AXstH3HzQoEhESWzTqxup9d"
  toApp: process.env.ACME_APP_ID! as AppId,
}).finished;
console.log(`\nUploading ${document.id} complete.`);

const download = document.download();
const saver = fs.createWriteStream(`${filename}-download`);
printDownloadProgress(saver, document.size);
await download.pipeTo(saver);
console.log(`\nDownloading ${document.id} complete.`);
// #endregion snippet-document-upload-download-stream
