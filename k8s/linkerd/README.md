# Linkerd service mesh

The Kubernetes backend is configured for Linkerd proxy injection. Once it is
running with the Linkerd proxy, its meshed pod-to-pod connections use Linkerd's
automatic mutual TLS. The `backend-health` HTTPRoute also gives meshed clients
per-route metrics, a 5-second request timeout, and at most one retry for an
HTTP 503 on the idempotent `GET /health` endpoint.

This integration applies to Kubernetes only; the Docker Compose deployment is
unchanged. Traffic from or to workloads without a Linkerd proxy is not protected
by mesh mTLS. Mesh mTLS does not replace application authentication or TLS at
the public ingress.

## Install Linkerd

Install the Linkerd CLI and use a Linkerd release compatible with the cluster's
Kubernetes version. Linkerd 2.18 uses Gateway API v1 HTTPRoutes and supports
Gateway API releases 1.1.1 through 1.2.1. If a compatible Gateway API version
isn't already installed, install it with Linkerd's CRDs:

```bash
linkerd check --pre
linkerd install --crds --set installGatewayAPI=true | kubectl apply -f -
linkerd install | kubectl apply -f -
linkerd check
```

If the cluster already has a compatible Gateway API installation, omit
`--set installGatewayAPI=true` so Linkerd does not replace it.

Install the observability extension, then apply the backend and its route:

```bash
linkerd viz install | kubectl apply -f -
linkerd viz check
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/linkerd/backend-health-route.yaml
```

The backend pod receives its proxy through the injection annotation in
`k8s/backend.yaml`. Pods must be recreated for injection to take effect; apply
the deployment before the HTTPRoute so the `backend` Service exists.

## Observe traffic

After meshed workloads send traffic to the backend:

```bash
linkerd viz stat deploy/backend
linkerd viz routes svc/backend
linkerd viz edges deploy
linkerd viz dashboard
```

The Viz extension reports request rate, success rate, and latency. Use
`linkerd viz edges` to inspect meshed service relationships and mTLS status.
Health probes initiated by Kubernetes are not meshed client traffic and are not
covered by the HTTPRoute retry or timeout policy.

## Operational notes

- The retry policy is limited to the read-only health endpoint; do not broaden
  retries to state-changing API routes without confirming their idempotency.
- Linkerd proxy injection does not create authorization rules. Configure
  workload-specific Linkerd authorization only after identifying the legitimate
  callers; adding a `Server` policy without matching authorizations denies
  inbound traffic.
- Plan trust-anchor and issuer-certificate rotation for production clusters,
  and follow the Linkerd release's certificate-lifecycle guidance.
- `linkerd install` is convenient for evaluation. For production, use the
  release's Helm installation workflow and manage control-plane configuration
  declaratively.
