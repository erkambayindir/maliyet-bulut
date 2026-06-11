import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { YMCetveliClient } from "./YMCetveliClient";
import { serialize } from "@/lib/serialize";

export default async function YMCetveliPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workGroups: {
        where: { parentId: null },
        orderBy: { order: "asc" },
        include: {
          projectPozs: { orderBy: { order: "asc" } },
          children: {
            orderBy: { order: "asc" },
            include: {
              projectPozs: { orderBy: { order: "asc" } },
              children: {
                orderBy: { order: "asc" },
                include: { projectPozs: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!project) notFound();

  const workGroups = serialize(project.workGroups);

  return <YMCetveliClient projectId={projectId} initialData={workGroups} />;
}
