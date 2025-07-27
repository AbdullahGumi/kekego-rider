import apiService from "../client/apiService";

export const chatApi = {
  sendMessage: async (rideId: string, data: { content: string }) => {
    return await apiService.post(`/chat/ride/${rideId}/message`, data);
  },

  getMessages: async (rideId: string) => {
    return await apiService.get(`/chat/ride/${rideId}/messages`);
  },
};