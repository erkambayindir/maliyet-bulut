"use client";

import { useState, useCallback } from "react";
import { WorkGroupTree, ProjectPozRow } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PozEkleModal } from "@/components/modals/PozEkleModal";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  Trash2,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

interface YMCetveliClientProps {
  projectId: string;
  initialData: WorkGroupTree[];
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function")
    return (v as { toNumber: () => number }).toNumber();
  return Number(v) || 0;
}

function calcGroupTotal(group: WorkGroupTree): number {
  const own = group.projectPozs.reduce(
    (s, p) => s + toNum(p.quantity) * toNum(p.unitPrice),
    0
  );
  const children = group.children.reduce((s, c) => s + calcGroupTotal(c), 0);
  return own + children;
}

function removePozFromGroup(group: WorkGroupTree, pozId: string): WorkGroupTree {
  return {
    ...group,
    projectPozs: group.projectPozs.filter((p) => p.id !== pozId),
    children: group.children.map((c) => removePozFromGroup(c, pozId)),
  };
}

function updatePozInGroup(
  group: WorkGroupTree,
  pozId: string,
  field: "quantity" | "unitPrice",
  val: number
): WorkGroupTree {
  return {
    ...group,
    projectPozs: group.projectPozs.map((p) =>
      p.id === pozId ? { ...p, [field]: val } : p
    ),
    children: group.children.map((c) => updatePozInGroup(c, pozId, field, val)),
  };
}

function flattenGroups(groups: WorkGroupTree[], depth = 0): { group: WorkGroupTree; depth: number }[] {
  return groups.flatMap((g) => [{ group: g, depth }, ...flattenGroups(g.children, depth + 1)]);
}

