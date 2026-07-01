import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const items = await prisma.item.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(items);
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description, basePrice, uom } = body;

    if (!id) {
      return NextResponse.json({ message: "Item id is required" }, { status: 400 });
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(basePrice !== undefined ? { basePrice: Number(basePrice) } : {}),
        ...(uom ? { uom } : {}),
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Item id is required" }, { status: 400 });
    }

    const transactionCount = await prisma.transactionDetail.count({ where: { itemId: id } });
    if (transactionCount > 0) {
      return NextResponse.json(
        { message: "Item already has transactions and cannot be deleted." },
        { status: 409 },
      );
    }

    await prisma.inventoryBalance.deleteMany({ where: { itemId: id } });
    await prisma.item.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete item" }, { status: 500 });
  }
}
