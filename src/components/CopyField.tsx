"use client";

import { useState } from "react";

export default function CopyField({ value, copy, copied }: { value: string; copy: string; copied: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex gap-2">
      <input readOnly value={value} className="input min-w-0 flex-1 text-sm" onFocus={(e) => e.target.select()} />
      <button
        type="button"
        className="btn-ghost shrink-0"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          } catch {
            /* clipboard blocked: the input is selectable */
          }
        }}
      >
        {done ? copied : copy}
      </button>
    </div>
  );
}
