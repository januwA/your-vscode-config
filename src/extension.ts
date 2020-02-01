import * as vscode from "vscode";
import { YourVscode } from "./your-vscode";

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
export function deactivate() { }
