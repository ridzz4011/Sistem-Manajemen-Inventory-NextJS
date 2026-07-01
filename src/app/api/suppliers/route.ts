import { NextResponse } from "next/server";
import { ApprovalStatus, EntityType, PartnerStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      requestId,
      partnerId,
      name,
      contactInfo,
      vendor_name,
      vendor_contactPerson,
      vendor_contact,
      vendor_phone,
      vendor_email,
      vendor_address,
      vendor_category,
      vendor_products,
      vendor_rating,
    } = body;
    const vendorName = vendor_name ?? name;
    const phone = vendor_phone ?? vendor_contact ?? contactInfo ?? "-";

    if (!vendorName) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    const existing = partnerId
      ? await prisma.partner.findUnique({ where: { id: partnerId } })
      : await prisma.partner.findFirst({
          where: { name: vendorName, type: EntityType.VENDOR },
        });

    const formattedDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const vendorData = {
      name: vendorName,
      contactPerson: vendor_contactPerson ?? existing?.contactPerson ?? "-",
      phone,
      email: vendor_email ?? existing?.email ?? "-",
      address: vendor_address ?? existing?.address ?? "-",
      category: vendor_category ?? existing?.category ?? "Umum",
      products: vendor_products ?? existing?.products ?? "-",
      rating: Number(vendor_rating ?? existing?.rating ?? 0),
      status: PartnerStatus.ACTIVE,
      joinedDate: formattedDate,
      type: EntityType.VENDOR,
    };

    const partner = existing
      ? await prisma.partner.update({
          where: { id: existing.id },
          data: vendorData,
        })
      : await prisma.partner.create({
          data: vendorData,
        });

    if (requestId) {
      await prisma.approvalRequest.updateMany({
        where: { id: requestId },
        data: { status: ApprovalStatus.APPROVED },
      });
    } else {
      await prisma.approvalRequest.updateMany({
        where: {
          type: "NEW_VENDOR",
          status: ApprovalStatus.PENDING,
          OR: [
            { payload: { path: ["name"], equals: vendorName } },
            { payload: { path: ["vendor_name"], equals: vendorName } },
          ],
        },
        data: { status: ApprovalStatus.APPROVED },
      });
    }

    return NextResponse.json({ success: true, data: partner }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vendor callback:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, contactPerson, phone, email, address, category, products, rating, status } = body;

    if (!id) {
      return NextResponse.json({ message: "Supplier id is required" }, { status: 400 });
    }

    const supplier = await prisma.partner.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(contactPerson !== undefined ? { contactPerson } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(products !== undefined ? { products } : {}),
        ...(rating !== undefined ? { rating: Number(rating) } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Supplier id is required" }, { status: 400 });
    }

    const supplier = await prisma.partner.update({
      where: { id },
      data: { status: PartnerStatus.INACTIVE },
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to deactivate supplier" }, { status: 500 });
  }
}
