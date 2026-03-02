const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/v8-utils-BU6AoW1l.js","assets/utils-lzKqcxFi.js","assets/react-vendor-HWZo9XlX.js","assets/vendor-CvVeuJe7.js","assets/vendor-54DrP_uy.css","assets/components-credentials-T7jmF3zx.js","assets/styled-vendor-DGSsHzxd.js","assets/components-oauth-qq-maH2w.js","assets/v8u-services-CviCpCEt.js","assets/v8-services-DHsPM8a2.js","assets/v8-components-8swtZwHb.js","assets/v8u-components-COnDGHJS.js","assets/components-flow-core-y1x-SJYd.js","assets/components-token-uXxDPBqK.js","assets/oauth-flows-device-CMULWbHZ.js","assets/pages-ai-D2KhTcan.js","assets/pages-DE-6TDOE.js","assets/components-oauth-authorize-sao_-EgS.js","assets/components-oauth-discovery-DYbdhNwI.js","assets/pages-pingone-BLdy8FiO.js","assets/oauth-flows-authcode-ltS0AxHA.js","assets/components-oauth-par-B-NhQsyD.js","assets/oauth-flows-BoQiEZ27.js","assets/oauth-flows-par-DTJ0aZ64.js","assets/oauth-flows-implicit-BlAJpg9o.js","assets/pages-docs-nYnYMLbe.js","assets/components-flow-BH3Bx-YA.js","assets/components-steps-BQ6HbS5x.js","assets/components-ui-DbX9aVva.js","assets/components-oauth-client-BhjYl9xl.js","assets/components-flow-core-DEegsKK7.css","assets/v8-hooks-B7CjPGrP.js","assets/v8-flows-CbgB_G0p.js","assets/v8-flows-Bwbl_h2s.css"])))=>i.map(i=>d[i]);
import{B as e,a as t,j as n,G as r,Q as i,p as s,U as o,Y as a,n as l,k as d,F as c,a$ as p,u,V as f,i as h}from"./react-vendor-HWZo9XlX.js";import{a as g}from"./styled-vendor-DGSsHzxd.js";import{a as m,F as x,g as b,l as y,r as w,u as v,i as k}from"./v8u-services-CviCpCEt.js";import{r as I,S as j,P as S,b as T,c as E,a6 as A,a7 as C,a as P}from"./v8-components-8swtZwHb.js";import{E as D,m as F,C as O,a as U,S as R,r as _,d as V,p as M,u as L}from"./v8-services-DHsPM8a2.js";import{_ as z}from"./utils-lzKqcxFi.js";import{u as $}from"./pages-ai-D2KhTcan.js";import{M as B,l as W,d as K,j as N,U as G,S as Q,F as H,m as Y,n as J,o as q,p as X,q as Z}from"./v8u-components-COnDGHJS.js";import{t as ee}from"./v8-utils-BU6AoW1l.js";import{S as te}from"./components-credentials-T7jmF3zx.js";import{ag as ne,ah as re}from"./components-oauth-qq-maH2w.js";const ie=g.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: 2rem;
	background: #f9fafb; // Light grey background
	min-height: 100vh;
`,se=g.div`
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 2rem;
	border-radius: 0.75rem;
	margin-bottom: 2rem;
	text-align: center;

	h1 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	p {
		font-size: 1rem;
		opacity: 0.95;
		max-width: 800px;
		margin: 0 auto;
	}
`,oe=g.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 2rem;
	margin-bottom: 2rem;
	animation: fadeIn 0.5s ease-in-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`,ae=g.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 999;
	animation: fadeIn 0.3s ease-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`,le=g.div`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 2rem 3rem;
	border-radius: 1rem;
	font-size: 1.5rem;
	font-weight: 700;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	z-index: 1000;
	animation: phaseSlideIn 0.5s ease-out;
	display: flex;
	align-items: center;
	gap: 1rem;

	@keyframes phaseSlideIn {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.8);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	svg {
		font-size: 2rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`,de=g.div`
	background: #ffffff; // White background for cards
	border-radius: 0.75rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,ce=g.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid #e5e7eb; // Border grey

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937; // Dark text on light background
		margin: 0;
	}

	svg {
		font-size: 1.75rem;
		color: #667eea;
	}
`,pe=g.div`
	margin-bottom: 1.5rem;
`,ue=g.label`
	display: block;
	font-weight: 500;
	color: #374151; // Secondary dark text
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`,fe=g.div`
	font-size: 0.75rem;
	color: #6b7280; // Muted text
	margin-top: 0.25rem;
	font-weight: 600;
	
	strong {
		color: #1f2937; // Dark text for emphasis
	}
`,he=g.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db; // Grey border
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: #1f2937; // Dark text
	background: #ffffff; // White input
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	&:disabled {
		background: #f3f4f6; // Slightly darker grey for disabled
		color: #6b7280; // Muted text
		cursor: not-allowed;
	}
`,ge=g.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: #1f2937; // Dark text
	background: #ffffff; // White background
	cursor: pointer;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}
`,me=g.button`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 500;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	border: none;

	${e=>"primary"===e.$variant?"\n\t\tbackground: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n\t\tcolor: white;\n\t\t&:hover {\n\t\t\ttransform: translateY(-2px);\n\t\t\tbox-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);\n\t\t}\n\t":"\n\t\tbackground: #f3f4f6; // Light grey\n\t\tcolor: #374151; // Dark text\n\t\t&:hover {\n\t\t\tbackground: #e5e7eb;\n\t\t}\n\t"}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
	}
`,xe=g.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 2rem;
	padding: 1rem;
	background: #ffffff; // White background
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,be=g.div`
	flex: 1;
	padding: 1rem;
	border-radius: 0.5rem;
	text-align: center;
	font-weight: 600;
	font-size: 0.875rem;
	transition: all 0.3s ease-in-out;
	position: relative;
	cursor: default;
	
	${e=>e.$completed?"\n\t\t\t\tbackground: #d1fae5; // Light green\n\t\t\t\tcolor: #065f46; // Dark green text\n\t\t\t\tborder: 3px solid #22c55e;\n\t\t\t\tbox-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);\n\t\t\t\ttransform: scale(1.02);\n\t\t\t\t\n\t\t\t\t&::before {\n\t\t\t\t\tcontent: '✓';\n\t\t\t\t\tposition: absolute;\n\t\t\t\t\ttop: -8px;\n\t\t\t\t\tright: -8px;\n\t\t\t\t\twidth: 24px;\n\t\t\t\t\theight: 24px;\n\t\t\t\t\tbackground: #22c55e;\n\t\t\t\t\tcolor: white;\n\t\t\t\t\tborder-radius: 50%;\n\t\t\t\t\tdisplay: flex;\n\t\t\t\t\talign-items: center;\n\t\t\t\t\tjustify-content: center;\n\t\t\t\t\tfont-size: 0.75rem;\n\t\t\t\t\tfont-weight: bold;\n\t\t\t\t\tbox-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);\n\t\t\t\t}\n\t\t\t":e.$active?"\n\t\t\t\tbackground: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); // Light blue gradient\n\t\t\t\tcolor: #1e40af; // Dark blue text\n\t\t\t\tborder: 3px solid #3b82f6;\n\t\t\t\tbox-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\n\t\t\t\ttransform: scale(1.05);\n\t\t\t\tanimation: pulse 2s ease-in-out infinite;\n\t\t\t\t\n\t\t\t\t@keyframes pulse {\n\t\t\t\t\t0%, 100% {\n\t\t\t\t\t\tbox-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\n\t\t\t\t\t}\n\t\t\t\t\t50% {\n\t\t\t\t\t\tbox-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\t\n\t\t\t\t&::after {\n\t\t\t\t\tcontent: '▶';\n\t\t\t\t\tposition: absolute;\n\t\t\t\t\ttop: -8px;\n\t\t\t\t\tright: -8px;\n\t\t\t\t\twidth: 24px;\n\t\t\t\t\theight: 24px;\n\t\t\t\t\tbackground: #3b82f6;\n\t\t\t\t\tcolor: white;\n\t\t\t\t\tborder-radius: 50%;\n\t\t\t\t\tdisplay: flex;\n\t\t\t\t\talign-items: center;\n\t\t\t\t\tjustify-content: center;\n\t\t\t\t\tfont-size: 0.625rem;\n\t\t\t\t\tfont-weight: bold;\n\t\t\t\t\tbox-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);\n\t\t\t\t\tanimation: bounce 1s ease-in-out infinite;\n\t\t\t\t}\n\t\t\t\t\n\t\t\t\t@keyframes bounce {\n\t\t\t\t\t0%, 100% {\n\t\t\t\t\t\ttransform: translateY(0);\n\t\t\t\t\t}\n\t\t\t\t\t50% {\n\t\t\t\t\t\ttransform: translateY(-4px);\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t":"\n\t\t\t\tbackground: #f3f4f6; // Light grey\n\t\t\t\tcolor: #9ca3af; // Lighter muted text\n\t\t\t\tborder: 2px solid #e5e7eb;\n\t\t\t\topacity: 0.7;\n\t\t\t"}
`,ye=g.pre`
	background: #1f2937; // Dark background
	color: #f9fafb; // Light text
	padding: 1rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	line-height: 1.5;
	margin: 1rem 0;
	max-height: 400px;
	overflow-y: auto;
`,we=g.div`
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	font-size: 0.875rem;

	${e=>{switch(e.$type){case"success":return"\n\t\t\t\t\tbackground: #d1fae5; // Light green\n\t\t\t\t\tcolor: #065f46; // Dark green text\n\t\t\t\t\tborder-left: 4px solid #22c55e;\n\t\t\t\t";case"warning":return"\n\t\t\t\t\tbackground: #fef3c7; // Light yellow\n\t\t\t\t\tcolor: #92400e; // Dark brown text\n\t\t\t\t\tborder-left: 4px solid #f59e0b;\n\t\t\t\t";case"error":return"\n\t\t\t\t\tbackground: #fee2e2; // Light red\n\t\t\t\t\tcolor: #991b1b; // Dark red text\n\t\t\t\t\tborder-left: 4px solid #ef4444;\n\t\t\t\t";default:return"\n\t\t\t\t\tbackground: #dbeafe; // Light blue\n\t\t\t\t\tcolor: #1e40af; // Dark blue text\n\t\t\t\t\tborder-left: 4px solid #3b82f6;\n\t\t\t\t"}}}

	svg {
		flex-shrink: 0;
		font-size: 1.25rem;
	}
`,ve=g.div`
	background: #f3f4f6; // Light grey
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
	position: relative;
