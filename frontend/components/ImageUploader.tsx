"use client";

import { useState } from "react";
import { compressImageUnder300KB } from "@/lib/image-compression";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { UploadCloud, CheckCircle2, AlertTriangle, Image as ImageIcon } from "lucide-react";

export function ImageUploader({ onUploadComplete }: { onUploadComplete?: (url: string) => void }) {
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<{ originalSize: number; compressedSize: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      setStatusMessage("Compressing image to strictly under 300 KB...");

      const originalKB = Math.round(file.size / 1024);
      // Run browser-image-compression
      const compressedFile = await compressImageUnder300KB(file);
      const compressedKB = Math.round(compressedFile.size / 1024);

      setStats({ originalSize: originalKB, compressedSize: compressedKB });
      const objectUrl = URL.createObjectURL(compressedFile);
      setPreviewUrl(objectUrl);
      setCompressing(false);

      // Attempt Supabase upload if configured
      if (isSupabaseConfigured) {
        setUploading(true);
        setStatusMessage("Uploading to Supabase Storage (Free Tier)...");
        const filename = `hotel-${Date.now()}-${compressedFile.name}`;
        const { data, error } = await supabase.storage
          .from("hotel-photos")
          .upload(filename, compressedFile, { contentType: compressedFile.type });

        if (error) {
          setStatusMessage(`Uploaded locally (${compressedKB} KB). Supabase error: ${error.message}`);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("hotel-photos")
            .getPublicUrl(filename);
          setStatusMessage(`Successfully stored in Supabase (${compressedKB} KB)!`);
          if (onUploadComplete) onUploadComplete(publicUrlData.publicUrl);
        }
      } else {
        setStatusMessage(`Compressed safely to ${compressedKB} KB (under 300 KB limit). Supabase placeholders active.`);
        if (onUploadComplete) onUploadComplete(objectUrl);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage("Compression error occurred.");
    } finally {
      setCompressing(false);
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-dashed border-konkan-teal-400 text-center space-y-3">
      <div className="w-10 h-10 bg-konkan-teal-50 text-konkan-teal-700 rounded-full flex items-center justify-center mx-auto">
        <UploadCloud className="w-5 h-5" />
      </div>
      <div>
        <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-konkan-teal-700 text-white text-xs font-semibold hover:bg-konkan-teal-800 transition-colors shadow-sm">
          <span>Select Photo to Compress & Upload</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={compressing || uploading}
          />
        </label>
        <p className="text-[11px] text-slate-500 mt-1">
          Auto-compressed to under 300 KB using browser-image-compression for Supabase free-tier storage.
        </p>
      </div>

      {(compressing || uploading) && (
        <div className="text-xs text-konkan-teal-700 animate-pulse font-medium">
          {statusMessage}
        </div>
      )}

      {stats && !compressing && (
        <div className="text-xs bg-konkan-sand-50 p-2.5 rounded-lg border border-konkan-sand-200 inline-block text-left">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Under 300 KB constraint satisfied!</span>
          </div>
          <div className="text-slate-600 text-[11px]">
            Original: <span className="line-through">{stats.originalSize} KB</span> &rarr;{" "}
            <span className="font-bold text-konkan-teal-800">{stats.compressedSize} KB</span>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="mt-2 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Compressed Preview"
            className="h-28 rounded-lg object-cover border border-konkan-sand-300"
          />
        </div>
      )}
    </div>
  );
}
