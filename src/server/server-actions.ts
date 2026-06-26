"use server";

import { cookies } from "next/headers";
import { prisma } from "@/server/db/prisma";
import { revalidatePath } from "next/cache";

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

export async function createItemAction(data: any) {
  try {
    // 1. Cek duplikasi SKU di database lokal (Prisma) terlebih dahulu!
    const existingItem = await prisma.item.findUnique({
      where: { sku: data.item_sku, name: data.item_name }, // Pastikan ini sesuai dengan key dari frontend Anda
    });

    // Kembalikan error khusus jika SKU duplikat
    if (existingItem?.sku) {
      if (existingItem?.name) {
        return {
          success: false,
          errorType: "DUPLICATE_NAME",
          message:"Nama ini sudah terdaftar di sistem."
        };
      }
      return { 
        success: false, 
        errorType: "DUPLICATE_SKU", 
        message: "SKU ini sudah terdaftar di sistem." 
      };
    }

    const vflowServer = process.env.VFLOW_BASE_URL;
    if (!vflowServer) throw new Error("VFlow URL belum dikonfigurasi");

    // 2. Tembak Webhook VFlow
    const response = await fetch(`${vflowServer}/webhook/kelompok2/inventory/item/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Gagal mengirim ke VFlow");

    // 3. Refresh state halaman di latar belakang
    revalidatePath('/dashboard/products'); 

    // 4. Kembalikan respons sukses khusus
    return { 
      success: true, 
      message: "Barang berhasil dikirim. Menunggu persetujuan Manajer!" 
    };

  } catch (error) {
    console.error(error);
    return { success: false, message: "Terjadi kesalahan sistem." };
  }
}