const ENV_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Use localhost in development unless explicitly overridden.
export const BASE_URL = ENV_BASE_URL || (
  import.meta.env.DEV
    ? "http://localhost:4000"
    : "https://d233wpvxi3tdmh.cloudfront.net"
);

export async function getTenantConfig(host = window.location.hostname || "localhost") {
  const res = await fetch(
    `${BASE_URL}/public/tenant-config?host=${encodeURIComponent(host)}`
  );

  if (!res.ok) {
    throw new Error(`Failed to load tenant config: ${res.status}`);
  }

  return res.json();
}

function setAccessToken(token) {
  if (token) localStorage.setItem("authToken", token);
  else localStorage.removeItem("authToken");
}

function getAccessToken() {
  return localStorage.getItem("authToken");
}

function setUser(user) {
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
}

export function getStoredUser() {
  const raw = localStorage.getItem("user");
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` })
  };
}

// --- AUTH APIs ---

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // saves refresh cookie
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Login failed");
  }

  // new backend returns accessToken
  setAccessToken(data.accessToken);
  setUser(data.user);

  return data.user;
}

async function refreshAccessToken() {
  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // sends refresh cookie
  });

  if (!res.ok) return null;

  const data = await res.json().catch(() => ({}));
  if (data?.accessToken) {
    setAccessToken(data.accessToken);
    return data.accessToken;
  }
  return null;
}

export async function logout() {
  // best-effort server logout (revokes refresh token)
  await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  }).catch(() => {});

  setAccessToken(null);
  setUser(null);
}


export async function fetchWithAuth(path, options = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  // 1) Try with current access token
  const res1 = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...getAuthHeaders(),
    },
    credentials: "include",
  });

  if (res1.status !== 401) return res1;

  // 2) Try refresh once
  const newToken = await refreshAccessToken();
  if (!newToken) {
    await logout();
    throw new Error("Session expired");
  }

  // 3) Retry original request with new token
  const res2 = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${newToken}`,
    },
    credentials: "include",
  });

  return res2;
}

export async function getConversations(size = "all", fromDate = null, toDate = null) {
  const url = new URL("/api/conversations", BASE_URL);
  if (size != null) {
    url.searchParams.set("size", String(size));
  }
  if (fromDate) {
    url.searchParams.set("from", fromDate);
  }
  if (toDate) {
    url.searchParams.set("to", toDate);
  }

  const res = await fetchWithAuth(url.toString());
  
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function getConversation(conversationId) {
  const res = await fetchWithAuth(`${BASE_URL}/api/conversations/${conversationId}`);
  
  if (res.status === 404) {
    throw new Error("Conversation not found");
  }
  
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}


export async function analyzeConversations(onlySource = null, fromDate = null, toDate = null) {
  const res = await fetchWithAuth(`${BASE_URL}/api/analyze`, {
    method: "POST",
    body: JSON.stringify({ onlySource, fromDate, toDate })
  });
  
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

// Fast base analytics (no AI) - ~3 seconds
export async function analyzeConversationsBase(onlySource = null, fromDate = null, toDate = null) {
  const res = await fetchWithAuth(`${BASE_URL}/api/analyze/base`, {
    method: "POST",
    body: JSON.stringify({ onlySource, fromDate, toDate })
  });
  
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

// AI question clustering - ~12 seconds
export async function getAIQuestionClusters(enriched) {
  const res = await fetchWithAuth(`${BASE_URL}/api/analyze/clusters`, {
    method: "POST",
    body: JSON.stringify({ enriched })
  });
  
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

// AI executive summary - ~8 seconds
export async function getAIExecutiveSummary(kpis, conv, friction) {
  const res = await fetchWithAuth(`${BASE_URL}/api/analyze/summary`, {
    method: "POST",
    body: JSON.stringify({ kpis, conv, friction })
  });
  
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

// AI recommendations - ~8 seconds
export async function getAIRecommendations(kpis, conv, friction) {
  const res = await fetchWithAuth(`${BASE_URL}/api/analyze/recommendations`, {
    method: "POST",
    body: JSON.stringify({ kpis, conv, friction })
  });
  
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

// ===============================
// Product Analytics APIs
// ===============================
export async function getTopRecommendedProducts(limit = 5, fromDate = null, toDate = null) {
  let url = `${BASE_URL}/api/top-products/recommended?limit=${limit}`;
  if (fromDate) url += `&from=${fromDate}`;
  if (toDate) url += `&to=${toDate}`;
  
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error("Failed to load recommended products");
  return res.json();
}

export async function getTopClickedProducts(limit = 5, fromDate = null, toDate = null) {
  let url = `${BASE_URL}/api/top-products/clicked?limit=${limit}`;
  if (fromDate) url += `&from=${fromDate}`;
  if (toDate) url += `&to=${toDate}`;
  
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error("Failed to load clicked products");
  return res.json();
}

export async function getLeads(size = 100, fromDate = null, toDate = null) {
  const url = new URL("/api/leads", BASE_URL);
  url.searchParams.set("size", String(size));
  if (fromDate) {
    url.searchParams.set("from", fromDate);
  }
  if (toDate) {
    url.searchParams.set("to", toDate);
  }

  const res = await fetchWithAuth(url.toString());
  
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function captureLeadSubmission(payload) {
  const res = await fetchWithAuth(`${BASE_URL}/api/leads/capture`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed: ${res.status}`);
  }

  return res.json();
}

export async function getLeadDetails(leadId) {
  if (!leadId) throw new Error("leadId is required");

  const res = await fetchWithAuth(`${BASE_URL}/api/leads/${leadId}`);

  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function updateLead(leadId, payload) {
  if (!leadId) throw new Error("leadId is required");

  const res = await fetchWithAuth(`${BASE_URL}/api/leads/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed: ${res.status}`);
  }

  return res.json();
}

export async function syncChats() {
  const res = await fetchWithAuth(`${BASE_URL}/api/sync/chats`, {
    method: "POST",
  });

  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function submitAnswerFeedback({ conversationId, messageId, dateTime, question, currentAnswer, expectedAnswer }) {
  const res = await fetchWithAuth(`${BASE_URL}/api/answer-feedback`, {
    method: "POST",
    body: JSON.stringify({ conversationId, messageId, dateTime, question, currentAnswer, expectedAnswer }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed: ${res.status}`);
  }
  return res.json();
}
