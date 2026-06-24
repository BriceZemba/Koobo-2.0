import { useEffect, useState } from "react";
import {
  Loader2, Droplets, Wind, Thermometer, CloudRain, Waves, Sun, Droplet,
  CheckCircle2, AlertTriangle, Info, Leaf,
} from "lucide-react";
import { getWeather } from "../lib/api";
import type { WeatherData } from "../lib/api";
import CitySearch from "../components/CitySearch";
import { useUi } from "../context/UiLangContext";
import { getProfile } from "../lib/profile";

const ALERT_ICONS: Record<string, any> = { rain: CloudRain, flood: Waves, sun: Sun, droplet: Droplet, check: CheckCircle2 };
const ALERT_STYLE: Record<string, string> = {
  ok: "bg-leaf-50 text-leaf-700 border-leaf-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
};

export default function Meteo() {
  const { t } = useUi();
  const _defaultCity = getProfile().city || "Ouagadougou";
  const [city, setCity] = useState(_defaultCity);
  const [query, setQuery] = useState(_defaultCity);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(c: string) {
    if (!c.trim()) return;
    setLoading(true);
    setError("");
    setQuery(c);
    try {
      setData(await getWeather(c));
    } catch {
      setError(t.meteo.unavailable);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(_defaultCity); /* eslint-disable-next-line */ }, []);

  function dayName(date: string) {
    return new Date(date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  }

  const extreme = data?.alerts.filter((a) => a.level === "warning") || [];

  return (
    <div className="min-h-screen bg-white pt-[4.5rem]">
      <div className="container-koobo max-w-5xl py-8 sm:py-10">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-lime-600">
            <Leaf className="h-4 w-4" /> {t.meteo.tag}
          </span>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t.meteo.title}</h1>
          <p className="mt-2 text-soil-400">{t.meteo.subtitle}</p>
        </div>

        <div className="mb-6 max-w-md">
          <CitySearch value={city} onChange={setCity} onSelect={(c) => load(c)} placeholder={t.meteo.search} />
        </div>

        {/* Bannière d'alerte météo extrême */}
        {extreme.length > 0 && (
          <div className="mb-6 animate-[fade-up_0.4s_ease-out] overflow-hidden rounded-3xl border-2 border-amber-300 bg-amber-50">
            <div className="flex items-center gap-2 bg-amber-400/90 px-5 py-2.5 font-bold text-amber-950">
              <AlertTriangle className="h-5 w-5 animate-pulse" /> {t.meteo.extreme} - {query}
            </div>
            <div className="space-y-2 p-5">
              {extreme.map((a, i) => (
                <p key={i} className="flex items-start gap-2 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" /> {a.text}
                </p>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="flex items-center gap-2 text-soil-400"><Loader2 className="h-5 w-5 animate-spin" /> {t.meteo.loading}</div>}
        {error && <p className="text-red-600">{error}</p>}

        {data && !loading && (
          <div className="space-y-7">
            {/* Conditions actuelles */}
            <div className="overflow-hidden rounded-3xl border border-leaf-100 shadow-card">
              <div className="grid items-center gap-6 bg-gradient-to-br from-leaf-700 to-leaf-800 p-6 text-white sm:grid-cols-2 sm:p-8">
                <div>
                  <p className="text-leaf-100">{data.current.city}</p>
                  <div className="mt-1 flex items-end gap-3">
                    <span className="font-display text-5xl font-extrabold text-white sm:text-6xl">{data.current.temp}°</span>
                    <img src={`https://openweathermap.org/img/wn/${data.current.icon}@2x.png`} alt="" className="h-16 w-16" />
                  </div>
                  <p className="mt-1 text-lg text-leaf-100">{data.current.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
                    <Thermometer className="mx-auto h-6 w-6 text-lime-400" />
                    <div className="mt-1 font-bold">{data.current.temp}°C</div>
                    <div className="text-xs text-leaf-100">{t.meteo.temp}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
                    <Droplets className="mx-auto h-6 w-6 text-lime-400" />
                    <div className="mt-1 font-bold">{data.current.humidity}%</div>
                    <div className="text-xs text-leaf-100">{t.meteo.humidity}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
                    <Wind className="mx-auto h-6 w-6 text-lime-400" />
                    <div className="mt-1 font-bold">{data.current.wind}</div>
                    <div className="text-xs text-leaf-100">km/h</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conseils */}
            <div>
              <h2 className="mb-3 text-xl font-bold">{t.meteo.advice}</h2>
              <div className="space-y-3">
                {data.alerts.map((a, i) => {
                  const AlertIcon = ALERT_ICONS[a.icon] || (a.level === "warning" ? AlertTriangle : Info);
                  return (
                    <div key={i} className={`flex items-start gap-3 rounded-2xl border p-4 ${ALERT_STYLE[a.level] || ALERT_STYLE.info}`}>
                      <AlertIcon className="mt-0.5 h-5 w-5 flex-none" />
                      <p className="text-sm">{a.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prévisions */}
            <div>
              <h2 className="mb-3 text-xl font-bold">{t.meteo.forecast} · {query}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {data.daily.map((d) => (
                  <div key={d.date} className="rounded-2xl border border-leaf-100 bg-white p-4 text-center shadow-card">
                    <div className="text-sm font-semibold capitalize text-leaf-800">{dayName(d.date)}</div>
                    <img src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`} alt="" className="mx-auto h-14 w-14" />
                    <div className="text-sm"><span className="font-bold text-leaf-800">{d.temp_max}°</span> <span className="text-soil-400">{d.temp_min}°</span></div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-xs text-blue-600"><CloudRain className="h-3.5 w-3.5" /> {d.rain} mm</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
