import{j as e,Q as r,k as t}from"./react-vendor-HWZo9XlX.js";import{a as i}from"./styled-vendor-DGSsHzxd.js";import{ar as s}from"./utils-lzKqcxFi.js";const n=i.div`
	margin-bottom: 1.5rem;
`,o=i.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`,l=i.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background-color: #ffffff;
	cursor: pointer;
	transition: all 0.2s ease-in-out;

	&:hover:not(:disabled) {
		border-color: #9ca3af;
	}

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&:disabled {
		background-color: #f3f4f6;
		cursor: not-allowed;
		opacity: 0.6;
	}
`,a=i.div`
	margin-top: 0.5rem;
	padding: 0.75rem;
	background-color: ${e=>{switch(e.$level){case"Highest":return"#ecfdf5";case"High":return"#eff6ff";case"Medium":return"#fffbeb";case"Low":return"#fef2f2";default:return"#f3f4f6"}}};
	border-left: 3px solid ${e=>{switch(e.$level){case"Highest":return"#10b981";case"High":return"#3b82f6";case"Medium":return"#f59e0b";case"Low":return"#ef4444";default:return"#9ca3af"}}};
	border-radius: 0.375rem;
	font-size: 0.75rem;
	line-height: 1.5;
	color: #4b5563;
`,c=i.span`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.125rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.6875rem;
	font-weight: 600;
	background-color: ${e=>{switch(e.$level){case"Highest":return"#10b981";case"High":return"#3b82f6";case"Medium":return"#f59e0b";case"Low":return"#ef4444";default:return"#9ca3af"}}};
	color: #ffffff;
`,d=i.div`
	margin-top: 0.375rem;
	font-size: 0.75rem;
	color: #6b7280;
	display: flex;
	align-items: start;
	gap: 0.375rem;

	svg {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
`,f=["none","client_secret_basic","client_secret_post","client_secret_jwt","private_key_jwt"],m={none:"None (Public Client)",client_secret_basic:"Client Secret Basic",client_secret_post:"Client Secret Post",client_secret_jwt:"Client Secret JWT",private_key_jwt:"Private Key JWT"},u=({value:i,onChange:u,allowedMethods:h=f,disabled:b=!1,showDescription:p=!0})=>{const g=s(i);return e.jsxs(n,{children:[e.jsxs(o,{children:[e.jsx(r,{}),"Token Endpoint Authentication Method"]}),e.jsx(l,{value:i,onChange:e=>{u(e.target.value)},disabled:b,children:h.map(r=>e.jsx("option",{value:r,children:m[r]},r))}),p&&g&&e.jsxs(a,{$level:g.level,children:[e.jsx("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.375rem"},children:e.jsxs(c,{$level:g.level,children:[g.icon," ",g.level," Security"]})}),e.jsx("div",{children:g.description})]}),e.jsxs(d,{children:[e.jsx(t,{}),e.jsx("span",{children:'Specifies how the client authenticates with the token endpoint. Public clients (SPAs, mobile apps) use "None". Confidential clients use secret or JWT-based methods.'})]})]})};export{u as C};
//# sourceMappingURL=components-oauth-client-BhjYl9xl.js.map
