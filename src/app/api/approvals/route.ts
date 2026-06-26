import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ApprovalStatus, ApprovalType } from "@/generated/prisma/enums";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") as ApprovalStatus) || ApprovalStatus.PENDING;

    const approvals = await prisma.approvalRequest.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: approvals }, { status: 200 });
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, requestedBy, payload, notes } = body;

    // 1. Simpan ke database (Tabel Transisi ApprovalRequest)
    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        type: type as ApprovalType,
        requestedBy,
        payload,
        notes,
        status: ApprovalStatus.PENDING,
      },
    });

    // 2. Trigger VFlow API
    // Kita petakan tipe request dengan endpoint webhook/trigger VFlow yang sesuai
    let vflowEndpoint = "";
    if (type === "NEW_ITEM") vflowEndpoint = "/api/v1/workflow/001-item-approval/trigger";
    else if (type === "NEW_VENDOR") vflowEndpoint = "/api/v1/workflow/002-vendor-onboarding/trigger";

    if (vflowEndpoint) {
      const vflowUrl = `${process.env.VFLOW_API_URL || "http://localhost:8080"}${vflowEndpoint}`;
      
      try {
        await fetch(vflowUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.VFLOW_API_KEY}`,
          },
          body: JSON.stringify({
            // Payload yang dikirim ke VFlow Engine
            requestId: approvalRequest.id,
            type: approvalRequest.type,
            requestedBy: approvalRequest.requestedBy,
            data: payload,
          }),
        });
        console.log(`[VFlow] Berhasil men-trigger workflow untuk request: ${approvalRequest.id}`);
      } catch (vflowError) {
        // Catat error VFlow tapi jangan gagalkan request pembuatan di DB kita
        console.error(`[VFlow] Gagal men-trigger workflow:`, vflowError);
      }
    }

    return NextResponse.json(
      { success: true, message: "Request berhasil dikirim untuk direview.", data: approvalRequest },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating approval request:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}