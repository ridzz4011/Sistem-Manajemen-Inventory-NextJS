# VWFD YAML — Pack, Tier, Dispatch Markers


This file covers the three packaging + dispatch concerns that surround a workflow YAML:

1. **`pack.yaml`** — bundles connections + workflows for deployment (the user-authored deploy unit).
2. **`tier.yaml`** — operator/admin gating of capabilities, connectors, triggers (via TierSpec).
3. **Dispatch markers** — how `WasmFunction` / `NativeCode` / `Sidecar` activities find their implementations.

> **Adjacent but separate:** a newer IaC resource model (`kind: Tenant | FleetHost | Tier | Pack | Snapshot` with `apiVersion: vflow.cloud/v1` + `metadata` + `spec`) targets the same domain from an admin perspective — see [`08-iac-resources.md`](./08-iac-resources.md). In short:
> - **pack.yaml** = user-authored bundle manifest (connections + workflow file list). Consumed by pack factory at provision.
> - **Pack IaC resource** (`kind: Pack`) = admin-authored declaration that a pack is installed/available in the control plane. Consumed by PackController. Typically *references* a pack.yaml by digest.
>
> Use pack.yaml to ship a workflow bundle; use a Pack resource via `vflowctl apply -f` to register that bundle into the control plane.

---

## `pack.yaml` — deployable bundle

A pack declares a set of pre-resolved connection instances + the workflow files that use them. It's the unit of deployment for vflow.

```yaml
pack:
  id: examples/hello-db       # string; usually <org>/<name>
  version: 0.1.0              # semver
  description: "Example pack — two SQLite connections + a webhook workflow."

connections:
  - name: primary
    kind: sqlite
    path: ":memory:"
    pool:
      max_size: 2

  - name: audit
    kind: sqlite
    path: ":memory:"

workflows:
  - bootstrap.yaml            # relative paths to workflow YAML files
  - write_hello.yaml
```

### Schema

**`pack` block** (metadata):

| Field | Type | Required | Semantics |
|---|---|---|---|
| `id` | string | yes | Pack identifier. Convention: `<org_or_scope>/<name>`. |
| `version` | string | yes | Semver. |
| `description` | string | no | Free text. |

**`connections` block** (array):

Each entry is one connection instance that workflows in this pack can reference via `connector_ref: "pack://<pack.id>/<name>"`.

| Field | Type | Required | Semantics |
|---|---|---|---|
| `name` | string | yes | Name used in `pack://` URIs. |
| `kind` | string | yes | Connector KIND — see 03-connectors.md. |
| *(connector-specific fields)* | various | — | Matches the connector's config shape. E.g. `path` for sqlite, `url` for postgres, `urls` for nats. |
| `pool` | PoolConfig | no | `{ max_size, min_idle, acquire_timeout_ms, idle_timeout_ms }` — see 03-connectors.md. |

**`workflows` block** (array of relative paths):

List of YAML files (relative to the pack root) to bundle. Each file is a full VWFD workflow — see 01-schema.md.

### Referencing pack connections from a workflow

```yaml
# Inside a workflow YAML file listed under `workflows:` in pack.yaml:
- id: insert
  activity_type: Connector
  connector_config:
    connector_ref: "pack://examples/hello-db/primary"
    operation: raw_query
```

`pack://` uses the final `/` as the connection separator. Pack ids may contain `/`, so `pack://apps/acisku/primary` means pack id `apps/acisku`, connection `primary`.

### Connection field reference by KIND

| KIND | Required fields | Optional fields |
|---|---|---|
| `sqlite` | `path` (e.g. `:memory:` or `/var/lib/foo.db`) | `pool.*` |
| `postgres` / `mysql` / `yugabyte` | `url` (DSN or secret ref `env://VAR` \| `secret://path`) | `pool.*` |
| `redis` | `url` | `pool.*` |
| `mongo` | `uri` | `db` (default `default`), `pool.*` |
| `cassandra` / `scylla` | `contact_points` (list), `keyspace` | `pool_id` (default 0). Use `cassandra` or `scylla` for ScyllaDB — same connector. |
| `clickhouse` | `url` (default `http://localhost:8123`) | `database` (default `default`), `username`, `password` |
| `elastic` | `url` | — |
| `neo4j` | `url` | `user` (default `neo4j`), `pass` |
| `dynamodb` | `region` | — |
| `timeseries` | `url`, `org`, `bucket`, `token` | — |
| `tikv` | `pd_endpoints` | — |
| `etcd` | `endpoints` | — |
| `nats` | `url` or `urls` | — |
| `kafka` | `brokers` | — |
| `mqtt` | `url`, `topic` | — |
| `rabbitmq` | `url` | `exchange` (default `vflow`), `queue` (default `vflow`) |
| `pulsar` | `url` | `tenant`, `namespace`, `topic` |
| `pubsub` | `project` | `topic`, `subscription` |
| `sqs` | `region` | `queue_url` |
| `http` | (none — rarely declared in pack; usually per-call config) | — |
| `s3` | `endpoint`, `access_key`, `secret_key`, `bucket` | `region` (default `us-east-1`), `path_style` |
| `gcs` | `bucket` | — |
| `azure` | `account`, `access_key` | `container` (default `default`) |
| `sidecar-connector` | `target` (name of pre-registered sidecar) | — |

