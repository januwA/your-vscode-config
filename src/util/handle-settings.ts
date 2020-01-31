import * as fs from "fs-extra";
import { PlatForm } from "./platform";

/**
 * 获取settings.json文件内容
 */
export async function getSettings() {
  const fp = PlatForm.getSettinsPath();

  if (fs.existsSync(fp)) {
    const settingsFile = await fs.readFile(fp, "utf8");
    return settingsFile;
  } else {
    throw new Error(`settings.json 文件没找到，或则不存在.`);
  }
}

export async function setSettings(value: string) {
  const fp = PlatForm.getSettinsPath();
  if (fs.existsSync(fp)) {
    await fs.outputFile(fp, value);
  }
}
