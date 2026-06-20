# Platform Architecture

> **Status: Design**

## Overview

The Rangka Platform is a multi-tenant PaaS that hosts ERP applications built on the Rangka framework. Each workspace gets isolated compute and database resources. The platform uses Kubernetes for orchestration and CloudNativePG for database provisioning.

The platform sells convenience. The framework is the same everywhere. Self-hosters run it manually. Platform customers get it managed.

## Architecture Diagram

```
                         ┌──────────────────────────────┐
                         │         DNS Layer             │
                         │  *.rangka.app → LB IP         │
                         │  custom.domain → CNAME        │
                         └──────────────┬───────────────┘
                                        │
                         ┌──────────────▼───────────────┐
                         │     Gateway API (Traefik)     │
                         │  Wildcard TLS (DNS-01)        │
                         │  Custom domain TLS (HTTP-01)  │
                         │  Per-tenant HTTPRoute         │
                         └──────────────┬───────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  Platform Namespace   │  │  Tenant Namespace     │  │  Tenant Namespace     │
│  (control plane)      │  │  (ws-acme)            │  │  (ws-globex)          │
│                       │  │                       │  │                       │
│  Platform API         │  │  Rangka App Pod(s)    │  │  Rangka App Pod(s)    │
│  Platform UI          │  │  Pooler (PgBouncer)   │  │  Pooler (PgBouncer)   │
│  Build Controller     │  │  CNPG Cluster         │  │  CNPG Cluster         │
│  Agent Scheduler      │  │  NetworkPolicy        │  │  NetworkPolicy        │
│  Platform DB (CNPG)   │  │  ResourceQuota        │  │  ResourceQuota        │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

## Technology Stack

| Concern | Tool | Reason |
|---------|------|--------|
| Container orchestration | Kubernetes (EKS/GKE or Hetzner) | Industry standard, operator ecosystem |
| Ingress/routing | Traefik + Gateway API | Zero-downtime config, CRD-native, multi-tenant aware |
| CNI/Network | Cilium | eBPF-based, identity-aware policies, L3-L7 enforcement |
| Database | CloudNativePG | K8s-native Postgres operator, HA, backups, hibernation |
| Connection pooling | CNPG Pooler CRD (PgBouncer) | Per-tenant pooler, transaction mode |
| TLS | cert-manager + Let's Encrypt | Wildcard via DNS-01, custom domains via HTTP-01 |
| Builds | Kaniko | In-cluster, daemonless, no Docker socket |
| Registry | Harbor (self-hosted) | Private, per-tenant repos |
| Secrets | External Secrets Operator + AWS SSM | No secrets in etcd |
| Monitoring | Prometheus + Grafana | Per-tenant dashboards, alerting |
| Logs | Loki | Namespace-scoped log aggregation |
| Tenant management | Capsule (Starter/Business) | Auto-provisions quotas, policies, RBAC per namespace |
| Schema migrations | Atlas Operator | Staged rollout across tenants, GitOps-native |
| Scale-to-zero | Xata CNPG-I plugin | Hibernate idle databases, save compute |
| GitOps | ArgoCD | Declarative tenant state, drift detection |

## Namespace Strategy

Every workspace gets its own Kubernetes namespace. This provides the isolation boundary for RBAC, NetworkPolicy, ResourceQuota, and LimitRange.

```
Namespaces:
├── rangka-platform/        → Control plane (API, UI, build controller)
├── rangka-system/          → Operators (CNPG, cert-manager, Traefik)
├── rangka-builds/          → Kaniko build jobs (ephemeral)
├── ws-acme/                → Tenant workspace
├── ws-globex/              → Tenant workspace
├── ws-wayne-enterprises/   → Tenant workspace
└── ...
```

Naming convention: `ws-{workspace-slug}`

Labels applied to every tenant namespace:

```yaml
metadata:
  labels:
    rangka.app/tenant-id: "acme"
    rangka.app/tier: "business"        # starter | business | enterprise
    rangka.app/workspace-slug: "acme"
    gateway-access: "true"             # allows HTTPRoute attachment
