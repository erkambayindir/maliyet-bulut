import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface LogInput {
  projectId?: string | null;
  projectName: string;
  workGroupName?: string | null;
  pozNo?: string | null;
  action: string;
}

/**
 * İşlem geçmişine kayıt ekler — işlemi YAPAN giriş yapmış kullanıcıyı yazar.
 * Hata olsa bile ana işlemi bozmaz.
 */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    const user = await getCurrentUser();
    await prisma.activityLog.create({
      data: {
        userId: user?.id ?? null,
        userName: user?.email ?? "—",
        projectId: input.projectId ?? null,
        projectName: input.projectName,
        workGroupName: input.workGroupName ?? null,
        pozNo: input.pozNo ?? null,
        action: input.action,
      },
    });
  } catch (e) {
    console.error("logActivity hatası:", e);
  }
}
