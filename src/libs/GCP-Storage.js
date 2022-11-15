import { Storage } from "@google-cloud/storage";

const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_KEY_FILE,
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);

export default bucket;
