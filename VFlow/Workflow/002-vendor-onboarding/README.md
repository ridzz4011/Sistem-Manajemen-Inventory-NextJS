# Vendor Onboarding Workflow

## Deskripsi

Workflow onboarding vendor baru dengan proses validasi dan approval.

## Business Process

1. Admin mendaftarkan vendor baru.
2. Sistem mengevaluasi status vendor menggunakan VRule.
3. Vendor blacklist otomatis ditolak.
4. Vendor valid masuk ke proses approval Manager Pembelian.
5. Manager melakukan approve atau reject.

## VRule

- BLACKLIST_VENDOR
- VALID_VENDOR

## Actors

- Admin Gudang
- Manager Pembelian
