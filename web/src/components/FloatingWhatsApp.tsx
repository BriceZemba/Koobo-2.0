import { MessageCircle } from "lucide-react";

// Numéro WhatsApp business (à configurer via VITE_WHATSAPP_NUMBER, format international
// sans "+", ex. 22676887618). En sandbox Twilio, mettez le numéro du sandbox.
const NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "";
const TEXT = encodeURIComponent("Bonjour Koobo, j'ai une question agricole.");

export default function FloatingWhatsApp() {
  const href = NUMBER ? `https://wa.me/${NUMBER}?text=${TEXT}` : `https://wa.me/?text=${TEXT}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discuter sur WhatsApp"
      title="Discuter avec Koobo sur WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-soft transition-transform hover:scale-105"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
    </a>
  );
}
