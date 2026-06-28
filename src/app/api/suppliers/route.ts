import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, name, contactInfo } = body;

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    const existing = await prisma.partner.findFirst({
      where: { name: name, type: "VENDOR" },
    });

    let partner = existing;
    if (!existing) {
      partner = await prisma.partner.create({
        data: {
          name,
          phone: contactInfo,
          type: "VENDOR",
        },
      });
    }

    if (requestId) {
      await prisma.approvalRequest.updateMany({
        where: { id: requestId },
        data: { status: "APPROVED" },
      });
    } else {
      await prisma.approvalRequest.updateMany({
        where: {
          type: "NEW_VENDOR",
          status: "PENDING",
          OR: [
            { payload: { path: ["name"], equals: name } },
            { payload: { path: ["vendor_name"], equals: name } },
          ],
        },
        data: { status: "APPROVED" },
      });
    }

    return NextResponse.json({ success: true, data: partner }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vendor callback:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
