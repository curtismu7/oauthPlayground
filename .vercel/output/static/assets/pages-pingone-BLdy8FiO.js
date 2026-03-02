const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/utils-lzKqcxFi.js","assets/react-vendor-HWZo9XlX.js","assets/vendor-CvVeuJe7.js","assets/vendor-54DrP_uy.css","assets/components-credentials-T7jmF3zx.js","assets/styled-vendor-DGSsHzxd.js","assets/components-oauth-qq-maH2w.js","assets/v8u-services-CviCpCEt.js","assets/v8-services-DHsPM8a2.js","assets/v8-components-8swtZwHb.js","assets/v8-utils-BU6AoW1l.js","assets/v8u-components-COnDGHJS.js","assets/components-flow-core-y1x-SJYd.js","assets/components-token-uXxDPBqK.js","assets/oauth-flows-device-CMULWbHZ.js","assets/pages-ai-D2KhTcan.js","assets/pages-DE-6TDOE.js","assets/components-oauth-authorize-sao_-EgS.js","assets/components-oauth-discovery-DYbdhNwI.js","assets/components-ui-DbX9aVva.js","assets/oauth-flows-BoQiEZ27.js","assets/oauth-flows-authcode-ltS0AxHA.js","assets/components-oauth-par-B-NhQsyD.js","assets/oauth-flows-implicit-BlAJpg9o.js","assets/oauth-flows-par-DTJ0aZ64.js","assets/pages-docs-nYnYMLbe.js","assets/components-flow-BH3Bx-YA.js","assets/components-steps-BQ6HbS5x.js","assets/components-oauth-client-BhjYl9xl.js","assets/components-flow-core-DEegsKK7.css","assets/v8-hooks-B7CjPGrP.js","assets/v8-flows-CbgB_G0p.js","assets/v8-flows-Bwbl_h2s.css"])))=>i.map(i=>d[i]);
import{a as e,R as r,j as t,t as n,k as i,aY as o,Q as s,an as a,A as l,h as d,e as c,F as m,X as u,Y as p,H as h,m as g,n as f,bq as x,v as b,T as y,a2 as j,G as w,a9 as k,ah as v,B as S,E as C,U as I,u as T,a_ as E,V as _,az as A,l as R,Z as z,p as O,a5 as P,aA as $,a4 as N,_ as D,al as U,W as L,f as W,am as B,ax as M}from"./react-vendor-HWZo9XlX.js";import{a as F}from"./styled-vendor-DGSsHzxd.js";import{a as q,J,V,c as H,k as G,a5 as Y,as as K,l as Q}from"./components-oauth-qq-maH2w.js";import{a as X,W as Z,c as ee}from"./components-token-uXxDPBqK.js";import{a as re,f as te}from"./v8u-services-CviCpCEt.js";import{h as ne,al as ie,_ as oe,a4 as se,c as ae,aR as le}from"./utils-lzKqcxFi.js";import{C as de}from"./components-flow-core-y1x-SJYd.js";import{U as ce,V as me,a as ue}from"./pages-DE-6TDOE.js";import{b as pe}from"./components-oauth-authorize-sao_-EgS.js";import{b as he,A as ge}from"./oauth-flows-authcode-ltS0AxHA.js";import{a as fe,M as xe}from"./oauth-flows-device-CMULWbHZ.js";import{q as be}from"./components-credentials-T7jmF3zx.js";import{j as ye}from"./v8-components-8swtZwHb.js";import{u as je}from"./pages-ai-D2KhTcan.js";const we=F.div`
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
`,ke=F.div`
	background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	border-radius: 0.75rem;
	box-shadow: 
		0 25px 50px -12px rgba(0, 0, 0, 0.25),
		0 0 0 1px rgba(255, 255, 255, 0.05);
	max-width: 800px;
	width: 100%;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	position: relative;
`,ve=F.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1.25rem 1.5rem 0.75rem 1.5rem;
	background: ${({$type:e})=>{switch(e){case"oauth_token":return"linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";case"oauth_authorize":return"linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)";case"data_api_get":return"linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)";case"data_api_post":return"linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)";case"data_api_put":return"linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)";case"data_api_delete":return"linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)";default:return"linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)"}}};
	border-bottom: 1px solid #e2e8f0;
`,Se=F.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,Ce=F.div`
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	background: ${({$type:e})=>{switch(e){case"oauth_token":return"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";case"oauth_authorize":return"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";case"data_api_get":return"linear-gradient(135deg, #10b981 0%, #059669 100%)";case"data_api_post":return"linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";case"data_api_put":return"linear-gradient(135deg, #ec4899 0%, #db2777 100%)";case"data_api_delete":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";default:return"linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}}};
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`,Ie=F.div`
	flex: 1;
`,Te=F.h2`
	font-size: 1.125rem;
	font-weight: 700;
	color: #1e293b;
	margin: 0;
	line-height: 1.2;
`,Ee=F.p`
	font-size: 0.8rem;
	color: #64748b;
	margin: 0.25rem 0 0 0;
	font-weight: 500;
`,_e=F.button`
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
`,Ae=F.div`
	padding: 1.25rem 1.5rem;
	flex: 1;
	overflow-y: auto;
`,Re=F.div`
	margin-bottom: 1.25rem;

	&:last-child {
		margin-bottom: 0;
	}
`,ze=F.div`
	font-size: 0.875rem;
	font-weight: 700;
	color: #1e293b;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Oe=F.div`
	padding: 0.75rem;
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.5rem;
	margin-bottom: 1.25rem;
	display: flex;
	gap: 0.75rem;
	align-items: flex-start;
`,Pe=F.div`
	color: #3b82f6;
	margin-top: 0.1rem;
`,$e=F.p`
	font-size: 0.75rem;
	color: #1e40af;
	margin: 0;
	line-height: 1.5;
	flex: 1;
`,Ne=F.span`
	display: inline-flex;
	align-items: center;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.7rem;
	font-weight: 700;
	font-family: 'Monaco', 'Courier New', monospace;
	background: ${({$method:e})=>{switch(e){case"GET":return"#10b981";case"POST":return"#6366f1";case"PUT":return"#ec4899";case"DELETE":return"#ef4444";default:return"#6b7280"}}};
	color: white;
`,De=F.div`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.5rem 0.75rem;
	padding: 0.75rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	font-size: 0.75rem;
`,Ue=F.div`
	font-weight: 600;
	color: #64748b;
`,Le=F.div`
	color: #1e293b;
	word-break: break-all;
	font-family: 'Monaco', 'Courier New', monospace;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,We=F.pre`
	background: #1e293b;
	color: #e2e8f0;
	padding: 0.75rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-size: 0.7rem;
	font-family: 'Monaco', 'Courier New', monospace;
	margin: 0;
	line-height: 1.5;
`,Be=F.button`
	padding: 0.4rem 0.75rem;
	background: ${({$copied:e})=>e?"#10b981":"#475569"};
	color: white;
	border: none;
	border-radius: 0.375rem;
	font-size: 0.7rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.35rem;
	transition: all 0.2s ease;
	margin-top: 0.5rem;

	&:hover {
		background: ${({$copied:e})=>e?"#059669":"#334155"};
	}
`,Me=F.button`
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.25rem;
	transition: all 0.2s ease;

	&:hover {
		background: #f3f4f6;
		color: #374151;
	}
`,Fe=F.ul`
	margin: 0.5rem 0 0 0;
	padding-left: 1.25rem;
	font-size: 0.75rem;
	color: #475569;
	line-height: 1.5;

	li {
		margin-bottom: 0.25rem;

		&:last-child {
			margin-bottom: 0;
		}
	}
`,qe=F.div`
	padding: 1rem 1.5rem;
	background: #f9fafb;
	border-top: 1px solid #e2e8f0;
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
`,Je=F.button`
	padding: 0.625rem 1.25rem;
	font-size: 0.8rem;
	font-weight: 600;
	border-radius: 0.5rem;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;

	${({$variant:e})=>"primary"===e?"\n\t\t\t\tbackground: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);\n\t\t\t\tcolor: white;\n\t\t\t\tbox-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);\n\n\t\t\t\t&:hover {\n\t\t\t\t\ttransform: translateY(-1px);\n\t\t\t\t\tbox-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);\n\t\t\t\t}\n\t\t\t":"\n\t\t\t\tbackground: white;\n\t\t\t\tcolor: #475569;\n\t\t\t\tborder: 1px solid #cbd5e1;\n\n\t\t\t\t&:hover {\n\t\t\t\t\tbackground: #f8fafc;\n\t\t\t\t\tborder-color: #94a3b8;\n\t\t\t\t}\n\t\t\t"}
`,Ve=({isOpen:h,config:g,onClose:f})=>{const[x,b]=e.useState(!1),[y,j]=e.useState(!1);if(!g)return null;const w=()=>{let e=`curl -X ${g.method} \\\n  '${g.url}'`;if(g.headers&&Object.entries(g.headers).forEach(([r,t])=>{const n="authorization"!==r.toLowerCase()||y?t:`Bearer ${t.split(" ")[1]?.substring(0,20)}...`;e+=` \\\n  -H '${r}: ${n}'`}),g.body){const r="string"==typeof g.body?g.body:JSON.stringify(g.body,null,2);e+=` \\\n  -d '${r}'`}return e},k=()=>{g.onCancel&&g.onCancel(),f()};return t.jsx(we,{$isOpen:h,onClick:k,children:t.jsxs(ke,{onClick:e=>e.stopPropagation(),children:[t.jsxs(ve,{$type:g.type,children:[t.jsxs(Se,{children:[t.jsx(Ce,{$type:g.type,children:(()=>{switch(g.type){case"oauth_token":return t.jsx(p,{size:20});case"oauth_authorize":return t.jsx(s,{size:20});case"data_api_get":return t.jsx(u,{size:20});case"data_api_post":default:return t.jsx(o,{size:20});case"data_api_put":return t.jsx(d,{size:20});case"data_api_delete":return t.jsx(n,{size:20})}})()}),t.jsxs(Ie,{children:[t.jsx(Te,{children:(()=>{switch(g.type){case"oauth_token":return"OAuth 2.0 Token Request";case"oauth_authorize":return"OAuth 2.0 Authorization Request";case"data_api_get":return"PingOne API GET Request";case"data_api_post":return"PingOne API POST Request";case"data_api_put":return"PingOne API PUT Request";case"data_api_delete":return"PingOne API DELETE Request";default:return"API Request"}})()}),t.jsx(Ee,{children:"Review request details before sending"})]})]}),t.jsx(_e,{onClick:k,title:"Close",children:t.jsx(n,{size:20})})]}),t.jsxs(Ae,{children:[t.jsxs(Oe,{children:[t.jsx(Pe,{children:t.jsx(i,{size:14})}),t.jsxs($e,{children:[t.jsx("strong",{children:"Educational Preview:"})," ",g.description]})]}),t.jsxs(Re,{children:[t.jsxs(ze,{children:[t.jsx(o,{size:14}),"HTTP Request Details"]}),t.jsxs(De,{children:[t.jsx(Ue,{children:"Method"}),t.jsx(Le,{children:t.jsx(Ne,{$method:g.method,children:g.method})}),t.jsx(Ue,{children:"URL"}),t.jsx(Le,{style:{gridColumn:"1 / -1"},children:t.jsx(q,{url:g.url,label:"API Endpoint",showInfoButton:!1,showCopyButton:!0,showOpenButton:!1})})]})]}),g.headers&&Object.keys(g.headers).length>0&&t.jsxs(Re,{children:[t.jsxs(ze,{children:[t.jsx(s,{size:14}),"Request Headers"]}),t.jsx(De,{children:Object.entries(g.headers).map(([e,n])=>t.jsxs(r.Fragment,{children:[t.jsx(Ue,{children:e}),t.jsx(Le,{children:"authorization"!==e.toLowerCase()||y?n:t.jsxs(t.Fragment,{children:[t.jsxs("span",{children:[n.split(" ")[0]," ",n.split(" ")[1]?.substring(0,20),"..."]}),t.jsx(Me,{onClick:()=>j(!y),title:y?"Hide token":"Show token",children:y?t.jsx(a,{size:14}):t.jsx(l,{size:14})})]})})]},e))})]}),g.body&&t.jsxs(Re,{children:[t.jsxs(ze,{children:[t.jsx(d,{size:14}),"Request Body"]}),t.jsx(We,{children:"string"==typeof g.body?g.body:JSON.stringify(g.body,null,2)})]}),g.educationalNotes&&g.educationalNotes.length>0&&t.jsxs(Re,{children:[t.jsxs(ze,{children:[t.jsx(i,{size:14}),"Learning Notes"]}),t.jsx(Fe,{children:g.educationalNotes.map((e,r)=>t.jsx("li",{children:e},r))})]}),t.jsxs(Re,{children:[t.jsxs(ze,{children:[t.jsx(d,{size:14}),"cURL Command"]}),t.jsx(We,{children:w()}),t.jsxs(Be,{$copied:x,onClick:()=>{const e=w();navigator.clipboard.writeText(e),b(!0),ne.showSuccess("cURL command copied to clipboard"),setTimeout(()=>b(!1),2e3)},children:[x?t.jsx(c,{size:12}):t.jsx(m,{size:12}),x?"Copied!":"Copy cURL"]})]})]}),t.jsxs(qe,{children:[t.jsx(Je,{$variant:"secondary",onClick:k,children:"Cancel"}),t.jsxs(Je,{$variant:"primary",onClick:()=>{g.onProceed(),f()},children:[t.jsx(o,{size:14}),"Send Request"]})]})]})})};const He=new class{listeners=[];isOpenListeners=[];showModal(e){this.notifyListeners(e),this.notifyIsOpenListeners(!0)}hideModal(){this.notifyListeners(null),this.notifyIsOpenListeners(!1)}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(r=>r!==e)}}subscribeIsOpen(e){return this.isOpenListeners.push(e),()=>{this.isOpenListeners=this.isOpenListeners.filter(r=>r!==e)}}notifyListeners(e){this.listeners.forEach(r=>{r(e)})}notifyIsOpenListeners(e){this.isOpenListeners.forEach(r=>{r(e)})}},Ge=()=>{const[n,i]=e.useState(null),[o,s]=e.useState(!1);r.useEffect(()=>{const e=He.subscribe(i),r=He.subscribeIsOpen(s);return()=>{e(),r()}},[]);const a=e.useCallback(()=>{He.hideModal()},[]);return t.jsx(Ve,{isOpen:o,config:n,onClose:a})},Ye=F.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 2rem 1.5rem 4rem;
	display: flex;
	flex-direction: column;
	gap: 1.75rem;
	width: 100%;
`,Ke=F.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.75rem;
	border-radius: 1rem;
	background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.04));
	border: 1px solid rgba(102, 126, 234, 0.2);
`,Qe=F.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #4f46e5;
`,Xe=F.h1`
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
`,Ze=F.p`
	margin: 0;
	color: #4338ca;
	max-width: 720px;
	line-height: 1.6;
`,er=F.div`
	display: grid;
	grid-template-columns: 280px 1fr;
	gap: 2rem;

	@media (max-width: 1080px) {
		grid-template-columns: 1fr;
	}
`,rr=F.div`
	background: #ffffff;
	border-radius: 1rem;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.18);
	overflow: hidden;
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`,tr=F.h2`
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.1rem;
	font-weight: 600;
	color: #0f172a;
`,nr=F.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`,ir=F.label`
	font-weight: 600;
	font-size: 0.85rem;
	color: #334155;
	display: flex;
	align-items: center;
	gap: 0.35rem;
`,or=F.select`
	width: 100%;
	padding: 0.75rem 0.85rem;
	border-radius: 0.75rem;
	border: 1px solid #cbd5f5;
	background: #f8fafc;
	transition: all 0.2s ease;
	font-size: 0.92rem;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
	}
`,sr=F.p`
	margin: 0;
	font-size: 0.8rem;
	color: #64748b;
`,ar=F.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`,lr=F.button`
	border: none;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: ${({disabled:e})=>e?"#cbd5f5":"#667eea"};
	color: white;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: ${({disabled:e})=>e?"not-allowed":"pointer"};
	transition: transform 0.15s ease, box-shadow 0.15s ease;

	&:hover {
		transform: ${({disabled:e})=>e?"none":"translateY(-1px)"};
		box-shadow: ${({disabled:e})=>e?"none":"0 10px 22px -12px rgba(102, 126, 234, 0.65)"};
	}

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
`,dr=F.button`
	border: none;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: #ef4444;
	color: white;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: transform 0.15s ease, box-shadow 0.15s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 22px -12px rgba(239, 68, 68, 0.65);
		background: #dc2626;
	}

	&:active {
		transform: translateY(0);
	}
`,cr=F.button`
	border: 1px solid #cbd5f5;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: white;
	color: #1e293b;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: background 0.15s ease, color 0.15s ease;

	&:hover {
		background: #f8fafc;
		border-color: #94a3b8;
	}
`,mr=F.div`
	padding: 1rem;
	background: #fef3c7;
	border: 1px solid #fbbf24;
	border-radius: 0.75rem;
	margin-bottom: 1rem;
`,ur=F.div`
	padding: 1rem;
	background: #fee2e2;
	border: 1px solid #f87171;
	border-radius: 0.75rem;
	margin-bottom: 1rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	color: #dc2626;
	font-size: 0.875rem;
`,pr=F.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`,hr=F.div`
	text-align: center;
	padding: 3rem 2rem;
	color: #6b7280;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
`,gr=F.div`
	padding: 0.75rem;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	background: #f9fafb;
	cursor: ${({$clickable:e})=>e?"pointer":"default"};
	transition: all 0.2s ease;

	&:hover {
		${({$clickable:e})=>e?"\n\t\t\tborder-color: #667eea;\n\t\t\tbackground: #f0f4ff;\n\t\t\tbox-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);\n\t\t\ttransform: translateY(-1px);\n\t\t":""}
	}
`,fr=F.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
	margin-bottom: 0.5rem;
`,xr=F.div`
	flex: 1;
`,br=F.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 0.25rem;
	font-size: 0.75rem;
	color: #6b7280;
`,yr=F.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-top: 0.5rem;
	font-size: 0.8rem;
`,jr=F.span`
	padding: 0.25rem 0.5rem;
	border-radius: 0.375rem;
	background: ${({$color:e})=>e||"#e5e7eb"};
	color: ${({$color:e})=>"#d1fae5"===e?"#065f46":"#fee2e2"===e?"#dc2626":"#dbeafe"===e?"#1e40af":"#374151"};
	font-weight: 500;
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
`,wr=F.div`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.6);
	display: ${({$isOpen:e})=>e?"flex":"none"};
	align-items: center;
	justify-content: center;
	z-index: 2000;
	padding: 2rem;
	backdrop-filter: blur(4px);
`,kr=F.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.25);
	max-width: 900px;
	width: 100%;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`,vr=F.div`
	padding: 1.5rem;
	border-bottom: 1px solid #e2e8f0;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`,Sr=F.h2`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 700;
	color: #1e293b;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Cr=F.button`
	background: none;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.5rem;
	transition: all 0.2s ease;
	font-size: 1.5rem;
	line-height: 1;

	&:hover {
		background: #f1f5f9;
		color: #0f172a;
	}
`,Ir=F.div`
	padding: 1.5rem;
	overflow-y: auto;
	flex: 1;
`,Tr=F.div`
	margin-bottom: 1.5rem;

	&:last-child {
		margin-bottom: 0;
	}
`,Er=F.h3`
	margin: 0 0 0.75rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: #334155;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding-bottom: 0.5rem;
	border-bottom: 2px solid #e2e8f0;
`,_r=F.div`
	display: grid;
	grid-template-columns: 140px 1fr;
	gap: 0.75rem;
	font-size: 0.875rem;
`,Ar=F.div`
	font-weight: 600;
	color: #64748b;
	padding: 0.5rem;
	background: #f8fafc;
	border-radius: 0.375rem;
`,Rr=F.div`
	color: #1e293b;
	padding: 0.5rem;
	word-break: break-word;
	font-family: ${({$isCode:e})=>e?"'Monaco', 'Menlo', 'Courier New', monospace":"inherit"};
	font-size: ${({$isCode:e})=>e?"0.8rem":"inherit"};
	background: ${({$isCode:e})=>e?"#f8fafc":"transparent"};
	border-radius: ${({$isCode:e})=>e?"0.375rem":"0"};
	border: ${({$isCode:e})=>e?"1px solid #e2e8f0":"none"};
`,zr=F.div`
	padding: 1rem 1.5rem;
	border-top: 1px solid #e2e8f0;
	background: #f8fafc;
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
`,Or=F.button`
	border: 1px solid #cbd5e1;
	border-radius: 0.5rem;
	padding: 0.5rem 1rem;
	background: white;
	color: #475569;
	font-weight: 600;
	font-size: 0.875rem;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}
