export interface DataRequest<T> {
  data: T | undefined;
  error?: any; // TODO
  pending: boolean;
}

export class PendingRequest<T> implements DataRequest<T> {
  pending = true;
  constructor(public data: T) {}
}

export class CompletedRequest<T> implements DataRequest<T> {
  pending = false;
  constructor(public data: T) {}
}
