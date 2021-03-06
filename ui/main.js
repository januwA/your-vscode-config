function $(select) {
  return document.querySelector(select);
}

function getInputValue() {
  return {
    githubToken: $("#githubToken").value.trim(),
    gistId: $("#gistId").value.trim()
  };
}
function setInputValue({ githubToken, gistId }) {
  $("#githubToken").value = githubToken;
  $("#gistId").value = gistId;
}

// 此脚本将在webview本身中运行
// 它不能直接访问主要的VS Code API
(function() {
  const vscode = acquireVsCodeApi();
  $("#push").addEventListener("click", e => {
    vscode.postMessage({
      command: "push",
      config: getInputValue()
    });
  });
  $("#pull").addEventListener("click", e => {
    vscode.postMessage({
      command: "pull",
      config: getInputValue()
    });
  });
  $("#save").addEventListener("click", e => {
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
