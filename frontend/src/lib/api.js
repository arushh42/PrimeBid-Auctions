import axios from "axios";

// Defaults to same-origin "/api/v1" (Vite dev proxy, the backend serving the
// build, or a host rewrite). Set VITE_API_URL only if the API lives elsewhere.
const baseURL = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

export const getErrorMessage = (error, fallback = "Something went wrong.") => {
  const data = error?.response?.data;
  if (data && typeof data === "object" && data.message) return data.message;
  if (typeof data === "string" && data.length < 200) return data;
  if (error?.code === "ERR_NETWORK") {
    return "Cannot reach the server. Please check your connection.";
  }
  return fallback;
};
