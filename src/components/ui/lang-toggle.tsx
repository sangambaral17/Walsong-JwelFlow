"use client";

import { useLang } from "@/lib/lang-context";

/**
 * Language toggle button — shows EN / NE pill switcher.
 * Drop anywhere in the nav or header.
 */
export function LangToggle({ className = "" }: { className?: string }) {
    const { lang, setLang } = useLang();

    return (
        <div className={`flex items-center rounded-full border border-border/50 bg-muted/40 p-0.5 gap-0.5 ${className}`}>
            <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${lang === "en"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                EN
            </button>
            <button
                onClick={() => setLang("ne")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${lang === "ne"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                नेपाली
            </button>
        </div>
    );
}
