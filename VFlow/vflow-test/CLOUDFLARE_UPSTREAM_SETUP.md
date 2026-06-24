# Catatan Tunnel Upstream Lokal

Dokumen Cloudflare Tunnel lama sengaja dihapus dari runbook ini.

Untuk kebutuhan SQA sekarang, jika workflow VFlow perlu mengakses service lokal
anak magang, gunakan tunnel Vastar yang sudah disiapkan pembimbing. Anak magang
tidak perlu membuat Cloudflare Tunnel sendiri dan tidak perlu SSH ke server
VFlow.

## Database Lokal

Untuk PostgreSQL/MySQL lokal, jalankan rathole client yang diberikan pembimbing
di laptop masing-masing kelompok.

| Kelompok | Public tunnel untuk DSN VFlow | File client |
|---|---|---|
| Kelompok 1 | `db-tunnel.vastar.id:15431` | `kel1-client.toml` |
| Kelompok 2 | `db-tunnel.vastar.id:15432` | `kel2-client.toml` |
| Kelompok 3 | `db-tunnel.vastar.id:15433` | `kel3-client.toml` |

Contoh Kelompok 3:

```bash
rathole kel3-client.toml
```

DSN yang dikirim ke connection pack VFlow:

```bash
export KELOMPOK3_DATABASE_URL="postgresql://USER:PASS@db-tunnel.vastar.id:15433/DB_NAME"
```

`127.0.0.1:5432` hanya dipakai di file rathole client untuk menunjuk PostgreSQL
lokal di laptop. Jangan gunakan `localhost` atau `127.0.0.1` sebagai upstream
database di `pack.yaml`/payload VFlow.

## HTTP Lokal

Jika workflow perlu call HTTP ke service lokal anak magang, expose service itu
melalui endpoint publik yang disepakati pembimbing. Untuk HTTP outbound, workflow
tidak perlu connection pack; gunakan connector HTTP biasa dengan URL publik.

## Runtime VFlow

Runtime SQA:

```bash
export VFLOW_BASE_URL="https://sqavflow.vastar.id"
```

Admin API membutuhkan `VFLOW_ADMIN_KEY` dari pembimbing.
