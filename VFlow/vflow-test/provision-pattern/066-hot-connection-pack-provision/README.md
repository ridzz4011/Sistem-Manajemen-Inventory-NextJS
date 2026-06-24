# 066 Hot Connection Pack Provision

Contoh ini untuk menjelaskan provision connection upstream tanpa restart VFlow.
Fokusnya bukan membuat route webhook, tetapi membuat koneksi database/NATS yang
bisa dipakai workflow setelah admin memasang connection pack.

## Gambaran Cepat

Ada dua file yang sengaja dipisah:

| File | Isi | Diinstall oleh |
|---|---|---|
| `pack.yaml` | Definisi koneksi upstream: PostgreSQL `primary` dan NATS `events`. | `POST /api/admin/pack/install` |
| `workflow.yaml` | Alur webhook order: normalisasi payload, insert ke PostgreSQL, publish event ke NATS. | `POST /api/admin/workflow/upload` |

Urutan yang benar di runtime SQA:

1. Pembimbing menyiapkan runtime VFlow di `https://sqavflow.vastar.id`.
2. Admin install `pack.yaml` melalui endpoint pack install.
3. Admin upload `workflow.yaml` melalui endpoint workflow upload.
4. Client POST order ke `/examples/hot-pack/orders`.
5. Workflow memakai `pack://examples/hot-connection-pack/primary` untuk database dan `pack://examples/hot-connection-pack/events` untuk NATS.

## Istilah Penting

`upstream` di contoh ini berarti service luar yang dipanggil oleh connector
VFlow, misalnya PostgreSQL atau NATS. Webhook bukan upstream dari sisi VFlow;
webhook adalah trigger masuk dari client ke VFlow.

`connection pack` hanya menyimpan koneksi stateful yang perlu registry, pool,
secret, dan guardrail. HTTP outbound biasa tidak perlu dimasukkan ke connection
pack. Untuk HTTP, workflow tetap memakai `connector_ref: http` atau
`connector_ref: vastar.http` dengan URL per call.

## File Yang Dibaca Anak Magang

Mulai dari sini:

1. Buka `pack.yaml`.
   Lihat dua koneksi:
   - `primary`: PostgreSQL
   - `events`: NATS

2. Buka `workflow.yaml`.
   Cari `activity_type: Connector`.
   Di situ terlihat connector keluar:
   - `write_order` memakai PostgreSQL
   - `publish_order_event` memakai NATS

3. Buka `install-request.encrypted.example.json`.
   Ini bentuk payload admin API. DSN database dan NATS tidak dikirim plaintext,
   tetapi lewat `encrypted_secrets`.

## Runtime SQA

Untuk client/admin test, set:

```bash
export VFLOW_BASE_URL="https://sqavflow.vastar.id"
export VFLOW_ADMIN_KEY='<admin-key>'
export VFLOW_PACK_SECRET_KEY_B64='<base64 32-byte AES-256-GCM key>'
```

Catatan penting:

- Untuk database lokal anak magang, DSN VFlow harus memakai tunnel Vastar,
  misalnya `db-tunnel.vastar.id:15433`, bukan `localhost`.
- `VFLOW_PACK_ALLOWED_UPSTREAMS` hanya wajib jika operator mengaktifkan strict
  mode `VFLOW_PACK_REQUIRE_UPSTREAM_ALLOWLIST=1`.
- `localhost`, `127.0.0.1`, loopback, metadata host, private RFC1918, dan DNS
  yang resolve ke alamat lokal/private tetap ditolak untuk connection pack DB/NATS.
- Loopback hanya cocok untuk HTTP self-call antar workflow di VFlow server yang
  sama, bukan untuk upstream database atau NATS.
- `VFLOW_PACK_SECRET_KEY_B64` dipakai untuk decrypt field `encrypted_secrets`.
- `pack.yaml` boleh memakai `env://HOT_PACK_POSTGRES_URL`, tetapi nilai itu datang dari payload install, bukan harus diset sebagai env server.

