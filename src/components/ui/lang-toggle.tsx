"use client";

import { useLang } from "@/lib/lang-context";

/**
 * Language toggle button — shows EN / NE pill switcher.
 * Drop anywhere in the nav or header.
 */
export function LangToggle({ className = "" }: { className?: string }) {
    const { lang, setLang } = useLang();

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <button
                onClick={() => setLang("en")}
                className={`text-[0.68rem] font-bold uppercase tracking-widest transition-all ${lang === "en"
                    ? "text-[#F5D06B]"
                    : "text-[#F5D06B]/50 hover:text-[#F5D06B]/80"
                    }`}
            >
                EN
            </button>
            <span className="text-[#F5D06B]/30 text-[0.68rem]">/</span>
            <button
                onClick={() => setLang("ne")}
                className={`text-[0.68rem] font-bold uppercase tracking-widest transition-all ${lang === "ne"
                    ? "text-[#F5D06B]"
                    : "text-[#F5D06B]/50 hover:text-[#F5D06B]/80"
                    }`}
            >
                नेपाली
            </button>
        </div>
    );
}
