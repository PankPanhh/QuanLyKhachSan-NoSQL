// src/services/api.js
class ApiClient {
  constructor(baseURL = 'http://localhost:5000/api/v1') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const userInfoString = localStorage.getItem('userInfo'); 
    const token = localStorage.getItem('token'); 
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Nếu có token, đính kèm vào header Authorization
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo.token) {
          headers['Authorization'] = `Bearer ${userInfo.token}`;
        }
      } catch (e) {
        console.error("Không thể parse userInfo từ localStorage", e);
      }
    }
    
    const config = {
      headers,
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

  // sửa phòng
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // PUT with FormData (don't set Content-Type, browser will add boundary)
  async putFormData(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'PUT',
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
    } catch (e) {
      return text;
    }
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export default new ApiClient();