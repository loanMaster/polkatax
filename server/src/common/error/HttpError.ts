export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public requestUrl?: string,
  ) {
    super(message);
  }
}
