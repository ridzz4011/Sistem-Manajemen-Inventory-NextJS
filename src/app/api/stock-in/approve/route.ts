import { NextResponse } from "next/server";
import { ApprovalStatus } from "@/generated/prisma/client";
import { completeInventoryTransaction } from "@/server/inventory-transactions";
import { prisma } from "@/server/db/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const transactionId = body.transactionId;
    if (!transactionId) {
      return NextResponse.json({ success: false, message: "transactionId is required" }, { status: 400 });
    }

    const transaction = await completeInventoryTransaction(transactionId);

    if (body.requestId) {
      await prisma.approvalRequest.updateMany({
        where: { id: body.requestId },
        data: { status: ApprovalStatus.APPROVED },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Stock In Approved",
      data: transaction,
    });
  } catch (error) {
    console.error("Error approving stock in:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
