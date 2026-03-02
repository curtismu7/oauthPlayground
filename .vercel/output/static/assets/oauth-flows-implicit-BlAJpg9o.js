const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/components-credentials-T7jmF3zx.js","assets/react-vendor-HWZo9XlX.js","assets/vendor-CvVeuJe7.js","assets/vendor-54DrP_uy.css","assets/styled-vendor-DGSsHzxd.js","assets/utils-lzKqcxFi.js","assets/v8u-services-CviCpCEt.js","assets/v8-services-DHsPM8a2.js","assets/v8-components-8swtZwHb.js","assets/v8-utils-BU6AoW1l.js","assets/v8u-components-COnDGHJS.js","assets/components-oauth-qq-maH2w.js","assets/components-flow-core-y1x-SJYd.js","assets/components-token-uXxDPBqK.js","assets/oauth-flows-device-CMULWbHZ.js","assets/pages-ai-D2KhTcan.js","assets/pages-DE-6TDOE.js","assets/components-oauth-authorize-sao_-EgS.js","assets/components-oauth-discovery-DYbdhNwI.js","assets/pages-pingone-BLdy8FiO.js","assets/oauth-flows-authcode-ltS0AxHA.js","assets/components-oauth-par-B-NhQsyD.js","assets/oauth-flows-BoQiEZ27.js","assets/oauth-flows-par-DTJ0aZ64.js","assets/pages-docs-nYnYMLbe.js","assets/components-flow-BH3Bx-YA.js","assets/components-steps-BQ6HbS5x.js","assets/components-ui-DbX9aVva.js","assets/components-oauth-client-BhjYl9xl.js","assets/components-flow-core-DEegsKK7.css","assets/v8-hooks-B7CjPGrP.js","assets/v8-flows-CbgB_G0p.js","assets/v8-flows-Bwbl_h2s.css"])))=>i.map(i=>d[i]);
import{a as e,j as t,n,k as i,N as r,v as s,u as o,i as a,Q as c,l,m as d,p,h,a9 as u,B as m,b2 as x,Y as g,a5 as f,aq as v}from"./react-vendor-HWZo9XlX.js";import{a as j,s as w,j as k}from"./components-credentials-T7jmF3zx.js";import{aw as I,aC as y,ap as b,ax as S,c as C,ah as A,s as R,au as U,h as T,_ as F,m as z}from"./utils-lzKqcxFi.js";import{a as O}from"./styled-vendor-DGSsHzxd.js";import{ap as $,a4 as D,h as E,a as _,k as L,ag as P,ah as M,q as N}from"./components-oauth-qq-maH2w.js";import{a as H,S as q}from"./components-flow-core-y1x-SJYd.js";import{u as V}from"./oauth-flows-BoQiEZ27.js";import{a as B,u as K}from"./pages-ai-D2KhTcan.js";import{c as J,C as W,O as Y}from"./oauth-flows-device-CMULWbHZ.js";import{F as G,U as Q}from"./pages-DE-6TDOE.js";const X={environmentId:"Environment ID",clientId:"Client ID",clientSecret:"Client Secret",redirectUri:"Redirect URI",scope:"Scope",scopes:"Scopes"};const Z={environmentId:!0,clientId:!0,clientSecret:!1,redirectUri:!0,scope:!1},ee={environmentId:!0,clientId:!0,clientSecret:!1,redirectUri:!0,scope:!0},te={environmentId:!0,clientId:!0,clientSecret:!1,redirectUri:!0,scope:!1},ne={environmentId:!0,clientId:!0,clientSecret:!0,redirectUri:!1,scope:!1},ie={environmentId:!0,clientId:!0,clientSecret:!1,redirectUri:!1,scope:!1};function re(e,t,n){if(0===e)return{isValid:!0,missingFields:[]};if(1===e){let e;switch(n){case"oauth-implicit":e=Z;break;case"oidc-implicit":e=ee;break;case"authorization-code":e=te;break;case"client-credentials":e=ne;break;case"device-authorization":e=ie;break;default:e={environmentId:!0,clientId:!0}}return function(e,t){const n=[];t.environmentId&&!e.environmentId?.trim()&&n.push("environmentId"),t.clientId&&!e.clientId?.trim()&&n.push("clientId"),t.clientSecret&&!e.clientSecret?.trim()&&n.push("clientSecret"),t.redirectUri&&!e.redirectUri?.trim()&&n.push("redirectUri"),t.scope&&(e.scope?.trim()||e.scopes?.trim()||n.push("scope"));t.customFields&&Object.entries(t.customFields).forEach(([t,i])=>{i&&!e[t]?.trim()&&n.push(t)});const i=0===n.length;let r;if(!i){const e=n.map(e=>X[e]||e).join(", ");r=`Please fill in the following required field${n.length>1?"s":""}: ${e}`}return{isValid:i,missingFields:n,errorMessage:r}}(t,e)}return{isValid:!0,missingFields:[]}}const se={default:{v5:"implicit-v5-active",v6:"implicit-v6-active",v7:"implicit-v7-active"},oauth:{v5:"oauth-implicit-v5-flow-active",v6:"oauth-implicit-v6-flow-active",v7:"implicit-flow-v7-oauth-active"},oidc:{v5:"oidc-implicit-v5-flow-active",v6:"oidc-implicit-v6-flow-active",v7:"implicit-flow-v7-oidc-active"}};class oe{static setActiveFlow(e,t="v5"){const n=se[e][t],i=se["oauth"===e?"oidc":"oauth"][t];sessionStorage.removeItem(i),sessionStorage.setItem(n,"true"),"v7"===t&&sessionStorage.setItem(se.default.v7,e)}static clearAllFlowFlags(){Object.values(se.oauth).forEach(e=>sessionStorage.removeItem(e)),Object.values(se.oidc).forEach(e=>sessionStorage.removeItem(e))}static getActiveFlow(e="v5"){if("v7"===e){const e=sessionStorage.getItem(se.default.v7);return"oidc"===e||"oauth"===e?e:null}const t="true"===sessionStorage.getItem(se.oauth[e]),n="true"===sessionStorage.getItem(se.oidc[e]);return t&&!n?"oauth":n&&!t?"oidc":null}static savePingOneConfig(e,t,n="v5"){const i=`${e}-implicit-${n}-app-config`;sessionStorage.setItem(i,JSON.stringify(t))}static loadPingOneConfig(e,t="v5"){const n=`${e}-implicit-${t}-app-config`,i=sessionStorage.getItem(n);return i?JSON.parse(i):null}}class ae{static getFlowMetadata(e){const t={version:"v7",type:"implicit"};switch(e){case"oauth":return{...t,name:"OAuth 2.0 Implicit Flow",shortName:"OAuth Implicit",responseType:"token",tokens:["access_token"],scopes:"",requiresOpenid:!1};case"oidc":return{...t,name:"OIDC Implicit Flow",shortName:"OIDC Implicit",responseType:"id_token token",tokens:["access_token","id_token"],scopes:"openid",requiresOpenid:!0}}}static getEducationalContent(e){switch(e){case"oauth":return{overview:"The OAuth 2.0 Implicit Grant is designed for public clients (SPAs, mobile apps) that cannot securely store client secrets.",security:"Access tokens are returned directly in the URL fragment, making them vulnerable to interception. Always use HTTPS.",tokens:"Only returns an access token. No refresh token is provided."};case"oidc":return{overview:"The OIDC Implicit Flow extends OAuth 2.0 with identity information, providing both access tokens and ID tokens.",security:"ID tokens contain user identity claims. Access tokens are still vulnerable in URL fragments.",tokens:"Returns both access token and ID token. The ID token contains verified user identity claims."}}}static getFlowDiagram(e){const t=["1. User initiates login","2. Client redirects to authorization server","3. User authenticates and authorizes"];switch(e){case"oauth":return[...t,"4. Server redirects with access_token in fragment","5. Client extracts token from URL"];case"oidc":return[...t,"4. Server redirects with access_token and id_token in fragment","5. Client extracts tokens and validates ID token"]}}static getRequirements(e){const t=["HTTPS redirect URI","Public client (no client secret)","Browser-based application"];switch(e){case"oauth":return[...t,"response_type=token"];case"oidc":return[...t,"response_type=id_token token","openid scope required"]}}static getTokenHandlers(e){switch(e){case"oauth":return{expectedTokens:["access_token"],validationChecks:["token_type","expires_in","scope"],displayFormat:"Access token only"};case"oidc":return{expectedTokens:["access_token","id_token"],validationChecks:["token_type","expires_in","scope","id_token validation"],displayFormat:"Access token + ID token"}}}static getSummaryContent(e){switch(e){case"oauth":return{title:"OAuth 2.0 Implicit Flow Complete",description:"Successfully obtained an access token for API authorization.",nextSteps:["Use access token to call protected APIs","Store token securely (sessionStorage, not localStorage)","Handle token expiration appropriately"]};case"oidc":return{title:"OIDC Implicit Flow Complete",description:"Successfully obtained access token and ID token for authorization and identity.",nextSteps:["Validate ID token signature and claims","Use access token to call protected APIs","Extract user identity from ID token","Store tokens securely"]}}}static getSessionHelpers(e){return{setActiveFlow:()=>oe.setActiveFlow(e,"v7"),isActiveFlow:()=>oe.getActiveFlow("v7")===e,clearFlow:()=>oe.clearAllFlowFlags()}}}const ce={SessionStorage:oe,CollapsibleSections:class{static getDefaultState(){return{overview:!1,flowDiagram:!0,authRequestOverview:!1,authRequestDetails:!0,responseMode:!0,tokenResponseOverview:!1,tokenResponseDetails:!0,tokenResponse:!1,introspectionOverview:!0,introspectionDetails:!1,apiCallDisplay:!0,securityOverview:!0,securityBestPractices:!0,flowSummary:!1,flowComparison:!0,completionOverview:!0,completionDetails:!0}}static createToggleHandler(e){return t=>{e(e=>({...e,[t]:!e[t]}))}}static expandSections(e,t){t(t=>{const n={...t};return e.forEach(e=>{n[e]=!1}),n})}static collapseSections(e,t){t(t=>{const n={...t};return e.forEach(e=>{n[e]=!0}),n})}}},le=e=>{if(e.authorizationEndpoint)return e.authorizationEndpoint;if(e.environmentId){return`https://${{us:"auth.pingone.com",eu:"auth.pingone.eu",ap:"auth.pingone.asia",ca:"auth.pingone.ca",na:"auth.pingone.com"}[e.region||"us"]||"auth.pingone.com"}/${e.environmentId}/as/authorize`}return""},de="https://localhost:3000/implicit-callback",pe=(e,t)=>{if("undefined"==typeof window)return{environmentId:"",clientId:"",clientSecret:"",redirectUri:de,postLogoutRedirectUri:"https://localhost:3000/implicit-logout-callback",scope:"openid",scopes:"openid",responseType:"id_token token",grantType:"",clientAuthMethod:"none"};const n=new URLSearchParams(window.location.search),i=n.get("env"),r=n.get("client"),s=n.get("scope"),o=n.get("redirect"),a=C.loadImplicitFlowCredentials(e),c=a.redirectUri??"";let l=a;if(!l.environmentId||!l.clientId){const e=C.loadConfigCredentials();l={...e,redirectUri:c||e.redirectUri}}if(!l.environmentId||!l.clientId){const e=C.loadPermanentCredentials();l={...e,redirectUri:c||e.redirectUri}}const d=s||(Array.isArray(l.scopes)?l.scopes.join(" "):l.scopes)||"openid",p="implicit-v7"===t?de:A(t||"implicit"),h=e=>{if("string"!=typeof e)return;const t=e.trim();return t.length>0?t:void 0},u=h(c)??h(l.redirectUri);let m=o||u||p;if("implicit-v7"===t&&!o){const t=m;if(t!==de){C.saveImplicitFlowCredentials({redirectUri:t},e)}m=de}const x={us:"auth.pingone.com",eu:"auth.pingone.eu",ap:"auth.pingone.asia",ca:"auth.pingone.ca",na:"auth.pingone.com"}[l.region||"us"]||"auth.pingone.com";return{environmentId:i||l.environmentId||"",clientId:r||l.clientId||"",clientSecret:"",redirectUri:m,scope:d,scopes:d,responseType:"oidc"===e?"id_token token":"token",grantType:"",region:l.region||"us",issuerUrl:l.environmentId?`https://${x}/${l.environmentId}`:"",authorizationEndpoint:le({environmentId:i||l.environmentId||"",authorizationEndpoint:l.authEndpoint,region:l.region}),userInfoEndpoint:l.userInfoEndpoint||(l.environmentId?`https://${x}/${l.environmentId}/as/userinfo`:""),clientAuthMethod:"none",loginHint:l.loginHint||""}},he=e=>{if("undefined"==typeof window)return{};const t=sessionStorage.getItem(e);return t&&R(t,1e5)||{}},ue=(t={})=>{const n=t.flowKey??"implicit-v7",i=`${n}`,r=`${i}-step-results`,s=`${i}-config`,[o,a]=e.useState(t.defaultFlowVariant??"oidc"),[c,l]=e.useState(()=>pe(t.defaultFlowVariant??"oidc",n)),[d,p]=e.useState(()=>(e=>{if("undefined"==typeof window)return{responseType:"id_token token",scopes:["openid"],state:"",nonce:"",pkce:!1,maxAge:0,prompt:"",loginHint:"",acrValues:[],customParams:{}};try{const t=sessionStorage.getItem(e);if(t)return{responseType:"id_token token",scopes:["openid"],state:"",nonce:"",pkce:!1,maxAge:0,prompt:"",loginHint:"",acrValues:[],customParams:{},...JSON.parse(t)}}catch(t){}return{responseType:"id_token token",scopes:["openid"],state:"",nonce:"",pkce:!1,maxAge:0,prompt:"",loginHint:"",acrValues:[],customParams:{}}})(s,t.defaultFlowVariant)),[h,u]=e.useState(()=>sessionStorage.getItem(`${n}-nonce`)||""),[m,x]=e.useState(()=>sessionStorage.getItem(`${n}-state`)||"");e.useEffect(()=>{h&&sessionStorage.setItem(`${n}-nonce`,h)},[h,n]),e.useEffect(()=>{m&&sessionStorage.setItem(`${n}-state`,m)},[m,n]);const[g,f]=e.useState(""),[v,k]=e.useState(!1),[A,R]=e.useState(!1),[U,T]=e.useState(null),[F,z]=e.useState(null),[O,$]=e.useState(!1),[D,E]=e.useState(!1),[_,L]=e.useState(!1),[P,M]=e.useState(!1),[N,H]=e.useState(null),q=e.useRef(null),V=e.useRef(null);B();const K=I({flowType:"implicit",persistKey:n,defaultStep:0,enableAutoAdvance:!1}),J=e.useCallback((e,t)=>{const n=he(r);n[e]=t,sessionStorage.setItem(r,JSON.stringify(n))},[r]),W=e.useCallback(e=>!!he(r)[e],[r]),Y=e.useCallback(()=>{sessionStorage.removeItem(r)},[r]),G=e.useCallback(e=>{p(e),sessionStorage.setItem(s,JSON.stringify(e))},[s]);e.useEffect(()=>{if(t.enableDebugger){y.startSession("implicit");return()=>{y.endSession()}}},[t.enableDebugger]);const Q=e.useCallback(()=>{const e=Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15);return u(e),J("generate-nonce",{nonce:e,timestamp:Date.now()}),e},[J]),X=e.useCallback(()=>{const e=Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15);return x(e),J("generate-state",{state:e,timestamp:Date.now()}),e},[J]),Z=e.useCallback(async()=>{const e=le(c);if(!e)return void j("Authorization endpoint not configured. Please configure your environment ID");const t=h||Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15),i=m||Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15);h||u(t),m||x(i);const r=new URLSearchParams;r.set("client_id",c.clientId),r.set("redirect_uri",c.redirectUri),r.set("response_type",c.responseType||("oidc"===o?"id_token token":"token")),r.set("scope",c.scope||c.scopes||"openid profile email"),r.set("state",i),("oidc"===o||c.responseType?.includes("id_token"))&&r.set("nonce",t),r.set("response_mode",c.responseMode||"fragment"),d.maxAge&&d.maxAge>0&&r.set("max_age",d.maxAge.toString()),d.prompt&&r.set("prompt",d.prompt),c.loginHint&&r.set("login_hint",c.loginHint),d.acrValues&&d.acrValues.length>0&&r.set("acr_values",d.acrValues.join(" "));const s=`${e}?${r.toString()}`;f(s),sessionStorage.setItem(`${n}-oauth-state`,i),sessionStorage.setItem(`${n}-oauth-nonce`,t),J("generate-auth-url",{url:s,state:i,nonce:t,timestamp:Date.now()})},[c,o,d,h,m,n,J]),ee=e.useCallback(()=>{},[]),te=e.useCallback(()=>{g?!V.current||V.current.closed?(R(!0),V.current=window.open(g,"oauth-popup","width=600,height=700"),J("user-authorization",{method:"popup",timestamp:Date.now()})):V.current.focus():j("Authorization URL missing. Generate the authorization URL before starting the flow.")},[g,J]),ne=e.useCallback(()=>{if(g){if(sessionStorage.setItem("flowContext",JSON.stringify({flow:n,returnPath:window.location.pathname,timestamp:Date.now()})),n.includes("implicit-v7"))ce.SessionStorage.setActiveFlow(o,"v7");else if(n.includes("implicit-v6")){const e="oidc"===o?"oidc-implicit-v6-flow-active":"oauth-implicit-v6-flow-active";sessionStorage.setItem(e,"true")}J("user-authorization",{method:"redirect",timestamp:Date.now()}),window.location.href=g}else j("Authorization URL missing. Generate the authorization URL before starting the flow.")},[g,n,o,J]),ie=e.useCallback(e=>{try{const t=new URLSearchParams(e.replace("#","")),n={access_token:t.get("access_token")||""},i=t.get("id_token");null!==i&&(n.id_token=i);const r=t.get("token_type");null!==r&&(n.token_type=r);const s=t.get("expires_in");null!==s&&(n.expires_in=parseInt(s,10));const a=t.get("scope");null!==a&&(n.scope=a),T(n),b({...n,token_type:n.token_type||"Bearer"}),J("receive-tokens",{...n,timestamp:Date.now()}),S("Implicit Flow",!0,("oidc"===o?"OIDC":"OAuth")+" Implicit - Tokens received")}catch(t){j("Failed to parse tokens from URL",{description:t instanceof Error?t.message:"Unknown error"})}},[o,J]),re=e.useCallback(async()=>{if(U?.access_token){$(!0),y.logStep("fetch-userinfo","Fetching user information","executing");try{let e=c.userInfoEndpoint;if(!e&&c.environmentId){e=`https://${{us:"auth.pingone.com",eu:"auth.pingone.eu",ap:"auth.pingone.asia",ca:"auth.pingone.ca",na:"auth.pingone.com"}[c.region||"us"]||"auth.pingone.com"}/${c.environmentId}/as/userinfo`}const t=await fetch(e,{headers:{Authorization:`Bearer ${U.access_token}`}});if(!t.ok){const e=await t.json().catch(()=>({}));throw new Error(e.error_description||e.error||`UserInfo request failed: ${t.status}`)}const n=await t.json();z(n),J("fetch-userinfo",n),S("UserInfo",!0,"User information fetched successfully")}catch(e){y.logError("fetch-userinfo",e);const t=e instanceof Error?e.message:"Failed to fetch user information";j("UserInfo request failed",{description:t}),S("UserInfo",!1,t)}finally{$(!1)}}else j("No access token. Receive tokens first")},[U,c,J]),se=e.useCallback(async()=>{E(!0);try{if(!c.environmentId&&!c.clientId)return void E(!1);!c.environmentId||c.clientId;const e="string"==typeof c.scopes&&c.scopes.trim()?c.scopes.split(" ").filter(Boolean):Array.isArray(c.scopes)&&c.scopes.length>0?c.scopes:"string"==typeof c.scope&&c.scope.trim()?c.scope.split(" ").filter(Boolean):["openid"],t={...c,scopes:e,scope:c.scope||e.join(" "),environmentId:c.environmentId,clientId:c.clientId,redirectUri:c.redirectUri,responseType:c.responseType,clientAuthMethod:c.clientAuthMethod||"none"};if(!(await C.saveImplicitFlowCredentials(t,o)))throw new Error("Failed to save implicit flow credentials");const n={environmentId:c.environmentId,clientId:c.clientId,redirectUri:c.redirectUri,scopes:e};c.clientSecret&&(n.clientSecret=c.clientSecret),c.authorizationEndpoint&&(n.authEndpoint=c.authorizationEndpoint),c.tokenEndpoint&&(n.tokenEndpoint=c.tokenEndpoint),c.userInfoEndpoint&&(n.userInfoEndpoint=c.userInfoEndpoint),(c.tokenEndpointAuthMethod||c.authMethod?.value)&&(n.tokenAuthMethod=c.tokenEndpointAuthMethod||c.authMethod?.value),C.saveAuthzFlowCredentials(n),L(!0),M(!1),q.current={...c},C.clearCache(),window.dispatchEvent(new CustomEvent("pingone-config-changed")),window.dispatchEvent(new CustomEvent("permanent-credentials-changed")),window.dispatchEvent(new CustomEvent("implicit-flow-credentials-changed")),J("save-credentials",{...c,timestamp:Date.now()})}catch(e){throw e}finally{E(!1)}},[c,J,o]),oe=e.useCallback((e,t)=>{navigator.clipboard.writeText(e),H(t),setTimeout(()=>H(null),2e3),w(`${t} copied to clipboard!`)},[]),ae=e.useCallback(()=>{f(""),T(null),z(null),u(""),x(""),k(!1),ee(),Y(),J("reset-flow",{timestamp:Date.now()})},[Y,J,ee]);e.useEffect(()=>{if(!q.current)return void(q.current=c);const e=JSON.stringify(c)!==JSON.stringify(q.current);M(e)},[c]),e.useEffect(()=>{try{const e=C.loadImplicitFlowCredentials(o);e.environmentId&&e.clientId&&L(!0)}catch(e){L(!1)}},[o]);const de=e.useCallback(e=>{l(e)},[]),ue=e.useMemo(()=>c,[c.environmentId,c.clientId,c.clientSecret,c.redirectUri,c.scope,c.scopes,c.responseType,c.grantType,c.clientAuthMethod,c.loginHint,c.authorizationEndpoint,c.tokenEndpoint,c.userInfoEndpoint,c]);return e.useMemo(()=>({flowVariant:o,setFlowVariant:a,persistKey:i,credentials:ue,setCredentials:de,setFlowConfig:p,flowConfig:d,handleFlowConfigChange:G,nonce:h,state:m,generateNonce:Q,generateState:X,authUrl:g,generateAuthorizationUrl:Z,showUrlExplainer:v,setShowUrlExplainer:k,isAuthorizing:A,handlePopupAuthorization:te,handleRedirectAuthorization:ne,resetFlow:ae,tokens:U,setTokensFromFragment:ie,userInfo:F,isFetchingUserInfo:O,fetchUserInfo:re,isSavingCredentials:D,hasCredentialsSaved:_,hasUnsavedCredentialChanges:P,saveCredentials:se,handleCopy:oe,copiedField:N,stepManager:K,saveStepResult:J,hasStepResult:W,clearStepResults:Y}),[o,i,ue,de,d,G,h,m,Q,X,g,Z,v,A,te,ne,ae,U,ie,F,O,re,D,_,P,se,oe,N,K,J,W,Y])},me=O.div`
	background: white;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	margin-bottom: 1rem;
	overflow: hidden;
`,xe=O.button`
	width: 100%;
	padding: 1rem 1.5rem;
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	color: white;
	border: none;
	cursor: pointer;
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #15803d 0%, #166534 100%);
	}
`,ge=O.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,fe=O.div`
	transform: ${e=>e.$collapsed?"rotate(-90deg)":"rotate(0deg)"};
	transition: transform 0.2s ease;
`,ve=O.div`
	padding: 1.5rem;
`,je=O.div`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1rem;
	border-radius: 8px;
	margin-bottom: 1rem;
	background: ${e=>{switch(e.$variant){case"success":return"#f0fdf4";case"info":return"#f0f9ff";case"warning":return"#fffbeb";case"error":return"#fef2f2";default:return"#f8fafc"}}};
	border: 1px solid ${e=>{switch(e.$variant){case"success":return"#bbf7d0";case"info":return"#bae6fd";case"warning":return"#fed7aa";case"error":return"#fecaca";default:return"#e2e8f0"}}};
`,we=O.h4`
	margin: 0 0 0.5rem 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: ${e=>e.theme?.colors?.success||"#15803d"};
`,ke=O.p`
	margin: 0;
	color: #374151;
	line-height: 1.5;
`,Ie=O.div`
	margin-top: 1.5rem;
`,ye=O.h4`
	margin: 0 0 1rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,be=O.div`
	background-color: #f8fafc;
	padding: 1.5rem;
	border-radius: 0.5rem;
	border: 1px solid #e2e8f0;
