"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  UserCircle2, Coins, User, Users, FolderCog, FileSignature, LogOut, ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

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

interface TopNavProps {
  userName?: string;
  isAdmin?: boolean;
}

export function TopNav({ userName = "Kullanıcı", isAdmin = false }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/giris");
    router.refresh();
  }

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
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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

        {/* Sağ — kullanıcı menüsü */}
        <div className="flex items-center gap-4 shrink-0">
          <button className="text-gray-400 hover:text-teal-600 transition-colors" title="Krediler">
            <Coins size={20} />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              <span className="text-sm font-medium max-w-[140px] truncate">{userName}</span>
              <UserCircle2 size={22} className="text-gray-400" />
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 z-50">
                <MenuLink href="/hesabim" icon={<User size={16} />} label="Hesabım" />
                {isAdmin && (
                  <MenuLink href="/kullanici-yonetimi" icon={<Users size={16} />} label="Kullanıcı Yönetimi" />
                )}
                <MenuLink href="/is-dosyasi-yonetimi" icon={<FolderCog size={16} />} label="İş Dosyası Yönetimi" />
                <MenuLink href="/imza-listesi" icon={<FileSignature size={16} />} label="İmza Listesi" />
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span className="text-teal-600">{icon}</span>
      {label}
    </Link>
  );
}
