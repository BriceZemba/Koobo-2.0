import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import {
  Mic, Square, ArrowUp, Volume2, Loader2, Sprout, Plus, Trash2,
  MessageSquare, PanelLeftClose, PanelLeftOpen, Paperclip, X,
} from "lucide-react";
import { sendChat, transcribe, speak, askAboutImage, ingestDocuments } from "../lib/api";
import { useLang } from "../context/LanguageContext";
import { useUi } from "../context/UiLangContext";
import LanguageSelect from "../components/LanguageSelect";
import { hasSupabase } from "../lib/supabase";
import { getProfile } from "../lib/profile";

function profileNote(): string {
  const p = getProfile();
  const parts: string[] = [];
  if (p.name) parts.push(`nom: ${p.name}`);
  if (p.city) parts.push(`ville: ${p.city}`);
  if (p.crops) parts.push(`cultures: ${p.crops}`);
  return parts.join("; ");
}
import {
  listConversations, createConversation, loadMessages, saveMessage, deleteConversation,
} from "../lib/conversations";
import type { Conversation, ChatMessage } from "../lib/conversations";

export default function Chat() {
  const { lang } = useLang();
  const { t } = useUi();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const started = messages.length > 0 || loading;

  const suggestions = [t.chat.sug1, t.chat.sug2, t.chat.sug3, t.chat.sug4];

  useEffect(() => { listConversations().then(setConversations); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function autoGrow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }

  function newChat() {
    setCurrentId(null);
    setMessages([]);
    setInput("");
    clearImage();
  }

  async function selectConv(id: string) {
    setCurrentId(id);
    setMessages(await loadMessages(id));
    if (window.innerWidth < 768) setSidebarOpen(false);
  }

  async function removeConv(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteConversation(id);
    setConversations((c) => c.filter((x) => x.id !== id));
    if (id === currentId) newChat();
  }

  function clearImage() {
    setImage(null);
    setImagePreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onAttach(file: File | undefined) {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      // Document → ingestion dans la base de connaissances
      setLoading(true);
      try {
        await ingestDocuments([file]);
        await ensureConv(`📄 ${file.name}`);
        pushBot(`📄 **${file.name}** ${t.chat.docAdded} ✅`);
      } catch (e: any) {
        pushBot(`⚠️ ${e.message || "Erreur"}`);
      } finally {
        setLoading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    }
  }

  function pushBot(content: string) {
    setMessages((m) => [...m, { role: "bot", content }]);
    if (currentId) saveMessage(currentId, "bot", content);
  }

  async function ensureConv(title: string): Promise<string> {
    if (currentId) return currentId;
    const conv = await createConversation(title.length > 48 ? title.slice(0, 48) + "…" : title);
    setCurrentId(conv.id);
    setConversations((c) => [conv, ...c]);
    return conv.id;
  }

  async function ask(text: string) {
    const q = text.trim();
    if ((!q && !image) || loading) return;

    const convId = await ensureConv(q || (image ? "Image" : "Discussion"));
    const userText = q || (image ? "📷 (image)" : "");
    setMessages((m) => [...m, { role: "user", content: userText + (image ? "  📷" : "") }]);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    setLoading(true);
    saveMessage(convId, "user", userText);

    try {
      let answer: string;
      if (image) {
        const r = await askAboutImage(image, q || "Décris cette plante et son état.", lang);
        answer = r.result;
        clearImage();
      } else {
        answer = (await sendChat(q, lang, profileNote())).answer;
      }
      setMessages((m) => [...m, { role: "bot", content: answer }]);
      saveMessage(convId, "bot", answer);
    } catch (e: any) {
      const msg = `⚠️ ${e.message || "Une erreur est survenue."}`;
      setMessages((m) => [...m, { role: "bot", content: msg }]);
      saveMessage(convId, "bot", msg);
    } finally {
      setLoading(false);
    }
  }

  async function toggleMic() {
    if (recording) { recorderRef.current?.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setStatus("Micro non supporté."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        setRecording(false);
        setStatus(t.chat.transcribing);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        try {
          const { text } = await transcribe(blob, lang);
          setStatus("");
          if (text) ask(text);
        } catch (e: any) {
          setStatus(e.message || "Échec.");
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setStatus(t.chat.recording);
    } catch {
      setStatus("Autorisez le microphone.");
    }
  }

  const composer = (
    <div className="mx-auto w-full max-w-3xl">
      {imagePreview && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-2xl border border-leaf-200 bg-leaf-50 p-2 pr-3">
          <img src={imagePreview} alt="" className="h-12 w-12 rounded-lg object-cover" />
          <span className="text-sm text-soil-600">{t.chat.imageAttached}</span>
          <button onClick={clearImage} className="text-soil-400 hover:text-red-500"><X className="h-4 w-4" /></button>
        </div>
      )}
      <div className="flex items-end gap-1.5 rounded-[1.75rem] border border-leaf-200 bg-white p-2 shadow-[0_6px_30px_-12px_rgba(46,125,50,0.35)] focus-within:border-leaf-400">
        <button onClick={() => fileRef.current?.click()} className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-leaf-700 hover:bg-leaf-50" title={t.chat.attachDoc} aria-label="Joindre">
          <Paperclip className="h-5 w-5" />
        </button>
        <input ref={fileRef} type="file" accept="image/*,.pdf,.docx,.txt,.md" className="hidden" onChange={(e) => onAttach(e.target.files?.[0])} />
        <button onClick={toggleMic} className={`flex h-10 w-10 flex-none items-center justify-center rounded-full transition-colors ${recording ? "animate-pulse bg-red-500 text-white" : "text-leaf-700 hover:bg-leaf-50"}`} aria-label="Micro" title="Voix">
          {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <textarea
          ref={taRef}
          value={input}
          rows={1}
          onChange={(e) => { setInput(e.target.value); autoGrow(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
          placeholder={t.chat.placeholder}
          className="max-h-40 flex-1 resize-none bg-transparent py-2 text-soil-700 placeholder:text-soil-300 focus:outline-none"
        />
        <button onClick={() => ask(input)} disabled={loading || (!input.trim() && !image)} className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-leaf-700 text-white transition-colors hover:bg-leaf-800 disabled:opacity-30" aria-label="Envoyer">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-soil-300">{status || t.chat.disclaimer}</p>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4.5rem)] bg-white pt-[4.5rem]">
      <aside className={`${sidebarOpen ? "w-72" : "w-0"} hidden shrink-0 overflow-hidden border-r border-leaf-100 bg-leaf-50/40 transition-all duration-300 md:block`}>
        <div className="flex h-full w-72 flex-col">
          <div className="p-3">
            <button onClick={newChat} className="btn-primary w-full justify-start gap-2 py-2.5">
              <Plus className="h-5 w-5" /> {t.chat.newChat}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-soil-300">{t.chat.history}</p>
            {conversations.length === 0 && <p className="px-2 py-3 text-sm text-soil-300">{t.chat.noConv}</p>}
            {conversations.map((c) => (
              <button key={c.id} onClick={() => selectConv(c.id)} className={`group mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${c.id === currentId ? "bg-leaf-100 text-leaf-800" : "text-soil-600 hover:bg-leaf-100/60"}`}>
                <MessageSquare className="h-4 w-4 flex-none text-leaf-500" />
                <span className="flex-1 truncate">{c.title}</span>
                <span onClick={(e) => removeConv(c.id, e)} className="opacity-0 transition-opacity group-hover:opacity-100" title="Supprimer">
                  <Trash2 className="h-4 w-4 text-soil-400 hover:text-red-500" />
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-leaf-100 px-4 py-3 text-xs text-soil-300">
            {hasSupabase ? t.chat.savedCloud : t.chat.savedLocal}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-leaf-50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen((o) => !o)} className="hidden rounded-lg p-1.5 text-soil-400 hover:bg-leaf-50 hover:text-leaf-700 md:block" title={t.chat.history}>
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>
            <button onClick={newChat} className="rounded-lg p-1.5 text-soil-400 hover:bg-leaf-50 hover:text-leaf-700 md:hidden" title={t.chat.newChat}>
              <Plus className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-leaf-800">
              <Sprout className="h-4 w-4 text-leaf-600" /> {t.chat.title}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-soil-300 sm:inline">{t.chat.convLang} :</span>
            <LanguageSelect compact />
          </div>
        </div>

        {!started ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5">
            <div className="w-full max-w-3xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-100">
                <Sprout className="h-7 w-7 text-leaf-700" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-bold text-leaf-900 sm:text-3xl">{t.chat.greeting}</h1>
              <p className="mt-2 text-soil-400">{t.chat.greetingSub}</p>
              <div className="mt-8">{composer}</div>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => ask(s)} className="rounded-full border border-leaf-200 bg-white px-4 py-2 text-sm text-soil-600 transition-colors hover:border-leaf-400 hover:bg-leaf-50">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl px-4 py-8 sm:px-5">
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="mb-7 flex justify-end">
                      <div className="max-w-[85%] rounded-3xl rounded-br-md bg-leaf-50 px-4 py-2.5 text-soil-700">{m.content}</div>
                    </div>
                  ) : (
                    <div key={i} className="mb-7 flex gap-3">
                      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-leaf-100">
                        <Sprout className="h-4 w-4 text-leaf-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="prose-koobo text-[15px] leading-relaxed text-soil-700" dangerouslySetInnerHTML={{ __html: marked.parse(m.content) as string }} />
                        <button onClick={() => speak(m.content, lang)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-soil-400 transition-colors hover:text-leaf-700">
                          <Volume2 className="h-3.5 w-3.5" /> {t.chat.listen}
                        </button>
                      </div>
                    </div>
                  )
                )}
                {loading && (
                  <div className="mb-7 flex gap-3">
                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-leaf-100"><Sprout className="h-4 w-4 text-leaf-700" /></div>
                    <div className="flex items-center gap-1.5 pt-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-leaf-300 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-leaf-300 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-leaf-300" />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>
            <div className="border-t border-leaf-50 px-4 py-4 sm:px-5">{composer}</div>
          </>
        )}
      </div>
    </div>
  );
}
