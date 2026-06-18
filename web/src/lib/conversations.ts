import { supabase, hasSupabase } from "./supabase";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}
export interface ChatMessage {
  role: "user" | "bot";
  content: string;
}

const LS_INDEX = "koobo_convs";
const LS_MSGS = (id: string) => `koobo_conv_${id}`;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

// ----------------------- localStorage backend -----------------------
const local = {
  list(): Conversation[] {
    try {
      return JSON.parse(localStorage.getItem(LS_INDEX) || "[]");
    } catch {
      return [];
    }
  },
  saveIndex(convs: Conversation[]) {
    localStorage.setItem(LS_INDEX, JSON.stringify(convs));
  },
  create(title: string): Conversation {
    const conv: Conversation = { id: uid(), title, created_at: new Date().toISOString() };
    const convs = local.list();
    convs.unshift(conv);
    local.saveIndex(convs);
    localStorage.setItem(LS_MSGS(conv.id), "[]");
    return conv;
  },
  messages(id: string): ChatMessage[] {
    try {
      return JSON.parse(localStorage.getItem(LS_MSGS(id)) || "[]");
    } catch {
      return [];
    }
  },
  addMessage(id: string, m: ChatMessage) {
    const msgs = local.messages(id);
    msgs.push(m);
    localStorage.setItem(LS_MSGS(id), JSON.stringify(msgs));
  },
  rename(id: string, title: string) {
    const convs = local.list().map((c) => (c.id === id ? { ...c, title } : c));
    local.saveIndex(convs);
  },
  remove(id: string) {
    local.saveIndex(local.list().filter((c) => c.id !== id));
    localStorage.removeItem(LS_MSGS(id));
  },
};

// ----------------------- API unifiée -----------------------
export async function listConversations(): Promise<Conversation[]> {
  if (hasSupabase && supabase) {
    const { data } = await supabase.from("conversations").select("*").order("created_at", { ascending: false });
    return data || [];
  }
  return local.list();
}

export async function createConversation(title: string): Promise<Conversation> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from("conversations").insert({ title }).select().single();
    if (!error && data) return data as Conversation;
  }
  return local.create(title);
}

export async function loadMessages(id: string): Promise<ChatMessage[]> {
  if (hasSupabase && supabase) {
    const { data } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    return (data as ChatMessage[]) || [];
  }
  return local.messages(id);
}

export async function saveMessage(id: string, role: "user" | "bot", content: string): Promise<void> {
  if (hasSupabase && supabase) {
    await supabase.from("messages").insert({ conversation_id: id, role, content });
    return;
  }
  local.addMessage(id, { role, content });
}

export async function renameConversation(id: string, title: string): Promise<void> {
  if (hasSupabase && supabase) {
    await supabase.from("conversations").update({ title }).eq("id", id);
    return;
  }
  local.rename(id, title);
}

export async function deleteConversation(id: string): Promise<void> {
  if (hasSupabase && supabase) {
    await supabase.from("messages").delete().eq("conversation_id", id);
    await supabase.from("conversations").delete().eq("id", id);
    return;
  }
  local.remove(id);
}
