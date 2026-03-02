import{a as e,j as r,n as s,U as o,p as n,I as t,an as a,A as i}from"./react-vendor-HWZo9XlX.js";import{a as c}from"./styled-vendor-DGSsHzxd.js";import{a4 as d,h as p}from"./utils-lzKqcxFi.js";import{l}from"./pages-pingone-BLdy8FiO.js";async function m(e){try{const r=`/pingone-api/v1/environments/${encodeURIComponent(e.environmentId)}/users/${encodeURIComponent(e.userId)}/password/recovery`,s=await d("/api/pingone/password/send-recovery-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e),actualPingOneUrl:r}),o=await s.json();return s.ok?{success:!0,message:o.message||"Recovery code sent successfully"}:{success:!1,error:o.error||"unknown_error",errorDescription:o.error_description||o.message||"Failed to send recovery code"}}catch(r){return{success:!1,error:"network_error",errorDescription:r instanceof Error?r.message:"Network error occurred"}}}async function u(e,r,s,o,n){try{const t=`/pingone-api/v1/environments/${encodeURIComponent(e)}/users/${encodeURIComponent(r)}/password`,a=await d("/api/pingone/password/recover",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:e,userId:r,workerToken:s,recoveryCode:o,newPassword:n}),actualPingOneUrl:t}),i=await a.json();return a.ok?{success:!0,message:i.message||"Password recovered successfully",transactionId:i.transactionId,timestamp:(new Date).toISOString()}:{success:!1,error:i.error||"unknown_error",errorDescription:i.error_description||i.message||"Password recovery failed"}}catch(t){return{success:!1,error:"network_error",errorDescription:t instanceof Error?t.message:"Network error occurred"}}}async function g(e,r,s){try{const o=`/pingone-api/v1/environments/${encodeURIComponent(e)}/users/${encodeURIComponent(r)}/password`,n=await d("/api/pingone/password/force-change",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:e,userId:r,workerToken:s}),actualPingOneUrl:o}),t=await n.json();return n.ok?{success:!0,message:t.message||"User will be required to change password on next sign-on",transactionId:t.transactionId,timestamp:(new Date).toISOString()}:{success:!1,error:t.error||"unknown_error",errorDescription:t.error_description||t.message||"Force password change failed"}}catch(o){return{success:!1,error:"network_error",errorDescription:o instanceof Error?o.message:"Network error occurred"}}}async function w(e,r,s,o,n){try{const t=`/pingone-api/v1/environments/${encodeURIComponent(e)}/users/${encodeURIComponent(r)}/password`,a=await d("/api/pingone/password/change",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:e,userId:r,accessToken:s,oldPassword:o,newPassword:n}),actualPingOneUrl:t}),i=await a.json();return a.ok?{success:!0,message:i.message||"Password changed successfully",transactionId:i.transactionId,timestamp:(new Date).toISOString()}:{success:!1,error:i.error||"unknown_error",errorDescription:i.error_description||i.message||"Password change failed"}}catch(t){return{success:!1,error:"network_error",errorDescription:t instanceof Error?t.message:"Network error occurred"}}}async function h(e,r,s,o){try{const n=`/pingone-api/v1/environments/${encodeURIComponent(e)}/users/${encodeURIComponent(r)}/password/check`,t=await d("/api/pingone/password/check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:e,userId:r,workerToken:s,password:o}),actualPingOneUrl:n}),a=await t.json();return t.ok?{success:!0,message:a.message||"Password check successful",timestamp:(new Date).toISOString()}:{success:!1,error:a.error||"unknown_error",errorDescription:a.error_description||a.message||"Password check failed"}}catch(n){return{success:!1,error:"network_error",errorDescription:n instanceof Error?n.message:"Network error occurred"}}}async function y(e,r,s){try{const o=`/pingone-api/v1/environments/${encodeURIComponent(e)}/users/${encodeURIComponent(r)}/password/unlock`,n=await d("/api/pingone/password/unlock",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:e,userId:r,workerToken:s}),actualPingOneUrl:o}),t=await n.json();return n.ok?{success:!0,message:t.message||"Password unlocked successfully",transactionId:t.transactionId,timestamp:(new Date).toISOString()}:{success:!1,error:t.error||"unknown_error",errorDescription:t.error_description||t.message||"Password unlock failed"}}catch(o){return{success:!1,error:"network_error",errorDescription:o instanceof Error?o.message:"Network error occurred"}}}async function f(e,r,s){try{const o=`/pingone-api/v1/environments/${encodeURIComponent(e)}/users/${encodeURIComponent(r)}/password`,n=await d(`/api/pingone/password/state?environmentId=${encodeURIComponent(e)}&userId=${encodeURIComponent(r)}&workerToken=${encodeURIComponent(s)}`,{method:"GET",headers:{"Content-Type":"application/json"},actualPingOneUrl:o}),t=await n.json();return n.ok?{success:!0,passwordState:t.passwordState}:{success:!1,error:t.error||"unknown_error",errorDescription:t.error_description||t.message||"Failed to read password state"}}catch(o){return{success:!1,error:"network_error",errorDescription:o instanceof Error?o.message:"Network error occurred"}}}async function k(e,r,s,o,n){try{const t=`/pingone-api/v1/environments/${encodeURIComponent(e)}/users/${encodeURIComponent(r)}/password`,a=await d("/api/pingone/password/admin-set",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:e,userId:r,workerToken:s,newPassword:o,forceChange:n?.forceChange||!1,bypassPasswordPolicy:n?.bypassPasswordPolicy||!1}),actualPingOneUrl:t}),i=await a.json();return a.ok?{success:!0,message:i.message||"Password set successfully",transactionId:i.transactionId,timestamp:(new Date).toISOString()}:{success:!1,error:i.error||"unknown_error",errorDescription:i.error_description||i.message||"Admin password set failed"}}catch(t){return{success:!1,error:"network_error",errorDescription:t instanceof Error?t.message:"Network error occurred"}}}async function x(e,r,s,o,n){try{const t=`/pingone-api/v1/environments/${encodeURIComponent(e)}/users/${encodeURIComponent(r)}/password`,a=await d("/api/pingone/password/set",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:e,userId:r,workerToken:s,newPassword:o,forceChange:n?.forceChange||!1,bypassPasswordPolicy:n?.bypassPasswordPolicy||!1}),actualPingOneUrl:t}),i=await a.json();return a.ok?{success:!0,message:i.message||"Password set successfully",transactionId:i.transactionId,timestamp:(new Date).toISOString()}:{success:!1,error:i.error||"unknown_error",errorDescription:i.error_description||i.message||"Password set failed"}}catch(t){return{success:!1,error:"network_error",errorDescription:t instanceof Error?t.message:"Network error occurred"}}}async function b(e,r,s,o,n,t){try{const a=`/pingone-api/v1/environments/${encodeURIComponent(e)}/users/${encodeURIComponent(r)}/password`,i=await d("/api/pingone/password/ldap-gateway",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:e,userId:r,workerToken:s,newPassword:o,ldapGatewayId:n||void 0,forceChange:t?.forceChange||!1,bypassPasswordPolicy:t?.bypassPasswordPolicy||!1}),actualPingOneUrl:a}),c=await i.json();return i.ok?{success:!0,message:c.message||"Password set successfully via LDAP Gateway",transactionId:c.transactionId,timestamp:(new Date).toISOString()}:{success:!1,error:c.error||"unknown_error",errorDescription:c.error_description||c.message||"LDAP Gateway password set failed"}}catch(a){return{success:!1,error:"network_error",errorDescription:a instanceof Error?a.message:"Network error occurred"}}}const v="#F59E0B",j=c.div`
	background: #ffffff;
	border: 1px solid #E5E7EB;
	border-radius: 1rem;
	padding: 2rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,I=c.div`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
	background: ${e=>"success"===e.$type?"#F0FDF4":"error"===e.$type?"#FEF2F2":"#EFF6FF"};
	border: 1px solid ${e=>"success"===e.$type?"#22C55E":"error"===e.$type?"#DC2626":"#3B82F6"};
	color: ${e=>"success"===e.$type?"#166534":"error"===e.$type?"#991B1B":"#1E40AF"};
