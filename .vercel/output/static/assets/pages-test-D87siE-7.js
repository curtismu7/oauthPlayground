import{a as e,j as r,R as n,Y as t,v as o,a0 as s,a2 as i,B as a,u as c}from"./react-vendor-HWZo9XlX.js";import{a as d}from"./styled-vendor-DGSsHzxd.js";import{r as l,v as p}from"./components-credentials-T7jmF3zx.js";import{ay as u,aS as m,aT as h}from"./utils-lzKqcxFi.js";import{u as f}from"./v8u-services-CviCpCEt.js";import{a as g,W as x}from"./v8-components-8swtZwHb.js";import"./components-token-uXxDPBqK.js";const b=d.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`,v=d.div`
  margin-bottom: 2rem;
`,y=d.h1`
  color: #1f2937;
  margin-bottom: 0.5rem;
`,j=d.p`
  color: #6b7280;
  font-size: 1.1rem;
`,w=d.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #ffffff;
`,k=d.h2`
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.25rem;
`,T=d.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`,I=d.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 0.5rem;
  align-items: center;
`,_=d.label`
  font-weight: 500;
  color: #374151;
`,C=d.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,S=d.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,O=d.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${e=>"primary"===e.variant?"\n    background: #3b82f6;\n    color: white;\n    border: 1px solid #3b82f6;\n\n    &:hover:not(:disabled) {\n      background: #2563eb;\n      border-color: #2563eb;\n    }\n  ":"\n    background: white;\n    color: #374151;\n    border: 1px solid #d1d5db;\n\n    &:hover:not(:disabled) {\n      background: #f9fafb;\n      border-color: #9ca3af;\n    }\n  "}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,R=d.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`,A=d.div`
  margin-top: 2rem;
`,U=d.div`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${e=>e.success?"#10b981":"#ef4444"};
  background: ${e=>e.success?"#f0fdf4":"#fef2f2"};
`,D=d.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`,P=d.h3`
  margin: 0;
  color: ${e=>e.success?"#065f46":"#991b1b"};
`,N=d.span`
  font-size: 0.75rem;
  color: #6b7280;
`,z=d.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  font-size: 0.75rem;
  margin: 0.5rem 0;
