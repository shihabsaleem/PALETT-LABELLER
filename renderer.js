const { jsPDF } = require("jspdf");
require("jspdf-autotable");
const QRCode = require("qrcode");
const { ipcRenderer } = require("electron");

// Elements mapping
const fields = [
  "shipFromCompany", "shipFromAddress",
  "shipToCompany", "shipToAddress",
  "productName", "netWeight", "grossWeight",
  "reelsCount", "piecesCount", "palletCode", "date"
];

function getFormattedDate() {
  const dVal = document.getElementById("date").value.trim();
  if (!dVal) return "";
  const parts = dVal.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dVal;
}

// Set today's date by default
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
document.getElementById('date').value = `${yyyy}-${mm}-${dd}`;

// Update live preview when input changes
async function updatePreview() {
  const formData = {};
  fields.forEach(field => {
    const inputEl = document.getElementById(field);
    const previewEl = document.getElementById(`p-${field}`);
    if (inputEl && previewEl) {
      const val = field === "date" ? getFormattedDate() : inputEl.value;
      previewEl.textContent = val;
      formData[field] = val;
    }
  });

  // Generate the QR code payload
  const qrString = `PRODUCT NAME :${formData.productName}\nNET WEIGHT:${formData.netWeight}\nGROSS WEIGHT:${formData.grossWeight}\nNO OF REELS:${formData.reelsCount}\nNO OF PIECES:${formData.piecesCount}\nPALLET CODE:${formData.palletCode}\nDATE:${formData.date}`;
  try {
    const qrDataURL = await QRCode.toDataURL(qrString, { width: 400, margin: 4, errorCorrectionLevel: 'H' });
    const imgEl = document.getElementById("p-qrcode");
    if (imgEl) imgEl.src = qrDataURL;
  } catch (err) {
    console.error(err);
  }
}

// Add event listeners to all inputs
fields.forEach(field => {
  const inputEl = document.getElementById(field);
  if (inputEl) {
    inputEl.addEventListener("input", updatePreview);
  }
});

document.getElementById("btnReset").addEventListener("click", () => {
  const inputs = document.querySelectorAll("input");
  inputs.forEach(input => input.value = "");
  updatePreview();
});

document.getElementById("btnDownload").addEventListener("click", downloadPDF);
document.getElementById("btnPrint").addEventListener("click", printPDF);

