import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ApprovalStatus } from "@/generated/prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Jika VFlow mengirimkan taskId saat HumanTask dibuat, Anda tangkap di sini.
    // Jika VFlow Anda dirancang untuk menerima korelasi ID, gunakan requestId.
    const { requestId, taskId } = body; 

    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== ApprovalStatus.PENDING) {
        return NextResponse.json({ success: false, message: "Request tidak valid." }, { status: 400 });
    }

    // 1. Ubah status request di tabel transisi menjadi APPROVED
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: ApprovalStatus.APPROVED },
    });

    // 2. Beri tahu VFlow bahwa HumanTask sudah disetujui (Resume Workflow)
    // Asumsi endpoint VFlow untuk menyelesaikan task: /api/v1/tasks/{taskId}/complete
    // Sesuaikan endpoint ini dengan cara kerja HumanTask di VFlow Anda.
    const vflowTaskEndpoint = request.taskId 
      ? `/api/v1/tasks/${request.taskId}/complete`
      : `/webhook/kelompok2/inventory/create`; // Alternatif jika pakai webhook balasan

    const vflowUrl = `${process.env.VFLOW_BASE_URL}${vflowTaskEndpoint}`;

    try {
      await fetch(vflowUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.API_SECRET_KEY}`,
        },
        body: JSON.stringify({
          decision: "ACCEPT", // Enum standar penyelesaian HumanTask
          requestId: requestId,
        }),
      });
      console.log(`[Next.js] Berhasil mengirim sinyal Approve ke VFlow untuk request: ${requestId}`);
    } catch (vflowError) {
      console.error(`[Next.js] Gagal menghubungi VFlow Task API:`, vflowError);
      // Anda bisa memutuskan untuk me-return error di sini jika sinkronisasi VFlow wajib sukses
    }

    return NextResponse.json(
      { success: true, message: "Request berhasil disetujui dan diteruskan ke VFlow." }, 
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error approving request:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}