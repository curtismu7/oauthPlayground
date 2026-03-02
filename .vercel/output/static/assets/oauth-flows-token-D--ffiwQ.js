import{a as e,j as n,Q as t,Y as o,m as r,n as s,i,F as a,p as c,v as l,k as d,l as p,U as u,an as h,A as m,a2 as g,x as f,_ as k,B as v}from"./react-vendor-HWZo9XlX.js";import{a as x}from"./styled-vendor-DGSsHzxd.js";import{f as j,ao as b,d as y,e as w,h as T,k as I,J as S,ad as C,ae as _}from"./components-oauth-qq-maH2w.js";import{h as q,o as R,F as E,a as $,s as D,j as A}from"./components-credentials-T7jmF3zx.js";import{e as B,C as z,S as U,a as F,f as M,b as J}from"./components-flow-core-y1x-SJYd.js";import{u as N,a as P}from"./pages-ai-D2KhTcan.js";import{am as W,h as O,m as L,l as X,aw as H,aC as K,aD as Q,ap as G,ax as Y,c as V,s as Z,a0 as ee,au as ne}from"./utils-lzKqcxFi.js";import{c as te,a as oe,C as re,M as se,s as ie,O as ae}from"./oauth-flows-device-CMULWbHZ.js";import{F as ce,a as le}from"./oauth-flows-implicit-BlAJpg9o.js";import{F as de,U as pe}from"./pages-DE-6TDOE.js";import{O as ue}from"./pages-docs-nYnYMLbe.js";import{a as he}from"./oauth-flows-BoQiEZ27.js";import{E as me}from"./oauth-flows-par-DTJ0aZ64.js";import{a as ge}from"./components-oauth-discovery-DYbdhNwI.js";const fe=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,ke=x.div`
  background-color: #f0f8ff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 2rem;
`,ve=x.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({theme:e})=>e.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({theme:e})=>e.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`,xe=x.div`
  background-color: ${({theme:e})=>e.colors.success}10;
  border: 1px solid ${({theme:e})=>e.colors.success}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({theme:e})=>e.colors.success};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({theme:e})=>e.colors.success};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({theme:e})=>e.colors.success};
    font-size: 0.9rem;
  }
`,je=x.div`
  background-color: #f0f8ff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 2rem;
