"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Upload, X, File as FileIcon, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED = [".pdf", ".docx", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp", ".txt"];

function iconFor(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".txt")) return FileText;
  return ImageIcon;
}

export default function FileUpload({ files, onChange, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const next = [...files, ...Array.from(incoming)];
      onChange(next);
    },
    [files, onChange]
  );

  const removeFile = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={clsx(
          "relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-8 py-14 text-center transition-colors cursor-pointer",
          dragging ? "border-teal-400 bg-teal-400/5" : "border-ink-700 hover:border-teal-600/60",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <div className="rounded-full bg-teal-500/10 p-4">
          <Upload className="h-6 w-6 text-teal-400" />
        </div>
        <div>
          <p className="font-display text-sm font-medium text-slate-100">
            Drop clinical documents here, or click to browse
          </p>
          <p className="mt-1 text-xs text-slate-400">
            PDF, DOCX, scanned images, radiology / lab reports, discharge summaries — multiple files supported
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {files.map((f, idx) => {
            const Icon = iconFor(f.name);
            return (
              <li
                key={`${f.name}-${idx}`}
                className="flex items-center justify-between rounded-md border border-ink-700 bg-ink-900/60 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 shrink-0 text-teal-400" />
                  <span className="truncate text-sm text-slate-200">{f.name}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                {!disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="ml-2 rounded p-1 text-slate-500 hover:bg-ink-800 hover:text-slate-200"
                    aria-label={`Remove ${f.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
