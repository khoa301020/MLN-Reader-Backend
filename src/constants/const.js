import { getCurrent } from "../helper/helper.js";

const Const = Object.freeze({
    NOVEL_SUBJECTS: ['novel', 'section', 'chapter', 'note'],
    MANGA_SUBJECTS: ['manga', 'section', 'chapter'],
    DELETE_ACTIONS: ['delete', 'restore'],
    FOLLOW_ACTIONS: ['follow', 'unfollow'],
    COMMENT_ACTIONS: ['comment', 'modify', 'delete'],

    QUERY_SORT: {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        lastUpdate: { lastUpdate: -1 },
        topViewTotal: { "statistics.totalView": -1 },
        topViewDaily: { [`statistics.dailyView.${getCurrent().currentDate}`]: -1 },
        topViewMonthly: { [`statistics.monthlyView.${getCurrent().currentMonth}`]: -1 },
        topViewYearly: { [`statistics.yearlyView.${getCurrent().currentYear}`]: -1 },
        topFollow: { "followersCount": -1 },
        topRating: { "ratingSum": -1 },
    },

    GCP_FILE_METADATA: {
        cacheControl: 'private',
    },

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