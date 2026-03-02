import{a as e,j as r,aI as t,w as i,k as n,m as s,af as o,bo as a,a0 as d,G as l,W as c,al as h,n as u,a9 as p,_ as m,E as g,Q as f,Y as x,h as b,U as j,aJ as v,F as y}from"./react-vendor-HWZo9XlX.js";import{a as w}from"./styled-vendor-DGSsHzxd.js";const z=w.div`
	margin-bottom: 1.5rem;
`,k=w.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.5rem;
`,I=w.div`
	color: #10b981;
	font-size: 1rem;
`,R=w.div`
	position: relative;
`,A=w.input`
	width: 100%;
	padding: 0.75rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', monospace;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	&:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}

	&::placeholder {
		color: #9ca3af;
	}
`,C=w.div`
	margin-top: 0.5rem;
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.5;
`,P=w.div`
	margin-top: 0.75rem;
	padding: 0.75rem;
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
`,$=w.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`,U=w.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	text-align: left;
	padding: 0.5rem;
	margin-bottom: 0.25rem;
	background: ${e=>e.$isFromDiscovery?"#eff6ff":"#ffffff"};
	border: 1px solid ${e=>e.$isFromDiscovery?"#60a5fa":"#e5e7eb"};
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	color: ${e=>e.$isFromDiscovery?"#1e40af":"#10b981"};
	cursor: grab;
	transition: all 0.2s;
	position: relative;

	&:hover {
		background: ${e=>e.$isFromDiscovery?"#dbeafe":"#f0fdf4"};
		border-color: ${e=>e.$isFromDiscovery?"#3b82f6":"#10b981"};
		transform: translateX(2px);
	}

	&:active {
		cursor: grabbing;
	}

	&:last-child {
		margin-bottom: 0;
	}
`,D=w.span`
	flex: 1;
`,q=w.div`
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0.5;
	font-size: 0.875rem;
	margin-left: 0.5rem;
`,S=w.span`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.125rem 0.375rem;
	background: #3b82f6;
	color: white;
	border-radius: 0.25rem;
	font-size: 0.625rem;
	font-weight: 600;
	margin-left: 0.5rem;
	text-transform: uppercase;
`,T=w.div`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: ${e=>"warning"===e.$variant?"#fef3c7":"#f0fdf4"};
	border: 1px solid ${e=>"warning"===e.$variant?"#fbbf24":"#86efac"};
	border-radius: 0.5rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	color: ${e=>"warning"===e.$variant?"#78350f":"#166534"};
	line-height: 1.5;
`,O=w.div`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: ${e=>"warning"===e.$variant?"#f59e0b":"#10b981"};
`,_=["https://api.example.com","https://api.myservice.com/v1","urn:my-resource-server","https://graph.microsoft.com"],E=({value:o,onChange:a,disabled:d=!1,flowType:l="oauth",tokenEndpoint:c,issuer:h,autoFillFromDiscovery:u=!1})=>{e.useEffect(()=>{if(u&&!o&&(c||h)){const e=h||c;e&&a(e)}},[u,o,c,h,a]);const p=(()=>{const e=[];return h&&e.push({value:h,isFromDiscovery:!0,label:"Issuer (from OIDC Discovery)"}),c&&c!==h&&e.push({value:c,isFromDiscovery:!0,label:"Token Endpoint (from OIDC Discovery)"}),_.forEach(r=>{e.push({value:r})}),e})();return r.jsxs(z,{children:[r.jsxs(k,{children:[r.jsx(I,{children:r.jsx(t,{})}),"Audience (API Target for Access Token)"]}),r.jsx(R,{children:r.jsx(A,{type:"text",value:o,onChange:e=>a(e.target.value),disabled:d,placeholder:"https://api.example.com",onDrop:e=>{e.preventDefault();const r=e.dataTransfer.getData("text/plain");r&&!d&&a(r)},onDragOver:e=>{e.preventDefault(),e.dataTransfer.dropEffect="copy"},title:"Drag and drop examples here, or type manually"})}),r.jsxs(C,{children:["Specify the intended ",r.jsx("strong",{children:"audience"})," (target API) for the access token. The access token will be scoped to this specific API/resource.",(c||h)&&r.jsx("div",{style:{marginTop:"0.5rem",color:"#3b82f6",fontWeight:500},children:"✓ OIDC Discovery endpoints available - drag them to the field above!"})]}),r.jsxs(P,{children:[r.jsx($,{children:"Common Examples (click or drag to use):"}),p.map((e,t)=>r.jsxs(U,{type:"button",onClick:()=>a(e.value),disabled:d,draggable:!d,onDragStart:r=>((e,r)=>{e.dataTransfer.setData("text/plain",r),e.dataTransfer.effectAllowed="copy"})(r,e.value),$isFromDiscovery:e.isFromDiscovery,title:e.label||`Click or drag to use: ${e.value}`,children:[r.jsx(D,{children:e.value}),e.isFromDiscovery&&r.jsx(S,{children:"OIDC"}),r.jsx(q,{children:r.jsx(i,{})})]},`${e.value}-${t}`))]}),r.jsxs(T,{children:[r.jsx(O,{children:r.jsx(n,{})}),r.jsxs("div",{children:[r.jsx("strong",{children:"Why Use Audience?"}),r.jsxs("div",{style:{marginTop:"0.5rem"},children:["The ",r.jsx("code",{children:"audience"})," parameter ensures your access token is issued for a",r.jsx("strong",{children:" specific API"}),". This is critical for security:"]}),r.jsxs("ul",{style:{marginTop:"0.5rem",paddingLeft:"1.5rem"},children:[r.jsx("li",{children:"Prevents token misuse on wrong API"}),r.jsxs("li",{children:["API can validate the ",r.jsx("code",{children:"aud"})," claim in JWT"]}),r.jsx("li",{children:"Enables multi-API architecture with scoped tokens"}),r.jsx("li",{children:"Required by many authorization servers for API access"})]})]})]}),"oauth"===l&&!o&&r.jsxs(T,{$variant:"warning",children:[r.jsx(O,{$variant:"warning",children:r.jsx(s,{})}),r.jsxs("div",{children:[r.jsx("strong",{children:"OAuth Best Practice:"})," For production OAuth applications accessing protected APIs, always specify an ",r.jsx("code",{children:"audience"})," parameter. Without it, you may receive an opaque token instead of a JWT, or the token may not be accepted by your API."]})]})]})},F=w.div`
	margin-bottom: 1.5rem;
