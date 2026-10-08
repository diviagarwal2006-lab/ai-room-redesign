import { sendError } from '../utils/response.js';

// Runs when nobody answered the request (unknown URL)
export function notFoundHandler(req, res) {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} does not exist.`);
}

// Runs when any error happens. It must have 4 parameters, Express checks that.
export function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'Request body is not valid JSON.');
  }
  if (err.status && err.code) {
    return sendError(res, err.status, err.code, err.message);
  }
  console.error(err); // full details only in YOUR terminal
  sendError(res, 500, 'SERVER_ERROR', 'Something went wrong on the server.');
}