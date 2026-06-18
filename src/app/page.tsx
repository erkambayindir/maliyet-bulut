import { prisma } from "@/lib/prisma";
import { ProjectListClient } from "@/components/ProjectListClient";
import { TopNav } from "@/components/layout/TopNav";
import { serialize } from "@/lib/serialize";

// Veritabanına istek anında bağlan (build sırasında prerender etme)
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, calculationDate: true, status: true, createdAt: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav userName="Furkan" />
      <div className="px-8 py-8 max-w-6xl mx-auto">
        <ProjectListClient initialProjects={serialize(projects)} />
      </div>
    </div>
  );
}
