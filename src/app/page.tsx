import { prisma } from "@/lib/prisma";
import { ProjectListClient } from "@/components/ProjectListClient";
import { serialize } from "@/lib/serialize";

// Veritabanına istek anında bağlan (build sırasında prerender etme)
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, calculationDate: true, status: true, createdAt: true },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2a2e] to-[#1a4a52]">
      <header className="px-8 py-5 flex items-center justify-between border-b border-white/10">
        <div>
          <span className="text-xs font-semibold tracking-widest text-teal-400 uppercase">
            MaliyetBulut
          </span>
          <p className="text-white text-lg font-semibold mt-0.5">Proje Yönetimi</p>
        </div>
        <div className="text-xs text-gray-400">
          İnşaat Yaklaşık Maliyet Hesaplama Sistemi
        </div>
      </header>

      <div className="px-8 py-8 max-w-5xl mx-auto">
        <ProjectListClient
          initialProjects={
            serialize(projects)
          }
        />
      </div>
    </div>
  );
}
