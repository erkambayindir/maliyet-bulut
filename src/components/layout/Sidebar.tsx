"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderTree,
  TableProperties,
  Ruler,
  Layers,
  FileText,
  ChevronDown,
  ChevronRight,
  Wrench,
  FlaskConical,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  projectId: string;
  projectName: string;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

export function Sidebar({ projectId, projectName }: SidebarProps) {
  const pathname = usePathname();
  const base = `/projeler/${projectId}`;

  const [ymOpen, setYmOpen] = useState(true);

  const navItems: NavItem[] = [
    {
      label: "Projenin Bilgileri",
      href: `${base}/projenin-bilgileri`,
      icon: <LayoutDashboard size={16} />,
    },
    {
      label: "İş Grupları",
      href: `${base}/is-gruplari`,
      icon: <FolderTree size={16} />,
    },
    {
      label: "Yaklaşık Maliyet",
      icon: <TableProperties size={16} />,
      children: [
        {
          label: "YM Cetveli",
          href: `${base}/ym-cetveli`,
          icon: <TableProperties size={14} />,
        },
        {
          label: "İmalat Metrajı",
          href: `${base}/imalat-metraji`,
          icon: <Ruler size={14} />,
        },
        {
          label: "Demir Metrajı",
          href: `${base}/demir-metraji`,
          icon: <Layers size={14} />,
        },
      ],
    },
    {
      label: "İş Kalemleri",
      href: `${base}/is-kalemleri`,
      icon: <Wrench size={16} />,
    },
    {
      label: "Analizler",
      href: `${base}/analizler`,
      icon: <FlaskConical size={16} />,
    },
    {
      label: "Belgeler",
      href: `${base}/belgeler`,
      icon: <FileText size={16} />,
    },
  ];

  return (
    <aside className="w-60 shrink-0 bg-[#0f2a2e] text-white flex flex-col h-screen sticky top-0">
      {/* Logo / Proje Adı */}
      <div className="px-4 py-5 border-b border-white/10">
        <Link href="/" className="text-xs text-teal-400 hover:text-teal-300 uppercase tracking-widest font-semibold">
          MaliyetBulut
        </Link>
        <p className="mt-1 text-sm font-medium text-white truncate" title={projectName}>
          {projectName}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          if (item.children) {
            const isGroupActive = item.children.some((c) => c.href && pathname.startsWith(c.href));
            return (
              <div key={item.label}>
                <button
                  onClick={() => setYmOpen((v) => !v)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    isGroupActive
                      ? "bg-teal-700/50 text-teal-200"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                  {ymOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {ymOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                    {item.children.map((child) => (
                      <NavLink key={child.label} item={child} pathname={pathname} />
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return <NavLink key={item.label} item={item} pathname={pathname} />;
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <Link
          href="/"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Proje Listesi
        </Link>
      </div>
    </aside>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  if (!item.href) return null;
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
        isActive
          ? "bg-teal-600 text-white font-medium"
          : "text-gray-300 hover:bg-white/10 hover:text-white"
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}
