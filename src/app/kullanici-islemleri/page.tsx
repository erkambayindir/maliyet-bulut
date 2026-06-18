import { TopNav } from "@/components/layout/TopNav";
import { KullaniciIslemleriClient } from "./KullaniciIslemleriClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav userName="Furkan" />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <KullaniciIslemleriClient />
      </div>
    </div>
  );
}
