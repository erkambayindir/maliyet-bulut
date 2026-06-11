"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { PozLibraryItem } from "@/types";
import { Plus, Search, ChevronRight, ChevronDown } from "lucide-react";

interface PozEkleModalProps {
  open: boolean;
  onClose: () => void;
  workGroupId: string;
  projectId: string;
  onAdded: () => void;
}

const YEARS = ["2026-Haziran", "2026-Mayıs", "2026-Ocak", "2025-Temmuz", "2025-Ocak"];

const INSTITUTION_TREE = [
  {
    name: "Çevre ve Şehircilik Bakanlığı",
    short: "ÇŞB",
    fascicles: [
      "İnşaat",
      "Mekanik Tesisat",
      "Elektrik",
    ],
  },
  {
    name: "Karayolları Genel Müdürlüğü",
    short: "KGM",
    fascicles: ["Yapım"],
  },
  {
    name: "DSİ",
    short: "DSİ",
    fascicles: ["İnşaat"],
  },
  {
    name: "İller Bankası",
    short: "İller Bankası",
    fascicles: ["İnşaat"],
  },
];

const PAGE_SIZE = 50;

export function PozEkleModal({ open, onClose, workGroupId, projectId, onAdded }: PozEkleModalProps) {
  const [year, setYear] = useState("2026-Haziran");
  const [query, setQuery] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState("ÇŞB");
  const [selectedFascicle, setSelectedFascicle] = useState<string | null>(null);
  const [expandedInstitutions, setExpandedInstitutions] = useState<Set<string>>(new Set(["ÇŞB"]));
  const [results, setResults] = useState<PozLibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      q: query,
      institution: selectedInstitution,
      year,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (selectedFascicle) params.set("fascicle", selectedFascicle);

    const res = await fetch(`/api/poz-library?${params}`);
    const data = await res.json();
    setResults(data.items ?? data);
    setTotal(data.total ?? data.length);
    setLoading(false);
  }, [query, selectedInstitution, selectedFascicle, year, page]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(search, 200);
    return () => clearTimeout(t);
  }, [open, search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [query, selectedInstitution, selectedFascicle, year]);

  async function handleAdd(poz: PozLibraryItem) {
    setAdding(poz.id);
    await fetch(`/api/projects/${projectId}/pozs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pozNo: poz.pozNo,
        description: poz.description,
        unit: poz.unit,
        unitPrice: poz.unitPrice,
        workGroupId,
      }),
    });
    setAdding(null);
    onAdded();
  }

  function toggleInstitution(short: string) {
    setExpandedInstitutions((prev) => {
      const next = new Set(prev);
      next.has(short) ? next.delete(short) : next.add(short);
      return next;
    });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Modal open={open} onClose={onClose} title="Poz Ekle" size="xl">
      <div className="flex gap-0 -mx-6 -mt-2" style={{ height: "70vh" }}>

        {/* LEFT: Kurum/Fasikül Ağacı */}
        <div className="w-52 shrink-0 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="px-3 py-2 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Birim Fiyat Kitapları</p>
          </div>
          <div className="py-1">
            {INSTITUTION_TREE.map((inst) => {
              const isExpanded = expandedInstitutions.has(inst.short);
              const isSelected = selectedInstitution === inst.short && !selectedFascicle;

              return (
                <div key={inst.short}>
                  <button
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-left transition-colors
                      ${isSelected ? "bg-teal-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                    onClick={() => {
                      setSelectedInstitution(inst.short);
                      setSelectedFascicle(null);
                      toggleInstitution(inst.short);
                    }}
                  >
                    {isExpanded
                      ? <ChevronDown size={11} className="shrink-0" />
                      : <ChevronRight size={11} className="shrink-0" />}
                    <span className="truncate font-medium">{inst.name}</span>
                  </button>

                  {isExpanded && inst.fascicles.map((f) => {
                    const isFascicleSelected = selectedInstitution === inst.short && selectedFascicle === f;
                    return (
                      <button
                        key={f}
                        className={`w-full flex items-center gap-1.5 pl-6 pr-2 py-1.5 text-xs text-left transition-colors
                          ${isFascicleSelected ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                        onClick={() => {
                          setSelectedInstitution(inst.short);
                          setSelectedFascicle(f);
                        }}
                      >
                        <span className="w-2.5 shrink-0">✓</span>
                        <span className="truncate">{f}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Arama + Tablo */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-3 bg-white">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Poz no veya tanım ara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="h-8 px-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-32">Poz No</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Tanımı</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 w-16">Birimi</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Birim Fiyatı</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 w-20">Kitap</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 w-20">Fasikül</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                      Yükleniyor...
                    </td>
                  </tr>
                )}
                {!loading && results.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                      Sonuç bulunamadı.
                    </td>
                  </tr>
                )}
                {!loading && results.map((poz) => (
                  <tr key={poz.id} className="hover:bg-teal-50 transition-colors group">
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{poz.pozNo}</td>
                    <td className="px-3 py-2 text-gray-800 max-w-xs">
                      <span className="line-clamp-2">{poz.description}</span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">{poz.unit}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-900 tabular-nums">
                      {formatCurrency(poz.unitPrice)}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-gray-500">{poz.institutionName}</td>
                    <td className="px-3 py-2 text-center text-xs text-gray-500">{poz.fascicleName}</td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => handleAdd(poz)}
                        disabled={adding === poz.id}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded bg-teal-600 text-white hover:bg-teal-700 transition-all disabled:opacity-50"
                        title="Ekle"
                      >
                        {adding === poz.id ? "..." : <Plus size={13} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-2.5 border-t border-gray-200 bg-white flex items-center justify-between text-xs text-gray-500">
            <span>
              {total > 0
                ? `${(page - 1) * PAGE_SIZE + 1} - ${Math.min(page * PAGE_SIZE, total)} aralığı gösteriliyor. Toplam ${total} öğe var`
                : "Sonuç yok"}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >«</button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >‹</button>

              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2 py-1 rounded min-w-[28px] ${p === page ? "bg-teal-600 text-white" : "hover:bg-gray-100"}`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >›</button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >»</button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
