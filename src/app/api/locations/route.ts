import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const locations = await prisma.location.findMany({
    include: {
      warehouse: true,
    },
  });

  return NextResponse.json(locations);
}
