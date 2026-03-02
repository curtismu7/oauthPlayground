import{a as e,j as t,t as r,k as n,l as i,aw as o,n as s,_ as a,an as l,A as d,f as c,a7 as p,aa as h,Y as u,F as m,af as g,x as f,E as x,ao as b,i as y,a9 as j,v,Q as w,e as k,ak as C,h as S,m as I}from"./react-vendor-HWZo9XlX.js";import{l as A,a as E,r as z,u as R}from"./styled-vendor-DGSsHzxd.js";import{c as _,s as T,Z as P,l as O,$ as U,h as $,a0 as F,a1 as M,a2 as D,a3 as N}from"./utils-lzKqcxFi.js";import{S as W,D as L,E as K,C as q,c as J,L as B,R as H,a as V,u as G,b as Y,d as X,e as Q}from"./components-oauth-qq-maH2w.js";import{t as Z}from"./v8-utils-BU6AoW1l.js";import{w as ee}from"./v8-services-DHsPM8a2.js";import{W as te}from"./components-token-uXxDPBqK.js";import{t as re}from"./components-flow-core-y1x-SJYd.js";import{c as ne}from"./oauth-flows-device-CMULWbHZ.js";import{j as ie}from"./pages-DE-6TDOE.js";const oe=e.createContext(null),se={success:5e3,warning:4e3,error:6e3,info:4e3},ae={success:t.jsx(s,{"aria-hidden":"true"}),error:t.jsx(o,{"aria-hidden":"true"}),warning:t.jsx(i,{"aria-hidden":"true"}),info:t.jsx(n,{"aria-hidden":"true"})},le={success:{background:"linear-gradient(135deg, rgba(34,197,94,0.95) 0%, rgba(22,163,74,0.95) 100%)",border:"rgba(187,247,208,0.45)",shadow:"0 18px 40px rgba(22,163,74,0.3)",progress:"linear-gradient(90deg, rgba(187,247,208,1) 0%, rgba(74,222,128,1) 100%)",iconAccent:"rgba(220,252,231,0.45)"},error:{background:"linear-gradient(135deg, rgba(248,113,113,0.95) 0%, rgba(185,28,28,0.95) 100%)",border:"rgba(248,113,113,0.55)",shadow:"0 20px 48px rgba(185,28,28,0.3)",progress:"linear-gradient(90deg, rgba(252,165,165,1) 0%, rgba(248,113,113,1) 100%)",iconAccent:"rgba(254,202,202,0.45)"},warning:{background:"linear-gradient(135deg, rgba(250,204,21,0.95) 0%, rgba(217,119,6,0.95) 100%)",border:"rgba(253,224,71,0.55)",shadow:"0 20px 44px rgba(202,138,4,0.3)",progress:"linear-gradient(90deg, rgba(254,240,138,1) 0%, rgba(250,204,21,1) 100%)",iconAccent:"rgba(254,240,138,0.45)"},info:{background:"linear-gradient(135deg, rgba(96,165,250,0.95) 0%, rgba(14,116,144,0.95) 100%)",border:"rgba(147,197,253,0.5)",shadow:"0 18px 42px rgba(37,99,235,0.3)",progress:"linear-gradient(90deg, rgba(191,219,254,1) 0%, rgba(59,130,246,1) 100%)",iconAccent:"rgba(191,219,254,0.45)"}},de=A`
  from {
    opacity: 0;
    transform: translateX(110%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
`,ce=A`
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(110%) scale(0.96);
  }
`,pe=A`
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
`,he=E.div`
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 360px;
  z-index: 12000;
  pointer-events: none;

  @media (max-width: 640px) {
    left: 1rem;
    right: 1rem;
    top: 0.75rem;
    max-width: none;
  }
`,ue=E.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.15rem 1.25rem;
  border-radius: 0.9rem;
  color: #ffffff;
  background: ${({$tone:e})=>le[e].background};
  border: 1px solid ${({$tone:e})=>le[e].border};
  box-shadow: ${({$tone:e})=>le[e].shadow};
  pointer-events: auto;
  animation: ${({$isExiting:e})=>e?ce:de} 0.34s ease forwards;
  outline: none;
  backdrop-filter: blur(18px);

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1ms;
    animation-iteration-count: 1;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`,me=E.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: flex-start;
`,ge=E.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: ${({$tone:e})=>le[e].iconAccent};
  border: 1px solid rgba(255, 255, 255, 0.32);
`,fe=E.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`,xe=E.div`
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.3;
`,be=E.div`
  font-size: 0.85rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.85);
`,ye=E.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.26);
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }
`,je=E.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`,ve=E.button`
  padding: 0.45rem 0.85rem;
  border-radius: 0.6rem;
  font-weight: 600;
  font-size: 0.82rem;
  border: none;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;

  ${({"data-variant":e})=>"primary"===e?z`
        background: rgba(255, 255, 255, 0.25);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.4);
        &:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.32);
        }
      `:z`
      background: rgba(255, 255, 255, 0.92);
      color: #0f172a;
      &:hover {
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.98);
      }
    `}

  &:focus-visible {
    outline: 3px solid rgba(255, 255, 255, 0.45);
    outline-offset: 1px;
  }
`,we=E.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 0 0 0.9rem 0.9rem;
  overflow: hidden;
`,ke=E.div`
  width: 100%;
  height: 100%;
  background: ${({$tone:e})=>le[e].progress};
  transform-origin: left;
  animation: ${pe} ${({$duration:e})=>`${e}ms`} linear forwards;

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1ms;
    animation-iteration-count: 1;
  }
`;let Ce=null;const Se=e=>{Ce=e},Ie=({children:r})=>{const[n,i]=e.useState([]),o=e.useRef(new Map),s=e.useRef(new Map),a=e.useCallback(e=>{const t=o.current.get(e);t&&(window.clearTimeout(t),o.current.delete(e))},[]),l=e.useCallback(e=>{i(t=>{const r=t.find(t=>t.id===e);if(!r)return t;const n=`${r.type}:${r.message.trim()}`;return s.current.get(n)===e&&s.current.delete(n),t.filter(t=>t.id!==e)})},[]),d=e.useCallback(e=>{a(e),i(t=>t.map(t=>t.id===e?{...t,isExiting:!0}:t)),window.setTimeout(()=>l(e),240)},[a,l]),c=e.useCallback(e=>{if(e.duration<=0)return;a(e.id);const t=window.setTimeout(()=>d(e.id),e.duration);o.current.set(e.id,t)},[d,a]),p=e.useCallback(e=>{const t=e.type??"info",r=`${t}:${e.message.trim()}`,n=e.focusOnRender??("error"===t||"warning"===t),o=e.persistent?0:e.duration??se[t];if(!e.allowDuplicates){const t=s.current.get(r);if(t){let r;return i(i=>i.map(i=>i.id!==t?i:(r={...i,message:e.message,description:e.description,actions:e.actions,duration:o,createdAt:Date.now(),persistent:e.persistent,focusOnRender:n,icon:e.icon??i.icon,meta:e.meta},r))),r&&c(r),t}}const a=e.id??("undefined"!=typeof crypto&&"function"==typeof crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2,11)),l={...e,id:a,type:t,duration:o,createdAt:Date.now(),isExiting:!1,focusOnRender:n};return i(e=>[...e,l]),s.current.set(r,a),c(l),a},[c]),h=e.useCallback((e,t)=>p({message:e,type:"success",...t}),[p]),u=e.useCallback((e,t)=>p({message:e,type:"error",duration:t?.duration??se.error,...t}),[p]),m=e.useCallback((e,t)=>p({message:e,type:"warning",duration:t?.duration??se.warning,...t}),[p]),g=e.useCallback((e,t)=>p({message:e,type:"info",duration:t?.duration??se.info,...t}),[p]),f=e.useCallback((e,t)=>{const r=((e,t="Request failed")=>{if(!e)return{message:t};if("string"==typeof e)return{message:e};if(e instanceof Error)return{message:e.message||t};const r=e,n=r?.response?.data?.error_description??r?.response?.data?.message??r?.response?.data?.detail??r?.message;if(n){const e=r?.response?.status,i=r?.response?.statusText;return{message:e?`${e}: ${i??"Error"}`:t,description:n}}return"undefined"!=typeof Response&&e instanceof Response?{message:`${e.status}: ${e.statusText}`,description:t}:{message:t}})(e,t);return u(r.message,{description:r.description,duration:se.error})},[u]),x=e.useCallback(e=>h(`${e} saved successfully`,{description:"All changes are now up to date.",duration:se.success}),[h]),b=e.useCallback((e,t,r)=>{let n="";return n=u(e,{duration:0,persistent:!0,description:r?.description??"Double-check your configuration, then try again.",actions:[{label:r?.actions?.[0]?.label??"Retry",variant:"primary",onClick:()=>{d(n),t()},autoClose:!1},{label:r?.actions?.[1]?.label??"Dismiss",variant:"secondary",onClick:()=>d(n),autoClose:!1}],...r}),n},[u,d]),y=e.useCallback((e,t="info",r)=>p({message:e,type:t,duration:r}),[p]);e.useEffect(()=>()=>{o.current.forEach(e=>{window.clearTimeout(e)}),o.current.clear()},[]),e.useEffect(()=>(Se({show:p,showSuccess:h,showError:u,showWarning:m,showInfo:g,showApiError:f,showSaveSuccess:x,showRetryableError:b}),()=>{Se(null)}),[p,h,u,m,g,f,x,b]);const j=e.useMemo(()=>({notifications:n,show:p,dismiss:d,showSuccess:h,showError:u,showWarning:m,showInfo:g,showApiError:f,showSaveSuccess:x,showRetryableError:b,notify:y}),[n,p,d,h,u,m,g,f,x,b,y]);return t.jsx(oe.Provider,{value:j,children:r})},Ae=()=>{const t=e.useContext(oe);if(!t)throw new Error("useNotifications must be used within a NotificationProvider");return t},Ee=()=>{const{notifications:n,dismiss:i}=Ae(),o=e.useRef(new Map),s=e.useRef([]);return e.useEffect(()=>{const e=s.current;n.forEach(t=>{if(!t.focusOnRender||e.includes(t.id))return;const r=o.current.get(t.id);r&&r.focus({preventScroll:!0})}),s.current=n.map(e=>e.id)},[n]),0===n.length?null:t.jsx(he,{children:n.map(e=>{const n="error"===e.type||"warning"===e.type?"alert":"status",s="error"===e.type||"warning"===e.type?"assertive":"polite";return t.jsxs(ue,{$tone:e.type,$isExiting:e.isExiting,role:n,"aria-live":s,tabIndex:0,onKeyDown:t=>{"Escape"===t.key&&(t.preventDefault(),i(e.id))},children:[t.jsxs(me,{children:[t.jsx(ge,{$tone:e.type,children:e.icon??ae[e.type]}),t.jsxs(fe,{children:[t.jsx(xe,{children:e.message}),e.description?t.jsx(be,{children:e.description}):null]}),t.jsx(ye,{type:"button","aria-label":e.ariaLabel??"Dismiss notification",onClick:()=>i(e.id),ref:t=>{t?o.current.set(e.id,t):o.current.delete(e.id)},children:t.jsx(r,{"aria-hidden":"true"})})]}),e.actions?.length?t.jsx(je,{children:e.actions.map((r,n)=>t.jsx(ve,{type:"button","data-variant":r.variant??"secondary",onClick:()=>{r.onClick(),!1!==r.autoClose&&i(e.id)},children:r.label},`${e.id}-action-${n}`))}):null,e.duration>0?t.jsx(we,{"aria-hidden":"true",children:t.jsx(ke,{$tone:e.type,$duration:e.duration})}):null]},e.id)})})},ze=(e,...t)=>Ce&&e?e(...t):"",Re=(e,t)=>ze(Ce?.showSuccess,e,t),_e=(e,t)=>ze(Ce?.showError,e,t),Te=(e,t)=>ze(Ce?.showWarning,e,t),Pe=()=>{const t=Ae();return e.useMemo(()=>({show:t.show,dismiss:t.dismiss,showSuccess:t.showSuccess,showError:t.showError,showWarning:t.showWarning,showInfo:t.showInfo,showApiError:t.showApiError,showSaveSuccess:t.showSaveSuccess,showRetryableError:t.showRetryableError,notify:t.notify}),[t])};const Oe=new class{FLOW_STORAGE_PREFIX="pingone_flow_credentials";SHARED_STORAGE_KEY="pingone_permanent_credentials";getFlowStorageKey(e){return`${this.FLOW_STORAGE_PREFIX}:${e}`}saveFlowCredentials(e,t,r={showToast:!0,useSharedFallback:!1}){try{const n=this.getFlowStorageKey(e),i={credentials:t,timestamp:Date.now(),flowKey:e,version:"1.0"};localStorage.setItem(n,JSON.stringify(i)),r.useSharedFallback&&localStorage.setItem(this.SHARED_STORAGE_KEY,JSON.stringify(t));localStorage.getItem(n);return r.showToast&&Re(`Credentials saved for ${e} (isolated)`),!0}catch(n){return r.showToast&&_e(`Failed to save credentials for ${e}`),!1}}loadFlowCredentials(e){const{flowKey:t,defaultCredentials:r={},useSharedFallback:n=!1}=e,i=this.getFlowStorageKey(t),o=localStorage.getItem(i);let s=null,a="none",l=!1,d=!1;if(o)try{const e=JSON.parse(o);e.credentials&&(e.credentials.environmentId||e.credentials.clientId)&&(s={...r,...e.credentials},a="flow-specific",l=!0)}catch(c){}if(!l&&n){const e=localStorage.getItem(this.SHARED_STORAGE_KEY);if(e)try{const t=JSON.parse(e);(t.environmentId||t.clientId)&&(s={...r,...t},a="shared-fallback",d=!0)}catch(c){}}return{credentials:s,hasFlowSpecificCredentials:l,hasSharedCredentials:d,credentialSource:a,flowSpecificData:o?JSON.parse(o):void 0,sharedData:n&&localStorage.getItem(this.SHARED_STORAGE_KEY)?JSON.parse(localStorage.getItem(this.SHARED_STORAGE_KEY)):void 0}}clearFlowCredentials(e){try{const t=this.getFlowStorageKey(e);return localStorage.removeItem(t),!0}catch(t){return!1}}migrateSharedToFlowSpecific(e){try{const t=localStorage.getItem(this.SHARED_STORAGE_KEY);if(!t)return!1;const r=JSON.parse(t);if(!r.environmentId&&!r.clientId)return!1;const n=this.getFlowStorageKey(e);if(localStorage.getItem(n))return!1;const i={credentials:r,timestamp:Date.now(),flowKey:e,version:"1.0",migrated:!0,migrationTimestamp:Date.now()};return localStorage.setItem(n,JSON.stringify(i)),!0}catch(t){return!1}}auditAllFlows(){const e={};["oauth-authorization-code-v7","oidc-hybrid-v7","worker-token-v7","client-credentials-v7","device-authorization-v7","implicit-flow-v7","ciba-flow-v7","redirectless-v7-real","pingone-par-flow-v7"].forEach(t=>{e[t]=this.loadFlowCredentials({flowKey:t})});return Object.entries(e).filter(([e,t])=>"shared-fallback"===t.credentialSource).map(([e,t])=>e).length,e}getAllFlowStorageKeys(){return Object.keys(localStorage).filter(e=>e.startsWith(this.FLOW_STORAGE_PREFIX))}clearAllFlowCredentials(){this.getAllFlowStorageKeys().forEach(e=>{localStorage.removeItem(e)})}};"undefined"!=typeof window&&(window.FlowCredentialIsolationService=Oe);const Ue=async(e,t)=>{try{const e=_.getAllCredentials();if(e.environmentId&&e.clientId){const r=e.clientAuthMethod??e.tokenAuthMethod??t?.clientAuthMethod??"client_secret_post",n=Array.isArray(e.scopes)?e.scopes.join(" "):"string"==typeof e.scopes?e.scopes:t?.scopes??t?.scope??"",i={...t,environmentId:e.environmentId??t?.environmentId??"",clientId:e.clientId??t?.clientId??"",clientSecret:e.clientSecret??t?.clientSecret??"",redirectUri:e.redirectUri??t?.redirectUri??"",postLogoutRedirectUri:e.postLogoutRedirectUri??t?.postLogoutRedirectUri,scope:n||t?.scope||"",scopes:n||t?.scopes||"",authorizationEndpoint:e.authEndpoint??t?.authorizationEndpoint,tokenEndpoint:e.tokenEndpoint??t?.tokenEndpoint,userInfoEndpoint:e.userInfoEndpoint??t?.userInfoEndpoint,clientAuthMethod:r,loginHint:e.loginHint??t?.loginHint};return{clientId:i.clientId??"",clientSecret:i.clientSecret??"",environmentId:i.environmentId,redirectUri:i.redirectUri??"",scope:i.scope??"",scopes:i.scopes??"",postLogoutRedirectUri:i.postLogoutRedirectUri,authorizationEndpoint:i.authorizationEndpoint,tokenEndpoint:i.tokenEndpoint,userInfoEndpoint:i.userInfoEndpoint,clientAuthMethod:i.clientAuthMethod??"client_secret_post",loginHint:i.loginHint,grantType:i.grantType,responseType:i.responseType,responseMode:i.responseMode,issuerUrl:i.issuerUrl,introspectionEndpoint:i.introspectionEndpoint,privateKey:i.privateKey,keyId:i.keyId,initiateLoginUri:i.initiateLoginUri,targetLinkUri:i.targetLinkUri,signoffUrls:i.signoffUrls,requestParameterSignatureRequirement:i.requestParameterSignatureRequirement,additionalRefreshTokenReplayProtection:i.additionalRefreshTokenReplayProtection,includeX5tParameter:i.includeX5tParameter,oidcSessionManagement:i.oidcSessionManagement,requestScopesForMultipleResources:i.requestScopesForMultipleResources,terminateUserSessionByIdToken:i.terminateUserSessionByIdToken,corsOrigins:i.corsOrigins,corsAllowAnyOrigin:i.corsAllowAnyOrigin}}return null}catch(r){return null}},$e=e=>{try{const t=localStorage.getItem(e);if(!t)return null;const r=T(t);return r||null}catch(t){return null}},Fe=async(e,t,r={showToast:!0})=>{try{const e=Array.isArray(t.scopes)?t.scopes:"string"==typeof t.scopes?t.scopes.split(/\s+/).filter(Boolean):"string"==typeof t.scope?t.scope.split(/\s+/).filter(Boolean):void 0,n={};t.environmentId&&(n.environmentId=t.environmentId),t.clientId&&(n.clientId=t.clientId),t.clientSecret&&(n.clientSecret=t.clientSecret),t.redirectUri&&(n.redirectUri=t.redirectUri),t.postLogoutRedirectUri&&(n.postLogoutRedirectUri=t.postLogoutRedirectUri),e&&e.length>0&&(n.scopes=e),n.tokenAuthMethod=t.tokenAuthMethod??t.clientAuthMethod??"client_secret_post",t.authorizationEndpoint&&(n.authEndpoint=t.authorizationEndpoint),t.tokenEndpoint&&(n.tokenEndpoint=t.tokenEndpoint),t.userInfoEndpoint&&(n.userInfoEndpoint=t.userInfoEndpoint),t.postLogoutRedirectUri&&(n.endSessionEndpoint=t.postLogoutRedirectUri),t.loginHint&&(n.loginHint=t.loginHint);if(!_.saveAllCredentials(n))throw new Error("Failed to save credentials to credentialManager");return r.showToast&&Re("Credentials saved successfully!"),!0}catch(n){return r.showToast&&_e("Failed to save credentials"),!1}},Me=(e,t)=>{try{const r={...t,timestamp:Date.now()};return localStorage.setItem(e,JSON.stringify(r)),!0}catch(r){return!1}},De=async(e,t,r,n,i={showToast:!0})=>{try{Object.keys(localStorage).filter(e=>e.includes("pingone"));const o=await Fe(0,t,{showToast:!1}),s={credentials:t,flowConfig:r,...n},a=Me(e,s),l=(Object.keys(localStorage).filter(e=>e.includes("pingone")),o&&a);return l&&i.showToast?Re("Credentials and configuration saved successfully!"):!l&&i.showToast&&_e("Failed to save credentials and configuration"),l}catch(o){return i.showToast&&_e("Failed to save credentials"),!1}},Ne=async e=>{const{flowKey:t,defaultCredentials:r,disableSharedFallback:n}=e,i=$e(t),o=n?null:await Ue(0,r);Object.keys(localStorage).filter(e=>e.includes("pingone")||e.includes(t));let s=null,a="none";return i?.credentials&&(i.credentials.environmentId||i.credentials.clientId)?(s=i.credentials,a="flow-specific"):o&&(s=o,a="shared-fallback"),{credentials:s,flowState:i,hasSharedCredentials:!!o,hasFlowState:!!i}},We=e=>{try{return localStorage.removeItem(e),!0}catch(t){return!1}},Le=async e=>{const{flowKey:t,defaultCredentials:r,useSharedFallback:n=!1}=e,i=Oe.loadFlowCredentials({flowKey:t,defaultCredentials:r,useSharedFallback:n}),o=$e(t);return{credentials:i.credentials,flowState:o,hasSharedCredentials:i.hasSharedCredentials,hasFlowState:!!o,credentialSource:i.credentialSource}},Ke=async e=>{try{return await _.clearAllCredentials(),!0}catch(t){return!1}},qe={loadSharedCredentials:Ue,loadFlowState:$e,loadFlowCredentials:Ne,saveSharedCredentials:Fe,saveFlowState:Me,saveFlowCredentials:De,clearFlowState:We,clearSharedCredentials:Ke,clearAllFlowData:async e=>{try{return We(e),await Ke(),!0}catch(t){return!1}},validateCredentials:(e,t=!1)=>{if(!e)return!1;const r=!!e.environmentId?.trim(),n=!!e.clientId?.trim(),i=!t||!!e.clientSecret?.trim();return r&&n&&i}};function Je(e){try{const t={version:"1.0.0",exportDate:(new Date).toISOString(),workerToken:e},r=JSON.stringify(t,null,2),n=new Blob([r],{type:"application/json"}),i=URL.createObjectURL(n),o=document.createElement("a");o.href=i,o.download=`pingone-worker-token-credentials-${(new Date).toISOString().split("T")[0]}.json`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i)}catch(t){throw new Error("Failed to export credentials")}}async function Be(e){return new Promise((t,r)=>{const n=new FileReader;n.onload=e=>{try{const n=e.target?.result;if(n.trim().startsWith("<!DOCTYPE")||n.trim().startsWith("<html"))return void r(new Error('Invalid file format: You downloaded an HTML page instead of a JSON file. Please right-click the export link and select "Save Link As..." or "Download Linked File As..." to download the actual JSON file.'));if(!n.trim().startsWith("{")&&!n.trim().startsWith("["))return void r(new Error("Invalid file format: The file does not appear to be JSON. Please ensure you downloaded the correct JSON credential file."));const i=JSON.parse(n);if(!i.version||!i.authz&&!i.workerToken)return void r(new Error("Invalid credential file format: Missing required fields (version and either authz or workerToken)"));t({authz:i.authz,workerToken:i.workerToken})}catch(n){const e=n instanceof Error?n.message:String(n);e.includes("Unexpected token")?r(new Error("Invalid JSON format: The file contains invalid JSON. Please ensure you downloaded the correct JSON credential file and not an HTML page.")):r(new Error(`Failed to parse credential file: ${e}. Please ensure the file is valid JSON.`))}},n.onerror=()=>{r(new Error("Failed to read file"))},n.readAsText(e)})}function He(e,t=".json"){const r=document.createElement("input");r.type="file",r.accept=t,r.style.display="none",r.onchange=t=>{const r=t.target.files?.[0];r&&e(r)},document.body.appendChild(r),r.click(),document.body.removeChild(r)}const Ve=E.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`,Ge=E.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid #e5e7eb;
`,Ye=E.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 1rem;
  }
`,Xe=E.div`
  padding: 1.5rem 2rem;
`,Qe=E.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &::placeholder {
      color: #9ca3af;
    }

    &.is-invalid {
      border-color: #ef4444;
    }
  }

  .form-text {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .invalid-feedback {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: #ef4444;
  }
`,Ze=E.div`
  padding: 1rem 2rem 2rem;
  border-top: 1px solid #e5e7eb;
  text-align: right;
`,et=E.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: #10b981;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #059669;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`,tt=E.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-right: 0.75rem;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`,rt=E.div`
  position: relative;
  display: flex;
  align-items: center;
  max-width: 600px;

  input {
    padding-right: 3rem;
    font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
    font-size: 0.875rem;
  }

  .toggle-button {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #6c757d;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background-color: #f8f9fa;
      color: #0070CC;
    }

    &:active {
      transform: translateY(-50%) scale(0.95);
    }

    svg {
      transition: all 0.2s;
    }
  }
