function removeEmpty(obj) {
    for (var propName in obj) {
        if (obj[propName] === null || obj[propName] === undefined || obj[propName] === '' || obj[propName] === [] || obj[propName] === {}) {
            delete obj[propName];
        }
    }
    return obj;
}

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
export { capitalizeFirstLetter, removeEmpty };