```

### Tier-based isolation

| Tier | Namespace strategy | Compute isolation | DB isolation |
|------|-------------------|-------------------|--------------|
| Starter | Dedicated namespace, shared nodes | Pod limits (200m CPU, 256Mi) | Single CNPG instance, hibernation enabled |
| Business | Dedicated namespace, dedicated pod resources | Guaranteed QoS (requests == limits) | 2-instance CNPG HA cluster |
| Enterprise | Dedicated namespace + optional dedicated node pool | Node taints/tolerations, pod anti-affinity | 3-instance CNPG sync replication |

## Routing and DNS

### Platform subdomains

All workspaces get a subdomain under `rangka.app`:

```
acme.rangka.app         → ws-acme namespace
globex.rangka.app       → ws-globex namespace
```

DNS setup: Single wildcard A record `*.rangka.app → Ingress LB IP`

### Custom domains

Tenants can configure custom domains (e.g., `erp.acmecorp.com`):

1. Tenant adds custom domain in platform UI
2. Platform instructs tenant to create CNAME: `erp.acmecorp.com → acme.rangka.app`
3. Platform controller creates Certificate CR (HTTP-01 challenge)
4. Platform controller creates/updates HTTPRoute with custom hostname
5. cert-manager provisions certificate automatically
6. Traffic routes to tenant namespace

### TLS strategy

| Domain type | Challenge | Certificate scope |
|-------------|-----------|-------------------|
| `*.rangka.app` | DNS-01 (Cloudflare) | Single wildcard cert, shared across all tenants |
| Custom domains | HTTP-01 | Per-domain certificate |

```yaml
# Wildcard certificate for platform subdomains
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: wildcard-rangka-app
  namespace: rangka-system
spec:
  secretName: wildcard-rangka-app-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - "rangka.app"
    - "*.rangka.app"
```

### Gateway API configuration

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: tenant-gateway
  namespace: rangka-system
spec:
  gatewayClassName: traefik
  listeners:
    - name: wildcard-https
      hostname: "*.rangka.app"
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
        certificateRefs:
          - name: wildcard-rangka-app-tls
      allowedRoutes:
        namespaces:
          from: Selector
          selector:
            matchLabels:
              gateway-access: "true"
    - name: platform-https
      hostname: "app.rangka.app"
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
        certificateRefs:
          - name: wildcard-rangka-app-tls
      allowedRoutes:
        namespaces:
          from: Same
```

Per-tenant HTTPRoute (auto-created by platform controller):

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: tenant-route
  namespace: ws-acme
spec:
  parentRefs:
    - name: tenant-gateway
      namespace: rangka-system
      sectionName: wildcard-https
  hostnames:
    - "acme.rangka.app"
    - "erp.acmecorp.com"    # custom domain (if configured)
  rules:
    - backendRefs:
        - name: rangka-app
          port: 3000
```

## Network Isolation

Default-deny between tenant namespaces. Cilium enforces at L3-L7.

### Base policy (applied to every tenant namespace)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-cross-tenant
  namespace: ws-acme
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # Allow from same namespace (app ↔ db)
    - from:
        - podSelector: {}
    # Allow from ingress controller
    - from:
        - namespaceSelector:
            matchLabels:
              app.kubernetes.io/name: traefik
  egress:
    # Allow to same namespace
    - to:
        - podSelector: {}
    # Allow DNS resolution
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - port: 53
          protocol: UDP
    # Allow outbound HTTPS (webhooks, external APIs)
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 10.0.0.0/8       # block internal network
              - 172.16.0.0/12
              - 192.168.0.0/16
      ports:
        - port: 443
          protocol: TCP
```

Tenants can reach the internet (for webhooks, external APIs) but cannot reach other tenant namespaces or internal services.

## Database Provisioning (CloudNativePG)

### Per-tenant cluster

Each workspace gets a CNPG Cluster CR in its namespace:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: db
  namespace: ws-acme
spec:
  instances: 2                     # Business tier HA
  imageName: ghcr.io/cloudnative-pg/postgresql:17
  
  storage:
    size: 20Gi
    storageClass: gp3-encrypted

  resources:
    requests:
      memory: "1Gi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "500m"

  postgresql:
    parameters:
      shared_buffers: "256MB"
      max_connections: "100"
      work_mem: "8MB"
      effective_cache_size: "768MB"

  enablePodAntiAffinity: true

  backup:
    barmanObjectStore:
      destinationPath: s3://rangka-backups/ws-acme/
      s3Credentials:
        accessKeyId:
          name: backup-creds
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: backup-creds
          key: SECRET_ACCESS_KEY
      wal:
        compression: gzip
      data:
        compression: gzip
    retentionPolicy: "14d"

  monitoring:
    enablePodMonitor: true
