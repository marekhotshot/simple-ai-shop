# DNS Setup for igormraz.com

## DNS Configuration

Point your DNS records to the following:

### Option 1: Direct IP (if using NodePort or LoadBalancer)
**A Record:**
- **Host**: `@` (or blank for root domain)
- **Type**: A
- **Value**: `188.245.193.10`
- **TTL**: 300 (or your preference)

**A Record for www:**
- **Host**: `www`
- **Type**: A
- **Value**: `188.245.193.10`
- **TTL**: 300

### Option 2: Using Ingress Controller (Recommended)

If you have an ingress controller with a LoadBalancer or external IP:

1. **Check the ingress controller service:**
   ```bash
   kubectl get svc -n kube-system | grep ingress
   ```

2. **Get the external IP:**
   ```bash
   kubectl get svc -n kube-system -o wide | grep ingress
   ```

3. **Point DNS to that IP**

### Current Setup

The Kubernetes cluster node IP is: **188.245.193.10**

However, you'll need to:
1. Expose the ingress with a LoadBalancer or NodePort
2. Or use the node IP if using NodePort service type

## Ingress Configuration

The ingress is configured for:
- `igormraz.com` (root domain)
- `www.igormraz.com` (www subdomain)

Both point to the same frontend service.

## After DNS is Configured

1. **Deploy the ingress:**
   ```bash
   kubectl apply -f k8s/frontend.yaml
   ```

2. **Check ingress status:**
   ```bash
   kubectl get ingress -n igormraz
   ```

3. **Verify DNS propagation:**
   ```bash
   dig igormraz.com
   # or
   nslookup igormraz.com
   ```

## SSL/TLS Certificate

You'll likely want to add SSL. Options:
1. **Cert-Manager** (recommended for Let's Encrypt)
2. **Manual certificate** upload
3. **Cloud provider** SSL (if using cloud load balancer)

To add cert-manager:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

Then update the ingress to use TLS.
