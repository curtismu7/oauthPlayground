import{a as e,j as r,a9 as n,t,v as o,I as i,n as s,m as a,E as c,A as d,h as l,e as u,k as m,an as p}from"./react-vendor-HWZo9XlX.js";import{a as h}from"./styled-vendor-DGSsHzxd.js";import{l as f,c as g,h as v}from"./utils-lzKqcxFi.js";import{u as y}from"./v8u-services-CviCpCEt.js";import{a1 as x,C as b}from"./components-oauth-qq-maH2w.js";const w=new class{cache=new Map;CACHE_DURATION=3e5;async discoverConfiguration(e,r="us"){try{f.discovery("DiscoveryService","Starting OpenID configuration discovery",{environmentId:e,region:r});const n=`${e}-${r}`,t=this.cache.get(n);if(t&&Date.now()-t.timestamp<this.CACHE_DURATION)return f.discovery("DiscoveryService","Using cached configuration",{environmentId:e}),{success:!0,configuration:t.config,environmentId:e};const o=`/api/discovery?environment_id=${e}&region=${r}`;f.discovery("DiscoveryService","Fetching configuration via backend proxy",{discoveryUrl:o});const i=await fetch(o,{method:"GET",headers:{Accept:"application/json","Content-Type":"application/json"}});if(!i.ok){const r=await i.json();f.warn("DiscoveryService","Backend discovery failed",{status:i.status,error:r});const n={issuer:`https://auth.pingone.com/${e}/as`,authorization_endpoint:`https://auth.pingone.com/${e}/as/authorize`,token_endpoint:`https://auth.pingone.com/${e}/as/token`,userinfo_endpoint:`https://auth.pingone.com/${e}/as/userinfo`,jwks_uri:`https://auth.pingone.com/${e}/as/jwks`,scopes_supported:["openid","profile","email","address","phone"],response_types_supported:["code","id_token","token","id_token token","code id_token","code token","code id_token token"],grant_types_supported:["authorization_code","implicit","client_credentials","refresh_token","urn:ietf:params:oauth:grant-type:device_code"],subject_types_supported:["public"],id_token_signing_alg_values_supported:["RS256","RS384","RS512"],token_endpoint_auth_methods_supported:["client_secret_basic","client_secret_post","private_key_jwt","client_secret_jwt"],claims_supported:["sub","iss","aud","exp","iat","auth_time","nonce","acr","amr","azp","at_hash","c_hash"],code_challenge_methods_supported:["S256","plain"],request_parameter_supported:!0,request_uri_parameter_supported:!0,require_request_uri_registration:!1,end_session_endpoint:`https://auth.pingone.com/${e}/as/signoff`,revocation_endpoint:`https://auth.pingone.com/${e}/as/revoke`,introspection_endpoint:`https://auth.pingone.com/${e}/as/introspect`,device_authorization_endpoint:`https://auth.pingone.com/${e}/as/device_authorization`,pushed_authorization_request_endpoint:`https://auth.pingone.com/${e}/as/par`};return f.info("DiscoveryService","Using fallback configuration",{environmentId:e,issuer:n.issuer}),{success:!0,configuration:n,environmentId:e}}const s=await i.json();if(!s.success)throw new Error(s.error||"Discovery failed");const a=s.configuration;if(!a.issuer||!a.authorization_endpoint||!a.token_endpoint)throw new Error("Invalid OpenID configuration: missing required fields");return this.cache.set(n,{config:a,timestamp:Date.now()}),f.success("DiscoveryService","OpenID configuration discovered successfully",{environmentId:e,issuer:a.issuer,endpoints:{authorization:a.authorization_endpoint,token:a.token_endpoint,userinfo:a.userinfo_endpoint,jwks:a.jwks_uri},fallback:s.fallback||!1}),{success:!0,configuration:a,environmentId:e}}catch(n){return f.error("DiscoveryService","Failed to discover OpenID configuration",{environmentId:e,region:r,error:n instanceof Error?n.message:"Unknown error"}),{success:!1,error:n instanceof Error?n.message:"Discovery failed",environmentId:e}}}clearCache(){this.cache.clear(),f.discovery("DiscoveryService","Discovery cache cleared")}getCachedConfiguration(e,r="us"){const n=`${e}-${r}`,t=this.cache.get(n);return t&&Date.now()-t.timestamp<this.CACHE_DURATION?t.config:null}validateEnvironmentId(e){return/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e)}extractEnvironmentIdFromUrl(e){try{const r=new URL(e).pathname.split("/");for(let e=0;e<r.length;e++)if(this.validateEnvironmentId(r[e]))return r[e];return null}catch{return null}}},j=h.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`,_=h.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
`,k=h.div`
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`,D=h.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,E=h.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`,I=h.div`
  padding: 1.5rem;
`,C=h.div`
  margin-bottom: 1.5rem;
`,S=h.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`,U=h.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    color: #6b7280;
  }
