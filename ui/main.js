function $(select) {
  return document.querySelector(select);
}

function getInputValue() {
  return {
    githubToken: $("#githubToken").value.trim(),
    gistId: $("#gistId").value.trim(),
    vscodeBinPath: $("#vscodeBin").value.trim()
  };
}
function setInputValue({ githubToken, gistId, vscodeBinPath }) {
  $("#githubToken").value = githubToken;
  $("#gistId").value = gistId;
  $("#vscodeBin").value = vscodeBinPath;
}

function showExtensions(extentions) {
  const extentionsEl = $("#extentions");
  extentionsEl.style.display = 'block';
  const olEL = extentionsEl.querySelector('ol');
  olEL.innerHTML = '';
  
  extentions.forEach(e => {
    const liEl = document.createElement("li");
    liEl.innerHTML = e;
    olEL.append(liEl);
  })
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
      case "extensions":
        showExtensions(message.extensions);
        break;
    }
  });
})();
