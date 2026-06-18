"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Users, FolderOpen, Layers, TrendingUp } from "lucide-react";

interface UserStat {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  projectCount: number;
  pozCount: number;
  totalValue: number;
}

export function KullaniciYonetimiClient() {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { setUsers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalProjects = users.reduce((s, u) => s + u.projectCount, 0);
  const totalValue = users.reduce((s, u) => s + u.totalValue, 0);

  if (loading) return <div className="text-center py-20 text-gray-400">Yükleniyor...</div>;

  return (
    <div className="space-y-5">
      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />} label="Kullanıcı" value={String(users.length)} />
        <StatCard icon={<FolderOpen size={20} />} label="Toplam Proje" value={String(totalProjects)} />
        <StatCard icon={<Layers size={20} />} label="Toplam Poz" value={formatNumber(users.reduce((s, u) => s + u.pozCount, 0), 0)} />
        <StatCard icon={<TrendingUp size={20} />} label="Toplam YM Değeri" value={formatCurrency(totalValue)} />
      </div>

      {/* Kullanıcı tablosu */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b-2 border-teal-600 text-left">
              <th className="px-4 py-3 font-semibold text-gray-700">Ad Soyad</th>
              <th className="px-4 py-3 font-semibold text-gray-700">E-posta</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Rol</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Proje</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Poz</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Toplam YM Değeri</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Kullanıcı yok.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-800 font-medium">{u.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{u.email}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                    {u.role === "ADMIN" ? "Yönetici" : "Kullanıcı"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{u.projectCount}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{formatNumber(u.pozCount, 0)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium text-teal-700">{formatCurrency(u.totalValue)}</td>
                <td className="px-4 py-2.5 text-right text-gray-500 whitespace-nowrap">
                  {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
      <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
