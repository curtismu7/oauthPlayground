import{j as e,a2 as n,l as r,_ as i,Y as s,v as t,Q as o}from"./react-vendor-HWZo9XlX.js";import{I as d}from"./components-steps-BQ6HbS5x.js";import{a as l}from"./styled-vendor-DGSsHzxd.js";const a=({controller:l})=>{const{credentials:a,setCredentials:c,saveCredentials:h,hasCredentialsSaved:p,hasUnsavedCredentialChanges:m,isSavingCredentials:x,isAuthenticating:f,authenticateUser:u,tokens:g,userInfo:y,isFetchingUserInfo:j,fetchUserInfo:b,refreshTokens:w,refreshedTokens:k,isRefreshingTokens:v,resetFlow:S,hasStepResult:I,saveStepResult:D,stepManager:C}=l;return[{id:"setup-credentials",title:"Setup Mock Credentials",description:"Configure mock PingOne credentials and user credentials for the simulation",icon:e.jsx(n,{}),content:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1.5rem"},children:[e.jsx(d,{type:"warning",children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:[e.jsx("strong",{children:"⚠️ Mock Implementation Notice"}),e.jsx("span",{children:"This is a simulated flow for educational purposes. No real authentication occurs. PingOne does not support the Resource Owner Password flow."})]})}),e.jsxs("div",{style:{display:"grid",gap:"1rem"},children:[e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:500},children:"Mock Environment ID"}),e.jsx("input",{type:"text",value:a.environmentId,onChange:e=>c({...a,environmentId:e.target.value}),style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"1rem"},placeholder:"mock-env-12345"})]}),e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:500},children:"Mock Client ID"}),e.jsx("input",{type:"text",value:a.clientId,onChange:e=>c({...a,clientId:e.target.value}),style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"1rem"},placeholder:"mock-client-id"})]}),e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:500},children:"Mock Client Secret"}),e.jsx("input",{type:"password",value:a.clientSecret,onChange:e=>c({...a,clientSecret:e.target.value}),style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"1rem"},placeholder:"mock-client-secret"})]}),e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:500},children:"Mock Username"}),e.jsx("input",{type:"text",value:a.username,onChange:e=>c({...a,username:e.target.value}),style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"1rem"},placeholder:"demo@example.com"})]}),e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:500},children:"Mock Password"}),e.jsx("input",{type:"password",value:a.password,onChange:e=>c({...a,password:e.target.value}),style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"1rem"},placeholder:"demo-password"})]})]})]}),canExecute:Boolean(a.environmentId&&a.clientId&&a.username&&a.password&&!x)&&(!p||m),buttonText:x?"Saving...":p&&!m?"Saved":"Save Mock Configuration",execute:async()=>{await h(),D("setup-credentials",{credentials:a}),C.setStep(1,"credentials saved")},completed:I("setup-credentials")},{id:"authenticate-user",title:"Direct User Authentication",description:"Simulate direct username/password authentication (the security risk of this flow)",icon:e.jsx(i,{}),content:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1.5rem"},children:[e.jsx(d,{type:"error",children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:[e.jsx("strong",{children:"🚨 Security Risk Demonstration"}),e.jsx("span",{children:"In a real Resource Owner Password flow, the application would collect and transmit the user's actual credentials. This creates significant security vulnerabilities."})]})}),e.jsxs("div",{style:{background:"#f8f9fa",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #e9ecef"},children:[e.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#495057"},children:"Mock Authentication Request"}),e.jsx("pre",{style:{margin:0,fontSize:"0.875rem",color:"#6c757d",whiteSpace:"pre-wrap"},children:`POST /as/token HTTP/1.1\nHost: auth.pingone.com\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=password\n&username=${a.username}\n&password=***HIDDEN***\n&client_id=${a.clientId}\n&client_secret=***HIDDEN***\n&scope=openid profile email`})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",color:"#dc3545"},children:[e.jsx(r,{}),e.jsx("span",{style:{fontSize:"0.875rem"},children:"This step simulates the dangerous practice of sending user credentials directly to the token endpoint."})]})]}),canExecute:Boolean(a.username&&a.password&&!f),buttonText:f?"Authenticating...":"Simulate Authentication",onExecute:async()=>{await u(),D("authenticate-user",{tokens:g})},completed:Boolean(g)},{id:"token-response",title:"OIDC Token Response",description:"Review the mock tokens returned by the authorization server",icon:e.jsx(s,{}),content:e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"1.5rem"},children:g?e.jsxs(e.Fragment,{children:[e.jsx(d,{type:"success",children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:[e.jsx("strong",{children:"✅ Mock Tokens Generated"}),e.jsx("span",{children:"The mock authorization server has returned OIDC tokens including an ID token with user identity claims."})]})}),e.jsxs("div",{style:{background:"#f8f9fa",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #e9ecef"},children:[e.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#495057"},children:"Mock Token Response"}),e.jsx("pre",{style:{margin:0,fontSize:"0.875rem",color:"#6c757d",whiteSpace:"pre-wrap"},children:JSON.stringify(g,null,2)})]}),e.jsxs("div",{style:{display:"grid",gap:"0.5rem",fontSize:"0.875rem"},children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Access Token:"})," Used to access protected resources"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"ID Token:"})," Contains user identity information (OIDC extension)"]}),g.refresh_token&&e.jsxs("div",{children:[e.jsx("strong",{children:"Refresh Token:"})," Used to obtain new access tokens"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Expires In:"})," ",g.expires_in," seconds"]})]})]}):e.jsx(d,{type:"info",children:e.jsx("span",{children:"Complete the authentication step to see the mock token response."})})}),canExecute:!1,buttonText:"View Tokens",onExecute:async()=>{D("token-response",{viewed:!0}),C.setStep(3,"tokens viewed")},completed:Boolean(g)},{id:"fetch-userinfo",title:"Fetch User Information",description:"Use the access token to fetch user information from the UserInfo endpoint",icon:e.jsx(n,{}),content:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1.5rem"},children:[e.jsx(d,{type:"info",children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:[e.jsx("strong",{children:"OIDC UserInfo Endpoint"}),e.jsx("span",{children:"OIDC extends OAuth 2.0 with a standardized UserInfo endpoint that returns user profile information using the access token."})]})}),y?e.jsxs("div",{style:{background:"#f8f9fa",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #e9ecef"},children:[e.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#495057"},children:"Mock User Information"}),e.jsx("pre",{style:{margin:0,fontSize:"0.875rem",color:"#6c757d",whiteSpace:"pre-wrap"},children:JSON.stringify(y,null,2)})]}):e.jsxs("div",{style:{background:"#f8f9fa",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #e9ecef"},children:[e.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#495057"},children:"Mock UserInfo Request"}),e.jsx("pre",{style:{margin:0,fontSize:"0.875rem",color:"#6c757d",whiteSpace:"pre-wrap"},children:`GET /as/userinfo HTTP/1.1\nHost: auth.pingone.com\nAuthorization: Bearer ${g?.access_token?.substring(0,20)}...`})]})]}),canExecute:Boolean(g?.access_token&&!j),buttonText:j?"Fetching...":"Fetch User Info",onExecute:async()=>{await b(),D("fetch-userinfo",{userInfo:y})},completed:Boolean(y)},{id:"refresh-tokens",title:"Refresh Tokens",description:"Use the refresh token to obtain new access tokens",icon:e.jsx(t,{}),content:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1.5rem"},children:[e.jsx(d,{type:"info",children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:[e.jsx("strong",{children:"Token Refresh"}),e.jsx("span",{children:"Refresh tokens allow applications to obtain new access tokens without requiring the user to re-authenticate."})]})}),k?e.jsxs("div",{style:{background:"#f8f9fa",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #e9ecef"},children:[e.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#495057"},children:"Refreshed Tokens"}),e.jsx("pre",{style:{margin:0,fontSize:"0.875rem",color:"#6c757d",whiteSpace:"pre-wrap"},children:JSON.stringify(k,null,2)})]}):e.jsxs("div",{style:{background:"#f8f9fa",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #e9ecef"},children:[e.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#495057"},children:"Mock Refresh Request"}),e.jsx("pre",{style:{margin:0,fontSize:"0.875rem",color:"#6c757d",whiteSpace:"pre-wrap"},children:`POST /as/token HTTP/1.1\nHost: auth.pingone.com\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=refresh_token\n&refresh_token=${g?.refresh_token?.substring(0,20)}...\n&client_id=${a.clientId}\n&client_secret=***HIDDEN***`})]})]}),canExecute:Boolean(g?.refresh_token&&!v),buttonText:v?"Refreshing...":"Refresh Tokens",onExecute:async()=>{await w(),D("refresh-tokens",{refreshedTokens:k})},completed:Boolean(k)},{id:"flow-summary",title:"Flow Summary & Security Analysis",description:"Review what happened and understand the security implications",icon:e.jsx(o,{}),content:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1.5rem"},children:[e.jsx(d,{type:"warning",children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:[e.jsx("strong",{children:"🔍 What We Demonstrated"}),e.jsx("span",{children:"This mock flow showed how OIDC Resource Owner Password would work, including the security risks and OIDC extensions like ID tokens and UserInfo."})]})}),e.jsxs("div",{style:{display:"grid",gap:"1rem"},children:[e.jsxs("div",{style:{padding:"1rem",background:"#fef2f2",borderRadius:"0.5rem",border:"1px solid #fecaca"},children:[e.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#dc2626"},children:"Security Risks Demonstrated"}),e.jsxs("ul",{style:{margin:0,paddingLeft:"1.25rem",color:"#991b1b"},children:[e.jsx("li",{children:"Application handles user passwords directly"}),e.jsx("li",{children:"Credentials transmitted over network"}),e.jsx("li",{children:"No delegation to authorization server"}),e.jsx("li",{children:"Phishing attacks become easier"}),e.jsx("li",{children:"Loss of SSO and MFA benefits"})]})]}),e.jsxs("div",{style:{padding:"1rem",background:"#f0fdf4",borderRadius:"0.5rem",border:"1px solid #bbf7d0"},children:[e.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#059669"},children:"OIDC Extensions Shown"}),e.jsxs("ul",{style:{margin:0,paddingLeft:"1.25rem",color:"#047857"},children:[e.jsx("li",{children:"ID tokens with user identity claims"}),e.jsx("li",{children:"UserInfo endpoint for additional profile data"}),e.jsx("li",{children:"Standardized OIDC scopes (openid, profile, email)"}),e.jsx("li",{children:"Token refresh capabilities"})]})]}),e.jsxs("div",{style:{padding:"1rem",background:"#eff6ff",borderRadius:"0.5rem",border:"1px solid #bfdbfe"},children:[e.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#1d4ed8"},children:"Recommended Alternatives"}),e.jsxs("ul",{style:{margin:0,paddingLeft:"1.25rem",color:"#1e40af"},children:[e.jsx("li",{children:"OIDC Authorization Code Flow with PKCE"}),e.jsx("li",{children:"OIDC Device Code Flow for limited input devices"}),e.jsx("li",{children:"OIDC Client Credentials for server-to-server"}),e.jsx("li",{children:"Any flow that doesn't require direct credential handling"})]})]})]}),e.jsx("button",{onClick:S,style:{padding:"0.75rem 1.5rem",background:"#6b7280",color:"white",border:"none",borderRadius:"0.5rem",cursor:"pointer",fontSize:"1rem"},children:"Reset Flow"})]}),canExecute:!1,buttonText:"Complete",onExecute:async()=>{D("flow-summary",{completed:!0})},completed:Boolean(g&&y)}]},c=l.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,h=l.section`
  background: linear-gradient(135deg, #1f2937 0%, #0f172a 100%);
  color: white;
  border-radius: 1.5rem;
  padding: 3rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.45);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.45), transparent 45%);
    pointer-events: none;
  }
`,p=l.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 800px;
`,m=l.h1`
  font-size: 2.75rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.03em;
`,x=l.p`
  margin: 0;
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
`,f=l.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
`,u=l.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  background: rgba(15, 118, 110, 0.18);
  color: #6ee7b7;
  border-radius: 999px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`,g=l.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 2rem;

  @media (max-width: ${({theme:e})=>e.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`,y=l.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`,j=l.aside`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
  padding: 1.75rem;
  position: sticky;
  top: 7rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;

  @media (max-width: ${({theme:e})=>e.breakpoints.lg}) {
    position: static;
    max-height: none;
  }
`,b=l.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
`,w=l.div`
  background: ${({$tone:e})=>{switch(e){case"success":return"linear-gradient(135deg, #ecfdf5, #d1fae5)";case"warning":return"linear-gradient(135deg, #fffbeb, #fef3c7)";case"danger":return"linear-gradient(135deg, #fef2f2, #fee2e2)";default:return"linear-gradient(135deg, #eff6ff, #dbeafe)"}}};
  border-radius: 1rem;
  padding: 1.35rem;
  box-shadow: 0 14px 30px rgba(59, 130, 246, 0.12);
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`,k=l.div`
  font-size: 1.45rem;
  line-height: 1;
  color: #1d4ed8;
`,v=l.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #334155;
    line-height: 1.6;
    font-size: 0.95rem;
  }
`,S=({title:n,subtitle:r,description:i,badge:s,headerActions:t,highlights:o,education:d,children:l})=>e.jsxs(c,{children:[e.jsx(h,{children:e.jsxs(p,{children:[s?e.jsx(u,{children:s}):null,e.jsx(m,{children:n}),r?e.jsx(x,{children:r}):null,e.jsx(x,{children:i}),t?e.jsx(f,{children:t}):null]})}),o&&o.length>0?e.jsx(b,{children:o.map(n=>e.jsxs(w,{$tone:n.tone??"info",children:[n.icon?e.jsx(k,{children:n.icon}):null,e.jsxs(v,{children:[e.jsx("h3",{children:n.title}),e.jsx("p",{children:n.description})]})]},n.title))}):null,e.jsxs(g,{children:[e.jsx(y,{children:l}),d?e.jsx(j,{children:d}):null]})]});export{S as F,a as c};
//# sourceMappingURL=components-flow-BH3Bx-YA.js.map