See 03-connectors.md for per-connector env-variable fallbacks.

### Runtime hot connection pack install

Admins can install or replace pack-scoped upstream connections without restarting the vflow server:

```http
POST /api/admin/pack/install
X-API-Key: <admin-api-key>
Content-Type: application/json
```

```json
{
  "pack_yaml": "pack:\n  id: apps/acisku\n  version: 0.1.0\nconnections:\n  - name: primary\n    kind: postgres\n    url: env://ACISKU_DATABASE_URL\n  - name: events\n    kind: nats\n    urls: env://ACISKU_NATS_URL\nworkflows: []\n",
  "encrypted_secrets": {
    "ACISKU_DATABASE_URL": {
      "alg": "A256GCM",
      "nonce_b64": "<12-byte nonce, base64>",
      "ciphertext_b64": "<AES-256-GCM ciphertext, base64>"
    },
    "ACISKU_NATS_URL": {
      "alg": "A256GCM",
      "nonce_b64": "<12-byte nonce, base64>",
      "ciphertext_b64": "<AES-256-GCM ciphertext, base64>"
    }
  },
  "replace": true,
  "tenant": "acisku",
  "workflow_ids": ["order-create"]
}
```

This endpoint provisions the connection registry only. Upload or activate workflow YAML through the workflow admin APIs separately. `workflow_ids` is optional bookkeeping for pack cleanup; it does not upload those workflows.

Runtime requirements and guardrails:

| Setting / rule | Semantics |
|---|---|
| `VFLOW_TIER_FILE` | Required. Hot install validates the pack against the active tier before building connectors. If pack boot is disabled, the endpoint returns `503`. |
| `VFLOW_PACK_ALLOWED_UPSTREAMS` | Optional strict-mode allow-list for hot upstream DSNs. Used only when `VFLOW_PACK_REQUIRE_UPSTREAM_ALLOWLIST=1`. Comma-separated `host`, `host:port`, `[ipv6]:port`, or URL entries. Example: `db.example.com:5432,nats.example.com:4222`. |
| `VFLOW_PACK_REQUIRE_UPSTREAM_ALLOWLIST=1` | Optional operator hardening switch. When enabled, every hot connection upstream must match `VFLOW_PACK_ALLOWED_UPSTREAMS`. By default, public-routable upstreams are allowed without a restart-time allow-list. |
| `VFLOW_PACK_SECRET_KEY_B64` | Required when `encrypted_secrets` is used. Base64-encoded 32-byte AES-256-GCM key. |
| `VFLOW_PACK_ALLOW_PLAINTEXT_SECRETS=1` | Optional lab-only escape hatch. Without it, `secrets` plaintext values are rejected; use `encrypted_secrets`. |
| Accepted hot kinds | `postgres`, `mysql`, `yugabyte`, `nats`. |
| Rejected hot kinds | `sqlite` is local state and is rejected. `http` / `vastar.http` should use the built-in HTTP connector with per-call URL config, not connection registry provisioning. Other kinds are not accepted by this hot endpoint unless the runtime guard is extended. |
| Upstream safety | Public-routable upstreams are accepted by default. Application databases and brokers must live outside the vflow runtime node, or be exposed to it through a public TCP tunnel/proxy. `localhost`, `.localhost`, private RFC1918 ranges, shared carrier NAT ranges, link-local, loopback, unspecified, multicast, unique-local IPv6, and DNS names resolving to those address classes are rejected. Loopback is only appropriate for explicit HTTP self-calls to another workflow on the same VFlow server; it is not valid for connection-pack DB/NATS upstreams. |

Secret references in `pack.yaml` can use either `env://NAME` or `secret://NAME`. For hot install, those names are resolved from the submitted encrypted/plaintext secret map, not from the server process environment. That lets an admin provision `url: env://ACISKU_DATABASE_URL` without adding a new process env var and restarting vflow.

`replace` defaults to `true`. Replacement is atomic at the pack slot level: vflow builds all new connectors first, then swaps the live pack. If connector construction or policy validation fails, the old pack remains active.

Workflow activities then call the provisioned upstream through the pack reference:

```yaml
- id: save_order
  activity_type: Connector
  connector_config:
    connector_ref: "pack://apps/acisku/primary"
    operation: raw_query
```

