import { AppError } from './response.js';

// Stops waiting if a promise takes longer than `ms` milliseconds
export function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new AppError(504, 'AI_TIMEOUT', 'The AI took too long. Please try again.')),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}