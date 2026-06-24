import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import {
  UploadCloud, Loader2, Stethoscope, Bug, ShieldCheck, FlaskConical, Send, X, Leaf,
  Camera, Video, ImageIcon, CircleStop, Play, WifiOff,
} from "lucide-react";
import { detectDisease, askAboutImage } from "../lib/api";
import type { DiseaseResult } from "../lib/api";
import { isModelAvailable, predictOffline } from "../lib/offline";
import type { OfflineResult } from "../lib/offline";
import { useLang } from "../context/LanguageContext";
import { useUi } from "../context/UiLangContext";
import LanguageSelect from "../components/LanguageSelect";

type Mode = "upload" | "camera" | "video" | "offline";

export default function Detection() {
  const { lang } = useLang();
  const { t } = useUi();
  const [mode, setMode] = useState<Mode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [error, setError] = useState("");
  const [followQ, setFollowQ] = useState("");
  const [followA, setFollowA] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Caméra / vidéo
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [live, setLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>("");
  const liveTimer = useRef<number | null>(null);
  const busy = useRef(false);

  // ---- détection hors-ligne (TF.js) ----
  const [offAvailable, setOffAvailable] = useState<boolean | null>(null);
  const [offPreview, setOffPreview] = useState("");
  const [offResult, setOffResult] = useState<OfflineResult | null>(null);
  const [offLoading, setOffLoading] = useState(false);
  const offInputRef = useRef<HTMLInputElement>(null);
  const offImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (mode === "offline" && offAvailable === null) isModelAvailable().then(setOffAvailable);
  }, [mode, offAvailable]);

  function chooseOffline(f: File | undefined) {
    if (!f || !f.type.startsWith("image/")) return;
    setOffPreview(URL.createObjectURL(f));
    setOffResult(null);
  }
  async function runOffline() {
    if (!offImgRef.current) return;
    setOffLoading(true);
    try {
      setOffResult(await predictOffline(offImgRef.current));
    } catch (e: any) {
      setError(e.message || "Erreur");
    } finally {
      setOffLoading(false);
    }
  }

  // ---- gestion du flux caméra ----
  async function startCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamOn(true);
      setError("");
    } catch {
      setError("Impossible d'accéder à la caméra. Autorisez l'accès dans le navigateur.");
    }
  }
  function stopCam() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
    stopLive();
  }
  useEffect(() => {
    // (re)démarrage selon l'onglet
    if (mode === "camera" || mode === "video") {
      if (!camOn) startCam();
    } else {
      stopCam();
    }
    return () => stopCam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function grabFrame(): Promise<File | null> {
    return new Promise((resolve) => {
      const v = videoRef.current;
      if (!v || !v.videoWidth) return resolve(null);
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      canvas.getContext("2d")!.drawImage(v, 0, 0);
      canvas.toBlob((b) => resolve(b ? new File([b], "capture.jpg", { type: "image/jpeg" }) : null), "image/jpeg", 0.9);
    });
  }

  // ---- import fichier ----
  function choose(f: File | undefined) {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
    setFollowA("");
  }

  // ---- analyse d'une image (upload + photo caméra) ----
  async function analyzeFile(f: File) {
    setLoading(true);
    setError("");
    try {
      setResult(await detectDisease(f, lang));
    } catch (e: any) {
      setError(e.message || "Échec de l'analyse.");
    } finally {
      setLoading(false);
    }
  }

  async function capturePhoto() {
    const f = await grabFrame();
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    analyzeFile(f);
  }

  // ---- analyse vidéo en continu (capture périodique) ----
  function startLive() {
    if (!camOn) return;
    setLive(true);
    setLiveStatus("Analyse en cours…");
    const tick = async () => {
      if (busy.current) return;
      busy.current = true;
      const f = await grabFrame();
      if (f) {
        try {
          const r = await detectDisease(f, lang);
          setResult(r);
          setLiveStatus("Dernière analyse : " + new Date().toLocaleTimeString("fr-FR"));
        } catch (e: any) {
          // En cas d'erreur (quota saturé, etc.) on arrête la boucle pour ne pas
          // consommer le quota inutilement.
          setLiveStatus("⚠️ " + (e.message || "analyse interrompue"));
          stopLive();
        }
      }
      busy.current = false;
    };
    tick();
    // 20 s entre deux analyses : la vision en continu consomme vite le quota gratuit.
    liveTimer.current = window.setInterval(tick, 20000);
  }
  function stopLive() {
    setLive(false);
    if (liveTimer.current) {
      clearInterval(liveTimer.current);
      liveTimer.current = null;
    }
  }

  async function askFollow() {
    if (!file || !followQ.trim()) return;
    setFollowLoading(true);
    try {
      const { result: r } = await askAboutImage(file, followQ, lang);
      setFollowA(r);
    } catch (e: any) {
      setFollowA(`⚠️ ${e.message}`);
    } finally {
      setFollowLoading(false);
    }
  }

  const cards = result
    ? [
        { icon: Stethoscope, title: t.detection.cName, body: result.nom_maladie, accent: "bg-leaf-100 text-leaf-700" },
        { icon: Bug, title: t.detection.cCause, body: result.cause_maladie, accent: "bg-amber-100 text-amber-700" },
        { icon: FlaskConical, title: t.detection.cSymp, body: result.symptome_maladie, accent: "bg-orange-100 text-orange-700" },
        { icon: ShieldCheck, title: t.detection.cTreat, body: result.traitement_maladie, accent: "bg-lime-500/15 text-leaf-700" },
      ]
    : [];

  const tabs: { id: Mode; label: string; icon: any }[] = [
    { id: "upload", label: t.detection.tabUpload, icon: ImageIcon },
    { id: "camera", label: t.detection.tabCamera, icon: Camera },
    { id: "video", label: t.detection.tabVideo, icon: Video },
    { id: "offline", label: t.detection.tabOffline, icon: WifiOff },
  ];

  return (
    <div className="min-h-screen bg-white pt-[4.5rem]">
      <div className="container-koobo max-w-5xl py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-lime-600">
              <Leaf className="h-4 w-4" /> {t.detection.tag}
            </span>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t.detection.title}</h1>
            <p className="mt-2 text-soil-400">{t.detection.subtitle}</p>
          </div>
          <LanguageSelect />
        </div>

        {/* Onglets */}
        <div className="mb-7 inline-flex rounded-full border border-leaf-100 bg-leaf-50/60 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setMode(t.id); setResult(null); setError(""); }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === t.id ? "bg-leaf-700 text-white shadow-soft" : "text-soil-500 hover:text-leaf-700"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="grid gap-7 lg:grid-cols-2">
          {/* Colonne gauche : source */}
          <div>
            {mode === "upload" && (
              <>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); choose(e.dataTransfer.files?.[0]); }}
                  onClick={() => inputRef.current?.click()}
                  className="group flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-leaf-200 bg-leaf-50/40 p-6 text-center transition-colors hover:border-leaf-400 hover:bg-leaf-50"
                >
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="aperçu" className="max-h-72 rounded-2xl object-contain shadow-card" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(""); setResult(null); }}
                        className="absolute -right-3 -top-3 rounded-full bg-white p-1.5 shadow-card"
                      >
                        <X className="h-4 w-4 text-soil-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf-100 transition-transform group-hover:scale-105">
                        <UploadCloud className="h-8 w-8 text-leaf-600" />
                      </div>
                      <p className="mt-4 font-semibold text-leaf-800">{t.detection.drop}</p>
                      <p className="text-sm text-soil-400">{t.detection.dropSub}</p>
                    </>
                  )}
                  <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />
                </div>
                <button onClick={() => file && analyzeFile(file)} disabled={!file || loading} className="btn-primary mt-5 w-full disabled:opacity-40">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Stethoscope className="h-5 w-5" />}
                  {loading ? t.detection.analyzing : t.detection.diagnose}
                </button>
              </>
            )}

            {(mode === "camera" || mode === "video") && (
              <>
                <div className="relative overflow-hidden rounded-3xl border border-leaf-100 bg-black">
                  <video ref={videoRef} playsInline muted className="h-[340px] w-full object-cover" />
                  {!camOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-leaf-900/80 text-center text-white">
                      <Camera className="h-10 w-10 text-lime-400" />
                      <p className="mt-3 px-6 text-sm">{error || t.detection.activate + "…"}</p>
                      <button onClick={startCam} className="btn-primary mt-4 bg-lime-500 text-leaf-900 hover:bg-lime-400">
                        {t.detection.activate}
                      </button>
                    </div>
                  )}
                  {mode === "video" && live && (
                    <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> {t.detection.live}
                    </div>
                  )}
                  {mode === "video" && result && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                      <div className="text-xs text-lime-300">{t.detection.live}</div>
                      <div className="font-semibold">{result.nom_maladie}</div>
                    </div>
                  )}
                </div>

                {mode === "camera" ? (
                  <button onClick={capturePhoto} disabled={!camOn || loading} className="btn-primary mt-5 w-full disabled:opacity-40">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                    {loading ? t.detection.analyzing : t.detection.capture}
                  </button>
                ) : (
                  <div className="mt-5 flex items-center gap-3">
                    {!live ? (
                      <button onClick={startLive} disabled={!camOn} className="btn-primary flex-1 disabled:opacity-40">
                        <Play className="h-5 w-5" /> {t.detection.startLive}
                      </button>
                    ) : (
                      <button onClick={stopLive} className="btn-outline flex-1">
                        <CircleStop className="h-5 w-5" /> {t.detection.stop}
                      </button>
                    )}
                  </div>
                )}
                {mode === "video" && (
                  <p className="mt-2 text-center text-xs text-soil-400">{liveStatus || t.detection.liveInfo}</p>
                )}
              </>
            )}

            {mode === "offline" && (
              <>
                {offAvailable === false ? (
                  <div className="flex min-h-[340px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center text-amber-800">
                    <WifiOff className="h-10 w-10" />
                    <p className="mt-3 text-sm">{t.detection.offlineMissing}</p>
                  </div>
                ) : (
                  <>
                    <div
                      onClick={() => offInputRef.current?.click()}
                      className="group flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-leaf-200 bg-leaf-50/40 p-6 text-center transition-colors hover:border-leaf-400 hover:bg-leaf-50"
                    >
                      {offPreview ? (
                        <img ref={offImgRef} src={offPreview} crossOrigin="anonymous" alt="" className="max-h-64 rounded-2xl object-contain shadow-card" />
                      ) : (
                        <>
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf-100"><WifiOff className="h-8 w-8 text-leaf-600" /></div>
                          <p className="mt-4 font-semibold text-leaf-800">{t.detection.drop}</p>
                          <p className="text-sm text-soil-400">{t.detection.offlineInfo}</p>
                        </>
                      )}
                      <input ref={offInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => chooseOffline(e.target.files?.[0])} />
                    </div>
                    <button onClick={runOffline} disabled={!offPreview || offLoading} className="btn-primary mt-5 w-full disabled:opacity-40">
                      {offLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <WifiOff className="h-5 w-5" />}
                      {offLoading ? t.detection.offlineLoading : t.detection.offlineRun}
                    </button>
                    <p className="mt-2 text-center text-xs text-soil-400">{t.detection.offlineInfo}</p>
                  </>
                )}
              </>
            )}
            {error && (mode === "upload" || mode === "offline") && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
          </div>

          {/* Colonne droite : résultats */}
          <div className="space-y-4">
            {mode === "offline" && (
              offResult ? (
                <div className="rounded-2xl border border-leaf-100 bg-white p-6 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-100 text-leaf-700"><Stethoscope className="h-5 w-5" /></span>
                    <h3 className="font-bold text-leaf-800">{t.detection.cName}</h3>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-leaf-900">{offResult.label}</p>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-soil-500"><span>{t.detection.confidence}</span><span>{Math.round(offResult.confidence * 100)}%</span></div>
                    <div className="h-2 w-full rounded-full bg-leaf-100"><div className="h-2 rounded-full bg-leaf-600" style={{ width: `${Math.round(offResult.confidence * 100)}%` }} /></div>
                  </div>
                  <p className="mt-4 text-xs text-soil-400">{t.detection.offlineInfo}</p>
                </div>
              ) : (
                <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-3xl border border-leaf-100 bg-leaf-50/30 p-8 text-center text-soil-400">
                  <WifiOff className="h-12 w-12 text-leaf-200" />
                  <p className="mt-3">{t.detection.here}</p>
                </div>
              )
            )}
            {mode !== "offline" && !result && !loading && (
              <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-3xl border border-leaf-100 bg-leaf-50/30 p-8 text-center text-soil-400">
                <Stethoscope className="h-12 w-12 text-leaf-200" />
                <p className="mt-3">{t.detection.here}</p>
              </div>
            )}
            {loading && !result && (
              <div className="flex h-full min-h-[340px] flex-col items-center justify-center rounded-3xl border border-leaf-100 bg-leaf-50/30 p-8 text-center text-soil-400">
                <Loader2 className="h-10 w-10 animate-spin text-leaf-400" />
                <p className="mt-3">{t.detection.analyzing}</p>
              </div>
            )}
            {cards.map((c) => (
              <div key={c.title} className="rounded-2xl border border-leaf-100 bg-white p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.accent}`}>
                    <c.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-leaf-800">{c.title}</h3>
                </div>
                <div className="prose-koobo mt-3 text-sm text-soil-600" dangerouslySetInnerHTML={{ __html: marked.parse(c.body || "-") as string }} />
              </div>
            ))}
          </div>
        </div>

        {/* Suivi (sauf en mode vidéo continu) */}
        {result && file && mode !== "video" && (
          <div className="mt-7 rounded-3xl border border-leaf-100 bg-leaf-50/40 p-6">
            <h3 className="font-bold text-leaf-800">{t.detection.followTitle}</h3>
            <p className="text-sm text-soil-400">{t.detection.followSub}</p>
            <div className="mt-4 flex gap-2">
              <input
                value={followQ}
                onChange={(e) => setFollowQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askFollow()}
                placeholder={t.detection.followPh}
                className="flex-1 rounded-full border border-leaf-200 bg-white px-4 py-2.5 text-soil-600 focus:border-leaf-400 focus:outline-none"
              />
              <button onClick={askFollow} disabled={followLoading} className="btn-primary px-5 disabled:opacity-40">
                {followLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
            {followA && (
              <div className="prose-koobo mt-4 rounded-2xl bg-white p-4 text-sm text-soil-600 shadow-card" dangerouslySetInnerHTML={{ __html: marked.parse(followA) as string }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
