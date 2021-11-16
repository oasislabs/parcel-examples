import fs from 'fs';

import Parcel, { AppId, JobPhase, JobSpec, JobStatusReport } from '@oasislabs/parcel';

// --- Upload data as Bob.
// In a real-world scenario, these credentials would typically be used in a completely separate script
// because no single entity has access to both Acme and Bob credentials.
// This example script, however, performs actions both as Acme and Bob so that the flow is easier to
// follow.
// #region snippet-input-documents
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
const bobId = (await parcelBob.getCurrentIdentity()).id;

// Upload a documents and give Acme access to it.
console.log('Uploading input document as Bob.');
const skinDocument = await parcelBob.uploadDocument(
  await fs.promises.readFile('docker/test_workdir/data/in/basal_cell_carcinoma_example.jpg'),
  { details: { title: 'User-provided skin image' }, toApp: undefined },
).finished;
await parcelBob.createGrant({
  grantee: process.env.ACME_APP_ID! as AppId,
  condition: {
    $and: [
      { 'document.id': { $eq: skinDocument.id } },
      { 'job.spec.image': { $eq: 'oasislabs/acme-derma-demo' } },
    ],
  },
});
// #endregion snippet-input-documents

// --- Run compute job as Acme.
// #region snippet-submit-job
// Define the job.
const jobSpec: JobSpec = {
  name: 'skin-prediction',
  image: 'oasislabs/acme-derma-demo',
  inputDocuments: [{ mountPath: 'skin.jpg', id: skinDocument.id }],
  outputDocuments: [{ mountPath: 'prediction.txt', owner: bobId }],
  cmd: ['python', 'predict.py', '/parcel/data/in/skin.jpg', '/parcel/data/out/prediction.txt'],
  memory: '2G',
};
// #endregion snippet-submit-job

// Submit the job.
console.log('Running the job as Acme.');
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
const jobId = (await parcelAcme.submitJob(jobSpec)).id;

// Wait for job completion.
let jobReport: JobStatusReport;
do {
  await new Promise((resolve) => setTimeout(resolve, 5000)); // eslint-disable-line no-promise-executor-return
  jobReport = await parcelAcme.getJobStatus(jobId);
  console.log(`Job status is ${JSON.stringify(jobReport.status)}`);
} while (
  jobReport.status.phase === JobPhase.PENDING ||
  jobReport.status.phase === JobPhase.RUNNING
);

const job = await parcelAcme.getJob(jobId);

console.log(
  `Job ${jobId} completed with status ${job.status?.phase} and ${job.io.outputDocuments.length} output document(s).`,
);

// Obtain compute job output -- again as Bob, because the computation was confidential and Acme
// does not have access to the output data.
// #region snippet-job-output
console.log('Downloading output document as Bob.');
const download = parcelBob.downloadDocument(job.io.outputDocuments[0].id);
const saver = fs.createWriteStream(`/tmp/output_document`);
await download.pipeTo(saver);
const output = fs.readFileSync('/tmp/output_document', 'utf-8');
console.log(`Here's the computed result: "${output}"`);
// #endregion snippet-job-output
