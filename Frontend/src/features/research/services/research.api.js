import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

export async function runDeepResearch(topic) {
  const { data } = await API.post("/research/research", { topic });
  return data; // { report, sources, queries }
}