`,nt=({isOpen:r,onClose:n,onSave:i,flowType:o})=>{const[s,u]=e.useState({environmentId:"",clientId:"",clientSecret:"",redirectUri:`${window.location.origin}/authz-callback`,region:"us",customDomain:""}),[m,g]=e.useState({}),[f,x]=e.useState(!1),[b,y]=e.useState(!1),[j,v]=e.useState(null),[w,k]=e.useState(!1),[C,S]=e.useState(!1),[I,A]=e.useState(null);e.useEffect(()=>{const e=e=>{"Escape"===e.key&&r&&n()};if(r)return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)},[r,n]);const E=e.useCallback(async()=>{try{const e=await fetch("/api/env-config");if(!e.ok)throw new Error(`HTTP ${e.status}: ${e.statusText}`);const t=await e.json(),r={environmentId:t.environmentId||"",clientId:t.clientId||"",clientSecret:t.clientSecret||"",redirectUri:t.redirectUri||`${window.location.origin}/authz-callback`,region:"us",customDomain:""};u(r)}catch(e){}},[]);e.useEffect(()=>{if(r){(async()=>{try{const e=await Ne({flowKey:"credential-setup-modal",defaultCredentials:{environmentId:"",clientId:"",clientSecret:"",redirectUri:`${window.location.origin}/authz-callback`,scope:"openid profile email",scopes:"openid profile email",loginHint:"",postLogoutRedirectUri:"",responseType:"code",grantType:"authorization_code",issuerUrl:"",region:"us",customDomain:"",authorizationEndpoint:"",tokenEndpoint:"",userInfoEndpoint:"",clientAuthMethod:"client_secret_post",tokenEndpointAuthMethod:"client_secret_post"}});if(e.credentials?.clientId&&e.credentials?.environmentId){const t={environmentId:e.credentials.environmentId||"",clientId:e.credentials.clientId||"",clientSecret:e.credentials.clientSecret||"",redirectUri:e.credentials.redirectUri||`${window.location.origin}/authz-callback`,region:e.credentials.region||"us",customDomain:e.credentials.customDomain||""};return u(t),A(t),S(!1),void k(!1)}}catch(e){}try{const e=_.getAllCredentials(),r=localStorage.getItem("pingone_config");let n=null;if(r)try{n=JSON.parse(r)}catch(t){}const i=_.arePermanentCredentialsComplete(),o=!!e.clientSecret,a={pingone_config:i?{environmentId:e.environmentId,clientId:e.clientId,redirectUri:e.redirectUri}:null,login_credentials:o?{clientSecret:e.clientSecret}:null};if(setStoredCredentials(a),i||o||n){const t={environmentId:e.environmentId||n?.environmentId||"",clientId:e.clientId||n?.clientId||"",clientSecret:e.clientSecret||n?.clientSecret||"",redirectUri:e.redirectUri||n?.redirectUri||`${window.location.origin}/authz-callback`,region:e.region||n?.region||"us",customDomain:e.customDomain||n?.customDomain||""};u(t),A(t),S(!1),k(!1)}else E(),A(s),S(!1),k(!1)}catch(r){}})()}},[r,s,E]);const z=e=>{const{name:t,value:r}=e.target,n={...s,[t]:r};if(u(n),m[t]&&g(e=>({...e,[t]:""})),I){const e=Object.keys(n).some(e=>n[e]!==I[e]);S(e)}},R=async e=>{if(e.preventDefault(),(()=>{const e={};var t;return s.environmentId?(t=s.environmentId).trim().length>0&&t.trim().length>=8||(e.environmentId="Environment ID must be at least 8 characters long"):e.environmentId="Environment ID is required",s.clientId||(e.clientId="Client ID is required"),s.redirectUri?/^https?:\/\//.test(s.redirectUri)||(e.redirectUri="Redirect URI must start with http:// or https://"):e.redirectUri="Redirect URI is required",g(e),0===Object.keys(e).length})()){x(!0),v(null);try{const e=new Promise(e=>setTimeout(e,500)),t=s.customDomain.trim()?`https://${s.customDomain.trim()}`:`https://${{us:"auth.pingone.com",eu:"auth.pingone.eu",ap:"auth.pingone.asia",ca:"auth.pingone.ca"}[s.region]}`,r={environmentId:s.environmentId,clientId:s.clientId,clientSecret:s.clientSecret,redirectUri:s.redirectUri,scope:"openid profile email",scopes:"openid profile email",loginHint:"",postLogoutRedirectUri:"",responseType:"code",grantType:"authorization_code",issuerUrl:"",region:s.region,customDomain:s.customDomain.trim()||void 0,authorizationEndpoint:`${t}/${s.environmentId}/as/authorize`,tokenEndpoint:`${t}/${s.environmentId}/as/token`,userInfoEndpoint:`${t}/${s.environmentId}/as/userinfo`,clientAuthMethod:"client_secret_post",tokenEndpointAuthMethod:"client_secret_post"};if(!(await De("credential-setup-modal",r,void 0,void 0,{showToast:!1})))throw new Error("Failed to save credentials using V7 standardized system");_.saveConfigCredentials({environmentId:s.environmentId,clientId:s.clientId,redirectUri:s.redirectUri,scopes:["openid","profile","email"],authEndpoint:`${t}/${s.environmentId}/as/authorize`,tokenEndpoint:`${t}/${s.environmentId}/as/token`,userInfoEndpoint:`${t}/${s.environmentId}/as/userinfo`}),_.saveSessionCredentials({clientSecret:s.clientSecret});window.dispatchEvent(new CustomEvent("pingone-config-changed")),window.dispatchEvent(new CustomEvent("permanent-credentials-changed")),await e,v({type:"success",title:"Configuration saved!",message:"Your PingOne credentials have been configured successfully."}),k(!0),S(!1),A({...s}),i&&i(s),setTimeout(()=>{n()},1500)}catch(t){v({type:"danger",title:"Configuration failed",message:"Failed to save your configuration. Please try again."})}finally{x(!1)}}};return r?t.jsx(Ve,{children:t.jsxs(Ge,{children:[t.jsxs(Ye,{children:[t.jsxs("h2",{children:[t.jsx(a,{}),"Setup PingOne Credentials"]}),t.jsx("p",{children:"Configure your PingOne environment to get started with the OAuth Playground"})]}),t.jsxs(Xe,{children:[j&&t.jsx(W,{type:"danger"===j.type?"error":j.type,title:j.title,message:j.message}),t.jsxs("div",{style:{marginBottom:"2rem",padding:"1rem",backgroundColor:"#f8f9fa",borderRadius:"6px",border:"1px solid #dee2e6"},children:[t.jsx("h4",{style:{marginTop:0,marginBottom:"0.5rem",fontSize:"0.9rem",color:"#495057"},children:"Current Stored Credentials"}),t.jsxs("div",{style:{fontSize:"0.85rem",color:"#6c757d"},children:[t.jsxs("div",{style:{marginBottom:"0.25rem"},children:[t.jsx("strong",{children:"Permanent Credentials:"})," ",_.arePermanentCredentialsComplete()?t.jsx("span",{style:{color:"#28a745"},children:" Complete"}):t.jsx("span",{style:{color:"#dc3545"},children:" Missing"})]}),t.jsxs("div",{style:{marginBottom:"0.25rem"},children:[t.jsx("strong",{children:"Session Credentials:"})," ",_.getAllCredentials().clientSecret?t.jsx("span",{style:{color:"#28a745"},children:" Present"}):t.jsx("span",{style:{color:"#dc3545"},children:" Missing"})]}),t.jsxs("div",{style:{marginBottom:"0.25rem",fontSize:"0.8rem",color:"#6c757d"},children:[t.jsx("strong",{children:"Status:"})," ",_.getCredentialsStatus().overall]}),_.arePermanentCredentialsComplete()&&t.jsxs("div",{style:{marginTop:"0.5rem",padding:"0.5rem",backgroundColor:"white",borderRadius:"4px",border:"1px solid #dee2e6"},children:[t.jsxs("div",{children:[t.jsx("strong",{children:"Environment ID:"})," ",_.getAllCredentials().environmentId||"Not set"]}),t.jsxs("div",{children:[t.jsx("strong",{children:"Client ID:"})," ",_.getAllCredentials().clientId?`${_.getAllCredentials().clientId.substring(0,12)}...`:"Not set"]}),t.jsxs("div",{children:[t.jsx("strong",{children:"Client Secret:"})," ",_.getAllCredentials().clientSecret?"":"Not set"]})]})]})]}),t.jsxs("form",{onSubmit:R,children:[t.jsxs(Qe,{children:[t.jsx("label",{htmlFor:"environmentId",children:"Environment ID *"}),t.jsx("input",{type:"text",id:"environmentId",name:"environmentId",value:s.environmentId,onChange:z,placeholder:"e.g., abc12345-6789-4abc-def0-1234567890ab",className:m.environmentId?"is-invalid":"",disabled:f}),m.environmentId&&t.jsx("div",{className:"invalid-feedback",children:m.environmentId}),t.jsx("div",{className:"form-text",children:"Your PingOne Environment ID from the Admin Console"})]}),t.jsxs(Qe,{children:[t.jsx("label",{htmlFor:"clientId",children:"Client ID *"}),t.jsx("input",{type:"text",id:"clientId",name:"clientId",value:s.clientId,onChange:z,placeholder:"Enter your application's Client ID",className:m.clientId?"is-invalid":"",disabled:f}),m.clientId&&t.jsx("div",{className:"invalid-feedback",children:m.clientId}),t.jsx("div",{className:"form-text",children:"The Client ID of your PingOne application"})]}),t.jsxs(Qe,{children:[t.jsx("label",{htmlFor:"clientSecret",children:"Client Secret"}),t.jsxs(rt,{children:[t.jsx("input",{type:b?"text":"password",id:"clientSecret",name:"clientSecret",value:s.clientSecret,onChange:z,placeholder:"Enter your application's Client Secret (optional)",disabled:f}),t.jsx("button",{type:"button",className:"toggle-button",onClick:()=>y(!b),disabled:f,"aria-label":b?"Hide client secret":"Show client secret",title:b?"Hide client secret":"Show client secret",children:b?t.jsx(l,{size:18}):t.jsx(d,{size:18})})]}),t.jsx("div",{className:"form-text",children:"Only required for confidential clients"})]}),t.jsxs(Qe,{children:[t.jsx("label",{htmlFor:"redirectUri",children:"Callback URL *"}),t.jsx("input",{type:"url",id:"redirectUri",name:"redirectUri",value:s.redirectUri,onChange:z,className:m.redirectUri?"is-invalid":"",disabled:f,placeholder:"https://localhost:3000/authz-callback"}),m.redirectUri&&t.jsx("div",{className:"invalid-feedback",children:m.redirectUri}),t.jsx("div",{className:"form-text",children:"Must match the redirect URI configured in your PingOne application"})]}),t.jsxs(Qe,{children:[t.jsx("label",{htmlFor:"region",children:"Region"}),t.jsxs("select",{id:"region",name:"region",value:s.region,onChange:e=>z(e),disabled:f,style:{width:"100%",padding:"0.75rem",fontSize:"0.875rem",border:"1px solid #d1d5db",borderRadius:"0.375rem"},children:[t.jsx("option",{value:"us",children:"North America (US)"}),t.jsx("option",{value:"eu",children:"Europe (EU)"}),t.jsx("option",{value:"ap",children:"Asia Pacific (AP)"}),t.jsx("option",{value:"ca",children:"Canada (CA)"})]}),t.jsx("div",{className:"form-text",children:"The region where your PingOne environment is hosted"})]}),t.jsxs(Qe,{children:[t.jsx("label",{htmlFor:"customDomain",children:"Custom Domain (Optional)"}),t.jsx("input",{type:"text",id:"customDomain",name:"customDomain",value:s.customDomain,onChange:z,disabled:f,placeholder:"auth.yourcompany.com",style:{width:"100%",padding:"0.75rem",fontSize:"0.875rem",border:"1px solid #d1d5db",borderRadius:"0.375rem"}}),t.jsx("div",{className:"form-text",children:"Your custom PingOne domain (e.g., auth.yourcompany.com). If set, this overrides the region-based domain. Leave empty to use the default region domain."})]}),t.jsxs(Qe,{children:[t.jsx("label",{htmlFor:"authEndpoint",children:"Authorization Endpoint"}),t.jsx("input",{type:"url",id:"authEndpoint",name:"authEndpoint",value:s.environmentId?`${s.customDomain.trim()?`https://${s.customDomain.trim()}`:`https://${{us:"auth.pingone.com",eu:"auth.pingone.eu",ap:"auth.pingone.asia",ca:"auth.pingone.ca"}[s.region]}`}/${s.environmentId}/as/authorize`:"",readOnly:!0,disabled:!0,style:{backgroundColor:"#f8f9fa",color:"#6c757d"}}),t.jsx("div",{className:"form-text",children:"Auto-generated from Environment ID"})]}),t.jsxs(Qe,{children:[t.jsx("label",{htmlFor:"scopes",children:"Scopes"}),t.jsx("input",{type:"text",id:"scopes",name:"scopes",value:"openid profile email",readOnly:!0,disabled:!0,style:{backgroundColor:"#f8f9fa",color:"#6c757d"}}),t.jsx("div",{className:"form-text",children:"Standard OAuth scopes for user authentication"})]}),t.jsxs(Qe,{children:[t.jsx("label",{htmlFor:"responseType",children:"Response Type"}),t.jsx("select",{id:"responseType",name:"responseType",value:"code",disabled:!0,style:{backgroundColor:"#f8f9fa",color:"#6c757d"},children:t.jsx("option",{value:"code",children:"code (Authorization Code Flow)"})}),t.jsx("div",{className:"form-text",children:"OAuth response type for authorization code flow"})]})]})]}),t.jsx(Ze,{children:t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"},children:[t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",fontSize:"0.875rem",color:"#6b7280",cursor:"pointer"},children:[t.jsx("input",{type:"checkbox",style:{margin:0,cursor:"pointer"},onChange:e=>{e.target.checked?localStorage.setItem("skip_startup_credentials_modal","true"):localStorage.removeItem("skip_startup_credentials_modal")}}),"Do not show again"]}),t.jsxs("div",{style:{display:"flex",gap:"0.75rem",flexWrap:"wrap"},children:[t.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[t.jsxs("button",{type:"button",onClick:()=>{try{if(!s.environmentId||!s.clientId||!s.clientSecret)return void v({type:"danger",title:"Export failed",message:"Please fill in all required fields before exporting."});!function(e){try{const t={version:"1.0.0",exportDate:(new Date).toISOString(),authz:e},r=JSON.stringify(t,null,2),n=new Blob([r],{type:"application/json"}),i=URL.createObjectURL(n),o=document.createElement("a");o.href=i,o.download=`pingone-authz-credentials-${(new Date).toISOString().split("T")[0]}.json`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i)}catch(t){throw new Error("Failed to export credentials")}}({environmentId:s.environmentId,clientId:s.clientId,clientSecret:s.clientSecret,redirectUri:s.redirectUri,scopes:["openid","profile","email"],region:s.region,customDomain:s.customDomain.trim()||void 0}),v({type:"success",title:"Credentials exported!",message:"Your credentials have been exported to a JSON file."})}catch(e){v({type:"danger",title:"Export failed",message:e instanceof Error?e.message:"Failed to export credentials."})}},disabled:f,style:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",padding:"0.75rem 1rem",fontSize:"0.875rem",fontWeight:"500",color:"#3b82f6",background:"white",border:"1px solid #3b82f6",borderRadius:"6px",cursor:f?"not-allowed":"pointer",opacity:f?.65:1},title:"Export credentials to JSON file",children:[t.jsx(c,{}),"Export"]}),t.jsxs("button",{type:"button",onClick:()=>{He(async e=>{try{const t=await Be(e);if(t.authz){const e=t.authz,r={environmentId:e.environmentId||s.environmentId,clientId:e.clientId||s.clientId,clientSecret:e.clientSecret||s.clientSecret,redirectUri:e.redirectUri||s.redirectUri,region:e.region||"us",customDomain:e.customDomain||""};u(r),A(r),S(!0),k(!1),v({type:"success",title:"Credentials imported!",message:'Your credentials have been imported. Click "Save Configuration" to save them.'})}else v({type:"danger",title:"Import failed",message:"The selected file does not contain authorization credentials."})}catch(t){v({type:"danger",title:"Import failed",message:t instanceof Error?t.message:"Failed to import credentials."})}})},disabled:f,style:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",padding:"0.75rem 1rem",fontSize:"0.875rem",fontWeight:"500",color:"#10b981",background:"white",border:"1px solid #10b981",borderRadius:"6px",cursor:f?"not-allowed":"pointer",opacity:f?.65:1},title:"Import credentials from JSON file",children:[t.jsx(p,{}),"Import"]})]}),t.jsxs("div",{style:{display:"flex",gap:"0.75rem"},children:[t.jsx(tt,{onClick:()=>{n()},disabled:f,children:"Cancel"}),t.jsx(et,{onClick:R,disabled:f||w&&!C,style:{opacity:w&&!C?.5:1,cursor:w&&!C?"not-allowed":"pointer"},children:f?t.jsxs(t.Fragment,{children:[t.jsx(h,{className:"animate-spin"}),"Saving..."]}):w&&!C?"Saved":"Save Configuration"})]})]})]})})]})}):null};const it=E.div`
	display: flex;
	gap: 10px;
	margin-top: 15px;
