import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ApprovalStatus } from "@/generated/prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, notes } = body;

    // 1. Ubah status request di tabel transisi menjadi REJECTED
    const request = await prisma.approvalRequest.findUnique({
        where: { id: requestId }, // <--- requestId berasal dari parameter body yang dikirim UI
    });

    if (!request || request.status !== ApprovalStatus.PENDING) {
        return NextResponse.json({ success: false, message: "Request tidak valid." }, { status: 400 });
    }

    const updatedRequest = await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: ApprovalStatus.REJECTED },
    });

    // 2. Beri tahu VFlow bahwa HumanTask ditolak (Cancel Workflow)
    const vflowTaskEndpoint = request.taskId 
      ? `/api/v1/tasks/${request.taskId}/complete`
      : `/webhook/kelompok2/inventory/create`;

    const vflowUrl = `${process.env.VFLOW_BASE_URL}${vflowTaskEndpoint}`;

    try {
      await fetch(vflowUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.API_SECRET_KEY}`,
        },
        body: JSON.stringify({
          decision: "REJECT", // Enum bahwa request ditolak
          requestId: requestId,
          reason: notes
        }),
      });
      console.log(`[Next.js] Berhasil mengirim sinyal Reject ke VFlow untuk request: ${requestId}`);
    } catch (vflowError) {
      console.error(`[Next.js] Gagal menghubungi VFlow Task API:`, vflowError);
    }

    return NextResponse.json(
      { success: true, message: "Request berhasil ditolak.", data: updatedRequest }, 
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error rejecting request:", error);
    return NextResponse.json({ success: false, message: "Gagal menolak request." }, { status: 500 });
  }
}