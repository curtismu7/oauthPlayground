import{a as e,j as r,I as o,v as s,p as t,ah as n,e as i,F as a,h as d}from"./react-vendor-HWZo9XlX.js";import{a as l}from"./styled-vendor-DGSsHzxd.js";import{T as c,a as h}from"./v8u-services-CviCpCEt.js";import"./vendor-CvVeuJe7.js";import"./utils-lzKqcxFi.js";import"./components-credentials-T7jmF3zx.js";import"./components-oauth-qq-maH2w.js";import"./components-flow-core-y1x-SJYd.js";import"./components-token-uXxDPBqK.js";import"./v8-services-DHsPM8a2.js";import"./v8-components-8swtZwHb.js";import"./v8-utils-BU6AoW1l.js";import"./v8u-components-COnDGHJS.js";import"./oauth-flows-par-DTJ0aZ64.js";import"./components-oauth-par-B-NhQsyD.js";import"./pages-DE-6TDOE.js";import"./pages-ai-D2KhTcan.js";import"./components-oauth-authorize-sao_-EgS.js";import"./components-oauth-discovery-DYbdhNwI.js";import"./pages-pingone-BLdy8FiO.js";import"./oauth-flows-authcode-ltS0AxHA.js";import"./oauth-flows-BoQiEZ27.js";import"./oauth-flows-device-CMULWbHZ.js";import"./components-oauth-client-BhjYl9xl.js";import"./oauth-flows-implicit-BlAJpg9o.js";import"./components-flow-BH3Bx-YA.js";import"./components-steps-BQ6HbS5x.js";import"./components-ui-DbX9aVva.js";import"./pages-docs-nYnYMLbe.js";import"./v8-hooks-B7CjPGrP.js";import"./v8-flows-CbgB_G0p.js";const m=l.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`,u=l.div`
  margin-bottom: 2rem;
  text-align: center;
`,p=l.h1`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`,f=l.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`,x=l.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
`,g=l.div`
  position: relative;
  flex: 1;
  min-width: 300px;
`,j=l.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,b=l.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
`,v=l.select`
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`,w=l.button`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${e=>"primary"===e.$variant?"\n          background: #3b82f6;\n          border-color: #3b82f6;\n          color: white;\n          \n          &:hover {\n            background: #2563eb;\n            border-color: #2563eb;\n          }\n        ":"\n          background: white;\n          border-color: #e2e8f0;\n          color: #64748b;\n          \n          &:hover {\n            background: #f8fafc;\n            border-color: #cbd5e1;\n            color: #475569;\n          }\n        "}
`,k=l.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`,y=l.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`,$=l.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
`,z=l.div`
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,S=l.div`
  display: grid;
  gap: 1.5rem;
`,A=l.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
`,C=l.div`
  padding: 1rem 1.5rem;
  background: ${e=>{switch(e.$method){case"POST":return"#dcfce7";case"GET":return"#dbeafe";case"DELETE":return"#fee2e2";default:return"#f3f4f6"}}};
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`,T=l.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${e=>{switch(e.$method){case"POST":return"#16a34a";case"GET":return"#2563eb";case"DELETE":return"#dc2626";default:return"#6b7280"}}};
  color: white;
`,R=l.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
`,_=l.div`
  padding: 1.5rem;
`,B=l.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`,F=l.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,I=l.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: ${e=>e.$expanded?"none":"200px"};
  overflow-y: ${e=>e.$expanded?"visible":"auto"};
`,O=l.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0;
  margin-top: 0.5rem;
  
  &:hover {
    text-decoration: underline;
  }
`,E=l.div`
  background: ${e=>e.$status>=200&&e.$status<300?"#f0fdf4":e.$status>=400?"#fef2f2":"#f8fafc"};
  border: 1px solid ${e=>e.$status>=200&&e.$status<300?"#86efac":e.$status>=400?"#fecaca":"#e2e8f0"};
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;
`,L=l.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${e=>e.$status>=200&&e.$status<300?"#16a34a":e.$status>=400?"#dc2626":"#6b7280"};
  color: white;
  margin-bottom: 0.5rem;
  display: inline-block;
`,D=l.div`
  font-size: 0.75rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`,M=l.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`,P=l.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid #0ea5e9;
