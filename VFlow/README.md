# VFlow SQA Client

Repo ini dipakai sebagai **client-side toolkit** untuk mencoba provision,
unprovision, rule compile, dan contoh workflow VFlow di runtime SQA:

```bash
export VFLOW_BASE_URL="https://sqavflow.vastar.id"
```

Tidak ada instruksi setup server di repo ini. Anak magang tidak perlu SSH ke
server VFlow, tidak perlu akses Docker image/runtime, dan tidak perlu mengurus
NPM/pfSense.

## Isi Repo

- `scripts/vflow-admin.js` - script utama untuk operasi admin VFlow.
- `scripts/vflow-admin.sh` - runner Linux/macOS.
- `scripts/vflow-admin.ps1` - runner Windows PowerShell.
- `scripts/vflow-admin.bat` - runner Windows CMD.
- `provision-pattern/` - kumpulan contoh `workflow.yaml`.
- `vflow-authoring-guide/`, `vrule-authoring-guide/` - bahan belajar.
- `bin/` - binary client pendukung.

## Endpoint

| Kebutuhan | Nilai |
|---|---|
| VFlow base URL | `https://sqavflow.vastar.id` |
| Admin API | `https://sqavflow.vastar.id/api/admin/...` |
| Dashboard | `https://sqavflow.vastar.id/_vil/dashboard/` |
| Webhook | `https://sqavflow.vastar.id/<path-webhook>` |
| Logstream | `https://sqavflow.vastar.id/logs/vflow-server?...` |

Admin API membutuhkan `VFLOW_ADMIN_KEY` dari pembimbing.

```bash
cd /home/abraham/magang/aws-test-vflow

export VFLOW_BASE_URL="https://sqavflow.vastar.id"
export VFLOW_ADMIN_KEY="<dari-pembimbing>"
export VFLOW_TENANT="_default"
```

Windows PowerShell:

```powershell
Set-Location "C:\path\to\aws-test-vflow"
$env:VFLOW_BASE_URL = "https://sqavflow.vastar.id"
$env:VFLOW_ADMIN_KEY = "<dari-pembimbing>"
$env:VFLOW_TENANT = "_default"
```

## Verifikasi Koneksi

```bash
./scripts/vflow-admin.sh status
```

Atau langsung:

```bash
curl -sS "$VFLOW_BASE_URL/api/admin/health"
curl -k -I "$VFLOW_BASE_URL/_vil/dashboard/"
```

## Workflow

Linux/macOS:

```bash
./scripts/vflow-admin.sh workflows list
./scripts/vflow-admin.sh workflows provision ./provision-pattern/013-grpc-trigger/workflow.yaml
./scripts/vflow-admin.sh workflows list
```

Windows PowerShell:

```powershell
scripts\vflow-admin.ps1 workflows list
scripts\vflow-admin.ps1 workflows provision .\provision-pattern\013-grpc-trigger\workflow.yaml
scripts\vflow-admin.ps1 workflows list
```

Windows CMD:

```bat
scripts\vflow-admin.bat workflows list
scripts\vflow-admin.bat workflows provision provision-pattern\013-grpc-trigger\workflow.yaml
scripts\vflow-admin.bat workflows list
```

`unprovision` memakai route console internal `/_vflow/...`; gunakan hanya jika
route itu dibuka oleh pembimbing. Untuk testing SQA harian, pakai workflow ID
yang berbeda atau upload ulang workflow yang sama.

## Rule

```bash
./scripts/vflow-admin.sh rules list
./scripts/vflow-admin.sh rules remove rule_set_id_yang_sudah_ada
./scripts/vflow-admin.sh rules list
```

Compile VRule pack:

```bash
jq -n \
  --rawfile r ./provision-pattern/047-fastpath-vrule-risk-scoring/rules/fastpath_risk_v1.vdicl \
  --rawfile s ./provision-pattern/047-fastpath-vrule-risk-scoring/schemas/fastpath_risk_fact_v1.yaml \
  '{rule_set_id:"fastpath_risk_v1", rules_yaml:$r, schema_yaml:$s}' \
  | curl -sS -X POST \
      -H "x-api-key: ${VFLOW_ADMIN_KEY}" \
      -H 'Content-Type: application/json' \
      -d @- \
      "$VFLOW_BASE_URL/api/admin/vrule/compile"
```

## Connection Pack dan Tunnel DB

Untuk upstream database lokal milik kelompok, jangan pakai `localhost` atau
`127.0.0.1` di connection pack VFlow. Dari sisi VFlow, alamat itu menunjuk ke
node runtime VFlow, bukan laptop anak magang.

Gunakan tunnel Vastar:

| Kelompok | Host:port untuk DSN VFlow | File client tunnel |
|---|---|---|
| Kelompok 1 | `db-tunnel.vastar.id:15431` | `kel1-client.toml` |
| Kelompok 2 | `db-tunnel.vastar.id:15432` | `kel2-client.toml` |
| Kelompok 3 | `db-tunnel.vastar.id:15433` | `kel3-client.toml` |

Di laptop anak magang:

```bash
rathole kel3-client.toml
```

DSN yang dipakai untuk provision connection pack:

```bash
export KELOMPOK3_DATABASE_URL="postgresql://USER:PASS@db-tunnel.vastar.id:15433/DB_NAME"
```

`127.0.0.1:5432` hanya boleh muncul di file rathole client karena itu menunjuk
ke PostgreSQL lokal di laptop anak magang. Jangan memasukkan alamat loopback itu
ke `pack.yaml` atau payload install VFlow.

Lihat contoh hot connection pack:

```bash
provision-pattern/066-hot-connection-pack-provision/
```

## Logstream

Minta `LOGSTREAM_TOKEN` ke pembimbing, lalu:

```bash
curl -N \
  -H "Authorization: Bearer $LOGSTREAM_TOKEN" \
  "$VFLOW_BASE_URL/logs/vflow-server?tail=100&follow=true&timestamps=true"
```

## Troubleshooting Cepat

- `401 unauthorized`: `VFLOW_ADMIN_KEY` belum diset atau salah.
- `404` saat trigger webhook: path webhook belum sesuai atau workflow belum aktif.
- Connector DB gagal: tunnel rathole belum jalan, DSN salah, atau schema DB belum dibuat.
- Jangan upload secret asli ke issue/chat publik. Jika bocor, minta pembimbing rotasi token.
