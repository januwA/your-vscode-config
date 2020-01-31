import axios from "axios";
import { IUserConfig, IUserVscodeConfig } from "../your-vscode";
import { getSettings } from "./get-user-settings";
import { getExtensions } from "./get-extensions";
import { createHttp } from "./create-http";

export async function sendGist(userConfig: IUserConfig) {
  const http = createHttp(userConfig.githubToken);
  const userVscodeConfig: IUserVscodeConfig = {
    settings: await getSettings(),
    extension: await getExtensions()
  };
  return http({
    url: "/gists/" + userConfig.gistId,
    method: "PATCH",
    data: {
      files: {
        "c.json": {
          content: JSON.stringify(userVscodeConfig)
        }
      }
    }
  });
}