`,Pr=()=>{const[r,o]=e.useState(!1),[a,d]=e.useState([]),[S,C]=e.useState(0),[I,T]=e.useState(null),[E,_]=e.useState(null),[A,R]=e.useState(null),[z,O]=e.useState(()=>ie()||""),[P,$]=e.useState(!1),[N,D]=e.useState(()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);return r.credentials?.environmentId||""}}catch(e){}return""}),U=ie()||z||"",L=!!U,[W,B]=e.useState(""),[M,F]=e.useState("25"),[q,H]=e.useState(""),[G,Y]=e.useState("user"),[K,Q]=e.useState(""),[ee,te]=e.useState("list"),[oe,se]=e.useState(""),[ae,le]=e.useState(null),[de,ce]=e.useState(!1);e.useEffect(()=>{const e=()=>{const e=ie()||"";O(e)};e();const r=r=>{(r.key?.startsWith("worker_token")||r.key?.startsWith("pingone_worker_token"))&&e()},t=()=>{e()};window.addEventListener("storage",r),window.addEventListener("workerTokenUpdated",t),window.addEventListener("workerTokenAuditUpdated",t);const n=setInterval(e,1e3);return()=>{window.removeEventListener("storage",r),window.removeEventListener("workerTokenUpdated",t),window.removeEventListener("workerTokenAuditUpdated",t),clearInterval(n)}},[]);const me=e.useCallback(()=>{$(!0)},[]);e.useEffect(()=>{const e=()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);r.credentials?.environmentId&&!N&&D(r.credentials.environmentId)}}catch(e){}};return window.addEventListener("workerTokenUpdated",e),()=>window.removeEventListener("workerTokenUpdated",e)},[N]);const ue=e.useCallback(async()=>{const e=localStorage.getItem("worker_credentials"),r=e?JSON.parse(e):null,t=r?.region||"us",n=ie()||"";o(!0),_(null);let i=null;try{const e=[];W&&e.push(`action.type eq "${W}"`),q&&("user"===G?e.push(`actors.user.id eq "${q}"`):e.push(`actors.client.id eq "${q}"`)),K&&e.push(`correlationId eq "${K}"`);const r=e.length>0?e.join(" and "):void 0,o=`https://${{us:"api.pingone.com",na:"api.pingone.com",eu:"api.pingone.eu",ap:"api.pingone.asia",ca:"api.pingone.ca",asia:"api.pingone.asia"}[t.toLowerCase()]||"api.pingone.com"}/v1`;let s;if("single"===ee&&oe.trim())s=`${o}/environments/${N.trim()}/activities/${oe.trim()}`;else{const e=new URL(`${o}/environments/${N.trim()}/activities`);r&&e.searchParams.append("filter",r),e.searchParams.append("limit",M),e.searchParams.append("order","createdAt DESC"),s=e.toString()}i=re.trackApiCall({method:"GET",url:s,headers:{Authorization:`Bearer ${n.substring(0,20)}...`,"Content-Type":"application/json"}});const a=await fetch(s,{method:"GET",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"}});if(!a.ok){if(403===a.status)throw new Error("PERMISSIONS_ERROR");const e=await a.json().catch(()=>({})),r=e.message||e.error_description||a.statusText;if(r&&"string"==typeof r&&r.includes("not supported in filter"))throw new Error(`Invalid Filter: ${r}`);throw new Error(r)}const l=await a.json();let c=0;if("single"===ee&&oe.trim()){const e=l;d([e]),C(1),R({_embedded:{activities:[e]},count:1,_count:1}),c=1}else{const e=l,r=e._embedded?.activities||[];d(r);const t=e._count??e.count;C(t&&t>0?t:r.length),R(e),c=r.length}T((new Date).toISOString()),re.updateApiCallResponse(i,{status:a.status,statusText:a.statusText,data:l,headers:Object.fromEntries(a.headers.entries())}),ne.showSuccess(`Retrieved ${c} audit ${1===c?"activity":"activities"}`)}catch(s){d([]),C(0),R(null),T(null),i&&re.updateApiCallResponse(i,{status:s instanceof Error&&"PERMISSIONS_ERROR"===s.message?403:500,statusText:s instanceof Error?s.message:"Unknown error",error:s instanceof Error?s.message:"Unexpected error"}),s instanceof Error&&"PERMISSIONS_ERROR"===s.message?_('Worker token lacks required permissions. Ensure your Worker App has the "p1:read:audit" scope.'):_(s instanceof Error?s.message:"Unexpected error querying audit activities")}finally{o(!1)}},[W,q,G,K,M,ee,oe,N]),pe=e.useCallback(async()=>{const e=localStorage.getItem("worker_credentials"),r=e?JSON.parse(e):null,t=r?.region||"us";if(!N.trim())return void _('Environment ID is required. Please enter your PingOne Environment ID in the field above, or click "Get Worker Token" to automatically load it from your credentials.');const n=ie()||void 0;if(!n)return void _('Worker token required. Click "Get Worker Token" to generate one.');const i={us:"https://api.pingone.com",na:"https://api.pingone.com",eu:"https://api.pingone.eu",ca:"https://api.pingone.ca",ap:"https://api.pingone.asia",asia:"https://api.pingone.asia"},o=i[t.toLowerCase()]||i.na;let s;if("single"===ee&&oe.trim())s=`${o}/v1/environments/${N.trim()}/activities/${oe.trim()}`;else{const e=[];W&&e.push(`action.type eq "${W}"`),q&&("user"===G?e.push(`actors.user.id eq "${q}"`):e.push(`actors.client.id eq "${q}"`)),K&&e.push(`correlationId eq "${K}"`);const r=new URLSearchParams;e.length>0&&r.append("filter",e.join(" and ")),r.append("limit",M),r.append("order","createdAt DESC"),s=`${o}/v1/environments/${N.trim()}/activities?${r.toString()}`}const a="single"===ee&&oe.trim()?["Retrieves a single audit activity by its unique ID","Returns detailed information about the specific activity","Requires p1:read:audit scope in your worker token","Useful for deep-diving into specific audit events"]:["This endpoint returns audit events from your PingOne environment","Uses OData filtering syntax for action.type, actors.user.id, actors.client.id, and correlationId","Note: PingOne API does NOT support filtering by result.status, actors.user.username, actors.user.email, or resources","Note: Time-based filtering (createdAt gt) is also not supported","Results are ordered by createdAt in descending order (newest first)","Requires p1:read:audit scope in your worker token","Use filters to narrow down activities by action type, actor ID, or correlation ID"];He.showModal({type:"data_api_get",method:"GET",url:s,headers:{Authorization:`Bearer ${n}`,Accept:"application/json"},description:"Retrieve audit activities from your PingOne environment with filtering",educationalNotes:a,onProceed:ue})},[W,q,G,K,M,ee,oe,N,ue]),he=e.useMemo(()=>A?JSON.parse(JSON.stringify(A)):null,[A]),ge=e.useMemo(()=>{if(!a||0===a.length)return null;const e=a.filter(e=>"success"===e.result?.status).length,r=a.filter(e=>"failure"===e.result?.status).length,t=new Set(a.map(e=>e.action.type)).size,n=new Set(a.map(e=>e.actors?.user?.id).filter(Boolean)).size;return{total:a.length,success:e,failure:r,uniqueActionTypes:t,uniqueUsers:n}},[a]),fe=e=>new Date(e).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"}),xe=()=>{le(null),ce(!1)},be=e=>null==e?t.jsx("span",{style:{color:"#94a3b8",fontStyle:"italic"},children:"Not available"}):"object"!=typeof e||Array.isArray(e)?Array.isArray(e)?0===e.length?t.jsx("span",{style:{color:"#94a3b8",fontStyle:"italic"},children:"Empty array"}):t.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:e.map((e,r)=>t.jsx("div",{style:{padding:"0.5rem",background:"#f8fafc",borderRadius:"0.375rem",border:"1px solid #e2e8f0"},children:"object"==typeof e?t.jsx(Rr,{$isCode:!0,children:JSON.stringify(e,null,2)}):t.jsx(Rr,{children:String(e)})},r))}):t.jsx(Rr,{children:String(e)}):t.jsx(Rr,{$isCode:!0,children:JSON.stringify(e,null,2)});return t.jsxs(Ye,{children:[t.jsxs(Ke,{children:[t.jsxs(Qe,{children:[t.jsx(h,{size:24}),t.jsx(Xe,{children:"PingOne Audit Activities"})]}),t.jsxs(Ze,{children:["Query and analyze audit events from your PingOne environment. Retrieve activities by ID, filter by action type, status, actor, resource, or correlation ID. Track user actions, system events, and security activities. Requires ",t.jsx("strong",{children:"p1:read:audit"})," scope."]}),!L&&t.jsx(mr,{children:t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.75rem"},children:[t.jsx(g,{size:20,style:{marginTop:"0.1rem",flexShrink:0}}),t.jsxs("div",{style:{flex:1},children:[t.jsx("strong",{children:"Worker Token Required"}),t.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.875rem"},children:'Click "Get Worker Token" below to generate a token with your PingOne credentials.'})]})]})})]}),t.jsxs(er,{children:[t.jsxs(rr,{children:[t.jsxs(tr,{children:[t.jsx(s,{})," Authentication & Configuration"]}),t.jsxs(nr,{children:[t.jsx(ir,{children:"Environment ID"}),t.jsx("input",{type:"text",value:N,onChange:e=>D(e.target.value),placeholder:"Enter PingOne Environment ID (e.g., 12345678-1234-1234-1234-123456789abc)",style:{width:"100%",padding:"0.75rem 0.85rem",borderRadius:"0.75rem",border:"1px solid "+(N.trim()?"#cbd5f5":"#f59e0b"),background:N.trim()?"#f8fafc":"#fffbeb",fontSize:"0.92rem",fontFamily:"'Monaco', 'Menlo', 'Courier New', monospace"}}),N.trim()?t.jsx(sr,{children:"Your PingOne Environment ID (automatically loaded from worker credentials)"}):t.jsx(sr,{style:{color:"#d97706",fontWeight:600},children:'⚠️ Environment ID is required. Enter it manually or click "Get Worker Token" below to auto-fill.'})]}),L?t.jsx(X,{token:U,tokenExpiryKey:"worker_token_expires_at"}):t.jsx(mr,{style:{marginBottom:"1rem"},children:t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.75rem"},children:[t.jsx(g,{size:18,style:{marginTop:"0.1rem",flexShrink:0}}),t.jsxs("div",{style:{flex:1},children:[t.jsx("strong",{children:"No Worker Token Found"}),t.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.875rem"},children:"Click the button below to open the Worker Token modal and generate a token with the required credentials."})]})]})}),t.jsxs(ar,{children:[t.jsx(lr,{onClick:me,type:"button",style:{background:L?"#10b981":void 0,cursor:"pointer",color:"white"},children:L?t.jsxs(t.Fragment,{children:[t.jsx(f,{})," Worker Token Ready"]}):t.jsxs(t.Fragment,{children:[t.jsx(p,{})," Get Worker Token"]})}),L&&t.jsxs(dr,{onClick:()=>{localStorage.removeItem("worker_token"),localStorage.removeItem("worker_token_expires_at"),localStorage.removeItem("pingone_worker_token"),localStorage.removeItem("pingone_worker_token_worker-token-v7"),localStorage.removeItem("worker_token_audit"),localStorage.removeItem("worker_token_audit_expires_at"),O(""),ne.showSuccess("Worker token cleared successfully.")},type:"button",children:[t.jsx(n,{})," Clear Token"]})]})]}),t.jsxs(rr,{children:[t.jsxs(tr,{children:[t.jsx(x,{})," Query Configuration"]}),t.jsxs(nr,{children:[t.jsx(ir,{children:"View Mode"}),t.jsxs(or,{value:ee,onChange:e=>{te(e.target.value),"single"===e.target.value?(B(""),H(""),Y("user"),Q("")):se("")},children:[t.jsx("option",{value:"list",children:"List Activities (with filters)"}),t.jsx("option",{value:"single",children:"Get Single Activity by ID"})]}),t.jsx(sr,{children:"Choose whether to list multiple activities or retrieve a specific one by ID"})]}),"single"===ee?t.jsxs(nr,{children:[t.jsx(ir,{children:"Activity ID"}),t.jsx("input",{type:"text",value:oe,onChange:e=>se(e.target.value),placeholder:"Enter activity ID (e.g., 12345678-1234-1234-1234-123456789abc)",style:{width:"100%",padding:"0.75rem 0.85rem",borderRadius:"0.75rem",border:"1px solid #cbd5f5",background:"#f8fafc",fontSize:"0.92rem",fontFamily:"'Monaco', 'Menlo', 'Courier New', monospace"}}),t.jsx(sr,{children:"Enter the unique ID of the activity you want to retrieve"})]}):t.jsxs(t.Fragment,{children:[t.jsxs(nr,{children:[t.jsx(ir,{children:"Action Type"}),t.jsxs(or,{value:W,onChange:e=>B(e.target.value),children:[t.jsx("option",{value:"",children:"All Actions"}),t.jsxs("optgroup",{label:"User Actions",children:[t.jsx("option",{value:"USER.CREATED",children:"User Created"}),t.jsx("option",{value:"USER.UPDATED",children:"User Updated"}),t.jsx("option",{value:"USER.DELETED",children:"User Deleted"}),t.jsx("option",{value:"USER.ACCESS_ALLOWED",children:"User Access Allowed"}),t.jsx("option",{value:"USER.ACCESS_DENIED",children:"User Access Denied"})]}),t.jsxs("optgroup",{label:"Session Actions",children:[t.jsx("option",{value:"SESSION.CREATED",children:"Session Created"}),t.jsx("option",{value:"SESSION.DELETED",children:"Session Deleted"})]}),t.jsxs("optgroup",{label:"Application Actions",children:[t.jsx("option",{value:"APPLICATION.CREATED",children:"Application Created"}),t.jsx("option",{value:"APPLICATION.UPDATED",children:"Application Updated"}),t.jsx("option",{value:"APPLICATION.DELETED",children:"Application Deleted"})]}),t.jsxs("optgroup",{label:"Token Actions",children:[t.jsx("option",{value:"TOKEN.CREATED",children:"Token Created"}),t.jsx("option",{value:"TOKEN.REVOKED",children:"Token Revoked"})]}),t.jsxs("optgroup",{label:"Authentication",children:[t.jsx("option",{value:"AUTHENTICATION.SUCCESS",children:"Authentication Success"}),t.jsx("option",{value:"AUTHENTICATION.FAILURE",children:"Authentication Failure"})]}),t.jsxs("optgroup",{label:"Role Actions",children:[t.jsx("option",{value:"ROLE_ASSIGNMENT.CREATED",children:"Role Assignment Created"}),t.jsx("option",{value:"ROLE_ASSIGNMENT.DELETED",children:"Role Assignment Deleted"})]})]}),t.jsx(sr,{children:"Filter by specific action type (e.g., USER.CREATED, SESSION.CREATED)"})]}),t.jsxs(nr,{children:[t.jsx(ir,{children:"Actor Type"}),t.jsxs(or,{value:G,onChange:e=>Y(e.target.value),children:[t.jsx("option",{value:"user",children:"User"}),t.jsx("option",{value:"client",children:"Client (Application)"})]}),t.jsx(sr,{children:"Select whether to filter by user ID or client (application) ID"})]}),t.jsxs(nr,{children:[t.jsx(ir,{children:"user"===G?"User ID":"Client ID"}),t.jsx("input",{type:"text",value:q,onChange:e=>H(e.target.value),placeholder:"user"===G?"Enter user ID (UUID)":"Enter client ID (UUID)",style:{width:"100%",padding:"0.75rem 0.85rem",borderRadius:"0.75rem",border:"1px solid #cbd5f5",background:"#f8fafc",fontSize:"0.92rem",fontFamily:"'Monaco', 'Menlo', 'Courier New', monospace"}}),t.jsx(sr,{children:"user"===G?"Filter by user UUID (Note: username and email filtering not supported by PingOne API)":"Filter by client (application) UUID"})]}),t.jsxs(nr,{children:[t.jsx(ir,{children:"Correlation ID"}),t.jsx("input",{type:"text",value:K,onChange:e=>Q(e.target.value),placeholder:"e.g., abc123-correlation-id",style:{width:"100%",padding:"0.75rem 0.85rem",borderRadius:"0.75rem",border:"1px solid #cbd5f5",background:"#f8fafc",fontSize:"0.92rem",fontFamily:"'Monaco', 'Menlo', 'Courier New', monospace"}}),t.jsx(sr,{children:"Filter by correlation ID to track related activities across multiple audit events"})]}),t.jsxs(nr,{children:[t.jsx(ir,{children:"Limit"}),t.jsxs(or,{value:M,onChange:e=>F(e.target.value),children:[t.jsx("option",{value:"10",children:"10 activities"}),t.jsx("option",{value:"25",children:"25 activities"}),t.jsx("option",{value:"50",children:"50 activities"}),t.jsx("option",{value:"100",children:"100 activities"}),t.jsx("option",{value:"500",children:"500 activities"}),t.jsx("option",{value:"1000",children:"1000 activities"})]}),t.jsx(sr,{children:"Maximum number of activities to retrieve (ordered by newest first)"})]}),t.jsx(nr,{children:t.jsx(ir,{style:{color:"#6b7280",fontSize:"0.75rem",fontWeight:"normal"},children:"Note: Time-based filtering is not supported by the PingOne Audit API. Results are ordered by newest first."})})]}),t.jsxs(ar,{children:[t.jsx(lr,{onClick:pe,disabled:!L||r||!N.trim()||"single"===ee&&!oe.trim(),title:N.trim()?L?"single"!==ee||oe.trim()?"":"Activity ID is required":"Worker token is required":"Environment ID is required",children:r?t.jsxs(t.Fragment,{children:[t.jsx(b,{className:"spin"})," Fetching…"]}):"single"===ee?t.jsxs(t.Fragment,{children:[t.jsx(l,{})," Get Activity"]}):t.jsxs(t.Fragment,{children:[t.jsx(h,{})," Retrieve Activities"]})}),t.jsxs(cr,{type:"button",onClick:()=>{"single"===ee?se(""):(B(""),H(""),Y("user"),Q(""),F("25"))},children:[t.jsx(n,{})," ","single"===ee?"Clear ID":"Reset Filters"]})]}),E&&t.jsxs(ur,{children:[t.jsx(i,{size:18,style:{marginTop:"0.2rem"}}),t.jsx("span",{children:E})]}),t.jsx(pr,{children:A?t.jsxs(t.Fragment,{children:[ge&&t.jsxs(rr,{style:{border:"1px solid #667eea",background:"linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)"},children:[t.jsxs(tr,{children:[t.jsx(y,{})," Summary Statistics"]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:"1rem",marginTop:"1rem"},children:[t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #c4b5fd"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Total Activities"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:700,color:"#6366f1"},children:ge.total})]}),t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #c4b5fd"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Successful"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:700,color:"#10b981"},children:ge.success})]}),t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #c4b5fd"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Failed"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:700,color:"#ef4444"},children:ge.failure})]}),t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #c4b5fd"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Action Types"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:700,color:"#6366f1"},children:ge.uniqueActionTypes})]}),t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #c4b5fd"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Unique Users"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:700,color:"#6366f1"},children:ge.uniqueUsers})]}),t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #c4b5fd"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Total Count"}),t.jsx("div",{style:{fontSize:"1.1rem",fontWeight:600,color:"#6366f1"},children:S.toLocaleString()})]})]}),I&&t.jsxs(sr,{style:{marginTop:"1rem",paddingTop:"1rem",borderTop:"1px solid #c4b5fd"},children:["Last updated: ",new Date(I).toLocaleString()]})]}),a.length>0&&t.jsxs(rr,{style:{border:"1px solid #e2e8f0",background:"#ffffff"},children:[t.jsxs(tr,{children:[t.jsx(h,{})," Activity Details"," ",S>a.length?`(${a.length} of ${S})`:`(${a.length})`]}),t.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem",maxHeight:"400px",overflowY:"auto",padding:"0.5rem"},children:a.map(e=>t.jsx(gr,{$clickable:!0,onClick:()=>(e=>{le(e),ce(!1)})(e),children:t.jsxs(fr,{children:[t.jsxs(xr,{children:[t.jsx("div",{style:{fontWeight:600,color:"#1e293b",fontSize:"0.9rem",marginBottom:"0.25rem"},children:e.action.type}),e.action.description&&t.jsx("div",{style:{fontSize:"0.8rem",color:"#4b5563",marginBottom:"0.5rem"},children:e.action.description}),t.jsxs(yr,{children:[e.result?.status&&t.jsxs(jr,{$color:"success"===e.result.status?.toLowerCase()?"#d1fae5":"#fee2e2",children:["success"===e.result.status?t.jsx(f,{size:12}):t.jsx(g,{size:12}),e.result.status.toUpperCase()]}),e.actors?.user?.name&&t.jsxs(jr,{$color:"#dbeafe",children:[t.jsx(j,{size:12}),e.actors.user.name]}),e.actors?.client?.name&&t.jsxs(jr,{$color:"#f3e8ff",children:[t.jsx(w,{size:12}),e.actors.client.name]}),e.resources&&e.resources.length>0&&t.jsxs(jr,{$color:"#fef3c7",children:[t.jsx(u,{size:12}),e.resources.length," resource",1!==e.resources.length?"s":""]}),e.ipAddress&&t.jsxs(jr,{children:[t.jsx(k,{size:12}),e.ipAddress]})]})]}),t.jsxs(br,{children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.25rem"},children:[t.jsx(v,{size:12}),fe(e.createdAt)]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.25rem",marginTop:"0.25rem",color:"#667eea"},children:[t.jsx(l,{size:12}),t.jsx("span",{style:{fontSize:"0.7rem"},children:"View Details"})]})]})]})},e.id))})]}),t.jsxs(rr,{style:{border:"1px solid #dbeafe",background:"#ffffff"},children:[t.jsxs(tr,{children:[t.jsx(u,{})," Full API Response"]}),he&&t.jsx("div",{style:{maxHeight:"600px",overflow:"auto"},children:t.jsx(J,{data:he})})]})]}):t.jsxs(hr,{children:[t.jsx(h,{size:22}),t.jsx("span",{children:"Run the request to see audit activities returned by PingOne."})]})})]})]}),t.jsx(Z,{isOpen:P,onClose:()=>$(!1),onContinue:()=>{const e=ie()||"";O(e);try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);r.credentials?.environmentId&&D(r.credentials.environmentId)}}catch(r){}$(!1),e?ne.showSuccess("Worker token generated successfully. Ready to query audit activities."):ne.showError("Worker token was not detected. Please try generating again.")},flowType:"pingone-audit-activities",environmentId:N,skipCredentialsStep:!0,prefillCredentials:(()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);return{environmentId:N||r.credentials?.environmentId||"",clientId:r.credentials?.clientId||"",clientSecret:r.credentials?.clientSecret||"",region:r.credentials?.region||"us",scopes:"p1:read:audit"}}}catch(e){}return{}})(),tokenStorageKey:"worker_token",tokenExpiryKey:"worker_token_expires_at"}),t.jsx(wr,{$isOpen:!!ae,onClick:xe,children:t.jsx(kr,{onClick:e=>e.stopPropagation(),children:ae&&t.jsxs(t.Fragment,{children:[t.jsxs(vr,{children:[t.jsxs(Sr,{children:[t.jsx(h,{size:24}),"Activity Details"]}),t.jsx(Cr,{onClick:xe,children:t.jsx(n,{})})]}),t.jsxs(Ir,{children:[t.jsxs(Tr,{children:[t.jsxs(Er,{children:[t.jsx(i,{})," Basic Information"]}),t.jsxs(_r,{children:[t.jsx(Ar,{children:"Activity ID"}),be(ae.id),t.jsx(Ar,{children:"Action Type"}),be(ae.action.type),ae.action.description&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"Description"}),be(ae.action.description)]}),t.jsx(Ar,{children:"Created At"}),t.jsx(Rr,{children:fe(ae.createdAt)})]})]}),ae.result&&t.jsxs(Tr,{children:[t.jsxs(Er,{children:[t.jsx(f,{})," Result"]}),t.jsxs(_r,{children:[t.jsx(Ar,{children:"Status"}),t.jsx(Rr,{style:{color:"success"===ae.result.status?.toLowerCase()?"#10b981":"#ef4444",fontWeight:600},children:ae.result.status?.toUpperCase()||"Unknown"}),ae.result.description&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"Description"}),be(ae.result.description)]}),ae.result.error&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"Error Code"}),be(ae.result.error.code),t.jsx(Ar,{children:"Error Message"}),be(ae.result.error.message)]})]})]}),ae.actors&&t.jsxs(Tr,{children:[t.jsxs(Er,{children:[t.jsx(j,{})," Actors"]}),t.jsxs(_r,{children:[ae.actors.user&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"User"}),t.jsxs("div",{children:[ae.actors.user.name&&t.jsxs(Rr,{style:{marginBottom:"0.25rem"},children:[t.jsx("strong",{children:"Name:"})," ",ae.actors.user.name]}),ae.actors.user.id&&t.jsxs(Rr,{style:{marginBottom:"0.25rem"},children:[t.jsx("strong",{children:"ID:"})," ",ae.actors.user.id]}),ae.actors.user.username&&t.jsxs(Rr,{style:{marginBottom:"0.25rem"},children:[t.jsx("strong",{children:"Username:"})," ",ae.actors.user.username]}),ae.actors.user.email&&t.jsxs(Rr,{children:[t.jsx("strong",{children:"Email:"})," ",ae.actors.user.email]})]})]}),ae.actors.client&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"Client"}),t.jsxs("div",{children:[ae.actors.client.name&&t.jsxs(Rr,{style:{marginBottom:"0.25rem"},children:[t.jsx("strong",{children:"Name:"})," ",ae.actors.client.name]}),ae.actors.client.id&&t.jsxs(Rr,{style:{marginBottom:"0.25rem"},children:[t.jsx("strong",{children:"ID:"})," ",ae.actors.client.id]}),ae.actors.client.type&&t.jsxs(Rr,{children:[t.jsx("strong",{children:"Type:"})," ",ae.actors.client.type]})]})]}),ae.actors.system&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"System"}),t.jsxs("div",{children:[ae.actors.system.name&&t.jsxs(Rr,{style:{marginBottom:"0.25rem"},children:[t.jsx("strong",{children:"Name:"})," ",ae.actors.system.name]}),ae.actors.system.id&&t.jsxs(Rr,{children:[t.jsx("strong",{children:"ID:"})," ",ae.actors.system.id]})]})]})]})]}),ae.resources&&ae.resources.length>0&&t.jsxs(Tr,{children:[t.jsxs(Er,{children:[t.jsx(u,{})," Resources (",ae.resources.length,")"]}),t.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:ae.resources.map((e,r)=>t.jsx("div",{style:{padding:"0.75rem",background:"#f8fafc",borderRadius:"0.5rem",border:"1px solid #e2e8f0"},children:t.jsxs(_r,{children:[e.type&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"Type"}),be(e.type)]}),e.name&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"Name"}),be(e.name)]}),e.id&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"ID"}),be(e.id)]})]})},r))})]}),(ae.ipAddress||ae.userAgent||ae.correlationId)&&t.jsxs(Tr,{children:[t.jsxs(Er,{children:[t.jsx(k,{})," Request Context"]}),t.jsxs(_r,{children:[ae.ipAddress&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"IP Address"}),be(ae.ipAddress)]}),ae.userAgent&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"User Agent"}),be(ae.userAgent)]}),ae.correlationId&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"Correlation ID"}),be(ae.correlationId)]})]})]}),(ae.environment||ae.organization)&&t.jsxs(Tr,{children:[t.jsxs(Er,{children:[t.jsx(s,{})," Context"]}),t.jsxs(_r,{children:[ae.environment&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"Environment"}),t.jsxs("div",{children:[ae.environment.name&&t.jsxs(Rr,{style:{marginBottom:"0.25rem"},children:[t.jsx("strong",{children:"Name:"})," ",ae.environment.name]}),ae.environment.id&&t.jsxs(Rr,{children:[t.jsx("strong",{children:"ID:"})," ",ae.environment.id]})]})]}),ae.organization&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"Organization"}),t.jsxs("div",{children:[ae.organization.name&&t.jsxs(Rr,{style:{marginBottom:"0.25rem"},children:[t.jsx("strong",{children:"Name:"})," ",ae.organization.name]}),ae.organization.id&&t.jsxs(Rr,{children:[t.jsx("strong",{children:"ID:"})," ",ae.organization.id]})]})]})]})]}),ae.target&&t.jsxs(Tr,{children:[t.jsxs(Er,{children:[t.jsx(u,{})," Target"]}),t.jsxs(_r,{children:[ae.target.type&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"Type"}),be(ae.target.type)]}),ae.target.name&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"Name"}),be(ae.target.name)]}),ae.target.id&&t.jsxs(t.Fragment,{children:[t.jsx(Ar,{children:"ID"}),be(ae.target.id)]})]})]}),t.jsxs(Tr,{children:[t.jsxs(Er,{children:[t.jsx(u,{})," Complete JSON"]}),t.jsx("div",{style:{maxHeight:"400px",overflow:"auto",padding:"1rem",background:"#f8fafc",borderRadius:"0.5rem",border:"1px solid #e2e8f0"},children:t.jsx(J,{data:ae})})]})]}),t.jsxs(zr,{children:[t.jsxs(Or,{onClick:()=>{ae&&(navigator.clipboard.writeText(JSON.stringify(ae,null,2)),ce(!0),ne.showSuccess("Activity JSON copied to clipboard"),setTimeout(()=>ce(!1),2e3))},children:[de?t.jsx(c,{size:16}):t.jsx(m,{size:16}),de?"Copied!":"Copy JSON"]}),t.jsxs(cr,{onClick:xe,children:[t.jsx(n,{})," Close"]})]})]})})}),t.jsx(V,{title:"API Calls to PingOne",showLegend:!0})]})},$r="pingone.davinci.branding",Nr="undefined"!=typeof window,Dr=e=>!!e&&Object.values(e).some(e=>Boolean(e)),Ur=()=>{const[r,t]=e.useState(()=>(()=>{if(!Nr)return null;try{const e=window.localStorage.getItem($r);if(!e)return null;const r=JSON.parse(e);if(r&&"object"==typeof r)return r}catch(e){}return null})()),n=e.useCallback(e=>{if(!Nr)return;if(!e||!Dr(e))return window.localStorage.removeItem($r),void t(null);const r={...e,updatedAt:Date.now()};try{window.localStorage.setItem($r,JSON.stringify(r)),t(r)}catch(n){t(r)}},[]);e.useEffect(()=>{if(!Nr)return;const e=e=>{const r=e.data;r&&"object"==typeof r&&"PINGONE_DAVINCI_BRANDING"===r.type&&(r.payload&&"object"==typeof r.payload?n({...r.payload,source:e.origin,extensionVersion:r.version}):n(null))};return window.addEventListener("message",e),()=>{window.removeEventListener("message",e)}},[n]);const i=e.useCallback(()=>{n(null)},[n]),o=e.useCallback(()=>{Nr&&window.open("https://marketplace.pingone.com/item/davinci-design-studio","_blank","noopener,noreferrer")},[]),s=e.useMemo(()=>Dr(r),[r]);return{branding:r,hasBranding:s,openDesignStudio:o,clearBranding:i,persistBranding:n}},Lr=[{value:"code",label:"code (Authorization Code)"},{value:"token",label:"token (Implicit)"},{value:"id_token",label:"id_token (Implicit)"},{value:"code id_token",label:"code id_token (Hybrid)"},{value:"code token",label:"code token (Hybrid)"},{value:"code id_token token",label:"code id_token token (Hybrid)"}],Wr="pingone_login_playground_config",Br="pingone_login_playground_result",Mr="pingone_login_playground_context",Fr="pingone_redirect_flow_context",qr="pingone_login_redirectless_creds",Jr="pingone_worker_credentials",Vr={environmentId:"b9817c16-9910-4415-b67e-4ac687da74d9",clientId:"sample-client-id-1234",clientSecret:"sample-client-secret-shhh",redirectUri:H.getCallbackUri("p1authCallback"),scopes:"openid",responseType:"code",tokenEndpointAuthMethod:"client_secret_post"},Hr={username:"",password:"",codeVerifier:"",codeChallenge:""},Gr=[{value:"client_secret_post",label:"Client Secret POST",description:"Send client credentials in request body"},{value:"client_secret_basic",label:"Client Secret Basic",description:"Send client credentials in Authorization header"},{value:"client_secret_jwt",label:"Client Secret JWT",description:"Use JWT signed with client secret"},{value:"private_key_jwt",label:"Private Key JWT",description:"Use JWT signed with private key"},{value:"none",label:"None",description:"No client authentication (public clients)"}],Yr=F.div`
	max-width: 100%;
	overflow-x: hidden;
	box-sizing: border-box;
	background: white;
	min-height: 100vh;
	padding: 2rem;
	margin-left: 320px;
	margin-top: 100px;
	transition: margin 0.3s ease;

	@media (max-width: 1024px) {
		margin-left: 0;
		margin-top: 100px;
		padding: 1rem;
	}
`,Kr=F.div`
	max-width: 100%;
	box-sizing: border-box;
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	padding: 2rem;
	margin-bottom: 2rem;
`,Qr=F.h2`
	color: #333;
	font-size: 1.5rem;
	font-weight: 600;
	margin-bottom: 1rem;
`,Xr=F.div`
	background: #f8f9fa;
	border-left: 4px solid #007bff;
	padding: 1rem;
	margin-bottom: 1.5rem;
	border-radius: 4px;
`,Zr=F.div`
	margin-bottom: 1.5rem;
`,et=F.label`
	display: block;
	color: #333;
	font-weight: 500;
	margin-bottom: 0.5rem;
`,rt=F.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 6px;
	font-size: 1rem;
	color: #333;
	background: white;
	
	&:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}
`,tt=F.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 6px;
	font-size: 1rem;
	color: #333;
	background: white;
	
	&:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}
`,nt=F.div`
	margin-top: 2rem;
	padding: 1.5rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 12px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
	overflow-x: auto;
	max-width: 100%;
	box-sizing: border-box;
`,it=F.h3`
	color: white;
	margin: 0 0 1.5rem 0;
	font-size: 1.5rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,ot=F.div`
	overflow-x: auto;
	max-width: 100%;
	width: 100%;
	box-sizing: border-box;
	background: white;
	border-radius: 8px;
	padding: 1.25rem;
	margin-bottom: 1rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	border-left: 4px solid ${e=>e.$status?e.$status>=200&&e.$status<300?"#28a745":e.$status>=400?"#dc3545":"#ffc107":"#6c757d"};
`,st=F.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.75rem;
`,at=F.div`
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: ${e=>e.$status?e.$status>=200&&e.$status<300?"#28a745":e.$status>=400?"#dc3545":"#ffc107":"#6c757d"};
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 0.9rem;
`,lt=F.div`
	font-weight: 600;
	color: #2c3e50;
	font-size: 1.1rem;
	flex: 1;
`,dt=F.span`
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 700;
	background: ${e=>{switch(e.$method){case"POST":return"#007bff";case"GET":return"#28a745";case"UI":return"#ff9800";default:return"#6c757d"}}};
	color: white;
`,ct=F.span`
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 700;
	background: ${e=>e.$status>=200&&e.$status<300?"#d4edda":e.$status>=400?"#f8d7da":"#fff3cd"};
	color: ${e=>e.$status>=200&&e.$status<300?"#155724":e.$status>=400?"#721c24":"#856404"};
`,mt=F.div`
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
	font-size: 0.85rem;
	color: #495057;
	background: #f8f9fa;
	padding: 0.75rem;
	border-radius: 4px;
	margin-bottom: 0.75rem;
	word-break: break-all;
	overflow-wrap: break-word;
	overflow-x: auto;
	max-width: 100%;
`,ut=F.div`
	margin-bottom: 0.75rem;
	max-width: 100%;
	overflow-x: auto;
	box-sizing: border-box;
`,pt=F.div`
	display: flex;
	gap: 0.5rem;
	padding: 0.5rem;
	background: #f8f9fa;
	border-radius: 4px;
	margin-bottom: 0.25rem;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
	font-size: 0.85rem;
	max-width: 100%;
	overflow-x: auto;
	box-sizing: border-box;
`,ht=F.span`
	font-weight: 600;
	color: #007bff;
	min-width: 120px;
	flex-shrink: 0;
	@media (max-width: 768px) {
		min-width: 100px;
		font-size: 0.9rem;
	}
`,gt=F.span`
	color: #6c757d;
	word-break: break-word;
	overflow-wrap: break-word;
	flex: 1;
	min-width: 0;
`,ft=F.div`
	background: #e7f3ff;
	border-left: 3px solid #007bff;
	padding: 0.75rem;
	border-radius: 4px;
	font-size: 0.9rem;
	color: #004085;
	margin-top: 0.75rem;
	line-height: 1.6;
	white-space: pre-wrap;
	word-wrap: break-word;
	overflow-wrap: break-word;
	overflow-x: hidden;
	max-width: 100%;
	width: 100%;
	box-sizing: border-box;
`,xt=F.div`
	margin-top: 0.75rem;
	padding: 0.75rem;
	background: #d4edda;
	border-radius: 4px;
	border: 1px solid #c3e6cb;
	overflow-x: auto;
	max-width: 100%;
`,bt=F.div`
	font-weight: 600;
	color: #155724;
	margin-bottom: 0.5rem;
	font-size: 0.9rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
`,yt=F.button`
	background: transparent;
	border: 1px solid #155724;
	color: #155724;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	cursor: pointer;
	
	&:hover {
		background: #155724;
		color: white;
	}
`,jt=F.div`
	overflow-x: auto;
	max-width: 100%;
	width: 100%;
	box-sizing: border-box;
	margin-top: 0.75rem;
	padding: 1rem;
	background: white;
	border-radius: 4px;
	border: 1px solid #e5e7eb;
	font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
	font-size: 0.875rem;
	line-height: 1.6;
	max-height: 600px;
	overflow-y: auto;
	word-break: break-word;
`,wt=F.span`
	color: #dc2626; /* Red for keys - per user preference */
	font-weight: 600;
`,kt=F.span`
	color: #3b82f6; /* Blue for values - per user preference */
`,vt=F.span`
	color: #6b7280; /* Gray for punctuation */
`,St=F.div`
	display: grid;
	grid-template-columns: 1fr 1.5fr 1fr;
	gap: 1rem;
	margin-bottom: 2rem;
`,Ct=F.button`
	padding: 1rem;
	border: 2px solid ${e=>e.$active?"#0ea5e9":"#cbd5f5"};
	border-radius: 8px;
	background: ${e=>e.$active?"#0ea5e9":"#f1f5f9"};
	color: ${e=>e.$active?"#ffffff":"#334155"};
	font-weight: ${e=>e.$active?"700":"500"};
	box-shadow: ${e=>e.$active?"0 8px 16px rgba(14, 165, 233, 0.25)":"none"};
	cursor: pointer;
	transition: all 0.25s ease;

	&:hover {
		border-color: #0ea5e9;
		background: ${e=>e.$active?"#0284c7":"#e2e8f0"};
		color: ${e=>e.$active?"#ffffff":"#0f172a"};
	}

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.35);
	}
`,It=F.div`
	grid-column: 2;
	padding: 1rem;
	background: #e0f2fe;
	border-radius: 8px;
	color: #0f172a;
	font-weight: 600;
`,Tt=F.button`
	background: #28a745;
	color: white;
	border: none;
	padding: 1rem 2rem;
	border-radius: 8px;
	font-size: 1.1rem;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;
	margin-bottom: 2rem;
	
	&:hover:not(:disabled) {
		background: #218838;
	}
	
	&:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
`,Et=F.div`
	background: #fff3cd;
	border: 1px solid #ffeaa7;
	border-radius: 8px;
	padding: 1.75rem;
	margin-top: 2rem;
	margin-bottom: 2rem;
`,_t=F.h3`
	color: #856404;
	margin-bottom: 1rem;
	font-size: 1.2rem;
`,At=F.p`
	color: #856404;
	margin-bottom: 1rem;
`,Rt=F.button`
	background: #ffc107;
	color: #212529;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	
	&:hover {
		background: #e0a800;
	}
`,zt=F.div`
	display: flex;
	gap: 1rem;
	margin-top: 2rem;
	margin-bottom: 2rem;
`,Ot=F.button`
	background: #007bff;
	color: white;
	border: none;
	padding: 0.875rem 1.75rem;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	font-size: 0.95rem;
	
	&:hover:not(:disabled) {
		background: #0056b3;
	}
	
	&:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
`,Pt=F.button`
	background: #6c757d;
	color: white;
	border: none;
	padding: 0.875rem 1.75rem;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	font-size: 0.95rem;
	
	&:hover:not(:disabled) {
		background: #545b62;
	}
	
	&:disabled {
		background: #adb5bd;
		cursor: not-allowed;
	}
