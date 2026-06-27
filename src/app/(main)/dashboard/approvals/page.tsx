// src/app/(main)/dashboard/approvals/page.tsx
import { prisma } from "@/server/db/prisma";
import { Approvals } from "./_components/approvals";

// Memastikan Next.js selalu mengambil data terbaru dari database (tidak di-cache)
export const revalidate = 0;

export default async function Page() {
  // Ambil semua request yang statusnya masih PENDING
  const approvalRequests = await prisma.approvalRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: {
      status: "PENDING",
    },
  });

  // Kirim data riil database ke komponen client
  return <Approvals approvals={approvalRequests} />;
}