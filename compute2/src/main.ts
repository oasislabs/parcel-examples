import * as Parcel from '@oasislabs/parcel-sdk';
import fs from 'fs';

// #region snippet-config
const configParams = Parcel.Config.paramsFromEnv();
const config = new Parcel.Config(configParams);
// #endregion snippet-config

async function main() {
    console.log('Here we go...');

    const identity = await config.getTokenIdentity();
    const dispatcher = await Parcel.Dispatcher.connect(config.dispatcherAddress, identity, config);

    // Set up the datasets
    // #region snippet-input-datasets
    const skinDataset = await Parcel.Dataset.upload(
        await fs.promises.readFile('docker/test_workdir/data/in/basal_cell_carcinoma_example.jpg'),
        { title: 'User-provided skin image' },
        identity,
        config,
    );
    // #endregion snippet-input-datasets
    console.log('Datasets uploaded.');

    // Submit the job.
    // #region snippet-submit-job
    const jobRequest = {
        name: 'skin-lesion-classification',
        dockerImage: 'oasislabs/acme-derma-demo',
        inputDatasets: [{ mountPath: 'skin.jpg', address: skinDataset.address }],
        outputDatasets: [{ mountPath: 'prediction.txt', owner: identity }],
        cmd: [
            'python',
            'predict.py',
            '/parcel/data/in/skin.jpg',
            '/parcel/data/out/prediction.txt',
        ],
    };
    const jobId = await dispatcher.submitJob({ job: jobRequest });
    // #endregion snippet-submit-job
    console.log(`Job ${Parcel.utils.encodeHex(jobId)} submitted.`);

    // Wait for job completion.
    const job = await dispatcher.getCompletedJobInfo(jobId);
    if (job.status instanceof Parcel.JobCompletionStatus.Success) {
        console.log('Job completed successfully!');
    } else {
        console.log('Job failed!', job.info);
    }
}

main();
