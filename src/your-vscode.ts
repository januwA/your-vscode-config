import * as vscode from "vscode";
import * as path from "path";
import { sendGist } from "./util/send-gist";
import { pullUserVscodeConfig } from "./util/pull-user-vscode-config";

export interface IUserConfig {
  githubToken: string;
  gistId: string;
  vscodeBinPath: string;
}

export interface IUserVscodeConfig {
  settings: string;
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

  /**
   * 检查user config
   * @param config
   */
  private _checkUserConfig(config: IUserConfig) {
    const { githubToken, gistId, vscodeBinPath } = config;
    if (!githubToken) {
      throw new Error(`请输入[githubToken]字段`);
    }
    if (!gistId) {
      throw new Error(`请输入[gistId]字段`);
    }
    if (!vscodeBinPath) {
      throw new Error(`请输入[vscodeBinPath]字段`);
    }
  }

  /**
   * 保存user config
   * @param config
   */
  private _saveUserConfig(config: IUserConfig) {
    this._checkUserConfig(config);
    this._globalState.update("githubToken", config.githubToken);
    this._globalState.update("gistId", config.gistId);
    this._globalState.update("vscodeBinPath", config.vscodeBinPath);
  }

  /**
   * 获取用户配置的 user config
   * @param config
   */
  private _getUserConfig(): IUserConfig {
    return {
      githubToken: this._globalState.get("githubToken") || "",
      gistId: this._globalState.get("gistId") || "",
      vscodeBinPath: this._globalState.get("vscodeBinPath") || ""
    };
  }

  private constructor(
    private readonly _panel: vscode.WebviewPanel,
    private readonly _extensionPath: string,
    private readonly _globalState: vscode.Memento
  ) {
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
              this._saveUserConfig(message.config);
              vscode.window.showInformationMessage("Save Success.");
            } catch (error) {
              vscode.window.showErrorMessage(`Save Error: ${error}`);
            }
            return;

          // 保存user config
          // 将user vscode config 保存到gist
          case "push":
            try {
              this._saveUserConfig(message.config);
              vscode.window.showInformationMessage("Push Loading...");
              await sendGist(message.config);
              vscode.window.showInformationMessage("Push Success.");
            } catch (error) {
              vscode.window.showErrorMessage(`Save Error: ${error}`);
            }
            return;

          // 拉取gist配置，同步到本地
          case "pull":
            try {
              await pullUserVscodeConfig(this._getUserConfig());
            } catch (error) {
              vscode.window.showErrorMessage(`Pull Error: ${error}`);
            }
            return;
        }
      },
      null,
      this._disposables
    );

    this._panel.webview.postMessage({
      command: "init",
      config: this._getUserConfig()
    });
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
                    display: grid;
                    place-content: center;
                    min-height: 100vh;
                  }
                  .container {
                    width: 70vw;
                    padding: 1em;
                    display: grid;
                    grid-row-gap: .5em;
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
                  id="vscodeBin"
                  placeholder="Your vscode bin path"
                />

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
              </section>
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