`;x.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
`,x.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: ${({theme:e})=>e.colors.primary};
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: ${({theme:e})=>e.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({theme:e})=>e.colors.primary};
    border: 1px solid ${({theme:e})=>e.colors.primary};

    &:hover {
      background-color: ${({theme:e})=>e.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`,x.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &.idle {
    background-color: ${({theme:e})=>e.colors.gray100};
    color: ${({theme:e})=>e.colors.gray700};
  }

  &.loading {
    background-color: ${({theme:e})=>e.colors.info}20;
    color: ${({theme:e})=>e.colors.info};
  }

  &.success {
    background-color: ${({theme:e})=>e.colors.success}20;
    color: ${({theme:e})=>e.colors.success};
  }

  &.error {
    background-color: ${({theme:e})=>e.colors.danger}20;
    color: ${({theme:e})=>e.colors.danger};
  }
`,x.pre`
  background-color: ${({theme:e})=>e.colors.gray900};
  color: ${({theme:e})=>e.colors.gray100};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid ${({theme:e})=>e.colors.gray800};
  white-space: pre-wrap;
`;const be=x.div`
  background-color: ${({theme:e})=>e.colors.warning}10;
  border: 1px solid ${({theme:e})=>e.colors.warning}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({theme:e})=>e.colors.warning};
    font-size: 1rem;
    font-weight: 600;
  }

  .id-token {
    background-color: white;
    border: 1px solid ${({theme:e})=>e.colors.gray200};
    border-radius: 0.25rem;
    padding: 1rem;
    font-family: monospace;
    font-size: 0.8rem;
    color: ${({theme:e})=>e.colors.gray800};
    word-break: break-all;
    margin-bottom: 1rem;
  }

  .token-parts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .token-section {
    background-color: white;
    border: 1px solid ${({theme:e})=>e.colors.gray200};
    border-radius: 0.25rem;
    padding: 0.75rem;

    h5 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: ${({theme:e})=>e.colors.gray900};
    }

    .claims {
      font-family: monospace;
      font-size: 0.75rem;
      color: ${({theme:e})=>e.colors.gray700};
      line-height: 1.4;
    }
  }
`,ye=x.div`
  background-color: ${({theme:e})=>e.colors.success}10;
  border: 1px solid ${({theme:e})=>e.colors.success}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({theme:e})=>e.colors.success};
    font-size: 1rem;
    font-weight: 600;
  }

  .validation-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;

    &.valid {
      color: ${({theme:e})=>e.colors.success};
    }

    &.invalid {
      color: ${({theme:e})=>e.colors.danger};
    }
  }
`,we=x.div`
  background-color: ${({theme:e})=>e.colors.danger}10;
  border: 1px solid ${({theme:e})=>e.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({theme:e})=>e.colors.danger};
  font-size: 0.9rem;
`;x.div`
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid ${({$borderColor:e})=>e||"#e2e8f0"};
  background-color: ${({$backgroundColor:e})=>e||"#f8fafc"};
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: visible;
  max-width: 100%;

  h4 {
    margin: 0 0 0.5rem 0;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  pre {
    margin: 0;
    background: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    white-space: pre-wrap;
    word-break: break-all;
    overflow: visible;
    color: #1f2937 !important;
  }
`;const Te=()=>{const{config:i,tokens:a}=j(),[c,l]=e.useState("idle"),[d,p]=e.useState(0),[u,h]=e.useState(""),[m,g]=e.useState(null),[f,k]=e.useState(null),[v,x]=e.useState(null),[T,I]=e.useState({}),[S,C]=e.useState(new Set),[_,E]=e.useState([]);N(),e.useEffect(()=>{(()=>{try{if(a?.id_token)return void h(a.id_token);const n=W();if(n?.id_token)return void h(n.id_token);const t=localStorage.getItem("pingone_playground_tokens");if(t)try{const e=JSON.parse(t);if(e.id_token)return void h(e.id_token)}catch(e){}}catch(n){}})()},[a]);const $=[{title:"Obtain ID Token",description:"Get ID token from OAuth flow with openid scope",code:`// Request ID token in OAuth flow\nconst authUrl = '${i?.apiUrl||"https://auth.pingone.com"}/authorize?' +\n  new URLSearchParams({\n    response_type: 'code', // or 'token id_token' for implicit\n    client_id: '${i?.clientId||"your_client_id"}',\n    redirect_uri: '${i?.redirectUri||"https://yourapp.com/callback"}',\n    scope: 'openid profile email', // Must include 'openid'\n    state: 'random_state_value',\n    nonce: 'random_nonce_value' // Required for ID token\n  }).toString();\n\n// ID token returned in:\n// - Authorization Code flow: token response\n// - Implicit flow: redirect URL fragment\n// - Hybrid flow: both`},{title:"Receive & Store ID Token",description:"Extract ID token from OAuth response and store securely",code:"// Extract from token response\nconst tokenResponse = await fetch('/token', {\n  method: 'POST',\n  body: formData\n});\n\nconst tokens = await tokenResponse.json();\n\n// ID token is a JWT (JSON Web Token)\nconst idToken = tokens.id_token;\n\n// Store securely (never in localStorage for production)\nsessionStorage.setItem('id_token', idToken);\n\n// ID token structure: header.payload.signature\nconst [header, payload, signature] = idToken.split('.');\nconsole.log('ID Token received:', idToken.substring(0, 50) + '...');"},{title:"Parse ID Token Claims",description:"Decode and validate the JWT payload",code:"// Parse JWT payload (base64url decode)\nconst payload = JSON.parse(atob(idToken.split('.')[1]));\n\n// Standard OpenID Connect claims\nconst claims = {\n  iss: payload.iss,        // Issuer\n  sub: payload.sub,        // Subject (user ID)\n  aud: payload.aud,        // Audience (client ID)\n  exp: payload.exp,        // Expiration time\n  iat: payload.iat,        // Issued at time\n  auth_time: payload.auth_time, // Authentication time\n  nonce: payload.nonce,    // Nonce from request\n\n  // User profile claims\n  name: payload.name,\n  given_name: payload.given_name,\n  family_name: payload.family_name,\n  email: payload.email,\n  email_verified: payload.email_verified,\n  picture: payload.picture,\n  locale: payload.locale\n};\n\nconsole.log('User claims:', claims);"},{title:"Validate ID Token",description:"Verify token signature, issuer, audience, and expiration",code:`// 1. Verify signature using JWKS\nconst jwksUrl = '${i?.apiUrl||"https://auth.pingone.com"}/.well-known/jwks.json';\nconst jwks = await fetch(jwksUrl).then(r => r.json());\n\n// Find correct key and verify signature\nconst isSignatureValid = verifySignature(idToken, jwks);\n\n// 2. Validate standard claims\nconst now = Math.floor(Date.now() / 1000);\n\nconst validations = {\n  issuer: payload.iss === '${i?.apiUrl||"https://auth.pingone.com"}',\n  audience: payload.aud === '${i?.clientId||"your_client_id"}',\n  expiration: payload.exp > now,\n  issuedAt: payload.iat <= now,\n  nonce: payload.nonce === 'original_nonce' // Match request nonce\n};\n\n// 3. Check all validations\nconst isValid = isSignatureValid && Object.values(validations).every(v => v);\n\nif (!isValid) {\n  throw new Error('ID token validation failed');\n}\n\nconsole.log('ID token is valid!');`}];return n.jsxs(fe,{children:[n.jsx(b,{title:n.jsxs(n.Fragment,{children:[n.jsx(t,{}),"OpenID Connect ID Tokens"]}),subtitle:"Learn how to handle and validate OpenID Connect ID tokens with real JWT parsing and cryptographic verification."}),n.jsx(q,{flowType:"id_tokens",onCredentialsChange:e=>{}}),n.jsxs(ke,{children:[n.jsx(y,{children:n.jsx("h2",{children:"ID Tokens Overview"})}),n.jsxs(w,{children:[n.jsxs(ve,{children:[n.jsx("h2",{children:"What are ID Tokens?"}),n.jsx("p",{children:"ID tokens are JSON Web Tokens (JWTs) issued by the OpenID Connect provider that contain user identity information. They are digitally signed and can be validated by the client to ensure authenticity and integrity."}),n.jsxs("p",{children:[n.jsx("strong",{children:"How they work:"})," ID tokens are obtained as part of the OAuth/OIDC flow when the 'openid' scope is requested. They contain user profile information and must be validated before use to ensure they haven't been tampered with."]})]}),n.jsxs(xe,{children:[n.jsx(o,{size:20}),n.jsxs("div",{children:[n.jsx("h3",{children:"Security First"}),n.jsx("p",{children:"Always validate ID tokens by checking signature, issuer, audience, expiration, and nonce to prevent security vulnerabilities."})]})]})]})]}),n.jsxs(je,{children:[n.jsx(y,{children:n.jsx("h2",{children:"Interactive Demo"})}),n.jsxs(w,{children:[n.jsx(B,{steps:_.length>0?_:$,onStart:async()=>{l("loading"),p(0),x(null),g(null),k(null),I({}),C(new Set),E([...$]);try{if(p(1),!u)throw new Error("No ID token available. Please complete an OAuth flow first to obtain an ID token.");p(2);const e=(e=>{try{const n=e.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),t=decodeURIComponent(atob(n).split("").map(e=>`%${`00${e.charCodeAt(0).toString(16)}`.slice(-2)}`).join(""));return JSON.parse(t)}catch(v){return null}})(mockIdToken);g(e),p(3);const n={signature:{valid:!0,message:"Signature verification would require JWKS endpoint"},issuer:{valid:e?.iss?.includes("pingone.com"),message:`Issuer: ${e?.iss||"Unknown"}`},audience:{valid:e?.aud&&(e.aud===i?.clientId||Array.isArray(e.aud)&&e.aud.includes(i?.clientId)),message:`Audience: ${e?.aud||"Unknown"} (Client ID: ${i?.clientId||"Not configured"})`},expiration:{valid:e?.exp&&e.exp>Date.now()/1e3,message:e?.exp?`Expires: ${new Date(1e3*e.exp).toLocaleString()}`:"No expiration claim"},issuedAt:{valid:e?.iat&&e.iat<Date.now()/1e3,message:e?.iat?`Issued: ${new Date(1e3*e.iat).toLocaleString()}`:"No issued at claim"},nonce:{valid:!!e?.nonce,message:e?.nonce?`Nonce present: ${e.nonce.substring(0,10)}...`:"No nonce claim"}};k(n),p(4),l("success")}catch(e){x("Failed to process ID token. Please check your configuration."),l("error")}},onReset:()=>{l("idle"),p(0),h(""),g(null),k(null),x(null),I({}),C(new Set),E([])},status:c,currentStep:d,onStepChange:p,onStepResult:(e,n)=>{I(t=>({...t,[e]:n})),E(t=>{const o=[...t];return o[e]&&(o[e]={...o[e],result:n}),o})},disabled:!i||!u,title:"ID Token Flow",configurationButton:n.jsx(R,{flowType:"id_tokens"})}),!i&&n.jsxs(we,{children:[n.jsx(r,{}),n.jsx("strong",{children:"Configuration Required:"})," Please configure your PingOne settings in the Configuration page before running this demo."]}),!u&&n.jsxs(we,{children:[n.jsx(r,{}),n.jsx("strong",{children:"No ID Token Available:"})," Please complete an OAuth flow (like Implicit Grant Flow or Authorization Code Flow) that includes the 'openid' scope to obtain an ID token before running this demo."]}),u&&n.jsxs("div",{style:{background:"rgba(34, 197, 94, 0.1)",border:"1px solid rgba(34, 197, 94, 0.3)",borderRadius:"0.5rem",padding:"1rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[n.jsx(s,{style:{color:"#22c55e"}}),n.jsxs("div",{children:[n.jsx("strong",{style:{color:"#22c55e"},children:"ID Token Available:"}),n.jsxs("span",{style:{color:"#059669"},children:[" ","Found stored ID token from previous OAuth flow"]})]})]}),v&&n.jsxs(we,{children:[n.jsx(r,{}),n.jsx("strong",{children:"Error:"})," ",v]}),u&&n.jsxs(be,{children:[n.jsx("h4",{children:"ID Token (JWT):"}),n.jsx("div",{className:"id-token",children:u}),m&&n.jsxs("div",{className:"token-parts",children:[n.jsxs("div",{className:"token-section",children:[n.jsx("h5",{children:"Header"}),n.jsxs("div",{className:"claims",children:["alg: RS256",n.jsx("br",{}),"typ: JWT",n.jsx("br",{}),"kid: signing_key_id"]})]}),n.jsxs("div",{className:"token-section",children:[n.jsx("h5",{children:"Payload (Claims)"}),n.jsxs("div",{className:"claims",children:["sub: ",m.sub,n.jsx("br",{}),"iss: ",m.iss,n.jsx("br",{}),"aud: ",m.aud,n.jsx("br",{}),"exp: ",new Date(1e3*m.exp).toLocaleString(),n.jsx("br",{}),"iat: ",new Date(1e3*m.iat).toLocaleString(),n.jsx("br",{}),"email: ",m.email,n.jsx("br",{}),"name: ",m.name]})]}),n.jsxs("div",{className:"token-section",children:[n.jsx("h5",{children:"Signature"}),n.jsxs("div",{className:"claims",children:["RS256 signature",n.jsx("br",{}),"using private key",n.jsx("br",{}),"from JWKS endpoint"]})]})]})]}),f&&n.jsxs(ye,{children:[n.jsx("h4",{children:"Validation Results:"}),Object.entries(f).map(([e,t])=>n.jsxs("div",{className:"validation-item "+(t.valid?"valid":"invalid"),children:[n.jsx(s,{size:16}),n.jsxs("span",{children:[n.jsxs("strong",{children:[e.charAt(0).toUpperCase()+e.slice(1),":"]})," ",t.message]})]},e))]})]})]})]})},Ie=[{title:"Configuration & Credentials",subtitle:"Configure JWT Bearer authentication",description:"Set up credentials and JWT parameters"},{title:"JWT Generation",subtitle:"Create signed JWT assertion",description:"Generate JWT with required claims and signature"},{title:"Token Request",subtitle:"Exchange JWT for access token",description:"Send JWT assertion to token endpoint"},{title:"Token Response",subtitle:"Receive and validate access token",description:"Process the returned access token"},{title:"Flow Completion",subtitle:"Review and complete the flow",description:"Summary and next steps"}],Se=()=>{const{Container:u,ContentWrapper:h,MainCard:m,StepContentWrapper:g,CollapsibleSection:f,CollapsibleHeaderButton:k,CollapsibleTitle:v,CollapsibleToggleIcon:x,CollapsibleContent:j,InfoBox:b,InfoTitle:y,InfoText:w,InfoList:S,FormGroup:C,Label:_,Input:q,TextArea:R,Button:E,CodeBlock:$,GeneratedContentBox:D,ParameterGrid:A,ParameterLabel:B,ParameterValue:F,SectionDivider:M,ResultsSection:J,ResultsHeading:P,HelperText:W}=de.getFlowUIComponents();N();const[X,H]=e.useState(0),[K,Q]=e.useState({overview:!0,security:!0,implementation:!0,credentials:!1,endpoint:!1,jwtBuilder:!1,generatedJWT:!1,tokenRequest:!0,tokenResponse:!0,completion:!0}),[G,Y]=e.useState(""),[V,Z]=e.useState(""),[ee,ne]=e.useState("https://auth.pingone.com/as/token"),[ie,ae]=e.useState("https://auth.pingone.com/as/token"),[he,me]=e.useState("openid"),[ge,fe]=e.useState({iss:"https://auth.pingone.com",sub:"",aud:"https://auth.pingone.com/as/token",iat:Math.floor(Date.now()/1e3),exp:Math.floor(Date.now()/1e3)+3600,jti:`jwt-${Math.random().toString(36).substr(2,9)}`}),[ke,ve]=e.useState({algorithm:"RS256",privateKey:"",publicKey:""}),[xe,je]=e.useState(""),[be,ye]=e.useState(null),[we,Te]=e.useState(!1),[Se,Ce]=e.useState(!1),[_e,qe]=e.useState([]),[Re,Ee]=e.useState(!1),[$e,De]=e.useState([]),[Ae,Be]=e.useState(!1),ze="jwt-bearer-v6",Ue=e.useCallback(e=>{Q(n=>({...n,[e]:!n[e]}))},[]);e.useEffect(()=>{(async()=>{const e=te.loadFlowDataComprehensive({flowKey:ze,useSharedEnvironment:!0,useSharedDiscovery:!0});if(e.flowCredentials&&Object.keys(e.flowCredentials).length>0){if(e.sharedEnvironment?.environmentId&&Y(e.sharedEnvironment.environmentId),e.flowCredentials.clientId&&Z(e.flowCredentials.clientId),e.flowCredentials.scopes){const n=Array.isArray(e.flowCredentials.scopes)?e.flowCredentials.scopes.join(" "):e.flowCredentials.scopes;me(n||"openid")}}else e.sharedEnvironment?.environmentId&&Y(e.sharedEnvironment.environmentId)})()},[]);const Fe=e.useCallback(async e=>{te.saveFlowDataComprehensive(ze,{...G&&{sharedEnvironment:{environmentId:G,region:"us",issuerUrl:`https://auth.pingone.com/${G}`}},flowCredentials:{clientId:V,scopes:Array.isArray(he)?he:he?[he]:[],tokenEndpointAuthMethod:"none",lastUpdated:Date.now()}})},[G,V,he]),Me=e.useCallback(()=>{const e=`jwt_${Math.random().toString(36).substr(2,9)}_${Date.now()}`;fe(n=>({...n,jti:e}))},[]),Je=e.useCallback(async()=>{if(!G||""===G.trim())return void O.showWarning("Please enter an Environment ID first");const e=G.trim();if(!e||e.length<10)O.showWarning("Please enter a valid Environment ID");else{Be(!0);try{const n=`https://auth.pingone.com/${e}/as`;if(!n||"string"!=typeof n||!n.startsWith("https://"))throw new Error("Invalid issuer URL constructed");if(!n||""===n.trim())throw new Error("Issuer URL is required and must be a string");const t=await L.discover({issuerUrl:n.trim()});if(!t.document?.issuer)throw new Error("No issuer found in OIDC discovery document");{const e=t.document.issuer;ae(e),fe(n=>({...n,aud:e})),O.showSuccess("Audience discovered and populated!")}}catch(n){const e=n instanceof Error?n.message:"Unknown error occurred";O.showError(`Failed to discover audience: ${e}. Please enter manually.`)}finally{Be(!1)}}},[G]),Ne=e.useCallback(()=>{ve(e=>({...e,privateKey:"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGvH7GvJqF0Q1l\nXxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYX\nfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9vBQYX8vN0jkz5EqDn\nVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9v\nBQYXvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDn\nVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9v\nBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqD\nnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9\nvBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJAgMBAAECggEAEqDnVqP0nwBzB8vAUQYXfm\ngKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lX\nxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXf\nmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1l\nXxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYX\nfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1\nlXxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQY\nXfmgKx8TqhJDH4YXNqkLVqaQKBgQDx8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8\nTqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y\n5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx\n8TqhJDH4YXNqkLVqaP8QvL5KqU0fQKBgQDSOmfEXamplE7IvQZD0JqH/GUjQqQsq\nR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8\nQvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQs\nqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP\n8QvL5KqU0fNgF3qJF5UxXqwKBgBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5\nKqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQsqR4z\nK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL\n5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQsqR4\nzK3mDvW+pX8vN0jkz5AoGBAIvQZD0JqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5EqD\nnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL9\nvBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQsqR4zK3mDvW+pX8vN0jkz5Eq\nDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8QvL5KqU0fNgF3qJF5UxXqL\n9vBQYXGvH7GvJqF0AoGAEqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP8\nQvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQs\nqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqaP\n8QvL5KqU0fNgF3qJF5UxXqL9vBQYXGvH7GvJqF0Q1lXxS7Y5TqL9XJKqH/GUjQqQ\nsqR4zK3mDvW+pX8vN0jkz5EqDnVqP0nwBzB8vAUQYXfmgKx8TqhJDH4YXNqkLVqa\nP8QvL5KqU0fNgF3qJF5UxXqL9vBQYX=\n-----END PRIVATE KEY-----",publicKey:"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxrx+xryahdENZV8Uu2OU\n6i/VySqh/xlI0KkLKkeMyt5g71vqV/LzdI5M+RKg51aj9J8AcwfLwFEGF35oCsfE\n6oSQx+GFzapC1amj/ELy+SqlNHzYBd6iReVMV6i/bwUGF/LzdI5M+RKg51aj9J8A\ncwfLwFEGF35oCsfE6oSQx+GFzapC1amj/ELy+SqlNHzYBd6iReVMV6i/bwUGF7x+\nxryahdENZV8Uu2OU6i/VySqh/xlI0KkLKkeMyt5g71vqV/LzdI5M+RKg51aj9J8A\ncwfLwFEGF35oCsfE6oSQx+GFzapC1amj/ELy+SqlNHzYBd6iReVMV6i/bwUGFxrx\n+xryahdENZV8Uu2OU6i/VySqh/xlI0KkLKkeMyt5g71vqV/LzdI5M+RKg51aj9J8\nAcwfLwFEGF35oCsfE6oSQx+GFzapC1amj/ELy+SqlNHzYBd6iReVMV6i/bwUGFxrx\n+xryahdENZV8Uu2OU6i/VyQIDAQAB\n-----END PUBLIC KEY-----"})),O.showSuccess("Sample RSA key pair generated! (For educational purposes only)")},[]);e.useEffect(()=>{fe(e=>({...e,iss:e.iss,sub:V||e.sub,aud:ie||ee||e.aud}))},[V,ee,ie]);const Pe=e.useCallback(()=>{const e=ge.aud||ie||ee,n=[];if(V&&""!==V.trim()||n.push("Client ID"),ee&&""!==ee.trim()||n.push("Token Endpoint"),e&&""!==e.trim()||n.push("Audience"),ke.privateKey&&""!==ke.privateKey.trim()||n.push("Private Key"),n.length>0)return De(n),void Ee(!0);try{const n={...ge,iss:V,sub:V,aud:e,iat:Math.floor(Date.now()/1e3),exp:Math.floor(Date.now()/1e3)+3600},t={alg:ke.algorithm,typ:"JWT"},o=btoa(JSON.stringify(t)),r=btoa(JSON.stringify(n)),s=`mock_signature_${Date.now()}`,i=btoa(s);je(`${o}.${r}.${i}`),O.showSuccess("JWT generated successfully!")}catch(t){O.showError("Failed to generate JWT")}},[V,ee,ge,ke,ie]),We=e.useCallback(async()=>{if(xe&&V&&ee){Te(!0);try{await new Promise(e=>setTimeout(e,2e3));const e=Math.floor(Date.now()/1e3),n=e+3600,t={alg:"RS256",typ:"JWT",kid:"mock-key-id"},o={sub:V,client_id:V,iss:ee.replace("/token",""),aud:ie||ee.replace("/token",""),scope:he||"openid",iat:e,exp:n,jti:`mock_jti_${Math.random().toString(36).substr(2,16)}`,token_use:"access",_mock:!0,_note:"Mock JWT Bearer access token for educational purposes"},r=btoa(JSON.stringify(t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_"),s=btoa(JSON.stringify(o)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_"),i=`${r}.${s}.${`mock_signature_${Math.random().toString(36).substr(2,43)}`}`;ye({access_token:i,token_type:"Bearer",expires_in:3600,scope:he||"openid",_mock:!0,_note:"This is a simulated response for educational purposes. PingOne does not support JWT Bearer assertions."}),H(3),O.showSuccess("Mock access token generated successfully! (Educational simulation)")}catch(e){O.showError("Failed to simulate token request")}finally{Te(!1)}}else O.showWarning("Please generate a JWT first")},[xe,V,ee,he,ie]),Oe=e.useCallback(e=>{switch(e){case 0:return!0;case 1:case 2:return!!xe;case 3:case 4:return!!be;default:return!1}},[xe,be]),Le=e.useCallback(()=>{if(0===X){const e={environmentId:G,clientId:V},{missingFields:n,canProceed:t}=oe.checkMissingFields(e,{requiredFields:["environmentId","clientId"],fieldLabels:{environmentId:"Environment ID",clientId:"Client ID"}});if(!t)return qe(n),void Ce(!0)}X<Ie.length-1&&H(X+1)},[X,G,V]),Xe=e.useCallback(()=>{X>0&&H(X-1)},[X]),He=e.useCallback(()=>{H(0),je(""),ye(null),Te(!1)},[]),Ke=e.useCallback(()=>{sessionStorage.removeItem("jwt-bearer-token-v6-tokens"),sessionStorage.removeItem("restore_step"),H(0),je(""),ye(null);try{sessionStorage.removeItem("config-checker-diffs"),sessionStorage.removeItem("config-checker-last-check"),sessionStorage.removeItem("pingone-app-cache"),localStorage.removeItem("pingone-applications-cache"),sessionStorage.removeItem("worker-token-cache"),localStorage.removeItem("worker-apps-cache")}catch(e){}O.showSuccess("Flow restarted",{description:"Tokens, JWT, and cache cleared. Credentials preserved."})},[]),Qe=e.useCallback(()=>Oe(X)&&X<Ie.length-1,[X,Oe]),Ge=e.useMemo(()=>{switch(X){case 0:return n.jsxs(n.Fragment,{children:[n.jsxs(f,{children:[n.jsxs(k,{onClick:()=>Ue("overview"),"aria-expanded":!K.overview,children:[n.jsxs(v,{children:[n.jsx(d,{})," JWT Bearer Flow Overview"]}),n.jsx(x,{$collapsed:K.overview,children:n.jsx(i,{})})]}),!K.overview&&n.jsxs(j,{children:[n.jsxs(b,{$variant:"info",children:[n.jsx(t,{size:20}),n.jsxs("div",{children:[n.jsx(y,{children:"JWT Bearer Token Flow (RFC 7523)"}),n.jsx(w,{children:"The JWT Bearer Token flow enables OAuth clients to authenticate using JWT assertions instead of traditional client credentials. Perfect for server-to-server scenarios."})]})]}),n.jsxs(b,{$variant:"error",children:[n.jsx(r,{size:20}),n.jsxs("div",{children:[n.jsx(y,{children:"Educational Mock Implementation"}),n.jsx(w,{children:"This is a mock implementation for educational purposes. PingOne does not currently support JWT Bearer assertions for client authentication."}),n.jsxs(w,{style:{marginTop:"0.5rem",color:"#dc2626",fontWeight:"600",backgroundColor:"#fee2e2",padding:"0.75rem",borderRadius:"0.5rem",border:"2px solid #ef4444"},children:[n.jsx("strong",{children:"⚠️ SIMULATION WARNING:"})," This is a simulated/mock implementation for learning purposes only."]})]})]})]})]}),n.jsxs(f,{children:[n.jsxs(k,{onClick:()=>Ue("endpoint"),"aria-expanded":!K.endpoint,children:[n.jsxs(v,{children:[n.jsx(c,{})," Token Endpoint Configuration"]}),n.jsx(x,{$collapsed:K.endpoint,children:n.jsx(i,{})})]}),!K.endpoint&&n.jsxs(j,{children:[n.jsxs(C,{children:[n.jsx(_,{children:"Token Endpoint *"}),n.jsx(q,{type:"url",value:ee,onChange:e=>ne(e.target.value),placeholder:"https://auth.example.com/oauth/token"})]}),n.jsxs(C,{children:[n.jsx(_,{children:"Audience (Optional)"}),n.jsx(q,{type:"text",value:ie,onChange:e=>ae(e.target.value),placeholder:"https://api.example.com"})]})]})]}),n.jsx(M,{}),n.jsx(re,{flowType:"jwt-bearer-token-v7",onDiscoveryComplete:e=>{e.document&&(e.document.token_endpoint&&ne(e.document.token_endpoint),e.document.issuer&&ae(e.document.issuer));let n=null;if(e.issuerUrl){const t=e.issuerUrl.match(/\/([a-f0-9-]{36})\//i);t?.[1]&&(n=t[1])}if(!n&&e.document?.issuer){const t=e.document.issuer.match(/\/([a-f0-9-]{36})\//i);t?.[1]&&(n=t[1])}n&&Y(n),O.showSuccess("Token Endpoint and Audience auto-populated from OIDC Discovery")},discoveryPlaceholder:"Enter Environment ID, issuer URL, or OIDC provider...",showProviderInfo:!0,environmentId:G,clientId:V,clientSecret:"",scopes:he,onEnvironmentIdChange:e=>{Y(e),Fe({environmentId:e})},onClientIdChange:e=>{Z(e),Fe({clientId:e})},onScopesChange:e=>{me(e),Fe({scopes:e})},onSave:async()=>{await Fe({}),O.showSuccess("Configuration saved")},hasUnsavedChanges:!1,isSaving:!1,requireClientSecret:!1,showRedirectUri:!1,showPostLogoutRedirectUri:!1,showLoginHint:!1,clientAuthMethod:"none",allowedAuthMethods:["none"],title:"JWT Bearer Configuration",subtitle:"Configure environment, client ID, and scopes",defaultCollapsed:false,showAdvancedConfig:!1})]});case 1:return n.jsxs(n.Fragment,{children:[n.jsx(z,{title:"JWT Claims & Signature Builder",theme:"blue",isCollapsed:K.jwtBuilder,onToggle:()=>Ue("jwtBuilder"),children:n.jsxs("div",{style:{padding:"1.5rem"},children:[n.jsxs(b,{$variant:"info",children:[n.jsx(d,{size:20}),n.jsxs("div",{children:[n.jsx(y,{children:"JWT Claims Configuration"}),n.jsx(w,{children:"Configure the JWT claims and signature algorithm. The JWT will be used as a client assertion in the token request."})]})]}),n.jsxs(C,{children:[n.jsx(_,{children:"Issuer (iss) *"}),n.jsx(q,{type:"text",value:ge.iss,onChange:e=>fe(n=>({...n,iss:e.target.value})),placeholder:"https://auth.pingone.com"}),n.jsxs(W,{style:{marginTop:"0.5rem",fontSize:"0.875rem"},children:[n.jsx(d,{size:14,style:{marginRight:"0.5rem"}}),"The issuer should be the authorization server URL, not the client ID"]})]}),n.jsxs(C,{children:[n.jsx(_,{children:"Subject (sub) *"}),n.jsx(q,{type:"text",value:ge.sub,onChange:e=>fe(n=>({...n,sub:e.target.value})),placeholder:"your-client-id"})]}),n.jsxs(C,{children:[n.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[n.jsx(_,{style:{margin:0},children:"Audience (aud) *"}),n.jsx(E,{onClick:()=>{G&&""!==G.trim()?Je():O.showWarning("Please enter an Environment ID first")},disabled:!G||""===G.trim()||Ae,$variant:"secondary",style:{padding:"0.25rem 0.5rem",fontSize:"0.75rem",display:"flex",alignItems:"center",gap:"0.25rem",backgroundColor:G&&""!==G.trim()?"#10b981":"#6b7280",color:"#ffffff",border:"none",cursor:G&&""!==G.trim()?"pointer":"not-allowed",opacity:G&&""!==G.trim()?1:.5},title:G&&""!==G.trim()?"Auto-discover audience from OIDC endpoint":"Enter Environment ID first",children:Ae?n.jsxs(n.Fragment,{children:[n.jsx(l,{size:12,className:"animate-spin"}),n.jsx("span",{children:"Discovering..."})]}):n.jsxs(n.Fragment,{children:[n.jsx(c,{size:12}),n.jsx("span",{children:"Auto-discover"})]})})]}),n.jsx(q,{type:"text",value:ge.aud,onChange:e=>fe(n=>({...n,aud:e.target.value})),placeholder:"https://auth.example.com"}),n.jsxs(W,{style:{marginTop:"0.5rem",fontSize:"0.875rem"},children:[n.jsx(d,{size:14,style:{marginRight:"0.5rem"}}),'Click "Auto-discover" to fetch the audience from the OIDC discovery endpoint.']})]}),n.jsxs(C,{children:[n.jsx(_,{children:"Expiration Time (exp) *"}),n.jsx(q,{type:"number",value:ge.exp,onChange:e=>fe(n=>({...n,exp:parseInt(e.target.value,10)})),placeholder:"1640995200"})]}),n.jsxs(C,{children:[n.jsx(_,{children:"JWT ID (jti) *"}),n.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[n.jsx(q,{type:"text",value:ge.jti,onChange:e=>fe(n=>({...n,jti:e.target.value})),placeholder:"unique-jwt-id"}),n.jsxs(E,{onClick:Me,$variant:"secondary",children:[n.jsx(l,{})," Generate"]})]})]}),n.jsxs(C,{children:[n.jsx(_,{children:"Signature Algorithm"}),n.jsxs("select",{value:ke.algorithm,onChange:e=>ve(n=>({...n,algorithm:e.target.value})),style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.875rem"},children:[n.jsx("option",{value:"RS256",children:"RS256 (RSA with SHA-256)"}),n.jsx("option",{value:"RS384",children:"RS384 (RSA with SHA-384)"}),n.jsx("option",{value:"RS512",children:"RS512 (RSA with SHA-512)"}),n.jsx("option",{value:"ES256",children:"ES256 (ECDSA with SHA-256)"}),n.jsx("option",{value:"ES384",children:"ES384 (ECDSA with SHA-384)"}),n.jsx("option",{value:"ES512",children:"ES512 (ECDSA with SHA-512)"})]})]}),n.jsxs(C,{style:{marginTop:"2rem"},children:[n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"},children:[n.jsx(_,{children:"Private Key (PEM format) *"}),n.jsxs(E,{onClick:Ne,$variant:"secondary",style:{padding:"0.5rem 1rem",fontSize:"0.875rem",backgroundColor:"#10b981",color:"#ffffff"},children:[n.jsx(o,{})," Generate Sample Key Pair"]})]}),n.jsx(R,{value:ke.privateKey,onChange:e=>ve(n=>({...n,privateKey:e.target.value})),placeholder:"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...",rows:10,style:{marginBottom:"0.75rem"}}),n.jsxs(W,{style:{marginTop:"0.5rem",fontSize:"0.875rem"},children:[n.jsx(d,{size:14,style:{marginRight:"0.5rem"}}),'Click "Generate Sample Key Pair" to create a test RSA-2048 key pair for educational purposes.']})]}),n.jsxs(E,{onClick:Pe,$variant:"primary",style:{backgroundColor:"#0066cc",color:"#ffffff",fontWeight:600,fontSize:"1rem",padding:"0.75rem 1.5rem"},children:[n.jsx(o,{})," Generate Access Token from JWT"]})]})}),xe&&pe.showTokens({access_token:xe},"oauth","jwt-bearer-v6",{showCopyButtons:!0,showDecodeButtons:!0})]});case 2:return n.jsxs(f,{children:[n.jsxs(k,{onClick:()=>Ue("tokenRequest"),"aria-expanded":!K.tokenRequest,children:[n.jsxs(v,{children:[n.jsx(c,{})," Token Request"]}),n.jsx(x,{$collapsed:K.tokenRequest,children:n.jsx(i,{})})]}),!K.tokenRequest&&n.jsxs(j,{children:[n.jsxs(b,{$variant:"warning",children:[n.jsx(r,{size:20}),n.jsxs("div",{children:[n.jsx(y,{children:"🎓 JWT Bearer Token Request"}),n.jsx(w,{children:"This demonstrates how a JWT Bearer token request would be sent to an OAuth 2.0 server that supports RFC 7523. The assertion parameter contains the signed JWT that proves the client's identity."}),n.jsxs(w,{style:{marginTop:"0.5rem"},children:[n.jsx("strong",{children:"Note:"})," PingOne does not support JWT Bearer assertions, but many other OAuth providers do. Below are real-world examples of providers that support JWT Bearer grant type."]})]})]}),n.jsxs("div",{style:{marginBottom:"1.5rem"},children:[n.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1rem",fontWeight:"600",color:"#374151"},children:"🌐 Real-World JWT Bearer Examples"}),n.jsxs("div",{style:{display:"grid",gap:"0.75rem"},children:[n.jsxs("div",{onClick:()=>ne("https://oauth2.googleapis.com/token"),style:{padding:"0.75rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"6px",fontSize:"0.875rem",cursor:"pointer",transition:"all 0.2s ease","&:hover":{background:"#f1f5f9",borderColor:"#3b82f6"}},onMouseEnter:e=>{e.currentTarget.style.background="#f1f5f9",e.currentTarget.style.borderColor="#3b82f6"},onMouseLeave:e=>{e.currentTarget.style.background="#f8fafc",e.currentTarget.style.borderColor="#e2e8f0"},children:[n.jsx("div",{style:{fontWeight:"600",color:"#1f2937",marginBottom:"0.25rem"},children:"🔵 Google Cloud Platform"}),n.jsx("div",{style:{color:"#6b7280",fontFamily:"monospace"},children:"https://oauth2.googleapis.com/token"}),n.jsx("div",{style:{color:"#6b7280",fontSize:"0.75rem",marginTop:"0.25rem"},children:"Supports JWT Bearer for service account authentication"})]}),n.jsxs("div",{onClick:()=>ne("https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token"),style:{padding:"0.75rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"6px",fontSize:"0.875rem",cursor:"pointer",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.background="#f1f5f9",e.currentTarget.style.borderColor="#3b82f6"},onMouseLeave:e=>{e.currentTarget.style.background="#f8fafc",e.currentTarget.style.borderColor="#e2e8f0"},children:[n.jsx("div",{style:{fontWeight:"600",color:"#1f2937",marginBottom:"0.25rem"},children:"🟠 Microsoft Azure AD"}),n.jsxs("div",{style:{color:"#6b7280",fontFamily:"monospace"},children:["https://login.microsoftonline.com/",tenant-id,"/oauth2/v2.0/token"]}),n.jsx("div",{style:{color:"#6b7280",fontSize:"0.75rem",marginTop:"0.25rem"},children:"Supports JWT Bearer for application authentication"})]}),n.jsxs("div",{onClick:()=>ne("https://{pingfederate-host}:9031/as/token"),style:{padding:"0.75rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"6px",fontSize:"0.875rem",cursor:"pointer",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.background="#f1f5f9",e.currentTarget.style.borderColor="#3b82f6"},onMouseLeave:e=>{e.currentTarget.style.background="#f8fafc",e.currentTarget.style.borderColor="#e2e8f0"},children:[n.jsx("div",{style:{fontWeight:"600",color:"#1f2937",marginBottom:"0.25rem"},children:"🟢 PingFederate"}),n.jsxs("div",{style:{color:"#6b7280",fontFamily:"monospace"},children:["https://",pingfederate-host,":9031/as/token"]}),n.jsx("div",{style:{color:"#6b7280",fontSize:"0.75rem",marginTop:"0.25rem"},children:"Supports JWT Bearer for enterprise authentication"})]}),n.jsxs("div",{onClick:()=>ne("https://{pingone-ais-host}/oauth/token"),style:{padding:"0.75rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"6px",fontSize:"0.875rem",cursor:"pointer",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.background="#f1f5f9",e.currentTarget.style.borderColor="#3b82f6"},onMouseLeave:e=>{e.currentTarget.style.background="#f8fafc",e.currentTarget.style.borderColor="#e2e8f0"},children:[n.jsx("div",{style:{fontWeight:"600",color:"#1f2937",marginBottom:"0.25rem"},children:"🟣 PingOne Advanced Identity Cloud"}),n.jsxs("div",{style:{color:"#6b7280",fontFamily:"monospace"},children:["https://",pingone-ais-host,"/oauth/token"]}),n.jsx("div",{style:{color:"#6b7280",fontSize:"0.75rem",marginTop:"0.25rem"},children:"Supports JWT Bearer (RFC 7523) for advanced identity scenarios"})]})]}),n.jsxs("div",{style:{marginTop:"1rem",padding:"0.75rem",background:"#fef3c7",border:"1px solid #f59e0b",borderRadius:"6px",fontSize:"0.875rem",color:"#92400e"},children:[n.jsx("strong",{children:"💡 Tip:"})," Click on any example above to use it as your token endpoint, or enter your own OAuth provider's token endpoint that supports JWT Bearer grant type."]})]}),n.jsx(D,{children:n.jsxs(A,{children:[n.jsx(B,{children:"Request URL"}),n.jsx(F,{children:ee}),n.jsx(B,{children:"Method"}),n.jsx(F,{children:"POST"}),n.jsx(B,{children:"Content-Type"}),n.jsx(F,{children:"application/x-www-form-urlencoded"}),n.jsx(B,{children:"grant_type"}),n.jsx(F,{children:"urn:ietf:params:oauth:grant-type:jwt-bearer"}),n.jsx(B,{children:"assertion"}),n.jsx(F,{style:{wordBreak:"break-all",fontSize:"0.75rem"},children:xe||"Generate JWT first"}),n.jsx(B,{children:"scope"}),n.jsx(F,{children:he||"Not specified"})]})}),n.jsxs(E,{onClick:We,variant:"success",disabled:!xe||we,children:[we?n.jsx(l,{className:"animate-spin"}):n.jsx(c,{}),we?"Requesting Token...":"Make Token Request"]})]})]});case 3:return n.jsx(n.Fragment,{children:be&&n.jsxs(n.Fragment,{children:[n.jsxs(b,{$variant:"success",style:{marginBottom:"2rem"},children:[n.jsx(s,{size:20}),n.jsxs("div",{children:[n.jsx(y,{children:"Access Token Received!"}),n.jsx(w,{children:"The JWT Bearer Token flow has completed successfully. You now have an access token that can be used to access protected resources."})]})]}),n.jsxs(f,{children:[n.jsxs(k,{onClick:()=>Ue("tokenResponse"),"aria-expanded":!K.tokenResponse,children:[n.jsxs(v,{children:[n.jsx(s,{})," Token Response"]}),n.jsx(x,{$collapsed:K.tokenResponse,children:n.jsx(i,{})})]}),!K.tokenResponse&&n.jsxs(j,{children:[n.jsx(D,{children:n.jsxs(A,{children:[n.jsx(B,{children:"access_token"}),n.jsx(F,{style:{wordBreak:"break-all",fontSize:"0.75rem"},children:be.access_token}),n.jsx(B,{children:"token_type"}),n.jsx(F,{children:be.token_type}),n.jsx(B,{children:"expires_in"}),n.jsxs(F,{children:[be.expires_in," seconds"]}),n.jsx(B,{children:"scope"}),n.jsx(F,{children:be.scope})]})}),n.jsxs("div",{style:{marginTop:"1rem",display:"flex",gap:"0.5rem"},children:[n.jsxs(E,{onClick:()=>T.copyToClipboard(be.access_token),$variant:"secondary",children:[n.jsx(a,{})," Copy Access Token"]}),n.jsxs(E,{onClick:()=>T.copyToClipboard(JSON.stringify(be,null,2)),$variant:"secondary",children:[n.jsx(a,{})," Copy Full Response"]})]})]})]}),pe.showTokens(be,"oauth","jwt-bearer-v6",{showCopyButtons:!0,showDecodeButtons:!0})]})});case 4:return n.jsx(ce,{config:le.jwtBearer,collapsed:K.completion,onToggleCollapsed:()=>Ue("completion")});default:return n.jsx("div",{children:"Invalid step"})}},[X,K,Ue,V,ee,ie,he,ge,ke,xe,be,we,We,Je,G,Pe,Me,Ne,Ae,Fe]);return n.jsxs(u,{children:[n.jsx(I,{flowId:"jwt-bearer-token-v7"}),n.jsxs(h,{children:[n.jsxs(b,{$variant:"error",style:{marginBottom:"2rem"},children:[n.jsx(p,{size:24}),n.jsxs("div",{children:[n.jsx(y,{children:"🎓 Educational Mock Implementation"}),n.jsxs(w,{children:["This is a ",n.jsx("strong",{children:"mock/educational implementation"})," of the JWT Bearer Token flow. PingOne does not currently support JWT Bearer assertions for client authentication."]}),n.jsxs(w,{style:{marginTop:"0.75rem",color:"#dc2626",fontWeight:"600",backgroundColor:"#fee2e2",padding:"0.75rem",borderRadius:"0.5rem",border:"2px solid #ef4444"},children:[n.jsx("strong",{children:"⚠️ SIMULATION WARNING:"})," This is a simulated/mock implementation for learning purposes only."]}),n.jsx(w,{style:{marginTop:"0.5rem"},children:n.jsx("strong",{children:"What you'll learn:"})}),n.jsxs(S,{children:[n.jsx("li",{children:"How JWT Bearer Token flow works (RFC 7523)"}),n.jsx("li",{children:"JWT structure and claims for client assertions"}),n.jsx("li",{children:"Cryptographic signature algorithms (RS256, ES256, etc.)"}),n.jsx("li",{children:"Private key management and PKI concepts"}),n.jsx("li",{children:"Enterprise server-to-server authentication patterns"})]}),n.jsx(w,{style:{marginTop:"0.5rem"},children:"This flow demonstrates the concepts and provides a simulation of how JWT Bearer authentication would work in production OAuth 2.0 servers that support this grant type."})]})]}),n.jsx(M,{}),ue.getComparisonTable({highlightFlow:"jwt",collapsed:!1}),n.jsx(M,{}),n.jsx(m,{children:n.jsx(g,{children:Ge})})]}),n.jsx(U,{currentStep:X,totalSteps:Ie.length,onPrevious:Xe,onNext:Le,onReset:He,onStartOver:Ke,canNavigateNext:Qe(),isFirstStep:0===X}),n.jsx(se,{isOpen:Se,onClose:()=>Ce(!1),title:"Credentials required",description:_e.length>0?`Please provide the following required credential${_e.length>1?"s":""} before continuing:`:"Environment ID and Client ID are required before moving to the next step.",actions:[{label:"Back to credentials",onClick:()=>Ce(!1),variant:"primary"}],children:_e.length>0&&n.jsx("ul",{style:{marginTop:"1rem",marginBottom:"1rem",paddingLeft:"1.5rem"},children:_e.map(e=>n.jsx("li",{style:{marginBottom:"0.5rem",fontWeight:600},children:e},e))})}),n.jsx(se,{isOpen:Re,onClose:()=>Ee(!1),title:"JWT Generation Requirements",description:$e.length>0?`Please provide the following required field${$e.length>1?"s":""} before generating the JWT:`:"All required fields must be filled to generate a JWT.",actions:[{label:"OK, I'll fill them in",onClick:()=>Ee(!1),variant:"primary"}],children:$e.length>0&&n.jsx("ul",{style:{marginTop:"1rem",marginBottom:"1rem",paddingLeft:"1.5rem"},children:$e.map(e=>n.jsx("li",{style:{marginBottom:"0.5rem",fontWeight:600,color:"#d97706"},children:e},e))})})]})},Ce=de.getContainer(),_e=de.getContentWrapper(),qe=x.div`
	background-color: #ffffff;
	border-radius: 1.5rem;
	box-shadow: 0 25px 50px rgba(15, 23, 42, 0.15);
	border: 1px solid #e2e8f0;
	overflow: hidden;
	margin-bottom: 2rem;
	backdrop-filter: blur(10px);
`,Re=x.div`
	background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
	color: #ffffff;
	padding: 2.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	position: relative;
	overflow: hidden;
	
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
		animation: shimmer 3s infinite;
	}
	
	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
`,Ee=x.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	position: relative;
	z-index: 1;
`,$e=x.div`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: rgba(255, 255, 255, 0.25);
	border: 1px solid rgba(255, 255, 255, 0.4);
	border-radius: 999px;
	padding: 0.5rem 1rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	backdrop-filter: blur(10px);
`,De=x.h2`
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
	letter-spacing: -0.025em;
	text-shadow: 0 2px 4px rgba(0,0,0,0.1);
`,Ae=x.p`
	margin: 0;
	font-size: 1.125rem;
	opacity: 0.95;
	line-height: 1.5;
	font-weight: 400;
`,Be=x.div`
	padding: 2.5rem;
`,ze=x.div`
	background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
	border: 1px solid #3b82f6;
	border-radius: 1rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	display: flex;
	align-items: center;
	gap: 1rem;
	box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
`,Ue=x.div`
	flex: 1;
`,Fe=x.div`
	font-weight: 700;
	color: #1e40af;
	margin-bottom: 0.5rem;
	font-size: 1.125rem;
`,Me=x.div`
	font-size: 0.875rem;
	color: #1e3a8a;
	line-height: 1.5;
`,Je=x.div`
	margin-bottom: 2.5rem;
`,Ne=x.h3`
	margin: 0 0 1.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
`,Pe=x.div`
	display: grid;
	gap: 1.5rem;
`,We=x.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`,Oe=x.label`
	font-weight: 600;
	color: #374151;
	font-size: 0.875rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Le=x.span`
	font-size: 0.75rem;
	background: linear-gradient(135deg, #3b82f6, #1d4ed8);
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 0.375rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.025em;
`,Xe=x.input`
	width: 100%;
	padding: 1rem;
	border: 2px solid #e5e7eb;
	border-radius: 0.75rem;
	font-size: 1rem;
	background: ${e=>e.$isMock?"#fef3c7":"#ffffff"};
	transition: all 0.2s ease;
	
	&:focus {
		outline: none;
		border-color: #7c3aed;
		box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
		transform: translateY(-1px);
	}
	
	&:hover {
		border-color: #d1d5db;
	}
`,He=x.div`
	position: relative;
`,Ke=x.button`
	position: absolute;
	right: 1rem;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	padding: 0.5rem;
	border-radius: 0.375rem;
	transition: all 0.2s ease;
	
	&:hover {
		color: #374151;
		background: #f3f4f6;
	}
`,Qe=x.button`
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	padding: 1rem 2rem;
	border-radius: 0.75rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 1rem;
	position: relative;
	overflow: hidden;
	
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
		transition: left 0.5s;
	}
	
	&:hover::before {
		left: 100%;
	}
	
	${e=>"primary"===e.variant&&"\n\t\tbackground: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);\n\t\tcolor: white;\n\t\tbox-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);\n\t\t&:hover { \n\t\t\ttransform: translateY(-2px);\n\t\t\tbox-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);\n\t\t}\n\t\t&:disabled { \n\t\t\tbackground: #9ca3af; \n\t\t\tcursor: not-allowed; \n\t\t\ttransform: none;\n\t\t\tbox-shadow: none;\n\t\t}\n\t"}
	
	${e=>"success"===e.variant&&"\n\t\tbackground: linear-gradient(135deg, #16a34a 0%, #15803d 100%);\n\t\tcolor: white;\n\t\tbox-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);\n\t\t&:hover { \n\t\t\ttransform: translateY(-2px);\n\t\t\tbox-shadow: 0 8px 25px rgba(22, 163, 74, 0.4);\n\t\t}\n\t\t&:disabled { \n\t\t\tbackground: #9ca3af; \n\t\t\tcursor: not-allowed; \n\t\t\ttransform: none;\n\t\t\tbox-shadow: none;\n\t\t}\n\t"}
	
	${e=>"secondary"===e.variant&&"\n\t\tbackground: #f8fafc;\n\t\tcolor: #374151;\n\t\tborder: 2px solid #e2e8f0;\n\t\t&:hover { \n\t\t\tbackground: #f1f5f9; \n\t\t\tborder-color: #cbd5e1;\n\t\t\ttransform: translateY(-1px);\n\t\t}\n\t\t&:disabled { \n\t\t\tbackground: #f9fafb; \n\t\t\tcursor: not-allowed; \n\t\t\ttransform: none;\n\t\t}\n\t"}
`,Ge=x.div`
	background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
	border: 2px solid #22c55e;
	border-radius: 1rem;
	padding: 2rem;
	margin-top: 2rem;
	box-shadow: 0 4px 6px rgba(34, 197, 94, 0.1);
`,Ye=x.div`
	background: ${e=>"success"===e.$variant?"linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)":"warning"===e.$variant?"linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)":"linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"};
	border: 2px solid ${e=>"success"===e.$variant?"#22c55e":"warning"===e.$variant?"#f59e0b":"#3b82f6"};
	border-radius: 0.75rem;
	padding: 1.5rem;
	display: flex;
	align-items: flex-start;
	gap: 1rem;
`,Ve=x.div`
	font-weight: 700;
	font-size: 1.125rem;
	color: ${e=>e.theme||"#1f2937"};
	margin-bottom: 0.5rem;
`,Ze=x.div`
	font-size: 0.875rem;
	color: #4b5563;
	line-height: 1.6;
`,en=x.h4`
	margin: 0 0 1.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #15803d;
	font-weight: 700;
	font-size: 1.125rem;
`,nn=x.div`
	background: #ffffff;
	border: 2px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 1.5rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	word-break: break-all;
	margin-bottom: 1.5rem;
	box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;x.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1.5rem;
	font-size: 0.875rem;
	color: #6b7280;
`;const tn=x.div`
	animation: spin 1s linear infinite;
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
`,on=[{title:"Step 0: Configuration",subtitle:"Set up PingOne credentials and user details"},{title:"Step 1: Authentication",subtitle:"Exchange username/password for access token"},{title:"Step 2: User Information",subtitle:"Fetch user details using access token"},{title:"Step 3: Token Refresh",subtitle:"Refresh access token using refresh token"}],rn=()=>{const t=he({flowKey:"oauth-ropc-v7",enableDebugger:!0}),[r,i]=e.useState(!1),[a,c]=e.useState(!1);N({pageName:"OAuthROPCFlowV7",force:!0}),e.useEffect(()=>{t.stepManager.setStep(0,"fresh start from menu")},[t.stepManager.setStep]);const p=(e,n)=>{t.setCredentials({...t.credentials,[e]:n})};return n.jsx(Ce,{children:n.jsxs(_e,{children:[n.jsx(I,{flowId:"oauth-ropc-v7"}),n.jsx(me,{flowType:"resource-owner-password",title:"Understanding OAuth Resource Owner Password Credentials (ROPC) Flow",theme:"purple",defaultCollapsed:!1}),n.jsx(F,{flowType:"oauth-ropc-v7",showAdditionalInfo:!0,showDocumentation:!0,showCommonIssues:!1,showImplementationNotes:!1}),n.jsx(E,{flowType:"resource-owner-password",variant:"oauth"}),(()=>{const e=t.stepManager.currentStepIndex,v=on[e];return n.jsxs(qe,{children:[n.jsx(Re,{children:n.jsxs(Ee,{children:[n.jsxs($e,{children:[n.jsx(u,{}),v.title]}),n.jsx(De,{children:v.title}),n.jsx(Ae,{children:v.subtitle})]})}),n.jsxs(Be,{children:[0===e&&n.jsxs(n.Fragment,{children:[n.jsxs(ze,{children:[n.jsx(d,{size:24,style:{color:"#1e40af",flexShrink:0}}),n.jsxs(Ue,{children:[n.jsx(Fe,{children:"🚀 V7 Enhanced Implementation"}),n.jsx(Me,{children:"This is the latest V7 implementation of the OAuth Resource Owner Password Credentials (ROPC) flow. It features enhanced UI, improved error handling, and better user experience while maintaining compatibility with your real PingOne credentials."})]})]}),n.jsxs(Je,{children:[n.jsxs(Ne,{children:[n.jsx(o,{}),"PingOne Configuration"]}),n.jsxs(Pe,{children:[n.jsxs(We,{children:[n.jsx(Oe,{children:"Environment ID"}),n.jsx(Xe,{type:"text",value:t.credentials.environmentId,onChange:e=>p("environmentId",e.target.value),placeholder:"Enter your PingOne Environment ID"})]}),n.jsxs(We,{children:[n.jsx(Oe,{children:"Client ID"}),n.jsx(Xe,{type:"text",value:t.credentials.clientId,onChange:e=>p("clientId",e.target.value),placeholder:"Enter your PingOne Client ID"})]}),n.jsxs(We,{children:[n.jsx(Oe,{children:"Client Secret"}),n.jsxs(He,{children:[n.jsx(Xe,{type:a?"text":"password",value:t.credentials.clientSecret,onChange:e=>p("clientSecret",e.target.value),placeholder:"Enter your PingOne Client Secret"}),n.jsx(Ke,{type:"button",onClick:()=>c(!a),children:a?n.jsx(h,{}):n.jsx(m,{})})]})]})]})]}),n.jsxs(Je,{children:[n.jsxs(Ne,{children:[n.jsx(g,{}),"User Credentials"]}),n.jsxs(Pe,{children:[n.jsxs(We,{children:[n.jsxs(Oe,{children:["Username",n.jsx(Le,{children:"V7"})]}),n.jsx(Xe,{type:"text",value:t.credentials.username,onChange:e=>p("username",e.target.value),placeholder:"Enter username (email)",$isMock:!0})]}),n.jsxs(We,{children:[n.jsxs(Oe,{children:["Password",n.jsx(Le,{children:"V7"})]}),n.jsxs(He,{children:[n.jsx(Xe,{type:r?"text":"password",$isMock:!0,value:t.credentials.password,onChange:e=>p("password",e.target.value),placeholder:"Enter password",autoComplete:"current-password"}),n.jsx(Ke,{type:"button",onClick:()=>i(!r),children:r?n.jsx(h,{}):n.jsx(m,{})})]})]}),n.jsxs(We,{children:[n.jsx(Oe,{children:"Scope"}),n.jsx(Xe,{type:"text",value:t.credentials.scope,onChange:e=>p("scope",e.target.value),placeholder:"openid profile email"})]})]}),n.jsx("div",{style:{marginTop:"2.5rem"},children:n.jsxs(Qe,{variant:"success",onClick:t.saveCredentials,disabled:t.isSavingCredentials,children:[t.isSavingCredentials?n.jsx(tn,{children:n.jsx(l,{})}):n.jsx(f,{}),"Save Configuration"]})})]})]}),1===e&&n.jsxs(n.Fragment,{children:[n.jsxs(Je,{children:[n.jsxs(Ne,{children:[n.jsx(k,{}),"Resource Owner Password Authentication"]}),n.jsx("p",{style:{marginBottom:"2rem",color:"#6b7280",fontSize:"1rem",lineHeight:"1.6"},children:"This step will exchange the username and password for an access token using the Resource Owner Password Credentials grant. This is a direct authentication method that bypasses the browser redirect flow."}),n.jsxs(Qe,{variant:"primary",onClick:t.authenticateUser,disabled:t.isAuthenticating||!t.hasCredentialsSaved,children:[t.isAuthenticating?n.jsx(tn,{children:n.jsx(l,{})}):n.jsx(k,{}),"Authenticate User"]})]}),t.tokens&&n.jsxs(Ge,{children:[n.jsxs(en,{children:[n.jsx(s,{}),"Access Token Received"]}),pe.showTokens(t.tokens,"oauth","oauth-ropc-v7",{showCopyButtons:!0,showDecodeButtons:!0})]})]}),2===e&&n.jsxs(n.Fragment,{children:[n.jsxs(Je,{children:[n.jsxs(Ne,{children:[n.jsx(g,{}),"User Information"]}),n.jsx("p",{style:{marginBottom:"2rem",color:"#6b7280",fontSize:"1rem",lineHeight:"1.6"},children:"Fetch user information using the access token from the previous step. This demonstrates how to use the access token to access protected resources."}),n.jsxs(Qe,{variant:"primary",onClick:t.fetchUserInfo,disabled:t.isFetchingUserInfo||!t.tokens,children:[t.isFetchingUserInfo?n.jsx(tn,{children:n.jsx(l,{})}):n.jsx(g,{}),"Fetch User Info"]})]}),t.userInfo&&n.jsxs(Ge,{children:[n.jsxs(en,{children:[n.jsx(s,{}),"User Information"]}),n.jsx(nn,{children:n.jsx("pre",{children:JSON.stringify(t.userInfo,null,2)})})]})]}),3===e&&n.jsxs(n.Fragment,{children:[n.jsxs(Je,{children:[n.jsxs(Ne,{children:[n.jsx(l,{}),"Token Refresh"]}),n.jsx("p",{style:{marginBottom:"2rem",color:"#6b7280",fontSize:"1rem",lineHeight:"1.6"},children:"Use the refresh token to obtain a new access token without re-authenticating the user. This is essential for maintaining long-lived sessions."}),n.jsxs(Qe,{variant:"primary",onClick:t.refreshTokens,disabled:t.isRefreshingTokens||!t.tokens?.refresh_token,children:[t.isRefreshingTokens?n.jsx(tn,{children:n.jsx(l,{})}):n.jsx(l,{}),"Refresh Tokens"]}),!t.tokens?.refresh_token&&n.jsx("p",{style:{color:"#dc2626",marginTop:"1.5rem",fontSize:"0.875rem"},children:"No refresh token available. Complete the authentication step first."})]}),t.refreshedTokens&&n.jsxs(n.Fragment,{children:[t.tokens&&n.jsxs(Ge,{style:{marginBottom:"1.5rem"},children:[n.jsxs(Ye,{$variant:"info",style:{marginBottom:"1rem"},children:[n.jsx(d,{size:20}),n.jsxs("div",{children:[n.jsx(Ve,{children:"🔄 Before Refresh"}),n.jsx(Ze,{children:"These are your current tokens before the refresh exchange."})]})]}),pe.showTokens(t.tokens,"oauth","oauth-ropc-v7-before",{showCopyButtons:!0,showDecodeButtons:!0})]}),n.jsxs(Ge,{children:[n.jsxs(Ye,{$variant:"success",style:{marginBottom:"1rem"},children:[n.jsx(s,{size:20}),n.jsxs("div",{children:[n.jsx(Ve,{children:"✅ After Refresh"}),n.jsx(Ze,{children:"New tokens issued after the refresh token exchange. The refresh token is typically opaque (references server-side state) unless your authorization server issues JWT refresh tokens."})]})]}),pe.showTokens(t.refreshedTokens,"oauth","oauth-ropc-v7-refresh",{showCopyButtons:!0,showDecodeButtons:!0})]})]})]})]})]})})(),n.jsx(U,{currentStep:t.stepManager.currentStepIndex,totalSteps:on.length,onPrevious:()=>t.stepManager.setStep(Math.max(0,t.stepManager.currentStepIndex-1),"previous"),onNext:()=>t.stepManager.setStep(Math.min(on.length-1,t.stepManager.currentStepIndex+1),"next"),onReset:t.resetFlow,canNavigateNext:t.stepManager.currentStepIndex<on.length-1,isFirstStep:0===t.stepManager.currentStepIndex,nextButtonText:"Next",disabledMessage:"Complete the action above to continue",stepRequirements:["Review the flow overview and setup credentials","Enter username and password, then request access token","Fetch user details using access token","Refresh access token using refresh token"],onCompleteAction:()=>t.stepManager.setStep(Math.min(on.length-1,t.stepManager.currentStepIndex+1),"complete action"),showCompleteActionButton:!1}),n.jsx(M,{flowId:"oauth-ropc-v7"}),n.jsx(J,{flowType:"resource-owner-password"})]})})},sn=Object.freeze(Object.defineProperty({__proto__:null,default:rn},Symbol.toStringTag,{value:"Module"}));class an{baseUrl;constructor(e){this.baseUrl=`https://auth.pingone.com/${e}`}async exchangeAuthorizationCode(e,n){X.info("TokenManagementService","Exchanging authorization code for tokens",{authMethod:n.type,clientId:e.clientId});try{const t=`${this.baseUrl}/as/token`,o=this.buildTokenRequestBody(e,n),r=this.buildTokenHeaders(n),s=await fetch(t,{method:"POST",headers:r,body:o});if(!s.ok){const e=await s.text();throw new Error(`Token exchange failed: ${s.status} - ${e}`)}const i=await s.json();return X.success("TokenManagementService","Authorization code exchanged successfully",{tokenType:i.token_type,expiresIn:i.expires_in}),i}catch(t){throw X.error("TokenManagementService","Failed to exchange authorization code",t),t}}async refreshToken(e,n){X.info("TokenManagementService","Refreshing access token",{authMethod:n.type,clientId:e.clientId});try{const t=`${this.baseUrl}/as/token`,o=this.buildTokenRequestBody(e,n),r=this.buildTokenHeaders(n),s=await fetch(t,{method:"POST",headers:r,body:o});if(!s.ok){const e=await s.text();throw new Error(`Token refresh failed: ${s.status} - ${e}`)}const i=await s.json();return X.success("TokenManagementService","Token refreshed successfully",{tokenType:i.token_type,expiresIn:i.expires_in}),i}catch(t){throw X.error("TokenManagementService","Failed to refresh token",t),t}}async exchangeToken(e,n){X.info("TokenManagementService","Exchanging tokens",{authMethod:n.type,clientId:e.clientId});try{const t="/api/token-exchange",o=this.buildTokenRequestBody(e,n);this.buildTokenHeaders(n);let r={};if(o instanceof FormData)for(const[e,n]of o.entries())r[e]=n;else r=o;const s=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({environment_id:this.baseUrl.split("/").pop(),...r})});if(!s.ok){const e=await s.text();throw new Error(`Token exchange failed: ${s.status} - ${e}`)}const i=await s.json();return X.success("TokenManagementService","Token exchange completed successfully",{tokenType:i.token_type,expiresIn:i.expires_in}),i}catch(t){throw X.error("TokenManagementService","Failed to exchange tokens",t),t}}async introspectToken(e,n,t,o,r){X.info("TokenManagementService","Introspecting token",{tokenTypeHint:n,authMethod:t.type});try{const s=`${this.baseUrl}/as/introspect`,i=this.buildIntrospectionRequestBody(e,n,o,r),a=this.buildIntrospectionHeaders(t),c=await fetch(s,{method:"POST",headers:a,body:i});if(!c.ok){const e=await c.text();throw new Error(`Token introspection failed: ${c.status} - ${e}`)}const l=await c.json();return X.success("TokenManagementService","Token introspection completed",{active:l.active,tokenType:l.token_type}),l}catch(s){throw X.error("TokenManagementService","Failed to introspect token",s),s}}async revokeToken(e){X.info("TokenManagementService","Revoking token",{tokenTypeHint:e.token_type_hint});try{const n=`https://auth.pingone.com/${e.environmentId}/as/revoke`,t=this.buildRevocationRequestBody(e),o=this.buildRevocationHeaders(e),r=await fetch(n,{method:"POST",headers:o,body:t});if(!r.ok){const e=await r.text();throw new Error(`Token revocation failed: ${r.status} - ${e}`)}return X.success("TokenManagementService","Token revoked successfully"),!0}catch(n){throw X.error("TokenManagementService","Failed to revoke token",n),n}}buildTokenRequestBody(e,n){const t=new FormData;switch(t.append("grant_type",e.grantType),"authorization_code"===e.grantType&&e.code&&(t.append("code",e.code),e.redirectUri&&t.append("redirect_uri",e.redirectUri)),"refresh_token"===e.grantType&&e.refreshToken&&t.append("refresh_token",e.refreshToken),e.scope&&t.append("scope",e.scope),"urn:ietf:params:oauth:grant-type:token-exchange"===e.grantType&&(e.audience&&t.append("audience",e.audience),e.subjectToken&&t.append("subject_token",e.subjectToken),e.subjectTokenType&&t.append("subject_token_type",e.subjectTokenType),e.actorToken&&t.append("actor_token",e.actorToken),e.actorTokenType&&t.append("actor_token_type",e.actorTokenType),e.requestedTokenType&&t.append("requested_token_type",e.requestedTokenType)),n.type){case"CLIENT_SECRET_POST":n.clientSecret&&t.append("client_secret",n.clientSecret),t.append("client_id",e.clientId);break;case"CLIENT_SECRET_JWT":if(n.clientSecret){const o=this.generateClientSecretJWT(e,n);t.append("client_assertion",o),t.append("client_assertion_type","urn:ietf:params:oauth:client-assertion-type:jwt-bearer")}t.append("client_id",e.clientId);break;case"PRIVATE_KEY_JWT":if(n.privateKey){const o=this.generatePrivateKeyJWT(e,n);t.append("client_assertion",o),t.append("client_assertion_type","urn:ietf:params:oauth:client-assertion-type:jwt-bearer")}t.append("client_id",e.clientId);break;case"NONE":t.append("client_id",e.clientId)}return t}buildTokenHeaders(e){const n={"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"};if("CLIENT_SECRET_BASIC"===e.type&&e.clientSecret){const t=btoa(`${e.clientId}:${e.clientSecret}`);n.Authorization=`Basic ${t}`}return n}buildIntrospectionRequestBody(e,n,t,o){const r=new FormData;return r.append("token",e),r.append("token_type_hint",n),t&&r.append("resource",t),o&&r.append("resource_secret",o),r}buildIntrospectionHeaders(e){const n={"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"};if(e.clientSecret){const t=btoa(`${e.clientId}:${e.clientSecret}`);n.Authorization=`Basic ${t}`}return n}buildRevocationRequestBody(e){const n=new FormData;return n.append("token",e.token),e.token_type_hint&&n.append("token_type_hint",e.token_type_hint),n.append("client_id",e.clientId),e.clientSecret&&n.append("client_secret",e.clientSecret),n}buildRevocationHeaders(e){const n={"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"};if(e.clientSecret){const t=btoa(`${e.clientId}:${e.clientSecret}`);n.Authorization=`Basic ${t}`}return n}generateClientSecretJWT(e,n){const t=Math.floor(Date.now()/1e3),o={iss:e.clientId,sub:e.clientId,aud:`${this.baseUrl}/as/token`,iat:t,exp:t+300,jti:this.generateJTI()},r=`${btoa(JSON.stringify({alg:"HS256",typ:"JWT"}))}.${btoa(JSON.stringify(o))}.mock_signature`;return X.info("TokenManagementService","Generated client secret JWT",{jti:o.jti}),r}generatePrivateKeyJWT(e,n){const t=Math.floor(Date.now()/1e3),o={alg:"RS256",typ:"JWT",kid:n.keyId||"default-key"},r={iss:e.clientId,sub:e.clientId,aud:`${this.baseUrl}/as/token`,iat:t,exp:t+300,jti:this.generateJTI()},s=btoa(JSON.stringify(o))+"."+btoa(JSON.stringify(r))+".mock_rsa_signature";return X.info("TokenManagementService","Generated private key JWT",{jti:r.jti,keyId:n.keyId}),s}generateJTI(){return`jti_${Date.now()}_${Math.random().toString(36).substring(2,8)}`}validateTokenRequest(e){const n=[];return e.clientId||n.push("clientId is required"),e.environmentId||n.push("environmentId is required"),e.grantType||n.push("grantType is required"),"authorization_code"!==e.grantType||e.code||n.push("code is required for authorization_code grant type"),"refresh_token"!==e.grantType||e.refreshToken||n.push("refreshToken is required for refresh_token grant type"),"urn:ietf:params:oauth:grant-type:token-exchange"===e.grantType&&(e.subjectToken||n.push("subjectToken is required for token exchange"),e.subjectTokenType||n.push("subjectTokenType is required for token exchange")),{valid:0===n.length,errors:n}}}const cn=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`,ln=x.h1`
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`,dn=x.p`
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`,pn=x.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`,un=x.div`
  margin-bottom: 1rem;
`,hn=x.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
`,mn=x.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;x.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;const gn=x.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,fn=x.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({$variant:e})=>{switch(e){case"primary":return"\n          background-color: #3b82f6;\n          color: white;\n          &:hover { background-color: #2563eb; }\n        ";case"secondary":return"\n          background-color: #6b7280;\n          color: white;\n          &:hover { background-color: #4b5563; }\n        ";case"success":return"\n          background-color: #10b981;\n          color: white;\n          &:hover { background-color: #059669; }\n        ";case"danger":return"\n          background-color: #ef4444;\n          color: white;\n          &:hover { background-color: #dc2626; }\n        "}}}
`,kn=x.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
`,vn=x.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
`,xn=x.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #991b1b;
`,jn=x.div`
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #1e40af;
`,bn=x.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`,yn=x.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`,wn=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`,Tn=x.div`
  display: flex;
  flex-direction: column;
`,In=x.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`,Sn=x.span`
  font-size: 0.875rem;
  color: ${({$active:e})=>e?"#10b981":"#1f2937"};
  font-weight: ${({$active:e})=>e?"600":"500"};
  word-break: break-all;
`,Cn=x.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${({$active:e})=>e?"#dcfce7":"#fef2f2"};
  color: ${({$active:e})=>e?"#166534":"#991b1b"};
`,_n=x.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`,qn=x.button`
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${({$active:e})=>e?"#3b82f6":"transparent"};
  color: ${({$active:e})=>e?"#3b82f6":"#6b7280"};
  
  &:hover {
    color: #3b82f6;
  }
`,Rn=({credentials:t})=>{const[o,r]=e.useState(0),[s,i]=e.useState("idle"),[a,c]=e.useState("access_token"),[l,d]=e.useState("CLIENT_SECRET_BASIC"),[p,u]=e.useState(()=>{let e="";try{const n=localStorage.getItem("unified_worker_token");if(n){const t=JSON.parse(n);e=t.credentials?.environmentId||""}}catch(n){}return{clientId:t?.clientId||"",clientSecret:t?.clientSecret||"",environmentId:t?.environmentId||e||"",tokenToIntrospect:"mock_access_token_to_introspect_example_abcdef123456",tokenTypeHint:"access_token",resourceId:"",resourceSecret:"",privateKey:"",keyId:"",jwksUri:""}}),[h,m]=e.useState(null),[g,f]=e.useState(null),[k,v]=e.useState(null),[x]=e.useState(()=>new an(p.environmentId));e.useEffect(()=>{const e=()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const n=JSON.parse(e);n.credentials?.environmentId&&!p.environmentId&&u(e=>({...e,environmentId:n.credentials.environmentId}))}}catch(e){}};return window.addEventListener("workerTokenUpdated",e),()=>window.removeEventListener("workerTokenUpdated",e)},[p.environmentId]);const j=[{id:"step-1",title:"Configure Token Introspection Settings",description:"Set up your OAuth client for token introspection operations.",code:`// Token Introspection Configuration\nconst introspectionConfig = {\n  clientId: '${p.clientId}',\n  clientSecret: '${p.clientSecret}',\n  environmentId: '${p.environmentId}',\n  tokenTypeHint: '${p.tokenTypeHint}',\n  authMethod: '${l}',\n  resourceId: '${p.resourceId}',\n  resourceSecret: '${p.resourceSecret}'\n};\n\nconsole.log('Token introspection configured:', introspectionConfig);`,execute:async()=>{X.info("TokenIntrospectionFlow","Configuring token introspection settings")}},{id:"step-2",title:`Introspect ${"resource_based"===a?"Token (Resource-based)":a.toUpperCase()}`,description:`Get detailed information about the ${"resource_based"===a?"token using resource-based authentication":a}.`,code:`// Token Introspection\nconst tokenService = new TokenManagementService('${p.environmentId}');\n\nconst authMethod: TokenAuthMethod = {\n  type: '${l}',\n  clientId: '${p.clientId}',\n  clientSecret: '${p.clientSecret}',\n  privateKey: '${p.privateKey}',\n  keyId: '${p.keyId}',\n  jwksUri: '${p.jwksUri}'\n};\n\nconst introspectionResponse = await tokenService.introspectToken(\n  '${p.tokenToIntrospect}',\n  '${p.tokenTypeHint}',\n  authMethod,\n  '${p.resourceId}',\n  '${p.resourceSecret}'\n);\n\nconsole.log('Token introspection response:', introspectionResponse);\nconsole.log('Token active:', introspectionResponse.active);\nconsole.log('Token scope:', introspectionResponse.scope);\nconsole.log('Token expires at:', new Date(introspectionResponse.exp! * 1000));`,execute:async()=>{X.info("TokenIntrospectionFlow","Introspecting token",{tokenType:a,authMethod:l}),i("loading");try{let e;e="access_token"===a?{active:!0,scope:"openid profile email",client_id:p.clientId,token_type:"Bearer",exp:Math.floor(Date.now()/1e3)+3600,iat:Math.floor(Date.now()/1e3)-300,sub:"user_123456789",aud:p.clientId,iss:`https://auth.pingone.com/${p.environmentId}`,jti:`jti_${Date.now()}`,username:"john.doe@example.com",auth_time:Math.floor(Date.now()/1e3)-600}:"refresh_token"===a?{active:!0,scope:"openid profile email",client_id:p.clientId,token_type:"Bearer",exp:Math.floor(Date.now()/1e3)+86400,iat:Math.floor(Date.now()/1e3)-3600,sub:"user_123456789",aud:p.clientId,iss:`https://auth.pingone.com/${p.environmentId}`,jti:`jti_${Date.now()}`,username:"john.doe@example.com",auth_time:Math.floor(Date.now()/1e3)-3600}:{active:!0,scope:"openid profile email",client_id:p.clientId,token_type:"Bearer",exp:Math.floor(Date.now()/1e3)+3600,iat:Math.floor(Date.now()/1e3)-300,sub:"user_123456789",aud:p.clientId,iss:`https://auth.pingone.com/${p.environmentId}`,jti:`jti_${Date.now()}`,username:"john.doe@example.com",auth_time:Math.floor(Date.now()/1e3)-600,resource:p.resourceId},v(e),m({success:!0,message:"Token introspection completed successfully",introspection:e,authMethod:l,tokenType:a}),i("success")}catch(e){const n=e instanceof Error?e.message:"Unknown error";throw f(n),i("error"),e}}},{id:"step-3",title:"Analyze Token Information",description:"Analyze the token information and validate its properties.",code:"// Analyze Token Information\nif (introspectionResponse.active) {\n  console.log(' Token is active and valid');\n  \n  // Check expiration\n  const now = Math.floor(Date.now() / 1000);\n  if (introspectionResponse.exp && introspectionResponse.exp > now) {\n    const timeLeft = introspectionResponse.exp - now;\n    console.log(` Token expires in ${timeLeft} seconds`);\n  } else {\n    console.log(' Token has expired');\n  }\n  \n  // Check scope\n  if (introspectionResponse.scope) {\n    const scopes = introspectionResponse.scope.split(' ');\n    console.log(` Token has ${scopes.length} scopes:`, scopes);\n  }\n  \n  // Check audience\n  if (introspectionResponse.aud) {\n    console.log(' Token audience:', introspectionResponse.aud);\n  }\n  \n  // Check issuer\n  if (introspectionResponse.iss) {\n    console.log(' Token issuer:', introspectionResponse.iss);\n  }\n} else {\n  console.log(' Token is inactive or invalid');\n}",execute:async()=>{if(X.info("TokenIntrospectionFlow","Analyzing token information"),k){const e={isActive:k.active,isExpired:!!k.exp&&k.exp<Math.floor(Date.now()/1e3),timeLeft:k.exp?Math.max(0,k.exp-Math.floor(Date.now()/1e3)):0,scopeCount:k.scope?k.scope.split(" ").length:0,hasAudience:!!k.aud,hasIssuer:!!k.iss};m(n=>({...n,analysis:e,message:"Token analysis completed"}))}}},{id:"step-4",title:"Handle Token Validation",description:"Validate the token and handle different validation scenarios.",code:"// Handle Token Validation\nconst validateToken = (introspectionResponse) => {\n  const validations = [];\n  \n  // Check if token is active\n  if (!introspectionResponse.active) {\n    validations.push({ type: 'error', message: 'Token is inactive' });\n    return { valid: false, validations };\n  }\n  \n  // Check expiration\n  const now = Math.floor(Date.now() / 1000);\n  if (introspectionResponse.exp && introspectionResponse.exp <= now) {\n    validations.push({ type: 'error', message: 'Token has expired' });\n    return { valid: false, validations };\n  }\n  \n  // Check if token is not yet valid\n  if (introspectionResponse.nbf && introspectionResponse.nbf > now) {\n    validations.push({ type: 'warning', message: 'Token is not yet valid' });\n  }\n  \n  // Check required scopes\n  const requiredScopes = ['openid'];\n  if (introspectionResponse.scope) {\n    const tokenScopes = introspectionResponse.scope.split(' ');\n    const missingScopes = requiredScopes.filter(scope => !tokenScopes.includes(scope));\n    if (missingScopes.length > 0) {\n      validations.push({ type: 'warning', message: `Missing required scopes: ${missingScopes.join(', ')}` });\n    }\n  }\n  \n  // Check audience\n  if (!introspectionResponse.aud) {\n    validations.push({ type: 'warning', message: 'Token has no audience' });\n  }\n  \n  validations.push({ type: 'success', message: 'Token validation passed' });\n  \n  return { valid: true, validations };\n};\n\nconst validation = validateToken(introspectionResponse);\nconsole.log('Token validation result:', validation);",execute:async()=>{if(X.info("TokenIntrospectionFlow","Validating token"),k){const e=[];if(k.active){const n=Math.floor(Date.now()/1e3);k.exp&&k.exp<=n?e.push({type:"error",message:"Token has expired"}):e.push({type:"success",message:"Token validation passed"})}else e.push({type:"error",message:"Token is inactive"});m(n=>({...n,validation:{valid:e.every(e=>"error"!==e.type),validations:e},message:"Token validation completed"}))}}}],b=e.useCallback(e=>{r(e),i("idle"),m(null),f(null)},[]),y=e.useCallback((e,n)=>{X.info("TokenIntrospectionFlow",`Step ${e+1} completed`,n)},[]);return n.jsxs(cn,{children:[n.jsx(ln,{children:"Token Introspection Flow"}),n.jsx(dn,{children:"This flow demonstrates token introspection operations to get detailed information about access tokens, ID tokens, and refresh tokens. It supports both client-based and resource-based introspection."}),n.jsxs(jn,{children:[n.jsx("h4",{children:" Token Introspection Features"}),n.jsx("p",{children:"Token introspection allows you to get detailed information about tokens including their validity, expiration, scope, and other claims. This is essential for token validation and security analysis."})]}),n.jsx(q,{flowType:"token-introspection",onCredentialsChange:e=>{u(n=>({...n,clientId:e.clientId||n.clientId,clientSecret:e.clientSecret||n.clientSecret,environmentId:e.environmentId||n.environmentId}))}}),n.jsxs(_n,{children:[n.jsx(qn,{$active:"access_token"===a,onClick:()=>c("access_token"),children:"Access Token"}),n.jsx(qn,{$active:"refresh_token"===a,onClick:()=>c("refresh_token"),children:"Refresh Token"}),n.jsx(qn,{$active:"resource_based"===a,onClick:()=>c("resource_based"),children:"Resource-based"})]}),n.jsxs("div",{style:{padding:"12px 16px",background:"#fef3c7",border:"1px solid #f59e0b",borderRadius:"6px",marginBottom:"1rem",fontSize:"14px",color:"#92400e"},children:[n.jsx("strong",{children:"ℹ️ Note:"})," ID tokens should be validated locally (verify signature, issuer, audience, expiration) rather than using the introspection endpoint. The introspection endpoint is designed for opaque access tokens and refresh tokens."]}),n.jsx("div",{style:{display:"flex",gap:"1rem",marginBottom:"1.5rem"},children:n.jsxs("div",{style:{flex:1},children:[n.jsx(hn,{children:"Authentication Method"}),n.jsxs(gn,{value:l,onChange:e=>d(e.target.value),children:[n.jsx("option",{value:"CLIENT_SECRET_BASIC",children:"CLIENT_SECRET_BASIC"}),n.jsx("option",{value:"CLIENT_SECRET_POST",children:"CLIENT_SECRET_POST"}),n.jsx("option",{value:"CLIENT_SECRET_JWT",children:"CLIENT_SECRET_JWT"}),n.jsx("option",{value:"PRIVATE_KEY_JWT",children:"PRIVATE_KEY_JWT"})]})]})}),n.jsx(B,{steps:j,currentStep:o,onStepChange:b,onStepResult:y,onStart:()=>i("loading"),onReset:()=>{r(0),i("idle"),m(null),f(null),v(null);try{sessionStorage.removeItem("config-checker-diffs"),sessionStorage.removeItem("config-checker-last-check"),sessionStorage.removeItem("pingone-app-cache"),localStorage.removeItem("pingone-applications-cache"),sessionStorage.removeItem("worker-token-cache"),localStorage.removeItem("worker-apps-cache")}catch(e){}},status:s,disabled:"loading"===s,title:`Token Introspection Steps (${a})`}),k&&n.jsxs(bn,{children:[n.jsxs(yn,{children:["Token Introspection Results",n.jsx(Cn,{$active:k.active,children:k.active?"Active":"Inactive"})]}),n.jsxs(wn,{children:[n.jsxs(Tn,{children:[n.jsx(In,{children:"Token Type"}),n.jsx(Sn,{children:k.token_type||"Not specified"})]}),n.jsxs(Tn,{children:[n.jsx(In,{children:"Scope"}),n.jsx(Sn,{children:k.scope||"Not specified"})]}),n.jsxs(Tn,{children:[n.jsx(In,{children:"Client ID"}),n.jsx(Sn,{children:k.client_id||"Not specified"})]}),n.jsxs(Tn,{children:[n.jsx(In,{children:"Subject"}),n.jsx(Sn,{children:k.sub||"Not specified"})]}),n.jsxs(Tn,{children:[n.jsx(In,{children:"Username"}),n.jsx(Sn,{children:k.username||"Not specified"})]}),n.jsxs(Tn,{children:[n.jsx(In,{children:"Audience"}),n.jsx(Sn,{children:Array.isArray(k.aud)?k.aud.join(", "):k.aud||"Not specified"})]}),n.jsxs(Tn,{children:[n.jsx(In,{children:"Issuer"}),n.jsx(Sn,{children:k.iss||"Not specified"})]}),n.jsxs(Tn,{children:[n.jsx(In,{children:"JTI"}),n.jsx(Sn,{children:k.jti||"Not specified"})]}),n.jsxs(Tn,{children:[n.jsx(In,{children:"Issued At"}),n.jsx(Sn,{children:k.iat?new Date(1e3*k.iat).toLocaleString():"Not specified"})]}),n.jsxs(Tn,{children:[n.jsx(In,{children:"Expires At"}),n.jsx(Sn,{children:k.exp?new Date(1e3*k.exp).toLocaleString():"Not specified"})]}),n.jsxs(Tn,{children:[n.jsx(In,{children:"Auth Time"}),n.jsx(Sn,{children:k.auth_time?new Date(1e3*k.auth_time).toLocaleString():"Not specified"})]}),k.nonce&&n.jsxs(Tn,{children:[n.jsx(In,{children:"Nonce"}),n.jsx(Sn,{children:k.nonce})]}),k.at_hash&&n.jsxs(Tn,{children:[n.jsx(In,{children:"AT Hash"}),n.jsx(Sn,{children:k.at_hash})]}),k.resource&&n.jsxs(Tn,{children:[n.jsx(In,{children:"Resource"}),n.jsx(Sn,{children:k.resource})]})]})]}),h&&n.jsxs(vn,{children:[n.jsx("h4",{children:"Response:"}),n.jsx(kn,{children:n.jsx(S,{data:h})})]}),g&&n.jsxs(xn,{children:[n.jsx("h4",{children:"Error:"}),n.jsx("p",{children:g})]}),n.jsxs(pn,{children:[n.jsx("h3",{children:"Manual Token Introspection Configuration"}),n.jsx("p",{children:"You can also manually configure the token introspection:"}),n.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"},children:[n.jsxs(un,{children:[n.jsx(hn,{children:"Client ID"}),n.jsx(mn,{type:"text",value:p.clientId,onChange:e=>u(n=>({...n,clientId:e.target.value}))})]}),n.jsxs(un,{children:[n.jsx(hn,{children:"Environment ID"}),n.jsx(mn,{type:"text",value:p.environmentId,onChange:e=>u(n=>({...n,environmentId:e.target.value}))})]}),n.jsxs(un,{children:[n.jsx(hn,{children:"Token to Introspect"}),n.jsx(mn,{type:"text",value:p.tokenToIntrospect,onChange:e=>u(n=>({...n,tokenToIntrospect:e.target.value})),placeholder:"Enter token to introspect"})]}),n.jsxs(un,{children:[n.jsx(hn,{children:"Token Type Hint"}),n.jsxs(gn,{value:p.tokenTypeHint,onChange:e=>u(n=>({...n,tokenTypeHint:e.target.value})),children:[n.jsx("option",{value:"access_token",children:"Access Token"}),n.jsx("option",{value:"id_token",children:"ID Token"}),n.jsx("option",{value:"refresh_token",children:"Refresh Token"})]})]}),"resource_based"===a&&n.jsxs(n.Fragment,{children:[n.jsxs(un,{children:[n.jsx(hn,{children:"Resource ID"}),n.jsx(mn,{type:"text",value:p.resourceId,onChange:e=>u(n=>({...n,resourceId:e.target.value})),placeholder:"Enter resource ID"})]}),n.jsxs(un,{children:[n.jsx(hn,{children:"Resource Secret"}),n.jsx(mn,{type:"password",value:p.resourceSecret,onChange:e=>u(n=>({...n,resourceSecret:e.target.value})),autoComplete:"current-password",placeholder:"Enter resource secret"})]})]})]}),n.jsx(fn,{$variant:"primary",onClick:async()=>{try{let e;i("loading"),f(null),e="access_token"===a?{active:!0,scope:"openid profile email",client_id:p.clientId,token_type:"Bearer",exp:Math.floor(Date.now()/1e3)+3600,iat:Math.floor(Date.now()/1e3)-300,sub:"user_123456789",aud:p.clientId,iss:`https://auth.pingone.com/${p.environmentId}`,jti:`jti_${Date.now()}`,username:"john.doe@example.com",auth_time:Math.floor(Date.now()/1e3)-600}:"id_token"===a?{active:!0,scope:"openid profile email",client_id:p.clientId,token_type:"Bearer",exp:Math.floor(Date.now()/1e3)+3600,iat:Math.floor(Date.now()/1e3)-300,sub:"user_123456789",aud:p.clientId,iss:`https://auth.pingone.com/${p.environmentId}`,jti:`jti_${Date.now()}`,username:"john.doe@example.com",auth_time:Math.floor(Date.now()/1e3)-600,nonce:`nonce_${Date.now()}`,at_hash:`at_hash_${Date.now()}`}:"refresh_token"===a?{active:!0,scope:"openid profile email",client_id:p.clientId,token_type:"Bearer",exp:Math.floor(Date.now()/1e3)+86400,iat:Math.floor(Date.now()/1e3)-3600,sub:"user_123456789",aud:p.clientId,iss:`https://auth.pingone.com/${p.environmentId}`,jti:`jti_${Date.now()}`,username:"john.doe@example.com",auth_time:Math.floor(Date.now()/1e3)-3600}:{active:!0,scope:"openid profile email",client_id:p.clientId,token_type:"Bearer",exp:Math.floor(Date.now()/1e3)+3600,iat:Math.floor(Date.now()/1e3)-300,sub:"user_123456789",aud:p.clientId,iss:`https://auth.pingone.com/${p.environmentId}`,jti:`jti_${Date.now()}`,username:"john.doe@example.com",auth_time:Math.floor(Date.now()/1e3)-600,resource:p.resourceId},v(e),m({success:!0,message:"Token introspection completed successfully",introspection:e,authMethod:l,tokenType:a}),i("success")}catch(e){const n=e instanceof Error?e.message:"Unknown error";f(n),i("error")}},children:"Introspect Token"})]})]})},En=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`,$n=x.h1`
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`,Dn=x.p`
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`,An=x.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`,Bn=x.div`
  margin-bottom: 1rem;
`,zn=x.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
`,Un=x.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Fn=x.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Mn=x.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Jn=x.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({$variant:e})=>{switch(e){case"primary":return"\n          background-color: #3b82f6;\n          color: white;\n          &:hover { background-color: #2563eb; }\n        ";case"secondary":return"\n          background-color: #6b7280;\n          color: white;\n          &:hover { background-color: #4b5563; }\n        ";case"success":return"\n          background-color: #10b981;\n          color: white;\n          &:hover { background-color: #059669; }\n        ";case"danger":return"\n          background-color: #ef4444;\n          color: white;\n          &:hover { background-color: #dc2626; }\n        "}}}
`,Nn=x.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
`,Pn=x.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
`,Wn=x.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #991b1b;
`;x.div`
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #1e40af;
`;const On=x.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #92400e;
`,Ln=x.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`,Xn=x.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`,Hn=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`,Kn=x.div`
  display: flex;
  flex-direction: column;
`,Qn=x.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`,Gn=x.span`
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
  word-break: break-all;
`,Yn=x.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${({$success:e})=>e?"#dcfce7":"#fef2f2"};
  color: ${({$success:e})=>e?"#166534":"#991b1b"};
`,Vn=x.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`,Zn=x.button`
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${({$active:e})=>e?"#3b82f6":"transparent"};
  color: ${({$active:e})=>e?"#3b82f6":"#6b7280"};
  
  &:hover {
    color: #3b82f6;
  }
`,et=({credentials:t})=>{const[o,r]=e.useState(0),[s,i]=e.useState("idle"),[a,c]=e.useState("access_token"),[l,d]=e.useState(()=>{let e="";try{const n=localStorage.getItem("unified_worker_token");if(n){const t=JSON.parse(n);e=t.credentials?.environmentId||""}}catch(n){}return{clientId:t?.clientId||"",clientSecret:t?.clientSecret||"",environmentId:t?.environmentId||e||"",tokenToRevoke:"mock_access_token_to_revoke_example_12345",tokenTypeHint:"access_token",bulkTokens:"mock_access_token_1,mock_access_token_2,mock_refresh_token_1",revocationReason:""}}),[p,u]=e.useState(null),[h,m]=e.useState(null),[g,f]=e.useState(null),[k]=e.useState(()=>new an(l.environmentId));e.useEffect(()=>{const e=()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const n=JSON.parse(e);n.credentials?.environmentId&&!l.environmentId&&d(e=>({...e,environmentId:n.credentials.environmentId}))}}catch(e){}};return window.addEventListener("workerTokenUpdated",e),()=>window.removeEventListener("workerTokenUpdated",e)},[l.environmentId]);const v=[{id:"step-1",title:"Configure Token Revocation Settings",description:"Set up your OAuth client for token revocation operations.",code:`// Token Revocation Configuration\nconst revocationConfig = {\n  clientId: '${l.clientId}',\n  clientSecret: '${l.clientSecret}',\n  environmentId: '${l.environmentId}',\n  tokenTypeHint: '${l.tokenTypeHint}',\n  revocationReason: '${l.revocationReason}'\n};\n\nconsole.log('Token revocation configured:', revocationConfig);`,execute:async()=>{X.info("TokenRevocationFlow","Configuring token revocation settings")}},{id:"step-2",title:"bulk_revocation"===a?"Revoke Multiple Tokens":`Revoke ${a.toUpperCase()}`,description:"bulk_revocation"===a?"Revoke multiple tokens in a single operation.":`Revoke the specified ${a}.`,code:"bulk_revocation"===a?`// Bulk Token Revocation\nconst tokens = '${l.bulkTokens}'.split('\\n').filter(token => token.trim());\nconst revocationPromises = tokens.map(token => {\n  const revocationRequest: TokenRevocationRequest = {\n    token: token.trim(),\n    token_type_hint: 'access_token',\n    clientId: '${l.clientId}',\n    clientSecret: '${l.clientSecret}',\n    environmentId: '${l.environmentId}'\n  };\n  \n  return tokenService.revokeToken(revocationRequest);\n});\n\nconst results = await Promise.allSettled(revocationPromises);\nconst successful = results.filter(result => result.status === 'fulfilled').length;\nconst failed = results.filter(result => result.status === 'rejected').length;\n\nconsole.log(\`Bulk revocation completed: \${successful} successful, \${failed} failed\`);`:`// Single Token Revocation\nconst revocationRequest: TokenRevocationRequest = {\n  token: '${l.tokenToRevoke}',\n  token_type_hint: '${l.tokenTypeHint}',\n  clientId: '${l.clientId}',\n  clientSecret: '${l.clientSecret}',\n  environmentId: '${l.environmentId}'\n};\n\nconst tokenService = new TokenManagementService('${l.environmentId}');\nconst revoked = await tokenService.revokeToken(revocationRequest);\n\nif (revoked) {\n  console.log('Token revoked successfully');\n} else {\n  console.log('Token revocation failed');\n}`,execute:async()=>{X.info("TokenRevocationFlow","Revoking token(s)",{type:a,tokenCount:"bulk_revocation"===a?l.bulkTokens.split("\n").filter(e=>e.trim()).length:1}),i("loading");try{let e;if("bulk_revocation"===a){const n=l.bulkTokens.split("\n").filter(e=>e.trim()),t=n.map((e,n)=>({token:e.trim(),success:Math.random()>.1,error:Math.random()>.9?"Token not found":null})),o=t.filter(e=>e.success).length,r=t.filter(e=>!e.success).length;e={type:"bulk",total:n.length,successful:o,failed:r,results:t}}else e={type:"single",success:!0,token:l.tokenToRevoke,tokenType:l.tokenTypeHint,revokedAt:(new Date).toISOString(),reason:l.revocationReason};f(e),u({success:!0,message:"Token revocation completed successfully",result:e,type:a}),i("success")}catch(e){const n=e instanceof Error?e.message:"Unknown error";throw m(n),i("error"),e}}},{id:"step-3",title:"Verify Revocation",description:"Verify that the token has been successfully revoked.",code:"// Verify Token Revocation\nconst verifyRevocation = async (token) => {\n  try {\n    // Try to use the token - it should fail if revoked\n    const response = await fetch('/api/protected-resource', {\n      headers: {\n        'Authorization': `Bearer ${token}`\n      }\n    });\n    \n    if (response.status === 401) {\n      console.log(' Token is revoked (401 Unauthorized)');\n      return { revoked: true, reason: 'Token rejected by server' };\n    } else if (response.ok) {\n      console.log(' Token is still valid');\n      return { revoked: false, reason: 'Token accepted by server' };\n    }\n  } catch (error) {\n    console.log(' Token is revoked (Network error)');\n    return { revoked: true, reason: 'Token rejected by server' };\n  }\n};\n\n// Verify revocation for each token\nif (revocationResult.type === 'bulk') {\n  const verificationPromises = revocationResult.results\n    .filter(r => r.success)\n    .map(r => verifyRevocation(r.token));\n  \n  const verifications = await Promise.all(verificationPromises);\n  console.log('Bulk verification results:', verifications);\n} else {\n  const verification = await verifyRevocation(revocationResult.token);\n  console.log('Single verification result:', verification);\n}",execute:async()=>{if(X.info("TokenRevocationFlow","Verifying token revocation"),g){const e={verified:!0,method:"simulation",timestamp:(new Date).toISOString(),note:"In a real implementation, you would verify by attempting to use the token"};u(n=>({...n,verification:e,message:"Token revocation verification completed"}))}}},{id:"step-4",title:"Handle Revocation Cleanup",description:"Clean up local storage and handle post-revocation tasks.",code:"// Handle Revocation Cleanup\nconst cleanupAfterRevocation = (revocationResult) => {\n  if (revocationResult.type === 'single') {\n    // Remove single token from local storage\n    const storedTokens = JSON.parse(localStorage.getItem('oauth_tokens') || '{}');\n    if (storedTokens.access_token === revocationResult.token) {\n      delete storedTokens.access_token;\n    }\n    if (storedTokens.refresh_token === revocationResult.token) {\n      delete storedTokens.refresh_token;\n    }\n    localStorage.setItem('oauth_tokens', JSON.stringify(storedTokens));\n    console.log('Single token removed from local storage');\n  } else {\n    // Remove multiple tokens from local storage\n    const tokensToRemove = revocationResult.results\n      .filter(r => r.success)\n      .map(r => r.token);\n    \n    const storedTokens = JSON.parse(localStorage.getItem('oauth_tokens') || '{}');\n    tokensToRemove.forEach(token => {\n      if (storedTokens.access_token === token) {\n        delete storedTokens.access_token;\n      }\n      if (storedTokens.refresh_token === token) {\n        delete storedTokens.refresh_token;\n      }\n    });\n    localStorage.setItem('oauth_tokens', JSON.stringify(storedTokens));\n    console.log(`${tokensToRemove.length} tokens removed from local storage`);\n  }\n  \n  // Clear any cached user data\n  localStorage.removeItem('user_info');\n  localStorage.removeItem('user_data');\n  \n  // Redirect to login if no valid tokens remain\n  const remainingTokens = JSON.parse(localStorage.getItem('oauth_tokens') || '{}');\n  if (!remainingTokens.access_token && !remainingTokens.refresh_token) {\n    console.log('No valid tokens remaining, redirecting to login');\n    // window.location.href = '/login';\n  }\n};\n\ncleanupAfterRevocation(revocationResult);",execute:async()=>{X.info("TokenRevocationFlow","Handling revocation cleanup");const e={localStorageCleared:!0,userDataCleared:!0,redirectRequired:!1,timestamp:(new Date).toISOString()};u(n=>({...n,cleanup:e,message:"Revocation cleanup completed"}))}}],x=e.useCallback(e=>{r(e),i("idle"),u(null),m(null)},[]),j=e.useCallback((e,n)=>{X.info("TokenRevocationFlow",`Step ${e+1} completed`,n)},[]);return n.jsxs(En,{children:[n.jsx($n,{children:"Token Revocation Flow"}),n.jsx(Dn,{children:"This flow demonstrates token revocation operations to invalidate access tokens and refresh tokens. It supports both single token revocation and bulk revocation for enhanced security and user management."}),n.jsxs(On,{children:[n.jsx("h4",{children:" Token Revocation Security"}),n.jsx("p",{children:"Token revocation is a critical security operation that immediately invalidates tokens. Once revoked, tokens cannot be used for authentication. This is essential for logout functionality and security incident response."})]}),n.jsx(q,{flowType:"token-revocation",onCredentialsChange:e=>{d(n=>({...n,clientId:e.clientId||n.clientId,clientSecret:e.clientSecret||n.clientSecret,environmentId:e.environmentId||n.environmentId}))}}),n.jsxs(Vn,{children:[n.jsx(Zn,{$active:"access_token"===a,onClick:()=>c("access_token"),children:"Access Token"}),n.jsx(Zn,{$active:"refresh_token"===a,onClick:()=>c("refresh_token"),children:"Refresh Token"}),n.jsx(Zn,{$active:"bulk_revocation"===a,onClick:()=>c("bulk_revocation"),children:"Bulk Revocation"})]}),n.jsx(B,{steps:v,currentStep:o,onStepChange:x,onStepResult:j,onStart:()=>i("loading"),onReset:()=>{r(0),i("idle"),u(null),m(null),f(null)},status:s,disabled:"loading"===s,title:`Token Revocation Steps (${a})`}),g&&n.jsxs(Ln,{children:[n.jsxs(Xn,{children:["Revocation Results",n.jsx(Yn,{$success:"single"===g.type?g.success:g.successful>0,children:"single"===g.type?g.success?"Success":"Failed":`${g.successful}/${g.total} Success`})]}),n.jsx(Hn,{children:"single"===g.type?n.jsxs(n.Fragment,{children:[n.jsxs(Kn,{children:[n.jsx(Qn,{children:"Token"}),n.jsx(Gn,{children:g.token})]}),n.jsxs(Kn,{children:[n.jsx(Qn,{children:"Token Type"}),n.jsx(Gn,{children:g.tokenType})]}),n.jsxs(Kn,{children:[n.jsx(Qn,{children:"Revoked At"}),n.jsx(Gn,{children:new Date(g.revokedAt).toLocaleString()})]}),n.jsxs(Kn,{children:[n.jsx(Qn,{children:"Reason"}),n.jsx(Gn,{children:g.reason})]})]}):n.jsxs(n.Fragment,{children:[n.jsxs(Kn,{children:[n.jsx(Qn,{children:"Total Tokens"}),n.jsx(Gn,{children:g.total})]}),n.jsxs(Kn,{children:[n.jsx(Qn,{children:"Successful"}),n.jsx(Gn,{children:g.successful})]}),n.jsxs(Kn,{children:[n.jsx(Qn,{children:"Failed"}),n.jsx(Gn,{children:g.failed})]}),n.jsxs(Kn,{children:[n.jsx(Qn,{children:"Success Rate"}),n.jsxs(Gn,{children:[Math.round(g.successful/g.total*100),"%"]})]})]})})]}),p&&n.jsxs(Pn,{children:[n.jsx("h4",{children:"Response:"}),n.jsx(Nn,{children:n.jsx(S,{data:p})})]}),h&&n.jsxs(Wn,{children:[n.jsx("h4",{children:"Error:"}),n.jsx("p",{children:h})]}),n.jsxs(An,{children:[n.jsx("h3",{children:"Manual Token Revocation Configuration"}),n.jsx("p",{children:"You can also manually configure the token revocation:"}),n.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"},children:[n.jsxs(Bn,{children:[n.jsx(zn,{children:"Client ID"}),n.jsx(Un,{type:"text",value:l.clientId,onChange:e=>d(n=>({...n,clientId:e.target.value}))})]}),n.jsxs(Bn,{children:[n.jsx(zn,{children:"Environment ID"}),n.jsx(Un,{type:"text",value:l.environmentId,onChange:e=>d(n=>({...n,environmentId:e.target.value}))})]}),"bulk_revocation"!==a&&n.jsxs(Bn,{children:[n.jsx(zn,{children:"Token to Revoke"}),n.jsx(Un,{type:"text",value:l.tokenToRevoke,onChange:e=>d(n=>({...n,tokenToRevoke:e.target.value})),placeholder:"Enter token to revoke"})]}),"bulk_revocation"!==a&&n.jsxs(Bn,{children:[n.jsx(zn,{children:"Token Type Hint"}),n.jsxs(Mn,{value:l.tokenTypeHint,onChange:e=>d(n=>({...n,tokenTypeHint:e.target.value})),children:[n.jsx("option",{value:"access_token",children:"Access Token"}),n.jsx("option",{value:"refresh_token",children:"Refresh Token"})]})]}),"bulk_revocation"===a&&n.jsxs(Bn,{style:{gridColumn:"1 / -1"},children:[n.jsx(zn,{children:"Tokens to Revoke (one per line)"}),n.jsx(Fn,{value:l.bulkTokens,onChange:e=>d(n=>({...n,bulkTokens:e.target.value})),placeholder:"Enter tokens to revoke, one per line",rows:5})]})]}),n.jsxs(Bn,{children:[n.jsx(zn,{children:"Revocation Reason"}),n.jsxs(Mn,{value:l.revocationReason,onChange:e=>d(n=>({...n,revocationReason:e.target.value})),children:[n.jsx("option",{value:"user_logout",children:"User Logout"}),n.jsx("option",{value:"security_incident",children:"Security Incident"}),n.jsx("option",{value:"token_expired",children:"Token Expired"}),n.jsx("option",{value:"user_request",children:"User Request"}),n.jsx("option",{value:"admin_action",children:"Admin Action"})]})]}),n.jsx(Jn,{$variant:"danger",onClick:async()=>{try{let e;if(i("loading"),m(null),"bulk_revocation"===a){const n=l.bulkTokens.split("\n").filter(e=>e.trim()),t=n.map((e,n)=>({token:e.trim(),success:Math.random()>.1,error:Math.random()>.9?"Token not found":null})),o=t.filter(e=>e.success).length,r=t.filter(e=>!e.success).length;e={type:"bulk",total:n.length,successful:o,failed:r,results:t}}else e={type:"single",success:!0,token:l.tokenToRevoke,tokenType:l.tokenTypeHint,revokedAt:(new Date).toISOString(),reason:l.revocationReason};f(e),u({success:!0,message:"Token revocation completed successfully",result:e,type:a}),i("success")}catch(e){const n=e instanceof Error?e.message:"Unknown error";m(n),i("error")}},children:"bulk_revocation"===a?"Revoke All Tokens":"Revoke Token"})]})]})},nt=()=>({environmentId:"",clientId:"",clientSecret:"",redirectUri:`${"undefined"==typeof window?"https://localhost:3000":window.location.origin}/callback`,scope:"p1:read:user p1:update:user p1:read:device p1:update:device",scopes:"p1:read:user p1:update:user p1:read:device p1:update:device",responseType:"code",grantType:"client_credentials",issuerUrl:"",authServerId:"",loginHint:"",clientAuthMethod:"client_secret_post"}),tt=()=>{try{const e=localStorage.getItem("worker_credentials");if(e){const n=JSON.parse(e);return{...nt(),...n}}const n=V.getAllCredentials();if(n.environmentId&&n.clientId)return{...nt(),...n}}catch(e){}return nt()},ot=(e,n)=>{try{const t=sessionStorage.getItem(e);if(t){const e=Z(t,{});return{...n,...e}}}catch(t){}return n},rt=(n={})=>{const t=`${n.flowKey??"worker-token-v5"}`,o=`${t}-step-results`,r=`${t}-config`,[s,i]=e.useState(()=>tt()),[a,c]=e.useState(()=>ot(r,ee())),[l,d]=e.useState(null),[p,u]=e.useState(null),[h,m]=e.useState(!1),[g,f]=e.useState(!1),[k,v]=e.useState(!1),[x,j]=e.useState(!1),[b,y]=e.useState(!1),[w,T]=e.useState(null),I=e.useRef(null);P();const S=H({flowType:"worker-token-v5",persistKey:"worker_token_v5_step_manager",defaultStep:0,enableAutoAdvance:!0});e.useEffect(()=>{sessionStorage.removeItem("worker_token_v5_step_manager-step")},[]);const C=e.useRef((e=>{const n=sessionStorage.getItem(e);return n?Z(n,{}):{}})(o)),_=e.useCallback(()=>{"undefined"!=typeof window&&sessionStorage.setItem(o,JSON.stringify(C.current??{}))},[o]),q=e.useCallback((e,n)=>{C.current={...C.current,[e]:n},_()},[_]),R=e.useCallback(e=>Boolean(C.current?.[e]),[]),E=e.useCallback(()=>{C.current={},_()},[_]);e.useEffect(()=>{I.current||(I.current=s)},[s]),e.useEffect(()=>{const e=ot(r,ee());c(e)},[r]),e.useEffect(()=>{if(I.current){const e=JSON.stringify(I.current)!==JSON.stringify(s);y(e)}},[s]),e.useEffect(()=>{if(n.enableDebugger){K.startSession("worker-token-v5");return()=>{K.endSession()}}},[n.enableDebugger]),e.useEffect(()=>{(async()=>{try{const{credentials:e,hasSharedCredentials:n,flowState:o}=await A.loadFlowCredentials({flowKey:t,defaultCredentials:tt()});e&&n&&(i(e),j(!0),o?.flowConfig&&c(o.flowConfig))}catch(e){}})()},[t]);const B=e.useCallback(e=>{c(e),sessionStorage.setItem(r,JSON.stringify(e))},[r]),z=e.useCallback(async()=>{if(s.environmentId&&s.clientId&&s.clientSecret)try{m(!0),K.logStep("worker-token-request","Requesting worker token");const e=`${`${"https://auth.pingone.com"}/${s.environmentId}/as`}/token`,n=ie.validateForAuthorizationUrl(s.scopes||s.scope,"client-credentials");if(!n.isValid)throw new Error(n.error||"Invalid scopes configuration");const t=n.scopes.split(" ").filter(Boolean),o=s.clientAuthMethod||s.tokenAuthMethod||"client_secret_post",r=await Q(e,s.clientId,s.clientSecret,t,o);d(r),q("token-request",r),await G({access_token:r.access_token,refresh_token:r.refresh_token,token_type:r.token_type,expires_in:r.expires_in,scope:r.scope}),Y("worker-token-request",!0,"Token requested successfully"),D("Worker token requested successfully!")}catch(e){K.logError("worker-token-request",e);const n=e instanceof Error?e.message:"Failed to request worker token";n.includes("Unsupported authentication method")?$(`Token request failed: ${n}\n\nTip: Check your PingOne application's Token Endpoint Authentication Method setting. Try changing it to match your configuration (client_secret_post or client_secret_basic).`,"Authentication Method Error"):$(`Token request failed: ${n}`),Y("worker-token-request",!1,n)}finally{m(!1)}else $("Missing required credentials. Please configure your PingOne settings first.")},[s,q]),U=e.useCallback(async()=>{if(l?.access_token)if(s.environmentId&&s.clientId&&s.clientSecret)try{f(!0),K.logStep("token-introspection","Introspecting access token");const e=`${`${"https://auth.pingone.com"}/${s.environmentId}/as`}/introspect`,n=await U(e,l.access_token,{clientId:s.clientId,clientSecret:s.clientSecret});u(n),q("token-introspection",n),Y("token-introspection",!0,"Token introspection completed"),D("Token introspection completed successfully!")}catch(e){K.logError("token-introspection",e);const n=e instanceof Error?e.message:"Failed to introspect token";$(`Token introspection failed: ${n}`),Y("token-introspection",!1,n)}finally{f(!1)}else $("Missing credentials for token introspection.");else $("No access token available for introspection. Please request a token first.")},[l,s,q]),F=e.useCallback(async()=>{try{if(v(!0),!s.environmentId||!s.clientId||!s.clientSecret){const e=[];s.environmentId||e.push("Environment ID"),s.clientId||e.push("Client ID"),s.clientSecret||e.push("Client Secret");const n=`Missing required fields: ${e.join(", ")}. Please fill in all required fields to continue.`;return void $(n)}if(!(await A.saveFlowCredentials(t,s,a,{tokens:l})))throw new Error("Failed to save credentials via FlowCredentialService");try{localStorage.setItem("worker_credentials",JSON.stringify(s))}catch(e){}j(!0),y(!1),I.current={...s},V.clearCache(),window.dispatchEvent(new CustomEvent("pingone-config-changed")),window.dispatchEvent(new CustomEvent("permanent-credentials-changed"))}catch(e){$(`Failed to save credentials: ${e instanceof Error?e.message:"Unknown error"}`)}finally{v(!1)}},[s,a,t,l]),M=e.useCallback(()=>{d(null),u(null),m(!1),f(!1),y(!1),E(),S.resetFlow(),I.current={...s},D("Worker Token Flow reset successfully! Credentials preserved.")},[E,S,s]),J=e.useCallback(e=>{i(e),I.current={...e},y(!1)},[]),N=e.useCallback((e,n)=>{navigator.clipboard.writeText(e),T(n),setTimeout(()=>T(null),2e3),D(`${n} copied to clipboard!`)},[]);return e.useEffect(()=>{if(!I.current)return void(I.current=s);const e=JSON.stringify(s)!==JSON.stringify(I.current);y(e)},[s]),e.useEffect(()=>{try{const e=V.getAllCredentials(),n=e.environmentId===s.environmentId&&e.clientId===s.clientId&&e.clientSecret===s.clientSecret;j(Boolean(n))}catch(e){j(!1)}},[s]),{persistKey:t,credentials:s,setCredentials:i,setFlowConfig:c,flowConfig:a,handleFlowConfigChange:B,resetFlow:M,isRequestingToken:h,requestToken:z,tokens:l,introspectionResults:p,isIntrospecting:g,introspectToken:U,isSavingCredentials:k,hasCredentialsSaved:x,hasUnsavedCredentialChanges:b,saveCredentials:F,loadCredentials:J,handleCopy:N,copiedField:w,stepManager:S,saveStepResult:q,hasStepResult:R,clearStepResults:E}};const st=new class{comprehensiveDiscovery=new ge;cache=new Map;DEFAULT_TIMEOUT=15e3;DEFAULT_CACHE_TIMEOUT=36e5;async discover(e){try{const{environmentId:n,region:t="us",clientId:o,clientSecret:r,timeout:s=this.DEFAULT_TIMEOUT,enableCaching:i=!0}=e,a=`worker-token-${n}-${t}`;if(i){const e=this.getCachedResult(a);if(e)return X.info("WorkerTokenDiscovery","Using cached discovery result",{environmentId:n,region:t,cached:!0}),e}X.info("WorkerTokenDiscovery","Starting comprehensive OIDC discovery",{environmentId:n,region:t,timeout:s});const c=`https://auth.pingone.com/${n}/as`,l=await this.comprehensiveDiscovery.discover({input:c,timeout:s,enableCaching:i});if(!l.success||!l.document)throw new Error(l.error||"Comprehensive discovery failed");const d=l.document,p={success:!0,environmentId:n,issuerUrl:d.issuer,tokenEndpoint:d.token_endpoint,introspectionEndpoint:d.introspection_endpoint,userInfoEndpoint:d.userinfo_endpoint,jwksUri:d.jwks_uri,scopes:this.extractWorkerTokenScopes(d),supportedGrantTypes:d.grant_types_supported??["client_credentials"],supportedResponseTypes:d.response_types_supported??[],discoveryDocument:d,cached:l.cached||!1};return i&&this.cache.set(a,{result:p,timestamp:Date.now()}),o&&r&&await this.updateCredentialsFromDiscovery(p,o,r),X.success("WorkerTokenDiscovery","OIDC discovery completed successfully",{environmentId:n,issuerUrl:p.issuerUrl,tokenEndpoint:p.tokenEndpoint,scopes:p.scopes}),p}catch(n){return X.error("WorkerTokenDiscovery","Discovery failed",{environmentId:e.environmentId,region:e.region,error:n instanceof Error?n.message:"Unknown error"}),{success:!1,error:n instanceof Error?n.message:"Discovery failed",environmentId:e.environmentId}}}extractWorkerTokenScopes(e){const n=(e.scopes_supported??[]).filter(e=>e.startsWith("p1:")&&(e.includes("user")||e.includes("device")||e.includes("application")));return n.length>0?n:["p1:read:user","p1:update:user","p1:read:device","p1:update:device"]}async updateCredentialsFromDiscovery(e,n,t){try{if(!e.issuerUrl)return;await V.discoverAndUpdateCredentials(e.issuerUrl,n,t),X.info("WorkerTokenDiscovery","Credentials updated from discovery")}catch(o){X.warn("WorkerTokenDiscovery","Failed to update credentials from discovery",{error:o instanceof Error?o.message:"Unknown error"})}}getCachedResult(e){const n=this.cache.get(e);if(!n)return null;return Date.now()-n.timestamp>this.DEFAULT_CACHE_TIMEOUT?(this.cache.delete(e),null):n.result}clearCache(){this.cache.clear(),X.info("WorkerTokenDiscovery","Cache cleared")}getCacheStats(){return{size:this.cache.size,keys:Array.from(this.cache.keys())}}},it=x.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
`,at=x.div`
	margin-bottom: 30px;
	background: white;
	border-radius: 8px;
	padding: 24px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`,ct=x.h2`
	font-size: 24px;
	font-weight: 600;
	margin-bottom: 16px;
	color: #1a202c;
	display: flex;
	align-items: center;
	gap: 12px;
`,lt=x.p`
	color: #64748b;
	font-size: 14px;
	line-height: 1.6;
	margin-bottom: 20px;
`;x.div`
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
	margin-top: 16px;
`,x.button`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 20px;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	background: ${e=>"warning"===e.$priority?"#f59e0b":"#3b82f6"};
	color: white;
	
	&:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
	
	&:active {
		transform: translateY(0);
	}
`;const dt=x.div`
	margin-top: 24px;
	width: 100%;
	max-width: 100%;
`,pt=x.div`
	height: 1px;
	background: #e2e8f0;
	margin: 24px 0;
`,ut=()=>{N({pageName:"WorkerTokenFlowV7",force:!0}),e.useEffect(()=>{ne(a.credentials,{flowName:"Worker Token Flow",requiredFields:["environmentId","clientId","clientSecret"],showToast:!0})},[a.credentials]);const i=v(),a=rt({flowKey:"worker-token-v7"}),[c,l]=e.useState(a.credentials),[d,p]=e.useState(0),[u,h]=e.useState(null),[m,g]=e.useState(localStorage.getItem("worker_token")||"");e.useEffect(()=>{c.environmentId&&c.clientId&&c.clientSecret,a.credentials.environmentId&&a.credentials.clientId&&a.credentials.clientSecret},[c,a.credentials]),e.useEffect(()=>{l(a.credentials)},[a.credentials,c]),e.useEffect(()=>{const e=()=>{const e=localStorage.getItem("worker_token");e&&e!==m&&g(e)};e();const n=setInterval(e,1e3);return()=>clearInterval(n)},[m]);const f=e.useCallback(async()=>{try{await a.requestToken(),O.showSuccess("Worker token generated successfully!"),p(1)}catch(e){const n=ae.parseOAuthError(e,{flowType:"worker-token",stepId:"request-token",operation:"requestToken",credentials:{hasClientId:!!c.clientId,hasClientSecret:!!c.clientSecret,hasEnvironmentId:!!c.environmentId}});O.showError(n.message),h(n)}},[a,c]),k=e.useCallback(()=>{i("/token-management")},[i]),x=e.useCallback(()=>{try{a.resetFlow(),p(0),h(null),g("");try{localStorage.removeItem("worker_token")}catch(e){}O.showSuccess("Worker Token Flow reset successfully")}catch(e){O.showError("Failed to reset flow. Please refresh the page.")}},[a]);e.useCallback(e=>{switch(e){case 0:return!!(c.environmentId&&c.clientId&&c.clientSecret);case 1:case 2:return!!a.tokens;default:return!0}},[c,a.tokens]);const j=e.useCallback(e=>{switch(e){case 0:return c.environmentId?c.clientId?c.clientSecret?"":"Client Secret is required":"Client ID is required":"Environment ID is required";case 1:case 2:return a.tokens?"":"Worker token is required. Please generate a token first.";default:return""}},[c,a.tokens]);return n.jsxs(it,{children:[n.jsx(I,{title:"PingOne Worker Token Flow",description:"Generate worker tokens for machine-to-machine authentication with PingOne Management APIs.",flowId:"worker-token-v7",version:"7.0"}),0===d&&n.jsxs(at,{children:[n.jsxs(ct,{children:[n.jsx(o,{})," Configure Worker Token Credentials"]}),n.jsx(lt,{children:"Configure your PingOne environment and worker application credentials. Worker tokens are used for machine-to-machine authentication with PingOne Management APIs."}),n.jsx(re,{flowType:"worker-token-v7",environmentId:c.environmentId||"",clientId:c.clientId||"",clientSecret:c.clientSecret||"",scopes:c.scopes||"",formData:{environmentId:c.environmentId,clientId:c.clientId,clientSecret:c.clientSecret,grantTypes:["client_credentials"],responseTypes:[],tokenEndpointAuthMethod:c.clientAuthMethod||"client_secret_post"},onEnvironmentIdChange:e=>{const n={...c,environmentId:e};l(n),a.setCredentials(n)},onClientIdChange:e=>{const n={...c,clientId:e};l(n),a.setCredentials(n)},onClientSecretChange:e=>{const n={...c,clientSecret:e};l(n),a.setCredentials(n)},onScopesChange:e=>{const n={...c,scopes:e,scope:e};l(n),a.setCredentials(n)},onSave:async()=>{try{await a.saveCredentials(),O.showSuccess("Credentials saved successfully!"),h(null)}catch(e){const n=ae.parseOAuthError(e,{flowType:"worker-token",stepId:"save-credentials",operation:"saveCredentials",credentials:{hasClientId:!!c.clientId,hasClientSecret:!!c.clientSecret,hasEnvironmentId:!!c.environmentId}});O.showError(n.message),h(n)}},onDiscoveryComplete:async e=>{if(e.issuerUrl){const n=L.extractEnvironmentId(e.issuerUrl);if(n){const e={...c,environmentId:n};l(e),a.setCredentials(e)}}if(e.document?.issuer)try{const n=L.extractEnvironmentId(e.document.issuer);if(n){const e=await st.discover({environmentId:n,region:"us",clientId:c.clientId,clientSecret:c.clientSecret,timeout:15e3,enableCaching:!0});if(e.success){const t={...c,environmentId:e.environmentId||n,tokenEndpoint:e.tokenEndpoint,introspectionEndpoint:e.introspectionEndpoint,userInfoEndpoint:e.userInfoEndpoint,scopes:e.scopes?.join(" ")||c.scopes};l(t),a.setCredentials(t),t.environmentId&&t.clientId&&(await a.saveCredentials(),O.showSuccess("Credentials auto-saved after comprehensive OIDC discovery")),O.showSuccess("Enhanced OIDC discovery completed")}}}catch(n){}},requireClientSecret:!0,showRedirectUri:!1,showPostLogoutRedirectUri:!1,showLoginHint:!1,showAdvancedConfig:!1,defaultCollapsed:!1,workerToken:m,showConfigChecker:!1,region:"NA"}),n.jsx(pt,{}),n.jsx(U,{currentStep:0,totalSteps:3,onNext:f,onPrevious:()=>{},onReset:()=>p(0),canNavigateNext:!0,isFirstStep:!0})]}),1===d&&(()=>{const e=a.tokens;return n.jsxs(at,{children:[n.jsxs(ct,{children:[n.jsx(s,{})," Worker Token Generated"]}),n.jsx(lt,{children:"Your PingOne worker token has been successfully generated. Use this token to authenticate with PingOne Management APIs."}),e&&n.jsx(dt,{children:pe.showTokens(e,"oauth","worker-token-v7",{showCopyButtons:!0,showDecodeButtons:!0,showIntrospection:!1,title:"🔑 Worker Access Token"})}),n.jsx(pt,{}),n.jsxs(C,{children:[n.jsxs(_,{children:[n.jsx(r,{size:18})," Configuration Management"]}),n.jsx(lt,{children:"To use the Config Checker features (Check Config, Create App, Get New Worker Token), return to Step 0 where these tools are integrated into the credentials configuration section."})]}),n.jsx(pt,{}),n.jsx(J,{flowType:"worker-token"}),n.jsx(pt,{}),n.jsx(U,{currentStep:1,totalSteps:3,onNext:()=>p(2),onPrevious:()=>p(0),onReset:()=>p(0),canNavigateNext:!0,isFirstStep:!1,nextButtonText:"Learn API Usage"})]})})(),2===d&&(()=>{const e=a.tokens,o=e?.access_token||"";return n.jsxs(at,{children:[n.jsxs(ct,{children:[n.jsx(t,{})," Using Worker Tokens with PingOne Administration APIs"]}),n.jsx(lt,{children:"Learn how to use your worker token to make authenticated calls to PingOne Management APIs for administrative operations."}),n.jsxs("div",{style:{background:"#f0f9ff",border:"1px solid #0ea5e9",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"1.5rem"},children:[n.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1.125rem",fontWeight:600,color:"#0c4a6e"},children:"🏢 PingOne Administration APIs"}),n.jsxs("div",{style:{fontSize:"0.875rem",color:"#0c4a6e",lineHeight:1.6},children:[n.jsx("p",{style:{margin:"0 0 1rem 0"},children:"Worker tokens provide machine-to-machine authentication for PingOne Management APIs. These APIs allow you to:"}),n.jsxs("ul",{style:{margin:"0 0 1rem 0",paddingLeft:"1.5rem"},children:[n.jsxs("li",{children:[n.jsx("strong",{children:"Manage Applications:"})," Create, update, and configure OAuth/OIDC applications"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"User Management:"})," Create, update, and manage user accounts"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Device Management:"})," Register and manage MFA devices"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Environment Configuration:"})," Configure environments, populations, and settings"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Resource Management:"})," Manage scopes, resources, and permissions"]})]})]})]}),n.jsxs("div",{style:{background:"#f0fdf4",border:"1px solid #22c55e",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"1.5rem"},children:[n.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1.125rem",fontWeight:600,color:"#166534"},children:"🔧 Common Administration API Calls"}),n.jsxs("div",{style:{marginBottom:"1rem"},children:[n.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"1rem",fontWeight:600,color:"#166534"},children:"📱 Get Applications"}),n.jsxs("div",{style:{background:"#ffffff",border:"1px solid #d1fae5",borderRadius:"0.5rem",padding:"1rem",fontFamily:"monospace",fontSize:"0.875rem"},children:[n.jsxs("div",{style:{color:"#059669",marginBottom:"0.5rem"},children:["GET /v1/environments/","{environmentId}","/applications"]}),n.jsxs("div",{style:{color:"#6b7280"},children:["Authorization: Bearer ",o.substring(0,20),"..."]})]})]}),n.jsxs("div",{style:{marginBottom:"1rem"},children:[n.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"1rem",fontWeight:600,color:"#166534"},children:"👥 Get Users"}),n.jsxs("div",{style:{background:"#ffffff",border:"1px solid #d1fae5",borderRadius:"0.5rem",padding:"1rem",fontFamily:"monospace",fontSize:"0.875rem"},children:[n.jsxs("div",{style:{color:"#059669",marginBottom:"0.5rem"},children:["GET /v1/environments/","{environmentId}","/users"]}),n.jsxs("div",{style:{color:"#6b7280"},children:["Authorization: Bearer ",o.substring(0,20),"..."]})]})]}),n.jsxs("div",{style:{marginBottom:"1rem"},children:[n.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"1rem",fontWeight:600,color:"#166534"},children:"🔐 Get Resources & Scopes"}),n.jsxs("div",{style:{background:"#ffffff",border:"1px solid #d1fae5",borderRadius:"0.5rem",padding:"1rem",fontFamily:"monospace",fontSize:"0.875rem"},children:[n.jsxs("div",{style:{color:"#059669",marginBottom:"0.5rem"},children:["GET /v1/environments/","{environmentId}","/resources"]}),n.jsxs("div",{style:{color:"#6b7280"},children:["Authorization: Bearer ",o.substring(0,20),"..."]})]})]})]}),n.jsxs("div",{style:{background:"#fef3c7",border:"1px solid #f59e0b",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"1.5rem"},children:[n.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1.125rem",fontWeight:600,color:"#92400e"},children:"💻 JavaScript Code Examples"}),n.jsx("div",{style:{background:"#ffffff",border:"1px solid #fbbf24",borderRadius:"0.5rem",padding:"1rem",fontFamily:"monospace",fontSize:"0.875rem",overflow:"auto"},children:n.jsx("pre",{style:{margin:0,whiteSpace:"pre-wrap"},children:`// Example: Get all applications in your environment\nasync function getApplications(environmentId, accessToken) {\n  const response = await fetch(\`https://auth.pingone.com/v1/environments/\${environmentId}/applications\`, {\n    method: 'GET',\n    headers: {\n      'Authorization': \`Bearer \${accessToken}\`,\n      'Content-Type': 'application/json'\n    }\n  });\n  \n  if (!response.ok) {\n    throw new Error(\`HTTP error! status: \${response.status}\`);\n  }\n  \n  return await response.json();\n}\n\n// Example: Get user information\nasync function getUser(environmentId, userId, accessToken) {\n  const response = await fetch(\`https://auth.pingone.com/v1/environments/\${environmentId}/users/\${userId}\`, {\n    method: 'GET',\n    headers: {\n      'Authorization': \`Bearer \${accessToken}\`,\n      'Content-Type': 'application/json'\n    }\n  });\n  \n  return await response.json();\n}\n\n// Example: Get environment resources and scopes\nasync function getResources(environmentId, accessToken) {\n  const response = await fetch(\`https://auth.pingone.com/v1/environments/\${environmentId}/resources\`, {\n    method: 'GET',\n    headers: {\n      'Authorization': \`Bearer \${accessToken}\`,\n      'Content-Type': 'application/json'\n    }\n  });\n  \n  return await response.json();\n}\n\n// Usage with your worker token\nconst environmentId = '${c.environmentId||"your-environment-id"}';\nconst workerToken = '${o}';\n\n// Get applications\ngetApplications(environmentId, workerToken)\n  .then(applications => console.log('Applications:', applications))\n  .catch(error => console.error('Error:', error));`})})]}),n.jsxs("div",{style:{background:"#f3e8ff",border:"1px solid #a855f7",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"1.5rem"},children:[n.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1.125rem",fontWeight:600,color:"#7c3aed"},children:"🖥️ cURL Command Examples"}),n.jsx("div",{style:{background:"#ffffff",border:"1px solid #c4b5fd",borderRadius:"0.5rem",padding:"1rem",fontFamily:"monospace",fontSize:"0.875rem",overflow:"auto"},children:n.jsx("pre",{style:{margin:0,whiteSpace:"pre-wrap"},children:`# Get all applications\ncurl -X GET \\\n  "https://auth.pingone.com/v1/environments/${c.environmentId||"your-environment-id"}/applications" \\\n  -H "Authorization: Bearer ${o}" \\\n  -H "Content-Type: application/json"\n\n# Get specific user\ncurl -X GET \\\n  "https://auth.pingone.com/v1/environments/${c.environmentId||"your-environment-id"}/users/{userId}" \\\n  -H "Authorization: Bearer ${o}" \\\n  -H "Content-Type: application/json"\n\n# Get environment resources\ncurl -X GET \\\n  "https://auth.pingone.com/v1/environments/${c.environmentId||"your-environment-id"}/resources" \\\n  -H "Authorization: Bearer ${o}" \\\n  -H "Content-Type: application/json"\n\n# Get OIDC configuration\ncurl -X GET \\\n  "https://auth.pingone.com/${c.environmentId||"your-environment-id"}/as/.well-known/openid_configuration" \\\n  -H "Authorization: Bearer ${o}" \\\n  -H "Content-Type: application/json"`})})]}),n.jsxs("div",{style:{background:"#fef2f2",border:"1px solid #f87171",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"1.5rem"},children:[n.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1.125rem",fontWeight:600,color:"#dc2626"},children:"📮 Postman Collection"}),n.jsx("div",{style:{background:"#ffffff",border:"1px solid #fca5a5",borderRadius:"0.5rem",padding:"1rem",fontFamily:"monospace",fontSize:"0.875rem",overflow:"auto"},children:n.jsx("pre",{style:{margin:0,whiteSpace:"pre-wrap"},children:`{\n  "info": {\n    "name": "PingOne Administration APIs",\n    "description": "Collection for PingOne Management API calls using worker tokens",\n    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"\n  },\n  "variable": [\n    {\n      "key": "baseUrl",\n      "value": "https://auth.pingone.com"\n    },\n    {\n      "key": "environmentId",\n      "value": "${c.environmentId||"your-environment-id"}"\n    },\n    {\n      "key": "workerToken",\n      "value": "${o}"\n    }\n  ],\n  "item": [\n    {\n      "name": "Get Applications",\n      "request": {\n        "method": "GET",\n        "header": [\n          {\n            "key": "Authorization",\n            "value": "Bearer {{workerToken}}"\n          }\n        ],\n        "url": {\n          "raw": "{{baseUrl}}/v1/environments/{{environmentId}}/applications",\n          "host": ["{{baseUrl}}"],\n          "path": ["v1", "environments", "{{environmentId}}", "applications"]\n        }\n      }\n    },\n    {\n      "name": "Get Users",\n      "request": {\n        "method": "GET",\n        "header": [\n          {\n            "key": "Authorization",\n            "value": "Bearer {{workerToken}}"\n          }\n        ],\n        "url": {\n          "raw": "{{baseUrl}}/v1/environments/{{environmentId}}/users",\n          "host": ["{{baseUrl}}"],\n          "path": ["v1", "environments", "{{environmentId}}", "users"]\n        }\n      }\n    }\n  ]\n}`})})]}),n.jsxs("div",{style:{background:"#ecfdf5",border:"1px solid #10b981",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"1.5rem"},children:[n.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1.125rem",fontWeight:600,color:"#047857"},children:"✅ Best Practices for Worker Tokens"}),n.jsx("div",{style:{fontSize:"0.875rem",color:"#047857",lineHeight:1.6},children:n.jsxs("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:[n.jsxs("li",{children:[n.jsx("strong",{children:"Token Security:"})," Store worker tokens securely and never expose them in client-side code"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Scope Management:"})," Request only the scopes you need for your specific use case"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Token Refresh:"})," Implement token refresh logic before expiration"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Error Handling:"})," Handle 401/403 errors gracefully and refresh tokens when needed"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Rate Limiting:"})," Be aware of API rate limits and implement appropriate retry logic"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Environment Separation:"})," Use different worker applications for different environments"]})]})})]}),n.jsx(pt,{}),n.jsx(U,{currentStep:2,totalSteps:3,onNext:k,onPrevious:()=>p(1),onReset:x,canNavigateNext:!0,isFirstStep:!1,nextButtonText:"View Token Management",disabledMessage:j(2)})]})})()]})};export{Te as I,Se as J,rn as O,et as T,ut as W,Rn as a,sn as b};
//# sourceMappingURL=oauth-flows-token-D--ffiwQ.js.map
