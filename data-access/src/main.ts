import * as Parcel from '@oasislabs/parcel-sdk';

// #region snippet-config-alice
const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
// #endregion snippet-config-alice

const params = Parcel.Config.paramsFromEnv();
params.apiTokenSigner.clientId = process.env.OASIS_CLIENT_ID2;
params.apiTokenSigner.privateKey = process.env.OASIS_API_PRIVATE_KEY2;
const bobConfig = new Parcel.Config(params);

async function main() {
    // #region snippet-identity-alice
    const aliceIdentityAddress = Parcel.Identity.addressFromToken(
        await aliceConfig.tokenProvider.getToken(),
    );
    // #endregion snippet-identity-alice

    const bobIdentityAddress = Parcel.Identity.addressFromToken(
        await bobConfig.tokenProvider.getToken(),
    );

    // #region snippet-identity-alice-connect
    // Let's connect to Alice's identity.
    const aliceIdentity = await Parcel.Identity.connect(aliceIdentityAddress, aliceConfig);
    console.log(`Connected to Alice's identity at address ${aliceIdentity.address.hex}`);
    // #endregion snippet-identity-alice-connect

    // #region snippet-upload
    // Now let's upload a dataset for Bob.
    const datasetMetadata = {
        title: "Bob's Dataset",
        // A (fake) example metadata URL.
        metadataUrl: 'http://s3-us-west-2.amazonaws.com/my_first_metadata.json',
    };
    const data = new TextEncoder().encode('The weather will be sunny tomorrow.');
    console.log('Uploading data for Bob');
    const dataset = await Parcel.Dataset.upload(
        data,
        datasetMetadata,
        // The dataset is uploaded for Bob...
        await Parcel.Identity.connect(bobIdentityAddress, aliceConfig),
        // ...with Alice's credentials being used to do the upload...
        aliceConfig,
        {
            // ...and Alice is flagged as the dataset's creator.
            creator: aliceIdentity,
        },
    );
    console.log(
        `Created dataset with address ${dataset.address.hex} and uploaded to ${dataset.metadata.dataUrl}\n`,
    );
    // #endregion snippet-upload

    // #region snippet-download-alice-error
    // Let's try to download this data. We shouldn't be able to, since we
    // uploaded it with Bob as its owner.
    let datasetByAlice = await Parcel.Dataset.connect(dataset.address, aliceIdentity, aliceConfig);

    try {
        console.log(`Attempting to access Bob's data without permission...`);
        await new Promise((resolve, reject) => {
            const decryptedStream = datasetByAlice.download();
            decryptedStream.on('error', reject);
            decryptedStream.on('end', resolve);
        });
        throw new Error('This should not happen.');
    } catch (e) {
        // this is expected
        console.log(`Error: ${e.constructor.name}`);
        console.log("`aliceIdentity` was not able to access Bob's data (expected).\n");
    }
    // #endregion snippet-download-alice-error

    // #region snippet-download-bob-success
    // Create Bob's identity using API access token.
    const bobIdentity = await Parcel.Identity.connect(bobIdentityAddress, bobConfig);
    console.log(`Connected to Bob's identity at address ${bobIdentity.address.hex}`);

    // Now let's try to download it again, this time as Bob.
    const datasetByBob = await Parcel.Dataset.connect(dataset.address, bobIdentity, bobConfig);
    const streamFinished = require('util').promisify(require('stream').finished);
    try {
        const secretDataStream = datasetByBob.download();
        const secretDatasetWriter = secretDataStream.pipe(
            require('fs').createWriteStream('./bob_data_by_bob'),
        );
        await streamFinished(secretDatasetWriter);
        console.log(
            `\nDataset ${datasetByBob.address.hex} has been downloaded to ./bob_data_by_bob`,
        );
    } catch (e) {
        throw new Error(`Failed to download dataset at ${datasetByBob.address.hex}`);
    }
    const secretDataByBob = require('fs').readFileSync('./bob_data_by_bob').toString();
    console.log(`Here's the data: ${secretDataByBob}`);
    // #endregion snippet-download-bob-success

    // #region snippet-whitelist-policy
    const policy = await Parcel.WhitelistPolicy.create(
        bobConfig,
        bobIdentity, // The policy creator, and subsequent owner.
        new Parcel.Set([aliceIdentity.address]), // The set of whitelisted identities.
    );
    await datasetByBob.setPolicy(policy);
    console.log(
        `Created policy with address ${policy.address.hex} and applied it to dataset ${datasetByBob.address.hex}\n`,
    );
    // #endregion snippet-whitelist-policy

    // #region snippet-download-alice-success
    datasetByAlice = await Parcel.Dataset.connect(dataset.address, aliceIdentity, aliceConfig);
    try {
        const secretDataStream = datasetByAlice.download();
        const secretDatasetWriter = secretDataStream.pipe(
            require('fs').createWriteStream('./bob_data_by_alice'),
        );
        await streamFinished(secretDatasetWriter);
        console.log(
            `\nDataset ${datasetByAlice.address.hex} has been downloaded to ./bob_data_by_alice`,
        );
    } catch (e) {
        throw new Error(`Failed to download dataset at ${datasetByAlice.address.hex}`);
    }
    const secretDataByAlice = require('fs').readFileSync('./bob_data_by_alice').toString();
    console.log(`Here's the data: ${secretDataByAlice}`);
    // #endregion snippet-download-alice-success
}

main()
    .then(() => console.log('All done!'))
    .catch((err) => {
        console.log(`Error in main(): ${err.stack || JSON.stringify(err)}`);
        process.exitCode = 1;
    });
