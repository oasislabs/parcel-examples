import * as Parcel from '@oasislabs/parcel-sdk';
import fs from 'fs';

// #region snippet-config
const configParams = Parcel.Config.paramsFromEnv();
const config = new Parcel.Config(configParams);
// #endregion snippet-config

async function main() {
    console.log('Here we go...');

    // #region snippet-identity
    const identity = await config.getTokenIdentity();
    console.log(`Connected to identity at address ${identity.address.hex}.`);
    // #endregion snippet-identity

    // Set up the datasets

    // #region snippet-input-datasets
    // Program dataset. Make sure you have doubler.sh in the current
    // directory!
    const programDataset = await Parcel.Dataset.upload(
        await fs.promises.readFile('doubler.sh'),
        { title: 'Program that doubles its input' },
        identity,
        config,
    );

    // Dataset containing the input to our program.
    const sevenDataset = await Parcel.Dataset.upload(
        Buffer.from('7'),
        { title: 'A file containing number seven' },
        identity,
        config,
    );
    console.log('Datasets uploaded.');
    // #endregion snippet-input-datasets

    // #region snippet-job-request
    // Construct the job request.
    const jobRequest = {
        name: 'input-doubling', // For humans only; you can specify anything here.
        // #region snippet-cmd-spec
        cmd: [
            '/parcel/data/in/doubler.sh',
            '--from',
            '/parcel/data/in/number.txt',
            '--to',
            '/parcel/data/out/double_number.txt',
        ],
        // #endregion snippet-cmd-spec
        // #region snippet-input-datasets-spec
        inputDatasets: [
            { mountPath: 'number.txt', address: sevenDataset.address },
            { mountPath: 'doubler.sh', address: programDataset.address },
        ],
        // #endregion snippet-input-datasets-spec
        // #region snippet-output-datasets-spec
        outputDatasets: [{ mountPath: 'double_number.txt', owner: identity }],
        // #endregion snippet-output-datasets-spec
    };
    // #endregion snippet-job-request

    // #region snippet-submit-job
    // Submit the job.
    const dispatcher = await Parcel.Dispatcher.connect(config.dispatcherAddress, identity, config);
    const jobId = await dispatcher.submitJob({ job: jobRequest });
    console.log(`Job ${Parcel.utils.encodeHex(jobId)} submitted.`);
    // #endregion snippet-submit-job

    // #region snippet-job-result
    // Wait for job completion.
    const job = await dispatcher.getCompletedJobInfo(jobId);
    if (job.status instanceof Parcel.JobCompletionStatus.Success) {
        console.log('Job completed successfully!');
    } else {
        console.log('Job failed!', job.info);
    }
    // #endregion snippet-job-result

    // #region snippet-job-output
    // Get output datasets.
    if (job.outputs[0]) {
        const output = await Parcel.Dataset.connect(job.outputs[0].address, identity, config);
        output.downloadToPath('/tmp/job_out');
        console.log('Job output stored in /tmp/job_out.');
    }
    // #endregion snippet-job-output
}

main()
    .then(() => console.log('All done!'))
    .catch((err) => {
        console.log(`Error in main(): ${err.stack || JSON.stringify(err)}`);
        process.exitCode = 1;
    });
