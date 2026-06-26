import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const totalItems = await prisma.item.count();

  return NextResponse.json({
    success: true,
    totalItems,
    message: "Database connected successfully",
  });
}