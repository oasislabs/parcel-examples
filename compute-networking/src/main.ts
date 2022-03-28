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

// Upload a document and give Acme access to it.
console.log('Uploading input portfolio document as Bob.');
const portfolioDocument = await parcelBob.uploadDocument(
  await fs.promises.readFile('docker/test_workdir/data/in/portfolio.json'),
  { details: { title: 'Cryptocurrency holdings' }, toApp: undefined },
).finished;
await parcelBob.createGrant({
  grantee: process.env.ACME_APP_ID! as AppId,
  condition: {
    $and: [
      { 'document.id': { $eq: portfolioDocument.id } },
      { 'job.spec.image': { $eq: 'oasislabs/acme-network-demo' } },
    ],
  },
});
// #endregion snippet-input-documents

// --- Run compute job as Acme.
// #region snippet-submit-job
// Initialize Parcel as Acme
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

// Define the job.
const jobSpec: JobSpec = {
  name: 'portfolio-report-generator',
  image: 'oasislabs/acme-network-demo',
  env: { CMC_API_KEY: 'f4017404-0b14-4fa9-9599-881bbb721547' }, // Your API key here
  inputDocuments: [{ mountPath: 'portfolio.json', id: portfolioDocument.id }],
  outputDocuments: [{ mountPath: 'report.txt', owner: bobId }],
  cmd: [
    'sh',
    '-c',
    'echo 104.17.137.178 pro-api.coinmarketcap.com >> /etc/hosts && python3 report_generator.py /parcel/data/in/portfolio.json /parcel/data/in/api_key.txt /parcel/data/out/report.txt',
  ],
  // Whitelist the CoinMarketCap API IP address using a cidr-style block.
  networkPolicy: {
    egress: [{ cidr: '104.17.137.178/32' }],
  },
  memory: '2G',
};

// Submit the job.
console.log('Running the job as Acme.');
const jobId = (await parcelAcme.submitJob(jobSpec)).id;
// #endregion snippet-submit-job

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

// Obtain compute job output -- again as Bob, who is the owner of the output Document.
// #region snippet-job-output
const job = await parcelAcme.getJob(jobId);
console.log(
  `Job ${jobId} completed with status ${job.status?.phase} and ${job.io.outputDocuments.length} output document(s).`,
);

console.log('Downloading output document as Bob.');
const download = parcelBob.downloadDocument(job.io.outputDocuments[0].id);
const saver = fs.createWriteStream(`/tmp/output_document`);
await download.pipeTo(saver);
const output = fs.readFileSync('/tmp/output_document', 'utf-8');
console.log(`Here's the computed result: "${output}"`);
// #endregion snippet-job-output