`,M=w.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.5rem;
`,B=w.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
`,L=w.button`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
	padding: 1rem;
	border: 2px solid ${e=>e.$selected?"#10b981":"#e5e7eb"};
	border-radius: 0.5rem;
	background: ${e=>e.$selected?"#f0fdf4":"#ffffff"};
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		border-color: ${e=>e.$selected?"#10b981":"#d1d5db"};
		background: ${e=>e.$selected?"#f0fdf4":"#f9fafb"};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`,W=w.div`
	font-size: 2rem;
	color: ${e=>e.$selected?"#10b981":"#6b7280"};
`,H=w.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: ${e=>e.$selected?"#065f46":"#374151"};
`,Y=w.div`
	font-size: 0.75rem;
	color: #6b7280;
	text-align: center;
	line-height: 1.4;
`,G=w.div`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: #1e40af;
	line-height: 1.5;
`,J=w.div`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: #3b82f6;
`,N=[{value:"page",icon:o,title:"Page (Default)",description:"Full page user agent - Standard desktop/mobile browser"},{value:"popup",icon:a,title:"Popup",description:"Popup window - Smaller browser window for authentication"},{value:"touch",icon:d,title:"Touch",description:"Touch-based device - Optimized for touchscreens and tablets"},{value:"wap",icon:d,title:"WAP",description:"WAP-based mobile - Legacy mobile devices (rarely used today)"}],K=({value:e,onChange:t,disabled:i=!1})=>r.jsxs(F,{children:[r.jsx(M,{children:"Display Mode (OIDC UI Adaptation)"}),r.jsx(B,{children:N.map(n=>{const s=n.icon,o=e===n.value;return r.jsxs(L,{type:"button",$selected:o,onClick:()=>t(n.value),disabled:i,children:[r.jsx(W,{$selected:o,children:r.jsx(s,{})}),r.jsx(H,{$selected:o,children:n.title}),r.jsx(Y,{children:n.description})]},n.value)})}),r.jsxs(G,{children:[r.jsx(J,{children:r.jsx(n,{})}),r.jsxs("div",{children:[r.jsx("strong",{children:"About Display Parameter:"})," The ",r.jsx("code",{children:"display"})," parameter tells the Authorization Server how to present the authentication UI. Different display modes optimize the experience for different device types and contexts. Most applications use"," ",r.jsx("code",{children:"page"})," (default) or ",r.jsx("code",{children:"popup"}),".",r.jsxs("div",{style:{marginTop:"0.5rem"},children:[r.jsx("strong",{children:"Note:"})," Not all providers support all display modes. PingOne primarily supports",r.jsx("code",{children:"page"})," and ",r.jsx("code",{children:"popup"})," modes."]})]})]})]}),Q=w.div`
	margin-bottom: 1.5rem;
`,X=w.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.5rem;
`,V=w.div`
	color: #7c3aed;
	font-size: 1rem;
`,Z=w.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;
`,ee=w.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.75rem;
	padding: 0.75rem;
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	transition: all 0.2s;

	&:hover {
		border-color: #7c3aed;
		box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.1);
	}

	&:last-child {
		margin-bottom: 0;
	}
`,re=w.input`
	flex: 1;
	padding: 0.5rem 0.75rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', monospace;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #7c3aed;
		box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
	}

	&:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}
