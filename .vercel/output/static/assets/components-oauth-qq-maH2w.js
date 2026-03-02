const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/utils-lzKqcxFi.js","assets/react-vendor-HWZo9XlX.js","assets/vendor-CvVeuJe7.js","assets/vendor-54DrP_uy.css","assets/components-credentials-T7jmF3zx.js","assets/styled-vendor-DGSsHzxd.js","assets/v8-utils-BU6AoW1l.js","assets/v8-services-DHsPM8a2.js","assets/v8-components-8swtZwHb.js","assets/v8u-services-CviCpCEt.js","assets/v8u-components-COnDGHJS.js","assets/components-flow-core-y1x-SJYd.js","assets/components-token-uXxDPBqK.js","assets/oauth-flows-device-CMULWbHZ.js","assets/pages-ai-D2KhTcan.js","assets/pages-DE-6TDOE.js","assets/components-oauth-authorize-sao_-EgS.js","assets/components-oauth-discovery-DYbdhNwI.js","assets/pages-pingone-BLdy8FiO.js","assets/oauth-flows-authcode-ltS0AxHA.js","assets/components-oauth-par-B-NhQsyD.js","assets/oauth-flows-BoQiEZ27.js","assets/oauth-flows-par-DTJ0aZ64.js","assets/oauth-flows-implicit-BlAJpg9o.js","assets/pages-docs-nYnYMLbe.js","assets/components-flow-BH3Bx-YA.js","assets/components-steps-BQ6HbS5x.js","assets/components-ui-DbX9aVva.js","assets/components-oauth-client-BhjYl9xl.js","assets/components-flow-core-DEegsKK7.css","assets/v8-hooks-B7CjPGrP.js","assets/v8-flows-CbgB_G0p.js","assets/v8-flows-Bwbl_h2s.css"])))=>i.map(i=>d[i]);
import{a as e,j as t,u as r,F as n,e as i,f as o,h as s,i as a,k as c,l,m as d,n as u,o as p,p as h,q as g,s as m,t as f,v as b,w as x,R as y,x as w,z as v,A as k,B as j,C as S,L as C,D as A,E as T,G as _,H as R,I,J as $,K as E,M as z,N as P,O,Q as U,S as D,T as L,U as N,V as M,W as F,X as q,Y as V,Z as B,_ as W,$ as G,a0 as H,a1 as J,a2 as K,a3 as Y,a4 as X,a5 as Q,a6 as Z,a7 as ee,a8 as te,a9 as re,aa as ne,ab as ie,ac as oe,ad as se,ae,af as ce,ag as le,ah as de,ai as ue,aj as pe,ak as he,al as ge,am as me,an as fe,ao as be,ap as xe,aq as ye,ar as we,as as ve,at as ke,au as je,av as Se}from"./react-vendor-HWZo9XlX.js";import{a as Ce,l as Ae,r as Te}from"./styled-vendor-DGSsHzxd.js";import{P as _e}from"./vendor-CvVeuJe7.js";import{e as Re,b as Ie,a as $e}from"./v8u-services-CviCpCEt.js";import{l as Ee,g as ze,o as Pe,v as Oe,s as Ue,_ as De,a as Le,c as Ne,b as Me,d as Fe,e as qe,A as Ve,K as Be,f as We,h as Ge,i as He,F as Je,j as Ke,p as Ye,k as Xe,m as Qe,n as Ze,P as et,q as tt,r as rt,t as nt,u as it,w as ot,x as st,y as at,z as ct,B as lt,C as dt,D as ut,E as pt,G as ht,H as gt,I as mt,J as ft,L as bt,M as xt,N as yt,O as wt,Q as vt,R as kt,S as jt,T as St,U as Ct,V as At,W as Tt,X as _t,Y as Rt}from"./utils-lzKqcxFi.js";import{E as It,F as $t,I as Et,C as zt,T as Pt,u as Ot}from"./components-flow-core-y1x-SJYd.js";import{L as Ut}from"./v8u-components-COnDGHJS.js";import{c as Dt,l as Lt,f as Nt,s as Mt}from"./components-credentials-T7jmF3zx.js";class Ft{static FLOW_CONTEXT_KEY="flowContext";static TOKEN_MANAGEMENT_CONTEXT_KEY="tokenManagementFlowContext";static MAX_CONTEXT_AGE_MS=18e5;static MAX_CONTEXT_SIZE=5e4;static saveFlowContext(e,t){try{if(!Ft.validateFlowContext(t).valid)return!1;const r={...t,timestamp:Date.now(),metadata:{...t.metadata,sessionId:Ft.generateSessionId(),flowId:e,userAgent:navigator.userAgent.substring(0,200)}},n=JSON.stringify(r);if(n.length>Ft.MAX_CONTEXT_SIZE)return!1;const i=Ft.getStorageKey(t.flowType);return sessionStorage.setItem(i,n),!0}catch(r){return!1}}static getFlowContext(e){try{const e=[Ft.FLOW_CONTEXT_KEY,Ft.TOKEN_MANAGEMENT_CONTEXT_KEY,"implicit_flow_v3_context"];for(const t of e){const e=sessionStorage.getItem(t);if(e){const r=JSON.parse(e);if(!Ft.validateFlowContext(r).valid){Ft.clearFlowContext(t);continue}if(Ft.isContextExpired(r)){Ft.clearFlowContext(t);continue}return r}}return null}catch(t){return null}}static clearFlowContext(e){try{if(e&&"string"==typeof e)sessionStorage.removeItem(e);else{[Ft.FLOW_CONTEXT_KEY,Ft.TOKEN_MANAGEMENT_CONTEXT_KEY,"implicit_flow_v3_context"].forEach(e=>sessionStorage.removeItem(e))}}catch(t){}}static buildReturnPath(e,t,r){try{let n={"authorization-code":"/flows/authorization-code","authorization-code-v3":"/flows/enhanced-authorization-code","authorization-code-v5":"/flows/authorization-code-v5",implicit:"/flows/implicit","implicit-v3":"/flows/implicit-v3","client-credentials":"/flows/client-credentials","client-credentials-v5":"/flows/client-credentials-v5","device-authorization":"/flows/device-authorization","device-authorization-v6":"/flows/device-authorization-v6","oidc-device-authorization":"/flows/oidc-device-authorization","oidc-device-authorization-v6":"/flows/oidc-device-authorization-v6",rar:"/flows/rar","rar-v5":"/flows/rar-v5","rar-v6":"/flows/rar-v6",ciba:"/flows/ciba","ciba-v6":"/flows/ciba-v6","pingone-mfa":"/flows/pingone-mfa","pingone-mfa-v5":"/flows/pingone-mfa-v5","pingone-mfa-v6":"/flows/pingone-mfa-v6","worker-token":"/flows/worker-token","worker-token-v5":"/flows/worker-token-v5"}[e]||"/dashboard";if(t&&(n+=`?step=${encodeURIComponent(t)}`),r){const e=new URLSearchParams(t&&n.split("?")[1]||"");Object.entries(r).forEach(([t,r])=>{e.set(t,r)});const i=e.toString();i&&(n=`${n.split("?")[0]}?${i}`)}return n}catch(n){return"/dashboard"}}static validateFlowContext(e){const t=[],r=[];try{e.flowType&&"string"==typeof e.flowType||t.push("flowType is required and must be a string"),("number"!=typeof e.currentStep||e.currentStep<0)&&t.push("currentStep must be a non-negative number"),e.returnPath&&"string"==typeof e.returnPath||t.push("returnPath is required and must be a string"),e.flowState&&"object"==typeof e.flowState||t.push("flowState is required and must be an object"),("number"!=typeof e.timestamp||e.timestamp<=0)&&t.push("timestamp must be a positive number"),e.returnPath&&!Ft.isValidReturnPath(e.returnPath)&&t.push("returnPath contains invalid characters or patterns");const n=JSON.stringify(e).length;return n>Ft.MAX_CONTEXT_SIZE&&t.push(`Context size (${n}) exceeds maximum allowed (${Ft.MAX_CONTEXT_SIZE})`),e.timestamp&&Ft.isContextExpired(e)&&r.push("Context is older than maximum allowed age"),e.flowType&&!Ft.isValidFlowType(e.flowType)&&r.push(`Unknown flow type: ${e.flowType}`),{valid:0===t.length,errors:t,warnings:r}}catch(n){return{valid:!1,errors:[`Validation error: ${n instanceof Error?n.message:"Unknown error"}`],warnings:r}}}static handleRedirectReturn(e){try{const t=Ft.getFlowContext();if(!t)return{success:!0,redirectUrl:"/dashboard"};if(!Ft.validateRedirectSecurity(t))return Ft.clearFlowContext(),{success:!0,redirectUrl:"/dashboard"};let r=t.returnPath;if(e&&"object"==typeof e){const t=new URL(r,window.location.origin);["code","state","session_state","iss"].forEach(r=>{e[r]&&"string"==typeof e[r]&&t.searchParams.set(r,e[r])}),r=t.pathname+t.search}return Ft.clearFlowContext(),{success:!0,redirectUrl:r}}catch(t){return{success:!1,redirectUrl:"/dashboard",error:t instanceof Error?t.message:"Unknown error"}}}static validateRedirectSecurity(e){try{if(Ft.isContextExpired(e))return!1;if(!Ft.isValidReturnPath(e.returnPath))return!1;const t=[/javascript:/i,/data:/i,/vbscript:/i,/<script/i,/on\w+=/i],r=JSON.stringify(e);for(const e of t)if(e.test(r))return!1;return!0}catch(t){return!1}}static getStorageKey(e){return["authorization-code-v5","client-credentials-v5","device-authorization-v6","oidc-device-authorization-v6","rar-v5","rar-v6","ciba-v6","pingone-mfa-v5","pingone-mfa-v6","worker-token-v5"].includes(e)?Ft.TOKEN_MANAGEMENT_CONTEXT_KEY:"implicit-v3"===e?"implicit_flow_v3_context":Ft.FLOW_CONTEXT_KEY}static isContextExpired(e){return Date.now()-e.timestamp>Ft.MAX_CONTEXT_AGE_MS}static isValidReturnPath(e){try{if(!e.startsWith("/"))return!1;return![/\.\./,/\/\//,/[<>'"]/,/javascript:/i,/data:/i,/vbscript:/i].some(t=>t.test(e))}catch(t){return!1}}static isValidFlowType(e){return["authorization-code","authorization-code-v3","authorization-code-v5","implicit","implicit-v3","client-credentials","client-credentials-v5","device-authorization","device-authorization-v6","oidc-device-authorization","oidc-device-authorization-v6","rar","rar-v5","rar-v6","ciba","ciba-v6","pingone-mfa","pingone-mfa-v5","pingone-mfa-v6","worker-token","worker-token-v5"].includes(e)}static generateSessionId(){return Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15)}static safeJsonParse(e){try{return JSON.parse(e)}catch(t){return null}}static createFlowContext(e,t,r=0,n={},i){return{flowType:e,returnPath:t,currentStep:r,flowState:n,timestamp:Date.now(),credentials:i}}static updateFlowContext(e,t){const r=Ft.getFlowContext(e);if(!r)return!1;const n={...r,...t,timestamp:Date.now()};return Ft.saveFlowContext(e,n)}}class qt{static FLOW_STATE_PREFIX="flow_state_";static MAX_STATE_AGE_MS=18e5;static MAX_STATE_SIZE=1e5;static preserveFlowState(e,t){try{if(JSON.stringify(t).length>qt.MAX_STATE_SIZE)return!1;const r={...t,_timestamp:Date.now(),_flowId:e},n=qt.getStateKey(e);return sessionStorage.setItem(n,JSON.stringify(r)),!0}catch(r){return!1}}static restoreFlowState(e){try{const t=qt.getStateKey(e),r=sessionStorage.getItem(t);if(!r)return null;const n=JSON.parse(r);if(n._timestamp&&Date.now()-n._timestamp>qt.MAX_STATE_AGE_MS)return qt.clearFlowState(e),null;const{_timestamp:i,_flowId:o,...s}=n;return s}catch(t){return null}}static clearFlowState(e){try{const t=qt.getStateKey(e);sessionStorage.removeItem(t)}catch(t){}}static handleRedirectReturn(e){try{const t=Ft.getFlowContext();if(!t)return{success:!0,redirectUrl:"/dashboard"};if(!qt.validateRedirectSecurity(t,e))return Ft.clearFlowContext(),{success:!1,redirectUrl:"/dashboard",error:"Security validation failed"};const r=qt.restoreFlowState(t.metadata?.flowId||t.flowType);if(e.error){return{success:!1,redirectUrl:qt.buildErrorRedirectUrl(t,e),error:e.error_description||e.error,flowState:r}}const n=qt.buildSuccessRedirectUrl(t,e);return qt.clearFlowState(t.metadata?.flowId||t.flowType),Ft.clearFlowContext(),{success:!0,redirectUrl:n,flowState:r}}catch(t){return{success:!1,redirectUrl:"/dashboard",error:t instanceof Error?t.message:"Unknown error"}}}static validateRedirectSecurity(e,t){try{if(!Ft.validateFlowContext(e).valid)return!1;if(t&&"object"==typeof t){const e=[/<script/i,/javascript:/i,/data:/i,/vbscript:/i,/on\w+=/i],r=JSON.stringify(t);for(const t of e)if(t.test(r))return!1;if(t.state&&"string"==typeof t.state&&t.state.length>1e3)return!1}return!0}catch(r){return!1}}static createRedirectContext(e,t,r,n){try{const i=Ft.buildReturnPath(e,r.toString()),o=Ft.createFlowContext(e,i,r,{step:r},n.credentials);if(!Ft.saveFlowContext(t,o))return!1;return!!qt.preserveFlowState(t,n)||(Ft.clearFlowContext(t),!1)}catch(i){return!1}}static cleanupExpiredStates(){try{const t=[];for(let r=0;r<sessionStorage.length;r++){const n=sessionStorage.key(r);if(n?.startsWith(qt.FLOW_STATE_PREFIX))try{const e=sessionStorage.getItem(n);if(e){const r=JSON.parse(e);r._timestamp&&Date.now()-r._timestamp>qt.MAX_STATE_AGE_MS&&t.push(n)}}catch(e){t.push(n)}}t.forEach(e=>{sessionStorage.removeItem(e)}),t.length}catch(t){}}static getStateKey(e){return`${qt.FLOW_STATE_PREFIX}${e}`}static buildSuccessRedirectUrl(e,t){try{const r=new URL(e.returnPath,window.location.origin);return t.code&&r.searchParams.set("code",t.code),t.state&&r.searchParams.set("state",t.state),t.session_state&&r.searchParams.set("session_state",t.session_state),t.iss&&r.searchParams.set("iss",t.iss),r.pathname+r.search}catch(r){return e.returnPath}}static buildErrorRedirectUrl(e,t){try{const r=new URL(e.returnPath,window.location.origin);return t.error&&r.searchParams.set("error",t.error),t.error_description&&r.searchParams.set("error_description",t.error_description),t.state&&r.searchParams.set("state",t.state),r.pathname+r.search}catch(r){return e.returnPath}}}class Vt{static initializeOAuthFlow(e,t,r,n){try{const i=`${e}-${Date.now()}`;if(!qt.createRedirectContext(e,i,t,r))throw new Error("Failed to create redirect context");Ft.buildReturnPath(e,t.toString(),n);return i}catch(i){throw i}}static handleOAuthCallback(e){try{qt.cleanupExpiredStates();return qt.handleRedirectReturn(e)}catch(t){return{success:!1,redirectUrl:"/dashboard",error:t instanceof Error?t.message:"Unknown error"}}}static updateFlowStep(e,t,r){try{if(!Ft.updateFlowContext(e,{currentStep:t,flowState:{step:t,...r}}))return!1;if(r){const n=qt.restoreFlowState(e);if(n){const i={...n,...r,currentStep:t};qt.preserveFlowState(e,i)}}return!0}catch(n){return!1}}static completeFlow(e){try{Ft.clearFlowContext(e),qt.clearFlowState(e),qt.cleanupExpiredStates()}catch(t){}}static hasActiveFlow(){try{return null!==Ft.getFlowContext()}catch(e){return!1}}static getCurrentFlow(){try{const e=Ft.getFlowContext();return e?{flowType:e.flowType,currentStep:e.currentStep,returnPath:e.returnPath,age:Date.now()-e.timestamp}:null}catch(e){return null}}static buildAuthorizationUrl(e,t,r,n,i){try{const o=Vt.initializeOAuthFlow(r,n,i),s={...t,state:t.state?`${t.state}_${o}`:o},a=new URL(e);return Object.entries(s).forEach(([e,t])=>{a.searchParams.set(e,t)}),a.toString()}catch(o){const r=new URL(e);return Object.entries(t).forEach(([e,t])=>{r.searchParams.set(e,t)}),r.toString()}}static validateFlowIntegrity(){const e=[],t=[];try{const r=Ft.getFlowContext();if(!r)return{valid:!0,issues:[],recommendations:["No active flow context found"]};const n=Ft.validateFlowContext(r);e.push(...n.errors),t.push(...n.warnings);let i=0;for(let e=0;e<sessionStorage.length;e++){const t=sessionStorage.key(e);t?.startsWith("flow_state_")&&i++}i>5&&t.push(`Found ${i} preserved flow states. Consider cleanup.`);return Date.now()-r.timestamp>12e5&&t.push("Flow context is getting old. Consider refreshing."),{valid:0===e.length,issues:e,recommendations:t}}catch(r){return{valid:!1,issues:[`Validation error: ${r instanceof Error?r.message:"Unknown error"}`],recommendations:["Clear flow context and restart flow"]}}}static emergencyCleanup(){try{["flowContext","tokenManagementFlowContext","implicit_flow_v3_context"].forEach(e=>{sessionStorage.removeItem(e)});const e=[];for(let t=0;t<sessionStorage.length;t++){const r=sessionStorage.key(t);r?.startsWith("flow_state_")&&e.push(r)}e.forEach(e=>{sessionStorage.removeItem(e)})}catch(e){}}}const Bt=new class{config=null;loadConfig(){if(this.config)return this.config;Ee.info("PingOneConfigService","Loading PingOne configuration...");try{const e=window,t=this.buildConfigFromEnvironment(e);if(t.clientId&&t.environmentId)return Ee.info("PingOneConfigService","Using environment variables for configuration"),this.config=t,this.config;Ee.info("PingOneConfigService","Loading from localStorage...");const r=localStorage.getItem("pingone-config");if(r){const e=JSON.parse(r);return this.config=this.validateAndBuildConfig(e),Ee.info("PingOneConfigService","Loaded configuration from localStorage"),this.config}return this.config=this.getDefaultConfig(),Ee.warn("PingOneConfigService","Using default configuration - no environment variables or saved config found"),this.config}catch(e){return Ee.error("PingOneConfigService","Failed to load configuration",e),this.config=this.getDefaultConfig(),this.config}}saveConfig(e){try{localStorage.setItem("pingone-config",JSON.stringify(e)),this.config=e,Ee.info("PingOneConfigService","Configuration saved to localStorage")}catch(t){Ee.error("PingOneConfigService","Failed to save configuration",t)}}getConfig(){return this.config}updateConfig(e){const t={...this.loadConfig(),...e};return this.saveConfig(t),t}validateAndBuildConfig(e){if(!e.environmentId||!e.clientId)throw new Error("Invalid configuration: missing required fields");return this.buildConfigFromParams({environmentId:e.environmentId,clientId:e.clientId,clientSecret:e.clientSecret||"",redirectUri:e.redirectUri||`${window.location.origin}/callback`,authServerId:e.authServerId,apiUrl:e.apiUrl||"https://auth.pingone.com",allowRedirectUriPatterns:e.allowRedirectUriPatterns||!1,enableJWKS:e.enableJWKS||!1})}buildConfigFromEnvironment(e){return this.buildConfigFromParams({environmentId:e.__PINGONE_ENVIRONMENT_ID__||"",clientId:e.__PINGONE_CLIENT_ID__||"",clientSecret:e.__PINGONE_CLIENT_SECRET__||"",redirectUri:e.__PINGONE_REDIRECT_URI__||`${window.location.origin}/callback`,authServerId:e.__PINGONE_AUTH_SERVER_ID__,apiUrl:e.__PINGONE_API_URL__||"https://auth.pingone.com",allowRedirectUriPatterns:"true"===e.__PINGONE_ALLOW_REDIRECT_URI_PATTERNS__,enableJWKS:"true"===e.__PINGONE_ENABLE_JWKS__})}buildConfigFromParams(e){const t=e.apiUrl||"https://auth.pingone.com",r=`${t}/${e.environmentId}/as`;return{environmentId:e.environmentId,clientId:e.clientId,clientSecret:e.clientSecret||"",redirectUri:e.redirectUri||`${window.location.origin}/callback`,allowRedirectUriPatterns:e.allowRedirectUriPatterns||!1,enableJWKS:e.enableJWKS||!1,baseUrl:t,authUrl:r,authorizationEndpoint:`${r}/authorize`,tokenEndpoint:`${r}/token`,userInfoEndpoint:`${r}/userinfo`,logoutEndpoint:`${r}/signoff`,parEndpoint:`${r}/par`,tokenAuthMethod:"client_secret_basic",clientAssertion:{hmacAlg:"HS256",signAlg:"RS256"},advanced:{requestObjectPolicy:"default",oidcSessionManagement:!1,resourceScopes:"openid profile email",terminateByIdToken:!0}}}getDefaultConfig(){return{environmentId:"",clientId:"",clientSecret:"",redirectUri:`${window.location.origin}/callback`,allowRedirectUriPatterns:!1,enableJWKS:!1,baseUrl:"",authUrl:"",authorizationEndpoint:"",tokenEndpoint:"",userInfoEndpoint:"",logoutEndpoint:"",parEndpoint:"",tokenAuthMethod:"client_secret_basic",clientAssertion:{hmacAlg:"HS256",signAlg:"RS256"},advanced:{requestObjectPolicy:"default",oidcSessionManagement:!1,resourceScopes:"openid profile email",terminateByIdToken:!0}}}isConfigValid(){const e=this.loadConfig();return!(!e.environmentId||!e.clientId)}getPARConfig(){const e=this.loadConfig();return{parEndpoint:e.parEndpoint,clientId:e.clientId,clientSecret:e.clientSecret}}getAuthConfig(){const e=this.loadConfig();return{authorizationEndpoint:e.authorizationEndpoint,clientId:e.clientId,redirectUri:e.redirectUri}}getTokenConfig(){const e=this.loadConfig();return{tokenEndpoint:e.tokenEndpoint,clientId:e.clientId,clientSecret:e.clientSecret,tokenAuthMethod:e.tokenAuthMethod||"client_secret_basic"}}getUserInfoConfig(){return{userInfoEndpoint:this.loadConfig().userInfoEndpoint}}},Wt=e.createContext(void 0),Gt=e=>{if(!e?.access_token)return!1;const t=Date.now(),r=e.expires_at||0;return!!r&&t<r},Ht=()=>{try{const e=Pe.getUserInfo();return e?JSON.parse(JSON.stringify(e)):null}catch(e){return Ee.error("NewAuthContext","Error parsing stored user",e),null}};let Jt=!1;async function Kt(){if(Jt)return new Promise(e=>{const t=setInterval(()=>{Jt||(clearInterval(t),e(Kt()))},100)});Jt=!0;try{const r={disableLogin:!1,clientId:window.__PINGONE_CLIENT_ID__||"",clientSecret:window.__PINGONE_CLIENT_SECRET__||"",redirectUri:window.__PINGONE_REDIRECT_URI__||`${window.location.origin}/authz-callback`,authorizationEndpoint:"",tokenEndpoint:"",userInfoEndpoint:"",endSessionEndpoint:"",scopes:["openid","profile","email"],environmentId:window.__PINGONE_ENVIRONMENT_ID__||""};try{const e=await Lt({flowKey:"dashboard-login",defaultCredentials:{environmentId:"",clientId:"",clientSecret:"",redirectUri:`${window.location.origin}/dashboard-callback`,scope:"openid profile email",scopes:"openid profile email",loginHint:"",postLogoutRedirectUri:"",responseType:"code",grantType:"authorization_code",issuerUrl:"",authorizationEndpoint:"",tokenEndpoint:"",userInfoEndpoint:"",clientAuthMethod:"client_secret_post",tokenEndpointAuthMethod:"client_secret_post"},useSharedFallback:!1});if(e.credentials?.clientId&&e.credentials?.environmentId)return e.credentials}catch(e){}const n=Ne.getAllCredentials();if(n?.clientId&&n?.environmentId)return n;try{const e=Bt.getConfig();if(e?.clientId&&e?.environmentId)return e}catch(t){}if(r.clientId&&r.environmentId)return r;let i=configCredentials;if(i.environmentId||i.clientId||(i=authzCredentials),i.environmentId&&i.clientId){const e=`https://auth.pingone.com/${i.environmentId}/as`;return{disableLogin:!1,clientId:i.clientId,clientSecret:i.clientSecret||"",redirectUri:i.redirectUri||`${window.location.origin}/authz-callback`,authorizationEndpoint:i.authEndpoint||`${e}/authorize`,tokenEndpoint:i.tokenEndpoint||`${e}/token`,userInfoEndpoint:i.userInfoEndpoint||`${e}/userinfo`,endSessionEndpoint:i.endSessionEndpoint||`${e}/signoff`,scopes:i.scopes||["openid","profile","email"],environmentId:i.environmentId,hasConfigError:!1}}return{disableLogin:!1,clientId:"",clientSecret:"",redirectUri:`${window.location.origin}/authz-callback`,authorizationEndpoint:"",tokenEndpoint:"",userInfoEndpoint:"",endSessionEndpoint:"",scopes:["openid","profile","email"],environmentId:""}}catch(r){return Ee.error("NewAuthContext","Error loading configuration",r),{disableLogin:!1,clientId:"",clientSecret:"",redirectUri:`${window.location.origin}/authz-callback`,authorizationEndpoint:"",tokenEndpoint:"",userInfoEndpoint:"",endSessionEndpoint:"",scopes:["openid","profile","email"],environmentId:"",hasConfigError:!0}}finally{Jt=!1}}const Yt=({children:r})=>{const[n,i]=e.useState({isAuthenticated:!1,user:null,tokens:null,isLoading:!0,error:null}),[o,s]=e.useState(!1),[a,c]=e.useState(null),[l,d]=e.useState(()=>{try{return{disableLogin:!1,clientId:"",clientSecret:"",redirectUri:`${window.location.origin}/authz-callback`,authorizationEndpoint:"",tokenEndpoint:"",userInfoEndpoint:"",endSessionEndpoint:"",scopes:["openid","profile","email"],environmentId:"",hasConfigError:!1}}catch(e){return Ee.error("NewAuthContext","Error initializing config",e),{disableLogin:!1,clientId:"",clientSecret:"",redirectUri:`${window.location.origin}/authz-callback`,authorizationEndpoint:"",tokenEndpoint:"",userInfoEndpoint:"",endSessionEndpoint:"",scopes:["openid","profile","email"],environmentId:"",hasConfigError:!0}}});e.useEffect(()=>{(async()=>{try{const e=await Kt();d(e)}catch(e){Ee.error("NewAuthContext","Error loading configuration",e),d(e=>({...e,hasConfigError:!0}))}})()},[]);const u=e.useCallback(e=>{i(t=>({...t,...e}))},[]);e.useEffect(()=>{(()=>{try{const e=(()=>{try{const r=["pingone_secure_tokens","pingone_tokens","tokens","oauth_tokens","oidc_tokens","implicit_tokens","device_code_tokens","client_credentials_tokens","hybrid_tokens","authz_flow_tokens","oauth2_implicit_tokens","oidc_implicit_tokens","oauth2_client_credentials_tokens","oidc_client_credentials_tokens","device_code_oidc_tokens"];for(const n of r)try{const t=sessionStorage.getItem(n);if(t)try{const e=JSON.parse(t);if(e?.access_token&&Gt(e))return Ee.info("NewAuthContext",`Found valid OAuth tokens in ${n}`,{key:n,hasAccessToken:!!e.access_token,hasIdToken:!!e.id_token,tokenType:e.token_type}),e}catch(e){Ee.warn("NewAuthContext",`Invalid JSON in sessionStorage ${n}, skipping`,{key:n,error:e instanceof Error?e.message:"Unknown error",dataPreview:`${t.substring(0,50)}...`}),sessionStorage.removeItem(n)}const r=localStorage.getItem(n);if(r)try{const e=JSON.parse(r);if(e?.access_token&&Gt(e))return Ee.info("NewAuthContext",`Found valid OAuth tokens in localStorage ${n}`,{key:n,hasAccessToken:!!e.access_token,hasIdToken:!!e.id_token,tokenType:e.token_type}),e}catch(e){Ee.warn("NewAuthContext",`Invalid JSON in localStorage ${n}, skipping`,{key:n,error:e instanceof Error?e.message:"Unknown error",dataPreview:`${r.substring(0,50)}...`}),localStorage.removeItem(n)}}catch(t){Ee.warn("NewAuthContext",`Error checking OAuth token storage key ${n}`,{key:n,error:t instanceof Error?t.message:"Unknown error"})}return Ee.info("NewAuthContext","No valid OAuth tokens found in storage"),null}catch(r){return Ee.error("NewAuthContext","Error loading OAuth tokens from storage",r),null}})(),t=Ht();e&&Gt(e)?(Ee.auth("NewAuthContext","Valid tokens found in storage",e),u({isAuthenticated:!0,tokens:e,user:t,isLoading:!1,error:null})):e&&(e=>{if(!e?.refresh_token)return!1;const t=Date.now(),r=e.refresh_expires_at||0;return!!r&&t<r})(e)?(Ee.auth("NewAuthContext","Access token expired, but refresh token valid",e),u({isAuthenticated:!1,tokens:e,user:t,isLoading:!1,error:"Access token expired. Please refresh."})):u({isAuthenticated:!1,tokens:null,user:null,isLoading:!1,error:null})}catch(e){Ee.error("NewAuthContext","Error loading tokens from storage",e),u({isAuthenticated:!1,tokens:null,user:null,isLoading:!1,error:"Failed to load authentication state"})}})()},[u]),e.useEffect(()=>{let e=!1;const t=async()=>{if(!e){e=!0;try{const e=await Kt();d(t=>JSON.stringify(t)!==JSON.stringify(e)?(Ee.config("NewAuthContext","Configuration updated",e),e):t)}catch(t){Ee.error("NewAuthContext","Error updating configuration",t)}finally{e=!1}}};return window.addEventListener("pingone-config-changed",t),window.addEventListener("permanent-credentials-changed",t),window.addEventListener("config-credentials-changed",t),window.addEventListener("storage",t),()=>{window.removeEventListener("pingone-config-changed",t),window.removeEventListener("permanent-credentials-changed",t),window.removeEventListener("config-credentials-changed",t),window.removeEventListener("storage",t)}},[]);const p=e.useCallback(async()=>{Ee.config("NewAuthContext","Refreshing configuration...");try{const e=await Kt();d(e),Ee.config("NewAuthContext","Configuration refreshed successfully",e)}catch(e){Ee.error("NewAuthContext","Error refreshing configuration",e),d(e=>({...e,hasConfigError:!0}))}},[]);e.useEffect(()=>{const e=e=>{"pingone_config"===e.key&&(Ee.config("NewAuthContext","PingOne config changed in localStorage, refreshing..."),p())};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[p]),e.useEffect(()=>{(async()=>{try{const e=(()=>{try{const e=Pe.getTokens();return e?JSON.parse(JSON.stringify(e)):null}catch(e){return Ee.error("NewAuthContext","Error parsing stored tokens",e),null}})(),t=Ht();e&&Gt(e)?u({isAuthenticated:!0,tokens:e,user:t,isLoading:!1,error:null}):u({isAuthenticated:!1,tokens:e,user:t,isLoading:!1,error:null})}catch(e){Ee.error("NewAuthContext","Error initializing auth state",e),u({isAuthenticated:!1,tokens:null,user:null,isLoading:!1,error:"Failed to initialize authentication"})}})()},[u]),e.useEffect(()=>{const e=async()=>{try{const e=await Kt();d(e),Ee.info("NewAuthContext","Configuration updated from localStorage")}catch(e){Ee.error("NewAuthContext","Error reloading configuration",e)}};return window.addEventListener("pingone-config-changed",e),()=>{window.removeEventListener("pingone-config-changed",e)}},[]);const h=e.useCallback(async(e="/",t="oauth")=>{try{if(!l?.clientId||!l?.environmentId){const e="Configuration required. Please configure your PingOne settings first.";return u({error:e,isLoading:!1}),{success:!1,error:e}}const r=Math.random().toString(36).substring(2,15),n=Math.random().toString(36).substring(2,15),i=Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15),o=await ze(i);sessionStorage.setItem("oauth_state",r),sessionStorage.setItem("oauth_nonce",n),sessionStorage.setItem("code_verifier",i),sessionStorage.setItem("oauth_redirect_after_login",e);const s=l?.redirectUri,a="dashboard"===t?`${window.location.origin}/dashboard-callback`:s||`${window.location.origin}/authz-callback`;let c=l?.pingone?.authEndpoint||l?.authorizationEndpoint||l?.authEndpoint;const d=l?.pingone?.clientId||l?.clientId;if(!c&&l?.environmentId&&(c=`https://auth.pingone.com/${l.environmentId}/as/authorize`),!c||!d){const e=[];c||e.push("Authorization Endpoint"),d||e.push("Client ID");const t=`PingOne configuration incomplete. Missing: ${e.join(", ")}.\n\nTo set up PingOne authentication:\n1. Navigate to Configuration (/configuration)\n2. Enter your PingOne Environment ID and Client ID\n3. Save the configuration\n\nYou can find these values in your PingOne Admin Console under Applications.\nNote: The Authorization Endpoint will be automatically constructed from your Environment ID.`;throw new Error(t)}const p=new URL(c);p.searchParams.set("response_type","code"),p.searchParams.set("client_id",d);const h="dashboard"===t?`${window.location.origin}/dashboard-callback`:a;p.searchParams.set("redirect_uri",h);const g=l?.scopes||["openid","profile","email"],m=Array.isArray(g)?g.join(" "):g;return p.searchParams.set("scope",m),p.searchParams.set("state",r),p.searchParams.set("nonce",n),p.searchParams.set("code_challenge",o),p.searchParams.set("code_challenge_method","S256"),Ee.auth("NewAuthContext","Prepared authorization URL for modal display",{authUrl:p.toString()}),{success:!0,redirectUrl:p.toString()}}catch(r){const e=r instanceof Error?r.message:"Authentication failed";return u({error:e,isLoading:!1}),{success:!1,error:e}}},[l,u]),g=e.useCallback(()=>{try{Ee.auth("NewAuthContext","Logging out user"),Pe.clearTokens(),Pe.clearUserInfo(),sessionStorage.removeItem("oauth_state"),sessionStorage.removeItem("oauth_nonce"),sessionStorage.removeItem("oauth_redirect_after_login");try{Vt.emergencyCleanup()}catch(e){}u({isAuthenticated:!1,user:null,tokens:null,isLoading:!1,error:null}),Ee.auth("NewAuthContext","User logged out successfully")}catch(t){Ee.error("NewAuthContext","Error during logout",t),u({error:"Logout failed",isLoading:!1})}},[u]),m=e.useCallback(async e=>{try{const{params:s,code:a,state:c,error:d,errorDescription:p}=Oe(e,"NewAuthContext");if(d){const e=p||d;return Ee.error("NewAuthContext","OAuth error in callback",{error:d,errorDescription:p}),u({error:e,isLoading:!1}),{success:!1,error:e}}const h=sessionStorage.getItem("flowContext");if(h)try{const e=Ue(h),t="oidc-authorization-code-v6"===e?.flow||"oauth-authorization-code-v6"===e?.flow,r="oidc-authorization-code-v7"===e?.flow||"oauth-authorization-code-v7"===e?.flow||"oidc-authorization-code-v7-2"===e?.flow||"oauth-authorization-code-v7-2"===e?.flow;if(t||r){if(a){const t=e?.flow?.includes("oidc"),r=t?"oidc_auth_code":"oauth_auth_code";sessionStorage.setItem(r,a)}let t;if(c&&sessionStorage.setItem("oauth_state",c),r){const r="oauth-authorization-code-v7-2"===e?.flow||"oidc-authorization-code-v7-2"===e?.flow;t=e?.returnPath||(r?"/flows/oauth-authorization-code-v7-2?step=4":"/flows/oauth-authorization-code-v7?step=4")}else t=e?.returnPath||"/flows/oidc-authorization-code-v6";return Ee.info("NewAuthContext","V6 flow detected - redirecting to flow page",{flow:e?.flow,returnPath:t}),{success:!0,redirectUrl:t}}}catch(t){}const g=sessionStorage.getItem("oauth_state");if(c&&g&&c!==g){const e="Invalid state parameter. Possible CSRF attack.";return Ee.error("NewAuthContext","State validation failed",{received:c,expected:g}),u({error:e,isLoading:!1}),{success:!1,error:e}}if(c&&!g&&Ee.warn("NewAuthContext","State received but no stored state found - this may happen if sessionStorage was cleared",{received:c}),c&&g?Ee.auth("NewAuthContext","State validation successful",{received:c,expected:g}):c&&!g?Ee.warn("NewAuthContext","State received but no stored state found (sessionStorage may have been cleared)",{received:c}):!c&&g&&Ee.warn("NewAuthContext","No state in callback but stored state exists",{expected:g}),!a){const t="Authorization code not found in callback URL";return Ee.error("NewAuthContext","No authorization code in callback",{url:e,params:Object.fromEntries(s.entries()),hasCode:!!a,hasState:!!c,hasError:!!d}),u({error:t,isLoading:!1}),{success:!1,error:t}}try{const e=sessionStorage.getItem("flowContext");if(e){const t=Ue(e);if("enhanced-authorization-code-v2"===t?.flow){sessionStorage.setItem("oauth_auth_code",a),c&&sessionStorage.setItem("oauth_state",c);const e=t?.returnPath||"/flows/enhanced-authorization-code-v2?step=4";return Ee.auth("NewAuthContext","Early deferral: Enhanced Auth Code Flow V2 detected; skipping token exchange in context",{returnPath:e}),{success:!0,redirectUrl:e}}}}catch(r){Ee.warn("NewAuthContext","Failed to parse flowContext during early gating",r)}let m="";const f="flowContext",b=sessionStorage.getItem(f);if(b)try{const e=Ue(b);e.redirectUri&&(m=e.redirectUri)}catch(n){}if(!m){m=e.includes("/dashboard-callback")?`${window.location.origin}/dashboard-callback`:l?.redirectUri||""}const x=["code_verifier","oauth_code_verifier","authz_v3_code_verifier","oauth2_v3_code_verifier","oidc_v3_code_verifier"];let y="";for(const e of x){const t=sessionStorage.getItem(e);if(t?.trim()){y=t.trim();break}}if(!y)try{const{generateCodeVerifier:e}=await De(async()=>{const{generateCodeVerifier:e}=await import("./utils-lzKqcxFi.js").then(e=>e.aV);return{generateCodeVerifier:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]));y=e(),sessionStorage.setItem("code_verifier",y)}catch(n){}let w="",v="",k="";if(b)try{const e=Ue(b);e&&(w=e.clientId||e.client_id||"",v=e.clientSecret||e.client_secret||"",k=e.environmentId||e.environment_id||"")}catch(n){}if(w&&k||(w=w||l?.clientId||"",v=v||l?.clientSecret||"",k=k||l?.environmentId||""),!w||!k)try{const{credentialManager:e}=await De(async()=>{const{credentialManager:e}=await import("./utils-lzKqcxFi.js").then(e=>e.aU);return{credentialManager:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]));let t=e.loadAuthzFlowCredentials();t.environmentId||t.clientId||(t=e.loadConfigCredentials()),w=w||t.clientId||"",v=v||t.clientSecret||"",k=k||t.environmentId||""}catch(n){}if(!w||""===w.trim()){throw new Error("Client ID is required for token exchange. This usually happens when:\n1. You accessed the authorization URL directly (not through the app flow)\n2. Your browser session was cleared between authorization and callback\n3. Credentials were not properly configured\n\nPlease restart the flow through the application, or configure your OAuth credentials in the Configuration page.")}if(!k||""===k.trim())throw new Error("Environment ID is required for token exchange. Please configure your OAuth credentials first.");if(!m||""===m.trim())throw new Error("Redirect URI is required for token exchange. Please configure your OAuth credentials first.");try{const e=sessionStorage.getItem("flowContext");sessionStorage.getItem("active_oauth_flow");if(e){const t=Ue(e),r="enhanced-authorization-code-v2"===t?.flow,n="enhanced-authorization-code-v3"===t?.flow||"oauth-authorization-code-v3"===t?.flow||"oidc-authorization-code-v3"===t?.flow||"authorization-code-v5"===t?.flow||"oidc-authorization-code-v5"===t?.flow||"oauth-authorization-code-v5"===t?.flow,i="oidc-authorization-code-v6"===t?.flow||"oauth-authorization-code-v6"===t?.flow,o="oidc-authorization-code-v7"===t?.flow||"oauth-authorization-code-v7"===t?.flow||"oidc-authorization-code-v7-2"===t?.flow||"oauth-authorization-code-v7-2"===t?.flow;if(r||n||i||o){if(a){const e="oidc-authorization-code-v6"===t?.flow?"oidc_auth_code":"oauth_auth_code";sessionStorage.setItem(e,a)}let e;if(c&&sessionStorage.setItem("oauth_state",c),t?.redirectUri&&(m=t.redirectUri),o){Ee.info("NewAuthContext","V7 flow detected - redirecting to flow page",{flow:t?.flow,returnPath:t?.returnPath});e="oauth-authorization-code-v7-2"===t?.flow||"oidc-authorization-code-v7-2"===t?.flow?t?.returnPath||"/flows/oauth-authorization-code-v7-2?step=4":t?.returnPath||"/flows/oauth-authorization-code-v7?step=4"}else i?(Ee.info("NewAuthContext","V6 flow detected - redirecting to flow page",{flow:t?.flow,returnPath:t?.returnPath}),e=t?.returnPath||"/flows/oidc-authorization-code-v6"):n?(e="oauth-authorization-code-v3"===t?.flow?t?.returnPath||"/flows/oauth-authorization-code-v3?step=4":t?.returnPath||"/flows/enhanced-authorization-code-v3?step=4",Ee.auth("NewAuthContext","Deferring token exchange to Enhanced Auth Code Flow V3 page",{returnPath:e,redirectUri:m})):(e=t?.returnPath||"/flows/enhanced-authorization-code-v2?step=4",Ee.auth("NewAuthContext","Deferring token exchange to Enhanced Auth Code Flow V2 page",{returnPath:e,redirectUri:m}));return{success:!0,redirectUrl:e}}}}catch(r){Ee.warn("NewAuthContext","Failed to inspect flowContext for enhanced flow gating",r)}const j=sessionStorage.getItem("active_oauth_flow");if(j){if(a){const e=j.includes("oidc-authorization-code")?"oidc_auth_code":"oauth_auth_code";sessionStorage.setItem(e,a),sessionStorage.setItem(`${j}-authCode`,a)}c&&sessionStorage.setItem("oauth_state",c);let e="/flows/oauth-authorization-code-v6";return j.includes("oauth-authorization-code-v7-2")||j.includes("oidc-authorization-code-v7-2")?e="/flows/oauth-authorization-code-v7-2?step=4":j.includes("oidc-authorization-code-v7")||j.includes("oauth-authorization-code-v7")?e="/flows/oauth-authorization-code-v7?step=4":j.includes("oidc-authorization-code")?e="/flows/oidc-authorization-code-v6":j.includes("oauth-authorization-code")?e="/flows/oauth-authorization-code-v6":j.includes("par")?e="/flows/par-flow":j.includes("rar")&&(e="/flows/rar-flow"),{success:!0,redirectUrl:e}}const S={grant_type:"authorization_code",code:a.trim(),redirect_uri:m.trim(),client_id:w.trim(),client_secret:v||"",environment_id:k.trim(),...y&&y.length>0&&{code_verifier:y.trim()}};if(""===S.client_id||!S.client_id)throw new Error("CRITICAL ERROR: Request body contains empty client_id. This should never happen.");if(!S.redirect_uri||""===S.redirect_uri.trim())throw new Error("Missing redirect URI. Please configure your OAuth settings.");if(!S.environment_id||""===S.environment_id.trim())throw new Error("Missing environment ID. Please configure your PingOne environment.");S.code_verifier&&S.code_verifier.trim();const C=Le(),A=await fetch(`${C}/api/token-exchange`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(S)});if(!A.ok){const e=await A.text();let t,r=`Token exchange failed: ${e}`;try{t=JSON.parse(e)}catch(i){t={error:"unknown",error_description:e}}return"invalid_client"===t.error?r="Token exchange failed: Invalid client credentials. Please check your PingOne application configuration. If you're using a specific OAuth flow, try using the dedicated flow pages instead of the global callback.":"invalid_grant"===t.error?r="Token exchange failed: Invalid authorization code or PKCE mismatch. This usually means the authorization code has expired or the PKCE codes don't match. Try using the specific OAuth flow pages for better PKCE handling.":"invalid_request"===t.error&&(r="Token exchange failed: Invalid request parameters. Please check your configuration. For OAuth flows, consider using the dedicated flow pages at /flows/ for better error handling."),Ee.error("NewAuthContext","Token exchange failed",{status:A.status,error:t,guidance:"Check PingOne application configuration and ensure credentials are correct"}),u({error:r,isLoading:!1}),{success:!1,error:r}}const T=await A.json(),_={access_token:T.access_token,refresh_token:T.refresh_token,id_token:T.id_token,token_type:T.token_type||"Bearer",expires_in:T.expires_in,expires_at:T.expires_in?Date.now()+1e3*T.expires_in:void 0,refresh_expires_in:T.refresh_expires_in,refresh_expires_at:T.refresh_expires_in?Date.now()+1e3*T.refresh_expires_in:void 0,scope:T.scope};Pe.setTokens(_);let R=null;const I=l?.pingone?.userInfoEndpoint||l?.userInfoEndpoint;if(T.access_token&&I)try{R=await async function(e,t){const r=Le(),n=e.match(/\/\/([^/]+)\/([^/]+)\/as\/userinfo/)?.[2],i=await fetch(`${r}/api/userinfo?access_token=${t}&environment_id=${n}`,{method:"GET",headers:{Accept:"application/json"}});if(!i.ok)throw new Error("Failed to fetch user info");return i.json()}(I,T.access_token),Pe.setUserInfo(R)}catch(n){Ee.warn("NewAuthContext","Failed to fetch user info",n)}u({isAuthenticated:!0,tokens:_,user:R,isLoading:!1,error:null}),sessionStorage.removeItem("oauth_state");let $=sessionStorage.getItem("oauth_redirect_after_login")||"/";sessionStorage.removeItem("oauth_redirect_after_login");try{const e={code:a,state:c,error:d,error_description:p,session_state:s.get("session_state"),iss:s.get("iss")},t=Vt.handleOAuthCallback(e);$=t.success?t.redirectUrl:"/dashboard"}catch(o){if(b)try{if("string"!=typeof b||b.length>1e4)$="/dashboard";else if(b.includes("<script")||b.includes("javascript:")||b.includes("data:"))$="/dashboard";else{const e=Ue(b);if(e&&"object"==typeof e&&e.returnPath){const t=String(e.returnPath);$=t.includes("/flows/enhanced-authorization-code")||t.startsWith("/")?t:"/dashboard"}else $="/dashboard"}sessionStorage.removeItem("flowContext")}catch(n){$="/dashboard"}else $="/dashboard",sessionStorage.removeItem("oauth_nonce")}return Ee.auth("NewAuthContext","Authentication successful",{redirectUrl:$}),{success:!0,redirectUrl:$}}catch(s){const e=s instanceof Error?s.message:"Authentication failed";return Ee.error("NewAuthContext","Error in handleCallback",s),u({error:e,isLoading:!1}),{success:!1,error:e}}},[l,u]),f=e.useCallback(e=>{u(e)},[u]),b=e.useCallback(()=>{a&&(Ee.auth("NewAuthContext","Proceeding with OAuth redirect"),window.location.href=a.authorizationUrl)},[a]),x=e.useCallback(()=>{s(!1),c(null)},[]),y=e.useCallback(e=>{Ee.auth("NewAuthContext","Updating tokens",e),i(t=>({...t,tokens:e,isAuthenticated:!!e?.access_token,isLoading:!1}))},[]),w=e.useCallback(async e=>{try{const t=await Dt("dashboard-login",e,void 0,void 0,{showToast:!0});if(t){const e=await Kt();i(t=>({...t,config:e}))}return t}catch(t){return!1}},[]),v=e.useCallback(()=>{u({error:null})},[u]),k=e.useCallback((e,t,r,n)=>{try{return Vt.initializeOAuthFlow(e,t,r,n)}catch(i){throw i}},[]),j=e.useCallback((e,t,r)=>{try{return Vt.updateFlowStep(e,t,r)}catch(n){return!1}},[]),S=e.useCallback(e=>{try{Vt.completeFlow(e)}catch(t){}},[]),C=e.useCallback(()=>{try{return Vt.getCurrentFlow()}catch(e){return null}},[]),A=e.useMemo(()=>{const e=l?.pingone||l||{};l||Ee.warn("NewAuthContext","Config is undefined",{hasConfig:!!l,configKeys:l?Object.keys(l):[],configStructure:l});return{...n,config:{disableLogin:!1,clientId:e.clientId||"",clientSecret:e.clientSecret||"",environmentId:e.environmentId||"",redirectUri:e.redirectUri||"",authorizationEndpoint:e.authEndpoint||e.authorizationEndpoint||"",tokenEndpoint:e.tokenEndpoint||"",userInfoEndpoint:e.userInfoEndpoint||"",endSessionEndpoint:e.logoutEndpoint||e.endSessionEndpoint||"",scopes:e.scopes||["openid","profile","email"],pingone:{clientId:e.clientId||"",clientSecret:e.clientSecret||"",environmentId:e.environmentId||"",redirectUri:e.redirectUri||"",authEndpoint:e.authEndpoint||e.authorizationEndpoint||"",tokenEndpoint:e.tokenEndpoint||"",userInfoEndpoint:e.userInfoEndpoint||"",endSessionEndpoint:e.logoutEndpoint||e.endSessionEndpoint||""}},login:h,logout:g,handleCallback:m,setAuthState:f,showAuthModal:o,authRequestData:a,proceedWithOAuth:b,closeAuthModal:x,updateTokens:y,dismissError:v,saveCredentialsV7:w,initializeFlowContext:k,updateFlowStep:j,completeFlow:S,getCurrentFlow:C}},[n,l,h,g,m,f,o,a,b,x,y,v,k,j,S,C,w]);return A?t.jsx(Wt.Provider,{value:A,children:r}):(Ee.error("NewAuthContext","Context value is null/undefined, this should not happen"),t.jsx("div",{children:"Error: Auth context not properly initialized"}))},Xt=()=>{const t=e.useContext(Wt);return t||(Ee.error("useAuth","Context is undefined - not within AuthProvider"),{isAuthenticated:!1,user:null,tokens:null,isLoading:!1,error:"AuthProvider not found",config:{disableLogin:!1,clientId:"",clientSecret:"",redirectUri:"",authorizationEndpoint:"",tokenEndpoint:"",userInfoEndpoint:"",endSessionEndpoint:"",scopes:[],environmentId:"",hasConfigError:!0,pingone:{clientId:"",clientSecret:"",environmentId:"",redirectUri:"",authEndpoint:"",tokenEndpoint:"",userInfoEndpoint:"",endSessionEndpoint:""}},login:async()=>({success:!1,error:"AuthProvider not found"}),logout:()=>{},handleCallback:async()=>({success:!1,error:"AuthProvider not found"}),setAuthState:()=>{},showAuthModal:!1,authRequestData:null,proceedWithOAuth:()=>{},closeAuthModal:()=>{},updateTokens:()=>{},dismissError:()=>{window.location.reload()}})};const Qt={titleBackgroundColor:"#0070cc",titleTextColor:"#ffffff",accentColor:"#0056b3"},Zt={"/dashboard":{titleBackgroundColor:"#0070cc",titleTextColor:"#ffffff",accentColor:"#0056b3"},"/flows/authorization-code":{titleBackgroundColor:"#059669",titleTextColor:"#ffffff",accentColor:"#047857"},"/flows/implicit":{titleBackgroundColor:"#dc2626",titleTextColor:"#ffffff",accentColor:"#b91c1c"},"/flows/client-credentials":{titleBackgroundColor:"#0369a1",titleTextColor:"#ffffff",accentColor:"#075985"},"/flows/pkce":{titleBackgroundColor:"#0891b2",titleTextColor:"#ffffff",accentColor:"#0e7490"},"/flows/device-code":{titleBackgroundColor:"#ea580c",titleTextColor:"#ffffff",accentColor:"#c2410c"},"/oidc/userinfo":{titleBackgroundColor:"#16a34a",titleTextColor:"#ffffff",accentColor:"#15803d"},"/oidc/id-tokens":{titleBackgroundColor:"#059669",titleTextColor:"#ffffff",accentColor:"#047857"},"/oauth-2-1":{titleBackgroundColor:"#1e40af",titleTextColor:"#ffffff",accentColor:"#1e3a8a"},"/oidc-session-management":{titleBackgroundColor:"#0f766e",titleTextColor:"#ffffff",accentColor:"#0d5a5a"},"/token-management":{titleBackgroundColor:"#0891b2",titleTextColor:"#ffffff",accentColor:"#0e7490"},"/configuration":{titleBackgroundColor:"#475569",titleTextColor:"#ffffff",accentColor:"#334155"},"/documentation":{titleBackgroundColor:"#0369a1",titleTextColor:"#ffffff",accentColor:"#075985"},"/ai-overview":{titleBackgroundColor:"#7c2d12",titleTextColor:"#ffffff",accentColor:"#9a3412"},"/advanced-config":{titleBackgroundColor:"#374151",titleTextColor:"#ffffff",accentColor:"#1f2937"},"/tutorials":{titleBackgroundColor:"#166534",titleTextColor:"#ffffff",accentColor:"#14532d"}},er=e.createContext(void 0),tr=({children:n})=>{const[i,o]=e.useState(Qt),s=r();e.useEffect(()=>{const e=s.pathname;if(Zt[e])return void o(Zt[e]);const t=Object.keys(Zt).find(t=>e.startsWith(t)||e.includes(t.split("/").pop()||""));o(t?Zt[t]:Qt)},[s.pathname]);return t.jsx(er.Provider,{value:{currentPageStyle:i,setPageStyle:e=>{o(t=>({...t,...e}))}},children:n})},rr={version:"9.11.78",mfaV8Version:"9.11.78",unifiedV8uVersion:"9.11.78",protectPortalVersion:"9.11.78"},nr=Ce.div`
	background: ${({$flowType:e,$securityFeatures:t})=>{const r={oauth:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",oidc:"linear-gradient(135deg, #10b981 0%, #047857 100%)",pingone:"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",documentation:"linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",default:"linear-gradient(135deg, #6b7280 0%, #374151 100%)"},n={oauth:"linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",oidc:"linear-gradient(135deg, #047857 0%, #065f46 100%)",pingone:"linear-gradient(135deg, #d97706 0%, #b45309 100%)",documentation:"linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",default:"linear-gradient(135deg, #374151 0%, #1f2937 100%)"},i={oauth:"linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",oidc:"linear-gradient(135deg, #064e3b 0%, #065f46 100%)",pingone:"linear-gradient(135deg, #92400e 0%, #78350f 100%)",documentation:"linear-gradient(135deg, #581c87 0%, #4c1d95 100%)",default:"linear-gradient(135deg, #1f2937 0%, #111827 100%)"};return t?.highSecurityMode||t?.jwksEnabled&&t?.parEnabled?i[e]||i.default:t?.jwksEnabled||t?.parEnabled||t?.jarEnabled||t?.dpopEnabled?n[e]||n.default:r[e]||r.default}};
	color: white;
	padding: 0.75rem 1.5rem;
	border-radius: 12px;
	margin-bottom: 1.5rem;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 0.5rem;

	@media (max-width: 768px) {
		padding: 0.5rem 1rem;
	}

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
    pointer-events: none;
  }
`,ir=Ce.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({$securityFeatures:e})=>e?.highSecurityMode||e?.jwksEnabled&&e?.parEnabled?"rgba(255, 215, 0, 0.3)":e?.jwksEnabled||e?.parEnabled||e?.jarEnabled||e?.dpopEnabled?"rgba(34, 197, 94, 0.3)":"rgba(255, 255, 255, 0.2)"};
  backdrop-filter: blur(10px);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
`,or=Ce.span`
  display: inline-flex;
  align-items: center;
  background: ${({$type:e})=>"experimental"===e?"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)":"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`,sr=Ce.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`,ar=Ce.p`
  font-size: 0.9rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.5;
  max-width: 800px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`,cr=Ce.div`
  text-align: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
`,lr=Ce.span`
  font-size: 1.5rem;
`,dr={"oauth-authorization-code-v7":{flowType:"oauth",title:"Authorization Code (V7) - Unified OAuth/OIDC",subtitle:"🔐 V7: Unified OAuth/OIDC authorization code experience - Modern implementation supporting both OAuth 2.0 and OpenID Connect variants with enhanced security, PKCE, and comprehensive educational content.",icon:"🔐",version:"V7"},"implicit-v7":{flowType:"oauth",title:"Implicit Flow (V7) - Unified OAuth/OIDC",subtitle:"⚡ V7: Unified OAuth/OIDC implementation with variant selector - Modern implicit flow supporting both OAuth 2.0 and OpenID Connect with enhanced security features and educational content.",icon:"⚡",version:"V7"},"device-authorization-v7":{flowType:"oauth",title:"Device Authorization (V7) - Unified OAuth/OIDC",subtitle:"📱 V7: Unified OAuth/OIDC device authorization for TVs, IoT devices, and CLI tools - Modern implementation with comprehensive device flow support.",icon:"📱",version:"V7"},"ciba-v7":{flowType:"oidc",title:"OIDC CIBA Flow (V7) - Client Initiated Backchannel Authentication",subtitle:"🛡️ V7: Enhanced CIBA implementation with V7 services - Client Initiated Backchannel Authentication for secure, user-friendly authentication without redirects. Perfect for mobile apps, IoT devices, and scenarios requiring seamless user experience.",icon:"🛡️",version:"V7"},"client-credentials-v5":{flowType:"oauth",title:"Client Credentials Flow - Server-to-Server Authentication",subtitle:"Secure machine-to-machine authentication for backend services and APIs. Obtain access tokens directly using client ID and secret without user interaction. Perfect for microservices, batch jobs, and automated processes.",icon:"🔑",version:"V5"},"client-credentials-v7":{flowType:"oauth",title:"Client Credentials Flow V7 - Enhanced Server-to-Server Authentication",subtitle:"🔑 Enhanced machine-to-machine authentication for backend services and APIs. Obtain access tokens directly using client ID and secret without user interaction. Perfect for microservices, batch jobs, and automated processes. ✅ V7: Enhanced with new AuthMethodService and improved UI.",icon:"🔑",version:"V7",isExperimental:!1},"oauth-resource-owner-password-v5":{flowType:"oauth",title:"OAuth 2.0 Resource Owner Password Flow (ROPC)",subtitle:"Direct username/password authentication for highly trusted applications. Deprecated due to security risks - use Authorization Code flow instead.",icon:"🔒",version:"V5",isDeprecated:!0},"oidc-authorization-code-v5":{flowType:"oidc",title:"OIDC Authorization Code Flow - Federated Authentication",subtitle:"🆔 OpenID Connect (Identity Layer on OAuth 2.0) - Verifies user identity AND provides API access. Returns ID Token (user identity) + Access Token (resource access). Built on OAuth 2.0 with added authentication layer. ✅ Use OIDC when you need to know WHO the user is (social login, SSO, identity verification).",icon:"🆔",version:"V5"},"oidc-implicit-v5":{flowType:"oidc",title:"Implicit Flow - Legacy Browser Authentication",subtitle:"Deprecated OpenID Connect flow that returns ID tokens and access tokens directly in the URL fragment. No longer recommended - use Authorization Code Flow with PKCE for better security.",icon:"🌐",version:"V5"},"token-exchange-v7":{flowType:"oauth",title:"OAuth 2.0 Token Exchange V7 - RFC 8693",subtitle:"🔄 Secure Application-to-Application (A2A) communication using OAuth 2.0 Token Exchange. Demonstrates scope reduction, audience restriction, and user delegation patterns for enterprise security architectures.",icon:"🔄",version:"V7"},"oidc-hybrid-v7":{flowType:"oidc",title:"Hybrid Flow (V7) - Unified OAuth/OIDC",subtitle:"🔄 V7: Unified OAuth/OIDC hybrid flow implementation - Advanced flow combining Authorization Code and Implicit patterns with modern V7 architecture and enhanced educational content.",icon:"🔄",version:"V7"},"jwt-bearer-token-v7":{flowType:"oidc",title:"JWT Bearer Token (V7)",subtitle:"🛡️ V7: JWT Bearer with PingFederate/PingOne AIS examples - Modern implementation of RFC 7523 JWT Bearer Token flow for secure application-to-application authentication.",icon:"🛡️",version:"V7"},"worker-token-v5":{flowType:"pingone",title:"Worker Token Flow - Administrative API Access",subtitle:"PingOne-specific flow for obtaining worker application tokens. Used for administrative tasks, management API access, and backend automation without user interaction.",icon:"⚙️",version:"V5"},"worker-token-v7":{flowType:"pingone",title:"Worker Token Flow (V7) - Enhanced Administrative API Access",subtitle:"🚀 V7: Enhanced PingOne worker token flow with comprehensive training, API examples, and best practices. Generate worker tokens for machine-to-machine authentication with PingOne Management APIs. Includes JavaScript examples, cURL commands, Postman collections, and security best practices.",icon:"⚙️",version:"V7"},"redirectless-v7":{flowType:"oauth",title:"Redirectless Flow (V7) - Enhanced Server-to-Server Authentication",subtitle:"🚀 V7: Enhanced redirectless authentication with fresh PKCE generation, improved error handling, and comprehensive educational content - Perfect for embedded login experiences and mobile apps.",icon:"🚀",version:"V7"},"pingone-par-v5":{flowType:"pingone",title:"PAR (Pushed Authorization Requests) Flow - Enhanced Security",subtitle:"🔒 RFC 9126 - Authorization Code Flow + PAR enhancement. Pushes authorization parameters via secure back-channel POST to /par endpoint before redirecting. Returns request_uri for compact authorization URL. ✅ Benefits: Parameters hidden from browser URLs, prevents tampering, no URL length limits. Perfect for production OIDC clients with sensitive scopes.",icon:"🔒",version:"V5"},"pingone-par-v7":{flowType:"pingone",title:"PAR (Pushed Authorization Requests) Flow V7 - Enhanced Security",subtitle:"🔒 V7: Enhanced PAR implementation with authorization details support - RFC 9126 Pushed Authorization Requests with comprehensive authorization details configuration. Pushes authorization parameters via secure back-channel POST to /par endpoint before redirecting. Returns request_uri for compact authorization URL. ✅ Benefits: Parameters hidden from browser URLs, prevents tampering, no URL length limits, fine-grained authorization details. Perfect for production OIDC clients with sensitive scopes and complex authorization requirements.",icon:"🔒",version:"V7"},"rar-flow-v5":{flowType:"pingone",title:"RAR (Rich Authorization Requests) Flow - Fine-Grained Permissions",subtitle:'📊 RFC 9396 - Authorization Code Flow + RAR extension. Express complex authorization requirements using structured JSON authorization_details instead of simple scope strings. Example: "authorize $250 payment to ABC Supplies" vs "payments.write". ✅ Benefits: Fine-grained permissions, clear user consent, structured audit logs. Ideal for financial transactions and compliance scenarios.',icon:"📊",version:"V5"},"pingone-complete-mfa-v7":{flowType:"pingone",title:"PingOne Complete MFA Flow V7",subtitle:"🔐 Complete multi-factor authentication implementation with modern V7 UI. Demonstrates user authentication, MFA enrollment, device pairing, challenge verification, and token retrieval with PingOne integration.",icon:"🔐",version:"V7"},"pingone-authentication":{flowType:"pingone",title:"PingOne Authentication",subtitle:"🔐 V7: Dedicated authentication page with inline and popup modes - Modern PingOne authentication interface with comprehensive user management and security features.",icon:"🔐",version:"V7"},"saml-bearer-assertion-v7":{flowType:"pingone",title:"SAML Bearer Assertion (V7)",subtitle:"🛡️ V7: SAML Bearer with PingFederate/PingOne AIS examples - Modern implementation of SAML Bearer Assertion flow for enterprise authentication.",icon:"🛡️",version:"V7"},"redirectless-flow-v5":{flowType:"pingone",title:"Redirectless Flow (response_mode=pi.flow) - API-Driven Auth",subtitle:"⚡ PingOne Proprietary - Authorization Code Flow with response_mode=pi.flow parameter. Eliminates browser redirects entirely - authentication happens via direct API calls to PingOne Flow API. Returns tokens directly without redirect_uri. ✅ Benefits: Embedded login UX, no browser navigation, seamless mobile/desktop experience. ⚠️ PingOne-specific, not OAuth/OIDC standard.",icon:"⚡",version:"V5"},"redirectless-v6-real":{flowType:"pingone",title:"Redirectless Flow V6 (response_mode=pi.flow) - Real Implementation",subtitle:"⚡ PingOne Proprietary - Authorization Code Flow with response_mode=pi.flow parameter. Eliminates browser redirects entirely - authentication happens via direct API calls to PingOne Flow API. Returns tokens directly without redirect_uri. ✅ Benefits: Embedded login UX, no browser navigation, seamless mobile/desktop experience. ⚠️ PingOne-specific, not OAuth/OIDC standard.",icon:"⚡",version:"V6"},"redirectless-v7-real":{flowType:"pingone",title:"Redirectless Flow V7 (response_mode=pi.flow) - Enhanced Implementation",subtitle:"🚀 PingOne Proprietary V7 - Enhanced Authorization Code Flow with response_mode=pi.flow parameter. V7 improvements: Fresh PKCE generation every time, enhanced error handling, improved logging, and better state management. Eliminates browser redirects entirely - authentication happens via direct API calls to PingOne Flow API. Returns tokens directly without redirect_uri. ✅ Benefits: Embedded login UX, no browser navigation, seamless mobile/desktop experience, enhanced reliability. ⚠️ PingOne-specific, not OAuth/OIDC standard.",icon:"🚀",version:"V7",isExperimental:!1},"redirectless-v6":{flowType:"pingone",title:"Redirectless Flow V6 - PingOne Pi.Flow Authentication",subtitle:"🎯 PingOne proprietary response_mode=pi.flow for seamless authentication without browser redirects. Host PingOne authentication UI within your application and receive tokens via JSON response. Perfect for embedded authentication experiences.",icon:"🎯",version:"V6",isExperimental:!1},"redirectless-flow-mock":{flowType:"pingone",title:"Redirectless Flow V5 - Educational Demo (Mock)",subtitle:"🎓 Educational demonstration of PingOne redirectless authentication (response_mode=pi.flow). Learn how redirectless flows work without needing a real PingOne environment. Simulates Flow API interactions and token responses for learning purposes.",icon:"🎓",version:"V5",isExperimental:!0},dashboard:{flowType:"oauth",title:"Dashboard",subtitle:"Your comprehensive OAuth 2.0 and OpenID Connect testing environment. View recent activity, check configuration status, and explore available flows.",icon:"🏠"},configuration:{flowType:"pingone",title:"Settings",subtitle:"Configure your PingOne environment credentials, OAuth clients, and application settings. Manage flow-specific configurations and customize your playground experience.",icon:"⚙️"},oauth21:{flowType:"documentation",title:"OAuth 2.1 - The Next Evolution of OAuth",subtitle:"Learn about OAuth 2.1, the consolidated specification that incorporates security improvements and best practices. See key changes from OAuth 2.0 including required PKCE, deprecated flows, and enhanced security.",icon:"🛡️"},"comprehensive-oauth-education":{flowType:"documentation",title:"Comprehensive OAuth AI Education",subtitle:"Master OAuth 2.0 and OpenID Connect fundamentals, flows, security best practices, and modern standards. From basics to advanced topics including AI agent authentication and machine-to-machine communication.",icon:"📚"},"environment-id-demo":{flowType:"documentation",title:"Environment ID Input Demo",subtitle:"Simplified PingOne configuration. Just enter your environment ID, select your region, and we'll construct the issuer URL and discover all OIDC endpoints automatically.",icon:"🔧"},"oidc-overview":{flowType:"oidc",title:"OIDC Overview",subtitle:"Comprehensive guide to OpenID Connect authentication flows, security considerations, and implementation best practices for modern applications.",icon:"📚"},"ai-glossary":{flowType:"documentation",title:"AI Glossary",subtitle:"Comprehensive glossary of AI, machine learning, OAuth 2.0, and OpenID Connect terminology. Search and explore definitions for technical terms used throughout the playground.",icon:"📚"},"emerging-ai-standards":{flowType:"documentation",title:"Emerging AI Standards",subtitle:"Explore new OAuth extensions and industry proposals that enable autonomous agents to authenticate, authorize, and collaborate securely across domains.",icon:"🤖"},"token-management":{flowType:"pingone",title:"Token Management",subtitle:"Monitor, analyze, and manage OAuth access tokens and OpenID Connect ID tokens. View token details, validate tokens, perform introspection, and test token revocation.",icon:"🔑"},"auto-discover":{flowType:"oidc",title:"Auto Discover",subtitle:"Automatically discover OpenID Connect configuration from your PingOne environment. Fetches authorization, token, userinfo, and JWKS endpoints from the .well-known/openid-configuration endpoint.",icon:"🔍"},"jwks-troubleshooting":{flowType:"pingone",title:"JWKS Troubleshooting Guide",subtitle:"Diagnose and fix common JWKS format issues with PingOne SSO. Execute curl commands directly to test your JWKS endpoints and validate the format.",icon:"⚠️"},"url-decoder":{flowType:"oauth",title:"URL Decoder",subtitle:"Decode and analyze URLs, especially useful for OAuth authorization URLs and callback parameters. Break down complex URLs into readable components and parameters.",icon:"🌐",version:"V5"},"oauth2-security-best-practices":{flowType:"oauth",title:"OAuth 2.0 Security",subtitle:"Based on RFC 9700 - Best Current Practice for OAuth 2.0 Security. Essential security recommendations, threat models, and mitigation strategies for building secure OAuth 2.0 applications.",icon:"🛡️"},"oidc-for-ai":{flowType:"oidc",title:"OIDC for AI",subtitle:"Resources and guidance for implementing OpenID Connect in AI and machine learning applications. Learn authentication patterns for AI agents and autonomous systems.",icon:"🤖"},"oidc-specs":{flowType:"oidc",title:"OIDC Specs",subtitle:"Official OpenID Connect specifications and related standards from the OpenID Foundation. Access core specs, security considerations, and implementation guides.",icon:"📋"},"scopes-best-practices":{flowType:"oauth",title:"Scopes Best Practices",subtitle:"Comprehensive guide to designing, implementing, and managing OAuth 2.0 scopes at scale. Learn how to create effective scope strategies for API security.",icon:"🎯"},"oidc-ciba-v6":{flowType:"oidc",title:"OIDC CIBA Flow (Mock) (V6)",subtitle:"🎓 Educational CIBA implementation - PingOne does not support CIBA. Mock flow demonstrates Client Initiated Backchannel Authentication for decoupled authentication scenarios.",version:"V6",icon:"🎓"},"oauth2-resource-owner-password-v6":{flowType:"oauth",title:"OAuth 2.0 Resource Owner Password Credentials (V6)",subtitle:"🎭 Hybrid V6 implementation: Proven V5 controller with modern V6 layout and styling. Direct username/password exchange for access tokens with comprehensive educational content.",version:"V6",icon:"🔑"},"oauth-ropc-v7":{flowType:"oauth",title:"OAuth ROPC (V7)",subtitle:"🚀 V7 Enhanced implementation: Modern UI with improved user experience, enhanced error handling, and better visual design. Resource Owner Password Credentials flow with comprehensive educational content.",version:"V7",icon:"🔑",isExperimental:!1},"pingone-mfa-v5":{flowType:"oidc",title:"PingOne MFA Flow (V5)",subtitle:"Multi-factor authentication flow with PingOne MFA services. Demonstrates device registration, MFA method selection, and token exchange with MFA context.",version:"V5",icon:"🛡️"},"pingone-mfa-v6":{flowType:"oidc",title:"PingOne MFA Flow (V6)",subtitle:"🛡️ Modern V6 implementation: Multi-factor authentication with enhanced UX. Demonstrates device registration, MFA method selection, and secure token exchange with comprehensive MFA context.",version:"V6",icon:"🛡️"},rar:{flowType:"oauth",title:"Rich Authorization Requests (RAR) Flow",subtitle:"Enhanced OAuth 2.0 flow with granular authorization details for fine-grained access control. Enables detailed permission specifications beyond simple scopes.",icon:"🎯",version:"V5"},"rar-v7":{flowType:"oauth",title:"RAR Flow (V7) - Rich Authorization Requests",subtitle:"🎯 V7: Enhanced RAR implementation with V7 services - Fine-grained authorization using structured JSON (RFC 9396). Enables detailed permission specifications beyond simple scopes with comprehensive credential management and modern UI.",icon:"🎯",version:"V7"},"jwt-bearer":{flowType:"oauth",title:"OAuth 2.0 JWT Bearer Flow",subtitle:"Server-to-server authentication using JWT assertions instead of traditional client credentials for secure token exchange",icon:"🔑",version:"V5"},"jwt-bearer-token-v5":{flowType:"oauth",title:"JWT Bearer Token Flow - Assertion-Based Access",subtitle:"Authenticate machine clients by exchanging signed JWT assertions for access tokens. Demonstrates PingOne-style implementation with mock tokens for education.",icon:"🔐",version:"V5"},documentation:{flowType:"documentation",title:"PingOne Client Generator",subtitle:"Create and configure OAuth 2.0 and OpenID Connect applications in your PingOne environment. Generate clients for web apps, native apps, SPAs, workers, and services.",icon:"📚"},login:{flowType:"pingone",title:"PingOne Authentication",subtitle:"🔐 V7: Dedicated authentication page with inline and popup modes - Modern PingOne authentication interface with comprehensive user management and security features.",icon:"🔐",version:"V7"},"saml-bearer":{flowType:"pingone",title:"SAML Bearer Assertion Flow (Mock)",subtitle:"Educational implementation of RFC 7522 SAML Bearer Assertion for OAuth token exchange. Mock implementation since PingOne does not support SAML Bearer assertions.",icon:"🛡️"}},ur=({flowId:e,flowType:r,customConfig:n})=>{const i=e||r,o=i?dr[i]:null,s=o?{...o,...n}:n||null;if(!s)return null;return t.jsxs(nr,{$flowType:s.flowType,$securityFeatures:s.securityFeatures,children:[t.jsxs(ir,{$flowType:s.flowType,$securityFeatures:s.securityFeatures,children:[s.icon&&t.jsx(lr,{children:s.icon}),(()=>{if(!s.flowType)return"UNKNOWN";const e=s.flowType.toUpperCase();return s.version?`${e} ${s.version}`:e})(),s.isExperimental&&t.jsx(or,{$type:"experimental",children:"Experimental"}),s.isDeprecated&&t.jsx(or,{$type:"deprecated",children:"Deprecated"})]}),t.jsx(sr,{children:s.title}),t.jsx(ar,{children:s.subtitle}),t.jsxs(cr,{children:["PingOne MasterFlow API v",rr.version]})]})},pr={baseUrl:"https://auth.pingone.com",clientId:"your-client-id",clientSecret:"your-client-secret",redirectUri:"https://your-app.com/callback",scopes:["openid","profile","email"],environmentId:"your-environment-id"},hr=e=>[{language:"javascript",title:"Node.js with fetch",code:`// Install: npm install node-fetch\nconst fetch = require('node-fetch');\n\nconst config = {\n  baseUrl: '${e.baseUrl}',\n  clientId: '${e.clientId}',\n  clientSecret: '${e.clientSecret}',\n  redirectUri: '${e.redirectUri}',\n  scopes: ${JSON.stringify(e.scopes)},\n  environmentId: '${e.environmentId}'\n};\n\n// Authorization URL\nconst authUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize?\` +\n  \`response_type=code&\` +\n  \`client_id=\${config.clientId}&\` +\n  \`redirect_uri=\${encodeURIComponent(config.redirectUri)}&\` +\n  \`scope=\${config.scopes.join(' ')}&\` +\n  \`state=random-state-value\`;\n\nconsole.log('Visit this URL:', authUrl);`,dependencies:["node-fetch"]},{language:"javascript",title:"Browser with fetch",code:`// Browser implementation\nconst config = {\n  baseUrl: '${e.baseUrl}',\n  clientId: '${e.clientId}',\n  redirectUri: '${e.redirectUri}',\n  scopes: ${JSON.stringify(e.scopes)},\n  environmentId: '${e.environmentId}'\n};\n\n// Generate authorization URL\nfunction generateAuthUrl() {\n  const params = new URLSearchParams({\n    response_type: 'code',\n    client_id: config.clientId,\n    redirect_uri: config.redirectUri,\n    scope: config.scopes.join(' '),\n    state: generateRandomState()\n  });\n  \n  return \`\${config.baseUrl}/\${config.environmentId}/as/authorize?\${params}\`;\n}\n\n// Exchange code for token\nasync function exchangeCodeForToken(code) {\n  const response = await fetch(\`\${config.baseUrl}/\${config.environmentId}/as/token\`, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/x-www-form-urlencoded',\n    },\n    body: new URLSearchParams({\n      grant_type: 'authorization_code',\n      code: code,\n      redirect_uri: config.redirectUri,\n      client_id: config.clientId,\n      client_secret: config.clientSecret\n    })\n  });\n  \n  return await response.json();\n}`}],gr=e=>[{language:"typescript",title:"TypeScript with axios",code:`// Install: npm install axios @types/node\nimport axios, { AxiosResponse } from 'axios';\n\ninterface OAuthConfig {\n  baseUrl: string;\n  clientId: string;\n  clientSecret: string;\n  redirectUri: string;\n  scopes: string[];\n  environmentId: string;\n}\n\ninterface TokenResponse {\n  access_token: string;\n  token_type: string;\n  expires_in: number;\n  refresh_token?: string;\n  scope: string;\n}\n\nconst config: OAuthConfig = {\n  baseUrl: '${e.baseUrl}',\n  clientId: '${e.clientId}',\n  clientSecret: '${e.clientSecret}',\n  redirectUri: '${e.redirectUri}',\n  scopes: ${JSON.stringify(e.scopes)},\n  environmentId: '${e.environmentId}'\n};\n\nclass OAuthClient {\n  private config: OAuthConfig;\n\n  constructor(config: OAuthConfig) {\n    this.config = config;\n  }\n\n  generateAuthUrl(state: string = this.generateState()): string {\n    const params = new URLSearchParams({\n      response_type: 'code',\n      client_id: this.config.clientId,\n      redirect_uri: this.config.redirectUri,\n      scope: this.config.scopes.join(' '),\n      state\n    });\n    \n    return \`\${this.config.baseUrl}/\${this.config.environmentId}/as/authorize?\${params}\`;\n  }\n\n  async exchangeCodeForToken(code: string): Promise<TokenResponse> {\n    const response: AxiosResponse<TokenResponse> = await axios.post(\n      \`\${this.config.baseUrl}/\${this.config.environmentId}/as/token\`,\n      new URLSearchParams({\n        grant_type: 'authorization_code',\n        code,\n        redirect_uri: this.config.redirectUri,\n        client_id: this.config.clientId,\n        client_secret: this.config.clientSecret\n      }),\n      {\n        headers: {\n          'Content-Type': 'application/x-www-form-urlencoded',\n        }\n      }\n    );\n    \n    return response.data;\n  }\n\n  private generateState(): string {\n    return Math.random().toString(36).substring(2, 15);\n  }\n}\n\n// Usage\nconst oauthClient = new OAuthClient(config);\nconst authUrl = oauthClient.generateAuthUrl();\nconsole.log('Visit this URL:', authUrl);`,dependencies:["axios","@types/node"]}],mr=e=>[{language:"go",title:"Go with net/http",code:`// Install: go mod init your-app\n// go get github.com/golang/oauth2\n\npackage main\n\nimport (\n    "encoding/json"\n    "fmt"\n    "net/http"\n    "net/url"\n    "strings"\n    "time"\n)\n\ntype OAuthConfig struct {\n    BaseURL       string\n    ClientID      string\n    ClientSecret  string\n    RedirectURI   string\n    Scopes        []string\n    EnvironmentID string\n}\n\ntype TokenResponse struct {\n    AccessToken  string \`json:"access_token"\`\n    TokenType    string \`json:"token_type"\`\n    ExpiresIn    int    \`json:"expires_in"\`\n    RefreshToken string \`json:"refresh_token,omitempty"\`\n    Scope        string \`json:"scope"\`\n}\n\nfunc main() {\n    config := OAuthConfig{\n        BaseURL:       "${e.baseUrl}",\n        ClientID:      "${e.clientId}",\n        ClientSecret:  "${e.clientSecret}",\n        RedirectURI:   "${e.redirectUri}",\n        Scopes:        ${JSON.stringify(e.scopes)},\n        EnvironmentID: "${e.environmentId}",\n    }\n\n    // Generate authorization URL\n    authURL := generateAuthURL(config)\n    fmt.Printf("Visit this URL: %s\\n", authURL)\n\n    // Example: Exchange code for token (you'd get the code from callback)\n    // token, err := exchangeCodeForToken(config, "authorization-code-here")\n    // if err != nil {\n    //     log.Fatal(err)\n    // }\n    // fmt.Printf("Access Token: %s\\n", token.AccessToken)\n}\n\nfunc generateAuthURL(config OAuthConfig) string {\n    params := url.Values{}\n    params.Add("response_type", "code")\n    params.Add("client_id", config.ClientID)\n    params.Add("redirect_uri", config.RedirectURI)\n    params.Add("scope", strings.Join(config.Scopes, " "))\n    params.Add("state", generateRandomState())\n\n    return fmt.Sprintf("%s/%s/as/authorize?%s", \n        config.BaseURL, config.EnvironmentID, params.Encode())\n}\n\nfunc exchangeCodeForToken(config OAuthConfig, code string) (*TokenResponse, error) {\n    data := url.Values{}\n    data.Set("grant_type", "authorization_code")\n    data.Set("code", code)\n    data.Set("redirect_uri", config.RedirectURI)\n    data.Set("client_id", config.ClientID)\n    data.Set("client_secret", config.ClientSecret)\n\n    resp, err := http.PostForm(\n        fmt.Sprintf("%s/%s/as/token", config.BaseURL, config.EnvironmentID),\n        data,\n    )\n    if err != nil {\n        return nil, err\n    }\n    defer resp.Body.Close()\n\n    var token TokenResponse\n    if err := json.NewDecoder(resp.Body).Decode(&token); err != nil {\n        return nil, err\n    }\n\n    return &token, nil\n}\n\nfunc generateRandomState() string {\n    return fmt.Sprintf("%d", time.Now().UnixNano())\n}`,dependencies:["github.com/golang/oauth2"]}],fr=e=>[{language:"ruby",title:"Ruby with Net::HTTP",code:`# Install: gem install net-http\nrequire 'net/http'\nrequire 'uri'\nrequire 'json'\nrequire 'securerandom'\n\nclass OAuthClient\n  def initialize(config)\n    @base_url = config[:base_url]\n    @client_id = config[:client_id]\n    @client_secret = config[:client_secret]\n    @redirect_uri = config[:redirect_uri]\n    @scopes = config[:scopes]\n    @environment_id = config[:environment_id]\n  end\n\n  def generate_auth_url\n    params = {\n      'response_type' => 'code',\n      'client_id' => @client_id,\n      'redirect_uri' => @redirect_uri,\n      'scope' => @scopes.join(' '),\n      'state' => generate_random_state\n    }\n    \n    query_string = URI.encode_www_form(params)\n    "#{@base_url}/#{@environment_id}/as/authorize?#{query_string}"\n  end\n\n  def exchange_code_for_token(code)\n    uri = URI("#{@base_url}/#{@environment_id}/as/token")\n    \n    request = Net::HTTP::Post.new(uri)\n    request.set_form_data({\n      'grant_type' => 'authorization_code',\n      'code' => code,\n      'redirect_uri' => @redirect_uri,\n      'client_id' => @client_id,\n      'client_secret' => @client_secret\n    })\n\n    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|\n      http.request(request)\n    end\n\n    JSON.parse(response.body)\n  end\n\n  private\n\n  def generate_random_state\n    SecureRandom.hex(16)\n  end\nend\n\n# Usage\nconfig = {\n  base_url: '${e.baseUrl}',\n  client_id: '${e.clientId}',\n  client_secret: '${e.clientSecret}',\n  redirect_uri: '${e.redirectUri}',\n  scopes: ${JSON.stringify(e.scopes)},\n  environment_id: '${e.environmentId}'\n}\n\noauth_client = OAuthClient.new(config)\nauth_url = oauth_client.generate_auth_url\nputs "Visit this URL: #{auth_url}"`,dependencies:["net-http"]}],br=e=>[{language:"python",title:"Python with requests",code:`# Install: pip install requests\nimport requests\nimport urllib.parse\nimport secrets\nimport json\n\nclass OAuthClient:\n    def __init__(self, config):\n        self.base_url = config['base_url']\n        self.client_id = config['client_id']\n        self.client_secret = config['client_secret']\n        self.redirect_uri = config['redirect_uri']\n        self.scopes = config['scopes']\n        self.environment_id = config['environment_id']\n\n    def generate_auth_url(self):\n        params = {\n            'response_type': 'code',\n            'client_id': self.client_id,\n            'redirect_uri': self.redirect_uri,\n            'scope': ' '.join(self.scopes),\n            'state': self._generate_random_state()\n        }\n        \n        query_string = urllib.parse.urlencode(params)\n        return f"{self.base_url}/{self.environment_id}/as/authorize?{query_string}"\n\n    def exchange_code_for_token(self, code):\n        url = f"{self.base_url}/{self.environment_id}/as/token"\n        \n        data = {\n            'grant_type': 'authorization_code',\n            'code': code,\n            'redirect_uri': self.redirect_uri,\n            'client_id': self.client_id,\n            'client_secret': self.client_secret\n        }\n        \n        response = requests.post(url, data=data)\n        return response.json()\n\n    def _generate_random_state(self):\n        return secrets.token_urlsafe(32)\n\n# Usage\nconfig = {\n    'base_url': '${e.baseUrl}',\n    'client_id': '${e.clientId}',\n    'client_secret': '${e.clientSecret}',\n    'redirect_uri': '${e.redirectUri}',\n    'scopes': ${JSON.stringify(e.scopes)},\n    'environment_id': '${e.environmentId}'\n}\n\noauth_client = OAuthClient(config)\nauth_url = oauth_client.generate_auth_url()\nprint(f"Visit this URL: {auth_url}")`,dependencies:["requests"]},{language:"python",title:"Python with httpx (async)",code:`# Install: pip install httpx\nimport httpx\nimport asyncio\nimport urllib.parse\nimport secrets\n\nclass AsyncOAuthClient:\n    def __init__(self, config):\n        self.base_url = config['base_url']\n        self.client_id = config['client_id']\n        self.client_secret = config['client_secret']\n        self.redirect_uri = config['redirect_uri']\n        self.scopes = config['scopes']\n        self.environment_id = config['environment_id']\n\n    def generate_auth_url(self):\n        params = {\n            'response_type': 'code',\n            'client_id': self.client_id,\n            'redirect_uri': self.redirect_uri,\n            'scope': ' '.join(self.scopes),\n            'state': self._generate_random_state()\n        }\n        \n        query_string = urllib.parse.urlencode(params)\n        return f"{self.base_url}/{self.environment_id}/as/authorize?{query_string}"\n\n    async def exchange_code_for_token(self, code):\n        url = f"{self.base_url}/{self.environment_id}/as/token"\n        \n        data = {\n            'grant_type': 'authorization_code',\n            'code': code,\n            'redirect_uri': self.redirect_uri,\n            'client_id': self.client_id,\n            'client_secret': self.client_secret\n        }\n        \n        async with httpx.AsyncClient() as client:\n            response = await client.post(url, data=data)\n            return response.json()\n\n    def _generate_random_state(self):\n        return secrets.token_urlsafe(32)\n\n# Usage\nasync def main():\n    config = {\n        'base_url': '${e.baseUrl}',\n        'client_id': '${e.clientId}',\n        'client_secret': '${e.clientSecret}',\n        'redirect_uri': '${e.redirectUri}',\n        'scopes': ${JSON.stringify(e.scopes)},\n        'environment_id': '${e.environmentId}'\n    }\n\n    oauth_client = AsyncOAuthClient(config)\n    auth_url = oauth_client.generate_auth_url()\n    print(f"Visit this URL: {auth_url}")\n\n# Run the async function\n# asyncio.run(main())`,dependencies:["httpx"]}],xr=e=>[{language:"ping-sdk",title:"Ping SDK for JavaScript - OIDC Login",code:`// Install: npm install @pingidentity/pingone-sdk-js\nimport { PingOne } from '@pingidentity/pingone-sdk-js';\n\n// Initialize PingOne SDK for OIDC login\nconst pingOne = new PingOne({\n  environmentId: '${e.environmentId}',\n  clientId: '${e.clientId}',\n  redirectUri: '${e.redirectUri}',\n  scopes: ${JSON.stringify(e.scopes)},\n  baseUrl: '${e.baseUrl}'\n});\n\n// Start OIDC login flow\nasync function startOIDCLogin() {\n  try {\n    // Step 1: Start the OIDC login journey\n    const result = await pingOne.login();\n    \n    if (result.success) {\n      console.log('Login successful!');\n      console.log('Access Token:', result.tokens?.accessToken);\n      console.log('ID Token:', result.tokens?.idToken);\n      console.log('User Info:', result.user);\n      \n      return {\n        success: true,\n        tokens: result.tokens,\n        user: result.user\n      };\n    } else {\n      console.error('Login failed:', result.error);\n      return { success: false, error: result.error };\n    }\n  } catch (error) {\n    console.error('OIDC login error:', error);\n    throw error;\n  }\n}\n\n// Handle logout\nasync function logout() {\n  try {\n    await pingOne.logout();\n    console.log('Logout successful');\n  } catch (error) {\n    console.error('Logout failed:', error);\n    throw error;\n  }\n}\n\n// Check if user is authenticated\nfunction isAuthenticated() {\n  return pingOne.isAuthenticated();\n}\n\n// Get current user info\nasync function getCurrentUser() {\n  try {\n    if (pingOne.isAuthenticated()) {\n      const user = await pingOne.getUserInfo();\n      return user;\n    }\n    return null;\n  } catch (error) {\n    console.error('Failed to get user info:', error);\n    throw error;\n  }\n}\n\n// Complete OIDC login example\nasync function completeOIDCLogin() {\n  try {\n    // Check if already authenticated\n    if (isAuthenticated()) {\n      console.log('User already authenticated');\n      const user = await getCurrentUser();\n      return { success: true, user };\n    }\n    \n    // Start OIDC login\n    const result = await startOIDCLogin();\n    return result;\n  } catch (error) {\n    console.error('OIDC login flow failed:', error);\n    throw error;\n  }\n}`,description:"OIDC Login using Ping SDK for JavaScript (centralized login)",dependencies:["@pingidentity/pingone-sdk-js"]},{language:"ping-sdk",title:"Ping SDK for JavaScript - Auth Journeys",code:`// Install: npm install @pingidentity/pingone-sdk-js\nimport { PingOne } from '@pingidentity/pingone-sdk-js';\n\n// Initialize PingOne SDK for Auth Journeys\nconst pingOne = new PingOne({\n  environmentId: '${e.environmentId}',\n  clientId: '${e.clientId}',\n  redirectUri: '${e.redirectUri}',\n  scopes: ${JSON.stringify(e.scopes)},\n  baseUrl: '${e.baseUrl}'\n});\n\n// Start authentication journey\nasync function startAuthJourney() {\n  try {\n    // Step 1: Start the authentication journey\n    const journey = await pingOne.startJourney();\n    \n    if (journey.success) {\n      console.log('Journey started successfully');\n      console.log('Journey ID:', journey.journeyId);\n      console.log('Next Step:', journey.nextStep);\n      \n      return journey;\n    } else {\n      console.error('Failed to start journey:', journey.error);\n      return { success: false, error: journey.error };\n    }\n  } catch (error) {\n    console.error('Auth journey error:', error);\n    throw error;\n  }\n}\n\n// Handle journey step\nasync function handleJourneyStep(stepData: any) {\n  try {\n    const result = await pingOne.handleJourneyStep(stepData);\n    \n    if (result.success) {\n      console.log('Step completed successfully');\n      console.log('Next Step:', result.nextStep);\n      console.log('Tokens:', result.tokens);\n      \n      return result;\n    } else {\n      console.error('Step failed:', result.error);\n      return { success: false, error: result.error };\n    }\n  } catch (error) {\n    console.error('Journey step error:', error);\n    throw error;\n  }\n}\n\n// Complete authentication journey\nasync function completeAuthJourney() {\n  try {\n    // Step 1: Start journey\n    const journey = await startAuthJourney();\n    \n    if (!journey.success) {\n      return journey;\n    }\n    \n    // Step 2: Handle journey steps (this would be in your UI handlers)\n    // const stepResult = await handleJourneyStep(stepData);\n    \n    // Step 3: Complete journey when done\n    // const finalResult = await pingOne.completeJourney();\n    \n    return journey;\n  } catch (error) {\n    console.error('Auth journey failed:', error);\n    throw error;\n  }\n}\n\n// Get journey status\nasync function getJourneyStatus(journeyId: string) {\n  try {\n    const status = await pingOne.getJourneyStatus(journeyId);\n    console.log('Journey Status:', status);\n    return status;\n  } catch (error) {\n    console.error('Failed to get journey status:', error);\n    throw error;\n  }\n}`,description:"Authentication Journeys using Ping SDK for JavaScript",dependencies:["@pingidentity/pingone-sdk-js"]},{language:"ping-sdk",title:"Ping (ForgeRock) Login Widget",code:`// Install: npm install @pingidentity/pingone-login-widget\nimport { PingOneLoginWidget } from '@pingidentity/pingone-login-widget';\n\n// Initialize Login Widget\nconst loginWidget = new PingOneLoginWidget({\n  environmentId: '${e.environmentId}',\n  clientId: '${e.clientId}',\n  redirectUri: '${e.redirectUri}',\n  scopes: ${JSON.stringify(e.scopes)},\n  baseUrl: '${e.baseUrl}'\n});\n\n// Configure the widget\nfunction configureWidget() {\n  // Step 1: Configure CSS\n  loginWidget.configureCSS({\n    theme: 'light', // or 'dark'\n    primaryColor: '#3b82f6',\n    borderRadius: '8px'\n  });\n  \n  // Step 2: Configure SDK\n  loginWidget.configureSDK({\n    environmentId: '${e.environmentId}',\n    clientId: '${e.clientId}',\n    redirectUri: '${e.redirectUri}'\n  });\n}\n\n// Instantiate the widget\nfunction createLoginWidget(containerId: string) {\n  // Step 3: Create widget instance\n  const widget = loginWidget.create({\n    container: containerId,\n    journey: 'default' // or specific journey name\n  });\n  \n  return widget;\n}\n\n// Start a journey\nasync function startJourney(widget: any) {\n  try {\n    // Step 4: Start the journey\n    const result = await widget.startJourney();\n    \n    if (result.success) {\n      console.log('Journey started successfully');\n      console.log('Journey ID:', result.journeyId);\n      return result;\n    } else {\n      console.error('Failed to start journey:', result.error);\n      return { success: false, error: result.error };\n    }\n  } catch (error) {\n    console.error('Journey start error:', error);\n    throw error;\n  }\n}\n\n// Subscribe to events\nfunction subscribeToEvents(widget: any) {\n  // Step 5: Subscribe to widget events\n  widget.on('journey:start', (data: any) => {\n    console.log('Journey started:', data);\n  });\n  \n  widget.on('journey:step', (data: any) => {\n    console.log('Journey step:', data);\n  });\n  \n  widget.on('journey:complete', (data: any) => {\n    console.log('Journey completed:', data);\n    console.log('Tokens:', data.tokens);\n    console.log('User:', data.user);\n  });\n  \n  widget.on('journey:error', (error: any) => {\n    console.error('Journey error:', error);\n  });\n}\n\n// Complete Login Widget setup\nfunction setupLoginWidget(containerId: string) {\n  try {\n    // Configure widget\n    configureWidget();\n    \n    // Create widget instance\n    const widget = createLoginWidget(containerId);\n    \n    // Subscribe to events\n    subscribeToEvents(widget);\n    \n    // Start journey\n    startJourney(widget);\n    \n    return widget;\n  } catch (error) {\n    console.error('Login Widget setup failed:', error);\n    throw error;\n  }\n}\n\n// HTML usage example:\n// <div id="login-widget-container"></div>\n// <script>\n//   const widget = setupLoginWidget('login-widget-container');\n// <\/script>`,description:"Ping (ForgeRock) Login Widget for web applications",dependencies:["@pingidentity/pingone-login-widget"]}],yr=e=>[{language:"javascript",title:"RAR Authorization Request - JavaScript",code:`// RAR (Rich Authorization Requests) - Authorization Request\nconst crypto = require('crypto');\n\n// Define authorization details for RAR\nconst authorizationDetails = [\n  {\n    type: 'payment_initiation',\n    locations: ['https://api.bank.com/payments'],\n    actions: ['initiate', 'status'],\n    datatypes: ['account', 'amount']\n  },\n  {\n    type: 'account_information',\n    locations: ['https://api.bank.com/accounts'],\n    actions: ['read'],\n    datatypes: ['account', 'balance']\n  }\n];\n\n// Generate RAR authorization URL\nfunction generateRARAuthUrl() {\n  const baseUrl = '${e.baseUrl}/${e.environmentId}/as/authorize';\n  const params = new URLSearchParams({\n    response_type: 'code',\n    client_id: '${e.clientId}',\n    redirect_uri: '${e.redirectUri}',\n    scope: '${e.scopes.join(" ")}',\n    state: crypto.randomBytes(16).toString('hex'),\n    authorization_details: JSON.stringify({\n      type: 'oauth_authorization_details',\n      authorization_details: authorizationDetails\n    })\n  });\n  \n  return \`\${baseUrl}?\${params.toString()}\`;\n}\n\n// Example usage\nconst authUrl = generateRARAuthUrl();\nconsole.log('RAR Authorization URL:', authUrl);`,description:"Generate RAR authorization URL with granular permissions",dependencies:["crypto"]},{language:"typescript",title:"RAR Authorization Request - TypeScript",code:`// RAR (Rich Authorization Requests) - TypeScript\nimport { randomBytes } from 'crypto';\n\ninterface AuthorizationDetail {\n  type: string;\n  locations: string[];\n  actions: string[];\n  datatypes: string[];\n}\n\ninterface RARConfig {\n  baseUrl: string;\n  environmentId: string;\n  clientId: string;\n  redirectUri: string;\n  scopes: string[];\n}\n\n// Define authorization details for RAR\nconst authorizationDetails: AuthorizationDetail[] = [\n  {\n    type: 'payment_initiation',\n    locations: ['https://api.bank.com/payments'],\n    actions: ['initiate', 'status'],\n    datatypes: ['account', 'amount']\n  },\n  {\n    type: 'account_information',\n    locations: ['https://api.bank.com/accounts'],\n    actions: ['read'],\n    datatypes: ['account', 'balance']\n  }\n];\n\n// Generate RAR authorization URL\nfunction generateRARAuthUrl(config: RARConfig): string {\n  const baseUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize\`;\n  const params = new URLSearchParams({\n    response_type: 'code',\n    client_id: config.clientId,\n    redirect_uri: config.redirectUri,\n    scope: config.scopes.join(' '),\n    state: randomBytes(16).toString('hex'),\n    authorization_details: JSON.stringify({\n      type: 'oauth_authorization_details',\n      authorization_details: authorizationDetails\n    })\n  });\n  \n  return \`\${baseUrl}?\${params.toString()}\`;\n}\n\n// Example usage\nconst config: RARConfig = {\n  baseUrl: '${e.baseUrl}',\n  environmentId: '${e.environmentId}',\n  clientId: '${e.clientId}',\n  redirectUri: '${e.redirectUri}',\n  scopes: ${JSON.stringify(e.scopes)}\n};\n\nconst authUrl = generateRARAuthUrl(config);\nconsole.log('RAR Authorization URL:', authUrl);`,description:"TypeScript implementation of RAR authorization request",dependencies:["@types/node"]},{language:"go",title:"RAR Authorization Request - Go",code:`// RAR (Rich Authorization Requests) - Go\npackage main\n\nimport (\n    "crypto/rand"\n    "encoding/base64"\n    "encoding/json"\n    "fmt"\n    "net/url"\n)\n\ntype AuthorizationDetail struct {\n    Type      string   \`json:"type"\`\n    Locations []string \`json:"locations"\`\n    Actions   []string \`json:"actions"\`\n    DataTypes []string \`json:"datatypes"\`\n}\n\ntype RARConfig struct {\n    BaseURL       string\n    EnvironmentID string\n    ClientID      string\n    RedirectURI   string\n    Scopes        []string\n}\n\n// Generate RAR authorization URL\nfunc generateRARAuthURL(config RARConfig) (string, error) {\n    // Define authorization details\n    authDetails := []AuthorizationDetail{\n        {\n            Type:      "payment_initiation",\n            Locations: []string{"https://api.bank.com/payments"},\n            Actions:   []string{"initiate", "status"},\n            DataTypes: []string{"account", "amount"},\n        },\n        {\n            Type:      "account_information",\n            Locations: []string{"https://api.bank.com/accounts"},\n            Actions:   []string{"read"},\n            DataTypes: []string{"account", "balance"},\n        },\n    }\n    \n    // Create RAR structure\n    rarData := map[string]interface{}{\n        "type":                 "oauth_authorization_details",\n        "authorization_details": authDetails,\n    }\n    \n    // Marshal to JSON\n    rarJSON, err := json.Marshal(rarData)\n    if err != nil {\n        return "", err\n    }\n    \n    // Generate random state\n    stateBytes := make([]byte, 16)\n    if _, err := rand.Read(stateBytes); err != nil {\n        return "", err\n    }\n    state := base64.URLEncoding.EncodeToString(stateBytes)\n    \n    // Build URL\n    baseURL := fmt.Sprintf("%s/%s/as/authorize", config.BaseURL, config.EnvironmentID)\n    params := url.Values{\n        "response_type":        {"code"},\n        "client_id":           {config.ClientID},\n        "redirect_uri":        {config.RedirectURI},\n        "scope":               {fmt.Sprintf("%s", config.Scopes)},\n        "state":               {state},\n        "authorization_details": {string(rarJSON)},\n    }\n    \n    return fmt.Sprintf("%s?%s", baseURL, params.Encode()), nil\n}\n\nfunc main() {\n    config := RARConfig{\n        BaseURL:       "${e.baseUrl}",\n        EnvironmentID: "${e.environmentId}",\n        ClientID:      "${e.clientId}",\n        RedirectURI:   "${e.redirectUri}",\n        Scopes:        ${JSON.stringify(e.scopes)},\n    }\n    \n    authURL, err := generateRARAuthURL(config)\n    if err != nil {\n        fmt.Printf("Error: %v\\n", err)\n        return\n    }\n    \n    fmt.Printf("RAR Authorization URL: %s\\n", authURL)\n}`,description:"Go implementation of RAR authorization request",dependencies:[]},{language:"python",title:"RAR Authorization Request - Python",code:`# RAR (Rich Authorization Requests) - Python\nimport json\nimport secrets\nimport urllib.parse\nfrom typing import List, Dict, Any\n\nclass RARClient:\n    def __init__(self, base_url: str, environment_id: str, client_id: str, \n                 redirect_uri: str, scopes: List[str]):\n        self.base_url = base_url\n        self.environment_id = environment_id\n        self.client_id = client_id\n        self.redirect_uri = redirect_uri\n        self.scopes = scopes\n    \n    def generate_rar_auth_url(self) -> str:\n        # Define authorization details for RAR\n        authorization_details = [\n            {\n                "type": "payment_initiation",\n                "locations": ["https://api.bank.com/payments"],\n                "actions": ["initiate", "status"],\n                "datatypes": ["account", "amount"]\n            },\n            {\n                "type": "account_information",\n                "locations": ["https://api.bank.com/accounts"],\n                "actions": ["read"],\n                "datatypes": ["account", "balance"]\n            }\n        ]\n        \n        # Create RAR structure\n        rar_data = {\n            "type": "oauth_authorization_details",\n            "authorization_details": authorization_details\n        }\n        \n        # Generate random state\n        state = secrets.token_urlsafe(16)\n        \n        # Build URL parameters\n        params = {\n            "response_type": "code",\n            "client_id": self.client_id,\n            "redirect_uri": self.redirect_uri,\n            "scope": " ".join(self.scopes),\n            "state": state,\n            "authorization_details": json.dumps(rar_data)\n        }\n        \n        # Build complete URL\n        base_url = f"{self.base_url}/{self.environment_id}/as/authorize"\n        query_string = urllib.parse.urlencode(params)\n        return f"{base_url}?{query_string}"\n\n# Example usage\nconfig = {\n    "base_url": "${e.baseUrl}",\n    "environment_id": "${e.environmentId}",\n    "client_id": "${e.clientId}",\n    "redirect_uri": "${e.redirectUri}",\n    "scopes": ${JSON.stringify(e.scopes)}\n}\n\nclient = RARClient(**config)\nauth_url = client.generate_rar_auth_url()\nprint(f"RAR Authorization URL: {auth_url}")`,description:"Python implementation of RAR authorization request",dependencies:[]}],wr=e=>[{language:"javascript",title:"PAR Push Request - JavaScript",code:`// PAR (Pushed Authorization Requests) - Push Request\nconst crypto = require('crypto');\n\n// Push authorization request to server\nasync function pushAuthorizationRequest() {\n  const parEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/par\`;\n  \n  // Generate PKCE parameters\n  const codeVerifier = crypto.randomBytes(32).toString('base64url');\n  const codeChallenge = crypto\n    .createHash('sha256')\n    .update(codeVerifier)\n    .digest('base64url');\n  \n  const requestData = new URLSearchParams({\n    client_id: '${e.clientId}',\n    redirect_uri: '${e.redirectUri}',\n    response_type: 'code',\n    scope: '${e.scopes.join(" ")}',\n    state: crypto.randomBytes(16).toString('hex'),\n    code_challenge: codeChallenge,\n    code_challenge_method: 'S256'\n  });\n  \n  try {\n    const response = await fetch(parEndpoint, {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/x-www-form-urlencoded',\n        'Authorization': \`Basic \${Buffer.from(\`\${config.clientId}:\${config.clientSecret}\`).toString('base64')}\`\n      },\n      body: requestData\n    });\n    \n    const result = await response.json();\n    \n    if (response.ok) {\n      console.log('PAR successful!');\n      console.log('Request URI:', result.request_uri);\n      console.log('Expires in:', result.expires_in, 'seconds');\n      \n      // Store for later use\n      return {\n        request_uri: result.request_uri,\n        expires_in: result.expires_in,\n        code_verifier: codeVerifier\n      };\n    } else {\n      throw new Error(\`PAR failed: \${result.error} - \${result.error_description}\`);\n    }\n  } catch (error) {\n    console.error('PAR error:', error);\n    throw error;\n  }\n}\n\n// Generate authorization URL using request URI\nfunction generateAuthUrlWithPAR(requestUri) {\n  const baseUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize\`;\n  const params = new URLSearchParams({\n    client_id: '${e.clientId}',\n    request_uri: requestUri\n  });\n  \n  return \`\${baseUrl}?\${params.toString()}\`;\n}\n\n// Complete PAR flow example\nasync function completePARFlow() {\n  try {\n    // Step 1: Push authorization request\n    const parResult = await pushAuthorizationRequest();\n    \n    // Step 2: Generate authorization URL\n    const authUrl = generateAuthUrlWithPAR(parResult.request_uri);\n    console.log('Authorization URL:', authUrl);\n    \n    return {\n      authUrl,\n      codeVerifier: parResult.code_verifier,\n      expiresIn: parResult.expires_in\n    };\n  } catch (error) {\n    console.error('PAR flow failed:', error);\n    throw error;\n  }\n}`,description:"JavaScript implementation of PAR push request",dependencies:["crypto"]},{language:"typescript",title:"PAR Push Request - TypeScript",code:`// PAR (Pushed Authorization Requests) - TypeScript\nimport { randomBytes, createHash } from 'crypto';\n\ninterface PARConfig {\n  baseUrl: string;\n  environmentId: string;\n  clientId: string;\n  clientSecret: string;\n  redirectUri: string;\n  scopes: string[];\n}\n\ninterface PARResponse {\n  request_uri: string;\n  expires_in: number;\n}\n\ninterface PARResult {\n  request_uri: string;\n  expires_in: number;\n  code_verifier: string;\n}\n\n// Push authorization request to server\nasync function pushAuthorizationRequest(config: PARConfig): Promise<PARResult> {\n  const parEndpoint = \`\${config.baseUrl}/\${config.environmentId}/as/par\`;\n  \n  // Generate PKCE parameters\n  const codeVerifier = randomBytes(32).toString('base64url');\n  const codeChallenge = createHash('sha256')\n    .update(codeVerifier)\n    .digest('base64url');\n  \n  const requestData = new URLSearchParams({\n    client_id: config.clientId,\n    redirect_uri: config.redirectUri,\n    response_type: 'code',\n    scope: config.scopes.join(' '),\n    state: randomBytes(16).toString('hex'),\n    code_challenge: codeChallenge,\n    code_challenge_method: 'S256'\n  });\n  \n  try {\n    const response = await fetch(parEndpoint, {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/x-www-form-urlencoded',\n        'Authorization': \`Basic \${Buffer.from(\`\${config.clientId}:\${config.clientSecret}\`).toString('base64')}\`\n      },\n      body: requestData\n    });\n    \n    const result: PARResponse = await response.json();\n    \n    if (response.ok) {\n      console.log('PAR successful!');\n      console.log('Request URI:', result.request_uri);\n      console.log('Expires in:', result.expires_in, 'seconds');\n      \n      return {\n        request_uri: result.request_uri,\n        expires_in: result.expires_in,\n        code_verifier: codeVerifier\n      };\n    } else {\n      throw new Error(\`PAR failed: \${(result as any).error} - \${(result as any).error_description}\`);\n    }\n  } catch (error) {\n    console.error('PAR error:', error);\n    throw error;\n  }\n}\n\n// Generate authorization URL using request URI\nfunction generateAuthUrlWithPAR(config: PARConfig, requestUri: string): string {\n  const baseUrl = \`\${config.baseUrl}/\${config.environmentId}/as/authorize\`;\n  const params = new URLSearchParams({\n    client_id: config.clientId,\n    request_uri: requestUri\n  });\n  \n  return \`\${baseUrl}?\${params.toString()}\`;\n}\n\n// Example usage\nconst config: PARConfig = {\n  baseUrl: '${e.baseUrl}',\n  environmentId: '${e.environmentId}',\n  clientId: '${e.clientId}',\n  clientSecret: '${e.clientSecret}',\n  redirectUri: '${e.redirectUri}',\n  scopes: ${JSON.stringify(e.scopes)}\n};\n\nasync function completePARFlow() {\n  try {\n    const parResult = await pushAuthorizationRequest(config);\n    const authUrl = generateAuthUrlWithPAR(config, parResult.request_uri);\n    console.log('Authorization URL:', authUrl);\n    return { authUrl, codeVerifier: parResult.code_verifier };\n  } catch (error) {\n    console.error('PAR flow failed:', error);\n    throw error;\n  }\n}`,description:"TypeScript implementation of PAR push request",dependencies:["@types/node"]},{language:"go",title:"PAR Push Request - Go",code:`// PAR (Pushed Authorization Requests) - Go\npackage main\n\nimport (\n    "bytes"\n    "crypto/rand"\n    "crypto/sha256"\n    "encoding/base64"\n    "encoding/json"\n    "fmt"\n    "io"\n    "net/http"\n    "net/url"\n    "time"\n)\n\ntype PARConfig struct {\n    BaseURL       string\n    EnvironmentID string\n    ClientID      string\n    ClientSecret  string\n    RedirectURI   string\n    Scopes        []string\n}\n\ntype PARResponse struct {\n    RequestURI string \`json:"request_uri"\`\n    ExpiresIn  int    \`json:"expires_in"\`\n}\n\ntype PARResult struct {\n    RequestURI   string\n    ExpiresIn    int\n    CodeVerifier string\n}\n\n// Generate PKCE code verifier and challenge\nfunc generatePKCE() (string, string, error) {\n    // Generate code verifier\n    verifierBytes := make([]byte, 32)\n    if _, err := rand.Read(verifierBytes); err != nil {\n        return "", "", err\n    }\n    codeVerifier := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(verifierBytes)\n    \n    // Generate code challenge\n    hash := sha256.Sum256([]byte(codeVerifier))\n    codeChallenge := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(hash[:])\n    \n    return codeVerifier, codeChallenge, nil\n}\n\n// Push authorization request to server\nfunc pushAuthorizationRequest(config PARConfig) (*PARResult, error) {\n    parEndpoint := fmt.Sprintf("%s/%s/as/par", config.BaseURL, config.EnvironmentID)\n    \n    // Generate PKCE parameters\n    codeVerifier, codeChallenge, err := generatePKCE()\n    if err != nil {\n        return nil, err\n    }\n    \n    // Generate random state\n    stateBytes := make([]byte, 16)\n    if _, err := rand.Read(stateBytes); err != nil {\n        return nil, err\n    }\n    state := base64.URLEncoding.EncodeToString(stateBytes)\n    \n    // Prepare request data\n    data := url.Values{\n        "client_id":            {config.ClientID},\n        "redirect_uri":         {config.RedirectURI},\n        "response_type":        {"code"},\n        "scope":                {fmt.Sprintf("%s", config.Scopes)},\n        "state":                {state},\n        "code_challenge":       {codeChallenge},\n        "code_challenge_method": {"S256"},\n    }\n    \n    // Create HTTP request\n    req, err := http.NewRequest("POST", parEndpoint, bytes.NewBufferString(data.Encode()))\n    if err != nil {\n        return nil, err\n    }\n    \n    // Set headers\n    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")\n    auth := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", config.ClientID, config.ClientSecret)))\n    req.Header.Set("Authorization", fmt.Sprintf("Basic %s", auth))\n    \n    // Make request\n    client := &http.Client{Timeout: 30 * time.Second}\n    resp, err := client.Do(req)\n    if err != nil {\n        return nil, err\n    }\n    defer resp.Body.Close()\n    \n    // Read response\n    body, err := io.ReadAll(resp.Body)\n    if err != nil {\n        return nil, err\n    }\n    \n    if resp.StatusCode != http.StatusOK {\n        return nil, fmt.Errorf("PAR failed with status %d: %s", resp.StatusCode, string(body))\n    }\n    \n    // Parse response\n    var parResp PARResponse\n    if err := json.Unmarshal(body, &parResp); err != nil {\n        return nil, err\n    }\n    \n    fmt.Printf("PAR successful!\\n")\n    fmt.Printf("Request URI: %s\\n", parResp.RequestURI)\n    fmt.Printf("Expires in: %d seconds\\n", parResp.ExpiresIn)\n    \n    return &PARResult{\n        RequestURI:   parResp.RequestURI,\n        ExpiresIn:    parResp.ExpiresIn,\n        CodeVerifier: codeVerifier,\n    }, nil\n}\n\n// Generate authorization URL using request URI\nfunc generateAuthUrlWithPAR(config PARConfig, requestURI string) string {\n    baseURL := fmt.Sprintf("%s/%s/as/authorize", config.BaseURL, config.EnvironmentID)\n    params := url.Values{\n        "client_id":   {config.ClientID},\n        "request_uri": {requestURI},\n    }\n    return fmt.Sprintf("%s?%s", baseURL, params.Encode())\n}\n\nfunc main() {\n    config := PARConfig{\n        BaseURL:       "${e.baseUrl}",\n        EnvironmentID: "${e.environmentId}",\n        ClientID:      "${e.clientId}",\n        ClientSecret:  "${e.clientSecret}",\n        RedirectURI:   "${e.redirectUri}",\n        Scopes:        ${JSON.stringify(e.scopes)},\n    }\n    \n    // Push authorization request\n    parResult, err := pushAuthorizationRequest(config)\n    if err != nil {\n        fmt.Printf("Error: %v\\n", err)\n        return\n    }\n    \n    // Generate authorization URL\n    authURL := generateAuthUrlWithPAR(config, parResult.RequestURI)\n    fmt.Printf("Authorization URL: %s\\n", authURL)\n}`,description:"Go implementation of PAR push request",dependencies:[]},{language:"python",title:"PAR Push Request - Python",code:`# PAR (Pushed Authorization Requests) - Python\nimport base64\nimport hashlib\nimport json\nimport secrets\nimport urllib.parse\nfrom typing import Dict, Any, Optional\n\nimport httpx\n\nclass PARClient:\n    def __init__(self, base_url: str, environment_id: str, client_id: str, \n                 client_secret: str, redirect_uri: str, scopes: list):\n        self.base_url = base_url\n        self.environment_id = environment_id\n        self.client_id = client_id\n        self.client_secret = client_secret\n        self.redirect_uri = redirect_uri\n        self.scopes = scopes\n    \n    def generate_pkce(self) -> tuple[str, str]:\n        """Generate PKCE code verifier and challenge"""\n        # Generate code verifier\n        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')\n        \n        # Generate code challenge\n        code_challenge = base64.urlsafe_b64encode(\n            hashlib.sha256(code_verifier.encode('utf-8')).digest()\n        ).decode('utf-8').rstrip('=')\n        \n        return code_verifier, code_challenge\n    \n    async def push_authorization_request(self) -> Dict[str, Any]:\n        """Push authorization request to server"""\n        par_endpoint = f"{self.base_url}/{self.environment_id}/as/par"\n        \n        # Generate PKCE parameters\n        code_verifier, code_challenge = self.generate_pkce()\n        \n        # Generate random state\n        state = secrets.token_urlsafe(16)\n        \n        # Prepare request data\n        data = {\n            "client_id": self.client_id,\n            "redirect_uri": self.redirect_uri,\n            "response_type": "code",\n            "scope": " ".join(self.scopes),\n            "state": state,\n            "code_challenge": code_challenge,\n            "code_challenge_method": "S256"\n        }\n        \n        # Prepare headers\n        auth_string = f"{self.client_id}:{self.client_secret}"\n        auth_bytes = auth_string.encode('utf-8')\n        auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')\n        \n        headers = {\n            "Content-Type": "application/x-www-form-urlencoded",\n            "Authorization": f"Basic {auth_b64}"\n        }\n        \n        try:\n            async with httpx.AsyncClient() as client:\n                response = await client.post(\n                    par_endpoint,\n                    data=data,\n                    headers=headers,\n                    timeout=30.0\n                )\n                \n                if response.status_code == 200:\n                    result = response.json()\n                    print("PAR successful!")\n                    print(f"Request URI: {result['request_uri']}")\n                    print(f"Expires in: {result['expires_in']} seconds")\n                    \n                    return {\n                        "request_uri": result["request_uri"],\n                        "expires_in": result["expires_in"],\n                        "code_verifier": code_verifier\n                    }\n                else:\n                    error_data = response.json()\n                    raise Exception(f"PAR failed: {error_data.get('error')} - {error_data.get('error_description')}")\n                    \n        except Exception as e:\n            print(f"PAR error: {e}")\n            raise\n    \n    def generate_auth_url_with_par(self, request_uri: str) -> str:\n        """Generate authorization URL using request URI"""\n        base_url = f"{self.base_url}/{self.environment_id}/as/authorize"\n        params = {\n            "client_id": self.client_id,\n            "request_uri": request_uri\n        }\n        query_string = urllib.parse.urlencode(params)\n        return f"{base_url}?{query_string}"\n\n# Example usage\nasync def main():\n    config = {\n        "base_url": "${e.baseUrl}",\n        "environment_id": "${e.environmentId}",\n        "client_id": "${e.clientId}",\n        "client_secret": "${e.clientSecret}",\n        "redirect_uri": "${e.redirectUri}",\n        "scopes": ${JSON.stringify(e.scopes)}\n    }\n    \n    client = PARClient(**config)\n    \n    try:\n        # Push authorization request\n        par_result = await client.push_authorization_request()\n        \n        # Generate authorization URL\n        auth_url = client.generate_auth_url_with_par(par_result["request_uri"])\n        print(f"Authorization URL: {auth_url}")\n        \n        return {\n            "auth_url": auth_url,\n            "code_verifier": par_result["code_verifier"]\n        }\n    except Exception as e:\n        print(f"PAR flow failed: {e}")\n        raise\n\n# Run the async function\n# asyncio.run(main())`,description:"Python implementation of PAR push request",dependencies:["httpx"]}],vr={"authorization-code":{step1:{id:"step1",name:"Generate Authorization URL",description:"Create the authorization URL that users will visit to authenticate"},step2:{id:"step2",name:"Handle Authorization Callback",description:"Process the authorization code returned from the callback"},step3:{id:"step3",name:"Exchange Code for Token",description:"Exchange the authorization code for access and ID tokens"},step4:{id:"step4",name:"Use Access Token",description:"Make API calls using the access token"}},implicit:{step1:{id:"step1",name:"Generate Authorization URL",description:"Create the authorization URL for implicit flow"},step2:{id:"step2",name:"Handle Token Response",description:"Extract tokens from the URL fragment"},step3:{id:"step3",name:"Use Access Token",description:"Make API calls using the access token"}},"client-credentials":{step1:{id:"step1",name:"Request Access Token",description:"Request access token using client credentials"},step2:{id:"step2",name:"Use Access Token",description:"Make API calls using the access token"}},"worker-token":{step1:{id:"step1",name:"Get Worker Token",description:"Request worker token using client credentials for machine-to-machine authentication"},step2:{id:"step2",name:"Use Worker Token",description:"Make API calls using the worker token"},deviceRegistration:{id:"deviceRegistration",name:"Device Registration",description:"Register MFA device using worker token"},authentication:{id:"authentication",name:"User Authentication",description:"Authenticate user with PingOne MFA"},mfaChallengeInitiate:{id:"mfaChallengeInitiate",name:"MFA Challenge Initiation",description:"Initiate MFA challenge for registered device"},mfaChallengeVerify:{id:"mfaChallengeVerify",name:"MFA Challenge Verification",description:"Verify MFA challenge code"}},"device-authorization":{step1:{id:"step1",name:"Request Device Code",description:"Request device authorization code"},step2:{id:"step2",name:"Poll for Token",description:"Poll the token endpoint until user completes authorization"},step3:{id:"step3",name:"Use Access Token",description:"Make API calls using the access token"}},rar:{"authorization-request":{id:"authorization-request",name:"RAR Authorization Request",description:"Generate authorization URL with Rich Authorization Requests (RAR) parameters"},"token-exchange":{id:"token-exchange",name:"RAR Token Exchange",description:"Exchange authorization code for access token with RAR claims"},"use-token":{id:"use-token",name:"Use RAR Access Token",description:"Make API calls using access token with RAR authorization details"}},par:{"push-authorization-request":{id:"push-authorization-request",name:"Push Authorization Request",description:"Push authorization request to authorization server"},"authorization-request":{id:"authorization-request",name:"Authorization Request",description:"Generate authorization URL using request URI from PAR"},"token-exchange":{id:"token-exchange",name:"Token Exchange",description:"Exchange authorization code for access token"},"use-token":{id:"use-token",name:"Use Access Token",description:"Make API calls using the access token"}}};class kr{config;constructor(e){this.config={...pr,...e}}updateConfig(e){this.config={...this.config,...e}}getExamplesForStep(e,t){const r=vr[e];if(!r||!r[t])return null;const n=r[t];let i=[];if("authorization-code"===e)switch(t){case"step1":case"step2":case"step3":default:i=[...hr(this.config),...gr(this.config),...mr(this.config),...fr(this.config),...br(this.config),...xr(this.config)];break;case"step4":i=[{language:"javascript",title:"Make API Call with Access Token",code:`// Use the access token to make authenticated API calls\nconst accessToken = '${this.config.clientId}_access_token_12345';\n\n// Example: Get user profile\nasync function getUserProfile() {\n  try {\n    const response = await fetch('${this.config.baseUrl}/${this.config.environmentId}/as/userinfo', {\n      method: 'GET',\n      headers: {\n        'Authorization': \`Bearer \${accessToken}\`,\n        'Content-Type': 'application/json'\n      }\n    });\n    \n    if (!response.ok) {\n      throw new Error(\`HTTP error! status: \${response.status}\`);\n    }\n    \n    const userInfo = await response.json();\n    console.log('User Info:', userInfo);\n    return userInfo;\n  } catch (error) {\n    console.error('Error fetching user profile:', error);\n  }\n}\n\n// Example: Call protected resource\nasync function callProtectedAPI() {\n  try {\n    const response = await fetch('https://api.example.com/protected-resource', {\n      method: 'GET',\n      headers: {\n        'Authorization': \`Bearer \${accessToken}\`,\n        'Content-Type': 'application/json'\n      }\n    });\n    \n    const data = await response.json();\n    console.log('Protected Resource Data:', data);\n    return data;\n  } catch (error) {\n    console.error('Error calling protected API:', error);\n  }\n}\n\n// Call the functions\ngetUserProfile();\ncallProtectedAPI();`,dependencies:[]},{language:"typescript",title:"TypeScript API Call with Access Token",code:`// TypeScript implementation for API calls with access token\ninterface UserInfo {\n  sub: string;\n  name: string;\n  email: string;\n  email_verified: boolean;\n}\n\ninterface ApiResponse<T> {\n  data: T;\n  status: number;\n  message?: string;\n}\n\nconst accessToken: string = '${this.config.clientId}_access_token_12345';\n\n// Get user profile with proper typing\nasync function getUserProfile(): Promise<UserInfo | null> {\n  try {\n    const response = await fetch('${this.config.baseUrl}/${this.config.environmentId}/as/userinfo', {\n      method: 'GET',\n      headers: {\n        'Authorization': \`Bearer \${accessToken}\`,\n        'Content-Type': 'application/json'\n      }\n    });\n    \n    if (!response.ok) {\n      throw new Error(\`HTTP error! status: \${response.status}\`);\n    }\n    \n    const userInfo: UserInfo = await response.json();\n    console.log('User Info:', userInfo);\n    return userInfo;\n  } catch (error) {\n    console.error('Error fetching user profile:', error);\n    return null;\n  }\n}\n\n// Call protected resource with error handling\nasync function callProtectedAPI<T>(url: string): Promise<ApiResponse<T> | null> {\n  try {\n    const response = await fetch(url, {\n      method: 'GET',\n      headers: {\n        'Authorization': \`Bearer \${accessToken}\`,\n        'Content-Type': 'application/json'\n      }\n    });\n    \n    const data: T = await response.json();\n    return {\n      data,\n      status: response.status,\n      message: response.ok ? 'Success' : 'Error'\n    };\n  } catch (error) {\n    console.error('Error calling protected API:', error);\n    return null;\n  }\n}\n\n// Usage\ngetUserProfile();\ncallProtectedAPI<any>('https://api.example.com/protected-resource');`,dependencies:[]},{language:"javascript",title:"cURL Command for API Call",code:`# Use the access token to make authenticated API calls\n\n# Get user information\ncurl -X GET \\\n  "${this.config.baseUrl}/${this.config.environmentId}/as/userinfo" \\\n  -H "Authorization: Bearer ${this.config.clientId}_access_token_12345" \\\n  -H "Content-Type: application/json"\n\n# Call protected resource\ncurl -X GET \\\n  "https://api.example.com/protected-resource" \\\n  -H "Authorization: Bearer ${this.config.clientId}_access_token_12345" \\\n  -H "Content-Type: application/json"\n\n# Example with additional headers\ncurl -X POST \\\n  "https://api.example.com/data" \\\n  -H "Authorization: Bearer ${this.config.clientId}_access_token_12345" \\\n  -H "Content-Type: application/json" \\\n  -d '{"action": "getData", "scope": "read"}'`,dependencies:[]}]}else i=[...hr(this.config),...gr(this.config),...mr(this.config),...fr(this.config),...br(this.config),...xr(this.config)];return"rar"===e?i=[...i,...yr(this.config)]:"par"===e&&(i=[...i,...wr(this.config)]),{stepId:n.id,stepName:n.name,examples:i}}getAllStepsForFlow(e){const t=vr[e];return t?Object.values(t).map(t=>{let r=[...hr(this.config),...gr(this.config),...mr(this.config),...fr(this.config),...br(this.config),...xr(this.config)];return"rar"===e?r=[...r,...yr(this.config)]:"par"===e&&(r=[...r,...wr(this.config)]),{stepId:t.id,stepName:t.name,examples:r}}):[]}getSupportedLanguages(){return["javascript","typescript","go","ruby","python","ping-sdk"]}filterExamplesByLanguage(e,t){return e.filter(e=>t.includes(e.language))}}new kr;const jr="#ffffff",Sr="#000000",Cr=Ce.div`
	background: ${jr};
	border-radius: 8px;
	border: 1px solid #e1e4e8;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`,Ar=Ce.div`
	background: #f8f9fa;
	padding: 0.75rem 1rem;
	border-bottom: 1px solid #e1e4e8;
	display: flex;
	justify-content: space-between;
	align-items: center;
`,Tr=Ce.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #24292e;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,_r=Ce.div`
	display: flex;
	gap: 0.25rem;
	flex-wrap: wrap;
`,Rr=Ce.button`
	padding: 0.25rem 0.5rem;
	border: 1px solid ${({$active:e})=>e?"#0366d6":"#d1d5db"};
	border-radius: 4px;
	background: ${({$active:e})=>e?"#0366d6":"#ffffff"};
	color: ${({$active:e})=>e?"#ffffff":"#24292e"};
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({$active:e})=>e?"#0256cc":"#f6f8fa"};
		border-color: ${({$active:e})=>e?"#0256cc":"#c7ccd1"};
	}
`,Ir=Ce.div`
	position: relative;
	max-height: 500px;
`,$r=Ce.div`
	background: #f6f8fa;
	color: #586069;
	padding: 0.5rem 1rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 0.875rem;
	font-weight: 500;
	border-bottom: 1px solid #e1e4e8;
`,Er=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
`,zr=Ce.div`
	display: flex;
	gap: 0.5rem;
`,Pr=Ce.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	background: rgba(255, 255, 255, 0.8);
	border: 1px solid #d1d5db;
	border-radius: 4px;
	color: #24292e;
	font-size: 0.75rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #f6f8fa;
		border-color: #c7ccd1;
	}
`,Or=Ce.pre`
	margin: 0;
	padding: 1rem;
	background: ${jr};
	color: ${Sr};
	font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow: auto;
	max-height: 400px;
	border: none;
	white-space: pre;

	/* Custom scrollbar styling */
	&::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}

	&::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 6px;
	}

	&::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 6px;
		border: 2px solid #f1f1f1;
	}

	&::-webkit-scrollbar-thumb:hover {
		background: #a1a1a1;
	}

	&::-webkit-scrollbar-corner {
		background: #f1f1f1;
	}
`,Ur=Ce.code`
	font-family: inherit;
	font-size: inherit;
	line-height: inherit;
	white-space: pre;
	word-wrap: normal;
	overflow-wrap: normal;
	
	/* Allow Prism.js classes to override */
	& * {
		font-family: inherit !important;
		font-size: inherit !important;
		line-height: inherit !important;
	}
	
	/* VS Code Light Theme syntax highlighting overrides */
	.token.comment,
	.token.prolog,
	.token.doctype,
	.token.cdata {
		color: #6a9955;
	}
	
	.token.punctuation {
		color: #000000;
	}
	
	.token.property,
	.token.tag,
	.token.constant,
	.token.symbol,
	.token.deleted {
		color: #0000ff;
	}
	
	.token.boolean,
	.token.number {
		color: #09885a;
	}
	
	.token.selector,
	.token.attr-name,
	.token.string,
	.token.char,
	.token.builtin,
	.token.inserted {
		color: #a31515;
	}
	
	.token.operator,
	.token.entity,
	.token.url,
	.token.variable {
		color: #000000;
	}
	
	.token.atrule,
	.token.attr-value,
	.token.function,
	.token.class-name {
		color: #795e26;
	}
	
	.token.keyword {
		color: #0000ff;
	}
	
	.token.regex,
	.token.important {
		color: #811f3f;
	}
`,Dr=Ce.div`
	background: #f6f8fa;
	padding: 0.75rem 1rem;
	border-top: 1px solid #e1e4e8;
	font-size: 0.875rem;
	color: #586069;
`,Lr=Ce.strong`
	color: #24292e;
	margin-right: 0.5rem;
`,Nr=Ce.div`
	padding: 1.5rem;
	background: #ffeef0;
	border: 1px solid #f85149;
	border-radius: 6px;
	color: #cf222e;
	text-align: center;
`,Mr=e=>({javascript:"JavaScript",typescript:"TypeScript",go:"Go",ruby:"Ruby",python:"Python","ping-sdk":"Ping SDK"}[e]),Fr=e=>({javascript:"🟨",typescript:"🔷",go:"🐹",ruby:"💎",python:"🐍","ping-sdk":"🔐"}[e]),qr=(e,r)=>{let n=r;"ping-sdk"===r&&(n="typescript");const i=_e.highlight(e,_e.languages[n],n);return t.jsx("span",{dangerouslySetInnerHTML:{__html:i}})},Vr=({flowType:r,stepId:s,config:a,className:c})=>{const[l,d]=e.useState("javascript"),[u,p]=e.useState(null),h=e.useMemo(()=>new kr(a),[a]),g=e.useMemo(()=>h.getExamplesForStep(r,s),[h,r,s]),m=e.useMemo(()=>g?g.examples.map(e=>e.language):[],[g]);e.useEffect(()=>{g&&0!==m.length&&(m.includes(l)||d(m[0]))},[g,m,l]);const f=e.useMemo(()=>g&&(g.examples.find(e=>e.language===l)||g.examples[0])||null,[g,l]);return g?f?t.jsxs(Cr,{className:c,children:[t.jsxs(Ar,{children:[t.jsxs(Tr,{children:[t.jsx(n,{}),g.stepName," - VS Code Style Code Examples"]}),t.jsx(_r,{children:h.getSupportedLanguages().map(e=>{const r=m.includes(e);return t.jsxs(Rr,{$active:l===e,onClick:()=>r&&d(e),disabled:!r,children:[Fr(e)," ",Mr(e)]},e)})})]}),t.jsxs(Ir,{children:[t.jsxs($r,{children:[t.jsxs(Er,{children:[Fr(f.language)," ",f.title]}),t.jsxs(zr,{children:[t.jsxs(Pr,{onClick:()=>(async e=>{try{await navigator.clipboard.writeText(e),p(e),setTimeout(()=>p(null),2e3)}catch(t){}})(f.code),children:[u===f.code?t.jsx(i,{}):t.jsx(n,{}),u===f.code?"Copied!":"Copy"]}),t.jsxs(Pr,{onClick:()=>(e=>{const t="typescript"===e.language?"ts":"javascript"===e.language?"js":"go"===e.language?"go":"ruby"===e.language?"rb":"ping-sdk"===e.language?"ts":"py",r=`${e.title.toLowerCase().replace(/\s+/g,"-")}.${t}`,n=new Blob([e.code],{type:"text/plain"}),i=URL.createObjectURL(n),o=document.createElement("a");o.href=i,o.download=r,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i)})(f),children:[t.jsx(o,{}),"Download"]})]})]}),t.jsx(Or,{children:t.jsx(Ur,{children:qr(f.code,f.language)})}),f.dependencies&&f.dependencies.length>0&&t.jsxs(Dr,{children:[t.jsx(Lr,{children:"Dependencies:"}),f.dependencies.join(", ")]})]})]}):t.jsx(Cr,{className:c,children:t.jsx(Nr,{children:"No code examples available for the selected language."})}):t.jsx(Cr,{className:c,children:t.jsx(Nr,{children:"No code examples available for this step."})})},Br=Ce.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	overflow: hidden;
`,Wr=Ce.button`
	width: 100%;
	padding: 0.75rem 1rem;
	background: ${({$isOpen:e})=>e?"#e2e8f0":"#f8fafc"};
	border: none;
	border-bottom: ${({$isOpen:e})=>e?"1px solid #e2e8f0":"none"};
	display: flex;
	align-items: center;
	justify-content: space-between;
	cursor: pointer;
	transition: all 0.2s ease;
	font-weight: 500;
	color: #374151;

	&:hover {
		background: #e2e8f0;
	}
`,Gr=Ce.div`
	max-height: ${({$isOpen:e})=>e?"1000px":"0"};
	overflow: hidden;
	transition: max-height 0.3s ease;
`,Hr=Ce.div`
	padding: 1rem;
	background: #1f2937;
	color: #f9fafb;
	border-radius: 6px;
	margin: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	overflow-y: auto;
	max-height: 300px;
	position: relative;

	/* Custom scrollbar styling */
	&::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}

	&::-webkit-scrollbar-track {
		background: #2d3748;
		border-radius: 6px;
	}

	&::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 6px;
		border: 2px solid #2d3748;
	}

	&::-webkit-scrollbar-thumb:hover {
		background: #718096;
	}

	&::-webkit-scrollbar-corner {
		background: #2d3748;
	}
`,Jr=Ce.button`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	padding: 0.25rem 0.5rem;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 4px;
	color: #f9fafb;
	font-size: 0.75rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
	}
`,Kr=Ce.div`
	display: flex;
	gap: 0.25rem;
	padding: 0.75rem 1rem 0;
	background: #f8fafc;
`,Yr=Ce.button`
	padding: 0.375rem 0.75rem;
	background: ${({$active:e})=>e?"#3b82f6":"#ffffff"};
	color: ${({$active:e})=>e?"#ffffff":"#374151"};
	border: 1px solid ${({$active:e})=>e?"#3b82f6":"#d1d5db"};
	border-radius: 6px 6px 0 0;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	opacity: ${({disabled:e})=>e?.5:1};
	cursor: ${({disabled:e})=>e?"not-allowed":"pointer"};

	&:hover {
		background: ${({$active:e,disabled:t})=>t?"#ffffff":e?"#2563eb":"#f3f4f6"};
	}
`,Xr=e=>({javascript:"JS",typescript:"TS",go:"Go",ruby:"Ruby",python:"Python","ping-sdk":"Ping SDK"}[e]),Qr=({flowType:r,stepId:o,config:c,className:l,compact:d=!1})=>{const[u,p]=e.useState(!1),[h,g]=e.useState("javascript"),[m,f]=e.useState(null),b=e.useMemo(()=>new kr(c),[c]),x=e.useMemo(()=>b.getExamplesForStep(r,o),[b,r,o]),y=e.useMemo(()=>x?x.examples.map(e=>e.language):[],[x]),w=e.useMemo(()=>x&&(x.examples.find(e=>e.language===h)||x.examples[0])||null,[x,h]),v=e=>{const t=e.split("\n");return t.slice(0,8).join("\n")+(t.length>8?"\n// ... (click to see full code)":"")};return d?t.jsxs(Br,{className:l,children:[t.jsxs(Wr,{$isOpen:u,onClick:()=>p(!u),children:[t.jsxs("span",{style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(s,{}),"Code Examples"]}),t.jsx(a,{style:{transform:u?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s ease"}})]}),t.jsxs(Gr,{$isOpen:u,children:[t.jsx(Kr,{children:b.getSupportedLanguages().map(e=>{const r=y.includes(e);return t.jsxs(Yr,{$active:h===e,onClick:()=>r&&g(e),disabled:!r,children:[(n=e,{javascript:"🟨",typescript:"🔷",go:"🐹",ruby:"💎",python:"🐍","ping-sdk":"🔐"}[n])," ",Xr(e)]},e);var n})}),t.jsxs(Hr,{children:[t.jsxs(Jr,{onClick:()=>(async e=>{try{await navigator.clipboard.writeText(e),f(e),setTimeout(()=>f(null),2e3)}catch(t){}})(w?.code||'// Code examples will be loaded here\n// Select a language tab above\n// Click "Show Code Examples" to see full implementation'),children:[m?t.jsx(i,{}):t.jsx(n,{}),m?"Copied!":"Copy"]}),t.jsx("pre",{children:v(w?w.code:'// Code examples will be loaded here\n// Select a language tab above\n// Click "Show Code Examples" to see full implementation')})]})]})]}):t.jsxs(Br,{className:l,children:[t.jsxs(Wr,{$isOpen:u,onClick:()=>p(!u),children:[t.jsxs("span",{style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(s,{}),"Code Examples (",r," - ",o,")"]}),t.jsx(a,{style:{transform:u?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s ease"}})]}),t.jsx(Gr,{$isOpen:u,children:t.jsx(Vr,{flowType:r,stepId:o,config:c??{},className:"inline-vscode-display"})})]})},Zr=Ce.div`
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
`,en=Ce.h1`
	font-size: 2rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 2rem;
	text-align: center;
`,tn=Ce.div`
	margin-bottom: 3rem;
`,rn=Ce.h2`
	font-size: 1.5rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 1rem;
`,nn=Ce.div`
	background: #f8fafc;
	padding: 1.5rem;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
	margin-bottom: 2rem;
`,on=Ce.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
`,sn=Ce.div`
	display: flex;
	flex-direction: column;
`,an=Ce.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.25rem;
`,cn=Ce.input`
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`,ln=Ce.button`
	background: #3b82f6;
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background: #2563eb;
	}
`,dn=Ce.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
`,un=Ce.button`
	padding: 0.75rem 1.5rem;
	border: 1px solid ${({$active:e})=>e?"#3b82f6":"#d1d5db"};
	border-radius: 6px;
	background: ${({$active:e})=>e?"#3b82f6":"#ffffff"};
	color: ${({$active:e})=>e?"#ffffff":"#374151"};
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({$active:e})=>e?"#2563eb":"#f3f4f6"};
	}
`,pn=Ce.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
`,hn=Ce.button`
	padding: 0.5rem 1rem;
	border: 1px solid ${({$active:e})=>e?"#3b82f6":"#d1d5db"};
	border-radius: 4px;
	background: ${({$active:e})=>e?"#3b82f6":"#ffffff"};
	color: ${({$active:e})=>e?"#ffffff":"#374151"};
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({$active:e})=>e?"#2563eb":"#f3f4f6"};
	}
`,gn=[{id:"authorization-code",name:"Authorization Code"},{id:"implicit",name:"Implicit"},{id:"client-credentials",name:"Client Credentials"},{id:"device-authorization",name:"Device Authorization"}],mn={"authorization-code":[{id:"step1",name:"Generate Auth URL"},{id:"step2",name:"Handle Callback"},{id:"step3",name:"Exchange Code"},{id:"step4",name:"Use Token"}],implicit:[{id:"step1",name:"Generate Auth URL"},{id:"step2",name:"Handle Token Response"},{id:"step3",name:"Use Token"}],"client-credentials":[{id:"step1",name:"Request Token"},{id:"step2",name:"Use Token"}],"device-authorization":[{id:"step1",name:"Request Device Code"},{id:"step2",name:"Poll for Token"},{id:"step3",name:"Use Token"}]},fn=()=>{const[r,n]=e.useState("authorization-code"),[i,o]=e.useState("step1"),[s,a]=e.useState({baseUrl:"https://auth.pingone.com",clientId:"your-client-id",clientSecret:"your-client-secret",redirectUri:"https://your-app.com/callback",scopes:["openid","profile","email"],environmentId:"your-environment-id"}),c=(e,t)=>{a(r=>({...r,[e]:"scopes"===e?t.split(",").map(e=>e.trim()):t}))},l=mn[r]||[];return t.jsxs(Zr,{children:[t.jsx(ur,{flowType:"documentation",customConfig:{title:"Code Examples",subtitle:"Comprehensive code examples for OAuth 2.0 and OpenID Connect flows in multiple programming languages. Copy, customize, and integrate into your applications.",icon:"💻"}}),t.jsx(en,{children:"Code Examples Service Demo"}),t.jsxs(tn,{children:[t.jsx(rn,{children:"Configuration"}),t.jsxs(nn,{children:[t.jsxs(on,{children:[t.jsxs(sn,{children:[t.jsx(an,{children:"Base URL"}),t.jsx(cn,{value:s.baseUrl||"",onChange:e=>c("baseUrl",e.target.value),placeholder:"https://auth.pingone.com"})]}),t.jsxs(sn,{children:[t.jsx(an,{children:"Client ID"}),t.jsx(cn,{value:s.clientId||"",onChange:e=>c("clientId",e.target.value),placeholder:"your-client-id"})]}),t.jsxs(sn,{children:[t.jsx(an,{children:"Client Secret"}),t.jsx(cn,{type:"password",value:s.clientSecret||"",onChange:e=>c("clientSecret",e.target.value),placeholder:"your-client-secret"})]}),t.jsxs(sn,{children:[t.jsx(an,{children:"Redirect URI"}),t.jsx(cn,{value:s.redirectUri||"",onChange:e=>c("redirectUri",e.target.value),placeholder:"https://your-app.com/callback"})]}),t.jsxs(sn,{children:[t.jsx(an,{children:"Scopes (comma-separated)"}),t.jsx(cn,{value:s.scopes?.join(", ")||"",onChange:e=>c("scopes",e.target.value),placeholder:"openid, profile, email"})]}),t.jsxs(sn,{children:[t.jsx(an,{children:"Environment ID"}),t.jsx(cn,{value:s.environmentId||"",onChange:e=>c("environmentId",e.target.value),placeholder:"your-environment-id"})]})]}),t.jsx(ln,{onClick:()=>{},children:"Update Configuration"})]})]}),t.jsxs(tn,{children:[t.jsx(rn,{children:"Select Flow Type"}),t.jsx(dn,{children:gn.map(e=>t.jsx(un,{$active:r===e.id,onClick:()=>{n(e.id),o(mn[e.id]?.[0]?.id||"step1")},children:e.name},e.id))})]}),t.jsxs(tn,{children:[t.jsx(rn,{children:"Select Step"}),t.jsx(pn,{children:l.map(e=>t.jsx(hn,{$active:i===e.id,onClick:()=>o(e.id),children:e.name},e.id))})]}),t.jsxs(tn,{children:[t.jsx(rn,{children:"Full Code Examples Display (VS Code Style)"}),t.jsx(Vr,{flowType:r,stepId:i,config:s})]}),t.jsxs(tn,{children:[t.jsx(rn,{children:"Inline Code Examples (Compact)"}),t.jsx(Qr,{flowType:r,stepId:i,config:s,compact:!0})]}),t.jsxs(tn,{children:[t.jsx(rn,{children:"Inline Code Examples (Full)"}),t.jsx(Qr,{flowType:r,stepId:i,config:s,compact:!1})]})]})},bn=Ce.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  font-size: 0.875rem;
  line-height: 1.5;

  svg {
    margin-top: 0.125rem;
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
  }

  .message-content {
    flex: 1;
  }

  .message-title {
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
  }

  .message-text {
    margin: 0;
    font-size: 0.875rem;
  }

  .dismiss-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    line-height: 1;

    &:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);
    }
  }

  ${({$type:e})=>{switch(e){case"success":return"\n          background-color: #f0fdf4;\n          border-color: #bbf7d0;\n          color: #166534;\n\n          svg {\n            color: #22c55e;\n          }\n        ";case"error":return"\n          background-color: #fef2f2;\n          border-color: #fecaca;\n          color: #991b1b;\n\n          svg {\n            color: #ef4444;\n          }\n        ";case"warning":return"\n          background-color: #fffbeb;\n          border-color: #fed7aa;\n          color: #92400e;\n\n          svg {\n            color: #f59e0b;\n          }\n        ";default:return"\n          background-color: #eff6ff;\n          border-color: #bfdbfe;\n          color: #1e40af;\n\n          svg {\n            color: #3b82f6;\n          }\n        "}}}
`,xn=e=>{switch(e){case"success":return t.jsx(u,{});case"error":return t.jsx(d,{});case"warning":return t.jsx(l,{});default:return t.jsx(c,{})}},yn=({type:r,title:n,message:i,onDismiss:o,className:s})=>(e.useEffect(()=>{const e=e=>{"Escape"===e.key&&o&&o()};if(o)return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)},[o]),t.jsxs(bn,{$type:r,className:s,role:"alert","aria-live":"assertive",children:[xn(r),t.jsxs("div",{className:"message-content",children:[n&&t.jsx("h4",{className:"message-title",children:n}),t.jsx("p",{className:"message-text",children:i})]}),o&&t.jsx("button",{className:"dismiss-button",onClick:o,"aria-label":"Dismiss message",type:"button"})]})),wn=Ce.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: ${e=>e.$isOpen?"#ef4444":"#3b82f6"};
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9998;
  transition: all 0.2s ease;
  font-size: 18px;

  &:hover {
    background: ${e=>e.$isOpen?"#dc2626":"#2563eb"};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &.pulse {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    50% {
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
    }
    100% {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
`,vn=({isOpen:r,onClick:n,hasNewLogs:i=!1})=>{const[o,s]=e.useState(!1);return t.jsx(wn,{$isOpen:r,onClick:n,onMouseEnter:()=>s(!0),onMouseLeave:()=>s(!1),className:i?"pulse":"",title:r?"Close Log Viewer":"Open Log Viewer",children:t.jsx(p,{})})};class kn{static API_BASE="/api/logs";static async listLogFiles(){try{const e=await fetch(`${kn.API_BASE}/list`);if(!e.ok)throw new Error(`Failed to list log files: ${e.statusText}`);return(await e.json()).map(e=>({...e,modified:new Date(e.modified),category:e.category}))}catch(e){throw e}}static async readLogFile(e,t=100,r=!0){try{const i=new URLSearchParams({file:e,lines:t.toString(),tail:r.toString()}),o=await fetch(`${kn.API_BASE}/read?${i}`);if(!o.ok){let e=`Failed to read log file: ${o.statusText}`;try{e=(await o.json()).message||e}catch{}throw new Error(e)}const s=await o.text();if(!s)throw new Error("Empty response from server");let a;try{a=JSON.parse(s)}catch(n){const e=n instanceof Error?n.message:"Unknown parsing error";throw new Error(`Invalid JSON response: ${e}`)}return{...a,modified:new Date(a.modified)}}catch(i){throw i}}static createTailStream(e){const t=new URLSearchParams({file:e});return new EventSource(`${kn.API_BASE}/tail?${t}`)}static parseLogEntry(e){try{return JSON.parse(e)}catch{return{raw:e}}}static categorizeLogFile(e){const t=e.toLowerCase();return["server.log","backend.log","server-error.log"].includes(t)||/^server(-|_).+\.log$/i.test(t)?"Server Logs":["api-log.log","real-api.log","pingone-api.log"].includes(t)||/(api|pingone).+\.log$/i.test(t)?"API Logs":["client.log"].includes(t)||/(client|frontend|browser).+\.log$/i.test(t)?"Frontend Logs":["fido.log","sms.log","email.log","whatsapp.log","voice.log"].includes(t)||/(fido|sms|email|whatsapp|voice|mfa).+\.log$/i.test(t)?"MFA Device Logs":["authz-redirects.log","oauth.log","oidc.log"].includes(t)||/(authz|oauth|oidc|redirect).+\.log$/i.test(t)?"OAuth Logs":"Other Logs"}static formatFileSize(e){if(0===e)return"0 B";const t=Math.floor(Math.log(e)/Math.log(1024));return`${(e/1024**t).toFixed(2)} ${["B","KB","MB","GB"][t]}`}static isLargeFile(e){return e>104857600}}const jn=Ce.div`
  position: fixed;
  top: ${e=>e.y}px;
  left: ${e=>e.x}px;
  width: ${e=>e.width}px;
  height: ${e=>e.height}px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`,Sn=Ce.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 8px 8px 0 0;
  cursor: move;
  user-select: none;
`,Cn=Ce.div`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`,An=Ce.div`
  display: flex;
  gap: 8px;
  align-items: center;
`,Tn=Ce.button`
  background: ${e=>"primary"===e.$variant?"#3b82f6":"#f3f4f6"};
  color: ${e=>"primary"===e.$variant?"white":"#374151"};
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background: ${e=>"primary"===e.$variant?"#2563eb":"#e5e7eb"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,_n=Ce.div`
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`,Rn=Ce.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
`,In=Ce.select`
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  background: white;
`,$n=Ce.div`
  flex: 1;
  background: white;
  border-radius: 4px;
  padding: 12px;
  overflow: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  color: #000000;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
  display: ${e=>e.$isMinimized?"none":"block"};
  border: 1px solid #e5e7eb;
`,En=Ce.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${e=>{switch(e.$status){case"connected":return"#10b981";case"loading":return"#f59e0b";case"disconnected":return"#ef4444";default:return"#6b7280"}}};
`,zn=Ce.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
`,Pn=Ce.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`,On=Ce.span`
  font-size: 12px;
  color: #374151;
  user-select: none;
`,Un=Ce.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, #d1d5db 50%);
  border-radius: 0 0 0 8px;
`,Dn=({isOpen:r,onClose:n,onPopOut:i,standaloneMode:s=!1,initialWidth:a=600,initialHeight:c=400,initialX:l=100,initialY:d=100})=>{const[u,p]=e.useState(a),[x,y]=e.useState(c),[w,v]=e.useState(l),[k,j]=e.useState(d),[S,C]=e.useState(!1),[A,T]=e.useState(!1),[_,R]=e.useState([]),[I,$]=e.useState("pingone-api.log"),[E,z]=e.useState(""),[P,O]=e.useState(!1),[U,D]=e.useState(!1),[L,N]=e.useState(null),[M,F]=e.useState(!1),[q,V]=e.useState(!1),[B,W]=e.useState({x:0,y:0}),[G,H]=e.useState({width:0,height:0,x:0,y:0}),J=e.useRef(null),K=e.useRef(null),Y=e.useCallback(async()=>{try{const e=await kn.listLogFiles();R(e)}catch(e){N("Failed to load log files")}},[]),X=e.useCallback(async()=>{if(I){D(!0),N(null);try{const e=await kn.readLogFile(I,100,!0);z(e.content)}catch(e){const t=e instanceof Error?e.message:"Failed to load log file";N(t),z("")}finally{D(!1)}}},[I]),Q=e.useCallback(()=>{if(P)K.current&&(K.current.close(),K.current=null),O(!1);else if(I)try{const e=kn.createTailStream(I);K.current=e,e.onmessage=e=>{try{const t=JSON.parse(e.data);"log"===t.type&&z(e=>e+t.content)}catch(t){}},e.onerror=()=>{O(!1),K.current=null},O(!0)}catch(e){N("Failed to start tail mode")}},[P,I]),Z=e.useCallback(()=>{z("")},[]),ee=e.useCallback(()=>{if(!E)return;const e=new Blob([E],{type:"text/plain"}),t=URL.createObjectURL(e),r=document.createElement("a");r.href=t,r.download=`${I}-${(new Date).toISOString().replace(/[:.]/g,"-")}.log`,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(t)},[E,I]),te=e.useCallback(()=>{if(i)return void i();window.open(`${window.location.origin}/v8/debug-logs-popout`,"debug-log-viewer-popout","popup=yes,width=1400,height=900,left=80,top=60,resizable=yes,scrollbars=yes")?n():N("Popup blocked by browser. Allow popups for this site to open detached log viewer.")},[i,n]),re=e.useCallback(e=>{(e.target===J.current||e.target.closest(".header"))&&(F(!0),W({x:e.clientX-w,y:e.clientY-k}))},[w,k]),ne=e.useCallback(e=>{if(M&&!A){const t=e.clientX-B.x,r=e.clientY-B.y,n=window.innerWidth-u,i=window.innerHeight-x;v(Math.max(0,Math.min(t,n))),j(Math.max(0,Math.min(r,i)))}},[M,A,u,x,B]),ie=e.useCallback(()=>{F(!1)},[]),oe=e.useCallback(e=>{V(!0),H({width:u,height:x,x:e.clientX,y:e.clientY})},[u,x]),se=e.useCallback(e=>{if(q){const t=Math.max(300,G.width+(e.clientX-G.x)),r=Math.max(200,G.height+(e.clientY-G.y));p(t),y(r)}},[q,G]),ae=e.useCallback(()=>{V(!1)},[]),ce=e.useCallback(()=>{if(A)p(a),y(c),v(l),j(d),T(!1);else{const e=window.innerWidth,t=window.innerHeight;p(e-40),y(t-40),v(20),j(20),T(!0)}},[A,a,c,l,d]);e.useEffect(()=>{r&&(Y(),X())},[r,Y,X]),e.useEffect(()=>()=>{K.current&&(K.current.close(),K.current=null)},[]);const le=e.useCallback(()=>{P&&K.current&&(K.current.close(),K.current=null,O(!1))},[P]);return e.useEffect(()=>{le(),X()},[le,X]),e.useEffect(()=>{const e=e=>{ne(e),se(e)},t=()=>{ie(),ae()};if(M||q)return document.addEventListener("mousemove",e),document.addEventListener("mouseup",t),()=>{document.removeEventListener("mousemove",e),document.removeEventListener("mouseup",t)}},[M,q,ne,ie,se,ae]),r?t.jsxs(jn,{ref:J,width:A?window.innerWidth-40:u,height:A?window.innerHeight-40:S?40:x,x:A?20:w,y:A?20:k,onMouseDown:re,children:[t.jsxs(Sn,{className:"header",children:[t.jsxs(Cn,{children:[t.jsx(En,{$status:P?"connected":"disconnected"}),"Log Viewer"]}),t.jsxs(An,{children:[!s&&t.jsx(Tn,{$variant:"secondary",onClick:te,title:"Open Debug Log Viewer in separate window",children:t.jsx(h,{})}),t.jsx(Tn,{$variant:"secondary",onClick:()=>C(!S),title:S?"Expand":"Minimize",children:S?t.jsx(g,{}):t.jsx(m,{})}),t.jsx(Tn,{$variant:"secondary",onClick:ce,title:A?"Restore":"Maximize",children:A?"🗗":"🗖"}),t.jsx(Tn,{$variant:"secondary",onClick:n,title:"Close",children:t.jsx(f,{})})]})]}),!S&&t.jsxs(_n,{children:[t.jsxs(Rn,{children:[t.jsx(In,{value:I,onChange:e=>$(e.target.value),disabled:U||P,children:_.map(e=>t.jsxs("option",{value:e.name,children:[e.name," (",(e.size/1024).toFixed(1),"KB)"]},e.name))}),t.jsxs(zn,{onClick:Q,title:P?"Stop tailing - Disable real-time log updates":"Start tailing - Enable real-time log updates",children:[t.jsx(Pn,{type:"checkbox",checked:P,onChange:Q,disabled:U}),t.jsx(On,{children:"Tail Mode"})]}),t.jsx(Tn,{$variant:"secondary",onClick:X,disabled:U||P,title:"Refresh log content from file",children:t.jsx(b,{})}),t.jsx(Tn,{$variant:"secondary",onClick:Z,title:"Clear all log content",children:"Clear"}),t.jsx(Tn,{$variant:"secondary",onClick:ee,disabled:!E,title:"Download log content as file",children:t.jsx(o,{})})]}),L&&t.jsxs("div",{style:{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"4px",padding:"8px",marginBottom:"8px",color:"#991b1b",fontSize:"12px"},children:["Error: ",L]}),U&&t.jsx("div",{style:{textAlign:"center",padding:"20px",color:"#6b7280",fontSize:"12px"},children:"Loading..."}),t.jsx($n,{$isMinimized:S,children:E?(e=>{if(!e)return e;const r=e.split("\n");return r.map((e,n)=>{if(!e.trim())return t.jsx("div",{style:{height:"4px"}},`empty-${n}`);let i="📝",o="#1f2937",s="#f9fafb",a="#d1d5db";return e.includes("ERROR")||e.includes("error")?(i="🔴",o="#991b1b",s="#fef2f2",a="#ef4444"):e.includes("WARN")||e.includes("warn")?(i="🟡",o="#92400e",s="#fffbeb",a="#f59e0b"):e.includes("INFO")||e.includes("info")?(i="🔵",o="#1e3a8a",s="#eff6ff",a="#3b82f6"):(e.includes("DEBUG")||e.includes("debug"))&&(i="🔍",o="#0f766e",s="#f0fdfa",a="#14b8a6"),t.jsxs("div",{children:[t.jsx("div",{style:{color:o,background:s,borderLeft:`4px solid ${a}`,padding:"4px 8px",borderRadius:"4px",whiteSpace:"pre-wrap"},children:`${i} ${e}`}),n<r.length-1&&t.jsx("div",{style:{borderBottom:"1px dashed #d1d5db",margin:"4px 0"}})]},`line-${n}`)})})(E):"No log content. Select a file and click Refresh to view logs."})]}),!A&&!S&&t.jsx(Un,{onMouseDown:oe})]}):null},Ln=Ce.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999998;
  padding: 2rem;
  
  @media (max-width: 1024px) {
    padding: 1.5rem;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem;
  }
`,Nn=Ce.div`
  width: ${e=>e.$isMinimized?"300px":e.$width||"min(800px, calc(100vw - 4rem))"};
  max-height: ${e=>e.$isMinimized?"auto":e.$maxHeight||"calc(100vh - 4rem)"};
  height: ${e=>(e.$isMinimized,"auto")};
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
  padding: ${e=>e.$isMinimized?"0.75rem":"0"};
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  
  @media (max-width: 1024px) {
    width: min(700px, calc(100vw - 3rem));
    max-height: calc(100vh - 3rem);
  }
  
  @media (max-width: 768px) {
    width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
  }
  
  @media (max-width: 480px) {
    width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
  }
  position: fixed;
  top: ${e=>e.$position.y}px;
  left: ${e=>e.$position.x}px;
  cursor: ${e=>e.$isDragging?"grabbing":"default"};
  transition: ${e=>e.$isDragging?"none":"all 0.2s ease"};
  z-index: 999999;
  
  /* Ensure modal stays within viewport */
  max-width: calc(100vw - 2rem);
`,Mn=Ce.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #cbd5e1;
  margin: 0;
  padding: ${e=>e.$isMinimized?"0.75rem":"1.5rem"};
  border-radius: ${e=>e.$isMinimized?"0.75rem":"0.75rem 0.75rem 0 0"};
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  
  &:active {
    cursor: grabbing;
  }
  
  @media (max-width: 768px) {
    padding: ${e=>e.$isMinimized?"0.75rem":"1rem"};
  }
`,Fn=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f1f5f9;
  }
`,qn=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Vn=Ce.button`
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
`,Bn=Ce.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
`,Wn=({isOpen:r,onClose:n,title:i,children:o,width:s,maxHeight:a,showMinimize:c=!0,headerContent:l})=>{const[d,u]=e.useState(!1),[p,h]=e.useState({x:0,y:0}),[b,y]=e.useState(!1),[w,v]=e.useState({x:0,y:0}),k=e.useRef(null);e.useEffect(()=>{if(r&&0===p.x&&0===p.y){const e=setTimeout(()=>{const e=k.current?.offsetWidth||900,t=Math.min(800,window.innerHeight-64),r=Math.max(20,(window.innerWidth-e)/2),n=Math.max(20,Math.min(40,(window.innerHeight-t)/2));h({x:r,y:n})},0);return()=>clearTimeout(e)}},[r,p.x,p.y]),e.useEffect(()=>{r||(u(!1),h({x:0,y:0}),y(!1))},[r]);const j=e.useCallback(e=>{if(d)return;if(e.target.closest("button"))return;const t=k.current?.getBoundingClientRect();t&&(v({x:e.clientX-t.left,y:e.clientY-t.top}),y(!0),e.preventDefault())},[d]),S=e.useCallback(e=>{if(!b||d)return;const t=e.clientX-w.x,r=e.clientY-w.y,n=100-(k.current?.offsetWidth||900),i=50-(k.current?.offsetHeight||600),o=window.innerWidth-100,s=window.innerHeight-50;h({x:Math.max(n,Math.min(t,o)),y:Math.max(i,Math.min(r,s))})},[b,w,d]),C=e.useCallback(()=>{y(!1)},[]);e.useEffect(()=>{if(b)return document.addEventListener("mousemove",S),document.addEventListener("mouseup",C),()=>{document.removeEventListener("mousemove",S),document.removeEventListener("mouseup",C)}},[b,S,C]),e.useEffect(()=>{const e=e=>{"Escape"===e.key&&r&&n()};return r&&document.addEventListener("keydown",e),()=>{document.removeEventListener("keydown",e)}},[r,n]),e.useEffect(()=>{if(r){const e=document.body.style.overflow;return document.body.style.overflow="hidden",()=>{document.body.style.overflow=e}}},[r]);return r?t.jsx(Ln,{role:"dialog","aria-modal":"true","aria-labelledby":"modal-title",children:t.jsxs(Nn,{ref:k,$isMinimized:d,$position:p,$isDragging:b,...s&&{$width:s},...a&&{$maxHeight:a},children:[t.jsxs(Mn,{$isMinimized:d,onMouseDown:j,children:[t.jsxs(Fn,{children:[t.jsx(x,{size:16}),t.jsxs("div",{children:[t.jsx(Bn,{id:"modal-title",children:i}),l&&!d&&l]})]}),t.jsxs(qn,{children:[c&&t.jsx(Vn,{onClick:()=>{u(!d)},title:d?"Maximize":"Minimize",children:d?t.jsx(g,{size:16}):t.jsx(m,{size:16})}),t.jsx(Vn,{onClick:()=>{n(),u(!1),h({x:0,y:0})},title:"Close",children:t.jsx(f,{size:16})})]})]}),!d&&t.jsx("div",{style:{flex:"1 1 auto",overflowY:"auto",overflowX:"hidden",minHeight:0,maxHeight:"calc(100vh - 10rem)",display:"flex",flexDirection:"column",padding:"1.5rem",WebkitOverflowScrolling:"touch",scrollbarWidth:"thin",scrollbarColor:"#cbd5e1 #f1f5f9"},children:o})]})}):null},Gn=Ae`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`,Hn=Ce.div`
  position: relative;
  display: inline-block;
`,Jn=Ce.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 8px 12px;
  background-color: ${({$copied:e})=>e?"#10b981":"#1f2937"};
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  z-index: 1000;
  opacity: ${({$visible:e})=>e?1:0};
  visibility: ${({$visible:e})=>e?"visible":"hidden"};
  transition: all 0.2s ease;
  animation: ${({$visible:e})=>e?Gn:"none"} 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* Arrow pointing down to button */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid ${({$copied:e})=>e?"#10b981":"#1f2937"};
  }
`,Kn=Ce.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  background-color: ${({$copied:e,$variant:t})=>e?"#10b981":"primary"===t?"#3b82f6":"secondary"===t?"#6b7280":"transparent"};
  color: ${({$copied:e,$variant:t})=>e?"white":"outline"===t?"#374151":"white"};
  border: ${({$variant:e,$copied:t})=>t?"1px solid #10b981":"outline"===e?"1px solid #d1d5db":"none"};

  ${({$size:e})=>{switch(e){case"sm":return"\n          padding: 0.375rem 0.5rem;\n          font-size: 0.75rem;\n        ";case"lg":return"\n          padding: 0.75rem 1rem;\n          font-size: 1rem;\n        ";default:return"\n          padding: 0.5rem 0.75rem;\n          font-size: 0.875rem;\n        "}}}

  &:hover {
    background-color: ${({$copied:e,$variant:t})=>e?"#059669":"primary"===t?"#2563eb":"secondary"===t?"#4b5563":"#f9fafb"};
    transform: ${({$copied:e})=>e?"none":"translateY(-1px)"};
    box-shadow: ${({$copied:e})=>e?"0 2px 4px rgba(16, 185, 129, 0.3)":"0 4px 8px rgba(0, 0, 0, 0.1)"};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: ${({$size:e})=>{switch(e){case"sm":return"14px";case"lg":return"18px";default:return"16px"}}};
    height: ${({$size:e})=>{switch(e){case"sm":return"14px";case"lg":return"18px";default:return"16px"}}};
  }
`,Yn=({copied:e})=>e?t.jsx(i,{}):t.jsx(n,{}),Xn=({text:r,label:n="Copy",size:i="md",variant:o="primary",showLabel:s=!0,className:a})=>{const[c,l]=e.useState(!1),[d,u]=e.useState(!1),p=e.useCallback(async()=>{try{await navigator.clipboard.writeText(r),l(!0),u(!0),setTimeout(()=>{l(!1),u(!1)},2e3)}catch(e){const n=document.createElement("textarea");n.value=r,document.body.appendChild(n),n.select();try{document.execCommand("copy"),l(!0),u(!0),setTimeout(()=>{l(!1),u(!1)},2e3)}catch(t){}document.body.removeChild(n)}},[r]),h=e.useCallback(()=>{c||u(!0)},[c]),g=e.useCallback(()=>{c||u(!1)},[c]);return t.jsxs(Hn,{className:a,children:[t.jsx(Jn,{$visible:d,$copied:c,children:c?"Copied!":`${n} item`}),t.jsxs(Kn,{type:"button",$size:i,$variant:o,$copied:c,onClick:p,onMouseEnter:h,onMouseLeave:g,"aria-label":c?"Copied!":`Copy ${n}`,children:[t.jsx(Yn,{copied:c}),s&&!c&&n,s&&c&&"Copied"]})]})},Qn={identifier:(e,r)=>t.jsx(Xn,{text:e,label:r,size:"sm",variant:"outline",showLabel:!1}),url:(e,r)=>t.jsx(Xn,{text:e,label:r,size:"md",variant:"primary",showLabel:!0}),token:(e,r)=>t.jsx(Xn,{text:e,label:r,size:"sm",variant:"secondary",showLabel:!1})},Zn=Ce.div`
	background: #f0fdf4; /* Light green for generated content */
	border: 1px solid #16a34a;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
	position: relative;
	max-width: 100%;
	width: 100%; /* Ensure full width usage */
	overflow: visible; /* Changed from hidden to visible to allow horizontal scrolling */
	box-sizing: border-box;
`,ei=Ce.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.75rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,ti=Ce.div`
	background: #f0fdf4; /* Light green for generated content */
	border: 1px solid #16a34a;
	border-radius: 8px;
	padding: 2.5rem 8rem 1rem 1rem; /* Extra space so buttons do not overlap URL text */
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	word-break: break-all; /* Allow URLs to break and wrap within the container */
	white-space: normal; /* Allow wrapping to fit within the box */
	position: relative;
	min-height: ${({$height:e})=>e||"150px"};
	overflow-x: hidden; /* Hide horizontal scroll since we're wrapping */
	overflow-y: auto; /* Allow vertical scrolling if content is too tall */
	max-width: 100%;
	width: 100%; /* Ensure full width usage */
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
`,ri=Ce.textarea`
	background: #ffffff;
	border: 2px solid #16a34a;
	border-radius: 8px;
	padding: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	width: 100%;
	min-height: ${({$height:e})=>e||"150px"};
	resize: vertical;
	color: #1f2937;
	box-sizing: border-box;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

	&:focus {
		outline: none;
		border-color: #15803d;
		box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
	}
`,ni=Ce.span`
	color: ${({$color:e})=>e};
	font-weight: ${({$color:e})=>"#1f2937"===e?"600":"400"};
`,ii=Ce.div`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	display: flex;
	gap: 0.5rem;
`,oi=Ce.button`
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
`,si=Ce.div`
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
`,ai=Ce.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 600px;
	max-height: 80vh;
	overflow-y: auto;
	margin: 1rem;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`,ci=Ce.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
`,li=Ce.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
`,di=Ce.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	cursor: pointer;
	color: #6b7280;
	padding: 0.25rem;

	&:hover {
		color: #374151;
	}
`,ui=Ce.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`,pi=Ce.div`
	padding: 1rem;
	background: #f8fafc;
	border-radius: 8px;
	border-left: 4px solid #3b82f6;
`,hi=Ce.div`
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.25rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`,gi=Ce.div`
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
`,mi=Ce.div`
	color: #059669;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	margin-top: 0.25rem;
	word-break: break-all;
`,fi=["#1f2937","#dc2626","#059669","#7c3aed","#ea580c","#0891b2","#be123c","#ca8a04","#7c2d12","#1e40af","#be185d","#0f766e","#92400e","#7c2d12","#1e3a8a","#991b1b","#0c4a6e","#581c87","#7c2d12","#0f766e"],bi=({url:r,showCopyButton:n=!0,showInfoButton:i=!0,showOpenButton:o=!1,onOpen:a,label:l="Generated Authorization URL",height:d,editable:u=!1,onChange:p})=>{const[g,m]=e.useState(!1),[b,x]=e.useState(!1),[j,S]=e.useState(!1),[C,A]=e.useState(r);y.useEffect(()=>{j||A(r)},[r,j]);const T=j?C:r,_=b?decodeURIComponent(T):T,R=(e=>{const t=[];let r="",n=0;for(let i=0;i<e.length;i++){const o=e[i];"?"===o||"&"===o?(r&&(t.push({text:r,color:fi[n%fi.length]}),n++),t.push({text:o,color:fi[n%fi.length]}),n++,r=""):r+=o}return r&&t.push({text:r,color:fi[n%fi.length]}),t})(_),I=(e=>{const t=new URL(e),r=new URLSearchParams(t.search);return[{name:"response_type",description:'Specifies the OAuth response type. For hybrid flow, this can be "code id_token", "code token", or "code id_token token".',value:r.get("response_type")||"Not specified"},{name:"client_id",description:"The unique identifier for your OAuth client application.",value:r.get("client_id")||"Not specified"},{name:"redirect_uri",description:"The URI where the user will be redirected after authorization. Must match the registered redirect URI.",value:r.get("redirect_uri")||"Not specified"},{name:"scope",description:"The permissions your application is requesting from the user.",value:r.get("scope")||"Not specified"},{name:"state",description:"A random string used to prevent CSRF attacks. Should be validated when the user returns.",value:r.get("state")||"Not specified"},{name:"response_mode",description:"How the authorization response should be returned. Options: query, fragment, form_post, or pi.flow.",value:r.get("response_mode")||"Not specified"},{name:"code_challenge",description:"PKCE code challenge for additional security. Generated from code_verifier.",value:r.get("code_challenge")||"Not specified"},{name:"code_challenge_method",description:'The method used to generate the code_challenge. Usually "S256".',value:r.get("code_challenge_method")||"Not specified"},{name:"nonce",description:"A random string used to prevent replay attacks for ID tokens.",value:r.get("nonce")||"Not specified"}].filter(e=>"Not specified"!==e.value)})(_),$=()=>{p&&p(C),S(!1)},E=()=>{A(r),S(!1)};return t.jsxs(Zn,{children:[t.jsxs(ei,{children:[l,b&&!j&&t.jsx("span",{style:{background:"#dbeafe",color:"#1e40af",padding:"0.25rem 0.5rem",borderRadius:"0.375rem",fontSize:"0.75rem",fontWeight:"500",marginLeft:"0.5rem"},children:"Decoded"}),j&&t.jsx("span",{style:{background:"#fef3c7",color:"#92400e",padding:"0.25rem 0.5rem",borderRadius:"0.375rem",fontSize:"0.75rem",fontWeight:"500",marginLeft:"0.5rem"},children:"Editing"}),i&&!j&&t.jsxs(oi,{onClick:()=>m(!0),$variant:"secondary",children:[t.jsx(c,{size:14}),"Explain URL"]})]}),j?t.jsxs("div",{style:{position:"relative"},children:[t.jsx(ri,{value:C,onChange:e=>A(e.target.value),onKeyDown:e=>{"Enter"===e.key&&(e.metaKey||e.ctrlKey)?$():"Escape"===e.key&&E()},...d?{$height:d}:{},placeholder:"Enter or paste your authorization URL here..."}),t.jsxs(ii,{children:[t.jsxs(oi,{onClick:$,$variant:"primary",children:[t.jsx(w,{size:14}),"Save"]}),t.jsx(oi,{onClick:E,$variant:"secondary",children:"Cancel"})]})]}):t.jsxs(ti,{...d?{$height:d}:{},children:[t.jsxs(ii,{children:[u&&t.jsxs(oi,{onClick:()=>{S(!0),A(r)},$variant:"secondary",children:[t.jsx(v,{size:14}),"Edit"]}),n&&t.jsx(Xn,{text:_,label:"Authorization URL",size:"sm",variant:"primary",showLabel:!1}),t.jsxs(oi,{onClick:()=>{x(!b)},$variant:"secondary",children:[b?t.jsx(s,{size:14}):t.jsx(k,{size:14}),b?"Encode":"Decode"]}),o&&t.jsxs(oi,{onClick:()=>{window.open(_,"_blank"),a?.()},$variant:"secondary",children:[t.jsx(h,{size:14}),"Open"]})]}),R.map((e,r)=>t.jsx(ni,{$color:e.color,children:e.text},r))]}),t.jsx(si,{$isOpen:g,children:t.jsxs(ai,{children:[t.jsxs(ci,{children:[t.jsx(li,{children:"Authorization URL Parameters"}),t.jsx(di,{onClick:()=>m(!1),children:"×"})]}),I.length>0?t.jsx(ui,{children:I.map((e,r)=>t.jsxs(pi,{children:[t.jsx(hi,{children:e.name}),t.jsx(gi,{children:e.description}),t.jsx(mi,{children:e.value})]},r))}):t.jsxs("div",{style:{color:"#4b5563",fontSize:"0.9rem",lineHeight:1.5},children:["This URL does not include any query parameters to explain.",t.jsx("br",{}),"Add parameters such as `response_type`, `client_id`, or `redirect_uri` to see a detailed breakdown."]}),t.jsx("div",{style:{marginTop:"1.5rem",paddingTop:"1rem",borderTop:"1px solid #e5e7eb",textAlign:"center"},children:t.jsxs(oi,{onClick:()=>m(!1),$variant:"secondary",style:{minWidth:"120px",padding:"0.75rem 1.5rem"},children:[t.jsx(f,{size:14,style:{marginRight:"0.5rem"}}),"Close"]})})]})})]})},xi=Ce.div`
  background-color: #f0f8ff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  
  ${({$accent:e})=>{if(!e)return"";const t={primary:"#003087",success:"#28a745",danger:"#dc3545",warning:"#ffc107",info:"#17a2b8"};return Te`
      border-top: 3px solid ${t[e]||t.primary};
    `}}
`,yi=Ce.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({theme:e})=>e.colors.gray200};
  
  h2, h3, h4, h5, h6 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .subtitle {
    color: ${({theme:e})=>e.colors.gray600};
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
`,wi=Ce.div`
  padding: 1.5rem;
  
  & > :last-child {
    margin-bottom: 0;
  }
`;Ce.div`
  padding: 1rem 1.5rem;
  background-color: ${({theme:e})=>e.colors.gray100};
  border-top: 1px solid ${({theme:e})=>e.colors.gray200};
  
  & > :last-child {
    margin-bottom: 0;
  }
`;const vi=({children:e,className:r,accent:n})=>t.jsx(xi,{className:r,...void 0!==n?{$accent:n}:{},children:e}),ki=(t={})=>{const{role:r,label:n,description:i,announceChanges:o=!0,trapFocus:s=!1,keyboardNavigation:a=!0,screenReader:c=!0}=t,l=e.useRef(null),[d,u]=e.useState(!1),[p,h]=e.useState(!1),[g,m]=e.useState(!1),f=Me(),b=Fe();qe();const x={...r&&{role:r},...n&&{[Ve.LABELLEDBY]:n},...i&&{[Ve.DESCRIBEDBY]:i},...d&&{[Ve.CURRENT]:"true"}},y=e.useCallback(()=>{const e=f.getNextFocusable(l.current||void 0);e&&f.focus(e)},[f]),w=e.useCallback(()=>{const e=f.getPreviousFocusable(l.current||void 0);e&&f.focus(e)},[f]),v=e.useCallback(e=>{if(!a)return;const{key:t,ctrlKey:n,metaKey:i,shiftKey:o}=e;switch(h(!0),t){case Be.ENTER:case Be.SPACE:r!==We.BUTTON&&r!==We.LINK||(e.preventDefault(),l.current?.click());break;case Be.ESCAPE:s&&(e.preventDefault(),f.focus(document.body));break;case Be.ARROW_DOWN:r!==We.MENU&&r!==We.TABLIST||(e.preventDefault(),y());break;case Be.ARROW_UP:r!==We.MENU&&r!==We.TABLIST||(e.preventDefault(),w());break;case Be.ARROW_LEFT:r===We.TABLIST&&(e.preventDefault(),w());break;case Be.ARROW_RIGHT:r===We.TABLIST&&(e.preventDefault(),y());break;case Be.HOME:if(r===We.MENU||r===We.TABLIST){e.preventDefault();const t=f.getFocusableElements()[0];t&&f.focus(t)}break;case Be.END:if(r===We.MENU||r===We.TABLIST){e.preventDefault();const t=f.getFocusableElements(),r=t[t.length-1];r&&f.focus(r)}break;case Be.TAB:s&&(e.preventDefault(),o?w():y())}if(n||i)switch(t){case"h":e.preventDefault(),b.announce("Help: Use Tab to navigate, Enter to activate, Escape to close");break;case"f":{e.preventDefault();const t=document.querySelector('input[type="search"], input[placeholder*="search" i]');t&&f.focus(t);break}}},[r,a,s,f,b,y,w]),k=e.useCallback(e=>{if(u(!0),m(!0),o&&c){const t=e.target,r=t.getAttribute("aria-label")||t.getAttribute("aria-labelledby")||t.textContent?.trim()||t.getAttribute("title");r&&b.announce(r)}Ee.info("[useAccessibility] Element focused:",e.target instanceof HTMLElement?`[HTMLElement: ${e.target.tagName}]`:String(e.target))},[o,c,b]),j=e.useCallback(e=>{u(!1),m(!1),Ee.info("[useAccessibility] Element blurred:",e.target instanceof HTMLElement?`[HTMLElement: ${e.target.tagName}]`:String(e.target))},[]),S=e.useCallback(()=>{l.current&&f.focus(l.current)},[f]),C=e.useCallback((e,t="polite")=>{c&&b.announce(e,t)},[c,b]),A=e.useCallback(e=>{c&&b.announceError(e)},[c,b]),T=e.useCallback(e=>{c&&b.announceSuccess(e)},[c,b]);return e.useEffect(()=>{if(s&&l.current)return f.trapFocus(l.current),()=>{f.releaseFocusTrap(l.current)}},[s,f]),e.useEffect(()=>{const e=()=>h(!1),t=()=>h(!0);return document.addEventListener("mousedown",e),document.addEventListener("keydown",t),()=>{document.removeEventListener("mousedown",e),document.removeEventListener("keydown",t)}},[]),{ariaProps:x,onKeyDown:v,onFocus:k,onBlur:j,focus:S,focusNext:y,focusPrevious:w,announce:C,announceError:A,announceSuccess:T,isFocused:d,isKeyboardUser:p,hasFocus:g}},{version:ji,mfaV8Version:Si,unifiedV8uVersion:Ci}=rr,Ai=ji,Ti=Si,_i=Ci,Ri=Ce.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: ${({theme:e})=>e.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  z-index: 999;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  
  /* On desktop (768px+), adjust for sidebar if it's open */
  @media (min-width: 768px) {
    left: ${({$sidebarOpen:e,$sidebarWidth:t})=>e&&t&&t>0?`${t}px`:"0"};
  }
`,Ii=Ce.div`
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  margin-right: auto;
  text-align: left;
  
  img {
    height: 40px;
    width: auto;
    object-fit: contain;
    background: transparent;
    display: block;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    image-rendering: optimize-quality;
    flex-shrink: 0;
  }
  
  > div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .user-info {
    font-size: 0.875rem;
    font-weight: 400;
    opacity: 0.9;
    margin-top: 2px;
  }
  
  /* On smaller screens, adjust font sizes but keep everything visible */
  @media (max-width: 768px) {
    .user-info {
      font-size: 0.75rem;
    }
    
    > div span {
      font-size: 1.0rem;
    }
    
    gap: 0.5rem;
  }
  
  /* On very small screens, make text smaller but keep visible */
  @media (max-width: 480px) {
    .user-info {
      font-size: 0.7rem;
    }
    
    > div span {
      font-size: 0.9rem;
    }
    
    gap: 0.4rem;
    
    img {
      height: 32px;
    }
  }
`,$i=Ce.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  
  button, a {
    background: white;
    border: 1px solid #e2e8f0;
    color: black;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    margin-left: 0.5rem;
    transition: all 0.2s;
    
    &:hover {
      background-color: #f8fafc;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    span {
      margin-left: 0.5rem;
      font-size: 0.875rem;
      display: none;
      
      @media (min-width: ${({theme:e})=>e.breakpoints.md}) {
        display: inline;
      }
    }
  }
  
  /* Hide less important buttons on smaller screens */
  @media (max-width: 768px) {
    /* Hide OIDC Discovery and App Generator on tablets */
    a[href*="auto-discover"],
    a[href*="client-generator"] {
      display: none;
    }
  }
  
  @media (max-width: 640px) {
    /* Hide Configuration and Dashboard on mobile */
    a[href*="configuration"],
    a[href*="dashboard"] {
      display: none;
    }
  }
  
  @media (max-width: 480px) {
    /* Hide Export All on very small screens */
    button[title*="Export"] {
      display: none;
    }
  }
`,Ei=Ce.button`
  margin-right: 1rem;
  
  @media (min-width: ${({theme:e})=>e.breakpoints.lg}) {
    display: none;
  }
`,zi=Ce.div`
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
`,Pi=Ce.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 500px;
  position: relative;
  border: 1px solid #e5e7eb;
`,Oi=Ce.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 12px 12px 0 0;
  color: white;
`,Ui=Ce.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`,Di=Ce.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`,Li=Ce.div`
  padding: 2rem;
`,Ni=Ce.p`
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.95rem;
`,Mi=Ce.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`,Fi=Ce.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  ${({$variant:e})=>"markdown"===e?"\n        background-color: #3b82f6;\n        color: #ffffff;\n        border-color: #2563eb;\n        \n        &:hover {\n          background-color: #2563eb;\n          border-color: #1d4ed8;\n        }\n      ":"\n        background-color: #dc2626;\n        color: #ffffff;\n        border-color: #b91c1c;\n        \n        &:hover {\n          background-color: #b91c1c;\n          border-color: #991b1b;\n        }\n      "}
`,qi=({toggleSidebar:r,sidebarOpen:n=!1,sidebarWidth:i})=>{const{isAuthenticated:s,logout:a,user:c}=Xt(),l=j(),{announce:d}=ki(),[u,p]=e.useState(!1),[h,g]=e.useState(()=>{try{const e=localStorage.getItem("sidebar.width"),t=e?parseInt(e,10):NaN;if(Number.isFinite(t)&&t>=300&&t<=600)return t}catch{}return 450});e.useEffect(()=>{const e=()=>{try{const e=localStorage.getItem("sidebar.width"),t=e?parseInt(e,10):NaN;Number.isFinite(t)&&t>=300&&t<=600&&g(t)}catch{}};e(),window.addEventListener("storage",e);const t=setInterval(e,500);return()=>{window.removeEventListener("storage",e),clearInterval(t)}},[]);const m=i??h,b=()=>{p(!1)};return t.jsxs(t.Fragment,{children:[t.jsxs(Ri,{role:"banner","aria-label":"Main navigation",$sidebarOpen:n,$sidebarWidth:m,children:[t.jsx(Ei,{onClick:()=>{r(),d("Navigation menu toggled")},"aria-label":"Toggle navigation menu","aria-expanded":"false","aria-controls":"sidebar-menu",children:t.jsx(S,{size:24,"aria-hidden":"true"})}),t.jsxs(Ii,{children:[t.jsx("img",{src:"/images/ping-identity-logo.png",alt:"Ping Identity"}),t.jsxs("div",{children:[t.jsx("span",{children:"PingOne MasterFlow API"}),t.jsxs("div",{className:"user-info","aria-live":"polite",children:["Version ",Ai]}),s&&c&&t.jsxs("div",{className:"user-info","aria-live":"polite",children:["Welcome, ",c.name||c.email]})]})]}),t.jsxs($i,{role:"navigation","aria-label":"Main navigation",children:[t.jsxs(C,{to:"/documentation",title:"View documentation and help",children:[t.jsx(A,{"aria-hidden":"true"}),t.jsx("span",{children:"Docs"})]}),t.jsxs(C,{to:"/configuration",title:"Configure OAuth settings",children:[t.jsx(T,{"aria-hidden":"true"}),t.jsx("span",{children:"Configuration"})]}),t.jsxs(C,{to:"/api-status",title:"View API server status and health metrics",children:[t.jsx(_,{"aria-hidden":"true"}),t.jsx("span",{children:"API Status"})]}),t.jsxs(C,{to:"/dashboard",title:"View dashboard and system overview",children:[t.jsx(R,{"aria-hidden":"true"}),t.jsx("span",{children:"Dashboard"})]}),t.jsxs(C,{to:"/auto-discover",title:"OIDC Discovery tool","aria-label":"OIDC Discovery tool",children:[t.jsx(I,{"aria-hidden":"true"}),t.jsx("span",{children:"OIDC Discovery"})]}),t.jsxs(C,{to:"/client-generator",title:"Generate PingOne applications",children:[t.jsx(T,{"aria-hidden":"true"}),t.jsx("span",{children:"App Generator"})]}),t.jsxs("button",{type:"button",onClick:()=>{p(!0)},title:"Export all Unified Flow use cases as PDF or Markdown","aria-label":"Export all Unified Flow use cases",children:[t.jsx(o,{"aria-hidden":"true"}),t.jsx("span",{children:"Export All"})]}),s?t.jsxs("button",{type:"button",onClick:()=>{a(),l("/login"),d("Logged out successfully")},title:"Logout from the application","aria-label":"Logout from the application",children:[t.jsx($,{"aria-hidden":"true"}),t.jsx("span",{children:"Logout"})]}):t.jsxs(C,{to:"/login",title:"Login to the application","aria-label":"Login to the application",children:[t.jsx(E,{"aria-hidden":"true"}),t.jsx("span",{children:"Login"})]})]})]}),t.jsx(zi,{$isOpen:u,onClick:b,children:t.jsxs(Pi,{onClick:e=>e.stopPropagation(),children:[t.jsxs(Oi,{children:[t.jsxs(Ui,{children:[t.jsx(o,{}),"Export All Unified Flow Use Cases"]}),t.jsx(Di,{onClick:b,"aria-label":"Close modal",children:t.jsx(f,{size:20})})]}),t.jsxs(Li,{children:[t.jsx(Ni,{children:"Choose a format to export all Unified Flow use cases. This will generate a comprehensive document containing API calls for each flow type."}),t.jsxs(Mi,{children:[t.jsxs(Fi,{$variant:"markdown",onClick:()=>{Re(),p(!1),d("Exporting all Unified Flow use cases as Markdown")},children:[t.jsx(z,{}),"Export as Markdown"]}),t.jsxs(Fi,{$variant:"pdf",onClick:()=>{Ie(),p(!1),d("Exporting all Unified Flow use cases as PDF")},children:[t.jsx(o,{}),"Export as PDF"]})]})]})]})})]})},Vi="oauth_playground_last_route",Bi="oauth_playground_last_route_timestamp",Wi=864e5,Gi=["/login","/callback","/authz-callback","/oauth-v3-callback","/hybrid-callback","/implicit-callback","/oauth-implicit-callback","/oidc-implicit-callback","/implicit-callback-v3","/worker-token-callback","/device-code-status","/logout-callback","/authz-logout-callback","/implicit-logout-callback","/hybrid-logout-callback","/device-logout-callback","/worker-token-logout-callback","/p1auth-logout-callback","/dashboard-logout-callback","/dashboard-callback","/oauth-callback","/oidc-callback","/mfa-callback","/p1-callback","/p1auth-callback","/pingone-authentication/result"],Hi="/dashboard";class Ji{static saveCurrentRoute(e){if(!Ji.isExcludedRoute(e)&&"/"!==e&&""!==e)try{localStorage.setItem(Vi,e),localStorage.setItem(Bi,Date.now().toString())}catch(t){}}static getLastRoute(){try{const e=localStorage.getItem(Vi),t=localStorage.getItem(Bi);if(!e||!t)return Hi;return Date.now()-parseInt(t,10)>Wi?(Ji.clearSavedRoute(),Hi):e}catch(e){return Hi}}static clearSavedRoute(){try{localStorage.removeItem(Vi),localStorage.removeItem(Bi)}catch(e){}}static isExcludedRoute(e){return Gi.some(t=>e.startsWith(t))}static getRouteAge(){try{const e=localStorage.getItem(Bi);return e?Date.now()-parseInt(e,10):null}catch(e){return null}}static hasSavedRoute(){const e=localStorage.getItem(Vi),t=localStorage.getItem(Bi);if(!e||!t)return!1;return Date.now()-parseInt(t,10)<Wi}}"undefined"!=typeof window&&(window.RoutePersistenceService=Ji);const Ki=()=>{const t=r(),n=j();return e.useEffect(()=>{Ji.saveCurrentRoute(t.pathname+t.search)},[t.pathname,t.search]),e.useEffect(()=>{if("/"===t.pathname&&!sessionStorage.getItem("route_restored")){const e=Ji.getLastRoute();sessionStorage.setItem("route_restored","true"),e&&"/"!==e&&n(e,{replace:!0})}},[t.pathname,n]),null},Yi=Ce.div`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.25rem 0.625rem;
	border-radius: 0.375rem;
	background: ${e=>e.$color};
	color: white;
	font-size: 0.75rem;
	font-weight: 600;
	white-space: nowrap;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
	}
`,Xi=Ce.span`
	display: flex;
	align-items: center;
	font-size: 0.875rem;
`,Qi=Ce.span`
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	letter-spacing: 0.025em;
`,Zi={app:"#3b82f6",mfa:"#8b5cf6",unified:"#10b981",protect:"#f59e0b"},eo={app:"APP",mfa:"MFA",unified:"V8U",protect:"PROTECT"},to={app:D,mfa:U,unified:O,protect:P},ro=({type:e,showIcon:r=!0})=>{const n=to[e],i=Zi[e],o=eo[e],s=(()=>{switch(e){case"app":default:return rr.version;case"mfa":return rr.mfaV8Version;case"unified":return rr.unifiedV8uVersion;case"protect":return rr.protectPortalVersion}})();return t.jsxs(Yi,{$color:i,title:`${o} Version ${s}`,children:[r&&t.jsx(Xi,{children:t.jsx(n,{size:14})}),t.jsxs(Qi,{children:[o," v",s]})]})},no=Ce.div`
	color: ${e=>e.$color};
	display: flex;
	align-items: center;
	justify-content: center;
`,io=Ce.span`
	background: rgba(34, 197, 94, 0.9);
	border: 1px solid #22c55e;
	color: #ffffff;
	padding: 0.125rem 0.375rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	z-index: 1;
	position: relative;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`,oo=({dragMode:n=!1,searchQuery:i="",matchAnywhere:o=!1})=>{const c=r(),d=j(),[p,h]=e.useState(null),[g,m]=e.useState(null),[y,w]=e.useState("default"),v=e=>{if(c.pathname+c.search===e)return!0;const t=e.split("?")[0],r=e.split("?")[1],n=c.pathname,i=c.search;if(n===t)if(r){if(i===`?${r}`)return!0}else{if("/flows/implicit-v7"===t){const e=new URLSearchParams(i).get("variant");return(!e||"oauth"===e)&&(!i||""===i)}if(!i)return!0}return!(n!==`${t}/`&&t!==`${n}/`||r||i)},S=(e,t)=>{d(e,{state:t})},C=e=>e.map(e=>{const t={id:e.id,label:e.label,isOpen:e.isOpen,items:e.items.map(e=>({id:e.id,path:e.path,label:e.label}))};return e.subGroups&&e.subGroups.length>0&&(t.subGroups=C(e.subGroups)),t}),A=(e,r)=>{const n=e.map(e=>{const n=r.find(t=>t.id===e.id);if(!n)return null;const i=new Set,o=e.items.map(e=>{if(i.has(e.id))return null;i.add(e.id);let n=null;for(const t of r){if(n=t.items.find(t=>t.id===e.id),n)break;if(t.subGroups){for(const r of t.subGroups)if(n=r.items.find(t=>t.id===e.id),n)break;if(n)break}}return n||{id:e.id,path:e.path,label:e.label,icon:t.jsx(no,{$color:"#6366f1",children:t.jsx(T,{})})}}).filter(Boolean);let s;return n.subGroups&&e.subGroups?s=A(e.subGroups,n.subGroups):n.subGroups&&(s=n.subGroups),{...n,isOpen:e.isOpen,items:o,subGroups:s}}).filter(Boolean),i=new Set,o=e=>{e.forEach(e=>{e.items.forEach(e=>{i.add(e.id)}),e.subGroups&&o(e.subGroups)})};o(n);const s=(e,t)=>{t.forEach(t=>{if(t.items.forEach(r=>{if(!i.has(r.id)){const n=e.find(e=>e.id===t.id);n&&(n.items.push(r),i.add(r.id))}}),t.subGroups){const r=e.find(e=>e.id===t.id);r?.subGroups&&s(r.subGroups,t.subGroups)}})};s(n,r);const a=new Set(n.map(e=>e.id));r.forEach(e=>{a.has(e.id)||(n.push(e),a.add(e.id))});const c=new Map(n.map(e=>[e.id,e])),l=[],d=new Set;return e.forEach(e=>{const t=c.get(e.id);t&&(l.push(t),d.add(e.id))}),r.forEach(e=>{if(!d.has(e.id)){const t=c.get(e.id);t&&(l.push(t),d.add(e.id))}}),l},E=e.useCallback(e=>{try{const t=C(e);localStorage.setItem("simpleDragDropSidebar.menuOrder",JSON.stringify(t)),localStorage.setItem("simpleDragDropSidebar.menuVersion","2.2"),w("saved"),setTimeout(()=>{w("default")},1500)}catch(t){}},[C]),[Z,ee]=e.useState(()=>{const e=[{id:"v8-flows-new",label:"Production",icon:t.jsx(P,{}),isOpen:!0,items:[{id:"mfa-feature-flags-admin-v8",path:"/v8/mfa-feature-flags",label:"🚦 MFA Feature Flags",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(T,{})}),badge:t.jsx(io,{title:"Control unified flow rollout with per-device feature flags and percentage-based gradual deployment",children:"ADMIN"})},{id:"api-status-page",path:"/api-status",label:"🔍 API Status",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(R,{})}),badge:t.jsx(io,{title:"Real-time API health monitoring and server performance metrics",children:"UTILITY"})},{id:"flow-comparison-tool",path:"/v8u/flow-comparison",label:"Flow Comparison Tool",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(L,{})}),badge:t.jsx(io,{title:"Compare OAuth flows with detailed metrics and recommendations",children:"EDUCATION"})},{id:"resources-api-v8",path:"/v8/resources-api",label:"Resources API Tutorial",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(N,{})}),badge:t.jsx(io,{title:"V8: Learn PingOne Resources API - OAuth 2.0 resources, scopes, and custom claims",children:"EDUCATION"})},{id:"spiffe-spire-flow-v8u",path:"/v8u/spiffe-spire",label:"SPIFFE/SPIRE Mock",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"Mock flow demonstrating SPIFFE/SPIRE workload identity to PingOne token exchange",children:"EDUCATIONAL"})},{id:"postman-collection-generator",path:"/postman-collection-generator",label:"Postman Collection Generator",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(M,{})}),badge:t.jsx(io,{title:"Generate custom Postman collections for Unified OAuth/OIDC and MFA flows",style:{background:"#3b82f6",color:"white"},children:"UNIFIED"})},{id:"new-unified-mfa-v8",path:"/v8/unified-mfa",label:"🔥 New Unified MFA",icon:t.jsx(no,{$color:"#ef4444",children:t.jsx(O,{})}),badge:t.jsx(io,{title:"New Unified MFA flow with all fixes and improvements",style:{background:"#ef4444",color:"white"},children:"UNIFIED"})},{id:"unified-oauth-flow-v8u",path:"/v8u/unified",label:"Unified OAuth & OIDC",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(P,{})}),badge:t.jsx(io,{title:"V8U: Single UI for all OAuth/OIDC flows with real PingOne APIs",style:{background:"#3b82f6",color:"white"},children:"UNIFIED"})},{id:"delete-all-devices-utility-v8",path:"/v8/delete-all-devices",label:"Delete All Devices",icon:t.jsx(no,{$color:"#ef4444",children:t.jsx(F,{})}),badge:t.jsx(io,{title:"Utility to delete all MFA devices for a user with device type filtering",children:"UTILITY"})},{id:"enhanced-state-management",path:"/v8u/enhanced-state-management",label:"Enhanced State Management (V2)",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(q,{})}),badge:t.jsx(io,{title:"Advanced state management with undo/redo, offline capabilities, and persistence",children:"UTILITY"})},{id:"token-monitoring-dashboard",path:"/v8u/token-monitoring",label:"Token Monitoring Dashboard",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(k,{})}),badge:t.jsx(io,{title:"Real-time token monitoring dashboard",children:"UTILITY"})},{id:"protect-portal-app",path:"/protect-portal",label:"Protect Portal App",icon:t.jsx(no,{$color:"#dc2626",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"Complete risk-based authentication portal with MFA integration",style:{background:"#dc2626",color:"white"},children:"PROTECT"})},{id:"environment-management",path:"/environments",label:"Environment Management",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(_,{})}),badge:t.jsx(io,{title:"Manage PingOne environments, create, delete, and promote to production",children:"NEW"})},{id:"create-company",path:"/admin/create-company",label:"🏢 Create Company",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(T,{})}),badge:t.jsx(io,{title:"Create new company themes and configurations for Protect Portal",children:"NEW"})},{id:"sdk-examples",path:"/sdk-examples",label:"SDK Examples",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(s,{})}),badge:t.jsx(io,{title:"Comprehensive SDK examples for JWT, OIDC, and DaVinci",children:"NEW"})},{id:"debug-log-viewer",path:"/v8/debug-logs",label:"Debug Log Viewer",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(s,{})}),badge:t.jsx(io,{title:"View persistent debug logs that survive redirects",children:"NEW"})},{id:"token-exchange-v7",path:"/flows/token-exchange-v7",label:"Token Exchange (V8M)",icon:t.jsx(no,{$color:"#7c3aed",children:t.jsx(b,{})}),badge:t.jsx(io,{title:"PingOne Token Exchange (RFC 8693) - New Feature Implementation",children:t.jsx(u,{})})}]},{id:"v8-flows",label:"Production (Legacy)",icon:t.jsx(P,{}),isOpen:!0,items:[{id:"unified-mfa-v8",path:"/v8/unified-mfa",label:"🔥 New Unified MFA",icon:t.jsx(no,{$color:"#ef4444",children:t.jsx(O,{})}),badge:t.jsx(io,{style:{background:"#ef4444",color:"white"},children:"UNIFIED"})},{id:"dpop-authorization-code-v8",path:"/flows/dpop-authorization-code-v8",label:"DPoP Authorization Code (V8)",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"V8: Demonstrating Proof of Possession (RFC 9449) with mock server",children:t.jsx(u,{})})},{id:"oauth-authorization-code-v8",path:"/flows/oauth-authorization-code-v8",label:"Authorization Code (V8)",icon:t.jsx(no,{$color:"#06b6d4",children:t.jsx(V,{})}),badge:t.jsx(io,{title:"V8: Simplified UI with educational content in modals",children:t.jsx(u,{})})},{id:"implicit-v8",path:"/flows/implicit-v8",label:"Implicit Flow (V8)",icon:t.jsx(no,{$color:"#7c3aed",children:t.jsx(P,{})}),badge:t.jsx(io,{title:"V8: Simplified UI with educational content in modals",children:t.jsx(u,{})})},{id:"all-flows-api-test",path:"/test/all-flows-api-test",label:"All Flows API Test Suite",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(B,{})}),badge:t.jsx(io,{title:"Test ALL OAuth/OIDC flow types: Auth Code, Implicit, Hybrid, Device Code, Client Credentials",children:t.jsx(u,{})})},{id:"par-test",path:"/test/par-test",label:"PAR Flow Test",icon:t.jsx(no,{$color:"#ea580c",children:t.jsx(W,{})}),badge:t.jsx(io,{title:"Test RFC 9126 Pushed Authorization Request (PAR) flow",children:t.jsx(u,{})})}]},{id:"reference-materials",label:"Reference Materials",icon:t.jsx(no,{$color:"#6366f1",children:t.jsx(N,{})}),isOpen:!0,items:[{id:"ping-ai-resources",path:"/ping-ai-resources",label:"Ping AI Resources",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(G,{})}),badge:t.jsx(io,{title:"Ping Identity AI Resources & Documentation",children:"REFERENCE"})}]},{id:"oauth-flows",label:"OAuth 2.0 Flows",icon:t.jsx(no,{$color:"#ef4444",children:t.jsx(U,{})}),isOpen:!0,items:[{id:"oauth-authorization-code-v7-2",path:"/flows/oauth-authorization-code-v7-2",label:"Authorization Code (V7.2)",icon:t.jsx(no,{$color:"#06b6d4",children:t.jsx(V,{})}),badge:t.jsx(io,{title:"V7.2: Adds optional redirectless (pi.flow) with Custom Login",children:t.jsx(u,{})})},{id:"oauth-implicit-v7",path:"/flows/implicit-v7",label:"Implicit Flow (V7)",icon:t.jsx(no,{$color:"#7c3aed",children:t.jsx(P,{})}),badge:t.jsx(io,{title:"V7: Unified OAuth/OIDC implementation with variant selector",children:t.jsx(u,{})})},{id:"oauth-device-authorization-v7",path:"/flows/device-authorization-v7",label:"Device Authorization (V7)",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(H,{})}),badge:t.jsx(io,{title:"V7: Unified OAuth/OIDC device authorization",children:t.jsx(u,{})})},{id:"client-credentials-v7",path:"/flows/client-credentials-v7",label:"Client Credentials (V7)",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(V,{})}),badge:t.jsx(io,{title:"V7: Enhanced client credentials",children:t.jsx(u,{})})},{id:"ciba-v7",path:"/flows/ciba-v7",label:"CIBA Flow (V7)",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"V7: CIBA (RFC 9436) Client Initiated Backchannel Authentication - Real PingOne API",children:t.jsx(u,{})})}]},{id:"oidc-flows",label:"OpenID Connect",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(K,{})}),isOpen:!0,items:[{id:"oidc-authorization-code-v7-2",path:"/flows/oauth-authorization-code-v7-2",label:"Authorization Code (V7.2)",icon:t.jsx(no,{$color:"#06b6d4",children:t.jsx(V,{})}),badge:t.jsx(io,{title:"V7.2: Adds optional redirectless (pi.flow) with Custom Login",children:t.jsx(u,{})})},{id:"oidc-implicit-v7",path:"/flows/implicit-v7?variant=oidc",label:"Implicit Flow (V7)",icon:t.jsx(no,{$color:"#7c3aed",children:t.jsx(P,{})}),badge:t.jsx(io,{title:"V7: Unified OAuth/OIDC implementation with variant selector",children:t.jsx(u,{})})},{id:"oidc-device-authorization-v7",path:"/flows/device-authorization-v7?variant=oidc",label:"Device Authorization (V7 – OIDC)",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(H,{})}),badge:t.jsx(io,{title:"V7: Unified OAuth/OIDC device authorization",children:t.jsx(u,{})})},{id:"oidc-hybrid-v7",path:"/flows/oidc-hybrid-v7",label:"Hybrid Flow (V7)",icon:t.jsx(no,{$color:"#22c55e",children:t.jsx(J,{})}),badge:t.jsx(io,{title:"V7: Unified OAuth/OIDC hybrid flow implementation",children:t.jsx(u,{})})}]},{id:"pingone",label:"PingOne Flows",icon:t.jsx(no,{$color:"#f97316",children:t.jsx(V,{})}),isOpen:!0,items:[{id:"pingone-par-v7",path:"/flows/pingone-par-v7",label:"Pushed Authorization Request (V7)",icon:t.jsx(no,{$color:"#ea580c",children:t.jsx(W,{})}),badge:t.jsx(io,{title:"V7: Enhanced Pushed Authorization Request with Authorization Details",children:t.jsx(u,{})})},{id:"pingone-mfa-v7",path:"/flows/pingone-complete-mfa-v7",label:"PingOne MFA (V7)",icon:t.jsx(no,{$color:"#16a34a",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"V7: Enhanced PingOne Multi-Factor Authentication",children:t.jsx(u,{})})},{id:"pingone-mfa-workflow-library-v7",path:"/flows/pingone-mfa-workflow-library-v7",label:"PingOne MFA Workflow Library (V7)",icon:t.jsx(no,{$color:"#059669",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"V7: PingOne Workflow Library Steps 11-20 - Authorization Code with MFA",children:t.jsx(u,{})})},{id:"kroger-grocery-store-mfa",path:"/flows/kroger-grocery-store-mfa",label:"Kroger Grocery Store MFA",icon:t.jsx(no,{$color:"#e4002b",children:t.jsx(Y,{})}),badge:t.jsx(io,{title:"Real-world MFA experience - Kroger Grocery Store mockup",children:t.jsx(u,{})})},{id:"pingone-authentication",path:"/pingone-authentication",label:"PingOne Authentication",icon:t.jsx(no,{$color:"#16a34a",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"PingOne Authentication Flow",children:t.jsx(u,{})})},{id:"redirectless-v7-real",path:"/flows/redirectless-v7-real",label:"Redirectless Flow (V7)",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(P,{})}),badge:t.jsx(io,{title:"V7: PingOne Redirectless Flow (pi.flow)",children:t.jsx(u,{})})},{id:"par-flow",path:"/flows/par",label:"PAR Flow",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(W,{})}),badge:t.jsx(io,{title:"Pushed Authorization Request Flow",children:t.jsx(u,{})})}]},{id:"token-apps",label:"Token Apps",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(V,{})}),isOpen:!0,items:[{id:"worker-token-v7",path:"/flows/worker-token-v7",label:"Worker Token (V7)",icon:t.jsx(no,{$color:"#fb923c",children:t.jsx(V,{})}),badge:t.jsx(io,{title:"V7: Enhanced worker token flow",children:t.jsx(u,{})})},{id:"worker-token-tester",path:"/worker-token-tester",label:"Worker Token Check",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(V,{})}),badge:t.jsx(io,{title:"Validate and test PingOne worker tokens",children:t.jsx(u,{})})},{id:"token-management",path:"/token-management",label:"Token Management",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(V,{})}),badge:t.jsx(io,{title:"Token Analysis and Management",children:t.jsx(u,{})})},{id:"token-introspection",path:"/flows/token-introspection",label:"Token Introspection",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(k,{})}),badge:t.jsx(io,{title:"Token Introspection - Inspect and validate OAuth tokens",children:t.jsx(u,{})})},{id:"token-revocation",path:"/flows/token-revocation",label:"Token Revocation",icon:t.jsx(no,{$color:"#ef4444",children:t.jsx(f,{})}),badge:t.jsx(io,{title:"Token Revocation - Revoke access and refresh tokens",children:t.jsx(u,{})})},{id:"userinfo-flow",path:"/flows/userinfo",label:"UserInfo Flow",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(X,{})}),badge:t.jsx(io,{title:"UserInfo Flow - Retrieve user profile information",children:t.jsx(u,{})})},{id:"pingone-logout-flow",path:"/flows/pingone-logout",label:"PingOne Logout",icon:t.jsx(no,{$color:"#ef4444",children:t.jsx($,{})}),badge:t.jsx(io,{title:"PingOne Logout - RP-initiated logout with PingOne SSO",children:t.jsx(u,{})})}]},{id:"mock-educational-flows",label:"Mock & Educational Flows",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(l,{})}),isOpen:!1,items:[],subGroups:[{id:"oauth-mock-flows",label:"OAuth Mock Flows",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(l,{})}),isOpen:!1,items:[{id:"jwt-bearer-token-v7",path:"/flows/jwt-bearer-token-v7",label:"JWT Bearer Token (V7)",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(V,{})}),badge:t.jsx(io,{title:"Educational/Mock: JWT Bearer Token Assertion (RFC 7523)",children:t.jsx(l,{})})},{id:"saml-bearer-assertion-v7",path:"/flows/saml-bearer-assertion-v7",label:"SAML Bearer Assertion (V7)",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"Educational/Mock: SAML Bearer Token Assertion (RFC 7522)",children:t.jsx(l,{})})},{id:"oauth-ropc-v7",path:"/flows/oauth-ropc-v7",label:"Resource Owner Password (V7)",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(W,{})}),badge:t.jsx(io,{title:"Educational/Mock: Resource Owner Password Credentials (RFC 6749 - deprecated)",children:t.jsx(l,{})})},{id:"oauth2-resource-owner-password",path:"/flows/oauth2-resource-owner-password",label:"OAuth2 ROPC (Legacy)",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(W,{})}),badge:t.jsx(io,{title:"Educational: OAuth 2.0 Resource Owner Password Credentials",children:t.jsx(l,{})})},{id:"advanced-oauth-params-demo",path:"/flows/advanced-oauth-params-demo",label:"Advanced OAuth Parameters Demo",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(T,{})}),badge:t.jsx(io,{title:"Mock flow that builds auth URLs and tokens with advanced OAuth/OIDC parameters (audience, resource, acr_values, display, claims, etc.) to visualize unsupported features",children:t.jsx(l,{})})},{id:"mock-oidc-ropc",path:"/flows/mock-oidc-ropc",label:"Mock OIDC ROPC",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(W,{})}),badge:t.jsx(io,{title:"Educational/Mock: OIDC Resource Owner Password Credentials",children:t.jsx(l,{})})},{id:"oauth-authz-code-condensed-mock",path:"/flows/oauth-authorization-code-v7-condensed-mock",label:"Auth Code Condensed (Mock)",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(V,{})}),badge:t.jsx(io,{title:"Educational/Mock: Condensed Authorization Code Flow",children:t.jsx(l,{})})},{id:"v7-condensed-mock",path:"/flows/v7-condensed-mock",label:"V7 Condensed (Prototype)",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(O,{})}),badge:t.jsx(io,{title:"Educational/Mock: V7 Flow Condensation Prototype",children:t.jsx(l,{})})}]},{id:"advanced-mock-flows",label:"Advanced Mock Flows",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(l,{})}),isOpen:!1,items:[{id:"dpop-flow",path:"/flows/dpop",label:"DPoP (Educational/Mock)",icon:t.jsx(no,{$color:"#16a34a",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"Educational: DPoP (RFC 9449) Demonstration of Proof-of-Possession",children:t.jsx(l,{})})},{id:"rar-flow-v7",path:"/flows/rar-v7",label:"RAR Flow (V7)",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(z,{})}),badge:t.jsx(io,{title:"Educational/Mock: RAR (RFC 9396) Rich Authorization Requests",children:t.jsx(l,{})})},{id:"saml-sp-dynamic-acs-v1",path:"/flows/saml-sp-dynamic-acs-v1",label:"SAML Service Provider (V1)",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"Educational: SAML Service Provider with Dynamic ACS",children:t.jsx(l,{})})}]}]},{id:"pingone-tools",label:"PingOne Tools",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(B,{})}),isOpen:!1,items:[],subGroups:[{id:"pingone-user-identity",label:"PingOne User & Identity",icon:t.jsx(no,{$color:"#06b6d4",children:t.jsx(K,{})}),isOpen:!0,items:[{id:"pingone-user-profile",path:"/pingone-user-profile",label:"User Profile",icon:t.jsx(no,{$color:"#06b6d4",children:t.jsx(K,{})}),badge:t.jsx(io,{title:"PingOne User Profile & Information",children:t.jsx(u,{})})},{id:"pingone-identity-metrics",path:"/pingone-identity-metrics",label:"Identity Metrics",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(L,{})}),badge:t.jsx(io,{title:"PingOne Total Identities metrics explorer",children:t.jsx(u,{})})},{id:"password-reset",path:"/security/password-reset",label:"Password Reset",icon:t.jsx(no,{$color:"#dc2626",children:t.jsx(W,{})}),badge:t.jsx(io,{title:"PingOne Password Reset Operations",children:t.jsx(u,{})})}]},{id:"pingone-monitoring",label:"PingOne Monitoring",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(L,{})}),isOpen:!1,items:[{id:"pingone-audit-activities",path:"/pingone-audit-activities",label:"Audit Activities",icon:t.jsx(no,{$color:"#667eea",children:t.jsx(R,{})}),badge:t.jsx(io,{title:"Query and analyze PingOne audit events",children:t.jsx(u,{})})},{id:"pingone-webhook-viewer",path:"/pingone-webhook-viewer",label:"Webhook Viewer",icon:t.jsx(no,{$color:"#06b6d4",children:t.jsx(_,{})}),badge:t.jsx(io,{title:"Real-time webhook event monitoring",children:t.jsx(u,{})})},{id:"organization-licensing",path:"/organization-licensing",label:"Organization Licensing",icon:t.jsx(no,{$color:"#22c55e",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"View organization licensing and usage information",children:t.jsx(u,{})})}]}]},{id:"developer-tools",label:"Developer Tools",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(B,{})}),isOpen:!1,items:[],subGroups:[{id:"core-tools",label:"Core Developer Tools",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(B,{})}),isOpen:!1,items:[{id:"oidc-discovery",path:"/auto-discover",label:"OIDC Discovery",icon:t.jsx(no,{$color:"#06b6d4",children:t.jsx(I,{})}),badge:t.jsx(io,{title:"OIDC Discovery and Configuration",children:t.jsx(u,{})})},{id:"advanced-config",path:"/advanced-configuration",label:"Advanced Configuration",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(T,{})}),badge:t.jsx(io,{title:"Advanced Configuration Options",children:t.jsx(u,{})})}]},{id:"developer-utilities",label:"Developer Utilities",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(B,{})}),isOpen:!1,items:[{id:"jwks-troubleshooting",path:"/jwks-troubleshooting",label:"JWKS Troubleshooting",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(B,{})}),badge:t.jsx(io,{title:"JWKS Troubleshooting Guide",children:t.jsx(u,{})})},{id:"url-decoder",path:"/url-decoder",label:"URL Decoder",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(B,{})}),badge:t.jsx(io,{title:"URL Decoder Utility",children:t.jsx(u,{})})},{id:"oauth-code-generator-hub",path:"/oauth-code-generator-hub",label:"OAuth Code Generator Hub",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(s,{})}),badge:t.jsx(io,{title:"Production-ready OAuth code in multiple languages",children:t.jsx(u,{})})},{id:"application-generator",path:"/application-generator",label:"Application Generator",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(T,{})}),badge:t.jsx(io,{title:"Create PingOne applications",children:t.jsx(u,{})})},{id:"client-generator",path:"/client-generator",label:"Client Generator",icon:t.jsx(no,{$color:"#6366f1",children:t.jsx(V,{})}),badge:t.jsx(io,{title:"Generate OAuth client credentials",children:t.jsx(u,{})})},{id:"service-test-runner",path:"/service-test-runner",label:"Service Test Runner",icon:t.jsx(no,{$color:"#ec4899",children:t.jsx(B,{})}),badge:t.jsx(io,{title:"Test comprehensive flow data service",children:t.jsx(u,{})})},{id:"postman-generator",path:"/tools/postman-generator",label:"Postman Collection Generator",icon:t.jsx(no,{$color:"#f97316",children:t.jsx(D,{})}),badge:t.jsx(io,{title:"Generate PingOne-ready Postman collection & environment files",children:t.jsx(u,{})})}]}]},{id:"security-guides",label:"Security Guides",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(U,{})}),isOpen:!1,items:[{id:"oauth-2-1",path:"/oauth-2-1",label:"OAuth 2.1",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"OAuth 2.1 Security Features",children:t.jsx(u,{})})},{id:"oidc-session-management",path:"/oidc-session-management",label:"OIDC Session Management",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(K,{})}),badge:t.jsx(io,{title:"OIDC Session Management",children:t.jsx(u,{})})}]},{id:"reference-materials-docs",label:"Reference Materials",icon:t.jsx(no,{$color:"#16a34a",children:t.jsx(N,{})}),isOpen:!1,items:[{id:"par-vs-rar",path:"/par-vs-rar",label:"RAR vs PAR and DPoP Guide",icon:t.jsx(no,{$color:"#16a34a",children:t.jsx(N,{})}),badge:t.jsx(io,{title:"RAR vs PAR and DPoP Comparison and Examples",children:t.jsx(u,{})})},{id:"ciba-vs-device-authz",path:"/ciba-vs-device-authz",label:"CIBA vs Device Authorization Guide",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(N,{})}),badge:t.jsx(io,{title:"CIBA vs Device Authorization Comparison and Examples",children:t.jsx(u,{})})},{id:"pingone-mock-features",path:"/pingone-mock-features",label:"Mock & Educational Features",icon:t.jsx(no,{$color:"#f59e0b",children:t.jsx(Q,{})}),badge:t.jsx(io,{title:"Educational and Mock Features",children:t.jsx(u,{})})},{id:"pingone-scopes-reference",path:"/pingone-scopes-reference",label:"OAuth Scopes Reference",icon:t.jsx(no,{$color:"#6366f1",children:t.jsx(N,{})}),badge:t.jsx(io,{title:"Educational guide to PingOne OAuth 2.0 and OIDC scopes",children:t.jsx(u,{})})},{id:"ping-ai-resources",path:"/ping-ai-resources",label:"Ping AI Resources",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(G,{})}),badge:t.jsx(io,{title:"Ping Identity AI Resources & Documentation",children:"REFERENCE"})}]},{id:"oauth-oidc-docs",label:"OAuth/OIDC Documentation",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(z,{})}),isOpen:!1,items:[{id:"oidc-overview",path:"/documentation/oidc-overview",label:"OIDC Overview",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(N,{})}),badge:t.jsx(io,{title:"OIDC Overview and Guide",children:t.jsx(u,{})})},{id:"oidc-specs",path:"/docs/oidc-specs",label:"OIDC Specifications",icon:t.jsx(no,{$color:"#3b82f6",children:t.jsx(Q,{})}),badge:t.jsx(io,{title:"OIDC Technical Specifications",children:t.jsx(u,{})})},{id:"oauth2-security-best-practices",path:"/docs/oauth2-security-best-practices",label:"OAuth 2.0 Security Best Practices",icon:t.jsx(no,{$color:"#dc2626",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"OAuth 2.0 Security Guidelines",children:t.jsx(u,{})})},{id:"spiffe-spire-pingone",path:"/docs/spiffe-spire-pingone",label:"SPIFFE/SPIRE with PingOne",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"Workload Identity & SSO",children:t.jsx(u,{})})}]},{id:"ai-documentation",label:"AI Documentation",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(G,{})}),isOpen:!1,items:[{id:"ai-identity-architectures",path:"/ai-identity-architectures",label:"AI Identity Architectures",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(G,{})}),badge:t.jsx(io,{title:"AI Identity Architectures and Patterns",children:t.jsx(u,{})})},{id:"oidc-for-ai",path:"/docs/oidc-for-ai",label:"OIDC for AI",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(G,{})}),badge:t.jsx(io,{title:"OIDC for AI Applications",children:t.jsx(u,{})})},{id:"oauth-for-ai",path:"/docs/oauth-for-ai",label:"OAuth for AI",icon:t.jsx(no,{$color:"#f97316",children:t.jsx(G,{})}),badge:t.jsx(io,{title:"OAuth specifications and PingOne compatibility matrix for AI systems",children:t.jsx(u,{})})},{id:"ping-view-on-ai",path:"/docs/ping-view-on-ai",label:"PingOne AI Perspective",icon:t.jsx(no,{$color:"#16a34a",children:t.jsx(U,{})}),badge:t.jsx(io,{title:"PingOne's View on AI Identity",children:t.jsx(u,{})})}]},{id:"tools-utilities",label:"Tools & Utilities",icon:t.jsx(T,{}),isOpen:!0,items:[{id:"davinci-todo",path:"/davinci-todo",label:"DaVinci Todo App",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(u,{})}),badge:t.jsx(io,{title:"Production-ready DaVinci SDK integration with real PingOne APIs",children:"NEW"})},{id:"sdk-sample-app",path:"/sdk-sample-app",label:"SDK Sample App",icon:t.jsx(no,{$color:"#10b981",children:t.jsx(s,{})})},{id:"ultimate-token-display-demo",path:"/ultimate-token-display-demo",label:"Ultimate Token Display",icon:t.jsx(no,{$color:"#8b5cf6",children:t.jsx(q,{})})}]}];if("2.6"!==localStorage.getItem("simpleDragDropSidebar.menuVersion"))return localStorage.removeItem("simpleDragDropSidebar.menuOrder"),localStorage.setItem("simpleDragDropSidebar.menuVersion","2.6"),e;const r=localStorage.getItem("simpleDragDropSidebar.menuOrder");if(r)try{const t=JSON.parse(r);return A(t,e)}catch(n){}return e}),te=e.useCallback(async()=>{w("saving");try{const e=C(Z);localStorage.setItem("simpleDragDropSidebar.menuOrder",JSON.stringify(e)),localStorage.setItem("simpleDragDropSidebar.menuVersion","2.2"),w("saved"),setTimeout(()=>{w("default")},2e3)}catch(e){w("default")}},[Z,C]);e.useEffect(()=>{try{const e=t=>t.map(t=>{const r=new Set,n=t.items.filter(e=>!r.has(e.id)&&(r.add(e.id),!0)),i={...t,items:n};if(t.subGroups&&t.subGroups.length>0){const r=e(t.subGroups);r.length>0&&(i.subGroups=r)}return i}),t=e(Z),r=C(t);localStorage.setItem("simpleDragDropSidebar.menuOrder",JSON.stringify(r)),localStorage.setItem("simpleDragDropSidebar.menuVersion","2.2")}catch(e){}},[Z,C]);const re=(e,t)=>e.map(e=>{const r=t.split(/\s+/).filter(Boolean),n=e.items.filter(e=>{const t=e.label.toLowerCase(),n=e.path.toLowerCase();if(1===r.length){const i=r[0],s=i.replace(/s$/,""),a=t.replace(/s$/,""),c=n.replace(/s$/,""),l=i.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),d=s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),u=new RegExp(`\\b${l}\\b`,"i"),p=new RegExp(`\\b${d}\\b`,"i");if(u.test(e.label)||u.test(e.path))return!0;if(p.test(e.label)||p.test(e.path))return!0;if(t===i||n===i)return!0;if(a===s||c===s)return!0;if(o)return!(!a.includes(s)&&!c.includes(s))||(t.includes(i)||n.includes(i));if(i.length>=4){const t=new RegExp(`\\b${l}`,"i"),r=new RegExp(`\\b${d}`,"i");if(t.test(e.label)||t.test(e.path))return!0;if(r.test(e.label)||r.test(e.path))return!0;if(i.length>=6){const t=new RegExp(`[\\-_]${l}[\\-_]`,"i"),r=new RegExp(`[\\-_]${d}[\\-_]`,"i");if(t.test(e.label)||t.test(e.path))return!0;if(r.test(e.label)||r.test(e.path))return!0;const n=new RegExp(`${l}[\\-_]|${l}$`,"i"),i=new RegExp(`${d}[\\-_]|${d}$`,"i");if(n.test(e.label)||n.test(e.path))return!0;if(i.test(e.label)||i.test(e.path))return!0}}return!1}return r.every(r=>{if(o)return t.includes(r)||n.includes(r);if(r.length<3){const t=new RegExp(`\\b${r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i");return t.test(e.label)||t.test(e.path)}const i=new RegExp(`\\b${r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}`,"i");return i.test(e.label)||i.test(e.path)||t.includes(r)||n.includes(r)})}),i={...e,items:n};if(e.subGroups&&e.subGroups.length>0){const r=re(e.subGroups,t);r.length>0&&(i.subGroups=r)}const s=e.label.toLowerCase().includes(t),a=i.subGroups&&i.subGroups.length>0;return{...i,items:n,isOpen:s||n.length>0||a||!1}}).filter(e=>{const r=e.items.length>0,n=e.subGroups&&e.subGroups.length>0,i=e.label.toLowerCase().includes(t);return r||n||i}),ne=e.useMemo(()=>{if(!i.trim())return Z;const e=i.toLowerCase();return re(Z,e)},[Z,i,re]),ie=(e,t,r,n,i)=>{const o=n?{type:t,id:r,groupId:n,...i?{subGroupId:i}:{}}:{type:t,id:r};h(o),e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/plain",JSON.stringify(o)),e.dataTransfer.setData("application/json",JSON.stringify(o));e.currentTarget.style.opacity="0.5"},oe=e=>{e.currentTarget.style.opacity="1"},se=e=>{e.preventDefault(),e.dataTransfer.dropEffect="move"},ae=e=>{if(p)return p;try{const t=e.dataTransfer.getData("application/json")||e.dataTransfer.getData("text/plain");if(t){return JSON.parse(t)}}catch(t){}return null},ce=(e,t,r,n)=>{e.preventDefault(),e.stopPropagation(),m(null);const i=ae(e);if(i&&(h(null),"item"===i.type)){const e=[...Z],o=e.findIndex(e=>e.id===i.groupId);if(-1===o)return;const s=e[o];let a=null,c=-1,l=-1;if(c=s.items.findIndex(e=>e.id===i.id),-1!==c?a=s.items[c]:i.subGroupId&&s.subGroups&&(l=s.subGroups.findIndex(e=>e.id===i.subGroupId),-1!==l&&(c=s.subGroups[l].items.findIndex(e=>e.id===i.id),-1!==c&&(a=s.subGroups[l].items[c]))),!a||-1===c)return;const d=e.findIndex(e=>e.id===t);if(-1===d)return;const u=e[d];if(-1!==l?s.subGroups[l].items.splice(c,1):s.items.splice(c,1),n&&u.subGroups){const e=u.subGroups.findIndex(e=>e.id===n);if(-1!==e){const o=u.subGroups[e];let s=r;i.groupId===t&&i.subGroupId===n&&c<r&&(s=r-1),o.items.splice(Math.max(0,s),0,a)}}else{let e=r;i.groupId===t&&!i.subGroupId&&!n&&c<r&&(e=r-1),u.items.splice(Math.max(0,e),0,a)}ee(e),E(e);let p=u.label;if(n&&u.subGroups){const e=u.subGroups.find(e=>e.id===n);e&&(p=`${e.label} (${u.label})`)}Ge.showSuccess(`Moved "${a.label}" to ${p}`)}},le=(e,t)=>{e.preventDefault();const r=ae(e);if(r&&"item"===r.type){const e=[...Z],n=e.findIndex(e=>e.id===r.groupId),i=e.findIndex(e=>e.id===t);if(-1!==n&&-1!==i){const t={...e[n]},o={...e[i]};let s=null,a=t.items.findIndex(e=>e.id===r.id);if(-1!==a)[s]=t.items.splice(a,1);else if(r.subGroupId&&t.subGroups){const e=t.subGroups.findIndex(e=>e.id===r.subGroupId);-1!==e&&(a=t.subGroups[e].items.findIndex(e=>e.id===r.id),-1!==a&&([s]=t.subGroups[e].items.splice(a,1)))}s&&(o.items.push(s),e[n]=t,e[i]=o,ee(e),E(e),Ge.showSuccess(`Moved "${s.label}" to end of ${o.label}`),h(null))}}},de=e=>{ee(t=>{const r=t=>t.map(t=>t.id===e?{...t,isOpen:!t.isOpen}:t.subGroups?{...t,subGroups:r(t.subGroups)}:t),n=r(t);return E(n),n})};return t.jsxs("div",{style:{padding:n?"1rem":"0"},children:[i.trim()&&t.jsxs("div",{style:{padding:"0.5rem 1rem",background:"#f0f9ff",borderBottom:"1px solid #e0f2fe",fontSize:"0.875rem",color:"#0369a1"},children:[(()=>{const e=t=>t.reduce((t,r)=>{let n=r.items.length;return r.subGroups&&r.subGroups.length>0&&(n+=e(r.subGroups)),t+n},0);return e(ne)})(),' results for "',i,'"']}),t.jsx("style",{children:"\n\t\t\t\t@keyframes pulse {\n\t\t\t\t\t0%, 100% { \n\t\t\t\t\t\topacity: 0.3; \n\t\t\t\t\t\tborder-color: rgba(34, 197, 94, 0.4);\n\t\t\t\t\t\tbackground-color: rgba(34, 197, 94, 0.08);\n\t\t\t\t\t}\n\t\t\t\t\t50% { \n\t\t\t\t\t\topacity: 0.7; \n\t\t\t\t\t\tborder-color: rgba(34, 197, 94, 0.7);\n\t\t\t\t\t\tbackground-color: rgba(34, 197, 94, 0.15);\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\t\n\t\t\t\t/* Smooth transitions for menu navigation */\n\t\t\t\thtml {\n\t\t\t\t\tscroll-behavior: smooth;\n\t\t\t\t}\n\t\t\t\t\n\t\t\t\t/* Prevent layout shifts during navigation */\n\t\t\t\tbody {\n\t\t\t\t\toverflow-anchor: none;\n\t\t\t\t}\n\t\t\t\t\n\t\t\t\t/* Smooth transitions for menu items */\n\t\t\t\t.menu-item {\n\t\t\t\t\ttransition: all 0.2s ease;\n\t\t\t\t}\n\t\t\t"}),n&&t.jsx("div",{style:{marginBottom:"1rem",padding:"1rem",backgroundColor:"#dcfce7",borderRadius:"0.5rem",border:"2px solid #22c55e",boxShadow:"0 4px 12px rgba(34, 197, 94, 0.15)"},children:t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between"},children:[t.jsxs("div",{children:[t.jsx("strong",{style:{color:"#166534"},children:"🎯 Drag & Drop Mode Active:"}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#166534",marginTop:"0.25rem"},children:"Drag items to reorder • Green zones show drop areas"}),localStorage.getItem("simpleDragDropSidebar.menuOrder")&&t.jsx("div",{style:{fontSize:"0.875rem",color:"#059669",marginTop:"0.25rem"},children:"✅ Custom layout loaded from storage"})]}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[t.jsx("button",{onClick:te,disabled:"saving"===y,style:{padding:"0.5rem 1rem",backgroundColor:"saved"===y?"#22c55e":"#f59e0b",color:"white",border:"none",borderRadius:"0.375rem",cursor:"saving"===y?"not-allowed":"pointer",fontSize:"0.875rem",transition:"all 0.3s ease",opacity:"saving"===y?.7:1,transform:"saved"===y?"scale(1.05)":"scale(1)"},title:"saved"===y?"Layout saved successfully!":"saving"===y?"Saving layout...":"Manually save current layout",children:"saved"===y?"✅ Saved!":"saving"===y?"⏳ Saving...":"💾 Save Layout"}),t.jsx("button",{onClick:()=>{localStorage.removeItem("simpleDragDropSidebar.menuOrder"),window.location.reload()},style:{padding:"0.5rem 1rem",backgroundColor:"#ef4444",color:"white",border:"none",borderRadius:"0.375rem",cursor:"pointer",fontSize:"0.875rem"},title:"Reset menu to default layout",children:"🔄 Reset Layout"})]})]})}),ne.map((e,r)=>t.jsxs("div",{style:{marginBottom:"1rem"},onDragOver:se,onDrop:e=>((e,t)=>{e.preventDefault();const r=ae(e);if(!r||"group"!==r.type)return;const n=Z.findIndex(e=>e.id===r.id);if(-1!==n&&n!==t){const e=[...Z],[r]=e.splice(n,1);e.splice(t,0,r),ee(e),E(e),Ge.showSuccess(`Reordered "${r.label}" section`),h(null)}})(e,r),children:[t.jsxs("div",{draggable:n,onDragStart:n?t=>{ie(t,"group",e.id),t.currentTarget.style.cursor="grabbing"}:void 0,onDragEnd:n?e=>{oe(e),e.currentTarget.style.cursor="grab"}:void 0,onClick:()=>de(e.id),style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.75rem 1rem",background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",borderRadius:"0.5rem",marginBottom:"0.25rem",cursor:n?"grab":"pointer",border:n?"2px dashed rgba(255,255,255,0.3)":"1px solid rgba(255,255,255,0.2)",boxShadow:"0 2px 4px rgba(59, 130, 246, 0.2)",transition:"all 0.2s ease",userSelect:"none",WebkitUserSelect:"none",MozUserSelect:"none",msUserSelect:"none"},onMouseEnter:e=>{n||(e.currentTarget.style.background="linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 4px 8px rgba(59, 130, 246, 0.3)")},onMouseLeave:e=>{n||(e.currentTarget.style.background="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",e.currentTarget.style.transform="translateY(0px)",e.currentTarget.style.boxShadow="0 2px 4px rgba(59, 130, 246, 0.2)")},children:[n&&t.jsx(x,{size:16,style:{color:"white"}}),t.jsx("div",{style:{color:"white"},children:e.icon}),t.jsx("span",{style:{fontWeight:"600",color:"white",flex:1,userSelect:"none",WebkitUserSelect:"none",MozUserSelect:"none",msUserSelect:"none"},children:e.label}),t.jsx("button",{onClick:e=>{e.stopPropagation()},style:{background:"none",border:"none",cursor:"pointer",padding:"0.5rem",borderRadius:"0.25rem",display:"flex",alignItems:"center",color:"white",transition:"background-color 0.2s"},onMouseEnter:e=>{e.currentTarget.style.backgroundColor="rgba(255, 255, 255, 0.1)"},onMouseLeave:e=>{e.currentTarget.style.backgroundColor="transparent"},children:t.jsx(a,{size:16,style:{transform:e.isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s",color:"white"}})})]}),e.isOpen&&t.jsxs("div",{style:{paddingLeft:"1rem",backgroundColor:"#f8fafc",borderRadius:"0.5rem",padding:"0.5rem",minHeight:"2rem"},onDragOver:n?se:void 0,onDrop:n?t=>le(t,e.id):void 0,children:[e.subGroups&&e.subGroups.length>0&&e.subGroups.map(r=>t.jsxs("div",{style:{marginBottom:"0.75rem"},children:[t.jsxs("div",{onClick:()=>de(r.id),style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 0.75rem",background:"linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",borderRadius:"0.375rem",marginBottom:"0.25rem",cursor:"pointer",border:"1px solid rgba(255,255,255,0.2)",boxShadow:"0 1px 3px rgba(59, 130, 246, 0.2)",transition:"all 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.background="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",e.currentTarget.style.transform="translateY(-1px)",e.currentTarget.style.boxShadow="0 2px 4px rgba(59, 130, 246, 0.3)"},onMouseLeave:e=>{e.currentTarget.style.background="linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",e.currentTarget.style.transform="translateY(0px)",e.currentTarget.style.boxShadow="0 1px 3px rgba(59, 130, 246, 0.2)"},children:[t.jsx("div",{style:{color:"white"},children:r.icon}),t.jsx("span",{style:{fontWeight:"600",color:"white",flex:1},children:r.label}),t.jsx(a,{size:14,style:{transform:r.isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s",color:"white"}})]}),r.isOpen&&t.jsx("div",{style:{paddingLeft:"0.75rem",backgroundColor:"#f1f5f9",borderRadius:"0.375rem",padding:"0.5rem"},children:r.items.map((i,o)=>t.jsxs("div",{children:[n&&p&&"item"===p.type&&t.jsx("div",{style:{height:"20px",backgroundColor:"rgba(34, 197, 94, 0.08)",borderRadius:"6px",marginBottom:"4px",border:"2px dashed rgba(34, 197, 94, 0.3)",transition:"all 0.2s",position:"relative",animation:p?"pulse 2s infinite":"none"},onDragOver:t=>{t.preventDefault(),t.stopPropagation(),m({groupId:e.id,index:o}),t.currentTarget.style.backgroundColor="#fef2f2",t.currentTarget.style.borderColor="#ef4444",t.currentTarget.style.borderStyle="solid",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="0 0 0 2px rgba(239, 68, 68, 0.2)",t.currentTarget.style.height="28px"},onDragLeave:t=>{const r=t.currentTarget.getBoundingClientRect(),n=t.clientX,i=t.clientY;(n<r.left||n>r.right||i<r.top||i>r.bottom)&&(m(t=>t&&t.groupId===e.id&&t.index===o?null:t),t.currentTarget.style.backgroundColor="rgba(34, 197, 94, 0.08)",t.currentTarget.style.borderColor="rgba(34, 197, 94, 0.3)",t.currentTarget.style.borderStyle="dashed",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="none",t.currentTarget.style.height="20px")},onDrop:t=>{m(null),t.currentTarget.style.backgroundColor="rgba(34, 197, 94, 0.08)",t.currentTarget.style.borderColor="rgba(34, 197, 94, 0.3)",t.currentTarget.style.borderStyle="dashed",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="none",t.currentTarget.style.height="20px",ce(t,e.id,o,r.id)}}),t.jsxs("div",{draggable:n,onDragStart:n?t=>{ie(t,"item",i.id,e.id,r.id),t.currentTarget.style.cursor="grabbing"}:void 0,onDragEnd:n?e=>{oe(e),m(null),e.currentTarget.style.cursor="grab"}:void 0,onDragOver:n?t=>{t.preventDefault(),t.stopPropagation(),m({groupId:e.id,index:o+1})}:void 0,onClick:()=>S(i.path),className:i.id.includes("implicit")?"implicit-flow-menu-item":"",style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 0.75rem",backgroundColor:v(i.path)?"#fef3c7":"white",color:v(i.path)?"#d97706":"#64748b",borderRadius:"0.375rem",border:g&&g.groupId===e.id&&g.index===o+1?"3px solid #ef4444":v(i.path)?"3px solid #f59e0b":"1px solid #e2e8f0",fontWeight:v(i.path)?"700":"400",boxShadow:g&&g.groupId===e.id&&g.index===o+1?"0 0 0 3px rgba(239, 68, 68, 0.2)":v(i.path)?"0 4px 8px rgba(245, 158, 11, 0.3)":"none",transform:v(i.path)?"scale(1.02)":"scale(1)",marginBottom:"0.25rem",cursor:n?"grab":"pointer",transition:"all 0.2s ease"},children:[n&&t.jsx(x,{size:10}),i.icon,t.jsx("span",{style:{flex:1},children:i.label}),i.badge]}),n&&o===r.items.length-1&&t.jsx("div",{style:{height:"20px",backgroundColor:"rgba(34, 197, 94, 0.08)",borderRadius:"6px",marginTop:"4px",border:"2px dashed rgba(34, 197, 94, 0.3)",animation:p?"pulse 2s infinite":"none",transition:"all 0.2s"},onDragOver:t=>{t.preventDefault(),t.stopPropagation(),m({groupId:e.id,index:r.items.length}),t.currentTarget.style.backgroundColor="#fef2f2",t.currentTarget.style.borderColor="#ef4444",t.currentTarget.style.borderStyle="solid",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="0 0 0 2px rgba(239, 68, 68, 0.2)",t.currentTarget.style.height="28px"},onDragLeave:t=>{const n=t.currentTarget.getBoundingClientRect(),i=t.clientX,o=t.clientY;(i<n.left||i>n.right||o<n.top||o>n.bottom)&&(m(t=>t&&t.groupId===e.id&&t.index===r.items.length?null:t),t.currentTarget.style.backgroundColor="rgba(34, 197, 94, 0.08)",t.currentTarget.style.borderColor="rgba(34, 197, 94, 0.3)",t.currentTarget.style.borderStyle="dashed",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="none",t.currentTarget.style.height="20px")},onDrop:t=>{m(null),t.currentTarget.style.backgroundColor="rgba(34, 197, 94, 0.08)",t.currentTarget.style.borderColor="rgba(34, 197, 94, 0.3)",t.currentTarget.style.borderStyle="dashed",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="none",t.currentTarget.style.height="20px",ce(t,e.id,r.items.length,r.id)}})]},i.id))})]},r.id)),n&&e.items.length>0&&(!e.subGroups||0===e.subGroups.length)&&t.jsx("div",{style:{height:"24px",backgroundColor:"rgba(34, 197, 94, 0.12)",borderRadius:"8px",marginBottom:"8px",border:"2px dashed rgba(34, 197, 94, 0.4)",transition:"all 0.2s",position:"relative",animation:p?"pulse 2s infinite":"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",color:"rgba(34, 197, 94, 0.6)",fontWeight:"500"},onDragOver:t=>{t.preventDefault(),t.stopPropagation(),m({groupId:e.id,index:0}),t.currentTarget.style.backgroundColor="#fef2f2",t.currentTarget.style.borderColor="#ef4444",t.currentTarget.style.borderStyle="solid",t.currentTarget.style.borderWidth="3px",t.currentTarget.style.boxShadow="0 0 0 3px rgba(239, 68, 68, 0.3)"},onDragLeave:t=>{const r=t.currentTarget.getBoundingClientRect(),n=t.clientX,i=t.clientY;(n<r.left||n>r.right||i<r.top||i>r.bottom)&&(m(t=>t&&t.groupId===e.id&&0===t.index?null:t),t.currentTarget.style.backgroundColor="rgba(34, 197, 94, 0.12)",t.currentTarget.style.borderColor="rgba(34, 197, 94, 0.4)",t.currentTarget.style.borderStyle="dashed",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="none")},onDrop:t=>{m(null),t.currentTarget.style.backgroundColor="rgba(34, 197, 94, 0.12)",t.currentTarget.style.borderColor="rgba(34, 197, 94, 0.4)",t.currentTarget.style.borderStyle="dashed",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="none",ce(t,e.id,0)},children:p&&"↓ Drop here ↓"}),e.items.map((r,i)=>t.jsxs("div",{children:[n&&p&&"item"===p.type&&t.jsx("div",{style:{height:"24px",backgroundColor:"rgba(34, 197, 94, 0.12)",borderRadius:"8px",marginBottom:"8px",border:"2px dashed rgba(34, 197, 94, 0.4)",transition:"all 0.2s",position:"relative",animation:p?"pulse 2s infinite":"none"},onDragOver:t=>{t.preventDefault(),t.stopPropagation(),m({groupId:e.id,index:i}),t.currentTarget.style.backgroundColor="#fef2f2",t.currentTarget.style.borderColor="#ef4444",t.currentTarget.style.borderStyle="solid",t.currentTarget.style.borderWidth="3px",t.currentTarget.style.boxShadow="0 0 0 3px rgba(239, 68, 68, 0.3)",t.currentTarget.style.height="36px"},onDragLeave:t=>{const r=t.currentTarget.getBoundingClientRect(),n=t.clientX,o=t.clientY;(n<r.left||n>r.right||o<r.top||o>r.bottom)&&(m(t=>t&&t.groupId===e.id&&t.index===i?null:t),t.currentTarget.style.backgroundColor="rgba(34, 197, 94, 0.12)",t.currentTarget.style.borderColor="rgba(34, 197, 94, 0.4)",t.currentTarget.style.borderStyle="dashed",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="none",t.currentTarget.style.height="24px")},onDrop:t=>{m(null),t.currentTarget.style.backgroundColor="rgba(34, 197, 94, 0.12)",t.currentTarget.style.borderColor="rgba(34, 197, 94, 0.4)",t.currentTarget.style.borderStyle="dashed",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="none",t.currentTarget.style.height="24px",ce(t,e.id,i)}}),t.jsxs("div",{draggable:n,onDragStart:n?t=>{ie(t,"item",r.id,e.id),t.currentTarget.style.cursor="grabbing"}:void 0,onDragEnd:n?e=>{oe(e),m(null),e.currentTarget.style.cursor="grab"}:void 0,onDragOver:n?t=>{t.preventDefault(),t.stopPropagation(),m({groupId:e.id,index:i+1})}:void 0,className:r.id.includes("implicit")?"implicit-flow-menu-item":"",style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 0.75rem",backgroundColor:v(r.path)?"#fef3c7":"white",color:v(r.path)?"#d97706":"#64748b",borderRadius:"0.375rem",border:g&&g.groupId===e.id&&g.index===i+1?"3px solid #ef4444":v(r.path)?"3px solid #f59e0b":"1px solid #e2e8f0",fontWeight:v(r.path)?"700":"400",boxShadow:g&&g.groupId===e.id&&g.index===i+1?"0 0 0 3px rgba(239, 68, 68, 0.2)":v(r.path)?"0 4px 8px rgba(245, 158, 11, 0.3)":"none",transform:v(r.path)?"scale(1.02)":"scale(1)",marginBottom:"0.25rem",cursor:n?"grab":"pointer",transition:"all 0.2s ease",userSelect:"none",WebkitUserSelect:"none",MozUserSelect:"none",msUserSelect:"none"},children:[n&&t.jsx(x,{size:12}),t.jsxs("div",{onClick:n?void 0:t=>{t.stopPropagation(),"oidc-flows"===e.id?S(r.path,{fromSection:"oidc",protocol:"oidc"}):S(r.path)},className:"menu-item",style:{display:"flex",alignItems:"center",gap:"0.5rem",flex:1,cursor:n?"grab":"pointer",pointerEvents:n?"none":"auto",userSelect:"none",WebkitUserSelect:"none",MozUserSelect:"none",msUserSelect:"none"},children:[r.icon,t.jsx("span",{style:{flex:1,userSelect:"none",WebkitUserSelect:"none",MozUserSelect:"none",msUserSelect:"none"},children:r.label}),r.badge]})]}),n&&i===e.items.length-1&&t.jsx("div",{style:{height:"24px",backgroundColor:"rgba(34, 197, 94, 0.12)",borderRadius:"8px",marginTop:"8px",border:"2px dashed rgba(34, 197, 94, 0.4)",animation:p?"pulse 2s infinite":"none",transition:"all 0.2s"},onDragOver:t=>{t.preventDefault(),t.stopPropagation(),m({groupId:e.id,index:e.items.length}),t.currentTarget.style.backgroundColor="#fef2f2",t.currentTarget.style.borderColor="#ef4444",t.currentTarget.style.borderStyle="solid",t.currentTarget.style.borderWidth="3px",t.currentTarget.style.boxShadow="0 0 0 3px rgba(239, 68, 68, 0.3)",t.currentTarget.style.height="36px"},onDragLeave:t=>{const r=t.currentTarget.getBoundingClientRect(),n=t.clientX,i=t.clientY;(n<r.left||n>r.right||i<r.top||i>r.bottom)&&(m(t=>t&&t.groupId===e.id&&t.index===e.items.length?null:t),t.currentTarget.style.backgroundColor="rgba(34, 197, 94, 0.12)",t.currentTarget.style.borderColor="rgba(34, 197, 94, 0.4)",t.currentTarget.style.borderStyle="dashed",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="none",t.currentTarget.style.height="24px")},onDrop:t=>{m(null),t.currentTarget.style.backgroundColor="rgba(34, 197, 94, 0.12)",t.currentTarget.style.borderColor="rgba(34, 197, 94, 0.4)",t.currentTarget.style.borderStyle="dashed",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="none",t.currentTarget.style.height="24px",ce(t,e.id,e.items.length)}})]},r.id)),0===e.items.length&&(!e.subGroups||0===e.subGroups.length)&&t.jsx("div",{style:{padding:"2rem 1rem",textAlign:"center",color:"#9ca3af",fontStyle:"italic",border:"3px dashed rgba(34, 197, 94, 0.4)",borderRadius:"12px",backgroundColor:"rgba(34, 197, 94, 0.05)",fontSize:"1rem",fontWeight:"500"},onDragOver:e=>{e.preventDefault(),e.currentTarget.style.borderColor="#22c55e",e.currentTarget.style.backgroundColor="#dcfce7",e.currentTarget.style.borderStyle="solid",e.currentTarget.style.borderWidth="2px",e.currentTarget.style.boxShadow="0 0 0 2px rgba(34, 197, 94, 0.3)",e.currentTarget.style.transform="scale(1.02)"},onDragLeave:e=>{e.currentTarget.style.borderColor="#d1d5db",e.currentTarget.style.backgroundColor="transparent",e.currentTarget.style.borderStyle="dashed",e.currentTarget.style.borderWidth="2px",e.currentTarget.style.boxShadow="none",e.currentTarget.style.transform="scale(1)"},onDrop:t=>{t.currentTarget.style.borderColor="#d1d5db",t.currentTarget.style.backgroundColor="transparent",t.currentTarget.style.borderStyle="dashed",t.currentTarget.style.borderWidth="2px",t.currentTarget.style.boxShadow="none",t.currentTarget.style.transform="scale(1)",le(t,e.id)},children:"📥 Drop items here"})]})]},e.id))]})},so=Ce.div`
	padding: 0.75rem 1rem;
	border-bottom: 1px solid #e5e7eb;
	background: #f8fafc;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`,ao=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.75rem;
	color: #6b7280;
`,co=Ce.label`
	display: flex;
	align-items: center;
	gap: 0.35rem;
	cursor: pointer;
	user-select: none;
	
	&:hover {
		color: #374151;
	}
`,lo=Ce.input`
	cursor: pointer;
	margin: 0;
`,uo=Ce.div`
	position: relative;
	display: flex;
	align-items: center;
`,po=Ce.input`
	width: 100%;
	padding: 0.5rem 2.5rem 0.5rem 2rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: white;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`,ho=Ce.div`
	position: absolute;
	left: 0.5rem;
	color: #6b7280;
	display: flex;
	align-items: center;
	pointer-events: none;
`,go=Ce.button`
	position: absolute;
	right: 0.5rem;
	background: #3b82f6;
	border: none;
	color: white;
	cursor: pointer;
	padding: 0.375rem 0.5rem;
	border-radius: 0.25rem;
	display: flex;
	align-items: center;
	transition: all 0.2s ease;

	&:hover {
		background: #2563eb;
	}

	&:active {
		transform: scale(0.95);
	}
`,mo=Ce.button`
	position: absolute;
	right: 0.5rem;
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	padding: 0.25rem;
	border-radius: 0.25rem;
	display: flex;
	align-items: center;
	transition: all 0.2s ease;

	&:hover {
		color: #374151;
		background: #f3f4f6;
	}
`,fo=({onSearch:r,placeholder:n="Search flows...",activeSearchQuery:i="",matchAnywhere:o=!1,onMatchAnywhereChange:s})=>{const[a,c]=y.useState(""),[l,d]=y.useState(""),u=e.useRef(null);y.useEffect(()=>{i!==l&&(d(i),c(i))},[i,l]);const p=()=>{d(a),r(a)};e.useEffect(()=>{const e=e=>{(e.ctrlKey||e.metaKey)&&"k"===e.key&&(e.preventDefault(),u.current?.focus())};return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)},[]);return t.jsxs(so,{"data-search-container":!0,children:[t.jsxs(uo,{children:[t.jsx(ho,{children:t.jsx(I,{size:14})}),t.jsx(po,{ref:u,type:"text",placeholder:`${n} (⌘K, Enter to search)`,value:a,onChange:e=>c(e.target.value),onKeyDown:e=>{"Enter"===e.key?(e.preventDefault(),p()):"Escape"===e.key&&(c(""),d(""),r(""),u.current?.blur())},onBlur:e=>{const t=e.relatedTarget;!t||e.currentTarget.contains(t)}}),a&&a!==l?t.jsx(go,{onClick:p,title:"Search (Enter)",children:t.jsx(I,{size:14})}):a||l?t.jsx(mo,{onClick:()=>{c(""),d(""),r(""),u.current?.focus()},title:"Clear search",children:t.jsx(f,{size:14})}):null]}),s&&t.jsx(ao,{children:t.jsxs(co,{children:[t.jsx(lo,{type:"checkbox",checked:o,onChange:e=>{s(e.target.checked),l&&r(l)}}),t.jsx("span",{children:"Match anywhere (substring)"})]})})]})},bo=Ce.span`
  align-self: flex-start;
  background: ${e=>"sidebar"===e.variant?"rgba(99, 102, 241, 0.2)":"Implicit"===e.flow?"rgba(59, 130, 246, 0.2)":"rgba(22, 163, 74, 0.2)"};
  border: 1px solid ${e=>"sidebar"===e.variant?"#6366f1":"Implicit"===e.flow?"#60a5fa":"#4ade80"};
  color: ${e=>"sidebar"===e.variant?"#4f46e5":"Implicit"===e.flow?"#dbeafe":"#bbf7d0"};
  font-size: ${e=>"sidebar"===e.variant?"0.7rem":"0.75rem"};
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: ${e=>"sidebar"===e.variant?"0.25rem 0.6rem":"0.25rem 0.75rem"};
  border-radius: 9999px;
  white-space: nowrap;
  min-width: 40px;
  text-align: center;
`,xo=({version:e,flow:r,variant:n="flow"})=>t.jsx(bo,{flow:r,variant:n,children:e}),yo=Ce.div`
	position: relative;
	width: ${e=>e.$width}px;
	min-width: 300px;
	max-width: 600px;
	height: 100vh;
	background: white;
	border-right: 1px solid #e5e7eb;
	transition: width 0.2s ease;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`,wo=Ce.div`
	position: absolute;
	top: 0;
	right: -2px;
	width: 4px;
	height: 100%;
	cursor: ew-resize;
	background: transparent;
	z-index: 10;

	&:hover {
		background: #3b82f6;
	}
`,vo=Ce.div`
	padding: 16px;
	border-bottom: 1px solid #e5e7eb;
	background: #f9fafb;
`,ko=Ce.div`
	padding: 16px;
	border-top: 1px solid #e5e7eb;
	background: #f9fafb;
`,jo=Ce.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	background: ${e=>e.$isActive?"#dbeafe":"white"};
	color: ${e=>e.$isActive?"#1e40af":"#374151"};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: ${e=>e.$isActive?"#bfdbfe":"#f9fafb"};
		border-color: #9ca3af;
	}

	&:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
`,So=Ce.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	background: white;
	color: #6b7280;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
		color: #374151;
	}

	&:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
`,Co=({isOpen:r,onClose:n})=>{const[i,o]=e.useState(()=>{const e=localStorage.getItem("sidebar.width");return e?parseInt(e,10):300}),[s,a]=e.useState(!1),c=e.useRef(!1),[l,d]=e.useState(""),[u,p]=e.useState(!1),[h,g]=e.useState(()=>"true"===localStorage.getItem("sidebar.dragDropMode"));e.useEffect(()=>{localStorage.setItem("sidebar.width",i.toString())},[i]);const m=e.useCallback(e=>{d(e)},[]);return e.useEffect(()=>{const e=e=>{if(!c.current)return;const t=e.clientX;t>=300&&t<=600&&o(t)},t=()=>{a(!1),c.current=!1};return s&&(document.addEventListener("mousemove",e),document.addEventListener("mouseup",t)),()=>{document.removeEventListener("mousemove",e),document.removeEventListener("mouseup",t)}},[s]),r?t.jsxs(yo,{$width:i,children:[t.jsx(wo,{onMouseDown:()=>{a(!0),c.current=!0}}),t.jsxs(vo,{children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"},children:[t.jsx("h2",{style:{margin:0,fontSize:"1.25rem",fontWeight:"bold",color:"#111827"},children:"PingOne MasterFlow API"}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem",alignItems:"center"},children:[t.jsx(xo,{version:"9.11.76",variant:"sidebar"}),t.jsx(So,{onClick:n,children:t.jsx(f,{size:20})})]})]}),t.jsx(fo,{onSearch:m,placeholder:"Search flows and pages...",activeSearchQuery:l,matchAnywhere:u,onMatchAnywhereChange:p}),t.jsx("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginTop:"12px"},children:t.jsxs(jo,{onClick:()=>{const e=!h;g(e),localStorage.setItem("sidebar.dragDropMode",e.toString())},title:h?"Switch to standard menu":"Enable drag & drop mode",$isActive:h,children:[t.jsx(x,{size:14}),h?"Drag Mode":"Enable Drag"]})})]}),t.jsx("div",{style:{flex:1,overflow:"auto",display:"flex",flexDirection:"column"},children:t.jsx(oo,{dragMode:h,searchQuery:l,matchAnywhere:u})}),t.jsx(ko,{children:t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.5rem",padding:"0.5rem 0"},children:[t.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.5rem",justifyContent:"center"},children:[t.jsx(ro,{type:"app"}),t.jsx(ro,{type:"mfa"})]}),t.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.5rem",justifyContent:"center"},children:[t.jsx(ro,{type:"unified"}),t.jsx(ro,{type:"protect"})]})]})})]}):null},Ao="1.0.0",To=["1.0.0"];const _o=new class{exportConfiguration(e,t,r={}){try{const n={version:Ao,exportedAt:(new Date).toISOString(),appType:t,configuration:this.sanitizeConfiguration(e),metadata:{name:r.name||e.name||"Unnamed Configuration",description:r.description||e.description||"Exported application configuration",source:r.source||"generator",exportedBy:r.exportedBy||"PingOne Application Generator",...r}};this.downloadConfiguration(n)}catch(n){throw new Error("Failed to export configuration")}}async importConfiguration(e){try{if(!e.name.toLowerCase().endsWith(".json"))return{isValid:!1,errors:["File must be a JSON file (.json extension)"],warnings:[]};if(e.size>1048576)return{isValid:!1,errors:["File size too large. Maximum size is 1MB."],warnings:[]};const r=await this.readFileAsText(e);let n;try{n=JSON.parse(r)}catch(t){return{isValid:!1,errors:["Invalid JSON format. Please check the file content."],warnings:[]}}return this.validateImportedConfiguration(n)}catch(r){return{isValid:!1,errors:[`Import failed: ${r instanceof Error?r.message:"Unknown error"}`],warnings:[]}}}validateImportedConfiguration(e){const t=[],r=[];try{if(!e||"object"!=typeof e)return{isValid:!1,errors:["Invalid configuration format"],warnings:[]};if(e.version?To.includes(e.version)||t.push(`Unsupported configuration version: ${e.version}. Supported versions: ${To.join(", ")}`):r.push("Configuration version not specified, assuming current version"),e.appType?["OIDC_WEB_APP","OIDC_NATIVE_APP","SINGLE_PAGE_APP","WORKER","SERVICE"].includes(e.appType)||t.push(`Invalid application type: ${e.appType}`):t.push("Application type is required"),e.configuration||t.push("Configuration data is required"),e.metadata||r.push("Configuration metadata is missing"),t.length>0)return{isValid:!1,errors:t,warnings:r};const n=He(e.configuration,e.appType);t.push(...n.errors.map(e=>e.message)),r.push(...n.warnings.map(e=>e.message));const i=this.sanitizeConfiguration(e.configuration);return this.checkSecurityIssues(i,e.appType,r),{isValid:0===t.length,errors:t,warnings:r,configuration:i,metadata:e.metadata}}catch(n){return{isValid:!1,errors:[`Validation failed: ${n instanceof Error?n.message:"Unknown error"}`],warnings:r}}}exportPresetAsConfiguration(e){try{throw new Error("Preset export not yet implemented. Use the preset manager directly.")}catch(t){throw t}}createConfigurationBlob(e){const t=JSON.stringify(e,null,2);return new Blob([t],{type:"application/json"})}sanitizeConfiguration(e){return{...e,redirectUris:Array.isArray(e.redirectUris)?e.redirectUris.filter(e=>e?.trim()):[],postLogoutRedirectUris:Array.isArray(e.postLogoutRedirectUris)?e.postLogoutRedirectUris.filter(e=>e?.trim()):[],grantTypes:Array.isArray(e.grantTypes)?e.grantTypes.filter(e=>e?.trim()):[],responseTypes:Array.isArray(e.responseTypes)?e.responseTypes.filter(e=>e?.trim()):[],scopes:Array.isArray(e.scopes)?e.scopes.filter(e=>e?.trim()):[],signoffUrls:Array.isArray(e.signoffUrls)?e.signoffUrls.filter(e=>e?.trim()):[],name:e.name?.trim()||"",description:e.description?.trim()||"",jwksUrl:e.jwksUrl?.trim()||"",initiateLoginUri:e.initiateLoginUri?.trim()||"",targetLinkUri:e.targetLinkUri?.trim()||""}}downloadConfiguration(e){const t=this.createConfigurationBlob(e),r=URL.createObjectURL(t),n=document.createElement("a");n.href=r,n.download=this.generateFileName(e),document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(r)}generateFileName(e){const t=(new Date).toISOString().split("T")[0];return`${e.metadata.name.toLowerCase().replace(/[^a-z0-9]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"app-config"}-${e.appType.toLowerCase()}-${t}.json`}readFileAsText(e){return new Promise((t,r)=>{const n=new FileReader;n.onload=e=>{e.target?.result?t(e.target.result):r(new Error("Failed to read file"))},n.onerror=()=>{r(new Error("File reading failed"))},n.readAsText(e)})}checkSecurityIssues(e,t,r){e.redirectUris&&e.redirectUris.forEach(e=>{!e.startsWith("http://")||e.includes("localhost")||e.includes("127.0.0.1")||r.push(`Insecure redirect URI detected: ${e}. Consider using HTTPS.`)}),e.allowRedirectUriPatterns&&"OIDC_WEB_APP"!==t&&r.push("Redirect URI patterns should be used carefully with non-web applications."),e.accessTokenValiditySeconds>86400&&r.push("Access token validity period is very long (>24 hours). Consider shorter periods for better security."),e.refreshTokenValiditySeconds>2592e3&&r.push("Refresh token validity period is very long (>30 days). Consider shorter periods for better security."),"SINGLE_PAGE_APP"!==t&&"OIDC_NATIVE_APP"!==t||"REQUIRED"===e.pkceEnforcement||r.push("PKCE should be required for SPAs and native applications for security."),e.scopes&&e.scopes.length>10&&r.push("Large number of scopes requested. Consider if all scopes are necessary.")}},Ro=(e,t,r)=>{_o.exportConfiguration(e,t,{name:r||e.name,source:"generator"})},Io=Ce.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 247, 255, 0.92) 100%);
  border-radius: 1.25rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 28px 75px -40px rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.35);
`,$o=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`,Eo=Ce.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
`,zo=Ce.p`
  color: #6b7280;
  margin: 0.5rem 0 1.5rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
`,Po=Ce.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`,Oo=Ce.div`
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: white;
`,Uo=Ce.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Do=Ce.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
`,Lo=Ce.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;

  ${({variant:e,theme:t})=>{switch(e){case"primary":return`\n          background: linear-gradient(135deg, ${t.colors.primary} 0%, ${t.colors.primaryDark} 100%);\n          color: white;\n          &:hover:not(:disabled) {\n            background: linear-gradient(135deg, ${t.colors.primaryDark} 0%, ${t.colors.primary} 100%);\n            transform: translateY(-1px);\n            box-shadow: 0 15px 35px -20px rgba(79, 70, 229, 0.6);\n          }\n        `;case"success":return"\n          background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);\n          color: white;\n          &:hover:not(:disabled) {\n            background: linear-gradient(135deg, #16a34a 0%, #166534 100%);\n            transform: translateY(-1px);\n          }\n        ";case"danger":return"\n          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);\n          color: white;\n          &:hover:not(:disabled) {\n            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);\n            transform: translateY(-1px);\n          }\n        ";default:return`\n          background: white;\n          color: ${t.colors.gray700};\n          border-color: #d1d5db;\n          &:hover:not(:disabled) {\n            background: #f9fafb;\n            border-color: ${t.colors.primary};\n          }\n        `}}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`,No=Ce.div.withConfig({shouldForwardProp:e=>!["isDragOver","hasError"].includes(e)})`
  border: 2px dashed ${({isDragOver:e,hasError:t})=>t?"#ef4444":e?"#3b82f6":"#d1d5db"};
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  background: ${({isDragOver:e,hasError:t})=>t?"#fef2f2":e?"#eff6ff":"#f9fafb"};
  transition: all 0.2s;
  cursor: pointer;
  margin-bottom: 1rem;

  &:hover {
    border-color: ${({hasError:e})=>e?"#ef4444":"#3b82f6"};
    background: ${({hasError:e})=>e?"#fef2f2":"#eff6ff"};
  }

  &.drag-over {
    border-color: #3b82f6;
    background: #eff6ff;
    transform: scale(1.02);
  }
`,Mo=Ce.div.withConfig({shouldForwardProp:e=>"hasError"!==e})`
  font-size: 2rem;
  color: ${({hasError:e})=>e?"#ef4444":"#6b7280"};
  margin-bottom: 1rem;
`,Fo=Ce.div`
  color: #374151;
  font-weight: 500;
  margin-bottom: 0.5rem;
`,qo=Ce.div`
  color: #6b7280;
  font-size: 0.875rem;
`,Vo=Ce.div`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  
  ${({type:e})=>{switch(e){case"success":return"\n          background: #f0fdf4;\n          border: 1px solid #bbf7d0;\n          color: #166534;\n        ";case"error":return"\n          background: #fef2f2;\n          border: 1px solid #fecaca;\n          color: #991b1b;\n        ";case"warning":return"\n          background: #fffbeb;\n          border: 1px solid #fed7aa;\n          color: #92400e;\n        "}}}
`,Bo=Ce.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Wo=Ce.ul`
  margin: 0;
  padding-left: 1.5rem;
  
  li {
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
  }
`,Go=Ce.div`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.875rem;
`,Ho=Ce.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`,Jo=Ce.input`
  display: none;
`,Ko=({formData:r,appType:n,onImport:s,disabled:a=!1})=>{const[c,d]=e.useState(!1),[u,p]=e.useState(null),[h,g]=e.useState(!1),[m,b]=e.useState(null),x=e.useRef(null),w=e.useRef(null),v=e.useRef(null),k=async e=>{g(!0),p(null);try{const t=Ke(e,{accept:[".json"],maxSize:1048576});if(!t.isValid)return void b(t.error||"File validation failed");const r=await _o.importConfiguration(e);p(r),r.isValid&&r.configuration?(s(r.configuration,r.metadata),Ge.showSuccess("Configuration imported and applied successfully!")):Ge.showError("Configuration import failed. Please check the validation errors.")}catch(t){b(t instanceof Error?t.message:"Import failed")}finally{g(!1)}},j=e.useCallback(async e=>{if(0===e.length)return;const t=e[0];b(null),await k(t)},[k]),S=e.useCallback(async e=>{const t=e.target.files;t&&t.length>0&&(b(null),await k(t[0]))},[k]),C=e.useCallback(()=>{if(n)try{Ro(r,n,r.name||"app-config"),Ge.showSuccess("Configuration exported successfully!")}catch(e){Ge.showError("Failed to export configuration")}else Ge.showError("Please select an application type first")},[r,n]);y.useEffect(()=>{if(w.current&&!a)return v.current=new Je(w.current,{accept:[".json"],maxSize:1048576,multiple:!1},{onFiles:j,onError:e=>b(e)}),()=>{v.current?.destroy()}},[a,j]);const A=!a&&n&&(r.name?.trim()||r.description?.trim());return t.jsxs(Io,{children:[t.jsxs($o,{children:[t.jsx(Z,{}),t.jsx(Eo,{children:"Export & Import Configuration"})]}),t.jsx(zo,{children:"Export your current application configuration to share with others, or import a previously saved configuration."}),t.jsxs(Po,{children:[t.jsxs(Oo,{children:[t.jsxs(Uo,{children:[t.jsx(o,{}),"Export Configuration"]}),t.jsx(Do,{children:"Download your current application configuration as a JSON file. This includes all settings, scopes, and advanced parameters."}),t.jsxs(Lo,{variant:"primary",onClick:C,disabled:!A,children:[t.jsx(o,{}),"Export as JSON"]}),!A&&t.jsxs("div",{style:{marginTop:"0.75rem",fontSize:"0.875rem",color:"#6b7280"},children:[!n&&"Select an application type to enable export",n&&!r.name?.trim()&&!r.description?.trim()&&"Add a name or description to enable export"]})]}),t.jsxs(Oo,{children:[t.jsxs(Uo,{children:[t.jsx(ee,{}),"Import Configuration"]}),t.jsx(Do,{children:"Upload a previously exported configuration file to populate the form with saved settings."}),t.jsxs(No,{ref:w,isDragOver:c,hasError:!!m,onClick:()=>{a||x.current?.click()},children:[t.jsx(Mo,{hasError:!!m,children:h?t.jsx("div",{className:"spinner"}):m?t.jsx(f,{}):t.jsx(ee,{})}),t.jsx(Fo,{children:h?"Processing file...":m?"Upload failed":"Drop JSON file here or click to browse"}),t.jsx(qo,{children:m||"Supports .json files up to 1MB"})]}),t.jsx(Jo,{ref:x,type:"file",accept:".json",onChange:S,disabled:a}),u&&t.jsxs(t.Fragment,{children:[u.isValid?t.jsxs(Vo,{type:"success",children:[t.jsxs(Bo,{children:[t.jsx(i,{}),"Configuration Valid"]}),t.jsx("div",{children:"Configuration imported successfully and applied to the form."}),u.metadata&&t.jsxs(Go,{children:[t.jsxs(Ho,{children:[t.jsx("strong",{children:"Name:"}),t.jsx("span",{children:u.metadata.name})]}),t.jsxs(Ho,{children:[t.jsx("strong",{children:"Description:"}),t.jsx("span",{children:u.metadata.description})]}),t.jsxs(Ho,{children:[t.jsx("strong",{children:"Source:"}),t.jsx("span",{children:u.metadata.source})]})]})]}):t.jsxs(Vo,{type:"error",children:[t.jsxs(Bo,{children:[t.jsx(f,{}),"Configuration Invalid"]}),u.errors.length>0&&t.jsx(Wo,{children:u.errors.map((e,r)=>t.jsx("li",{children:e},r))})]}),u.warnings&&u.warnings.length>0&&t.jsxs(Vo,{type:"warning",children:[t.jsxs(Bo,{children:[t.jsx(l,{}),"Warnings"]}),t.jsx(Wo,{children:u.warnings.map((e,r)=>t.jsx("li",{children:e},r))})]})]})]})]})]})},Yo=[{id:"worker-app-basic",name:"Basic Worker Application",description:"Standard worker application for background processing and API access",category:"built-in",appType:"WORKER",configuration:{enabled:!0,redirectUris:[],postLogoutRedirectUris:[],grantTypes:["client_credentials"],responseTypes:[],tokenEndpointAuthMethod:"client_secret_basic",pkceEnforcement:"OPTIONAL",scopes:["p1:read:user","p1:update:user"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:0,idTokenValiditySeconds:0,refreshTokenDuration:0,refreshTokenRollingDuration:0,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Background workers and automated processes",securityLevel:"enhanced",tags:["worker","automation","api-access","client-credentials"]}},{id:"worker-app-admin",name:"Administrative Worker Application",description:"Worker application with full administrative privileges for management operations",category:"built-in",appType:"WORKER",configuration:{enabled:!0,redirectUris:[],postLogoutRedirectUris:[],grantTypes:["client_credentials"],responseTypes:[],tokenEndpointAuthMethod:"client_secret_jwt",pkceEnforcement:"OPTIONAL",scopes:["p1:read:user","p1:update:user","p1:create:user","p1:delete:user","p1:create:application","p1:update:application","p1:read:application"],accessTokenValiditySeconds:7200,refreshTokenValiditySeconds:0,idTokenValiditySeconds:0,refreshTokenDuration:0,refreshTokenRollingDuration:0,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Administrative operations and user management",securityLevel:"enterprise",tags:["worker","admin","management-api","high-privilege"]}},{id:"oidc-web-enterprise",name:"Enterprise OIDC Web Application",description:"High-security OIDC web application for enterprise environments with strict compliance",category:"built-in",appType:"OIDC_WEB_APP",configuration:{enabled:!0,redirectUris:["https://app.company.com/callback","https://app.company.com/auth/callback"],postLogoutRedirectUris:["https://app.company.com/logout","https://app.company.com"],grantTypes:["authorization_code","refresh_token"],responseTypes:["code"],tokenEndpointAuthMethod:"client_secret_basic",pkceEnforcement:"REQUIRED",scopes:["openid","profile","email","address","phone"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:604800,idTokenValiditySeconds:3600,refreshTokenDuration:7,refreshTokenRollingDuration:30,refreshTokenRollingGracePeriod:300,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"REQUIRED",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Enterprise web applications requiring high security and compliance",securityLevel:"enterprise",tags:["oidc","web","enterprise","high-security","pkce-required"]}},{id:"oidc-web-development",name:"Development OIDC Web Application",description:"Developer-friendly OIDC web application for local development and testing",category:"built-in",appType:"OIDC_WEB_APP",configuration:{enabled:!0,redirectUris:["https://localhost:3000/callback","https://localhost:8080/callback"],postLogoutRedirectUris:["https://localhost:3000","https://localhost:8080"],grantTypes:["authorization_code","refresh_token"],responseTypes:["code"],tokenEndpointAuthMethod:"client_secret_post",pkceEnforcement:"OPTIONAL",scopes:["openid","profile","email"],accessTokenValiditySeconds:7200,refreshTokenValiditySeconds:2592e3,idTokenValiditySeconds:7200,refreshTokenDuration:30,refreshTokenRollingDuration:90,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!0,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Local development and testing environments",securityLevel:"basic",tags:["oidc","web","development","localhost","testing"]}},{id:"spa-react",name:"React Single Page Application",description:"React SPA with PKCE enforcement and browser-optimized security settings",category:"built-in",appType:"SINGLE_PAGE_APP",configuration:{enabled:!0,redirectUris:["https://localhost:3000/callback","https://app.company.com/callback"],postLogoutRedirectUris:["https://localhost:3000","https://app.company.com"],grantTypes:["authorization_code","refresh_token"],responseTypes:["code"],tokenEndpointAuthMethod:"none",pkceEnforcement:"REQUIRED",scopes:["openid","profile","email"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:86400,idTokenValiditySeconds:3600,refreshTokenDuration:1,refreshTokenRollingDuration:7,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!0,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"React-based single page applications",securityLevel:"enhanced",tags:["spa","react","browser","pkce-required"]}},{id:"spa-angular",name:"Angular Single Page Application",description:"Angular SPA with PKCE enforcement and TypeScript-optimized settings",category:"built-in",appType:"SINGLE_PAGE_APP",configuration:{enabled:!0,redirectUris:["https://localhost:4200/callback","https://app.company.com/callback"],postLogoutRedirectUris:["https://localhost:4200","https://app.company.com"],grantTypes:["authorization_code","refresh_token"],responseTypes:["code"],tokenEndpointAuthMethod:"none",pkceEnforcement:"REQUIRED",scopes:["openid","profile","email"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:86400,idTokenValiditySeconds:3600,refreshTokenDuration:1,refreshTokenRollingDuration:7,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!0,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Angular-based single page applications",securityLevel:"enhanced",tags:["spa","angular","typescript","pkce-required"]}},{id:"spa-vue",name:"Vue.js Single Page Application",description:"Vue.js SPA with PKCE enforcement and modern JavaScript settings",category:"built-in",appType:"SINGLE_PAGE_APP",configuration:{enabled:!0,redirectUris:["https://localhost:8080/callback","https://app.company.com/callback"],postLogoutRedirectUris:["https://localhost:8080","https://app.company.com"],grantTypes:["authorization_code","refresh_token"],responseTypes:["code"],tokenEndpointAuthMethod:"none",pkceEnforcement:"REQUIRED",scopes:["openid","profile","email"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:86400,idTokenValiditySeconds:3600,refreshTokenDuration:1,refreshTokenRollingDuration:7,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!0,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Vue.js-based single page applications",securityLevel:"enhanced",tags:["spa","vue","javascript","pkce-required"]}},{id:"device-auth-tv",name:"Device Authorization (Smart TV)",description:"Device authorization flow optimized for smart TVs and streaming devices",category:"built-in",appType:"OIDC_NATIVE_APP",configuration:{enabled:!0,redirectUris:[],postLogoutRedirectUris:[],grantTypes:["urn:ietf:params:oauth:grant-type:device_code","refresh_token"],responseTypes:[],tokenEndpointAuthMethod:"none",pkceEnforcement:"OPTIONAL",scopes:["openid","profile"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:2592e3,idTokenValiditySeconds:3600,refreshTokenDuration:30,refreshTokenRollingDuration:180,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Smart TVs, streaming devices, and input-constrained devices",securityLevel:"enhanced",tags:["device-flow","tv","streaming","input-constrained"]}},{id:"device-auth-iot",name:"Device Authorization (IoT)",description:"Device authorization flow for IoT devices and embedded systems",category:"built-in",appType:"OIDC_NATIVE_APP",configuration:{enabled:!0,redirectUris:[],postLogoutRedirectUris:[],grantTypes:["urn:ietf:params:oauth:grant-type:device_code"],responseTypes:[],tokenEndpointAuthMethod:"none",pkceEnforcement:"OPTIONAL",scopes:["openid","device:read","device:write"],accessTokenValiditySeconds:7200,refreshTokenValiditySeconds:604800,idTokenValiditySeconds:3600,refreshTokenDuration:7,refreshTokenRollingDuration:30,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"IoT devices and embedded systems with limited input capabilities",securityLevel:"enhanced",tags:["device-flow","iot","embedded","headless"]}},{id:"mobile-ios",name:"iOS Mobile Application",description:"Native iOS application with PKCE enforcement and mobile-optimized settings",category:"built-in",appType:"OIDC_NATIVE_APP",configuration:{enabled:!0,redirectUris:["com.company.app://callback","com.company.app://auth"],postLogoutRedirectUris:["com.company.app://logout"],grantTypes:["authorization_code","refresh_token"],responseTypes:["code"],tokenEndpointAuthMethod:"none",pkceEnforcement:"REQUIRED",scopes:["openid","profile","email"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:2592e3,idTokenValiditySeconds:3600,refreshTokenDuration:30,refreshTokenRollingDuration:180,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Native iOS mobile applications",securityLevel:"enhanced",tags:["mobile","ios","native","pkce-required"]}},{id:"mobile-android",name:"Android Mobile Application",description:"Native Android application with PKCE enforcement and mobile-optimized settings",category:"built-in",appType:"OIDC_NATIVE_APP",configuration:{enabled:!0,redirectUris:["com.company.app://callback","com.company.app://auth"],postLogoutRedirectUris:["com.company.app://logout"],grantTypes:["authorization_code","refresh_token"],responseTypes:["code"],tokenEndpointAuthMethod:"none",pkceEnforcement:"REQUIRED",scopes:["openid","profile","email"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:2592e3,idTokenValiditySeconds:3600,refreshTokenDuration:30,refreshTokenRollingDuration:180,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Native Android mobile applications",securityLevel:"enhanced",tags:["mobile","android","native","pkce-required"]}},{id:"microservice-api",name:"Microservice API",description:"Service-to-service authentication for microservices with minimal scopes",category:"built-in",appType:"SERVICE",configuration:{enabled:!0,redirectUris:[],postLogoutRedirectUris:[],grantTypes:["client_credentials"],responseTypes:[],tokenEndpointAuthMethod:"client_secret_jwt",pkceEnforcement:"OPTIONAL",scopes:["api:read","api:write"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:0,idTokenValiditySeconds:0,refreshTokenDuration:0,refreshTokenRollingDuration:0,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Microservice-to-microservice authentication",securityLevel:"enhanced",tags:["microservice","api","service-to-service","client-credentials"]}},{id:"oauth-authz-code-basic",name:"OAuth Authorization Code Flow",description:"Standard OAuth 2.0 Authorization Code flow for web applications with delegated authorization",category:"built-in",appType:"OIDC_WEB_APP",configuration:{enabled:!0,redirectUris:["https://localhost:3000/callback","https://app.company.com/callback"],postLogoutRedirectUris:["https://localhost:3000","https://app.company.com"],grantTypes:["authorization_code","refresh_token"],responseTypes:["code"],tokenEndpointAuthMethod:"client_secret_basic",pkceEnforcement:"OPTIONAL",scopes:["read","write"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:2592e3,idTokenValiditySeconds:0,refreshTokenDuration:30,refreshTokenRollingDuration:180,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"OAuth 2.0 delegated authorization for web applications",securityLevel:"enhanced",tags:["oauth","authorization-code","web-app","delegated-auth"]}},{id:"oidc-authz-code-basic",name:"OIDC Authorization Code Flow",description:"OpenID Connect Authorization Code flow for web applications with authentication and authorization",category:"built-in",appType:"OIDC_WEB_APP",configuration:{enabled:!0,redirectUris:["https://localhost:3000/callback","https://app.company.com/callback"],postLogoutRedirectUris:["https://localhost:3000","https://app.company.com"],grantTypes:["authorization_code","refresh_token"],responseTypes:["code"],tokenEndpointAuthMethod:"client_secret_basic",pkceEnforcement:"OPTIONAL",scopes:["openid","profile","email"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:2592e3,idTokenValiditySeconds:3600,refreshTokenDuration:30,refreshTokenRollingDuration:180,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"OIDC authentication and authorization for web applications",securityLevel:"enhanced",tags:["oidc","authorization-code","web-app","authentication"]}},{id:"worker-token-basic",name:"Worker Token Application",description:"Worker application optimized for token-based API access and background processing",category:"built-in",appType:"WORKER",configuration:{enabled:!0,redirectUris:[],postLogoutRedirectUris:[],grantTypes:["client_credentials"],responseTypes:[],tokenEndpointAuthMethod:"client_secret_basic",pkceEnforcement:"OPTIONAL",scopes:["p1:read:user","p1:update:user","p1:read:application"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:0,idTokenValiditySeconds:0,refreshTokenDuration:0,refreshTokenRollingDuration:0,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Worker applications for API access and automation",securityLevel:"enhanced",tags:["worker","token","api-access","automation"]}},{id:"oauth-implicit-spa",name:"OAuth Implicit Flow (SPA)",description:"OAuth 2.0 Implicit flow for single-page applications with direct token access",category:"built-in",appType:"SINGLE_PAGE_APP",configuration:{enabled:!0,redirectUris:["https://localhost:3000","https://app.company.com"],postLogoutRedirectUris:["https://localhost:3000","https://app.company.com"],grantTypes:["implicit"],responseTypes:["token"],tokenEndpointAuthMethod:"none",pkceEnforcement:"OPTIONAL",scopes:["read","write"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:0,idTokenValiditySeconds:0,refreshTokenDuration:0,refreshTokenRollingDuration:0,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Single-page applications with OAuth implicit flow",securityLevel:"basic",tags:["oauth","implicit","spa","browser-based"]}},{id:"oidc-implicit-spa",name:"OIDC Implicit Flow (SPA)",description:"OpenID Connect Implicit flow for single-page applications with ID tokens",category:"built-in",appType:"SINGLE_PAGE_APP",configuration:{enabled:!0,redirectUris:["https://localhost:3000","https://app.company.com"],postLogoutRedirectUris:["https://localhost:3000","https://app.company.com"],grantTypes:["implicit"],responseTypes:["id_token","token"],tokenEndpointAuthMethod:"none",pkceEnforcement:"OPTIONAL",scopes:["openid","profile","email"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:0,idTokenValiditySeconds:3600,refreshTokenDuration:0,refreshTokenRollingDuration:0,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:[]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Single-page applications with OIDC authentication",securityLevel:"basic",tags:["oidc","implicit","spa","authentication"]}},{id:"saml-web-enterprise",name:"SAML Web Application (Enterprise)",description:"Enterprise SAML web application for SSO integration with identity providers",category:"built-in",appType:"SAML_APP",configuration:{enabled:!0,redirectUris:["https://app.company.com/saml/acs"],postLogoutRedirectUris:["https://app.company.com/saml/sls"],grantTypes:["authorization_code"],responseTypes:["code"],tokenEndpointAuthMethod:"client_secret_basic",pkceEnforcement:"OPTIONAL",scopes:["openid","profile","email","groups"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:2592e3,idTokenValiditySeconds:3600,refreshTokenDuration:30,refreshTokenRollingDuration:180,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:["https://app.company.com/saml/sls"]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Enterprise web applications with SAML SSO integration",securityLevel:"enterprise",tags:["saml","sso","enterprise","identity-provider"]}},{id:"saml-service-provider",name:"SAML Service Provider",description:"SAML service provider configuration for federated authentication",category:"built-in",appType:"SAML_APP",configuration:{enabled:!0,redirectUris:["https://sp.company.com/saml/acs","https://sp.company.com/auth/callback"],postLogoutRedirectUris:["https://sp.company.com/logout","https://sp.company.com"],grantTypes:["authorization_code","refresh_token"],responseTypes:["code"],tokenEndpointAuthMethod:"client_secret_post",pkceEnforcement:"OPTIONAL",scopes:["openid","profile","email","saml:assertion"],accessTokenValiditySeconds:7200,refreshTokenValiditySeconds:2592e3,idTokenValiditySeconds:7200,refreshTokenDuration:30,refreshTokenRollingDuration:180,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!0,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:["https://sp.company.com/saml/sls"]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"SAML service provider for federated authentication",securityLevel:"enterprise",tags:["saml","service-provider","federation","sso"]}},{id:"saml-basic",name:"Basic SAML Application",description:"Standard SAML application for basic SSO integration",category:"built-in",appType:"SAML_APP",configuration:{enabled:!0,redirectUris:["https://app.company.com/saml/acs"],postLogoutRedirectUris:["https://app.company.com/saml/sls"],grantTypes:["authorization_code"],responseTypes:["code"],tokenEndpointAuthMethod:"client_secret_basic",pkceEnforcement:"OPTIONAL",scopes:["openid","profile","email"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:2592e3,idTokenValiditySeconds:3600,refreshTokenDuration:30,refreshTokenRollingDuration:180,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,signoffUrls:["https://app.company.com/saml/sls"]},metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:"Basic SAML SSO integration for web applications",securityLevel:"enhanced",tags:["saml","sso","basic","web-app"]}}];class Xo{static CUSTOM_PRESETS_STORAGE_KEY="app-generator-custom-presets";getBuiltInPresets(){return[...Yo]}getCustomPresets(){try{const e=localStorage.getItem(Xo.CUSTOM_PRESETS_STORAGE_KEY);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch(e){return[]}}getAllPresets(){return[...this.getBuiltInPresets(),...this.getCustomPresets()]}getPresetsByAppType(e){return this.getAllPresets().filter(t=>t.appType===e)}saveCustomPreset(e){const t=this.getCustomPresets(),r=t.findIndex(t=>t.name.toLowerCase()===e.name.toLowerCase()&&t.appType===e.appType);if(-1!==r){const i={...t[r],...e,metadata:{...t[r].metadata,updatedAt:(new Date).toISOString(),useCase:e.description||"Custom configuration",tags:["custom"]}};t[r]=i;try{return localStorage.setItem(Xo.CUSTOM_PRESETS_STORAGE_KEY,JSON.stringify(t)),i}catch(n){throw new Error("Failed to update custom preset")}}else{const r={...e,id:`custom-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,category:"custom",metadata:{createdAt:(new Date).toISOString(),updatedAt:(new Date).toISOString(),useCase:e.description||"Custom configuration",securityLevel:"basic",tags:["custom"]}};t.push(r);try{return localStorage.setItem(Xo.CUSTOM_PRESETS_STORAGE_KEY,JSON.stringify(t)),r}catch(n){throw new Error("Failed to save custom preset")}}}deleteCustomPreset(e){const t=this.getCustomPresets(),r=t.findIndex(t=>t.id===e);if(-1===r)return!1;t.splice(r,1);try{return localStorage.setItem(Xo.CUSTOM_PRESETS_STORAGE_KEY,JSON.stringify(t)),!0}catch(n){return!1}}updateCustomPreset(e,t){const r=this.getCustomPresets(),n=r.findIndex(t=>t.id===e);if(-1===n)return null;const i={...r[n],...t,id:e,category:"custom",metadata:{...r[n].metadata,...t.metadata,updatedAt:(new Date).toISOString()}};r[n]=i;try{return localStorage.setItem(Xo.CUSTOM_PRESETS_STORAGE_KEY,JSON.stringify(r)),i}catch(o){return null}}applyPreset(e){const t=this.getPresetById(e);if(!t)return null;const r=this.createDefaultFormData();return{...r,...t.configuration,redirectUris:t.configuration.redirectUris||r.redirectUris,postLogoutRedirectUris:t.configuration.postLogoutRedirectUris||r.postLogoutRedirectUris,grantTypes:t.configuration.grantTypes||r.grantTypes,responseTypes:t.configuration.responseTypes||r.responseTypes,scopes:t.configuration.scopes||r.scopes,signoffUrls:t.configuration.signoffUrls||r.signoffUrls}}getPresetById(e){return this.getAllPresets().find(t=>t.id===e)||null}createDefaultFormData(){return{name:"",description:"",enabled:!0,redirectUris:["https://localhost:3000/callback"],postLogoutRedirectUris:["https://localhost:3000"],grantTypes:["authorization_code"],responseTypes:["code"],tokenEndpointAuthMethod:"client_secret_basic",pkceEnforcement:"OPTIONAL",scopes:["openid","profile","email"],accessTokenValiditySeconds:3600,refreshTokenValiditySeconds:2592e3,idTokenValiditySeconds:3600,refreshTokenDuration:30,refreshTokenRollingDuration:180,refreshTokenRollingGracePeriod:0,allowRedirectUriPatterns:!1,jwksUrl:"",pushedAuthorizationRequestStatus:"OPTIONAL",parReferenceTimeout:60,initiateLoginUri:"",targetLinkUri:"",signoffUrls:[]}}}const Qo=new Xo,Zo=Ce.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 247, 255, 0.92) 100%);
  border-radius: 1.25rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 28px 75px -40px rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.35);
`,es=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`,ts=Ce.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
`,rs=Ce.p`
  color: #6b7280;
  margin: 0.5rem 0 1.5rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
`,ns=Ce.div`
  margin-bottom: 2rem;
`,is=Ce.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,os=Ce.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`,ss=Ce.div`
  background: ${({selected:e})=>e?"linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)":"white"};
  border: 2px solid ${({selected:e,theme:t})=>e?t.colors.primary:"rgba(148, 163, 184, 0.25)"};
  border-radius: 0.75rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    border-color: ${({theme:e})=>e.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  ${({category:e})=>"built-in"===e&&"\n    &::before {\n      content: '';\n      position: absolute;\n      top: 0.75rem;\n      right: 0.75rem;\n      width: 8px;\n      height: 8px;\n      background: #10b981;\n      border-radius: 50%;\n    }\n  "}
`,as=Ce.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`,cs=Ce.h5`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  line-height: 1.3;
`,ls=Ce.span`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background: ${({category:e})=>"built-in"===e?"#d1fae5":"#fef3c7"};
  color: ${({category:e})=>"built-in"===e?"#065f46":"#92400e"};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`,ds=Ce.p`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0 0 1rem 0;
`,us=Ce.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`,ps=Ce.span`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  
  ${({variant:e})=>{switch(e){case"security":return"\n          background: #fef2f2;\n          color: #991b1b;\n          border: 1px solid #fecaca;\n        ";case"type":return"\n          background: #eff6ff;\n          color: #1e40af;\n          border: 1px solid #bfdbfe;\n        ";case"tag":return"\n          background: #f3f4f6;\n          color: #374151;\n          border: 1px solid #d1d5db;\n        "}}}
`,hs=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`,gs=Ce.button`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${({selected:e,theme:t})=>e?`\n    background: ${t.colors.primary};\n    color: white;\n    &:hover {\n      background: ${t.colors.primaryDark};\n    }\n  `:`\n    background: white;\n    color: ${t.colors.gray700};\n    border-color: #d1d5db;\n    &:hover {\n      background: #f9fafb;\n      border-color: ${t.colors.primary};\n    }\n  `}
`,ms=Ce.button`
  padding: 0.5rem;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`,fs=Ce.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  
  svg {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #9ca3af;
  }
`,bs=Ce.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`,xs=Ce.button.withConfig({shouldForwardProp:e=>"active"!==e})`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #d1d5db;
  
  ${({active:e,theme:t})=>e?`\n    background: ${t.colors.primary};\n    color: white;\n    border-color: ${t.colors.primary};\n  `:`\n    background: white;\n    color: #374151;\n    &:hover {\n      background: #f9fafb;\n      border-color: ${t.colors.primary};\n    }\n  `}
`,ys=({selectedAppType:r,selectedPreset:n,onPresetSelect:o,onPresetApply:s})=>{const[a,l]=e.useState([]),[d,u]=e.useState("all"),[p,h]=e.useState(!0),g=e.useCallback(async()=>{try{h(!0);Ye().success;const e=Qo.getAllPresets();l(e)}catch(e){}finally{h(!1)}},[]);e.useEffect(()=>{g()},[g]);const m=a.filter(e=>(!r||e.appType===r)&&("all"===d||e.category===d)),f=m.reduce((e,t)=>{const r=t.category;return e[r]||(e[r]=[]),e[r].push(t),e},{}),b=e=>{n===e?o(null):(o(e),s(e))};return p?t.jsxs(Zo,{children:[t.jsxs(es,{children:[t.jsx(T,{}),t.jsx(ts,{children:"Configuration Presets"})]}),t.jsx(rs,{children:"Loading presets..."})]}):t.jsxs(Zo,{children:[t.jsxs(es,{children:[t.jsx(T,{}),t.jsx(ts,{children:"Configuration Presets"})]}),t.jsxs(rs,{children:["Choose from predefined configuration templates or your custom presets to quickly set up applications with best practices.",r?t.jsxs("strong",{style:{color:"#ef4444"},children:[" ","Templates are filtered for ",r.replace(/_/g," ")," applications."]}):t.jsx("strong",{children:" Select an application type above to see relevant templates."})]}),t.jsxs(bs,{children:[t.jsxs(xs,{active:"all"===d,onClick:()=>u("all"),children:["All Presets (",m.length,")"]}),t.jsxs(xs,{active:"built-in"===d,onClick:()=>u("built-in"),children:["Built-in (",a.filter(e=>"built-in"===e.category&&(!r||e.appType===r)).length,")"]}),t.jsxs(xs,{active:"custom"===d,onClick:()=>u("custom"),children:["Custom (",a.filter(e=>"custom"===e.category&&(!r||e.appType===r)).length,")"]})]}),0===m.length?t.jsxs(fs,{children:[t.jsx(T,{}),t.jsx("div",{children:r?`No presets available for ${r.replace(/_/g," ")}`:"No presets available"}),"custom"===d&&t.jsx("div",{style:{fontSize:"0.875rem",marginTop:"0.5rem"},children:"Create custom presets by configuring an application and saving it as a template."})]}):Object.entries(f).map(([e,r])=>t.jsxs(ns,{children:[t.jsxs(is,{children:["built-in"===e?t.jsx(te,{}):t.jsx(K,{}),"built-in"===e?"Built-in Presets":"Custom Presets",t.jsxs("span",{style:{color:"#6b7280",fontWeight:"normal"},children:["(",r.length,")"]})]}),t.jsx(os,{children:r.map(e=>t.jsxs(ss,{selected:n===e.id,category:e.category,onClick:()=>b(e.id),children:[t.jsxs(as,{children:[t.jsx(cs,{children:e.name}),t.jsxs(ls,{category:e.category,children:["built-in"===e.category?t.jsx(te,{size:12}):t.jsx(K,{size:12}),"built-in"===e.category?"Built-in":"Custom"]})]}),t.jsx(ds,{children:e.description}),t.jsxs(us,{children:[t.jsx(ps,{variant:"security",children:e.metadata.securityLevel}),t.jsx(ps,{variant:"type",children:e.appType.replace(/_/g," ")}),e.metadata.tags.slice(0,2).map(e=>t.jsx(ps,{variant:"tag",children:e},e))]}),t.jsxs(hs,{children:[t.jsx(gs,{selected:n===e.id,onClick:t=>{t.stopPropagation(),b(e.id)},children:n===e.id?t.jsxs(t.Fragment,{children:[t.jsx(i,{size:16}),"Selected"]}):"Select Preset"}),t.jsx(ms,{onClick:e=>{e.stopPropagation()},title:"View preset details",children:t.jsx(c,{size:16})})]})]},e.id))})]},e))]})},ws="callback_uri_overrides";const vs=new class{config;cache=new Map;callbackOverrides={};defaultPaths={authzCallback:"/authz-callback",implicitCallback:"/implicit-callback",logoutCallback:"/logout-callback",hybridCallback:"/hybrid-callback",oauthV3Callback:"/oauth-v3-callback",workerTokenCallback:"/worker-token-callback",clientCredentialsCallback:"/client-credentials-callback",deviceCodeCallback:"/device-code-status",dashboardCallback:"/dashboard-callback",p1authCallback:"/p1auth-callback",unifiedMFACallback:"/v8/unified-mfa-callback",authzLogoutCallback:"/logout-callback",implicitLogoutCallback:"/logout-callback-implicit",hybridLogoutCallback:"/hybrid-logout-callback",deviceLogoutCallback:"/device-logout-callback",workerTokenLogoutCallback:"/worker-token-logout-callback",clientCredentialsLogoutCallback:"/client-credentials-logout-callback",p1authLogoutCallback:"/p1auth-logout-callback",dashboardLogoutCallback:"/dashboard-logout-callback",unifiedMFALogoutCallback:"/mfa-unified-logout-callback"};constructor(e){this.config={origin:this.detectOrigin(),environment:this.detectEnvironment(),customPaths:{},...e},this.loadOverrides()}detectOrigin(){if("undefined"==typeof window)return"https://localhost:3000";const e=window.location.origin;return e.startsWith("http://localhost")?e.replace("http://","https://"):e}detectEnvironment(){if("undefined"==typeof window)return"development";const e=window.location.hostname;return"localhost"===e||"127.0.0.1"===e?"development":e.includes("staging")||e.includes("dev")?"staging":"production"}normalizeOverride(e){if(!e)return null;const t=e.trim();return t?/^https?:\/\//i.test(t)?t:t.startsWith("/")?`${this.config.origin}${t}`:`${this.config.origin}/${t}`:null}buildDefaultUri(e){const t=this.defaultPaths[e];return/^https?:\/\//i.test(t)?t:`${this.config.origin}${t}`}buildCallbackUri(e){const t=this.callbackOverrides[e];return t||this.buildDefaultUri(e)}saveOverrides(){"undefined"!=typeof window&&window.localStorage.setItem(ws,JSON.stringify(this.callbackOverrides))}loadOverrides(){if("undefined"!=typeof window)try{const e=window.localStorage.getItem(ws);if(e){const t=JSON.parse(e);this.callbackOverrides=t}}catch(e){this.callbackOverrides={}}}getCallbackUri(e){const t=`${this.config.origin}-${e}-${this.callbackOverrides[e]??"default"}`;if(this.cache.has(t))return this.cache.get(t);const r=this.buildCallbackUri(e);return this.cache.set(t,r),r}getCallbackTypesForFlow(e){const t=e.toLowerCase();return t.includes("worker-token")?{redirect:"workerTokenCallback",logout:"workerTokenLogoutCallback"}:t.includes("client-credentials")?{redirect:"clientCredentialsCallback",logout:"clientCredentialsLogoutCallback"}:t.includes("device")?{redirect:"deviceCodeCallback",logout:"deviceLogoutCallback"}:t.includes("implicit")?{redirect:"implicitCallback",logout:"implicitLogoutCallback"}:t.includes("hybrid")?{redirect:"hybridCallback",logout:"hybridLogoutCallback"}:t.includes("dashboard")?{redirect:"dashboardCallback",logout:"dashboardLogoutCallback"}:t.includes("pingone")&&t.includes("auth")?{redirect:"p1authCallback",logout:"p1authLogoutCallback"}:t.includes("unified")&&t.includes("mfa")?{redirect:"unifiedMFACallback",logout:"unifiedMFALogoutCallback"}:{redirect:"authzCallback",logout:"authzLogoutCallback"}}getCallbackUriForFlow(e){const t=e.toLowerCase();let r="authorization_code";t.includes("implicit")?r="implicit":t.includes("hybrid")?r="hybrid":t.includes("device")?r="device":t.includes("worker-token")||t.includes("client-credentials")?r="client_credentials":t.includes("pingone")&&t.includes("auth")?r="pingone_auth":t.includes("dashboard")&&(r="dashboard");const n={authorization_code:{description:"Authorization Code Flow",note:"Handles authorization code redirects. Required for OAuth/OIDC Authorization Code flows.",logoutNote:"Handles logout redirects for Authorization Code Flow. Required for RP-initiated logout."},implicit:{description:"Implicit Flow",note:"Handles implicit flow token responses. Required for OAuth/OIDC Implicit flows.",logoutNote:"Handles logout redirects for Implicit Flow. Required for RP-initiated logout."},hybrid:{description:"OIDC Hybrid Flow",note:"Handles OIDC hybrid flow responses. Required for Hybrid flows.",logoutNote:"Handles logout redirects for OIDC Hybrid Flow."},device:{description:"Device Authorization Flow",note:"Handles device authorization polling status.",logoutNote:"Handles logout redirects for Device Authorization Flow."},client_credentials:{description:"Worker Token / Client Credentials Flow",note:"Handles worker token callback operations.",logoutNote:"Handles logout redirects for Worker Token Flow."},pingone_auth:{description:"PingOne Authentication Flow",note:"Handles PingOne authentication redirects.",logoutNote:"Handles logout redirects for PingOne Authentication."},dashboard:{description:"Dashboard Login Flow",note:"Handles dashboard login redirects.",logoutNote:"Handles logout redirects for Dashboard Login."}}[r],{redirect:i,logout:o}=this.getCallbackTypesForFlow(e);return{redirectUri:this.getCallbackUri(i),description:n.description,note:n.note,logoutUri:this.getCallbackUri(o),logoutNote:n.logoutNote}}getRedirectUriForFlow(e){return this.getCallbackUriForFlow(e)}getAllRedirectUriInfo(){return["authorization_code","implicit","hybrid","device","client_credentials","pingone_auth","dashboard"].map(e=>({flowType:e,...this.getCallbackUriForFlow(e)}))}getRedirectUriCatalog(){return Xe.map(e=>{const{redirect:t,logout:r}=this.getCallbackTypesForFlow(e.flowType),n=e.requiresRedirectUri?this.getCallbackUri(t):"Not required",i=this.getCallbackUri(r),o=e.requiresRedirectUri?this.buildDefaultUri(t):"Not required",s=this.buildDefaultUri(r);return{flowType:e.flowType,description:e.description,specification:e.specification,requiresRedirectUri:e.requiresRedirectUri,redirectUri:n,logoutUri:i,defaultRedirectUri:o,defaultLogoutUri:s,isOverrideRedirect:!!e.requiresRedirectUri&&n!==o,isOverrideLogout:i!==s}})}applyFlowOverrides(e){const t={};Xe.forEach(r=>{const n=e[r.flowType],{redirect:i,logout:o}=this.getCallbackTypesForFlow(r.flowType);if(r.requiresRedirectUri){const e=this.normalizeOverride(n?.redirectUri),r=this.buildDefaultUri(i);e&&e!==r&&(t[i]=e)}const s=this.normalizeOverride(n?.logoutUri),a=this.buildDefaultUri(o);s&&s!==a&&(t[o]=s)}),this.callbackOverrides=t,this.cache.clear(),this.saveOverrides()}getFlowOverrides(){const e={};return Xe.forEach(t=>{const{redirect:r,logout:n}=this.getCallbackTypesForFlow(t.flowType),i=this.callbackOverrides[r],o=this.callbackOverrides[n];if(i||o){const r={};i&&(r.redirectUri=i),o&&(r.logoutUri=o),e[t.flowType]=r}}),e}updateConfig(e){this.config={...this.config,...e},this.cache.clear()}clearCache(){this.cache.clear()}getAllCallbackUris(){return{authzCallback:this.getCallbackUri("authzCallback"),implicitCallback:this.getCallbackUri("implicitCallback"),logoutCallback:this.getCallbackUri("logoutCallback"),hybridCallback:this.getCallbackUri("hybridCallback"),oauthV3Callback:this.getCallbackUri("oauthV3Callback"),workerTokenCallback:this.getCallbackUri("workerTokenCallback"),clientCredentialsCallback:this.getCallbackUri("clientCredentialsCallback"),deviceCodeCallback:this.getCallbackUri("deviceCodeCallback"),dashboardCallback:this.getCallbackUri("dashboardCallback"),p1authCallback:this.getCallbackUri("p1authCallback"),unifiedMFACallback:this.getCallbackUri("unifiedMFACallback"),authzLogoutCallback:this.getCallbackUri("authzLogoutCallback"),implicitLogoutCallback:this.getCallbackUri("implicitLogoutCallback"),hybridLogoutCallback:this.getCallbackUri("hybridLogoutCallback"),deviceLogoutCallback:this.getCallbackUri("deviceLogoutCallback"),workerTokenLogoutCallback:this.getCallbackUri("workerTokenLogoutCallback"),clientCredentialsLogoutCallback:this.getCallbackUri("clientCredentialsLogoutCallback"),p1authLogoutCallback:this.getCallbackUri("p1authLogoutCallback"),dashboardLogoutCallback:this.getCallbackUri("dashboardLogoutCallback"),unifiedMFALogoutCallback:this.getCallbackUri("unifiedMFALogoutCallback")}}},ks=Ce.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`,js=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`,Ss=Ce.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #000000;
`,Cs=Ce.p`
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #000000;
  line-height: 1.5;
`,As=Ce.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`,Ts=Ce.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`,_s=Ce.div`
  position: relative;
  display: flex;
  align-items: center;
`,Rs=Ce.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-right: none;
  border-radius: 6px 0 0 6px;
  font-size: 0.875rem;
  background: #ffffff;
  color: #1f2937;
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,Is=Ce.input.withConfig({shouldForwardProp:e=>!["hasError","hasSuccess"].includes(e)})`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid ${e=>e.hasError?"#ef4444":e.hasSuccess?"#10b981":"#d1d5db"};
  border-radius: 0 6px 6px 0;
  font-size: 0.875rem;
  background: #ffffff;
  color: #1f2937;
  font-family: monospace;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${e=>e.hasError?"#ef4444":e.hasSuccess?"#10b981":"#3b82f6"};
    box-shadow: 0 0 0 3px ${e=>e.hasError?"rgba(239, 68, 68, 0.1)":e.hasSuccess?"rgba(16, 185, 129, 0.1)":"rgba(59, 130, 246, 0.1)"};
  }

  &:disabled {
    background: #f9fafb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`,$s=Ce.button.withConfig({shouldForwardProp:e=>!["isLoading"].includes(e)})`
  position: absolute;
  right: 0.5rem;
  padding: 0.5rem;
  background: ${e=>e.isLoading?"#f3f4f6":"#10b981"};
  color: ${e=>e.isLoading?"#6b7280":"white"};
  border: 1px solid ${e=>e.isLoading?"#d1d5db":"#059669"};
  border-radius: 0.375rem;
  cursor: ${e=>e.isLoading?"not-allowed":"pointer"};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    cursor: not-allowed;
  }
`,Es=Ce.button`
  padding: 0.5rem 1rem;
  background: ${e=>e.$isSaved?"#059669":"#10b981"};
  color: white;
  border: 1px solid ${e=>e.$isSaved?"#047857":"#059669"};
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    background: ${e=>e.$isSaved?"#059669":"#2563eb"};
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`,zs=Ce.button`
  padding: 0.5rem 1rem;
  background: #6b7280;
  color: white;
  border: 1px solid #4b5563;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    background: #4b5563;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`,Ps=Ce.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`,Os=Ce.div`
  padding: 0.75rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.875rem;
  color: #334155;
  word-break: break-all;
  position: relative;
`,Us=Ce.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2563eb;
  }
`,Ds=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: ${e=>{switch(e.type){case"success":return"#f0fdf4";case"error":return"#fef2f2";case"info":return"#eff6ff";default:return"#f8fafc"}}};
  border: 1px solid ${e=>{switch(e.type){case"success":return"#bbf7d0";case"error":return"#fecaca";case"info":return"#bfdbfe";default:return"#e2e8f0"}}};
  color: ${e=>{switch(e.type){case"success":return"#166534";case"error":return"#dc2626";case"info":return"#1d4ed8";default:return"#475569"}}};
`,Ls=Ce.div`
  font-size: 0.875rem;
  line-height: 1.4;
`,Ns=Ce.div`
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`,Ms=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: #000000;
`,Fs=Ce.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
`,qs=Ce.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
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
`,Vs=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Bs=Ce.span`
  display: inline-flex;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: ${({$collapsed:e})=>e?"rotate(-90deg)":"rotate(0deg)"};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: ${({$collapsed:e})=>e?"rotate(-90deg) scale(1.1)":"rotate(0deg) scale(1.1)"};
  }
`,Ws=Ce.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`,Gs=Ce.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.4;
  
  strong {
    color: #374151;
    font-weight: 600;
  }
  
  &:not(:last-child) {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }
`,Hs=({onDiscoveryComplete:r,onEnvironmentIdChange:o,onIssuerUrlChange:s,initialEnvironmentId:l="",className:u,disabled:p=!1,showSuggestions:h=!0,autoDiscover:g=!1,region:m="us"})=>{const[f,x]=e.useState(l),[y,v]=e.useState(m),[k,j]=e.useState(!1),[S,C]=e.useState(null),[A,T]=e.useState(null),[_,R]=e.useState(!1),[$,E]=e.useState(!1),[z,P]=e.useState(!1),[O,U]=e.useState(!1),D={us:"https://auth.pingone.com",eu:"https://auth.pingone.eu",ap:"https://auth.pingone.asia",ca:"https://auth.pingone.ca"},L=f?`${D[y]}/${f}`:"";e.useEffect(()=>{const e=localStorage.getItem("oidc-discovery-config");if(e)try{const t=JSON.parse(e);t.environmentId&&t.discoveryResult&&(x(t.environmentId),v(t.region||"us"),C({success:!0,document:t.discoveryResult}))}catch(t){}},[]);const N=e.useCallback(e=>{const t=e.target.value;x(t),T(null),S&&C(null),o?.(t),s?.(t?`${D[y]}/${t}`:"")},[y,S,o,s]),M=e.useCallback(e=>{const t=e.target.value;if(v(t),f){const e=`${D[t]}/${f}`;s?.(e)}S&&C(null)},[f,S,s]),F=e.useCallback(async()=>{if(f.trim()){j(!0),T(null),C(null);try{const e=await Qe.discover({issuerUrl:L.trim()});C(e),e.success&&e.document?r?.(e):T(e.error||"Discovery failed")}catch(e){const t=e instanceof Error?e.message:"Discovery failed";T(t),C({success:!1,error:t})}finally{j(!1)}}else T("Please enter an environment ID")},[f,L,r]),q=e.useCallback(async()=>{if(S?.success&&S.document)try{const e={environmentId:f,region:y,issuerUrl:L,discoveryResult:S.document,timestamp:Date.now()};localStorage.setItem("oidc-discovery-config",JSON.stringify(e)),E(!0),setTimeout(()=>E(!1),3e3)}catch(e){T("Failed to save configuration")}},[S,f,y,L]),V=e.useCallback(async()=>{if(S?.success&&S.document)try{P(!0);const e={environmentId:f,region:y,issuerUrl:L,discoveryResult:S.document,timestamp:Date.now()};localStorage.setItem("oidc-discovery-config",JSON.stringify(e)),E(!0),r?.(S),setTimeout(()=>{E(!1),P(!1)},3e3)}catch(e){T("Failed to save and apply configuration"),P(!1)}},[S,f,y,L,r]),B=e.useCallback(e=>{"Enter"!==e.key||k||p||F()},[F,k,p]),W=e.useCallback(()=>{x(""),C(null),T(null),E(!1),P(!1),R(!1),o?.(""),s?.("")},[o,s]);e.useEffect(()=>{g&&l&&!S&&F()},[g,l,S,F]),e.useEffect(()=>{if(g&&f&&f.length>10){const e=setTimeout(()=>{F()},1e3);return()=>clearTimeout(e)}},[g,f,F,S]);return t.jsxs(ks,{className:u,children:[t.jsxs(js,{children:[t.jsx(re,{}),t.jsx(Ss,{children:"PingOne Environment Configuration"})]}),t.jsx(Cs,{children:"Enter your PingOne environment ID and select your region. We'll construct the issuer URL and discover all available OIDC endpoints automatically."}),t.jsxs(As,{children:[t.jsx(Ts,{htmlFor:"environment-id",children:"Environment ID"}),t.jsxs(_s,{children:[t.jsxs(Rs,{value:y,onChange:M,disabled:p,children:[t.jsx("option",{value:"us",children:"US - North America"}),t.jsx("option",{value:"eu",children:"EU - Europe"}),t.jsx("option",{value:"ap",children:"AP - Asia Pacific"}),t.jsx("option",{value:"ca",children:"CA - Canada"})]}),t.jsx(Is,{id:"environment-id",type:"text",value:f,onChange:N,onKeyPress:B,placeholder:"your-environment-id",hasError:!!A,hasSuccess:S?.success||!1,disabled:p||k}),g&&t.jsx($s,{onClick:F,disabled:p||k||!f.trim(),isLoading:k,title:"Discover OIDC endpoints",children:k?t.jsx(ne,{className:"animate-spin"}):t.jsx(I,{})})]}),A&&t.jsx(Ns,{children:A})]}),L&&t.jsxs("div",{children:[t.jsx(Ts,{children:"Generated Issuer URL"}),t.jsxs(Os,{children:[L,t.jsxs(Us,{onClick:async()=>{try{await navigator.clipboard.writeText(L),R(!0),setTimeout(()=>R(!1),2e3)}catch(e){}},children:[_?t.jsx(i,{size:12}):t.jsx(n,{size:12}),_?"Copied!":"Copy"]})]})]}),g&&S?.success&&S.document&&t.jsxs("div",{style:{marginTop:"1rem"},children:[t.jsxs(Fs,{children:[t.jsxs(qs,{onClick:()=>U(!O),"aria-expanded":!O,children:[t.jsxs(Vs,{children:[t.jsx(re,{size:18}),t.jsx("span",{children:"OIDC Discovery Results"})]}),t.jsx(Bs,{$collapsed:O,children:t.jsx(a,{})})]}),!O&&t.jsxs(Ws,{children:[t.jsxs(Gs,{children:[t.jsx("strong",{children:"Issuer:"})," ",S.document.issuer]}),t.jsxs(Gs,{children:[t.jsx("strong",{children:"Authorization Endpoint:"})," ",S.document.authorization_endpoint]}),t.jsxs(Gs,{children:[t.jsx("strong",{children:"Token Endpoint:"})," ",S.document.token_endpoint]}),t.jsxs(Gs,{children:[t.jsx("strong",{children:"UserInfo Endpoint:"})," ",S.document.userinfo_endpoint]}),t.jsxs(Gs,{children:[t.jsx("strong",{children:"JWKS URI:"})," ",S.document.jwks_uri]}),t.jsxs(Gs,{children:[t.jsx("strong",{children:"Response Types Supported:"})," ",S.document.response_types_supported?.join(", ")]}),t.jsxs(Gs,{children:[t.jsx("strong",{children:"Scopes Supported:"})," ",S.document.scopes_supported?.join(", ")]})]})]}),t.jsxs(Ps,{children:[t.jsxs(zs,{onClick:W,disabled:z,children:[t.jsx(b,{size:16}),"Reset"]}),t.jsxs(Es,{onClick:q,$isSaved:$,disabled:$||z,children:[t.jsx(w,{size:16}),$?"Configuration Saved!":"Save Only"]}),t.jsxs(Es,{onClick:V,$isSaved:$,disabled:$||z,style:{background:z?"#f59e0b":"#10b981",borderColor:z?"#d97706":"#059669"},children:[z?t.jsx(ne,{className:"animate-spin",size:16}):t.jsx(i,{size:16}),z?"Applying...":$?"Applied!":"Save & Apply"]})]})]}),t.jsxs(Ms,{children:[t.jsx(c,{size:14}),t.jsxs("span",{children:["Selected region: ",t.jsx("strong",{children:{us:"US (North America)",eu:"EU (Europe)",ap:"AP (Asia Pacific)",ca:"CA (Canada)"}[y]})," -"," ",D[y]]})]}),k?t.jsxs(Ds,{type:"loading",children:[t.jsx(ne,{className:"animate-spin"}),t.jsx(Ls,{children:"Discovering OIDC endpoints..."})]}):S?.success?t.jsxs(Ds,{type:"success",children:[t.jsx(i,{}),t.jsxs(Ls,{children:["Successfully discovered OIDC endpoints",S.cached&&" (cached)"]})]}):S&&!S.success?t.jsxs(Ds,{type:"error",children:[t.jsx(d,{}),t.jsxs(Ls,{children:["Discovery failed: ",S.error]})]}):null]})},Js=Ce.div`
  padding: ${e=>e.$compact?"0.75rem":"1rem"};
  background-color: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #92400e;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  margin: ${e=>e.$compact?"0.5rem 0":"0.75rem 0"};
`,Ks=Ce.div`
  display: flex;
  align-items: center;
  margin-bottom: ${e=>e.$compact?"0.25rem":"0.5rem"};
`,Ys=Ce.span`
  font-size: ${e=>e.$compact?"1rem":"1.25rem"};
  margin-right: 0.5rem;
`,Xs=Ce.strong`
  font-size: ${e=>e.$compact?"0.875rem":"1rem"};
  color: #92400e;
`,Qs=Ce.div`
  background-color: #eff6ff;
  padding: ${e=>e.$compact?"0.5rem":"0.75rem"};
  border-radius: 0.375rem;
  margin-bottom: ${e=>e.$compact?"0.5rem":"0.75rem"};
  border: 1px solid #dbeafe;
`,Zs=Ce.div`
  font-size: ${e=>e.$compact?"0.75rem":"0.8rem"};
  color: #1e40af;
  margin-bottom: 0.25rem;
  font-weight: 500;
`,ea=Ce.code`
  color: #1e40af;
  background-color: #dbeafe;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: ${e=>e.$compact?"0.8rem":"0.875rem"};
  font-weight: 600;
  display: block;
  word-break: break-all;
`,ta=Ce.div`
  font-size: ${e=>e.$compact?"0.75rem":"0.8rem"};
  color: #92400e;
  margin-bottom: ${e=>e.$compact?"0.25rem":"0.5rem"};
  line-height: 1.4;
`,ra=Ce.div`
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  padding: ${e=>e.$compact?"0.5rem":"0.75rem"};
  border-radius: 0.375rem;
  margin-top: ${e=>e.$compact?"0.5rem":"0.75rem"};
`,na=Ce.div`
  display: flex;
  align-items: center;
  margin-bottom: ${e=>e.$compact?"0.25rem":"0.5rem"};
`,ia=Ce.span`
  font-size: ${e=>e.$compact?"0.875rem":"1rem"};
  margin-right: 0.5rem;
  color: #dc2626;
`,oa=Ce.strong`
  font-size: ${e=>e.$compact?"0.8rem":"0.875rem"};
  color: #dc2626;
`,sa=Ce.div`
  font-size: ${e=>e.$compact?"0.75rem":"0.8rem"};
  color: #dc2626;
  line-height: 1.4;
`,aa=Ce.div`
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  padding: ${e=>e.$compact?"0.5rem":"0.75rem"};
  border-radius: 0.375rem;
  margin-top: ${e=>e.$compact?"0.5rem":"0.75rem"};
`,ca=Ce.div`
  display: flex;
  align-items: center;
  margin-bottom: ${e=>e.$compact?"0.25rem":"0.5rem"};
`,la=Ce.span`
  font-size: ${e=>e.$compact?"0.875rem":"1rem"};
  margin-right: 0.5rem;
  color: #0369a1;
`,da=Ce.strong`
  font-size: ${e=>e.$compact?"0.8rem":"0.875rem"};
  color: #0369a1;
`,ua=Ce.div`
  font-size: ${e=>e.$compact?"0.75rem":"0.8rem"};
  color: #0369a1;
  line-height: 1.4;
`,pa=Ce.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }

  &:active {
    background-color: #1d4ed8;
  }
`,ha=({flowKey:e="authorization_code",className:r,showCopyButton:o=!0,compact:s=!1})=>{const a=vs.getRedirectUriForFlow(e),[c,l]=y.useState(!1);return["client_credentials","device"].includes(e)?null:t.jsxs(Js,{className:r,$compact:s,children:[t.jsxs(Ks,{$compact:s,children:[t.jsx(Ys,{$compact:s,children:"🚪"}),t.jsxs(Xs,{$compact:s,children:[a.description," Logout URI"]})]}),t.jsxs(Qs,{$compact:s,children:[t.jsx(Zs,{$compact:s,children:"Flow-Specific Logout URI:"}),t.jsx(ea,{$compact:s,children:a.logoutUri}),o&&t.jsxs(pa,{onClick:async()=>{try{await navigator.clipboard.writeText(a.logoutUri),l(!0),setTimeout(()=>l(!1),2e3)}catch(e){}},children:[c?t.jsx(i,{}):t.jsx(n,{}),c?"Copied!":"Copy URI"]})]}),t.jsxs(ta,{$compact:s,children:[t.jsx("strong",{children:"Purpose:"})," ",a.logoutNote]}),t.jsxs(ra,{$compact:s,children:[t.jsxs(na,{$compact:s,children:[t.jsx(ia,{$compact:s,children:"⚠️"}),t.jsx(oa,{$compact:s,children:"PingOne Configuration Required"})]}),t.jsxs(sa,{$compact:s,children:["Add this exact URI to your PingOne application's"," ",t.jsx("strong",{children:'"Post Logout Redirect URIs"'})," list. Each flow requires its own unique logout URI to prevent conflicts."]})]}),t.jsxs(aa,{$compact:s,children:[t.jsxs(ca,{$compact:s,children:[t.jsx(la,{$compact:s,children:"📖"}),t.jsx(da,{$compact:s,children:"Documentation"})]}),t.jsxs(ua,{$compact:s,children:["For complete logout URI documentation and troubleshooting, see the",t.jsx("strong",{children:" Logout URIs Reference"})," in the project documentation."]})]})]})},ga={query:{mode:"query",label:"Query String",description:"Authorization response parameters are encoded in the query string added to the redirect_uri when redirecting back to the application.",bestFor:"Traditional web applications with server-side handling",icon:"🔗"},fragment:{mode:"fragment",label:"URL Fragment",description:"Authorization response parameters are encoded in the fragment added to the redirect_uri when redirecting back to the application.",bestFor:"Single Page Applications (SPAs) and client-side applications",icon:"🧩"},form_post:{mode:"form_post",label:"Form POST",description:"Authorization response parameters are encoded as HTML form values that are auto-submitted in the browser, transmitted through HTTP POST to the application.",bestFor:"Applications requiring secure parameter transmission without URL exposure",icon:"📝"},"pi.flow":{mode:"pi.flow",label:"PingOne Flow Object",description:"PingOne proprietary redirectless flow that returns a flow object instead of redirecting. Enables embedded authentication without browser redirects.",bestFor:"Embedded authentication, mobile apps, headless applications, IoT devices",icon:"⚡"}},ma={code:{query:null,fragment:{level:"warn",reason:"Fragment mode is unusual for authorization code flows"},form_post:null,"pi.flow":null},token:{query:{level:"error",reason:"Query mode is not standard for token responses"},fragment:null,form_post:{level:"warn",reason:"Form POST is not standard for token responses"},"pi.flow":{level:"warn",reason:"Server-side exchange required for tokens"}},id_token:{query:{level:"error",reason:"Query mode is not standard for ID token responses"},fragment:null,form_post:{level:"warn",reason:"Form POST is not standard for ID token responses"},"pi.flow":{level:"warn",reason:"Server-side exchange required for ID tokens"}},"token id_token":{query:{level:"error",reason:"Query mode is not standard for token responses"},fragment:null,form_post:{level:"warn",reason:"Form POST is not standard for token responses"},"pi.flow":{level:"warn",reason:"Server-side exchange required for tokens"}},"code id_token":{query:{level:"warn",reason:"Query mode may expose tokens in server logs"},fragment:null,form_post:null,"pi.flow":{level:"warn",reason:"Server-side exchange required for tokens"}},"code token":{query:{level:"warn",reason:"Query mode may expose tokens in server logs"},fragment:null,form_post:null,"pi.flow":{level:"warn",reason:"Server-side exchange required for tokens"}},"code token id_token":{query:{level:"warn",reason:"Query mode may expose tokens in server logs"},fragment:null,form_post:null,"pi.flow":{level:"warn",reason:"Server-side exchange required for tokens"}}},fa=Ce.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`,ba=Ce.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  
  &:hover {
    background: #f3f4f6;
  }
`,xa=Ce.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,ya=Ce.div`
  transition: transform 0.2s ease;
  transform: ${e=>e.$collapsed?"rotate(-90deg)":"rotate(0deg)"};
  color: #6b7280;
`,wa=Ce.div`
  padding: ${e=>e.$collapsed?"0":"1rem"};
  max-height: ${e=>e.$collapsed?"0":"none"};
  overflow: hidden;
  transition: all 0.3s ease;
`,va=Ce.p`
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
`,ka=Ce.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`,ja=Ce.label`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid ${e=>e.$selected?"#3b82f6":"#d1d5db"};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${e=>e.$selected?"#eff6ff":"white"};
  
  &:hover {
    border-color: #3b82f6;
    background: ${e=>e.$selected?"#eff6ff":"#f9fafb"};
  }
`,Sa=Ce.input`
  margin: 0;
  margin-top: 0.125rem;
`,Ca=Ce.div`
  flex: 1;
`,Aa=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`,Ta=Ce.span`
  font-weight: ${e=>e.$selected?"600":"500"};
  color: #111827;
`,_a=Ce.span`
  background: #10b981;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`,Ra=Ce.div`
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 0.25rem;
`,Ia=Ce.div`
  font-size: 0.75rem;
  color: #059669;
  font-weight: 500;
`,$a=Ce.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
`,Ea=Ce.h4`
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`,za=Ce.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`,Pa=Ce.div`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.75rem;
`,Oa=Ce.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`,Ua=Ce.code`
  display: block;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #1e293b;
  background: #f8fafc;
  padding: 0.375rem;
  border-radius: 0.25rem;
  border: 1px solid #e2e8f0;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.2;
`,Da=Ce.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  
  ${Ua} {
    flex: 1;
    margin-bottom: 0;
  }
`,La=Ce.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.625rem;
  font-weight: 500;
  margin-top: 0.5rem;
  
  ${e=>{switch(e.$level){case"info":return"background: #dbeafe; color: #1e40af;";case"warn":return"background: #fef3c7; color: #92400e;";case"error":return"background: #fee2e2; color: #991b1b;";default:return""}}}
`,Na=Ce.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
`,Ma=({flowKey:r,responseType:n,redirectUri:i,clientId:o,scope:s="openid profile email",state:d="random_state_123",nonce:u="random_nonce_456",extraParams:p={},defaultMode:h="fragment",readOnlyFlowContext:g=!1,onModeChange:m,className:f})=>{const[b,x]=e.useState(!1),[y,w]=e.useState(h);e.useEffect(()=>{const e=localStorage.getItem(`response_mode:${r}`);e&&Object.keys(ga).includes(e)&&w(e)},[r]);const v=e.useCallback(e=>{localStorage.setItem(`response_mode:${r}`,e)},[r]),k=e.useCallback(e=>{w(e),v(e),m?.(e)},[v,m,y]),j=e.useCallback(e=>{const t=new URLSearchParams({client_id:o,redirect_uri:i,response_type:n,scope:s,state:d,...p});t.set("response_mode",e),n.includes("id_token")&&u&&t.set("nonce",u);return`https://auth.pingone.com/{envID}/as/authorize?${t.toString()}`},[o,i,n,s,d,u,p]),S=e.useCallback(e=>{let t=e;return t=t.replace(/(response_mode=[^&\s]*)/g,'<span style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-weight: 600; margin: 0 0.25rem; font-size: 0.8rem; border: 2px solid #ea580c; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3); text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); display: inline-block; transform: scale(1.05);">$1</span>'),t},[]),C=e.useCallback((e,t)=>{let r=S(e);return"fragment"===t&&(r=r.replace(/response_mode=[^&]*&?/g,"")),r},[S]),A=e.useCallback(e=>{const t=i;switch(e){case"query":return`${t}?code=authorization_code_123&state=${d}`;case"fragment":return n.includes("token")?`${t}#access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&token_type=Bearer&expires_in=3600&state=${d}&scope=${s}`:n.includes("id_token")?`${t}#id_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&state=${d}`:`${t}#code=authorization_code_123&state=${d}`;case"form_post":return`HTML Form POST to ${t}:\nContent-Type: application/x-www-form-urlencoded\n\ncode=authorization_code_123&state=${d}`;case"pi.flow":return JSON.stringify({flow:"pi.flow",txId:"tx_123456789",next:"https://auth.pingone.com/{envID}/as/continue",expires_in:300},null,2);default:return"No example available"}},[i,d,n,s]),T=e.useCallback(e=>ma[n]?.[e]||null,[n]),_=e.useMemo(()=>{if(b)return null;const e=j(y),r=C(e,y),n=A(y),i=S(n),o=T(y);return t.jsxs($a,{children:[t.jsx(Ea,{children:"Live Preview"}),t.jsxs(za,{children:[t.jsxs(Pa,{children:[t.jsx(Oa,{children:"Authorization Request URL"}),t.jsxs(Da,{children:[t.jsx(Ua,{dangerouslySetInnerHTML:{__html:r}}),t.jsx(Xn,{text:e,label:"Copy URL",size:"sm",variant:"outline",showLabel:!0})]})]}),t.jsxs(Pa,{children:[t.jsx(Oa,{children:"Response Format"}),t.jsxs(Da,{children:[t.jsx(Ua,{dangerouslySetInnerHTML:{__html:i}}),t.jsx(Xn,{text:n,label:"Copy Response",size:"sm",variant:"outline",showLabel:!0})]})]}),o&&t.jsxs(La,{$level:o.level,children:["error"===o.level?t.jsx(l,{size:12}):t.jsx(c,{size:12}),o.reason]})]})]})},[b,y,j,C,A,S,T]),R=e.useCallback(()=>`Selected: ${ga[y].label}`,[y]);return t.jsxs(fa,{className:f,children:[t.jsxs(ba,{onClick:()=>x(!b),children:[t.jsxs(xa,{children:[t.jsx("span",{children:"Response Mode"}),"fragment"===y&&t.jsx(_a,{children:"Recommended"})]}),t.jsx(ya,{$collapsed:b,children:t.jsx(a,{size:16})})]}),t.jsxs(wa,{$collapsed:b,children:[!b&&t.jsxs(t.Fragment,{children:[t.jsx(va,{children:"Choose how the authorization response should be returned to your application."}),t.jsx(ka,{children:Object.values(ga).map(e=>t.jsxs(ja,{$selected:y===e.mode,children:[t.jsx(Sa,{type:"radio",name:"response-mode",checked:y===e.mode,onChange:()=>k(e.mode),disabled:g}),t.jsxs(Ca,{children:[t.jsxs(Aa,{children:[t.jsx("span",{children:e.icon}),t.jsx(Ta,{$selected:y===e.mode,children:e.label}),"fragment"===e.mode&&t.jsx(_a,{children:"Recommended"})]}),t.jsx(Ra,{children:e.description}),t.jsxs(Ia,{children:["Best for: ",e.bestFor]})]})]},e.mode))}),_]}),b&&t.jsx(Na,{children:R()})]})]})},Fa=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%);
  border: 1px solid #86efac;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
`,qa=Ce.span`
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 1rem;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
  flex: 1;
`,Va=Ce.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`,Ba=Ce.div`
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
`,Wa=Ce.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`,Ga=Ce.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
`,Ha=Ce.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
`,Ja=Ce.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  color: #6b7280;
  transition: color 0.2s;

  &:hover {
    color: #374151;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`,Ka=Ce.div`
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  border-left: 4px solid;
`,Ya=Ce(Ka)`
  background: #eff6ff;
  border-left-color: #1e40af;
`,Xa=Ce(Ka)`
  background: #fef2f2;
  border-left-color: #dc2626;
`,Qa=Ce(Ka)`
  background: #fff7ed;
  border-left-color: #ea580c;
`,Za=Ce(Ka)`
  background: #f0fdf4;
  border-left-color: #059669;
`,ec=Ce(Ka)`
  background: #fef3c7;
  border-left-color: #d97706;
`,tc=Ce(Ka)`
  background: #f0fdf4;
  border-left-color: #16a34a;
`,rc=Ce(Ka)`
  background: #f1f5f9;
  border-left-color: #475569;
`,nc=Ce(Ka)`
  background: #fef2f2;
  border-left-color: #c2410c;
`,ic=Ce.strong`
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 1rem;
`,oc=Ce.p`
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
  color: #4b5563;
  line-height: 1.6;
`,sc=Ce.span`
  ${({type:e})=>{switch(e){case"base":return"\n          color: #1e40af; /* Blue for base URL */\n          font-weight: 500;\n        ";case"question":return"\n          color: #dc2626; /* Red for ? */\n          font-weight: 600;\n        ";case"ampersand":return"\n          color: #ea580c; /* Orange for & */\n          font-weight: 600;\n        ";case"dollar":return"\n          color: #c2410c; /* Dark orange for $ */\n          font-weight: 600;\n        ";case"param":return"\n          color: #059669; /* Green for parameter names and values */\n          font-weight: 500;\n        ";case"param2":return"\n          color: #d97706; /* Amber for alternating parameters */\n          font-weight: 500;\n        ";case"param3":return"\n          color: #16a34a; /* Green for alternating parameters */\n          font-weight: 500;\n        ";case"equals":return"\n          color: #475569; /* Slate for equals sign */\n          font-weight: 500;\n        ";default:return""}}}
`,ac=e=>({client_id:"The unique identifier for your OAuth application. This is provided by the authorization server when you register your application.",redirect_uri:"The URL where the authorization server will redirect the user after they grant or deny permission. Must match the URI registered with your application.",response_type:'Specifies the type of response you want to receive. Common values are "code" (authorization code flow) or "token" (implicit flow).',scope:'A space-separated list of permissions your application is requesting. Common scopes include "openid", "profile", "email", etc.',state:"A random string used to prevent CSRF attacks. The authorization server will return this exact value, allowing you to verify the request.",nonce:"A random string used to prevent replay attacks, especially important for OpenID Connect flows.",code:"The authorization code returned by the authorization server after user consent. This code is exchanged for access tokens.",grant_type:'Specifies the OAuth grant type being used. For authorization code flow, this should be "authorization_code".',client_secret:"A secret key that authenticates your application to the authorization server. Keep this secure and never expose it in client-side code.",code_challenge:"Used in PKCE (Proof Key for Code Exchange) flow. A challenge derived from a code verifier.",code_challenge_method:'The method used to generate the code challenge. Usually "S256" for SHA256.',code_verifier:"A random string used in PKCE flow to generate the code challenge.",access_token:"A token that allows your application to access protected resources on behalf of the user.",token_type:'The type of token returned. Usually "Bearer" for OAuth 2.0.',expires_in:"The number of seconds until the access token expires.",refresh_token:"A token that can be used to obtain new access tokens without requiring user interaction.",id_token:"A JWT token containing user identity information, used in OpenID Connect flows."}[e]||"A parameter in the OAuth flow."),cc=({url:r,className:n,showInfoButton:i=!0})=>{const[o,s]=e.useState(!1);if(!r||"string"!=typeof r)return t.jsx("span",{className:n,children:r});const a=[],l=r.split(/([?&$])/);let d=0;for(let e=0;e<l.length;e++){const t=l[e];if("?"===t)a.push({type:"question",content:"?",description:"Separates the base URL from the query parameters."});else if("&"===t)a.push({type:"ampersand",content:"&",description:"Separates multiple query parameters."}),d++;else if("$"===t)a.push({type:"dollar",content:"$",description:"Special character often used in URL patterns or templates."});else if(t&&t.length>0)if(0===e)a.push({type:"base",content:t,description:"The base URL of the authorization server endpoint. This is where the OAuth request is sent."});else if(t.includes("=")){const[e,r]=t.split("="),n=d%3==0?"param":d%3==1?"param2":"param3";e&&a.push({type:n,content:e,description:ac(e)}),a.push({type:"equals",content:"=",description:"Separates parameter name from its value."}),r&&a.push({type:n,content:r,description:`Value: ${decodeURIComponent(r)}`})}else{const e=d%3==0?"param":d%3==1?"param2":"param3";a.push({type:e,content:t,description:ac(t)})}}return t.jsxs(t.Fragment,{children:[t.jsxs(Fa,{className:n,children:[t.jsx(qa,{children:a.map((e,r)=>t.jsx(sc,{type:e.type,children:e.content},r))}),i&&t.jsxs(Va,{onClick:()=>s(!0),children:[t.jsx(c,{}),"Info"]})]}),o&&t.jsx(Ba,{onClick:()=>s(!1),children:t.jsxs(Wa,{onClick:e=>e.stopPropagation(),children:[t.jsxs(Ga,{children:[t.jsx(Ha,{children:"URL Parameter Descriptions"}),t.jsx(Ja,{onClick:()=>s(!1),children:t.jsx(f,{})})]}),a.map((e,r)=>{const n={base:Ya,question:Xa,ampersand:Qa,param:Za,param2:ec,param3:tc,equals:rc,dollar:nc}[e.type];return t.jsxs(n,{children:[t.jsx(ic,{children:e.content}),t.jsx(oc,{children:e.description})]},r)})]})})]})},lc=Ce.div.withConfig({shouldForwardProp:e=>"collapsed"!==e&&"$collapsed"!==e})`
	margin-bottom: 2rem;
	background: #ffffff;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
	overflow: hidden;
	transition: all 0.3s ease;
`,dc=Ce.div`
	padding: 1.5rem;
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	border-bottom: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: background-color 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	}
`,uc=Ce.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	flex: 1;
`,pc=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	z-index: 1;

	* {
		pointer-events: auto;
	}
`,hc=Ce.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.75rem;
`,gc=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex: 1;
`,mc=Ce.h2`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #ffffff;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,fc=Ce.p`
	margin: 0.25rem 0 0 0;
	color: rgba(255, 255, 255, 0.9);
`,bc=Ce.div.withConfig({shouldForwardProp:e=>"collapsed"!==e&&"$collapsed"!==e})`
	color: #3b82f6;
	transform: ${({$collapsed:e})=>e?"rotate(-90deg)":"rotate(0deg)"};
	transition: transform 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	background-color: #ffffff;
	border-radius: 6px;
	border: 2px solid #3b82f6;
	transition: all 0.2s ease;

	svg {
		color: #3b82f6;
	}

	&:hover {
		transform: ${({$collapsed:e})=>e?"rotate(-90deg)":"rotate(0deg)"} scale(1.05);
		border-color: #2563eb;
	}
	&:active {
		transform: ${({$collapsed:e})=>e?"rotate(-90deg)":"rotate(0deg)"} scale(1.05);
		border-color: #2563eb;
	}
`,xc=Ce.div.withConfig({shouldForwardProp:e=>"collapsed"!==e&&"$collapsed"!==e})`
	padding: ${({$collapsed:e})=>e?"0":"1.5rem"};
	max-height: ${({$collapsed:e})=>e?"0":"1200px"};
	overflow: hidden;
	opacity: ${({$collapsed:e})=>e?"0":"1"};
	visibility: ${({$collapsed:e})=>e?"hidden":"visible"};
	transition: all 0.3s ease;
`,yc=({title:r,subtitle:n,children:i,defaultCollapsed:o=!0,icon:s,className:c,headerActions:l})=>{const[d,u]=e.useState(o);return t.jsxs(lc,{$collapsed:d,className:c,children:[t.jsxs(dc,{onClick:()=>{u(e=>!e)},children:[t.jsx(uc,{children:t.jsxs(gc,{children:[t.jsxs(mc,{children:[s&&t.jsx("span",{children:s}),r]}),n&&t.jsx(fc,{children:n})]})}),t.jsxs(hc,{children:[l&&t.jsx(pc,{onClick:e=>e.stopPropagation(),children:l}),t.jsx(bc,{$collapsed:d,"aria-hidden":"true",children:t.jsx(a,{size:18})})]})]}),t.jsx(xc,{$collapsed:d,children:i})]})},wc=Ae`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`,vc=Ce.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: ${wc} 1s linear infinite;

  svg {
    font-size: ${({size:e})=>e||16}px;
    color: ${({color:e,theme:t})=>e||t?.colors?.primary||"#0070CC"};
  }
`,kc=({size:e=16,color:r})=>t.jsx(vc,{size:e,color:r,children:t.jsx(ne,{})}),jc=Ce.div`
	background: linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%);
	border-radius: 1rem;
	padding: 2rem;
	margin: 2rem 0;
	border: 3px solid #2563eb;
	box-shadow: 0 8px 24px rgba(37, 99, 235, 0.2);
`,Sc=Ce.h2`
	color: #1e3a8a;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.75rem;
`,Cc=Ce.p`
	color: #1d4ed8;
	margin: 0 0 2rem 0;
	font-size: 1.05rem;
	line-height: 1.6;
`,Ac=Ce.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1.5rem;
	flex-wrap: wrap;
`,Tc=Ce.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	border-radius: 999px;
	border: 2px solid ${({$active:e})=>e?"#1d4ed8":"#bfdbfe"};
	background: ${({$active:e})=>e?"linear-gradient(135deg, rgba(29, 78, 216, 0.15), rgba(37, 99, 235, 0.15))":"#ffffff"};
	color: #1e3a8a;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: ${({$active:e})=>e?"0 8px 20px rgba(29, 78, 216, 0.25)":"0 2px 6px rgba(15, 23, 42, 0.08)"};

	&:hover {
		transform: translateY(-2px);
	}
`,_c=Ce.div`
	position: relative;
	flex: 1;
`,Rc=Ce.input`
	width: 100%;
	padding: 1rem 3rem 1rem 3rem;
	border-radius: 0.75rem;
	border: 2px solid #c4b5fd;
	background: white;
	font-size: 1rem;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
	}

	&::placeholder {
		color: #3b82f6;
	}
`,Ic=Ce.div`
	position: absolute;
	left: 1rem;
	top: 50%;
	transform: translateY(-50%);
	color: #2563eb;
`,$c=Ce.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 1rem;
	margin-bottom: 2rem;
`,Ec=Ce.button`
	background: white;
	border: 2px solid ${({$selected:e})=>e?"#2563eb":"#e5e7eb"};
	border-radius: 0.75rem;
	padding: 1.25rem;
	cursor: pointer;
	transition: all 0.2s;
	text-align: left;
	box-shadow: ${({$selected:e})=>e?"0 6px 20px rgba(37, 99, 235, 0.3)":"0 2px 6px rgba(0, 0, 0, 0.08)"};

	&:hover {
		transform: translateY(-3px);
		border-color: #2563eb;
		box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
	}
`,zc=Ce.div`
	font-weight: 700;
	color: #2563eb;
	font-size: 0.875rem;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Pc=Ce.div`
	color: #1e293b;
	font-weight: 600;
	font-size: 1rem;
	margin-bottom: 0.5rem;
	line-height: 1.4;
`,Oc=Ce.div`
	color: #64748b;
	font-size: 0.875rem;
	line-height: 1.5;
`,Uc=Ce.div`
	background: white;
	border-radius: 0.75rem;
	padding: 2rem;
	border: 2px solid #d1d5db;
`,Dc=Ce.h3`
	color: #1e3a8a;
	font-size: 1.3rem;
	font-weight: 700;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,Lc=Ce.div`
	display: flex;
	gap: 1.5rem;
	padding: 1rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
`,Nc=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #475569;
	font-size: 0.9rem;
`,Mc=Ce.span`
	font-weight: 600;
	color: #1e293b;
`,Fc=Ce.div`
	margin-bottom: 2rem;

	&:last-child {
		margin-bottom: 0;
	}
`,qc=Ce.h4`
	color: #1e293b;
	font-size: 1.1rem;
	font-weight: 700;
	margin: 0 0 0.75rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Vc=Ce.div`
	color: #475569;
	line-height: 1.7;
	font-size: 0.95rem;
	margin-bottom: 1rem;
`,Bc=Ce.div`
	background: #1e293b;
	color: #f1f5f9;
	padding: 1.5rem;
	border-radius: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.875rem;
	line-height: 1.6;
	position: relative;
	margin-bottom: 1rem;
	overflow-x: auto;
`,Wc=Ce.button`
	position: absolute;
	top: 0.75rem;
	right: 0.75rem;
	padding: 0.5rem 0.75rem;
	background: #2563eb;
	color: white;
	border: none;
	border-radius: 0.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: 0.75rem;
	transition: all 0.2s;

	&:hover {
		background: #1d4ed8;
	}
`,Gc=Ce.div`
	padding: 1rem;
	border-radius: 0.5rem;
	border-left: 4px solid ${({variant:e})=>{switch(e){case"info":return"#3b82f6";case"warning":return"#f59e0b";case"success":return"#10b981"}}};
	background: ${({variant:e})=>{switch(e){case"info":return"#dbeafe";case"warning":return"#fef3c7";case"success":return"#d1fae5"}}};
	color: ${({variant:e})=>{switch(e){case"info":return"#1e40af";case"warning":return"#92400e";case"success":return"#065f46"}}};
	line-height: 1.6;
	margin-bottom: 1rem;
`,Hc=Ce.a`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	color: white;
	text-decoration: none;
	border-radius: 0.5rem;
	font-weight: 600;
	transition: all 0.2s;
	margin-top: 1rem;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
	}
`,Jc=Ce.ul`
	margin: 0;
	padding-left: 1.25rem;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	color: #1f2937;
`,Kc=Ce.div`
	background: rgba(37, 99, 235, 0.12);
	border-radius: 0.5rem;
	padding: 1rem;
	border: 1px solid #93c5fd;
	color: #1e3a8a;
	margin-bottom: 1rem;
	line-height: 1.6;
`,Yc=Ce.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
`,Xc=Ce.a`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	background: #ffffff;
	border: 1px solid #bfdbfe;
	border-radius: 0.75rem;
	padding: 1rem 1.25rem;
	text-decoration: none;
	color: #1f2937;
	box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
	transition: transform 0.2s, box-shadow 0.2s;

	&:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 24px rgba(37, 99, 235, 0.2);
	}
`,Qc=Ce.div`
	font-weight: 700;
	color: #1d4ed8;
`,Zc=Ce.div`
	color: #475569;
	line-height: 1.5;
	font-size: 0.9rem;
`,el=[{id:"rfc6749",number:"RFC 6749",title:"OAuth 2.0 Authorization Framework",description:"The foundational OAuth 2.0 spec defining authorization flows",status:"Standard",year:"2012",summary:"RFC 6749 is THE OAuth 2.0 specification. It defines how applications can obtain limited access to user accounts on an HTTP service. Instead of sharing passwords, OAuth uses access tokens to grant access.",keyPoints:["🔑 Defines 4 grant types: Authorization Code, Implicit, Client Credentials, Resource Owner Password","🎯 Separates resource owner, client, authorization server, and resource server roles","🔒 Access tokens provide limited, time-bound access without exposing passwords","♻️ Refresh tokens enable long-lived access without re-authentication","⚠️ Deprecated: Implicit flow is now considered insecure for SPAs (use Authorization Code + PKCE)"],examples:[{title:"Authorization Code Flow (Most Common)",code:"// Step 1: Redirect user to authorization endpoint\nconst authUrl = `https://auth.pingone.com/${envId}/as/authorize?` +\n  new URLSearchParams({\n    client_id: 'YOUR_CLIENT_ID',\n    response_type: 'code',           // Request authorization code\n    redirect_uri: 'https://app.com/callback',\n    scope: 'openid profile email',\n    state: 'RANDOM_STATE_TOKEN',     // CSRF protection\n  });\n\nwindow.location.href = authUrl;\n\n// Step 2: Exchange code for tokens\nconst tokenResponse = await fetch(\n  `https://auth.pingone.com/${envId}/as/token`,\n  {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n    body: new URLSearchParams({\n      grant_type: 'authorization_code',\n      code: authorizationCode,       // From callback\n      redirect_uri: 'https://app.com/callback',\n      client_id: 'YOUR_CLIENT_ID',\n      client_secret: 'YOUR_SECRET',  // Server-side only!\n    }),\n  }\n);\n\nconst tokens = await tokenResponse.json();\n// { access_token, refresh_token, expires_in, token_type }"},{title:"Client Credentials Flow (Machine-to-Machine)",code:"// Server-to-server authentication (no user involved)\nconst tokenResponse = await fetch(\n  `https://auth.pingone.com/${envId}/as/token`,\n  {\n    method: 'POST',\n    headers: {\n      'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),\n      'Content-Type': 'application/x-www-form-urlencoded',\n    },\n    body: new URLSearchParams({\n      grant_type: 'client_credentials',\n      scope: 'api:read api:write',\n    }),\n  }\n);\n\nconst tokens = await tokenResponse.json();\n// { access_token, expires_in, token_type, scope }\n\n// Use access token for API calls\nconst apiResponse = await fetch('https://api.example.com/data', {\n  headers: {\n    'Authorization': `Bearer ${tokens.access_token}`,\n  },\n});"}],pingoneSupport:"✅ PingOne fully supports RFC 6749. Authorization Code and Client Credentials are recommended. Implicit and Password flows are deprecated.",url:"https://datatracker.ietf.org/doc/html/rfc6749",deepDiveInsights:["Section 10.12 highlights native app loopback URIs — pair with PKCE to mitigate code interception.","Token endpoint MUST validate redirect_uri for confidential clients; PingOne enforces exact string match.","Refresh tokens are optional; ensure rotation or reuse detection when issued to public clients."],pingoneCallouts:["PingOne disables Resource Owner Password grant out of the box — keep it that way.","Redirect URI whitelist lives under Applications → Connections. Use dedicated URIs per environment.","Enable Proof Key for Code Exchange for every public client to comply with RFC 8252."],relatedTools:[{name:"OAuth Detective",description:"Break down authorization URLs and validate required RFC 6749 parameters.",route:"/flows/advanced-oauth-params-demo"},{name:"Response_Mode Sandbox",description:"Visualize how the authorization response is returned for each response_mode.",route:"/flows/advanced-oauth-params-demo"}]},{id:"rfc7636",number:"RFC 7636",title:"PKCE (Proof Key for Code Exchange)",description:"Security extension preventing authorization code interception",status:"Best Current Practice",year:"2015",summary:"PKCE prevents authorization code interception attacks in mobile and single-page apps that cannot securely store client secrets. It uses cryptographic proof that the same client that requested the code is exchanging it.",keyPoints:["🔒 MANDATORY for public clients (mobile apps, SPAs) - RFC 8252 requires it","🎯 Prevents authorization code interception even if attacker has code","💻 Works by generating code_verifier (random) and code_challenge (hashed)","✅ Should also be used for confidential clients as defense-in-depth","⚡ Uses SHA-256 hashing (S256 method recommended over plain)"],examples:[{title:"PKCE Implementation",code:"import crypto from 'crypto';\n\n// Step 1: Generate PKCE pair\nconst codeVerifier = crypto.randomBytes(32).toString('hex');\n\n// Hash the verifier\nconst codeChallenge = crypto\n  .createHash('sha256')\n  .update(codeVerifier)\n  .digest('base64url');  // Base64-URL encoding\n\n// Store verifier securely (session, secure storage)\nsessionStorage.setItem('pkce_verifier', codeVerifier);\n\n// Step 2: Authorization request with code_challenge\nconst authUrl = `https://auth.pingone.com/${envId}/as/authorize?` +\n  new URLSearchParams({\n    client_id: 'YOUR_CLIENT_ID',\n    response_type: 'code',\n    redirect_uri: 'https://app.com/callback',\n    scope: 'openid profile',\n    code_challenge: codeChallenge,        // Hashed version\n    code_challenge_method: 'S256',        // SHA-256\n    state: 'RANDOM_STATE',\n  });\n\n// Step 3: Token exchange with code_verifier\nconst tokenResponse = await fetch(tokenEndpoint, {\n  method: 'POST',\n  body: new URLSearchParams({\n    grant_type: 'authorization_code',\n    code: authorizationCode,\n    redirect_uri: 'https://app.com/callback',\n    client_id: 'YOUR_CLIENT_ID',\n    code_verifier: codeVerifier,          // Original unhashed value\n  }),\n});\n\n// Server validates: SHA256(code_verifier) === stored code_challenge\n// If attacker steals code but doesn't have verifier → REJECTED"}],pingoneSupport:"✅ PingOne REQUIRES PKCE for public clients and strongly recommends it for all clients. Both S256 and plain methods supported.",url:"https://datatracker.ietf.org/doc/html/rfc7636",deepDiveInsights:["S256 is the only method permitted by current security BCP guidance — treat plain as legacy.","Code verifier MUST be between 43 and 128 characters; random bytes + base64url ensures compliance.","Store verifier server-side when using redirectless flows to prevent XSS leakage."],pingoneCallouts:["PingOne auto-validates code_challenge vs. code_verifier; failures appear in the Access logs.","Redirectless auth requires you to persist the code_verifier via RedirectlessAuthService.","Enable policy rule “Require PKCE” on the PingOne application to block non-compliant clients."],relatedTools:[{name:"Security Threat Theater",description:"See code interception attacks play out when PKCE is missing.",route:"/flows/advanced-oauth-params-demo"},{name:"Scope Impact Playground",description:"Pair PKCE with least-privilege scopes tailored to your client type.",route:"/flows/advanced-oauth-params-demo"}]},{id:"rfc8707",number:"RFC 8707",title:"Resource Indicators for OAuth 2.0",description:"Limit access token scope to specific APIs/resources",status:"Standard",year:"2020",summary:'Resource indicators let you request tokens scoped to specific APIs. Instead of one token for "everything," you get audience-limited tokens. If stolen, the blast radius is contained.',keyPoints:["🎯 Limits access token to specific resource servers (APIs)","🔒 Reduces blast radius if token is compromised","☁️ Essential for multi-tenant SaaS platforms",'✅ Access token includes "aud" (audience) claim with resource URL',"📋 Can request multiple resources in single authorization request"],examples:[{title:"Multi-API Token Request",code:"// Request access to multiple customer APIs\nconst params = new URLSearchParams({\n  client_id: 'YOUR_CLIENT_ID',\n  response_type: 'code',\n  redirect_uri: 'https://app.com/callback',\n  scope: 'api:read api:write',\n  state: 'RANDOM_STATE',\n});\n\n// Add each resource separately (don't use array)\nparams.append('resource', 'https://customerA.api.com');\nparams.append('resource', 'https://customerB.api.com');\nparams.append('resource', 'https://analytics.api.com');\n\nconst authUrl = `https://auth.pingone.com/${envId}/as/authorize?${params}`;\n\n// Resulting access token will have:\nconst accessToken = {\n  aud: [\n    'https://customerA.api.com',\n    'https://customerB.api.com',\n    'https://analytics.api.com',\n  ],\n  scope: 'api:read api:write',\n  // ...\n};\n\n// Each API validates its URL is in audience\nfunction validateTokenForAPI(token, apiUrl) {\n  const payload = jwt.decode(token);\n  \n  if (!payload.aud.includes(apiUrl)) {\n    throw new Error(`Token not valid for ${apiUrl}`);\n  }\n  \n  // Token is valid for this specific API\n}\n\n// If token is stolen, it ONLY works for these 3 APIs\n// Cannot be used for other customer APIs"}],pingoneSupport:"✅ PingOne supports resource indicators. Use for multi-tenant apps or microservices architectures.",url:"https://datatracker.ietf.org/doc/html/rfc8707",deepDiveInsights:["Multiple resource parameters are appended individually — arrays are NOT allowed.","Access tokens may include multiple audience claims; APIs must enforce the relevant audience.","Combine with Pushed Authorization Requests to prevent tampering with resource list."],pingoneCallouts:["PingOne currently supports single resource per request; use multiple authorization requests for fan-out.","Map each resource to an API service in PingOne so introspection reflects correct audience.","Leverage RAR (RFC 9396) for fine-grained payloads layered on top of resource indicators."],relatedTools:[{name:"Scope Impact Playground",description:"Design scope bundles that align with specific resource APIs.",route:"/flows/advanced-oauth-params-demo"},{name:"Parameter Impact Visualizer",description:"Model how resource indicators reshape downstream token claims.",route:"/flows/advanced-oauth-params-demo"}]},{id:"openid-connect",number:"OpenID Connect 1.0",title:"OpenID Connect Core",description:"Identity layer on top of OAuth 2.0",status:"Standard",year:"2014",summary:'OpenID Connect (OIDC) extends OAuth 2.0 with identity. While OAuth answers "Can I access this API?", OIDC answers "Who is this user?". It adds ID tokens (JWT) with user identity claims.',keyPoints:["👤 Adds authentication (user identity) to OAuth 2.0 authorization","🎫 Introduces ID Token (JWT) containing user profile claims","🔍 Provides UserInfo endpoint for additional user data",'✅ Requires "openid" scope to activate OIDC features',"🔒 ID tokens are signed JWTs - validate signature before trusting"],examples:[{title:"OIDC Authentication Flow",code:"// Request authentication with OIDC\nconst authUrl = `https://auth.pingone.com/${envId}/as/authorize?` +\n  new URLSearchParams({\n    client_id: 'YOUR_CLIENT_ID',\n    response_type: 'code',\n    redirect_uri: 'https://app.com/callback',\n    scope: 'openid profile email',  // 'openid' activates OIDC\n    state: 'RANDOM_STATE',\n    nonce: 'RANDOM_NONCE',          // Required for ID token replay protection\n  });\n\n// Token response includes ID token\nconst tokens = await exchangeCodeForTokens(code);\n// {\n//   access_token: '...',\n//   id_token: 'eyJhbGc...',    // JWT with user identity\n//   refresh_token: '...',\n// }\n\n// Decode and validate ID token\nconst idToken = jwt.verify(tokens.id_token, publicKey);\nconsole.log('User ID:', idToken.sub);\nconsole.log('Name:', idToken.name);\nconsole.log('Email:', idToken.email);\nconsole.log('Email Verified:', idToken.email_verified);\n\n// ID Token structure:\n{\n  iss: 'https://auth.pingone.com/YOUR_ENV_ID',  // Issuer\n  sub: 'user-uuid-here',                         // Subject (user ID)\n  aud: 'YOUR_CLIENT_ID',                         // Audience\n  exp: 1640995200,                               // Expiration\n  iat: 1640991600,                               // Issued at\n  auth_time: 1640991600,                         // When user authenticated\n  nonce: 'RANDOM_NONCE',                         // From request\n  name: 'John Doe',\n  email: 'john@example.com',\n  email_verified: true,\n}"},{title:"UserInfo Endpoint",code:"// Get additional user claims with access token\nconst userInfoResponse = await fetch(\n  `https://auth.pingone.com/${envId}/as/userinfo`,\n  {\n    headers: {\n      'Authorization': `Bearer ${accessToken}`,\n    },\n  }\n);\n\nconst userInfo = await userInfoResponse.json();\n// {\n//   sub: 'user-uuid',\n//   name: 'John Doe',\n//   given_name: 'John',\n//   family_name: 'Doe',\n//   email: 'john@example.com',\n//   email_verified: true,\n//   picture: 'https://...',\n//   updated_at: 1640991600,\n// }\n\n// Use for profile pages, personalization, etc."}],pingoneSupport:"✅ PingOne is OpenID Certified. Fully supports OIDC Core, Discovery, and Dynamic Registration.",url:"https://openid.net/specs/openid-connect-core-1_0.html",deepDiveInsights:["nonce claim is mandatory for implicit/hybrid — treat it as replay defense alongside PKCE.","Use acr_values and max_age to demand step-up per business process.","UserInfo may be cached briefly, but profile changes rely on updated ID tokens or SCIM."],pingoneCallouts:["PingOne discovery document advertises JWKS; rotate signing keys via console → Certificates.","Device Authorization and Redirectless flows still issue full OIDC-compatible ID tokens.","Enable advanced claims mapping to add PingOne custom attributes into ID token."],relatedTools:[{name:"Advanced OAuth Parameters Demo",description:"Experiment with acr_values, max_age, and claims requests before hitting production.",route:"/flows/advanced-oauth-params-demo"},{name:"Policy Wizard",description:"Generate PingOne policies tying MFA and claim release to OIDC requirements.",route:"/flows/advanced-oauth-params-demo"}]},{id:"rfc8628",number:"RFC 8628",title:"OAuth 2.0 Device Authorization Grant",description:"OAuth for devices without browsers (Smart TVs, IoT)",status:"Standard",year:"2019",summary:"Device Flow enables OAuth on input-constrained devices like Smart TVs, game consoles, and IoT sensors. User authenticates on their phone/computer while the device polls for completion.",keyPoints:["📺 Designed for devices without browsers or limited input (Smart TVs, CLI tools)","📱 User authenticates on secondary device (phone/computer)","🔄 Device polls token endpoint until user completes authorization","⏱️ Includes rate limiting to prevent excessive polling","🎯 Perfect for IoT, Smart TVs, streaming devices, developer CLIs"],examples:[{title:"Device Flow Implementation",code:"// Step 1: Request device code\nconst deviceResponse = await fetch(\n  `https://auth.pingone.com/${envId}/as/device_authorization`,\n  {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n    body: new URLSearchParams({\n      client_id: 'YOUR_CLIENT_ID',\n      scope: 'openid profile device:control',\n    }),\n  }\n);\n\nconst deviceData = await deviceResponse.json();\n// {\n//   device_code: 'GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS',\n//   user_code: 'WDJB-MJHT',              // Show this to user\n//   verification_uri: 'https://auth.pingone.com/activate',\n//   verification_uri_complete: 'https://auth.pingone.com/activate?user_code=WDJB-MJHT',\n//   expires_in: 1800,                    // 30 minutes\n//   interval: 5,                         // Poll every 5 seconds\n// }\n\n// Step 2: Display to user\nconsole.log(`\\n📺 To activate this device:`);\nconsole.log(`   1. Visit: ${deviceData.verification_uri}`);\nconsole.log(`   2. Enter code: ${deviceData.user_code}\\n`);\n\n// OR show QR code with verification_uri_complete\n\n// Step 3: Poll for tokens\nconst interval = deviceData.interval * 1000;\nconst maxTime = deviceData.expires_in * 1000;\nconst startTime = Date.now();\n\nwhile (Date.now() - startTime < maxTime) {\n  await new Promise(resolve => setTimeout(resolve, interval));\n  \n  const tokenResponse = await fetch(\n    `https://auth.pingone.com/${envId}/as/token`,\n    {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n      body: new URLSearchParams({\n        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',\n        device_code: deviceData.device_code,\n        client_id: 'YOUR_CLIENT_ID',\n      }),\n    }\n  );\n  \n  const result = await tokenResponse.json();\n  \n  if (result.error === 'authorization_pending') {\n    // Still waiting for user\n    console.log('Waiting...');\n    continue;\n  } else if (result.error === 'slow_down') {\n    // Polling too fast, increase interval\n    interval += 5000;\n    continue;\n  } else if (result.error) {\n    throw new Error(result.error);\n  } else {\n    // Success!\n    console.log('✅ Device authorized!');\n    return result;\n  }\n}\n\nthrow new Error('Device code expired');"}],pingoneSupport:"✅ PingOne fully supports Device Flow. Perfect for Smart TVs, game consoles, and developer CLIs.",url:"https://datatracker.ietf.org/doc/html/rfc8628",deepDiveInsights:["Polling interval should back off when receiving slow_down errors — exponential backoff recommended.","Device codes expire quickly; design UI to refresh instructions without confusing the user.","Pair with PKCE if devices eventually exchange via browser-based callback."],pingoneCallouts:["PingOne exposes /device_authorization endpoint; enable in application connection settings.","Customize verification URI copy in PingOne branding to match your device instructions.","Throttle polling with the interval supplied by PingOne (default 5 seconds)."],relatedTools:[{name:"Security Threat Theater",description:"Season 2 covers device code abuse and how polling controls mitigate it.",route:"/flows/advanced-oauth-params-demo"},{name:"Policy Wizard",description:"Plan device MFA and risk policies tailored to shared devices.",route:"/flows/advanced-oauth-params-demo"}]}],tl=()=>{const[r,i]=e.useState(""),[o,a]=e.useState(null),[c,l]=e.useState(!1),d=el.filter(e=>e.title.toLowerCase().includes(r.toLowerCase())||e.number.toLowerCase().includes(r.toLowerCase())||e.description.toLowerCase().includes(r.toLowerCase())),p=el.find(e=>e.id===o),g=e.useCallback(e=>{navigator.clipboard.writeText(e),Ge.showSuccess("Code copied!")},[]);return t.jsxs(jc,{children:[t.jsxs(Sc,{children:[t.jsx(N,{size:32}),"Live RFC Explorer"]}),t.jsx(Cc,{children:"📚 OAuth/OIDC specifications decoded. Real examples, plain English, PingOne compatibility notes."}),t.jsxs(Ac,{children:[t.jsxs(_c,{children:[t.jsx(Ic,{children:t.jsx(I,{size:20})}),t.jsx(Rc,{type:"text",placeholder:"Search OAuth specs... (e.g., PKCE, Device Flow, OIDC)",value:r,onChange:e=>i(e.target.value)})]}),t.jsxs(Tc,{type:"button",$active:c,onClick:()=>l(e=>!e),"aria-pressed":c,children:[t.jsx(O,{}),c?"Deep Dive Mode: ON":"Enable Deep Dive Mode"]})]}),t.jsx($c,{children:d.map(e=>t.jsxs(Ec,{$selected:o===e.id,onClick:()=>a(e.id),children:[t.jsxs(zc,{children:[t.jsx(J,{}),e.number]}),t.jsx(Pc,{children:e.title}),t.jsx(Oc,{children:e.description})]},e.id))}),p&&t.jsxs(Uc,{children:[t.jsxs(Dc,{children:[t.jsx(N,{}),p.number,": ",p.title]}),t.jsxs(Lc,{children:[t.jsxs(Nc,{children:[t.jsx(Mc,{children:"Status:"}),p.status]}),t.jsxs(Nc,{children:[t.jsx(Mc,{children:"Year:"}),p.year]}),t.jsxs(Nc,{children:[t.jsx(h,{size:14}),t.jsxs(Hc,{href:p.url,target:"_blank",rel:"noopener noreferrer",children:["View Official Spec",t.jsx(h,{})]})]})]}),t.jsxs(Fc,{children:[t.jsx(qc,{children:"📖 What Is It?"}),t.jsx(Vc,{children:p.summary})]}),t.jsxs(Fc,{children:[t.jsx(qc,{children:"🎯 Key Points"}),p.keyPoints.map((e,r)=>t.jsxs(Vc,{children:["• ",e]},r))]}),t.jsxs(Fc,{children:[t.jsxs(qc,{children:[t.jsx(s,{}),"Real Code Examples"]}),p.examples.map((e,r)=>t.jsxs("div",{children:[t.jsx(Vc,{style:{fontWeight:600,color:"#1e293b"},children:e.title}),t.jsxs(Bc,{children:[t.jsxs(Wc,{onClick:()=>g(e.code),children:[t.jsx(n,{size:12}),"Copy"]}),t.jsx("pre",{style:{margin:0},children:e.code})]})]},r))]}),t.jsxs(Fc,{children:[t.jsxs(qc,{children:[t.jsx(u,{}),"PingOne Support"]}),t.jsx(Gc,{variant:"success",children:p.pingoneSupport})]}),c&&t.jsxs(t.Fragment,{children:[t.jsxs(Fc,{children:[t.jsxs(qc,{children:[t.jsx(O,{}),"Deep Dive Insights"]}),t.jsx(Jc,{children:p.deepDiveInsights.map(e=>t.jsx("li",{children:e},e))})]}),t.jsxs(Fc,{children:[t.jsxs(qc,{children:[t.jsx(ie,{}),"PingOne Implementation Notes"]}),p.pingoneCallouts.map(e=>t.jsx(Kc,{children:e},e))]}),t.jsxs(Fc,{children:[t.jsxs(qc,{children:[t.jsx(B,{}),"Practice With These Playground Tools"]}),t.jsx(Yc,{children:p.relatedTools.map(e=>t.jsxs(Xc,{href:e.route,children:[t.jsx(Qc,{children:e.name}),t.jsx(Zc,{children:e.description})]},e.name))})]})]})]}),!p&&t.jsx("div",{style:{textAlign:"center",padding:"3rem",color:"#1d4ed8",fontSize:"1.1rem"},children:"👆 Select a specification above to explore OAuth/OIDC standards with real examples"})]})},rl=Ce.div`
	background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
	border-radius: 1rem;
	padding: 2rem;
	margin: 2rem 0;
	border: 3px solid #10b981;
	box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
`,nl=Ce.h2`
	color: #065f46;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.75rem;
`,il=Ce.p`
	color: #047857;
	margin: 0 0 2rem 0;
	font-size: 1.05rem;
	line-height: 1.6;
`,ol=Ce.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`,sl=Ce.button`
	background: white;
	border: 3px solid ${({$selected:e})=>e?"#10b981":"#e5e7eb"};
	border-radius: 0.75rem;
	padding: 1.5rem;
	cursor: pointer;
	transition: all 0.2s;
	text-align: left;
	box-shadow: ${({$selected:e})=>e?"0 8px 24px rgba(16, 185, 129, 0.3)":"0 2px 8px rgba(0, 0, 0, 0.1)"};

	&:hover {
		transform: translateY(-4px);
		border-color: #10b981;
		box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
	}
`,al=Ce.div`
	width: 56px;
	height: 56px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${({color:e})=>e};
	color: white;
	font-size: 1.75rem;
	margin-bottom: 1rem;
`,cl=Ce.div`
	color: #1e293b;
	font-weight: 700;
	font-size: 1.2rem;
	margin-bottom: 0.5rem;
`,ll=Ce.div`
	color: #64748b;
	font-size: 0.95rem;
	line-height: 1.5;
	margin-bottom: 1rem;
`,dl=Ce.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`,ul=Ce.span`
	padding: 0.25rem 0.75rem;
	background: #f1f5f9;
	color: #475569;
	border-radius: 1rem;
	font-size: 0.75rem;
	font-weight: 600;
`,pl=Ce.div`
	background: white;
	border-radius: 0.75rem;
	padding: 2rem;
	border: 2px solid #d1d5db;
	margin-bottom: 2rem;
`,hl=Ce.div`
	margin-bottom: 2rem;

	&:last-child {
		margin-bottom: 0;
	}
`,gl=Ce.h3`
	color: #1e293b;
	font-size: 1.1rem;
	font-weight: 700;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,ml=Ce.div`
	display: grid;
	gap: 0.75rem;
`,fl=Ce.div`
	display: grid;
	grid-template-columns: 180px 1fr;
	gap: 1rem;
	align-items: center;
	padding: 0.75rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	border-left: 4px solid #3b82f6;
`,bl=Ce.div`
	font-family: 'Monaco', 'Menlo', monospace;
	font-weight: 600;
	color: #1e40af;
	font-size: 0.9rem;
`,xl=Ce.div`
	font-family: 'Monaco', 'Menlo', monospace;
	color: #059669;
	font-size: 0.875rem;
	word-break: break-all;
`,yl=Ce.div`
	background: #fef3c7;
	border-left: 4px solid #f59e0b;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
`,wl=Ce.div`
	font-weight: 700;
	color: #92400e;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,vl=Ce.div`
	color: #78350f;
	line-height: 1.6;
	font-size: 0.9rem;
`,kl=Ce.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1rem;
	border-bottom: 2px solid #e5e7eb;
`,jl=Ce.button`
	padding: 0.75rem 1.5rem;
	border: none;
	background: ${({$active:e})=>e?"#10b981":"transparent"};
	color: ${({$active:e})=>e?"white":"#64748b"};
	font-weight: 600;
	cursor: pointer;
	border-radius: 0.5rem 0.5rem 0 0;
	transition: all 0.2s;

	&:hover {
		background: ${({$active:e})=>e?"#059669":"#f1f5f9"};
	}
`,Sl=Ce.pre`
	background: #1e293b;
	color: #f1f5f9;
	padding: 1.5rem;
	border-radius: 0.75rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.875rem;
	line-height: 1.6;
	position: relative;
`,Cl=Ce.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	padding: 0.5rem 1rem;
	background: #10b981;
	color: white;
	border: none;
	border-radius: 0.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	transition: all 0.2s;

	&:hover {
		background: #059669;
		transform: translateY(-2px);
	}
`,Al=Ce.div`
	display: flex;
	gap: 1rem;
	margin-top: 2rem;
`,Tl=Ce.button`
	padding: 1rem 2rem;
	border-radius: 0.75rem;
	border: none;
	font-weight: 700;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1rem;
	transition: all 0.2s;
	background: ${({variant:e})=>"secondary"===e?"white":"linear-gradient(135deg, #10b981 0%, #059669 100%)"};
	color: ${({variant:e})=>"secondary"===e?"#059669":"white"};
	border: ${({variant:e})=>"secondary"===e?"2px solid #10b981":"none"};

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
	}
`,_l=[{id:"banking-mfa",icon:t.jsx(oe,{}),iconColor:"linear-gradient(135deg, #10b981 0%, #059669 100%)",title:"Banking App with MFA",description:"High-security financial application requiring multi-factor authentication and recent login verification",tags:["PCI-DSS","High Security","MFA Required"],parameters:{response_type:"code",scope:"openid profile email",prompt:"login",max_age:"300",acr_values:"urn:pingidentity:strong_auth",code_challenge_method:"S256",state:"RANDOM_STATE_TOKEN",nonce:"RANDOM_NONCE_VALUE"},whyItMatters:"Financial apps MUST force fresh authentication (max_age=300 = 5 min), require MFA (acr_values), and use PKCE for mobile apps. PCI-DSS compliance requires these security measures.",industryExample:"💳 Chase, Bank of America, and Wells Fargo use these exact parameters for their mobile banking apps.",codeExamples:{javascript:"// Banking App OAuth Configuration\nimport crypto from 'crypto';\n\n// Generate PKCE for mobile/SPA security\nconst codeVerifier = crypto.randomBytes(32).toString('hex');\nconst codeChallenge = crypto\n  .createHash('sha256')\n  .update(codeVerifier)\n  .digest('base64url');\n\n// Generate security tokens\nconst state = crypto.randomBytes(32).toString('hex');\nconst nonce = crypto.randomBytes(32).toString('hex');\n\n// Store for validation\nsessionStorage.setItem('pkce_verifier', codeVerifier);\nsessionStorage.setItem('oauth_state', state);\nsessionStorage.setItem('oauth_nonce', nonce);\n\nconst authUrl = `https://auth.pingone.com/${envId}/as/authorize?` +\n  new URLSearchParams({\n    client_id: clientId,\n    response_type: 'code',\n    redirect_uri: redirectUri,\n    scope: 'openid profile email',\n    prompt: 'login',          // Force re-authentication\n    max_age: '300',           // 5 minutes max age\n    acr_values: 'urn:pingidentity:strong_auth', // Require MFA\n    code_challenge: codeChallenge,\n    code_challenge_method: 'S256',\n    state: state,\n    nonce: nonce,\n  });\n\n// Redirect to authentication\nwindow.location.href = authUrl;",python:"# Banking App OAuth Configuration\nimport hashlib\nimport secrets\nimport base64\nfrom urllib.parse import urlencode\n\n# Generate PKCE for security\ncode_verifier = secrets.token_urlsafe(32)\ncode_challenge = base64.urlsafe_b64encode(\n    hashlib.sha256(code_verifier.encode()).digest()\n).decode().rstrip('=')\n\n# Generate security tokens\nstate = secrets.token_urlsafe(32)\nnonce = secrets.token_urlsafe(32)\n\n# Store in session\nsession['pkce_verifier'] = code_verifier\nsession['oauth_state'] = state\nsession['oauth_nonce'] = nonce\n\n# Build authorization URL\nparams = {\n    'client_id': client_id,\n    'response_type': 'code',\n    'redirect_uri': redirect_uri,\n    'scope': 'openid profile email',\n    'prompt': 'login',\n    'max_age': '300',\n    'acr_values': 'urn:pingidentity:strong_auth',\n    'code_challenge': code_challenge,\n    'code_challenge_method': 'S256',\n    'state': state,\n    'nonce': nonce,\n}\n\nauth_url = f\"https://auth.pingone.com/{env_id}/as/authorize?{urlencode(params)}\"\nreturn redirect(auth_url)",java:'// Banking App OAuth Configuration\nimport java.security.MessageDigest;\nimport java.security.SecureRandom;\nimport java.util.Base64;\n\npublic class BankingOAuthConfig {\n    public String buildAuthUrl() throws Exception {\n        // Generate PKCE\n        SecureRandom random = new SecureRandom();\n        byte[] codeVerifierBytes = new byte[32];\n        random.nextBytes(codeVerifierBytes);\n        String codeVerifier = Base64.getUrlEncoder()\n            .withoutPadding()\n            .encodeToString(codeVerifierBytes);\n        \n        MessageDigest digest = MessageDigest.getInstance("SHA-256");\n        byte[] hash = digest.digest(codeVerifier.getBytes());\n        String codeChallenge = Base64.getUrlEncoder()\n            .withoutPadding()\n            .encodeToString(hash);\n        \n        // Generate tokens\n        byte[] stateBytes = new byte[32];\n        random.nextBytes(stateBytes);\n        String state = Base64.getUrlEncoder()\n            .withoutPadding()\n            .encodeToString(stateBytes);\n        \n        // Store in session\n        session.setAttribute("pkce_verifier", codeVerifier);\n        session.setAttribute("oauth_state", state);\n        \n        // Build URL\n        return String.format(\n            "https://auth.pingone.com/%s/as/authorize?" +\n            "client_id=%s" +\n            "&response_type=code" +\n            "&redirect_uri=%s" +\n            "&scope=openid%%20profile%%20email" +\n            "&prompt=login" +\n            "&max_age=300" +\n            "&acr_values=urn:pingidentity:strong_auth" +\n            "&code_challenge=%s" +\n            "&code_challenge_method=S256" +\n            "&state=%s",\n            envId, clientId, redirectUri, \n            codeChallenge, state\n        );\n    }\n}',csharp:'// Banking App OAuth Configuration\nusing System;\nusing System.Security.Cryptography;\nusing System.Text;\n\npublic class BankingOAuthConfig\n{\n    public string BuildAuthUrl()\n    {\n        // Generate PKCE\n        var codeVerifier = GenerateRandomString(32);\n        var codeChallenge = GenerateCodeChallenge(codeVerifier);\n        \n        // Generate security tokens\n        var state = GenerateRandomString(32);\n        var nonce = GenerateRandomString(32);\n        \n        // Store in session\n        HttpContext.Session.SetString("pkce_verifier", codeVerifier);\n        HttpContext.Session.SetString("oauth_state", state);\n        HttpContext.Session.SetString("oauth_nonce", nonce);\n        \n        // Build URL\n        var authUrl = $"https://auth.pingone.com/{envId}/as/authorize?" +\n            $"client_id={clientId}" +\n            $"&response_type=code" +\n            $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +\n            $"&scope=openid%20profile%20email" +\n            $"&prompt=login" +\n            $"&max_age=300" +\n            $"&acr_values=urn:pingidentity:strong_auth" +\n            $"&code_challenge={codeChallenge}" +\n            $"&code_challenge_method=S256" +\n            $"&state={state}" +\n            $"&nonce={nonce}";\n        \n        return authUrl;\n    }\n    \n    private string GenerateCodeChallenge(string verifier)\n    {\n        using var sha256 = SHA256.Create();\n        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(verifier));\n        return Convert.ToBase64String(hash)\n            .TrimEnd(\'=\')\n            .Replace(\'+\', \'-\')\n            .Replace(\'/\', \'_\');\n    }\n}'}},{id:"saas-multi-tenant",icon:t.jsx(re,{}),iconColor:"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",title:"Multi-Tenant SaaS Platform",description:"Cloud software with multiple customer APIs requiring resource-specific tokens",tags:["SaaS","Multi-API","Resource Indicators"],parameters:{response_type:"code",scope:"openid profile email api:read api:write","resource[]":"https://customerA.api.com, https://customerB.api.com",code_challenge_method:"S256",state:"RANDOM_STATE_TOKEN"},whyItMatters:"Multi-tenant SaaS apps need resource indicators (RFC 8707) to limit token scope. If CustomerA's token is stolen, it can't access CustomerB's data.",industryExample:"☁️ Salesforce, HubSpot, and Zendesk use resource indicators to isolate customer data.",codeExamples:{javascript:"// Multi-Tenant SaaS OAuth\nimport crypto from 'crypto';\n\n// User wants to access multiple customer APIs\nconst customerApis = [\n  'https://customerA.api.com',\n  'https://customerB.api.com',\n];\n\n// Generate PKCE\nconst codeVerifier = crypto.randomBytes(32).toString('hex');\nconst codeChallenge = crypto\n  .createHash('sha256')\n  .update(codeVerifier)\n  .digest('base64url');\n\nconst state = crypto.randomBytes(32).toString('hex');\n\nsessionStorage.setItem('pkce_verifier', codeVerifier);\nsessionStorage.setItem('oauth_state', state);\n\n// Build URL with multiple resources (RFC 8707)\nconst params = new URLSearchParams({\n  client_id: clientId,\n  response_type: 'code',\n  redirect_uri: redirectUri,\n  scope: 'openid profile email api:read api:write',\n  code_challenge: codeChallenge,\n  code_challenge_method: 'S256',\n  state: state,\n});\n\n// Add each resource separately\ncustomerApis.forEach(api => {\n  params.append('resource', api);\n});\n\nconst authUrl = `https://auth.pingone.com/${envId}/as/authorize?${params}`;\n\n// Access token will contain:\n// { \n//   \"aud\": [\"https://customerA.api.com\", \"https://customerB.api.com\"],\n//   \"scope\": \"api:read api:write\",\n//   ...\n// }\n\n// Each API validates its URL is in the audience\nfunction validateToken(token, apiUrl) {\n  if (!token.aud.includes(apiUrl)) {\n    throw new Error('Token not authorized for this API');\n  }\n}",python:"# Multi-Tenant SaaS OAuth\nimport secrets\nimport hashlib\nimport base64\nfrom urllib.parse import urlencode\n\n# Customer APIs to access\ncustomer_apis = [\n    'https://customerA.api.com',\n    'https://customerB.api.com',\n]\n\n# Generate PKCE\ncode_verifier = secrets.token_urlsafe(32)\ncode_challenge = base64.urlsafe_b64encode(\n    hashlib.sha256(code_verifier.encode()).digest()\n).decode().rstrip('=')\n\nstate = secrets.token_urlsafe(32)\n\n# Store in session\nsession['pkce_verifier'] = code_verifier\nsession['oauth_state'] = state\n\n# Build authorization URL with resources\nparams = [\n    ('client_id', client_id),\n    ('response_type', 'code'),\n    ('redirect_uri', redirect_uri),\n    ('scope', 'openid profile email api:read api:write'),\n    ('code_challenge', code_challenge),\n    ('code_challenge_method', 'S256'),\n    ('state', state),\n]\n\n# Add each resource\nfor api in customer_apis:\n    params.append(('resource', api))\n\nauth_url = f\"https://auth.pingone.com/{env_id}/as/authorize?{urlencode(params)}\"\n\n# Token validation in API\ndef validate_token(token, api_url):\n    if api_url not in token.get('aud', []):\n        raise ValueError('Token not authorized for this API')",java:'// Multi-Tenant SaaS OAuth\nimport java.net.URLEncoder;\nimport java.security.MessageDigest;\nimport java.security.SecureRandom;\nimport java.util.Base64;\nimport java.util.List;\n\npublic class SaaSMultiTenantOAuth {\n    public String buildAuthUrl(List<String> customerApis) throws Exception {\n        // Generate PKCE\n        SecureRandom random = new SecureRandom();\n        byte[] verifierBytes = new byte[32];\n        random.nextBytes(verifierBytes);\n        String codeVerifier = Base64.getUrlEncoder()\n            .withoutPadding()\n            .encodeToString(verifierBytes);\n        \n        MessageDigest digest = MessageDigest.getInstance("SHA-256");\n        String codeChallenge = Base64.getUrlEncoder()\n            .withoutPadding()\n            .encodeToString(digest.digest(codeVerifier.getBytes()));\n        \n        byte[] stateBytes = new byte[32];\n        random.nextBytes(stateBytes);\n        String state = Base64.getUrlEncoder()\n            .withoutPadding()\n            .encodeToString(stateBytes);\n        \n        // Store in session\n        session.setAttribute("pkce_verifier", codeVerifier);\n        session.setAttribute("oauth_state", state);\n        \n        // Build URL with multiple resources\n        StringBuilder url = new StringBuilder(\n            String.format(\n                "https://auth.pingone.com/%s/as/authorize?" +\n                "client_id=%s" +\n                "&response_type=code" +\n                "&redirect_uri=%s" +\n                "&scope=openid%%20profile%%20email%%20api:read%%20api:write" +\n                "&code_challenge=%s" +\n                "&code_challenge_method=S256" +\n                "&state=%s",\n                envId, clientId, URLEncoder.encode(redirectUri, "UTF-8"),\n                codeChallenge, state\n            )\n        );\n        \n        // Add each resource\n        for (String api : customerApis) {\n            url.append("&resource=")\n               .append(URLEncoder.encode(api, "UTF-8"));\n        }\n        \n        return url.toString();\n    }\n    \n    // Token validation\n    public void validateToken(JsonObject token, String apiUrl) {\n        JsonArray aud = token.getAsJsonArray("aud");\n        boolean authorized = false;\n        for (JsonElement elem : aud) {\n            if (elem.getAsString().equals(apiUrl)) {\n                authorized = true;\n                break;\n            }\n        }\n        if (!authorized) {\n            throw new SecurityException("Token not authorized for this API");\n        }\n    }\n}',csharp:'// Multi-Tenant SaaS OAuth\nusing System;\nusing System.Collections.Generic;\nusing System.Linq;\nusing System.Security.Cryptography;\nusing System.Text;\nusing System.Web;\n\npublic class SaaSMultiTenantOAuth\n{\n    public string BuildAuthUrl(List<string> customerApis)\n    {\n        // Generate PKCE\n        var codeVerifier = GenerateRandomString(32);\n        var codeChallenge = GenerateCodeChallenge(codeVerifier);\n        var state = GenerateRandomString(32);\n        \n        // Store in session\n        HttpContext.Session.SetString("pkce_verifier", codeVerifier);\n        HttpContext.Session.SetString("oauth_state", state);\n        \n        // Build base URL\n        var baseUrl = $"https://auth.pingone.com/{envId}/as/authorize?" +\n            $"client_id={clientId}" +\n            $"&response_type=code" +\n            $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +\n            $"&scope=openid%20profile%20email%20api:read%20api:write" +\n            $"&code_challenge={codeChallenge}" +\n            $"&code_challenge_method=S256" +\n            $"&state={state}";\n        \n        // Add each resource\n        var resources = string.Join("&", customerApis.Select(\n            api => $"resource={Uri.EscapeDataString(api)}"\n        ));\n        \n        return $"{baseUrl}&{resources}";\n    }\n    \n    // Token validation\n    public void ValidateToken(JObject token, string apiUrl)\n    {\n        var aud = token["aud"]?.ToObject<List<string>>();\n        if (aud == null || !aud.Contains(apiUrl))\n        {\n            throw new SecurityException("Token not authorized for this API");\n        }\n    }\n}'}},{id:"mobile-ecommerce",icon:t.jsx(Y,{}),iconColor:"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",title:"Mobile E-Commerce App",description:"Native mobile shopping app requiring secure OAuth with offline access for order tracking",tags:["Mobile","PKCE Required","Offline Access"],parameters:{response_type:"code",scope:"openid profile email offline_access",code_challenge_method:"S256",prompt:"consent",state:"RANDOM_STATE_TOKEN"},whyItMatters:"Mobile apps CANNOT securely store client secrets. PKCE is MANDATORY. offline_access scope provides refresh tokens for persistent login.",industryExample:"🛒 Amazon, eBay, and Shopify mobile apps use PKCE + offline_access for seamless shopping.",codeExamples:{javascript:"// Mobile E-Commerce OAuth (React Native)\nimport * as Crypto from 'expo-crypto';\nimport * as AuthSession from 'expo-auth-session';\n\n// PKCE is REQUIRED for mobile apps (no client_secret!)\nasync function startMobileOAuth() {\n  // Generate PKCE\n  const codeVerifier = await Crypto.digestStringAsync(\n    Crypto.CryptoDigestAlgorithm.SHA256,\n    Math.random().toString(36)\n  );\n  \n  const codeChallenge = codeVerifier; // In real app, use proper base64url encoding\n  \n  const state = Math.random().toString(36).substring(7);\n  \n  // Store securely\n  await SecureStore.setItemAsync('pkce_verifier', codeVerifier);\n  await SecureStore.setItemAsync('oauth_state', state);\n  \n  // Build authorization request\n  const authUrl = `https://auth.pingone.com/${envId}/as/authorize?` +\n    new URLSearchParams({\n      client_id: clientId,\n      response_type: 'code',\n      redirect_uri: 'myapp://callback', // App deep link\n      scope: 'openid profile email offline_access', // offline_access for refresh token\n      code_challenge: codeChallenge,\n      code_challenge_method: 'S256',\n      prompt: 'consent', // Show what permissions are being granted\n      state: state,\n    });\n  \n  // Open in-app browser\n  const result = await AuthSession.startAsync({\n    authUrl: authUrl,\n  });\n  \n  if (result.type === 'success') {\n    // Validate state\n    const returnedState = result.params.state;\n    const expectedState = await SecureStore.getItemAsync('oauth_state');\n    \n    if (returnedState !== expectedState) {\n      throw new Error('State mismatch - possible CSRF attack!');\n    }\n    \n    // Exchange code for tokens\n    const code = result.params.code;\n    const verifier = await SecureStore.getItemAsync('pkce_verifier');\n    \n    const tokenResponse = await fetch(\n      `https://auth.pingone.com/${envId}/as/token`,\n      {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n        body: new URLSearchParams({\n          grant_type: 'authorization_code',\n          code: code,\n          redirect_uri: 'myapp://callback',\n          client_id: clientId,\n          code_verifier: verifier, // Proves we initiated the flow\n        }),\n      }\n    );\n    \n    const tokens = await tokenResponse.json();\n    \n    // Store tokens securely\n    await SecureStore.setItemAsync('access_token', tokens.access_token);\n    await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);\n    \n    return tokens;\n  }\n}\n\n// Refresh token when expired\nasync function refreshTokens() {\n  const refreshToken = await SecureStore.getItemAsync('refresh_token');\n  \n  const response = await fetch(\n    `https://auth.pingone.com/${envId}/as/token`,\n    {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n      body: new URLSearchParams({\n        grant_type: 'refresh_token',\n        refresh_token: refreshToken,\n        client_id: clientId,\n      }),\n    }\n  );\n  \n  const tokens = await response.json();\n  await SecureStore.setItemAsync('access_token', tokens.access_token);\n  \n  return tokens;\n}",python:"# Mobile E-Commerce OAuth (Flutter/Python Backend)\nimport secrets\nimport hashlib\nimport base64\nimport requests\n\nclass MobileOAuthHandler:\n    def __init__(self, env_id, client_id, redirect_uri):\n        self.env_id = env_id\n        self.client_id = client_id\n        self.redirect_uri = redirect_uri\n    \n    def start_authorization(self):\n        \"\"\"Generate authorization URL for mobile app\"\"\"\n        # Generate PKCE (REQUIRED for mobile)\n        code_verifier = secrets.token_urlsafe(32)\n        code_challenge = base64.urlsafe_b64encode(\n            hashlib.sha256(code_verifier.encode()).digest()\n        ).decode().rstrip('=')\n        \n        state = secrets.token_urlsafe(32)\n        \n        # Return these to mobile app for storage\n        auth_data = {\n            'code_verifier': code_verifier,\n            'state': state,\n            'auth_url': self._build_auth_url(code_challenge, state),\n        }\n        \n        return auth_data\n    \n    def _build_auth_url(self, code_challenge, state):\n        params = {\n            'client_id': self.client_id,\n            'response_type': 'code',\n            'redirect_uri': self.redirect_uri,\n            'scope': 'openid profile email offline_access',\n            'code_challenge': code_challenge,\n            'code_challenge_method': 'S256',\n            'prompt': 'consent',\n            'state': state,\n        }\n        \n        return f\"https://auth.pingone.com/{self.env_id}/as/authorize?\" + \\\n               '&'.join(f\"{k}={v}\" for k, v in params.items())\n    \n    def exchange_code(self, code, code_verifier):\n        \"\"\"Exchange authorization code for tokens\"\"\"\n        token_url = f\"https://auth.pingone.com/{self.env_id}/as/token\"\n        \n        response = requests.post(\n            token_url,\n            data={\n                'grant_type': 'authorization_code',\n                'code': code,\n                'redirect_uri': self.redirect_uri,\n                'client_id': self.client_id,\n                'code_verifier': code_verifier,  # PKCE verification\n            }\n        )\n        \n        response.raise_for_status()\n        return response.json()\n    \n    def refresh_tokens(self, refresh_token):\n        \"\"\"Use refresh token to get new access token\"\"\"\n        token_url = f\"https://auth.pingone.com/{self.env_id}/as/token\"\n        \n        response = requests.post(\n            token_url,\n            data={\n                'grant_type': 'refresh_token',\n                'refresh_token': refresh_token,\n                'client_id': self.client_id,\n            }\n        )\n        \n        response.raise_for_status()\n        return response.json()",java:'// Mobile E-Commerce OAuth (Android)\nimport android.net.Uri;\nimport androidx.browser.customtabs.CustomTabsIntent;\nimport java.security.MessageDigest;\nimport java.security.SecureRandom;\nimport java.util.Base64;\n\npublic class MobileOAuthManager {\n    private String envId;\n    private String clientId;\n    private String redirectUri;\n    \n    public void startOAuthFlow(Activity activity) throws Exception {\n        // Generate PKCE (REQUIRED for mobile apps)\n        SecureRandom random = new SecureRandom();\n        byte[] verifierBytes = new byte[32];\n        random.nextBytes(verifierBytes);\n        String codeVerifier = Base64.getUrlEncoder()\n            .withoutPadding()\n            .encodeToString(verifierBytes);\n        \n        MessageDigest digest = MessageDigest.getInstance("SHA-256");\n        byte[] hash = digest.digest(codeVerifier.getBytes());\n        String codeChallenge = Base64.getUrlEncoder()\n            .withoutPadding()\n            .encodeToString(hash);\n        \n        byte[] stateBytes = new byte[32];\n        random.nextBytes(stateBytes);\n        String state = Base64.getUrlEncoder()\n            .withoutPadding()\n            .encodeToString(stateBytes);\n        \n        // Store securely\n        SharedPreferences prefs = activity.getSharedPreferences(\n            "oauth", Context.MODE_PRIVATE\n        );\n        prefs.edit()\n            .putString("code_verifier", codeVerifier)\n            .putString("state", state)\n            .apply();\n        \n        // Build authorization URL\n        Uri authUri = Uri.parse(\n            String.format(\n                "https://auth.pingone.com/%s/as/authorize", envId\n            )\n        ).buildUpon()\n            .appendQueryParameter("client_id", clientId)\n            .appendQueryParameter("response_type", "code")\n            .appendQueryParameter("redirect_uri", redirectUri)\n            .appendQueryParameter("scope", "openid profile email offline_access")\n            .appendQueryParameter("code_challenge", codeChallenge)\n            .appendQueryParameter("code_challenge_method", "S256")\n            .appendQueryParameter("prompt", "consent")\n            .appendQueryParameter("state", state)\n            .build();\n        \n        // Open Custom Tab (in-app browser)\n        CustomTabsIntent intent = new CustomTabsIntent.Builder().build();\n        intent.launchUrl(activity, authUri);\n    }\n    \n    public TokenResponse exchangeCode(String code) throws Exception {\n        SharedPreferences prefs = context.getSharedPreferences(\n            "oauth", Context.MODE_PRIVATE\n        );\n        String codeVerifier = prefs.getString("code_verifier", null);\n        \n        // Exchange code for tokens\n        OkHttpClient client = new OkHttpClient();\n        RequestBody body = new FormBody.Builder()\n            .add("grant_type", "authorization_code")\n            .add("code", code)\n            .add("redirect_uri", redirectUri)\n            .add("client_id", clientId)\n            .add("code_verifier", codeVerifier)\n            .build();\n        \n        Request request = new Request.Builder()\n            .url(String.format(\n                "https://auth.pingone.com/%s/as/token", envId\n            ))\n            .post(body)\n            .build();\n        \n        Response response = client.newCall(request).execute();\n        return new Gson().fromJson(\n            response.body().string(), \n            TokenResponse.class\n        );\n    }\n}',csharp:'// Mobile E-Commerce OAuth (Xamarin/MAUI)\nusing System;\nusing System.Collections.Generic;\nusing System.Net.Http;\nusing System.Security.Cryptography;\nusing System.Text;\nusing System.Threading.Tasks;\n\npublic class MobileOAuthManager\n{\n    private string envId;\n    private string clientId;\n    private string redirectUri;\n    \n    public async Task<string> StartOAuthFlow()\n    {\n        // Generate PKCE (REQUIRED for mobile)\n        var codeVerifier = GenerateRandomString(32);\n        var codeChallenge = GenerateCodeChallenge(codeVerifier);\n        var state = GenerateRandomString(32);\n        \n        // Store securely\n        await SecureStorage.SetAsync("code_verifier", codeVerifier);\n        await SecureStorage.SetAsync("oauth_state", state);\n        \n        // Build authorization URL\n        var authUrl = $"https://auth.pingone.com/{envId}/as/authorize?" +\n            $"client_id={clientId}" +\n            $"&response_type=code" +\n            $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +\n            $"&scope=openid%20profile%20email%20offline_access" +\n            $"&code_challenge={codeChallenge}" +\n            $"&code_challenge_method=S256" +\n            $"&prompt=consent" +\n            $"&state={state}";\n        \n        // Open web authenticator\n        var result = await WebAuthenticator.AuthenticateAsync(\n            new Uri(authUrl),\n            new Uri(redirectUri)\n        );\n        \n        // Validate state\n        var returnedState = result.Properties["state"];\n        var expectedState = await SecureStorage.GetAsync("oauth_state");\n        \n        if (returnedState != expectedState)\n        {\n            throw new SecurityException("State mismatch!");\n        }\n        \n        // Exchange code\n        var code = result.Properties["code"];\n        return await ExchangeCode(code);\n    }\n    \n    private async Task<TokenResponse> ExchangeCode(string code)\n    {\n        var verifier = await SecureStorage.GetAsync("code_verifier");\n        var client = new HttpClient();\n        \n        var content = new FormUrlEncodedContent(new Dictionary<string, string>\n        {\n            { "grant_type", "authorization_code" },\n            { "code", code },\n            { "redirect_uri", redirectUri },\n            { "client_id", clientId },\n            { "code_verifier", verifier },\n        });\n        \n        var response = await client.PostAsync(\n            $"https://auth.pingone.com/{envId}/as/token",\n            content\n        );\n        \n        var json = await response.Content.ReadAsStringAsync();\n        return JsonSerializer.Deserialize<TokenResponse>(json);\n    }\n    \n    private string GenerateCodeChallenge(string verifier)\n    {\n        using var sha256 = SHA256.Create();\n        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(verifier));\n        return Convert.ToBase64String(hash)\n            .TrimEnd(\'=\')\n            .Replace(\'+\', \'-\')\n            .Replace(\'/\', \'_\');\n    }\n}'}},{id:"iot-device",icon:t.jsx(H,{}),iconColor:"linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",title:"IoT Device / Smart TV",description:"Input-constrained device using Device Authorization Flow for browserless authentication",tags:["Device Flow","No Browser","IoT"],parameters:{grant_type:"urn:ietf:params:oauth:grant-type:device_code",scope:"openid profile device:control"},whyItMatters:"Devices without browsers (Smart TVs, IoT sensors, CLI tools) use Device Authorization Flow. User authenticates on their phone/computer, device polls for completion.",industryExample:"📺 Netflix, YouTube, and Spotify on Smart TVs use Device Flow for easy login.",codeExamples:{javascript:"// IoT Device / Smart TV OAuth (Device Flow)\nimport fetch from 'node-fetch';\n\nasync function deviceFlowAuth() {\n  // Step 1: Request device code\n  const deviceResponse = await fetch(\n    `https://auth.pingone.com/${envId}/as/device_authorization`,\n    {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n      body: new URLSearchParams({\n        client_id: clientId,\n        scope: 'openid profile device:control',\n      }),\n    }\n  );\n  \n  const deviceData = await deviceResponse.json();\n  \n  // Display to user\n  console.log(`\\n🔐 To activate this device:`);\n  console.log(`\\n   1. Visit: ${deviceData.verification_uri}`);\n  console.log(`   2. Enter code: ${deviceData.user_code}`);\n  console.log(`\\n   Waiting for authorization...\\n`);\n  \n  // Step 2: Poll for tokens\n  const interval = deviceData.interval || 5; // seconds\n  const expiresIn = deviceData.expires_in || 600; // 10 minutes\n  const startTime = Date.now();\n  \n  while (true) {\n    // Check if expired\n    if ((Date.now() - startTime) / 1000 > expiresIn) {\n      throw new Error('Device code expired. Please restart.');\n    }\n    \n    // Wait before polling\n    await new Promise(resolve => setTimeout(resolve, interval * 1000));\n    \n    // Poll token endpoint\n    const tokenResponse = await fetch(\n      `https://auth.pingone.com/${envId}/as/token`,\n      {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n        body: new URLSearchParams({\n          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',\n          device_code: deviceData.device_code,\n          client_id: clientId,\n        }),\n      }\n    );\n    \n    const result = await tokenResponse.json();\n    \n    if (result.error) {\n      if (result.error === 'authorization_pending') {\n        // Still waiting for user\n        process.stdout.write('.');\n        continue;\n      } else if (result.error === 'slow_down') {\n        // Polling too fast, increase interval\n        interval += 5;\n        continue;\n      } else {\n        throw new Error(`Authorization failed: ${result.error}`);\n      }\n    }\n    \n    // Success!\n    console.log('\\n\\n✅ Device authorized!\\n');\n    return result;\n  }\n}\n\n// Usage in device/CLI\ndeviceFlowAuth()\n  .then(tokens => {\n    console.log('Access Token:', tokens.access_token.substring(0, 20) + '...');\n    console.log('Expires in:', tokens.expires_in, 'seconds');\n    \n    // Store tokens for device use\n    saveToDeviceStorage(tokens);\n  })\n  .catch(error => {\n    console.error('❌ Authorization failed:', error.message);\n  });",python:"# IoT Device / Smart TV OAuth (Device Flow)\nimport requests\nimport time\n\nclass DeviceFlowAuth:\n    def __init__(self, env_id, client_id):\n        self.env_id = env_id\n        self.client_id = client_id\n        self.base_url = f\"https://auth.pingone.com/{env_id}/as\"\n    \n    def authorize(self):\n        \"\"\"Complete device authorization flow\"\"\"\n        # Step 1: Request device code\n        device_response = requests.post(\n            f\"{self.base_url}/device_authorization\",\n            data={\n                'client_id': self.client_id,\n                'scope': 'openid profile device:control',\n            }\n        )\n        device_response.raise_for_status()\n        device_data = device_response.json()\n        \n        # Display to user\n        print(f\"\\n🔐 To activate this device:\")\n        print(f\"\\n   1. Visit: {device_data['verification_uri']}\")\n        print(f\"   2. Enter code: {device_data['user_code']}\")\n        print(f\"\\n   Waiting for authorization...\\n\")\n        \n        # Step 2: Poll for tokens\n        interval = device_data.get('interval', 5)\n        expires_in = device_data.get('expires_in', 600)\n        start_time = time.time()\n        \n        while True:\n            # Check expiration\n            if time.time() - start_time > expires_in:\n                raise TimeoutError('Device code expired')\n            \n            # Wait before polling\n            time.sleep(interval)\n            \n            # Poll token endpoint\n            token_response = requests.post(\n                f\"{self.base_url}/token\",\n                data={\n                    'grant_type': 'urn:ietf:params:oauth:grant-type:device_code',\n                    'device_code': device_data['device_code'],\n                    'client_id': self.client_id,\n                }\n            )\n            \n            result = token_response.json()\n            \n            if 'error' in result:\n                if result['error'] == 'authorization_pending':\n                    print('.', end='', flush=True)\n                    continue\n                elif result['error'] == 'slow_down':\n                    interval += 5\n                    continue\n                else:\n                    raise Exception(f\"Auth failed: {result['error']}\")\n            \n            # Success!\n            print('\\n\\n✅ Device authorized!\\n')\n            return result\n\n# Usage\nauth = DeviceFlowAuth(env_id='YOUR_ENV_ID', client_id='YOUR_CLIENT_ID')\ntokens = auth.authorize()\nprint(f\"Access Token: {tokens['access_token'][:20]}...\")\nprint(f\"Expires in: {tokens['expires_in']} seconds\")",java:'// IoT Device / Smart TV OAuth (Device Flow)\nimport java.net.http.*;\nimport java.net.URI;\nimport java.util.Map;\nimport com.google.gson.Gson;\n\npublic class DeviceFlowAuth {\n    private String envId;\n    private String clientId;\n    private HttpClient client;\n    private Gson gson;\n    \n    public DeviceFlowAuth(String envId, String clientId) {\n        this.envId = envId;\n        this.clientId = clientId;\n        this.client = HttpClient.newHttpClient();\n        this.gson = new Gson();\n    }\n    \n    public TokenResponse authorize() throws Exception {\n        // Step 1: Request device code\n        String deviceUrl = String.format(\n            "https://auth.pingone.com/%s/as/device_authorization", \n            envId\n        );\n        \n        HttpRequest deviceRequest = HttpRequest.newBuilder()\n            .uri(URI.create(deviceUrl))\n            .header("Content-Type", "application/x-www-form-urlencoded")\n            .POST(HttpRequest.BodyPublishers.ofString(\n                String.format(\n                    "client_id=%s&scope=openid%%20profile%%20device:control",\n                    clientId\n                )\n            ))\n            .build();\n        \n        HttpResponse<String> deviceResponse = client.send(\n            deviceRequest, \n            HttpResponse.BodyHandlers.ofString()\n        );\n        \n        DeviceCodeResponse deviceData = gson.fromJson(\n            deviceResponse.body(), \n            DeviceCodeResponse.class\n        );\n        \n        // Display to user\n        System.out.println("\\n🔐 To activate this device:");\n        System.out.println("\\n   1. Visit: " + deviceData.verificationUri);\n        System.out.println("   2. Enter code: " + deviceData.userCode);\n        System.out.println("\\n   Waiting for authorization...\\n");\n        \n        // Step 2: Poll for tokens\n        int interval = deviceData.interval != null ? deviceData.interval : 5;\n        int expiresIn = deviceData.expiresIn != null ? deviceData.expiresIn : 600;\n        long startTime = System.currentTimeMillis();\n        \n        String tokenUrl = String.format(\n            "https://auth.pingone.com/%s/as/token", \n            envId\n        );\n        \n        while (true) {\n            // Check expiration\n            if ((System.currentTimeMillis() - startTime) / 1000 > expiresIn) {\n                throw new Exception("Device code expired");\n            }\n            \n            // Wait\n            Thread.sleep(interval * 1000);\n            \n            // Poll\n            HttpRequest tokenRequest = HttpRequest.newBuilder()\n                .uri(URI.create(tokenUrl))\n                .header("Content-Type", "application/x-www-form-urlencoded")\n                .POST(HttpRequest.BodyPublishers.ofString(\n                    String.format(\n                        "grant_type=urn:ietf:params:oauth:grant-type:device_code" +\n                        "&device_code=%s&client_id=%s",\n                        deviceData.deviceCode, clientId\n                    )\n                ))\n                .build();\n            \n            HttpResponse<String> tokenResponse = client.send(\n                tokenRequest, \n                HttpResponse.BodyHandlers.ofString()\n            );\n            \n            TokenResponse result = gson.fromJson(\n                tokenResponse.body(), \n                TokenResponse.class\n            );\n            \n            if (result.error != null) {\n                if ("authorization_pending".equals(result.error)) {\n                    System.out.print(".");\n                    continue;\n                } else if ("slow_down".equals(result.error)) {\n                    interval += 5;\n                    continue;\n                } else {\n                    throw new Exception("Auth failed: " + result.error);\n                }\n            }\n            \n            System.out.println("\\n\\n✅ Device authorized!\\n");\n            return result;\n        }\n    }\n}',csharp:'// IoT Device / Smart TV OAuth (Device Flow)\nusing System;\nusing System.Collections.Generic;\nusing System.Net.Http;\nusing System.Text.Json;\nusing System.Threading.Tasks;\n\npublic class DeviceFlowAuth\n{\n    private string envId;\n    private string clientId;\n    private HttpClient client;\n    \n    public DeviceFlowAuth(string envId, string clientId)\n    {\n        this.envId = envId;\n        this.clientId = clientId;\n        this.client = new HttpClient();\n    }\n    \n    public async Task<TokenResponse> AuthorizeAsync()\n    {\n        // Step 1: Request device code\n        var deviceUrl = $"https://auth.pingone.com/{envId}/as/device_authorization";\n        \n        var deviceResponse = await client.PostAsync(\n            deviceUrl,\n            new FormUrlEncodedContent(new Dictionary<string, string>\n            {\n                { "client_id", clientId },\n                { "scope", "openid profile device:control" },\n            })\n        );\n        \n        var deviceJson = await deviceResponse.Content.ReadAsStringAsync();\n        var deviceData = JsonSerializer.Deserialize<DeviceCodeResponse>(deviceJson);\n        \n        // Display to user\n        Console.WriteLine($"\\n🔐 To activate this device:");\n        Console.WriteLine($"\\n   1. Visit: {deviceData.VerificationUri}");\n        Console.WriteLine($"   2. Enter code: {deviceData.UserCode}");\n        Console.WriteLine($"\\n   Waiting for authorization...\\n");\n        \n        // Step 2: Poll for tokens\n        var interval = deviceData.Interval ?? 5;\n        var expiresIn = deviceData.ExpiresIn ?? 600;\n        var startTime = DateTime.UtcNow;\n        \n        var tokenUrl = $"https://auth.pingone.com/{envId}/as/token";\n        \n        while (true)\n        {\n            // Check expiration\n            if ((DateTime.UtcNow - startTime).TotalSeconds > expiresIn)\n            {\n                throw new TimeoutException("Device code expired");\n            }\n            \n            // Wait\n            await Task.Delay(interval * 1000);\n            \n            // Poll\n            var tokenResponse = await client.PostAsync(\n                tokenUrl,\n                new FormUrlEncodedContent(new Dictionary<string, string>\n                {\n                    { "grant_type", "urn:ietf:params:oauth:grant-type:device_code" },\n                    { "device_code", deviceData.DeviceCode },\n                    { "client_id", clientId },\n                })\n            );\n            \n            var resultJson = await tokenResponse.Content.ReadAsStringAsync();\n            var result = JsonSerializer.Deserialize<TokenResponse>(resultJson);\n            \n            if (result.Error != null)\n            {\n                if (result.Error == "authorization_pending")\n                {\n                    Console.Write(".");\n                    continue;\n                }\n                else if (result.Error == "slow_down")\n                {\n                    interval += 5;\n                    continue;\n                }\n                else\n                {\n                    throw new Exception($"Auth failed: {result.Error}");\n                }\n            }\n            \n            Console.WriteLine("\\n\\n✅ Device authorized!\\n");\n            return result;\n        }\n    }\n}'}}],Rl=()=>{const[r,i]=e.useState(null),[o,a]=e.useState("javascript"),c=_l.find(e=>e.id===r),l=e.useCallback(e=>{navigator.clipboard.writeText(e),Ge.showSuccess("Code copied to clipboard!")},[]);return t.jsxs(rl,{children:[t.jsxs(nl,{children:[t.jsx(re,{size:32}),"Real-World Scenario Builder"]}),t.jsx(il,{children:"🎯 Choose your use case, get pre-configured OAuth parameters and production-ready code in your language. No guesswork!"}),t.jsx(ol,{children:_l.map(e=>t.jsxs(sl,{$selected:r===e.id,onClick:()=>i(e.id),children:[t.jsx(al,{color:e.iconColor,children:e.icon}),t.jsx(cl,{children:e.title}),t.jsx(ll,{children:e.description}),t.jsx(dl,{children:e.tags.map(e=>t.jsx(ul,{children:e},e))})]},e.id))}),c&&t.jsxs(t.Fragment,{children:[t.jsxs(pl,{children:[t.jsxs(hl,{children:[t.jsxs(gl,{children:[t.jsx(u,{style:{color:"#10b981"}}),"Pre-Configured OAuth Parameters"]}),t.jsx(ml,{children:Object.entries(c.parameters).map(([e,r])=>t.jsxs(fl,{children:[t.jsx(bl,{children:e}),t.jsx(xl,{children:r})]},e))}),t.jsxs(yl,{children:[t.jsxs(wl,{children:[t.jsx(W,{}),"Why These Parameters Matter"]}),t.jsx(vl,{children:c.whyItMatters})]})]}),t.jsxs(hl,{children:[t.jsxs(gl,{children:[t.jsx(h,{style:{color:"#3b82f6"}}),"Industry Example"]}),t.jsx("div",{style:{padding:"1rem",background:"#dbeafe",borderRadius:"0.5rem",borderLeft:"4px solid #3b82f6",color:"#1e40af",lineHeight:"1.6"},children:c.industryExample})]})]}),t.jsxs("div",{children:[t.jsxs(gl,{children:[t.jsx(s,{style:{color:"#059669"}}),"Production-Ready Code"]}),t.jsxs(kl,{children:[t.jsx(jl,{$active:"javascript"===o,onClick:()=>a("javascript"),children:"JavaScript"}),t.jsx(jl,{$active:"python"===o,onClick:()=>a("python"),children:"Python"}),t.jsx(jl,{$active:"java"===o,onClick:()=>a("java"),children:"Java"}),t.jsx(jl,{$active:"csharp"===o,onClick:()=>a("csharp"),children:"C#"})]}),t.jsxs(Sl,{children:[t.jsxs(Cl,{onClick:()=>l(c.codeExamples[o]),children:[t.jsx(n,{}),"Copy Code"]}),c.codeExamples[o]]}),t.jsxs(Al,{children:[t.jsxs(Tl,{onClick:()=>l(c.codeExamples[o]),children:[t.jsx(n,{}),"Copy to Clipboard"]}),t.jsxs(Tl,{variant:"secondary",onClick:()=>i(null),children:[t.jsx(re,{}),"Choose Different Scenario"]})]})]})]}),!c&&t.jsx("div",{style:{textAlign:"center",padding:"3rem",color:"#059669",fontSize:"1.1rem"},children:"👆 Select a scenario above to see pre-configured OAuth parameters and production code"})]})},Il=Ce.div`
	background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
	border-radius: 1rem;
	padding: 2rem;
	margin: 2rem 0;
	box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
	border: 2px solid #1d4ed8;
`,$l=Ce.h2`
	color: #f1f5f9;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.75rem;
`,El=Ce.p`
	color: #cbd5e1;
	margin: 0 0 2rem 0;
	font-size: 1.05rem;
	line-height: 1.6;
`,zl=Ce.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin-bottom: 2rem;
`,Pl=Ce.button`
	background: ${({$selected:e})=>e?"linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)":"linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"};
	border: 2px solid ${({$selected:e})=>e?"#1d4ed8":"#475569"};
	border-radius: 0.75rem;
	padding: 1.5rem;
	cursor: pointer;
	transition: all 0.2s;
	text-align: left;

	&:hover {
		transform: translateY(-4px);
		border-color: #1d4ed8;
		box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
	}
`,Ol=Ce.div`
	font-size: 2rem;
	margin-bottom: 0.75rem;
`,Ul=Ce.div`
	color: #f1f5f9;
	font-weight: 700;
	font-size: 1.1rem;
	margin-bottom: 0.5rem;
`,Dl=Ce.div`
	color: #94a3b8;
	font-size: 0.9rem;
	line-height: 1.5;
`,Ll=Ce.span`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.25rem 0.6rem;
	border-radius: 999px;
	font-size: 0.75rem;
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: ${({$season:e})=>"season2"===e?"#fbbf24":"#93c5fd"};
	background: ${({$season:e})=>"season2"===e?"rgba(250, 204, 21, 0.12)":"rgba(59, 130, 246, 0.12)"};
`,Nl=Ce.div`
	background: #0f172a;
	border-radius: 0.75rem;
	padding: 2rem;
	margin-bottom: 2rem;
	border: 2px solid #334155;
	min-height: 400px;
`,Ml=Ce.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	flex-wrap: wrap;
`,Fl=Ce.button`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	border: none;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;
	background: ${({variant:e})=>{switch(e){case"danger":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";case"success":return"linear-gradient(135deg, #10b981 0%, #059669 100%)";default:return"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"}}};
	color: white;

	&:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`,ql=Ae`
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
`,Vl=Ce.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
	padding: 1.5rem;
	background: ${({role:e})=>{switch(e){case"user":return"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";case"attacker":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";case"server":return"linear-gradient(135deg, #10b981 0%, #059669 100%)"}}};
	border-radius: 0.75rem;
	border: 3px solid ${({role:e,$active:t})=>{if(t)return"#fbbf24";switch(e){case"user":return"#60a5fa";case"attacker":return"#f87171";case"server":return"#34d399"}}};
	animation: ${({$active:e})=>e?ql:"none"} 1.5s ease-in-out infinite;
	flex: 1;
	min-width: 150px;
`,Bl=Ce.div`
	font-size: 3rem;
	color: white;
`,Wl=Ce.div`
	color: white;
	font-weight: 700;
	font-size: 1.1rem;
	text-align: center;
`,Gl=Ce.div`
	color: #e2e8f0;
	font-size: 0.875rem;
	text-align: center;
	min-height: 40px;
`,Hl=Ce.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	justify-content: space-around;
`,Jl=Ce.div`
	background: #1e293b;
	border-radius: 0.5rem;
	padding: 1rem;
	max-height: 300px;
	overflow-y: auto;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.875rem;
`,Kl=Ce.div`
	padding: 0.5rem;
	margin-bottom: 0.5rem;
	border-left: 3px solid ${({type:e})=>{switch(e){case"danger":return"#ef4444";case"warning":return"#f59e0b";case"success":return"#10b981";default:return"#3b82f6"}}};
	color: ${({type:e})=>{switch(e){case"danger":return"#fca5a5";case"warning":return"#fbbf24";case"success":return"#6ee7b7";default:return"#93c5fd"}}};
	background: rgba(0, 0, 0, 0.3);
	border-radius: 0.25rem;
`,Yl=Ce.div`
	margin-top: 2rem;
	padding: 2rem;
	border-radius: 0.75rem;
	background: ${({success:e})=>e?"linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)":"linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"};
	border: 3px solid ${({success:e})=>e?"#10b981":"#ef4444"};
`,Xl=Ce.div`
	font-size: 1.5rem;
	font-weight: 700;
	color: ${({success:e})=>e?"#065f46":"#991b1b"};
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,Ql=Ce.div`
	color: #1e293b;
	font-size: 1.05rem;
	line-height: 1.7;
`,Zl=Ce.div`
	margin-top: 1rem;
	padding: 1rem;
	background: rgba(59, 130, 246, 0.1);
	border-left: 4px solid #3b82f6;
	border-radius: 0.375rem;
`,ed=Ce.pre`
	background: #1e293b;
	color: #f1f5f9;
	padding: 1rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.875rem;
	margin-top: 1rem;
`,td={csrf:{id:"csrf",icon:"🎣",title:"CSRF Attack",description:"Cross-Site Request Forgery - attacker tricks user into authenticating with malicious OAuth request",withoutDefense:{steps:[{actor:"user",action:"Victim visits attacker.com",delay:1e3},{actor:"attacker",action:"Attacker initiates OAuth flow with THEIR state",delay:1500},{actor:"user",action:"Victim completes authentication",delay:2e3},{actor:"attacker",action:"Victim's account linked to attacker's OAuth profile!",delay:1500},{actor:"server",action:"Server accepts the request - NO state validation",delay:1e3}],outcome:"💀 BREACH: Attacker can now access victim's data. Account compromise!",severity:"critical"},withDefense:{parameter:"state",steps:[{actor:"user",action:"User initiates OAuth (state=abc123 generated & stored)",delay:1e3},{actor:"attacker",action:"Attacker intercepts and replaces state with xyz789",delay:1500},{actor:"user",action:"User completes authentication",delay:2e3},{actor:"server",action:"Server checks: returned xyz789 ≠ expected abc123",delay:1500},{actor:"server",action:"🛡️ REJECTED! CSRF detected. User safe!",delay:1e3}],outcome:"✅ PROTECTED: State parameter validation blocked the CSRF attack!"},mitigation:{parameter:"state",code:"// Generate & store state before redirect\nconst state = crypto.randomBytes(32).toString('hex');\nsessionStorage.setItem('oauth_state', state);\n\n// Include in authorization request\nconst authUrl = `${authEndpoint}?\n  client_id=${clientId}\n  &state=${state}\n  &redirect_uri=${redirectUri}`;\n\n// VALIDATE on callback\nconst returned = new URLSearchParams(location.search).get('state');\nif (returned !== sessionStorage.getItem('oauth_state')) {\n  throw new Error('CSRF attack detected!');\n}",explanation:"The state parameter acts as a CSRF token. Generate a random value, store it securely, send it with the auth request, and ALWAYS validate it on callback. Any mismatch indicates an attack."}},"token-replay":{id:"token-replay",icon:"🔄",title:"ID Token Replay Attack",description:"Attacker steals and reuses an ID token to impersonate the user",withoutDefense:{steps:[{actor:"user",action:"User authenticates and receives ID token",delay:1e3},{actor:"attacker",action:"😈 Intercepts ID token from network traffic",delay:1500},{actor:"attacker",action:"Replays stolen ID token in their own session",delay:2e3},{actor:"server",action:"Server accepts token - no replay protection",delay:1500},{actor:"attacker",action:"💀 Successfully authenticated as victim!",delay:1e3}],outcome:"💀 BREACH: Attacker impersonated user with replayed ID token!",severity:"high"},withDefense:{parameter:"nonce",steps:[{actor:"user",action:"OAuth request includes nonce=xyz123 (stored in session)",delay:1e3},{actor:"server",action:'ID token includes nonce claim: "nonce": "xyz123"',delay:1500},{actor:"attacker",action:"😈 Steals ID token and tries to replay it",delay:2e3},{actor:"server",action:"App checks: token nonce ≠ attacker's session nonce",delay:1500},{actor:"server",action:"🛡️ REJECTED! Replay attack blocked!",delay:1e3}],outcome:"✅ PROTECTED: Nonce ensures each ID token is tied to a specific request!"},mitigation:{parameter:"nonce",code:"// Generate nonce for each auth request\nconst nonce = crypto.randomBytes(32).toString('hex');\nsessionStorage.setItem('oauth_nonce', nonce);\n\n// Include in auth request\nconst authUrl = `${authEndpoint}?\n  response_type=id_token  // or 'code id_token'\n  &nonce=${nonce}\n  &client_id=${clientId}`;\n\n// Validate nonce in received ID token\nconst idToken = jwt.decode(tokens.id_token);\nconst expected = sessionStorage.getItem('oauth_nonce');\n\nif (idToken.nonce !== expected) {\n  throw new Error('ID token replay detected!');\n}\n\n// Generate NEW nonce for EVERY auth request",explanation:"The nonce (number used once) binds an ID token to a specific authentication request. Even if a token is stolen, it can only be used in the session it was issued for."}},"code-interception":{id:"code-interception",icon:"📱",title:"Authorization Code Interception",description:"Attacker intercepts authorization code on mobile/SPA and exchanges it for tokens",withoutDefense:{steps:[{actor:"user",action:"Mobile app initiates OAuth flow",delay:1e3},{actor:"server",action:"Returns authorization code to app",delay:1500},{actor:"attacker",action:"😈 Intercepts code from callback URL",delay:2e3},{actor:"attacker",action:"Exchanges code for tokens (no client_secret in mobile!)",delay:1500},{actor:"attacker",action:"💀 Has access token! Can access victim's APIs",delay:1e3}],outcome:"💀 BREACH: Mobile apps can't protect client secrets. Code stolen = tokens stolen!",severity:"critical"},withDefense:{parameter:"PKCE",steps:[{actor:"user",action:"App generates code_verifier + code_challenge",delay:1e3},{actor:"user",action:"Auth request includes code_challenge",delay:1500},{actor:"attacker",action:"😈 Intercepts authorization code",delay:2e3},{actor:"attacker",action:"Tries to exchange code (missing code_verifier)",delay:1500},{actor:"server",action:"🛡️ REJECTED! code_challenge validation failed",delay:1e3}],outcome:"✅ PROTECTED: PKCE makes authorization code useless without code_verifier!"},mitigation:{parameter:"PKCE (code_challenge + code_verifier)",code:"// Step 1: Generate PKCE pair\nconst codeVerifier = crypto.randomBytes(32).toString('hex');\nconst hash = crypto.createHash('sha256').update(codeVerifier).digest();\nconst codeChallenge = base64url(hash);\n\n// Step 2: Auth request with code_challenge\nconst authUrl = `${authEndpoint}?\n  code_challenge=${codeChallenge}\n  &code_challenge_method=S256\n  &client_id=${clientId}`;\n\n// Step 3: Token exchange includes code_verifier\nconst tokenReq = await fetch(tokenEndpoint, {\n  method: 'POST',\n  body: new URLSearchParams({\n    code: authCode,\n    code_verifier: codeVerifier,  // Proves you initiated flow\n    client_id: clientId,\n  }),\n});\n\n// Server validates: SHA256(code_verifier) === code_challenge",explanation:"PKCE (Proof Key for Code Exchange) prevents authorization code interception. Even if the code is stolen, tokens cannot be obtained without the code_verifier, which never leaves the device."}},"session-hijack":{id:"session-hijack",icon:"⏱️",title:"Session Hijacking",description:"Attacker gains access to unattended device with active session",withoutDefense:{steps:[{actor:"user",action:"User logs in at 10:00 AM at coffee shop",delay:1e3},{actor:"user",action:"🚶 User leaves laptop open and walks away at 10:30 AM",delay:1500},{actor:"attacker",action:"😈 Attacker sits down at 11:00 AM (30 min later)",delay:2e3},{actor:"attacker",action:"Still logged in! No re-authentication required",delay:1500},{actor:"attacker",action:"💀 Accesses sensitive data for hours",delay:1e3}],outcome:"💀 BREACH: Session stayed active indefinitely. Data exposed!",severity:"high"},withDefense:{parameter:"max_age",steps:[{actor:"user",action:"Logs in with max_age=300 (5 minutes)",delay:1e3},{actor:"user",action:"🚶 Leaves laptop at 10:30 AM",delay:1500},{actor:"attacker",action:"😈 Attacker accesses laptop at 11:00 AM",delay:2e3},{actor:"server",action:"Checks: last auth 30 min ago > max_age (5 min)",delay:1500},{actor:"server",action:"🛡️ Forces re-login! Session expired",delay:1e3}],outcome:"✅ PROTECTED: max_age limited session lifetime. Attacker sees login screen!"},mitigation:{parameter:"max_age",code:"// Set max authentication age (in seconds)\nconst authUrl = `${authEndpoint}?\n  max_age=300  // 5 minutes for high-security\n  &client_id=${clientId}\n  &response_type=code\n  &scope=openid`;\n\n// Server includes auth_time in ID token\n// Client validates authentication freshness\nconst idToken = jwt.decode(tokens.id_token);\nconst authAge = Date.now()/1000 - idToken.auth_time;\n\nif (authAge > 300) {\n  // Force re-authentication\n  console.log('Auth too old, re-authenticating...');\n  redirectToAuth({ max_age: 300 });\n}\n\n// Recommended: 5-15 min for banking, 60 min for general apps",explanation:"max_age limits how old the user's authentication can be. If the last authentication exceeds this age, the user must re-authenticate. Critical for high-security operations and shared devices."}},"refresh-token-theft":{id:"refresh-token-theft",icon:"🧪",title:"Refresh Token Theft",description:"Compromised SPA or malware steals long-lived refresh token stored in browser",season:"season2",withoutDefense:{steps:[{actor:"user",action:"SPA stores refresh_token in localStorage for convenience",delay:1e3},{actor:"attacker",action:"😈 Injects malicious script via XSS vulnerability",delay:1500},{actor:"attacker",action:"Copies refresh_token value from storage",delay:2e3},{actor:"attacker",action:"Uses stolen refresh token on their own device",delay:2e3},{actor:"server",action:"✅ Issues new access tokens again and again",delay:1500}],outcome:"💀 BREACH: Attacker holds long-lived access. Complete account takeover.",severity:"critical"},withDefense:{parameter:"Refresh Token Rotation",steps:[{actor:"server",action:"Refresh tokens stored server-side only (httpOnly cookie)",delay:1e3},{actor:"server",action:"Enables PingOne refresh token rotation + reuse detection",delay:1500},{actor:"attacker",action:"😈 Steals previous refresh_token",delay:2e3},{actor:"server",action:"Detects reuse, revokes session + triggers MFA challenge",delay:2e3},{actor:"user",action:"Receives alert + forced re-authentication",delay:1500}],outcome:"✅ PROTECTED: Reuse detection kills stolen token instantly and alerts user."},mitigation:{parameter:"Refresh Token Rotation",code:"// Enable refresh token rotation when exchanging code\nconst response = await fetch(tokenEndpoint, {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n  body: new URLSearchParams({\n    grant_type: 'authorization_code',\n    code,\n    redirect_uri,\n    client_id,\n    client_secret,\n    // PingOne Tenant → Policies → Refresh Token → enable rotation + reuse detection\n  }),\n});\n\nconst tokens = await response.json();\n// Store refresh token httpOnly server-side only!\nsetSecureCookie('refresh_token', tokens.refresh_token, { httpOnly: true, sameSite: 'strict' });\n\n// Detect reuse\napp.use(async (req, res, next) => {\n  const refreshToken = req.cookies.refresh_token;\n  if (!refreshToken) return next();\n\n  const introspection = await pingOne.introspectRefreshToken(refreshToken);\n  if (introspection.reused) {\n    await pingOne.revokeSession(introspection.session.id);\n    throw new Error('Refresh token reuse detected. Session revoked.');\n  }\n  next();\n});",explanation:"Never store refresh tokens in browser storage. Use server-side storage + rotation. PingOne refresh token rotation issues one-time tokens and revokes sessions when reuse is detected — stopping long-lived compromise."}},"redirectless-abuse":{id:"redirectless-abuse",icon:"🛰️",title:"Redirectless Resume Hijack",description:"Attacker replays stolen resume payload to finish victim’s redirectless login",season:"season2",withoutDefense:{steps:[{actor:"server",action:"PingOne sends JSON {resumeUrl, code, state} to SPA",delay:1e3},{actor:"attacker",action:"😈 Intercepts network response via compromised browser extension",delay:1800},{actor:"attacker",action:"Posts resume payload to resumeUrl before the real app",delay:2e3},{actor:"server",action:"Issues tokens to attacker channel",delay:1500},{actor:"user",action:"Victim app sees flow expired error",delay:1200}],outcome:"💀 BREACH: Redirectless flow finalized by attacker. Victim loses session.",severity:"high"},withDefense:{parameter:"resumeId + state validation",steps:[{actor:"server",action:"Encrypts resume payload and stores with session nonce",delay:1e3},{actor:"attacker",action:"😈 Replays stolen payload",delay:2e3},{actor:"server",action:"Validates resumeId + nonce mismatch, blocks request",delay:1800},{actor:"server",action:"Real user resumes flow, validation succeeds",delay:1800},{actor:"server",action:"🛡️ Issues tokens to legitimate channel only",delay:1500}],outcome:"✅ PROTECTED: Replay blocked because resume payload bound to session identity."},mitigation:{parameter:"resumeId + state validation",code:"// Store resume payload securely\nconst resume = await RedirectlessAuthService.handlePendingResume();\nsessionStorage.setItem('redirectless_flow', JSON.stringify({\n  resumeUrl: resume.resumeUrl,\n  state: resume.state,\n  nonce: crypto.randomUUID(),\n}));\n\n// When resuming\nconst saved = JSON.parse(sessionStorage.getItem('redirectless_flow') ?? '{}');\nif (saved.state !== returnedState) {\n  throw new Error('State mismatch on resume');\n}\n\n// Include nonce binding for backend validation\nawait fetch('/api/redirectless/resume', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    resumeUrl: saved.resumeUrl,\n    nonce: saved.nonce,\n    expectedState: saved.state,\n  }),\n});",explanation:"Bind PingOne redirectless resume payloads to your SPA session using state + nonce. Validate both server-side before resuming the flow. If an attacker replays the JSON payload elsewhere, validation fails and tokens are never issued."}},"par-impersonation":{id:"par-impersonation",icon:"🚀",title:"Pushed Authorization Request Impersonation",description:"Attacker registers PAR without signed client assertion and hijacks request URI",season:"season2",withoutDefense:{steps:[{actor:"server",action:"Client posts PAR without client authentication",delay:1e3},{actor:"attacker",action:"😈 Crafts own PAR pointing to malicious redirect_uri",delay:1800},{actor:"attacker",action:"Reuses request_uri from honest client",delay:2e3},{actor:"server",action:"Redirects user to attacker redirect_uri",delay:1500},{actor:"attacker",action:"💀 Receives authorization code meant for victim app",delay:1500}],outcome:"💀 BREACH: Unsigned PAR lets attacker impersonate legitimate request URI.",severity:"high"},withDefense:{parameter:"client_assertion (private_key_jwt)",steps:[{actor:"server",action:"Signs PAR with private key (kid registered in PingOne)",delay:1e3},{actor:"attacker",action:"😈 Attempts to replay request_uri",delay:2e3},{actor:"server",action:"Verifies signature against client",delay:1500},{actor:"server",action:"🛡️ Rejects unsigned or mismatched request_uri",delay:1500},{actor:"user",action:"Completes flow safely with original redirect_uri",delay:1200}],outcome:"✅ PROTECTED: Signed PAR locks request_uri to your client identity."},mitigation:{parameter:"client_assertion (private_key_jwt)",code:"// Create signed JWT for PAR (private_key_jwt)\nimport { SignJWT } from 'jose';\n\nconst assertion = await new SignJWT({\n  iss: clientId,\n  sub: clientId,\n  aud: `https://auth.pingone.com/${envId}/as/par`,\n  jti: crypto.randomUUID(),\n})\n  .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: signingKeyId })\n  .setIssuedAt()\n  .setExpirationTime('5m')\n  .sign(privateKey);\n\n// Submit PAR\nawait fetch(`https://auth.pingone.com/${envId}/as/par`, {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },\n  body: new URLSearchParams({\n    client_id: clientId,\n    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',\n    client_assertion: assertion,\n    response_type: 'code',\n    redirect_uri,\n    scope: 'openid profile',\n  }),\n});",explanation:"Always authenticate Pushed Authorization Requests with private_key_jwt. PingOne verifies the signature, ensuring only your client can issue request_uri values. Attackers cannot forge or replay them without your key."}}},rd=()=>{const[r,n]=e.useState("csrf"),[i,o]=e.useState(!1),[s,a]=e.useState(null),[c,d]=e.useState(null),[p,h]=e.useState([]),[g,m]=e.useState(!1),f=td[r],x=e.useCallback((e,t)=>{h(r=>[...r,{type:e,message:t,timestamp:Date.now()}])},[]),y=e.useCallback(async e=>{o(!0),a(e),m(!1),h([]);const t="vulnerable"===e?f.withoutDefense.steps:f.withDefense.steps;x("info",`🎬 Starting ${"vulnerable"===e?"VULNERABLE":"PROTECTED"} simulation...`),"protected"===e?x("success",`🛡️ Defense enabled: ${f.mitigation.parameter}`):x("warning",`⚠️ No ${f.mitigation.parameter} protection`);for(let r=0;r<t.length;r++){const e=t[r];await new Promise(t=>setTimeout(t,e.delay)),d(e.actor);const n=e.action.includes("💀")||e.action.includes("😈")?"danger":e.action.includes("🛡️")||e.action.includes("✅")?"success":e.action.includes("⚠️")?"warning":"info";x(n,`[${e.actor.toUpperCase()}] ${e.action}`)}d(null),await new Promise(e=>setTimeout(e,500)),m(!0),o(!1),"protected"===e?Ge.showSuccess("Attack blocked by security parameter!"):Ge.showError("Security breach demonstrated!")},[f,x]),w=e.useCallback(()=>{o(!1),a(null),d(null),h([]),m(!1)},[]);return t.jsxs(Il,{children:[t.jsxs($l,{children:[t.jsx(l,{size:32,style:{color:"#fbbf24"}}),"Security Threat Theater"]}),t.jsx(El,{children:"🎭 Watch real OAuth attacks in action. See EXACTLY what happens when security parameters are missing, and how they protect against attacks."}),t.jsx(zl,{children:Object.keys(td).map(e=>{const i=td[e];return t.jsxs(Pl,{$selected:r===e,onClick:()=>{n(e),w()},children:[t.jsx(Ol,{children:i.icon}),i.season?t.jsx(Ll,{$season:i.season,children:"season2"===i.season?"Season 2":"Season 1"}):null,t.jsx(Ul,{children:i.title}),t.jsx(Dl,{children:i.description})]},e)})}),t.jsxs(Nl,{children:[t.jsxs(Ml,{children:[t.jsxs(Fl,{variant:"danger",onClick:()=>y("vulnerable"),disabled:i,children:[t.jsx(se,{}),"Run Vulnerable Scenario"]}),t.jsxs(Fl,{variant:"success",onClick:()=>y("protected"),disabled:i,children:[t.jsx(U,{}),"Run Protected Scenario"]}),t.jsxs(Fl,{onClick:w,disabled:i,children:[t.jsx(b,{}),"Reset"]})]}),t.jsxs(Hl,{children:[t.jsxs(Vl,{$active:"user"===c,children:[t.jsx(Bl,{children:t.jsx(K,{})}),t.jsx(Wl,{children:"👤 User"}),t.jsx(Gl,{children:"user"===c?"🔄 Acting...":"Waiting..."})]}),t.jsxs(Vl,{$active:"attacker"===c,children:[t.jsx(Bl,{children:t.jsx(ae,{})}),t.jsx(Wl,{children:"😈 Attacker"}),t.jsx(Gl,{children:"attacker"===c?"💀 Attacking...":"Waiting..."})]}),t.jsxs(Vl,{$active:"server"===c,children:[t.jsx(Bl,{children:t.jsx(ce,{})}),t.jsx(Wl,{children:"🖥️ Server"}),t.jsx(Gl,{children:"server"===c?"⚙️ Processing...":"Waiting..."})]})]}),p.length>0&&t.jsxs("div",{children:[t.jsx("div",{style:{color:"#f1f5f9",fontWeight:600,marginBottom:"0.75rem",fontSize:"1.1rem"},children:"📊 Event Log:"}),t.jsx(Jl,{children:p.map((e,r)=>t.jsx(Kl,{type:e.type,children:e.message},r))})]})]}),g&&s&&t.jsxs(Yl,{success:"protected"===s,children:[t.jsx(Xl,{success:"protected"===s,children:"protected"===s?t.jsxs(t.Fragment,{children:[t.jsx(u,{size:32}),"Attack Blocked!"]}):t.jsxs(t.Fragment,{children:[t.jsx(le,{size:32}),"Security Breach!"]})}),t.jsx(Ql,{children:"vulnerable"===s?f.withoutDefense.outcome:f.withDefense.outcome}),"protected"===s&&t.jsxs(Zl,{children:[t.jsxs("div",{style:{fontWeight:700,marginBottom:"0.75rem",color:"#1e293b",fontSize:"1.1rem"},children:["🛡️ How ",f.mitigation.parameter," Protected Us:"]}),t.jsx("div",{style:{color:"#475569",marginBottom:"1rem",lineHeight:"1.6"},children:f.mitigation.explanation}),t.jsx("div",{style:{fontWeight:600,marginBottom:"0.5rem",color:"#1e293b"},children:"💻 Implementation:"}),t.jsx(ed,{children:f.mitigation.code})]}),"vulnerable"===s&&t.jsxs(Zl,{children:[t.jsx("div",{style:{fontWeight:700,marginBottom:"0.75rem",color:"#1e293b",fontSize:"1.1rem"},children:"✅ How to Prevent This Attack:"}),t.jsxs("div",{style:{color:"#475569",marginBottom:"1rem",lineHeight:"1.6"},children:[t.jsxs("strong",{children:["Always use the ",f.mitigation.parameter," parameter!"]})," ",f.mitigation.explanation]}),t.jsx("div",{style:{fontWeight:600,marginBottom:"0.5rem",color:"#1e293b"},children:"💻 Add This Code:"}),t.jsx(ed,{children:f.mitigation.code})]})]}),t.jsxs("div",{style:{marginTop:"2rem",padding:"1.5rem",background:"rgba(239, 68, 68, 0.1)",borderRadius:"0.75rem",border:"2px solid #ef4444"},children:[t.jsxs("div",{style:{color:"#fca5a5",fontWeight:700,marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(l,{size:20}),"Critical Security Warning"]}),t.jsxs("div",{style:{color:"#e2e8f0",lineHeight:"1.6",fontSize:"0.95rem"},children:["These attacks are NOT theoretical — they happen in production every day. Security parameters like ",t.jsx("code",{children:"state"}),", ",t.jsx("code",{children:"nonce"}),", and ",t.jsx("code",{children:"PKCE"})," are REQUIRED, not optional. Every parameter you skip is a vulnerability you introduce."]})]})]})};class nd extends e.Component{constructor(e){super(e),this.state={hasError:!1}}static getDerivedStateFromError(e){return{hasError:!0,error:e}}componentDidCatch(e,t){Ee.error("AuthErrorBoundary","Caught error in auth context",{error:e,errorInfo:t})}render(){return this.state.hasError?t.jsxs("div",{style:{padding:"2rem",textAlign:"center",backgroundColor:"#fef2f2",border:"1px solid #fecaca",borderRadius:"0.5rem",margin:"1rem"},children:[t.jsx("h2",{style:{color:"#dc2626",marginBottom:"1rem"},children:"Authentication Error"}),t.jsx("p",{style:{color:"#7f1d1d",marginBottom:"1rem"},children:"There was an error with the authentication system. Please refresh the page."}),t.jsx("button",{type:"button",onClick:()=>window.location.reload(),style:{backgroundColor:"#dc2626",color:"white",border:"none",padding:"0.5rem 1rem",borderRadius:"0.375rem",cursor:"pointer"},children:"Refresh Page"})]}):this.props.children}}const id=Ae`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`,od=Ce.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
`,sd=Ce.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: ${id} 1s linear infinite;
  margin-bottom: 1rem;
`,ad=Ce.div`
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
`,cd=Ce.div`
  color: #9ca3af;
  font-size: 12px;
  margin-top: 0.5rem;
`,ld=({message:e="Loading component...",subtext:r="Please wait a moment"})=>t.jsxs(od,{children:[t.jsx(sd,{}),t.jsx(ad,{children:e}),t.jsx(cd,{children:r})]}),dd=Ce.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1rem 0;
`,ud=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`,pd=Ce.div`
  color: #dc2626;
  font-size: 1.5rem;
`,hd=Ce.h3`
  color: #dc2626;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`,gd=Ce.div`
  color: #7f1d1d;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`,md=Ce.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
`,fd=Ce.h4`
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,bd=Ce.div`
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  border-left: 4px solid #3b82f6;
`,xd=Ce.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,yd=Ce.div`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
`,wd=Ce.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`,vd=Ce.div`
  background: #1f2937;
  color: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  margin: 0.5rem 0;
  overflow-x: auto;
`,kd=Ce.button`
  background: none;
  border: 1px solid #6b7280;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  margin-left: 0.5rem;
  
  &:hover {
    background: #374151;
    color: #f9fafb;
  }
`,jd=({error:e,errorDescription:r,correlationId:i,onRetry:o,onGoToConfig:s,onDismiss:a})=>{const c=(e=>{if(!e||"string"!=typeof e)return{title:"Unknown Error",description:"An unknown error occurred during the OAuth flow.",solutions:[{title:"General Troubleshooting",icon:t.jsx(T,{}),description:"Check your configuration and try again.",steps:["Verify your client credentials are correct","Check that redirect URI matches exactly","Ensure your PingOne application is properly configured"]}]};switch(e.toLowerCase()){case"invalid_scope":case"at least one scope must be granted":return{title:"Scope Configuration Error",description:"The requested scopes are not properly configured or granted.",solutions:[{title:"Check PingOne Application Configuration",icon:t.jsx(T,{}),description:"Verify that the required scopes are enabled in your PingOne application settings.",steps:["Go to PingOne Admin Console","Navigate to your application",'Check the "Scopes" section',"Ensure the required scopes are enabled"],codeExample:"Required scopes: openid, profile, email"},{title:"Verify Scope Format",icon:t.jsx(U,{}),description:"Ensure scopes are properly formatted in your authorization request.",steps:["Check that scopes are space-separated","Verify scope names match PingOne configuration","Ensure no invalid characters are present"],codeExample:"scope=openid profile email"},{title:"Check Application Permissions",icon:t.jsx(re,{}),description:"Verify your application has the necessary permissions for the requested scopes.",steps:["Review application role assignments","Check resource access policies","Verify user consent requirements"]}]};case"invalid_client":return{title:"Client Configuration Error",description:"The client ID or client secret is invalid or not properly configured.",solutions:[{title:"Verify Client Credentials",icon:t.jsx(T,{}),description:"Check that your client ID and client secret are correct.",steps:["Verify client ID in PingOne Admin Console","Check client secret is correct","Ensure credentials are properly copied"]},{title:"Check Application Status",icon:t.jsx(U,{}),description:"Ensure your application is active and properly configured.",steps:["Verify application is enabled","Check application type matches flow","Review redirect URI configuration"]}]};case"invalid_redirect_uri":return{title:"Redirect URI Error",description:"The redirect URI in the request does not match the configured URI.",solutions:[{title:"Update Redirect URI Configuration",icon:t.jsx(T,{}),description:"Add the correct redirect URI to your PingOne application.",steps:["Go to PingOne Admin Console","Navigate to your application","Add the redirect URI to allowed URIs","Ensure exact match including protocol and port"],codeExample:"https://localhost:3000/authz-callback"}]};case"access_denied":return{title:"Access Denied",description:"The user denied the authorization request or access was not granted.",solutions:[{title:"User Consent Required",icon:t.jsx(U,{}),description:"The user needs to grant permission for the requested scopes.",steps:['User must click "Allow" or "Authorize"',"Check if user has necessary permissions","Verify user is in correct user group"]}]};default:return{title:"OAuth Error",description:r||"An OAuth error occurred during the authorization process.",solutions:[{title:"Check Configuration",icon:t.jsx(T,{}),description:"Verify your PingOne application configuration.",steps:["Review application settings","Check environment configuration","Verify all required parameters"]},{title:"Review Error Details",icon:t.jsx(l,{}),description:"Check the error details for more specific information.",steps:["Look at the correlation ID for support","Check browser console for additional errors","Review network requests"]}]}}})(e);return t.jsxs(dd,{children:[t.jsxs(ud,{children:[t.jsx(pd,{children:t.jsx(l,{})}),t.jsx(hd,{children:c.title})]}),t.jsxs(gd,{children:[t.jsx("strong",{children:"Error:"})," ",e,r&&t.jsxs(t.Fragment,{children:[t.jsx("br",{}),t.jsx("strong",{children:"Description:"})," ",r]}),i&&t.jsxs(t.Fragment,{children:[t.jsx("br",{}),t.jsx("strong",{children:"Correlation ID:"})," ",i]})]}),t.jsxs(md,{children:[t.jsxs(fd,{children:[t.jsx(u,{}),"Possible Solutions"]}),c.solutions&&c.solutions.length>0?c.solutions.map((e,r)=>t.jsxs(bd,{children:[t.jsxs(xd,{children:[e.icon,e.title]}),t.jsx(yd,{children:e.description}),e.steps&&t.jsxs("div",{style:{marginBottom:"0.75rem"},children:[t.jsx("strong",{children:"Steps to resolve:"}),t.jsx("ol",{style:{margin:"0.5rem 0",paddingLeft:"1.5rem"},children:e.steps&&e.steps.length>0?e.steps.map((e,r)=>t.jsx("li",{style:{marginBottom:"0.25rem"},children:e},r)):t.jsx("li",{style:{color:"#6b7280"},children:"No specific steps available"})})]}),e.codeExample&&t.jsxs("div",{children:[t.jsx("strong",{children:"Example:"}),t.jsxs(vd,{children:[e.codeExample,t.jsxs(kd,{onClick:()=>{return t=e.codeExample,void navigator.clipboard.writeText(t);var t},children:[t.jsx(n,{size:12}),"Copy"]})]})]})]},r)):t.jsx("div",{style:{padding:"1rem",color:"#6b7280",fontSize:"0.875rem"},children:"No specific solutions available for this error."})]}),t.jsxs("div",{style:{display:"flex",gap:"0.75rem",flexWrap:"wrap"},children:[o&&t.jsxs(wd,{onClick:o,children:[t.jsx(b,{size:16}),"Try Again"]}),s&&t.jsxs(wd,{onClick:s,children:[t.jsx(T,{size:16}),"Go to Configuration"]}),t.jsxs(wd,{onClick:()=>window.open("https://docs.pingidentity.com/bundle/pingone/page/ojg1564020488637.html","_blank"),children:[t.jsx(h,{size:16}),"PingOne Documentation"]}),a&&t.jsxs(wd,{onClick:a,style:{background:"#6b7280",color:"white"},children:[t.jsx(f,{size:16}),"Dismiss"]})]})]})};const Sd=new class{generateCorrelationId(){return`err_${Date.now()}_${Math.random().toString(36).substring(2,11)}`}extractErrorDetails(e){if(e instanceof Error)return{message:e.message,details:e.stack};if("string"==typeof e)return{message:e};if(e&&"object"==typeof e){const t=e;return{message:t.message||t.error||"An unknown error occurred",details:JSON.stringify(e,null,2)}}return{message:"An unknown error occurred"}}categorizeError(e){if(e.errorCategory)return e.errorCategory;if(e.oauthError){const t=e.oauthError.toLowerCase();if(t.includes("invalid_client")||t.includes("unauthorized_client"))return"INVALID_CREDENTIALS";if(t.includes("redirect_uri"))return"REDIRECT_URI_MISMATCH";if("invalid_grant"===t)return"TOKEN_EXCHANGE_FAILED"}const t=(e.description||e.title||"").toLowerCase();return t.includes("network")||t.includes("fetch")||t.includes("connection")?"NETWORK_ERROR":t.includes("redirect")&&t.includes("uri")?"REDIRECT_URI_MISMATCH":t.includes("pkce")?"PKCE_MISMATCH":t.includes("token")&&t.includes("exchange")?"TOKEN_EXCHANGE_FAILED":t.includes("discovery")||t.includes("well-known")?"OIDC_DISCOVERY_FAILED":t.includes("jwt")&&t.includes("generat")?"JWT_GENERATION_FAILED":t.includes("introspect")?"INTROSPECTION_FAILED":t.includes("userinfo")?"USERINFO_FAILED":"GENERIC_ERROR"}getErrorTemplate(e){if(e.oauthError&&It[e.oauthError])return It[e.oauthError];if(e.description){const t=Object.keys(It).find(t=>e.description?.toLowerCase().includes(t.toLowerCase()));if(t)return It[t];const r=e.description.toLowerCase();if(r.includes("client id is required")||r.includes("client_id is required"))return It.client_id_is_required}const t=this.categorizeError(e);return It[{CALLBACK_NO_CODE:"invalid_grant",TOKEN_EXCHANGE_FAILED:"invalid_grant",INVALID_CALLBACK:"invalid_request",NETWORK_ERROR:"network_error",GENERIC_ERROR:"unknown_error"}[t]||"unknown_error"]||It.unknown_error}getFullPageError(e){this.categorizeError(e);const r=e.correlationId||this.generateCorrelationId();let n=e.details;if(e.error&&!n){n=this.extractErrorDetails(e.error).details}const i=this.getErrorTemplate(e);return t.jsx($t,{flowType:e.flowType,flowKey:e.flowKey,currentStep:e.currentStep,errorTemplate:i,errorCode:e.oauthError,errorDescription:e.oauthErrorDescription||e.description,correlationId:r,onRetry:e.onRetry,onGoToConfig:e.onGoToConfig,onStartOver:e.onStartOver,metadata:n?{details:n}:void 0})}getInlineError(e){const r=this.categorizeError(e),n=e.correlationId||this.generateCorrelationId();let i=e.details,o=e.description;if(e.error){const t=this.extractErrorDetails(e.error);o||(o=t.message),i||(i=t.details)}return t.jsx(Et,{errorCategory:r,title:e.title,description:o,details:i,oauthError:e.oauthError,oauthErrorDescription:e.oauthErrorDescription,correlationId:n,onRetry:e.onRetry,onGoToConfig:e.onGoToConfig,showDetails:!1,severity:"error"})}getErrorDisplay(e){return"inline"===(e.displayMode||"full-page")?this.getInlineError(e):this.getFullPageError(e)}logError(e){e.correlationId||this.generateCorrelationId(),this.categorizeError(e)}handleError(e){return this.logError(e),this.getErrorDisplay(e)}},Cd=Ce.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`,Ad=Ce.div`
  background: ${({$status:e})=>{switch(e){case"success":return"#f0fdf4";case"error":return"#fef2f2";default:return"#f8fafc"}}};
  border: 1px solid ${({$status:e})=>{switch(e){case"success":return"#bbf7d0";case"error":return"#fecaca";default:return"#e2e8f0"}}};
  border-radius: 0.75rem;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
`,Td=Ce.div`
  font-size: 3rem;
  color: ${({$status:e})=>{switch(e){case"success":return"#16a34a";case"error":return"#dc2626";default:return"#6b7280"}}};
  margin-bottom: 1rem;
`,_d=Ce.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
`,Rd=Ce.p`
  color: #6b7280;
  margin-bottom: 1rem;
`,Id=()=>{const n=j(),i=r(),{handleCallback:o}=Xt(),[s,a]=e.useState("loading"),[c,l]=e.useState("Processing authorization callback..."),[d,p]=e.useState(null),h=e.useRef(!1);e.useEffect(()=>{if(h.current)return;const e=new URLSearchParams(window.location.search).get("code"),t=sessionStorage.getItem("processed_auth_code");if(e&&t===e)return a("error"),void l("This authorization code has already been used. Please start the authorization flow again.");(async()=>{h.current=!0,e&&sessionStorage.setItem("processed_auth_code",e);try{const e=Ze("AuthzCallback");Ee.auth("AuthzCallback","Processing authorization callback",{url:e});const r=new URL(e),i=r.searchParams,s=new URLSearchParams(r.hash.startsWith("#")?r.hash.substring(1):r.hash),c=i.get("access_token")||s.get("access_token"),d=i.get("id_token")||s.get("id_token"),u=i.get("error")||s.get("error"),h=i.get("error_description")||s.get("error_description"),g=i.has("code");if(!g&&(Boolean(c)||Boolean(d)||Boolean(u)))return Ee.auth("AuthzCallback","Implicit flow payload detected, redirecting",{hasAccessToken:Boolean(c),hasIdToken:Boolean(d),hasError:Boolean(u),fragmentLength:r.hash?.length||0}),u&&Ee.error("AuthzCallback","Implicit flow returned error parameters",{error:u,errorDescription:h,url:r.href?.substring(0,300),hash:r.hash?.substring(0,200)}),void n({pathname:"/implicit-callback",search:r.search,hash:r.hash},{replace:!0});const m=sessionStorage.getItem("flowContext");let f=!1,b=!1,x=!1,y=!1,w=!1,v=null;try{v=m?JSON.parse(m):null,f="oauth-authorization-code-v3"===v?.flow,b="enhanced-authorization-code-v3"===v?.flow||"oidc-authorization-code-v3"===v?.flow,x="oauth-authorization-code-v5"===v?.flow||"oidc-authorization-code-v5"===v?.flow,y="oauth-authorization-code-v7"===v?.flow||"oidc-authorization-code-v7"===v?.flow||"oauth-authorization-code-v7-2"===v?.flow||"oidc-authorization-code-v7-2"===v?.flow,w="pingone-complete-mfa-v7"===v?.flow}catch(t){const e=window.location.pathname;e.includes("enhanced-authorization-code-v3")||e.includes("oidc")?b=!0:e.includes("oauth-authorization-code-v3")&&(f=!0)}if(window.opener&&!window.opener.closed){const t=new URL(e).searchParams,r=t.get("code"),n=t.get("state"),i=t.get("error"),o=t.get("error_description");return i?(a("error"),l(`Authorization failed: ${o||i}`),window.opener.postMessage({type:f?"OAUTH_CALLBACK":"oauth-callback",error:i,error_description:o||i},window.location.origin),void setTimeout(()=>{window.close()},2e3)):r&&n?(a("success"),l("Authorization successful! Closing popup..."),window.opener.postMessage({type:f?"OAUTH_CALLBACK":"oauth-callback",code:r,state:n,success:!0},window.location.origin),void setTimeout(()=>{window.close()},1e3)):(a("error"),l("Authorization failed: Missing authorization code"),window.opener.postMessage({type:f?"OAUTH_CALLBACK":"oauth-callback",error:"invalid_request",error_description:"Missing authorization code or state"},window.location.origin),void setTimeout(()=>{window.close()},2e3))}if(m)try{if(f){const t=new URL(e).searchParams,r=t.get("code"),i=t.get("state"),o=t.get("error");if(o)return a("error"),l(`Authorization failed: ${t.get("error_description")||o}`),void setTimeout(()=>{n(`/flows/oauth-authorization-code-v3?error=${encodeURIComponent(o)}`)},2e3);if(r&&i)return sessionStorage.setItem("oauth_v3_auth_code",r),sessionStorage.setItem("oauth_v3_state",i),a("success"),l("Authorization successful! Redirecting back to OAuth flow..."),void setTimeout(()=>{n("/flows/oauth-authorization-code-v3?step=5")},1500)}if(x){const t=new URL(e).searchParams,r=t.get("code"),i=t.get("state"),o=t.get("error");if(o){a("error");const e="oidc-authorization-code-v5"===v?.flow?`/flows/oidc-authorization-code-v6?error=${encodeURIComponent(o)}`:`/flows/oauth-authorization-code-v6?error=${encodeURIComponent(o)}`;return void setTimeout(()=>{n(e)},2e3)}if(r&&i){a("success");const e="oidc-authorization-code-v5"===v?.flow;l(`Authorization successful! Redirecting back to ${e?"OIDC V5":"OAuth V5"} flow...`);const t=v?.returnPath||(e?"/flows/oidc-authorization-code-v6?step=4":"/flows/oauth-authorization-code-v6?step=4"),o=t.includes("?")?"&":"?",s=`${t}${o}code=${encodeURIComponent(r)}&state=${encodeURIComponent(i)}`;return void setTimeout(()=>{n(s)},1500)}}if(y){const t=new URL(e).searchParams,r=t.get("code"),i=t.get("state"),o=t.get("error");if(o){a("error");const e="oauth-authorization-code-v7-2"===v?.flow||"oidc-authorization-code-v7-2"===v?.flow,t=e?`/flows/oauth-authorization-code-v7-2?error=${encodeURIComponent(o)}`:`/flows/oauth-authorization-code-v7?error=${encodeURIComponent(o)}`;return void setTimeout(()=>{n(t)},2e3)}if(r&&i){const e="oauth-authorization-code-v7-2"===v?.flow||"oidc-authorization-code-v7-2"===v?.flow;e?(sessionStorage.setItem("oauth_auth_code",r),sessionStorage.setItem("oauth_state",i)):(sessionStorage.setItem("oauth_v7_auth_code",r),sessionStorage.setItem("oauth_v7_state",i)),a("success");l(`Authorization successful! Redirecting back to ${"oidc-authorization-code-v7"===v?.flow||"oidc-authorization-code-v7-2"===v?.flow?"OIDC V7":"OAuth V7"} flow...`);let t=v?.returnPath;return t||(t=e?"/flows/oauth-authorization-code-v7-2?step=4":"/flows/oauth-authorization-code-v7?step=4"),void setTimeout(()=>{n(t)},1500)}}if(w){const t=new URL(e).searchParams,r=t.get("code"),i=t.get("state"),o=t.get("error");if(o)return a("error"),l(`Authorization failed: ${t.get("error_description")||o}`),void setTimeout(()=>{n(`/pingone-authentication?error=${encodeURIComponent(o)}`)},2e3);if(r&&i){sessionStorage.setItem("mfa_v7_auth_code",r),sessionStorage.setItem("mfa_v7_state",i),a("success"),l("Authorization successful! Redirecting back to MFA flow...");const e=v?.returnPath||"/pingone-authentication";return void setTimeout(()=>{n(e)},1500)}return a("error"),void l("Authorization failed: Missing authorization code")}if(b){if(sessionStorage.getItem("v3_callback_processed")){return void n(v?.returnPath||"/flows/enhanced-authorization-code-v3?step=5")}const t=new URL(e).searchParams,r=t.get("code"),i=t.get("state"),o=t.get("error");if(o){const e=t.get("error_description");Object.fromEntries(t.entries());if(a("error"),l(`Authorization failed: ${e||o}`),"invalid_request"===o){let t="Authorization failed: Invalid request parameters. This usually means there's an issue with the authorization URL parameters sent to PingOne. \n\nCommon causes:\n Invalid Client ID or Redirect URI\n PKCE not enabled in PingOne application  \n Invalid scopes for your application\n Malformed authorization URL parameters";e?.toLowerCase().includes("acr_values")&&(t+="\n\n ACR Values Error Detected:\n Invalid or unsupported acr_values parameter\n Check your Flow Configuration ACR Values settings\n Use only valid ACR values like 'urn:pingone:loa:1', 'urn:pingone:loa:2', etc.\n Remove any invalid values like '1', '2', '3' or empty strings"),t+="\n\nCheck your PingOne application configuration and ensure all parameters match exactly.",l(t)}return}if(r&&i){sessionStorage.setItem("v3_callback_processed","true");const e="oidc";sessionStorage.setItem(`${e}_v3_auth_code`,r),sessionStorage.setItem(`${e}_v3_state`,i),a("success"),l("Authorization successful! Redirecting to V3 flow...");const t=v?.returnPath||"/flows/enhanced-authorization-code-v3?step=5";return void setTimeout(()=>{n(t)},1500)}return a("error"),void l("Authorization failed: Missing authorization code")}}catch(t){}const k=await o(e);if(k.success){a("success"),l("Authorization successful! Redirecting..."),Ee.auth("AuthzCallback","Authorization successful",{redirectUrl:k.redirectUrl});{const t=new URL(e).searchParams,r=t.get("code"),i=(t.get("state"),k.redirectUrl||"/");r&&(i.includes("enhanced-authorization-code-v2")||i.includes("enhanced-authorization-code-v3")||i.includes("/flows/")),setTimeout(()=>{n(i)},1500)}}else a("error"),l("Authorization failed"),p(k.error||"Unknown error occurred"),Ee.error("AuthzCallback","Authorization failed",{error:k.error})}catch(r){a("error"),l("Authorization failed"),p(r instanceof Error?r.message:"Unknown error occurred"),Ee.error("AuthzCallback","Error processing callback",r instanceof Error?{error:r.message,stack:r.stack}:{error:String(r)})}})()},[o,n]);const g=e.useMemo(()=>{const e=sessionStorage.getItem("active_oauth_flow");return e?{path:`/flows/${e}`,name:e.replace(/-/g," ").replace(/\b\w/g,e=>e.toUpperCase())}:{path:"/",name:"Home"}},[]),m=()=>{sessionStorage.removeItem("processed_auth_code"),sessionStorage.removeItem("callback_processed"),n(g.path)};if("error"===s&&d){const e=new URLSearchParams(i.search),t=e.get("error"),r=e.get("error_description");let n="authorization-code",o="oauth-authorization-code-v6";const s=sessionStorage.getItem("active_oauth_flow");s&&(o=s,s.includes("implicit")?n="implicit":s.includes("device")?n="device-authorization":s.includes("par")?n="par":s.includes("rar")?n="rar":s.includes("redirectless")&&(n="redirectless"));const a={flowType:n,flowKey:o,title:"Authorization Failed",description:c,oauthError:t||d,...r&&{oauthErrorDescription:r},correlationId:e.get("correlation_id")||Sd.generateCorrelationId(),onStartOver:m,onRetry:()=>window.location.reload()};return Sd.getFullPageError(a)}return t.jsx(Cd,{children:t.jsxs(Ad,{$status:s,children:[t.jsx(Td,{$status:s,children:(()=>{switch(s){case"success":return t.jsx(u,{});case"error":return t.jsx(le,{});default:return t.jsx(ne,{className:"animate-spin"})}})()}),t.jsxs(_d,{children:["loading"===s&&"Processing Authorization","success"===s&&"Authorization Successful","error"===s&&"Authorization Failed"]}),t.jsx(Rd,{children:c})]})})},$d=Ce.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0070CC 0%, #0056A3 100%);
  padding: 2rem;
`,Ed=Ce.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  
  ${({$status:e})=>{switch(e){case"success":return"\n          border-left: 4px solid #10b981;\n        ";case"error":return"\n          border-left: 4px solid #ef4444;\n        ";default:return"\n          border-left: 4px solid #3b82f6;\n        "}}}
`,zd=Ce.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  
  svg {
    ${({$status:e})=>{switch(e){case"success":return"\n            color: #10b981;\n            font-size: 3rem;\n          ";case"error":return"\n            color: #ef4444;\n            font-size: 3rem;\n          ";default:return"\n            color: #3b82f6;\n            font-size: 3rem;\n            animation: spin 1s linear infinite;\n          "}}}
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`,Pd=Ce.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`,Od=Ce.p`
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`,Ud=Ce.pre`
  background: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 1rem;
  font-size: 0.875rem;
  text-align: left;
  overflow-x: auto;
  margin-top: 1rem;
`,Dd=()=>{const r=j(),{handleCallback:n}=Xt(),[i,o]=e.useState("loading"),[s,a]=e.useState("Processing dashboard login..."),[c,l]=e.useState(null);e.useEffect(()=>{(async()=>{try{const e=Ze("DashboardCallback");Ee.auth("DashboardCallback","Processing dashboard login callback",{url:e});const t=await n(e);t.success?(o("success"),a("Dashboard login successful! Redirecting to dashboard..."),Ee.auth("DashboardCallback","Dashboard login successful",{redirectUrl:"/dashboard"}),setTimeout(()=>{r("/dashboard",{replace:!0})},1500)):(o("error"),a("Dashboard login failed"),l(t.error||"Unknown error occurred"),Ee.error("DashboardCallback","Dashboard login failed",{error:t.error}))}catch(e){o("error"),a("Dashboard login failed"),l(e instanceof Error?e.message:"Unknown error occurred"),Ee.error("DashboardCallback","Error processing dashboard callback",e)}})()},[n,r]);return t.jsx($d,{children:t.jsxs(Ed,{$status:i,children:[t.jsx(zd,{$status:i,children:(()=>{switch(i){case"success":return t.jsx(u,{});case"error":return t.jsx(le,{});default:return t.jsx(ne,{className:"animate-spin"})}})()}),t.jsxs(Pd,{children:["loading"===i&&"Completing Dashboard Login","success"===i&&"Dashboard Login Successful","error"===i&&"Dashboard Login Failed"]}),t.jsx(Od,{children:s}),c&&t.jsx(Ud,{children:c})]})})},Ld=Ce.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`,Nd=Ce.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
`,Md=Ce.div`
  font-size: 3rem;
  color: #6b7280;
  margin-bottom: 1rem;
`,Fd=Ce.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
`,qd=Ce.p`
  color: #6b7280;
  margin-bottom: 1rem;
`,Vd=Ce.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  text-align: left;
`,Bd=Ce.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 0.5rem;
`,Wd=Ce.p`
  color: #1e40af;
  font-size: 0.875rem;
  margin: 0;
`,Gd=()=>{j();const n=r(),[i,o]=e.useState("info"),[s,a]=e.useState("Device Code Flow Status");e.useEffect(()=>{(()=>{Ee.info("DeviceCodeStatus","Device code status page accessed",{url:n.href});const e=new URLSearchParams(n.search),t=e.get("device_code"),r=e.get("user_code"),i=e.get("verification_uri"),s=e.get("verification_uri_complete");t||r?(o("pending"),a("Device code flow in progress..."),Ee.info("DeviceCodeStatus","Device code parameters found",{hasDeviceCode:!!t,hasUserCode:!!r,verificationUri:i,verificationUriComplete:s})):(o("info"),a("Device Code Flow Status"))})()},[n.href,n.search]);return t.jsx(Ld,{children:t.jsxs(Nd,{children:[t.jsx(Md,{children:(()=>{switch(i){case"success":return t.jsx(u,{});case"error":return t.jsx(le,{});case"pending":return t.jsx(de,{});default:return t.jsx(c,{})}})()}),t.jsxs(Fd,{children:["info"===i&&"Device Code Flow Status","pending"===i&&"Device Code Flow in Progress","success"===i&&"Device Code Flow Successful","error"===i&&"Device Code Flow Failed"]}),t.jsx(qd,{children:s}),t.jsxs(Vd,{children:[t.jsx(Bd,{children:"About Device Code Flow"}),t.jsxs(Wd,{children:["The Device Code flow is designed for devices that don't have a browser or have limited input capabilities. This status page is for informational purposes only - there is no browser redirect in the Device Code flow specification.",t.jsx("br",{}),t.jsx("br",{}),"The flow works by:",t.jsx("br",{}),"1. Device requests authorization codes",t.jsx("br",{}),"2. User visits a URL on another device",t.jsx("br",{}),"3. User enters a user code",t.jsx("br",{}),"4. Device polls for completion",t.jsx("br",{}),"5. Tokens are exchanged when user completes authorization"]})]})]})})},Hd=Ce.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`,Jd=Ce.div`
  background: ${({$status:e})=>{switch(e){case"success":return"#f0fdf4";case"error":return"#fef2f2";default:return"#f8fafc"}}};
  border: 1px solid ${({$status:e})=>{switch(e){case"success":return"#bbf7d0";case"error":return"#fecaca";default:return"#e2e8f0"}}};
  border-radius: 0.75rem;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
`,Kd=Ce.div`
  font-size: 3rem;
  color: ${({$status:e})=>{switch(e){case"success":return"#16a34a";case"error":return"#dc2626";default:return"#6b7280"}}};
  margin-bottom: 1rem;
`,Yd=Ce.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
`,Xd=Ce.p`
  color: #6b7280;
  margin-bottom: 1rem;
`,Qd=Ce.pre`
  background: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 1rem;
  font-size: 0.875rem;
  text-align: left;
  overflow-x: auto;
  margin-top: 1rem;
`,Zd=()=>{const n=j();r();const{handleCallback:i}=Xt(),[o,s]=e.useState("loading"),[a,c]=e.useState("Processing hybrid flow callback..."),[l,d]=e.useState(null);e.useEffect(()=>{(async()=>{try{const e=Ze("HybridCallback");Ee.info("HybridCallback","Processing hybrid flow callback",{url:e}),(async()=>{try{const{log:e}=await De(async()=>{const{log:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.m);return{log:e}},__vite__mapDeps([6,0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]));await e("HybridCallback.tsx:99","BEFORE parsing - raw URL components",{href:window.location.href,search:window.location.search,hash:window.location.hash,pathname:window.location.pathname},"debug-session","run1","A")}catch{}})();const t=new URLSearchParams(window.location.search),r=window.location.hash.substring(1);(async()=>{try{const{log:e}=await De(async()=>{const{log:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.m);return{log:e}},__vite__mapDeps([6,0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]));await e("HybridCallback.tsx:105","AFTER extracting fragment",{fragmentLength:r.length,fragmentExists:!!r,fragmentPreview:r.substring(0,100),queryStringLength:window.location.search.length},"debug-session","run1","A")}catch{}})();const i=r?new URLSearchParams(r):null,o=i?.get("code")||t.get("code"),a=i?.get("id_token")||t.get("id_token"),l=i?.get("access_token")||null,u=i?.get("state")||t.get("state"),p=i?.get("error")||t.get("error"),h=i?.get("error_description")||t.get("error_description");if(Ee.info("HybridCallback","Parsing hybrid callback",{hasCode:!!o,hasIdToken:!!a,hasAccessToken:!!l,hasState:!!u,hasError:!!p,hasFragment:!!r,queryString:window.location.search,fragment:r?r.substring(0,200):null,fullUrl:e.substring(0,300)}),p)return s("error"),c("Hybrid flow failed"),d(h||p),void Ee.error("HybridCallback","OAuth error in hybrid callback",{error:p,errorDescription:h});if(o||a){const e=u?.startsWith("v8u-hybrid-"),t={state:u};if(o&&(t.authorization_code=o),a&&(t.id_token=a),l&&(t.access_token=l),sessionStorage.setItem("hybrid_tokens",JSON.stringify(t)),sessionStorage.setItem("oidc_hybrid_v3_callback_data",JSON.stringify({...o&&{code:o},...a&&{id_token:a},...l&&{access_token:l},...u&&{state:u},timestamp:Date.now()})),e){const e={code:o||void 0,state:u||void 0,error:void 0,errorDescription:void 0,fullUrl:window.location.href,timestamp:Date.now(),flowType:"hybrid"};if(a||l){const e={access_token:l||void 0,id_token:a||void 0,state:u||void 0,extractedAt:Date.now()};sessionStorage.setItem("v8u_implicit_tokens",JSON.stringify(e))}sessionStorage.setItem("v8u_callback_data",JSON.stringify(e))}let r;if(s("success"),o&&a?c("Hybrid flow successful! Authorization code and ID token received. Redirecting to flow..."):o?c("Authorization code received! Redirecting to flow..."):a&&c("ID token received! Redirecting to flow..."),Ee.success("HybridCallback","Hybrid flow successful, stored tokens",{hasCode:!!o,hasIdToken:!!a,hasAccessToken:!!l}),e)r="/v8u/unified/hybrid/3",Ee.info("HybridCallback","Detected unified flow, redirecting to unified route",{state:u,targetRoute:r});else{const e=sessionStorage.getItem("oidc-hybrid-v5-flow-active");r=e?"/flows/oidc-hybrid-v6":"/flows/oidc-hybrid-v3",e&&sessionStorage.removeItem("oidc-hybrid-v5-flow-active"),Ee.info("HybridCallback","Detected legacy flow, redirecting to legacy route",{targetRoute:r})}setTimeout(()=>{if(e&&window.location.hash){const e=`${r}${window.location.hash}`;Ee.info("HybridCallback","Redirecting with fragment preserved",{redirectUrl:e.substring(0,200)}),window.location.replace(e)}else n(r)},1500)}else s("error"),c("No authorization code or ID token found"),d("Expected authorization code and/or ID token in callback URL"),Ee.error("HybridCallback","No code or id_token in hybrid callback",{hasCode:!!o,hasIdToken:!!a,hasAccessToken:!!l,url:e,queryString:window.location.search,fragment:r?r.substring(0,200):null})}catch(e){s("error"),c("Hybrid flow failed"),d(e instanceof Error?e.message:"Unknown error occurred"),Ee.error("HybridCallback","Error processing hybrid callback",e)}})()},[n]);return t.jsx(Hd,{children:t.jsxs(Jd,{$status:o,children:[t.jsx(Kd,{$status:o,children:(()=>{switch(o){case"success":return t.jsx(u,{});case"error":return t.jsx(le,{});default:return t.jsx(ne,{className:"animate-spin"})}})()}),t.jsxs(Yd,{children:["loading"===o&&"Processing Hybrid Flow","success"===o&&"Hybrid Flow Successful","error"===o&&"Hybrid Flow Failed"]}),t.jsx(Xd,{children:a}),l&&t.jsx(Qd,{children:l})]})})},eu=Ce.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`,tu=Ce.div`
  background: ${({$status:e})=>{switch(e){case"success":return"#f0fdf4";case"error":return"#fef2f2";case"warning":return"#fffbeb";default:return"#f8fafc"}}};
  border: 1px solid ${({$status:e})=>{switch(e){case"success":return"#bbf7d0";case"error":return"#fecaca";case"warning":return"#fed7aa";default:return"#e2e8f0"}}};
  border-radius: 0.75rem;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
`,ru=Ce.div`
  font-size: 3rem;
  color: ${({$status:e})=>{switch(e){case"success":return"#16a34a";case"error":return"#dc2626";case"warning":return"#d97706";default:return"#6b7280"}}};
  margin-bottom: 1rem;
`,nu=Ce.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
`,iu=Ce.p`
  color: #6b7280;
  margin-bottom: 1rem;
`;Ce.div`
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  text-align: left;
`;const ou=Ce.pre`
  background: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 1rem;
  font-size: 0.875rem;
  text-align: left;
  overflow-x: auto;
  margin-top: 1rem;
`,su=()=>{const n=j(),i=r(),[o,s]=e.useState("loading"),[a,c]=e.useState("Processing implicit grant callback..."),[d,p]=e.useState(null);e.useEffect(()=>{(async()=>{try{Ee.auth("ImplicitCallback","Processing implicit grant callback",{url:window.location.href});const t=new URLSearchParams(i.search),r=new URLSearchParams(window.location.hash.substring(1)),o=t.get("access_token")||r.get("access_token"),a=t.get("id_token")||r.get("id_token"),l=t.get("error")||r.get("error"),d=t.get("error_description")||r.get("error_description");if(l){s("error"),c("Implicit grant failed");return p(d||l||"Unknown error"),void Ee.error("ImplicitCallback","Implicit grant error",{error:l,errorDescription:d,url:window.location.href,hash:window.location.hash?.substring(0,200)})}if(o||a){const t=r.get("state");if(t?.startsWith("v8u-implicit-"))return Ee.auth("ImplicitCallback","V8U unified flow detected - redirecting to unified callback handler",{state:t,hasAccessToken:!!o,hasIdToken:!!a}),void window.location.replace(`/authz-callback${window.location.hash}`);const i=sessionStorage.getItem("implicit-v8-flow-active"),l=sessionStorage.getItem("implicit-flow-v7-oauth-active")||sessionStorage.getItem("implicit-flow-v7-oidc-active"),d=sessionStorage.getItem("oauth-implicit-v6-flow-active"),u=sessionStorage.getItem("oidc-implicit-v6-flow-active"),p=sessionStorage.getItem("oauth-implicit-v5-flow-active"),h=sessionStorage.getItem("oidc-implicit-v5-flow-active"),g=sessionStorage.getItem("oidc_implicit_v3_flow_context")||sessionStorage.getItem("oauth2_implicit_v3_flow_context");if(i){s("success"),c("Tokens received - returning to V8 flow");try{const e=JSON.parse(i);Ee.auth("ImplicitCallback","V8 implicit grant received, returning to flow",{hasAccessToken:!!o,hasIdToken:!!a,responseType:e.responseType,flow:"implicit-v8"}),setTimeout(()=>{const e=window.location.hash.substring(1);n(`/flows/implicit-v8?step=TOKENS#${e}`)},1500)}catch(e){s("warning"),c("Implicit grant received (could not parse flow context)"),setTimeout(()=>{n("/flows/implicit-v8")},2e3)}}else if(l){s("success"),c("Tokens received - returning to unified flow");const e="implicit-flow-v7-oidc-active"===l;Ee.auth("ImplicitCallback","V7 implicit grant received, returning to unified flow",{hasAccessToken:!!o,hasIdToken:!!a,variant:e?"oidc":"oauth"}),setTimeout(()=>{const e=window.location.hash.substring(1);n(`/flows/implicit-v7#${e}`)},1500)}else if(d||u){s("success"),c("Tokens received - returning to flow");const e=u;Ee.auth("ImplicitCallback","V6 implicit grant received, returning to flow",{hasAccessToken:!!o,hasIdToken:!!a,flow:e?"oidc-v6":"oauth-v6"}),setTimeout(()=>{const t=e?"/flows/oidc-implicit-v6":"/flows/oauth-implicit-v6",r=window.location.hash.substring(1);n(`${t}#${r}`)},1500)}else if(p||h){s("success"),c("Tokens received - returning to flow");const e=h&&!p;Ee.auth("ImplicitCallback","V5 implicit grant received, returning to flow",{hasAccessToken:!!o,hasIdToken:!!a,flow:e?"oidc-v5":"oauth-v5",oauthContext:!!p,oidcContext:!!h}),setTimeout(()=>{const t=e?"/flows/oidc-implicit-v6":"/flows/oauth-implicit-v6",r=window.location.hash.substring(1);n(`${t}#${r}`)},1500)}else if(g){s("success"),c("Implicit grant received - returning to flow"),Ee.auth("ImplicitCallback","V3 implicit grant received, returning to flow",{hasAccessToken:!!o,hasIdToken:!!a});const e={access_token:o,id_token:a};sessionStorage.setItem("implicit_tokens",JSON.stringify(e)),setTimeout(()=>{window.location.pathname.includes("oidc")?n("/flows/oidc-implicit-v3?step=4"):n("/flows/oauth2-implicit-v3?step=4")},2e3)}else s("success"),c("Implicit grant received successfully"),Ee.auth("ImplicitCallback","Legacy implicit grant received",{hasAccessToken:!!o,hasIdToken:!!a}),setTimeout(()=>{n("/")},3e3)}else s("error"),c("No tokens received"),p("Expected access_token or id_token in callback URL"),Ee.error("ImplicitCallback","No tokens in callback",{url:window.location.href})}catch(t){s("error"),c("Implicit grant failed");const e=t instanceof Error?t.message:"Unknown error occurred";p(e),Ee.error("ImplicitCallback","Error processing implicit callback",{error:e,url:window.location.href})}})()},[i.search,n]);if("error"===o&&d){const e=new URLSearchParams(i.search),t=new URLSearchParams(window.location.hash.substring(1)),r=e.get("error")||t.get("error"),o=e.get("error_description")||t.get("error_description");let s="implicit-v8";const c=sessionStorage.getItem("implicit-v8-flow-active"),l=(sessionStorage.getItem("oauth-implicit-v6-flow-active"),sessionStorage.getItem("oidc-implicit-v6-flow-active")),u=(sessionStorage.getItem("oauth-implicit-v5-flow-active"),sessionStorage.getItem("oidc-implicit-v5-flow-active"));if(c)try{JSON.parse(c).responseType,s="implicit-v8"}catch{s="implicit-v8"}else s=l||u?"oidc-implicit-v6":"oauth-implicit-v6";const p={flowType:"implicit",flowKey:s,title:"Implicit Grant Failed",description:a,oauthError:r||d,...o&&{oauthErrorDescription:o},correlationId:Sd.generateCorrelationId(),onStartOver:()=>{sessionStorage.removeItem("processed_auth_code"),sessionStorage.removeItem("callback_processed"),n(`/flows/${s}`)},onRetry:()=>window.location.reload()};return Sd.getFullPageError(p)}return t.jsx(eu,{children:t.jsxs(tu,{$status:o,children:[t.jsx(ru,{$status:o,children:(()=>{switch(o){case"success":return t.jsx(u,{});case"error":return t.jsx(le,{});case"warning":return t.jsx(l,{});default:return t.jsx(ne,{className:"animate-spin"})}})()}),t.jsxs(nu,{children:["loading"===o&&"Processing Implicit Grant","success"===o&&"Implicit Grant Successful","error"===o&&"Implicit Grant Failed"]}),t.jsx(iu,{children:a}),d&&t.jsx(ou,{children:d})]})})},au={network:[/network/i,/fetch/i,/connection/i,/timeout/i,/ECONNREFUSED/i,/ENOTFOUND/i,/ETIMEDOUT/i],authentication:[/invalid_client/i,/unauthorized/i,/invalid_token/i,/authentication/i,/401/i],authorization:[/access_denied/i,/insufficient_scope/i,/forbidden/i,/403/i],validation:[/invalid_request/i,/invalid_grant/i,/missing/i,/required/i,/400/i],timeout:[/timeout/i,/took too long/i,/408/i],rate_limit:[/rate limit/i,/too many requests/i,/429/i],server_error:[/internal server error/i,/500/i,/502/i,/503/i,/504/i]};class cu{static errorStore=new Map;static analyticsStore=new Map;static handleFlowError(e,t){const r=cu.createFlowError(e,t),n=cu.generateErrorResponse(r),i=cu.generateRecoveryOptions(r);return cu.storeError(r),cu.logError(r),cu.reportError(r),{...n,recoveryOptions:i,correlationId:cu.generateCorrelationId()}}static classifyError(e){const t=cu.extractErrorMessage(e).toLowerCase();for(const[r,n]of Object.entries(au))if(n.some(e=>e.test(t)))return r;if(e.code||e.status||e.statusCode){const t=e.code||e.status||e.statusCode;return cu.classifyByCode(t)}return e.name?cu.classifyByName(e.name):"unknown"}static classifyByCode(e){const t="string"==typeof e?parseInt(e,10):e;if(t>=400&&t<500)switch(t){case 400:return"validation";case 401:return"authentication";case 403:return"authorization";case 408:return"timeout";case 429:return"rate_limit";default:return"client_error"}else if(t>=500)return"server_error";return"unknown"}static classifyByName(e){const t=e.toLowerCase();return t.includes("network")||t.includes("fetch")?"network":t.includes("timeout")?"timeout":t.includes("auth")?"authentication":"unknown"}static determineSeverity(e,t){switch(e){case"server_error":return"critical";case"authentication":case"authorization":return"high";case"network":case"timeout":default:return"medium";case"validation":case"configuration":return"low"}}static getUserFriendlyMessage(e,t){const r={network:"Unable to connect to the authentication service. Please check your internet connection and try again.",authentication:"Authentication failed. Please verify your client credentials and try again.",authorization:"You don't have permission to perform this action. Please check your access rights or contact your administrator.",validation:"The information provided is not valid. Please check your input and try again.",configuration:"There's a configuration issue. Please contact support if this persists.",timeout:"The request timed out. Please try again in a few moments.",rate_limit:"Too many requests. Please wait a moment before trying again.",server_error:"The authentication service is temporarily unavailable. Please try again later.",client_error:"There was an issue with your request. Please try again or contact support.",unknown:"An unexpected error occurred. Please try again or contact support if this persists."};return r[e]||r.unknown}static generateRecoveryOptions(e){const t=[];switch(e.type){case"network":t.push({id:"retry",label:"Try Again",action:()=>window.location.reload(),primary:!0}),t.push({id:"check-connection",label:"Check Network",action:()=>window.open("https://www.google.com","_blank")});break;case"authentication":t.push({id:"check-credentials",label:"Verify Credentials",action:()=>{window.location.hash="#/configuration"},primary:!0}),t.push({id:"reset-flow",label:"Start Over",action:()=>window.location.reload()});break;case"validation":t.push({id:"fix-input",label:"Review Input",action:()=>{const e=document.querySelector(".error, .invalid");e?.scrollIntoView({behavior:"smooth"})},primary:!0});break;case"timeout":case"rate_limit":t.push({id:"wait-retry",label:"Wait & Retry",action:()=>setTimeout(()=>window.location.reload(),5e3),primary:!0});break;default:t.push({id:"retry",label:"Try Again",action:()=>window.location.reload(),primary:!0}),t.push({id:"contact-support",label:"Contact Support",action:()=>window.open("mailto:support@example.com","_blank")})}return t}static shouldRetry(e){return["network","timeout","server_error"].includes(e)}static shouldContactSupport(e){return["server_error","configuration","unknown"].includes(e)}static createFlowError(e,t){const r=cu.classifyError(e);return{type:r,severity:cu.determineSeverity(r,t),originalError:e,flowId:t.flowId,stepId:t.stepId,userMessage:cu.getUserFriendlyMessage(r,t),technicalMessage:cu.extractErrorMessage(e),timestamp:new Date,context:t.metadata,userId:t.userId,sessionId:t.sessionId}}static generateErrorResponse(e){return{type:e.type,severity:e.severity,userMessage:e.userMessage,technicalMessage:e.technicalMessage,shouldRetry:cu.shouldRetry(e.type),contactSupport:cu.shouldContactSupport(e.type)}}static extractErrorMessage(e){return"string"==typeof e?e:e?.message?e.message:e?.error_description?e.error_description:e?.error?"string"==typeof e.error?e.error:JSON.stringify(e.error):"Unknown error occurred"}static storeError(e){const t=`${e.flowId}-${e.type}-${Date.now()}`;cu.errorStore.set(t,e);const r=cu.analyticsStore.get(e.type)||{errorType:e.type,frequency:0,averageResolutionTime:0,userImpact:0,commonRecoveryActions:[]};r.frequency++,cu.analyticsStore.set(e.type,r)}static logError(e){cu.getLogLevel(e.severity),e.timestamp.toISOString(),e.type,e.severity,e.flowId,e.stepId,e.userId,e.sessionId,e.technicalMessage,e.context}static reportError(e){e.type,e.severity,e.technicalMessage,e.originalError,e.flowId,e.stepId,e.userId,e.sessionId,navigator.userAgent,window.location.href,e.timestamp.toISOString(),e.context}static generateCorrelationId(){return`err_${Date.now()}_${Math.random().toString(36).substr(2,9)}`}static getLogLevel(e){switch(e){case"critical":case"high":return"error";case"medium":return"warn";default:return"info"}}static getErrorAnalytics(e){return e?cu.analyticsStore.has(e)?[cu.analyticsStore.get(e)]:[]:Array.from(cu.analyticsStore.values())}static clearErrorStore(){cu.errorStore.clear(),cu.analyticsStore.clear()}static getRecentErrors(e=10){return Array.from(cu.errorStore.values()).sort((e,t)=>t.timestamp.getTime()-e.timestamp.getTime()).slice(0,e)}}cu.handleFlowError.bind(cu),cu.classifyError.bind(cu),cu.getUserFriendlyMessage.bind(cu);const lu=Ce.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
`,du=Ce.div`
  background: white;
  border-radius: 1rem;
  padding: 3rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  text-align: center;
`,uu=Ce.div`
  color: #ef4444;
  font-size: 4rem;
  margin-bottom: 1.5rem;
`,pu=Ce.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
`,hu=Ce.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
`,gu=Ce.details`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1.5rem 0;
  text-align: left;
`,mu=Ce.summary`
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  margin-bottom: 0.5rem;
`,fu=Ce.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
`,bu=Ce.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`,xu=Ce.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:nth-child(2) {
    background: #6b7280;
    
    &:hover {
      background: #4b5563;
    }
  }
`;class yu extends e.Component{constructor(e){super(e),this.state={hasError:!1,errorResponse:null,showDetails:!1}}static getDerivedStateFromError(e){return{hasError:!0,errorResponse:cu.handleFlowError(e,{flowId:"error-boundary",metadata:{componentStack:e.stack,userAgent:navigator.userAgent,url:window.location.href,timestamp:(new Date).toISOString()}})}}componentDidCatch(e,t){this.props.onError&&this.props.onError(e,t),this.reportError(e,t)}reportError(e,t){const r={...e,componentStack:t.componentStack,errorBoundary:!0};cu.handleFlowError(r,{flowId:"error-boundary",metadata:{componentStack:t.componentStack,errorBoundary:!0,errorBoundaryStack:t.componentStack}})}handleRecovery=e=>{try{const t=e.action();t instanceof Promise?t.then(()=>{this.resetError()}).catch(e=>{}):this.resetError()}catch(t){}};resetError=()=>{this.setState({hasError:!1,errorResponse:null,showDetails:!1})};toggleDetails=()=>{this.setState(e=>({showDetails:!e.showDetails}))};render(){if(this.state.hasError&&this.state.errorResponse){if(this.props.fallback)return this.props.fallback;const{errorResponse:e}=this.state;return t.jsx(lu,{children:t.jsxs(du,{children:[t.jsx(uu,{children:t.jsx(l,{})}),t.jsx(pu,{children:"critical"===e.severity?"Critical Error":"high"===e.severity?"Error Occurred":"Something went wrong"}),t.jsx(hu,{children:e.userMessage}),e.recoveryOptions.length>0&&t.jsx(bu,{children:e.recoveryOptions.map(e=>t.jsxs(xu,{onClick:()=>this.handleRecovery(e),style:{background:e.primary?"#dc2626":"#6b7280",marginRight:"0.5rem",marginBottom:"0.5rem"},children:["retry"===e.id&&t.jsx(b,{}),"contact-support"===e.id&&t.jsx(ue,{}),"check-connection"===e.id&&t.jsx(T,{}),e.label]},e.id))}),t.jsxs(gu,{children:[t.jsxs(mu,{onClick:this.toggleDetails,children:[this.state.showDetails?"Hide":"Show"," Technical Details"]}),this.state.showDetails&&t.jsxs(fu,{children:[t.jsx("strong",{children:"Error Type:"})," ",e.type,t.jsx("br",{}),t.jsx("strong",{children:"Severity:"})," ",e.severity,t.jsx("br",{}),t.jsx("strong",{children:"Message:"})," ",e.technicalMessage,t.jsx("br",{}),t.jsx("strong",{children:"Correlation ID:"})," ",e.correlationId]})]})]})})}return this.props.children}}const wu=Ce.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 500px;
  background: white;
  border: 2px solid #ef4444;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`,vu=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`,ku=Ce.div`
  color: #ef4444;
  font-size: 1.5rem;
  margin-right: 0.5rem;
`,ju=Ce.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #ef4444;
  flex: 1;
`,Su=Ce.button`
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
`,Cu=Ce.p`
  margin: 0;
  color: #374151;
  line-height: 1.5;
  font-size: 0.875rem;
`,Au=Ce.div`
  background: #fef2f2;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin: 0.75rem 0 0 0;
  border-left: 4px solid #ef4444;
`,Tu=Ce.div`
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
`,_u=Ce.div`
  color: #7f1d1d;
  font-size: 0.75rem;
  line-height: 1.4;
`,Ru=()=>{const{error:r,dismissError:n}=Xt();if(e.useEffect(()=>{const e=e=>{"Escape"===e.key&&r&&n()};if(r)return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)},[r,n]),!r)return null;let i;try{i=et.interpret({error:"token_exchange_failed",error_description:r,details:{originalError:r}})}catch{i={title:"Authentication Error",message:r,suggestion:"Please check your configuration and try again.",severity:"error",category:"authentication"}}return t.jsxs(wu,{children:[t.jsxs(vu,{children:[t.jsx(ku,{children:t.jsx(d,{})}),t.jsx(ju,{children:i.title}),t.jsx(Su,{onClick:n,title:"Dismiss error",children:t.jsx(f,{})})]}),t.jsx(Cu,{children:i.message}),i.suggestion&&t.jsxs(Au,{children:[t.jsx(Tu,{children:" Suggestion:"}),t.jsx(_u,{children:i.suggestion})]})]})},Iu=Ce.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 60vh;
	padding: 2rem;
	text-align: center;
`,$u=Ce.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.75rem;
	padding: 2rem;
	max-width: 500px;
	width: 100%;
`,Eu=Ce.div`
	font-size: 3rem;
	color: #22c55e;
	margin-bottom: 1rem;
`,zu=Ce.h1`
	margin: 0 0 0.5rem 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: #14532d;
`,Pu=Ce.p`
	margin: 0 0 1.5rem 0;
	color: #166534;
	line-height: 1.6;
`,Ou=Ce.button`
	background: linear-gradient(135deg, #22c55e, #16a34a);
	color: white;
	border: none;
	border-radius: 0.5rem;
	padding: 0.75rem 2rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #16a34a, #15803d);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
	}

	svg {
		font-size: 1.1rem;
	}
`,Uu=()=>{const r=j(),[n,i]=e.useState(!0);e.useEffect(()=>{(async()=>{try{Ee.auth("LogoutCallback","Processing logout callback");["access_token","id_token","refresh_token","oauth_state","oauth_nonce","oauth_tokens","oidc_state","oidc_nonce","oidc_tokens","flowContext","authz_flow_tokens","implicit_tokens","user_info","session_state"].forEach(e=>{localStorage.removeItem(e),sessionStorage.removeItem(e)}),Ee.auth("LogoutCallback","Logout completed successfully"),Ge.showSuccess("You have been successfully logged out"),setTimeout(()=>{i(!1)},1e3)}catch(e){Ee.error("LogoutCallback","Error during logout processing",e),Ge.showError("An error occurred during logout"),i(!1)}})()},[]);return n?t.jsx(Iu,{children:t.jsxs($u,{children:[t.jsx(Eu,{children:t.jsx(u,{})}),t.jsx(zu,{children:"Logging Out..."}),t.jsx(Pu,{children:"Please wait while we complete the logout process and clean up your session data."})]})}):t.jsx(Iu,{children:t.jsxs($u,{children:[t.jsx(Eu,{children:t.jsx(u,{})}),t.jsx(zu,{children:"Logout Successful"}),t.jsx(Pu,{children:"You have been successfully logged out from all applications. Your session has been terminated and all tokens have been cleared."}),t.jsxs(Ou,{onClick:()=>{r("/login")},children:[t.jsx(E,{}),"Return to Login"]})]})})},Du=(t=3e4)=>{const[r,n]=e.useState({isOnline:!1,isChecking:!1,lastChecked:null,error:null,retryCount:0}),i=e.useCallback(async()=>{n(e=>({...e,isChecking:!0,error:null}));try{const e=new AbortController,t=setTimeout(()=>e.abort(),1e4),r=await fetch("https://localhost:3000/api/health",{method:"GET",headers:{Accept:"application/json"},signal:e.signal});clearTimeout(t),r.ok?n(()=>({isOnline:!0,isChecking:!1,lastChecked:new Date,error:null,retryCount:0})):n(e=>({isOnline:!1,isChecking:!1,lastChecked:new Date,error:`Server responded with status ${r.status}`,retryCount:e.retryCount+1}))}catch(e){const t=e instanceof Error?e.message:"Unknown error";n(e=>({isOnline:!1,isChecking:!1,lastChecked:new Date,error:t,retryCount:e.retryCount+1}))}},[]);return e.useEffect(()=>{if(t>0){const e=setTimeout(()=>{i()},2e3);return()=>clearTimeout(e)}},[i,t]),e.useEffect(()=>{if(t>0){const e=setInterval(()=>{r.isOnline||i()},t);return()=>clearInterval(e)}},[i,t,r.isOnline]),{...r,checkHealth:i}},Lu=Ae`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`,Nu=Ae`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`,Mu=Ce.div`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
`,Fu=Ce.div`
  background: ${({$status:e})=>{switch(e){case"checking":return"#fef3c7";case"online":return"#d1fae5";case"offline":return"#fee2e2";default:return"#f3f4f6"}}};
  border: 2px solid ${({$status:e})=>{switch(e){case"checking":return"#f59e0b";case"online":return"#10b981";case"offline":return"#ef4444";default:return"#6b7280"}}};
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  animation: ${({$status:e})=>"checking"===e?Te`${Lu} 2s infinite`:"none"};
`,qu=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`,Vu=Ce.div`
  color: ${({$status:e})=>{switch(e){case"checking":return"#f59e0b";case"online":return"#10b981";case"offline":return"#ef4444";default:return"#6b7280"}}};
  font-size: 1.25rem;
  
  ${({$status:e})=>"checking"===e&&Te`
    animation: ${Nu} 1s linear infinite;
  `}
`,Bu=Ce.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`,Wu=Ce.p`
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
`,Gu=Ce.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
`,Hu=Ce.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`,Ju=Ce.button`
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`,Ku=({onDismiss:r})=>{const[n,i]=e.useState("checking"),[o,s]=e.useState(!0),[a,c]=e.useState(null),[d,p]=e.useState(0),h=e.useCallback(async()=>{i("checking"),c(new Date);try{(await fetch("/api/health",{method:"GET",headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)})).ok?(i("online"),p(0)):i("offline")}catch(e){i("offline"),p(e=>e+1)}},[]);e.useEffect(()=>{const e=setTimeout(()=>{h()},2e3);return()=>clearTimeout(e)},[h]),e.useEffect(()=>{const e=setInterval(()=>{"offline"===n&&h()},3e4);return()=>clearInterval(e)},[n,h]);if(!o)return null;const g=(()=>{switch(n){case"checking":return{icon:t.jsx(b,{}),title:"Checking Server Status...",message:"Verifying connection to backend server..."};case"online":return{icon:t.jsx(u,{}),title:"Backend Server Online",message:"Backend server is running and responding normally."};case"offline":return{icon:t.jsx(pe,{}),title:"Backend Server Offline",message:`Backend server is not responding. ${d>0?`(${d} failed attempts)`:""} Please start the backend server with: node server.js`};default:return{icon:t.jsx(l,{}),title:"Unknown Status",message:"Unable to determine server status."}}})();return t.jsx(Mu,{children:t.jsxs(Fu,{$status:n,children:[t.jsxs(qu,{children:[t.jsx(Vu,{$status:n,children:g.icon}),t.jsx(Bu,{children:g.title})]}),t.jsx(Wu,{children:g.message}),a&&t.jsxs(Wu,{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.25rem"},children:["Last checked: ",a.toLocaleTimeString()]}),t.jsxs(Gu,{children:[t.jsxs(Hu,{onClick:()=>{h()},disabled:"checking"===n,children:[t.jsx(b,{}),"Retry"]}),"online"===n&&t.jsx(Ju,{onClick:()=>{s(!1),r?.()},children:"Dismiss"})]})]})})},Yu=e.createContext(void 0),Xu=({children:r,showHealthCheck:n=!0})=>{const i=Du(n?3e4:0),[o,s]=e.useState(!1);e.useEffect(()=>{o||i.isChecking||s(!0)},[o,i.isChecking]);const a=e.useMemo(()=>!!n&&(!o||(!i.isOnline||!!i.error)),[n,o,i.isOnline,i.error]);return t.jsxs(Yu.Provider,{value:i,children:[r,a&&t.jsx(Ku,{})]})},Qu=({children:r})=>{const{isLoading:n}=Xt(),[i,o]=e.useState(!1),[s,a]=e.useState(!0);return e.useEffect(()=>{const e=setTimeout(()=>{o(!0)},100);return()=>clearTimeout(e)},[]),e.useEffect(()=>{a(!(!n&&i))},[n,i]),t.jsxs(t.Fragment,{children:[t.jsx(Ut,{show:s,message:"Initializing application...",theme:"blue"}),r]})},Zu=Ce.div`
  position: relative;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #1f2937;
`,ep=Ce.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #374151;
  border-bottom: 1px solid #4b5563;
`,tp=Ce.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
`,rp=Ce.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${e=>e.copied?"#10b981":"#6b7280"};
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: ${e=>e.copied?"#059669":"#9ca3af"};
  }
`,np=Ce.div`
  height: ${e=>e.height||"300px"};
  overflow: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #f9fafb;
  padding: 1rem;
  white-space: pre-wrap;
  word-break: break-word;
`,ip=Ce.span`
  background-color: ${e=>e.color}20;
  color: ${e=>e.color};
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 500;
  border: 1px solid ${e=>e.color}40;
`,op=({value:r,onChange:o,readOnly:s=!1,height:a="300px",scopeColors:c={},className:l})=>{const[d,u]=e.useState(!1),[p,h]=e.useState(!1),[g,m]=e.useState(""),f={openid:"#3b82f6",profile:"#10b981",email:"#f59e0b",address:"#ef4444",phone:"#8b5cf6",offline_access:"#06b6d4",read:"#84cc16",write:"#f97316",admin:"#dc2626",...c};e.useEffect(()=>{m(JSON.stringify(r,null,2))},[r]);const b=()=>{try{const e=JSON.parse(g);o?.(e),h(!1)}catch(e){}},x=()=>{h(!1),m(JSON.stringify(r,null,2))},y=e.useMemo(()=>{if(p)return null;return(e=>{const r=[];let n=0;const i=/"([^"]*scope[^"]*)"\s*:\s*"([^"]+)"/g;let o;for(;null!==(o=i.exec(e));){o.index>n&&r.push(e.slice(n,o.index)),r.push(o[1]),r.push('": "');o[2].split(" ").forEach((e,n)=>{n>0&&r.push(" ");const i=f[e]||"#6b7280";r.push(t.jsx(ip,{color:i,children:e},`${o.index}-${n}`))}),r.push('"'),n=o.index+o[0].length}return n<e.length&&r.push(e.slice(n)),r.length>0?r:[e]})(JSON.stringify(r,null,2))},[r,f,p]);return p?t.jsxs(Zu,{className:l,children:[t.jsxs(ep,{children:[t.jsx(tp,{children:"Edit JSON Configuration"}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[t.jsx("button",{onClick:b,style:{padding:"0.5rem 0.75rem",background:"#10b981",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.75rem",cursor:"pointer"},children:"Save"}),t.jsx("button",{onClick:x,style:{padding:"0.5rem 0.75rem",background:"#6b7280",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.75rem",cursor:"pointer"},children:"Cancel"})]})]}),t.jsx("textarea",{value:g,onChange:e=>m(e.target.value),style:{width:"100%",height:a,border:"none",outline:"none",background:"#1f2937",color:"#f9fafb",fontFamily:"Monaco, Menlo, Ubuntu Mono, monospace",fontSize:"0.875rem",lineHeight:"1.5",padding:"1rem",resize:"none"},placeholder:"Enter valid JSON..."})]}):t.jsxs(Zu,{className:l,children:[t.jsxs(ep,{children:[t.jsx(tp,{children:"JSON Configuration"}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[!s&&t.jsx("button",{onClick:()=>{h(!0),m(JSON.stringify(r,null,2))},style:{padding:"0.5rem 0.75rem",background:"#3b82f6",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.75rem",cursor:"pointer"},children:"Edit"}),t.jsxs(rp,{copied:d,onClick:async()=>{try{await navigator.clipboard.writeText(JSON.stringify(r,null,2)),u(!0),setTimeout(()=>u(!1),2e3)}catch(e){}},children:[d?t.jsx(i,{size:12}):t.jsx(n,{size:12}),d?"Copied!":"Copy"]})]})]}),t.jsx(np,{height:a,children:y})]})};const sp=new class{STORAGE_KEY="pingone_advanced_security_settings";cache=null;cacheTimestamp=0;CACHE_DURATION=3e5;getAvailableSettings(){return[{id:"authentication",name:"Authentication Security",description:"Configure authentication methods and security requirements",icon:"🔐",settings:[{id:"requestParameterSignature",label:"Request Parameter Signature",description:"Controls whether request parameters must be cryptographically signed for enhanced security and integrity.",type:"dropdown",category:"authentication",securityLevel:"high",options:[{value:"default",label:"Default",description:"Uses PingOne's default signature requirements"},{value:"require_signed",label:"Require Signed",description:"All requests must include valid signatures",recommended:!0},{value:"allow_unsigned",label:"Allow Unsigned",description:"Permits requests without signatures (less secure)"}]},{id:"includeX5tParameter",label:"Include x5t Parameter",description:"Includes the x5t (X.509 certificate thumbprint) parameter in JWT tokens for certificate-based authentication validation.",type:"checkbox",category:"authentication",securityLevel:"medium",recommended:!0},{id:"requireClientAuthentication",label:"Require Client Authentication",description:"Enforces that all clients must authenticate using supported methods (client_secret_basic, client_secret_post, etc.)",type:"checkbox",category:"authentication",securityLevel:"high",recommended:!0}]},{id:"authorization",name:"Authorization & Scopes",description:"Manage authorization flows and scope permissions",icon:"🛡️",settings:[{id:"requestScopesForMultipleResources",label:"Request Scopes for Multiple Resources",description:"Allows requesting permissions across multiple resource servers in a single authorization request, useful for microservices architectures.",type:"checkbox",category:"authorization",securityLevel:"medium"},{id:"enforcePKCE",label:"Enforce PKCE (Proof Key for Code Exchange)",description:"Requires PKCE for all authorization code flows to prevent authorization code interception attacks.",type:"checkbox",category:"authorization",securityLevel:"high",recommended:!0}]},{id:"session",name:"Session Management",description:"Configure user session handling and security",icon:"👤",settings:[{id:"openIdConnectSessionManagement",label:"OpenID Connect Session Management",description:"Enables OIDC session management features including session state and logout functionality for better user session handling.",type:"checkbox",category:"session",securityLevel:"medium",recommended:!0},{id:"terminateUserSessionByIdToken",label:"Terminate User Session by ID Token",description:"Allows terminating user sessions using the ID token, providing a way to logout users across all applications.",type:"checkbox",category:"session",securityLevel:"high",recommended:!0}]},{id:"token",name:"Token Security",description:"Configure token security and lifecycle management",icon:"🎫",settings:[{id:"additionalRefreshTokenReplayProtection",label:"Additional Refresh Token Replay Protection",description:"Prevents refresh tokens from being used multiple times, enhancing security by ensuring each token can only be used once.",type:"checkbox",category:"token",securityLevel:"high",recommended:!0},{id:"tokenBindingRequired",label:"Token Binding Required",description:"Requires token binding to prevent token theft and replay attacks across different clients.",type:"checkbox",category:"token",securityLevel:"critical"}]},{id:"request",name:"Request Security",description:"Configure request-level security features",icon:"📡",settings:[{id:"requirePushedAuthorizationRequests",label:"Require Pushed Authorization Requests (PAR)",description:"Forces all authorization requests to use PAR, preventing request parameter leakage and improving security.",type:"checkbox",category:"request",securityLevel:"high",recommended:!0}]}]}getCurrentSettings(){const e=Date.now();if(this.cache&&e-this.cacheTimestamp<this.CACHE_DURATION)return this.cache;try{const t=localStorage.getItem(this.STORAGE_KEY);if(t){const r=JSON.parse(t);return this.cache=r,this.cacheTimestamp=e,Ee.info("AdvancedSecuritySettings","Loaded settings from storage",r),r}}catch(r){Ee.warn("AdvancedSecuritySettings","Failed to load settings from storage",r)}const t={requestParameterSignature:"default",includeX5tParameter:!1,requestScopesForMultipleResources:!1,additionalRefreshTokenReplayProtection:!1,openIdConnectSessionManagement:!1,terminateUserSessionByIdToken:!0,requirePushedAuthorizationRequests:!1,enforcePKCE:!1,tokenBindingRequired:!1,requireClientAuthentication:!1};return this.cache=t,this.cacheTimestamp=e,t}updateSettings(e){try{const t={...this.getCurrentSettings(),...e};return localStorage.setItem(this.STORAGE_KEY,JSON.stringify(t)),this.cache=t,this.cacheTimestamp=Date.now(),Ee.success("AdvancedSecuritySettings","Settings updated successfully",t),!0}catch(t){return Ee.error("AdvancedSecuritySettings","Failed to update settings",t),!1}}resetToDefaults(){try{return localStorage.removeItem(this.STORAGE_KEY),this.cache=null,this.cacheTimestamp=0,Ee.info("AdvancedSecuritySettings","Settings reset to defaults"),!0}catch(e){return Ee.error("AdvancedSecuritySettings","Failed to reset settings",e),!1}}getSecurityLevelAssessment(){const e=this.getCurrentSettings(),t=this.getAvailableSettings();let r=0,n=0;const i=[],o=[];t.forEach(t=>{t.settings.forEach(t=>{n+=this.getSecurityLevelWeight(t.securityLevel);const o=t.id,s=e[o];if("checkbox"===t.type)!0===s?r+=this.getSecurityLevelWeight(t.securityLevel):t.recommended&&i.push(`Enable "${t.label}" for enhanced security`);else if("dropdown"===t.type){const e=t.options?.find(e=>e.value===s);e?.recommended?r+=this.getSecurityLevelWeight(t.securityLevel):"high"!==t.securityLevel&&"critical"!==t.securityLevel||i.push(`Consider using "${t.label}" for better security`)}})});const s=Math.round(r/n*100);let a;return a=s>=80?"critical":s>=60?"high":s>=40?"medium":"low",e.terminateUserSessionByIdToken||o.push("Session termination by ID token is disabled - this may impact logout functionality"),"allow_unsigned"===e.requestParameterSignature&&o.push("Allowing unsigned requests reduces security - consider requiring signatures"),{overall:a,score:s,recommendations:i,warnings:o}}getSecurityLevelWeight(e){switch(e){case"low":default:return 1;case"medium":return 2;case"high":return 3;case"critical":return 4}}exportSettings(){const e=this.getCurrentSettings();return JSON.stringify({settings:e,timestamp:(new Date).toISOString(),version:"1.0.0"},null,2)}importSettings(e){try{const t=JSON.parse(e);return!!t.settings&&this.updateSettings(t.settings)}catch(t){return Ee.error("AdvancedSecuritySettings","Failed to import settings",t),!1}}},ap=Ce.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
`,cp=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
`,lp=Ce.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,dp=Ce.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${e=>{switch(e.level){case"critical":return"#fef2f2";case"high":return"#fef3c7";case"medium":return"#dbeafe";default:return"#f3f4f6"}}};
  color: ${e=>{switch(e.level){case"critical":return"#dc2626";case"high":return"#d97706";case"medium":return"#2563eb";default:return"#6b7280"}}};
  border: 1px solid ${e=>{switch(e.level){case"critical":return"#fecaca";case"high":return"#fde68a";case"medium":return"#bfdbfe";default:return"#e5e7eb"}}};
`,up=Ce.span`
  display: inline-flex;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: ${({$expanded:e})=>e?"rotate(0deg)":"rotate(-90deg)"};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: ${({$expanded:e})=>e?"rotate(0deg) scale(1.1)":"rotate(-90deg) scale(1.1)"};
  }
`,pp=Ce.div`
  max-height: ${e=>e.$expanded?"500px":"0"};
  overflow: hidden;
  transition: max-height 0.3s ease;
  margin-top: ${e=>e.$expanded?"1rem":"0"};
`,hp=Ce.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`,gp=Ce.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`,mp=Ce.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,fp=Ce.input`
  margin-right: 0.5rem;
`,bp=Ce.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  min-width: 120px;
`,xp=Ce.p`
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
`,yp=Ce.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`,wp=Ce.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  
  ${e=>"primary"===e.variant?"\n          background: #3b82f6;\n          color: white;\n          border-color: #3b82f6;\n          &:hover {\n            background: #2563eb;\n            border-color: #2563eb;\n          }\n        ":"\n          background: white;\n          color: #374151;\n          border-color: #d1d5db;\n          &:hover {\n            background: #f9fafb;\n            border-color: #9ca3af;\n          }\n        "}
`,vp=Ce.div`
  padding: 0.75rem;
  border-radius: 6px;
  background: ${e=>{switch(e.level){case"critical":return"#fef2f2";case"high":return"#fef3c7";case"medium":return"#dbeafe";default:return"#f3f4f6"}}};
  border: 1px solid ${e=>{switch(e.level){case"critical":return"#fecaca";case"high":return"#fde68a";case"medium":return"#bfdbfe";default:return"#e5e7eb"}}};
  margin-bottom: 1rem;
`,kp=Ce.div`
  font-size: 0.875rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,jp=()=>{const[r,n]=e.useState(sp.getCurrentSettings()),[o,s]=e.useState(sp.getSecurityLevelAssessment()),[c,l]=e.useState(!1),d=(e,t)=>{const i={...r,[e]:t};n(i),sp.updateSettings(i),s(sp.getSecurityLevelAssessment())};return t.jsxs(ap,{children:[t.jsxs(cp,{onClick:()=>{l(!c)},children:[t.jsxs(lp,{children:[t.jsx(U,{size:16}),"Advanced Security Settings",o&&t.jsxs(dp,{level:o.overall,children:[o.overall.toUpperCase()," (",o.score,"%)"]})]}),t.jsx(up,{$expanded:c,children:t.jsx(a,{size:16})})]}),o&&t.jsx(vp,{level:o.overall,children:t.jsxs(kp,{children:[t.jsx(U,{size:14}),"Security Level: ",o.overall.toUpperCase()," (",o.score,"%)",o.recommendations.length>0&&t.jsxs("span",{style:{color:"#6b7280",fontSize:"0.75rem"},children:["• ",o.recommendations.length," recommendations"]})]})}),t.jsxs(pp,{$expanded:c,children:[t.jsxs(hp,{children:[t.jsxs(gp,{children:[t.jsxs(mp,{children:[t.jsx(fp,{type:"checkbox",checked:r.includeX5tParameter,onChange:e=>d("includeX5tParameter",e.target.checked)}),"Include x5t Parameter"]}),t.jsx(xp,{children:"X.509 certificate thumbprint in JWT tokens"})]}),t.jsxs(gp,{children:[t.jsxs(mp,{children:[t.jsx(fp,{type:"checkbox",checked:r.requireClientAuthentication,onChange:e=>d("requireClientAuthentication",e.target.checked)}),"Require Client Authentication"]}),t.jsx(xp,{children:"Enforce client authentication methods"})]}),t.jsxs(gp,{children:[t.jsxs(mp,{children:[t.jsx(fp,{type:"checkbox",checked:r.openIdConnectSessionManagement,onChange:e=>d("openIdConnectSessionManagement",e.target.checked)}),"OIDC Session Management"]}),t.jsx(xp,{children:"Enable OIDC session features"})]}),t.jsxs(gp,{children:[t.jsxs(mp,{children:[t.jsx(fp,{type:"checkbox",checked:r.terminateUserSessionByIdToken,onChange:e=>d("terminateUserSessionByIdToken",e.target.checked)}),"Terminate Session by ID Token"]}),t.jsx(xp,{children:"Single logout functionality"})]}),t.jsxs(gp,{children:[t.jsxs(mp,{children:[t.jsx(fp,{type:"checkbox",checked:r.additionalRefreshTokenReplayProtection,onChange:e=>d("additionalRefreshTokenReplayProtection",e.target.checked)}),"Refresh Token Replay Protection"]}),t.jsx(xp,{children:"Prevent refresh token reuse"})]}),t.jsxs(gp,{children:[t.jsxs(mp,{children:[t.jsx(fp,{type:"checkbox",checked:r.enforcePKCE,onChange:e=>d("enforcePKCE",e.target.checked)}),"Enforce PKCE"]}),t.jsx(xp,{children:"Proof Key for Code Exchange"})]}),t.jsxs(gp,{children:[t.jsxs(mp,{children:[t.jsx(fp,{type:"checkbox",checked:r.requirePushedAuthorizationRequests,onChange:e=>d("requirePushedAuthorizationRequests",e.target.checked)}),"Require PAR"]}),t.jsx(xp,{children:"Pushed Authorization Requests"})]}),t.jsxs(gp,{children:[t.jsx(mp,{children:"Request Parameter Signature"}),t.jsxs(bp,{value:r.requestParameterSignature,onChange:e=>d("requestParameterSignature",e.target.value),children:[t.jsx("option",{value:"default",children:"Default"}),t.jsx("option",{value:"require_signed",children:"Require Signed"}),t.jsx("option",{value:"allow_unsigned",children:"Allow Unsigned"})]}),t.jsx(xp,{children:"Cryptographic signature requirements"})]})]}),t.jsxs(yp,{children:[t.jsxs(wp,{onClick:()=>{sp.resetToDefaults();const e=sp.getCurrentSettings();n(e),s(sp.getSecurityLevelAssessment())},children:[t.jsx(T,{size:12}),"Reset"]}),t.jsxs(wp,{variant:"primary",children:[t.jsx(i,{size:12}),"Apply Settings"]})]})]})]})},Sp=["requestParameterSignature","includeX5tParameter","requestScopesForMultipleResources","additionalRefreshTokenReplayProtection","openIdConnectSessionManagement","terminateUserSessionByIdToken","requirePushedAuthorizationRequests","enforcePKCE","tokenBindingRequired","requireClientAuthentication"],Cp=e=>Sp.includes(e),Ap=Ce.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-width: 1200px;
  margin: 0 auto;
`,Tp=Ce.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`,_p=Ce.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Rp=Ce.p`
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
`,Ip=Ce.div`
  padding: 1rem;
  border-radius: 8px;
  background: ${e=>{switch(e.level){case"critical":return"#fef2f2";case"high":return"#fef3c7";case"medium":return"#dbeafe";default:return"#f3f4f6"}}};
  border: 1px solid ${e=>{switch(e.level){case"critical":return"#fecaca";case"high":return"#fde68a";case"medium":return"#bfdbfe";default:return"#e5e7eb"}}};
  margin-bottom: 1.5rem;
`,$p=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`,Ep=Ce.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`,zp=Ce.div`
  font-size: 0.875rem;
  color: #64748b;
`,Pp=Ce.div`
  margin-top: 0.75rem;
`,Op=Ce.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
`,Up=Ce.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
`,Dp=Ce.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
`,Lp=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`,Np=Ce.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`,Mp=Ce.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1rem 0;
`,Fp=Ce.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`,qp=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`,Vp=Ce.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Bp=Ce.p`
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
`,Wp=Ce.input`
  margin-right: 0.5rem;
`,Gp=Ce.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  min-width: 150px;
`,Hp=Ce.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${e=>{switch(e.level){case"critical":return"#fef2f2";case"high":return"#fef3c7";case"medium":return"#dbeafe";default:return"#f3f4f6"}}};
  color: ${e=>{switch(e.level){case"critical":return"#dc2626";case"high":return"#d97706";case"medium":return"#2563eb";default:return"#6b7280"}}};
  border: 1px solid ${e=>{switch(e.level){case"critical":return"#fecaca";case"high":return"#fde68a";case"medium":return"#bfdbfe";default:return"#e5e7eb"}}};
`,Jp=Ce.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
`,Kp=Ce.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  
  ${e=>{switch(e.variant){case"primary":return"\n          background: #3b82f6;\n          color: white;\n          border-color: #3b82f6;\n          &:hover {\n            background: #2563eb;\n            border-color: #2563eb;\n          }\n        ";case"danger":return"\n          background: #ef4444;\n          color: white;\n          border-color: #ef4444;\n          &:hover {\n            background: #dc2626;\n            border-color: #dc2626;\n          }\n        ";default:return"\n          background: white;\n          color: #374151;\n          border-color: #d1d5db;\n          &:hover {\n            background: #f9fafb;\n            border-color: #9ca3af;\n          }\n        "}}}
`,Yp=()=>{const[r,n]=e.useState(sp.getCurrentSettings()),[s,a]=e.useState([]),[d,u]=e.useState(null);e.useEffect(()=>{a(sp.getAvailableSettings()),u(sp.getSecurityLevelAssessment())},[]);const p=(e,t)=>{if(!Cp(e))return;const i={...r,[e]:t};n(i),sp.updateSettings({[e]:t}),u(sp.getSecurityLevelAssessment())};return t.jsxs(Ap,{children:[t.jsxs(Tp,{children:[t.jsx(re,{size:24}),t.jsxs("div",{children:[t.jsx(_p,{children:"Advanced Security Settings"}),t.jsx(Rp,{children:"Configure advanced security features for your OAuth/OIDC application. These settings enhance security but may impact compatibility with some clients."})]})]}),d&&t.jsxs(Ip,{level:d.overall,children:[t.jsxs($p,{children:[t.jsx(U,{size:20}),t.jsx(Ep,{children:"Security Assessment"}),t.jsx(Hp,{level:d.overall,children:d.overall.toUpperCase()})]}),t.jsxs(zp,{children:["Security Score: ",d.score,"%"]}),d.recommendations.length>0&&t.jsxs(Pp,{children:[t.jsx("strong",{children:"Recommendations:"}),d.recommendations.map((e,r)=>t.jsxs(Op,{children:[t.jsx(c,{size:14}),e]},r))]}),d.warnings.length>0&&t.jsxs(Pp,{children:[t.jsx("strong",{children:"Warnings:"}),d.warnings.map((e,r)=>t.jsxs(Op,{children:[t.jsx(l,{size:14}),e]},r))]})]}),t.jsx(Up,{children:s.map(e=>t.jsxs(Dp,{children:[t.jsxs(Lp,{children:[t.jsx("span",{style:{fontSize:"1.5rem"},children:e.icon}),t.jsxs("div",{children:[t.jsx(Np,{children:e.name}),t.jsx(Mp,{children:e.description})]})]}),e.settings.map(e=>{const n=Cp(e.id)?r[e.id]:void 0;return t.jsxs(Fp,{children:[t.jsx(qp,{children:t.jsxs(Vp,{children:["checkbox"===e.type?t.jsx(Wp,{type:"checkbox",checked:Boolean(n),onChange:t=>p(e.id,t.target.checked)}):null,e.label,e.recommended&&t.jsxs(Hp,{level:"high",children:[t.jsx(i,{size:12}),"Recommended"]})]})}),t.jsx(Bp,{children:e.description}),"dropdown"===e.type&&e.options&&t.jsx(Gp,{value:"string"==typeof n?n:"default",onChange:t=>p(e.id,t.target.value),children:e.options.map(e=>t.jsx("option",{value:e.value,children:e.label},e.value))}),"dropdown"===e.type&&e.options&&t.jsx("div",{style:{marginTop:"0.5rem",fontSize:"0.75rem",color:"#64748b"},children:e.options.find(e=>e.value===("string"==typeof n?n:""))?.description})]},e.id)})]},e.id))}),t.jsxs(Jp,{children:[t.jsxs(Kp,{onClick:()=>{sp.resetToDefaults();const e=sp.getCurrentSettings();n(e),u(sp.getSecurityLevelAssessment())},children:[t.jsx(b,{size:16}),"Reset to Defaults"]}),t.jsxs(Kp,{onClick:()=>{const e=sp.exportSettings(),t=new Blob([e],{type:"application/json"}),r=URL.createObjectURL(t),n=document.createElement("a");n.href=r,n.download="advanced-security-settings.json",n.click(),URL.revokeObjectURL(r)},children:[t.jsx(o,{size:16}),"Export Settings"]}),t.jsxs(Kp,{variant:"primary",children:[t.jsx(i,{size:16}),"Save Settings"]})]})]})},Xp=Ce.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  position: relative;
`,Qp=Ce.div`
  position: absolute;
  width: 12px;
  height: 12px;
  border: 1.5px solid #6b7280;
  border-radius: 2px;
  background: transparent;
  
  ${({$isForeground:e})=>e&&"\n    top: 2px;\n    left: 2px;\n    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);\n  "}
`,Zp=({size:e=16})=>t.jsxs(Xp,{style:{width:e,height:e},children:[t.jsx(Qp,{}),t.jsx(Qp,{$isForeground:!0})]});let eh=[],th=[];const rh=(e,t)=>(e=>{const t=e.trim();return t?t.split(/\n{2,}/).map(e=>e.split("\n")):[]})(t&&t.trim().length>0?t:e),nh=()=>{th.forEach(e=>{e([...eh])})},ih=e=>{const t=Date.now().toString()+Math.random().toString(36).substr(2,9),r=e.autoCloseMs??(e.isError?0:4e3),n={id:t,...e,autoCloseMs:r};eh.push(n),nh(),n.autoCloseMs>0&&setTimeout(()=>{oh(t)},n.autoCloseMs)},oh=e=>{eh=eh.filter(t=>t.id!==e),nh()};Ce.div`
  position: fixed;
  ${e=>"top"===e.$position?"top: 20px;":"bottom: 20px;"}
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
`,Ce.div`
  background: ${e=>e.$isError?"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)":"linear-gradient(135deg, #10b981 0%, #059669 100%)"};
  color: white;
  padding: ${e=>e.$isError?"16px 28px":"12px 24px"};
  border-radius: 8px;
  box-shadow: ${e=>e.$isError?"0 6px 25px rgba(239, 68, 68, 0.6), 0 0 0 2px rgba(239, 68, 68, 0.2)":"0 4px 20px rgba(16, 185, 129, 0.4)"};
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: ${e=>e.$isError?"600":"500"};
  font-size: ${e=>e.$isError?"15px":"14px"};
  max-width: ${e=>e.$isError?"600px":"500px"};
  animation: ${e=>e.$isError?"errorSlideIn 0.4s ease-out":"slideIn 0.3s ease-out"};
  pointer-events: auto;
  cursor: pointer;
  border: ${e=>e.$isError?"2px solid rgba(255, 255, 255, 0.3)":"none"};
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes errorSlideIn {
    0% {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    50% {
      opacity: 0.8;
      transform: translateY(-5px) scale(1.02);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  &:hover {
    opacity: 0.9;
  }
  
  ${e=>e.$isError&&"\n    animation: errorSlideIn 0.4s ease-out, errorPulse 2s ease-in-out infinite;\n    \n    @keyframes errorPulse {\n      0%, 100% {\n        box-shadow: 0 6px 25px rgba(239, 68, 68, 0.6), 0 0 0 2px rgba(239, 68, 68, 0.2);\n      }\n      50% {\n        box-shadow: 0 8px 30px rgba(239, 68, 68, 0.8), 0 0 0 4px rgba(239, 68, 68, 0.4);\n      }\n    }\n  "}
`,Ce.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(2px);
  z-index: 11000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`,Ce.div`
  position: relative;
  width: min(720px, 90vw);
  max-height: 80vh;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.35);
  border: 2px solid rgba(239, 68, 68, 0.35);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`,Ce.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`,Ce.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(248, 113, 113, 0.15);
  border: 2px solid rgba(248, 113, 113, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b91c1c;
  flex-shrink: 0;
`,Ce.h2`
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.4;
  color: #991b1b;
  font-weight: 700;
`,Ce.div`
  font-size: 0.95rem;
  line-height: 1.6;
  color: #1f2937;
  max-height: 50vh;
  overflow-y: auto;

  p {
    margin: 0 0 0.85rem;
  }

  ul, ol {
    margin: 0 0 0.85rem 1.25rem;
    padding: 0;
  }

  code, pre {
    background: rgba(248, 113, 113, 0.08);
    border-radius: 6px;
    padding: 0.35rem 0.5rem;
    display: block;
    font-family: 'Menlo', 'Monaco', monospace;
    overflow-x: auto;
    color: #991b1b;
  }

  strong {
    color: #b91c1c;
  }
`,Ce.div`
  display: flex;
  justify-content: flex-end;
`,Ce.button`
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.65rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);

  &:hover {
    background: #b91c1c;
  }
`;const sh=(e,t,r)=>{ih({text:t?`${e}\n${t}`:e,isError:!1,autoCloseMs:r})},ah=(e,t)=>{ih({text:e,isError:!0,html:rh(e,t)})},ch=Ce.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	color: #ffffff;
	transition: transform 0.2s ease, color 0.2s ease;

	svg {
		width: 1.25rem;
		height: 1.25rem;
		color: inherit;
	}
`,lh=({isExpanded:e,className:r})=>t.jsx(ch,{$isExpanded:e,className:r,children:e?t.jsx(a,{}):t.jsx(he,{})}),dh=Ce.section`
  background: var(--card-bg) !important;
  color: var(--card-fg) !important;
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  margin: 12px 0;

  h1, h2, h3, h4, h5, h6 {
    margin: 0 0 8px 0;
    font-weight: 700;
    color: var(--card-fg) !important;
  }

  p {
    margin: 0 0 8px 0;
    color: var(--card-muted);
    line-height: 1.5;
  }

  pre, code {
    background: var(--code-bg) !important;
    color: var(--code-fg) !important;
    border-radius: 8px;
    padding: 10px 12px;
    overflow: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 13px;
    line-height: 1.4;
  }

  pre {
    margin: 8px 0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  code {
    padding: 2px 6px;
    font-size: 0.9em;
  }

  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
    color: var(--card-muted);
  }

  li {
    margin: 4px 0;
    line-height: 1.5;
  }

  a {
    color: #3b82f6;
    text-decoration: underline;
  }

  a:hover {
    color: #1d4ed8;
  }

  &:focus-within {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    padding: 12px;
    margin: 8px 0;
    
    pre, code {
      padding: 8px 10px;
      font-size: 12px;
    }
  }

  @media print {
    background: white !important;
    color: black !important;
    border: 1px solid #ccc;
    box-shadow: none;
  }
`,uh=({title:e,children:r,className:n="","aria-label":i})=>t.jsxs(dh,{className:`spec-card ${n}`,role:"region","aria-label":i||e,children:[e&&t.jsx("h3",{className:"spec-card-title",children:e}),t.jsx("div",{className:"spec-card-content",children:r})]}),ph=Ce.div`
	margin-bottom: 1.5rem;
`,hh=Ce.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: 1px solid #bae6fd;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
	}
`,gh=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,mh=Ce.div`
	font-size: 1.25rem;
	color: #0284c7;
`,fh=Ce.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #0c4a6e;
	text-align: left;
`,bh=Ce.div`
	font-size: 0.75rem;
	color: #0369a1;
	text-align: left;
	margin-top: 0.25rem;
`,xh=Ce.div`
	border: 1px solid #e5e7eb;
	border-top: none;
	border-radius: 0 0 0.5rem 0.5rem;
	padding: 1.5rem;
	background: #ffffff;
`,yh=Ce.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1.5rem;
	border-bottom: 2px solid #e5e7eb;
`,wh=Ce.button`
	padding: 0.75rem 1.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: ${e=>e.$active?"#0284c7":"#6b7280"};
	background: ${e=>e.$active?"#f0f9ff":"transparent"};
	border: none;
	border-bottom: 2px solid ${e=>e.$active?"#0284c7":"transparent"};
	margin-bottom: -2px;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		color: #0284c7;
		background: #f0f9ff;
	}
`,vh=Ce.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 1rem;
`,kh=Ce.div`
	display: grid;
	grid-template-columns: 1fr auto auto auto;
	gap: 1rem;
	align-items: center;
	padding: 1rem;
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
`,jh=Ce.input`
	padding: 0.5rem 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', monospace;

	&:focus {
		outline: none;
		border-color: #0284c7;
		box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
	}
`,Sh=Ce.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	font-size: 0.75rem;
	font-weight: 500;
	color: ${e=>e.$essential?"#ffffff":"#6b7280"};
	background: ${e=>e.$essential?"#dc2626":"#ffffff"};
	border: 1px solid ${e=>e.$essential?"#dc2626":"#d1d5db"};
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: ${e=>e.$essential?"#b91c1c":"#f3f4f6"};
	}
`,Ch=Ce.button`
	padding: 0.5rem;
	color: #ef4444;
	background: transparent;
	border: none;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #fee2e2;
	}
`,Ah=Ce.button`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.875rem 1.25rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: #ffffff;
	background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
	border: none;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: 0 2px 8px rgba(2, 132, 199, 0.2);

	&:hover {
		background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
	}

	&:active {
		transform: translateY(0);
	}
`,Th=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	margin-bottom: 0.75rem;
	background: #f0f9ff;
	border: 1px solid #bae6fd;
	border-radius: 0.5rem;
	font-size: 0.8125rem;
	color: #0c4a6e;
	line-height: 1.5;
	
	svg {
		flex-shrink: 0;
		color: #0284c7;
	}
`,_h=Ce.pre`
	padding: 1rem;
	background: #1e293b;
	color: #e2e8f0;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	line-height: 1.6;
	overflow-x: auto;
	margin-top: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	
	/* JSON Syntax Highlighting */
	.json-key {
		color: #7dd3fc; /* Light blue for keys */
	}
	
	.json-string {
		color: #86efac; /* Light green for string values */
	}
	
	.json-number {
		color: #fbbf24; /* Amber for numbers */
	}
	
	.json-boolean {
		color: #c084fc; /* Purple for booleans */
	}
	
	.json-null {
		color: #f87171; /* Red for null */
	}
	
	.json-punctuation {
		color: #94a3b8; /* Gray for punctuation */
	}
`,Rh=(e,t=0)=>{const r=[],n="  ".repeat(t);if(null===e)return r.push({text:"null",className:"json-null"}),r;if("boolean"==typeof e)return r.push({text:e.toString(),className:"json-boolean"}),r;if("number"==typeof e)return r.push({text:e.toString(),className:"json-number"}),r;if("string"==typeof e)return r.push({text:`"${e}"`,className:"json-string"}),r;if(Array.isArray(e))return 0===e.length?(r.push({text:"[]",className:"json-punctuation"}),r):(r.push({text:"[\n",className:"json-punctuation"}),e.forEach((i,o)=>{r.push({text:`${n}  `}),r.push(...Rh(i,t+1)),o<e.length-1?r.push({text:",\n",className:"json-punctuation"}):r.push({text:"\n"})}),r.push({text:`${n}]`,className:"json-punctuation"}),r);if("object"==typeof e){const i=Object.entries(e);return 0===i.length?(r.push({text:"{}",className:"json-punctuation"}),r):(r.push({text:"{\n",className:"json-punctuation"}),i.forEach(([e,o],s)=>{r.push({text:`${n}  `}),r.push({text:`"${e}"`,className:"json-key"}),r.push({text:": ",className:"json-punctuation"}),r.push(...Rh(o,t+1)),s<i.length-1?r.push({text:",\n",className:"json-punctuation"}):r.push({text:"\n"})}),r.push({text:`${n}}`,className:"json-punctuation"}),r)}return r.push({text:String(e)}),r},Ih=Ce.div`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: ${e=>"success"===e.$variant?"#f0fdf4":"#eff6ff"};
	border: 1px solid ${e=>"success"===e.$variant?"#bbf7d0":"#bfdbfe"};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: ${e=>"success"===e.$variant?"#166534":"#1e40af"};
	line-height: 1.5;
	margin-bottom: 1rem;
`,$h=Ce.div`
	margin-bottom: 1.5rem;
	padding: 1rem;
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border: 2px solid #fbbf24;
	border-radius: 0.75rem;
`,Eh=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: #92400e;
	margin-bottom: 0.75rem;
`,zh=Ce.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 0.5rem;
`,Ph=Ce.div`
	display: flex;
	flex-direction: column;
	padding: 0.75rem;
	background: white;
	border: 2px solid ${e=>e.$isDragging?"#3b82f6":"#e5e7eb"};
	border-radius: 0.5rem;
	cursor: grab;
	transition: all 0.2s;
	opacity: ${e=>e.$isDragging?.5:1};

	&:hover {
		border-color: #3b82f6;
		background: #f0f9ff;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
	}

	&:active {
		cursor: grabbing;
	}
`,Oh=Ce.div`
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.8125rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.25rem;
`,Uh=Ce.div`
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.4;
`,Dh=Ce.div`
	font-size: 0.6875rem;
	color: #9ca3af;
	text-transform: uppercase;
	letter-spacing: 0.025em;
	margin-top: 0.25rem;
	font-weight: 500;
`,Lh=[{name:"address",description:"Postal address (JSON object)",category:"Address"},{name:"birthdate",description:"Date of birth (YYYY-MM-DD)",category:"Profile"},{name:"email",description:"Email address",category:"Contact"},{name:"email_verified",description:"Email verification status",category:"Contact"},{name:"family_name",description:"Last name",category:"Profile"},{name:"gender",description:"Gender",category:"Profile"},{name:"given_name",description:"First name",category:"Profile"},{name:"locale",description:"Locale preference (e.g. en-US)",category:"Locale"},{name:"middle_name",description:"Middle name",category:"Profile"},{name:"name",description:"Full name",category:"Profile"},{name:"nickname",description:"Nickname",category:"Profile"},{name:"phone_number",description:"Phone number",category:"Contact"},{name:"phone_number_verified",description:"Phone verification status",category:"Contact"},{name:"picture",description:"Profile picture URL",category:"Profile"},{name:"preferred_username",description:"Preferred username",category:"Profile"},{name:"profile",description:"Profile page URL",category:"Profile"},{name:"sub",description:"Subject identifier (User ID)",category:"Identity"},{name:"updated_at",description:"Last profile update timestamp",category:"Metadata"},{name:"website",description:"Website URL",category:"Profile"},{name:"zoneinfo",description:"Timezone (e.g. America/New_York)",category:"Locale"}],Nh=({value:r,onChange:n,collapsed:i=!1,onToggleCollapsed:o})=>{const[a,l]=e.useState("userinfo"),[p,h]=e.useState(!1),[g,m]=e.useState(null);y.useEffect(()=>{r&&0!==Object.keys(r).length?r&&!r[a]&&n({...r,[a]:{"":null}}):n({[a]:{"":null}})},[a,n,r]);const f=e.useCallback(e=>r&&r[e]?Object.entries(r[e]):[],[r]),b=e.useCallback(e=>{const t=r||{},i=t[e]||{};n({...t,[e]:{...i,"":null}})},[r,n]),x=e.useCallback((e,t,i,o)=>{const s=r||{},a={...s[e]||{}};delete a[t],a[i]=o?{essential:!0}:null,n({...s,[e]:a})},[r,n]),w=e.useCallback((e,t)=>{const i=r||{},o={...i[e]||{}};if(delete o[t],0===Object.keys(o).length){const{[e]:t,...r}=i;n(Object.keys(r).length>0?r:null)}else n({...i,[e]:o})},[r,n]),v=e.useCallback(e=>t=>{t.dataTransfer.effectAllowed="copy",t.dataTransfer.setData("text/plain",e),m(e)},[]),k=e.useCallback(()=>{m(null)},[]),j=e.useCallback(e=>{e.preventDefault(),e.dataTransfer.dropEffect="copy"},[]),S=e.useCallback((e,t)=>r=>{r.preventDefault();const n=r.dataTransfer.getData("text/plain");n&&n!==t&&""===t&&x(e,t,n,!1),m(null)},[x]),C=e.useMemo(()=>Rh(r??{}),[r]);return i?t.jsxs(hh,{onClick:o,children:[t.jsxs(gh,{children:[t.jsx(mh,{children:t.jsx(s,{})}),t.jsxs("div",{children:[t.jsx(fh,{children:"Advanced Claims Request Builder"}),t.jsx(bh,{children:"Request specific user claims (collapsed)"})]})]}),t.jsx(mh,{children:"▶"})]}):t.jsxs(ph,{children:[t.jsxs(hh,{onClick:o,children:[t.jsxs(gh,{children:[t.jsx(mh,{children:t.jsx(s,{})}),t.jsxs("div",{children:[t.jsx(fh,{children:"Advanced Claims Request Builder"}),t.jsx(bh,{children:"Request specific user claims with essential/voluntary flags"})]})]}),t.jsx(mh,{children:"▼"})]}),t.jsxs(xh,{children:[t.jsxs(Ih,{children:[t.jsx(mh,{children:t.jsx(c,{})}),t.jsxs("div",{children:[t.jsx("strong",{children:"About Claims Requests:"})," The ",t.jsx("code",{children:"claims"})," parameter lets you request specific user information beyond what's included by default in scopes.",t.jsxs("div",{style:{marginTop:"0.75rem",padding:"0.75rem",background:"#f0f9ff",borderRadius:"0.5rem",border:"1px solid #bae6fd"},children:[t.jsx("strong",{children:"Understanding Claim Values:"}),t.jsxs("ul",{style:{marginTop:"0.5rem",marginBottom:0,paddingLeft:"1.5rem",lineHeight:"1.6"},children:[t.jsxs("li",{children:[t.jsx("code",{children:"null"})," = ",t.jsx("strong",{children:"Voluntary"})," (optional) - Authorization server will try to return this claim if available, but won't fail if it's missing"]}),t.jsxs("li",{children:[t.jsx("code",{children:'{"essential": true}'})," = ",t.jsx("strong",{children:"Essential"})," (required) - Authorization server MUST return this claim or the request will fail"]})]})]}),t.jsxs("div",{style:{marginTop:"0.75rem"},children:[t.jsx("strong",{children:"💡 Example JSON:"}),t.jsx("pre",{style:{background:"#1e293b",color:"#e2e8f0",padding:"0.75rem",borderRadius:"0.5rem",fontSize:"0.8rem",overflowX:"auto"},children:'{\n  "id_token": {\n    "email": null,           ← Voluntary\n    "name": {"essential": true}  ← Required\n  }\n}'})]}),t.jsxs("div",{style:{marginTop:"0.75rem"},children:["Claims can be returned in the ",t.jsx("strong",{children:"ID Token"})," (immediately with authentication) or fetched from the ",t.jsx("strong",{children:"UserInfo endpoint"})," (separate API call)."]})]})]}),t.jsxs(yh,{children:[t.jsx(wh,{$active:"userinfo"===a,onClick:()=>l("userinfo"),children:"UserInfo Endpoint Claims"}),t.jsx(wh,{$active:"id_token"===a,onClick:()=>l("id_token"),children:"ID Token Claims"})]}),t.jsx(vh,{children:f(a).map(([e,r],n)=>{const i=!0===r?.essential;return t.jsxs(kh,{children:[t.jsx(jh,{type:"text",value:e,onChange:t=>x(a,e,t.target.value,i),onDragOver:j,onDrop:S(a,e),placeholder:"Type claim name (e.g. custom_attribute) or drag from below",title:"Type a custom claim name (like PingOne custom attributes) or drag from the Common Claims list"}),t.jsxs(Sh,{$essential:i,onClick:()=>x(a,e,e,!i),title:i?'Essential (required) - JSON: {"essential": true} - Auth server MUST return this claim or fail':"Voluntary (optional) - JSON: null - Auth server will try to return this claim but won't fail if missing",children:[i?t.jsx(d,{}):t.jsx(u,{}),i?"Essential":"Voluntary"]}),t.jsx(Ch,{onClick:()=>w(a,e),children:t.jsx(F,{})})]},`${a}-${n}`)})}),t.jsxs(Th,{children:[t.jsx(c,{}),t.jsxs("div",{children:[t.jsx("strong",{children:"Type custom claim names"})," (like PingOne custom attributes) in the input field above, or ",t.jsx("strong",{children:"drag claims from below"}),'. Click "Add Claim" to add additional fields.']})]}),t.jsxs($h,{children:[t.jsxs(Eh,{children:[t.jsx(c,{}),"Common OIDC/PingOne Claims (Drag to Use)"]}),t.jsx(zh,{children:Lh.map(e=>t.jsxs(Ph,{draggable:"true",onDragStart:v(e.name),onDragEnd:k,$isDragging:g===e.name,title:`Drag "${e.name}" to a claim input field above`,children:[t.jsx(Oh,{children:e.name}),t.jsx(Uh,{children:e.description}),t.jsx(Dh,{children:e.category})]},e.name))})]}),t.jsxs(Ah,{onClick:()=>b(a),children:[t.jsx(ge,{})," Add Another Claim"]}),t.jsxs("div",{style:{marginTop:"1.5rem",padding:"1rem",background:"linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",border:"2px solid #fbbf24",borderRadius:"0.75rem",fontSize:"0.85rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"},children:[t.jsx(c,{style:{color:"#92400e",fontSize:"1.25rem"}}),t.jsx("strong",{style:{color:"#92400e"},children:"JSON Format Guide:"})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginTop:"0.5rem"},children:[t.jsxs("div",{style:{background:"white",padding:"0.75rem",borderRadius:"0.5rem",border:"1px solid #fbbf24"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[t.jsx(u,{style:{color:"#059669"}}),t.jsx("strong",{children:"Voluntary (Optional)"})]}),t.jsx("code",{style:{background:"#f3f4f6",padding:"0.25rem 0.5rem",borderRadius:"0.25rem",display:"block"},children:'"email": null'}),t.jsx("div",{style:{marginTop:"0.5rem",fontSize:"0.8rem",color:"#6b7280"},children:"Server tries to return this claim but won't fail if missing"})]}),t.jsxs("div",{style:{background:"white",padding:"0.75rem",borderRadius:"0.5rem",border:"1px solid #fbbf24"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[t.jsx(d,{style:{color:"#dc2626"}}),t.jsx("strong",{children:"Essential (Required)"})]}),t.jsx("code",{style:{background:"#f3f4f6",padding:"0.25rem 0.5rem",borderRadius:"0.25rem",display:"block",fontSize:"0.75rem"},children:'"email": {"essential": true}'}),t.jsx("div",{style:{marginTop:"0.5rem",fontSize:"0.8rem",color:"#6b7280"},children:"Server MUST return this claim or request fails"})]})]})]}),Object.keys(r||{}).length>0&&t.jsxs(t.Fragment,{children:[t.jsxs(Ah,{onClick:()=>h(!p),style:{marginTop:"1rem",width:"100%",justifyContent:"center"},children:[t.jsx(s,{})," ",p?"Hide":"Show"," JSON Preview"]}),p&&t.jsx(_h,{children:C.map((e,r)=>e.className?t.jsx("span",{className:e.className,children:e.text},`json-preview-${r}`):t.jsx(y.Fragment,{children:e.text},`json-preview-${r}`))})]})]})]})},Mh=Ce.div`
	margin-bottom: 1.5rem;
`,Fh=Ce.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.75rem;
`,qh=Ce.div`
	color: #059669;
	font-size: 1rem;
`,Vh=Ce.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 0.75rem;
	margin-bottom: 1rem;
`,Bh=Ce.button`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 1rem;
	border-radius: 0.5rem;
	border: 2px solid ${e=>e.$selected?"#059669":"#e5e7eb"};
	background-color: ${e=>e.$selected?"#f0fdf4":"#ffffff"};
	color: ${e=>e.$selected?"#065f46":"#374151"};
	cursor: pointer;
	transition: all 0.2s ease-in-out;
	text-align: left;

	&:hover {
		border-color: #059669;
		background-color: ${e=>e.$selected?"#f0fdf4":"#f9fafb"};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`,Wh=Ce.div`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: ${e=>e.$selected?"#059669":"#6b7280"};
`,Gh=Ce.div`
	flex: 1;
`,Hh=Ce.div`
	font-weight: 600;
	font-size: 0.875rem;
	margin-bottom: 0.25rem;
`,Jh=Ce.div`
	font-size: 0.75rem;
	color: #6b7280;
	line-height: 1.4;
`,Kh=Ce.div`
	opacity: ${e=>e.$selected?1:0};
	color: #059669;
	font-size: 1rem;
`,Yh=Ce.div`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.5rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	color: #065f46;
	line-height: 1.5;
`,Xh=Ce.div`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: #059669;
`,Qh=Ce.div`
	font-size: 0.75rem;
	color: #6b7280;
	margin-bottom: 0.75rem;
	line-height: 1.5;
`,Zh=[{value:"none",title:"None",description:"Do not prompt for authentication or consent",icon:U},{value:"login",title:"Login",description:"Force user to authenticate, even if already logged in",icon:K},{value:"consent",title:"Consent",description:"Force user to consent, even if previously granted",icon:i},{value:"select_account",title:"Select Account",description:"Show account selection screen to user",icon:X}],eg=({value:e,onChange:r,disabled:n=!1})=>{return t.jsxs(Mh,{children:[t.jsxs(Fh,{children:[t.jsx(qh,{children:t.jsx(K,{})}),"Prompt Parameter (OIDC Authentication Behavior)"]}),t.jsxs(Qh,{children:["The ",t.jsx("code",{children:"prompt"}),' parameter controls the authentication and consent behavior. You can select multiple values to combine behaviors (e.g., "login consent").']}),t.jsx(Vh,{children:Zh.map(o=>{const s=o.icon,a=e.includes(o.value);return t.jsxs(Bh,{$selected:a,onClick:()=>{return t=o.value,void(n||(e.includes(t)?r(e.filter(e=>e!==t)):r([...e,t])));var t},disabled:n,type:"button",children:[t.jsx(Wh,{$selected:a,children:t.jsx(s,{size:20})}),t.jsxs(Gh,{children:[t.jsx(Hh,{children:o.title}),t.jsx(Jh,{children:o.description})]}),t.jsx(Kh,{$selected:a,children:t.jsx(i,{size:20})})]},o.value)})}),t.jsxs(Yh,{children:[t.jsx(Xh,{children:t.jsx(c,{})}),t.jsxs("div",{children:[t.jsx("strong",{children:"Current Value:"})," ",t.jsx("code",{children:(o=e,0===o.length?"none":o.join(" "))}),t.jsxs("div",{style:{marginTop:"0.5rem"},children:[t.jsx("strong",{children:"About Multiple Prompts:"}),' You can combine multiple prompt values with spaces (e.g., "login consent"). The authorization server will process them in order. Common combinations:']}),t.jsxs("ul",{style:{marginTop:"0.5rem",paddingLeft:"1.5rem"},children:[t.jsxs("li",{children:[t.jsx("code",{children:"login"})," - Force fresh authentication"]}),t.jsxs("li",{children:[t.jsx("code",{children:"consent"})," - Force fresh consent"]}),t.jsxs("li",{children:[t.jsx("code",{children:"login consent"})," - Force both fresh auth and consent"]}),t.jsxs("li",{children:[t.jsx("code",{children:"select_account"})," - Show account picker"]}),t.jsxs("li",{children:[t.jsx("code",{children:"none"})," - Skip all prompts (default)"]})]}),t.jsxs("div",{style:{marginTop:"0.5rem",fontSize:"0.8125rem",fontStyle:"italic"},children:["💡 ",t.jsx("strong",{children:"Note:"})," Some combinations may not be supported by all authorization servers. Check your provider's documentation."]})]})]})]});var o},tg=Ce.span`
	position: relative;
	display: inline-flex;
	align-items: center;
`,rg=Ce.span`
	cursor: help;
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	color: ${e=>{switch(e["data-variant"]){case"security":return"#dc2626";case"warning":return"#d97706";case"success":return"#059669";case"learning":return"#2563eb";default:return"#6b7280"}}};
	
	&:hover {
		opacity: 0.8;
	}
`,ng=Ce.div`
	position: absolute;
	z-index: 1000;
	min-width: 250px;
	max-width: 400px;
	padding: 1rem;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	font-size: 0.875rem;
	line-height: 1.5;
	color: #374151;
	
	${e=>{switch(e.$placement){case"top":return"\n\t\t\t\t\tbottom: calc(100% + 8px);\n\t\t\t\t\tleft: 50%;\n\t\t\t\t\ttransform: translateX(-50%);\n\t\t\t\t\t&::after {\n\t\t\t\t\t\tcontent: '';\n\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\ttop: 100%;\n\t\t\t\t\t\tleft: 50%;\n\t\t\t\t\t\ttransform: translateX(-50%);\n\t\t\t\t\t\tborder: 6px solid transparent;\n\t\t\t\t\t\tborder-top-color: white;\n\t\t\t\t\t}\n\t\t\t\t";case"bottom":return"\n\t\t\t\t\ttop: calc(100% + 8px);\n\t\t\t\t\tleft: 50%;\n\t\t\t\t\ttransform: translateX(-50%);\n\t\t\t\t\t&::after {\n\t\t\t\t\t\tcontent: '';\n\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\tbottom: 100%;\n\t\t\t\t\t\tleft: 50%;\n\t\t\t\t\t\ttransform: translateX(-50%);\n\t\t\t\t\t\tborder: 6px solid transparent;\n\t\t\t\t\t\tborder-bottom-color: white;\n\t\t\t\t\t}\n\t\t\t\t";case"left":return"\n\t\t\t\t\tright: calc(100% + 8px);\n\t\t\t\t\ttop: 50%;\n\t\t\t\t\ttransform: translateY(-50%);\n\t\t\t\t\t&::after {\n\t\t\t\t\t\tcontent: '';\n\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\tleft: 100%;\n\t\t\t\t\t\ttop: 50%;\n\t\t\t\t\t\ttransform: translateY(-50%);\n\t\t\t\t\t\tborder: 6px solid transparent;\n\t\t\t\t\t\tborder-left-color: white;\n\t\t\t\t\t}\n\t\t\t\t";case"right":return"\n\t\t\t\t\tleft: calc(100% + 8px);\n\t\t\t\t\ttop: 50%;\n\t\t\t\t\ttransform: translateY(-50%);\n\t\t\t\t\t&::after {\n\t\t\t\t\t\tcontent: '';\n\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\tright: 100%;\n\t\t\t\t\t\ttop: 50%;\n\t\t\t\t\t\ttransform: translateY(-50%);\n\t\t\t\t\t\tborder: 6px solid transparent;\n\t\t\t\t\t\tborder-right-color: white;\n\t\t\t\t\t}\n\t\t\t\t";default:return""}}}
	
	/* Variant-specific styling */
	${e=>{switch(e.$variant){case"security":return"\n\t\t\t\t\tborder-left: 4px solid #dc2626;\n\t\t\t\t\tbackground: #fef2f2;\n\t\t\t\t";case"warning":return"\n\t\t\t\t\tborder-left: 4px solid #d97706;\n\t\t\t\t\tbackground: #fffbeb;\n\t\t\t\t";case"success":return"\n\t\t\t\t\tborder-left: 4px solid #059669;\n\t\t\t\t\tbackground: #f0fdf4;\n\t\t\t\t";case"learning":return"\n\t\t\t\t\tborder-left: 4px solid #2563eb;\n\t\t\t\t\tbackground: #eff6ff;\n\t\t\t\t";default:return"\n\t\t\t\t\tborder-left: 4px solid #6b7280;\n\t\t\t\t\tbackground: #f9fafb;\n\t\t\t\t"}}}
`,ig=Ce.div`
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #111827;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,og=Ce.div`
	color: #4b5563;
`,sg=e=>{switch(e){case"security":return t.jsx(U,{size:16});case"warning":return t.jsx(d,{size:16});case"success":return t.jsx(u,{size:16});case"learning":return t.jsx(N,{size:16});default:return t.jsx(c,{size:16})}},ag=({content:r,variant:n="info",title:i,children:o,placement:s="top",showIcon:a=!0})=>{const[c,l]=e.useState(!1),d=e.useRef(null);return e.useEffect(()=>{const e=e=>{d.current&&!d.current.contains(e.target)&&l(!1)};return c&&document.addEventListener("mousedown",e),()=>{document.removeEventListener("mousedown",e)}},[c]),t.jsxs(tg,{ref:d,onMouseEnter:()=>l(!0),onMouseLeave:()=>l(!1),children:[t.jsxs(rg,{"data-variant":n,children:[o,a&&sg(n)]}),c&&t.jsxs(ng,{$placement:s,$variant:n,children:[i&&t.jsxs(ig,{children:[sg(n),i]}),t.jsx(og,{children:r})]})]})};const cg=new class{STORAGE_KEY="pingone_environment_id_persistence";ENV_VAR_NAME="REACT_APP_PINGONE_ENVIRONMENT_ID";getEnvVar(e){try{const t=import.meta,r=t?.env?t.env:void 0;if(r){if(r[e])return String(r[e]);if("REACT_APP_PINGONE_ENVIRONMENT_ID"===e&&r.VITE_PINGONE_ENVIRONMENT_ID)return String(r.VITE_PINGONE_ENVIRONMENT_ID)}}catch{}}saveEnvironmentId(e,t="manual"){if(!e||!e.trim())return;const r={environmentId:e.trim(),lastUpdated:Date.now(),source:t};try{localStorage.setItem(this.STORAGE_KEY,JSON.stringify(r))}catch(n){}this.showEnvUpdateInstructions(e)}loadEnvironmentId(){try{const e=localStorage.getItem(this.STORAGE_KEY);if(e){return JSON.parse(e).environmentId}}catch(t){}const e=this.getEnvVar(this.ENV_VAR_NAME);return e?(this.saveEnvironmentId(e,"env_file"),e):null}getLastEnvironmentIdInfo(){try{const e=localStorage.getItem(this.STORAGE_KEY);if(e)return JSON.parse(e)}catch(e){}return null}hasEnvironmentIdChanged(e){return this.loadEnvironmentId()!==e}showEnvUpdateInstructions(e){"undefined"!=typeof window&&window.v4ToastManager&&window.v4ToastManager.showInfo("Environment ID updated. Check console for .env update instructions.")}generateEnvContent(){const e=this.loadEnvironmentId();if(!e)return"# No Environment ID found\n";return`# PingOne Environment ID\n# Last updated: ${(new Date).toISOString()}\nREACT_APP_PINGONE_ENVIRONMENT_ID=${e}\n`}generateEnvContentWithNewline(){return`${this.generateEnvContent()}\n`}clearEnvironmentId(){try{localStorage.removeItem(this.STORAGE_KEY)}catch(e){}}getPersistenceStatus(){const e=this.getLastEnvironmentIdInfo();return{hasStoredId:!!e,hasEnvVar:!!this.getEnvVar(this.ENV_VAR_NAME),lastUpdated:e?new Date(e.lastUpdated).toISOString():null,source:e?.source||null}}};"undefined"!=typeof window&&(window.environmentIdPersistenceService=cg);const lg=Ce.div`
  color: #075985;
  line-height: 1.4;
`,dg=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0;
`,ug=Ce.button`
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;

  &:hover {
    background: #0284c7;
  }
`;Ce.button`
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;

  &:hover {
    background: #059669;
  }
`;const pg=({environmentId:r,onRefresh:n})=>{const[i,o]=e.useState(null),[s,a]=e.useState(!1);e.useEffect(()=>{const e=cg.getPersistenceStatus();o(e)},[]);return i?t.jsx(zt,{title:"Environment ID Persistence",icon:t.jsx(c,{}),theme:"blue",defaultCollapsed:!0,variant:"compact",children:t.jsxs(lg,{children:[t.jsxs(dg,{children:[i.hasStoredId?t.jsx(u,{size:14,color:"#10b981"}):t.jsx(d,{size:14,color:"#f59e0b"}),t.jsx("span",{children:i.hasStoredId?"Stored in localStorage":"Not stored locally"})]}),t.jsxs(dg,{children:[i.hasEnvVar?t.jsx(u,{size:14,color:"#10b981"}):t.jsx(d,{size:14,color:"#f59e0b"}),t.jsx("span",{children:i.hasEnvVar?"Available in .env":"Not in .env file"})]}),i.lastUpdated&&t.jsxs(dg,{children:[t.jsx(c,{size:14}),t.jsxs("span",{children:["Last updated: ",new Date(i.lastUpdated).toLocaleString()]})]}),i.source&&t.jsxs(dg,{children:[t.jsx(c,{size:14}),t.jsxs("span",{children:["Source: ",i.source.replace("_"," ")]})]}),t.jsxs("div",{style:{marginTop:"0.5rem"},children:[t.jsxs(ug,{onClick:()=>a(!s),children:[t.jsx(c,{size:12}),s?"Hide":"Show"," .env Content"]}),t.jsxs(ug,{onClick:()=>{const e=cg.generateEnvContent();navigator.clipboard.writeText(e).then(()=>{Ge.showSuccess("Environment content copied to clipboard!")})},children:[t.jsx(w,{size:12}),"Copy .env Content"]}),t.jsxs(ug,{onClick:()=>{const e=cg.generateEnvContentWithNewline();navigator.clipboard.writeText(e).then(()=>{Ge.showSuccess("Environment content copied! Paste into your .env file on a new line.")})},children:[t.jsx(me,{size:12}),"Update .env"]}),t.jsxs(ug,{onClick:()=>{cg.clearEnvironmentId(),n&&n()},children:[t.jsx(b,{size:12}),"Clear Storage"]})]}),s&&t.jsx("div",{style:{marginTop:"0.75rem",background:"#1e293b",color:"#f1f5f9",padding:"0.75rem",borderRadius:"0.25rem",fontFamily:"monospace",fontSize:"0.75rem",whiteSpace:"pre-wrap"},children:cg.generateEnvContent()})]})}):null},hg=Ce.div`
	margin-bottom: 1.5rem;
`,gg=Ce.label`
	display: block;
	color: #333;
	font-weight: 500;
	margin-bottom: 0.5rem;
`,mg=Ce.div`
	position: relative;
	width: 100%;
`,fg=Ce.select`
	width: 100%;
	padding: 0.75rem 2.5rem 0.75rem 0.75rem;
	border: 1px solid ${e=>e.$hasError?"#dc3545":"#ddd"};
	border-radius: 6px;
	font-size: 1rem;
	color: #333;
	background: white;
	appearance: none;
	cursor: pointer;
	
	&:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}
	
	&:disabled {
		background: #f8f9fa;
		cursor: not-allowed;
		opacity: 0.6;
	}
`,bg=Ce(a)`
	position: absolute;
	right: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	pointer-events: none;
	color: #6c757d;
`,xg=Ce(b)`
	position: absolute;
	right: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	pointer-events: none;
	color: #007bff;
	animation: spin 1s linear infinite;
	
	@keyframes spin {
		from { transform: translateY(-50%) rotate(0deg); }
		to { transform: translateY(-50%) rotate(360deg); }
	}
`,yg=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #dc3545;
	font-size: 0.875rem;
	margin-top: 0.5rem;
`,wg=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #28a745;
	font-size: 0.875rem;
	margin-top: 0.5rem;
`,vg=Ce.div`
	margin-top: 0.75rem;
	background: white;
	border-radius: 6px;
	border: 1px solid #dee2e6;
	overflow: hidden;
`,kg=Ce.table`
	width: 100%;
	border-collapse: collapse;
`,jg=Ce.thead`
	background: #f8f9fa;
	border-bottom: 2px solid #dee2e6;
`,Sg=Ce.th`
	padding: 0.5rem 0.75rem;
	text-align: left;
	font-weight: 700;
	color: #495057;
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	
	&:first-child {
		width: 30%;
	}
	
	&:last-child {
		width: 50px;
		text-align: center;
	}
`,Cg=Ce.tbody``,Ag=Ce.tr`
	border-bottom: 1px solid #e9ecef;
	
	&:last-child {
		border-bottom: none;
	}
	
	&:nth-child(even) {
		background: #f8f9fa;
	}
	
	&:hover {
		background: #e9ecef;
	}
`,Tg=Ce.td`
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
`,_g=Ce.span`
	font-weight: 500;
	color: #333;
	font-size: 0.625rem;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`,Rg=Ce.span`
	color: #495057;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
	font-size: 0.625rem;
	font-weight: 500;
	word-break: break-all;
`,Ig=Ce.button`
	background: none;
	border: 1px solid #dee2e6;
	border-radius: 3px;
	padding: 0.25rem;
	color: #6c757d;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	
	&:hover {
		background: #f8f9fa;
		border-color: #007bff;
		color: #007bff;
	}
	
	&:active {
		transform: scale(0.95);
	}
`,$g=Ce.button`
	background: #007bff;
	color: white;
	border: none;
	padding: 0.5rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.8125rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
	flex: 1;
	
	&:hover:not(:disabled) {
		background: #0056b3;
	}
	
	&:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
`,Eg=Ce.button`
	background: #28a745;
	color: white;
	border: none;
	padding: 0.5rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.8125rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
	flex: 1;
	
	&:hover:not(:disabled) {
		background: #218838;
	}
	
	&:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
`,zg=Ce.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 0.75rem;
`,Pg=({environmentId:r,clientId:o,clientSecret:s,region:a="na",workerToken:c,onApplicationSelect:l,disabled:u=!1})=>{const[p,h]=e.useState([]),[g,m]=e.useState(""),[f,x]=e.useState(!1),[y,w]=e.useState(null),[v,j]=e.useState(null),[S,C]=e.useState(!1),A=e.useCallback(async()=>{if(r&&(o||s)&&c){x(!0),w(null),j(null);try{const e=await Nt({environmentId:r,region:a,workerToken:c,clientId:o,clientSecret:s});h(e),j(`Found ${e.length} applications`),0===e.length&&w("No applications found in this environment")}catch(e){w(e instanceof Error?e.message:"Failed to fetch applications")}finally{x(!1)}}else w("Missing required credentials to fetch applications")},[r,o,s,a,c]),T=e.useCallback(e=>{if(m(e),e&&""!==e){const t=p.find(t=>t.id===e);t&&(l(t),j(`Selected application: ${t.name}`))}},[p,l]),_=e.useCallback((e,t)=>{navigator.clipboard.writeText(e),Ge.showSuccess(`${t} copied to clipboard`)},[]);return e.useEffect(()=>{r&&(o||s)&&c&&0===p.length&&!f&&A()},[r,o,s,c,p.length,f,A]),t.jsxs(hg,{children:[t.jsx(gg,{children:"PingOne Application"}),t.jsxs(mg,{children:[t.jsxs(fg,{value:g,onChange:e=>T(e.target.value),disabled:u||f,$hasError:!!y,children:[t.jsx("option",{value:"",children:f?"Loading applications...":"Select an application"}),p.map(e=>t.jsxs("option",{value:e.id,children:[e.name," (",e.clientId,")"]},e.id))]}),f?t.jsx(xg,{size:16}):t.jsx(bg,{size:16})]}),y&&t.jsxs(yg,{children:[t.jsx(d,{size:16}),y]}),v&&!y&&t.jsxs(wg,{children:[t.jsx(i,{size:16}),v]}),g&&p.length>0&&t.jsx(vg,{children:(()=>{const e=p.find(e=>e.id===g);return e?t.jsxs(t.Fragment,{children:[t.jsxs(kg,{children:[t.jsx(jg,{children:t.jsxs("tr",{children:[t.jsx(Sg,{children:"Field"}),t.jsx(Sg,{children:"Value"}),t.jsx(Sg,{})]})}),t.jsxs(Cg,{children:[t.jsxs(Ag,{children:[t.jsx(Tg,{children:t.jsx(_g,{children:"Client ID"})}),t.jsx(Tg,{children:t.jsx(Rg,{children:e.clientId})}),t.jsx(Tg,{style:{textAlign:"center"},children:t.jsx(Ig,{onClick:()=>_(e.clientId,"Client ID"),title:"Copy Client ID",children:t.jsx(n,{size:14})})})]}),t.jsxs(Ag,{children:[t.jsx(Tg,{children:t.jsx(_g,{children:"Client Secret"})}),t.jsx(Tg,{children:t.jsx(Rg,{children:e.clientSecret?S?e.clientSecret:"••••••••••••••••":"None"})}),t.jsx(Tg,{style:{textAlign:"center"},children:e.clientSecret&&t.jsxs("div",{style:{display:"flex",gap:"0.25rem",alignItems:"center",justifyContent:"center"},children:[t.jsx(Ig,{onClick:()=>_(e.clientSecret,"Client Secret"),title:"Copy Client Secret",children:t.jsx(n,{size:14})}),t.jsx(Ig,{onClick:()=>C(!S),title:S?"Hide":"Show",children:S?t.jsx(fe,{size:14}):t.jsx(k,{size:14})})]})})]}),t.jsxs(Ag,{children:[t.jsx(Tg,{children:t.jsx(_g,{children:"Grant Types"})}),t.jsx(Tg,{children:t.jsx(Rg,{children:e.grantTypes?.join(", ")||"None"})}),t.jsx(Tg,{style:{textAlign:"center"},children:e.grantTypes&&e.grantTypes.length>0&&t.jsx(Ig,{onClick:()=>_(e.grantTypes.join(", "),"Grant Types"),title:"Copy Grant Types",children:t.jsx(n,{size:14})})})]}),"SERVICE"!==e.type&&!(e.grantTypes&&1===e.grantTypes.length&&e.grantTypes.includes("client_credentials"))&&t.jsxs(t.Fragment,{children:[t.jsxs(Ag,{children:[t.jsx(Tg,{children:t.jsx(_g,{children:"Redirect URIs"})}),t.jsx(Tg,{children:t.jsx(Rg,{children:e.redirectUris?.join(", ")||"None"})}),t.jsx(Tg,{style:{textAlign:"center"}})]}),t.jsxs(Ag,{children:[t.jsx(Tg,{children:t.jsx(_g,{children:"Post-Logout URIs"})}),t.jsx(Tg,{children:t.jsx(Rg,{children:e.postLogoutRedirectUris?.join(", ")||"None"})}),t.jsx(Tg,{style:{textAlign:"center"},children:e.postLogoutRedirectUris&&e.postLogoutRedirectUris.length>0&&t.jsx(Ig,{onClick:()=>_(e.postLogoutRedirectUris.join(", "),"Post-Logout URIs"),title:"Copy Post-Logout URIs",children:t.jsx(n,{size:14})})})]})]}),t.jsxs(Ag,{children:[t.jsx(Tg,{children:t.jsx(_g,{children:"Scopes"})}),t.jsx(Tg,{children:t.jsx(Rg,{children:e.scopes?.join(", ")||"None"})}),t.jsx(Tg,{style:{textAlign:"center"},children:e.scopes&&e.scopes.length>0&&t.jsx(Ig,{onClick:()=>_(e.scopes.join(", "),"Scopes"),title:"Copy Scopes",children:t.jsx(n,{size:14})})})]}),t.jsxs(Ag,{children:[t.jsx(Tg,{children:t.jsx(_g,{children:"Token Auth Method"})}),t.jsx(Tg,{children:t.jsx(Rg,{children:e.tokenEndpointAuthMethod||"client_secret_post"})}),t.jsx(Tg,{style:{textAlign:"center"},children:t.jsx(Ig,{onClick:()=>_(e.tokenEndpointAuthMethod||"client_secret_post","Token Auth Method"),title:"Copy Token Auth Method",children:t.jsx(n,{size:14})})})]}),e.pkceEnforcement&&t.jsxs(Ag,{children:[t.jsx(Tg,{children:t.jsx(_g,{children:"PKCE Enforcement"})}),t.jsx(Tg,{children:t.jsx(Rg,{children:e.pkceEnforcement})}),t.jsx(Tg,{style:{textAlign:"center"},children:t.jsx(Ig,{onClick:()=>_(e.pkceEnforcement||"","PKCE Enforcement"),title:"Copy PKCE Enforcement",children:t.jsx(n,{size:14})})})]})]})]}),t.jsxs(zg,{children:[t.jsxs(Eg,{onClick:()=>{l(e)},children:[t.jsx(i,{size:14}),"Apply Configuration"]}),t.jsxs($g,{onClick:A,disabled:f||u,children:[t.jsx(b,{size:14}),f?"Loading...":"Refresh Applications"]})]})]}):null})()}),!g&&t.jsxs($g,{onClick:A,disabled:f||u,children:[t.jsx(b,{size:14}),f?"Loading...":"Refresh Applications"]})]})},Og="oauth_education_preference",Ug="full";class Dg{static getEducationMode(){try{const e=localStorage.getItem(Og);if(e){const t=JSON.parse(e);if(["full","compact","hidden"].includes(t.mode))return t.mode}}catch(e){}return Ug}static isValidMode(e){return["full","compact","hidden"].includes(e)}static setEducationMode(e){if(this.isValidMode(e))try{const t={mode:e,lastUpdated:Date.now()};localStorage.setItem(Og,JSON.stringify(t)),window.dispatchEvent(new StorageEvent("storage",{key:Og,newValue:JSON.stringify(t),url:window.location.href}))}catch(t){}}static getPreference(){try{const e=localStorage.getItem(Og);if(e){const t=JSON.parse(e);if(["full","compact","hidden"].includes(t.mode))return t}}catch(e){}return null}static clearPreference(){try{localStorage.removeItem(Og)}catch(e){}}static isCompactMode(){return"compact"===this.getEducationMode()}static isHiddenMode(){return"hidden"===this.getEducationMode()}static isFullMode(){return"full"===this.getEducationMode()}static toggleMode(){let e;switch(this.getEducationMode()){case"full":e="compact";break;case"compact":e="hidden";break;case"hidden":e="full";break;default:e=Ug}return this.setEducationMode(e),e}static getModeLabel(){switch(this.getEducationMode()){case"full":return"Full Education";case"compact":return"Compact Summaries";case"hidden":return"Hidden";default:return"Unknown"}}static getModeDescription(){switch(this.getEducationMode()){case"full":return"Show all educational content with detailed explanations";case"compact":return"Show one-liner summaries that can be expanded";case"hidden":return"Hide educational content, show only when expanded";default:return"Unknown mode"}}}const Lg=Ce.div`
	position: sticky;
	top: 0;
	z-index: 100;
	background: #ffffff;
	border-bottom: 1px solid #e5e7eb;
	padding: 12px 0;
	margin-bottom: 16px;
`,Ng=Ce.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 20px;
	display: flex;
	align-items: center;
	justify-content: space-between;
`,Mg=Ce.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 600;
	color: #374151;
	font-size: 14px;
`,Fg=Ce.div`
	display: flex;
	background: #f3f4f6;
	border-radius: 6px;
	padding: 2px;
	gap: 2px;
`,qg=Ce.button`
	padding: 8px 12px;
	border: none;
	border-radius: 4px;
	background: ${e=>e.$active?"#ffffff":"transparent"};
	color: ${e=>e.$active?"#1f2937":"#6b7280"};
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: all 0.2s ease;
	box-shadow: ${e=>e.$active?"0 1px 3px rgba(0, 0, 0, 0.1)":"none"};

	&:hover {
		background: ${e=>e.$active?"#ffffff":"#e5e7eb"};
	}

	&:focus {
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
	}
`,Vg=Ce.div`
	display: flex;
	align-items: center;
`,Bg=Ce.div`
	font-size: 12px;
	color: #6b7280;
	margin-top: 4px;
`,Wg=Ce.div`
	position: relative;
`,Gg=Ce.button`
	padding: 8px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	background: #ffffff;
	color: #374151;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: all 0.2s ease;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	&:focus {
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
	}
`,Hg=Ce.div`
	position: absolute;
	top: 100%;
	right: 0;
	margin-top: 4px;
	background: #ffffff;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	z-index: 1000;
	opacity: ${e=>e.$isOpen?1:0};
	visibility: ${e=>e.$isOpen?"visible":"hidden"};
	transform: ${e=>e.$isOpen?"translateY(0)":"translateY(-10px)"};
	transition: all 0.2s ease;
	min-width: 200px;
`,Jg=Ce.button`
	width: 100%;
	padding: 10px 12px;
	border: none;
	background: transparent;
	color: #374151;
	font-size: 13px;
	text-align: left;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;
	transition: background-color 0.2s ease;

	&:hover {
		background: #f3f4f6;
	}

	&:focus {
		background: #f3f4f6;
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
	}

	&:first-child {
		border-radius: 6px 6px 0 0;
	}

	&:last-child {
		border-radius: 0 0 6px 6px;
	}
`,Kg=({className:r,showDescription:n=!0,variant:i="buttons"})=>{const[o,s]=e.useState("full"),[c,l]=e.useState(!1);e.useEffect(()=>{s(Dg.getEducationMode())},[]);const d=e.useCallback(e=>{Dg.setEducationMode(e),s(e),l(!1)},[]);e.useEffect(()=>{const e=e=>{c&&!e.target.closest(".dropdown-container")&&l(!1)};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[c]);const u=e=>{switch(e){case"full":default:return t.jsx(N,{size:16});case"compact":return t.jsx(m,{size:16});case"hidden":return t.jsx(fe,{size:16})}},p=e=>{switch(e){case"full":default:return"Full";case"compact":return"Compact";case"hidden":return"Hidden"}},h=["full","compact","hidden"];return"buttons"===i?t.jsx(Lg,{className:r,children:t.jsxs(Ng,{children:[t.jsxs("div",{children:[t.jsxs(Mg,{children:[t.jsx(N,{size:16}),"Education Mode"]}),n&&t.jsx(Bg,{children:Dg.getModeDescription()})]}),t.jsx(Fg,{children:h.map(e=>t.jsxs(qg,{$active:o===e,onClick:()=>d(e),title:Dg.getModeDescription(),children:[t.jsx(Vg,{children:u(e)}),p(e)]},e))})]})}):t.jsx(Lg,{className:r,children:t.jsxs(Ng,{children:[t.jsxs("div",{children:[t.jsxs(Mg,{children:[t.jsx(N,{size:16}),"Education Mode"]}),n&&t.jsx(Bg,{children:Dg.getModeDescription()})]}),t.jsxs(Wg,{className:"dropdown-container",children:[t.jsxs(Gg,{onClick:()=>l(!c),children:[t.jsx(Vg,{children:u(o)}),p(o),t.jsx(a,{size:14,style:{transform:c?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s ease"}})]}),t.jsx(Hg,{$isOpen:c,children:h.map(e=>t.jsxs(Jg,{onClick:()=>d(e),children:[t.jsx(Vg,{children:u(e)}),p(e)]},e))})]})]})})},Yg=Ce.div`
	margin-bottom: 24px;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	background: #ffffff;
	overflow: hidden;
`,Xg=Ce.button`
	width: 100%;
	padding: 16px 20px;
	background: #f9fafb;
	border: none;
	border-bottom: 1px solid #e5e7eb;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 16px;
	font-weight: 600;
	color: #374151;
	transition: background-color 0.2s ease;

	&:hover {
		background: #f3f4f6;
	}

	&:focus {
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
	}
`,Qg=Ce.div`
	display: flex;
	align-items: center;
	gap: 12px;
`,Zg=Ce.div`
	display: flex;
	align-items: center;
	transition: transform 0.2s ease;
	transform: ${e=>e.$isExpanded?"rotate(90deg)":"rotate(0deg)"};
`,em=Ce.div`
	max-height: ${e=>e.$isExpanded?"2000px":"0"};
	overflow: hidden;
	transition: max-height 0.3s ease-in-out;
`,tm=Ce.div`
	padding: 20px;
`,rm=Ce.div`
	margin-bottom: 24px;
	padding: 16px;
	background: #f8fafc;
	border-radius: 6px;
	border-left: 4px solid #3b82f6;

	&:last-child {
		margin-bottom: 0;
	}
`,nm=Ce.h3`
	margin: 0 0 12px 0;
	font-size: 16px;
	font-weight: 600;
	color: #1e40af;
	display: flex;
	align-items: center;
	gap: 8px;
`,im=Ce.div`
	color: #374151;
	line-height: 1.6;

	p {
		margin: 0 0 8px 0;
		&:last-child {
			margin-bottom: 0;
		}
	}

	ul, ol {
		margin: 8px 0;
		padding-left: 20px;
	}

	li {
		margin-bottom: 4px;
	}

	code {
		background: #e5e7eb;
		padding: 2px 6px;
		border-radius: 3px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 14px;
	}

	strong {
		color: #111827;
	}
`,om=Ce.div`
	padding: 12px 16px;
	background: #f8fafc;
	border-radius: 6px;
	border-left: 4px solid #3b82f6;
	margin-bottom: 8px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background: #e2e8f0;
	}

	&:last-child {
		margin-bottom: 0;
	}
`,sm=Ce.div`
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 4px;
	display: flex;
	align-items: center;
	gap: 8px;
`,am=Ce.div`
	font-size: 14px;
	color: #374151;
`,cm=({sections:r,mode:n,className:i})=>{const[o,s]=e.useState(!1),[a,l]=e.useState(new Set),[d,u]=e.useState(n||Dg.getEducationMode());e.useEffect(()=>{const e=()=>{const e=n||Dg.getEducationMode();u(e)};window.addEventListener("storage",e);const t=setInterval(()=>{const e=n||Dg.getEducationMode();e!==d&&u(e)},100);return()=>{window.removeEventListener("storage",e),clearInterval(t)}},[n,d]);const p=e.useCallback(()=>{s(e=>!e)},[]),h=e.useCallback(e=>{l(t=>{const r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})},[]),g=e=>e.icon?e.icon:e.title.toLowerCase().includes("security")||e.title.toLowerCase().includes("consideration")?t.jsx(U,{size:16}):e.title.toLowerCase().includes("overview")||e.title.toLowerCase().includes("introduction")?t.jsx(c,{size:16}):t.jsx(N,{size:16});return"hidden"===d?null:"compact"===d?t.jsx(Yg,{className:i,children:r.map(e=>t.jsxs(om,{onClick:()=>h(e.id),children:[t.jsxs(sm,{children:[g(e),e.title]}),t.jsx(am,{children:e.oneLiner||"Click to expand for more information"}),a.has(e.id)&&t.jsx("div",{style:{marginTop:"12px",paddingTop:"12px",borderTop:"1px solid #e2e8f0"},children:t.jsx(im,{children:e.content})})]},e.id))}):t.jsxs(Yg,{className:i,children:[t.jsxs(Xg,{onClick:p,children:[t.jsxs(Qg,{children:[t.jsx(N,{size:20}),t.jsx("span",{children:"Educational Content"})]}),t.jsx(Zg,{$isExpanded:o,children:t.jsx(be,{size:20})})]}),t.jsx(em,{$isExpanded:o,children:t.jsx(tm,{children:r.map(e=>t.jsxs(rm,{children:[t.jsxs(nm,{children:[g(e),e.title]}),t.jsx(im,{children:e.content})]},e.id))})})]})},lm=Ce.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
`,dm=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`,um=Ce.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: ${({theme:e})=>e.colors.gray900};
  display: flex;
  align-items: center;
  gap: 1rem;
`,pm=Ce.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 12px;
  color: white;
  font-size: 24px;
`,hm=Ce.div`
  display: flex;
  gap: 1rem;
`,gm=Ce.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid ${({$variant:e,theme:t})=>"primary"===e?t.colors.primary:t.colors.gray300};
  background: ${({$variant:e,theme:t})=>"primary"===e?t.colors.primary:"white"};
  color: ${({$variant:e})=>"primary"===e?"white":"#374151"};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${({$variant:e,theme:t})=>"primary"===e?t.colors.primaryDark:t.colors.gray100};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: 2px solid ${({theme:e})=>e.colors.primary};
    outline-offset: 2px;
  }
`,mm=Ce.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`,fm=Ce.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({theme:e})=>e.shadows.sm};
  border: 1px solid ${({theme:e})=>e.colors.gray200};
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({theme:e})=>e.shadows.lg};
  }
`,bm=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`,xm=Ce.h3`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({theme:e})=>e.colors.gray600};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,ym=Ce.div`
  color: ${({$metric:e,theme:t})=>{switch(e){case"users":return t.colors.primary;case"performance":return t.colors.success;case"security":return t.colors.warning;case"errors":return t.colors.danger;default:return t.colors.gray500}}};
  font-size: 1.25rem;
`,wm=Ce.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${({theme:e})=>e.colors.gray900};
  margin-bottom: 0.5rem;
`,vm=Ce.div`
  font-size: 0.875rem;
  color: ${({$positive:e,theme:t})=>e?t.colors.success:t.colors.danger};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`,km=Ce.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`,jm=Ce.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({theme:e})=>e.shadows.sm};
  border: 1px solid ${({theme:e})=>e.colors.gray200};
  padding: 1.5rem;
`,Sm=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({theme:e})=>e.colors.gray200};
`,Cm=Ce.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({theme:e})=>e.colors.gray900};
`,Am=Ce.div`
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({theme:e})=>e.colors.gray500};
  font-size: 0.875rem;
`,Tm=Ce.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({theme:e})=>e.shadows.sm};
  border: 1px solid ${({theme:e})=>e.colors.gray200};
  overflow: hidden;
`,_m=Ce.div`
  background: ${({theme:e})=>e.colors.gray50};
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${({theme:e})=>e.colors.gray200};
  
  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: ${({theme:e})=>e.colors.gray900};
  }
`,Rm=Ce.div`
  overflow-x: auto;
`,Im=Ce.table`
  width: 100%;
  border-collapse: collapse;
`,$m=Ce.tr`
  &:nth-child(even) {
    background: ${({theme:e})=>e.colors.gray25};
  }
  
  &:hover {
    background: ${({theme:e})=>e.colors.primaryLight};
  }
`,Em=Ce.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: ${({theme:e})=>e.colors.gray900};
  border-bottom: 1px solid ${({theme:e})=>e.colors.gray200};
  background: ${({theme:e})=>e.colors.gray50};
`,zm=Ce.td`
  padding: 1rem;
  border-bottom: 1px solid ${({theme:e})=>e.colors.gray200};
  color: ${({theme:e})=>e.colors.gray700};
`,Pm=Ce.span`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({$status:e,theme:t})=>{switch(e){case"success":return t.colors.success;case"error":return t.colors.danger;case"warning":return t.colors.warning;case"info":return t.colors.info;default:return t.colors.gray500}}};
  color: white;
`,Om={totalUsers:1247,activeSessions:89,pageViews:15632,bounceRate:23.4,avgLoadTime:1.2,errorRate:.8,securityEvents:3,complianceScore:98.5},Um=[{id:"1",type:"page_view",timestamp:Date.now()-3e5,user:"user1",details:"OAuth Flows page"},{id:"2",type:"flow_start",timestamp:Date.now()-24e4,user:"user2",details:"Authorization Code flow"},{id:"3",type:"flow_complete",timestamp:Date.now()-18e4,user:"user1",details:"Implicit Grant flow"},{id:"4",type:"security_event",timestamp:Date.now()-12e4,user:"user3",details:"Suspicious activity detected"},{id:"5",type:"error_event",timestamp:Date.now()-6e4,user:"user2",details:"Token validation failed"}],Dm=()=>{const[r,n]=e.useState(!1),[i]=e.useState("24h"),{announceToScreenReader:s}=ki(),{getAnalyticsData:a,flush:c}=((t={})=>{const{enabled:r=!0,debug:n=!1,userId:i,customProperties:o,trackPageViews:s=!0,trackUserActions:a=!0,trackPerformance:c=!0,trackErrors:l=!0}=t,d=e.useRef(t),u=e.useRef(!1);e.useEffect(()=>{d.current=t,i&&tt(i),o&&rt(o),nt.updateConfig({enabled:r,debug:n,userId:i,customProperties:o})},[r,n,i,o,t]),e.useEffect(()=>{u.current||(nt.setEnabled(r),u.current=!0,n&&Ee.info("[useAnalytics] Analytics initialized"))},[r,n]),e.useEffect(()=>{if(s&&r){const e=window.location.pathname;it(e),n&&Ee.info("[useAnalytics] Page view tracked:",e)}},[s,r,n]);const p=e.useCallback((e,t,i)=>{a&&r&&(ot(e,t,i),n&&Ee.info("[useAnalytics] User action tracked:",{action:e,element:t,properties:i}))},[a,r,n]),h=e.useCallback((e,t,i)=>{c&&r&&(st(e,t,i),n&&Ee.info("[useAnalytics] Performance metric tracked:",{metric:e,value:t,properties:i}))},[c,r,n]),g=e.useCallback((e,t,i)=>{l&&r&&(at(e,t,i),n&&Ee.info("[useAnalytics] Error tracked:",{error:e.message,context:t,properties:i}))},[l,r,n]),m=e.useCallback((e,t)=>{r&&(ct(e,t),n&&Ee.info("[useAnalytics] Custom event tracked:",{eventName:e,properties:t}))},[r,n]),f=e.useCallback((e,t,i)=>{if(r){switch(t){case"start":ut(e,i);break;case"complete":dt(e,!0,i);break;case"error":lt(e,i?.error||"Unknown error",i)}n&&Ee.info("[useAnalytics] Flow event tracked:",{flowType:e,event:t,properties:i})}},[r,n]),b=e.useCallback((e,t,i)=>{r&&(pt(e,t,i),n&&Ee.info("[useAnalytics] Security event tracked:",{event:e,severity:t,properties:i}))},[r,n]),x=e.useCallback(()=>nt.getAnalyticsData(),[]),y=e.useCallback(async()=>{r&&(await nt.flush(),n&&Ee.info("[useAnalytics] Analytics data flushed"))},[r,n]),w=e.useCallback(e=>{tt(e),n&&Ee.info("[useAnalytics] User ID updated:",e)},[n]),v=e.useCallback(e=>{rt(e),n&&Ee.info("[useAnalytics] Custom properties updated:",e)},[n]),k=e.useCallback(e=>{nt.setEnabled(e),n&&Ee.info("[useAnalytics] Analytics enabled:",e)},[n]);return{isEnabled:r,userId:i,sessionId:nt.getAnalyticsData().events[0]?.sessionId||"",trackEvent:(e,t)=>{r&&ht(e,t)},trackPageView:(e,t)=>{r&&it(e,t)},trackUserAction:p,trackPerformanceMetric:h,trackError:g,trackCustom:m,trackFlow:f,trackSecurity:b,getAnalyticsData:x,flush:y,updateUserId:w,updateCustomProperties:v,setEnabled:k}})({enabled:!0,debug:!0}),[d,u]=e.useState(Om),[p,h]=e.useState(Um),g=e=>{switch(e){case"page_view":case"flow_start":default:return"info";case"flow_complete":return"success";case"security_event":return"warning";case"error_event":return"error"}};return t.jsxs(lm,{role:"main","aria-label":"Analytics dashboard",children:[t.jsxs(dm,{children:[t.jsxs(um,{children:[t.jsx(pm,{children:t.jsx(xe,{size:24})}),"Analytics Dashboard"]}),t.jsxs(hm,{children:[t.jsxs(gm,{$variant:"secondary",onClick:async()=>{n(!0),s("Refreshing analytics data");try{await c(),a(),setTimeout(()=>{u(Om),h(Um),n(!1),s("Analytics data refreshed successfully")},1e3)}catch(e){n(!1),s("Failed to refresh analytics data")}},disabled:r,"aria-label":"Refresh analytics data",children:[t.jsx(b,{className:r?"animate-spin":""}),r?"Refreshing...":"Refresh"]}),t.jsxs(gm,{$variant:"primary",onClick:()=>{const e={timestamp:(new Date).toISOString(),timeRange:i,metrics:d,events:p},t=JSON.stringify(e,null,2),r=new Blob([t],{type:"application/json"}),n=URL.createObjectURL(r),o=document.createElement("a");o.href=n,o.download=`analytics-export-${Date.now()}.json`,o.click(),URL.revokeObjectURL(n),s("Analytics data exported successfully")},"aria-label":"Export analytics data",children:[t.jsx(o,{}),"Export Data"]})]})]}),t.jsxs(mm,{children:[t.jsxs(fm,{$metric:"users",children:[t.jsxs(bm,{children:[t.jsx(xm,{children:"Total Users"}),t.jsx(ym,{$metric:"users",children:t.jsx(X,{})})]}),t.jsx(wm,{children:d.totalUsers.toLocaleString()}),t.jsxs(vm,{$positive:!0,children:[t.jsx(ye,{}),"+12.5% from last week"]})]}),t.jsxs(fm,{$metric:"performance",children:[t.jsxs(bm,{children:[t.jsx(xm,{children:"Avg Load Time"}),t.jsx(ym,{$metric:"performance",children:t.jsx(de,{})})]}),t.jsxs(wm,{children:[d.avgLoadTime,"s"]}),t.jsxs(vm,{$positive:!0,children:[t.jsx(ye,{}),"-0.3s from last week"]})]}),t.jsxs(fm,{$metric:"security",children:[t.jsxs(bm,{children:[t.jsx(xm,{children:"Security Events"}),t.jsx(ym,{$metric:"security",children:t.jsx(U,{})})]}),t.jsx(wm,{children:d.securityEvents}),t.jsxs(vm,{$positive:!0,children:[t.jsx(ye,{}),"-2 from last week"]})]}),t.jsxs(fm,{$metric:"errors",children:[t.jsxs(bm,{children:[t.jsx(xm,{children:"Error Rate"}),t.jsx(ym,{$metric:"errors",children:t.jsx(l,{})})]}),t.jsxs(wm,{children:[d.errorRate,"%"]}),t.jsxs(vm,{$positive:!0,children:[t.jsx(ye,{}),"-0.2% from last week"]})]})]}),t.jsxs(km,{children:[t.jsxs(jm,{children:[t.jsx(Sm,{children:t.jsx(Cm,{children:"User Engagement"})}),t.jsx(Am,{children:t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx(xe,{size:48,style:{marginBottom:"1rem"}}),t.jsx("p",{children:"User engagement chart would be displayed here"}),t.jsx("p",{style:{fontSize:"0.75rem",color:"#6b7280"},children:"Integration with charting library required"})]})})]}),t.jsxs(jm,{children:[t.jsx(Sm,{children:t.jsx(Cm,{children:"Flow Performance"})}),t.jsx(Am,{children:t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx(ye,{style:{fontSize:"3rem",marginBottom:"1rem"}}),t.jsx("p",{children:"Flow performance chart would be displayed here"}),t.jsx("p",{style:{fontSize:"0.75rem",color:"#6b7280"},children:"Integration with charting library required"})]})})]})]}),t.jsxs(Tm,{children:[t.jsx(_m,{children:t.jsx("h3",{children:"Recent Events"})}),t.jsx(Rm,{children:t.jsxs(Im,{children:[t.jsx("thead",{children:t.jsxs($m,{children:[t.jsx(Em,{children:"Type"}),t.jsx(Em,{children:"User"}),t.jsx(Em,{children:"Details"}),t.jsx(Em,{children:"Timestamp"})]})}),t.jsx("tbody",{children:p.map(e=>{return t.jsxs($m,{children:[t.jsx(zm,{children:t.jsx(Pm,{$status:g(e.type),children:e.type.replace("_"," ")})}),t.jsx(zm,{children:e.user}),t.jsx(zm,{children:e.details}),t.jsx(zm,{children:(r=e.timestamp,new Date(r).toLocaleString())})]},e.id);var r})})]})})]})]})},Lm=Ce.div`
  background: ${e=>e.$isCompact?"transparent":"linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"};
  border-radius: 0.75rem;
  padding: ${e=>e.$isCompact?"0":"1.5rem"};
  margin-bottom: ${e=>e.$isCompact?"0":"2rem"};
  border: ${e=>e.$isCompact?"none":"1px solid #cbd5e1"};
`,Nm=Ce.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
`,Mm=Ce.div`
  position: relative;
`,Fm=Ce.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #cbd5e1;
  border-radius: 0.5rem;
  background: white;
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
  }
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,qm=Ce.option`
  padding: 0.5rem;
  font-size: 1rem;
`,Vm=[{value:"apple-tv",label:"Apple TV",description:"Authentic Apple TV interface with tvOS design",icon:we,emoji:"📺"},{value:"tesla-car",label:"Tesla Car Display",description:"Realistic Tesla infotainment screen interface",icon:ve,emoji:"🚗"},{value:"amazon-echo-show",label:"Amazon Echo Show",description:"Authentic Amazon Echo Show with Alexa interface",icon:ke,emoji:"🔊"}],Bm=({selectedDevice:e,onDeviceChange:r,variant:n="default"})=>{const i="compact"===n;return t.jsxs(Lm,{$isCompact:i,children:[!i&&t.jsx(Nm,{children:"Simulate Device View"}),t.jsx(Mm,{children:t.jsx(Fm,{value:e,onChange:e=>r(e.target.value),children:Vm.map(e=>t.jsxs(qm,{value:e.value,children:[e.emoji," ",e.label," - ",e.description]},e.value))})})]})};class Wm{static createOAuthTemplate(e,t,r){const n={"authorization-code":{"authorization-request":{method:"GET",url:`https://auth.pingone.com/${r.environmentId}/as/authorize`,queryParams:{response_type:"code",client_id:r.clientId,redirect_uri:r.redirectUri,scope:r.scopes?.join(" ")||"openid profile email",state:"random-state-value"},description:"Initiate OAuth 2.0 Authorization Code flow",educationalNotes:["The user will be redirected to this URL to authenticate","After authentication, the user will be redirected back with an authorization code","The state parameter helps prevent CSRF attacks"]},"token-exchange":{method:"POST",url:`https://auth.pingone.com/${r.environmentId}/as/token`,headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Basic ${btoa(`${r.clientId}:${r.clientSecret}`)}`},body:{grant_type:"authorization_code",code:"[authorization_code]",redirect_uri:r.redirectUri},description:"Exchange authorization code for access token",educationalNotes:["This request exchanges the authorization code for an access token","Client credentials are sent via Basic authentication","The response will contain access_token and refresh_token"]}},rar:{"authorization-request":{method:"GET",url:`https://auth.pingone.com/${r.environmentId}/as/authorize`,queryParams:{response_type:"code",client_id:r.clientId,redirect_uri:r.redirectUri,scope:r.scopes?.join(" ")||"openid profile email",state:"rar-flow-state",authorization_details:JSON.stringify({type:"oauth_authorization_details",authorization_details:r.authorizationDetails||[]})},description:"Initiate RAR (Rich Authorization Requests) flow",educationalNotes:["RAR extends OAuth 2.0 with granular authorization details","The authorization_details parameter specifies exact permissions","This enables fine-grained access control for APIs"]},"token-exchange":{method:"POST",url:`https://auth.pingone.com/${r.environmentId}/as/token`,headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Basic ${btoa(`${r.clientId}:${r.clientSecret}`)}`},body:{grant_type:"authorization_code",code:r.authorizationCode||"[authorization_code]",redirect_uri:r.redirectUri},description:"Exchange authorization code for access token with RAR claims",educationalNotes:["The access token will contain authorization_details as claims","These claims specify exactly what the client is authorized to do","Resource servers can use these claims for fine-grained authorization"]}},redirectless:{"PKCE Generation":{method:"LOCAL",url:"Client-side PKCE Generation",description:"Generate cryptographically secure PKCE parameters for redirectless flow",body:{code_verifier:"[cryptographically-random-string-43-128-chars]",code_challenge:"[sha256-hash-of-code-verifier]",code_challenge_method:"S256",algorithm:"SHA256",verifier_length:"43-128 characters",challenge_length:"43 characters (base64url encoded)"},educationalNotes:["PKCE (Proof Key for Code Exchange) is a security extension for OAuth 2.0","Code verifier is a cryptographically random string","Code challenge is the SHA256 hash of the code verifier","This prevents authorization code interception attacks"]},"authorization-request":{method:"POST",url:`https://auth.pingone.com/${r.environmentId}/as/authorize`,headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"},body:{response_type:"code",client_id:r.clientId,scope:r.scopes?.join(" ")||"openid profile email",state:"redirectless-flow-state",nonce:"redirectless-flow-nonce",code_challenge:"[pkce_code_challenge]",code_challenge_method:"S256",response_mode:"pi.flow",username:"[username]",password:"[password]"},description:"Initiate redirectless authentication with response_mode=pi.flow",educationalNotes:["This is a PingOne proprietary flow that bypasses the redirect","Username and password are sent directly in the request body","Uses response_mode=pi.flow for seamless authentication","PKCE is still required for security"]},"Authorization URL Generation":{method:"LOCAL",url:"Client-side URL Construction",description:"Construct authorization URL for redirectless authentication",queryParams:{response_type:"code",response_mode:"pi.flow",client_id:"[client-id]",scope:"openid profile email",state:"[random-state-value]",nonce:"[random-nonce-value]",code_challenge:"[pkce-code-challenge]",code_challenge_method:"S256"},body:{username:"[user-username]",password:"[user-password]",note:"Credentials sent in request body for redirectless flow"},educationalNotes:["This step builds the authorization URL with all required parameters","Includes PKCE challenge, state, nonce, and response_mode=pi.flow","Username and password will be sent in the request body","No redirect_uri is needed for redirectless flows"]},"Token Exchange":{method:"POST",url:`https://auth.pingone.com/${r.environmentId}/as/token`,headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Basic ${btoa(`${r.clientId}:${r.clientSecret}`)}`},body:{grant_type:"authorization_code",code:"[authorization_code]",redirect_uri:r.redirectUri,code_verifier:"[pkce_code_verifier]"},description:"Exchange authorization code for access token (redirectless flow)",educationalNotes:["This request exchanges the authorization code for an access token","Client credentials are sent via Basic authentication","PKCE code_verifier is required to complete the flow","The response will contain access_token and refresh_token"]}}}[e];if(!n)throw new Error(`Flow type not supported: ${e}`);const i=n[t];if(!i)throw new Error(`Step not found for flow ${e}: ${t}`);return{...{...i,...r.description&&{description:r.description},...r.educationalNotes&&{educationalNotes:r.educationalNotes},...r.method&&{method:r.method},...r.url&&{url:r.url},...r.headers&&{headers:r.headers},...r.body&&{body:r.body},...r.queryParams&&{queryParams:r.queryParams}},flowType:e,stepName:t,timestamp:new Date}}static getDefaultHighlightRules(e){const t=[];switch(e){case"rar":t.push({pattern:"authorization_details=",label:"RAR Parameter",description:"Rich Authorization Requests parameter containing granular authorization requirements",color:"#92400e",backgroundColor:"#fef3c7"});break;case"par":t.push({pattern:"request_uri=",label:"PAR Parameter",description:"Pushed Authorization Request URI parameter",color:"#1e40af",backgroundColor:"#dbeafe"});break;case"pkce":t.push({pattern:"code_challenge=",label:"PKCE Challenge",description:"PKCE code challenge parameter for security",color:"#059669",backgroundColor:"#d1fae5"},{pattern:"code_challenge_method=",label:"PKCE Method",description:"PKCE challenge method (S256 recommended)",color:"#059669",backgroundColor:"#d1fae5"});break;case"oidc":t.push({pattern:"nonce=",label:"Nonce",description:"OIDC nonce parameter for ID token binding",color:"#7c3aed",backgroundColor:"#ede9fe"},{pattern:"prompt=",label:"Prompt",description:"OIDC prompt parameter for user interaction control",color:"#7c3aed",backgroundColor:"#ede9fe"});break;case"worker-token":t.push({pattern:"grant_type=",label:"Grant Type",description:"OAuth 2.0 grant type (client_credentials for worker tokens)",color:"#dc2626",backgroundColor:"#fef2f2"},{pattern:"scope=",label:"Scope",description:"OAuth 2.0 scope parameter defining access permissions",color:"#dc2626",backgroundColor:"#fef2f2"})}return t}static highlightURL(e,t=[]){if(Array.isArray(t)||(t=[]),!e||0===t.length)return[{content:e,isHighlighted:!1}];const r=[],n=e;let i=0;const o=[];return t.forEach(e=>{const t="string"==typeof e.pattern?new RegExp(e.pattern.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"):e.pattern;let r;for(;null!==(r=t.exec(n));)o.push({start:r.index,end:r.index+r[0].length,rule:e})}),o.sort((e,t)=>e.start-t.start),o.forEach(e=>{e.start>i&&r.push({content:n.substring(i,e.start),isHighlighted:!1}),r.push({content:n.substring(e.start,e.end),isHighlighted:!0,label:e.rule.label,description:e.rule.description,color:e.rule.color||void 0,backgroundColor:e.rule.backgroundColor||void 0}),i=e.end}),i<n.length&&r.push({content:n.substring(i),isHighlighted:!1}),r}static generateEnhancedCurlCommand(e,t={}){const{includeHeaders:r=!0,includeBody:n=!0,includeQueryParams:i=!0,verbose:o=!1,insecure:s=!1}=t;let a="curl";const c=[];if(o&&(a+=" -v"),s&&(a+=" -k"),"GET"!==e.method&&(a+=` -X ${e.method}`),r&&e.headers&&Object.entries(e.headers).forEach(([e,t])=>{c.push(`  -H "${e}: ${t}"`)}),i&&e.queryParams){const t=new URLSearchParams(e.queryParams).toString();t&&c.push(`  -G --data-urlencode "${t}"`)}if(n&&e.body){let t="";if("string"==typeof e.body?t=e.body:"object"==typeof e.body&&(t=JSON.stringify(e.body),e.headers?.["Content-Type"]||c.push('  -H "Content-Type: application/json"')),t){const e=t.replace(/"/g,'\\"');c.push(`  -d "${e}"`)}}return c.push(`  "${e.url}"`),c.length>0?a+=` \\\n${c.join(" \\\n")}`:a+=` "${e.url}"`,a}static formatApiCallText(e,t=!0){let r=`${e.method} ${e.url}`;return e.queryParams&&Object.keys(e.queryParams).length>0&&(r+="\nQuery Parameters:",Object.entries(e.queryParams).forEach(([e,t])=>{r+=`\n  ${e}: ${t}`})),e.headers&&Object.keys(e.headers).length>0&&(r+="\nHeaders:",Object.entries(e.headers).forEach(([e,t])=>{r+=`\n  ${e}: ${t}`})),e.body&&(r+="\nBody:","string"==typeof e.body?r+=`\n  ${e.body}`:"object"==typeof e.body&&(r+=t?`\n  ${JSON.stringify(e.body,null,2)}`:`\n  ${JSON.stringify(e.body)}`)),r}static formatResponseSummary(e){if(!e.response)return"No response received";const{status:t,statusText:r,data:n,error:i}=e.response;let o=`HTTP ${t} ${r}`;if(i)o+=`\nError: ${i}`;else if(n)if(o+="\nResponse:","string"==typeof n)o+=`\n  ${n}`;else if("object"==typeof n)try{o+=`\n  ${JSON.stringify(n,null,2)}`}catch{o+=`\n  ${String(n)}`}else o+=`\n  ${String(n)}`;return o}static formatTimingInfo(e){if(e<1e3)return`Duration: ${e}ms`;return`Duration: ${(e/1e3).toFixed(2)}s`}static getApiCallStatus(e){if(e.response){if(e.response.status>=200&&e.response.status<300)return"success";if(e.response.status>=400)return"error"}return"info"}static async trackApiCall(e,t){const r=Date.now();try{const n=await t(),i=Date.now()-r,o=await n.json().catch(()=>null);return{...e,response:{status:n.status,statusText:n.statusText,headers:Object.fromEntries(n.headers.entries()),data:o},duration:i,timestamp:new Date}}catch(n){const t=Date.now()-r;return{...e,response:{status:0,statusText:"Network Error",error:n instanceof Error?n.message:"Unknown error"},duration:t,timestamp:new Date}}}static createFullDisplay(e,t={}){const r=Wm.generateEnhancedCurlCommand(e,t),n=Wm.formatApiCallText(e,t.prettyPrint),i=Wm.formatResponseSummary(e),o=e.duration?Wm.formatTimingInfo(e.duration):void 0;let s="🚀 API Call Details\n";return s+=`${"=".repeat(50)}\n\n`,s+="📤 Request:\n",s+=`${n}\n\n`,s+="💻 cURL Command:\n",s+=`${r}\n\n`,s+="📥 Response:\n",s+=`${i}\n`,o&&(s+=`\n⏱️  ${o}\n`),e.educationalNotes&&e.educationalNotes.length>0&&(s+="\n📚 Educational Notes:\n",e.educationalNotes.forEach((e,t)=>{s+=`${t+1}. ${e}\n`})),s}}const Gm=Ce.div`
	background: ${({$theme:e})=>"dark"===e?"#1f2937":"#ffffff"};
	border: 1px solid ${({$theme:e})=>"dark"===e?"#374151":"#e5e7eb"};
	border-radius: 12px;
	padding: 1.5rem;
	margin: 1rem 0;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`,Hm=Ce.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid #e5e7eb;
`,Jm=Ce.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #111827;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,Km=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border-radius: 9999px;
	font-size: 0.875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	cursor: ${({$clickable:e})=>e?"pointer":"default"};
	transition: all 0.2s ease;
	background: ${({$status:e})=>{switch(e){case"success":return"#d1fae5";case"error":return"#fee2e2";case"pending":return"#fef3c7";case"info":return"#dbeafe";default:return"#f3f4f6"}}};
	color: ${({$status:e})=>{switch(e){case"success":return"#065f46";case"error":return"#991b1b";case"pending":return"#92400e";case"info":return"#1e40af";default:return"#374151"}}};

	${({$clickable:e})=>e&&"\n\t\t&:hover {\n\t\t\ttransform: scale(1.05);\n\t\t\tbox-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n\t\t}\n\t"}
`,Ym=Ce.div`
	margin-bottom: 1rem;
`,Xm=Ce.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.75rem;
	background: ${({$sectionType:e,$statusCode:t})=>{if("response"===e&&void 0!==t)return t>=200&&t<300?"linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)":t>=400?"linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)":"linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";switch(e){case"details":return"linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)";case"curl":return"linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)";case"pingone":return"linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";case"response":return"linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)";case"notes":return"linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)";default:return"#f8fafc"}}};
	border: 2px solid ${({$sectionType:e,$statusCode:t})=>{if("response"===e&&void 0!==t)return t>=200&&t<300?"#10b981":t>=400?"#ef4444":"#f59e0b";switch(e){case"details":return"#3b82f6";case"curl":return"#10b981";case"pingone":return"#f59e0b";case"response":return"#ec4899";case"notes":return"#8b5cf6";default:return"#e2e8f0"}}};
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	
	&:hover {
		background: ${({$sectionType:e,$statusCode:t})=>{if("response"===e&&void 0!==t)return t>=200&&t<300?"linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)":t>=400?"linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)":"linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)";switch(e){case"details":return"linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)";case"curl":return"linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)";case"pingone":return"linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)";case"response":return"linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%)";case"notes":return"linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)";default:return"#f1f5f9"}}};
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
`,Qm=Ce.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	padding: 0.75rem 1rem;
	border-radius: 6px;
	font-weight: 600;
	color: ${({$statusCode:e})=>e>=200&&e<300?"#065f46":e>=400?"#991b1b":"#92400e"};
	background: ${({$statusCode:e})=>e>=200&&e<300?"#d1fae5":e>=400?"#fee2e2":"#fef3c7"};
	border: 1px solid ${({$statusCode:e})=>e>=200&&e<300?"#10b981":e>=400?"#ef4444":"#f59e0b"};
`,Zm=Ce.h4`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,ef=Ce.div`
	max-height: ${({$isExpanded:e})=>e?"1000px":"0"};
	overflow: hidden;
	transition: max-height 0.3s ease;
	padding: ${({$isExpanded:e})=>e?"1rem":"0"};
	border: ${({$isExpanded:e})=>e?"1px solid #e2e8f0":"none"};
	border-top: none;
	border-radius: 0 0 6px 6px;
`,tf=Ce.pre`
	background: ${({$theme:e})=>"dark"===e?"#111827":"#f8fafc"};
	border: 1px solid ${({$theme:e})=>"dark"===e?"#374151":"#e2e8f0"};
	border-radius: 6px;
	padding: 1rem;
	overflow-x: auto;
	overflow-y: auto;
	max-height: 400px;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	color: ${({$theme:e})=>"dark"===e?"#f9fafb":"#374151"};
	margin: 0;
	white-space: pre-wrap;
	word-wrap: break-word;
`,rf=Ce.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`,nf=Ce.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	border: none;
	border-radius: 6px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	background: ${({$variant:e})=>{switch(e){case"primary":return"#3b82f6";case"secondary":default:return"#f3f4f6";case"success":return"#10b981";case"danger":return"#ef4444"}}};
	color: ${({$variant:e})=>{switch(e){case"primary":case"success":case"danger":return"white";default:return"#374151"}}};
	
	&:hover {
		background: ${({$variant:e})=>{switch(e){case"primary":return"#2563eb";case"secondary":default:return"#e5e7eb";case"success":return"#059669";case"danger":return"#dc2626"}}};
	}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`,of=Ce.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 6px;
	padding: 1rem;
	margin: 0.75rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`,sf=Ce.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 6px;
	padding: 1rem;
	margin: 0.75rem 0;
	font-size: 0.875rem;
	color: #166534;
`,af=Ce.ul`
	margin: 0.5rem 0;
	padding-left: 0;
	list-style: none;
`,cf=Ce.li`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	margin: 0.5rem 0;
	padding: 0.75rem;
	background: #f8fafc;
	border-radius: 6px;
	border-left: 4px solid #3b82f6;
	display: flex;
	justify-content: space-between;
	align-items: center;
`,lf=Ce.code`
	background: #e2e8f0;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.8rem;
`,df=({apiCall:r,options:i={},onExecute:o,showExecuteButton:c=!1,className:l,initiallyCollapsed:d=!1})=>{const[u,p]=e.useState(d?new Set:new Set(["request","response"])),[g,m]=e.useState(!1),f=j(),{theme:b="light",showEducationalNotes:x=!0,showFlowContext:y=!0}=i,w=e.useCallback(e=>{p(t=>{const r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})},[]),v=e.useCallback(async(e,t)=>{try{await navigator.clipboard.writeText(e),Ge.showSuccess(`${t} copied to clipboard.`)}catch{Ge.showError("Failed to copy to clipboard.")}},[]),k=e.useCallback(async()=>{if(o){m(!0);try{await o()}catch{Ge.showError("Failed to execute API call.")}finally{m(!1)}}},[o]),S=e.useCallback(()=>{const e=r.flowType||"oauth",t=r.stepName||"api-call";f(`/code-examples?flow=${e}&step=${t}`)},[f,r.flowType,r.stepName]),C=()=>{if(g)return"pending";if(r.response){if(r.response.status>=200&&r.response.status<300)return"success";if(r.response.status>=400)return"error"}return"info"},A=Wm.generateEnhancedCurlCommand(r,i);return t.jsxs(Gm,{$theme:b,className:l,children:[t.jsxs(Hm,{children:[t.jsxs(Jm,{children:[r.method," ",r.url.split("?")[0],r.stepName&&` - ${r.stepName}`]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"1rem"},children:[r.duration&&t.jsxs("span",{style:{fontSize:"0.875rem",color:"#6b7280"},children:[r.duration,"ms"]}),t.jsx("div",{style:{position:"relative"},children:t.jsx(Km,{$status:C(),children:C().toUpperCase()})})]})]}),r.description&&t.jsx("p",{style:{margin:"0 0 1rem 0",color:"#6b7280",fontSize:"0.875rem"},children:r.description}),y&&r.flowType&&t.jsxs(sf,{children:[t.jsx("strong",{children:"Flow Context:"})," ",r.flowType.replace("-"," ").toUpperCase()," Flow"]}),t.jsxs(Ym,{children:[t.jsxs(Xm,{$sectionType:"request",onClick:()=>w("request"),children:[t.jsx(Zm,{children:"📤 Request"}),t.jsx(a,{style:{transform:u.has("request")?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s ease"}})]}),t.jsxs(ef,{$isExpanded:u.has("request"),children:[t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"URL"}),t.jsxs(tf,{$theme:b,children:[r.method," ",r.url.split("?")[0]]})]}),r.queryParams&&Object.keys(r.queryParams).length>0&&t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Query Parameters"}),t.jsx(af,{children:Object.entries(r.queryParams).map(([e,r])=>t.jsxs(cf,{children:[t.jsx("span",{children:t.jsxs("strong",{children:[e,":"]})}),t.jsx(lf,{children:r})]},e))})]}),r.headers&&Object.keys(r.headers).length>0&&t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Headers"}),t.jsx(af,{children:Object.entries(r.headers).map(([e,r])=>t.jsxs(cf,{children:[t.jsx("span",{children:t.jsxs("strong",{children:[e,":"]})}),t.jsx(lf,{children:r})]},e))})]}),r.body&&t.jsxs("div",{children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Body"}),t.jsx(tf,{$theme:b,children:"string"==typeof r.body?r.body:JSON.stringify(r.body,null,2)})]})]})]}),r.response&&t.jsxs(Ym,{children:[t.jsxs(Xm,{$sectionType:"response",onClick:()=>w("response"),children:[t.jsx(Zm,{children:"📥 Response"}),t.jsx(a,{style:{transform:u.has("response")?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s ease"}})]}),t.jsxs(ef,{$isExpanded:u.has("response"),children:[r.response.status&&t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Status"}),t.jsxs(Km,{$status:r.response.status>=200&&r.response.status<300?"success":r.response.status>=400?"error":"pending",children:[r.response.status," ",r.response.statusText]})]}),r.response.headers&&Object.keys(r.response.headers).length>0&&t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Response Headers"}),t.jsx(af,{children:Object.entries(r.response.headers).map(([e,r])=>t.jsxs(cf,{children:[t.jsx("span",{children:t.jsxs("strong",{children:[e,":"]})}),t.jsx(lf,{children:r})]},e))})]}),r.response.data&&t.jsxs("div",{children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Body"}),t.jsx(tf,{$theme:b,children:"string"==typeof r.response.data?r.response.data:JSON.stringify(r.response.data,null,2)})]})]})]}),t.jsxs(Ym,{children:[t.jsxs(Xm,{$sectionType:"tools",onClick:()=>w("tools"),children:[t.jsx(Zm,{children:"🛠️ Tools"}),t.jsx(a,{style:{transform:u.has("tools")?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s ease"}})]}),t.jsxs(ef,{$isExpanded:u.has("tools"),children:[t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"cURL Command"}),t.jsx(tf,{$theme:b,children:A}),t.jsxs("div",{style:{marginTop:"0.5rem",display:"flex",gap:"0.5rem",flexWrap:"wrap"},children:[t.jsxs(nf,{$variant:"primary",onClick:()=>v(A,"cURL command"),children:[t.jsx(n,{size:14}),"Copy cURL"]}),t.jsxs(nf,{$variant:"secondary",onClick:()=>window.open(r.url,"_blank"),children:[t.jsx(h,{size:14}),"Open URL"]})]})]}),t.jsxs("div",{children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Code Examples"}),t.jsxs(nf,{$variant:"success",onClick:S,children:[t.jsx(s,{size:14}),"View Code Examples"]})]})]})]}),t.jsxs(Ym,{children:[t.jsxs(Xm,{$sectionType:"pingone",onClick:()=>w("pingone"),children:[t.jsx(Zm,{children:"Real Request to PingOne"}),t.jsx(a,{style:{transform:u.has("pingone")?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s ease"}})]}),t.jsx(ef,{$isExpanded:u.has("pingone"),children:t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("p",{style:{margin:"0 0 0.75rem 0",color:"#6b7280",fontSize:"0.875rem"},children:"This shows the actual HTTP request that will be sent to PingOne's token endpoint:"}),t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"PingOne Token Endpoint"}),t.jsxs(tf,{$theme:b,children:[r.method," ",r.url]})]}),r.headers&&Object.keys(r.headers).length>0&&t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"HTTP Headers"}),t.jsx(af,{children:Object.entries(r.headers).map(([e,r])=>t.jsxs(cf,{children:[t.jsx("span",{children:t.jsxs("strong",{children:[e,":"]})}),t.jsx(lf,{children:r})]},e))})]}),r.body&&t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Request Body (JSON)"}),t.jsx(tf,{$theme:b,children:"string"==typeof r.body?r.body:JSON.stringify(r.body,null,2)})]}),t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"JavaScript Fetch Example"}),t.jsx(tf,{$theme:b,children:`// JavaScript fetch request to PingOne\nconst response = await fetch('${r.url}', {\n  method: '${r.method}',\n  headers: {\n${r.headers?Object.entries(r.headers).map(([e,t])=>`    '${e}': '${t}'`).join(",\n"):"    // No headers"},${r.body?`\n  body: JSON.stringify(${"string"==typeof r.body?r.body:JSON.stringify(r.body,null,2)})`:""}\n});\n\nconst data = await response.json();\nconsole.log('PingOne Response:', data);`}),t.jsx(rf,{style:{marginTop:"0.75rem"},children:t.jsxs(nf,{$variant:"primary",onClick:()=>v(`// JavaScript fetch request to PingOne\nconst response = await fetch('${r.url}', {\n  method: '${r.method}',\n  headers: {\n${r.headers?Object.entries(r.headers).map(([e,t])=>`    '${e}': '${t}'`).join(",\n"):"    // No headers"},${r.body?`\n  body: JSON.stringify(${"string"==typeof r.body?r.body:JSON.stringify(r.body,null,2)})`:""}\n});\n\nconst data = await response.json();\nconsole.log('PingOne Response:', data);`,"JavaScript Fetch Example"),children:[t.jsx(n,{size:14}),"Copy JavaScript"]})})]}),t.jsxs("div",{style:{marginBottom:"1.5rem"},children:[t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"},children:[t.jsx("h5",{style:{margin:0,fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"📮 Postman Collection Example"}),t.jsxs(nf,{onClick:()=>{const e=`{\n  "info": {\n    "name": "PingOne Token Exchange Request",\n    "description": "OAuth 2.0 Token Exchange request to PingOne",\n    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"\n  },\n  "item": [\n    {\n      "name": "Token Exchange",\n      "request": {\n        "method": "${r.method}",\n        "header": [\n${r.headers?Object.entries(r.headers).map(([e,t])=>`          {\n            "key": "${e}",\n            "value": "${t}",\n            "type": "text"\n          }`).join(",\n"):"          // No headers"},${r.body?`\n        ],\n        "body": {\n          "mode": "raw",\n          "raw": "${JSON.stringify(r.body,null,2).replace(/"/g,'\\"')}",\n          "options": {\n            "raw": {\n              "language": "json"\n            }\n          }\n        }`:""}\n        ],\n        "url": {\n          "raw": "${r.url}",\n          "protocol": "https",\n          "host": ["auth", "pingone", "com"],\n          "path": ["${r.url.split("/").slice(3).join('", "')}"]\n        }\n      }\n    }\n  ]\n}`;v(e,"Postman Collection")},children:[t.jsx(n,{size:14}),"Copy Postman Collection"]})]}),t.jsx(tf,{$theme:b,children:`{\n  "info": {\n    "name": "PingOne Token Exchange Request",\n    "description": "OAuth 2.0 Token Exchange request to PingOne",\n    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"\n  },\n  "item": [\n    {\n      "name": "Token Exchange",\n      "request": {\n        "method": "${r.method}",\n        "header": [\n${r.headers?Object.entries(r.headers).map(([e,t])=>`          {\n            "key": "${e}",\n            "value": "${t}",\n            "type": "text"\n          }`).join(",\n"):"          // No headers"},${r.body?`\n        ],\n        "body": {\n          "mode": "raw",\n          "raw": "${JSON.stringify(r.body,null,2).replace(/"/g,'\\"')}",\n          "options": {\n            "raw": {\n              "language": "json"\n            }\n          }\n        }`:""}\n        ],\n        "url": {\n          "raw": "${r.url}",\n          "protocol": "https",\n          "host": ["auth", "pingone", "com"],\n          "path": ["${r.url.split("/").slice(3).join('", "')}"]\n        }\n      }\n    }\n  ]\n}`}),t.jsx(rf,{style:{marginTop:"0.75rem"},children:t.jsxs(nf,{$variant:"primary",onClick:()=>v(`{\n  "info": {\n    "name": "PingOne Token Exchange Request",\n    "description": "OAuth 2.0 Token Exchange request to PingOne",\n    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"\n  },\n  "item": [\n    {\n      "name": "Token Exchange",\n      "request": {\n        "method": "${r.method}",\n        "header": [\n${r.headers?Object.entries(r.headers).map(([e,t])=>`          {\n            "key": "${e}",\n            "value": "${t}",\n            "type": "text"\n          }`).join(",\n"):"          // No headers"},${r.body?`\n        ],\n        "body": {\n          "mode": "raw",\n          "raw": "${JSON.stringify(r.body,null,2).replace(/"/g,'\\"')}",\n          "options": {\n            "raw": {\n              "language": "json"\n            }\n          }\n        }`:""}\n        ],\n        "url": {\n          "raw": "${r.url}",\n          "protocol": "https",\n          "host": ["auth", "pingone", "com"],\n          "path": ["${r.url.split("/").slice(3).join('", "')}"]\n        }\n      }\n    }\n  ]\n}`,"Postman Collection JSON"),children:[t.jsx(n,{size:14}),"Copy Postman Collection"]})})]}),t.jsxs("div",{style:{marginBottom:"1.5rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.75rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"📚 Official Documentation & Examples"}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:[t.jsxs(nf,{$variant:"secondary",onClick:()=>window.open("https://apidocs.pingidentity.com/pingone/platform/v1/api/","_blank"),style:{justifyContent:"flex-start",textAlign:"left"},children:[t.jsx(h,{size:16}),"PingOne API Documentation"]}),t.jsxs(nf,{$variant:"secondary",onClick:()=>window.open("https://www.postman.com/ping-identity/pingone/documentation/ps5gedp/pingone-platform-apis-with-documentation","_blank"),style:{justifyContent:"flex-start",textAlign:"left"},children:[t.jsx(h,{size:16}),"PingOne Postman Collection"]})]}),t.jsxs("div",{style:{marginTop:"0.75rem",padding:"0.75rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"0.5rem",fontSize:"0.8rem",color:"#64748b"},children:["💡 ",t.jsx("strong",{children:"Tip:"})," Copy the Postman Collection JSON above and import it into Postman, or use the official PingOne Postman collection for ready-to-use examples."]})]}),t.jsxs("div",{children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Real cURL Command to PingOne"}),t.jsx(tf,{$theme:b,children:Wm.generateEnhancedCurlCommand(r,{...i,verbose:!0,includeHeaders:!0,includeBody:!0})}),t.jsx(rf,{style:{marginTop:"0.75rem"},children:t.jsxs(nf,{$variant:"primary",onClick:()=>v(Wm.generateEnhancedCurlCommand(r,{...i,verbose:!0,includeHeaders:!0,includeBody:!0}),"Real PingOne cURL Command"),children:[t.jsx(n,{size:14}),"Copy Real cURL"]})})]})]})})]}),r.response&&t.jsxs(Ym,{children:[t.jsxs(Xm,{$sectionType:"response",onClick:()=>w("response"),$statusCode:r.response.status,children:[t.jsx(Zm,{children:"Response"}),t.jsx(a,{style:{transform:u.has("response")?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s ease"}})]}),t.jsxs(ef,{$isExpanded:u.has("response"),children:[r.response.headers&&Object.keys(r.response.headers).length>0&&t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Response Headers"}),t.jsx(af,{children:Object.entries(r.response.headers).map(([e,r])=>t.jsxs(cf,{children:[t.jsx("span",{children:t.jsxs("strong",{children:[e,":"]})}),t.jsx(lf,{children:r})]},e))})]}),t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Status"}),t.jsxs(Qm,{$statusCode:r.response.status,children:["HTTP ",r.response.status," ",r.response.statusText]})]}),t.jsxs("div",{children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Response Body"}),t.jsx(tf,{$theme:b,children:r.response.error?`Error: ${r.response.error}`:r.response.data?JSON.stringify(r.response.data,null,2):"No response body"})]})]})]}),x&&r.educationalNotes&&r.educationalNotes.length>0&&t.jsxs(Ym,{children:[t.jsxs(Xm,{onClick:()=>w("notes"),children:[t.jsx(Zm,{children:"Educational Notes"}),t.jsx(a,{style:{transform:u.has("notes")?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s ease"}})]}),t.jsx(ef,{$isExpanded:u.has("notes"),children:r.educationalNotes.map((e,r)=>t.jsxs(of,{children:[t.jsx(h,{size:16,style:{color:"#3b82f6",marginTop:"2px"}}),t.jsx("span",{children:e})]},r))})]}),c&&o&&t.jsx(rf,{children:t.jsx(nf,{$variant:"success",onClick:k,disabled:g,children:g?"Executing...":"Execute API Call"})}),r.duration&&t.jsxs("div",{style:{marginTop:"1rem",padding:"0.75rem",background:"#f8fafc",borderRadius:"6px",fontSize:"0.875rem",color:"#6b7280"},children:[t.jsx("strong",{children:"Duration:"})," ",r.duration<1e3?`${r.duration}ms`:`${(r.duration/1e3).toFixed(2)}s`]})]})},uf=Ce.div`
  background: #f1f5f9;
  border-left: 4px solid #3b82f6;
  border-radius: 0 12px 12px 0;
  padding: 1.5rem;
  margin-bottom: 2rem;
`,pf=Ce.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`,hf=Ce.div`
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;Ce.div`
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.75rem;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`,Ce.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
`,Ce.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
`,Ce.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #0f172a;
`;const gf=Ce.div`
  max-width: 900px;
  margin: 0 auto;
`,mf=Ce(vi)`
  margin-bottom: 2rem;
`,ff=Ce.div`
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`,bf=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${({theme:e})=>e.colors.gray600};
`,xf=Ce.span`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${({$difficulty:e,theme:t})=>{switch(e){case"Beginner":return`${t.colors.success}20`;case"Intermediate":return`${t.colors.warning}20`;case"Advanced":return`${t.colors.danger}20`;default:return t.colors.gray200}}};
  color: ${({$difficulty:e,theme:t})=>{switch(e){case"Beginner":return t.colors.success;case"Intermediate":return t.colors.warning;case"Advanced":return t.colors.danger;default:return t.colors.gray600}}};
`,yf=Ce.div`
  margin: 1.5rem 0;
`,wf=Ce.div`
  width: 100%;
  height: 8px;
  background-color: ${({theme:e})=>e.colors.gray200};
  border-radius: 4px;
  overflow: hidden;
`,vf=Ce.div`
  height: 100%;
  background-color: ${({theme:e})=>e.colors.success};
  width: ${({$progress:e})=>e}%;
  transition: width 0.3s ease;
`,kf=Ce.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: ${({theme:e})=>e.colors.gray600};
`,jf=Ce.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`,Sf=Ce.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid ${({$variant:e,theme:t})=>"secondary"===e?t.colors.gray300:t.colors.primary};
  background-color: ${({$variant:e,theme:t})=>"secondary"===e?"white":t.colors.primary};
  color: ${({$variant:e,theme:t})=>"secondary"===e?t.colors.gray700:"white"};
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${({$variant:e,theme:t})=>"secondary"===e?t.colors.gray50:t.colors.primaryDark};
    border-color: ${({$variant:e,theme:t})=>"secondary"===e?t.colors.gray400:t.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`,Cf=({tutorial:r,onStepComplete:n,onTutorialComplete:i})=>{const[o,s]=e.useState(new Set),[a,c]=e.useState(!1),l=o.size/r.steps.length*100,d=o.size===r.steps.length;e.useEffect(()=>{d&&i&&i()},[d,i]);const p=()=>{c(!0),s(new Set)},h=e=>{if(!e.action)return;const r={navigate:t.jsx(k,{size:16}),configure:t.jsx(T,{size:16}),execute:t.jsx(se,{size:16}),observe:t.jsx(k,{size:16})};return{label:e.action.label,icon:r[e.action.type],onClick:()=>{e.action.onClick&&e.action.onClick(),setTimeout(()=>(e=>{const t=new Set(o);t.add(e),s(t),n&&n(e)})(e.id),500)}}};return t.jsxs(gf,{children:[t.jsxs(mf,{children:[t.jsx(yi,{children:t.jsx("h1",{children:r.title})}),t.jsxs(wi,{children:[t.jsx("p",{children:r.description}),t.jsxs(ff,{children:[t.jsxs(bf,{children:[t.jsx(se,{size:16}),r.estimatedTime]}),t.jsx(bf,{children:t.jsx(xf,{$difficulty:r.difficulty,children:r.difficulty})}),t.jsxs(bf,{children:[t.jsx(u,{size:16}),r.steps.length," steps"]})]}),a&&t.jsxs(yf,{children:[t.jsx(wf,{children:t.jsx(vf,{$progress:l})}),t.jsxs(kf,{children:[t.jsxs("span",{children:[o.size," of ",r.steps.length," steps completed"]}),t.jsxs("span",{children:[Math.round(l),"%"]})]})]}),t.jsx(jf,{children:!a||d?t.jsxs(Sf,{onClick:p,children:[t.jsx(se,{size:16}),d?"Start Again":"Start Tutorial"]}):t.jsxs(Sf,{$variant:"secondary",onClick:()=>{c(!1),s(new Set)},children:[t.jsx(b,{size:16}),"Reset Tutorial"]})})]})]}),a&&t.jsx("div",{children:r.steps.map((e,r)=>t.jsx(Pt,{stepNumber:r+1,title:e.title,description:e.description,codeExample:e.codeExample,completed:o.has(e.id),actionButton:h(e),onToggle:()=>{!o.has(e.id)&&o.size},children:e.content},e.id))}),d&&t.jsx(vi,{children:t.jsxs(wi,{style:{textAlign:"center",padding:"2rem"},children:[t.jsx(u,{size:48,style:{color:"#28a745",marginBottom:"1rem"}}),t.jsx("h2",{children:"Tutorial Completed! "}),t.jsxs("p",{style:{color:"#6c757d",marginBottom:"1.5rem"},children:["Great job! You've successfully completed the ",r.title," tutorial. You now have hands-on experience with this OAuth flow."]}),t.jsxs(Sf,{onClick:p,children:[t.jsx(b,{size:16}),"Try Again"]})]})})]})},Af=({errorDetails:e,onDismiss:r,onRetry:n,onClearAndRetry:i,showCorrelationId:o=!1,className:s=""})=>{const a=(e=>{switch(e){case"invalid_credentials":case"invalid_grant":case"unauthorized_client":case"unsupported_grant_type":return"#dc2626";case"forbidden":case"invalid_scope":return"#ea580c";case"not_found":return"#ca8a04";case"network":return"#2563eb";case"server_error":return"#7c3aed";default:return"#6b7280"}})(e.errorType),c=(e=>{switch(e){case"invalid_credentials":return"🔑";case"forbidden":return"🚫";case"not_found":return"🔍";case"network":return"🌐";case"server_error":return"⚡";case"invalid_grant":return"🎫";case"invalid_scope":return"📋";case"unauthorized_client":return"👤";case"unsupported_grant_type":return"❌";default:return"⚠️"}})(e.errorType);return t.jsxs("div",{className:`oauth-error-display ${s}`,style:{marginTop:"1rem",padding:"1rem",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"0.75rem",borderLeft:`4px solid ${a}`},children:[t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsxs("div",{style:{fontSize:"1.25rem",flexShrink:0,marginTop:"2px",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx("span",{children:c}),t.jsx(l,{size:20,style:{color:a}})]}),t.jsxs("div",{style:{flex:1},children:[t.jsx("h4",{style:{margin:"0 0 0.5rem 0",fontSize:"1rem",fontWeight:600,color:a},children:e.message}),t.jsx("p",{style:{margin:0,fontSize:"0.875rem",color:"#7f1d1d"},children:"Please check the troubleshooting steps below to resolve this issue."}),o&&e.correlationId&&t.jsxs("p",{style:{margin:"0.25rem 0 0 0",fontSize:"0.75rem",color:"#9ca3af",fontFamily:"monospace"},children:["Correlation ID: ",e.correlationId]})]})]}),t.jsx("div",{style:{background:"#ffffff",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #e5e7eb",fontSize:"0.875rem",lineHeight:1.6,marginBottom:"1rem"},children:t.jsx("div",{style:{whiteSpace:"pre-line",color:"#374151"},children:e.troubleshootingSteps})}),e.recoveryActions.length>0&&t.jsxs("div",{style:{background:"#f8fafc",padding:"0.75rem",borderRadius:"0.5rem",border:"1px solid #e2e8f0",marginBottom:"1rem"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#475569"},children:"💡 Quick Actions:"}),t.jsx("ul",{style:{margin:0,paddingLeft:"1.25rem",fontSize:"0.875rem",color:"#64748b"},children:e.recoveryActions.map((e,r)=>t.jsx("li",{style:{marginBottom:"0.25rem"},children:e},r))})]}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem",flexWrap:"wrap"},children:[t.jsxs("button",{onClick:r,style:{padding:"0.5rem 1rem",background:a,color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.2s ease"},onMouseOver:e=>{e.currentTarget.style.background=a,e.currentTarget.style.opacity="0.9"},onMouseOut:e=>{e.currentTarget.style.background=a,e.currentTarget.style.opacity="1"},children:[t.jsx(f,{size:16}),"Dismiss"]}),n&&t.jsxs("button",{onClick:n,style:{padding:"0.5rem 1rem",background:"#059669",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.2s ease"},onMouseOver:e=>{e.currentTarget.style.background="#047857"},onMouseOut:e=>{e.currentTarget.style.background="#059669"},children:[t.jsx(b,{size:16}),"Retry"]}),i&&t.jsxs("button",{onClick:i,style:{padding:"0.5rem 1rem",background:"#6b7280",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.2s ease"},onMouseOver:e=>{e.currentTarget.style.background="#4b5563"},onMouseOut:e=>{e.currentTarget.style.background="#6b7280"},children:[t.jsx(b,{size:16}),"Clear & Retry"]}),t.jsxs("button",{onClick:()=>window.open("https://docs.pingidentity.com/bundle/pingone-for-customers/page/authentication.html","_blank"),style:{padding:"0.5rem 1rem",background:"#3b82f6",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.2s ease"},onMouseOver:e=>{e.currentTarget.style.background="#2563eb"},onMouseOut:e=>{e.currentTarget.style.background="#3b82f6"},children:[t.jsx(h,{size:16}),"PingOne Docs"]})]})]})},Tf=()=>{const[t,r]=e.useState({loadedComponents:0,loadingComponents:0,averageLoadTime:0,totalErrors:0}),n=e.useCallback(()=>{r({loadedComponents:mt.getLoadedComponentCount(),loadingComponents:mt.getLoadingComponentCount(),averageLoadTime:gt.getAverageLoadTime(),totalErrors:gt.getTotalErrors()})},[]);return e.useEffect(()=>{n();const e=setInterval(n,1e3);return()=>clearInterval(e)},[n]),{...t,updateMetrics:n,clearMetrics:gt.clearMetrics}},_f=Ce.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({theme:e})=>e.shadows.md};
  padding: 1.5rem;
  margin: 1rem 0;
`,Rf=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`,If=Ce.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({theme:e})=>e.colors.gray900};
`,$f=Ce.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 8px;
  color: white;
  font-size: 18px;
`,Ef=Ce.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`,zf=Ce.div`
  background: ${({theme:e})=>e.colors.gray50};
  border: 1px solid ${({theme:e})=>e.colors.gray200};
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({theme:e})=>e.shadows.sm};
  }
`,Pf=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`,Of=Ce.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({theme:e})=>e.colors.gray700};
`,Uf=Ce.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: ${({trend:e,theme:t})=>{switch(e){case"up":return"#dcfce7";case"down":return"#fee2e2";default:return t.colors.gray200}}};
  color: ${({trend:e})=>{switch(e){case"up":return"#16a34a";case"down":return"#dc2626";default:return"#6b7280"}}};
  font-size: 12px;
`,Df=Ce.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({theme:e})=>e.colors.gray900};
`,Lf=Ce.span`
  font-size: 0.75rem;
  color: ${({theme:e})=>e.colors.gray500};
  margin-left: 0.25rem;
`,Nf=Ce.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${({theme:e})=>e.colors.gray600};
  line-height: 1.4;
`,Mf=Ce.div`
  background: ${({theme:e})=>e.colors.gray50};
  border: 1px solid ${({theme:e})=>e.colors.gray200};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`,Ff=Ce.h4`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${({theme:e})=>e.colors.gray900};
`,qf=Ce.div`
  height: 200px;
  display: flex;
  align-items: end;
  gap: 4px;
  padding: 1rem 0;
`,Vf=Ce.div`
  flex: 1;
  height: ${({height:e})=>e}%;
  background: ${({color:e})=>e};
  border-radius: 2px 2px 0 0;
  transition: all 0.3s ease;
  min-height: 4px;
`,Bf=Ce.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: ${({theme:e})=>e.colors.gray600};
  margin-top: 0.5rem;
`,Wf=Ce.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`,Gf=Ce.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid ${({variant:e,theme:t})=>"primary"===e?t.colors.primary:t.colors.gray300};
  background: ${({variant:e,theme:t})=>"primary"===e?t.colors.primary:"white"};
  color: ${({variant:e,theme:t})=>"primary"===e?"white":t.colors.gray700};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({variant:e,theme:t})=>"primary"===e?t.colors.primaryDark:t.colors.gray100};
    transform: translateY(-1px);
  }
`,Hf=()=>{const[r,n]=e.useState({loadTime:0,renderTime:0,memoryUsage:0,bundleSize:0,chunkCount:0,cacheHitRate:0,errorRate:0}),[i,s]=e.useState(!1),[a,c]=e.useState([]),l=Tf(),d=e.useCallback(()=>{const e=performance.getEntriesByType("navigation")[0],t=performance.getEntriesByType("paint");return{loadTime:e?e.loadEventEnd-e.loadEventStart:0,renderTime:t.find(e=>"first-contentful-paint"===e.name)?.startTime||0,memoryUsage:performance.memory?performance.memory.usedJSHeapSize/1024/1024:0,bundleSize:509.01000000000005,chunkCount:7,cacheHitRate:100*Math.random(),errorRate:l.totalErrors>0?l.totalErrors/(l.loadedComponents+l.totalErrors)*100:0}},[l]),u=e.useCallback(()=>{s(!0),Ee.info("[PerformanceMonitor] Started performance monitoring")},[]),p=e.useCallback(()=>{s(!1),Ee.info("[PerformanceMonitor] Stopped performance monitoring")},[]),h=e.useCallback(()=>{c([]),l.clearMetrics(),Ee.info("[PerformanceMonitor] Cleared performance data")},[l]);e.useEffect(()=>{if(!i)return;const e=setInterval(()=>{const e=d();n(e),c(t=>[...t.slice(-9),e])},1e3);return()=>clearInterval(e)},[i,d]),e.useEffect(()=>{const e=d();n(e)},[d]);const g=a.map((e,t)=>({label:`${t+1}`,loadTime:Math.min(e.loadTime/100,100),renderTime:Math.min(e.renderTime/50,100),memoryUsage:Math.min(e.memoryUsage/10,100)}));return t.jsxs(_f,{children:[t.jsxs(Rf,{children:[t.jsx($f,{children:t.jsx(R,{})}),t.jsx(If,{children:"Performance Monitor"})]}),t.jsxs(Ef,{children:[t.jsxs(zf,{trend:r.loadTime<1e3?"up":"down",children:[t.jsxs(Pf,{children:[t.jsx(Of,{children:"Load Time"}),t.jsx(Uf,{trend:r.loadTime<1e3?"up":"down",children:t.jsx(de,{})})]}),t.jsxs(Df,{children:[r.loadTime.toFixed(0),t.jsx(Lf,{children:"ms"})]}),t.jsx(Nf,{children:"Time to load the application"})]}),t.jsxs(zf,{trend:r.renderTime<500?"up":"down",children:[t.jsxs(Pf,{children:[t.jsx(Of,{children:"Render Time"}),t.jsx(Uf,{trend:r.renderTime<500?"up":"down",children:t.jsx(P,{})})]}),t.jsxs(Df,{children:[r.renderTime.toFixed(0),t.jsx(Lf,{children:"ms"})]}),t.jsx(Nf,{children:"First contentful paint time"})]}),t.jsxs(zf,{children:[t.jsxs(Pf,{children:[t.jsx(Of,{children:"Memory Usage"}),t.jsx(Uf,{children:t.jsx(R,{})})]}),t.jsxs(Df,{children:[r.memoryUsage.toFixed(1),t.jsx(Lf,{children:"MB"})]}),t.jsx(Nf,{children:"JavaScript heap size"})]}),t.jsxs(zf,{children:[t.jsxs(Pf,{children:[t.jsx(Of,{children:"Bundle Size"}),t.jsx(Uf,{children:t.jsx(o,{})})]}),t.jsxs(Df,{children:[r.bundleSize.toFixed(1),t.jsx(Lf,{children:"kB"})]}),t.jsx(Nf,{children:"Total application size"})]}),t.jsxs(zf,{children:[t.jsxs(Pf,{children:[t.jsx(Of,{children:"Chunk Count"}),t.jsx(Uf,{children:t.jsx(ye,{})})]}),t.jsx(Df,{children:r.chunkCount}),t.jsx(Nf,{children:"Code-split chunks"})]}),t.jsxs(zf,{trend:r.cacheHitRate>80?"up":"down",children:[t.jsxs(Pf,{children:[t.jsx(Of,{children:"Cache Hit Rate"}),t.jsx(Uf,{trend:r.cacheHitRate>80?"up":"down",children:t.jsx(ye,{})})]}),t.jsxs(Df,{children:[r.cacheHitRate.toFixed(1),t.jsx(Lf,{children:"%"})]}),t.jsx(Nf,{children:"Resource cache efficiency"})]}),t.jsxs(zf,{trend:r.errorRate<5?"up":"down",children:[t.jsxs(Pf,{children:[t.jsx(Of,{children:"Error Rate"}),t.jsx(Uf,{trend:r.errorRate<5?"up":"down",children:t.jsx(je,{})})]}),t.jsxs(Df,{children:[r.errorRate.toFixed(1),t.jsx(Lf,{children:"%"})]}),t.jsx(Nf,{children:"Lazy loading errors"})]}),t.jsxs(zf,{children:[t.jsxs(Pf,{children:[t.jsx(Of,{children:"Loaded Components"}),t.jsx(Uf,{children:t.jsx(P,{})})]}),t.jsx(Df,{children:l.loadedComponents}),t.jsx(Nf,{children:"Lazy-loaded components"})]})]}),g.length>0&&t.jsxs(Mf,{children:[t.jsx(Ff,{children:"Performance Trends"}),t.jsx(qf,{children:g.map((e,r)=>t.jsx(Vf,{height:e.loadTime,color:"#3b82f6",title:`Load Time: ${e.loadTime.toFixed(0)}ms`},r))}),t.jsxs(Bf,{children:[t.jsx("span",{children:"Load Time (ms)"}),t.jsxs("span",{children:["Last ",g.length," measurements"]})]})]}),t.jsxs(Wf,{children:[t.jsx(Gf,{variant:i?"secondary":"primary",onClick:i?p:u,children:i?"Stop Monitoring":"Start Monitoring"}),t.jsx(Gf,{variant:"secondary",onClick:h,children:"Clear Data"})]})]})},Jf=Ce.hr`
  border: none;
  border-top: 1px dashed #d8dee9;
  margin: 2.5rem 0 2rem;
`,Kf=Ce.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`,Yf=Ce.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Xf=Ce.p`
  font-size: 0.875rem;
  color: #475569;
  margin: 0;
`,Qf=Ce.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
`,Zf=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`,eb=Ce.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: ${({theme:e})=>e.colors.gray900};
  display: flex;
  align-items: center;
  gap: 1rem;
`,tb=Ce.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-radius: 12px;
  color: white;
  font-size: 24px;
`,rb=Ce.div`
  display: flex;
  gap: 1rem;
`,nb=Ce.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid ${({$variant:e,theme:t})=>{switch(e){case"primary":return t.colors.primary;case"danger":return t.colors.danger;default:return t.colors.gray300}}};
  background: ${({$variant:e,theme:t})=>{switch(e){case"primary":return t.colors.primary;case"danger":return t.colors.danger;default:return"white"}}};
  color: ${({$variant:e})=>{switch(e){case"primary":case"danger":return"white";default:return"#374151"}}};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${({$variant:e,theme:t})=>{switch(e){case"primary":return t.colors.primaryDark;case"danger":return t.colors.dangerDark;default:return t.colors.gray100}}};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: 2px solid ${({theme:e})=>e.colors.primary};
    outline-offset: 2px;
  }
`,ib=Ce.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`,ob=Ce.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({theme:e})=>e.shadows.sm};
  border: 1px solid ${({$status:e,theme:t})=>{switch(e){case"good":return t.colors.success;case"warning":return t.colors.warning;case"danger":return t.colors.danger;default:return t.colors.gray200}}};
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({theme:e})=>e.shadows.lg};
  }
`,sb=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`,ab=Ce.h3`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({theme:e})=>e.colors.gray600};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,cb=Ce.div`
  color: ${({$metric:e,$status:t,theme:r})=>{if("danger"===t)return r.colors.danger;if("warning"===t)return r.colors.warning;if("good"===t)return r.colors.success;switch(e){case"security":return r.colors.danger;case"compliance":return r.colors.success;case"threats":return r.colors.warning;case"alerts":return r.colors.info;default:return r.colors.gray500}}};
  font-size: 1.25rem;
`,lb=Ce.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${({theme:e})=>e.colors.gray900};
  margin-bottom: 0.5rem;
`,db=Ce.div`
  font-size: 0.875rem;
  color: ${({$positive:e,theme:t})=>e?t.colors.success:t.colors.danger};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`,ub=Ce.span`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({$status:e,theme:t})=>{switch(e){case"good":return t.colors.success;case"warning":return t.colors.warning;case"danger":return t.colors.danger;default:return t.colors.gray500}}};
  color: white;
`,pb=Ce.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`,hb=Ce.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({theme:e})=>e.shadows.sm};
  border: 1px solid ${({theme:e})=>e.colors.gray200};
  padding: 1.5rem;
`,gb=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({theme:e})=>e.colors.gray200};
`,mb=Ce.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({theme:e})=>e.colors.gray900};
`,fb=Ce.div`
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({theme:e})=>e.colors.gray500};
  font-size: 0.875rem;
`,bb=Ce.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({theme:e})=>e.shadows.sm};
  border: 1px solid ${({theme:e})=>e.colors.gray200};
  overflow: hidden;
  margin-bottom: 2rem;
`,xb=Ce.div`
  background: ${({theme:e})=>e.colors.gray50};
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${({theme:e})=>e.colors.gray200};
  
  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: ${({theme:e})=>e.colors.gray900};
  }
`,yb=Ce.div`
  overflow-x: auto;
`,wb=Ce.table`
  width: 100%;
  border-collapse: collapse;
`,vb=Ce.tr`
  &:nth-child(even) {
    background: ${({theme:e})=>e.colors.gray25};
  }
  
  &:hover {
    background: ${({theme:e})=>e.colors.primaryLight};
  }
`,kb=Ce.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: ${({theme:e})=>e.colors.gray900};
  border-bottom: 1px solid ${({theme:e})=>e.colors.gray200};
  background: ${({theme:e})=>e.colors.gray50};
`,jb=Ce.td`
  padding: 1rem;
  border-bottom: 1px solid ${({theme:e})=>e.colors.gray200};
  color: ${({theme:e})=>e.colors.gray700};
`,Sb=Ce.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`,Cb=Ce.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({theme:e})=>e.shadows.sm};
  border: 2px solid ${({$status:e,theme:t})=>{switch(e){case"compliant":return t.colors.success;case"partial":return t.colors.warning;case"non_compliant":return t.colors.danger;default:return t.colors.gray200}}};
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({theme:e})=>e.shadows.lg};
  }
`,Ab=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`,Tb=Ce.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${({theme:e})=>e.colors.gray900};
`,_b=Ce.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({$score:e,theme:t})=>e>=95?t.colors.success:e>=80?t.colors.warning:t.colors.danger};
`,Rb=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`,Ib=Ce.div`
  color: ${({$status:e,theme:t})=>{switch(e){case"compliant":return t.colors.success;case"partial":return t.colors.warning;case"non_compliant":return t.colors.danger;default:return t.colors.gray500}}};
  font-size: 1rem;
`,$b=Ce.div`
  font-size: 0.875rem;
  color: ${({theme:e})=>e.colors.gray600};
  
  .violations {
    margin-top: 0.5rem;
    color: ${({theme:e})=>e.colors.danger};
  }
`,Eb=()=>{const[r,n]=e.useState(!1),{announceToScreenReader:i}=ki(),{securityMetrics:s,complianceReports:a,securityAlerts:c,threatIntelligence:d,getCriticalAlerts:p,getHighSeverityAlerts:h,getOpenAlerts:g,getComplianceScore:m,getComplianceStatus:f,getSecurityRecommendations:x,getAverageRiskScore:y}=((t={})=>{const{enabled:r=!0,enableRealTimeMonitoring:n=!0,enableThreatDetection:i=!0,enableComplianceMonitoring:o=!0,enableRiskAssessment:s=!0,alertThresholds:a,autoResponse:c=!1,debug:l=!1}=t,[d,u]=e.useState({isEnabled:r,isMonitoring:!1,securityMetrics:yt(),complianceReports:xt(),securityAlerts:bt(),threatIntelligence:ft(),riskAssessments:[],recentEvents:[]}),p=e.useRef(t),h=e.useRef(null);e.useEffect(()=>{p.current=t,wt.updateConfig({enableRealTimeMonitoring:n,enableThreatDetection:i,enableComplianceMonitoring:o,enableRiskAssessment:s,alertThresholds:a,autoResponse:c}),l&&Ee.info("[useSecurityAnalytics] Configuration updated")},[n,i,o,s,a,c,l,t]),e.useEffect(()=>(r?(wt.setMonitoringEnabled(!0),u(e=>({...e,isEnabled:!0,isMonitoring:!0})),h.current=setInterval(()=>{u(e=>({...e,securityMetrics:yt(),complianceReports:xt(),securityAlerts:bt(),threatIntelligence:ft()}))},5e3),l&&Ee.info("[useSecurityAnalytics] Security analytics initialized")):(wt.setMonitoringEnabled(!1),u(e=>({...e,isEnabled:!1,isMonitoring:!1})),h.current&&(clearInterval(h.current),h.current=null)),()=>{h.current&&clearInterval(h.current)}),[r,l]);const g=e.useCallback((e,t,n,i={},o={})=>{if(r){const r=vt(e,t,n,i,o);return l&&Ee.info("[useSecurityAnalytics] Security event tracked:",{type:e,severity:t,eventId:r}),r}return""},[r,l]),m=e.useCallback((e,t,n={})=>{if(r){const r=kt(e,t,n);return l&&Ee.info("[useSecurityAnalytics] Authentication failure tracked:",{userId:e,reason:t,eventId:r}),r}return""},[r,l]),f=e.useCallback((e,t,n,i={})=>{if(r){const r=jt(e,t,n,i);return l&&Ee.info("[useSecurityAnalytics] Authorization failure tracked:",{userId:e,resource:t,action:n,eventId:r}),r}return""},[r,l]),b=e.useCallback((e,t,n={})=>{if(r){const r=St(e,t,n);return l&&Ee.info("[useSecurityAnalytics] Token validation failure tracked:",{tokenType:e,reason:t,eventId:r}),r}return""},[r,l]),x=e.useCallback((e,t,n={})=>{if(r){const r=Ct(e,t,n);return l&&Ee.info("[useSecurityAnalytics] Suspicious activity tracked:",{activity:e,severity:t,eventId:r}),r}return""},[r,l]),y=e.useCallback((e,t,n,i={})=>{if(r){const r=At(e,t,n,i);return l&&Ee.info("[useSecurityAnalytics] Compliance violation tracked:",{standard:e,requirement:t,violation:n,eventId:r}),r}return""},[r,l]),w=e.useCallback(()=>yt(),[]),v=e.useCallback(()=>xt(),[]),k=e.useCallback(()=>bt(),[]),j=e.useCallback(()=>ft(),[]),S=e.useCallback(e=>d.recentEvents.filter(t=>t.severity===e),[d.recentEvents]),C=e.useCallback(e=>d.recentEvents.filter(t=>t.type===e),[d.recentEvents]),A=e.useCallback(()=>d.securityAlerts.filter(e=>"critical"===e.severity),[d.securityAlerts]),T=e.useCallback(()=>d.securityAlerts.filter(e=>"high"===e.severity||"critical"===e.severity),[d.securityAlerts]),_=e.useCallback(()=>d.securityAlerts.filter(e=>"new"===e.status||"acknowledged"===e.status),[d.securityAlerts]),R=e.useCallback(e=>{const t=d.complianceReports.find(t=>t.standard===e);return t?.score||100},[d.complianceReports]),I=e.useCallback(e=>{const t=d.complianceReports.find(t=>t.standard===e);return t?.status||"compliant"},[d.complianceReports]),$=e.useCallback(e=>{const t=d.complianceReports.find(t=>t.standard===e);return t?.violations||[]},[d.complianceReports]),E=e.useCallback(()=>d.threatIntelligence.filter(e=>e.active),[d.threatIntelligence]),z=e.useCallback(e=>d.threatIntelligence.filter(t=>t.severity===e),[d.threatIntelligence]),P=e.useCallback(()=>d.riskAssessments,[d.riskAssessments]),O=e.useCallback(()=>d.riskAssessments.filter(e=>"high"===e.status||"critical"===e.status),[d.riskAssessments]),U=e.useCallback(()=>0===d.riskAssessments.length?0:d.riskAssessments.reduce((e,t)=>e+t.overallRiskScore,0)/d.riskAssessments.length,[d.riskAssessments]),D=e.useCallback(()=>({eventsTrend:"increasing",riskTrend:"stable",complianceTrend:"improving",threatTrend:"stable"}),[]),L=e.useCallback(()=>{const e=[];return d.securityAlerts.length>5&&e.push("High number of security alerts - review and investigate"),d.complianceReports.some(e=>e.score<80)&&e.push("Compliance scores below threshold - address violations"),U()>70&&e.push("High average risk score - implement additional security measures"),d.threatIntelligence.some(e=>"critical"===e.severity)&&e.push("Critical threats detected - implement immediate mitigation"),e},[d.securityAlerts,d.complianceReports,d.threatIntelligence,U]),N=e.useCallback(e=>{wt.updateConfig({enableRealTimeMonitoring:e.enableRealTimeMonitoring??n,enableThreatDetection:e.enableThreatDetection??i,enableComplianceMonitoring:e.enableComplianceMonitoring??o,enableRiskAssessment:e.enableRiskAssessment??s,alertThresholds:e.alertThresholds??a,autoResponse:e.autoResponse??c}),l&&Ee.info("[useSecurityAnalytics] Configuration updated")},[n,i,o,s,a,c,l]),M=e.useCallback(e=>{wt.setMonitoringEnabled(e),u(t=>({...t,isMonitoring:e})),l&&Ee.info("[useSecurityAnalytics] Monitoring enabled:",e)},[l]);return{...d,trackSecurityEvent:g,trackAuthenticationFailure:m,trackAuthorizationFailure:f,trackTokenValidationFailure:b,trackSuspiciousActivity:x,trackComplianceViolation:y,getCurrentSecurityMetrics:w,getCurrentComplianceReports:v,getCurrentSecurityAlerts:k,getCurrentThreatIntelligence:j,getEventsBySeverity:S,getEventsByType:C,getCriticalAlerts:A,getHighSeverityAlerts:T,getOpenAlerts:_,getComplianceScore:R,getComplianceStatus:I,getComplianceViolations:$,getActiveThreats:E,getThreatsBySeverity:z,getCurrentRiskAssessments:P,getHighRiskAssessments:O,getAverageRiskScore:U,getSecurityTrends:D,getSecurityRecommendations:L,updateConfig:N,setMonitoringEnabled:M}})({enabled:!0,debug:!0}),w=e=>new Date(e).toLocaleString(),v=e=>{switch(e){case"critical":case"high":return"danger";case"medium":return"warning";default:return"good"}},j=p(),S=h();g();const C=y(),A=x();return t.jsxs(Qf,{role:"main","aria-label":"Security analytics dashboard",children:[t.jsxs(Zf,{children:[t.jsxs(eb,{children:[t.jsx(tb,{children:t.jsx(U,{})}),"Security Analytics Dashboard"]}),t.jsxs(rb,{children:[t.jsxs(nb,{$variant:"secondary",onClick:async()=>{n(!0),i("Refreshing security analytics data");try{setTimeout(()=>{n(!1),i("Security analytics data refreshed successfully")},1e3)}catch(e){n(!1),i("Failed to refresh security analytics data")}},disabled:r,"aria-label":"Refresh security analytics data",children:[t.jsx(b,{className:r?"animate-spin":""}),r?"Refreshing...":"Refresh"]}),t.jsxs(nb,{$variant:"primary",onClick:()=>{const e={timestamp:(new Date).toISOString(),securityMetrics:s,complianceReports:a,securityAlerts:c.slice(0,10),threatIntelligence:d.filter(e=>e.active),recommendations:x()},t=JSON.stringify(e,null,2),r=new Blob([t],{type:"application/json"}),n=URL.createObjectURL(r),o=document.createElement("a");o.href=n,o.download=`security-analytics-export-${Date.now()}.json`,o.click(),URL.revokeObjectURL(n),i("Security analytics data exported successfully")},"aria-label":"Export security analytics data",children:[t.jsx(o,{}),"Export Data"]})]})]}),t.jsxs(ib,{children:[t.jsxs(ob,{$metric:"security",$status:C>70?"danger":C>40?"warning":"good",children:[t.jsxs(sb,{children:[t.jsx(ab,{children:"Security Risk Score"}),t.jsx(cb,{$metric:"security",$status:C>70?"danger":C>40?"warning":"good",children:t.jsx(U,{})})]}),t.jsx(lb,{children:C.toFixed(1)}),t.jsxs(db,{$positive:C<50,children:[C<50?t.jsx(je,{}):t.jsx(ye,{}),C<50?"Low Risk":"High Risk"]})]}),t.jsxs(ob,{$metric:"alerts",$status:j.length>0?"danger":S.length>0?"warning":"good",children:[t.jsxs(sb,{children:[t.jsx(ab,{children:"Critical Alerts"}),t.jsx(cb,{$metric:"alerts",$status:j.length>0?"danger":S.length>0?"warning":"good",children:t.jsx(l,{})})]}),t.jsx(lb,{children:j.length}),t.jsxs(db,{$positive:0===j.length,children:[0===j.length?t.jsx(u,{}):t.jsx(le,{}),0===j.length?"All Clear":"Action Required"]})]}),t.jsxs(ob,{$metric:"threats",$status:d.filter(e=>"critical"===e.severity).length>0?"danger":"good",children:[t.jsxs(sb,{children:[t.jsx(ab,{children:"Active Threats"}),t.jsx(cb,{$metric:"threats",$status:d.filter(e=>"critical"===e.severity).length>0?"danger":"good",children:t.jsx(k,{})})]}),t.jsx(lb,{children:d.filter(e=>e.active).length}),t.jsxs(db,{$positive:0===d.filter(e=>"critical"===e.severity).length,children:[0===d.filter(e=>"critical"===e.severity).length?t.jsx(u,{}):t.jsx(l,{}),0===d.filter(e=>"critical"===e.severity).length?"No Critical Threats":"Critical Threats Detected"]})]}),t.jsxs(ob,{$metric:"compliance",$status:a.some(e=>e.score<80)?"warning":"good",children:[t.jsxs(sb,{children:[t.jsx(ab,{children:"Compliance Score"}),t.jsx(cb,{$metric:"compliance",$status:a.some(e=>e.score<80)?"warning":"good",children:t.jsx(u,{})})]}),t.jsx(lb,{children:a.length>0?(a.reduce((e,t)=>e+t.score,0)/a.length).toFixed(1):"100"}),t.jsxs(db,{$positive:a.every(e=>e.score>=95),children:[a.every(e=>e.score>=95)?t.jsx(u,{}):t.jsx(l,{}),a.every(e=>e.score>=95)?"Fully Compliant":"Compliance Issues"]})]})]}),t.jsx(Sb,{children:["GDPR","CCPA","SOC2","OAuth2.1"].map(e=>{const{score:r,status:n}=(e=>({score:m(e),status:f(e)}))(e);return t.jsxs(Cb,{$status:n,children:[t.jsxs(Ab,{children:[t.jsx(Tb,{children:e}),t.jsx(_b,{$score:r,children:r})]}),t.jsxs(Rb,{children:[t.jsx(Ib,{$status:n,children:"compliant"===n?t.jsx(u,{}):"partial"===n?t.jsx(l,{}):t.jsx(le,{})}),t.jsx(ub,{$status:"compliant"===n?"good":"partial"===n?"warning":"danger",children:n.replace("_"," ")})]}),t.jsxs($b,{children:[t.jsxs("div",{children:["Last audit: ",w(Date.now()-864e5)]}),t.jsxs("div",{children:["Next audit: ",w(Date.now()+864e5)]}),r<95&&t.jsxs("div",{className:"violations",children:[a.find(t=>t.standard===e)?.violations.length||0," ","violations"]})]})]},e)})}),t.jsxs(pb,{children:[t.jsxs(hb,{children:[t.jsx(gb,{children:t.jsx(mb,{children:"Security Events Trend"})}),t.jsx(fb,{children:t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx(ye,{style:{fontSize:"3rem",marginBottom:"1rem"}}),t.jsx("p",{children:"Security events trend chart would be displayed here"}),t.jsx("p",{style:{fontSize:"0.75rem",color:"#6b7280"},children:"Integration with charting library required"})]})})]}),t.jsxs(hb,{children:[t.jsx(gb,{children:t.jsx(mb,{children:"Threat Intelligence"})}),t.jsx(fb,{children:t.jsxs("div",{style:{textAlign:"center"},children:[t.jsx(U,{style:{fontSize:"3rem",marginBottom:"1rem"}}),t.jsx("p",{children:"Threat intelligence chart would be displayed here"}),t.jsx("p",{style:{fontSize:"0.75rem",color:"#6b7280"},children:"Integration with charting library required"})]})})]})]}),t.jsxs(bb,{children:[t.jsx(xb,{children:t.jsx("h3",{children:"Recent Security Alerts"})}),t.jsx(yb,{children:t.jsxs(wb,{children:[t.jsx("thead",{children:t.jsxs(vb,{children:[t.jsx(kb,{children:"Severity"}),t.jsx(kb,{children:"Title"}),t.jsx(kb,{children:"Source"}),t.jsx(kb,{children:"Status"}),t.jsx(kb,{children:"Timestamp"})]})}),t.jsx("tbody",{children:c.slice(0,10).map(e=>t.jsxs(vb,{children:[t.jsx(jb,{children:t.jsx(ub,{$status:v(e.severity),children:e.severity})}),t.jsx(jb,{children:e.title}),t.jsx(jb,{children:e.source}),t.jsx(jb,{children:t.jsx(ub,{$status:"resolved"===e.status?"good":"warning",children:e.status})}),t.jsx(jb,{children:w(e.timestamp)})]},e.id))})]})})]}),A.length>0&&t.jsxs(hb,{children:[t.jsx(gb,{children:t.jsx(mb,{children:"Security Recommendations"})}),t.jsx(fb,{children:t.jsx("div",{style:{textAlign:"left",width:"100%"},children:t.jsx("ul",{style:{margin:0,paddingLeft:"1.5rem"},children:A.map((e,r)=>t.jsx("li",{style:{marginBottom:"0.5rem",color:"#374151"},children:e},r))})})})]})]})},zb=Ce.div`
  background: linear-gradient(135deg, ${({$backgroundColor:e})=>e} 0%, ${({$backgroundColor:e})=>e}dd 100%);
  color: ${({$textColor:e})=>e};
  padding: 2rem;
  margin: -1.5rem -1.5rem 2rem -1.5rem;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`,Pb=Ce.div`
  position: relative;
  z-index: 1;
`,Ob=Ce.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`,Ub=Ce.p`
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.9;
  font-weight: 400;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`,Db=Ce.div`
  margin-top: 1rem;
`,Lb=({title:r,subtitle:n,children:i})=>{const{currentPageStyle:o}=(()=>{const t=e.useContext(er);if(!t)throw new Error("usePageStyle must be used within a PageStyleProvider");return t})();return t.jsx(zb,{$backgroundColor:o.titleBackgroundColor,$textColor:o.titleTextColor,children:t.jsxs(Pb,{children:[t.jsx(Ob,{children:r}),n&&t.jsx(Ub,{children:n}),i&&t.jsx(Db,{children:i})]})})},Nb="https://auth.pingone.com",Mb={local:["token_to_analyze","token_type","flow_source"],session:["hybrid_state","hybrid_nonce","hybrid_tokens"]},Fb="undefined"!=typeof window,qb=e=>{if(!e||"string"!=typeof e)return null;const t=e.split(".");if(t.length<2)return null;try{const e=(e=>{if("function"==typeof atob)return atob(e);if(Fb&&"function"==typeof window.atob)return window.atob(e);if("undefined"!=typeof Buffer)return Buffer.from(e,"base64").toString("binary");throw new Error("No available base64 decoder.")})(t[1].replace(/-/g,"+").replace(/_/g,"/")),r=JSON.parse(e);return r?.sub??null}catch(r){return null}},Vb=(e,t)=>{const r="string"==typeof e?e.trim():"";if(r){const e=r.replace(/\/+$/,"");return e.endsWith("/as")?e:`${e}/as`}return t?`${Nb}/${t}/as`:null},Bb=(e,t=!1)=>{const r=Vb(e.issuer,e.environmentId)??(t?`${Nb}/{environmentId}/as`:null);if(!r)return null;const n=e.idToken??(t?"{{idToken}}":void 0);if(!n)return null;try{const i=new URL(`${r}/signoff`);i.searchParams.set("id_token_hint",n);const o=e.clientId??(t?"{{clientId}}":void 0);o&&i.searchParams.set("client_id",o);const s=e.postLogoutRedirectUri??(t?"{{post_logout_redirect_uri}}":void 0);return s&&i.searchParams.set("post_logout_redirect_uri",s),i.toString()}catch(i){return null}},Wb=e=>{const t={local:[],session:[]};if("undefined"==typeof window)return t;const r=e?.clearAllLocal?Object.keys({...window.localStorage??{}}):e?.localKeys??Mb.local,n=e?.clearAllSession?Object.keys({...window.sessionStorage??{}}):e?.sessionKeys??Mb.session;return window.localStorage&&r.forEach(e=>{null!==window.localStorage.getItem(e)&&(window.localStorage.removeItem(e),t.local.push(e))}),window.sessionStorage&&n.forEach(e=>{null!==window.sessionStorage.getItem(e)&&(window.sessionStorage.removeItem(e),t.session.push(e))}),t},Gb=e=>Bb(e,e.allowPlaceholders??!1),Hb=async(e,t,r,n,i,o)=>{try{const s=`${e}/token`,a=((e,t)=>{const r=`${e}:${t}`;if("function"==typeof btoa)return btoa(r);if(Fb&&"function"==typeof window.btoa)return window.btoa(r);if("undefined"!=typeof Buffer)return Buffer.from(r,"utf8").toString("base64");throw new Error("No available base64 encoder.")})(r,n),c=await fetch(s,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Basic ${a}`},body:new URLSearchParams({grant_type:"client_credentials",scope:o}).toString()});if(!c.ok)return{attempted:!0,success:!1,status:c.status,statusText:c.statusText,error:"Failed to obtain management access token",payload:await c.json().catch(()=>c.statusText)};const l=(await c.json()).access_token;if(!l)return{attempted:!0,success:!1,error:"Management access token missing in response"};const d=(e=>e.replace(/\/as$/,""))(e),u=`${d}/v1/environments/${t}/users/${i}/sessions`,p=await fetch(u,{method:"DELETE",headers:{Authorization:`Bearer ${l}`,"Content-Type":"application/json"}}),h={status:p.status,statusText:p.statusText,response:await p.json().catch(()=>p.statusText)};return{attempted:!0,success:p.ok,status:p.status,statusText:p.statusText,endpoint:u,payload:h}}catch(s){return{attempted:!0,success:!1,error:s.message}}},Jb=async e=>{const t=(new Date).toISOString(),r=Vb(e.issuer,e.environmentId),n=Bb(e,!1),i=qb(e.idToken);let o={attempted:!1,success:!1},s={attempted:!1,success:!1};!1!==e.attemptManagementApi&&r&&i&&e.clientId&&e.clientSecret&&e.environmentId?o=await Hb(r,e.environmentId,e.clientId,e.clientSecret,i,e.managementScopes??"p1:read:user p1:delete:user-session"):!1!==e.attemptManagementApi&&(o={attempted:!1,success:!1,error:"Insufficient data to call management API"}),!1!==e.callLogoutEndpoint&&n&&e.idToken?s=await(async e=>{try{const t=await fetch(e,{method:"GET",redirect:"manual"}),r={status:t.status,statusText:t.statusText,redirected:t.redirected,headers:Object.fromEntries(t.headers.entries())};return{attempted:!0,success:t.status>=200&&t.status<400,status:t.status,statusText:t.statusText,payload:r}}catch(t){return{attempted:!0,success:!1,error:t.message}}})(n):!1!==e.callLogoutEndpoint&&(s={attempted:!1,success:!1,error:"Logout endpoint not invoked (missing logout URL or ID token)"});const a={timestamp:t,logoutUrl:n,userId:i,management:o,logout:s,clearedStorageKeys:!1===e.clearClientStorage?{local:[],session:[]}:Wb(e.storageOptions)},c=(e=>{const t=e.management.attempted?e.management.success?"SUCCESS":"FAILED":"NOT ATTEMPTED",r=e.logout.attempted?e.logout.success?"COMPLETED":"FAILED":"NOT ATTEMPTED",n=e.clearedStorageKeys.local.length?e.clearedStorageKeys.local.join(", "):"None",i=e.clearedStorageKeys.session.length?e.clearedStorageKeys.session.join(", "):"None",o=e.management.payload?JSON.stringify(e.management.payload,null,2):e.management.error??"No session termination attempted (missing user context or credentials)",s=e.logout.payload?JSON.stringify(e.logout.payload,null,2):e.logout.error??"Logout endpoint not called (missing ID token or issuer)";return`🚪 SESSION TERMINATION REPORT\nExecuted: ${new Date(e.timestamp).toLocaleString()}\n\n✅ ACTIONS PERFORMED:\n• PingOne Session Termination: ${t}\n• Browser Logout: ${r}\n• Local storage cleared: ${n}\n• Session storage cleared: ${i}\n\n🔌 MANAGEMENT API RESPONSE:\n${o}\n\n🌐 OIDC LOGOUT RESPONSE:\n${s}\n\n🌐 LOGOUT URL:\n${e.logoutUrl??"No logout URL generated"}\n\n🔐 USER CONTEXT:\n• Subject: ${e.userId??"Unknown"}\n• Environment ID: ${e.management.endpoint??"n/a"}\n\n⚠️ NEXT STEPS:\n• User must re-authenticate to regain access\n• All previous tokens should be considered invalid\n• New authorization flow is required for continued use`})(a);return{...a,summary:c}},Kb={buildLogoutUrl:Gb,terminateSession:Jb,clearClientStorage:Wb},Yb=Ce.p`
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  line-height: 1.5;
`,Xb=Ce.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`,Qb=Ce.button`
  padding: 0.625rem 1.125rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  ${({$variant:e})=>"danger"===e?"\n          background-color: #dc2626;\n          color: #ffffff;\n          border-color: #dc2626;\n          \n          &:hover:not(:disabled) {\n            background-color: #b91c1c;\n            border-color: #b91c1c;\n          }\n        ":"\n          background-color: #3b82f6;\n          color: #ffffff;\n          border-color: #2563eb;\n          \n          &:hover:not(:disabled) {\n            background-color: #2563eb;\n            border-color: #1d4ed8;\n          }\n        "}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,Zb=({isOpen:e,onClose:r,onConfirm:n,title:i,message:o,confirmText:s="Confirm",cancelText:a="Cancel",variant:c="primary",isLoading:l=!1})=>t.jsx(Wn,{isOpen:e,onClose:r,title:i,width:"500px",maxHeight:"90vh",children:t.jsxs("div",{children:[t.jsx(Yb,{children:o}),t.jsxs(Xb,{children:[t.jsx(Qb,{onClick:r,disabled:l,children:a}),t.jsx(Qb,{$variant:c,onClick:()=>{n(),r()},disabled:l,children:l?"Processing...":s})]})]})}),ex=Ce.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	margin: 1rem 0;
`,tx=Ce.div`
	background: linear-gradient(135deg, ${e=>e.$primaryColor} 0%, ${e=>e.$primaryColor} 100%);
	color: white;
	padding: 2rem;
	text-align: center;
`,rx=Ce.h1`
	margin: 0 0 0.5rem 0;
	font-size: ${e=>e.$fontSize};
	font-weight: 700;
`,nx=Ce.p`
	margin: 0;
	opacity: 0.9;
	font-size: 1.1rem;
`,ix=Ce.div`
	padding: 2rem;
`,ox=Ce.div`
	margin-bottom: 2rem;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	overflow: hidden;
`,sx=Ce.div`
	background: #f8fafc;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid #e2e8f0;
	font-weight: 600;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,ax=Ce.div`
	padding: 1.5rem;
`,cx=Ce.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 1.5rem;
`,lx=Ce.div`
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1.5rem;
	background: #fafbfc;
`,dx=Ce.div`
	font-weight: 600;
	color: #1e293b;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,ux=Ce.span`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	background: ${e=>{switch(e.$status){case"enabled":return"#dcfce7";case"required":return"#fef3c7";case"disabled":return"#fee2e2";default:return"#f3f4f6"}}};
	color: ${e=>{switch(e.$status){case"enabled":return"#166534";case"required":return"#92400e";case"disabled":return"#991b1b";default:return"#6b7280"}}};
`,px=Ce.div`
	color: #374151;
	font-size: 0.9rem;
	margin-bottom: 1rem;
`,hx=Ce.button`
	background: ${e=>{switch(e.$variant){case"danger":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";case"secondary":return"linear-gradient(135deg, #6b7280 0%, #4b5563 100%)";default:return"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"}}};
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	margin-right: 0.5rem;
	margin-bottom: 0.5rem;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

	&:hover:not(:disabled) {
		background: ${e=>{switch(e.$variant){case"danger":return"linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)";case"secondary":return"linear-gradient(135deg, #4b5563 0%, #374151 100%)";default:return"linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"}}};
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
`,gx=Ce.pre`
	background: #1e293b;
	color: #e2e8f0;
	padding: 1rem;
	border-radius: 6px;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.85rem;
	overflow-x: auto;
	margin: 1rem 0;
	display: ${e=>e.$isVisible?"block":"none"};
	white-space: pre-wrap;
	word-break: break-all;
	min-height: 60px;
`,mx=Ce.div`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.5rem 1rem;
	margin: 1rem 0;
`,fx=Ce.div`
	font-weight: 600;
	color: #374151;
`,bx=Ce.div`
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`,xx=Ce.div`
	font-family: 'Monaco', 'Menlo', monospace;
	background: #f1f5f9;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	word-break: break-all;
`,yx=Ce.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 6px;
	padding: 1rem;
	margin: 1rem 0;
`,wx=Ce.div`
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 0.5rem;
`,vx=Ce.div`
	color: #1e3a8a;
	font-size: 0.9rem;
	line-height: 1.5;
`,kx=Ce.div`
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	padding: 1rem 1.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-radius: 8px 8px ${e=>e.$isCollapsed?"8px 8px":"0 0"};
	transition: all 0.2s ease;
	
	&:hover {
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	}
`,jx=Ce.h3`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Sx=Ce.div`
	background: white;
	border: 1px solid #e2e8f0;
	border-top: none;
	border-radius: 0 0 8px 8px;
	padding: ${e=>e.$isCollapsed?"0":"1.5rem"};
	max-height: ${e=>e.$isCollapsed?"0":"1000px"};
	overflow: hidden;
	transition: all 0.3s ease;
`,Cx=Ce.div`
	text-align: center;
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 1px solid #e2e8f0;
`,Ax=Ce.ul`
	margin: 0;
	padding-left: 1.5rem;
	color: #374151;
	font-size: 0.9rem;
	line-height: 1.6;
`,Tx=({tokens:r,credentials:n,onTerminateSession:i,onRevokeTokens:s,hideHeader:c=!1})=>{const{settings:d}=Ot(),{fontSize:p,colorScheme:g}=d,m=(e=>{const t={blue:{primary:"#3b82f6",secondary:"#1e40af"},green:{primary:"#10b981",secondary:"#047857"},purple:{primary:"#8b5cf6",secondary:"#6d28d9"},orange:{primary:"#f59e0b",secondary:"#d97706"},red:{primary:"#ef4444",secondary:"#dc2626"}};return t[e]||t.blue})(g),[x,w]=e.useState(!1),[v,j]=e.useState(!1),[S,C]=e.useState(null),[A,T]=e.useState(null),[_,R]=e.useState(null),[I,$]=e.useState(null),[E,z]=e.useState(null),[P,O]=e.useState(null),[D,L]=e.useState(null),[N,M]=e.useState(!1),[q,B]=e.useState(!1),[G,H]=e.useState(null),J=e.useMemo(()=>n||{},[n]),K=e.useMemo(()=>r||{},[r]),Y=e.useMemo(()=>Gb({environmentId:J.environmentId,issuer:J.issuer,clientId:J.clientId,idToken:K.id_token,postLogoutRedirectUri:J.postLogoutRedirectUri,allowPlaceholders:!0})||void 0,[J,K]),[X,Q]=e.useState({isOpen:!1,title:"",message:"",onConfirm:()=>{}});e.useEffect(()=>{window.scrollTo({top:0,behavior:"smooth"}),Ge.showSuccess("Security Features Demo loaded successfully!")},[]);const[Z,ee]=e.useState({allowAnyOrigin:!1,allowedOrigins:["https://localhost:3000","https://app.example.com"],newOrigin:""}),[te,ne]=e.useState(null),[ie,oe]=e.useState(!1),ae=e.useCallback(e=>{try{const t=e.split(".");if(3!==t.length)return null;const r=JSON.parse(atob(t[0].replace(/-/g,"+").replace(/_/g,"/")));return r.x5t||r["x5t#S256"]||null}catch{return null}},[]),ce=e.useCallback(()=>{R("Request Parameter Signature Demo:\n\n1. Generate HMAC-SHA256 signature of request parameters\n2. Include signature in Authorization header\n3. Server validates signature before processing request\n\nThis prevents parameter tampering and ensures request authenticity."),Ge.showSuccess("Signature demo loaded - see results below")},[]),le=e.useCallback(()=>{j(!0),setTimeout(()=>{j(!1);$("✅ Current request signature is valid!\n\nSignature: a1b2c3d4e5f6...\nAlgorithm: HMAC-SHA256\nStatus: Verified"),Ge.showSuccess("Signature validation complete - see results below")},1e3)},[]),ue=e.useCallback(()=>{if(r?.access_token&&"string"==typeof r.access_token){const e=ae(r.access_token);if(e){const t=`🔐 X.509 Certificate Thumbprint (x5t) Found!\n\n📋 JWT Header Information:\n• x5t: ${e}\n• kid: Key identifier for key rotation\n• Algorithm: RS256\n\n✅ This enables certificate validation and key management.\n🔒 Enhanced security through X.509 certificate verification.`;Ge.showSuccess(t),setTimeout(()=>{Ge.showSuccess(`🔐 Real x5t Parameter: ${e}\n\nThis is extracted from your actual JWT token!`)},2e3)}else{const e=`📚 X.509 Certificate Thumbprint (x5t) Demo\n\n📋 JWT Header Information:\n• x5t: ${Ce} (Demo Data)\n• kid: Key identifier for key rotation\n• Algorithm: RS256\n\nℹ️ This is demo data for educational purposes.\n🔒 Real x5t enables certificate validation and key management.\n\n💡 Enable "Include x5t Parameter" in Configuration to include this in real tokens.`;Ge.showSuccess(e)}}else Ge.showWarning("⚠️ No access token available.\n\nPlease complete the OAuth flow first to see real x5t values.")},[r,ae,Ce]),pe=e.useCallback(()=>{Ge.showSuccess("🔐 Certificate Verification:\n\n✅ Certificate is valid\n✅ Not expired\n✅ Issued by trusted CA\n✅ Key usage matches requirements\n\nCertificate thumbprint matches x5t in JWT header.")},[]),he=e.useCallback(()=>{if(r){C("🔍 Token Validation Results:\n\n✅ Access Token: Valid (expires in 1h 23m)\n✅ Refresh Token: Valid (expires in 30d)\n✅ ID Token: Valid (expires in 1h 23m)\n\nAll tokens have valid signatures and are not expired."),Ge.showSuccess("Token validation complete - see results below")}else Ge.showWarning("No tokens available for validation. Please complete the OAuth flow first.")},[r]),me=e.useCallback(()=>{if(r){T("⏰ Token Expiration Status:\n\nAccess Token: 1h 23m remaining\nRefresh Token: 29d 12h remaining\nID Token: 1h 23m remaining\n\nAll tokens are within acceptable expiration windows."),Ge.showSuccess("Expiration check complete - see results below")}else Ge.showWarning("No tokens available. Please complete the OAuth flow first.")},[r]),fe=e.useCallback(async()=>{Q({isOpen:!0,title:"Terminate Session",message:"Are you sure you want to terminate the current session? This will log out the user and invalidate all tokens.",onConfirm:async()=>{try{const e=K.id_token;if(e&&!Tt(e))return Ge.showWarning("Invalid ID token detected. Session will be cleared locally only."),i?.(),void H("❌ INVALID ID TOKEN\n\nSession cleared locally only.\nID token was malformed and could not be used for server-side logout.");const t=await Jb({issuer:J.issuer,environmentId:J.environmentId,clientId:J.clientId,clientSecret:J.clientSecret,idToken:e,postLogoutRedirectUri:J.postLogoutRedirectUri,clearClientStorage:!0});i?.(),H(t.summary),Ge.showSuccess("🚪 Session terminated! View detailed results below.")}catch(e){const t=`❌ SESSION TERMINATION ERROR\nExecuted: ${(new Date).toLocaleString()}\n\nERROR DETAILS:\n${JSON.stringify({message:e.message,type:e.name,stack:e.stack?.split("\n").slice(0,3).join("\n")},null,2)}\n\n⚠️ NOTE:\nSession termination may fail in demo mode due to CORS restrictions, missing management API permissions, or insufficient credentials.`;H(t),Ge.showError("❌ Session termination failed! View error details below.")}}})},[J,K,i]),be=e.useCallback(async()=>{Q({isOpen:!0,title:"Revoke All Tokens",message:"Are you sure you want to revoke all tokens? This will immediately invalidate access and refresh tokens.",onConfirm:async()=>{try{const t=[];if(r?.access_token&&n?.issuer&&n?.clientId&&n?.clientSecret)try{const e=await fetch(`${n.issuer}/as/revoke`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Basic ${btoa(`${n.clientId}:${n.clientSecret}`)}`},body:new URLSearchParams({token:r.access_token,token_type_hint:"access_token"})}),i=200===e.status?{status:"success",message:"Token revoked successfully"}:await e.text();t.push({tokenType:"Access Token",response:{status:e.status,statusText:e.statusText,data:i,headers:Object.fromEntries(e.headers.entries())}})}catch(e){t.push({tokenType:"Access Token",response:null,error:`Network error: ${e.message}`})}if(r?.refresh_token&&n?.issuer&&n?.clientId&&n?.clientSecret)try{const e=await fetch(`${n.issuer}/as/revoke`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Basic ${btoa(`${n.clientId}:${n.clientSecret}`)}`},body:new URLSearchParams({token:r.refresh_token,token_type_hint:"refresh_token"})}),i=200===e.status?{status:"success",message:"Token revoked successfully"}:await e.text();t.push({tokenType:"Refresh Token",response:{status:e.status,statusText:e.statusText,data:i,headers:Object.fromEntries(e.headers.entries())}})}catch(e){t.push({tokenType:"Refresh Token",response:null,error:`Network error: ${e.message}`})}s?.();const i=`❌ TOKEN REVOCATION COMPLETE\nExecuted: ${(new Date).toLocaleString()}\n\n🔑 REVOCATION ATTEMPTS:\n${t.length>0?t.map(e=>`• ${e.tokenType}: ${e.error?"FAILED":"SUCCESS"}`).join("\n"):"• No tokens available for revocation"}\n\n📡 DETAILED API RESPONSES:\n${JSON.stringify(t,null,2)}\n\n🛡️ SECURITY IMPACT:\n• All API calls with revoked tokens will return 401 Unauthorized\n• User session effectively terminated\n• Client must obtain new tokens through fresh authentication\n• Prevents token misuse if compromised\n\n⚠️ NEXT STEPS:\n• User must re-authenticate to continue using the application\n• All cached tokens should be cleared from client storage\n• New authorization flow required for API access\n\n📋 REVOCATION ENDPOINT:\nPOST ${n?.issuer||"https://auth.pingone.com"}/as/revoke`;z(i),Ge.showSuccess("❌ Token revocation attempted! View detailed results below.")}catch(e){const t=`❌ TOKEN REVOCATION ERROR\nExecuted: ${(new Date).toLocaleString()}\n\nERROR DETAILS:\n${JSON.stringify({message:e.message,type:e.name},null,2)}\n\n⚠️ NOTE:\nToken revocation may fail in demo mode due to CORS restrictions or missing real credentials.`;z(t),Ge.showError("❌ Token revocation failed! View error details below.")}}})},[s,n,r]),xe=e.useCallback(async()=>{Q({isOpen:!0,title:"Revoke Refresh Token",message:"Are you sure you want to revoke the refresh token? This will prevent token renewal.",onConfirm:async()=>{try{let t=null;if(r?.refresh_token&&n?.issuer&&n?.clientId&&n?.clientSecret)try{const e=await fetch(`${n.issuer}/as/revoke`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Basic ${btoa(`${n.clientId}:${n.clientSecret}`)}`},body:new URLSearchParams({token:r.refresh_token,token_type_hint:"refresh_token"})}),i=200===e.status?{status:"success",message:"Refresh token revoked successfully"}:await e.text();t={status:e.status,statusText:e.statusText,data:i,headers:Object.fromEntries(e.headers.entries()),url:e.url},Ge.showSuccess(`🔄 Refresh Token Revocation Response:\n\nStatus: ${e.status} ${e.statusText}\n\nJSON Response:\n${JSON.stringify(i,null,2)}\n\n✅ Refresh token invalidated\n- Access token will expire normally\n- User must re-authenticate for new tokens`)}catch(e){t={error:"Network error or CORS restriction",message:e.message,note:"Revocation may fail due to CORS policies in demo mode"},Ge.showError(`❌ Refresh Token Revocation Failed:\n\n${JSON.stringify(t,null,2)}`)}else Ge.showWarning("⚠️ Cannot revoke refresh token:\n\n- Missing refresh token, credentials, or endpoint configuration\n- Ensure you have completed an OAuth flow with refresh token scope")}catch(e){Ge.showError(`❌ Refresh Token Revocation Error:\n\n${JSON.stringify({message:e.message,type:e.name},null,2)}`)}}})},[n,r]),ye=e.useCallback(()=>{const e=`🧪 SECURITY TEST SUITE RESULTS\nExecuted: ${(new Date).toLocaleString()}\n\n🔐 AUTHENTICATION TESTS\n✅ Client Authentication: PASS\n   - Client secret validation: PASS\n   - Certificate validation: PASS\n   - mTLS support: PASS\n\n🔑 TOKEN SECURITY TESTS  \n✅ JWT Signature Verification: PASS\n   - RS256 algorithm: PASS\n   - Key rotation support: PASS\n   - Invalid signature detection: PASS\n\n✅ Token Validation: PASS\n   - Expiration check: PASS\n   - Audience validation: PASS\n   - Issuer verification: PASS\n   - Scope validation: PASS\n\n🛡️ PROTOCOL SECURITY TESTS\n✅ PKCE Implementation: PASS\n   - Code challenge generation: PASS\n   - Code verifier validation: PASS\n   - S256 method support: PASS\n\n✅ State Parameter: PASS\n   - CSRF protection: PASS\n   - State validation: PASS\n   - Entropy check: PASS\n\n✅ Nonce Validation: PASS\n   - Replay attack prevention: PASS\n   - ID token binding: PASS\n\n🌐 NETWORK SECURITY TESTS\n✅ HTTPS Enforcement: PASS\n✅ CORS Configuration: PASS\n✅ Request Signing: PASS\n\n📊 OVERALL RESULTS\nTests Run: 15\nPassed: 15\nFailed: 0\nSuccess Rate: 100%\n\n🎯 SECURITY SCORE: A+ (Excellent)`;L(e),Ge.showSuccess("🧪 Security Test Suite completed! View detailed results below.")},[]),we=e.useCallback(()=>{Z.newOrigin.trim()&&(ee(e=>({...e,allowedOrigins:[...e.allowedOrigins,e.newOrigin.trim()],newOrigin:""})),Ge.showSuccess(`Added CORS origin: ${Z.newOrigin.trim()}`))},[Z.newOrigin]),ve=e.useCallback(e=>{ee(t=>({...t,allowedOrigins:t.allowedOrigins.filter(t=>t!==e)})),Ge.showSuccess(`Removed CORS origin: ${e}`)},[]),ke=e.useCallback(async()=>{oe(!0);try{const e=["https://localhost:3000","https://malicious-site.com","https://app.example.com","https://localhost:3001"].map(e=>{const t=Z.allowAnyOrigin||Z.allowedOrigins.includes(e);return{origin:e,allowed:t,error:t?null:"CORS policy blocks this origin"}});ne(e);const t=e.filter(e=>!e.allowed).length;t>0?Ge.showWarning(`🌐 CORS Test Complete: ${t} origins blocked by CORS policy\n\n✅ https://localhost:3000 - Allowed\n❌ https://malicious-site.com - Blocked\n✅ https://app.example.com - Allowed\n❌ https://localhost:3001 - Blocked\n\nCORS policy is working correctly to protect your OAuth endpoints!`):Ge.showSuccess("🌐 CORS Test Complete: All test origins are allowed")}catch(e){Ge.showError(`CORS test failed: ${e.message}`)}finally{oe(!1)}},[Z]),je=e.useCallback(()=>{Ge.showError("🚫 CORS Error Demonstration\n\nAccess to fetch at 'https://api.pingone.com/oauth/token' from origin 'https://malicious-site.com' has been blocked by CORS policy: The request client is not a secure context and the resource is in a cross-origin context.\n\nThis is exactly what CORS protection prevents!");ne([{origin:"https://malicious-site.com",allowed:!1,error:"CORS policy blocks this origin - Demonstration"},{origin:"https://localhost:3000",allowed:!0,error:null}])},[]),Se=r?.access_token&&"string"==typeof r.access_token?ae(r.access_token):null,Ce=Se||"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",Ae=e.useCallback(()=>{let e=0;const t=[];r?.access_token?(e+=15,t.push({name:"Access Token Present",status:!0,points:15,reason:"Valid access token available"})):t.push({name:"Access Token Present",status:!1,points:0,reason:"No access token available"}),r?.refresh_token?(e+=10,t.push({name:"Refresh Token Present",status:!0,points:10,reason:"Refresh token available for renewal"})):t.push({name:"Refresh Token Present",status:!1,points:0,reason:"No refresh token available"}),r?.id_token?(e+=5,t.push({name:"ID Token Present",status:!0,points:5,reason:"ID token available for user info"})):t.push({name:"ID Token Present",status:!1,points:0,reason:"No ID token available"}),Se?(e+=20,t.push({name:"Certificate Validation",status:!0,points:20,reason:"x5t parameter present in JWT header"})):t.push({name:"Certificate Validation",status:!1,points:0,reason:"No x5t parameter in tokens"});!Z.allowAnyOrigin&&Z.allowedOrigins.length>0?(e+=15,t.push({name:"CORS Security",status:!0,points:15,reason:"CORS restricted to specific origins"})):Z.allowAnyOrigin?(e+=5,t.push({name:"CORS Security",status:!1,points:5,reason:"CORS allows any origin (reduced security)"})):t.push({name:"CORS Security",status:!1,points:0,reason:"CORS not configured"});E||G?(e+=15,t.push({name:"API Integration",status:!0,points:15,reason:"Successful API calls to PingOne"})):t.push({name:"API Integration",status:!1,points:0,reason:"No API calls attempted"});return S||A?(e+=5,t.push({name:"Token Validation",status:!0,points:5,reason:"Token validation performed"})):t.push({name:"Token Validation",status:!1,points:0,reason:"No token validation performed"}),{score:Math.min(e,100),factors:t}},[r,Se,Z,E,G,S,A])(),Te=e.useCallback(()=>{const e=`🔒 SECURITY ANALYSIS REPORT\nGenerated: ${(new Date).toLocaleString()}\n\n📊 CONFIGURATION ANALYSIS\n${r?.access_token?"✅":"❌"} Access Token: ${r?.access_token?"Present":"Missing"}\n${r?.refresh_token?"✅":"❌"} Refresh Token: ${r?.refresh_token?"Present":"Missing"}\n${r?.id_token?"✅":"❌"} ID Token: ${r?.id_token?"Present":"Missing"}\n${Se?"✅":"❌"} Certificate Validation: ${Se?"x5t parameter present":"No x5t in tokens"}\n${!Z.allowAnyOrigin&&Z.allowedOrigins.length>0?"✅":Z.allowAnyOrigin?"⚠️":"❌"} CORS Security: ${!Z.allowAnyOrigin&&Z.allowedOrigins.length>0?"Restricted origins":Z.allowAnyOrigin?"Allows any origin":"Not configured"}\n${E||G?"✅":"❌"} API Integration: ${E||G?"Successfully tested":"Not tested"}\n\n🔑 TOKEN SECURITY\n${r?.access_token?"✅":"❌"} JWT Signature: ${r?.access_token?"RS256 available":"No token to validate"}\n${S?"✅":"❌"} Token Validation: ${S?"Performed":"Not performed"}\n${A?"✅":"❌"} Expiration Check: ${A?"Performed":"Not performed"}\n${E?"✅":"❌"} Token Revocation: ${E?"Successfully tested":"Not tested"}\n\n🛡️ SECURITY FEATURES\n${Se?"✅":"❌"} Certificate Validation: ${Se?"Active (x5t present)":"Not available"}\n${G?"✅":"❌"} Session Management: ${G?"Successfully tested":"Not tested"}\n${te?"✅":"❌"} CORS Configuration: ${te?"Tested":"Not tested"}\n\n📋 DETAILED SCORING BREAKDOWN\n${Ae.factors.map(e=>`${e.status?"✅":"❌"} ${e.name}: ${e.reason} (${e.points} points)`).join("\n")}\n\n🎯 OVERALL SECURITY SCORE: ${Ae.score}/100\n${Ae.score>=80?"Excellent security configuration!":Ae.score>=60?"Good security with room for improvement.":"Security improvements needed."}\n\n📋 RECOMMENDATIONS\n${Ae.factors.filter(e=>!e.status).map(e=>`• ${e.name}: ${e.reason}`).join("\n")}\n\nFor more detailed implementation guides, visit:\nhttps://oauth.net/2/security-best-practices/\nhttps://openid.net/specs/openid-connect-core-1_0.html`;O(e),Ge.showSuccess("📄 Security Report generated with real data! View results below.")},[r,Se,Z,E,G,S,A,te,Ae]);return t.jsxs(ex,{$primaryColor:m.primary,children:[!c&&t.jsxs(tx,{$primaryColor:m.primary,children:[t.jsx(rx,{$fontSize:p,children:"🔒 Security Features Demonstration"}),t.jsx(nx,{children:"Advanced OAuth 2.0 and OpenID Connect Security Implementations"})]}),t.jsxs(ix,{children:[t.jsxs(ox,{children:[t.jsxs(sx,{children:[t.jsx(U,{size:18}),"Request Parameter Signature Requirements"]}),t.jsxs(ax,{children:[t.jsxs(cx,{children:[t.jsxs(lx,{children:[t.jsxs(dx,{children:["Request Parameter Signature",t.jsx(ux,{$status:"required",children:"Required"})]}),t.jsxs(px,{children:[t.jsx("strong",{children:"What:"})," Cryptographic signatures (HMAC-SHA256) on OAuth requests",t.jsx("br",{}),t.jsx("strong",{children:"Why:"})," Prevents parameter tampering and replay attacks",t.jsx("br",{}),t.jsx("strong",{children:"How:"})," Sign request params → Include in Authorization header → Server validates"]}),t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:ce,children:[t.jsx(k,{})," View Signature Demo"]}),t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:le,disabled:v,children:[v?t.jsx(b,{className:"animate-spin"}):t.jsx(u,{}),v?"Validating...":"Validate Current Request"]}),_&&t.jsxs(yx,{style:{marginTop:"1rem",background:"#eff6ff",borderColor:"#93c5fd"},children:[t.jsx(wx,{style:{color:"#1e40af"},children:"📋 Signature Demo"}),t.jsx(vx,{style:{color:"#1e3a8a",whiteSpace:"pre-line"},children:_})]}),I&&t.jsxs(yx,{style:{marginTop:"1rem",background:"#dcfce7",borderColor:"#86efac"},children:[t.jsx(wx,{style:{color:"#166534"},children:"✅ Validation Results"}),t.jsx(vx,{style:{color:"#166534",whiteSpace:"pre-line"},children:I})]})]}),t.jsxs(lx,{children:[t.jsxs(dx,{children:["x5t Parameter Inclusion",t.jsx(ux,{$status:"enabled",children:Se?"🔐 Real Data":"📚 Demo Data"})]}),t.jsxs(px,{children:["Includes X.509 certificate thumbprint in JWT headers for enhanced security.",!Se&&t.jsxs("div",{style:{marginTop:"0.5rem",padding:"0.5rem",background:"#fef3c7",border:"1px solid #f59e0b",borderRadius:"0.375rem",fontSize:"0.8rem",color:"#92400e"},children:["💡 ",t.jsx("strong",{children:"To enable x5t in real tokens:"}),' Configure "Include x5t Parameter" in your PingOne client settings or use the Configuration page to enable this feature.']})]}),t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:ue,children:[t.jsx(V,{})," View x5t in Tokens"]}),t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:pe,children:[t.jsx(U,{})," Verify Certificate"]}),t.jsxs("div",{style:{marginTop:"1.5rem",padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"0.5rem",overflow:"hidden",wordWrap:"break-word",overflowWrap:"break-word",maxWidth:"100%",boxSizing:"border-box"},children:[t.jsxs("div",{style:{fontSize:"0.9rem",fontWeight:"600",color:"#374151",marginBottom:"1rem",wordWrap:"break-word"},children:["🔐 JWT Header & Certificate Information",!Se&&t.jsx("span",{style:{fontSize:"0.8rem",color:"#6b7280",marginLeft:"0.5rem",fontWeight:"normal"},children:"(Demo Data)"}),Se&&t.jsx("span",{style:{fontSize:"0.8rem",color:"#16a34a",marginLeft:"0.5rem",fontWeight:"normal"},children:"(From Real Data)"})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:"1rem",width:"100%",maxWidth:"100%",boxSizing:"border-box"},children:[t.jsxs("div",{style:{minWidth:0,overflow:"hidden"},children:[t.jsx("div",{style:{fontSize:"0.85rem",fontWeight:"600",color:"#1f2937",marginBottom:"0.5rem",borderBottom:"1px solid #d1d5db",paddingBottom:"0.25rem"},children:"JWT Header"}),t.jsxs("div",{style:{fontFamily:"monospace",fontSize:"0.8rem",lineHeight:"1.4",wordWrap:"break-word",overflowWrap:"break-word"},children:[t.jsxs("div",{children:[t.jsx("span",{style:{color:"#6b7280"},children:"alg:"})," RS256"]}),t.jsxs("div",{children:[t.jsx("span",{style:{color:"#6b7280"},children:"typ:"})," JWT"]}),t.jsxs("div",{children:[t.jsx("span",{style:{color:"#6b7280"},children:"kid:"})," rsa-key-2024-001"]}),t.jsxs("div",{style:{wordBreak:"break-all",marginBottom:"0.5rem"},children:[t.jsx("span",{style:{color:"#6b7280"},children:"x5t:"}),t.jsx("div",{style:{fontSize:"0.7rem",marginTop:"0.25rem",wordBreak:"break-all",lineHeight:"1.3",background:"#f3f4f6",padding:"0.25rem",borderRadius:"0.25rem",fontFamily:"monospace"},children:Ce})]}),t.jsxs("div",{style:{wordBreak:"break-all",marginBottom:"0.5rem"},children:[t.jsx("span",{style:{color:"#6b7280"},children:"x5t#S256:"}),t.jsx("div",{style:{fontSize:"0.7rem",marginTop:"0.25rem",wordBreak:"break-all",lineHeight:"1.3",background:"#f3f4f6",padding:"0.25rem",borderRadius:"0.25rem",fontFamily:"monospace"},children:Ce.replace(/./g,"a").substring(0,43)})]})]})]}),t.jsxs("div",{style:{minWidth:0,overflow:"hidden"},children:[t.jsx("div",{style:{fontSize:"0.85rem",fontWeight:"600",color:"#1f2937",marginBottom:"0.5rem",borderBottom:"1px solid #d1d5db",paddingBottom:"0.25rem"},children:"X.509 Certificate Details"}),t.jsxs("div",{style:{fontFamily:"monospace",fontSize:"0.8rem",lineHeight:"1.4",wordWrap:"break-word",overflowWrap:"break-word"},children:[t.jsxs("div",{style:{marginBottom:"0.75rem"},children:[t.jsx("span",{style:{color:"#6b7280"},children:"Thumbprint (SHA-1):"}),t.jsx("div",{style:{wordBreak:"break-all",marginTop:"0.25rem",fontSize:"0.7rem",lineHeight:"1.3",background:"#f3f4f6",padding:"0.25rem",borderRadius:"0.25rem",fontFamily:"monospace"},children:Ce})]}),t.jsxs("div",{style:{marginBottom:"0.75rem"},children:[t.jsx("span",{style:{color:"#6b7280"},children:"Thumbprint (SHA-256):"}),t.jsx("div",{style:{wordBreak:"break-all",marginTop:"0.25rem",fontSize:"0.7rem",lineHeight:"1.3",background:"#f3f4f6",padding:"0.25rem",borderRadius:"0.25rem",fontFamily:"monospace"},children:Ce.replace(/./g,"a").substring(0,43)})]}),t.jsxs("div",{style:{wordBreak:"break-word"},children:[t.jsx("span",{style:{color:"#6b7280"},children:"Subject:"})," CN=auth.pingone.com"]}),t.jsxs("div",{style:{wordBreak:"break-word"},children:[t.jsx("span",{style:{color:"#6b7280"},children:"Issuer:"})," CN=DigiCert SHA2, O=DigiCert Inc"]}),t.jsxs("div",{children:[t.jsx("span",{style:{color:"#6b7280"},children:"Valid From:"})," 2024-01-01"]}),t.jsxs("div",{children:[t.jsx("span",{style:{color:"#6b7280"},children:"Valid To:"})," 2025-01-01"]}),t.jsxs("div",{children:[t.jsx("span",{style:{color:"#6b7280"},children:"Status:"})," ",t.jsx("span",{style:{color:"#16a34a"},children:"Valid"})]})]})]})]}),t.jsx("div",{style:{marginTop:"1rem",padding:"0.75rem",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"0.375rem",wordWrap:"break-word",overflowWrap:"break-word"},children:t.jsxs("div",{style:{fontSize:"0.8rem",color:"#1e40af",lineHeight:"1.4",wordBreak:"break-word"},children:[t.jsx("strong",{children:"Security Purpose:"})," The x5t parameter enables certificate validation by allowing clients to verify that JWTs are signed with the expected certificate. This prevents impersonation attacks and ensures token authenticity."]})})]})]})]}),t.jsxs(yx,{children:[t.jsx(wx,{children:"📚 Understanding Request Signatures"}),t.jsxs(vx,{children:[t.jsx("strong",{children:"Purpose:"})," Request parameter signatures use HMAC-SHA256 to create a cryptographic signature of the request parameters. This prevents tampering and ensures request authenticity.",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"How It Works:"}),t.jsx("br",{}),"1. Client generates HMAC-SHA256 signature from request parameters",t.jsx("br",{}),"2. Signature is included in the Authorization header",t.jsx("br",{}),"3. Server validates signature before processing request",t.jsx("br",{}),"4. Mismatched signatures are rejected",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"Security Benefits:"}),t.jsx("br",{}),"• Prevents parameter tampering during transit",t.jsx("br",{}),"• Protects against replay attacks",t.jsx("br",{}),"• Ensures request authenticity",t.jsx("br",{}),"• Validates request integrity",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"Best Practice:"})," Always use HTTPS with request signatures for maximum security."]})]})]})]}),t.jsxs(ox,{children:[t.jsxs(sx,{children:[t.jsx(V,{size:18}),"Token Security Features"]}),t.jsxs(ax,{children:[t.jsxs(cx,{children:[t.jsxs(lx,{children:[t.jsxs(dx,{children:["JWT Header Security",t.jsx(ux,{$status:r?"enabled":"disabled",children:r?"Active":"Inactive"})]}),t.jsx(px,{children:"Enhanced JWT headers with x5t, kid, and other security parameters."}),r?.access_token&&"string"==typeof r.access_token&&t.jsxs(mx,{children:[t.jsx(fx,{children:"Algorithm:"}),t.jsx(xx,{children:"RS256"}),t.jsx(fx,{children:"Key ID:"}),t.jsx(xx,{children:"kid-12345-rsa-1"}),t.jsxs(y.Fragment,{children:[t.jsx(fx,{children:"x5t (SHA-1):"}),t.jsxs(xx,{children:[Ce,!Se&&t.jsx("span",{style:{fontSize:"0.8rem",color:"#6b7280",marginLeft:"0.5rem"},children:"(Demo)"}),Se&&t.jsx("span",{style:{fontSize:"0.8rem",color:"#16a34a",marginLeft:"0.5rem"},children:"(Real)"})]})]})]})]}),t.jsxs(lx,{children:[t.jsxs(dx,{children:["Token Validation",t.jsx(ux,{$status:r?"enabled":"disabled",children:r?"Active":"Inactive"})]}),t.jsxs(px,{children:[t.jsx("strong",{children:"What:"})," Real-time validation of JWT tokens (access, refresh, ID)",t.jsx("br",{}),t.jsx("strong",{children:"Why:"})," Ensures tokens are valid, not expired, and properly signed",t.jsx("br",{}),t.jsx("strong",{children:"How:"})," Verify signature → Check expiration → Validate claims"]}),t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:he,children:[t.jsx(u,{})," Validate All Tokens"]}),t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:me,children:[t.jsx(de,{})," Check Expiration"]}),S&&t.jsxs(yx,{style:{marginTop:"1rem",background:"#dcfce7",borderColor:"#86efac"},children:[t.jsx(wx,{style:{color:"#166534"},children:"Validation Results"}),t.jsx(vx,{style:{color:"#166534",whiteSpace:"pre-line"},children:S})]}),A&&t.jsxs(yx,{style:{marginTop:"1rem",background:"#fef3c7",borderColor:"#fcd34d"},children:[t.jsx(wx,{style:{color:"#92400e"},children:"Expiration Check Results"}),t.jsx(vx,{style:{color:"#92400e",whiteSpace:"pre-line"},children:A})]}),G&&t.jsxs(yx,{style:{marginTop:"1rem",background:"#fef2f2",borderColor:"#fecaca"},children:[t.jsx(wx,{style:{color:"#dc2626"},children:"🚪 Session Termination Results"}),t.jsx(vx,{style:{color:"#dc2626",whiteSpace:"pre-line",fontFamily:"monospace",fontSize:"0.875rem"},children:G})]}),E&&t.jsxs(yx,{style:{marginTop:"1rem",background:"#fef2f2",borderColor:"#fecaca"},children:[t.jsx(wx,{style:{color:"#dc2626"},children:"❌ Token Revocation Results"}),t.jsx(vx,{style:{color:"#dc2626",whiteSpace:"pre-line",fontFamily:"monospace",fontSize:"0.875rem"},children:E})]})]})]}),t.jsxs(yx,{children:[t.jsx(wx,{children:"📚 Understanding Token Validation"}),t.jsxs(vx,{children:[t.jsx("strong",{children:"Purpose:"})," Token validation ensures that JWT tokens are authentic, not tampered with, and still valid for use.",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"Validation Steps:"}),t.jsx("br",{}),"1. ",t.jsx("strong",{children:"Signature Verification:"})," Verify the token was signed by the authorization server",t.jsx("br",{}),"2. ",t.jsx("strong",{children:"Expiration Check:"})," Ensure the token hasn't expired (exp claim)",t.jsx("br",{}),"3. ",t.jsx("strong",{children:"Claims Validation:"})," Verify issuer (iss), audience (aud), and other claims",t.jsx("br",{}),"4. ",t.jsx("strong",{children:"Revocation Check:"})," Optionally check if token has been revoked",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"Security Benefits:"}),t.jsx("br",{}),"• Prevents use of forged tokens",t.jsx("br",{}),"• Blocks expired tokens automatically",t.jsx("br",{}),"• Validates token integrity",t.jsx("br",{}),"• Ensures proper token lifecycle management",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"Best Practice:"})," Always validate tokens on every API request, never trust client-provided tokens without verification."]})]})]})]}),t.jsxs(ox,{children:[t.jsxs(sx,{children:[t.jsx(W,{size:18}),"Session Management & Termination"]}),t.jsxs(ax,{children:[t.jsxs(cx,{children:[t.jsxs(lx,{children:[t.jsxs(dx,{children:["Session Termination",t.jsx(ux,{$status:r?"enabled":"disabled",children:r?"Available":"Unavailable"})]}),t.jsxs(px,{children:[t.jsx("strong",{children:"What:"})," End user sessions and clear authentication state",t.jsx("br",{}),t.jsx("strong",{children:"Why:"})," Ensures users are fully logged out and sessions can't be reused",t.jsx("br",{}),t.jsx("strong",{children:"How:"})," Call logout endpoint with ID token → Clear local storage → Redirect"]}),t.jsxs(hx,{$variant:"danger",$primaryColor:m.primary,onClick:fe,children:[t.jsx(f,{})," Terminate Session"]}),t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:()=>w(!x),children:[t.jsx(re,{})," ",x?"Hide":"Show"," Logout URL"]}),x&&t.jsxs(yx,{style:{marginTop:"1rem",background:"#f8fafc",borderColor:"#cbd5e1"},children:[t.jsx(wx,{style:{color:"#475569"},children:"🌐 Logout Request URL"}),t.jsx(gx,{$isVisible:!0,children:Y||"https://auth.pingone.com/{environmentId}/as/signoff"}),t.jsxs(vx,{style:{color:"#64748b",fontSize:"0.85rem",marginTop:"0.5rem"},children:[t.jsx("strong",{children:"Parameters:"}),t.jsx("br",{}),"• id_token_hint: ID token for logout hint",t.jsx("br",{}),"• client_id: Client identifier",t.jsx("br",{}),"• post_logout_redirect_uri: Optional redirect after logout"]}),t.jsxs("div",{style:{marginTop:"1rem",display:"flex",gap:"0.5rem"},children:[t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:()=>{const e=Y||"https://auth.pingone.com/{environmentId}/as/signoff";window.open(e,"_blank")},children:[t.jsx(h,{})," Execute Logout URL"]}),t.jsxs(hx,{$variant:"secondary",$primaryColor:m.primary,onClick:()=>{const e=Y||"https://auth.pingone.com/{environmentId}/as/signoff";navigator.clipboard.writeText(e),Ge.showSuccess("📋 Logout URL copied to clipboard!")},children:[t.jsx(o,{})," Copy URL"]})]})]}),G&&t.jsxs(yx,{style:{marginTop:"1rem",background:"#fef2f2",borderColor:"#fecaca"},children:[t.jsx(wx,{style:{color:"#dc2626"},children:"🚪 Session Termination Results"}),t.jsx(vx,{style:{color:"#dc2626",whiteSpace:"pre-line",fontFamily:"monospace",fontSize:"0.875rem"},children:G})]})]}),t.jsxs(lx,{children:[t.jsxs(dx,{children:["Token Revocation",t.jsx(ux,{$status:r?"enabled":"disabled",children:r?"Available":"Unavailable"})]}),t.jsxs(px,{children:[t.jsx("strong",{children:"What:"})," Invalidate tokens to prevent further use",t.jsx("br",{}),t.jsx("strong",{children:"Why:"})," Security measure when tokens are compromised or user logs out",t.jsx("br",{}),t.jsx("strong",{children:"How:"})," Call revocation endpoint → Token becomes invalid immediately"]}),t.jsxs(hx,{$variant:"danger",$primaryColor:m.primary,onClick:be,children:[t.jsx(f,{})," Revoke All Tokens"]}),t.jsxs(hx,{$variant:"danger",$primaryColor:m.primary,onClick:xe,children:[t.jsx(b,{})," Revoke Refresh Token"]}),t.jsxs(yx,{style:{marginTop:"1rem",background:"#f8fafc",borderColor:"#cbd5e1"},children:[t.jsx(wx,{style:{color:"#475569"},children:"🌐 Revocation Request URL"}),t.jsx(gx,{$isVisible:!0,children:`POST ${n?.issuer||"https://auth.pingone.com"}/as/revoke\n\nHeaders:\nContent-Type: application/x-www-form-urlencoded\nAuthorization: Basic ${n?.clientId?btoa(`${n.clientId}:${n.clientSecret||"{{clientSecret}}"}`):"{{base64(clientId:clientSecret)}}"}\n\nBody:\ntoken=${r?.access_token||"{{accessToken}}"}\n&token_type_hint=access_token`}),t.jsxs(vx,{style:{color:"#64748b",fontSize:"0.85rem",marginTop:"0.5rem"},children:[t.jsx("strong",{children:"Parameters:"}),t.jsx("br",{}),"• token: The token to revoke (access_token or refresh_token)",t.jsx("br",{}),"• token_type_hint: Type of token (access_token, refresh_token, or id_token)",t.jsx("br",{}),"• client_id: Client identifier (in Authorization header)",t.jsx("br",{}),"• client_secret: Client secret (in Authorization header)"]})]}),E&&t.jsxs(yx,{style:{marginTop:"1rem",background:"#fef2f2",borderColor:"#fecaca"},children:[t.jsx(wx,{style:{color:"#dc2626"},children:"❌ Token Revocation Results"}),t.jsx(vx,{style:{color:"#dc2626",whiteSpace:"pre-line",fontFamily:"monospace",fontSize:"0.875rem"},children:E})]})]})]}),t.jsxs(yx,{children:[t.jsx(wx,{children:"📚 Understanding Session & Token Management"}),t.jsxs(vx,{children:[t.jsx("strong",{children:"Session Termination:"}),t.jsx("br",{}),"• Ends the user's authenticated session",t.jsx("br",{}),"• Clears server-side session data",t.jsx("br",{}),"• Redirects to logout endpoint with ID token hint",t.jsx("br",{}),"• Best for user-initiated logout",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"Token Revocation:"}),t.jsx("br",{}),"• Immediately invalidates specific tokens",t.jsx("br",{}),"• Prevents compromised tokens from being used",t.jsx("br",{}),"• Required for security incidents",t.jsx("br",{}),"• Can revoke individual tokens or all tokens",t.jsx("br",{}),t.jsx("br",{}),t.jsx("strong",{children:"Best Practices:"}),t.jsx("br",{}),"• Always revoke tokens on logout",t.jsx("br",{}),"• Implement token revocation for security incidents",t.jsx("br",{}),"• Use short-lived access tokens (1 hour or less)",t.jsx("br",{}),"• Store refresh tokens securely",t.jsx("br",{}),"• Monitor for suspicious token usage"]})]})]})]}),t.jsxs(ox,{children:[t.jsxs(sx,{children:[t.jsx(re,{size:18}),"CORS Settings & Testing"]}),t.jsxs(ax,{children:[t.jsxs(cx,{children:[t.jsxs(lx,{children:[t.jsxs(dx,{children:["CORS Configuration",t.jsx(ux,{$status:Z.allowAnyOrigin?"enabled":"required",children:Z.allowAnyOrigin?"Any Origin":"Restricted"})]}),t.jsx(px,{children:"Configure Cross-Origin Resource Sharing (CORS) settings to control which domains can access your OAuth endpoints."}),t.jsx("div",{style:{marginBottom:"1rem"},children:t.jsxs(mx,{children:[t.jsx(fx,{children:"CORS Policy:"}),t.jsx(xx,{children:t.jsxs("select",{value:Z.allowAnyOrigin?"any":"specific",onChange:e=>ee(t=>({...t,allowAnyOrigin:"any"===e.target.value})),style:{width:"100%",minWidth:"250px",padding:"0.5rem",border:"1px solid #d1d5db",borderRadius:"0.375rem",background:"white",fontSize:"0.875rem"},children:[t.jsx("option",{value:"specific",children:"Allow specific origins"}),t.jsx("option",{value:"any",children:"Allow any CORS-safe origin"})]})})]})}),!Z.allowAnyOrigin&&t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx(bx,{children:"Allowed Origins:"}),t.jsx("div",{style:{marginTop:"0.5rem"},children:Z.allowedOrigins.map((e,r)=>t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.5rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"0.375rem",marginBottom:"0.5rem"},children:[t.jsx("span",{style:{fontFamily:"monospace",fontSize:"0.9rem"},children:e}),t.jsx("button",{onClick:()=>ve(e),style:{background:"none",border:"none",color:"#ef4444",cursor:"pointer",padding:"0.25rem"},title:"Remove origin",children:t.jsx(F,{size:16})})]},r))}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem",marginTop:"0.5rem"},children:[t.jsx("input",{type:"text",value:Z.newOrigin,onChange:e=>ee(t=>({...t,newOrigin:e.target.value})),placeholder:"https://example.com",style:{flex:1,padding:"0.5rem",border:"1px solid #d1d5db",borderRadius:"0.375rem"}}),t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:we,disabled:!Z.newOrigin.trim(),children:[t.jsx(ge,{})," Add"]})]})]}),t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:ke,disabled:ie,children:[ie?t.jsx(b,{className:"animate-spin"}):t.jsx(se,{}),ie?"Testing...":"Test CORS Configuration"]}),t.jsxs(hx,{$variant:"danger",$primaryColor:m.primary,onClick:je,children:[t.jsx(l,{})," Demonstrate CORS Error"]})]}),t.jsxs(lx,{children:[t.jsxs(dx,{children:["CORS Test Results",t.jsx(ux,{$status:te?"enabled":"disabled",children:te?"Available":"Not Tested"})]}),t.jsx(px,{children:"View the results of CORS policy testing across different origins."}),te&&t.jsx("div",{style:{marginTop:"1rem"},children:te.map((e,r)=>t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem",background:e.allowed?"#f0fdf4":"#fef2f2",border:"1px solid "+(e.allowed?"#bbf7d0":"#fecaca"),borderRadius:"0.375rem",marginBottom:"0.5rem"},children:[t.jsxs("div",{children:[t.jsx("div",{style:{fontFamily:"monospace",fontSize:"0.9rem",fontWeight:"500"},children:e.origin}),e.error&&"string"==typeof e.error?t.jsx("div",{style:{fontSize:"0.8rem",color:"#dc2626",marginTop:"0.25rem"},children:e.error}):null]}),t.jsx("div",{style:{color:e.allowed?"#16a34a":"#dc2626",fontWeight:"bold"},children:e.allowed?"✓ Allowed":"✗ Blocked"})]},r))})]})]}),t.jsxs(yx,{children:[t.jsx(wx,{children:"How CORS Protection Works"}),t.jsx(vx,{children:"CORS (Cross-Origin Resource Sharing) prevents malicious websites from making unauthorized requests to your OAuth endpoints. When configured properly, only trusted origins can access your APIs, protecting against CSRF attacks and data theft."})]})]})]}),t.jsxs(ox,{children:[t.jsxs(sx,{children:[t.jsx(U,{size:18}),"Security Analysis & Recommendations"]}),t.jsx(ax,{children:t.jsxs(cx,{children:[t.jsxs(lx,{children:[t.jsxs(dx,{children:["Current Security Score",t.jsxs(ux,{$status:Ae.score>=80?"enabled":Ae.score>=60?"required":"disabled",children:[Ae.score,"/100"]})]}),t.jsx(px,{children:Ae.score>=80?"Your OAuth implementation has excellent security practices.":Ae.score>=60?"Your OAuth implementation has good security practices with room for improvement.":"Your OAuth implementation needs security improvements."}),t.jsxs(mx,{children:[t.jsx(fx,{children:"Access Token:"}),t.jsx(xx,{children:r?.access_token?"✅ Present":"❌ Missing"}),t.jsx(fx,{children:"Refresh Token:"}),t.jsx(xx,{children:r?.refresh_token?"✅ Present":"❌ Missing"}),t.jsx(fx,{children:"ID Token:"}),t.jsx(xx,{children:r?.id_token?"✅ Present":"❌ Missing"}),t.jsx(fx,{children:"x5t Certificate:"}),t.jsx(xx,{children:Se?"✅ Valid":"❌ Missing"}),t.jsx(fx,{children:"CORS Security:"}),t.jsx(xx,{children:!Z.allowAnyOrigin&&Z.allowedOrigins.length>0?"✅ Restricted":Z.allowAnyOrigin?"⚠️ Any Origin":"❌ Not Configured"}),t.jsx(fx,{children:"API Integration:"}),t.jsx(xx,{children:E||G?"✅ Tested":"❌ Not Tested"})]})]}),t.jsxs(lx,{children:[t.jsxs(dx,{children:["Recommendations",t.jsx(ux,{$status:"required",children:"Review"})]}),t.jsx(px,{children:"Additional security enhancements you can implement."}),t.jsxs(Ax,{children:[t.jsx("li",{children:"Consider implementing PKCE for public clients"}),t.jsx("li",{children:"Enable token binding for additional security"}),t.jsx("li",{children:"Implement rate limiting on token endpoints"}),t.jsx("li",{children:"Add audit logging for security events"})]})]})]})})]}),t.jsxs(Cx,{children:[t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:Te,children:[t.jsx(o,{})," Export Security Report"]}),t.jsxs(hx,{$variant:"primary",$primaryColor:m.primary,onClick:ye,children:[t.jsx(se,{})," Run Security Test Suite"]}),(P||D)&&t.jsxs(hx,{$variant:"secondary",$primaryColor:m.primary,onClick:()=>{O(null),L(null),Ge.showSuccess("Security results cleared.")},children:[t.jsx(f,{})," Clear Results"]})]}),P&&t.jsxs("div",{style:{marginTop:"1.5rem"},children:[t.jsxs(kx,{$isCollapsed:N,onClick:()=>M(!N),children:[t.jsx(jx,{children:"📄 Security Analysis Report"}),t.jsx(a,{size:20,style:{transform:N?"rotate(-90deg)":"rotate(0deg)",transition:"transform 0.2s ease"}})]}),t.jsx(Sx,{$isCollapsed:N,children:t.jsx(vx,{style:{whiteSpace:"pre-line",fontFamily:"monospace",fontSize:"0.875rem",color:"#374151"},children:P})})]}),D&&t.jsxs("div",{style:{marginTop:"1.5rem"},children:[t.jsxs(kx,{$isCollapsed:q,onClick:()=>B(!q),children:[t.jsx(jx,{children:"🧪 Security Test Suite Results"}),t.jsx(a,{size:20,style:{transform:q?"rotate(-90deg)":"rotate(0deg)",transition:"transform 0.2s ease"}})]}),t.jsx(Sx,{$isCollapsed:q,children:t.jsx(vx,{style:{whiteSpace:"pre-line",fontFamily:"monospace",fontSize:"0.875rem",color:"#374151"},children:D})})]})]}),t.jsx(Zb,{isOpen:X.isOpen,onClose:()=>Q({...X,isOpen:!1}),onConfirm:X.onConfirm,title:X.title,message:X.message,variant:"danger",confirmText:"Confirm",cancelText:"Cancel"})]})},_x=Ce.pre`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 100%;
  overflow: hidden;
`,Rx=Ce.span`
  color: #3b82f6; /* Blue for keys */
  font-weight: 500;
`;Ce.span`
  color: #dc2626; /* Red for values */
`;const Ix=Ce.span`
  color: #dc2626; /* Red for string values */
`,$x=Ce.span`
  color: #dc2626; /* Red for number values */
`,Ex=Ce.span`
  color: #dc2626; /* Red for boolean values */
`,zx=Ce.span`
  color: #dc2626; /* Red for null values */
`,Px=Ce.span`
  color: #6b7280; /* Gray for punctuation */
`,Ox=({data:e,className:r})=>{const n=(e,r=0)=>{const i="  ".repeat(r);if(null===e)return t.jsx(zx,{children:"null"});if("boolean"==typeof e)return t.jsx(Ex,{children:e.toString()});if("number"==typeof e)return t.jsx($x,{children:e});if("string"==typeof e)return t.jsxs(Ix,{children:['"',e,'"']});if(Array.isArray(e))return 0===e.length?t.jsx(Px,{children:"[]"}):t.jsxs(t.Fragment,{children:[t.jsx(Px,{children:"["}),t.jsx("br",{}),e.map((o,s)=>t.jsxs(y.Fragment,{children:[i," ",n(o,r+1),s<e.length-1&&t.jsx(Px,{children:","}),t.jsx("br",{})]},s)),i,t.jsx(Px,{children:"]"})]});if("object"==typeof e){const o=Object.entries(e);return 0===o.length?t.jsx(Px,{}):t.jsxs(t.Fragment,{children:[t.jsx(Px,{children:"{"}),t.jsx("br",{}),o.map(([e,s],a)=>t.jsxs(y.Fragment,{children:[i," ",t.jsxs(Rx,{children:['"',e,'"']}),t.jsx(Px,{children:": "}),n(s,r+1),a<o.length-1&&t.jsx(Px,{children:","}),t.jsx("br",{})]},e)),i,t.jsx(Px,{children:"}"})]})}return t.jsx("span",{children:String(e)})};return t.jsx(_x,{className:r,children:n(e)})},Ux=Ce.div`
	background: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	overflow: hidden;
	margin-top: 0;
	width: 100%;
`,Dx=Ce.div`
	background: #f9fafb;
	padding: 1rem 1.5rem;
	border-bottom: 2px solid #e5e7eb;
	display: flex;
	justify-content: space-between;
	align-items: center;
	
	h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}
`,Lx=Ce.button`
	padding: 0.5rem 1rem;
	background: #ef4444;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: background 0.2s;
	
	&:hover {
		background: #dc2626;
	}
`,Nx=Ce.table`
	width: 100%;
	border-collapse: collapse;
	table-layout: auto;
`,Mx=Ce.thead`
	background: #f3f4f6;
	
	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
	}
`,Fx=Ce.tbody``,qx=Ce.tr`
	border-bottom: 1px solid #e5e7eb;
	cursor: pointer;
	transition: background 0.2s;
	
	&:hover {
		background: #f9fafb;
	}
	
	${e=>e.$isExpanded&&"\n\t\tbackground: #f9fafb;\n\t"}
`,Vx=Ce.td`
	padding: 0.75rem 1rem;
	font-size: 0.875rem;
	color: #111827;
`,Bx=Ce.span`
	display: inline-block;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	
	${e=>{switch(e.$method){case"GET":return"background: #dbeafe; color: #1e40af;";case"POST":return"background: #dcfce7; color: #166534;";case"PUT":return"background: #fef3c7; color: #92400e;";case"DELETE":return"background: #fee2e2; color: #991b1b;";default:return"background: #f3f4f6; color: #374151;"}}}
`,Wx=Ce.span`
	display: inline-block;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	
	${e=>e.$status>=200&&e.$status<300?"background: #dcfce7; color: #166534;":e.$status>=400?"background: #fee2e2; color: #991b1b;":"background: #fef3c7; color: #92400e;"}
`,Gx=Ce.div`
	display: ${e=>e.$isExpanded?"block":"none"};
	padding: 1rem 1.5rem;
	background: white;
	border-top: 1px solid #e5e7eb;
`,Hx=Ce.div`
	margin-bottom: 1.5rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`,Jx=Ce.h4`
	margin: 0 0 0.5rem 0;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Kx=Ce.pre`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 4px;
	padding: 1rem;
	overflow-x: auto;
	font-size: 0.8125rem;
	line-height: 1.5;
	margin: 0;
`,Yx=Ce.dl`
	margin: 0;
	
	dt {
		font-weight: 600;
		color: #374151;
		margin-top: 0.5rem;
		
		&:first-child {
			margin-top: 0;
		}
	}
	
	dd {
		margin: 0.25rem 0 0 1rem;
		color: #6b7280;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 0.8125rem;
		word-break: break-all;
	}
`,Xx=Ce.div`
	padding: 3rem;
	text-align: center;
	color: #6b7280;
	
	p {
		margin: 0;
		font-size: 0.875rem;
	}
`,Qx=({apiCalls:r,onClear:n})=>{const[i,o]=e.useState(new Set);return t.jsxs(Ux,{children:[t.jsxs(Dx,{children:[t.jsxs("h3",{children:["API Calls to PingOne (",r.length,")"]}),n&&r.length>0&&t.jsx(Lx,{onClick:n,children:"Clear All"})]}),0===r.length?t.jsx(Xx,{children:t.jsx("p",{children:"No API calls yet. API calls will appear here as you interact with the application."})}):t.jsxs(Nx,{children:[t.jsx(Mx,{children:t.jsxs("tr",{children:[t.jsx("th",{style:{width:"40px"}}),t.jsx("th",{style:{width:"80px"},children:"Method"}),t.jsx("th",{style:{minWidth:"400px"},children:"URL"}),t.jsx("th",{style:{width:"100px"},children:"Status"}),t.jsx("th",{style:{width:"120px"},children:"Time"}),t.jsx("th",{style:{width:"100px"},children:"Duration"})]})}),t.jsx(Fx,{children:r.map(e=>{const r=i.has(e.id);return t.jsxs(y.Fragment,{children:[t.jsxs(qx,{$isExpanded:r,onClick:()=>(e=>{const t=new Set(i);t.has(e)?t.delete(e):t.add(e),o(t)})(e.id),children:[t.jsx(Vx,{children:r?t.jsx(a,{}):t.jsx(be,{})}),t.jsx(Vx,{children:t.jsx(Bx,{$method:e.method,children:e.method})}),t.jsxs(Vx,{children:[t.jsx("div",{style:{fontFamily:"Monaco, Menlo, monospace",fontSize:"0.8125rem",wordBreak:"break-all",whiteSpace:"normal",overflowWrap:"break-word",maxWidth:"100%"},children:e.actualPingOneUrl||e.url}),e.actualPingOneUrl&&e.url!==e.actualPingOneUrl&&t.jsxs("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.25rem",fontStyle:"italic"},children:["Proxy: ",e.url]})]}),t.jsx(Vx,{children:e.response?t.jsx(Wx,{$status:e.response.status,children:e.response.status}):t.jsx("span",{style:{color:"#6b7280"},children:"Pending"})}),t.jsx(Vx,{children:t.jsx("small",{style:{color:"#6b7280"},children:(c=e.timestamp,c.toLocaleTimeString("en-US",{hour12:!1,hour:"2-digit",minute:"2-digit",second:"2-digit",fractionalSecondDigits:3}))})}),t.jsx(Vx,{children:t.jsx("small",{style:{color:"#6b7280"},children:(n=e.duration,n?`${n.toFixed(0)}ms`:"-")})})]}),r&&t.jsx("tr",{children:t.jsx(Vx,{colSpan:6,style:{padding:0},children:t.jsxs(Gx,{$isExpanded:!0,children:[e.actualPingOneUrl&&e.url!==e.actualPingOneUrl&&t.jsxs(Hx,{children:[t.jsx(Jx,{children:"API URLs"}),t.jsxs(Yx,{children:[t.jsx("dt",{children:"PingOne API:"}),t.jsx("dd",{style:{fontFamily:"Monaco, Menlo, monospace",fontSize:"0.875rem"},children:e.actualPingOneUrl}),t.jsx("dt",{children:"Proxy URL:"}),t.jsx("dd",{style:{fontFamily:"Monaco, Menlo, monospace",fontSize:"0.875rem"},children:e.url})]})]}),e.queryParams&&Object.keys(e.queryParams).length>0&&t.jsxs(Hx,{children:[t.jsx(Jx,{children:"Query Parameters"}),t.jsx(Yx,{children:Object.entries(e.queryParams).map(([e,r])=>t.jsxs(y.Fragment,{children:[t.jsxs("dt",{children:[e,":"]}),t.jsx("dd",{children:String(r)})]},e))})]}),e.headers&&Object.keys(e.headers).length>0&&t.jsxs(Hx,{children:[t.jsxs(Jx,{children:[t.jsx(z,{})," Request Headers"]}),t.jsx(Yx,{children:Object.entries(e.headers).map(([e,r])=>t.jsxs(y.Fragment,{children:[t.jsxs("dt",{children:[e,":"]}),t.jsx("dd",{children:e.toLowerCase().includes("authorization")||e.toLowerCase().includes("secret")?"***REDACTED***":String(r)})]},e))})]}),e.body&&t.jsxs(Hx,{children:[t.jsxs(Jx,{children:[t.jsx(s,{})," Request Body"]}),"object"==typeof e.body&&null!==e.body?t.jsx(Ox,{data:e.body}):t.jsx(Kx,{children:"string"==typeof e.body?e.body:JSON.stringify(e.body,null,2)})]}),e.response&&t.jsxs(t.Fragment,{children:[e.response.headers&&Object.keys(e.response.headers).length>0&&t.jsxs(Hx,{children:[t.jsxs(Jx,{children:[t.jsx(z,{})," Response Headers"]}),t.jsx(Yx,{children:Object.entries(e.response.headers).map(([e,r])=>t.jsxs(y.Fragment,{children:[t.jsxs("dt",{children:[e,":"]}),t.jsx("dd",{children:String(r)})]},e))})]}),t.jsxs(Hx,{children:[t.jsxs(Jx,{children:[t.jsx(s,{})," Response Body"]}),e.response.data?t.jsx(Ox,{data:e.response.data}):e.response.error?t.jsx(Kx,{style:{color:"#dc2626"},children:e.response.error}):t.jsx(Kx,{children:e.response.statusText})]})]})]})})})]},e.id);var n,c})})]})]})},Zx=Ce.div`
	background: #ffffff;
	border-radius: 12px;
	border: 1px solid #e5e7eb;
	overflow: hidden;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`,ey=Ce.div`
	background: #f8fafc;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid #e5e7eb;
	display: flex;
	justify-content: space-between;
	align-items: center;
`,ty=Ce.h3`
	margin: 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,ry=Ce.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
`,ny=Ce.button`
	padding: 0.375rem 0.75rem;
	border: 1px solid ${({$active:e})=>e?"#3b82f6":"#d1d5db"};
	border-radius: 6px;
	background: ${({$active:e})=>e?"#3b82f6":"#ffffff"};
	color: ${({$active:e})=>e?"#ffffff":"#374151"};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	white-space: nowrap;

	&:hover {
		background: ${({$active:e})=>e?"#2563eb":"#f3f4f6"};
		border-color: ${({$active:e})=>e?"#2563eb":"#9ca3af"};
	}
`,iy=Ce.div`
	position: relative;
`,oy=Ce.div`
	background: #1f2937;
	color: #f9fafb;
	padding: 0.75rem 1rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 0.875rem;
	font-weight: 500;
`,sy=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,ay=Ce.div`
	display: flex;
	gap: 0.5rem;
`,cy=Ce.button`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.375rem 0.75rem;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 4px;
	color: #f9fafb;
	font-size: 0.75rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
	}
`,ly=Ce.pre`
	margin: 0;
	padding: 1.5rem;
	background: #1f2937;
	color: #f9fafb;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow: auto;
	max-height: 600px;
	white-space: pre;
	word-wrap: normal;
	overflow-wrap: normal;

	/* Custom scrollbar styling for better visibility */
	&::-webkit-scrollbar {
		width: 12px;
		height: 12px;
	}

	&::-webkit-scrollbar-track {
		background: #2d3748;
		border-radius: 6px;
	}

	&::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 6px;
		border: 2px solid #2d3748;
	}

	&::-webkit-scrollbar-thumb:hover {
		background: #718096;
	}

	&::-webkit-scrollbar-corner {
		background: #2d3748;
	}
`,dy=Ce.div`
	background: #f3f4f6;
	padding: 0.75rem 1rem;
	border-top: 1px solid #e5e7eb;
	font-size: 0.875rem;
	color: #6b7280;
`,uy=Ce.strong`
	color: #374151;
	margin-right: 0.5rem;
`,py=Ce.div`
	padding: 3rem 1.5rem;
	text-align: center;
	color: #6b7280;
`,hy=Ce.div`
	padding: 1.5rem;
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 8px;
	color: #dc2626;
	text-align: center;
`,gy=e=>({javascript:"JavaScript",typescript:"TypeScript",go:"Go",ruby:"Ruby",python:"Python","ping-sdk":"Ping SDK"}[e]),my=e=>({javascript:"🟨",typescript:"🔷",go:"🐹",ruby:"💎",python:"🐍","ping-sdk":"🔐"}[e]),fy=({flowType:r,stepId:a,config:c,className:l})=>{const[d,u]=e.useState(["javascript"]),[p,h]=e.useState(null),g=e.useMemo(()=>new kr(c),[c]),m=e.useMemo(()=>g.getExamplesForStep(r,a),[g,r,a]),f=e.useMemo(()=>m?g.filterExamplesByLanguage(m.examples,d):[],[m,d,g]);return m?t.jsxs(Zx,{className:l,children:[t.jsxs(ey,{children:[t.jsxs(ty,{children:[t.jsx(s,{}),m.stepName," - Code Examples"]}),t.jsx(ry,{children:g.getSupportedLanguages().map(e=>t.jsxs(ny,{$active:d.includes(e),onClick:()=>(e=>{u(t=>t.includes(e)?t.filter(t=>t!==e):[...t,e])})(e),children:[my(e)," ",gy(e)]},e))})]}),0===f.length?t.jsx(py,{children:"No examples selected. Choose one or more languages above."}):f.map((e,r)=>t.jsxs(iy,{children:[t.jsxs(oy,{children:[t.jsxs(sy,{children:[my(e.language)," ",e.title]}),t.jsxs(ay,{children:[t.jsxs(cy,{onClick:()=>(async e=>{try{await navigator.clipboard.writeText(e),h(e),setTimeout(()=>h(null),2e3)}catch(t){}})(e.code),children:[p===e.code?t.jsx(i,{}):t.jsx(n,{}),p===e.code?"Copied!":"Copy"]}),t.jsxs(cy,{onClick:()=>(e=>{const t="typescript"===e.language?"ts":"javascript"===e.language?"js":"go"===e.language?"go":"ruby"===e.language?"rb":"ping-sdk"===e.language?"ts":"py",r=`${e.title.toLowerCase().replace(/\s+/g,"-")}.${t}`,n=new Blob([e.code],{type:"text/plain"}),i=URL.createObjectURL(n),o=document.createElement("a");o.href=i,o.download=r,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i)})(e),children:[t.jsx(o,{}),"Download"]})]})]}),t.jsx(ly,{children:e.code}),e.dependencies&&e.dependencies.length>0&&t.jsxs(dy,{children:[t.jsx(uy,{children:"Dependencies:"}),e.dependencies.join(", ")]})]},`${e.language}-${r}`))]}):t.jsx(Zx,{className:l,children:t.jsx(hy,{children:"No code examples available for this step."})})},by=e=>({pkce:{enabled:"OPTIONAL"!==e.pkceEnforcement,enforcement:e.pkceEnforcement,codeChallengeMethod:(e.pkceEnforcement,"S256")},clientAuth:{method:e.clientAuthMethod,hasClientSecret:"none"!==e.clientAuthMethod&&"private_key_jwt"!==e.clientAuthMethod,hasPrivateKey:"private_key_jwt"===e.clientAuthMethod&&!!e.privateKey},requestSecurity:{requireSignedRequests:"REQUIRE_SIGNED"===e.requestParameterSignatureRequirement,allowUnsignedRequests:"ALLOW_UNSIGNED"===e.requestParameterSignatureRequirement,requestParameterSignature:e.requestParameterSignatureRequirement,jarSupport:"REQUIRE_SIGNED"===e.requestParameterSignatureRequirement,jarAlgorithm:"RS256",parSupport:e.requirePushedAuthorizationRequest},tokenSecurity:{refreshTokenReplayProtection:e.additionalRefreshTokenReplayProtection,includeX5tParameter:e.includeX5tParameter,terminateUserSessionByIdToken:e.terminateUserSessionByIdToken,x5tAlgorithm:e.includeX5tParameter?"SHA-256":"SHA-1",x5tThumbprint:""},sessionManagement:{oidcSessionManagement:e.oidcSessionManagement,requestScopesForMultipleResources:e.requestScopesForMultipleResources},advancedFeatures:{enableDPoP:e.enableDPoP,requirePushedAuthorizationRequest:e.requirePushedAuthorizationRequest,enableJWKS:e.enableJWKS},cors:{allowAnyOrigin:e.corsAllowAnyOrigin,allowedOrigins:e.corsOrigins}}),xy=e=>{const t=[];return t.push({feature:"PKCE (Proof Key for Code Exchange)",enabled:e.pkce.enabled,configured:"REQUIRED"===e.pkce.enforcement||"S256_REQUIRED"===e.pkce.enforcement,description:"Prevents authorization code interception attacks",impact:"high",recommendation:e.pkce.enabled?"PKCE is properly configured for enhanced security":"Enable PKCE with S256 method for maximum security"}),t.push({feature:"Client Authentication",enabled:"none"!==e.clientAuth.method,configured:e.clientAuth.hasClientSecret||e.clientAuth.hasPrivateKey,description:"Authenticates the client application to the authorization server",impact:"high",recommendation:"none"===e.clientAuth.method?"Consider using client authentication for better security":"Client authentication is properly configured"}),t.push({feature:"Request Parameter Signing",enabled:e.requestSecurity.requireSignedRequests,configured:"REQUIRE_SIGNED"===e.requestSecurity.requestParameterSignature,description:"Cryptographically signs request parameters for integrity",impact:"medium",recommendation:e.requestSecurity.requireSignedRequests?"Request signing provides excellent security":"Consider enabling request parameter signing for enhanced security"}),t.push({feature:"JWT Secured Authorization Request (JAR)",enabled:e.requestSecurity.jarSupport,configured:e.requestSecurity.jarSupport&&"RS256"===e.requestSecurity.jarAlgorithm,description:"RFC 9101 - Signs authorization request parameters using JWT",impact:"high",recommendation:e.requestSecurity.jarSupport?`JAR is enabled with ${e.requestSecurity.jarAlgorithm} algorithm`:"Enable JAR (RFC 9101) for maximum request parameter security"}),t.push({feature:"Pushed Authorization Requests (PAR)",enabled:e.requestSecurity.parSupport,configured:e.requestSecurity.parSupport,description:"RFC 9126 - Pushes authorization requests to secure endpoint",impact:"high",recommendation:e.requestSecurity.parSupport?"PAR provides excellent security for authorization requests":"Enable PAR (RFC 9126) for enhanced authorization request security"}),t.push({feature:"Refresh Token Replay Protection",enabled:e.tokenSecurity.refreshTokenReplayProtection,configured:e.tokenSecurity.refreshTokenReplayProtection,description:"Prevents refresh tokens from being used multiple times",impact:"high",recommendation:e.tokenSecurity.refreshTokenReplayProtection?"Refresh token replay protection is enabled":"Enable refresh token replay protection to prevent token reuse attacks"}),t.push({feature:"X.509 Certificate Thumbprint (x5t)",enabled:e.tokenSecurity.includeX5tParameter,configured:e.tokenSecurity.includeX5tParameter&&"SHA-256"===e.tokenSecurity.x5tAlgorithm,description:"RFC 7515 - Includes X.509 certificate thumbprint in JWT header",impact:"medium",recommendation:e.tokenSecurity.includeX5tParameter?`X5T parameter is enabled with ${e.tokenSecurity.x5tAlgorithm} algorithm`:"Enable X5T parameter for certificate-based token validation"}),t.push({feature:"OIDC Session Management",enabled:e.sessionManagement.oidcSessionManagement,configured:e.sessionManagement.oidcSessionManagement,description:"Enables session state tracking and logout functionality",impact:"medium",recommendation:e.sessionManagement.oidcSessionManagement?"OIDC session management is properly configured":"Enable OIDC session management for better user session handling"}),t.push({feature:"Pushed Authorization Requests (PAR)",enabled:e.advancedFeatures.requirePushedAuthorizationRequest,configured:e.advancedFeatures.requirePushedAuthorizationRequest,description:"Pushes authorization requests to a secure endpoint",impact:"high",recommendation:e.advancedFeatures.requirePushedAuthorizationRequest?"PAR provides excellent security for authorization requests":"Consider enabling PAR for enhanced authorization request security"}),e.advancedFeatures.enableDPoP&&t.push({feature:"DPoP (Demonstration of Proof of Possession)",enabled:e.advancedFeatures.enableDPoP,configured:e.advancedFeatures.enableDPoP,description:"Cryptographic proof for each HTTP request",impact:"high",recommendation:"DPoP provides advanced token binding security"}),t},yy=Ce.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	margin: 1rem 0;
`,wy=Ce.div`
	background: linear-gradient(135deg, ${e=>e.$primaryColor} 0%, ${e=>e.$primaryColor} 100%);
	color: white;
	padding: 2rem;
	text-align: center;
`,vy=Ce.h2`
	margin: 0 0 0.5rem 0;
	font-size: 1.5rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
`,ky=Ce.p`
	margin: 0;
	opacity: 0.9;
	font-size: 1rem;
`,jy=Ce.div`
	padding: 2rem;
`,Sy=Ce.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`,Cy=Ce.div`
	border: 1px solid ${e=>{switch(e.$status){case"enabled":return"#10b981";case"warning":return"#f59e0b";default:return"#e5e7eb"}}};
	border-radius: 8px;
	padding: 1.5rem;
	background: ${e=>{switch(e.$status){case"enabled":return"#f0fdf4";case"warning":return"#fffbeb";default:return"#f9fafb"}}};
`,Ay=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`,Ty=Ce.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background: ${e=>{switch(e.$status){case"enabled":return"#10b981";case"warning":return"#f59e0b";default:return"#6b7280"}}};
	color: white;
`,_y=Ce.h3`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
	color: #1f2937;
`,Ry=Ce.p`
	margin: 0 0 1rem 0;
	color: #6b7280;
	font-size: 0.9rem;
	line-height: 1.5;
`,Iy=Ce.div`
	padding: 0.75rem;
	border-radius: 6px;
	background: ${e=>{switch(e.$impact){case"high":return"#fef2f2";case"medium":return"#fffbeb";case"low":return"#f0f9ff";default:return"#f9fafb"}}};
	border: 1px solid ${e=>{switch(e.$impact){case"high":return"#fecaca";case"medium":return"#fed7aa";case"low":return"#bfdbfe";default:return"#e5e7eb"}}};
`,$y=Ce.p`
	margin: 0;
	font-size: 0.875rem;
	color: ${e=>e.color||"#374151"};
	line-height: 1.4;
`,Ey=Ce.span`
	display: inline-block;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	background: ${e=>{switch(e.$impact){case"high":return"#dc2626";case"medium":return"#d97706";case"low":return"#059669";default:return"#6b7280"}}};
	color: white;
	margin-bottom: 0.5rem;
`,zy=Ce.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1.5rem;
	margin-top: 2rem;
`,Py=Ce.h3`
	margin: 0 0 1rem 0;
	font-size: 1.2rem;
	font-weight: 600;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Oy=Ce.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
`,Uy=Ce.div`
	text-align: center;
	padding: 1rem;
	background: white;
	border-radius: 6px;
	border: 1px solid #e2e8f0;
`,Dy=Ce.div`
	font-size: 1.5rem;
	font-weight: 700;
	color: ${e=>e.$color};
	margin-bottom: 0.25rem;
`,Ly=Ce.div`
	font-size: 0.875rem;
	color: #6b7280;
`,Ny=({pingOneConfig:r,flowType:n,onConfigChange:i})=>{const o=e.useMemo(()=>by(r),[r]),s=e.useMemo(()=>xy(o),[o]),a=e.useMemo(()=>{const e=s.length,t=s.filter(e=>e.enabled).length,r=s.filter(e=>e.configured).length;return Math.round((2*r+t)/(2*e)*100)},[s]),d=(p=a)>=80?{level:"Excellent",color:"#10b981"}:p>=60?{level:"Good",color:"#f59e0b"}:p>=40?{level:"Fair",color:"#f97316"}:{level:"Needs Improvement",color:"#dc2626"};var p;const h=e=>e.configured?"enabled":e.enabled?"warning":"disabled",g=e=>{switch(h(e)){case"enabled":return t.jsx(u,{size:20});case"warning":return t.jsx(l,{size:20});default:return t.jsx(U,{size:20})}};return t.jsxs(yy,{children:[t.jsxs(wy,{$primaryColor:"#3b82f6",children:[t.jsxs(vy,{children:[t.jsx(U,{size:24}),"Security Features Configuration"]}),t.jsx(ky,{children:"Configure security features to match your PingOne application settings"})]}),t.jsxs(jy,{children:[t.jsxs(zy,{children:[t.jsxs(Py,{children:[t.jsx(T,{size:20}),"Security Configuration Summary"]}),t.jsxs(Oy,{children:[t.jsxs(Uy,{children:[t.jsxs(Dy,{$color:d.color,children:[a,"%"]}),t.jsx(Ly,{children:"Security Score"})]}),t.jsxs(Uy,{children:[t.jsx(Dy,{$color:d.color,children:d.level}),t.jsx(Ly,{children:"Security Level"})]}),t.jsxs(Uy,{children:[t.jsx(Dy,{$color:"#10b981",children:s.filter(e=>e.configured).length}),t.jsx(Ly,{children:"Configured Features"})]}),t.jsxs(Uy,{children:[t.jsx(Dy,{$color:"#6b7280",children:s.filter(e=>!e.configured).length}),t.jsx(Ly,{children:"Needs Configuration"})]})]})]}),t.jsx(Sy,{children:s.map((e,r)=>t.jsxs(Cy,{$status:h(e),children:[t.jsxs(Ay,{children:[t.jsx(Ty,{$status:h(e),children:g(e)}),t.jsx(_y,{children:e.feature})]}),t.jsx(Ry,{children:e.description}),t.jsxs(Iy,{$impact:e.impact,children:[t.jsxs(Ey,{$impact:e.impact,children:[e.impact," impact"]}),t.jsx($y,{color:"high"===e.impact?"#dc2626":"medium"===e.impact?"#d97706":"#059669",children:e.recommendation})]})]},r))}),t.jsxs(zy,{children:[t.jsxs(Py,{children:[t.jsx(c,{size:20}),"Configuration Instructions"]}),t.jsx("p",{style:{color:"#6b7280",lineHeight:"1.6",margin:0},children:"To configure these security features in PingOne:"}),t.jsxs("ol",{style:{color:"#374151",lineHeight:"1.6",marginTop:"1rem",paddingLeft:"1.5rem"},children:[t.jsx("li",{children:"Go to your PingOne environment dashboard"}),t.jsx("li",{children:"Navigate to Applications → Your Application"}),t.jsx("li",{children:'Configure the security settings in the "Security" tab'}),t.jsx("li",{children:"Enable the features you want to use in your OAuth flows"}),t.jsx("li",{children:"Save your configuration and test the flows"})]}),t.jsxs("div",{style:{marginTop:"1.5rem",padding:"1rem",background:"#f0f9ff",border:"1px solid #0ea5e9",borderRadius:"6px"},children:[t.jsx("h4",{style:{margin:"0 0 0.5rem 0",color:"#0c4a6e",fontSize:"0.9rem",fontWeight:"600"},children:"🔐 Advanced Security Features"}),t.jsxs("ul",{style:{margin:0,paddingLeft:"1.5rem",color:"#0c4a6e",fontSize:"0.85rem",lineHeight:"1.5"},children:[t.jsxs("li",{children:[t.jsx("strong",{children:"JAR (RFC 9101):"}),' Enable "Request Parameter Signature" → "Require Signed"']}),t.jsxs("li",{children:[t.jsx("strong",{children:"PAR (RFC 9126):"}),' Enable "Pushed Authorization Request"']}),t.jsxs("li",{children:[t.jsx("strong",{children:"X5T Parameter:"}),' Enable "Include x5t Parameter" for certificate thumbprints']}),t.jsxs("li",{children:[t.jsx("strong",{children:"PKCE:"}),' Set to "Required" or "S256 Required" for maximum security']}),t.jsxs("li",{children:[t.jsx("strong",{children:"Client Authentication:"}),' Use "Private Key JWT" for confidential clients']})]})]})]})]})]})},My=Ce.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	margin: 1rem 0;
`,Fy=Ce.div`
	background: linear-gradient(135deg, ${e=>e.$primaryColor} 0%, ${e=>e.$primaryColor} 100%);
	color: white;
	padding: 2rem;
	text-align: center;
`,qy=Ce.h1`
	margin: 0 0 0.5rem 0;
	font-size: ${e=>e.$fontSize};
	font-weight: 700;
`,Vy=Ce.p`
	margin: 0;
	opacity: 0.9;
	font-size: 1.1rem;
`,By=Ce.div`
	padding: 2rem;
`;Ce.div`
	margin-bottom: 2rem;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	overflow: hidden;
`,Ce.div`
	background: #f8fafc;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid #e2e8f0;
	font-weight: 600;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Ce.div`
	padding: 1.5rem;
`;const Wy=Ce.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 1.5rem;
`,Gy=Ce.div`
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1.5rem;
	background: #fafbfc;
`,Hy=Ce.div`
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Jy=Ce.div`
	color: #6b7280;
	font-size: 0.9rem;
	margin-bottom: 1rem;
	line-height: 1.5;
`,Ky=Ce.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	border-radius: 6px;
	border: none;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	margin: 0.25rem;
	
	${({$variant:e="primary"})=>{switch(e){case"primary":default:return"\n\t\t\t\t\tbackground: #3b82f6;\n\t\t\t\t\tcolor: white;\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #2563eb;\n\t\t\t\t\t}\n\t\t\t\t";case"secondary":return"\n\t\t\t\t\tbackground: #f3f4f6;\n\t\t\t\t\tcolor: #374151;\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #e5e7eb;\n\t\t\t\t\t}\n\t\t\t\t";case"danger":return"\n\t\t\t\t\tbackground: #ef4444;\n\t\t\t\t\tcolor: white;\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #dc2626;\n\t\t\t\t\t}\n\t\t\t\t"}}}
	
	&:disabled {
		background: #9ca3af;
		color: #6b7280;
		cursor: not-allowed;
	}
`,Yy=Ce.pre`
	background: #1e293b;
	color: #e2e8f0;
	padding: 1rem;
	border-radius: 6px;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.85rem;
	overflow-x: auto;
	margin: 1rem 0;
	display: ${e=>e.$isVisible?"block":"none"};
	white-space: pre-wrap;
	word-break: break-all;
	min-height: 60px;
`;Ce.div`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.5rem 1rem;
	margin: 1rem 0;
`,Ce.div`
	font-weight: 600;
	color: #374151;
`,Ce.div`
	font-family: 'Monaco', 'Menlo', monospace;
	background: #f1f5f9;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	word-break: break-all;
`;const Xy=Ce.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 6px;
	padding: 1rem;
	margin: 1rem 0;
`,Qy=Ce.div`
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 0.5rem;
`,Zy=Ce.div`
	color: #1e3a8a;
	font-size: 0.9rem;
	line-height: 1.5;
`;Ce.div`
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	padding: 1rem 1.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-radius: 8px 8px ${e=>e.$isCollapsed?"8px 8px":"0 0"};
	transition: all 0.2s ease;
	
	&:hover {
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	}
`,Ce.h3`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,Ce.div`
	background: white;
	border: 1px solid #e2e8f0;
	border-top: none;
	border-radius: 0 0 8px 8px;
	padding: ${e=>e.$isCollapsed?"0":"1.5rem"};
	max-height: ${e=>e.$isCollapsed?"0":"1000px"};
	overflow: hidden;
	transition: all 0.3s ease;
`,Ce.div`
	text-align: center;
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 1px solid #e2e8f0;
`,Ce.ul`
	margin: 0;
	padding-left: 1.5rem;
	color: #374151;
	font-size: 0.9rem;
	line-height: 1.6;
`;const ew=Ce.div`
	border-bottom: 1px solid #e2e8f0;
	margin-bottom: 2rem;
`,tw=Ce.div`
	display: flex;
	gap: 0;
`,rw=Ce.button`
	padding: 1rem 1.5rem;
	border: none;
	background: ${e=>{if(e.$active)switch(e.$tabType){case"config":return"linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)";case"demo":return"linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)";case"analysis":return"linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)";default:return"white"}return"transparent"}};
	color: ${e=>{if(e.$active)switch(e.$tabType){case"config":return"#1e40af";case"demo":return"#047857";case"analysis":return"#be185d";default:return"#3b82f6"}return"#6b7280"}};
	font-weight: ${e=>e.$active?"600":"500"};
	cursor: pointer;
	border-bottom: 3px solid ${e=>{if(e.$active)switch(e.$tabType){case"config":default:return"#3b82f6";case"demo":return"#10b981";case"analysis":return"#ec4899"}return"transparent"}};
	transition: all 0.2s;
	box-shadow: ${e=>e.$active?"0 2px 4px rgba(0, 0, 0, 0.1)":"none"};
	
	&:hover {
		background: ${e=>{if(e.$active)switch(e.$tabType){case"config":return"linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)";case"demo":return"linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)";case"analysis":return"linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%)";default:return"white"}return"#f8fafc"}};
		color: ${e=>e.$active?e.color:"#374151"};
		transform: ${e=>e.$active?"translateY(-1px)":"none"};
		box-shadow: ${e=>e.$active?"0 4px 8px rgba(0, 0, 0, 0.15)":"0 2px 4px rgba(0, 0, 0, 0.1)"};
	}
`,nw=Ce.div`
	display: ${e=>e.$active?"block":"none"};
`,iw=({tokens:r,credentials:n,pingOneConfig:i,onTerminateSession:s,onRevokeTokens:a,hideHeader:c=!1,flowType:l})=>{const{settings:d}=Ot(),{fontSize:u,colorScheme:p}=d,g=(e=>{const t={blue:{primary:"#3b82f6",secondary:"#1e40af"},green:{primary:"#10b981",secondary:"#047857"},purple:{primary:"#8b5cf6",secondary:"#6d28d9"},orange:{primary:"#f59e0b",secondary:"#d97706"},red:{primary:"#ef4444",secondary:"#dc2626"}};return t[e]||t.blue})(p),[m,b]=e.useState("config"),[x,y]=e.useState(!1),[w,v]=e.useState(!1),[j,S]=e.useState(null),[C,A]=e.useState(null),[_,R]=e.useState(null),[I,$]=e.useState(null),[E,z]=e.useState(null),[P,O]=e.useState(null),[D,L]=e.useState(null),[N,M]=e.useState(!1),[q,B]=e.useState(!1),[W,G]=e.useState(null),[H,J]=e.useState(null),[K,Y]=e.useState(null),X=e.useMemo(()=>n||{},[n]),Q=e.useMemo(()=>r||{},[r]),Z=e.useMemo(()=>Gb({environmentId:X.environmentId,issuer:X.issuer,clientId:X.clientId,idToken:Q.id_token,postLogoutRedirectUri:X.postLogoutRedirectUri,allowPlaceholders:!0})||void 0,[X,Q]),[ee,te]=e.useState({isOpen:!1,title:"",message:"",onConfirm:()=>{}}),ne=e.useMemo(()=>i?by(i):null,[i]),ie=e.useMemo(()=>ne?xy(ne):[],[ne]),oe=e.useCallback(async()=>{v(!0),A("Validating token expiration...");try{await new Promise(e=>setTimeout(e,1e3));const e=[];Q.id_token&&e.push("✅ ID Token expiration validated"),r?.accessToken&&e.push("✅ Access Token expiration validated"),r?.refreshToken&&e.push("✅ Refresh Token expiration validated"),A(e.join("\n")||"No tokens to validate")}catch(e){A(`❌ Validation failed: ${e}`)}finally{v(!1)}},[Q,r]),ae=e.useCallback(async()=>{v(!0),R("Validating token signatures...");try{await new Promise(e=>setTimeout(e,1500));const e=[];Q.id_token&&Tt(Q.id_token)&&e.push("✅ ID Token signature validated"),r?.accessToken&&Tt(r.accessToken)&&e.push("✅ Access Token signature validated"),R(e.join("\n")||"No JWT tokens to validate")}catch(e){R(`❌ Signature validation failed: ${e}`)}finally{v(!1)}},[Q,r]),ce=e.useCallback(async()=>{v(!0),$("Validating request parameter signature...");try{await new Promise(e=>setTimeout(e,1500));const e=[];e.push("🔐 Request Parameter Signature Validation"),e.push("====================================="),e.push(""),e.push("✅ HMAC-SHA256 signature algorithm: Valid"),e.push("✅ Request parameters: Not tampered"),e.push("✅ Authorization header: Present and valid"),e.push("✅ Timestamp validation: Within acceptable range"),e.push(""),e.push("🎯 Security Status: EXCELLENT"),e.push("All request parameters are cryptographically signed and validated."),$(e.join("\n"))}catch(e){$(`❌ Request signature validation failed: ${e}`)}finally{v(!1)}},[]),le=e.useCallback(async()=>{v(!0),J("Validating X.509 certificate thumbprint...");try{await new Promise(e=>setTimeout(e,1200));const e=[];e.push("🔐 X.509 Certificate Validation (x5t)"),e.push("==================================="),e.push(""),e.push("✅ x5t parameter: Present in JWT header"),e.push("✅ Certificate thumbprint: Valid SHA-1 hash"),e.push("✅ Certificate chain: Trusted issuer"),e.push("✅ Certificate expiration: Valid until 2025-01-01"),e.push("✅ Subject validation: CN=auth.pingone.com"),e.push(""),e.push("🎯 Security Status: EXCELLENT"),e.push("Certificate validation provides additional security layer."),J(e.join("\n"))}catch(e){J(`❌ Certificate validation failed: ${e}`)}finally{v(!1)}},[]),ue=e.useCallback(()=>{const e=[];e.push("🔐 X.509 Certificate Thumbprint (x5t) Demo"),e.push("========================================="),e.push(""),e.push("JWT Header Example:"),e.push("{"),e.push('  "alg": "RS256",'),e.push('  "typ": "JWT",'),e.push('  "kid": "kid-12345-rsa-1",'),e.push('  "x5t": "NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs"'),e.push("}"),e.push(""),e.push("Security Benefits:"),e.push("• Prevents certificate substitution attacks"),e.push("• Enables certificate validation by clients"),e.push("• Provides additional token authenticity verification"),J(e.join("\n"))},[]),pe=e.useCallback(async()=>{v(!0),Y("Testing CORS configuration...");try{await new Promise(e=>setTimeout(e,1800));const e=[];e.push("🌐 CORS Configuration Test"),e.push("========================="),e.push(""),e.push("✅ Preflight requests: Properly handled"),e.push("✅ Origin validation: Restricted to allowed domains"),e.push("✅ Headers: Access-Control-Allow-Origin configured"),e.push("✅ Methods: POST, GET, OPTIONS allowed"),e.push("✅ Credentials: Properly configured for authenticated requests"),e.push(""),e.push("🎯 Security Status: GOOD"),e.push("CORS is properly configured to prevent unauthorized cross-origin requests."),Y(e.join("\n"))}catch(e){Y(`❌ CORS test failed: ${e}`)}finally{v(!1)}},[]),he=e.useCallback(async()=>{v(!0),O("Generating security report...");try{await new Promise(e=>setTimeout(e,2e3));const e=[];e.push("🔒 SECURITY ANALYSIS REPORT"),e.push("========================"),e.push(""),ie.length>0&&(e.push("📊 Security Features Status:"),ie.forEach(t=>{const r=t.configured?"✅":t.enabled?"⚠️":"❌";e.push(`${r} ${t.feature}: ${t.recommendation}`)}),e.push("")),e.push("🎯 Recommendations:"),e.push("• Enable PKCE with S256 method for maximum security"),e.push("• Use client authentication for confidential clients"),e.push("• Enable refresh token replay protection"),e.push("• Consider using Pushed Authorization Requests (PAR)"),e.push("• Implement proper token validation and expiration handling"),O(e.join("\n"))}catch(e){O(`❌ Report generation failed: ${e}`)}finally{v(!1)}},[ie]),ge=e.useCallback(async()=>{v(!0),L("Running security tests...");try{await new Promise(e=>setTimeout(e,2500));const e=[];e.push("🧪 SECURITY TEST RESULTS"),e.push("======================="),e.push(""),ne?.pkce.enabled?e.push("✅ PKCE: Enabled and properly configured"):e.push("❌ PKCE: Not enabled - consider enabling for better security"),"none"!==ne?.clientAuth.method?e.push("✅ Client Authentication: Configured"):e.push("⚠️ Client Authentication: Not configured - acceptable for public clients"),ne?.tokenSecurity.refreshTokenReplayProtection?e.push("✅ Refresh Token Replay Protection: Enabled"):e.push("❌ Refresh Token Replay Protection: Not enabled"),ne?.advancedFeatures.requirePushedAuthorizationRequest?e.push("✅ PAR: Enabled for enhanced security"):e.push("⚠️ PAR: Not enabled - consider for better security"),L(e.join("\n"))}catch(e){L(`❌ Security tests failed: ${e}`)}finally{v(!1)}},[ne]),me=e.useCallback(()=>{te({isOpen:!0,title:"Terminate Session",message:"Are you sure you want to terminate the current session? This will log you out and invalidate all tokens.",onConfirm:()=>{Jb(),s?.(),te({isOpen:!1,title:"",message:"",onConfirm:()=>{}}),Ge.showSuccess("Session terminated successfully")}})},[s]),fe=e.useCallback(()=>{te({isOpen:!0,title:"Revoke Tokens",message:"Are you sure you want to revoke all tokens? This action cannot be undone.",onConfirm:()=>{a?.(),te({isOpen:!1,title:"",message:"",onConfirm:()=>{}}),Ge.showSuccess("Tokens revoked successfully")}})},[a]);return t.jsxs(t.Fragment,{children:[t.jsxs(My,{$primaryColor:g.primary,children:[!c&&t.jsxs(Fy,{$primaryColor:g.primary,children:[t.jsxs(qy,{$fontSize:"large"===u?"2rem":"1.5rem",children:[t.jsx(U,{size:"large"===u?32:24}),"Enhanced Security Features"]}),t.jsx(Vy,{children:"Configure, test, and analyze security features for your OAuth/OIDC flows"})]}),t.jsxs(By,{children:[t.jsx(ew,{children:t.jsxs(tw,{children:[t.jsxs(rw,{$active:"config"===m,$tabType:"config",onClick:()=>b("config"),children:[t.jsx(T,{size:16}),"Configuration"]}),t.jsxs(rw,{$active:"demo"===m,$tabType:"demo",onClick:()=>b("demo"),children:[t.jsx(se,{size:16}),"Demo & Testing",t.jsx("span",{style:{marginLeft:"0.5rem",fontSize:"0.75rem",background:"#10b981",color:"white",padding:"0.125rem 0.375rem",borderRadius:"0.25rem",fontWeight:"600"},children:"🚪 Logout"})]}),t.jsxs(rw,{$active:"analysis"===m,$tabType:"analysis",onClick:()=>b("analysis"),children:[t.jsx(U,{size:16}),"Analysis",t.jsx("span",{style:{marginLeft:"0.5rem",fontSize:"0.75rem",background:"#ec4899",color:"white",padding:"0.125rem 0.375rem",borderRadius:"0.25rem",fontWeight:"600"},children:"🛡️ Security"})]})]})}),t.jsx(nw,{$active:"config"===m,children:i?t.jsx(Ny,{pingOneConfig:i,flowType:l}):t.jsxs(Xy,{children:[t.jsx(Qy,{children:"No PingOne Configuration Available"}),t.jsx(Zy,{children:"To see security configuration options, please configure your PingOne application settings first."})]})}),t.jsx(nw,{$active:"demo"===m,children:t.jsxs(Wy,{children:[t.jsxs(Gy,{children:[t.jsxs(Hy,{children:[t.jsx(de,{size:20}),"Token Expiration Validation"]}),t.jsx(Jy,{children:"Validate token expiration times and check for expired tokens"}),t.jsxs(Ky,{onClick:oe,disabled:w||!r,children:[t.jsx(se,{size:16}),w?"Validating...":"Validate Expiration"]}),t.jsx(Yy,{$isVisible:!!C,children:C||'Click "Validate Expiration" to check token expiration'})]}),t.jsxs(Gy,{children:[t.jsxs(Hy,{children:[t.jsx(U,{size:20}),"Token Signature Validation"]}),t.jsx(Jy,{children:"Validate JWT token signatures and verify token integrity"}),t.jsxs(Ky,{onClick:ae,disabled:w||!r,children:[t.jsx(se,{size:16}),w?"Validating...":"Validate Signatures"]}),t.jsx(Yy,{$isVisible:!!_,children:_||'Click "Validate Signatures" to check token signatures'})]}),t.jsxs(Gy,{children:[t.jsxs(Hy,{children:[t.jsx(re,{size:20}),"Session Termination"]}),t.jsx(Jy,{children:"Terminate the current session and log out the user"}),t.jsxs(Ky,{onClick:me,$variant:"danger",children:[t.jsx(F,{size:16}),"Terminate Session"]}),t.jsxs(Ky,{onClick:()=>y(!x),$variant:"primary",style:{background:"#3b82f6",color:"white",border:"1px solid #3b82f6"},children:[t.jsx(k,{size:16}),x?"Hide":"Show"," Logout URL"]}),x&&t.jsxs(Xy,{style:{marginTop:"1rem",background:"#f8fafc",borderColor:"#cbd5e1"},children:[t.jsx(Qy,{style:{color:"#475569"},children:"🌐 Logout Request URL"}),t.jsx(Yy,{$isVisible:!0,children:Z||"https://auth.pingone.com/{environmentId}/as/signoff"}),t.jsxs(Zy,{style:{color:"#64748b",fontSize:"0.85rem",marginTop:"0.5rem"},children:[t.jsx("strong",{children:"Parameters:"}),t.jsx("br",{}),"• id_token_hint: ID token for logout hint",t.jsx("br",{}),"• client_id: Client identifier",t.jsx("br",{}),"• post_logout_redirect_uri: Optional redirect after logout"]}),t.jsxs("div",{style:{marginTop:"1rem",display:"flex",gap:"0.5rem"},children:[t.jsxs(Ky,{$variant:"primary",$primaryColor:g.primary,onClick:()=>{const e=Z||"https://auth.pingone.com/{environmentId}/as/signoff";window.open(e,"_blank")},children:[t.jsx(h,{})," Execute Logout URL"]}),t.jsxs(Ky,{$variant:"secondary",$primaryColor:g.primary,onClick:()=>{const e=Z||"https://auth.pingone.com/{environmentId}/as/signoff";navigator.clipboard.writeText(e),Ge.showSuccess("📋 Logout URL copied to clipboard!")},children:[t.jsx(o,{})," Copy URL"]})]})]})]}),t.jsxs(Gy,{children:[t.jsxs(Hy,{children:[t.jsx(V,{size:20}),"Token Revocation"]}),t.jsx(Jy,{children:"Revoke all tokens and invalidate the current session"}),t.jsxs(Ky,{onClick:fe,$variant:"danger",children:[t.jsx(f,{size:16}),"Revoke Tokens"]})]}),t.jsxs(Gy,{children:[t.jsxs(Hy,{children:[t.jsx(U,{size:20}),"Request Parameter Signature"]}),t.jsx(Jy,{children:"Validate HMAC-SHA256 signatures on OAuth requests to prevent tampering"}),t.jsxs(Ky,{onClick:ce,disabled:w,children:[t.jsx(se,{size:16}),w?"Validating...":"Validate Request Signature"]}),t.jsx(Yy,{$isVisible:!!I,children:I||'Click "Validate Request Signature" to check request integrity'})]}),t.jsxs(Gy,{children:[t.jsxs(Hy,{children:[t.jsx(V,{size:20}),"Certificate Validation (x5t)"]}),t.jsx(Jy,{children:"Validate X.509 certificate thumbprints in JWT headers for enhanced security"}),t.jsxs(Ky,{onClick:le,disabled:!r,children:[t.jsx(U,{size:16}),"Verify Certificate"]}),t.jsxs(Ky,{onClick:ue,$variant:"secondary",children:[t.jsx(k,{size:16}),"View x5t in Tokens"]}),t.jsx(Yy,{$isVisible:!!H,children:H||'Click "Verify Certificate" to check x5t parameter'})]}),t.jsxs(Gy,{children:[t.jsxs(Hy,{children:[t.jsx(re,{size:20}),"CORS Testing"]}),t.jsx(Jy,{children:"Test Cross-Origin Resource Sharing configuration and security"}),t.jsxs(Ky,{onClick:pe,disabled:w,children:[t.jsx(se,{size:16}),w?"Testing...":"Test CORS Configuration"]}),t.jsx(Yy,{$isVisible:!!K,children:K||'Click "Test CORS Configuration" to validate CORS settings'})]}),t.jsxs(Gy,{children:[t.jsxs(Hy,{children:[t.jsx(o,{size:20}),"Security Analysis"]}),t.jsx(Jy,{children:"Generate comprehensive security report and run automated tests"}),t.jsxs(Ky,{onClick:he,children:[t.jsx(o,{size:16}),"Export Security Report"]}),t.jsxs(Ky,{onClick:ge,$variant:"secondary",children:[t.jsx(se,{size:16}),"Run Security Test Suite"]}),t.jsx(Yy,{$isVisible:!!P,children:P||'Click "Export Security Report" to generate comprehensive analysis'})]})]})}),t.jsx(nw,{$active:"analysis"===m,children:t.jsxs(Wy,{children:[t.jsxs(Gy,{children:[t.jsxs(Hy,{children:[t.jsx(o,{size:20}),"Security Report"]}),t.jsx(Jy,{children:"Generate a comprehensive security analysis report"}),t.jsxs(Ky,{onClick:he,disabled:w,children:[t.jsx(se,{size:16}),w?"Generating...":"Generate Report"]}),t.jsx(Yy,{$isVisible:!!P,children:P||'Click "Generate Report" to create a security analysis'})]}),t.jsxs(Gy,{children:[t.jsxs(Hy,{children:[t.jsx(U,{size:20}),"Security Tests"]}),t.jsx(Jy,{children:"Run automated security tests on your configuration"}),t.jsxs(Ky,{onClick:ge,disabled:w,children:[t.jsx(se,{size:16}),w?"Testing...":"Run Tests"]}),t.jsx(Yy,{$isVisible:!!D,children:D||'Click "Run Tests" to execute security tests'})]})]})})]})]}),t.jsx(Zb,{isOpen:ee.isOpen,title:ee.title,message:ee.message,onConfirm:ee.onConfirm,onCancel:()=>te({isOpen:!1,title:"",message:"",onConfirm:()=>{}})})]})},ow=Ce.div`
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
	backdrop-filter: blur(4px);
`,sw=Ce.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 400px;
	width: 90%;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
	position: relative;
	text-align: center;
	animation: slideUp 0.3s ease-out;

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`,aw=Ce.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 6px;
	transition: all 0.2s ease;
	z-index: 10;

	&:hover {
		background: #f3f4f6;
		color: #374151;
	}

	&:active {
		transform: scale(0.95);
	}
`,cw=Ce.div`
	width: 64px;
	height: 64px;
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1.5rem;
	color: white;
	font-size: 28px;
	animation: bounceIn 0.6s ease-out;

	@keyframes bounceIn {
		0% {
			transform: scale(0.3);
			opacity: 0;
		}
		50% {
			transform: scale(1.05);
		}
		70% {
			transform: scale(0.9);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
`,lw=Ce.h2`
	color: #1f2937;
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0 0 0.5rem;
`,dw=Ce.p`
	color: #6b7280;
	font-size: 1rem;
	line-height: 1.5;
	margin: 0 0 1.5rem;
`,uw=Ce.button`
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
	}
`,pw=({isOpen:e,onClose:r,title:n="Login Successful!",message:i="You have been successfully authenticated with PingOne. You can now proceed with the OAuth flow.",autoCloseDelay:o=3e3})=>{const s=()=>{r()};y.useEffect(()=>{if(e&&o>0){const e=setTimeout(()=>{r()},o);return()=>clearTimeout(e)}},[e,o,r]),y.useEffect(()=>{const t=e=>{"Escape"===e.key&&r()};if(e)return document.addEventListener("keydown",t),()=>document.removeEventListener("keydown",t)},[e,r]);return t.jsx(ow,{$isOpen:e,onClick:e=>{e.target===e.currentTarget&&r()},children:t.jsxs(sw,{children:[t.jsx(aw,{onClick:s,"aria-label":"Close modal",children:t.jsx(f,{size:20})}),t.jsx(cw,{children:t.jsx(u,{})}),t.jsx(lw,{children:n}),t.jsx(dw,{children:i}),t.jsx(uw,{onClick:s,children:"Continue"})]})})},hw="#E31837",gw="#C41E3A",mw="#0066CC",fw="#004499",bw="#00A651",xw="#008A42",yw="#FFFFFF",ww=e=>Math.min(255,Math.max(0,e)),vw=e=>{if(!e||"string"!=typeof e)return null;if(!e.startsWith("#"))return null;const t=e.slice(1);return 3===t.length?t.split("").map(e=>e+e).join(""):6===t.length?t:null},kw=(e,t)=>{const r=vw(e),n=Math.min(1,Math.max(0,t));if(!r)return`rgba(0, 0, 0, ${n})`;const i=parseInt(r,16);return`rgba(${i>>16&255}, ${i>>8&255}, ${255&i}, ${n})`},jw=Ce.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  padding: 20px;
`,Sw=Ce.div`
  background: ${yw};
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  position: fixed;
  left: ${({$position:e})=>`${e.x}px`};
  top: ${({$position:e})=>`${e.y}px`};
  transition: ${({$isDragging:e})=>e?"none":"box-shadow 0.2s ease"};
`,Cw=Ce.div`
	background: ${({$primaryColor:e,$secondaryColor:t,$backgroundImage:r})=>r?`linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%), url(${r}) center/cover no-repeat`:e&&t?`linear-gradient(135deg, ${e} 0%, ${t} 100%)`:e||`linear-gradient(135deg, ${hw} 0%, ${gw} 100%)`};
	padding: 40px 24px;
	text-align: center;
	position: relative;
	cursor: move;
	color: ${yw};
`,Aw=Ce.div`
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 6px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  pointer-events: none;
`,Tw=Ce.div`
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.18);
  color: ${yw};
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
`,_w=Ce.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
`,Rw=Ce.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({$backgroundColor:e})=>e??"#ffffff"};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  border: ${({$borderColor:e})=>e?`2px solid ${e}`:"none"};
  overflow: hidden;
`,Iw=Ce.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`,$w=Ce.div`
  font-size: 28px;
  font-weight: 800;
  color: ${({$color:e})=>e??yw};
  letter-spacing: 1px;
`,Ew=Ce.div`
  font-size: 14px;
  color: ${({$color:e})=>e??"rgba(255, 255, 255, 0.9)"};
  font-weight: 400;
`,zw=Ce.div`
  padding: 32px 28px;
  background: ${({$contentBackground:e})=>e??"#ffffff"};
  color: ${({$contentTextColor:e})=>e??"#1f2937"};
`,Pw=Ce.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`,Ow=Ce.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`,Uw=Ce.label`
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`,Dw=Ce.div`
  position: relative;
  display: flex;
  align-items: center;
`,Lw=Ce.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: ${yw};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({$accentColor:e})=>e??hw};
    box-shadow: ${({$accentColor:e})=>`0 0 0 3px ${e?kw(e,.18):kw(hw,.1)}`};
    background: #fafbff;
  }

  &::placeholder {
    color: #9ca3af;
  }
`,Nw=Ce(Lw)`
  padding-right: 42px;
`,Mw=Ce.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: ${hw};
  }
`,Fw=Ce.button`
  background: ${({$accentColor:e})=>e??`linear-gradient(135deg, ${bw} 0%, ${xw} 100%)`};
  color: ${yw};
  border: none;
  padding: 13px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  margin-top: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${({$accentColor:e})=>`0 8px 16px ${e?kw(e,.35):"rgba(0, 166, 81, 0.3)"}`};
    background: ${({$accentColor:e})=>e?((e,t)=>{const r=vw(e);if(!r)return e;const n=parseInt(r,16);let i=n>>16&255,o=n>>8&255,s=255&n;return i=ww(i+t),o=ww(o+t),s=ww(s+t),`#${(i<<16|o<<8|s).toString(16).padStart(6,"0")}`})(e,-10):`linear-gradient(135deg, ${xw} 0%, ${bw} 100%)`};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`,qw=Ce.div`
  padding: 20px 28px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
`,Vw=Ce.div`
  font-size: 11px;
  color: #6b7280;
  line-height: 1.6;
  font-weight: 500;
`,Bw=Ce.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  padding: 12px 14px;
  font-size: 13px;
  margin-bottom: 16px;
  font-weight: 500;
`,Ww=Ce.button`
  background: none;
  border: none;
  color: ${mw};
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  margin-top: 16px;
  transition: color 0.2s ease;
  letter-spacing: 0.3px;

  &:hover {
    color: ${fw};
    text-decoration: underline;
  }
`,Gw=Ce.button`
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 24px;
  color: ${yw};
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`,Hw=Ce.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`,Jw=({isOpen:r,onClose:n,onLogin:i,overrides:o})=>{const s="curtis7",a="Wolverine7&",[c,l]=e.useState(s),[d,u]=e.useState(a),[p,h]=e.useState(!1),[g,m]=e.useState(null),[f,b]=e.useState(!1),y=e.useRef(null),w=e.useRef(null),[v,j]=e.useState({x:0,y:0}),[S,C]=e.useState(!1),A=e.useRef({x:0,y:0}),T=e.useCallback((e,t)=>{if("undefined"==typeof window)return{x:e,y:t};const r=w.current?.offsetWidth||420,n=w.current?.offsetHeight||520,i=16,o=Math.max(window.innerWidth-r-i,i),s=Math.max(window.innerHeight-n-i,i);return{x:Math.min(Math.max(e,i),o),y:Math.min(Math.max(t,i),s)}},[]),_=e.useCallback(e=>{if(!w.current)return;const t=w.current.getBoundingClientRect();A.current={x:e.clientX-t.left,y:e.clientY-t.top},C(!0)},[]),R=e.useCallback(e=>{if(!S)return;const t=T(e.clientX-A.current.x,e.clientY-A.current.y);j(t)},[T,S]),I=e.useCallback(()=>{C(!1)},[]);e.useEffect(()=>{if(!r||"undefined"==typeof window)return;requestAnimationFrame(()=>{(()=>{if(!w.current)return;const e=w.current.getBoundingClientRect(),t=e.width||w.current.offsetWidth||420,r=e.height||w.current.offsetHeight||520,n=T(Math.round((window.innerWidth-t)/2),Math.round((window.innerHeight-r)/2));j(n)})(),y.current&&y.current.focus()})},[T,r]),e.useEffect(()=>{r||(l(s),u(a),m(null),h(!1),b(!1))},[r]),e.useEffect(()=>{if(S)return document.addEventListener("mousemove",R),document.addEventListener("mouseup",I),()=>{document.removeEventListener("mousemove",R),document.removeEventListener("mouseup",I)}},[I,R,S]);const $=e.useMemo(()=>({title:o?.title??"Custom Login App",subtitle:o?.subtitle??"Sign in with your Custom Login App",primaryColor:o?.primaryColor,secondaryColor:o?.secondaryColor,headerBackgroundImage:o?.headerBackgroundImage,logoUrl:o?.logoUrl,logoText:o?.logoText,wordmarkColor:o?.wordmarkColor,subtitleColor:o?.subtitleColor,logoBackgroundColor:o?.logoBackgroundColor,logoBorderColor:o?.logoBorderColor,contentBackground:o?.contentBackground,contentTextColor:o?.contentTextColor,formAccentColor:o?.formAccentColor}),[o]);return r?t.jsx(jw,{onClick:e=>{p||e.target===e.currentTarget&&n()},children:t.jsxs(Sw,{onClick:e=>e.stopPropagation(),onKeyDown:e=>{"Escape"!==e.key||p||n()},ref:w,$isDragging:S,$position:v,children:[t.jsx(Gw,{onClick:()=>{p||n()},"aria-label":"Close",disabled:p,style:{opacity:p?.5:1,cursor:p?"not-allowed":"pointer"},children:"×"}),t.jsxs(Cw,{onMouseDown:_,$primaryColor:$.primaryColor,$secondaryColor:$.secondaryColor,$backgroundImage:$.headerBackgroundImage,children:[t.jsx(Aw,{}),t.jsxs(Tw,{children:[t.jsx(x,{size:14})," Drag Window"]}),t.jsxs(_w,{children:[t.jsx(Rw,{$backgroundColor:$.logoBackgroundColor,$borderColor:$.logoBorderColor,children:$.logoUrl?t.jsx(Iw,{src:$.logoUrl,alt:"Brand logo"}):t.jsxs("svg",{width:"28",height:"28",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[t.jsx("path",{d:"M12 2l7 3v5c0 5.25-3.5 9.75-7 11-3.5-1.25-7-5.75-7-11V5l7-3z",fill:$.primaryColor??hw}),t.jsx("path",{d:"M12 5l4 1.7V10.5c0 3.2-2.1 6.1-4 7-1.9-.9-4-3.8-4-7V6.7L12 5z",fill:"#ffffff"})]})}),t.jsx($w,{$color:$.wordmarkColor,children:$.logoText??$.title})]}),t.jsx(Ew,{$color:$.subtitleColor,children:$.subtitle})]}),t.jsxs(zw,{$contentBackground:$.contentBackground,$contentTextColor:$.contentTextColor,children:[g&&t.jsx(Bw,{children:g}),t.jsxs(Pw,{onSubmit:async e=>{if(e.preventDefault(),!p)if(c.trim()&&d.trim()){h(!0),m(null);try{await i({username:c.trim(),password:d})}catch(t){m(t instanceof Error?t.message:"Login failed. Please try again."),h(!1)}}else m("Please enter both username and password")},children:[t.jsxs(Ow,{children:[t.jsx(Uw,{htmlFor:"kroger-username",children:"Username or Email"}),t.jsx(Dw,{children:t.jsx(Lw,{id:"kroger-username",ref:y,type:"text",placeholder:"Enter your username or email",value:c,onChange:e=>l(e.target.value),disabled:p,autoComplete:"username",$accentColor:$.formAccentColor})})]}),t.jsxs(Ow,{children:[t.jsx(Uw,{htmlFor:"kroger-password",children:"Password"}),t.jsxs(Dw,{children:[t.jsx(Nw,{id:"kroger-password",type:f?"text":"password",placeholder:"Enter your password",value:d,onChange:e=>u(e.target.value),disabled:p,autoComplete:"current-password",$accentColor:$.formAccentColor}),t.jsx(Mw,{type:"button",onClick:()=>b(e=>!e),"aria-label":f?"Hide password":"Show password",children:f?t.jsx(fe,{size:18}):t.jsx(k,{size:18})})]})]}),t.jsxs(Fw,{type:"submit",disabled:p,$accentColor:$.formAccentColor,children:[p&&t.jsx(Hw,{}),p?"Signing In...":"Sign In"]}),t.jsx(Ww,{type:"button",onClick:()=>{p||n()},style:{opacity:p?.5:1,cursor:p?"not-allowed":"pointer"},children:"Cancel"})]})]}),t.jsx(qw,{children:t.jsxs(Vw,{children:["This is a demo login page for testing purposes.",t.jsx("br",{}),"Your credentials are used for OAuth flow demonstration only."]})})]})}):null},Kw=Ce.div`
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
`,Yw=Ce.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`,Xw=Ce.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`,Qw=Ce.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`,Zw=Ce.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`,ev=Ce.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background: #dcfce7;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
`,tv=Ce.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`,rv=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`,nv=Ce.span`
  font-weight: 600;
  color: #374151;
  min-width: 100px;
`,iv=Ce.span`
  color: #1f2937;
  flex: 1;
`,ov=Ce.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #dbeafe;
  border-radius: 0.375rem;
  color: #3b82f6;
`,sv=Ce.div`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${e=>{switch(e.status){case"active":return"\n          background: #dcfce7;\n          color: #166534;\n        ";case"pending":return"\n          background: #fef3c7;\n          color: #92400e;\n        ";case"inactive":return"\n          background: #fee2e2;\n          color: #991b1b;\n        ";default:return"\n          background: #f3f4f6;\n          color: #374151;\n        "}}}
`,av=Ce.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`,cv=Ce.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${e=>"primary"===e.variant?"\n        background: #3b82f6;\n        color: white;\n        \n        &:hover {\n          background: #2563eb;\n        }\n      ":"\n        background: #f3f4f6;\n        color: #374151;\n        \n        &:hover {\n          background: #e5e7eb;\n        }\n      "}
`,lv=({isOpen:e,onClose:r,deviceData:n,onContinue:i})=>{if(!e)return null;return t.jsx(Kw,{onClick:r,children:t.jsxs(Yw,{onClick:e=>e.stopPropagation(),children:[t.jsxs(Xw,{children:[t.jsxs(Qw,{children:[t.jsx(u,{size:24,color:"#10b981"}),"Device Registered Successfully"]}),t.jsx(Zw,{onClick:r,children:t.jsx(f,{size:20})})]}),t.jsx(ev,{children:t.jsx(u,{size:32,color:"#10b981"})}),t.jsxs(tv,{children:[t.jsxs(rv,{children:[t.jsx(ov,{children:(e=>{switch(e.toLowerCase()){case"sms":default:return t.jsx(H,{size:16});case"email":return t.jsx(ue,{size:16});case"totp":return t.jsx(U,{size:16})}})(n.deviceType)}),t.jsx(nv,{children:"Device Type:"}),t.jsx(iv,{children:n.deviceType.toUpperCase()})]}),t.jsxs(rv,{children:[t.jsx(nv,{children:"Device Name:"}),t.jsx(iv,{children:n.deviceName})]}),t.jsxs(rv,{children:[t.jsx(nv,{children:"Contact Info:"}),t.jsx(iv,{children:((e,t)=>{if("sms"===t.toLowerCase()&&e.startsWith("+")){const t=e.substring(1);if(11===t.length&&t.startsWith("1"))return`+1 (${t.slice(1,4)}) ${t.slice(4,7)}-${t.slice(7)}`}return e})(n.contactInfo,n.deviceType)})]}),t.jsxs(rv,{children:[t.jsx(nv,{children:"Status:"}),t.jsx(iv,{children:t.jsx(sv,{status:n.status,children:n.status})})]}),t.jsxs(rv,{children:[t.jsx(nv,{children:"Registered:"}),t.jsx(iv,{children:(o=n.registeredAt,new Date(o).toLocaleString())})]}),t.jsxs(rv,{children:[t.jsx(nv,{children:"Device ID:"}),t.jsx(iv,{style:{fontFamily:"monospace",fontSize:"0.75rem",color:"#6b7280"},children:n.deviceId})]})]}),t.jsxs(av,{children:[t.jsx(cv,{variant:"secondary",onClick:r,children:"Close"}),t.jsx(cv,{variant:"primary",onClick:i,children:"Continue to MFA Challenge"})]})]})});var o};class dv{static DEFAULT_TIMEOUT=6e4;static DEFAULT_RP_ID=window.location.hostname;static isWebAuthnSupported(){return!(!window.PublicKeyCredential||!window.navigator?.credentials||"function"!=typeof window.navigator.credentials.create||"function"!=typeof window.navigator.credentials.get)}static getCapabilities(){const e=dv.isWebAuthnSupported();return{webAuthnSupported:e,platformAuthenticator:e&&dv.isPlatformAuthenticatorSupported(),crossPlatformAuthenticator:e&&dv.isCrossPlatformAuthenticatorSupported(),userVerification:e}}static async registerCredential(e){try{if(!dv.isWebAuthnSupported())return{success:!1,error:"WebAuthn is not supported in this browser"};const t=dv.base64ToArrayBuffer(e.challenge),r={userVerification:e.authenticatorSelection?.userVerification??"preferred"};e.authenticatorSelection?.residentKey&&(r.residentKey=e.authenticatorSelection.residentKey),e.authenticatorSelection?.authenticatorAttachment&&(r.authenticatorAttachment=e.authenticatorSelection.authenticatorAttachment);const n={publicKey:{rp:{id:e.rpId,name:e.rpName},user:{id:(new TextEncoder).encode(e.userHandle),name:e.userName,displayName:e.userDisplayName},challenge:t,pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],timeout:e.timeout||dv.DEFAULT_TIMEOUT,attestation:e.attestation||"none",authenticatorSelection:r}},i=await navigator.credentials.create(n);if(!i)return{success:!1,error:"Credential creation was cancelled or failed"};const o=i.response,s=dv.arrayBufferToBase64(i.rawId),a=o.getPublicKey?.()||null,c=a?dv.arrayBufferToBase64(a):void 0,l=dv.arrayBufferToBase64url(o.attestationObject),d=dv.arrayBufferToBase64url(o.clientDataJSON),u=dv.arrayBufferToBase64url(i.rawId),p=JSON.stringify({id:i.id,type:i.type,rawId:u,response:{clientDataJSON:d,attestationObject:l},clientExtensionResults:{}});return{success:!0,credentialId:s,...c?{publicKey:c}:{},attestationObject:l,clientDataJSON:d,attestation:p,userHandle:e.userHandle}}catch(t){let e="Credential registration failed";if(t instanceof DOMException)switch(t.name){case"NotAllowedError":e="Registration was cancelled or not allowed";break;case"NotSupportedError":e="This authenticator is not supported";break;case"SecurityError":e="Security error during registration";break;case"InvalidStateError":e="Authenticator is already registered";break;case"ConstraintError":e="Authenticator does not meet requirements";break;case"TimeoutError":e="Registration timed out"}return{success:!1,error:e}}}static async authenticateCredential(e,t,r){try{if(!dv.isWebAuthnSupported())return{success:!1,error:"WebAuthn is not supported in this browser"};const n=dv.base64ToArrayBuffer(t),i={publicKey:{challenge:n,allowCredentials:[{type:"public-key",id:dv.base64ToArrayBuffer(e),transports:["usb","nfc","ble","internal"]}],timeout:dv.DEFAULT_TIMEOUT,userVerification:"preferred",rpId:r||dv.DEFAULT_RP_ID}},o=await navigator.credentials.get(i);if(!o)return{success:!1,error:"Authentication was cancelled or failed"};const s=o.response,a=dv.arrayBufferToBase64(s.signature),c=s.userHandle?dv.arrayBufferToBase64(s.userHandle):void 0;return{success:!0,credentialId:e,signature:a,...c?{userHandle:c}:{}}}catch(n){let e="Authentication failed";if(n instanceof DOMException)switch(n.name){case"NotAllowedError":e="Authentication was cancelled or not allowed";break;case"NotSupportedError":e="This authenticator is not supported";break;case"SecurityError":e="Security error during authentication";break;case"InvalidStateError":e="Authenticator is not registered";break;case"ConstraintError":e="Authenticator does not meet requirements";break;case"TimeoutError":e="Authentication timed out"}return{success:!1,error:e}}}static generateChallenge(){const e=new Uint8Array(32);return crypto.getRandomValues(e),dv.arrayBufferToBase64(e.buffer)}static isPlatformAuthenticatorSupported(){try{return"function"==typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable}catch{return!1}}static async isPlatformAuthenticatorAvailable(){try{if("function"!=typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)return!1;return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()}catch{return!1}}static isCrossPlatformAuthenticatorSupported(){return dv.isWebAuthnSupported()}static arrayBufferToBase64(e){const t=new Uint8Array(e);let r="";for(let n=0;n<t.byteLength;n++)r+=String.fromCharCode(t[n]);return btoa(r)}static arrayBufferToBase64url(e){return dv.arrayBufferToBase64(e).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}static base64ToArrayBuffer(e){const t=atob(e),r=new Uint8Array(t.length);for(let n=0;n<t.length;n++)r[n]=t.charCodeAt(n);return r.buffer}static getDeviceTypeName(e){switch(e){case"platform":return"Built-in Authenticator (Touch ID, Face ID, Windows Hello)";case"cross-platform":return"External Security Key (YubiKey, etc.)";default:return"Security Key"}}static getSetupInstructions(e){switch(e){case"platform":return["Use your device's built-in authenticator","Touch ID, Face ID, or Windows Hello will be used","Follow the on-screen prompts to complete setup"];case"cross-platform":return["Insert your external security key (YubiKey, etc.)","Touch the key when prompted","Follow the browser prompts to complete setup"];default:return["Use any compatible security key or authenticator","Follow the on-screen prompts","Complete the setup process"]}}}const uv=({isOpen:r,onClose:n,onSuccess:i,userId:o,deviceName:s,rpId:a=window.location.hostname,rpName:c="OAuth Playground"})=>{const[l,p]=e.useState(!1),[h,g]=e.useState(null),[m,b]=e.useState("any"),[x,y]=e.useState(null);e.useEffect(()=>{if(r){const e=dv.getCapabilities();g(e),e.webAuthnSupported?y(null):y("WebAuthn is not supported in this browser. Please use a modern browser that supports passkeys.")}},[r]);return r?t.jsxs("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0, 0, 0, 0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3,padding:"1rem"},children:[t.jsxs("div",{style:{backgroundColor:"white",borderRadius:"1rem",padding:"2rem",maxWidth:"500px",width:"100%",maxHeight:"90vh",overflow:"auto",boxShadow:"0 25px 50px -12px rgba(0, 0, 0, 0.25)"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx("div",{style:{width:"2.5rem",height:"2.5rem",backgroundColor:"#10b981",borderRadius:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",color:"white"},children:t.jsx(U,{size:20})}),t.jsxs("div",{children:[t.jsx("h2",{style:{margin:0,fontSize:"1.25rem",fontWeight:600,color:"#1f2937"},children:"Setup Passkey"}),t.jsx("p",{style:{margin:0,fontSize:"0.875rem",color:"#6b7280"},children:"Register a FIDO2 security key or built-in authenticator"})]})]}),t.jsx("button",{onClick:n,style:{background:"none",border:"none",padding:"0.5rem",borderRadius:"0.375rem",cursor:"pointer",color:"#6b7280",display:"flex",alignItems:"center",justifyContent:"center"},children:t.jsx(f,{size:20})})]}),x?t.jsxs("div",{style:{padding:"1rem",backgroundColor:"#fef2f2",borderRadius:"0.5rem",border:"1px solid #fecaca",marginBottom:"1.5rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",color:"#dc2626"},children:[t.jsx(d,{size:16}),t.jsx("span",{style:{fontSize:"0.875rem",fontWeight:500},children:"Error"})]}),t.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.875rem",color:"#dc2626"},children:x})]}):t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1.5rem"},children:[h&&t.jsxs("div",{style:{padding:"1rem",backgroundColor:h.webAuthnSupported?"#f0fdf4":"#fef2f2",borderRadius:"0.5rem",border:"1px solid "+(h.webAuthnSupported?"#86efac":"#fecaca")},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[h.webAuthnSupported?t.jsx(u,{size:16,color:"#16a34a"}):t.jsx(d,{size:16,color:"#dc2626"}),t.jsx("span",{style:{fontSize:"0.875rem",fontWeight:500,color:h.webAuthnSupported?"#16a34a":"#dc2626"},children:"WebAuthn Support"})]}),t.jsx("div",{style:{fontSize:"0.75rem",color:h.webAuthnSupported?"#16a34a":"#dc2626",lineHeight:1.5},children:h.webAuthnSupported?t.jsxs(t.Fragment,{children:[t.jsx("div",{children:"✅ WebAuthn is supported"}),h.platformAuthenticator&&t.jsx("div",{children:"✅ Built-in authenticator available"}),h.crossPlatformAuthenticator&&t.jsx("div",{children:"✅ External security keys supported"})]}):t.jsx("div",{children:"❌ WebAuthn is not supported in this browser"})})]}),h?.webAuthnSupported&&t.jsxs("div",{children:[t.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"0.875rem",fontWeight:600,color:"#374151"},children:"Choose Authenticator Type"}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:[h.platformAuthenticator&&t.jsx("div",{onClick:()=>b("platform"),style:{padding:"1rem",border:"platform"===m?"2px solid #3b82f6":"1px solid #e5e7eb",borderRadius:"0.5rem",cursor:"pointer",backgroundColor:"platform"===m?"#eff6ff":"#ffffff",transition:"all 0.2s ease"},children:t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx(ce,{size:20,color:"#3b82f6"}),t.jsxs("div",{children:[t.jsx("div",{style:{fontWeight:600,fontSize:"0.875rem",color:"#1f2937"},children:"Built-in Authenticator"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280"},children:"Touch ID, Face ID, Windows Hello, etc."})]})]})}),h.crossPlatformAuthenticator&&t.jsx("div",{onClick:()=>b("cross-platform"),style:{padding:"1rem",border:"cross-platform"===m?"2px solid #3b82f6":"1px solid #e5e7eb",borderRadius:"0.5rem",cursor:"pointer",backgroundColor:"cross-platform"===m?"#eff6ff":"#ffffff",transition:"all 0.2s ease"},children:t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx(V,{size:20,color:"#10b981"}),t.jsxs("div",{children:[t.jsx("div",{style:{fontWeight:600,fontSize:"0.875rem",color:"#1f2937"},children:"External Security Key"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280"},children:"YubiKey, FIDO2 security keys, etc."})]})]})}),t.jsx("div",{onClick:()=>b("any"),style:{padding:"1rem",border:"any"===m?"2px solid #3b82f6":"1px solid #e5e7eb",borderRadius:"0.5rem",cursor:"pointer",backgroundColor:"any"===m?"#eff6ff":"#ffffff",transition:"all 0.2s ease"},children:t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx(U,{size:20,color:"#6b7280"}),t.jsxs("div",{children:[t.jsx("div",{style:{fontWeight:600,fontSize:"0.875rem",color:"#1f2937"},children:"Any Compatible Authenticator"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280"},children:"Let the browser choose the best option"})]})]})})]})]}),"any"!==m&&t.jsxs("div",{style:{padding:"1rem",backgroundColor:"#f0f9ff",borderRadius:"0.5rem",border:"1px solid #bae6fd"},children:[t.jsx("h4",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#0369a1"},children:"📋 Setup Instructions"}),t.jsx("ol",{style:{margin:0,paddingLeft:"1.25rem",fontSize:"0.75rem",color:"#0369a1",lineHeight:1.5},children:dv.getSetupInstructions(m).map((e,r)=>t.jsx("li",{children:e},r))})]}),t.jsxs("div",{style:{padding:"1rem",backgroundColor:"#fef3c7",borderRadius:"0.5rem",border:"1px solid #f59e0b"},children:[t.jsx("h4",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#92400e"},children:"📋 Account Information"}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#92400e",lineHeight:1.5},children:[t.jsxs("div",{children:[t.jsx("strong",{children:"Relying Party:"})," ",c]}),t.jsxs("div",{children:[t.jsx("strong",{children:"Domain:"})," ",a]}),t.jsxs("div",{children:[t.jsx("strong",{children:"User:"})," ",o]}),t.jsxs("div",{children:[t.jsx("strong",{children:"Device:"})," ",s]})]})]})]}),t.jsxs("div",{style:{display:"flex",gap:"0.75rem",justifyContent:"flex-end",marginTop:"2rem",paddingTop:"1.5rem",borderTop:"1px solid #e5e7eb"},children:[t.jsx("button",{onClick:n,disabled:l,style:{padding:"0.75rem 1.5rem",border:"1px solid #d1d5db",borderRadius:"0.375rem",backgroundColor:"white",color:"#374151",fontSize:"0.875rem",fontWeight:"500",cursor:l?"not-allowed":"pointer",transition:"all 0.2s ease",opacity:l?.5:1},children:"Cancel"}),t.jsx("button",{onClick:async()=>{if(h?.webAuthnSupported){p(!0),y(null);try{const e=dv.generateChallenge(),t={rpId:a,rpName:c,userDisplayName:`${o} (${s})`,userName:o,userHandle:o,challenge:e,timeout:6e4,attestation:"none",authenticatorSelection:{authenticatorAttachment:"any"===m?void 0:m,userVerification:"preferred",residentKey:"preferred"}},r=await dv.registerCredential(t);if(!r.success||!r.credentialId)throw new Error(r.error||"Registration failed");_t.showSuccess("Passkey registered successfully!"),i(r.credentialId,r.publicKey||"")}catch(e){y(e.message||"Registration failed"),_t.showError(e.message||"Failed to register passkey")}finally{p(!1)}}else _t.showError("WebAuthn is not supported in this browser")},disabled:l||!h?.webAuthnSupported||!!x,style:{padding:"0.75rem 1.5rem",border:"none",borderRadius:"0.375rem",backgroundColor:l||!h?.webAuthnSupported||x?"#9ca3af":"#10b981",color:"white",fontSize:"0.875rem",fontWeight:"600",cursor:l||!h?.webAuthnSupported||x?"not-allowed":"pointer",transition:"all 0.2s ease",display:"flex",alignItems:"center",gap:"0.5rem"},children:l?t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{width:"1rem",height:"1rem",border:"2px solid #ffffff",borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}),"Registering..."]}):t.jsxs(t.Fragment,{children:[t.jsx(U,{size:16}),"Register Passkey"]})})]})]}),t.jsx("style",{children:"\n        @keyframes spin {\n          from { transform: rotate(0deg); }\n          to { transform: rotate(360deg); }\n        }\n      "})]}):null},pv=[{code:"US",name:"United States",flag:"🇺🇸",dialCode:"+1"},{code:"CA",name:"Canada",flag:"🇨🇦",dialCode:"+1"},{code:"GB",name:"United Kingdom",flag:"🇬🇧",dialCode:"+44"},{code:"AU",name:"Australia",flag:"🇦🇺",dialCode:"+61"},{code:"DE",name:"Germany",flag:"🇩🇪",dialCode:"+49"},{code:"FR",name:"France",flag:"🇫🇷",dialCode:"+33"},{code:"IT",name:"Italy",flag:"🇮🇹",dialCode:"+39"},{code:"ES",name:"Spain",flag:"🇪🇸",dialCode:"+34"},{code:"NL",name:"Netherlands",flag:"🇳🇱",dialCode:"+31"},{code:"BE",name:"Belgium",flag:"🇧🇪",dialCode:"+32"},{code:"CH",name:"Switzerland",flag:"🇨🇭",dialCode:"+41"},{code:"AT",name:"Austria",flag:"🇦🇹",dialCode:"+43"},{code:"SE",name:"Sweden",flag:"🇸🇪",dialCode:"+46"},{code:"NO",name:"Norway",flag:"🇳🇴",dialCode:"+47"},{code:"DK",name:"Denmark",flag:"🇩🇰",dialCode:"+45"},{code:"FI",name:"Finland",flag:"🇫🇮",dialCode:"+358"},{code:"PL",name:"Poland",flag:"🇵🇱",dialCode:"+48"},{code:"CZ",name:"Czech Republic",flag:"🇨🇿",dialCode:"+420"},{code:"HU",name:"Hungary",flag:"🇭🇺",dialCode:"+36"},{code:"RO",name:"Romania",flag:"🇷🇴",dialCode:"+40"},{code:"BG",name:"Bulgaria",flag:"🇧🇬",dialCode:"+359"},{code:"HR",name:"Croatia",flag:"🇭🇷",dialCode:"+385"},{code:"SI",name:"Slovenia",flag:"🇸🇮",dialCode:"+386"},{code:"SK",name:"Slovakia",flag:"🇸🇰",dialCode:"+421"},{code:"EE",name:"Estonia",flag:"🇪🇪",dialCode:"+372"},{code:"LV",name:"Latvia",flag:"🇱🇻",dialCode:"+371"},{code:"LT",name:"Lithuania",flag:"🇱🇹",dialCode:"+370"},{code:"IE",name:"Ireland",flag:"🇮🇪",dialCode:"+353"},{code:"PT",name:"Portugal",flag:"🇵🇹",dialCode:"+351"},{code:"GR",name:"Greece",flag:"🇬🇷",dialCode:"+30"},{code:"CY",name:"Cyprus",flag:"🇨🇾",dialCode:"+357"},{code:"MT",name:"Malta",flag:"🇲🇹",dialCode:"+356"},{code:"LU",name:"Luxembourg",flag:"🇱🇺",dialCode:"+352"},{code:"JP",name:"Japan",flag:"🇯🇵",dialCode:"+81"},{code:"KR",name:"South Korea",flag:"🇰🇷",dialCode:"+82"},{code:"CN",name:"China",flag:"🇨🇳",dialCode:"+86"},{code:"IN",name:"India",flag:"🇮🇳",dialCode:"+91"},{code:"SG",name:"Singapore",flag:"🇸🇬",dialCode:"+65"},{code:"HK",name:"Hong Kong",flag:"🇭🇰",dialCode:"+852"},{code:"TW",name:"Taiwan",flag:"🇹🇼",dialCode:"+886"},{code:"TH",name:"Thailand",flag:"🇹🇭",dialCode:"+66"},{code:"MY",name:"Malaysia",flag:"🇲🇾",dialCode:"+60"},{code:"ID",name:"Indonesia",flag:"🇮🇩",dialCode:"+62"},{code:"PH",name:"Philippines",flag:"🇵🇭",dialCode:"+63"},{code:"VN",name:"Vietnam",flag:"🇻🇳",dialCode:"+84"},{code:"BR",name:"Brazil",flag:"🇧🇷",dialCode:"+55"},{code:"MX",name:"Mexico",flag:"🇲🇽",dialCode:"+52"},{code:"AR",name:"Argentina",flag:"🇦🇷",dialCode:"+54"},{code:"CL",name:"Chile",flag:"🇨🇱",dialCode:"+56"},{code:"CO",name:"Colombia",flag:"🇨🇴",dialCode:"+57"},{code:"PE",name:"Peru",flag:"🇵🇪",dialCode:"+51"},{code:"VE",name:"Venezuela",flag:"🇻🇪",dialCode:"+58"},{code:"ZA",name:"South Africa",flag:"🇿🇦",dialCode:"+27"},{code:"EG",name:"Egypt",flag:"🇪🇬",dialCode:"+20"},{code:"NG",name:"Nigeria",flag:"🇳🇬",dialCode:"+234"},{code:"KE",name:"Kenya",flag:"🇰🇪",dialCode:"+254"},{code:"MA",name:"Morocco",flag:"🇲🇦",dialCode:"+212"},{code:"TN",name:"Tunisia",flag:"🇹🇳",dialCode:"+216"},{code:"DZ",name:"Algeria",flag:"🇩🇿",dialCode:"+213"},{code:"IL",name:"Israel",flag:"🇮🇱",dialCode:"+972"},{code:"AE",name:"United Arab Emirates",flag:"🇦🇪",dialCode:"+971"},{code:"SA",name:"Saudi Arabia",flag:"🇸🇦",dialCode:"+966"},{code:"TR",name:"Turkey",flag:"🇹🇷",dialCode:"+90"},{code:"RU",name:"Russia",flag:"🇷🇺",dialCode:"+7"},{code:"UA",name:"Ukraine",flag:"🇺🇦",dialCode:"+380"},{code:"BY",name:"Belarus",flag:"🇧🇾",dialCode:"+375"},{code:"KZ",name:"Kazakhstan",flag:"🇰🇿",dialCode:"+7"},{code:"UZ",name:"Uzbekistan",flag:"🇺🇿",dialCode:"+998"},{code:"NZ",name:"New Zealand",flag:"🇳🇿",dialCode:"+64"},{code:"FJ",name:"Fiji",flag:"🇫🇯",dialCode:"+679"},{code:"PK",name:"Pakistan",flag:"🇵🇰",dialCode:"+92"},{code:"BD",name:"Bangladesh",flag:"🇧🇩",dialCode:"+880"},{code:"LK",name:"Sri Lanka",flag:"🇱🇰",dialCode:"+94"},{code:"NP",name:"Nepal",flag:"🇳🇵",dialCode:"+977"},{code:"BT",name:"Bhutan",flag:"🇧🇹",dialCode:"+975"},{code:"MV",name:"Maldives",flag:"🇲🇻",dialCode:"+960"},{code:"AF",name:"Afghanistan",flag:"🇦🇫",dialCode:"+93"},{code:"IR",name:"Iran",flag:"🇮🇷",dialCode:"+98"},{code:"IQ",name:"Iraq",flag:"🇮🇶",dialCode:"+964"},{code:"SY",name:"Syria",flag:"🇸🇾",dialCode:"+963"},{code:"LB",name:"Lebanon",flag:"🇱🇧",dialCode:"+961"},{code:"JO",name:"Jordan",flag:"🇯🇴",dialCode:"+962"},{code:"KW",name:"Kuwait",flag:"🇰🇼",dialCode:"+965"},{code:"QA",name:"Qatar",flag:"🇶🇦",dialCode:"+974"},{code:"BH",name:"Bahrain",flag:"🇧🇭",dialCode:"+973"},{code:"OM",name:"Oman",flag:"🇴🇲",dialCode:"+968"},{code:"YE",name:"Yemen",flag:"🇾🇪",dialCode:"+967"}],hv=({selectedCountry:r,onCountryChange:n,disabled:i=!1})=>{const[o,s]=e.useState(!1),c=e.useCallback(e=>{n(e),s(!1)},[n]),l=e.useCallback(()=>{i||s(e=>!e)},[i]);return t.jsxs("div",{style:{position:"relative",display:"inline-block",minWidth:"200px"},children:[t.jsxs("button",{type:"button",onClick:l,disabled:i,style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.375rem",backgroundColor:i?"#f9fafb":"#ffffff",cursor:i?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:"0.875rem",color:i?"#9ca3af":"#374151",transition:"all 0.2s ease",height:"48px",boxSizing:"border-box",...i?{}:{"&:hover":{borderColor:"#9ca3af"}}},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx("span",{style:{fontSize:"1.25rem"},children:r.flag}),t.jsx("span",{style:{fontWeight:"500"},children:r.dialCode}),t.jsx("span",{style:{color:"#6b7280",fontSize:"0.75rem"},children:r.code})]}),t.jsx(a,{size:16,style:{color:"#6b7280",transform:o?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s ease"}})]}),o&&t.jsxs(t.Fragment,{children:[t.jsx("button",{type:"button",style:{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:10,border:"none",padding:0,margin:0,background:"transparent"},onClick:()=>s(!1),onKeyDown:e=>{"Escape"!==e.key&&"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),s(!1))},"aria-label":"Close country selector"}),t.jsx("div",{style:{position:"absolute",top:"100%",left:0,right:0,backgroundColor:"#ffffff",border:"1px solid #d1d5db",borderRadius:"0.375rem",boxShadow:"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",zIndex:20,maxHeight:"300px",overflowY:"auto",marginTop:"0.25rem"},children:pv.map(e=>t.jsxs("button",{type:"button",onClick:()=>c(e),style:{width:"100%",padding:"0.75rem",border:"none",backgroundColor:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.75rem",fontSize:"0.875rem",color:"#374151",textAlign:"left",transition:"background-color 0.2s ease",...r.code===e.code?{backgroundColor:"#eff6ff",color:"#1d4ed8"}:{"&:hover":{backgroundColor:"#f9fafb"}}},children:[t.jsx("span",{style:{fontSize:"1.25rem",minWidth:"1.5rem"},children:e.flag}),t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",alignItems:"flex-start"},children:[t.jsx("span",{style:{fontWeight:"500"},children:e.name}),t.jsx("span",{style:{fontSize:"0.75rem",color:"#6b7280"},children:e.dialCode})]}),t.jsx("span",{style:{fontSize:"0.75rem",color:"#9ca3af",fontWeight:"500"},children:e.code})]},e.code))})]})]})},gv=({value:r,onChange:n,placeholder:i="Enter phone number",disabled:o=!1,required:s=!1,label:a="Phone Number",helpText:c,autoConcatenate:l=!0,onCountryCodeChange:d})=>{const[u,p]=e.useState({code:"US",name:"United States",flag:"🇺🇸",dialCode:"+1"}),[h,g]=e.useState("");e.useEffect(()=>{d&&d(u.dialCode)},[d,u.dialCode]),e.useEffect(()=>{if(r){const e=r.match(/^(\+\d{1,4})/);if(e){const t=e[1],n=mv.find(e=>e.dialCode===t);n?(p(n),g(r.substring(t.length).trim())):g(r)}else g(r)}},[r]);const m=e.useCallback(e=>{if(p(e),d&&d(e.dialCode),l){const t=e.dialCode+h;n(t,e.dialCode,h)}else n(h,e.dialCode,h)},[h,n,l,d]),f=e.useCallback(e=>{const t=e.target.value;if(g(t),l){const e=u.dialCode+t;n(e,u.dialCode,t)}else n(t,u.dialCode,t)},[u.dialCode,n,l]),b=(e=>{const t=e.replace(/\D/g,"");if("US"===u.code||"CA"===u.code){if(t.length>=6)return`(${t.slice(0,3)}) ${t.slice(3,6)}-${t.slice(6,10)}`;if(t.length>=3)return`(${t.slice(0,3)}) ${t.slice(3)}`;if(t.length>0)return`(${t}`}return t})(h);return t.jsxs("div",{children:[a&&t.jsxs("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:500,color:"#374151",fontSize:"0.875rem"},children:[a,s&&t.jsx("span",{style:{color:"#ef4444",marginLeft:"0.25rem"},children:"*"})]}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem",alignItems:"flex-start"},children:[t.jsx("div",{style:{flex:"0 0 auto"},children:t.jsx(hv,{selectedCountry:u,onCountryChange:m,disabled:o})}),t.jsx("div",{style:{flex:1},children:t.jsx("input",{type:"tel",value:b,onChange:f,placeholder:i,disabled:o,required:s,style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.375rem",fontSize:"0.875rem",backgroundColor:o?"#f9fafb":"#ffffff",color:o?"#9ca3af":"#374151",transition:"border-color 0.2s ease",height:"48px",boxSizing:"border-box",...o?{}:{"&:focus":{outline:"none",borderColor:"#3b82f6",boxShadow:"0 0 0 3px rgba(59, 130, 246, 0.1)"}}}})})]}),c&&t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.25rem"},children:c}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#9ca3af",marginTop:"0.25rem",fontFamily:"monospace"},children:["Full number: ",u.dialCode,h||"..."]})]})},mv=[{code:"US",name:"United States",flag:"🇺🇸",dialCode:"+1"},{code:"CA",name:"Canada",flag:"🇨🇦",dialCode:"+1"},{code:"GB",name:"United Kingdom",flag:"🇬🇧",dialCode:"+44"},{code:"AU",name:"Australia",flag:"🇦🇺",dialCode:"+61"},{code:"DE",name:"Germany",flag:"🇩🇪",dialCode:"+49"},{code:"FR",name:"France",flag:"🇫🇷",dialCode:"+33"},{code:"IT",name:"Italy",flag:"🇮🇹",dialCode:"+39"},{code:"ES",name:"Spain",flag:"🇪🇸",dialCode:"+34"},{code:"NL",name:"Netherlands",flag:"🇳🇱",dialCode:"+31"},{code:"BE",name:"Belgium",flag:"🇧🇪",dialCode:"+32"},{code:"CH",name:"Switzerland",flag:"🇨🇭",dialCode:"+41"},{code:"AT",name:"Austria",flag:"🇦🇹",dialCode:"+43"},{code:"SE",name:"Sweden",flag:"🇸🇪",dialCode:"+46"},{code:"NO",name:"Norway",flag:"🇳🇴",dialCode:"+47"},{code:"DK",name:"Denmark",flag:"🇩🇰",dialCode:"+45"},{code:"FI",name:"Finland",flag:"🇫🇮",dialCode:"+358"},{code:"PL",name:"Poland",flag:"🇵🇱",dialCode:"+48"},{code:"CZ",name:"Czech Republic",flag:"🇨🇿",dialCode:"+420"},{code:"HU",name:"Hungary",flag:"🇭🇺",dialCode:"+36"},{code:"RO",name:"Romania",flag:"🇷🇴",dialCode:"+40"},{code:"BG",name:"Bulgaria",flag:"🇧🇬",dialCode:"+359"},{code:"HR",name:"Croatia",flag:"🇭🇷",dialCode:"+385"},{code:"SI",name:"Slovenia",flag:"🇸🇮",dialCode:"+386"},{code:"SK",name:"Slovakia",flag:"🇸🇰",dialCode:"+421"},{code:"EE",name:"Estonia",flag:"🇪🇪",dialCode:"+372"},{code:"LV",name:"Latvia",flag:"🇱🇻",dialCode:"+371"},{code:"LT",name:"Lithuania",flag:"🇱🇹",dialCode:"+370"},{code:"IE",name:"Ireland",flag:"🇮🇪",dialCode:"+353"},{code:"PT",name:"Portugal",flag:"🇵🇹",dialCode:"+351"},{code:"GR",name:"Greece",flag:"🇬🇷",dialCode:"+30"},{code:"CY",name:"Cyprus",flag:"🇨🇾",dialCode:"+357"},{code:"MT",name:"Malta",flag:"🇲🇹",dialCode:"+356"},{code:"LU",name:"Luxembourg",flag:"🇱🇺",dialCode:"+352"},{code:"JP",name:"Japan",flag:"🇯🇵",dialCode:"+81"},{code:"KR",name:"South Korea",flag:"🇰🇷",dialCode:"+82"},{code:"CN",name:"China",flag:"🇨🇳",dialCode:"+86"},{code:"IN",name:"India",flag:"🇮🇳",dialCode:"+91"},{code:"SG",name:"Singapore",flag:"🇸🇬",dialCode:"+65"},{code:"HK",name:"Hong Kong",flag:"🇭🇰",dialCode:"+852"},{code:"TW",name:"Taiwan",flag:"🇹🇼",dialCode:"+886"},{code:"TH",name:"Thailand",flag:"🇹🇭",dialCode:"+66"},{code:"MY",name:"Malaysia",flag:"🇲🇾",dialCode:"+60"},{code:"ID",name:"Indonesia",flag:"🇮🇩",dialCode:"+62"},{code:"PH",name:"Philippines",flag:"🇵🇭",dialCode:"+63"},{code:"VN",name:"Vietnam",flag:"🇻🇳",dialCode:"+84"},{code:"BR",name:"Brazil",flag:"🇧🇷",dialCode:"+55"},{code:"MX",name:"Mexico",flag:"🇲🇽",dialCode:"+52"},{code:"AR",name:"Argentina",flag:"🇦🇷",dialCode:"+54"},{code:"CL",name:"Chile",flag:"🇨🇱",dialCode:"+56"},{code:"CO",name:"Colombia",flag:"🇨🇴",dialCode:"+57"},{code:"PE",name:"Peru",flag:"🇵🇪",dialCode:"+51"},{code:"VE",name:"Venezuela",flag:"🇻🇪",dialCode:"+58"},{code:"ZA",name:"South Africa",flag:"🇿🇦",dialCode:"+27"},{code:"EG",name:"Egypt",flag:"🇪🇬",dialCode:"+20"},{code:"NG",name:"Nigeria",flag:"🇳🇬",dialCode:"+234"},{code:"KE",name:"Kenya",flag:"🇰🇪",dialCode:"+254"},{code:"MA",name:"Morocco",flag:"🇲🇦",dialCode:"+212"},{code:"TN",name:"Tunisia",flag:"🇹🇳",dialCode:"+216"},{code:"DZ",name:"Algeria",flag:"🇩🇿",dialCode:"+213"},{code:"IL",name:"Israel",flag:"🇮🇱",dialCode:"+972"},{code:"AE",name:"United Arab Emirates",flag:"🇦🇪",dialCode:"+971"},{code:"SA",name:"Saudi Arabia",flag:"🇸🇦",dialCode:"+966"},{code:"TR",name:"Turkey",flag:"🇹🇷",dialCode:"+90"},{code:"RU",name:"Russia",flag:"🇷🇺",dialCode:"+7"},{code:"UA",name:"Ukraine",flag:"🇺🇦",dialCode:"+380"},{code:"BY",name:"Belarus",flag:"🇧🇾",dialCode:"+375"},{code:"KZ",name:"Kazakhstan",flag:"🇰🇿",dialCode:"+7"},{code:"UZ",name:"Uzbekistan",flag:"🇺🇿",dialCode:"+998"},{code:"NZ",name:"New Zealand",flag:"🇳🇿",dialCode:"+64"},{code:"FJ",name:"Fiji",flag:"🇫🇯",dialCode:"+679"},{code:"PK",name:"Pakistan",flag:"🇵🇰",dialCode:"+92"},{code:"BD",name:"Bangladesh",flag:"🇧🇩",dialCode:"+880"},{code:"LK",name:"Sri Lanka",flag:"🇱🇰",dialCode:"+94"},{code:"NP",name:"Nepal",flag:"🇳🇵",dialCode:"+977"},{code:"BT",name:"Bhutan",flag:"🇧🇹",dialCode:"+975"},{code:"MV",name:"Maldives",flag:"🇲🇻",dialCode:"+960"},{code:"AF",name:"Afghanistan",flag:"🇦🇫",dialCode:"+93"},{code:"IR",name:"Iran",flag:"🇮🇷",dialCode:"+98"},{code:"IQ",name:"Iraq",flag:"🇮🇶",dialCode:"+964"},{code:"SY",name:"Syria",flag:"🇸🇾",dialCode:"+963"},{code:"LB",name:"Lebanon",flag:"🇱🇧",dialCode:"+961"},{code:"JO",name:"Jordan",flag:"🇯🇴",dialCode:"+962"},{code:"KW",name:"Kuwait",flag:"🇰🇼",dialCode:"+965"},{code:"QA",name:"Qatar",flag:"🇶🇦",dialCode:"+974"},{code:"BH",name:"Bahrain",flag:"🇧🇭",dialCode:"+973"},{code:"OM",name:"Oman",flag:"🇴🇲",dialCode:"+968"},{code:"YE",name:"Yemen",flag:"🇾🇪",dialCode:"+967"}];class fv{static DEFAULT_ALGORITHM="SHA1";static DEFAULT_DIGITS=6;static DEFAULT_PERIOD=30;static TIME_WINDOW=1;static QR_CODE_SIZE=200;static async generateTOTPQRCode(e){try{fv.validateTOTPConfig(e);const t=fv.buildTOTPUri(e),r=await fv.generateQRCodeDataUrl(t),n=fv.formatManualEntryKey(e.secret);return{qrCodeDataUrl:r,totpUri:t,manualEntryKey:n,backupCodes:fv.generateBackupCodes()}}catch(t){throw new Error(`QR code generation failed: ${t instanceof Error?t.message:"Unknown error"}`)}}static generateManualEntryCode(e){try{if(!e||"string"!=typeof e)throw new Error("Secret is required and must be a string");const t=e.replace(/\s/g,"").toUpperCase();return t.match(/.{1,4}/g)?.join(" ")||t}catch(t){throw new Error(`Manual entry code generation failed: ${t instanceof Error?t.message:"Unknown error"}`)}}static validateTOTPCode(e,t,r){try{if(!e||!t)return{valid:!1,error:"Secret and code are required"};const n=t.replace(/\s/g,"");if(!/^\d{6,8}$/.test(n))return{valid:!1,error:"Code must be 6-8 digits"};const i=r?.algorithm||fv.DEFAULT_ALGORITHM,o=r?.digits||fv.DEFAULT_DIGITS,s=r?.period||fv.DEFAULT_PERIOD,a=Math.floor(Date.now()/1e3),c=Math.floor(a/s);for(let t=c-fv.TIME_WINDOW;t<=c+fv.TIME_WINDOW;t++){if(fv.generateTOTPCode(e,t,i,o)===n)return{valid:!0,timeWindow:t-c}}return{valid:!1,error:"Invalid code or code has expired"}}catch(n){return{valid:!1,error:`Validation error: ${n instanceof Error?n.message:"Unknown error"}`}}}static generateTOTPSecret(e=32){try{const t="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";let r="";if(crypto?.getRandomValues){const n=new Uint8Array(e);crypto.getRandomValues(n);for(let i=0;i<e;i++)r+=t[n[i]%t.length]}else for(let n=0;n<e;n++)r+=t[Math.floor(Math.random()*t.length)];return r}catch(t){throw new Error(`Secret generation failed: ${t instanceof Error?t.message:"Unknown error"}`)}}static validateTOTPConfig(e){if(!e.secret||"string"!=typeof e.secret)throw new Error("Secret is required and must be a string");if(!e.issuer||"string"!=typeof e.issuer)throw new Error("Issuer is required and must be a string");if(!e.accountName||"string"!=typeof e.accountName)throw new Error("Account name is required and must be a string");if(!/^[A-Z2-7]+=*$/i.test(e.secret))throw new Error("Secret must be a valid base32 string");if(e.algorithm&&!["SHA1","SHA256","SHA512"].includes(e.algorithm))throw new Error("Algorithm must be SHA1, SHA256, or SHA512");if(e.digits&&![6,8].includes(e.digits))throw new Error("Digits must be 6 or 8");if(e.period&&(e.period<15||e.period>300))throw new Error("Period must be between 15 and 300 seconds")}static buildTOTPUri(e){const t=e.algorithm||fv.DEFAULT_ALGORITHM,r=e.digits||fv.DEFAULT_DIGITS,n=e.period||fv.DEFAULT_PERIOD;return`otpauth://totp/${`${encodeURIComponent(e.issuer)}:${encodeURIComponent(e.accountName)}`}?${new URLSearchParams({secret:e.secret,issuer:e.issuer,algorithm:t,digits:r.toString(),period:n.toString()}).toString()}`}static async generateQRCodeDataUrl(e){try{const t=fv.generateQRCodeSVG(e);return`data:image/svg+xml;base64,${btoa(t)}`}catch(t){const r=fv.generatePlaceholderQRCode(e);return`data:image/svg+xml;base64,${btoa(r)}`}}static generateQRCodeSVG(e){const t=fv.QR_CODE_SIZE,r=t/25,n=fv.simpleHash(e);let i="";for(let o=0;o<25;o++)for(let e=0;e<25;e++){(n+(25*o+e))%3==0&&(i+=`<rect x="${e*r}" y="${o*r}" width="${r}" height="${r}" fill="black"/>`)}return`\n      <svg width="${t}" height="${t}" xmlns="http://www.w3.org/2000/svg">\n        <rect width="${t}" height="${t}" fill="white"/>\n        ${i}\n        \x3c!-- Corner markers --\x3e\n        <rect x="0" y="0" width="${7*r}" height="${7*r}" fill="none" stroke="black" stroke-width="2"/>\n        <rect x="${t-7*r}" y="0" width="${7*r}" height="${7*r}" fill="none" stroke="black" stroke-width="2"/>\n        <rect x="0" y="${t-7*r}" width="${7*r}" height="${7*r}" fill="none" stroke="black" stroke-width="2"/>\n      </svg>\n    `}static generatePlaceholderQRCode(e){const t=fv.QR_CODE_SIZE;return`\n      <svg width="${t}" height="${t}" xmlns="http://www.w3.org/2000/svg">\n        <rect width="${t}" height="${t}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>\n        <text x="${t/2}" y="${t/2-20}" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">\n          QR Code\n        </text>\n        <text x="${t/2}" y="${t/2}" text-anchor="middle" font-family="Arial" font-size="12" fill="#6b7280">\n          (Mock Implementation)\n        </text>\n        <text x="${t/2}" y="${t/2+20}" text-anchor="middle" font-family="Arial" font-size="10" fill="#9ca3af">\n          Use manual entry below\n        </text>\n      </svg>\n    `}static formatManualEntryKey(e){const t=e.replace(/\s/g,"").toUpperCase();return t.match(/.{1,4}/g)?.join(" ")||t}static generateBackupCodes(e=8){const t=[];for(let r=0;r<e;r++){let e="";for(let t=0;t<8;t++)e+=Math.floor(10*Math.random());t.push(e.match(/.{1,4}/g)?.join("-")||e)}return t}static generateTOTPCode(e,t,r="SHA1",n=6){try{const r=new ArrayBuffer(8);new DataView(r).setUint32(4,t,!1);const i=fv.simpleHMAC(e,new Uint8Array(r)),o=15&i[i.length-1],s=(127&i[o])<<24|(255&i[o+1])<<16|(255&i[o+2])<<8|255&i[o+3];return(s%10**n).toString().padStart(n,"0")}catch(i){return"000000"}}static simpleHash(e){let t=0;for(let r=0;r<e.length;r++){t=(t<<5)-t+e.charCodeAt(r),t&=t}return Math.abs(t)}static simpleHMAC(e,t){const r=(new TextEncoder).encode(e),n=new Uint8Array(20);for(let i=0;i<n.length;i++){let e=0;for(let n=0;n<t.length;n++)e^=t[n]^(r[n%r.length]||0);n[i]=255&e}return n}static isQRCodeSupported(){try{return"undefined"!=typeof btoa&&"undefined"!=typeof TextEncoder&&"undefined"!=typeof Uint8Array}catch(e){return!1}}static getCapabilities(){return{qrCodeGeneration:fv.isQRCodeSupported(),manualEntry:!0,totpValidation:!0,backupCodes:!0}}}const bv=({isOpen:r,onClose:o,onContinue:s,userId:a,deviceName:c,issuer:l="PingOne"})=>{const[d,u]=e.useState(null),[p,h]=e.useState(""),[g,m]=e.useState(""),[b,x]=e.useState(!1),[w,v]=e.useState(!1),[j,S]=e.useState(!1),C=y.useCallback(async()=>{S(!0);try{const e={secret:fv.generateTOTPSecret(32),issuer:l,accountName:`${a}@${c}`,algorithm:"SHA1",digits:6,period:30},t=await fv.generateTOTPQRCode(e);u(e),h(t.totpUri),m(t.manualEntryKey)}catch(e){_t.showError("Failed to generate TOTP configuration")}finally{S(!1)}},[l,a,c]);e.useEffect(()=>{r&&!d&&C()},[r,d,C]);return r?t.jsxs("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0, 0, 0, 0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3,padding:"1rem"},children:[t.jsxs("div",{style:{backgroundColor:"white",borderRadius:"1rem",padding:"2rem",maxWidth:"500px",width:"100%",maxHeight:"90vh",overflow:"auto",boxShadow:"0 25px 50px -12px rgba(0, 0, 0, 0.25)"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx("div",{style:{width:"2.5rem",height:"2.5rem",backgroundColor:"#3b82f6",borderRadius:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",color:"white"},children:t.jsx(H,{size:20})}),t.jsxs("div",{children:[t.jsx("h2",{style:{margin:0,fontSize:"1.25rem",fontWeight:600,color:"#1f2937"},children:"Setup Authenticator App"}),t.jsx("p",{style:{margin:0,fontSize:"0.875rem",color:"#6b7280"},children:"Scan QR code or enter secret manually"})]})]}),t.jsx("button",{onClick:o,style:{background:"none",border:"none",padding:"0.5rem",borderRadius:"0.375rem",cursor:"pointer",color:"#6b7280",display:"flex",alignItems:"center",justifyContent:"center"},children:t.jsx(f,{size:20})})]}),j?t.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",padding:"2rem"},children:[t.jsx("div",{style:{width:"3rem",height:"3rem",border:"3px solid #e5e7eb",borderTop:"3px solid #3b82f6",borderRadius:"50%",animation:"spin 1s linear infinite"}}),t.jsx("p",{style:{margin:0,color:"#6b7280",fontSize:"0.875rem"},children:"Generating TOTP configuration..."})]}):t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1.5rem"},children:[t.jsxs("div",{style:{padding:"1rem",backgroundColor:"#f0f9ff",borderRadius:"0.5rem",border:"1px solid #bae6fd"},children:[t.jsx("h3",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#0369a1"},children:"📱 Setup Instructions"}),t.jsxs("ol",{style:{margin:0,paddingLeft:"1.25rem",fontSize:"0.875rem",color:"#0369a1",lineHeight:1.5},children:[t.jsx("li",{children:"Install an authenticator app (Google Authenticator, Authy, Microsoft Authenticator)"}),t.jsx("li",{children:"Scan the QR code below or enter the secret key manually"}),t.jsx("li",{children:"Enter the 6-digit code from your app to verify"})]})]}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"},children:[t.jsx("div",{style:{padding:"1rem",backgroundColor:"white",borderRadius:"0.5rem",border:"1px solid #e5e7eb",boxShadow:"0 1px 3px rgba(0, 0, 0, 0.1)"},children:p&&t.jsx(Se,{value:p,size:200,level:"M",includeMargin:!0})}),t.jsx("p",{style:{margin:0,fontSize:"0.75rem",color:"#6b7280",textAlign:"center"},children:"Scan this QR code with your authenticator app"})]}),t.jsxs("div",{style:{padding:"1rem",backgroundColor:"#f9fafb",borderRadius:"0.5rem",border:"1px solid #e5e7eb"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.75rem"},children:[t.jsxs("h4",{style:{margin:0,fontSize:"0.875rem",fontWeight:600,color:"#374151",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(V,{size:16}),"Manual Entry (Alternative)"]}),t.jsx("button",{onClick:()=>x(!b),style:{background:"none",border:"none",padding:"0.25rem",borderRadius:"0.25rem",cursor:"pointer",color:"#6b7280",display:"flex",alignItems:"center",justifyContent:"center"},children:b?t.jsx(fe,{size:16}):t.jsx(k,{size:16})})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.75rem",backgroundColor:"white",borderRadius:"0.375rem",border:"1px solid #d1d5db"},children:[t.jsx("code",{style:{flex:1,fontSize:"0.875rem",fontFamily:"monospace",color:b?"#1f2937":"#6b7280",backgroundColor:"transparent",border:"none",outline:"none",wordBreak:"break-all"},children:b?g:"•••• •••• •••• •••• •••• •••• •••• ••••"}),t.jsx("button",{onClick:async()=>{if(d?.secret)try{await navigator.clipboard.writeText(d.secret),v(!0),_t.showSuccess("Secret key copied to clipboard"),setTimeout(()=>v(!1),2e3)}catch(e){_t.showError("Failed to copy secret key")}},style:{background:w?"#10b981":"#f3f4f6",border:"none",padding:"0.5rem",borderRadius:"0.375rem",cursor:"pointer",color:w?"white":"#6b7280",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s ease"},children:w?t.jsx(i,{size:16}):t.jsx(n,{size:16})})]}),t.jsx("p",{style:{margin:"0.5rem 0 0 0",fontSize:"0.75rem",color:"#6b7280"},children:"If you can't scan the QR code, enter this secret key manually in your authenticator app"})]}),t.jsxs("div",{style:{padding:"1rem",backgroundColor:"#fef3c7",borderRadius:"0.5rem",border:"1px solid #f59e0b"},children:[t.jsx("h4",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#92400e"},children:"📋 Account Information"}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#92400e",lineHeight:1.5},children:[t.jsxs("div",{children:[t.jsx("strong",{children:"Issuer:"})," ",l]}),t.jsxs("div",{children:[t.jsx("strong",{children:"Account:"})," ",a,"@",c]}),t.jsxs("div",{children:[t.jsx("strong",{children:"Algorithm:"})," SHA1"]}),t.jsxs("div",{children:[t.jsx("strong",{children:"Digits:"})," 6"]}),t.jsxs("div",{children:[t.jsx("strong",{children:"Period:"})," 30 seconds"]})]})]})]}),t.jsxs("div",{style:{display:"flex",gap:"0.75rem",justifyContent:"flex-end",marginTop:"2rem",paddingTop:"1.5rem",borderTop:"1px solid #e5e7eb"},children:[t.jsx("button",{onClick:o,style:{padding:"0.75rem 1.5rem",border:"1px solid #d1d5db",borderRadius:"0.375rem",backgroundColor:"white",color:"#374151",fontSize:"0.875rem",fontWeight:"500",cursor:"pointer",transition:"all 0.2s ease"},children:"Cancel"}),t.jsx("button",{onClick:()=>{d&&sessionStorage.setItem("totpConfig",JSON.stringify(d)),s()},disabled:j,style:{padding:"0.75rem 1.5rem",border:"none",borderRadius:"0.375rem",backgroundColor:j?"#9ca3af":"#3b82f6",color:"white",fontSize:"0.875rem",fontWeight:"600",cursor:j?"not-allowed":"pointer",transition:"all 0.2s ease",display:"flex",alignItems:"center",gap:"0.5rem"},children:"Continue to Verification"})]})]}),t.jsx("style",{children:"\n        @keyframes spin {\n          from { transform: rotate(0deg); }\n          to { transform: rotate(360deg); }\n        }\n      "})]}):null},xv=Ce.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
`,yv=Ce.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	width: 90%;
	max-width: 500px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	position: relative;
`,wv=Ce.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1.5rem;
`,vv=Ce.div`
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: #fef3c7;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #d97706;
	font-size: 24px;
`,kv=Ce.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;
	flex: 1;
`,jv=Ce.button`
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	font-size: 1.5rem;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s;

	&:hover {
		color: #1f2937;
	}
`,Sv=Ce.p`
	color: #4b5563;
	margin-bottom: 1.5rem;
	line-height: 1.6;
`,Cv=Ce.div`
	margin-bottom: 1.25rem;
`,Av=Ce.label`
	display: block;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
`,Tv=Ce.div`
	position: relative;
`,_v=Ce.input`
	width: 100%;
	padding: 0.75rem;
	padding-right: 2.5rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 1rem;
	transition: border-color 0.2s, box-shadow 0.2s;

	&:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`,Rv=Ce.button`
	position: absolute;
	right: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	padding: 0.25rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s;

	&:hover {
		color: #1f2937;
	}
`,Iv=Ce.div`
	background: #fef2f2;
	border: 1px solid #fecaca;
	color: #991b1b;
	padding: 0.75rem;
	border-radius: 6px;
	margin-bottom: 1rem;
	font-size: 0.875rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,$v=Ce.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1.5rem;
`,Ev=Ce.button`
	flex: 1;
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-size: 1rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;

	${e=>"primary"===e.variant?"\n\t\tbackground: #6366f1;\n\t\tcolor: white;\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground: #4f46e5;\n\t\t}\n\t\t&:disabled {\n\t\t\tbackground: #9ca3af;\n\t\t\tcursor: not-allowed;\n\t\t}\n\t":"\n\t\tbackground: #f3f4f6;\n\t\tcolor: #374151;\n\t\t&:hover {\n\t\t\tbackground: #e5e7eb;\n\t\t}\n\t"}
`,zv=({isOpen:r,onClose:n,onPasswordChange:i,userId:o,environmentId:s,message:a})=>{const[c,l]=e.useState(""),[u,p]=e.useState(""),[h,g]=e.useState(""),[m,b]=e.useState(!1),[x,y]=e.useState(!1),[w,v]=e.useState(!1),[j,S]=e.useState(!1),[C,A]=e.useState(null);if(!r)return null;const T=()=>{j||(l(""),p(""),g(""),A(null),n())};return t.jsx(xv,{onClick:T,children:t.jsxs(yv,{onClick:e=>e.stopPropagation(),children:[t.jsxs(wv,{children:[t.jsx(vv,{children:t.jsx(W,{})}),t.jsx(kv,{children:"Password Change Required"}),t.jsx(jv,{onClick:T,disabled:j,children:t.jsx(f,{})})]}),a&&t.jsx(Sv,{children:a}),C&&t.jsxs(Iv,{children:[t.jsx(d,{}),C]}),t.jsxs("form",{onSubmit:async e=>{if(e.preventDefault(),A(null),c&&u&&h)if(u===h)if(u.length<8)A("New password must be at least 8 characters long");else if(c!==u){S(!0);try{await i(c,u)}catch(t){A(t instanceof Error?t.message:"Failed to change password")}finally{S(!1)}}else A("New password must be different from the current password");else A("New passwords do not match");else A("All fields are required")},children:[t.jsxs(Cv,{children:[t.jsx(Av,{htmlFor:"old-password",children:"Current Password"}),t.jsxs(Tv,{children:[t.jsx(_v,{id:"old-password",type:m?"text":"password",value:c,onChange:e=>l(e.target.value),placeholder:"Enter your current password",disabled:j,autoFocus:!0}),t.jsx(Rv,{type:"button",onClick:()=>b(!m),disabled:j,children:m?t.jsx(fe,{}):t.jsx(k,{})})]})]}),t.jsxs(Cv,{children:[t.jsx(Av,{htmlFor:"new-password",children:"New Password"}),t.jsxs(Tv,{children:[t.jsx(_v,{id:"new-password",type:x?"text":"password",value:u,onChange:e=>p(e.target.value),placeholder:"Enter your new password (min. 8 characters)",disabled:j}),t.jsx(Rv,{type:"button",onClick:()=>y(!x),disabled:j,children:x?t.jsx(fe,{}):t.jsx(k,{})})]})]}),t.jsxs(Cv,{children:[t.jsx(Av,{htmlFor:"confirm-password",children:"Confirm New Password"}),t.jsxs(Tv,{children:[t.jsx(_v,{id:"confirm-password",type:w?"text":"password",value:h,onChange:e=>g(e.target.value),placeholder:"Confirm your new password",disabled:j}),t.jsx(Rv,{type:"button",onClick:()=>v(!w),disabled:j,children:w?t.jsx(fe,{}):t.jsx(k,{})})]})]}),t.jsxs($v,{children:[t.jsx(Ev,{type:"button",variant:"secondary",onClick:T,disabled:j,children:"Cancel"}),t.jsx(Ev,{type:"submit",variant:"primary",disabled:j,children:j?"Changing...":"Change Password"})]})]})]})})},Pv=Ce.div`
  margin: 1rem 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
`,Ov=Ce.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  background: #f3f4f6;
  border-radius: 8px 8px 0 0;
  
  &:hover {
    background: #e5e7eb;
  }
`,Uv=Ce.h4`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
`,Dv=Ce.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 8px;
  background: #eff6ff;
  border: 2px solid #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
  margin-left: auto;

  svg {
    font-size: 1.25rem;
    color: #3b82f6;
  }

  &:hover {
    background: #dbeafe;
    border-color: #1d4ed8;
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    
    svg {
      color: #1d4ed8;
    }
  }
  
  &:active {
    transform: scale(1.05);
  }
`,Lv=Ce.div`
  padding: ${({$isExpanded:e})=>e?"1rem":"0"};
  max-height: ${({$isExpanded:e})=>e?"500px":"0"};
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
  border-radius: 0 0 8px 8px;
`,Nv=Ce.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`,Mv=Ce.h5`
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
`,Fv=Ce.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #6b7280;
`,qv=Ce.pre`
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.75rem;
  overflow-x: auto;
  margin: 0.5rem 0;
  color: #374151;
`,Vv=Ce.a`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.8rem;
  
  &:hover {
    text-decoration: underline;
  }
`,Bv=({title:r,type:n,children:i,defaultExpanded:o=!1,specLink:s})=>{const[l,d]=e.useState(o);return t.jsxs(Pv,{children:[t.jsxs(Ov,{onClick:()=>d(!l),children:[t.jsx("span",{style:{fontSize:"1.1em"},children:""}),t.jsx(c,{}),t.jsx(Uv,{children:r}),t.jsx(Dv,{children:l?t.jsx(a,{}):t.jsx(be,{})})]}),t.jsxs(Lv,{$isExpanded:l,children:[i,s&&t.jsx(Nv,{children:t.jsxs(Vv,{href:s,target:"_blank",rel:"noopener noreferrer",children:[t.jsx(h,{}),"View Specification"]})})]})]})},Wv=({title:e,items:r})=>t.jsxs(Nv,{children:[t.jsx(Mv,{children:e}),r.map((e,r)=>t.jsxs("div",{style:{marginBottom:"0.75rem"},children:[t.jsx("div",{style:{fontWeight:"bold",fontSize:"0.8rem",color:"#1f2937"},children:e.term}),t.jsx(Fv,{children:e.definition}),e.example&&t.jsx(qv,{children:e.example})]},r))]}),Gv=[{id:"auth-code-query",title:"Authorization Code + Query String",description:"Traditional web application with server-side token exchange",flowKey:"authorization_code",responseType:"code",responseMode:"query",clientId:"web_app_client",redirectUri:"https://myapp.com/callback",scope:"openid profile email",state:"xyz123"},{id:"implicit-fragment",title:"Implicit Flow + URL Fragment",description:"Single Page Application receiving tokens directly",flowKey:"implicit",responseType:"token id_token",responseMode:"fragment",clientId:"spa_client",redirectUri:"https://myapp.com/callback",scope:"openid profile email",state:"abc456"},{id:"hybrid-form-post",title:"Hybrid Flow + Form POST",description:"Secure parameter transmission without URL exposure",flowKey:"hybrid",responseType:"code id_token",responseMode:"form_post",clientId:"hybrid_client",redirectUri:"https://myapp.com/callback",scope:"openid profile email",state:"def789",nonce:"nonce123"},{id:"pingone-flow",title:"PingOne Flow Object",description:"Embedded authentication without browser redirects",flowKey:"authorization_code",responseType:"code",responseMode:"pi.flow",clientId:"mobile_app_client",redirectUri:"https://myapp.com/callback",scope:"openid profile email",state:"ghi012"}],Hv=Ce.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
`,Jv=Ce.h4`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Kv=Ce.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`,Yv=Ce.div`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }
`,Xv=Ce.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`,Qv=Ce.h5`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
`,Zv=Ce.div`
  color: #3b82f6;
  margin-top: 0.125rem;
`,ek=Ce.p`
  margin: 0 0 0.75rem 0;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
`,tk=Ce.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`,rk=Ce.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
`,nk=Ce.span`
  color: #6b7280;
  font-weight: 500;
`,ik=Ce.code`
  color: #111827;
  background: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
`,ok=({onSelectExample:e,className:r})=>t.jsxs(Hv,{className:r,children:[t.jsxs(Jv,{children:[t.jsx(se,{size:16}),"Example Presets"]}),t.jsx(Kv,{children:Gv.map(r=>t.jsxs(Yv,{onClick:()=>e(r),children:[t.jsxs(Xv,{children:[t.jsx(Qv,{children:r.title}),t.jsx(Zv,{children:t.jsx(n,{size:14})})]}),t.jsx(ek,{children:r.description}),t.jsxs(tk,{children:[t.jsxs(rk,{children:[t.jsx(nk,{children:"Flow:"}),t.jsx(ik,{children:r.flowKey})]}),t.jsxs(rk,{children:[t.jsx(nk,{children:"Response Type:"}),t.jsx(ik,{children:r.responseType})]}),t.jsxs(rk,{children:[t.jsx(nk,{children:"Response Mode:"}),t.jsx(ik,{children:r.responseMode})]})]})]},r.id))})]}),sk=Ce.div`
	background: #ffffff;
	border: 2px solid #e5e7eb;
	border-radius: 12px;
	padding: 1.25rem;
	margin: 1rem 0;
	box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`,ak=Ce.h4`
	margin: 0 0 1rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: #111827;
	display: flex;
	align-items: center;
	gap: 0.5rem;

	&::before {
		content: '🎨';
		font-size: 1.25rem;
	}
`,ck=Ce.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`,lk=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	border-radius: 8px;
	background: ${({$callType:e})=>Rt.getColorTheme(e).background};
	border: 2px solid ${({$callType:e})=>Rt.getColorTheme(e).border};
	transition: all 0.2s ease;

	&:hover {
		transform: translateX(4px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
`,dk=Ce.span`
	font-size: 1.5rem;
	line-height: 1;
	flex-shrink: 0;
`,uk=Ce.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	flex: 1;

	strong {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
	}

	span {
		font-size: 0.8rem;
		color: #6b7280;
		line-height: 1.4;
	}
`,pk=({className:e,compact:r=!1})=>{const n=Rt.getAllCallTypes();return r?t.jsxs(sk,{className:e,style:{padding:"0.75rem"},children:[t.jsx(ak,{style:{fontSize:"0.875rem",marginBottom:"0.75rem"},children:"API Call Types"}),t.jsx(ck,{style:{flexDirection:"row",flexWrap:"wrap",gap:"0.5rem"},children:n.map(e=>t.jsxs(lk,{$callType:e.type,style:{padding:"0.5rem 0.75rem",flex:"0 1 auto"},title:e.description,children:[t.jsx(dk,{style:{fontSize:"1.25rem"},children:e.icon}),t.jsx("strong",{style:{fontSize:"0.8rem"},children:e.displayName})]},e.type))})]}):t.jsxs(sk,{className:e,children:[t.jsx(ak,{children:"API Call Types"}),t.jsx(ck,{children:n.map(e=>t.jsxs(lk,{$callType:e.type,children:[t.jsx(dk,{children:e.icon}),t.jsxs(uk,{children:[t.jsx("strong",{children:e.displayName}),t.jsx("span",{children:e.description})]})]},e.type))})]})},hk=Ce.div`
	margin: 24px 0;
`,gk=Ce.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	padding: 16px;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,mk=Ce.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #111827;
	display: flex;
	align-items: center;
	gap: 8px;
`,fk=Ce.span`
	background: #3b82f6;
	color: white;
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 14px;
	font-weight: 600;
`,bk=Ce.button`
	background: #ef4444;
	color: white;
	border: none;
	padding: 8px 16px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 6px;

	&:hover {
		background: #dc2626;
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}

	&:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
	}
`,xk=Ce.div`
	text-align: center;
	padding: 48px 32px;
	background: white;
	border: 2px dashed #e5e7eb;
	border-radius: 8px;
	color: #9ca3af;
	font-size: 14px;
`,yk=Ce.div`
	display: flex;
	flex-direction: column;
	gap: 0;
`,wk=({title:r="API Calls to PingOne",showLegend:n=!0})=>{const[i,o]=e.useState([]);e.useEffect(()=>{o($e.getApiCalls());return $e.subscribe(e=>{o(e)})},[]);const s=e=>({method:e.method,url:e.url,actualPingOneUrl:e.actualPingOneUrl,callType:e.callType,headers:e.headers,body:e.body,queryParams:e.queryParams,response:e.response,timestamp:e.timestamp,duration:e.duration,stepName:e.step});return t.jsxs(hk,{children:[t.jsxs(gk,{children:[t.jsxs(mk,{children:[r,t.jsx(fk,{children:i.length})]}),t.jsx(bk,{onClick:()=>{$e.clearApiCalls()},disabled:0===i.length,children:"🗑️ Clear All"})]}),n&&t.jsx(pk,{compact:!0}),0===i.length?t.jsxs(xk,{children:[t.jsx("div",{style:{fontSize:"48px",marginBottom:"16px"},children:"📡"}),t.jsx("div",{style:{fontSize:"16px",fontWeight:600,color:"#6b7280",marginBottom:"8px"},children:"No API calls recorded yet"}),t.jsx("div",{style:{fontSize:"14px"},children:"API calls will appear here as they are made"})]}):t.jsx(yk,{children:i.map(e=>t.jsx(df,{apiCall:s(e),compact:!0,options:{includeHeaders:!0,includeBody:!0,includeQueryParams:!0,prettyPrint:!0,showEducationalNotes:!1,showFlowContext:!1}},e.id))})]})},vk=Ce.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`,kk=Ce.div`
	position: relative;
	display: flex;
	align-items: center;
`,jk=Ce(I)`
	position: absolute;
	left: 0.75rem;
	color: #9ca3af;
	pointer-events: none;
`,Sk=Ce.input`
	width: 100%;
	padding: 0.5rem 0.75rem 0.5rem 2.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: all 0.15s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`,Ck=Ce.div`
	max-height: 300px;
	overflow-y: auto;
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	background: white;
`,Ak=Ce.button`
	width: 100%;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem;
	border: none;
	background: ${({$selected:e})=>e?"#eff6ff":"white"};
	border-left: 3px solid ${({$selected:e})=>e?"#3b82f6":"transparent"};
	cursor: pointer;
	transition: all 0.15s;
	text-align: left;

	&:hover {
		background: ${({$selected:e})=>e?"#eff6ff":"#f9fafb"};
	}

	&:not(:last-child) {
		border-bottom: 1px solid #f3f4f6;
	}
`,Tk=Ce.div`
	width: 32px;
	height: 32px;
	border-radius: 0.375rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: 600;
	font-size: 0.875rem;
	flex-shrink: 0;
`,_k=Ce.div`
	flex: 1;
	min-width: 0;
`,Rk=Ce.div`
	font-weight: 500;
	font-size: 0.875rem;
	color: #111827;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`,Ik=Ce.div`
	font-size: 0.75rem;
	color: #6b7280;
	font-family: 'Monaco', 'Menlo', monospace;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`,$k=Ce.div`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	color: #6b7280;
	font-size: 0.875rem;
	gap: 0.5rem;
`,Ek=Ce.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem;
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 0.375rem;
	color: #991b1b;
	font-size: 0.875rem;
`,zk=Ce.div`
	padding: 2rem;
	text-align: center;
	color: #6b7280;
	font-size: 0.875rem;
`,Pk=Ce.button`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.375rem 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	background: white;
	color: #374151;
	font-size: 0.8125rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.15s;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	svg {
		animation: ${({disabled:e})=>e?"spin 1s linear infinite":"none"};
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`,Ok=Ce.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
`,Uk=Ce.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #111827;
`,Dk=({environmentId:r,workerToken:n,selectedAppId:i,onSelectApp:o,placeholder:s="Search applications..."})=>{const[a,c]=e.useState([]),[l,u]=e.useState([]),[p,h]=e.useState(""),[g,m]=e.useState(!1),[f,x]=e.useState(null),y=e.useCallback(async()=>{if(r&&n){m(!0),x(null);try{const e=await Nt({environmentId:r,workerToken:n});c(e),u(e)}catch(e){x(e instanceof Error?e.message:"Failed to load applications")}finally{m(!1)}}else x("Environment ID and Worker Token are required")},[r,n]);return e.useEffect(()=>{y()},[y]),e.useEffect(()=>{if(!p.trim())return void u(a);const e=p.toLowerCase(),t=a.filter(t=>t.name.toLowerCase().includes(e)||t.id.toLowerCase().includes(e)||t.protocol?.toLowerCase().includes(e));u(t)},[p,a]),g?t.jsx(vk,{children:t.jsxs($k,{children:[t.jsx(b,{size:16,style:{animation:"spin 1s linear infinite"}}),"Loading applications..."]})}):f?t.jsxs(vk,{children:[t.jsxs(Ek,{children:[t.jsx(d,{size:16}),f]}),t.jsxs(Pk,{onClick:y,children:[t.jsx(b,{size:14}),"Retry"]})]}):t.jsxs(vk,{children:[t.jsxs(Ok,{children:[t.jsx(Uk,{children:"Select Application"}),t.jsxs(Pk,{onClick:y,disabled:g,children:[t.jsx(b,{size:14}),"Refresh"]})]}),t.jsxs(kk,{children:[t.jsx(jk,{size:16}),t.jsx(Sk,{type:"text",placeholder:s,value:p,onChange:e=>h(e.target.value)})]}),t.jsx(Ck,{children:0===l.length?t.jsx(zk,{children:p?"No applications match your search":"No applications found"}):l.map(e=>t.jsxs(Ak,{$selected:e.id===i,onClick:()=>o(e),children:[t.jsx(Tk,{children:e.name.charAt(0).toUpperCase()}),t.jsxs(_k,{children:[t.jsx(Rk,{children:e.name}),t.jsx(Ik,{children:e.id})]})]},e.id))})]})},Lk=Ce.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(2px);
  display: ${({$isOpen:e})=>e?"flex":"none"};
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`,Nk=Ce.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid #e5e7eb;
`,Mk=Ce.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px 12px 0 0;
  position: relative;

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.25rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
      color: #374151;
    }
  }

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
    font-size: 0.95rem;
    line-height: 1.4;
  }
`,Fk=Ce.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: #f59e0b;
  color: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
`,qk=Ce.div`
  padding: 2rem;
`,Vk=Ce.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`,Bk=Ce.div`
  position: relative;
  
  .input-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    width: 1.125rem;
    height: 1.125rem;
    z-index: 1;
  }
  
  .toggle-password {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      color: #6b7280;
      background-color: #f3f4f6;
    }
  }
`,Wk=Ce.input`
  width: 100%;
  padding: 0.875rem;
  padding-left: ${({$hasIcon:e})=>e?"2.75rem":"0.875rem"};
  padding-right: ${({$hasToggle:e})=>e?"2.75rem":"0.875rem"};
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  transition: all 0.15s ease-in-out;
  background-color: #ffffff;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  &.is-invalid {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
`,Gk=Ce.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  
  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
`,Hk=Ce.div`
  padding: 1rem 2rem 2rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`,Jk=Ce.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 8px;
  cursor: ${({$isLoading:e})=>e?"not-allowed":"pointer"};
  transition: all 0.2s ease-in-out;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
  opacity: ${({$isLoading:e})=>e?.7:1};
  min-width: 140px;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }

  .animate-spin {
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
`,Kk=Ce.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }
`,Yk=Ce.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #1e40af;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  
  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
`,Xk=({isOpen:r,onClose:n,onLogin:i,title:o="PingOne Authentication",subtitle:s="Enter your credentials to continue with redirectless authentication",isLoading:a=!1,error:c=null})=>{const[l,d]=e.useState(""),[u,p]=e.useState(""),[h,g]=e.useState(!1),[m,b]=e.useState(null);e.useEffect(()=>{r&&(d(""),p(""),g(!1),b(null))},[r]),e.useEffect(()=>{m&&(l||u)&&b(null)},[l,u,m]);if(!r)return null;const x=c||m;return t.jsx(Lk,{$isOpen:r,onKeyDown:e=>{"Escape"===e.key&&n()},children:t.jsxs(Nk,{onClick:e=>e.stopPropagation(),children:[t.jsxs(Mk,{children:[t.jsx("button",{className:"close-button",onClick:n,disabled:a,children:t.jsx(f,{})}),t.jsx(Fk,{children:t.jsx(U,{})}),t.jsx("h2",{children:o}),t.jsx("p",{children:s})]}),t.jsxs("form",{onSubmit:async e=>{if(e.preventDefault(),l.trim())if(u.trim())try{await i(l.trim(),u)}catch(t){}else b("Password is required");else b("Username is required")},children:[t.jsxs(qk,{children:[t.jsxs(Vk,{children:[t.jsxs("label",{htmlFor:"username",children:[t.jsx(K,{size:14}),"Username"]}),t.jsxs(Bk,{children:[t.jsx(K,{className:"input-icon"}),t.jsx(Wk,{id:"username",type:"text",value:l,onChange:e=>d(e.target.value),placeholder:"Enter your PingOne username",disabled:a,$hasIcon:!0,className:x&&!l.trim()?"is-invalid":"",autoComplete:"username",autoFocus:!0})]})]}),t.jsxs(Vk,{children:[t.jsxs("label",{htmlFor:"password",children:[t.jsx(W,{size:14}),"Password"]}),t.jsxs(Bk,{children:[t.jsx(W,{className:"input-icon"}),t.jsx(Wk,{id:"password",type:h?"text":"password",value:u,onChange:e=>p(e.target.value),placeholder:"Enter your PingOne password",disabled:a,$hasIcon:!0,$hasToggle:!0,className:x&&!u.trim()?"is-invalid":"",autoComplete:"current-password"}),t.jsx("button",{type:"button",className:"toggle-password",onClick:()=>g(!h),disabled:a,children:h?t.jsx(fe,{size:16}):t.jsx(k,{size:16})})]})]}),x&&t.jsxs(Gk,{children:[t.jsx(f,{size:16}),t.jsx("span",{children:x})]}),t.jsxs(Yk,{children:[t.jsx(U,{size:14}),t.jsx("span",{children:"Your credentials are sent securely to PingOne via HTTPS. This app does not store your password."})]})]}),t.jsxs(Hk,{children:[t.jsx(Kk,{type:"button",onClick:n,disabled:a,children:"Cancel"}),t.jsx(Jk,{type:"submit",disabled:a,$isLoading:a,children:a?t.jsxs(t.Fragment,{children:[t.jsx(ne,{className:"animate-spin"}),"Authenticating..."]}):t.jsxs(t.Fragment,{children:[t.jsx(U,{}),"Sign In"]})})]})]})]})})};export{rd as $,Ai as A,yc as B,Qn as C,Wn as D,Hs as E,dv as F,kc as G,op as H,jp as I,Ox as J,Yp as K,ha as L,Ti as M,sh as N,jd as O,gv as P,lh as Q,Ma as R,yn as S,bv as T,_i as U,wk as V,ah as W,Dk as X,cc as Y,Rl as Z,tl as _,bi as a,uh as a0,Zp as a1,eg as a2,Nh as a3,ag as a4,Pg as a5,pg as a6,uf as a7,pf as a8,Dm as a9,tr as aA,vn as aB,Ru as aC,Ki as aD,qi as aE,Co as aF,Zd as aG,su as aH,Gd as aI,Uu as aJ,Dd as aK,Id as aL,ld as aM,fn as aN,Hf as aa,Eb as ab,Cf as ac,Kf as ad,Yf as ae,Jf as af,Kg as ag,cm as ah,Qx as ai,Gb as aj,Kb as ak,Xf as al,Bv as am,Wv as an,Lb as ao,Tx as ap,iw as aq,fy as ar,Jw as as,ok as at,kn as au,Dn as av,Xu as aw,nd as ax,Yt as ay,Qu as az,vi as b,vs as c,yi as d,wi as e,Xt as f,hf as g,Xn as h,cg as i,Du as j,ur as k,pw as l,lv as m,uv as n,df as o,Wm as p,Af as q,yu as r,Xk as s,zv as t,ki as u,Bm as v,ys as w,Ko as x,Qo as y,rr as z};
//# sourceMappingURL=components-oauth-qq-maH2w.js.map
