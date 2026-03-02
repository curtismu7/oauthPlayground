import{a as e,j as r,Y as n,t,k as o,an as i,A as s,h as a,F as d,Q as c,n as l,e as p,v as f,B as m,R as h,l as u,p as g,x,m as b,X as k,ah as j,u as w,aa as y,ag as v,i as $,a2 as S,_ as I,ax as T,ae as C,N as z}from"./react-vendor-HWZo9XlX.js";import{a as E}from"./styled-vendor-DGSsHzxd.js";import{a as _,D as M,f as W,g as R,J as A,h as O}from"./components-oauth-qq-maH2w.js";import{S as D}from"./components-credentials-T7jmF3zx.js";import{u as P}from"./v8u-services-CviCpCEt.js";import{h as N,a4 as U,n as J,l as B,a5 as F,a6 as q}from"./utils-lzKqcxFi.js";import{w as K}from"./v8-services-DHsPM8a2.js";import{N as L}from"./components-flow-core-y1x-SJYd.js";const G=e=>{try{const r=e.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),n=e=>e.charCodeAt(0).toString(16).padStart(2,"0"),t=decodeURIComponent(atob(r).split("").map(e=>`%${n(e)}`).join(""));return JSON.parse(t)}catch(r){return{error:"Invalid token format"}}},V=E.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(8px);
	display: ${({$isOpen:e})=>e?"flex":"none"};
	align-items: center;
	justify-content: center;
	z-index: 10000;
	padding: 1rem;
	animation: ${({$isOpen:e})=>e?"fadeIn 0.3s ease-out":"fadeOut 0.2s ease-in"};

	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1); }
	}

	@keyframes fadeOut {
		from { opacity: 1; transform: scale(1); }
		to { opacity: 0; transform: scale(0.95); }
	}
`,H=E.div`
	background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	border-radius: 0.75rem;
	box-shadow: 
		0 25px 50px -12px rgba(0, 0, 0, 0.25),
		0 0 0 1px rgba(255, 255, 255, 0.05);
	max-width: 700px;
	width: 100%;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	position: relative;
`,Y=E.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1.25rem 1.5rem 0.75rem 1.5rem;
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border-bottom: 1px solid #e2e8f0;
`,X=E.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,Q=E.div`
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
`,Z=E.div`
	flex: 1;
`,ee=E.h2`
	font-size: 1.125rem;
	font-weight: 700;
	color: #1e293b;
	margin: 0;
	line-height: 1.2;
`,re=E.p`
	font-size: 0.8rem;
	color: #64748b;
	margin: 0.25rem 0 0 0;
	font-weight: 500;
`,ne=E.button`
	background: none;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 0.5rem;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #1e293b;
	}
`,te=E.div`
	padding: 1.25rem 1.5rem;
	flex: 1;
	overflow-y: auto;
	min-height: 0;
`,oe=E.div`
	margin-bottom: 1.25rem;
`,ie=E.h3`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,se=E.div`
	background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
	border: 1px solid #10b981;
	border-radius: 0.5rem;
	padding: 0.75rem;
	margin-bottom: 1.25rem;
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
`,ae=E.div`
	color: #059669;
	margin-top: 0.125rem;
`,de=E.div`
	color: #065f46;
	font-size: 0.75rem;
	line-height: 1.4;

	strong {
		font-weight: 600;
	}
`,ce=E.div`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.5rem 0.75rem;
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 0.75rem;
`,le=E.div`
	font-weight: 600;
	color: #374151;
	font-size: 0.8rem;
`,pe=E.div`
	grid-column: 2;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-family: 'Fira Code', monospace;
	font-size: 0.8rem;
	color: #1e293b;
	background: #f8fafc;
	padding: 0.5rem 0.75rem;
	border-radius: 0.375rem;
	border: 1px solid #e2e8f0;
	overflow-x: auto;
	max-width: 100%;
	white-space: nowrap;
	position: relative;
  
	pre {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}
`,fe=E.button`
	background: none;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.25rem;
	transition: all 0.2s ease;
	position: absolute;
	right: 0.5rem;
	top: 50%;
	transform: translateY(-50%);

	&:hover {
		background: #e2e8f0;
		color: #475569;
	}
`,me=E.div`
	margin-bottom: 1rem;
`,he=E.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 600;
	font-size: 0.875rem;
	color: #1e293b;
`,ue=E.input`
	width: 100%;
	padding: 0.625rem 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;
	background-color: #fff;
  
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 1px #3b82f6;
	}
`,ge=E.button`
	background: none;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.25rem;
	transition: all 0.2s ease;
	position: absolute;
	right: 0.5rem;
	top: 50%;
	transform: translateY(-50%);

	&:hover {
		background: #e2e8f0;
		color: #475569;
	}
`,xe=E.pre`
	background: #1e293b;
	color: #e2e8f0;
	padding: 0.75rem;
	border-radius: 0.5rem;
	font-size: 0.75rem;
	overflow-x: auto;
	margin: 0;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	line-height: 1.4;
`,be=E.button`
	padding: 0.4rem 0.75rem;
	background: ${({$copied:e})=>e?"#10b981":"#3b82f6"};
	color: white;
	border: none;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.35rem;
	transition: all 0.2s ease;
	margin-top: 0.5rem;

	&:hover {
		background: ${({$copied:e})=>e?"#059669":"#2563eb"};
	}
`,ke=E.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
	padding: 1rem 1.5rem;
	border-top: 1px solid #e2e8f0;
	margin-top: auto;
	background: #f9fafb;
`,je=E.button`
	opacity: ${({disabled:e})=>e?.7:1};
	cursor: ${({disabled:e})=>e?"not-allowed":"pointer"};
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 1.25rem;
	border-radius: 0.375rem;
	border: none;
	font-weight: 600;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-width: 100px;
	justify-content: center;

	${({$variant:e})=>{switch(e){case"primary":return"\n\t\t\t\t\tbackground: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);\n\t\t\t\t\tcolor: white;\n\t\t\t\t\tbox-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\n\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);\n\t\t\t\t\t\ttransform: translateY(-1px);\n\t\t\t\t\t}\n\t\t\t\t";case"secondary":return"\n\t\t\t\t\tbackground: white;\n\t\t\t\t\tcolor: #374151;\n\t\t\t\t\tborder: 1px solid #d1d5db;\n\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #f9fafb;\n\t\t\t\t\t\tborder-color: #9ca3af;\n\t\t\t\t\t}\n\t\t\t\t"}}}
