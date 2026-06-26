import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const balance = await prisma.inventoryBalance.findFirst({
      where: {
        itemId: body.itemId,
        locationId: body.locationId,
      },
    });

    if (!balance) {
      return NextResponse.json(
        {
          success: false,
          message: "Inventory balance tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      current_stock: balance.quantity,
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