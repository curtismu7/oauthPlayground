import{a as e,j as n,k as r,m as o,aY as s,f as t}from"./react-vendor-HWZo9XlX.js";import{a as i}from"./styled-vendor-DGSsHzxd.js";import{f as a,k as c,d,e as l,J as u}from"./components-oauth-qq-maH2w.js";import{h as f,o as p}from"./components-credentials-T7jmF3zx.js";import{e as m}from"./components-flow-core-y1x-SJYd.js";import{u as h}from"./pages-ai-D2KhTcan.js";import{U as g}from"./pages-DE-6TDOE.js";import{aQ as x,h as b,l as j}from"./utils-lzKqcxFi.js";const w=i.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;i.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({theme:e})=>e.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({theme:e})=>e.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`;const k=i.div`
  background-color: #f0f8ff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 2rem;
`,I=i.div`
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
`,y=i.div`
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
    flex-shink: 0;
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
`,v=i.div`
  background-color: #f0f8ff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 2rem;
`;i.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`,i.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;

  ${({variant:e})=>"primary"===e?"\n        background-color: #3b82f6;\n        color: white;\n        &:hover:not(:disabled) {\n          background-color: #2563eb;\n        }\n        &:disabled {\n          background-color: #9ca3af;\n          cursor: not-allowed;\n        }\n      ":"\n        background-color: #f3f4f6;\n        color: #374151;\n        &:hover:not(:disabled) {\n          background-color: #e5e7eb;\n        }\n        &:disabled {\n          background-color: #f3f4f6;\n          color: #9ca3af;\n          cursor: not-allowed;\n        }\n      "}
`,i.div`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &.idle {
    background-color: #f3f4f6;
    color: #6b7280;
  }

  &.loading {
    background-color: #dbeafe;
    color: #1e40af;
  }

  &.success {
    background-color: #d1fae5;
    color: #065f46;
  }

  &.error {
    background-color: #fee2e2;
    color: #991b1b;
  }
`;const S=i.div`
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #991b1b;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    flex-shink: 0;
    margin-top: 0.1rem;
  }
`;i.div`
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid ${({$borderColor:e})=>e||"#374151"};
  background-color: ${({$backgroundColor:e})=>e||"#1f2937"};
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: visible;
  max-width: 100%;
  color: #f9fafb;

  h4 {
    margin: 0 0 0.5rem 0;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: #f9fafb;
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
    color: #f9fafb;
  }
`;const U=i.div`
  margin: 2rem 0;
  border: 1px solid ${({theme:e})=>e.colors.gray200};
  border-radius: 0.5rem;
  overflow: hidden;
