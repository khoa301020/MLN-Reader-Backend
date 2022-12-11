const Const = Object.freeze({
    NOVEL_SUBJECT: ['novel', 'section', 'chapter', 'note'],
    MANGA_SUBJECT: ['manga', 'section', 'chapter'],
    DELETE_ACTION: ['delete', 'restore'],

    PAGINATE: 20,
    CURRENT_PAGE: 1,

    HTTP_OK: 200,
    HTTP_CREATED: 201,
    HTTP_BAD_REQUEST: 400,
    HTTP_UNAUTHORIZED: 401,
    HTTP_FORBIDDEN: 403,
    HTTP_NOT_FOUND: 404,
    HTTP_INTERNAL_SERVER_ERROR: 500,

    MONGO_ERROR_CODES: {
        11000: 'Duplicate key error',
        11001: 'Unknown modifier specified',
        12000: 'Cursor not found',
        12010: 'Index key not found',
        12011: 'Index cursor not found',
        12100: 'Collection not found',
        12151: 'Invalid namespace',
        13114: 'Not master',
        13136: 'No replica set members match the query',
        13138: 'No primary found in the replica set',
    }
});

export default Const;