Tunnel database SQA:

| Kelompok | DSN host:port |
|---|---|
| Kelompok 1 | `db-tunnel.vastar.id:15431` |
| Kelompok 2 | `db-tunnel.vastar.id:15432` |
| Kelompok 3 | `db-tunnel.vastar.id:15433` |

## Step 1: Install Connection Pack

Ganti placeholder ciphertext di `install-request.encrypted.example.json`, lalu:

```bash
curl -sS -X POST "${VFLOW_BASE_URL:-https://sqavflow.vastar.id}/api/admin/pack/install" \
  -H "x-api-key: ${VFLOW_ADMIN_KEY}" \
  -H "content-type: application/json" \
  --data-binary @provision-pattern/066-hot-connection-pack-provision/install-request.encrypted.example.json
```

Expected response:

```json
{
  "installed": "examples/hot-connection-pack",
  "version": "0.1.0",
  "tenant": "_default",
  "replace": true,
  "connections": [
    { "name": "primary", "kind": "postgres" },
    { "name": "events", "kind": "nats" }
  ]
}
```

Kalau gagal, cek tiga hal ini dulu:

- `VFLOW_ADMIN_KEY` benar.
- Runtime SQA sudah mengaktifkan tier/hot pack install.
- Jika strict mode aktif, host/port DSN ada di `VFLOW_PACK_ALLOWED_UPSTREAMS`.
- `encrypted_secrets` bisa didecrypt dengan `VFLOW_PACK_SECRET_KEY_B64`.

## Step 2: Upload Workflow

Connection pack tidak otomatis upload workflow. Upload workflow tetap lewat API
workflow normal:

```bash
curl -sS -X POST "${VFLOW_BASE_URL:-https://sqavflow.vastar.id}/api/admin/workflow/upload" \
  -H "x-api-key: ${VFLOW_ADMIN_KEY}" \
  -H "x-vflow-workflow-id: hot-connection-pack-provision" \
  -H "content-type: application/yaml" \
  --data-binary @provision-pattern/066-hot-connection-pack-provision/workflow.yaml
```

Tunggu sekitar 1 detik setelah upload agar `WorkflowRouter` memasang route
eksekusi. Admin registry bisa lebih dulu terlihat sebelum route eksekusi siap.

## Step 3: Trigger Workflow

```bash
curl -sS -X POST "${VFLOW_BASE_URL:-https://sqavflow.vastar.id}/examples/hot-pack/orders" \
  -H "content-type: application/json" \
  --data '{
    "order_id": "ord-001",
    "customer_id": "cust-001",
    "amount_cents": 125000,
    "currency": "IDR"
  }'
```

Expected response berisi status accepted, hasil insert DB, dan hasil publish
NATS:

```json
{
  "status": "accepted",
  "order_id": "ord-001",
  "db": { "rows_affected": 1, "operation": "raw_query" },
  "event": { "...": "..." }
}
```

`operation: raw_query` adalah nama operation connector SQLx. Query di YAML tetap
ditulis dengan `language: vil_query`, lalu compiler menghasilkan SQL
parameterized untuk runtime.

## Schema PostgreSQL

Contoh ini menganggap tabel sudah ada. Migration bukan tugas workflow dan bukan
tugas hot connection install.

```sql
CREATE TABLE example_orders (
  order_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL
);
```

## Connector Ref

Format:

```yaml
connector_ref: "pack://<pack-id>/<connection-name>"
```

Di contoh ini:

```yaml
connector_ref: "pack://examples/hot-connection-pack/primary"
connector_ref: "pack://examples/hot-connection-pack/events"
```

VFlow memakai slash terakhir sebagai pemisah connection name. Jadi pack id-nya
adalah `examples/hot-connection-pack`, dan connection name-nya `primary` atau
`events`.
