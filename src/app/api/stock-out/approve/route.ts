import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const transaction = await prisma.transaction.findUnique({
      where: {
        id: body.transactionId,
      },
      include: {
        details: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction tidak ditemukan",
        },
        { status: 404 }
      );
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction bukan status PENDING",
        },
        { status: 400 }
      );
    }

    // kurangi stok
    for (const detail of transaction.details) {
      const balance = await prisma.inventoryBalance.findFirst({
        where: {
          itemId: detail.itemId,
          locationId: detail.locationId,
        },
      });

      if (!balance) {
        throw new Error("Inventory balance tidak ditemukan");
      }

      await prisma.inventoryBalance.update({
        where: {
          id: balance.id,
        },
        data: {
          quantity: balance.quantity - detail.quantity,
        },
      });
    }

    await prisma.transaction.update({
      where: {
        id: transaction.id,
      },
      data: {
        status: "COMPLETED",
      },
    });

    await prisma.workflowTask.updateMany({
      where: {
        transactionId: transaction.id,
      },
      data: {
        status: "APPROVED",
      },
    });

    await prisma.auditLog.create({
      data: {
        transactionId: transaction.id,
        workflowName: "Stock Out Workflow",
        entityType: "Transaction",
        entityId: transaction.id,
        action: "STOCK_OUT_APPROVED",
        actorRole: "KEPALA_GUDANG",
        status: "COMPLETED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Stock Out Approved",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}