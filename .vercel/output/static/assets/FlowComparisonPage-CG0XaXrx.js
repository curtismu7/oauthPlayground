import{a as e,j as r,T as o,n as s,Q as i,ah as t,X as n,a4 as c,aJ as l,l as d,f as a,v as p}from"./react-vendor-HWZo9XlX.js";import{a as m}from"./styled-vendor-DGSsHzxd.js";import{t as x}from"./v8u-components-COnDGHJS.js";import"./vendor-CvVeuJe7.js";import"./v8-services-DHsPM8a2.js";import"./utils-lzKqcxFi.js";import"./components-credentials-T7jmF3zx.js";import"./components-oauth-qq-maH2w.js";import"./v8u-services-CviCpCEt.js";import"./v8-utils-BU6AoW1l.js";import"./components-flow-core-y1x-SJYd.js";import"./components-token-uXxDPBqK.js";import"./oauth-flows-device-CMULWbHZ.js";import"./pages-ai-D2KhTcan.js";import"./pages-DE-6TDOE.js";import"./components-oauth-authorize-sao_-EgS.js";import"./components-oauth-discovery-DYbdhNwI.js";import"./v8-components-8swtZwHb.js";import"./components-oauth-client-BhjYl9xl.js";import"./v8-hooks-B7CjPGrP.js";import"./components-ui-DbX9aVva.js";import"./v8-flows-CbgB_G0p.js";import"./oauth-flows-BoQiEZ27.js";import"./oauth-flows-authcode-ltS0AxHA.js";import"./components-oauth-par-B-NhQsyD.js";import"./oauth-flows-implicit-BlAJpg9o.js";import"./oauth-flows-par-DTJ0aZ64.js";import"./pages-docs-nYnYMLbe.js";import"./components-flow-BH3Bx-YA.js";import"./components-steps-BQ6HbS5x.js";import"./pages-pingone-BLdy8FiO.js";const u=m.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`,h=m.div`
  margin-bottom: 2rem;
  text-align: center;
`,f=m.h1`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`,j=m.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`,b=m.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`,g=m.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`,v=m.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${e=>e.$color||"#64748b"};
`,y=m.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
`,w=m.div`
  font-size: 0.875rem;
  color: #64748b;
`,S=m.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`,k=m.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
`,$=m.h2`
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`,C=m.div`
  font-size: 1.25rem;
  color: #3b82f6;
`,F=m.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`,A=m.li`
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  &:last-child {
    border-bottom: none;
  }
`,z=m.div`
  font-size: 1rem;
  color: ${e=>e.$color||"#3b82f6"};
