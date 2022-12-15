function removeEmpty(obj) {
    for (var propName in obj) {
        if (obj[propName] === null || obj[propName] === undefined || obj[propName] === '' || obj[propName] === [] || obj[propName] === {}) {
            delete obj[propName];
        }
    }
    return obj;
}

const getCurrent = () => {
    const current = new Date().toLocaleDateString('vi-VN', {
        month: '2-digit', day: '2-digit', year: 'numeric'
    }).split('/');
    const currentDate = `${current[0]}${current[1]}${current[2]}`;
    const currentMonth = `${current[1]}${current[2]}`;
    const currentYear = `${current[2]}`;

    return { currentDate, currentMonth, currentYear };
}

const generateKeys = () => {
    const crypto = require('crypto')

    const key1 = crypto.randomBytes(32).toString('hex')
    const key2 = crypto.randomBytes(32).toString('hex')
    console.table({ key1, key2 })
}

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
export { capitalizeFirstLetter, removeEmpty, getCurrent };
