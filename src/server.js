import 'dotenv/config';
import app from './app/App.js';
import connectToDatabase from './configs/mongodb.js';
// import initializers
import initStatus from "./utils/initStatus.js";

const PORT = process.env.PORT;
connectToDatabase()
    .then(() => {
        app.listen(PORT, () => console.log(`Running server on port: ${PORT}`));
        initStatus();
    })
    .catch((error) => {
        console.log('Connection with database generated an error:\r\n');
        console.error(error);
        console.log('\r\nServer initialization cancelled');
        process.exit(0);
    });