### Complete example — enterprise-sidecar pack


```yaml
pack:
  id: examples/enterprise-sidecar
  version: 0.1.0
  description: >
    Demonstrates pack-level routing to a pre-spawned sidecar via
    `kind: sidecar-connector`. Requires a sidecar named
    `acme-fraud-scorer` to be live in the host's SidecarRegistry
    before pack install.

connections:
  - name: fraud_api
    kind: sidecar-connector
    target: acme-fraud-scorer        # must match a registered sidecar

  # Dual-role example: same sidecar, different connection name.
  - name: fraud_api_alt
    kind: sidecar-connector
    target: acme-fraud-scorer

workflows:
  - score_transaction.yaml
```

A workflow inside this pack references the connection via `pack://examples/enterprise-sidecar/fraud_api`.

### Example references (runtime pack.yaml files)

| Pack | Path | Shows |
|---|---|---|
| `hello-db` | `examples-vflow/packs/hello-db/pack.yaml` | Minimal single-connection pack (sqlite `:memory:`). |
| `multi-conn` | `examples-vflow/packs/multi-conn/pack.yaml` | Two named connections + two workflows. |
| `enterprise-sidecar` | `examples-vflow/packs/enterprise-sidecar/pack.yaml` | `kind: sidecar-connector` + dual-role routing. |

---

## `tier.yaml` — capability + allow-list gating

A tier spec is the admin-level policy governing what a tenant can use. It gates connectors, triggers, sidecars, WASM modules, and compute roles.


```yaml
version: 1
kind: TierSpec
metadata:
  id: standard
  name: "Standard tier (SMB)"
  version: "1.0"
  description: "SMB-facing tier. Full connector set, moderate compute."

capabilities:
  sidecar:   { roles: [compute, connector] }
  wasm:      { roles: [compute] }
  native:    { roles: [] }                 # disabled for this tier
  multi_pack: true
  hot_pack_install: true
  workflow_versioning: true

connectors:
  database:
    allow: [sqlite, postgres, mysql, yugabyte, redis, mongo, cassandra, clickhouse]
  mq:
    allow: [nats, nats_js, nats_kv, kafka, mqtt, rabbitmq]
  protocol:
    allow: [http, grpc, websocket, sftp]
  storage:
    allow: [s3, gcs, azure]

triggers:
  allow: [webhook, cron, nats, nats_js, nats_kv, kafka, mqtt, s3_event, grpc_server, fs]

secrets:
  backends:
    allow: [env, vault, aws_secrets_manager]

sidecars:
  allow:
    - name: fraud_scorer
      roles: [compute]
      artifact:
        kind: binary
        digest: "sha256:…"
        size_mb: 45
        command: "python -m fraud_service"
      resources:
        rss_mb: 256
        cpu_millicores: 500

wasm:
  allow:
    - { name: currency_convert, memory_pages: 256 }

limits:
  max_payload_size_mb: 10
  max_concurrent_activities: 100

orchestrators:
  allow: [workflow_runtime]
```

### Schema (abbreviated)

| Block | Purpose |
|---|---|
| `version: 1` | Tier spec schema version. |
| `kind: TierSpec` | Marker — required. |
| `metadata` | `{ id, name, version, description }`. |
| `capabilities` | Per-role allow flags. `sidecar.roles`, `wasm.roles`, `native.roles` may be `[compute]` / `[connector]` / both. `multi_pack` / `hot_pack_install` / `workflow_versioning` as bool gates. |
| `connectors` | Allow-list per category (`database`, `mq`, `protocol`, `storage`). Only listed KINDs may appear in workflows. |
| `triggers` | Allow-list of trigger types. |
| `secrets.backends` | Allowed secret-resolver backends. |
| `sidecars.allow` | Per-sidecar registration with artifact digest + resource caps. |
| `wasm.allow` | Per-module registration with memory cap. |
| `limits` | Payload + concurrency caps. |
| `orchestrators.allow` | Allowed orchestrator implementations. |

### When a tier is enforced

- **At pack install time**: The tier compiler rejects pack.yaml that references a connector KIND outside the tier's allow-list.
- **At hot connection pack install time**: `POST /api/admin/pack/install` also validates the pack against the active tier, then rejects local/private upstreams before any connector is built. Public upstream DNS/IP targets are accepted by default; strict host allow-listing is opt-in via `VFLOW_PACK_REQUIRE_UPSTREAM_ALLOWLIST=1`.
- **At runtime**: any workflow referencing a disallowed connector/trigger fails with a tier-policy error.

### Example tier references

- `examples-vflow/tiers/standard.yaml` — SMB tier.
- `examples-vflow/tiers/starter.yaml` / `premium.yaml` / `enterprise.yaml` — other reference tiers (if present).

---

## Dispatch marker convention — `handler_lookup`

