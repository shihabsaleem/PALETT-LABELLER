const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  savePDF: (pdfBuffer) => ipcRenderer.invoke("save-pdf", pdfBuffer),
  printPDF: (pdfData) => ipcRenderer.invoke("print-pdf", pdfData),
});
