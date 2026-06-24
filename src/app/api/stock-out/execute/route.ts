import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const transaction = await prisma.transaction.create({
      data: {
        referenceNo: `SO-${Date.now()}`,
        type: "STOCK_OUT",
        status: "COMPLETED",
        notes: body.notes,

        details: {
          create: [
            {
              itemId: body.itemId,
              locationId: body.locationId,
              quantity: body.quantity,
            },
          ],
        },
      },
      include: {
        details: true,
      },
    });

    const balance = await prisma.inventoryBalance.findFirst({
      where: {
        itemId: body.itemId,
        locationId: body.locationId,
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
        quantity: balance.quantity - body.quantity,
      },
    });

    await prisma.auditLog.create({
      data: {
        transactionId: transaction.id,
        workflowName: "Stock Out Workflow",
        entityType: "Transaction",
        entityId: transaction.id,
        action: "STOCK_OUT_EXECUTED",
        actorRole: "VFLOW",
        status: "COMPLETED",
      },
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      referenceNo: transaction.referenceNo,
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