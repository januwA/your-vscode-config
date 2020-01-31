import * as vscode from "vscode";
import * as path from "path";
import * as shell from "shelljs";
import { PlatForm } from "./platform";
import { IUserConfig, IUserVscodeConfig } from "../your-vscode";
import { createHttp } from "./create-http";
import { setSettings } from "./handle-settings";

export const listExtensionsOption = "--list-extensions";
export const installExtensionOption = "--install-extension";

export function codeExec(codePath: string, cmd: string) {
  return new Promise<string>((res, rej) => {
    codePath = path.join(codePath, "code");

    const result = PlatForm.isWindows
      ? `"${codePath}" ${cmd}`
      : `${codePath} ${cmd}`;

    shell.exec(result, (code, stdout, stderr) => {
      // 失败基本就是没找到这个插件
      if (stderr) {
        vscode.window.showErrorMessage(stderr);
      }
      res(stdout.toString());
    });
  });
}

export async function pullUserVscodeConfig(config: IUserConfig) {
  vscode.window.showInformationMessage("开始获取配置文件...");
  const http = createHttp(config.githubToken);
  const { data } = await http.get(`/gists/${config.gistId}`);
  const userVscodeConfig: IUserVscodeConfig = JSON.parse(
    data.files["c.json"].content
  );
  if (userVscodeConfig) {
    vscode.window.showInformationMessage("开始设置[setting.json]");
    await setSettings(userVscodeConfig.settings);

    vscode.window.showInformationMessage("开始安装[extensions]");
    const listExtensions = await codeExec(
      config.vscodeBinPath,
      listExtensionsOption
    );
    console.log(listExtensions);

    const r = await installExtensions(
      config.vscodeBinPath,
      userVscodeConfig.extensions,
      1,
      userVscodeConfig.extensions.length,
      listExtensions
    );
    if (r === true) {
      vscode.window.showInformationMessage("安装[extensions]完成");
    }
  }
}

async function installExtensions(
  vscodeBinPath: string,
  extensions: string[],
  current: number,
  len: number,
  listExtensions: string
): Promise<any> {
  if (!extensions.length) {
    return true;
  }

  const extensionId = extensions[0].trim();
  vscode.window.showInformationMessage(
    `Install[${current}/${len}]: [${extensionId}]`
  );
  if (!listExtensions.indexOf(extensionId)) {
    await codeExec(vscodeBinPath, `${installExtensionOption} ${extensionId}`);
  }
  return installExtensions(
    vscodeBinPath,
    extensions.slice(1),
    current + 1,
    len,
    listExtensions
  );
}
