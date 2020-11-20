// #region snippet-config
import * as Parcel from '@oasislabs/parcel-sdk';

const configParams = Parcel.Config.paramsFromEnv();
const config = new Parcel.Config(configParams);
// #endregion snippet-config

async function main() {
    // #region snippet-connect
    // Find the identity address associated with the private key you supplied
    // above.
    const identityAddress = Parcel.Identity.addressFromToken(await config.tokenProvider.getToken());

    // Let's connect to the identity.
    const identity = await Parcel.Identity.connect(identityAddress, config);
    console.log(`Connected to identity at address ${identity.address.hex}`);
    // #endregion snippet-connect

    // #region snippet-dataset-upload
    // Now let's upload a dataset.
    const datasetMetadata = {
        title: 'My First Dataset',
        // A (fake) example metadata URL.
        metadataUrl: 'http://s3-us-west-2.amazonaws.com/my_first_metadata.json',
    };

    // The dataset: 'hooray!', encoded as a Uint8Array.
    const data = new TextEncoder().encode('hooray!');
    console.log('Uploading data for our user');
    const dataset = await Parcel.Dataset.upload(data, datasetMetadata, identity, config);
    // `dataset.address.hex` is your dataset's unique ID.
    console.log(
        `Created dataset with address ${dataset.address.hex} and uploaded to ${dataset.metadata.dataUrl}`,
    );
    // #endregion snippet-dataset-upload

    // #region snippet-dataset-download
    // By default, the dataset owner can download the data.
    const datasetToDownload = await Parcel.Dataset.connect(dataset.address, identity, config);
    console.log(`Connected to dataset ${datasetToDownload.address.hex}`);
    const secretDataStream = datasetToDownload.download();
    const secretDatasetWriter = secretDataStream.pipe(
        require('fs').createWriteStream('./user_data'),
    );

    // Utility method.
    const streamFinished = require('util').promisify(require('stream').finished);
    try {
        await streamFinished(secretDatasetWriter);
        console.log(`Dataset ${datasetToDownload.address.hex} has been downloaded to ./user_data`);
    } catch (e) {
        throw new Error(`Failed to download dataset at ${datasetToDownload.address.hex}`);
    }
    const secretData = require('fs').readFileSync('./user_data').toString();
    console.log(`Hey dataset owner! Here's your data: ${secretData}\n`);
    // #endregion snippet-dataset-download
}

main()
    .then(() => console.log('All done!'))
    .catch((err) => {
        console.log(`Error in main(): ${err.stack || JSON.stringify(err)}`);
        process.exitCode = 1;
    });
