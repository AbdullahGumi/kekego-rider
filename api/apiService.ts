import apiClient from './apiClient';

const apiService = {
  get: async (endpoint: string, params = {}, headers = {}) => {
    try {
      return await apiClient.get(endpoint, { params, headers });
    } catch (error) {
      throw error;
    }
  },

  post: async (endpoint: string, data: any, headers = {}) => {
    try {
      return await apiClient.post(endpoint, data, { headers });
    } catch (error) {
      throw error;
    }
  },

  put: async (endpoint: string, data: any, headers = {}) => {
    try {
      return await apiClient.put(endpoint, data, { headers });
    } catch (error) {
      throw error;
    }
  },

  delete: async (endpoint: string, headers = {}) => {
    try {
      return await apiClient.delete(endpoint, { headers });
    } catch (error) {
      throw error;
    }
  },
};

export default apiService;
