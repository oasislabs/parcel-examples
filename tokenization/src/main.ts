import assert from 'assert';

import Parcel from '@oasislabs/parcel';
import { EmeraldBridgeAdapterV1 } from '@oasislabs/parcel-evm-contracts';
import ethers from 'ethers';

import { ERC721__factory } from '../types/ethers-contracts/factories/ERC721__factory.js';

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

// The address of the NFT contract on Emerald containing the token Bob previously sent to Acme.
const nftAddress = process.env.EMERALD_NFT_CONTRACT_ADDR!;
// The `tokenId` of the NFT that Bob transferred to Acme and will be associated with a Parcel token.
const nftTokenId = 42;

// --- Create a new data-backed token held by Bob.
// #region snippet-mint-token
console.log('Creating a new data-backed token owned by Bob, the artist.');
const artToken = await parcelBob.mintToken({
  name: "Bob's Saguaro Sunset painting",
  grant: {
    condition: null, // Allow full access to anyone holding the token.
  },
  transferability: {
    // The token is transferable on a remote smart contracting network (Emerald).
    // The Parcel-Emerald bridge will associate the newly-minted Parcel token
    // with the Emerald NFT represented by `nftAddress` and `nftTokenId`.
    //
    // This token must already exist on Emerald! The Parcel bridge will not create
    // the NFT for you. If you set this to a token that you can't trade, you may never
    // see your data asset again!
    //
    // In this tutorial, Acme already holds the NFT on Emerald, and Bob is  (because Bob already
    // sold it there and wants to add value by attaching it to a data asset on Parcel).
    remote: {
      network: 'emerald-testnet', // Emerald is the Oasis EVM-compatible ParaTime.
      address: nftAddress,
      tokenId: nftTokenId,
    },
  },
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

// #region snippet-link-acme-identity
// Link Acme's Parcel and Emerald identities so that when Acme locks the Emerald
// token, the Parcel token appears on the other end of the bridge.
const acmeWallet = new ethers.Wallet(process.env.ACME_EMERALD_PRIVATE_KEY!).connect(
  ethers.getDefaultProvider(process.env.WEB3_URL),
);
console.log('linking Acme identity', acmeIdentity.id, 'to Emerald address', acmeWallet.address);
await acmeIdentity.linkEthAddr(acmeWallet);
// #endregion snippet-link-acme-identity

// #region snippet-lock-token
// At this point, Bob owns `artToken`, a remotely transferrable Parcel data asset.
// Assume that the following steps happen next, but are not shown here because they
// are performed outside Parcel:
// 1) Bob creates an Emerald NFT (not backed by any data) with `nftAddress` and `nftOptionId`.
// 2) Bob sends his Emerald NFT to Acme's Emerald address.

// Now Acme invokes the Emerald Parcel bridge adapter to lock the Emerald token
// in exchange for a Parcel token.

// Connect to the token contract using the `typechain-ethers` generated bindings.
const tokenContract = ERC721__factory.connect(nftAddress, acmeWallet);
// This is how overloaded functions are referenced when using `typechain`.
const safeTransferFrom = tokenContract['safeTransferFrom(address,address,uint256,bytes)'];
// Transfer the token's ownership to the Parcel Bridge Adapter. Locked tokens can be withdrawn
// at any time using the `unlockERC{20,721,1155}` methods.
console.log('locking NFT into Parcel Emerald bridge adapter');
await safeTransferFrom(acmeWallet.address, EmeraldBridgeAdapterV1.address, nftTokenId, []);

// Wait a little while for the bridge to pick up and execute the lock event.
await new Promise((resolve) => {
  setTimeout(resolve, 3000);
});

// Acme can now download the underlying data.
const artChunks = [];
const artDownload = parcelAcme.downloadDocument(artDocument.id);
for await (const chunk of artDownload) {
  artChunks.push(chunk);
}

console.log("Acme now has access to the art! (And Bob doesn't anymore.)");
assert.strictEqual(Buffer.concat(artChunks).toString(), artContents);
// #endregion snippet-lock-token

// #region snippet-unlock-token
// And finally unlock the token for trading once again.
const bridgeAdapter = EmeraldBridgeAdapterV1.connect(acmeWallet);
console.log('unlocking NFT from bridge adapter');
await bridgeAdapter.unlockERC721(acmeWallet.address, nftAddress, nftTokenId, []);
// #endregion snippet-unlock-token
