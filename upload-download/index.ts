/// <reference types="@types/parcel-env" />

declare global {
  interface Window {
    setApiCredentials: () => Promise<void>;
    uploadDocument: () => Promise<void>;
    downloadDocument: (id: string) => Promise<void>;
    listUploadedDocuments: () => Promise<void>;
  }
}

// eslint-disable-next-line import/extensions
import Parcel, { DocumentId } from '../..';
import streamSaver from 'streamsaver';

import fixtureJWK from '../../../../../runtime/genesis/test_identity_creds.json';

streamSaver.WritableStream = WritableStream;

if (module.hot) module.hot.accept();

const $ = <T extends Element = Element>(selector: string) => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`\`${selector}\` did not match any elements`);
  return element;
};

const apiCreds: HTMLTextAreaElement = $('#api-creds');
const setupErrorSpan = $('#setup-error');
const documentPicker: HTMLInputElement = $('#document-picker');
const documentName: HTMLInputElement = $('#document-name');
const documentsList = $('#uploaded-documents');

apiCreds.value = JSON.stringify(fixtureJWK, null, 4);

let parcel: Parcel;

// Resets API Credentials modal on hotreload
document.body.setAttribute('pre-auth', 'pre-auth');

window.setApiCredentials = async function () {
  setupErrorSpan.classList.remove('visible');

  const creds = apiCreds.value;
  const tokenSource = await (async () => JSON.parse(creds))().catch(() => creds);

  try {
    parcel = new Parcel(tokenSource, {
      apiUrl: process.env.API,
    });
    await parcel.getCurrentIdentity();
    document.body.removeAttribute('pre-auth');
    void window.listUploadedDocuments();
  } catch (error: any) {
    console.error(error);
    setupErrorSpan.textContent = error.toString();
    setupErrorSpan.classList.add('visible');
  }
};

window.uploadDocument = async function () {
  const documentFile = documentPicker.files![0];
  const document = await parcel.uploadDocument(documentFile, {
    details: { title: documentName.value },
    toApp: undefined,
  }).finished;
  addDocumentToList(document.id, document.details.title);
};

window.downloadDocument = async function (id: string) {
  const download = parcel.downloadDocument(id as DocumentId);
  const saver = streamSaver.createWriteStream(`document-${id}`);
  await download.pipeTo(saver);
};

window.listUploadedDocuments = async function () {
  if (!parcel) return;
  const uploadedDocuments = (
    await parcel.listDocuments({
      creator: (await parcel.getCurrentIdentity()).id,
    })
  ).results;

  while (documentsList.lastChild) documentsList.lastChild.remove();
  for (const d of uploadedDocuments) addDocumentToList(d.id, d.details.title);
};

function addDocumentToList(id: string, name?: string) {
  const documentItem = document.createElement('li');
  const documentLink = document.createElement('a');

  documentLink.href = `javascript:downloadDocument('${id}')`;
  documentLink.textContent = `${name ?? 'Untitled'} (${id})`;

  documentItem.append(documentLink);
  documentsList.append(documentItem);
}

// $('#api-creds-modal form').submit(); // For debugging: auto-login
