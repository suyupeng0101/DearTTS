const { app, BrowserWindow, shell } = require("electron");
const { fork } = require("child_process");
const http = require("http");
const path = require("path");

const isDev = !app.isPackaged;
const nextPort = Number(process.env.DEARTTS_PORT || 31230);
let nextProcess = null;

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    function check() {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Next server did not start within ${timeoutMs}ms.`));
          return;
        }

        setTimeout(check, 300);
      });

      request.setTimeout(1500, () => {
        request.destroy();
      });
    }

    check();
  });
}

async function startNextServer() {
  if (isDev) {
    return process.env.ELECTRON_START_URL || "http://127.0.0.1:3000";
  }

  const appPath = app.getAppPath();
  const resourcesPath = process.resourcesPath;
  const appRoot = path.join(resourcesPath, "app");
  const nextBin = require.resolve("next/dist/bin/next", { paths: [appPath] });
  const url = `http://127.0.0.1:${nextPort}`;

  nextProcess = fork(nextBin, ["start", "--hostname", "127.0.0.1", "--port", String(nextPort)], {
    cwd: appRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(nextPort),
    },
    stdio: "inherit",
  });

  await waitForServer(url);
  return url;
}

async function createWindow() {
  const startUrl = await startNextServer();

  const window = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: "DearTTS",
    backgroundColor: "#f7f8fb",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await window.loadURL(startUrl);
}

app.whenReady().then(() => {
  createWindow().catch((error) => {
    console.error(error);
    app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((error) => {
        console.error(error);
      });
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill();
    nextProcess = null;
  }
});
