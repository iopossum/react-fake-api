import { createServer, Request, Response } from "miragejs";
import { AnyFactories, AnyModels, AnyResponse } from "miragejs/-types";

import { IRoute } from "@src/types";

type TServerConfig<
  T extends AnyModels = AnyModels,
  K extends AnyFactories = AnyFactories,
> = Parameters<typeof createServer<T, K>>[number];

const reg = /^https?:\/\/./i;
let httpStatuses: number[] = Array.from({ length: 4 }).map((v, i) => i + 100);
httpStatuses = httpStatuses.concat(
  Array.from({ length: 7 }).map((v, i) => i + 200),
);
httpStatuses = httpStatuses.concat(
  Array.from({ length: 9 }).map((v, i) => i + 300),
);
httpStatuses = httpStatuses.concat(
  Array.from({ length: 18 }).map((v, i) => i + 400),
);
httpStatuses = httpStatuses.concat(
  Array.from({ length: 6 }).map((v, i) => i + 500),
);

export interface IFakeServerProps<
  T extends AnyModels = AnyModels,
  K extends AnyFactories = AnyFactories,
> extends Omit<TServerConfig<T, K>, "routes"> {
  timing?: number;
  defaultHost?: string;
  routes?: IRoute<T, K>[];
  environment?: string;
  passthrough: (request: Request) => AnyResponse;
}

export const makeServer = <
  T extends AnyModels = AnyModels,
  K extends AnyFactories = AnyFactories,
>({
  timing = 500,
  defaultHost = "",
  passthrough,
  environment = "development",
  routes = [],
  ...opts
}: IFakeServerProps<T, K>) => {
  const server = createServer({
    environment,

    routes() {
      this.timing = timing;
      routes.forEach((v) => {
        if (v.checked) {
          const method = v.method || "get";
          const opts = { timing: v.delay || timing };
          const defaultOpts = {
            status: 200,
            response: {},
          };
          if (v.error) {
            defaultOpts.status = 400;
            defaultOpts.response = { errors: ["some error"] };
          }
          let status = v.status || 0;
          if (httpStatuses.indexOf(status) === -1) {
            status = defaultOpts.status;
          }
          if (v.error && status < 400) {
            status = defaultOpts.status;
          }
          const headers =
            (v.headers &&
              v.headers.reduce(
                (sum, v) => {
                  sum[v.key] = v.value;
                  return sum;
                },
                {} as Record<string, string>,
              )) ||
            {};
          const path = reg.test(v.path) ? v.path : `${defaultHost}${v.path}`;
          this[method](
            path,
            (...args) => {
              const response =
                (!v.error && !v.custom && v.response?.(...args)) ||
                v.custom ||
                defaultOpts.response;
              return new Response(status, headers, response as Object);
            },
            opts,
          );
        }
      });
    },

    ...opts,
  });

  server.passthrough(passthrough);

  return server;
};
