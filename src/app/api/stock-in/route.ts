import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const expiryDate = new Date(body.expiryDate);

    const today = new Date();

    const diffDays = Math.ceil(
      (expiryDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
    );

    if (diffDays < 30) {
      return NextResponse.json(
        {
          success: false,
          message: "Expiry date kurang dari 30 hari",
        },
        { status: 400 }
      );
    }

    const approverRole = await prisma.role.findFirst({
      where: {
        name: "KEPALA_GUDANG",
      },
    });

    if (!approverRole) {
      return NextResponse.json(
        {
          success: false,
          message: "Role approver tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        referenceNo: `SI-${Date.now()}`,
        type: "STOCK_IN",
        status: "PENDING",

        notes: body.notes,

        details: {
          create: [
            {
              itemId: body.itemId,
              locationId: body.locationId,
              quantity: body.receivedQty,

              metadata: {
                expectedQty: body.expectedQty,
                receivedQty: body.receivedQty,
                expiryDate: body.expiryDate,
              },
            },
          ],
        },
      },
    });

    await prisma.workflowTask.create({
      data: {
        transactionId: transaction.id,
        roleId: approverRole.id,
        taskName: "Approve Stock In",
        status: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        transactionId: transaction.id,
        workflowName: "Stock In Workflow",
        entityType: "Transaction",
        entityId: transaction.id,
        action: "STOCK_IN_CREATED",
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