export function YMCetveliClient({ projectId, initialData }: YMCetveliClientProps) {
  const [groups, setGroups] = useState<WorkGroupTree[]>(initialData);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    initialData[0]?.children[0]?.id ?? initialData[0]?.id ?? null
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(initialData.map((g) => g.id))
  );
  const [pozModalOpen, setPozModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCell, setEditingCell] = useState<{ pozId: string; field: "quantity" | "unitPrice" } | null>(null);
  const [editValue, setEditValue] = useState("");

  const grandTotal = groups.reduce((s, g) => s + calcGroupTotal(g), 0);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    const data = await res.json();
    setGroups(data.workGroups ?? []);
  }, [projectId]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Find selected group deeply
  function findGroup(groups: WorkGroupTree[], id: string): WorkGroupTree | null {
    for (const g of groups) {
      if (g.id === id) return g;
      const found = findGroup(g.children, id);
      if (found) return found;
    }
    return null;
  }

  const selectedGroup = selectedGroupId ? findGroup(groups, selectedGroupId) : null;

  const visiblePozs = (selectedGroup?.projectPozs ?? []).filter((p) =>
    searchQuery
      ? p.pozNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handleCellEdit = (poz: ProjectPozRow, field: "quantity" | "unitPrice") => {
    setEditingCell({ pozId: poz.id, field });
    setEditValue(String(field === "quantity" ? poz.quantity : poz.unitPrice).replace(".", ","));
  };

  const commitEdit = async (poz: ProjectPozRow, field: "quantity" | "unitPrice") => {
    const val = parseFloat(editValue.replace(",", "."));
    if (isNaN(val)) { setEditingCell(null); return; }

    // Optimistic update — anında state'e yaz
    setGroups((prev) =>
      prev.map((g) => updatePozInGroup(g, poz.id, field, val))
    );
    setEditingCell(null);

    // Arka planda API'ye kaydet
    await fetch(`/api/projects/${projectId}/pozs/${poz.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: val }),
    });
  };

  const deletePoz = async (pozId: string) => {
    if (!confirm("Bu poz silinsin mi?")) return;
    // Anında listeden kaldır
    setGroups((prev) =>
      prev.map((g) => removePozFromGroup(g, pozId))
    );
    await fetch(`/api/projects/${projectId}/pozs/${pozId}`, { method: "DELETE" });
  };

  const flatGroups = flattenGroups(groups);

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Yaklaşık Maliyet Cetveli</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Genel Toplam:{" "}
            <span className="font-bold text-teal-700 text-base">{formatCurrency(grandTotal)}</span>
          </span>
          <Button size="sm" variant="ghost" onClick={refresh} title="Yenile">
            <RefreshCw size={14} />
          </Button>
          <a
            href={`/api/projects/${projectId}/export`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
            title="Excel olarak indir"
          >
            <FileSpreadsheet size={15} />
            Excel
          </a>
          <a
            href={`/api/projects/${projectId}/export-word`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="Word olarak indir"
          >
            <FileText size={15} />
            Word
          </a>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: İş Grupları paneli */}
        <div className="w-56 shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="px-3 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">İş Grupları</span>
          </div>
          <div className="py-1">
            {flatGroups.map(({ group, depth }) => {
              const isSelected = selectedGroupId === group.id;
              const isExpanded = expandedGroups.has(group.id);
              const hasChildren = group.children.length > 0;
              const groupTotal = calcGroupTotal(group);

              return (
                <div
                  key={group.id}
                  className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer text-sm transition-colors group
                    ${isSelected ? "bg-teal-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                  style={{ paddingLeft: depth * 12 + 8 }}
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    if (hasChildren) toggleGroup(group.id);
                  }}
                >
                  {hasChildren ? (
                    <span className={isSelected ? "text-white/70" : "text-gray-400"}>
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </span>
                  ) : (
                    <span className="w-3" />
                  )}
                  {isSelected
                    ? <FolderOpen size={13} className="shrink-0 text-white/80" />
                    : <Folder size={13} className="shrink-0 text-gray-400" />}
                  <span className="flex-1 truncate text-xs font-medium">{group.name}</span>
                  <span className={`text-xs tabular-nums shrink-0 ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                    {groupTotal > 0 ? formatCurrency(groupTotal).replace("₺", "") : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Poz tablosu */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* Toolbar */}
          <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="ml-auto">
              <Button
                size="sm"
                onClick={() => setPozModalOpen(true)}
                disabled={!selectedGroupId}
              >
                <Plus size={14} /> Poz
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr className="border-b border-gray-300">
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-32">Poz No</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Tanımı</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 w-16">Birimi</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Miktarı</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-32">Birim Fiyatı</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-32">Tutarı</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {!selectedGroup && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                      Soldaki listeden bir iş grubu seçin.
                    </td>
                  </tr>
                )}
                {selectedGroup && visiblePozs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                      Bu grupta henüz poz yok.{" "}
                      <button
                        className="text-teal-600 underline"
                        onClick={() => setPozModalOpen(true)}
                      >
                        Poz ekleyin
                      </button>
                    </td>
                  </tr>
                )}
                {visiblePozs.map((poz) => {
                  const total = toNum(poz.quantity) * toNum(poz.unitPrice);
                  const isEditingQty = editingCell?.pozId === poz.id && editingCell.field === "quantity";
                  const isEditingPrice = editingCell?.pozId === poz.id && editingCell.field === "unitPrice";

                  return (
                    <tr key={poz.id} className="hover:bg-blue-50/40 group transition-colors">
                      <td className="px-3 py-2 font-mono text-xs text-gray-500">{poz.pozNo}</td>
                      <td className="px-3 py-2 text-gray-800">{poz.description}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{poz.unit}</td>

                      {/* Miktar — çift tıkla düzenle */}
                      <td
                        className="px-3 py-2 text-right cursor-pointer"
                        onDoubleClick={() => handleCellEdit(poz, "quantity")}
                      >
                        {isEditingQty ? (
                          <input
                            autoFocus
                            className="w-full text-right text-sm border border-teal-400 rounded px-1 py-0.5 outline-none"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(poz, "quantity")}
                            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(poz, "quantity"); }}
                          />
                        ) : (
                          <span className="tabular-nums text-gray-900">{formatNumber(poz.quantity)}</span>
                        )}
                      </td>

                      {/* Birim fiyat — çift tıkla düzenle */}
                      <td
                        className="px-3 py-2 text-right cursor-pointer"
                        onDoubleClick={() => handleCellEdit(poz, "unitPrice")}
                      >
                        {isEditingPrice ? (
                          <input
                            autoFocus
                            className="w-full text-right text-sm border border-teal-400 rounded px-1 py-0.5 outline-none"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(poz, "unitPrice")}
                            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(poz, "unitPrice"); }}
                          />
                        ) : (
                          <span className="tabular-nums text-gray-900">{formatCurrency(poz.unitPrice)}</span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-right font-medium text-gray-900 tabular-nums">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => deletePoz(poz.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                          title="Sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Group total footer */}
              {selectedGroup && visiblePozs.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-300 sticky bottom-0">
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right text-sm font-bold text-gray-700">
                      Grup Toplamı
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-teal-700 tabular-nums">
                      {formatCurrency(calcGroupTotal(selectedGroup))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      <PozEkleModal
        open={pozModalOpen}
        onClose={() => setPozModalOpen(false)}
        workGroupId={selectedGroupId ?? ""}
        projectId={projectId}
        onAdded={async () => {
          setPozModalOpen(false);
          await refresh();
        }}
      />
    </div>
  );
}
