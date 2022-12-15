import _const from "../constants/const.js"
import { removeEmpty } from "../helper/helper.js"

const customResponse = (req, res, next) => {
    /**
     * (default status 200)
     * Success response
     */
    res.success = function ({ result = {}, code = _const.HTTP_OK, message = null }) {
        return res.status(code).json(removeEmpty({
            code,
            message,
            result,
        }))
    }

    /**
     * (status 201)
     * Created response
     */
    res.created = function ({ result = {}, code = _const.HTTP_CREATED, message = "" }) {
        return res.status(code).success(removeEmpty({
            code,
            message,
            result,
        }))
    }

    /**
     * (status 201)
     * Updated response
     */
    res.updated = function ({ result = {}, code = _const.HTTP_CREATED, message = "" }) {
        return res.status(code).success(removeEmpty({
            code,
            message,
            result,
        }))
    }

    /**
     * (status 400)
     * Bad request response
    */
    res.badreq = function ({ errors = {}, code = _const.HTTP_BAD_REQUEST, message = "", result = {} }) {
        return res.status(code).error(removeEmpty({
            code,
            message,
            result,
            errors,
        }))
    }

    /**
     * (status 401)
     * Unauthorize request response
    */
    res.unauth = function ({ errors = {}, code = _const.HTTP_UNAUTHORIZED, message = "", result = {} }) {
        return res.status(code).error(removeEmpty({
            code,
            message,
            result,
            errors,
        }))
    }

    /**
     * (status 403)
     * Forbidden request response
    */
    res.forbidden = function ({ errors = {}, code = _const.HTTP_FORBIDDEN, message = "", result = {} }) {
        return res.status(code).error(removeEmpty({
            code,
            message,
            result,
            errors,
        }))
    }

    /**
     * (status 500)
     * Internal request response
    */
    res.internal = function ({ errors = {}, code = _const.HTTP_INTERNAL_SERVER_ERROR, message = "", result = {} }) {
        if (errors.code && errors.code in _const.MONGO_ERROR_CODES)
            message = _const.MONGO_ERROR_CODES[errors.code]

        return res.status(code).error(removeEmpty({
            code,
            message,
            result,
            errors,
        }))
    }

    /**
     * Custom error response
     */
    res.error = function ({ errors = {}, code = _const.HTTP_BAD_REQUEST, message = "", result = {} }) {
        if (errors?.code && errors.code in _const.MONGO_ERROR_CODES)
            message = _const.MONGO_ERROR_CODES[errors.code]

        return res.status(code).json(removeEmpty({
            code,
            message,
            result,
            errors,
        }))
    }

    next()
}

export default customResponse;