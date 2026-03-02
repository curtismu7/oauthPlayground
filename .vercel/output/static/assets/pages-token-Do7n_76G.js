import{a as e,j as r,m as n,ad as t,F as s,n as i,i as o,ao as a,p as d}from"./react-vendor-HWZo9XlX.js";import{a as c}from"./styled-vendor-DGSsHzxd.js";import{k as l}from"./components-oauth-qq-maH2w.js";import{u as m}from"./v8u-services-CviCpCEt.js";import{h}from"./utils-lzKqcxFi.js";const g=c.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
`;c.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`,c.h1`
  color: #2d3748;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`,c.p`
  color: #4a5568;
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 0;
`;const p=c.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`,u=c.h2`
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,x=c.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`,f=c.li`
  background: #f7fafc;
  border-left: 4px solid #4299e1;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`,j=c.div`
  background: #4299e1;
  color: white;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
`,y=c.div`
  flex: 1;
`,b=c.h3`
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`,k=c.p`
  color: #4a5568;
  margin: 0;
  line-height: 1.5;
`,w=c.pre`
  background: #1a202c;
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 1rem 0;
  position: relative;
`,v=c.div`
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`,S=c.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: 1rem;
  gap: 1rem;
`,J=c.h4`
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
`,C=c.div`
  display: flex;
  gap: 0.5rem;
`,T=c.button`
  background: ${e=>{switch(e.$variant){case"primary":return"#4299e1";case"success":return"#48bb78";case"danger":return"#f56565";default:return"#e2e8f0"}}};
  color: ${e=>"secondary"===e.$variant?"#4a5568":"white"};
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`,W=c.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 1rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }
`,O=c.div`
  background: #1a202c;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-top: 1rem;
`,E=c.div`
  background: #2d3748;
  color: #e2e8f0;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
`,I=c.div`
  display: flex;
  align-items: center;
{{ ... }}
  gap: 0.5rem;
  font-weight: 500;
`,_=c.pre`
	background: #1a202c;
	color: #e2e8f0;
	padding: 1rem;
	line-height: 1.5;
	overflow-x: auto;
	max-height: ${({$isExpanded:e})=>e?"500px":"0"};
	overflow-y: ${({$isExpanded:e})=>e?"auto":"hidden"};
	transition: max-height 0.3s ease;
	white-space: pre-wrap;
	word-break: break-word;
`,$=c.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${e=>{switch(e.status){case"running":return"#4299e1";case"success":return"#48bb78";case"error":return"#f56565";default:return"#4a5568"}}};
`,z=c.div`
  background: #f7fafc;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`,K=c.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }
`,R=c.input`
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #48bb78;
`,D=c.label`
  color: #2d3748;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