`,$t=(e,n=0)=>{if(null===e)return t.jsx(kt,{children:"null"});if("boolean"==typeof e)return t.jsx(kt,{children:String(e)});if("number"==typeof e)return t.jsx(kt,{children:String(e)});if("string"==typeof e)return t.jsxs(kt,{children:['"',e,'"']});if(Array.isArray(e))return 0===e.length?t.jsx(vt,{children:"[]"}):t.jsxs(t.Fragment,{children:[t.jsx(vt,{children:"["}),t.jsx("br",{}),e.map((i,o)=>t.jsxs(r.Fragment,{children:["  ".repeat(n+1),$t(i,n+1),o<e.length-1&&t.jsx(vt,{children:","}),t.jsx("br",{})]},o)),"  ".repeat(n),t.jsx(vt,{children:"]"})]});if("object"==typeof e){const i=Object.entries(e);return 0===i.length?t.jsx(vt,{}):t.jsxs(t.Fragment,{children:[t.jsx(vt,{children:"{"}),t.jsx("br",{}),i.map(([e,o],s)=>t.jsxs(r.Fragment,{children:["  ".repeat(n+1),t.jsxs(wt,{children:['"',e,'"']}),t.jsx(vt,{children:": "}),$t(o,n+1),s<i.length-1&&t.jsx(vt,{children:","}),t.jsx("br",{})]},e)),"  ".repeat(n),t.jsx(vt,{children:"}"})]})}return t.jsx("span",{children:String(e)})},Nt=()=>{const r=S(),[n,o]=e.useState(Vr),[s,a]=e.useState("redirect"),[l,d]=e.useState(!1),[m,u]=e.useState(!1),[p,h]=e.useState(!1),[g,f]=e.useState(!1),[x,b]=e.useState(Hr),[y,j]=e.useState(!1),[w,k]=e.useState({}),[v,T]=e.useState(!1),[E,_]=e.useState([]),[A,R]=e.useState(!1),[z,O]=e.useState(!1),[P,$]=e.useState(null),[N,D]=e.useState(""),[U,L]=e.useState(null),{branding:W,hasBranding:B,openDesignStudio:M}=Ur(),[F,J]=e.useState(null),[V,Q]=e.useState(null),[X,Z]=e.useState(null),[ee,re]=e.useState({environmentId:"",clientId:"",clientSecret:"",tokenEndpointAuthMethod:"client_secret_post"}),[ie,se]=e.useState(!1),[ae,le]=e.useState(!1),[me,ue]=e.useState(!1),je=e.useMemo(()=>{const e={title:"Kroger",subtitle:"Sign in to your Kroger account"};return W&&B?(W.modalTitle?.trim()?e.title=W.modalTitle.trim():W.wordmarkText?.trim()&&(e.title=W.wordmarkText.trim()),W.subtitleText?.trim()&&(e.subtitle=W.subtitleText.trim()),W.primaryColor&&(e.primaryColor=W.primaryColor),W.secondaryColor&&(e.secondaryColor=W.secondaryColor),W.headerBackgroundImage&&(e.headerBackgroundImage=W.headerBackgroundImage),W.logoUrl&&(e.logoUrl=W.logoUrl),W.wordmarkText?.trim()&&(e.logoText=W.wordmarkText.trim()),W.wordmarkColor&&(e.wordmarkColor=W.wordmarkColor),W.subtitleColor&&(e.subtitleColor=W.subtitleColor),W.logoBackgroundColor&&(e.logoBackgroundColor=W.logoBackgroundColor),W.logoBorderColor&&(e.logoBorderColor=W.logoBorderColor),W.contentBackground&&(e.contentBackground=W.contentBackground),W.contentTextColor&&(e.contentTextColor=W.contentTextColor),W.formAccentColor&&(e.formAccentColor=W.formAccentColor),e):e},[W,B]),[we,ke]=e.useState([]),[ve,Se]=e.useState(null);e.useEffect(()=>{try{const e=localStorage.getItem(Wr);if(e){const r=JSON.parse(e);o(e=>({...e,...r,responseType:r?.responseType||e.responseType||Vr.responseType,tokenEndpointAuthMethod:r?.tokenEndpointAuthMethod||e.tokenEndpointAuthMethod||Vr.tokenEndpointAuthMethod}))}}catch(e){}finally{f(!0)}},[]),e.useEffect(()=>{try{const e=localStorage.getItem(Jr);if(e){const r=JSON.parse(e);re({environmentId:r.environmentId||"",clientId:r.clientId||"",clientSecret:r.clientSecret||"",tokenEndpointAuthMethod:r.tokenEndpointAuthMethod||"client_secret_post"})}}catch(e){}finally{le(!0)}},[]),e.useEffect(()=>{if(ae)try{localStorage.setItem(Jr,JSON.stringify(ee))}catch(e){}},[ee,ae]),e.useEffect(()=>{if(g)try{localStorage.setItem(Wr,JSON.stringify(n))}catch(e){}},[n,g]),e.useEffect(()=>{try{const e=localStorage.getItem(qr);if(e){const r=JSON.parse(e);b({username:r.username??Hr.username,password:r.password??Hr.password,codeVerifier:r.codeVerifier??Hr.codeVerifier,codeChallenge:r.codeChallenge??Hr.codeChallenge})}}catch(e){}},[]),e.useEffect(()=>{try{localStorage.setItem(qr,JSON.stringify(x))}catch(e){}},[x]);const Ce=e.useCallback((e,r)=>{o(t=>({...t,[e]:r}))},[]),Ie=e.useMemo(()=>!!X&&("SERVICE"===X.type||!(!X.grantTypes||1!==X.grantTypes.length||!X.grantTypes.includes("client_credentials"))),[X]),Te=e.useCallback(e=>{o(r=>({...r,clientId:e.clientId,clientSecret:e.clientSecret||r.clientSecret,redirectUri:e.redirectUris?.[0]||r.redirectUri,scopes:e.scopes?.join(" ")||r.scopes,tokenEndpointAuthMethod:e.tokenEndpointAuthMethod||r.tokenEndpointAuthMethod})),Z(e),e.postLogoutRedirectUris;const r=e.postLogoutRedirectUris?.[0]?" (including logout URI)":"";ne.showSuccess(`Application "${e.name}" selected and credentials filled${r}`)},[]),Ee=e.useCallback(async()=>{if(ee.environmentId&&ee.clientId&&ee.clientSecret){u(!0);try{const e=await be({environmentId:ee.environmentId,clientId:ee.clientId,clientSecret:ee.clientSecret,tokenEndpointAuthMethod:ee.tokenEndpointAuthMethod});Q(e),ne.showSuccess("Worker token obtained! You can now select applications.")}catch(e){ne.showError(e instanceof Error?e.message:"Failed to get worker token")}finally{u(!1)}}else se(!0)},[ee]),_e=e.useCallback(async()=>{h(!0);try{localStorage.setItem(Wr,JSON.stringify(n)),ne.showSuccess("Credentials saved to storage")}catch(e){ne.showError("Failed to save credentials")}finally{h(!1)}},[n]),Ae=e.useMemo(()=>{const e=`https://${{us:"auth.pingone.com",eu:"auth.pingone.eu",ap:"auth.pingone.asia",ca:"auth.pingone.ca",na:"auth.pingone.com"}[n.region||"us"]||"auth.pingone.com"}/${n.environmentId}/as/authorize`,r=new URLSearchParams({response_type:n.responseType,client_id:n.clientId,scope:n.scopes,state:`pi-flow-${Date.now()}`});return"redirectless"===s?r.set("response_mode","pi.flow"):r.set("redirect_uri",n.redirectUri),`${e}?${r.toString()}`},[n.environmentId,n.clientId,n.responseType,n.redirectUri,n.scopes,s,n.region]),Re=e.useCallback(async()=>{if("code"===n.responseType){const{generateCodeVerifier:e,generateCodeChallenge:r}=await oe(async()=>{const{generateCodeVerifier:e,generateCodeChallenge:r}=await import("./utils-lzKqcxFi.js").then(e=>e.aV);return{generateCodeVerifier:e,generateCodeChallenge:r}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32])),t=e(),i=await r(t),o="pingone-authentication-redirect";te.savePKCECodes(o,{codeVerifier:t,codeChallenge:i,codeChallengeMethod:"S256"});return`${`https://auth.pingone.com/${n.environmentId}/as/authorize`}?${new URLSearchParams({response_type:n.responseType,client_id:n.clientId,redirect_uri:n.redirectUri,scope:n.scopes,state:`pi-flow-${Date.now()}`,code_challenge:i,code_challenge_method:"S256"}).toString()}`}return Ae},[n,Ae]),ze=e.useCallback(async e=>{const t=e||x;if(t.username&&t.password){d(!0),ke([]),Se(null);try{const e=n.environmentId.trim()||Vr.environmentId,s=`pi-flow-${Date.now()}`,{generateCodeVerifier:a,generateCodeChallenge:l}=await oe(async()=>{const{generateCodeVerifier:e,generateCodeChallenge:r}=await import("./utils-lzKqcxFi.js").then(e=>e.aV);return{generateCodeVerifier:e,generateCodeChallenge:r}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32])),d=a(),c=await l(d);b(e=>({...e,username:t.username,password:t.password,codeVerifier:d,codeChallenge:c}));const m="pingone-authentication-redirectless";te.savePKCECodes(m,{codeVerifier:d,codeChallenge:c,codeChallengeMethod:"S256"}),ne.showInfo("Starting PingOne authorization flow...");const u={environmentId:e,clientId:n.clientId.trim()||Vr.clientId,clientSecret:n.clientSecret.trim()||Vr.clientSecret,redirectUri:n.redirectUri.trim()||Vr.redirectUri,scopes:n.scopes.trim()||Vr.scopes,codeChallenge:c,codeChallengeMethod:"S256",state:s};ke(r=>[...r,{step:1,title:"Start Authorization Flow",method:"POST",url:`https://auth.pingone.com/${e}/as/authorize`,params:{response_type:"code",response_mode:"pi.flow",client_id:n.clientId.trim()||Vr.clientId,scope:n.scopes.trim()||Vr.scopes,code_challenge:`${c.substring(0,20)}...`,code_challenge_method:"S256",state:s},requestBody:u,note:"Step 1: POST /as/authorize with response_mode=pi.flow. NO username/password here. PingOne returns JSON flow object with flowId and status (e.g., USERNAME_PASSWORD_REQUIRED).\n\n💡 OPTIONAL: login_hint_token - You can optionally include a login_hint_token JWT parameter in this request. This is a signed JWT containing user identification (username, email, phone, sub) that helps PingOne identify the user. Since you've already authenticated the user in your app (Kroger login), including login_hint_token can help PingOne pre-populate user information and potentially streamline the flow.",timestamp:Date.now()}]);const p=await fetch("/api/pingone/redirectless/authorize",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(u)});if(!p.ok){let e={},r=`Authorization request failed (status ${p.status})`;try{if(e=await p.json(),r=e?.error_description||e?.message||e?.error||r,"dns_resolution_failed"===e?.error)r="Cannot reach PingOne servers. Please check your internet connection.";else if("connection_refused"===e?.error)r="PingOne servers are currently unavailable. Please try again later.";else if("request_timeout"===e?.error)r="PingOne servers are not responding. Please try again.";else if("invalid_response"===e?.error){const t=e?.details;r=`Invalid response from PingOne (${t?.contentType||"unknown format"}). The authorization server may be having issues.`}}catch(i){try{const t=await p.text();e={raw_response:t.substring(0,500)},(t.includes("<!doctype")||t.includes("<html"))&&(r="PingOne returned an HTML error page. This may indicate a server configuration issue. Check that your Environment ID and credentials are correct.")}catch{}}throw ke(t=>t.map((n,i)=>i===t.length-1?{...n,response:{error:!0,status:p.status,error_code:String(e?.error||"UNKNOWN_ERROR"),error_description:r},fullResponse:e,status:p.status}:n)),new Error(r)}const h=await p.json(),g=h.id,f=h.status,x=h._links,y=h._sessionId,j=h.resumeUrl;if(ke(e=>e.map((r,t)=>t===e.length-1?{...r,response:{flowId:g?`${g.substring(0,8)}...`:"N/A",status:String(f||"unknown"),hasResumeUrl:!!j},fullResponse:h,status:p.status}:r)),!g||"USERNAME_PASSWORD_REQUIRED"!==f)throw new Error(`Unexpected flow status: ${f||"unknown"}. Expected USERNAME_PASSWORD_REQUIRED.`);const w=x?.["usernamePassword.check"]?.href;if(!w)throw new Error("Flow object missing usernamePassword.check link");const k={flowUrl:w,username:t.username,password:t.password,sessionId:y},v={action:"usernamePassword.check",username:t.username,password:t.password};ke(e=>[...e,{step:2,title:"Present Login Form and Send Credentials to PingOne",method:"POST",url:w,params:{action:"usernamePassword.check",username:`${t.username.substring(0,3)}***`,password:"***"},requestBody:v,note:'Step 2: POST /flows/{flowId} with action: "usernamePassword.check". Credentials go ONLY to PingOne Flow API (over HTTPS). NEVER to /as/token or your backend. PingOne validates credentials and returns status (e.g., READY_TO_RESUME).\n\n📋 Required Headers:\n• Content-Type: application/vnd.pingidentity.usernamePassword.check+json (PingOne-specific media type)\n• Accept: application/json\n• Cookie: <session cookies from Step 1\'s /as/authorize response> - REQUIRED for stateful flows',timestamp:Date.now()}]);const S=await fetch("/api/pingone/flows/check-username-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(k)});if(!S.ok){const e=await S.json().catch(()=>({}));if(ke(r=>r.map((t,n)=>n===r.length-1?{...t,response:{error:!0,status:S.status,error_code:String(e?.code||e?.error||"UNKNOWN_ERROR"),error_description:e?.error_description||e?.message||`Flow execution failed (status ${S.status})`},fullResponse:e,status:S.status}:t)),401===S.status){const r=e?.error_description||e?.message||"Authentication failed - invalid credentials or flow expired";throw"INVALID_TOKEN"===e?.code||"INVALID_TOKEN"===e?.error?new Error("Invalid credentials - please check your username and password"):"ACCESS_FAILED"===e?.code||"ACCESS_FAILED"===e?.error?new Error("Access denied - invalid username or password"):new Error(r)}throw new Error(e?.error_description||`Flow execution failed (status ${S.status})`)}const C=await S.json(),I=C.resumeUrl,T=C.id||g;if(ke(e=>e.map((r,t)=>t===e.length-1?{...r,response:{flowId:T?`${T.substring(0,8)}...`:"N/A",status:String(C.status||"unknown"),hasResumeUrl:!!I},fullResponse:C,status:S.status}:r)),!I)throw new Error("Flow execution completed but no resumeUrl provided");let E=d;if(!E){const e="pingone-authentication-redirectless";let r=te.loadPKCECodes(e);r||(r=await te.loadPKCECodesAsync(e)),r?.codeVerifier&&(E=r.codeVerifier,b(e=>({...e,codeVerifier:E,codeChallenge:r.codeChallenge||e.codeChallenge})))}const _={resumeUrl:I,flowId:T,clientId:n.clientId.trim()||Vr.clientId,clientSecret:n.clientSecret.trim()||Vr.clientSecret,codeVerifier:E,flowState:s,sessionId:y},A=new URL(I),R={};A.searchParams.forEach((e,r)=>{R[r]=e}),E&&(R.code_verifier="***"),s&&(R.state=s),R.response_mode="pi.flow",ke(e=>[...e,{step:3,title:"Resume to Obtain Authorization Code",method:"GET",url:I,params:R,requestBody:{note:"Note: This is data sent to our backend proxy (POST /api/pingone/resume). The actual PingOne request is GET with query parameters only (no body).",proxyRequest:_},note:"Step 3: GET /as/resume?flowId={flowId}&response_mode=pi.flow&code_verifier=***&state=***. PingOne API requires GET (not POST) - all parameters are in the URL query string, not in a request body. PingOne returns authorization code in JSON (with response_mode=pi.flow) or redirect Location header. Extract code and state.",timestamp:Date.now()}]);const z=await fetch("/api/pingone/resume",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(_)});if(!z.ok){const e=await z.json().catch(()=>({}));if(ke(r=>r.map((t,n)=>n===r.length-1?{...t,response:{error:!0,status:z.status,error_code:e?.error_code||e?.error||"UNKNOWN_ERROR",error_description:e?.error_description||e?.error||`Resume flow failed (status ${z.status})`,pingone_error:e?.pingone_error||null,location:e?.location?`${e.location.substring(0,100)}...`:"N/A"},fullResponse:e,status:z.status}:t)),e?.pingone_error){const r=e.pingone_error,t=r.code||e.error_code||"UNKNOWN_ERROR",n=r.message||r.error_description||e.error_description||"Unknown error from PingOne";throw new Error(`PingOne Resume Error (${t}): ${n}`)}throw new Error(e?.error_description||e?.error||`Resume flow failed (status ${z.status})`)}const O=await z.json();ke(e=>e.map((r,t)=>t===e.length-1?{...r,response:{status:"Received",hasCode:!(!O.code||null===O.code),hasLocation:!!O.location,isRedirect:!!O.redirect,keys:Object.keys(O).join(", ")},fullResponse:O,status:z.status}:r));const P=!0===O.redirect||"true"===O.redirect,$=O.location,N=O;JSON.stringify(O,null,2);let D,U;if(O.code&&"string"==typeof O.code&&"null"!==O.code)D=O.code;else if(N.authorizeResponse?.code&&"string"==typeof N.authorizeResponse.code)D=N.authorizeResponse.code;else if(P&&$)try{let r;try{r=new URL($)}catch{const t=new URL(I||`https://auth.pingone.com/${e}/as/resume`);r=new URL($,t.origin+t.pathname)}const t=r.searchParams.get("code");t&&(D=t)}catch(o){const e=$.match(/[?&]code=([^&'"<>#\s]+)/);e?.[1]&&(D=decodeURIComponent(e[1]))}else N.flow&&"string"==typeof N.flow.code?D=N.flow.code:O.authorization_code&&"string"==typeof O.authorization_code?D=O.authorization_code:O.authCode&&"string"==typeof O.authCode?D=O.authCode:O.result&&"object"==typeof O.result&&"string"==typeof O.result.code?D=O.result.code:O.data&&"object"==typeof O.data&&"string"==typeof O.data.code?D=O.data.code:"string"==typeof O?D=O:O.access_token||O.id_token;if(!D){ke(e=>e.map((r,t)=>t===e.length-1?{...r,response:{code:"Not found",error:"No authorization code in response",redirect:P?"Yes":"No",location:$?`${$.substring(0,200)}...`:"N/A",hasCodeParam:!!$&&$.includes("code=")},fullResponse:O,status:z.status}:r));JSON.stringify(O,null,2);let e="Resume flow completed but no authorization code provided.";throw P&&$?(e+=` Redirect Location URL: ${$.substring(0,200)}`,$.includes("code=")||(e+=" Location URL does not contain a code parameter.")):P||(e+=" PingOne did not redirect and no code was returned in JSON response."),new Error(e)}if(P&&$)try{U=new URL($).searchParams.get("state")||void 0}catch{const e=$.match(/[?&]state=([^&]+)/);e?.[1]&&(U=decodeURIComponent(e[1]))}const L=U||O.state||N.state||N.authorizeResponse?.state;ke(e=>e.map((r,t)=>t===e.length-1?{...r,response:{code:D?`${D.substring(0,20)}...`:"Not found",state:L||"N/A",redirect:P?"Yes":"No",location:$?`${$.substring(0,100)}...`:"N/A"},fullResponse:O,status:z.status}:r));let W=d;if(!W){const e="pingone-authentication-redirectless";let r=te.loadPKCECodes(e);r||(r=await te.loadPKCECodesAsync(e)),r?.codeVerifier&&(W=r.codeVerifier)}const B={grant_type:"authorization_code",code:D,client_id:n.clientId.trim()||Vr.clientId,client_secret:n.clientSecret.trim()||Vr.clientSecret,code_verifier:W,redirect_uri:n.redirectUri.trim()||Vr.redirectUri,scope:n.scopes.trim()||Vr.scopes,environment_id:e,token_endpoint_auth_method:n.tokenEndpointAuthMethod||"client_secret_post"};ke(r=>[...r,{step:4,title:"Backend Exchanges Code for Tokens",method:"POST",url:`https://auth.pingone.com/${e}/as/token`,params:{grant_type:"authorization_code",code:`${D.substring(0,20)}...`,client_id:n.clientId.trim()||Vr.clientId,code_verifier:"***",scope:n.scopes.trim()||Vr.scopes},requestBody:B,note:"Step 4: POST /as/token to retrieve tokens. NO username/password here - only code, client_id, code_verifier. Your backend calls this - credentials were only sent to PingOne Flow API in Step 2.",timestamp:Date.now()}]);const M=await fetch("/api/token-exchange",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(B)});if(!M.ok){const e=await M.json().catch(()=>({}));throw new Error(e?.error_description||`Token exchange failed (status ${M.status})`)}const F=await M.json(),q=F.access_token,V=F.id_token,H=F.refresh_token;ke(e=>e.map((r,t)=>t===e.length-1?{...r,response:{access_token:q?"received":"N/A",id_token:V?"received":"N/A",refresh_token:H?"received":"N/A"},fullResponse:F,status:M.status}:r));const G={};q&&(G.access_token=q),V&&(G.id_token=V),H&&(G.refresh_token=H),J(G);const Y={timestamp:Date.now(),mode:"redirectless",responseType:n.responseType,tokens:G,config:n,authUrl:`https://auth.pingone.com/${e}/as/authorize`,context:{isRedirectless:!0,redirectlessUsername:t.username,resumeUrl:I,flowId:T}};localStorage.setItem(Br,JSON.stringify(Y)),ne.showSuccess("Redirectless authentication successful! Redirecting to MFA device selection..."),localStorage.setItem("mfa_unified_username",t.username),localStorage.setItem("mfa_pingone_user_token",q||""),localStorage.setItem("mfa_environment_id",e),r("/v8/mfa-registration?flow=authentication&username="+encodeURIComponent(t.username))}catch(s){ne.showError(s instanceof Error?s.message:"Redirectless login failed unexpectedly.")}finally{d(!1)}}else ne.showError("Please complete Kroger login first")},[n,r,x]),Oe=e.useCallback(async e=>{if(!l)if(b(r=>({...r,username:e.username,password:e.password})),Se(null),ke([{step:0,title:"Kroger Login - Collect Credentials",method:"UI",url:"N/A (UI Interaction)",params:{username:`${e.username.substring(0,3)}***`,password:"***",status:"credentials collected"},note:"Preparation: User authenticates in our app (Kroger login). This is separate from PingOne authentication. Once authenticated, we proceed to the 4-step PingOne redirectless flow (pi.flow).",timestamp:Date.now()}]),e.username?.trim()&&e.password?.trim()){if(!n.environmentId?.trim()||!n.clientId?.trim()||!n.clientSecret?.trim())return ne.showError("Please configure Environment ID, Client ID, and Client Secret first"),void j(!1);ne.showInfo("Starting PingOne authentication with collected credentials...");try{await ze({username:e.username,password:e.password}),j(!1)}catch(r){throw ne.showError(r instanceof Error?r.message:"Failed to start authentication flow"),r}}else ne.showError("Please enter both username and password")},[l,ze,n]),Pe=e.useCallback(()=>{ke([]),Se(null),b(Hr),j(!1),d(!1),O(!1),$(""),_([]),T(!1),R(!1),L(null),D(""),ne.showInfo("Flow reset. Ready to start over.")},[]),$e=e.useCallback(async()=>{if(l)return;const{missingFields:e,canProceed:r}=fe.checkMissingFields(n,{requiredFields:["environmentId","clientId","clientSecret"],fieldLabels:{environmentId:"Environment ID",clientId:"Client ID",clientSecret:"Client Secret"}});if(!r)return _(e),void T(!0);if("redirect"===s){d(!0);try{const e=await Re();try{new URL(e)}catch(t){throw new Error("Invalid authorization URL generated")}const r=he.validateAuthorizationUrl(e,{flowType:"authorization-code",requireState:!0,requireNonce:!1,requirePkce:!0});if(!r.isValid)return L(r),D(e),R(!0),void d(!1);sessionStorage.setItem(Fr,JSON.stringify({environmentId:n.environmentId,clientId:n.clientId,responseType:n.responseType,returnPath:"/pingone-authentication/result",timestamp:Date.now(),mode:"redirect"})),sessionStorage.removeItem("pingone_redirectless_flow_context"),$(e),O(!0),d(!1)}catch(i){ne.showError("Failed to start redirect flow. Please try again."),d(!1)}}if("redirectless"===s){try{sessionStorage.removeItem(Fr),sessionStorage.removeItem(Mr)}catch(i){}ne.showInfo("Starting redirectless authentication with PingOne…"),ze()}},[n,n.responseType,l,s,ze,Re]),Ne=e.useCallback(()=>{R(!1),N&&(ne.showSuccess("Redirecting to PingOne for authentication..."),setTimeout(()=>{window.location.href=N},1e3))},[N]),De=e.useCallback(()=>{R(!1),d(!1),ne.showInfo("Please fix the configuration issues and try again.")},[]),Ue=e.useCallback(()=>{O(!1),ne.showSuccess("Redirecting to PingOne for authentication..."),setTimeout(()=>{P&&(window.location.href=P)},500)},[P]),Le=e.useCallback(()=>{O(!1),$(""),ne.showInfo("Authentication cancelled")},[]);return e.useEffect(()=>{window.scrollTo(0,0)},[]),t.jsxs(Yr,{children:[t.jsx(G,{flowType:"pingone",customConfig:{flowType:"pingone",title:"PingOne Authentication Playground – Authorization Code Flow",subtitle:"Test PingOne authentication flows with redirect and redirectless modes"}}),t.jsxs(Kr,{children:[t.jsxs(Xr,{children:[t.jsx("strong",{children:"Authorization Code Flow:"})," Uses PKCE for enhanced security. After authentication, PingOne redirects to ",t.jsx("code",{children:"https://localhost:3000/p1auth-callback"}),"where we capture the authorization code and exchange it for tokens.",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"Note:"})," This flow requires username/password input and will not return tokens immediately. The authorization code must be exchanged for tokens in a separate step."]}),t.jsx(Qr,{children:"Choose Your Destiny"}),t.jsxs(St,{children:[t.jsx(Ct,{$active:"redirect"===s,onClick:()=>a("redirect"),children:"Redirect Flow"}),t.jsx(It,{children:"redirect"===s?"Opens PingOne login in a popup window. After authentication, redirects back to our callback URL where we capture tokens.":"Uses PingOne's redirectless flow to authenticate without redirects. Tokens are returned directly to the application."}),t.jsx(Ct,{$active:"redirectless"===s,onClick:()=>a("redirectless"),children:"Redirectless Flow"})]}),t.jsx(Qr,{children:"Configuration"}),t.jsxs(de,{title:"PingOne Application Picker",subtitle:"Auto-fill configuration from your PingOne environment",defaultCollapsed:!0,icon:t.jsx(C,{}),theme:"orange",children:[V?t.jsx("div",{style:{padding:"1rem",backgroundColor:"#d4edda",borderRadius:"6px",border:"1px solid #c3e6cb",marginBottom:"1rem"},children:t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"0.5rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",color:"#155724",fontWeight:"500"},children:[t.jsx(c,{size:16}),"Worker token obtained! You can now select applications below."]}),t.jsx("button",{onClick:()=>Q(null),style:{background:"#dc3545",color:"white",border:"none",padding:"0.5rem 1rem",borderRadius:"4px",fontWeight:"500",cursor:"pointer",fontSize:"0.875rem"},children:"Clear Token"})]})}):t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:{padding:"1rem",backgroundColor:"#f8f9fa",borderRadius:"6px",border:"1px solid #e9ecef",marginBottom:"1rem"},children:[t.jsxs("p",{style:{margin:"0 0 1rem 0",fontSize:"0.9rem",color:"#495057"},children:[t.jsx("strong",{children:"🔧 How it works:"})," Get a worker token using the Client Credentials grant (no redirect URI or response type needed). Then select an application from your PingOne environment to auto-fill all configuration fields."]}),ee.environmentId&&ee.clientId&&t.jsx("p",{style:{margin:"0",fontSize:"0.85rem",color:"#28a745",fontWeight:"500"},children:"✓ Worker credentials saved"})]}),t.jsx("button",{onClick:Ee,disabled:m,style:{background:"#007bff",color:"white",border:"none",padding:"0.75rem 1.5rem",borderRadius:"6px",fontWeight:"600",cursor:m?"not-allowed":"pointer",opacity:m?.6:1,marginBottom:"1rem"},children:m?"Getting Worker Token...":"Get Worker Token"})]}),t.jsx(Y,{environmentId:ee.environmentId,clientId:ee.clientId,clientSecret:ee.clientSecret,workerToken:V||void 0,onApplicationSelect:Te,disabled:l||!ee.environmentId||!V})]}),t.jsxs(Zr,{children:[t.jsx(et,{children:"Environment ID"}),t.jsx(rt,{type:"text",value:n.environmentId,onChange:e=>Ce("environmentId",e.target.value),placeholder:"Enter your PingOne environment ID",autoComplete:"off"})]}),t.jsxs(Zr,{children:[t.jsx(et,{children:"Client ID"}),t.jsx(rt,{type:"text",value:n.clientId,onChange:e=>Ce("clientId",e.target.value),placeholder:"Enter your PingOne client ID",autoComplete:"username"})]}),t.jsxs(Zr,{children:[t.jsx(et,{children:"Client Secret"}),t.jsx(rt,{type:"password",value:n.clientSecret,onChange:e=>Ce("clientSecret",e.target.value),placeholder:"Enter your PingOne client secret",autoComplete:"current-password"})]}),Ie?t.jsxs(Zr,{children:[t.jsx(et,{children:"Redirect URI"}),t.jsxs("div",{style:{padding:"0.75rem",backgroundColor:"#fff3cd",border:"1px solid #ffc107",borderRadius:"0.375rem",color:"#856404",fontSize:"0.9rem"},children:[t.jsx("strong",{children:"ℹ️ Not Applicable for Client Credentials Flow"}),t.jsx("br",{}),"The Client Credentials flow does not use ",t.jsx("code",{children:"redirect_uri"}),"."]})]}):t.jsxs(Zr,{children:[t.jsx(et,{children:"Redirect URI"}),t.jsx(rt,{type:"text",value:n.redirectUri,onChange:e=>Ce("redirectUri",e.target.value),placeholder:"Enter your redirect URI",autoComplete:"url"}),t.jsxs("div",{style:{fontSize:"0.85rem",color:"#666",marginTop:"0.5rem",padding:"0.75rem",backgroundColor:"#f8f9fa",borderRadius:"0.375rem",border:"1px solid #e9ecef"},children:[t.jsx("strong",{children:"🔧 PingOne Configuration Required:"}),t.jsx("br",{}),t.jsx("strong",{children:"Redirect URI:"})," ",t.jsx("code",{children:n.redirectUri}),t.jsx("br",{}),t.jsx("strong",{children:"Post-Logout Redirect URI:"})," ",t.jsx("code",{children:H.getCallbackUri("p1authLogoutCallback")}),t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"Steps to configure in PingOne:"}),t.jsx("br",{}),"1. Go to your PingOne application settings",t.jsx("br",{}),"2. Add ",t.jsx("code",{children:n.redirectUri})," to ",t.jsx("strong",{children:"Redirect URIs"}),t.jsx("br",{}),"3. Add ",t.jsx("code",{children:H.getCallbackUri("p1authLogoutCallback")})," to"," ",t.jsx("strong",{children:"Post-Logout Redirect URIs"}),t.jsx("br",{}),"4. Ensure your application supports ",t.jsx("strong",{children:"Authorization Code"})," grant type",t.jsx("br",{}),"5. Make sure ",t.jsx("strong",{children:"PKCE"})," is enabled for enhanced security",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"💡 Pro Tip:"})," Use the ",t.jsx("strong",{children:"PingOne Application Picker"})," above to automatically fill these URIs from an existing application!"]})]}),t.jsxs(Zr,{children:[t.jsx(et,{children:"Scopes"}),t.jsx(rt,{type:"text",value:n.scopes,onChange:e=>Ce("scopes",e.target.value),placeholder:"e.g., openid profile email",autoComplete:"off"})]}),Ie?t.jsxs(Zr,{children:[t.jsx(et,{children:"Response Type"}),t.jsxs("div",{style:{padding:"0.75rem",backgroundColor:"#fff3cd",borderRadius:"0.375rem",border:"1px solid #ffc107",fontSize:"0.9rem",color:"#856404"},children:[t.jsx("strong",{children:"ℹ️ Not Applicable for Client Credentials Flow"}),t.jsx("br",{}),"The Client Credentials flow does not use a ",t.jsx("code",{children:"response_type"})," parameter. This flow goes directly to the token endpoint with"," ",t.jsx("code",{children:"grant_type=client_credentials"}),"and does not involve the authorization endpoint or user interaction."]})]}):t.jsxs(Zr,{children:[t.jsx(et,{children:"Response Type"}),t.jsxs(tt,{value:n.responseType,onChange:e=>Ce("responseType",e.target.value),children:[t.jsx("option",{value:"code",children:"code (Authorization Code)"}),t.jsx("option",{value:"token",children:"token (Implicit)"}),t.jsx("option",{value:"id_token",children:"id_token (Implicit)"}),t.jsx("option",{value:"code id_token",children:"code id_token (Hybrid)"}),t.jsx("option",{value:"code token",children:"code token (Hybrid)"}),t.jsx("option",{value:"code id_token token",children:"code id_token token (Hybrid)"})]}),t.jsxs("div",{style:{fontSize:"0.85rem",color:"#666",marginTop:"0.5rem",padding:"0.75rem",backgroundColor:"#f8f9fa",borderRadius:"0.375rem",border:"1px solid #e9ecef"},children:[t.jsx("strong",{children:"⚠️ Response Type Compatibility:"}),t.jsx("br",{}),"• ",t.jsx("strong",{children:"code"}),": Most compatible, works with all PingOne applications",t.jsx("br",{}),"• ",t.jsx("strong",{children:"Hybrid flows"})," (code id_token, code token): Require PingOne application to support hybrid response types",t.jsx("br",{}),"• ",t.jsx("strong",{children:"Implicit flows"})," (token, id_token): Legacy, not recommended for new applications",t.jsx("br",{}),t.jsx("br",{}),t.jsx("em",{children:'If you get "unsupported_response_type" errors, try using "code" instead.'})]})]}),t.jsxs(Zr,{children:[t.jsxs(et,{style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:["Token Endpoint Authentication Method",t.jsx("button",{type:"button",onClick:()=>ue(!0),style:{background:"none",border:"none",cursor:"pointer",color:"#3b82f6",display:"flex",alignItems:"center",padding:"0.25rem",borderRadius:"0.25rem",transition:"all 0.2s"},onMouseEnter:e=>{e.currentTarget.style.background="#eff6ff"},onMouseLeave:e=>{e.currentTarget.style.background="none"},title:"Learn about authentication methods",children:t.jsx(i,{size:18})})]}),t.jsx(tt,{value:n.tokenEndpointAuthMethod,onChange:e=>Ce("tokenEndpointAuthMethod",e.target.value),children:Gr.map(e=>t.jsx("option",{value:e.value,children:e.label},e.value))}),t.jsx("p",{style:{fontSize:"0.9rem",color:"#666",marginTop:"0.5rem"},children:Gr.find(e=>e.value===n.tokenEndpointAuthMethod)?.description})]}),t.jsxs(zt,{children:[t.jsx(Ot,{onClick:_e,disabled:p,children:p?"Saving...":"Save Configuration"}),t.jsx(Pt,{onClick:()=>window.history.back(),children:"Cancel"})]}),"redirect"===s&&t.jsx(Tt,{onClick:$e,disabled:l,children:l?"Processing...":"Launch Redirect Flow"}),"redirectless"===s&&t.jsxs(Et,{children:[t.jsx(_t,{children:"Kroger Grocery Login"}),t.jsx(At,{children:"For redirectless flow testing, start by logging into your Kroger account. After successful login, the authorization code flow will begin automatically."}),t.jsxs("div",{style:{display:"flex",gap:"1rem",flexWrap:"wrap"},children:[t.jsx(Rt,{onClick:()=>j(!0),disabled:l,children:l?"Processing...":"Start Kroger Login"}),(we.length>0||ve||l)&&t.jsx(Rt,{onClick:Pe,disabled:l,style:{background:"linear-gradient(135deg, #dc3545 0%, #c82333 100%)",border:"none"},children:"🔄 Start Over"})]})]}),t.jsx(q,{url:Ae,label:"Authorization URL",showOpenButton:!0})]}),"redirectless"===s&&t.jsxs(t.Fragment,{children:[t.jsx(Kr,{children:t.jsx(de,{title:"PingOne pi.flow — Required Headers & Content-Types",icon:t.jsx(I,{}),theme:"yellow",defaultCollapsed:!1,children:t.jsxs("div",{style:{padding:"1rem 0"},children:[t.jsx("p",{style:{marginBottom:"1rem"},children:t.jsxs("strong",{children:["Must-have headers on Flow API action calls (POST /","{envId}","/flows/","{flowId}","):"]})}),t.jsxs("ul",{style:{marginBottom:"1rem",paddingLeft:"1.5rem"},children:[t.jsxs("li",{style:{marginBottom:"0.75rem"},children:[t.jsx("strong",{children:"Content-Type:"}),t.jsxs("ul",{style:{marginTop:"0.5rem",marginLeft:"1.5rem",listStyle:"disc"},children:[t.jsxs("li",{children:[t.jsx("code",{children:"application/vnd.pingidentity.usernamePassword.check+json"})," for username/password checks"]}),t.jsxs("li",{children:[t.jsx("code",{children:"application/vnd.pingidentity.otp.check+json"})," for OTP checks (email/SMS/app OTP)"]})]}),t.jsxs("div",{style:{marginTop:"0.5rem",fontSize:"0.9rem",fontStyle:"italic",color:"#856404"},children:["⚠️ These are PingOne-specific vendor media types, NOT standard"," ",t.jsx("code",{children:"application/json"})]})]}),t.jsxs("li",{style:{marginBottom:"0.75rem"},children:[t.jsx("strong",{children:"Accept:"})," ",t.jsx("code",{children:"application/json"})," (typical)"]}),t.jsxs("li",{style:{marginBottom:"0.75rem"},children:[t.jsx("strong",{children:"Cookie:"})," Session cookies from the initial"," ",t.jsx("code",{children:"/as/authorize"})," call ",t.jsx("strong",{children:"MUST be sent"}),t.jsxs("ul",{style:{marginTop:"0.5rem",marginLeft:"1.5rem",listStyle:"disc"},children:[t.jsxs("li",{children:["Flow API is ",t.jsx("strong",{children:"stateful per flowId/session"})," - cookies maintain the session state"]}),t.jsxs("li",{children:["Use ",t.jsx("code",{children:"credentials: 'include'"})," in fetch, or manually forward Set-Cookie headers"]}),t.jsxs("li",{children:["The flowId in the URL alone is ",t.jsx("strong",{children:"not sufficient"})," - you need both flowId AND cookies"]})]})]})]}),t.jsxs("p",{style:{marginTop:"1rem",padding:"0.75rem",backgroundColor:"#fff3cd",borderRadius:"4px",border:"1px solid #ffc107"},children:[t.jsx("strong",{children:"Important:"})," Cookies/session from the initial"," ",t.jsx("code",{children:"/as/authorize"})," call are captured in Step 1 and automatically forwarded to Step 2. If cookies are missing, the Flow API will reject the request as the flow session cannot be maintained."]}),t.jsxs("p",{style:{marginTop:"0.75rem",fontStyle:"italic",color:"#664d03"},children:["📚 ",t.jsx("strong",{children:"Reference:"})," See"," ",t.jsx("a",{href:"https://apidocs.pingidentity.com/pingone/auth/v1/api/#flows",target:"_blank",rel:"noopener noreferrer",style:{color:"#0066cc",textDecoration:"underline"},children:"PingOne Flow API Documentation"})," ","for complete header requirements."]})]})})}),t.jsx(Kr,{children:t.jsx(de,{title:"About login_hint_token in Redirectless Flows",icon:t.jsx(I,{}),theme:"green",defaultCollapsed:!0,children:t.jsxs("div",{style:{padding:"1rem 0"},children:[t.jsxs("p",{style:{marginBottom:"0.75rem"},children:[t.jsx("strong",{children:"What is login_hint_token?"}),t.jsx("br",{}),"The ",t.jsx("code",{children:"login_hint_token"})," is an optional signed JWT that you can include in Step 1's authorization request to help PingOne identify the user. Since you've already authenticated the user in your app (via Kroger login), this token can pre-populate user information in PingOne's authentication flow."]}),t.jsx("p",{style:{marginTop:"0.75rem",marginBottom:"0.5rem"},children:t.jsx("strong",{children:"When to Use It:"})}),t.jsxs("ul",{style:{marginBottom:"0.75rem",paddingLeft:"1.5rem"},children:[t.jsxs("li",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Pre-authenticated users:"})," When the user has already logged into your application (like Kroger login), you can include their identity in the token"]}),t.jsxs("li",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Improved UX:"})," Helps PingOne skip unnecessary steps or pre-fill forms"]}),t.jsxs("li",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Integration scenarios:"})," Useful when integrating PingOne with existing authentication systems (like PingFederate)"]}),t.jsxs("li",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"MFA-only flows:"})," When another system handles initial authentication and PingOne only needs to handle MFA"]})]}),t.jsxs("p",{style:{marginTop:"0.75rem",marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Token Structure:"}),t.jsx("br",{}),"The JWT contains user identification claims such as:",t.jsx("code",{children:"username"}),", ",t.jsx("code",{children:"email"}),", ",t.jsx("code",{children:"phone"}),", or ",t.jsx("code",{children:"sub"})," ","(subject identifier). The token must be signed with RS256 or ES256 using a key that PingOne can verify."]}),t.jsxs("p",{style:{marginTop:"0.75rem",marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"In This Flow:"}),t.jsx("br",{}),"You ",t.jsx("strong",{children:"can optionally"})," add ",t.jsx("code",{children:"login_hint_token"})," to Step 1's POST request to ",t.jsx("code",{children:"/as/authorize"}),". If included, PingOne may use it to identify the user and potentially streamline the authentication process. For this redirectless flow demonstration, we're not including it, but you can add it in production if your application has already authenticated the user."]}),t.jsxs("p",{style:{marginTop:"0.75rem",fontStyle:"italic",color:"#664d03"},children:["📚 ",t.jsx("strong",{children:"Documentation:"})," See"," ",t.jsx("a",{href:"https://apidocs.pingidentity.com/pingone/auth/v1/api/#create-a-login_hint_token-jwt",target:"_blank",rel:"noopener noreferrer",style:{color:"#0066cc",textDecoration:"underline"},children:"PingOne API Docs"})," ","for details on creating login_hint_token JWTs."]})]})})})]}),t.jsx(K,{isOpen:y,onClose:()=>j(!1),onLogin:Oe,overrides:je,onOpenDavinciStudio:M}),t.jsx(xe,{isOpen:v,onClose:()=>T(!1),title:"Credentials required",description:E.length>0?`Please provide the following required credential${E.length>1?"s":""} before continuing:`:"Environment ID, Client ID, and Client Secret are required before launching the flow.",actions:[{label:"Back to configuration",onClick:()=>T(!1),variant:"primary"}],children:E.length>0&&t.jsx("ul",{style:{marginTop:"1rem",marginBottom:"1rem",paddingLeft:"1.5rem"},children:E.map(e=>t.jsx("li",{style:{marginBottom:"0.5rem",fontWeight:600},children:e},e))})}),t.jsxs(xe,{isOpen:ie,onClose:()=>se(!1),title:"Worker Token Credentials",description:"Provide credentials for a worker application to access PingOne APIs and list applications. These credentials use the Client Credentials grant (no redirect URI or response type needed).",actions:[{label:"Cancel",onClick:()=>se(!1),variant:"secondary"},{label:"Save & Get Token",onClick:()=>{ee.environmentId&&ee.clientId&&ee.clientSecret?(se(!1),setTimeout(()=>{Ee()},100)):ne.showError("Please provide all required credentials")},variant:"primary"}],children:[t.jsxs(Zr,{style:{marginTop:"1rem"},children:[t.jsx(et,{children:"Worker Environment ID *"}),t.jsx(rt,{type:"text",value:ee.environmentId,onChange:e=>re({...ee,environmentId:e.target.value}),placeholder:"Enter worker environment ID",autoComplete:"off"})]}),t.jsxs(Zr,{children:[t.jsx(et,{children:"Worker Client ID *"}),t.jsx(rt,{type:"text",value:ee.clientId,onChange:e=>re({...ee,clientId:e.target.value}),placeholder:"Enter worker client ID",autoComplete:"username"})]}),t.jsxs(Zr,{children:[t.jsx(et,{children:"Worker Client Secret *"}),t.jsx(rt,{type:"password",value:ee.clientSecret,onChange:e=>re({...ee,clientSecret:e.target.value}),placeholder:"Enter worker client secret",autoComplete:"current-password"})]})]}),t.jsx(pe,{isOpen:A,onClose:()=>R(!1),validationResult:U,authUrl:N,onProceed:Ne,onFix:De}),ge.showModal(z,Le,Ue,P||"","oauth","PingOne Authentication Playground",{description:"You're about to be redirected to PingOne for OAuth 2.0 authentication. This uses the Authorization Code Flow with PKCE for enhanced security. Take time to review the authorization URL and its parameters.",redirectMode:"redirect"}),we.length>0&&t.jsxs(nt,{children:[t.jsx(it,{children:"📋 pi.flow Request/Response Log"}),we.map(e=>t.jsxs(ot,{$status:e.status||0,children:[t.jsxs(st,{children:[t.jsx(at,{$status:e.status||0,children:e.step}),t.jsx(lt,{children:e.title}),t.jsx(dt,{$method:e.method,children:e.method}),e.status&&t.jsx(ct,{$status:e.status||0,children:e.status})]}),t.jsx(mt,{children:e.url}),Object.keys(e.params).length>0&&t.jsx(ut,{children:Object.entries(e.params).map(([e,r])=>t.jsxs(pt,{children:[t.jsxs(ht,{children:[e,":"]}),t.jsx(gt,{children:r})]},e))}),e.requestBody&&t.jsxs(xt,{children:[t.jsxs(bt,{children:[t.jsx("span",{children:"Request Body:"}),t.jsxs(yt,{onClick:()=>{k(r=>({...r,[`request-${e.timestamp}`]:!r[`request-${e.timestamp}`]}))},children:[w[`request-${e.timestamp}`]?"Hide":"Show"," Request Body"]})]}),w[`request-${e.timestamp}`]&&t.jsx(jt,{children:$t(e.requestBody)})]}),t.jsx(ft,{children:e.note}),e.response&&t.jsxs(xt,{children:[t.jsxs(bt,{children:[t.jsx("span",{children:"Response Summary:"}),e.fullResponse&&t.jsxs(yt,{onClick:()=>{k(r=>({...r,[e.timestamp]:!r[e.timestamp]}))},children:[w[e.timestamp]?"Hide":"Show"," Full Response"]})]}),Object.entries(e.response).map(([e,r])=>{const n=e.includes("error")||"error_code"===e||"error_description"===e;return t.jsxs(pt,{children:[t.jsxs(ht,{style:n?{color:"#dc3545",fontWeight:600}:{},children:[e,":"]}),t.jsx(gt,{style:n?{color:"#dc3545",fontWeight:600}:{},children:String(r)})]},e)}),e.fullResponse&&w[e.timestamp]&&t.jsx(jt,{children:$t(e.fullResponse)})]})]},e.timestamp))]}),F&&t.jsxs(Kr,{children:[t.jsx(Qr,{children:"Latest Tokens"}),ce.showTokens(F,n.scopes.includes("openid")?"oidc":"oauth","pingone-authentication",{showCopyButtons:!0,showDecodeButtons:!0})]}),t.jsx(ye,{isOpen:me,onClose:()=>ue(!1)})]})},Dt=F.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background: radial-gradient(circle at top left, #fde68a 0%, transparent 55%),
    rgba(15, 23, 42, 0.95);
  color: #f8fafc;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`,Ut=F.section`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 64, 175, 0.85));
  border-radius: 20px;
  padding: 2rem;
  max-width: 640px;
  width: 100%;
  text-align: center;
  box-shadow: 0 35px 80px -30px rgba(14, 116, 144, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
`,Lt=F.h1`
  font-size: 2rem;
  margin-bottom: 0.75rem;
`,Wt=F.p`
  font-size: 1rem;
  color: rgba(226, 232, 240, 0.85);
  line-height: 1.6;
  margin: 0 auto 1.5rem;
`,Bt=F.pre`
  background: rgba(15, 23, 42, 0.7);
  border-radius: 16px;
  padding: 1.25rem;
  font-family: 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.9);
  word-break: break-word;
  white-space: pre-wrap;
  border: 1px solid rgba(56, 189, 248, 0.3);
