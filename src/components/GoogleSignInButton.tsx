import { useEffect, useRef } from "react";
import { loginWithGoogle } from "../lib/auth";

interface Props {
  onSuccess: () => void;
  onError: (message: string) => void;
}

// این فایل به window.google.accounts.id متکی است که از اسکریپت زیر می‌آید
// و باید در index.html اضافه شود:
// <script src="https://accounts.google.com/gsi/client" async defer></script>
declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleSignInButton({ onSuccess, onError }: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID تنظیم نشده — دکمه‌ی ورود با گوگل نمایش داده نمی‌شود.");
      return;
    }

    function renderButton() {
      if (!window.google || !divRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            await loginWithGoogle(response.credential);
            onSuccess();
          } catch (e: any) {
            onError(e.message || "ورود با گوگل ناموفق بود.");
          }
        },
      });
      window.google.accounts.id.renderButton(divRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 320,
      });
    }

    if (window.google) {
      renderButton();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          renderButton();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [onSuccess, onError]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center gap-3 w-full">
        <div className="h-px flex-1 bg-black/10" />
        <span className="text-[13px] text-[#64748B]">یا</span>
        <div className="h-px flex-1 bg-black/10" />
      </div>
      <div ref={divRef} />
    </div>
  );
}
