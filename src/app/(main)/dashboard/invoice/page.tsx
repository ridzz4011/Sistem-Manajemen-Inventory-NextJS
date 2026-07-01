import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EntityType, PartnerStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

import { Invoice } from "./_components/invoice";
import type { InvoiceAvailableItem, InvoiceLocationOption, InvoiceToDetails } from "./_components/data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [partners, locations, stockedItems] = await Promise.all([
    prisma.partner.findMany({
      where: {
        status: PartnerStatus.ACTIVE,
        type: { in: [EntityType.VENDOR, EntityType.CLIENT] },
      },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      include: { warehouse: true },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      where: {
        balances: {
          some: {
            quantity: { gt: 0 },
          },
        },
      },
      include: {
        balances: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const clients: InvoiceToDetails[] = partners.map((partner) => ({
    id: partner.id,
    name: partner.name,
    email: partner.email || "-",
    addressLines: [partner.address || "-"],
    taxId: partner.type,
    type: partner.type,
  }));

  const locationOptions: InvoiceLocationOption[] = locations.map((location) => ({
    id: location.id,
    name: location.name,
    warehouseName: location.warehouse.name,
  }));

  const availableItems: InvoiceAvailableItem[] = stockedItems.map((item) => {
    const balances = item.balances
      .filter((balance) => balance.quantity > 0)
      .map((balance) => ({
        locationId: balance.locationId,
        quantity: balance.quantity,
      }));

    return {
      id: item.id,
      sku: item.sku,
      name: item.name,
      unitPrice: Number(item.basePrice),
      uom: item.uom,
      totalQuantity: balances.reduce((total, balance) => total + balance.quantity, 0),
      balances,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-3xl leading-none tracking-tight">Transaksi Inventaris</h1>
          <p className="text-muted-foreground text-sm">
            Buat faktur stok masuk dari supplier dan faktur stok keluar untuk pelanggan, lalu kirim ke persetujuan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline">
            <Save data-icon="inline-start" />
            Simpan Draf
          </Button>
        </div>
      </div>

      <Invoice clients={clients} locations={locationOptions} availableItems={availableItems} />
    </div>
  );
}
