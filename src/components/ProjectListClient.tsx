"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProjectSummary } from "@/types";
import { Plus, Search, Archive, Trash2 } from "lucide-react";

interface ProjectListClientProps {
  initialProjects: ProjectSummary[];
}

export function ProjectListClient({ initialProjects }: ProjectListClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  async function createProject() {
    if (!projectName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: projectName.trim() }),
    });
    const project = await res.json();
    setCreating(false);
    setNewModalOpen(false);
    setProjectName("");
    router.push(`/projeler/${project.id}/ym-cetveli`);
  }

  async function deleteProject(id: string, name: string) {
    if (!confirm(`"${name}" projesi silinsin mi? Bu işlem geri alınamaz.`)) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const visible = projects.filter((p) =>
    search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <>
      {/* Üst aksiyon çubuğu */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => setNewModalOpen(true)}
          className="flex items-center gap-3 group"
        >
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-colors">
            <Plus size={24} />
          </span>
          <span className="text-gray-700 font-medium group-hover:text-gray-900">
            Yeni Proje Oluştur
          </span>
        </button>

        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Proje Ara"
            className="w-full pl-11 pr-4 py-3 text-sm border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Başlık */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Projeler</h2>

      {/* Tablo */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-teal-600 bg-gray-50">
              <th className="text-left px-6 py-3 font-semibold text-gray-700">Projenin Adı</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-700 w-64">Hesap Tarihi</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-gray-400">
                  {search ? "Eşleşen proje bulunamadı." : "Henüz proje oluşturulmadı."}
                </td>
              </tr>
            ) : (
              visible.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => router.push(`/projeler/${project.id}/ym-cetveli`)}
                  className="hover:bg-teal-50/50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-3.5 text-gray-800 font-medium">{project.name}</td>
                  <td className="px-6 py-3.5 text-gray-600">
                    {new Date(project.calculationDate).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id, project.name); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all"
                      title="Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Alt aksiyonlar */}
      <div className="flex items-center justify-end gap-6 mt-5">
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <span className="flex items-center justify-center w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow transition-colors">
            <Archive size={18} />
          </span>
          <span className="text-sm font-medium">Arşiv</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <span className="flex items-center justify-center w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow transition-colors">
            <Trash2 size={18} />
          </span>
          <span className="text-sm font-medium">Çöp Kutusu</span>
        </button>
      </div>

      <Modal open={newModalOpen} onClose={() => setNewModalOpen(false)} title="Yeni Proje Oluştur" size="sm">
        <div className="space-y-4">
          <Input
            label="Proje Adı"
            placeholder="Örn: Yenişehir Konut Projesi"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createProject(); }}
            autoFocus
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setNewModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={createProject} disabled={creating || !projectName.trim()}>
              {creating ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
