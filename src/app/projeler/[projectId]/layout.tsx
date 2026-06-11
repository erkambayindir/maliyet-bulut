import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { notFound } from "next/navigation";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  });

  if (!project) notFound();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar projectId={project.id} projectName={project.name} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
