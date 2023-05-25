import { logger } from './logger';

export function handleException(error: unknown, location: string) {
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'An unknown error occurred';
  }

  logger.error(`Error in ${location}: ${errorMessage}`);
}
