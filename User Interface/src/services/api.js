import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';
 // Replace with your Django backend URL

export const getResponse = async (userId, query) => {
  const response = await axios.post(`${API_URL}get-response/`, {
    user_id: userId,
    query: query,
  });
  return response.data.response;
};
