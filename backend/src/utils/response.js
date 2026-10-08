// Every successful reply looks the same: { ok: true, data: ... }
export function sendOk(res, data, status = 200) {
  res.status(status).json({ ok: true, data });
}

// Every error reply looks the same: { ok: false, error: { code, message } }
export function sendError(res, status, code, message) {
  res.status(status).json({ ok: false, error: { code, message } });
}

// A special error we can throw anywhere in our code
export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}