"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronRight, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PozLibraryItem } from "@/types";

const YEARS = ["2026-Haziran", "2026-Mayıs", "2026-Ocak", "2025-Temmuz"];
const PAGE_SIZE = 50;

// Kurum ağacı — veri olanlar tıklanabilir (hasData), diğerleri görsel
const INSTITUTIONS = [
  { name: "Çevre ve Şehircilik Bakanlığı", short: "ÇŞB", fascicles: ["İnşaat", "Mekanik Tesisat", "Elektrik"], hasData: true, defaultYear: "2026-Haziran" },
  { name: "Devlet Su İşleri Genel Müdürlüğü", short: "DSİ", fascicles: ["İnşaat"], hasData: true, defaultYear: "2026-Ocak" },
  { name: "Karayolları Genel Müdürlüğü", short: "KGM", fascicles: ["Yapım"], hasData: true, defaultYear: "2026-Ocak" },
  { name: "İller Bankası", short: "İller Bankası", fascicles: ["Altyapı"], hasData: true, defaultYear: "2026-Haziran" },
  { name: "Altyapı Yatırımları (DLH)", short: "DLH", fascicles: [], hasData: false },
  { name: "Kültür Bakanlığı", short: "Kültür", fascicles: [], hasData: false },
  { name: "Milli Savunma Bakanlığı", short: "MSB", fascicles: [], hasData: false },
  { name: "Orman ve Su İşleri Bakanlığı", short: "Orman", fascicles: [], hasData: false },
  { name: "PTT", short: "PTT", fascicles: [], hasData: false },
  { name: "TEDAŞ [Elektrik Proje Tesis]", short: "TEDAŞ", fascicles: [], hasData: false },
  { name: "Vakıflar Genel Müdürlüğü", short: "Vakıflar", fascicles: [], hasData: false },
];

export function BirimFiyatlarClient() {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("2026-Haziran");
  const [institution, setInstitution] = useState("ÇŞB");
  const [fascicle, setFascicle] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["ÇŞB"]));
  const [results, setResults] = useState<PozLibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      q: query, institution, year,
      page: String(page), pageSize: String(PAGE_SIZE),
    });
    if (fascicle) params.set("fascicle", fascicle);
    const res = await fetch(`/api/poz-library?${params}`);
    const data = await res.json();
    setResults(data.items ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [query, institution, year, fascicle, page]);

  useEffect(() => {
    const t = setTimeout(search, 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [query, institution, year, fascicle]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function toggle(short: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(short) ? next.delete(short) : next.add(short);
      return next;
    });
  }

  // Sayfa numaraları (max 10 görünür)
  const pageNumbers = (() => {
    const max = Math.min(totalPages, 10);
    const start = Math.max(1, Math.min(page - 5, totalPages - max + 1));
    return Array.from({ length: max }, (_, i) => start + i).filter((p) => p >= 1 && p <= totalPages);
  })();

  return (
    <div className="flex gap-5">
      {/* SOL — Kurum ağacı */}
      <aside className="w-64 shrink-0">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100 font-semibold text-sm text-gray-700">
            Birim Fiyat Kitapları
          </div>
          <div className="py-1 max-h-[600px] overflow-y-auto">
            {INSTITUTIONS.map((inst) => {
              const isExpanded = expanded.has(inst.short);
              const isActive = institution === inst.short && !fascicle;
              return (
                <div key={inst.short}>
                  <button
                    onClick={() => {
                      if (inst.hasData) {
                        setInstitution(inst.short);
                        setFascicle(null);
                        if (inst.defaultYear) setYear(inst.defaultYear);
                      }
                      if (inst.fascicles.length) toggle(inst.short);
                    }}
                    className={`w-full flex items-center gap-1.5 px-2.5 py-2 text-xs text-left transition-colors
                      ${isActive ? "bg-teal-50 text-teal-800 font-medium" : "text-gray-700 hover:bg-gray-50"}
                      ${!inst.hasData ? "opacity-60" : ""}`}
                  >
                    {inst.fascicles.length > 0 ? (
                      isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                    ) : <span className="w-3" />}
                    <span className="truncate">{inst.name}</span>
                  </button>
                  {isExpanded && inst.fascicles.map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setInstitution(inst.short);
                        setFascicle(f);
                        if (inst.defaultYear) setYear(inst.defaultYear);
                      }}
                      className={`w-full flex items-center gap-1.5 pl-7 pr-2 py-1.5 text-xs text-left transition-colors
                        ${institution === inst.short && fascicle === f ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* SAĞ — Pozlar */}
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Pozlar</h2>

        {/* Arama */}
        <div className="relative mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Poz no veya tanım ara..."
            className="w-full pl-4 pr-12 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" />
        </div>

        {/* Tablo */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-red-400 text-left">
                  <th className="px-4 py-3 font-semibold text-red-700 w-32">Poz No</th>
                  <th className="px-4 py-3 font-semibold text-red-700">Tanımı</th>
                  <th className="px-4 py-3 font-semibold text-red-700 w-20">Birimi</th>
                  <th className="px-4 py-3 font-semibold text-red-700 w-40 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>Birim Fiyatı</span>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="text-xs font-normal text-gray-700 border border-gray-300 rounded px-1 py-0.5 focus:outline-none"
                      >
                        {YEARS.map((y) => <option key={y}>{y}</option>)}
                      </select>
                    </div>
                  </th>
                  <th className="px-4 py-3 font-semibold text-red-700 w-20">Kitap Adı</th>
                  <th className="px-4 py-3 font-semibold text-red-700 w-28">Fasikül Adı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Yükleniyor...</td></tr>
                ) : results.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Sonuç bulunamadı.</td></tr>
                ) : results.map((poz) => (
                  <tr key={poz.id} className="hover:bg-teal-50/40 even:bg-gray-50/50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{poz.pozNo}</td>
                    <td className="px-4 py-2 text-gray-800">{poz.description}</td>
                    <td className="px-4 py-2 text-center text-gray-600">{poz.unit}</td>
                    <td className="px-4 py-2 text-right font-medium tabular-nums text-gray-900">
                      {formatCurrency(poz.unitPrice)}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">{poz.institutionName}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{poz.fascicleName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sayfalama */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">«</button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">‹</button>
              {pageNumbers.map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2.5 py-1 rounded min-w-[30px] ${p === page ? "bg-teal-600 text-white" : "hover:bg-gray-100"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">›</button>
              <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40">»</button>
            </div>
            <span>
              {total > 0
                ? `${(page - 1) * PAGE_SIZE + 1} - ${Math.min(page * PAGE_SIZE, total)} aralığı gösteriliyor. Toplam ${total.toLocaleString("tr-TR")} öğe var`
                : "Kayıt yok"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