`,L=m.div`
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`,R=m.span`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${e=>e.$enabled?"\n        background: #dcfce7;\n        color: #166534;\n        border-color: #86efac;\n      ":"\n        background: #f3f4f6;\n        color: #6b7280;\n        border-color: #d1d5db;\n      "}
`,M=m.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`,E=m.button`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${e=>{switch(e.$variant){case"primary":return"\n          background: #3b82f6;\n          border-color: #3b82f6;\n          color: white;\n          \n          &:hover {\n            background: #2563eb;\n            border-color: #2563eb;\n          }\n        ";case"danger":return"\n          background: #ef4444;\n          border-color: #ef4444;\n          color: white;\n          \n          &:hover {\n            background: #dc2626;\n            border-color: #dc2626;\n          }\n        ";default:return"\n          background: white;\n          border-color: #e2e8f0;\n          color: #64748b;\n          \n          &:hover {\n            background: #f8fafc;\n            border-color: #cbd5e1;\n            color: #475569;\n          }\n        "}}}
`,O=m.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
`,T=m.div`
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
`,q=m.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
`,I=m.div`
  font-size: 0.875rem;
  color: #64748b;
`,N={"oauth-authz":{name:"Authorization Code",security:"excellent",complexity:"fair",performance:"good",scalability:"excellent",userExperience:"good",tokenSecurity:"excellent",bestFor:["Web applications","Server-side apps","High security requirements"],pros:["Most secure OAuth flow","Tokens never exposed to browser","Supports refresh tokens","PKCE support for enhanced security"],cons:["Requires server-side component","More complex than implicit flow","Additional round trips"]},implicit:{name:"Implicit",security:"poor",complexity:"excellent",performance:"excellent",scalability:"fair",userExperience:"excellent",tokenSecurity:"poor",bestFor:["Legacy applications","Simple SPAs","Limited server resources"],pros:["Fast and simple","No server-side storage needed","Single request-response","Good for mobile apps"],cons:["Tokens exposed in URL","No refresh token support","Security vulnerabilities","Deprecated in OAuth 2.1"]},"client-credentials":{name:"Client Credentials",security:"excellent",complexity:"excellent",performance:"excellent",scalability:"excellent",userExperience:"good",tokenSecurity:"excellent",bestFor:["API services","Backend services","Machine-to-machine"],pros:["Simple and secure","No user interaction required","High performance","Ideal for service-to-service"],cons:["No user context","Cannot access user resources","Limited to client scopes"]},"device-code":{name:"Device Code",security:"excellent",complexity:"fair",performance:"fair",scalability:"good",userExperience:"fair",tokenSecurity:"excellent",bestFor:["IoT devices","Smart TVs","CLI applications"],pros:["Works on input-constrained devices","Secure user authentication","Good user experience for devices","Supports polling mechanism"],cons:["Multi-step process","Requires secondary device","Slower than other flows","More complex UX"]},hybrid:{name:"Hybrid",security:"good",complexity:"poor",performance:"fair",scalability:"good",userExperience:"fair",tokenSecurity:"good",bestFor:["Complex applications","Migrated systems","Special requirements"],pros:["Flexible token delivery","Reduced round trips","Supports multiple token types","Backward compatible"],cons:["Most complex flow","Security considerations","Harder to implement correctly","Limited use cases"]},ropc:{name:"Resource Owner Password",security:"poor",complexity:"excellent",performance:"excellent",scalability:"fair",userExperience:"excellent",tokenSecurity:"poor",bestFor:["Trusted applications","Legacy systems","Internal tools"],pros:["Simple to implement","Fast authentication","No redirects needed","Good for trusted clients"],cons:["Security risks with passwords","Not recommended for new apps","Requires user credentials","Limited to trusted applications"]}},U=()=>{const[m,U]=e.useState(["oauth-authz","implicit"]),[B,D]=e.useState("detailed"),[P,H]=e.useState(""),[G,V]=e.useState("info"),J={totalFlows:Object.keys(N).length,selectedFlows:m.length,avgSecurity:m.length>0?m.reduce((e,r)=>{const o=N[r].security;return e+("excellent"===o?4:"good"===o?3:"fair"===o?2:1)},0)/m.length:0,avgComplexity:m.length>0?m.reduce((e,r)=>{const o=N[r].complexity;return e+("excellent"===o?4:"good"===o?3:"fair"===o?2:1)},0)/m.length:0};return r.jsxs(u,{children:[r.jsxs(h,{children:[r.jsx(f,{children:"📊 Flow Comparison Tool"}),r.jsx(j,{children:"Compare different OAuth flows to understand their security implications, performance characteristics, and best use cases"})]}),P&&r.jsx("div",{style:{marginBottom:"1rem"},children:r.jsx("div",{style:{padding:"1rem",borderRadius:"8px",background:"success"===G?"#f0fdf4":"error"===G?"#fef2f2":"#eff6ff",border:"1px solid "+("success"===G?"#86efac":"error"===G?"#fecaca":"#bfdbfe"),color:"success"===G?"#166534":"error"===G?"#991b1b":"#1e40af",textAlign:"center"},children:P})}),r.jsxs(b,{children:[r.jsxs(g,{children:[r.jsx(v,{$color:"#3b82f6",children:r.jsx(o,{})}),r.jsx(y,{children:J.totalFlows}),r.jsx(w,{children:"Total Flows"})]}),r.jsxs(g,{children:[r.jsx(v,{$color:"#10b981",children:r.jsx(s,{})}),r.jsx(y,{children:J.selectedFlows}),r.jsx(w,{children:"Selected Flows"})]}),r.jsxs(g,{children:[r.jsx(v,{$color:"#f59e0b",children:r.jsx(i,{})}),r.jsx(y,{children:J.avgSecurity.toFixed(1)}),r.jsx(w,{children:"Avg Security"})]}),r.jsxs(g,{children:[r.jsx(v,{$color:"#8b5cf6",children:r.jsx(t,{})}),r.jsx(y,{children:J.avgComplexity.toFixed(1)}),r.jsx(w,{children:"Avg Complexity"})]})]}),r.jsx(x,{onFlowSelect:e=>{U(r=>{if(r.includes(e))return r;return[e,...r].slice(0,4)});H(`Selected ${N[e]?.name??e} flow for implementation`),V("success")},selectedFlows:m}),r.jsxs(S,{children:[r.jsxs(k,{children:[r.jsx(C,{children:r.jsx(n,{})}),r.jsx($,{children:"Comparison Features"})]}),r.jsxs(F,{children:[r.jsxs(A,{children:[r.jsx(z,{$color:"#10b981",children:r.jsx(i,{})}),r.jsx(L,{children:"Comprehensive security analysis with detailed ratings"}),r.jsx(R,{$enabled:!0,children:"Active"})]}),r.jsxs(A,{children:[r.jsx(z,{$color:"#3b82f6",children:r.jsx(o,{})}),r.jsx(L,{children:"Performance metrics and complexity assessment"}),r.jsx(R,{$enabled:!0,children:"Active"})]}),r.jsxs(A,{children:[r.jsx(z,{$color:"#8b5cf6",children:r.jsx(c,{})}),r.jsx(L,{children:"User experience evaluation and recommendations"}),r.jsx(R,{$enabled:!0,children:"Active"})]}),r.jsxs(A,{children:[r.jsx(z,{$color:"#10b981",children:r.jsx(n,{})}),r.jsx(L,{children:"Detailed pros and cons for each flow type"}),r.jsx(R,{$enabled:!0,children:"Active"})]}),r.jsxs(A,{children:[r.jsx(z,{$color:"#f59e0b",children:r.jsx(l,{})}),r.jsx(L,{children:"Best use case recommendations and guidance"}),r.jsx(R,{$enabled:!0,children:"Active"})]}),r.jsxs(A,{children:[r.jsx(z,{$color:"#ef4444",children:r.jsx(d,{})}),r.jsx(L,{children:"Security warnings and deprecation notices"}),r.jsx(R,{$enabled:!0,children:"Active"})]})]})]}),r.jsxs(S,{children:[r.jsxs(k,{children:[r.jsx(C,{children:r.jsx(o,{})}),r.jsx($,{children:"Comparison Statistics"})]}),r.jsxs(O,{children:[r.jsxs(T,{children:[r.jsx(q,{children:J.selectedFlows}),r.jsx(I,{children:"Flows Compared"})]}),r.jsxs(T,{children:[r.jsxs(q,{children:[J.avgSecurity.toFixed(1),"/4"]}),r.jsx(I,{children:"Avg Security Score"})]}),r.jsxs(T,{children:[r.jsxs(q,{children:[J.avgComplexity.toFixed(1),"/4"]}),r.jsx(I,{children:"Avg Complexity Score"})]}),r.jsxs(T,{children:[r.jsx(q,{children:"detailed"===B?"Detailed":"Matrix"}),r.jsx(I,{children:"View Mode"})]})]})]}),r.jsxs(M,{children:[r.jsxs(E,{onClick:()=>{const e=m.map(e=>({flow:e,metrics:N[e]})),r=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),o=URL.createObjectURL(r),s=document.createElement("a");s.href=o,s.download=`flow-comparison-${(new Date).toISOString().split("T")[0]}.json`,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(o),H("Comparison results exported successfully"),V("success")},children:[r.jsx(a,{})," Export Comparison"]}),r.jsxs(E,{onClick:()=>D("detailed"===B?"matrix":"detailed"),children:[r.jsx(p,{})," Switch to ","detailed"===B?"Matrix":"Detailed"," View"]})]})]})};export{U as FlowComparisonPage,U as default};
//# sourceMappingURL=FlowComparisonPage-CG0XaXrx.js.map
