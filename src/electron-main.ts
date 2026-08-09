import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function createWindow(): void {
  const win = new BrowserWindow({
    // Default 3× the internal 320×180 resolution.
    width: 960,
    height: 540,
    minWidth: 320,
    minHeight: 180,
    backgroundColor: "#0a100e",
    title: "Button Presser",
    useContentSize: true,
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
