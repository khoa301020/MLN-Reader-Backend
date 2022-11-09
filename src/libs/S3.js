import AWS from 'aws-sdk';

const ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET = process.env.AWS_SECRET_KEY;

const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET,
});

export default s3;
