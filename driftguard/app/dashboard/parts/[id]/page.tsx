import PartDrillDown from "./PartPage";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PartDrillDown params={params} />;
}
