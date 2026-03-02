import{B as e,u as o,j as r,aD as t,Q as s,Y as n}from"./react-vendor-HWZo9XlX.js";import{a as i}from"./styled-vendor-DGSsHzxd.js";import{r as a,S as m}from"./v8-components-8swtZwHb.js";import{T as d}from"./v8u-components-COnDGHJS.js";import"./vendor-CvVeuJe7.js";import"./v8-services-DHsPM8a2.js";import"./utils-lzKqcxFi.js";import"./components-credentials-T7jmF3zx.js";import"./components-oauth-qq-maH2w.js";import"./v8u-services-CviCpCEt.js";import"./v8-utils-BU6AoW1l.js";import"./components-flow-core-y1x-SJYd.js";import"./components-token-uXxDPBqK.js";import"./oauth-flows-device-CMULWbHZ.js";import"./pages-ai-D2KhTcan.js";import"./pages-DE-6TDOE.js";import"./components-oauth-authorize-sao_-EgS.js";import"./components-oauth-discovery-DYbdhNwI.js";import"./pages-pingone-BLdy8FiO.js";import"./oauth-flows-authcode-ltS0AxHA.js";import"./components-oauth-par-B-NhQsyD.js";import"./oauth-flows-BoQiEZ27.js";import"./oauth-flows-par-DTJ0aZ64.js";import"./oauth-flows-implicit-BlAJpg9o.js";import"./pages-docs-nYnYMLbe.js";import"./components-flow-BH3Bx-YA.js";import"./components-steps-BQ6HbS5x.js";import"./components-ui-DbX9aVva.js";import"./components-oauth-client-BhjYl9xl.js";import"./v8-hooks-B7CjPGrP.js";import"./v8-flows-CbgB_G0p.js";const p=i.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
	background: #f9fafb;
	min-height: 100vh;
`,l=i.div`
	background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
	color: white;
	padding: 1.75rem 2rem;
	border-radius: 0.75rem;
	margin-bottom: 2rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0;
	}

	p {
		margin: 0;
		font-size: 0.95rem;
		opacity: 0.95;
		max-width: 800px;
	}
`,c=i.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
	padding: 0.5rem 1rem;
	background: #e5e7eb;
	border-radius: 999px;
	border: none;
	cursor: pointer;
	font-size: 0.875rem;
	color: #374151;
	transition: background 0.2s ease;

	&:hover {
		background: #d1d5db;
	}
`,f=i.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	margin-left: 0.75rem;
	margin-bottom: 1rem;
	padding: 0.5rem 1rem;
	background: #2563eb;
	border-radius: 999px;
	border: none;
	cursor: pointer;
	font-size: 0.875rem;
	color: #ffffff;
	transition: background 0.2s ease;

	&:hover {
		background: #1d4ed8;
	}
`,u=i.div`
	background: #ffffff;
	border-radius: 0.75rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,g=i.div`
	text-align: center;
	padding: 2rem 1.5rem;
	color: #4b5563;
`,h=()=>{const i=e(),h=(o().state||{}).tokens;let j=null;return h&&(j={accessToken:h.accessToken},h.idToken&&(j.idToken=h.idToken),h.refreshToken&&(j.refreshToken=h.refreshToken),"number"==typeof h.expiresIn&&(j.expiresIn=h.expiresIn)),r.jsxs(p,{children:[r.jsxs("div",{style:{display:"flex",alignItems:"center"},children:[r.jsxs(c,{type:"button",onClick:()=>i("/v8u/spiffe-spire"),children:[r.jsx(t,{size:16})," Back to SPIFFE/SPIRE Flow"]}),r.jsx(f,{type:"button",onClick:()=>i("/v8u/spiffe-spire"),children:"Reset SPIFFE/SPIRE Flow"})]}),r.jsxs(l,{children:[r.jsxs("h1",{children:[r.jsx(s,{})," SPIFFE → PingOne Token Viewer"]}),r.jsx("p",{children:"View and explore the OAuth/OIDC tokens issued after exchanging a SPIFFE SVID. Decode JWTs, inspect claims, and copy tokens for testing."})]}),r.jsx(a,{currentPage:"hub",showRestartFlow:!1,showBackToMain:!0}),j?r.jsxs(u,{children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"},children:[r.jsx(n,{size:18,color:"#1f2937"}),r.jsx("span",{style:{fontWeight:600,fontSize:"0.95rem",color:"#1f2937"},children:"Tokens issued for your SPIFFE-identified workload"})]}),r.jsx("p",{style:{fontSize:"0.85rem",color:"#6b7280",marginBottom:"1rem"},children:"These tokens are not long-lived secrets baked into your app. They were issued after SPIRE attested your workload using its SPIFFE ID and then exchanged the SVID for OAuth/OIDC tokens."}),r.jsx(d,{tokens:j,showDecodeButtons:!0,showCopyButtons:!0,showMaskToggle:!1})]}):r.jsx(u,{children:r.jsxs(g,{children:[r.jsx("p",{style:{marginBottom:"0.5rem",fontWeight:600},children:"No tokens available to display"}),r.jsx("p",{style:{marginBottom:"0.75rem",fontSize:"0.9rem"},children:"Run the SPIFFE/SPIRE flow first to generate tokens. After the token exchange step, you'll be sent here automatically with fresh tokens."}),r.jsx("button",{type:"button",onClick:()=>i("/v8u/spiffe-spire"),style:{padding:"0.5rem 1.25rem",borderRadius:"999px",border:"none",background:"#2563eb",color:"#ffffff",fontSize:"0.875rem",fontWeight:500,cursor:"pointer"},children:"Go to SPIFFE/SPIRE Flow"})]})}),r.jsx(m,{}),r.jsx("div",{style:{display:"flex",justifyContent:"center",marginTop:"3rem",marginBottom:"2rem"},children:r.jsxs("button",{type:"button",onClick:()=>i("/v8u/spiffe-spire"),style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.75rem 1.5rem",background:"#2563eb",color:"#ffffff",border:"none",borderRadius:"0.5rem",fontSize:"0.875rem",fontWeight:500,cursor:"pointer",transition:"background 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.background="#1d4ed8"},onMouseLeave:e=>{e.currentTarget.style.background="#2563eb"},children:[r.jsx(t,{size:16}),"Start Over"]})})]})};export{h as default};
//# sourceMappingURL=SpiffeSpireTokenDisplayV8U-BRi9EEKG.js.map
