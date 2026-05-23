const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("dearttsDesktop", {
  platform: process.platform,
});
