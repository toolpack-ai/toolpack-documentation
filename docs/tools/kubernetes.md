---
sidebar_position: 12
description: "Kubernetes tools for Toolpack SDK that let AI inspect clusters, manage resources, and apply Kubernetes manifests via kubectl."
keywords: [kubernetes tools, kubectl, cluster management, Toolpack SDK, k8s tools, AI operations]
---

# Kubernetes Tools

Category: `kubernetes` · 11 tools

Use this category to inspect and manage Kubernetes clusters using `kubectl`. These tools are designed for common DevOps and cluster maintenance tasks, including listing pods, reading logs, applying manifests, and waiting for deployments.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `k8s.list_pods` | `namespace?`, `labels?`, `allNamespaces?` | List pods in a namespace or across the cluster |
| `k8s.describe` | `resource`, `name?`, `namespace?` | Describe a Kubernetes resource or resource instance |
| `k8s.get_logs` | `podName`, `namespace?`, `container?`, `tailLines?`, `since?` | Fetch logs from a pod |
| `k8s.apply_manifest` | `path?`, `manifest?`, `namespace?` | Apply a manifest from a file or inline YAML |
| `k8s.delete_resource` | `resource?`, `name?`, `namespace?`, `path?`, `force?` | Delete a resource by type/name or manifest file |
| `k8s.list_services` | `namespace?`, `allNamespaces?` | List services in a namespace or cluster-wide |
| `k8s.list_deployments` | `namespace?`, `labels?`, `allNamespaces?` | List deployments in a namespace or cluster-wide |
| `k8s.get_config_map` | `name`, `namespace?`, `output?` | Retrieve a ConfigMap in YAML or JSON |
| `k8s.switch_context` | `context` | Switch the active `kubectl` context |
| `k8s.get_namespaces` | - | List namespaces in the current cluster context |
| `k8s.wait_for_deployment` | `name`, `namespace?`, `timeout?` | Wait for a deployment rollout to complete |

## Requirements

- `kubectl` must be installed and available on the PATH
- A valid kubeconfig must be configured for the cluster you want to manage

> These tools execute `kubectl` commands, so they depend on the host environment and cluster access.

## Examples

### List all pods in the current namespace

```typescript
const response = await toolpack.generate({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'List all pods in the current namespace.' }
  ],
});
```

The AI may use `k8s.list_pods` automatically when tools are enabled.

### Describe a deployment

```typescript
const result = await toolpack.callTool('k8s.describe', {
  resource: 'deployment',
  name: 'my-app',
  namespace: 'staging',
});
console.log(result);
```

### Apply a manifest from a file

```typescript
const result = await toolpack.callTool('k8s.apply_manifest', {
  path: './deploy/my-app.yaml',
  namespace: 'staging',
});
console.log(result);
```

### Fetch logs from a pod

```typescript
const result = await toolpack.callTool('k8s.get_logs', {
  podName: 'my-app-12345',
  namespace: 'staging',
  tailLines: 200,
});
console.log(result);
```

### Switch context safely

```typescript
const result = await toolpack.callTool('k8s.switch_context', {
  context: 'staging-cluster',
});
console.log(result);
```

## Security and Safety

Kubernetes operations can be destructive. When using these tools with AI agents, consider restricting access with a custom mode or requiring confirmation for high-risk actions like `k8s.apply_manifest` and `k8s.delete_resource`.