`,Mt=F.button`
  margin-top: 1.5rem;
  border-radius: 14px;
  padding: 0.85rem 1.4rem;
  border: none;
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.95), rgba(59, 130, 246, 0.95));
  color: #f8fafc;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 30px 55px -20px rgba(56, 189, 248, 0.75);
  }
`,Ft=(e,r=!1)=>{if(!e)return{};const t=r&&e.startsWith("#")?e.slice(1):e,n=new URLSearchParams(t),i={};return n.forEach((e,r)=>{i[r]=e}),i},qt=()=>{const r=S(),n=T(),[i,o]=e.useState({}),[s,a]=e.useState(!0),[l,d]=e.useState(null),c=e.useRef(!1),m=async(e,r)=>{const t="pingone-authentication-redirect";let n=te.loadPKCECodes(t);n||(n=await te.loadPKCECodesAsync(t));const i=n?.codeVerifier||sessionStorage.getItem("pkce_code_verifier");if(!i)throw new Error("PKCE code verifier not found. Please restart the flow.");const o=`https://auth.pingone.com/${u.environmentId}/as/token`,s={grant_type:"authorization_code",code:e,redirect_uri:u.redirectUri,client_id:u.clientId,client_secret:u.clientSecret,code_verifier:i,scope:u.scopes||Vr.scopes},a=await fetch("/api/token-exchange",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tokenEndpoint:o,...s})});if(!a.ok){await a.text();throw new Error(`Token exchange failed: ${a.status} ${a.statusText}`)}const l=await a.json();try{const r=[{step:"redirect-4",title:"Backend Exchanges Code for Tokens (redirect flow)",method:"POST",url:o,params:{grant_type:"authorization_code"},requestBody:{...s,code:e?`${String(e).substring(0,20)}...`:void 0},response:{access_token:l?.access_token?"received":"N/A",id_token:l?.id_token?"received":"N/A",refresh_token:l?.refresh_token?"received":"N/A"},fullResponse:l}];localStorage.setItem("pingone_login_flow_log",JSON.stringify(r))}catch{}return te.clearPKCECodes(t).catch(e=>{}),sessionStorage.removeItem("pkce_code_verifier"),sessionStorage.removeItem("pkce_code_challenge"),l},u=e.useMemo(()=>{try{const e=localStorage.getItem(Wr);if(e)return{...Vr,...JSON.parse(e)};const r=localStorage.getItem("pingone_permanent_credentials");if(r){const e=JSON.parse(r);return{environmentId:e.environmentId||Vr.environmentId,clientId:e.clientId||Vr.clientId,clientSecret:e.clientSecret||Vr.clientSecret,redirectUri:e.redirectUri||Vr.redirectUri,scopes:Array.isArray(e.scopes)?e.scopes.join(" "):e.scopes||Vr.scopes,responseType:"code",tokenEndpointAuthMethod:e.tokenAuthMethod||"client_secret_post"}}}catch(e){}return Vr},[]),p=e.useCallback(()=>{const e={...Ft(n.hash,!0),...Ft(n.search.startsWith("?")?n.search.slice(1):n.search)};return"oauth-authorization-code-v7"===e.flow||n.search.includes("flow=oauth-authorization-code-v7")?"/flows/oauth-authorization-code-v7?step=4":"device-authorization-v7"===e.flow||n.search.includes("flow=device-authorization-v7")?"/flows/device-authorization-v7?step=4":"/pingone-authentication/result"},[n.hash,n.search]);return e.useEffect(()=>{(async()=>{if(c.current)return;c.current=!0;const e=Ft(n.hash,!0),t={...Ft(n.search.startsWith("?")?n.search.slice(1):n.search),...e};let s=sessionStorage.getItem(Fr);s||(s=sessionStorage.getItem(Mr));let l=null;if(s)try{const e=JSON.parse(s);e.mode&&"redirect"!==e.mode?l=null:(l=e,!l.returnPath||"/dashboard"!==l.returnPath&&l.returnPath.startsWith("/pingone-authentication")||delete l.returnPath)}catch(b){}const p=t.error,h=t.error_description;if(p)return"unsupported_response_type"===p?(ne.showError('Response type not supported by your PingOne application. Try using "code" instead of hybrid flows.'),d(`Unsupported response type: ${h||'Your PingOne application does not support the selected response type. Please use "code" (Authorization Code) instead.'}`)):"invalid_client"===p?(ne.showError("Invalid client configuration. Check your Client ID and Client Secret."),d(`Client error: ${h||"Invalid client credentials or configuration."}`)):"invalid_scope"===p?(ne.showError("Invalid scope configuration. Check your scopes in PingOne application settings."),d(`Scope error: ${h||"The requested scopes are not valid for this application."}`)):"invalid_request"===p?(ne.showError("Invalid request parameters. Check your configuration."),d(`Request error: ${h||"The request parameters are invalid. Please check your configuration."}`)):(ne.showError(`Authentication error: ${p}`),d(`Authentication failed: ${h||p}`)),void a(!1);if(0===Object.keys(t).length)return ne.showError("No tokens found on callback. Complete the flow and try again."),d("Missing tokens in callback response."),void a(!1);if(t.code&&!t.access_token)try{const e=await m(t.code),n={...t,...e};o(n);const i={timestamp:Date.now(),mode:"redirect",responseType:l?.responseType||u.responseType,tokens:n,config:u,authUrl:window.location.href,context:{isRedirectless:!1}};localStorage.setItem(Br,JSON.stringify(i));localStorage.getItem(Br);sessionStorage.removeItem(Fr),sessionStorage.removeItem(Mr),ne.showSuccess("Authorization successful! Tokens received.");let s=l?.returnPath||"/pingone-authentication/result";return"/dashboard"!==s&&!s.startsWith("/dashboard")&&s.startsWith("/pingone-authentication")||(s="/pingone-authentication/result"),("/dashboard"===s||s.startsWith("/dashboard/"))&&(s="/pingone-authentication/result"),void r(s)}catch(y){return ne.showError("Failed to exchange authorization code for tokens."),d(`Token exchange failed: ${y instanceof Error?y.message:"Unknown error"}`),void a(!1)}o(t);const g={timestamp:Date.now(),mode:"redirect",responseType:l?.responseType||u.responseType,tokens:t,config:u,authUrl:window.location.href,context:{isRedirectless:!1}};localStorage.setItem(Br,JSON.stringify(g)),sessionStorage.removeItem(Fr),sessionStorage.removeItem(Mr);const f="PingOneLoginWindow"===window.name||window.opener&&window.opener!==window;if(f){try{window.opener&&window.opener!==window&&window.opener.postMessage({type:"PINGONE_PLAYGROUND_RESULT",result:g},window.location.origin)}catch(j){}return a(!1),void setTimeout(()=>{window.close()},100)}if(Object.keys(i).length>0&&!f&&window.parent&&window.parent!==window)try{window.parent.postMessage({type:"PINGONE_PLAYGROUND_RESULT",result:g},window.location.origin)}catch(j){}ne.showSuccess("Tokens captured! Redirecting to the lounge…");let x=l?.returnPath||"/pingone-authentication/result";"/dashboard"!==x&&!x.startsWith("/dashboard")&&(x.startsWith("/pingone-authentication")||x.startsWith("/flows/oauth-authorization-code-v7")||x.startsWith("/flows/device-authorization-v7"))||(x="/pingone-authentication/result"),("/dashboard"===x||x.startsWith("/dashboard/"))&&(x="/pingone-authentication/result"),setTimeout(()=>r(x),900),a(!1)})()},[p,u,n.hash,n.search,r,m,i]),t.jsx(Dt,{children:t.jsxs(Ut,{children:[t.jsx(Lt,{children:"PingOne Callback Portal"}),t.jsx(Wt,{children:s?"Processing tokens returned from PingOne…":l||(Object.keys(i).length>0?"Success! We saved the returned tokens and sent them to the Tokens Lounge.":"No tokens detected. Make sure your PingOne app is configured with the correct redirect URI.")}),Object.keys(i).length>0&&t.jsx(Bt,{children:JSON.stringify(i,null,2)}),t.jsx(Mt,{onClick:()=>r("/pingone-authentication/result"),children:"View Tokens Lounge"})]})})},Jt=F.div`
  background: white;
  min-height: 100vh;
  padding: 2rem;
  margin-left: 320px;
  margin-top: 100px;
  
  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 80px;
    padding: 1rem;
  }
`,Vt=F.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
`,Ht=F.h1`
  color: #333;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`,Gt=F.p`
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
`,Yt=F.h2`
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
`,Kt=F.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`,Qt=F.dt`
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Xt=F.dd`
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  color: #333;
  word-break: break-all;
`,Zt=F.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.6;
`,en=F.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`,rn=F.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({$variant:e})=>"secondary"===e?"\n        background: #6c757d;\n        color: white;\n        &:hover {\n          background: #545b62;\n        }\n      ":"\n        background: #007bff;\n        color: white;\n        &:hover {\n          background: #0056b3;\n        }\n      "}
  
  &:disabled {
    background: #adb5bd;
    cursor: not-allowed;
  }
`,tn=F.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
`,nn=F.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
`,on=F.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`,sn=F.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  background: #ffffff;
`,an=F.div`
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
`,ln=F.pre`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 0 0 0.5rem 0;
`;F.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 12px;
  padding: 2rem;
`;const dn=F.div`
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
`,cn=F.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f3f4f6;
  color: #374151;
  cursor: pointer;
  font-weight: 600;
  &:hover { background: #e5e7eb; }
`;F.h3`
  color: #856404;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
`,F.p`
  color: #856404;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
`;const mn=()=>{const r=S(),[n,i]=e.useState(null),[o,a]=e.useState(!1),[l,d]=e.useState(!1),[c,m]=e.useState(!1),[u]=e.useState({current:!1}),[p,h]=e.useState(!0),[g,f]=e.useState(null),{StepContainer:x,StepHeader:b,StepHeaderLeft:y,StepHeaderRight:j,VersionBadge:w,StepHeaderTitle:k,StepHeaderSubtitle:v,StepContent:C,StepNavigation:T,NavigationButton:A}=me.createStepLayout({theme:"blue",showProgress:!1}),R=({size:e=28})=>t.jsx("span",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:e,height:e,borderRadius:8,background:"#fff",boxShadow:"0 2px 6px rgba(0,0,0,0.15)",marginRight:10},children:t.jsxs("svg",{width:Math.round(.75*e),height:Math.round(.75*e),viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg","aria-hidden":"true",children:[t.jsx("path",{d:"M12 2l7 3v5c0 5.25-3.5 9.75-7 11-3.5-1.25-7-5.75-7-11V5l7-3z",fill:"#E31837"}),t.jsx("path",{d:"M12 5l4 1.7V10.5c0 3.2-2.1 6.1-4 7-1.9-.9-4-3.8-4-7V6.7L12 5z",fill:"#ffffff"})]})});e.useEffect(()=>{try{const e=localStorage.getItem(Br);if(e){const r=JSON.parse(e);i(r),!u.current&&Object.keys(r.tokens).length>0&&(u.current=!0,m(!0))}const r=localStorage.getItem("pingone_login_flow_log");if(r)try{f(JSON.parse(r))}catch{f(null)}}catch(e){}window.scrollTo(0,0)},[u]);const z=e.useMemo(()=>{if(!n)return"";const e=Lr.find(e=>e.value===n.responseType);return e?e.label:n.responseType},[n]),O=()=>{d(!0),setTimeout(()=>{r("/pingone-authentication")},200)},P=e.useMemo(()=>{if(!n)return"oauth";if("redirectless"===n.mode)return"redirectless";const e=(n.config.scopes||"").toLowerCase();return!!n.tokens?.id_token||e.split(/\s+/).includes("openid")?"oidc":"oauth"},[n]),$=e.useMemo(()=>{if(!n)return null;const e={...n.tokens};return!e.scope&&n.config.scopes&&(e.scope=n.config.scopes),e},[n]);return n?t.jsxs(Jt,{children:[t.jsxs(x,{children:[t.jsxs(b,{children:[t.jsxs(y,{children:[t.jsxs("div",{style:{display:"flex",alignItems:"center"},children:[t.jsx(R,{}),t.jsx(k,{children:"PingOne Tokens Lounge"})]}),t.jsxs(v,{children:["Latest ","redirectless"===n.mode?"redirectless":"redirect"," run summary and tokens"]})]}),t.jsx(j,{children:t.jsx(w,{children:"V7"})})]}),t.jsxs(C,{children:[t.jsx(dn,{children:t.jsxs(cn,{onClick:()=>r("/pingone-authentication"),children:[t.jsx(E,{size:16})," Previous"]})}),t.jsx(Ht,{style:{display:"none"},children:"Hidden"}),t.jsx(Gt,{style:{display:"none"},children:"Hidden"}),t.jsxs(Vt,{children:[t.jsx(Yt,{children:"Session Summary"}),t.jsxs(Kt,{children:[t.jsxs("div",{children:[t.jsx(Qt,{children:"Mode"}),t.jsx(Xt,{children:"redirectless"===n.mode?"Redirectless (pi.flow)":"Redirect (Hosted UI)"})]}),t.jsxs("div",{children:[t.jsx(Qt,{children:"Response Type"}),t.jsx(Xt,{children:z})]}),t.jsxs("div",{children:[t.jsx(Qt,{children:"Generated"}),t.jsx(Xt,{children:new Date(n.timestamp).toLocaleString()})]}),t.jsxs("div",{children:[t.jsx(Qt,{children:"Client Id"}),t.jsx(Xt,{children:n.config.clientId})]}),t.jsxs("div",{children:[t.jsx(Qt,{children:"Scopes"}),t.jsx(Xt,{children:n.config.scopes||"openid"})]})]})]}),t.jsx(nn,{children:t.jsxs(on,{children:[t.jsx(Yt,{children:"Tokens"}),0===Object.keys(n.tokens).length?t.jsxs(Zt,{children:["No tokens were generated for the selected response type. Try choosing a response type that includes",t.jsx("code",{children:" token "})," or ",t.jsx("code",{children:" id_token "})," and re-run the flow."]}):t.jsx(ue,{tokens:$,flowType:P,flowKey:"pingone-authentication"})]})}),n.tokens?.access_token&&t.jsx(de,{title:"Token Introspection",subtitle:"Inspect your access token to see its metadata, claims, and expiration",icon:t.jsx(s,{}),defaultCollapsed:!1,theme:"green",children:t.jsx(ee,{flowName:"PingOne Authentication",flowVersion:"V7",tokens:n.tokens,credentials:{environmentId:n.config.environmentId,clientId:n.config.clientId,clientSecret:n.config.clientSecret},onResetFlow:O,onNavigateToTokenManagement:()=>r("/token-management")})}),t.jsx(de,{title:"Documentation & Resources",subtitle:"Learn more about OAuth 2.0, OpenID Connect, and PingOne authentication",icon:t.jsx(I,{}),defaultCollapsed:!0,theme:"yellow",children:t.jsxs("div",{style:{padding:"1.5rem",lineHeight:1.8},children:[t.jsx("h3",{style:{marginTop:0,marginBottom:"1rem",color:"#333"},children:"Understanding Your Authentication Result"}),t.jsx("p",{style:{color:"#666",marginBottom:"1rem"},children:"You've successfully completed an OAuth 2.0 authentication flow with PingOne. Here's what happened:"}),t.jsxs("ul",{style:{color:"#666",marginBottom:"1.5rem",paddingLeft:"1.5rem"},children:[t.jsxs("li",{children:[t.jsx("strong",{children:"Authorization Request:"})," Your application requested access to protected resources on your behalf."]}),t.jsxs("li",{children:[t.jsx("strong",{children:"User Authentication:"})," You were redirected to PingOne to authenticate and authorize the request."]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Token Exchange:"})," After successful authentication, PingOne issued tokens that your application can use to access protected resources."]})]}),t.jsx("h4",{style:{color:"#333",marginTop:"1.5rem",marginBottom:"0.5rem"},children:"Token Types"}),t.jsxs("ul",{style:{color:"#666",marginBottom:"1.5rem",paddingLeft:"1.5rem"},children:[t.jsxs("li",{children:[t.jsx("strong",{children:"Access Token:"})," Used to access protected resources. This token is short-lived and should be kept secure."]}),t.jsxs("li",{children:[t.jsx("strong",{children:"ID Token:"})," Contains user identity information (only for OpenID Connect flows)."]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Refresh Token:"})," Used to obtain new access tokens without requiring user interaction (if enabled)."]})]}),t.jsx("h4",{style:{color:"#333",marginTop:"1.5rem",marginBottom:"0.5rem"},children:"Next Steps"}),t.jsxs("ul",{style:{color:"#666",marginBottom:"1.5rem",paddingLeft:"1.5rem"},children:[t.jsxs("li",{children:["Use the ",t.jsx("strong",{children:"Token Introspection"})," section above to inspect your access token."]}),t.jsx("li",{children:"Test API calls with your access token to access protected resources."}),t.jsxs("li",{children:["Review the ",t.jsx("strong",{children:"Flow Requests & Responses"})," section to see detailed API interactions."]}),t.jsx("li",{children:"Learn more about OAuth 2.0 and OpenID Connect in the PingOne documentation."})]})]})}),t.jsx(de,{title:"Flow Requests & Responses (latest session)",subtitle:"Detailed requests and responses for the latest run",icon:t.jsx(_,{}),defaultCollapsed:!0,theme:"highlight",onToggle:e=>h(e),children:Array.isArray(g)&&g.length>0?g.map((e,r)=>t.jsxs(sn,{children:[t.jsxs(an,{children:["Step ",e.step??r+1,": ",e.title||e.url]}),e.method&&t.jsxs("div",{style:{marginBottom:"0.25rem",color:"#6b7280"},children:["Method: ",e.method]}),e.url&&t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{color:"#6b7280"},children:"URL:"}),t.jsx(ln,{children:e.url})]}),e.params&&t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{color:"#6b7280"},children:"Params:"}),t.jsx(ln,{children:JSON.stringify(e.params,null,2)})]}),e.requestBody&&t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{color:"#6b7280"},children:"Request Body:"}),t.jsx(ln,{children:JSON.stringify(e.requestBody,null,2)})]}),e.response&&t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{color:"#6b7280"},children:"Response:"}),t.jsx(ln,{children:JSON.stringify(e.response,null,2)})]}),e.fullResponse&&t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{color:"#6b7280"},children:"Full Response:"}),t.jsx(ln,{children:JSON.stringify(e.fullResponse,null,2)})]}),void 0!==e.status&&t.jsxs("div",{style:{color:"#6b7280"},children:["HTTP Status: ",e.status]}),e.note&&t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{color:"#6b7280",marginTop:"0.25rem"},children:"Note:"}),t.jsx(ln,{children:e.note})]})]},r)):t.jsx("div",{style:{color:"#6b7280"},children:"No flow requests were recorded for this session."})})]}),t.jsxs(T,{children:[t.jsxs(A,{$variant:"secondary",onClick:()=>r("/pingone-authentication"),children:[t.jsx(E,{size:16})," Previous"]}),t.jsx("div",{})]})]}),t.jsxs(en,{children:[t.jsx(rn,{onClick:O,disabled:l,children:l?"Starting…":"Start Over"}),t.jsx(rn,{$variant:"secondary",onClick:()=>{a(!0),localStorage.removeItem(Br),i(null),setTimeout(()=>{a(!1)},200)},disabled:o,children:o?"Clearing…":"Clear Tokens"})]}),t.jsx(Q,{isOpen:c,onClose:()=>m(!1),title:"Login Successful!",message:"You have been successfully authenticated with PingOne. Your tokens have been received and are displayed below.",autoCloseDelay:5e3})]}):t.jsxs(Jt,{children:[t.jsx(Ht,{children:"PingOne Tokens Lounge"}),t.jsx(Gt,{children:"The portal is quiet. Run a redirect or redirectless login to populate this space with freshly minted tokens."}),t.jsxs(tn,{children:[t.jsx("p",{children:"No recent login artifacts detected."}),t.jsx(en,{children:t.jsx(rn,{onClick:O,children:"Return to Playground"})})]})]})},un=F.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 2rem 1.5rem 4rem;
	display: flex;
	flex-direction: column;
	gap: 1.75rem;
`,pn=F.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.75rem;
	border-radius: 1rem;
	background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04));
	border: 1px solid rgba(59, 130, 246, 0.2);