`,ke=g.button`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	padding: 0.5rem;
	background: #ffffff; // White background
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	cursor: pointer;
	color: #374151; // Dark text
	transition: all 0.2s;

	&:hover {
		background: #f3f4f6;
		color: #1f2937;
	}
`,Ie=g.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	color: #1f2937; // Dark text on light background
	word-break: break-all;
	line-height: 1.5;
	padding-right: 3rem;
`,je=g.a`
	color: #3b82f6;
	text-decoration: none;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	transition: color 0.2s;

	&:hover {
		color: #2563eb;
		text-decoration: underline;
	}
`,Se=g.div`
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); // Light yellow gradient
	border: 2px solid #f59e0b;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
`,Te=g.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
	color: #92400e; // Dark brown text on light yellow

	h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	svg {
		font-size: 1.5rem;
	}
`,Ee=g.div`
	color: #92400e; // Dark brown text on light yellow
	line-height: 1.6;
	font-size: 0.875rem;

	p {
		margin: 0.75rem 0;
	}

	strong {
		font-weight: 600;
		color: #78350f; // Darker brown for emphasis
	}

	ul {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	li {
		margin: 0.25rem 0;
	}
`,Ae=g.button`
	background: transparent;
	border: none;
	color: #92400e; // Dark brown text
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	padding: 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: color 0.2s;

	&:hover {
		color: #78350f;
		text-decoration: underline;
	}
`,Ce=g.div`
	background: #ffffff; // White background
	border: 2px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 0.75rem 0;
`,Pe=g.div`
	font-weight: 600;
	color: #1f2937; // Dark text
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,De=g.div`
	color: #4b5563; // Secondary dark text
	font-size: 0.875rem;
	line-height: 1.6;
`,Fe=(e,t)=>`spiffe://${e}/ns/${t.namespace||"default"}/sa/${t.name}`,Oe=()=>{const p=e(),[u,f]=t.useState(1),[h,g]=t.useState({trustDomain:"example.org",workloadPath:"frontend/api",workloadType:"kubernetes",namespace:"default",serviceAccount:"frontend-sa"}),[x,b]=t.useState(""),[y,w]=t.useState(null),[v,k]=t.useState(null),[S,T]=t.useState(!1),[E,A]=t.useState(null),[C,P]=t.useState(!0),[O,U]=t.useState(!1),[R,_]=t.useState(!1),[V,M]=t.useState(!1),[L,z]=t.useState(!1),[$,B]=t.useState("");t.useEffect(()=>{m.clearApiCalls();const e=D.getEnvironmentId();if(e&&b(e),!x)try{const e=localStorage.getItem("unified_worker_token");if(e){const t=JSON.parse(e);t.credentials?.environmentId&&b(t.credentials.environmentId)}}catch(t){}},[x]),t.useEffect(()=>{const e=()=>{const e=D.getEnvironmentId();e&&e!==x&&b(e)};return window.addEventListener("environmentIdUpdated",e),()=>window.removeEventListener("environmentIdUpdated",e)},[x]),t.useEffect(()=>{const e=()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const t=JSON.parse(e);t.credentials?.environmentId&&!x&&b(t.credentials.environmentId)}}catch(e){}};return window.addEventListener("workerTokenUpdated",e),()=>window.removeEventListener("workerTokenUpdated",e)},[x]);return n.jsxs(ie,{children:[L&&n.jsxs(n.Fragment,{children:[n.jsx(ae,{}),n.jsxs(le,{children:[n.jsx(r,{}),$]})]}),n.jsxs(se,{children:[n.jsxs("h1",{children:[n.jsx(i,{}),"SPIFFE/SPIRE Mock Flow"]}),n.jsx("p",{children:"Demonstrate workload identity (SVID) generation and exchange for PingOne SSO tokens"})]}),n.jsx(I,{currentPage:"hub",showRestartFlow:!1,showBackToMain:!0}),n.jsxs(we,{$type:"info",children:[n.jsx(s,{}),n.jsxs("div",{children:[n.jsx("strong",{children:"Educational Mock Flow:"})," This demonstrates SPIFFE/SPIRE workload identity integration with PingOne OAuth/OIDC. In production, this would use real SPIRE agents, servers, and PingOne APIs."," ",n.jsx(je,{href:"/docs/spiffe-spire-pingone",target:"_blank",children:"Full Integration Guide"})," | ",n.jsx(je,{href:"https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/",target:"_blank",rel:"noopener noreferrer",children:"Official SPIFFE Docs"})]})]}),n.jsxs(Se,{children:[n.jsxs(Te,{children:[n.jsx(o,{}),n.jsx("h3",{children:"What is SPIFFE/SPIRE?"})]}),C?n.jsxs(n.Fragment,{children:[n.jsxs(Ee,{children:[n.jsxs("p",{children:[n.jsx("strong",{children:"SPIFFE"})," (Secure Production Identity Framework for Everyone) is a set of open-source standards for securely identifying software systems in dynamic and heterogeneous environments. ",n.jsx("strong",{children:"SPIRE"})," (SPIFFE Runtime Environment) is a production-ready implementation that issues and manages identities for workloads."]}),n.jsxs(Ce,{children:[n.jsxs(Pe,{children:[n.jsx(a,{}),"Why SPIFFE/SPIRE?"]}),n.jsxs(De,{children:["Modern infrastructure is dynamic - services scale up/down, move between hosts, and run in containers. Traditional authentication using static secrets (passwords, API keys, tokens) doesn't work well because:",n.jsxs("ul",{children:[n.jsx("li",{children:"Secrets must be distributed and rotated manually"}),n.jsx("li",{children:"Secrets can be stolen, leaked, or compromised"}),n.jsx("li",{children:"Hard to track which service is making requests"})]}),"SPIFFE/SPIRE solves this by automatically issuing"," ",n.jsx("strong",{children:"cryptographic identities"})," based on platform attestation (verifying what the workload is, not what it knows)."]})]}),n.jsxs(Ce,{children:[n.jsxs(Pe,{children:[n.jsx(i,{}),"Core SPIFFE Concepts"]}),n.jsx(De,{children:n.jsxs("ul",{children:[n.jsxs("li",{children:[n.jsx("strong",{children:"SPIFFE ID:"})," A structured URI that uniquely identifies a workload. Format: ",n.jsx("code",{children:"spiffe://trust-domain/workload-identifier"}),n.jsx("br",{}),"Example: ",n.jsx("code",{children:"spiffe://example.org/frontend/api"})]}),n.jsxs("li",{children:[n.jsx("strong",{children:"SVID (SPIFFE Verifiable Identity Document):"})," A cryptographic document that proves a workload's identity. Can be an X.509 certificate or JWT token. Contains the SPIFFE ID and is signed by the trust domain's authority."]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Trust Domain:"})," The root of a SPIFFE identity namespace. Represents a system's trust boundary (e.g., your organization, environment, or cluster). All workloads in a trust domain share the same root of trust."]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Workload:"})," A single piece of software deployed with a particular configuration. Examples: web server, database, microservice, container, process."]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Workload API:"})," An API exposed by SPIRE Agent that workloads call to retrieve their SVIDs. Typically accessed via Unix domain socket for security."]})]})})]}),n.jsxs(Ce,{children:[n.jsxs(Pe,{children:[n.jsx(r,{}),"SPIRE Architecture"]}),n.jsx(De,{children:n.jsxs("ul",{children:[n.jsxs("li",{children:[n.jsx("strong",{children:"SPIRE Server:"})," Central component that manages identities, validates attestation, and signs SVIDs. Maintains registration entries that define which workloads get which SPIFFE IDs."]}),n.jsxs("li",{children:[n.jsx("strong",{children:"SPIRE Agent:"})," Runs on each node/host. Performs workload attestation (verifies workload identity using platform-specific mechanisms like Kubernetes service accounts, AWS instance metadata, etc.) and provides the Workload API for workloads to fetch their SVIDs."]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Attestation:"})," The process of verifying a workload's identity using platform-specific properties (e.g., Kubernetes pod UID, AWS instance ID, Unix process attributes). This is how SPIRE knows which SPIFFE ID to give."]})]})})]}),n.jsxs(Ce,{children:[n.jsxs(Pe,{children:[n.jsx(r,{}),"Integration with PingOne"]}),n.jsxs(De,{children:[n.jsxs("p",{children:["This mock demonstrates a ",n.jsx("strong",{children:"token exchange pattern"})," where:"]}),n.jsxs("ol",{children:[n.jsxs("li",{children:[n.jsx("strong",{children:"SPIRE Agent"})," attests your workload and issues an SVID (X.509 certificate)"]}),n.jsxs("li",{children:["Your workload presents the SVID to a ",n.jsx("strong",{children:"Token Exchange Service"})]}),n.jsx("li",{children:"The service validates the SVID against the SPIRE trust bundle"}),n.jsx("li",{children:"The service maps the SPIFFE ID to a PingOne service account"}),n.jsxs("li",{children:[n.jsx("strong",{children:"PingOne"})," issues OAuth/OIDC tokens for accessing protected resources"]})]}),n.jsxs("p",{style:{marginTop:"0.75rem"},children:["This combines ",n.jsx("strong",{children:"workload identity"})," (SPIFFE/SPIRE) with"," ",n.jsx("strong",{children:"OAuth/OIDC authentication"})," (PingOne), enabling workloads to securely access APIs without storing static credentials."]}),n.jsxs("p",{style:{marginTop:"0.5rem",fontSize:"0.8125rem"},children:["📚"," ",n.jsx(je,{href:"https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/",target:"_blank",rel:"noopener noreferrer",children:"Learn more: Official SPIFFE Concepts"})]})]})]})]}),n.jsx(Ae,{onClick:()=>P(!1),children:"Hide Education ▲"})]}):n.jsx(Ae,{onClick:()=>P(!0),children:"Show Education ▼"})]}),n.jsxs(xe,{children:[n.jsx(be,{$active:1===u,$completed:u>1,children:"1. Workload Attestation"}),n.jsx(be,{$active:2===u,$completed:u>2,children:"2. SVID Issuance"}),n.jsx(be,{$active:3===u,$completed:u>3,children:"3. SVID Validation"}),n.jsx(be,{$active:4===u,$completed:!1,children:"4. Token Exchange"})]}),n.jsxs(oe,{children:[n.jsx("div",{children:n.jsxs(de,{children:[n.jsxs(ce,{children:[n.jsx(r,{}),n.jsx("h2",{children:"Workload Configuration"})]}),1===u&&n.jsxs(we,{$type:"success",style:{marginBottom:"1.5rem"},children:[n.jsx(l,{}),n.jsxs("div",{children:[n.jsx("strong",{children:"Step 1: Workload Attestation"}),n.jsx("br",{}),"Configure your workload's attributes. In production, SPIRE Agent would automatically detect these from the platform (Kubernetes, AWS, etc.). Pre-filled examples are ready to use!"]})]}),2===u&&n.jsxs(we,{$type:"info",style:{marginBottom:"1.5rem"},children:[n.jsx(d,{}),n.jsxs("div",{children:[n.jsx("strong",{children:"Step 2: SVID Issuance"}),n.jsx("br",{}),"SPIRE Server has issued an SVID (X.509 certificate) for your workload. This certificate proves your workload's identity and is automatically rotated before expiration."]})]}),3===u&&n.jsxs(we,{$type:"info",style:{marginBottom:"1.5rem"},children:[n.jsx(d,{}),n.jsxs("div",{children:[n.jsx("strong",{children:"Step 3: SVID Validation"}),n.jsx("br",{}),"The Token Exchange Service validates your SVID against the trust bundle to ensure it's legitimate and hasn't been tampered with."]})]}),4===u&&n.jsxs(we,{$type:"success",style:{marginBottom:"1.5rem"},children:[n.jsx(l,{}),n.jsxs("div",{children:[n.jsx("strong",{children:"Step 4: Token Exchange Complete"}),n.jsx("br",{}),"Your workload's SPIFFE identity has been exchanged for PingOne OAuth tokens. Use these tokens to access protected APIs and resources."]})]}),n.jsxs(pe,{children:[n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[n.jsx(ue,{children:"Trust Domain"}),n.jsxs("button",{type:"button",onClick:()=>U(e=>!e),style:{display:"inline-flex",alignItems:"center",gap:"0.25rem",background:"transparent",border:"none",color:"#6b7280",fontSize:"0.75rem",cursor:"pointer"},children:[n.jsx(d,{size:14}),n.jsx("span",{children:O?"Hide info":"What's this?"})]})]}),n.jsx(he,{type:"text",value:h.trustDomain,onChange:e=>g({...h,trustDomain:e.target.value}),placeholder:"example.org",disabled:u>1}),n.jsxs(fe,{children:["💡 ",n.jsx("strong",{children:"Use the default:"})," example.org (or enter your own)"]}),O&&n.jsxs(fe,{children:[n.jsx("strong",{children:"Trust domain"})," is the root of your SPIFFE identity namespace and trust bundle. All SVIDs in this domain chain back to a CA owned by this name.",n.jsx("br",{}),"Examples: ",n.jsx("code",{children:"example.org"}),", ",n.jsx("code",{children:"internal.ping.local"}),",",n.jsx("code",{children:"prod.bank.internal"}),"."]})]}),n.jsxs(pe,{children:[n.jsx(ue,{children:"Workload Path"}),n.jsx(he,{type:"text",value:h.workloadPath,onChange:e=>g({...h,workloadPath:e.target.value}),placeholder:"frontend/api",disabled:u>1}),n.jsxs(fe,{children:["💡 ",n.jsx("strong",{children:"Use the default:"})," frontend/api (or enter your own)"]})]}),n.jsxs(pe,{children:[n.jsx(ue,{children:"Workload Type"}),n.jsxs(ge,{value:h.workloadType,onChange:e=>g({...h,workloadType:e.target.value}),disabled:u>1,children:[n.jsx("option",{value:"kubernetes",children:"Kubernetes Pod"}),n.jsx("option",{value:"vm",children:"Virtual Machine"}),n.jsx("option",{value:"container",children:"Container"})]})]}),"kubernetes"===h.workloadType&&n.jsxs(n.Fragment,{children:[n.jsxs(pe,{children:[n.jsx(ue,{children:"Kubernetes Namespace"}),n.jsx(he,{type:"text",value:h.namespace||"",onChange:e=>g({...h,namespace:e.target.value}),placeholder:"default",disabled:u>1}),n.jsxs(fe,{children:["💡 ",n.jsx("strong",{children:"Use the default:"})," default (or enter your own)"]})]}),n.jsxs(pe,{children:[n.jsx(ue,{children:"Service Account"}),n.jsx(he,{type:"text",value:h.serviceAccount||"",onChange:e=>g({...h,serviceAccount:e.target.value}),placeholder:"frontend-sa",disabled:u>1}),n.jsxs(fe,{children:["💡 ",n.jsx("strong",{children:"Use the default:"})," frontend-sa (or enter your own)"]})]})]}),n.jsxs(pe,{children:[n.jsx(ue,{children:"PingOne Environment ID"}),n.jsx(he,{type:"text",value:x,onChange:e=>{const t=e.target.value;b(t),t.trim()&&D.saveEnvironmentId(t)},placeholder:"12345678-1234-1234-1234-123456789abc",disabled:u>1}),n.jsx(fe,{children:x?n.jsxs(n.Fragment,{children:["✅ ",n.jsx("strong",{children:"Auto-loaded from storage"})," (or enter a different one)"]}):n.jsxs(n.Fragment,{children:["💡 ",n.jsx("strong",{children:"Use example:"})," 12345678-1234-1234-1234-123456789abc (or enter your real Environment ID)"]})})]}),1===u&&n.jsxs(me,{$variant:"primary",onClick:()=>{T(!0),B("🔐 Attesting Workload & Issuing SVID..."),z(!0);const e={method:"POST",url:`https://spire-server.${h.trustDomain}:8081/spire.api.server.agent.v1.Agent/AttestAgent`,headers:{"Content-Type":"application/json"},body:{attestation_data:{type:h.workloadType,data:"kubernetes"===h.workloadType?{namespace:h.namespace,service_account:h.serviceAccount,pod_name:`${h.workloadPath.split("/").pop()}-pod-abc123`}:{workload_path:h.workloadPath}}}};setTimeout(()=>{e.response={status:200,statusText:"OK",data:{svid:{spiffe_id:`spiffe://${h.trustDomain}/${h.workloadPath}`,x509_svid:"[X.509 Certificate Data]",x509_svid_key:"[Private Key Data]",x509_bundle:"[Trust Bundle Data]"},expires_at:new Date(Date.now()+36e5).toISOString()}},e.duration=1200,m.trackApiCall({method:e.method,url:e.url,headers:e.headers||{"Content-Type":"application/json"},body:e.body??null,step:"spiffe-spire-attest-agent"});const t=(e=>{const t=`spiffe://${e.trustDomain}/${e.workloadPath}`,n=new Date(Date.now()+36e5).toISOString();return{spiffeId:t,x509Certificate:`-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAKL0UG+mRKSzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV\nBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX\naWRnaXRzIFB0eSBMdGQwHhcNMjQxMTE3MDAwMDAwWhcNMjQxMTE3MDEwMDAwWjBF\nMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50\nZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB\nCgKCAQEA2Z3qX0SPIFFE_ID_${e.workloadPath.replace(/\//g,"_")}_MOCK\n-----END CERTIFICATE-----`,privateKey:`-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDZnepfRI9SPIFFE\n_PRIVATE_KEY_${e.workloadPath.replace(/\//g,"_")}_MOCK\n-----END PRIVATE KEY-----`,expiresAt:n,trustBundle:`-----BEGIN CERTIFICATE-----\nMIIC5zCCAc+gAwIBAgIBATANBgkqhkiG9w0BAQsFADATMREwDwYDVQQDDAhTUElS\nRSBDQTAEFAKE_TRUST_BUNDLE_FOR_${e.trustDomain}\n-----END CERTIFICATE-----`}})(h);w(t),z(!1),setTimeout(()=>{f(2),T(!1),p("/v8u/spiffe-spire/svid")},300)},1500)},disabled:!h.trustDomain||!h.workloadPath||!x||S,children:[n.jsx(a,{}),S?"Attesting & Issuing SVID...":"Attest Workload & Issue SVID"]}),2===u&&n.jsxs(me,{$variant:"primary",onClick:()=>{T(!0),B("✓ Validating SVID with Trust Bundle..."),z(!0);const e={method:"POST",url:`https://token-exchange.${h.trustDomain}/api/v1/validate-svid`,headers:{"Content-Type":"application/json"},body:{svid:y?.x509Certificate,trust_bundle:y?.trustBundle,spiffe_id:y?.spiffeId}};setTimeout(()=>{e.response={status:200,statusText:"OK",data:{valid:!0,spiffe_id:y?.spiffeId,expires_at:y?.expiresAt,trust_domain:h.trustDomain,validation_checks:{signature_valid:!0,not_expired:!0,spiffe_id_matches:!0,chain_valid:!0}}},e.duration=800,m.trackApiCall({method:e.method,url:e.url,headers:e.headers||{"Content-Type":"application/json"},body:e.body??null,step:"spiffe-spire-validate-svid"}),z(!1),setTimeout(()=>{f(3),T(!1),p("/v8u/spiffe-spire/validate")},300)},1e3)},disabled:S,children:[n.jsx(l,{}),S?"Validating SVID...":"Validate SVID with Trust Bundle"]}),3===u&&n.jsxs(me,{$variant:"primary",onClick:()=>{if(!y||!x)return;T(!0),B("🔄 Exchanging SVID for PingOne Token..."),z(!0);const e={url:`https://auth.pingone.com/${x}/as/token`,headers:{"Content-Type":"application/x-www-form-urlencoded"},body:{grant_type:"urn:ietf:params:oauth:grant-type:token-exchange",subject_token:y.x509Certificate,subject_token_type:"urn:ietf:params:oauth:token-type:spiffe-svid",scope:"openid profile email",requested_token_type:"urn:ietf:params:oauth:token-type:access_token"}},t=m.trackApiCall({method:"POST",url:e.url,headers:e.headers||{"Content-Type":"application/x-www-form-urlencoded"},body:e.body??null,step:"spiffe-spire-token-exchange"});setTimeout(()=>{const n=((e,t)=>({accessToken:`eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InNwaWZmZS1waW5nb25lLWludGVncmF0aW9uIn0.${btoa(JSON.stringify({sub:e.spiffeId,iss:`https://auth.pingone.com/${t}/as`,aud:`https://api.pingone.com/${t}`,exp:Math.floor(Date.now()/1e3)+3600,iat:Math.floor(Date.now()/1e3),scope:"openid profile email",spiffe_id:e.spiffeId,workload_identity:!0}))}.MOCK_SIGNATURE_${t}`,tokenType:"Bearer",expiresIn:3600,scope:"openid profile email",idToken:`eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InNwaWZmZS1waW5nb25lLWludGVncmF0aW9uIn0.${btoa(JSON.stringify({sub:e.spiffeId,iss:`https://auth.pingone.com/${t}/as`,aud:"spiffe-workload-client",exp:Math.floor(Date.now()/1e3)+3600,iat:Math.floor(Date.now()/1e3),name:`Workload: ${e.spiffeId}`,spiffe_id:e.spiffeId,workload_type:"service"}))}.MOCK_ID_TOKEN_SIGNATURE`}))(y,x);e.response={status:200,statusText:"OK",data:{access_token:n.accessToken,id_token:n.idToken,token_type:n.tokenType,expires_in:n.expiresIn,scope:n.scope}},e.duration=1300,m.updateApiCallResponse(t,{status:200,statusText:"OK",data:{access_token:n.accessToken,id_token:n.idToken,token_type:n.tokenType,expires_in:n.expiresIn,scope:n.scope}},e.duration),k(n),z(!1),setTimeout(()=>{f(4),T(!1),p("/v8u/spiffe-spire/tokens",{state:{tokens:{accessToken:n.accessToken,idToken:n.idToken,expiresIn:n.expiresIn}}})},300)},1500)},disabled:S,children:[n.jsx(i,{}),S?"Exchanging for OAuth Token...":"Exchange SVID for PingOne Token"]}),4===u&&n.jsx(me,{$variant:"secondary",onClick:()=>{f(1),w(null),k(null),p("/v8u/spiffe-spire/attest")},children:"Reset Flow"})]})}),n.jsxs("div",{children:[y&&n.jsxs(de,{children:[n.jsxs(ce,{children:[n.jsx(a,{}),n.jsx("h2",{children:"SPIFFE Verifiable Identity Document (SVID)"})]}),n.jsxs(we,{$type:"info",style:{marginBottom:"1rem"},children:[n.jsx(d,{}),n.jsxs("div",{children:[n.jsx("strong",{children:"What is an SVID?"})," This is like a digital passport for your workload. It contains a cryptographic certificate that proves the workload's identity. In production, SPIRE automatically rotates these before they expire."]})]}),n.jsxs(we,{$type:"success",children:[n.jsx(l,{}),n.jsxs("div",{children:[n.jsx("strong",{children:"SVID Generated Successfully"}),n.jsx("br",{}),"Expires: ",new Date(y.expiresAt).toLocaleString()," (1 hour - auto-rotates in production)"]})]}),n.jsxs(pe,{children:[n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[n.jsx(ue,{children:"SPIFFE ID"}),n.jsxs("button",{type:"button",onClick:()=>_(e=>!e),style:{display:"inline-flex",alignItems:"center",gap:"0.25rem",background:"transparent",border:"none",color:"#6b7280",fontSize:"0.75rem",cursor:"pointer"},children:[n.jsx(d,{size:14}),n.jsx("span",{children:R?"Hide info":"What's this?"})]})]}),n.jsxs(ve,{children:[n.jsx(ke,{onClick:async()=>await(async(e,t)=>{await F.copyToClipboard(e,t)&&(A(t),setTimeout(()=>A(null),2e3))})(y.spiffeId,"SPIFFE ID"),children:"SPIFFE ID"===E?n.jsx(l,{}):n.jsx(c,{})}),n.jsx(Ie,{children:y.spiffeId})]}),n.jsx(fe,{children:"📋 This unique ID identifies your workload across all systems"}),R&&n.jsxs(fe,{children:[n.jsx("strong",{children:"SPIFFE ID"})," is a globally unique name for your workload in the form",n.jsx("code",{children:"spiffe://trust-domain/path/to/workload"}),". It is not a secret; security comes from proving possession of an SVID that contains this ID.",n.jsx("br",{}),"Examples: ",n.jsx("code",{children:"spiffe://example.org/ns/orders/sa/orders-api"})]})]}),n.jsxs(pe,{children:[n.jsx(ue,{children:"X.509 Certificate (Public Part)"}),n.jsx(ye,{children:y.x509Certificate}),n.jsx(fe,{children:"🔐 This certificate proves your workload's identity - like showing a passport at airport security"})]}),u>=2&&n.jsxs(we,{$type:"info",children:[n.jsx(l,{}),n.jsxs("div",{children:[n.jsx("strong",{children:"SVID Validated"}),n.jsx("br",{}),"Certificate signature verified against trust bundle"]})]})]}),h&&n.jsxs(de,{style:{marginTop:y?"2rem":0},children:[n.jsxs(ce,{children:[n.jsx(r,{}),n.jsx("h2",{children:"SPIRE Registration Entry (Simulated)"})]}),(()=>{const e={name:h.serviceAccount||h.workloadPath.split("/").pop()||"workload",namespace:h.namespace||"default",selectors:"kubernetes"===h.workloadType?[{type:"k8s",value:`sa:${h.serviceAccount||"frontend-sa"}`}]:[{type:h.workloadType,value:`path:${h.workloadPath}`}]},t=((e,t,n=3600)=>({spiffeId:Fe(e,t),parentId:`spiffe://${e}/spire/server`,selectors:t.selectors,ttlSeconds:n}))(h.trustDomain,e);return n.jsxs(pe,{children:[n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[n.jsx(ue,{children:"Registration Entry JSON"}),n.jsxs("button",{type:"button",onClick:()=>M(e=>!e),style:{display:"inline-flex",alignItems:"center",gap:"0.25rem",background:"transparent",border:"none",color:"#6b7280",fontSize:"0.75rem",cursor:"pointer"},children:[n.jsx(d,{size:14}),n.jsx("span",{children:V?"Hide info":"What's this?"})]})]}),n.jsx(ye,{children:JSON.stringify(t,null,2)}),n.jsx(fe,{children:"This object shows how SPIRE maps your workload's selectors to a SPIFFE ID."}),V&&n.jsxs(fe,{children:[n.jsx("strong",{children:"Registration entry"}),' is a rule on the SPIRE Server that says "for workloads with these selectors, issue this SPIFFE ID from this parent".',n.jsx("br",{}),"Key fields:",n.jsxs("ul",{children:[n.jsxs("li",{children:[n.jsx("strong",{children:"spiffeId"}),": the SPIFFE ID the workload receives."]}),n.jsxs("li",{children:[n.jsx("strong",{children:"parentId"}),": who is allowed to sign SVIDs for this workload (often the SPIRE Server)."]}),n.jsxs("li",{children:[n.jsx("strong",{children:"selectors"}),": platform attributes that identify which workloads this entry applies to (e.g., Kubernetes service account)."]}),n.jsxs("li",{children:[n.jsx("strong",{children:"ttlSeconds"}),": how long each SVID is valid before it must be rotated."]})]})]})]})})()]}),v&&n.jsxs(de,{style:{marginTop:"2rem"},children:[n.jsxs(ce,{children:[n.jsx(i,{}),n.jsx("h2",{children:"PingOne OAuth Token (Dedicated View)"})]}),n.jsxs(we,{$type:"info",style:{marginBottom:"1rem"},children:[n.jsx(d,{}),n.jsxs("div",{children:[n.jsx("strong",{children:"Token Exchange Complete!"})," Your workload's SVID was validated and exchanged for OAuth tokens. View and analyze those tokens on a dedicated page."]})]}),n.jsxs(we,{$type:"success",style:{marginBottom:"1rem"},children:[n.jsx(l,{}),n.jsxs("div",{children:[n.jsx("strong",{children:"Token Exchange Successful"}),n.jsx("br",{}),"Workload can now access PingOne-protected resources using these tokens."]})]}),n.jsx(pe,{children:n.jsxs(me,{$variant:"primary",onClick:()=>{v&&p("/v8u/spiffe-spire/tokens",{state:{tokens:{accessToken:v.accessToken,idToken:v.idToken,expiresIn:v.expiresIn}}})},children:[n.jsx(i,{})," View Tokens on Dedicated Page"]})})]}),v&&n.jsxs(de,{style:{marginTop:"2rem"},children:[n.jsxs(ce,{children:[n.jsx(i,{}),n.jsx("h2",{children:"PingOne OAuth Token"})]}),n.jsxs(pe,{children:[n.jsx(ue,{children:"Token Metadata"}),n.jsx(ye,{children:`Token Type: ${v.tokenType}\nExpires In: ${v.expiresIn} seconds (${F.formatExpiry(v.expiresIn)})\nScope: ${v.scope}\nWorkload SPIFFE ID: ${y?.spiffeId}\nIssued At: ${(new Date).toISOString()}`})]}),n.jsxs(we,{$type:"info",children:[n.jsx(s,{}),n.jsxs("div",{children:[n.jsx("strong",{children:"Next Steps:"})," Use this access token in the Authorization header when making API calls to PingOne-protected resources:",n.jsx(ye,{style:{marginTop:"0.5rem"},children:`Authorization: Bearer ${v.accessToken.substring(0,50)}...`})]})]})]})]})]}),n.jsx(j,{})]})},Ue=Object.freeze(Object.defineProperty({__proto__:null,SpiffeSpireFlowV8U:Oe,default:Oe},Symbol.toStringTag,{value:"Module"})),Re=async(e,t,n={},r="debug-session",i="flow-debug",s)=>{try{const{log:o}=await z(async()=>{const{log:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.m);return{log:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]));await o(e,t,n,r,i,s)}catch(o){}},_e=()=>{$({pageName:"Unified OAuth Flow V8U",force:!0});const{flowType:r,step:i}=p(),s=e(),a=u(),l=t.useMemo(()=>{if((async()=>{try{const{log:e}=await z(async()=>{const{log:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.m);return{log:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]));await e("UnifiedOAuthFlowV8U.tsx:97","Parsing currentStep from URL",{urlStep:i,urlFlowType:r,pathname:a.pathname,hash:window.location.hash.substring(0,100)},"debug-session","hybrid-redirect","STEP_PARSING")}catch{}})(),i){const e=parseInt(i,10);if(!Number.isNaN(e)&&e>=0)return(async()=>{try{const{log:t}=await z(async()=>{const{log:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.m);return{log:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]));await t("UnifiedOAuthFlowV8U.tsx:102","Step parsed successfully",{stepNum:e,urlStep:i},"debug-session","hybrid-redirect","STEP_PARSING")}catch{}})(),e}return(async()=>{try{const{log:e}=await z(async()=>{const{log:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.m);return{log:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]));await e("UnifiedOAuthFlowV8U.tsx:106","Defaulting to step 0",{urlStep:i,reason:i?"Invalid step number":"No step in URL"},"debug-session","hybrid-redirect","STEP_PARSING")}catch(e){}})(),0},[i,a.pathname,r]),[d,c]=t.useState(()=>r&&["oauth-authz","implicit","client-credentials","device-code","hybrid"].includes(r)?r:"oauth-authz"),[g,m]=t.useState(()=>x.getSpecVersion(d)),I=t.useRef(null);t.useEffect(()=>{if(Re("UnifiedOAuthFlowV8U.tsx:181","URL sync effect - ENTRY",{urlFlowType:r,flowType:d,specVersion:g,lastSynced:I.current,isUserChanging:ve.current,pathname:a.pathname},"debug-session","flow-type-debug","A"),I.current!==r)if(ve.current)Re("UnifiedOAuthFlowV8U.tsx:189","URL sync effect - SKIP (user changing)",{urlFlowType:r,flowType:d,isUserChanging:ve.current},"debug-session","flow-type-debug","B");else if(r&&["oauth-authz","implicit","client-credentials","device-code","hybrid"].includes(r)&&r!==d){Re("UnifiedOAuthFlowV8U.tsx:196","URL sync effect - CHECKING COMPATIBILITY",{urlFlowType:r,flowType:d,specVersion:g},"debug-session","flow-type-debug","C");const e=b.getAvailableFlows(g);if(Re("UnifiedOAuthFlowV8U.tsx:205","URL sync effect - AVAILABLE FLOWS CHECK",{specVersion:g,currentAvailableFlows:e,urlFlowType:r,isAvailable:e.includes(r)},"debug-session","flow-type-debug","C"),!e.includes(r)){Re("UnifiedOAuthFlowV8U.tsx:207","URL sync effect - FLOW NOT AVAILABLE, FINDING COMPATIBLE SPEC",{urlFlowType:r,specVersion:g,currentAvailableFlows:e},"debug-session","flow-type-debug","D");const t=["oauth2.0","oauth2.1","oidc"].find(e=>b.getAvailableFlows(e).includes(r));if(!t)return Re("UnifiedOAuthFlowV8U.tsx:219","URL sync effect - NO COMPATIBLE SPEC FOUND",{urlFlowType:r},"debug-session","flow-type-debug","D"),y.warn("⚠️ No compatible spec version found for URL flow type",{urlFlowType:r}),void(I.current=r);Re("UnifiedOAuthFlowV8U.tsx:214","URL sync effect - SWITCHING SPEC VERSION",{urlFlowType:r,fromSpec:g,toSpec:t},"debug-session","flow-type-debug","D"),m(t),x.saveSpecVersion(r,t)}Re("UnifiedOAuthFlowV8U.tsx:228","URL sync effect - SETTING FLOW TYPE",{urlFlowType:r,flowType:d,specVersion:g},"debug-session","flow-type-debug","C"),I.current=r,F.current=null,c(r)}else r===d?(Re("UnifiedOAuthFlowV8U.tsx:233","URL sync effect - IN SYNC",{urlFlowType:r,flowType:d},"debug-session","flow-type-debug","A"),I.current=r):r||(Re("UnifiedOAuthFlowV8U.tsx:237","URL sync effect - NO URL FLOW TYPE",{flowType:d},"debug-session","flow-type-debug","A"),I.current=d);else Re("UnifiedOAuthFlowV8U.tsx:184","URL sync effect - SKIP (already synced)",{urlFlowType:r,lastSynced:I.current},"debug-session","flow-type-debug","A")},[r,d,g,a.pathname]);const F=t.useRef(null);t.useEffect(()=>{if(F.current===d)return;const e=x.getSpecVersion(d);if(F.current=d,e!==g){b.getAvailableFlows(e).includes(d)?m(e):x.saveSpecVersion(d,g)}const t=e!==g&&b.getAvailableFlows(e).includes(d)?e:g;x.saveSettings(d,{specVersion:t})},[d,g]);const[ie,se]=t.useState(()=>l>0),[oe,ae]=t.useState(!0),[le,de]=t.useState([]),ce=t.useRef(l);t.useEffect(()=>{const e=ce.current;ce.current=l,0===l?se(!1):0===e&&l>0&&se(!0)},[l]);const pe=t.useCallback((e,t)=>{s(`/v8u/unified/${t||d}/${e}`,{replace:!0})},[d,s]);t.useEffect(()=>{"/v8u/unified"===a.pathname&&pe(0,d)},[a.pathname,pe,d]);const ue=t.useCallback((e,t)=>`${e}-${t}-v8u`,[]),[fe,he]=t.useState(()=>{try{const t=D.getEnvironmentId();let n="";try{const e=localStorage.getItem("unified_worker_token");if(e){const t=JSON.parse(e);n=t.credentials?.environmentId||""}}catch(e){}const i=(()=>{const e=r&&["oauth-authz","implicit","client-credentials","device-code","hybrid"].includes(r)?r:"oauth-authz";return ue("oidc",e)})(),s=O.getFlowConfig(i)||{flowKey:i,flowType:"oauth",includeClientSecret:!0,includeScopes:!0,includeRedirectUri:!0,includeLogoutUri:!1},o=O.loadCredentials(i,s),a=U.loadSharedCredentialsSync();return{environmentId:(o.environmentId?.trim()||a.environmentId?.trim()||t?.trim()||n?.trim()||"").trim(),clientId:(o.clientId?.trim()||a.clientId?.trim()||"").trim(),...o.clientSecret?.trim()?{clientSecret:o.clientSecret.trim()}:a.clientSecret?.trim()?{clientSecret:a.clientSecret.trim()}:{},...o.issuerUrl?.trim()?{issuerUrl:o.issuerUrl.trim()}:a.issuerUrl?.trim()?{issuerUrl:a.issuerUrl.trim()}:{},...o.clientAuthMethod?{clientAuthMethod:o.clientAuthMethod}:a.clientAuthMethod?{clientAuthMethod:a.clientAuthMethod}:{},...o.redirectUri?.trim()?{redirectUri:o.redirectUri.trim()}:{},...o.postLogoutRedirectUri?.trim()?{postLogoutRedirectUri:o.postLogoutRedirectUri.trim()}:{},scopes:(o.scopes?.trim()||"openid").trim(),...o.responseType?.trim()?{responseType:o.responseType.trim()}:{},...o.loginHint?.trim()?{loginHint:o.loginHint.trim()}:{},..."boolean"==typeof o.usePKCE?{usePKCE:o.usePKCE}:{},..."boolean"==typeof o.enableRefreshToken?{enableRefreshToken:o.enableRefreshToken}:{},..."string"!=typeof o.refreshTokenType||"JWT"!==o.refreshTokenType&&"OPAQUE"!==o.refreshTokenType?{}:{refreshTokenType:o.refreshTokenType},..."boolean"==typeof o.useRedirectless?{useRedirectless:o.useRedirectless}:{}}}catch(t){y.error("Error loading initial credentials (using defaults):",t);const n=D.getEnvironmentId();let r="";try{const e=localStorage.getItem("unified_worker_token");if(e){const t=JSON.parse(e);r=t.credentials?.environmentId||""}}catch(e){}return{environmentId:n||r||"",clientId:"",clientSecret:"",scopes:"openid"}}}),[ge,me]=t.useState(null);t.useEffect(()=>{(async()=>{if(!fe.environmentId||!fe.clientId)return void me(null);if(!V.checkWorkerTokenStatusSync().isValid)return void me(null);const e=await v.getToken();if(e)try{const t=await M.fetchAppConfig(fe.environmentId,fe.clientId,e);me(t?{...void 0!==t.pkceRequired&&{pkceRequired:t.pkceRequired},...void 0!==t.pkceEnforced&&{pkceEnforced:t.pkceEnforced}}:null)}catch(t){y.error("Error fetching app config:",t),me(null)}else me(null)})()},[fe.environmentId,fe.clientId]),t.useEffect(()=>{const e=()=>{const e=D.getEnvironmentId();e&&e!==fe.environmentId&&he(t=>({...t,environmentId:e}))};return window.addEventListener("environmentIdUpdated",e),()=>window.removeEventListener("environmentIdUpdated",e)},[fe.environmentId]),t.useEffect(()=>{const e=()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const t=JSON.parse(e);t.credentials?.environmentId&&!fe.environmentId&&he(e=>({...e,environmentId:t.credentials.environmentId}))}}catch(e){}};return window.addEventListener("workerTokenUpdated",e),()=>window.removeEventListener("workerTokenUpdated",e)},[fe.environmentId]),t.useEffect(()=>{const e=()=>{y.debug("🔑 Worker token updated event received!"),y.debug("🔑 Current credentials:",{hasEnvironmentId:!!fe.environmentId,hasClientId:!!fe.clientId,environmentId:fe.environmentId,clientId:fe.clientId}),fe.environmentId&&fe.clientId?(y.debug("🔑 Clearing app config to trigger re-fetch"),me(null)):y.debug("⚠️ Cannot refresh app config - missing credentials")};return y.debug("🔑 Setting up worker token event listener"),window.addEventListener("workerTokenUpdated",e),y.debug("🔑 Worker token listener setup complete"),()=>{y.debug("🔑 Cleaning up worker token event listener"),window.removeEventListener("workerTokenUpdated",e)}},[fe.environmentId,fe.clientId]);const xe=t.useMemo(()=>b.getAvailableFlows(g),[g]),be=t.useMemo(()=>{if(xe.includes(d))return d;const e=xe[0]||"oauth-authz";return y.warn("⚠️ Flow type not available, using fallback",{requested:d,fallback:e}),e},[d,xe]),ye=t.useMemo(()=>{const e=ue(g,be);return z(async()=>{const{analytics:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.l);return{analytics:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33])).then(({analytics:t})=>{t.log({location:"UnifiedOAuthFlowV8U.tsx:509",message:"FlowKey calculated",data:{flowKey:e,specVersion:g,effectiveFlowType:be}})}).catch(()=>{}),e},[g,be,ue]),we=t.useRef(null),ve=t.useRef(!1);t.useEffect(()=>{if(we.current===g)return;if(ve.current)return void(we.current=g);const e=b.getAvailableFlows(g),t=e.includes(d);if(we.current=g,!t&&e.length>0){const t=e[0];if(c(t),void 0!==l){s(`/v8u/unified/${t}/${l}`,{replace:!0})}}},[g,d,l,s]);const ke=t.useMemo(()=>b.getComplianceErrors(g,be),[g,be]),Ie=t.useMemo(()=>b.getComplianceWarnings(g,be),[g,be]),je=t.useRef(null);t.useEffect(()=>{if(je.current===ye&&Ee.current)return;const e=async()=>{Ee.current=!0,je.current=ye;try{const t=O.getFlowConfig(ye)||{flowKey:ye,flowType:"oauth",includeClientSecret:!0,includeScopes:!0,includeRedirectUri:!0,includeLogoutUri:!1},n=D.getEnvironmentId(),r=await k.loadCredentials(ye,{environmentId:n,enableBackup:!!n}).catch(e=>(y.warn("Error loading flow-specific credentials with SQLite backup",e),O.loadCredentialsWithBackup(ye,t))),i=await k.loadSharedCredentials({environmentId:n,enableBackup:!!n}).catch(e=>(y.warn("Error loading shared credentials with SQLite backup",e),U.loadSharedCredentials()))||U.loadSharedCredentialsSync(),s=D.getEnvironmentId();let o="";try{const e=localStorage.getItem("unified_worker_token");if(e){const t=JSON.parse(e);o=t.credentials?.environmentId||""}}catch(e){}z(async()=>{const{analytics:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.l);return{analytics:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33])).then(({analytics:e})=>{e.log({location:"UnifiedOAuthFlowV8U.tsx:650",message:"Loading credentials - flowSpecific advanced options",data:{flowKey:ye,hasResponseMode:!!r.responseMode,hasUsePAR:void 0!==r.usePAR,hasMaxAge:void 0!==r.maxAge,hasDisplay:!!r.display,hasPrompt:!!r.prompt,hasPkceEnforcement:!!r.pkceEnforcement,hasPrivateKey:!!r.privateKey,responseMode:r.responseMode,usePAR:r.usePAR,pkceEnforcement:r.pkceEnforcement}})}).catch(()=>{});const a={environmentId:(r.environmentId?.trim()||i.environmentId?.trim()||s?.trim()||o?.trim()||"").trim(),clientId:(r.clientId?.trim()||i.clientId?.trim()||"").trim(),...r.clientSecret?.trim()?{clientSecret:r.clientSecret.trim()}:i.clientSecret?.trim()?{clientSecret:i.clientSecret.trim()}:{},...r.issuerUrl?.trim()?{issuerUrl:r.issuerUrl.trim()}:i.issuerUrl?.trim()?{issuerUrl:i.issuerUrl.trim()}:{},...r.clientAuthMethod?{clientAuthMethod:r.clientAuthMethod}:i.clientAuthMethod?{clientAuthMethod:i.clientAuthMethod}:{},...r.redirectUri?.trim()?{redirectUri:r.redirectUri.trim()}:{},...r.postLogoutRedirectUri?.trim()?{postLogoutRedirectUri:r.postLogoutRedirectUri.trim()}:{},...r.logoutUri?.trim()?{logoutUri:r.logoutUri.trim()}:{},scopes:(r.scopes?.trim()||"openid").trim(),...r.responseType?.trim()?{responseType:r.responseType.trim()}:{},...r.responseMode?{responseMode:r.responseMode}:{},...void 0!==r.usePAR?{usePAR:r.usePAR}:{},...void 0!==r.maxAge?{maxAge:r.maxAge}:{},...null===r.maxAge?{maxAge:void 0}:{},...r.display?{display:r.display}:{},...r.prompt?{prompt:r.prompt}:{},...r.loginHint?.trim()?{loginHint:r.loginHint.trim()}:{},...""===r.loginHint?{loginHint:""}:{},..."boolean"==typeof r.usePKCE?{usePKCE:r.usePKCE}:{},..."boolean"==typeof r.enableRefreshToken?{enableRefreshToken:r.enableRefreshToken}:{},..."string"!=typeof r.refreshTokenType||"JWT"!==r.refreshTokenType&&"OPAQUE"!==r.refreshTokenType?{}:{refreshTokenType:r.refreshTokenType},..."boolean"==typeof r.useRedirectless?{useRedirectless:r.useRedirectless}:{},...r.pkceEnforcement?{pkceEnforcement:r.pkceEnforcement}:{},...r.privateKey?{privateKey:r.privateKey}:{}};z(async()=>{const{analytics:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.l);return{analytics:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33])).then(({analytics:e})=>{e.log({location:"UnifiedOAuthFlowV8U.tsx:698",message:"Merged credentials - ALL fields in merged object",data:{flowKey:ye,hasResponseMode:!!a.responseMode,hasUsePAR:void 0!==a.usePAR,hasMaxAge:void 0!==a.maxAge,hasDisplay:!!a.display,hasPrompt:!!a.prompt,hasPkceEnforcement:!!a.pkceEnforcement,hasPrivateKey:!!a.privateKey,hasLoginHint:void 0!==a.loginHint,responseMode:a.responseMode,usePAR:a.usePAR,pkceEnforcement:a.pkceEnforcement,allKeys:Object.keys(a)}})}).catch(()=>{}),he(e=>{const t=!!(a.environmentId?.trim()||a.clientId?.trim()||a.clientSecret?.trim()||r.environmentId?.trim()||r.clientId?.trim()||r.clientSecret?.trim()||i.environmentId?.trim()||i.clientId?.trim()||i.clientSecret?.trim()),n=!!(e.environmentId?.trim()||e.clientId?.trim()||e.clientSecret?.trim());if(!(JSON.stringify(e)!==JSON.stringify(a))&&n)return e;if(t)return a;if(n)return e;return{environmentId:D.getEnvironmentId()||"",clientId:"",scopes:"openid"}})}catch(t){y.error("❌ Error loading credentials (will preserve existing state):",t),y.error("Error stack:",t instanceof Error?t.stack:"No stack trace")}finally{setTimeout(()=>{Ee.current=!1},0)}};je.current!==ye&&e();const t=()=>{"visible"===document.visibilityState&&e()};return document.addEventListener("visibilitychange",t),()=>{document.removeEventListener("visibilitychange",t)}},[ye]);const Se=t.useRef(""),Te=t.useRef(null),Ee=t.useRef(!1);t.useEffect(()=>{if(!Ee.current)return Te.current&&clearTimeout(Te.current),Te.current=setTimeout(()=>{(async()=>{if(!Ee.current&&(fe.environmentId||fe.clientId||fe.clientSecret)){const e=JSON.stringify(fe);if(e===Se.current)return;Se.current=e;const t=D.getEnvironmentId(),n=fe;await k.saveCredentials(ye,n,{environmentId:t,enableBackup:!!t,backupExpiry:6048e5}).catch(e=>{y.warn("SQLite backup save failed, using fallback",e);const t=fe;O.saveCredentials(ye,t)});const r=U.extractSharedCredentials(fe);(r.environmentId||r.clientId||void 0!==r.clientSecret)&&await k.saveSharedCredentials(r,{environmentId:t,enableBackup:!!t,backupExpiry:6048e5}).catch(e=>{y.warn("SQLite shared backup save failed, using fallback",e),U.saveSharedCredentials(r)})}})().catch(e=>{y.error("Error saving credentials:",e)})},100),()=>{Te.current&&clearTimeout(Te.current)}},[fe,ye]);const Ae=t.useCallback(()=>{switch(be){case"client-credentials":return 6;case"device-code":case"implicit":return 7;default:return fe.usePKCE?9:8}},[be,fe.usePKCE]),Ce=t.useCallback(async()=>{try{if(fe.environmentId||fe.clientId||fe.clientSecret){const e=fe;O.saveCredentials(ye,e);const t=U.extractSharedCredentials(fe);(t.environmentId||t.clientId||void 0!==t.clientSecret)&&await U.saveSharedCredentials(t),Se.current=JSON.stringify(fe),ee.unifiedFlowSuccess("Credentials saved","OAuth configuration stored successfully")}else ee.warning("No credentials to save")}catch(e){y.error("Error manually saving credentials:",e),ee.unifiedFlowError("Credentials save","Failed to store OAuth configuration")}},[fe,ye]),Pe=t.useCallback(()=>{const e=Ae();l<e-1?pe(l+1):ee.info("Already on the last step")},[l,Ae,pe]);t.useEffect(()=>{const e=e=>{const t=e.target;if(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t.isContentEditable)return;if(e.metaKey||e.ctrlKey){if("n"===e.key||"N"===e.key)return e.preventDefault(),void Pe();if("s"===e.key||"S"===e.key)return e.preventDefault(),void Ce()}};return document.addEventListener("keydown",e),()=>{document.removeEventListener("keydown",e)}},[Pe,Ce]);const De=e=>{he(e)},Fe=async e=>{if(e===d)return;if(!b.getAvailableFlows(g).includes(e)){const t=["oauth2.0","oauth2.1","oidc"].find(t=>b.getAvailableFlows(t).includes(e));if(!t)return y.error("❌ No compatible spec version found for flow type",{newFlowType:e}),void ee.error(`${e} flow is not supported. Please select a different flow type.`);m(t),x.saveSpecVersion(e,t)}const{apiCallTrackerService:t}=await z(async()=>{const{apiCallTrackerService:e}=await import("./v8u-services-CviCpCEt.js").then(e=>e.m);return{apiCallTrackerService:e}},__vite__mapDeps([8,2,3,4,1,5,6,7,12,13,9,10,0,11,23,21,16,15,17,18,19,20,22,14,29,24,26,27,28,25,31,32,33,30])),n=t.getApiCalls(),r=n.length>0;if(r){if(!(await L.confirm({title:"Clear API Calls?",message:`Changing the flow type will clear all ${n.length} API call${1!==n.length?"s":""} from the display. This action cannot be undone.`,confirmText:"Clear and Change Flow",cancelText:"Cancel",severity:"warning"})))return}if(r&&t.clearApiCalls(),ve.current=!0,I.current=e,F.current=null,c(e),void 0!==l){s(`/v8u/unified/${e}/${l}`,{replace:!0})}setTimeout(()=>{ve.current=!1},100)};return n.jsxs(B,{children:[n.jsxs(S,{title:"🎯 Unified OAuth/OIDC Flow",subtitle:"Single UI for all OAuth 2.0, OAuth 2.1 / OIDC 2.1, and OIDC Core 1.0 flows using real PingOne APIs",gradient:E.unifiedOAuth,textColor:T.darkBlue,children:[n.jsx("div",{id:"v8u-flow-breadcrumbs",style:{minHeight:"40px"}}),n.jsx("div",{style:{display:"flex",gap:"12px",flexWrap:"wrap",marginTop:"16px"},children:n.jsxs("button",{type:"button",onClick:()=>s("/v8u/unified/helper"),style:{display:"flex",alignItems:"center",gap:"6px",padding:"8px 16px",background:"#f59e0b",color:"white",border:"none",borderRadius:"6px",fontSize:"13px",fontWeight:"600",cursor:"pointer",boxShadow:"0 2px 6px rgba(245, 158, 11, 0.3)",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.background="#d97706",e.currentTarget.style.boxShadow="0 3px 10px rgba(245, 158, 11, 0.4)"},onMouseLeave:e=>{e.currentTarget.style.background="#f59e0b",e.currentTarget.style.boxShadow="0 2px 6px rgba(245, 158, 11, 0.3)"},title:"View comprehensive comparison guide for OAuth/OIDC specifications and flow types",children:[n.jsx(o,{size:16}),"📚 Flow & Spec Comparison Guide"]})}),n.jsxs("div",{style:{display:"flex",gap:"12px",flexWrap:"wrap",position:"relative",zIndex:1},children:[n.jsxs("button",{type:"button",onClick:()=>{const e=W({environmentId:fe.environmentId,clientId:fe.clientId,clientSecret:fe.clientSecret}),t=(new Date).toISOString().split("T")[0];K(e,`pingone-unified-flows-complete-${t}-collection.json`,"PingOne Unified Flows Environment"),ee.success("Postman collection and environment downloaded! Import both into Postman to test all Unified flows.")},style:{display:"flex",alignItems:"center",gap:"6px",padding:"8px 16px",background:"#8b5cf6",color:"white",border:"none",borderRadius:"6px",fontSize:"13px",fontWeight:"600",cursor:"pointer",boxShadow:"0 2px 6px rgba(139, 92, 246, 0.3)",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.background="#7c3aed",e.currentTarget.style.boxShadow="0 3px 10px rgba(139, 92, 246, 0.4)"},onMouseLeave:e=>{e.currentTarget.style.background="#8b5cf6",e.currentTarget.style.boxShadow="0 2px 6px rgba(139, 92, 246, 0.3)"},title:"Download comprehensive Postman collection for all Unified flows (Authorization Code, Implicit, Client Credentials, Device Code, Hybrid) grouped by Registration and Authentication",children:[n.jsx(f,{size:16}),"Postman Unified Flows"]}),n.jsxs("button",{type:"button",onClick:()=>{const e=O.loadCredentials("mfa-v8",{flowKey:"mfa-v8",flowType:"oauth",includeClientSecret:!1,includeScopes:!1,includeRedirectUri:!1,includeLogoutUri:!1}),t=N({environmentId:fe.environmentId,clientId:fe.clientId,clientSecret:fe.clientSecret,username:e?.username}),n=(new Date).toISOString().split("T")[0];K(t,`pingone-complete-unified-mfa-${n}-collection.json`,"PingOne Complete Collection Environment"),ee.success("Complete Postman collection (Unified + MFA) downloaded! Import both files into Postman.")},style:{display:"flex",alignItems:"center",gap:"6px",padding:"8px 16px",background:"#10b981",color:"white",border:"none",borderRadius:"6px",fontSize:"13px",fontWeight:"600",cursor:"pointer",boxShadow:"0 2px 6px rgba(16, 185, 129, 0.3)",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.background="#059669",e.currentTarget.style.boxShadow="0 3px 10px rgba(16, 185, 129, 0.4)"},onMouseLeave:e=>{e.currentTarget.style.background="#10b981",e.currentTarget.style.boxShadow="0 2px 6px rgba(16, 185, 129, 0.3)"},title:"Download complete Postman collection for all Unified OAuth/OIDC flows AND all MFA device types in one collection",children:[n.jsx(f,{size:16}),"Postman Complete (Unified + MFA)"]})]})]}),n.jsx(ne,{variant:"buttons"}),n.jsx(re,{flowType:"unified_oauth",title:"📚 OAuth & OIDC Education",sections:[{id:"unified-overview",title:"Unified Flow Overview",icon:n.jsx(o,{}),summary:"Single UI for all OAuth 2.0, OAuth 2.1/OIDC 2.1, and OIDC Core 1.0 flows",content:n.jsxs("div",{children:[n.jsxs("p",{children:[n.jsx("strong",{children:"The Unified OAuth/OIDC Flow"})," provides a single interface for all OAuth and OpenID Connect flows:"]}),n.jsxs("ul",{children:[n.jsxs("li",{children:[n.jsx("strong",{children:"Authorization Code Flow"})," - Most secure flow for web applications"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Client Credentials Flow"})," - Machine-to-machine authentication"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Device Authorization Flow"})," - For devices with limited input"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Implicit Flow"})," - Legacy flow (not recommended)"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Hybrid Flow"})," - OIDC combination flow"]})]}),n.jsx("p",{children:"Each flow adapts to the selected specification version (OAuth 2.0, OAuth 2.1/OIDC 2.1, or OIDC Core 1.0)."})]})},{id:"spec-versions",title:"Specification Versions",icon:n.jsx(f,{}),summary:"Support for OAuth 2.0, OAuth 2.1/OIDC 2.1, and OIDC Core 1.0 specifications",content:n.jsxs("div",{children:[n.jsx("p",{children:n.jsx("strong",{children:"Specification Support:"})}),n.jsxs("ul",{children:[n.jsxs("li",{children:[n.jsx("strong",{children:"OAuth 2.0"})," - Original OAuth 2.0 specification (RFC 6749)"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"OAuth 2.1 / OIDC 2.1"})," - Modern security best practices with PKCE required"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"OIDC Core 1.0"})," - OpenID Connect for identity and authentication"]})]}),n.jsx("p",{children:"The UI automatically adapts based on your selected specification version, showing only compatible flows and features."})]})}]}),n.jsx(G,{currentFlowType:be,showBackToMain:!0}),n.jsxs("div",{style:{padding:"16px",background:"#ffffff",borderRadius:"8px",border:"1px solid #e2e8f0",marginBottom:"32px"},children:[n.jsxs("div",{style:{display:"flex",gap:"32px",flexWrap:"wrap",alignItems:"flex-start",marginBottom:"12px"},children:[n.jsx(Q,{specVersion:g,onChange:e=>{const t=b.getAvailableFlows(e);if(!t.includes(d)){const e=t[0]||"oauth-authz";c(e)}m(e),x.saveSpecVersion(d,e)},disabled:l>0}),n.jsx(H,{specVersion:g,flowType:d,onChange:Fe,disabled:l>0})]}),n.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:[n.jsxs("div",{style:{padding:"8px 12px",background:"#f0f9ff",borderRadius:"4px",border:"1px solid #bae6fd",fontSize:"13px",color:"#0369a1",display:"flex",alignItems:"center",gap:"8px"},children:[n.jsx("span",{children:"📖"}),n.jsxs("span",{children:[n.jsx("strong",{children:"API Documentation:"})," ",n.jsxs("a",{href:(e=>{const t="https://apidocs.pingidentity.com/pingone/platform/v1/api/";let n;switch(z(async()=>{const{analytics:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.l);return{analytics:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33])).then(({analytics:n})=>{n.log({location:"UnifiedOAuthFlowV8U.tsx:1103",message:"Generating PingOne API documentation URL",data:{flowType:e,baseUrl:t},sessionId:"debug-session",runId:"run2",hypothesisId:"A"})}).catch(()=>{}),e){case"oauth-authz":n=`${t}#authorization-and-authentication-apis-authorize-authorization-code`;break;case"implicit":n=`${t}#authorization-and-authentication-apis-authorize-implicit`;break;case"client-credentials":n=`${t}#authorization-and-authentication-apis-token-client-credentials`;break;case"device-code":n=`${t}#authorization-and-authentication-apis-device-authorization-request`;break;case"hybrid":n=`${t}#openid-connect`;break;default:n=t}return z(async()=>{const{analytics:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.l);return{analytics:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33])).then(({analytics:t})=>{t.log({location:"UnifiedOAuthFlowV8U.tsx:1125",message:"Generated PingOne API documentation URL",data:{flowType:e,url:n,hasAnchor:n.includes("#")},sessionId:"debug-session",runId:"run2",hypothesisId:"A"})}).catch(()=>{}),n})(be),target:"_blank",rel:"noopener noreferrer",style:{color:"#0284c7",textDecoration:"underline",fontWeight:"500"},children:["View PingOne API Docs for ",R.getFlowLabel(be)]})]})]}),(()=>{const e=_.getCombinedSpecUrls(g,be);return z(async()=>{const{analytics:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.l);return{analytics:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33])).then(({analytics:t})=>{t.log({location:"UnifiedOAuthFlowV8U.tsx:1369",message:"Generating specification URLs",data:{specVersion:g,flowType:be,primaryUrl:e.primary,primaryLabel:e.primaryLabel,allSpecsCount:e.allSpecs.length,allSpecs:e.allSpecs.map(e=>({label:e.label,url:e.url,isPrimary:e.isPrimary}))},sessionId:"debug-session",runId:"run2",hypothesisId:"B"})}).catch(()=>{}),n.jsxs("div",{style:{padding:"8px 12px",background:"#f0fdf4",borderRadius:"4px",border:"1px solid #86efac",fontSize:"13px",color:"#166534"},children:[n.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"},children:[n.jsx("span",{children:"📋"}),n.jsxs("span",{children:[n.jsx("strong",{children:"Specification:"})," ",n.jsx("a",{href:e.primary,target:"_blank",rel:"noopener noreferrer",style:{color:"#16a34a",textDecoration:"underline",fontWeight:"500"},children:e.primaryLabel})]})]}),e.allSpecs.length>1&&n.jsx("div",{style:{marginLeft:"24px",paddingTop:"4px",fontSize:"12px",color:"#15803d"},children:e.allSpecs.slice(0,3).map((e,t)=>n.jsxs("div",{style:{marginBottom:"4px"},children:[e.isPrimary&&"→ ",n.jsx("a",{href:e.url,target:"_blank",rel:"noopener noreferrer",style:{color:"#16a34a",textDecoration:"underline"},children:e.label})]},t))})]})})()]})]}),ke.length>0&&n.jsxs("div",{style:{marginBottom:"32px",padding:"16px 20px",background:"#fee2e2",borderRadius:"8px",border:"2px solid #dc2626",boxShadow:"0 2px 8px rgba(220, 38, 38, 0.2)"},children:[n.jsxs("div",{style:{fontSize:"16px",fontWeight:"700",color:"#991b1b",marginBottom:"12px",display:"flex",alignItems:"center",gap:"8px"},children:[n.jsx("span",{children:"🚫"}),n.jsx("span",{children:"OAuth 2.1 / OIDC 2.1 Compliance Error"})]}),ke.map((e,t)=>n.jsx("div",{style:{fontSize:"14px",color:"#991b1b",marginBottom:t<ke.length-1?"12px":"0",lineHeight:"1.6"},children:e},t)),n.jsxs("div",{style:{marginTop:"12px",padding:"8px 12px",background:"rgba(220, 38, 38, 0.1)",borderRadius:"6px",fontSize:"13px",color:"#991b1b"},children:[n.jsx("strong",{children:"Action Required:"})," Please select a compliant flow type to proceed."]})]}),Ie.length>0&&!ke.length&&n.jsx("div",{style:{marginBottom:"32px",padding:"12px 16px",background:"#fef3c7",borderRadius:"8px",border:"1px solid #fbbf24"},children:Ie.map((e,t)=>n.jsx("div",{style:{fontSize:"14px",color:"#92400e",marginBottom:t<Ie.length-1?"8px":"0"},children:e},t))}),0===l&&n.jsx(Y,{currentFlowType:be,currentSpecVersion:g,onFlowSelect:(e,t)=>{y.debug("🎯 User selected recommended flow",{selectedFlowType:e,selectedSpecVersion:t}),t!==g&&(m(t),x.saveSpecVersion(e,t)),e!==d&&Fe(e)}}),0===l&&n.jsx(J,{flowType:be,specVersion:g,credentials:{usePKCE:fe.usePKCE||!1,enableRefreshToken:fe.enableRefreshToken||!1,scopes:fe.scopes?fe.scopes.split(" "):[]},onTogglePKCE:e=>{he(t=>({...t,usePKCE:e}))},onToggleRefreshToken:e=>{he(t=>({...t,enableRefreshToken:e}))},onToggleScopes:e=>{he(t=>({...t,scopes:e}))}},`${be}-${g}`),0===l&&n.jsx(q,{flowType:be,specVersion:g,enabledFeatures:le,onFeatureToggle:(e,t)=>{y.debug("🔧 Advanced feature toggled",{featureId:e,enabled:t}),de(t?[...le,e]:le.filter(t=>t!==e))}}),n.jsxs("div",{style:{background:"#ffffff",borderRadius:"12px",border:"1px solid #e2e8f0",boxShadow:"0 1px 3px rgba(0, 0, 0, 0.1)",marginBottom:"32px"},children:[l<Ae()-1&&n.jsxs("button",{type:"button",onClick:()=>{y.debug("🔄 Toggling credentials collapse",{from:ie,to:!ie}),se(!ie)},style:{width:"100%",padding:"1.5rem 1.75rem",background:"linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%)",border:"3px solid transparent",borderRadius:"1rem",cursor:"pointer",fontSize:"1.2rem",fontWeight:"700",color:"#14532d",transition:"all 0.3s ease",position:"relative",boxShadow:"0 2px 8px rgba(34, 197, 94, 0.1)",display:"flex",alignItems:"center",justifyContent:"space-between"},onMouseEnter:e=>{e.currentTarget.style.background="linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)",e.currentTarget.style.borderColor="#86efac",e.currentTarget.style.transform="translateY(-2px)",e.currentTarget.style.boxShadow="0 8px 24px rgba(34, 197, 94, 0.2)"},onMouseLeave:e=>{e.currentTarget.style.background="linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%)",e.currentTarget.style.borderColor="transparent",e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 8px rgba(34, 197, 94, 0.1)"},children:[n.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[n.jsx("span",{style:{fontSize:"20px"},children:"🔧"}),n.jsx("span",{style:{fontSize:"1.2rem",fontWeight:"700"},children:"Configuration & Credentials"})]}),n.jsx("span",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"48px",height:"48px",borderRadius:"12px",background:"linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",border:"3px solid #3b82f6",transform:ie?"rotate(-90deg)":"rotate(0deg)",transition:"all 0.3s ease",cursor:"pointer",color:"#3b82f6",boxShadow:"0 2px 8px rgba(59, 130, 246, 0.2)"},onMouseEnter:e=>{e.currentTarget.style.background="linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",e.currentTarget.style.borderColor="#2563eb",e.currentTarget.style.color="#2563eb",e.currentTarget.style.transform=ie?"rotate(-90deg) scale(1.1)":"rotate(0deg) scale(1.1)",e.currentTarget.style.boxShadow="0 4px 16px rgba(59, 130, 246, 0.3)"},onMouseLeave:e=>{e.currentTarget.style.background="linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",e.currentTarget.style.borderColor="#3b82f6",e.currentTarget.style.color="#3b82f6",e.currentTarget.style.transform=ie?"rotate(-90deg)":"rotate(0deg)",e.currentTarget.style.boxShadow="0 2px 8px rgba(59, 130, 246, 0.2)"},children:n.jsx(h,{style:{width:"24px",height:"24px",strokeWidth:"3px",filter:"drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))"}})})]}),!ie&&n.jsxs("div",{style:{padding:"24px"},children:[n.jsx(X,{flowKey:ye,flowType:be,credentials:fe,onChange:De,title:`${R.getSpecLabel(g)} - ${R.getFlowLabel(be)}`,subtitle:R.getSpecDescription(g),onAppTypeChange:(e,t)=>{if(y.debug("App type changed",{appType:e,suggestedFlowType:t}),t){const n=b.getAvailableFlows(g);if(n.includes(t)){if(y.debug("Auto-selecting suggested flow type",{from:d,to:t,appType:e}),c(t),"oauth-authz"===t&&("spa"===e||"mobile"===e||"desktop"===e)){const t={...fe,usePKCE:!0};De(t),y.debug(`Auto-enabled PKCE for ${e} application type`)}}else y.debug("Suggested flow not available for spec",{suggestedFlowType:t,specVersion:g,availableFlows:n})}}}),n.jsx("div",{style:{marginTop:"20px",paddingTop:"20px",borderTop:"1px solid #e2e8f0"},children:n.jsx(te,{appName:"Unified OAuth & OIDC",appType:"oauth",credentials:fe,metadata:{flowType:be,specVersion:g,environment:fe.environmentId},onExport:()=>{y.info("Credentials exported",{flowKey:ye,flowType:be})},onImport:e=>{y.info("Credentials imported",{flowKey:ye,importedApp:e.appName,importedType:e.appType}),w(ye).then(e=>{he(e)})},onError:e=>{y.error("Credential export/import failed",{error:e.message})}})})]})]}),n.jsxs("div",{style:{background:"#ffffff",borderRadius:"12px",border:"1px solid #e2e8f0",marginBottom:"32px",boxShadow:"0 1px 3px rgba(0, 0, 0, 0.1)",overflow:"hidden"},children:[n.jsxs("button",{type:"button",onClick:()=>ae(!oe),style:{width:"100%",padding:"16px 20px",background:oe?"linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)":"linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",border:"none",borderBottom:oe?"1px solid #e2e8f0":"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:"16px",fontWeight:"600",color:"#374151",transition:"all 0.3s ease"},onMouseEnter:e=>{e.currentTarget.style.background="linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",e.currentTarget.style.color="#1f2937"},onMouseLeave:e=>{e.currentTarget.style.background=oe?"linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)":"linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",e.currentTarget.style.color="#374151"},children:[n.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[n.jsx("span",{style:{fontSize:"20px",color:"#3b82f6"},children:"🔧"}),n.jsx("span",{children:"Worker Token Status"})]}),n.jsx("span",{style:{fontSize:"16px",color:"#6b7280",transform:oe?"rotate(-90deg)":"rotate(0deg)",transition:"all 0.3s ease"},children:"▼"})]}),!oe&&n.jsxs("div",{style:{padding:"20px"},children:[n.jsxs("div",{style:{marginBottom:"20px",display:"flex",flexDirection:"column",gap:"16px"},children:[n.jsxs("button",{type:"button",onClick:async()=>{const{handleShowWorkerTokenModal:e}=await z(async()=>{const{handleShowWorkerTokenModal:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.w);return{handleShowWorkerTokenModal:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]));await e(()=>{},void 0,void 0,void 0,!0)},style:{padding:"10px 20px",border:"none",borderRadius:"8px",background:"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",color:"white",cursor:"pointer",fontWeight:"600",fontSize:"14px",transition:"all 0.2s ease",boxShadow:"0 2px 4px rgba(59, 130, 246, 0.3)",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"},onMouseEnter:e=>{e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 4px 8px rgba(59, 130, 246, 0.4)"},onMouseLeave:e=>{e.currentTarget.style.transform="translateY(0)",e.currentTarget.style.boxShadow="0 2px 4px rgba(59, 130, 246, 0.3)"},children:[n.jsx("span",{style:{fontSize:"16px"},children:"🔑"}),n.jsx("span",{children:"Get Worker Token"})]}),n.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px",paddingLeft:"4px"},children:[n.jsx(A,{onChange:async e=>{if(e)try{const{handleShowWorkerTokenModal:e}=await z(async()=>{const{handleShowWorkerTokenModal:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.w);return{handleShowWorkerTokenModal:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]));await e(()=>{},void 0,!0,!1,!1)}catch(t){}},style:{marginBottom:"12px"}}),n.jsx(C,{onChange:async e=>{},style:{marginBottom:"12px"}})]})]}),n.jsx(P,{mode:"detailed",showRefresh:!0})]})]}),0===ke.length&&n.jsx(Z,{specVersion:g,flowType:be,credentials:fe,onCredentialsChange:De,appConfig:ge??void 0,onFlowReset:()=>{y.debug("🔄 Flow reset detected - preserving credentials, spec version, and flow type",{specVersion:g,flowType:be,flowKey:ye}),w(ye).then(e=>{y.debug("✅ Credentials reloaded after reset",{flowKey:ye,hasRedirectUri:!!e.redirectUri,redirectUri:e.redirectUri,hasClientAuthMethod:!!e.clientAuthMethod,clientAuthMethod:e.clientAuthMethod}),he(e)}).catch(e=>{y.error("❌ Error reloading credentials after reset",{flowKey:ye,error:e})}),y.debug("✅ Flow reset complete - spec version and flow type preserved",{specVersion:g,flowType:be})}}),n.jsx(j,{flowFilter:"unified",reserveSpace:!0})]})},Ve=Object.freeze(Object.defineProperty({__proto__:null,UnifiedOAuthFlowV8U:_e,default:_e},Symbol.toStringTag,{value:"Module"}));export{Ue as S,Ve as U};
//# sourceMappingURL=v8u-flows-j3-FN1rv.js.map
