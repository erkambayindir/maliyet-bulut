"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { ChevronDown, Maximize2, X } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface PozStat { pozNo: string; value: number; }
interface ProjeStat { name: string; total: number; }
interface ProjeDate { id: string; name: string; date: string; }

interface StatsData {
  enSikKullanilan: PozStat[];
  parasalEnYuksek: PozStat[];
  enCokMiktar: PozStat[];
  ymEnYuksekProjeler: ProjeStat[];
  buYilProjeler: ProjeDate[];
}

const BAR_COLOR = "#3b9fd1";

// Widget kart çerçevesi — OSKA tarzı (başlık + kırmızı çizgi + ikonlar)
function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-red-500">
        <h3 className="text-sm font-semibold text-teal-800">{title}</h3>
        <div className="flex items-center gap-2 text-gray-300">
          <ChevronDown size={15} className="hover:text-gray-500 cursor-pointer" />
          <Maximize2 size={13} className="hover:text-gray-500 cursor-pointer" />
          <X size={15} className="hover:text-gray-500 cursor-pointer" />
        </div>
      </div>
      <div className="p-3 flex-1 min-h-[300px]">{children}</div>
    </div>
  );
}

function PozBarChart({ data, isCurrency }: { data: PozStat[]; isCurrency?: boolean }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Veri yok</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="pozNo"
          angle={-45}
          textAnchor="end"
          height={70}
          tick={{ fontSize: 10, fill: "#6b7280" }}
          interval={0}
        />
        <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
        <Tooltip
          formatter={(v) => (isCurrency ? formatCurrency(Number(v)) : formatNumber(Number(v), 2))}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ fontSize: 12, borderRadius: 6 }}
        />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={BAR_COLOR} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AkilliPanelClient() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Yükleniyor...</div>;
  }
  if (!data) {
    return <div className="text-center py-20 text-gray-400">Veri yüklenemedi.</div>;
  }

  return (
    <div className="space-y-5">
      {/* Üst sıra: 2 grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Widget title="YM'de En Sık Kullanılan 10 Poz">
          <PozBarChart data={data.enSikKullanilan} />
        </Widget>
        <Widget title="Parasal Tutarı En Yüksek 10 Poz">
          <PozBarChart data={data.parasalEnYuksek} isCurrency />
        </Widget>
      </div>

      {/* Orta sıra: grafik + tablo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Widget title="En Çok Miktarda Kullanılan 10 Poz">
          <PozBarChart data={data.enCokMiktar} />
        </Widget>
        <Widget title="YM Değeri En Yüksek 10 Proje">
          <ProjeTablosu
            head={["İş Dosyası", "Tutar"]}
            rows={data.ymEnYuksekProjeler.map((p) => [p.name, formatCurrency(p.total)])}
          />
        </Widget>
      </div>

      {/* Alt sıra: tam genişlik tablo */}
      <Widget title="Bu Yıl İçerisinde Hazırlanmış Yaklaşık Maliyet Dosyaları">
        <ProjeTablosu
          head={["İş Dosyası", "Hesaplanma Tarihi"]}
          rows={data.buYilProjeler.map((p) => [
            p.name,
            new Date(p.date).toLocaleDateString("tr-TR"),
          ])}
        />
      </Widget>
    </div>
  );
}

function ProjeTablosu({ head, rows }: { head: [string, string]; rows: string[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-2 border-teal-600 text-left">
          <th className="px-3 py-2 font-semibold text-gray-700">{head[0]}</th>
          <th className="px-3 py-2 font-semibold text-gray-700 w-48 text-right">{head[1]}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.length === 0 ? (
          <tr><td colSpan={2} className="text-center py-8 text-gray-400">Kayıt yok</td></tr>
        ) : rows.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-3 py-2 text-gray-800">{row[0]}</td>
            <td className="px-3 py-2 text-gray-700 text-right tabular-nums">{row[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
