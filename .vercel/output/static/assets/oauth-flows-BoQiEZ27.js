const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/utils-lzKqcxFi.js","assets/react-vendor-HWZo9XlX.js","assets/vendor-CvVeuJe7.js","assets/vendor-54DrP_uy.css","assets/components-credentials-T7jmF3zx.js","assets/styled-vendor-DGSsHzxd.js","assets/components-oauth-qq-maH2w.js","assets/v8u-services-CviCpCEt.js","assets/v8-services-DHsPM8a2.js","assets/v8-components-8swtZwHb.js","assets/v8-utils-BU6AoW1l.js","assets/v8u-components-COnDGHJS.js","assets/components-flow-core-y1x-SJYd.js","assets/components-token-uXxDPBqK.js","assets/oauth-flows-device-CMULWbHZ.js","assets/pages-ai-D2KhTcan.js","assets/pages-DE-6TDOE.js","assets/components-oauth-authorize-sao_-EgS.js","assets/components-oauth-discovery-DYbdhNwI.js","assets/pages-pingone-BLdy8FiO.js","assets/oauth-flows-authcode-ltS0AxHA.js","assets/components-oauth-par-B-NhQsyD.js","assets/oauth-flows-implicit-BlAJpg9o.js","assets/components-ui-DbX9aVva.js","assets/components-oauth-client-BhjYl9xl.js","assets/components-flow-core-DEegsKK7.css","assets/oauth-flows-par-DTJ0aZ64.js","assets/pages-docs-nYnYMLbe.js","assets/v8-hooks-B7CjPGrP.js","assets/v8-flows-CbgB_G0p.js","assets/v8-flows-Bwbl_h2s.css"])))=>i.map(i=>d[i]);
import{a as e,j as t,n,Q as r,i as o,k as s,p as i,m as a,h as c,v as l,Y as d,E as h,l as p,U as u,F as m,aY as g,a9 as f,a3 as x,I as w,b4 as b,a2 as k,_ as j,an as y,A as v,J as S,B as C,R as I}from"./react-vendor-HWZo9XlX.js";import{a as P}from"./styled-vendor-DGSsHzxd.js";import{a4 as _,h as T,ag as A,ah as E,N as R,k as O,e as F,b as M,ai as U,J as $,B as z,f as D,aj as L,ak as B,a as N,p as K,a8 as q,a7 as V,al as J,o as W,t as G,am as H,an as Y}from"./components-oauth-qq-maH2w.js";import{S as X,C as Q,e as Z,g as ee,a as te,h as ne}from"./components-flow-core-y1x-SJYd.js";import{a as re,s as oe,j as se,k as ie,m as ae,A as ce,h as le,n as de}from"./components-credentials-T7jmF3zx.js";import{aw as he,ap as pe,ax as ue,at as me,au as ge,h as fe,ai as xe,a4 as we,l as be,c as ke,ay as je,az as ye,X as ve,_ as Se,aA as Ce,aB as Ie}from"./utils-lzKqcxFi.js";import{a as Pe,u as _e}from"./pages-ai-D2KhTcan.js";import{C as Te,c as Ae}from"./oauth-flows-device-CMULWbHZ.js";import{F as Ee,U as Re,V as Oe}from"./pages-DE-6TDOE.js";import{g as Fe,W as Me}from"./components-token-uXxDPBqK.js";import{a as Ue,f as $e}from"./v8u-services-CviCpCEt.js";import{u as ze,a as De,F as Le}from"./oauth-flows-authcode-ltS0AxHA.js";import{E as Be}from"./oauth-flows-par-DTJ0aZ64.js";import{F as Ne,a as Ke}from"./oauth-flows-implicit-BlAJpg9o.js";import{c as qe,F as Ve}from"./components-flow-BH3Bx-YA.js";import{I as Je}from"./components-steps-BQ6HbS5x.js";const We="client-credentials-v5",Ge="ClaimScope",He=()=>({environmentId:"",clientId:"",clientSecret:"",redirectUri:"",scope:Ge,scopes:Ge,responseType:"",grantType:"client_credentials",authorizationEndpoint:"",tokenEndpoint:"",clientAuthMethod:"client_secret_post"}),Ye=()=>({issuer:"https://auth.pingone.com/",clientId:"",clientSecret:"",authMethod:"client_secret_post",scopes:Ge,audience:"",resource:"",tokenEndpoint:"",jwtSigningAlg:"HS256",jwtSigningKid:"",jwtPrivateKey:"",enableMtls:!1,mtlsCert:"",mtlsKey:"",accessTokenLifetime:3600,refreshTokenLifetime:86400}),Xe=e=>{let t=e.replace(/-/g,"+").replace(/_/g,"/");for(;t.length%4;)t+="=";return atob(t)},Qe=e=>btoa(e).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,""),Ze=async e=>{const t=Math.floor(Date.now()/1e3),n=((e=32)=>{const t=new Uint8Array(e);return crypto.getRandomValues(t),Array.from(t,e=>e.toString(16).padStart(2,"0")).join("")})(16),r={alg:e.jwtSigningAlg||"HS256",typ:"JWT",...e.jwtSigningKid&&{kid:e.jwtSigningKid}},o={iss:e.clientId,sub:e.clientId,aud:e.tokenEndpoint||`${e.issuer}/as/token`,exp:t+300,iat:t,nbf:t,jti:n},s=`${Qe(JSON.stringify(r))}.${Qe(JSON.stringify(o))}`;let i;if("client_secret_jwt"===e.authMethod){const t=new TextEncoder,n=t.encode(e.clientSecret||""),r=await crypto.subtle.importKey("raw",n,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),o=await crypto.subtle.sign("HMAC",r,t.encode(s));i=Qe(String.fromCharCode(...new Uint8Array(o)))}else{if("private_key_jwt"!==e.authMethod)throw new Error(`Unsupported JWT authentication method: ${e.authMethod}`);{if(!e.jwtPrivateKey)throw new Error("Private key is required for private_key_jwt authentication");const t=e.jwtPrivateKey.replace(/-----BEGIN PRIVATE KEY-----/,"").replace(/-----END PRIVATE KEY-----/,"").replace(/\s/g,""),n=Uint8Array.from(atob(t),e=>e.charCodeAt(0)),r=await crypto.subtle.importKey("pkcs8",n,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},!1,["sign"]),o=new TextEncoder,a=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",r,o.encode(s));i=Qe(String.fromCharCode(...new Uint8Array(a)))}}return`${s}.${i}`},et=async(e,t)=>{const n={"Content-Type":"application/x-www-form-urlencoded"};let r=t.toString();switch(e.authMethod){case"client_secret_basic":{const t=btoa(`${e.clientId}:${e.clientSecret||""}`);n.Authorization=`Basic ${t}`;break}case"client_secret_post":t.append("client_id",e.clientId),e.clientSecret&&t.append("client_secret",e.clientSecret),r=t.toString();break;case"client_secret_jwt":case"private_key_jwt":t.append("client_id",e.clientId),t.append("client_assertion_type","urn:ietf:params:oauth:client-assertion-type:jwt-bearer");try{const n=await Ze(e);t.append("client_assertion",n),r=t.toString()}catch(o){throw new Error(`Failed to generate JWT assertion: ${o instanceof Error?o.message:"Unknown error"}`)}break;case"tls_client_auth":t.append("client_id",e.clientId);try{const o=await(async e=>{if(!e.mtlsCert||!e.mtlsKey)throw new Error("mTLS certificate and key are required for tls_client_auth");return{headers:{"Content-Type":"application/x-www-form-urlencoded","X-Client-Certificate":e.mtlsCert},body:""}})(e);Object.assign(n,o.headers),r=t.toString()}catch(o){throw new Error(`Failed to apply mTLS authentication: ${o instanceof Error?o.message:"Unknown error"}`)}break;case"none":t.append("client_id",e.clientId),r=t.toString()}return{headers:n,body:r}},tt=(t={})=>{const{flowKey:n=We,defaultFlowVariant:r="oauth"}=t,o=`client-credentials-${n}`,{scrollToTopAfterAction:s}=Pe(),[i,a]=e.useState(r),[c,l]=e.useState(He),[d,h]=e.useState(Ye),[p,u]=e.useState(null),[m,g]=e.useState(null),[f,x]=e.useState(!1),[w,b]=e.useState(!1),[k,j]=e.useState(!1),[y,v]=e.useState(!1),[S,C]=e.useState(null),[I,P]=e.useState(!1),[_,T]=e.useState(!1),A=he({flowType:"client-credentials",persistKey:o,defaultStep:0});e.useEffect(()=>{(async()=>{try{const{credentials:e,flowState:t,hasSharedCredentials:n}=await se.loadFlowCredentials({flowKey:o,defaultCredentials:{...He(),grantType:"client_credentials"}});if(e){const n=e.scope?.trim()||"",s=""!==n&&/^p1:read:user p1:update:user p1:read:device p1:update:device$/i.test(n),i={...e,scope:s?Ge:e.scope||Ge,scopes:s?Ge:e.scopes||e.scope||Ge};l(e),!s&&e.scope||(l(i),h(e=>({...e,scopes:Ge})),localStorage.setItem(o,JSON.stringify({credentials:i,flowConfig:{...t?.flowConfig||Ye(),scopes:Ge},tokens:t?.tokens,flowVariant:t?.flowVariant||r}))),j(!0)}t&&(t.flowConfig&&h(t.flowConfig),t.tokens&&u(t.tokens),t.flowVariant&&a(t.flowVariant))}catch(e){}})()},[o,r]),e.useEffect(()=>{const e=setTimeout(()=>{const e={credentials:c,flowConfig:d,tokens:p,flowVariant:i};localStorage.setItem(o,JSON.stringify(e))},500);return()=>clearTimeout(e)},[c,d,p,i,o]),e.useEffect(()=>{const e=""!==c.clientId||""!==c.clientSecret||""!==c.environmentId||d.issuer!==Ye().issuer||d.scopes!==Ye().scopes;v(e)},[c,d]);const E=e.useCallback(e=>{h(e),l(t=>({...t,clientId:e.clientId,clientSecret:e.clientSecret||"",environmentId:e.issuer.includes("pingone.com")&&e.issuer.split("/").slice(-2,-1)[0]||"",tokenEndpoint:e.tokenEndpoint||`${e.issuer}/as/token`,scope:e.scopes,scopes:e.scopes}))},[]),R=e.useCallback(async()=>{if(d.clientId){switch(d.authMethod){case"client_secret_post":case"client_secret_basic":case"client_secret_jwt":if(!d.clientSecret)return void re("Client Secret is required for this authentication method");break;case"private_key_jwt":if(!d.jwtPrivateKey)return void re("Private Key is required for private_key_jwt authentication");break;case"tls_client_auth":if(!d.mtlsCert||!d.mtlsKey)return void re("mTLS Certificate and Key are required for tls_client_auth")}x(!0);try{const e=d.tokenEndpoint||`${d.issuer}/as/token`,t=new URLSearchParams;t.append("grant_type","client_credentials"),d.scopes&&t.append("scope",d.scopes),d.audience&&t.append("audience",d.audience),d.resource&&t.append("resource",d.resource),d.includeX5tParameter&&t.append("request_x5t","true");const{headers:n,body:r}=await et(d,t),o=await fetch(e,{method:"POST",headers:n,body:r}),s=await o.json();if(!o.ok)throw new Error(s.error_description||s.error||"Token request failed");const i={access_token:s.access_token,token_type:s.token_type||"Bearer",expires_in:s.expires_in,scope:s.scope,refresh_token:s.refresh_token,issued_at:Math.floor(Date.now()/1e3)};u(i),g((e=>{try{const t=e.split(".");if(3!==t.length)return null;const n=JSON.parse(Xe(t[0]));return{header:n,payload:JSON.parse(Xe(t[1])),signature:t[2]}}catch(t){return null}})(i.access_token)),await pe({...i,expires_in:i.expires_in||3600,scope:i.scope||""},"client-credentials"),ue("client-credentials",!0,JSON.stringify({tokenType:i.token_type,expiresIn:i.expires_in||3600,scope:i.scope||"",authMethod:d.authMethod})),oe(`Access token retrieved successfully using ${d.authMethod}!`)}catch(e){const t=e instanceof Error?e.message:"Unknown error occurred";re(`Token request failed: ${t}`)}finally{x(!1)}}else re("Client ID is required")},[d]),O=e.useCallback(async()=>{p?.access_token?m?oe("Token introspection completed (JWT decoded)"):re("Token introspection not available for opaque tokens"):re("No access token available for introspection")},[p,m]),F=e.useCallback(async()=>{b(!0);try{await se.saveFlowCredentials(o,c,d,{flowVariant:i,tokens:p})&&j(!0)}catch(e){re("Failed to save credentials")}finally{b(!1)}},[c,d,i,p,o]),M=e.useCallback(()=>{h(Ye()),u(null),g(null),v(!1),A.resetFlow(),s(),oe("Flow reset successfully. Credentials preserved.")},[A,s]),U=e.useCallback((e,t)=>{navigator.clipboard.writeText(e).then(()=>{C(t),oe(`${t} copied to clipboard!`),setTimeout(()=>C(null),2e3)}).catch(()=>{re("Failed to copy to clipboard")})},[]),$=e.useCallback(e=>{const t=Math.floor(Date.now()/1e3);return new Date(1e3*(t+e)).toLocaleString()},[]),z=e.useCallback(()=>{if(!p?.expires_in||!p?.issued_at)return!1;return Math.floor(Date.now()/1e3)>=p.issued_at+p.expires_in},[p]),D=e.useCallback((e,t)=>{const n=me(`${o}-step-results`,{});n[e]=t,localStorage.setItem(`${o}-step-results`,JSON.stringify(n))},[o]),L=e.useCallback(e=>void 0!==me(`${o}-step-results`,{})[e],[o]),B=e.useCallback(()=>{localStorage.removeItem(`${o}-step-results`)},[o]);return e.useEffect(()=>{const e=c.environmentId?.trim(),t=c.clientId?.trim(),n=c.clientSecret?.trim(),r=d.clientSecret?.trim(),o=d.jwtPrivateKey?.trim(),s=d.mtlsCert?.trim(),i=d.mtlsKey?.trim(),a=c.clientAuthMethod||d.authMethod||"client_secret_post",l=Boolean(e&&t);let h=!1;const p=[];switch(a){case"client_secret_post":case"client_secret_basic":case"client_secret_jwt":h=Boolean(n||r),h||p.push("Client Secret");break;case"private_key_jwt":h=Boolean(o),h||p.push("Private Key");break;case"tls_client_auth":h=Boolean(s&&i),h||(s||p.push("mTLS Certificate"),i||p.push("mTLS Private Key"));break;default:h=!0}const u=l&&h;P(u)},[c,d]),{flowVariant:i,setFlowVariant:a,persistKey:o,credentials:c,setCredentials:l,setFlowConfig:h,flowConfig:d,handleFlowConfigChange:E,tokens:p,decodedToken:m,isRequesting:f,requestToken:R,introspectToken:O,setTokens:u,isLoading:_,setIsLoading:T,resetFlow:M,reset:M,isSavingCredentials:w,hasCredentialsSaved:k,hasUnsavedCredentialChanges:y,saveCredentials:F,hasValidCredentials:I,handleCopy:U,copiedField:S,formatExpiry:$,isTokenExpired:z,stepManager:A,saveStepResult:D,hasStepResult:L,clearStepResults:B}};const nt=new class{BACKUP_KEY="masterflow_api_credential_backup";MAX_BACKUP_SIZE=50;saveCredentialBackup(e,t){try{const n={flowKey:e,environmentId:t.environmentId,clientId:t.clientId,redirectUri:t.redirectUri,postLogoutRedirectUri:t.postLogoutRedirectUri,scopes:t.scopes,responseType:t.responseType},r=this.getCredentialBackup();r[e]=n;const o=Object.entries(r);if(o.length>this.MAX_BACKUP_SIZE){const e=o.sort((e,t)=>e[0].localeCompare(t[0])),t={};e.slice(-this.MAX_BACKUP_SIZE).forEach(([e,n])=>{t[e]=n}),localStorage.setItem(this.BACKUP_KEY,JSON.stringify(t))}else localStorage.setItem(this.BACKUP_KEY,JSON.stringify(r))}catch(n){}}loadCredentialBackup(e){try{return this.getCredentialBackup()[e]||null}catch(t){return null}}getCredentialBackup(){try{const e=localStorage.getItem(this.BACKUP_KEY);return e?JSON.parse(e):{}}catch(e){return{}}}clearFlowBackup(e){try{const t=this.getCredentialBackup();delete t[e],localStorage.setItem(this.BACKUP_KEY,JSON.stringify(t))}catch(t){}}clearAllBackups(){try{localStorage.removeItem(this.BACKUP_KEY)}catch(e){}}generateEnvFile(){const e=this.getCredentialBackup(),t=[];return t.push("# MasterFlow API Credential Backup"),t.push("# Generated automatically - contains non-sensitive configuration only"),t.push("# DO NOT include client secrets or worker tokens in this file"),t.push(""),Object.entries(e).forEach(([e,n])=>{t.push(`# ${e} flow configuration`),n.environmentId&&t.push(`${e.toUpperCase().replace(/-/g,"_")}_ENVIRONMENT_ID=${n.environmentId}`),n.clientId&&t.push(`${e.toUpperCase().replace(/-/g,"_")}_CLIENT_ID=${n.clientId}`),n.redirectUri&&t.push(`${e.toUpperCase().replace(/-/g,"_")}_REDIRECT_URI=${n.redirectUri}`),n.postLogoutRedirectUri&&t.push(`${e.toUpperCase().replace(/-/g,"_")}_POST_LOGOUT_REDIRECT_URI=${n.postLogoutRedirectUri}`),n.scopes&&n.scopes.length>0&&t.push(`${e.toUpperCase().replace(/-/g,"_")}_SCOPES=${n.scopes.join(" ")}`),n.responseType&&t.push(`${e.toUpperCase().replace(/-/g,"_")}_RESPONSE_TYPE=${n.responseType}`),t.push("")}),t.join("\n")}downloadEnvFile(){try{const e=this.generateEnvFile(),t=new Blob([e],{type:"text/plain"}),n=URL.createObjectURL(t),r=document.createElement("a");r.href=n,r.download="masterflow-api-credentials.env",document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(n)}catch(e){}}restoreFromBackup(e){const t=this.loadCredentialBackup(e);if(!t)return{};const n={};return t.environmentId&&(n.environmentId=t.environmentId),t.clientId&&(n.clientId=t.clientId),t.redirectUri&&(n.redirectUri=t.redirectUri),t.postLogoutRedirectUri&&(n.postLogoutRedirectUri=t.postLogoutRedirectUri),t.scopes&&(n.scopes=t.scopes),t.responseType&&(n.responseType=t.responseType),n}getBackupStats(){const e=this.getCredentialBackup();return{totalFlows:Object.keys(e).length,flows:Object.keys(e),lastUpdated:(new Date).toISOString()}}},rt=({flowKey:t,credentials:n,setCredentials:r,enabled:o=!0})=>{e.useEffect(()=>{o&&n&&(n.environmentId||n.clientId)&&nt.saveCredentialBackup(t,n)},[t,n,o]),e.useEffect(()=>{if(!o)return;const e=n??{};if(!e.environmentId&&!e.clientId){const n=nt.restoreFromBackup(t);(n.environmentId||n.clientId)&&r({...e,...n})}},[t,o,n,r]);return{clearBackup:()=>{o&&nt.clearFlowBackup(t)},getBackupStats:()=>nt.getBackupStats(),downloadEnvFile:()=>{nt.downloadEnvFile()}}},ot=Ee.getContainer(),st=Ee.getContentWrapper(),it=P.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`,at=P.div`
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`,ct=P.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`,lt=P.div`
	background: rgba(255, 255, 255, 0.2);
	color: #ffffff;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
`,dt=P.h2`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
`,ht=P.p`
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.85);
	margin: 0;
`,pt=P.div`
	text-align: right;
`,ut=P.div`
	font-size: 2.5rem;
	font-weight: 700;
	line-height: 1;
`,mt=P.div`
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.75);
	letter-spacing: 0.05em;
`,gt=P.div`
	padding: 2rem;
`,ft=P.div`
	margin-bottom: 1.5rem;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	overflow: hidden;
`,xt=P.button`
	width: 100%;
	padding: 1rem;
	background: #f9fafb;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: background-color 0.2s ease;

	&:hover {
		background: #f3f4f6;
	}
`,wt=P.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	color: #374151;
`,bt=P.div`
	padding: 1rem;
	background: white;
`,kt=P.button`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	border: none;
	cursor: pointer;
	font-weight: 600;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	opacity: ${e=>e.loading?.7:1};
	pointer-events: ${e=>e.loading?"none":"auto"};

	${e=>"primary"===e.variant?"\n\t\tbackground: #3b82f6;\n\t\tcolor: white;\n\t\t&:hover {\n\t\t\tbackground: #2563eb;\n\t\t}\n\t":"\n\t\tbackground: #f3f4f6;\n\t\tcolor: #374151;\n\t\t&:hover {\n\t\t\tbackground: #e5e7eb;\n\t\t}\n\t"}
`,jt=P.div`
	padding: 1.25rem;  // Increased padding for better readability
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;  // Increased bottom margin for better spacing
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	${e=>{switch(e.$variant){case"success":return"background: #dcfce7; border: 1px solid #10b981; color: #166534;";case"warning":return"background: #fef3c7; border: 1px solid #f59e0b; color: #d97706;";case"error":return"background: #fef2f2; border: 1px solid #ef4444; color: #dc2626;";default:return"background: #dbeafe; border: 1px solid #3b82f6; color: #1e40af;"}}}
`,yt=P.h4`
	margin: 0 0 0.5rem 0;
	font-size: 1rem;
	font-weight: 600;
`,vt=P.p`
	margin: 0;
	font-size: 0.875rem;
	line-height: 1.5;
`,St=P.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	overflow-x: auto;
	margin: 1rem 0;
`,Ct=P.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
`,It=P.div`
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`,Pt=P.div`
	display: flex;
	gap: 1rem;
	margin: 1rem 0;
	flex-wrap: wrap;
`,_t=[{title:"Credentials & Configuration",subtitle:"Set up your client credentials and authentication method",description:"Configure environment, client ID, client secret, and authentication method"},{title:"Authentication Method",subtitle:"Choose how to authenticate with the authorization server",description:"Select between client_secret_post, client_secret_basic, or none"},{title:"Token Request",subtitle:"Generate and send the token request",description:"Create the token request with proper authentication"},{title:"Token Response",subtitle:"Receive and validate the access token",description:"Process the token response and validate the access token"},{title:"API Call",subtitle:"Use the access token to call protected APIs",description:"Make authenticated requests to protected resources"},{title:"Token Introspection",subtitle:"Validate the access token",description:"Introspect the token to verify its validity and claims"},{title:"Flow Complete",subtitle:"Review the completed flow",description:"Summary of the client credentials flow implementation"}],Tt=()=>{const[p,u]=e.useState(0),[m,g]=e.useState({credentials:!1,authMethod:!1,tokenRequest:!1,tokenResponse:!1,apiCall:!1,introspection:!1});_e({pageName:"Client Credentials V7",force:!0}),e.useEffect(()=>{ge(f.credentials,{flowName:"Client Credentials Flow",requiredFields:["environmentId","clientId","clientSecret"],showToast:!0})},[f.credentials]);const f=tt({flowKey:"client-credentials-v7"}),{clearBackup:x}=rt({flowKey:"client-credentials-v7",credentials:f.credentials,setCredentials:f.setCredentials,enabled:!0}),w=e.useCallback(e=>{g(t=>({...t,[e]:!t[e]}))},[]),b=e.useCallback(()=>{p<_t.length-1&&u(e=>e+1)},[p]),k=e.useCallback(()=>{p>0&&u(e=>e-1)},[p]),j=e.useCallback(()=>{u(0),f.resetFlow();try{se.clearFlowState("client-credentials-v7")}catch(e){fe.showError("Failed to clear flow state. Please refresh the page.")}try{sessionStorage.removeItem("config-checker-diffs"),sessionStorage.removeItem("config-checker-last-check"),sessionStorage.removeItem("pingone-app-cache"),localStorage.removeItem("pingone-applications-cache"),sessionStorage.removeItem("worker-token-cache"),localStorage.removeItem("worker-apps-cache")}catch(e){}try{x()}catch(e){}},[f,x]),y=e.useCallback(e=>{switch(e){case 0:case 2:return!(!f.credentials.environmentId||!f.credentials.clientId);case 1:case 6:return!0;case 3:case 4:case 5:return!!f.tokens?.access_token;default:return!1}},[f.credentials,f.tokens]),v=e.useCallback(e=>{switch(e){case 0:case 2:return f.credentials.environmentId?f.credentials.clientId?"":"Client ID is required":"Environment ID is required";case 3:case 4:case 5:return f.tokens?.access_token?"":"Access token is required. Please complete the token request first.";default:return""}},[f.credentials,f.tokens]),S=e.useMemo(()=>y(p)&&p<_t.length-1,[p,y]);e.useEffect(()=>{f.credentials&&(f.credentials.environmentId||f.credentials.clientId)&&se.saveFlowCredentials("client-credentials-v7",f.credentials,{showToast:!1}).catch(e=>{fe.showError("Failed to save credentials. Please try again.")})},[f.credentials]);const C=e.useCallback(()=>{switch(p){case 0:return t.jsxs(ft,{children:[t.jsxs(xt,{onClick:()=>w("credentials"),"aria-expanded":!m.credentials,children:[t.jsxs(wt,{children:[t.jsx(h,{})," Credentials & Configuration"]}),t.jsx(o,{})]}),!m.credentials&&t.jsx(bt,{children:t.jsx(Te,{flowType:"client-credentials",onCredentialsChange:e=>{f.setCredentials(e)},formData:{environmentId:f.credentials.environmentId,clientId:f.credentials.clientId,clientSecret:f.credentials.clientSecret,grantTypes:["client_credentials"],responseTypes:[],tokenEndpointAuthMethod:f.credentials.clientAuthMethod||"client_secret_post"},title:t.jsxs(t.Fragment,{children:["Client"," ",t.jsx(_,{variant:"learning",title:"Client Credentials",content:"OAuth 2.0 grant type (RFC 6749 Section 4.4) for machine-to-machine authentication. No user interaction required - perfect for service-to-service API calls.",placement:"top",children:"Credentials"})," ","Configuration"]}),subtitle:t.jsxs(t.Fragment,{children:["Configure your client credentials for"," ",t.jsx(_,{variant:"info",title:"Machine-to-Machine (M2M)",content:"Service-to-service authentication where no user is involved. Typically used for backend services, microservices, and automated systems.",placement:"top",children:"machine-to-machine authentication"})]}),requireClientSecret:!0,showConfigChecker:!1,workerToken:localStorage.getItem("worker-token")||"",region:"NA"})})]});case 1:return t.jsxs(ft,{children:[t.jsxs(xt,{onClick:()=>w("authMethod"),"aria-expanded":!m.authMethod,children:[t.jsxs(wt,{children:[t.jsx(r,{})," Authentication Method"]}),t.jsx(o,{})]}),!m.authMethod&&t.jsxs(bt,{children:[t.jsxs(jt,{$variant:"info",children:[t.jsx(s,{size:20}),t.jsxs("div",{children:[t.jsx(yt,{children:t.jsx(_,{variant:"learning",title:"Client Authentication Methods",content:"How the OAuth client proves its identity to the authorization server. Methods include client_secret_post, client_secret_basic, private_key_jwt, and none.",placement:"top",children:"Client Authentication Methods"})}),t.jsxs(vt,{children:["Choose how your"," ",t.jsx(_,{variant:"info",title:"OAuth Client",content:"Application requesting access to protected resources",placement:"top",children:"client"})," ","will authenticate with the"," ",t.jsx(_,{variant:"learning",title:"Authorization Server",content:"OAuth server that issues tokens after validating client credentials.",placement:"top",children:"authorization server"}),".",t.jsx(_,{variant:"learning",title:"Client Credentials Flow",content:"OAuth 2.0 grant type for M2M authentication - no user involved",placement:"top",children:"Client Credentials flow"})," ","supports multiple"," ",t.jsx(_,{variant:"info",title:"Authentication Methods",content:"Ways to prove client identity: POST body, Basic Auth header, JWT assertion, or none",placement:"top",children:"authentication methods"}),"."]}),t.jsxs("div",{style:{marginTop:"0.5rem",fontSize:"0.875rem",color:"#6b7280"},children:["Current auth method: ",f.credentials.clientAuthMethod||"none"]})]})]}),t.jsxs("div",{style:{display:"flex",gap:"1rem",marginTop:"1rem"},children:[t.jsxs(kt,{variant:"client_secret_post"===f.credentials.clientAuthMethod?"primary":"secondary",onClick:()=>{f.setCredentials({...f.credentials,clientAuthMethod:"client_secret_post"})},children:[t.jsx(d,{})," ",t.jsx(_,{variant:"learning",title:"client_secret_post",content:"Client secret sent in POST body as form parameter. Most common method, simple to implement.",placement:"top",children:"Client Secret POST"})]}),t.jsxs(kt,{variant:"client_secret_basic"===f.credentials.clientAuthMethod?"primary":"secondary",onClick:()=>{f.setCredentials({...f.credentials,clientAuthMethod:"client_secret_basic"})},children:[t.jsx(r,{})," ",t.jsx(_,{variant:"learning",title:"client_secret_basic",content:"Client secret sent in Authorization header using HTTP Basic Authentication (base64 encoded client_id:client_secret).",placement:"top",children:"Client Secret Basic"})]})]})]})]});case 2:return t.jsxs(ft,{children:[t.jsxs(xt,{onClick:()=>w("tokenRequest"),"aria-expanded":!m.tokenRequest,children:[t.jsxs(wt,{children:[t.jsx(c,{})," Token Request"]}),t.jsx(o,{})]}),!m.tokenRequest&&t.jsxs(bt,{children:[t.jsxs(jt,{$variant:"info",children:[t.jsx(s,{size:20}),t.jsxs("div",{children:[t.jsx(yt,{children:t.jsx(_,{variant:"learning",title:"Client Credentials Token Request",content:"OAuth 2.0 token request using client_credentials grant_type. Contains grant_type, scope (optional), and client authentication.",placement:"top",children:"Client Credentials Token Request"})}),t.jsxs(vt,{children:["The"," ",t.jsx(_,{variant:"info",title:"OAuth Client",content:"Application requesting tokens",placement:"top",children:"client"})," ","sends a"," ",t.jsx(_,{variant:"learning",title:"Token Request",content:"POST request to /as/token endpoint with grant_type=client_credentials",placement:"top",children:"token request"})," ","to the"," ",t.jsx(_,{variant:"learning",title:"Authorization Server",content:"Server that validates client and issues tokens",placement:"top",children:"authorization server"})," ","using its"," ",t.jsx(_,{variant:"security",title:"Client Credentials",content:"client_id and client_secret used to authenticate the client",placement:"top",children:"credentials"}),"."]})]})]}),t.jsx(Pt,{children:t.jsxs(kt,{variant:"primary",onClick:f.requestToken,loading:f.isLoading,children:[t.jsx(l,{})," Request"," ",t.jsx(_,{variant:"learning",title:"Access Token",content:"Bearer token used to authenticate API requests. Valid for specified expires_in seconds, sent in Authorization header.",placement:"top",children:"Access Token"})]})}),f.tokenRequest&&t.jsxs(Ct,{children:[t.jsx(It,{children:"Token Request Details"}),t.jsx(St,{children:JSON.stringify(f.tokenRequest,null,2)}),t.jsx(Pt,{children:t.jsx(T,{text:JSON.stringify(f.tokenRequest,null,2),label:"Copy request JSON",variant:"primary"})})]})]})]});case 3:return t.jsxs(ft,{children:[t.jsxs(xt,{onClick:()=>w("tokenResponse"),"aria-expanded":!m.tokenResponse,children:[t.jsxs(wt,{children:[t.jsx(n,{})," Token Response"]}),t.jsx(o,{})]}),!m.tokenResponse&&t.jsx(bt,{children:f.tokens?t.jsxs(t.Fragment,{children:[t.jsxs(jt,{$variant:"success",children:[t.jsx(n,{size:20}),t.jsxs("div",{children:[t.jsxs(yt,{children:[t.jsx(_,{variant:"learning",title:"Access Token",content:"Bearer token for API authentication. Contains permissions (scopes) and lifetime.",placement:"top",children:"Access Token"})," ","Received"]}),t.jsxs(vt,{children:["The"," ",t.jsx(_,{variant:"learning",title:"Authorization Server",content:"OAuth server that validates client and issues tokens",placement:"top",children:"authorization server"})," ","has returned an"," ",t.jsx(_,{variant:"learning",title:"Access Token",content:"Bearer token for API authentication",placement:"top",children:"access token"})," ","for your"," ",t.jsx(_,{variant:"info",title:"OAuth Client",content:"Your application",placement:"top",children:"client"}),"."]})]})]}),Re.showTokens(f.tokens,"oauth","client-credentials-v7",{showCopyButtons:!0,showDecodeButtons:!0})]}):t.jsxs(jt,{$variant:"warning",children:[t.jsx(a,{size:20}),t.jsxs("div",{children:[t.jsx(yt,{children:"No Token Received"}),t.jsx(vt,{children:"Complete the token request in step 2 to receive an access token."})]})]})})]});case 4:return t.jsxs(ft,{children:[t.jsxs(xt,{onClick:()=>w("apiCall"),"aria-expanded":!m.apiCall,children:[t.jsxs(wt,{children:[t.jsx(i,{})," API Call"]}),t.jsx(o,{})]}),!m.apiCall&&t.jsxs(bt,{children:[t.jsxs(jt,{$variant:"info",children:[t.jsx(s,{size:20}),t.jsxs("div",{children:[t.jsxs(yt,{children:["Using the"," ",t.jsx(_,{variant:"learning",title:"Access Token",content:"Bearer token sent in Authorization header to authenticate API requests",placement:"top",children:"Access Token"})]}),t.jsxs(vt,{children:["Use the"," ",t.jsx(_,{variant:"learning",title:"Access Token",content:"Bearer token for API authentication",placement:"top",children:"access token"})," ","to make authenticated requests to"," ",t.jsx(_,{variant:"info",title:"Protected APIs",content:"APIs that require authentication via access token in Authorization header",placement:"top",children:"protected APIs"}),"."]})]})]}),f.tokens?.access_token&&t.jsxs(Ct,{children:[t.jsx(It,{children:"Example API Call"}),t.jsx(St,{children:`curl -H "Authorization: Bearer ${f.tokens.access_token}" \\\n  https://api.example.com/protected-resource`}),t.jsx(Pt,{children:t.jsx(T,{text:`curl -H "Authorization: Bearer ${f.tokens.access_token}" \\\n  https://api.example.com/protected-resource`,label:"Copy cURL command",variant:"primary"})})]})]})]});case 5:return t.jsxs(ft,{children:[t.jsxs(xt,{onClick:()=>w("introspection"),"aria-expanded":!m.introspection,children:[t.jsxs(wt,{children:[t.jsx(r,{})," Token Introspection"]}),t.jsx(o,{})]}),!m.introspection&&t.jsxs(bt,{children:[t.jsxs(jt,{$variant:"info",children:[t.jsx(s,{size:20}),t.jsxs("div",{children:[t.jsx(yt,{children:"Token Validation"}),t.jsxs(vt,{children:[t.jsx(_,{variant:"info",title:"Token Introspection",content:"RFC 7662 - Validating tokens by querying authorization server. Checks if token is active, valid, and returns claims.",placement:"top",children:"Validate the access token"})," ","to ensure it's still valid and check its"," ",t.jsx(_,{variant:"info",title:"Claims",content:"Token properties/attributes like scope, expiration, audience, etc.",placement:"top",children:"claims"}),"."]})]})]}),t.jsx(Pt,{children:t.jsxs(kt,{variant:"primary",onClick:f.introspectToken,loading:f.isLoading,children:[t.jsx(r,{})," Introspect Token"]})}),f.introspectionResult&&t.jsxs(Ct,{children:[t.jsx(It,{children:"Introspection Result"}),t.jsx(St,{children:JSON.stringify(f.introspectionResult,null,2)}),t.jsx(Pt,{children:t.jsx(T,{text:JSON.stringify(f.introspectionResult,null,2),label:"Copy introspection result",variant:"primary"})})]})]})]});case 6:return t.jsxs(t.Fragment,{children:[t.jsxs(jt,{$variant:"success",children:[t.jsx(n,{size:20}),t.jsxs("div",{children:[t.jsxs(yt,{children:[t.jsx(_,{variant:"learning",title:"Client Credentials Flow",content:"OAuth 2.0 grant type for M2M authentication (RFC 6749 Section 4.4)",placement:"top",children:"Client Credentials Flow"})," ","Complete!"]}),t.jsxs(vt,{children:["You have successfully completed the"," ",t.jsx(_,{variant:"info",title:"OAuth 2.0",content:"RFC 6749 - Authorization framework for delegated access",placement:"top",children:"OAuth 2.0"})," ",t.jsx(_,{variant:"learning",title:"Client Credentials Flow",content:"Grant type for machine-to-machine authentication",placement:"top",children:"Client Credentials flow"}),". Your client can now authenticate and access protected resources."]})]})]}),t.jsxs(Ct,{children:[t.jsx(It,{children:"Flow Summary"}),t.jsxs(vt,{children:["✅ Client credentials configured",t.jsx("br",{}),"✅ Authentication method selected",t.jsx("br",{}),"✅ Access token obtained",t.jsx("br",{}),"✅ Token validated",t.jsx("br",{}),"✅ Ready for API calls"]})]})]});default:return t.jsx("div",{children:"Step not implemented"})}},[p,m,f,w]);return t.jsx(ot,{children:t.jsxs(st,{children:[t.jsx(A,{variant:"buttons"}),t.jsx(E,{flowType:"client_credentials",title:"📚 Client Credentials Flow Education",sections:[{id:"client-credentials-overview",title:"Client Credentials Flow Overview",icon:t.jsx(s,{}),summary:"Machine-to-machine authentication without user interaction",content:t.jsxs("div",{children:[t.jsxs("p",{children:[t.jsx("strong",{children:"The Client Credentials Flow"})," is designed for server-to-server authentication:"]}),t.jsxs("ul",{children:[t.jsxs("li",{children:[t.jsx("strong",{children:"No User Context"})," - Application authenticates as itself"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Backend Only"})," - Client secret must be kept secure on server"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Direct Token Request"})," - Single API call to get access token"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Service Accounts"})," - Perfect for microservices and APIs"]})]}),t.jsx("p",{children:"This flow is ideal for automated processes, background jobs, and service-to-service communication."})]})},{id:"security-considerations",title:"Security Considerations",icon:t.jsx(r,{}),summary:"Client secret must be kept secure - never expose in frontend code",content:t.jsxs("div",{children:[t.jsx("p",{children:t.jsx("strong",{children:"Critical Security Requirements:"})}),t.jsxs("ul",{children:[t.jsxs("li",{children:[t.jsx("strong",{children:"Protect Client Secret"})," - Store securely, never commit to version control"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Backend Only"})," - Never use this flow in browser/mobile apps"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Rotate Secrets"})," - Regularly rotate client secrets"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Limit Scope"})," - Request only necessary permissions"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Monitor Usage"})," - Track token usage and detect anomalies"]})]})]})}]}),t.jsxs(it,{children:[t.jsxs(at,{children:[t.jsxs(ct,{children:[t.jsx(lt,{children:"Client Credentials Flow · V7"}),t.jsx(dt,{children:_t[p].title}),t.jsx(ht,{children:_t[p].subtitle})]}),t.jsxs(pt,{children:[t.jsx(ut,{children:String(p+1).padStart(2,"0")}),t.jsx(mt,{children:"of 07"})]})]}),t.jsx(gt,{children:C()}),t.jsx(X,{onNext:b,onPrevious:k,onReset:j,canNavigateNext:S,isFirstStep:0===p,nextButtonText:p===_t.length-1?"Complete":"Next",disabledMessage:f.error||v(p)})]})]})})},At=()=>t.jsx(Tt,{}),Et=Object.freeze(Object.defineProperty({__proto__:null,default:At},Symbol.toStringTag,{value:"Module"})),Rt=P.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: 1.5rem;
	background: white;
	min-height: 100vh;
	padding-top: 100px;
	padding-bottom: 4rem;
`,Ot=P(M)`
	margin-bottom: 2rem;
`,Ft=P.div`
	background-color: #fef3c7;
	border: 1px solid #fcd34d;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1.5rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`,Mt=P.div`
	color: #f59e0b;
	font-size: 1.25rem;
	flex-shrink: 0;
	margin-top: 0.125rem;
`,Ut=P.div`
	flex: 1;

	h4 {
		font-weight: 600;
		color: #92400e;
		margin-bottom: 0.5rem;
	}

	p {
		color: #78350f;
		margin: 0;
		line-height: 1.6;
	}
`,$t=P.div`
	background-color: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`,zt=P.div`
	color: #3b82f6;
	font-size: 1.25rem;
	flex-shrink: 0;
	margin-top: 0.125rem;
`,Dt=P.div`
	flex: 1;

	h4 {
		font-weight: 600;
		color: #1e40af;
		margin-bottom: 0.5rem;
	}

	p {
		color: #1e3a8a;
		margin: 0;
		line-height: 1.6;
	}
`,Lt=P.pre`
	background-color: #f8fafc;
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	padding: 1rem;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	margin: 1rem 0;
	white-space: pre-wrap;
	word-wrap: break-word;
`,Bt=P.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
`,Nt=P.button`
	background: #f3f4f6;
	border: 1px solid #d1d5db;
	border-radius: 0.25rem;
	padding: 0.25rem 0.5rem;
	font-size: 0.75rem;
	cursor: pointer;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	transition: all 0.2s;

	&:hover {
		background: #e5e7eb;
	}
`,Kt=P.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	border: none;
	background: #3b82f6;
	color: white;

	&:hover {
		background: #2563eb;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`,qt=P.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
`,Vt=P.div`
	margin-bottom: 1rem;

	strong {
		color: #111827;
		font-weight: 600;
		display: block;
		margin-bottom: 0.5rem;
	}

	pre {
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		padding: 0.75rem;
		font-size: 0.75rem;
		overflow-x: auto;
		margin: 0.5rem 0;
	}
`,Jt=P.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
`,Wt=P.div`
	margin-bottom: 0.75rem;

	strong {
		color: #166534;
		font-weight: 600;
		display: block;
		margin-bottom: 0.25rem;
	}

	code {
		background: white;
		border: 1px solid #bbf7d0;
		border-radius: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		color: #166534;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}
`,Gt=P.div`
	margin-bottom: 1.5rem;
`,Ht=P.label`
	display: block;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`,Yt=P.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`,Xt=P.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: white;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`,Qt=()=>{const[o,i]=e.useState(null),[a,c]=e.useState(null),[h,x]=e.useState("POST"),[w,b]=e.useState("https://api.example.com/resource"),[k,j]=e.useState(""),[y,v]=e.useState(!1),[S,C]=e.useState(!1);e.useEffect(()=>{ie.isSupported()},[]);const I=(e,t)=>{xe(e),R(`Copied ${t} to clipboard`)},P=e.useCallback(async()=>{v(!0);try{const e=await ae.generateKeyPair({algorithm:"ES256",namedCurve:"P-256"});i(e),c(null),R("DPoP key pair generated successfully")}catch(e){R("Failed to generate key pair","error")}finally{v(!1)}},[]),_=e.useCallback(async()=>{if(o){C(!0);try{const e=await ae.createProof(h,w,k||void 0);c(e),R("DPoP proof created successfully")}catch(e){R("Failed to create DPoP proof","error")}finally{C(!1)}}else R("Please generate a key pair first","error")},[o,h,w,k]);return t.jsxs(Rt,{children:[t.jsx(O,{title:"DPoP (Demonstration of Proof-of-Possession)",subtitle:"RFC 9449 - Educational/Mock Implementation",flowId:"dpop-flow"}),t.jsxs(Ft,{children:[t.jsx(Mt,{children:t.jsx(p,{})}),t.jsxs(Ut,{children:[t.jsx("h4",{children:"Educational/Mock Implementation"}),t.jsx("p",{children:"This is an educational demonstration of DPoP (RFC 9449) concepts. PingOne does not currently support DPoP. This implementation shows how DPoP works, its security benefits, and proper implementation patterns. All DPoP proofs generated here are for educational purposes only and cannot be used with real OAuth servers."})]})]}),t.jsx(Q,{title:"What is DPoP?",theme:"blue",icon:t.jsx(u,{}),defaultExpanded:!0,children:t.jsx(Ot,{children:t.jsxs(F,{children:[t.jsxs("p",{children:[t.jsx("strong",{children:"DPoP (Demonstration of Proof-of-Possession)"})," is an OAuth 2.0 extension (RFC 9449) that provides proof that the client presenting an access token actually possesses the private key associated with that token. This prevents token replay attacks and provides binding between the token and the HTTP request."]}),t.jsx("h3",{children:"Key Benefits:"}),t.jsxs("ul",{children:[t.jsxs("li",{children:["🛡️ ",t.jsx("strong",{children:"Token Binding:"})," Binds access tokens to specific HTTP requests and methods"]}),t.jsxs("li",{children:["🚫 ",t.jsx("strong",{children:"Replay Protection:"})," Each proof includes a unique jti (JWT ID) preventing replay attacks"]}),t.jsxs("li",{children:["🔗 ",t.jsx("strong",{children:"Request Binding:"})," Proof includes HTTP method and URI, ensuring token is used for intended request"]}),t.jsxs("li",{children:["⏱️ ",t.jsx("strong",{children:"Freshness:"})," Includes iat (issued at) timestamp for freshness validation"]}),t.jsxs("li",{children:["🔐 ",t.jsx("strong",{children:"Key Possession:"})," Proves client controls the private key, not just the token"]})]}),t.jsxs($t,{children:[t.jsx(zt,{children:t.jsx(s,{})}),t.jsxs(Dt,{children:[t.jsx("h4",{children:"How DPoP Works"}),t.jsx("p",{children:'DPoP uses JWTs (JSON Web Tokens) with a special type "dpop+jwt" that contain the public key (JWK) in the header and HTTP method/URI in the payload. The proof is signed with the client\'s private key, demonstrating that the client possesses the key and can use it for this specific request.'})]})]})]})})}),t.jsx(Q,{title:"Step 1: Generate DPoP Key Pair",theme:"green",icon:t.jsx(d,{}),defaultExpanded:!0,children:t.jsx(Ot,{children:t.jsxs(F,{children:[t.jsx("p",{children:"The first step is to generate an asymmetric key pair. The client generates a key pair (typically ES256 or RS256) and keeps the private key secret. The public key will be included in DPoP proofs."}),t.jsx(Kt,{onClick:P,disabled:y,children:y?t.jsxs(t.Fragment,{children:[t.jsx(l,{})," Generating..."]}):t.jsxs(t.Fragment,{children:[t.jsx(d,{})," Generate DPoP Key Pair"]})}),o&&t.jsxs(qt,{children:[t.jsxs(Vt,{children:[t.jsx("strong",{children:"Algorithm:"}),t.jsx("code",{children:"ES256 (ECDSA with P-256 curve)"})]}),t.jsxs(Vt,{children:[t.jsx("strong",{children:"Public Key (JWK):"}),t.jsxs(Bt,{children:[t.jsx("span",{children:"Public Key JWK"}),t.jsxs(Nt,{onClick:()=>I(JSON.stringify(o.jwk,null,2),"Public Key JWK"),children:[t.jsx(m,{size:12}),"Copy"]})]}),t.jsx(Lt,{children:JSON.stringify(o.jwk,null,2)})]}),t.jsxs($t,{children:[t.jsx(zt,{children:t.jsx(s,{})}),t.jsx(Dt,{children:t.jsxs("p",{children:[t.jsx("strong",{children:"Note:"})," The private key is kept secret and never shared. Only the public key (JWK) is included in DPoP proofs. The authorization server uses the public key to verify the proof signature."]})})]})]}),t.jsxs(Bt,{children:[t.jsx("span",{children:"Code Example: Generate Key Pair"}),t.jsxs(Nt,{onClick:()=>I("// Generate DPoP key pair\nconst keyPair = await crypto.subtle.generateKey(\n  {\n    name: 'ECDSA',\n    namedCurve: 'P-256'\n  },\n  true, // extractable\n  ['sign', 'verify']\n);\n\n// Export public key as JWK\nconst publicKeyJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey);","Key generation code"),children:[t.jsx(m,{size:12}),"Copy"]})]}),t.jsx(Lt,{children:"// Generate DPoP key pair\nconst keyPair = await crypto.subtle.generateKey(\n  {\n    name: 'ECDSA',\n    namedCurve: 'P-256'\n  },\n  true, // extractable\n  ['sign', 'verify']\n);\n\n// Export public key as JWK\nconst publicKeyJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey);"})]})})}),t.jsx(Q,{title:"Step 2: Create DPoP Proof",theme:"blue",icon:t.jsx(r,{}),defaultExpanded:!0,children:t.jsx(Ot,{children:t.jsxs(F,{children:[t.jsx("p",{children:"Create a DPoP proof JWT for a specific HTTP request. The proof includes the HTTP method, URI, timestamp, and optionally the access token hash."}),t.jsxs(Gt,{children:[t.jsx(Ht,{children:"HTTP Method"}),t.jsxs(Xt,{value:h,onChange:e=>x(e.target.value),children:[t.jsx("option",{value:"GET",children:"GET"}),t.jsx("option",{value:"POST",children:"POST"}),t.jsx("option",{value:"PUT",children:"PUT"}),t.jsx("option",{value:"PATCH",children:"PATCH"}),t.jsx("option",{value:"DELETE",children:"DELETE"})]})]}),t.jsxs(Gt,{children:[t.jsx(Ht,{children:"HTTP URI"}),t.jsx(Yt,{type:"text",value:w,onChange:e=>b(e.target.value),placeholder:"https://api.example.com/resource"})]}),t.jsxs(Gt,{children:[t.jsx(Ht,{children:"Access Token (Optional - for ath claim)"}),t.jsx(Yt,{type:"text",value:k,onChange:e=>j(e.target.value),placeholder:"Enter access token to include ath claim"}),t.jsx("small",{style:{color:"#6b7280",marginTop:"0.25rem",display:"block"},children:'If provided, the access token will be hashed and included in the proof as the "ath" claim'})]}),t.jsx(Kt,{onClick:_,disabled:S||!o,children:S?t.jsxs(t.Fragment,{children:[t.jsx(l,{})," Creating Proof..."]}):t.jsxs(t.Fragment,{children:[t.jsx(r,{})," Create DPoP Proof"]})}),a&&t.jsxs(Jt,{children:[t.jsxs(Wt,{children:[t.jsx("strong",{children:"DPoP Proof JWT:"}),t.jsx("code",{style:{display:"block",marginTop:"0.5rem",wordBreak:"break-all"},children:a.jwt})]}),t.jsxs(Wt,{children:[t.jsx("strong",{children:"JWT ID (jti):"}),t.jsx("code",{children:a.jti})]}),t.jsxs(Wt,{children:[t.jsx("strong",{children:"HTTP Method (htm):"}),t.jsx("code",{children:a.htm})]}),t.jsxs(Wt,{children:[t.jsx("strong",{children:"HTTP URI (htu):"}),t.jsx("code",{children:a.htu})]}),t.jsxs(Wt,{children:[t.jsx("strong",{children:"Issued At (iat):"}),t.jsx("code",{children:new Date(1e3*a.iat).toISOString()})]}),t.jsxs(Bt,{style:{marginTop:"1rem"},children:[t.jsx("span",{children:"Decoded Proof Structure"}),t.jsxs(Nt,{onClick:()=>{const e={header:{typ:"dpop+jwt",alg:"ES256",jwk:o?.jwk},payload:{jti:a.jti,htm:a.htm,htu:a.htu,iat:a.iat,...k&&{ath:"base64url-encoded-sha256-hash"}}};I(JSON.stringify(e,null,2),"Decoded proof")},children:[t.jsx(m,{size:12}),"Copy"]})]}),t.jsx(Lt,{children:JSON.stringify({header:{typ:"dpop+jwt",alg:"ES256",jwk:o?.jwk},payload:{jti:a.jti,htm:a.htm,htu:a.htu,iat:a.iat,...k&&{ath:"base64url-encoded-sha256-hash-of-access-token"}}},null,2)})]})]})})}),t.jsx(Q,{title:"Step 3: Use DPoP Proof in API Request",theme:"highlight",icon:t.jsx(g,{}),defaultExpanded:!0,children:t.jsx(Ot,{children:t.jsxs(F,{children:[t.jsxs("p",{children:["Include the DPoP proof in the ",t.jsx("code",{children:"DPoP"})," header when making API requests with the access token."]}),a&&t.jsxs(Bt,{children:[t.jsx("span",{children:"Example API Request with DPoP"}),t.jsxs(Nt,{onClick:()=>{const e=`${h} ${w}\nAuthorization: Bearer ${k||"your_access_token_here"}\nDPoP: ${a.jwt}`;I(e,"API request")},children:[t.jsx(m,{size:12}),"Copy"]})]}),t.jsx(Lt,{children:a?`${h} ${w}\nAuthorization: Bearer ${k||"your_access_token_here"}\nDPoP: ${a.jwt}`:"POST https://api.example.com/resource\nAuthorization: Bearer your_access_token_here\nDPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiamZrIjp7Imt0eSI6IkVDIiw..."}),t.jsxs(Bt,{children:[t.jsx("span",{children:"JavaScript Fetch Example"}),t.jsxs(Nt,{onClick:()=>{I(`// Make API request with DPoP proof\nconst response = await fetch('${w}', {\n  method: '${h}',\n  headers: {\n    'Authorization': \`Bearer \${accessToken}\`,\n    'DPoP': '${a?.jwt||"dpop_proof_jwt_here"}'\n  },\n  body: JSON.stringify({ /* your request body */ })\n});`,"Fetch example")},children:[t.jsx(m,{size:12}),"Copy"]})]}),t.jsx(Lt,{children:`// Make API request with DPoP proof\nconst response = await fetch('${w}', {\n  method: '${h}',\n  headers: {\n    'Authorization': \`Bearer \${accessToken || 'your_access_token'}\`,\n    'DPoP': '${a?.jwt||"dpop_proof_jwt_here"}'\n  },\n  body: JSON.stringify({ /* your request body */ })\n});`})]})})}),t.jsx(Q,{title:"DPoP Integration with OAuth Flows",theme:"orange",icon:t.jsx(f,{}),defaultExpanded:!1,children:t.jsx(Ot,{children:t.jsxs(F,{children:[t.jsx("p",{children:"DPoP can be integrated with any OAuth 2.0 flow. Here's how it works with different flows:"}),t.jsx("h3",{children:"Authorization Code Flow with DPoP"}),t.jsxs("ol",{children:[t.jsx("li",{children:"Generate DPoP key pair (client-side)"}),t.jsx("li",{children:"Include DPoP public key thumbprint in token request"}),t.jsx("li",{children:"Authorization server binds the access token to the DPoP public key"}),t.jsx("li",{children:"Use DPoP proof in all API requests with the access token"})]}),t.jsxs(Bt,{children:[t.jsx("span",{children:"Token Request with DPoP"}),t.jsxs(Nt,{onClick:()=>{I("POST https://auth.pingone.com/{environmentId}/as/token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code&\ncode=authorization_code_value&\nredirect_uri=https://app.example.com/callback&\nclient_id=your_client_id&\nclient_secret=your_client_secret&\ndpop_jkt=base64url-encoded-thumbprint-of-dpop-public-key","Token request with DPoP")},children:[t.jsx(m,{size:12}),"Copy"]})]}),t.jsx(Lt,{children:"POST https://auth.pingone.com/{environmentId}/as/token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code&\ncode=authorization_code_value&\nredirect_uri=https://app.example.com/callback&\nclient_id=your_client_id&\nclient_secret=your_client_secret&\ndpop_jkt=base64url-encoded-thumbprint-of-dpop-public-key"}),t.jsx("h3",{children:"Client Credentials Flow with DPoP"}),t.jsx("p",{children:"DPoP is particularly useful for Client Credentials flow where the client is also the resource owner, preventing token theft and replay attacks."}),t.jsxs($t,{children:[t.jsx(zt,{children:t.jsx(s,{})}),t.jsxs(Dt,{children:[t.jsx("h4",{children:"PingOne Support"}),t.jsx("p",{children:"PingOne does not currently support DPoP. This page provides educational demonstrations of DPoP concepts and security benefits. For production use, consider mTLS or other token binding mechanisms supported by PingOne."})]})]})]})})}),t.jsx(Q,{title:"Security Benefits Summary",theme:"green",icon:t.jsx(n,{}),defaultExpanded:!1,children:t.jsx(Ot,{children:t.jsxs(F,{children:[t.jsx("h3",{children:"Why Use DPoP?"}),t.jsxs("ul",{children:[t.jsxs("li",{children:[t.jsx("strong",{children:"Prevents Token Replay:"})," Even if an access token is stolen, it cannot be used without the private key"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Request Binding:"})," Each proof is tied to a specific HTTP method and URI, preventing token reuse in different contexts"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Proof of Possession:"})," Demonstrates that the client controls the private key, not just the token"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Freshness:"})," Timestamps in proofs help detect stale or replayed requests"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"No Shared Secrets:"})," Works with public/private key cryptography, eliminating the need for shared secrets"]})]}),t.jsx("h3",{children:"When to Use DPoP"}),t.jsxs("ul",{children:[t.jsx("li",{children:"High-security applications handling sensitive data"}),t.jsx("li",{children:"APIs where token theft is a concern"}),t.jsx("li",{children:"Client Credentials flows where clients are resource owners"}),t.jsx("li",{children:"Applications requiring strong token binding"}),t.jsx("li",{children:"Compliance scenarios requiring proof of possession"})]})]})})})]})};const Zt=new class{DEFAULT_STORAGE_KEY="pingone_worker_token_credentials";DEFAULT_SCOPES=["p1:read:user","p1:update:user","p1:read:device","p1:update:device"];getStorageKey(e){return e&&"flow"!==e&&"worker-token"!==e?`pingone_worker_token_credentials_${e}`:this.DEFAULT_STORAGE_KEY}REGION_URLS={us:"https://auth.pingone.com",eu:"https://auth.pingone.eu",ap:"https://auth.pingone.asia",ca:"https://auth.pingone.ca"};loadCredentials(e){try{const t=this.getStorageKey(e),n=localStorage.getItem(t);if(!n)return null;const r=JSON.parse(n);return{environmentId:r.environmentId,clientId:r.clientId,clientSecret:r.clientSecret,scopes:r.scopes||this.DEFAULT_SCOPES,tokenEndpoint:r.tokenEndpoint,region:r.region||"us"}}catch(t){return null}}saveCredentials(e,t){try{const n=this.getStorageKey(t),r={environmentId:e.environmentId,clientId:e.clientId,clientSecret:e.clientSecret,scopes:e.scopes||this.DEFAULT_SCOPES,region:e.region||"us",tokenEndpoint:this.buildTokenEndpoint(e.environmentId,e.region||"us"),lastUpdated:Date.now()};return localStorage.setItem(n,JSON.stringify(r)),!0}catch(n){return!1}}validateCredentials(e){const t=[],n=[];return e.environmentId?.trim()?this.isValidEnvironmentId(e.environmentId)||t.push("Environment ID must be a valid UUID format"):t.push("Environment ID is required"),e.clientId?.trim()||t.push("Client ID is required"),e.clientSecret?.trim()||t.push("Client Secret is required"),e.environmentId&&e.clientId&&e.environmentId===e.clientId&&t.push("Client ID cannot be the same as Environment ID"),e.scopes&&0!==e.scopes.length||n.push("No scopes specified - using default MFA scopes"),e.clientSecret&&e.clientSecret.length<16&&n.push("Client secret should be at least 16 characters for security"),{isValid:0===t.length,errors:t,warnings:n}}buildTokenEndpoint(e,t="us"){return`${this.REGION_URLS[t]}/${e}/as/token`}getDefaultCredentials(){return{environmentId:"",clientId:"",clientSecret:"",scopes:[...this.DEFAULT_SCOPES],region:"us",tokenEndpointAuthMethod:"client_secret_post"}}clearCredentials(e){try{const t=this.getStorageKey(e);localStorage.removeItem(t)}catch(t){}}hasStoredCredentials(e){return null!==this.loadCredentials(e)}getCredentialMetadata(e){try{const t=this.getStorageKey(e),n=localStorage.getItem(t);if(!n)return{hasCredentials:!1};return{lastUpdated:JSON.parse(n).lastUpdated,hasCredentials:!0}}catch(t){return{hasCredentials:!1}}}isValidEnvironmentId(e){return/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e)}getAvailableRegions(){return[{value:"us",label:"US (North America)",url:this.REGION_URLS.us},{value:"eu",label:"EU (Europe)",url:this.REGION_URLS.eu},{value:"ap",label:"AP (Asia Pacific)",url:this.REGION_URLS.ap},{value:"ca",label:"CA (Canada)",url:this.REGION_URLS.ca}]}getDefaultScopes(){return[...this.DEFAULT_SCOPES]}getAvailableScopes(){return[...this.DEFAULT_SCOPES,"p1:read:group","p1:update:group","p1:read:role","p1:update:role","p1:read:application","p1:update:application"]}},en="#0058A8",tn="#4DA3FF",nn="#0B2142",rn="#F5F7FA",on="#E31837",sn="#00A651",an=P.div`
	min-height: 100vh;
	background: ${rn};
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;P.div`
	background: white;
	border-radius: 12px;
	padding: 2.5rem;
	box-shadow: 0 4px 16px rgba(0,0,0,0.08);
	max-width: 960px;
	margin: 0 auto;
	border: 1px solid ${tn}33;
`,P.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1.5rem;
	margin-bottom: 2rem;

	h2 {
		margin: 0;
		font-size: 2rem;
		color: ${nn};
	}

	p {
		margin: 0.5rem 0 0;
		color: #4b5563;
		max-width: 540px;
		line-height: 1.6;
	}
`,P.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	justify-content: flex-end;
`,P.button`
	background: ${({$variant:e})=>"secondary"===e?"white":en};
	color: ${({$variant:e})=>"secondary"===e?en:"white"};
	border: ${({$variant:e})=>"secondary"===e?`2px solid ${tn}`:"none"};
	border-radius: 999px;
	padding: 0.6rem 1.4rem;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: background 0.2s ease-in-out, color 0.2s ease-in-out, opacity 0.2s ease-in-out;

	&:hover {
		opacity: 0.9;
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`,P.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 1.5rem;
`,P.div`
	background: ${rn};
	border-radius: 10px;
	padding: 1.25rem 1.5rem;
	border: 1px solid rgba(0,0,0,0.05);
	min-height: 110px;
`,P.div`
	font-size: 0.85rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: ${en};
	margin-bottom: 0.5rem;
	font-weight: 700;
`,P.div`
	font-size: 1.05rem;
	color: ${nn};
	word-break: break-word;
	white-space: pre-wrap;
`,P.pre`
	margin: 0;
	font-size: 0.95rem;
	line-height: 1.5;
	background: rgba(0, 88, 168, 0.08);
	padding: 0.75rem;
	border-radius: 8px;
	color: ${nn};
	overflow: auto;
`,P.div`
	background: ${on}1A;
	border: 1px solid ${on}4D;
	color: #9b1c31;
	padding: 1rem 1.25rem;
	border-radius: 10px;
	margin-bottom: 1.5rem;
	font-weight: 600;
`,P.div`
	padding: 1rem 1.25rem;
	border-radius: 10px;
	background: ${tn}1F;
	color: ${en};
	font-weight: 600;
	margin-bottom: 1.5rem;
`;const cn=P.header`
	background: ${en};
	color: white;
	padding: 1rem 2rem;
	box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	position: sticky;
	top: 0;
	z-index: 1000;
`,ln=P.div`
	max-width: 1400px;
	margin: 0 auto;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 2rem;
`,dn=P.div`
	font-size: 2rem;
	font-weight: bold;
	letter-spacing: -0.5px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,hn=P.div`
	flex: 1;
	max-width: 600px;
	position: relative;
	
	input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 3rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		background: white;
		color: ${nn};
		
		&::placeholder {
			color: #999;
		}
	}
	
	svg {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #999;
	}
`;P.button`
	background: rgba(255, 255, 255, 0.12);
	color: white;
	border: none;
	font-size: 0.95rem;
	font-weight: 600;
	padding: 0.6rem 1.4rem;
	border-radius: 999px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: background 0.2s ease-in-out, opacity 0.2s ease-in-out;

	&:hover {
		opacity: 0.85;
	}
`;const pn=P.div`
	display: flex;
	align-items: center;
	gap: 1.5rem;
`,un=P.button`
	background: transparent;
	border: none;
	color: white;
	font-size: 1.5rem;
	cursor: pointer;
	padding: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: opacity 0.2s;
	
	&:hover {
		opacity: 0.8;
	}
	
	span {
		font-size: 0.875rem;
		font-weight: 500;
	}
`,mn=P.main`
	max-width: 1400px;
	margin: 0 auto;
	padding: 2rem;
`,gn=P.div`
	background: linear-gradient(135deg, ${sn} 0%, ${en} 100%);
	color: white;
	padding: 3rem 2rem;
	border-radius: 12px;
	margin-bottom: 2rem;
	text-align: center;
	
	h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		font-weight: 700;
	}
	
	p {
		font-size: 1.25rem;
		opacity: 0.95;
	}
`,fn=P.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`,xn=P.div`
	background: white;
	border-radius: 8px;
	padding: 1.5rem;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	cursor: pointer;
	transition: transform 0.2s, box-shadow 0.2s;
	
	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	}
	
	img {
		width: 100%;
		height: 200px;
		object-fit: cover;
		border-radius: 4px;
		margin-bottom: 1rem;
		background: ${rn};
	}
	
	h3 {
		font-size: 1.125rem;
		margin-bottom: 0.5rem;
		color: ${nn};
	}
	
	.price {
		font-size: 1.5rem;
		font-weight: bold;
		color: ${en};
		margin: 0.5rem 0;
	}
	
	button {
		width: 100%;
		padding: 0.75rem;
		background: ${en};
		color: white;
		border: none;
		border-radius: 4px;
		font-weight: 600;
		cursor: pointer;
		margin-top: 1rem;
		transition: background 0.2s;
		
		&:hover {
			background: #c40024;
		}
	}
`,wn=P.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0,0,0,0.7);
	display: ${e=>e.$isOpen?"flex":"none"};
	align-items: center;
	justify-content: center;
	z-index: 2000;
	padding: 2rem;
`,bn=P.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 500px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`,kn=P.div`
	max-width: 500px;
	margin: 3rem auto 2rem;
	background: white;
	border-radius: 12px;
	padding: 2rem;
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`,jn=P.div`
	max-width: 1400px;
	width: 100%;
	margin: 0 auto 2rem;
	padding: 0 2rem;
`,yn=P.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
	
	h2 {
		font-size: 1.75rem;
		color: ${nn};
		margin: 0;
	}
	
	button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #999;
		
		&:hover {
			color: ${nn};
		}
	}
`,vn=P.div`
	margin-bottom: 1.5rem;
	
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: ${nn};
	}
	
	input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e0e0e0;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
		
		&:focus {
			outline: none;
			border-color: ${en};
		}
	}
`,Sn=P.button`
	width: 100%;
	padding: 1rem;
	background: ${en};
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 1.125rem;
	font-weight: 600;
	cursor: pointer;
	margin-top: 1rem;
	transition: background 0.2s;
	
	&:hover {
		background: #c40024;
	}
	
	&:disabled {
		background: #ccc;
		cursor: not-allowed;
	}
`,Cn=P(bn)`
	max-width: 400px;
`,In=P.div`
	text-align: center;
	
	.icon {
		font-size: 4rem;
		color: ${sn};
		margin-bottom: 1rem;
	}
	
	h3 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		color: ${nn};
	}
	
	p {
		color: #666;
		margin-bottom: 2rem;
		line-height: 1.6;
	}
	
	input {
		width: 100%;
		padding: 1rem;
		border: 2px solid #e0e0e0;
		border-radius: 4px;
		font-size: 1.5rem;
		text-align: center;
		letter-spacing: 0.5rem;
		margin-bottom: 1rem;
		
		&:focus {
			outline: none;
			border-color: ${en};
		}
	}
`,Pn=P.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`,_n=P.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid ${rn};
	
	h2 {
		font-size: 2rem;
		color: ${nn};
		margin: 0;
	}
`,Tn=P.div`
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 2px solid ${rn};
	
	summary {
		cursor: pointer;
		font-weight: 600;
		color: ${nn};
		padding: 1rem;
		background: ${rn};
		border-radius: 4px;
		margin-bottom: 1rem;
		
		&:hover {
			background: #e8e8e8;
		}
	}
`,An="kroger-grocery-store-mfa",En=[{id:1,name:"Fresh Organic Bananas",price:"$2.99",image:"🍌"},{id:2,name:"Kroger Premium Chicken Breast",price:"$8.99",image:"🍗"},{id:3,name:"Kroger Organic Milk",price:"$4.49",image:"🥛"},{id:4,name:"Fresh Strawberries",price:"$3.99",image:"🍓"},{id:5,name:"Kroger Artisan Bread",price:"$3.49",image:"🍞"},{id:6,name:"Organic Eggs (12 count)",price:"$5.99",image:"🥚"}],Rn=()=>{_e({pageName:"Kroger Grocery Store MFA",force:!0});const[n,r]=e.useState(!1),[o,s]=e.useState(!1),[i,a]=e.useState(!1),[c,l]=e.useState(!1),[d,h]=e.useState("curtis7"),[p,u]=e.useState(""),[m,g]=e.useState(""),[f,y]=e.useState(!1),[v,S]=e.useState(!1),[C,I]=e.useState(!1),[P,_]=e.useState({environmentId:"",clientId:"",clientSecret:"",redirectUri:"https://localhost:3000/callback",scopes:"openid profile email consents"}),[T,A]=e.useState(""),[E,R]=e.useState(null),[O,F]=e.useState([]),[M,$]=e.useState(!1),[z,D]=e.useState("profile"),[L,B]=e.useState(null),[N,K]=e.useState(!1),[q,V]=e.useState(null),[J,W]=e.useState(""),[G,H]=e.useState(""),[Y,X]=e.useState(""),[Q,Z]=e.useState(""),[ee,te]=e.useState(null),[ne,re]=e.useState(!1),[oe,se]=e.useState("login"),[ie,ae]=e.useState(""),[le,de]=e.useState([]),he=e.useRef(null),pe=e.useRef(null);e.useEffect(()=>{if(!n)return;const e=window.setTimeout(()=>{r(!1)},1200);return()=>window.clearTimeout(e)},[n]),e.useEffect(()=>Ue.subscribe(e=>{de(e)}),[]),e.useEffect(()=>{(()=>{const e="kroger-grocery-store-mfa",t=Fe(`pingone_worker_token_${e}`,`pingone_worker_token_expires_at_${e}`,{clearExpired:!0,showToast:!1});if(t.isValid&&t.token)return void ae(t.token);const n=Zt.loadCredentials(e);n&&n.environmentId&&n.clientId&&n.clientSecret||y(!0)})()},[]),e.useEffect(()=>{(()=>{const e=Ae.loadFlowCredentialsIsolated(An),t=Ae.loadFlowDataComprehensive({flowKey:An,useSharedEnvironment:!0,useSharedDiscovery:!0});if(e?.environmentId&&e.clientId&&e.clientSecret){const n={environmentId:t.sharedEnvironment?.environmentId||e.environmentId||"",clientId:e.clientId||"",clientSecret:e.clientSecret||"",redirectUri:e.redirectUri||"https://localhost:3000/callback",scopes:Array.isArray(e.scopes)?e.scopes.join(" "):e.scopes||"openid profile email consents"};_(n)}else if(t.flowCredentials&&Object.keys(t.flowCredentials).length>0){const e={environmentId:t.sharedEnvironment?.environmentId||t.flowCredentials.environmentId||"",clientId:t.flowCredentials.clientId||"",clientSecret:t.flowCredentials.clientSecret||"",redirectUri:t.flowCredentials.redirectUri||"https://localhost:3000/callback",scopes:Array.isArray(t.flowCredentials.scopes)?t.flowCredentials.scopes.join(" "):t.flowCredentials.scopes||"openid profile email consents"};_(e),e.environmentId&&e.clientId&&e.clientSecret||setTimeout(()=>I(!0),100)}else if(t.sharedEnvironment?.environmentId){const n=t.sharedEnvironment.environmentId;_(e=>({...e,environmentId:n})),e&&e.clientId&&e.clientSecret||setTimeout(()=>I(!0),100)}else setTimeout(()=>I(!0),100)})()},[]);const ue=e.useCallback(e=>{_(e);const t=Array.isArray(e.scopes)?e.scopes:"string"==typeof e.scopes?e.scopes.split(/\s+/).filter(Boolean):[],n={...e,scopes:t,lastUpdated:Date.now()};Ae.saveFlowCredentialsIsolated(An,n,{showToast:!1})},[]),me=e.useCallback(e=>{if(e.issuerUrl){const t=e.issuerUrl.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);if(t?.[1]){const e=t[1];_(t=>{const n={...t,environmentId:e},r=Array.isArray(n.scopes)?n.scopes:"string"==typeof n.scopes?n.scopes.split(/\s+/).filter(Boolean):[],o={...n,scopes:r,lastUpdated:Date.now()};return Ae.saveFlowCredentialsIsolated(An,o,{showToast:!1}),n})}}},[]);e.useCallback(()=>{l(!1),te(null),Z(""),X(""),H(""),g(""),u(""),D("profile"),B(null),V(null),K(!1)},[]),e.useCallback(()=>{pe.current?.scrollIntoView({behavior:"smooth",block:"start"})},[]);const ge=e.useCallback(async()=>{if(P.environmentId&&ee?.access_token){K(!0),V(null);try{const e=new URLSearchParams({access_token:ee.access_token,environment_id:P.environmentId}),t=await we(`/api/userinfo?${e.toString()}`,{method:"GET",headers:{Accept:"application/json"}}),n=await t.json();if(!t.ok){throw new Error(n?.error_description||n?.error||"Failed to load profile details")}B(n)}catch(e){V(e instanceof Error?e.message:"Failed to fetch user profile"),B(null)}finally{K(!1)}}else V("Missing environment ID or access token to fetch profile details.")},[P.environmentId,ee?.access_token]);e.useEffect(()=>{const e=()=>{const e=Fe("pingone_worker_token_kroger-grocery-store-mfa","pingone_worker_token_expires_at_kroger-grocery-store-mfa",{clearExpired:!0,showToast:!1});e.isValid&&e.token&&ae(e.token)};e();const t=()=>{e()};return window.addEventListener("workerTokenUpdated",t),()=>{window.removeEventListener("workerTokenUpdated",t)}},[]);const xe=e.useCallback(async()=>{if(P.environmentId&&J&&ie)try{const e=await we(`/api/pingone/user/${J}/mfa?environmentId=${P.environmentId}&accessToken=${encodeURIComponent(ie)}`,{method:"GET",headers:{"Content-Type":"application/json"}}),t=await e.json();if(e.ok&&t.devices){const e=t.devices.filter(e=>"SMS"===e.type||"MOBILE"===e.type);F(e),e.length>0&&(R(e[0].id),H(e[0].id))}}catch(e){}},[P.environmentId,J,ie]),be=e.useCallback(async()=>{if(d&&p)if(P.environmentId&&P.clientId&&P.clientSecret){re(!0);try{const e=await we("/api/pingone/redirectless/authorize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:P.environmentId,clientId:P.clientId,clientSecret:P.clientSecret,redirectUri:P.redirectUri||"https://localhost:3000/callback",scopes:P.scopes||"openid profile email consents",responseType:"code",responseMode:"pi.flow"})}),t=await e.json();if(!e.ok||!t.flowId)throw new Error(t.error_description||t.error||"Failed to initiate login");const n=t.flowId;X(n);if(!(await we(`/api/pingone/flows/${n}`,{method:"GET",headers:{"Content-Type":"application/json"}})).ok)throw new Error("Failed to get flow");const r=await we("/api/pingone/flows/check-username-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({flowUrl:`https://auth.pingone.com/${P.environmentId}/flows/${n}`,username:d,password:p})}),o=await r.json();if(!r.ok)throw new Error(o.error_description||o.error||"Invalid credentials");s(!0),se("mfa"),fe.showInfo("Please check your phone for the verification code"),re(!1)}catch(e){fe.showError(e instanceof Error?e.message:"Login failed"),re(!1)}}else fe.showError('Please configure application credentials first. Click "Configure Application Credentials" below the login form.');else fe.showError("Please enter username and password")},[P,d,p]);e.useEffect(()=>{he.current=be},[be]),e.useEffect(()=>{c&&P.environmentId&&ee?.access_token&&ge()},[c,P.environmentId,ee,ge]);const ke=e.useCallback(async e=>{if(!P.environmentId||!J||!ie)return fe.showError("Missing required parameters for device enablement"),!1;try{const t=await we(`/api/pingone/environments/${P.environmentId}/users/${J}/devices/${e}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${ie}`},body:JSON.stringify({enabled:!0})}),n=await t.json();if(t.ok)return fe.showSuccess("MFA device enabled successfully"),!0;throw new Error(n.error_description||n.error||"Failed to enable MFA device")}catch(t){return fe.showError(t instanceof Error?t.message:"Failed to enable MFA device"),!1}},[P.environmentId,J,ie]);e.useCallback(async()=>{if(P.environmentId&&J&&T&&ie){re(!0);try{const e=await we(`/api/pingone/environments/${P.environmentId}/users/${J}/devices`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${ie}`},body:JSON.stringify({type:"SMS",phone:T,nickname:"Mobile Phone"})}),t=await e.json();if(!e.ok||!t.id)throw new Error(t.error_description||t.error||"Failed to register device");H(t.id);await ke(t.id)&&setTimeout(()=>{he.current&&he.current()},500)}catch(e){fe.showError(e instanceof Error?e.message:"Failed to register device"),re(!1)}}else fe.showError("Please provide all required information")},[P.environmentId,J,T,ie,ke]);const je=e.useCallback(async()=>{if(Y&&m&&P.environmentId){re(!0);try{const e=await we(`/api/pingone/flows/${Y}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"mfa.check",code:m})}),t=await e.json();if(!e.ok)throw new Error(t.error_description||t.error||"Invalid verification code");const n=await we(`/api/pingone/resume?flowId=${Y}&environment_id=${P.environmentId}`,{method:"GET",headers:{"Content-Type":"application/json"}}),r=await n.json();if(!n.ok||!r.code)throw new Error(r.error_description||r.error||"Failed to get authorization code");Z(r.code);const o=await we("/api/token-exchange",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grant_type:"authorization_code",environment_id:P.environmentId,client_id:P.clientId,client_secret:P.clientSecret,code:r.code,redirect_uri:P.redirectUri||"https://localhost:3000/callback"})}),i=await o.json();if(!o.ok)throw new Error(i.error_description||i.error||"Failed to get tokens");te(i),l(!0),s(!1),se("success"),fe.showSuccess("Login successful! Welcome to Kroger."),re(!1)}catch(e){fe.showError(e instanceof Error?e.message:"Verification failed"),re(!1)}}else fe.showError("Please enter the verification code")},[Y,m,P]),ye=async()=>{if(d&&p){if(W(d),ie){if(await xe(),0===O.length&&!G)return a(!0),void r(!1);O.length>0&&!G&&(H(O[0].id),R(O[0].id))}r(!1),await be()}else fe.showError("Please enter username and password")},ve=async()=>{m&&6===m.length?await je():fe.showError("Please enter a valid 6-digit code")};return c?t.jsx(an,{children:t.jsx(mn,{style:{paddingTop:"2rem"},children:t.jsxs(Pn,{children:[t.jsxs(_n,{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2rem",paddingBottom:"1rem",borderBottom:`2px solid ${rn}`},children:[t.jsxs("div",{children:[t.jsxs("h2",{style:{fontSize:"2rem",color:nn,margin:0},children:["Welcome back, ",d,"!"]}),t.jsx("p",{style:{fontSize:"1.125rem",color:"#666",marginTop:"0.5rem",marginBottom:0},children:"You've successfully logged in with MFA! This is your Kroger portal dashboard."})]}),t.jsx("button",{onClick:()=>{l(!1),te(null),Z(""),X(""),H(""),g(""),u("")},style:{padding:"0.75rem 1.5rem",background:en,color:"white",border:"none",borderRadius:"4px",fontSize:"1rem",fontWeight:600,cursor:"pointer",transition:"background 0.2s"},children:"Sign Out"})]}),t.jsx(fn,{children:En.map(e=>t.jsxs(xn,{children:[t.jsx("div",{style:{fontSize:"4rem",textAlign:"center",marginBottom:"1rem"},children:e.image}),t.jsx("h3",{children:e.name}),t.jsx("div",{className:"price",children:e.price}),t.jsx("button",{children:"Add to Cart"})]},e.id))}),t.jsx(Tn,{children:t.jsxs("details",{children:[t.jsx("summary",{onClick:()=>$(!M),children:"Configuration (Click to expand)"}),t.jsx("div",{style:{marginTop:"1rem"},children:t.jsx(Te,{flowType:"kroger-grocery-store-mfa",credentials:P,onCredentialsChange:ue,onDiscoveryComplete:me,onEnvironmentIdChange:e=>{_(t=>({...t,environmentId:e}))}})})]})}),t.jsx(U,{apiCalls:le,onClear:()=>Ue.clearApiCalls()})]})})}):t.jsxs(an,{children:[t.jsx(cn,{children:t.jsxs(ln,{children:[t.jsxs(dn,{children:[t.jsx(x,{}),"Kroger Marketplace"]}),t.jsxs(hn,{children:[t.jsx(w,{}),t.jsx("input",{type:"text",placeholder:"Search fresh groceries, bakery, and more","aria-label":"Search products"})]}),t.jsxs(pn,{children:[t.jsxs(un,{type:"button",children:[t.jsx(b,{}),t.jsx("span",{children:"Favorites"})]}),t.jsxs(un,{type:"button",children:[t.jsx(k,{}),t.jsx("span",{children:"Account"})]})]})]})}),t.jsxs(mn,{style:{paddingTop:"2rem"},children:[t.jsxs(gn,{children:[t.jsx("h1",{children:"Shop Kroger with Secure MFA"}),t.jsx("p",{children:"Experience the enhanced PingOne MFA journey while browsing exclusive Kroger deals."})]}),t.jsxs(kn,{onClick:e=>e.stopPropagation(),children:[t.jsx(yn,{children:t.jsx("h2",{children:"Sign In to Kroger"})}),t.jsxs(vn,{children:[t.jsx("label",{children:"Username"}),t.jsx("input",{type:"text",value:d,onChange:e=>h(e.target.value),placeholder:"Enter your username"})]}),t.jsxs(vn,{children:[t.jsx("label",{children:"Password"}),t.jsx("input",{type:"password",value:p,onChange:e=>u(e.target.value),placeholder:"Enter your password",onKeyDown:e=>{"Enter"===e.key&&!ne&&d&&p&&ye()}})]}),t.jsx(Sn,{onClick:ye,disabled:ne||!d||!p,children:ne?"Signing In...":"Sign In"}),t.jsxs("div",{style:{marginTop:"1rem",fontSize:"0.875rem",color:"#666",textAlign:"center"},children:[t.jsxs("p",{style:{margin:"0.5rem 0",color:"#999"},children:["Don't have an account?"," ",t.jsx("a",{href:"#",style:{color:en,textDecoration:"none"},children:"Sign up"})]}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem",alignItems:"center"},children:[t.jsx("button",{onClick:()=>{S(!0)},style:{background:"none",border:"none",color:en,cursor:"pointer",textDecoration:"underline",fontSize:"0.875rem",marginTop:"0.5rem"},children:"Configure Authorization Code Credentials"}),t.jsx("button",{onClick:()=>{const e="kroger-grocery-store-mfa",t=Fe(`pingone_worker_token_${e}`,`pingone_worker_token_expires_at_${e}`,{clearExpired:!0,showToast:!1});if(t.isValid&&t.token)return fe.showSuccess(`Worker token is valid and expires in ${t.expirationInfo?.minutesRemaining||0} minutes`),void ae(t.token);y(!0)},style:{background:"none",border:"none",color:en,cursor:"pointer",textDecoration:"underline",fontSize:"0.875rem"},children:"Configure Worker Token Credentials"})]})]})]}),t.jsx(jn,{children:t.jsx(U,{apiCalls:le,onClear:()=>Ue.clearApiCalls()})})]}),t.jsx(wn,{$isOpen:o,onClick:()=>{},children:t.jsx(Cn,{onClick:e=>e.stopPropagation(),children:t.jsxs(In,{children:[t.jsx("div",{className:"icon",children:t.jsx(j,{})}),t.jsx("h3",{children:"Verify Your Identity"}),t.jsx("p",{children:"We've sent a verification code to your registered device. Please enter the 6-digit code to continue."}),t.jsx("input",{type:"text",maxLength:6,value:m,onChange:e=>g(e.target.value.replace(/\D/g,"")),placeholder:"000000",disabled:ne,onKeyDown:e=>{"Enter"!==e.key||ne||6!==m.length||ve()}}),t.jsx(Sn,{onClick:ve,disabled:ne||6!==m.length,children:ne?"Verifying...":"Verify & Continue"}),ne&&t.jsx("p",{style:{marginTop:"1rem",fontSize:"0.875rem",color:"#666"},children:"Please wait while we verify your code..."})]})})}),t.jsx(wn,{$isOpen:C,onClick:()=>{},children:t.jsxs(bn,{onClick:e=>e.stopPropagation(),style:{maxWidth:"600px"},children:[t.jsxs(yn,{children:[t.jsx("h2",{children:"Configuration Required"}),t.jsx("button",{onClick:()=>I(!1),style:{background:"none",border:"none",fontSize:"1.5rem",cursor:"pointer",color:"#666",padding:"0.25rem",display:"flex",alignItems:"center"},children:"×"})]}),t.jsxs("div",{style:{marginBottom:"1.5rem"},children:[t.jsx("p",{style:{color:"#4b5563",lineHeight:"1.6",marginBottom:"1rem"},children:"The Kroger Grocery Store MFA flow requires authorization code credentials to be configured. Please configure your PingOne authorization code client credentials to continue."}),t.jsx("p",{style:{color:"#6b7280",fontSize:"0.875rem",lineHeight:"1.5"},children:"You'll need:"}),t.jsxs("ul",{style:{color:"#6b7280",fontSize:"0.875rem",lineHeight:"1.8",marginLeft:"1.5rem",marginTop:"0.5rem"},children:[t.jsx("li",{children:"Environment ID"}),t.jsx("li",{children:"Client ID"}),t.jsx("li",{children:"Client Secret"}),t.jsx("li",{children:"Redirect URI (optional)"}),t.jsx("li",{children:"Scopes (optional)"})]})]}),t.jsxs("div",{style:{display:"flex",gap:"1rem",justifyContent:"flex-end"},children:[t.jsx("button",{onClick:()=>I(!1),style:{padding:"0.75rem 1.5rem",background:"transparent",color:en,border:`2px solid ${en}`,borderRadius:"8px",fontSize:"1rem",fontWeight:600,cursor:"pointer",transition:"background 0.2s, color 0.2s"},onMouseEnter:e=>{e.currentTarget.style.background=en,e.currentTarget.style.color="white"},onMouseLeave:e=>{e.currentTarget.style.background="transparent",e.currentTarget.style.color=en},children:"Cancel"}),t.jsx("button",{onClick:()=>{I(!1),S(!0)},style:{padding:"0.75rem 1.5rem",background:en,color:"white",border:"none",borderRadius:"8px",fontSize:"1rem",fontWeight:600,cursor:"pointer",transition:"opacity 0.2s"},onMouseEnter:e=>{e.currentTarget.style.opacity="0.9"},onMouseLeave:e=>{e.currentTarget.style.opacity="1"},children:"Configure Authorization Code Client"})]})]})}),t.jsx(ce,{isOpen:v,onClose:()=>{S(!1);const e=Ae.loadFlowCredentialsIsolated("kroger-grocery-store-mfa");e?.environmentId&&e.clientId&&e.clientSecret&&(_({environmentId:e.environmentId||"",clientId:e.clientId||"",clientSecret:e.clientSecret||"",redirectUri:e.redirectUri||"https://localhost:3000/callback",scopes:Array.isArray(e.scopes)?e.scopes.join(" "):e.scopes||"openid profile email consents"}),I(!1))},flowType:"kroger-grocery-store-mfa",initialCredentials:P,onCredentialsSaved:e=>{_(e),e.environmentId&&e.clientId&&e.clientSecret&&I(!1)}}),t.jsx(Me,{isOpen:f,onClose:()=>{y(!1),setTimeout(()=>{const e=Ae.loadFlowCredentialsIsolated(An);e&&e.environmentId&&e.clientId&&e.clientSecret||I(!0)},200)},onContinue:()=>{y(!1);const e="kroger-grocery-store-mfa",t=Zt.loadCredentials(e);if(t?.environmentId&&t.clientId&&t.clientSecret){const t=Fe(`pingone_worker_token_${e}`,`pingone_worker_token_expires_at_${e}`,{clearExpired:!0,showToast:!1});t.isValid&&t.token&&ae(t.token)}},flowType:"kroger-grocery-store-mfa",environmentId:P.environmentId||"",prefillCredentials:(()=>{const e=Zt.loadCredentials("kroger-grocery-store-mfa");if(e){let t="";if(e.scopes){const n=(Array.isArray(e.scopes)?e.scopes.join(" "):e.scopes).split(/\s+/).filter(Boolean);t=n.length>0?n[0]:""}return{environmentId:e.environmentId||"",clientId:e.clientId||"",clientSecret:e.clientSecret||"",region:e.region||"us",scopes:t,authMethod:e.tokenEndpointAuthMethod||"client_secret_post"}}return{environmentId:"",clientId:"",clientSecret:"",region:"us",scopes:"",authMethod:"client_secret_post"}})()})]})},On=P.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`,Fn=P.h1`
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`,Mn=P.p`
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`,Un=P.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`,$n=P.div`
  margin-bottom: 1rem;
`,zn=P.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
`,Dn=P.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Ln=P.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Bn=P.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({$variant:e})=>{switch(e){case"primary":return"\n          background-color: #3b82f6;\n          color: white;\n          &:hover { background-color: #2563eb; }\n        ";case"secondary":return"\n          background-color: #6b7280;\n          color: white;\n          &:hover { background-color: #4b5563; }\n        ";case"success":return"\n          background-color: #10b981;\n          color: white;\n          &:hover { background-color: #059669; }\n        ";case"danger":return"\n          background-color: #ef4444;\n          color: white;\n          &:hover { background-color: #dc2626; }\n        "}}}
`,Nn=P.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
`,Kn=P.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
`,qn=P.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #991b1b;
`,Vn=P.div`
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #92400e;
`,Jn=P.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`,Wn=P.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`,Gn=P.p`
  margin: 0 0 1rem 0;
  color: #6b7280;
  font-size: 0.875rem;
`,Hn=P.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f9fafb;
  }
`,Yn=P.input`
  margin-right: 0.75rem;
`,Xn=P.label`
  flex: 1;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
`,Qn=({credentials:n})=>{const[r,o]=e.useState(0),[s,i]=e.useState("idle"),[a,c]=e.useState({clientId:n?.clientId||"",clientSecret:n?.clientSecret||"",redirectUri:n?.redirectUri||"https://localhost:3000/callback",environmentId:n?.environmentId||"",scope:"openid profile email",acrValues:"urn:mace:pingidentity.com:loc:1",prompt:"consent",maxAge:"3600",uiLocales:"en",claims:'{"userinfo": {"email": null, "phone_number": null}}',mfaRequired:!0,selectedMFA:"sms"}),[l,d]=e.useState(null),[h,p]=e.useState(null),[u,m]=e.useState("select"),[g,f]=e.useState(""),x=[{id:"sms",label:"SMS Verification",description:"Receive a code via SMS"},{id:"email",label:"Email Verification",description:"Receive a code via email"},{id:"totp",label:"TOTP Authenticator",description:"Use your authenticator app"},{id:"push",label:"Push Notification",description:"Approve via mobile app"},{id:"voice",label:"Voice Call",description:"Receive a call with verification code"}],w=[{id:"step-1",title:"Configure MFA Settings",description:"Set up your OAuth client for MFA-enabled authorization flow using PingOne MFA API.",code:`// PingOne MFA API Configuration\nconst mfaConfig = {\n  clientId: '${a.clientId}',\n  clientSecret: '${a.clientSecret}',\n  redirectUri: '${a.redirectUri}',\n  environmentId: '${a.environmentId}',\n  scope: '${a.scope}',\n  acrValues: '${a.acrValues}',\n  prompt: '${a.prompt}',\n  maxAge: ${a.maxAge},\n  uiLocales: '${a.uiLocales}',\n  claims: ${a.claims},\n  mfaRequired: ${a.mfaRequired}\n};\n\n// PingOne MFA API Base URL\nconst mfaApiBaseUrl = \`https://api.pingone.com/v1/environments/\${environmentId}\`;\n\nconsole.log('MFA flow configured with PingOne MFA API:', mfaConfig);`,execute:async()=>{be.info("MFAFlow","Configuring MFA flow settings with PingOne MFA API")}},{id:"step-2",title:"Start MFA Authorization",description:"Initiate the MFA-enabled authorization flow using PingOne MFA API.",code:`// Start MFA Authorization with PingOne MFA API\nconst authUrl = \`https://auth.pingone.com/\${environmentId}/as/authorize\`;\n\nconst authParams = new URLSearchParams({\n  client_id: '${a.clientId}',\n  response_type: 'code',\n  redirect_uri: '${a.redirectUri}',\n  scope: '${a.scope}',\n  acr_values: '${a.acrValues}',\n  prompt: '${a.prompt}',\n  max_age: '${a.maxAge}',\n  ui_locales: '${a.uiLocales}',\n  claims: '${a.claims}',\n  state: generateState(),\n  nonce: generateNonce()\n});\n\nconst fullAuthUrl = \`\${authUrl}?\${authParams.toString()}\`;\n\n// Get access token for PingOne MFA API\nconst tokenResponse = await fetch('https://auth.pingone.com/${a.environmentId}/as/token', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n  body: new URLSearchParams({\n    grant_type: 'client_credentials',\n    client_id: '${a.clientId}',\n    client_secret: '${a.clientSecret}'\n  })\n});\n\nconst { access_token } = await tokenResponse.json();\nconsole.log('MFA Authorization URL:', fullAuthUrl);\nconsole.log('Access token for MFA API:', access_token);`,execute:async()=>{be.info("MFAFlow","Starting MFA authorization with PingOne MFA API"),i("loading");try{const e=await fetch("/api/token-exchange",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grant_type:"client_credentials",client_id:a.clientId,client_secret:a.clientSecret,environment_id:a.environmentId})});if(!e.ok)throw new Error("Failed to get access token for MFA API");const{access_token:t}=await e.json(),n={success:!0,message:"MFA authorization initiated with PingOne MFA API",authUrl:`https://auth.pingone.com/${a.environmentId}/as/authorize`,accessToken:t,requiresMFA:!0,mfaOptions:x.map(e=>e.id)};d(n),i("success"),m("select")}catch(e){const t=e instanceof Error?e.message:"Unknown error";throw p(t),i("error"),e}}},{id:"step-3",title:"Select MFA Method",description:"Choose the preferred multi-factor authentication method using PingOne MFA API.",code:`// PingOne MFA Method Selection\nconst mfaMethods = [\n  { id: 'sms', name: 'SMS Verification' },\n  { id: 'email', name: 'Email Verification' },\n  { id: 'totp', name: 'TOTP Authenticator' },\n  { id: 'push', name: 'Push Notification' },\n  { id: 'voice', name: 'Voice Call' }\n];\n\nconst selectedMethod = '${a.selectedMFA}';\nconsole.log('Selected MFA method:', selectedMethod);\n\n// Get available MFA methods from PingOne MFA API via backend proxy\nconst mfaMethodsResponse = await fetch('/api/pingone/mfa/get-methods', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    environmentId,\n    accessToken: access_token\n  })\n});\n\nconst availableMethods = await mfaMethodsResponse.json();\nconsole.log('Available MFA methods:', availableMethods);\n\n// Select MFA method via backend proxy\nconst mfaSelectionResponse = await fetch('/api/pingone/mfa/select-method', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    environmentId,\n    method: selectedMethod,\n    accessToken: access_token\n  })\n});\n\nconst selectionResult = await mfaSelectionResponse.json();\nconsole.log('MFA method selection result:', selectionResult);`,execute:async()=>{be.info("MFAFlow","Selecting MFA method with PingOne MFA API",{method:a.selectedMFA});try{const e=l?.accessToken;if(!e)throw new Error("Access token not available for MFA API");const t=localStorage.getItem("worker_credentials"),n=t?JSON.parse(t):null,r=n?.region||"us",o=await fetch(`/api/pingone/proxy/v1/environments/${a.environmentId}/mfa/methods`,{method:"GET",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json","x-pingone-region":r}});if(!o.ok)throw new Error("Failed to get available MFA methods");const s=await o.json(),i=await fetch(`/api/pingone/proxy/v1/environments/${a.environmentId}/mfa/methods/${a.selectedMFA}/select`,{method:"POST",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json","x-pingone-region":r},body:JSON.stringify({method:a.selectedMFA,userId:"current-user-id"})});if(!i.ok)throw new Error("Failed to select MFA method");const c=await i.json(),h={success:!0,message:"MFA method selected using PingOne MFA API",selectedMethod:a.selectedMFA,availableMethods:s,selectionResult:c,requiresVerification:!0};d(e=>({...e,mfaSelection:h}))}catch(e){const t=e instanceof Error?e.message:"Unknown error";throw p(t),e}}},{id:"step-4",title:"Verify MFA Code",description:"Enter and verify the MFA code received using PingOne MFA API.",code:`// PingOne MFA Code Verification\nconst mfaCode = '${g}';\nconst selectedMethod = '${a.selectedMFA}';\n\n// Verify MFA code using PingOne MFA API via backend proxy\nconst verificationResponse = await fetch('/api/pingone/mfa/verify-code', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    environmentId,\n    method: selectedMethod,\n    code: mfaCode,\n    accessToken: access_token,\n    userId: 'current-user-id',\n    sessionId: 'current-session-id'\n  })\n});\n\nconst verificationResult = await verificationResponse.json();\n\nif (verificationResponse.ok) {\n  console.log('MFA verification successful:', verificationResult);\n  // Continue with token exchange\n} else {\n  console.error('MFA verification failed:', verificationResult);\n}`,execute:async()=>{be.info("MFAFlow","Verifying MFA code with PingOne MFA API",{method:a.selectedMFA});try{const e=l?.accessToken;if(!e)throw new Error("Access token not available for MFA API");const t=localStorage.getItem("worker_credentials"),n=t?JSON.parse(t):null,r=n?.region||"us",o=await fetch(`/api/pingone/proxy/v1/environments/${a.environmentId}/mfa/methods/${a.selectedMFA}/verify`,{method:"POST",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json","x-pingone-region":r},body:JSON.stringify({method:a.selectedMFA,code:g,userId:"current-user-id",sessionId:"current-session-id"})});if(!o.ok)throw new Error("MFA verification failed");const s=await o.json(),i={success:!0,message:"MFA verification successful using PingOne MFA API",method:a.selectedMFA,verified:!0,verificationResult:s};d(e=>({...e,mfaVerification:i})),m("complete")}catch(e){const t=e instanceof Error?e.message:"Unknown error";throw p(t),e}}},{id:"step-5",title:"Exchange Code for Tokens",description:"Exchange the authorization code for access and ID tokens after MFA verification.",code:`// Exchange authorization code for tokens with MFA verification\nconst tokenUrl = \`https://auth.pingone.com/\${environmentId}/as/token\`;\n\nconst tokenData = new FormData();\ntokenData.append('grant_type', 'authorization_code');\ntokenData.append('code', authorizationCode);\ntokenData.append('redirect_uri', '${a.redirectUri}');\ntokenData.append('client_id', '${a.clientId}');\ntokenData.append('client_secret', '${a.clientSecret}');\n// Include MFA verification context\ntokenData.append('mfa_verified', 'true');\ntokenData.append('mfa_method', '${a.selectedMFA}');\n\nconst tokenResponse = await fetch(tokenUrl, {\n  method: 'POST',\n  body: tokenData\n});\n\nif (tokenResponse.ok) {\n  const tokens = await tokenResponse.json();\n  console.log('Tokens received with MFA verification:', tokens);\n  \n  // Store tokens with MFA context\n  const tokensWithMFA = {\n    ...tokens,\n    mfa_verified: true,\n    mfa_method: '${a.selectedMFA}',\n    mfa_timestamp: new Date().toISOString()\n  };\n  \n  localStorage.setItem('oauth_tokens', JSON.stringify(tokensWithMFA));\n}`,execute:async()=>{be.info("MFAFlow","Exchanging code for tokens with MFA verification");try{const e={access_token:`mock_access_token_${Date.now()}`,id_token:`mock_id_token_${Date.now()}`,token_type:"Bearer",expires_in:3600,scope:a.scope,refresh_token:`mock_refresh_token_${Date.now()}`,mfa_verified:!0,mfa_method:a.selectedMFA,mfa_timestamp:(new Date).toISOString()};if(!pe(e,"mfa","MFA Flow with PingOne MFA API"))throw new Error("Failed to store tokens");d(t=>({...t,tokens:e}))}catch(e){const t=e instanceof Error?e.message:"Unknown error";throw p(t),e}}}],b=e.useCallback(e=>{o(e),i("idle"),d(null),p(null)},[]),k=e.useCallback((e,t)=>{be.info("MFAFlow",`Step ${e+1} completed`,{result:t})},[]);return t.jsxs(On,{children:[t.jsx(Fn,{children:"MFA-Only Authorization Flow with PingOne MFA API"}),t.jsx(Mn,{children:"This flow demonstrates Multi-Factor Authentication (MFA) specific authorization using the PingOne MFA API. It requires users to complete MFA before receiving tokens, ensuring enhanced security for sensitive operations. The flow integrates with PingOne's MFA API for method selection, verification, and token issuance."}),t.jsxs(Vn,{children:[t.jsx("h4",{children:"🔐 PingOne MFA API Integration"}),t.jsx("p",{children:"This flow uses the PingOne MFA API to enforce MFA completion before token issuance. Users must select and verify their preferred MFA method (SMS, Email, TOTP, Push, or Voice) using PingOne's MFA API before receiving access tokens. The API provides real-time MFA method availability, verification, and secure token exchange."})]}),t.jsx(le,{flowType:"mfa",onCredentialsChange:e=>{c(t=>({...t,clientId:e.clientId||t.clientId,clientSecret:e.clientSecret||t.clientSecret,redirectUri:e.redirectUri||t.redirectUri,environmentId:e.environmentId||t.environmentId}))}}),t.jsx(Z,{steps:w,currentStep:r,onStepChange:b,onStepResult:k,onStart:()=>i("loading"),onReset:()=>{o(0),i("idle"),d(null),p(null),m("select"),f("")},status:s,disabled:"loading"===s,title:"MFA Flow Steps"}),"select"===u&&l&&t.jsxs(Jn,{children:[t.jsx(Wn,{children:"Select MFA Method"}),t.jsx(Gn,{children:"Choose your preferred multi-factor authentication method:"}),x.map(e=>t.jsxs(Hn,{children:[t.jsx(Yn,{type:"radio",id:e.id,name:"mfaMethod",value:e.id,checked:a.selectedMFA===e.id,onChange:e=>c(t=>({...t,selectedMFA:e.target.value}))}),t.jsxs(Xn,{htmlFor:e.id,children:[t.jsx("div",{style:{fontWeight:"500"},children:e.label}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280"},children:e.description})]})]},e.id)),t.jsx(Bn,{$variant:"primary",onClick:()=>{m("verify"),be.info("MFAFlow","MFA verification started",{method:a.selectedMFA})},children:"Start MFA Verification"})]}),"verify"===u&&t.jsxs(Jn,{children:[t.jsx(Wn,{children:"Verify MFA Code"}),t.jsxs(Gn,{children:["Enter the verification code sent to your"," ",x.find(e=>e.id===a.selectedMFA)?.label.toLowerCase(),":"]}),t.jsxs($n,{children:[t.jsx(zn,{children:"Verification Code"}),t.jsx(Dn,{type:"text",value:g,onChange:e=>f(e.target.value),placeholder:"Enter verification code",maxLength:6})]}),t.jsxs("div",{children:[t.jsx(Bn,{$variant:"primary",onClick:()=>{g.trim()?(m("complete"),be.info("MFAFlow","MFA code submitted",{method:a.selectedMFA})):p("Please enter the MFA code")},children:"Verify Code"}),t.jsx(Bn,{$variant:"secondary",onClick:()=>m("select"),children:"Back to Method Selection"})]})]}),"complete"===u&&t.jsxs(Jn,{children:[t.jsx(Wn,{children:"MFA Verification Complete"}),t.jsx(Gn,{children:"Your MFA verification was successful. You can now proceed with the authorization flow."}),t.jsx(Bn,{$variant:"success",onClick:()=>{m("select"),f(""),d(null),p(null)},children:"Continue to Token Exchange"})]}),l&&t.jsxs(Kn,{children:[t.jsx("h4",{children:"Response:"}),t.jsx(Nn,{children:t.jsx($,{data:JSON.parse(JSON.stringify(l))})})]}),h&&t.jsxs(qn,{children:[t.jsx("h4",{children:"Error:"}),t.jsx("p",{children:h})]}),t.jsxs(Un,{children:[t.jsx("h3",{children:"Manual MFA Configuration"}),t.jsx("p",{children:"You can also manually configure the MFA flow:"}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"},children:[t.jsxs($n,{children:[t.jsx(zn,{children:"Client ID"}),t.jsx(Dn,{type:"text",value:a.clientId,onChange:e=>c(t=>({...t,clientId:e.target.value}))})]}),t.jsxs($n,{children:[t.jsx(zn,{children:"Environment ID"}),t.jsx(Dn,{type:"text",value:a.environmentId,onChange:e=>c(t=>({...t,environmentId:e.target.value}))})]}),t.jsxs($n,{children:[t.jsx(zn,{children:"ACR Values"}),t.jsx(Dn,{type:"text",value:a.acrValues,onChange:e=>c(t=>({...t,acrValues:e.target.value}))})]}),t.jsxs($n,{children:[t.jsx(zn,{children:"Prompt"}),t.jsxs(Ln,{value:a.prompt,onChange:e=>c(t=>({...t,prompt:e.target.value})),children:[t.jsx("option",{value:"consent",children:"consent"}),t.jsx("option",{value:"login",children:"login"}),t.jsx("option",{value:"select_account",children:"select_account"})]})]})]})]})]})},Zn=({flowKey:t,enableDebugger:n=!1})=>{const r=he({flowType:"resource-owner-password-v7",persistKey:`resource-owner-password-v7-${t}`,defaultStep:0,enableAutoAdvance:!0}),[o,s]=e.useState({environmentId:"",clientId:"",clientSecret:"",username:"",password:"",scope:"read write",clientAuthMethod:"client_secret_post"}),[i,a]=e.useState(!1),[c,l]=e.useState(!1),[d,h]=e.useState(!1),[p,u]=e.useState(null),[m,g]=e.useState(null),[f,x]=e.useState(!1),[w,b]=e.useState(null),[k,j]=e.useState(!1),[y,v]=e.useState({}),S=e.useCallback((e,t)=>{v(n=>({...n,[e]:t}))},[]),C=e.useCallback(async()=>{a(!0);try{const e={environmentId:o.environmentId,clientId:o.clientId,clientSecret:o.clientSecret,redirectUri:"",scopes:o.scope?o.scope.split(" ").filter(e=>e.trim()):[],tokenEndpoint:`https://auth.pingone.com/${o.environmentId}/as/token`,clientAuthMethod:o.clientAuthMethod||"client_secret_basic"};await ke.saveAuthzFlowCredentials(e),l(!0),sessionStorage.setItem("resource-owner-password-v7-credentials",JSON.stringify(o)),window.dispatchEvent(new CustomEvent("pingone-config-changed")),window.dispatchEvent(new CustomEvent("permanent-credentials-changed")),S("save-credentials",{saved:!0,timestamp:Date.now()}),fe.showSuccess("Configuration saved successfully.")}catch(e){fe.showError("Failed to save configuration",{error:e instanceof Error?e.message:"Unknown error"})}finally{a(!1)}},[o,n,S]),I=e.useCallback(async()=>{if(o.environmentId&&o.clientId&&o.clientSecret&&o.username&&o.password){h(!0);try{const e="http://localhost:3001",t={grant_type:"password",username:o.username,password:o.password,scope:o.scope,client_id:o.clientId,client_secret:o.clientSecret},n=await fetch(`${e}/api/token-exchange`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...t,environmentId:o.environmentId,clientAuthMethod:o.clientAuthMethod,...o.includeX5tParameter&&{includeX5tParameter:o.includeX5tParameter}})});if(!n.ok){const e=await n.json().catch(()=>({}));throw new Error(e.error||`HTTP ${n.status}: ${n.statusText}`)}const s=await n.json();u(s),S("authenticate-user",{success:!0,timestamp:Date.now(),tokenType:s.token_type,expiresIn:s.expires_in,scope:s.scope}),fe.showSuccess("Authentication successful! Access token received."),r.setStep(r.currentStepIndex+1,"authentication completed")}catch(e){fe.showError("Authentication failed",{error:e instanceof Error?e.message:"Unknown error"}),S("authenticate-user",{success:!1,error:e instanceof Error?e.message:"Unknown error",timestamp:Date.now()})}finally{h(!1)}}else fe.showError("All credentials are required for Resource Owner Password flow")},[o,r,n,S]),P=e.useCallback(async()=>{if(p?.access_token){x(!0);try{const e="http://localhost:3001",t=await fetch(`${e}/api/userinfo`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({access_token:p.access_token,environmentId:o.environmentId})});if(!t.ok){const e=await t.json().catch(()=>({}));throw new Error(e.error||`HTTP ${t.status}: ${t.statusText}`)}const n=await t.json();g(n),S("fetch-user-info",{success:!0,timestamp:Date.now(),userSub:n.sub}),fe.showSuccess("User information fetched successfully.")}catch(e){fe.showError("Failed to fetch user information",{error:e instanceof Error?e.message:"Unknown error"}),S("fetch-user-info",{success:!1,error:e instanceof Error?e.message:"Unknown error",timestamp:Date.now()})}finally{x(!1)}}else fe.showError("Access token is required to fetch user information")},[p,o.environmentId,n,S]),_=e.useCallback(async()=>{if(p?.refresh_token){j(!0);try{const e="http://localhost:3001",t={grant_type:"refresh_token",refresh_token:p.refresh_token,client_id:o.clientId,client_secret:o.clientSecret},n=await fetch(`${e}/api/token-exchange`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...t,environmentId:o.environmentId,clientAuthMethod:o.clientAuthMethod,...o.includeX5tParameter&&{includeX5tParameter:o.includeX5tParameter}})});if(!n.ok){const e=await n.json().catch(()=>({}));throw new Error(e.error||`HTTP ${n.status}: ${n.statusText}`)}const r=await n.json();b(r),S("refresh-tokens",{success:!0,timestamp:Date.now(),tokenType:r.token_type,expiresIn:r.expires_in}),fe.showSuccess("Tokens refreshed successfully.")}catch(e){fe.showError("Failed to refresh tokens",{error:e instanceof Error?e.message:"Unknown error"}),S("refresh-tokens",{success:!1,error:e instanceof Error?e.message:"Unknown error",timestamp:Date.now()})}finally{j(!1)}}else fe.showError("Refresh token is required to refresh access token")},[p,o,n,S]),T=e.useCallback(()=>{u(null),g(null),b(null),v({}),r.setStep(0,"flow reset"),fe.showSuccess("Flow reset successfully.")},[r]),A=e.useCallback(e=>Boolean(y[e]),[y]);return e.useEffect(()=>{(async()=>{try{const e=sessionStorage.getItem("resource-owner-password-v7-credentials");if(e){const t=JSON.parse(e);if(t.environmentId&&t.clientId)return s(t),void l(!0)}const t=ke.loadAuthzFlowCredentials();if(t?.environmentId&&t.clientId){const e=t.scopes?Array.isArray(t.scopes)?t.scopes.join(" "):String(t.scopes):"read write";s(n=>({...n,environmentId:t.environmentId,clientId:t.clientId,clientSecret:t.clientSecret||"",scope:e,clientAuthMethod:t.clientAuthMethod||"client_secret_post"})),l(!0)}}catch(e){}})()},[n]),{credentials:o,setCredentials:s,saveCredentials:C,hasCredentialsSaved:c,isSavingCredentials:i,isAuthenticating:d,authenticateUser:I,tokens:p,userInfo:m,isFetchingUserInfo:f,fetchUserInfo:P,refreshTokens:_,refreshedTokens:w,isRefreshingTokens:k,resetFlow:T,stepManager:r,hasStepResult:A,saveStepResult:S}},er=P.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`,tr=P.div`
	background: #fef2f2;
	border: 2px solid #fecaca;
	border-radius: 0.75rem;
	padding: 2rem;
	margin-bottom: 2rem;
	display: flex;
	align-items: flex-start;
	gap: 1rem;
`,nr=P.div`
	background: #f0f9ff;
	border: 2px solid #bae6fd;
	border-radius: 0.75rem;
	padding: 2rem;
	margin-bottom: 2rem;
	display: flex;
	align-items: flex-start;
	gap: 1rem;
`,rr=P.div`
	flex: 1;
`,or=P.p`
	margin: 0 0 1rem 0;
	line-height: 1.6;
`,sr=P.ul`
	margin: 0;
	padding-left: 1.5rem;
	line-height: 1.6;
`,ir=P.li`
	margin-bottom: 0.5rem;
`,ar=P.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 2rem;
	margin: 2rem 0;
`,cr=P.div`
	margin-bottom: 1.5rem;
`,lr=P.label`
	display: block;
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #374151;
`,dr=P.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;P.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	min-height: 100px;
	resize: vertical;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;const hr=P.button`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;
	
	${e=>"primary"===e.variant&&"\n\t\tbackground: #3b82f6;\n\t\tcolor: white;\n\t\t&:hover { background: #2563eb; }\n\t\t&:disabled { background: #9ca3af; cursor: not-allowed; }\n\t"}
	
	${e=>"secondary"===e.variant&&"\n\t\tbackground: #f3f4f6;\n\t\tcolor: #374151;\n\t\t&:hover { background: #e5e7eb; }\n\t\t&:disabled { background: #f9fafb; cursor: not-allowed; }\n\t"}
	
	${e=>"danger"===e.variant&&"\n\t\tbackground: #dc2626;\n\t\tcolor: white;\n\t\t&:hover { background: #b91c1c; }\n\t\t&:disabled { background: #9ca3af; cursor: not-allowed; }\n\t"}
`,pr=P.div`
	position: relative;
`,ur=P.button`
	position: absolute;
	right: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	
	&:hover {
		color: #374151;
	}
`,mr=P.div`
	animation: spin 1s linear infinite;
	
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`,gr=[{title:"Step 0: Configuration",subtitle:"Set up PingOne credentials and user details"},{title:"Step 1: Authentication",subtitle:"Exchange username/password for access token"},{title:"Step 2: User Information",subtitle:"Fetch user details using access token"},{title:"Step 3: Token Refresh",subtitle:"Refresh access token using refresh token"}],fr=()=>{const r=Zn({flowKey:"oauth2-rop",enableDebugger:!0}),[o,i]=e.useState(!1),[a,c]=e.useState(!1);e.useEffect(()=>{window.scrollTo(0,0)},[]);const h=(e,t)=>{r.setCredentials({...r.credentials,[e]:t})};return t.jsxs(er,{children:[t.jsx(O,{flowId:"oauth-resource-owner-password-v5"}),t.jsx(z,{title:"⚠️ Security Warning",defaultCollapsed:!1,children:t.jsxs(tr,{children:[t.jsx(p,{size:24,color:"#dc2626"}),t.jsxs(rr,{children:[t.jsxs(or,{style:{color:"#991b1b"},children:["The Resource Owner Password Credentials flow is ",t.jsx("strong",{children:"deprecated"})," and should be avoided in most cases due to significant security risks. This flow requires the application to collect and handle user credentials directly."]}),t.jsxs(sr,{style:{color:"#991b1b"},children:[t.jsx(ir,{children:"Applications must handle passwords securely"}),t.jsx(ir,{children:"No delegation of authentication to authorization server"}),t.jsx(ir,{children:"Phishing attacks become easier"}),t.jsx(ir,{children:"Violates principle of least privilege"})]})]})]})}),t.jsx(z,{title:"📋 When to Use (Rare Cases)",children:t.jsxs(nr,{children:[t.jsx(s,{size:24,color:"#0ea5e9"}),t.jsxs(rr,{children:[t.jsx(or,{style:{color:"#0c4a6e"},children:"This flow should only be used in very specific, high-trust scenarios:"}),t.jsxs(sr,{style:{color:"#0c4a6e"},children:[t.jsx(ir,{children:"Legacy system migration where other flows are impossible"}),t.jsx(ir,{children:"Highly trusted first-party applications"}),t.jsx(ir,{children:"Server-to-server communication with shared credentials"}),t.jsx(ir,{children:"Internal enterprise applications with strong security controls"})]})]})]})}),(()=>{switch(r.stepManager.currentStepIndex){case 0:return t.jsxs(ar,{children:[t.jsxs("h3",{style:{marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(d,{}),"PingOne Configuration"]}),t.jsxs("form",{children:[t.jsxs(cr,{children:[t.jsx(lr,{children:"Environment ID"}),t.jsx(dr,{type:"text",value:r.credentials.environmentId,onChange:e=>h("environmentId",e.target.value),placeholder:"Enter your PingOne Environment ID"})]}),t.jsxs(cr,{children:[t.jsx(lr,{children:"Client ID"}),t.jsx(dr,{type:"text",value:r.credentials.clientId,onChange:e=>h("clientId",e.target.value),placeholder:"Enter your PingOne Client ID"})]}),t.jsxs(cr,{children:[t.jsx(lr,{children:"Client Secret"}),t.jsxs(pr,{children:[t.jsx(dr,{type:a?"text":"password",value:r.credentials.clientSecret,onChange:e=>h("clientSecret",e.target.value),placeholder:"Enter your PingOne Client Secret"}),t.jsx(ur,{type:"button",onClick:()=>c(!a),children:a?t.jsx(y,{}):t.jsx(v,{})})]})]}),t.jsxs("h3",{style:{marginBottom:"1.5rem",marginTop:"2rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(k,{}),"User Credentials"]}),t.jsxs(cr,{children:[t.jsx(lr,{children:"Username"}),t.jsx(dr,{type:"text",value:r.credentials.username,onChange:e=>h("username",e.target.value),placeholder:"Enter username (email)"})]}),t.jsxs(cr,{children:[t.jsx(lr,{children:"Password"}),t.jsxs(pr,{children:[t.jsx(dr,{type:o?"text":"password",value:r.credentials.password,onChange:e=>h("password",e.target.value),placeholder:"Enter password",autoComplete:"current-password"}),t.jsx(ur,{type:"button",onClick:()=>i(!o),children:o?t.jsx(y,{}):t.jsx(v,{})})]})]}),t.jsxs(cr,{children:[t.jsx(lr,{children:"Scope"}),t.jsx(dr,{type:"text",value:r.credentials.scope,onChange:e=>h("scope",e.target.value),placeholder:"read write"})]}),t.jsx("div",{style:{display:"flex",gap:"1rem",marginTop:"2rem"},children:t.jsxs(hr,{variant:"primary",onClick:r.saveCredentials,disabled:r.isSavingCredentials,children:[r.isSavingCredentials?t.jsx(mr,{children:t.jsx(l,{})}):t.jsx(n,{}),"Save Configuration"]})})]})]});case 1:return t.jsxs(ar,{children:[t.jsxs("h3",{style:{marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(j,{}),"Resource Owner Password Authentication"]}),t.jsx("p",{style:{marginBottom:"1.5rem",color:"#6b7280"},children:"This step will exchange the username and password for an access token using the Resource Owner Password Credentials grant."}),t.jsxs(hr,{variant:"primary",onClick:r.authenticateUser,disabled:r.isAuthenticating||!r.hasCredentialsSaved,children:[r.isAuthenticating?t.jsx(mr,{children:t.jsx(l,{})}):t.jsx(j,{}),"Authenticate User"]}),r.tokens&&t.jsxs("div",{style:{marginTop:"2rem"},children:[t.jsxs("h4",{style:{marginBottom:"1rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(n,{color:"#059669"}),"Access Token Received"]}),t.jsx(UltimateTokenDisplay,{tokens:r.tokens,flowType:"oauth",flowKey:"oauth-resource-owner-password",displayMode:"detailed",title:"Resource Owner Password Tokens",subtitle:"Access token obtained using username/password credentials",showCopyButtons:!0,showDecodeButtons:!0,showMaskToggle:!0,showTokenManagement:!0,showMetadata:!0}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"1rem",marginTop:"1rem"},children:[t.jsxs("div",{children:[t.jsx("strong",{children:"Token Type:"})," ",r.tokens.token_type]}),t.jsxs("div",{children:[t.jsx("strong",{children:"Expires In:"})," ",r.tokens.expires_in," seconds"]}),t.jsxs("div",{children:[t.jsx("strong",{children:"Scope:"})," ",r.tokens.scope]}),r.tokens.refresh_token&&t.jsxs("div",{children:[t.jsx("strong",{children:"Has Refresh Token:"})," Yes"]})]})]})]});case 2:return t.jsxs(ar,{children:[t.jsxs("h3",{style:{marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(k,{}),"User Information"]}),t.jsx("p",{style:{marginBottom:"1.5rem",color:"#6b7280"},children:"Fetch user information using the access token from the previous step."}),t.jsxs(hr,{variant:"primary",onClick:r.fetchUserInfo,disabled:r.isFetchingUserInfo||!r.tokens,children:[r.isFetchingUserInfo?t.jsx(mr,{children:t.jsx(l,{})}):t.jsx(k,{}),"Fetch User Info"]}),r.userInfo&&t.jsxs("div",{style:{marginTop:"2rem"},children:[t.jsxs("h4",{style:{marginBottom:"1rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(n,{color:"#059669"}),"User Information"]}),t.jsx("div",{style:{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"0.5rem",padding:"1rem",fontFamily:"Monaco, Menlo, monospace",fontSize:"0.875rem",margin:"1rem 0"},children:t.jsx("pre",{style:{margin:0,whiteSpace:"pre-wrap"},children:JSON.stringify(r.userInfo,null,2)})})]})]});case 3:return t.jsxs(ar,{children:[t.jsxs("h3",{style:{marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(l,{}),"Token Refresh"]}),t.jsx("p",{style:{marginBottom:"1.5rem",color:"#6b7280"},children:"Use the refresh token to obtain a new access token without re-authenticating."}),t.jsxs(hr,{variant:"primary",onClick:r.refreshTokens,disabled:r.isRefreshingTokens||!r.tokens?.refresh_token,children:[r.isRefreshingTokens?t.jsx(mr,{children:t.jsx(l,{})}):t.jsx(l,{}),"Refresh Tokens"]}),!r.tokens?.refresh_token&&t.jsx("p",{style:{color:"#dc2626",marginTop:"1rem"},children:"No refresh token available. Complete the authentication step first."}),r.refreshedTokens&&t.jsxs(t.Fragment,{children:[r.tokens&&t.jsxs("div",{style:{marginTop:"2rem"},children:[t.jsxs("h4",{style:{marginBottom:"1rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(s,{color:"#3b82f6"}),"Before Refresh"]}),Re.showTokens(r.tokens,"oauth","oauth-resource-owner-password-before",{showCopyButtons:!0,showDecodeButtons:!0})]}),t.jsxs("div",{style:{marginTop:"2rem"},children:[t.jsxs("h4",{style:{marginBottom:"1rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(n,{color:"#059669"}),"After Refresh"]}),t.jsxs(nr,{style:{marginBottom:"1rem",padding:"1rem"},children:[t.jsx(s,{style:{flexShrink:0}}),t.jsxs(or,{style:{margin:0,fontSize:"0.875rem"},children:["Whether a refresh token is opaque or JWT depends on the authorization server's design:",t.jsx("br",{}),"• ",t.jsx("strong",{children:"PingOne"})," → typically opaque (refresh token references state stored server-side)",t.jsx("br",{}),"• ",t.jsx("strong",{children:"PingFederate/PingAM/AIC"})," → can issue JWT refresh tokens (optional setting)",t.jsx("br",{}),"• ",t.jsx("strong",{children:"Custom OIDC servers"})," → often use JWT refresh tokens to avoid DB lookups"]})]}),Re.showTokens(r.refreshedTokens,"oauth","oauth-resource-owner-password-refresh",{showCopyButtons:!0,showDecodeButtons:!0})]})]})]});default:return null}})(),t.jsx(X,{currentStep:r.stepManager.currentStepIndex,totalSteps:gr.length,onPrevious:()=>r.stepManager.setStep(Math.max(0,r.stepManager.currentStepIndex-1),"previous"),onNext:()=>r.stepManager.setStep(Math.min(gr.length-1,r.stepManager.currentStepIndex+1),"next"),onReset:r.resetFlow,canNavigateNext:r.stepManager.currentStepIndex<gr.length-1,isFirstStep:0===r.stepManager.currentStepIndex,nextButtonText:"Next",disabledMessage:"Complete the action above to continue",stepRequirements:["Review the flow overview and setup credentials","Enter username and password, then request access token","Fetch user details using access token","Refresh access token using refresh token"],onCompleteAction:()=>r.stepManager.setStep(Math.min(gr.length-1,r.stepManager.currentStepIndex+1),"complete action"),showCompleteActionButton:!1}),t.jsx(z,{title:"✅ Recommended Alternatives",children:t.jsxs(nr,{children:[t.jsx(k,{size:24,color:"#0ea5e9"}),t.jsxs(rr,{children:[t.jsx(or,{style:{color:"#0c4a6e"},children:"Instead of the Resource Owner Password flow, consider these more secure alternatives:"}),t.jsxs(sr,{style:{color:"#0c4a6e"},children:[t.jsxs(ir,{children:[t.jsx("strong",{children:"Authorization Code Flow:"})," Most secure for web applications"]}),t.jsxs(ir,{children:[t.jsx("strong",{children:"Authorization Code with PKCE:"})," Best for mobile and SPA applications"]}),t.jsxs(ir,{children:[t.jsx("strong",{children:"Device Code Flow:"})," For devices with limited input capabilities"]}),t.jsxs(ir,{children:[t.jsx("strong",{children:"Client Credentials Flow:"})," For server-to-server communication"]})]})]})]})})]})};class xr{static flows=new Map;static createStepMetadata(e){return e.map((e,t)=>({stepNumber:t,title:e.title,subtitle:e.subtitle??"",description:e.description??""}))}static createIntroSectionKeys(e){const t={authorization:["pkceOverview","authRequestOverview","authResponseOverview"],oauth:["tokenExchangeOverview","introspectionOverview"],oidc:["tokenExchangeOverview","introspectionOverview","securityOverview"],default:["securityOverview"]},n=t[e.toLowerCase()]??t.default;return Array.from(new Set(["overview","flowDiagram","credentials","results","flowSummary",...n]))}static initializeFlow(e,t,n={}){const r={flowId:xr.generateFlowId(),userId:e,flowType:t,status:"not_started",steps:[],startedAt:new Date,metadata:{sessionId:xr.generateSessionId()},configuration:{...n},results:{}};return xr.flows.set(r.flowId,r),r}static getFlow(e){return xr.flows.get(e)}static getFlowState(e){return xr.getFlow(e)}static startStep(e,t,n){const r=xr.flows.get(e);if(!r)return;const o=xr.ensureStep(r,t,n);o.status="in_progress",o.startedAt=new Date,"completedAt"in o&&delete o.completedAt,r.currentStepId=t,r.status="in_progress"}static completeStep(e,t,n){const r=xr.flows.get(e);if(!r)return;const o=xr.ensureStep(r,t);o.status="completed",o.completedAt=new Date,n&&(o.data={...o.data??{},...n}),r.currentStepId=t}static failStep(e,t,n){const r=xr.flows.get(e);if(!r)return;const o=xr.ensureStep(r,t);o.status="failed",o.completedAt=new Date,o.error=n,r.status="failed",r.currentStepId=t}static completeFlow(e){const t=xr.flows.get(e);t&&(t.status="completed",t.completedAt=new Date)}static updateFlow(e,t){const n=xr.flows.get(e);if(!n)return;const r={...n,...t,metadata:{...n.metadata,...t.metadata??{}},configuration:{...n.configuration,...t.configuration??{}},results:{...n.results,...t.results??{}}};return xr.flows.set(e,r),r}static ensureStep(e,t,n){let r=e.steps.find(e=>e.stepId===t);return r||(r={stepId:t,stepName:n??xr.formatStepName(t),stepType:xr.inferStepType(t),status:"not_started"},e.steps.push(r)),n&&(r.stepName=n),r}static inferStepType(e){const t=e.toLowerCase();return t.includes("auth")||t.includes("login")?"authentication":t.includes("device")&&t.includes("registration")?"device_registration":t.includes("device")?"device_selection":t.includes("challenge")?"challenge":t.includes("verify")||t.includes("verification")?"verification":t.includes("success")||t.includes("complete")?"completion":"generic"}static formatStepName(e){return e.replace(/_/g," ").replace(/-/g," ").replace(/\s+/g," ").trim().replace(/\b\w/g,e=>e.toUpperCase())}static generateFlowId(){return`flow_${Date.now()}_${Math.random().toString(36).slice(2,11)}`}static generateSessionId(){return`session_${Date.now()}_${Math.random().toString(36).slice(2,11)}`}}const wr=xr.createStepMetadata([{title:"Step 1: Introduction & Setup",subtitle:"Understand the OAuth Authorization Code Flow"},{title:"Step 2: MFA Configuration",subtitle:"Configure MFA policies and user settings"},{title:"Step 3: PKCE Generation",subtitle:"Generate secure code verifier and challenge"},{title:"Step 4: Authorization Request",subtitle:"Build and launch the authorization URL"},{title:"Step 5: Authorization Response",subtitle:"Receive the authorization code from PingOne"},{title:"Step 6: Token Exchange",subtitle:"Exchange authorization code for access token"},{title:"Step 7: Token Introspection",subtitle:"Validate and inspect tokens"},{title:"Step 8: Security Features",subtitle:"Advanced security demonstrations"},{title:"Step 9: Flow Summary",subtitle:"Complete flow overview and next steps"}]);xr.createIntroSectionKeys("authorization-code");const br={clientAuthMethod:"client_secret_post",allowRedirectUriPatterns:!1,pkceEnforcement:"REQUIRED",responseTypeCode:!0,responseTypeToken:!1,responseTypeIdToken:!1,grantTypeAuthorizationCode:!0,initiateLoginUri:"",targetLinkUri:"",signoffUrls:[],requestParameterSignatureRequirement:"DEFAULT",enableJWKS:!1,jwksMethod:"JWKS_URL",jwksUrl:"",jwks:"",requirePushedAuthorizationRequest:!1,pushedAuthorizationRequestTimeout:60,enableDPoP:!1,dpopAlgorithm:"ES256",additionalRefreshTokenReplayProtection:!1,includeX5tParameter:!1,oidcSessionManagement:!1,requestScopesForMultipleResources:!1,terminateUserSessionByIdToken:!1,corsOrigins:[],corsAllowAnyOrigin:!1},kr=P.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`,jr=()=>{_e({pageName:"PingOne Complete MFA Flow V7",force:!0});const{credentials:n}=D(),[r,o]=e.useState(null);e.useEffect(()=>{(async()=>{const e=Ae.loadFlowDataComprehensive({flowKey:"pingone-complete-mfa-v7",useSharedEnvironment:!0,useSharedDiscovery:!0});e.flowCredentials&&Object.keys(e.flowCredentials).length>0?o({environmentId:e.sharedEnvironment?.environmentId||"",clientId:e.flowCredentials.clientId,clientSecret:e.flowCredentials.clientSecret,redirectUri:e.flowCredentials.redirectUri,scopes:e.flowCredentials.scopes}):e.sharedEnvironment?.environmentId?o(t=>({...t,environmentId:e.sharedEnvironment.environmentId})):o(n)})()},[n]);return t.jsx(kr,{children:t.jsx(ee,{credentials:r||n,requireMFA:!0,maxRetries:3,onFlowComplete:e=>{},onFlowError:(e,t)=>{Error},onStepChange:(e,t)=>{},showNetworkStatus:!0})})},yr={buildLogoutUrl:e=>L(e),async logout(e){const t=L(e);if(!t)return{success:!1,error:"Unable to build logout URL. Ensure an environment ID (or issuer) and ID token are provided.",message:"Logout URL generation failed"};if(e.clearClientStorage&&B.clearClientStorage(),!1===e.autoOpen)return{success:!0,url:t,opened:!1,message:"Logout URL generated"};const n=((e,t)=>{if("undefined"==typeof window)return!1;if("same-tab"===t)return window.location.href=e,!0;try{const t=window.open(e,"_blank","noopener,noreferrer");return!(!t||t.closed||void 0===t.closed||(t.focus(),0))}catch(n){return!1}})(t,e.openIn??"new-tab");return{success:!0,url:t,opened:n,message:n?"Logout initiated in a new browser window":"Logout URL generated; please open it manually"}}},vr=P.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`,Sr=P.h1`
	color: #1f2937;
	font-size: 2rem;
	font-weight: 700;
	margin-bottom: 0.5rem;
`,Cr=P.p`
	color: #6b7280;
	font-size: 1.125rem;
	margin-bottom: 2rem;
	line-height: 1.6;
`,Ir=P.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin: 1rem 0;
`,Pr=P.div`
	margin-bottom: 1rem;
`,_r=P.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
	color: #374151;
`,Tr=P.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`,Ar=P.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	min-height: 120px;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`,Er=P.button`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;
	margin-right: 0.5rem;
	margin-bottom: 0.5rem;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;

	${({$variant:e})=>{switch(e){case"primary":return"\n          background-color: #3b82f6;\n          color: white;\n          &:hover { background-color: #2563eb; }\n        ";case"secondary":return"\n          background-color: #6b7280;\n          color: white;\n          &:hover { background-color: #4b5563; }\n        ";case"success":return"\n          background-color: #10b981;\n          color: white;\n          &:hover { background-color: #059669; }\n        ";case"danger":return"\n          background-color: #ef4444;\n          color: white;\n          &:hover { background-color: #dc2626; }\n        "}}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`,Rr=P.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1rem;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	overflow-x: auto;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`,Or=P.div`
	background: #f0fdf4;
	border: 1px solid #86efac;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
`,Fr=P.div`
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #991b1b;
`,Mr=P.div`
	background: #dbeafe;
	border: 1px solid #93c5fd;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #1e40af;
`,Ur=P.div`
	background: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #92400e;
`,$r=P.div`
	background: white;
	border: 2px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin: 1rem 0;
`,zr=P.h4`
	margin: 0 0 1rem 0;
	color: #1f2937;
	font-size: 1.125rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Dr=({credentials:n})=>{const[r,o]=e.useState(0),[a,c]=e.useState("idle"),[l,d]=e.useState({environmentId:n?.environmentId||"",clientId:n?.clientId||"",idToken:"",postLogoutRedirectUri:"https://localhost:3000/logout-callback",state:je()}),[h,p]=e.useState(null),[u,g]=e.useState(null),[f,x]=e.useState(null),w=[{id:"step-1",title:"Configure Logout Settings",description:"Set up your PingOne environment and logout parameters.",code:`// PingOne Logout Configuration\nconst logoutConfig = {\n  environmentId: '${l.environmentId}',\n  clientId: '${l.clientId}',\n  idToken: '${l.idToken?`${l.idToken.substring(0,50)}...`:"YOUR_ID_TOKEN"}',\n  postLogoutRedirectUri: '${l.postLogoutRedirectUri}',\n  state: '${l.state}'\n};\n\nconsole.log('Logout configuration:', logoutConfig);`,execute:async()=>{be.info("PingOneLogoutFlow","Configuring logout settings")}},{id:"step-2",title:"Build Logout URL",description:"Construct the PingOne logout URL with required parameters.",code:"// Build PingOne Logout URL\nimport { buildPingOneLogoutUrl } from '@/utils/pingone-url-builders';\n\nconst logoutUrl = buildPingOneLogoutUrl(environmentId, {\n  idTokenHint: idToken,\n  postLogoutRedirectUri: postLogoutRedirectUri,\n  state: state\n});\n\nconsole.log('Logout URL:', logoutUrl);\n// Example: https://auth.pingone.com/{envId}/as/logout?id_token_hint=...&post_logout_redirect_uri=...&state=...",execute:async()=>{be.info("PingOneLogoutFlow","Building logout URL"),c("loading");try{if(!l.environmentId)throw new Error("Environment ID is required");if(!l.idToken)throw new Error("ID Token is required for logout");const e=ye(l.environmentId,{idTokenHint:l.idToken,postLogoutRedirectUri:l.postLogoutRedirectUri,state:l.state});p(e),g({success:!0,logoutUrl:e,message:"Logout URL generated successfully"}),c("success")}catch(e){const t=e instanceof Error?e.message:"Unknown error";throw x(t),c("error"),e}}},{id:"step-3",title:"Initiate Logout",description:"Redirect user to PingOne logout endpoint to terminate session.",code:"// Initiate Logout\n// Option 1: Redirect in same tab\nwindow.location.href = logoutUrl;\n\n// Option 2: Open in new tab (recommended for better UX)\nwindow.open(logoutUrl, '_blank');\n\n// Option 3: Using pingOneLogoutService\nimport { pingOneLogoutService } from '@/services/pingOneLogoutService';\n\nconst result = await pingOneLogoutService.logout({\n  environmentId: environmentId,\n  idToken: idToken,\n  postLogoutRedirectUri: postLogoutRedirectUri,\n  autoOpen: true,\n  openIn: 'new-tab',\n  clearClientStorage: true\n});\n\nif (result.success) {\n  console.log('Logout initiated:', result.message);\n} else {\n  console.error('Logout failed:', result.error);\n}",execute:async()=>{be.info("PingOneLogoutFlow","Initiating logout"),c("loading");try{if(!h)throw new Error("Logout URL not generated. Please complete step 2 first.");const e=await yr.logout({environmentId:l.environmentId,idToken:l.idToken,postLogoutRedirectUri:l.postLogoutRedirectUri,autoOpen:!0,openIn:"new-tab",clearClientStorage:!1});if(!e.success)throw new Error(e.error||"Logout failed");g({success:!0,message:e.message,url:e.url,opened:e.opened}),c("success")}catch(e){const t=e instanceof Error?e.message:"Unknown error";throw x(t),c("error"),e}}},{id:"step-4",title:"Handle Post-Logout Redirect",description:"Process the redirect after logout and clear local session data.",code:"// Handle Post-Logout Redirect\n// This code runs on your post-logout redirect URI page\n\n// 1. Verify state parameter (CSRF protection)\nconst urlParams = new URLSearchParams(window.location.search);\nconst returnedState = urlParams.get('state');\nconst storedState = sessionStorage.getItem('logout_state');\n\nif (returnedState !== storedState) {\n  console.error('Logout state mismatch - possible CSRF attack');\n  return;\n}\n\n// 2. Clear local session data\nlocalStorage.removeItem('access_token');\nlocalStorage.removeItem('id_token');\nlocalStorage.removeItem('refresh_token');\nlocalStorage.removeItem('user_info');\nsessionStorage.removeItem('logout_state');\n\n// 3. Clear any other application-specific storage\n// ... your cleanup code ...\n\n// 4. Redirect to login or show confirmation\nconsole.log('User logged out successfully');\nwindow.location.href = '/login'; // or show logout confirmation",execute:async()=>{be.info("PingOneLogoutFlow","Processing post-logout redirect"),g(e=>({...e,postLogoutHandled:!0,message:"Post-logout redirect handler ready"}))}},{id:"step-5",title:"Complete Logout Flow",description:"Verify logout completion and session termination.",code:"// Verify Logout Completion\n// After logout, verify that:\n// 1. PingOne session is terminated\n// 2. Local storage is cleared\n// 3. User is redirected appropriately\n\n// Check if user is still authenticated\nconst idToken = localStorage.getItem('id_token');\nif (idToken) {\n  console.warn('ID token still exists - logout may not have completed');\n} else {\n  console.log('✅ Logout successful - all tokens cleared');\n}\n\n// Optional: Verify PingOne session termination\n// Try to access a protected resource to confirm session is ended",execute:async()=>{be.info("PingOneLogoutFlow","Completing logout flow"),g(e=>({...e,completed:!0,message:"Logout flow completed successfully"}))}}],b=e.useCallback(e=>{o(e),c("idle"),g(null),x(null)},[]),k=e.useCallback((e,t)=>{be.info("PingOneLogoutFlow",`Step ${e+1} completed`,t)},[]);return t.jsxs(vr,{children:[t.jsx(Sr,{children:"🚪 PingOne Logout Flow"}),t.jsx(Cr,{children:"This flow demonstrates how to implement logout with PingOne SSO. Learn how to build logout URLs, initiate session termination, and handle post-logout redirects."}),t.jsxs(Mr,{children:[t.jsxs("h4",{style:{marginTop:0,display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(s,{})," About PingOne Logout"]}),t.jsx("p",{children:"PingOne supports RP-initiated logout (Relying Party initiated logout) where your application can terminate the user's PingOne session. The logout flow involves:"}),t.jsxs("ol",{style:{marginLeft:"1.5rem",marginTop:"0.5rem"},children:[t.jsx("li",{children:"Building a logout URL with the ID token and post-logout redirect URI"}),t.jsx("li",{children:"Redirecting the user to PingOne's logout endpoint"}),t.jsx("li",{children:"PingOne terminates the session and redirects back to your app"}),t.jsx("li",{children:"Your app clears local session data and shows logout confirmation"})]})]}),t.jsxs(Ur,{children:[t.jsx("h4",{style:{marginTop:0},children:"⚠️ Important Requirements"}),t.jsxs("ul",{style:{marginLeft:"1.5rem",marginTop:"0.5rem"},children:[t.jsxs("li",{children:[t.jsx("strong",{children:"ID Token Required:"})," You must have an ID token from the authentication session to initiate logout"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Post-Logout Redirect URI:"}),' Must be registered in your PingOne application\'s "Sign Off URLs" configuration']}),t.jsxs("li",{children:[t.jsx("strong",{children:"State Parameter:"})," Recommended for CSRF protection (optional but recommended)"]})]})]}),t.jsx(le,{flowType:"pingone-logout",onCredentialsChange:e=>{d(t=>({...t,clientId:e.clientId||t.clientId,clientSecret:e.clientSecret||t.clientSecret,environmentId:e.environmentId||t.environmentId}))}}),t.jsx(Z,{steps:w,currentStep:r,onStepChange:b,onStepResult:k,onStart:()=>c("loading"),onReset:()=>{o(0),c("idle"),g(null),x(null),p(null),d(e=>({...e,state:je()}))},status:a,disabled:"loading"===a,title:"PingOne Logout Flow Steps"}),h&&t.jsxs($r,{children:[t.jsxs(zr,{children:[t.jsx(S,{})," Generated Logout URL"]}),t.jsx(N,{url:h,label:"Logout URL",showCopyButton:!0,showInfoButton:!1,showOpenButton:!0,height:"150px"}),t.jsxs("div",{style:{marginTop:"1rem",display:"flex",gap:"0.5rem"},children:[t.jsxs(Er,{$variant:"primary",onClick:async()=>{try{if(c("loading"),x(null),!h)throw new Error("Please generate logout URL first");const e=await yr.logout({environmentId:l.environmentId,idToken:l.idToken,postLogoutRedirectUri:l.postLogoutRedirectUri,autoOpen:!0,openIn:"new-tab",clearClientStorage:!1});if(!e.success)throw new Error(e.error||"Logout failed");g({success:!0,message:e.message,url:e.url,opened:e.opened}),c("success")}catch(e){const t=e instanceof Error?e.message:"Unknown error";x(t),c("error")}},children:[t.jsx(i,{})," Initiate Logout"]}),t.jsxs(Er,{$variant:"secondary",onClick:()=>{h&&(navigator.clipboard.writeText(h),be.info("PingOneLogoutFlow","Logout URL copied to clipboard"))},children:[t.jsx(m,{})," Copy URL"]})]})]}),t.jsxs(Ir,{children:[t.jsx("h3",{children:"Manual Logout Configuration"}),t.jsx("p",{children:"You can also manually configure and test the logout flow:"}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"},children:[t.jsxs(Pr,{children:[t.jsx(_r,{children:"Environment ID"}),t.jsx(Tr,{type:"text",value:l.environmentId,onChange:e=>d(t=>({...t,environmentId:e.target.value})),placeholder:"12345678-1234-1234-1234-123456789abc"})]}),t.jsxs(Pr,{children:[t.jsx(_r,{children:"Client ID"}),t.jsx(Tr,{type:"text",value:l.clientId,onChange:e=>d(t=>({...t,clientId:e.target.value})),placeholder:"Enter your client ID"})]})]}),t.jsxs(Pr,{children:[t.jsx(_r,{children:"ID Token (Required)"}),t.jsx(Ar,{value:l.idToken,onChange:e=>d(t=>({...t,idToken:e.target.value})),placeholder:"Paste your ID token here (from authentication response)"}),t.jsx("small",{style:{color:"#6b7280",display:"block",marginTop:"0.5rem"},children:"💡 Get this from your authentication flow's token response"})]}),t.jsxs(Pr,{children:[t.jsx(_r,{children:"Post-Logout Redirect URI"}),t.jsx(Tr,{type:"text",value:l.postLogoutRedirectUri,onChange:e=>d(t=>({...t,postLogoutRedirectUri:e.target.value})),placeholder:"https://localhost:3000/logout-callback"}),t.jsx("small",{style:{color:"#6b7280",display:"block",marginTop:"0.5rem"},children:'⚠️ Must be registered in PingOne application\'s "Sign Off URLs"'})]}),t.jsxs(Pr,{children:[t.jsx(_r,{children:"State (CSRF Protection)"}),t.jsx(Tr,{type:"text",value:l.state,onChange:e=>d(t=>({...t,state:e.target.value})),placeholder:"Random state value"}),t.jsx("small",{style:{color:"#6b7280",display:"block",marginTop:"0.5rem"},children:"💡 Store this in sessionStorage and verify on redirect"})]}),t.jsxs(Er,{$variant:"primary",onClick:async()=>{try{if(c("loading"),x(null),!l.environmentId)throw new Error("Environment ID is required");if(!l.idToken)throw new Error("ID Token is required");const e=ye(l.environmentId,{idTokenHint:l.idToken,postLogoutRedirectUri:l.postLogoutRedirectUri,state:l.state});p(e),g({success:!0,logoutUrl:e,message:"Logout URL generated successfully"}),c("success")}catch(e){const t=e instanceof Error?e.message:"Unknown error";x(t),c("error")}},children:[t.jsx(S,{})," Generate Logout URL"]})]}),u&&t.jsxs(Or,{children:[t.jsx("h4",{children:"Response:"}),t.jsx(Rr,{children:t.jsx($,{data:u})})]}),f&&t.jsxs(Fr,{children:[t.jsx("h4",{children:"Error:"}),t.jsx("p",{children:f})]})]})},Lr=xr.createStepMetadata([{title:"Step 1: Introduction & Setup",subtitle:"Understand Redirectless Flow (pi.flow)"},{title:"Step 2: PKCE Generation",subtitle:"Generate secure code verifier and challenge"},{title:"Step 3: Authorization Request",subtitle:"POST to /authorize with response_mode=pi.flow"},{title:"Step 4: Token Response & Management",subtitle:"Handle flow interaction and received tokens"},{title:"Step 5: Flow Complete",subtitle:"Summary and next steps for redirectless flow"}]),Br=Ee.getContainer(),Nr=Ee.getContentWrapper(),Kr=P.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	margin: 1.5rem 0;
	border: 1px solid #e5e7eb;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,qr=P.span`
	background: #f59e0b;
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	margin-left: 0.5rem;
`,Vr=P.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`,Jr=P.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	width: 90%;
	max-width: 400px;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`,Wr=P.h3`
	margin: 0 0 1.5rem 0;
	color: #1f2937;
	text-align: center;
	font-size: 1.5rem;
	font-weight: 600;
`,Gr=P.div`
	margin-bottom: 1rem;
`,Hr=P.label`
	display: block;
	margin-bottom: 0.5rem;
	color: #374151;
	font-weight: 500;
	font-size: 0.875rem;
`,Yr=P.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	transition: border-color 0.2s ease;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`,Xr=P.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1.5rem;
`,Qr=P.button`
	flex: 1;
	padding: 0.75rem 1rem;
	border: none;
	border-radius: 0.5rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	
	${e=>"primary"===e.$variant?"\n\t\tbackground: #3b82f6;\n\t\tcolor: white;\n\t\t\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground: #2563eb;\n\t\t}\n\t":"\n\t\tbackground: #f3f4f6;\n\t\tcolor: #374151;\n\t\t\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground: #e5e7eb;\n\t\t}\n\t"}
	
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`,Zr=P.button`
	background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
	color: white;
	border: none;
	padding: 1rem 2rem;
	border-radius: 0.75rem;
	font-size: 1.1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin: 1.5rem auto;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	
	&:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
	}
	
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
`,{NavigationButton:eo}=Oe.createStepLayout({theme:"blue",showProgress:!0}),to=()=>{const o=C(),h=ze({flowKey:"redirectless-v7-real",defaultFlowVariant:"oidc"});_e({pageName:"Redirectless Flow V7 Real",force:!0});const[p,u]=e.useState(De.StepRestoration.getInitialStep()),m=!0,[g,f]=e.useState(De.CollapsibleSections.getDefaultState()),[x,w]=e.useState([]),[b,k]=e.useState(!1),[j,y]=e.useState(null),[S,I]=e.useState(null),[P,_]=e.useState(!1),[T,A]=e.useState({username:"demo.user@example.com",password:"P@ssw0rd123"}),[E,R]=e.useState(!1),[F,M]=e.useState({required:!1});e.useEffect(()=>{De.StepRestoration.scrollToTopOnStepChange()},[]),e.useEffect(()=>{Le.AdvancedParameters.get("redirectless-v7")},[]),e.useEffect(()=>{h.credentials.clientId&&Le.AdvancedParameters.set("redirectless-v7",{currentStep:p,hasTokens:!!h.tokens?.accessToken,flowType:"redirectless"})},[p,h.credentials.clientId,h.tokens]),e.useCallback(De.CollapsibleSections.createToggleHandler(f),[]);const U=e.useCallback(()=>{const e=$e.loadPKCECodes("redirectless-v7-real"),t=!(!h.pkceCodes.codeVerifier||!h.pkceCodes.codeChallenge)||!(!e?.codeVerifier||!e?.codeChallenge);return!h.pkceCodes.codeVerifier&&e?.codeVerifier&&h.setPkceCodes(e),t},[h]),$=e.useCallback(e=>{De.Navigation.handleNext(p,h.credentials,"oauth",h,e=>{const t=U();switch(e){case 0:default:return!0;case 1:return t;case 2:return!(!h.authUrl||!t);case 3:return!(!h.authCode&&!h.authCode)}},()=>{u(e)})},[p,h,U]),z=e.useCallback(()=>{const e=K.createOAuthTemplate("redirectless","PKCE Generation",{method:"LOCAL",url:"Client-side PKCE Generation",description:"Generate cryptographically secure PKCE parameters for redirectless flow",educationalNotes:["PKCE (Proof Key for Code Exchange) adds security to OAuth flows","Code verifier is a cryptographically random string","Code challenge is SHA256 hash of the verifier","Prevents authorization code interception attacks"]});w(t=>[...t,e]),De.PKCE.generatePKCE("oidc",h.credentials,h)},[h]),D=e.useCallback(()=>{const e=K.createOAuthTemplate("redirectless","Authorization URL Generation",{method:"LOCAL",url:"Client-side URL Construction",description:"Generate authorization URL with response_mode=pi.flow for server-to-server exchange",body:{response_type:"code",response_mode:"pi.flow",client_id:h.credentials.clientId,redirect_uri:"urn:pingidentity:redirectless",scope:"openid profile email",code_challenge:h.pkceCodes.codeChallenge,code_challenge_method:"S256",state:"[random-state-value]"},educationalNotes:["response_mode=pi.flow enables redirectless flow","redirect_uri uses special urn:pingidentity:redirectless","PKCE parameters ensure security without client secret","Authorization code will be returned directly in API response"]});w(t=>[...t,e]),De.Authorization.generateAuthUrl("oidc",h.credentials,h)},[h]),L=e.useCallback(async(e,t,n,r)=>{try{if(!r){const e=sessionStorage.getItem("redirectless-v7-real-resumeUrl");if(!e)throw new Error("No resumeUrl available. Please restart the flow.");r=e}const o=await fetch("/api/pingone/resume",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({resumeUrl:r,flowId:e,flowState:t,clientId:h.credentials.clientId,clientSecret:h.credentials.clientSecret,codeVerifier:n.codeVerifier})});if(!o.ok){const e=await o.text();throw new Error(`Resume request failed: ${o.status} ${o.statusText}. ${e}`)}const s=await o.json(),i=s.code||s.authorizeResponse?.code;if(!i)throw new Error("No authorization code received after calling resumeUrl");await B(i,n.codeVerifier)}catch(o){o instanceof Error&&o.message;throw o}},[h,B]),B=e.useCallback(async(e,t)=>{try{const r="https://oauth-playground.vercel.app",o={grant_type:"authorization_code",code:e,redirect_uri:"urn:pingidentity:redirectless",client_id:h.credentials.clientId,client_secret:h.credentials.clientSecret,environment_id:h.credentials.environmentId,code_verifier:t},s=await fetch(`${r}/api/token-exchange`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)});if(!s.ok){const e=await s.json().catch(()=>({}));if(!0===e.requires_password_change||!0===e.password_change_required||String(e.error_description||"").toLowerCase().includes("must_change_password")||String(e.error_description||"").toLowerCase().includes("password change required")||String(e.error_description||"").toLowerCase().includes("must change password")){const t=new Error("MUST_CHANGE_PASSWORD");throw t.code="MUST_CHANGE_PASSWORD",t.requiresPasswordChange=!0,t.userId=e.user_id||e.userId,t.errorData=e,t}const t=e.error_description||e.error||"Please check your configuration.";throw new Error(`Token exchange failed: ${s.status} ${s.statusText}. ${t}`)}const i=await s.json(),a=!0===i.requires_password_change||!0===i.password_change_required;if(a&&i.id_token)try{const e=String(i.id_token).split(".");if(3===e.length){const t=JSON.parse(atob(e[1]));if("MUST_CHANGE_PASSWORD"===(t.password_state||t.password_status||t.pwd_state)){const e=new Error("MUST_CHANGE_PASSWORD");throw e.code="MUST_CHANGE_PASSWORD",e.requiresPasswordChange=!0,e.userId=t.sub||t.user_id,e.accessToken=i.access_token,e.tokens=i,e}}}catch(n){if(a){const e=new Error("MUST_CHANGE_PASSWORD");throw e.code="MUST_CHANGE_PASSWORD",e.requiresPasswordChange=!0,e.userId=i.user_id,e.accessToken=i.access_token,e.tokens=i,e}}if(!i.access_token)throw new Error("No access token received from PingOne");const c=K.createOAuthTemplate("redirectless","Token Exchange",{method:"POST",url:`${r}/api/token-exchange`,headers:{"Content-Type":"application/json"},body:{grant_type:"authorization_code",code:e,redirect_uri:"urn:pingidentity:redirectless",client_id:h.credentials.clientId,client_secret:"***REDACTED***",environment_id:h.credentials.environmentId,code_verifier:t},description:"Real server-to-server token exchange using response_mode=pi.flow",educationalNotes:["Authorization code obtained from resume step is exchanged for tokens","No browser redirect required - pure server-to-server exchange","PKCE code_verifier validates the original request","Special redirect_uri urn:pingidentity:redirectless used","Response includes access_token, id_token, and refresh_token"]});c.response={status:s.status,statusText:s.statusText,headers:Object.fromEntries(s.headers.entries()),data:{...i,access_token:`${i.access_token.substring(0,20)}...[TRUNCATED FOR SECURITY]`}},w(e=>[...e,c]),k(!1),R(!1),_(!1),ve.showSuccess("✅ Tokens obtained from PingOne redirectless flow! No redirects used."),I({access_token:i.access_token,refresh_token:i.refresh_token,id_token:i.id_token,token_type:i.token_type,expires_in:i.expires_in,scope:i.scope});const l={access_token:i.access_token};i.refresh_token&&(l.refreshToken=i.refresh_token),i.id_token&&(l.idToken=i.id_token),i.token_type&&(l.tokenType=i.token_type),i.expires_in&&(l.expiresIn=i.expires_in),i.scope&&(l.scope=i.scope),h.setTokens(l),ve.showSuccess("🎉 Redirectless authentication successful! Tokens returned directly - no browser redirects!")}catch(r){if(r instanceof Error&&("MUST_CHANGE_PASSWORD"===r.code||!0===r.requiresPasswordChange))return M({required:!0,userId:r.userId,accessToken:r.accessToken,tokens:r.tokens,environmentId:h.credentials.environmentId}),R(!1),void k(!1);const e=r instanceof Error?r.message:"Unknown error";y(e),ve.showError(`❌ Token exchange failed: ${e}`),R(!1),k(!1)}},[h]),N=e.useCallback(async()=>{R(!0),y(null);try{const e=sessionStorage.getItem("redirectless-v7-real-flowId"),t=sessionStorage.getItem("redirectless-v7-real-state"),n=sessionStorage.getItem("redirectless-v7-real-codeVerifier");if(!e||!t||!n)throw new Error("Flow state not found. Please start the flow again.");const r=`https://auth.pingone.com/${h.credentials.environmentId}/flows/${e}`,o=await fetch("/api/pingone/flows/check-username-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:h.credentials.environmentId,flowUrl:r,username:T.username,password:T.password,clientId:h.credentials.clientId,clientSecret:h.credentials.clientSecret})});if(!o.ok){let e=`Credentials submission failed: ${o.status} ${o.statusText}`;try{const t=await o.json();e=t.error_description?t.error_description:t.message?t.message:t.error?t.error:t.details?.message?t.details.message:JSON.stringify(t);const n=JSON.stringify(t).toLowerCase();(n.includes("must_change_password")||n.includes("password change required")||n.includes("must change password"))&&(e="Password change is required. Please contact your administrator or use the password reset flow.")}catch{e=await o.text().catch(()=>"Unknown error")||e}throw new Error(e)}const s=await o.json(),i=String(s.status||"").toUpperCase(),a=s.resumeUrl;if("READY_TO_RESUME"!==i||!a)throw new Error(`Unexpected status after credentials: ${i||"UNKNOWN"}`);sessionStorage.setItem("redirectless-v7-real-resumeUrl",a),await L(e,t,{codeVerifier:n,codeChallenge:"",codeChallengeMethod:"S256"},a)}catch(e){const t=e instanceof Error?e.message:"Unknown error";y(t),ve.showError(`❌ Authentication failed: ${t}`),R(!1)}},[h,T,L]),H=e.useCallback(async()=>{await N()},[N]),Y=e.useCallback(async()=>{k(!0),y(null);try{const{generateCodeVerifier:e,generateCodeChallenge:t}=await Se(async()=>{const{generateCodeVerifier:e,generateCodeChallenge:t}=await import("./utils-lzKqcxFi.js").then(e=>e.aV);return{generateCodeVerifier:e,generateCodeChallenge:t}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30])),n=e(),r={codeVerifier:n,codeChallenge:await t(n),codeChallengeMethod:"S256"};h.setPkceCodes(r);const o="redirectless-v7-real";$e.savePKCECodes(o,{codeVerifier:r.codeVerifier,codeChallenge:r.codeChallenge,codeChallengeMethod:r.codeChallengeMethod});const s=`https://auth.pingone.com/${h.credentials.environmentId}/as/authorize`,i=`redirectless-v7-${Date.now()}`,a=new URLSearchParams({response_type:"code",client_id:h.credentials.clientId,scope:"openid profile email",state:i,nonce:`nonce-v7-${Date.now()}`,code_challenge:r.codeChallenge,code_challenge_method:"S256",response_mode:"pi.flow"}),c=await fetch(s,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"},body:a.toString()});if(!c.ok){const e=await c.text();throw new Error(`Authorization request failed: ${c.status} ${c.statusText}. ${e}`)}const l=await c.json(),d=l.id||l.flowId;if(!d)throw new Error("No flowId received from PingOne redirectless flow");sessionStorage.setItem("redirectless-v7-real-flowId",d),sessionStorage.setItem("redirectless-v7-real-state",i),sessionStorage.setItem("redirectless-v7-real-codeVerifier",r.codeVerifier),sessionStorage.setItem("redirectless-v7-real-codeChallenge",r.codeChallenge);const p=l.status?.toUpperCase();if("USERNAME_PASSWORD_REQUIRED"===p||"IN_PROGRESS"===p)return _(!0),void k(!1);if("READY_TO_RESUME"===p||l.resumeUrl)return void(await L(d,i,r,l.resumeUrl));throw new Error(`Unexpected flow status: ${p||"UNKNOWN"}`)}catch(e){const t=e instanceof Error?e.message:"Unknown error";y(t),ve.showError(`❌ Failed to start redirectless flow: ${t}`),k(!1)}},[h,L]),Z=e.useCallback(()=>{h.authUrl&&De.Authorization.openAuthUrl(h.authUrl)},[h.authUrl]),ee=e.useCallback(()=>{h.tokens&&(h.tokens.accessToken&&localStorage.setItem("redirectless-access-token",String(h.tokens.accessToken)),h.tokens.idToken&&localStorage.setItem("redirectless-id-token",String(h.tokens.idToken)),h.tokens.refreshToken&&localStorage.setItem("redirectless-refresh-token",String(h.tokens.refreshToken)),o("/token-management"))},[h.tokens,o]);e.useEffect(()=>{h.credentials&&De.ResponseTypeEnforcer.enforceResponseType("oidc",h.credentials,h.setCredentials)},[h.credentials,h.setCredentials]),e.useEffect(()=>{h.credentials&&De.CredentialsSync.syncCredentials("oidc",h.credentials,h.setCredentials)},[h.credentials,h.setCredentials]);const ne=e.useCallback(()=>{switch(p){case 0:return t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:{background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",color:"white",padding:"2rem",borderRadius:"1rem",marginBottom:"2rem",boxShadow:"0 10px 25px rgba(59, 130, 246, 0.2)"},children:[t.jsx("h2",{style:{margin:"0 0 1rem 0",fontSize:"1.5rem",fontWeight:"700"},children:"🎯 PingOne Redirectless Flow V7 (response_mode=pi.flow)"}),t.jsx("p",{style:{margin:"0 0 1rem 0",fontSize:"1.1rem",opacity:"0.9"},children:"Build custom authentication UIs without browser redirects. Perfect for embedded login experiences, mobile apps, and server-to-server scenarios where you want full control over the user experience."}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",padding:"1rem",borderRadius:"0.5rem",border:"1px solid rgba(255, 255, 255, 0.2)"},children:[t.jsx("strong",{children:"V7 Enhancements:"})," Fresh PKCE generation every time, improved error handling, enhanced logging, and better state management for more reliable redirectless flows."]})]}),t.jsxs("div",{style:{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"2rem"},children:[t.jsxs("h3",{style:{margin:"0 0 1rem 0",color:"#1f2937",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(i,{}),"Authorization URL with response_mode=pi.flow (V7)"]}),t.jsxs("div",{style:{background:"#1f2937",color:"#f9fafb",padding:"1rem",borderRadius:"0.5rem",fontFamily:"Monaco, Menlo, monospace",fontSize:"0.875rem",overflow:"auto"},children:[t.jsx("div",{style:{color:"#60a5fa",marginBottom:"0.5rem"},children:"POST"}),t.jsxs("div",{style:{marginBottom:"1rem"},children:["https://auth.pingone.com/",h.credentials?.environmentId||"{environmentId}","/as/authorize"]}),t.jsx("div",{style:{color:"#34d399",marginBottom:"0.5rem"},children:"Headers:"}),t.jsx("div",{style:{marginLeft:"1rem",marginBottom:"1rem"},children:"Content-Type: application/x-www-form-urlencoded"}),t.jsx("div",{style:{color:"#fbbf24",marginBottom:"0.5rem"},children:"Body Parameters:"}),t.jsxs("div",{style:{marginLeft:"1rem"},children:[t.jsxs("div",{children:["client_id=",h.credentials?.clientId||"{clientId}"]}),t.jsx("div",{style:{color:"#f87171",fontWeight:"bold"},children:"response_mode=pi.flow"}),t.jsx("div",{children:"response_type=code"}),t.jsx("div",{children:"scope=openid profile email"}),t.jsxs("div",{children:["username=","{username}"]}),t.jsxs("div",{children:["password=","{password}"]}),t.jsxs("div",{children:["code_challenge=","{pkce_challenge}"]}),t.jsx("div",{children:"code_challenge_method=S256"})]})]}),t.jsxs("div",{style:{marginTop:"1rem",padding:"1rem",background:"#fef3c7",border:"1px solid #f59e0b",borderRadius:"0.5rem",fontSize:"0.875rem"},children:[t.jsx("strong",{children:"⚡ V7 Key Point:"})," Notice there's no ",t.jsx("code",{children:"redirect_uri"})," ","parameter! The ",t.jsx("code",{children:"response_mode=pi.flow"})," tells PingOne to return tokens directly in the API response instead of redirecting to a callback URL. V7 ensures fresh PKCE codes every time."]})]}),t.jsxs("div",{style:{background:"white",border:"2px solid #10b981",borderRadius:"1rem",padding:"2rem",marginBottom:"2rem",boxShadow:"0 10px 25px rgba(16, 185, 129, 0.1)"},children:[t.jsxs("h3",{style:{margin:"0 0 1rem 0",color:"#059669",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(v,{}),"Mock Custom Login UI (What Your Users Would See) - V7"]}),t.jsx("p",{style:{margin:"0 0 1.5rem 0",color:"#6b7280"},children:"This is what your custom authentication UI might look like. Instead of redirecting to PingOne's hosted login page, you collect credentials in your own UI and make the API call behind the scenes. V7 ensures fresh PKCE codes for every authentication attempt."}),t.jsxs("div",{style:{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"0.75rem",padding:"2rem",maxWidth:"400px",margin:"0 auto"},children:[t.jsxs("div",{style:{textAlign:"center",marginBottom:"2rem"},children:[t.jsx("h4",{style:{margin:"0 0 0.5rem 0",fontSize:"1.25rem",color:"#1f2937"},children:"Sign In to Your App"}),t.jsx("p",{style:{margin:"0",color:"#6b7280",fontSize:"0.875rem"},children:"Custom UI powered by PingOne V7"})]}),t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:"600",color:"#374151"},children:"Username or Email"}),t.jsx("input",{type:"text",placeholder:"Enter your username",style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"1rem"},disabled:!0})]}),t.jsx("form",{children:t.jsxs("div",{style:{marginBottom:"2rem"},children:[t.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:"600",color:"#374151"},children:"Password"}),t.jsx("input",{type:"password",placeholder:"Enter your password",style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"1rem"},disabled:!0})]})},"v7-password-form"),t.jsx(eo,{disabled:!0,style:{width:"100%",opacity:"0.7"},children:"Sign In (Demo Only)"}),t.jsxs("div",{style:{marginTop:"1rem",padding:"1rem",background:"#dbeafe",border:"1px solid #3b82f6",borderRadius:"0.5rem",fontSize:"0.875rem",textAlign:"center"},children:[t.jsx("strong",{children:"V7 Behind the scenes:"}),' When user clicks "Sign In", your app makes a POST request to PingOne\'s authorization endpoint with'," ",t.jsx("code",{children:"response_mode=pi.flow"}),"and receives tokens directly - no redirect needed! Fresh PKCE codes generated every time."]})]})]}),t.jsxs("div",{style:{background:"#f0fdf4",border:"1px solid #16a34a",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"2rem"},children:[t.jsxs("h3",{style:{margin:"0 0 1rem 0",color:"#15803d",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(n,{}),"Direct Token Response (No Redirect!) - V7"]}),t.jsx("p",{style:{margin:"0 0 1rem 0",color:"#166534"},children:"Instead of a redirect, PingOne returns tokens directly in the API response:"}),t.jsxs("div",{style:{background:"#1f2937",color:"#f9fafb",padding:"1rem",borderRadius:"0.5rem",fontFamily:"Monaco, Menlo, monospace",fontSize:"0.875rem",overflow:"auto"},children:[t.jsx("div",{style:{color:"#34d399",marginBottom:"0.5rem"},children:"HTTP 200 OK"}),t.jsx("div",{style:{color:"#60a5fa",marginBottom:"0.5rem"},children:"Content-Type: application/json"}),t.jsx("div",{style:{marginTop:"1rem"},children:'{\n  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "scope": "openid profile email",\n  "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",\n  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."\n}'})]})]}),t.jsx(Te,{credentials:h.credentials,onCredentialsChange:h.setCredentials,onDiscoveryComplete:()=>{},requireClientSecret:!1,showAdvancedConfig:!0,defaultCollapsed:m}),t.jsx(Be,{flowType:"redirectless",defaultCollapsed:m})]});case 1:return t.jsxs(t.Fragment,{children:[t.jsxs(Q,{title:"PKCE Parameters (V7 Enhanced)",icon:t.jsx(n,{}),defaultCollapsed:m,children:[t.jsx("div",{style:{marginBottom:"1rem"},children:t.jsxs("p",{children:[t.jsx("strong",{children:"Proof Key for Code Exchange (PKCE)"})," adds an extra layer of security to the authorization code flow, even for public clients. V7 ensures fresh PKCE codes every time."]})}),t.jsxs(eo,{onClick:z,disabled:!!h.pkceCodes.codeVerifier,title:h.pkceCodes.codeVerifier?"PKCE parameters already generated":"Generate PKCE parameters",children:[h.pkceCodes.codeVerifier?t.jsx(n,{}):t.jsx(l,{})," ",h.pkceCodes.codeVerifier?"PKCE Parameters Generated":"Generate PKCE Parameters",t.jsx(qr,{children:"1"})]}),h.pkceCodes.codeVerifier&&t.jsxs("div",{style:{marginTop:"1rem",padding:"1rem",background:"#f9fafb",borderRadius:"0.5rem"},children:[t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Code Verifier:"}),t.jsx("pre",{style:{marginTop:"0.5rem",padding:"0.5rem",background:"white",borderRadius:"0.25rem",fontSize:"0.75rem",overflow:"auto"},children:h.pkceCodes.codeVerifier})]}),t.jsxs("div",{children:[t.jsx("strong",{children:"Code Challenge:"}),t.jsx("pre",{style:{marginTop:"0.5rem",padding:"0.5rem",background:"white",borderRadius:"0.25rem",fontSize:"0.75rem",overflow:"auto"},children:h.pkceCodes.codeChallenge})]})]})]}),t.jsxs(Q,{title:"Authorization URL Generation (V7)",icon:t.jsx(n,{}),defaultCollapsed:m,children:[t.jsx("div",{style:{marginBottom:"1rem"},children:t.jsxs("p",{children:["Generate the authorization URL that will be used to authenticate the user. For Redirectless flow, this URL includes the special"," ",t.jsx("code",{children:"response_mode=pi.flow"})," parameter."]})}),t.jsxs(eo,{onClick:D,disabled:!!h.authUrl||!U(),title:U()?h.authUrl?"Authorization URL already generated":"Generate authorization URL":"Generate PKCE parameters first",children:[h.authUrl?t.jsx(n,{}):t.jsx(i,{})," ",h.authUrl?"Authorization URL Generated":U()?"Generate Authorization URL":"Complete above action",t.jsx(qr,{children:"1"})]}),h.authUrl&&t.jsxs("div",{style:{marginTop:"1rem"},children:[t.jsxs("div",{style:{padding:"1rem",background:"#f9fafb",borderRadius:"0.5rem"},children:[t.jsx("strong",{children:"Authorization URL:"}),t.jsx("pre",{style:{marginTop:"0.5rem",padding:"0.5rem",background:"white",borderRadius:"0.25rem",fontSize:"0.75rem",overflow:"auto"},children:h.authUrl})]}),t.jsx("div",{style:{marginTop:"1rem"},children:t.jsxs(eo,{onClick:Z,title:"Open authorization URL in new tab",children:[t.jsx(i,{})," Open Authorization URL"]})})]})]})]});case 2:return t.jsxs(Q,{title:"Token Exchange (V7 Enhanced)",icon:t.jsx(l,{}),defaultCollapsed:m,children:[t.jsx("div",{style:{marginBottom:"1rem"},children:t.jsxs("p",{children:[t.jsx("strong",{children:"Redirectless Authentication:"})," Experience a real authorization code flow without browser redirects! You'll see a custom login form (not PingOne's UI), enter credentials, and receive tokens directly via API calls with"," ",t.jsx("code",{children:"response_mode=pi.flow"}),"."]})}),t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx(Zr,{onClick:Y,disabled:!U()||b||E,title:U()?b?"Starting redirectless flow...":"Start redirectless authentication":"Generate PKCE parameters first",children:b||E?t.jsxs(t.Fragment,{children:[t.jsx(l,{className:"animate-spin"}),b?"Starting Flow...":"Authenticating..."]}):t.jsxs(t.Fragment,{children:[t.jsx(r,{}),"Start Redirectless Authentication"]})}),t.jsxs("div",{style:{marginTop:"1rem",padding:"1rem",background:"#eff6ff",borderRadius:"0.5rem",border:"1px solid #bfdbfe",fontSize:"0.875rem",color:"#1e40af"},children:[t.jsx("strong",{children:"🚀 Behind the Scenes:"}),t.jsx("br",{}),'When you click "Sign In", your app makes a POST request to PingOne\'s authorization endpoint with ',t.jsx("code",{children:"response_mode=pi.flow"})," and receives tokens directly - no redirect needed! Fresh PKCE codes generated every time."]})]}),h.tokens?.accessToken&&t.jsx("div",{style:{marginTop:"1rem",padding:"1rem",background:"#f0fdf4",borderRadius:"0.5rem",border:"1px solid #bbf7d0"},children:t.jsx("p",{style:{color:"#166534",margin:0,fontWeight:"600"},children:"✅ Tokens received successfully! The redirectless flow V7 is complete."})}),h.tokens?.accessToken?t.jsx("div",{style:{marginTop:"1rem"},children:Re.showTokens(h.tokens,"oidc","redirectless-v7-tokens",{showCopyButtons:!0,showDecodeButtons:!0,showIntrospection:!0,title:"🎯 Redirectless Flow V7 Tokens"})}):t.jsxs("div",{style:{textAlign:"center",padding:"2rem",color:"#666"},children:[t.jsx(s,{style:{marginBottom:"0.5rem"}}),t.jsx("p",{children:"Complete the token exchange step to receive tokens"})]})]});case 3:return t.jsxs(Q,{title:"Token Management (V7)",icon:t.jsx(v,{}),defaultCollapsed:m,children:[t.jsx("div",{style:{marginBottom:"1rem"},children:t.jsx("p",{children:"Manage your tokens, including introspection, refresh, and validation."})}),t.jsxs(eo,{onClick:ee,disabled:!h.tokens?.accessToken,title:h.tokens?.accessToken?"Open token management":"No tokens available",children:[t.jsx(v,{})," Token Management",t.jsx(qr,{children:"1"})]}),h.tokens?.accessToken?t.jsx("div",{style:{marginTop:"1rem",padding:"1rem",background:"#f9fafb",borderRadius:"0.5rem"},children:t.jsx("p",{style:{color:"#059669",margin:0},children:"✓ Tokens available. Click the button above to navigate to Token Management page."})}):null]});default:return t.jsxs("div",{children:["Step ",p]})}},[p,h,z,D,Z,ee,U,Y,E,b]);return t.jsxs(Br,{children:[t.jsxs(Nr,{children:[t.jsx(O,{flowId:"redirectless-v7"}),t.jsx(te,{title:"Redirectless Flow V7 (response_mode=pi.flow)",description:"Enhanced server-to-server OAuth/OIDC flow without browser redirects using PingOne's pi.flow response mode",features:["No browser redirects required","Server-to-server token exchange","Fresh PKCE codes every time (V7)","Enhanced error handling (V7)","Improved logging (V7)","Direct API integration"],flowType:"redirectless"}),t.jsx(Be,{flowType:"oauth",defaultCollapsed:!1}),x.length>0&&t.jsxs(Kr,{children:[t.jsxs(q,{children:[t.jsx(c,{})," API Calls & Responses (V7)"]}),t.jsxs(V,{children:[t.jsx(J,{children:"Educational view of the redirectless flow V7 API interactions with PingOne."}),x.map((e,n)=>t.jsx(W,{apiCall:e,onCopy:()=>{}},`${e.flowType}-${e.stepName}-${n}`))]})]}),t.jsx(X,{currentStep:p,totalSteps:Lr.length,onPrevious:()=>p>0&&u(p-1),onNext:()=>$(p+1),onReset:()=>{u(0),h.resetFlow()},canNavigateNext:!0,isFirstStep:0===p}),h.tokens?.accessToken&&t.jsx(Ne,{config:{...Ke.authorizationCode,flowType:"redirectless",title:"Redirectless Flow V7 Complete! 🎉",description:"You have successfully completed the redirectless OAuth flow V7 using response_mode=pi.flow",nextSteps:["Use the access token to make API calls","Implement token refresh using the refresh token","Explore other OAuth flows in the playground","Learn about PKCE security best practices","Try the enhanced V7 features"]},tokens:h.tokens,onReset:()=>{h.resetFlow(),u(0),w([])}}),t.jsx(Kr,{children:ne()})]}),P&&t.jsx(Vr,{children:t.jsxs(Jr,{children:[t.jsxs(Wr,{children:[t.jsx(r,{style:{marginRight:"0.5rem"}}),"Sign In to Continue"]}),t.jsx("div",{style:{background:"#f0f9ff",padding:"1rem",borderRadius:"0.5rem",marginBottom:"1.5rem",border:"1px solid #bae6fd"},children:t.jsxs("div",{style:{fontSize:"0.875rem",color:"#0c4a6e"},children:[t.jsx("strong",{children:"🔒 Redirectless Flow Demo"}),t.jsx("br",{}),"Enter your credentials below. Behind the scenes, we'll make a POST request to PingOne's authorization endpoint with ",t.jsx("code",{children:"response_mode=pi.flow"})," and receive tokens directly - no redirect needed!"]})}),t.jsxs(Gr,{children:[t.jsx(Hr,{children:"Username / Email"}),t.jsx(Yr,{type:"email",value:T.username,onChange:e=>{A(t=>({...t,username:e.target.value})),y(null)},placeholder:"Enter your username or email",disabled:E})]}),t.jsxs(Gr,{children:[t.jsx(Hr,{children:"Password"}),t.jsx(Yr,{type:"password",value:T.password,onChange:e=>{A(t=>({...t,password:e.target.value})),y(null)},placeholder:"Enter your password",disabled:E})]}),j&&t.jsxs("div",{style:{background:"#fef2f2",border:"1px solid #fecaca",color:"#991b1b",padding:"0.75rem",borderRadius:"0.375rem",marginBottom:"1rem",fontSize:"0.875rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(a,{style:{flexShrink:0}}),t.jsx("span",{children:j})]}),t.jsxs("div",{style:{background:"#fef3c7",padding:"0.75rem",borderRadius:"0.375rem",marginBottom:"1rem",fontSize:"0.75rem",color:"#92400e"},children:["💡 ",t.jsx("strong",{children:"Demo Note:"})," These are demo credentials for testing. The flow will make real API calls to PingOne with ",t.jsx("code",{children:"response_mode=pi.flow"})," to demonstrate redirectless authentication."]}),t.jsxs(Xr,{children:[t.jsx(Qr,{$variant:"secondary",onClick:()=>_(!1),disabled:E,children:"Cancel"}),t.jsx(Qr,{$variant:"primary",onClick:H,disabled:E||!T.username||!T.password,children:E?t.jsxs(t.Fragment,{children:[t.jsx(l,{className:"animate-spin"}),"Authenticating..."]}):t.jsxs(t.Fragment,{children:[t.jsx(d,{}),"Sign In"]})})]})]})}),t.jsx(G,{isOpen:F.required,onClose:()=>M({required:!1}),onPasswordChange:async(e,t)=>{if(!F.userId||!F.environmentId)throw new Error("Missing user ID or environment ID for password change");const n=await fetch("/api/pingone/password/change",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({environmentId:F.environmentId,userId:F.userId,accessToken:F.accessToken||h.tokens?.accessToken,oldPassword:e,newPassword:t})});if(!n.ok){const e=await n.json().catch(()=>({}));throw new Error(e.error_description||e.message||"Failed to change password")}F.tokens?(I(F.tokens),h.setTokens({access_token:F.tokens.access_token,refreshToken:F.tokens.refresh_token,idToken:F.tokens.id_token,tokenType:F.tokens.token_type,expiresIn:F.tokens.expires_in,scope:F.tokens.scope}),ve.showSuccess("✅ Password changed successfully! Tokens received.")):ve.showSuccess("✅ Password changed successfully! Please sign in again."),M({required:!1})},userId:F.userId,environmentId:F.environmentId,message:"Your password must be changed before you can continue. Please enter your current password and choose a new password."})]})},no=()=>t.jsxs("div",{style:{maxWidth:"1200px",margin:"0 auto",padding:"2rem"},children:[t.jsx("h1",{children:"🎯 V7 Flow Condensation Mock"}),t.jsxs("div",{style:{background:"#f0f9ff",padding:"1rem",borderRadius:"8px",marginBottom:"2rem"},children:[t.jsx("h2",{children:"Current Problem: Too Many Educational Sections"}),t.jsxs("ul",{children:[t.jsxs("li",{children:[t.jsx("strong",{children:"Authorization Code V7:"})," 12+ collapsible sections"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Device Authorization V7:"})," 8+ collapsible sections"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Implicit Flow V7:"})," 6+ collapsible sections"]})]})]}),t.jsxs("div",{style:{background:"#f0fdf4",padding:"1rem",borderRadius:"8px",marginBottom:"2rem"},children:[t.jsx("h2",{children:"Proposed Solution: 4 Core Sections"}),t.jsxs("div",{style:{display:"grid",gap:"1rem",marginTop:"1rem"},children:[t.jsxs("div",{style:{border:"2px solid #10b981",borderRadius:"8px",padding:"1rem"},children:[t.jsx("h3",{children:"📚 1. Quick Start & Overview (Always Expanded)"}),t.jsxs("p",{children:[t.jsx("strong",{children:"Combines:"})," Current overview + suitability + when to use"]}),t.jsxs("p",{children:[t.jsx("strong",{children:"Content:"})," Variant selector, key differences, use cases"]})]}),t.jsxs("div",{style:{border:"2px solid #3b82f6",borderRadius:"8px",padding:"1rem"},children:[t.jsx("h3",{children:"🔧 2. Configuration & Setup (Collapsible)"}),t.jsxs("p",{children:[t.jsx("strong",{children:"Combines:"})," Credentials + advanced parameters + requirements"]}),t.jsxs("p",{children:[t.jsx("strong",{children:"Content:"})," All configuration in one place"]})]}),t.jsxs("div",{style:{border:"2px solid #f59e0b",borderRadius:"8px",padding:"1rem"},children:[t.jsx("h3",{children:"🚀 3. Flow Execution (Interactive)"}),t.jsxs("p",{children:[t.jsx("strong",{children:"Combines:"})," All request/response sections into one"]}),t.jsxs("p",{children:[t.jsx("strong",{children:"Content:"})," Step-by-step with inline API calls"]})]}),t.jsxs("div",{style:{border:"2px solid #8b5cf6",borderRadius:"8px",padding:"1rem"},children:[t.jsx("h3",{children:"🎯 4. Results & Analysis (Auto-expands)"}),t.jsxs("p",{children:[t.jsx("strong",{children:"Combines:"})," Token display + security + completion"]}),t.jsxs("p",{children:[t.jsx("strong",{children:"Content:"})," Final tokens, security notes, next steps"]})]})]})]}),t.jsxs("div",{style:{background:"#fefce8",padding:"1rem",borderRadius:"8px"},children:[t.jsx("h2",{children:"Benefits"}),t.jsxs("ul",{children:[t.jsxs("li",{children:["✅ ",t.jsx("strong",{children:"Reduced Cognitive Load:"})," 4 clear sections vs 12+ scattered"]}),t.jsxs("li",{children:["✅ ",t.jsx("strong",{children:"Better Flow:"})," Logical progression setup → execute → results"]}),t.jsxs("li",{children:["✅ ",t.jsx("strong",{children:"Maintained Education:"})," All concepts preserved, better organized"]}),t.jsxs("li",{children:["✅ ",t.jsx("strong",{children:"Mobile Friendly:"})," Fewer sections = better mobile experience"]}),t.jsxs("li",{children:["✅ ",t.jsx("strong",{children:"Progressive Disclosure:"})," Sections expand as user progresses"]})]})]}),t.jsxs("div",{style:{marginTop:"2rem",padding:"1rem",background:"#f8fafc",borderRadius:"8px"},children:[t.jsx("h3",{children:"Implementation Plan"}),t.jsxs("ol",{children:[t.jsx("li",{children:"Create new condensed components for each section"}),t.jsx("li",{children:"Migrate existing educational content into new structure"}),t.jsx("li",{children:"Remove redundant collapsible sections"}),t.jsx("li",{children:"Test user experience and iterate"})]})]})]}),ro=()=>{const n=(({flowKey:t,enableDebugger:n=!1})=>{const r=`v7rm:oidc-rop-${t}`,o=he({flowType:"v7rm-oidc-resource-owner-password",persistKey:r,defaultStep:0,enableAutoAdvance:!0}),[s,i]=e.useState({environmentId:"b9817c16-9910-4415-b67e-4ac687da74d9",clientId:"a4f963ea-0736-456a-be72-b1fa4f63f81f",clientSecret:"0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a",username:"demo@example.com",password:"demo-password",scopes:["openid","profile","email"]}),[a,c]=e.useState(!1),[l,d]=e.useState(!1),[h,p]=e.useState(!1),[u,m]=e.useState(!1),[g,f]=e.useState(null),[x,w]=e.useState(null),[b,k]=e.useState(!1),[j,y]=e.useState(null),[v,S]=e.useState(!1),[C,P]=e.useState({includeRefreshToken:!0,includeIdToken:!0,customScopes:"openid profile email",tokenExpiry:3600}),[_,T]=e.useState({}),A=e.useCallback(async()=>{c(!0);try{await new Promise(e=>setTimeout(e,1e3)),localStorage.setItem(`${r}-credentials`,JSON.stringify(s)),d(!0),p(!1),fe.showSuccess("saveConfigurationSuccess")}catch(e){fe.showError("saveConfigurationError",{error:"Failed to save mock credentials"})}finally{c(!1)}},[s,r,n]),E=e.useCallback(async()=>{m(!0);try{if(await new Promise(e=>setTimeout(e,2e3)),!s.username||!s.password)throw new Error("Username and password are required");const e=Ce({scopes:s.scopes,includeRefreshToken:C.includeRefreshToken,includeIdToken:C.includeIdToken,expiresIn:C.tokenExpiry});f(e),fe.showSuccess("saveConfigurationSuccess"),o.setStep(o.currentStepIndex+1,"authentication completed")}catch(e){fe.showError("networkError")}finally{m(!1)}},[s,C,o,n]),R=e.useCallback(async()=>{if(g?.access_token){k(!0);try{await new Promise(e=>setTimeout(e,1500));const e=Ie(s.username);w(e),fe.showSuccess("saveConfigurationSuccess")}catch(e){fe.showError("networkError")}finally{k(!1)}}else fe.showError("stepError")},[g,s.username,n]),O=e.useCallback(async()=>{if(g?.refresh_token){S(!0);try{await new Promise(e=>setTimeout(e,1500));const e=Ce({scopes:s.scopes,includeRefreshToken:!0,includeIdToken:C.includeIdToken,expiresIn:C.tokenExpiry});y(e),fe.showSuccess("saveConfigurationSuccess")}catch(e){fe.showError("networkError")}finally{S(!1)}}else fe.showError("stepError")},[g,s.scopes,C,n]),F=e.useCallback(e=>{P(t=>({...t,...e}))},[]),M=e.useCallback(()=>{f(null),w(null),y(null),T({}),o.setStep(0,"flow reset"),fe.showSuccess("saveConfigurationSuccess")},[o]),U=e.useCallback(e=>Boolean(_[e]),[_]),$=e.useCallback((e,t)=>{T(n=>({...n,[e]:t}))},[]);return I.useEffect(()=>{const e=me(`${r}-credentials`,null);e&&(i(e),d(!0))},[r]),{credentials:s,setCredentials:i,saveCredentials:A,hasCredentialsSaved:l,hasUnsavedCredentialChanges:h,isSavingCredentials:a,isAuthenticating:u,authenticateUser:E,tokens:g,userInfo:x,isFetchingUserInfo:b,fetchUserInfo:R,refreshTokens:O,refreshedTokens:j,isRefreshingTokens:v,flowConfig:C,handleFlowConfigChange:F,resetFlow:M,stepManager:o,persistKey:r,hasStepResult:U,saveStepResult:$}})({flowKey:"v7rm-oidc-resource-owner-password",enableDebugger:!0}),o=e.useMemo(()=>qe({controller:n}),[n]),s=e.useMemo(()=>[{title:"Educational Mock Flow",description:"This is a simulated OIDC Resource Owner Password flow to demonstrate how it would work if PingOne supported it.",icon:t.jsx(k,{}),tone:"info"},{title:"Security Awareness",description:"Learn why this flow is deprecated and understand the security risks involved with direct credential handling.",icon:t.jsx(p,{}),tone:"warning"},{title:"OIDC Extensions",description:"See how OIDC adds ID tokens, user info endpoints, and standardized claims to the basic OAuth flow.",icon:t.jsx(r,{}),tone:"success"}],[]),i=e.useMemo(()=>t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1.5rem"},children:[t.jsx(Je,{type:"warning",children:t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:[t.jsx("strong",{children:"⚠️ This is a Mock Implementation"}),t.jsx("span",{children:"PingOne does NOT support the Resource Owner Password flow. This is an educational simulation to help you understand how the flow would work and why it's deprecated."})]})}),t.jsx(H,{children:t.jsx(Y,{title:"OIDC Resource Owner Password Essentials",items:[{title:"Direct Credentials",description:"Application collects username/password directly - major security risk in most scenarios."},{title:"OIDC Extensions",description:"Adds ID tokens with user claims, UserInfo endpoint access, and standardized OIDC scopes."},{title:"Deprecated Flow",description:"Avoid this flow - use Authorization Code with PKCE or other secure alternatives instead."}]})}),t.jsx(z,{title:"Why This Flow is Deprecated",defaultOpen:!0,children:t.jsxs("ul",{style:{margin:0,paddingLeft:"1.25rem",lineHeight:1.6,color:"#dc2626"},children:[t.jsx("li",{children:"Applications must handle user passwords directly (security risk)"}),t.jsx("li",{children:"No delegation of authentication to the authorization server"}),t.jsx("li",{children:"Phishing attacks become easier to execute"}),t.jsx("li",{children:"Violates the principle of least privilege"}),t.jsx("li",{children:"OIDC benefits like SSO and MFA are lost"}),t.jsx("li",{children:"Difficult to implement proper security controls"})]})}),t.jsx(z,{title:"Secure Alternatives",children:t.jsxs("ul",{style:{margin:0,paddingLeft:"1.25rem",lineHeight:1.6},children:[t.jsxs("li",{children:[t.jsx("strong",{children:"OIDC Authorization Code Flow:"})," Most secure for web applications"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"OIDC Authorization Code with PKCE:"})," Best for mobile and SPA applications"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"OIDC Device Code Flow:"})," For devices with limited input capabilities"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"OIDC Client Credentials:"})," For server-to-server communication"]})]})}),t.jsx(Je,{type:"info",children:t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem"},children:[t.jsx("strong",{children:"Educational Purpose Only"}),t.jsx("span",{children:"This mock flow demonstrates the mechanics and security concerns. In production, always use more secure OAuth 2.0 flows supported by your identity provider."})]})})]}),[]);return t.jsxs(Ve,{title:"V7RM OIDC Resource Owner Password Flow",subtitle:"Mock implementation (PingOne doesn't support this flow)",description:"Learn how the OIDC Resource Owner Password flow would work through this educational simulation. Understand the security risks and see why modern alternatives are preferred.",badge:t.jsxs("span",{children:[t.jsx(j,{})," V7RM - Mock (Not Supported by PingOne)"]}),highlights:s,education:i,children:[t.jsx(de,{config:n.flowConfig,onConfigChange:n.handleFlowConfigChange,flowType:"v7rm-oidc-resource-owner-password",isConfigured:n.hasCredentialsSaved,initialExpanded:!1,title:"V7RM OIDC Configuration",subtitle:"Configure mock credentials for educational purposes. No real authentication occurs."}),t.jsx(ne,{title:"V7RM OIDC Resource Owner Password Flow",steps:o,persistKey:`${n.persistKey}-enhanced-flow`,autoAdvance:!0,allowStepJumping:!0,initialStepIndex:n.stepManager.currentStepIndex,onStepChange:e=>n.stepManager.setStep(e)})]})};export{At as C,br as D,xr as F,Rn as K,Qn as M,fr as O,Dr as P,to as R,wr as S,no as V,Zn as a,ro as b,jr as c,Qt as d,Et as e,yr as p,rt as u,Zt as w};
//# sourceMappingURL=oauth-flows-BoQiEZ27.js.map
