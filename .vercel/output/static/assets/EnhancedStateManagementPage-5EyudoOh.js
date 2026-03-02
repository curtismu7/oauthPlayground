import{a as e,j as r,X as n,E as o,Y as i,aM as t,n as s,l,ah as d,H as c,bz as a,N as f,v as x,f as m,a7 as h,W as p,aF as g,bA as j}from"./react-vendor-HWZo9XlX.js";import{a as u}from"./styled-vendor-DGSsHzxd.js";import{d as b,T as k,l as v,s as y}from"./v8u-services-CviCpCEt.js";import"./vendor-CvVeuJe7.js";import"./utils-lzKqcxFi.js";import"./components-credentials-T7jmF3zx.js";import"./components-oauth-qq-maH2w.js";import"./components-flow-core-y1x-SJYd.js";import"./components-token-uXxDPBqK.js";import"./v8-services-DHsPM8a2.js";import"./v8-components-8swtZwHb.js";import"./v8-utils-BU6AoW1l.js";import"./v8u-components-COnDGHJS.js";import"./oauth-flows-par-DTJ0aZ64.js";import"./components-oauth-par-B-NhQsyD.js";import"./pages-DE-6TDOE.js";import"./pages-ai-D2KhTcan.js";import"./components-oauth-authorize-sao_-EgS.js";import"./components-oauth-discovery-DYbdhNwI.js";import"./pages-pingone-BLdy8FiO.js";import"./oauth-flows-authcode-ltS0AxHA.js";import"./oauth-flows-BoQiEZ27.js";import"./oauth-flows-device-CMULWbHZ.js";import"./components-oauth-client-BhjYl9xl.js";import"./oauth-flows-implicit-BlAJpg9o.js";import"./components-flow-BH3Bx-YA.js";import"./components-steps-BQ6HbS5x.js";import"./components-ui-DbX9aVva.js";import"./pages-docs-nYnYMLbe.js";import"./v8-hooks-B7CjPGrP.js";import"./v8-flows-CbgB_G0p.js";const w=u.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`,S=u.div`
  margin-bottom: 2rem;
  text-align: center;
`,T=u.h1`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`,A=u.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`,$=u.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`,z=u.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`,F=u.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${e=>e.$color||"#64748b"};
`,R=u.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
`,C=u.div`
  font-size: 0.875rem;
  color: #64748b;
`,_=u.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`,M=u.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
`,O=u.h2`
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`,L=u.div`
  font-size: 1.25rem;
  color: #3b82f6;
`,W=u.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`,E=u.button`
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
`,N=u.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${e=>{switch(e.$status){case"online":case"synced":return"\n          background: #dcfce7;\n          color: #166534;\n          border-color: #86efac;\n        ";case"offline":case"error":return"\n          background: #fee2e2;\n          color: #991b1b;\n          border-color: #fecaca;\n        ";case"pending":return"\n          background: #fef3c7;\n          color: #92400e;\n          border-color: #fbbf24;\n        ";default:return"\n          background: #f3f4f6;\n          color: #4b5563;\n          border-color: #d1d5db;\n        "}}}
`,I=u.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`,D=u.li`
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  &:last-child {
    border-bottom: none;
  }
`,U=u.div`
  font-size: 1rem;
  color: ${e=>e.$color||"#3b82f6"};
`,B=u.div`
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`,P=u.span`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${e=>e.$enabled?"\n        background: #dcfce7;\n        color: #166534;\n        border-color: #86efac;\n      ":"\n        background: #f3f4f6;\n        color: #6b7280;\n        border-color: #d1d5db;\n      "}
`;u.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
`,u.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: ${e=>e.$disabled?"not-allowed":"pointer"};
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${e=>e.$disabled?"\n        background: #f3f4f6;\n        color: #9ca3af;\n        border-color: #d1d5db;\n      ":"\n        background: white;\n        color: #374151;\n        border-color: #d1d5db;\n        \n        &:hover {\n          background: #f8fafc;\n          border-color: #cbd5e1;\n          color: #1e293b;\n        }\n      "}
`;const J=u.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin: 1rem 0;
`,V=u.button`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #2563eb;
    border-color: #2563eb;
  }
`;u.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  color: #991b1b;
  text-align: center;
  font-size: 0.875rem;
