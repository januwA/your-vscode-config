function getInputValue() {
  const githubTokenInput = document.getElementById("githubToken");
  const gistIdInput = document.getElementById("gistId");
  const vscodeBinInput = document.getElementById("vscodeBin");
  return {
    githubToken: githubTokenInput.value.trim(),
    gistId: gistIdInput.value.trim(),
    vscodeBinPath: vscodeBinInput.trim()
  };
}
function setInputValue({ githubToken, gistId, vscodeBinPath }) {
  const githubTokenInput = document.getElementById("githubToken");
  const gistIdInput = document.getElementById("gistId");
  const vscodeBinInput = document.getElementById("vscodeBin");
  githubTokenInput.value = githubToken;
  gistIdInput.value = gistId;
  vscodeBinInput.value = vscodeBinPath;
}

// 此脚本将在webview本身中运行
// 它不能直接访问主要的VS Code API
(function() {
  const vscode = acquireVsCodeApi();
  document.getElementById("push").addEventListener("click", e => {
    vscode.postMessage({
      command: "push",
      config: getInputValue()
    });
  });
  document.getElementById("pull").addEventListener("click", e => {
    vscode.postMessage({
      command: "pull",
      config: getInputValue()
    });
  });
  document.getElementById("save").addEventListener("click", e => {
    vscode.postMessage({
      command: "save",
      config: getInputValue()
    });
  });

  // 处理从扩展程序发送到Web视图的消息
  window.addEventListener("message", ({ data: message }) => {
    switch (message.command) {
      case "init":
        setInputValue(message.config);
        break;
    }
  });
})();
