# Item Approval Workflow

## Deskripsi

Workflow persetujuan master data barang berdasarkan nilai barang.

## Business Process

1. Admin Gudang membuat barang baru.
2. Sistem mengevaluasi harga barang menggunakan VRule.
3. Barang bernilai lebih dari Rp10.000.000 masuk ke proses approval Manager Operasional.
4. Barang bernilai normal langsung disetujui.

## VRule

- HIGH_VALUE_ITEM
- NORMAL_ITEM

## Actors

- Admin Gudang
- Manager Operasional
