import { Boxes, DollarSign, Store, TrendingUp, Warehouse } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface DashboardMetrics {
  revenue: number;
  vendorCount: number;
  productCount: number;
  inventoryValue: number;
}

export function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  const cards = [
    {
      title: "Total Pendapatan",
      value: formatRupiah(metrics.revenue),
      description: "Nilai transaksi barang keluar selesai",
      icon: DollarSign,
    },
    {
      title: "Total Vendor",
      value: metrics.vendorCount.toLocaleString("id-ID"),
      description: "Mitra pemasok terdaftar",
      icon: Store,
    },
    {
      title: "Total Produk",
      value: metrics.productCount.toLocaleString("id-ID"),
      description: "Barang tersedia di katalog",
      icon: Boxes,
    },
    {
      title: "Nilai Inventaris",
      value: formatRupiah(metrics.inventoryValue),
      description: "Nilai stok saat ini di semua lokasi",
      icon: Warehouse,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle>
                <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                  <Icon />
                </div>
              </CardTitle>
              <CardDescription>{card.title}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{card.value}</div>
                <Badge variant="secondary">
                  <TrendingUp />
                  Aktual
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatRupiah(value: number) {
  return `Rp. ${Math.round(value).toLocaleString("id-ID")}`;
}
