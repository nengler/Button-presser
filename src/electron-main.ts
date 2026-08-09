import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function createWindow(): void {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 640,
    minHeight: 560,
    backgroundColor: "#14201c",
    title: "Button Presser",
    webPreferences: {
      // Game is a static page — no Node in the renderer.
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  void win.loadFile(path.join(root, "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
