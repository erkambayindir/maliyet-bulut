import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, ownerId: true },
  });

  if (!project) notFound();

  // Sahiplik kontrolü — admin hepsine erişebilir, kullanıcı yalnızca kendi projesine
  if (user.role !== "ADMIN" && project.ownerId && project.ownerId !== user.id) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar projectId={project.id} projectName={project.name} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
