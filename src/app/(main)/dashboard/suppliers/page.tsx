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
    let mappedStatus: SupplierStatus = "Pending";
    if (v.status === "Active") mappedStatus = "Active";
    else if (v.status === "Inactive") mappedStatus = "Inactive";
    else if (v.status === "Suspended") mappedStatus = "Suspended";

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
