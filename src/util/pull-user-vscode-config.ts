import * as path from "path";
import * as shell from "shelljs";
import { PlatForm } from "./platform";
import { IUserConfig } from "../your-vscode";
import { createHttp } from "./create-http";

function codeExec(codePath: string, cmd: string) {
  codePath = path.join(codePath, "code");

  const result = PlatForm.isWindows
    ? `"${codePath}" ${cmd}`
    : `${codePath} ${cmd}`;

  return result;
}

export async function pullUserVscodeConfig(config: IUserConfig) {
  const http = createHttp(config.githubToken);
  const { data } = await http.get(`/gist/${config.gistId}`);
  console.log(data);

  return new Promise((res, rej) => {
    shell.exec(
      codeExec(config.vscodeBinPath, "--version"),
      (code, stdout, stderr) => {
        if (stderr) {
          rej(stderr);
        }
        res(stdout.toString());
      }
    );
  });
}
