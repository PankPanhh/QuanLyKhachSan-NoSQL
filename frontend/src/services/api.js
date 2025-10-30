// src/services/api.js
class ApiClient {
  constructor(baseURL = 'http://localhost:5000/api/v1') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // Be tolerant: some endpoints (mock servers) may return plain text.
    // Read as text first and attempt JSON.parse; if parsing fails, return the raw text.
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }

  async get(endpoint) {
    return this.request(endpoint);
  }
}

export default new ApiClient();