`,ot=E.button`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: #10b981;
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;

	&:hover {
		background: #059669;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
`,st=E.button`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;

	&:hover {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
`,at=({appName:e,appType:r,credentials:n,metadata:i,onExport:o,onImport:s,onError:a,disabled:l=!1,exportButtonText:d="Export Credentials",importButtonText:h="Import Credentials",showExportOnly:u=!1,showImportOnly:m=!1})=>{const g=()=>{if(n)try{!function(e,t,r,n){try{if("worker-token"===t)return void Je(r);const i={version:"1.0.0",exportDate:(new Date).toISOString(),appName:e,appType:t,credentials:r,metadata:n},o=JSON.stringify(i,null,2),s=new Blob([o],{type:"application/json"}),a=URL.createObjectURL(s),l=document.createElement("a");l.href=a,l.download=`pingone-${e.toLowerCase().replace(/\s+/g,"-")}-credentials-${(new Date).toISOString().split("T")[0]}.json`,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(a)}catch(i){throw new Error("Failed to export credentials")}}(e,r,n,i),Z.success("Credentials exported successfully"),o?.()}catch(t){Z.error("Failed to export credentials"),a?.(t)}else Z.error("No credentials to export")},f=async e=>{const t=e.target.files?.[0];if(!t)return;try{const e=await async function(e){return new Promise((t,r)=>{const n=new FileReader;n.onload=e=>{try{const n=e.target?.result,i=JSON.parse(n);if(i.version&&(i.authz||i.workerToken)){const e={version:"1.0.0",exportDate:i.exportDate,appName:i.workerToken?"Worker Token":"OAuth",appType:i.workerToken?"worker-token":"oauth",credentials:i.workerToken||i.authz,metadata:{flowType:i.authz?"authorization_code":void 0}};t(e)}else i.version&&i.appType&&i.credentials?t(i):r(new Error("Invalid credential file format"))}catch(n){r(new Error("Failed to parse credential file"))}},n.onerror=()=>{r(new Error("Failed to read file"))},n.readAsText(e)})}(t);if(e.appType!==r)if("oauth"===r&&"worker-token"===e.appType);else if("worker-token"!==r||"oauth"!==e.appType)return void Z.error(`Invalid credential type. Expected ${r}, got ${e.appType}`);Z.success("Credentials imported successfully"),s?.(e)}catch(i){Z.error(`Failed to import credentials: ${i.message}`),a?.(i)}const n=e.target;setTimeout(()=>{n&&(n.value="")},0)};return u?t.jsxs(ot,{onClick:g,disabled:l||!n,title:`Export ${e} credentials to a file`,children:[t.jsx(c,{size:16}),d]}):m?t.jsxs(st,{onClick:()=>{const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=e=>{const t=e.target.files?.[0];t&&f({target:e.target})},e.click()},disabled:l,title:`Import ${e} credentials from a file`,children:[t.jsx(p,{size:16}),h]}):t.jsxs(it,{children:[t.jsxs(ot,{onClick:g,disabled:l||!n,title:`Export ${e} credentials to a file`,children:[t.jsx(c,{size:16}),d]}),t.jsxs(st,{onClick:()=>{const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=e=>{const t=e.target.files?.[0];t&&f({target:e.target})},e.click()},disabled:l,title:`Import ${e} credentials from a file`,children:[t.jsx(p,{size:16}),h]})]})};class lt{constructor(e,t,r,n,i,o){this.token=e,this.environmentId=t,this.region=r,this.clientId=n,this.clientSecret=i,this.flowType=o}async compare(e,t){try{P(this.token,this.environmentId,this.region);const i=Date.now(),o=`http://localhost:3001/api/pingone/applications?environmentId=${this.environmentId}&clientId=${this.clientId}&clientSecret=${this.clientSecret}&workerToken=${encodeURIComponent(this.token)}&region=${this.region}&t=${i}&_=${Math.random()}`,s=await fetch(o),a=await s.json(),l=(a._embedded?.applications||[]).find(t=>t.clientId===e);if(!l)return{hasDiffs:!0,diffs:[{path:"application",expected:"Existing PingOne app",actual:"Not found",change:"removed"}],normalizedRemote:{},normalizedDesired:this.normalize(t)};const d={...l};if(!l.scopes&&!l.allowedScopes&&!l.resources){try{const e=`http://localhost:3001/api/pingone/applications/${l.id}/resources?environmentId=${this.environmentId}&clientId=${this.clientId}&clientSecret=${this.clientSecret}&workerToken=${encodeURIComponent(this.token)}&region=${this.region}`,t=await fetch(e),r=await t.json();if(r._embedded?.resources){const e=[];r._embedded.resources.forEach(t=>{t.scopes&&Array.isArray(t.scopes)&&e.push(...t.scopes)}),e.length>0&&(d.scopes=[...new Set(e)])}}catch(r){}if(!d.scopes||0===d.scopes.length)try{const e=`http://localhost:3001/api/pingone/oidc-config?environmentId=${this.environmentId}&region=${this.region}`,t=await fetch(e),r=await t.json();if(r.scopes_supported&&Array.isArray(r.scopes_supported)){const e=r.scopes_supported.filter(e=>e.startsWith("p1:")||"openid"===e||"profile"===e||"email"===e);e.length>0&&(d.scopes=e)}}catch(n){}d.scopes&&0!==d.scopes.length||(d.scopes=["openid","p1:read:user","p1:update:user"])}const c=this.normalize(d),p=this.normalize(t);return{hasDiffs:JSON.stringify(c)!==JSON.stringify(p),diffs:this.diff(c,p),normalizedRemote:c,normalizedDesired:p}}catch(i){throw new Error(`Failed to compare configuration: ${i instanceof Error?i.message:"Unknown error"}`)}}normalize(e){const t=t=>e[t],r=this.flowTypeUsesRedirects(this.flowType),n=this.flowTypeUsesResponseTypes(this.flowType),i={grantTypes:this.normalizeArray(t("grantTypes")||t("grant_types")),tokenEndpointAuthMethod:this.normalizeTokenEndpointAuthMethod(t("tokenEndpointAuthMethod")??t("token_endpoint_auth_method")??t("clientAuthMethod")??t("client_auth_method")??t("clientAuthenticationMethod")??t("client_authentication_method")??e.configuration?.tokenEndpointAuthMethod??e.configuration?.token_endpoint_auth_method??e.configuration?.clientAuthMethod??e.configuration?.client_auth_method??e.settings?.tokenEndpointAuthMethod??e.settings?.token_endpoint_auth_method??e.settings?.clientAuthMethod??e.settings?.client_auth_method),pkceEnforcement:t("pkceEnforcement")??t("pkce_enforcement")};r&&(i.redirectUris=this.normalizeRedirectUris(t("redirectUris")||t("redirect_uris")),i.postLogoutRedirectUris=this.normalizeRedirectUris(t("postLogoutRedirectUris")||t("post_logout_redirect_uris"))),n&&(i.responseTypes=this.normalizeArray(t("responseTypes")||t("response_types")));const o=this.extractScopesFromPingOneApp(e);return i.scopes=this.normalizeArray(o),i}normalizeTokenEndpointAuthMethod(e){if(!e||"string"!=typeof e)return;const t=e.toLowerCase().trim();return{client_secret_basic:"client_secret_basic",client_secret_post:"client_secret_post",client_secret_jwt:"client_secret_jwt",private_key_jwt:"private_key_jwt",none:"none",client_secret:"client_secret_basic",basic:"client_secret_basic",post:"client_secret_post",jwt:"client_secret_jwt",private_key:"private_key_jwt"}[t]||t}extractScopesFromPingOneApp(e){const t=["scopes","scope","allowedScopes","allowed_scopes","resources","resourceScopes","resource_scopes","grantTypes","grant_types"];for(const r of t){const t=e[r];if(t){if(Array.isArray(t))return t;if("string"==typeof t){return t.split(/[\s,]+/).filter(e=>e.trim())}if("object"==typeof t&&null!==t){const e=t.scopes||t.allowedScopes||t.scopes_supported;if(Array.isArray(e))return e}}}if(e._embedded&&"object"==typeof e._embedded){const t=e._embedded;if(t.resources&&Array.isArray(t.resources)){const e=[];if(t.resources.forEach(t=>{t.scopes&&Array.isArray(t.scopes)&&e.push(...t.scopes)}),e.length>0)return[...new Set(e)]}}}flowTypeUsesRedirects(e){if(!e)return!0;return!["client-credentials","client_credentials","resource-owner-password","ropc","jwt-bearer","saml-bearer","ciba","device","device-authorization"].some(t=>e.toLowerCase().includes(t))}flowTypeUsesResponseTypes(e){if(!e)return!0;return!["client-credentials","client_credentials","resource-owner-password","ropc","jwt-bearer","saml-bearer","ciba","device","device-authorization"].some(t=>e.toLowerCase().includes(t))}normalizeArray(e){if(e&&0!==e.length)return Array.from(new Set(e.map(e=>e.trim().toLowerCase()))).sort()}normalizeRedirectUris(e){if(e&&0!==e.length)return Array.from(new Set(e.map(e=>e.trim()))).sort()}diff(e,t={}){const r=new Set([...Object.keys(e),...Object.keys(t)]),n=[];return r.forEach(r=>{const i=e[r],o=t[r];void 0===i&&void 0===o||(void 0!==i&&void 0===o?n.push({path:r,expected:i,actual:void 0,change:"added"}):void 0===i&&void 0!==o?n.push({path:r,expected:void 0,actual:o,change:"removed"}):this.valuesEqual(i,o,r)||n.push({path:r,expected:i,actual:o,change:"mismatch"}))}),n}valuesEqual(e,t,r){if("grantTypes"===r||"responseTypes"===r)return JSON.stringify(e)===JSON.stringify(t);if("redirectUris"===r)return this.redirectUrisMatch(e,t);if("tokenEndpointAuthMethod"===r){return String(e||"").toLowerCase().trim()===String(t||"").toLowerCase().trim()}return JSON.stringify(e)===JSON.stringify(t)}redirectUrisMatch(e,t){const r=Array.isArray(e)?e:[],n=Array.isArray(t)?t:[];if(0===r.length||0===n.length)return r.length===n.length;return r.some(e=>n.some(t=>String(e).trim()===String(t).trim()))}}class dt{client=null;initialize(e,t,r="NA"){this.client=P(e,t,r),O.info("APP-CREATION","Service initialized",{environmentId:t,region:r})}async createOIDCWebApp(e){return this.createApp({name:e.name,description:e.description,enabled:void 0===e.enabled||e.enabled,protocol:"OPENID_CONNECT",type:"WEB_APP",grantTypes:e.grantTypes,responseTypes:e.responseTypes,redirectUris:e.redirectUris,postLogoutRedirectUris:e.postLogoutRedirectUris,tokenEndpointAuthMethod:e.tokenEndpointAuthMethod,pkceEnforcement:e.pkceEnforcement||"OPTIONAL",scopes:e.scopes,accessTokenValiditySeconds:e.accessTokenValiditySeconds||3600,refreshTokenValiditySeconds:e.refreshTokenValiditySeconds||2592e3,idTokenValiditySeconds:e.idTokenValiditySeconds||3600})}async createOIDCNativeApp(e){return this.createApp({name:e.name,description:e.description,enabled:void 0===e.enabled||e.enabled,protocol:"OPENID_CONNECT",type:"NATIVE_APP",grantTypes:e.grantTypes,responseTypes:e.responseTypes,redirectUris:e.redirectUris,tokenEndpointAuthMethod:e.tokenEndpointAuthMethod,pkceEnforcement:e.pkceEnforcement||"REQUIRED",scopes:e.scopes,accessTokenValiditySeconds:e.accessTokenValiditySeconds||3600,refreshTokenValiditySeconds:e.refreshTokenValiditySeconds||2592e3,idTokenValiditySeconds:e.idTokenValiditySeconds||3600})}async createWorkerApp(e){return this.createApp({name:e.name,description:e.description,enabled:void 0===e.enabled||e.enabled,protocol:"OPENID_CONNECT",type:e.type,grantTypes:e.grantTypes,tokenEndpointAuthMethod:e.tokenEndpointAuthMethod,scopes:e.scopes,accessTokenValiditySeconds:e.accessTokenValiditySeconds||3600,refreshTokenValiditySeconds:e.refreshTokenValiditySeconds||2592e3})}async createSinglePageApp(e){return this.createApp({name:e.name,description:e.description,enabled:void 0===e.enabled||e.enabled,protocol:"OPENID_CONNECT",type:e.type,grantTypes:e.grantTypes,responseTypes:e.responseTypes,redirectUris:e.redirectUris,tokenEndpointAuthMethod:"none",pkceEnforcement:e.pkceEnforcement||"REQUIRED",scopes:e.scopes,accessTokenValiditySeconds:e.accessTokenValiditySeconds||3600,refreshTokenValiditySeconds:e.refreshTokenValiditySeconds||2592e3,idTokenValiditySeconds:e.idTokenValiditySeconds||3600})}async createServiceApp(e){return this.createApp({name:e.name,description:e.description,enabled:void 0===e.enabled||e.enabled,protocol:"OPENID_CONNECT",type:e.type,grantTypes:e.grantTypes,tokenEndpointAuthMethod:e.tokenEndpointAuthMethod,scopes:e.scopes,accessTokenValiditySeconds:e.accessTokenValiditySeconds||3600,refreshTokenValiditySeconds:e.refreshTokenValiditySeconds||2592e3})}async createApp(e){if(e.protocol||(e.protocol="OPENID_CONNECT"),!this.client){const e="Service not initialized. Call initialize() first.";return O.error("APP-CREATION",e),{success:!1,error:e}}try{O.info("APP-CREATION","Creating application",{name:e.name,type:e.type,protocol:e.protocol});const t=e=>Array.isArray(e)?e.map(e=>e?.toString().trim()).filter(e=>!!e).map(e=>e.toLowerCase().startsWith("urn:")||e.toLowerCase().includes("urn:")?e:e.toUpperCase()):void 0,r={...e,grantTypes:t(e.grantTypes),responseTypes:t(e.responseTypes),tokenEndpointAuthMethod:e.tokenEndpointAuthMethod?e.tokenEndpointAuthMethod.toUpperCase():void 0},n=await U(this.client,"/applications",{method:"POST",body:JSON.stringify(r)});return O.success("APP-CREATION","Application created successfully",{appId:n.id,appName:n.name,clientId:n.clientId}),{success:!0,app:n}}catch(t){const r=t instanceof Error?t.message:"Unknown error occurred";return O.error("APP-CREATION","Failed to create application",{error:r,appData:{name:e.name,type:e.type}}),{success:!1,error:r}}}async getApplications(e=50){if(!this.client)throw new Error("Service not initialized. Call initialize() first.");try{const t=await U(this.client,`/applications?limit=${e}`);return t._embedded?.applications||t.applications||[]}catch(t){throw O.error("APP-CREATION","Failed to get applications",t),t}}async updateApplication(e,t){if(!this.client){const e="Service not initialized. Call initialize() first.";return O.error("APP-CREATION",e),{success:!1,error:e}}try{O.info("APP-CREATION","Updating application",{appId:e,updates:Object.keys(t)});const r=e=>Array.isArray(e)?e.map(e=>e?.toString().trim()).filter(e=>!!e).map(e=>e.toLowerCase().startsWith("urn:")||e.toLowerCase().includes("urn:")?e:e.toUpperCase()):void 0,n={...t,protocol:"OPENID_CONNECT",grantTypes:r(t.grantTypes),responseTypes:r(t.responseTypes),redirectUris:t.redirectUris,tokenEndpointAuthMethod:t.tokenEndpointAuthMethod?t.tokenEndpointAuthMethod.toUpperCase():void 0};Object.keys(n).forEach(e=>{void 0===n[e]&&delete n[e]});const i=await U(this.client,`/applications/${e}`,{method:"PUT",body:JSON.stringify(n)});return O.success("APP-CREATION","Application updated successfully",{appId:i.id,appName:i.name,clientId:i.clientId}),{success:!0,app:i}}catch(r){const t=r instanceof Error?r.message:"Unknown error occurred";return O.error("APP-CREATION","Failed to update application",{error:t,appId:e}),{success:!1,error:t}}}async deleteApplication(e){if(!this.client)throw new Error("Service not initialized. Call initialize() first.");try{return await U(this.client,`/applications/${e}`,{method:"DELETE"}),O.success("APP-CREATION","Application deleted",{appId:e}),!0}catch(t){return O.error("APP-CREATION","Failed to delete application",{appId:e,error:t}),!1}}}const ct=new dt,pt=Object.freeze(Object.defineProperty({__proto__:null,PingOneAppCreationService:dt,pingOneAppCreationService:ct},Symbol.toStringTag,{value:"Module"})),ht=({size:e=14,style:r={}})=>t.jsxs("svg",{width:e,height:e,viewBox:"0 0 24 24",style:{display:"inline-block",marginRight:"4px",...r},children:[t.jsx("rect",{width:"24",height:"24",fill:"#dc2626",rx:"2"}),t.jsx("text",{x:"12",y:"16",textAnchor:"middle",fill:"white",fontSize:"12",fontWeight:"bold",fontFamily:"sans-serif",children:"P1"})]}),ut=e=>{const t=JSON.stringify(e);if(t.length>80){if(Array.isArray(e)&&e.length>3){return`[${e.slice(0,2).map(e=>JSON.stringify(e)).join(", ")}, ...+${e.length-2} more]`}if("string"==typeof e&&e.length>60)return`"${e.substring(0,57)}..."`}return t},mt=E.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
`,gt=E.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
`,ft=E.p`
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
`,xt=E.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 1rem 0;
`,bt=E.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  border: none;
  background: ${({$variant:e})=>"secondary"===e?"#e5e7eb":"#2563eb"};
  color: ${({$variant:e})=>"secondary"===e?"#1f2937":"#ffffff"};
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease;
  font-size: 0.875rem;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${({$variant:e})=>"secondary"===e?"#d1d5db":"#1e40af"};
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`,yt=E.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`,jt=E.div`
  width: ${e=>e.$isMinimized?"300px":"min(1000px, calc(100vw - 2rem))"};
  max-height: ${e=>e.$isMinimized?"auto":"calc(100vh - 4rem)"};
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
  padding: ${e=>e.$isMinimized?"0.75rem":"1.5rem"};
  display: flex;
  flex-direction: column;
  gap: ${e=>e.$isMinimized?"0.5rem":"1.25rem"};
  overflow: hidden;
  position: ${e=>e.$isMinimized?"fixed":"relative"};
  top: ${e=>e.$isMinimized?`${e.$position.y}px`:"auto"};
  left: ${e=>e.$isMinimized?`${e.$position.x}px`:"auto"};
  cursor: ${e=>e.$isDragging?"grabbing":"default"};
  transition: ${e=>e.$isDragging?"none":"all 0.2s ease"};
  z-index: 1001;
`,vt=E.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #cbd5e1;
  margin: ${e=>e.$isMinimized?"-0.75rem -0.75rem 0.5rem -0.75rem":"-1.5rem -1.5rem 1.25rem -1.5rem"};
  padding: ${e=>e.$isMinimized?"0.75rem":"1.5rem"};
  border-radius: ${e=>e.$isMinimized?"0.75rem":"0.75rem 0.75rem 0 0"};
`;E.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: grab;
  user-select: none;
  flex: 1;
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f1f5f9;
  }
  
  &:active {
    cursor: grabbing;
  }
`,E.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,E.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  
  &:hover {
    background-color: #f1f5f9;
    color: #334155;
  }
  
  &:active {
    transform: scale(0.95);
  }
`,E.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
`,E.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;const wt=E.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({$tone:e})=>"warning"===e?"rgba(251, 191, 36, 0.2)":"rgba(16, 185, 129, 0.2)"};
  color: ${({$tone:e})=>"warning"===e?"#92400e":"#065f46"};
  margin-top: 0.5rem;
`,kt=E.pre`
  margin: 0;
  padding: 1.25rem;
  background: #ffffff;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #1e293b;
  
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`,Ct=E.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`,St=E.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 60vh;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`,It=E.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 0.5rem;
  background: ${({$change:e})=>"added"===e?"rgba(16, 185, 129, 0.08)":"removed"===e?"rgba(239, 68, 68, 0.08)":"rgba(251, 191, 36, 0.08)"};
  border: 1px solid ${({$change:e})=>"added"===e?"rgba(16, 185, 129, 0.3)":"removed"===e?"rgba(239, 68, 68, 0.3)":"rgba(251, 191, 36, 0.3)"};
  transition: all 0.2s ease;

  &:hover {
    background: ${({$change:e})=>"added"===e?"rgba(16, 185, 129, 0.12)":"removed"===e?"rgba(239, 68, 68, 0.12)":"rgba(251, 191, 36, 0.12)"};
    border-color: ${({$change:e})=>"added"===e?"rgba(16, 185, 129, 0.4)":"removed"===e?"rgba(239, 68, 68, 0.4)":"rgba(251, 191, 36, 0.4)"};
  }
`;E.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`,E.div`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`,E.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;const At=E.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.625rem 0.75rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.75rem;
  color: #1e293b;
  line-height: 1.5;
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &::-webkit-scrollbar {
    height: 4px;
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`,Et=E.span`
  font-weight: 600;
  font-size: 0.8125rem;
  color: #0f172a;
  text-transform: capitalize;
  letter-spacing: 0.01em;
  margin-bottom: 0.5rem;
  display: inline-block;
`,zt=E.span`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  background: ${({$change:e})=>"added"===e?"rgba(16, 185, 129, 0.15)":"removed"===e?"rgba(239, 68, 68, 0.15)":"rgba(251, 191, 36, 0.15)"};
  color: ${({$change:e})=>"added"===e?"#047857":"removed"===e?"#dc2626":"#d97706"};
  border: 1px solid ${({$change:e})=>"added"===e?"rgba(16, 185, 129, 0.3)":"removed"===e?"rgba(239, 68, 68, 0.3)":"rgba(251, 191, 36, 0.3)"};
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: capitalize;
`,Rt=({formData:n,selectedAppType:o="OIDC_WEB_APP",workerToken:a,environmentId:l,region:d="NA",isCreating:p=!1,onCreateApplication:x,onImportConfig:b,onGenerateWorkerToken:y})=>{const[j,v]=e.useState(!1),[w,k]=e.useState(null),[C,S]=e.useState(null),[I,A]=e.useState(!1),[E,z]=e.useState(!1),[R,_]=e.useState(!1),[T,P]=e.useState(null),[U,F]=e.useState(!1),[M,D]=e.useState(null),[N,W]=e.useState(new Set),[K,q]=e.useState(!0),[J,B]=e.useState(!1),[H,V]=e.useState(!1),[G,Y]=e.useState(()=>({name:(e=>{if(!e){return`pingone-app-${Math.floor(900*Math.random())+100}`}return`pingone-${{OIDC_WEB_APP:"authorization-code",OIDC_NATIVE_APP:"authorization-code",SINGLE_PAGE_APP:"implicit",WORKER:"client-credentials",SERVICE:"client-credentials"}[e]||e.replace(/[-_]/g,"-").toLowerCase()}-${Math.floor(900*Math.random())+100}`})(o),description:`Created via OAuth Playground - ${o}`,redirectUri:n.redirectUri||(e=>{if(!e){return`https://localhost:3000/callback/app-${Math.floor(900*Math.random())+100}`}return`https://localhost:3000/callback/${{OIDC_WEB_APP:"authorization-code",OIDC_NATIVE_APP:"authorization-code",SINGLE_PAGE_APP:"implicit",WORKER:"client-credentials",SERVICE:"client-credentials"}[e]||e.replace(/[-_]/g,"-").toLowerCase()}-${Math.floor(900*Math.random())+100}`})(o),tokenEndpointAuthMethod:n.tokenEndpointAuthMethod||"client_secret_basic",responseTypes:n.responseTypes||["code"],grantTypes:n.grantTypes||["authorization_code"],refreshTokenEnabled:!0})),X=e.useMemo(()=>{const e=n.grantTypes;if(e?.some(e=>"client_credentials"===e.toLowerCase()))return"client-credentials";if(e?.some(e=>"authorization_code"===e.toLowerCase())&&e.some(e=>"implicit"===e.toLowerCase()))return"hybrid";return{WORKER:"client-credentials",OIDC_WEB_APP:"authorization-code",SINGLE_PAGE_APP:"implicit",NATIVE_APP:"authorization-code",SERVICE:"client-credentials"}[o||""]||o},[o,n.grantTypes]),Q=e.useMemo(()=>{const e=n.clientId,t=n.clientSecret;return new lt(a,l,d,e,t,X)},[a,l,d,n.clientId,n.clientSecret,X]),Z=(e=>{switch(e){case"OIDC_WEB_APP":case"OIDC_NATIVE_APP":default:return["client_secret_basic","client_secret_post","client_secret_jwt","private_key_jwt","none"];case"SINGLE_PAGE_APP":case"implicit-oauth-v7":case"implicit-oidc-v7":return["none"];case"WORKER":case"SERVICE":return["client_secret_basic","client_secret_post","client_secret_jwt","private_key_jwt"]}})(o),ee=Z.length>1,te=e.useMemo(()=>{if("WORKER"===o||"SERVICE"===o)return!1;const e=G.grantTypes||n.grantTypes;if(!e||0===e.length)return!0;const t=["authorization_code","implicit"],r=["client_credentials","urn:ietf:params:oauth:grant-type:device_code","urn:openid:params:grant-type:ciba","password"],i=e.some(e=>t.includes(e.toLowerCase())),s=e.every(e=>r.includes(e)||r.some(t=>e.toLowerCase().includes(t.toLowerCase())));return!!i||!(s&&e.length>0)},[o,n.grantTypes,G.grantTypes]),re=async()=>{k("refresh"),D(null),$.showInfo("Refreshing configuration from PingOne..."),await new Promise(e=>setTimeout(e,500)),k("check"),await ne()},ne=async()=>{const e=n.clientId;if(e){if(J&&!H&&y){V(!0),B(!1);try{y(),$.showInfo("Worker token refreshed! Proceeding with config check..."),await new Promise(e=>setTimeout(e,2e3))}catch(t){$.showError("Failed to refresh worker token. Proceeding with existing token...")}}k("check"),O.info("CONFIG-CHECKER","Starting configuration check",{clientId:e,selectedAppType:o,hasWorkerToken:!!a,workerTokenLength:a?.length||0});try{const t=Date.now(),r=await Q.compare(e,n),i=Date.now()-t;S(r),v(!0),D(Date.now()),W(new Set(r.diffs.map(e=>e.path))),r.hasDiffs?O.info("CONFIG-CHECKER","Configuration check completed - differences found",{clientId:e,selectedAppType:o,elapsed:i,diffCount:r.diffs.length}):($.showSuccess("No differences detected."),O.info("CONFIG-CHECKER","Configuration check completed - no differences",{clientId:e,selectedAppType:o,elapsed:i}))}catch(t){const r=t instanceof Error?t.message:String(t);r.includes("Failed to fetch")||r.includes("401")||r.includes("Unauthorized")?(localStorage.removeItem("worker_token"),localStorage.removeItem("worker_token_expires_at"),$.showError("Worker token expired. Please generate a new worker token.",{duration:8e3}),z(!0),O.error("CONFIG-CHECKER","Authentication failed - worker token expired or invalid",{clientId:e,selectedAppType:o,error:r})):r.includes("CORS")||r.includes("Access-Control-Allow-Origin")?($.showError("Network error. Please check your connection and try again.",{duration:6e3}),O.error("CONFIG-CHECKER","CORS/Network error",{clientId:e,selectedAppType:o,error:r})):($.showError(`Configuration check failed: ${r}`),O.error("CONFIG-CHECKER","Configuration check failed",{clientId:e,selectedAppType:o,error:r}))}finally{k(null)}}else $.showError("Enter a client ID before checking.")},ie=()=>{v(!1),S(null),b&&setTimeout(()=>{window.location.reload()},100)};return t.jsxs(t.Fragment,{children:[t.jsxs(mt,{children:[t.jsxs(gt,{children:[t.jsx(i,{size:20}),"PingOne Configuration Checker"]}),t.jsxs(ft,{children:[t.jsx("strong",{children:"Check Config:"})," Compare your current flow settings with existing PingOne applications to identify differences.",t.jsx("br",{}),t.jsx("strong",{children:"Create App:"})," Automatically create a new PingOne application with your current configuration."]})]}),t.jsx(xt,{children:t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"},children:[t.jsxs(bt,{onClick:ne,disabled:!a||null!==w||p,style:{background:"#3b82f6",color:"white",border:"1px solid #3b82f6",fontWeight:"600"},children:["check"===w&&t.jsx(h,{className:"spinner"}),"Check Config"]}),y&&!H&&t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem",background:"#fef3c7",borderRadius:"0.375rem",border:"1px solid #f59e0b"},children:[t.jsx("input",{type:"checkbox",id:"refresh-worker-token",checked:J,onChange:e=>B(e.target.checked),disabled:null!==w||p,style:{margin:0}}),t.jsxs("label",{htmlFor:"refresh-worker-token",style:{fontSize:"0.875rem",color:"#92400e",fontWeight:"500",cursor:"pointer",margin:0},children:[t.jsx(u,{size:14,style:{marginRight:"0.25rem"}}),"Refresh worker token (one-time)"]})]}),H&&t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem",background:"#f3f4f6",borderRadius:"0.375rem",border:"1px solid #d1d5db"},children:[t.jsx(s,{size:14,color:"#10b981"}),t.jsx("span",{style:{fontSize:"0.875rem",color:"#6b7280"},children:"Worker token refreshed"})]}),M&&t.jsxs(bt,{onClick:re,disabled:!a||null!==w||p,style:{background:"#06b6d4",color:"white",border:"1px solid #06b6d4",fontWeight:"600"},title:`Last checked: ${new Date(M).toLocaleTimeString()}`,children:["refresh"===w&&t.jsx(h,{className:"spinner"}),"Refresh"]}),t.jsxs(bt,{onClick:()=>{if(!x)return void $.showError("Application creation not available.");const e=n.grantTypes;Y({name:((e,t)=>{if(t&&t.some(e=>"client_credentials"===e.toLowerCase())){return`pingone-client-credentials-${Math.floor(900*Math.random())+100}`}return`pingone-${{OIDC_WEB_APP:"authorization-code",OIDC_NATIVE_APP:"authorization-code",SINGLE_PAGE_APP:"implicit",WORKER:"client-credentials",SERVICE:"client-credentials"}[e]||e.replace(/[-_]/g,"-").toLowerCase()}-${Math.floor(900*Math.random())+100}`})(o,e),description:`Created via OAuth Playground - ${o}`,redirectUri:n.redirectUri||((e,t)=>{if(t&&t.some(e=>"client_credentials"===e.toLowerCase())){return`https://localhost:3000/callback/client-credentials-${Math.floor(900*Math.random())+100}`}return`https://localhost:3000/callback/${{OIDC_WEB_APP:"authorization-code",OIDC_NATIVE_APP:"authorization-code",SINGLE_PAGE_APP:"implicit",WORKER:"client-credentials",SERVICE:"client-credentials"}[e]||e.replace(/[-_]/g,"-").toLowerCase()}-${Math.floor(900*Math.random())+100}`})(o,e),tokenEndpointAuthMethod:n.tokenEndpointAuthMethod||"client_secret_basic",responseTypes:n.responseTypes||["code"],grantTypes:e||["authorization_code"]}),A(!0)},disabled:null!==w||p,style:{background:"#22c55e",color:"white",border:"1px solid #22c55e",fontWeight:"600"},children:["create"===w&&t.jsx(h,{className:"spinner"}),"Create App"]}),t.jsxs(bt,{onClick:()=>{y?y():$.showInfo("Please go to the Client Generator to create a new worker token.")},style:{background:"#f59e0b",color:"white",border:"1px solid #f59e0b",fontWeight:"600"},children:[t.jsx(u,{}),"Get New Worker Token"]})]})}),t.jsxs(L,{isOpen:j,onClose:ie,title:"PingOne Configuration Differences",headerContent:C&&t.jsxs(wt,{$tone:C.hasDiffs?"warning":"success",children:[C.hasDiffs?t.jsx(i,{}):t.jsx(s,{}),C.hasDiffs?"Differences detected":"No differences"]}),children:[n.clientId&&t.jsxs("div",{style:{background:"linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",border:"1px solid #bfdbfe",borderRadius:"0.75rem",padding:"1.125rem 1.5rem",display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.5rem"},children:[t.jsx("div",{style:{background:"#3b82f6",color:"white",padding:"0.625rem",borderRadius:"0.5rem",fontSize:"1.5rem",display:"flex",alignItems:"center",justifyContent:"center",minWidth:"48px",height:"48px"},children:t.jsx(u,{size:24})}),t.jsxs("div",{style:{flex:1,minWidth:0},children:[t.jsx("div",{style:{fontSize:"0.8125rem",fontWeight:"600",color:"#1e40af",marginBottom:"0.375rem",letterSpacing:"0.01em"},children:"PingOne Client ID"}),t.jsx("div",{style:{fontFamily:"'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",fontSize:"0.875rem",color:"#1e293b",wordBreak:"break-all",lineHeight:1.5},children:n.clientId})]}),t.jsxs(bt,{onClick:()=>{navigator.clipboard.writeText(String(n.clientId)),$.showSuccess("Client ID copied to clipboard")},style:{background:"#3b82f6",color:"#ffffff",border:"1px solid #2563eb",padding:"0.625rem 1rem",fontSize:"0.8125rem"},children:[t.jsx(m,{size:14}),"Copy"]})]}),C&&!C.hasDiffs&&t.jsxs("div",{style:{background:"linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",border:"1px solid #86efac",borderRadius:"0.75rem",padding:"2rem",textAlign:"center",marginBottom:"1.5rem"},children:[t.jsx(s,{size:48,style:{color:"#16a34a",marginBottom:"1rem",display:"block",margin:"0 auto 1rem"}}),t.jsx("h3",{style:{margin:"0 0 0.5rem 0",fontSize:"1.125rem",fontWeight:600,color:"#166534"},children:"Configuration Match ✓"}),t.jsx("p",{style:{margin:0,fontSize:"0.875rem",color:"#15803d"},children:"Your application configuration matches PingOne. No differences detected."})]}),C?.hasDiffs&&t.jsxs(St,{children:[t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:"0.75rem",borderBottom:"1px solid #e2e8f0",marginBottom:"0.75rem"},children:[t.jsxs("h4",{style:{margin:0,fontSize:"0.9375rem",fontWeight:600,color:"#0f172a"},children:["Differences Found (",N.size," of ",C.diffs.length," selected)"]}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[t.jsx(bt,{onClick:()=>{C&&W(new Set(C.diffs.map(e=>e.path)))},$variant:"secondary",style:{padding:"0.5rem 0.875rem",fontSize:"0.8125rem",background:"#3b82f6",color:"#ffffff",border:"1px solid #2563eb"},children:"Select All"}),t.jsx(bt,{onClick:()=>{W(new Set)},$variant:"secondary",style:{padding:"0.5rem 0.875rem",fontSize:"0.8125rem",background:"#3b82f6",color:"#ffffff",border:"1px solid #2563eb"},children:"Deselect All"})]})]}),C.diffs.map((e,r)=>t.jsx(It,{$change:e.change,children:t.jsxs("label",{style:{display:"flex",alignItems:"flex-start",width:"100%",cursor:"pointer",gap:"0.75rem"},children:[t.jsx("input",{type:"checkbox",checked:N.has(e.path),onChange:()=>{return t=e.path,void W(e=>{const r=new Set(e);return r.has(t)?r.delete(t):r.add(t),r});var t},style:{width:"18px",height:"18px",marginTop:"0.25rem",cursor:"pointer",accentColor:"#3b82f6"}}),t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",gap:"0.625rem",minWidth:0},children:[t.jsx(Et,{children:e.path.replace(/([A-Z])/g," $1").trim()}),t.jsxs(At,{$isRedirectUri:"redirectUris"===e.path,children:["added"===e.change&&t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.5rem"},children:[t.jsx(ht,{size:16,style:{flexShrink:0,marginTop:"0.125rem"}}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{style:{fontSize:"0.6875rem",fontWeight:600,color:"#64748b",marginBottom:"0.25rem"},children:"PingOne"}),t.jsx("div",{style:{color:"#0f172a"},children:ut(e.expected)})]})]}),"removed"===e.change&&t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.5rem"},children:[t.jsx(g,{size:16,style:{flexShrink:0,marginTop:"0.125rem",color:"#3b82f6"}}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{style:{fontSize:"0.6875rem",fontWeight:600,color:"#64748b",marginBottom:"0.25rem"},children:"Our App"}),t.jsx("div",{style:{color:"#0f172a"},children:ut(e.actual)})]})]}),"mismatch"===e.change&&t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.5rem",marginBottom:"0.75rem"},children:[t.jsx(ht,{size:16,style:{flexShrink:0,marginTop:"0.125rem"}}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{style:{fontSize:"0.6875rem",fontWeight:600,color:"#64748b",marginBottom:"0.25rem"},children:"PingOne"}),t.jsx("div",{style:{color:"#0f172a"},children:ut(e.expected)})]})]}),t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.5rem",paddingTop:"0.75rem",borderTop:"1px solid #e2e8f0"},children:[t.jsx(g,{size:16,style:{flexShrink:0,marginTop:"0.125rem",color:"#3b82f6"}}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{style:{fontSize:"0.6875rem",fontWeight:600,color:"#64748b",marginBottom:"0.25rem"},children:"Our App"}),t.jsx("div",{style:{color:"#0f172a"},children:ut(e.actual)})]})]})]})]})]}),t.jsx(zt,{$change:e.change,children:"mismatch"===e.change?"Mismatch":e.change})]})},r))]}),C&&t.jsxs("div",{style:{marginTop:"1.5rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.75rem",padding:"0.875rem 1rem",background:"#f8fafc",borderRadius:"0.5rem",border:"1px solid #e2e8f0"},children:[t.jsx("h4",{style:{margin:0,fontSize:"0.875rem",fontWeight:600,color:"#0f172a"},children:"Raw JSON Data"}),t.jsx(bt,{onClick:()=>q(!K),$variant:"secondary",style:{padding:"0.5rem 0.875rem",fontSize:"0.8125rem",background:"#3b82f6",color:"#ffffff",border:"1px solid #2563eb"},children:K?"Show JSON":"Hide JSON"})]}),!K&&t.jsx(kt,{style:{maxHeight:"400px",marginTop:"0.5rem"},children:JSON.stringify(C,null,2)})]}),t.jsxs(Ct,{children:[t.jsxs("div",{style:{marginBottom:"1rem",padding:"0.75rem",backgroundColor:"#f8fafc",borderRadius:"0.5rem",border:"1px solid #e2e8f0"},children:[t.jsx("h4",{style:{margin:"0 0 0.5rem 0",fontSize:"0.8rem",fontWeight:"600",color:"#374151",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Data Management"}),t.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem"},children:[t.jsxs(bt,{onClick:async()=>{if(C)try{await navigator.clipboard.writeText(JSON.stringify(C,null,2)),$.showSuccess("Configuration differences copied to clipboard")}catch(e){$.showError("Failed to copy to clipboard")}},disabled:!C,style:{background:"#3b82f6",color:"white",border:"1px solid #3b82f6",fontWeight:"600"},children:[t.jsx(m,{})," Copy JSON"]}),b&&C&&t.jsxs(bt,{onClick:()=>{if(!C||!b)return;const e={clientId:n.clientId,environmentId:n.environmentId,redirectUri:Array.isArray(C.normalizedRemote.redirectUris)?C.normalizedRemote.redirectUris[0]:n.redirectUri,scopes:Array.isArray(C.normalizedRemote.scopes)?C.normalizedRemote.scopes.join(" "):n.scopes,tokenEndpointAuthMethod:C.normalizedRemote.tokenEndpointAuthMethod||n.tokenEndpointAuthMethod};b(e),$.showSuccess("Configuration imported successfully!"),v(!1)},disabled:!C,style:{background:"#10b981",color:"white",border:"1px solid #10b981",fontWeight:"600"},children:[t.jsx(c,{})," Import Config"]}),C?.hasDiffs&&t.jsxs(bt,{onClick:async()=>{if(C&&C.normalizedRemote)try{F(!0);const e={metadata:{exportedAt:(new Date).toISOString(),source:"PingOne Application",environmentId:l,clientId:n.clientId,flowType:X,version:"1.0"},pingOneConfig:C.normalizedRemote,localConfig:C.normalizedDesired,differences:C.diffs},t=JSON.stringify(e,null,2),r=new Blob([t],{type:"application/json"}),i=URL.createObjectURL(r),o=document.createElement("a");o.href=i,o.download=`pingone-config-${n.clientId}-${(new Date).toISOString().split("T")[0]}.json`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i),$.showSuccess("PingOne configuration exported successfully!")}catch(e){$.showError(`Failed to export configuration: ${e instanceof Error?e.message:"Unknown error"}`)}finally{F(!1)}else $.showError("No PingOne configuration available to export")},disabled:U,style:{background:"#10b981",color:"white",border:"1px solid #10b981",fontWeight:"600"},children:[U&&t.jsx(h,{className:"spinner"}),t.jsx(c,{})," Export Config"]})]})]}),C?.hasDiffs&&t.jsxs("div",{style:{marginBottom:"1rem",padding:"0.75rem",backgroundColor:"#fef3c7",borderRadius:"0.5rem",border:"1px solid #fbbf24"},children:[t.jsx("h4",{style:{margin:"0 0 0.5rem 0",fontSize:"0.8rem",fontWeight:"600",color:"#92400e",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Update Actions"}),t.jsxs("div",{style:{padding:"0.75rem",background:"#fef3c7",borderRadius:"0.5rem",marginBottom:"1rem",border:"1px solid #f59e0b"},children:[t.jsx("p",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",color:"#92400e",fontWeight:"600"},children:"⚠️ Update Limitations"}),t.jsxs("p",{style:{margin:"0",fontSize:"0.8rem",color:"#92400e"},children:[t.jsx("strong",{children:"Update Our App:"})," Updates all selected fields in your local configuration",t.jsx("br",{}),t.jsx("strong",{children:"Update PingOne:"})," Only updates redirect URIs, token auth method, and scopes for safety"]})]}),t.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.75rem"},children:[t.jsxs(bt,{onClick:async()=>{if(C&&C.hasDiffs)if(0!==N.size){F(!0);try{const e={};if(N.has("grantTypes")&&(e.grantTypes=C.normalizedRemote.grantTypes||[]),N.has("tokenEndpointAuthMethod")&&(e.tokenEndpointAuthMethod=C.normalizedRemote.tokenEndpointAuthMethod||"client_secret_basic"),N.has("scopes")&&(e.scopes=C.normalizedRemote.scopes||[]),N.has("pkceEnforcement")&&(e.pkceEnforcement=C.normalizedRemote.pkceEnforcement||"OPTIONAL"),N.has("redirectUris")&&(e.redirectUris=C.normalizedRemote.redirectUris||[]),N.has("postLogoutRedirectUris")&&(e.postLogoutRedirectUris=C.normalizedRemote.postLogoutRedirectUris||[]),N.has("responseTypes")&&(e.responseTypes=C.normalizedRemote.responseTypes||[]),!b)throw new Error("Import configuration callback not available");{b(e);const t=N.size,r=1===t?"field":"fields";$.showSuccess(`Successfully updated ${t} ${r} in Our App with PingOne values!`),W(new Set),setTimeout(()=>{re()},1e3)}}catch(e){$.showError(`Failed to update Our App: ${e instanceof Error?e.message:"Unknown error"}`)}finally{F(!1)}}else $.showWarning("Please select at least one field to update")},disabled:U||0===N.size,style:{background:0===N.size?"#9ca3af":"#8b5cf6",color:"white",border:0===N.size?"1px solid #9ca3af":"1px solid #8b5cf6",fontWeight:"600"},children:[U&&t.jsx(h,{className:"spinner"}),t.jsx(g,{})," Update Our App (",N.size," selected)"]}),t.jsxs(bt,{onClick:async()=>{if(C&&C.hasDiffs)if(0!==N.size){F(!0);try{ct.initialize(a,l,d);const e=n.clientId;if(!e)return void $.showError("Client ID is required to update configuration");const t=(await ct.getApplications()).find(t=>t.clientId===e);if(!t)return void $.showError("Application not found in PingOne");const r={};N.has("redirectUris")&&te&&(r.redirectUris=n.redirectUris||[]),N.has("tokenEndpointAuthMethod")&&(r.tokenEndpointAuthMethod=n.tokenEndpointAuthMethod||"client_secret_basic"),N.has("scopes")&&(r.scopes=n.scopes||[]);if(["grantTypes","pkceEnforcement","postLogoutRedirectUris","responseTypes"].some(e=>N.has(e)))return void $.showWarning("Only redirect URIs, token auth method, and scopes can be updated in PingOne for safety. Other fields are read-only.");const i=await ct.updateApplication(t.id,r);if(i.success){const e=N.size,t=1===e?"field":"fields";$.showSuccess(`Successfully updated ${e} ${t} in PingOne!`),v(!1),S(null),W(new Set),setTimeout(()=>{ne()},1e3)}else $.showError(`Failed to update application: ${i.error}`)}catch(e){$.showError(`Failed to update application: ${e instanceof Error?e.message:"Unknown error"}`)}finally{F(!1)}}else $.showWarning("Please select at least one field to update")},disabled:U||0===N.size,style:{background:0===N.size?"#9ca3af":"#f59e0b",color:"white",border:0===N.size?"1px solid #9ca3af":"1px solid #f59e0b",fontWeight:"600"},children:[U&&t.jsx(h,{className:"spinner"}),t.jsx(f,{})," Update PingOne (Safe Fields Only) (",N.size," selected)"]})]})]}),t.jsx(bt,{onClick:ie,style:{background:"#3b82f6",color:"#ffffff",border:"1px solid #2563eb",fontWeight:"600"},children:"Close"})]})]}),t.jsxs(L,{isOpen:I,onClose:()=>A(!1),title:"Create PingOne Application",children:[t.jsxs("div",{style:{padding:"1rem",display:"flex",flexDirection:"column",gap:"0.75rem",maxHeight:"calc(100vh - 8rem)",overflowY:"auto"},children:[t.jsxs("div",{children:[t.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:"600",color:"#374151"},children:"Application Name *"}),t.jsx("input",{type:"text",value:G.name,onChange:e=>Y(t=>({...t,name:e.target.value})),placeholder:"Enter application name",style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.875rem",outline:"none",transition:"border-color 0.2s"},onFocus:e=>e.target.style.borderColor="#3b82f6",onBlur:e=>e.target.style.borderColor="#d1d5db"})]}),t.jsxs("div",{children:[t.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:"600",color:"#374151"},children:"Description"}),t.jsx("textarea",{value:G.description,onChange:e=>Y(t=>({...t,description:e.target.value})),placeholder:"Enter application description",rows:3,style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.875rem",outline:"none",resize:"vertical",transition:"border-color 0.2s"},onFocus:e=>e.target.style.borderColor="#3b82f6",onBlur:e=>e.target.style.borderColor="#d1d5db"})]}),te&&t.jsxs("div",{children:[t.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:"600",color:"#374151"},children:"Redirect URI *"}),t.jsx("input",{type:"url",value:G.redirectUri,onChange:e=>Y(t=>({...t,redirectUri:e.target.value})),placeholder:"http://localhost:3000/callback",style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.875rem",outline:"none",transition:"border-color 0.2s"},onFocus:e=>e.target.style.borderColor="#3b82f6",onBlur:e=>e.target.style.borderColor="#d1d5db"})]}),ee&&t.jsxs("div",{children:[t.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:"600",color:"#374151"},children:"Token Endpoint Authentication Method"}),t.jsx("select",{value:G.tokenEndpointAuthMethod,onChange:e=>Y(t=>({...t,tokenEndpointAuthMethod:e.target.value})),style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.875rem",outline:"none",background:"white",transition:"border-color 0.2s"},onFocus:e=>e.target.style.borderColor="#3b82f6",onBlur:e=>e.target.style.borderColor="#d1d5db",children:Z.map(e=>t.jsxs("option",{value:e,children:["client_secret_basic"===e&&"Client Secret Basic","client_secret_post"===e&&"Client Secret Post","client_secret_jwt"===e&&"Client Secret JWT","private_key_jwt"===e&&"Private Key JWT","none"===e&&"None (Public Client)"]},e))})]}),!ee&&t.jsxs("div",{style:{background:"#f0f9ff",padding:"0.75rem",borderRadius:"0.5rem",border:"1px solid #bae6fd",fontSize:"0.875rem",color:"#0c4a6e"},children:[t.jsx("strong",{children:"Token Authentication:"})," ","SINGLE_PAGE_APP"===o?"None (Public Client)":"Client Secret Basic",t.jsx("br",{}),t.jsx("em",{children:"This app type only supports one authentication method."})]}),t.jsxs("div",{style:{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"0.75rem",padding:"1.5rem",marginTop:"1rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"1.5rem"},children:[t.jsx("h4",{style:{margin:0,fontSize:"1rem",fontWeight:"600",color:"#1f2937"},children:"OIDC Settings"}),t.jsx("span",{style:{fontSize:"0.875rem",color:"#6b7280"},children:"Configure OIDC settings for the application"})]}),t.jsxs("div",{style:{marginBottom:"1.5rem"},children:[t.jsx("label",{style:{display:"block",marginBottom:"0.75rem",fontWeight:"600",color:"#374151",fontSize:"0.875rem"},children:"Response Type *"}),t.jsxs("select",{value:G.responseTypes.length>0?G.responseTypes[0]:"code",onChange:e=>{Y(t=>({...t,responseTypes:[e.target.value]}))},style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.875rem",outline:"none",background:"white",transition:"border-color 0.2s"},onFocus:e=>e.target.style.borderColor="#3b82f6",onBlur:e=>e.target.style.borderColor="#d1d5db",children:[t.jsx("option",{value:"code",children:"code (Authorization Code)"}),t.jsx("option",{value:"token",children:"token (Implicit OAuth)"}),t.jsx("option",{value:"id_token",children:"id_token (Implicit OIDC)"}),t.jsx("option",{value:"id_token token",children:"id_token token (Implicit OIDC)"}),t.jsx("option",{value:"code id_token",children:"code id_token (Hybrid)"}),t.jsx("option",{value:"code token",children:"code token (Hybrid)"}),t.jsx("option",{value:"code id_token token",children:"code id_token token (Hybrid)"})]}),t.jsx("div",{style:{marginTop:"0.5rem",fontSize:"0.75rem",color:"#6b7280",fontStyle:"italic"},children:"Select the OAuth/OIDC response type for this application"})]}),t.jsxs("div",{style:{marginBottom:"1.5rem"},children:[t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem",fontWeight:"600",color:"#374151",fontSize:"0.875rem"},children:[t.jsx("input",{type:"checkbox",checked:G.refreshTokenEnabled,onChange:e=>{Y(t=>({...t,refreshTokenEnabled:e.target.checked}))},style:{margin:0}}),t.jsx("span",{children:"Enable Refresh Token"})]}),t.jsxs("div",{style:{marginTop:"0.5rem",padding:"0.75rem",background:"#f8fafc",borderRadius:"0.5rem",border:"1px solid #e2e8f0",fontSize:"0.75rem",color:"#475569"},children:[t.jsx("strong",{children:"Note:"})," Refresh tokens are not a grant type. They are automatically returned by the authorization server when using ",t.jsx("code",{children:"authorization_code"})," or"," ",t.jsx("code",{children:"client_credentials"})," grant types. This setting controls whether your app configuration supports refresh tokens."]})]}),t.jsxs("div",{children:[t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"0.25rem",marginBottom:"0.75rem",fontWeight:"600",color:"#374151",fontSize:"0.875rem"},children:["Grant Type",t.jsx("span",{style:{background:"#f3f4f6",color:"#6b7280",borderRadius:"50%",width:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",cursor:"help"},children:"?"})]}),t.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:"0.5rem"},children:["authorization_code","implicit","client_credentials","urn:ietf:params:oauth:grant-type:device_code","urn:openid:params:grant-type:ciba"].map(e=>{const r=["authorization_code","implicit","client_credentials","urn:ietf:params:oauth:grant-type:device_code","urn:openid:params:grant-type:ciba"].includes(e);return t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem",borderRadius:"0.5rem",background:r?"white":"#f3f4f6",border:r?"1px solid #d1d5db":"1px solid #e5e7eb",cursor:r?"pointer":"not-allowed",opacity:r?1:.5},children:[t.jsx("input",{type:"checkbox",checked:G.grantTypes.includes(e),onChange:t=>{if(!r)return;const n=t.target.checked?[...G.grantTypes,e]:G.grantTypes.filter(t=>t!==e);Y(e=>({...e,grantTypes:n}))},disabled:!r,style:{margin:0}}),t.jsx("span",{style:{textTransform:"capitalize",fontSize:"0.875rem",fontWeight:"500",flex:1},children:"urn:openid:params:grant-type:ciba"===e?"CIBA":"urn:ietf:params:oauth:grant-type:device_code"===e?"Device Authorization":e.replace("_"," ")}),("urn:ietf:params:oauth:grant-type:device_code"===e||"urn:openid:params:grant-type:ciba"===e)&&t.jsx("span",{style:{background:"#f3f4f6",color:"#6b7280",borderRadius:"50%",width:"16px",height:"16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",cursor:"help",flexShrink:0},title:"urn:openid:params:grant-type:ciba"===e?"CIBA (RFC 9436): Client Initiated Backchannel Authentication - Enables decoupled authentication where the user approves on a different device":"Device Authorization Flow (RFC 8628): For input-constrained devices like smart TVs, printers, IoT devices, gaming consoles, etc.",children:"?"})]},e)})})]})]}),t.jsxs("div",{style:{background:"#f8fafc",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #e2e8f0",fontSize:"0.875rem",color:"#64748b"},children:[t.jsx("strong",{children:"Application Type:"})," ",o,t.jsx("br",{}),t.jsx("strong",{children:"Client ID:"})," ",n.clientId,t.jsx("br",{}),t.jsx("strong",{children:"Environment:"})," ",l]})]}),t.jsx(Ct,{children:t.jsxs("div",{style:{display:"flex",gap:"0.75rem"},children:[t.jsxs(bt,{onClick:async()=>{if(x){k("create"),A(!1),O.info("CONFIG-CHECKER","Starting application creation",{selectedAppType:o,createFormData:G});try{const e=Date.now(),t=await x(G),r=Date.now()-e;O.info("CONFIG-CHECKER","Application creation completed",{selectedAppType:o,elapsed:r}),t?.success&&(P(t),_(!0))}catch(e){const t=e instanceof Error?e.message:String(e);$.showError(`Application creation failed: ${t}`),O.error("CONFIG-CHECKER","Application creation failed",{selectedAppType:o,error:t})}finally{k(null)}}else $.showError("Application creation not available.")},disabled:!G.name.trim()||te&&!G.redirectUri.trim()||"create"===w,style:{background:"#22c55e",color:"white",border:"1px solid #22c55e",fontWeight:"600"},children:["create"===w&&t.jsx(h,{className:"spinner"}),t.jsx(f,{})," Create Application"]}),t.jsx(bt,{$variant:"secondary",onClick:()=>A(!1),disabled:"create"===w,children:"Cancel"})]})})]}),E&&t.jsx(yt,{onClick:()=>z(!1),children:t.jsxs(jt,{onClick:e=>e.stopPropagation(),children:[t.jsxs(vt,{children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx("div",{style:{background:"#dc2626",color:"white",padding:"0.5rem",borderRadius:"0.5rem",fontSize:"1.25rem"},children:"⚠️"}),t.jsxs("div",{children:[t.jsx("h3",{style:{margin:0,fontSize:"1.125rem",fontWeight:"600",color:"#1f2937"},children:"Authentication Failed"}),t.jsx("p",{style:{margin:"0.25rem 0 0 0",fontSize:"0.875rem",color:"#6b7280"},children:"Worker token is invalid or expired"})]})]}),t.jsx("button",{onClick:()=>z(!1),style:{background:"none",border:"none",cursor:"pointer",padding:"0.5rem",borderRadius:"0.5rem",color:"#6b7280"},children:t.jsx(r,{size:20})})]}),t.jsxs("div",{style:{padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"},children:[t.jsxs("div",{style:{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"0.5rem",padding:"1rem",color:"#991b1b"},children:[t.jsx("strong",{children:"What happened?"}),t.jsx("br",{}),"Your worker token has expired or is invalid. The Config Checker needs a valid worker token to access PingOne's Management API."]}),t.jsxs("div",{style:{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:"0.5rem",padding:"1rem",color:"#0c4a6e"},children:[t.jsx("strong",{children:"How to fix:"}),t.jsx("br",{}),"1. Go to the ",t.jsx("strong",{children:"Client Generator"})," or use the"," ",t.jsx("strong",{children:"Worker Token Modal"}),t.jsx("br",{}),"2. Generate a new worker token with appropriate scopes",t.jsx("br",{}),"3. Return here and try the Config Checker again"]})]}),t.jsxs("div",{style:{display:"flex",gap:"0.75rem",justifyContent:"flex-end",padding:"1.5rem",borderTop:"1px solid #e5e7eb"},children:[t.jsx("button",{onClick:()=>z(!1),style:{padding:"0.75rem 1.5rem",borderRadius:"0.5rem",border:"1px solid #d1d5db",background:"#ffffff",color:"#374151",cursor:"pointer",fontWeight:"600"},children:"Close"}),t.jsxs("button",{onClick:()=>{z(!1),y?y():$.showInfo("Please go to the Client Generator to create a new worker token.")},style:{padding:"0.75rem 1.5rem",borderRadius:"0.5rem",border:"none",background:"#2563eb",color:"#ffffff",cursor:"pointer",fontWeight:"600"},children:[t.jsx(u,{style:{marginRight:"0.5rem"}}),"Generate Worker Token"]})]})]})}),R&&T&&t.jsx(yt,{onClick:()=>_(!1),children:t.jsxs(jt,{onClick:e=>e.stopPropagation(),children:[t.jsxs(vt,{children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx("div",{style:{background:"#10b981",color:"white",padding:"0.5rem",borderRadius:"0.5rem",fontSize:"1.25rem"},children:"✅"}),t.jsxs("div",{children:[t.jsx("h3",{style:{margin:0,fontSize:"1.125rem",fontWeight:"600",color:"#1f2937"},children:"Application Created Successfully"}),t.jsx("p",{style:{margin:"0.25rem 0 0 0",fontSize:"0.875rem",color:"#6b7280"},children:"Your PingOne application has been created"})]})]}),t.jsx("button",{onClick:()=>_(!1),style:{background:"none",border:"none",cursor:"pointer",padding:"0.5rem",borderRadius:"0.5rem",color:"#6b7280"},children:t.jsx(r,{size:20})})]}),t.jsxs("div",{style:{padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1rem"},children:[t.jsxs("div",{style:{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:"0.5rem",padding:"1rem"},children:[t.jsx("h4",{style:{margin:"0 0 0.75rem 0",fontSize:"0.875rem",fontWeight:"600",color:"#0c4a6e"},children:"Application Details"}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem",fontSize:"0.875rem"},children:[t.jsxs("div",{style:{display:"flex",justifyContent:"space-between"},children:[t.jsx("span",{style:{color:"#6b7280"},children:"Name:"}),t.jsx("span",{style:{fontWeight:"500",color:"#1f2937"},children:T.app?.name})]}),t.jsxs("div",{style:{display:"flex",justifyContent:"space-between"},children:[t.jsx("span",{style:{color:"#6b7280"},children:"Type:"}),t.jsx("span",{style:{fontWeight:"500",color:"#1f2937"},children:T.app?.type})]}),t.jsxs("div",{style:{display:"flex",justifyContent:"space-between"},children:[t.jsx("span",{style:{color:"#6b7280"},children:"Client ID:"}),t.jsx("span",{style:{fontWeight:"500",color:"#1f2937",fontFamily:"monospace"},children:T.app?.clientId})]}),T.app?.clientSecret&&t.jsxs("div",{style:{display:"flex",justifyContent:"space-between"},children:[t.jsx("span",{style:{color:"#6b7280"},children:"Client Secret:"}),t.jsxs("span",{style:{fontWeight:"500",color:"#1f2937",fontFamily:"monospace"},children:[T.app.clientSecret.substring(0,8),"..."]})]})]})]}),t.jsxs("div",{style:{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:"0.5rem",padding:"1rem",color:"#92400e"},children:[t.jsx("h4",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:"600"},children:"Next Steps"}),t.jsxs("ul",{style:{margin:0,paddingLeft:"1rem",fontSize:"0.875rem"},children:[t.jsx("li",{children:"Your credentials have been automatically updated"}),t.jsx("li",{children:'You can now use the "Check Config" button to verify settings'}),t.jsx("li",{children:"Test your application with the OAuth flows"})]})]})]}),t.jsxs("div",{style:{display:"flex",gap:"0.75rem",justifyContent:"flex-end",padding:"1.5rem",borderTop:"1px solid #e5e7eb"},children:[t.jsx("button",{onClick:()=>_(!1),style:{padding:"0.75rem 1.5rem",borderRadius:"0.5rem",border:"1px solid #d1d5db",background:"#ffffff",color:"#374151",cursor:"pointer",fontWeight:"600"},children:"Close"}),t.jsxs("button",{onClick:()=>{_(!1),T.app?.clientId&&(navigator.clipboard.writeText(T.app.clientId),$.showSuccess("Client ID copied to clipboard!"))},style:{padding:"0.75rem 1.5rem",borderRadius:"0.5rem",border:"none",background:"#2563eb",color:"#ffffff",cursor:"pointer",fontWeight:"600"},children:[t.jsx(m,{style:{marginRight:"0.5rem"}}),"Copy Client ID"]})]})]})})]})},_t=R`
	/* CRITICAL: Force all credential inputs to be editable */
	form[data-credentials-form] input[type="text"],
	form[data-credentials-form] input[type="password"],
	form[data-credentials-form] textarea,
	form[data-credentials-form] select {
		pointer-events: auto !important;
		cursor: text !important;
		user-select: text !important;
		-webkit-user-select: text !important;
		z-index: 99999 !important;
		position: relative !important;
		background-color: #ffffff !important;
		opacity: 1 !important;
	}
	
	form[data-credentials-form] input:disabled,
	form[data-credentials-form] input[readonly] {
		pointer-events: auto !important;
		cursor: text !important;
		background-color: #ffffff !important;
	}
`,Tt=E.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	overflow: hidden;
	/* Ensure container allows interactions */
	pointer-events: auto;
	position: relative;
	z-index: 1;
`,Pt=E.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	width: 100%;
	padding: 1rem 1.5rem;
	background: #3b82f6;
	color: white;
	font-weight: 600;
	font-size: 0.875rem;
	border: none;
	cursor: pointer;
	transition: background-color 0.2s ease;
	
	&:hover {
		background: #2563eb;
	}
`,Ot=E.div`
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
`,Ut=E(E.button`
	position: absolute;
	background: white;
	border: 1px solid #d1d5db;
	color: #374151;
	padding: 0.375rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	border-radius: 0.375rem;
	z-index: 10;
	pointer-events: auto;
	width: 2rem;
	height: 2rem;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
		color: #111827;
	}

	&:active {
		transform: scale(0.95);
	}
`)`
	top: 50%;
	right: 3.25rem;
	transform: translateY(-50%);
`,$t=E.div`
	position: absolute;
	top: 0;
	bottom: 0;
	right: 0.5rem;
	display: flex;
	align-items: center;
`,Ft=E.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Mt=E.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	border: 2px solid white; /* White circle around arrow for visibility */
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
	transition: all 0.2s ease;
	
	&:hover {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Enhanced shadow on hover */
		transform: scale(1.1);
	}
	
	svg {
		width: 16px;
		height: 16px;
	}
`,Dt=E.div`
	padding: ${({$collapsed:e})=>e?"0":"1.5rem"};
	max-height: ${({$collapsed:e})=>e?"0":"none"};
	overflow: hidden;
	transition: all 0.3s ease;
	/* CRITICAL: Ensure content is interactive when expanded */
	pointer-events: ${({$collapsed:e})=>e?"none":"auto"};
	position: relative;
	z-index: 1;
	
	/* Ensure all child elements can receive pointer events when not collapsed */
	* {
		pointer-events: ${({$collapsed:e})=>e?"none":"auto"};
	}
	
	/* Force inputs to always be interactive */
	input, textarea, select {
		pointer-events: auto !important;
		cursor: text !important;
	}
`,Nt=E.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin-bottom: 0;
	padding: 0;
	background: transparent;
	border-radius: 0;
	border: none;
	/* Ensure grid is interactive */
	pointer-events: auto;
	position: relative;
	z-index: 1;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`,Wt=E.div`
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
	position: relative;
	z-index: 5;
	pointer-events: auto;
	
	/* Ensure all inputs in form fields are interactive */
	input, textarea, select {
		pointer-events: auto !important;
		cursor: text !important;
	}
`,Lt=E.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0;
	display: flex;
	align-items: center;
	gap: 0.25rem;
`,Kt=E.input`
	width: 100%;
	padding: 0.75rem 0.875rem;
	border: 1px solid ${({$hasError:e})=>e?"#ef4444":"#d1d5db"};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: all 0.2s ease;
	font-family: inherit;
	background: #ffffff !important;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	cursor: text !important;
	pointer-events: auto !important;
	position: relative;
	z-index: 10 !important;
	user-select: text !important;
	-webkit-user-select: text !important;

	&:hover {
		border-color: ${({$hasError:e})=>e?"#ef4444":"#9ca3af"};
	}

	&:focus {
		outline: none;
		border-color: ${({$hasError:e})=>e?"#ef4444":"#2563eb"};
		box-shadow: 0 0 0 3px ${({$hasError:e})=>e?"rgba(239, 68, 68, 0.1)":"rgba(37, 99, 235, 0.1)"} !important;
		z-index: 20 !important;
	}

	&::placeholder {
		color: #9ca3af;
	}

	&:disabled {
		background: #ffffff !important;
		color: #111827 !important;
		cursor: text !important;
		pointer-events: auto !important;
	}

	&[readonly] {
		background: #ffffff !important;
		color: #111827 !important;
		cursor: text !important;
		pointer-events: auto !important;
	}
`,qt=E.select`
	width: 100%;
	padding: 0.75rem 0.875rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: all 0.2s ease;
	font-family: inherit;
	background: #ffffff;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	cursor: pointer;
	position: relative;
	z-index: 10;
	user-select: none;

	&:hover {
		border-color: #9ca3af;
	}

	&:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
		z-index: 20;
	}

	&:disabled {
		background: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
		pointer-events: none;
	}
`,Jt=E.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`,Bt=E.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
`,Ht=E.h3`
	color: #1e40af;
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0;
`,Vt=E.div`
	height: 1px;
	background-color: #e5e7eb;
	margin: 1.5rem 0;
	border-radius: 0.5px;
`,Gt=({environmentId:r,clientId:n,clientSecret:i,redirectUri:o="",scopes:s="openid",loginHint:a="",postLogoutRedirectUri:c="",region:p="us",responseMode:h="fragment",flowKey:u="authorization_code",responseType:m="code",onEnvironmentIdChange:g,onClientIdChange:f,onClientSecretChange:v,onRedirectUriChange:w,onScopesChange:k,onScopesBlur:C,onLoginHintChange:S,onPostLogoutRedirectUriChange:I,onRegionChange:A,onResponseModeChange:E,emptyRequiredFields:z=new Set,showRedirectUri:R=!0,showLoginHint:_=!0,showPostLogoutRedirectUri:T=!1,showClientSecret:P=!0,showEnvironmentIdInput:O=!1,showResponseModeSelector:U=!1,onDiscoveryComplete:$,onSave:F,hasUnsavedChanges:M=!1,isSaving:D=!1,autoDiscover:N=!0})=>{const[W,L]=e.useState(!1),[V,G]=e.useState(!1),[Y,X]=e.useState(null);return t.jsxs(t.Fragment,{children:[t.jsx(_t,{}),t.jsxs(Tt,{children:[t.jsxs(Pt,{onClick:()=>G(!V),"aria-expanded":!V,children:[t.jsxs(Ft,{children:[t.jsx(x,{size:18}),t.jsx("span",{children:"Application Configuration & Credentials"})]}),t.jsx(Mt,{$collapsed:V,children:V?t.jsx(b,{}):t.jsx(y,{})})]}),t.jsx(Dt,{$collapsed:V,children:t.jsxs("form",{"data-credentials-form":"true",style:{pointerEvents:"auto",position:"relative",zIndex:1},onMouseDown:e=>{"INPUT"!==e.target.tagName&&"TEXTAREA"!==e.target.tagName&&"SELECT"!==e.target.tagName||e.stopPropagation()},children:[O&&t.jsxs(t.Fragment,{children:[t.jsxs(Jt,{children:[t.jsxs(Bt,{children:[t.jsx(j,{size:20}),t.jsx(Ht,{children:"🌍 PingOne Environment Configuration"})]}),t.jsx(K,{onDiscoveryComplete:$||(()=>{}),onEnvironmentIdChange:g,onIssuerUrlChange:()=>{},showSuggestions:!0,autoDiscover:N})]}),t.jsx(Vt,{})]}),t.jsxs(Nt,{children:[t.jsxs(Wt,{children:[t.jsxs(Lt,{children:["Environment ID ",t.jsx("span",{style:{color:"#ef4444"},children:"*"})]}),t.jsxs("div",{style:{position:"relative",display:"flex",alignItems:"stretch",gap:"0.5rem"},children:[t.jsx(Kt,{type:"text",placeholder:z.has("environmentId")?"Required: Enter your PingOne Environment ID":"Enter your PingOne Environment ID",value:r,onChange:e=>{g(e.target.value)},disabled:!1,readOnly:!1,$hasError:z.has("environmentId"),style:{flex:1,pointerEvents:"auto",userSelect:"text",cursor:"text",position:"relative",zIndex:9999,backgroundColor:"#ffffff"},onMouseDown:e=>{e.stopPropagation()},onMouseUp:e=>{e.stopPropagation()},onFocus:e=>{e.target.style.pointerEvents="auto",e.target.style.userSelect="text",e.target.style.cursor="text"},onClick:e=>{e.target.focus()}}),r&&t.jsx("div",{style:{display:"flex",alignItems:"center",height:"100%"},children:q.identifier(r,"Environment ID")})]})]}),t.jsxs(Wt,{children:[t.jsx(Lt,{children:"Region"}),t.jsxs(qt,{value:p,onChange:e=>A?.(e.target.value),children:[t.jsx("option",{value:"us",children:"US (North America)"}),t.jsx("option",{value:"eu",children:"EU (Europe)"}),t.jsx("option",{value:"ap",children:"AP (Asia Pacific)"}),t.jsx("option",{value:"ca",children:"CA (Canada)"})]}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.25rem"},children:"The region where your PingOne environment is hosted."})]}),t.jsxs(Wt,{children:[t.jsxs(Lt,{children:["Client ID ",t.jsx("span",{style:{color:"#ef4444"},children:"*"})]}),t.jsxs("div",{style:{position:"relative",display:"flex",alignItems:"stretch",gap:"0.5rem"},children:[t.jsx(Kt,{type:"text",placeholder:z.has("clientId")?"Required: Enter your PingOne Client ID":"Enter your PingOne Client ID",value:n,onChange:e=>{f(e.target.value)},$hasError:z.has("clientId"),style:{flex:1,pointerEvents:"auto",userSelect:"text",cursor:"text",position:"relative",zIndex:9999,backgroundColor:"#ffffff"},disabled:!1,readOnly:!1,onMouseDown:e=>{e.stopPropagation()},onMouseUp:e=>{e.stopPropagation()},onFocus:e=>{e.target.style.pointerEvents="auto",e.target.style.userSelect="text",e.target.style.cursor="text"},onClick:e=>{e.stopPropagation(),e.target.focus()}}),n&&t.jsx("div",{style:{display:"flex",alignItems:"center",height:"100%"},children:q.identifier(n,"Client ID")})]})]}),P&&t.jsxs(Wt,{style:{gridColumn:"1 / -1"},children:[t.jsxs(Lt,{children:["Client Secret ",t.jsx("span",{style:{color:"#ef4444"},children:"*"})]}),t.jsxs(Ot,{children:[t.jsx(Kt,{type:W?"text":"password",placeholder:z.has("clientSecret")?"Required: Enter your PingOne Client Secret":"Enter your PingOne Client Secret",value:i,onChange:e=>{v(e.target.value)},$hasError:z.has("clientSecret"),style:{paddingRight:"6.5rem",pointerEvents:"auto",userSelect:"text",cursor:"text",position:"relative",zIndex:9999,backgroundColor:"#ffffff"},disabled:!1,readOnly:!1,autoComplete:"current-password",onMouseDown:e=>{e.stopPropagation()},onMouseUp:e=>{e.stopPropagation()},onFocus:e=>{e.target.style.pointerEvents="auto",e.target.style.userSelect="text",e.target.style.cursor="text"},onClick:e=>{e.stopPropagation(),e.target.focus()}}),i&&t.jsx($t,{children:q.identifier(i,"Client Secret")}),t.jsx(Ut,{type:"button",onClick:()=>L(!W),title:W?"Hide client secret":"Show client secret",children:W?t.jsx(l,{size:16}):t.jsx(d,{size:16})})]})]}),!P&&t.jsx(Wt,{style:{gridColumn:"1 / -1"},children:t.jsxs("div",{style:{fontSize:"0.875rem",color:"#6b7280",backgroundColor:"#f3f4f6",padding:"0.75rem",borderRadius:"0.5rem",border:"1px solid #e5e7eb",marginTop:"0.5rem"},children:[t.jsx("strong",{children:"Note:"})," Client Secret is not required for this flow type. This flow uses public client authentication (client_id only)."]})}),R&&t.jsxs(Wt,{style:{gridColumn:"1 / -1"},children:[t.jsxs(Lt,{children:["Redirect URI ",t.jsx("span",{style:{color:"#ef4444"},children:"*"})]}),t.jsxs("div",{style:{position:"relative",display:"flex",alignItems:"stretch",gap:"0.5rem"},children:[t.jsx(Kt,{type:"text",placeholder:J.getRedirectUriForFlow(u||"authorization_code").redirectUri,value:o||J.getRedirectUriForFlow(u||"authorization_code").redirectUri,onChange:e=>w?.(e.target.value),$hasError:z.has("redirectUri"),style:{flex:1},disabled:!1,readOnly:!1}),o&&t.jsx("div",{style:{display:"flex",alignItems:"center",height:"100%"},children:q.url(o,"Redirect URI")})]}),t.jsxs("div",{style:{marginTop:"0.5rem",padding:"0.75rem",backgroundColor:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"0.375rem",fontSize:"0.875rem",color:"#475569"},children:[t.jsxs("strong",{children:["📋"," ",J.getRedirectUriForFlow(u||"authorization_code").description,":"]}),t.jsx("br",{}),t.jsx("code",{style:{color:"#1e40af",backgroundColor:"#eff6ff",padding:"0.125rem 0.25rem",borderRadius:"0.25rem"},children:J.getRedirectUriForFlow(u||"authorization_code").redirectUri}),t.jsx("br",{}),t.jsx("span",{style:{fontSize:"0.8rem",color:"#64748b"},children:J.getRedirectUriForFlow(u||"authorization_code").note}),t.jsx("br",{}),t.jsx("span",{style:{fontSize:"1rem",color:"#dc2626",fontWeight:"600"},children:'⚠️ Add this exact URI to your PingOne application\'s "Redirect URIs" list'})]})]}),!R&&t.jsx(Wt,{style:{gridColumn:"1 / -1"},children:t.jsxs("div",{style:{fontSize:"0.875rem",color:"#6b7280",backgroundColor:"#f3f4f6",padding:"0.75rem",borderRadius:"0.5rem",border:"1px solid #e5e7eb",marginTop:"0.5rem"},children:[t.jsx("strong",{children:"Note:"})," Redirect URI is not required for this flow type. This flow handles authentication without redirects."]})}),t.jsxs(Wt,{style:{gridColumn:"1 / -1"},children:[t.jsxs(Lt,{children:["Scopes ",t.jsx("span",{style:{color:"#ef4444"},children:"*"})]}),t.jsxs("div",{style:{position:"relative",display:"flex",alignItems:"stretch",gap:"0.5rem"},children:[t.jsx(Kt,{type:"text",placeholder:"openid",value:s,onChange:e=>{var t;t=e.target.value,k?.(t)},onBlur:e=>(e=>{const t=e.replace(/\s+/g," ").trim();C?.(t)})(e.target.value),onKeyDown:e=>{" "===e.key&&e.stopPropagation()},$hasError:z.has("scopes")||!s.includes("openid"),style:{flex:1,pointerEvents:"auto",userSelect:"text",cursor:"text",position:"relative",zIndex:9999,backgroundColor:"#ffffff"},disabled:!1,readOnly:!1,onMouseDown:e=>{e.stopPropagation()},onClick:e=>{e.stopPropagation(),e.target.focus()},onFocus:e=>{e.target.style.pointerEvents="auto",e.target.style.userSelect="text",e.target.style.cursor="text"}}),s&&t.jsx("div",{style:{display:"flex",alignItems:"center",height:"100%"},children:q.identifier(s,"Scopes")})]}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.25rem"},children:["Space-separated list of scopes. ",t.jsx("strong",{children:"openid"})," is always required and will be automatically added."]})]}),_&&t.jsxs(Wt,{style:{gridColumn:"1 / -1"},children:[t.jsxs(Lt,{children:["Login Hint"," ",t.jsx("span",{style:{color:"#6b7280",fontSize:"0.75rem"},children:"(Optional)"})]}),t.jsxs("div",{style:{position:"relative",display:"flex",alignItems:"stretch",gap:"0.5rem"},children:[t.jsx(Kt,{type:"text",placeholder:"user@example.com or username",value:a,onChange:e=>S?.(e.target.value),style:{flex:1},disabled:!1,readOnly:!1,"data-field":"login-hint"}),a&&t.jsx("div",{style:{display:"flex",alignItems:"center",height:"100%"},children:q.identifier(a,"Login Hint")})]}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.25rem"},children:"Hint about the user identifier (email, username). Helps pre-fill the login form or skip account selection."})]}),T&&t.jsxs(Wt,{style:{gridColumn:"1 / -1"},children:[t.jsxs(Lt,{children:["🚪 Post-Logout Redirect URI"," ",t.jsx("span",{style:{color:"#6b7280",fontSize:"0.75rem"},children:"(Required for Logout)"})]}),t.jsxs("div",{style:{position:"relative",display:"flex",alignItems:"stretch",gap:"0.5rem"},children:[t.jsx(Kt,{type:"text",placeholder:J.getRedirectUriForFlow(u||"authorization_code").logoutUri,value:c||J.getRedirectUriForFlow(u||"authorization_code").logoutUri,onChange:e=>I?.(e.target.value),style:{flex:1},disabled:!1,readOnly:!1}),t.jsx("div",{style:{display:"flex",alignItems:"center",height:"100%"},children:q.url(c||J.getRedirectUriForFlow(u||"authorization_code").logoutUri,"Post-Logout Redirect URI")})]}),t.jsx(B,{flowKey:u||"authorization_code",compact:!0})]})]}),U&&t.jsxs(t.Fragment,{children:[t.jsx(Vt,{}),t.jsx(H,{flowKey:u,responseType:m,redirectUri:o,clientId:n,scope:s,state:"random_state_123",nonce:"random_nonce_456",defaultMode:h,readOnlyFlowContext:!1,onModeChange:E||(()=>{})})]}),F&&t.jsxs("div",{style:{marginTop:"1.5rem",paddingTop:"1rem",borderTop:"1px solid #e5e7eb",display:"flex",flexDirection:"column",gap:"0.5rem"},children:[t.jsx("div",{style:{display:"flex",justifyContent:"flex-start"},children:t.jsx("button",{type:"button",onClick:()=>{if(F){const e=(e=>{const t=e.getMonth()+1,r=e.getDate(),n=e.getFullYear();let i=e.getHours();const o=i>=12?"PM":"AM";return i%=12,i=i||12,`${t}/${r}/${n}, ${i}:${e.getMinutes().toString().padStart(2,"0")}:${e.getSeconds().toString().padStart(2,"0")} ${o}`})(new Date);X(e),F()}},disabled:D,style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.75rem 1.5rem",backgroundColor:"#10b981",color:"white",border:"1px solid #10b981",borderRadius:"0.5rem",fontSize:"0.875rem",fontWeight:"600",cursor:D?"not-allowed":"pointer",opacity:D?.7:1,transition:"all 0.2s ease"},onMouseEnter:e=>{D||(e.currentTarget.style.backgroundColor="#059669",e.currentTarget.style.borderColor="#059669")},onMouseLeave:e=>{D||(e.currentTarget.style.backgroundColor="#10b981",e.currentTarget.style.borderColor="#10b981")},children:D?t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{width:"16px",height:"16px",border:"2px solid #ffffff",borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}),t.jsx("style",{children:"\n\t\t\t\t\t\t\t\t\t\t@keyframes spin {\n\t\t\t\t\t\t\t\t\t\t\t0% { transform: rotate(0deg); }\n\t\t\t\t\t\t\t\t\t\t\t100% { transform: rotate(360deg); }\n\t\t\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\t\t"}),"Saving..."]}):t.jsxs(t.Fragment,{children:[t.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[t.jsx("path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"}),t.jsx("polyline",{points:"17,21 17,13 7,13 7,21"}),t.jsx("polyline",{points:"7,3 7,8 15,8"})]}),M?"Save Changes":"Save Credentials"]})})}),Y&&t.jsxs("div",{style:{fontSize:"0.75rem",color:"#6b7280",fontStyle:"italic"},children:["Last saved ",Y]})]})]})})]})]})};async function Yt(e){const t=await fetch("/api/token-exchange",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grant_type:"client_credentials",client_id:e.clientId,client_secret:e.clientSecret,environment_id:e.environmentId,token_endpoint_auth_method:e.tokenEndpointAuthMethod,scope:"p1:read:environments p1:read:applications p1:read:connections"})});if(!t.ok){const e=await t.json().catch(()=>({}));throw new Error(e.error_description||`Failed to get worker token (${t.status})`)}const r=(await t.json()).access_token;if(!r)throw new Error("No access token in response");return r}async function Xt(e){const t=new URLSearchParams({environmentId:e.environmentId,region:e.region||"na",...e.workerToken?{workerToken:e.workerToken}:{},...e.clientId?{clientId:e.clientId}:{},...e.clientSecret?{clientSecret:e.clientSecret}:{}}),r=await fetch(`/api/pingone/applications?${t.toString()}`);if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error_description||`Failed to fetch applications (${r.status})`)}const n=await r.json();return(n._embedded?.applications||[]).map(e=>({id:e.id,name:e.name,description:e.description,clientId:e.clientId,clientSecret:e.clientSecret,redirectUris:e.redirectUris||[],postLogoutRedirectUris:e.postLogoutRedirectUris||[],scopes:e.scopes||[],tokenEndpointAuthMethod:e.tokenEndpointAuthMethod||"client_secret_post",grantTypes:e.grantTypes||[],pkceEnforcement:e.pkceEnforcement,parStatus:e.parStatus,type:e.type}))}const Qt=E.div`
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
`,Zt=E.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`,er=E.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`,tr=E(n)`
  color: #64748b;
  cursor: help;
`,rr=E.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
`,nr=E.thead`
  background: #ffffff;
`,ir=E.tr`
  background: ${({$isEven:e})=>e?"#f8f9fa":"#ffffff"};

  &:hover {
    background: #f1f5f9;
  }
`,or=E.tbody``,sr=E.td`
  padding: 0.75rem;
  font-size: 0.75rem;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`,ar=E.th`
  padding: 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
`,lr=E(sr)`
  font-family: "Courier New", monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
`,dr=E(sr)`
  text-align: center;
`,cr=E.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({$status:e})=>null===e?"#64748b":e?"#059669":"#dc2626"};
`,pr=E.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`,hr=E.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  background: ${({$variant:e})=>"secondary"===e?"#e5e7eb":"#2563eb"};
  color: ${({$variant:e})=>"secondary"===e?"#1f2937":"#ffffff"};
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease;
  font-size: 0.875rem;

  &:hover {
    background: ${({$variant:e})=>"secondary"===e?"#d1d5db":"#1e40af"};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`,ur=E(v)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`,mr=E.div`
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`,gr=E.p`
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
`,fr=E.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: background 120ms ease;
  font-size: 0.75rem;
  margin-left: 0.5rem;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
`,xr=({flowType:i,environmentId:o,clientId:a,workerToken:l,redirectUri:d,postLogoutRedirectUri:c,region:p="NA"})=>{const[h,g]=e.useState(!1),[f,x]=e.useState(""),[b,y]=e.useState({uri:d||"",existsInPingOne:null,isChecking:!1}),[j,w]=e.useState({uri:c||"",existsInPingOne:null,isChecking:!1}),[k,C]=e.useState("");e.useEffect(()=>{const e=async()=>{try{const e=await ee.getToken();x(e||"")}catch(e){x("")}};e();const t=()=>{e()};return window.addEventListener("workerTokenUpdated",t),window.addEventListener("storage",t),()=>{window.removeEventListener("workerTokenUpdated",t),window.removeEventListener("storage",t)}},[]);const S=l||f,I=e.useCallback(async()=>{if(S&&o){C(""),y(e=>({...e,isChecking:!0})),w(e=>({...e,isChecking:!0}));try{const e=await Xt({environmentId:o,region:p,workerToken:S}),t=a?e.find(e=>e.clientId===a):null;if(d){const e=t?.redirectUris?.includes(d)||!1;y({uri:d,existsInPingOne:e,isChecking:!1})}else y(e=>({...e,isChecking:!1}));if(c){const e=t?.postLogoutRedirectUris?.includes(c)||!1;w({uri:c,existsInPingOne:e,isChecking:!1})}else w(e=>({...e,isChecking:!1}));t?$.showSuccess("URI check completed"):a&&$.showWarning(`Application with Client ID ${a.substring(0,8)}... not found in PingOne`)}catch(e){C(e instanceof Error?e.message:"Failed to check URIs"),y(e=>({...e,isChecking:!1})),w(e=>({...e,isChecking:!1})),$.showError("Failed to check URIs against PingOne")}}else S?$.showWarning("Environment ID is required to check URIs"):g(!0)},[S,o,a,d,c,p]),A=(e,t)=>{navigator.clipboard.writeText(e),$.showSuccess(`${t} copied to clipboard`)},E=()=>i?i.includes("authorization-code")?"Authorization Code Flow":i.includes("implicit")?"Implicit Flow":i.includes("hybrid")?"Hybrid Flow":i.includes("device")||i.includes("device-authorization")?"Device Authorization Flow":i.includes("client-credentials")?"Client Credentials Flow":i.includes("worker-token")?"Worker Token Flow":i.includes("par")||i.includes("pushed-auth")?"Pushed Authorization Request (PAR) Flow":i.includes("rar")||i.includes("resource-authorization")?"Rich Authorization Request (RAR) Flow":i.includes("ciba")?"Client Initiated Backchannel Authentication (CIBA) Flow":i.includes("redirectless")?"Redirectless Flow":i.includes("oauth")?"OAuth Flow":i.includes("oidc")?"OIDC Flow":"OAuth Flow":"OAuth",z=!i?.includes("client-credentials")&&!i?.includes("worker-token"),R=!0,_=d&&z||c&&R;return t.jsxs(Qt,{children:[t.jsxs(Zt,{children:[t.jsx(er,{children:"Configuration URI Status"}),t.jsx(tr,{title:`Check if the configured URIs for ${E()} are registered in your PingOne application`})]}),t.jsx(gr,{children:"Verify that your URIs are properly configured in PingOne. This check requires a worker token."}),t.jsxs(rr,{children:[t.jsx(nr,{children:t.jsxs(ir,{children:[t.jsx(ar,{children:"URI Type"}),t.jsx(ar,{children:"URI Value"}),t.jsx(ar,{children:"Status"})]})}),t.jsxs(or,{children:[z&&t.jsxs(ir,{$isEven:!1,children:[t.jsx(sr,{children:"Redirect URI"}),t.jsxs(lr,{children:[d||"Not configured",d&&t.jsx(fr,{onClick:()=>A(d,"Redirect URI"),children:t.jsx(m,{size:12})})]}),t.jsx(dr,{children:d?t.jsx(cr,{$status:b.existsInPingOne,children:b.isChecking?t.jsxs(t.Fragment,{children:[t.jsx(ur,{size:14}),"Checking..."]}):null===b.existsInPingOne?t.jsxs(t.Fragment,{children:[t.jsx(n,{size:14}),"Not checked"]}):b.existsInPingOne?t.jsxs(t.Fragment,{children:[t.jsx(s,{size:14}),"Registered"]}):t.jsxs(t.Fragment,{children:[t.jsx(r,{size:14}),"Not registered"]})}):t.jsx("span",{style:{color:"#9ca3af",fontSize:"0.75rem"},children:"N/A"})})]}),!z&&t.jsxs(ir,{$isEven:!1,children:[t.jsx(sr,{children:"Redirect URI"}),t.jsxs(sr,{colSpan:2,style:{color:"#9ca3af",fontStyle:"italic"},children:["Not used for ",E()]})]}),t.jsxs(ir,{$isEven:!0,children:[t.jsx(sr,{children:"Post-Logout Redirect URI"}),t.jsxs(lr,{children:[c||"Not configured",c&&t.jsx(fr,{onClick:()=>A(c,"Post-Logout Redirect URI"),children:t.jsx(m,{size:12})})]}),t.jsx(dr,{children:c?t.jsx(cr,{$status:j.existsInPingOne,children:j.isChecking?t.jsxs(t.Fragment,{children:[t.jsx(ur,{size:14}),"Checking..."]}):null===j.existsInPingOne?t.jsxs(t.Fragment,{children:[t.jsx(n,{size:14}),"Not checked"]}):j.existsInPingOne?t.jsxs(t.Fragment,{children:[t.jsx(s,{size:14}),"Registered"]}):t.jsxs(t.Fragment,{children:[t.jsx(r,{size:14}),"Not registered"]})}):t.jsx("span",{style:{color:"#9ca3af",fontSize:"0.75rem"},children:"N/A"})})]}),!1]})]}),k&&t.jsx(mr,{children:k}),t.jsxs("div",{style:{marginTop:"2rem",paddingTop:"2rem",borderTop:"2px solid #e5e7eb"},children:[t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h3",{style:{margin:0,fontSize:"1rem",fontWeight:600,color:"#374151"},children:"All V7 Flow URIs Reference"}),t.jsx("p",{style:{margin:"0.25rem 0 0 0",fontSize:"0.875rem",color:"#6b7280"},children:"Complete list of redirect and logout URIs for all V7 flows"}),t.jsx("p",{style:{margin:"0.25rem 0 0 0",fontSize:"0.75rem",color:"#9ca3af",fontStyle:"italic"},children:"Note: Additional V7 flows (PAR, RAR, CIBA, Redirectless, Worker Token) use the Authorization Code or Implicit flow URIs above"})]}),t.jsxs(rr,{style:{marginTop:"1rem"},children:[t.jsx(nr,{children:t.jsxs(ir,{children:[t.jsx(ar,{style:{width:"25%"},children:"Flow Type"}),t.jsx(ar,{style:{width:"35%"},children:"Redirect URI"}),t.jsx(ar,{style:{width:"35%"},children:"Logout URI"}),t.jsx(ar,{style:{width:"5%"}})]})}),t.jsx(or,{children:J.getAllRedirectUriInfo().map((e,r)=>t.jsxs(ir,{$isEven:r%2==1,children:[t.jsx(sr,{style:{fontWeight:500},children:e.description}),t.jsxs(lr,{children:[e.redirectUri,t.jsx(fr,{onClick:()=>A(e.redirectUri,`${e.description} Redirect URI`),children:t.jsx(m,{size:12})})]}),t.jsxs(lr,{children:[e.logoutUri,t.jsx(fr,{onClick:()=>A(e.logoutUri,`${e.description} Logout URI`),children:t.jsx(m,{size:12})})]}),t.jsx(sr,{style:{textAlign:"center"},children:t.jsx(n,{size:14,style:{color:"#9ca3af",cursor:"help"},title:`${e.note} ${e.logoutNote}`})})]},e.flowType))})]})]}),t.jsxs(pr,{children:[S?t.jsxs(hr,{onClick:I,disabled:!o||!a||!_||b.isChecking||j.isChecking,children:[t.jsx(v,{size:16}),"Check URIs Against PingOne"]}):t.jsxs(hr,{onClick:()=>g(!0),children:[t.jsx(u,{size:16}),"Get Worker Token"]}),(!1===b.existsInPingOne||!1===j.existsInPingOne)&&t.jsx(gr,{style:{margin:0},children:"⚠️ Add missing URIs to your PingOne application's configuration"})]}),h&&t.jsx(te,{isOpen:h,onClose:()=>g(!1),onContinue:()=>{g(!1);const e=localStorage.getItem("worker_token");e&&(x(e),setTimeout(()=>{o&&a&&(d||c)&&I()},500))},flowType:i||"flow",environmentId:o||""})]})};class br{static keyPair=null;static config={algorithm:"ES256",namedCurve:"P-256"};static async generateKeyPair(e){try{const t={...br.config,...e};let r;r="RS256"===t.algorithm?{name:"RSASSA-PKCS1-v1_5",modulusLength:t.keySize||2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"}:{name:"ECDSA",namedCurve:t.namedCurve||"P-256"};const n=await window.crypto.subtle.generateKey(r,!0,["sign","verify"]),i=await window.crypto.subtle.exportKey("jwk",n.publicKey);delete i.d,delete i.dp,delete i.dq,delete i.p,delete i.q,delete i.qi;const o={publicKey:n.publicKey,privateKey:n.privateKey,jwk:i};return br.keyPair=o,o}catch(t){throw new Error("Failed to generate DPoP key pair")}}static async createProof(e,t,r,n){try{br.keyPair||await br.generateKeyPair();const i=br.generateJti(),o=Math.floor(Date.now()/1e3),s={typ:"dpop+jwt",alg:br.config.algorithm,jwk:br.keyPair.jwk},a={jti:i,htm:e.toUpperCase(),htu:t,iat:o};r&&(a.ath=await br.generateAccessTokenHash(r)),n&&(a.nonce=n);return{jwt:await br.signJWT(s,a),jti:i,iat:o,htm:a.htm,htu:a.htu}}catch(i){throw new Error("Failed to create DPoP proof")}}static getPublicKeyJWK(){return br.keyPair?.jwk||null}static clearKeyPair(){br.keyPair=null}static generateJti(){const e=new Uint8Array(16);return window.crypto.getRandomValues(e),Array.from(e,e=>e.toString(16).padStart(2,"0")).join("")}static async generateAccessTokenHash(e){const t=(new TextEncoder).encode(e),r=await window.crypto.subtle.digest("SHA-256",t),n=new Uint8Array(r);return btoa(String.fromCharCode(...n)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}static async signJWT(e,t){const r=new TextEncoder,n=`${br.base64urlEncode(JSON.stringify(e))}.${br.base64urlEncode(JSON.stringify(t))}`,i=r.encode(n);let o;o="ECDSA";const s=await window.crypto.subtle.sign("ECDSA",br.keyPair.privateKey,i);return`${n}.${br.base64urlEncode(s)}`}static base64urlEncode(e){let t;if("string"==typeof e)t=btoa(e);else{const r=new Uint8Array(e);t=btoa(String.fromCharCode(...r))}return t.replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}}class yr{static isSupported(){return!(!window.crypto?.subtle?.generateKey||!window.crypto.subtle.sign)}static getStatus(){return{supported:yr.isSupported(),hasKeyPair:!!br.getPublicKeyJWK(),algorithm:br.config.algorithm,publicKey:br.getPublicKeyJWK()}}}const jr=E.div`
	margin: 2rem 0;
`,vr=E.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #1f2937;
`,wr=E.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin-bottom: 1rem;
	
	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`,kr=E.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`,Cr=E.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
`,Sr=E.select`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: white;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`,Ir=E.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: #ffffff;
	color: #111827;
	cursor: text;
	pointer-events: auto;
	position: relative;
	z-index: 5;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	&:disabled {
		background: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
		pointer-events: none;
	}

	&[readonly] {
		background: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* Ensure inputs are always interactive when not disabled/readonly */
	&:not(:disabled):not([readonly]) {
		background: #ffffff !important;
		color: #111827 !important;
		cursor: text !important;
		pointer-events: auto !important;
		user-select: text !important;
	}
`,Ar=E.textarea`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-family: monospace;
	resize: vertical;
	min-height: 120px;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`,Er=E.button`
	position: relative;
	width: 3rem;
	height: 1.5rem;
	background-color: ${({$active:e})=>e?"#22c55e":"#d1d5db"};
	border: none;
	border-radius: 9999px;
	cursor: pointer;
	transition: background-color 0.2s;
	
	&:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}
	
	span {
		position: absolute;
		top: 0.125rem;
		left: ${({$active:e})=>e?"1.625rem":"0.125rem"};
		width: 1.25rem;
		height: 1.25rem;
		background-color: white;
		border-radius: 50%;
		transition: left 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
`,zr=E.input`
	margin-right: 0.5rem;
`,Rr=E.label`
	display: flex;
	align-items: center;
	font-size: 0.875rem;
	color: #374151;
	cursor: pointer;
`,_r=E.p`
	font-size: 0.75rem;
	color: #6b7280;
	margin: 0.25rem 0 0 0;
	line-height: 1.4;
`,Tr=E.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	margin-top: 0.5rem;
`,Pr=E.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: #374151;
	cursor: pointer;
`,Or=E.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 1rem;
`,Ur=E.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`,$r=E.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
`,Fr=E.div`
	display: flex;
	justify-content: flex-end;
	margin-top: 1.5rem;
	padding-top: 1.5rem;
	border-top: 1px solid #e5e7eb;
`,Mr=E.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	border-radius: 0.5rem;
	border: none;
	cursor: pointer;
	transition: all 0.2s;
	
	${({$hasChanges:e,$isSaving:t})=>t?"\n\t\t\t\tbackground: #9ca3af;\n\t\t\t\tcolor: white;\n\t\t\t\tcursor: wait;\n\t\t\t":e?"\n\t\t\t\tbackground: linear-gradient(135deg, #10b981, #059669);\n\t\t\t\tcolor: white;\n\t\t\t\tbox-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);\n\t\t\t\t\n\t\t\t\t&:hover {\n\t\t\t\t\tbackground: linear-gradient(135deg, #059669, #047857);\n\t\t\t\t\tbox-shadow: 0 6px 8px rgba(16, 185, 129, 0.3);\n\t\t\t\t\ttransform: translateY(-1px);\n\t\t\t\t}\n\t\t\t":"\n\t\t\tbackground: #e5e7eb;\n\t\t\tcolor: #6b7280;\n\t\t\tcursor: not-allowed;\n\t\t"}
	
	&:active:not(:disabled) {
		transform: translateY(0);
	}
`,Dr=({value:r,onChange:i,onSave:o,isSaving:s=!1,hasUnsavedChanges:a=!1,flowType:l})=>{const[d,c]=e.useState(r),[p,h]=e.useState(!1);e.useEffect(()=>{p&&!s&&c(r),h(s)},[s,r,p]);const m=e.useMemo(()=>!1!==a?a:JSON.stringify(r)!==JSON.stringify(d),[r,d,a]),g=e=>{i({...r,...e})};return t.jsxs("div",{children:[t.jsxs(vr,{style:{fontSize:"1.125rem",marginBottom:"1.5rem",color:"#1f2937"},children:[t.jsx(x,{})," PingOne Advanced Configuration"]}),!l?.includes("client-credentials")&&!l?.includes("jwt-bearer")&&!l?.includes("worker-token")&&!l?.includes("device-authorization")&&t.jsxs(jr,{children:[t.jsxs(vr,{children:[t.jsx(w,{})," Pushed Authorization Request (PAR)"]}),t.jsx(wr,{children:t.jsxs(kr,{style:{gridColumn:"1 / -1",width:"100%"},children:[t.jsxs(Rr,{children:[t.jsx(zr,{type:"checkbox",checked:r.requirePushedAuthorizationRequest,onChange:e=>i({...r,requirePushedAuthorizationRequest:e.target.checked})}),"Require Pushed Authorization Request"]}),t.jsx(_r,{children:"Requires authorization requests to be pushed via PAR endpoint before the authorization flow begins, providing better security for SPA applications"}),t.jsxs("div",{style:{marginTop:"1rem",padding:"1rem",background:"#f0f9ff",border:"1px solid #0ea5e9",borderRadius:"6px",fontSize:"0.85rem"},children:[t.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#0c4a6e",fontSize:"0.9rem",fontWeight:"600"},children:"🔄 PAR Flow Process"}),t.jsxs("ol",{style:{margin:0,paddingLeft:"1.5rem",color:"#0c4a6e",lineHeight:"1.5"},children:[t.jsxs("li",{children:[t.jsx("strong",{children:"Step 1:"})," Client sends POST request to ",t.jsx("code",{children:"/as/par"})," ","with all authorization parameters"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Step 2:"})," PingOne validates the request and returns a"," ",t.jsx("code",{children:"request_uri"})]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Step 3:"})," Client redirects user to ",t.jsx("code",{children:"/as/authorize"})," ","with only the ",t.jsx("code",{children:"request_uri"})]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Step 4:"})," PingOne retrieves the original parameters using the"," ",t.jsx("code",{children:"request_uri"})]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Step 5:"})," Normal OAuth flow continues with user authentication"]})]}),t.jsxs("div",{style:{marginTop:"0.5rem",fontSize:"0.8rem",color:"#0369a1"},children:[t.jsx("strong",{children:"Benefits:"})," Keeps sensitive parameters off the browser URL, prevents tampering, and provides better security for SPAs."]})]}),t.jsxs("div",{style:{marginTop:"1rem",padding:"1rem",background:"#f0fdf4",border:"1px solid #16a34a",borderRadius:"6px",fontSize:"0.85rem"},children:[t.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#15803d",fontSize:"0.9rem",fontWeight:"600"},children:"✅ PingOne PAR Compatibility"}),t.jsx("div",{style:{color:"#15803d",lineHeight:"1.5",marginBottom:"0.5rem"},children:t.jsx("strong",{children:"Supported Application Types:"})}),t.jsxs("ul",{style:{margin:"0 0 0.5rem 0",paddingLeft:"1.5rem",color:"#15803d",lineHeight:"1.5"},children:[t.jsxs("li",{children:[t.jsx("strong",{children:"OIDC Web App:"})," Authorization Code grant type ✅"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Native App:"})," Authorization Code or Implicit grant types ✅"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Single-page App:"})," Implicit grant type ✅"]}),t.jsxs("li",{children:[t.jsx("strong",{children:"Worker App:"})," Only if configured for user-based grant types ✅"]})]}),t.jsxs("div",{style:{fontSize:"0.8rem",color:"#16a34a"},children:[t.jsx("strong",{children:"PingOne Limits:"})," Max 1MB request size, 60-second default lifetime, HTTP POST only, request_uri can only be used once."]})]}),t.jsxs(Or,{style:{width:"100%"},children:[t.jsxs(Ur,{style:{width:"100%"},children:[t.jsx($r,{children:"Without PAR (Traditional Flow):"}),t.jsx(V,{url:"https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/authorize?response_type=code&client_id=a4f963ea-0736-456a-be72-b1fa4f63f81f&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauthz-callback&scope=openid%20profile%20email&state=af0ifjsldkj&code_challenge=4Ey6Qpryp0Z_5BEDPVQf&code_challenge_method=S256&nonce=n-0S6_WzA2Mj",title:"Authorization URL without PAR",showCopyButton:!0,showExplanationButton:!0})]}),t.jsxs(Ur,{style:{width:"100%"},children:[t.jsx($r,{children:"With PAR (Step 1 - PAR Request):"}),t.jsx(V,{url:"https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/par",title:"PAR Endpoint URL",showCopyButton:!0,showExplanationButton:!0}),t.jsxs("details",{style:{marginTop:"0.5rem"},children:[t.jsx("summary",{style:{fontSize:"0.8rem",color:"#374151",cursor:"pointer",fontWeight:"600"},children:"📋 Show Complete PAR Request Body"}),t.jsxs("div",{style:{marginTop:"0.5rem",padding:"0.75rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"4px",fontSize:"0.75rem",fontFamily:"Monaco, Menlo, Ubuntu Mono, monospace"},children:[t.jsx("strong",{children:"POST /as/par"}),t.jsx("br",{}),t.jsx("strong",{children:"Content-Type:"})," application/x-www-form-urlencoded",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"Request Body:"}),t.jsx("br",{}),"client_id=a4f963ea-0736-456a-be72-b1fa4f63f81f",t.jsx("br",{}),"client_secret=0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a",t.jsx("br",{}),"response_type=code",t.jsx("br",{}),"redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauthz-callback",t.jsx("br",{}),"scope=openid%20profile%20email",t.jsx("br",{}),"state=af0ifjsldkj",t.jsx("br",{}),"code_challenge=4Ey6Qpryp0Z_5BEDPVQf",t.jsx("br",{}),"code_challenge_method=S256",t.jsx("br",{}),"nonce=n-0S6_WzA2Mj",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"Response:"}),t.jsx("br",{}),"{",t.jsx("br",{}),'  "request_uri": "urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",',t.jsx("br",{}),'  "expires_in": 600',t.jsx("br",{}),"}"]})]})]}),t.jsxs(Ur,{style:{width:"100%"},children:[t.jsx($r,{children:"With PAR (Step 2 - Authorization URL):"}),t.jsx(V,{url:"https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/authorize?request_uri=urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz&client_id=a4f963ea-0736-456a-be72-b1fa4f63f81f",title:"Authorization URL with PAR",showCopyButton:!0,showExplanationButton:!0}),t.jsxs("div",{style:{marginTop:"0.5rem",fontSize:"0.8rem",color:"#6b7280"},children:[t.jsx("strong",{children:"Response from Step 1:"})," ","request_uri=urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"]})]})]})]})})]}),yr.isSupported()&&(l?.includes("mock")||l?.includes("demo")||l?.includes("jwt-bearer"))&&t.jsxs(jr,{children:[t.jsxs(vr,{children:[t.jsx(w,{})," DPoP (Demonstration of Proof of Possession)"]}),t.jsx(wr,{children:t.jsxs(kr,{style:{gridColumn:"1 / -1",width:"100%"},children:[t.jsxs(Rr,{children:[t.jsx(zr,{type:"checkbox",checked:r.enableDPoP,onChange:e=>i({...r,enableDPoP:e.target.checked})}),"Enable DPoP for enhanced token security"]}),t.jsxs(_r,{children:[t.jsx("strong",{children:"Demo Feature:"})," Demonstrates DPoP (RFC 9449) implementation for educational purposes. PingOne does not currently support DPoP validation, so this provides client-side proof generation only."]}),r.enableDPoP&&t.jsxs("div",{style:{marginTop:"1rem"},children:[t.jsxs(kr,{children:[t.jsx(Cr,{htmlFor:"dpop-algorithm",children:"Signature Algorithm"}),t.jsxs(Sr,{id:"dpop-algorithm",value:r.dpopAlgorithm,onChange:e=>i({...r,dpopAlgorithm:e.target.value}),children:[t.jsx("option",{value:"ES256",children:"ES256 (Elliptic Curve - Recommended)"}),t.jsx("option",{value:"RS256",children:"RS256 (RSA)"})]}),t.jsx(_r,{children:"Cryptographic algorithm used for DPoP proof signatures"})]}),t.jsxs("div",{style:{marginTop:"1rem",padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"6px"},children:[t.jsx("div",{style:{marginBottom:"0.5rem",fontWeight:"600",color:"#374151"},children:"DPoP Status"}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.25rem",fontSize:"0.875rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx("span",{style:{fontWeight:"500"},children:"Browser Support:"}),t.jsx("span",{style:{color:"#10b981"},children:"✓ Supported"})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx("span",{style:{fontWeight:"500"},children:"Algorithm:"}),t.jsx("span",{style:{color:"#6b7280"},children:r.dpopAlgorithm})]})]})]}),t.jsxs("div",{style:{marginTop:"1rem",display:"flex",gap:"0.75rem",padding:"1rem",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"6px"},children:[t.jsx(n,{color:"#1e40af",size:20,style:{flexShrink:0,marginTop:"0.125rem"}}),t.jsxs("div",{children:[t.jsx("div",{style:{fontWeight:"600",color:"#1e40af",marginBottom:"0.25rem"},children:"How DPoP Works"}),t.jsx("div",{style:{color:"#1e40af",fontSize:"0.875rem",lineHeight:"1.4"},children:"DPoP creates a cryptographic proof for each HTTP request using a private key. The authorization server can verify this proof to ensure the request comes from the legitimate client, preventing token theft and replay attacks."})]})]})]})]})})]}),t.jsxs(jr,{children:[t.jsxs(vr,{children:[t.jsx(x,{})," Client Authentication"]}),t.jsxs(wr,{children:[t.jsxs(kr,{children:[t.jsx(Cr,{htmlFor:"client-auth-method",children:"Client Authentication Method"}),t.jsxs(Sr,{id:"client-auth-method",value:r.clientAuthMethod,onChange:e=>g({clientAuthMethod:e.target.value}),children:[t.jsx("option",{value:"client_secret_post",children:"Client Secret Post"}),t.jsx("option",{value:"client_secret_basic",children:"Client Secret Basic"}),t.jsx("option",{value:"client_secret_jwt",children:"Client Secret JWT"}),t.jsx("option",{value:"private_key_jwt",children:"Private Key JWT"}),t.jsx("option",{value:"none",children:"None (Public Client)"})]}),t.jsx(_r,{children:"How the client authenticates with the token endpoint"})]}),t.jsxs(kr,{children:[t.jsx(Cr,{htmlFor:"pkce-enforcement",children:"PKCE Enforcement"}),t.jsxs(Sr,{id:"pkce-enforcement",value:r.pkceEnforcement,disabled:!0,style:{backgroundColor:"#f9fafb",color:"#6b7280",cursor:"not-allowed"},children:[t.jsx("option",{value:"OPTIONAL",children:"Optional"}),t.jsx("option",{value:"REQUIRED",children:"Required"}),t.jsx("option",{value:"S256_REQUIRED",children:"S256 Required"})]}),t.jsx(_r,{style:{color:"#059669",fontWeight:"500"},children:"⚙️ Configured in PingOne → Enable PKCE enforcement in your PingOne application settings to see this feature in the flow"})]})]}),"private_key_jwt"===r.clientAuthMethod&&t.jsxs(wr,{children:[t.jsxs(kr,{style:{gridColumn:"1 / -1"},children:[t.jsx(Cr,{htmlFor:"private-key",children:"Private Key (PKCS8 Format)"}),t.jsx(Ar,{id:"private-key",value:r.privateKey||"",onChange:e=>g({privateKey:e.target.value}),placeholder:"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----",rows:8,style:{fontFamily:"monospace",fontSize:"0.875rem"}}),t.jsx(_r,{children:"RSA private key in PKCS8 PEM format for signing JWT assertions"})]}),t.jsxs(kr,{children:[t.jsx(Cr,{htmlFor:"key-id",children:"Key ID (kid) - Optional"}),t.jsx(Ir,{id:"key-id",type:"text",value:r.keyId||"",onChange:e=>{g({keyId:e.target.value})},placeholder:"my-key-id",disabled:!1,readOnly:!1}),t.jsx(_r,{children:"Key identifier to match with JWKS (if using JWKS)"})]})]})]}),t.jsxs(jr,{children:[t.jsxs(vr,{children:[t.jsx(u,{})," JSON Web Key Set (JWKS)"]}),t.jsxs(wr,{children:[t.jsxs(kr,{style:{gridColumn:"1 / -1"},children:[t.jsx(Cr,{htmlFor:"enable-jwks-toggle",children:"Enable JWKS"}),t.jsx(Er,{id:"enable-jwks-toggle",$active:r.enableJWKS,onClick:()=>i({...r,enableJWKS:!r.enableJWKS}),"aria-pressed":r.enableJWKS,role:"switch","aria-label":"Enable JWKS",children:t.jsx("span",{})}),t.jsx(_r,{style:{color:"#059669",fontWeight:"500"},children:"🔧 Enable JWKS to configure JWT signature validation features"})]}),r.enableJWKS&&t.jsxs(t.Fragment,{children:[t.jsxs(kr,{style:{gridColumn:"1 / -1"},children:[t.jsx(Cr,{children:"JSON Web Key Set Method"}),t.jsxs(Tr,{children:[t.jsxs(Pr,{children:[t.jsx("input",{type:"radio",name:"jwksMethod",value:"JWKS_URL",checked:"JWKS_URL"===r.jwksMethod,onChange:()=>i({...r,jwksMethod:"JWKS_URL"})}),"JWKS URL"]}),t.jsxs(Pr,{children:[t.jsx("input",{type:"radio",name:"jwksMethod",value:"JWKS",checked:"JWKS"===r.jwksMethod,onChange:()=>i({...r,jwksMethod:"JWKS"})}),"JWKS"]})]}),t.jsx(_r,{style:{color:"#059669",fontWeight:"500"},children:"🔧 Choose how to provide your JSON Web Key Set"})]}),"JWKS_URL"===r.jwksMethod&&t.jsxs(kr,{style:{gridColumn:"1 / -1"},children:[t.jsx(Cr,{htmlFor:"jwks-url",children:"JWKS URL"}),t.jsx(Ir,{id:"jwks-url",type:"url",value:r.jwksUrl,onChange:e=>i({...r,jwksUrl:e.target.value}),placeholder:"https://example.com/.well-known/jwks.json"}),t.jsx(_r,{style:{color:"#059669",fontWeight:"500"},children:"⚙️ Configured in PingOne → Set your JWKS URL in PingOne application settings"})]}),"JWKS"===r.jwksMethod&&t.jsxs(kr,{style:{gridColumn:"1 / -1"},children:[t.jsx(Cr,{htmlFor:"jwks",children:"JWKS (JSON)"}),t.jsx(Ar,{id:"jwks",value:r.jwks,onChange:e=>i({...r,jwks:e.target.value}),placeholder:'{"keys": [...]}'}),t.jsx(_r,{style:{color:"#059669",fontWeight:"500"},children:"🔧 Enter your JSON Web Key Set as JSON"})]})]})]})]}),t.jsxs(jr,{children:[t.jsxs(vr,{children:[t.jsx(j,{})," Advanced Security Settings"]}),t.jsxs(wr,{children:[t.jsxs(kr,{children:[t.jsx(Cr,{htmlFor:"request-signature",children:"Request Parameter Signature Requirement"}),t.jsxs(Sr,{id:"request-signature",value:r.requestParameterSignatureRequirement,onChange:e=>i({...r,requestParameterSignatureRequirement:e.target.value}),children:[t.jsx("option",{value:"DEFAULT",children:"Default"}),t.jsx("option",{value:"REQUIRE_SIGNED",children:"Require Signed"}),t.jsx("option",{value:"ALLOW_UNSIGNED",children:"Allow Unsigned"})]}),t.jsxs(_r,{children:["Controls whether request parameters must be cryptographically signed for enhanced security and integrity",t.jsx("br",{}),t.jsx("strong",{children:"Default:"})," Uses PingOne's default signature requirements",t.jsx("br",{}),t.jsx("strong",{children:"Require Signed:"})," All requests must include valid signatures",t.jsx("br",{}),t.jsx("strong",{children:"Allow Unsigned:"})," Permits requests without signatures (less secure)"]})]}),t.jsxs(kr,{children:[t.jsxs(Rr,{children:[t.jsx(zr,{type:"checkbox",checked:r.additionalRefreshTokenReplayProtection,onChange:e=>i({...r,additionalRefreshTokenReplayProtection:e.target.checked})}),"Additional Refresh Token Replay Protection"]}),t.jsxs(_r,{children:["Prevents refresh tokens from being used multiple times, enhancing security by ensuring each token can only be used once",t.jsx("br",{}),t.jsx("strong",{children:"Benefit:"})," Prevents token replay attacks where stolen refresh tokens could be reused"]})]}),t.jsxs(kr,{children:[t.jsxs(Rr,{children:[t.jsx(zr,{type:"checkbox",checked:r.includeX5tParameter,onChange:e=>i({...r,includeX5tParameter:e.target.checked})}),"Include x5t Parameter"]}),t.jsxs(_r,{children:["Includes the x5t (X.509 certificate thumbprint) parameter in JWT tokens for certificate-based authentication validation",t.jsx("br",{}),t.jsx("strong",{children:"Purpose:"})," Allows clients to validate that JWTs were signed with the expected certificate"]})]}),t.jsxs(kr,{children:[t.jsxs(Rr,{children:[t.jsx(zr,{type:"checkbox",checked:r.oidcSessionManagement,onChange:e=>i({...r,oidcSessionManagement:e.target.checked})}),"OpenID Connect Session Management"]}),t.jsxs(_r,{children:["Enables OIDC session management features including session state and logout functionality for better user session handling",t.jsx("br",{}),t.jsx("strong",{children:"Features:"})," Session state tracking, logout redirection, and improved session lifecycle management"]})]}),t.jsxs(kr,{children:[t.jsxs(Rr,{children:[t.jsx(zr,{type:"checkbox",checked:r.requestScopesForMultipleResources,onChange:e=>i({...r,requestScopesForMultipleResources:e.target.checked})}),"Request Scopes for Multiple Resources"]}),t.jsxs(_r,{children:["Allows requesting permissions across multiple resource servers in a single authorization request, useful for microservices architectures",t.jsx("br",{}),t.jsx("strong",{children:"Use Case:"})," Applications that need access to multiple APIs/services can request all permissions in one authorization flow"]})]}),t.jsxs(kr,{children:[t.jsxs(Rr,{children:[t.jsx(zr,{type:"checkbox",checked:r.terminateUserSessionByIdToken,onChange:e=>i({...r,terminateUserSessionByIdToken:e.target.checked})}),"Terminate User Session by ID Token"]}),t.jsxs(_r,{children:["Allows terminating user sessions using the ID token, providing a way to logout users across all applications",t.jsx("br",{}),t.jsx("strong",{children:"Benefit:"})," Enables single logout (SLO) functionality where logging out from one application logs the user out from all related applications"]})]})]})]}),o&&t.jsx(Fr,{children:t.jsx(Mr,{onClick:o,disabled:!m||s,$hasChanges:m,$isSaving:s,title:s?"Saving...":m?"Save PingOne configuration":"No unsaved changes",children:s?t.jsxs(t.Fragment,{children:[t.jsx(f,{className:"animate-spin"}),"Saving..."]}):m?t.jsxs(t.Fragment,{children:[t.jsx(f,{}),"Save Configuration"]}):t.jsxs(t.Fragment,{children:[t.jsx(k,{}),"Saved"]})})})]})},Nr=E.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  color: #000000;
  
  h3 {
    color: #000000;
    margin: 0 0 1rem 0;
  }
  
  p {
    color: #000000;
  }
`,Wr=E.div`
  margin-bottom: 1rem;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #000000;
  }
  
  pre {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
    padding: 0.5rem;
    margin: 0;
    overflow-x: auto;
    color: #000000;
  }
`,Lr=()=>{const[r,n]=e.useState(null);return e.useEffect(()=>{const e=()=>{try{const e=Object.keys(localStorage),t=e.filter(e=>e.includes("pingone")),r={allLocalStorageKeys:e,pingoneKeys:t,pingone_permanent_credentials:localStorage.getItem("pingone_permanent_credentials"),pingone_session_credentials:localStorage.getItem("pingone_session_credentials"),pingone_config:localStorage.getItem("pingone_config"),pingone_config_credentials:localStorage.getItem("pingone_config_credentials"),pingone_authz_flow_credentials:localStorage.getItem("pingone_authz_flow_credentials"),enhanced_flow_authorization_code:localStorage.getItem("enhanced-flow-authorization-code"),credentialManager:{permanent:_.loadPermanentCredentials(),session:_.loadSessionCredentials(),all:_.getAllCredentials(),config:_.loadConfigCredentials(),authzFlow:_.loadAuthzFlowCredentials(),arePermanentComplete:_.arePermanentCredentialsComplete(),areAllComplete:_.areAllCredentialsComplete()}};n(r)}catch(e){n({allLocalStorageKeys:["Error loading"],pingoneKeys:[],pingone_permanent_credentials:null,pingone_session_credentials:null,pingone_config:null,pingone_config_credentials:null,pingone_authz_flow_credentials:null,enhanced_flow_authorization_code:null,credentialManager:{permanent:{},session:{},all:{},config:{},authzFlow:{},arePermanentComplete:!1,areAllComplete:!1}})}};e();const t=setInterval(e,2e3);return()=>clearInterval(t)},[]),r?t.jsxs(Nr,{children:[t.jsx("h3",{children:" Credential Debug Information"}),t.jsxs(Wr,{children:[t.jsx("h4",{children:"All localStorage Keys:"}),t.jsx("pre",{children:JSON.stringify(r.allLocalStorageKeys,null,2)})]}),t.jsxs(Wr,{children:[t.jsx("h4",{children:"PingOne Keys:"}),t.jsx("pre",{children:JSON.stringify(r.pingoneKeys,null,2)})]}),t.jsxs(Wr,{children:[t.jsx("h4",{children:"pingone_permanent_credentials (raw):"}),t.jsx("pre",{children:r.pingone_permanent_credentials||"null"})]}),t.jsxs(Wr,{children:[t.jsx("h4",{children:"pingone_session_credentials (raw):"}),t.jsx("pre",{children:r.pingone_session_credentials||"null"})]}),t.jsxs(Wr,{children:[t.jsx("h4",{children:"pingone_config (raw):"}),t.jsx("pre",{children:r.pingone_config||"null"})]}),t.jsxs(Wr,{children:[t.jsx("h4",{children:"pingone_config_credentials (raw):"}),t.jsx("pre",{children:r.pingone_config_credentials||"null"})]}),t.jsxs(Wr,{children:[t.jsx("h4",{children:"pingone_authz_flow_credentials (raw):"}),t.jsx("pre",{children:r.pingone_authz_flow_credentials||"null"})]}),t.jsxs(Wr,{children:[t.jsx("h4",{children:"enhanced_flow_authorization_code (raw):"}),t.jsx("pre",{children:r.enhanced_flow_authorization_code||"null"})]}),t.jsxs(Wr,{children:[t.jsx("h4",{children:"Credential Manager Results:"}),t.jsx("pre",{children:JSON.stringify(r.credentialManager,null,2)})]})]}):t.jsxs(Nr,{children:[t.jsx("h3",{children:" Credential Debug Information"}),t.jsx("p",{children:"Loading debug information..."})]})},Kr={"device-authorization":{clientSecret:"not-used",redirectUri:"not-used",tokenAuthMethod:"none",explanation:"Device Authorization Flow is designed for public clients (smart TVs, IoT devices, CLI tools) that cannot securely store secrets or handle browser redirects. The flow uses device codes and user verification codes instead."},implicit:{clientSecret:"not-used",redirectUri:"required",tokenAuthMethod:"none",explanation:"Implicit Flow is a legacy public client flow where tokens are returned directly in the URL fragment. No client authentication is used. Note: This flow is deprecated in OAuth 2.1 - use Authorization Code with PKCE instead."},"authorization-code":{clientSecret:"optional",redirectUri:"required",tokenAuthMethod:"client_secret_post",explanation:"Authorization Code Flow can be used with public clients (PKCE, no secret) or confidential clients (with secret). For confidential clients, use client_secret_post or client_secret_basic authentication."},"client-credentials":{clientSecret:"required",redirectUri:"not-used",tokenAuthMethod:"client_secret_post",explanation:"Client Credentials Flow is for machine-to-machine authentication where the client itself is the resource owner. Always requires client authentication (secret or private key). No redirect URI needed as there is no user interaction."},"resource-owner-password":{clientSecret:"required",redirectUri:"not-used",tokenAuthMethod:"client_secret_post",explanation:"Resource Owner Password Credentials Flow is a legacy flow where the client collects user credentials directly. Requires client authentication. No redirect URI needed. Note: This flow is deprecated - use Authorization Code Flow instead."},hybrid:{clientSecret:"required",redirectUri:"required",tokenAuthMethod:"client_secret_post",explanation:"Hybrid Flow (OIDC only) combines aspects of Authorization Code and Implicit flows. Requires confidential client with secret and redirect URI. Returns some tokens in the front channel and others via back channel."},ciba:{clientSecret:"required",redirectUri:"not-used",tokenAuthMethod:"client_secret_post",explanation:"Client Initiated Backchannel Authentication (CIBA) is for decoupled authentication scenarios where the user authenticates on a different device. Requires client authentication but no redirect URI as authentication happens out-of-band."},"jwt-bearer":{clientSecret:"not-used",redirectUri:"not-used",tokenAuthMethod:"private_key_jwt",explanation:"JWT Bearer Token Flow uses a signed JWT assertion for client authentication instead of a client secret. Requires private key JWT authentication. No redirect URI needed as this is a direct token exchange flow."},"worker-token":{clientSecret:"required",redirectUri:"not-used",tokenAuthMethod:"client_secret_post",explanation:"Worker Token Flow (PingOne-specific) is used to obtain access tokens for PingOne Management APIs. Requires a Worker application type in PingOne with appropriate management scopes. Client authentication required, no redirect URI needed."},"token-introspection":{clientSecret:"required",redirectUri:"not-used",tokenAuthMethod:"client_secret_post",explanation:"Token Introspection is used to validate and get metadata about access tokens. Requires client authentication to call the introspection endpoint. No redirect URI needed as this is a utility endpoint."},"token-revocation":{clientSecret:"required",redirectUri:"not-used",tokenAuthMethod:"client_secret_post",explanation:"Token Revocation is used to invalidate access or refresh tokens. Requires client authentication to call the revocation endpoint. No redirect URI needed as this is a utility endpoint."},userinfo:{clientSecret:"not-used",redirectUri:"not-used",tokenAuthMethod:"none",explanation:"UserInfo endpoint (OIDC) is called with a valid access token to retrieve user profile information. No client authentication needed - the access token itself provides authorization. No redirect URI needed."},redirectless:{clientSecret:"optional",redirectUri:"required",tokenAuthMethod:"client_secret_post",explanation:"Redirectless Flow (PingOne response_mode=pi.flow) is an enhanced authorization code flow that embeds authentication in an iframe/webview. Supports both public (PKCE) and confidential clients. Redirect URI required for callback handling."},rar:{clientSecret:"required",redirectUri:"required",tokenAuthMethod:"client_secret_post",explanation:"Rich Authorization Requests (RAR) extends OAuth 2.0 with granular authorization details. Requires client secret for confidential client authentication and redirect URI for authorization callback. Authorization details specify exact permissions requested."}},qr=E.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	overflow: hidden;
`,Jr=E.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 1rem 1.5rem;
	background: white;
	border-bottom: 1px solid #e5e7eb;
	cursor: pointer;
	user-select: none;
	
	&:hover {
		background: #f9fafb;
	}
`,Br=E.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex: 1;
`,Hr=E.div`
	display: flex;
	align-items: center;
	justify-content: center;
	background: #3b82f6;
	border-radius: 50%;
	width: 32px;
	height: 32px;
	transition: all 0.2s;
	
	&:hover {
		background: #2563eb;
	}
`,Vr=E.div`
	max-height: ${({$isCollapsed:e})=>e?"0":"2000px"};
	overflow: hidden;
	transition: max-height 0.3s ease;
	padding: ${({$isCollapsed:e})=>e?"0 1.5rem":"1.5rem"};
`,Gr=E.div`
	flex-shrink: 0;
	color: #3b82f6;
`,Yr=E.h3`
	margin: 0;
	font-size: 1.125rem;
	font-weight: 700;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Xr=E.p`
	margin: 0 0 1.25rem 0;
	font-size: 0.9375rem;
	line-height: 1.6;
	color: #374151;
`,Qr=E.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1rem;
`,Zr=E.div`
	background: white;
	border: 1px solid
		${({$status:e})=>"required"===e?"#f59e0b":"not-used"===e?"#10b981":"#6b7280"};
	border-radius: 0.5rem;
	padding: 1rem;
`,en=E.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
`,tn=E.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
`,rn=E.div`
	display: flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.25rem 0.625rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.025em;
	background: ${({$status:e})=>"required"===e?"#fef3c7":"not-used"===e?"#d1fae5":"#f3f4f6"};
	color: ${({$status:e})=>"required"===e?"#92400e":"not-used"===e?"#065f46":"#374151"};
`,nn=E.div`
	font-size: 0.875rem;
	color: #6b7280;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: #f9fafb;
	padding: 0.5rem;
	border-radius: 0.375rem;
	margin-top: 0.5rem;
`,on=({flowType:o,variant:s="oauth"})=>{const[a,l]=e.useState(!1),d=Kr[o];if(!d)return null;const c=e=>{switch(e){case"required":return t.jsx(i,{size:14});case"not-used":return t.jsx(k,{size:14});case"optional":return t.jsx(n,{size:14});default:return t.jsx(r,{size:14})}},p=e=>{switch(e){case"required":return"Required";case"not-used":return"Not Used";case"optional":return"Optional";default:return"Unknown"}};return t.jsxs(qr,{children:[t.jsxs(Jr,{onClick:()=>l(!a),children:[t.jsxs(Br,{children:[t.jsx(Gr,{children:t.jsx(n,{size:24})}),t.jsxs(Yr,{children:["PingOne Application Configuration Requirements","oidc"===s&&t.jsx("span",{style:{fontSize:"0.875rem",color:"#6b7280"},children:"(OIDC)"})]})]}),t.jsx(Hr,{children:t.jsx(y,{size:16,color:"white",style:{transform:a?"rotate(-90deg)":"rotate(0deg)",transition:"transform 0.2s ease"}})})]}),t.jsxs(Vr,{$isCollapsed:a,children:[t.jsx(Xr,{children:d.explanation}),t.jsxs(Qr,{children:[t.jsxs(Zr,{$status:d.clientSecret,children:[t.jsxs(en,{children:[t.jsx(tn,{children:"Client Secret"}),t.jsxs(rn,{$status:d.clientSecret,children:[c(d.clientSecret),p(d.clientSecret)]})]}),t.jsxs(nn,{children:["required"===d.clientSecret&&"Must configure a client secret","optional"===d.clientSecret&&"Optional - use for confidential clients","not-used"===d.clientSecret&&"Public client - no secret needed"]})]}),t.jsxs(Zr,{$status:d.redirectUri,children:[t.jsxs(en,{children:[t.jsx(tn,{children:"Redirect URI"}),t.jsxs(rn,{$status:d.redirectUri,children:[c(d.redirectUri),p(d.redirectUri)]})]}),t.jsxs(nn,{children:["required"===d.redirectUri&&"Must configure redirect URI(s)","optional"===d.redirectUri&&"Optional - depends on use case","not-used"===d.redirectUri&&"No redirect URI needed"]})]}),t.jsxs(Zr,{$status:"required",children:[t.jsxs(en,{children:[t.jsx(tn,{children:"Token Endpoint Auth Method"}),t.jsxs(rn,{$status:"required",children:[t.jsx(i,{size:14}),"Required"]})]}),t.jsxs(nn,{children:[t.jsx("strong",{children:d.tokenAuthMethod}),"none"===d.tokenAuthMethod&&" (public client)","client_secret_post"===d.tokenAuthMethod&&" (confidential client)"]})]})]})]})]})},sn=E.div`
  margin-bottom: 2rem;
`,an=E.button`
  background: #059669;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  margin-top: 1.5rem;
  width: auto;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  
  &:hover {
    background: #047857;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .spinner {
    margin-right: 8px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 2px solid white;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
`,ln=E.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  border-radius: 6px;
  padding: 0.25rem;
  margin: -0.25rem;
  
  &:hover {
    opacity: 0.8;
    background: ${({theme:e})=>e.colors.gray50};
  }
  
  &:focus {
    outline: 2px solid ${({theme:e})=>e.colors.primary};
    outline-offset: 2px;
  }
  
  h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .collapse-icon {
    ${()=>re.getCollapseIconStyles()}
    font-size: 1.75rem;
    padding: 0.5rem;
    border-radius: 8px;
    
    &:hover {
      transform: scale(1.15);
    }
    
    &:active {
      transform: scale(1.05);
    }
  }
`,dn=E.div`
  max-height: ${({$isExpanded:e})=>e?"2000px":"0"};
  overflow: hidden;
  transition: max-height 0.3s ease;
`,cn=E.div`
  margin-bottom: 1.5rem;
  
  h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({theme:e})=>e.colors.gray800};
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`,pn=E.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`,hn=E.div`
  display: flex;
  flex-direction: column;
  
  label {
    font-size: 0.9rem;
    font-weight: 500;
    color: ${({theme:e})=>e.colors.gray700};
    margin-bottom: 0.5rem;
  }
  
  input, select, textarea {
    padding: 0.5rem;
    border: 1px solid ${({theme:e})=>e.colors.gray300};
    border-radius: 4px;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    
    &:focus {
      outline: none;
      border-color: ${({theme:e})=>e.colors.primary};
      box-shadow: 0 0 0 3px ${({theme:e})=>e.colors.primary}20;
    }
  }
  
  textarea {
    min-height: 80px;
    resize: vertical;
  }
`,un=E.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background-color: ${({theme:e})=>e.colors.gray300};
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &.active {
      background-color: ${({theme:e})=>e.colors.primary};
    }
    
    .toggle-slider {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background-color: white;
      border-radius: 50%;
      transition: transform 0.2s;
      
      &.active {
        transform: translateX(20px);
      }
    }
  }
  
  .toggle-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: ${({theme:e})=>e.colors.gray700};
  }
`,mn=E.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`,gn=E.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  cursor: ${({$disabled:e})=>e?"not-allowed":"pointer"};
  transition: all 0.2s;
  border: 1px solid ${({theme:e,$selected:t})=>t?e.colors.primary:e.colors.gray300};
  background-color: ${({theme:e,$selected:t})=>t?e.colors.primary:"transparent"};
  color: ${({theme:e,$selected:t})=>t?"white":e.colors.gray700};
  opacity: ${({$disabled:e})=>e?.7:1};

  &:hover {
    border-color: ${({theme:e,$disabled:t})=>t?e.colors.gray300:e.colors.primary};
  }
`,fn=E.div`
  border: 1px solid ${({theme:e})=>e.colors.gray300};
  border-radius: 4px;
  padding: 1rem;
  background-color: ${({theme:e})=>e.colors.gray50};
`,xn=E.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  
  input {
    flex: 1;
  }
  
  button {
    padding: 0.25rem 0.5rem;
    background-color: ${({theme:e})=>e.colors.danger};
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    
    &:hover {
      background-color: ${({theme:e})=>e.colors.dangerDark};
    }
  }
`,bn=E.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${({theme:e})=>e.colors.success};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  
  &:hover {
    background-color: ${({theme:e})=>e.colors.successDark};
  }
`,yn=E.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: ${({$copied:e,theme:t})=>e?t.colors.success:t.colors.gray200};
  color: ${({$copied:e,theme:t})=>e?"white":t.colors.gray700};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({$copied:e,theme:t})=>e?t.colors.successDark:t.colors.gray300};
  }
`,jn=["openid","profile","email","address","phone","offline_access","api:read","api:write","admin:read","admin:write"],vn=["urn:mace:incommon:iap:silver","urn:mace:incommon:iap:bronze","urn:mace:incommon:iap:gold","urn:pingone:loa:1","urn:pingone:loa:2","urn:pingone:loa:3"],wn=["openid"],kn=(e=[])=>{const t=e.filter(Boolean);return wn.forEach(e=>{t.includes(e)||t.unshift(e)}),t},Cn=({config:r,onConfigChange:n,flowType:i,isConfigured:o=!1,initialExpanded:s=!0,title:a="Flow Config",subtitle:l="Customize OAuth parameters to see how they affect the flow"})=>{const[d,c]=e.useState(null),[p,h]=e.useState(!1),[u,g]=e.useState(!1),[b,j]=e.useState(s),{announce:v}=G(),w=e.useId(),C=e.useId(),S=e.useId(),I=e.useId(),A=e.useId(),E=e.useId(),z=e.useId(),R=e.useId(),_=e.useId(),T=e.useId(),P=e.useId(),O=e.useId(),U=e.useId(),$={...r,scopes:kn(r.scopes)},F=e.useCallback(e=>{n({...r,...e,scopes:kn(e.scopes??r.scopes)})},[r,n]),M=e=>wn.includes(e),D=e.useCallback(e=>{if(M(e))return;const t=$.scopes.includes(e),r=t?$.scopes.filter(t=>t!==e):[...$.scopes,e];n({...$,scopes:r}),v(`${e} scope ${t?"removed":"added"}`)},[v,$,n,M]),N=e.useCallback(()=>{const e={...$.customParams,"":""};F({customParams:e})},[$.customParams,F]),L=e.useCallback((e,t,r)=>{const n={...$.customParams};e!==t&&delete n[e],t&&(n[t]=r),F({customParams:n})},[$.customParams,F]),K=e.useCallback(e=>{const t={...$.customParams};delete t[e],F({customParams:t})},[$.customParams,F]),q=e.useCallback(()=>{const e={...$.customClaims,"":""};F({customClaims:e})},[$.customClaims,F]),J=e.useCallback((e,t,r)=>{const n={...$.customClaims};e!==t&&delete n[e],t&&(n[t]=r),F({customClaims:n})},[$.customClaims,F]),B=e.useCallback((e,t)=>{if(e===t)return;const r={...$.customClaims},n=r[e];if(void 0!==n){delete r[e];const i=t.trim();i&&(r[i]=n),F({customClaims:r})}},[$.customClaims,F]),H=e.useCallback(e=>{const t={...$.customClaims};delete t[e],F({customClaims:t})},[$.customClaims,F]),V=e.useCallback(async(e,t)=>{try{await navigator.clipboard.writeText(e),c(t),v(`${t} copied to clipboard`),window.setTimeout(()=>c(null),2e3)}catch(r){}},[v]),Z=e.useCallback(e=>{const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";let r="";for(let n=0;n<e;n+=1)r+=t.charAt(Math.floor(62*Math.random()));return r},[]),ee=e.useCallback(()=>{F({nonce:Z(32)})},[Z,F]),te=e.useCallback(()=>{F({state:Z(32)})},[Z,F]),re=e.useRef(null);e.useEffect(()=>()=>{re.current&&(window.clearTimeout(re.current),re.current=null)},[]);const ne=e.useCallback(async()=>{if(!p){h(!0);try{await new Promise(e=>{re.current=window.setTimeout(e,3200)}),g(!0),v("Configuration saved successfully"),re.current=window.setTimeout(()=>{g(!1),re.current=null},3200)}catch(e){v("Failed to save configuration")}finally{h(!1)}}},[v,p]);return t.jsx(sn,{children:t.jsxs(Y,{children:[t.jsxs(X,{children:[t.jsxs(ln,{onClick:()=>j(!b),"aria-label":b?"Collapse configuration":"Expand configuration",role:"button",tabIndex:0,onKeyDown:e=>{"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),j(!b))},children:[t.jsxs("h3",{children:[t.jsx(x,{}),a]}),t.jsx(y,{className:"collapse-icon",title:b?"Collapse":"Expand",style:{transform:b?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s ease"}})]}),t.jsx("p",{children:l})]}),t.jsxs(Q,{children:[t.jsxs(dn,{$isExpanded:b,children:[t.jsxs(cn,{children:[t.jsxs("h4",{children:[t.jsx(x,{}),"Basic OAuth Parameters"]}),t.jsxs(pn,{children:[t.jsxs(hn,{children:[t.jsx("label",{htmlFor:w,children:"Response Type"}),t.jsxs("select",{id:w,value:$.responseType,onChange:e=>F({responseType:e.target.value}),"aria-describedby":C,children:[t.jsx("option",{value:"code",children:"code (Authorization Code)"}),t.jsx("option",{value:"token",children:"token (Implicit)"}),t.jsx("option",{value:"id_token",children:"id_token (OIDC)"}),t.jsx("option",{value:"code token",children:"code token (Hybrid)"}),t.jsx("option",{value:"code id_token",children:"code id_token (Hybrid)"})]}),t.jsx("div",{id:C,className:"sr-only",children:"Select the OAuth response type for this flow"})]}),t.jsxs(hn,{children:[t.jsx("label",{htmlFor:S,children:"Grant Type"}),t.jsxs("select",{id:S,value:$.grantType,onChange:e=>F({grantType:e.target.value}),"aria-describedby":I,children:[t.jsx("option",{value:"authorization_code",children:"authorization_code"}),t.jsx("option",{value:"implicit",children:"implicit"}),t.jsx("option",{value:"client_credentials",children:"client_credentials"}),t.jsx("option",{value:"password",children:"password"}),t.jsx("option",{value:"refresh_token",children:"refresh_token"}),t.jsx("option",{value:"urn:ietf:params:oauth:grant-type:device_code",children:"device_code"})]}),t.jsx("div",{id:I,className:"sr-only",children:"Select the OAuth grant type for this flow"})]})]})]}),t.jsxs(cn,{children:[t.jsx("h4",{children:"OAuth Scopes"}),t.jsx(mn,{role:"group","aria-label":"OAuth scopes selection","aria-describedby":A,children:jn.map(e=>{const r=M(e),n=$.scopes.includes(e);return t.jsxs(gn,{$selected:n,$disabled:r,onClick:()=>D(e),role:"checkbox","aria-checked":n,"aria-label":`${e} scope`,tabIndex:r?-1:0,onKeyDown:t=>{r||"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),D(e))},title:r?"PingOne requires openid":void 0,children:[e,r&&t.jsx("span",{style:{fontStyle:"italic",fontSize:"0.7rem"},"aria-hidden":"true",children:"required"})]},e)})}),t.jsx("div",{id:A,className:"sr-only",children:"Select the OAuth scopes for this flow. Use Enter or Space to toggle selection."})]}),("authorization-code"===i||"pkce"===i)&&t.jsxs(cn,{children:[t.jsx("h4",{children:"PKCE (Proof Key for Code Exchange)"}),t.jsxs(pn,{children:[t.jsxs(un,{children:[t.jsx("div",{role:"switch","aria-checked":$.enablePKCE,className:"toggle-switch "+($.enablePKCE?"active":""),tabIndex:0,onClick:()=>F({enablePKCE:!$.enablePKCE}),onKeyDown:e=>{"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),F({enablePKCE:!$.enablePKCE}))},children:t.jsx("div",{className:"toggle-slider "+($.enablePKCE?"active":"")})}),t.jsx("span",{className:"toggle-label",children:"Enable PKCE"})]}),$.enablePKCE&&t.jsxs(hn,{children:[t.jsx("label",{htmlFor:E,children:"Code Challenge Method"}),t.jsxs("select",{id:E,value:$.codeChallengeMethod,onChange:e=>F({codeChallengeMethod:e.target.value}),children:[t.jsx("option",{value:"S256",children:"S256 (SHA256 - Recommended)"}),t.jsx("option",{value:"plain",children:"plain (Plain text - Less secure)"})]})]})]})]}),$.enableOIDC&&t.jsxs(cn,{children:[t.jsx("h4",{children:"OpenID Connect Settings"}),t.jsxs(pn,{children:[t.jsxs(hn,{children:[t.jsx("label",{htmlFor:z,children:"Nonce"}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[t.jsx("input",{type:"text",id:z,value:$.nonce,onChange:e=>F({nonce:e.target.value}),placeholder:"Random string for replay protection"}),t.jsx("button",{onClick:ee,children:"Generate"})]})]}),t.jsxs(hn,{children:[t.jsx("label",{htmlFor:R,children:"State"}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[t.jsx("input",{type:"text",id:R,value:$.state,onChange:e=>F({state:e.target.value}),placeholder:"Random string for CSRF protection"}),t.jsx("button",{onClick:te,children:"Generate"})]})]}),t.jsxs(hn,{children:[t.jsx("label",{htmlFor:_,children:"Max Age (seconds)"}),t.jsx("input",{type:"number",id:_,value:$.maxAge,onChange:e=>F({maxAge:parseInt(e.target.value,10)||0}),placeholder:"0 = no limit"})]}),t.jsxs(hn,{children:[t.jsx("label",{htmlFor:T,children:"Prompt"}),t.jsxs("select",{id:T,value:$.prompt,onChange:e=>F({prompt:e.target.value}),children:[t.jsx("option",{value:"",children:"None (default)"}),t.jsx("option",{value:"login",children:"login (force re-authentication)"}),t.jsx("option",{value:"consent",children:"consent (force consent)"}),t.jsx("option",{value:"select_account",children:"select_account (account selection)"})]})]}),t.jsxs(hn,{children:[t.jsx("label",{htmlFor:P,children:"Login Hint"}),t.jsx("input",{type:"text",id:P,value:$.loginHint,onChange:e=>F({loginHint:e.target.value}),placeholder:"username@domain.com"})]}),t.jsxs(hn,{children:[t.jsx("label",{htmlFor:O,children:"ACR Values"}),t.jsx("select",{multiple:!0,id:O,value:$.acrValues,onChange:e=>{const t=Array.from(e.target.selectedOptions,e=>e.value).filter(e=>e&&""!==e.trim()&&!/^[0-9]+$/.test(e)&&(e.startsWith("urn:")||e.length>3));F({acrValues:t})},children:vn.map(e=>t.jsx("option",{value:e,children:e},e))}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.25rem"},children:"Select valid ACR values. Invalid values like '1', '2', '3' will be automatically filtered out."})]})]})]}),t.jsxs(cn,{children:[t.jsx("h4",{children:"Client Authentication Method"}),t.jsx("p",{style:{fontSize:"0.875rem",color:"#6b7280",margin:"0.5rem 0 1rem 0"},children:"Choose how the client authenticates with the authorization server during token exchange."}),t.jsxs(hn,{children:[t.jsx("label",{htmlFor:U,children:"Authentication Method"}),t.jsxs("select",{id:U,value:$.clientAuthMethod,onChange:e=>F({clientAuthMethod:e.target.value}),children:[t.jsx("option",{value:"client_secret_post",children:"client_secret_post (Secret in POST body) - Current"}),t.jsx("option",{value:"client_secret_basic",children:"client_secret_basic (HTTP Basic Auth) - Secure"}),t.jsx("option",{value:"client_secret_jwt",children:"client_secret_jwt (JWT with shared secret) - More Secure"}),t.jsx("option",{value:"private_key_jwt",children:"private_key_jwt (JWT with private key) - Most Secure"}),t.jsx("option",{value:"none",children:"none (Public client, PKCE required) - For SPAs/Mobile"})]}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.5rem"},children:["client_secret_post"===$.clientAuthMethod&&" Client secret sent in request body (current implementation)","client_secret_basic"===$.clientAuthMethod&&" Client secret sent via HTTP Basic Authentication header","client_secret_jwt"===$.clientAuthMethod&&" Client creates JWT signed with client secret (HS256)","private_key_jwt"===$.clientAuthMethod&&" Client creates JWT signed with private key (RS256) - Enterprise grade","none"===$.clientAuthMethod&&" No client authentication - PKCE required for security"]})]})]}),t.jsxs(cn,{children:[t.jsx("h4",{children:"Custom Parameters"}),t.jsxs(fn,{children:[Object.entries($.customParams).map(([e,r],n)=>t.jsxs(xn,{children:[t.jsx("input",{type:"text",placeholder:"Parameter name",value:e,onChange:t=>L(e,t.target.value,r)}),t.jsx("input",{type:"text",placeholder:"Parameter value",value:r,onChange:t=>L(e,e,t.target.value)}),t.jsx("button",{onClick:()=>K(e),children:"Remove"})]},`param-${n}`)),t.jsx(bn,{onClick:N,children:"+ Add Custom Parameter"})]})]}),$.enableOIDC&&t.jsxs(cn,{children:[t.jsx("h4",{children:"Custom Claims for ID Token"}),t.jsxs(fn,{children:[Object.entries($.customClaims).map(([e,r],n)=>t.jsxs(xn,{children:[t.jsx("input",{type:"text",placeholder:"Claim name",value:e,onChange:t=>B(e,t.target.value)}),t.jsx("input",{type:"text",placeholder:"Claim value",value:String(r),onChange:t=>J(e,e,t.target.value)}),t.jsx("button",{onClick:()=>H(e),children:"Remove"})]},`claim-${n}`)),t.jsx(bn,{onClick:q,children:"+ Add Custom Claim"})]})]}),t.jsxs(cn,{children:[t.jsx("h4",{children:"UI Settings"}),t.jsxs(hn,{children:[t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",cursor:"pointer"},children:[t.jsx("input",{type:"checkbox",checked:$.showCredentialsModal,onChange:e=>F({showCredentialsModal:e.target.checked}),"aria-describedby":"credentials-modal-help"}),"Show Credentials Modal at Startup"]}),t.jsx("div",{id:"credentials-modal-help",style:{fontSize:"0.875rem",color:"#6b7280",marginTop:"0.25rem"},children:"Display the credentials setup modal when the application starts"})]}),t.jsxs(hn,{children:[t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",cursor:"pointer"},children:[t.jsx("input",{type:"checkbox",checked:$.showSuccessModal,onChange:e=>F({showSuccessModal:e.target.checked}),"aria-describedby":"success-modal-help"}),"Show Success Modal"]}),t.jsx("div",{id:"success-modal-help",style:{fontSize:"0.875rem",color:"#6b7280",marginTop:"0.25rem"},children:"Display a modal with authorization success details when returning from PingOne"})]}),t.jsxs(hn,{children:[t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",cursor:"pointer"},children:[t.jsx("input",{type:"checkbox",checked:$.enableErrorRecovery||!0,onChange:e=>F({enableErrorRecovery:e.target.checked}),"aria-describedby":"error-recovery-help"}),"Enable Error Recovery Suggestions"]}),t.jsx("div",{id:"error-recovery-help",style:{fontSize:"0.875rem",color:"#6b7280",marginTop:"0.25rem"},children:"Show detailed error recovery suggestions and troubleshooting steps when OAuth errors occur"})]}),t.jsxs(hn,{children:[t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",cursor:"pointer"},children:[t.jsx("input",{type:"checkbox",checked:$.showAuthCodeInModal,onChange:e=>F({showAuthCodeInModal:e.target.checked}),"aria-describedby":"auth-code-display-help"}),"Show Authorization Code in Modal"]}),t.jsx("div",{id:"auth-code-display-help",style:{fontSize:"0.875rem",color:"#6b7280",marginTop:"0.25rem"},children:"Display the raw authorization code in the success modal (disable for production security)"})]}),t.jsxs(hn,{children:[t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"0.5rem",cursor:"pointer"},children:[t.jsx("input",{type:"checkbox",checked:$.showAuthRequestModal||!1,onChange:e=>F({showAuthRequestModal:e.target.checked}),"aria-describedby":"auth-request-modal-help"}),"Show OAuth Authorization Request Modal"]}),t.jsx("div",{id:"auth-request-modal-help",style:{fontSize:"0.875rem",color:"#6b7280",marginTop:"0.25rem"},children:"Display a debugging modal showing all OAuth parameters before redirecting to PingOne (useful for debugging redirect URI issues)"})]})]}),t.jsxs(cn,{children:[t.jsx("h4",{children:"Configuration Summary"}),t.jsxs("div",{style:{background:"linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",border:"1px solid #cbd5e1",borderRadius:"8px",padding:"1.5rem",fontSize:"0.9rem",boxShadow:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",position:"relative"},children:[t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Scopes:"})," ",$.scopes.join(" "),t.jsxs(yn,{$copied:"scopes"===d,onClick:()=>V($.scopes.join(" "),"scopes"),children:["scopes"===d?t.jsx(k,{}):t.jsx(m,{}),"scopes"===d?"Copied!":"Copy"]})]}),$.enablePKCE&&t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"PKCE:"})," Enabled (",$.codeChallengeMethod,")"]}),$.enableOIDC&&t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"OIDC:"})," Nonce:"," ",$.nonce?`${$.nonce.substring(0,10)}...`:"none",", ",t.jsx("strong",{children:"State:"})," ",$.state?`${$.state.substring(0,10)}...`:"none"]}),$.maxAge>0&&t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Max Age:"})," ",$.maxAge," seconds"]}),$.prompt&&""!==$.prompt&&t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Prompt:"})," ",$.prompt]}),$.loginHint&&""!==$.loginHint&&t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Login Hint:"})," ",$.loginHint]}),$.acrValues&&$.acrValues.length>0&&t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"ACR Values:"})," ",$.acrValues.join(", ")]}),$.clientAuthMethod&&"client_secret_post"!==$.clientAuthMethod&&t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Client Auth:"})," ",$.clientAuthMethod]}),Object.keys($.customParams).length>0&&t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Custom Params:"})," ",Object.entries($.customParams).map(([e,t])=>`${e}=${t}`).join(", ")]}),$.enableOIDC&&Object.keys($.customClaims).length>0&&t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"Custom Claims:"})," ",Object.entries($.customClaims).map(([e,t])=>`${e}=${t}`).join(", ")]}),t.jsxs("div",{style:{marginTop:"1rem",paddingTop:"1rem",borderTop:"1px solid #cbd5e1",fontSize:"0.85rem",color:"#6b7280"},children:[t.jsx("strong",{style:{color:"#374151"},children:"UI Settings:"}),$.showSuccessModal&&" Success Modal",$.showAuthCodeInModal&&"  Auth Code in Modal",$.showCredentialsModal&&"  Credentials Modal",$.enableErrorRecovery&&"  Error Recovery",$.showAuthRequestModal&&"  Auth Request Modal",!$.showSuccessModal&&!$.showAuthCodeInModal&&!$.showCredentialsModal&&!$.enableErrorRecovery&&!$.showAuthRequestModal&&" None enabled"]})]})]})]}),t.jsx(an,{onClick:ne,disabled:p,children:p?t.jsxs(t.Fragment,{children:[t.jsx("div",{className:"spinner"}),"Saving..."]}):t.jsxs(t.Fragment,{children:[t.jsx(f,{}),o?"Complete":"Save Configuration"]})}),u&&t.jsx(W,{type:"success",message:"Configuration saved successfully!"})]})]})})},Sn=E.button`
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background: #4b5563;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`,In=E.div`
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
  padding: 1rem;
`,An=E.div`
  background: white;
  border-radius: 0.5rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`,En=E.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`,zn=E.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
`,Rn=E.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 0.25rem;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`,_n=E.div`
  padding: 1.5rem;
`,Tn=({flowType:r,currentConfig:n,onConfigChange:i,className:o})=>{const[s,a]=e.useState(!1),[l,d]=e.useState(()=>({...F(r),...n}));e.useEffect(()=>{const e=e=>{"Escape"===e.key&&s&&a(!1)};if(s)return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)},[s]);return t.jsxs(t.Fragment,{children:[t.jsxs(Sn,{className:o,onClick:()=>a(!0),title:`Configure ${r} flow parameters`,children:[t.jsx(x,{}),"Show Configuration"]}),s&&t.jsx(In,{onClick:()=>a(!1),children:t.jsxs(An,{onClick:e=>e.stopPropagation(),children:[t.jsxs(En,{children:[t.jsx(zn,{children:(e=>{switch(e){case"authorization_code":return"Authorization Code Flow Configuration";case"implicit":return"Implicit Flow Configuration";case"pkce":return"PKCE Flow Configuration";case"device_code":return"Device Code Flow Configuration";case"client_credentials":return"Client Credentials Flow Configuration";case"hybrid":return"Hybrid Flow Configuration";case"id_tokens":return"ID Tokens Flow Configuration";case"userinfo":return"UserInfo Flow Configuration";default:return"OAuth Flow Configuration"}})(r)}),t.jsx(Rn,{onClick:()=>a(!1)})]}),t.jsx(_n,{children:t.jsx(Cn,{config:l,onConfigChange:e=>{d(e),i?.(e)},flowType:r})})]})})]})},Pn={"device-authorization-v6":{clientSecret:"hidden",redirectUri:"hidden",tokenAuthMethod:"none"},"oidc-device-authorization-v6":{clientSecret:"hidden",redirectUri:"hidden",tokenAuthMethod:"none"},implicit:{clientSecret:"hidden",redirectUri:"required",tokenAuthMethod:"none"},"authorization-code":{clientSecret:"optional",redirectUri:"required",tokenAuthMethod:"client_secret_post"},"client-credentials":{clientSecret:"required",redirectUri:"hidden",tokenAuthMethod:"client_secret_post"},"resource-owner-password":{clientSecret:"required",redirectUri:"hidden",tokenAuthMethod:"client_secret_post"},hybrid:{clientSecret:"required",redirectUri:"required",tokenAuthMethod:"client_secret_post"},ciba:{clientSecret:"required",redirectUri:"hidden",tokenAuthMethod:"client_secret_post"}},On=E.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
`,Un=E.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.5rem 0.5rem 0 0;
  cursor: pointer;
  user-select: none;
`,$n=E.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: -0.025em;
`,Fn=E.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.9); /* White color for visibility on blue background */
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
  }
`,Mn=E.div`
  padding: ${({$isCollapsed:e})=>e?"0":"1rem"};
  max-height: ${({$isCollapsed:e})=>e?"0":"1000px"};
  overflow: hidden;
  transition: all 0.3s ease;
`,Dn=E.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: #f1f5f9;
  border-radius: 0.375rem;
  border: 1px solid #cbd5e1;
`,Nn=E.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  flex: 1;
`,Wn=E.input`
  width: 1rem;
  height: 1rem;
  accent-color: #3b82f6;
`,Ln=E.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  
  .client-secret-field {
    grid-column: 1 / -1;
    max-width: 800px; /* Increased width for longer client secrets */
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`,Kn=E.div`
  position: relative;
  display: flex;
  align-items: center;
  
  input {
    flex: 1;
    padding-right: 3rem;
  }
  
  .button-group {
    position: absolute;
    right: 0.5rem;
    display: flex;
    gap: 0.25rem;
  }
`,qn=E.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  
  textarea {
    flex: 1;
    padding-right: 3rem;
  }
  
  .button-group {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
    display: flex;
    gap: 0.25rem;
  }
`,Jn=E.input`
  width: 100%;
  min-width: 400px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  word-break: break-all;
  overflow-wrap: break-word;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
  
  &.is-invalid {
    border-color: #dc2626;
  }
`;E.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  line-height: 1.2;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  word-break: break-all;
  overflow-wrap: break-word;
  resize: vertical;
  min-height: 2.5rem;
  max-height: 4rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
  
  &.is-invalid {
    border-color: #dc2626;
  }
`;const Bn=E.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
`,Hn=E.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: 0.25rem;
  background: #6b7280;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #4b5563;
  }
  
  &:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
  }
  
  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`,Vn=E.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 0.75rem 1rem;
  background: ${({$success:e})=>e?"#10b981":"#6b7280"};
  color: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`,Gn=E.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: #10b981;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transform: ${({$isVisible:e})=>e?"translateX(0)":"translateX(100%)"};
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Yn=E.span`
  font-size: 1rem;
`,Xn=({flowType:r,onCredentialsChange:n,useGlobalDefaults:i=!1,onToggleGlobalDefaults:o,hideRedirectUri:a,hideGlobalToggle:c=!1,hideClientSecret:p,showTokenAuthMethod:h,tokenAuthMethod:u,showClientAuthMethodDropdown:g=!1,clientAuthMethod:f="client_secret_post",onClientAuthMethodChange:x})=>{const b=Pn[r],j=p??"hidden"===b?.clientSecret,v=a??"hidden"===b?.redirectUri,w=h??"none"===b?.tokenAuthMethod,S=u??b?.tokenAuthMethod??"none",[I,A]=e.useState(!1),[E,z]=e.useState(!1),[R,T]=e.useState(null),[P,U]=e.useState(!1),[$,F]=e.useState(null),[M,D]=e.useState({environmentId:"",clientId:"",clientSecret:"",redirectUri:"",additionalScopes:""}),[N,W]=e.useState({}),[L,K]=e.useState(!1),[q,J]=e.useState({environmentId:"",clientId:"",clientSecret:"",redirectUri:"",additionalScopes:""}),B=e.useRef(n);B.current=n;const H=e.useRef(!1);e.useEffect(()=>{H.current=!1,(()=>{if(!H.current)try{H.current=!0,O.config("FlowCredentials",`Loading credentials for flow: ${r}`);let e={};e="implicit"===r?_.loadImplicitFlowCredentials():"authorization-code"===r||"enhanced-authorization-code-v2"===r?_.loadAuthzFlowCredentials():_.loadConfigCredentials();const t={environmentId:e.environmentId||"",clientId:e.clientId||"",clientSecret:e.clientSecret||"",redirectUri:e.redirectUri||"",additionalScopes:Array.isArray(e.scopes)?e.scopes.join(" "):e.scopes||""};D(t),B.current?.(t),O.success("FlowCredentials",`Credentials loaded for ${r}`,t)}catch(e){H.current=!1,O.error("FlowCredentials","Failed to load credentials",e instanceof Error?e.message:String(e),e instanceof Error?e:void 0)}})()},[r]);const V=e.useMemo(()=>{const e=localStorage.getItem("pingone_config");let t={environmentId:"",clientId:"",clientSecret:"",redirectUri:"",additionalScopes:""};if(e)try{const r=JSON.parse(e);t={environmentId:r.environmentId||"",clientId:r.clientId||"",clientSecret:r.clientSecret||"",redirectUri:r.redirectUri||"",additionalScopes:r.additionalScopes||""}}catch(r){}return Object.keys(M).some(e=>{const r=e;return M[r]!==t[r]})},[M]),G=(e,t)=>{O.ui("FlowCredentials",`Field changed: ${e}`,{field:e,valueLength:t.length}),D(r=>({...r,[e]:t})),W(t=>({...t,[e]:void 0}))},Y=async(e,t)=>{if(e)try{O.ui("FlowCredentials",`Copying ${t} to clipboard`,{fieldName:t,textLength:e.length}),await navigator.clipboard.writeText(e),T(t),setTimeout(()=>T(null),2e3),O.success("FlowCredentials",`Successfully copied ${t}`)}catch(r){O.error("FlowCredentials","Failed to copy to clipboard",r instanceof Error?r.message:String(r),r instanceof Error?r:void 0)}},X=e=>{if(i){const t=localStorage.getItem("pingone_config");if(t){return JSON.parse(t)[e]||""}}return M[e]||""};return t.jsxs(t.Fragment,{children:[t.jsxs(Gn,{$isVisible:P,children:[t.jsx(Yn,{}),$]}),t.jsxs(On,{children:[t.jsxs(Un,{onClick:()=>A(!I),children:[t.jsxs($n,{children:["PingOne Credentials for ",(Q=r,{"authorization-code":"Authorization Code Flow",implicit:"Implicit Grant Flow",pkce:"PKCE Flow","client-credentials":"Client Credentials Flow","device-code":"Device Code Flow",hybrid:"Hybrid Flow",userinfo:"UserInfo Flow","id-tokens":"ID Tokens Flow"}[Q]||Q)]}),t.jsx(Fn,{$isCollapsed:I,children:I?t.jsx(y,{}):t.jsx(C,{})})]}),t.jsxs(Mn,{$isCollapsed:I,children:[!c&&t.jsx(Dn,{children:t.jsxs(Nn,{children:[t.jsx(Wn,{type:"checkbox",checked:i,onChange:e=>o?.(e.target.checked)}),"Use global PingOne configuration"]})}),t.jsxs(Ln,{children:[t.jsxs("div",{children:[t.jsx(Bn,{htmlFor:"environmentId",children:"Environment ID"}),t.jsxs(Kn,{children:[t.jsx(Jn,{id:"environmentId",type:"text",value:X("environmentId"),onChange:e=>G("environmentId",e.target.value),placeholder:"e.g., abc12345-6789-4abc-def0-1234567890ab",disabled:!1,className:N.environmentId?"is-invalid":""}),t.jsx("div",{className:"button-group",children:t.jsx(Hn,{type:"button",onClick:()=>Y(X("environmentId"),"Environment ID"),disabled:!X("environmentId"),"aria-label":"Copy Environment ID",title:"Copy Environment ID",children:"Environment ID"===R?t.jsx(k,{size:16}):t.jsx(m,{size:16})})})]})]}),t.jsxs("div",{children:[t.jsx(Bn,{htmlFor:"clientId",children:"Client ID"}),t.jsxs(Kn,{children:[t.jsx(Jn,{id:"clientId",type:"text",value:X("clientId"),onChange:e=>G("clientId",e.target.value),placeholder:"e.g., 12345678-1234-1234-1234-123456789012",disabled:!1,className:N.clientId?"is-invalid":""}),t.jsx("div",{className:"button-group",children:t.jsx(Hn,{type:"button",onClick:()=>Y(X("clientId"),"Client ID"),disabled:!X("clientId"),"aria-label":"Copy Client ID",title:"Copy Client ID",children:"Client ID"===R?t.jsx(k,{size:16}):t.jsx(m,{size:16})})})]})]}),w&&t.jsxs("div",{children:[t.jsx(Bn,{htmlFor:"tokenAuthMethod",children:"Token Endpoint Authentication Method"}),t.jsxs(Kn,{children:[t.jsx(Jn,{id:"tokenAuthMethod",type:"text",value:S,disabled:!0,style:{backgroundColor:"#f0fdf4",border:"1px solid #86efac",color:"#166534",fontWeight:"600",cursor:"not-allowed"}}),t.jsx("div",{className:"button-group",children:t.jsx(Hn,{type:"button",disabled:!0,"aria-label":"Required for Device Flow",title:"Public clients must use 'none' authentication",style:{backgroundColor:"#86efac",color:"#166534",cursor:"not-allowed"},children:t.jsx(k,{size:16})})})]}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#166534",marginTop:"0.25rem"},children:"✓ Public client - no authentication required (RFC 8628)"})]}),!j&&t.jsxs("div",{className:"client-secret-field",children:[t.jsx(Bn,{htmlFor:"clientSecret",children:"Client Secret"}),t.jsxs(qn,{children:[t.jsx(Jn,{id:"clientSecret",type:E?"text":"password",value:X("clientSecret"),onChange:e=>G("clientSecret",e.target.value),placeholder:"Enter your client secret",disabled:!1,className:N.clientSecret?"is-invalid":"",style:{fontFamily:'Monaco, Menlo, "Ubuntu Mono", monospace',fontSize:"0.875rem"}}),t.jsxs("div",{className:"button-group",children:[t.jsx(Hn,{type:"button",onClick:()=>z(!E),disabled:!1,"aria-label":E?"Hide client secret":"Show client secret",title:E?"Hide client secret":"Show client secret",children:E?t.jsx(l,{size:16}):t.jsx(d,{size:16})}),t.jsx(Hn,{type:"button",onClick:()=>Y(X("clientSecret"),"Client Secret"),disabled:!X("clientSecret"),"aria-label":"Copy Client Secret",title:"Copy Client Secret",children:"Client Secret"===R?t.jsx(k,{size:16}):t.jsx(m,{size:16})})]})]})]}),!v&&t.jsxs("div",{className:"redirect-uri-field",children:[t.jsx(Bn,{htmlFor:"redirectUri",children:"Redirect URI"}),t.jsxs(Kn,{children:[t.jsx(Jn,{id:"redirectUri",value:X("redirectUri"),onChange:e=>G("redirectUri",e.target.value),placeholder:"e.g., https://localhost:3000/callback",disabled:!1,className:N.redirectUri?"is-invalid":""}),t.jsx("div",{className:"button-group",children:t.jsx(Hn,{type:"button",onClick:()=>Y(X("redirectUri"),"Redirect URI"),disabled:!X("redirectUri"),"aria-label":"Copy Redirect URI",title:"Copy Redirect URI",children:"Redirect URI"===R?t.jsx(k,{size:16}):t.jsx(m,{size:16})})})]})]}),t.jsxs("div",{children:[t.jsx(Bn,{htmlFor:"additionalScopes",children:"Additional Scopes"}),t.jsxs(Kn,{children:[t.jsx(Jn,{id:"additionalScopes",type:"text",value:X("additionalScopes"),onChange:e=>G("additionalScopes",e.target.value),placeholder:"e.g., api:read api:write",disabled:!1,className:N.additionalScopes?"is-invalid":""}),t.jsx("div",{className:"button-group",children:t.jsx(Hn,{type:"button",onClick:()=>Y(X("additionalScopes"),"Additional Scopes"),disabled:!X("additionalScopes"),"aria-label":"Copy Additional Scopes",title:"Copy Additional Scopes",children:"Additional Scopes"===R?t.jsx(k,{size:16}):t.jsx(m,{size:16})})})]})]}),g&&t.jsxs("div",{children:[t.jsx(Bn,{htmlFor:"clientAuthMethod",children:"Client Authentication Method"}),t.jsxs("select",{id:"clientAuthMethod",value:f||"client_secret_post",onChange:e=>x?.(e.target.value),disabled:!1,style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.875rem",backgroundColor:"white",cursor:"pointer"},children:[t.jsx("option",{value:"client_secret_post",children:"Client Secret (POST)"}),t.jsx("option",{value:"client_secret_basic",children:"Client Secret (Basic Auth)"}),t.jsx("option",{value:"none",children:"None (Public Client)"})]}),t.jsx("div",{style:{marginTop:"0.5rem",fontSize:"0.75rem",color:"#6b7280"},children:"💡 Must match your PingOne application's Token Endpoint Authentication Method"})]})]}),t.jsxs("div",{style:{padding:"1rem",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"center",gap:"1rem"},children:[t.jsxs("button",{type:"button",onClick:()=>{try{O.ui("FlowCredentials",`Saving credentials for ${r}`,M);const e={environmentId:M.environmentId,clientId:M.clientId,clientSecret:M.clientSecret,redirectUri:M.redirectUri,scopes:M.additionalScopes?M.additionalScopes.split(" ").filter(e=>e.trim()):["openid","profile","email"]};let t=!1;if(t="implicit"===r?_.saveImplicitFlowCredentials(e):"authorization-code"===r||"enhanced-authorization-code-v2"===r?_.saveAuthzFlowCredentials(e):_.saveConfigCredentials(e),!t)throw new Error("Failed to save credentials to storage");J({...M}),K(!1),U(!0),F(`Credentials saved for ${r} flow`),n?.(M),O.success("FlowCredentials",`Credentials saved for ${r}`,M),setTimeout(()=>{U(!1),F(null)},3e3)}catch(e){O.error("FlowCredentials","Failed to save credentials",e instanceof Error?e.message:String(e),e instanceof Error?e:void 0),F("Failed to save credentials"),setTimeout(()=>F(null),3e3)}},disabled:!V,style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.75rem 2rem",backgroundColor:V?"#3b82f6":"#9ca3af",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:"500",cursor:V?"pointer":"not-allowed",transition:"all 0.2s",opacity:V?1:.6},children:[t.jsx(s,{size:16}),P?"Saved!":"Save Credentials"]}),V&&t.jsx("button",{type:"button",onClick:()=>{try{O.ui("FlowCredentials",`Resetting credentials for ${r}`),D({...q}),K(!1),U(!1),F(null),O.success("FlowCredentials",`Credentials reset for ${r}`)}catch(e){O.error("FlowCredentials","Failed to reset credentials",e instanceof Error?e.message:String(e),e instanceof Error?e:void 0)}},style:{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.75rem 1.5rem",backgroundColor:"transparent",color:"#6b7280",border:"1px solid #d1d5db",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:"500",cursor:"pointer",transition:"all 0.2s"},children:"Reset"})]})]})]}),R&&t.jsxs(Vn,{$success:!0,children:[R," copied to clipboard!"]})]});var Q},Qn=E.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin: 1rem 0;
`,Zn=E.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`,ei=E.label`
	font-weight: 600;
	color: #374151;
	font-size: 0.875rem;
`,ti=E.input`
	padding: 0.75rem;
	border: 2px solid #e5e7eb;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	&:disabled {
		background-color: #f3f4f6;
		color: #6b7280;
		cursor: not-allowed;
	}
`,ri=E.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	padding: 0.75rem;
	border-radius: 0.375rem;
	background: rgba(59, 130, 246, 0.1);
	border: 1px solid rgba(59, 130, 246, 0.3);
	margin-bottom: 1rem;
`,ni=E.div`
	font-size: 0.8125rem;
	color: #1e40af;
	line-height: 1.5;
`,ii=E.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1.5rem;
	justify-content: flex-end;
`,oi=E.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.375rem;
	border: none;
	background: ${({$variant:e})=>"secondary"===e?"#e5e7eb":"#3b82f6"};
	color: ${({$variant:e})=>"secondary"===e?"#374151":"#ffffff"};
	font-weight: 600;
	cursor: pointer;
	transition: background 0.2s;
	font-size: 0.875rem;
	
	&:hover {
		background: ${({$variant:e})=>"secondary"===e?"#d1d5db":"#2563eb"};
	}
	
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`,si=({isOpen:r,onClose:i,flowType:o,initialCredentials:s,onCredentialsSaved:a})=>{const[l,d]=e.useState({environmentId:s?.environmentId||"",clientId:s?.clientId||"",clientSecret:s?.clientSecret||"",redirectUri:s?.redirectUri||"https://localhost:3000/callback",scopes:s?.scopes||"openid profile email"}),[c,p]=e.useState(!1);e.useEffect(()=>{if(r){const e=ne.loadFlowCredentialsIsolated(o);e?.environmentId&&e.clientId&&e.clientSecret?d({environmentId:e.environmentId||s?.environmentId||"",clientId:e.clientId||s?.clientId||"",clientSecret:e.clientSecret||s?.clientSecret||"",redirectUri:e.redirectUri||s?.redirectUri||"https://localhost:3000/callback",scopes:Array.isArray(e.scopes)?e.scopes.join(" "):e.scopes||s?.scopes||"openid profile email"}):s&&d(s)}},[r,o,s]);return t.jsxs(L,{isOpen:r,onClose:i,title:"Configure Authorization Code Flow",width:"min(600px, calc(100vw - 2rem))",maxHeight:"calc(100vh - 4rem)",children:[t.jsxs(ri,{children:[t.jsx(n,{size:16,style:{flexShrink:0,color:"#3b82f6",marginTop:"0.125rem"}}),t.jsxs(ni,{children:[t.jsx("strong",{children:"Authorization Code Flow Configuration"}),t.jsx("br",{}),"Enter your PingOne application credentials for the Authorization Code flow. These credentials are used for user authentication (login)."]})]}),t.jsxs(Qn,{children:[t.jsxs(Zn,{children:[t.jsx(ei,{children:"Environment ID *"}),t.jsx(ti,{type:"text",placeholder:"e.g., b9817c16-9910-4415-b67e-4ac687da74d9",value:l.environmentId,onChange:e=>d(t=>({...t,environmentId:e.target.value}))})]}),t.jsxs(Zn,{children:[t.jsx(ei,{children:"Client ID *"}),t.jsx(ti,{type:"text",placeholder:"e.g., 5ac8ccd7-7ebc-4684-b0d9-233705e87a7c",value:l.clientId,onChange:e=>d(t=>({...t,clientId:e.target.value}))})]}),t.jsxs(Zn,{children:[t.jsx(ei,{children:"Client Secret *"}),t.jsx(ti,{type:"password",placeholder:"Enter your client secret",value:l.clientSecret,onChange:e=>d(t=>({...t,clientSecret:e.target.value}))})]}),t.jsxs(Zn,{children:[t.jsx(ei,{children:"Redirect URI"}),t.jsx(ti,{type:"text",placeholder:"https://localhost:3000/callback",value:l.redirectUri,onChange:e=>d(t=>({...t,redirectUri:e.target.value}))})]}),t.jsxs(Zn,{children:[t.jsx(ei,{children:"Scopes"}),t.jsx(ti,{type:"text",placeholder:"openid profile email",value:"string"==typeof l.scopes?l.scopes:l.scopes?.join(" ")||"",onChange:e=>d(t=>({...t,scopes:e.target.value}))})]})]}),t.jsxs(ii,{children:[t.jsx(oi,{$variant:"secondary",onClick:i,disabled:c,children:"Cancel"}),t.jsxs(oi,{onClick:async()=>{if(l.environmentId&&l.clientId&&l.clientSecret){p(!0);try{const e={...l,scopes:"string"==typeof l.scopes?l.scopes.split(/\s+/).filter(Boolean):l.scopes||["openid","profile","email"],lastUpdated:Date.now()};ne.saveFlowCredentialsIsolated(o,e)?($.showSuccess("Authorization Code credentials saved successfully"),a?.(l),i()):$.showError("Failed to save credentials")}catch(e){$.showError("Error saving credentials")}finally{p(!1)}}else $.showError("Please fill in all required fields (Environment ID, Client ID, and Client Secret)")},disabled:c,children:[t.jsx(f,{}),c?"Saving...":"Save Credentials"]})]})]})},ai=E.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`,li=E.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
`,di=E.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`,ci=E.label`
  font-size: 0.75rem;
  color: #475569;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`,pi=E.input`
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: #ffffff;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  color: #1e293b;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`,hi=E.textarea`
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: #ffffff;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  color: #1e293b;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  min-height: 120px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`,ui=E.div`
  position: relative;
  display: flex;
  align-items: center;

  input {
    padding-right: 2.5rem;
  }

  button {
    position: absolute;
    right: 0.5rem;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    transition: color 0.2s;

    &:hover {
      color: #1e293b;
    }
  }
`,mi=E.button`
  border-radius: 0.5rem;
  padding: 0.625rem 1.125rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #2563eb;
  background: #3b82f6;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;

  &:hover:not(:disabled) {
    background: #2563eb;
    border-color: #1d4ed8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,gi=E.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`,fi=E.div`
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.75rem;
  word-break: break-all;
  color: #1e293b;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 0.75rem;
`,xi=E.details`
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 0.375rem;
  font-size: 0.75rem;

  summary {
    cursor: pointer;
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.5rem;
  }

  pre {
    margin: 0;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 0.7rem;
    color: #1e293b;
    white-space: pre-wrap;
    word-break: break-word;
  }
`,bi=E.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 1.125rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: 1px solid #2563eb;
  background: #3b82f6;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
    border-color: #1d4ed8;
  }
`,yi=({type:r,initialConfig:n,onJWTGenerated:i,onPrivateKeyGenerated:o})=>{const[a,c]=e.useState(n?.clientId||""),[p,h]=e.useState(n?.tokenEndpoint||""),[g,f]=e.useState(n?.issuer||""),[x,b]=e.useState(n?.subject||""),[y,j]=e.useState(n?.expiryMinutes||5),[w,k]=e.useState(n?.clientSecret||""),[C,A]=e.useState(!1),[E,z]=e.useState(n?.privateKey||""),[R,_]=e.useState(n?.keyId||""),[T,P]=e.useState(null),[O,U]=e.useState(!1),[F,W]=e.useState(!1);return t.jsxs(ai,{children:[t.jsxs(li,{children:[t.jsxs(di,{children:[t.jsx(ci,{children:"Client ID *"}),t.jsx(pi,{type:"text",value:a,onChange:e=>c(e.target.value),placeholder:"your-client-id"})]}),t.jsxs(di,{children:[t.jsx(ci,{children:"Token Endpoint *"}),t.jsx(pi,{type:"url",value:p,onChange:e=>h(e.target.value),placeholder:"https://auth.pingone.com/{envId}/as/token"})]})]}),"client_secret_jwt"===r?t.jsxs(di,{children:[t.jsx(ci,{children:"Client Secret *"}),t.jsxs(ui,{children:[t.jsx(pi,{type:C?"text":"password",value:w,onChange:e=>k(e.target.value),placeholder:"••••••••••••"}),t.jsx("button",{type:"button",onClick:()=>A(!C),"aria-label":C?"Hide secret":"Show secret",children:C?t.jsx(l,{size:16}):t.jsx(d,{size:16})})]}),t.jsx(gi,{children:t.jsxs(mi,{onClick:async()=>{W(!0);try{const e=M(32,"hex");k(e.secret);const t=D.clientSecret(e.secret);$.showSuccess(`Client secret generated! Strength: ${t.strength.toUpperCase()} (${t.score}/6)`),t.recommendations.length}catch(e){$.showError("Failed to generate client secret")}finally{W(!1)}},disabled:F,style:{background:"#10b981",borderColor:"#059669",fontSize:"0.75rem",padding:"0.5rem 0.75rem"},children:[t.jsx(v,{size:14}),F?"Generating...":"Generate Secret"]})})]}):t.jsxs(t.Fragment,{children:[t.jsxs(di,{children:[t.jsx(ci,{children:"Private Key (PEM) *"}),t.jsx(ui,{children:t.jsx(hi,{value:E,onChange:e=>z(e.target.value),placeholder:"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"})}),t.jsx(gi,{children:t.jsxs(mi,{onClick:async()=>{W(!0);try{const e=await N(2048);z(e.privateKey),_(e.keyId);const t=D.keyPair(2048);$.showSuccess(`RSA key pair generated! Key ID: ${e.keyId}`),$.showInfo(t.recommendation),o&&o(e.privateKey,e.keyId)}catch(e){$.showError("Failed to generate RSA key pair")}finally{W(!1)}},disabled:F,style:{background:"#10b981",borderColor:"#059669",fontSize:"0.75rem",padding:"0.5rem 0.75rem"},children:[t.jsx(v,{size:14}),F?"Generating...":"Generate Key Pair"]})})]}),t.jsxs(di,{children:[t.jsx(ci,{children:"Key ID (kid)"}),t.jsx(pi,{type:"text",value:R,onChange:e=>_(e.target.value),placeholder:"Generated automatically when creating key pair"})]})]}),t.jsxs(li,{children:[t.jsxs(di,{children:[t.jsx(ci,{children:"Issuer"}),t.jsx(pi,{type:"text",value:g,onChange:e=>f(e.target.value),placeholder:`Defaults to ${a||"Client ID"}`})]}),t.jsxs(di,{children:[t.jsx(ci,{children:"Subject"}),t.jsx(pi,{type:"text",value:x,onChange:e=>b(e.target.value),placeholder:`Defaults to ${a||"Client ID"}`})]})]}),t.jsxs(di,{children:[t.jsx(ci,{children:"Expiry (minutes)"}),t.jsx(pi,{type:"number",value:y,onChange:e=>j(Number(e.target.value)||5),min:"1",max:"60",placeholder:"5"})]}),t.jsx(gi,{children:t.jsxs(mi,{onClick:async()=>{U(!0),P(null);try{let e;if("client_secret_jwt"===r){if(!a||!p||!w)return $.showError("Please fill in all required fields"),void U(!1);const t={clientId:a,tokenEndpoint:p,clientSecret:w,expiryMinutes:y||5};g&&(t.issuer=g),x&&(t.subject=x),e=await ie.generateClientSecretJWT(t)}else{if(!a||!p||!E)return $.showError("Please fill in all required fields"),void U(!1);if(!ie.validatePrivateKey(E))return $.showError("Invalid private key format. Please provide a valid PEM-formatted private key."),void U(!1);const t={clientId:a,tokenEndpoint:p,privateKey:E,expiryMinutes:y||5};R&&(t.keyId=R),g&&(t.issuer=g),x&&(t.subject=x),e=await ie.generatePrivateKeyJWT(t)}P(e),e.success&&e.jwt?($.showSuccess("JWT generated successfully!"),i?.(e.jwt,e)):$.showError(e.error||"Failed to generate JWT")}catch(e){const t=e instanceof Error?e.message:"Unknown error";P({success:!1,error:t}),$.showError(`Failed to generate JWT: ${t}`)}finally{U(!1)}},disabled:O,children:[t.jsx(u,{size:16}),O?"Generating...":"Generate JWT"]})}),T&&t.jsx("div",{style:{marginTop:"1rem",padding:"1rem",borderRadius:"0.5rem",background:T.success?"#f0fdf4":"#fef2f2",border:"1px solid "+(T.success?"#86efac":"#fecaca")},children:T.success&&T.jwt?t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem",fontWeight:"600",fontSize:"0.875rem",color:"#166534"},children:[t.jsx(s,{size:16}),"JWT Generated Successfully"]}),t.jsx(fi,{children:T.jwt}),t.jsx(gi,{children:t.jsxs(bi,{onClick:async()=>{if(T?.jwt)try{await navigator.clipboard.writeText(T.jwt),$.showSuccess("JWT copied to clipboard")}catch{$.showError("Failed to copy JWT")}},children:[t.jsx(m,{size:14}),"Copy JWT"]})}),T.claims&&t.jsxs(xi,{children:[t.jsxs("summary",{children:[t.jsx(S,{size:14,style:{display:"inline",marginRight:"0.25rem"}}),"View JWT Claims"]}),t.jsx("pre",{children:JSON.stringify(T.claims,null,2)})]}),T.header&&t.jsxs(xi,{children:[t.jsxs("summary",{children:[t.jsx(S,{size:14,style:{display:"inline",marginRight:"0.25rem"}}),"View JWT Header"]}),t.jsx("pre",{children:JSON.stringify(T.header,null,2)})]})]}):t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem",fontWeight:"600",fontSize:"0.875rem",color:"#991b1b"},children:[t.jsx(I,{size:16}),"Generation Failed",T.error&&t.jsx("span",{style:{fontWeight:"normal",marginLeft:"0.5rem"},children:T.error})]})})]})},ji="p1-v8-credential-store";let vi={apps:[],workerTokens:[]};function wi(){"undefined"!=typeof window&&window.localStorage.setItem(ji,JSON.stringify(vi))}function ki(){return vi}function Ci(){const[t,r]=e.useState(()=>function(){if("undefined"==typeof window)return vi;try{const e=window.localStorage.getItem(ji);if(!e)return vi;const t=JSON.parse(e);return vi=t,vi}catch{return vi}}());return e.useEffect(()=>{const e=setInterval(()=>{r({...ki()})},1e3);return()=>clearInterval(e)},[]),{apps:t.apps,selectedAppId:t.selectedAppId,workerTokens:t.workerTokens,selectApp:e=>{!function(e){vi.selectedAppId=e,wi()}(e),r({...ki()})},addOrUpdateApp:e=>{!function(e){const t=vi.apps.findIndex(t=>t.appId===e.appId);-1===t?vi.apps.push(e):vi.apps[t]=e,wi()}(e),r({...ki()})},deleteApp:e=>{!function(e){vi.apps=vi.apps.filter(t=>t.appId!==e),vi.selectedAppId===e&&(vi.selectedAppId=void 0),wi()}(e),r({...ki()})},getActiveAppConfig:()=>function(){if(vi.selectedAppId)return vi.apps.find(e=>e.appId===vi.selectedAppId)}(),getValidWorkerToken:(e,t)=>function(e,t=Date.now()){const r=vi.workerTokens.find(t=>t.environmentId===e);if(r&&!(r.expiresAt<=t))return r}(e,t),saveWorkerToken:e=>{!function(e){vi.workerTokens=[...vi.workerTokens.filter(t=>t.environmentId!==e.environmentId),e],wi()}(e),r({...ki()})}}}const Si=E.div`
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f9fafb;
  margin: 1rem 0;
`,Ii=E.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`,Ai=E.h3`
  margin: 0;
  color: #1f2937;
  font-size: 1rem;
`,Ei=E.div`
  display: flex;
  gap: 0.5rem;
`,zi=E.button`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;

  ${e=>{switch(e.variant){case"primary":return"\n          background: #3b82f6;\n          color: white;\n          border: 1px solid #3b82f6;\n\n          &:hover:not(:disabled) {\n            background: #2563eb;\n            border-color: #2563eb;\n          }\n        ";case"danger":return"\n          background: #ef4444;\n          color: white;\n          border: 1px solid #ef4444;\n\n          &:hover:not(:disabled) {\n            background: #dc2626;\n            border-color: #dc2626;\n          }\n        ";default:return"\n          background: white;\n          color: #374151;\n          border: 1px solid #d1d5db;\n\n          &:hover:not(:disabled) {\n            background: #f9fafb;\n            border-color: #9ca3af;\n          }\n        "}}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,Ri=E.div`
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
`,_i=E.div`
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: white;
`,Ti=E.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`,Pi=E.h4`
  margin: 0;
  color: #1f2937;
  font-size: 0.875rem;
`,Oi=E.div`
  font-size: 0.75rem;
  color: ${e=>e.$hasSecret?"#059669":"#d97706"};
  font-weight: 500;
`,Ui=E.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
`,$i=E.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.75rem;
`,Fi=E.input`
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.75rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Mi=E.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.75rem;
`,Di=({onCredentialsUpdated:r})=>{const{apps:n,addOrUpdateApp:i}=Ci(),[o,s]=e.useState(null),[a,l]=e.useState({clientSecret:"",scopes:[]}),[d,c]=e.useState({clientId:"",clientSecret:"",environmentId:""});e.useEffect(()=>{c({clientId:"a4f963ea-0736-456a-be72-b1fa4f63f81f",clientSecret:"0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a",environmentId:"b9817c16-9910-4415-b67e-4ac687da74d9"})},[]);const p=()=>{s(null),l({clientSecret:"",scopes:[]})},h=()=>{if(!o)return;const e=n.find(e=>e.appId===o);if(!e)return;const t={...e,clientSecret:a.clientSecret||void 0,scopes:a.scopes.length>0?a.scopes:void 0};i(t),p(),r?.()},u=(e,t)=>{l(r=>({...r,[e]:t}))},m=d.clientId&&d.clientSecret&&d.environmentId;return t.jsxs(Si,{children:[t.jsxs(Ii,{children:[t.jsx(Ai,{children:"Client Credential Manager"}),t.jsx(Ei,{children:m&&t.jsx(zi,{variant:"primary",onClick:()=>{const e=n.find(e=>e.clientId===d.clientId&&e.environmentId===d.environmentId);if(e){const t={...e,clientSecret:d.clientSecret||e.clientSecret,scopes:e.scopes||["openid","profile","email"]};i(t)}else if(d.clientId&&d.environmentId){const e={appId:`env-import-${Date.now()}`,label:"Environment Import",environmentId:d.environmentId,clientId:d.clientId,clientSecret:d.clientSecret,scopes:["openid","profile","email"],redirectUris:["http://localhost:3000/callback"]};i(e)}r?.()},children:"Import from Environment"})})]}),m&&t.jsxs("div",{style:{background:"#ecfdf5",border:"1px solid #d1fae5",borderRadius:"0.375rem",padding:"0.75rem",marginBottom:"1rem",fontSize:"0.875rem",color:"#065f46"},children:[t.jsx("strong",{children:"Environment Variables Detected:"}),' Client credentials found in environment. Click "Import from Environment" to add them to an app.']}),t.jsxs(Ri,{children:[n.map(e=>t.jsxs(_i,{children:[t.jsxs(Ti,{children:[t.jsxs("div",{children:[t.jsx(Pi,{children:e.label}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#6b7280"},children:["Client ID: ",e.clientId.substring(0,12),"... • Env:"," ",e.environmentId.substring(0,12),"..."]})]}),t.jsx(Oi,{$hasSecret:!!e.clientSecret,children:e.clientSecret?"✅ Has Secret":"⚠️ No Secret"})]}),o===e.appId?t.jsxs("div",{children:[t.jsxs(Ui,{children:[t.jsx($i,{children:"Client Secret:"}),t.jsx(Fi,{type:"password",value:a.clientSecret,onChange:e=>u("clientSecret",e.target.value),placeholder:"Enter client secret"})]}),t.jsxs(Ui,{children:[t.jsx($i,{children:"Scopes:"}),t.jsx(Fi,{type:"text",value:a.scopes.join(" "),onChange:e=>u("scopes",e.target.value.split(/\s+/).filter(Boolean)),placeholder:"openid profile email"})]}),t.jsxs(Mi,{children:[t.jsx(zi,{variant:"primary",onClick:h,children:"Save"}),t.jsx(zi,{variant:"secondary",onClick:p,children:"Cancel"})]})]}):t.jsx(Mi,{children:t.jsx(zi,{variant:"secondary",onClick:()=>(e=>{const t=n.find(t=>t.appId===e);t&&(s(e),l({clientSecret:t.clientSecret||"",scopes:t.scopes||[]}))})(e.appId),children:e.clientSecret?"Edit Credentials":"Add Client Secret"})})]},e.appId)),0===n.length&&t.jsx("div",{style:{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:"0.875rem"},children:"No apps configured yet. Add apps through the PingOne Application Picker or import from environment variables."})]})]})};export{si as A,Rt as C,Lr as D,on as F,yi as J,Ie as N,Dr as P,at as S,_e as a,Te as b,De as c,Gt as d,Je as e,Xt as f,xr as g,Xn as h,Be as i,qe as j,yr as k,Le as l,br as m,Cn as n,Tn as o,ct as p,Yt as q,Ci as r,Re as s,He as t,Pe as u,Di as v,Ee as w,nt as x,pt as y};
//# sourceMappingURL=components-credentials-T7jmF3zx.js.map
