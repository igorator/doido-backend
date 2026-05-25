export interface HttpError {
  message: string;
  statusCode: number;
}

export function isHttpError(value: unknown): value is HttpError {
  return typeof value === 'object' && value !== null && 'statusCode' in value && 'message' in value;
}

export function createHttpError(message: string, statusCode: number): HttpError & Error {
  return Object.assign(new Error(message), { statusCode }) as HttpError & Error;
}
