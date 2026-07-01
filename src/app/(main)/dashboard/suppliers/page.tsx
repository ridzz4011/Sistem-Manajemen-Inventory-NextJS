import { prisma } from "@/server/db/prisma";
import { type SupplierRow, type SupplierStatus } from "./_components/data";
import { Suppliers } from "./_components/suppliers";

export const dynamic = "force-dynamic";

export default async function Page() {
  const vendors = await prisma.partner.findMany({
    where: { type: "VENDOR" },
    orderBy: { createdAt: "desc" },
  });

  const formattedSuppliers: SupplierRow[] = vendors.map((v) => {
    let mappedStatus: SupplierStatus = "Menunggu";
    if (v.status === "ACTIVE") mappedStatus = "Aktif";
    else if (v.status === "INACTIVE") mappedStatus = "Nonaktif";
    else if (v.status === "PENDING") mappedStatus = "Menunggu";
    else if (v.status === "SUSPENDED") mappedStatus = "Ditangguhkan";

    return {
      id: v.id,
      name: v.name,
      contactPerson: v.contactPerson || "-",
      email: v.email || "-",
      phone: v.phone || "-",
      category: v.category || "Umum",
      status: mappedStatus,
      products: v.products || "-",
      rating: v.rating ?? 0,
      joinedDate: v.joinedDate || "-",
    };
  });

  return <Suppliers suppliers={formattedSuppliers} />;
}
