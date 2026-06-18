import { TopNavServer } from "@/components/layout/TopNavServer";
import Link from "next/link";
import { Construction } from "lucide-react";

export function YakindaPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavServer />
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <Construction size={56} className="mx-auto text-teal-600/40 mb-4" />
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <p className="text-gray-500 mt-2">Bu bölüm yakında hizmete girecek.</p>
        <Link
          href="/"
          className="inline-block mt-6 px-5 py-2.5 text-sm font-medium rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors"
        >
          ← Projelere Dön
        </Link>
      </div>
    </div>
  );
}
