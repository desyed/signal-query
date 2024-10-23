class Signal<T> {
  private _value: T;
  private listeners: Set<() => void> = new Set();

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  private track() {
    if (Signal.currentListener) {
      this.listeners.add(Signal.currentListener);
    }
  }

  private trigger() {
    this.listeners.forEach((listener) => listener());
  }

  get value(): T {
    this.track();
    return this._value;
  }

  set value(newValue: T) {
    if (this._value !== newValue) {
      this._value = newValue;
      this.trigger();
    }
  }

  static currentListener: (() => void) | null = null;
}

export function createEffect(callback: () => void) {
  const effect = () => {
    Signal.currentListener = effect;
    try {
      callback();
    } finally {
      Signal.currentListener = null;
    }
  };
  effect();
}

type RequestConfig = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  responseType?: "json" | "text" | "stream";
  tags?: string[];
};

type RequestResult<T> = {
  isLoading: Signal<boolean>;
  data: Signal<T | null>;
  error: Signal<Error | null>;
  isSuccess: Signal<boolean>;
  isError: Signal<boolean>;
};

export class SignalQuery {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private cache: Map<string, RequestResult<any>>;
  private tags: Map<string, Set<string>>;

  private constructor(config: { baseUrl: string; headers?: Record<string, string>; timeout?: number }) {
    this.baseUrl = config.baseUrl;
    this.defaultHeaders = config.headers || {};
    this.timeout = config.timeout || 5000;
    this.cache = new Map();
    this.tags = new Map();
  }

  static create(config: { baseUrl: string; headers?: Record<string, string>; timeout?: number }) {
    return new SignalQuery(config);
  }

  private buildUrlWithParams(url: string, params?: Record<string, any>): string {
    if (!params) return url;
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");
    return `${url}?${queryString}`;
  }

  private fetchData(config: RequestConfig): XMLHttpRequest {
    const { method = "GET", url, headers = {}, params, timeout, responseType } = config;
    const finalUrl = this.buildUrlWithParams(`${this.baseUrl}${url}`, params);

    const xhr = new XMLHttpRequest();
    xhr.open(method, finalUrl, true);

    Object.entries({ ...this.defaultHeaders, ...headers }).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.timeout = timeout || this.timeout;

    if (responseType) {
      xhr.responseType = responseType === 'stream' ? 'arraybuffer' : responseType;
    }

    return xhr;
  }

  get<T>(url: string, params?: Record<string, any>, headers?: Record<string, string>, responseType?: "json" | "text" | "stream", tags?: string[]): RequestResult<T> {
    const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;
    
    if (!this.cache.has(cacheKey)) {
      const result: RequestResult<T> = {
        isLoading: new Signal<boolean>(true),
        data: new Signal<T | null>(null),
        error: new Signal<Error | null>(null),
        isSuccess: new Signal<boolean>(false),
        isError: new Signal<boolean>(false),
      };
      this.cache.set(cacheKey, result);

      if (tags) {
        tags.forEach(tag => {
          if (!this.tags.has(tag)) {
            this.tags.set(tag, new Set());
          }
          this.tags.get(tag)?.add(cacheKey);
        });
      }

      const xhr = this.fetchData({ method: "GET", url, params, headers, responseType });

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          result.isLoading.value = false;
          result.isSuccess.value = true;
          result.data.value = xhr.response;
        } else {
          result.isLoading.value = false;
          result.isError.value = true;
          result.error.value = new Error(`HTTP error! status: ${xhr.status}`);
        }
      };

      xhr.onerror = () => {
        result.isLoading.value = false;
        result.isError.value = true;
        result.error.value = new Error('Network error occurred');
      };

      xhr.ontimeout = () => {
        result.isLoading.value = false;
        result.isError.value = true;
        result.error.value = new Error('Request timed out');
      };

      xhr.send();
    }

    return this.cache.get(cacheKey)!;
  }

  post<T>(url: string, data?: any, headers?: Record<string, string>, tags?: string[]): RequestResult<T> {
    return this.request<T>({ method: "POST", url, data, headers, tags });
  }

  put<T>(url: string, data?: any, headers?: Record<string, string>, tags?: string[]): RequestResult<T> {
    return this.request<T>({ method: "PUT", url, data, headers, tags });
  }

  delete<T>(url: string, params?: Record<string, any>, headers?: Record<string, string>, tags?: string[]): RequestResult<T> {
    return this.request<T>({ method: "DELETE", url, params, headers, tags });
  }

  private request<T>(config: RequestConfig): RequestResult<T> {
    const result: RequestResult<T> = {
      isLoading: new Signal<boolean>(true),
      data: new Signal<T | null>(null),
      error: new Signal<Error | null>(null),
      isSuccess: new Signal<boolean>(false),
      isError: new Signal<boolean>(false),
    };

    const xhr = this.fetchData(config);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        result.isLoading.value = false;
        result.isSuccess.value = true;
        result.data.value = xhr.response;

        if (config.tags) {
          this.revalidateTags(config.tags);
        }
      } else {
        result.isLoading.value = false;
        result.isError.value = true;
        result.error.value = new Error(`HTTP error! status: ${xhr.status}`);
      }
    };

    xhr.onerror = () => {
      result.isLoading.value = false;
      result.isError.value = true;
      result.error.value = new Error('Network error occurred');
    };

    xhr.ontimeout = () => {
      result.isLoading.value = false;
      result.isError.value = true;
      result.error.value = new Error('Request timed out');
    };

    xhr.send(config.data ? JSON.stringify(config.data) : undefined);

    return result;
  }

  private revalidateTags(tags: string[]) {
    tags.forEach(tag => {
      const cacheKeys = this.tags.get(tag);
      if (cacheKeys) {
        cacheKeys.forEach(key => {
          const cachedResult = this.cache.get(key);
          if (cachedResult) {
            const [url, paramsString] = key.split('?');
            const params = this.getParams(paramsString);
            const xhr = this.fetchData({ method: "GET", url, params });

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                cachedResult.data.value = xhr.response;
                cachedResult.isSuccess.value = true;
                cachedResult.isError.value = false;
                cachedResult.error.value = null;
              } else {
                cachedResult.isError.value = true;
                cachedResult.error.value = new Error(`HTTP error! status: ${xhr.status}`);
              }
            };

            xhr.onerror = () => {
              cachedResult.isError.value = true;
              cachedResult.error.value = new Error('Network error occurred');
            };

            xhr.send();
          }
        });
      }
    });
  }

  private getParams(queryString: string): Record<string, any> {
    const params: Record<string, any> = {};
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [k, v] = param.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v);
      });
    }
    return params;
  }
}
