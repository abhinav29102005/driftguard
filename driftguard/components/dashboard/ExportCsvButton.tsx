import React from 'react';
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";
import type { Part } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  parts: Part[];
}

export function ExportCsvButton({ parts }: Props) {
  const handleDownload = () => {
    if (parts.length === 0) {
      toast.error("No parts to export");
      return;
    }

    const headers = [
      "Part ID",
      "Lot ID",
      "Status",
      "Module A (IF)",
      "Module A (ECOD)",
      "Module A (Fused Risk)",
      "Module B (Predicted 168h)",
      "Module B (Residual)",
    ];

    const rows = parts.map(p => [
      p.id,
      p.lotId,
      p.status,
      p.moduleA.if_score.toFixed(4),
      p.moduleA.ecod_score.toFixed(4),
      p.moduleA.fused_score.toFixed(4),
      p.moduleB.final_predicted_168h.toFixed(4),
      p.moduleB.xgb_residual.toFixed(4)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `driftguard_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV Report downloaded");
  };

  return (
    <Button variant="ghost" onClick={handleDownload} className="gap-2 h-9 text-xs">
      <Download className="h-4 w-4" />
      Download QA Report
    </Button>
  );
}
