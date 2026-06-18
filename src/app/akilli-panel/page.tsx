import { TopNav } from "@/components/layout/TopNav";
import { AkilliPanelClient } from "./AkilliPanelClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav userName="Furkan" />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-5">Akıllı Panel</h1>
        <AkilliPanelClient />
      </div>
    </div>
  );
}
