import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const roles = await prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(roles);
}