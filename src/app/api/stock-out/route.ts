import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const kepalaGudang = await prisma.role.findFirst({
      where: {
        name: "KEPALA_GUDANG",
      },
    });

    if (!kepalaGudang) {
      return NextResponse.json(
        {
          success: false,
          message: "Role Kepala Gudang tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        referenceNo: `SO-${Date.now()}`,
        type: "STOCK_OUT",
        status: "PENDING",
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
    });

    await prisma.workflowTask.create({
      data: {
        transactionId: transaction.id,
        roleId: kepalaGudang.id,
        taskName: "Approve Stock Out",
        status: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        transactionId: transaction.id,
        workflowName: "Stock Out Workflow",
        entityType: "Transaction",
        entityId: transaction.id,
        action: "STOCK_OUT_CREATED",
        actorRole: "ADMIN_GUDANG",
        status: "PENDING",
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