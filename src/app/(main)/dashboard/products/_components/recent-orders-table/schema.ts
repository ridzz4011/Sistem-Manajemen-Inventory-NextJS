export const transactionFilters = ["ALL", "DRAFT", "PENDING", "APPROVED", "DISPUTE", "COMPLETED", "REJECTED"] as const;

export type TransactionFilter = (typeof transactionFilters)[number];

export type TransactionRow = {
  id: string;
  referenceNo: string;       // Nomor PO / SO
  date: string;              // Tanggal transaksi (createdAt)
  partnerName: string;       // Nama dari relasi Partner (bisa Vendor / Klien)
  type: "STOCK_IN" | "STOCK_OUT" | "STOCK_OPNAME"; 
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "DISPUTE"; // Status dari transaksi
  totalItems: number;        // Jumlah total barang dari TransactionDetail
  notes?: string | null;
};