```

### Connection pooling

Each tenant gets a Pooler CR (PgBouncer in transaction mode):

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Pooler
metadata:
  name: db-pooler
  namespace: ws-acme
spec:
  cluster:
    name: db
  instances: 1
  type: rw
  pgbouncer:
    poolMode: transaction
    parameters:
      max_client_conn: "500"
      default_pool_size: "20"
```

App pods connect to the Pooler service, not directly to Postgres.

### Tier-based database configuration

| | Starter | Business | Enterprise |
|---|---|---|---|
| CNPG instances | 1 | 2 | 3 (sync replication) |
| Resources | 256Mi / 100m CPU | 1Gi / 500m CPU | 4Gi / 2 CPU |
| Storage | 5Gi standard | 20Gi gp3 | 100Gi+ NVMe |
| Pooler | None (direct connect) | 1 instance | 2-3 instances |
| Backup retention | 7 days | 14 days | 30 days |
| Backup frequency | Daily | Daily + WAL archive | Continuous WAL |
| Anti-affinity | None | Preferred | Required |
| Hibernation | Yes (30 min idle) | Optional (2h idle) | No |

### Hibernation (scale-to-zero)

Starter tier databases hibernate after 30 minutes of inactivity using the Xata CNPG-I scale-to-zero plugin:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: db
  namespace: ws-starter-bakery
  annotations:
    xata.io/scale-to-zero-enabled: "true"
    xata.io/scale-to-zero-inactivity-minutes: "30"
spec:
  plugins:
    - name: xata.io/scale-to-zero
  instances: 1
  # ...
```

Wake-up flow:
1. Request hits app pod → app tries DB connection → connection fails
2. App calls platform API: "wake my database"
3. Platform removes hibernation annotation
4. CNPG operator starts pod, attaches PVC
5. Postgres ready in ~20-30 seconds
6. App retries connection, succeeds

For Starter tier, a "warming up" page is shown to the user during wake-up. Acceptable trade-off for the cost savings.

### Backup strategy

All tenants share one S3 bucket with per-tenant path prefixes:

```
s3://rangka-backups/
├── ws-acme/
│   ├── base/         → full backups
│   └── wals/         → WAL archive
├── ws-globex/
│   ├── base/
│   └── wals/
└── ws-bakery/
    ├── base/
    └── wals/
```

One bucket, per-tenant ObjectStore CR, unique `serverName` per cluster to avoid WAL conflicts.

## App Deployment

### Build pipeline

```
Developer pushes code (git push / Studio publish)
  │
  ▼
Platform API receives webhook
  │
  ▼
Create Kaniko Job in rangka-builds namespace
  │
  ▼
Kaniko builds image (no Docker daemon)
  │
  ▼
Push image to Harbor: registry.rangka.app/ws-acme/sales:v3
  │
  ▼
Update Deployment image tag
  │
  ▼
Rolling restart (zero downtime)
```

### App Deployment manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  namespace: ws-acme
spec:
  replicas: 2                        # Business tier
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: rangka
        rangka.app/workspace: acme
    spec:
      containers:
        - name: app
          image: registry.rangka.app/ws-acme/sales:v3
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-pooler       # CNPG auto-creates this
                  key: uri
            - name: RANGKA_AUTH_STRATEGY
              value: "platform"
            - name: RANGKA_PLATFORM_URL
              value: "https://app.rangka.app"
            - name: RANGKA_WORKSPACE_ID
              valueFrom:
                secretKeyRef:
                  name: workspace-config
                  key: workspace-id
          resources:
            requests:
              memory: "256Mi"
              cpu: "200m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: rangka-app
  namespace: ws-acme
spec:
  selector:
    app: rangka
  ports:
    - port: 3000
      targetPort: 3000
```

### Environment management

Business and Enterprise tiers get multiple environments:

```
ws-acme/
├── env-dev/        → development (auto-deploy on push)
├── env-staging/    → staging (manual promote)
└── env-prod/       → production (manual promote + approval)
```

Each environment is a separate Deployment + CNPG Cluster within the same namespace (or sub-namespaces). Promotion copies the image tag and runs migrations.

## Schema Migrations

When a tenant deploys a new version that includes model changes, the Rangka boot process handles schema sync:

1. App starts, framework boots
2. DiffEngine compares model definitions vs actual DB schema
3. Generates DDL operations (non-destructive by default)
4. Applies migrations in a transaction
5. App ready

This is per-tenant, handled by the framework itself. No external migration tool needed for normal deployments because Rangka's DiffEngine handles it at boot.

### Platform-level schema management

