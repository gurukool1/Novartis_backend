const path = require("path");
const fs = require("fs");
const Case = require("../models/caseModel");
const os = require("os");
const { spawn } = require("child_process");

const uploadsDir = path.join(__dirname, "../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to convert document to PDF
const pdfConverter = async (fileUrl) => {
  return new Promise((resolve, reject) => {
    try {
      if (!fileUrl || !fs.existsSync(fileUrl)) {
        console.error("[pdfConverter] Source file not found:", fileUrl);
        return reject(new Error("Source file not found on disk"));
      }

      if (fs.statSync(fileUrl).size === 0) {
        return reject(new Error("Source file is empty"));
      }

      // Create temp output directory for converted PDF
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "lo-convert-"));
      const sofficeExe =
        process.platform === "win32"
          ? "C:\\Program Files\\LibreOffice\\program\\soffice.exe"
          : "/bin/soffice";
      // const sofficeExe = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
      console.log("[pdfConverter] Using soffice path:", sofficeExe);
      if (!fs.existsSync(sofficeExe)) {
        return reject(new Error("LibreOffice not found. Please install LibreOffice."));
      }

      // Use spawn to invoke soffice with headless conversion
      const proc = spawn(sofficeExe, [
        "--headless",
        "--convert-to", "pdf",
        "--outdir", outDir,
        fileUrl,
      ], { windowsHide: true });

      let stderr = "";
      let stdout = "";

      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("error", (err) => {
        console.error("Spawn error:", err);
        reject(new Error(`Error starting soffice process: ${err.message}`));
      });

      proc.on("close", (code) => {
        if (code !== 0) {
          console.error(`soffice exited with code ${code}:\n${stderr}`);
          return reject(new Error(`PDF conversion failed: ${stderr || stdout}`));
        }

        // Find the converted PDF (same base name + .pdf)
        const baseName = path.basename(fileUrl, path.extname(fileUrl));
        const pdfFileName = `${baseName}.pdf`;
        const pdfPath = path.join(outDir, pdfFileName);
        console.log("Temp PDF path:", pdfPath);

        if (!fs.existsSync(pdfPath)) {
          console.error(`Converted PDF not found at: ${pdfPath}`);
          return reject(new Error(`Converted PDF file not found at: ${pdfPath}`));
        }

        // Save to uploads folder with unique name (to avoid conflicts)
        const timestamp = Date.now();
        const savedPdfFileName = `${timestamp}-${pdfFileName}`;
        const savedPdfPath = path.join(uploadsDir, savedPdfFileName);

        try {
          // Copy converted PDF to uploads folder
          fs.copyFileSync(pdfPath, savedPdfPath);
          console.log("PDF saved to uploads:", savedPdfPath);

          // Cleanup temp files immediately
          try {
            fs.unlinkSync(pdfPath);
            fs.rmdirSync(outDir);
          } catch (e) {
            console.warn("Cleanup error:", e.message);
          }

          // Resolve with the saved PDF info
          resolve({
            pdfFileName: savedPdfFileName,
            pdfPath: savedPdfPath,
            relativePath: `/uploads/${savedPdfFileName}`,
          });
        } catch (err) {
          console.error("Error saving PDF:", err);
          reject(new Error(`Error saving converted PDF: ${err.message}`));
        }
      });

    } catch (err) {
      console.error("PDF conversion error:", err);
      reject(new Error(`PDF conversion error: ${err.message}`));
    }
  });
};

module.exports = pdfConverter;