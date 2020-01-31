import axios from "axios";

export function createHttp(token: string) {
  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `token ${token}`,
      Accept: `application/vnd.github.v3+json`,
      "Content-Type": `application/json`
    }
  });
}
