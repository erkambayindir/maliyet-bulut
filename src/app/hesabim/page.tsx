import { TopNavServer } from "@/components/layout/TopNavServer";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User, Mail, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavServer />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-gray-800 mb-5">Hesabım</h1>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">
          <Row icon={<User size={18} />} label="Ad Soyad" value={user.name} />
          <Row icon={<Mail size={18} />} label="E-posta" value={user.email} />
          <Row icon={<Shield size={18} />} label="Rol" value={user.role === "ADMIN" ? "Yönetici" : "Kullanıcı"} />
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="text-teal-600">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}
