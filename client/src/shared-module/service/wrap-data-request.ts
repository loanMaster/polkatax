import { map } from 'rxjs/operators';
import { DataRequest } from '../model/data-request';

export const wrapDataRequest = <T>() =>
    map((value: T): DataRequest<T> => ({
      data: value,
      pending: false,
    }));
