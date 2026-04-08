const BASE_URL = "http://localhost:8000/api";

const TOKEN_KEY = "prodia_access";
const REFRESH_KEY = "prodia_refresh";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveTokens(access, refresh) {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem("prodia_user");
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;

  const res = await window._originalFetch(`${BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    window.location.reload();
    return null;
  }

  const data = await res.json();
  saveTokens(data.access, data.refresh ?? null);
  return data.access;
}

/**
 * 認証付き fetch ラッパー（個別呼び出し用）
 * 401 発生時にトークンを自動リフレッシュして1回リトライする。
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const makeHeaders = (token) => {
    const isFormData = options.body instanceof FormData;
    const hasContentType = options.headers && 'Content-Type' in options.headers;
    return {
      ...(!isFormData && !hasContentType ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  let token = getAccessToken();
  let res = await window._originalFetch(url, { ...options, headers: makeHeaders(token) });

  if (res.status === 401) {
    token = await refreshAccessToken();
    if (!token) return res;
    res = await window._originalFetch(url, { ...options, headers: makeHeaders(token) });
  }

  return res;
}

/**
 * グローバル fetch インターセプター。
 * index.js で一度だけ呼び出すことで、全コンポーネントの fetch に
 * 自動で JWT Authorization ヘッダーを付与する。
 */
export function installFetchInterceptor() {
  if (window._originalFetch) return; // 二重インストール防止
  window._originalFetch = window.fetch.bind(window);

  let isRefreshing = false;
  let refreshQueue = [];

  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;

    // 対象外: ログイン・リフレッシュ・外部URL
    const isApiCall = url.includes("localhost:8000/api");
    const isAuthEndpoint = url.includes("/auth/login/") || url.includes("/auth/refresh/");
    if (!isApiCall || isAuthEndpoint) {
      return window._originalFetch(input, init);
    }

    const token = getAccessToken();
    const isFormData = init.body instanceof FormData;
    const headers = {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let res = await window._originalFetch(input, { ...init, headers });

    // 401 → トークンリフレッシュ（同時リクエストをキューに積む）
    if (res.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken().finally(() => {
          isRefreshing = false;
          refreshQueue.forEach((cb) => cb());
          refreshQueue = [];
        });
        if (!newToken) return res;
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        res = await window._originalFetch(input, { ...init, headers: retryHeaders });
      } else {
        // 他のリクエストがリフレッシュ中 → 完了を待ってリトライ
        await new Promise((resolve) => refreshQueue.push(resolve));
        const retryToken = getAccessToken();
        const retryHeaders = { ...headers, ...(retryToken ? { Authorization: `Bearer ${retryToken}` } : {}) };
        res = await window._originalFetch(input, { ...init, headers: retryHeaders });
      }
    }

    return res;
  };
}