`,te=w.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	color: #ef4444;
	background: transparent;
	border: none;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #fee2e2;
		color: #dc2626;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`,ie=w.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	width: 100%;
	padding: 0.875rem 1.25rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: #ffffff;
	background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
	border: none;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);

	&:hover:not(:disabled) {
		background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`,ne=w.div`
	margin-top: 0.75rem;
	padding: 0.75rem;
	background: #faf5ff;
	border: 1px solid #c4b5fd;
	border-radius: 0.5rem;
`,se=w.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b21a8;
	margin-bottom: 0.5rem;
`,oe=w.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	text-align: left;
	padding: 0.5rem;
	margin-bottom: 0.25rem;
	background: ${e=>e.$isFromDiscovery?"#eff6ff":"#ffffff"};
	border: 1px solid ${e=>e.$isFromDiscovery?"#60a5fa":"#c4b5fd"};
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	color: ${e=>e.$isFromDiscovery?"#1e40af":"#7c3aed"};
	cursor: grab;
	transition: all 0.2s;

	&:hover {
		background: ${e=>e.$isFromDiscovery?"#dbeafe":"#faf5ff"};
		border-color: ${e=>e.$isFromDiscovery?"#3b82f6":"#7c3aed"};
		transform: translateX(2px);
	}

	&:active {
		cursor: grabbing;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	&:last-child {
		margin-bottom: 0;
	}
`,ae=w.span`
	flex: 1;
`,de=w.div`
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0.5;
	font-size: 0.875rem;
	margin-left: 0.5rem;
`,le=w.span`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.125rem 0.375rem;
	background: #3b82f6;
	color: white;
	border-radius: 0.25rem;
	font-size: 0.625rem;
	font-weight: 600;
	margin-left: 0.5rem;
	text-transform: uppercase;
`,ce=w.div`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: ${e=>"warning"===e.$variant?"#fef3c7":"#eff6ff"};
	border: 1px solid ${e=>"warning"===e.$variant?"#fbbf24":"#bfdbfe"};
	border-radius: 0.5rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	color: ${e=>"warning"===e.$variant?"#78350f":"#1e40af"};
	line-height: 1.5;
`,he=w.div`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: ${e=>"warning"===e.$variant?"#f59e0b":"#3b82f6"};
`;w.div`
	text-align: center;
	padding: 2rem 1rem;
	color: #6b7280;
	font-style: italic;
`;const ue=w.div`
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: 2px solid #bae6fd;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`,pe=w.h3`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin: 0 0 1rem 0;
	font-size: 1.125rem;
	font-weight: 700;
	color: #0c4a6e;
	
	svg {
		color: #0284c7;
		font-size: 1.5rem;
	}
`,me=w.div`
	font-size: 0.9375rem;
	color: #0c4a6e;
	line-height: 1.7;
	
	p {
		margin: 0 0 1rem 0;
		
		&:last-child {
			margin-bottom: 0;
		}
	}
	
	strong {
		color: #075985;
		font-weight: 600;
	}
	
	code {
		background: #dbeafe;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 0.875rem;
		color: #1e40af;
	}
`,ge=w.ul`
	margin: 1rem 0 0 0;
	padding-left: 1.5rem;
	
	li {
		margin-bottom: 0.5rem;
		
		&:last-child {
			margin-bottom: 0;
		}
	}
`,fe=w.div`
	background: #fff;
	border: 1px solid #bae6fd;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
	
	strong {
		display: block;
		color: #0369a1;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}
	
	div {
		font-size: 0.8125rem;
		color: #334155;
		line-height: 1.6;
	}
`,xe=["https://api.example.com","https://graph.microsoft.com","https://www.googleapis.com/auth/drive","urn:example:resource","myapp://api"],be=({value:t,onChange:s,disabled:o=!1,flowType:a="oauth",issuer:d,environmentId:u})=>{const[p,m]=e.useState(""),g=(()=>{const e=[];if(d&&e.push({value:d,isFromDiscovery:!0,label:"Issuer/Base URL (from OIDC Discovery)"}),u&&!d){const r=`https://auth.pingone.com/${u}`;e.push({value:r,isFromDiscovery:!0,label:"PingOne Base URL"})}return xe.forEach(r=>{e.push({value:r})}),e})(),f=()=>{p.trim()&&!t.includes(p.trim())&&(s([...t,p.trim()]),m(""))};return r.jsxs(Q,{children:[r.jsxs(ue,{children:[r.jsxs(pe,{children:[r.jsx(l,{}),"Resources"]}),r.jsxs(me,{children:[r.jsxs("p",{children:[r.jsx("strong",{children:"What are Resources?"})," In OAuth 2.0 and OIDC, a ",r.jsx("code",{children:"resource"})," is a protected API or service that you want to access with your access token. Think of it as telling the authorization server:",r.jsxs("em",{children:['"I need a token that will work with ',r.jsx("strong",{children:"these specific APIs"}),'."']})]}),r.jsxs("p",{children:[r.jsx("strong",{children:"Why specify resources?"})," When you request a token, you can tell the authorization server exactly which APIs you plan to call. This makes your tokens more secure because they're scoped to only work with the APIs you actually need."]}),r.jsxs(fe,{children:[r.jsx("strong",{children:"Real-World Example:"}),r.jsxs("div",{children:["You're building a mobile app that needs to access both a ",r.jsx("code",{children:"billing API"})," and an ",r.jsx("code",{children:"analytics API"}),". By specifying both as resources, you get a single token that works with both APIs. Without the resource parameter, the authorization server might issue a generic token, or the APIs might reject your token."]})]}),r.jsx("p",{children:r.jsx("strong",{children:"When to use Resources (RFC 8707):"})}),r.jsxs(ge,{children:[r.jsxs("li",{children:[r.jsx("strong",{children:"Multiple APIs:"})," Your app needs to call several different APIs with one token"]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Microservices:"})," Each service validates tokens and checks the audience claim"]}),r.jsxs("li",{children:[r.jsx("strong",{children:"API Gateway:"})," You have an API gateway routing to multiple backend services"]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Security:"})," You want to limit token scope to only the APIs you actually use"]}),r.jsxs("li",{children:[r.jsx("strong",{children:"PingOne:"})," Specify the PingOne issuer URL to scope tokens to your environment"]})]}),r.jsxs("p",{style:{marginTop:"1rem",fontSize:"0.875rem",fontStyle:"italic",color:"#0369a1"},children:["💡 ",r.jsx("strong",{children:"Tip:"})," If you're unsure, use the PingOne base URL (shown in blue below) as your resource. This tells the authorization server to issue a token for your specific PingOne environment."]})]})]}),r.jsxs(X,{children:[r.jsx(V,{children:r.jsx(l,{})}),"Add Resources (Optional)"]}),r.jsxs(Z,{children:[t.length>0&&t.map((e,i)=>r.jsxs(ee,{children:[r.jsx(re,{type:"text",value:e,readOnly:!0,disabled:o}),r.jsx(te,{type:"button",onClick:()=>(e=>{s(t.filter((r,t)=>t!==e))})(i),disabled:o,title:"Remove resource",children:r.jsx(c,{size:16})})]},`${e}-${i}`)),r.jsxs(ce,{style:{fontSize:"0.8125rem",marginTop:t.length>0?"0.75rem":"0"},children:[r.jsx(n,{size:16}),r.jsxs("div",{children:[r.jsx("strong",{children:"Type or drag:"}),' Enter a resource URI below, or drag an example from the list. Press Enter or click "Add Resource" to add it to the list.']})]}),r.jsx("input",{type:"text",value:p,onChange:e=>m(e.target.value),onKeyPress:e=>{"Enter"===e.key&&(e.preventDefault(),f())},onDrop:e=>{e.preventDefault();const r=e.dataTransfer.getData("text/plain");!r||o||t.includes(r)||m(r)},onDragOver:e=>{e.preventDefault(),e.dataTransfer.dropEffect="copy"},placeholder:"Type resource URI here or drag from examples below",disabled:o,title:"Drag and drop examples here, or type manually",style:{width:"100%",marginTop:"0.75rem",padding:"0.875rem 1rem",border:"2px solid #bae6fd",borderRadius:"0.5rem",fontSize:"0.875rem",fontFamily:"Monaco, Menlo, monospace",backgroundColor:"#ffffff",transition:"all 0.2s"},onFocus:e=>{e.target.style.borderColor="#0284c7",e.target.style.boxShadow="0 0 0 3px rgba(2, 132, 199, 0.1)"},onBlur:e=>{e.target.style.borderColor="#bae6fd",e.target.style.boxShadow="none"}}),r.jsxs(ie,{type:"button",onClick:f,disabled:o||!p.trim()||t.includes(p.trim()),style:{marginTop:"0.75rem"},children:[r.jsx(h,{size:16}),"Add Resource"]})]}),r.jsxs(ne,{children:[r.jsxs(se,{children:["Common Examples (click or drag to add):",(d||u)&&r.jsx("span",{style:{color:"#3b82f6",fontWeight:400,marginLeft:"0.5rem"},children:"✓ OIDC Discovery endpoints available"})]}),g.map((e,n)=>r.jsxs(oe,{type:"button",onClick:()=>(e=>{t.includes(e)||s([...t,e])})(e.value),disabled:o||t.includes(e.value),draggable:!o&&!t.includes(e.value),onDragStart:r=>((e,r)=>{e.dataTransfer.setData("text/plain",r),e.dataTransfer.effectAllowed="copy"})(r,e.value),$isFromDiscovery:e.isFromDiscovery,title:e.label||`Click or drag to add: ${e.value}`,children:[r.jsx(ae,{children:e.value}),e.isFromDiscovery&&r.jsx(le,{children:"OIDC"}),r.jsx(de,{children:r.jsx(i,{})})]},`${e.value}-${n}`))]}),t.length>0&&r.jsxs(ce,{children:[r.jsx(he,{children:r.jsx(n,{})}),r.jsxs("div",{children:[r.jsxs("strong",{children:["You've added ",t.length," resource",t.length>1?"s":"","!"]}),r.jsxs("div",{style:{marginTop:"0.5rem",fontSize:"0.875rem"},children:["Your access token will be scoped to work with"," ",t.length>1?"these APIs":"this API",". The authorization server will include"," ",t.length>1?"these URLs":"this URL"," in the token's audience (",r.jsx("code",{children:"aud"}),") claim, and the ",t.length>1?"APIs":"API"," will validate this before accepting your token."]})]})]}),0===t.length&&(d||u)&&r.jsxs(ce,{children:[r.jsx(he,{children:r.jsx(n,{})}),r.jsxs("div",{children:[r.jsx("strong",{children:"Optional but Recommended:"})," Resources are optional, but specifying them makes your tokens more secure. Try adding the blue PingOne base URL above to scope your token to your environment!"]})]})]})},je=w.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	padding: 1rem;
`,ve=w.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
	max-width: 600px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
`,ye=w.div`
	padding: 1.5rem 1.5rem 0;
	border-bottom: 1px solid #e5e7eb;
`,we=w.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #111827;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,ze=w.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0 0 1.5rem 0;
	line-height: 1.5;
`,ke=w.div`
	padding: 1.5rem;
`,Ie=w.div`
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: 1px solid #0ea5e9;
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1.5rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`,Re=w.div`
	color: #0ea5e9;
	margin-top: 0.125rem;
`,Ae=w.div`
	flex: 1;
`,Ce=w.h4`
	font-size: 0.875rem;
	font-weight: 600;
	color: #0c4a6e;
	margin: 0 0 0.5rem 0;
`,Pe=w.p`
	font-size: 0.8rem;
	color: #0c4a6e;
	margin: 0;
	line-height: 1.5;
`,$e=w.form`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`,Ue=w.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`,De=w.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,qe=w.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: #f9fafb;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;w.textarea`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: #f9fafb;
	min-height: 100px;
	resize: vertical;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;const Se=w.div`
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.4;
`,Te=w.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
	padding: 1.5rem;
	border-top: 1px solid #e5e7eb;
`,Oe=w.button`
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	
	${({$variant:e})=>{switch(e){case"primary":return"\n\t\t\t\t\tbackground: #3b82f6;\n\t\t\t\t\tcolor: white;\n\t\t\t\t\tborder: 1px solid #3b82f6;\n\t\t\t\t\t\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #2563eb;\n\t\t\t\t\t\tborder-color: #2563eb;\n\t\t\t\t\t}\n\t\t\t\t";case"success":return"\n\t\t\t\t\tbackground: #16a34a;\n\t\t\t\t\tcolor: white;\n\t\t\t\t\tborder: 1px solid #16a34a;\n\t\t\t\t\t\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #15803d;\n\t\t\t\t\t\tborder-color: #15803d;\n\t\t\t\t\t}\n\t\t\t\t";case"warning":return"\n\t\t\t\t\tbackground: #f59e0b;\n\t\t\t\t\tcolor: white;\n\t\t\t\t\tborder: 1px solid #f59e0b;\n\t\t\t\t\t\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #d97706;\n\t\t\t\t\t\tborder-color: #d97706;\n\t\t\t\t\t}\n\t\t\t\t";default:return"\n\t\t\t\t\tbackground: white;\n\t\t\t\t\tcolor: #374151;\n\t\t\t\t\tborder: 1px solid #d1d5db;\n\t\t\t\t\t\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #f9fafb;\n\t\t\t\t\t\tborder-color: #9ca3af;\n\t\t\t\t\t}\n\t\t\t\t"}}}
`,_e=w.div`
	display: flex;
	border-bottom: 1px solid #e5e7eb;
	margin-bottom: 1.5rem;
`,Ee=w.button`
	padding: 0.75rem 1rem;
	border: none;
	background: none;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	border-bottom: 2px solid transparent;
	color: ${({$active:e})=>e?"#3b82f6":"#6b7280"};
	border-bottom-color: ${({$active:e})=>e?"#3b82f6":"transparent"};
	
	&:hover {
		color: #3b82f6;
	}
`,Fe=w.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1rem;
	border-radius: 6px;
	font-size: 0.75rem;
	overflow-x: auto;
	margin: 0.5rem 0;
	position: relative;
`,Me=w.button`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	
	&:hover {
		background: rgba(255, 255, 255, 0.2);
	}
`,Be=w.div`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	margin-bottom: 1.5rem;
	padding: 1rem;
	background: #f8fafc;
	border-radius: 8px;
	border-left: 4px solid #3b82f6;
`,Le=w.div`
	background: #3b82f6;
	color: white;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: 600;
	flex-shrink: 0;
`,We=w.div`
	flex: 1;
`,He=w.h4`
	font-size: 0.875rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.5rem 0;
`,Ye=w.p`
	font-size: 0.8rem;
	color: #6b7280;
	margin: 0;
	line-height: 1.4;
`,Ge=w.div`
	padding: 1rem;
	border-radius: 8px;
	margin: 1rem 0;
	border-left: 4px solid;
	
	${({$variant:e})=>{switch(e){case"success":return"\n\t\t\t\t\tbackground: #f0fdf4;\n\t\t\t\t\tborder-left-color: #16a34a;\n\t\t\t\t";case"warning":return"\n\t\t\t\t\tbackground: #fffbeb;\n\t\t\t\t\tborder-left-color: #f59e0b;\n\t\t\t\t";default:return"\n\t\t\t\t\tbackground: #eff6ff;\n\t\t\t\t\tborder-left-color: #3b82f6;\n\t\t\t\t"}}}
`,Je=w.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 0.75rem;
	margin: 1rem 0;
`,Ne=w.button`
	padding: 1rem;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	background: white;
	cursor: pointer;
	text-align: left;
	transition: all 0.2s;
	
	&:hover {
		border-color: #3b82f6;
		box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
	}
`,Ke=w.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.25rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Qe=w.div`
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.3;
`,Xe=({onPARDataSubmit:t,onCancel:i,onClose:o,isOpen:a,initialData:d})=>{const[l,c]=e.useState("input"),[h,w]=e.useState({requestUri:d?.requestUri||"urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",expiresIn:d?.expiresIn||60,clientId:d?.clientId||"a4f963ea-0736-456a-be72-b1fa4f63f81f",environmentId:d?.environmentId||"b9817c16-9910-4415-b67e-4ac687da74d9",redirectUri:d?.redirectUri||"https://localhost:3000/callback"}),[z,k]=e.useState({responseType:"code",scope:"openid profile email",redirectUri:"https://localhost:3000/callback",state:"abc123xyz789",nonce:"n-0S6_WzA2Mj",codeChallenge:"E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",codeChallengeMethod:"S256"}),[I,R]=e.useState("");e.useEffect(()=>{d&&w(e=>({...e,...d}))},[d]),e.useEffect(()=>{h.redirectUri&&k(e=>({...e,redirectUri:h.redirectUri||"https://localhost:3000/callback"}))},[h.redirectUri]);const A=e=>{e.preventDefault(),h.requestUri&&h.clientId&&h.environmentId&&t(h)},C=(e,r)=>{w(t=>({...t,[e]:r}))},P=(e,r)=>{k(t=>({...t,[e]:r}))},$=async(e,r)=>{try{await navigator.clipboard.writeText(e),R(r),setTimeout(()=>R(""),2e3)}catch(t){}},U=()=>({endpoint:`https://auth.pingone.com/${h.environmentId}/as/par`,method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:"Basic <base64(client_id:client_secret)>"},body:new URLSearchParams({response_type:z.responseType,client_id:h.clientId,scope:z.scope,redirect_uri:z.redirectUri,state:z.state,...z.nonce&&{nonce:z.nonce},...z.codeChallenge&&{code_challenge:z.codeChallenge,code_challenge_method:z.codeChallengeMethod||"S256"}}).toString()}),D=[{title:"Current Configuration",icon:r.jsx(u,{}),description:"Use your current client ID, environment ID, and redirect URI",data:{requestUri:"urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",clientId:h.clientId,environmentId:h.environmentId,redirectUri:h.redirectUri,expiresIn:60}},{title:"PingOne Production",icon:r.jsx(p,{}),description:"Real PingOne production environment example",data:{requestUri:"urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",clientId:h.clientId||"a4f963ea-0736-456a-be72-b1fa4f63f81f",environmentId:h.environmentId||"b9817c16-9910-4415-b67e-4ac687da74d9",redirectUri:h.redirectUri||"https://localhost:3000/callback",expiresIn:60}},{title:"High Security",icon:r.jsx(m,{}),description:"Short-lived request URI for high security",data:{requestUri:"urn:ietf:params:oauth:request_uri:pingone-secure-xyz789abc123def456ghi",clientId:h.clientId||"secure-client-uuid-here",environmentId:h.environmentId||"secure-env-uuid-here",redirectUri:h.redirectUri||"https://localhost:3000/callback",expiresIn:30}},{title:"Extended Session",icon:r.jsx(g,{}),description:"Longer-lived request URI for complex flows",data:{requestUri:"urn:ietf:params:oauth:request_uri:pingone-extended-session-long-identifier",clientId:h.clientId||"extended-client-uuid",environmentId:h.environmentId||"extended-env-uuid",redirectUri:h.redirectUri||"https://localhost:3000/callback",expiresIn:300}}];return a?r.jsx(je,{children:r.jsxs(ve,{children:[r.jsxs(ye,{children:[r.jsxs(we,{children:[r.jsx(f,{}),"PAR (Pushed Authorization Request) Assistant"]}),r.jsx(ze,{children:"Use an existing PAR request URI, build a new PAR request, or learn about PAR security benefits. This tool helps you understand and implement RFC 9126 Pushed Authorization Requests with PingOne."})]}),r.jsxs(ke,{children:[r.jsxs(Ie,{children:[r.jsx(Re,{children:r.jsx(f,{size:20})}),r.jsxs(Ae,{children:[r.jsx(Ce,{children:"🔐 PAR (Pushed Authorization Request) - RFC 9126"}),r.jsx(Pe,{children:"PAR enhances OAuth 2.0 security by allowing clients to push authorization request parameters to the authorization server via a secure back-channel POST request. This prevents parameter tampering, reduces URL length limitations, and keeps sensitive data away from user agents."})]})]}),r.jsxs(_e,{children:[r.jsxs(Ee,{$active:"input"===l,onClick:()=>c("input"),children:[r.jsx(x,{size:14}),"Use Existing PAR"]}),r.jsxs(Ee,{$active:"builder"===l,onClick:()=>c("builder"),children:[r.jsx(b,{size:14}),"Build PAR Request"]}),r.jsxs(Ee,{$active:"learn"===l,onClick:()=>c("learn"),children:[r.jsx(j,{size:14}),"Learn PAR"]})]}),"input"===l&&r.jsxs("div",{children:[r.jsxs(Ge,{$variant:"warning",children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[r.jsx(s,{size:16}),r.jsx("strong",{children:"Quick Fill Examples"})]}),r.jsx("p",{style:{margin:"0 0 1rem 0",fontSize:"0.875rem"},children:"Choose a pre-configured example to understand the PAR format, then replace with your actual values."}),r.jsx(Je,{children:D.map((e,t)=>r.jsxs(Ne,{onClick:()=>w(e.data),children:[r.jsxs(Ke,{children:[e.icon,e.title]}),r.jsx(Qe,{children:e.description})]},t))})]}),r.jsxs($e,{onSubmit:A,children:[r.jsxs(Ue,{children:[r.jsxs(De,{children:[r.jsx(x,{size:14}),"PAR Request URI *"]}),r.jsx(qe,{type:"text",value:h.requestUri,onChange:e=>C("requestUri",e.target.value),placeholder:"urn:ietf:params:oauth:request_uri:pingone-abc123def456...",required:!0}),r.jsxs(Se,{children:[r.jsx("strong",{children:"Real PingOne Format:"})," ",r.jsx("code",{children:"urn:ietf:params:oauth:request_uri:pingone-[32-char-identifier]"}),r.jsx("br",{}),"This is the request_uri returned from PingOne's PAR endpoint (/as/par). It's a unique, opaque identifier that references your authorization request parameters stored server-side. Default lifetime: 60 seconds, single-use only."]})]}),r.jsxs(Ue,{children:[r.jsxs(De,{children:[r.jsx(b,{size:14}),"Client ID *"]}),r.jsx(qe,{type:"text",value:h.clientId,onChange:e=>C("clientId",e.target.value),placeholder:"a4f963ea-0736-456a-be72-b1fa4f63f81f",required:!0}),r.jsxs(Se,{children:[r.jsx("strong",{children:"PingOne Client ID:"})," UUID format (36 characters with hyphens)",r.jsx("br",{}),"Found in PingOne Admin Console → Applications → [Your App] → Configuration → Client ID"]})]}),r.jsxs(Ue,{children:[r.jsxs(De,{children:[r.jsx(p,{size:14}),"Environment ID *"]}),r.jsx(qe,{type:"text",value:h.environmentId,onChange:e=>C("environmentId",e.target.value),placeholder:"b9817c16-9910-4415-b67e-4ac687da74d9",required:!0}),r.jsxs(Se,{children:[r.jsx("strong",{children:"PingOne Environment ID:"})," UUID format (36 characters with hyphens)",r.jsx("br",{}),"Found in PingOne Admin Console → Environment → Settings → Environment ID"]})]}),r.jsxs(Ue,{children:[r.jsxs(De,{children:[r.jsx(v,{size:14}),"Redirect URI"]}),r.jsx(qe,{type:"text",value:h.redirectUri||"",onChange:e=>C("redirectUri",e.target.value),placeholder:"https://localhost:3000/callback"}),r.jsxs(Se,{children:[r.jsx("strong",{children:"OAuth Redirect URI:"})," Where users are redirected after authorization",r.jsx("br",{}),"Must match exactly with the redirect URI registered in your PingOne application"]})]}),r.jsxs(Ue,{children:[r.jsxs(De,{children:[r.jsx(n,{size:14}),"Expires In (seconds)"]}),r.jsx(qe,{type:"number",value:h.expiresIn,onChange:e=>C("expiresIn",parseInt(e.target.value,10)||60),placeholder:"60",min:"1",max:"600"}),r.jsxs(Se,{children:[r.jsx("strong",{children:"PingOne PAR Lifetime:"})," Default 60 seconds (range: 1-600 seconds)",r.jsx("br",{}),"Shorter lifetimes increase security but may cause timeouts in slow networks or complex flows."]})]})]}),h.requestUri&&h.clientId&&h.environmentId&&r.jsxs(Ge,{$variant:"success",children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[r.jsx(u,{size:16}),r.jsx("strong",{children:"Generated Authorization URL"})]}),r.jsxs(Fe,{children:[`https://auth.pingone.com/${h.environmentId}/as/authorize?client_id=${h.clientId}&request_uri=${encodeURIComponent(h.requestUri)}`,r.jsxs(Me,{onClick:()=>$(`https://auth.pingone.com/${h.environmentId}/as/authorize?client_id=${h.clientId}&request_uri=${encodeURIComponent(h.requestUri)}`,"Authorization URL"),children:["Authorization URL"===I?r.jsx(u,{size:12}):r.jsx(y,{size:12}),"Authorization URL"===I?"Copied!":"Copy"]})]}),r.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.75rem",color:"#16a34a"},children:"This is the final authorization URL that users will visit to authenticate. Notice how it only contains the client_id and request_uri - all other parameters are securely stored server-side."})]})]}),"builder"===l&&r.jsxs("div",{children:[r.jsxs(Ge,{$variant:"info",children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[r.jsx(b,{size:16}),r.jsx("strong",{children:"Build Your PAR Request"})]}),r.jsx("p",{style:{margin:0,fontSize:"0.875rem"},children:"Configure the parameters that will be sent to PingOne's PAR endpoint. This helps you understand what data gets pushed to the server before generating the authorization URL."})]}),r.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))",gap:"1rem"},children:[r.jsxs(Ue,{children:[r.jsx(De,{children:"Response Type"}),r.jsx(qe,{type:"text",value:z.responseType,onChange:e=>P("responseType",e.target.value),placeholder:"code"}),r.jsxs(Se,{children:["Standard: ",r.jsx("code",{children:"code"})," for Authorization Code flow"]})]}),r.jsxs(Ue,{children:[r.jsx(De,{children:"Scope"}),r.jsx(qe,{type:"text",value:z.scope,onChange:e=>P("scope",e.target.value),placeholder:"openid profile email"}),r.jsxs(Se,{children:["Space-separated scopes. OIDC requires ",r.jsx("code",{children:"openid"})]})]}),r.jsxs(Ue,{children:[r.jsx(De,{children:"Redirect URI"}),r.jsx(qe,{type:"text",value:z.redirectUri,onChange:e=>P("redirectUri",e.target.value),placeholder:"https://localhost:3000/callback"}),r.jsx(Se,{children:"Must match exactly with registered redirect URI"})]}),r.jsxs(Ue,{children:[r.jsx(De,{children:"State"}),r.jsx(qe,{type:"text",value:z.state,onChange:e=>P("state",e.target.value),placeholder:"abc123xyz789"}),r.jsx(Se,{children:"Random value for CSRF protection"})]}),r.jsxs(Ue,{children:[r.jsx(De,{children:"Nonce (OIDC)"}),r.jsx(qe,{type:"text",value:z.nonce||"",onChange:e=>P("nonce",e.target.value),placeholder:"n-0S6_WzA2Mj"}),r.jsx(Se,{children:"Required for OIDC ID token validation"})]}),r.jsxs(Ue,{children:[r.jsx(De,{children:"PKCE Code Challenge"}),r.jsx(qe,{type:"text",value:z.codeChallenge||"",onChange:e=>P("codeChallenge",e.target.value),placeholder:"E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"}),r.jsx(Se,{children:"Base64URL-encoded SHA256 hash of code verifier"})]})]}),r.jsxs(Ge,{$variant:"success",children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[r.jsx(v,{size:16}),r.jsx("strong",{children:"Generated PAR Request"})]}),r.jsx("p",{style:{margin:"0 0 1rem 0",fontSize:"0.875rem"},children:"This is the HTTP request you would send to PingOne's PAR endpoint:"}),r.jsxs("div",{style:{marginBottom:"1rem"},children:[r.jsx("strong",{style:{fontSize:"0.875rem"},children:"Endpoint:"}),r.jsxs(Fe,{children:["POST https://auth.pingone.com/",h.environmentId,"/as/par",r.jsxs(Me,{onClick:()=>$(`https://auth.pingone.com/${h.environmentId}/as/par`,"PAR Endpoint"),children:["PAR Endpoint"===I?r.jsx(u,{size:12}):r.jsx(y,{size:12}),"PAR Endpoint"===I?"Copied!":"Copy"]})]})]}),r.jsxs("div",{style:{marginBottom:"1rem"},children:[r.jsx("strong",{style:{fontSize:"0.875rem"},children:"Headers:"}),r.jsxs(Fe,{children:["Content-Type: application/x-www-form-urlencoded\nAuthorization: Basic <base64(client_id:client_secret)>",r.jsxs(Me,{onClick:()=>$("Content-Type: application/x-www-form-urlencoded\nAuthorization: Basic <base64(client_id:client_secret)>","Headers"),children:["Headers"===I?r.jsx(u,{size:12}):r.jsx(y,{size:12}),"Headers"===I?"Copied!":"Copy"]})]})]}),r.jsxs("div",{children:[r.jsx("strong",{style:{fontSize:"0.875rem"},children:"Request Body:"}),r.jsxs(Fe,{children:[U().body,r.jsxs(Me,{onClick:()=>$(U().body,"Request Body"),children:["Request Body"===I?r.jsx(u,{size:12}):r.jsx(y,{size:12}),"Request Body"===I?"Copied!":"Copy"]})]})]}),r.jsxs("div",{style:{marginTop:"1rem",padding:"0.75rem",background:"rgba(16, 185, 129, 0.1)",borderRadius:"6px"},children:[r.jsx("strong",{style:{fontSize:"0.875rem",color:"#16a34a"},children:"Expected Response:"}),r.jsx(Fe,{style:{marginTop:"0.5rem"},children:'{\n  "request_uri": "urn:ietf:params:oauth:request_uri:pingone-abc123def456...",\n  "expires_in": 60\n}'})]})]})]}),"learn"===l&&r.jsxs("div",{children:[r.jsxs(Ge,{$variant:"info",children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[r.jsx(j,{size:16}),r.jsx("strong",{children:"Understanding PAR (Pushed Authorization Request)"})]}),r.jsx("p",{style:{margin:0,fontSize:"0.875rem"},children:"Learn how PAR enhances OAuth 2.0 security and when to use it in your applications."})]}),r.jsxs(Be,{children:[r.jsx(Le,{children:"1"}),r.jsxs(We,{children:[r.jsx(He,{children:"🔐 What is PAR?"}),r.jsx(Ye,{children:"PAR (RFC 9126) allows OAuth clients to push authorization request parameters to the authorization server via a secure back-channel POST request, instead of passing them through the browser URL."})]})]}),r.jsxs(Be,{children:[r.jsx(Le,{children:"2"}),r.jsxs(We,{children:[r.jsx(He,{children:"🛡️ Security Benefits"}),r.jsxs(Ye,{children:["• ",r.jsx("strong",{children:"Parameter Protection:"})," Sensitive data never appears in browser URLs",r.jsx("br",{}),"• ",r.jsx("strong",{children:"Tamper Resistance:"})," Users cannot modify authorization parameters",r.jsx("br",{}),"• ",r.jsx("strong",{children:"URL Length Limits:"})," No browser URL length restrictions",r.jsx("br",{}),"• ",r.jsx("strong",{children:"Client Authentication:"})," Enforced at request creation time"]})]})]}),r.jsxs(Be,{children:[r.jsx(Le,{children:"3"}),r.jsxs(We,{children:[r.jsx(He,{children:"🔄 How PAR Works"}),r.jsxs(Ye,{children:[r.jsx("strong",{children:"Step 1:"})," Client sends POST request to /as/par with authorization parameters",r.jsx("br",{}),r.jsx("strong",{children:"Step 2:"})," Server validates and stores parameters, returns request_uri",r.jsx("br",{}),r.jsx("strong",{children:"Step 3:"})," Client redirects user to /as/authorize with only client_id and request_uri",r.jsx("br",{}),r.jsx("strong",{children:"Step 4:"})," Server retrieves stored parameters using request_uri"]})]})]}),r.jsxs(Be,{children:[r.jsx(Le,{children:"4"}),r.jsxs(We,{children:[r.jsx(He,{children:"⚡ When to Use PAR"}),r.jsxs(Ye,{children:["• ",r.jsx("strong",{children:"High Security Apps:"})," Banking, healthcare, government applications",r.jsx("br",{}),"• ",r.jsx("strong",{children:"Complex Requests:"})," Many scopes, claims, or authorization details",r.jsx("br",{}),"• ",r.jsx("strong",{children:"Mobile Apps:"})," Avoid deep link parameter limits",r.jsx("br",{}),"• ",r.jsx("strong",{children:"Compliance:"})," Regulatory requirements for parameter protection"]})]})]}),r.jsxs(Ge,{$variant:"success",children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[r.jsx(u,{size:16}),r.jsx("strong",{children:"Real-World Example: Banking Application"})]}),r.jsx("p",{style:{margin:"0 0 1rem 0",fontSize:"0.875rem"},children:"A banking app needs to request access to account data with specific authorization details:"}),r.jsxs("div",{style:{marginBottom:"1rem"},children:[r.jsx("strong",{style:{fontSize:"0.875rem"},children:"Without PAR (Traditional OAuth):"}),r.jsx(Fe,{style:{fontSize:"0.7rem"},children:"https://auth.pingone.com/env/as/authorize?\n  response_type=code&\n  client_id=banking-app&\n  scope=openid%20profile%20accounts%20transactions&\n  redirect_uri=https://bank.example.com/callback&\n  state=abc123&\n  nonce=xyz789&\n  authorization_details=%5B%7B%22type%22%3A%22account_information%22%2C%22actions%22%3A%5B%22read%22%5D%2C%22locations%22%3A%5B%22https%3A//api.bank.com%22%5D%7D%5D\n\n❌ Problems: Long URL, visible parameters, tamperable by user"})]}),r.jsxs("div",{children:[r.jsx("strong",{style:{fontSize:"0.875rem"},children:"With PAR (Secure):"}),r.jsx(Fe,{style:{fontSize:"0.7rem"},children:"https://auth.pingone.com/env/as/authorize?\n  client_id=banking-app&\n  request_uri=urn:ietf:params:oauth:request_uri:pingone-secure123\n\n✅ Benefits: Short URL, parameters stored server-side, tamper-proof"})]})]}),r.jsxs(Ge,{$variant:"warning",children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[r.jsx(s,{size:16}),r.jsx("strong",{children:"PingOne PAR Implementation Notes"})]}),r.jsxs("ul",{style:{margin:0,paddingLeft:"1.5rem",fontSize:"0.875rem"},children:[r.jsxs("li",{children:[r.jsx("strong",{children:"Endpoint:"})," ",r.jsxs("code",{children:["https://auth.pingone.com/","<env-id>","/as/par"]})]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Authentication:"})," Client credentials required (Basic Auth or client_secret_post)"]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Lifetime:"})," Default 60 seconds, configurable 1-600 seconds"]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Usage:"})," Single-use only, expires after authorization or timeout"]}),r.jsxs("li",{children:[r.jsx("strong",{children:"Format:"})," ",r.jsx("code",{children:"urn:ietf:params:oauth:request_uri:pingone-[identifier]"})]})]})]})]})]}),r.jsxs(Te,{children:[r.jsx(Oe,{type:"button",onClick:()=>{i&&i(),o&&o()},children:"Cancel"}),"input"===l&&r.jsxs(Oe,{type:"submit",$variant:"primary",onClick:A,disabled:!h.requestUri||!h.clientId||!h.environmentId,children:[r.jsx(f,{}),"Generate Authorization URL"]}),"builder"===l&&r.jsxs(Oe,{type:"button",$variant:"success",onClick:()=>{const e=`urn:ietf:params:oauth:request_uri:pingone-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;w(r=>({...r,requestUri:e})),c("input")},children:[r.jsx(v,{}),"Use This Configuration"]}),"learn"===l&&r.jsxs(Oe,{type:"button",$variant:"primary",onClick:()=>c("builder"),children:[r.jsx(b,{}),"Try Building a PAR Request"]})]})]})}):null};export{E as A,K as D,Xe as P,be as R};
//# sourceMappingURL=components-oauth-par-B-NhQsyD.js.map
