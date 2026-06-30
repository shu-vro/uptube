import axios from "axios";

type RequestOptions = {
  endpoint: string;
  params?: Record<string, unknown>;
  full?: boolean;
  throwable?: boolean;
  baseUrl?: string;
};

const client = axios.create({
  withCredentials: true,
  headers: {
    "X-Platform": "web",
    "X-App-Version": "web",
  },
});

async function request(
  method: "get" | "put" | "post" | "delete",
  {
    endpoint,
    params = {},
    full = false,
    throwable = false,
    baseUrl = "/api/v1",
  }: RequestOptions,
) {
  let path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  try {
    const response = await client({
      method,
      url,
      data: method !== "get" ? params : undefined,
      params: method === "get" ? params : undefined,
    });

    if (response.data?.success) {
      return full ? response : response.data.data;
    }

    if (throwable) {
      throw new Error(
        response.data?.error || response.data?.message || "API request failed",
      );
    }
    return null;
  } catch (error: unknown) {
    if (throwable) {
      const err = error as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      throw new Error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Request failed",
      );
    }
    return null;
  }
}

export const get = (opts: Partial<RequestOptions>) =>
  request("get", opts as RequestOptions);
export const post = (opts: Partial<RequestOptions>) =>
  request("post", opts as RequestOptions);
export const put = (opts: Partial<RequestOptions>) =>
  request("put", opts as RequestOptions);
export const del = (opts: Partial<RequestOptions>) =>
  request("delete", opts as RequestOptions);
