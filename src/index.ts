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

function createEffect(callback: () => void) {
  Signal.currentListener = callback;
  callback();
  Signal.currentListener = null;
}

type RequestConfig = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  responseType?: "json" | "text" | "stream"; // Adding response type
  tags?: string[]; // Add tags to associate with requests
};

type RequestResult<T> = {
  isLoading: boolean;
  data: T | null; // Data can be of generic type
  error: Error | null;
  isSuccess: boolean;
  isError: boolean;
};

export class SignalQuery {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private cache: Map<string, Signal<any>>;
  private tags: Map<string, Set<string>>; // Mapping from tag to URLs

  private constructor(config: { baseUrl: string; headers?: Record<string, string>; timeout?: number }) {
    this.baseUrl = config.baseUrl;
    this.defaultHeaders = config.headers || {};
    this.timeout = config.timeout || 5000; // Default timeout of 5 seconds
    this.cache = new Map();
    this.tags = new Map(); // Initialize tags map
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

  private async fetchData<T>(config: RequestConfig): Promise<T> {
    const { method = "GET", url, headers = {}, params, data, timeout, responseType } = config;
    const finalUrl = this.buildUrlWithParams(`${this.baseUrl}${url}`, params);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout || this.timeout);

    const response = await fetch(finalUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...this.defaultHeaders,
        ...headers,
      },
      body: method === "GET" ? undefined : JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    // Handle different response types
    if (responseType === "stream") {
      return response.body as unknown as T; // Returning stream as generic type
    }

    return response.json() as Promise<T>;
  }

  async get<T>(url: string, params?: Record<string, any>, headers?: Record<string, string>, responseType?: "json" | "text" | "stream", tags?: string[]): Promise<RequestResult<T>> {
    const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;
    const result: RequestResult<T> = {
      isLoading: true,
      data: null,
      error: null,
      isSuccess: false,
      isError: false,
    };

    // Check if we have cached data
    if (!this.cache.has(cacheKey)) {
      const signal = new Signal<T>(null);
      this.cache.set(cacheKey, signal);

      // Associate tags with the cache key
      if (tags) {
        tags.forEach(tag => {
          if (!this.tags.has(tag)) {
            this.tags.set(tag, new Set());
          }
          this.tags.get(tag)?.add(cacheKey);
        });
      }

      // Fetch the data initially
      try {
        const data = await this.fetchData<T>({ method: "GET", url, params, headers, responseType });
        signal.value = data; // Update the signal value with fetched data
        result.isLoading = false;
        result.isSuccess = true;
        result.data = signal.value; // Assign the data directly
      } catch (error) {
        result.isLoading = false;
        result.isError = true;
        result.error = error;
      }
    } else {
      // If cached, set the signal from cache
      result.data = this.cache.get(cacheKey)!.value;
      result.isLoading = false;
      result.isSuccess = true;
    }

    return result; // Return the request result
  }

  async post<T>(url: string, data?: any, headers?: Record<string, string>, tags?: string[]): Promise<RequestResult<T>> {
    return this.request<T>({ method: "POST", url, data, headers, tags });
  }

  async put<T>(url: string, data?: any, headers?: Record<string, string>, tags?: string[]): Promise<RequestResult<T>> {
    return this.request<T>({ method: "PUT", url, data, headers, tags });
  }

  async delete<T>(url: string, params?: Record<string, any>, headers?: Record<string, string>, tags?: string[]): Promise<RequestResult<T>> {
    return this.request<T>({ method: "DELETE", url, params, headers, tags });
  }

  private async request<T>(config: RequestConfig): Promise<RequestResult<T>> {
    const result: RequestResult<T> = {
      isLoading: true,
      data: null,
      error: null,
      isSuccess: false,
      isError: false,
    };

    try {
      const response = await this.fetchData<T>(config);
      result.isLoading = false;
      result.isSuccess = true;
      result.data = response;

      // Revalidate cache entries for tags associated with this request
      if (config.tags) {
        config.tags.forEach(tag => {
          const cacheKeys = this.tags.get(tag);
          if (cacheKeys) {
            cacheKeys.forEach(key => {
              const cachedSignal = this.cache.get(key);
              if (cachedSignal) {
                // Re-fetch the data and update the signal
                this.fetchData({ method: "GET", url: key.split('?')[0], params: this.getParams(key) })
                  .then(data => {
                    cachedSignal.value = data;
                  });
              }
            });
          }
        });
      }

      return result;
    } catch (error) {
      result.isLoading = false;
      result.isError = true;
      result.error = error;
      return result;
    }
  }

  private getParams(key: string): Record<string, any> {
    const queryString = key.split('?')[1] || '';
    const params: Record<string, any> = {};
    queryString.split('&').forEach(param => {
      const [k, v] = param.split('=');
      params[decodeURIComponent(k)] = decodeURIComponent(v);
    });
    return params;
  }
}
