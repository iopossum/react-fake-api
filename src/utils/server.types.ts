import { Registry as MRegistry, Request as MRequest  } from "miragejs";
import { AnyFactories, AnyModels, AnyRegistry } from "miragejs/-types";
import { ServerConfig as MServerConfig, Server as MServer } from "miragejs/server";
import MSchema from "miragejs/orm/schema";

export type Registry<T extends AnyModels, K extends AnyFactories> = MRegistry<T, K>;
export type Request = MRequest;
export type Schema<T extends AnyRegistry> = MSchema<T>;
export type ServerConfig<T extends AnyModels, K extends AnyFactories> = MServerConfig<AnyModels, AnyFactories>;
export type Server = MServer;

export type Passthrough = (request: Request) => any;

export type MirageExtendedRequest = Request & {
  readyState: number,
  responseText: any,
  method: string,
  status: number
};

export declare const Methods: ['get', 'post', 'put', 'patch', 'delete'];
export type Method = typeof Methods[number];
export declare const RouteTypes: ['handled', 'manual'];
export type RouteType = typeof RouteTypes[number];

export type AnyResponse = Record<string, string> | undefined | string | number | Array<string | number | Record<string, string>>

export type Route = {
  path: string,
  method: Method,
  checked?: boolean,
  delay?: number,
  error?: boolean,
  status?: number,
  headers?: Header[],
  custom?: AnyResponse,
  response?: (schema?: Schema<Registry<AnyModels, AnyFactories>>, request?: Request) => AnyResponse,
  type?: RouteType | undefined,
  group?: string,
  color?: string
}

export type Header = {
  key: string | number,
  value: string
}

export type FakeServerProps = Omit<ServerConfig<AnyModels, AnyFactories>, "routes"> & {
  timing?: number,
  defaultHost?: string,
  routes?: Route[],
  environment?: string,
  passthrough: Passthrough
};
