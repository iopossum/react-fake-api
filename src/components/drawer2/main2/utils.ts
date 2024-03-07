import { IRoute, TMethod, IMirageExtendedRequest } from "@src/types";

export const getPathKey = (v: IRoute) => `${v.method || "get"}_${v.path}`;

export const getMethodColor = (method: TMethod) => {
  let color = "success";
  switch (method) {
    case "post":
    case "put":
    case "patch":
      color = "processing";
      break;
    case "delete":
      color = "warning";
      break;
  }
  return color;
};

export const waitResponse = (request: IMirageExtendedRequest) => {
  let i = 0;
  return new Promise<string>((resolve, reject) => {
    if (request.readyState === 4) {
      resolve(request.responseText);
      return false;
    }
    const interval = setInterval(() => {
      if (request.readyState === 4) {
        resolve(request.responseText);
        clearInterval(interval);
        return false;
      }
      if (i < 90) {
        i++;
      } else {
        clearInterval(interval);
        reject();
      }
      return false;
    }, 1000);
  });
};

export const convertRoutes = (routes?: IRoute[]) => {
  return (
    routes?.map((v, i) => ({
      ...v,
      method: v.method || "get",
      index: i,
    })) || []
  );
};
