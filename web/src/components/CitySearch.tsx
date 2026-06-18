import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { searchCities } from "../lib/api";
import type { CitySuggestion } from "../lib/api";

export default function CitySearch({
  value,
  onChange,
  onSelect,
  placeholder = "Rechercher une ville…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (city: string) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(false);

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await searchCities(q);
      setSuggestions(res);
      setOpen(res.length > 0);
      setActive(-1);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(c: CitySuggestion) {
    skipRef.current = true;
    onChange(c.name);
    onSelect?.(c.name);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-leaf-200 bg-white px-3 focus-within:border-leaf-400">
        <MapPin className="h-4 w-4 flex-none text-leaf-600" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, suggestions.length - 1));
            else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            else if (e.key === "Enter" && active >= 0) {
              e.preventDefault();
              pick(suggestions[active]);
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-2.5 text-soil-600 placeholder:text-soil-300 focus:outline-none"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-leaf-400" />}
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-leaf-100 bg-white py-1 shadow-card">
          {suggestions.map((c, i) => (
            <li
              key={`${c.label}-${i}`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c);
              }}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                i === active ? "bg-leaf-50 text-leaf-800" : "text-soil-600 hover:bg-leaf-50"
              }`}
            >
              <MapPin className="h-3.5 w-3.5 flex-none text-leaf-400" /> {c.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
