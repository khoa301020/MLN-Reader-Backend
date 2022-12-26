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
        month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh',
    }).split('/');
    const currentDate = `${current[0]}${current[1]}${current[2]}`;
    const currentMonth = `${current[1]}${current[2]}`;
    const currentYear = `${current[2]}`;

    return { currentDate, currentMonth, currentYear };
}

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const datetimeAsInteger = (date) => {
    return new Date(date).getTime();
}

export { capitalizeFirstLetter, removeEmpty, getCurrent, datetimeAsInteger };
