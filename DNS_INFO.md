# DNS Configuration for igormraz.com

## Point DNS to:

**IP Address: `188.245.193.10`**

This is the IP of your Kubernetes node where Traefik ingress controller is running.

## DNS Records to Create

### A Records

1. **Root Domain:**
   - **Host**: `@` (or leave blank)
   - **Type**: A
   - **Value**: `188.245.193.10`
   - **TTL**: 300 (or your preference)

2. **WWW Subdomain:**
   - **Host**: `www`
   - **Type**: A
   - **Value**: `188.245.193.10`
   - **TTL**: 300

## Verification

After DNS is configured, verify with:

```bash
dig igormraz.com
nslookup igormraz.com
```

Both should return `188.245.193.10`

## Ingress Controller

Your cluster is using **Traefik** as the ingress controller, which is already configured with a LoadBalancer service on IP `188.245.193.10`.

The ingress is configured to handle:
- `igormraz.com` → Frontend
- `www.igormraz.com` → Frontend
- `/api` → Backend API
- `/uploads` → Backend uploads

## SSL/TLS (Recommended)

After DNS is working, you should add SSL certificates. Options:

1. **Cert-Manager with Let's Encrypt** (free, automatic renewal)
2. **Manual certificate** upload
3. **Cloud provider** SSL

To add cert-manager for automatic SSL:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

Then update the ingress to include TLS configuration.
