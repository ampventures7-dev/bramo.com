/**
 * Client-Side Screenshot OCR Auto-Reader (Zero API Cost)
 * Runs 100% in the user's browser using on-demand Tesseract.js from CDN
 * Extracts 12-digit Indian UPI UTR / RRN numbers with zero external API fees.
 */

declare global {
  interface Window {
    Tesseract?: any;
  }
}

// Lazy loader for client-side Tesseract.js script
function loadTesseractScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("OCR only runs in browser environment"));
      return;
    }

    if (window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }

    const existingScript = document.getElementById("tesseract-ocr-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Tesseract));
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.id = "tesseract-ocr-script";
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => {
      if (window.Tesseract) {
        resolve(window.Tesseract);
      } else {
        reject(new Error("Tesseract loaded without global export"));
      }
    };
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

export interface OcrResult {
  success: boolean;
  utr?: string;
  rawText?: string;
  confidence?: number;
  error?: string;
}

/**
 * Scans an image File or Blob and attempts to extract a 12-digit Indian UPI UTR / RRN
 */
export async function extractUtrFromScreenshot(
  imageFile: File | Blob,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  try {
    const Tesseract = await loadTesseractScript();

    // Create worker with minimal English dictionary
    const worker = await Tesseract.createWorker("eng", 1, {
      logger: (m: any) => {
        if (m.status === "recognizing text" && typeof m.progress === "number" && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const ret = await worker.recognize(imageFile);
    await worker.terminate();

    const text = ret.data.text || "";

    // 1. Regex pattern matching UPI UTR / Reference labels followed by 12 digits
    // e.g. "UPI Ref No: 419827361829", "UTR 419827361829", "UPI transaction ID: 419827361829"
    const labelMatch = text.match(/(?:UTR|UPI\s*(?:Ref|Reference|Transaction)?\s*(?:No|Number|ID)?[:\s\-#]*)([0-9]{12})\b/i);
    if (labelMatch && labelMatch[1]) {
      return {
        success: true,
        utr: labelMatch[1],
        rawText: text,
        confidence: ret.data.confidence,
      };
    }

    // 2. Standalone 12 numeric digits regex (common on GPay and PhonePe receipts)
    const standaloneMatches = text.match(/\b([0-9]{12})\b/g);
    if (standaloneMatches && standaloneMatches.length > 0) {
      // Pick first non-dummy sequence
      const validUtr = standaloneMatches.find(
        (m: string) => !/^(\d)\1{11}$/.test(m) && m !== "123456789012"
      );
      if (validUtr) {
        return {
          success: true,
          utr: validUtr,
          rawText: text,
          confidence: ret.data.confidence,
        };
      }
    }

    return {
      success: false,
      rawText: text,
      confidence: ret.data.confidence,
      error: "Could not automatically isolate a 12-digit UTR. Please verify manually.",
    };
  } catch (err: any) {
    console.warn("Client OCR extraction fallback:", err);
    return {
      success: false,
      error: err.message || "Failed to scan screenshot.",
    };
  }
}
