import { prisma } from "@/lib/prisma";
import { ProjectListClient } from "@/components/ProjectListClient";
import { TopNavServer } from "@/components/layout/TopNavServer";
import { serialize } from "@/lib/serialize";
import { getCurrentUser } from "@/lib/auth";

// Veritabanına istek anında bağlan (build sırasında prerender etme)
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  // Admin tüm projeleri, normal kullanıcı yalnızca kendi projelerini görür.
  // Kullanıcı yoksa hiçbir şey gösterme (undefined filtre footgun'ını engelle).
  const projects = !user
    ? []
    : await prisma.project.findMany({
        where: user.role === "ADMIN" ? {} : { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, calculationDate: true, status: true, createdAt: true },
      });

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavServer />
      <div className="px-8 py-8 max-w-6xl mx-auto">
        <ProjectListClient initialProjects={serialize(projects)} />
      </div>
    </div>
  );
}
