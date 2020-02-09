import * as os from 'os';
import * as path from 'path';

export class PlatForm {
	static get isMac() {
		return os.platform() === 'darwin';
	}

	static get isLinux() {
		return os.platform() === 'linux';
	}

	static get isWindows() {
		return os.platform() === 'win32';
	}

	static getSettinsPath() {
		if (this.isWindows) {
			if (process.env.APPDATA) {
				return path.join(process.env.APPDATA, 'Code', 'User', 'settings.json');
			} else {
				throw new Error('没有找到 APPDATA 环境变量');
			}
		}

		if (this.isMac) {
			if (process.env.HOME) {
				return path.join(process.env.HOME, 'Library/Application Support/Code/User/settings.json');
			} else {
				throw new Error('没有找到 HOME 环境变量');
			}
		}

		if (this.isLinux) {
			if (process.env.HOME) {
				return path.join(process.env.HOME, '.config/Code/User/settings.json');
			} else {
				throw new Error('没有找到 HOME 环境变量');
			}
		}

		throw new Error('未知平台!!!');
	}

	static getExtentionsPath() {
		if (this.isWindows) {
			if (process.env.USERPROFILE) {
				return path.join(process.env.USERPROFILE, '.vscode', 'extensions');
			} else {
				throw new Error('没有找到 USERPROFILE 环境变量');
			}
		}

		if (this.isMac || this.isLinux) {
			return '~/.vscode/extensions';
		}

		throw new Error('未知平台!!!');
	}
}