For cases where the platform needs to push schema changes across ALL tenants (e.g., core module update):

1. Platform builds new image with updated modules
2. Rolling restart across tenants (staged by tier)
3. Each tenant's app boots, DiffEngine applies changes

Rollout order:
1. Internal test workspace
2. Starter tier (parallel, continue on error)
3. Business tier (staged, 10% → 50% → 100%)
4. Enterprise tier (manual trigger per customer)

## Workspace Provisioning Flow

When a user creates a new workspace:

```
1. Validate workspace slug (unique, valid DNS label)
2. Create namespace: ws-{slug}
3. Apply labels (tier, tenant-id, gateway-access)
4. Apply ResourceQuota (tier-based limits)
5. Apply NetworkPolicy (default deny cross-tenant)
6. Create CNPG Cluster CR → operator provisions Postgres
7. Create Pooler CR → PgBouncer deployment
8. Wait for CNPG cluster ready (status: "Cluster in healthy state")
9. Create workspace-config Secret (workspace ID, auth config)
10. Create initial app Deployment (core module, idle state)
11. Run Rangka boot (DiffEngine creates core tables)
12. Create admin user in core.user table
13. Create HTTPRoute ({slug}.rangka.app → app service)
14. Return workspace URL to user
```

Time estimate: ~60-90 seconds (dominated by CNPG cluster startup).

## Control Plane

The Platform API itself runs on Rangka framework (dogfooding). It has its own namespace (`rangka-platform`) with:

```
rangka-platform/
├── platform-api (Deployment)     → workspace CRUD, deploy, billing
├── platform-ui (Deployment)      → React frontend (app.rangka.app)
├── build-controller (Deployment) → watches git hooks, triggers builds
├── agent-scheduler (Deployment)  → runs tenant agents on schedule
├── platform-db (CNPG Cluster)    → workspaces, billing, audit metadata
└── redis (StatefulSet)           → job queues, session cache
```

### Platform API services

| Service | Responsibility |
|---------|---------------|
| workspace | CRUD, member management, settings |
| deploy | build trigger, image management, rollout |
| provision | namespace creation, CNPG cluster, networking |
| auth | SSO configuration, token issuance, SCIM endpoint |
| billing | Stripe integration, usage metering, seat tracking |
| agents | agent CRUD, scheduling, execution, monitoring |
| monitoring | per-tenant metrics aggregation, alerting rules |

## Cost Model

### Per-tenant infrastructure cost

| Tier | Compute | Database | Storage/Backup | Total infra/mo |
|------|---------|----------|----------------|----------------|
| Starter | ~$2 (shared, burstable) | ~$3 (single instance, hibernates) | ~$0.50 | ~$5.50 |
| Business (20 users) | ~$15 (dedicated pods) | ~$20 (2-instance HA) | ~$3 | ~$38 |
| Enterprise (200 users) | ~$80 (autoscale) | ~$100 (3-instance, NVMe) | ~$20 | ~$200 |

### Revenue vs cost

| Tier | Revenue | Infra cost | Margin |
|------|---------|------------|--------|
| Starter ($9/mo flat) | $9 | ~$5.50 | ~39% |
| Business (20 users × $15) | $300 | ~$38 | ~87% |
| Enterprise (200 users × $20) | $4,000 | ~$200 | ~95% |

Starter tier has thin margins but serves as onboarding funnel. Business/Enterprise have healthy margins that improve with scale.

## Security

### Tenant isolation layers

1. **Namespace** — RBAC boundary, resource scoping
2. **NetworkPolicy** — no cross-tenant network access
3. **ResourceQuota** — prevent resource starvation
4. **Separate database** — no shared tables between tenants
5. **Separate credentials** — each tenant has unique DB credentials
6. **Image isolation** — per-tenant image repos in Harbor

### Auth flow (platform-managed)

```
User → app.rangka.app/login
  → Platform auth service
    → SSO provider (if configured) OR platform credentials
  → JWT issued by platform
  → JWT includes: workspace_id, user_id, roles[]
  → App validates JWT via platform public key
  → Framework enforces permissions per usual
```

### Secrets management

- CNPG auto-creates DB credential Secrets in the tenant namespace
- Platform config (workspace ID, auth keys) stored as K8s Secrets
- External Secrets Operator syncs from AWS SSM for platform-level secrets
- No secrets stored in etcd unencrypted (EncryptionConfiguration enabled)

## Monitoring and Observability

### Per-tenant metrics

