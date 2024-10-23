declare class Signal<T> {
    private _value;
    private listeners;
    constructor(initialValue: T);
    private track;
    private trigger;
    get value(): T;
    set value(newValue: T);
    static currentListener: (() => void) | null;
}
export declare function createEffect(callback: () => void): void;
type RequestResult<T> = {
    isLoading: Signal<boolean>;
    data: Signal<T | null>;
    error: Signal<Error | null>;
    isSuccess: Signal<boolean>;
    isError: Signal<boolean>;
};
export declare class SignalQuery {
    private baseUrl;
    private defaultHeaders;
    private timeout;
    private cache;
    private tags;
    private constructor();
    static create(config: {
        baseUrl: string;
        headers?: Record<string, string>;
        timeout?: number;
    }): SignalQuery;
    private buildUrlWithParams;
    private fetchData;
    get<T>(url: string, params?: Record<string, any>, headers?: Record<string, string>, responseType?: "json" | "text" | "stream", tags?: string[]): RequestResult<T>;
    post<T>(url: string, data?: any, headers?: Record<string, string>, tags?: string[]): RequestResult<T>;
    put<T>(url: string, data?: any, headers?: Record<string, string>, tags?: string[]): RequestResult<T>;
    delete<T>(url: string, params?: Record<string, any>, headers?: Record<string, string>, tags?: string[]): RequestResult<T>;
    private request;
    private revalidateTags;
    private getParams;
}
export {};
