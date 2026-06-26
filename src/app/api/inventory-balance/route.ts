import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const balances = await prisma.inventoryBalance.findMany({
    include: {
      item: true,
      location: true,
    },
  });

  return NextResponse.json(balances);
}