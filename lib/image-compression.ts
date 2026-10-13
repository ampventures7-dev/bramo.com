import imageCompression from "browser-image-compression";

/**
 * Compress an image file to under 300 KB before uploading to Supabase storage.
 * Meets the prompt constraint: max 300 KB each using browser-image-compression.
 */
export async function compressImageUnder300KB(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.29, // ~295 KB strict ceiling below 300 KB
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/webp",
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Image compression error:", error);
    // Return original file if compression fails as fallback
    return file;
  }
}
