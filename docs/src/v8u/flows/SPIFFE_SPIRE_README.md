# SPIFFE/SPIRE Mock Flow (V8U)

## Overview

The SPIFFE/SPIRE Mock Flow demonstrates the integration between SPIFFE/SPIRE workload identity and PingOne SSO. This is an educational mock that simulates the token exchange process described in the [SPIFFE/SPIRE documentation](/docs/spiffe-spire-pingone).

## Features

### 4-Step Interactive Flow

1. **Configure Workload**
   - Set trust domain (e.g., `example.org`)
   - Define workload path (e.g., `frontend/api`)
   - Select workload type (Kubernetes, VM, Container)
   - Configure Kubernetes-specific settings (namespace, service account)
   - Provide PingOne Environment ID

2. **Generate SVID**
   - Simulates SPIRE agent interaction
   - Generates mock SPIFFE Verifiable Identity Document (SVID)
   - Creates X.509 certificate and private key
   - Includes trust bundle for validation
   - Shows SPIFFE ID format: `spiffe://trust-domain/path`

3. **Validate SVID**
   - Simulates SVID validation against trust bundle
   - Verifies certificate signature
   - Confirms workload identity

4. **Exchange for PingOne Token**
   - Simulates token exchange service
   - Maps SPIFFE ID to PingOne service account
   - Generates OAuth 2.0 access token
   - Generates OIDC ID token
   - Shows token details and usage

## Mock Data

### SVID Generation
- **SPIFFE ID**: `spiffe://{trustDomain}/{workloadPath}`
- **X.509 Certificate**: Mock certificate with workload-specific identifiers
- **Private Key**: Mock private key for demonstration
- **Trust Bundle**: Mock CA certificate for trust domain
- **Expiration**: 1 hour from generation

### PingOne Token
- **Access Token**: JWT with SPIFFE ID in claims
- **ID Token**: OIDC token with workload identity
- **Token Type**: Bearer
- **Expires In**: 3600 seconds (1 hour)
- **Scope**: `openid profile email`

## Educational Value

This mock flow demonstrates:

1. **Zero-Trust Architecture**: Workloads authenticate using cryptographic identities instead of static secrets
2. **SPIFFE Standards**: Shows SPIFFE ID format and SVID structure
3. **Token Exchange**: Demonstrates how SPIFFE identities can be exchanged for OAuth/OIDC tokens
4. **Integration Pattern**: Shows how SPIRE and PingOne can work together
5. **Workload Identity**: Illustrates automatic identity issuance based on workload attributes

## Technical Details

### SPIFFE ID Format
```
spiffe://trust-domain/workload-path
```

Example:
```
spiffe://example.org/frontend/api
```

### Token Exchange Flow
```
1. Workload → SPIRE Agent: Request SVID
2. SPIRE Agent → Workload: Return SVID (X.509 cert)
3. Workload → Token Exchange Service: Present SVID
4. Token Exchange Service → SPIRE: Validate SVID
5. Token Exchange Service → PingOne: Request OAuth token
6. PingOne → Token Exchange Service: Return access token + ID token
7. Token Exchange Service → Workload: Return tokens
8. Workload → Protected Resource: Use access token
```

### Workload Types

**Kubernetes Pod**
- Attestation based on namespace and service account
- Uses Kubernetes Projected Service Account Tokens (PSAT)
- Example: `k8s:ns:default` + `k8s:sa:frontend-sa`

**Virtual Machine**
- Attestation based on VM metadata
- Uses cloud provider instance identity documents
- Example: AWS EC2 instance identity

**Container**
- Attestation based on container runtime
- Uses Docker/containerd metadata
- Example: Container ID and labels

## Usage

1. Navigate to `/v8u/spiffe-spire` in the application
2. Configure your workload settings
3. Click "Generate SVID" to create a mock workload identity
4. Click "Validate SVID" to verify the identity
5. Click "Exchange for PingOne Token" to get OAuth/OIDC tokens
6. Copy tokens and examine their structure
7. Click "Reset Flow" to start over

## Integration with Real Systems

In a production environment, this flow would:

1. **Use Real SPIRE**: Deploy SPIRE server and agents
2. **Configure Attestation**: Set up node and workload attestation
3. **Implement Token Exchange**: Build a service that validates SVIDs and requests PingOne tokens
4. **Configure PingOne**: Set up service accounts and SPIFFE ID mapping
5. **Enable Federation**: Configure SPIFFE Federation between trust domains

## Related Documentation

- [SPIFFE/SPIRE with PingOne SSO](/docs/spiffe-spire-pingone) - Full integration guide
- [SPIFFE Official Docs](https://spiffe.io/) - SPIFFE standards
- [SPIRE Documentation](https://spiffe.io/docs/latest/spire/) - SPIRE implementation
- [PingOne Platform API](https://apidocs.pingidentity.com/pingone/platform/v1/api/) - PingOne API docs

## File Location

```
src/v8u/flows/SpiffeSpireFlowV8U.tsx
```

## Route

```
/v8u/spiffe-spire
```

## Version

- **Version**: 8.0.0
- **Created**: 2024-11-17
- **Type**: Mock/Educational Flow
- **Status**: Active

## Notes

- This is a **mock flow** for educational purposes
- Does not make real API calls to SPIRE or PingOne
- Generates realistic-looking but fake tokens
- Demonstrates the integration pattern and flow
- Use the [Unified Flow (V8U)](/v8u/unified) for real PingOne API interactions