CNPG exports Postgres metrics via PodMonitor. App pods export Rangka metrics (request count, latency, hook duration).

Grafana dashboards:
- Platform overview (all tenants, resource usage, costs)
- Per-tenant dashboard (requests, DB connections, storage, errors)
- Alerting: DB connection saturation, pod OOM, high latency, backup failure

### Tenant-visible metrics (platform UI)

- Request count and latency (last 24h, 7d, 30d)
- Database size and connection count
- Active users
- Agent execution history
- Deploy history and rollback options

## Disaster Recovery

| Scenario | Recovery |
|----------|----------|
| Pod crash | K8s auto-restarts, zero intervention |
| Node failure | Pods rescheduled to healthy nodes |
| DB primary failure | CNPG automatic failover to replica (~5-10s) |
| Entire AZ down | Pods + DB replicas in other AZs (multi-AZ) |
| Data corruption | Point-in-time recovery from WAL archive |
| Region failure | Restore from S3 backup to new region (RPO: last WAL) |

### Backup verification

Automated weekly restore test:
1. Pick random tenant backup
2. Restore to isolated namespace
3. Run Rangka boot (verify schema)
4. Query sample data (verify integrity)
5. Delete test namespace
6. Alert if any step fails

## Studio Runtime (Warm Pool)

Studio Core runs as ephemeral pods on the platform. Users open Studio to build/customize their apps, then close the tab. Pods are idle 90%+ of the time. A warm pool eliminates cold start latency.

### Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                     Studio Session Manager                          │
│                                                                     │
│  1. Check if user already has active session → return existing WS  │
│  2. Claim warm pod from pool (label it with workspace ID)          │
│  3. Activate pod: inject creds, mount workspace, boot framework    │
│  4. Create HTTPRoute for WebSocket                                 │
│  5. Return WS URL to client                                        │
│  6. Monitor session health + idle timeout                          │
│  7. On timeout: drain → clean → return to pool                     │
└───────────┬────────────────────────────────────────┬──────────────┘
            │                                        │
            ▼                                        ▼
┌───────────────────────┐              ┌─────────────────────────────┐
│    Warm Pool           │              │    Active Sessions           │
│    (standby pods)      │              │                             │
│                        │   ──claim──▶ │  Pod X: ws-acme (user)      │
│    Pod A: ready ✓      │              │    ├── Studio Core running   │
│    Pod B: ready ✓      │              │    ├── Workspace: /nfs/...   │
│    Pod C: ready ✓      │              │    ├── DB: ws-acme cluster   │
│                        │  ◀──return── │    ├── AI: user's BYOK key  │
│                        │              │    └── WS: wss://studio-...  │
└───────────────────────┘              └─────────────────────────────┘
            │                                        │
            ▼                                        ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Shared NFS / EFS                                 │
│   /workspaces/ws-acme/     ← source files                         │
│   /workspaces/ws-globex/   ← source files                         │
└───────────────────────────────────────────────────────────────────┘
```

### Warm pool concept

Warm pods are pre-provisioned Studio Core containers in standby mode. Node.js process running, agent SDK loaded, ready to accept a workspace assignment. No workspace files mounted, no DB connected.

When a user opens Studio, the Session Manager claims a warm pod and activates it with the workspace context. This reduces startup time from ~20-30 seconds (image pull + container start + framework boot) to ~3-5 seconds (framework boot only).

### Pod lifecycle

```
Warm (standby)
  │
  │ user opens Studio
  ▼
Claiming (inject creds, mount workspace)
  │
  │ framework boots (~3-5s)
  ▼
Active (serving WebSocket, agent responding)
  │
  │ no activity for 15 min
  ▼
Draining (save state, flush pending writes)
  │
  ▼
Recycled (unmount volume, clear env, reset state)
  │
  ▼
Return to warm pool  OR  terminate (if pool full)
```

### Activation flow

When a user clicks "Open Studio" for their workspace:

1. Platform API checks for existing active session → return WebSocket URL if found
2. Claim available warm pod from pool (mark as claimed via label)
3. Inject workspace context:
   - Set workspace path on shared NFS (`/workspaces/ws-{slug}/`)
   - Inject DB credentials (from CNPG tenant secret)
   - Inject AI API key (user's BYOK key from workspace settings)
   - Inject user identity (for audit trail)
4. Signal pod: `POST /activate { workspace, user, dbUrl, aiKey }`
5. Pod boots Rangka framework (scan models, connect DB) — ~3-5 seconds
6. Create HTTPRoute: `studio-{slug}-{session}.rangka.app → pod`
7. Return WebSocket URL to Platform UI

### Pool sizing

```
Pool configuration:
  minWarm: 3           # always keep 3 warm pods ready
  maxWarm: 10          # never exceed 10 idle warm pods
  maxActive: 50        # max concurrent studio sessions
  idleTimeout: 15 min  # no activity → recycle
  scaleUpThreshold: 2  # if warm < 2, provision more
