import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs-extra";
import * as shell from "shelljs";
import * as JSON5 from "json5";
import { exec, execSync } from "child_process";
import { Config, IUserConfig } from "./config";
import { createHttp } from "./create-http";
import { PlatForm } from "./platform";

export const GIST_FILENAME = "c.json5";
export const CODEPATH = String(shell.which("code"));

export interface IUserVscodeConfig {
  settings: Object;
  extensions: string[];
}

export interface IMessage {
  command: string;
  config: IUserConfig;
}

export class YourVscode {
  /**
   * 跟踪当前面板。 一次只允许一个面板存在。
   */
  static currentPanel: YourVscode | undefined;

  static readonly viewType = "YourVscodeConfigPage";

  private _disposables: vscode.Disposable[] = [];

  static createOrShow(extensionPath: string, globalState: vscode.Memento) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (YourVscode.currentPanel) {
      YourVscode.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      YourVscode.viewType,
      "YourVscodeConfigPage",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(extensionPath, "ui"))]
      }
    );

    YourVscode.currentPanel = new YourVscode(panel, extensionPath, globalState);
  }

  static revive(
    panel: vscode.WebviewPanel,
    extensionPath: string,
    globalState: vscode.Memento
  ) {
    YourVscode.currentPanel = new YourVscode(panel, extensionPath, globalState);
  }

  private async _push() {
    const userVscodeConfig: IUserVscodeConfig = {
      settings: await this._getSettings(),
      extensions: await this._getExtensions()
    };
    const content = JSON5.stringify(userVscodeConfig, null, "  ");
    return createHttp()({
      url: "/gists/" + Config.gistId,
      method: "PATCH",
      data: {
        files: {
          [GIST_FILENAME]: { content }
        }
      }
    });
  }

  /**
   * 安装插件
   * @param extension
   */
  private _installExtension(extension: string): Promise<void> {
    return new Promise(resolve => {
      if (!extension.trim()) {
        resolve();
        return;
      }
      setTimeout(() => {
        const command = `${
          PlatForm.isWindows ? `"${CODEPATH}"` : CODEPATH
        } --install-extension ${extension}`;
        vscode.window.showInformationMessage(`Install ${extension}`);
        exec(command, (error, stdout, stderr) => {
          if (stdout) console.log(stdout);
          if (stderr) console.log(stderr);
          resolve();
        });
      }, 1000);
    });
  }

  /**
   * 获取本地插件列表
   */
  private _getExtensions(): Promise<string[]> {
    return new Promise(resolve => {
      const command = PlatForm.isWindows
        ? `"${CODEPATH}" --list-extensions`
        : `${CODEPATH} --list-extensions`;
      exec(command, (error, stdout, stderr) => {
        let s: string[] = [];
        if (stdout) {
          s = stdout
            .split(/\n/)
            .map(e => e.trim())
            .filter(e => !!e);
        } else {
          s = [];
        }
        resolve(s);
      });
    });
  }

  /**
   * 获取本地setting.json
   */
  private async _getSettings(): Promise<Object> {
    const fp = PlatForm.getSettinsPath();
    if (fs.existsSync(fp)) {
      return JSON5.parse(await fs.readFile(fp, "utf8"));
    } else {
      throw new Error(`settings.json 文件没找到，或则不存在.`);
    }
  }

  /**
   * 设置本地setting.json
   */
  private async _setSettings(jsonString: string) {
    if (typeof jsonString === "string") {
      const fp = PlatForm.getSettinsPath();
      if (fs.existsSync(fp)) {
        await fs.outputFile(fp, jsonString);
      }
    }
  }

  private async _pull() {
    vscode.window.showInformationMessage("Get Gist Config Success");
    const { data } = await createHttp().get(`/gists/${Config.gistId}`);
    const content = data.files[GIST_FILENAME].content;
    const userVscodeConfig: IUserVscodeConfig = JSON5.parse(content);
    if (userVscodeConfig) {
      const { extensions, settings } = userVscodeConfig;

      Promise.all(extensions.map(this._installExtension)).then(() => {
        vscode.window.showInformationMessage("插件安装完成");
      });

      vscode.window.showInformationMessage("开始设置[setting.json]");
      this._setSettings(JSON.stringify(settings, null, "  ")).then(() => {
        vscode.window.showInformationMessage("[setting.json]设置完成");
      });
    }
  }

  constructor(
    private readonly _panel: vscode.WebviewPanel,
    private readonly _extensionPath: string,
    private readonly _globalState: vscode.Memento
  ) {
    Config.init(_globalState);

    // 设置网络视图的初始html内容
    this._update();

    // 聆听面板放置的时间
    // 当用户关闭面板或以编程方式关闭面板时，会发生这种情况
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // 根据视图更改更新内容
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // 处理来自Web视图的消息
    this._panel.webview.onDidReceiveMessage(
      async (message: IMessage) => {
        switch (message.command) {
          // 保存user config
          case "save":
            try {
              Config.save(message.config);
              vscode.window.showInformationMessage("Save Success.");
            } catch (error) {
              vscode.window.showErrorMessage(`Save Error: ${error}`);
            }
            return;

          // 保存user config
          // 将user vscode config 保存到gist
          case "push":
            try {
              Config.save(message.config);
              vscode.window.showInformationMessage("Push Loading...");
              await this._push();
              vscode.window.showInformationMessage("Push Success.");
            } catch (error) {
              vscode.window.showErrorMessage(`Save Error: ${error}`);
            }
            return;

          // 拉取gist配置，同步到本地
          case "pull":
            try {
              await this._pull();
            } catch (error) {
              vscode.window.showErrorMessage(`Pull Error: ${error}`);
            }
            return;
        }
      },
      null,
      this._disposables
    );
  }

  dispose() {
    YourVscode.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;

    // Vary the webview's content based on where it is located in the editor.

    switch (this._panel.viewColumn) {
      case vscode.ViewColumn.Two:
        this._updateForCat(webview);
        return;

      case vscode.ViewColumn.Three:
        this._updateForCat(webview);
        return;

      case vscode.ViewColumn.One:
      default:
        this._updateForCat(webview);
        return;
    }
  }

  private _updateForCat(webview: vscode.Webview) {
    this._panel.webview.html = this._getHtmlForWebview(webview);
    this._panel.webview.postMessage({
      command: "init",
      config: Config.config
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // 主脚本的本地路径在webview中运行
    const scriptPathOnDisk = vscode.Uri.file(
      path.join(this._extensionPath, "ui", "main.js")
    );

    // 还有我们用来在Webview中加载此脚本的uri
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    // 使用随机数将可以运行的脚本列入白名单
    const nonce = getNonce();

    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' vscode-resource:;">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body {
                    padding: 0;
                    margin: 0;
                    min-height: 100vh;
                  }
                  .container {
                    width: 70vw;
                    padding: 1em;
                    display: grid;
										grid-row-gap: .5em;
										margin: 1rem auto;
                  }
                  .input-item {
                    padding: 0.6em;
                  }
                  .btns {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    grid-column-gap: .5em;
                  }
              </style>
            </head>
            <body>
              <section class="container">

                <input
                  class="input-item"
                  type="text"
                  id="githubToken"
                  placeholder="Your githubToken"
                />
          
                <input
                  class="input-item"
                  type="text"
                  id="gistId"
                  placeholder="Your gistId"
                />

                <div class="btns">
                  <button id="push">push</button>
                  <button id="pull">pull</button>
                  <button id="save">save</button>
								</div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
