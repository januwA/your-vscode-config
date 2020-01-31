import * as vscode from "vscode";
import { YourVscode } from "./your-vscode";

const configExample = `{"githubToken": "a83aaf199b033cc486fe3d869ad4ce6e686792a8","gistId": "084577b827133bbf573b6bb72cffa0a2"}`;

// 激活您的扩展程序时将调用此方法
// 您的扩展程序在第一次执行命令时被激活
export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("cowsay.config", async () => {
      YourVscode.createOrShow(context.extensionPath, context.globalState);
    })
  );
}

// 停用扩展程序时，将调用此方法
export function deactivate() {}
