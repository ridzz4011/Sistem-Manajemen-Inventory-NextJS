import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ApprovalStatus } from "@/generated/prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Jika VFlow mengirimkan taskId saat HumanTask dibuat, Anda tangkap di sini.
    // Jika VFlow Anda dirancang untuk menerima korelasi ID, gunakan requestId.
    const { requestId, taskId } = body;

    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== ApprovalStatus.PENDING) {
      return NextResponse.json({ success: false, message: "Request tidak valid." }, { status: 400 });
    }

    // 1. Ubah status request di tabel transisi menjadi APPROVED
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: ApprovalStatus.APPROVED },
    });

    // 2. Teruskan persetujuan ke VFlow Webhook sesuai tipe request agar VFlow menjalankan call_nextjs_api
    let vflowEndpoint = "";
    const payload: any = request.payload || {};
    let vflowPayload: any = { requestId: request.id, is_approved: true, is_manual_approval: false };

    switch (request.type) {
      case "NEW_ITEM":
        vflowEndpoint = "/webhook/kelompok2/inventory/item/create-v15";
        const sku = payload.item_sku ?? payload.sku;
        const name = payload.item_name ?? payload.name;
        const price = payload.item_price ?? payload.price ?? 0;
        const uom = payload.item_uom ?? payload.uom ?? "PCS";
        const desc = payload.item_description ?? payload.description ?? "Barang disetujui melalui Workflow VFlow";
        if (sku) {
          await prisma.item.upsert({
            where: { sku: sku },
            update: { name, description: desc, basePrice: Number(price), uom },
            create: {
              sku: sku,
              name: name,
              description: desc,
              basePrice: Number(price),
              uom: uom,
            },
          });
        }
        vflowPayload = {
          ...vflowPayload,
          item_name: name,
          item_sku: sku,
          item_price: price,
          item_uom: uom
        };
        break;
      case "NEW_VENDOR":
        vflowEndpoint = "/webhook/kelompok2/inventory/vendor/register";
        const vendorName = payload.vendor_name ?? payload.name;
        const vendorContact = payload.vendor_phone ?? payload.phone ?? payload.vendor_contact ?? payload.contact ?? "-";
        const formattedDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        if (vendorName) {
          const existingVendor = await prisma.partner.findFirst({
            where: { name: vendorName, type: "VENDOR" },
          });
          if (existingVendor) {
            await prisma.partner.update({
              where: { id: existingVendor.id },
              data: {
                status: "Active",
                joinedDate: formattedDate,
                contactPerson: payload.vendor_contactPerson ?? payload.contactPerson ?? existingVendor.contactPerson,
                phone: payload.vendor_phone ?? payload.phone ?? payload.vendor_contact ?? existingVendor.phone,
                email: payload.vendor_email ?? payload.email ?? existingVendor.email,
                category: payload.vendor_category ?? payload.category ?? existingVendor.category,
                products: payload.vendor_products ?? payload.products ?? existingVendor.products,
              },
            });
          } else {
            await prisma.partner.create({
              data: {
                name: vendorName,
                contactPerson: payload.vendor_contactPerson ?? payload.contactPerson ?? "-",
                phone: payload.vendor_phone ?? payload.phone ?? payload.vendor_contact ?? "-",
                email: payload.vendor_email ?? payload.email ?? "-",
                address: payload.vendor_address ?? payload.address ?? "-",
                category: payload.vendor_category ?? payload.category ?? "Umum",
                products: payload.vendor_products ?? payload.products ?? "-",
                rating: Number(payload.vendor_rating ?? payload.rating ?? 0),
                status: "Active",
                joinedDate: formattedDate,
                type: "VENDOR",
              },
            });
          }
        }

        vflowPayload = {
          ...vflowPayload,
          vendor_name: vendorName,
          vendor_contact: vendorContact,
          vendor_status: payload.vendor_status ?? "NEW"
        };
        break;
      case "STOCK_IN":
        vflowEndpoint = "/webhook/kelompok2/inventory/stock-in";
        vflowPayload = {
          ...vflowPayload,
          transactionId: request.id,
          expected_qty: payload.expected_qty ?? payload.expectedQty,
          received_qty: payload.received_qty ?? payload.receivedQty
        };
        break;
      case "STOCK_OUT":
        vflowEndpoint = "/webhook/kelompok2/inventory/stock-out";
        vflowPayload = {
          ...vflowPayload,
          transactionId: request.id,
          current_stock: payload.current_stock ?? payload.currentStock,
          requested_qty: payload.requested_qty ?? payload.requestedQty
        };
        break;
      case "STOCK_OPNAME":
        vflowEndpoint = "/webhook/kelompok2/inventory/stock-opname";
        vflowPayload = {
          ...vflowPayload,
          system_stock: payload.system_stock ?? payload.systemStock,
          physical_stock: payload.physical_stock ?? payload.physicalStock
        };
        break;
    }

    if (vflowEndpoint && process.env.VFLOW_BASE_URL) {
      const vflowUrl = `${process.env.VFLOW_BASE_URL}${vflowEndpoint}`;
      try {
        await fetch(vflowUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vflowPayload),
        });
        console.log(`[Next.js] Berhasil memicu VFlow webhook untuk manual approve: ${vflowEndpoint}`);
      } catch (vflowError) {
        console.error(`[Next.js] Gagal menghubungi VFlow Webhook API:`, vflowError);
      }
    }

    return NextResponse.json(
      { success: true, message: "Request berhasil disetujui dan diteruskan ke VFlow." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error approving request:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}