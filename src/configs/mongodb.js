import 'dotenv/config';
import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

const MONGO_DB_URL = process.env.MONGO_URI;

const connectToDatabase = (
    mongoDatabaseURI = MONGO_DB_URL,
) => mongoose.connect(mongoDatabaseURI);

export default connectToDatabase;