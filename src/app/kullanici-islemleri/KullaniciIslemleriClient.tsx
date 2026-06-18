"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";

interface Log {
  id: string;
  projectName: string;
  workGroupName: string | null;
  pozNo: string | null;
  action: string;
  userName: string;
  createdAt: string;
}

export function KullaniciIslemleriClient() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = query ? `?q=${encodeURIComponent(query)}` : "";
    const res = await fetch(`/api/activity${params}`);
    setLogs(await res.json());
    setLoading(false);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function formatZaman(iso: string) {
    const d = new Date(iso);
    return `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Kullanıcı İşlemleri</h1>

      {/* Arama */}
      <div className="relative max-w-xs mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ara..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Tablo */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b-2 border-teal-600 text-left">
                <th className="px-4 py-3 font-semibold text-gray-700">İş Dosyası</th>
                <th className="px-4 py-3 font-semibold text-gray-700">İş Grubu / Mahal</th>
                <th className="px-4 py-3 font-semibold text-gray-700">İş Kalemi</th>
                <th className="px-4 py-3 font-semibold text-gray-700">İşlem</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Kullanıcı Adı</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">Zaman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Yükleniyor...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Kayıt bulunamadı.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-800">{log.projectName}</td>
                    <td className="px-4 py-2.5 text-gray-600">{log.workGroupName ?? ""}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{log.pozNo ?? ""}</td>
                    <td className="px-4 py-2.5 text-gray-700">{log.action}</td>
                    <td className="px-4 py-2.5 text-gray-600">{log.userName}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-right whitespace-nowrap">{formatZaman(log.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-gray-400 mt-3 text-right">Toplam {logs.length} öğe</p>
      )}
    </div>
  );
}
