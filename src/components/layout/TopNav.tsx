"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserCircle2, Coins } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Projeler", href: "/" },
  { label: "Benim Kitaplarım", href: "/benim-kitaplarim" },
  { label: "Akıllı Panel", href: "/akilli-panel" },
  { label: "Kullanıcı İşlemleri", href: "/kullanici-islemleri" },
  { label: "Birim Fiyatlar", href: "/birim-fiyatlar" },
  { label: "Yardım", href: "/yardim" },
  { label: "Satın Al", href: "/satin-al" },
];

export function TopNav({ userName = "Kullanıcı" }: { userName?: string }) {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b-2 border-teal-600 sticky top-0 z-40">
      <div className="flex items-center h-14 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 mr-8 shrink-0">
          <span className="text-2xl">🌀</span>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-teal-700">MALİYET</span>
            <span className="text-gray-800">BULUT</span>
          </span>
        </Link>

        {/* Menü */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "text-teal-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sağ — kullanıcı */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            className="text-gray-400 hover:text-teal-600 transition-colors"
            title="Krediler"
          >
            <Coins size={20} />
          </button>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-sm font-medium">{userName}</span>
            <UserCircle2 size={22} className="text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