`,z=h.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,O=h.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${({variant:e="primary",size:r="normal"})=>`\n    ${"small"===r?"\n      padding: 0.375rem 0.75rem;\n      font-size: 0.75rem;\n    ":"\n      padding: 0.75rem 1.5rem;\n      font-size: 0.875rem;\n    "}\n\n    ${"primary"===e?"\n      background: #3b82f6;\n      color: white;\n\n      &:hover:not(:disabled) {\n        background: #2563eb;\n        transform: translateY(-1px);\n      }\n    ":"\n      background: #f3f4f6;\n      color: #374151;\n      border: 1px solid #d1d5db;\n\n      &:hover:not(:disabled) {\n        background: #e5e7eb;\n      }\n    "}\n  `}

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,A=h.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;

  ${({type:e})=>{switch(e){case"success":return"\n          background: #f0fdf4;\n          border: 1px solid #bbf7d0;\n          color: #166534;\n        ";case"error":return"\n          background: #fef2f2;\n          border: 1px solid #fecaca;\n          color: #dc2626;\n        ";case"info":return"\n          background: #eff6ff;\n          border: 1px solid #bfdbfe;\n          color: #1d4ed8;\n        "}}}
`,T=h.div`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
`,$=h.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }
`,P=h.span`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`,R=h.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  color: #6b7280;
  max-width: 60%;
  word-break: break-all;
`,M=h.button`
	background: none;
	border: none;
	cursor: pointer;
	padding: 0.25rem;
	border-radius: 0.25rem;
	color: #6b7280;
	transition: all 0.2s;

	&:hover {
		background: #f3f4f6;
		color: #374151;
	}
`,L=h.pre`
	background: #1e293b;
	color: #e2e8f0;
	padding: 1rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	line-height: 1.5;
	margin: 0;
	max-height: 400px;
	overflow-y: auto;

	/* JSON syntax highlighting */
	.hljs-string {
		color: #a3d977;
	}

	.hljs-number {
		color: #f39c12;
	}

	.hljs-boolean {
		color: #f39c12;
	}

	.hljs-null {
		color: #f39c12;
	}

	.hljs-key {
		color: #60a5fa;
	}
`,N=({onConfigurationDiscovered:m,onClose:p})=>{const h=e.useId(),b=e.useId(),[N,F]=e.useState(()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);if(r.credentials?.environmentId)return r.credentials.environmentId}}catch{return""}return""}),[J,Y]=e.useState("us"),[q,G]=e.useState(!1),[K,H]=e.useState(null),[B,W]=e.useState(null),[V,X]=e.useState(null),[Z,Q]=e.useState(null),[ee,re]=e.useState("formatted");e.useEffect(()=>{try{const r=g.loadDiscoveryPreferences();if(r.environmentId)F(r.environmentId),f.info("DiscoveryPanel","Pre-populated Environment ID from discovery preferences",{environmentId:r.environmentId});else{const r=g.loadConfigCredentials(),n=g.loadAuthzFlowCredentials();let t=r;if(t.environmentId||t.clientId||(t=n),!t.environmentId&&!t.clientId)try{const e=g.getAllCredentials();e.environmentId&&(t=e)}catch(e){}t.environmentId&&(F(t.environmentId),f.info("DiscoveryPanel","Pre-populated Environment ID from stored credentials",{environmentId:t.environmentId}))}Y(r.region),f.info("DiscoveryPanel","Pre-populated Region from discovery preferences",{region:r.region})}catch(e){f.error("DiscoveryPanel","Failed to load stored discovery preferences",e)}},[]),e.useEffect(()=>{const e=()=>{try{const e=y.loadCredentials();e?.environmentId&&!N.trim()&&(F(e.environmentId),f.info("DiscoveryPanel","Auto-populated Environment ID from worker token",{environmentId:e.environmentId}))}catch(e){f.error("DiscoveryPanel","Failed to update environment ID from worker token:",e)}};return window.addEventListener("workerTokenUpdated",e),()=>{window.removeEventListener("workerTokenUpdated",e)}},[N]);const ne=async(e,r)=>{try{await navigator.clipboard.writeText(e),Q(r),v.showCopySuccess(r),setTimeout(()=>Q(null),2e3)}catch(n){v.showCopyError(r)}};return r.jsx(j,{onClick:p,children:r.jsxs(_,{onClick:e=>e.stopPropagation(),children:[r.jsxs(k,{children:[r.jsxs(D,{children:[r.jsx(n,{}),"PingOne Discovery"]}),r.jsx(E,{onClick:p,children:r.jsx(t,{})})]}),r.jsxs(I,{children:[r.jsx("p",{style:{margin:"0 0 1.5rem 0",color:"#6b7280"},children:"Discover PingOne OpenID Connect configuration automatically. This will populate your configuration with the correct endpoints and settings."}),r.jsxs(C,{children:[r.jsx(S,{htmlFor:b,children:"Environment ID"}),r.jsx(U,{id:b,type:"text",value:N,onChange:e=>{return r=e.target.value,F(r),void(r.trim()&&g.saveDiscoveryPreferences({environmentId:r}));var r},placeholder:"Enter your PingOne Environment ID (UUID format)",disabled:q}),r.jsx("small",{style:{color:"#6b7280",fontSize:"0.75rem"},children:"Or paste a PingOne URL to auto-extract the Environment ID"})]}),r.jsxs(C,{children:[r.jsx(S,{htmlFor:h,children:"Region"}),r.jsxs(z,{id:h,value:J,onChange:e=>{return r=e.target.value,Y(r),void g.saveDiscoveryPreferences({region:r});var r},disabled:q,children:[r.jsx("option",{value:"us",children:"United States (us)"}),r.jsx("option",{value:"eu",children:"Europe (eu)"}),r.jsx("option",{value:"ca",children:"Canada (ca)"}),r.jsx("option",{value:"ap",children:"Asia Pacific (ap)"})]})]}),r.jsx("div",{style:{display:"flex",gap:"1rem",marginBottom:"1.5rem"},children:r.jsxs(O,{variant:"primary",onClick:async()=>{if(!N.trim())return H({type:"error",message:"Please enter an Environment ID"}),void v.showError("Please enter a valid PingOne Environment ID to discover endpoints");if(!w.validateEnvironmentId(N))return H({type:"error",message:"Invalid Environment ID format. Please enter a valid UUID."}),void v.showError("Environment ID must be a valid UUID format (e.g., 12345678-1234-1234-1234-123456789abc)");g.saveDiscoveryPreferences({environmentId:N,region:J}),G(!0),H(null);try{const e=await w.discoverConfiguration(N,J);e.success&&e.configuration?(W(e.configuration),X(JSON.stringify(e.configuration,null,2)),H({type:"success",message:"Configuration discovered successfully. Switch between Formatted and JSON views to see the response."}),v.showSuccess("saveConfigurationSuccess"),f.success("DiscoveryPanel","Configuration discovered successfully",{environmentId:N,issuer:e.configuration.issuer})):(H({type:"error",message:e.error||"Failed to discover configuration"}),v.showError("networkError"))}catch(e){v.showError("networkError"),H({type:"error",message:"Failed to discover configuration. Please verify your Environment ID and try again."})}},disabled:q||!N.trim(),children:[q?r.jsx(o,{className:"animate-spin"}):r.jsx(i,{}),q?"Discovering...":"Discover Configuration"]})}),K&&r.jsxs(A,{type:K.type,children:["success"===K.type&&r.jsx(s,{}),"error"===K.type&&r.jsx(a,{}),"info"===K.type&&r.jsx(c,{}),K.message]}),B&&r.jsxs(T,{children:[r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[r.jsx("h3",{style:{margin:"0",fontSize:"1rem",fontWeight:"600"},children:"Discovered Configuration"}),r.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[r.jsxs(O,{variant:"formatted"===ee?"primary":"secondary",size:"small",onClick:()=>re("formatted"),children:[r.jsx(d,{size:14}),"Formatted"]}),r.jsxs(O,{variant:"json"===ee?"primary":"secondary",size:"small",onClick:()=>re("json"),children:[r.jsx(l,{size:14}),"JSON"]})]})]}),"formatted"===ee?r.jsxs(r.Fragment,{children:[r.jsxs($,{children:[r.jsx(P,{children:"Issuer"}),r.jsxs(R,{children:[B.issuer,r.jsx(M,{onClick:()=>ne(B.issuer,"issuer"),title:"Copy Issuer",children:"issuer"===Z?r.jsx(u,{size:14}):r.jsx(x,{size:14})})]})]}),r.jsxs($,{children:[r.jsx(P,{children:"Authorization Endpoint"}),r.jsxs(R,{children:[B.authorization_endpoint,r.jsx(M,{onClick:()=>ne(B.authorization_endpoint,"auth"),title:"Copy Authorization Endpoint",children:"auth"===Z?r.jsx(u,{size:14}):r.jsx(x,{size:14})})]})]}),r.jsxs($,{children:[r.jsx(P,{children:"Token Endpoint"}),r.jsxs(R,{children:[B.token_endpoint,r.jsx(M,{onClick:()=>ne(B.token_endpoint,"token"),title:"Copy Token Endpoint",children:"token"===Z?r.jsx(u,{size:14}):r.jsx(x,{size:14})})]})]}),r.jsxs($,{children:[r.jsx(P,{children:"UserInfo Endpoint"}),r.jsxs(R,{children:[B.userinfo_endpoint,r.jsx(M,{onClick:()=>ne(B.userinfo_endpoint,"userinfo"),title:"Copy UserInfo Endpoint",children:"userinfo"===Z?r.jsx(u,{size:14}):r.jsx(x,{size:14})})]})]}),r.jsxs($,{children:[r.jsx(P,{children:"JWKS URI"}),r.jsxs(R,{children:[B.jwks_uri,r.jsx(M,{onClick:()=>ne(B.jwks_uri,"jwks"),title:"Copy JWKS URI",children:"jwks"===Z?r.jsx(u,{size:14}):r.jsx(x,{size:14})})]})]})]}):r.jsxs("div",{style:{marginTop:"1rem"},children:[r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"},children:[r.jsx("strong",{children:"Raw JSON Response"}),r.jsxs(O,{variant:"secondary",size:"small",onClick:()=>V&&ne(V,"json"),children:[r.jsx(x,{size:14}),"Copy JSON"]})]}),r.jsx(L,{children:V})]}),r.jsxs("div",{style:{marginTop:"1rem",display:"flex",gap:"1rem"},children:[r.jsxs(O,{variant:"primary",onClick:()=>{if(B)try{m(B,N),W(null),X(null),re("formatted"),v.showSuccess("saveConfigurationSuccess"),p()}catch(e){v.showError("stepError"),f.error("DiscoveryPanel","Failed to apply configuration",e)}else v.showError("stepError")},children:[r.jsx(s,{}),"Apply Configuration"]}),B?r.jsxs(O,{variant:"secondary",onClick:()=>{W(null),X(null),re("formatted"),v.showSuccess("saveConfigurationSuccess")},children:[r.jsx(o,{}),"Clear Configuration"]}):null,r.jsxs(O,{variant:"secondary",onClick:()=>{v.showSuccess("saveConfigurationSuccess"),p()},children:[r.jsx(t,{}),"Close"]})]})]})]})]})})};const F=new class{MAX_RETRIES=3;RETRY_DELAY=1e3;TIMEOUT=15e3;async discover(e,r="na"){try{try{return{success:!0,document:await this.tryBackendProxyWithFailover(e,r),issuerUrl:`https://auth.pingone.com/${e}`,provider:"pingone"}}catch(n){}try{return{success:!0,document:await this.tryDirectDiscovery(e),issuerUrl:`https://auth.pingone.com/${e}`,provider:"pingone"}}catch(t){}return{success:!0,document:this.generateFallbackDocument(e),issuerUrl:`https://auth.pingone.com/${e}/as`,provider:"pingone"}}catch(o){return{success:!1,error:o instanceof Error?o.message:"Discovery failed after all retries"}}}async tryBackendProxyWithFailover(e,r){const n=[r,"na","us","eu","ca","ap"].filter((e,r,n)=>n.indexOf(e)===r);for(const o of n)try{return await this.tryBackendProxyWithRetry(e,o)}catch(t){}throw new Error("All regions failed")}async tryBackendProxyWithRetry(e,r){let n=null;for(let o=1;o<=this.MAX_RETRIES;o++)try{const n=`/api/discovery?environment_id=${e}&region=${r}`,t=new AbortController,o=setTimeout(()=>t.abort(),this.TIMEOUT);try{const e=await fetch(n,{method:"GET",headers:{Accept:"application/json","Cache-Control":"no-cache"},signal:t.signal});if(clearTimeout(o),!e.ok){const r=await e.text().catch(()=>"Unable to read response");throw new Error(`Backend returned ${e.status}: ${r.substring(0,200)}`)}const r=await e.json();if(!r.success)throw new Error(r.error_description||r.error||"Discovery failed");const i=r.configuration||r.document;if(!i||!i.issuer)throw new Error("Invalid discovery document received");return i}finally{clearTimeout(o)}}catch(t){if(n=t instanceof Error?t:new Error(String(t)),o<this.MAX_RETRIES){const e=this.RETRY_DELAY*2**(o-1);await this.sleep(e)}}throw n||new Error("All retry attempts failed")}async tryDirectDiscovery(e){const r=`https://auth.pingone.com/${e}/as/.well-known/openid-configuration`,n=new AbortController,t=setTimeout(()=>n.abort(),this.TIMEOUT);try{const e=await fetch(r,{method:"GET",headers:{Accept:"application/json","User-Agent":"MasterFlow API"},signal:n.signal,mode:"cors"});if(!e.ok)throw new Error(`HTTP ${e.status}: ${e.statusText}`);return await e.json()}finally{clearTimeout(t)}}generateFallbackDocument(e){const r=`https://auth.pingone.com/${e}/as`;return{issuer:`https://auth.pingone.com/${e}`,authorization_endpoint:`${r}/authorize`,token_endpoint:`${r}/token`,userinfo_endpoint:`${r}/userinfo`,jwks_uri:`${r}/jwks`,response_types_supported:["code","token","id_token","code token","code id_token","token id_token","code token id_token"],grant_types_supported:["authorization_code","implicit","refresh_token","client_credentials","urn:ietf:params:oauth:grant-type:device_code"],subject_types_supported:["public"],id_token_signing_alg_values_supported:["RS256","RS384","RS512"],scopes_supported:["openid","profile","email","address","phone"],claims_supported:["sub","iss","aud","exp","iat","auth_time","nonce","acr","amr","azp","at_hash","c_hash"],end_session_endpoint:`${r}/signoff`,revocation_endpoint:`${r}/revoke`,introspection_endpoint:`${r}/introspect`,device_authorization_endpoint:`${r}/device`,pushed_authorization_request_endpoint:`${r}/par`}}sleep(e){return new Promise(r=>setTimeout(r,e))}};class J{cache=new Map;DEFAULT_TIMEOUT=15e3;DEFAULT_CACHE_TIMEOUT=36e5;async discover(e){try{const{input:r,timeout:n=this.DEFAULT_TIMEOUT,cacheTimeout:t=this.DEFAULT_CACHE_TIMEOUT}=e,{provider:o,issuerUrl:i}=await this.resolveInput(r),s=this.getCachedDocument(i,t);if(s)return{success:!0,document:s,issuerUrl:i,provider:o,cached:!0};const a=await this.fetchDiscoveryDocument(i,n);return this.validateDiscoveryDocument(a,i),this.cacheDocument(i,a),{success:!0,document:a,issuerUrl:i,provider:o,cached:!1}}catch(r){return{success:!1,error:r instanceof Error?r.message:"Unknown discovery error"}}}async resolveInput(e){if(!e||"string"!=typeof e)throw new Error("Invalid input: input must be a non-empty string");const r=e.startsWith("/")?e.substring(1):e;if(this.isPingOneEnvironmentId(r))return{provider:"pingone",issuerUrl:await this.resolvePingOneEnvironmentId(r)};if(this.isValidIssuerUrl(r)){return{provider:this.detectProvider(r),issuerUrl:r}}if(this.isProviderName(r)){return{provider:r,issuerUrl:await this.resolveProviderName(r)}}throw new Error(`Invalid input: ${r}. Expected Environment ID, issuer URL, or provider name.`)}isPingOneEnvironmentId(e){return/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e)||/^[a-zA-Z0-9]{8,32}$/.test(e)}async resolvePingOneEnvironmentId(e){return`https://auth.pingone.com/${e}/as`}isValidIssuerUrl(e){const r=e.startsWith("/")?e.substring(1):e;try{return"https:"===new URL(r).protocol&&(r.includes("/.well-known/openid_configuration")||r.includes("/as")||r.includes("/oauth")||r.includes("/auth"))}catch{return!1}}detectProvider(e){return e.includes("pingone.com")?"pingone":e.includes("google.com")?"google":e.includes("auth0.com")?"auth0":e.includes("microsoftonline.com")?"microsoft":"generic"}isProviderName(e){return["pingone","google","auth0","microsoft"].includes(e.toLowerCase())}async resolveProviderName(e){switch(e.toLowerCase()){case"pingone":throw new Error("PingOne requires Environment ID or issuer URL");case"google":return"https://accounts.google.com";case"auth0":throw new Error("Auth0 requires domain (e.g., your-domain.auth0.com)");case"microsoft":throw new Error("Microsoft requires tenant ID or common");default:throw new Error(`Unknown provider: ${e}`)}}async fetchDiscoveryDocument(e,r){const n=e.endsWith("/.well-known/openid_configuration")?e:`${e.replace(/\/$/,"")}/.well-known/openid_configuration`;if(e.includes("pingone.com")){const r=e.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);if(r){const e=r[1],n=await F.discover(e,"na");if(!n.success||!n.document)throw new Error(n.error||"Bulletproof discovery failed");return n.document}}const t=new AbortController,o=setTimeout(()=>t.abort(),r);try{const e=await fetch(n,{method:"GET",headers:{Accept:"application/json","User-Agent":"OAuth Playground Discovery Service"},signal:t.signal});if(clearTimeout(o),!e.ok)throw new Error(`Discovery request failed: ${e.status} ${e.statusText}`);return await e.json()}catch(i){throw clearTimeout(o),i}}validateDiscoveryDocument(e,r){const n=["issuer","authorization_endpoint","token_endpoint","jwks_uri","response_types_supported","grant_types_supported"];for(const t of n)if(!e[t])throw new Error(`Missing required field in discovery document: ${t}`);e.issuer}getCachedDocument(e,r){const n=this.cache.get(e);return n&&Date.now()-n.timestamp<r?n.document:null}cacheDocument(e,r){this.cache.set(e,{document:r,timestamp:Date.now()})}getSupportedProviders(){return[{name:"PingOne",type:"pingone",description:"Environment ID or issuer URL (e.g., https://auth.pingone.com/{env-id}/as)"},{name:"Google OAuth",type:"google",description:"Google issuer URL (e.g., https://accounts.google.com)"},{name:"Microsoft Entra ID",type:"microsoft",description:"Microsoft tenant ID or common (e.g., https://login.microsoftonline.com/{tenant-id}/v2.0)"},{name:"Generic OIDC",type:"generic",description:"Any RFC 8414 compliant OIDC provider"}]}clearCache(){this.cache.clear()}}const Y=new J;const q=new class{STORAGE_KEY="oidc_discovery_cache";CACHE_DURATION=864e5;LAST_USED_KEY="oidc_last_used_environment";saveDiscovery(e){try{const r=this.getCache();r[e.environmentId]={...e,timestamp:Date.now()},localStorage.setItem(this.STORAGE_KEY,JSON.stringify(r)),this.setLastUsedEnvironment(e.environmentId)}catch(r){}}getDiscovery(e){try{const r=this.getCache()[e];return r?Date.now()-r.timestamp>this.CACHE_DURATION?(this.removeDiscovery(e),null):r:null}catch(r){return null}}getDiscoveryByIssuer(e){try{const r=this.getCache();for(const n of Object.values(r))if(n.issuerUrl===e)return Date.now()-n.timestamp>this.CACHE_DURATION?(this.removeDiscovery(n.environmentId),null):n;return null}catch(r){return null}}removeDiscovery(e){try{const r=this.getCache();delete r[e],localStorage.setItem(this.STORAGE_KEY,JSON.stringify(r))}catch(r){}}getAllDiscoveries(){try{const e=this.getCache(),r=Date.now(),n=Object.values(e).filter(e=>r-e.timestamp<this.CACHE_DURATION),t=new Set(n.map(e=>e.environmentId)),o=Object.keys(e);for(const i of o)t.has(i)||delete e[i];return localStorage.setItem(this.STORAGE_KEY,JSON.stringify(e)),n}catch(e){return[]}}clearAll(){try{localStorage.removeItem(this.STORAGE_KEY),localStorage.removeItem(this.LAST_USED_KEY)}catch(e){}}getCache(){try{const e=localStorage.getItem(this.STORAGE_KEY);return e?JSON.parse(e):{}}catch(e){return{}}}setLastUsedEnvironment(e){try{localStorage.setItem(this.LAST_USED_KEY,e)}catch(r){}}getLastUsedEnvironment(){try{return localStorage.getItem(this.LAST_USED_KEY)}catch(e){return null}}getLastUsedDiscovery(){const e=this.getLastUsedEnvironment();return e?this.getDiscovery(e):null}hasDiscovery(e){return null!==this.getDiscovery(e)}getCachedEnvironmentIds(){return this.getAllDiscoveries().map(e=>e.environmentId)}refreshDiscovery(e){const r=this.getDiscovery(e);r&&this.saveDiscovery(r)}exportDiscoveries(){const e=this.getCache();return JSON.stringify(e,null,2)}importDiscoveries(e){try{const r=JSON.parse(e);if("object"!=typeof r||null===r)throw new Error("Invalid import data");let n=0;for(const[e,t]of Object.entries(r))if(this.isValidDiscoveryData(t)){this.getCache()[e]=t,n++}return localStorage.setItem(this.STORAGE_KEY,JSON.stringify(this.getCache())),{success:!0,count:n}}catch(r){return{success:!1,count:0,error:r instanceof Error?r.message:"Import failed"}}}isValidDiscoveryData(e){return e&&"object"==typeof e&&"string"==typeof e.environmentId&&"string"==typeof e.issuerUrl&&"string"==typeof e.provider&&"number"==typeof e.timestamp&&e.document&&"object"==typeof e.document}getStats(){const e=this.getCache(),r=Object.values(e),n=Date.now(),t=r.filter(e=>n-e.timestamp<this.CACHE_DURATION),o=r.filter(e=>n-e.timestamp>=this.CACHE_DURATION),i=t.map(e=>e.timestamp),s=i.length>0?Math.min(...i):null,a=i.length>0?Math.max(...i):null;return{totalCached:r.length,validCached:t.length,expiredCached:o.length,lastUsedEnvironment:this.getLastUsedEnvironment(),oldestEntry:s,newestEntry:a}}},G=h.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.5rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	position: relative;
	z-index: 1;
	min-width: 0;
	overflow: visible;
	width: 100%;
	box-sizing: border-box;
`,K=h.div`
	display: flex;
	gap: 0.75rem;
	align-items: flex-start;
`,H=h.input`
	flex: 1;
	padding: 0.75rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`,B=h.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background-color: #3b82f6;
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-weight: 600;
	font-size: 0.875rem;
	cursor: pointer;
	transition: background-color 0.2s;
	opacity: ${e=>e.$loading?.7:1};

	&:hover:not(:disabled) {
		background-color: #2563eb;
	}

	&:disabled {
		cursor: not-allowed;
	}
`,W=h.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 0.75rem;
	margin-top: 1rem;
`,V=h.div`
	padding: 0.75rem;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	font-size: 0.75rem;
`,X=h.div`
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.25rem;
`,Z=h.div`
	color: #6b7280;
	line-height: 1.4;
`,Q=h.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	backdrop-filter: blur(4px);
`,ee=h.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	text-align: center;
	min-width: 300px;
	max-width: 500px;
`,re=h.div`
	width: 60px;
	height: 60px;
	border: 4px solid #e5e7eb;
	border-top-color: #3b82f6;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin: 0 auto 1.5rem;

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
`,ne=h.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.5rem;
`,te=h.p`
	color: #6b7280;
	font-size: 0.875rem;
	margin: 0;
`,oe=h.p`
	color: ${e=>e.color};
	font-size: 0.875rem;
	margin: 0.5rem 0 0 0;
	font-weight: 500;
	transition: color 0.3s ease;
`,ie=h.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;

	${({$type:e})=>{switch(e){case"success":return"\n\t\t\t\t\tbackground-color: #f0fdf4;\n\t\t\t\t\tcolor: #166534;\n\t\t\t\t\tborder: 1px solid #bbf7d0;\n\t\t\t\t";case"error":return"\n\t\t\t\t\tbackground-color: #fef2f2;\n\t\t\t\t\tcolor: #991b1b;\n\t\t\t\t\tborder: 1px solid #fecaca;\n\t\t\t\t";case"info":return"\n\t\t\t\t\tbackground-color: #eff6ff;\n\t\t\t\t\tcolor: #1e40af;\n\t\t\t\t\tborder: 1px solid #bfdbfe;\n\t\t\t\t"}}}
`,se=h.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-top: 1rem;
`,ae=h.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #374151;
`,ce=h.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`,de=h.div`
	font-size: 0.75rem;
	color: #6b7280;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	padding: 0.25rem 0.5rem;
	background: #f3f4f6;
	border-radius: 0.25rem;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background: #e5e7eb;
	}
`,le=h.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: #065f46;
`,ue=h.span`
	font-weight: 600;
	color: #047857;
`,me=h.span`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	word-break: break-all;
`,pe=h.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 1rem;
	padding: 0.75rem;
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
`,he=h.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #2563eb;
	}

	&:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}
`,fe=h.div`
	overflow: ${e=>e.$isOpen?"visible":"hidden"};
	transition: ${e=>e.$isOpen?"opacity 0.3s ease":"all 0.3s ease"};
	max-height: ${e=>e.$isOpen?"none":"0"};
	opacity: ${e=>e.$isOpen?"1":"0"};
	min-width: 0;
	width: 100%;
	box-sizing: border-box;
`,ge=h.div`
	margin-top: 1rem;
	padding: 1rem;
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	min-width: 0;
	width: 100%;
	box-sizing: border-box;
	overflow: visible;
`,ve=h.h4`
	margin: 0 0 1rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: #1e293b;
`,ye=h.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 0.5rem;
`,xe=h.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	padding: 0.75rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	flex-wrap: wrap;
`,be=h.span`
	font-weight: 500;
	color: #374151;
	min-width: 140px;
	flex-shrink: 0;
`,we=h.span`
	color: #6b7280;
	font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	word-break: break-all;
	word-wrap: break-word;
	flex: 1;
	min-width: 0;
	overflow-wrap: anywhere;
`,je=h.div`
	margin-top: 1rem;
	padding: 0.75rem;
	background: #f0f9ff;
	border: 1px solid #bae6fd;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	color: #0c4a6e;
`,_e=({onDiscoveryComplete:n,initialInput:o="",placeholder:s="Enter Environment ID, issuer URL, or provider...",showProviderInfo:a=!0})=>{const[c,l]=e.useState(o),[h,f]=e.useState(!1),[g,v]=e.useState(null),[y,x]=e.useState(null),[w,j]=e.useState(!1),[_,k]=e.useState(!1),[D,E]=e.useState(""),[I,C]=e.useState("#6b7280"),[S,U]=e.useState(null),z=[{text:"Please be patient, discovering OIDC configuration...",color:"#6b7280"},{text:"Still working, fetching endpoints from server...",color:"#3b82f6"},{text:"Almost there, validating configuration...",color:"#10b981"},{text:"Finalizing discovery process...",color:"#f59e0b"},{text:"Processing OIDC metadata...",color:"#ef4444"},{text:"Connecting to authentication server...",color:"#8b5cf6"},{text:"Retrieving authorization endpoints...",color:"#06b6d4"},{text:"Loading token configuration...",color:"#84cc16"}];e.useEffect(()=>{if(!_)return void E("");let e=0;E(z[0].text),C(z[0].color);const r=setInterval(()=>{e=(e+1)%z.length,E(z[e].text),C(z[e].color)},3e3);return()=>clearInterval(r)},[_]),e.useEffect(()=>{const e=q.getLastUsedDiscovery();e&&(U(e.environmentId),o?.trim()||(l(e.environmentId),v({type:"info",message:`Restored last used: ${e.provider} (${e.environmentId.substring(0,8)}...)`})))},[o]);const O=e.useCallback(async()=>{if(c.trim()){f(!0),k(!0),v(null),x(null),j(!1);try{const e=c.trim(),r=q.getDiscovery(e)||q.getDiscoveryByIssuer(e);if(r){const e={success:!0,document:r.document,issuerUrl:r.issuerUrl,provider:r.provider,cached:!0};return await new Promise(e=>setTimeout(e,500)),v({type:"success",message:`Using cached ${r.provider} endpoints`}),x(e),U(r.environmentId),n(e),f(!1),void k(!1)}const t=await Y.discover({input:e,timeout:1e4});if(t.success&&t.document&&t.issuerUrl){const r=t.issuerUrl.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i),o=r?r[1]:e,i={environmentId:o,issuerUrl:t.issuerUrl,provider:t.provider||"unknown",document:t.document,timestamp:Date.now()};q.saveDiscovery(i),v({type:"success",message:`Successfully discovered and saved ${t.provider} endpoints`}),x(t),U(o),n(t)}else v({type:"error",message:t.error||"Discovery failed"})}catch(e){v({type:"error",message:e instanceof Error?e.message:"Discovery failed"})}finally{f(!1),k(!1)}}else v({type:"error",message:"Please enter an Environment ID, issuer URL, or provider name"})},[c,n]),A=e.useCallback(e=>{l(e)},[]),T=Y.getSupportedProviders();return r.jsxs(G,{children:[r.jsxs(K,{children:[r.jsx(H,{type:"text",value:c,onChange:e=>l(e.target.value),placeholder:s,disabled:h,onKeyPress:e=>"Enter"===e.key&&!h&&O()}),c.trim()&&(()=>{const e=c.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);return e?b.identifier(e[1],"Environment ID"):b.identifier(c,"Discovery Input")})(),r.jsxs(B,{onClick:O,disabled:h||!c.trim(),$loading:h,children:[h?r.jsx(i,{className:"animate-spin"}):r.jsx(i,{}),h?"Discovering...":"OIDC Discovery"]})]}),S&&r.jsxs(le,{children:[r.jsx(ue,{children:"Last Environment ID"}),r.jsxs(me,{children:[S,b.identifier(S,"Last Environment ID")]})]}),g&&r.jsxs(ie,{$type:g.type,children:["success"===g.type?r.jsx(u,{}):"error"===g.type?r.jsx(t,{}):r.jsx(m,{}),g.message]}),a&&r.jsxs(r.Fragment,{children:[r.jsx(W,{children:T.map(e=>r.jsxs(V,{children:[r.jsx(X,{children:e.name}),r.jsx(Z,{children:e.description})]},e.type))}),r.jsxs(se,{children:[r.jsx(ae,{children:"Examples:"}),r.jsxs(ce,{children:[r.jsx(de,{onClick:()=>A("12345678-1234-1234-1234-123456789012"),children:"PingOne Environment ID: 12345678-1234-1234-1234-123456789012"}),r.jsx(de,{onClick:()=>A("https://auth.pingone.com/12345678-1234-1234-1234-123456789012/as"),children:"PingOne Issuer: https://auth.pingone.com/12345678-1234-1234-1234-123456789012/as"}),r.jsx(de,{onClick:()=>A("https://accounts.google.com"),children:"Google OAuth: https://accounts.google.com"}),r.jsx(de,{onClick:()=>A("https://your-domain.auth0.com"),children:"Auth0 Domain: https://your-domain.auth0.com"}),r.jsx(de,{onClick:()=>A("https://login.microsoftonline.com/your-tenant-id/v2.0"),children:"Microsoft: https://login.microsoftonline.com/your-tenant-id/v2.0"})]})]})]}),y?.success&&y.document&&r.jsxs(pe,{children:[r.jsxs(he,{onClick:()=>j(!w),children:[w?r.jsx(p,{size:16}):r.jsx(d,{size:16}),w?"Hide Results":"Show Results"]}),r.jsxs("span",{style:{fontSize:"0.875rem",color:"#6b7280"},children:["Click to ",w?"hide":"show"," discovered endpoints"]})]}),r.jsx(fe,{$isOpen:w,children:y?.success&&y.document&&r.jsxs(ge,{children:[r.jsx(ve,{children:"OIDC Discovery Results"}),y.provider&&r.jsxs(je,{children:[r.jsx("strong",{children:"Provider:"})," ",y.provider,y.cached&&r.jsx("span",{children:" (cached)"})]}),r.jsxs(ye,{children:[y.document.authorization_endpoint&&r.jsxs(xe,{children:[r.jsx(be,{children:"Authorization:"}),r.jsx(we,{children:y.document.authorization_endpoint}),b.url(y.document.authorization_endpoint)]}),y.document.token_endpoint&&r.jsxs(xe,{children:[r.jsx(be,{children:"Token:"}),r.jsx(we,{children:y.document.token_endpoint}),b.url(y.document.token_endpoint)]}),y.document.userinfo_endpoint&&r.jsxs(xe,{children:[r.jsx(be,{children:"UserInfo:"}),r.jsx(we,{children:y.document.userinfo_endpoint}),b.url(y.document.userinfo_endpoint)]}),y.document.jwks_uri&&r.jsxs(xe,{children:[r.jsx(be,{children:"JWKS:"}),r.jsx(we,{children:y.document.jwks_uri}),b.url(y.document.jwks_uri)]}),y.document.end_session_endpoint&&r.jsxs(xe,{children:[r.jsx(be,{children:"End Session:"}),r.jsx(we,{children:y.document.end_session_endpoint}),b.url(y.document.end_session_endpoint)]}),y.document.device_authorization_endpoint&&r.jsxs(xe,{children:[r.jsx(be,{children:"Device Auth:"}),r.jsx(we,{children:y.document.device_authorization_endpoint}),b.url(y.document.device_authorization_endpoint)]}),y.document.pushed_authorization_request_endpoint&&r.jsxs(xe,{children:[r.jsx(be,{children:"PAR:"}),r.jsx(we,{children:y.document.pushed_authorization_request_endpoint}),b.url(y.document.pushed_authorization_request_endpoint)]})]})]})}),_&&r.jsx(Q,{children:r.jsxs(ee,{children:[r.jsx(re,{}),r.jsx(ne,{children:"Discovering OIDC Configuration"}),r.jsxs(te,{children:["Fetching configuration from ",c,"...",r.jsx("br",{}),"This may take a few moments."]}),D&&r.jsx(oe,{color:I,children:D})]})})]})};export{_e as C,N as D,J as a};
//# sourceMappingURL=components-oauth-discovery-DYbdhNwI.js.map