`,hn=F.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #1d4ed8;
`,gn=F.h1`
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
`,fn=F.p`
	margin: 0;
	color: #1e40af;
	max-width: 720px;
	line-height: 1.6;
`,xn=F.div`
	display: grid;
	grid-template-columns: 360px 1fr;
	gap: 1.75rem;

	@media (max-width: 1080px) {
		grid-template-columns: 1fr;
	}
`,bn=F.div`
	background: #ffffff;
	border-radius: 1rem;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.18);
	overflow: hidden;
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`,yn=F.h2`
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.1rem;
	font-weight: 600;
	color: #0f172a;
`,jn=F.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`,wn=F.label`
	font-weight: 600;
	font-size: 0.85rem;
	color: #334155;
	display: flex;
	align-items: center;
	gap: 0.35rem;
`,kn=F.input`
	width: 100%;
	padding: 0.75rem 0.85rem;
	border-radius: 0.75rem;
	border: 1px solid ${({$hasError:e})=>e?"#f87171":"#cbd5f5"};
	background: #f8fafc;
	transition: all 0.2s ease;
	font-size: 0.92rem;

	&:focus {
		outline: none;
		border-color: ${({$hasError:e})=>e?"#ef4444":"#3b82f6"};
		box-shadow: 0 0 0 3px ${({$hasError:e})=>e?"rgba(248, 113, 113, 0.35)":"rgba(59, 130, 246, 0.2)"};
	}
`,vn=F.select`
	width: 100%;
	padding: 0.75rem 0.85rem;
	border-radius: 0.75rem;
	border: 1px solid #cbd5f5;
	background: #f8fafc;
	transition: all 0.2s ease;
	font-size: 0.92rem;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
	}
`,Sn=F.p`
	margin: 0;
	font-size: 0.8rem;
	color: #64748b;
`,Cn=F.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`,In=F.button`
	border: none;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: ${({disabled:e})=>e?"#cbd5f5":"#2563eb"};
	color: white;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: ${({disabled:e})=>e?"not-allowed":"pointer"};
	transition: transform 0.15s ease, box-shadow 0.15s ease;

	&:hover {
		transform: ${({disabled:e})=>e?"none":"translateY(-1px)"};
		box-shadow: ${({disabled:e})=>e?"none":"0 10px 22px -12px rgba(37, 99, 235, 0.65)"};
	}

	.spin {
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
`,Tn=F.button`
	border: none;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: #ef4444;
	color: white;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: transform 0.15s ease, box-shadow 0.15s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 22px -12px rgba(239, 68, 68, 0.65);
		background: #dc2626;
	}

	&:active {
		transform: translateY(0);
	}
`,En=F.button`
	border: 1px solid #cbd5f5;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: white;
	color: #1e293b;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: background 0.15s ease, color 0.15s ease;

	&:hover {
		background: #f8fafc;
		color: #1d4ed8;
	}

	.spin {
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
`,_n=F.div`
	padding: 1rem 1.25rem;
	border-radius: 0.85rem;
	border: 2px solid #fbbf24;
	background: #fef3c7;
	color: #92400e;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-bottom: 1rem;
`,An=F.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`,Rn=F.div`
	padding: 2rem;
	border-radius: 1rem;
	border: 1px dashed #cbd5f5;
	background: #f8fafc;
	color: #475569;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
`,zn=F.div`
	padding: 1rem 1.25rem;
	border-radius: 0.85rem;
	border: 1px solid #fecaca;
	background: #fef2f2;
	color: #b91c1c;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`,On=F.div`
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	backdrop-filter: blur(4px);
`,Pn=F.div`
	background: white;
	border-radius: 0.75rem;
	padding: 1.25rem 1.5rem;
	max-width: 800px;
	width: calc(100vw - 4rem);
	margin: 1rem;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	border: 3px solid #dc2626;
	max-height: calc(100vh - 4rem);
	overflow-y: auto;
