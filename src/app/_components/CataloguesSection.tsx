import { listActiveCatalogueSummaries } from "@/lib/catalogueDb";
import CatalogueGrid from "./CatalogueGrid";

export default async function CataloguesSection() {
  const catalogues = await listActiveCatalogueSummaries();

  if (!catalogues.length) {
    return null;
  }

  return (
    <section className="pt-6" suppressHydrationWarning>
      <div className="text-center" suppressHydrationWarning>
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Categories</p>
      </div>
      <CatalogueGrid catalogues={catalogues} />
    </section>
  );
}


