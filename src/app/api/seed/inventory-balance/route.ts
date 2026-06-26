import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const item = await prisma.item.findFirst({
    where: {
      sku: "ITM001",
    },
  });

  const location = await prisma.location.findFirst({
    where: {
      name: "Rak A1",
    },
  });

  if (!item || !location) {
    return NextResponse.json(
      {
        success: false,
        message: "Item atau Location tidak ditemukan",
      },
      { status: 404 }
    );
  }

  const balance = await prisma.inventoryBalance.create({
    data: {
      itemId: item.id,
      locationId: location.id,
      quantity: 100,
    },
  });

  return NextResponse.json(balance);
}