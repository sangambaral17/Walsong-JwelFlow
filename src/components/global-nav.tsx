"use client";

/**
 * GlobalNav — Premium two-tier navigation bar.
 *
 * Tier 1 (Brand Bar): Gold emblem · Shop name · Tagline / address · Lang + Lock
 * Tier 2 (Module Bar): All 10 module links spread evenly — no scroll, no overflow
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShop } from "@/lib/shop-context";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { LangToggle } from "@/components/ui/lang-toggle";
import {
    HandCoins, Package, Users, BarChart3, Settings,
    Hammer, Coins, ShieldCheck, Lock, Home, CreditCard,
} from "lucide-react";

const NAV_ITEMS = [
    { href: "/", icon: Home, label: "Dashboard", labelNe: "ड्यासबोर्ड" },
    { href: "/pos", icon: CreditCard, label: "POS / Billing", labelNe: "बिक्री" },
    { href: "/inventory", icon: Package, label: "Inventory", labelNe: "स्टक" },
    { href: "/dhito", icon: HandCoins, label: "Dhito (Pawn)", labelNe: "धितो" },
    { href: "/customers", icon: Users, label: "Customers", labelNe: "ग्राहक" },
    { href: "/karigar", icon: Hammer, label: "Karigar", labelNe: "कारिगर" },
    { href: "/chit", icon: Coins, label: "Gold Chit", labelNe: "चिट" },
    { href: "/reports", icon: BarChart3, label: "Reports", labelNe: "रिपोर्ट" },
    { href: "/audit", icon: ShieldCheck, label: "Audit", labelNe: "अडिट" },
    { href: "/settings", icon: Settings, label: "Settings", labelNe: "सेटिङ" },
];

export function GlobalNav() {
    const pathname = usePathname();
    const { profile } = useShop();
    const { lockSession } = useAuth();
    const { lang } = useLang();

    const shopName = profile.shop_name || "Walsong Jewellers";
    // Extract city from address (e.g. "Kathmandu, Nepal" → "Kathmandu")
    const city = profile.address
        ? profile.address.split(",")[0].trim()
        : "Nepal";

    return (
        <header className="sticky top-0 z-50 w-full print:hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── Tier 1: Brand Bar ───────────────────────────────────────── */}
            <div
                className="w-full border-b"
                style={{
                    background: "linear-gradient(135deg, #1a1208 0%, #2d1f07 40%, #3a2a0a 100%)",
                    borderColor: "rgba(212,175,55,0.25)",
                }}
            >
                <div className="container mx-auto px-6 flex items-center justify-between h-16">

                    {/* Left: Gold emblem + shop identity */}
                    <Link href="/" className="flex items-center gap-4 group">
                        {/* Medallion */}
                        <div
                            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg shrink-0 transition-transform group-hover:scale-105"
                            style={{
                                background: "linear-gradient(135deg, #D4AF37, #B8962E, #F5D06B, #B8962E)",
                                boxShadow: "0 0 18px rgba(212,175,55,0.45), inset 0 1px 1px rgba(255,255,255,0.3)",
                            }}
                        >
                            <span
                                className="font-black text-xl leading-none tracking-tighter"
                                style={{ color: "#1a1208" }}
                            >W</span>
                        </div>

                        {/* Name + tagline */}
                        <div className="leading-none">
                            <p
                                className="font-bold tracking-wide leading-none"
                                style={{
                                    fontSize: "1.05rem",
                                    color: "#F5D06B",
                                    letterSpacing: "0.08em",
                                    fontFamily: "'Outfit', 'Inter', sans-serif",
                                }}
                            >
                                {shopName}
                            </p>
                            <p
                                className="mt-0.5"
                                style={{ fontSize: "0.65rem", color: "rgba(212,175,55,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}
                            >
                                ✦ {city} · Est. 2024 ✦
                            </p>
                        </div>
                    </Link>

                    {/* Center: Decorative rule */}
                    <div className="hidden lg:flex flex-1 items-center justify-center px-8">
                        <div
                            className="w-full h-px"
                            style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent)" }}
                        />
                    </div>

                    {/* Right: Lang + Lock */}
                    <div className="flex items-center gap-3 shrink-0">
                        <LangToggle />
                        <div className="w-px h-5" style={{ background: "rgba(212,175,55,0.2)" }} />
                        <button
                            onClick={lockSession}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                            style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: "rgba(212,175,55,0.7)",
                                border: "1px solid rgba(212,175,55,0.15)",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.color = "#FF6B6B";
                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,107,0.3)";
                                (e.currentTarget as HTMLElement).style.background = "rgba(255,107,107,0.06)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.color = "rgba(212,175,55,0.7)";
                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.15)";
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                            }}
                        >
                            <Lock className="w-3 h-3" />
                            <span className="hidden sm:inline">{lang === "ne" ? "बन्द" : "Lock"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tier 2: Module Nav Bar ───────────────────────────────────── */}
            <div
                className="w-full border-b"
                style={{
                    background: "linear-gradient(180deg, rgba(253,251,247,0.97) 0%, rgba(253,251,247,1) 100%)",
                    borderColor: "rgba(184,150,46,0.18)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 2px 12px rgba(184,150,46,0.08)",
                }}
            >
                {/* Gold accent line at very top */}
                <div className="h-px w-full" style={{ background: "linear-gradient(to right, transparent 0%, #D4AF37 20%, #F5D06B 50%, #D4AF37 80%, transparent 100%)" }} />

                <nav className="flex items-stretch w-full">
                    {NAV_ITEMS.map(({ href, icon: Icon, label, labelNe }) => {
                        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                        const displayLabel = lang === "ne" ? labelNe : label;

                        return (
                            <Link
                                key={href}
                                href={href}
                                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative transition-all group"
                                style={{
                                    minWidth: 0,
                                    color: isActive ? "#B8962E" : "#6B6B5A",
                                    background: isActive ? "rgba(184,150,46,0.07)" : "transparent",
                                    borderBottom: isActive ? "2px solid #B8962E" : "2px solid transparent",
                                }}
                            >
                                {/* Hover effect layer */}
                                <span
                                    className="absolute inset-0 transition-opacity opacity-0 group-hover:opacity-100"
                                    style={{ background: "rgba(184,150,46,0.05)" }}
                                />

                                <Icon
                                    className="relative z-10 transition-transform group-hover:scale-110"
                                    style={{
                                        width: "1rem",
                                        height: "1rem",
                                        color: isActive ? "#B8962E" : "#8B8B7A",
                                    }}
                                />
                                <span
                                    className="relative z-10 leading-none text-center truncate w-full px-1"
                                    style={{
                                        fontSize: "0.6rem",
                                        fontWeight: isActive ? 700 : 500,
                                        letterSpacing: "0.05em",
                                        textTransform: "uppercase",
                                        color: isActive ? "#B8962E" : "#8B8B7A",
                                    }}
                                >
                                    {displayLabel}
                                </span>

                                {/* Active indicator dot */}
                                {isActive && (
                                    <span
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                        style={{ background: "#B8962E" }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