`,u.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 1rem;
  color: #166534;
  text-align: center;
  font-size: 0.875rem;
`;const q=()=>{const{state:u,actions:q}=b(),[H,Y]=e.useState(""),[X,G]=e.useState("info"),[K,Q]=e.useState(!1),[Z,ee]=e.useState(!1);e.useEffect(()=>{q.updateRealMetrics()},[q]);const re=e.useMemo(()=>({unifiedFlow:u.unifiedFlow,performance:u.performance,history:{pastCount:0,futureCount:0},offline:u.offline}),[u.unifiedFlow,u.performance,u.offline]);return r.jsxs(w,{children:[r.jsxs(S,{children:[r.jsx(T,{children:"🔧 Enhanced State Management"}),r.jsx(A,{children:"Advanced state management with undo/redo, offline capabilities, and persistence"})]}),H&&r.jsx("div",{style:{marginBottom:"1rem"},children:r.jsx("div",{style:{padding:"1rem",borderRadius:"8px",background:"success"===X?"#f0fdf4":"error"===X?"#fef2f2":"#eff6ff",border:"1px solid "+("success"===X?"#86efac":"error"===X?"#fecaca":"#bfdbfe"),color:"success"===X?"#166534":"error"===X?"#991b1b":"#1e40af",textAlign:"center"},children:H})}),r.jsxs($,{children:[r.jsxs(z,{children:[r.jsx(F,{$color:"#3b82f6",children:r.jsx(n,{})}),r.jsx(R,{children:re?.unifiedFlow?.tokenCount||0}),r.jsx(C,{children:"Total Tokens"})]}),r.jsxs(z,{children:[r.jsx(F,{$color:"#8b5cf6",children:r.jsx(o,{})}),r.jsx(R,{children:(()=>{try{const e=k.getInstance();return e.getAllTokens().filter(e=>"worker_token"===e.type).length}catch{return 0}})()}),r.jsx(C,{children:"Worker Tokens"})]}),r.jsxs(z,{children:[r.jsx(F,{$color:"#3b82f6",children:r.jsx(i,{})}),r.jsx(R,{children:(()=>{try{const e=k.getInstance();return e.getAllTokens().filter(e=>"access_token"===e.type).length}catch{return 0}})()}),r.jsx(C,{children:"Access Tokens"})]}),r.jsxs(z,{children:[r.jsx(F,{$color:"#f59e0b",children:r.jsx(t,{})}),r.jsx(R,{children:(()=>{try{const e=k.getInstance();return e.getAllTokens().filter(e=>"refresh_token"===e.type).length}catch{return 0}})()}),r.jsx(C,{children:"Refresh Tokens"})]}),r.jsxs(z,{children:[r.jsx(F,{$color:"#10b981",children:r.jsx(s,{})}),r.jsx(R,{children:(()=>{try{const e=k.getInstance();return e.getAllTokens().filter(e=>"id_token"===e.type).length}catch{return 0}})()}),r.jsx(C,{children:"ID Tokens"})]}),r.jsxs(z,{children:[r.jsx(F,{$color:"#10b981",children:r.jsx(s,{})}),r.jsx(R,{children:re?.unifiedFlow?.featureCount||0}),r.jsx(C,{children:"Active Features"})]}),r.jsxs(z,{children:[r.jsx(F,{$color:"#f59e0b",children:r.jsx(l,{})}),r.jsx(R,{children:re?.unifiedFlow?.errorCount||0}),r.jsx(C,{children:"Active Errors"})]}),r.jsxs(z,{children:[r.jsx(F,{$color:"#8b5cf6",children:r.jsx(d,{})}),r.jsx(R,{children:re?.performance?.lastActivity?new Date(re.performance.lastActivity).toLocaleTimeString():"Never"}),r.jsx(C,{children:"Last Activity"})]}),r.jsxs(z,{children:[r.jsx(F,{$color:"#8b5cf6",children:r.jsx(c,{})}),r.jsx(R,{children:re?.unifiedFlow?.apiCallCount||0}),r.jsx(C,{children:"API Calls"})]}),r.jsxs(z,{children:[r.jsx(F,{$color:"#8b5cf6",children:r.jsx(a,{})}),r.jsx(R,{children:r.jsx(N,{$status:re?.offline?.isOnline?"online":"offline",children:re?.offline?.isOnline?"Online":"Offline"})}),r.jsx(C,{children:"Connection Status"})]})]}),r.jsxs(_,{children:[r.jsxs(M,{children:[r.jsx(L,{children:r.jsx(a,{})}),r.jsx(O,{children:"Offline Status"})]}),r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"1rem",padding:"1rem",background:re?.offline?.isOnline?"#f0fdf4":"#fef2f2",border:"1px solid "+(re?.offline?.isOnline?"#86efac":"#fecaca"),borderRadius:"8px",marginBottom:"1rem"},children:[r.jsxs("div",{children:[r.jsx("strong",{children:"Status:"})," ",re?.offline?.isOnline?"Online":"Offline"]}),r.jsxs("div",{children:[r.jsx("strong",{children:"Pending Actions:"})," ",re?.offline?.pendingActions?.length||0]}),r.jsxs("div",{children:[r.jsx("strong",{children:"Sync Status:"})," ",re?.offline?.syncStatus]}),r.jsxs("div",{children:[r.jsx("strong",{children:"Last Sync:"})," ",re?.offline?.lastSyncTime?new Date(re.offline.lastSyncTime).toLocaleString():"Never"]})]}),re?.offline?.pendingActions&&re.offline.pendingActions.length>0&&r.jsxs("div",{style:{marginTop:"1rem"},children:[r.jsx("strong",{children:"Pending Actions:"}),r.jsxs("ul",{style:{margin:"0",paddingLeft:"1.5rem"},children:[re.offline.pendingActions.slice(0,5).map(e=>r.jsxs("li",{children:[e.type," - ",new Date(e.timestamp).toLocaleTimeString()]},e.id)),re.offline.pendingActions.length>5&&r.jsxs("li",{children:["...and ",re.offline.pendingActions.length-5," more"]})]})]})]}),r.jsxs(_,{children:[r.jsxs(M,{children:[r.jsx(L,{children:r.jsx(n,{})}),r.jsx(O,{children:"Worker Token Status"})]}),r.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"1rem"},children:[r.jsxs("div",{style:{padding:"1rem",background:re?.unifiedFlow?.workerTokenMetrics?.hasWorkerToken?"#f0fdf4":"#fef2f2",border:"1px solid "+(re?.unifiedFlow?.workerTokenMetrics?.hasWorkerToken?"#86efac":"#fecaca"),borderRadius:"8px",textAlign:"center"},children:[r.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#1e293b"},children:re?.unifiedFlow?.workerTokenMetrics?.hasWorkerToken?"Available":"None"}),r.jsx("div",{style:{fontSize:"0.875rem",color:"#64748b"},children:"Worker Token"})]}),r.jsxs("div",{style:{padding:"1rem",background:re?.unifiedFlow?.workerTokenMetrics?.workerTokenValid?"#f0fdf4":"#fef3c7",border:"1px solid "+(re?.unifiedFlow?.workerTokenMetrics?.workerTokenValid?"#86efac":"#fbbf24"),borderRadius:"8px",textAlign:"center"},children:[r.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#1e293b"},children:re?.unifiedFlow?.workerTokenMetrics?.workerTokenValid?"Valid":"Invalid"}),r.jsx("div",{style:{fontSize:"0.875rem",color:"#64748b"},children:"Token Status"})]}),r.jsxs("div",{style:{padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",textAlign:"center"},children:[r.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#1e293b"},children:re?.unifiedFlow?.workerTokenMetrics?.workerTokenExpiry?new Date(re.unifiedFlow.workerTokenMetrics.workerTokenExpiry).toLocaleTimeString():"Never"}),r.jsx("div",{style:{fontSize:"0.875rem",color:"#64748b"},children:"Expires At"})]}),r.jsxs("div",{style:{padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",textAlign:"center"},children:[r.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#1e293b"},children:re?.unifiedFlow?.workerTokenMetrics?.lastWorkerTokenRefresh?new Date(re.unifiedFlow.workerTokenMetrics.lastWorkerTokenRefresh).toLocaleTimeString():"Never"}),r.jsx("div",{style:{fontSize:"0.875rem",color:"#64748b"},children:"Last Refresh"})]})]})]}),r.jsxs(_,{children:[r.jsxs(M,{children:[r.jsx(L,{children:r.jsx(n,{})}),r.jsx(O,{children:"All Token Status"})]}),r.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))",gap:"1rem"},children:(()=>{try{const e=k.getInstance();e.getAllTokens();return["access_token","refresh_token","id_token","worker_token"].map(n=>{const o=e.getTokensByType(n),i=o.filter(e=>"active"===e.status),t=o.filter(e=>"expiring"===e.status),s=o.filter(e=>"expired"===e.status);return r.jsxs("div",{style:{padding:"1.5rem",background:((e,r)=>{if(!r)return"#fef2f2";switch(e){case"access_token":return"#dbeafe";case"refresh_token":return"#fef3c7";case"id_token":return"#f0fdf4";case"worker_token":return"#ede9fe";default:return"#f8fafc"}})(n,i.length>0),border:`1px solid ${((e,r)=>{if(!r)return"#fecaca";switch(e){case"access_token":return"#93c5fd";case"refresh_token":return"#fbbf24";case"id_token":return"#86efac";case"worker_token":return"#a78bfa";default:return"#e2e8f0"}})(n,i.length>0)}`,borderRadius:"8px",textAlign:"center",minHeight:"140px",display:"flex",flexDirection:"column",justifyContent:"center"},children:[r.jsx("div",{style:{fontSize:"2rem",marginBottom:"0.5rem"},children:(e=>{switch(e){case"access_token":return"🔑";case"refresh_token":return"🔄";case"id_token":return"🆔";case"worker_token":return"👷";default:return"📄"}})(n)}),r.jsx("div",{style:{fontSize:"1.25rem",fontWeight:"700",color:"#1e293b",marginBottom:"0.5rem"},children:i.length>0?`${i.length} Active`:"None"}),r.jsx("div",{style:{fontSize:"0.875rem",color:"#64748b",marginBottom:"0.5rem"},children:n.replace("_"," ").replace(/\b\w/g,e=>e.toUpperCase())}),(t.length>0||s.length>0)&&r.jsxs("div",{style:{fontSize:"0.75rem",color:"#64748b"},children:[t.length>0&&r.jsxs("span",{style:{color:"#d97706"},children:["⚠️ ",t.length," expiring"]}),s.length>0&&r.jsxs("span",{style:{color:"#dc2626"},children:["❌ ",s.length," expired"]})]}),i.length>0&&i[0].expiresAt&&r.jsxs("div",{style:{fontSize:"0.75rem",color:"#64748b",marginTop:"0.5rem"},children:["Expires: ",new Date(i[0].expiresAt).toLocaleTimeString()]})]},n)})}catch(e){return r.jsx("div",{style:{padding:"1rem",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",textAlign:"center",gridColumn:"1 / -1"},children:r.jsx("div",{style:{fontSize:"1rem",color:"#dc2626"},children:"Unable to load token information"})})}})()})]}),r.jsxs(_,{children:[r.jsxs(M,{children:[r.jsx(L,{children:r.jsx(c,{})}),r.jsx(O,{children:"Performance Metrics"})]}),r.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"1rem"},children:[r.jsxs("div",{style:{padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",textAlign:"center"},children:[r.jsxs("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#1e293b"},children:[re?.unifiedFlow?.performanceMetrics?.avgResponseTime||0,"ms"]}),r.jsx("div",{style:{fontSize:"0.875rem",color:"#64748b"},children:"Avg Response Time"})]}),r.jsxs("div",{style:{padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",textAlign:"center"},children:[r.jsxs("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#1e293b"},children:[re?.unifiedFlow?.performanceMetrics?.successRate||100,"%"]}),r.jsx("div",{style:{fontSize:"0.875rem",color:"#64748b"},children:"Success Rate"})]}),r.jsxs("div",{style:{padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",textAlign:"center"},children:[r.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#1e293b"},children:re?.unifiedFlow?.lastApiCall?new Date(re.unifiedFlow.lastApiCall).toLocaleTimeString():"Never"}),r.jsx("div",{style:{fontSize:"0.875rem",color:"#64748b"},children:"Last API Call"})]})]})]}),r.jsxs(_,{children:[r.jsxs(M,{children:[r.jsx(L,{children:r.jsx(f,{})}),r.jsx(O,{children:"Available Features"})]}),r.jsxs(I,{children:[r.jsxs(D,{children:[r.jsx(U,{$color:"#10b981",children:r.jsx(n,{})}),r.jsx(B,{children:"Comprehensive state management for all OAuth flows"}),r.jsx(P,{$enabled:!0,children:"Active"})]}),r.jsxs(D,{children:[r.jsx(U,{$color:"#8b5cf6",children:r.jsx(t,{})}),r.jsx(B,{children:"Undo/Redo functionality with history tracking"}),r.jsx(P,{$enabled:!0,children:"Active"})]}),r.jsxs(D,{children:[r.jsx(U,{$color:"#3b82f6",children:r.jsx(a,{})}),r.jsx(B,{children:"Offline capability with pending action queue"}),r.jsx(P,{$enabled:re?.offline?.isOnline||!1,children:"Active"})]}),r.jsxs(D,{children:[r.jsx(U,{$color:"#10b981",children:r.jsx(x,{})}),r.jsx(B,{children:"Automatic state persistence to localStorage"}),r.jsx(P,{$enabled:!0,children:"Active"})]}),r.jsxs(D,{children:[r.jsx(U,{$color:"#8b5cf6",children:r.jsx(c,{})}),r.jsx(B,{children:"Performance metrics and activity tracking"}),r.jsx(P,{$enabled:!0,children:"Active"})]}),r.jsxs(D,{children:[r.jsx(U,{$color:"#ef4444",children:r.jsx(l,{})}),r.jsx(B,{children:"Error handling and recovery mechanisms"}),r.jsx(P,{$enabled:!0,children:"Active"})]})]})]}),r.jsxs(_,{children:[r.jsxs(M,{children:[r.jsx(L,{children:r.jsx(n,{})}),r.jsx(O,{children:"Data Management"})]}),r.jsxs(J,{children:[r.jsxs(V,{onClick:async()=>{v.debug("handleExport called");try{Q(!0);const e=y.exportAllState();if(!e)throw new Error("Failed to export state data");const r=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),n=URL.createObjectURL(r),o=document.createElement("a");o.href=n,o.download=`enhanced-state-management-${(new Date).toISOString().split("T")[0]}.json`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(n),Y("State exported successfully!"),G("success")}catch(e){v.error("Failed to export state:",e),Y(`Failed to export state: ${e instanceof Error?e.message:"Unknown error"}`),G("error")}finally{Q(!1)}},disabled:K,children:[r.jsx(m,{})," ",K?"Exporting...":"Export State"]}),r.jsx("input",{type:"file",accept:".json",onChange:async e=>{const r=e.target.files?.[0];if(r)try{ee(!0);const e=await r.text(),n=JSON.parse(e);n&&(y.importAllState(n),Y("State imported successfully"),G("success"))}catch(n){Y("Failed to import state"),G("error")}finally{ee(!1),e.target&&(e.target.value="")}},disabled:Z,style:{display:"none"},id:"state-import-input"}),r.jsxs(V,{as:"label",htmlFor:"state-import-input",disabled:Z,style:{cursor:Z?"not-allowed":"pointer"},children:[r.jsx(h,{})," ",Z?"Importing...":"Import State"]})]}),r.jsxs("div",{style:{fontSize:"0.875rem",color:"#64748b",marginTop:"0.5rem"},children:[r.jsxs("p",{children:[r.jsx("strong",{children:"Export:"})," Save your current state to a JSON file for backup or sharing"]}),r.jsxs("p",{children:[r.jsx("strong",{children:"Import:"})," Load a previously saved state from a JSON file"]})]})]}),r.jsxs(W,{children:[r.jsxs(E,{onClick:()=>{v.debug("handleResetAll called"),y.resetAllState(),Y("All state has been reset to defaults"),G("info")},$variant:"danger",children:[r.jsx(p,{})," Reset All State"]}),r.jsxs(E,{onClick:()=>{v.debug("Theme reset button clicked");try{q.setTheme("auto"),Y("Theme set to auto"),G("info")}catch(e){v.error("Failed to reset theme:",e),Y("Failed to reset theme"),G("error")}},children:[r.jsx(o,{})," Reset Theme"]}),r.jsxs(E,{onClick:()=>{q.toggleNotifications(),Y("Notifications "+(u.notifications?"enabled":"disabled")),G("info")},children:[u.notifications?r.jsx(g,{}):r.jsx(j,{})," Toggle Notifications"]}),r.jsxs(E,{onClick:()=>{q.updateRealMetrics(),Y("Real metrics updated"),G("success")},children:[r.jsx(x,{})," Update Real Metrics"]})]})]})};export{q as EnhancedStateManagementPage,q as default};
//# sourceMappingURL=EnhancedStateManagementPage-5EyudoOh.js.map
