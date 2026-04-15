import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/music` : "http://localhost:3000/api/music",
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const token = await window.Clerk?.session?.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function connectYTMusic(cookie) {
  const res = await api.post("/connect", { cookie });
  return res.data;
}

export async function syncLibrary() {
  const res = await api.post("/sync");
  return res.data;
}

export async function generatePlaylists() {
  const res = await api.post("/playlists/generate");
  return res.data;
}

export async function getCachedPlaylists() {
  const res = await api.get("/playlists");
  return res.data;
}

export async function getLibrary() {
  const res = await api.get("/library");
  return res.data;
}

export async function savePreferences({ genres, artists }) {
  const res = await api.post("/onboard", { genres, artists });
  return res.data;
}

export async function getStatus() {
  const res = await api.get("/status");
  return res.data;
}

export async function searchMusic(query) {
  const res = await api.get("/search", { params: { q: query } });
  return res.data;
}

export async function likeSong(song) {
  const res = await api.post("/like", song);
  return res.data;
}

export async function dislikeSong(song) {
  const res = await api.post("/dislike", song);
  return res.data;
}
