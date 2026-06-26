import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

const API_SECRET = process.env.API_SECRET_KEY;

export async function GET() {
  const items = await prisma.item.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${API_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized / Ditolak!" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const item = await prisma.item.create({
      data: {
        sku: body.sku,
        name: body.name,
        description: body.description,
        basePrice: body.basePrice,
        uom: body.uom,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Gagal membuat item via API:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create item",
      },
      {
        status: 500,
      }
    );
  }
}