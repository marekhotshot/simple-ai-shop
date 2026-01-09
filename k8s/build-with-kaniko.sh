#!/bin/bash
# Build using Kaniko (no Docker daemon needed)
set -e

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NAMESPACE=igormraz

cd /workspaces/simple-ai-shop

echo "Preparing source archive..."
tar --exclude='node_modules' --exclude='.next' --exclude='dist' --exclude='.git' --exclude='k8s' -czf /tmp/source.tar .

echo "Creating ConfigMap with source..."
kubectl create configmap backend-source --from-file=source.tar=/tmp/source.tar -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

echo "Creating Kaniko build job..."
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: build-backend-$(date +%s)
  namespace: $NAMESPACE
spec:
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: kaniko
        image: gcr.io/kaniko-project/executor:latest
        args:
        - --dockerfile=/workspace/Dockerfile.backend
        - --context=dir:///workspace
        - --destination=simple-ai-shop-backend:latest
        - --no-push
        - --tarPath=/workspace/image.tar
        - --single-snapshot
        volumeMounts:
        - name: source
          mountPath: /workspace
      volumes:
      - name: source
        configMap:
          name: backend-source
EOF

JOB=$(kubectl get jobs -n $NAMESPACE -l job-name=build-backend-* -o jsonpath='{.items[0].metadata.name}' | head -1)
echo "Waiting for job: $JOB"
kubectl wait --for=condition=complete job/$JOB -n $NAMESPACE --timeout=600s || kubectl logs -n $NAMESPACE job/$JOB

POD=$(kubectl get pods -n $NAMESPACE -l job-name=$JOB -o jsonpath='{.items[0].metadata.name}')
echo "Extracting image from pod: $POD"
kubectl cp $NAMESPACE/$POD:/workspace/image.tar /tmp/image.tar

echo "Loading image into K3s..."
NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
kubectl debug node/$NODE -it --image=busybox --rm -- sh -c "cat | ctr -n k8s.io images import -" < /tmp/image.tar 2>&1 | grep -v "Creating debugging pod" || \
echo "Please manually load: kubectl cp /tmp/image.tar to node and run: ctr -n k8s.io images import /tmp/image.tar"

kubectl delete job $JOB -n $NAMESPACE --ignore-not-found=true
rm -f /tmp/source.tar /tmp/image.tar

echo "Build complete!"
