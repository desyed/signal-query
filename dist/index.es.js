var m = Object.defineProperty;
var w = (h, e, r) => e in h ? m(h, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : h[e] = r;
var l = (h, e, r) => w(h, typeof e != "symbol" ? e + "" : e, r);
const d = class d {
  constructor(e) {
    l(this, "_value");
    l(this, "listeners", /* @__PURE__ */ new Set());
    this._value = e;
  }
  track() {
    d.currentListener && this.listeners.add(d.currentListener);
  }
  trigger() {
    this.listeners.forEach((e) => e());
  }
  get value() {
    return this.track(), this._value;
  }
  set value(e) {
    this._value !== e && (this._value = e, this.trigger());
  }
};
l(d, "currentListener", null);
let i = d;
function p(h) {
  const e = () => {
    i.currentListener = e;
    try {
      h();
    } finally {
      i.currentListener = null;
    }
  };
  e();
}
class v {
  constructor(e) {
    l(this, "baseUrl");
    l(this, "defaultHeaders");
    l(this, "timeout");
    l(this, "cache");
    l(this, "tags");
    this.baseUrl = e.baseUrl, this.defaultHeaders = e.headers || {}, this.timeout = e.timeout || 5e3, this.cache = /* @__PURE__ */ new Map(), this.tags = /* @__PURE__ */ new Map();
  }
  static create(e) {
    return new v(e);
  }
  buildUrlWithParams(e, r) {
    if (!r) return e;
    const t = Object.entries(r).map(([u, a]) => `${encodeURIComponent(u)}=${encodeURIComponent(a)}`).join("&");
    return `${e}?${t}`;
  }
  fetchData(e) {
    const { method: r = "GET", url: t, headers: u = {}, params: a, timeout: c, responseType: s } = e, n = this.buildUrlWithParams(`${this.baseUrl}${t}`, a), o = new XMLHttpRequest();
    return o.open(r, n, !0), Object.entries({ ...this.defaultHeaders, ...u }).forEach(([f, E]) => {
      o.setRequestHeader(f, E);
    }), o.timeout = c || this.timeout, s && (o.responseType = s === "stream" ? "arraybuffer" : s), o;
  }
  get(e, r, t, u, a) {
    const c = `${e}?${new URLSearchParams(r).toString()}`;
    if (!this.cache.has(c)) {
      const s = {
        isLoading: new i(!0),
        data: new i(null),
        error: new i(null),
        isSuccess: new i(!1),
        isError: new i(!1)
      };
      this.cache.set(c, s), a && a.forEach((o) => {
        var f;
        this.tags.has(o) || this.tags.set(o, /* @__PURE__ */ new Set()), (f = this.tags.get(o)) == null || f.add(c);
      });
      const n = this.fetchData({ method: "GET", url: e, params: r, headers: t, responseType: u });
      n.onload = () => {
        n.status >= 200 && n.status < 300 ? (s.isLoading.value = !1, s.isSuccess.value = !0, s.data.value = n.response) : (s.isLoading.value = !1, s.isError.value = !0, s.error.value = new Error(`HTTP error! status: ${n.status}`));
      }, n.onerror = () => {
        s.isLoading.value = !1, s.isError.value = !0, s.error.value = new Error("Network error occurred");
      }, n.ontimeout = () => {
        s.isLoading.value = !1, s.isError.value = !0, s.error.value = new Error("Request timed out");
      }, n.send();
    }
    return this.cache.get(c);
  }
  post(e, r, t, u) {
    return this.request({ method: "POST", url: e, data: r, headers: t, tags: u });
  }
  put(e, r, t, u) {
    return this.request({ method: "PUT", url: e, data: r, headers: t, tags: u });
  }
  delete(e, r, t, u) {
    return this.request({ method: "DELETE", url: e, params: r, headers: t, tags: u });
  }
  request(e) {
    const r = {
      isLoading: new i(!0),
      data: new i(null),
      error: new i(null),
      isSuccess: new i(!1),
      isError: new i(!1)
    }, t = this.fetchData(e);
    return t.onload = () => {
      t.status >= 200 && t.status < 300 ? (r.isLoading.value = !1, r.isSuccess.value = !0, r.data.value = t.response, e.tags && this.revalidateTags(e.tags)) : (r.isLoading.value = !1, r.isError.value = !0, r.error.value = new Error(`HTTP error! status: ${t.status}`));
    }, t.onerror = () => {
      r.isLoading.value = !1, r.isError.value = !0, r.error.value = new Error("Network error occurred");
    }, t.ontimeout = () => {
      r.isLoading.value = !1, r.isError.value = !0, r.error.value = new Error("Request timed out");
    }, t.send(e.data ? JSON.stringify(e.data) : void 0), r;
  }
  revalidateTags(e) {
    e.forEach((r) => {
      const t = this.tags.get(r);
      t && t.forEach((u) => {
        const a = this.cache.get(u);
        if (a) {
          const [c, s] = u.split("?"), n = this.getParams(s), o = this.fetchData({ method: "GET", url: c, params: n });
          o.onload = () => {
            o.status >= 200 && o.status < 300 ? (a.data.value = o.response, a.isSuccess.value = !0, a.isError.value = !1, a.error.value = null) : (a.isError.value = !0, a.error.value = new Error(`HTTP error! status: ${o.status}`));
          }, o.onerror = () => {
            a.isError.value = !0, a.error.value = new Error("Network error occurred");
          }, o.send();
        }
      });
    });
  }
  getParams(e) {
    const r = {};
    return e && e.split("&").forEach((t) => {
      const [u, a] = t.split("=");
      r[decodeURIComponent(u)] = decodeURIComponent(a);
    }), r;
  }
}
export {
  v as SignalQuery,
  p as createEffect
};
//# sourceMappingURL=index.es.js.map