For dispatch-style activities (`WasmFunction`, `NativeCode`, `Sidecar`), the kernel routes via a single `handler_lookup` closure that resolves `"<type>.<name>"` keys. This is the pluggable boundary between VWFD activities and actual implementations.


| Activity type | Config field | Registry key | Resolves to |
|---|---|---|---|
| `WasmFunction` | `wasm_config.module_ref: my_mod` | `"wasm.my_mod"` | WASM module (loaded from .wasm file, pre-warmed pool). |
| `NativeCode` | `code_config.handler_ref: my_fn` | `"code.my_fn"` | Native Rust function registered at boot. |
| `Sidecar` | `sidecar_config.target: my_sc` | `"sidecar.my_sc"` | Sidecar process registered via `app.sidecar()` or equivalent. |

### Key implications for YAML authors

1. **No file extensions in YAML.** Don't write `.wasm` / `.native` / `.sidecar` suffixes. Just use the registered name.
2. **The name must match the registration.** If the Rust side registered `fraud_detector`, the YAML uses `handler_ref: fraud_detector`.
3. **Tier gates by name.** A tier's `sidecars.allow[].name` and `wasm.allow[].name` must include the name referenced in the workflow.

### Registration side (for reference, not YAML)

On the Rust side, handlers register into the registry at boot:

```rust
// NativeCode
code_registry.insert("fraud_detector", Box::new(fraud_detector_fn));

// WasmFunction
wasm_registry.insert("currency_convert", load_wasm("currency_convert.wasm")?);

// Sidecar
sidecar_registry.insert("fraud_scorer", spawn_sidecar(sidecar_cfg)?);
```

The VWFD YAML just references `handler_ref: fraud_detector`, `module_ref: currency_convert`, `target: fraud_scorer` — the `handler_lookup` closure maps them.

---

## VWF (provisionable) provisioning flow

For runtime-uploaded workflows (VWF, not VWFD compile-time):

```
POST /api/admin/workflow/upload
Content-Type: application/yaml
<YAML body>
```

Server auto-detects YAML via the Content-Type header. The compiler produces VWFC (binary) in memory. The `WorkflowRouter` stores the compiled VWFC + metadata. At runtime the kernel loads VWFC directly — no re-parse.

Admin-level APIs:
- `POST /api/admin/workflow/upload` — upload / replace.
- `POST /api/admin/pack/install` — hot install / replace pack-scoped database or NATS connections. Requires pack boot/tier config. Public upstreams do not require restart-time allow-list edits; strict allow-listing is optional.
- `POST /api/admin/event/fire` — inject a named event (for `EventGateway` await-mode).

---

## Tier vs Pack: responsibility split

| Concern | Pack (pack.yaml) | Tier (tier.yaml) |
|---|---|---|
| **Connection instances** | Declares them (with URL, credentials, pool). | Gates which KINDs are permitted. |
| **Workflow files** | Lists them (`workflows:` array). | (Not relevant — tier doesn't list workflows.) |
| **Sidecars** | References by name. | Registers + budgets each sidecar. |
| **WASM modules** | References by name. | Registers + caps memory. |
| **Who writes it** | Pack author / service owner. | Platform operator / admin. |
| **When applied** | Deployment time; connection-only packs can also be hot-installed via admin API. | Install-time gate + runtime policy. |

Typical flow: platform admin publishes a `tier.yaml`; a tenant authors a `pack.yaml` + workflow YAML files; tier-compiler validates pack against tier at install; runtime enforces tier. For hot connection provisioning, the admin sends a connection-only `pack.yaml` to `/api/admin/pack/install`; workflow YAML is still uploaded separately.

---

## Gotchas

- **`pack://` URI not validated at YAML parse.** If you typo the pack id or connection name, you get a runtime error when the first activity tries to resolve. Test by provisioning the pack in a dev environment.
- **Workflow upload does not create upstream connections.** A Connector activity that uses `connector_ref: "pack://..."` needs the referenced pack connection installed first, either at boot from `VFLOW_PACKS_DIR` or at runtime through `POST /api/admin/pack/install`.
- **HTTP is not a hot-provisioned connection.** For outbound HTTP, use `connector_ref: http` / `vastar.http` with the request URL in activity config. Reserve pack connection provisioning for stateful upstreams such as database and NATS.
- **Tier is not visible to the workflow author.** The YAML references a connector by KIND; whether the tenant's tier allows it is enforced elsewhere. Check the deployment target's tier before using an unusual KIND.
- **Sidecar + WASM/NativeCode registration is out-of-band.** The YAML references names; the names must be pre-registered on the Rust side. Runtime failure is "handler not found" — not a YAML schema error. Runtime artifact upload endpoints return the computed `sha256`; strict artifact policy can require a matching checksum and trusted native/plugin upload metadata.
