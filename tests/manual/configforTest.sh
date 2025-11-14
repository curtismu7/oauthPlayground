# Replace with your real values
export ENV_ID="b9817c16-9910-4415-b67e-4ac687da74d9"
export CLIENT_ID="bdb78dcc-d530-4144-90c7-c7537a55128a"
export CLIENT_SECRET="VhIALUz93iLEPhmTs~Y3_oj~hxzi7gnqw6cJYXLSJEq2LyLz2m7KV0bOq9LFj_GU"
export REDIRECT_URI="https://localhost:3000/authz-callback"
export SCOPES="openid"

# PKCE
CODE_VERIFIER=$(openssl rand -base64 96 | tr -d '=+/\n' | cut -c1-128)
CODE_CHALLENGE=$(printf "%s" "$CODE_VERIFIER" | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '=\n')
STATE="pi-flow-$(date +%s)"