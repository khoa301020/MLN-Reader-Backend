import { SystemStatus } from '../models/common.model.js';

const initStatus = () => {
    // check if novel status exists
    SystemStatus.findOne({}, function (err, status) {
        if (!status) {
            const status = new SystemStatus;
            status.save();
        }
    });
}

export default initStatus;