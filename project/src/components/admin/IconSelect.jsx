import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// A <select> can't render arbitrary markup inside <option>, so a plain dropdown
// only ever shows icon names as text — hard for a non-developer to match to the
// actual glyph. This renders the real icon next to each choice instead.
export function IconSelect({ id, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const current = options.find((o) => o.value === value);
  const CurrentIcon = current?.Icon;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        id={id}
        type="button"
        className="form-control"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {CurrentIcon && <CurrentIcon size={16} />}
          {current?.label || "Select an icon…"}
        </span>
        <ChevronDown size={15} style={{ color: "var(--slate-400)" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 20,
            background: "#fff",
            border: "1px solid var(--slate-200)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
            maxHeight: 260,
            overflowY: "auto",
            padding: 4,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "none",
                background: opt.value === value ? "var(--slate-100)" : "transparent",
                color: "var(--slate-800)",
                fontSize: "0.85rem",
                textAlign: "left",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--slate-100)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = opt.value === value ? "var(--slate-100)" : "transparent")
              }
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "#eef2ff",
                  color: "var(--primary-blue)",
                  flexShrink: 0,
                }}
              >
                <opt.Icon size={16} />
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
