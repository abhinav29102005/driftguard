import { getAllParts } from "@/lib/mockData";
import PartDrillDown from "./PartPage";

export function generateStaticParams() {
  return getAllParts().map((p) => ({ id: p.id }));
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PartDrillDown params={params} />;
}
