import * as vscode from 'vscode';
import { getSettings } from './util/get-user-settings';
import { getExtensions } from './util/get-extensions';
import { sendGist } from './util/send-gist';

export interface IUserConfig {
	githubToken: string;
	gistId: string;
}
export interface IUserVscodeConfig {
	settings: string;
	extension: string[];
}

const configExample = `{"githubToken": "5dd754af6d614318d0bf3d10025544c14e6582d2","gistId": "084577b827133bbf573b6bb72cffa0a2"}`;

const userVscodeConfig: IUserVscodeConfig = {
	settings: '',
	extension: []
};

// 激活您的扩展程序时将调用此方法
// 您的扩展程序在第一次执行命令时被激活
export async function activate(context: vscode.ExtensionContext) {
	userVscodeConfig.settings = await getSettings();
	userVscodeConfig.extension = await getExtensions();

	let disposable = vscode.commands.registerCommand('cowsay.config', async () => {
		const config = await vscode.window.showInputBox({
			value: configExample,
			prompt: '请以此配置为模板输入您的`githubToken`和`gistId`'
		});
		if (config) {
			try {
				const _userConfig: IUserConfig = JSON.parse(config);
				if (_userConfig.githubToken && _userConfig.gistId) {
					try {
						await sendGist(_userConfig, userVscodeConfig);
						vscode.window.showInformationMessage(`同步成功`);
					} catch (error) {
						vscode.window.showInformationMessage(`同步失败: ${error.message}`);
					}
				}
			} catch (error) {}
		}
	});

	context.subscriptions.push(disposable);
}

// 停用扩展程序时，将调用此方法
export function deactivate() {}
