# your-vscode-config

vscode插件(未完成)，同步本地的`settings.json`和`extentions`

1. 创建一个gist并获取gist的id，在gist中创建一个`c.json`的文件，配置会被写入进去
2. 创建一个github的token，并给与`repo`和`gist`权限。
3. 使用vscode快捷键`ctrl+P`，并输入`your vscode config`，会出现一个input框，输入`{"githubToken": "<your githubToken>","gistId": "<your gistId>"}`，然后回车。

具体可以看源码。