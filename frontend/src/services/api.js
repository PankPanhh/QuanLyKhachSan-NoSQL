// src/services/api.js
class ApiClient {
  constructor(baseURL) {
    // Allow overriding via Vite env var VITE_API_URL, otherwise fall back to localhost
    const envBase =
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL;
    this.baseURL = baseURL || envBase || "http://localhost:5000/api/v1";
  }

  // timeout in ms to avoid hanging fetches that leave pages stuck on loading spinners
  async request(endpoint, options = {}, timeout = 15000) {
    const url = `${this.baseURL}${endpoint}`;
    const userInfoString = localStorage.getItem("userInfo");
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Nếu có token, đính kèm vào header Authorization
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo.token) {
          headers["Authorization"] = `Bearer ${userInfo.token}`;
        }
      } catch (e) {
        console.error("Không thể parse userInfo từ localStorage", e);
      }
    }

    const config = {
      headers,
      ...options,
    };

    // add timeout support via AbortController
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        ...config,
      });

      if (!response.ok) {
        // Try to extract error body safely
        const errorBody = await response.text().catch(() => "");
        let parsedError = {};
        try {
          parsedError = JSON.parse(errorBody || "{}");
        } catch {
          parsedError = { message: errorBody };
        }
        throw new Error(parsedError.message || `HTTP ${response.status}`);
      }

      // Be tolerant: some endpoints (mock servers) may return plain text.
      // Read as text first and attempt JSON.parse; if parsing fails, return the raw text.
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("Request timed out");
      }
      // rethrow other network errors
      throw err;
    } finally {
      clearTimeout(id);
    }
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  // sửa phòng
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  // PUT with FormData (don't set Content-Type, browser will add boundary)
  async putFormData(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem("token");

    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }
}

export default new ApiClient();
