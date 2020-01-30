import * as fs from 'fs-extra';
import * as path from 'path';
import { PlatForm } from './platform';

export async function getExtensions() {
	let extensionsDir = PlatForm.getExtentionsPath();
	if (fs.existsSync(extensionsDir)) {
		let extensions = await fs.readdir(extensionsDir);
		extensions = extensions
			.filter((s) => !s.startsWith('.'))
			.filter((s) => fs.lstatSync(path.join(extensionsDir, s)).isDirectory())
			.map((s) => s.replace(/(?:-\d+\.\d+\.\d+)$/g, ''));
		return extensions;
	} else {
		throw new Error(`插件安装目录没有找到.`);
	}
}
