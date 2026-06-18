import { getCurrentUser } from "@/lib/auth";
import { TopNav } from "@/components/layout/TopNav";

// Oturumdaki kullanıcıyı çekip TopNav'a geçiren server sarmalayıcı
export async function TopNavServer() {
  const user = await getCurrentUser();
  return (
    <TopNav
      userName={user?.name ?? "Kullanıcı"}
      isAdmin={user?.role === "ADMIN"}
    />
  );
}