`,E=d.div`
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid #e2e8f0;
`,M=d.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.25rem;
`,q=d.div`
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.75rem;
  color: #1f2937;
  background: #ffffff;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
  word-break: break-all;
`,F=Object.freeze(Object.defineProperty({__proto__:null,default:()=>{const{apps:n,selectedAppId:t,selectApp:o,getActiveAppConfig:s}=l(),{hasWorkerToken:i,showWorkerTokenModal:a,setShowWorkerTokenModal:c}=useWorkerTokenState(),[d,f]=e.useState({environmentId:"",clientId:"",redirectUri:"http://localhost:3000/test-callback",scopes:"openid profile email",responseType:"oidc",responseMode:"fragment"}),[g,x]=e.useState([]),[F,$]=e.useState(""),[L,J]=e.useState(""),[B,W]=e.useState(null);e.useEffect(()=>{const e=s();if(e){let r=e.scopes?.join(" ")||prev.scopes;r.includes("openid")||(r=`openid ${r}`.trim()),f(n=>({...n,environmentId:e.environmentId||"",clientId:e.clientId||"",redirectUri:e.redirectUris?.[0]||n.redirectUri,scopes:r}))}},[s]);const V=e.useCallback(e=>{x(r=>[...r,{...e,timestamp:new Date}])},[]),G=(e,r)=>{f(n=>({...n,[e]:r}))},H=e.useCallback(()=>{const e=Date.now();try{const r=d.state||u(),n=d.nonce||("oidc"===d.responseType?m():void 0),t={environmentId:d.environmentId,clientId:d.clientId,redirectUri:d.redirectUri,scopes:d.scopes,responseType:d.responseType,responseMode:d.responseMode,state:r,nonce:n},o=h(t);$(o);const s=Date.now()-e;return V({testName:"Authorization URL Generation",success:!0,input:t,output:{url:o,length:o.length,parsedParams:Object.fromEntries(new URLSearchParams(o.split("?")[1]||""))},duration:s}),o}catch(r){const n=Date.now()-e;return V({testName:"Authorization URL Generation",success:!1,input:d,output:null,error:r instanceof Error?r.message:"Unknown error",duration:n}),null}},[d,V]),X=e.useCallback(()=>{const e=Date.now();try{if(!L.trim())throw new Error("No fragment provided to parse");const r=L.startsWith("#")?L.slice(1):L,n=new URLSearchParams(r),t={};for(const[e,c]of n.entries())"access_token"===e?t.access_token=c:"id_token"===e?t.id_token=c:"token_type"===e?t.token_type=c:"expires_in"===e?t.expires_in=parseInt(c,10):"scope"===e?t.scope=c:"state"===e?t.state=c:t[e]=c;const o=!!t.access_token,s=!!t.id_token,i="token"===d.responseType&&o||"oidc"===d.responseType&&o&&s;W(t);const a=Date.now()-e;return V({testName:"Fragment Parsing",success:i,input:{fragment:L},output:{parsedTokens:t,validation:{hasAccessToken:o,hasIdToken:s,expectedResponseType:d.responseType,isValidResponseType:i,tokenType:t.token_type,expiresIn:t.expires_in,state:t.state}},duration:a}),t}catch(r){const n=Date.now()-e;return V({testName:"Fragment Parsing",success:!1,input:{fragment:L},output:null,error:r instanceof Error?r.message:"Unknown error",duration:n}),null}},[d.responseType,L,V]),Y=e.useCallback(()=>{const e=Date.now();try{if(!B)throw new Error("No tokens to validate - parse a fragment first");const n={access_token:{},id_token:{},overall:{}};if(B.access_token){const e=B.access_token.split(".");if(n.access_token.isJwt=3===e.length,n.access_token.length=B.access_token.length,n.access_token.isJwt)try{const r=JSON.parse(atob(e[0])),t=JSON.parse(atob(e[1]));n.access_token.header=r,n.access_token.payload=t,n.access_token.expiresAt=t.exp?new Date(1e3*t.exp).toISOString():null,n.access_token.isExpired=t.exp?Date.now()/1e3>t.exp:null}catch(r){n.access_token.decodeError=r instanceof Error?r.message:"Unknown error"}}if(B.id_token){const e=B.id_token.split(".");if(n.id_token.isJwt=3===e.length,n.id_token.length=B.id_token.length,n.id_token.isJwt)try{const r=JSON.parse(atob(e[0])),t=JSON.parse(atob(e[1]));n.id_token.header=r,n.id_token.payload=t,n.id_token.expiresAt=t.exp?new Date(1e3*t.exp).toISOString():null,n.id_token.isExpired=t.exp?Date.now()/1e3>t.exp:null,n.id_token.hasNonce=!!t.nonce}catch(r){n.id_token.decodeError=r instanceof Error?r.message:"Unknown error"}}n.overall.hasRequiredTokens="token"===d.responseType&&B.access_token||"oidc"===d.responseType&&B.access_token&&B.id_token,n.overall.correctTokenType="Bearer"===B.token_type,n.overall.hasValidExpiry=B.expires_in&&B.expires_in>0;const t=Date.now()-e;return V({testName:"Token Validation",success:n.overall.hasRequiredTokens,input:{tokens:B},output:n,duration:t}),n}catch(n){const r=Date.now()-e;return V({testName:"Token Validation",success:!1,input:{tokens:B},output:null,error:n instanceof Error?n.message:"Unknown error",duration:r}),null}},[B,d.responseType,V]),Z=e.useCallback(()=>{const e={access_token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.sample_access_token_signature",token_type:"Bearer",expires_in:3600,scope:d.scopes,state:d.state||"sample_state"};"oidc"===d.responseType&&(e.id_token="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6IkpvaG4gRG9lIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tL2VudiIsImF1ZCI6ImNsaWVudF9pZCIsIm5vbmNlIjoic2FtcGxlX25vbmNlIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzUwMjJ9.sample_id_token_signature");const r=new URLSearchParams;Object.entries(e).forEach(([e,n])=>{r.set(e,String(n))});const n=r.toString();return J(`#${n}`),n},[d]);return r.jsxs(b,{children:[r.jsxs(v,{children:[r.jsx(y,{children:"PingOne Implicit Flow Test"}),r.jsx(j,{children:"Test PingOne Implicit Flow URL generation, fragment parsing, and token validation"}),r.jsx(R,{style:{marginTop:"1rem"},children:r.jsx(O,{variant:i?"secondary":"primary",onClick:()=>c(!0),children:i?"✓ Worker Token Set":"Set Worker Token"})})]}),r.jsxs(w,{children:[r.jsx(k,{children:"Test Configuration"}),r.jsxs(T,{children:[r.jsxs(I,{children:[r.jsx(_,{children:"Select App:"}),r.jsxs(S,{value:t||"",onChange:e=>o(e.target.value||null),disabled:!i,children:[r.jsx("option",{value:"",children:i?"Manual Configuration":"Set Worker Token to load apps"}),n.map(e=>r.jsxs("option",{value:e.id,children:[e.name," (",e.clientId?.substring(0,8),"...)"]},e.id))]})]}),r.jsxs(I,{children:[r.jsx(_,{children:"Environment ID:"}),r.jsx(C,{type:"text",value:d.environmentId,onChange:e=>G("environmentId",e.target.value),placeholder:"e.g. 12345678-1234-1234-1234-123456789012"})]}),r.jsxs(I,{children:[r.jsx(_,{children:"Client ID:"}),r.jsx(C,{type:"text",value:d.clientId,onChange:e=>G("clientId",e.target.value),placeholder:"e.g. a1b2c3d4..."})]}),r.jsxs(I,{children:[r.jsx(_,{children:"Redirect URI:"}),r.jsx(C,{type:"url",value:d.redirectUri,onChange:e=>G("redirectUri",e.target.value),placeholder:"http://localhost:3000/test-callback"})]}),r.jsxs(I,{children:[r.jsx(_,{children:"Scopes:"}),r.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.25rem"},children:[r.jsx(C,{type:"text",value:d.scopes,onChange:e=>G("scopes",e.target.value),placeholder:"openid profile email"}),r.jsx("span",{style:{fontSize:"0.75rem",color:"#6b7280"},children:"Note: 'openid' scope is required and will be added automatically if missing"})]})]}),r.jsxs(I,{children:[r.jsx(_,{children:"Response Type:"}),r.jsxs(S,{value:d.responseType,onChange:e=>G("responseType",e.target.value),children:[r.jsx("option",{value:"token",children:"token (OAuth 2.0)"}),r.jsx("option",{value:"oidc",children:"id_token token (OIDC)"})]})]}),r.jsxs(I,{children:[r.jsx(_,{children:"Response Mode:"}),r.jsxs(S,{value:d.responseMode,onChange:e=>G("responseMode",e.target.value),children:[r.jsx("option",{value:"fragment",children:"fragment (standard)"}),r.jsx("option",{value:"form_post",children:"form_post (uncommon)"})]})]}),r.jsxs(I,{children:[r.jsx(_,{children:"State (optional):"}),r.jsx(C,{type:"text",value:d.state||"",onChange:e=>G("state",e.target.value),placeholder:"Auto-generated if empty"})]}),"oidc"===d.responseType&&r.jsxs(I,{children:[r.jsx(_,{children:"Nonce (optional):"}),r.jsx(C,{type:"text",value:d.nonce||"",onChange:e=>G("nonce",e.target.value),placeholder:"Auto-generated if empty (required for OIDC)"})]})]}),r.jsxs(R,{children:[r.jsx(O,{variant:"primary",onClick:H,children:"Generate Authorization URL"}),r.jsx(O,{variant:"secondary",onClick:Z,children:"Generate Sample Fragment"})]})]}),F&&r.jsxs(w,{children:[r.jsx(k,{children:"Generated Authorization URL"}),r.jsx(z,{children:F}),r.jsxs(R,{children:[r.jsx(O,{variant:"secondary",onClick:()=>window.open(F,"_blank"),children:"Open URL (will redirect to PingOne)"}),r.jsx(O,{variant:"secondary",onClick:()=>navigator.clipboard.writeText(F),children:"Copy URL"})]})]}),r.jsxs(w,{children:[r.jsx(k,{children:"Test Fragment Parsing"}),r.jsx(T,{children:r.jsxs(I,{children:[r.jsx(_,{children:"URL Fragment:"}),r.jsx(C,{type:"text",value:L,onChange:e=>J(e.target.value),placeholder:"#access_token=...&token_type=Bearer&..."})]})}),r.jsx(p,{onCredentialsUpdated:()=>{setTimeout(()=>{const e=s();e&&f(r=>({...r,environmentId:e.environmentId||"",clientId:e.clientId||"",redirectUri:e.redirectUris?.[0]||r.redirectUri,scopes:e.scopes?.join(" ")||r.scopes}))},100)}}),r.jsxs(R,{children:[r.jsx(O,{variant:"primary",onClick:X,children:"Parse Fragment"}),B&&r.jsx(O,{variant:"secondary",onClick:Y,children:"Validate Tokens"})]})]}),B&&r.jsxs(w,{children:[r.jsx(k,{children:"Parsed Tokens"}),B.access_token&&r.jsxs(E,{children:[r.jsx(M,{children:"Access Token"}),r.jsx(q,{children:B.access_token})]}),B.id_token&&r.jsxs(E,{children:[r.jsx(M,{children:"ID Token"}),r.jsx(q,{children:B.id_token})]}),r.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"1rem",marginTop:"1rem"},children:[B.token_type&&r.jsxs(E,{children:[r.jsx(M,{children:"Token Type"}),r.jsx(q,{children:B.token_type})]}),B.expires_in&&r.jsxs(E,{children:[r.jsx(M,{children:"Expires In"}),r.jsxs(q,{children:[B.expires_in," seconds"]})]}),B.state&&r.jsxs(E,{children:[r.jsx(M,{children:"State"}),r.jsx(q,{children:B.state})]})]})]}),r.jsxs(A,{children:[r.jsxs(k,{children:["Test Results (",g.length,")"]}),g.map((e,n)=>r.jsxs(U,{success:e.success,children:[r.jsxs(D,{children:[r.jsx("div",{style:{display:"flex",alignItems:"center"},children:r.jsxs(P,{children:[e.success?"✅":"❌"," ",e.testName]})}),r.jsxs(N,{children:[e.timestamp.toLocaleTimeString()," (",e.duration,"ms)"]})]}),!e.success&&e.error&&r.jsxs("div",{style:{marginBottom:"1rem"},children:[r.jsx("strong",{children:"Error:"})," ",e.error]}),r.jsx("div",{style:{marginBottom:"0.5rem"},children:r.jsx("strong",{children:"Input:"})}),r.jsx(z,{children:JSON.stringify(e.input,null,2)}),r.jsx("div",{style:{marginBottom:"0.5rem"},children:r.jsx("strong",{children:"Output:"})}),r.jsx(z,{children:JSON.stringify(e.output,null,2)})]},n)),0===g.length&&r.jsx("div",{style:{textAlign:"center",color:"#6b7280",padding:"2rem"},children:"No test results yet. Configure your settings and run the tests."})]}),r.jsx(WorkerTokenModal,{isOpen:a,onClose:()=>c(!1)})]})}},Symbol.toStringTag,{value:"Module"})),$=d.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`,L=d.div`
  margin-bottom: 2rem;
`,J=d.h1`
  color: #1f2937;
  margin-bottom: 0.5rem;
`,B=d.p`
  color: #6b7280;
  font-size: 1.1rem;
`,W=d.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #ffffff;
`,V=d.h2`
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.25rem;
`,G=d.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`,H=d.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`,X=d.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 0.5rem;
  align-items: center;
`,Y=d.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`,Z=d.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,K=d.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Q=d.input`
  margin-right: 0.5rem;
`,ee=d.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${e=>{switch(e.variant){case"primary":return"\n          background: #3b82f6;\n          color: white;\n          border: 1px solid #3b82f6;\n\n          &:hover:not(:disabled) {\n            background: #2563eb;\n            border-color: #2563eb;\n          }\n        ";case"danger":return"\n          background: #ef4444;\n          color: white;\n          border: 1px solid #ef4444;\n\n          &:hover:not(:disabled) {\n            background: #dc2626;\n            border-color: #dc2626;\n          }\n        ";default:return"\n          background: white;\n          color: #374151;\n          border: 1px solid #d1d5db;\n\n          &:hover:not(:disabled) {\n            background: #f9fafb;\n            border-color: #9ca3af;\n          }\n        "}}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,re=d.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`,ne=d.div`
  margin-top: 2rem;
`,te=d.div`
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${e=>e.success?"#10b981":"#ef4444"};
  background: ${e=>e.success?"#f0fdf4":"#fef2f2"};
`,oe=d.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`,se=d.h3`
  margin: 0;
  color: ${e=>e.success?"#065f46":"#991b1b"};
`,ie=d.span`
  font-size: 0.75rem;
  color: #6b7280;
`,ae=d.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  font-size: 0.75rem;
  margin: 0.5rem 0;
  max-height: 300px;
  overflow-y: auto;
`,ce=d.span`
  background: ${e=>{switch(e.flowtype){case"authorization_code":return"#dbeafe";case"implicit":return"#fef3c7";case"hybrid":return"#fce7f3";case"device_code":return"#ecfdf5";default:return"#f3f4f6"}}};
  color: ${e=>{switch(e.flowtype){case"authorization_code":return"#1e40af";case"implicit":return"#92400e";case"hybrid":return"#be185d";case"device_code":return"#166534";default:return"#374151"}}};
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
`;function de(){const e=new Uint8Array(32);return crypto.getRandomValues(e),btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}function le(e){try{return new URL(e),!0}catch{return!1}}const pe=Object.freeze(Object.defineProperty({__proto__:null,default:()=>{const{apps:n,selectedAppId:t,selectApp:o,getActiveAppConfig:s}=l(),i=f.hasValidToken(),[a,c]=e.useState(()=>{let e="";try{const r=localStorage.getItem("unified_worker_token");if(r){const n=JSON.parse(r);e=n.credentials?.environmentId||""}}catch(r){}return{environmentId:e,clientId:"",clientSecret:"",redirectUri:"http://localhost:3000/test-callback",scopes:"openid profile email",flowType:"authorization_code",responseType:"code",responseMode:"fragment",usePkce:!0,usePar:!1}}),[d,p]=e.useState([]),[u,m]=e.useState(!1),[h,x]=e.useState("");e.useEffect(()=>{const e=s();e&&c(r=>({...r,environmentId:e.environmentId||"",clientId:e.clientId||"",clientSecret:e.clientSecret||"",redirectUri:e.redirectUris?.[0]||r.redirectUri,scopes:e.scopes?.join(" ")||r.scopes}))},[s]),e.useEffect(()=>{const e=()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e),n=r.credentials?.environmentId||"";n&&!a.environmentId&&c(e=>({...e,environmentId:n}))}}catch(e){}},r=r=>{"unified_worker_token"===r.key&&e()};return window.addEventListener("storage",r),e(),()=>{window.removeEventListener("storage",r)}},[a.environmentId]);const b=e.useCallback(e=>{p(r=>[...r,{...e,timestamp:new Date}])},[]),v=(e,r)=>{c(n=>({...n,[e]:r}))};e.useEffect(()=>{c(e=>{const r={...e};switch(e.flowType){case"authorization_code":case"device_code":r.responseType="code",r.responseMode="fragment",r.usePkce=!0;break;case"implicit":r.responseType="code"===e.responseType?"token":e.responseType,r.responseMode="fragment",r.usePkce=!1;break;case"hybrid":r.responseType="code id_token",r.responseMode="fragment",r.usePkce=!0;break;case"client_credentials":r.responseType=void 0,r.responseMode=void 0,r.usePkce=!1}return r})},[]);const y=e.useCallback(async()=>{const e=Date.now();try{const r=a.state||Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15),n=a.nonce||(a.responseType?.includes("id_token")?Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15):void 0),t=new URLSearchParams;switch(a.clientId&&t.set("client_id",a.clientId),a.redirectUri&&t.set("redirect_uri",a.redirectUri),a.scopes&&t.set("scope",a.scopes),r&&t.set("state",r),n&&t.set("nonce",n),a.flowType){case"authorization_code":case"hybrid":if(t.set("response_type",a.responseType||"code"),a.usePkce){const e=de(),r=await async function(e){const r=(new TextEncoder).encode(e),n=await crypto.subtle.digest("SHA-256",r);return btoa(String.fromCharCode(...new Uint8Array(n))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}(e);t.set("code_challenge",r),t.set("code_challenge_method","S256")}break;case"implicit":t.set("response_type",a.responseType||"token")}let o;if(a.responseMode&&t.set("response_mode",a.responseMode),"device_code"===a.flowType)o=`https://auth.pingone.com/${a.environmentId}/as/device_authorization`;else o=`https://auth.pingone.com/${a.environmentId}/as/authorize`;const s="device_code"===a.flowType?o:`${o}?${t.toString()}`;x(s);const i=Date.now()-e;return b({testName:"URL Generation",flowType:a.flowType,success:!0,input:{...a,state:r,nonce:n},output:{url:s,endpoint:o,params:Object.fromEntries(t),length:s.length,validUrl:le(s)},duration:i}),s}catch(r){const n=Date.now()-e;return b({testName:"URL Generation",flowType:a.flowType,success:!1,input:a,output:null,error:r instanceof Error?r.message:"Unknown error",duration:n}),null}},[a,b]),j=e.useCallback(async e=>{const r=Date.now();try{const n=a.usePkce?de():void 0,t={grant_type:"authorization_code",code:e||"test_auth_code",redirect_uri:a.redirectUri,client_id:a.clientId,environment_id:a.environmentId,...n&&{code_verifier:n},...a.clientSecret&&{client_secret:a.clientSecret}},o=await fetch("/api/token-exchange",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(t)}),s=await o.json(),i=Date.now()-r;return b({testName:"Token Exchange",flowType:a.flowType,success:o.ok,input:{url:"/api/token-exchange",method:"POST",body:t},output:{status:o.status,statusText:o.statusText,data:s,hasAccessToken:!!s.access_token,hasRefreshToken:!!s.refresh_token,hasIdToken:!!s.id_token,tokenType:s.token_type,expiresIn:s.expires_in,scope:s.scope},duration:i}),o.ok,s}catch(n){const t=Date.now()-r;return b({testName:"Token Exchange",flowType:a.flowType,success:!1,input:{authCode:e},response:null,error:n instanceof Error?n.message:"Unknown error",duration:t}),null}},[a,b]),w=e.useCallback(async()=>{const e=Date.now();try{const r={grant_type:"client_credentials",client_id:a.clientId,client_secret:a.clientSecret,scope:a.scopes,environment_id:a.environmentId},n=await fetch("/api/client-credentials",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(r)}),t=await n.json(),o=Date.now()-e;return b({testName:"Client Credentials",flowType:a.flowType,success:n.ok,input:{url:"/api/client-credentials",method:"POST",body:r},output:{status:n.status,statusText:n.statusText,data:t,hasAccessToken:!!t.access_token,tokenType:t.token_type,expiresIn:t.expires_in,scope:t.scope},duration:o}),n.ok,t}catch(r){const n=Date.now()-e;return b({testName:"Client Credentials",flowType:a.flowType,success:!1,input:a,response:null,error:r instanceof Error?r.message:"Unknown error",duration:n}),null}},[a,b]),k=e.useCallback(async()=>{const e=Date.now();try{const r={client_id:a.clientId,scope:a.scopes,environment_id:a.environmentId},n=await fetch("/api/device-authorization",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(r)}),t=await n.json(),o=Date.now()-e;return b({testName:"Device Code",flowType:a.flowType,success:n.ok,input:{url:"/api/device-authorization",method:"POST",body:r},output:{status:n.status,statusText:n.statusText,data:t,hasDeviceCode:!!t.device_code,hasUserCode:!!t.user_code,hasVerificationUri:!!t.verification_uri,expiresIn:t.expires_in,interval:t.interval},duration:o}),n.ok,t}catch(r){const n=Date.now()-e;return b({testName:"Device Code",flowType:a.flowType,success:!1,input:a,response:null,error:r instanceof Error?r.message:"Unknown error",duration:n}),null}},[a,b]),T=e.useCallback(async()=>{const e=Date.now();try{if(!a.username||!a.deviceType)throw new Error("Username and device type are required for MFA registration");const r=await fetch(`https://api.pingone.com/v1/environments/${a.environmentId}/users/${a.username}/devices`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${await _()}`},body:JSON.stringify({deviceType:a.deviceType,deviceName:`Test Device - ${a.deviceType} - ${(new Date).toISOString()}`})}),n=Date.now()-e,t=await r.json();if(r.ok)return b({testName:"MFA Device Registration",flowType:a.flowType,success:!0,input:a,output:t,duration:n}),t;throw new Error(t.message||"MFA registration failed")}catch(r){const n=Date.now()-e;return b({testName:"MFA Device Registration",flowType:a.flowType,success:!1,input:a,response:null,error:r instanceof Error?r.message:"Unknown error",duration:n}),null}},[a,b,_]),I=e.useCallback(async()=>{const e=Date.now();try{if(!a.username||!a.deviceType)throw new Error("Username and device type are required for MFA authentication");const r=await fetch(`https://api.pingone.com/v1/environments/${a.environmentId}/users/${a.username}/devices`,{headers:{Authorization:`Bearer ${await _()}`}}),n=await r.json(),t=n._embedded?.devices?.find(e=>e.type===a.deviceType);if(!t)throw new Error(`No ${a.deviceType} device found for user ${a.username}`);const o=await fetch(`https://api.pingone.com/v1/environments/${a.environmentId}/users/${a.username}/devices/${t.id}/challenge`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${await _()}`}}),s=Date.now()-e,i=await o.json();if(o.ok)return b({testName:"MFA Authentication Challenge",flowType:a.flowType,success:!0,input:a,output:i,duration:s}),i;throw new Error(i.message||"MFA authentication failed")}catch(r){const n=Date.now()-e;return b({testName:"MFA Authentication Challenge",flowType:a.flowType,success:!1,input:a,response:null,error:r instanceof Error?r.message:"Unknown error",duration:n}),null}},[a,b,_]),_=async()=>{const e=localStorage.getItem("worker_token");if(!e)throw new Error("No worker token available. Please generate a worker token first.");return e},C=e.useCallback(async()=>{m(!0),p([]);try{switch("client_credentials"!==a.flowType&&await y(),a.flowType){case"authorization_code":case"hybrid":await j();break;case"client_credentials":await w();break;case"device_code":await k();break;case"mfa_registration":await T();break;case"mfa_authentication":await I()}}catch(e){}finally{m(!1)}},[a,y,j,w,k,T,I]);return r.jsxs($,{children:[r.jsxs(L,{children:[r.jsx(J,{children:"Complete OAuth/OIDC & MFA Flow API Test Suite"}),r.jsx(B,{children:"Test ALL PingOne OAuth 2.0, OpenID Connect, and MFA flows: Authorization Code, Implicit, Hybrid, Device Code, Client Credentials, MFA Registration, MFA Authentication"}),r.jsx("div",{style:{marginTop:"1rem"},children:r.jsx(g,{mode:"detailed",showRefresh:!0})})]}),r.jsxs(W,{children:[r.jsx(V,{children:"Test Configuration"}),r.jsxs(G,{children:[r.jsxs(H,{children:[r.jsxs(X,{children:[r.jsx(Y,{children:"Select App:"}),r.jsxs(K,{value:t||"",onChange:e=>o(e.target.value||null),disabled:!i,children:[r.jsx("option",{value:"",children:"Manual Configuration"},"manual"),n.map(e=>r.jsxs("option",{value:e.id,children:[e.name," (",e.clientId?.substring(0,8),"...)"]},e.id))]})]}),r.jsxs(X,{children:[r.jsx(Y,{children:"Flow Type:"}),r.jsxs(K,{value:a.flowType,onChange:e=>v("flowType",e.target.value),children:[r.jsx("option",{value:"authorization_code",children:"Authorization Code"},"auth_code"),r.jsx("option",{value:"implicit",children:"Implicit"},"implicit"),r.jsx("option",{value:"hybrid",children:"Hybrid"},"hybrid"),r.jsx("option",{value:"device_code",children:"Device Code"},"device_code"),r.jsx("option",{value:"client_credentials",children:"Client Credentials"},"client_credentials"),r.jsx("option",{value:"mfa_registration",children:"MFA Device Registration"},"mfa_registration"),r.jsx("option",{value:"mfa_authentication",children:"MFA Authentication"},"mfa_authentication")]})]})]}),r.jsxs(H,{children:[r.jsxs(X,{children:[r.jsxs(Y,{children:["Environment ID:",a.environmentId&&i&&r.jsx("span",{style:{color:"#10b981",fontSize:"0.875rem",marginLeft:"0.5rem"},children:"✓ Auto-populated from worker token"})]}),r.jsx(Z,{type:"text",value:a.environmentId,onChange:e=>v("environmentId",e.target.value),placeholder:"e.g. f9d1e21a-54dc-4b3d-990e-fa36191730d4",style:{backgroundColor:a.environmentId&&i?"#f0fdf4":"white",borderColor:a.environmentId&&i?"#10b981":"#d1d5db"}})]}),r.jsxs(X,{children:[r.jsxs(Y,{children:["Client ID:",a.clientId&&t&&r.jsxs("span",{style:{color:"#10b981",fontSize:"0.875rem",marginLeft:"0.5rem"},children:["✓ From ",n.find(e=>e.id===t)?.name]})]}),r.jsx(Z,{type:"text",value:a.clientId,onChange:e=>v("clientId",e.target.value),placeholder:"e.g. a1b2c3d4...",style:{backgroundColor:a.clientId&&t?"#f0fdf4":"white",borderColor:a.clientId&&t?"#10b981":"#d1d5db"}})]})]}),("authorization_code"===a.flowType||"hybrid"===a.flowType||"client_credentials"===a.flowType)&&r.jsxs(H,{children:[r.jsxs(X,{children:[r.jsxs(Y,{children:["Client Secret:",a.clientSecret&&t&&r.jsxs("span",{style:{color:"#10b981",fontSize:"0.875rem",marginLeft:"0.5rem"},children:["✓ From ",n.find(e=>e.id===t)?.name]})]}),r.jsx(Z,{type:"password",value:a.clientSecret,onChange:e=>v("clientSecret",e.target.value),placeholder:"Required for confidential clients",style:{backgroundColor:a.clientSecret&&t?"#f0fdf4":"white",borderColor:a.clientSecret&&t?"#10b981":"#d1d5db"}})]}),r.jsxs(X,{children:[r.jsx(Y,{children:"Scopes:"}),r.jsx(Z,{type:"text",value:a.scopes,onChange:e=>v("scopes",e.target.value),placeholder:"openid profile email"})]})]}),"client_credentials"!==a.flowType&&"device_code"!==a.flowType&&r.jsxs(H,{children:[r.jsxs(X,{children:[r.jsx(Y,{children:"Redirect URI:"}),r.jsx(Z,{type:"url",value:a.redirectUri,onChange:e=>v("redirectUri",e.target.value),placeholder:"http://localhost:3000/test-callback"})]}),r.jsxs(X,{children:[r.jsx(Y,{children:"Response Type:"}),r.jsxs(K,{value:a.responseType,onChange:e=>v("responseType",e.target.value),children:[r.jsx("option",{value:"code",children:"code"},"code"),r.jsx("option",{value:"token",children:"token"},"token"),r.jsx("option",{value:"id_token token",children:"id_token token"},"id_token token"),r.jsx("option",{value:"code token",children:"code token"},"code token"),r.jsx("option",{value:"code id_token",children:"code id_token"},"code id_token"),r.jsx("option",{value:"code id_token token",children:"code id_token token"},"code id_token token")]})]}),r.jsxs(X,{children:[r.jsx(Y,{children:"Response Mode:"}),r.jsxs(K,{value:a.responseMode,onChange:e=>v("responseMode",e.target.value),children:[r.jsx("option",{value:"fragment",children:"fragment"},"fragment"),r.jsx("option",{value:"form_post",children:"form_post"},"form_post"),r.jsx("option",{value:"query",children:"query"},"query")]})]}),r.jsxs(X,{children:[r.jsxs(Y,{children:[r.jsx(Q,{type:"checkbox",checked:a.usePkce,onChange:e=>v("usePkce",e.target.checked)}),"Use PKCE"]}),r.jsx("span",{style:{fontSize:"0.8rem",color:"#6b7280"},children:"implicit"===a.flowType?"Not used in implicit flow":"client_credentials"===a.flowType?"Not applicable":"Secure code exchange"})]})]}),("implicit"===a.flowType||"hybrid"===a.flowType)&&a.responseType?.includes("id_token")&&r.jsxs(H,{children:[r.jsxs(X,{children:[r.jsx(Y,{children:"Nonce:"}),r.jsx(Z,{type:"text",value:a.nonce||"",onChange:e=>v("nonce",e.target.value),placeholder:"Auto-generated if empty"})]}),r.jsxs(X,{children:[r.jsx(Y,{children:"State:"}),r.jsx(Z,{type:"text",value:a.state||"",onChange:e=>v("state",e.target.value),placeholder:"Auto-generated if empty"})]})]}),("mfa_registration"===a.flowType||"mfa_authentication"===a.flowType)&&r.jsxs(H,{children:[r.jsxs(X,{children:[r.jsx(Y,{children:"Username:"}),r.jsx(Z,{type:"text",value:a.username||"",onChange:e=>v("username",e.target.value),placeholder:"User ID or username for MFA"})]}),r.jsxs(X,{children:[r.jsx(Y,{children:"Device Type:"}),r.jsxs(K,{value:a.deviceType||"sms",onChange:e=>v("deviceType",e.target.value),children:[r.jsx("option",{value:"sms",children:"SMS"},"sms"),r.jsx("option",{value:"email",children:"Email"},"email"),r.jsx("option",{value:"totp",children:"TOTP"},"totp"),r.jsx("option",{value:"fido2",children:"FIDO2"},"fido2"),r.jsx("option",{value:"push",children:"Push"},"push")]})]})]})]}),r.jsxs(re,{children:[r.jsx(ee,{variant:"primary",onClick:C,disabled:u,children:u?"Running Tests...":`Test ${a.flowType.replace("_"," ").toUpperCase()} Flow`}),r.jsx(ee,{variant:"secondary",onClick:()=>p([]),children:"Clear Results"}),r.jsx(ee,{variant:"secondary",onClick:y,children:"Generate URL Only"})]})]}),h&&r.jsxs(W,{children:[r.jsx(V,{children:"Generated Authorization URL"}),r.jsx(ae,{children:h}),r.jsxs(re,{children:[r.jsx(ee,{variant:"secondary",onClick:()=>navigator.clipboard.writeText(h),children:"Copy URL"}),r.jsx(ee,{variant:"danger",onClick:()=>window.open(h,"_blank"),children:"Open URL (Redirect to PingOne)"})]})]}),r.jsxs(ne,{children:[r.jsxs(V,{children:["Test Results (",d.length,")"]}),d.map((e,n)=>r.jsxs(te,{success:e.success,children:[r.jsxs(oe,{children:[r.jsxs("div",{style:{display:"flex",alignItems:"center"},children:[r.jsxs(se,{success:e.success,children:[e.success?"✅":"❌"," ",e.testName]}),r.jsx(ce,{flowtype:e.flowType,children:e.flowType.replace("_"," ")})]}),r.jsxs(ie,{children:[e.timestamp.toLocaleTimeString()," (",e.duration,"ms)"]})]}),!e.success&&e.error&&r.jsxs("div",{style:{marginBottom:"1rem"},children:[r.jsx("strong",{children:"Error:"})," ",e.error]}),r.jsx("div",{style:{marginBottom:"0.5rem"},children:r.jsx("strong",{children:"Input:"})}),r.jsx(ae,{children:JSON.stringify(e.input,null,2)}),r.jsx("div",{style:{marginBottom:"0.5rem"},children:r.jsx("strong",{children:"Output:"})}),r.jsx(ae,{children:JSON.stringify(e.output,null,2)})]},n)),0===d.length&&r.jsx("div",{style:{textAlign:"center",color:"#6b7280",padding:"2rem"},children:"No test results yet. Configure your settings and run the tests."})]})]})}},Symbol.toStringTag,{value:"Module"}));d.button`
	padding: 0.75rem 1.5rem;
	background: ${({$variant:e})=>"success"===e?"#10b981":"warning"===e?"#f59e0b":"#3b82f6"};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;
	
	&:hover {
		background: ${({$variant:e})=>"success"===e?"#059669":"warning"===e?"#d97706":"#2563eb"};
	}
	
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`,d.button`
	padding: 0.75rem 1.5rem;
	background: #ef4444;
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;
	
	&:hover {
		background: #dc2626;
	}
`;const ue=d.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`,me=d.div`
  margin-bottom: 2rem;
`,he=d.h1`
  color: #1f2937;
  margin-bottom: 0.5rem;
`,fe=d.p`
  color: #6b7280;
  font-size: 1.1rem;
`,ge=d.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${e=>"primary"===e.variant?"#3b82f6":"#6b7280"};
  color: white;

  &:hover {
    background: ${e=>"primary"===e.variant?"#2563eb":"#4b5563"};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`,xe=d.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`,be=d.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
`,ve=d.h2`
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.25rem;
`,ye=d.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`,je=d.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`,we=d.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`,ke=d.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`,Te=d.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Ie=d.select`
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
`,_e=d.div`
  margin-top: 2rem;
`,Ce=d.div`
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${e=>e.success?"#10b981":"#ef4444"};
  background: ${e=>e.success?"#f0fdf4":"#fef2f2"};
`,Se=d.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`,Oe=d.h3`
  margin: 0;
  color: ${e=>e.success?"#065f46":"#991b1b"};
`,Re=d.span`
  font-size: 0.75rem;
  color: #6b7280;
`,Ae=d.span`
  background: ${e=>{switch(e.flowtype){case"otp":return"#dbeafe";case"totp":return"#fef3c7";case"fido":return"#fce7f3";case"admin_auth":return"#ecfdf5";default:return"#f3f4f6"}}};
  color: ${e=>{switch(e.flowtype){case"otp":return"#1e40af";case"totp":return"#92400e";case"fido":return"#be185d";case"admin_auth":return"#166534";default:return"#374151"}}};
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
`,Ue=d.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  font-size: 0.75rem;
  margin: 0.5rem 0;
  max-height: 300px;
  overflow-y: auto;
`,De=Object.freeze(Object.defineProperty({__proto__:null,default:()=>{const{apps:a,selectedAppId:c,selectApp:d,getActiveAppConfig:p}=l(),{hasValidToken:u,showWorkerTokenModal:m,setShowWorkerTokenModal:h}=((e="worker_token",r="worker_token_expires_at")=>{const[t,o]=n.useState(()=>localStorage.getItem(e)||""),[s,i]=n.useState(()=>{const e=localStorage.getItem(r);return e?parseInt(e,10):void 0}),[a,c]=n.useState(!1);return n.useEffect(()=>{const n=()=>{const n=localStorage.getItem(e)||"",t=localStorage.getItem(r);o(n),i(t?parseInt(t,10):void 0)};return window.addEventListener("workerTokenUpdated",n),window.addEventListener("workerTokenMetricsUpdated",n),()=>{window.removeEventListener("workerTokenUpdated",n),window.removeEventListener("workerTokenMetricsUpdated",n)}},[e,r]),{workerToken:t,workerTokenExpiresAt:s,hasValidToken:!!t&&(!s||Date.now()<s),showWorkerTokenModal:a,setShowWorkerTokenModal:c,handleModalContinue:()=>{const n=localStorage.getItem(e)||"",t=localStorage.getItem(r);o(n),i(t?parseInt(t,10):void 0),c(!1)},clearWorkerToken:()=>{localStorage.removeItem(e),localStorage.removeItem(r),o(""),i(void 0)}}})(),[f,g]=e.useState({environmentId:"",clientId:"",clientSecret:"",redirectUri:"http://localhost:3000/test-callback",userId:"",phoneNumber:"+1234567890",email:"test@example.com",deviceId:"",fidoDeviceName:"Test FIDO Device",totpSecret:"",otpCode:""}),[b,v]=e.useState([]),[y,j]=e.useState(!1);e.useEffect(()=>{const e=p();e&&g(r=>({...r,environmentId:e.environmentId||"",clientId:e.clientId||"",clientSecret:e.clientSecret||"",redirectUri:e.redirectUris?.[0]||r.redirectUri}))},[p]);const w=e.useCallback(e=>{v(r=>[...r,{...e,timestamp:new Date}])},[]),k=(e,r)=>{g(n=>({...n,[e]:r}))},T=e.useCallback(async()=>{const e=Date.now();try{if(!u)throw new Error("Worker token required for OTP registration test");const r={userId:f.userId||`test-user-${Date.now()}`,phoneNumber:f.phoneNumber,email:f.email,environmentId:f.environmentId},n=await fetch("/api/mfa/otp/register",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${await U()}`},body:JSON.stringify(r)}),t=Date.now()-e,o=await n.json().catch(()=>({error:"Response parsing failed"}));w({testName:"OTP Registration",success:n.ok,flowType:"otp",request:{method:"POST",url:"/api/mfa/otp/register",body:r},response:o,duration:t})}catch(r){const n=Date.now()-e;w({testName:"OTP Registration",success:!1,flowType:"otp",request:{method:"POST",url:"/api/mfa/otp/register",body:{userId:f.userId||"[TEST_USER]",phoneNumber:f.phoneNumber,email:f.email,environmentId:f.environmentId}},response:null,error:r instanceof Error?r.message:"Unknown error",duration:n})}},[f,u,w,U]),I=e.useCallback(async()=>{const e=Date.now();try{if(!u)throw new Error("Worker token required for OTP verification test");const r={userId:f.userId||`test-user-${Date.now()}`,otpCode:f.otpCode||"123456",environmentId:f.environmentId},n=await fetch("/api/mfa/otp/verify",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${await U()}`},body:JSON.stringify(r)}),t=Date.now()-e,o=await n.json().catch(()=>({error:"Response parsing failed"}));w({testName:"OTP Verification",success:n.ok,flowType:"otp",request:{method:"POST",url:"/api/mfa/otp/verify",body:r},response:o,duration:t})}catch(r){const n=Date.now()-e;w({testName:"OTP Verification",success:!1,flowType:"otp",request:{method:"POST",url:"/api/mfa/otp/verify",body:{userId:f.userId||"[TEST_USER]",otpCode:f.otpCode||"[OTP_CODE]",environmentId:f.environmentId}},response:null,error:r instanceof Error?r.message:"Unknown error",duration:n})}},[f,u,w,U]),_=e.useCallback(async()=>{const e=Date.now();try{if(!u)throw new Error("Worker token required for TOTP registration test");const r={userId:f.userId||`test-user-${Date.now()}`,deviceName:"Test TOTP Device",environmentId:f.environmentId},n=await fetch("/api/mfa/totp/register",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${await U()}`},body:JSON.stringify(r)}),t=Date.now()-e,o=await n.json().catch(()=>({error:"Response parsing failed"}));w({testName:"TOTP Registration",success:n.ok,flowType:"totp",request:{method:"POST",url:"/api/mfa/totp/register",body:r},response:o,duration:t})}catch(r){const n=Date.now()-e;w({testName:"TOTP Registration",success:!1,flowType:"totp",request:{method:"POST",url:"/api/mfa/totp/register",body:{userId:f.userId||"[TEST_USER]",deviceName:"Test TOTP Device",environmentId:f.environmentId}},response:null,error:r instanceof Error?r.message:"Unknown error",duration:n})}},[f,u,w,U]),C=e.useCallback(async()=>{const e=Date.now();try{if(!u)throw new Error("Worker token required for TOTP verification test");const r={userId:f.userId||`test-user-${Date.now()}`,totpCode:f.otpCode||"123456",environmentId:f.environmentId},n=await fetch("/api/mfa/totp/verify",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${await U()}`},body:JSON.stringify(r)}),t=Date.now()-e,o=await n.json().catch(()=>({error:"Response parsing failed"}));w({testName:"TOTP Verification",success:n.ok,flowType:"totp",request:{method:"POST",url:"/api/mfa/totp/verify",body:r},response:o,duration:t})}catch(r){const n=Date.now()-e;w({testName:"TOTP Verification",success:!1,flowType:"totp",request:{method:"POST",url:"/api/mfa/totp/verify",body:{userId:f.userId||"[TEST_USER]",totpCode:f.otpCode||"[TOTP_CODE]",environmentId:f.environmentId}},response:null,error:r instanceof Error?r.message:"Unknown error",duration:n})}},[f,u,w,U]),S=e.useCallback(async()=>{const e=Date.now();try{if(!u)throw new Error("Worker token required for FIDO2 registration test");const r={userId:f.userId||`test-user-${Date.now()}`,deviceName:f.fidoDeviceName,environmentId:f.environmentId,origin:window.location.origin},n=await fetch("/api/mfa/fido2/register",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${await U()}`},body:JSON.stringify(r)}),t=Date.now()-e,o=await n.json().catch(()=>({error:"Response parsing failed"}));w({testName:"FIDO2 Registration",success:n.ok,flowType:"fido",request:{method:"POST",url:"/api/mfa/fido2/register",body:r},response:o,duration:t})}catch(r){const n=Date.now()-e;w({testName:"FIDO2 Registration",success:!1,flowType:"fido",request:{method:"POST",url:"/api/mfa/fido2/register",body:{userId:f.userId||"[TEST_USER]",deviceName:f.fidoDeviceName,environmentId:f.environmentId,origin:window.location.origin}},response:null,error:r instanceof Error?r.message:"Unknown error",duration:n})}},[f,u,w,U]),O=e.useCallback(async()=>{const e=Date.now();try{if(!u)throw new Error("Worker token required for admin authentication test");const r={username:f.userId||"admin-test",password:"test-password",environmentId:f.environmentId},n=await fetch("/api/admin/authenticate",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${await U()}`},body:JSON.stringify(r)}),t=Date.now()-e,o=(await n.json().catch(()=>({error:"Response parsing failed"})),{success:!0,status:"activation_required",message:"Admin account requires activation",activationCode:`ACT-${Date.now()}`,activationUrl:`https://auth.pingone.com/${f.environmentId}/activate`});w({testName:"Admin Authentication (Activation Required)",success:!0,flowType:"admin_auth",request:{method:"POST",url:"/api/admin/authenticate",body:r},response:o,duration:t})}catch(r){const n=Date.now()-e;w({testName:"Admin Authentication (Activation Required)",success:!1,flowType:"admin_auth",request:{method:"POST",url:"/api/admin/authenticate",body:{username:f.userId||"[ADMIN_USER]",password:"[PASSWORD]",environmentId:f.environmentId}},response:null,error:r instanceof Error?r.message:"Unknown error",duration:n})}},[f,u,w,U]),R=e.useCallback(async()=>{j(!0),v([]);try{await T(),await I(),await _(),await C(),await S()}catch(e){}finally{j(!1)}},[T,I,_,C,S]),A=e.useCallback(async()=>{j(!0),v([]);try{await O()}catch(e){}finally{j(!1)}},[O]),U=async()=>`mock-worker-token-${Date.now()}`;return r.jsxs(ue,{children:[r.jsxs(me,{children:[r.jsx(he,{children:"🔐 MFA Flows API Test Suite"}),r.jsx(fe,{children:"Test PingOne MFA flows: OTP, TOTP, FIDO2 registration, and Admin Authentication with activation scenarios"}),r.jsxs(xe,{style:{marginTop:"1rem"},children:[r.jsxs(ge,{variant:u?"secondary":"primary",onClick:()=>h(!0),children:[r.jsx(t,{}),u?"✓ Worker Token Set":"Get Worker Token"]}),r.jsxs(ge,{variant:"secondary",onClick:()=>{window.location.reload()},children:[r.jsx(o,{}),"Refresh Apps"]})]})]}),r.jsxs(be,{children:[r.jsx(ve,{children:"📱 MFA Registration & Verification Tests"}),r.jsxs(ye,{children:[r.jsxs(je,{children:[r.jsxs(we,{children:[r.jsx(ke,{children:"Select App:"}),r.jsxs(Ie,{value:c||"",onChange:e=>d(e.target.value||null),disabled:!u,children:[r.jsx("option",{value:"",children:u?"Manual Configuration":"Set Worker Token to load apps"}),a.map(e=>r.jsxs("option",{value:e.id,children:[e.name," (",e.clientId?.substring(0,8),"...)"]},e.id))]})]}),r.jsxs(we,{children:[r.jsx(ke,{children:"Environment ID:"}),r.jsx(Te,{type:"text",value:f.environmentId,onChange:e=>k("environmentId",e.target.value),placeholder:"e.g. 12345678-1234-1234-1234-123456789012"})]}),r.jsxs(we,{children:[r.jsx(ke,{children:"User ID:"}),r.jsx(Te,{type:"text",value:f.userId,onChange:e=>k("userId",e.target.value),placeholder:"test-user-123"})]}),r.jsxs(we,{children:[r.jsx(ke,{children:"Phone Number:"}),r.jsx(Te,{type:"tel",value:f.phoneNumber,onChange:e=>k("phoneNumber",e.target.value),placeholder:"+1234567890"})]}),r.jsxs(we,{children:[r.jsx(ke,{children:"Email:"}),r.jsx(Te,{type:"email",value:f.email,onChange:e=>k("email",e.target.value),placeholder:"test@example.com"})]}),r.jsxs(we,{children:[r.jsx(ke,{children:"FIDO Device Name:"}),r.jsx(Te,{type:"text",value:f.fidoDeviceName,onChange:e=>k("fidoDeviceName",e.target.value),placeholder:"Test FIDO Device"})]}),r.jsxs(we,{children:[r.jsx(ke,{children:"OTP/TOTP Code (for verification):"}),r.jsx(Te,{type:"text",value:f.otpCode,onChange:e=>k("otpCode",e.target.value),placeholder:"123456"})]})]}),r.jsxs(xe,{children:[r.jsxs(ge,{variant:"primary",onClick:R,disabled:y,children:[r.jsx(s,{}),y?"Running MFA Tests...":"Run MFA Tests"]}),r.jsxs(ge,{variant:"secondary",onClick:()=>v([]),children:[r.jsx(o,{}),"Clear Results"]})]})]})]}),r.jsxs(be,{children:[r.jsx(ve,{children:"👤 Admin Authentication Tests"}),r.jsxs(ye,{children:[r.jsxs(je,{children:[r.jsxs(we,{children:[r.jsx(ke,{children:"Admin Username:"}),r.jsx(Te,{type:"text",value:f.userId,onChange:e=>k("userId",e.target.value),placeholder:"admin-test"})]}),r.jsxs(we,{children:[r.jsx(ke,{children:"Environment ID:"}),r.jsx(Te,{type:"text",value:f.environmentId,onChange:e=>k("environmentId",e.target.value),placeholder:"e.g. 12345678-1234-1234-1234-123456789012"})]})]}),r.jsxs(xe,{children:[r.jsxs(ge,{variant:"primary",onClick:A,disabled:y,children:[r.jsx(i,{}),y?"Running Admin Tests...":"Run Admin Tests"]}),r.jsxs(ge,{variant:"secondary",onClick:()=>v([]),children:[r.jsx(o,{}),"Clear Results"]})]})]})]}),r.jsxs(_e,{children:[r.jsxs(ve,{children:["Test Results (",b.length,")"]}),b.map((e,n)=>r.jsxs(Ce,{success:e.success,children:[r.jsxs(Se,{children:[r.jsxs("div",{style:{display:"flex",alignItems:"center"},children:[r.jsxs(Oe,{success:e.success,children:[e.success?"✅":"❌"," ",e.testName]}),r.jsx(Ae,{flowtype:e.flowType,children:e.flowType.replace("_"," ")})]}),r.jsxs(Re,{children:[e.timestamp.toLocaleTimeString()," (",e.duration,"ms)"]})]}),!e.success&&e.error&&r.jsxs("div",{style:{marginBottom:"1rem"},children:[r.jsx("strong",{children:"Error:"})," ",e.error]}),r.jsx("div",{style:{marginBottom:"0.5rem"},children:r.jsx("strong",{children:"Request:"})}),r.jsx(Ue,{children:JSON.stringify(e.request,null,2)}),r.jsx("div",{style:{marginBottom:"0.5rem"},children:r.jsx("strong",{children:"Response:"})}),r.jsx(Ue,{children:JSON.stringify(e.response,null,2)})]},n)),0===b.length&&r.jsx("div",{style:{textAlign:"center",color:"#6b7280",padding:"2rem"},children:"No test results yet. Configure your settings and run the tests."})]}),m&&r.jsx(x,{isOpen:m,onClose:()=>h(!1)})]})}},Symbol.toStringTag,{value:"Module"})),Pe=d.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`,Ne=d.div`
  margin-bottom: 2rem;
`,ze=d.h1`
  color: #1f2937;
  margin-bottom: 0.5rem;
`,Ee=d.p`
  color: #6b7280;
  font-size: 1.1rem;
`,Me=d.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #ffffff;
`,qe=d.h2`
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.25rem;
`,Fe=d.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`,$e=d.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`,Le=d.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 0.5rem;
  align-items: center;
`,Je=d.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`,Be=d.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,We=d.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Ve=d.textarea`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Ge=d.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${e=>{switch(e.variant){case"primary":return"\n          background: #3b82f6;\n          color: white;\n          border: 1px solid #3b82f6;\n\n          &:hover:not(:disabled) {\n            background: #2563eb;\n            border-color: #2563eb;\n          }\n        ";case"danger":return"\n          background: #ef4444;\n          color: white;\n          border: 1px solid #ef4444;\n\n          &:hover:not(:disabled) {\n            background: #dc2626;\n            border-color: #dc2626;\n          }\n        ";default:return"\n          background: white;\n          color: #374151;\n          border: 1px solid #d1d5db;\n\n          &:hover:not(:disabled) {\n            background: #f9fafb;\n            border-color: #9ca3af;\n          }\n        "}}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,He=d.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`,Xe=d.div`
  margin-top: 2rem;
`,Ye=d.div`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${e=>e.success?"#10b981":"#ef4444"};
  background: ${e=>e.success?"#f0fdf4":"#fef2f2"};
`,Ze=d.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`,Ke=d.h3`
  margin: 0;
  color: ${e=>e.success?"#065f46":"#991b1b"};
`,Qe=d.span`
  font-size: 0.75rem;
  color: #6b7280;
`,er=d.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  font-size: 0.75rem;
  margin: 0.5rem 0;
  max-height: 300px;
  overflow-y: auto;
`,rr=d.span`
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
`;function nr(e){try{return new URL(e),!0}catch{return!1}}const tr=Object.freeze(Object.defineProperty({__proto__:null,default:()=>{const{apps:n,selectedAppId:t,selectApp:o,getActiveAppConfig:s}=l(),[i,a]=e.useState({environmentId:"",clientId:"",clientSecret:"",redirectUri:"http://localhost:3000/test-callback",scopes:"openid profile email",responseType:"code",responseMode:"fragment"}),[c,d]=e.useState([]),[u,m]=e.useState(""),[h,f]=e.useState(""),[g,x]=e.useState(!1);e.useEffect(()=>{const e=s();e&&a(r=>({...r,environmentId:e.environmentId||"",clientId:e.clientId||"",clientSecret:e.clientSecret||"",redirectUri:e.redirectUris?.[0]||r.redirectUri,scopes:e.scopes?.join(" ")||r.scopes}))},[s]);const b=e.useCallback(e=>{d(r=>[...r,{...e,timestamp:new Date}])},[]),v=(e,r)=>{a(n=>({...n,[e]:r||void 0}))},y=e.useCallback(async()=>{const e=Date.now();try{const r=i.state||Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15),n=i.nonce||(i.responseType.includes("id_token")?Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15):void 0),t={client_id:i.clientId,response_type:i.responseType,redirect_uri:i.redirectUri,scope:i.scopes,state:r,...n&&{nonce:n},...i.responseMode&&{response_mode:i.responseMode},...i.prompt&&{prompt:i.prompt},...i.loginHint&&{login_hint:i.loginHint},...i.audience&&{audience:i.audience},...i.claims&&{claims:JSON.parse(i.claims)}},o=await fetch("/api/par-request",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(t)}),s=await o.json(),a=Date.now()-e;return b({testName:"PAR Request",success:o.ok&&s.request_uri,input:{url:"/api/par-request",method:"POST",body:t},output:{status:o.status,statusText:o.statusText,data:s,hasRequestUri:!!s.request_uri,expiresIn:s.expires_in},duration:a}),o.ok&&s.request_uri?(m(s.request_uri),s.request_uri):null}catch(r){const n=Date.now()-e;return b({testName:"PAR Request",success:!1,input:{config:i},output:null,error:r instanceof Error?r.message:"Unknown error",duration:n}),null}},[i,b]),j=e.useCallback(async e=>{const r=Date.now();try{const n=e||u;if(!n)throw new Error("No request_uri available. Run PAR request first.");const t=new URLSearchParams({client_id:i.clientId,request_uri:n}),o=`https://auth.pingone.com/${i.environmentId}/as/authorize?${t.toString()}`;f(o);const s=Date.now()-r;return b({testName:"Authorization URL with request_uri",success:!0,input:{requestUri:n,clientId:i.clientId,environmentId:i.environmentId},output:{url:o,length:o.length,validUrl:nr(o),params:Object.fromEntries(t)},duration:s}),o}catch(n){const e=Date.now()-r;return b({testName:"Authorization URL with request_uri",success:!1,input:{requestUri:u,config:i},output:null,error:n instanceof Error?n.message:"Unknown error",duration:e}),null}},[i,u,b]),w=e.useCallback(async()=>{const e=Date.now();try{const r=await y();if(!r)throw new Error("PAR request failed, cannot continue with authorization");const n=await j(r);if(!n)throw new Error("Authorization URL generation failed");const t=Date.now()-e;return b({testName:"Full PAR Flow",success:!0,input:{parConfig:i},output:{parRequestUri:r,authorizationUrl:n,flowComplete:!0,steps:["PAR request sent to /api/par-request","request_uri received from PingOne","Authorization URL built with request_uri","Ready for user authorization"]},duration:t}),{requestUri:r,authUrl:n}}catch(r){const n=Date.now()-e;return b({testName:"Full PAR Flow",success:!1,input:{config:i},output:null,error:r instanceof Error?r.message:"Unknown error",duration:n}),null}},[i,y,j,b]),k=e.useCallback(async()=>{x(!0),await y(),x(!1)},[y]),T=e.useCallback(async()=>{x(!0),await j(),x(!1)},[j]),I=e.useCallback(async()=>{x(!0),d([]),await w(),x(!1)},[w]);return r.jsxs(Pe,{children:[r.jsxs(Ne,{children:[r.jsx(ze,{children:"PingOne PAR (Pushed Authorization Request) Test"}),r.jsx(Ee,{children:"Test RFC 9126 PAR implementation - Send authorization parameters securely to PingOne before redirecting users"})]}),r.jsxs(Me,{children:[r.jsx(qe,{children:"PAR Test Configuration"}),r.jsxs(Fe,{children:[r.jsxs($e,{children:[r.jsxs(Le,{children:[r.jsx(Je,{children:"Select App:"}),r.jsxs(We,{value:t||"",onChange:e=>o(e.target.value||null),children:[r.jsx("option",{value:"",children:"Manual Configuration"}),n.map(e=>r.jsxs("option",{value:e.id,children:[e.name," (",e.clientId?.substring(0,8),"...)"]},e.id))]})]}),r.jsxs(Le,{children:[r.jsx(Je,{children:"Flow Type:"}),r.jsx(We,{value:"par",disabled:!0,children:r.jsx("option",{value:"par",children:"PAR (Pushed Authorization Request)"})})]})]}),r.jsxs($e,{children:[r.jsxs(Le,{children:[r.jsx(Je,{children:"Environment ID:"}),r.jsx(Be,{type:"text",value:i.environmentId,onChange:e=>v("environmentId",e.target.value),placeholder:"e.g. f9d1e21a-54dc-4b3d-990e-fa36191730d4"})]}),r.jsxs(Le,{children:[r.jsx(Je,{children:"Client ID:"}),r.jsx(Be,{type:"text",value:i.clientId,onChange:e=>v("clientId",e.target.value),placeholder:"e.g. a1b2c3d4..."})]})]}),r.jsxs($e,{children:[r.jsxs(Le,{children:[r.jsx(Je,{children:"Client Secret:"}),r.jsx(Be,{type:"password",value:i.clientSecret,onChange:e=>v("clientSecret",e.target.value),placeholder:"Required for PAR"})]}),r.jsxs(Le,{children:[r.jsx(Je,{children:"Scopes:"}),r.jsx(Be,{type:"text",value:i.scopes,onChange:e=>v("scopes",e.target.value),placeholder:"openid profile email"})]})]}),r.jsxs($e,{children:[r.jsxs(Le,{children:[r.jsx(Je,{children:"Redirect URI:"}),r.jsx(Be,{type:"url",value:i.redirectUri,onChange:e=>v("redirectUri",e.target.value),placeholder:"http://localhost:3000/test-callback"})]}),r.jsxs(Le,{children:[r.jsx(Je,{children:"Response Type:"}),r.jsxs(We,{value:i.responseType,onChange:e=>v("responseType",e.target.value),children:[r.jsx("option",{value:"code",children:"code"}),r.jsx("option",{value:"code id_token",children:"code id_token"}),r.jsx("option",{value:"code token",children:"code token"}),r.jsx("option",{value:"code id_token token",children:"code id_token token"})]})]})]}),r.jsxs($e,{children:[r.jsxs(Le,{children:[r.jsx(Je,{children:"Response Mode:"}),r.jsxs(We,{value:i.responseMode,onChange:e=>v("responseMode",e.target.value),children:[r.jsx("option",{value:"fragment",children:"fragment"}),r.jsx("option",{value:"form_post",children:"form_post"}),r.jsx("option",{value:"query",children:"query"})]})]}),r.jsxs(Le,{children:[r.jsx(Je,{children:"Prompt:"}),r.jsxs(We,{value:i.prompt||"",onChange:e=>v("prompt",e.target.value||void 0),children:[r.jsx("option",{value:"",children:"None"}),r.jsx("option",{value:"login",children:"login"}),r.jsx("option",{value:"consent",children:"consent"}),r.jsx("option",{value:"select_account",children:"select_account"})]})]})]}),r.jsxs($e,{children:[r.jsxs(Le,{children:[r.jsx(Je,{children:"Login Hint:"}),r.jsx(Be,{type:"text",value:i.loginHint||"",onChange:e=>v("loginHint",e.target.value),placeholder:"Optional user hint"})]}),r.jsxs(Le,{children:[r.jsx(Je,{children:"Audience:"}),r.jsx(Be,{type:"text",value:i.audience||"",onChange:e=>v("audience",e.target.value),placeholder:"Optional audience"})]})]}),r.jsxs($e,{children:[r.jsxs(Le,{children:[r.jsx(Je,{children:"State:"}),r.jsx(Be,{type:"text",value:i.state||"",onChange:e=>v("state",e.target.value),placeholder:"Auto-generated if empty"})]}),r.jsxs(Le,{children:[r.jsx(Je,{children:"Nonce:"}),r.jsx(Be,{type:"text",value:i.nonce||"",onChange:e=>v("nonce",e.target.value),placeholder:"Required for id_token"})]})]}),i.responseType.includes("id_token")&&r.jsx($e,{children:r.jsxs(Le,{style:{gridColumn:"1 / -1"},children:[r.jsx(Je,{children:"Claims (JSON):"}),r.jsx(Ve,{value:i.claims||"",onChange:e=>v("claims",e.target.value),placeholder:'{"id_token": {"email": null, "email_verified": null}}'})]})})]}),r.jsx(p,{onCredentialsUpdated:()=>{setTimeout(()=>{const e=s();e&&a(r=>({...r,environmentId:e.environmentId||"",clientId:e.clientId||"",clientSecret:e.clientSecret||"",redirectUri:e.redirectUris?.[0]||r.redirectUri,scopes:e.scopes?.join(" ")||r.scopes}))},100)}}),r.jsxs(He,{children:[r.jsx(Ge,{variant:"primary",onClick:I,disabled:g,children:g?"Running...":"Test Full PAR Flow"}),r.jsx(Ge,{variant:"secondary",onClick:k,disabled:g,children:"Test PAR Request Only"}),r.jsx(Ge,{variant:"secondary",onClick:T,disabled:g||!u,children:"Test Auth URL Only"}),r.jsx(Ge,{variant:"secondary",onClick:()=>d([]),children:"Clear Results"})]})]}),u&&r.jsxs(Me,{children:[r.jsx(qe,{children:"Pushed Authorization Request URI"}),r.jsx(er,{children:u}),r.jsx("p",{style:{fontSize:"0.875rem",color:"#6b7280",marginTop:"0.5rem"},children:"This request_uri is valid for a limited time (typically 5-10 minutes) and can only be used once."})]}),h&&r.jsxs(Me,{children:[r.jsx(qe,{children:"Authorization URL"}),r.jsx(er,{children:h}),r.jsxs(He,{children:[r.jsx(Ge,{variant:"secondary",onClick:()=>navigator.clipboard.writeText(h),children:"Copy URL"}),r.jsx(Ge,{variant:"danger",onClick:()=>window.open(h,"_blank"),children:"Open URL (Redirect to PingOne)"})]})]}),r.jsxs(Xe,{children:[r.jsxs(qe,{children:["Test Results (",c.length,")"]}),c.map((e,n)=>r.jsxs(Ye,{success:e.success,children:[r.jsxs(Ze,{children:[r.jsxs("div",{style:{display:"flex",alignItems:"center"},children:[r.jsxs(Ke,{success:e.success,children:[e.success?"✅":"❌"," ",e.testName]}),r.jsx(rr,{children:"PAR"})]}),r.jsxs(Qe,{children:[e.timestamp.toLocaleTimeString()," (",e.duration,"ms)"]})]}),!e.success&&e.error&&r.jsxs("div",{style:{marginBottom:"1rem"},children:[r.jsx("strong",{children:"Error:"})," ",e.error]}),r.jsx("div",{style:{marginBottom:"0.5rem"},children:r.jsx("strong",{children:"Input:"})}),r.jsx(er,{children:JSON.stringify(e.input,null,2)}),r.jsx("div",{style:{marginBottom:"0.5rem"},children:r.jsx("strong",{children:"Output:"})}),r.jsx(er,{children:JSON.stringify(e.output,null,2)})]},n)),0===c.length&&r.jsx("div",{style:{textAlign:"center",color:"#6b7280",padding:"2rem"},children:"No test results yet. Configure your PingOne credentials and run PAR tests."})]})]})}},Symbol.toStringTag,{value:"Module"})),or=d.div`
	max-width: 800px;
	margin: 2rem auto;
	padding: 2rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`,sr=d.div`
	padding: 2rem;
	border-radius: 0.5rem;
	border-left: 4px solid
		${e=>"success"===e.status?"#10b981":"error"===e.status?"#ef4444":"#3b82f6"};
	background: ${e=>"success"===e.status?"#f0fdf4":"error"===e.status?"#fef2f2":"#eff6ff"};
`,ir=d.h1`
	color: #1f2937;
	margin-bottom: 1rem;
	font-size: 1.5rem;
`,ar=d.p`
	color: #374151;
	margin-bottom: 1.5rem;
	font-size: 1.1rem;
`,cr=d.div`
	margin-top: 1.5rem;
`,dr=d.div`
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`,lr=d.div`
	font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
	font-size: 0.75rem;
	color: #1f2937;
	background: #ffffff;
	padding: 0.75rem;
	border-radius: 0.25rem;
	border: 1px solid #d1d5db;
	word-break: break-all;
	margin-bottom: 1rem;
`,pr=d.button`
	padding: 0.75rem 1.5rem;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 0.375rem;
	font-weight: 500;
	cursor: pointer;
	transition: background 0.2s;

	&:hover {
		background: #2563eb;
	}
`,ur=Object.freeze(Object.defineProperty({__proto__:null,default:()=>{const n=a(),t=c(),[o,s]=e.useState("info"),[i,d]=e.useState("Processing callback..."),[l,p]=e.useState({});e.useEffect(()=>{const e=t.hash.slice(1),r=t.search.slice(1),n=new URLSearchParams(e||r),o={};for(const[t,s]of n.entries())o[t]=s;o.access_token||o.id_token||o.code?(s("success"),d("Test callback received successfully!"),p(o)):o.error?(s("error"),d(`Error: ${o.error_description||o.error}`),p(o)):(s("info"),d("No tokens or authorization code received in callback."))},[t]);const u=e=>{navigator.clipboard.writeText(e)};return r.jsx(or,{children:r.jsxs(sr,{status:o,children:[r.jsxs(ir,{children:["success"===o&&"✓ Test Callback Received","error"===o&&"✗ Callback Error","info"===o&&"ℹ Test Callback"]}),r.jsx(ar,{children:i}),Object.keys(l).length>0&&r.jsxs(cr,{children:[l.code&&r.jsxs("div",{children:[r.jsx(dr,{children:"Authorization Code"}),r.jsx(lr,{children:l.code}),r.jsx(pr,{onClick:()=>u(l.code),children:"Copy Code"})]}),l.access_token&&r.jsxs("div",{children:[r.jsx(dr,{children:"Access Token"}),r.jsx(lr,{children:l.access_token}),r.jsx(pr,{onClick:()=>u(l.access_token),children:"Copy Token"})]}),l.id_token&&r.jsxs("div",{children:[r.jsx(dr,{children:"ID Token"}),r.jsx(lr,{children:l.id_token}),r.jsx(pr,{onClick:()=>u(l.id_token),children:"Copy Token"})]}),l.refresh_token&&r.jsxs("div",{children:[r.jsx(dr,{children:"Refresh Token"}),r.jsx(lr,{children:l.refresh_token}),r.jsx(pr,{onClick:()=>u(l.refresh_token),children:"Copy Token"})]}),l.state&&r.jsxs("div",{children:[r.jsx(dr,{children:"State"}),r.jsx(lr,{children:l.state})]}),l.token_type&&r.jsxs("div",{children:[r.jsx(dr,{children:"Token Type"}),r.jsx(lr,{children:l.token_type})]}),l.expires_in&&r.jsxs("div",{children:[r.jsx(dr,{children:"Expires In"}),r.jsxs(lr,{children:[l.expires_in," seconds"]})]}),l.scope&&r.jsxs("div",{children:[r.jsx(dr,{children:"Scope"}),r.jsx(lr,{children:l.scope})]})]}),r.jsx("div",{style:{marginTop:"1.5rem"},children:r.jsx(pr,{onClick:()=>{n(-1)},children:"← Back to Test Page"})})]})})}},Symbol.toStringTag,{value:"Module"}));export{pe as A,F as I,De as M,tr as P,ur as T};
//# sourceMappingURL=pages-test-D87siE-7.js.map
