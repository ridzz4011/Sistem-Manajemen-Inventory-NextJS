import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const data = await prisma.transaction.findMany({
    include: {
      details: true,
      workflowTasks: true,
      auditLogs: true,
    },
  });

  return NextResponse.json(data);
}