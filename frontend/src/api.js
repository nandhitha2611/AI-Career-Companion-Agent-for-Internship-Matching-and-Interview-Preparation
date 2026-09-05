import axios from 'axios';

const API_BASE = 'http://localhost:8000'; // Adjust to your FastAPI port

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth
export const loginUser = (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  return axios.post(`${API_BASE}/auth/login`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

export const registerUser = (data) =>
  axios.post(`${API_BASE}/auth/register`, data);

// Resumes
export const uploadResume = (formData) =>
  axios.post(`${API_BASE}/resume/upload`, formData, {
    headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
  });

export const getResumes = () =>
  axios.get(`${API_BASE}/resume/`, { headers: getAuthHeader() });

export const downloadResume = (resumeId) =>
  window.open(`${API_BASE}/resume/${resumeId}/download`, '_blank');

// Internships (Fetched directly from backend)
export const getInternships = () =>
  axios.get(`${API_BASE}/internships/`, { headers: getAuthHeader() });

export const matchInternships = (resumeId) => {
  return axios.post(
    `${API_BASE}/internships/match/${resumeId}`,
    {},
    { headers: getAuthHeader() }
  );
};

export const applyToInternship = (applicationData) =>
  axios.post(`${API_BASE}/applications/`, applicationData, { headers: getAuthHeader() });

export const generateCoverLetterApi = (data) => {
  return axios.post(
    `${API_BASE}/generate-cover-letter`,
    data,
    { headers: getAuthHeader() }
  );
};

// Profile
export const getProfile = () =>
  axios.get(`${API_BASE}/profile/`, { headers: getAuthHeader() });

export const saveProfile = (profileData) =>
  axios.post(`${API_BASE}/profile/`, profileData, { headers: getAuthHeader() });

export const syncProfileFromResume = (resumeId) =>
  axios.post(`${API_BASE}/profile/sync-resume/${resumeId}`, {}, { headers: getAuthHeader() });

export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  return await axios.get(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};