`,Se=O.ul`
	margin: 0;
	padding-left: 1.5rem;
	line-height: 2;
`,Ce=O.li`
	color: #374151;
`,Ae=O.ul`
	margin-top: 0.75rem;
	padding-left: 1.5rem;
	line-height: 1.8;
`,Re=O.li`
	color: #6b7280;
`,Ue=O.div`
	display: flex;
	gap: 1rem;
	margin-top: 1.5rem;
`,Te=O.button`
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	border: none;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;
	background: ${e=>{switch(e.$variant){case"danger":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";case"secondary":return"linear-gradient(135deg, #6b7280 0%, #4b5563 100%)";default:return"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"}}};
	color: white;

	&:hover {
		background: ${e=>{switch(e.$variant){case"danger":return"linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)";case"secondary":return"linear-gradient(135deg, #4b5563 0%, #374151 100%)";default:return"linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"}}};
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
`,Fe=({config:e,collapsed:o=!1,onToggleCollapsed:a})=>{const{flowName:c,flowDescription:l,completedSteps:d,nextSteps:p,onStartNewFlow:h,showUserInfo:u=!1,showIntrospection:m=!1,userInfo:x,introspectionResult:g}=e;return t.jsxs(me,{children:[t.jsxs(xe,{onClick:a,children:[t.jsxs(ge,{children:[t.jsx(n,{})," Flow Complete"]}),t.jsx(fe,{$collapsed:o,children:t.jsx(i,{})})]}),!o&&t.jsxs(ve,{children:[t.jsxs(je,{$variant:"success",children:[t.jsx(n,{size:24}),t.jsxs("div",{children:[t.jsxs(we,{children:[c," Complete!"]}),t.jsx(ke,{children:l})]})]}),t.jsxs(Ie,{children:[t.jsxs(ye,{children:[t.jsx(i,{})," Summary"]}),t.jsx(be,{children:t.jsxs(Se,{children:[d.map((e,n)=>t.jsxs(Ce,{children:[e.completed?"✅":"⏳"," ",e.description]},n)),u&&x&&t.jsx(Ce,{children:"✅ User information retrieved"}),m&&g&&t.jsx(Ce,{children:"✅ Token introspected and validated"})]})})]}),t.jsxs(Ie,{children:[t.jsxs(ye,{children:[t.jsx(r,{})," Next Steps"]}),t.jsx(ke,{children:"In a production application, you would:"}),t.jsx(Ae,{children:p.map((e,n)=>t.jsx(Re,{children:e},n))})]}),t.jsx(Ue,{children:t.jsxs(Te,{onClick:h,$variant:"danger",children:[t.jsx(s,{})," Start New Flow"]})})]})]})},ze={authorizationCode:{flowName:"Authorization Code Flow",flowDescription:"You've successfully completed the OAuth 2.0 Authorization Code flow with PKCE. The authorization code has been exchanged for tokens.",completedSteps:[{completed:!0,description:"Authorization URL generated"},{completed:!0,description:"User redirected to authorization server"},{completed:!0,description:"User authorized the application"},{completed:!0,description:"Authorization code received"},{completed:!0,description:"Code exchanged for access token"}],nextSteps:["Store the access token securely","Use the access token to call protected APIs","Refresh the token when it expires (if refresh token provided)","Handle token expiration and re-authorization","Implement proper error handling and retry logic"]},implicit:{flowName:"Implicit Flow",flowDescription:"You've successfully completed the OAuth 2.0 Implicit flow. The access token has been received directly from the authorization server.",completedSteps:[{completed:!0,description:"Authorization URL generated"},{completed:!0,description:"User redirected to authorization server"},{completed:!0,description:"User authorized the application"},{completed:!0,description:"Access token received via URL fragment"}],nextSteps:["Store the access token securely","Use the access token to call protected APIs","Handle token expiration and re-authorization","Implement proper error handling and retry logic"]},jwtBearer:{flowName:"JWT Bearer Token Flow",flowDescription:"You've successfully completed the OAuth 2.0 JWT Bearer Token flow (RFC 7523). A JWT assertion has been exchanged for an access token.",completedSteps:[{completed:!0,description:"JWT claims configured"},{completed:!0,description:"JWT signed with private key"},{completed:!0,description:"JWT assertion generated"},{completed:!0,description:"JWT exchanged for access token"}],nextSteps:["Store the access token securely","Use the access token to call protected APIs","Refresh the token when it expires (if supported)","Implement proper JWT generation and signing","Implement proper error handling and retry logic"]},hybrid:{flowName:"OIDC Hybrid Flow",flowDescription:"You've successfully completed the OpenID Connect Hybrid flow. The authorization code and ID token have been received.",completedSteps:[{completed:!0,description:"Authorization URL generated"},{completed:!0,description:"User redirected to authorization server"},{completed:!0,description:"User authorized the application"},{completed:!0,description:"Authorization code and ID token received"},{completed:!0,description:"Code exchanged for additional tokens"}],nextSteps:["Store the access token and ID token securely","Use the access token to call protected APIs","Validate the ID token signature and claims","Refresh the token when it expires (if refresh token provided)","Handle token expiration and re-authorization","Implement proper error handling and retry logic"]},rar:{flowName:"RAR Flow (V7) - Rich Authorization Requests",flowDescription:"You've successfully completed the RAR (Rich Authorization Requests) flow with fine-grained authorization details. The authorization request included structured JSON parameters for precise permission specifications.",completedSteps:[{completed:!0,description:"RAR authorization details configured"},{completed:!0,description:"Authorization URL generated with RAR parameters"},{completed:!0,description:"User authorized with detailed permission context"},{completed:!0,description:"Authorization code received with RAR context"},{completed:!0,description:"Tokens exchanged maintaining RAR authorization details"}],nextSteps:["Store the access token securely with RAR context","Use the token to call APIs with fine-grained permissions","Validate that the token includes the approved authorization details","Implement proper RAR parameter validation in your application","Handle token expiration and re-authorization with RAR context","Consider implementing RAR for other OAuth flows in your system"]}},{Container:Oe,ContentWrapper:$e,MainCard:De,StepHeader:Ee,StepHeaderLeft:_e,VersionBadge:Le,StepHeaderTitle:Pe,StepHeaderSubtitle:Me,StepHeaderRight:Ne,StepNumber:He,StepTotal:qe,StepContentWrapper:Ve,CollapsibleSection:Be,CollapsibleHeaderButton:Ke,CollapsibleTitle:Je,CollapsibleContent:We,InfoBox:Ye,InfoTitle:Ge,InfoText:Qe,InfoList:Xe,StrongText:Ze,ActionRow:et,Button:tt,HighlightedActionButton:nt,CodeBlock:it,GeneratedContentBox:rt,GeneratedLabel:st,ParameterGrid:ot,ParameterLabel:at,ParameterValue:ct,FlowDiagram:lt,FlowStep:dt,FlowStepNumber:pt,FlowStepContent:ht,SectionDivider:ut,ResultsSection:mt,ResultsHeading:xt,HelperText:gt,ExplanationSection:ft,ExplanationHeading:vt,NextSteps:jt,HighlightBadge:wt}=G.getFlowUIComponents(),kt=O(Ee)`
	background: ${e=>"oidc"===e.$variant?"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)":"linear-gradient(135deg, #16a34a 0%, #15803d 100%)"};
	color: #ffffff;
`,It=O(Pe)`
	color: #ffffff;
`,yt=O(He)`
	color: #ffffff;
`,bt=O(Le)`
	background: ${e=>"oidc"===e.$variant?"rgba(59, 130, 246, 0.2)":"rgba(22, 163, 74, 0.2)"};
	border: 1px solid ${e=>"oidc"===e.$variant?"#60a5fa":"#4ade80"};
	color: ${e=>"oidc"===e.$variant?"#dbeafe":"#bbf7d0"};
`,St=O.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: #3b82f6;
	color: white;
	box-shadow: 0 6px 16px #3b82f633;
	transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
	transform: ${({$collapsed:e})=>e?"rotate(0deg)":"rotate(180deg)"};

	svg {
		width: 16px;
		height: 16px;
	}
`,Ct=O.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	padding: 1.5rem;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	border-radius: 0.75rem;
	border: 1px solid #cbd5e1;
`,At=O.button`
	flex: 1;
	padding: 1rem;
	border-radius: 0.5rem;
	border: 2px solid ${e=>e.$selected?"#3b82f6":"#cbd5e1"};
	background: ${e=>e.$selected?"#dbeafe":"white"};
	color: ${e=>e.$selected?"#1e40af":"#475569"};
	font-weight: ${e=>e.$selected?"600":"500"};
	transition: all 0.2s ease;

	&:hover {
		border-color: #3b82f6;
		background: #dbeafe;
	}
`,Rt=O.div`
	font-size: 1.1rem;
	margin-bottom: 0.25rem;
`,Ut=O.div`
	font-size: 0.875rem;
	opacity: 0.8;
`,Tt=()=>{const r=o(),[s,m]=e.useState((()=>{const e=new URLSearchParams(r.search).get("variant");if("oidc"===e||"oauth"===e)return e;const t=r.state;return"oidc"===t?.fromSection?"oidc":"oauth"})()),[x,g]=e.useState(""),f=ue({flowKey:"implicit-v7",defaultFlowVariant:s,enableDebugger:!0}),[v,j]=e.useState(()=>f.credentials||{environmentId:"",clientId:"",clientSecret:"",redirectUri:"https://localhost:3000/implicit-callback",scope:"oidc"===s?"openid profile email":"",scopes:"oidc"===s?"openid profile email":"",responseType:"oidc"===s?"id_token token":"token",grantType:"",clientAuthMethod:"none"}),[w,I]=e.useState(0),[y,b]=e.useState(null),[S,C]=e.useState(ce.CollapsibleSections.getDefaultState);e.useEffect(()=>{const e=r.state?.workerToken;if(e)return void g(e);const t=localStorage.getItem("worker-token"),n=localStorage.getItem("worker-token-env");t&&n&&g(t)},[r.state]),e.useEffect(()=>{const e=window.location.hash;e?.includes("access_token")&&!f.tokens&&(f.setTokensFromFragment(e),window.history.replaceState({},"",window.location.pathname))},[f.tokens,f.setTokensFromFragment]),e.useEffect(()=>{f.tokens&&w<2&&I(2)},[f.tokens,w]),e.useEffect(()=>{!f.credentials||f.credentials.environmentId===v.environmentId&&f.credentials.clientId===v.clientId&&f.credentials.redirectUri===v.redirectUri&&f.credentials.scope===v.scope&&f.credentials.scopes===v.scopes||j(f.credentials)},[f.credentials,v]),e.useEffect(()=>{(async()=>{try{const e=J.loadFlowDataComprehensive({flowKey:"implicit-flow-v7",useSharedEnvironment:!0,useSharedDiscovery:!0});if(e.flowCredentials&&Object.keys(e.flowCredentials).length>0){const t={environmentId:e.sharedEnvironment?.environmentId||"",clientId:e.flowCredentials.clientId,clientSecret:e.flowCredentials.clientSecret,redirectUri:e.flowCredentials.redirectUri,scopes:e.flowCredentials.scopes};j(t),f.setCredentials(t)}else if(e.sharedEnvironment?.environmentId){const t={...f.credentials,environmentId:e.sharedEnvironment.environmentId};j(t),f.setCredentials(t)}else{const e=pe(s,"implicit-flow-v7");j(e),f.setCredentials(e)}}catch(e){const t=pe(s,"implicit-v7");j(t),f.setCredentials(t)}})()},[s,f.credentials,f.setCredentials]),e.useEffect(()=>{f.setFlowVariant(s),ae.getSessionHelpers(s).setActiveFlow();const e=pe(s,"implicit-v7");f.setCredentials(e),j(e)},[s,f.setFlowVariant,f.setCredentials]),e.useEffect(()=>{const e=ae.getFlowMetadata(s);j(t=>({...t,scope:e.scopes||t.scope||"",scopes:e.scopes||t.scopes||"",responseType:e.responseType}))},[s]),e.useEffect(()=>{if(f.credentials&&(f.credentials.environmentId||f.credentials.clientId)){J.saveFlowDataComprehensive("implicit-flow-v7",{sharedEnvironment:f.credentials.environmentId?{environmentId:f.credentials.environmentId,region:"us",issuerUrl:`https://auth.pingone.com/${f.credentials.environmentId}`}:void 0,flowCredentials:{clientId:f.credentials.clientId,clientSecret:f.credentials.clientSecret,redirectUri:f.credentials.redirectUri,scopes:f.credentials.scopes,logoutUrl:f.credentials.logoutUrl,loginHint:f.credentials.loginHint,tokenEndpointAuthMethod:"client_secret_basic",lastUpdated:Date.now()}})}},[f.credentials]);const{clearBackup:A}=V({flowKey:"implicit-v7",credentials:f.credentials,setCredentials:f.setCredentials,enabled:!0});K({pageName:"Implicit Flow V7",force:!0}),e.useEffect(()=>{U(v,{flowName:`${s.toUpperCase()} Implicit Flow`,requiredFields:["environmentId","clientId"],showToast:!0})},[v,s.toUpperCase]);const R=ce.CollapsibleSections.createToggleHandler(C),O=e.useCallback(e=>{m(e),I(0),f.resetFlow(),j(t=>({...t,scope:"oidc"===e?"openid profile email":"openid",scopes:"oidc"===e?"openid profile email":"openid",responseType:"oidc"===e?"id_token token":"token"})),T.showSuccess(`Switched to ${e.toUpperCase()} Implicit Flow variant`)},[f]),B=()=>{const e=ae.getFlowMetadata(s),n=ae.getEducationalContent(s),r=ae.getFlowDiagram(s);return t.jsxs(t.Fragment,{children:[t.jsxs(Be,{children:[t.jsxs(Ke,{onClick:()=>R("overview"),"aria-expanded":!S.overview,children:[t.jsxs(Je,{children:[t.jsx(i,{})," ",e.name]}),t.jsx(St,{$collapsed:S.overview,children:t.jsx(a,{})})]}),!S.overview&&t.jsxs(We,{children:[t.jsxs(Ye,{$variant:"info",children:[t.jsx(i,{size:20}),t.jsxs("div",{children:[t.jsxs(Ge,{children:[e.shortName," Flow Overview"]}),t.jsx(Qe,{children:n.overview})]})]}),t.jsxs(Ye,{$variant:"warning",children:[t.jsx(d,{size:20}),t.jsxs("div",{children:[t.jsx(Ge,{children:"Security Considerations"}),t.jsx(Qe,{children:n.security})]})]}),t.jsxs(rt,{children:[t.jsx(st,{children:"Flow Specifications"}),t.jsxs(ot,{children:[t.jsxs("div",{children:[t.jsx(at,{children:"Response Type"}),t.jsx(ct,{children:e.responseType})]}),t.jsxs("div",{children:[t.jsx(at,{children:"Tokens"}),t.jsx(ct,{children:e.tokens.join(" + ")})]}),t.jsxs("div",{children:[t.jsx(at,{children:"Security"}),t.jsx(ct,{children:"Implicit Grant (Legacy)"})]})]})]}),t.jsx(lt,{children:r.map((e,n)=>t.jsxs(dt,{children:[t.jsx(pt,{children:n+1}),t.jsx(ht,{children:t.jsx(Ze,{children:e})})]},e))})]})]}),t.jsx(W,{flowType:`implicit-${s}-v7`,environmentId:v.environmentId||"",clientId:v.clientId||"",clientSecret:v.clientSecret||"",redirectUri:v.redirectUri,scopes:v.scope||v.scopes||"",loginHint:v.loginHint||"",postLogoutRedirectUri:v.postLogoutRedirectUri||"https://localhost:3000/logout-callback",onEnvironmentIdChange:e=>{const t={...v,environmentId:e};j(t),f.setCredentials(t)},onClientIdChange:e=>{const t={...v,clientId:e};j(t),f.setCredentials(t)},onClientSecretChange:e=>{const t={...v,clientSecret:e};j(t),f.setCredentials(t)},onRedirectUriChange:e=>{const t={...v,redirectUri:e};j(t),f.setCredentials(t),J.saveFlowDataComprehensive("implicit-flow-v7",{flowCredentials:{clientId:t.clientId,clientSecret:t.clientSecret,redirectUri:t.redirectUri,scopes:t.scopes,lastUpdated:Date.now()}}),f.saveCredentials().then(()=>{}).catch(e=>{})},onScopesChange:e=>{const t=e.split(/\s+/).filter(e=>e.trim());let n=e;t.includes("offline_access")&&(n=t.filter(e=>"offline_access"!==e).join(" "),T.showWarning("offline_access removed - Implicit Flow never provides refresh tokens",{description:"Use Authorization Code flow if you need refresh tokens for offline access.",duration:5e3}));const i={...v,scope:n,scopes:n};j(i),f.setCredentials(i)},onLoginHintChange:e=>{const t={...v,loginHint:e};j(t),f.setCredentials(t)},onSave:async()=>{try{if(!J.saveFlowDataComprehensive("implicit-flow-v7",{sharedEnvironment:v.environmentId?{environmentId:v.environmentId,region:"us",issuerUrl:`https://auth.pingone.com/${v.environmentId}`}:void 0,flowCredentials:{clientId:v.clientId,clientSecret:v.clientSecret,redirectUri:v.redirectUri,scopes:v.scopes,logoutUrl:v.logoutUrl,loginHint:v.loginHint,tokenEndpointAuthMethod:"client_secret_basic",lastUpdated:Date.now()}}))throw new Error("Failed to save credentials to comprehensive service");await f.saveCredentials(),T.showSuccess("Credentials saved successfully!"),b(null)}catch(e){const t=Y.parseOAuthError(e,{flowType:"implicit",stepId:"save-credentials",operation:"saveCredentials",credentials:{hasClientId:!!v.clientId,hasClientSecret:!!v.clientSecret,hasEnvironmentId:!!v.environmentId,hasRedirectUri:!!v.redirectUri,hasScope:!!v.scope},metadata:{flowVariant:s,clientAuthMethod:v.clientAuthMethod}});T.showError(t.message),b(t)}},onDiscoveryComplete:e=>{if(e.issuerUrl){const t=z.extractEnvironmentId(e.issuerUrl);if(t){const e={...v,environmentId:t};j(e)}}},requireClientSecret:!1,showAdvancedConfig:!1,defaultCollapsed:!1,onCreateApplication:async e=>{try{const{pingOneAppCreationService:t}=await F(async()=>{const{pingOneAppCreationService:e}=await import("./components-credentials-T7jmF3zx.js").then(e=>e.y);return{pingOneAppCreationService:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]));t.initialize(x,v.environmentId||"");const n=e=>{let t=e.replace(/[-_]/g,"-").toLowerCase();t.includes("implicit")?t="implicit":t.includes("authorization-code")?t="authorization-code":t.includes("device-authorization")?t="device-authorization":t.includes("client-credentials")?t="client-credentials":t.includes("hybrid")&&(t="hybrid");return`https://localhost:3000/callback/${t}-${Math.floor(900*Math.random())+100}`},i=(e=>{let t=e.replace(/[-_]/g,"-").toLowerCase();t.includes("implicit")?t="implicit":t.includes("authorization-code")?t="authorization-code":t.includes("device-authorization")?t="device-authorization":t.includes("client-credentials")?t="client-credentials":t.includes("hybrid")&&(t="hybrid");return`pingone-${t}-${Math.floor(900*Math.random())+100}`})("implicit"),r=n("implicit"),s=await t.createSinglePageApp({name:e?.name||i,description:e?.description||"Created via OAuth Playground - Implicit Flow",enabled:!0,type:"SINGLE_PAGE_APP",redirectUris:[r],grantTypes:["authorization_code","implicit"],responseTypes:["code","token","id_token"],tokenEndpointAuthMethod:"none",pkceEnforcement:"REQUIRED",scopes:v.scope?.split(" ")||["openid","profile","email"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:2592e3,idTokenValiditySeconds:3600});if(s.success&&s.app){const e={...v,clientId:s.app.clientId,clientSecret:s.app.clientSecret||v.clientSecret,redirectUri:r};j(e),f.setCredentials(e),await f.saveCredentials(),T.showSuccess(`Application "${s.app.name}" created successfully! Credentials updated and saved.`)}else T.showError(`Failed to create application: ${s.error}`)}catch(t){T.showError(`Failed to create application: ${t instanceof Error?t.message:"Unknown error"}`)}},showConfigChecker:!1,workerToken:x,region:"NA"})]})},G=e.useMemo(()=>{const e=f.tokens;switch(w){case 0:return B();case 1:return t.jsxs(t.Fragment,{children:[t.jsxs(Be,{children:[t.jsxs(Ke,{onClick:()=>R("authRequestOverview"),"aria-expanded":!S.authRequestOverview,children:[t.jsxs(Je,{children:[t.jsx(u,{})," Authorization Request Overview"]}),t.jsx(St,{$collapsed:S.authRequestOverview,children:t.jsx(a,{})})]}),!S.authRequestOverview&&t.jsxs(We,{children:[t.jsxs(Ye,{$variant:"info",children:[t.jsx(u,{size:20}),t.jsxs("div",{children:[t.jsxs(Ge,{children:["Building the"," ",t.jsx(D,{variant:"info",title:"Authorization URL",content:"URL where user is redirected to authorize the application",placement:"top",children:"Authorization URL"})]}),t.jsxs(Qe,{children:["The"," ",t.jsx(D,{variant:"info",title:"Authorization URL",content:"URL for user authorization",placement:"top",children:"authorization URL"})," ","includes all"," ",t.jsx(D,{variant:"info",title:"OAuth Parameters",content:"OAuth request parameters like client_id, redirect_uri, scope, state, response_type",placement:"top",children:"OAuth parameters"}),". Unlike"," ",t.jsx(D,{variant:"learning",title:"Authorization Code Flow",content:"Secure OAuth flow using authorization code for token exchange",placement:"top",children:"Authorization Code flow"}),", the"," ",t.jsx(D,{variant:"learning",title:"response_type",content:"OAuth parameter specifying requested tokens. Implicit uses 'token' or 'id_token token'.",placement:"top",children:"response_type"})," ","is"," ",t.jsx(D,{variant:"warning",title:"Implicit response_type",content:"'token' or 'id_token token' - returns tokens directly in URL fragment. DEPRECATED in OAuth 2.1.",placement:"top",children:"'token' or 'id_token token'"}),", telling"," ",t.jsx(D,{variant:"info",title:"PingOne",content:"Identity and access management platform",placement:"top",children:"PingOne"})," ","to return"," ",t.jsx(D,{variant:"security",title:"Tokens in URL",content:"SECURITY RISK: Tokens exposed in browser URL fragment. Deprecated for this reason.",placement:"top",children:"tokens directly"})," ","instead of an"," ",t.jsx(D,{variant:"learning",title:"Authorization Code",content:"Short-lived code exchanged for tokens server-side (safer)",placement:"top",children:"authorization code"}),"."]})]})]}),t.jsxs(Ye,{$variant:"info",children:[t.jsx(i,{size:20}),t.jsxs("div",{children:[t.jsxs(Ge,{children:[t.jsx(D,{variant:"warning",title:"Implicit Flow",content:"OAuth 2.0 flow (RFC 6749 Section 4.2) - DEPRECATED in OAuth 2.1. Tokens returned in URL fragment. Use Authorization Code + PKCE instead.",placement:"top",children:"Implicit Flow"})," ","Specific Parameters"]}),t.jsxs(Xe,{children:[t.jsxs("li",{children:[t.jsxs(Ze,{children:[t.jsx(D,{variant:"learning",title:"response_type",content:"OAuth parameter. Implicit uses 'token' (OAuth) or 'id_token token' (OIDC)",placement:"top",children:"response_type"}),":"]})," ","oidc"===s?"id_token token":"token"," (","oidc"===s?t.jsx(D,{variant:"info",title:"OIDC",content:"OpenID Connect - adds authentication via ID token",placement:"top",children:"OIDC"}):t.jsx(D,{variant:"info",title:"OAuth 2.0",content:"Authorization framework",placement:"top",children:"OAuth"})," ","variant)"]}),t.jsxs("li",{children:[t.jsxs(Ze,{children:[t.jsx(D,{variant:"security",title:"nonce",content:"Number used once - random value for replay protection. Required for OIDC ID tokens.",placement:"top",children:"nonce"}),":"]})," ",t.jsx("span",{style:{color:"oidc"===s?"#059669":"#dc2626"},children:"oidc"===s?"Required":"Not used"})," ","(","oidc"===s?t.jsx(D,{variant:"security",title:"ID Token Protection",content:"Nonce prevents ID token replay attacks",placement:"top",children:"ID token protection"}):"No ID token",")"]}),t.jsxs("li",{children:[t.jsxs(Ze,{children:[t.jsx(D,{variant:"security",title:"state parameter",content:"CSRF protection - random value that must match between request and callback",placement:"top",children:"state"}),":"]})," ",t.jsx(D,{variant:"security",title:"CSRF Protection",content:"Cross-Site Request Forgery protection using state parameter",placement:"top",children:"CSRF protection"})," ","(recommended)"]}),t.jsxs("li",{children:[t.jsxs(Ze,{children:["No"," ",t.jsx(D,{variant:"warning",title:"PKCE",content:"Proof Key for Code Exchange - security extension. Implicit flow doesn't support PKCE because it doesn't use authorization codes.",placement:"top",children:"PKCE"}),":"]})," ","Implicit flow doesn't support"," ",t.jsx(D,{variant:"warning",title:"PKCE",content:"RFC 7636 - not supported in Implicit flow",placement:"top",children:"PKCE"})]}),t.jsxs("li",{children:[t.jsxs(Ze,{children:[t.jsx(D,{variant:"learning",title:"Tokens",content:"Access token and optionally ID token returned in URL fragment",placement:"top",children:"Tokens"}),":"]})," ","oidc"===s?t.jsxs(t.Fragment,{children:[t.jsx(D,{variant:"learning",title:"Access Token",content:"Bearer token for API access",placement:"top",children:"Access Token"})," + ",t.jsx(D,{variant:"learning",title:"ID Token",content:"OIDC JWT with user identity",placement:"top",children:"ID Token"})]}):t.jsx(D,{variant:"learning",title:"Access Token",content:"Bearer token for API access only",placement:"top",children:"Access Token only"})]}),t.jsxs("li",{children:[t.jsxs(Ze,{children:[t.jsx(D,{variant:"learning",title:"Scopes",content:"Permissions requested from user",placement:"top",children:"Scopes"})," ","(PingOne):"]})," ","oidc"===s?t.jsxs(t.Fragment,{children:[t.jsx(D,{variant:"info",title:"openid scope",content:"Required for OIDC flows to receive ID token",placement:"top",children:"openid required"})," ","(OIDC spec)"]}):t.jsxs(t.Fragment,{children:[t.jsx(D,{variant:"info",title:"openid scope",content:"PingOne requires openid scope even for OAuth flows",placement:"top",children:"openid required"})," ","(PingOne-specific) + custom scopes"]})]})]})]})]}),"oidc"===s&&t.jsxs(Ye,{$variant:"warning",children:[t.jsx(d,{size:20}),t.jsxs("div",{children:[t.jsxs(Ge,{children:[t.jsx(D,{variant:"info",title:"OIDC",content:"OpenID Connect - authentication layer on top of OAuth 2.0",placement:"top",children:"OIDC"})," ","Requirements"]}),t.jsxs(Qe,{children:[t.jsx(D,{variant:"warning",title:"OIDC Implicit Flow",content:"OIDC version of deprecated Implicit flow - returns ID token in URL fragment",placement:"top",children:"OIDC Implicit Flow"})," ","requires the"," ",t.jsx(Ze,{children:t.jsx(D,{variant:"info",title:"openid scope",content:"Mandatory scope for OIDC flows to receive ID token",placement:"top",children:'"openid"'})})," ","scope to receive an"," ",t.jsx(D,{variant:"learning",title:"ID Token",content:"OIDC JWT containing user identity information",placement:"top",children:"ID token"}),". Make sure your application is configured with the"," ",t.jsx(D,{variant:"info",title:"openid scope",content:"Required OIDC scope",placement:"top",children:"openid scope"}),"."]})]})]}),t.jsxs(Ye,{$variant:"danger",children:[t.jsx(d,{size:20}),t.jsxs("div",{children:[t.jsx(Ge,{children:"Security Warning"}),t.jsxs(Qe,{children:[t.jsx(Ze,{children:t.jsx(D,{variant:"warning",title:"Implicit Flow Deprecation",content:"Removed from OAuth 2.1 (RFC 9207). Was part of OAuth 2.0 (RFC 6749 Section 4.2) but deprecated for security reasons.",placement:"top",children:"Implicit Flow is deprecated"})})," ","and should not be used in production.",t.jsx(D,{variant:"security",title:"Token Exposure",content:"Tokens in URL fragment are visible in browser history, logs, and can be intercepted by malicious scripts",placement:"top",children:"Tokens are exposed in the URL"})," ","and can be intercepted. Use"," ",t.jsx(D,{variant:"learning",title:"Authorization Code Flow",content:"Secure OAuth flow using authorization code",placement:"top",children:"Authorization Code"})," ","+"," ",t.jsx(D,{variant:"learning",title:"PKCE",content:"RFC 7636 - Proof Key for Code Exchange, security extension",placement:"top",children:"PKCE"})," ","instead."]})]})]})]})]}),t.jsx(ut,{}),t.jsxs(mt,{children:[t.jsxs(xt,{children:[t.jsx(n,{size:18})," Generate Authorization URL"]}),t.jsx(gt,{children:"Generate the authorization URL with Implicit flow parameters. Review it carefully before redirecting."}),(!v.clientId||!v.environmentId)&&t.jsxs(Ye,{$variant:"warning",style:{marginBottom:"1.5rem"},children:[t.jsx(d,{size:20}),t.jsxs("div",{children:[t.jsx(Ge,{children:"Missing Required Credentials"}),t.jsxs(Qe,{children:[t.jsx(Ze,{children:"Environment ID"})," and ",t.jsx(Ze,{children:"Client ID"})," ","are required to generate the authorization URL. Please go back to Step 0 to fill in these credentials first."]}),t.jsxs(Qe,{style:{marginTop:"0.5rem",fontSize:"0.75rem",fontFamily:"monospace"},children:["Client ID: ",v.clientId||"EMPTY"," | Environment ID:"," ",v.environmentId||"EMPTY"]})]})]}),t.jsxs(et,{children:[t.jsxs(nt,{onClick:f.generateAuthorizationUrl,$priority:"primary",disabled:!!f.authUrl||!v.clientId||!v.environmentId,title:v.clientId&&v.environmentId?"Generate RFC 6749 compliant authorization URL with current credentials":`Complete Step 0: Fill in Environment ID and Client ID first (Client ID: ${v.clientId?"✓":"✗"}, Environment ID: ${v.environmentId?"✓":"✗"})`,children:[f.authUrl?t.jsx(n,{}):t.jsx(u,{})," ",f.authUrl?"Authorization URL Generated":"Generate Authorization URL",t.jsx(wt,{children:"1"})]}),f.authUrl&&t.jsxs(nt,{onClick:f.handleRedirectAuthorization,$priority:"success",children:[t.jsx(p,{})," Redirect to PingOne",t.jsx(wt,{children:"2"})]})]}),f.authUrl&&t.jsxs(rt,{children:[t.jsx(st,{children:"Generated Authorization URL (RFC 6749 Compliant)"}),t.jsx(_,{url:f.authUrl,label:`${s.toUpperCase()} Implicit Flow Authorization URL`,showCopyButton:!0,showInfoButton:!0,showOpenButton:!0,onOpen:f.handleRedirectAuthorization})]})]})]});case 2:return t.jsxs(t.Fragment,{children:[t.jsxs(Be,{children:[t.jsxs(Ke,{onClick:()=>R("tokenResponseOverview"),"aria-expanded":!S.tokenResponseOverview,children:[t.jsxs(Je,{children:[t.jsx(n,{})," Token Response Overview"]}),t.jsx(St,{$collapsed:S.tokenResponseOverview,children:t.jsx(a,{})})]}),!S.tokenResponseOverview&&t.jsx(We,{children:t.jsxs(Ye,{$variant:"success",children:[t.jsx(n,{size:20}),t.jsxs("div",{children:[t.jsxs(Ge,{children:[t.jsx(D,{variant:"learning",title:"Tokens",content:"Access token and optionally ID token returned immediately",placement:"top",children:"Tokens"})," ","Received Directly"]}),t.jsxs(Qe,{children:["In"," ",t.jsx(D,{variant:"warning",title:"Implicit Flow",content:"Deprecated OAuth flow - tokens in URL fragment",placement:"top",children:"Implicit Flow"}),","," ",t.jsx(D,{variant:"learning",title:"Tokens",content:"Access token and/or ID token",placement:"top",children:"tokens"})," ","come back in the"," ",t.jsx(D,{variant:"security",title:"URL Fragment",content:"Part of URL after # - not sent to server but visible in browser. SECURITY RISK: tokens exposed here.",placement:"top",children:"URL fragment (#)"})," ","immediately after authorization. No"," ",t.jsx(D,{variant:"learning",title:"Token Exchange",content:"Server-side step to exchange authorization code for tokens",placement:"top",children:"token exchange step"})," ","is needed, making it simpler but exposing"," ",t.jsx(D,{variant:"security",title:"Tokens in Browser",content:"Tokens visible in browser URL, history, and can be intercepted",placement:"top",children:"tokens in the browser"}),"."]})]})]})})]}),t.jsxs(Be,{children:[t.jsxs(Ke,{onClick:()=>R("tokenResponseDetails"),"aria-expanded":!S.tokenResponseDetails,children:[t.jsxs(Je,{children:[t.jsx(h,{})," Token Response Details"]}),t.jsx(St,{$collapsed:S.tokenResponseDetails,children:t.jsx(a,{})})]}),!S.tokenResponseDetails&&t.jsxs(We,{children:[t.jsxs(Ye,{$variant:"info",children:[t.jsx(i,{size:20}),t.jsxs("div",{children:[t.jsxs(Ge,{children:[t.jsx(D,{variant:"info",title:"URL Fragment",content:"URL part after # symbol - processed client-side, not sent to server",placement:"top",children:"URL Fragment"})," ","Response Format"]}),t.jsxs(Qe,{children:["In"," ",t.jsx(D,{variant:"warning",title:"Implicit Flow",content:"Deprecated OAuth flow",placement:"top",children:"Implicit Flow"}),","," ",t.jsx(D,{variant:"learning",title:"Tokens",content:"Access token and optionally ID token",placement:"top",children:"tokens"})," ","are returned in the"," ",t.jsx(D,{variant:"security",title:"URL Fragment",content:"Part after # - tokens exposed here is a security risk",placement:"top",children:"URL fragment (#)"})," ","as key-value pairs. This allows the"," ",t.jsx(D,{variant:"info",title:"OAuth Client",content:"Application requesting access",placement:"top",children:"client"})," ","to extract"," ",t.jsx(D,{variant:"learning",title:"Tokens",content:"Access token and/or ID token",placement:"top",children:"tokens"})," ","without a"," ",t.jsx(D,{variant:"info",title:"Server-side Exchange",content:"Safer method - exchanging code for tokens on backend server",placement:"top",children:"server-side exchange"}),"."]})]})]}),t.jsxs(Ye,{$variant:"warning",children:[t.jsx(l,{size:20}),t.jsxs("div",{children:[t.jsx(Ge,{children:"Security Considerations"}),t.jsx(Qe,{children:"Implicit Flow has inherent security limitations. Tokens are exposed in the URL, making them vulnerable to interception. This step demonstrates security best practices and mitigation strategies."})]})]})]})]}),e&&t.jsxs(Be,{children:[t.jsxs(Ke,{onClick:()=>R("tokenResponse"),"aria-expanded":!S.tokenResponse,children:[t.jsxs(Je,{children:[t.jsx(n,{})," Token Response"]}),t.jsx(St,{$collapsed:S.tokenResponse,children:t.jsx(a,{})})]}),!S.tokenResponse&&t.jsxs(We,{children:[t.jsx(gt,{children:"Review the tokens received. In Implicit Flow, there is no refresh token."}),t.jsxs(rt,{children:[t.jsx(st,{children:"Raw Token Response"}),t.jsx(it,{children:JSON.stringify(e,null,2)}),t.jsx(et,{children:t.jsx(E,{text:JSON.stringify(e,null,2),label:"Copy JSON Response",variant:"primary"})})]}),Q.showTokens(e,s,"implicit-v7",{showCopyButtons:!0,showDecodeButtons:!0}),t.jsxs(Ye,{$variant:"warning",children:[t.jsx(d,{size:20}),t.jsxs("div",{children:[t.jsx(Ge,{children:"No Refresh Token"}),t.jsx(Qe,{children:"Implicit Flow does not provide refresh tokens for security reasons. When the access token expires, users must re-authenticate."})]})]})]})]})]});case 3:return t.jsxs(t.Fragment,{children:[t.jsxs(Be,{children:[t.jsxs(Ke,{onClick:()=>R("tokenAnalysis"),"aria-expanded":!S.tokenAnalysis,children:[t.jsxs(Je,{children:[t.jsx(c,{})," Token Analysis & Security"]}),t.jsx(St,{$collapsed:S.tokenAnalysis,children:t.jsx(a,{})})]}),!S.tokenAnalysis&&t.jsxs(We,{children:[t.jsxs(Ye,{$variant:"info",children:[t.jsx(i,{size:20}),t.jsxs("div",{children:[t.jsx(Ge,{children:"Token Analysis Service"}),t.jsx(Qe,{children:"The UnifiedTokenDisplayService provides consistent token presentation across all OAuth flows, with automatic JWT detection, decode functionality, and token management integration."})]})]}),t.jsxs(Ye,{$variant:"warning",children:[t.jsx(l,{size:20}),t.jsxs("div",{children:[t.jsx(Ge,{children:"Implicit Flow Security Risks"}),t.jsx(Qe,{children:"Tokens are exposed in the browser URL, making them vulnerable to:"}),t.jsxs(Xe,{children:[t.jsxs("li",{children:[t.jsx(Ze,{children:"Browser History:"})," Tokens saved in browser history"]}),t.jsxs("li",{children:[t.jsx(Ze,{children:"Network Interception:"})," Visible in network logs"]}),t.jsxs("li",{children:[t.jsx(Ze,{children:"Shoulder Surfing:"})," Visible on screen"]}),t.jsxs("li",{children:[t.jsx(Ze,{children:"Server Logs:"})," May be logged by web servers"]})]})]})]})]})]}),e&&t.jsxs(mt,{children:[t.jsxs(xt,{children:[t.jsx(n,{size:18})," Token Validation Results"]}),t.jsxs(rt,{children:[t.jsx(st,{children:"Token Security Analysis"}),t.jsxs(ot,{children:[t.jsxs("div",{children:[t.jsx(at,{children:"Token Format"}),t.jsx(ct,{style:{color:e.access_token?.includes(".")?"#059669":"#6b7280",fontWeight:"bold"},children:e.access_token?.includes(".")?"JWT (Structured)":"Opaque (Reference)"})]}),t.jsxs("div",{children:[t.jsx(at,{children:"Token Length"}),t.jsxs(ct,{children:[e.access_token?.length||0," characters"]})]}),t.jsxs("div",{children:[t.jsx(at,{children:"Expires At"}),t.jsx(ct,{children:e.expires_in?new Date(Date.now()+1e3*e.expires_in).toLocaleString():"Unknown"})]}),t.jsxs("div",{children:[t.jsx(at,{children:"Security Level"}),t.jsx(ct,{style:{color:"#dc2626",fontWeight:"bold"},children:"LOW - Exposed in URL"})]})]}),t.jsx(et,{style:{justifyContent:"center",gap:"0.75rem",marginTop:"1rem"},children:t.jsxs(tt,{onClick:()=>{},variant:"primary",children:[t.jsx(p,{})," Advanced Token Management"]})})]})]})]});case 4:return t.jsxs(t.Fragment,{children:[t.jsxs(Be,{children:[t.jsxs(Ke,{onClick:()=>R("securityReview"),"aria-expanded":!S.securityReview,children:[t.jsxs(Je,{children:[t.jsx(c,{})," Security Best Practices Review"]}),t.jsx(St,{$collapsed:S.securityReview,children:t.jsx(a,{})})]}),!S.securityReview&&t.jsxs(We,{children:[t.jsxs(Ye,{$variant:"danger",children:[t.jsx(l,{size:20}),t.jsxs("div",{children:[t.jsx(Ge,{children:"⚠️ DEPRECATED FLOW - NOT RECOMMENDED"}),t.jsxs(Qe,{children:["The OAuth 2.0 Implicit Flow is ",t.jsx(Ze,{children:"deprecated"})," and should",t.jsx(Ze,{children:" NOT be used in production applications"}),"."]})]})]}),t.jsxs(Ye,{$variant:"info",children:[t.jsx(c,{size:20}),t.jsxs("div",{children:[t.jsx(Ge,{children:"Recommended Alternative"}),t.jsxs(Qe,{children:["Use ",t.jsx(Ze,{children:"Authorization Code Flow with PKCE"})," for all new applications. It provides better security and is the OAuth 2.1 standard."]})]})]}),t.jsxs(Ye,{$variant:"warning",children:[t.jsx(d,{size:20}),t.jsxs("div",{children:[t.jsx(Ge,{children:"Security Comparison"}),t.jsxs(Xe,{children:[t.jsxs("li",{children:[t.jsx(Ze,{children:"Authorization Code + PKCE:"})," High security, refresh tokens, no URL exposure"]}),t.jsxs("li",{children:[t.jsx(Ze,{children:"Implicit Flow:"})," Low security, no refresh tokens, URL exposure"]}),t.jsxs("li",{children:[t.jsx(Ze,{children:"OAuth 2.1:"})," Current standard with enhanced security"]})]})]})]})]})]}),t.jsx($,{flowType:"implicit",flowKey:"implicit-v7",tokens:e,credentials:v,variant:s})]});case 5:return t.jsxs(t.Fragment,{children:[t.jsxs(Be,{children:[t.jsxs(Ke,{onClick:()=>R("flowSummary"),"aria-expanded":!S.flowSummary,children:[t.jsxs(Je,{children:[t.jsx(n,{})," Flow Completion Summary"]}),t.jsx(St,{$collapsed:S.flowSummary,children:t.jsx(a,{})})]}),!S.flowSummary&&t.jsxs(We,{children:[t.jsxs(Ye,{$variant:"success",children:[t.jsx(n,{size:20}),t.jsxs("div",{children:[t.jsxs(Ge,{children:[s.toUpperCase()," Implicit Flow Completed"]}),t.jsxs(Qe,{children:["You have successfully completed the ",s.toUpperCase()," Implicit Flow. Tokens were received and validated according to OAuth 2.0 specifications."]})]})]}),t.jsxs(rt,{children:[t.jsx(st,{children:"Flow Summary"}),t.jsxs(ot,{children:[t.jsxs("div",{children:[t.jsx(at,{children:"Flow Variant"}),t.jsx(ct,{children:s.toUpperCase()})]}),t.jsxs("div",{children:[t.jsx(at,{children:"Response Type"}),t.jsx(ct,{children:"oidc"===s?"id_token token":"token"})]}),t.jsxs("div",{children:[t.jsx(at,{children:"Tokens Received"}),t.jsx(ct,{children:"oidc"===s?"Access Token + ID Token":"Access Token only"})]}),t.jsxs("div",{children:[t.jsx(at,{children:"Security Level"}),t.jsx(ct,{style:{color:"#dc2626"},children:"Deprecated - Low Security"})]})]})]})]})]}),t.jsx(Fe,{config:{...ze.implicit,onStartNewFlow:()=>{I(0),f.resetFlow();try{sessionStorage.removeItem("config-checker-diffs"),sessionStorage.removeItem("config-checker-last-check"),sessionStorage.removeItem("pingone-app-cache"),localStorage.removeItem("pingone-applications-cache"),sessionStorage.removeItem("worker-token-cache"),localStorage.removeItem("worker-apps-cache")}catch(e){}}},collapsed:!1})]});default:return t.jsxs("div",{children:["Step ",w," - Not implemented yet"]})}},[w,s,S,f,v,f.tokens,R,B]),X=[{title:"Step 0: Setup & Configuration",subtitle:"Choose variant and configure credentials"},{title:"Step 1: Generate Authorization URL",subtitle:"Build and generate the authorization URL"},{title:"Step 2: User Authorization",subtitle:"Complete authorization and receive tokens"},{title:"Step 3: Token Analysis",subtitle:"Inspect and validate received tokens"},{title:"Step 4: Security Review",subtitle:"Review security features and best practices"},{title:"Step 5: Flow Complete",subtitle:"Summary and next steps"}];return t.jsx(Oe,{children:t.jsxs($e,{children:[t.jsx(L,{flowId:"implicit-v7"}),t.jsx(P,{variant:"buttons"}),t.jsx(M,{flowType:"implicit",title:"📚 Implicit Flow Education",sections:[{id:"implicit-overview",title:"Implicit Flow Overview",icon:t.jsx(i,{}),summary:"Legacy OAuth flow - tokens returned directly in URL fragment (not recommended for new applications)",content:t.jsxs("div",{children:[t.jsxs("p",{children:[t.jsx("strong",{children:"The Implicit Flow"})," is a legacy OAuth 2.0 flow where tokens are returned directly in the URL fragment:"]}),t.jsxs("ul",{children:[t.jsxs("li",{children:[t.jsx("strong",{children:"No Backend Required"})," - Designed for browser-only applications"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Tokens in URL"})," - Access tokens returned in URL fragment (#)"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"No Refresh Tokens"})," - Cannot securely store refresh tokens"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Security Concerns"})," - Tokens exposed in browser history and logs"]})]}),t.jsxs("p",{children:[t.jsx("strong",{children:"⚠️ Not Recommended:"})," OAuth 2.1 deprecates this flow. Use Authorization Code with PKCE instead."]})]})},{id:"oauth-vs-oidc",title:"OAuth vs OIDC Variants",icon:t.jsx(c,{}),summary:"OAuth returns access tokens, OIDC adds ID tokens for authentication",content:t.jsxs("div",{children:[t.jsx("p",{children:t.jsx("strong",{children:"Two Variants Available:"})}),t.jsxs("ul",{children:[t.jsxs("li",{children:[t.jsx("strong",{children:"OAuth Implicit"})," - Returns access_token for API authorization"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"OIDC Implicit"})," - Returns id_token for user authentication"]})]}),t.jsx("p",{children:"Use the variant selector to switch between OAuth and OIDC modes."})]})}]}),t.jsx(H,{flowType:"implicit",showAdditionalInfo:!0,showDocumentation:!0,showCommonIssues:!1,showImplementationNotes:!0}),y&&t.jsx(N,{errorDetails:y,onDismiss:()=>b(null),onRetry:()=>{b(null)},showCorrelationId:!0}),t.jsxs(De,{children:[t.jsxs(kt,{$variant:s,children:[t.jsxs(_e,{children:[t.jsx(bt,{$variant:s,children:"V7"}),t.jsxs("div",{children:[t.jsx(It,{children:X[w].title}),t.jsx(Me,{children:X[w].subtitle})]})]}),t.jsxs(Ne,{children:[t.jsx(yt,{children:String(w+1).padStart(2,"0")}),t.jsxs(qe,{children:["of ",X.length]})]})]}),t.jsxs(Ct,{children:[t.jsxs(At,{$selected:"oauth"===s,onClick:()=>O("oauth"),children:[t.jsx(Rt,{children:"OAuth 2.0 Implicit"}),t.jsx(Ut,{children:"Access token only - API authorization"})]}),t.jsxs(At,{$selected:"oidc"===s,onClick:()=>O("oidc"),children:[t.jsx(Rt,{children:"OpenID Connect Implicit"}),t.jsx(Ut,{children:"ID token + Access token - Authentication + Authorization"})]})]}),t.jsx(Ve,{children:G})]}),t.jsx(q,{currentStep:w,totalSteps:X.length,onPrevious:()=>I(e=>Math.max(e-1,0)),onReset:()=>{I(0),f.resetFlow(),k.clearFlowState("implicit-v7");try{sessionStorage.removeItem("config-checker-diffs"),sessionStorage.removeItem("config-checker-last-check"),sessionStorage.removeItem("pingone-app-cache"),localStorage.removeItem("pingone-applications-cache"),sessionStorage.removeItem("worker-token-cache"),localStorage.removeItem("worker-apps-cache")}catch(e){}A()},onNext:()=>I(e=>Math.min(e+1,X.length-1)),canNavigateNext:(e=>{switch(e){case 0:return!(!v.environmentId||!v.clientId);case 1:return!!v.redirectUri;case 2:return!!f.authUrl;case 3:case 4:return!(!f.tokens?.access_token&&!f.tokens?.accessToken);default:return!0}})(w),isFirstStep:0===w,nextButtonText:"Next",disabledMessage:""})]})})},Ft=Object.freeze(Object.defineProperty({__proto__:null,default:Tt},Symbol.toStringTag,{value:"Module"})),zt=O.div`
	min-height: 100vh;
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	padding: 2rem 0 6rem;
`,Ot=O.div`
	max-width: 48rem;
	margin: 0 auto;
	padding: 0 1rem;
`,$t=O.div`
	text-align: center;
	margin-bottom: 3rem;
	padding: 3rem 2rem;
	background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
	border-radius: 1.5rem;
	color: white;
	box-shadow: 0 20px 40px rgba(249, 115, 22, 0.3);
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
		animation: float 6s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
		50% { transform: translate(-50%, -50%) rotate(180deg); }
	}
`,Dt=O.div`
	font-size: 4rem;
	margin-bottom: 1rem;
	animation: bounce 2s ease-in-out;
	display: inline-block;

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
		40% { transform: translateY(-10px); }
		60% { transform: translateY(-5px); }
	}
`,Et=O.h1`
	font-size: 2.5rem;
	font-weight: 800;
	margin: 0 0 1rem 0;
	text-shadow: 0 2px 4px rgba(0,0,0,0.1);
`,_t=O.p`
	font-size: 1.25rem;
	opacity: 0.95;
	margin: 0;
	line-height: 1.6;
`,Lt=O.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1.5rem;
	margin: 2rem 0;
`,Pt=O.div`
	background: white;
	border-radius: 1rem;
	padding: 1.5rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	border: 1px solid #e2e8f0;
	text-align: center;
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}
`,Mt=O.div`
	font-size: 2rem;
	font-weight: 700;
	color: #f97316;
	margin-bottom: 0.5rem;
`,Nt=O.div`
	font-size: 0.875rem;
	color: #64748b;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`,Ht=O.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`,qt=O.section`
	padding: 2rem;
	border-bottom: 1px solid #f1f5f9;

	&:last-child {
		border-bottom: none;
	}
`,Vt=O.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
	cursor: pointer;
	padding: 1rem;
	border-radius: 0.75rem;
	background: #f8fafc;
	transition: background 0.2s ease;

	&:hover {
		background: #f1f5f9;
	}
`,Bt=O.h2`
	font-size: 1.5rem;
	font-weight: 700;
	color: #1e293b;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,Kt=O.div`
	transition: transform 0.2s ease;
	transform: ${({$expanded:e})=>e?"rotate(0deg)":"rotate(-90deg)"};
	color: #64748b;
`,Jt=O.div`
	max-height: ${({$expanded:e})=>e?"2000px":"0"};
	overflow: hidden;
	transition: max-height 0.3s ease;
`,Wt=O.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin: 1.5rem 0;
`,Yt=O.div`
	padding: 1.5rem;
	border-radius: 0.75rem;
	border: 1px solid;
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	background: ${({$variant:e})=>"success"===e?"#f0fdf4":"warning"===e?"#fffbeb":"#f0f9ff"};
	border-color: ${({$variant:e})=>"success"===e?"#22c55e":"warning"===e?"#f59e0b":"#3b82f6"};
`,Gt=O.div`
	color: ${({$variant:e})=>"success"===e?"#16a34a":"warning"===e?"#d97706":"#2563eb"};
	font-size: 1.5rem;
	margin-top: 0.125rem;
`,Qt=O.div`
	flex: 1;
`,Xt=O.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
	margin: 0 0 0.5rem 0;
`,Zt=O.p`
	font-size: 0.875rem;
	color: #64748b;
	margin: 0;
	line-height: 1.5;
`,en=O.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin: 2rem 0;
`,tn=O.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 1rem 1.5rem;
	border-radius: 0.75rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 2px solid transparent;
	text-decoration: none;
	width: 100%;

	${({$variant:e})=>{switch(e){case"primary":return"\n\t\t\t\t\tbackground: linear-gradient(135deg, #f97316 0%, #ea580c 100%);\n\t\t\t\t\tcolor: white;\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\ttransform: translateY(-2px);\n\t\t\t\t\t\tbox-shadow: 0 8px 25px rgba(249, 115, 22, 0.3);\n\t\t\t\t\t}\n\t\t\t\t";case"secondary":return"\n\t\t\t\t\tbackground: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);\n\t\t\t\t\tcolor: white;\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\ttransform: translateY(-2px);\n\t\t\t\t\t\tbox-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);\n\t\t\t\t\t}\n\t\t\t\t";case"success":return"\n\t\t\t\t\tbackground: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);\n\t\t\t\t\tcolor: white;\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\ttransform: translateY(-2px);\n\t\t\t\t\t\tbox-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);\n\t\t\t\t\t}\n\t\t\t\t";case"outline":return"\n\t\t\t\t\tbackground: white;\n\t\t\t\t\tcolor: #64748b;\n\t\t\t\t\tborder-color: #e2e8f0;\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #f8fafc;\n\t\t\t\t\t\tborder-color: #cbd5e1;\n\t\t\t\t\t\ttransform: translateY(-1px);\n\t\t\t\t\t}\n\t\t\t\t"}}}
`,nn=O.div`
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border: 1px solid #f59e0b;
	border-radius: 1rem;
	padding: 2rem;
	margin: 2rem 0;
`,rn=O.h3`
	font-size: 1.25rem;
	font-weight: 700;
	color: #92400e;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,sn=O.p`
	color: #78350f;
	margin: 0 0 1.5rem 0;
	line-height: 1.6;
`,on=O.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
`,an=O.div`
	background: white;
	padding: 1.5rem;
	border-radius: 0.5rem;
	border: 1px solid #f59e0b;
`,cn=O.div`
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background: #f59e0b;
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 0.875rem;
	margin-bottom: 0.75rem;
`,ln=O.h4`
	font-size: 1rem;
	font-weight: 600;
	color: #92400e;
	margin: 0 0 0.5rem 0;
`,dn=O.p`
	font-size: 0.875rem;
	color: #a16207;
	margin: 0;
	line-height: 1.5;
`,pn=O.div`
	display: flex;
	justify-content: center;
	gap: 1rem;
	padding: 2rem;
	background: #f8fafc;
	border-top: 1px solid #e2e8f0;
`,hn=()=>{const r=m(),[o,d]=e.useState({achievements:!0,insights:!0,migration:!1}),h=e.useCallback(e=>{d(t=>({...t,[e]:!t[e]}))},[]),u=e.useCallback(e=>{r(e)},[r]),j=e.useCallback(e=>{window.open(e,"_blank")},[]);return t.jsx(zt,{children:t.jsxs(Ot,{children:[t.jsxs($t,{children:[t.jsx(Dt,{children:t.jsx(x,{})}),t.jsx(Et,{children:"OAuth Implicit Flow Mastered!"}),t.jsx(_t,{children:"Congratulations! You've successfully completed the OAuth 2.0 Implicit Flow demonstration. This legacy flow returned tokens directly in the URL fragment for API authorization."})]}),t.jsxs(Lt,{children:[t.jsxs(Pt,{children:[t.jsx(Mt,{children:"5"}),t.jsx(Nt,{children:"Steps Completed"})]}),t.jsxs(Pt,{children:[t.jsx(Mt,{children:"1"}),t.jsx(Nt,{children:"Access Token"})]}),t.jsxs(Pt,{children:[t.jsx(Mt,{children:"0"}),t.jsx(Nt,{children:"Refresh Tokens"})]}),t.jsxs(Pt,{children:[t.jsx(Mt,{children:"⚠️"}),t.jsx(Nt,{children:"Security Level"})]})]}),t.jsxs(Ht,{children:[t.jsxs(qt,{children:[t.jsxs(Vt,{onClick:()=>h("achievements"),children:[t.jsxs(Bt,{children:[t.jsx(n,{}),"Your Achievements"]}),t.jsx(Kt,{$expanded:o.achievements,children:t.jsx(a,{})})]}),t.jsx(Jt,{$expanded:o.achievements,children:t.jsxs(Wt,{children:[t.jsxs(Yt,{$variant:"success",children:[t.jsx(Gt,{$variant:"success",children:t.jsx(n,{})}),t.jsxs(Qt,{children:[t.jsx(Xt,{children:"Flow Completion"}),t.jsx(Zt,{children:"Successfully executed the complete OAuth 2.0 Implicit Flow from authorization request to token validation."})]})]}),t.jsxs(Yt,{$variant:"success",children:[t.jsx(Gt,{$variant:"success",children:t.jsx(g,{})}),t.jsxs(Qt,{children:[t.jsx(Xt,{children:"Token Management"}),t.jsx(Zt,{children:"Learned to handle access tokens, validate them, and understand their security implications."})]})]}),t.jsxs(Yt,{$variant:"warning",children:[t.jsx(Gt,{$variant:"warning",children:t.jsx(c,{})}),t.jsxs(Qt,{children:[t.jsx(Xt,{children:"Security Awareness"}),t.jsx(Zt,{children:"Recognized the security limitations of Implicit Flow and the importance of modern OAuth practices."})]})]}),t.jsxs(Yt,{$variant:"info",children:[t.jsx(Gt,{$variant:"info",children:t.jsx(f,{})}),t.jsxs(Qt,{children:[t.jsx(Xt,{children:"OAuth Knowledge"}),t.jsx(Zt,{children:"Gained deep understanding of OAuth 2.0 flows, token types, and authorization patterns."})]})]})]})})]}),t.jsxs(qt,{children:[t.jsxs(Vt,{onClick:()=>h("insights"),children:[t.jsxs(Bt,{children:[t.jsx(v,{}),"Key Insights & Learnings"]}),t.jsx(Kt,{$expanded:o.insights,children:t.jsx(a,{})})]}),t.jsx(Jt,{$expanded:o.insights,children:t.jsxs(Wt,{children:[t.jsxs(Yt,{$variant:"info",children:[t.jsx(Gt,{$variant:"info",children:t.jsx(i,{})}),t.jsxs(Qt,{children:[t.jsx(Xt,{children:"Token Exposure"}),t.jsx(Zt,{children:"Implicit Flow exposes tokens in the browser URL, making them vulnerable to interception and logging."})]})]}),t.jsxs(Yt,{$variant:"warning",children:[t.jsx(Gt,{$variant:"warning",children:t.jsx(l,{})}),t.jsxs(Qt,{children:[t.jsx(Xt,{children:"No Refresh Tokens"}),t.jsx(Zt,{children:"Implicit Flow doesn't provide refresh tokens, requiring re-authentication when access tokens expire."})]})]}),t.jsxs(Yt,{$variant:"success",children:[t.jsx(Gt,{$variant:"success",children:t.jsx(n,{})}),t.jsxs(Qt,{children:[t.jsx(Xt,{children:"Simplicity Benefits"}),t.jsx(Zt,{children:"No intermediate token exchange step makes Implicit Flow simpler for certain use cases."})]})]}),t.jsxs(Yt,{$variant:"warning",children:[t.jsx(Gt,{$variant:"warning",children:t.jsx(l,{})}),t.jsxs(Qt,{children:[t.jsx(Xt,{children:"Modern Standards"}),t.jsx(Zt,{children:"OAuth 2.1 deprecates Implicit Flow in favor of Authorization Code + PKCE for better security."})]})]})]})})]}),t.jsx(qt,{children:t.jsxs(en,{children:[t.jsxs(tn,{$variant:"primary",onClick:()=>u("/authorization-code-v5"),children:[t.jsx(p,{}),"Try Auth Code + PKCE"]}),t.jsxs(tn,{$variant:"secondary",onClick:()=>u("/oidc-implicit-v5"),children:[t.jsx(p,{}),"Explore OIDC Implicit"]}),t.jsxs(tn,{$variant:"success",onClick:()=>u("/token-management"),children:[t.jsx(g,{}),"Token Management"]}),t.jsxs(tn,{$variant:"outline",onClick:()=>u("/oauth-implicit-v5"),children:[t.jsx(s,{}),"Restart Flow"]})]})}),t.jsxs(qt,{children:[t.jsxs(Vt,{onClick:()=>h("migration"),children:[t.jsxs(Bt,{children:[t.jsx(c,{}),"Migration Guide: From Implicit to Auth Code + PKCE"]}),t.jsx(Kt,{$expanded:o.migration,children:t.jsx(a,{})})]}),t.jsx(Jt,{$expanded:o.migration,children:t.jsxs(nn,{children:[t.jsxs(rn,{children:[t.jsx(v,{}),"Why Migrate?"]}),t.jsx(sn,{children:"The Implicit Flow is deprecated by OAuth 2.1 specifications due to security concerns. Authorization Code + PKCE provides better security, refresh tokens, and modern standards compliance."}),t.jsxs(on,{children:[t.jsxs(an,{children:[t.jsx(cn,{children:"1"}),t.jsx(ln,{children:"Update Client Configuration"}),t.jsx(dn,{children:"Change response_type from 'token' to 'code' and enable PKCE in your OAuth client settings."})]}),t.jsxs(an,{children:[t.jsx(cn,{children:"2"}),t.jsx(ln,{children:"Implement Token Exchange"}),t.jsx(dn,{children:"Add backend endpoint to exchange authorization code for access and refresh tokens."})]}),t.jsxs(an,{children:[t.jsx(cn,{children:"3"}),t.jsx(ln,{children:"Secure Token Storage"}),t.jsx(dn,{children:"Move token storage from browser to secure server-side storage or httpOnly cookies."})]}),t.jsxs(an,{children:[t.jsx(cn,{children:"4"}),t.jsx(ln,{children:"Add Refresh Logic"}),t.jsx(dn,{children:"Implement automatic token refresh using refresh tokens to maintain user sessions."})]})]})]})})]})]}),t.jsxs(pn,{children:[t.jsxs(tn,{$variant:"outline",onClick:()=>u("/flows"),children:[t.jsx(f,{}),"Explore More Flows"]}),t.jsxs(tn,{$variant:"primary",onClick:()=>j("https://oauth.net/2/"),children:[t.jsx(p,{}),"OAuth 2.0 Specification"]})]})]})})};export{Fe as F,Tt as I,hn as O,ze as a,Ft as b,re as v};
//# sourceMappingURL=oauth-flows-implicit-BlAJpg9o.js.map
