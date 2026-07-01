import { format } from "date-fns";
import { Settings2 } from "lucide-react";

import { prisma } from "@/server/db/prisma";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { Inventory } from "./_components/inventory";
import { KpiStrip } from "./_components/kpi-strip";
import { StoreTraffic } from "./_components/store-traffic";
import { TopProducts } from "./_components/top-products";
import { TrafficSources } from "./_components/traffic-sources";
import { InventoryTable } from "./_components/inventory-table";

export default async function Page() {
  const formattedDate = format(new Date(), "EEEE, do MMMM yyyy");

  // Inventory
  // Mengambil data langsung dari database PostgreSQL lokal Anda
  const inventoryDb = await prisma.item.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      balances: true, // Mengambil relasi InventoryBalance untuk mendapatkan data stok
    }
  });

  // Mapping (menyesuaikan bentuk) data Prisma ke format InventoryRow Frontend
  const formattedItems = inventoryDb.map((item) => {
    // Menghitung total stok dari semua lokasi di InventoryBalance
    const totalStock = item.balances.reduce((sum, balance) => sum + balance.quantity, 0);
    
    // Menentukan status visual berdasarkan total stok
    let statusValue: "Tersedia" | "Stok Menipis" | "Habis" = "Habis";
    if (totalStock > 10) statusValue = "Tersedia";
    else if (totalStock > 0 && totalStock <= 10) statusValue = "Stok Menipis";

    return {
      id: item.id,
      sku: item.sku,
      name: item.name,
      description: item.description,
      // Prisma Decimal perlu diubah (casting) menjadi Number agar bisa dibaca komponen Client
      basePrice: Number(item.basePrice), 
      uom: item.uom,
      stock: totalStock,
      status: statusValue,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Ringkasan Produk</h1>
          <p className="text-muted-foreground text-sm">{formattedDate}</p>
        </div>

        <div className="flex flex-wrap items-end justify-end gap-2 lg:w-fit">
          <Select defaultValue="this-month">
            <SelectTrigger className="w-34" id="ecommerce-period" size="sm">
              <SelectValue placeholder="Bulan Ini" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="this-month">Bulan Ini</SelectItem>
                <SelectItem value="last-month">Bulan Lalu</SelectItem>
                <SelectItem value="last-30-days">30 Hari Terakhir</SelectItem>
                <SelectItem value="year-to-date">Tahun Berjalan</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select defaultValue="all-channels">
            <SelectTrigger className="w-40" id="ecommerce-channel" size="sm">
              <SelectValue placeholder="Semua Kanal" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all-channels">Semua Kanal</SelectItem>
                <SelectItem value="online-store">Toko Online</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="social">Media Sosial</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" />

          <Button size="icon-sm" variant="outline">
            <Settings2 />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <KpiStrip />
        <div className="xl:col-span-5">
          <StoreTraffic />
        </div>
        <div className="xl:col-span-7">
          <TrafficSources />
        </div>
        <div className="xl:col-span-8">
          <TopProducts />
        </div>
        <div className="xl:col-span-4">
          <Inventory />
        </div>
        <div className="xl:col-span-12">
          <InventoryTable data={formattedItems} />
        </div>
      </div>
    </div>
  );
}
