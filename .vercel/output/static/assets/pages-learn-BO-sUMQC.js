import{a as e,j as r,k as n,l as s,n as o,Q as i}from"./react-vendor-HWZo9XlX.js";import{a as t}from"./styled-vendor-DGSsHzxd.js";import{k as d,at as l,R as a}from"./components-oauth-qq-maH2w.js";const c=t.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`,h=t.div`
  max-width: 64rem;
  margin: 0 auto;
  padding: 0 1rem;
`,p=t.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 2rem;
`,x=t.section`
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`,m=t.h3`
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,j=t.p`
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
`,u=t.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`,g=t.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`,f=t.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`,b=t.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,y=t.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,v=t.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  
  ${e=>{switch(e.$variant){case"info":return"background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af;";case"success":return"background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534;";case"warning":return"background: #fffbeb; border: 1px solid #fed7aa; color: #92400e;";case"danger":return"background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;";default:return""}}}
`,w=t.div`
  flex: 1;
`,k=t.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
`,C=t.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
`,_=t.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`,z=t.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
`,I=t.h5`
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`,T=t.ul`
  margin: 0;
  padding-left: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.5;
`,F=t.li`
  margin-bottom: 0.25rem;
`,R=()=>{const[t,R]=e.useState({flowKey:"authorization_code",responseType:"code",clientId:"my_app_client",redirectUri:"https://myapp.com/callback",scope:"openid profile email",state:"random_state_123",nonce:"random_nonce_456"}),S=e.useCallback((e,r)=>{R(n=>({...n,[e]:r}))},[]),U=e.useCallback(e=>{R({flowKey:e.flowKey,responseType:e.responseType,clientId:e.clientId,redirectUri:e.redirectUri,scope:e.scope,state:e.state,nonce:e.nonce||"random_nonce_456"})},[]);return r.jsxs(c,{children:[r.jsx(d,{flowId:"response-modes-learn"}),r.jsx(h,{children:r.jsxs(p,{children:[r.jsxs(x,{children:[r.jsxs(m,{children:[r.jsx(n,{size:20}),"Understanding Response Modes"]}),r.jsx(j,{children:"Response modes determine how authorization responses are returned to your application. Choose the right mode based on your application type and security requirements."}),r.jsxs(v,{$variant:"info",children:[r.jsx(n,{size:20}),r.jsxs(w,{children:[r.jsx(k,{children:"What are Response Modes?"}),r.jsx(C,{children:"Response modes specify how the authorization server returns authorization response parameters to the client application. They affect both security and usability of your OAuth/OIDC implementation."})]})]}),r.jsxs(v,{$variant:"warning",children:[r.jsx(s,{size:20}),r.jsxs(w,{children:[r.jsx(k,{children:"Security Considerations"}),r.jsx(C,{children:"Different response modes have different security implications. Fragment mode is recommended for SPAs to prevent token leakage in server logs, while query mode is standard for server-side applications."})]})]})]}),r.jsxs(x,{children:[r.jsxs(m,{children:[r.jsx(o,{size:20}),"Interactive Examples"]}),r.jsx(j,{children:"Try different configurations and see live previews of how authorization requests and responses work."}),r.jsx(l,{onSelectExample:U}),r.jsx(m,{children:"Custom Configuration"}),r.jsx(j,{children:"Adjust these parameters to see how they affect the authorization request and response."}),r.jsxs(u,{children:[r.jsxs(g,{children:[r.jsx(f,{children:"Flow Type"}),r.jsxs(y,{value:t.flowKey,onChange:e=>S("flowKey",e.target.value),children:[r.jsx("option",{value:"authorization_code",children:"Authorization Code"}),r.jsx("option",{value:"implicit",children:"Implicit"}),r.jsx("option",{value:"hybrid",children:"Hybrid"}),r.jsx("option",{value:"device",children:"Device Code"}),r.jsx("option",{value:"client_credentials",children:"Client Credentials"})]})]}),r.jsxs(g,{children:[r.jsx(f,{children:"Response Type"}),r.jsxs(y,{value:t.responseType,onChange:e=>S("responseType",e.target.value),children:[r.jsx("option",{value:"code",children:"code"}),r.jsx("option",{value:"token",children:"token"}),r.jsx("option",{value:"id_token",children:"id_token"}),r.jsx("option",{value:"token id_token",children:"token id_token"}),r.jsx("option",{value:"code id_token",children:"code id_token"}),r.jsx("option",{value:"code token",children:"code token"}),r.jsx("option",{value:"code token id_token",children:"code token id_token"})]})]}),r.jsxs(g,{children:[r.jsx(f,{children:"Client ID"}),r.jsx(b,{type:"text",value:t.clientId,onChange:e=>S("clientId",e.target.value),placeholder:"your_client_id"})]}),r.jsxs(g,{children:[r.jsx(f,{children:"Redirect URI"}),r.jsx(b,{type:"url",value:t.redirectUri,onChange:e=>S("redirectUri",e.target.value),placeholder:"https://yourapp.com/callback"})]}),r.jsxs(g,{children:[r.jsx(f,{children:"Scope"}),r.jsx(b,{type:"text",value:t.scope,onChange:e=>S("scope",e.target.value),placeholder:"openid profile email"})]}),r.jsxs(g,{children:[r.jsx(f,{children:"State"}),r.jsx(b,{type:"text",value:t.state,onChange:e=>S("state",e.target.value),placeholder:"random_state_123"})]}),r.jsxs(g,{children:[r.jsx(f,{children:"Nonce (OIDC)"}),r.jsx(b,{type:"text",value:t.nonce,onChange:e=>S("nonce",e.target.value),placeholder:"random_nonce_456"})]})]}),r.jsx(a,{flowKey:t.flowKey,responseType:t.responseType,redirectUri:t.redirectUri,clientId:t.clientId,scope:t.scope,state:t.state,nonce:t.nonce,readOnlyFlowContext:!1})]}),r.jsxs(x,{children:[r.jsxs(m,{children:[r.jsx(i,{size:20}),"Compatibility Matrix"]}),r.jsx(j,{children:"Understanding which response modes work best with different response types and flow types."}),r.jsxs(_,{children:[r.jsxs(z,{children:[r.jsx(I,{children:"Authorization Code Flow"}),r.jsxs(T,{children:[r.jsxs(F,{children:[r.jsx("strong",{children:"Query:"})," Standard, server-side handling"]}),r.jsxs(F,{children:[r.jsx("strong",{children:"Fragment:"})," Unusual, client-side handling"]}),r.jsxs(F,{children:[r.jsx("strong",{children:"Form POST:"})," Allowed by OIDC specification"]}),r.jsxs(F,{children:[r.jsx("strong",{children:"pi.flow:"})," PingOne proprietary"]})]})]}),r.jsxs(z,{children:[r.jsx(I,{children:"Implicit Flow"}),r.jsxs(T,{children:[r.jsxs(F,{children:[r.jsx("strong",{children:"Query:"})," Not recommended for tokens"]}),r.jsxs(F,{children:[r.jsx("strong",{children:"Fragment:"})," Recommended for SPAs"]}),r.jsxs(F,{children:[r.jsx("strong",{children:"Form POST:"})," Not standard for tokens"]}),r.jsxs(F,{children:[r.jsx("strong",{children:"pi.flow:"})," Requires server-side exchange"]})]})]}),r.jsxs(z,{children:[r.jsx(I,{children:"Hybrid Flow"}),r.jsxs(T,{children:[r.jsxs(F,{children:[r.jsx("strong",{children:"Query:"})," May expose tokens in logs"]}),r.jsxs(F,{children:[r.jsx("strong",{children:"Fragment:"})," Recommended for security"]}),r.jsxs(F,{children:[r.jsx("strong",{children:"Form POST:"})," Secure parameter transmission"]}),r.jsxs(F,{children:[r.jsx("strong",{children:"pi.flow:"})," Requires server-side exchange"]})]})]}),r.jsxs(z,{children:[r.jsx(I,{children:"Device Code Flow"}),r.jsxs(T,{children:[r.jsxs(F,{children:[r.jsx("strong",{children:"All modes:"})," Not applicable - no browser redirects"]}),r.jsx(F,{children:"Uses polling-based token exchange"}),r.jsx(F,{children:"No response mode selection needed"})]})]})]})]})]})})]})};export{R};
//# sourceMappingURL=pages-learn-BO-sUMQC.js.map