`,we=E.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 0.5rem;
`,ye=({isOpen:m,onClose:h,onProceed:u,tokenEndpoint:g,requestParams:x,authMethod:b,region:k})=>{const[j,w]=e.useState(!1),[y,v]=e.useState(!1),[$,S]=e.useState(""),[I,T]=e.useState(!1),[C,z]=e.useState(!1),[E,M]=e.useState(!1),W=()=>{const{client_id:e,client_secret:r,scope:n}=x;return"client_secret_basic"===b?`curl -X POST '${g}' \\\n  -H 'Content-Type: application/x-www-form-urlencoded' \\\n  -H 'Authorization: Basic ${btoa(`${e}:${r}`)}' \\\n  -d 'grant_type=client_credentials${n?`&scope=${encodeURIComponent(n)}`:""}'`:`curl -X POST '${g}' \\\n  -H 'Content-Type: application/x-www-form-urlencoded' \\\n  -d 'grant_type=client_credentials' \\\n  -d 'client_id=${encodeURIComponent(e)}' \\\n  -d 'client_secret=${encodeURIComponent(r)}'${n?` \\\n  -d 'scope=${encodeURIComponent(n)}'`:""}`};return m?r.jsx(V,{$isOpen:m,children:r.jsxs(H,{children:[r.jsxs(Y,{children:[r.jsxs(X,{children:[r.jsx(Q,{children:r.jsx(n,{size:24})}),r.jsxs(Z,{children:[r.jsx(ee,{children:"Worker Token API Request"}),r.jsx(re,{children:"Review the Client Credentials Grant request"})]})]}),r.jsx(ne,{onClick:h,title:"Close",children:r.jsx(t,{size:20})})]}),r.jsx(te,{children:C?r.jsxs(oe,{children:[r.jsxs(ie,{children:[r.jsx(n,{size:14}),"Generated Access Token"]}),r.jsxs(se,{children:[r.jsx(ae,{children:r.jsx(o,{size:14})}),r.jsxs(de,{children:[r.jsx("strong",{children:"Token Generated Successfully!"})," This token will be used for API calls."]})]}),r.jsxs(me,{children:[r.jsx(he,{children:"Access Token"}),r.jsxs("div",{style:{position:"relative"},children:[r.jsx(ue,{type:I?"text":"password",value:$,readOnly:!0,style:{paddingRight:"2.5rem"}}),r.jsx(ge,{onClick:()=>T(!I),title:I?"Hide token":"Show token",children:I?r.jsx(i,{size:16}):r.jsx(s,{size:16})})]})]}),r.jsxs(oe,{children:[r.jsxs(ie,{children:[r.jsx(a,{size:14}),"Token Details"]}),r.jsx(xe,{children:r.jsx("pre",{children:JSON.stringify(G($),null,2)})}),r.jsx(we,{children:r.jsxs(je,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText($),v4ToastManager.showSuccess("Token copied to clipboard")},size:"small",children:[r.jsx(d,{size:12}),"Copy Token"]})})]})]}):r.jsxs(r.Fragment,{children:[r.jsxs(se,{children:[r.jsx(ae,{children:r.jsx(o,{size:14})}),r.jsxs(de,{children:[r.jsx("strong",{children:"Client Credentials Grant:"})," This machine-to-machine flow exchanges worker credentials for an access token."]})]}),r.jsxs(oe,{children:[r.jsxs(ie,{children:[r.jsx(c,{size:14}),"Token Endpoint URL"]}),r.jsx(_,{url:g,label:"PingOne Token Endpoint",showInfoButton:!1,showCopyButton:!0,showOpenButton:!1}),r.jsxs("div",{style:{marginTop:"0.5rem",fontSize:"0.75rem",color:"#6b7280"},children:[r.jsx("strong",{children:"Region:"})," ",(e=>{switch(e.toLowerCase()){case"us":return"US (auth.pingone.com)";case"eu":return"Europe (auth.pingone.eu)";case"ap":return"Asia Pacific (auth.pingone.asia)";case"ca":return"Canada (auth.pingone.ca)";default:return e}})(k)]})]}),r.jsxs(oe,{children:[r.jsxs(ie,{children:[r.jsx(l,{size:14}),"Request Parameters"]}),r.jsxs(ce,{children:[r.jsx(le,{children:"Grant Type"}),r.jsx(pe,{children:"client_credentials"}),r.jsx(le,{children:"Client ID"}),r.jsx(pe,{children:x.client_id}),r.jsx(le,{children:"Client Secret"}),r.jsxs(pe,{children:[r.jsx("span",{style:{flex:1},children:y?x.client_secret:"•".repeat(Math.min(x.client_secret.length,40))}),r.jsx(fe,{onClick:()=>v(!y),title:y?"Hide secret":"Show secret",children:y?r.jsx(i,{size:16}):r.jsx(s,{size:16})})]}),r.jsx(le,{children:"Auth Method"}),r.jsx(pe,{children:"client_secret_basic"===b?"Basic (Authorization header)":"Post (Request body)"}),x.scope&&r.jsxs(r.Fragment,{children:[r.jsx(le,{children:"Scopes"}),r.jsx(pe,{children:x.scope})]})]})]}),r.jsxs(oe,{children:[r.jsxs(ie,{children:[r.jsx(n,{size:14}),"cURL Command"]}),r.jsx(xe,{children:W()}),r.jsxs(be,{$copied:j,onClick:()=>{const e=W();navigator.clipboard.writeText(e),w(!0),setTimeout(()=>w(!1),2e3)},children:[j?r.jsx(p,{size:12}):r.jsx(d,{size:12}),j?"Copied!":"Copy cURL"]})]}),r.jsxs(se,{style:{background:"linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",border:"1px solid #f59e0b",marginBottom:0},children:[r.jsx(ae,{style:{color:"#d97706"},children:r.jsx(o,{size:14})}),r.jsxs(de,{style:{color:"#92400e"},children:[r.jsx("strong",{children:"Security:"})," Sent securely over HTTPS. Credentials never logged."]})]})]})}),r.jsxs(ke,{children:[r.jsx(je,{$variant:"secondary",onClick:h,children:"Cancel"}),r.jsx(je,{$variant:"primary",onClick:C?()=>{u($),h()}:async()=>{try{M(!0);const e=await fetch(g,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",..."client_secret_basic"===b&&{Authorization:`Basic ${btoa(`${x.client_id}:${x.client_secret}`)}`}},body:new URLSearchParams({grant_type:"client_credentials",..."client_secret_basic"!==b&&{client_id:x.client_id,client_secret:x.client_secret},...x.scope&&{scope:x.scope}}).toString()}),r=await e.json();if(!r.access_token)throw new Error(r.error_description||"Failed to get access token");S(r.access_token),z(!0)}catch(e){}finally{M(!1)}},disabled:E,children:E?r.jsxs(r.Fragment,{children:[r.jsx(f,{className:"animate-spin",size:14}),"Generating..."]}):C?r.jsxs(r.Fragment,{children:[r.jsx(p,{size:14}),"Use Token"]}):r.jsxs(r.Fragment,{children:[r.jsx(n,{size:14}),"Send Request"]})})]})]})}):null},ve=(e,r)=>{if(!e||!r)return null;try{const n=localStorage.getItem(r);if(!n)return{token:e,isExpired:!1,isExpiringSoon:!1,minutesRemaining:0,expiresAt:null,expiresAtFormatted:null};const t=parseInt(n,10),o=Date.now(),i=o>=t,s=t-o,a=Math.floor(s/6e4);return{token:e,isExpired:i,isExpiringSoon:!i&&a<15,minutesRemaining:i?0:a,expiresAt:t,expiresAtFormatted:new Date(t).toLocaleString()}}catch(n){return null}},$e=(e,r,n={})=>{const{clearExpired:t=!0,showToast:o=!0,requiredScopes:i}=n;try{const n=localStorage.getItem(e);if(!n)return{isValid:!1,token:null,expirationInfo:null,errorMessage:"No worker token found. Please generate a new worker token."};const s=ve(n,r);return s?s.isExpired?(t&&(localStorage.removeItem(e),localStorage.removeItem(r)),o&&N.showError(`Worker token has EXPIRED (expired at ${s.expiresAtFormatted}). Please generate a new worker token.`),{isValid:!1,token:null,expirationInfo:s,errorMessage:`Worker token expired at ${s.expiresAtFormatted}. Please generate a new token${i?` with scopes: ${i.join(", ")}`:""}.`}):(s.isExpiringSoon&&o&&N.showWarning(`Worker token expires soon (${s.minutesRemaining} minutes remaining). Consider generating a new token.`),{isValid:!0,token:n,expirationInfo:s}):(o&&N.showWarning("Worker token found but expiration data is missing. The token may be expired."),{isValid:!1,token:n,expirationInfo:null,errorMessage:"Worker token expiration data is missing. Please generate a new worker token."})}catch(s){return{isValid:!1,token:null,expirationInfo:null,errorMessage:"Error checking worker token. Please try generating a new token."}}},Se=E.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.625rem;
  border-radius: 0.375rem;
  background: ${({$variant:e})=>"warning"===e?"rgba(251, 191, 36, 0.1)":"rgba(59, 130, 246, 0.1)"};
  border: 1px solid ${({$variant:e})=>"warning"===e?"rgba(251, 191, 36, 0.3)":"rgba(59, 130, 246, 0.3)"};
`,Ie=E.div`
  flex: 1;
`,Te=E.div`
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
`,Ce=E.div`
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.4;
`,ze=E.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  background: ${({$variant:e})=>"secondary"===e?"#e5e7eb":"success"===e?"#10b981":"#2563eb"};
  color: ${({$variant:e})=>"secondary"===e?"#1f2937":"#ffffff"};
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease;
  font-size: 0.8125rem;
  text-decoration: none;

  &:hover {
    background: ${({$variant:e})=>"secondary"===e?"#d1d5db":"success"===e?"#059669":"#1e40af"};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`,Ee=E.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`,_e=E.div`
	position: sticky;
	bottom: -1.5rem;
	margin: 1rem -1.5rem 0;
	padding: 1rem 1.5rem 1.5rem;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #ffffff 40%, #ffffff 100%);
	border-top: 1px solid #e2e8f0;
	box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.05);
	z-index: 5;
`,Me=E.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0.75rem 0;
`,We=E.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`,Re=E.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.8125rem;
`,Ae=E.input`
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Oe=E.select`
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: #ffffff;
  transition: border-color 0.2s ease;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  option:disabled {
    color: #9ca3af;
  }
`,De=E.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  
  input {
    width: 100%;
    padding-right: 2.5rem; /* Make room for the toggle button */
  }
`,Pe=E.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #374151;
  }
`,Ne=E.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`,Ue=({isOpen:t,onClose:a,onContinue:d,flowType:c="flow",environmentId:l="",skipCredentialsStep:p=!1,prefillCredentials:b,tokenStorageKey:k="worker_token",tokenExpiryKey:j="worker_token_expires_at",educationalMode:w=!0})=>{const y=m(),[v,$]=e.useState(!1),[S,I]=e.useState(p),[T,C]=e.useState(!1),[z,E]=e.useState(!1),[_,W]=e.useState(!1),[R,A]=e.useState(!1),[O,J]=e.useState(null),[B,F]=e.useState(()=>{if(b){const e=b.clientId?.trim()||"",r=b.clientSecret?.trim()||"",n=b.scopes?.trim()||"",t=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,o=(b.environmentId||l||"").trim();return{environmentId:o&&t.test(o)?o:"",clientId:e,clientSecret:r,region:b.region||"us",scopes:n,authMethod:"client_secret_post"}}return{environmentId:l||"",clientId:"",clientSecret:"",region:"us",scopes:"",authMethod:"client_secret_post"}});e.useEffect(()=>{if(!b){(async()=>{try{const e=await P.loadCredentials();if(e){const r=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,n=e.environmentId?.trim()||"";n&&r.test(n)&&F({environmentId:n,clientId:e.clientId||"",clientSecret:e.clientSecret||"",region:e.region||"us",scopes:(Array.isArray(e.scopes)?e.scopes.join(" "):e.scopes||"").split(" ")[0]||"",authMethod:e.tokenEndpointAuthMethod||"client_secret_post"})}}catch(e){}})()}},[b]);const q=h.useRef(!1);e.useEffect(()=>{t||(q.current=!1)},[t]),e.useEffect(()=>{if(t&&!q.current)if(q.current=!0,b){const e=(b.environmentId||l||"").trim();let r=b.scopes||"";if(r){const e=r.split(/\s+/).filter(e=>e?.trim()&&"openid"!==e&&"opneid"!==e&&"profile"!==e&&"email"!==e);r=e.length>0?e[0]:""}F({environmentId:e,clientId:(b.clientId||"").trim(),clientSecret:(b.clientSecret||"").trim(),region:b.region||"us",scopes:r,authMethod:"client_secret_post"})}else{(async()=>{try{const e=await P.loadCredentials();if(e){const r=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,n=e.environmentId?.trim()||"";if(!(n&&r.test(n)))return;F({environmentId:n,clientId:e.clientId||"",clientSecret:e.clientSecret||"",region:e.region||"us",scopes:(()=>{const r=Array.isArray(e.scopes)?e.scopes.join(" "):e.scopes||"";if(r){const e=r.split(/\s+/).filter(Boolean);return e.length>0?e[0]:""}return""})(),authMethod:e.tokenEndpointAuthMethod||"client_secret_post"})}else{const e=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,r=l?.trim()||"";r&&e.test(r)&&F(e=>({...e,environmentId:r}))}}catch(e){}})()}},[b,l,t,c]),e.useEffect(()=>{if(l&&!b&&!q.current){const e=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,r=l.trim();e.test(r)&&F(n=>{const t=n.environmentId.trim();return t&&e.test(t)?n:{...n,environmentId:r}})}},[l,b]),e.useEffect(()=>{t&&p?I(!0):t||I(!1)},[t,p]);const K=()=>{$(!0),N.showInfo("Navigating to get worker token..."),y("/client-generator")};e.useEffect(()=>{if(t){(async()=>{const e=await P.loadCredentials();if(e?.environmentId&&e.clientId&&e.clientSecret){const r=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,n=e.environmentId?.trim()||"";if(n&&r.test(n)){const r=(Array.isArray(e.scopes)?e.scopes.join(" "):e.scopes||"").split(/\s+/).filter(Boolean),t=r.length>0?r[0]:"";F(r=>r.clientId&&r.clientSecret&&r.environmentId===n?r:{environmentId:n,clientId:e.clientId||"",clientSecret:e.clientSecret||"",region:e.region||"us",scopes:t,authMethod:e.tokenEndpointAuthMethod||"client_secret_post"})}}})()}},[t]);const L=async()=>{if(O){W(!1),C(!0);try{const{tokenEndpoint:n,requestParams:t,authMethod:o}=O,i={"Content-Type":"application/x-www-form-urlencoded"},s={grant_type:t.grant_type,scope:t.scope||""};switch(o){case"client_secret_basic":i.Authorization=`Basic ${btoa(`${t.client_id}:${t.client_secret}`)}`,s.client_id=t.client_id;break;case"client_secret_post":case"client_secret_jwt":case"private_key_jwt":default:s.client_id=t.client_id,s.client_secret=t.client_secret;break;case"none":s.client_id=t.client_id}const a=new URLSearchParams;Object.entries(s).forEach(([e,r])=>{("scope"!==e||r&&""!==r.trim())&&null!=r&&""!==r&&a.append(e,String(r))});const d=await U(n,{method:"POST",headers:i,body:a.toString()});if(!d.ok){const e=await d.text();let r={};try{r=JSON.parse(e)}catch{r={raw:e}}const n=B.clientId.trim(),t=B.clientSecret.trim(),i=b?.environmentId?.trim()||l?.trim()||B.environmentId.trim();let s="Unknown error occurred";const a=r.error||"",c=r.error_description||"",p=`\n\nPlease verify:\n• Environment ID: ${i||"MISSING"}\n• Client ID: ${n?`${n.substring(0,20)}...`:"MISSING"}\n• Client Secret: ${t?`***${t.substring(t.length-4)}`:"MISSING"}\n• Token Auth Method: ${o}`;return s="invalid_client"===a?"Your Client ID or Client Secret is incorrect, or the authentication method is not supported by this application."+p:"invalid_scope"===a?"The scopes you requested are not valid or not granted to this application. Note: Worker tokens require management API scopes (e.g., p1:read:users), not OIDC scopes (e.g., profile, email, openid)."+p:"unauthorized_client"===a?"This client is not authorized to use the client_credentials grant type."+p:400===d.status||401===d.status?(c||`HTTP ${d.status}: ${e}`)+p:c?c+p:r.raw?`HTTP ${d.status}: ${String(r.raw)}${p}`:`HTTP ${d.status}: ${e}${p}`,N.showError(s),void C(!1)}const c=await d.json(),p=t.scope||"";let f=[];if(c.scope)f=c.scope.split(" ").filter(Boolean);else try{const e=c.access_token.split(".");if(3===e.length){const r=JSON.parse(atob(e[1]));f=r.scope?r.scope.split(" ").filter(Boolean):[]}}catch(e){}if(f.length>0){const e=p.split(/\s+/).filter(Boolean);e.filter(e=>!f.includes(e)).length}const m=c.expires_in||3600,h=Date.now()+1e3*m;localStorage.setItem(k,c.access_token),localStorage.setItem(j,h.toString());const u=(B.scopes||"").split(/\s+/).filter(e=>e?.trim()&&"openid"!==e&&"opneid"!==e),g=u.length>0?[u[0]]:[],x={environmentId:B.environmentId.trim(),clientId:B.clientId.trim(),clientSecret:B.clientSecret.trim(),region:B.region,scopes:g,tokenEndpointAuthMethod:B.authMethod};let w=!0;try{await P.saveCredentials(x),await P.saveToken(c.access_token,h)}catch(r){w=!1}localStorage.setItem("worker_credentials",JSON.stringify({environmentId:x.environmentId,clientId:x.clientId,clientSecret:x.clientSecret,region:x.region,authMethod:x.tokenEndpointAuthMethod,scopes:u.join(" ")}));let y="workerTokenUpdated";"worker_token_metrics"===k?y="workerTokenMetricsUpdated":"worker_token_audit"===k&&(y="workerTokenAuditUpdated"),window.dispatchEvent(new CustomEvent(y,{detail:{token:c.access_token,expiresAt:h}})),((e,r)=>{const n=Math.floor(e/60),t=Math.floor(n/60),o=t>0?`${t} hour${1!==t?"s":""}`:`${n} minute${1!==n?"s":""}`,i=r&&r.length>0?` with scopes: ${r.join(", ")}`:"";N.showSuccess(`Worker token generated successfully! Expires in ${o}.${i}`)})(m),A(!0)}catch(r){N.showError(`Failed to generate worker token: ${r instanceof Error?r.message:"Unknown error"}`)}finally{C(!1)}}else N.showError("Request details not available")};return t?r.jsxs(r.Fragment,{children:[r.jsx(M,{isOpen:t,onClose:a,title:p?"Get Worker Token":"Worker Token Required",maxHeight:"calc(100vh - 4rem)",width:"min(900px, calc(100vw - 2rem))",children:r.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:[!p&&r.jsxs(Se,{$variant:"warning",children:[r.jsx(u,{size:16,style:{flexShrink:0,color:"#f59e0b",marginTop:"0.125rem"}}),r.jsxs(Ie,{children:[r.jsx(Te,{style:{fontSize:"0.875rem",marginBottom:"0.125rem"},children:"Worker Token Required"}),r.jsx(Ce,{children:"Generate a PingOne worker token to unlock Config Checker features."})]})]}),R?r.jsxs(r.Fragment,{children:[r.jsxs(Se,{$variant:"info",children:[r.jsx(o,{size:16,style:{flexShrink:0,color:"#10b981",marginTop:"0.125rem"}}),r.jsxs(Ie,{children:[r.jsx(Te,{style:{fontSize:"0.875rem",marginBottom:"0.125rem",color:"#10b981"},children:"✅ Worker Token Generated Successfully!"}),r.jsx(Ce,{children:"Your worker token has been generated and saved. You can continue with the current flow or generate another token if needed."})]})]}),r.jsxs(Ee,{children:[r.jsx(ze,{$variant:"success",onClick:d,children:"✓ Continue with Current Token"}),r.jsxs(ze,{onClick:()=>A(!1),children:[r.jsx(f,{}),"Generate Another Token"]}),r.jsxs(ze,{$variant:"secondary",onClick:K,disabled:v,children:[r.jsx(g,{}),"Use Client Generator"]})]})]}):S?r.jsxs(r.Fragment,{children:[p&&r.jsxs(Se,{$variant:"info",children:[r.jsx(o,{size:16,style:{flexShrink:0,color:"#3b82f6",marginTop:"0.125rem"}}),r.jsxs(Ie,{children:[r.jsx(Te,{style:{fontSize:"0.875rem",marginBottom:"0.125rem"},children:"Enter Credentials"}),r.jsx(Ce,{children:"Provide worker app credentials, then generate your token."})]})]}),!p&&r.jsxs(Se,{$variant:"info",children:[r.jsx(o,{size:16,style:{flexShrink:0,color:"#3b82f6",marginTop:"0.125rem"}}),r.jsxs(Ie,{children:[r.jsx(Te,{style:{fontSize:"0.875rem",marginBottom:"0.125rem"},children:"Enter Credentials"}),r.jsx(Ce,{children:"Provide worker app credentials, then generate your token."})]})]}),r.jsxs(Me,{children:[r.jsxs(We,{children:[r.jsxs(Re,{children:["Environment ID ",r.jsx("span",{style:{color:"#ef4444"},children:"*"})]}),r.jsx(Ae,{type:"text",placeholder:"e.g., b9817c16-9910-4415-b67e-4ac687da74d9",value:B.environmentId||"",onChange:e=>F(r=>({...r,environmentId:e.target.value.trim()})),style:{borderColor:B.environmentId?void 0:"#ef4444"}}),!B.environmentId&&r.jsx("div",{style:{fontSize:"0.75rem",color:"#ef4444",marginTop:"0.25rem"},children:"Environment ID is required"})]}),r.jsxs(We,{children:[r.jsx(Re,{children:"Region"}),r.jsxs(Ae,{as:"select",value:B.region,onChange:e=>F(r=>({...r,region:e.target.value})),children:[r.jsx("option",{value:"us",children:"US (auth.pingone.com)"}),r.jsx("option",{value:"eu",children:"Europe (auth.pingone.eu)"}),r.jsx("option",{value:"ap",children:"Asia Pacific (auth.pingone.asia)"}),r.jsx("option",{value:"ca",children:"Canada (auth.pingone.ca)"})]})]}),r.jsxs(We,{children:[r.jsx(Re,{children:"Client ID *"}),r.jsx(Ae,{type:"text",placeholder:"e.g., 5ac8ccd7-7ebc-4684-b0d9-233705e87a7c",value:B.clientId,onChange:e=>F(r=>({...r,clientId:e.target.value}))})]}),r.jsxs(We,{children:[r.jsx(Re,{children:"Client Secret *"}),r.jsxs(De,{children:[r.jsx(Ae,{type:z?"text":"password",placeholder:"Enter your client secret",value:B.clientSecret,onChange:e=>F(r=>({...r,clientSecret:e.target.value}))}),r.jsx(Pe,{onClick:()=>E(!z),children:z?r.jsx(i,{size:16}):r.jsx(s,{size:16})})]})]}),r.jsxs(We,{children:[r.jsx(Re,{children:"Token Endpoint Authentication Method"}),r.jsxs(Oe,{value:B.authMethod,onChange:e=>F(r=>({...r,authMethod:e.target.value})),children:[r.jsx("option",{value:"none",disabled:!0,children:"None"}),r.jsx("option",{value:"client_secret_basic",children:"Client Secret Basic"}),r.jsx("option",{value:"client_secret_post",children:"Client Secret Post"}),r.jsx("option",{value:"client_secret_jwt",children:"Client Secret JWT"}),r.jsx("option",{value:"private_key_jwt",children:"Private Key JWT"})]}),r.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.125rem",lineHeight:"1.3"},children:'💡 Use "Client Secret Post" for most PingOne applications.'})]}),r.jsxs(We,{children:[r.jsx(Re,{children:"Scopes"}),r.jsx(Ae,{type:"text",placeholder:"Leave empty or enter scope (e.g., p1:read:users)",value:B.scopes||"",onChange:e=>F(r=>({...r,scopes:e.target.value}))}),!w&&r.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.125rem",lineHeight:"1.3"},children:"Scopes are optional and not used for authorization. Worker tokens use roles."})]})]}),r.jsxs(_e,{children:[r.jsxs(Ee,{children:[r.jsxs(ze,{onClick:async()=>{if(!B.environmentId||!B.clientId||!B.clientSecret)return void N.showError("Please fill in all required fields");try{const e=(B.scopes||"").split(/\s+/).filter(e=>e?.trim()&&"openid"!==e&&"opneid"!==e),r=e.length>0?[e[0]]:[],n={environmentId:B.environmentId.trim(),clientId:B.clientId.trim(),clientSecret:B.clientSecret.trim(),region:B.region,scopes:r,tokenEndpointAuthMethod:B.authMethod},t={isValid:!!(n.environmentId&&n.clientId&&n.clientSecret),errors:[]};if(n.environmentId?.trim()||t.errors.push("Environment ID is required"),n.clientId?.trim()||t.errors.push("Client ID is required"),n.clientSecret?.trim()||t.errors.push("Client Secret is required"),!t.isValid)return void N.showError(`Invalid credentials: ${t.errors.join(", ")}`);try{await P.saveCredentials(n)}catch(a){}}catch(a){}let e="";if(e=b?.environmentId?.trim()?b.environmentId.trim():l?.trim()?l.trim():B.environmentId.trim(),!e)return void N.showError("Environment ID is required");if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e))return void N.showError(`Invalid Environment ID format. Expected UUID format, got: ${e.substring(0,20)}...`);const r=`https://${{us:"auth.pingone.com",eu:"auth.pingone.eu",ap:"auth.pingone.asia",ca:"auth.pingone.ca",na:"auth.pingone.com"}[B.region]||"auth.pingone.com"}/${e}/as/token`;let n=B.scopes||"";const t=["openid","opneid","profile","email","address","phone"];if(n=n.split(/\s+/).filter(e=>e?.trim()&&!t.includes(e.toLowerCase())).join(" ").trim(),n&&""!==n){const e=n.split(/\s+/).filter(Boolean);e.length>1&&(n=e[0])}else n="";const o=B.clientId.trim(),i=B.clientSecret.trim();if(!o||!i||!e)return void N.showError("Please fill in all required fields (Environment ID, Client ID, and Client Secret)");const s={grant_type:"client_credentials",client_id:o,client_secret:i};if(n?.trim()&&""!==n.trim()&&(s.scope=n.trim()),w)return J({tokenEndpoint:r,requestParams:s,authMethod:B.authMethod,region:B.region||"us"}),void W(!0);J({tokenEndpoint:r,requestParams:s,authMethod:B.authMethod,region:B.region||"us"}),L()},disabled:T||!B.environmentId||!B.clientId||!B.clientSecret,children:[T?r.jsx(Ne,{}):r.jsx(f,{}),T?"Generating...":"Generate Worker Token"]}),r.jsxs(ze,{$variant:"success",onClick:async()=>{if(!B.environmentId||!B.clientId||!B.clientSecret)return void N.showError("Please fill in all required fields before saving");const e=B.scopes.split(/\s+/).filter(e=>e?.trim()&&"openid"!==e&&"opneid"!==e&&"profile"!==e&&"email"!==e),r=e.length>0?[e[0]]:[],n={environmentId:B.environmentId.trim(),clientId:B.clientId.trim(),clientSecret:B.clientSecret.trim(),region:B.region,scopes:r,tokenEndpointAuthMethod:B.authMethod},t={isValid:!!(n.environmentId&&n.clientId&&n.clientSecret),errors:[]};if(n.environmentId?.trim()||t.errors.push("Environment ID is required"),n.clientId?.trim()||t.errors.push("Client ID is required"),n.clientSecret?.trim()||t.errors.push("Client Secret is required"),t.isValid){try{await P.saveCredentials(n)}catch(o){return void N.showError("Failed to save credentials")}localStorage.setItem("worker_credentials",JSON.stringify({environmentId:n.environmentId,clientId:n.clientId,clientSecret:n.clientSecret,region:n.region,authMethod:n.tokenEndpointAuthMethod,scopes:r.join(" ")})),N.showSuccess("Credentials saved successfully")}else N.showError(`Invalid credentials: ${t.errors.join(", ")}`)},disabled:T||!B.environmentId||!B.clientId||!B.clientSecret,children:[r.jsx(x,{}),"Save Credentials"]}),r.jsx(ze,{$variant:"secondary",onClick:()=>{P.clearCredentials(),localStorage.removeItem("worker_credentials"),localStorage.removeItem(k),localStorage.removeItem(j),F({environmentId:l||"",clientId:"",clientSecret:"",region:"us",scopes:"p1:read:users p1:read:environments p1:read:applications p1:read:connections",authMethod:"client_secret_post"}),N.showSuccess("Saved credentials cleared successfully")},disabled:T,children:"🗑️ Clear Saved Credentials"}),r.jsx(ze,{$variant:"secondary",onClick:()=>I(!1),children:"Cancel"})]}),B.clientId&&B.clientSecret&&r.jsx("div",{style:{marginTop:"1rem",borderTop:"1px solid #e2e8f0",paddingTop:"1rem"},children:r.jsx(D,{appName:"Worker Token",appType:"worker-token",credentials:{environmentId:B.environmentId,clientId:B.clientId,clientSecret:B.clientSecret,region:B.region||"us",tokenEndpointAuthMethod:B.tokenEndpointAuthMethod||"client_secret_basic",scopes:B.scopes||[]},metadata:{workflow:"worker-token",description:"Worker Token credentials for PingOne API access"},onExport:()=>{},onImport:e=>{window.location.reload()}})})]})]}):r.jsxs(r.Fragment,{children:[r.jsxs(Se,{$variant:"info",children:[r.jsx(o,{size:16,style:{flexShrink:0,color:"#3b82f6",marginTop:"0.125rem"}}),r.jsxs(Ie,{children:[r.jsx(Te,{style:{fontSize:"0.875rem",marginBottom:"0.125rem"},children:"Get Worker Token"}),r.jsx(Ce,{children:"Enter your PingOne worker app credentials, then generate a token. You can also jump to Client Generator if you prefer."})]})]}),r.jsxs(Ee,{children:[r.jsxs(ze,{onClick:()=>I(!0),children:[r.jsx(n,{}),"Generate Worker Token Here"]}),r.jsxs(ze,{onClick:K,disabled:v,children:[r.jsx(g,{}),"Use Client Generator"]}),r.jsx(ze,{$variant:"secondary",onClick:()=>{N.showWarning("Config Checker will be disabled without worker token"),d()},children:"Continue Without Config Checker"})]})]})]})}),O&&w&&r.jsx(ye,{isOpen:_,onClose:()=>W(!1),onProceed:L,tokenEndpoint:O.tokenEndpoint,requestParams:O.requestParams,authMethod:O.authMethod,region:O.region})]}):null};class Je{static isJWT(e){if(!e||"string"!=typeof e)return!1;const r=e.split(".");return 3===r.length&&r.every(e=>e.length>0)}static decodeJWT(e){if(!Je.isJWT(e))return null;try{const r=e.split("."),n=JSON.parse(atob(r[0].replace(/-/g,"+").replace(/_/g,"/")));return{header:n,payload:JSON.parse(atob(r[1].replace(/-/g,"+").replace(/_/g,"/"))),signature:r[2]}}catch(r){return null}}static async copyToClipboard(e){try{return await navigator.clipboard.writeText(e),!0}catch(r){try{const r=document.createElement("textarea");r.value=e,r.style.position="fixed",r.style.left="-999999px",r.style.top="-999999px",document.body.appendChild(r),r.focus(),r.select();const n=document.execCommand("copy");return document.body.removeChild(r),n}catch(n){return!1}}}static maskToken(e,r=4){if(!e||e.length<=2*r)return"••••••••••••••••••••";const n=e.substring(0,r),t=e.substring(e.length-r);return`${n}${"•".repeat(Math.max(8,e.length-2*r))}${t}`}static getTokenInfo(e,r,n){return{type:r,length:e?.length||0,isJWT:Je.isJWT(e||""),flow:n}}static logTokenRender(e){(new Date).toISOString().replace("T"," ").substring(0,19)}static logTokenCopy(e){(new Date).toISOString().replace("T"," ").substring(0,19)}static logTokenDecode(e,r){(new Date).toISOString().replace("T"," ").substring(0,19)}static isOIDCFlow(e){return/oidc|authz|hybrid|implicit/i.test(e)}static getTokenLabel(e,r=!1){switch(e){case"access":return"Access Token";case"id":return r?"ID Token (OIDC)":"ID Token";case"refresh":return"Refresh Token";default:return"Token"}}static getOpaqueTokenMessage(e){switch(e){case"access":return"Access token is opaque and cannot be decoded as JWT.";case"id":return"ID token should be a JWT in OIDC flows. If opaque, this may indicate a configuration issue.";case"refresh":return"Refresh token is opaque and cannot be decoded as JWT.";default:return"Token is opaque and cannot be decoded as JWT."}}}const Be=E.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
  overflow: visible;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
`,Fe=E.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
`,qe=E.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
`,Ke=E.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${({$type:e})=>{switch(e){case"access":return"#dbeafe";case"id":return"#dcfce7";case"refresh":return"#fef3c7";default:return"#f3f4f6"}}};
  color: ${({$type:e})=>{switch(e){case"access":return"#1e40af";case"id":return"#166534";case"refresh":return"#92400e";default:return"#374151"}}};
`,Le=E.div`
  display: flex;
  gap: 0.5rem;
`,Ge=E.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid ${({$variant:e})=>{switch(e){case"primary":return"#3b82f6";case"management":return"#059669";default:return"#d1d5db"}}};
  background: ${({$variant:e})=>{switch(e){case"primary":return"#3b82f6";case"management":return"#059669";default:return"white"}}};
  color: ${({$variant:e})=>{switch(e){case"primary":case"management":return"white";default:return"#374151"}}};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({$variant:e})=>{switch(e){case"primary":return"#2563eb";case"management":return"#047857";default:return"#f9fafb"}}};
    border-color: ${({$variant:e})=>{switch(e){case"primary":return"#2563eb";case"management":return"#047857";default:return"#9ca3af"}}};
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,Ve=E.div`
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: visible;
`,He=E.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #374151;
  background: #f0fdf4;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
  overflow-x: auto;
  white-space: nowrap;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  letter-spacing: 0.01em;
`,Ye=E.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
  max-width: 100%;
`,Xe=E.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-size: 0.875rem;
`,Qe=({label:t,token:o="",tokenType:i,isOIDC:s=!1,flowKey:a="",className:l,defaultMasked:p=!1,allowMaskToggle:f=!0})=>{const[m]=e.useState(!1),[h,u]=e.useState(!1),[x,b]=e.useState(null),[k,j]=e.useState(!1);Je.getTokenInfo(o,i,a);const w=(e=>{if(!e)return"";if(m)return Je.maskToken(e);if(e.length<=80)return e;const r=[];for(let n=0;n<e.length;n+=80)r.push(e.slice(n,n+80));return r.join("\n")})(o),y=t||Je.getTokenLabel(i,s);return r.jsxs(Be,{className:l,children:[r.jsxs(Fe,{children:[r.jsxs(qe,{children:["access"===i?r.jsx(n,{size:16}):r.jsx(c,{size:16}),y,r.jsx(Ke,{$type:i,children:i.toUpperCase()})]}),r.jsxs(Le,{children:[r.jsxs(Ge,{onClick:()=>{if(!h)try{const e=Je.decodeJWT(o);e?(b(e),j(!1)):j(!0)}catch(e){j(!0)}u(!h)},title:h?"Hide decoded content":"Show decoded content",children:[r.jsx(n,{size:14}),h?"Hide Decode":"Decode"]}),r.jsxs(Ge,{onClick:async()=>{try{await navigator.clipboard.writeText(o),N.showSuccess("Token copied to clipboard")}catch(e){N.showError("Failed to copy token")}},title:"Copy token",$variant:"primary",disabled:!o,children:[r.jsx(d,{size:14}),"Copy"]}),r.jsxs(Ge,{onClick:()=>{const e=`/token-management?token=${encodeURIComponent(o)}&type=${i}`;window.open(e,"_blank")},title:"Send to Token Management",$variant:"management",disabled:!o,children:[r.jsx(g,{size:14}),"Token Management"]})]})]}),r.jsxs(Ve,{children:[r.jsx(He,{children:w}),h&&r.jsx("div",{children:k?r.jsxs(Xe,{children:[r.jsx(c,{size:20}),Je.getOpaqueTokenMessage(i)]}):x?r.jsxs("div",{children:[r.jsx("h4",{style:{marginBottom:"0.5rem",color:"#374151",fontSize:"0.875rem"},children:"Header:"}),r.jsx(Ye,{children:JSON.stringify(x.header,null,2)}),r.jsx("h4",{style:{marginBottom:"0.5rem",marginTop:"1rem",color:"#374151",fontSize:"0.875rem"},children:"Payload:"}),r.jsx(Ye,{children:JSON.stringify(x.payload,null,2)})]}):r.jsxs(Xe,{children:[r.jsx(c,{size:20}),"Unable to decode token content."]})})]})]})},Ze=({tokens:e,backgroundColor:n="rgba(0, 0, 0, 0.4)",borderColor:t="#374151",textColor:o,headerTextColor:i})=>{if(!e||!e.access_token&&!e.id_token&&!e.refresh_token)return null;const s=i||(n.includes("rgba(0, 0, 0")||"#000000"===n?"#ffffff":"#1e293b"),a="#e5e7eb";return r.jsx("div",{style:{position:"relative",width:"100%",maxWidth:"800px",margin:"0 auto",padding:"0.5rem",boxSizing:"border-box",backgroundColor:"transparent",zIndex:1},children:r.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem",width:"100%",margin:"0",padding:"0",boxSizing:"border-box"},children:[e.access_token&&r.jsxs("div",{style:{background:n,padding:"0.75rem",borderRadius:"0.5rem",border:`1px solid ${a}`,width:"100%",maxWidth:"100%",marginBottom:"0.5rem",boxSizing:"border-box"},children:[r.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:s,marginBottom:"0.5rem",paddingBottom:"0.5rem",borderBottom:`1px solid ${a}`},children:"Access Token"}),r.jsx(Qe,{label:"Access Token",token:e.access_token,tokenType:"access",isOIDC:!!e.id_token,flowKey:"device-authorization",defaultMasked:!1,allowMaskToggle:!1})]}),e.id_token&&r.jsxs("div",{style:{background:n,padding:"0.75rem",borderRadius:"0.5rem",border:`1px solid ${a}`,width:"100%",maxWidth:"100%",marginBottom:"0.5rem",boxSizing:"border-box"},children:[r.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:s,marginBottom:"0.5rem",paddingBottom:"0.5rem",borderBottom:`1px solid ${a}`},children:"ID Token"}),r.jsx(Qe,{label:"ID Token",token:e.id_token,tokenType:"id",isOIDC:!0,flowKey:"device-authorization",defaultMasked:!1,allowMaskToggle:!1})]}),e.refresh_token&&r.jsxs("div",{style:{background:n,padding:"0.75rem",borderRadius:"0.5rem",border:`1px solid ${a}`,width:"100%",maxWidth:"100%",marginBottom:"0.5rem",boxSizing:"border-box"},children:[r.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:s,marginBottom:"0.5rem",paddingBottom:"0.5rem",borderBottom:`1px solid ${a}`},children:"Refresh Token"}),r.jsx(Qe,{label:"Refresh Token",token:e.refresh_token,tokenType:"refresh",isOIDC:!!e.id_token,flowKey:"device-authorization",defaultMasked:!1,allowMaskToggle:!1})]})]})})},er=E.div`
	padding: 1rem;
	background: #f0fdf4;
	border: 2px solid #10b981;
	border-radius: 0.75rem;
	margin-bottom: 1rem;
	max-width: 100%;
`,rr=E.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
`,nr=E.strong`
	color: #065f46;
	font-size: 0.95rem;
`,tr=E.div`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.35rem 0.75rem;
	background: #d1fae5;
	border: 1px solid #6ee7b7;
	border-radius: 0.5rem;
	font-size: 0.8rem;
	color: #065f46;
	font-family: 'Monaco', 'Courier New', monospace;
`,or=E.p`
	margin: 0.5rem 0 0 0;
	font-size: 0.875rem;
	color: #047857;
	line-height: 1.5;
`,ir=E.div`
	margin-top: 0.5rem;
	padding: 0.5rem;
	border-radius: 0.5rem;
	background: ${({$isExpired:e,$isExpiringSoon:r})=>e?"#fee2e2":r?"#fef3c7":"#d1fae5"};
	border: 1px solid ${({$isExpired:e,$isExpiringSoon:r})=>e?"#f87171":r?"#fbbf24":"#6ee7b7"};
	color: ${({$isExpired:e,$isExpiringSoon:r})=>e?"#dc2626":r?"#d97706":"#065f46"};
	font-size: 0.8rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 500;
`,sr=({token:e,message:n,tokenExpiryKey:t})=>{const[o,i]=h.useState(null);h.useEffect(()=>{if(!t)return void i(null);const r=()=>{try{const r=ve(e,t);if(!r)return void i(null);const{isExpired:n,isExpiringSoon:o,minutesRemaining:s,expiresAtFormatted:a}=r;let d="";if(n)d="EXPIRED";else if(s<5)d=`Expires in ${s} minute${1!==s?"s":""}`;else if(s<60)d=`Expires in ${s} minutes`;else{const e=Math.floor(s/60);d=`Expires in ${e} hour${1!==e?"s":""} ${s%60} min`}i({isExpired:n,isExpiringSoon:o,timeRemaining:d,expiryTime:a})}catch(r){i(null)}};r();const n=setInterval(r,6e4);return()=>clearInterval(n)},[t,e]);const s=o?.isExpired?"⚠️ Worker token has EXPIRED. Please generate a new token to continue.":o?.isExpiringSoon?`⚠️ Worker token expires soon (${o.timeRemaining}). Consider generating a new token.`:o?`Worker token expires ${o.timeRemaining} (${o.expiryTime}).`:"Your existing worker token will be used automatically. Worker token credentials below are only needed if the token expires.";o&&!o.isExpired&&o.isExpiringSoon;return r.jsxs(er,{style:{background:o?.isExpired?"#fee2e2":o?.isExpiringSoon?"#fef3c7":"#f0fdf4",borderColor:o?.isExpired?"#ef4444":o?.isExpiringSoon?"#fbbf24":"#10b981"},children:[r.jsxs(rr,{children:[o?.isExpired?r.jsx(b,{size:18,color:"#dc2626"}):r.jsx(l,{size:18,color:o?.isExpiringSoon?"#d97706":"#10b981"}),r.jsx(nr,{style:{color:o?.isExpired?"#dc2626":o?.isExpiringSoon?"#d97706":"#065f46"},children:o?.isExpired?"Worker Token EXPIRED":"Worker Token Detected"})]}),r.jsxs(tr,{style:{background:o?.isExpired?"#fee2e2":o?.isExpiringSoon?"#fef3c7":"#d1fae5",borderColor:o?.isExpired?"#f87171":o?.isExpiringSoon?"#fbbf24":"#6ee7b7",color:o?.isExpired?"#dc2626":o?.isExpiringSoon?"#d97706":"#065f46"},children:[r.jsx(k,{size:14})," Token cached • ",e.substring(0,16),"…"]}),o&&r.jsxs(ir,{$isExpired:o.isExpired,$isExpiringSoon:o.isExpiringSoon,children:[r.jsx(j,{size:14}),r.jsx("strong",{children:o.timeRemaining}),o.expiryTime&&!o.isExpired&&r.jsxs("span",{style:{fontSize:"0.75rem",opacity:.8},children:[" (",o.expiryTime,")"]})]}),r.jsx(or,{style:{color:o?.isExpired?"#dc2626":o?.isExpiringSoon?"#d97706":"#047857",marginTop:"0.5rem"},children:n||s})]})},ar=E.span`
	font-size: 0.75rem;
	font-weight: 500;
	color: ${({$variant:e})=>"success"===e?"#047857":"warning"===e?"#b45309":"#b91c1c"};
`,dr=["workerTokenUpdated","workerTokenMetricsUpdated","workerTokenAuditUpdated"],cr=({token:e,expiresAt:n,tokenStorageKey:t,tokenExpiryKey:o,align:i="flex-start"})=>{const[s,a]=h.useState({tokenValue:"",expiresAtValue:void 0});h.useEffect(()=>{const r=async()=>{if(e||n)a({tokenValue:e??"",expiresAtValue:"number"==typeof n?n:void 0});else try{const e=await K.getToken();if(await K.loadCredentials()&&e)try{const r=localStorage.getItem("unified_worker_token");if(r){const n=JSON.parse(r);a({tokenValue:e,expiresAtValue:n.expiresAt})}else a({tokenValue:e,expiresAtValue:void 0})}catch{a({tokenValue:e,expiresAtValue:void 0})}else a({tokenValue:"",expiresAtValue:void 0})}catch(r){a({tokenValue:"",expiresAtValue:void 0})}};r();const t=setInterval(r,3e4),o=()=>{r()};return window.addEventListener("storage",o),window.addEventListener("workerTokenUpdated",o),()=>{clearInterval(t),window.removeEventListener("storage",o),window.removeEventListener("workerTokenUpdated",o)}},[e,n]);const d=h.useCallback(()=>{const{tokenValue:e,expiresAtValue:r}=s;if(!e)return{text:"No worker token saved. Generate one to continue.",variant:"danger"};if(!r)return{text:"Worker token present. Expiration unknown — consider generating a fresh token.",variant:"warning"};const n=Date.now();if(r<=n)return{text:"Worker token expired. Generate a new token.",variant:"danger"};const t=Math.floor((r-n)/6e4),o=(e=>{if(!e)return"Unknown expiration";const r=Date.now(),n=r>=e,t=e-r,o=Math.floor(t/6e4),i=Math.floor(t/36e5);return n?"EXPIRED":o<5?`Expires in ${o} minute${1!==o?"s":""}`:o<60?`Expires in ${o} minutes`:`Expires in ${i} hour${1!==i?"s":""} ${o%60} min`})(r),i=t<=5?"danger":t<=15?"warning":"success";return{text:`Worker token valid — ${o} (expires ${new Date(r).toLocaleString()})`,variant:i}},[s]),[c,l]=h.useState(d);return h.useEffect(()=>{l(d())},[d]),h.useEffect(()=>{const e=window.setInterval(()=>{l(d())},6e4);return()=>{window.clearInterval(e)}},[d]),h.useEffect(()=>{const e=()=>l(d()),r=dr;return r.forEach(r=>window.addEventListener(r,e)),window.addEventListener("storage",e),()=>{r.forEach(r=>window.removeEventListener(r,e)),window.removeEventListener("storage",e)}},[d]),r.jsx(ar,{$variant:c.variant,style:{alignSelf:i},children:c.text})},lr=E.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`,pr=E.div`
  background: ${({$status:e})=>{switch(e){case"success":return"#f0fdf4";case"error":return"#fef2f2";default:return"#f8fafc"}}};
  border: 1px solid ${({$status:e})=>{switch(e){case"success":return"#bbf7d0";case"error":return"#fecaca";default:return"#e2e8f0"}}};
  border-radius: 0.75rem;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
`,fr=E.div`
  font-size: 3rem;
  color: ${({$status:e})=>{switch(e){case"success":return"#16a34a";case"error":return"#dc2626";default:return"#6b7280"}}};
  margin-bottom: 1rem;
`,mr=E.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
`,hr=E.p`
  color: #6b7280;
  margin-bottom: 1rem;
`,ur=E.pre`
  background: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 1rem;
  font-size: 0.875rem;
  text-align: left;
  overflow-x: auto;
  margin-top: 1rem;
`,gr=()=>{const n=m();w();const{handleCallback:t}=W(),[o,i]=e.useState("loading"),[s,a]=e.useState("Processing worker token callback..."),[d,c]=e.useState(null);e.useEffect(()=>{(async()=>{try{const e=J("WorkerTokenCallback");B.info("WorkerTokenCallback","Processing worker token callback",{url:e});const r=await t(e);r.success?(i("success"),a("Worker token flow successful! Redirecting..."),B.success("WorkerTokenCallback","Worker token flow successful",{redirectUrl:r.redirectUrl}),setTimeout(()=>{n(r.redirectUrl||"/")},1500)):(i("error"),a("Worker token flow failed"),c(r.error||"Unknown error occurred"),B.error("WorkerTokenCallback","Worker token flow failed",{error:r.error}))}catch(e){i("error"),a("Worker token flow failed"),c(e instanceof Error?e.message:"Unknown error occurred"),B.error("WorkerTokenCallback","Error processing worker token callback",e)}})()},[t,n]);return r.jsx(lr,{children:r.jsxs(pr,{$status:o,children:[r.jsx(fr,{$status:o,children:(()=>{switch(o){case"success":return r.jsx(l,{});case"error":return r.jsx(v,{});default:return r.jsx(y,{className:"animate-spin"})}})()}),r.jsxs(mr,{children:["loading"===o&&"Processing Worker Token","success"===o&&"Worker Token Successful","error"===o&&"Worker Token Failed"]}),r.jsx(hr,{children:s}),d&&r.jsx(ur,{children:d})]})})},xr=E.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`,br=E.div`
  margin-left: 1.5rem;
  margin-bottom: 1rem;
`,kr=E.div`
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`,jr=E.code`
  color: #047857;
  font-size: 0.875rem;
  font-weight: 500;
  word-break: break-all;
  flex: 1;
  margin-right: 0.5rem;
`,wr=E.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  &:hover {
    background: #2563eb;
  }
`,yr=E.div`
  margin-left: 1.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
`,vr=E.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`,$r=E.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`,Sr=E.button`
  background: ${e=>e.disabled?"#9ca3af":"#10b981"};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: ${e=>e.disabled?"not-allowed":"pointer"};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);

  &:hover {
    background: ${e=>e.disabled?"#9ca3af":"#059669"};
  }
`,Ir=E.textarea`
  width: 100%;
  height: 120px;
  padding: 1rem;
  border: 2px solid #10b981;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  resize: vertical;
  background-color: white;
  font-weight: 500;
  color: #065f46;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
  transition: all 0.2s ease;

  &:focus {
    border-color: #059669;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
  }
`,Tr=E.button`
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: #10b981;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: #059669;
    transform: scale(1.05);
  }
`,Cr=E.div`
  position: relative;
`,zr=E.button`
  position: absolute;
  right: 3.5rem;
  top: 1rem;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: #2563eb;
    transform: scale(1.05);
  }
`,Er=E.div`
  font-size: 0.875rem;
  color: #047857;
  background: rgba(16, 185, 129, 0.1);
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.2);
`,_r=E.div`
  font-size: 0.85rem;
  color: #b91c1c;
  margin-top: -0.5rem;
`,Mr=E.label`
  color: #065f46;
  font-weight: 600;
`,Wr=E.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`,Rr=({value:t,jwksUrl:o,environmentId:a,issuer:c,onCopyJwksUrlSuccess:l,onCopyJwksUrlError:p,privateKey:f,onPrivateKeyChange:m,onGenerateKey:h,isGeneratingKey:u,showPrivateKey:g,onTogglePrivateKey:x,privateKeyHelper:b,jwksInstructions:k,configurationWarning:j,showConfigurationWarning:w,copyButtonLabel:y="Copy",generateKeyLabel:v="Generate Key",privateKeyLabel:$="Private Key (PEM Format) *",onCopyPrivateKey:S})=>{const[I,T]=e.useState(null),C=((e,r,n)=>{if(e)return e;const t=((e,r)=>e||(r?`https://auth.pingone.com/${r}/as`:void 0))(r,n);return t?F(t):""})(o,c,a);e.useEffect(()=>{"jwks-endpoint"===t&&T(null)},[t]);return r.jsxs(xr,{children:["jwks-endpoint"===t&&r.jsxs("div",{children:[r.jsxs("p",{style:{margin:"0 0 0.75rem 0",color:"#047857",fontSize:"0.875rem"},children:["PingOne will fetch the public key from your JWKS endpoint. No private key upload needed.",r.jsx("br",{}),r.jsx("br",{}),r.jsx("strong",{children:" Public URL Required:"})," PingOne needs to access your JWKS endpoint from their servers, so it must be publicly accessible (not localhost)."]}),r.jsxs(br,{children:[r.jsx(Mr,{style:{marginBottom:"0.5rem",display:"block"},children:"Your JWKS Endpoint URL:"}),r.jsxs(kr,{children:[r.jsx(jr,{children:C||"Provide environment details to compute JWKS URL"}),r.jsxs(wr,{type:"button",onClick:async()=>{if(C)try{await navigator.clipboard.writeText(C),l?.(C)}catch(e){p?.(e)}else p?.(new Error("No JWKS URL available to copy."))},title:"Copy JWKS Endpoint URL",children:[r.jsx(d,{size:14}),y]})]}),k]}),w&&j&&r.jsx(yr,{children:j})]}),"private-key"===t&&r.jsxs(vr,{children:[r.jsxs($r,{children:[r.jsx(Mr,{children:$}),r.jsx(Sr,{type:"button",onClick:h,disabled:u,children:u?r.jsxs(r.Fragment,{children:[r.jsx(Wr,{}),"Generating..."]}):r.jsxs(r.Fragment,{children:[r.jsx(n,{size:14}),v]})})]}),r.jsx("p",{style:{margin:"0 0 0.75rem 0",color:"#047857",fontSize:"0.875rem"},children:"Upload the private key directly to PingOne. Copy the key from below."}),r.jsxs(Cr,{children:[r.jsx(Ir,{value:f,onChange:e=>{return r=e.target.value,m(r),void(r.trim()?q(r.trim())?T(null):T("Private key must be valid PEM format."):T("Private key required when using Upload Private Key."));var r},placeholder:"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...",style:{paddingRight:g?"6rem":"4rem"}}),r.jsx(Tr,{type:"button",onClick:x,title:g?"Hide private key":"Show private key",children:g?r.jsx(i,{size:16}):r.jsx(s,{size:16})}),S&&f&&r.jsx(zr,{type:"button",onClick:S,title:"Copy Private Key",children:r.jsx(d,{size:16})})]}),I&&r.jsx(_r,{children:I}),b&&r.jsx(Er,{children:b})]})]})},Ar=E.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`,Or=E.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #14532d;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #dcfce7 0%, #ecfdf3 100%);
	}
`,Dr=E.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,Pr=E.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s ease;
	transform: ${({$collapsed:e})=>e?"rotate(-90deg)":"rotate(0deg)"};
	color: #15803d;
`,Nr=E.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`,Ur=E.div`
	background-color: #dcfce7;
	border: 1px solid #22c55e;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	position: relative;
`,Jr=E.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #16a34a;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
`,Br=E.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
	margin: 1rem 0;
`,Fr=E.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin: 1rem 0;
`,qr=E.div`
	display: grid;
	grid-template-columns: 180px 1fr;
	gap: 1rem;
	align-items: start;
	padding: 0.75rem;
	background: #f0fdf4;
	border-radius: 0.5rem;
	border: 1px solid #bbf7d0;
`,Kr=E.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #16a34a;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`,Lr=E.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #064e3b;
	word-break: break-all;
	background-color: #f0fdf4;
	padding: 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid #bbf7d0;
`,Gr=E.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	align-items: center;
	margin-top: 1.5rem;
`,Vr=E.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: ${e=>e.disabled?"not-allowed":"pointer"};
	transition: all 0.2s;
	border: 1px solid transparent;
	opacity: ${e=>e.disabled?.6:1};

	${({$variant:e})=>"primary"===e&&"\n\t\tbackground-color: #22c55e;\n\t\tcolor: #ffffff;\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground-color: #16a34a;\n\t\t}\n\t"}

	${({$variant:e})=>"success"===e&&"\n\t\tbackground-color: #16a34a;\n\t\tcolor: #ffffff;\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground-color: #15803d;\n\t\t}\n\t"}

	${({$variant:e})=>"secondary"===e&&"\n\t\tbackground-color: #0ea5e9;\n\t\tcolor: #ffffff;\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground-color: #0284c7;\n\t\t}\n\t"}

	${({$variant:e})=>"danger"===e&&"\n\t\tbackground-color: #ef4444;\n\t\tcolor: #ffffff;\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground-color: #dc2626;\n\t\t}\n\t"}

	${({$variant:e})=>"outline"===e&&"\n\t\tbackground-color: transparent;\n\t\tcolor: #14532d;\n\t\tborder-color: #bbf7d0;\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground-color: #f0fdf4;\n\t\t\tborder-color: #22c55e;\n\t\t}\n\t"}
`,Hr=E(Vr)`
	position: relative;
	background:
		${({$priority:e})=>"primary"===e?"linear-gradient(135deg, #22c55e 0%, #16a34a 100%)":"linear-gradient(135deg, #10b981 0%, #059669 100%)"};
	box-shadow:
		${({$priority:e})=>"primary"===e?"0 6px 18px rgba(34, 197, 94, 0.35)":"0 6px 18px rgba(16, 185, 129, 0.35)"};
	color: #ffffff;
	padding-right: 2.5rem;

	&:hover {
		transform: scale(1.02);
	}

	&:disabled {
		background:
			${({$priority:e})=>"primary"===e?"linear-gradient(135deg, rgba(34,197,94,0.6) 0%, rgba(22,163,74,0.6) 100%)":"linear-gradient(135deg, rgba(16,185,129,0.6) 0%, rgba(5,150,105,0.6) 100%)"};
		box-shadow: none;
	}
`,Yr=E.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0;
`,Xr=E.p`
	font-size: 0.95rem;
	color: #3f3f46;
	line-height: 1.7;
	margin: 0;
`;E.ul`
	font-size: 0.875rem;
	color: #334155;
	line-height: 1.5;
	margin: 0.5rem 0 0;
	padding-left: 1.5rem;
`;const Qr=E.div`
	margin: 1.5rem 0;
`,Zr=E.h3`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: #14532d;
	margin: 0 0 0.5rem;
`,en=E.p`
	font-size: 0.875rem;
	color: #6b7280;
	line-height: 1.5;
	margin: 0 0 1rem;
`;E.hr`
	border: none;
	border-top: 1px solid #e5e7eb;
	margin: 2rem 0;
`;const rn=E.div`
	width: 100%;
	margin: 1rem 0;
`,nn=E.div`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1.5rem;
	border-radius: 0.75rem;
	background: ${({$variant:e})=>{switch(e){case"warning":return"#fef3c7";case"success":return"#d1fae5";default:return"#eff6ff"}}};
	border: 1px solid ${({$variant:e})=>{switch(e){case"warning":return"#f59e0b";case"success":return"#10b981";default:return"#3b82f6"}}};
	margin: 1rem 0;
`,tn=({flowName:t,flowVersion:o="V5",tokens:i,credentials:a,userInfo:p,onFetchUserInfo:f,isFetchingUserInfo:m,onResetFlow:h,onNavigateToTokenManagement:u,onIntrospectToken:g,collapsedSections:x={completionOverview:!1,completionDetails:!1,introspectionDetails:!1,rawJson:!0,userInfo:!1},onToggleSection:b,completionMessage:k,nextSteps:j=["Inspect or decode tokens using the Token Management tools.","Repeat the flow with different scopes or redirect URIs.","Explore refresh tokens and introspection flows."]})=>{const[w,y]=e.useState(null),[v,I]=e.useState(!1),T=e.useCallback((e,r)=>{N.handleCopyOperation(e,r)},[]),C=e.useCallback(async()=>{if(i?.access_token&&g){I(!0);try{const e=await g(i.access_token);y(e),N.showSuccess("Token introspection completed successfully!")}catch(e){N.showError("Token introspection failed. Please try again.")}finally{I(!1)}}else N.showError("No access token available for introspection or introspection handler not provided.")},[i?.access_token,g]),z=e.useCallback(e=>{b&&b(e)},[b]),E=`Nice work! You successfully completed the ${t} flow.`;return r.jsxs(r.Fragment,{children:[r.jsxs(Ar,{children:[r.jsxs(Or,{onClick:()=>z("completionOverview"),"aria-expanded":!x.completionOverview,children:[r.jsxs(Dr,{children:[r.jsx(l,{})," Flow Completion Overview"]}),r.jsx(Pr,{$collapsed:x.completionOverview,children:r.jsx($,{})})]}),!x.completionOverview&&r.jsx(Nr,{children:r.jsxs(Ur,{children:[r.jsx(Jr,{children:"All Done"}),r.jsx(Xr,{children:k||E})]})})]}),r.jsxs(Ar,{children:[r.jsxs(Or,{onClick:()=>z("completionDetails"),"aria-expanded":!x.completionDetails,children:[r.jsxs(Dr,{children:[r.jsx(c,{})," Next Steps & Resources"]}),r.jsx(Pr,{$collapsed:x.completionDetails,children:r.jsx($,{})})]}),!x.completionDetails&&r.jsx(Nr,{children:r.jsxs(R,{style:{marginTop:"1.5rem"},children:[r.jsxs(Yr,{children:[r.jsx(c,{})," Next Steps"]}),r.jsx(L,{steps:j})]})})]}),i?.access_token&&r.jsxs(Ar,{children:[r.jsxs(Or,{onClick:()=>z("introspectionDetails"),"aria-expanded":!x.introspectionDetails,children:[r.jsxs(Dr,{children:[r.jsx(s,{})," Token Introspection"]}),r.jsx(Pr,{$collapsed:x.introspectionDetails,children:r.jsx($,{})})]}),!x.introspectionDetails&&r.jsx(Nr,{children:r.jsxs(Qr,{children:[r.jsxs(Zr,{children:[r.jsx(s,{})," Access Token Introspection"]}),r.jsx(en,{children:"Introspect your access token to see detailed information about its validity, scopes, and claims."}),r.jsx(Gr,{style:{justifyContent:"center",marginBottom:"1rem"},children:r.jsxs(Hr,{onClick:C,$priority:"primary",disabled:v||!g,children:[r.jsx(s,{})," ",v?"Introspecting...":"Introspect Access Token"]})}),w&&r.jsxs(r.Fragment,{children:[r.jsxs(Ur,{children:[r.jsx(Jr,{children:"Introspection Results"}),r.jsxs(Br,{children:[r.jsxs("div",{style:{gridColumn:"1 / -1"},children:[r.jsx(Kr,{children:"Token Status"}),r.jsx(Lr,{style:{color:w.active?"#16a34a":"#dc2626",fontWeight:"bold"},children:w.active?"✅ Active":w.exp&&Date.now()>=1e3*w.exp?"❌ Expired":"❌ Inactive"})]}),w.scope&&r.jsxs("div",{children:[r.jsx(Kr,{children:"Scope"}),r.jsx(Lr,{children:String(w.scope)})]}),w.client_id&&r.jsxs("div",{children:[r.jsx(Kr,{children:"Client ID"}),r.jsx(Lr,{children:String(w.client_id)})]}),w.sub&&r.jsxs("div",{children:[r.jsx(Kr,{children:"Subject"}),r.jsx(Lr,{children:String(w.sub)})]}),w.token_type&&r.jsxs("div",{children:[r.jsx(Kr,{children:"Token Type"}),r.jsx(Lr,{children:String(w.token_type)})]}),w.aud&&r.jsxs("div",{children:[r.jsx(Kr,{children:"Audience"}),r.jsx(Lr,{children:String(w.aud)})]}),w.iss&&r.jsxs("div",{children:[r.jsx(Kr,{children:"Issuer"}),r.jsx(Lr,{children:String(w.iss)})]}),w.exp&&r.jsxs("div",{children:[r.jsx(Kr,{children:"Expires At"}),r.jsx(Lr,{children:new Date(1e3*Number(w.exp)).toLocaleString()})]}),w.iat&&r.jsxs("div",{children:[r.jsx(Kr,{children:"Issued At"}),r.jsx(Lr,{children:new Date(1e3*Number(w.iat)).toLocaleString()})]})]}),r.jsx(Gr,{children:r.jsxs(Vr,{onClick:()=>T(JSON.stringify(w,null,2),"Introspection Results"),$variant:"outline",children:[r.jsx(d,{})," Copy Results"]})})]}),r.jsxs(Ar,{children:[r.jsxs(Or,{onClick:()=>z("rawJson"),"aria-expanded":!x.rawJson,children:[r.jsxs(Dr,{children:[r.jsx(n,{})," Raw JSON Response"]}),r.jsx(Pr,{$collapsed:x.rawJson,children:r.jsx($,{})})]}),!x.rawJson&&r.jsxs(Nr,{children:[r.jsxs(nn,{$variant:"info",children:[r.jsx(n,{size:20}),r.jsxs("div",{children:[r.jsx(Yr,{children:"Raw JSON Response"}),r.jsx(Xr,{children:"This is the raw JSON response from the token introspection endpoint. Useful for debugging and understanding the complete response structure."})]})]}),r.jsxs(Ur,{children:[r.jsx(Jr,{children:"Raw JSON"}),r.jsx(rn,{children:r.jsx("pre",{style:{margin:0,padding:"1rem",background:"#f8fafc",borderRadius:"0.5rem",border:"1px solid #e2e8f0",fontSize:"0.875rem",lineHeight:"1.5",overflow:"auto",maxHeight:"400px",color:"#1f2937"},children:JSON.stringify(w,null,2)})}),r.jsx(Gr,{children:r.jsxs(Vr,{onClick:()=>T(JSON.stringify(w,null,2),"Raw JSON Response"),$variant:"outline",children:[r.jsx(d,{})," Copy Raw JSON"]})})]})]})]})]})]})})]}),i?.access_token&&f&&r.jsxs(Ar,{children:[r.jsxs(Or,{onClick:()=>z("userInfo"),"aria-expanded":!x.userInfo,children:[r.jsxs(Dr,{children:[r.jsx(S,{})," User Information"]}),r.jsx(Pr,{$collapsed:x.userInfo,children:r.jsx($,{})})]}),!x.userInfo&&r.jsx(Nr,{children:r.jsxs(Qr,{children:[r.jsxs(Zr,{children:[r.jsx(S,{})," User Information"]}),r.jsx(en,{children:"Retrieve and display user information from the userinfo endpoint."}),r.jsx(Gr,{children:r.jsxs(Hr,{onClick:f,disabled:!i?.access_token||m,style:{background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",color:"white",border:"none",padding:"1rem 2rem",borderRadius:"0.75rem",fontSize:"1rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.2s ease",boxShadow:"0 4px 12px rgba(59, 130, 246, 0.25)"},children:[r.jsx(S,{})," ",m?"Fetching User Info...":"Fetch User Information"]})}),p&&r.jsxs(Ur,{children:[r.jsx(Jr,{children:"User Information"}),r.jsx(Fr,{children:Object.entries(p).map(([e,n])=>r.jsxs(qr,{children:[r.jsx(Kr,{style:{textTransform:"uppercase",fontSize:"0.75rem"},children:e}),r.jsx(Lr,{children:"object"==typeof n?JSON.stringify(n,null,2):String(n)})]},e))}),r.jsx(Gr,{children:r.jsxs(Vr,{onClick:()=>T(JSON.stringify(p,null,2),"User Information"),$variant:"outline",children:[r.jsx(d,{})," Copy User Info"]})})]})]})})]})]})},on=E.div`
  background: ${({$hasToken:e})=>e?"linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)":"var(--card-bg)"} !important;
  color: var(--card-fg) !important;
  border: 1px solid ${({$hasToken:e})=>e?"#bbf7d0":"var(--card-border)"};
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.4;
  transition: all 0.3s ease;

  pre, code, textarea {
    background: transparent !important;
    color: inherit !important;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  textarea {
    width: 100%;
    min-height: 400px; /* Increased from 300px */
    resize: vertical;
    border: 0;
    outline: none;
    background: transparent !important;
    color: inherit !important;
    font-size: 14px;
    line-height: 1.5;
  }

  &.scrollable {
    overflow: auto;
    max-height: 420px; /* Increased from 320px */
    white-space: pre;
  }

  @media (max-width: 768px) {
    padding: 12px;
  }
`,sn=E.h3`
  font-weight: 700;
  margin: 12px 0 8px;
  color: var(--card-fg) !important;
`,an=({title:e,children:n,scrollable:t=!1,className:o="","aria-label":i,hasToken:s=!1,isJson:a=!1,jsonContent:d})=>r.jsxs("section",{children:[e&&r.jsx(sn,{children:e}),r.jsx(on,{className:`token-surface ${t?"scrollable":""} ${o}`,role:"region","aria-label":i||e,$hasToken:s,children:a&&d?r.jsx(A,{data:JSON.parse(d)}):n})]}),dn=E.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
	position: relative;
	max-width: 100%;
	width: 100%;
	overflow: visible;
	box-sizing: border-box;
`,cn=E.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.75rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,ln=E.div`
	background: #f0fdf4; /* Light green for generated content */
	border: 1px solid #16a34a;
	border-radius: 8px;
	padding: 1rem 5rem 1rem 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	word-break: break-word;
	white-space: pre-wrap;
	position: relative;
	min-height: ${({height:e})=>e||"150px"};
	overflow-x: auto;
	overflow-y: hidden;
	max-width: 100%;
	width: 100%;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
`,pn=E.span`
	color: ${({$color:e})=>e};
	font-weight: ${({$fontWeight:e})=>e||"400"};
`,fn=E.div`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	display: flex;
	gap: 0.5rem;
`,mn=E.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.375rem 0.75rem;
	border-radius: 4px;
	border: 1px solid ${({$variant:e})=>"primary"===e?"#3b82f6":"#d1d5db"};
	background: ${({$variant:e})=>"primary"===e?"#3b82f6":"white"};
	color: ${({$variant:e})=>"primary"===e?"white":"#374151"};
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({$variant:e})=>"primary"===e?"#2563eb":"#f9fafb"};
		border-color: ${({$variant:e})=>"primary"===e?"#2563eb":"#9ca3af"};
	}

	&:active {
		transform: translateY(1px);
	}
`,hn=E.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: ${({$isOpen:e})=>e?"flex":"none"};
	align-items: center;
	justify-content: center;
	z-index: 1000;
`,un=E.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 700px;
	max-height: 80vh;
	overflow-y: auto;
	margin: 1rem;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`,gn=E.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
`,xn=E.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
`,bn=E.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	color: #6b7280;
	padding: 0.25rem;

	&:hover {
		color: #374151;
	}
`,kn=E.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`,jn=E.div`
	padding: 1rem;
	background: #f8fafc;
	border-radius: 8px;
	border-left: 4px solid #3b82f6;
`,wn=E.div`
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.25rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`,yn=E.div`
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
	margin-bottom: 0.5rem;
`,vn=E.div`
	color: #059669;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	word-break: break-all;
	background: #f0fdf4;
	padding: 0.5rem;
	border-radius: 4px;
	border: 1px solid #bbf7d0;
`,$n=E.div`
	display: inline-block;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	margin-bottom: 0.5rem;
	background: ${({$type:e})=>{switch(e){case"access_token":return"#dbeafe";case"id_token":return"#dcfce7";case"refresh_token":return"#fef3c7";case"scope":return"#e0e7ff";default:return"#f3f4f6"}}};
	color: ${({$type:e})=>{switch(e){case"access_token":return"#1e40af";case"id_token":return"#166534";case"refresh_token":return"#92400e";case"scope":return"#3730a3";default:return"#374151"}}};
`,Sn="#7c3aed",In="#059669",Tn="#dc2626",Cn="#ea580c",zn="#6b7280",En="#1f2937",_n="#ffffff",Mn=(e,r=0)=>{const n=[],t="  ".repeat(r);if(null===e)n.push({text:"null",color:zn});else if("boolean"==typeof e)n.push({text:e.toString(),color:Cn});else if("number"==typeof e)n.push({text:e.toString(),color:Tn});else if("string"==typeof e)n.push({text:`"${e}"`,color:In});else if(Array.isArray(e))n.push({text:"[\n",color:En}),e.forEach((o,i)=>{n.push({text:`${t}  `,color:_n}),n.push(...Mn(o,r+1)),i<e.length-1?n.push({text:",\n",color:En}):n.push({text:"\n",color:_n})}),n.push({text:`${t}]`,color:En});else if("object"==typeof e){n.push({text:"{\n",color:En});const o=e,i=Object.keys(o);i.forEach((e,s)=>{n.push({text:`${t}  `,color:_n}),n.push({text:`"${e}"`,color:Sn,fontWeight:"600"}),n.push({text:": ",color:En}),n.push(...Mn(o[e],r+1)),s<i.length-1?n.push({text:",\n",color:En}):n.push({text:"\n",color:_n})}),n.push({text:`${t}}`,color:En})}return n},Wn=({tokens:n,showCopyButton:t=!0,showInfoButton:i=!0,showOpenButton:s=!1,onOpen:a,label:d="Raw Token Response",height:c})=>{const[l,p]=e.useState(!1),f=Mn(n),m=(e=>[{name:"access_token",description:"The access token that your application can use to make API calls on behalf of the user.",type:"access_token",value:e.access_token||"Not present"},{name:"id_token",description:"The OpenID Connect ID token containing user identity information (JWT format).",type:"id_token",value:e.id_token||"Not present"},{name:"refresh_token",description:"Token used to obtain new access tokens without requiring user re-authentication.",type:"refresh_token",value:e.refresh_token||"Not present"},{name:"token_type",description:'The type of token issued. Typically "Bearer" for OAuth 2.0 access tokens.',type:"metadata",value:e.token_type||"Not specified"},{name:"expires_in",description:"The number of seconds until the access token expires.",type:"metadata",value:e.expires_in?`${e.expires_in} seconds`:"Not specified"},{name:"scope",description:"The permissions granted to the access token.",type:"scope",value:e.scope||"Not specified"},{name:"grant_type",description:"The OAuth grant type used to obtain these tokens.",type:"metadata",value:e.grant_type||"Not specified"}].filter(e=>"Not present"!==e.value&&"Not specified"!==e.value))(n);return r.jsxs(dn,{children:[r.jsxs(cn,{children:[d,i&&r.jsxs(mn,{onClick:()=>p(!0),$variant:"secondary",children:[r.jsx(o,{size:14}),"Explain Tokens"]})]}),r.jsxs(ln,{height:c,children:[r.jsxs(fn,{children:[t&&r.jsx(O,{text:JSON.stringify(n,null,2),label:"Token Response",size:"sm",variant:"primary",showLabel:!1}),s&&r.jsxs(mn,{onClick:()=>{a?.()},$variant:"secondary",children:[r.jsx(g,{size:14}),"Open"]})]}),f.map((e,n)=>r.jsx(pn,{$color:e.color,$fontWeight:e.fontWeight,children:e.text},n))]}),r.jsx(hn,{$isOpen:l,children:r.jsxs(un,{children:[r.jsxs(gn,{children:[r.jsx(xn,{children:"Token Response Breakdown"}),r.jsx(bn,{onClick:()=>p(!1),children:"×"})]}),r.jsx(kn,{children:m.map((e,n)=>r.jsxs(jn,{children:[r.jsx($n,{$type:e.type,children:e.type.toUpperCase()}),r.jsx(wn,{children:e.name}),r.jsx(yn,{children:e.description}),r.jsx(vn,{children:e.value})]},n))})]})})]})},Rn=E.div`
  display: flex;
  flex-direction: column;
  gap: ${({$mode:e})=>"compact"===e?"0.75rem":"1.25rem"};
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: ${({$mode:e})=>"educational"===e?"12px":"8px"};
  box-shadow: ${({$mode:e})=>"educational"===e?"0 4px 12px rgba(0, 0, 0, 0.1)":"0 1px 3px rgba(0, 0, 0, 0.1)"};
  overflow: hidden;
`,An=E.div`
  padding: ${({$mode:e})=>"compact"===e?"1rem":"1.5rem"};
  background: ${({$mode:e})=>"educational"===e?"linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)":"#f8fafc"};
  border-bottom: 1px solid #e2e8f0;
`,On=E.h3`
  margin: 0 0 ${({$mode:e})=>"compact"===e?"0.25rem":"0.5rem"} 0;
  font-size: ${({$mode:e})=>"compact"===e?"1rem":"1.25rem"};
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Dn=E.p`
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
`,Pn=E.div`
  background: #ffffff;
  border: 1px solid ${({$variant:e})=>{switch(e){case"access":return"#3b82f6";case"id":return"#22c55e";case"refresh":return"#f59e0b";default:return"#e2e8f0"}}};
  border-radius: 8px;
  margin: ${({$mode:e})=>"compact"===e?"0.5rem":"1rem"};
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
`,Nn=E.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: ${({$variant:e})=>{switch(e){case"access":return"linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)";case"id":return"linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)";case"refresh":return"linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";default:return"#f8fafc"}}};
  border-bottom: 1px solid ${({$variant:e})=>{switch(e){case"access":return"#93c5fd";case"id":return"#86efac";case"refresh":return"#fcd34d";default:return"#e2e8f0"}}};
`,Un=E.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: ${({$variant:e})=>{switch(e){case"access":return"#1e40af";case"id":return"#166534";case"refresh":return"#92400e";default:return"#374151"}}};
`,Jn=E.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({$variant:e})=>{switch(e){case"access":return"#1e40af";case"id":return"#166534";case"refresh":return"#92400e";default:return"#6b7280"}}};
  color: white;
`,Bn=E.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`,Fn=E.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: none;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({$variant:e})=>{switch(e){case"primary":return"\n          background: #3b82f6;\n          color: white;\n          &:hover { background: #2563eb; transform: translateY(-1px); }\n        ";case"success":return"\n          background: #22c55e;\n          color: white;\n          &:hover { background: #16a34a; transform: translateY(-1px); }\n        ";case"warning":return"\n          background: #f59e0b;\n          color: white;\n          &:hover { background: #d97706; transform: translateY(-1px); }\n        ";default:return"\n          background: #f3f4f6;\n          color: #374151;\n          border: 1px solid #d1d5db;\n          &:hover { background: #e5e7eb; transform: translateY(-1px); }\n        "}}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`,qn=E.div`
  padding: 1.25rem;
`,Kn=E.div`
  font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #374151;
  background: ${({$highlighted:e})=>e?"#f0fdf4":"#f8fafc"};
  border: 1px solid ${({$highlighted:e})=>e?"#22c55e":"#e2e8f0"};
  border-radius: 6px;
  padding: 1rem;
  word-break: break-all;
  white-space: pre-wrap;
  overflow-x: auto;
  margin-bottom: 1rem;
  position: relative;
  
  ${({$masked:e})=>e&&"\n    filter: blur(4px);\n    user-select: none;\n    transition: filter 0.3s ease;\n    \n    &:hover {\n      filter: blur(2px);\n    }\n  "}
`,Ln=E.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`,Gn=E.h4`
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Vn=E.div`
  background: #f0fdf4;
  border: 1px solid #22c55e;
  border-radius: 6px;
  padding: 1rem;
  font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #374151;
  overflow-x: auto;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
`,Hn=E.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
`,Yn=E.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`,Xn=E.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Qn=E.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
`,Zn=E.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: #6b7280;
`,et=E.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`,rt=E.p`
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
`,nt=E.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  color: #92400e;
  font-size: 0.875rem;
  margin-top: 1rem;
`;E.div`
  font-family: 'SFMono-Regular', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  
  .json-key { color: #7c3aed; font-weight: 600; }
  .json-string { color: #059669; }
  .json-number { color: #dc2626; }
  .json-boolean { color: #ea580c; }
  .json-null { color: #6b7280; }
  .json-punctuation { color: #374151; }
`;const tt=({tokens:t,flowType:o="oauth",flowKey:i="",displayMode:s="detailed",title:l,subtitle:f,showCopyButtons:h=!0,showDecodeButtons:u=!0,showMaskToggle:x=!0,showTokenManagement:k=!0,showEducationalInfo:w=!1,showMetadata:y=!0,showSyntaxHighlighting:v=!1,defaultMasked:$=!1,className:S,onTokenAnalyze:E})=>{const _=m(),[M]=e.useState({access:!1,id:!1,refresh:!1}),[W,R]=e.useState({access:!1,id:!1,refresh:!1}),[A,O]=e.useState({access:!1,id:!1,refresh:!1}),[D,P]=e.useState(!1),U=e.useMemo(()=>{if(!t)return[];return["access","id","refresh"].filter(e=>{const r=`${e}_token`;return"string"==typeof t[r]&&t[r]})},[t]),J="oidc"===o||"rar"===o||"redirectless"===o,B=e=>{switch(e){case"access":return r.jsx(n,{size:16});case"id":return r.jsx(c,{size:16});case"refresh":return r.jsx(z,{size:16});default:return r.jsx(I,{size:16})}},F=e=>{switch(e){case"access":return"Access Token";case"id":return J?"ID Token (OIDC)":"ID Token";case"refresh":return"Refresh Token";default:return"Token"}},q=e=>e.length<=24?"••••••••••••••••••••":`${e.substring(0,8)}••••••••••••••••••••${e.substring(e.length-8)}`;if(!t||0===U.length)return r.jsx(Rn,{$mode:s,className:S,children:r.jsxs(Zn,{children:[r.jsx(et,{children:r.jsx(I,{})}),r.jsx(rt,{children:"No tokens available yet. Complete the authentication flow to retrieve tokens."})]})});const K=l||`${o.toUpperCase()} Tokens`,L=f||`${U.length} token${1!==U.length?"s":""} retrieved from ${i||"authentication flow"}`;return r.jsxs(Rn,{$mode:s,className:S,children:[r.jsx(An,{$mode:s,children:r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"1rem"},children:[r.jsxs("div",{children:[r.jsxs(On,{$mode:s,children:[r.jsx(c,{size:20}),K]}),!1!==f&&r.jsx(Dn,{children:L})]}),r.jsx("button",{type:"button",onClick:()=>P(e=>!e),style:{padding:"6px 12px",borderRadius:"999px",border:"1px solid #c7d2fe",background:D?"#e0e7ff":"#eef2ff",color:"#312e81",fontWeight:600,cursor:"pointer",fontSize:"0.85rem",whiteSpace:"nowrap"},children:D?"Hide token guide":"What is this?"})]})}),D&&r.jsxs("div",{style:{padding:"16px 20px",background:"#fefce8",borderBottom:"1px solid #fcd34d",color:"#7c2d12",fontSize:"0.9rem",lineHeight:1.6},children:[r.jsx("strong",{children:"Token viewer primer:"}),r.jsxs("ul",{style:{margin:"8px 0 0 20px"},children:[r.jsx("li",{children:"Each colored card represents a different token returned from PingOne (access, ID, refresh)."}),r.jsx("li",{children:"Use the copy, decode, and analyze buttons to inspect JWT structure, scopes, and expiry."}),r.jsx("li",{children:"Masking is off by default so you can see the raw string—use the toggle if you need to hide secrets before screensharing."}),r.jsx("li",{children:"The metadata grid at the bottom summarizes token type, expiry, and scopes for quick reference."})]})]}),U.map(e=>{const o=t[`${e}_token`],l=M[e],f=W[e],m=A[e],x=Je.isJWT(o);let k=null;return f&&x&&(k=Je.decodeJWT(o)),r.jsxs(Pn,{$variant:e,$mode:s,children:[r.jsxs(Nn,{$variant:e,children:[r.jsxs(Un,{$variant:e,children:[B(e),F(e),r.jsx(Jn,{$variant:e,children:e})]}),r.jsxs(Bn,{children:[u&&x&&r.jsxs(Fn,{onClick:()=>(e=>{R(r=>({...r,[e]:!r[e]}))})(e),title:f?"Hide decoded content":"Show decoded content",$variant:"warning",children:[r.jsx(a,{size:14}),f?"Hide Decode":"Decode JWT"]}),h&&r.jsxs(Fn,{onClick:()=>(async(e,r)=>{try{await navigator.clipboard.writeText(r),O(r=>({...r,[e]:!0})),N.showSuccess(`${F(e)} copied to clipboard`),setTimeout(()=>{O(r=>({...r,[e]:!1}))},2e3)}catch(n){N.showError("Failed to copy token")}})(e,o),title:"Copy token",$variant:"primary",children:[m?r.jsx(p,{size:14}):r.jsx(d,{size:14}),m?"Copied!":"Copy"]}),showTokenManagement&&r.jsxs(Fn,{onClick:()=>((e,r)=>{_("/token-management",{state:{token:r,tokenType:e,label:F(e),source:i||"ultimate-token-display"}}),N.showSuccess(`${F(e)} sent to Token Management`)})(e,o),title:"Send to Token Management",$variant:"success",children:[r.jsx(g,{size:14}),"Analyze"]}),E&&r.jsxs(Fn,{onClick:()=>E(e,o),title:"Custom analysis",children:[r.jsx(z,{size:14}),"Analyze"]})]})]}),r.jsxs(qn,{children:[r.jsx(Kn,{$masked:l,$highlighted:v,children:l?q(o):o}),f&&r.jsx(Ln,{children:x?k?r.jsxs(r.Fragment,{children:[r.jsxs(Gn,{children:[r.jsx(n,{size:16}),"JWT Header"]}),r.jsx(Vn,{children:JSON.stringify(k.header,null,2)}),r.jsxs(Gn,{style:{marginTop:"1rem"},children:[r.jsx(c,{size:16}),"JWT Payload"]}),r.jsx(Vn,{children:JSON.stringify(k.payload,null,2)})]}):r.jsxs(nt,{children:[r.jsx(b,{size:20}),"Failed to decode JWT token"]}):r.jsxs(nt,{children:[r.jsx(b,{size:20}),Je.getOpaqueTokenMessage(e)]})})]})]},e)}),y&&(t.token_type||t.expires_in||t.scope)&&r.jsxs(Hn,{children:[t.token_type&&r.jsxs(Yn,{children:[r.jsxs(Xn,{children:[r.jsx(T,{size:12,style:{marginRight:"0.25rem"}}),"Token Type"]}),r.jsx(Qn,{children:t.token_type})]}),"number"==typeof t.expires_in&&r.jsxs(Yn,{children:[r.jsxs(Xn,{children:[r.jsx(j,{size:12,style:{marginRight:"0.25rem"}}),"Expires In"]}),r.jsx(Qn,{children:(e=>{if(!e||Number.isNaN(e))return"Unknown";const r=Math.floor(e/3600),n=Math.floor(e%3600/60),t=e%60;return r>0?`${r}h ${n}m ${t}s`:n>0?`${n}m ${t}s`:`${t}s`})(t.expires_in)})]}),t.scope&&r.jsxs(Yn,{children:[r.jsxs(Xn,{children:[r.jsx(C,{size:12,style:{marginRight:"0.25rem"}}),"Scope"]}),r.jsx(Qn,{children:t.scope})]})]})]})};export{Wn as C,Rr as J,Ze as S,Je as T,tt as U,Ue as W,sr as a,cr as b,tn as c,an as d,gr as e,$e as g};
//# sourceMappingURL=components-token-uXxDPBqK.js.map
