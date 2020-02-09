import * as vscode from "vscode";

export interface IUserConfig {
  githubToken: string;
  gistId: string;
}

export class Config {
  private static _globalState: vscode.Memento;

  private static _checkUserConfig(config: IUserConfig) {
    const { githubToken, gistId } = config;
    if (!githubToken) {
      throw new Error(`请输入[githubToken]字段`);
    }
    if (!gistId) {
      throw new Error(`请输入[gistId]字段`);
    }
  }

  static init(globalState: vscode.Memento) {
    this._globalState = globalState;
  }

  static get githubToken() {
    return this._globalState.get("githubToken") || "";
  }
  static set githubToken(v: string) {
    this._globalState.update("githubToken", v);
  }

  static get gistId() {
    return this._globalState.get("gistId") || "";
  }
  static set gistId(v: string) {
    this._globalState.update("gistId", v);
  }

  static get config(): IUserConfig {
    const c = {
      githubToken: this.githubToken,
      gistId: this.gistId
    };
    this._checkUserConfig(c);
    return c;
  }

  static save(c: IUserConfig) {
    this._checkUserConfig(c);
    this.githubToken = c.githubToken;
    this.gistId = c.gistId;
  }
}
