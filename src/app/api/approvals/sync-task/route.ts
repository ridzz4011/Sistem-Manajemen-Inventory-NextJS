import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, taskId } = body;

    if (!requestId || !taskId) {
      return NextResponse.json(
        { success: false, message: "Parameter requestId dan taskId wajib dikirim." },
        { status: 400 }
      );
    }

    // Simpan taskId dari VFlow ke dalam antrean yang sesuai
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { taskId: taskId },
    });

    console.log(`[Next.js] Berhasil mengamankan Task ID (${taskId}) untuk request: ${requestId}`);

    return NextResponse.json({ success: true, message: "Task tersinkronisasi." }, { status: 200 });
  } catch (error: any) {
    console.error("Error syncing task:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}