`,T=i.div`
  background-color: #1f2937;
  border-bottom: 1px solid #374151;
  padding: 1.5rem;
  color: #f9fafb;

  h3 {
    margin: 0 0 1rem 0;
    color: #f9fafb;
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`,C=i.div`
  background-color: #1f2937;
  padding: 1.5rem;
  color: #f9fafb;

  h3 {
    margin: 0 0 1rem 0;
    color: #f9fafb;
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`,E=i.pre`
  background-color: ${({theme:e})=>e.colors.gray900};
  color: ${({theme:e})=>e.colors.gray100};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid ${({theme:e})=>e.colors.gray800};
  position: relative;
  white-space: pre-wrap;
`,P=i.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`,_=i.div`
  background-color: white;
  border: 1px solid ${({theme:e})=>e.colors.gray200};
  border-radius: 0.375rem;
  padding: 1.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: ${({theme:e})=>e.colors.gray800};
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
`,$=i.span`
  color: #059669;
  font-weight: 600;
`,q=i.span`
  color: #dc2626;
`,O=i.span`
  color: #16a34a;
`,R=i.span`
  color: #ea580c;
`,A=i.span`
  color: #6b7280;
  font-style: italic;
`,z=()=>{const{tokens:i,config:u,updateTokens:j}=a();h();const[z,D]=e.useState(null),L=e.useCallback(()=>{const e=["pingone_playground_tokens","oauth_tokens","access_token","tokens"];for(const r of e){const e=localStorage.getItem(r);if(e)try{let n;if(n="access_token"===r?{access_token:e}:JSON.parse(e),n.access_token)return D(n),i?.access_token||j(n),n}catch(n){}}return D(null),null},[i,j]);e.useEffect(()=>{L()},[L]),e.useEffect(()=>{const e=e=>{(e.key?.includes("token")||"pingone_playground_tokens"===e.key)&&L()};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[L]);const F=e.useCallback(()=>{L()},[L]),[N,M]=e.useState("idle"),[G,B]=e.useState(0),[J,V]=e.useState(null),[H,Y]=e.useState(null),[W,Q]=e.useState(""),[X,K]=e.useState(null),[Z,ee]=e.useState(null),[ne,re]=e.useState({}),[oe,se]=e.useState(new Set),[te,ie]=e.useState([]),[ae,ce]=e.useState(!1),de=(e,r=0)=>{const o="  ".repeat(r),s=[];if(null===e)return s.push(n.jsx(A,{children:"null"})),s;if("string"==typeof e)return s.push(n.jsxs(q,{children:['"',e,'"']})),s;if("number"==typeof e)return s.push(n.jsx(O,{children:e})),s;if("boolean"==typeof e)return s.push(n.jsx(R,{children:e.toString()})),s;if(Array.isArray(e))return s.push("[\n"),e.forEach((n,t)=>{s.push(`${o}  `),s.push(...de(n,r+1)),t<e.length-1&&s.push(","),s.push("\n")}),s.push(`${o}]`),s;if("object"==typeof e){s.push("{\n");const t=Object.keys(e);return t.forEach((i,a)=>{s.push(`${o}  `),s.push(n.jsxs($,{children:['"',i,'"']})),s.push(": "),s.push(...de(e[i],r+1)),a<t.length-1&&s.push(","),s.push("\n")}),s.push(`${o}}`),s}return s},le=W?`${W.slice(0,16)}...${W.slice(-8)}`:"",ue=[...ae?[{title:"Obtain Access Token",description:"First, obtain an access token through any OAuth flow with openid scope",code:"// Access token obtained from OAuth flow\nconst accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';\n\n// This token contains:\n// - User identity information\n// - Granted scopes (including 'openid')\n// - Expiration time\n// - Token type (Bearer)",execute:()=>{const e=i?.access_token?i:z;if(!e?.access_token)return void Y("No access token available. Complete an OAuth flow with openid scope first, or check if tokens are stored in localStorage.");if(x(e.access_token))return void Y("Access token is expired. Please sign in again.");Q(e.access_token);const n={token:e.access_token,tokenInfo:{type:e.token_type,scopes:e.scope,expires:e.expires_at?new Date(e.expires_at):null}};return re(e=>({...e,0:n})),se(e=>new Set(e).add(0)),n}}]:[],{title:"Prepare UserInfo Request",description:ae?"Prepare GET request to UserInfo endpoint with Bearer token":"Prepare GET request to UserInfo endpoint (no authentication)",code:ae?`// UserInfo endpoint URL (from OpenID Connect discovery)\nconst userInfoUrl = '${u?.userInfoEndpoint||"https://auth.pingone.com/{envId}/as/userinfo"}';\n\n// Prepare request headers with Bearer token\nconst headers = {\n  'Authorization': 'Bearer ${le}',\n  'Accept': 'application/json',\n  'Content-Type': 'application/json'\n};\n\n// Optional: Include DPoP proof for enhanced security\n// headers['DPoP'] = generateDPoPProof(userInfoUrl, 'GET', accessToken);`:`// UserInfo endpoint URL (from OpenID Connect discovery)\nconst userInfoUrl = '${u?.userInfoEndpoint||"https://auth.pingone.com/{envId}/as/userinfo"}';\n\n// Prepare request headers (no authentication)\nconst headers = {\n  'Accept': 'application/json',\n  'Content-Type': 'application/json'\n};\n\n// For unprotected UserInfo endpoints, no Authorization header needed`,execute:()=>{if(!u?.pingone?.userInfoEndpoint)return void Y("UserInfo endpoint is not configured. Check Configuration page.");const e=u.pingone.userInfoEndpoint.replace("{envId}",u.pingone.environmentId),n={Accept:"application/json","Content-Type":"application/json"};if(ae){if(!W)return void Y("Access token not available. Please execute previous step first.");n.Authorization=`Bearer ${W}`}K({url:e,headers:n,method:"GET"});const r={url:e,headers:n,method:"GET",authenticated:ae};return re(e=>({...e,[ae?1:0]:r})),se(e=>new Set(e).add(ae?1:0)),r}},{title:"Make UserInfo API Call",description:ae?"Send authenticated request to UserInfo endpoint":"Send request to UserInfo endpoint (no authentication)",code:ae?"// Make authenticated GET request\nconst response = await fetch(userInfoUrl, {\n  method: 'GET',\n  headers: headers,\n  credentials: 'same-origin' // For CORS considerations\n});\n\n// Handle response\nif (!response.ok) {\n  if (response.status === 401) {\n    // Token expired or invalid\n    throw new Error('Access token expired or invalid');\n  }\n  if (response.status === 403) {\n    // Insufficient scope\n    throw new Error('Access token does not have openid scope');\n  }\n  throw new Error('UserInfo request failed');\n}\n\nconst userInfo = await response.json();":"// Make unauthenticated GET request\nconst response = await fetch(userInfoUrl, {\n  method: 'GET',\n  headers: headers,\n  credentials: 'same-origin' // For CORS considerations\n});\n\n// Handle response\nif (!response.ok) {\n  if (response.status === 401) {\n    // Endpoint requires authentication\n    throw new Error('Endpoint requires authentication. Try enabling authentication mode.');\n  }\n  if (response.status === 403) {\n    // Access forbidden\n    throw new Error('Access forbidden. Check endpoint permissions.');\n  }\n  throw new Error('UserInfo request failed');\n}\n\nconst userInfo = await response.json();",execute:async()=>{if(!X?.url||ae&&!W)Y("Request details not available. Please execute previous steps first.");else try{const e=await fetch(X.url,{method:X.method,headers:X.headers,credentials:"same-origin"});if(!e.ok){if(ae&&401===e.status)throw new Error("Access token expired or invalid");if(ae&&403===e.status)throw new Error("Access token does not have openid scope");if(!ae&&401===e.status)throw new Error("Endpoint requires authentication. Try enabling authentication mode.");if(403===e.status)throw new Error("Access forbidden. Check endpoint permissions.");throw new Error(`UserInfo request failed: ${e.status} ${e.statusText}`)}const n=await e.json();V(n);const r=ae?2:1,o={response:n,status:e.status,headers:Object.fromEntries(e.headers.entries()),authenticated:ae};return re(e=>({...e,[r]:o})),se(e=>new Set(e).add(r)),o}catch(e){const n=e instanceof Error?e.message:"Unknown error";Y(`Failed to call UserInfo endpoint: ${n}`)}}},{title:"Process UserInfo Response",description:"Handle and validate the user information returned",code:"// Validate response structure\nif (!userInfo.sub) {\n  throw new Error('Invalid UserInfo response: missing subject');\n}\n\n// Standard OpenID Connect claims\nconst user = {\n  id: userInfo.sub,                    // Subject identifier\n  name: userInfo.name,                 // Full name\n  givenName: userInfo.given_name,      // First name\n  familyName: userInfo.family_name,    // Last name\n  email: userInfo.email,               // Email address\n  emailVerified: userInfo.email_verified, // Email verification status\n  picture: userInfo.picture,           // Profile picture URL\n  locale: userInfo.locale,             // User locale\n  updatedAt: userInfo.updated_at       // Last update timestamp\n};\n\n// Store user information securely\n// Avoid storing tokens; store minimal, non-sensitive user profile if needed\nlocalStorage.setItem('user_profile', JSON.stringify({ id: user.id, name: user.name, email: user.email }));\n\n// Use user information in your application\nconsole.log('Welcome, ' + user.name + '!');",execute:()=>{if(!J)return void Y("No user information received. Please execute the API call first.");if(!J.sub)return void Y("Invalid UserInfo response: missing subject claim");const e={userInfo:J,validation:{hasSubject:!!J.sub,claims:Object.keys(J)}};return re(n=>({...n,3:e})),se(e=>new Set(e).add(3)),M("success"),e}}];return n.jsxs(w,{children:[n.jsx(c,{flowType:"oidc",customConfig:{flowType:"oidc",title:"User Info",subtitle:"Learn how to retrieve user profile information using the UserInfo endpoint. This endpoint provides detailed user claims and supports both authenticated and unauthenticated requests."}}),n.jsx(f,{flowType:"userinfo",onCredentialsChange:e=>{}}),n.jsxs(k,{children:[n.jsx(d,{children:n.jsx("h2",{children:"UserInfo Endpoint Overview"})}),n.jsxs(l,{children:[n.jsxs(I,{children:[n.jsx("h2",{children:"What is the UserInfo Endpoint?"}),n.jsxs("p",{children:["The UserInfo endpoint in OpenID Connect allows clients to retrieve additional information about the authenticated user beyond what's included in the ID token. Unlike other OAuth endpoints, UserInfo can be either ",n.jsx("strong",{children:"protected"})," or",n.jsx("strong",{children:"unprotected"})," depending on your implementation."]}),n.jsxs("p",{children:[n.jsx("strong",{children:"How it works:"})," You can make a GET request to the UserInfo endpoint to get detailed user profile information including name, email, profile picture, and other claims. This can be done with or without authentication depending on your server's configuration."]}),n.jsxs("div",{style:{marginTop:"1rem",padding:"1rem",backgroundColor:"#f8f9fa",borderRadius:"6px",border:"1px solid #dee2e6"},children:[n.jsx("h3",{style:{margin:"0 0 0.5rem 0",fontSize:"1rem",color:"#495057"},children:"Authentication Mode"}),n.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",cursor:"pointer"},children:[n.jsx("input",{type:"checkbox",checked:ae,onChange:e=>ce(e.target.checked),style:{margin:0}}),n.jsx("span",{children:"Use Bearer token authentication"})]}),n.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.9rem",color:"#6c757d"},children:ae?"Will include Bearer token in request (requires valid access token)":"Will make unauthenticated request (endpoint must be unprotected)"})]})]}),n.jsxs(y,{children:[n.jsx(r,{size:20}),n.jsxs("div",{children:[n.jsx("h3",{children:"Perfect For"}),n.jsx("p",{children:"Getting detailed user profiles, email addresses, profile pictures, and other user attributes beyond the basic ID token claims."})]})]})]})]}),n.jsxs(v,{children:[n.jsx(d,{children:n.jsx("h2",{children:"Interactive Demo"})}),n.jsxs(l,{children:[n.jsx(m,{steps:te.length>0?te:ue,onStart:()=>{M("loading"),B(0),Y(null),V(null),K(null),re({}),se(new Set),ie([]),ie([...ue])},onReset:()=>{M("idle"),B(0),V(null),Y(null),Q(""),K(null),re({}),se(new Set)},status:N,currentStep:G,onStepChange:B,onStepResult:(e,n)=>{re(r=>({...r,[e]:n})),ie(r=>{const o=[...r];return o[e]&&(o[e]={...o[e],result:n}),o})},disabled:!u||ae&&(!i?.access_token||x(i.access_token)),title:"UserInfo Flow",configurationButton:n.jsx(p,{flowType:"userinfo"})}),!u&&n.jsxs(S,{children:[n.jsx(o,{}),n.jsx("strong",{children:"Configuration Required:"})," Please configure your PingOne settings in the Configuration page before running this demo.",n.jsx("br",{}),n.jsx("button",{onClick:()=>{window.location.reload()},style:{marginTop:"10px",padding:"8px 16px",backgroundColor:"#007bff",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Refresh Page"})]}),u&&ae&&(!i?.access_token||i?.access_token&&x(i.access_token))&&n.jsxs(n.Fragment,{children:[n.jsxs("div",{style:{marginBottom:"1rem",padding:"1rem",backgroundColor:"#f0f9ff",border:"2px solid #0ea5e9",borderRadius:"0.5rem",fontSize:"0.875rem"},children:[n.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#0c4a6e"},children:"Enhanced Token Detection System"}),n.jsxs("div",{style:{color:"#0c4a6e",lineHeight:"1.6"},children:[n.jsx("strong",{children:" Auth Context Tokens:"})," ",i?" Available":" Not available",n.jsx("br",{}),n.jsx("strong",{children:" Local Storage Tokens:"})," ",z?" Available":" Not available",n.jsx("br",{}),n.jsx("strong",{children:" Active Access Token:"})," ",W?`${W.substring(0,20)}...`:"None",n.jsx("br",{}),n.jsx("strong",{children:" Token Source:"})," ",i?.access_token?"Auth Context":z?.access_token?"Local Storage":"None",n.jsx("br",{}),n.jsx("strong",{children:" Config:"})," ",u?" Loaded":" Not loaded",n.jsx("br",{}),n.jsx("strong",{children:" Token expired:"})," ",W?x(W)?" Yes":" No":"N/A",n.jsx("br",{}),n.jsx("strong",{children:" Scope:"})," ",i?.scope||z?.scope||"None",n.jsx("br",{}),n.jsx("strong",{children:" localStorage keys:"})," ",Object.keys(localStorage).filter(e=>e.includes("token")||e.includes("pingone")).join(", ")||"None"]})]}),n.jsxs(S,{children:[n.jsx(o,{}),n.jsx("strong",{children:"Sign-in Required:"})," Authentication mode is enabled. Complete an OAuth login with openid scope to obtain a valid access token before calling UserInfo.",n.jsx("br",{}),n.jsx("br",{}),n.jsx("strong",{children:"To get tokens:"}),n.jsxs("ul",{style:{marginTop:"10px",paddingLeft:"20px"},children:[n.jsx("li",{children:"Go to any OAuth flow page (e.g., Authorization Code Flow)"}),n.jsx("li",{children:"Complete the OAuth flow to get tokens"}),n.jsx("li",{children:"Return here to use the UserInfo endpoint"})]}),n.jsx("br",{}),n.jsxs("div",{style:{display:"flex",gap:"10px",flexWrap:"wrap"},children:[n.jsx("button",{onClick:()=>window.location.href="/flows/authorization-code",style:{padding:"8px 16px",backgroundColor:"#28a745",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"14px"},children:"Go to Authorization Code Flow"}),n.jsx("button",{onClick:()=>window.location.href="/flows/implicit",style:{padding:"8px 16px",backgroundColor:"#17a2b8",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"14px"},children:"Go to Implicit Flow"}),n.jsx("button",{onClick:()=>{b.showSuccess("Debug information logged to browser console - check developer tools")},style:{padding:"8px 16px",backgroundColor:"#6c757d",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"14px"},children:"Debug Info"}),n.jsx("button",{onClick:F,style:{padding:"8px 16px",backgroundColor:"#ffc107",color:"#212529",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"14px"},children:"Refresh Token Detection"}),n.jsx("button",{onClick:()=>{window.location.reload()},style:{padding:"8px 16px",backgroundColor:"#dc3545",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"14px"},children:"Force Refresh Page"})]})]})]}),H&&n.jsxs(S,{children:[n.jsx(o,{}),n.jsx("strong",{children:"Error:"})," ",H]}),W&&g.showTokens({access_token:W,token_type:"Bearer"},"oauth","userinfo-flow",{showCopyButtons:!0,showDecodeButtons:!0}),(X||J)&&n.jsxs(U,{children:[X&&n.jsxs(T,{children:[n.jsxs("h3",{children:[n.jsx(s,{}),"Request Details"]}),n.jsxs(E,{children:[n.jsx(P,{onClick:()=>(async e=>{try{await navigator.clipboard.writeText(e)}catch(n){}})(JSON.stringify(X,null,2)),children:"Copy"}),n.jsx("strong",{children:"URL:"})," ",X.url,n.jsx("br",{}),n.jsx("strong",{children:"Method:"})," ",X.method,n.jsx("br",{}),n.jsx("strong",{children:"Headers:"}),n.jsx("br",{}),Object.entries(X.headers).map(([e,r])=>n.jsxs("div",{style:{marginLeft:"1rem"},children:[e,": ","Authorization"===e?"Bearer [REDACTED]":r]},e))]})]}),J&&n.jsxs(C,{children:[n.jsxs("h3",{children:[n.jsx(t,{}),"Response Data"]}),n.jsx(_,{children:de(J)}),n.jsxs("div",{style:{marginTop:"1rem",fontSize:"0.9rem",color:"#6b7280"},children:[n.jsx("strong",{children:"Standard Claims:"}),n.jsx("br",{})," ",n.jsx("strong",{children:"sub:"})," Subject identifier (",J?.sub||"",")",n.jsx("br",{})," ",n.jsx("strong",{children:"name:"})," Full name (",J?.name||"",")",n.jsx("br",{})," ",n.jsx("strong",{children:"email:"})," Email address (",J?.email||"",")",n.jsx("br",{})," ",n.jsx("strong",{children:"email_verified:"})," Email verification status (",J?.email_verified?"Verified":"Unverified",")",n.jsx("br",{})," ",n.jsx("strong",{children:"updated_at:"})," Last update (",J?.updated_at?new Date(1e3*J.updated_at).toLocaleString():"",")"]})]})]})]})]})]})},D=i.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`,L=i.h1`
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`,F=i.p`
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`,N=i.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`,M=i.div`
  margin-bottom: 1rem;
`,G=i.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
`,B=i.input`
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
`,J=i.textarea`
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
`;i.select`
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
`;const V=i.button`
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
`,H=i.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
`,Y=i.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
`,W=i.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #991b1b;
`,Q=i.div`
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #1e40af;
`,X=i.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`,K=i.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`,Z=i.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`,ee=i.div`
  display: flex;
  flex-direction: column;
`,ne=i.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`,re=i.span`
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
  word-break: break-all;
`,oe=({credentials:r})=>{const[o,s]=e.useState(0),[t,i]=e.useState("idle"),[a,c]=e.useState({clientId:r?.clientId||"",clientSecret:r?.clientSecret||"",environmentId:r?.environmentId||"",accessToken:"",scope:"openid profile email",claims:'{"userinfo": {"email": null, "phone_number": null, "address": null}}',uiLocales:"en",includeClaims:!0}),[d,l]=e.useState(null),[p,h]=e.useState(null),[g,x]=e.useState(null),b=[{id:"step-1",title:"Configure UserInfo POST Settings",description:"Set up your OAuth client for UserInfo POST requests.",code:`// UserInfo POST Configuration\nconst userInfoConfig = {\n  clientId: '${a.clientId}',\n  clientSecret: '${a.clientSecret}',\n  environmentId: '${a.environmentId}',\n  accessToken: '${a.accessToken}',\n  scope: '${a.scope}',\n  claims: ${a.claims},\n  uiLocales: '${a.uiLocales}',\n  includeClaims: ${a.includeClaims}\n};\n\nconsole.log('UserInfo POST configured:', userInfoConfig);`,execute:async()=>{j.info("UserInfoPostFlow","Configuring UserInfo POST settings")}},{id:"step-2",title:"Prepare UserInfo POST Request",description:"Build the POST request for UserInfo endpoint.",code:`// Prepare UserInfo POST Request\nconst userInfoUrl = \`https://auth.pingone.com/\${environmentId}/as/userinfo\`;\n\nconst formData = new FormData();\nformData.append('access_token', '${a.accessToken}');\nformData.append('client_id', '${a.clientId}');\nformData.append('client_secret', '${a.clientSecret}');\nformData.append('scope', '${a.scope}');\nformData.append('claims', '${a.claims}');\nformData.append('ui_locales', '${a.uiLocales}');\n\nconsole.log('UserInfo POST URL:', userInfoUrl);\nconsole.log('Form data prepared for POST request');`,execute:async()=>{j.info("UserInfoPostFlow","Preparing UserInfo POST request")}},{id:"step-3",title:"Submit UserInfo POST Request",description:"Submit the POST request to the UserInfo endpoint.",code:"// Submit UserInfo POST Request\ntry {\n  const response = await fetch(userInfoUrl, {\n    method: 'POST',\n    body: formData,\n    headers: {\n      'Accept': 'application/json',\n      'Content-Type': 'application/x-www-form-urlencoded'\n    }\n  });\n  \n  if (response.ok) {\n    const userInfo = await response.json();\n    console.log('UserInfo received:', userInfo);\n    \n    // Store user info\n    localStorage.setItem('user_info', JSON.stringify(userInfo));\n  } else {\n    const error = await response.text();\n    throw new Error(`UserInfo request failed: ${response.status} - ${error}`);\n  }\n} catch (error) {\n  console.error('UserInfo error:', error);\n  throw error;\n}",execute:async()=>{j.info("UserInfoPostFlow","Submitting UserInfo POST request"),i("loading");try{if(!a.accessToken||!a.environmentId){const e=[];a.accessToken||e.push("Access Token"),a.environmentId||e.push("Environment ID");const n=`Missing required fields: ${e.join(" and ")}. Please fill in all required fields.`;throw new Error(n)}const e=`https://auth.pingone.com/${a.environmentId}/as/userinfo`,n=await fetch("/api/pingone/userinfo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userInfoEndpoint:e,accessToken:a.accessToken})});if(!n.ok){const e=await n.json();throw new Error(e.message||e.error_description||`UserInfo request failed: ${n.status} ${n.statusText}`)}const r=await n.json();l({success:!0,message:"UserInfo retrieved successfully",userInfo:r,method:"GET",endpoint:e}),x(r),i("success")}catch(e){const n=e instanceof Error?e.message:"Unknown error";throw h(n),i("error"),e}}},{id:"step-4",title:"Process UserInfo Response",description:"Process and validate the UserInfo response.",code:"// Process UserInfo Response\nif (userInfo) {\n  // Validate required claims\n  const requiredClaims = ['sub', 'name', 'email'];\n  const missingClaims = requiredClaims.filter(claim => !userInfo[claim]);\n  \n  if (missingClaims.length > 0) {\n    console.warn('Missing required claims:', missingClaims);\n  }\n  \n  // Extract user information\n  const userData = {\n    id: userInfo.sub,\n    name: userInfo.name,\n    email: userInfo.email,\n    emailVerified: userInfo.email_verified,\n    phone: userInfo.phone_number,\n    phoneVerified: userInfo.phone_number_verified,\n    address: userInfo.address,\n    locale: userInfo.locale,\n    lastUpdated: new Date(userInfo.updated_at * 1000)\n  };\n  \n  console.log('Processed user data:', userData);\n  \n  // Store processed user data\n  localStorage.setItem('user_data', JSON.stringify(userData));\n}",execute:async()=>{if(j.info("UserInfoPostFlow","Processing UserInfo response"),g){const e={id:g.sub,name:g.name,email:g.email,emailVerified:g.email_verified,phone:g.phone_number,phoneVerified:g.phone_number_verified,address:g.address,locale:g.locale,lastUpdated:new Date(1e3*g.updated_at)};l(n=>({...n,processedUserData:e}))}}},{id:"step-5",title:"Handle UserInfo Errors",description:"Handle common UserInfo request errors and edge cases.",code:"// Handle UserInfo Errors\nconst handleUserInfoError = (error) => {\n  if (error.status === 401) {\n    console.error('Unauthorized: Invalid or expired access token');\n    // Redirect to re-authentication\n    window.location.href = '/login';\n  } else if (error.status === 403) {\n    console.error('Forbidden: Insufficient scope or permissions');\n    // Request additional scopes\n    requestAdditionalScopes();\n  } else if (error.status === 429) {\n    console.error('Rate limited: Too many requests');\n    // Implement exponential backoff\n    setTimeout(() => retryUserInfoRequest(), 5000);\n  } else {\n    console.error('UserInfo request failed:', error);\n    // Show user-friendly error message\n    showErrorMessage('Failed to retrieve user information. Please try again.');\n  }\n};\n\n// Retry logic with exponential backoff\nconst retryUserInfoRequest = async (retryCount = 0) => {\n  const maxRetries = 3;\n  const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s\n  \n  if (retryCount < maxRetries) {\n    setTimeout(async () => {\n      try {\n        await fetchUserInfo();\n      } catch (error) {\n        retryUserInfoRequest(retryCount + 1);\n      }\n    }, delay);\n  } else {\n    console.error('Max retries exceeded for UserInfo request');\n  }\n};",execute:async()=>{j.info("UserInfoPostFlow","UserInfo error handling implemented")}}],w=e.useCallback(e=>{s(e),i("idle"),l(null),h(null)},[]),k=e.useCallback((e,n)=>{j.info("UserInfoPostFlow",`Step ${e+1} completed`,n)},[]);return n.jsxs(D,{children:[n.jsx(L,{children:"UserInfo POST Flow"}),n.jsx(F,{children:"This flow demonstrates the UserInfo endpoint using POST requests. The UserInfo endpoint allows clients to retrieve information about the authenticated user using their access token."}),n.jsxs(Q,{children:[n.jsx("h4",{children:" UserInfo POST Benefits"}),n.jsx("p",{children:"The UserInfo POST method allows for more complex requests with larger payloads, including custom claims and additional parameters. It's particularly useful when you need to request specific user information or when dealing with sensitive data that shouldn't be exposed in URL parameters."})]}),n.jsx(f,{flowType:"userinfo-post",onCredentialsChange:e=>{c(n=>({...n,clientId:e.clientId||n.clientId,clientSecret:e.clientSecret||n.clientSecret,environmentId:e.environmentId||n.environmentId}))}}),n.jsx(m,{steps:b,currentStep:o,onStepChange:w,onStepResult:k,onStart:()=>i("loading"),onReset:()=>{s(0),i("idle"),l(null),h(null),x(null)},status:t,disabled:"loading"===t,title:"UserInfo POST Flow Steps"}),g&&n.jsxs(X,{children:[n.jsx(K,{children:"User Information"}),n.jsxs(Z,{children:[n.jsxs(ee,{children:[n.jsx(ne,{children:"User ID"}),n.jsx(re,{children:g.sub})]}),n.jsxs(ee,{children:[n.jsx(ne,{children:"Name"}),n.jsx(re,{children:g.name})]}),n.jsxs(ee,{children:[n.jsx(ne,{children:"Email"}),n.jsx(re,{children:g.email})]}),n.jsxs(ee,{children:[n.jsx(ne,{children:"Email Verified"}),n.jsx(re,{children:g.email_verified?"Yes":"No"})]}),n.jsxs(ee,{children:[n.jsx(ne,{children:"Phone"}),n.jsx(re,{children:g.phone_number||"Not provided"})]}),n.jsxs(ee,{children:[n.jsx(ne,{children:"Phone Verified"}),n.jsx(re,{children:g.phone_number_verified?"Yes":"No"})]}),n.jsxs(ee,{children:[n.jsx(ne,{children:"Locale"}),n.jsx(re,{children:g.locale})]}),n.jsxs(ee,{children:[n.jsx(ne,{children:"Last Updated"}),n.jsx(re,{children:g.updated_at?new Date("number"==typeof g.updated_at?1e3*g.updated_at:g.updated_at).toLocaleString():"Not available"})]})]})]}),d&&n.jsxs(Y,{children:[n.jsx("h4",{children:"Response:"}),n.jsx(H,{children:n.jsx(u,{data:d})})]}),p&&n.jsxs(W,{children:[n.jsx("h4",{children:"Error:"}),n.jsx("p",{children:p})]}),n.jsxs(N,{children:[n.jsx("h3",{children:"Manual UserInfo Configuration"}),n.jsx("p",{children:"You can also manually configure the UserInfo POST request:"}),n.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"},children:[n.jsxs(M,{children:[n.jsx(G,{children:"Access Token"}),n.jsx(B,{type:"text",value:a.accessToken,onChange:e=>c(n=>({...n,accessToken:e.target.value})),placeholder:"Enter access token"})]}),n.jsxs(M,{children:[n.jsx(G,{children:"Client ID"}),n.jsx(B,{type:"text",value:a.clientId,onChange:e=>c(n=>({...n,clientId:e.target.value}))})]}),n.jsxs(M,{children:[n.jsx(G,{children:"Scope"}),n.jsx(B,{type:"text",value:a.scope,onChange:e=>c(n=>({...n,scope:e.target.value}))})]}),n.jsxs(M,{children:[n.jsx(G,{children:"UI Locales"}),n.jsx(B,{type:"text",value:a.uiLocales,onChange:e=>c(n=>({...n,uiLocales:e.target.value}))})]})]}),n.jsxs(M,{children:[n.jsx(G,{children:"Claims (JSON)"}),n.jsx(J,{value:a.claims,onChange:e=>c(n=>({...n,claims:e.target.value})),placeholder:'{"userinfo": {"email": null, "phone_number": null}}'})]}),n.jsx(V,{$variant:"primary",onClick:async()=>{try{if(i("loading"),h(null),!a.accessToken||!a.environmentId){const e=[];a.accessToken||e.push("Access Token"),a.environmentId||e.push("Environment ID");const n=`Missing required fields: ${e.join(" and ")}. Please fill in all required fields.`;throw new Error(n)}const e=`https://auth.pingone.com/${a.environmentId}/as/userinfo`,n=await fetch("/api/pingone/userinfo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userInfoEndpoint:e,accessToken:a.accessToken})});if(!n.ok){const e=await n.json();throw new Error(e.message||e.error_description||`UserInfo request failed: ${n.status} ${n.statusText}`)}const r=await n.json();l({success:!0,message:"UserInfo retrieved successfully",userInfo:r,method:"GET",endpoint:e}),x(r),i("success")}catch(e){const n=e instanceof Error?e.message:"Unknown error";h(n),i("error")}},children:"Request UserInfo"})]})]})};export{oe as U,z as a};
//# sourceMappingURL=oauth-flows-userinfo-09E7sYS1.js.map
