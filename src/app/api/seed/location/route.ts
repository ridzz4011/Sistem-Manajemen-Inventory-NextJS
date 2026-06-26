import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const warehouse = await prisma.warehouse.findFirst({
    where: {
      code: "WH001",
    },
  });

  if (!warehouse) {
    return NextResponse.json(
      {
        success: false,
        message: "Warehouse tidak ditemukan",
      },
      { status: 404 }
    );
  }

  await prisma.location.createMany({
    data: [
      {
        name: "Rak A1",
        warehouseId: warehouse.id,
      },
      {
        name: "Rak A2",
        warehouseId: warehouse.id,
      },
      {
        name: "Rak B1",
        warehouseId: warehouse.id,
      },
    ],
  });

  return NextResponse.json({
    success: true,
    message: "Location seeded",
  });
}