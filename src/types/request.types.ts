import { Request } from 'express';
import { UserRole } from '../models/user.model';

export type TypedRequestBody<T> = Request<Record<string, never>, Record<string, never>, T>;
export type TypedRequestBodyAndParams<T, P> = Request<P, Record<string, never>, T>;
export type TypedRequestParams<P> = Request<P, Record<string, never>, Record<string, never>>;
export type TypedRequestQuery<Q> = Request<Record<string, never>, Record<string, never>, Record<string, never>, Q>;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}
