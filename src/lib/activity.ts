import { prisma } from "@/lib/prisma";

// Tek kullanıcılı sistem — auth eklenince gerçek kullanıcıyla değiştirilecek
const DEFAULT_USER = "erkam.bayindir@gmail.com";

interface LogInput {
  projectId?: string | null;
  projectName: string;
  workGroupName?: string | null;
  pozNo?: string | null;
  action: string;
  userName?: string;
}

/** İşlem geçmişine kayıt ekler. Hata olsa bile ana işlemi bozmaz. */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        projectId: input.projectId ?? null,
        projectName: input.projectName,
        workGroupName: input.workGroupName ?? null,
        pozNo: input.pozNo ?? null,
        action: input.action,
        userName: input.userName ?? DEFAULT_USER,
      },
    });
  } catch (e) {
    console.error("logActivity hatası:", e);
  }
}
