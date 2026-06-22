# Stock Out Workflow

## Deskripsi

Workflow pengeluaran barang dengan validasi stok dan approval Kepala Gudang.

## Business Process

1. Admin Gudang submit permintaan Stock Out.
2. VRule memvalidasi ketersediaan stok.
3. Jika stok tidak cukup maka transaksi ditolak.
4. Jika stok cukup maka dibuat Human Task untuk Kepala Gudang.
5. Kepala Gudang melakukan approval.
6. Workflow memanggil backend Inventory API.
7. Backend mengurangi Inventory Balance.
8. Workflow selesai.

## VRule

- STOCK_AVAILABLE
- STOCK_NOT_AVAILABLE

## Actors

- Admin Gudang
- Kepala Gudang

## Upstream Service

- Inventory Management NextJS API