`,U=l.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`,q=l.div`
  font-weight: 600;
  color: #0c4a6e;
  font-size: 0.875rem;
`,G=l.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  color: #64748b;
  word-break: break-all;
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
`,W=l.div`
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.5rem;
`,H=l.div`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;l(H)`
  background: #dbeafe;
  color: #1e40af;
`;const N=l(H)`
  background: #fef3c7;
  color: #92400e;
`,V=()=>{const[l,H]=e.useState([]),[V,Y]=e.useState([]),[J,K]=e.useState(""),[Q,X]=e.useState("all"),[Z,ee]=e.useState(new Set),[re,oe]=e.useState(null);e.useEffect(()=>{const e=()=>{const e=c.getInstance().getApiCalls();H(e);const r=h.getApiCalls().filter(e=>e.url?.includes("/authorize")&&"GET"===e.method||e.url?.includes("/callback")&&"GET"===e.method||e.url?.includes("/resume")&&"GET"===e.method||e.step?.includes("redirect")||e.flowType?.includes("redirect"));Y(r)};e();const r=setInterval(e,2e3);return()=>clearInterval(r)},[]);const se=l.filter(e=>{const r=e.url.toLowerCase().includes(J.toLowerCase())||e.method.toLowerCase().includes(J.toLowerCase())||e.type.toLowerCase().includes(J.toLowerCase()),o="all"===Q||e.type===Q;return r&&o}),te=e=>{const r=new Set(Z);r.has(e)?r.delete(e):r.add(e),ee(r)},ne=(e,r)=>{navigator.clipboard.writeText(e),oe(r),setTimeout(()=>oe(null),2e3)},ie=e=>{switch(e){case"oauth_revoke":case"token_exchange":return"🔄";case"sso_signoff":return"🚪";case"session_delete":return"👥";case"introspect":return"🔍";case"worker_refresh":return"🏭";case"preflight-validation":return"✈️";case"userinfo":return"👤";case"par":return"📤";case"resume":return"▶️";case"device_auth":return"📱";default:return"📡"}},ae=e=>{switch(e){case"oauth_revoke":return"OAuth Token Revocation";case"sso_signoff":return"SSO Sign-off";case"session_delete":return"Session Deletion";case"introspect":return"Token Introspection";case"worker_refresh":return"Worker Token Refresh";case"preflight-validation":return"Pre-flight Validation";case"token_exchange":return"Token Exchange";case"userinfo":return"User Info";case"par":return"Pushed Authorization Request";case"resume":return"Resume Flow";case"device_auth":return"Device Authorization";default:return e||"Unknown"}},de={total:l.length,success:l.filter(e=>e.success).length,failed:l.filter(e=>!e.success).length,avgDuration:l.length>0?Math.round(l.reduce((e,r)=>e+r.duration,0)/l.length):0,redirects:V.length};return r.jsxs(m,{children:[r.jsxs(u,{children:[r.jsx(p,{children:"📡 OAuth Flow Documentation"}),r.jsx(f,{children:"Complete OAuth flow visualization: Front-channel redirects and back-channel API calls"})]}),r.jsxs(k,{children:[r.jsxs(y,{children:[r.jsx($,{children:de.total}),r.jsx(z,{children:"Total API Calls"})]}),r.jsxs(y,{children:[r.jsx($,{children:de.redirects}),r.jsx(z,{children:"Front-Channel Redirects"})]}),r.jsxs(y,{children:[r.jsx($,{children:de.success}),r.jsx(z,{children:"Successful"})]}),r.jsxs(y,{children:[r.jsx($,{children:de.failed}),r.jsx(z,{children:"Failed"})]}),r.jsxs(y,{children:[r.jsxs($,{children:[de.avgDuration,"ms"]}),r.jsx(z,{children:"Avg Duration"})]})]}),r.jsxs(x,{children:[r.jsxs(g,{children:[r.jsx(b,{children:r.jsx(o,{})}),r.jsx(j,{placeholder:"Search by URL, method, or type...",value:J,onChange:e=>K(e.target.value)})]}),r.jsxs(v,{value:Q,onChange:e=>X(e.target.value),children:[r.jsx("option",{value:"all",children:"All Types"}),r.jsx("option",{value:"oauth_revoke",children:"OAuth Revoke"}),r.jsx("option",{value:"sso_signoff",children:"SSO Sign-off"}),r.jsx("option",{value:"session_delete",children:"Session Delete"}),r.jsx("option",{value:"introspect",children:"Introspect"}),r.jsx("option",{value:"worker_refresh",children:"Worker Refresh"}),r.jsx("option",{value:"preflight-validation",children:"Pre-flight Validation"}),r.jsx("option",{value:"token_exchange",children:"Token Exchange"}),r.jsx("option",{value:"userinfo",children:"User Info"}),r.jsx("option",{value:"par",children:"Pushed Authorization Request"}),r.jsx("option",{value:"resume",children:"Resume Flow"}),r.jsx("option",{value:"device_auth",children:"Device Authorization"}),r.jsx("option",{value:"other",children:"Other"})]}),r.jsxs(w,{onClick:()=>window.location.reload(),children:[r.jsx(s,{}),"Refresh"]})]}),V.length>0&&r.jsxs(r.Fragment,{children:[r.jsxs("div",{style:{marginBottom:"2rem"},children:[r.jsxs("h3",{style:{fontSize:"1.25rem",fontWeight:"600",color:"#1e293b",marginBottom:"1rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[r.jsx(t,{}),"Front-Channel Redirects (Browser Navigation)"]}),r.jsx("p",{style:{color:"#64748b",marginBottom:"1rem"},children:"These are the browser redirects that happen during OAuth flows. The user's browser is redirected to these URLs."}),V.map((e,o)=>{let s="Authorization Redirect",i="User browser is redirected to the authorization endpoint to authenticate and grant consent.";return e.url?.includes("/callback")?(s="Authorization Callback",i="Authorization server redirects back to your application with authorization code or tokens."):e.url?.includes("/resume")&&(s="Flow Resume",i="Application resumes the OAuth flow after processing the authorization response."),r.jsxs(P,{children:[r.jsxs(U,{children:[r.jsxs(q,{children:[r.jsx(t,{})," ",s]}),r.jsx(N,{children:"Front-Channel"})]}),r.jsx(G,{children:e.actualPingOneUrl||e.url}),r.jsxs(W,{children:[r.jsxs("strong",{children:["Step"," ",e.url?.includes("/callback")?"2":e.url?.includes("/resume")?"3":"1",":"]})," ",i,"This happens in the user's browser (front-channel)."]}),r.jsxs(D,{children:[r.jsx(n,{}),e.timestamp?new Date(e.timestamp).toLocaleString():"Unknown time"]})]},`redirect-${o}`)})]}),r.jsxs("div",{style:{marginBottom:"2rem",padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px"},children:[r.jsx("h4",{style:{fontSize:"1rem",fontWeight:"600",color:"#374151",marginBottom:"0.5rem"},children:"🔄 Complete OAuth Flow Sequence"}),r.jsxs("div",{style:{fontSize:"0.875rem",color:"#64748b",lineHeight:"1.5"},children:[r.jsxs("div",{style:{marginBottom:"0.5rem"},children:[r.jsx("strong",{children:"1. Front-Channel:"})," Browser redirects to ",r.jsx("code",{children:"/authorize"})," ","endpoint"]}),r.jsxs("div",{style:{marginBottom:"0.5rem"},children:[r.jsx("strong",{children:"2. Front-Channel:"})," Authorization server redirects back with authorization code"]}),r.jsxs("div",{children:[r.jsx("strong",{children:"3. Back-Channel:"})," Application exchanges code for tokens at"," ",r.jsx("code",{children:"/token"})," endpoint"]})]})]})]}),r.jsx(S,{children:se.map(e=>{return r.jsxs(A,{children:[r.jsxs(C,{$method:e.method,children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"1rem"},children:[r.jsx(T,{$method:e.method,children:e.method}),r.jsxs("div",{children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[r.jsx("span",{children:ie(e.type)}),r.jsx("strong",{children:ae(e.type)})]}),r.jsx(R,{children:e.url})]})]}),r.jsxs(D,{children:[r.jsx(n,{}),(o=e.timestamp,new Date(o).toLocaleString())]})]}),r.jsxs(_,{children:[r.jsxs(B,{children:[r.jsx(F,{children:"Request Headers"}),r.jsx(I,{children:Object.entries(e.headers).map(([e,r])=>`${e}: ${r}`).join("\n")})]}),e.body&&r.jsxs(B,{children:[r.jsx(F,{children:"Request Body"}),r.jsx(I,{$expanded:Z.has(e.id),children:e.body}),e.body.length>200&&r.jsx(O,{onClick:()=>te(e.id),children:Z.has(e.id)?"Show Less":"Show More"})]}),r.jsxs(B,{children:[r.jsx(F,{children:"Response"}),r.jsxs(E,{$status:e.response.status,children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[r.jsxs(L,{$status:e.response.status,children:[e.response.status," ",e.response.statusText]}),r.jsxs("span",{style:{fontSize:"0.75rem",color:"#64748b"},children:[e.duration,"ms"]})]}),r.jsxs("div",{style:{marginBottom:"0.5rem"},children:[r.jsx("strong",{children:"Response Headers:"}),r.jsx(M,{onClick:()=>ne(Object.entries(e.response.headers).map(([e,r])=>`${e}: ${r}`).join("\n"),`${e.id}-response-headers`),children:re===`${e.id}-response-headers`?r.jsx(i,{}):r.jsx(a,{})})]}),r.jsx(I,{children:Object.entries(e.response.headers).map(([e,r])=>`${e}: ${r}`).join("\n")}),e.response.body&&r.jsxs(r.Fragment,{children:[r.jsxs("div",{style:{marginBottom:"0.5rem",marginTop:"1rem"},children:[r.jsx("strong",{children:"Response Body:"}),r.jsx(M,{onClick:()=>ne(e.response.body||"",`${e.id}-response-body`),children:re===`${e.id}-response-body`?r.jsx(i,{}):r.jsx(a,{})})]}),r.jsx(I,{$expanded:Z.has(`${e.id}-response`),children:e.response.body}),e.response.body&&e.response.body.length>200&&r.jsx(O,{onClick:()=>te(`${e.id}-response`),children:Z.has(`${e.id}-response`)?"Show Less":"Show More"})]})]})]})]})]},e.id);var o})}),0===se.length&&r.jsxs("div",{style:{textAlign:"center",padding:"3rem",color:"#64748b",fontSize:"0.875rem"},children:[r.jsx(d,{style:{fontSize:"3rem",marginBottom:"1rem",display:"block",margin:"0 auto 1rem"}}),r.jsx("h3",{children:"No API Calls Found"}),r.jsx("p",{children:"Try adjusting your search or filter criteria, or make some API calls to see them here."})]})]})};export{V as TokenApiDocumentationPage,V as default};
//# sourceMappingURL=TokenApiDocumentationPage-BwXyuRPI.js.map
