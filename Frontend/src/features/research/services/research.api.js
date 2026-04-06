import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export async function runDeepResearch(topic) {
  const { data } = await API.post("/research/research", { topic });
  return data; // { report, sources, queries }
}
