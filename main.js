const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "qricon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.handle("save-pdf", async (event, data) => {
  const isObj = !Array.isArray(data) && data.pdfBuffer;
  const pdfBuffer = isObj ? data.pdfBuffer : data;
  let filename = "A4_Sheet.pdf";
  
  if (isObj && data.filename) {
    // Sanitize the filename to prevent illegal characters in paths
    filename = data.filename.replace(/[\/\?<>\\:\*\|":]/g, '').substring(0, 100).trim() + ".pdf";
  }

  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Save PDF",
    defaultPath: filename,
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  });

  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
    return { success: true, path: filePath };
  }
  return { success: false };
});

ipcMain.handle("print-pdf", async (event, pdfBuffer) => {
  const os = require("os");
  const tempPath = path.join(os.tmpdir(), `print_${Date.now()}.pdf`);
  
  // Save buffer to a temp file
  fs.writeFileSync(tempPath, Buffer.from(pdfBuffer));

  try {
    const ptp = require("pdf-to-printer");
    await ptp.print(tempPath);
    // Cleanup after a few seconds to ensure the print spooler grabbed it
    setTimeout(() => { try { fs.unlinkSync(tempPath); } catch (e) {} }, 5000);
    return { success: true };
  } catch (err) {
    console.error("Print Error:", err);
    try { fs.unlinkSync(tempPath); } catch (e) {}
    return { success: false, error: err.message };
  }
});
