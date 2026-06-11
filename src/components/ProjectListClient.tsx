"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProjectSummary } from "@/types";
import { Plus, FolderOpen, Calendar, Trash2 } from "lucide-react";

interface ProjectListClientProps {
  initialProjects: ProjectSummary[];
}

export function ProjectListClient({ initialProjects }: ProjectListClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);

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

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
          Projeler ({projects.length})
        </h2>
        <Button onClick={() => setNewModalOpen(true)} size="sm">
          <Plus size={14} /> Yeni Proje
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Henüz proje oluşturulmadı.</p>
          <p className="text-xs mt-1">Yukarıdaki "Yeni Proje" butonu ile başlayın.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-5 flex items-center justify-between transition-colors group"
            >
              <Link
                href={`/projeler/${project.id}/ym-cetveli`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="p-2 rounded-lg bg-teal-600/30">
                  <FolderOpen size={18} className="text-teal-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{project.name}</p>
                  <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                    <Calendar size={11} />
                    {new Date(project.calculationDate).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${project.status === "ACTIVE"
                    ? "bg-teal-500/20 text-teal-300"
                    : "bg-gray-500/20 text-gray-400"}`}>
                  {project.status === "ACTIVE" ? "Aktif" : project.status}
                </span>
                <button
                  onClick={() => deleteProject(project.id, project.name)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all rounded-md hover:bg-red-500/10"
                  title="Projeyi Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
