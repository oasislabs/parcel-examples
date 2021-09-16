import assert from 'assert';

import Parcel from '@oasislabs/parcel';

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

// --- Create a new data-backed token held by Bob.
// #region snippet-mint-token
console.log('Creating a new data-backed token owned by Bob, the artist.');
const artToken = await parcelBob.mintToken({
  name: "Bob's Saguaro Sunset painting",
  grant: {
    condition: null, // Allow full access to anyone holding the token.
  },
  supply: 1, // It's an NFT.
});
console.log('The art token is:', artToken);
// #endregion snippet-mint-token

// --- Upload and tokenize a data asset provided by Bob.
// #region snippet-tokenize-asset
console.log('Create a new document and prepare it for tokenization.');
const artContents = String.raw`
  ........::::::::::::..           .......|...............::::::::........
     .:::::;;;;;;;;;;;:::::.... .     \   | ../....::::;;;;:::::.......
         .       ...........   / \\_   \  |  /     ......  .     ........./\
...:::../\\_  ......     ..._/'   \\\_  \###/   /\_    .../ \_.......   _//
.::::./   \\\ _   .../\    /'      \\\\#######//   \/\   //   \_   ....////
    _/      \\\\   _/ \\\ /  x       \\\\###////      \////     \__  _/////
  ./   x       \\\/     \/ x X           \//////                   \/////
 /     XxX     \\/         XxX X                                    ////   x
-----XxX-------------|-------XxX-----------*--------|---*-----|------------X--
       X        _X      *    X      **         **             x   **    *  X
      _X                    _X           x                *          x     X_
`;
const artDocument = await parcelBob.uploadDocument(artContents, {
  owner: 'escrow', // ⚠️  The data must be owned by the escrow identity to be tokenized. This can be done after uploading, too.
  toApp: undefined,
}).finished;

console.log('Add the document to the token.');
await artToken.addAsset(artDocument.id);
// More data assets can also be added (by anyone).
// #endregion snippet-tokenize-asset

// --- Transfer the token to Acme and download the data.
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
const acmeIdentity = await parcelAcme.getCurrentIdentity();

// #region snippet-transfer-token
// Bob transfers the token.
const transferReceipt = await parcelBob.transferToken(
  artToken.id,
  1, // Transfer one token, the entire supply.
  acmeIdentity.id,
);
console.log('Receipt of token transfer to Acme, the buyer:', transferReceipt);

// Acme can now download the underlying data.
const artChunks = [];
const artDownload = parcelAcme.downloadDocument(artDocument.id);
for await (const chunk of artDownload) {
  artChunks.push(chunk);
}

console.log("Acme now has access to the art! (And Bob doesn't anymore.)");
assert.strictEqual(Buffer.concat(artChunks).toString(), artContents);
// #endregion snippet-transfer-token
