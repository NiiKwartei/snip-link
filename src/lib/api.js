// ─────────────────────────────────────────────────
//  snip.link — API Client
// ─────────────────────────────────────────────────

const API_BASE = "/api";

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const { method = "GET", body, headers = {} } = options;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
  };

  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      data?.error || `Request failed (${res.status})`,
      res.status,
      data
    );
  }

  return data;
}

// ─── Auth ────────────────────────────────────────────
export const auth = {
  register: (email, password, name) =>
    request("/auth/register", { method: "POST", body: { email, password, name } }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),

  logout: () => request("/auth/logout", { method: "POST" }),

  me: () => request("/auth/me"),
};

// ─── Links ───────────────────────────────────────────
export const links = {
  create: (url, customAlias, options = {}) =>
    request("/links", {
      method: "POST",
      body: { url, customAlias: customAlias || undefined, ...options },
    }),

  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/links${qs ? `?${qs}` : ""}`);
  },

  get: (shortCode) => request(`/links/${shortCode}`),

  update: (shortCode, data) =>
    request(`/links/${shortCode}`, { method: "PATCH", body: data }),

  delete: (shortCode) =>
    request(`/links/${shortCode}`, { method: "DELETE" }),

  qrCode: (shortCode, format = "png", size = 300) =>
    `${API_BASE}/links/${shortCode}/qr?format=${format}&size=${size}`,
};

// ─── Analytics ───────────────────────────────────────
export const analytics = {
  summary: () => request("/analytics/summary"),

  timeseries: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/analytics/timeseries${qs ? `?${qs}` : ""}`);
  },

  hourly: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/analytics/hourly${qs ? `?${qs}` : ""}`);
  },

  breakdown: (field, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/analytics/breakdown/${field}${qs ? `?${qs}` : ""}`);
  },

  topLinks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/analytics/top-links${qs ? `?${qs}` : ""}`);
  },

  recentClicks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/analytics/recent-clicks${qs ? `?${qs}` : ""}`);
  },
};

export default { auth, links, analytics };
