import { Waves } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="w-12 h-12 border-3 border-konkan-sand-300 border-t-konkan-teal-700 rounded-full animate-spin" />
          <Waves className="w-5 h-5 text-konkan-teal-700 absolute" />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-xs font-bold text-slate-800">Listening to the Konkan Tide...</p>
          <p className="text-[11px] text-slate-400">Loading coastal hotels & details</p>
        </div>
      </div>
    </div>
  );
}