`,P=c.a`
  color: #4299e1;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`,L=()=>{const c=e.useId(),[L,U]=e.useState(()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);if(r.credentials?.environmentId)return r.credentials.environmentId}}catch{return""}return""}),[A,F]=e.useState([]),[G,N]=e.useState(new Set),[B,M]=e.useState(new Set),q=e.useCallback(e=>{N(r=>{const n=new Set(r);return n.has(e)?n.delete(e):n.add(e),n})},[]);e.useCallback(e=>`${e.toLocaleDateString()}-${e.toLocaleTimeString()}`,[]);const V=e.useCallback(async(e,r)=>{try{await navigator.clipboard.writeText(e),h.showCopySuccess(r)}catch{h.showCopyError(r)}},[]);e.useEffect(()=>{const e=()=>{try{const e=m.loadCredentials();e?.environmentId&&!L.trim()&&U(e.environmentId)}catch(e){}};return window.addEventListener("workerTokenUpdated",e),()=>{window.removeEventListener("workerTokenUpdated",e)}},[L]);const H=e.useCallback(async(e,r)=>{if(!B.has(e)){M(r=>new Set(r).add(e));try{const r=await fetch(e,{method:"GET",headers:{Accept:"application/json"}});let n,t;if(r.ok){const e=await r.text();try{const r=JSON.parse(e);n=JSON.stringify(r,null,2),t="success"}catch{n=e,t="success"}}else n=`HTTP ${r.status}: ${r.statusText}\n\n${await r.text()}`,t="error";const s={command:`GET ${e}`,output:n,status:t,timestamp:new Date};F(e=>[s,...e]),"success"===t?h.showSuccess("JWKS command executed successfully - check results below"):h.showError("networkError")}catch(n){const r={command:`GET ${e}`,output:`Network Error: ${n instanceof Error?n.message:"Failed to make request"}`,status:"error",timestamp:new Date};F(e=>[r,...e]),h.showError("networkError")}finally{M(r=>{const n=new Set(r);return n.delete(e),n})}}},[B]),Q=[{title:"Get JWKS from PingOne",url:"https://auth.pingone.com/{environmentId}/as/jwks",description:"Fetch JWKS from PingOne"},{title:"Get OIDC Configuration",url:"https://auth.pingone.com/{environmentId}/as/.well-known/openid_configuration",description:"Get OIDC configuration to find jwks_uri"},{title:"Get JWKS (Alternative Format)",url:"https://auth.pingone.com/{environmentId}/as/jwks",description:"Fetch JWKS with JSON formatting"}];return r.jsxs(g,{children:[r.jsx(l,{flowType:"jwks-troubleshooting"}),r.jsxs(p,{children:[r.jsxs(u,{children:[r.jsx(n,{}),"Common JWKS Format Issues"]}),r.jsxs(x,{children:[r.jsxs(f,{children:[r.jsx(j,{children:"1"}),r.jsxs(y,{children:[r.jsx(b,{children:"Missing Required Fields"}),r.jsxs(k,{children:["Ensure each key has these mandatory fields: ",r.jsx("strong",{children:"kty"}),' (Key Type - usually "RSA"),',r.jsx("strong",{children:"kid"})," (Key ID - unique identifier), ",r.jsx("strong",{children:"n"})," (Modulus), and",r.jsx("strong",{children:"e"}),' (Exponent - usually "AQAB").']})]})]}),r.jsxs(f,{children:[r.jsx(j,{children:"2"}),r.jsxs(y,{children:[r.jsx(b,{children:"Incorrect Root Structure"}),r.jsxs(k,{children:['Must have "keys" array at root level. The structure should be:',r.jsx(w,{children:'{\n  "keys": [\n    // ... key objects here\n  ]\n}'})]})]})]}),r.jsxs(f,{children:[r.jsx(j,{children:"3"}),r.jsxs(y,{children:[r.jsx(b,{children:"Invalid Base64URL Encoding"}),r.jsxs(k,{children:["The n and e values must be Base64URL encoded (not standard Base64):",r.jsxs("ul",{style:{marginTop:"0.5rem",paddingLeft:"1.5rem"},children:[r.jsx("li",{children:"No padding (=)"}),r.jsx("li",{children:"Use - instead of +"}),r.jsx("li",{children:"Use _ instead of /"})]})]})]})]})]})]}),r.jsxs(p,{children:[r.jsxs(u,{children:[r.jsx(t,{}),"PingOne JWKS Commands"]}),r.jsxs("div",{style:{marginBottom:"1.5rem"},children:[r.jsx("label",{htmlFor:c,style:{display:"block",marginBottom:"0.5rem",fontWeight:"500",color:"#2d3748"},children:"Environment ID:"}),r.jsx(W,{id:c,type:"text",placeholder:"Enter your PingOne Environment ID",value:L,onChange:e=>U(e.target.value)})]}),Q.map(e=>{const n=e.url.replace("{environmentId}",L);return r.jsxs(v,{children:[r.jsxs(S,{children:[r.jsx(J,{children:e.title}),r.jsxs(C,{children:[r.jsxs(T,{$variant:"primary",onClick:()=>H(n,e.description),disabled:!L||B.has(n),children:[r.jsx(t,{}),B.has(n)?"Loading...":"Execute"]}),r.jsxs(T,{$variant:"secondary",onClick:()=>V(n,"URL"),children:[r.jsx(s,{}),"Copy URL"]})]})]}),r.jsx(w,{children:n})]},e.title)}),r.jsxs("div",{style:{marginTop:"2rem",padding:"1rem",background:"#edf2f7",borderRadius:"0.5rem"},children:[r.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#2d3748"},children:"Regional Endpoints:"}),r.jsxs("p",{style:{margin:"0",color:"#4a5568",fontSize:"0.9rem"},children:[r.jsx("strong",{children:"EU:"})," https://auth.pingone.eu/","{environmentId}","/as/jwks",r.jsx("br",{}),r.jsx("strong",{children:"CA:"})," https://auth.pingone.ca/","{environmentId}","/as/jwks",r.jsx("br",{}),r.jsx("strong",{children:"AP:"})," https://auth.pingone.asia/","{environmentId}","/as/jwks"]})]})]}),A.length>0&&r.jsxs(p,{children:[r.jsxs(u,{children:[r.jsx(i,{}),"Command Results"]}),A.map(e=>{const t=`${e.timestamp.getTime()}-${e.command}`;return r.jsx("div",{style:{marginBottom:"1rem"},children:r.jsxs(O,{children:[r.jsxs(E,{onClick:()=>q(t),children:[r.jsxs(I,{children:[G.has(t)?r.jsx(o,{}):r.jsx(a,{}),r.jsxs($,{status:e.status,children:["success"===e.status?r.jsx(i,{}):r.jsx(n,{}),"success"===e.status?"Success":"Error"]}),r.jsx("span",{style:{marginLeft:"1rem",fontSize:"0.875rem",color:"#a0aec0"},children:e.timestamp.toLocaleTimeString()})]}),r.jsxs(T,{$variant:"secondary",onClick:r=>{r.stopPropagation(),V(e.output,"Output")},style:{fontSize:"0.75rem",padding:"0.25rem 0.5rem"},children:[r.jsx(s,{}),"Copy"]})]}),r.jsx(_,{$isExpanded:G.has(t),children:e.output})]})},t)})]}),r.jsxs(p,{children:[r.jsxs(u,{children:[r.jsx(i,{}),"Validation Checklist"]}),r.jsx(z,{children:['Root object has "keys" array',"Each key has kty, kid, n, e fields","n and e are valid Base64URL (no =, +, /)","kid values are unique","JSON is properly formatted","No extra commas or syntax errors"].map(e=>{const n=e.toLowerCase().replace(/[^a-z0-9]+/g,"-");return r.jsxs(K,{children:[r.jsx(R,{type:"checkbox",id:`checklist-${n}`}),r.jsx(D,{htmlFor:`checklist-${n}`,children:e})]},n)})})]}),r.jsxs(p,{children:[r.jsxs(u,{children:[r.jsx(d,{}),"Additional Resources"]}),r.jsxs("div",{style:{display:"grid",gap:"1rem"},children:[r.jsxs("div",{style:{padding:"1rem",background:"#f7fafc",borderRadius:"0.5rem"},children:[r.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#2d3748"},children:"Ping JWT Decoder:"}),r.jsxs("p",{style:{margin:"0 0 0.5rem 0",color:"#4a5568"},children:[r.jsx(P,{href:"https://jwt-decoder.pingidentity.com/",target:"_blank",rel:"noopener noreferrer",children:"Ping JWT Decoder"})," ","- Decode and validate JWT tokens with PingOne keys"]}),r.jsx("p",{style:{margin:"0",fontSize:"0.875rem",color:"#6b7280"},children:"Official Ping Identity tool for decoding JWT tokens and validating signatures using PingOne JWKS endpoints."})]}),r.jsxs("div",{style:{padding:"1rem",background:"#f7fafc",borderRadius:"0.5rem"},children:[r.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#2d3748"},children:"PingOne SSO Documentation:"}),r.jsxs("div",{style:{display:"grid",gap:"0.5rem"},children:[r.jsxs("p",{style:{margin:"0",color:"#4a5568"},children:[r.jsx(P,{href:"https://docs.pingidentity.com/bundle/pingone/page/zhc1564020488549.html",target:"_blank",rel:"noopener noreferrer",children:"PingOne JWKS Configuration"})," ","- Configure JWKS endpoints in PingOne"]}),r.jsxs("p",{style:{margin:"0",color:"#4a5568"},children:[r.jsx(P,{href:"https://docs.pingidentity.com/bundle/pingone/page/zhc1564020488549.html#zhc1564020488549__section_zhc1564020488549__section_zhc1564020488549",target:"_blank",rel:"noopener noreferrer",children:"Private Key JWT Authentication"})," ","- Set up private key JWT authentication"]}),r.jsxs("p",{style:{margin:"0",color:"#4a5568"},children:[r.jsx(P,{href:"https://docs.pingidentity.com/bundle/pingone/page/zhc1564020488549.html#zhc1564020488549__section_zhc1564020488549__section_zhc1564020488549",target:"_blank",rel:"noopener noreferrer",children:"OIDC Discovery Endpoint"})," ","- Use OIDC discovery to find JWKS URI"]})]}),r.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.875rem",color:"#6b7280"},children:"Official Ping Identity documentation for configuring and troubleshooting JWKS in PingOne SSO."})]}),r.jsxs("div",{style:{padding:"1rem",background:"#f7fafc",borderRadius:"0.5rem"},children:[r.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#2d3748"},children:"Online Validators:"}),r.jsxs("div",{style:{display:"grid",gap:"0.5rem"},children:[r.jsxs("p",{style:{margin:"0",color:"#4a5568"},children:[r.jsx(P,{href:"https://jwt.io",target:"_blank",rel:"noopener noreferrer",children:"JWT.io Debugger"})," ","- Test your JWKS format and decode JWT tokens"]}),r.jsxs("p",{style:{margin:"0",color:"#4a5568"},children:[r.jsx(P,{href:"https://mkjwk.org/",target:"_blank",rel:"noopener noreferrer",children:"MKJWK Generator"})," ","- Generate test JWKS for development"]})]})]}),r.jsxs("div",{style:{padding:"1rem",background:"#f7fafc",borderRadius:"0.5rem"},children:[r.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#2d3748"},children:"RFC Standards:"}),r.jsxs("div",{style:{display:"grid",gap:"0.5rem"},children:[r.jsxs("p",{style:{margin:"0",color:"#4a5568"},children:[r.jsx(P,{href:"https://tools.ietf.org/html/rfc7517",target:"_blank",rel:"noopener noreferrer",children:"RFC 7517 - JSON Web Key (JWK)"})," ","- JWKS specification"]}),r.jsxs("p",{style:{margin:"0",color:"#4a5568"},children:[r.jsx(P,{href:"https://tools.ietf.org/html/rfc7518",target:"_blank",rel:"noopener noreferrer",children:"RFC 7518 - JSON Web Algorithms (JWA)"})," ","- JWT algorithms specification"]}),r.jsxs("p",{style:{margin:"0",color:"#4a5568"},children:[r.jsx(P,{href:"https://openid.net/specs/openid-connect-discovery-1_0.html",target:"_blank",rel:"noopener noreferrer",children:"OIDC Discovery"})," ","- OpenID Connect Discovery specification"]})]})]})]})]})]})},U=()=>r.jsxs("div",{style:{padding:"2rem",textAlign:"center"},children:[r.jsx("h2",{children:"Token Management"}),r.jsx("p",{children:"Token Management is currently under maintenance."}),r.jsx("button",{type:"button",onClick:()=>window.history.back(),children:"Go Back"})]});export{L as J,U as T};
//# sourceMappingURL=pages-token-Do7n_76G.js.map
