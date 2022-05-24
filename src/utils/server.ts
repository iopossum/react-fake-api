import { createServer, Response  } from "miragejs";
import { Server, FakeServerProps } from "./server.types";

export const setLSItem = <T>(name: string, value: T): void => {
  localStorage.setItem(name, JSON.stringify(value));
};

export const getLSItem = <T>(name: string): T => {
  const value = localStorage.getItem(name);
  let json = null;
  if (value) {
    try {
      json = JSON.parse(value);
    } catch (e) {
      console.log(e);
    }
  }
  return json;
};

export const deleteLSItem = (name: string): void => {
  localStorage.removeItem(name);
};

const reg = /^https?:\/\/./i;
let httpStatuses: number[] = Array.from({ length: 4 }).map((v, i) => i + 100);
httpStatuses = httpStatuses.concat(Array.from({ length: 7 }).map((v, i) => i + 200));
httpStatuses = httpStatuses.concat(Array.from({ length: 9 }).map((v, i) => i + 300));
httpStatuses = httpStatuses.concat(Array.from({ length: 18 }).map((v, i) => i + 400));
httpStatuses = httpStatuses.concat(Array.from({ length: 6 }).map((v, i) => i + 500));


export const makeServer = ({ timing = 500, defaultHost = '', passthrough, environment = "development", routes = [], ...opts }: FakeServerProps): Server => {

  const server = createServer({
    environment,

    routes() {
      this.timing = timing;
      routes.forEach(v => {
        if (v.checked) {
          const method = v.method || 'get';
          const opts = { timing: v.delay || timing };
          const defaultOpts = {
            status: 200,
            response: {}
          };
          if (v.error) {
            defaultOpts.status = 400;
            defaultOpts.response = { errors: [ 'some error'] };
          }
          let status = v.status || 0;
          if (httpStatuses.indexOf(status) === -1) {
            status = defaultOpts.status;
          }
          if (v.error && status < 400) {
            status = defaultOpts.status
          }
          const headers = v.headers && v.headers.reduce(
            (sum, v) => {
              sum[v.key] = v.value;
              return sum;
            },
            {} as Record<string, string>
          ) || {};
          const path = reg.test(v.path) ? v.path : `${defaultHost}${v.path}`;
          this[method](path, (...args) => {
            const response = !v.error && !v.custom && v.response ? v.response(...args) : v.custom || defaultOpts.response;
            return new Response(status, headers, response);
          }, opts);
        }
      });
    },

    ...opts
  });

  server.passthrough(passthrough);

  return server
}
