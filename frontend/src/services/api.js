import axios from "axios";

// One axios instance for the whole app.
// The Vite dev server forwards /api requests to the FastAPI backend
// (see vite.config.js), so we never hardcode http://localhost:8000 here.
const api = axios.create({
  baseURL: "/api",
});

// Attach the JWT token (if logged in) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend answers 401, the token is missing or expired -> log out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
