import { Registry, Request } from "miragejs";
import { AnyFactories, AnyModels, AnyResponse } from "miragejs/-types";
import Schema from "miragejs/orm/schema";

export interface IMirageExtendedRequest extends Request {
  readyState: number;
  responseText: string;
  method: string;
  status: number;
}

export const METHODS = ["get", "post", "put", "patch", "delete"] as const;
export type TMethod = (typeof METHODS)[number];
export type THandled = "handled";
export type TManual = "manual";
export const ROUTE_TYPES: [THandled, TManual] = ["handled", "manual"] as const;
export type TRouteType = (typeof ROUTE_TYPES)[number];

export interface IHeader {
  key: string | number;
  value: string;
}

export interface IRoute<
  T extends AnyModels = AnyModels,
  K extends AnyFactories = AnyFactories,
> {
  path: string;
  method: TMethod;
  checked?: boolean;
  delay?: number;
  error?: boolean;
  status?: number;
  headers?: IHeader[];
  custom?: AnyResponse;
  type?: TRouteType;
  group?: string;
  color?: string;
  isText?: boolean;
  response?: (
    schema?: Schema<Registry<T, K>>,
    request?: Request,
  ) => AnyResponse;
}

export interface IStorageCfg {
  autoHandle: boolean;
  routes: IRoute[];
}

export type TResolve<T> = (value: PromiseLike<T> | T) => void;
export type TReject = (reason?: unknown) => void;

export interface IPromise<T> {
  resolve: null | TResolve<T>;
  reject: null | TReject;
}

export interface ILabelValue {
  label: string;
  value: string;
}
