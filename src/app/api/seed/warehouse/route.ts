import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const warehouse = await prisma.warehouse.createMany({
    data: [
      {
        code: "WH001",
        name: "Gudang Utama",
        address: "Karawang",
      },
    ],
  });

  return NextResponse.json({
    success: true,
    warehouse,
  });
}