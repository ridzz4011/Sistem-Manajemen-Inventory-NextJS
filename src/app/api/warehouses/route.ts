import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const warehouses = await prisma.warehouse.findMany();

  return NextResponse.json(warehouses);
}