async function generatePDFDoc() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = pageW - margin * 2;
    const colW = contentW / 2;
    
    let yPos = margin;
    
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");
    
    // Top Border for first row
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    
    // Cell 1: SHIP FROM
    doc.rect(margin, yPos, colW, 40, "S");
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("SHIP FROM", margin + 4, yPos + 7);
    
    doc.setFontSize(12);
    const shipFromCompany = document.getElementById("shipFromCompany").value.toUpperCase() || " ";
    const shipFromAddress = document.getElementById("shipFromAddress").value.toUpperCase() || " ";
    const sfCompLines = doc.splitTextToSize(shipFromCompany, colW - 8);
    doc.text(sfCompLines, margin + 4, yPos + 14);
    const sfAddrLines = doc.splitTextToSize(shipFromAddress, colW - 8);
    doc.text(sfAddrLines, margin + 4, yPos + 26);
    
    // Cell 2: SHIP TO
    doc.rect(margin + colW, yPos, colW, 40, "S");
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("SHIP TO", margin + colW + 4, yPos + 7);
    
    doc.setFontSize(12);
    const shipToCompany = document.getElementById("shipToCompany").value.toUpperCase() || " ";
    const shipToAddress = document.getElementById("shipToAddress").value.toUpperCase() || " ";
    const stCompLines = doc.splitTextToSize(shipToCompany, colW - 8);
    doc.text(stCompLines, margin + colW + 4, yPos + 14);
    const stAddrLines = doc.splitTextToSize(shipToAddress, colW - 8);
    doc.text(stAddrLines, margin + colW + 4, yPos + 26);
    
    yPos += 40;
    
    // Product Name Row
    doc.rect(margin, yPos, contentW, 20, "S");
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    const productName = document.getElementById("productName").value.toUpperCase() || " ";
    const pNameLines = doc.splitTextToSize(`PRODUCT NAME: ${productName}`, contentW - 8);
    doc.text(pNameLines, margin + 4, yPos + 8);
    
    yPos += 20;
    
    // Details table
    const col4W = contentW / 4;
    const rowH = 12;
    
    // Row 1
    doc.rect(margin, yPos, col4W, rowH, "S");
    doc.text("NET WEIGHT", margin + col4W/2, yPos + 8, { align: "center" });
    
    doc.rect(margin + col4W, yPos, col4W, rowH, "S");
    doc.text(document.getElementById("netWeight").value || " ", margin + col4W + col4W/2, yPos + 8, { align: "center" });
    
    doc.rect(margin + col4W*2, yPos, col4W, rowH, "S");
    doc.text("GROSS WEIGHT", margin + col4W*2 + col4W/2, yPos + 8, { align: "center" });
    
    doc.rect(margin + col4W*3, yPos, col4W, rowH, "S");
    doc.text(document.getElementById("grossWeight").value || " ", margin + col4W*3 + col4W/2, yPos + 8, { align: "center" });
    
    yPos += rowH;
    
    // Row 2
    doc.rect(margin, yPos, col4W, rowH, "S");
    doc.text("NO OF REELS", margin + col4W/2, yPos + 8, { align: "center" });
    
    doc.rect(margin + col4W, yPos, col4W, rowH, "S");
    doc.text(document.getElementById("reelsCount").value || " ", margin + col4W + col4W/2, yPos + 8, { align: "center" });
    
    doc.rect(margin + col4W*2, yPos, col4W, rowH, "S");
    doc.text("NO OF PIECES", margin + col4W*2 + col4W/2, yPos + 8, { align: "center" });
    
    doc.rect(margin + col4W*3, yPos, col4W, rowH, "S");
    doc.text(document.getElementById("piecesCount").value || " ", margin + col4W*3 + col4W/2, yPos + 8, { align: "center" });
    
    yPos += rowH;
    
    // Row 3
    doc.rect(margin, yPos, col4W, rowH, "S");
    doc.text("PALLET CODE", margin + col4W/2, yPos + 8, { align: "center" });
    
    doc.rect(margin + col4W, yPos, col4W, rowH, "S");
    doc.text(document.getElementById("palletCode").value || " ", margin + col4W + col4W/2, yPos + 8, { align: "center" });
    
    doc.rect(margin + col4W*2, yPos, col4W, rowH, "S");
    doc.text("DATE", margin + col4W*2 + col4W/2, yPos + 8, { align: "center" });
    
    doc.rect(margin + col4W*3, yPos, col4W, rowH, "S");
    doc.text(getFormattedDate() || " ", margin + col4W*3 + col4W/2, yPos + 8, { align: "center" });
    
    yPos += rowH;

    // Generate and Add QR Code to the second half
    const pName = document.getElementById("productName").value.trim().toUpperCase();
    const nWt = document.getElementById("netWeight").value.trim();
    const gWt = document.getElementById("grossWeight").value.trim();
    const reels = document.getElementById("reelsCount").value.trim();
    const pieces = document.getElementById("piecesCount").value.trim();
    const pallet = document.getElementById("palletCode").value.trim();
    const dStr = getFormattedDate();

    const qrString = `PRODUCT NAME :${pName}\nNET WEIGHT:${nWt}\nGROSS WEIGHT:${gWt}\nNO OF REELS:${reels}\nNO OF PIECES:${pieces}\nPALLET CODE:${pallet}\nDATE:${dStr}`;
    
    // Increased errorCorrectionLevel to 'H' (High) for better scan reliability and set margin to 4 (standard quiet zone)
    const qrDataURL = await QRCode.toDataURL(qrString, { width: 800, margin: 4, errorCorrectionLevel: 'H' });
    
    // We can pass data URL directly to jsPDF
    const pageH = doc.internal.pageSize.getHeight();
    const qrSize = 100;
    const qrX = (pageW - qrSize) / 2;
    const qrY = yPos + ((pageH - yPos) / 2) - (qrSize / 2);
    
    doc.addImage(qrDataURL, "PNG", qrX, qrY, qrSize, qrSize);
    return doc;
}

async function downloadPDF() {
  const btn = document.getElementById("btnDownload");
  if (btn.disabled) return;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Saving...";
  
  try {
    const doc = await generatePDFDoc();
    // Output and save
    const pdfArrayBuffer = doc.output("arraybuffer");
    const toAddress = document.getElementById("shipToCompany").value || document.getElementById("shipToAddress").value || "Label";
    const result = await ipcRenderer.invoke("save-pdf", {
      pdfBuffer: Array.from(new Uint8Array(pdfArrayBuffer)),
      filename: toAddress
    });
    if (result.success) {
      alert(`PDF saved successfully to:\n${result.path}`);
    }
  } catch (err) {
    alert("Error generating PDF: " + err.message);
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function printPDF() {
  const btn = document.getElementById("btnPrint");
  if (btn.disabled) return;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Printing...";
  
  try {
    const doc = await generatePDFDoc();
    const pdfArrayBuffer = doc.output("arraybuffer");
    const result = await ipcRenderer.invoke("print-pdf", Array.from(new Uint8Array(pdfArrayBuffer)));
    if (!result.success) {
      alert("Error printing PDF: " + (result.error || "Unknown error"));
    } else {
      alert("Print job sent successfully!");
    }
  } catch (err) {
    alert("Error printing PDF: " + err.message);
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Initial update
window.addEventListener("DOMContentLoaded", updatePreview);

