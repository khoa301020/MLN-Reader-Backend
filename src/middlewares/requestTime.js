const requestTime = function (req, res, next) {
    if (req) {
        req.requestTime = Date.now()
        next()
    }
}

export default requestTime;