`,P=c.div`
	margin-bottom: 1.5rem;
`,C=c.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 600;
	color: #374151;
	font-size: 0.875rem;
`,S=c.input`
	width: 100%;
	padding: 0.75rem;
	background: #ffffff;
	border: 1px solid #D1D5DB;
	border-radius: 0.5rem;
	color: #1F2937;
	font-size: 1rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: ${v};
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
	}

	&::placeholder {
		color: #9CA3AF;
	}
`,U=c.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.5rem;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	${e=>"success"===e.$variant?"\n\t\t\t\tbackground: #22C55E;\n\t\t\t\tcolor: #ffffff;\n\t\t\t\t&:hover {\n\t\t\t\t\tbackground: #16A34A;\n\t\t\t\t}\n\t\t\t":`\n\t\t\tbackground: linear-gradient(135deg, ${v} 0%, #F97316 100%);\n\t\t\tcolor: #ffffff;\n\t\t\t&:hover {\n\t\t\t\topacity: 0.9;\n\t\t\t\ttransform: translateY(-1px);\n\t\t\t\tbox-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);\n\t\t\t}\n\t\t`}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`,$=c.div`
	background: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`,T=c.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`,E=c.div`
	width: 3rem;
	height: 3rem;
	border-radius: 50%;
	background: linear-gradient(135deg, ${v} 0%, #F97316 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: 700;
	font-size: 1.25rem;
`,D=c.div`
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	padding: 2rem;
	border-radius: 1rem;
	text-align: center;
	margin: 2rem 0;
	box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
`,O=c.h2`
	font-size: 1.5rem;
	font-weight: 700;
	margin-bottom: 0.5rem;
`,F=c.p`
	font-size: 1rem;
	opacity: 0.95;
	margin: 0;
`,_=c.div`
	margin-bottom: 1.5rem;
	padding-top: 1rem;
	border-top: 1px solid #E5E7EB;
`,R=c.a`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: ${v};
	text-decoration: none;
	font-size: 0.875rem;
	font-weight: 600;
	transition: color 0.2s;

	&:hover {
		color: #F97316;
		text-decoration: underline;
	}
`,N=c.div`
	display: inline-block;
	width: 1rem;
	height: 1rem;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-top-color: white;
	border-radius: 50%;
	animation: spin 0.6s linear infinite;

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
`,B=({environmentId:c,workerToken:m})=>{const[u,g]=e.useState(""),[w,h]=e.useState(null),[y,f]=e.useState(""),[k,x]=e.useState(!1),[b,v]=e.useState(!1),[B,z]=e.useState(!1),[A,J]=e.useState(!1),[q,L]=e.useState(!1),[V,G]=e.useState(!1);return r.jsxs(j,{children:[r.jsx("h2",{style:{marginBottom:"1.5rem",fontSize:"1.5rem",color:"#1F2937"},children:"Update Password (Set Value)"}),r.jsxs(I,{$type:"success",style:{marginBottom:"1.5rem",borderColor:"#22C55E",background:"#F0FDF4"},children:[r.jsx(s,{style:{color:"#22C55E"}}),r.jsxs("div",{children:[r.jsx("strong",{style:{color:"#22C55E"},children:"✅ Recommended for Admin Password Resets"}),r.jsxs("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.875rem"},children:[r.jsx("strong",{children:"Requires:"})," Worker token + New password",r.jsx("br",{}),r.jsx("strong",{children:"Content-Type Header:"})," ",r.jsx("code",{style:{background:"#F3F4F6",padding:"0.25rem 0.5rem",borderRadius:"0.25rem",fontSize:"0.875rem"},children:"application/vnd.pingidentity.password.setValue+json"}),r.jsx("br",{}),r.jsx("strong",{style:{color:"#22C55E"},children:"✅ This is the recommended approach:"})," Sets password without requiring a recovery code and does ",r.jsx("strong",{children:"NOT"})," put the user in a forced password change state. The user can sign in immediately with the new password."]})]})]}),r.jsx(_,{children:r.jsxs(R,{href:"https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords",target:"_blank",rel:"noopener noreferrer",children:[r.jsx(o,{}),"PingOne API: Update Password (Set Value) - Content-Type: application/vnd.pingidentity.password.setValue+json",r.jsx(n,{size:14})]})}),V&&r.jsxs(D,{children:[r.jsxs(O,{children:[r.jsx(s,{style:{marginRight:"0.5rem",verticalAlign:"middle"}}),"Password Set Successfully!"]}),r.jsx(F,{children:"The user's password has been set. They can now sign in with the new password without being forced to change it."})]}),r.jsxs(P,{children:[r.jsx(C,{children:"Username or Email"}),r.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[r.jsx(S,{type:"text",placeholder:"Enter username or email",value:u,onChange:e=>g(e.target.value)}),r.jsxs(U,{onClick:async()=>{if(u&&m&&c){J(!0),h(null),G(!1);try{const e=await l({environmentId:c,accessToken:m,identifier:u.trim()});e.user?.id?(h(e.user),p.showSuccess(`User found: ${e.user.email||e.user.username||e.user.id}`)):p.showError(`User not found with identifier: ${u}. Please check the username or email address.`)}catch(e){const r=e instanceof Error?e.message:"Failed to lookup user";p.showError(`${r}. Make sure the worker token has p1:read:user scope.`)}finally{J(!1)}}else p.showError("Please configure worker token and environment ID first")},disabled:A||q||!u,children:[A?r.jsx(N,{}):r.jsx(t,{}),A?"Looking up...":"Lookup"]})]})]}),w&&r.jsxs(r.Fragment,{children:[r.jsx($,{children:r.jsxs(T,{children:[r.jsx(E,{children:w.name?.given||w.username?.[0]?.toUpperCase()||"U"}),r.jsxs("div",{children:[r.jsxs("div",{style:{fontWeight:600},children:[w.name?.given," ",w.name?.family]}),r.jsx("div",{style:{fontSize:"0.875rem",color:"#6B7280"},children:w.email||w.username})]})]})}),r.jsxs(P,{children:[r.jsx(C,{children:"New Password"}),r.jsxs("div",{style:{position:"relative"},children:[r.jsx(S,{type:k?"text":"password",placeholder:"Enter new password",value:y,onChange:e=>f(e.target.value),style:{paddingRight:"3rem"}}),r.jsx("button",{type:"button",onClick:()=>x(!k),style:{position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#6B7280",cursor:"pointer",padding:"0.25rem"},children:k?r.jsx(a,{}):r.jsx(i,{})})]})]}),r.jsxs(P,{children:[r.jsxs(C,{style:{display:"flex",alignItems:"center",gap:"0.5rem",cursor:"pointer"},children:[r.jsx("input",{type:"checkbox",checked:b,onChange:e=>v(e.target.checked),style:{width:"1.25rem",height:"1.25rem",cursor:"pointer"}}),r.jsx("span",{children:"Force password change on next sign-on"})]}),r.jsx("p",{style:{marginTop:"0.5rem",fontSize:"0.875rem",color:"#6B7280",marginLeft:"1.75rem"},children:"If checked, the user will be required to change their password when they next sign in. Leave unchecked to allow immediate sign-in with the new password."})]}),r.jsxs(P,{children:[r.jsxs(C,{style:{display:"flex",alignItems:"center",gap:"0.5rem",cursor:"pointer"},children:[r.jsx("input",{type:"checkbox",checked:B,onChange:e=>z(e.target.checked),style:{width:"1.25rem",height:"1.25rem",cursor:"pointer"}}),r.jsx("span",{children:"Bypass password policy"})]}),r.jsx("p",{style:{marginTop:"0.5rem",fontSize:"0.875rem",color:"#6B7280",marginLeft:"1.75rem"},children:"If checked, the password will be set even if it doesn't meet the password policy requirements. Use with caution - this allows setting weak passwords that may violate security policies."})]}),r.jsxs(U,{$variant:"success",onClick:async()=>{if(w&&y&&m&&c){L(!0),G(!1);try{const e=await async function(e,r,s,o,n){try{const t=`/pingone-api/v1/environments/${encodeURIComponent(e)}/users/${encodeURIComponent(r)}/password`,a=await d("/api/pingone/password/set-value",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:e,userId:r,workerToken:s,passwordValue:o,forceChange:n?.forceChange||!1,bypassPasswordPolicy:n?.bypassPasswordPolicy||!1}),actualPingOneUrl:t}),i=await a.json();return a.ok?{success:!0,message:i.message||"Password value set successfully",transactionId:i.transactionId,timestamp:(new Date).toISOString()}:{success:!1,error:i.error||"unknown_error",errorDescription:i.error_description||i.message||"Password value set failed"}}catch(t){return{success:!1,error:"network_error",errorDescription:t instanceof Error?t.message:"Network error occurred"}}}(c,w.id,m,y,{forceChange:b,bypassPasswordPolicy:B});if(e.success){G(!0);const e=b?"Password set successfully! User will be required to change password on next sign-on.":"Password set successfully! User can now sign in with the new password.";p.showSuccess(e),f(""),setTimeout(()=>G(!1),5e3)}else p.showError(e.errorDescription||"Password set failed")}catch(e){p.showError(e instanceof Error?e.message:"Password set failed")}finally{L(!1)}}else p.showError("Please fill in all required fields")},disabled:q||!y,children:[q?r.jsx(N,{}):r.jsx(s,{}),q?"Setting...":"Set Password (Recommended)"]})]})]})};export{B as P,h as a,f as b,w as c,k as d,x as e,g as f,b as g,u as r,m as s,y as u};
//# sourceMappingURL=components-password-reset-BIeiPLwA.js.map
