import { exec } from "child_process";
import * as vscode from "vscode";
import * as path from "path";
import { PlatForm } from "./platform";
import { IUserConfig, IUserVscodeConfig } from "../your-vscode";
import { createHttp } from "./create-http";
import { setSettings } from "./handle-settings";

export function codeExec(codePath: string, cmd: string) {
  return new Promise<string>((resolve, reject) => {
    codePath = path.join(codePath, PlatForm.isWindows ? "code.cmd" : "code");

    const command = PlatForm.isWindows
      ? `"${codePath}" ${cmd}`
      : `${codePath} ${cmd}`;

    exec(command, (error, stdout, stderr) => {
        resolve()
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
    let extensions = userVscodeConfig.extensions.map((extensionId) => {
      return () => {
        vscode.window.showInformationMessage(
          `Install: ${extensionId}`
        );
        return codeExec(
          config.vscodeBinPath, `--install-extension ${extensionId}`
        );
      };
    });
    vscode.window.showInformationMessage("开始安装[extensions]");
    installExtensions(
      extensions,
    ).then(() => {
      vscode.window.showInformationMessage('安装[extensions]完成');
    });

    vscode.window.showInformationMessage('开始设置[setting.json]');
    setSettings(userVscodeConfig.settings).then(() => {
      vscode.window.showInformationMessage('[setting.json]设置完成');
    });

  }
}

async function installExtensions(
  extensions: (() => Promise<string | void>)[],
): Promise<any> {
  if (!extensions.length) {
    return;
  }
  await extensions[0]();
  return installExtensions(
    extensions.slice(1),
  );
}