`,$n=F.h2`
	font-size: 1.1rem;
	font-weight: 700;
	color: #1f2937;
	margin: 0 0 0.65rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Nn=F.p`
	font-size: 0.8rem;
	color: #374151;
	line-height: 1.35;
	margin: 0 0 0.65rem 0;
`,Dn=F.div`
	font-size: 0.75rem;
	color: #374151;
	line-height: 1.35;
	margin: 0 0 0.75rem 0;
	padding: 0.75rem;
	background: #f3f4f6;
	border-radius: 0.5rem;
	border-left: 4px solid #dc2626;

	strong {
		color: #1f2937;
		display: block;
		margin-bottom: 0.4rem;
		font-size: 0.8rem;
	}

	ul {
		margin: 0;
		padding-left: 1.25rem;
	}

	li {
		margin-bottom: 0.25rem;
	}

	code {
		background: #1f2937;
		color: #f59e0b;
		padding: 0.15rem 0.35rem;
		border-radius: 0.25rem;
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.7rem;
		font-weight: 600;
	}
`,Un=F.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
`,Ln=F.button`
	padding: 0.55rem 1.25rem;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.85rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 200ms ease;

	&:hover {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	&:active {
		transform: translateY(0);
	}
`,Wn=()=>{const e=new Date,r=new Date(e);r.setDate(e.getDate()-7);const t=e=>e.toISOString().split("T")[0];return{start:t(r),end:t(e)}},Bn=()=>{const[{start:r},o]=e.useState(Wn),[a,l]=e.useState("24"),[d,c]=e.useState("byDateRange"),[m,h]=e.useState(""),[x,j]=e.useState(!1),[w,k]=e.useState(null),[S,C]=e.useState(null),[I,T]=e.useState(null),[E,_]=e.useState(()=>ie()||""),R=!!E,[z,O]=e.useState(!1),[P,$]=e.useState(!1);e.useEffect(()=>{const e=()=>{const e=ie()||"";_(e)};e();const r=r=>{(r.key?.startsWith("worker_token")||r.key?.startsWith("pingone_worker_token"))&&e()},t=()=>{e()};return window.addEventListener("storage",r),window.addEventListener("workerTokenUpdated",t),window.addEventListener("workerTokenMetricsUpdated",t),()=>{window.removeEventListener("storage",r),window.removeEventListener("workerTokenUpdated",t),window.removeEventListener("workerTokenMetricsUpdated",t)}},[]);const N=e.useCallback(()=>{ie()&&ne.showInfo("Worker token already available. Opening modal in case you want to refresh it."),k(null),O(!0)},[]),D=e.useCallback(()=>{localStorage.removeItem("worker_token"),localStorage.removeItem("worker_token_expires_at"),localStorage.removeItem("pingone_worker_token"),localStorage.removeItem("pingone_worker_token_worker-token-v7"),localStorage.removeItem("worker_token_metrics"),localStorage.removeItem("worker_token_metrics_expires_at"),_(""),ne.showSuccess("Worker token cleared successfully.")},[]),U=e.useCallback(async()=>{let e="",t="us";const n=ie()||"";try{const r=localStorage.getItem("unified_worker_token");if(r){const n=JSON.parse(r);e=n.credentials?.environmentId||"",t=n.credentials?.region||"us"}}catch(i){}j(!0),k(null);try{const i=new URLSearchParams({environmentId:e.trim(),region:t,workerToken:n,limit:"100"});"byDateRange"===d?(r&&i.append("startDate",r),a&&i.append("samplingPeriod",a)):"byLicense"===d&&(m&&i.append("licenseId",m),a&&i.append("samplingPeriod",a));const o=`/api/pingone/active-identity-counts?${i.toString()}`,s={method:"GET"},l=await fetch(o,s);if(!l.ok){if(403===l.status)throw $(!0),new Error("PERMISSIONS_ERROR");const e=await l.json().catch(()=>({}));throw new Error(e.error_description||l.statusText)}const c=await l.json();C(c),T((new Date).toISOString()),ne.showSuccess("Identity metrics retrieved successfully!")}catch(o){C(null),T(null),o instanceof Error&&"PERMISSIONS_ERROR"===o.message?k("Worker token lacks required permissions. Click the error modal for details."):k(o instanceof Error?o.message:"Unexpected error querying PingOne metrics")}finally{j(!1)}},[r,a,d,m]),L=e.useCallback(async()=>{let e="",t="us";try{const r=localStorage.getItem("unified_worker_token");if(r){const n=JSON.parse(r);e=n.credentials?.environmentId||"",t=n.credentials?.region||"us"}}catch(u){}if(!e.trim())return void k("Environment ID is required. Please generate a worker token first.");const n=localStorage.getItem("worker_token_metrics")||void 0;if(!n)return void k('Worker token required. Click "Get Worker Token" to generate one.');const i={us:"https://api.pingone.com",na:"https://api.pingone.com",eu:"https://api.pingone.eu",ca:"https://api.pingone.ca",ap:"https://api.pingone.asia",asia:"https://api.pingone.asia"},o=i[t.toLowerCase()]||i.na,s=new URLSearchParams;let l,c;if(s.append("limit","100"),"byDateRange"===d){const t=[];r&&t.push(`startDate ge "${r.includes("T")?r:`${r}T00:00:00Z`}"`),a&&t.push(`samplingPeriod eq "${a}"`),t.length>0&&s.append("filter",t.join(" and ")),l=`${o}/v1/environments/${e.trim()}/activeIdentityCounts?${s.toString()}`,c=["This endpoint returns time-series identity count data with specified sampling periods","The sampling period determines the granularity (hourly, daily, weekly)","Uses OData filtering syntax for startDate and samplingPeriod","Returns up to 100 data points (configurable with limit parameter)","Requires Identity Data Admin or Environment Admin role in PingOne"]}else"byLicense"===d?(m&&s.append("licenseId",m),a&&s.append("samplingPeriod",a),l=`${o}/v1/environments/${e.trim()}/activeIdentityCounts?${s.toString()}`,c=["This endpoint returns active identity counts filtered by license","Requires a licenseId parameter to filter counts for a specific license","The sampling period determines the granularity (hourly, daily, weekly)","Returns up to 100 data points (configurable with limit parameter)","Requires Identity Data Admin or Environment Admin role in PingOne"]):(l=`${o}/v1/environments/${e.trim()}/activeIdentityCounts?${s.toString()}`,c=["This endpoint returns active identity counts without filters","Returns the most recent data points (up to limit)","Returns up to 100 data points (configurable with limit parameter)","Requires Identity Data Admin or Environment Admin role in PingOne"]);He.showModal({type:"data_api_get",method:"GET",url:l,headers:{Authorization:`Bearer ${n}`,Accept:"application/json"},description:"Retrieve time-series active identity counts with sampling periods",educationalNotes:c,onProceed:U})},[r,a,d,m,U]),W=S?._embedded?.activeIdentityCounts||[],B=e.useMemo(()=>S?JSON.parse(JSON.stringify(S)):null,[S]),M=e.useMemo(()=>{if(!W||0===W.length)return null;const e=W.map(e=>e.count||0).filter(e=>e>0);if(0===e.length)return null;const r=e.reduce((e,r)=>e+r,0);return{total:r,average:Math.round(r/e.length),min:Math.min(...e),max:Math.max(...e),latest:e[e.length-1],oldest:e[0],dataPoints:e.length,period:"1"===a?"hourly":"24"===a?"daily":"weekly"}},[W,a]);return t.jsxs(un,{children:[t.jsxs(pn,{children:[t.jsxs(hn,{children:[t.jsx(y,{size:24}),t.jsx(gn,{children:"PingOne Identity Counts"})]}),t.jsxs(fn,{children:["Query PingOne active identity counts with time-series data and sampling periods. Requires"," ",t.jsx("strong",{children:"Identity Data Admin"})," role."]}),!R&&t.jsx(_n,{children:t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.75rem"},children:[t.jsx(g,{size:20,style:{marginTop:"0.1rem",flexShrink:0}}),t.jsxs("div",{style:{flex:1},children:[t.jsx("strong",{children:"Worker Token Required"}),t.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.875rem"},children:'Click "Get Worker Token" below to generate a token with your PingOne credentials.'})]})]})})]}),t.jsxs(xn,{children:[t.jsxs(bn,{children:[t.jsxs(yn,{children:[t.jsx(s,{})," Authentication & Worker Token"]}),R?t.jsx(X,{token:E,tokenExpiryKey:"worker_token_metrics_expires_at"}):t.jsx(_n,{style:{marginBottom:"1rem"},children:t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.75rem"},children:[t.jsx(g,{size:18,style:{marginTop:"0.1rem",flexShrink:0}}),t.jsxs("div",{style:{flex:1},children:[t.jsx("strong",{children:"No Worker Token Found"}),t.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.875rem"},children:"Click the button below to open the Worker Token modal and generate a token with the required credentials."})]})]})}),t.jsxs(Cn,{children:[t.jsx(In,{onClick:N,type:"button",style:{background:R?"#9ca3af":void 0,cursor:"pointer",color:"white"},children:R?t.jsxs(t.Fragment,{children:[t.jsx(f,{})," Worker Token Ready"]}):t.jsxs(t.Fragment,{children:[t.jsx(p,{})," Get Worker Token"]})}),R&&t.jsxs(Tn,{onClick:D,type:"button",children:[t.jsx(n,{})," Clear Token"]})]})]}),t.jsxs(bn,{children:[t.jsxs(yn,{children:[t.jsx(A,{})," Metrics Configuration"]}),t.jsxs(jn,{children:[t.jsx(wn,{children:"Endpoint Type"}),t.jsxs(vn,{value:d,onChange:e=>c(e.target.value),children:[t.jsx("option",{value:"byDateRange",children:"By Date Range"}),t.jsx("option",{value:"byLicense",children:"By License"}),t.jsx("option",{value:"simple",children:"Simple (No Filters)"})]}),t.jsxs(Sn,{children:["byDateRange"===d&&"Filter by date range and sampling period","byLicense"===d&&"Filter by license ID and sampling period","simple"===d&&"Get recent counts without filters"]})]}),"byDateRange"===d&&t.jsxs(t.Fragment,{children:[t.jsxs(jn,{children:[t.jsx(wn,{children:"Start date"}),t.jsx(kn,{type:"date",value:r,onChange:e=>o(r=>({...r,start:e.target.value}))})]}),t.jsxs(jn,{children:[t.jsx(wn,{children:"Sampling Period"}),t.jsxs(vn,{value:a,onChange:e=>l(e.target.value),children:[t.jsx("option",{value:"1",children:"1 hour (hourly)"}),t.jsx("option",{value:"24",children:"24 hours (daily)"}),t.jsx("option",{value:"168",children:"168 hours (weekly)"})]}),t.jsx(Sn,{children:"Time interval for data points in the time-series response."})]})]}),"byLicense"===d&&t.jsxs(t.Fragment,{children:[t.jsxs(jn,{children:[t.jsx(wn,{children:"License ID"}),t.jsx(kn,{type:"text",value:m,onChange:e=>h(e.target.value),placeholder:"Enter license ID"}),t.jsx(Sn,{children:"License ID to filter identity counts by."})]}),t.jsxs(jn,{children:[t.jsx(wn,{children:"Sampling Period"}),t.jsxs(vn,{value:a,onChange:e=>l(e.target.value),children:[t.jsx("option",{value:"1",children:"1 hour (hourly)"}),t.jsx("option",{value:"24",children:"24 hours (daily)"}),t.jsx("option",{value:"168",children:"168 hours (weekly)"})]}),t.jsx(Sn,{children:"Time interval for data points in the time-series response."})]})]}),"simple"===d&&t.jsxs(jn,{children:[t.jsx(wn,{children:"Limit"}),t.jsx(kn,{type:"number",value:"100",readOnly:!0,style:{background:"#f1f5f9",cursor:"not-allowed"}}),t.jsx(Sn,{children:"Returns up to 100 most recent data points."})]}),t.jsxs(Cn,{children:[t.jsx(In,{onClick:L,disabled:!R||x,children:x?t.jsxs(t.Fragment,{children:[t.jsx(b,{className:"spin"})," Fetching…"]}):t.jsxs(t.Fragment,{children:[t.jsx(y,{})," Retrieve counts"]})}),t.jsxs(En,{type:"button",onClick:()=>o(Wn()),children:[t.jsx(v,{})," Reset dates"]})]}),w&&t.jsxs(zn,{children:[t.jsx(i,{size:18,style:{marginTop:"0.2rem"}}),t.jsx("span",{children:w})]}),t.jsx(An,{children:S?t.jsxs(t.Fragment,{children:[M&&t.jsxs(bn,{style:{border:"1px solid #10b981",background:"linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)"},children:[t.jsxs(yn,{children:[t.jsx(y,{})," Summary Statistics"]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:"1rem",marginTop:"1rem"},children:[t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #d1fae5"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Latest Count"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:700,color:"#059669"},children:M.latest.toLocaleString()})]}),t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #d1fae5"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Average"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:700,color:"#059669"},children:M.average.toLocaleString()})]}),t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #d1fae5"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Maximum"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:700,color:"#059669"},children:M.max.toLocaleString()})]}),t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #d1fae5"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Minimum"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:700,color:"#059669"},children:M.min.toLocaleString()})]}),t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #d1fae5"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Data Points"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:700,color:"#059669"},children:M.dataPoints})]}),t.jsxs("div",{style:{padding:"0.75rem",background:"white",borderRadius:"0.5rem",border:"1px solid #d1fae5"},children:[t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.25rem"},children:"Period"}),t.jsx("div",{style:{fontSize:"1.1rem",fontWeight:600,color:"#059669",textTransform:"capitalize"},children:M.period})]})]}),I&&t.jsxs(Sn,{style:{marginTop:"1rem",paddingTop:"1rem",borderTop:"1px solid #d1fae5"},children:["Last updated: ",new Date(I).toLocaleString()]})]}),t.jsxs(bn,{style:{border:"1px solid #dbeafe",background:"#ffffff"},children:[t.jsxs(yn,{children:[t.jsx(u,{})," Full API Response"]}),B&&t.jsx("div",{style:{maxHeight:"600px",overflow:"auto"},children:t.jsx(J,{data:B})})]})]}):t.jsxs(Rn,{children:[t.jsx(y,{size:22}),t.jsx("span",{children:"Run the request to see active identity counts returned by PingOne."})]})})]})]}),t.jsx(Z,{isOpen:z,onClose:()=>O(!1),onContinue:()=>{const e=localStorage.getItem("worker_token_metrics")||"";_(e),O(!1),e?ne.showSuccess("Worker token generated successfully. Ready to query metrics."):ne.showError("Worker token was not detected. Please try generating again.")},flowType:"pingone-identity-metrics",environmentId:(()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);return r.credentials?.environmentId||""}}catch(e){}return""})(),skipCredentialsStep:!0,prefillCredentials:(()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);return{environmentId:r.credentials?.environmentId||"",clientId:r.credentials?.clientId||"",clientSecret:r.credentials?.clientSecret||"",region:r.credentials?.region||"us",scopes:"p1:read:users"}}}catch(e){}return{}})(),tokenStorageKey:"worker_token_metrics",tokenExpiryKey:"worker_token_metrics_expires_at"}),P&&t.jsx(On,{onClick:()=>$(!1),children:t.jsxs(Pn,{onClick:e=>e.stopPropagation(),children:[t.jsxs($n,{children:[t.jsx(g,{size:24,style:{color:"#dc2626"}}),"403 Forbidden - Missing Roles"]}),t.jsxs(Nn,{children:[t.jsx("strong",{children:"⚠️ The Metrics API uses ROLES, not scopes!"})," Your Worker App needs a role assigned at the ",t.jsx("strong",{children:"Environment"})," level."]}),t.jsxs(Nn,{style:{marginTop:"0.5rem",padding:"0.5rem",background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:"0.5rem",fontSize:"0.7rem"},children:["💡 ",t.jsx("strong",{children:"Tip:"})," After assigning a role, you must generate a"," ",t.jsx("strong",{children:"NEW"})," worker token to pick up the permissions."]}),t.jsxs(Dn,{children:[t.jsx("strong",{children:"🔧 Fix in PingOne Admin Console:"}),t.jsxs("ol",{style:{marginLeft:"1.25rem",marginTop:"0.35rem"},children:[t.jsxs("li",{children:["Applications → Your Worker App → ",t.jsx("strong",{children:"Roles"})," tab"]}),t.jsxs("li",{children:["Click ",t.jsx("strong",{children:'"Grant Roles"'})]}),t.jsxs("li",{children:[t.jsx("strong",{style:{color:"#dc2626"},children:"Select your Environment"})," (not Organization) from dropdown"]}),t.jsxs("li",{children:["Assign the"," ",t.jsx("code",{children:t.jsx("strong",{children:"Identity Data Admin"})})," ","role",t.jsx("br",{}),t.jsxs("span",{style:{fontSize:"0.65rem",color:"#6b7280",marginTop:"0.25rem",display:"inline-block"},children:["(Or ",t.jsx("code",{children:"Environment Admin"})," which includes Identity Data Admin permissions)"]})]}),t.jsxs("li",{children:["Click ",t.jsx("strong",{children:'"Save"'})]})]}),t.jsx("strong",{style:{marginTop:"0.75rem",display:"block",color:"#059669"},children:"✅ After assigning role:"}),t.jsxs("ol",{style:{marginLeft:"1.25rem",marginTop:"0.35rem"},children:[t.jsx("li",{children:'Click "Clear Token" on this page'}),t.jsx("li",{children:'Click "Get Worker Token" (scopes don\'t matter for metrics)'}),t.jsx("li",{children:'Retry "Fetch Total Identity Counts"'})]})]}),t.jsx(Un,{children:t.jsx(Ln,{onClick:()=>$(!1),children:"Close"})})]})})]})},Mn=F.div`
  max-width: 90rem;
  margin: 0 auto;
  padding: 2rem;
`,Fn=F.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`,qn=F.div`
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 1rem;
  }
`,Jn=F.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;

  .warning-icon {
    color: #d97706;
    font-size: 1.5rem;
    margin-top: 0.25rem;
    flex-shrink: 0;
  }

  .warning-content {
    flex: 1;

    h3 {
      color: #92400e;
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 700;
    }

    p {
      color: #78350f;
      margin: 0;
      line-height: 1.6;
    }
  }
`,Vn=F.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`,Hn=F.div`
  background: ${e=>{switch(e.$category){case"oauth":return"linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)";case"oidc":return"linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)";case"security":return"linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)";case"advanced":return"linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)";default:return"linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)"}}};
  border: 2px solid ${e=>{switch(e.$category){case"oauth":return"#f87171";case"oidc":return"#60a5fa";case"security":return"#4ade80";case"advanced":return"#a78bfa";default:return"#d1d5db"}}};
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .feature-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;

    .feature-icon {
      font-size: 1.5rem;
      color: ${e=>{switch(e.$category){case"oauth":return"#dc2626";case"oidc":return"#2563eb";case"security":return"#16a34a";case"advanced":return"#7c3aed";default:return"#6b7280"}}};
    }

    h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: ${e=>{switch(e.$category){case"oauth":return"#991b1b";case"oidc":return"#1e40af";case"security":return"#14532d";case"advanced":return"#581c87";default:return"#374151"}}};
    }
  }

  .feature-description {
    color: #4b5563;
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  .feature-reason {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    border-left: 4px solid ${e=>{switch(e.$category){case"oauth":return"#f87171";case"oidc":return"#60a5fa";case"security":return"#4ade80";case"advanced":return"#a78bfa";default:return"#d1d5db"}}};

    .reason-label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .reason-text {
      color: #6b7280;
      font-size: 0.9rem;
      line-height: 1.5;
    }
  }

  .feature-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;

    a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid ${e=>{switch(e.$category){case"oauth":return"#fca5a5";case"oidc":return"#93c5fd";case"security":return"#86efac";case"advanced":return"#c4b5fd";default:return"#d1d5db"}}};
      border-radius: 6px;
      text-decoration: none;
      color: #374151;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        background: white;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      svg {
        font-size: 1rem;
      }
    }
  }
`;F.div`
  background: ${e=>{switch(e.$type){case"info":return"linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)";case"warning":return"linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";case"success":return"linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)";default:return"linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)"}}};
  border: 2px solid ${e=>{switch(e.$type){case"info":return"#60a5fa";case"warning":return"#fbbf24";case"success":return"#4ade80";default:return"#d1d5db"}}};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;

  .info-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;

    .info-icon {
      font-size: 1.5rem;
      color: ${e=>{switch(e.$type){case"info":return"#2563eb";case"warning":return"#d97706";case"success":return"#16a34a";default:return"#6b7280"}}};
    }

    h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: ${e=>{switch(e.$type){case"info":return"#1e40af";case"warning":return"#92400e";case"success":return"#14532d";default:return"#374151"}}};
    }
  }

  p {
    color: #4b5563;
    margin: 0;
    line-height: 1.6;
  }

  ul {
    color: #4b5563;
    margin: 1rem 0 0 0;
    padding-left: 1.5rem;

    li {
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }
  }
`;const Gn=()=>t.jsx(Mn,{children:t.jsxs(Fn,{children:[t.jsxs("div",{style:{marginBottom:"2rem"},children:[t.jsx("h1",{style:{fontSize:"2.5rem",fontWeight:"800",color:"#111827",marginBottom:"1rem"},children:"PingOne Mock & Educational Features"}),t.jsx("p",{style:{fontSize:"1.25rem",color:"#6b7280",lineHeight:"1.6",maxWidth:"800px"},children:t.jsxs("strong",{children:["Features implemented as mock demonstrations because they are"," ",t.jsx("span",{style:{color:"#dc2626"},children:"not supported by PingOne"}),". Click the links below to try existing mock flows."]})})]}),t.jsxs(Jn,{children:[t.jsx(R,{style:{color:"#d97706",fontSize:"1.5rem",marginTop:"0.25rem",flexShrink:0}}),t.jsxs("div",{style:{flex:1},children:[t.jsx("h3",{style:{color:"#92400e",margin:"0 0 0.5rem 0",fontSize:"1.25rem",fontWeight:"700"},children:"Important Notice"}),t.jsxs("p",{style:{color:"#78350f",margin:0,lineHeight:1.6},children:["All features listed below are"," ",t.jsx("strong",{children:"mock implementations for educational purposes only"}),". They demonstrate OAuth/OIDC concepts and specifications but do not integrate with real PingOne services."]})]})]}),t.jsxs(qn,{children:[t.jsx("h2",{children:"OAuth 2.0 Mock Features"}),t.jsxs(Vn,{children:[t.jsxs(Hn,{$category:"oauth",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsx(s,{style:{fontSize:"1.5rem",color:"#dc2626"}}),t.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"700",color:"#991b1b"},children:"JWT Bearer Token Flow"})]}),t.jsx("div",{style:{color:"#4b5563",marginBottom:"1rem",lineHeight:1.6},children:"Mock implementation of RFC 7523 JWT Bearer Token authorization grant for service-to-service authentication."}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.7)",borderRadius:"8px",padding:"1rem",marginBottom:"1rem",borderLeft:"4px solid #f87171"},children:[t.jsx("div",{style:{fontWeight:600,color:"#374151",marginBottom:"0.5rem"},children:"Why Mock:"}),t.jsx("div",{style:{color:"#6b7280",fontSize:"0.9rem",lineHeight:1.5},children:"PingOne doesn't support JWT Bearer Token flow. Our existing implementation shows how services can authenticate using signed JWTs."})]}),t.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem"},children:[t.jsxs("a",{href:"/flows/jwt-bearer-token-v6",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #fca5a5",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(z,{}),"Try JWT Bearer Demo"]}),t.jsxs("a",{href:"/flows/jwt-bearer-v5",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #fca5a5",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(z,{}),"Try JWT Bearer V5"]})]})]}),t.jsxs(Hn,{$category:"oauth",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsx(s,{style:{fontSize:"1.5rem",color:"#dc2626"}}),t.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"700",color:"#991b1b"},children:"SAML Bearer Assertion Flow"})]}),t.jsx("div",{style:{color:"#4b5563",marginBottom:"1rem",lineHeight:1.6},children:"Mock implementation of RFC 7522 SAML Bearer Assertion for OAuth token exchange using SAML assertions."}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.7)",borderRadius:"8px",padding:"1rem",marginBottom:"1rem",borderLeft:"4px solid #f87171"},children:[t.jsx("div",{style:{fontWeight:600,color:"#374151",marginBottom:"0.5rem"},children:"Why Mock:"}),t.jsx("div",{style:{color:"#6b7280",fontSize:"0.9rem",lineHeight:1.5},children:"PingOne doesn't support SAML Bearer Assertion flow for OAuth. Our existing mock demonstrates SAML-to-OAuth token exchange."})]}),t.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem"},children:t.jsxs("a",{href:"/flows/saml-bearer-assertion-v6",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #fca5a5",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(z,{}),"Try SAML Bearer Demo"]})})]}),t.jsxs(Hn,{$category:"oauth",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsx(s,{style:{fontSize:"1.5rem",color:"#dc2626"}}),t.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"700",color:"#991b1b"},children:"DPoP (Demonstration of Proof-of-Possession)"})]}),t.jsx("div",{style:{color:"#4b5563",marginBottom:"1rem",lineHeight:1.6},children:"Mock implementation of RFC 9449 DPoP for enhanced OAuth security through token binding and replay attack prevention."}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.7)",borderRadius:"8px",padding:"1rem",marginBottom:"1rem",borderLeft:"4px solid #f87171"},children:[t.jsx("div",{style:{fontWeight:600,color:"#374151",marginBottom:"0.5rem"},children:"Why Mock:"}),t.jsx("div",{style:{color:"#6b7280",fontSize:"0.9rem",lineHeight:1.5},children:"PingOne does not support DPoP token binding. Our mock implementation demonstrates how DPoP prevents token replay attacks and enhances OAuth security."})]}),t.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem"},children:[t.jsxs("a",{href:"/flows/advanced-oauth-params-demo",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #fca5a5",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(z,{}),"Try DPoP Demo"]}),t.jsxs("a",{href:"https://tools.ietf.org/rfc/rfc9449.html",target:"_blank",rel:"noopener noreferrer",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #fca5a5",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(O,{}),"RFC 9449"]})]})]}),t.jsxs(Hn,{$category:"oauth",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsx(s,{style:{fontSize:"1.5rem",color:"#dc2626"}}),t.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"700",color:"#991b1b"},children:"Dynamic Client Registration (DCR)"})]}),t.jsx("div",{style:{color:"#4b5563",marginBottom:"1rem",lineHeight:1.6},children:"Mock implementation of RFC 7591 Dynamic Client Registration for programmatic OAuth client registration and management."}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.7)",borderRadius:"8px",padding:"1rem",marginBottom:"1rem",borderLeft:"4px solid #f87171"},children:[t.jsx("div",{style:{fontWeight:600,color:"#374151",marginBottom:"0.5rem"},children:"Why Mock:"}),t.jsx("div",{style:{color:"#6b7280",fontSize:"0.9rem",lineHeight:1.5},children:"PingOne doesn't support Dynamic Client Registration. Our mock demonstrates how clients can register themselves programmatically without manual configuration."})]}),t.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem"},children:[t.jsxs("a",{href:"/client-generator",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #fca5a5",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(z,{}),"Try DCR Demo"]}),t.jsxs("a",{href:"https://tools.ietf.org/rfc/rfc7591.html",target:"_blank",rel:"noopener noreferrer",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #fca5a5",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(O,{}),"RFC 7591"]})]})]}),t.jsxs(Hn,{$category:"oauth",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsx(s,{style:{fontSize:"1.5rem",color:"#dc2626"}}),t.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"700",color:"#991b1b"},children:"Resource Owner Password Credentials"})]}),t.jsx("div",{style:{color:"#4b5563",marginBottom:"1rem",lineHeight:1.6},children:"Mock implementation of RFC 6749 Resource Owner Password Credentials flow (deprecated for security reasons)."}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.7)",borderRadius:"8px",padding:"1rem",marginBottom:"1rem",borderLeft:"4px solid #f87171"},children:[t.jsx("div",{style:{fontWeight:600,color:"#374151",marginBottom:"0.5rem"},children:"Why Mock:"}),t.jsx("div",{style:{color:"#6b7280",fontSize:"0.9rem",lineHeight:1.5},children:"PingOne doesn't support ROPC flow due to security concerns. Our existing mock shows why this flow is deprecated."})]}),t.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem"},children:t.jsxs("a",{href:"/flows/oauth2-resource-owner-password",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #fca5a5",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(z,{}),"Try ROPC Demo"]})})]})]})]}),t.jsxs(qn,{children:[t.jsx("h2",{children:"Advanced OAuth Parameters & Features"}),t.jsxs(Vn,{children:[t.jsxs(Hn,{$category:"advanced",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsx(z,{style:{fontSize:"1.5rem",color:"#7c3aed"}}),t.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"700",color:"#581c87"},children:"Advanced OAuth Parameters Demo"})]}),t.jsx("div",{style:{color:"#4b5563",marginBottom:"1rem",lineHeight:1.6},children:"Comprehensive demonstration of advanced OAuth/OIDC parameters that PingOne doesn't fully support."}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.7)",borderRadius:"8px",padding:"1rem",marginBottom:"1rem",borderLeft:"4px solid #a78bfa"},children:[t.jsx("div",{style:{fontWeight:600,color:"#374151",marginBottom:"0.5rem"},children:"Why Mock:"}),t.jsx("div",{style:{color:"#6b7280",fontSize:"0.9rem",lineHeight:1.5},children:"Many advanced OAuth parameters like custom claims, advanced scopes, and specialized response modes aren't supported by PingOne."})]}),t.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem"},children:t.jsxs("a",{href:"/flows/advanced-oauth-params-demo",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #c4b5fd",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(z,{}),"Try Parameters Demo"]})})]}),t.jsxs(Hn,{$category:"advanced",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsx(s,{style:{fontSize:"1.5rem",color:"#7c3aed"}}),t.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"700",color:"#581c87"},children:"Rich Authorization Requests (RAR)"})]}),t.jsx("div",{style:{color:"#4b5563",marginBottom:"1rem",lineHeight:1.6},children:"Mock implementation of RFC 9396 Rich Authorization Requests for fine-grained authorization."}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.7)",borderRadius:"8px",padding:"1rem",marginBottom:"1rem",borderLeft:"4px solid #a78bfa"},children:[t.jsx("div",{style:{fontWeight:600,color:"#374151",marginBottom:"0.5rem"},children:"Why Mock:"}),t.jsx("div",{style:{color:"#6b7280",fontSize:"0.9rem",lineHeight:1.5},children:"PingOne doesn't support RAR for complex authorization scenarios. Our existing implementation demonstrates fine-grained permissions."})]}),t.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem"},children:t.jsxs("a",{href:"/flows/rar-v6",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #c4b5fd",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(z,{}),"Try RAR Demo"]})})]})]})]}),t.jsxs(qn,{children:[t.jsx("h2",{children:"Educational & Training Features"}),t.jsxs(Vn,{children:[t.jsxs(Hn,{$category:"security",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsx(s,{style:{fontSize:"1.5rem",color:"#16a34a"}}),t.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"700",color:"#14532d"},children:"OAuth 2.1 Security Features"})]}),t.jsx("div",{style:{color:"#4b5563",marginBottom:"1rem",lineHeight:1.6},children:"Educational content about OAuth 2.1 security enhancements and best practices."}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.7)",borderRadius:"8px",padding:"1rem",marginBottom:"1rem",borderLeft:"4px solid #4ade80"},children:[t.jsx("div",{style:{fontWeight:600,color:"#374151",marginBottom:"0.5rem"},children:"Educational Value:"}),t.jsx("div",{style:{color:"#6b7280",fontSize:"0.9rem",lineHeight:1.5},children:"PingOne implements OAuth 2.0, not OAuth 2.1. Our existing page shows the security improvements in OAuth 2.1."})]}),t.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem"},children:t.jsxs("a",{href:"/oauth-2-1",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #86efac",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(z,{}),"Learn OAuth 2.1"]})})]}),t.jsxs(Hn,{$category:"security",children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsx(z,{style:{fontSize:"1.5rem",color:"#16a34a"}}),t.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"700",color:"#14532d"},children:"Interactive Learning"})]}),t.jsx("div",{style:{color:"#4b5563",marginBottom:"1rem",lineHeight:1.6},children:"Hands-on tutorials and training materials for OAuth/OIDC concepts."}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.7)",borderRadius:"8px",padding:"1rem",marginBottom:"1rem",borderLeft:"4px solid #4ade80"},children:[t.jsx("div",{style:{fontWeight:600,color:"#374151",marginBottom:"0.5rem"},children:"Educational Value:"}),t.jsx("div",{style:{color:"#6b7280",fontSize:"0.9rem",lineHeight:1.5},children:"Our existing tutorials and training materials help developers understand OAuth/OIDC security concepts and implementation patterns."})]}),t.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem"},children:[t.jsxs("a",{href:"/tutorials",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #86efac",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(z,{}),"Interactive Tutorials"]}),t.jsxs("a",{href:"/oauth-oidc-training",style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",background:"rgba(255, 255, 255, 0.8)",border:"1px solid #86efac",borderRadius:"6px",textDecoration:"none",color:"#374151",fontSize:"0.875rem",fontWeight:500},children:[t.jsx(P,{}),"OAuth Training"]})]})]})]})]}),t.jsx("div",{style:{background:"linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",border:"2px solid #4ade80",borderRadius:"12px",padding:"1.5rem",marginBottom:"2rem"},children:t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"1rem"},children:[t.jsx(s,{style:{color:"#16a34a",fontSize:"1.5rem",marginTop:"0.25rem",flexShrink:0}}),t.jsxs("div",{style:{flex:1},children:[t.jsx("h3",{style:{color:"#14532d",margin:"0 0 0.5rem 0",fontSize:"1.25rem",fontWeight:"700"},children:"Production Recommendations"}),t.jsx("p",{style:{color:"#4b5563",margin:"0 0 1rem 0",lineHeight:1.6},children:"For production applications, we recommend using PingOne's supported features which provide enterprise-grade security, scalability, and compliance. The mock features above are valuable for:"}),t.jsxs("ul",{style:{color:"#4b5563",margin:0,paddingLeft:"1.5rem"},children:[t.jsxs("li",{style:{marginBottom:"0.5rem",lineHeight:1.5},children:[t.jsx("strong",{children:"Learning:"})," Understanding OAuth/OIDC specifications and security concepts"]}),t.jsxs("li",{style:{marginBottom:"0.5rem",lineHeight:1.5},children:[t.jsx("strong",{children:"Evaluation:"})," Comparing different authorization server capabilities"]}),t.jsxs("li",{style:{marginBottom:"0.5rem",lineHeight:1.5},children:[t.jsx("strong",{children:"Migration Planning:"})," Understanding what features are available in other systems"]}),t.jsxs("li",{style:{marginBottom:"0.5rem",lineHeight:1.5},children:[t.jsx("strong",{children:"Development:"})," Testing applications against different OAuth implementations"]})]})]})]})}),t.jsx("div",{style:{background:"linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",border:"2px solid #f59e0b",borderRadius:"12px",padding:"1.5rem"},children:t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"1rem"},children:[t.jsx(R,{style:{color:"#d97706",fontSize:"1.5rem",marginTop:"0.25rem",flexShrink:0}}),t.jsxs("div",{style:{flex:1},children:[t.jsx("h3",{style:{color:"#92400e",margin:"0 0 0.5rem 0",fontSize:"1.25rem",fontWeight:"700"},children:"Important Disclaimers"}),t.jsx("p",{style:{color:"#78350f",margin:"0 0 1rem 0",lineHeight:1.6},children:"Please note the following important points about these mock implementations:"}),t.jsxs("ul",{style:{color:"#78350f",margin:0,paddingLeft:"1.5rem"},children:[t.jsxs("li",{style:{marginBottom:"0.5rem",lineHeight:1.5},children:[t.jsx("strong",{children:"Not Production Ready:"})," These are educational demonstrations, not production implementations"]}),t.jsxs("li",{style:{marginBottom:"0.5rem",lineHeight:1.5},children:[t.jsx("strong",{children:"Mock Responses:"})," All server responses are simulated and don't represent real PingOne behavior"]}),t.jsxs("li",{style:{marginBottom:"0.5rem",lineHeight:1.5},children:[t.jsx("strong",{children:"Security Limitations:"})," Mock cryptographic operations are for demonstration only"]}),t.jsxs("li",{style:{marginBottom:"0.5rem",lineHeight:1.5},children:[t.jsx("strong",{children:"No Real Authentication:"})," No actual user authentication or authorization occurs"]}),t.jsxs("li",{style:{marginBottom:"0.5rem",lineHeight:1.5},children:[t.jsx("strong",{children:"Educational Purpose:"})," Designed for learning OAuth/OIDC concepts, not for real applications"]})]})]})]})})]})});class Yn{failures=0;lastFailureTime=0;state="CLOSED";async execute(e){if("OPEN"===this.state){if(!(Date.now()-this.lastFailureTime>3e4))throw new Error("Storage circuit breaker is OPEN");this.state="HALF_OPEN"}try{const r=await e();return this.onSuccess(),r}catch(r){throw this.onFailure(),r}}onSuccess(){this.failures=0,this.state="CLOSED"}onFailure(){this.failures++,this.lastFailureTime=Date.now(),this.failures>=5&&(this.state="OPEN")}}class Kn{cache=new Map;maxSize=100;hits=0;misses=0;set(e,r,t=3e5){this.cache.size>=this.maxSize&&this.evictOldest(),this.cache.set(e,{value:r,expiresAt:Date.now()+t})}get(e){const r=this.cache.get(e);return r?Date.now()>r.expiresAt?(this.cache.delete(e),this.misses++,null):(this.hits++,r.value):(this.misses++,null)}delete(e){return this.cache.delete(e)}clear(){this.cache.clear()}getHitRate(){const e=this.hits+this.misses;return e>0?this.hits/e:0}evictOldest(){const e=this.cache.keys().next().value;e&&this.cache.delete(e)}}class Qn{static instance;memoryCache=new Kn;writeQueue=new Map;writeTimeout=null;circuitBreaker=new Yn;metrics={operations:{reads:0,writes:0,errors:0},performance:{avgReadTime:0,avgWriteTime:0,cacheHitRate:0}};constructor(){}static getInstance(){return Qn.instance||(Qn.instance=new Qn),Qn.instance}async save(e,r){const t=Date.now();try{this.memoryCache.set(e,r),this.writeQueue.set(e,r),this.scheduleWrite(),this.metrics.operations.writes++,this.updatePerformanceMetrics("write",Date.now()-t)}catch(n){throw this.metrics.operations.errors++,n}}async load(e){const r=Date.now();try{const t=this.memoryCache.get(e);if(null!==t)return this.metrics.operations.reads++,this.updatePerformanceMetrics("read",Date.now()-r),this.metrics.performance.cacheHitRate=this.memoryCache.getHitRate(),t;const n=await this.circuitBreaker.execute(async()=>this.loadFromStorage(e));return n&&this.memoryCache.set(e,n),this.metrics.operations.reads++,this.updatePerformanceMetrics("read",Date.now()-r),this.metrics.performance.cacheHitRate=this.memoryCache.getHitRate(),n}catch(t){throw this.metrics.operations.errors++,t}}async clear(e){try{this.memoryCache.delete(e),this.writeQueue.delete(e),await this.circuitBreaker.execute(async()=>{await this.clearFromStorage(e)})}catch(r){throw this.metrics.operations.errors++,r}}getMetrics(){return{...this.metrics}}resetMetrics(){this.metrics={operations:{reads:0,writes:0,errors:0},performance:{avgReadTime:0,avgWriteTime:0,cacheHitRate:0}}}scheduleWrite(){this.writeTimeout&&clearTimeout(this.writeTimeout),this.writeTimeout=setTimeout(async()=>{await this.flushWriteQueue()},100)}async flushWriteQueue(){if(0===this.writeQueue.size)return;const e=Array.from(this.writeQueue.entries());this.writeQueue.clear();try{await this.circuitBreaker.execute(async()=>{await this.batchWriteToStorage(e)})}catch(r){e.forEach(([e,r])=>{this.writeQueue.set(e,r)})}}async loadFromStorage(e){return this.withRetry(async()=>{try{const r=localStorage.getItem(e);return r?JSON.parse(r):null}catch(r){return null}})}async batchWriteToStorage(e){e.forEach(([e,r])=>{try{localStorage.setItem(e,JSON.stringify(r))}catch(t){throw t}})}async clearFromStorage(e){return this.withRetry(async()=>{try{localStorage.removeItem(e)}catch(r){throw r}})}async withRetry(e,r=3,t=1e3){for(let i=1;i<=r;i++)try{return await e()}catch(n){if(i===r)throw n;const e=t*2**(i-1);await new Promise(r=>setTimeout(r,e))}throw new Error("Max retries exceeded")}updatePerformanceMetrics(e,r){const t="read"===e?"avgReadTime":"avgWriteTime",n=this.metrics.performance[t];this.metrics.performance[t]=this.updateAverage(n,r)}updateAverage(e,r){return 0===e?r:(e+r)/2}}const Xn=Qn.getInstance(),Zn="unified_worker_token_credentials",ei="unified_worker_token";class ri{static instance;constructor(){}static getInstance(){return ri.instance||(ri.instance=new ri),ri.instance}async saveCredentials(e){const r={credentials:e,savedAt:Date.now()};await Xn.save(Zn,r)}async loadCredentials(){try{const e=await Xn.load(Zn);return e?.credentials?e.credentials:null}catch(e){return null}}async saveToken(e,r){const t=await this.loadCredentials();if(!t)throw new Error("No credentials found. Save credentials first.");const n={token:e,credentials:t,savedAt:Date.now(),...r};await Xn.save(ei,n)}async loadTokenData(){try{const e=await Xn.load(ei);return e?.token?e:null}catch(e){return null}}async getToken(){const e=await this.loadTokenData();return e?e.expiresAt&&Date.now()>e.expiresAt?(await this.clearToken(),null):(e.lastUsedAt=Date.now(),await Xn.save(ei,e),e.token):null}async getStatus(){const e=await this.loadCredentials(),r=await this.loadTokenData(),t=r?.expiresAt,n=r?.savedAt,i=r?.lastUsedAt;return{hasCredentials:!!e,hasToken:!!r?.token,tokenValid:this.isTokenValid(r),tokenExpiresIn:t?Math.floor((t-Date.now())/1e3):void 0,lastFetchedAt:n,lastUsedAt:i,appInfo:e?{appId:e.appId,appName:e.appName,appVersion:e.appVersion}:void 0}}async clearCredentials(){await Xn.clear(Zn),await this.clearToken()}async clearToken(){await Xn.clear(ei)}getMetrics(){return Xn.getMetrics()}resetMetrics(){Xn.resetMetrics()}isTokenValid(e){if(!e)return!1;const r=Date.now();return!e.expiresAt||e.expiresAt>r+3e5}async migrateLegacyCredentials(){const e=["v8:worker_token","pingone_worker_token_credentials","worker_token","worker_credentials"];for(const t of e)try{const e=localStorage.getItem(t);if(e){const r=JSON.parse(e),n={environmentId:r.environmentId||r.environment_id,clientId:r.clientId||r.client_id,clientSecret:r.clientSecret||r.client_secret,scopes:r.scopes||(r.scope?r.scope.split(/\s+/):void 0),region:r.region||"us",customDomain:r.customDomain,tokenEndpointAuthMethod:r.tokenEndpointAuthMethod||r.authMethod||"client_secret_post",appId:r.appId||"legacy-app",appName:r.appName||"Legacy Worker Token App",appVersion:r.appVersion||"1.0.0"};if(!n.environmentId||!n.clientId||!n.clientSecret)continue;return await this.saveCredentials(n),localStorage.removeItem(t),n}}catch(r){}return null}}const ti=ri.getInstance();class ni{static instance;tokenCache=null;fetchPromise=null;constructor(){}static getInstance(){return ni.instance||(ni.instance=new ni),ni.instance}async getWorkerToken(){if(this.tokenCache&&this.isTokenValid(this.tokenCache)){this.getTokenExpiresIn(this.tokenCache);return this.tokenCache.access_token}const e=await this.loadStoredToken();if(e&&this.isTokenValid(e)){this.getTokenExpiresIn(e);return this.tokenCache=e,e.access_token}return await this.fetchNewToken()}async getStatus(){const e=await this.loadCredentials(),r=this.tokenCache||await this.loadStoredToken();return{hasCredentials:!!e,hasToken:!!r,tokenValid:!!r&&this.isTokenValid(r),tokenExpiresIn:r?this.getTokenExpiresIn(r):void 0,lastFetchedAt:r?.fetchedAt||void 0}}async saveCredentials(e){await ti.saveCredentials(e),this.tokenCache=null,await this.clearStoredToken()}async loadCredentials(){const e=await ti.loadCredentials();return e?{environmentId:e.environmentId,clientId:e.clientId,clientSecret:e.clientSecret,scopes:e.scopes||[],region:e.region||"us",tokenEndpoint:e.tokenEndpoint||""}:null}async refreshToken(){return this.tokenCache=null,await this.fetchNewToken()}invalidateToken(){this.tokenCache=null}async clearAll(){this.tokenCache=null,await ti.clearCredentials()}async fetchNewToken(){if(this.fetchPromise){return(await this.fetchPromise).access_token}this.fetchPromise=this.performTokenFetch();try{return(await this.fetchPromise).access_token}finally{this.fetchPromise=null}}async performTokenFetch(){const e=await this.loadCredentials();if(!e)throw new Error("Worker Token credentials not configured");let r=null;for(let n=1;n<=3;n++)try{const r=await fetch(e.tokenEndpoint,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"client_credentials",client_id:e.clientId,client_secret:e.clientSecret,scope:e.scopes.join(" ")})});if(!r.ok){const e=await r.text();throw new Error(`Token fetch failed: ${r.status} ${r.statusText} - ${e}`)}const t=await r.json(),n={...t,fetchedAt:Date.now(),expiresAt:Date.now()+1e3*t.expires_in};return this.tokenCache=n,await this.saveToken(n),this.broadcastTokenRefresh(n),n}catch(t){if(r=t,n<3){const e=2**(n-1)*1e3;await new Promise(r=>setTimeout(r,e))}}throw new Error(`Failed to fetch Worker Token after 3 attempts: ${r?.message}`)}isTokenValid(e){const r=Date.now();return e.expiresAt>r+3e5}getTokenExpiresIn(e){return Math.floor((e.expiresAt-Date.now())/1e3)}async saveToken(e){await ti.saveToken(e.access_token,{expiresIn:e.expires_in,scope:e.scope})}async loadStoredToken(){const e=await ti.getToken();return e?{access_token:e,token_type:"Bearer",expires_in:3600,scope:"worker",fetchedAt:Date.now(),expiresAt:Date.now()+36e5}:null}async clearStoredToken(){await ti.clearToken()}broadcastTokenRefresh(e){window.dispatchEvent(new CustomEvent("worker-token-refreshed",{detail:{expiresAt:e.expiresAt,expiresIn:this.getTokenExpiresIn(e)}}))}}const ii=ni.getInstance(),oi=()=>{const[r,t]=e.useState({token:null,isValid:!1,isLoading:!0,error:null,message:"Checking global worker token status..."}),n=e.useCallback(async()=>{try{t(e=>({...e,isLoading:!0,error:null}));localStorage.getItem("unified_worker_token");const e=await ii.getWorkerToken();t({token:e,isValid:!0,isLoading:!1,error:null,message:"Global worker token is valid and ready"})}catch(e){const r=e instanceof Error?e.message:"Failed to get global worker token";t({token:null,isValid:!1,isLoading:!1,error:r,message:r})}},[]);return e.useEffect(()=>{n()},[n]),r},si=async({environmentId:e,accessToken:r,identifier:t})=>{if(!e||""===e.trim())throw new Error("Environment ID is required");if(!r||""===r.trim())throw new Error("Access token is required");if(!t||""===t.trim())throw new Error("User identifier is required");const n=`/pingone-api/v1/environments/${encodeURIComponent(e)}/users`,i=await se("/api/pingone/users/lookup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:e,accessToken:r,identifier:t}),actualPingOneUrl:n});if(!i.ok){if(500===i.status){const e=new Error("BACKEND_SERVER_ERROR");throw e.isServerError=!0,e}if(401===i.status)throw new Error("Worker token is unauthorized or expired. Generate a new worker token with p1:read:user scope.");if(403===i.status)throw new Error("Worker token lacks required permissions. Ensure it includes p1:read:user scope.");if(400===i.status)throw new Error("PingOne rejected the lookup request. Verify the user identifier format and try again.");const e=await(async e=>{try{return await e.json()}catch{return{}}})(i);throw new Error(e?.error_description||e?.message||e?.error||"Unable to locate user with the provided identifier.")}return await i.json()},ai=(e,r="Not available",t=["name","displayName","label","description","type","value"])=>{if(!e)return r;if("string"==typeof e&&e.trim())return e.trim();if("object"==typeof e)for(const n of t){const r=e[n];if("string"==typeof r&&r.trim())return r.trim()}return r},li=e=>{if(!e)return"N/A";if("string"==typeof e)return e;if("number"==typeof e)return String(e);const r=ai(e,null,["name","displayName","id","title","description","value"]);if(r)return r;if("object"==typeof e&&null!==e){const r=e;if("id"in r&&null!==r.id&&void 0!==r.id)return String(r.id);if("population"in r)return li(r.population)}return"N/A"},di=e=>{if(!e)return null;if("string"==typeof e&&e.trim())return e.trim();if("object"==typeof e){return ai(e,"",["name","displayName","type","value","method"])||null}return null},ci=e=>{if(!e)return[];if(Array.isArray(e)){const r=e.map(e=>di(e)).filter(e=>Boolean(e));return Array.from(new Set(r.map(e=>e.trim())))}const r=di(e);return r?[r]:[]},mi=e=>{const r=new Map;return e.forEach(e=>{const t=ai(e,"Consent",["name","type","description","label"])||"Consent",n=ai(e.status,"unknown",["status","state"])||"unknown";r.set(t,n)}),r},ui=e=>{const r=e.trim().toLowerCase();return["granted","active","enabled","accepted","allow","allowed","approved","true","consented"].includes(r)},pi=()=>{try{const e=localStorage.getItem("worker_token")||"",r=localStorage.getItem("worker_token_expires_at"),t=r?Number(r):null,n=Boolean(e),i="number"==typeof t&&Number.isFinite(t),o=i&&t<Date.now(),{relative:s,absolute:a}=(e=>{if(!e)return{relative:"Expiration time unavailable. Generate a new worker token.",absolute:"Unknown expiration"};const r=e-Date.now(),t=new Date(e).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),n=Math.round(Math.abs(r)/6e4),i=Math.floor(n/60),o=n%60,s=()=>i>0&&o>0?`${i}h ${o}m`:i>0?`${i}h`:`${n||1}m`;return r<=0?{relative:`Expired ${s()} ago`,absolute:t}:{relative:`Expires in ${s()}`,absolute:t}})(t);return{hasToken:n,expiresAt:i?t:null,isExpired:o,relativeDescription:n?s:"No worker token found. Generate one to continue.",absoluteDescription:a}}catch(e){return{hasToken:!1,expiresAt:null,isExpired:!1,relativeDescription:"No worker token found. Generate one to continue.",absoluteDescription:"Unknown expiration"}}},hi=F.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 2rem;
	background: #f8fafc;
	min-height: 100vh;
`,gi=F.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 2rem;
	padding: 1.5rem;
	background: white;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,fi=F.div`
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 1.5rem;
	font-weight: 600;
`,xi=F.div`
	flex: 1;
	h1 {
		margin: 0;
		font-size: 1.875rem;
		font-weight: 700;
		color: #1f2937;
	}
	.subtitle {
		color: #6b7280;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}
`,bi=F.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	margin-top: 0.5rem;
	font-size: 0.8125rem;
	font-weight: 500;
	color: ${({$variant:e})=>{switch(e){case"valid":return"#047857";case"expired":return"#b45309";default:return"#b91c1c"}}};
`,yi=F.table`
	width: 100%;
	border-collapse: collapse;
	font-size: 0.875rem;
	margin-top: 1rem;
`,ji=F.th`
	text-align: left;
	padding: 0.75rem;
	background: #f8fafc;
	border-bottom: 1px solid #e2e8f0;
	font-size: 0.875rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: #475569;
`,wi=F.td`
	padding: 0.75rem;
	border-bottom: 1px solid #e2e8f0;
	vertical-align: top;
	color: ${({$emphasize:e})=>e?"#1f2937":"#475569"};
	font-weight: ${({$emphasize:e})=>e?600:500};
`,ki=F.span`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	background: ${({$active:e})=>e?"#dcfce7":"#fee2e2"};
	color: ${({$active:e})=>e?"#166534":"#991b1b"};
`,vi=F.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1.5rem;
	border-bottom: 2px solid #e5e7eb;
`,Si=F.button`
	padding: 0.75rem 1.5rem;
	border: none;
	background: none;
	cursor: pointer;
	font-size: 0.875rem;
	font-weight: 500;
	color: ${e=>e.$active?"#3b82f6":"#6b7280"};
	border-bottom: 2px solid ${e=>e.$active?"#3b82f6":"transparent"};
	margin-bottom: -2px;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;

	&:hover {
		color: ${e=>e.$active?"#3b82f6":"#374151"};
	}
`,Ci=F.div`
	padding: 1rem 1.5rem;
	background: #fef3c7;
	border: 1px solid #fbbf24;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #92400e;

	svg {
		flex-shrink: 0;
	}
`,Ii=F.div`
	background: white;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,Ti=F.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid #e5e7eb;

	h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.timestamp {
		color: #6b7280;
		font-size: 0.875rem;
	}
`,Ei=F.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 1.5rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`,_i=F.div`
	.field-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.field-value {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 500;

		.copy-btn {
			opacity: 0;
			transition: opacity 0.2s;
			cursor: pointer;
			color: #3b82f6;
		}
	}

	&:hover .copy-btn {
		opacity: 1;
	}

	.verification-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		margin-left: 0.5rem;
	}

	.verified {
		background: #dcfce7;
		color: #166534;
	}

	.not-verified {
		background: #fee2e2;
		color: #991b1b;
	}
`,Ai=F.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
`,Ri=F.div`
	padding: 1.5rem;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	border-radius: 0.5rem;
	border: 1px solid #e5e7eb;
	text-align: center;

	.icon {
		font-size: 2rem;
		margin-bottom: 0.75rem;
		color: #3b82f6;
	}

	.value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.label {
		font-size: 0.875rem;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
`,zi=F.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`,Oi=F.span`
	background: #f1f5f9;
	color: #0f172a;
	padding: 0.3rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
`,Pi=F.div`
	margin-top: 1.5rem;
`,$i=F.h4`
	margin: 0 0 0.5rem;
	font-size: 0.9rem;
	font-weight: 600;
	color: #0f172a;
`,Ni=F.div`
	padding: 3rem;
	text-align: center;
	color: #6b7280;
`,Di=F.div`
	padding: 2rem;
	background: #fee2e2;
	border: 1px solid #fca5a5;
	border-radius: 0.5rem;
	color: #991b1b;
	text-align: center;
`,Ui=F.div`
	background: white;
	border-radius: 0.75rem;
	padding: 2rem;
	max-width: 600px;
	margin: 2rem auto;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,Li=F.div`
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	backdrop-filter: blur(4px);
`,Wi=F.div`
	background: white;
	border-radius: 0.75rem;
	padding: 2rem;
	max-width: 550px;
	margin: 1rem;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	border: 3px solid #dc2626;
`,Bi=F.h2`
	font-size: 1.5rem;
	font-weight: 700;
	color: #1f2937;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,Mi=F.p`
	font-size: 1rem;
	color: #374151;
	line-height: 1.6;
	margin: 0 0 1.5rem 0;
`,Fi=F.div`
	font-size: 0.9rem;
	color: #374151;
	line-height: 1.6;
	margin: 0 0 1.5rem 0;
	padding: 1rem;
	background: #f3f4f6;
	border-radius: 0.5rem;
	border-left: 4px solid #3b82f6;

	strong {
		color: #1f2937;
		display: block;
		margin-bottom: 0.75rem;
	}

	ol {
		margin: 0;
		padding-left: 1.5rem;
	}

	li {
		margin-bottom: 0.5rem;
	}

	code {
		background: #1f2937;
		color: #10b981;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.85rem;
		font-weight: 600;
	}
`,qi=F.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
`,Ji=F.button`
	padding: 0.75rem 1.5rem;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 200ms ease;

	&:hover {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	&:active {
		transform: translateY(0);
	}
`,Vi=F.div`
	margin-bottom: 1.5rem;
	label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}
	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		&:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}
	}
`,Hi=()=>{je({pageName:"PingOne User Profile",force:!0});const[r]=$(),[i,o]=e.useState("profile"),[a,l]=e.useState(!1),[d,c]=e.useState(null),[u,p]=e.useState(null),[h,g]=e.useState([]),[x,y]=e.useState([]),[w,k]=e.useState(null),[v,S]=e.useState([]),[C,I]=e.useState(null),[T,E]=e.useState(null),_="pingone_user_identifier",z=r.get("userId")||r.get("sub")||localStorage.getItem(_)||"",[O,P]=e.useState(z),[U,L]=e.useState(z),[W,B]=e.useState(()=>{const e=r.get("environmentId"),t=localStorage.getItem("worker_environment_id");if(e)return e;if(t)return t;try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);if(r.credentials?.environmentId)return r.credentials.environmentId}}catch(n){}return""}),[M,F]=e.useState(!0),q=e.useCallback(()=>{p(null),g([]),y([]),k(null),S([]),I(null),P(""),L(""),localStorage.removeItem(_),c(null),l(!1),F(!0),o("profile"),he(null),fe([]),be([]),we(null),ve([]),ce(""),ue(""),Te(null),Ce(!1)},[]),J=oi(),V=J.token||"",[H,G]=e.useState(!1),[Y,K]=e.useState(!1),[Q,ee]=e.useState(()=>ae.getAllCredentials()),[re,te]=e.useState(null),[ie,oe]=e.useState(!1),[se,le]=e.useState(()=>pi()),[de,ce]=e.useState(""),[me,ue]=e.useState(""),[pe,he]=e.useState(null),[ge,fe]=e.useState([]),[xe,be]=e.useState([]),[ye,we]=e.useState(null),[ke,ve]=e.useState([]),[Se,Ce]=e.useState(!1),[Ie,Te]=e.useState(null),Ee=e.useCallback(async e=>{const r=await fetch(`http://localhost:3001/api/pingone/user/${encodeURIComponent(e)}?environmentId=${encodeURIComponent(W)}&accessToken=${encodeURIComponent(V)}`);if(!r.ok){if(401===r.status){const e=new Error("Worker token unauthorized");throw e.status=401,e}let e=`Failed to fetch user profile (${r.status})`;const t=await r.text().catch(()=>"");if(t)try{const r=JSON.parse(t),n=r.error_description||r.message||r.error||r.detail;n&&(e=`${e}: ${n}`)}catch{const r=t.trim();r&&(e=`${e}: ${r}`)}400===r.status&&(e+=" • Verify the user ID and ensure the worker token includes p1:read:user scope.");const n=new Error(e);throw n.status=r.status,n}const t=await r.json(),n=t.id||e;let i=[],o=[],s=null,a=[];try{const[e,r,l,d]=await Promise.all([fetch(`http://localhost:3001/api/pingone/user/${encodeURIComponent(n)}/groups?environmentId=${encodeURIComponent(W)}&accessToken=${encodeURIComponent(V)}`).then(e=>e.ok?e.json():{_embedded:{groups:[]}}).then(e=>e),fetch(`http://localhost:3001/api/pingone/user/${encodeURIComponent(n)}/roles?environmentId=${encodeURIComponent(W)}&accessToken=${encodeURIComponent(V)}`).then(e=>e.ok?e.json():{_embedded:{roles:[]}}),fetch(`http://localhost:3001/api/pingone/user/${encodeURIComponent(n)}/mfa?environmentId=${encodeURIComponent(W)}&accessToken=${encodeURIComponent(V)}`).then(e=>e.ok?e.json():null),fetch(`http://localhost:3001/api/pingone/user/${encodeURIComponent(n)}/consents?environmentId=${encodeURIComponent(W)}&accessToken=${encodeURIComponent(V)}`).then(e=>e.ok?e.json():{_embedded:{consents:[]}})]),c=e._embedded;c&&(Array.isArray(c.groups)?i=c.groups.map(e=>e&&"object"==typeof e&&"group"in e&&e.group&&"object"==typeof e.group?e.group:e):Array.isArray(c.items)?i=c.items.map(e=>e&&"object"==typeof e&&"group"in e&&e.group?e.group:e):Array.isArray(c.memberOfGroups)&&(i=c.memberOfGroups.map(e=>{if(e&&"object"==typeof e){if("group"in e&&e.group&&"object"==typeof e.group)return e.group;if("name"in e||"displayName"in e||"id"in e&&!("group"in e))return e}return e}))),!i.length&&Array.isArray(e)&&(i=e.map(e=>e&&"object"==typeof e&&"group"in e&&e.group?e.group:e)),!i.length&&e&&"object"==typeof e&&"groups"in e&&Array.isArray(e.groups)&&(i=e.groups.map(e=>e&&"object"==typeof e&&"group"in e&&e.group?e.group:e)),!i.length&&e&&"object"==typeof e&&"memberOfGroups"in e&&Array.isArray(e.memberOfGroups)&&(i=e.memberOfGroups.map(e=>e&&"object"==typeof e&&"group"in e&&e.group?e.group:e));const m=r._embedded;m&&(Array.isArray(m.roles)?o=m.roles:Array.isArray(m.items)?o=m.items:Array.isArray(m.roleAssignments)&&(o=m.roleAssignments.map(e=>{if(e&&"object"==typeof e){if("role"in e&&e.role&&"object"==typeof e.role)return e.role;if("name"in e||"displayName"in e||"id"in e)return e}return null}).filter(e=>Boolean(e)))),!o.length&&Array.isArray(r)&&(o=r),!o.length&&Array.isArray(r.roleAssignments)&&(o=r.roleAssignments.map(e=>e.role).filter(e=>Boolean(e))),!o.length&&r&&"object"==typeof r&&"roles"in r&&Array.isArray(r.roles)&&(o=r.roles.map(e=>e&&"object"==typeof e&&"role"in e&&e.role?e.role:e)),!o.length&&r&&"object"==typeof r&&"roleAssignments"in r&&Array.isArray(r.roleAssignments)&&(o=r.roleAssignments.map(e=>e.role).filter(e=>Boolean(e))),s=l;const u=d._embedded;u&&(Array.isArray(u.consents)?a=u.consents:Array.isArray(u.items)&&(a=u.items)),!a.length&&Array.isArray(t.consents)&&(a=(t.consents??[]).filter(Boolean))}catch(l){}return{profile:t,groups:i,roles:o,mfa:s,resolvedId:n,consents:a}},[W,V]),_e=e.useCallback(async e=>{const r=e??U;if(!r||!W||!V)return c("Please provide a User ID, Environment ID, and Worker Token to load a profile."),l(!1),void F(!0);l(!0),c(null);try{const e=await Ee(r);p(e.profile),L(e.resolvedId),g(e.groups),y(e.roles),k(e.mfa),S(e.consents)}catch(t){const e=t?.status,r=t instanceof Error?t.message:"Failed to load user profile";if(401===e||"Worker token unauthorized"===r)return ne.showError("Worker token expired or missing permissions. Please generate a new worker token."),localStorage.removeItem("worker_token"),localStorage.removeItem("worker_token_expires_at"),void F(!0);ne.showError(r),c(r)}finally{l(!1)}},[U,W,V,Ee]);e.useEffect(()=>{if(!u?.population||!W||!V)return void I(null);const e=u.population;if("string"==typeof e&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e))return void I(null);let r=null;if("string"==typeof e)r=e;else if("object"==typeof e&&null!==e){const t=e;if(t.name||t.displayName)return void I(t);r=t.id?String(t.id):null}r?fetch(`http://localhost:3001/api/pingone/population/${encodeURIComponent(r)}?environmentId=${encodeURIComponent(W)}&accessToken=${encodeURIComponent(V)}`).then(e=>e.ok?e.json():null).then(e=>{e&&I(e)}).catch(e=>{}):I(null)},[u?.population,W,V]),e.useEffect(()=>{const e=()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);r.credentials?.environmentId&&!W&&B(r.credentials.environmentId)}}catch(e){}};return window.addEventListener("workerTokenUpdated",e),()=>window.removeEventListener("workerTokenUpdated",e)},[W]),e.useEffect(()=>{if(!pe?.population||!W||!V)return void E(null);let e=null;if("string"==typeof pe.population)e=pe.population;else if("number"==typeof pe.population)e=String(pe.population);else if(pe.population&&"object"==typeof pe.population){const r=pe.population;if(r.name||r.displayName)return void E(r);e=r.id?String(r.id):null}e?fetch(`http://localhost:3001/api/pingone/population/${encodeURIComponent(e)}?environmentId=${encodeURIComponent(W)}&accessToken=${encodeURIComponent(V)}`).then(e=>e.ok?e.json():null).then(e=>{e&&E(e)}).catch(e=>{}):E(null)},[pe?.population,W,V]);const Ae=e.useCallback(async()=>{if(!V)return void ne.showError("Generate a worker token before loading a profile.");if(se.isExpired)return void ne.showError("Worker token expired. Generate a new worker token to continue.");if(!W.trim())return void ne.showError("Please provide an Environment ID");if(!O.trim()){const e="User identifier is required (user ID, username, or email).";return te(e),void ne.showError(e)}te(null),oe(!0);const e=O.trim(),r=W.trim(),t=V.trim();if(!r||!t||!e){const n=[];r||n.push("Environment ID"),t||n.push("Worker Token"),e||n.push("User Identifier");const i=`Missing required fields: ${n.join(", ")}`;return te(i),ne.showError(i),void oe(!1)}try{const i=await si({environmentId:r,accessToken:t,identifier:e}),o=i.user,s=o?.id;if(!s)throw new Error("Unable to find a user matching that identifier.");L(s),p(null),g([]),y([]),k(null),S([]);const a=o?.preferred_username||o?.username||o?.email||e;a&&P(a);try{localStorage.setItem("worker_environment_id",r),localStorage.setItem("worker_token",V),a&&localStorage.setItem(_,a)}catch(n){}F(!1),await _e(s),i.matchType?ne.showSuccess(`User matched by ${i.matchType}.`):ne.showSuccess("User resolved successfully.")}catch(i){if(i instanceof Error&&"isServerError"in i&&i.isServerError)K(!0),te("Backend server is not responding");else{const e=i instanceof Error?i.message:"Unable to resolve user identifier.";te(e),ne.showError(e)}}finally{oe(!1)}},[V,W,O,_e,se.isExpired]),Re=e.useCallback(async()=>{if(!V)return void ne.showError("Generate a worker token before comparing access.");if(se.isExpired)return void ne.showError("Worker token expired. Generate a new worker token to compare access.");if(!W.trim())return void ne.showError("Please provide an Environment ID");if(!de.trim()){const e="Comparison user identifier is required (user ID, username, or email).";return Te(e),void ne.showError(e)}Te(null),Ce(!0);const e=de.trim(),r=W.trim();try{const t=await si({environmentId:r,accessToken:V,identifier:e}),n=t.user,i=n?.id||e;if(!i)throw new Error("Unable to find a user matching that identifier.");const o=await Ee(i);he(o.profile),ue(o.resolvedId),fe(o.groups),be(o.roles),we(o.mfa),ve(o.consents),(n?.preferred_username||n?.username||n?.email)&&ce(n.preferred_username||n.username||n.email||e),t.matchType?ne.showSuccess(`Comparison user matched by ${t.matchType}.`):ne.showSuccess("Comparison user resolved successfully.")}catch(t){if(t instanceof Error&&"isServerError"in t&&t.isServerError)K(!0),Te("Backend server is not responding");else{const e=t instanceof Error?t.message:"Unable to resolve comparison user.";Te(e),ne.showError(e)}}finally{Ce(!1)}},[V,W,de,Ee,se.isExpired]),ze=e.useCallback(()=>{he(null),ue(""),fe([]),be([]),we(null),ve([]),Te(null)},[]);e.useEffect(()=>{M&&(l(!1),c(null))},[M]),e.useEffect(()=>{const e=e=>{e.key&&"worker_token"!==e.key&&"worker_token_expires_at"!==e.key||le(pi()),e.key&&"pingone_permanent_credentials"!==e.key||ee(ae.getAllCredentials())},r=()=>{le(pi())};return window.addEventListener("storage",e),window.addEventListener("workerTokenUpdated",r),()=>{window.removeEventListener("storage",e),window.removeEventListener("workerTokenUpdated",r)}},[]),e.useEffect(()=>{le(pi())},[]),e.useEffect(()=>{se.isExpired&&V&&F(!0)},[se.isExpired,V]);const Oe=e=>{navigator.clipboard.writeText(e),ne.showSuccess("Copied to clipboard!")},Pe=e=>{if("string"!=typeof e){if(e&&"object"==typeof e){const r=e.formatted;if(r&&"string"==typeof r)return Pe(r)}return"U"}const r=e.trim();if(!r)return"U";const t=r.split(" ").filter(Boolean);return t.length>=2?`${t[0][0]}${t[t.length-1][0]}`.toUpperCase():r.substring(0,2).toUpperCase()},$e=e=>{if(!e)return"N/A";return new Date(e).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})};if(a)return t.jsx(hi,{children:t.jsxs(Ni,{children:[t.jsx(b,{className:"animate-spin",size:24,style:{marginBottom:"1rem"}}),t.jsx("p",{children:"Loading user profile..."})]})});if(d)return t.jsx(hi,{children:t.jsxs(Di,{children:[t.jsx(R,{size:24,style:{marginBottom:"1rem"}}),t.jsx("p",{children:d}),t.jsx("button",{type:"button",onClick:()=>_e(),style:{marginTop:"1rem",padding:"0.5rem 1rem",background:"#3b82f6",color:"white",border:"none",borderRadius:"0.375rem",cursor:"pointer"},children:"Retry"})]})});const Ne=J.isValid&&J.token&&!J.isLoading,De=Ne?"valid":J.token?"expired":"missing",Ue=Ne?`Worker token active. ${J.message}.`:J.token?`${J.message}. Refresh before making new API calls.`:J.message,Le="Unknown expiration"!==se.absoluteDescription,We=Ne&&Le?`Valid until ${se.absoluteDescription}.`:se.hasToken&&Le?`Expired on ${se.absoluteDescription}.`:"";if(!u&&M)return t.jsxs(hi,{children:[t.jsxs(Ui,{children:[t.jsx("h2",{style:{marginTop:0,marginBottom:"1.5rem"},children:"Select User to View Profile"}),Ne?t.jsxs(Ci,{style:{background:"#dcfce7",borderColor:"#34d399",color:"#047857",flexDirection:"column",alignItems:"flex-start"},children:[t.jsxs("div",{style:{display:"flex",gap:"0.75rem",alignItems:"center"},children:[t.jsx(f,{}),t.jsxs("span",{children:["Worker token detected. ",se.relativeDescription,"."]})]}),t.jsxs("small",{style:{color:"#065f46",marginLeft:"1.75rem"},children:["Valid until ",se.absoluteDescription,"."]})]}):se.hasToken?t.jsxs(Ci,{style:{flexDirection:"column",alignItems:"flex-start"},children:[t.jsxs("div",{style:{display:"flex",gap:"0.75rem",alignItems:"center"},children:[t.jsx(R,{}),t.jsxs("span",{children:["Worker token found but it has expired. ",se.relativeDescription,"."]})]}),t.jsxs("small",{style:{color:"#92400e",marginLeft:"1.75rem"},children:["Last expiration timestamp: ",se.absoluteDescription,". Generate a fresh worker token to continue."]})]}):t.jsxs(Ci,{children:[t.jsx(R,{}),t.jsx("span",{children:"No worker token found. Generate one to load a user profile."})]}),t.jsxs(Vi,{children:[t.jsx("label",{htmlFor:"environmentId",children:"Environment ID *"}),t.jsx("input",{id:"environmentId",type:"text",value:W,onChange:e=>B(e.target.value),placeholder:"Enter PingOne Environment ID"})]}),Ne&&V&&t.jsx(X,{token:V,tokenExpiryKey:"worker_token_expires_at",message:`Worker token is active and will expire ${se.relativeDescription}. Use it for API calls or generate a new one if needed.`}),t.jsxs("div",{style:{display:"flex",gap:"0.75rem",flexWrap:"wrap",marginBottom:"1rem"},children:[t.jsx("button",{type:"button",onClick:()=>{Ne?ne.showInfo("Worker token already available. Opening modal in case you want to refresh it."):se.hasToken&&ne.showWarning("Stored worker token has expired. Refresh it to continue."),G(!0)},style:{flex:"1 1 200px",padding:"0.75rem",background:J.isLoading?"#6b7280":Ne?"#10b981":se.hasToken?"#f59e0b":"#3b82f6",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:600,cursor:"pointer",opacity:se.hasToken&&!Ne?1:.95},children:J.isLoading?"Loading...":Ne?"Worker Token Ready":se.hasToken?"Refresh Worker Token":"Get Worker Token"}),V&&t.jsx("button",{type:"button",onClick:()=>{localStorage.removeItem("worker_token"),localStorage.removeItem("worker_token_expires_at"),le(pi()),ne.showSuccess("Worker token cleared. Generate a new token to continue.")},style:{flex:"0 0 auto",padding:"0.75rem",background:"#ef4444",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:600,cursor:"pointer"},children:"Clear Token"})]}),t.jsx("div",{style:{width:"100%",color:Ne?"#0f766e":"#b45309",fontSize:"0.75rem",marginBottom:"1.5rem"},children:se.relativeDescription}),t.jsxs(Vi,{children:[t.jsx("label",{htmlFor:"userIdentifier",children:"User Identifier *"}),t.jsx("input",{id:"userIdentifier",type:"text",value:O,onChange:e=>{const r=e.target.value;P(r),te(null);try{r.trim()?localStorage.setItem(_,r):localStorage.removeItem(_)}catch(t){}},placeholder:"Enter user ID, username, or email"}),t.jsx("div",{style:{color:"#64748b",fontSize:"0.75rem"},children:"We will look up the user by ID, username, or email in the selected environment."}),re&&t.jsx("div",{style:{color:"#b91c1c",fontSize:"0.75rem",marginTop:"0.5rem"},children:re})]}),t.jsx("button",{type:"button",onClick:()=>Ae(),disabled:ie||!O.trim()||!W.trim()||!V.trim(),style:{width:"100%",padding:"0.75rem",background:!ie&&O.trim()&&W.trim()&&V.trim()?"#3b82f6":"#9ca3af",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:"600",cursor:!ie&&O.trim()&&W.trim()&&V.trim()?"pointer":"not-allowed"},children:ie?"Resolving user…":"Load User Profile"})]}),t.jsx(Z,{isOpen:H,onClose:()=>G(!1),onContinue:()=>{le(pi()),G(!1),ee(ae.getAllCredentials())},flowType:"pingone-user-profile",environmentId:W,skipCredentialsStep:!0,prefillCredentials:{environmentId:W,clientId:Q?.clientId,clientSecret:Q?.clientSecret,scopes:Q?.scopes?.join(" ")||"p1:read:user"}})]});if(!u&&!M)return t.jsx(hi,{children:t.jsxs(Di,{children:[t.jsx("p",{children:"No user data available. Provide a User ID, Environment ID, and Worker Token using the selector above. Worker tokens cannot determine the user automatically, so enter the user ID manually when prompted."}),t.jsx("button",{type:"button",onClick:()=>F(!0),style:{marginTop:"1rem",padding:"0.5rem 1rem",background:"#3b82f6",color:"white",border:"none",borderRadius:"0.375rem",cursor:"pointer"},children:"Select User"})]})});if(!u)return null;const Be=(()=>{if(!u)return"User";const{name:e}=u;if("string"==typeof e)return e;if(e&&"object"==typeof e){const r=e.formatted;if(r&&"string"==typeof r)return r;const t=[e.givenName||u.given_name,e.familyName].filter(Boolean);if(t.length)return t.join(" ")}return u.given_name||u.preferred_username||u.username||"User"})(),Me=()=>{if(C){const e=ai(C,null,["name","displayName","title","description"]);if(e)return e}return li(u?.population)},Fe=u?.name&&"object"==typeof u.name?u.name:null,qe=u?.given_name||Fe?.givenName||("string"==typeof u?.name?u?.name:""),Je=Fe?.formatted||Be,Ve=u.email??"",He=Boolean(u.email_verified),Ge=void 0===u.enabled?"Unknown":u.enabled?"Enabled":"Disabled",Ye=u.account?.status||Ge,Ke=u.account?.syncState||("string"==typeof u.syncState?u.syncState:"")||"Not available",Qe=(()=>{const e=u.authoritativeIdentityProfile||u.identityProvider;if(!e)return"Not assigned";const r=ai(e,null,["name","displayName","description","title","type"]);if(r&&"Not assigned"!==r)return r;if("object"==typeof e&&null!==e){const r=e;if(r.identityProvider&&"object"==typeof r.identityProvider){const e=ai(r.identityProvider,null,["name","displayName","type"]);if(e)return e}if(r.id)return String(r.id)}return"Not assigned"})(),Xe=ci(u.authenticationMethods),Ze=(()=>{const e=di(u.primaryAuthenticationMethod);if(e)return e;if(Xe.length>0)return Xe[0];if(u&&"object"==typeof u){const e=u,r=di(e.type||e.method||e.authenticationType);if(r)return r}return"Not set"})(),er=(e,r)=>{if(void 0!==e?.enabled)return{enabled:e.enabled,text:e.enabled?e.status?`Enabled (${e.status})`:"Enabled":e.status?`Disabled (${e.status})`:"Disabled"};if(r){const e=r.mfaEnabled,t=r.mfaStatus;if(void 0!==e)return{enabled:e,text:e?"Enabled":"Disabled"};if(t){const e=String(t).toLowerCase();return{enabled:"enabled"===e||"active"===e,text:t}}}return{enabled:!1,text:"Unknown"}},rr=er(w,u),tr=rr.text,nr=mi(v),ir=Array.from(nr.entries()).map(([e,r])=>`${e}: ${r}`),or=(()=>{if(!pe)return"Comparison User";const{name:e}=pe;if("string"==typeof e)return e;if(e&&"object"==typeof e){const r=e.formatted;if(r&&"string"==typeof r)return r;const t=[e.givenName||pe.given_name,e.familyName].filter(Boolean);if(t.length)return t.join(" ")}return pe.given_name||pe.preferred_username||pe.username||"Comparison User"})(),sr=void 0===pe?.enabled?"Unknown":pe.enabled?"Enabled":"Disabled",ar=pe?.account?.status||sr,lr=pe?.account?.syncState||("string"==typeof pe?.syncState?pe.syncState:"")||"Not available",dr=(()=>{if(!pe)return"Not assigned";const e=pe.authoritativeIdentityProfile||pe.identityProvider;if(!e)return"Not assigned";const r=ai(e,null,["name","displayName","description","title","type"]);if(r&&"Not assigned"!==r)return r;if("object"==typeof e&&null!==e){const r=e;if(r.identityProvider&&"object"==typeof r.identityProvider){const e=ai(r.identityProvider,null,["name","displayName","type"]);if(e)return e}if(r.id)return String(r.id)}return"Not assigned"})(),cr=ci(pe?.authenticationMethods),mr=(()=>{if(!pe)return"N/A";const e=di(pe.primaryAuthenticationMethod);if(e)return e;if(cr.length>0)return cr[0];if("object"==typeof pe){const e=pe,r=di(e.type||e.method||e.authenticationType);if(r)return r}return"Not set"})(),ur=er(ye,pe).text,pr=mi(ke),hr=Array.from(pr.entries()).map(([e,r])=>`${e}: ${r}`),gr=h.map(e=>ai(e,null,["name","displayName","title","description"])).filter(e=>Boolean(e?.trim())).map(e=>e.trim()),fr=ge.map(e=>ai(e,null,["name","displayName","title","description"])).filter(e=>Boolean(e?.trim())).map(e=>e.trim()),xr=Array.from(new Set([...gr,...fr])).sort((e,r)=>e.localeCompare(r)),br=Array.from(new Set([...Xe,...cr])).sort((e,r)=>e.localeCompare(r)),yr=Array.from(new Set([...nr.keys(),...pr.keys()])).sort((e,r)=>e.localeCompare(r)),jr=Boolean(pe),wr=u?.preferred_username||u?.username||"N/A",kr=pe?.preferred_username||pe?.username||"N/A",vr=[{label:"User ID",primary:u?.id||U||"N/A",secondary:pe?.id||me||"N/A"},{label:"Username",primary:wr,secondary:jr?kr:"N/A"},{label:"Enabled",primary:Ge,secondary:jr?sr:"N/A"},{label:"Account Status",primary:Ye,secondary:jr?ar:"N/A"},{label:"Primary Authentication Method",primary:Ze,secondary:jr?mr:"N/A"},{label:"Authoritative Identity Profile",primary:Qe,secondary:jr?dr:"N/A"},{label:"MFA Status",primary:tr,secondary:jr?ur:"N/A"},{label:"Sync Status",primary:Ke,secondary:jr?lr:"N/A"},{label:"Population",primary:Me(),secondary:jr?(()=>{if(T){const e=ai(T,null,["name","displayName","title","description"]);if(e)return e}return li(pe?.population)})():"N/A"},{label:"Group Count",primary:h.length.toString(),secondary:jr?ge.length.toString():"N/A"},{label:"Role Count",primary:x.length.toString(),secondary:jr?xe.length.toString():"N/A"},{label:"Authentication Methods",primary:Xe.length?Xe.join(", "):"None",secondary:jr?cr.length?cr.join(", "):"None":"N/A"},{label:"Consent Records",primary:ir.length?ir.join(", "):"None",secondary:jr?hr.length?hr.join(", "):"None":"N/A"}];return t.jsxs(hi,{children:[t.jsxs(gi,{children:[t.jsx(fi,{children:Pe(Be)}),t.jsxs(xi,{children:[t.jsx("h1",{children:Be}),t.jsx("div",{className:"subtitle",children:"Identity Management"}),t.jsxs(bi,{$variant:De,children:["valid"===De?t.jsx(f,{size:16}):t.jsx(R,{size:16}),t.jsxs("div",{children:[Ue,We&&t.jsx("div",{style:{fontSize:"0.75rem",color:"#475569",marginTop:"0.125rem"},children:We})]})]})]}),t.jsxs("button",{type:"button",onClick:q,style:{padding:"0.5rem 1rem",background:"#ef4444",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:"500",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem",marginLeft:"auto"},title:"Start over and select a different user",children:[t.jsx(b,{size:16}),"Start Over"]})]}),t.jsxs(vi,{children:[t.jsxs(Si,{$active:"profile"===i,onClick:()=>o("profile"),children:[t.jsx(A,{})," Profile"]}),t.jsxs(Si,{$active:"user-status"===i,onClick:()=>o("user-status"),children:[t.jsx(f,{})," User Status"]}),t.jsxs(Si,{$active:"compare-access"===i,onClick:()=>o("compare-access"),children:[t.jsx(s,{})," Compare Access"]})]}),"DORMANT"===u.account?.status&&t.jsxs(Ci,{children:[t.jsx(R,{size:20}),t.jsx("span",{children:"Dormant Account Alert"})]}),"profile"===i&&t.jsxs(t.Fragment,{children:[t.jsxs(Ii,{children:[t.jsx(Ti,{children:t.jsxs("h2",{children:[t.jsx(j,{})," Profile Details"]})}),t.jsxs(Ei,{children:[t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"User ID"}),t.jsxs("div",{className:"field-value",children:[u.id||U||"N/A",t.jsx(m,{size:14,className:"copy-btn",onClick:()=>Oe(u.id||U||"")})]})]}),t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"Given Name"}),t.jsxs("div",{className:"field-value",children:[qe||"N/A",t.jsx(m,{size:14,className:"copy-btn",onClick:()=>Oe(qe||Je||"")})]})]}),t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"Username"}),t.jsxs("div",{className:"field-value",children:[u.preferred_username||u.username||"N/A",t.jsx(m,{size:14,className:"copy-btn",onClick:()=>Oe(u.preferred_username||u.username||"")})]})]}),t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"Email"}),t.jsxs("div",{className:"field-value",children:[Ve||"N/A",Ve&&t.jsxs(t.Fragment,{children:[t.jsx(m,{size:14,className:"copy-btn",onClick:()=>Oe(Ve)}),t.jsx("span",{className:"verification-badge "+(He?"verified":"not-verified"),children:He?t.jsxs(t.Fragment,{children:[t.jsx(f,{size:12})," Verified"]}):t.jsxs(t.Fragment,{children:[t.jsx(n,{size:12})," Not Verified"]})})]})]})]}),t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"Created Date"}),t.jsx("div",{className:"field-value",children:$e(u.createdAt||u.created_at||"")})]}),t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"Last Updated"}),t.jsx("div",{className:"field-value",children:$e(u.updatedAt||u.updated_at||"")})]}),t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"Population"}),t.jsx("div",{className:"field-value",children:Me()})]})]})]}),t.jsxs(Ii,{children:[t.jsxs(Ti,{children:[t.jsxs("h2",{children:[t.jsx(j,{})," Other Information"]}),t.jsx("span",{className:"timestamp",children:(new Date).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})})]}),t.jsxs(Ai,{children:[t.jsxs(Ri,{children:[t.jsx("div",{className:"icon",children:t.jsx(N,{})}),t.jsx("div",{className:"value",children:Me()}),t.jsx("div",{className:"label",children:"Department Population"})]}),t.jsxs(Ri,{children:[t.jsx("div",{className:"icon",style:{color:"#10b981"},children:t.jsx(N,{})}),t.jsx("div",{className:"value",children:h.length}),t.jsx("div",{className:"label",children:"Group Count"})]}),t.jsxs(Ri,{children:[t.jsx("div",{className:"icon",style:{color:rr.enabled?"#10b981":"#ef4444"},children:t.jsx(D,{})}),t.jsx("div",{className:"value",children:rr.text}),t.jsx("div",{className:"label",children:"MFA Status"})]}),t.jsxs(Ri,{children:[t.jsx("div",{className:"icon",style:{color:"#8b5cf6"},children:t.jsx(s,{})}),t.jsx("div",{className:"value",children:x.length}),t.jsx("div",{className:"label",children:"Roles"})]})]})]}),t.jsxs(Ii,{children:[t.jsx(Ti,{children:t.jsxs("h2",{children:[t.jsx(N,{})," Group Memberships"]})}),h.length?t.jsx(zi,{children:h.map((e,r)=>{const n=ai(e,null,["name","displayName","title","description"]);return t.jsx(Oi,{children:n||`Group ${r+1}`},e.id||n||`group-${r}`)})}):t.jsx("p",{style:{color:"#64748b",margin:0},children:"No group memberships found for this user."})]})]}),"user-status"===i&&t.jsxs(Ii,{children:[t.jsx(Ti,{children:t.jsxs("h2",{children:[t.jsx(f,{})," User Status Overview"]})}),t.jsxs(Ei,{children:[t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"Enabled"}),t.jsx("div",{className:"field-value",children:Ge})]}),t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"Account Status"}),t.jsx("div",{className:"field-value",children:Ye})]}),t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"Primary Authentication Method"}),t.jsx("div",{className:"field-value",children:Ze})]}),t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"Authoritative Identity Profile"}),t.jsx("div",{className:"field-value",children:Qe})]}),t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"MFA Status"}),t.jsx("div",{className:"field-value",children:tr})]}),t.jsxs(_i,{children:[t.jsx("div",{className:"field-label",children:"Sync Status"}),t.jsx("div",{className:"field-value",children:Ke})]})]}),t.jsxs(Pi,{children:[t.jsx($i,{children:"Authentication Methods"}),Xe.length?t.jsx(zi,{children:Xe.map(e=>t.jsx(Oi,{children:e},e))}):t.jsx("p",{style:{color:"#64748b",margin:0},children:"No authentication methods recorded."})]}),t.jsxs(Pi,{children:[t.jsx($i,{children:"Consent Records"}),nr.size?t.jsx(zi,{children:ir.map((e,r)=>t.jsx(Oi,{children:e},`${e}-${r}`))}):t.jsx("p",{style:{color:"#64748b",margin:0},children:"No consent records."})]})]}),"compare-access"===i&&t.jsxs(t.Fragment,{children:[t.jsxs(Ii,{children:[t.jsxs(Ti,{children:[t.jsxs("h2",{children:[t.jsx(s,{})," Compare Access"]}),jr&&t.jsxs("span",{className:"timestamp",children:["Comparing ",Be," vs ",or]})]}),!jr&&t.jsx("p",{style:{color:"#64748b",marginBottom:"1rem"},children:"Enter a second user identifier to compare entitlements, groups, roles, and authentication settings side-by-side."}),Ie&&t.jsxs(Ci,{style:{marginBottom:"1rem"},children:[t.jsx(R,{}),t.jsx("span",{children:Ie})]}),t.jsxs(Vi,{children:[t.jsx("label",{htmlFor:"compareIdentifier",children:"Comparison User Identifier *"}),t.jsx("input",{id:"compareIdentifier",type:"text",value:de,onChange:e=>{ce(e.target.value),Te(null)},placeholder:"Enter user ID, username, or email"}),t.jsx("div",{style:{color:"#64748b",fontSize:"0.75rem"},children:"We will resolve the identifier using the same environment and worker token."})]}),t.jsxs("div",{style:{display:"flex",gap:"0.75rem",flexWrap:"wrap",marginBottom:jr?"0":"0.5rem"},children:[t.jsx("button",{type:"button",onClick:()=>Re(),disabled:Se||!de.trim()||!W.trim()||!V.trim(),style:{flex:"0 0 auto",padding:"0.75rem 1.5rem",background:!Se&&de.trim()&&W.trim()&&V.trim()?"#2563eb":"#9ca3af",color:"#ffffff",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:600,cursor:!Se&&de.trim()&&W.trim()&&V.trim()?"pointer":"not-allowed"},children:Se?"Resolving comparison user…":"Load Comparison User"}),jr&&t.jsx("button",{type:"button",onClick:()=>ze(),style:{flex:"0 0 auto",padding:"0.75rem 1.5rem",background:"#e2e8f0",color:"#1f2937",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:600,cursor:"pointer"},children:"Clear Comparison"})]}),Se&&t.jsxs(Ni,{children:[t.jsx(b,{className:"animate-spin",size:20,style:{marginBottom:"0.75rem"}}),t.jsx("p",{children:"Loading comparison data…"})]})]}),jr&&t.jsxs(t.Fragment,{children:[t.jsxs(Ii,{children:[t.jsxs(Ti,{children:[t.jsxs("h2",{children:[t.jsx(s,{})," Access Summary"]}),t.jsx("span",{className:"timestamp",children:(new Date).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})})]}),t.jsxs(yi,{children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx(ji,{children:"Setting"}),t.jsx(ji,{children:Be}),t.jsx(ji,{children:or})]})}),t.jsx("tbody",{children:vr.map(e=>t.jsxs("tr",{children:[t.jsx(wi,{$emphasize:!0,children:e.label}),t.jsx(wi,{children:e.primary}),t.jsx(wi,{children:e.secondary})]},e.label))})]})]}),t.jsxs(Ii,{children:[t.jsx(Ti,{children:t.jsxs("h2",{children:[t.jsx(N,{})," Group Membership"]})}),xr.length?t.jsxs(yi,{children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx(ji,{children:"Group"}),t.jsx(ji,{children:Be}),t.jsx(ji,{children:or})]})}),t.jsx("tbody",{children:xr.map(e=>{const r=gr.includes(e),i=fr.includes(e);return t.jsxs("tr",{children:[t.jsx(wi,{$emphasize:!0,children:e}),t.jsx(wi,{children:t.jsxs(ki,{$active:r,children:[r?t.jsx(f,{size:12}):t.jsx(n,{size:12}),r?"Assigned":"Not assigned"]})}),t.jsx(wi,{children:t.jsxs(ki,{$active:i,children:[i?t.jsx(f,{size:12}):t.jsx(n,{size:12}),i?"Assigned":"Not assigned"]})})]},e)})})]}):t.jsx("p",{style:{color:"#64748b",margin:0},children:"No group memberships for either user."})]}),t.jsxs(Ii,{children:[t.jsx(Ti,{children:t.jsxs("h2",{children:[t.jsx(D,{})," Authentication Methods"]})}),br.length?t.jsxs(yi,{children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx(ji,{children:"Method"}),t.jsx(ji,{children:Be}),t.jsx(ji,{children:or})]})}),t.jsx("tbody",{children:br.map(e=>{const r=Xe.includes(e),i=cr.includes(e);return t.jsxs("tr",{children:[t.jsx(wi,{$emphasize:!0,children:e}),t.jsx(wi,{children:t.jsxs(ki,{$active:r,children:[r?t.jsx(f,{size:12}):t.jsx(n,{size:12}),r?"Available":"Unavailable"]})}),t.jsx(wi,{children:t.jsxs(ki,{$active:i,children:[i?t.jsx(f,{size:12}):t.jsx(n,{size:12}),i?"Available":"Unavailable"]})})]},e)})})]}):t.jsx("p",{style:{color:"#64748b",margin:0},children:"No authentication methods recorded for either user."})]}),t.jsxs(Ii,{children:[t.jsx(Ti,{children:t.jsxs("h2",{children:[t.jsx(f,{})," Consent Records"]})}),yr.length?t.jsxs(yi,{children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx(ji,{children:"Consent"}),t.jsx(ji,{children:Be}),t.jsx(ji,{children:or})]})}),t.jsx("tbody",{children:yr.map(e=>{const r=nr.get(e)??"Not recorded",i=pr.get(e)??"Not recorded",o=ui(r),s=ui(i);return t.jsxs("tr",{children:[t.jsx(wi,{$emphasize:!0,children:e}),t.jsx(wi,{children:t.jsxs(ki,{$active:o,children:[o?t.jsx(f,{size:12}):t.jsx(n,{size:12}),r]})}),t.jsx(wi,{children:t.jsxs(ki,{$active:s,children:[s?t.jsx(f,{size:12}):t.jsx(n,{size:12}),i]})})]},e)})})]}):t.jsx("p",{style:{color:"#64748b",margin:0},children:"No consent records for either user."})]})]})]}),t.jsx(Z,{isOpen:H,onClose:()=>G(!1),onContinue:()=>{le(pi()),G(!1),ee(ae.getAllCredentials())},flowType:"pingone-user-profile",environmentId:W,skipCredentialsStep:!0,prefillCredentials:{environmentId:W,clientId:Q?.clientId,clientSecret:Q?.clientSecret,scopes:Q?.scopes?.join(" ")||"p1:read:user"}}),Y&&t.jsx(Li,{onClick:()=>K(!1),children:t.jsxs(Wi,{onClick:e=>e.stopPropagation(),children:[t.jsxs(Bi,{children:[t.jsx(R,{size:28,style:{color:"#dc2626"}}),"Backend Server Not Running"]}),t.jsx(Mi,{children:"The backend server returned a 500 error, which usually means the server is not running or has crashed."}),t.jsxs(Fi,{children:[t.jsx("strong",{children:"To fix this issue:"}),t.jsxs("ol",{children:[t.jsx("li",{children:"Open a new terminal window"}),t.jsx("li",{children:"Navigate to the project directory"}),t.jsxs("li",{children:["Run: ",t.jsx("code",{children:"./run.sh"})]}),t.jsx("li",{children:"Wait for the servers to start"}),t.jsx("li",{children:"Try your request again"})]})]}),t.jsx(qi,{children:t.jsx(Ji,{onClick:()=>K(!1),children:"Close"})})]})})]})},Gi=F.div`
	width: 100%;
	max-width: 100%;
	padding: 2rem;
	box-sizing: border-box;
	overflow-x: auto;
	min-width: 0;

	@media (max-width: 1024px) {
		padding: 1rem;
	}
`,Yi=F.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 2rem 1.5rem 4rem;
	display: flex;
	flex-direction: column;
	gap: 1.75rem;
`,Ki=F.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.75rem;
	border-radius: 1rem;
	background: linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(14, 165, 233, 0.04));
	border: 1px solid rgba(6, 182, 212, 0.2);
`,Qi=F.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #0891b2;
`,Xi=F.h1`
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
`,Zi=F.p`
	margin: 0;
	color: #0e7490;
	max-width: 720px;
	line-height: 1.6;
`,eo=F.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
`,ro=F.div`
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
`,to=F.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	${({$variant:e="secondary"})=>{switch(e){case"primary":return"\n\t\t\t\t\tbackground: #3b82f6;\n\t\t\t\t\tcolor: white;\n\t\t\t\t\t&:hover { background: #2563eb; }\n\t\t\t\t";case"danger":return"\n\t\t\t\t\tbackground: #ef4444;\n\t\t\t\t\tcolor: white;\n\t\t\t\t\t&:hover { background: #dc2626; }\n\t\t\t\t";default:return"\n\t\t\t\t\tbackground: #f1f5f9;\n\t\t\t\t\tcolor: #475569;\n\t\t\t\t\t&:hover { background: #e2e8f0; }\n\t\t\t\t"}}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`,no=F.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 2rem;
	border-bottom: 2px solid #e2e8f0;
`,io=F.button`
	padding: 0.75rem 1.5rem;
	border: none;
	background: none;
	font-size: 0.875rem;
	font-weight: 600;
	color: ${({$active:e})=>e?"#3b82f6":"#64748b"};
	cursor: pointer;
	border-bottom: 2px solid ${({$active:e})=>e?"#3b82f6":"transparent"};
	margin-bottom: -2px;
	transition: all 0.2s;

	&:hover {
		color: #3b82f6;
	}
`,oo=F.div`
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,so=F.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
`,ao=F.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1e293b;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,lo=F.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-bottom: 1rem;
`,co=F.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: #475569;
`,mo=F.input`
	padding: 0.75rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	color: #1e293b;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`,uo=F.input`
	width: 1.25rem;
	height: 1.25rem;
	cursor: pointer;
`,po=F.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`,ho=F.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1.25rem;
	display: flex;
	justify-content: space-between;
	align-items: start;
	gap: 1rem;
`,go=F.div`
	flex: 1;
`,fo=F.div`
	font-size: 1rem;
	font-weight: 600;
	color: #1e293b;
	margin-bottom: 0.5rem;
`,xo=F.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	font-size: 0.875rem;
	color: #64748b;
`,bo=F.div`
	display: flex;
	gap: 0.5rem;
`,yo=F.span`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;
	background: ${({$enabled:e})=>e?"#dcfce7":"#fee2e2"};
	color: ${({$enabled:e})=>e?"#166534":"#991b1b"};
`,jo=F.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 2rem;
`,wo=F.div`
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	transition: all 0.2s;

	&:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border-color: #cbd5e1;
	}
`,ko=F.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
`,vo=F.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
`,So=F.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	font-size: 0.875rem;
	color: #64748b;
`,Co=F.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	overflow-x: auto;
`,Io=F.span`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;

	${({$status:e})=>{switch(e){case"success":return"background: #dcfce7; color: #166534;";case"error":return"background: #fee2e2; color: #991b1b;";case"pending":return"background: #fef3c7; color: #92400e;";default:return"background: #f1f5f9; color: #475569;"}}}
`,To=F.div`
	text-align: center;
	padding: 4rem 2rem;
	color: #64748b;

	svg {
		margin-bottom: 1rem;
		opacity: 0.5;
	}
`,Eo=F.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	padding: 1rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
	flex-wrap: wrap;
`,_o=F.select`
	padding: 0.5rem 1rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.375rem;
	background: white;
	font-size: 0.875rem;
	color: #1e293b;
	min-width: 150px;
`,Ao=F.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: #475569;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Ro=F.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.375rem;
	background: white;
	font-size: 0.875rem;
	color: #64748b;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #f1f5f9;
		color: #475569;
	}
`,zo=()=>{const r=T(),i=S(),[o,s]=e.useState("events"),[a,l]=e.useState([]),[d,c]=e.useState([]),[u,y]=e.useState("all"),[j,k]=e.useState("all"),[C,I]=e.useState("all"),[E,_]=e.useState("json"),[R,z]=e.useState(!1),[O,P]=e.useState(!1),[$,N]=e.useState(()=>ie()),[D,F]=e.useState(()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);if(r.credentials?.environmentId)return r.credentials.environmentId}}catch(e){}return localStorage.getItem("environmentId")||""}),[q,J]=e.useState(!1),[H,G]=e.useState(!1),[Y,K]=e.useState(null),[Q,ee]=e.useState({name:"PingOne Webhook Viewer",enabled:!0,destination:"https://oauth-playground-pi.vercel.app/api/webhooks/pingone",format:"ACTIVITY",topics:""});e.useEffect(()=>{"/pingone-webhook-viewer"!==r.pathname&&i("/pingone-webhook-viewer",{replace:!0})},[r.pathname,i]),e.useEffect(()=>{const e=()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);r.credentials?.environmentId&&!D&&(F(r.credentials.environmentId),localStorage.setItem("environmentId",r.credentials.environmentId))}}catch(e){}};return window.addEventListener("workerTokenUpdated",e),()=>window.removeEventListener("workerTokenUpdated",e)},[D]),e.useEffect(()=>{const e=ie();e!==$&&N(e);const r=localStorage.getItem("environmentId")||"";r!==D&&F(r);const t=e=>{if(e.key?.startsWith("worker_token")||e.key?.startsWith("pingone_worker_token")||"environmentId"===e.key){const r=ie();r!==$&&N(r),"environmentId"===e.key&&F(e.newValue||"")}};window.addEventListener("storage",t);const n=setInterval(()=>{const e=ie();e!==$&&N(e);const r=localStorage.getItem("environmentId")||"";r!==D&&F(r)},1e3);return()=>{window.removeEventListener("storage",t),clearInterval(n)}},[D,$]);const te=e.useCallback((e,r)=>{switch(r){case"splunk":return oe(e);case"ping-activity":return se(e);case"new-relic":return ae(e);default:return JSON.stringify(e.data,null,2)}},[ae,se,oe]),oe=e=>{const r=e.timestamp.toISOString(),t=e.type||"unknown",n=e.data||{};return`${r} INFO pingone-webhook ${t} ${JSON.stringify(n)}`},se=e=>{const r={timestamp:e.timestamp.toISOString(),eventId:e.id,eventType:e.type||"unknown",source:"pingone-api",actor:e.data?.actor||{},action:e.data?.action||{},resource:e.data?.resource||{},result:e.data?.result||{},metadata:{environmentId:D,webhookId:e.id,receivedAt:e.timestamp.toISOString()}};return JSON.stringify(r,null,2)},ae=e=>{const r={eventType:"PingOneWebhook",timestamp:e.timestamp.getTime(),attributes:{eventId:e.id,eventType:e.type||"unknown",source:"pingone-api",environmentId:D,actor:e.data?.actor?.id||"unknown",action:e.data?.action?.type||"unknown",resourceType:e.data?.resource?.type||"unknown",result:e.data?.result?.status||"unknown",userAgent:e.data?.userAgent||"unknown",ipAddress:e.data?.ipAddress||"unknown"}};return JSON.stringify(r,null,2)},de=e.useCallback(async()=>{const e=ie();if(e&&D)try{P(!0);let r=null;const t=`/api/pingone/subscriptions?environmentId=${encodeURIComponent(D)}&workerToken=${encodeURIComponent(e)}&region=na`;r=re.trackApiCall({method:"GET",url:t,headers:{Authorization:"Bearer ***"}});const n=await fetch(t),i=await n.json().catch(()=>({}));if(r&&re.updateApiCallResponse(r,{status:n.status,statusText:n.statusText,headers:Object.fromEntries(n.headers.entries()),data:i}),!n.ok){if(404===n.status)throw new Error("Subscriptions endpoint not found. Please ensure the backend server is running and has been restarted to register the new routes.");if(403===n.status)throw new Error('Permission denied. Your worker token may lack the required scopes. Ensure your Worker App has the "p1:read:webhooks" and "p1:write:webhooks" scopes.');if("string"==typeof i&&i.includes("<html>")){if(i.includes("Error. Page cannot be displayed"))throw new Error("PingOne API access denied. This usually means:\n\n1. Your worker token lacks the required scopes (p1:read:webhooks, p1:write:webhooks)\n2. The environment ID is not accessible with this token\n3. Your PingOne account may not have webhook subscription permissions\n\nPlease generate a new worker token with the proper webhook scopes and try again.");throw new Error("Authentication failed. Your worker token may be expired or invalid. Please generate a new worker token with the required scopes: p1:read:webhooks, p1:write:webhooks")}throw new Error(i.error_description||`Failed to fetch subscriptions (${n.status})`)}const o=i._embedded?.subscriptions||[];c(o),ne.showSuccess(`Loaded ${o.length} webhook subscriptions`)}catch(r){ne.showError(r instanceof Error?r.message:"Failed to load webhook subscriptions")}finally{P(!1)}},[D]),ce=e.useCallback(async()=>{try{const e=await fetch("/api/webhooks/events?limit=1000");if(!e.ok){if(404===e.status)return;throw new Error(`Failed to fetch webhook events (${e.status})`)}const r=((await e.json()).events||[]).map(e=>({id:e.id||`event-${Date.now()}-${Math.random()}`,timestamp:new Date(e.timestamp||Date.now()),type:e.type||e.event||"unknown",event:e.event||"webhook.event",data:e.data||e.rawBody||{},status:e.status||"success",source:e.source||"pingone-api"}));l(r)}catch(e){e instanceof Error&&e.message.includes("404")||ne.showError("Failed to load webhook events")}},[]);e.useEffect(()=>{ie()&&D&&"subscriptions"===o&&de()},[D,o,de]),e.useEffect(()=>{"events"===o&&ce()},[o,ce]),e.useEffect(()=>{if(!R||"events"!==o)return;const e=setInterval(()=>{ce()},3e3);return()=>clearInterval(e)},[R,o,ce]);const me=e.useCallback(()=>{z(!0),ce(),ne.showSuccess("Webhook monitoring started - polling for new events every 3 seconds")},[ce]),ue=e.useCallback(()=>{z(!1),ne.showSuccess("Webhook monitoring stopped")},[]),pe=e.useCallback(async()=>{try{if(!(await fetch("/api/webhooks/events",{method:"DELETE"})).ok)throw new Error("Failed to clear webhook events");l([]),ne.showSuccess("Webhook history cleared"),le("PingOneWebhookViewer","Cleared webhook history")}catch(e){ne.showError("Failed to clear webhook events")}},[]),he=e.useCallback(()=>{const e=JSON.stringify(a,null,2),r=new Blob([e],{type:"application/json"}),t=URL.createObjectURL(r),n=document.createElement("a");n.href=t,n.download=`pingone-webhooks-${(new Date).toISOString()}.json`,n.click(),ne.showSuccess("Webhooks exported")},[a]),ge=e.useCallback(async()=>{const e=ie();if(e&&D)try{P(!0);let r=null;const t={name:Q.name,enabled:Q.enabled,destination:{url:Q.destination},format:Q.format,topics:Q.topics.split(",").map(e=>e.trim()).filter(Boolean)},n=`/api/pingone/subscriptions?environmentId=${encodeURIComponent(D)}&workerToken=${encodeURIComponent(e)}&region=na`;r=re.trackApiCall({method:"POST",url:n,headers:{"Content-Type":"application/json",Authorization:"Bearer ***"},body:t});const i=await fetch(n,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),o=await i.json().catch(()=>({}));if(r&&re.updateApiCallResponse(r,{status:i.status,statusText:i.statusText,headers:Object.fromEntries(i.headers.entries()),data:o}),!i.ok)throw new Error(o.error_description||`Failed to create subscription (${i.status})`);ne.showSuccess("Webhook subscription created successfully"),G(!1),ee({name:"",enabled:!0,destination:"",format:"ACTIVITY",topics:""}),await de()}catch(r){ne.showError(r instanceof Error?r.message:"Failed to create webhook subscription")}finally{P(!1)}else ne.showError("Worker token and environment ID are required")},[D,Q,de]),fe=e.useCallback(async e=>{const r=ie();if(r&&D)try{P(!0);let t=null;const n={name:Q.name,enabled:Q.enabled,destination:{url:Q.destination},format:Q.format,topics:Q.topics.split(",").map(e=>e.trim()).filter(Boolean)},i=`/api/pingone/subscriptions/${e.id}?environmentId=${encodeURIComponent(D)}&workerToken=${encodeURIComponent(r)}&region=na`;t=re.trackApiCall({method:"PUT",url:i,headers:{"Content-Type":"application/json",Authorization:"Bearer ***"},body:n});const o=await fetch(i,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),s=await o.json().catch(()=>({}));if(t&&re.updateApiCallResponse(t,{status:o.status,statusText:o.statusText,headers:Object.fromEntries(o.headers.entries()),data:s}),!o.ok)throw new Error(s.error_description||`Failed to update subscription (${o.status})`);ne.showSuccess("Webhook subscription updated successfully"),K(null),ee({name:"",enabled:!0,destination:"",format:"ACTIVITY",topics:""}),await de()}catch(t){ne.showError(t instanceof Error?t.message:"Failed to update webhook subscription")}finally{P(!1)}else ne.showError("Worker token and environment ID are required")},[D,Q,de]),xe=e.useCallback(async e=>{const r=ie();if(r&&D){if(confirm("Are you sure you want to delete this webhook subscription?"))try{P(!0);let t=null;const n=`/api/pingone/subscriptions/${e}?environmentId=${encodeURIComponent(D)}&workerToken=${encodeURIComponent(r)}&region=na`;t=re.trackApiCall({method:"DELETE",url:n,headers:{Authorization:"Bearer ***"}});const i=await fetch(n,{method:"DELETE"}),o=204===i.status?{}:await i.json().catch(()=>({}));if(t&&re.updateApiCallResponse(t,{status:i.status,statusText:i.statusText,headers:Object.fromEntries(i.headers.entries()),data:o}),!i.ok)throw new Error(`Failed to delete subscription (${i.status})`);ne.showSuccess("Webhook subscription deleted successfully"),await de()}catch(t){ne.showError(t instanceof Error?t.message:"Failed to delete webhook subscription")}finally{P(!1)}}else ne.showError("Worker token and environment ID are required")},[D,de]),be=e.useCallback(e=>{K(e),ee({name:e.name,enabled:e.enabled,destination:e.destination?.url||"",format:e.format||"ACTIVITY",topics:e.topics?.join(", ")||""}),G(!0)},[]),ye=e.useCallback(()=>{K(null),G(!1),ee({name:"",enabled:!0,destination:"",format:"ACTIVITY",topics:""})},[]),je=e.useMemo(()=>{const e=new Set(a.map(e=>e.type));return Array.from(e).sort()},[a]),we=e.useCallback(()=>{const e=Date.now();switch(C){case"1h":return e-36e5;case"24h":return e-864e5;case"7d":return e-6048e5;case"30d":return e-2592e6;default:return 0}},[C]),ke=e.useMemo(()=>{let e=a;if("all"!==u&&(e=e.filter(e=>e.status===u)),"all"!==j&&(e=e.filter(e=>e.type===j)),"all"!==C){const r=we();e=e.filter(e=>e.timestamp.getTime()>=r)}return e},[a,u,j,C,we]),ve=e.useCallback(()=>{y("all"),k("all"),I("all")},[]),Se=(e,r)=>te(r,E),Ce=ie()||$||"",Ie=!!Ce;return t.jsx(Gi,{children:t.jsxs(Yi,{children:[t.jsxs(Ki,{children:[t.jsxs(Qi,{children:[t.jsx(w,{size:28}),t.jsx(Xi,{children:"PingOne Webhook Management"})]}),t.jsx(Zi,{children:"Manage webhook subscriptions and monitor webhook events in real-time. Create, update, and delete webhook subscriptions using the PingOne Management API. Requires p1:read:subscriptions and p1:write:subscriptions scopes."})]}),!Ie&&t.jsx(Z,{isOpen:q,onClose:()=>J(!1),onContinue:()=>{J(!1);const e=ie();N(e);try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);r.credentials?.environmentId&&(F(r.credentials.environmentId),localStorage.setItem("environmentId",r.credentials.environmentId))}}catch(r){}},flowType:"pingone-webhook-viewer",environmentId:D,prefillCredentials:(()=>{try{const e=localStorage.getItem("unified_worker_token");if(e){const r=JSON.parse(e);return{environmentId:D||r.credentials?.environmentId||"",region:r.credentials?.region||"us",scopes:"p1:read:subscriptions p1:write:subscriptions"}}}catch(e){}return{}})(),tokenStorageKey:"worker_token",tokenExpiryKey:"worker_token_expires_at"}),Ie&&Ce&&t.jsx(X,{token:Ce,tokenExpiryKey:"worker_token_expires_at"}),Ie&&t.jsx(oo,{style:{marginBottom:"1.5rem"},children:t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("label",{style:{fontWeight:600,fontSize:"0.875rem",color:"#334155",display:"block",marginBottom:"0.5rem"},children:"Environment ID"}),t.jsx("input",{type:"text",value:D,onChange:e=>{const r=e.target.value;F(r),localStorage.setItem("environmentId",r)},placeholder:"Enter PingOne Environment ID (e.g., 12345678-1234-1234-1234-123456789abc)",style:{width:"100%",padding:"0.75rem 0.85rem",borderRadius:"0.75rem",border:"1px solid "+(D.trim()?"#cbd5f5":"#f59e0b"),background:D.trim()?"#f8fafc":"#fffbeb",fontSize:"0.92rem",fontFamily:"'Monaco', 'Menlo', 'Courier New', monospace"}}),D.trim()?t.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.8rem",color:"#64748b"},children:"Your PingOne Environment ID (saved to localStorage)"}):t.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.8rem",color:"#d97706",fontWeight:600},children:"⚠️ Environment ID is required. Enter it manually or generate a worker token to auto-fill."})]})}),t.jsxs(eo,{children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx(w,{size:24}),t.jsx(Xi,{style:{fontSize:"1.5rem",margin:0},children:"Webhook Management"})]}),t.jsxs(ro,{children:["subscriptions"===o&&t.jsxs(t.Fragment,{children:[t.jsxs(to,{$variant:"primary",onClick:()=>{K(null),ee({name:"",enabled:!0,destination:"",format:"ACTIVITY",topics:""}),G(!0)},disabled:!Ie||!D,children:[t.jsx(U,{}),"Create Subscription"]}),t.jsxs(to,{$variant:"secondary",onClick:de,disabled:!Ie||!D||O,children:[t.jsx(b,{}),"Refresh"]})]}),"events"===o&&t.jsxs(t.Fragment,{children:[R?t.jsxs(to,{$variant:"danger",onClick:ue,children:[t.jsx(h,{}),"Stop Monitoring"]}):t.jsxs(to,{$variant:"primary",onClick:me,children:[t.jsx(h,{}),"Start Monitoring"]}),t.jsxs(to,{$variant:"secondary",onClick:pe,disabled:0===a.length,children:[t.jsx(L,{}),"Clear History"]}),t.jsxs(to,{$variant:"secondary",onClick:he,disabled:0===a.length,children:[t.jsx(W,{}),"Export"]})]})]})]}),t.jsxs(no,{children:[t.jsxs(io,{$active:"subscriptions"===o,onClick:()=>s("subscriptions"),children:["Subscriptions (",d.length,")"]}),t.jsxs(io,{$active:"events"===o,onClick:()=>s("events"),children:["Events (",a.length,")"]})]}),"subscriptions"===o&&t.jsxs(t.Fragment,{children:[!Ie&&t.jsxs(oo,{children:[t.jsx("p",{style:{color:"#64748b",marginBottom:"1rem"},children:"A worker token is required to manage webhook subscriptions. Please provide a worker token to continue."}),t.jsxs(to,{$variant:"primary",onClick:()=>J(!0),children:[t.jsx(p,{}),"Provide Worker Token"]})]}),H&&t.jsxs(oo,{children:[t.jsxs(so,{children:[t.jsx(ao,{children:Y?"Edit Subscription":"Create Subscription"}),t.jsxs(to,{$variant:"secondary",onClick:ye,children:[t.jsx(n,{}),"Cancel"]})]}),t.jsxs(lo,{children:[t.jsx(co,{children:"Name *"}),t.jsx(mo,{type:"text",value:Q.name,onChange:e=>ee({...Q,name:e.target.value}),placeholder:"My Webhook Subscription"})]}),t.jsxs(lo,{children:[t.jsx(co,{children:"Destination URL *"}),t.jsx(mo,{type:"url",value:Q.destination,onChange:e=>ee({...Q,destination:e.target.value}),placeholder:"https://example.com/webhook"})]}),t.jsxs(lo,{children:[t.jsx(co,{children:"Format"}),t.jsxs(_o,{value:Q.format,onChange:e=>ee({...Q,format:e.target.value}),children:[t.jsx("option",{value:"ACTIVITY",children:"ACTIVITY"}),t.jsx("option",{value:"JSON",children:"JSON"})]})]}),t.jsxs(lo,{children:[t.jsx(co,{children:"Topics (comma-separated)"}),t.jsx(mo,{type:"text",value:Q.topics,onChange:e=>ee({...Q,topics:e.target.value}),placeholder:"user.created, user.updated"})]}),t.jsx(lo,{children:t.jsxs(co,{style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(uo,{type:"checkbox",checked:Q.enabled,onChange:e=>ee({...Q,enabled:e.target.checked})}),"Enabled"]})}),t.jsxs(ro,{children:[t.jsxs(to,{$variant:"primary",onClick:Y?()=>fe(Y):ge,disabled:!Q.name||!Q.destination||O,children:[Y?"Update":"Create"," Subscription"]}),t.jsx(to,{$variant:"secondary",onClick:ye,children:"Cancel"})]})]}),Ie&&D&&t.jsxs(oo,{children:[t.jsx(so,{children:t.jsx(ao,{children:"Webhook Subscriptions"})}),O?t.jsx("p",{style:{color:"#64748b"},children:"Loading subscriptions..."}):0===d.length?t.jsxs(To,{children:[t.jsx(w,{size:48}),t.jsx("h3",{children:"No webhook subscriptions"}),t.jsx("p",{children:"Create your first webhook subscription to start receiving events."})]}):t.jsx(po,{children:d.map(e=>t.jsxs(ho,{children:[t.jsxs(go,{children:[t.jsx(fo,{children:e.name}),t.jsxs(xo,{children:[t.jsxs(yo,{$enabled:e.enabled,children:[e.enabled?t.jsx(f,{}):t.jsx(n,{}),e.enabled?"Enabled":"Disabled"]}),t.jsxs("span",{children:["URL: ",e.destination?.url||"N/A"]}),e.format&&t.jsxs("span",{children:["Format: ",e.format]}),e.topics&&e.topics.length>0&&t.jsxs("span",{children:["Topics: ",e.topics.join(", ")]})]})]}),t.jsxs(bo,{children:[t.jsx(to,{type:"button",$variant:"secondary",onClick:()=>be(e),children:t.jsx(B,{})}),t.jsx(to,{type:"button",$variant:"danger",onClick:()=>xe(e.id),children:t.jsx(L,{})})]})]},e.id))})]})]}),"events"===o&&t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:{background:"#fef3c7",border:"2px solid #f59e0b",borderRadius:"0.5rem",padding:"1.5rem",marginBottom:"2rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"1rem"},children:[t.jsx(g,{color:"#f59e0b",size:20}),t.jsx("strong",{style:{color:"#92400e",fontSize:"1rem"},children:"Webhook Configuration URL"})]}),t.jsxs("div",{style:{display:"flex",gap:"1rem",alignItems:"center"},children:[t.jsxs("div",{style:{background:"white",border:"1px solid #f59e0b",borderRadius:"0.375rem",padding:"0.75rem 1rem",flex:1,fontFamily:"'Monaco', 'Menlo', 'Ubuntu Mono', monospace",fontSize:"0.875rem",wordBreak:"break-all"},children:[window.location.origin,"/api/webhooks/pingone"]}),t.jsxs("button",{onClick:()=>{navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/pingone`),ne.showSuccess("Webhook URL copied to clipboard")},style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.75rem 1.5rem",background:"#f59e0b",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:600,cursor:"pointer"},children:[t.jsx(m,{}),"Copy URL"]})]}),t.jsx("p",{style:{color:"#92400e",fontSize:"0.875rem",margin:"1rem 0 0 0"},children:'Copy this URL and paste it into the "Destination URL" field in your PingOne webhook configuration.'})]}),t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("p",{style:{color:"#64748b",fontSize:"0.875rem"},children:"Monitor PingOne webhook events in real-time. Configure the webhook URL above in PingOne, then start monitoring to see events as they arrive."}),R&&t.jsx("p",{style:{color:"#10b981",fontSize:"0.875rem",marginTop:"0.5rem",fontWeight:500},children:"✓ Monitoring active - Polling for new events every 3 seconds"})]}),a.length>0&&t.jsxs(Eo,{children:[t.jsx(x,{size:20,color:"#64748b"}),t.jsxs(Ao,{children:["Status:",t.jsxs(_o,{value:u,onChange:e=>y(e.target.value),children:[t.jsxs("option",{value:"all",children:["All (",a.length,")"]}),t.jsxs("option",{value:"success",children:["Success (",a.filter(e=>"success"===e.status).length,")"]}),t.jsxs("option",{value:"error",children:["Errors (",a.filter(e=>"error"===e.status).length,")"]}),t.jsxs("option",{value:"pending",children:["Pending (",a.filter(e=>"pending"===e.status).length,")"]})]})]}),t.jsxs(Ao,{children:[t.jsx(A,{}),"Time:",t.jsxs(_o,{value:C,onChange:e=>I(e.target.value),children:[t.jsx("option",{value:"all",children:"All Time"}),t.jsx("option",{value:"1h",children:"Last Hour"}),t.jsx("option",{value:"24h",children:"Last 24 Hours"}),t.jsx("option",{value:"7d",children:"Last 7 Days"}),t.jsx("option",{value:"30d",children:"Last 30 Days"})]})]}),t.jsxs(Ao,{children:[t.jsx(M,{}),"Type:",t.jsxs(_o,{value:j,onChange:e=>k(e.target.value),children:[t.jsxs("option",{value:"all",children:["All Types (",je.length,")"]}),je.map(e=>t.jsxs("option",{value:e,children:[e," (",a.filter(r=>r.type===e).length,")"]},e))]})]}),t.jsxs(Ao,{children:[t.jsx(M,{}),"Display Format:",t.jsxs(_o,{value:E,onChange:e=>_(e.target.value),children:[t.jsx("option",{value:"json",children:"Raw JSON"}),t.jsx("option",{value:"splunk",children:"Splunk Format"}),t.jsx("option",{value:"ping-activity",children:"Ping Activity JSON"}),t.jsx("option",{value:"new-relic",children:"New Relic Format"})]})]}),("all"!==u||"all"!==j||"all"!==C)&&t.jsxs(Ro,{onClick:ve,children:[t.jsx(n,{}),"Clear Filters"]})]}),t.jsx(jo,{children:0===ke.length?t.jsxs(To,{children:[t.jsx(w,{size:48}),t.jsx("h3",{children:0===a.length?"No webhooks yet":"No webhooks match your filters"}),t.jsx("p",{children:0===a.length?R?"Waiting for webhook events...":'Click "Start Monitoring" to begin receiving webhook events.':"Try adjusting your filters to see more results."})]}):ke.map(e=>{return t.jsxs(wo,{$type:e.type,children:[t.jsxs(ko,{children:[t.jsxs(vo,{children:[t.jsxs(Io,{$status:e.status,children:["success"===e.status?t.jsx(f,{}):t.jsx(g,{}),e.status]}),t.jsx("span",{children:e.type})]}),t.jsxs(So,{children:[t.jsx(v,{size:16}),(r=e.timestamp,new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"medium"}).format(r)),t.jsx(M,{size:16}),e.source]})]}),t.jsx(Co,{children:t.jsx("pre",{children:Se(e.data,e)})})]},e.id);var r})})]}),t.jsx(V,{title:"API Calls to PingOne",showLegend:!0})]})})};export{Ge as A,Nt as P,mn as a,Gn as b,Bn as c,Pr as d,zo as e,qt as f,Hi as g,si as l,oi as u};
//# sourceMappingURL=pages-pingone-BLdy8FiO.js.map
