import axios from "axios";
import { Config } from "./config";

export function createHttp() {
  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `token ${Config.githubToken}`,
      Accept: `application/vnd.github.v3+json`,
      "Content-Type": `application/json`
    }
  });
}