```

The pool autoscales based on demand. During peak hours (business day), more warm pods are maintained. Off-peak, scale down to minimum.

### Workspace file access

All workspace source files live on a shared NFS/EFS volume:

```
/workspaces/
├── ws-acme/           → app source files (models, pages, services, hooks)
├── ws-globex/         → app source files
└── ws-bakery/         → app source files
```

Any Studio pod can access any workspace by reading from the shared volume. No mount/unmount dance needed — the pod just points its file watcher at the correct subdirectory on activation.

NFS is appropriate because:
- Workspace files are small (TypeScript definitions, 100-500 files per app)
- File watching works over NFS
- Multiple pods can read/write the same directory (enables future multiplayer)
- No PVC hot-mount limitations

### Per-tier pool behavior

| Tier | Pool | Resources | Idle timeout | Notes |
|------|------|-----------|--------------|-------|
| Starter | Shared pool | 512Mi / 250m CPU | 10 min | Lower priority claim |
| Business | Shared pool | 1Gi / 500m CPU | 15 min | Standard priority |
| Enterprise | Dedicated pods | 2Gi / 1 CPU | 30 min | Pre-assigned to tenant, never shared |

Shared pool serves Starter and Business tenants. Pods are claimed on demand and returned after idle timeout. Enterprise tenants get dedicated warm pods that are never shared with other workspaces.

### Warm pod deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: studio-pool-shared
  namespace: rangka-platform
spec:
  replicas: 5
  template:
    metadata:
      labels:
        rangka.app/component: studio-pool
        rangka.app/pool: shared
        rangka.app/status: warm
    spec:
      containers:
        - name: studio-core
          image: registry.rangka.app/platform/studio-core:latest
          env:
            - name: STUDIO_MODE
              value: "standby"
          ports:
            - containerPort: 4000
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          readinessProbe:
            httpGet:
              path: /health
              port: 4000
          volumeMounts:
            - name: workspaces
              mountPath: /workspaces
              readOnly: false
      volumes:
        - name: workspaces
          nfs:
            server: efs-mount-target.rangka.internal
            path: /workspaces
```

### Session routing

Active Studio sessions get a dedicated HTTPRoute for WebSocket connections:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: studio-session-abc123
  namespace: rangka-platform
spec:
  parentRefs:
    - name: tenant-gateway
      namespace: rangka-system
  hostnames:
    - "studio-acme-abc123.rangka.app"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: studio-pod-xyz    # specific pod service
          port: 4000
```

The session-specific subdomain ensures WebSocket connections route to the correct pod. When the session ends, the HTTPRoute is cleaned up.

### Cost impact

| Concern | Monthly cost |
|---------|-------------|
| Warm pool (5 pods standby) | ~$25 (512Mi × 5, burstable nodes) |
| NFS/EFS storage | ~$10 + $0.30/GB |
| Active session per hour | ~$0.01 |

The warm pool is cheap relative to the UX improvement. Instant Studio startup justifies the idle cost.

### Multiplayer (future)

The NFS architecture enables future multiplayer editing. Two users opening Studio for the same workspace both read/write the same directory. Conflict resolution and presence awareness would be handled by the Platform UI layer (CRDT-based), with Studio Core acting as a relay.

For initial launch, Studio sessions are single-user. One active session per workspace at a time. Multiplayer is a platform-only feature added later.

## Open Questions

- Should Starter tenants share a CNPG cluster (database-per-tenant in one cluster) to reduce overhead? Trade-off: less isolation, more cost-efficient.
- Should the platform support multi-region deployment for Enterprise (active-active or active-passive)?
- Should there be a CDN layer (Cloudflare) in front of Traefik for DDoS protection and edge caching?
- How to handle tenant data export (GDPR right to portability)? Likely: `rangka export` command that dumps all models to JSON.
- Should Studio warm pool pods be region-aware (provision closer to user for lower WebSocket latency)?
- How to handle Studio session recovery if a pod crashes mid-session? File state is safe (NFS), but agent conversation context is lost.
