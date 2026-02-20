import { type ClientResponse, hc } from "hono/client";

import type { AppType } from "../../../api/src";
import { getToken } from "@/lib/clerk";

export type { InferRequestType, InferResponseType } from "hono/client";

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL!;
};

export const apiRpc = hc<AppType>(getBaseUrl(), {
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, init);
  },
}).api;

// Singleton authenticated client — avoid re-creating hc() on every call
let _apiClient: ReturnType<typeof hc<AppType>>["api"] | null = null;

export const getApiClient = () => {
  if (!_apiClient) {
    _apiClient = hc<AppType>(getBaseUrl(), {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        const authToken = await getToken();

        headers.set("Authorization", `Bearer ${authToken}`);

        // Removed cache: "no-store" — let React Query handle caching via staleTime.
        // no-store forces the browser to skip the HTTP cache entirely, which is wasteful
        // when React Query already manages freshness.
        const response = await fetch(input, {
          ...init,
          headers,
        });

        return response;
      },
    }).api;
  }
  return _apiClient;
};

// Singleton server client
let _serverClient: ReturnType<typeof hc<AppType>>["api"] | null = null;

export const getServerClient = () => {
  if (!_serverClient) {
    _serverClient = hc<AppType>(getBaseUrl(), {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        const response = await fetch(input, {
          ...init,
          headers,
        });

        return response;
      },
    }).api;
  }
  return _serverClient;
};

export const callRpc = async <T>(rpc: Promise<ClientResponse<T>>): Promise<T> => {
  try {
    const data = await rpc;

    if (!data.ok) {
      const res = await data.text();
      throw new Error(res);
    }

    const res = await data.json();
    return res as T;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
