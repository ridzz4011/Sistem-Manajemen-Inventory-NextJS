# Stock Opname Workflow

## Deskripsi

Workflow stock opname dengan klasifikasi otomatis berdasarkan selisih stok menggunakan Compute Activity dan VRule.

## Business Process

1. Petugas melakukan stock opname.
2. Compute Activity menghitung selisih stok.
3. VRule mengklasifikasikan hasil opname.
4. Selisih kecil diproses oleh Kepala Gudang.
5. Selisih besar harus mendapat persetujuan Direktur.

## VRule

- OPNAME_CLASSIFICATION
- OPNAME_NORMAL

## Compute

- Calculate Stock Difference

## Actors

- Petugas Gudang
- Kepala Gudang
- Direktur
