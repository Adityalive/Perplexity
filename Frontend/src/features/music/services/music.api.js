import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/music",
  withCredentials: true,
});

export async function getRecommendations() {
  const response = await api.get("/recommendations");
  return response.data;
}

export async function searchMusic(query) {
  const response = await api.get("/search", { params: { q: query } });
  return response.data;
}

export async function likeSong(song) {
  const response = await api.post("/like", song);
  return response.data;
}

export async function dislikeSong(song) {
  const response = await api.post("/dislike", song);
  return response.data;
}
