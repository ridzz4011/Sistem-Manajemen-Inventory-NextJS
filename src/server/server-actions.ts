"use server";

import { cookies } from "next/headers";
import { prisma } from "@/server/db/prisma";
import { revalidatePath } from "next/cache";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function getValueFromCookie(key: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(key)?.value;
}

export async function setValueToCookie(
  key: string,
  value: string,
  options: { path?: string; maxAge?: number } = {},
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(key, value, {
    path: options.path ?? "/",
    maxAge: options.maxAge ?? 60 * 60 * 24 * 7, // default: 7 days
  });
}

export async function getPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): Promise<T> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(key);
  const value = cookie ? cookie.value.trim() : undefined;
  return allowed.includes(value as T) ? (value as T) : fallback;
}

// export async function createItemAction(data: any) {
//   try {
//     // 1. Cek duplikasi SKU di database lokal (Prisma) terlebih dahulu!
//     const existingItem = await prisma.item.findUnique({
//       where: { sku: data.item_sku, name: data.item_name }, // Pastikan ini sesuai dengan key dari frontend Anda
//     });

//     // Kembalikan error khusus jika SKU duplikat
//     if (existingItem?.sku) {
//       if (existingItem?.name) {
//         return {
//           success: false,
//           errorType: "DUPLICATE_NAME",
//           message:"Nama ini sudah terdaftar di sistem."
//         };
//       }
//       return { 
//         success: false, 
//         errorType: "DUPLICATE_SKU", 
//         message: "SKU ini sudah terdaftar di sistem." 
//       };
//     }

//     const vflowServer = process.env.VFLOW_BASE_URL;
//     if (!vflowServer) throw new Error("VFlow URL belum dikonfigurasi");

//     // 2. Tembak Webhook VFlow
//     const response = await fetch(`${vflowServer}/webhook/kelompok2/inventory/item/create`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });

//     if (!response.ok) throw new Error("Gagal mengirim ke VFlow");

//     // 3. Refresh state halaman di latar belakang
//     revalidatePath('/dashboard/products'); 

//     // 4. Kembalikan respons sukses khusus
//     return { 
//       success: true, 
//       message: "Barang berhasil dikirim. Menunggu persetujuan Manajer!" 
//     };

//   } catch (error) {
//     console.error(error);
//     return { success: false, message: "Terjadi kesalahan sistem." };
//   }
// }

export async function submitApprovalRequestAction(type: string, payload: any, userName: string) {
  try {
    const response = await fetch(`${APP_URL}/api/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({
        type: type, // "NEW_ITEM", "NEW_VENDOR", dll.
        requestedBy: userName,
        payload: payload,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Refresh tabel approvals agar antrean baru langsung muncul
      revalidatePath("/dashboard/approvals");
      revalidatePath("/dashboard/suppliers");
    }

    return result;
  } catch (error) {
    console.error("Action error:", error);
    return { success: false, message: "Gagal mengirim request ke server." };
  }
}

export async function approveRequestAction(requestId: string) {
  try {
    const response = await fetch(`${APP_URL}/api/approvals/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ requestId }),
    });

    const result = await response.json();

    if (result.success) {
      revalidatePath("/dashboard/approvals");
      revalidatePath("/dashboard/suppliers");
    }

    return result;
  } catch (error) {
    console.error("Approve Action error:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat memproses persetujuan." };
  }
}

export async function rejectRequestAction(requestId: string, notes: string = "Ditolak oleh Manajer") {
  try {
    const response = await fetch(`${APP_URL}/api/approvals/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ requestId, notes }),
    });

    const result = await response.json();

    if (result.success) {
      revalidatePath("/dashboard/approvals");
    }

    return result;
  } catch (error) {
    console.error("Reject Action error:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat menolak request." };
  }
}