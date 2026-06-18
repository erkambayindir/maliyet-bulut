import { TopNavServer } from "@/components/layout/TopNavServer";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { KullaniciYonetimiClient } from "./KullaniciYonetimiClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavServer />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-1">Kullanıcı Yönetimi</h1>
        <p className="text-sm text-gray-500 mb-5">Tüm kullanıcılar ve istatistikleri</p>
        <KullaniciYonetimiClient />
      </div>
    </div>
  );
}
