const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/utils-lzKqcxFi.js","assets/react-vendor-HWZo9XlX.js","assets/vendor-CvVeuJe7.js","assets/vendor-54DrP_uy.css","assets/components-credentials-T7jmF3zx.js","assets/styled-vendor-DGSsHzxd.js","assets/components-oauth-qq-maH2w.js","assets/v8u-services-CviCpCEt.js","assets/v8-services-DHsPM8a2.js","assets/v8-components-8swtZwHb.js","assets/v8-utils-BU6AoW1l.js","assets/v8u-components-COnDGHJS.js","assets/oauth-flows-par-DTJ0aZ64.js","assets/components-oauth-par-B-NhQsyD.js","assets/pages-DE-6TDOE.js","assets/components-token-uXxDPBqK.js","assets/pages-ai-D2KhTcan.js","assets/components-oauth-authorize-sao_-EgS.js","assets/components-oauth-discovery-DYbdhNwI.js","assets/pages-pingone-BLdy8FiO.js","assets/oauth-flows-authcode-ltS0AxHA.js","assets/oauth-flows-BoQiEZ27.js","assets/oauth-flows-device-CMULWbHZ.js","assets/components-oauth-client-BhjYl9xl.js","assets/oauth-flows-implicit-BlAJpg9o.js","assets/components-flow-BH3Bx-YA.js","assets/components-steps-BQ6HbS5x.js","assets/components-ui-DbX9aVva.js","assets/pages-docs-nYnYMLbe.js","assets/v8-hooks-B7CjPGrP.js","assets/v8-flows-CbgB_G0p.js","assets/v8-flows-Bwbl_h2s.css"])))=>i.map(i=>d[i]);
import{a as e,j as t,a2 as r,aE as i,av as n,F as o,p as a,n as s,l as d,ag as c,aF as l,aG as p,ad as m,R as u,aH as f,al as h,a8 as g,a1 as x,k as b,Q as v,aI as w,aJ as y,ah as k,L as j,aK as C,aL as z,aM as S,m as $,Y as I,G as T,h as A,i as R,ao as O,Z as U,aD as P,t as D,N as F,B as E,aN as _,ay as N,v as M,E as q,w as B,q as L,s as V,aO as W,W as H,H as Y,$ as J,aP as G,a7 as K,aQ as X,X as Z,aR as Q,ac as ee,M as te,aS as re,aT as ie,aU as ne,aV as oe,aW as ae,aX as se,a4 as de,a9 as ce,ak as le,V as pe,a0 as me,aY as ue,aZ as fe,K as he,e as ge,a_ as xe,x as be}from"./react-vendor-HWZo9XlX.js";import{a as ve}from"./styled-vendor-DGSsHzxd.js";import{l as we,c as ye,h as ke,_ as je,m as Ce}from"./utils-lzKqcxFi.js";import{d as ze,e as Se,b as $e,k as Ie,O as Te,l as Ae,m as Re,T as Oe,n as Ue,o as Pe,p as De,P as Fe,q as Ee}from"./components-oauth-qq-maH2w.js";import{S as _e}from"./components-token-uXxDPBqK.js";import{O as Ne,C as Me}from"./oauth-flows-device-CMULWbHZ.js";import{F as qe,V as Be}from"./pages-DE-6TDOE.js";import{A as Le}from"./oauth-flows-authcode-ltS0AxHA.js";import{w as Ve}from"./oauth-flows-BoQiEZ27.js";const We={showCredentialsModal:!1,showSuccessModal:!0,showAuthRequestModal:!0,showFlowDebugConsole:!0,darkMode:!1,fontSize:"medium",colorScheme:"blue",autoAdvanceSteps:!1,collapsibleDefaultState:"collapsed",showRequestResponseDetails:!1,copyButtonBehavior:"confirmation",errorDetailLevel:"basic",consoleLoggingLevel:"normal",defaultPageOnLoad:"dashboard",hideCompletedFlows:!1,quickActionsVisibility:!0,showPollingPrompt:!0,showApiCallExamples:!0},He=e.createContext(void 0),Ye=({children:r})=>{const[i,n]=e.useState(We),o=e.useCallback(e=>{const t=document.documentElement;e.darkMode?t.classList.add("dark-mode"):t.classList.remove("dark-mode"),t.classList.remove("font-small","font-medium","font-large"),t.classList.add(`font-${e.fontSize}`),t.classList.remove("color-blue","color-green","color-purple","color-orange","color-red"),t.classList.add(`color-${e.colorScheme}`)},[]);e.useEffect(()=>{(()=>{try{const e="enhanced-flow-authorization-code",t=JSON.parse(localStorage.getItem(e)||"{}"),r="ui-settings",i=JSON.parse(localStorage.getItem(r)||"{}"),a={...We,...t,...i};n(a),o(a)}catch(e){n(We)}})()},[o]);const a={settings:i,updateSetting:(e,t)=>{n(r=>{const i={...r,[e]:t};try{const r="ui-settings";localStorage.setItem(r,JSON.stringify(i));const n="enhanced-flow-authorization-code",a={...JSON.parse(localStorage.getItem(n)||"{}"),[e]:t};localStorage.setItem(n,JSON.stringify(a)),o(i),window.dispatchEvent(new CustomEvent("uiSettingsChanged",{detail:{[e]:t,allSettings:i}}))}catch(n){}return i})},resetSettings:()=>{n(We);try{o(We),window.dispatchEvent(new CustomEvent("uiSettingsReset",{detail:{settings:We}}))}catch(e){}},saveSettings:async()=>{try{localStorage.setItem("ui-settings",JSON.stringify(i));const e="enhanced-flow-authorization-code",t={...JSON.parse(localStorage.getItem(e)||"{}"),...i};localStorage.setItem(e,JSON.stringify(t)),window.dispatchEvent(new CustomEvent("uiSettingsSaved",{detail:{settings:i}}))}catch(e){throw e}}};return t.jsx(He.Provider,{value:a,children:r})},Je=()=>{const t=e.useContext(He);if(void 0===t)throw new Error("useUISettings must be used within a UISettingsProvider");return t};const Ge=new class{STORAGE_KEY="pingone_playground_device_flow_state";MAX_POLL_ATTEMPTS=100;DEFAULT_POLL_INTERVAL=5e3;async startDeviceFlow(e,t){try{const r="/api/device-authorization";we.info("DeviceFlowService","Starting device authorization flow",{environmentId:e,clientId:t.client_id,scope:t.scope});const i=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({environment_id:e,client_id:t.client_id,scope:t.scope,audience:t.audience,acr_values:t.acr_values,prompt:t.prompt,max_age:t.max_age,ui_locales:t.ui_locales,claims:t.claims,app_identifier:t.app_identifier})});if(!i.ok){const e=await i.text();throw new Error(`Device authorization failed: ${i.status} ${i.statusText} - ${e}`)}const n=await i.json(),o={deviceCode:n.device_code,userCode:n.user_code,verificationUri:n.verification_uri,verificationUriComplete:n.verification_uri_complete,expiresIn:n.expires_in,interval:n.interval||this.DEFAULT_POLL_INTERVAL,expiresAt:new Date(Date.now()+1e3*n.expires_in),status:"pending",pollCount:0};return this.saveDeviceFlowState(o),we.success("DeviceFlowService","Device authorization started",{userCode:n.user_code,verificationUri:n.verification_uri,expiresIn:n.expires_in}),n}catch(r){throw we.error("DeviceFlowService","Failed to start device flow",r),r}}async pollForTokens(e,t,r,i){try{const n=`https://auth.pingone.com/${e}/as/token`;we.info("DeviceFlowService","Polling for device tokens",{deviceCode:`${t.substring(0,8)}...`,clientId:r});const o=new FormData;o.append("grant_type","urn:ietf:params:oauth:grant-type:device_code"),o.append("device_code",t),o.append("client_id",r),i&&o.append("client_secret",i);const a=await fetch(n,{method:"POST",body:o,headers:{Accept:"application/json"}}),s=await a.json();return a.ok?we.success("DeviceFlowService","Device tokens received",{hasAccessToken:!!s.access_token,hasIdToken:!!s.id_token,hasRefreshToken:!!s.refresh_token}):we.warn("DeviceFlowService","Device token request failed",{error:s.error,description:s.error_description}),s}catch(n){throw we.error("DeviceFlowService","Failed to poll for device tokens",n),n}}async startPolling(e,t,r,i,n,o,a){const s=this.getDeviceFlowState();if(!s||s.deviceCode!==t)throw new Error("Device flow state not found");const d=1e3*s.interval;let c=0;const l=async()=>{try{if(new Date>s.expiresAt)return s.status="expired",this.saveDeviceFlowState(s),void a?.(new Error("Device authorization expired"));if(c>=this.MAX_POLL_ATTEMPTS)return s.status="expired",this.saveDeviceFlowState(s),void a?.(new Error("Maximum poll attempts reached"));c++,s.pollCount=c,s.lastPolled=new Date;const p=await this.pollForTokens(e,t,r,i);if(p.access_token||p.id_token)return s.status="authorized",s.tokens=p,this.saveDeviceFlowState(s),void o?.(p);p.error?"authorization_pending"===p.error?(s.status="pending",this.saveDeviceFlowState(s),n?.(s),setTimeout(l,d)):"authorization_declined"===p.error?(s.status="denied",this.saveDeviceFlowState(s),a?.(new Error("User denied authorization"))):"expired_token"===p.error?(s.status="expired",this.saveDeviceFlowState(s),a?.(new Error("Device code expired"))):(s.status="expired",this.saveDeviceFlowState(s),a?.(new Error(p.error_description||p.error))):(s.status="pending",this.saveDeviceFlowState(s),n?.(s),setTimeout(l,d))}catch(p){we.error("DeviceFlowService","Polling error",p),a?.(p instanceof Error?p:new Error("Unknown polling error"))}};setTimeout(l,d)}getDeviceFlowState(){try{const e=localStorage.getItem(this.STORAGE_KEY);if(!e)return null;const t=JSON.parse(e);return t.expiresAt=new Date(t.expiresAt),t.lastPolled&&(t.lastPolled=new Date(t.lastPolled)),t}catch(e){return we.warn("DeviceFlowService","Failed to get device flow state",e),null}}saveDeviceFlowState(e){try{localStorage.setItem(this.STORAGE_KEY,JSON.stringify(e))}catch(t){we.warn("DeviceFlowService","Failed to save device flow state",t)}}clearDeviceFlowState(){try{localStorage.removeItem(this.STORAGE_KEY),we.info("DeviceFlowService","Device flow state cleared")}catch(e){we.warn("DeviceFlowService","Failed to clear device flow state",e)}}generateQRCodeData(e){return e}formatUserCode(e){return 8===e.length?`${e.substring(0,4)}-${e.substring(4)}`:e}getTimeRemaining(e){const t=new Date,r=e.expiresAt.getTime()-t.getTime();return Math.max(0,Math.floor(r/1e3))}isDeviceFlowActive(e){return"pending"===e.status&&new Date<e.expiresAt}getStatusMessage(e){switch(e.status){case"pending":return"Waiting for user authorization...";case"authorized":return"Authorization successful!";case"denied":return"Authorization was denied by user.";case"expired":return"Device code has expired. Please start a new flow.";default:return"Unknown status"}}},Ke=ve.div`
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-radius: 2rem;
  padding: 3rem;
  margin: 2rem 0;
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 16px solid #0f172a;
  position: relative;
  
  /* Simulated kiosk bezel/frame */
  &::before {
    content: '';
    position: absolute;
    top: -16px;
    left: -16px;
    right: -16px;
    bottom: -16px;
    border-radius: 2rem;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%);
    z-index: -1;
    box-shadow: 
      0 0 40px rgba(0, 0, 0, 0.5),
      inset 0 2px 4px rgba(255, 255, 255, 0.1);
  }
  
  /* Simulated camera lens at top */
  &::after {
    content: '📷';
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 32px;
    background: radial-gradient(circle, #1e40af 0%, #1e3a8a 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    box-shadow: 
      0 0 20px rgba(30, 64, 175, 0.5),
      inset 0 0 10px rgba(59, 130, 246, 0.3);
  }
`,Xe=ve.div`
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 1rem;
  padding: 0;
  margin: 1.5rem 0;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 3px #1e293b;
  border: 4px solid #cbd5e1;
  overflow: hidden;
  position: relative;
  min-height: 600px;
`,Ze=ve.div`
  background: linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%);
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`,Qe=ve.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ffffff;
`,et=ve.div`
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`,tt=ve.div`
  background: #ffffff;
  color: #1e40af;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`,rt=ve.div`
  position: absolute;
  top: 6rem;
  right: 2rem;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, #1e40af 0%, #1e3a8a 60%, #0f172a 100%);
  border-radius: 50%;
  border: 4px solid #3b82f6;
  box-shadow: 
    0 0 40px rgba(59, 130, 246, 0.6),
    inset 0 0 30px rgba(30, 64, 175, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% {
      box-shadow: 
        0 0 40px rgba(59, 130, 246, 0.6),
        inset 0 0 30px rgba(30, 64, 175, 0.4);
    }
    50% {
      box-shadow: 
        0 0 60px rgba(59, 130, 246, 0.8),
        inset 0 0 40px rgba(30, 64, 175, 0.6);
    }
  }
`,it=ve.div`
  font-size: 3rem;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
`,nt=ve.div`
  position: absolute;
  bottom: -2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #0ea5e9;
  color: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,ot=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"#fef3c7";case"authorized":return"#d1fae5";case"denied":return"#fee2e2";default:return"#f3f4f6"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#f59e0b";case"authorized":return"#10b981";case"denied":return"#ef4444";default:return"#9ca3af"}}};
  color: ${e=>{switch(e.$status){case"pending":return"#92400e";case"authorized":return"#065f46";case"denied":return"#991b1b";default:return"#374151"}}};
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,at=ve.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`,st=ve.div`
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: 1rem;
  padding: 2rem;
`,dt=ve.div`
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
`,ct=ve.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
`,lt=ve.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
`,pt=ve.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #0f172a;
`,mt=ve.div`
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  border-radius: 1rem;
  padding: 2rem;
  color: #ffffff;
  box-shadow: 0 10px 25px rgba(30, 64, 175, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1), transparent);
    pointer-events: none;
  }
`,ut=ve.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #bfdbfe;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
`,ft=ve.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1.5rem;
`,ht=ve.div`
  height: 1px;
  background: rgba(191, 219, 254, 0.3);
  margin: 1rem 0;
`,gt=ve.div`
  background: rgba(15, 23, 42, 0.5);
  border: 2px solid rgba(191, 219, 254, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  margin-top: 1.5rem;
`,xt=ve.div`
  font-size: 0.75rem;
  color: #bfdbfe;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,bt=ve.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.2em;
`,vt=ve.div`
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  grid-column: 1 / -1;
`,wt=ve.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
`,yt=ve.div`
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1.5rem;
`,kt=ve.div`
  display: inline-block;
  padding: 1rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`,jt=ve.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
  flex-wrap: wrap;
`,Ct=ve.button`
  background: ${e=>{switch(e.$variant){case"primary":return"#3b82f6";case"secondary":default:return"#64748b";case"success":return"#22c55e"}}};
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.875rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`,zt=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"rgba(245, 158, 11, 0.1)";case"authorized":return"rgba(34, 197, 94, 0.1)";case"denied":return"rgba(239, 68, 68, 0.1)";default:return"rgba(107, 114, 128, 0.1)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#f59e0b";case"authorized":return"#22c55e";case"denied":return"#ef4444";default:return"#6b7280"}}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`,St=ve.div`
  font-size: 1.5rem;
  color: ${e=>{switch(e.$status){case"pending":return"#f59e0b";case"authorized":return"#22c55e";case"denied":return"#ef4444";default:return"#6b7280"}}};
`,$t=ve.div`
  flex: 1;
`,It=ve.div`
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
`,Tt=ve.div`
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
`,At=({state:e,onStateUpdate:l,onComplete:p,onError:m})=>{const u=()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}};return t.jsxs(t.Fragment,{children:[t.jsx(Ke,{children:t.jsxs(Xe,{children:[t.jsxs(Ze,{children:[t.jsxs(Qe,{children:[t.jsx("span",{style:{fontSize:"2rem"},children:"👁️"}),t.jsx(et,{children:"CLEAR"})]}),t.jsxs("div",{style:{display:"flex",gap:"1rem",alignItems:"center"},children:[t.jsxs(tt,{children:[t.jsx(r,{}),"TSA PreCheck®"]}),t.jsxs(ot,{$status:e.status,children:[u(),(()=>{switch(e.status){case"pending":return"Awaiting Confirmation";case"authorized":return"Check-in Complete";case"denied":return"Access Denied";case"expired":return"Session Expired";default:return"Unknown"}})()]})]})]}),t.jsxs(rt,{children:[t.jsx(it,{children:t.jsx(i,{})}),t.jsx(nt,{children:"Iris Scanner"})]}),t.jsxs(at,{children:[t.jsxs(st,{children:[t.jsx(dt,{children:"Check-in Information"}),t.jsxs(ct,{children:[t.jsx(lt,{children:"Flight"}),t.jsx(pt,{children:"P1 204 → San Francisco"})]}),t.jsxs(ct,{children:[t.jsx(lt,{children:"Departure"}),t.jsx(pt,{children:"Today, 10:45 AM"})]}),t.jsxs(ct,{children:[t.jsx(lt,{children:"Gate"}),t.jsx(pt,{children:"B12"})]}),t.jsxs(ct,{children:[t.jsx(lt,{children:"Boarding"}),t.jsx(pt,{children:"10:20 AM"})]}),t.jsxs(ct,{children:[t.jsx(lt,{children:"Status"}),t.jsx(pt,{children:"authorized"===e.status?"Ready to Board":"Pending"})]})]}),t.jsxs(mt,{children:[t.jsx(ut,{children:"Passenger"}),t.jsx(ft,{children:"Demo Traveler"}),t.jsx(ht,{}),t.jsx(ut,{children:"Seat Assignment"}),t.jsx(ft,{children:"12A • Window"}),t.jsx(ht,{}),t.jsx(ut,{children:"Baggage"}),t.jsx(ft,{children:"2 Checked • 1 Carry-on"}),t.jsxs(gt,{children:[t.jsx(xt,{children:"Authorization Code"}),t.jsx(bt,{children:Ge.formatUserCode(e.userCode)})]})]}),t.jsxs(vt,{children:[t.jsx(wt,{children:"Complete Check-in on Your Mobile Device"}),t.jsx(yt,{children:"Scan the QR code below with your smartphone to authorize check-in"}),t.jsx(kt,{children:t.jsx(n,{value:e.verificationUriComplete,size:200,bgColor:"#ffffff",fgColor:"#0f172a",level:"H",includeMargin:!0})}),t.jsxs(jt,{children:[t.jsxs(Ct,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("AirportKioskDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(Ct,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("AirportKioskDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open on This Device"]})]})]})]}),t.jsxs(zt,{$status:e.status,children:[t.jsx(St,{$status:e.status,children:u()}),t.jsxs($t,{children:[t.jsx(It,{children:(()=>{switch(e.status){case"pending":return"Authorization Pending";case"authorized":return"Check-in Complete";case"denied":return"Authorization Denied";case"expired":return"Session Expired";default:return"Unknown Status"}})()}),t.jsx(Tt,{children:Ge.getStatusMessage(e)})]})]}),"authorized"===e.status&&e.tokens&&t.jsx("div",{style:{background:"rgba(34, 197, 94, 0.1)",border:"2px solid #22c55e",borderRadius:"1rem",padding:"2rem",marginTop:"1rem"},children:t.jsxs("div",{style:{fontSize:"1.25rem",fontWeight:"700",color:"#065f46",textAlign:"center",marginBottom:"1rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(s,{}),"Boarding Pass Ready - Proceed to Security"]})})]})}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"#ffffff",borderColor:"#cbd5e1",headerTextColor:"#1e293b"})]})},Rt=ve.div`
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
  border-radius: 0.75rem;
  padding: 1.2rem;
  margin: 2rem 0;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid #333333;
  position: relative;
  max-width: 350px;
  margin-left: auto;
  margin-right: auto;
  color: #ffffff;
  
  /* Sonos 3 speaker grille texture - more refined */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 0.75rem;
    background: 
      radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
      linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.02) 50%, transparent 100%),
      linear-gradient(0deg, transparent 0%, rgba(255, 255, 255, 0.01) 50%, transparent 100%);
    pointer-events: none;
  }
  
  /* Sonos 3 logo area */
  &::after {
    content: 'SONOS 3';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: 1.5px;
    z-index: 2;
  }
`,Ot=ve.div`
  text-align: center;
  margin-bottom: 1.5rem;
`,Ut=ve.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
`,Pt=ve.div`
  font-size: 0.875rem;
  color: #9ca3af;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`,Dt=ve.div`
  width: 200px;
  height: 120px;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border-radius: 1rem;
  margin: 0 auto 1.5rem;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 0.25rem;
  padding: 1rem;
  border: 2px solid #4b5563;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(0, 0, 0, 0.5);
`,Ft=ve.div`
  background: #1f2937;
  border-radius: 50%;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
`,Et=ve.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 2px solid #374151;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`,_t=ve.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #374151;
  
  &:last-child {
    border-bottom: none;
  }
`,Nt=ve.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Mt=ve.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${e=>{switch(e.$status){case"connected":return"#10b981";case"disconnected":return"#ef4444";case"pending":return"#f59e0b";default:return"#ffffff"}}};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,qt=ve.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${e=>e.$active?e.$color:"#6b7280"};
  box-shadow: ${e=>e.$active?`0 0 8px ${e.$color}`:"none"};
  animation: ${e=>e.$active?"pulse 2s infinite":"none"};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`,Bt=ve.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin: 1rem 0;
`,Lt=ve.div`
  aspect-ratio: 1;
  background: ${({$color:e})=>e};
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #ffffff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s ease;
  padding: 0.5rem;
  
  &:hover {
    transform: scale(1.05);
  }
`,Vt=ve.div`
  font-size: 0.6rem;
  font-weight: 600;
  margin-top: 0.25rem;
  text-align: center;
`,Wt=ve.div`
  background: #000000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 2px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
  text-align: center;
`,Ht=ve.div`
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin: 1rem 0;
  border: 2px solid #e5e7eb;
`,Yt=ve.div`
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`,Jt=ve.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`,Gt=ve.div`
  display: inline-block;
  padding: 1rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`,Kt=ve.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
`,Xt=ve.button`
  background: ${e=>"primary"===e.$variant?"#3b82f6":"#6b7280"};
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`,Zt=ve.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-top: 1rem;
  text-align: center;
  color: #ffffff;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
`,Qt=ve.div`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`,er=ve.div`
  font-size: 0.875rem;
  opacity: 0.9;
`,tr=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>t.jsxs(t.Fragment,{children:[t.jsxs(Rt,{children:[t.jsxs(Ot,{children:[t.jsx(Ut,{children:"BOSE"}),t.jsx(Pt,{children:"Smart Speaker 500"})]}),t.jsx(Dt,{children:Array.from({length:40},(e,r)=>t.jsx(Ft,{},r))}),t.jsxs(Et,{children:[t.jsxs(_t,{children:[t.jsx(Nt,{children:"WiFi"}),t.jsxs(Mt,{$status:"connected",children:[t.jsx(qt,{$active:!0,$color:"#10b981"}),"Connected"]})]}),t.jsxs(_t,{children:[t.jsx(Nt,{children:"Battery"}),t.jsxs(Mt,{children:[t.jsx(qt,{$active:!0,$color:"#10b981"}),"Plugged In"]})]}),t.jsxs(_t,{children:[t.jsx(Nt,{children:"Status"}),t.jsxs(Mt,{$status:e.status,children:[(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})(),(()=>{switch(e.status){case"pending":return"Awaiting Authorization";case"authorized":return"Speaker Connected";case"denied":return"Connection Denied";case"expired":return"Session Expired";default:return"Unknown Status"}})()]})]}),t.jsxs(_t,{children:[t.jsx(Nt,{children:"Authorization Code"}),t.jsx(Mt,{children:t.jsx("span",{style:{fontFamily:"monospace",fontSize:"1.1rem",letterSpacing:"0.1em"},children:Ge.formatUserCode(e.userCode)})})]})]}),t.jsx(Bt,{children:[{label:"Spotify",icon:"🎵",color:"#1db954"},{label:"Apple Music",icon:"🎶",color:"#fa243c"},{label:"Amazon Music",icon:"🎧",color:"#ff9900"},{label:"Pandora",icon:"📻",color:"#005483"},{label:"YouTube Music",icon:"🎤",color:"#ff0000"},{label:"Bose Music",icon:"🔊",color:"#000000"},{label:"TuneIn",icon:"🌐",color:"#14d9c4"},{label:"Settings",icon:"⚙️",color:"#64748b"}].map(e=>t.jsxs(Lt,{$color:e.color,children:[t.jsx("span",{style:{fontSize:"1.25rem"},children:e.icon}),t.jsx(Vt,{children:e.label})]},e.label))}),t.jsx(Wt,{children:Ge.formatUserCode(e.userCode)}),t.jsxs(Ht,{children:[t.jsx(Yt,{children:"Connect with Bose Music App"}),t.jsx(Jt,{children:"Scan this QR code with your phone to complete setup"}),t.jsx(Gt,{children:t.jsx(n,{value:e.verificationUriComplete,size:160,bgColor:"#ffffff",fgColor:"#1f2937",level:"H",includeMargin:!0})}),t.jsxs(Kt,{children:[t.jsxs(Xt,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("BoseSmartSpeakerDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(Xt,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("BoseSmartSpeakerDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open App"]})]})]}),"authorized"===e.status&&t.jsxs(Zt,{children:[t.jsxs(Qt,{children:[t.jsx(s,{}),"Speaker Connected Successfully!"]}),t.jsx(er,{children:"Your Bose Smart Speaker is now connected and ready to play your favorite music."})]})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(0, 0, 0, 0.2)",borderColor:"#333333",headerTextColor:"#ffffff"})]}),rr=ve.div`
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: 1.5rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 8px solid #0f172a;
  position: relative;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  
  /* Ring doorbell mounting plate effect */
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
    border-radius: 1.5rem;
    background: linear-gradient(135deg, #374151 0%, #1f2937 50%, #111827 100%);
    z-index: -1;
    box-shadow: 
      0 0 30px rgba(0, 0, 0, 0.4),
      inset 0 2px 4px rgba(255, 255, 255, 0.05);
  }
`,ir=ve.div`
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, #000000 0%, #1f2937 60%, #374151 100%);
  border-radius: 50%;
  border: 6px solid #0f172a;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 
    0 0 20px rgba(0, 0, 0, 0.5),
    inset 0 0 20px rgba(0, 0, 0, 0.8);
  
  /* Infrared LED ring */
  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, transparent 0deg, #ef4444 45deg, transparent 90deg, transparent 270deg, #ef4444 315deg, transparent 360deg);
    opacity: 0.3;
    animation: pulse 3s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }
`,nr=ve.div`
  font-size: 3rem;
  color: #ffffff;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
`,or=ve.div`
  width: 80px;
  height: 80px;
  background: ${e=>{switch(e.$status){case"pending":return"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";case"authorized":return"linear-gradient(135deg, #10b981 0%, #059669 100%)";case"denied":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";case"expired":return"linear-gradient(135deg, #6b7280 0%, #4b5563 100%)";default:return"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"}}};
  border-radius: 50%;
  border: 4px solid #0f172a;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 
      0 6px 16px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
`,ar=ve.div`
  font-size: 2rem;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`,sr=ve.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 2px solid #374151;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`,dr=ve.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #374151;
  
  &:last-child {
    border-bottom: none;
  }
`,cr=ve.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,lr=ve.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${e=>{switch(e.$status){case"online":return"#10b981";case"offline":return"#ef4444";case"pending":return"#f59e0b";default:return"#ffffff"}}};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,pr=ve.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${e=>e.$active?e.$color:"#6b7280"};
  box-shadow: ${e=>e.$active?`0 0 8px ${e.$color}`:"none"};
  animation: ${e=>e.$active?"pulse 2s infinite":"none"};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`,mr=ve.div`
  text-align: center;
  margin-bottom: 1.5rem;
`,ur=ve.div`
  font-size: 2rem;
  font-weight: 900;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`,fr=ve.div`
  font-size: 0.875rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,hr=ve.div`
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin: 1rem 0;
  border: 2px solid #e5e7eb;
`,gr=ve.div`
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`,xr=ve.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`,br=ve.div`
  display: inline-block;
  padding: 1rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`,vr=ve.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
`,wr=ve.button`
  background: ${e=>"primary"===e.$variant?"#3b82f6":"#6b7280"};
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`,yr=ve.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-top: 1rem;
  text-align: center;
  color: #ffffff;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
`,kr=ve.div`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`,jr=ve.div`
  font-size: 0.875rem;
  opacity: 0.9;
`,Cr=({state:e,onStateUpdate:r,onComplete:p,onError:m})=>t.jsxs(t.Fragment,{children:[t.jsxs(rr,{children:[t.jsxs(mr,{children:[t.jsx(ur,{children:"RING"}),t.jsx(fr,{children:"Video Doorbell Pro 2"})]}),t.jsx(ir,{children:t.jsx(nr,{children:t.jsx(i,{})})}),t.jsx(or,{$status:e.status,children:t.jsx(ar,{children:t.jsx(l,{})})}),t.jsxs(sr,{children:[t.jsxs(dr,{children:[t.jsx(cr,{children:"WiFi"}),t.jsxs(lr,{$status:"online",children:[t.jsx(pr,{$active:!0,$color:"#10b981"}),"Connected"]})]}),t.jsxs(dr,{children:[t.jsx(cr,{children:"Battery"}),t.jsxs(lr,{children:[t.jsx(pr,{$active:!0,$color:"#10b981"}),"87% - Good"]})]}),t.jsxs(dr,{children:[t.jsx(cr,{children:"Status"}),t.jsxs(lr,{$status:e.status,children:[(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})(),(()=>{switch(e.status){case"pending":return"Awaiting Authorization";case"authorized":return"Doorbell Connected";case"denied":return"Connection Denied";case"expired":return"Session Expired";default:return"Unknown Status"}})()]})]}),t.jsxs(dr,{children:[t.jsx(cr,{children:"Authorization Code"}),t.jsx(lr,{children:t.jsx("span",{style:{fontFamily:"monospace",fontSize:"1.1rem",letterSpacing:"0.1em"},children:Ge.formatUserCode(e.userCode)})})]})]}),t.jsxs(hr,{children:[t.jsx(gr,{children:"Connect to Ring App"}),t.jsx(xr,{children:"Scan this QR code with your phone to complete setup"}),t.jsx(br,{children:t.jsx(n,{value:e.verificationUriComplete,size:160,bgColor:"#ffffff",fgColor:"#1f2937",level:"H",includeMargin:!0})}),t.jsxs(vr,{children:[t.jsxs(wr,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("RingDoorbellDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(wr,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("RingDoorbellDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open App"]})]})]}),"authorized"===e.status&&e.tokens&&t.jsxs(yr,{children:[t.jsxs(kr,{children:[t.jsx(s,{}),"Doorbell Connected Successfully!"]}),t.jsx(jr,{children:"Your Ring Video Doorbell is now connected and ready to monitor your front door."})]})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(0, 0, 0, 0.2)",borderColor:"#374151",headerTextColor:"#ffffff"})]}),zr=ve.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 1.8rem;
  padding: 1.8rem;
  margin: 2rem 0;
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 3px solid #e5e7eb;
  position: relative;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
  color: #1f2937;
  
  /* DualSense specific styling - white with subtle gradients */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1.8rem;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%);
    pointer-events: none;
  }
  
  /* PlayStation logo area */
  &::after {
    content: 'PS';
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    font-weight: 700;
    color: #3b82f6;
    letter-spacing: 0.5px;
    z-index: 2;
  }
`,Sr=ve.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0;
  padding: 0 1rem;
  
  /* DualSense has D-pad on left, action buttons on right */
  gap: 3rem;
`,$r=ve.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  width: 80px;
  height: 80px;
`,Ir=ve.div`
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 2px solid #4b5563;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #ffffff;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 6px 12px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`,Tr=ve.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  width: 80px;
  height: 80px;
`,Ar=ve.div`
  background: ${({$color:e})=>e};
  border: 2px solid ${({$color:e})=>e};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 
      0 6px 12px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
`,Rr=ve.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`,Or=ve.div`
  font-size: 1.5rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 0.5rem;
`,Ur=ve.div`
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,Pr=ve.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 2px solid #374151;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`,Dr=ve.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #374151;
  
  &:last-child {
    border-bottom: none;
  }
`,Fr=ve.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Er=ve.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${e=>{switch(e.$status){case"connected":return"#10b981";case"disconnected":return"#ef4444";case"pending":return"#f59e0b";default:return"#ffffff"}}};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,_r=ve.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${e=>e.$active?e.$color:"#6b7280"};
  box-shadow: ${e=>e.$active?`0 0 8px ${e.$color}`:"none"};
  animation: ${e=>e.$active?"pulse 2s infinite":"none"};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`,Nr=ve.div`
  background: #000000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 2px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
  text-align: center;
`,Mr=ve.div`
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin: 1rem 0;
  border: 2px solid #e5e7eb;
`,qr=ve.div`
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`,Br=ve.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`,Lr=ve.div`
  display: inline-block;
  padding: 1rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`,Vr=ve.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
`,Wr=ve.button`
  background: ${e=>"primary"===e.$variant?"#3b82f6":"#6b7280"};
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`,Hr=ve.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-top: 1rem;
  text-align: center;
  color: #ffffff;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
`,Yr=ve.div`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`,Jr=ve.div`
  font-size: 0.875rem;
  opacity: 0.9;
`,Gr=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>t.jsxs(t.Fragment,{children:[t.jsxs(zr,{children:[t.jsxs(Rr,{children:[t.jsx(Or,{children:"PlayStation"}),t.jsx(Ur,{children:"DualSense Wireless Controller"})]}),t.jsxs(Sr,{children:[t.jsxs($r,{children:[t.jsx(Ir,{children:"↑"}),t.jsx(Ir,{children:"→"}),t.jsx(Ir,{children:"↓"}),t.jsx(Ir,{children:"←"})]}),t.jsx(Rr,{children:t.jsx(Nr,{children:Ge.formatUserCode(e.userCode)})}),t.jsxs(Tr,{children:[t.jsx(Ar,{$color:"#ef4444",children:"△"}),t.jsx(Ar,{$color:"#3b82f6",children:"○"}),t.jsx(Ar,{$color:"#f59e0b",children:"□"}),t.jsx(Ar,{$color:"#10b981",children:"✕"})]})]}),t.jsxs(Pr,{children:[t.jsxs(Dr,{children:[t.jsx(Fr,{children:"Battery"}),t.jsxs(Er,{$status:"connected",children:[t.jsx(_r,{$active:!0,$color:"#10b981"}),"87% - Good"]})]}),t.jsxs(Dr,{children:[t.jsx(Fr,{children:"Connection"}),t.jsxs(Er,{$status:"authorized"===e.status?"connected":"disconnected",children:[t.jsx(_r,{$active:"authorized"===e.status,$color:"#10b981"}),"authorized"===e.status?"Connected":"Disconnected"]})]}),t.jsxs(Dr,{children:[t.jsx(Fr,{children:"Status"}),t.jsxs(Er,{$status:e.status,children:[(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})(),(()=>{switch(e.status){case"pending":return"Awaiting Authorization";case"authorized":return"Controller Connected";case"denied":return"Connection Denied";case"expired":return"Session Expired";default:return"Unknown Status"}})()]})]})]}),t.jsxs(Mr,{children:[t.jsx(qr,{children:"Connect to PlayStation Network"}),t.jsx(Br,{children:"Scan this QR code with your phone to complete setup"}),t.jsx(Lr,{children:t.jsx(n,{value:e.verificationUriComplete,size:160,bgColor:"#ffffff",fgColor:"#1f2937",level:"H",includeMargin:!0})}),t.jsxs(Vr,{children:[t.jsxs(Wr,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("SonyGameControllerDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(Wr,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("SonyGameControllerDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open App"]})]})]}),"authorized"===e.status&&t.jsxs(Hr,{children:[t.jsxs(Yr,{children:[t.jsx(s,{}),"Controller Connected Successfully!"]}),t.jsx(Jr,{children:"Your Sony DualSense controller is now connected and ready for gaming."})]})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(0, 0, 0, 0.2)",borderColor:"#333333",headerTextColor:"#ffffff"})]}),Kr=ve.div`
  background: ${({$authorized:e})=>e?"linear-gradient(135deg, #00ff88 0%, #00cc6a 50%, #00ff88 100%)":"linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"};
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px ${({$authorized:e})=>e?"#00ff88":"#e5e7eb"},
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  border: 2px solid ${({$authorized:e})=>e?"#00ff88":"#e5e7eb"};
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  color: ${({$authorized:e})=>e?"#000000":"#1f2937"};
  transition: all 0.3s ease;
  
  /* Square tablet design - white with modern styling */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1rem;
    background: ${({$authorized:e})=>e?"linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 204, 106, 0.1) 100%)":"linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)"};
    pointer-events: none;
  }
  
  /* Square logo area */
  &::after {
    content: 'SQUARE';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: ${({$authorized:e})=>e?"#000000":"#00d4aa"};
    letter-spacing: 1px;
    z-index: 3;
  }
`,Xr=ve.div`
  background: ${({$authorized:e})=>e?"linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)":"linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"};
  border: 1px solid ${({$authorized:e})=>e?"#00ff88":"#e5e7eb"};
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  color: ${({$authorized:e})=>e?"#000000":"#1f2937"};
  font-weight: 600;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
`,Zr=ve.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({$authorized:e})=>e?"#000000":"#1f2937"};
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
`,Qr=ve.div`
  font-size: 0.875rem;
  color: ${({$authorized:e})=>e?"#000000":"#6b7280"};
  font-weight: 500;
  transition: all 0.3s ease;
`,ei=ve.div`
  background: #000000;
  border: 3px solid #1f2937;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.6);
  position: relative;
  overflow: hidden;
`,ti=ve.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  right: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #374151;
`,ri=ve.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: #ffffff;
`,ii=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"#f59e0b";case"authorized":return"#10b981";case"denied":return"#ef4444";default:return"#6b7280"}}};
  color: #ffffff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,ni=ve.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
`,oi=ve.button`
  aspect-ratio: 1;
  background: ${e=>{switch(e.$type){case"number":return"linear-gradient(135deg, #374151 0%, #1f2937 100%)";case"action":return"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";case"special":return"linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}}};
  border: 2px solid #4b5563;
  border-radius: 0.5rem;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 6px 12px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`,ai=ve.div`
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 2px solid #4b5563;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(0, 0, 0, 0.5);
`,si=ve.div`
  width: 60px;
  height: 40px;
  background: #000000;
  border: 2px solid #4b5563;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 1.5rem;
`,di=ve.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 2px solid #374151;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`,ci=ve.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #374151;
  
  &:last-child {
    border-bottom: none;
  }
`,li=ve.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,pi=ve.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${e=>{switch(e.$status){case"connected":return"#10b981";case"disconnected":return"#ef4444";case"pending":return"#f59e0b";default:return"#ffffff"}}};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,mi=ve.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${e=>e.$active?e.$color:"#6b7280"};
  box-shadow: ${e=>e.$active?`0 0 8px ${e.$color}`:"none"};
  animation: ${e=>e.$active?"pulse 2s infinite":"none"};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`,ui=ve.div`
  background: #000000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 2px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
  text-align: center;
`,fi=ve.div`
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin: 1rem 0;
  border: 2px solid #e5e7eb;
`,hi=ve.div`
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`,gi=ve.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`,xi=ve.div`
  display: inline-block;
  padding: 1rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`,bi=ve.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
`,vi=ve.button`
  background: ${e=>"primary"===e.$variant?"#3b82f6":"#6b7280"};
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`,wi=ve.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-top: 1rem;
  text-align: center;
  color: #ffffff;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
`,yi=ve.div`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`,ki=ve.div`
  font-size: 0.875rem;
  opacity: 0.9;
`,ji=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>{const m=()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}},u=()=>{switch(e.status){case"pending":return"Awaiting Authorization";case"authorized":return"POS Connected";case"denied":return"Connection Denied";case"expired":return"Session Expired";default:return"Unknown Status"}},f="authorized"===e.status;return t.jsxs(t.Fragment,{children:[t.jsxs(Kr,{$authorized:f,children:[t.jsxs(Xr,{$authorized:f,children:[t.jsxs(Zr,{$authorized:f,children:[t.jsx(p,{style:{marginRight:"0.5rem"}}),"Square POS Terminal"]}),t.jsx(Qr,{$authorized:f,children:"Payment Authorization System"})]}),t.jsxs(ei,{children:[t.jsxs(ti,{children:[t.jsx(ri,{children:"Square POS"}),t.jsxs(ii,{$status:e.status,children:[m(),u()]})]}),t.jsx("div",{style:{marginTop:"2rem"},children:t.jsx(ui,{children:Ge.formatUserCode(e.userCode)})})]}),t.jsxs(ni,{children:[t.jsx(oi,{$type:"number",children:"1"}),t.jsx(oi,{$type:"number",children:"2"}),t.jsx(oi,{$type:"number",children:"3"}),t.jsx(oi,{$type:"number",children:"4"}),t.jsx(oi,{$type:"number",children:"5"}),t.jsx(oi,{$type:"number",children:"6"}),t.jsx(oi,{$type:"number",children:"7"}),t.jsx(oi,{$type:"number",children:"8"}),t.jsx(oi,{$type:"number",children:"9"}),t.jsx(oi,{$type:"special",children:"Clear"}),t.jsx(oi,{$type:"number",children:"0"}),t.jsx(oi,{$type:"special",children:"Enter"})]}),t.jsxs(ai,{children:[t.jsx(p,{}),t.jsx(si,{children:t.jsx(p,{})}),t.jsx("span",{style:{fontSize:"0.875rem",color:"#9ca3af"},children:"Card Reader Ready"})]}),t.jsxs(di,{children:[t.jsxs(ci,{children:[t.jsx(li,{children:"Network"}),t.jsxs(pi,{$status:"connected",children:[t.jsx(mi,{$active:!0,$color:"#10b981"}),"Connected"]})]}),t.jsxs(ci,{children:[t.jsx(li,{children:"Power"}),t.jsxs(pi,{children:[t.jsx(mi,{$active:!0,$color:"#10b981"}),"AC Power"]})]}),t.jsxs(ci,{children:[t.jsx(li,{children:"Status"}),t.jsxs(pi,{$status:e.status,children:[m(),u()]})]})]}),t.jsxs(fi,{children:[t.jsx(hi,{children:"Connect to Square Dashboard"}),t.jsx(gi,{children:"Scan this QR code with your phone to complete setup"}),t.jsx(xi,{children:t.jsx(n,{value:e.verificationUriComplete,size:160,bgColor:"#ffffff",fgColor:"#1f2937",level:"H",includeMargin:!0})}),t.jsxs(bi,{children:[t.jsxs(vi,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("SquarePOSDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(vi,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("SquarePOSDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open App"]})]})]}),"authorized"===e.status&&e.tokens&&t.jsxs(wi,{children:[t.jsxs(yi,{children:[t.jsx(s,{}),"POS Terminal Connected Successfully!"]}),t.jsx(ki,{children:"Your Square POS terminal is now connected and ready to process payments."})]})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(0, 0, 0, 0.2)",borderColor:"#333333",headerTextColor:"#ffffff"})]})},Ci=ve.div`
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: 1.5rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 12px solid #0f172a;
  position: relative;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  
  /* TV stand/base */
  &::after {
    content: '';
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 40px;
    background: linear-gradient(180deg, #0f172a 0%, #1f2937 100%);
    border-radius: 0 0 20px 20px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
`,zi=ve.div`
  background: ${({$showContent:e})=>e?"linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)":"#000000"};
  border: 3px solid #1f2937;
  border-radius: 0.75rem;
  padding: ${({$showContent:e})=>e?"2rem":"3rem"};
  margin-bottom: 1rem;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.6);
  position: relative;
  overflow: hidden;
`,Si=ve.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`,$i=ve.div`
  font-size: 1.5rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`,Ii=ve.div`
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,Ti=ve.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
`,Ai=ve.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${e=>e.$active?e.$color:"#6b7280"};
  box-shadow: ${e=>e.$active?`0 0 12px ${e.$color}`:"none"};
  animation: ${e=>e.$active?"pulse 2s infinite":"none"};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`,Ri=ve.div`
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin: 1rem 0;
  border: 2px solid #374151;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`,Oi=ve.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #374151;
`,Ui=ve.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`,Pi=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"#f59e0b";case"authorized":return"#10b981";case"denied":return"#ef4444";default:return"#6b7280"}}};
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Di=ve.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`,Fi=ve.div`
  aspect-ratio: 1;
  background: ${({$color:e})=>e};
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #ffffff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s ease;
  padding: 0.5rem;
  
  &:hover {
    transform: scale(1.05);
  }
`,Ei=ve.div`
  font-size: 0.7rem;
  font-weight: 600;
  margin-top: 0.25rem;
  text-align: center;
`,_i=ve.div`
  background: #000000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 2px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
  text-align: center;
`,Ni=ve.div`
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin: 1rem 0;
  border: 2px solid #e5e7eb;
`,Mi=ve.div`
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`,qi=ve.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`,Bi=ve.div`
  display: inline-block;
  padding: 1rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`,Li=ve.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
`,Vi=ve.button`
  background: ${e=>"primary"===e.$variant?"#3b82f6":"#6b7280"};
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`,Wi=ve.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-top: 1rem;
  text-align: center;
  color: #ffffff;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
`,Hi=ve.div`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`,Yi=ve.div`
  font-size: 0.875rem;
  opacity: 0.9;
`,Ji=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>t.jsxs(t.Fragment,{children:[t.jsx(Ci,{children:t.jsxs(zi,{$showContent:!0,children:[t.jsxs(Si,{children:[t.jsx($i,{children:"VIZIO"}),t.jsx(Ii,{children:"V-Series 4K"})]}),t.jsxs(Ti,{children:[t.jsx(Ai,{$active:!0,$color:"#10b981"}),t.jsx(Ai,{$active:!0,$color:"#3b82f6"}),t.jsx(Ai,{$active:"authorized"===e.status,$color:"#f59e0b"})]}),t.jsxs(Ri,{children:[t.jsxs(Oi,{children:[t.jsxs(Ui,{children:[t.jsx(m,{}),"SmartCast Home"]}),t.jsxs(Pi,{$status:e.status,children:[(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})(),(()=>{switch(e.status){case"pending":return"Awaiting Authorization";case"authorized":return"SmartCast Connected";case"denied":return"Connection Denied";case"expired":return"Session Expired";default:return"Unknown Status"}})()]})]}),t.jsx(Di,{children:[{label:"Netflix",icon:"🎬",color:"#e50914"},{label:"Disney+",icon:"🏰",color:"#113ccf"},{label:"Hulu",icon:"📺",color:"#1ce783"},{label:"Prime Video",icon:"📹",color:"#00a8e1"},{label:"YouTube TV",icon:"📺",color:"#ff0000"},{label:"Apple TV+",icon:"🍎",color:"#000000"},{label:"HBO Max",icon:"🎭",color:"#673ab7"},{label:"SmartCast",icon:"⚙️",color:"#64748b"}].map(e=>t.jsxs(Fi,{$color:e.color,children:[t.jsx("span",{style:{fontSize:"1.5rem"},children:e.icon}),t.jsx(Ei,{children:e.label})]},e.label))}),t.jsx(_i,{children:Ge.formatUserCode(e.userCode)})]}),t.jsxs(Ni,{children:[t.jsx(Mi,{children:"Connect with VIZIO SmartCast Mobile"}),t.jsx(qi,{children:"Scan this QR code with your phone to complete setup"}),t.jsx(Bi,{children:t.jsx(n,{value:e.verificationUriComplete,size:180,bgColor:"#ffffff",fgColor:"#1f2937",level:"H",includeMargin:!0})}),t.jsxs(Li,{children:[t.jsxs(Vi,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("VizioTVDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(Vi,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("VizioTVDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open App"]})]})]}),"authorized"===e.status&&e.tokens&&t.jsxs(Wi,{children:[t.jsxs(Hi,{children:[t.jsx(s,{}),"SmartCast Connected Successfully!"]}),t.jsx(Yi,{children:"Your VIZIO TV is now connected and ready to stream your favorite content."})]})]})}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(0, 0, 0, 0.2)",borderColor:"#3a3a3c",headerTextColor:"#ffffff"})]}),Gi=ve.div`
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
`,Ki=ve.div`
  text-align: center;
  margin-bottom: 3rem;
`,Xi=ve.h1`
  font-size: 2.5rem;
  font-weight: 900;
  color: #1e293b;
  margin-bottom: 1rem;
`,Zi=ve.p`
  font-size: 1.125rem;
  color: #64748b;
  max-width: 600px;
  margin: 0 auto;
`,Qi=ve.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`,en=ve.div`
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
`,tn=ve.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  text-align: center;
`,rn=ve.p`
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
  margin-bottom: 1rem;
`,nn=()=>{const[r,i]=e.useState("ring-doorbell"),n={state:{status:"pending",userCode:"ABCD-EFGH",deviceCode:"mock-device-code-12345",verificationUri:"https://example.com/device",verificationUriComplete:"https://example.com/device?user_code=ABCD-EFGH",interval:5,expiresIn:600,tokens:null},onStateUpdate:()=>{},onComplete:()=>{},onError:()=>{}},o=[{id:"ring-doorbell",name:"Ring Doorbell",description:"Smart home security device with camera and doorbell button",component:t.jsx(Cr,{...n})},{id:"vizio-tv",name:"Vizio TV",description:"Smart TV with streaming apps and SmartCast interface",component:t.jsx(Ji,{...n})},{id:"sony-controller",name:"Sony Controller",description:"PlayStation DualSense controller with gaming interface",component:t.jsx(Gr,{...n})},{id:"bose-speaker",name:"Bose Speaker",description:"Smart speaker with music apps and voice control",component:t.jsx(tr,{...n})},{id:"square-pos",name:"Square POS",description:"Point of sale terminal with payment processing",component:t.jsx(ji,{...n})},{id:"airport-kiosk",name:"Airport Kiosk",description:"Airport check-in kiosk with boarding pass interface",component:t.jsx(At,{...n})}];return t.jsxs(Gi,{children:[t.jsxs(Ki,{children:[t.jsx(Xi,{children:"Realistic Device Components Showcase"}),t.jsx(Zi,{children:"Each device is designed to look like actual hardware with authentic branding, realistic interfaces, and proper user experience patterns."})]}),t.jsx(Qi,{children:o.map(e=>t.jsxs(en,{children:[t.jsx(tn,{children:e.name}),t.jsx(rn,{children:e.description}),e.component]},e.id))})]})},on=ve.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  transition: transform 0.2s ease, background-color 0.2s ease;
  cursor: pointer;

  transform: ${e=>e.$collapsed?"rotate(0deg)":"rotate(180deg)"};

  &:hover {
    background: #2563eb;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`,an=ve.div`
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  background-color: #ffffff;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;

  ${({$variant:e})=>{switch(e){case"compact":return"\n          margin-bottom: 1rem;\n        ";case"large":return"\n          margin-bottom: 2rem;\n        ";default:return""}}}
`,sn=ve.button`
  width: 100%;
  padding: 1.25rem 1.5rem;
  ${({$theme:e})=>{switch(e){case"highlight":return"\n          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);\n          box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);\n          animation: pulse-glow 2s ease-in-out infinite;\n          \n          @keyframes pulse-glow {\n            0%, 100% {\n              box-shadow: 0 4px 20px rgba(249, 115, 22, 0.4);\n            }\n            50% {\n              box-shadow: 0 8px 30px rgba(249, 115, 22, 0.6);\n            }\n          }\n          \n          &:hover {\n            background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);\n            box-shadow: 0 6px 25px rgba(249, 115, 22, 0.5);\n          }\n          \n          &:focus {\n            outline: 2px solid #fed7aa;\n            outline-offset: 2px;\n          }\n        ";case"green":return"\n          background: linear-gradient(135deg, #10b981 0%, #059669 100%);\n          &:hover {\n            background: linear-gradient(135deg, #059669 0%, #047857 100%);\n          }\n          &:focus {\n            outline: 2px solid #d1fae5;\n            outline-offset: 2px;\n          }\n        ";case"orange":return"\n          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);\n          &:hover {\n            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);\n          }\n          &:focus {\n            outline: 2px solid #fef3c7;\n            outline-offset: 2px;\n          }\n        ";case"purple":return"\n          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);\n          &:hover {\n            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);\n          }\n          &:focus {\n            outline: 2px solid #ede9fe;\n            outline-offset: 2px;\n          }\n        ";case"yellow":return"\n          background: linear-gradient(135deg, #fde047 0%, #facc15 100%);\n          &:hover {\n            background: linear-gradient(135deg, #facc15 0%, #eab308 100%);\n          }\n          &:focus {\n            outline: 2px solid #fef9c3;\n            outline-offset: 2px;\n          }\n        ";default:return"\n          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);\n          &:hover {\n            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);\n          }\n          &:focus {\n            outline: 2px solid #dbeafe;\n            outline-offset: 2px;\n          }\n        "}}}
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  text-align: left;

  ${({$variant:e})=>{switch(e){case"compact":return"\n          padding: 1rem 1.25rem;\n          font-size: 1rem;\n        ";case"large":return"\n          padding: 1.5rem 2rem;\n          font-size: 1.25rem;\n        ";default:return""}}}
`,dn=ve.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`,cn=ve.div`
  flex: 1;
`,ln=ve.h3`
  margin: 0;
  font-weight: 600;
  line-height: 1.3;
  color: #ffffff;

  ${({$variant:e})=>{switch(e){case"compact":return"\n          font-size: 1rem;\n        ";case"large":return"\n          font-size: 1.4rem;\n        ";default:return"\n          font-size: 1.1rem;\n        "}}}
`,pn=ve.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.4;
  color: #ffffff;
`,mn=ve.div`
  padding: ${({$collapsed:e,$variant:t})=>{if(e)return"0";switch(t){case"compact":return"1rem 1.25rem";case"large":return"2rem";default:return"1.5rem"}}};
  max-height: ${({$collapsed:e})=>e?"0":"none"};
  overflow: ${({$collapsed:e})=>e?"hidden":"visible"};
  transition: ${({$collapsed:e})=>e?"all 0.3s ease":"none"};
  background: #ffffff;
  border-top: ${({$collapsed:e})=>e?"none":"1px solid #f1f5f9"};
  pointer-events: ${({$collapsed:e})=>e?"none":"auto"};
  position: relative;
  z-index: 1;
  
  /* Ensure all child elements can receive pointer events when not collapsed */
  * {
    pointer-events: ${({$collapsed:e})=>e?"none":"auto"};
  }
`,un=ve.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`,fn=({collapsed:e})=>t.jsxs("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg","aria-label":"Toggle section",children:[t.jsx("title",{children:e?"Expand":"Collapse"}),t.jsx("path",{d:e?"M6 9L12 15L18 9":"M18 15L12 9L6 15",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})]}),hn=e=>{if("string"==typeof e)return e;if(u.isValidElement(e)){return u.Children.toArray(e.props.children).map(e=>hn(e)).join("")}return Array.isArray(e)?e.map(e=>hn(e)).join(""):String(e||"")},gn=({title:r,subtitle:i,icon:n,defaultCollapsed:o=!1,showArrow:a=!0,variant:s="default",theme:d="blue",children:c,className:l,collapsed:p,onToggle:m})=>{const u="boolean"==typeof p,[f,h]=e.useState(o);e.useEffect(()=>{u||h(o)},[o,u]);const g=u?p:f,x=hn(r).replace(/\s+/g,"-").toLowerCase();return t.jsxs(an,{$variant:s,className:l,children:[t.jsxs(sn,{$variant:s,$theme:d,onClick:()=>{const e=!g;u||h(e),m?.(e)},"aria-expanded":!g,"aria-controls":`content-${x}`,children:[t.jsxs(dn,{children:[n&&t.jsx(un,{children:n}),t.jsxs(cn,{children:[t.jsx(ln,{$variant:s,children:r}),i&&t.jsx(pn,{children:i})]})]}),a&&t.jsx(on,{$collapsed:g,children:t.jsx(fn,{collapsed:g})})]}),t.jsx(mn,{$collapsed:g,$variant:s,id:`content-${x}`,"aria-labelledby":`header-${x}`,children:c})]})},xn=gn,bn=ve.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
`,vn=ve.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
`,wn=ve.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid ${({$selected:e,$added:t})=>t||e?"#dc2626":"#d1d5db"};
  border-radius: 0.5rem;
  background-color: ${({$selected:e,$added:t})=>t||e?"#fef2f2":"white"};
  color: ${({$selected:e,$added:t})=>t||e?"#dc2626":"#374151"};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #dc2626;
    background-color: #fef2f2;
    color: #dc2626;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f9fafb;
    color: #9ca3af;
    border-color: #e5e7eb;
  }
`,yn=ve.div`
  display: grid;
  grid-template-columns: repeat(${({$columns:e})=>e}, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`,kn=ve($e)`
  border: 2px solid ${({theme:e})=>e.colors.gray200};
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${({theme:e})=>e.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`,jn=ve.div`
  text-align: center;
  margin-bottom: 1.5rem;
  
  .flow-icon {
    font-size: 2.5rem;
    color: ${({theme:e})=>e.colors.primary};
    margin-bottom: 1rem;
  }
  
  .flow-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${({theme:e})=>e.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  .flow-description {
    color: ${({theme:e})=>e.colors.gray600};
    font-size: 0.875rem;
    line-height: 1.5;
  }
`,Cn=ve.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({theme:e})=>e.colors.gray700};
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`,zn=ve.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
`,Sn=ve.div`
  text-align: center;
  padding: 0.75rem;
  background-color: ${({theme:e})=>e.colors.gray50};
  border-radius: 0.5rem;
  
  .metric-label {
    font-size: 0.75rem;
    color: ${({theme:e})=>e.colors.gray600};
    margin-bottom: 0.25rem;
  }
  
  .metric-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({theme:e})=>e.colors.gray900};
  }
`,$n=ve.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
  
  ${({$level:e})=>{switch(e){case"high":return"\n          background-color: #dcfce7;\n          color: #166534;\n        ";case"medium":return"\n          background-color: #fef3c7;\n          color: #92400e;\n        ";case"low":return"\n          background-color: #fee2e2;\n          color: #991b1b;\n        ";default:return"\n          background-color: #f3f4f6;\n          color: #374151;\n        "}}}
`,In=ve.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
  
  ${({$level:e})=>{switch(e){case"low":return"\n          background-color: #dcfce7;\n          color: #166534;\n        ";case"medium":return"\n          background-color: #fef3c7;\n          color: #92400e;\n        ";case"high":return"\n          background-color: #fee2e2;\n          color: #991b1b;\n        ";default:return"\n          background-color: #f3f4f6;\n          color: #374151;\n        "}}}
`,Tn=ve.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem 0;
    font-size: 0.875rem;
    line-height: 1.4;
    
    .pros-icon {
      color: ${({theme:e})=>e.colors.success};
      font-size: 1rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
    
    .cons-icon {
      color: ${({theme:e})=>e.colors.error};
      font-size: 1rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
  }
`,An=ve.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  .use-case {
    padding: 0.25rem 0.75rem;
    background-color: ${({theme:e})=>e.colors.primary}10;
    color: ${({theme:e})=>e.colors.primary};
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
`,Rn=ve(j)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #dc2626;
  color: white !important;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
  border: 2px solid #dc2626;
  
  &:hover {
    background-color: #b91c1c;
    border-color: #b91c1c;
    color: white !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.3);
  }
`,On=ve.div`
  text-align: center;
  padding: 3rem;
  color: ${({theme:e})=>e.colors.gray500};
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 1rem;
    line-height: 1.5;
  }
`,Un=[{id:"oauth-authz-code-v5",title:"OAuth 2.0 Authorization Code V5",description:"Modern OAuth 2.0 Authorization Code flow with PKCE, comprehensive token management, and educational features",icon:t.jsx(w,{}),security:"high",complexity:"medium",implementationTime:"2-4 hours",useCases:["Web applications","SPAs with backend","Mobile apps","Production integrations"],pros:["PKCE support for enhanced security","Refresh token management","Comprehensive token introspection","Educational step-by-step guidance","Real PingOne integration"],cons:["Requires backend token endpoint","More complex than implicit flow"],route:"/flows/oauth-authorization-code-v5",recommended:!0},{id:"oidc-authz-code-v5",title:"OIDC Authorization Code V5",description:"OpenID Connect Authorization Code flow with ID token validation, user claims, and profile management",icon:t.jsx(v,{}),security:"high",complexity:"medium",implementationTime:"2-4 hours",useCases:["User authentication","Profile management","Identity verification","Single Sign-On (SSO)"],pros:["ID token validation and parsing","UserInfo endpoint integration","Custom claim handling","JWT signature verification","Complete user profile access"],cons:["Requires OIDC configuration","More complex than OAuth-only flows"],route:"/flows/oidc-authorization-code-v5",recommended:!0},{id:"oauth-implicit-v5",title:"OAuth 2.0 Implicit Flow V5",description:"Legacy implicit flow for educational purposes and understanding security considerations",icon:t.jsx(y,{}),security:"low",complexity:"low",implementationTime:"1-2 hours",useCases:["Educational purposes","Understanding legacy flows","Security comparison"],pros:["Simple implementation","No backend required","Direct token access","Good for learning OAuth concepts"],cons:["Deprecated by OAuth 2.1","No refresh tokens","Tokens in URL fragment","Security vulnerabilities"],route:"/flows/oauth-implicit-v5",recommended:!1},{id:"oidc-hybrid-v5",title:"OIDC Hybrid Flow V5",description:"Advanced OpenID Connect flow combining authorization code with implicit flow",icon:t.jsx(v,{}),security:"high",complexity:"high",implementationTime:"4-6 hours",useCases:["High-security applications","Enterprise SSO","Advanced identity scenarios"],pros:["Maximum security","Multiple token types","Flexible response modes","Enterprise-ready"],cons:["Very complex","Long implementation time","Overkill for most applications"],route:"/flows/oidc-hybrid-v5",recommended:!1},{id:"client-credentials-v5",title:"Client Credentials Flow V5",description:"Machine-to-machine authentication for server-to-server communication",icon:t.jsx(r,{}),security:"high",complexity:"low",implementationTime:"1-2 hours",useCases:["Server-to-Server","Background Processes","API Services","Microservices"],pros:["Simple implementation","No user interaction required","Perfect for APIs","Fast authentication","No redirects needed"],cons:["No user context","Limited to machine access","Requires client credentials"],route:"/flows/client-credentials-v5",recommended:!0},{id:"device-code-v5",title:"OIDC Device Code Flow V5",description:"For devices with limited input capabilities like smart TVs and IoT devices",icon:t.jsx(k,{}),security:"medium",complexity:"medium",implementationTime:"3-5 hours",useCases:["Smart TVs","IoT Devices","Gaming Consoles","Limited input devices"],pros:["Works on limited devices","User-friendly for TVs","Secure authentication","No complex UI required"],cons:["More complex flow","Requires polling","User must have another device"],route:"/flows/oidc-device-authorization-v6",recommended:!1},{id:"redirectless-v5",title:"Redirectless Flow V5",description:"PingOne-specific flow using pi.flow response mode for seamless authentication",icon:t.jsx(w,{}),security:"high",complexity:"medium",implementationTime:"2-3 hours",useCases:["PingOne integrations","Seamless authentication","Advanced scenarios"],pros:["No redirects required","Direct token response","PingOne-specific features","Enhanced user experience"],cons:["PingOne-specific","Limited to PingOne platform","Newer flow type"],route:"/flows/redirectless-v5",recommended:!1}],Pn=()=>{const[i,n]=e.useState([]),o=Un.filter(e=>i.includes(e.id)),d=e=>{try{if(!e.route||"/dashboard"===e.route)return"/dashboard";const t=ye.loadAuthzFlowCredentials();if(t.environmentId||t.clientId){const r=new URLSearchParams;if(t.environmentId&&r.set("env",t.environmentId),t.clientId&&r.set("client",t.clientId),t.scopes&&t.scopes.length>0){const e=Array.isArray(t.scopes)?t.scopes.join(" "):t.scopes;r.set("scope",e)}t.redirectUri&&r.set("redirect",t.redirectUri);const i=r.toString();return i?`${e.route}?${i}`:e.route}return e.route}catch(t){return"/dashboard"}};return t.jsxs(bn,{children:[t.jsx(gn,{title:"Flow Selection",subtitle:"Choose up to 4 OAuth flows to compare side by side",icon:t.jsx(x,{}),defaultCollapsed:!1,children:t.jsx(vn,{children:Un.map(e=>t.jsxs(wn,{$selected:i.includes(e.id),$added:i.includes(e.id),onClick:()=>{return t=e.id,void n(e=>e.includes(t)?e.filter(e=>e!==t):e.length<4?[...e,t]:e);var t},disabled:!i.includes(e.id)&&i.length>=4,children:[i.includes(e.id)?t.jsx(f,{}):t.jsx(h,{}),e.icon,e.title,e.recommended&&t.jsx(g,{})]},e.id))})}),0===o.length?t.jsx(gn,{title:"Get Started",subtitle:"Select flows from above to begin comparison",icon:t.jsx(b,{}),defaultCollapsed:!1,children:t.jsxs(On,{children:[t.jsx("div",{className:"empty-icon",children:t.jsx(x,{})}),t.jsx("h3",{children:"Select Flows to Compare"}),t.jsx("p",{children:"Choose up to 4 OAuth flows from the options above to see a detailed comparison of their features, security levels, and use cases."})]})}):t.jsx(gn,{title:"Flow Comparison",subtitle:`Comparing ${i.length} OAuth flow${i.length>1?"s":""} side by side`,icon:t.jsx(b,{}),defaultCollapsed:!1,children:t.jsx(yn,{$columns:o.length,children:o.map(e=>t.jsxs(kn,{children:[t.jsx(ze,{children:t.jsxs(jn,{children:[t.jsx("div",{className:"flow-icon",children:e.icon}),t.jsx("h3",{className:"flow-title",children:e.title}),t.jsx("p",{className:"flow-description",children:e.description}),e.recommended&&t.jsx("div",{style:{marginTop:"0.5rem"},children:t.jsxs("span",{style:{display:"inline-flex",alignItems:"center",gap:"0.25rem",padding:"0.25rem 0.75rem",backgroundColor:"#dbeafe",color:"#1e40af",borderRadius:"1rem",fontSize:"0.75rem",fontWeight:"500"},children:[t.jsx(g,{}),"Recommended"]})})]})}),t.jsxs(Se,{children:[t.jsxs(Cn,{children:[t.jsxs("h4",{children:[t.jsx(v,{}),"Security & Complexity"]}),t.jsxs(zn,{children:[t.jsxs(Sn,{children:[t.jsx("div",{className:"metric-label",children:"Security"}),t.jsx("div",{className:"metric-value",children:t.jsx($n,{$level:e.security,children:e.security})})]}),t.jsxs(Sn,{children:[t.jsx("div",{className:"metric-label",children:"Complexity"}),t.jsx("div",{className:"metric-value",children:t.jsx(In,{$level:e.complexity,children:e.complexity})})]}),t.jsxs(Sn,{children:[t.jsx("div",{className:"metric-label",children:"Time"}),t.jsx("div",{className:"metric-value",children:e.implementationTime})]})]})]}),t.jsxs(Cn,{children:[t.jsxs("h4",{children:[t.jsx(s,{}),"Pros"]}),t.jsx(Tn,{children:e.pros.map((e,r)=>t.jsxs("li",{children:[t.jsx(s,{className:"pros-icon"}),e]},r))})]}),t.jsxs(Cn,{children:[t.jsxs("h4",{children:[t.jsx(c,{}),"Cons"]}),t.jsx(Tn,{children:e.cons.map((e,r)=>t.jsxs("li",{children:[t.jsx(c,{className:"cons-icon"}),e]},r))})]}),t.jsxs(Cn,{children:[t.jsxs("h4",{children:[t.jsx(r,{}),"Use Cases"]}),t.jsx(An,{children:e.useCases.map((e,r)=>t.jsx("span",{className:"use-case",children:e},r))})]}),t.jsxs(Rn,{to:d(e),children:[t.jsx(a,{}),"Try This Flow"]})]})]},e.id))})})]})},Dn=ve.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
`,Fn=ve.div`
  margin-bottom: 3rem;
`,En=ve.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
`,_n=()=>t.jsxs(Dn,{children:[t.jsx("h1",{style:{textAlign:"center",marginBottom:"3rem",color:"#1f2937"},children:"V5 Flow Header Standardization Demo"}),t.jsxs(Fn,{children:[t.jsx(En,{children:"OAuth 2.0 V5 Flows (Blue Theme)"}),t.jsx(Ie,{flowId:"oauth-authorization-code-v5"}),t.jsx(Ie,{flowId:"oauth-implicit-v5"}),t.jsx(Ie,{flowId:"client-credentials-v5"}),t.jsx(Ie,{flowId:"device-authorization-v5"})]}),t.jsxs(Fn,{children:[t.jsx(En,{children:"OIDC V5 Flows (Green Theme)"}),t.jsx(Ie,{flowId:"oidc-authorization-code-v5"}),t.jsx(Ie,{flowId:"oidc-implicit-v5"}),t.jsx(Ie,{flowId:"oidc-client-credentials-v5"}),t.jsx(Ie,{flowId:"hybrid-v5"}),t.jsx(Ie,{flowId:"oidc-device-authorization-v5"})]}),t.jsxs(Fn,{children:[t.jsx(En,{children:"PingOne Token Flows (Orange Theme)"}),t.jsx(Ie,{flowId:"worker-token-v5"}),t.jsx(Ie,{flowId:"pingone-par-v5"}),t.jsx(Ie,{flowId:"redirectless-flow-v5"})]}),t.jsxs(Fn,{children:[t.jsx(En,{children:"Custom Configuration Example"}),t.jsx(Ie,{flowId:"oauth-authorization-code-v5",customConfig:{subtitle:"This is a custom subtitle showing how you can override the default description for specific implementations or use cases."}})]}),t.jsxs(Fn,{children:[t.jsx(En,{children:"Usage Examples"}),t.jsxs("div",{style:{background:"#1f2937",color:"#f9fafb",padding:"1.5rem",borderRadius:"8px",fontFamily:"Monaco, Consolas, monospace",fontSize:"0.875rem",lineHeight:"1.6"},children:[t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("div",{style:{color:"#10b981",marginBottom:"0.5rem"},children:"// Basic Usage:"}),t.jsx("div",{children:'<FlowHeader flowId="oauth-authorization-code-v5" />'})]}),t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("div",{style:{color:"#10b981",marginBottom:"0.5rem"},children:"// With Custom Configuration:"}),t.jsx("div",{children:"<FlowHeader"}),t.jsx("div",{children:'  flowId="client-credentials-v5"'}),t.jsx("div",{children:"  customConfig={{"}),t.jsx("div",{children:'    subtitle: "Custom description for this flow"'}),t.jsx("div",{children:"  }}"}),t.jsx("div",{children:"/>"})]}),t.jsxs("div",{children:[t.jsx("div",{style:{color:"#10b981",marginBottom:"0.5rem"},children:"// Import:"}),t.jsx("div",{children:"import { FlowHeader } from '../services/flowHeaderService';"})]})]})]}),t.jsxs(Fn,{children:[t.jsx(En,{children:"Before vs After Comparison"}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2rem"},children:[t.jsxs("div",{children:[t.jsx("h3",{style:{color:"#dc2626",marginBottom:"1rem"},children:"❌ Before (Inconsistent)"}),t.jsxs("div",{style:{background:"#fee2e2",padding:"1rem",borderRadius:"8px",fontFamily:"Monaco, Consolas, monospace",fontSize:"0.75rem"},children:[t.jsx("div",{children:"<Header>"}),t.jsx("div",{children:"  <Badge>🔑 Client Credentials Flow V5</Badge>"}),t.jsx("div",{children:"  <MainTitle>"}),t.jsx("div",{children:"    <FiLock />"}),t.jsx("div",{children:"    Client Credentials Flow"}),t.jsx("div",{children:"  </MainTitle>"}),t.jsx("div",{children:"  <Subtitle>"}),t.jsx("div",{children:"    Secure server-to-server authentication..."}),t.jsx("div",{children:"  </Subtitle>"}),t.jsx("div",{children:"</Header>"})]})]}),t.jsxs("div",{children:[t.jsx("h3",{style:{color:"#059669",marginBottom:"1rem"},children:"✅ After (Standardized)"}),t.jsx("div",{style:{background:"#dcfce7",padding:"1rem",borderRadius:"8px",fontFamily:"Monaco, Consolas, monospace",fontSize:"0.75rem"},children:t.jsx("div",{children:'<FlowHeader flowId="client-credentials-v5" />'})})]})]})]})]}),Nn=ve.div`
  max-width: 100vw;
  margin: 0 auto;
  padding: 1rem;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`,Mn=ve.div`
  text-align: center;
  margin-bottom: 1rem;
  flex-shrink: 0;
  
  h1 {
    font-size: 1.8rem;
    font-weight: 700;
    color: #1e40af;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #3b82f6, #22c55e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    color: #6b7280;
    font-size: 1rem;
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.4;
  }
`,qn=ve.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  justify-content: center;
  flex-shrink: 0;
`,Bn=ve.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 2px solid ${({$selected:e})=>e?"#3b82f6":"#e5e7eb"};
  border-radius: 0.5rem;
  background: ${({$selected:e})=>e?"linear-gradient(135deg, #dbeafe, #bfdbfe)":"white"};
  color: ${({$selected:e})=>e?"#1e40af":"#374151"};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${({$selected:e})=>e?"0 4px 6px rgba(59, 130, 246, 0.2)":"0 2px 4px rgba(0, 0, 0, 0.1)"};
  
  &:hover {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }
`,Ln=ve.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  justify-content: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
`,Vn=ve.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid ${({$variant:e,theme:t})=>"primary"===e?t.colors.primary:t.colors.gray300};
  border-radius: 0.5rem;
  background-color: ${({$variant:e,theme:t})=>"primary"===e?t.colors.primary:"white"};
  color: ${({$variant:e,theme:t})=>"primary"===e?"white":t.colors.gray700};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({$variant:e,theme:t})=>"primary"===e?t.colors.primaryDark:t.colors.gray100};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,Wn=ve.div`
  position: relative;
  flex: 1;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 1rem;
  padding: 1rem;
  overflow: hidden;
  display: flex;
  align-items: stretch;
`,Hn=ve.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  min-width: 0;
  
  &:not(:last-child) {
    margin-right: 1rem;
  }
`,Yn=ve.div`
  width: 100%;
  padding: 1rem;
  background: ${({$actor:e})=>{switch(e){case"user":return"linear-gradient(135deg, #dbeafe, #bfdbfe)";case"client":return"linear-gradient(135deg, #d1fae5, #a7f3d0)";case"auth-server":return"linear-gradient(135deg, #fef3c7, #fde68a)";case"server":return"linear-gradient(135deg, #e9d5ff, #ddd6fe)";default:return"white"}}};
  border: 2px solid ${({$actor:e})=>{switch(e){case"user":return"#3b82f6";case"client":return"#10b981";case"auth-server":return"#f59e0b";case"server":return"#22c55e";default:return"#e5e7eb"}}};
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
  
  .actor-icon {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: ${({$actor:e})=>{switch(e){case"user":return"#1e40af";case"client":return"#065f46";case"auth-server":return"#92400e";case"server":return"#5b21b6";default:return"#6b7280"}}};
  }
  
  .actor-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: ${({$actor:e})=>{switch(e){case"user":return"#1e40af";case"client":return"#065f46";case"auth-server":return"#92400e";case"server":return"#5b21b6";default:return"#374151"}}};
    margin-bottom: 0.25rem;
  }
  
  .actor-description {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.3;
  }
`,Jn=ve.div`
  width: 100%;
  padding: 1rem;
  background: ${({$status:e})=>{switch(e){case"active":return"linear-gradient(135deg, #dbeafe, #bfdbfe)";case"completed":return"linear-gradient(135deg, #d1fae5, #a7f3d0)";case"error":return"linear-gradient(135deg, #fee2e2, #fecaca)";default:return"white"}}};
  border: 2px solid ${({$status:e})=>{switch(e){case"active":return"#3b82f6";case"completed":return"#10b981";case"error":return"#ef4444";default:return"#e5e7eb"}}};
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  opacity: ${({$status:e})=>"pending"===e?.6:1};
  transform: ${({$status:e})=>"active"===e?"scale(1.02)":"scale(1)"};
  transition: all 0.3s ease;
  animation-delay: ${({$delay:e})=>e}ms;
  box-shadow: ${({$status:e})=>"active"===e?"0 4px 12px rgba(59, 130, 246, 0.3)":"0 2px 6px rgba(0, 0, 0, 0.1)"};
  
  .step-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: ${({$status:e})=>{switch(e){case"active":return"#1e40af";case"completed":return"#065f46";case"error":return"#991b1b";default:return"#374151"}}};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .step-description {
    font-size: 0.8rem;
    color: #4b5563;
    line-height: 1.4;
    margin-bottom: 0.5rem;
  }

  .step-explanation {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.3;
    font-style: italic;
    background: rgba(255, 255, 255, 0.6);
    padding: 0.5rem;
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
    border-left: 3px solid ${({$status:e})=>{switch(e){case"active":return"#3b82f6";case"completed":return"#10b981";case"error":return"#ef4444";default:return"#d1d5db"}}};
  }
  
  .step-data {
    font-size: 0.7rem;
    color: #1f2937;
    font-family: 'Monaco', 'Menlo', monospace;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 0.75rem;
    border-radius: 0.375rem;
    margin-top: 0.5rem;
    word-break: break-all;
    white-space: pre-wrap;
    line-height: 1.4;
  }
`,Gn=ve.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 500;
  
  ${({$status:e})=>{switch(e){case"active":return"\n          background-color: #dbeafe;\n          color: #1e40af;\n        ";case"completed":return"\n          background-color: #dcfce7;\n          color: #166534;\n        ";case"error":return"\n          background-color: #fee2e2;\n          color: #991b1b;\n        ";default:return"\n          background-color: #f3f4f6;\n          color: #374151;\n        "}}}
`,Kn=[{id:"authorization-code",title:"Authorization Code Flow",description:"The most secure OAuth flow for web applications",steps:[{id:"1",title:"Authorization Request",description:"User clicks login, client redirects to auth server",explanation:"The user initiates the login process. The client application redirects the user to PingOne with the necessary parameters including client_id, redirect_uri, and scope.",actor:"user",action:"Clicks login button",data:"https://auth.pingone.com/oauth/authorize?client_id=abc&redirect_uri=...&scope=openid profile",duration:1e3,status:"pending"},{id:"2",title:"User Authentication",description:"User enters credentials on auth server",explanation:"The user is presented with PingOne's login form. They enter their username and password, which PingOne validates against their identity store.",actor:"auth-server",action:"Validates user credentials",data:"Username: user@example.com, Password: ",duration:1500,status:"pending"},{id:"3",title:"Authorization Code",description:"Auth server redirects back with authorization code",explanation:"After successful authentication, PingOne generates a short-lived authorization code and redirects the user back to the client application with this code.",actor:"auth-server",action:"Redirects with code",data:"https://app.example.com/callback?code=abc123&state=xyz",duration:1e3,status:"pending"},{id:"4",title:"Token Exchange",description:"Client exchanges code for access token",explanation:"The client application makes a secure server-to-server request to PingOne, exchanging the authorization code for an access token. This happens behind the scenes.",actor:"client",action:"POST /token with code",data:"POST /oauth/token\nAuthorization: Basic abc123\nBody: grant_type=authorization_code&code=abc123",duration:1500,status:"pending"},{id:"5",title:"Access Token",description:"Auth server returns access token",explanation:"PingOne validates the authorization code and client credentials, then returns an access token (and optionally a refresh token) to the client application.",actor:"auth-server",action:"Returns tokens",data:'{\n  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",\n  "refresh_token": "def456",\n  "expires_in": 3600\n}',duration:1e3,status:"pending"},{id:"6",title:"API Access",description:"Client uses access token to call protected API",explanation:"The client application can now use the access token to make authenticated requests to protected APIs. The token is included in the Authorization header.",actor:"client",action:"GET /api/user with token",data:"GET /api/user\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",duration:1e3,status:"pending"}]},{id:"implicit",title:"Implicit Flow",description:"Simplified flow for single-page applications",steps:[{id:"1",title:"Authorization Request",description:"User clicks login, client redirects to auth server",explanation:"The user initiates login. The client redirects to PingOne with response_type=token (instead of code) to request the access token directly.",actor:"user",action:"Clicks login button",data:"https://auth.pingone.com/oauth/authorize?response_type=token&client_id=abc...",duration:1e3,status:"pending"},{id:"2",title:"User Authentication",description:"User enters credentials on auth server",explanation:"The user enters their credentials on PingOne's login form. This is the same authentication step as the Authorization Code flow.",actor:"auth-server",action:"Validates user credentials",data:"Username: user@example.com, Password: ",duration:1500,status:"pending"},{id:"3",title:"Access Token",description:"Auth server redirects back with access token",explanation:"PingOne redirects back to the client with the access token directly in the URL fragment (after #). This is less secure than the Authorization Code flow.",actor:"auth-server",action:"Redirects with token",data:"https://app.example.com/callback#access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...&token_type=Bearer&expires_in=3600",duration:1e3,status:"pending"},{id:"4",title:"API Access",description:"Client uses access token to call protected API",explanation:"The client extracts the token from the URL fragment and uses it to make authenticated API calls. The token is visible in the browser URL.",actor:"client",action:"GET /api/user with token",data:"GET /api/user\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",duration:1e3,status:"pending"}]},{id:"client-credentials",title:"Client Credentials Flow",description:"Machine-to-machine authentication without user interaction",steps:[{id:"1",title:"Token Request",description:"Client requests token using credentials",explanation:"The client application makes a direct request to PingOne using its client credentials (client_id and client_secret). No user interaction is required.",actor:"client",action:"POST /token with credentials",data:"POST /oauth/token\nAuthorization: Basic YWJjOnh5eg==\nBody: grant_type=client_credentials&scope=api:read",duration:1e3,status:"pending"},{id:"2",title:"Credential Validation",description:"Auth server validates client credentials",explanation:"PingOne validates the client_id and client_secret against its client registry. If valid, it proceeds to issue a token.",actor:"auth-server",action:"Validates client_id and client_secret",data:"Client ID: abc123\nClient Secret: \nStatus: Valid",duration:1500,status:"pending"},{id:"3",title:"Access Token",description:"Auth server returns access token",explanation:"PingOne issues an access token with the requested scope. This token can be used to access APIs on behalf of the application (not a user).",actor:"auth-server",action:"Returns access token",data:'{\n  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "scope": "api:read"\n}',duration:1e3,status:"pending"},{id:"4",title:"API Access",description:"Client uses token to access protected resources",explanation:"The client uses the access token to make API calls. This is typically used for machine-to-machine communication or accessing application-specific resources.",actor:"client",action:"GET /api/data with token",data:"GET /api/v1/data\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",duration:1e3,status:"pending"}]},{id:"device-code",title:"Device Code Flow",description:"For devices with limited input capabilities",steps:[{id:"1",title:"Device Authorization Request",description:"Device requests authorization from auth server",explanation:"The device (like a smart TV or IoT device) makes a request to PingOne to initiate the device authorization flow. No user credentials are needed at this stage.",actor:"client",action:"POST /device/authorize",data:"POST /oauth/device/authorize\nBody: client_id=abc123&scope=read write",duration:1e3,status:"pending"},{id:"2",title:"Device Code & User Code",description:"Auth server returns device code and user code",explanation:"PingOne generates a device_code (for the device) and a user_code (for the user). The device displays the user_code and verification URL to the user.",actor:"auth-server",action:"Returns device_code and user_code",data:'{\n  "device_code": "xyz789",\n  "user_code": "ABCD-EFGH",\n  "verification_uri": "https://auth.pingone.com/device",\n  "expires_in": 600\n}',duration:1e3,status:"pending"},{id:"3",title:"User Authentication",description:"User visits verification URL and enters user code",explanation:"The user goes to the verification URL on their phone/computer and enters the user_code. They then authenticate with their PingOne credentials.",actor:"user",action:"Goes to verification URL and enters code",data:"User Code: ABCD-EFGH\nURL: https://auth.pingone.com/device\nUsername: user@example.com",duration:2e3,status:"pending"},{id:"4",title:"User Authorization",description:"User authorizes the device on auth server",explanation:'After authentication, the user sees a consent screen asking them to authorize the device. They click "Allow" to grant access to the device.',actor:"auth-server",action:"User approves device access",data:'Device: Smart TV\nApp: Netflix\nScopes: read write\nAction: User clicks "Allow"',duration:1500,status:"pending"},{id:"5",title:"Token Polling",description:"Device polls for access token using device code",explanation:"The device repeatedly polls PingOne using the device_code to check if the user has completed authorization. This continues until the user authorizes or the code expires.",actor:"client",action:"POST /token with device_code",data:"POST /oauth/token\nBody: grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=xyz789",duration:1500,status:"pending"},{id:"6",title:"Access Token",description:"Auth server returns access token",explanation:"Once the user has authorized the device, PingOne returns an access token to the device. The device can now access protected resources on behalf of the user.",actor:"auth-server",action:"Returns access token",data:'{\n  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "scope": "read write"\n}',duration:1e3,status:"pending"},{id:"7",title:"API Access",description:"Device uses token to access protected resources",explanation:"The device can now make authenticated API calls using the access token. This enables the device to access user-specific resources like playlists or preferences.",actor:"client",action:"GET /api/data with token",data:"GET /api/v1/user/playlist\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",duration:1e3,status:"pending"}]},{id:"resource-owner-password",title:"Resource Owner Password Flow",description:"Direct username/password authentication (Not supported by PingOne)",steps:[{id:"1",title:"User Credentials",description:"User provides username and password directly to the client",explanation:"The user enters their credentials directly into the client application. This is less secure as credentials are exposed to the client.",actor:"user",action:"Enters username and password",data:"Username: user@example.com\nPassword: ",duration:1e3,status:"pending"},{id:"2",title:"Token Request",description:"Client sends credentials directly to authorization server",explanation:"The client makes a direct request to the token endpoint with the user credentials. This bypasses the authorization server UI.",actor:"client",action:"POST /token with credentials",data:"POST /oauth/token\nBody: grant_type=password&username=user@example.com&password=",duration:1500,status:"pending"},{id:"3",title:"Credential Validation",description:"Authorization server validates credentials",explanation:"The authorization server validates the username and password against its user store. This is a direct authentication without redirects.",actor:"auth-server",action:"Validates username and password",data:"Username: user@example.com\nPassword: \nStatus: Valid",duration:1500,status:"pending"},{id:"4",title:"Access Token",description:"Authorization server returns access token",explanation:"Upon successful validation, the authorization server returns an access token directly to the client.",actor:"auth-server",action:"Returns access token",data:'{\n  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "scope": "read write"\n}',duration:1e3,status:"pending"},{id:"5",title:"API Access",description:"Client uses token to access protected resources",explanation:"The client can now use the access token to make authenticated requests to protected APIs.",actor:"client",action:"GET /api/data with token",data:"GET /api/v1/user/data\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",duration:1e3,status:"pending"}]},{id:"par",title:"Pushed Authorization Request (PAR)",description:"Enhanced security flow that pushes authorization parameters to the server first",steps:[{id:"1",title:"PAR Request",description:"Client pushes authorization parameters to auth server",explanation:"The client application makes a secure request to PingOne's PAR endpoint, pushing all authorization parameters including client credentials, scopes, and redirect URI.",actor:"client",action:"POST /par with parameters",data:"POST /oauth/par\nAuthorization: Basic abc123\nBody: client_id=abc&scope=openid profile&redirect_uri=https://app.example.com/callback",duration:1500,status:"pending"},{id:"2",title:"Request URI",description:"Auth server returns a request URI",explanation:"PingOne validates the parameters and returns a short-lived request URI that contains a reference to the pushed parameters. This URI is much shorter and safer than the original parameters.",actor:"auth-server",action:"Returns request URI",data:"Request URI: urn:ietf:params:oauth:request_uri:abc123def456\nExpires in: 60 seconds",duration:1e3,status:"pending"},{id:"3",title:"Authorization Request",description:"User clicks login with request URI",explanation:"The user initiates the login process. Instead of passing all parameters in the URL, the client only needs to pass the short request URI to PingOne.",actor:"user",action:"Clicks login button",data:"https://auth.pingone.com/oauth/authorize?request_uri=urn:ietf:params:oauth:request_uri:abc123def456&response_type=code",duration:1e3,status:"pending"},{id:"4",title:"User Authentication",description:"User enters credentials on auth server",explanation:"The user is presented with PingOne's login form. They enter their username and password, which PingOne validates against their identity store.",actor:"auth-server",action:"Validates user credentials",data:"Username: user@example.com, Password: ",duration:1500,status:"pending"},{id:"5",title:"Authorization Code",description:"Auth server redirects back with authorization code",explanation:"After successful authentication, PingOne generates a short-lived authorization code and redirects the user back to the client application with this code.",actor:"auth-server",action:"Redirects with code",data:"https://app.example.com/callback?code=abc123&state=xyz",duration:1e3,status:"pending"},{id:"6",title:"Token Exchange",description:"Client exchanges code for access token",explanation:"The client application makes a secure server-to-server request to PingOne, exchanging the authorization code for an access token. This happens behind the scenes.",actor:"client",action:"POST /token with code",data:"POST /oauth/token\nAuthorization: Basic abc123\nBody: grant_type=authorization_code&code=abc123",duration:1500,status:"pending"},{id:"7",title:"Access Token",description:"Auth server returns access token",explanation:"PingOne validates the authorization code and returns an access token (and optionally a refresh token) to the client application.",actor:"auth-server",action:"Returns access token",data:"Access Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...\nToken Type: Bearer\nExpires In: 3600",duration:1e3,status:"pending"},{id:"8",title:"API Access",description:"Client uses access token to call protected API",explanation:"The client can now use the access token to make authenticated requests to protected APIs.",actor:"client",action:"GET /api/data with token",data:"GET /api/v1/user/data\nAuthorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",duration:1e3,status:"pending"}]}],Xn=()=>{const[i,n]=e.useState("authorization-code"),[o,a]=e.useState(!1),[d,c]=e.useState(0),[l,p]=e.useState([]),[u,f]=e.useState(!1),h=Kn.find(e=>e.id===i);e.useEffect(()=>{h&&(p(h.steps.map(e=>({...e,status:"pending"}))),c(0))},[h]),e.useEffect(()=>{if(!o||u)return;const e=setInterval(()=>{c(e=>e>=l.length-1?(a(!1),e):e+1)},2e3);return()=>clearInterval(e)},[o,l.length,u]),e.useEffect(()=>{p(e=>e.map((e,t)=>({...e,status:t<d?"completed":t===d?"active":"pending"})))},[d]);const g=()=>t.jsx("div",{style:{width:"24px",height:"24px",background:"#dc2626",borderRadius:"4px",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"12px",fontWeight:"bold",border:"2px solid #b91c1c"},children:"P1"}),x=e=>{switch(e){case"user":default:return t.jsx(r,{});case"client":return t.jsx(A,{});case"auth-server":return t.jsx(g,{});case"server":return t.jsx(T,{})}},w=e=>{switch(e){case"authorization-code":default:return t.jsx(I,{});case"implicit":return t.jsx(y,{});case"client-credentials":return t.jsx(A,{});case"device-code":return t.jsx(T,{});case"resource-owner-password":return t.jsx(v,{});case"par":return t.jsx(b,{})}},k=e=>{switch(e){case"user":return"User";case"client":return"Client App";case"auth-server":return"PingOne";case"server":return"Resource Server";default:return"Actor"}},j=e=>{switch(e){case"user":return"End user accessing the application";case"client":return"Your application requesting access";case"auth-server":return"PingOne Identity Platform";case"server":return"API server with protected resources";default:return"Participant in the flow"}};return t.jsxs(Nn,{children:[t.jsxs(Mn,{children:[t.jsx("h1",{children:"Interactive OAuth Flow Diagrams"}),t.jsx("p",{children:"Watch OAuth flows come to life with interactive, step-by-step animations. Select a flow and click play to see how the authentication process works."})]}),t.jsx(qn,{children:Kn.map(e=>t.jsxs(Bn,{$selected:i===e.id,onClick:()=>n(e.id),children:[w(e.id),e.title]},e.id))}),t.jsxs(Ln,{children:[t.jsxs(Vn,{onClick:()=>{f(!0),a(!1),c(Math.max(0,d-1))},disabled:0===d,children:[t.jsx(C,{style:{transform:"rotate(90deg)"}}),"Back"]}),t.jsxs(Vn,{$variant:"primary",onClick:()=>{f(!0),a(!1),c(Math.min(l.length-1,d+1))},disabled:d>=l.length-1,children:["Next",t.jsx(C,{style:{transform:"rotate(-90deg)"}})]}),t.jsx("div",{style:{width:"1px",height:"2rem",background:"#e5e7eb",margin:"0 0.5rem"}}),t.jsxs(Vn,{$variant:"primary",onClick:()=>{d>=l.length-1&&(c(0),p(e=>e.map(e=>({...e,status:"pending"})))),a(!0)},disabled:o,children:[t.jsx(m,{}),d>=l.length-1?"Restart":"Play"]}),t.jsxs(Vn,{onClick:()=>{a(!1)},disabled:!o,children:[t.jsx(z,{}),"Pause"]}),t.jsxs(Vn,{onClick:()=>{a(!1),c(0),p(e=>e.map(e=>({...e,status:"pending"})))},children:[t.jsx(S,{}),"Reset"]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",color:"#6b7280",fontSize:"0.875rem",marginLeft:"0.5rem"},children:[t.jsx(b,{}),"Step ",d+1," of ",l.length]})]}),t.jsxs(Wn,{children:[["user","client","auth-server","server"].map(e=>t.jsxs(Hn,{$actor:e,children:[t.jsxs(Yn,{$actor:e,children:[t.jsx("div",{className:"actor-icon",children:x(e)}),t.jsx("div",{className:"actor-title",children:k(e)}),t.jsx("div",{className:"actor-description",children:j(e)})]}),l.filter(t=>t.actor===e).map((e,r)=>t.jsxs(Jn,{$status:e.status,$delay:200*r,children:[t.jsxs("div",{className:"step-title",children:["active"===e.status&&t.jsx(s,{}),"completed"===e.status&&t.jsx(s,{}),"error"===e.status&&t.jsx($,{}),t.jsx("span",{style:{background:"#3b82f6",color:"white",borderRadius:"50%",width:"20px",height:"20px",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",fontWeight:"600",marginRight:"0.5rem"},children:e.id}),e.title,t.jsx(Gn,{$status:e.status,children:e.status})]}),t.jsx("div",{className:"step-description",children:e.description}),e.explanation&&t.jsx("div",{className:"step-explanation",children:e.explanation}),e.data&&t.jsx("div",{className:"step-data",children:e.data})]},e.id))]},e)),l.length>0&&t.jsxs(t.Fragment,{children:[t.jsx("div",{style:{position:"absolute",top:"50%",left:"25%",transform:"translate(-50%, -50%)",fontSize:"1.5rem",color:"#3b82f6",opacity:.7},children:t.jsx(y,{})}),t.jsx("div",{style:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",fontSize:"1.5rem",color:"#3b82f6",opacity:.7},children:t.jsx(y,{})}),t.jsx("div",{style:{position:"absolute",top:"50%",left:"75%",transform:"translate(-50%, -50%)",fontSize:"1.5rem",color:"#3b82f6",opacity:.7},children:t.jsx(y,{})})]})]})]})},Zn=ve.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,Qn=ve.div`
  margin-bottom: 2rem;
  text-align: center;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${({theme:e})=>e.colors.gray900};
    margin-bottom: 1rem;
  }
  
  p {
    color: ${({theme:e})=>e.colors.gray600};
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
`,eo=ve.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`,to=ve($e)`
  border-left: 4px solid ${({$color:e})=>e};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`,ro=ve.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  
  .category-icon {
    font-size: 2rem;
    color: ${({theme:e})=>e.colors.primary};
  }
  
  .category-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${({theme:e})=>e.colors.gray900};
    margin: 0;
  }
`,io=ve.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
  margin-bottom: 1rem;
  
  ${({$level:e})=>{switch(e){case"beginner":return"\n          background-color: #dcfce7;\n          color: #166534;\n        ";case"intermediate":return"\n          background-color: #fef3c7;\n          color: #92400e;\n        ";case"advanced":return"\n          background-color: #fee2e2;\n          color: #991b1b;\n        ";default:return"\n          background-color: #f3f4f6;\n          color: #374151;\n        "}}}
`,no=ve.div`
  margin-bottom: 1.5rem;
  
  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({theme:e})=>e.colors.gray700};
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .use-cases {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .use-case {
    padding: 0.25rem 0.75rem;
    background-color: ${({theme:e})=>e.colors.gray100};
    color: ${({theme:e})=>e.colors.gray700};
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
`,oo=ve.div`
  .flows-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: ${({theme:e})=>e.colors.gray100};
    }
    
    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: ${({theme:e})=>e.colors.gray900};
      margin: 0;
    }
    
    .flow-count {
      font-size: 0.875rem;
      color: ${({theme:e})=>e.colors.gray500};
    }
  }
  
  .flows-list {
    display: grid;
    gap: 0.75rem;
  }
`,ao=ve(j)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid ${({theme:e})=>e.colors.gray200};
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${({theme:e})=>e.colors.primary};
    background-color: ${({theme:e})=>e.colors.primary}05;
  }
  
  .flow-icon {
    font-size: 1.25rem;
    color: ${({theme:e})=>e.colors.primary};
  }
  
  .flow-content {
    flex: 1;
    
    .flow-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: ${({theme:e})=>e.colors.gray900};
      margin: 0 0 0.25rem 0;
    }
    
    .flow-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: ${({theme:e})=>e.colors.gray500};
    }
  }
  
  .flow-badges {
    display: flex;
    gap: 0.25rem;
  }
`,so=ve.span`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 500;
  border-radius: 0.25rem;
  
  ${({$level:e})=>{switch(e){case"high":return"\n          background-color: #dcfce7;\n          color: #166534;\n        ";case"medium":return"\n          background-color: #fef3c7;\n          color: #92400e;\n        ";case"low":return"\n          background-color: #fee2e2;\n          color: #991b1b;\n        ";default:return"\n          background-color: #f3f4f6;\n          color: #374151;\n        "}}}
`,co=ve.span`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 500;
  border-radius: 0.25rem;
  background-color: #dbeafe;
  color: #1e40af;
`,lo=ve.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 3rem;
  color: white;
  text-align: center;
  
  h2 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.125rem;
    margin-bottom: 2rem;
    opacity: 0.9;
  }
  
  .quick-start-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background-color: white;
    color: #667eea;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    font-size: 1.125rem;
    transition: all 0.2s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }
  }
`,po=[{id:"essential",title:"Essential Flows",description:"The most commonly used OAuth flows for modern applications",icon:t.jsx(g,{}),difficulty:"beginner",useCases:["Web Apps","Mobile Apps","SPAs","Server-to-Server"],color:"#10b981",flows:[{id:"authorization-code-v7",title:"Authorization Code Flow V7",description:"Unified OAuth/OIDC authorization code experience with enhanced features",icon:t.jsx(A,{}),security:"high",recommended:!0,complexity:"medium",implementationTime:"2-4 hours",useCases:["Web Apps","Mobile Apps","SPAs","Modern Applications"],route:"/flows/oauth-authorization-code-v7"},{id:"pkce",title:"PKCE Flow",description:"Authorization Code flow with enhanced security",icon:t.jsx(v,{}),security:"high",recommended:!0,complexity:"medium",implementationTime:"2-4 hours",useCases:["Mobile Apps","SPAs","Native Apps"],route:"/flows/pkce"},{id:"client-credentials",title:"Client Credentials",description:"Machine-to-machine authentication",icon:t.jsx(r,{}),security:"high",recommended:!0,complexity:"low",implementationTime:"1-2 hours",useCases:["Server-to-Server","Background Processes","API Services"],route:"/flows/client-credentials"},{id:"device-code",title:"Device Code Flow",description:"For devices with limited input capabilities",icon:t.jsx(k,{}),security:"medium",recommended:!0,complexity:"medium",implementationTime:"3-5 hours",useCases:["Smart TVs","IoT Devices","Gaming Consoles"],route:"/flows/device-code"}]},{id:"advanced",title:"Advanced Flows",description:"Specialized flows for specific use cases and requirements",icon:t.jsx(U,{}),difficulty:"intermediate",useCases:["IoT Devices","Smart TVs","High Security Apps"],color:"#3b82f6",flows:[{id:"hybrid",title:"Hybrid Flow",description:"Combines authorization code and implicit flows",icon:t.jsx(A,{}),security:"high",recommended:!1,complexity:"high",implementationTime:"4-6 hours",useCases:["High Security Apps","Enterprise Applications"],route:"/flows/hybrid"},{id:"jwt-bearer",title:"JWT Bearer Flow",description:"Uses JWT assertions for authentication",icon:t.jsx(v,{}),security:"high",recommended:!1,complexity:"high",implementationTime:"4-6 hours",useCases:["Enterprise SSO","Federated Identity"],route:"/flows/jwt-bearer"},{id:"worker-token",title:"Worker Token Flow",description:"Admin-level access for machine-to-machine",icon:t.jsx(r,{}),security:"high",recommended:!1,complexity:"medium",implementationTime:"2-3 hours",useCases:["Admin Operations","System Integration"],route:"/flows/worker-token"}]},{id:"legacy",title:"Legacy Flows",description:"Deprecated flows - use only for migration or legacy support",icon:t.jsx(d,{}),difficulty:"advanced",useCases:["Legacy Systems","Migration Scenarios"],color:"#ef4444",flows:[{id:"implicit",title:"Implicit Grant Flow",description:"Simplified flow for client-side applications (deprecated)",icon:t.jsx(A,{}),security:"low",recommended:!1,complexity:"low",implementationTime:"1-2 hours",useCases:["Legacy SPAs","Client-side only apps"],route:"/flows/implicit"}]},{id:"utilities",title:"Token Management",description:"Tools for managing and validating OAuth tokens",icon:t.jsx(U,{}),difficulty:"intermediate",useCases:["Token Validation","Session Management","Security Auditing"],color:"#22c55e",flows:[{id:"token-management",title:"Token Management",description:"Comprehensive token lifecycle management",icon:t.jsx(v,{}),security:"high",recommended:!0,complexity:"medium",implementationTime:"2-3 hours",useCases:["Token Validation","Session Management"],route:"/token-management"},{id:"userinfo",title:"UserInfo Flow",description:"Retrieve user information using access tokens",icon:t.jsx(r,{}),security:"high",recommended:!0,complexity:"low",implementationTime:"1-2 hours",useCases:["User Profile","User Data"],route:"/flows/userinfo"}]},{id:"pingone",title:"PingOne Flows",description:"PingOne-specific authentication and authorization flows",icon:t.jsx(v,{}),difficulty:"intermediate",useCases:["PingOne Integration","MFA Authentication","Admin Operations"],color:"#8b5cf6",flows:[{id:"mfa-v7",title:"PingOne MFA V7",description:"Enhanced Multi-Factor Authentication flow with modern services",icon:t.jsx(v,{}),security:"high",recommended:!0,complexity:"medium",implementationTime:"2-3 hours",useCases:["Enhanced Security","PingOne Integration","MFA Authentication"],route:"/flows/pingone-complete-mfa-v7"},{id:"worker-token-v7",title:"Worker Token Flow V7",description:"Enhanced PingOne admin access and management operations",icon:t.jsx(U,{}),security:"high",recommended:!0,complexity:"medium",implementationTime:"1-2 hours",useCases:["Admin Operations","PingOne Management","System Integration"],route:"/flows/worker-token-v7"}]}],mo=()=>{const[r,i]=e.useState(new Set(["essential"]));return t.jsxs(Zn,{children:[t.jsxs(Qn,{children:[t.jsx("h1",{children:"OAuth Flows"}),t.jsx("p",{children:"Choose the right OAuth flow for your application. Start with Essential Flows if you're new to OAuth, or explore Advanced Flows for specialized use cases."})]}),t.jsxs(lo,{children:[t.jsx("h2",{children:" Quick Start"}),t.jsx("p",{children:"New to OAuth? Start with the Authorization Code Flow with PKCE - it's the most secure and widely supported flow for modern applications."}),t.jsxs("div",{style:{display:"flex",gap:"1rem",justifyContent:"center",flexWrap:"wrap"},children:[t.jsxs(j,{to:"/flows/authorization-code",className:"quick-start-button",children:[t.jsx(g,{}),"Start with Authorization Code Flow"]}),t.jsxs(j,{to:"/flows/compare",className:"quick-start-button",style:{background:"rgba(255, 255, 255, 0.2)",border:"1px solid rgba(255, 255, 255, 0.3)"},children:[t.jsx(A,{}),"Compare Flows"]}),t.jsxs(j,{to:"/flows/diagrams",className:"quick-start-button",style:{background:"rgba(255, 255, 255, 0.2)",border:"1px solid rgba(255, 255, 255, 0.3)"},children:[t.jsx(y,{}),"Interactive Diagrams"]})]})]}),t.jsx(eo,{children:po.map(e=>t.jsxs(to,{$color:e.color,children:[t.jsxs(ze,{children:[t.jsxs(ro,{children:[t.jsx("div",{className:"category-icon",children:e.icon}),t.jsx("h2",{className:"category-title",children:e.title})]}),t.jsxs(io,{$level:e.difficulty,children:["beginner"===e.difficulty&&t.jsx(s,{}),"intermediate"===e.difficulty&&t.jsx(k,{}),"advanced"===e.difficulty&&t.jsx(d,{}),e.difficulty]}),t.jsx("p",{style:{color:"#6b7280",marginBottom:"1rem"},children:e.description}),t.jsxs(no,{children:[t.jsx("h4",{children:"Best for:"}),t.jsx("div",{className:"use-cases",children:e.useCases.map(e=>t.jsx("span",{className:"use-case",children:e},e))})]})]}),t.jsx(Se,{children:t.jsxs(oo,{children:[t.jsxs("div",{className:"flows-header",onClick:()=>(e=>{const t=new Set(r);t.has(e)?t.delete(e):t.add(e),i(t)})(e.id),children:[t.jsx("h3",{children:"Available Flows"}),t.jsxs("div",{className:"flow-count",children:[e.flows.length," flow",1!==e.flows.length?"s":"",r.has(e.id)?t.jsx(R,{}):t.jsx(O,{})]})]}),r.has(e.id)&&t.jsx("div",{className:"flows-list",children:e.flows.map(e=>t.jsxs(ao,{to:e.route,children:[t.jsx("div",{className:"flow-icon",children:e.icon}),t.jsxs("div",{className:"flow-content",children:[t.jsx("h4",{className:"flow-title",children:e.title}),t.jsxs("div",{className:"flow-meta",children:[t.jsx("span",{children:e.implementationTime}),t.jsx("span",{}),t.jsxs("span",{children:[e.complexity," complexity"]})]})]}),t.jsxs("div",{className:"flow-badges",children:[t.jsxs(so,{$level:e.security,children:[e.security," security"]}),e.recommended&&t.jsxs(co,{children:[t.jsx(g,{}),"Recommended"]})]})]},e.id))})]})})]},e.id))})]})},uo=ve.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
`,fo=ve.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: ${({theme:e})=>e.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({theme:e})=>e.colors.gray600};
    font-size: 1.125rem;
  }
`,ho=ve.div`
  width: 100%;
  height: 4px;
  background-color: ${({theme:e})=>e.colors.gray200};
  border-radius: 2px;
  margin-bottom: 2rem;
  overflow: hidden;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #22c55e);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
`,go=ve($e)`
  margin-bottom: 2rem;
`,xo=ve.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${({theme:e})=>e.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({theme:e})=>e.colors.gray600};
  }
`,bo=ve.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`,vo=ve.div`
  padding: 1.5rem;
  border: 2px solid ${({$selected:e,theme:t})=>e?t.colors.primary:t.colors.gray200};
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${({$selected:e,theme:t})=>e?`${t.colors.primary}05`:"white"};
  
  &:hover {
    border-color: ${({theme:e})=>e.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .option-icon {
    font-size: 2rem;
    color: ${({$selected:e,theme:t})=>e?t.colors.primary:t.colors.gray400};
    margin-bottom: 1rem;
  }
  
  .option-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: ${({theme:e})=>e.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  .option-description {
    color: ${({theme:e})=>e.colors.gray600};
    font-size: 0.875rem;
    line-height: 1.5;
  }
`,wo=ve.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .nav-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
    
    &.primary {
      background-color: ${({theme:e})=>e.colors.primary};
      color: white;
      
      &:hover {
        background-color: ${({theme:e})=>e.colors.primaryDark};
      }
    }
    
    &.secondary {
      background-color: transparent;
      color: ${({theme:e})=>e.colors.gray600};
      border: 1px solid ${({theme:e})=>e.colors.gray300};
      
      &:hover {
        background-color: ${({theme:e})=>e.colors.gray50};
      }
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`,yo=ve($e)`
  text-align: center;
  
  .results-icon {
    font-size: 4rem;
    color: ${({theme:e})=>e.colors.success};
    margin-bottom: 1rem;
  }
  
  .results-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: ${({theme:e})=>e.colors.gray900};
    margin-bottom: 1rem;
  }
  
  .results-description {
    color: ${({theme:e})=>e.colors.gray600};
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }
`,ko=ve($e)`
  margin-bottom: 1.5rem;
  border-left: 4px solid ${({theme:e})=>e.colors.primary};
  
  .recommendation-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    
    .recommendation-icon {
      font-size: 2rem;
      color: ${({theme:e})=>e.colors.primary};
    }
    
    .recommendation-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: ${({theme:e})=>e.colors.gray900};
      margin: 0;
    }
  }
  
  .recommendation-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: ${({theme:e})=>e.colors.gray600};
    }
  }
  
  .recommendation-reason {
    color: ${({theme:e})=>e.colors.gray700};
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1rem;
  }
  
  .recommendation-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-color: ${({theme:e})=>e.colors.primary};
    color: white;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
    
    &:hover {
      background-color: ${({theme:e})=>e.colors.primaryDark};
      transform: translateY(-1px);
    }
  }
`,jo=[{id:"app-type",title:"Application Type",question:"What type of application are you building?",options:[{id:"web-app",label:"Web Application",description:"Traditional web app with server-side rendering",icon:t.jsx(A,{}),value:"web-app"},{id:"spa",label:"Single Page App",description:"Client-side JavaScript application (React, Vue, Angular)",icon:t.jsx(A,{}),value:"spa"},{id:"mobile-app",label:"Mobile Application",description:"Native mobile app (iOS, Android)",icon:t.jsx(r,{}),value:"mobile-app"},{id:"server-app",label:"Server Application",description:"Backend service or API",icon:t.jsx(v,{}),value:"server-app"}]},{id:"backend",title:"Backend Support",question:"Does your application have a secure backend?",options:[{id:"has-backend",label:"Yes, I have a backend",description:"My app can securely store client secrets",icon:t.jsx(v,{}),value:"has-backend"},{id:"no-backend",label:"No backend",description:"Client-side only or public application",icon:t.jsx(A,{}),value:"no-backend"}]},{id:"security",title:"Security Requirements",question:"What level of security do you need?",options:[{id:"standard",label:"Standard Security",description:"Good security for most applications",icon:t.jsx(v,{}),value:"standard"},{id:"high",label:"High Security",description:"Maximum security for sensitive applications",icon:t.jsx(v,{}),value:"high"}]},{id:"user-interaction",title:"User Interaction",question:"Will users interact with your application?",options:[{id:"user-interaction",label:"Yes, users will log in",description:"Users need to authenticate and access their data",icon:t.jsx(r,{}),value:"user-interaction"},{id:"no-user-interaction",label:"No user interaction",description:"Machine-to-machine or automated service",icon:t.jsx(v,{}),value:"no-user-interaction"}]}],Co=({onClose:r})=>{const[i,n]=e.useState(0),[o,a]=e.useState({}),[d,c]=e.useState([]),l=()=>{n(0),a({}),c([])},p=jo[i],m=(i+1)/jo.length*100,u=void 0!==o[p.id];return d.length>0?t.jsxs(uo,{children:[t.jsxs(fo,{children:[t.jsx("h1",{children:"Flow Recommendations"}),t.jsx("p",{children:"Based on your answers, here are the best OAuth flows for your application:"})]}),t.jsx(yo,{children:t.jsxs(Se,{children:[t.jsx("div",{className:"results-icon",children:t.jsx(s,{})}),t.jsx("h2",{className:"results-title",children:"Perfect Match!"}),t.jsx("p",{className:"results-description",children:"We've analyzed your requirements and found the ideal OAuth flow for your application."}),d.map((e,r)=>t.jsx(ko,{children:t.jsxs(Se,{children:[t.jsxs("div",{className:"recommendation-header",children:[t.jsx("div",{className:"recommendation-icon",children:e.icon}),t.jsx("h3",{className:"recommendation-title",children:e.title})]}),t.jsx("p",{style:{color:"#6b7280",marginBottom:"1rem"},children:e.description}),t.jsxs("div",{className:"recommendation-meta",children:[t.jsxs("div",{className:"meta-item",children:[t.jsx(v,{}),e.security," security"]}),t.jsxs("div",{className:"meta-item",children:[t.jsx(k,{}),e.implementationTime]}),t.jsxs("div",{className:"meta-item",children:[t.jsx(g,{}),e.complexity," complexity"]})]}),t.jsxs("p",{className:"recommendation-reason",children:[t.jsx("strong",{children:"Why this flow:"})," ",e.reason]}),t.jsxs(j,{to:e.route,className:"recommendation-button",children:[t.jsx(y,{}),"Try ",e.title]})]})},e.id)),t.jsxs(wo,{children:[t.jsxs("button",{className:"nav-button secondary",onClick:l,children:[t.jsx(P,{}),"Start Over"]}),r&&t.jsxs("button",{className:"nav-button secondary",onClick:r,children:[t.jsx(D,{}),"Close"]})]})]})})]}):t.jsxs(uo,{children:[t.jsxs(fo,{children:[t.jsx("h1",{children:"Find Your OAuth Flow"}),t.jsx("p",{children:"Answer a few questions to get personalized recommendations for your application"})]}),t.jsx(ho,{children:t.jsx("div",{className:"progress-fill",style:{width:`${m}%`}})}),t.jsxs(go,{children:[t.jsx(ze,{children:t.jsxs(xo,{children:[t.jsx("h2",{children:p.title}),t.jsx("p",{children:p.question})]})}),t.jsxs(Se,{children:[t.jsx(bo,{children:p.options.map(e=>t.jsxs(vo,{$selected:o[p.id]===e.value,onClick:()=>{return t=p.id,r=e.value,void a(e=>({...e,[t]:r}));var t,r},children:[t.jsx("div",{className:"option-icon",children:e.icon}),t.jsx("h3",{className:"option-title",children:e.label}),t.jsx("p",{className:"option-description",children:e.description})]},e.id))}),t.jsxs(wo,{children:[t.jsxs("button",{className:"nav-button secondary",onClick:()=>{i>0&&n(i-1)},disabled:0===i,children:[t.jsx(P,{}),"Previous"]}),t.jsxs("span",{style:{color:"#6b7280",fontSize:"0.875rem"},children:["Step ",i+1," of ",jo.length]}),t.jsxs("button",{className:"nav-button primary",onClick:()=>{if(i<jo.length-1)n(i+1);else{const e=(e=>{const r=[];return"no-user-interaction"===e["no-user-interaction"]?r.push({id:"client-credentials",title:"Client Credentials Flow",description:"Perfect for machine-to-machine authentication without user interaction",icon:t.jsx(v,{}),security:"high",complexity:"low",implementationTime:"1-2 hours",route:"/flows/client-credentials",reason:"Since your application doesn't require user interaction, Client Credentials is the most appropriate flow for machine-to-machine authentication."}):"mobile-app"===e["app-type"]||"no-backend"===e["no-backend"]?r.push({id:"pkce",title:"PKCE Flow",description:"Authorization Code flow with enhanced security for public clients",icon:t.jsx(v,{}),security:"high",complexity:"medium",implementationTime:"2-4 hours",route:"/flows/pkce",reason:"PKCE provides the best security for mobile apps and applications without a secure backend."}):"web-app"===e["app-type"]&&"has-backend"===e["has-backend"]?r.push({id:"authorization-code",title:"Authorization Code Flow",description:"The most secure and widely supported OAuth flow",icon:t.jsx(A,{}),security:"high",complexity:"medium",implementationTime:"2-4 hours",route:"/flows/authorization-code",reason:"Authorization Code flow is the gold standard for web applications with a secure backend."}):r.push({id:"authorization-code",title:"Authorization Code Flow",description:"The most secure and widely supported OAuth flow",icon:t.jsx(A,{}),security:"high",complexity:"medium",implementationTime:"2-4 hours",route:"/flows/authorization-code",reason:"Authorization Code flow is the most versatile and secure option for most applications."}),"spa"===e["app-type"]&&"no-backend"===e["no-backend"]&&r.push({id:"implicit",title:"Implicit Grant Flow",description:"Simplified flow for client-side applications (deprecated)",icon:t.jsx(A,{}),security:"low",complexity:"low",implementationTime:"1-2 hours",route:"/flows/implicit",reason:"While deprecated, this flow is still used in some legacy SPAs. Consider migrating to PKCE."}),r})(o);c(e)}},disabled:!u,children:[i===jo.length-1?"Get Recommendations":"Next",t.jsx(y,{})]})]})]})]})]})},zo={"device-authorization":{title:"Complete Flow Sequence",steps:[{stepNumber:1,title:"Device requests device code",description:"Device calls the device authorization endpoint with client_id and scopes",technicalDetails:"POST /device_authorization",exampleDisplay:"Server responds with: device_code, user_code, verification_uri, expires_in, interval"},{stepNumber:2,title:"Display user code",description:'Device shows user_code and verification_uri to user on screen (e.g., "Visit example.com and enter code: ABCD-1234")',exampleDisplay:'Example display: "Go to https://auth.pingone.com/activate and enter: WDJB-MJHT"'},{stepNumber:3,title:"User authorizes on secondary device",description:"User visits URL on phone/computer, enters code, and authorizes the application",exampleDisplay:"User sees: \"Authorize 'Smart TV App' to access your account?\""},{stepNumber:4,title:"Device polls for tokens",description:"Device continuously polls token endpoint until user completes authorization"},{stepNumber:5,title:"Tokens received",description:"Device receives access token, ID token, and optionally refresh token"}],keyBenefits:["No browser required on the device","Secure - uses standard OAuth 2.0","User-friendly - simple code entry"]},"authorization-code":{title:"Complete Flow Sequence",steps:[{stepNumber:1,title:"Generate PKCE parameters",description:"Client generates code_verifier and code_challenge for security"},{stepNumber:2,title:"Build authorization URL",description:"Client constructs authorization URL with client_id, redirect_uri, scope, state, and code_challenge"},{stepNumber:3,title:"User authorizes",description:"User is redirected to authorization server, authenticates, and approves scopes"},{stepNumber:4,title:"Authorization code returned",description:"Authorization server redirects back to client with authorization code"},{stepNumber:5,title:"Exchange code for tokens",description:"Client exchanges authorization code and code_verifier for tokens"},{stepNumber:6,title:"Tokens received",description:"Client receives access token, ID token (OIDC), and optionally refresh token"}],keyBenefits:["Most secure flow for web and mobile apps","PKCE protects against authorization code interception","Refresh tokens enable long-lived sessions"]},implicit:{title:"Complete Flow Sequence",steps:[{stepNumber:1,title:"Build authorization URL",description:"Client constructs authorization URL with response_type=token for OAuth or response_type=id_token token for OIDC"},{stepNumber:2,title:"User authorizes",description:"User is redirected to authorization server and authenticates"},{stepNumber:3,title:"Tokens returned in URL fragment",description:"Authorization server redirects back with tokens in URL fragment (#)"},{stepNumber:4,title:"Client extracts tokens",description:"JavaScript extracts tokens from URL fragment"}],keyBenefits:["Simple - no backend token exchange required","Fast - tokens returned immediately"]},"client-credentials":{title:"Complete Flow Sequence",steps:[{stepNumber:1,title:"Client authenticates",description:"Client sends client_id and client_secret to token endpoint",technicalDetails:"POST /token with grant_type=client_credentials"},{stepNumber:2,title:"Tokens received",description:"Server validates credentials and returns access token"},{stepNumber:3,title:"Access API",description:"Client uses access token to call protected APIs"}],keyBenefits:["Server-to-server authentication","No user interaction required","Simple and efficient"]},"resource-owner-password":{title:"Complete Flow Sequence",steps:[{stepNumber:1,title:"Collect credentials",description:"Client collects username and password from user"},{stepNumber:2,title:"Exchange credentials for tokens",description:"Client sends username, password, client_id, and client_secret to token endpoint",technicalDetails:"POST /token with grant_type=password"},{stepNumber:3,title:"Tokens received",description:"Server validates credentials and returns access token and optionally refresh token"}],keyBenefits:["Legacy migration support","Direct credential exchange"]},ciba:{title:"Complete Flow Sequence",steps:[{stepNumber:1,title:"Client sends backchannel authentication request",description:"Client sends authentication request to PingOne with user identifier",technicalDetails:"POST /bc-authorize"},{stepNumber:2,title:"PingOne prompts end user",description:"PingOne sends push notification to user's registered authenticator device"},{stepNumber:3,title:"Client polls token endpoint",description:"Client polls token endpoint using auth_req_id received from backchannel request"},{stepNumber:4,title:"User approves on trusted device",description:"User approves authentication request on their mobile device"},{stepNumber:5,title:"Tokens issued",description:"Once approved, tokens are issued and returned to polling client"}],keyBenefits:["Decoupled authentication","User authenticates on trusted device","No redirect required"]},redirectless:{title:"Complete Flow Sequence",steps:[{stepNumber:1,title:"Generate PKCE parameters",description:"Client generates code_verifier and code_challenge"},{stepNumber:2,title:"Build authorization request",description:"Client constructs request with response_mode=pi.flow for embedded authentication"},{stepNumber:3,title:"Embedded authentication",description:"User authenticates within embedded iframe/webview without full redirect"},{stepNumber:4,title:"Authorization code returned",description:"Authorization code is returned via postMessage or custom URL scheme"},{stepNumber:5,title:"Exchange code for tokens",description:"Client exchanges authorization code for tokens"}],keyBenefits:["No full-page redirect","Better user experience","PingOne-specific feature"]},hybrid:{title:"Complete Flow Sequence",steps:[{stepNumber:1,title:"Build authorization URL",description:"Client constructs URL with hybrid response_type (e.g., code id_token, code token)"},{stepNumber:2,title:"User authorizes",description:"User authenticates at authorization server"},{stepNumber:3,title:"Tokens returned in URL fragment",description:"Some tokens (ID token, access token) returned immediately in URL fragment"},{stepNumber:4,title:"Exchange code for additional tokens",description:"Client exchanges authorization code for additional tokens (including refresh token)"}],keyBenefits:["Combines benefits of implicit and authorization code flows","Immediate ID token validation","Secure refresh token delivery"]},"jwt-bearer":{title:"Complete Flow Sequence",steps:[{stepNumber:1,title:"Create JWT assertion",description:"Client creates and signs JWT with client credentials"},{stepNumber:2,title:"Exchange JWT for tokens",description:"Client sends JWT assertion to token endpoint",technicalDetails:"POST /token with grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer"},{stepNumber:3,title:"Tokens received",description:"Server validates JWT and returns access token"}],keyBenefits:["Enhanced security with JWT signatures","Sophisticated authentication scenarios","No shared secrets in transit"]},"worker-token":{title:"Complete Flow Sequence",steps:[{stepNumber:1,title:"Configure worker application",description:"Set up PingOne worker application with appropriate scopes"},{stepNumber:2,title:"Request worker token",description:"Application authenticates with client credentials",technicalDetails:"POST /token with grant_type=client_credentials"},{stepNumber:3,title:"Receive worker token",description:"PingOne returns access token with management API permissions"},{stepNumber:4,title:"Call PingOne Management APIs",description:"Use worker token to manage users, applications, and configurations"}],keyBenefits:["Access to PingOne Management APIs","Automate user and application management","Server-to-server integration"]},"token-introspection":{title:"Token Introspection Flow",steps:[{stepNumber:1,title:"Prepare introspection request",description:"Client prepares token introspection request with access token",technicalDetails:"POST /introspect",exampleDisplay:"Include client credentials and token to introspect"},{stepNumber:2,title:"Send introspection request",description:"Send POST request to token introspection endpoint",technicalDetails:"Content-Type: application/x-www-form-urlencoded",exampleDisplay:"Request body: token, token_type_hint, client_id, client_secret"},{stepNumber:3,title:"Receive introspection response",description:"Server responds with token metadata and validity status",technicalDetails:"JSON response with active, scope, exp, iat, etc.",exampleDisplay:'Response: { "active": true, "scope": "read write", "exp": 1234567890 }'}],keyBenefits:["Validate token status and metadata","Check token expiration and scopes","Security and compliance monitoring"]},"token-revocation":{title:"Token Revocation Flow",steps:[{stepNumber:1,title:"Prepare revocation request",description:"Client prepares token revocation request",technicalDetails:"POST /revoke",exampleDisplay:"Include client credentials and token to revoke"},{stepNumber:2,title:"Send revocation request",description:"Send POST request to token revocation endpoint",technicalDetails:"Content-Type: application/x-www-form-urlencoded",exampleDisplay:"Request body: token, token_type_hint, client_id, client_secret"},{stepNumber:3,title:"Confirm revocation",description:"Server confirms token has been revoked",technicalDetails:"HTTP 200 OK response",exampleDisplay:"Token is now invalid and cannot be used"}],keyBenefits:["Immediately invalidate compromised tokens","Logout and session management","Security incident response"]},"user-info":{title:"UserInfo Endpoint Flow",steps:[{stepNumber:1,title:"Prepare UserInfo request",description:"Client prepares request to UserInfo endpoint with access token",technicalDetails:"GET /userinfo",exampleDisplay:"Include Authorization: Bearer <access_token> header"},{stepNumber:2,title:"Send UserInfo request",description:"Send GET request to UserInfo endpoint",technicalDetails:"Authorization: Bearer <access_token>",exampleDisplay:"Request includes valid access token in Authorization header"},{stepNumber:3,title:"Receive user profile data",description:"Server responds with user profile information",technicalDetails:"JSON response with user claims",exampleDisplay:'Response: { "sub": "user123", "name": "John Doe", "email": "john@example.com" }'}],keyBenefits:["Retrieve user profile information","Access user claims and attributes","Personalize user experience"]},rar:{title:"Rich Authorization Requests (RAR) Flow",steps:[{stepNumber:1,title:"Client prepares RAR authorization request",description:"Client constructs authorization request with authorization_details parameter containing specific permissions",technicalDetails:"GET /authorize?authorization_details=<json>",exampleDisplay:"Request includes authorization_details with type, locations, actions, and datatypes"},{stepNumber:2,title:"User reviews granular permissions",description:"Authorization server presents specific permissions to user for consent",technicalDetails:"User sees detailed permission breakdown",exampleDisplay:'User sees: "Access payment data at api.example.com/payments for initiate, status actions"'},{stepNumber:3,title:"User grants consent for specific details",description:"User approves the granular authorization details",technicalDetails:"User interaction with consent UI",exampleDisplay:'User clicks "Allow" for specific authorization details'},{stepNumber:4,title:"Authorization code returned with RAR context",description:"Server returns authorization code with RAR context preserved",technicalDetails:"Redirect to client with code and state",exampleDisplay:"Redirect: https://client.com/callback?code=abc123&state=xyz"},{stepNumber:5,title:"Client exchanges code for access token",description:"Client exchanges authorization code for access token with RAR claims",technicalDetails:"POST /token with code, client credentials",exampleDisplay:"Token response includes authorization_details as claims"},{stepNumber:6,title:"Access token contains RAR claims",description:"Access token includes authorization_details claims specifying exact permissions",technicalDetails:"JWT with authorization_details claim",exampleDisplay:'Token claims: { "authorization_details": [{ "type": "payment_initiation", ... }] }'}],keyBenefits:["Granular permission control","Reduced over-privileged access","Enhanced security through specific authorization","Better compliance with data protection regulations"]}};function So(e){const t=function(e){if(!e||"string"!=typeof e)return null;const t={"oauth-authorization-code":"authorization-code","oidc-authorization-code":"authorization-code","oauth-authorization-code-v7":"authorization-code","oidc-authorization-code-v7":"authorization-code","oauth-device-authorization":"device-authorization","oidc-device-authorization":"device-authorization","device-authorization-flow-v7":"device-authorization","oidc-device-authorization-flow-v7":"device-authorization","oauth-implicit":"implicit","oidc-implicit":"implicit","oauth-implicit-v7":"implicit","oidc-implicit-v7":"implicit"};if(t[e])return t[e];const r=e.replace(/-v\d+$/i,"");return zo[r]?r:zo[e]?e:null}(e);return t&&zo[t]||null}const $o=new class{colors={primary:"#3b82f6",primaryDark:"#1d4ed8",primaryLight:"#60a5fa",secondary:"#2563eb",white:"#ffffff",gray100:"#f3f4f6",gray200:"#e5e7eb",gray300:"#d1d5db",gray400:"#9ca3af",gray500:"#6b7280",gray600:"#4b5563",gray700:"#374151",gray800:"#1f2937",gray900:"#111827",success:"#10b981",warning:"#f59e0b",error:"#ef4444",info:"#3b82f6"};collapseIconTheme={background:`linear-gradient(135deg, ${this.colors.primary} 0%, ${this.colors.secondary} 100%)`,backgroundHover:`linear-gradient(135deg, ${this.colors.secondary} 0%, ${this.colors.primaryDark} 100%)`,color:this.colors.white,colorHover:this.colors.white,shadow:"0 4px 12px rgba(59, 130, 246, 0.3)",shadowHover:"0 6px 20px rgba(59, 130, 246, 0.4)",borderRadius:"10px",size:{width:"40px",height:"40px"},iconSize:{width:"20px",height:"20px"},fontSize:"1.2rem",transition:"all 0.3s ease",transform:{hover:"translateY(-2px)",active:"translateY(0)"}};sidebarCollapseTheme={background:this.colors.primary,backgroundHover:`${this.colors.primary}22`,color:this.colors.white,colorHover:this.colors.primaryDark,borderColor:this.colors.primary,borderColorHover:this.colors.primaryDark,shadow:`0 2px 4px ${this.colors.primary}33`,shadowHover:`0 4px 8px ${this.colors.primary}4D`,borderRadius:"6px",padding:"0.4rem",fontSize:"1.5rem",transition:"all 0.2s ease",transform:{collapsed:"rotate(-90deg)",expanded:"rotate(0deg)",hover:"scale(1.1)",active:"scale(1.05)"}};getColors(){return{...this.colors}}getColor(e){return this.colors[e]}getCollapseIconTheme(){return{...this.collapseIconTheme}}getSidebarCollapseTheme(){return{...this.sidebarCollapseTheme}}updateColors(e){this.colors={...this.colors,...e},this.updateThemesWithNewColors()}updateCollapseIconTheme(e){this.collapseIconTheme={...this.collapseIconTheme,...e}}updateSidebarCollapseTheme(e){this.sidebarCollapseTheme={...this.sidebarCollapseTheme,...e}}getCSSCustomProperties(){const e=this.getCollapseIconTheme(),t=this.getSidebarCollapseTheme();return{"--theme-primary":this.colors.primary,"--theme-primary-dark":this.colors.primaryDark,"--theme-primary-light":this.colors.primaryLight,"--theme-white":this.colors.white,"--collapse-icon-background":e.background,"--collapse-icon-background-hover":e.backgroundHover,"--collapse-icon-color":e.color,"--collapse-icon-shadow":e.shadow,"--collapse-icon-shadow-hover":e.shadowHover,"--collapse-icon-border-radius":e.borderRadius,"--collapse-icon-width":e.size.width,"--collapse-icon-height":e.size.height,"--sidebar-collapse-background":t.background,"--sidebar-collapse-background-hover":t.backgroundHover,"--sidebar-collapse-color":t.color,"--sidebar-collapse-color-hover":t.colorHover,"--sidebar-collapse-shadow":t.shadow,"--sidebar-collapse-shadow-hover":t.shadowHover,"--sidebar-collapse-border-radius":t.borderRadius}}getStyledComponentsTheme(){return{colors:this.colors,collapseIcon:this.collapseIconTheme,sidebarCollapse:this.sidebarCollapseTheme}}getCollapseIconStyles(){const e=this.getCollapseIconTheme();return`\n      width: ${e.size.width};\n      height: ${e.size.height};\n      border-radius: ${e.borderRadius};\n      background: ${e.background};\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      color: ${e.color};\n      font-size: ${e.fontSize};\n      cursor: pointer;\n      transition: ${e.transition};\n      box-shadow: ${e.shadow};\n      flex-shrink: 0;\n\n      svg {\n        width: ${e.iconSize.width};\n        height: ${e.iconSize.height};\n      }\n\n      &:hover {\n        transform: ${e.transform.hover};\n        box-shadow: ${e.shadowHover};\n        background: ${e.backgroundHover};\n        color: ${e.colorHover};\n      }\n\n      &:active {\n        transform: ${e.transform.active};\n        box-shadow: ${e.shadow};\n      }\n    `}getSidebarCollapseIconStyles(){const e=this.getSidebarCollapseTheme();return`\n      transition: ${e.transition};\n      opacity: 1;\n      font-size: ${e.fontSize};\n      color: ${e.color};\n      padding: ${e.padding};\n      border-radius: ${e.borderRadius};\n      background: ${e.background};\n      border: 2px solid ${e.borderColor};\n      box-shadow: ${e.shadow};\n      cursor: pointer;\n      \n      &:hover {\n        color: ${e.colorHover};\n        background: ${e.backgroundHover};\n        border-color: ${e.borderColorHover};\n        box-shadow: ${e.shadowHover};\n      }\n    `}updateThemesWithNewColors(){this.collapseIconTheme={...this.collapseIconTheme,background:`linear-gradient(135deg, ${this.colors.primary} 0%, ${this.colors.secondary} 100%)`,backgroundHover:`linear-gradient(135deg, ${this.colors.secondary} 0%, ${this.colors.primaryDark} 100%)`,color:this.colors.white,colorHover:this.colors.white,shadow:"0 4px 12px rgba(59, 130, 246, 0.3)",shadowHover:"0 6px 20px rgba(59, 130, 246, 0.4)"},this.sidebarCollapseTheme={...this.sidebarCollapseTheme,background:this.colors.primary,backgroundHover:`${this.colors.primary}22`,color:this.colors.white,colorHover:this.colors.primaryDark,borderColor:this.colors.primary,borderColorHover:this.colors.primaryDark,shadow:`0 2px 4px ${this.colors.primary}33`,shadowHover:`0 4px 8px ${this.colors.primary}4D`}}applyPresetTheme(e){this.updateColors({blue:{primary:"#3b82f6",primaryDark:"#1d4ed8",primaryLight:"#60a5fa",secondary:"#2563eb"},green:{primary:"#10b981",primaryDark:"#047857",primaryLight:"#34d399",secondary:"#059669"},purple:{primary:"#8b5cf6",primaryDark:"#7c3aed",primaryLight:"#a78bfa",secondary:"#7c3aed"},orange:{primary:"#f59e0b",primaryDark:"#d97706",primaryLight:"#fbbf24",secondary:"#f59e0b"}}[e])}},Io=ve.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`,To=ve.button`
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
`,Ao=ve.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,Ro=ve.span`
	${()=>$o.getCollapseIconStyles()}
	display: inline-flex;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: ${({$collapsed:e})=>e?"rotate(-90deg)":"rotate(0deg)"};

	svg {
		width: 16px;
		height: 16px;
	}
`,Oo=ve.div`
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
`,Uo=ve.div`
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 2rem;
	margin: 0;
	color: #1f2937;
`,Po=ve.ol`
	list-style: none;
	counter-reset: step-counter;
	padding: 0;
	margin: 0 0 1.5rem 0;
`,Do=ve.li`
	counter-increment: step-counter;
	margin-bottom: 1.25rem;
	padding-left: 0;
	position: relative;

	&:last-child {
		margin-bottom: 0;
	}
`,Fo=ve.span`
	display: inline-block;
	width: 2rem;
	height: 2rem;
	background: #3b82f6;
	border-radius: 50%;
	text-align: center;
	line-height: 2rem;
	font-weight: 700;
	margin-right: 0.75rem;
	font-size: 0.875rem;
	color: white;
`,Eo=ve.div`
	display: inline-block;
	vertical-align: top;
	width: calc(100% - 3rem);
`,_o=ve.strong`
	display: block;
	font-size: 1rem;
	margin-bottom: 0.25rem;
	color: #1f2937;
`,No=ve.span`
	display: block;
	font-size: 0.875rem;
	line-height: 1.5;
	color: #6b7280;
	margin-bottom: 0.25rem;
`,Mo=ve.code`
	display: block;
	background: #f3f4f6;
	padding: 0.5rem 0.75rem;
	border-radius: 6px;
	font-size: 0.8125rem;
	margin-top: 0.5rem;
	color: #dc2626;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	border: 1px solid #e5e7eb;
`,qo=ve.div`
	background: #fef3c7;
	padding: 0.75rem;
	border-radius: 6px;
	font-size: 0.8125rem;
	margin-top: 0.5rem;
	color: #92400e;
	font-style: italic;
	border-left: 3px solid #f59e0b;
`,Bo=ve.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 8px;
	padding: 1.25rem;
	margin-top: 1.5rem;
`,Lo=ve.h4`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1rem;
	font-weight: 600;
	margin: 0 0 0.75rem 0;
	color: #1f2937;

	svg {
		color: #10b981;
	}
`,Vo=ve.ul`
	list-style: none;
	padding: 0;
	margin: 0;
`,Wo=ve.li`
	font-size: 0.875rem;
	line-height: 1.6;
	color: #374151;
	margin-bottom: 0.5rem;
	padding-left: 1.5rem;
	position: relative;

	&:last-child {
		margin-bottom: 0;
	}

	&:before {
		content: '✓';
		position: absolute;
		left: 0;
		color: #10b981;
		font-weight: bold;
	}
`,Ho=({flowType:r})=>{const[i,n]=e.useState(!0),o=So(r);if(!o)return null;return t.jsxs(Io,{children:[t.jsxs(To,{onClick:()=>{n(!i)},"aria-expanded":!i,$collapsed:i,children:[t.jsxs(Ao,{children:[t.jsx(F,{}),o.title]}),t.jsx(Ro,{$collapsed:i,children:t.jsx(R,{})})]}),!i&&t.jsx(Oo,{children:t.jsxs(Uo,{children:[t.jsx(Po,{children:o.steps.map(e=>t.jsxs(Do,{children:[t.jsx(Fo,{children:e.stepNumber}),t.jsxs(Eo,{children:[t.jsx(_o,{children:e.title}),t.jsx(No,{children:e.description}),e.technicalDetails&&t.jsx(Mo,{children:e.technicalDetails}),e.exampleDisplay&&t.jsx(qo,{children:e.exampleDisplay})]})]},e.stepNumber))}),o.keyBenefits&&o.keyBenefits.length>0&&t.jsxs(Bo,{children:[t.jsxs(Lo,{children:[t.jsx(s,{}),"Key Benefits"]}),t.jsx(Vo,{children:o.keyBenefits.map((e,r)=>t.jsx(Wo,{children:e},r))})]})]})})]})},Yo=ve.div`
	min-height: 100vh;
	background: #f9fafb;
	padding: 2rem 1rem;
`,Jo=ve.div`
	max-width: 1200px;
	margin: 0 auto 2rem auto;
`,Go=ve.div`
	max-width: 800px;
	margin: 0 auto;
`,Ko=ve.div`
	background: white;
	border: 2px solid #fee2e2;
	border-radius: 1rem;
	padding: 2.5rem;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`,Xo=ve.div`
	display: flex;
	align-items: flex-start;
	gap: 1.5rem;
	margin-bottom: 2rem;
`,Zo=ve.div`
	flex-shrink: 0;
	width: 64px;
	height: 64px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fee2e2;
	border-radius: 50%;
	color: #dc2626;
	font-size: 2rem;
`,Qo=ve.div`
	flex: 1;
`,ea=ve.h1`
	font-size: 1.75rem;
	font-weight: 700;
	color: #dc2626;
	margin: 0 0 0.5rem 0;
`,ta=ve.p`
	font-size: 1.125rem;
	color: #6b7280;
	margin: 0;
	line-height: 1.6;
`,ra=ve.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1.5rem 0;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.875rem;
`,ia=ve.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`,na=ve.span`
	color: #6b7280;
	font-weight: 600;
	min-width: 140px;
`,oa=ve.span`
	color: #1f2937;
	word-break: break-all;
`,aa=ve.div`
	display: flex;
	gap: 1rem;
	margin-top: 2rem;
	flex-wrap: wrap;
`,sa=ve.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.875rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 2px solid;
	
	${({$variant:e})=>{switch(e){case"primary":return"\n\t\t\t\t\tbackground: #3b82f6;\n\t\t\t\t\tcolor: white;\n\t\t\t\t\tborder-color: #3b82f6;\n\t\t\t\t\t\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #2563eb;\n\t\t\t\t\t\tborder-color: #2563eb;\n\t\t\t\t\t\ttransform: translateY(-2px);\n\t\t\t\t\t\tbox-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\n\t\t\t\t\t}\n\t\t\t\t";case"secondary":return"\n\t\t\t\t\tbackground: white;\n\t\t\t\t\tcolor: #3b82f6;\n\t\t\t\t\tborder-color: #3b82f6;\n\t\t\t\t\t\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #eff6ff;\n\t\t\t\t\t\ttransform: translateY(-2px);\n\t\t\t\t\t}\n\t\t\t\t";default:return"\n\t\t\t\t\tbackground: transparent;\n\t\t\t\t\tcolor: #6b7280;\n\t\t\t\t\tborder-color: #d1d5db;\n\t\t\t\t\t\n\t\t\t\t\t&:hover {\n\t\t\t\t\t\tbackground: #f9fafb;\n\t\t\t\t\t\tcolor: #374151;\n\t\t\t\t\t\tborder-color: #9ca3af;\n\t\t\t\t\t}\n\t\t\t\t"}}}
	
	&:active {
		transform: translateY(0);
	}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`,da=({flowType:e,flowKey:r,currentStep:i,errorTemplate:n,errorCode:o,errorDescription:a,correlationId:s,onStartOver:d,onRetry:l,onGoToConfig:p,metadata:m})=>{const u=E(),f=_[n.icon]||c,h=()=>{l?l():window.location.reload()},g=()=>{p?p():u("/configuration")};return t.jsxs(Yo,{children:[t.jsx(Jo,{children:t.jsx(Ho,{flowType:e})}),t.jsx(Go,{children:t.jsxs(Ko,{children:[t.jsxs(Xo,{children:[t.jsx(Zo,{children:t.jsx(f,{})}),t.jsxs(Qo,{children:[t.jsx(ea,{children:n.title}),t.jsx(ta,{children:n.message})]})]}),(o||a||s)&&t.jsxs(ra,{children:[o&&t.jsxs(ia,{children:[t.jsx(na,{children:"Error Code:"}),t.jsx(oa,{children:o})]}),a&&t.jsxs(ia,{children:[t.jsx(na,{children:"Description:"}),t.jsx(oa,{children:a})]}),s&&t.jsxs(ia,{children:[t.jsx(na,{children:"Correlation ID:"}),t.jsx(oa,{children:s})]}),m&&Object.entries(m).map(([e,r])=>t.jsxs(ia,{children:[t.jsxs(na,{children:[e,":"]}),t.jsx(oa,{children:String(r)})]},e))]}),t.jsx(Te,{error:o||n.title,errorDescription:a||n.message,correlationId:s||"",onRetry:h,onGoToConfig:g}),t.jsxs(aa,{children:[t.jsxs(sa,{$variant:"primary",onClick:()=>{if(d)d();else{u(`/flows/${r}`)}},children:[t.jsx(N,{size:18}),"Start Over"]}),l&&t.jsxs(sa,{$variant:"secondary",onClick:h,children:[t.jsx(M,{size:18}),"Try Again"]}),t.jsxs(sa,{$variant:"ghost",onClick:g,children:[t.jsx(q,{size:18}),"Configuration"]})]})]})})]})},ca={invalid_client:{title:"Invalid Client Credentials",message:"There is an issue with your client ID or client secret.",suggestions:["Verify your Client ID and Client Secret in PingOne Admin are correct","Check that the application is enabled in PingOne","Ensure you're using the correct environment ID","Confirm the client secret hasn't been regenerated"],icon:"FiAlertTriangle",category:"configuration",severity:"error"},redirect_uri_mismatch:{title:"Redirect URI Mismatch",message:"The redirect URI in your request does not match the configured URI in PingOne.",suggestions:["Check redirect URI matches exactly in PingOne Admin (case-sensitive)","Ensure no trailing slashes unless configured in PingOne","Verify protocol matches (http vs https)","Check for typos or extra spaces"],icon:"FiLink",category:"configuration",severity:"error"},invalid_request:{title:"Invalid Request",message:"The authorization request is missing required parameters or contains invalid values.",suggestions:["Check that all required parameters are included","Verify parameter values are correctly formatted","Ensure response_type matches your application configuration","Check that scope values are supported by PingOne"],icon:"FiXCircle",category:"validation",severity:"error"},unauthorized_client:{title:"Unauthorized Client",message:"The client is not authorized to use this grant type or flow.",suggestions:["Check that the grant type is enabled for your application in PingOne","Verify the application type matches the flow (Web vs Native vs SPA)","Ensure the client has permission for the requested operation"],icon:"FiShield",category:"permission",severity:"error"},access_denied:{title:"Access Denied",message:"The user or authorization server denied the request.",suggestions:['The user may have clicked "Cancel" during authentication',"Check user permissions and group memberships in PingOne","Verify the user has access to the application","Review any policy configurations that might block access"],icon:"FiLock",category:"permission",severity:"warning"},authorization_code_expired:{title:"Authorization Code Expired",message:"This authorization code has already been used or has expired.",suggestions:["Authorization codes are single-use only","Start the authorization flow again to get a new code","Check for clock skew between client and server","Codes expire after 60 seconds - exchange them quickly"],icon:"FiClock",category:"expired",severity:"error"},invalid_grant:{title:"Invalid Grant",message:"The authorization code, refresh token, or credentials are invalid.",suggestions:["The authorization code may have expired or already been used","Verify the code verifier matches the code challenge (PKCE)","Check that the redirect URI matches the one used in authorization","Ensure the refresh token hasn't been revoked"],icon:"FiX",category:"token_exchange",severity:"error"},pkce_verification_failed:{title:"PKCE Verification Failed",message:"The code verifier does not match the code challenge.",suggestions:["Ensure the same code verifier is used for authorization and token exchange","Check that PKCE parameters are stored correctly across the flow","Verify the code challenge was properly generated (SHA256)","Make sure no browser refresh occurred during the flow"],icon:"FiKey",category:"token_exchange",severity:"error"},network_error:{title:"Network Error",message:"Unable to connect to the authorization server.",suggestions:["Check your internet connection","Verify the authorization server URL is correct","Check if PingOne services are operational","Try again in a few moments"],icon:"FiWifi",category:"network",severity:"error"},timeout:{title:"Request Timeout",message:"The request took too long to complete.",suggestions:["Check your internet connection speed","Try again - the server may be temporarily slow","Verify there are no network firewall issues"],icon:"FiClock",category:"network",severity:"warning"},missing_required_fields:{title:"Missing Required Fields",message:"One or more required fields are missing.",suggestions:["Fill in all required fields (Environment ID, Client ID, Client Secret)","Check that no fields contain only whitespace","Verify all credentials are entered correctly"],icon:"FiAlertCircle",category:"validation",severity:"error"},invalid_scope:{title:"Invalid Scope",message:"One or more requested scopes are not supported or allowed.",suggestions:["Check that all scope values are supported by PingOne","Verify scopes are enabled for your application","Ensure openid scope is included for OIDC flows","Remove any custom scopes that aren't configured"],icon:"FiList",category:"validation",severity:"error"},token_expired:{title:"Token Expired",message:"The access token has expired.",suggestions:["Use the refresh token to obtain a new access token","Re-authenticate if you don't have a refresh token","Check token expiration times in your implementation"],icon:"FiClock",category:"expired",severity:"warning"},invalid_token:{title:"Invalid Token",message:"The token is malformed, invalid, or has been revoked.",suggestions:["Verify the token hasn't been modified","Check that the token hasn't been revoked","Ensure the token is from the correct issuer","Re-authenticate to obtain a new token"],icon:"FiShield",category:"validation",severity:"error"},server_error:{title:"Server Error",message:"The authorization server encountered an unexpected error.",suggestions:["Try again in a few moments","Check PingOne status page for any outages","Contact support if the issue persists","Review server logs for more details"],icon:"FiServer",category:"unknown",severity:"error"},temporarily_unavailable:{title:"Service Temporarily Unavailable",message:"The authorization server is temporarily unavailable.",suggestions:["Try again in a few moments","The server may be undergoing maintenance","Check PingOne status page"],icon:"FiAlertOctagon",category:"network",severity:"warning"},authorization_pending:{title:"Authorization Pending",message:"The user hasn't completed the authorization yet.",suggestions:["Wait for the user to complete authorization","The application will continue polling","User should visit the verification URL and enter the user code"],icon:"FiClock",category:"authorization",severity:"info"},slow_down:{title:"Polling Too Fast",message:"The polling interval is too short.",suggestions:["Increase the time between polling requests","Follow the interval specified in the device authorization response"],icon:"FiPause",category:"validation",severity:"warning"},expired_token:{title:"Device Code Expired",message:"The device code has expired.",suggestions:["Start the device authorization flow again","Complete authorization faster next time","Device codes typically expire after 10 minutes"],icon:"FiClock",category:"expired",severity:"error"},client_id_is_required:{title:"Missing OAuth Credentials",message:"OAuth credentials are required to complete this flow.",suggestions:["Navigate to an OAuth flow page (e.g., /flows/oauth-authorization-code-v7)","Configure your OAuth credentials in Step 0","Do not access authorization callback URLs directly","Restart the flow from the beginning if you cleared your browser session"],icon:"FiKey",category:"configuration",severity:"error"},unknown_error:{title:"Unknown Error",message:"An unexpected error occurred.",suggestions:["Try again in a few moments","Check the console for more details","Contact support if the issue persists"],icon:"FiHelpCircle",category:"unknown",severity:"error"}},la=({errorCategory:e,title:r,description:i,details:n,oauthError:o,oauthErrorDescription:a,correlationId:s,onRetry:c,onGoToConfig:l,showDetails:p=!1,severity:m="error"})=>{const[f,h]=u.useState(p),g=e?ca[e]:null,x=r||g?.title||"An Error Occurred",v=i||g?.description||"Please check your configuration and try again.",w=g?.suggestions||[];return t.jsxs(pa,{severity:m,children:[t.jsxs(ma,{children:[t.jsx(ua,{severity:m,children:t.jsx(d,{size:20})}),t.jsx(fa,{children:x})]}),t.jsxs(ha,{children:[t.jsx(ga,{children:v}),w.length>0&&t.jsxs(xa,{children:[t.jsxs(ba,{children:[t.jsx(b,{size:14}),"Suggestions:"]}),t.jsx(va,{children:w.map((e,r)=>t.jsx(wa,{children:e},r))})]}),(o||a)&&t.jsx(ya,{children:t.jsx(Te,{error:o,errorDescription:a,correlationId:s})}),n&&t.jsxs(ka,{children:[t.jsxs(ja,{onClick:()=>h(!f),children:[t.jsx(q,{size:14}),f?"Hide":"Show"," Technical Details"]}),f&&t.jsx(Ca,{children:n})]}),s&&t.jsxs(za,{children:["Correlation ID: ",t.jsx("code",{children:s})]})]}),(c||l)&&t.jsxs(Sa,{children:[c&&t.jsx($a,{onClick:c,variant:"primary",children:"Retry"}),l&&t.jsxs($a,{onClick:l,variant:"secondary",children:[t.jsx(q,{size:16}),"Go to Configuration"]})]})]})},pa=ve.div`
  background-color: ${e=>{switch(e.severity){case"error":default:return"#fef2f2";case"warning":return"#fffbeb";case"info":return"#eff6ff"}}};
  border: 1px solid ${e=>{switch(e.severity){case"error":default:return"#fecaca";case"warning":return"#fde68a";case"info":return"#bfdbfe"}}};
  border-left: 4px solid ${e=>{switch(e.severity){case"error":default:return"#dc2626";case"warning":return"#f59e0b";case"info":return"#3b82f6"}}};
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
`,ma=ve.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`,ua=ve.div`
  color: ${e=>{switch(e.severity){case"error":default:return"#dc2626";case"warning":return"#f59e0b";case"info":return"#3b82f6"}}};
  flex-shrink: 0;
`,fa=ve.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`,ha=ve.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`,ga=ve.p`
  margin: 0;
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.5;
`,xa=ve.div`
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 0.375rem;
  padding: 0.75rem;
`,ba=ve.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`,va=ve.ul`
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.875rem;
  color: #4b5563;
`,wa=ve.li`
  margin-bottom: 0.25rem;
  line-height: 1.5;

  &:last-child {
    margin-bottom: 0;
  }
`,ya=ve.div`
  margin-top: 0.5rem;
`,ka=ve.div`
  margin-top: 0.5rem;
`,ja=ve.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;

  &:hover {
    color: #374151;
  }
`,Ca=ve.pre`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: #374151;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`,za=ve.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;

  code {
    background-color: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
`,Sa=ve.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`,$a=ve.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;

  ${e=>"primary"===e.variant?"\n    background-color: #2563eb;\n    color: white;\n    border-color: #2563eb;\n\n    &:hover {\n      background-color: #1d4ed8;\n      border-color: #1d4ed8;\n    }\n  ":"\n    background-color: white;\n    color: #374151;\n    border-color: #d1d5db;\n\n    &:hover {\n      background-color: #f9fafb;\n      border-color: #9ca3af;\n    }\n  "}
`,Ia=ve.div`
	position: fixed !important;
	left: ${({$position:e})=>e.x}px !important;
	top: ${({$position:e})=>e.y}px !important;
	background: rgba(255, 255, 255, 0.98) !important;
	backdrop-filter: blur(10px) !important;
	padding: ${({$compact:e})=>e?"0.75rem 1rem":"1.25rem 2rem"} !important;
	border-radius: ${({$compact:e})=>e?"0.75rem":"1rem"} !important;
	box-shadow: ${({$isDragging:e})=>e?"0 12px 40px rgba(0, 0, 0, 0.25)":"0 8px 32px rgba(0, 0, 0, 0.12)"} !important;
	border: 1px solid rgba(0, 0, 0, 0.08) !important;
	z-index: 1000 !important;
	display: flex !important;
	align-items: center !important;
	gap: ${({$compact:e})=>e?"0.75rem":"2rem"} !important;
	max-width: 90vw !important;
	visibility: visible !important;
	opacity: 1 !important;
	pointer-events: auto !important;
	user-select: ${({$isDragging:e})=>e?"none":"auto"} !important;
	cursor: ${({$isDragging:e})=>e?"grabbing":"move"} !important;
	transition: ${({$isDragging:e})=>e?"none":"all 0.2s ease"} !important;

	@media (max-width: 768px) {
		bottom: 1rem;
		padding: 1rem 1.5rem;
		gap: 1rem;
	}
`,Ta=ve.div`
	display: ${({$compact:e})=>e?"none":"flex"};
	align-items: center;
	gap: 0.75rem;
	padding-right: 2rem;
	border-right: 2px solid #e5e7eb;

	@media (max-width: 768px) {
		padding-right: 1rem;
	}
`,Aa=ve.div`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: ${({$active:e})=>e?"#22c55e":"#d1d5db"};
	transition: all 0.2s ease;
`,Ra=ve.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	background: #f3f4f6;
	border-radius: 4px;
	margin-right: 1rem;
	cursor: default;
	color: #6b7280;
	flex-shrink: 0;
	transition: all 0.2s ease;
	pointer-events: none;

	&:hover {
		background: #e5e7eb;
		color: #374151;
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.95);
	}
`,Oa=ve.div`
	display: flex;
	gap: ${({$compact:e})=>e?"0.5rem":"1rem"};
`,Ua=ve.button`
	display: inline-flex;
	align-items: center;
	gap: ${({$compact:e})=>e?"0.25rem":"0.5rem"};
	padding: ${({$compact:e})=>e?"0.5rem 0.75rem":"0.75rem 1.5rem"};
	border-radius: 0.625rem;
	font-size: ${({$compact:e})=>e?"0.8125rem":"0.9375rem"};
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;
	color: #ffffff;
	white-space: nowrap;

	${({$variant:e})=>"primary"===e&&"\n\t\tbackground-color: #22c55e;\n\t\tbox-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground-color: #16a34a;\n\t\t\tbox-shadow: 0 6px 16px rgba(34, 197, 94, 0.35);\n\t\t\ttransform: translateY(-1px);\n\t\t}\n\t"}

	${({$variant:e})=>"success"===e&&"\n\t\tbackground-color: #16a34a;\n\t\tbox-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground-color: #15803d;\n\t\t\tbox-shadow: 0 6px 16px rgba(22, 163, 74, 0.35);\n\t\t\ttransform: translateY(-1px);\n\t\t}\n\t"}

	${({$variant:e})=>"outline"===e&&"\n\t\tbackground-color: #f3f4f6;\n\t\tcolor: #374151;\n\t\tbox-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground-color: #e5e7eb;\n\t\t\tbox-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);\n\t\t}\n\t"}

	${({$variant:e})=>"danger"===e&&"\n\t\tbackground-color: #ef4444;\n\t\tbox-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground-color: #dc2626;\n\t\t\tbox-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);\n\t\t\ttransform: translateY(-1px);\n\t\t}\n\t"}

	${({$variant:e})=>"warning"===e&&"\n\t\tbackground-color: #f59e0b;\n\t\tbox-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);\n\t\t&:hover:not(:disabled) {\n\t\t\tbackground-color: #d97706;\n\t\t\tbox-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);\n\t\t\ttransform: translateY(-1px);\n\t\t}\n\t"}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}
`,Pa=()=>"undefined"==typeof window?{x:0,y:0}:{x:Math.max((window.innerWidth-420)/2,0),y:Math.max((window.innerHeight-160)/2,0)},Da=ve.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	background: #3b82f6;
	border: none;
	border-radius: 0.5rem;
	color: white;
	cursor: pointer;
	transition: all 0.2s ease;
	flex-shrink: 0;
	box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);

	&:hover {
		background: #2563eb;
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
	}

	&:active {
		transform: scale(0.95);
	}

	svg {
		width: 16px;
		height: 16px;
	}
`,Fa=({currentStep:r,totalSteps:i,onPrevious:n,onReset:o,onStartOver:a,onNext:d,canNavigateNext:c,isFirstStep:l,nextButtonText:p,disabledMessage:m,stepRequirements:u,onCompleteAction:f,showCompleteActionButton:h})=>{const[g,x]=e.useState(Pa),[b,v]=e.useState(!1),[w,k]=e.useState({x:0,y:0}),[j,C]=e.useState(()=>{try{return"true"===localStorage.getItem("stepper-compact-mode")}catch(e){return!1}}),z=e.useRef(null),S=e.useRef(!1);e.useEffect(()=>{if(!z.current||S.current||"undefined"==typeof window)return;const e=z.current.getBoundingClientRect(),t={x:Math.max((window.innerWidth-e.width)/2,0),y:Math.max((window.innerHeight-e.height)/2,0)};x(e=>Math.abs(e.x-t.x)<.5&&Math.abs(e.y-t.y)<.5?e:t),S.current=!0},[]),e.useEffect(()=>{try{localStorage.setItem("stepper-compact-mode",j.toString())}catch(e){}},[j]);const $=e.useCallback(e=>{if(!z.current)return;const t=z.current.getBoundingClientRect();k({x:e.clientX-t.left,y:e.clientY-t.top}),v(!0),e.preventDefault()},[]),I=e.useCallback(e=>{if(!b)return;const t=e.clientX-w.x,r=e.clientY-w.y,i=window.innerWidth-(z.current?.offsetWidth||400),n=window.innerHeight-(z.current?.offsetHeight||80);x({x:Math.max(0,Math.min(t,i)),y:Math.max(0,Math.min(r,n))})},[b,w]),T=e.useCallback(()=>{v(!1)},[]);e.useEffect(()=>(b?(document.addEventListener("mousemove",I),document.addEventListener("mouseup",T),document.body.style.userSelect="none"):(document.removeEventListener("mousemove",I),document.removeEventListener("mouseup",T),document.body.style.userSelect=""),()=>{document.removeEventListener("mousemove",I),document.removeEventListener("mouseup",T),document.body.style.userSelect=""}),[b,I,T]);const A=u?.[r],R=c?"Proceed to next step":[m||"Complete the action above to continue",A?`Requirement: ${A}`:void 0].filter(Boolean).join(" • ");return t.jsxs(Ia,{ref:z,$position:g,$isDragging:b,$compact:j,onMouseDown:$,children:[t.jsx(Ra,{children:t.jsx(B,{size:16})}),t.jsx(Da,{onClick:e=>{e.stopPropagation(),C(!j)},title:j?"Expand stepper":"Compact stepper",children:j?t.jsx(L,{}):t.jsx(V,{})}),t.jsx(Ta,{$compact:j,children:Array.from({length:i},(e,i)=>t.jsx(Aa,{$active:i<=r},i))}),t.jsxs(Oa,{$compact:j,children:[t.jsxs(Ua,{onClick:e=>{e.stopPropagation(),n()},$variant:"outline",$compact:j,disabled:l,children:[t.jsx(P,{})," ",!j&&"Previous"]}),a&&!l&&t.jsxs(Ua,{onClick:e=>{e.stopPropagation(),a()},$variant:"warning",$compact:j,title:"Go back to Step 1, clear tokens/codes but keep credentials",children:[t.jsx(W,{})," ",!j&&"Start Over"]}),t.jsxs(Ua,{onClick:e=>{e.stopPropagation(),o()},$variant:"danger",$compact:j,title:"Complete reset: clear everything and expand all sections",children:[t.jsx(H,{})," ",!j&&"Reset Flow"]}),h&&f&&t.jsx(Ua,{onClick:e=>{e.stopPropagation(),f()},$variant:"primary",$compact:j,title:"Complete the current action",children:j?t.jsx(s,{}):t.jsxs(t.Fragment,{children:[t.jsx(s,{})," Complete Action"]})}),t.jsx(Ua,{onClick:e=>{e.stopPropagation(),d()},$variant:"success",$compact:j,disabled:!c,title:R,children:j?t.jsx(y,{}):t.jsxs(t.Fragment,{children:[p||(c?"Next":"Complete above action")," ",t.jsx(y,{})]})})]})]})},Ea=ve.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  color: #1e293b;
  
  /* AI Assistant branding */
  &::before {
    content: 'AI Assistant';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6366f1;
    letter-spacing: 0.5px;
    z-index: 2;
  }
  
  /* Modern AI interface styling */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1rem;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%);
    pointer-events: none;
  }
`,_a=ve.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  color: #475569;
  font-weight: 500;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
`,Na=ve.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 0.25rem;
  letter-spacing: -0.01em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`,Ma=ve.div`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 400;
  letter-spacing: 0;
`,qa=ve.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`,Ba=ve.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${e=>e.$active?e.$color:"#374151"};
  box-shadow: ${e=>e.$active?`0 0 20px ${e.$color}`:"none"};
  animation: ${e=>e.$active?"neuralPulse 2s infinite":"none"};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${e=>e.$active?"#ffffff":"transparent"};
    animation: ${e=>e.$active?"innerPulse 1.5s infinite":"none"};
  }
  
  @keyframes neuralPulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.7; 
      transform: scale(1.1);
    }
  }
  
  @keyframes innerPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`,La=ve.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.05),
    0 2px 8px rgba(0, 0, 0, 0.1);
`,Va=ve.div`
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`,Wa=ve.div`
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #6366f1;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', 'Courier New', monospace;
  font-size: 2rem;
  font-weight: 600;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  border: 1px solid #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`,Ha=ve.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  text-align: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,Ya=ve.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`,Ja=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`,Ga=ve.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`,Ka=ve.button`
  background: ${e=>{switch(e.$variant){case"primary":return"#6366f1";case"secondary":default:return"#f8fafc";case"success":return"#10b981";case"danger":return"#ef4444"}}};
  color: ${e=>"secondary"===e.$variant?"#64748b":"white"};
  border: 1px solid ${e=>{switch(e.$variant){case"primary":return"#6366f1";case"secondary":default:return"#e2e8f0";case"success":return"#10b981";case"danger":return"#ef4444"}}};
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`,Xa=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";case"authorized":return"linear-gradient(135deg, #10b981 0%, #059669 100%)";case"denied":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";default:return"linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#d97706";case"authorized":return"#059669";case"denied":return"#dc2626";default:return"#4b5563"}}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`,Za=ve.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`,Qa=ve.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,es=ve.div`
  font-size: 0.875rem;
  color: #ffffff;
`,ts=ve.div`
  background: linear-gradient(135deg, #312e81 0%, #1e1b4b 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #8b5cf6;
`,rs=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>t.jsxs(t.Fragment,{children:[t.jsxs(Ea,{children:[t.jsxs(_a,{children:[t.jsxs(Na,{children:[t.jsx(Y,{style:{marginRight:"0.5rem"}}),"AI Agent Console"]}),t.jsx(Ma,{children:"Autonomous AI Agent Authorization System"})]}),t.jsxs(qa,{children:[t.jsx(Ba,{$active:"pending"===e.status,$color:"#f59e0b"}),t.jsx(Ba,{$active:"authorized"===e.status,$color:"#10b981"}),t.jsx(Ba,{$active:"denied"===e.status,$color:"#ef4444"}),t.jsx(Ba,{$active:"expired"===e.status,$color:"#6b7280"})]}),t.jsxs(La,{children:[t.jsx(Va,{children:"Authorization Token"}),t.jsx(Wa,{children:Ge.formatUserCode(e.userCode)})]}),t.jsxs(Ha,{children:[t.jsxs(Ya,{children:[t.jsx(J,{style:{marginRight:"0.5rem"}}),"Neural Network Scanner"]}),t.jsx(Ja,{children:t.jsx(n,{value:e.verificationUriComplete,size:180,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),t.jsxs(Ga,{children:[t.jsxs(Ka,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("AIAgentDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Token"]}),t.jsxs(Ka,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.verificationUri),we.info("AIAgentDeviceFlow","Verification URI copied to clipboard")},children:[t.jsx(o,{})," Copy URI"]}),t.jsxs(Ka,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("AIAgentDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open in Browser"]})]}),t.jsxs(Xa,{$status:e.status,children:[t.jsx(Za,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(Qa,{children:(()=>{switch(e.status){case"pending":return"AGENT AUTHENTICATION";case"authorized":return"AGENT AUTHORIZED";case"denied":return"AUTHORIZATION DENIED";case"expired":return"SESSION EXPIRED";default:return"UNKNOWN STATUS"}})()}),t.jsx(es,{children:Ge.getStatusMessage(e)})]}),"authorized"===e.status&&e.tokens&&t.jsxs("div",{style:{background:"linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",border:"3px solid #f97316",borderRadius:"1rem",padding:"2rem",marginTop:"1rem",boxShadow:"0 20px 25px -5px rgba(0, 0, 0, 0.3)",color:"white"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem",paddingBottom:"1rem",borderBottom:"2px solid #374151"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx("div",{style:{width:"40px",height:"40px",background:"linear-gradient(135deg, #f97316 0%, #ea580c 100%)",borderRadius:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"1.25rem"},children:"🤖"}),t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"1.25rem",fontWeight:"700",color:"white"},children:"Claude AI Assistant"}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8"},children:"Advanced AI • Online & Ready"})]})]}),t.jsx("div",{style:{background:"#10b981",color:"white",padding:"0.5rem 1rem",borderRadius:"0.5rem",fontSize:"0.875rem",fontWeight:"600"},children:"Active"})]}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"1.5rem",border:"1px solid #374151",height:"300px",display:"flex",flexDirection:"column"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"1rem",paddingBottom:"0.75rem",borderBottom:"1px solid #374151"},children:[t.jsx("div",{style:{fontSize:"1.25rem"},children:"💬"}),t.jsx("h3",{style:{margin:0,fontSize:"1rem",fontWeight:"600"},children:"Conversation"})]}),t.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",gap:"0.75rem",overflowY:"auto"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.75rem"},children:[t.jsx("div",{style:{width:"32px",height:"32px",background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.875rem",flexShrink:0},children:"👤"}),t.jsx("div",{style:{background:"rgba(59, 130, 246, 0.2)",padding:"0.75rem",borderRadius:"0.5rem",fontSize:"0.875rem",color:"#e2e8f0",maxWidth:"80%"},children:"Can you help me analyze the quarterly sales data?"})]}),t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.75rem",justifyContent:"flex-end"},children:[t.jsx("div",{style:{background:"rgba(249, 115, 22, 0.2)",padding:"0.75rem",borderRadius:"0.5rem",fontSize:"0.875rem",color:"#e2e8f0",maxWidth:"80%"},children:"I'd be happy to help analyze your quarterly sales data. I can process the information and provide insights on trends, performance metrics, and recommendations."}),t.jsx("div",{style:{width:"32px",height:"32px",background:"linear-gradient(135deg, #f97316 0%, #ea580c 100%)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.875rem",flexShrink:0},children:"🤖"})]}),t.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.75rem"},children:[t.jsx("div",{style:{width:"32px",height:"32px",background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.875rem",flexShrink:0},children:"👤"}),t.jsx("div",{style:{background:"rgba(59, 130, 246, 0.2)",padding:"0.75rem",borderRadius:"0.5rem",fontSize:"0.875rem",color:"#e2e8f0",maxWidth:"80%"},children:"Great! I'll upload the CSV file now."})]})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginTop:"0.75rem",padding:"0.75rem",background:"rgba(255, 255, 255, 0.05)",borderRadius:"0.5rem"},children:[t.jsx("div",{style:{width:"24px",height:"24px",background:"linear-gradient(135deg, #f97316 0%, #ea580c 100%)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem"},children:"🤖"}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8"},children:"Claude is analyzing your data..."}),t.jsx("div",{style:{display:"flex",gap:"0.25rem",marginLeft:"auto"},children:[1,2,3].map(e=>t.jsx("div",{style:{width:"4px",height:"4px",background:"#f97316",borderRadius:"50%",animation:"pulse 1.5s ease-in-out infinite",animationDelay:.2*e+"s"}},e))})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:"1rem",marginBottom:"1.5rem"},children:[t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",padding:"1rem",borderRadius:"0.75rem",border:"1px solid #374151"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"},children:[t.jsx("div",{style:{fontSize:"1.25rem"},children:"📊"}),t.jsx("h3",{style:{margin:0,fontSize:"1rem",fontWeight:"600"},children:"Data Analysis"})]}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8",marginBottom:"0.5rem"},children:"CSV, JSON, Excel processing"}),t.jsx("div",{style:{background:"#10b981",color:"white",padding:"0.25rem 0.5rem",borderRadius:"0.25rem",fontSize:"0.75rem",fontWeight:"600",display:"inline-block"},children:"Active"})]}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",padding:"1rem",borderRadius:"0.75rem",border:"1px solid #374151"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"},children:[t.jsx("div",{style:{fontSize:"1.25rem"},children:"🔍"}),t.jsx("h3",{style:{margin:0,fontSize:"1rem",fontWeight:"600"},children:"Research"})]}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8",marginBottom:"0.5rem"},children:"Web search & fact checking"}),t.jsx("div",{style:{background:"#3b82f6",color:"white",padding:"0.25rem 0.5rem",borderRadius:"0.25rem",fontSize:"0.75rem",fontWeight:"600",display:"inline-block"},children:"Ready"})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"1rem"},children:[t.jsxs("button",{type:"button",style:{background:"linear-gradient(135deg, #f97316 0%, #ea580c 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(G,{})," Chat"]}),t.jsxs("button",{type:"button",style:{background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(K,{})," Upload"]}),t.jsxs("button",{type:"button",style:{background:"linear-gradient(135deg, #10b981 0%, #059669 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(q,{})," Settings"]})]})]}),t.jsx(ts,{})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(15, 23, 42, 0.4)",borderColor:"#374151",headerTextColor:"#ffffff"})]}),is=ve.div`
  background: #ffffff;
  border-radius: 0;
  padding: 0;
  margin: 1rem 0;
  position: relative;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
`,ns=ve.div`
  background: #000000;
  border-radius: 0.625rem;
  padding: 0.375rem;
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  width: 100%;
  
  /* Fabric texture on sides */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      linear-gradient(90deg, 
        rgba(60, 60, 60, 0.3) 0%, 
        transparent 5%, 
        transparent 95%, 
        rgba(60, 60, 60, 0.3) 100%);
    border-radius: 0.625rem;
    pointer-events: none;
    z-index: 2;
  }
  
  /* Camera lens at top */
  &::after {
    content: '';
    position: absolute;
    top: 0.625rem;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 3;
  }
`,os=ve.div`
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 153, 0, 0.05);
  border: 1px solid rgba(255, 153, 0, 0.2);
  border-radius: 0.5rem;
  text-align: center;
`,as=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #ffffff;
  border-radius: 0.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`,ss=ve.div`
  font-size: 0.625rem;
  font-weight: 600;
  color: rgba(255, 153, 0, 0.9);
  margin-bottom: 0.5rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,ds=ve.div`
  width: 100%;
  height: 12px;
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
  border-radius: 0 0 0.625rem 0.625rem;
  margin-top: 0.25rem;
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
  
  /* Grille pattern */
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.05) 2px,
      rgba(255, 255, 255, 0.05) 4px
    );
`,cs=ve.div`
  background: linear-gradient(135deg, #87ceeb 0%, #4682b4 50%, #1e3a8a 100%);
  border: none;
  border-radius: 0.375rem;
  padding: 1rem;
  text-align: center;
  position: relative;
  min-height: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  color: #ffffff;
  overflow: hidden;
  
  /* Weather background - sky with clouds */
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 40%),
    radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 35%),
    radial-gradient(circle at 50% 70%, rgba(255, 255, 255, 0.15) 0%, transparent 30%),
    linear-gradient(135deg, #87ceeb 0%, #4682b4 50%, #1e3a8a 100%);
  background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%;
  
  /* Overlay for content readability */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
    z-index: 0;
  }
  
  /* Content should be above overlay */
  > * {
    position: relative;
    z-index: 1;
  }
`,ls=ve.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 2;
`,ps=ve.div`
  font-size: 2rem;
  margin-bottom: 0.25rem;
`,ms=ve.div`
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`,us=ve.div`
  font-size: 0.75rem;
  opacity: 0.9;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`,fs=ve.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${e=>e.$active?"#00ff00":"#ff9900"};
  box-shadow: 0 0 12px ${e=>e.$active?"#00ff00":"#ff9900"};
  margin-right: 0.5rem;
  animation: ${e=>(e.$active,"pulse 2s infinite")};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`,hs=ve.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`,gs=ve.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`,xs=ve.div`
  background: rgba(255, 153, 0, 0.1);
  color: #ff9900;
  font-family: 'Amazon Ember', 'Courier New', monospace;
  font-size: 1.5rem;
  font-weight: 600;
  padding: 1rem 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  letter-spacing: 0.2em;
  text-align: center;
  border: 1px solid rgba(255, 153, 0, 0.3);
  box-shadow: 
    0 2px 6px rgba(255, 153, 0, 0.2),
    inset 0 1px 2px rgba(255, 153, 0, 0.1);
  text-shadow: 0 0 5px rgba(255, 153, 0, 0.3);
`,bs=ve.div`
  color: rgba(255, 153, 0, 0.9);
  font-size: 0.625rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,vs=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"rgba(255, 153, 0, 0.15)";case"authorized":return"rgba(0, 255, 0, 0.15)";case"denied":return"rgba(255, 0, 0, 0.15)";default:return"rgba(128, 128, 128, 0.15)"}}};
  border: 1px solid ${e=>{switch(e.$status){case"pending":return"rgba(255, 153, 0, 0.3)";case"authorized":return"rgba(0, 255, 0, 0.3)";case"denied":return"rgba(255, 0, 0, 0.3)";default:return"rgba(128, 128, 128, 0.3)"}}};
  border-radius: 0.5rem;
  padding: 0.75rem;
  text-align: center;
  margin-bottom: 0.5rem;
`,ws=ve.div`
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
`,ys=ve.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`,ks=ve.div`
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`,js=ve.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.75rem;
`,Cs=ve.button`
  background: ${e=>"primary"===e.$variant?"#ff9900":"rgba(255, 153, 0, 0.2)"};
  color: ${e=>"primary"===e.$variant?"#ffffff":"#ff9900"};
  border: 1px solid ${e=>"primary"===e.$variant?"#ff9900":"rgba(255, 153, 0, 0.4)"};
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.625rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
  
  &:hover {
    background: ${e=>"primary"===e.$variant?"#e68900":"rgba(255, 153, 0, 0.3)"};
    border-color: ${e=>"primary"===e.$variant?"#e68900":"rgba(255, 153, 0, 0.5)"};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`,zs=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>{const p=()=>{navigator.clipboard.writeText(e.verificationUri),we.info("AmazonEchoShowDeviceFlow","Verification URI copied to clipboard")};return t.jsxs(is,{children:[t.jsx(ns,{children:t.jsxs(cs,{children:[t.jsxs(ls,{children:[t.jsx(ps,{children:"☀️"}),t.jsx(ms,{children:"72°"}),t.jsx(us,{children:"Sunny"})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem",marginTop:"2rem"},children:[t.jsx(fs,{$active:!!e.tokens}),t.jsx(hs,{children:"Device Authorization"})]}),t.jsx(gs,{children:"Enter this code on your phone or computer"}),e.userCode&&t.jsxs(t.Fragment,{children:[t.jsx(bs,{children:"Authorization Code"}),t.jsx(xs,{children:e.userCode})]}),e.status&&t.jsxs(vs,{$status:e.status,children:[t.jsx(ws,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(ys,{children:(()=>{switch(e.status){case"pending":return"Waiting for Authorization";case"authorized":return"Authorization Complete";case"denied":return"Authorization Denied";case"expired":return"Authorization Expired";default:return"Unknown Status"}})()}),t.jsx(ks,{children:Ge.getStatusMessage(e)})]}),t.jsxs(js,{children:[t.jsxs(Cs,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("AmazonEchoShowDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{size:12})," Copy Code"]}),t.jsxs(Cs,{$variant:"secondary",onClick:p,children:[t.jsx(o,{size:12})," Copy URI"]})]}),"authorized"===e.status&&e.tokens&&t.jsx("div",{style:{background:"rgba(0, 255, 0, 0.15)",border:"2px solid rgba(0, 255, 0, 0.3)",borderRadius:"0.75rem",padding:"1rem",marginTop:"1rem"},children:t.jsxs("div",{style:{fontSize:"0.625rem",fontWeight:"600",color:"#00ff00",textAlign:"center",fontFamily:"Amazon Ember, Helvetica Neue, sans-serif"},children:[t.jsx(s,{size:12,style:{marginRight:"0.25rem"}}),"Authorization Successful!"]})})]})}),t.jsx(ds,{}),e.verificationUriComplete&&t.jsxs(os,{children:[t.jsx(ss,{children:"Scan QR Code"}),t.jsx(as,{children:t.jsx(n,{value:e.verificationUriComplete,size:100,level:"M",includeMargin:!0})}),e.verificationUri&&t.jsx("div",{style:{fontSize:"0.5rem",color:"rgba(255, 255, 255, 0.5)",marginTop:"0.5rem",wordBreak:"break-all",fontFamily:"Amazon Ember, Helvetica Neue, sans-serif"},children:e.verificationUri}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem",justifyContent:"center",marginTop:"0.75rem"},children:[t.jsxs(Cs,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("AmazonEchoShowDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{size:12})," Open in Browser"]}),t.jsxs(Cs,{$variant:"secondary",onClick:p,children:[t.jsx(o,{size:12})," Copy URI"]})]})]})]})},Ss=ve.div`
  background: #ffffff;
  border-radius: 0;
  padding: 0;
  margin: 1rem 0;
  position: relative;
  max-width: 450px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
`,$s=ve.div`
  background: linear-gradient(135deg, #2d2d2f 0%, #1a1a1a 50%, #2d2d2f 100%);
  border-radius: 0.375rem;
  padding: 0.375rem;
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5);
  position: relative;
  width: 100%;
  
  /* TV screen glow effect */
  &::before {
    content: '';
    position: absolute;
    top: 0.375rem;
    left: 0.375rem;
    right: 0.375rem;
    bottom: 0.375rem;
    border-radius: 0.1875rem;
    box-shadow: 
      inset 0 0 20px rgba(0, 0, 0, 0.8),
      0 0 30px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    z-index: 1;
  }
`,Is=ve.div`
  background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%);
  border: none;
  border-radius: 0.1875rem;
  padding: 1rem;
  text-align: center;
  position: relative;
  min-height: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  color: #ffffff;
  overflow: hidden;
  
  /* Forest Gump movie poster background - iconic poster with Tom Hanks on park bench */
  background-image: 
    url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop&q=90');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  
  /* Content should be above overlay */
  > * {
    position: relative;
    z-index: 1;
  }
`,Ts=ve.div`
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 2;
  background: rgba(0, 0, 0, 0.6);
  padding: 0.75rem;
  border-radius: 0.5rem;
`,As=ve.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
`,Rs=ve.div`
  height: 100%;
  width: 35%;
  background: #ffffff;
  border-radius: 2px;
`,Os=ve.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  margin-top: 0.25rem;
`,Us=ve.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.25rem;
`,Ps=ve.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.75rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`,Ds=ve.div`
  width: 120px;
  height: 40px;
  background: linear-gradient(135deg, #1d1d1f 0%, #000000 100%);
  border-radius: 0.25rem;
  margin: 0.5rem 0;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  
  /* Apple logo on box */
  &::before {
    content: '⌽';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.6);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
`,Fs=ve.div`
  width: 70px;
  height: 200px;
  background: linear-gradient(135deg, #8e8e93 0%, #636366 100%);
  border-radius: 0.75rem;
  margin: 0.5rem 0;
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  position: relative;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`,Es=ve.div`
  width: 100%;
  height: 90px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 0.5rem;
  margin-bottom: 0.25rem;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  
  /* Center indicator */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
  }
`,_s=ve.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
  flex: 1;
`,Ns=ve.div`
  width: 35px;
  height: 6px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 3px;
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.8),
    0 1px 1px rgba(255, 255, 255, 0.1);
`,Ms=ve.div`
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    0 1px 2px rgba(255, 255, 255, 0.1);
  position: relative;
  
  /* Play icon */
  &::before {
    content: '▶';
    position: absolute;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
    left: 52%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
`,qs=ve.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
`,Bs=ve.div`
  width: 20px;
  height: 3px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  box-shadow: 
    inset 0 1px 1px rgba(0, 0, 0, 0.8),
    0 1px 1px rgba(255, 255, 255, 0.1);
`,Ls=ve.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${e=>e.$active?"#34c759":"#ff3b30"};
  box-shadow: 0 0 12px ${e=>e.$active?"#34c759":"#ff3b30"};
  margin-right: 0.5rem;
  animation: ${e=>e.$active?"pulse 2s infinite":"none"};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`,Vs=ve.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  letter-spacing: -0.02em;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5);
`,Ws=ve.div`
  font-size: 0.875rem;
  color: #ffffff;
  margin-bottom: 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.5);
`,Hs=ve.div`
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 2rem;
  font-weight: 700;
  padding: 1.5rem 2rem;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-align: center;
  border: 3px solid rgba(255, 255, 255, 0.5);
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.6),
    inset 0 2px 4px rgba(255, 255, 255, 0.2),
    0 0 30px rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
`,Ys=ve.div`
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.5);
`,Js=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"rgba(255, 149, 0, 0.15)";case"authorized":return"rgba(52, 199, 89, 0.15)";case"denied":return"rgba(255, 59, 48, 0.15)";default:return"rgba(142, 142, 147, 0.15)"}}};
  border: 1px solid ${e=>{switch(e.$status){case"pending":return"rgba(255, 149, 0, 0.3)";case"authorized":return"rgba(52, 199, 89, 0.3)";case"denied":return"rgba(255, 59, 48, 0.3)";default:return"rgba(142, 142, 147, 0.3)"}}};
  border-radius: 0.5rem;
  padding: 0.75rem;
  text-align: center;
  margin-bottom: 0.5rem;
`,Gs=ve.div`
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
`,Ks=ve.div`
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.5);
`,Xs=ve.div`
  font-size: 0.875rem;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.5);
`,Zs=ve.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.75rem;
`,Qs=ve.button`
  background: ${e=>"primary"===e.$variant?"#007aff":"rgba(255, 255, 255, 0.1)"};
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.625rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  
  &:hover {
    background: ${e=>"primary"===e.$variant?"#0051d5":"rgba(255, 255, 255, 0.15)"};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`,ed=ve.div`
  width: 200px;
  height: 8px;
  background: linear-gradient(135deg, #2d2d2f 0%, #1a1a1a 100%);
  border-radius: 0 0 0.5rem 0.5rem;
  margin-top: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`,td=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>t.jsxs(Ss,{children:[t.jsx($s,{children:t.jsxs(Is,{children:[t.jsxs(Ts,{children:[t.jsx(As,{children:t.jsx(Rs,{})}),t.jsxs(Os,{children:[t.jsx("span",{children:"12:34"}),t.jsx("span",{children:"35:42"})]}),t.jsxs(Us,{children:[t.jsx(Ps,{children:"⏮"}),t.jsx(Ps,{children:"⏸"}),t.jsx(Ps,{children:"⏭"})]})]}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",marginTop:"2rem",marginBottom:"1rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"},children:[t.jsx(Ls,{$active:!!e.tokens}),t.jsx(Vs,{children:"Device Authorization"})]}),t.jsx(Ws,{children:"Scan QR code or enter this code on your phone or computer"}),(e.verificationUriComplete||e.verificationUri&&e.userCode)&&t.jsx("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",marginBottom:"1rem",padding:"0.75rem",backgroundColor:"rgba(255, 255, 255, 0.95)",borderRadius:"0.5rem",border:"2px solid rgba(255, 255, 255, 0.3)",boxShadow:"0 4px 12px rgba(0, 0, 0, 0.3)"},children:t.jsx(n,{value:e.verificationUriComplete||`${e.verificationUri}?user_code=${e.userCode}`,size:180,level:"M",includeMargin:!0})}),e.userCode&&t.jsxs(t.Fragment,{children:[t.jsx(Ys,{children:"Enter Code"}),t.jsx(Hs,{children:e.userCode})]}),e.status&&t.jsxs(Js,{$status:e.status,children:[t.jsx(Gs,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(Ks,{children:(()=>{switch(e.status){case"pending":return"Waiting for Authorization";case"authorized":return"Authorization Complete";case"denied":return"Authorization Denied";case"expired":return"Authorization Expired";default:return"Unknown Status"}})()}),t.jsx(Xs,{children:Ge.getStatusMessage(e)})]}),t.jsxs(Zs,{children:[t.jsxs(Qs,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("AppleTVDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{size:12})," Open in Browser"]}),t.jsxs(Qs,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("AppleTVDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{size:12})," Copy Code"]}),t.jsxs(Qs,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.verificationUri),we.info("AppleTVDeviceFlow","Verification URI copied to clipboard")},children:[t.jsx(o,{size:12})," Copy URI"]})]}),"authorized"===e.status&&e.tokens&&t.jsx("div",{style:{background:"rgba(52, 199, 89, 0.15)",border:"2px solid rgba(52, 199, 89, 0.3)",borderRadius:"0.75rem",padding:"1rem",marginTop:"1rem"},children:t.jsxs("div",{style:{fontSize:"0.625rem",fontWeight:"600",color:"#34c759",textAlign:"center",fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'},children:[t.jsx(s,{size:12,style:{marginRight:"0.25rem"}}),"Authorization Successful!"]})})]})]})}),t.jsx(Ds,{}),t.jsxs(Fs,{children:[t.jsx(Es,{}),t.jsxs(_s,{children:[t.jsx(Ns,{}),t.jsx(Ms,{}),t.jsxs(qs,{children:[t.jsx(Bs,{}),t.jsx(Bs,{})]})]})]}),t.jsx(ed,{})]}),rd=ve.div`
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 2px solid #333333;
  max-width: 350px;
  margin-left: auto;
  margin-right: auto;
  color: #ffffff;
  
  /* Fitbit branding */
  &::before {
    content: 'FITBIT';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #00d4aa;
    letter-spacing: 1px;
    z-index: 2;
  }
  
  /* Fitbit strap texture */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1rem;
    background: linear-gradient(90deg, transparent 0%, rgba(0, 212, 170, 0.05) 50%, transparent 100%);
    pointer-events: none;
  }
`,id=ve.div`
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  border: 3px solid #00ff96;
  border-radius: 50%;
  width: 200px;
  height: 200px;
  margin: 0 auto 1.5rem auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(0, 255, 150, 0.3);
`,nd=ve.div`
  position: absolute;
  top: 1rem;
  color: #00ff96;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,od=ve.div`
  color: #00ff96;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 10px rgba(0, 255, 150, 0.5);
`,ad=ve.div`
  color: #cccccc;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`,sd=ve.div`
  background: #000000;
  color: #00ff96;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(0, 255, 150, 0.5);
  border: 1px solid #00ff96;
  text-align: center;
`,dd=ve.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${e=>{switch(e.$status){case"pending":return"#ffa500";case"authorized":return"#00ff96";case"denied":return"#ff0000";default:return"#666666"}}};
  box-shadow: ${e=>{switch(e.$status){case"pending":return"0 0 15px #ffa500";case"authorized":return"0 0 15px #00ff96";case"denied":return"0 0 15px #ff0000";default:return"0 0 15px #666666"}}};
  animation: ${e=>"pending"===e.$status?"pulse 2s infinite":"none"};
  margin: 0 auto 1rem auto;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`,cd=ve.div`
  background: #1a1a1a;
  border: 2px solid #00ff96;
  border-radius: 1rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1.5rem;
`,ld=ve.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #00ff96;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,pd=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`,md=ve.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
`,ud=ve.button`
  background: ${e=>"primary"===e.$variant?"#00ff96":"#404040"};
  color: ${e=>"primary"===e.$variant?"#000000":"#ffffff"};
  border: none;
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &:hover {
    background: ${e=>"primary"===e.$variant?"#00cc77":"#555555"};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
`,fd=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)";case"authorized":return"linear-gradient(135deg, #00ff96 0%, #00cc77 100%)";case"denied":return"linear-gradient(135deg, #ff0000 0%, #cc0000 100%)";default:return"linear-gradient(135deg, #666666 0%, #404040 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#ff8c00";case"authorized":return"#00cc77";case"denied":return"#cc0000";default:return"#404040"}}};
  border-radius: 1rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1rem;
`,hd=ve.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,gd=ve.div`
  font-size: 0.75rem;
  color: #ffffff;
`,xd=ve.div`
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  height: 1rem;
  border-radius: 0 0 1rem 1rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #00ff96;
`,bd=({state:r,onStateUpdate:i,onComplete:d,onError:c})=>{const[l,p]=e.useState(new Date);e.useEffect(()=>{const e=setInterval(()=>{p(new Date)},1e3);return()=>clearInterval(e)},[]);return t.jsxs(t.Fragment,{children:[t.jsxs(rd,{children:[t.jsxs(id,{children:[t.jsx(nd,{children:"Fitness Tracker"}),t.jsx(od,{children:l.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}),t.jsx(ad,{children:l.toLocaleDateString()}),t.jsx(sd,{children:Ge.formatUserCode(r.userCode)})]}),t.jsx(dd,{$status:r.status}),t.jsxs(cd,{children:[t.jsx(ld,{children:"QR Code"}),t.jsx(pd,{children:t.jsx(n,{value:r.verificationUriComplete,size:120,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),t.jsxs(md,{children:[t.jsxs(ud,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(r.userCode),we.info("FitnessTrackerDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy"]}),t.jsxs(ud,{$variant:"primary",onClick:()=>{window.open(r.verificationUriComplete,"_blank"),we.info("FitnessTrackerDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open"]})]}),t.jsxs(fd,{$status:r.status,children:[t.jsx(hd,{children:(()=>{switch(r.status){case"pending":return"AUTH PENDING";case"authorized":return"AUTH COMPLETE";case"denied":return"AUTH DENIED";case"expired":return"AUTH EXPIRED";default:return"UNKNOWN"}})()}),t.jsx(gd,{children:Ge.getStatusMessage(r)})]}),"authorized"===r.status&&t.jsx("div",{style:{background:"#1a1a1a",border:"2px solid #00ff96",borderRadius:"1rem",padding:"1rem",marginTop:"1rem"},children:t.jsxs("div",{style:{fontSize:"0.875rem",fontWeight:"700",color:"#00ff96",textAlign:"center",marginBottom:"1rem",textTransform:"uppercase",letterSpacing:"0.05em"},children:[t.jsx(s,{style:{marginRight:"0.5rem"}}),"Authorization Complete!"]})}),t.jsx(xd,{})]}),t.jsx(_e,{tokens:r.tokens,backgroundColor:"rgba(0, 0, 0, 0.4)",borderColor:"#374151",headerTextColor:"#00ff96"})]})},vd=ve.div`
  background: ${({$authorized:e})=>e?"linear-gradient(135deg, #00ff88 0%, #00cc6a 50%, #00ff88 100%)":"linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"};
  border-radius: 1.5rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 3px solid ${({$authorized:e})=>e?"#00ff88":"#e5e7eb"};
  position: relative;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  color: ${({$authorized:e})=>e?"#000000":"#1f2937"};
  transition: all 0.3s ease;
  
  /* PS5 console styling */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1.5rem;
    background: ${({$authorized:e})=>e?"linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 204, 106, 0.1) 100%)":"linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)"};
    pointer-events: none;
  }
  
  /* PlayStation 5 logo area */
  &::after {
    content: 'PS5';
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 0.875rem;
    font-weight: 700;
    color: ${({$authorized:e})=>e?"#000000":"#3b82f6"};
    letter-spacing: 1px;
    z-index: 2;
  }
`,wd=ve.div`
  background: ${({$authorized:e})=>e?"linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)":"linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"};
  border: 1px solid ${({$authorized:e})=>e?"#00ff88":"#3a3a3c"};
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  color: ${({$authorized:e})=>e?"#000000":"#ffffff"};
  font-weight: 600;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
`,yd=ve.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({$authorized:e})=>e?"#000000":"#0096ff"};
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: ${({$authorized:e})=>e?"0 0 10px rgba(0, 255, 136, 0.5)":"0 0 10px rgba(0, 150, 255, 0.5)"};
  transition: all 0.3s ease;
`,kd=ve.div`
  font-size: 1rem;
  color: ${({$authorized:e})=>e?"#000000":"#cccccc"};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
`,jd=ve.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`,Cd=ve.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${e=>e.$active?e.$color:"#333333"};
  box-shadow: ${e=>e.$active?`0 0 15px ${e.$color}`:"none"};
  animation: ${e=>e.$active?"pulse 2s infinite":"none"};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`,zd=ve.div`
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  border: 3px solid #0096ff;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(0, 150, 255, 0.2);
`,Sd=ve.div`
  color: #0096ff;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,$d=ve.div`
  background: #000000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 2px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
`,Id=ve.div`
  background: #1a1a1a;
  border: 2px solid #0096ff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`,Td=ve.div`
  font-size: 1rem;
  font-weight: 600;
  color: #0096ff;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Ad=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`,Rd=ve.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`,Od=ve.button`
  background: ${e=>{switch(e.$variant){case"primary":return"#0096ff";case"secondary":default:return"#333333";case"success":return"#00ff00";case"danger":return"#ff0000"}}};
  color: white;
  border: 2px solid ${e=>{switch(e.$variant){case"primary":return"#007acc";case"secondary":default:return"#555555";case"success":return"#00cc00";case"danger":return"#cc0000"}}};
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`,Ud=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)";case"authorized":return"linear-gradient(135deg, #00ff00 0%, #32cd32 100%)";case"denied":return"linear-gradient(135deg, #ff0000 0%, #dc143c 100%)";default:return"linear-gradient(135deg, #666666 0%, #404040 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#ff8c00";case"authorized":return"#32cd32";case"denied":return"#dc143c";default:return"#404040"}}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`,Pd=ve.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`,Dd=ve.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Fd=ve.div`
  font-size: 0.875rem;
  color: #ffffff;
`,Ed=ve.div`
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #0096ff;
`,_d=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>{const p="authorized"===e.status;return t.jsxs(t.Fragment,{children:[t.jsxs(vd,{$authorized:p,children:[t.jsxs(wd,{$authorized:p,children:[t.jsxs(yd,{$authorized:p,children:[t.jsx(X,{style:{marginRight:"0.5rem"}}),"PlayStation 5"]}),t.jsx(kd,{$authorized:p,children:"Console Authorization System"})]}),t.jsxs(jd,{children:[t.jsx(Cd,{$active:"pending"===e.status,$color:"#ffa500"}),t.jsx(Cd,{$active:"authorized"===e.status,$color:"#00ff00"}),t.jsx(Cd,{$active:"denied"===e.status,$color:"#ff0000"}),t.jsx(Cd,{$active:"expired"===e.status,$color:"#666666"})]}),t.jsxs(zd,{children:[t.jsx(Sd,{children:"Authorization Code"}),t.jsx($d,{children:Ge.formatUserCode(e.userCode)})]}),t.jsxs(Id,{children:[t.jsx(Td,{children:"QR Code Scanner"}),t.jsx(Ad,{children:t.jsx(n,{value:e.verificationUriComplete,size:180,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),t.jsxs(Rd,{children:[t.jsxs(Od,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("GamingConsoleDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy"]}),t.jsxs(Od,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.verificationUri),we.info("GamingConsoleDeviceFlow","Verification URI copied to clipboard")},children:[t.jsx(o,{})," URI"]}),t.jsxs(Od,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("GamingConsoleDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open"]}),t.jsxs(Od,{$variant:"success",onClick:()=>window.location.reload(),children:[t.jsx(M,{})," Reset"]})]}),t.jsxs(Ud,{$status:e.status,children:[t.jsx(Pd,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(Dd,{children:(()=>{switch(e.status){case"pending":return"AUTHORIZATION PENDING";case"authorized":return"AUTHORIZATION COMPLETE";case"denied":return"AUTHORIZATION DENIED";case"expired":return"AUTHORIZATION EXPIRED";default:return"UNKNOWN STATUS"}})()}),t.jsx(Fd,{children:Ge.getStatusMessage(e)})]}),"authorized"===e.status&&e.tokens&&t.jsxs("div",{style:{background:"#1a1a1a",border:"2px solid #00ff00",borderRadius:"0.75rem",padding:"1.5rem",marginTop:"1rem"},children:[t.jsxs("div",{style:{fontSize:"1.25rem",fontWeight:"700",color:"#00ff00",textAlign:"center",marginBottom:"1rem",textTransform:"uppercase",letterSpacing:"0.05em"},children:[t.jsx(s,{style:{marginRight:"0.5rem"}}),"Authorization Successful!"]}),t.jsx("div",{style:{background:"#000000",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #333333"}})]}),t.jsx(Ed,{})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(0, 0, 0, 0.2)",borderColor:"#333333",headerTextColor:"#ffffff"})]})},Nd=ve.div`
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 2rem 0;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.2),
    0 0 0 2px #ffffff,
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
  border: 3px solid #ffffff;
  
  /* Kroger pump design elements */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
    pointer-events: none;
  }
  
  /* Kroger logo area */
  &::after {
    content: 'KROGER';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.875rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 1px;
    z-index: 2;
  }
`,Md=ve.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #dc2626;
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #dc2626;
  font-weight: 700;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  position: relative;
`,qd=ve.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: #dc2626;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  letter-spacing: 0.05em;
`,Bd=ve.div`
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 1rem;
`,Ld=ve.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: white;
  color: #1e40af;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid #1e40af;
`,Vd=ve.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  align-items: start;
`,Wd=ve.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`,Hd=ve.button`
  background: ${e=>e.$active?"#fbbf24":"rgba(255, 255, 255, 0.9)"};
  color: ${e=>e.$active?"#1e40af":"#374151"};
  border: 2px solid ${e=>e.$active?"#f59e0b":"rgba(255, 255, 255, 0.3)"};
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #fbbf24;
    color: #1e40af;
    border-color: #f59e0b;
  }
`,Yd=ve.div`
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border: 3px solid #fbbf24;
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(251, 191, 36, 0.3);
`,Jd=ve.div`
  color: #fbbf24;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Gd=ve.div`
  background: #000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 3rem;
  font-weight: 700;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 2px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
`,Kd=ve.button`
  background: #fbbf24;
  color: #1e40af;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #f59e0b;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`,Xd=ve.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`,Zd=ve.div`
  background: #374151;
  border: 2px solid #6b7280;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  position: relative;
  
  &::after {
    content: 'Instructions';
    position: absolute;
    bottom: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    color: #9ca3af;
  }
`,Qd=ve.div`
  width: 100%;
  height: 2rem;
  background: #1f2937;
  border: 1px solid #4b5563;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
  position: relative;
  
  &::before {
    content: '→';
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    font-size: 1.2rem;
  }
`,ec=ve.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`,tc=ve.button`
  background: ${e=>{switch(e.$type){case"regular":return e.$active?"#10b981":"#f3f4f6";case"special":return e.$active?"#ef4444":"#f3f4f6";case"super":return e.$active?"#3b82f6":"#f3f4f6";case"diesel":return e.$active?"#fbbf24":"#f3f4f6";case"rec90":return e.$active?"#8b5cf6":"#f3f4f6";default:return"#f3f4f6"}}};
  color: ${e=>e.$active?"white":"#374151"};
  border: 2px solid ${e=>e.$active?"currentColor":"#d1d5db"};
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`,rc=ve.div`
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`,ic=ve.div`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
`,nc=ve.div`
  font-size: 0.75rem;
  opacity: 0.8;
`,oc=ve.div`
  background: white;
  border: 3px solid #1e40af;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`,ac=ve.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 1rem;
  text-transform: uppercase;
`,sc=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`,dc=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)";case"authorized":return"linear-gradient(135deg, #dcfce7 0%, #10b981 100%)";case"denied":return"linear-gradient(135deg, #fecaca 0%, #ef4444 100%)";default:return"linear-gradient(135deg, #f3f4f6 0%, #6b7280 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#f59e0b";case"authorized":return"#059669";case"denied":return"#dc2626";default:return"#4b5563"}}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`,cc=ve.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`,lc=ve.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`,pc=ve.div`
  font-size: 0.875rem;
  color: #374151;
`,mc=ve.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`,uc=ve.button`
  background: ${e=>"primary"===e.$variant?"#1e40af":"#6b7280"};
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${e=>"primary"===e.$variant?"#1d4ed8":"#4b5563"};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`,fc=ve.div`
  text-align: center;
  margin-top: 1.5rem;
`,hc=ve.div`
  background: white;
  color: #1e40af;
  padding: 1rem 2rem;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 700;
  display: inline-block;
  border: 3px solid #1e40af;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;ve.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  ${({$variant:e})=>{switch(e){case"primary":return"\n          background: #1e40af;\n          color: white;\n          &:hover { background: #1d4ed8; transform: translateY(-1px); }\n        ";case"secondary":return"\n          background: #6b7280;\n          color: white;\n          &:hover { background: #4b5563; transform: translateY(-1px); }\n        ";case"success":return"\n          background: #10b981;\n          color: white;\n          &:hover { background: #059669; transform: translateY(-1px); }\n        ";case"danger":return"\n          background: #ef4444;\n          color: white;\n          &:hover { background: #dc2626; transform: translateY(-1px); }\n        "}}}
`;const gc=({state:r,onStateUpdate:i,onComplete:l,onError:p})=>{const[m,u]=e.useState("regular"),[f,h]=e.useState(!1);return t.jsxs(t.Fragment,{children:[t.jsxs(Nd,{children:[t.jsxs(Md,{children:[t.jsx(Ld,{children:"CONTAINS UP TO 10% ETHANOL"}),t.jsx(qd,{children:"Device Authorization"}),t.jsx(Bd,{children:"Enter the code below on your device to authorize"})]}),t.jsxs(Vd,{children:[t.jsxs(Wd,{children:[t.jsx(Hd,{$active:"pending"===r.status,children:"📱 QR Code"}),t.jsxs(Hd,{$active:"authorized"===r.status,children:[t.jsx(s,{})," Complete"]}),t.jsxs(Hd,{children:[t.jsx(M,{})," Refresh"]})]}),t.jsxs(Yd,{children:[t.jsx(Jd,{children:"Enter this code on your device"}),t.jsx(Gd,{children:Ge.formatUserCode(r.userCode)}),t.jsxs(Kd,{onClick:()=>{navigator.clipboard.writeText(r.userCode),we.info("GasPumpDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]})]}),t.jsx(Xd,{children:t.jsxs(Zd,{children:[t.jsx(Qd,{}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#9ca3af"},children:"Insert your device here"})]})})]}),t.jsxs(ec,{children:[t.jsxs(tc,{$type:"rec90",$active:"rec90"===m,onClick:()=>u("rec90"),children:[t.jsx(rc,{children:"REC 90"}),t.jsx(ic,{children:"--"}),t.jsx(nc,{children:"90"})]}),t.jsxs(tc,{$type:"diesel",$active:"diesel"===m,onClick:()=>u("diesel"),children:[t.jsx(rc,{children:"Diesel"}),t.jsx(ic,{children:"--"}),t.jsx(nc,{children:"Diesel"})]}),t.jsxs(tc,{$type:"regular",$active:"regular"===m,onClick:()=>u("regular"),children:[t.jsx(rc,{children:"Regular"}),t.jsx(ic,{children:"2.99"}),t.jsx(nc,{children:"87"})]}),t.jsxs(tc,{$type:"special",$active:"special"===m,onClick:()=>u("special"),children:[t.jsx(rc,{children:"Special"}),t.jsx(ic,{children:"--"}),t.jsx(nc,{children:"89"})]}),t.jsxs(tc,{$type:"super",$active:"super"===m,onClick:()=>u("super"),children:[t.jsx(rc,{children:"Super+"}),t.jsx(ic,{children:"--"}),t.jsx(nc,{children:"93"})]})]}),t.jsxs(oc,{children:[t.jsx(ac,{children:"QR Code (for mobile apps)"}),t.jsx(sc,{children:t.jsx(n,{value:r.verificationUriComplete,size:200,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),t.jsxs(dc,{$status:r.status,children:[t.jsx(cc,{children:(()=>{switch(r.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(lc,{children:(()=>{switch(r.status){case"pending":return"AUTHORIZATION PENDING";case"authorized":return"AUTHORIZATION COMPLETE";case"denied":return"AUTHORIZATION DENIED";case"expired":return"AUTHORIZATION EXPIRED";default:return"UNKNOWN STATUS"}})()}),t.jsx(pc,{children:Ge.getStatusMessage(r)})]}),t.jsxs(mc,{children:[t.jsxs(uc,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(r.verificationUri),we.info("GasPumpDeviceFlow","Verification URI copied to clipboard")},children:[t.jsx(o,{})," Copy URI"]}),t.jsxs(uc,{$variant:"primary",onClick:()=>{window.open(r.verificationUriComplete,"_blank"),we.info("GasPumpDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open Authorization"]})]}),"authorized"===r.status&&t.jsx("div",{style:{background:"white",border:"3px solid #10b981",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"1.5rem"},children:t.jsxs("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#10b981",textAlign:"center",marginBottom:"1rem"},children:[t.jsx(s,{style:{marginRight:"0.5rem"}}),"Authorization Successful!"]})}),t.jsx(fc,{children:t.jsx(hc,{children:"🔐 OAuth"})})]}),t.jsx(_e,{tokens:r.tokens,backgroundColor:"rgba(255, 255, 255, 0.95)",borderColor:"#e2e8f0",headerTextColor:"#1e293b"})]})},xc=ve.div`
  background: linear-gradient(135deg, #2c2c2c 0%, #404040 50%, #2c2c2c 100%);
  border-radius: 0.5rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 3px solid #555555;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.02) 50%, transparent 70%);
    pointer-events: none;
  }
`,bc=ve.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
  border: 2px solid #666666;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
`,vc=ve.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,wc=ve.div`
  font-size: 0.875rem;
  color: #cccccc;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,yc=ve.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`,kc=ve.div`
  background: ${e=>e.$active?e.$color:"#333333"};
  color: ${e=>e.$active?"#ffffff":"#666666"};
  border: 2px solid ${e=>e.$active?e.$color:"#555555"};
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  min-width: 80px;
`,jc=ve.div`
  background: #000000;
  border: 3px solid #666666;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
`,Cc=ve.div`
  color: #00ff00;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,zc=ve.div`
  background: #000000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2rem;
  font-weight: 700;
  padding: 1rem;
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 1px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
`,Sc=ve.div`
  background: #1a1a1a;
  border: 2px solid #666666;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1.5rem;
`,$c=ve.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Ic=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`,Tc=ve.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`,Ac=ve.button`
  background: ${e=>{switch(e.$variant){case"primary":return"#0066cc";case"secondary":default:return"#404040";case"danger":return"#cc0000"}}};
  color: white;
  border: 2px solid ${e=>{switch(e.$variant){case"primary":return"#0052a3";case"secondary":default:return"#555555";case"danger":return"#990000"}}};
  border-radius: 0.25rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &:hover {
    background: ${e=>{switch(e.$variant){case"primary":return"#0052a3";case"secondary":default:return"#555555";case"danger":return"#990000"}}};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
`,Rc=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)";case"authorized":return"linear-gradient(135deg, #00ff00 0%, #32cd32 100%)";case"denied":return"linear-gradient(135deg, #ff0000 0%, #dc143c 100%)";default:return"linear-gradient(135deg, #666666 0%, #404040 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#ff8c00";case"authorized":return"#32cd32";case"denied":return"#dc143c";default:return"#404040"}}};
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1rem;
`,Oc=ve.div`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`,Uc=ve.div`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Pc=ve.div`
  font-size: 0.75rem;
  color: #ffffff;
`,Dc=ve.div`
  background: #1a1a1a;
  color: #cccccc;
  border: 1px solid #666666;
  border-radius: 0.25rem;
  padding: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-align: center;
  margin-bottom: 0.5rem;
`,Fc=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>t.jsxs(t.Fragment,{children:[t.jsxs(xc,{children:[t.jsxs(bc,{children:[t.jsx(vc,{children:"Industrial IoT Controller"}),t.jsx(wc,{children:"Device Authorization System"})]}),t.jsxs(yc,{children:[t.jsx(kc,{$active:"pending"===e.status,$color:"#ffa500",children:"Pending"}),t.jsx(kc,{$active:"authorized"===e.status,$color:"#00ff00",children:"Authorized"}),t.jsx(kc,{$active:"denied"===e.status,$color:"#ff0000",children:"Denied"}),t.jsx(kc,{$active:"expired"===e.status,$color:"#666666",children:"Expired"})]}),t.jsxs(jc,{children:[t.jsx(Cc,{children:"Authorization Code"}),t.jsx(zc,{children:Ge.formatUserCode(e.userCode)})]}),t.jsxs(Sc,{children:[t.jsx($c,{children:"QR Code Scanner"}),t.jsx(Ic,{children:t.jsx(n,{value:e.verificationUriComplete,size:160,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),t.jsxs(Tc,{children:[t.jsxs(Ac,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("IndustrialIoTControllerDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(Ac,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.verificationUri),we.info("IndustrialIoTControllerDeviceFlow","Verification URI copied to clipboard")},children:[t.jsx(o,{})," Copy URI"]}),t.jsxs(Ac,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("IndustrialIoTControllerDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open Auth"]})]}),t.jsxs(Rc,{$status:e.status,children:[t.jsx(Oc,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(Uc,{children:(()=>{switch(e.status){case"pending":return"AUTH PENDING";case"authorized":return"AUTH COMPLETE";case"denied":return"AUTH DENIED";case"expired":return"AUTH EXPIRED";default:return"UNKNOWN"}})()}),t.jsx(Pc,{children:Ge.getStatusMessage(e)})]}),"authorized"===e.status&&t.jsx("div",{style:{background:"#1a1a1a",border:"2px solid #00ff00",borderRadius:"0.5rem",padding:"1rem",marginTop:"1rem"},children:t.jsx(Dc,{children:"Authorization Successful"})})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(0, 0, 0, 0.4)",borderColor:"#374151",headerTextColor:"#00ff00"})]}),Ec=ve.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.4),
    0 10px 10px -5px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 2px solid #ec4899;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(236, 72, 153, 0.05) 50%, transparent 70%);
    pointer-events: none;
  }
`,_c=ve.div`
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  border: 2px solid #ec4899;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
`,Nc=ve.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #f472b6;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(244, 114, 182, 0.5);
`,Mc=ve.div`
  font-size: 1rem;
  color: #f9a8d4;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,qc=ve.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`,Bc=ve.div`
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: ${e=>e.$active?e.$color:"#374151"};
  box-shadow: ${e=>e.$active?`0 0 15px ${e.$color}`:"none"};
  animation: ${e=>e.$active?"serverBlink 2s infinite":"none"};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    border-radius: 1px;
    background: ${e=>e.$active?"#ffffff":"transparent"};
    animation: ${e=>e.$active?"innerBlink 1s infinite":"none"};
  }
  
  @keyframes serverBlink {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.6; 
      transform: scale(1.05);
    }
  }
  
  @keyframes innerBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }
`,Lc=ve.div`
  background: linear-gradient(135deg, #000000 0%, #1e293b 100%);
  border: 3px solid #ec4899;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(236, 72, 153, 0.2);
`,Vc=ve.div`
  color: #ec4899;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,Wc=ve.div`
  background: #000000;
  color: #06b6d4;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #06b6d4;
  border: 2px solid #06b6d4;
  box-shadow: 
    inset 0 0 20px rgba(6, 182, 212, 0.2),
    0 0 20px rgba(6, 182, 212, 0.3);
`,Hc=ve.div`
  background: #1e293b;
  border: 2px solid #ec4899;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`,Yc=ve.div`
  font-size: 1rem;
  font-weight: 600;
  color: #ec4899;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Jc=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`,Gc=ve.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`,Kc=ve.button`
  background: ${e=>{switch(e.$variant){case"primary":return"#ec4899";case"secondary":default:return"#374151";case"success":return"#06b6d4";case"danger":return"#ef4444"}}};
  color: white;
  border: 2px solid ${e=>{switch(e.$variant){case"primary":return"#db2777";case"secondary":default:return"#4b5563";case"success":return"#0891b2";case"danger":return"#dc2626"}}};
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`,Xc=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";case"authorized":return"linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)";case"denied":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";default:return"linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#d97706";case"authorized":return"#0891b2";case"denied":return"#dc2626";default:return"#4b5563"}}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`,Zc=ve.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`,Qc=ve.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,el=ve.div`
  font-size: 0.875rem;
  color: #ffffff;
`,tl=ve.div`
  background: linear-gradient(135deg, #312e81 0%, #1e1b4b 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #ec4899;
`,rl=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>t.jsxs(t.Fragment,{children:[t.jsxs(Ec,{children:[t.jsxs(_c,{children:[t.jsxs(Nc,{children:[t.jsx(T,{style:{marginRight:"0.5rem"}}),"MCP Server Console"]}),t.jsx(Mc,{children:"Model Context Protocol Server Authorization"})]}),t.jsxs(qc,{children:[t.jsx(Bc,{$active:"pending"===e.status,$color:"#f59e0b"}),t.jsx(Bc,{$active:"authorized"===e.status,$color:"#06b6d4"}),t.jsx(Bc,{$active:"denied"===e.status,$color:"#ef4444"}),t.jsx(Bc,{$active:"expired"===e.status,$color:"#6b7280"})]}),t.jsxs(Lc,{children:[t.jsx(Vc,{children:"Context Authorization Token"}),t.jsx(Wc,{children:Ge.formatUserCode(e.userCode)})]}),t.jsxs(Hc,{children:[t.jsxs(Yc,{children:[t.jsx(Z,{style:{marginRight:"0.5rem"}}),"Context Bridge Scanner"]}),t.jsx(Jc,{children:t.jsx(n,{value:e.verificationUriComplete,size:180,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),t.jsxs(Gc,{children:[t.jsxs(Kc,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("MCPServerDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Token"]}),t.jsxs(Kc,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.verificationUri),we.info("MCPServerDeviceFlow","Verification URI copied to clipboard")},children:[t.jsx(o,{})," Copy URI"]}),t.jsxs(Kc,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("MCPServerDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open in Browser"]})]}),t.jsxs(Xc,{$status:e.status,children:[t.jsx(Zc,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(Qc,{children:(()=>{switch(e.status){case"pending":return"CONTEXT AUTHORIZATION";case"authorized":return"MCP SERVER AUTHORIZED";case"denied":return"AUTHORIZATION DENIED";case"expired":return"SESSION EXPIRED";default:return"UNKNOWN STATUS"}})()}),t.jsx(el,{children:Ge.getStatusMessage(e)})]}),"authorized"===e.status&&t.jsx("div",{style:{background:"#1e293b",border:"2px solid #06b6d4",borderRadius:"0.75rem",padding:"1.5rem",marginTop:"1rem"},children:t.jsxs("div",{style:{fontSize:"1.25rem",fontWeight:"700",color:"#06b6d4",textAlign:"center",marginBottom:"1rem",textTransform:"uppercase",letterSpacing:"0.05em"},children:[t.jsx(Q,{style:{marginRight:"0.5rem"}}),"MCP Server Authorized!"]})}),t.jsx(tl,{})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(0, 0, 0, 0.4)",borderColor:"#374151",headerTextColor:"#06b6d4"})]}),il=ve.div`
  background: linear-gradient(135deg, #5a5a5c 0%, #8e8e93 10%, #5a5a5c 100%);
  border-radius: 3.5rem;
  padding: 0.25rem;
  margin: 2rem 0;
  box-shadow: 
    0 35px 70px rgba(0, 0, 0, 0.6),
    0 15px 30px rgba(0, 0, 0, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.3),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: visible;
  border: 2px solid #6e6e73;
  max-width: 390px;
  margin-left: auto;
  margin-right: auto;
  color: #1f2937;
  
  /* iPhone 17 Pro Triple Camera Bump */
  &::before {
    content: '';
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, #3a3a3c 0%, #2c2c2e 100%);
    border-radius: 1.25rem;
    z-index: 11;
    box-shadow: 
      0 4px 8px rgba(0, 0, 0, 0.4),
      inset 0 1px 2px rgba(255, 255, 255, 0.1);
    
    /* Camera lenses */
    background-image: 
      radial-gradient(circle at 25% 30%, #1a1a1a 18%, transparent 18%),
      radial-gradient(circle at 75% 30%, #1a1a1a 18%, transparent 18%),
      radial-gradient(circle at 50% 70%, #1a1a1a 18%, transparent 18%);
  }
  
  /* iPhone 17 Pro Home Indicator */
  &::after {
    content: '';
    position: absolute;
    bottom: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 4px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 2px;
    z-index: 10;
  }
`,nl=ve.div`
  background: linear-gradient(180deg, #000000 0%, #1c1c1e 100%);
  border-radius: 3.25rem;
  padding: 3rem 1.25rem 1.5rem;
  position: relative;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
  color: #ffffff;
  min-height: 780px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow: hidden;
  
  /* Dynamic Island */
  &::before {
    content: '';
    position: absolute;
    top: 0.75rem;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 35px;
    background: #000000;
    border-radius: 1.75rem;
    z-index: 100;
    box-shadow: 
      inset 0 1px 3px rgba(0, 0, 0, 0.8),
      0 2px 8px rgba(0, 0, 0, 0.5);
  }
  
  /* iOS 18 Status Bar - Time */
  &::after {
    content: '9:41';
    position: absolute;
    top: 0.9rem;
    left: 1.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #ffffff;
    z-index: 101;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  }
`;ve.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #333333;
`,ve.div`
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
`,ve.div`
  display: flex;
  gap: 0.25rem;
  color: #ffffff;
  font-size: 0.75rem;
`,ve.div`
  width: 20px;
  height: 10px;
  border: 1px solid #ffffff;
  border-radius: 2px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    right: -3px;
    top: 2px;
    width: 2px;
    height: 6px;
    background: #ffffff;
    border-radius: 0 1px 1px 0;
  }
`;const ol=ve.div`
  position: absolute;
  top: 0.9rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  z-index: 101;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
`,al=ve.div`
  width: 18px;
  height: 12px;
  background: linear-gradient(to right, 
    #ffffff 0%, #ffffff 20%, transparent 20%, transparent 25%,
    #ffffff 25%, #ffffff 45%, transparent 45%, transparent 50%,
    #ffffff 50%, #ffffff 70%, transparent 70%, transparent 75%,
    #ffffff 75%, #ffffff 95%);
`,sl=ve.div`
  font-size: 0.75rem;
  color: #ffffff;
  font-weight: 600;
`,dl=ve.div`
  width: 24px;
  height: 11px;
  border: 2px solid #ffffff;
  border-radius: 3px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    width: 80%;
    height: 60%;
    background: #34c759;
    border-radius: 1px;
  }
  
  &::after {
    content: '';
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 5px;
    background: #ffffff;
    border-radius: 0 2px 2px 0;
  }
`,cl=ve.div`
  text-align: center;
  margin-bottom: 1.5rem;
  margin-top: 2rem;
`,ll=ve.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
`,pl=ve.div`
  font-size: 0.875rem;
  color: #cccccc;
`,ml=ve.div`
  background: rgba(120, 120, 128, 0.16);
  color: #0a84ff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Mono', monospace;
  font-size: 2rem;
  font-weight: 700;
  padding: 1.5rem 1rem;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.15em;
  text-align: center;
  border: 1px solid rgba(120, 120, 128, 0.24);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
`,ul=ve.div`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(120, 120, 128, 0.24);
  border-radius: 1rem;
  padding: 1.25rem;
  text-align: center;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(10px);
`,fl=ve.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #8e8e93;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
`,hl=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`,gl=ve.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
`,xl=ve.button`
  background: ${e=>"primary"===e.$variant?"#0a84ff":"rgba(120, 120, 128, 0.24)"};
  color: ${e=>"primary"===e.$variant?"#ffffff":"#0a84ff"};
  border: none;
  border-radius: 0.75rem;
  padding: 0.875rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  box-shadow: ${e=>"primary"===e.$variant?"0 2px 8px rgba(10, 132, 255, 0.4)":"0 1px 3px rgba(0, 0, 0, 0.2)"};
  
  &:hover {
    background: ${e=>"primary"===e.$variant?"#0077ed":"rgba(120, 120, 128, 0.32)"};
    transform: scale(0.98);
  }
  
  &:active {
    transform: scale(0.96);
    opacity: 0.8;
  }
`,bl=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)";case"authorized":return"linear-gradient(135deg, #00ff00 0%, #32cd32 100%)";case"denied":return"linear-gradient(135deg, #ff0000 0%, #dc143c 100%)";default:return"linear-gradient(135deg, #666666 0%, #404040 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#ff8c00";case"authorized":return"#32cd32";case"denied":return"#dc143c";default:return"#404040"}}};
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1rem;
`,vl=ve.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,wl=ve.div`
  font-size: 0.75rem;
  color: #ffffff;
`,yl=ve.div`
  background: #333333;
  border: 2px solid #666666;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 1.25rem;
`,kl=({state:r,onStateUpdate:i,onComplete:d,onError:c})=>{const[l,p]=e.useState(new Date);e.useEffect(()=>{const e=setInterval(()=>{p(new Date)},1e3);return()=>clearInterval(e)},[]);return t.jsxs(t.Fragment,{children:[t.jsxs(il,{children:[t.jsxs(nl,{children:[t.jsxs(ol,{children:[t.jsx(al,{}),t.jsx(sl,{children:"Wi-Fi"}),t.jsx(dl,{})]}),t.jsxs(cl,{children:[t.jsx(ll,{children:"Device Authorization"}),t.jsx(pl,{children:"iPhone 17 Pro"})]}),t.jsx(ml,{children:Ge.formatUserCode(r.userCode)}),t.jsxs(ul,{children:[t.jsx(fl,{children:"QR Code"}),t.jsx(hl,{children:t.jsx(n,{value:r.verificationUriComplete,size:120,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),t.jsxs(gl,{children:[t.jsxs(xl,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(r.userCode),we.info("MobilePhoneDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy"]}),t.jsxs(xl,{$variant:"primary",onClick:()=>{window.open(r.verificationUriComplete,"_blank"),we.info("MobilePhoneDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open"]})]}),t.jsxs(bl,{$status:r.status,children:[t.jsx(vl,{children:(()=>{switch(r.status){case"pending":return"AUTHORIZATION PENDING";case"authorized":return"AUTHORIZATION COMPLETE";case"denied":return"AUTHORIZATION DENIED";case"expired":return"AUTHORIZATION EXPIRED";default:return"UNKNOWN STATUS"}})()}),t.jsx(wl,{children:Ge.getStatusMessage(r)})]}),"authorized"===r.status&&r.tokens&&t.jsx("div",{style:{background:"#1a1a1a",border:"2px solid #00ff00",borderRadius:"0.75rem",padding:"1rem",marginTop:"1rem"},children:t.jsxs("div",{style:{fontSize:"0.875rem",fontWeight:"700",color:"#00ff00",textAlign:"center",marginBottom:"1rem",textTransform:"uppercase",letterSpacing:"0.05em"},children:[t.jsx(s,{style:{marginRight:"0.5rem"}}),"Authorization Complete!"]})})]}),t.jsx(yl,{children:"🏠"})]}),t.jsx(_e,{tokens:r.tokens,backgroundColor:"#000000",borderColor:"#1f2937",headerTextColor:"#ffffff"})]})},jl=ve.div`
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 2rem 0;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 2px solid #333333;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  color: #ffffff;
  
  /* Square branding */
  &::before {
    content: 'SQUARE';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #00d4aa;
    letter-spacing: 1px;
    z-index: 2;
  }
  
  /* Square terminal design elements */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 0.5rem;
    background: linear-gradient(90deg, transparent 0%, rgba(0, 212, 170, 0.05) 50%, transparent 100%);
    pointer-events: none;
  }
`,Cl=ve.div`
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  border: 2px solid #34d399;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
`,zl=ve.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #34d399;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(52, 211, 153, 0.5);
`,Sl=ve.div`
  font-size: 1rem;
  color: #6ee7b7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,$l=ve.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`,Il=ve.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${e=>e.$active?e.$color:"#374151"};
  box-shadow: ${e=>e.$active?`0 0 20px ${e.$color}`:"none"};
  animation: ${e=>e.$active?"paymentPulse 2s infinite":"none"};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${e=>e.$active?"#ffffff":"transparent"};
    animation: ${e=>e.$active?"innerPulse 1.5s infinite":"none"};
  }
  
  @keyframes paymentPulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.7; 
      transform: scale(1.1);
    }
  }
  
  @keyframes innerPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`,Tl=ve.div`
  background: linear-gradient(135deg, #000000 0%, #1e293b 100%);
  border: 3px solid #34d399;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(52, 211, 153, 0.2);
`,Al=ve.div`
  color: #34d399;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,Rl=ve.div`
  background: #000000;
  color: #f59e0b;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #f59e0b;
  border: 2px solid #f59e0b;
  box-shadow: 
    inset 0 0 20px rgba(245, 158, 11, 0.2),
    0 0 20px rgba(245, 158, 11, 0.3);
`,Ol=ve.div`
  background: #1e293b;
  border: 2px solid #34d399;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`,Ul=ve.div`
  font-size: 1rem;
  font-weight: 600;
  color: #34d399;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Pl=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`,Dl=ve.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`,Fl=ve.button`
  background: ${e=>{switch(e.$variant){case"primary":return"#34d399";case"secondary":default:return"#374151";case"success":return"#f59e0b";case"danger":return"#ef4444"}}};
  color: white;
  border: 2px solid ${e=>{switch(e.$variant){case"primary":return"#10b981";case"secondary":default:return"#4b5563";case"success":return"#d97706";case"danger":return"#dc2626"}}};
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`,El=ve.div`
  background: ${e=>{switch(e.$status){case"pending":case"authorized":return"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";case"denied":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";default:return"linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":case"authorized":return"#d97706";case"denied":return"#dc2626";default:return"#4b5563"}}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`,_l=ve.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`,Nl=ve.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Ml=ve.div`
  font-size: 0.875rem;
  color: #ffffff;
`,ql=ve.div`
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #34d399;
`,Bl=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>t.jsxs(t.Fragment,{children:[t.jsxs(jl,{children:[t.jsxs(Cl,{children:[t.jsxs(zl,{children:[t.jsx(p,{style:{marginRight:"0.5rem"}}),"POS Terminal"]}),t.jsx(Sl,{children:"Secure Payment Authorization System"})]}),t.jsxs($l,{children:[t.jsx(Il,{$active:"pending"===e.status,$color:"#f59e0b"}),t.jsx(Il,{$active:"authorized"===e.status,$color:"#f59e0b"}),t.jsx(Il,{$active:"denied"===e.status,$color:"#ef4444"}),t.jsx(Il,{$active:"expired"===e.status,$color:"#6b7280"})]}),t.jsxs(Tl,{children:[t.jsx(Al,{children:"Payment Authorization Code"}),t.jsx(Rl,{children:Ge.formatUserCode(e.userCode)})]}),t.jsxs(Ol,{children:[t.jsxs(Ul,{children:[t.jsx(ee,{style:{marginRight:"0.5rem"}}),"Payment Scanner"]}),t.jsx(Pl,{children:t.jsx(n,{value:e.verificationUriComplete,size:180,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),t.jsxs(Dl,{children:[t.jsxs(Fl,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("POSTerminalDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(Fl,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.verificationUri),we.info("POSTerminalDeviceFlow","Verification URI copied to clipboard")},children:[t.jsx(o,{})," Copy URI"]}),t.jsxs(Fl,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("POSTerminalDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open in Browser"]})]}),t.jsxs(El,{$status:e.status,children:[t.jsx(_l,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(Nl,{children:(()=>{switch(e.status){case"pending":return"AWAITING AUTHORIZATION";case"authorized":return"TERMINAL AUTHORIZED";case"denied":return"AUTHORIZATION DENIED";case"expired":return"SESSION EXPIRED";default:return"UNKNOWN STATUS"}})()}),t.jsx(Ml,{children:Ge.getStatusMessage(e)})]}),"authorized"===e.status&&t.jsxs("div",{style:{background:"linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",border:"3px solid #f97316",borderRadius:"1rem",padding:"2rem",marginTop:"1rem",boxShadow:"0 20px 25px -5px rgba(0, 0, 0, 0.1)",color:"#1e293b"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem",paddingBottom:"1rem",borderBottom:"2px solid #cbd5e1"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx("div",{style:{width:"40px",height:"40px",background:"linear-gradient(135deg, #f97316 0%, #ea580c 100%)",borderRadius:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"1.25rem"},children:"💳"}),t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"1.25rem",fontWeight:"700",color:"#1e293b"},children:"Square Point of Sale"}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#64748b"},children:"Terminal #001 • Register Active"})]})]}),t.jsx("div",{style:{background:"#10b981",color:"white",padding:"0.5rem 1rem",borderRadius:"0.5rem",fontSize:"0.875rem",fontWeight:"600"},children:"Online"})]}),t.jsxs("div",{style:{background:"white",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"1.5rem",border:"1px solid #e2e8f0",boxShadow:"0 4px 6px -1px rgba(0, 0, 0, 0.1)"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"1rem"},children:[t.jsx("div",{style:{fontSize:"1.25rem"},children:"🛒"}),t.jsx("h3",{style:{margin:0,fontSize:"1rem",fontWeight:"600"},children:"Current Sale"})]}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem",marginBottom:"1rem"},children:[t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.75rem",background:"#f8fafc",borderRadius:"0.5rem",border:"1px solid #e2e8f0"},children:[t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#1e293b"},children:"Large Coffee"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#64748b"},children:"Hot • Extra shot"})]}),t.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#1e293b"},children:"$4.50"})]}),t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.75rem",background:"#f8fafc",borderRadius:"0.5rem",border:"1px solid #e2e8f0"},children:[t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#1e293b"},children:"Blueberry Muffin"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#64748b"},children:"Fresh baked"})]}),t.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#1e293b"},children:"$3.25"})]})]}),t.jsxs("div",{style:{borderTop:"2px solid #e2e8f0",paddingTop:"1rem"},children:[t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"},children:[t.jsx("span",{style:{fontSize:"0.875rem",color:"#64748b"},children:"Subtotal"}),t.jsx("span",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#1e293b"},children:"$7.75"})]}),t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"},children:[t.jsx("span",{style:{fontSize:"0.875rem",color:"#64748b"},children:"Tax (8.5%)"}),t.jsx("span",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#1e293b"},children:"$0.66"})]}),t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.75rem",background:"#f97316",borderRadius:"0.5rem",color:"white"},children:[t.jsx("span",{style:{fontSize:"1rem",fontWeight:"700"},children:"Total"}),t.jsx("span",{style:{fontSize:"1.25rem",fontWeight:"700"},children:"$8.41"})]})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:"1rem",marginBottom:"1.5rem"},children:[t.jsxs("button",{style:{background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",color:"white",border:"none",borderRadius:"0.75rem",padding:"1.5rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem",boxShadow:"0 4px 6px -1px rgba(0, 0, 0, 0.1)"},children:[t.jsx("div",{style:{fontSize:"2rem"},children:"💳"}),t.jsx("div",{children:"Card Payment"})]}),t.jsxs("button",{style:{background:"linear-gradient(135deg, #10b981 0%, #059669 100%)",color:"white",border:"none",borderRadius:"0.75rem",padding:"1.5rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem",boxShadow:"0 4px 6px -1px rgba(0, 0, 0, 0.1)"},children:[t.jsx("div",{style:{fontSize:"2rem"},children:"📱"}),t.jsx("div",{children:"Mobile Pay"})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"1rem"},children:[t.jsxs("button",{style:{background:"linear-gradient(135deg, #f97316 0%, #ea580c 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(h,{})," Add Item"]}),t.jsxs("button",{style:{background:"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(D,{})," Void"]}),t.jsxs("button",{style:{background:"linear-gradient(135deg, #10b981 0%, #059669 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(te,{})," Receipt"]})]})]}),t.jsx(ql,{})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(0, 0, 0, 0.2)",borderColor:"#333333",headerTextColor:"#ffffff"})]}),Ll=ve.div`
  background: ${({$authorized:e})=>e?"linear-gradient(135deg, #00ff88 0%, #00cc6a 50%, #00ff88 100%)":"linear-gradient(135deg, #00a86b 0%, #00cc6a 50%, #00a86b 100%)"};
  border-radius: 1rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.2),
    0 0 0 1px ${({$authorized:e})=>e?"#00ff88":"#00a86b"},
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  border: 2px solid ${({$authorized:e})=>e?"#00ff88":"#00a86b"};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  color: #ffffff;
  transition: all 0.3s ease;
  
  /* HP Smart App green interface with scanline effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1rem;
    background: ${({$authorized:e})=>e?"linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 204, 106, 0.1) 100%)":"linear-gradient(135deg, rgba(0, 168, 107, 0.9) 0%, rgba(0, 204, 106, 0.8) 100%)"};
    pointer-events: none;
  }
  
  /* HP logo area - top left corner */
  &::after {
    content: 'HP';
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 1.25rem;
    font-weight: 800;
    color: #000000;
    letter-spacing: 2px;
    z-index: 3;
  }
`,Vl=ve.div`
  background: ${({$authorized:e})=>e?"linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)":"linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"};
  border: 1px solid ${({$authorized:e})=>e?"#00ff88":"#3a3a3c"};
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  color: ${({$authorized:e})=>e?"#000000":"#ffffff"};
  font-weight: 600;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
`,Wl=ve.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({$authorized:e})=>e?"#000000":"#ffffff"};
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
`,Hl=ve.div`
  font-size: 1rem;
  color: #67e8f9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Yl=ve.div`
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  margin: 1rem auto;
  max-width: fit-content;
  backdrop-filter: blur(10px);
`,Jl=ve.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({$variant:e})=>{switch(e){case"move":case"back":default:return"#6b7280";case"expand":return"#3b82f6";case"delete":return"#ef4444";case"forward":return"#10b981"}}};
  color: white;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`,Gl=ve.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`,Kl=ve.div`
  width: 14px;
  height: 14px;
  border-radius: 2px;
  background: ${e=>e.$active?e.$color:"#374151"};
  box-shadow: ${e=>e.$active?`0 0 15px ${e.$color}`:"none"};
  animation: ${e=>e.$active?"printerBlink 2s infinite":"none"};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    border-radius: 1px;
    background: ${e=>e.$active?"#ffffff":"transparent"};
    animation: ${e=>e.$active?"innerBlink 1s infinite":"none"};
  }
  
  @keyframes printerBlink {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.6; 
      transform: scale(1.05);
    }
  }
  
  @keyframes innerBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }
`,Xl=ve.div`
  background: linear-gradient(135deg, #000000 0%, #1e293b 100%);
  border: 3px solid #22d3ee;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(34, 211, 238, 0.2);
`,Zl=ve.div`
  color: #22d3ee;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,Ql=ve.div`
  background: #000000;
  color: #f97316;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #f97316;
  border: 2px solid #f97316;
  box-shadow: 
    inset 0 0 20px rgba(249, 115, 22, 0.2),
    0 0 20px rgba(249, 115, 22, 0.3);
`,ep=ve.div`
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 2;
`,tp=ve.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,rp=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
`,ip=ve.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`,np=ve.button`
  background: ${e=>{switch(e.$variant){case"primary":return"#22d3ee";case"secondary":default:return"#374151";case"success":return"#f97316";case"danger":return"#ef4444"}}};
  color: white;
  border: 2px solid ${e=>{switch(e.$variant){case"primary":return"#06b6d4";case"secondary":default:return"#4b5563";case"success":return"#ea580c";case"danger":return"#dc2626"}}};
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`,op=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";case"authorized":return"linear-gradient(135deg, #f97316 0%, #ea580c 100%)";case"denied":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";default:return"linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#d97706";case"authorized":return"#ea580c";case"denied":return"#dc2626";default:return"#4b5563"}}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`,ap=ve.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`,sp=ve.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,dp=ve.div`
  font-size: 0.875rem;
  color: #ffffff;
`,cp=ve.div`
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #22d3ee;
`,lp=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>{const p="authorized"===e.status;return t.jsxs(t.Fragment,{children:[t.jsxs(Ll,{$authorized:p,children:[t.jsxs(Vl,{$authorized:p,children:[t.jsxs(Wl,{$authorized:p,children:[t.jsx(re,{style:{marginRight:"0.5rem"}}),"HP LaserJet MFP M140we"]}),t.jsx(Hl,{children:"Secure Document Release System"})]}),t.jsxs(Gl,{children:[t.jsx(Kl,{$active:"pending"===e.status,$color:"#f59e0b"}),t.jsx(Kl,{$active:"authorized"===e.status,$color:"#f97316"}),t.jsx(Kl,{$active:"denied"===e.status,$color:"#ef4444"}),t.jsx(Kl,{$active:"expired"===e.status,$color:"#6b7280"})]}),t.jsxs(Yl,{children:[t.jsx(Jl,{$variant:"move",title:"Move",children:t.jsx(B,{})}),t.jsx(Jl,{$variant:"expand",title:"Expand",children:t.jsx(L,{})}),t.jsx(Jl,{$variant:"back",title:"Back",children:t.jsx(P,{})}),t.jsx(Jl,{$variant:"delete",title:"Delete",children:t.jsx(H,{})}),t.jsx(Jl,{$variant:"forward",title:"Forward",children:t.jsx(y,{})})]}),t.jsxs(Xl,{style:{position:"relative",zIndex:2},children:[t.jsx(Zl,{children:"Document Authorization Code"}),t.jsx(Ql,{children:Ge.formatUserCode(e.userCode)})]}),e.verificationUriComplete&&t.jsxs(ep,{children:[t.jsxs(tp,{children:[t.jsx(te,{style:{marginRight:"0.5rem"}}),"Document Scanner"]}),t.jsx(rp,{children:t.jsx(n,{value:e.verificationUriComplete,size:180,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),e.verificationUri&&t.jsx("div",{style:{background:"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",borderRadius:"0.75rem",padding:"0.75rem 1rem",marginBottom:"1rem",textAlign:"center",boxShadow:"0 8px 16px rgba(59, 130, 246, 0.3)",border:"2px solid #1e40af"},children:t.jsxs(np,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("SmartPrinterDeviceFlow","Verification URI opened in new tab")},style:{fontSize:"1rem",padding:"0.75rem 1.5rem",minWidth:"200px",background:"white",color:"#2563eb",border:"2px solid white",fontWeight:"700",boxShadow:"0 4px 12px rgba(0, 0, 0, 0.2)"},children:[t.jsx(a,{size:18})," Open in Browser"]})}),t.jsxs(ip,{children:[t.jsxs(np,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("SmartPrinterDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(np,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.verificationUri),we.info("SmartPrinterDeviceFlow","Verification URI copied to clipboard")},children:[t.jsx(o,{})," Copy URI"]})]}),t.jsxs(op,{$status:e.status,children:[t.jsx(ap,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(sp,{children:(()=>{switch(e.status){case"pending":return"CONNECTING TO ACCOUNT";case"authorized":return"PRINTER AUTHORIZED";case"denied":return"AUTHORIZATION DENIED";case"expired":return"SESSION EXPIRED";default:return"UNKNOWN STATUS"}})()}),t.jsx(dp,{children:Ge.getStatusMessage(e)})]}),"authorized"===e.status&&e.tokens&&t.jsxs("div",{style:{background:"linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",border:"3px solid #22d3ee",borderRadius:"1rem",padding:"2rem",marginTop:"1rem",boxShadow:"0 20px 25px -5px rgba(0, 0, 0, 0.1)"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem",paddingBottom:"1rem",borderBottom:"2px solid #cbd5e1"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx("div",{style:{width:"40px",height:"40px",background:"linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",borderRadius:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"1.25rem"},children:"🖨️"}),t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"1.25rem",fontWeight:"700",color:"#1e293b"},children:"HP OfficeJet Pro 9015e"}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#64748b"},children:"All-in-One Printer • Ready"})]})]}),t.jsx("div",{style:{background:"#10b981",color:"white",padding:"0.5rem 1rem",borderRadius:"0.5rem",fontSize:"0.875rem",fontWeight:"600"},children:"Online"})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"1rem",marginBottom:"1.5rem"},children:[t.jsxs("div",{style:{background:"white",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #e2e8f0",textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.5rem",marginBottom:"0.5rem"},children:"📄"}),t.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#1e293b"},children:"Paper"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#10b981"},children:"Full"})]}),t.jsxs("div",{style:{background:"white",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #e2e8f0",textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.5rem",marginBottom:"0.5rem"},children:"🖨️"}),t.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#1e293b"},children:"Ink"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#10b981"},children:"85%"})]}),t.jsxs("div",{style:{background:"white",padding:"1rem",borderRadius:"0.5rem",border:"1px solid #e2e8f0",textAlign:"center"},children:[t.jsx("div",{style:{fontSize:"1.5rem",marginBottom:"0.5rem"},children:"📶"}),t.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#1e293b"},children:"WiFi"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#10b981"},children:"Connected"})]})]}),t.jsxs("div",{style:{background:"white",borderRadius:"0.75rem",padding:"1.5rem",border:"1px solid #e2e8f0",marginBottom:"1.5rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"},children:[t.jsx("h3",{style:{margin:0,fontSize:"1.125rem",fontWeight:"600",color:"#1e293b"},children:"Print Queue"}),t.jsx("div",{style:{background:"#f0f9ff",color:"#0369a1",padding:"0.25rem 0.75rem",borderRadius:"0.375rem",fontSize:"0.75rem",fontWeight:"600"},children:"3 Jobs"})]}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",background:"#f8fafc",borderRadius:"0.5rem",border:"1px solid #e2e8f0"},children:[t.jsx("div",{style:{fontSize:"1.25rem"},children:"📄"}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#1e293b"},children:"Q4_Report_Final.pdf"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#64748b"},children:"From: john.doe@company.com • 12 pages"})]}),t.jsx("div",{style:{background:"#fef3c7",color:"#92400e",padding:"0.25rem 0.5rem",borderRadius:"0.25rem",fontSize:"0.75rem",fontWeight:"600"},children:"Printing"})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",background:"#f8fafc",borderRadius:"0.5rem",border:"1px solid #e2e8f0"},children:[t.jsx("div",{style:{fontSize:"1.25rem"},children:"📊"}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#1e293b"},children:"Sales_Presentation.pptx"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#64748b"},children:"From: sarah.smith@company.com • 8 pages"})]}),t.jsx("div",{style:{background:"#dbeafe",color:"#1e40af",padding:"0.25rem 0.5rem",borderRadius:"0.25rem",fontSize:"0.75rem",fontWeight:"600"},children:"Queued"})]})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:"1rem"},children:[t.jsxs("button",{style:{background:"linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(te,{})," Scan Document"]}),t.jsxs("button",{style:{background:"linear-gradient(135deg, #f97316 0%, #ea580c 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(re,{})," Print Test Page"]})]})]}),t.jsx(cp,{})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(255, 255, 255, 0.95)",borderColor:"#e2e8f0",headerTextColor:"#1e293b"})]})},pp=ve.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.4),
    0 10px 10px -5px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 2px solid #0891b2;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(8, 145, 178, 0.05) 50%, transparent 70%);
    pointer-events: none;
  }
`,mp=ve.div`
  background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%);
  border: 2px solid #22d3ee;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
`,up=ve.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #22d3ee;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
`,fp=ve.div`
  font-size: 1rem;
  color: #67e8f9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,hp=ve.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  align-items: end;
`,gp=ve.div`
  width: 4px;
  height: ${e=>e.$height}px;
  background: ${e=>e.$active?e.$color:"#374151"};
  border-radius: 2px;
  animation: ${e=>e.$active?"audioWave 1.5s infinite":"none"};
  animation-delay: ${e=>.5*Math.random()}s;
  
  @keyframes audioWave {
    0%, 100% { 
      opacity: 0.4; 
      transform: scaleY(0.5);
    }
    50% { 
      opacity: 1; 
      transform: scaleY(1);
    }
  }
`,xp=ve.div`
  background: linear-gradient(135deg, #000000 0%, #1e293b 100%);
  border: 3px solid #22d3ee;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(34, 211, 238, 0.2);
`,bp=ve.div`
  color: #22d3ee;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,vp=ve.div`
  background: #000000;
  color: #f59e0b;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #f59e0b;
  border: 2px solid #f59e0b;
  box-shadow: 
    inset 0 0 20px rgba(245, 158, 11, 0.2),
    0 0 20px rgba(245, 158, 11, 0.3);
`,wp=ve.div`
  background: #1e293b;
  border: 2px solid #22d3ee;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`,yp=ve.div`
  font-size: 1rem;
  font-weight: 600;
  color: #22d3ee;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,kp=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`,jp=ve.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`,Cp=ve.button`
  background: ${e=>{switch(e.$variant){case"primary":return"#22d3ee";case"secondary":default:return"#374151";case"success":return"#f59e0b";case"danger":return"#ef4444"}}};
  color: white;
  border: 2px solid ${e=>{switch(e.$variant){case"primary":return"#06b6d4";case"secondary":default:return"#4b5563";case"success":return"#d97706";case"danger":return"#dc2626"}}};
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`,zp=ve.div`
  background: ${e=>{switch(e.$status){case"pending":case"authorized":return"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";case"denied":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";default:return"linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":case"authorized":return"#d97706";case"denied":return"#dc2626";default:return"#4b5563"}}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`,Sp=ve.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`,$p=ve.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Ip=ve.div`
  font-size: 0.875rem;
  color: #ffffff;
`,Tp=ve.div`
  background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #22d3ee;
`,Ap=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>t.jsxs(t.Fragment,{children:[t.jsxs(pp,{children:[t.jsxs(mp,{children:[t.jsxs(up,{children:[t.jsx(ie,{style:{marginRight:"0.5rem"}}),"Smart Speaker"]}),t.jsx(fp,{children:"Voice-Controlled Authorization System"})]}),t.jsxs(hp,{children:[t.jsx(gp,{$active:"pending"===e.status,$color:"#f59e0b",$height:20}),t.jsx(gp,{$active:"authorized"===e.status,$color:"#f59e0b",$height:30}),t.jsx(gp,{$active:"denied"===e.status,$color:"#ef4444",$height:15}),t.jsx(gp,{$active:"expired"===e.status,$color:"#6b7280",$height:10}),t.jsx(gp,{$active:"pending"===e.status,$color:"#f59e0b",$height:25}),t.jsx(gp,{$active:"authorized"===e.status,$color:"#f59e0b",$height:35}),t.jsx(gp,{$active:"denied"===e.status,$color:"#ef4444",$height:18}),t.jsx(gp,{$active:"expired"===e.status,$color:"#6b7280",$height:12}),t.jsx(gp,{$active:"pending"===e.status,$color:"#f59e0b",$height:22}),t.jsx(gp,{$active:"authorized"===e.status,$color:"#f59e0b",$height:28})]}),t.jsxs(xp,{children:[t.jsx(bp,{children:"Voice Authorization Code"}),t.jsx(vp,{children:Ge.formatUserCode(e.userCode)})]}),t.jsxs(wp,{children:[t.jsxs(yp,{children:[t.jsx(ne,{style:{marginRight:"0.5rem"}}),"Voice Assistant Scanner"]}),t.jsx(kp,{children:t.jsx(n,{value:e.verificationUriComplete,size:180,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),t.jsxs(jp,{children:[t.jsxs(Cp,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("SmartSpeakerDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(Cp,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.verificationUri),we.info("SmartSpeakerDeviceFlow","Verification URI copied to clipboard")},children:[t.jsx(o,{})," Copy URI"]}),t.jsxs(Cp,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("SmartSpeakerDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open in Browser"]})]}),t.jsxs(zp,{$status:e.status,children:[t.jsx(Sp,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx($p,{children:(()=>{switch(e.status){case"pending":return"VOICE PAIRING";case"authorized":return"SPEAKER AUTHORIZED";case"denied":return"AUTHORIZATION DENIED";case"expired":return"SESSION EXPIRED";default:return"UNKNOWN STATUS"}})()}),t.jsx(Ip,{children:Ge.getStatusMessage(e)})]}),"authorized"===e.status&&e.tokens&&t.jsxs("div",{style:{background:"linear-gradient(135deg, #1e293b 0%, #334155 100%)",border:"3px solid #f97316",borderRadius:"1rem",padding:"2rem",marginTop:"1rem",boxShadow:"0 20px 25px -5px rgba(0, 0, 0, 0.3)",color:"white"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem",paddingBottom:"1rem",borderBottom:"2px solid #475569"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx("div",{style:{width:"40px",height:"40px",background:"linear-gradient(135deg, #f97316 0%, #ea580c 100%)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"1.25rem"},children:"🔊"}),t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"1.25rem",fontWeight:"700",color:"white"},children:"Amazon Echo Dot (4th Gen)"}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8"},children:"Smart Speaker • Connected"})]})]}),t.jsx("div",{style:{background:"#10b981",color:"white",padding:"0.5rem 1rem",borderRadius:"0.5rem",fontSize:"0.875rem",fontWeight:"600"},children:"Online"})]}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"1.5rem",border:"1px solid #475569"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1rem"},children:[t.jsx("div",{style:{width:"60px",height:"60px",background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",borderRadius:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem"},children:"🎵"}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{style:{fontSize:"1.125rem",fontWeight:"600",color:"white",marginBottom:"0.25rem"},children:"Now Playing"}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8"},children:'Spotify • "Lofi Hip Hop Radio"'})]}),t.jsx("div",{style:{background:"#f97316",color:"white",padding:"0.5rem",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"},children:t.jsx(z,{size:16})})]}),t.jsx("div",{style:{display:"flex",alignItems:"center",gap:"0.25rem",marginBottom:"0.75rem"},children:[1,2,3,4,5,4,3,2,1,2,3,4,5,4,3,2,1].map((e,r)=>t.jsx("div",{style:{width:"3px",height:4*e+"px",background:"#f97316",borderRadius:"1px",animation:"pulse 1.5s ease-in-out infinite",animationDelay:.1*r+"s"}},r))}),t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.75rem",color:"#94a3b8"},children:[t.jsx("span",{children:"2:34"}),t.jsx("span",{children:"4:12"})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:"1rem",marginBottom:"1.5rem"},children:[t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",padding:"1rem",borderRadius:"0.75rem",border:"1px solid #475569"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"},children:[t.jsx("div",{style:{fontSize:"1.25rem"},children:"💡"}),t.jsx("h3",{style:{margin:0,fontSize:"1rem",fontWeight:"600"},children:"Living Room"})]}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8",marginBottom:"0.5rem"},children:"3 lights • 2 outlets"}),t.jsx("div",{style:{background:"#10b981",color:"white",padding:"0.25rem 0.5rem",borderRadius:"0.25rem",fontSize:"0.75rem",fontWeight:"600",display:"inline-block"},children:"All On"})]}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",padding:"1rem",borderRadius:"0.75rem",border:"1px solid #475569"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"},children:[t.jsx("div",{style:{fontSize:"1.25rem"},children:"🌡️"}),t.jsx("h3",{style:{margin:0,fontSize:"1rem",fontWeight:"600"},children:"Thermostat"})]}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8",marginBottom:"0.5rem"},children:"Nest Learning Thermostat"}),t.jsx("div",{style:{background:"#3b82f6",color:"white",padding:"0.25rem 0.5rem",borderRadius:"0.25rem",fontSize:"0.75rem",fontWeight:"600",display:"inline-block"},children:"72°F • Auto"})]})]}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",borderRadius:"0.75rem",padding:"1.5rem",marginBottom:"1.5rem",border:"1px solid #475569"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"1rem"},children:[t.jsx("div",{style:{fontSize:"1.25rem"},children:"🎤"}),t.jsx("h3",{style:{margin:0,fontSize:"1rem",fontWeight:"600"},children:"Recent Commands"})]}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",background:"rgba(255, 255, 255, 0.05)",borderRadius:"0.5rem"},children:[t.jsx("div",{style:{fontSize:"1rem"},children:"🎵"}),t.jsx("div",{style:{flex:1,fontSize:"0.875rem",color:"#e2e8f0"},children:'"Play relaxing music"'}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#94a3b8"},children:"2 min ago"})]}),t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",background:"rgba(255, 255, 255, 0.05)",borderRadius:"0.5rem"},children:[t.jsx("div",{style:{fontSize:"1rem"},children:"💡"}),t.jsx("div",{style:{flex:1,fontSize:"0.875rem",color:"#e2e8f0"},children:'"Turn off bedroom lights"'}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#94a3b8"},children:"5 min ago"})]})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"1rem"},children:[t.jsxs("button",{style:{background:"linear-gradient(135deg, #f97316 0%, #ea580c 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(ie,{})," Volume"]}),t.jsxs("button",{style:{background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(N,{})," Smart Home"]}),t.jsxs("button",{style:{background:"linear-gradient(135deg, #10b981 0%, #059669 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(q,{})," Settings"]})]})]}),t.jsx(Tp,{})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(255, 255, 255, 0.1)",borderColor:"#475569",headerTextColor:"#e2e8f0"})]}),Rp=ve.div`
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 2rem 0;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 2px solid #333333;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  /* Vizio TV bezel */
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
    border-radius: 0.5rem;
    z-index: -1;
  }
  
  /* Vizio logo area */
  &::after {
    content: 'VIZIO';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 1px;
    z-index: 2;
  }
`,Op=ve.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid #3a3a3c;
  border-radius: 0.25rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  color: #ffffff;
  
  /* Vizio SmartCast interface styling */
  &::before {
    content: 'SmartCast';
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: 0.5px;
    z-index: 2;
  }
`,Up=ve.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: #666666;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,Pp=ve.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${e=>e.$active?"#00ff00":"#ff0000"};
  box-shadow: 0 0 10px ${e=>e.$active?"#00ff00":"#ff0000"};
  margin-right: 0.5rem;
  animation: ${e=>e.$active?"pulse 2s infinite":"none"};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`,Dp=ve.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Fp=ve.div`
  font-size: 1rem;
  color: #cccccc;
  margin-bottom: 2rem;
`,Ep=ve.div`
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 3rem;
  font-weight: 700;
  padding: 2rem 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.3em;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
`,_p=ve.div`
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,Np=ve.div`
  background: #1a1a1a;
  border: 2px solid #333333;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`,Mp=ve.div`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1rem;
  text-transform: uppercase;
`,qp=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`,Bp=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)";case"authorized":return"linear-gradient(135deg, #00ff00 0%, #32cd32 100%)";case"denied":return"linear-gradient(135deg, #ff0000 0%, #dc143c 100%)";default:return"linear-gradient(135deg, #666666 0%, #404040 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#ff8c00";case"authorized":return"#32cd32";case"denied":return"#dc143c";default:return"#404040"}}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`,Lp=ve.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`,Vp=ve.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
`,Wp=ve.div`
  font-size: 0.875rem;
  color: #ffffff;
`,Hp=ve.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
`,Yp=ve.button`
  background: ${e=>"primary"===e.$variant?"#0066cc":"#404040"};
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${e=>"primary"===e.$variant?"#0052a3":"#555555"};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
`,Jp=ve.div`
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  height: 1rem;
  border-radius: 0 0 0.5rem 0.5rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #404040;
`,Gp=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>t.jsxs(t.Fragment,{children:[t.jsxs(Rp,{children:[t.jsxs(Op,{children:[t.jsx(Up,{children:"Smart TV"}),t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"},children:[t.jsx(Pp,{$active:!!e.tokens}),t.jsx(Dp,{children:"Device Authorization"})]}),t.jsx(Fp,{children:"Enter the code below on your device to authorize"}),t.jsx(_p,{children:"Enter this code on your device"}),t.jsx(Ep,{children:Ge.formatUserCode(e.userCode)}),e.verificationUriComplete&&t.jsxs(Np,{children:[t.jsx(Mp,{children:"QR Code (for mobile apps)"}),t.jsx(qp,{children:t.jsx(n,{value:e.verificationUriComplete,size:180,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),t.jsxs(Bp,{$status:e.status,children:[t.jsx(Lp,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(Vp,{children:(()=>{switch(e.status){case"pending":return"AUTHORIZATION PENDING";case"authorized":return"AUTHORIZATION COMPLETE";case"denied":return"AUTHORIZATION DENIED";case"expired":return"AUTHORIZATION EXPIRED";default:return"UNKNOWN STATUS"}})()}),t.jsx(Wp,{children:Ge.getStatusMessage(e)})]}),e.verificationUri&&t.jsx("div",{style:{background:"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",borderRadius:"0.75rem",padding:"0.75rem 1rem",marginBottom:"1rem",textAlign:"center",boxShadow:"0 8px 16px rgba(59, 130, 246, 0.3)",border:"2px solid #1e40af"},children:t.jsxs(Yp,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("SmartTVDeviceFlow","Verification URI opened in new tab")},style:{fontSize:"1rem",padding:"0.75rem 1.5rem",minWidth:"200px",background:"white",color:"#2563eb",border:"2px solid white",fontWeight:"700",boxShadow:"0 4px 12px rgba(0, 0, 0, 0.2)"},children:[t.jsx(a,{size:18})," Open in Browser"]})}),t.jsxs(Hp,{children:[t.jsxs(Yp,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("SmartTVDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(Yp,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.verificationUri),we.info("SmartTVDeviceFlow","Verification URI copied to clipboard")},children:[t.jsx(o,{})," Copy URI"]})]}),"authorized"===e.status&&e.tokens&&t.jsx("div",{style:{background:"rgba(0, 255, 0, 0.1)",border:"2px solid #00ff00",borderRadius:"0.5rem",padding:"1rem",marginTop:"1rem"},children:t.jsxs("div",{style:{fontSize:"1rem",fontWeight:"600",color:"#00ff00",textAlign:"center"},children:[t.jsx(s,{style:{marginRight:"0.5rem"}}),"Authorization Successful!"]})})]}),t.jsx(Jp,{})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(0, 0, 0, 0.4)",borderColor:"#3a3a3c",headerTextColor:"#ffffff"})]}),Kp=ve.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 2rem 0;
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 2px solid #3a3a3c;
  position: relative;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  color: #ffffff;
  
  /* Tesla screen bezel */
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
    border-radius: 0.5rem;
    z-index: -1;
  }
  
  /* Tesla logo area */
  &::after {
    content: 'TESLA';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 1px;
    z-index: 2;
  }
`,Xp=ve.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid #3a3a3c;
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  color: #ffffff;
  font-weight: 600;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
`,Zp=ve.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(252, 165, 165, 0.5);
`,Qp=ve.div`
  font-size: 1rem;
  color: #fecaca;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,em=ve.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`,tm=ve.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${e=>e.$active?e.$color:"#374151"};
  box-shadow: ${e=>e.$active?`0 0 20px ${e.$color}`:"none"};
  animation: ${e=>e.$active?"dashboardPulse 2s infinite":"none"};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${e=>e.$active?"#ffffff":"transparent"};
    animation: ${e=>e.$active?"innerPulse 1.5s infinite":"none"};
  }
  
  @keyframes dashboardPulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.7; 
      transform: scale(1.1);
    }
  }
  
  @keyframes innerPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`,rm=ve.div`
  background: linear-gradient(135deg, #000000 0%, #1e293b 100%);
  border: 3px solid #f87171;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(248, 113, 113, 0.2);
`,im=ve.div`
  color: #f87171;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`,nm=ve.div`
  background: #000000;
  color: #22c55e;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #22c55e;
  border: 2px solid #22c55e;
  box-shadow: 
    inset 0 0 20px rgba(34, 197, 94, 0.2),
    0 0 20px rgba(34, 197, 94, 0.3);
`,om=ve.div`
  background: #1e293b;
  border: 2px solid #f87171;
  border-radius: 0.75rem;
  padding: 0.75rem;
  text-align: center;
  margin-bottom: 1rem;
`,am=ve.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #f87171;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,sm=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 0;
`,dm=ve.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`,cm=ve.button`
  background: ${e=>{switch(e.$variant){case"primary":return"#f87171";case"secondary":default:return"#374151";case"success":return"#22c55e";case"danger":return"#ef4444"}}};
  color: white;
  border: 2px solid ${e=>{switch(e.$variant){case"primary":return"#ef4444";case"secondary":default:return"#4b5563";case"success":return"#16a34a";case"danger":return"#dc2626"}}};
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`,lm=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";case"authorized":return"linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";case"denied":return"linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";default:return"linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}}};
  border: 2px solid ${e=>{switch(e.$status){case"pending":return"#d97706";case"authorized":return"#16a34a";case"denied":return"#dc2626";default:return"#4b5563"}}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`,pm=ve.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`,mm=ve.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`,um=ve.div`
  font-size: 0.875rem;
  color: #ffffff;
`,fm=ve.div`
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #f87171;
`,hm=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>t.jsxs(t.Fragment,{children:[t.jsxs(Kp,{children:[t.jsxs(Xp,{children:[t.jsxs(Zp,{children:[t.jsx(oe,{style:{marginRight:"0.5rem"}}),"Tesla Model Y"]}),t.jsx(Qp,{children:"Autopilot Authorization System"})]}),t.jsxs(em,{children:[t.jsx(tm,{$active:"pending"===e.status,$color:"#f59e0b"}),t.jsx(tm,{$active:"authorized"===e.status,$color:"#22c55e"}),t.jsx(tm,{$active:"denied"===e.status,$color:"#ef4444"}),t.jsx(tm,{$active:"expired"===e.status,$color:"#6b7280"})]}),t.jsxs(rm,{children:[t.jsx(im,{children:"Infotainment Authorization Code"}),t.jsx(nm,{children:Ge.formatUserCode(e.userCode)})]}),e.verificationUriComplete&&t.jsxs(om,{children:[t.jsxs(am,{children:[t.jsx(ae,{style:{marginRight:"0.5rem"}}),"Telematics Scanner"]}),t.jsx(sm,{children:t.jsx(n,{value:e.verificationUriComplete,size:120,bgColor:"#ffffff",fgColor:"#000000",level:"M",includeMargin:!0})})]}),t.jsxs(dm,{children:[t.jsxs(cm,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("SmartVehicleDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{})," Copy Code"]}),t.jsxs(cm,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.verificationUri),we.info("SmartVehicleDeviceFlow","Verification URI copied to clipboard")},children:[t.jsx(o,{})," Copy URI"]}),t.jsxs(cm,{$variant:"primary",onClick:()=>{window.open(e.verificationUriComplete,"_blank"),we.info("SmartVehicleDeviceFlow","Verification URI opened in new tab")},children:[t.jsx(a,{})," Open in Browser"]})]}),t.jsxs(lm,{$status:e.status,children:[t.jsx(pm,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(mm,{children:(()=>{switch(e.status){case"pending":return"VEHICLE SYNC";case"authorized":return"VEHICLE AUTHORIZED";case"denied":return"AUTHORIZATION DENIED";case"expired":return"SESSION EXPIRED";default:return"UNKNOWN STATUS"}})()}),t.jsx(um,{children:Ge.getStatusMessage(e)})]}),"authorized"===e.status&&e.tokens&&t.jsxs("div",{style:{background:"linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",border:"3px solid #f97316",borderRadius:"1rem",padding:"1.5rem",marginTop:"1rem",boxShadow:"0 20px 25px -5px rgba(0, 0, 0, 0.3)",color:"white"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem",paddingBottom:"1rem",borderBottom:"2px solid #374151"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx("div",{style:{width:"40px",height:"40px",background:"linear-gradient(135deg, #f97316 0%, #ea580c 100%)",borderRadius:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"1.25rem"},children:"🚗"}),t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"1.25rem",fontWeight:"700",color:"white"},children:"Tesla Model 3"}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8"},children:"Connected • Ready to Drive"})]})]}),t.jsx("div",{style:{background:"#10b981",color:"white",padding:"0.5rem 1rem",borderRadius:"0.5rem",fontSize:"0.875rem",fontWeight:"600"},children:"Online"})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 2fr 1fr",gap:"1.5rem",marginBottom:"1.5rem"},children:[t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",padding:"1.5rem",borderRadius:"0.75rem",textAlign:"center",border:"1px solid #374151"},children:[t.jsx("div",{style:{fontSize:"2rem",marginBottom:"0.5rem"},children:"🔋"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#10b981"},children:"85%"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#94a3b8"},children:"Battery"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#94a3b8",marginTop:"0.25rem"},children:"280 mi range"})]}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",padding:"1.5rem",borderRadius:"0.75rem",textAlign:"center",border:"1px solid #374151",position:"relative"},children:[t.jsx("div",{style:{width:"120px",height:"120px",border:"8px solid #374151",borderRadius:"50%",margin:"0 auto 1rem",display:"flex",alignItems:"center",justifyContent:"center",background:"conic-gradient(from 0deg, #f97316 0deg, #f97316 72deg, #374151 72deg)"},children:t.jsx("div",{style:{width:"80px",height:"80px",background:"#0f172a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",fontWeight:"700",color:"white"},children:"35"})}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8"},children:"mph"})]}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",padding:"1.5rem",borderRadius:"0.75rem",textAlign:"center",border:"1px solid #374151"},children:[t.jsx("div",{style:{fontSize:"2rem",marginBottom:"0.5rem"},children:"🌡️"}),t.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"700",color:"#3b82f6"},children:"72°F"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#94a3b8"},children:"Outside"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#94a3b8",marginTop:"0.25rem"},children:"AC: Auto"})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1.5rem"},children:[t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",padding:"1rem",borderRadius:"0.75rem",border:"1px solid #374151"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"},children:[t.jsx("div",{style:{fontSize:"1.25rem"},children:"🧭"}),t.jsx("h3",{style:{margin:0,fontSize:"1rem",fontWeight:"600"},children:"Navigation"})]}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8",marginBottom:"0.5rem"},children:"Destination: Downtown Office"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#10b981"},children:"ETA: 12 minutes • 3.2 miles"})]}),t.jsxs("div",{style:{background:"rgba(255, 255, 255, 0.1)",padding:"1rem",borderRadius:"0.75rem",border:"1px solid #374151"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"},children:[t.jsx("div",{style:{fontSize:"1.25rem"},children:"🎵"}),t.jsx("h3",{style:{margin:0,fontSize:"1rem",fontWeight:"600"},children:"Media"})]}),t.jsx("div",{style:{fontSize:"0.875rem",color:"#94a3b8",marginBottom:"0.5rem"},children:"Now Playing: Spotify"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#10b981"},children:'"Electric Dreams" - Synthwave Mix'})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"1rem"},children:[t.jsxs("button",{style:{background:"linear-gradient(135deg, #f97316 0%, #ea580c 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(ae,{})," Navigate"]}),t.jsxs("button",{style:{background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(se,{})," Media"]}),t.jsxs("button",{style:{background:"linear-gradient(135deg, #10b981 0%, #059669 100%)",color:"white",border:"none",borderRadius:"0.5rem",padding:"1rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(q,{})," Climate"]})]})]}),t.jsx(fm,{})]}),t.jsx(_e,{tokens:e.tokens,backgroundColor:"rgba(0, 0, 0, 0.4)",borderColor:"#374151",headerTextColor:"#ffffff"})]}),gm=ve.div`
  background: #ffffff;
  border-radius: 0;
  padding: 0;
  margin: 1rem 0;
  position: relative;
  max-width: 550px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
`,xm=ve.div`
  width: 100%;
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
  padding: 0.75rem;
  border-radius: 0.375rem 0.375rem 0 0;
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
`,bm=ve.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%);
  border-radius: 0.1875rem;
  padding: 0.375rem;
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.6),
    inset 0 2px 4px rgba(0, 0, 0, 0.9),
    inset 0 -2px 4px rgba(255, 255, 255, 0.03);
  position: relative;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  /* Screen bezel glow */
  &::before {
    content: '';
    position: absolute;
    top: 0.375rem;
    left: 0.375rem;
    right: 0.375rem;
    bottom: 0.375rem;
    border-radius: 0.125rem;
    box-shadow: 
      inset 0 0 40px rgba(0, 0, 0, 0.95),
      0 0 15px rgba(0, 255, 0, 0.08);
    pointer-events: none;
    z-index: 1;
  }
`,vm=ve.div`
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.375rem;
  text-align: center;
`,wm=ve.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #ffffff;
  border-radius: 0.125rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`,ym=ve.div`
  font-size: 0.5rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
  font-family: 'Arial', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
`,km=ve.div`
  background: #ffffff;
  border: none;
  border-radius: 0.125rem;
  padding: 1rem;
  text-align: center;
  position: relative;
  min-height: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  color: #000000;
  overflow: hidden;
  
  /* Tesla car background - using actual Tesla car image */
  background-image: 
    url('https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&h=800&fit=crop&q=90'),
    /* Overlay gradient for readability */
    linear-gradient(180deg, 
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0.8) 50%,
      rgba(255, 255, 255, 0.9) 100%
    );
  background-size: cover, 100% 100%;
  background-position: center center, center;
  background-repeat: no-repeat;
  
  /* Light overlay for subtle depth */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    z-index: 0;
  }
  
  /* Content should be above overlay */
  > * {
    position: relative;
    z-index: 1;
  }
`,jm=ve.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 2;
`,Cm=ve.div`
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
`,zm=ve.div`
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Arial', sans-serif;
  color: #00aa00;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.9);
`,Sm=ve.div`
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Arial', sans-serif;
  color: #000000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`,$m=ve.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
  border-radius: 0 0 0.375rem 0.375rem;
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
`,Im=ve.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    0 1px 2px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
`,Tm=ve.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    0 1px 2px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
`,Am=ve.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${e=>e.$active?"#00ff00":"#ff0000"};
  box-shadow: 0 0 10px ${e=>e.$active?"#00ff00":"#ff0000"};
  margin-right: 0.5rem;
  animation: ${e=>e.$active?"pulse 2s infinite":"none"};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`,Rm=ve.div`
  font-size: 1rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 0.5rem;
  font-family: 'Arial', sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
`,Om=ve.div`
  font-size: 0.75rem;
  color: #000000;
  margin-bottom: 0.75rem;
  font-family: 'Arial', sans-serif;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`,Um=ve.div`
  background: rgba(0, 102, 204, 0.15);
  color: #0066cc;
  font-family: 'Courier New', 'Monaco', monospace;
  font-size: 2rem;
  font-weight: 700;
  padding: 1.25rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  letter-spacing: 0.3em;
  text-align: center;
  border: 2px solid rgba(0, 102, 204, 0.5);
  box-shadow: 
    0 4px 12px rgba(0, 102, 204, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.5),
    0 0 20px rgba(0, 102, 204, 0.2);
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.9);
`,Pm=ve.div`
  color: #000000;
  font-size: 0.625rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  font-family: 'Arial', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`,Dm=ve.div`
  background: ${e=>{switch(e.$status){case"pending":return"rgba(255, 200, 0, 0.1)";case"authorized":return"rgba(0, 255, 0, 0.1)";case"denied":return"rgba(255, 0, 0, 0.1)";default:return"rgba(128, 128, 128, 0.1)"}}};
  border: 1px solid ${e=>{switch(e.$status){case"pending":return"rgba(255, 200, 0, 0.3)";case"authorized":return"rgba(0, 255, 0, 0.3)";case"denied":return"rgba(255, 0, 0, 0.3)";default:return"rgba(128, 128, 128, 0.3)"}}};
  border-radius: 0.375rem;
  padding: 0.5rem;
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 0.5rem;
`,Fm=ve.div`
  font-size: 0.875rem;
  margin-bottom: 0.125rem;
`,Em=ve.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 0.25rem;
  font-family: 'Arial', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`,_m=ve.div`
  font-size: 0.625rem;
  color: #000000;
  font-family: 'Arial', sans-serif;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`,Nm=ve.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.75rem;
`,Mm=ve.button`
  background: ${e=>"primary"===e.$variant?"rgba(0, 102, 204, 0.2)":"rgba(0, 0, 0, 0.1)"};
  color: #000000;
  border: 2px solid ${e=>"primary"===e.$variant?"rgba(0, 102, 204, 0.5)":"rgba(0, 0, 0, 0.3)"};
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Arial', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  
  &:hover {
    background: ${e=>"primary"===e.$variant?"rgba(0, 102, 204, 0.3)":"rgba(0, 0, 0, 0.15)"};
    border-color: ${e=>"primary"===e.$variant?"rgba(0, 102, 204, 0.7)":"rgba(0, 0, 0, 0.4)"};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: scale(0.98);
  }
`,qm=({state:e,onStateUpdate:r,onComplete:i,onError:l})=>{const p=()=>{navigator.clipboard.writeText(e.verificationUri),we.info("TeslaCarDisplayDeviceFlow","Verification URI copied to clipboard")};return t.jsxs(gm,{children:[t.jsx(xm,{children:t.jsx(bm,{children:t.jsxs(km,{children:[t.jsxs(jm,{children:[t.jsx(Cm,{children:"🔋"}),t.jsx(zm,{children:"78%"}),t.jsx(Sm,{children:"Battery"})]}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",marginTop:"2rem",marginBottom:"1rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"},children:[t.jsx(Am,{$active:!!e.tokens}),t.jsx(Rm,{children:"Device Authorization"})]}),t.jsx(Om,{children:"Enter this code on your phone or computer"}),e.userCode&&t.jsxs(t.Fragment,{children:[t.jsx(Pm,{children:"Authorization Code"}),t.jsx(Um,{children:e.userCode})]}),e.status&&t.jsxs(Dm,{$status:e.status,children:[t.jsx(Fm,{children:(()=>{switch(e.status){case"pending":case"expired":default:return t.jsx(d,{});case"authorized":return t.jsx(s,{});case"denied":return t.jsx(c,{})}})()}),t.jsx(Em,{children:(()=>{switch(e.status){case"pending":return"Waiting for Authorization";case"authorized":return"Authorization Complete";case"denied":return"Authorization Denied";case"expired":return"Authorization Expired";default:return"Unknown Status"}})()}),t.jsx(_m,{children:Ge.getStatusMessage(e)})]}),t.jsxs(Nm,{children:[t.jsxs(Mm,{$variant:"secondary",onClick:()=>{navigator.clipboard.writeText(e.userCode),we.info("TeslaCarDisplayDeviceFlow","User code copied to clipboard")},children:[t.jsx(o,{size:12})," Copy Code"]}),t.jsxs(Mm,{$variant:"secondary",onClick:p,children:[t.jsx(o,{size:12})," Copy URI"]})]}),"authorized"===e.status&&e.tokens&&t.jsx("div",{style:{background:"rgba(0, 255, 0, 0.15)",border:"2px solid rgba(0, 255, 0, 0.3)",borderRadius:"0.75rem",padding:"1rem",marginTop:"1rem"},children:t.jsxs("div",{style:{fontSize:"0.625rem",fontWeight:"600",color:"#00ff00",textAlign:"center",fontFamily:"Arial, sans-serif"},children:[t.jsx(s,{size:12,style:{marginRight:"0.25rem"}}),"Authorization Successful!"]})})]})]})})}),t.jsxs($m,{children:[t.jsx(Im,{}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[t.jsx(Tm,{}),t.jsx(Tm,{})]}),t.jsx(Im,{})]}),e.verificationUriComplete&&t.jsxs(vm,{children:[t.jsx(ym,{children:"Scan QR Code"}),t.jsx(wm,{children:t.jsx(n,{value:e.verificationUriComplete,size:100,level:"M",includeMargin:!0})}),e.verificationUri&&t.jsx("div",{style:{fontSize:"0.5rem",color:"rgba(255, 255, 255, 0.4)",marginTop:"0.5rem",wordBreak:"break-all",fontFamily:"Arial, sans-serif"},children:e.verificationUri}),t.jsxs("div",{style:{display:"flex",gap:"0.5rem",justifyContent:"center",marginTop:"0.75rem"},children:[t.jsxs(Mm,{$variant:"primary",onClick:()=>{const t=e.verificationUriComplete||(e.verificationUri&&e.userCode?`${e.verificationUri}?user_code=${e.userCode}`:e.verificationUri);t?(window.open(t,"_blank"),we.info("TeslaCarDisplayDeviceFlow","Verification URI opened in new tab",{uri:t})):we.error("TeslaCarDisplayDeviceFlow","No verification URI available to open")},children:[t.jsx(a,{size:12})," Open in Browser"]}),t.jsxs(Mm,{$variant:"secondary",onClick:p,children:[t.jsx(o,{size:12})," Copy URI"]})]})]})]})},Bm=({deviceType:e,state:r,onStateUpdate:i,onComplete:n,onError:o})=>{const a={state:r,onStateUpdate:i,onComplete:n,onError:o};switch(e){case"apple-tv":default:return t.jsx(td,{...a});case"tesla-car":return t.jsx(qm,{...a});case"amazon-echo-show":return t.jsx(zs,{...a});case"gas-pump":return t.jsx(gc,{...a});case"streaming-tv":return t.jsx(Gp,{...a});case"iot-device":return t.jsx(Fc,{...a});case"gaming-console":return t.jsx(_d,{...a});case"fitness-wearable":return t.jsx(bd,{...a});case"smartphone":return t.jsx(kl,{...a});case"smart-printer":return t.jsx(lp,{...a});case"airport-kiosk":return t.jsx(At,{...a});case"ring-doorbell":return t.jsx(Cr,{...a});case"vizio-tv":return t.jsx(Ji,{...a});case"sony-controller":return t.jsx(Gr,{...a});case"bose-speaker":return t.jsx(tr,{...a});case"square-pos":return t.jsx(ji,{...a});case"pos-terminal":return t.jsx(Bl,{...a});case"ai-agent":return t.jsx(rs,{...a});case"mcp-server":return t.jsx(rl,{...a});case"smart-speaker":return t.jsx(Ap,{...a});case"smart-vehicle":return t.jsx(hm,{...a})}},Lm={"oauth-authorization-code":{flowType:"oauth",flowName:"Authorization Code Flow",flowVersion:"V5",flowCategory:"standard",complexity:"moderate",securityLevel:"high",userInteraction:"required",backendRequired:!0,refreshTokenSupport:!0,idTokenSupport:!1,tokensReturned:"Access Token + Refresh Token",purpose:"Authorization (API access)",specLayer:"Defined in OAuth 2.0",nonceRequirement:"Not required (but recommended with PKCE)",validation:"Validate access token with resource server, exchange code for tokens",securityNotes:["✅ Most secure OAuth 2.0 flow","Use PKCE for public clients","Requires secure backend for confidential clients","Always validate state parameter (CSRF protection)"],useCases:["Web applications with secure backend","Mobile apps with PKCE","Server-side applications","Any application needing refresh tokens"],recommendedFor:["Production web applications","Mobile applications","Server-to-server integrations"],notRecommendedFor:["Simple client-side only applications","Legacy systems without backend support"],implementationNotes:["Implement PKCE for enhanced security","Use secure state parameter for CSRF protection","Store refresh tokens securely","Implement proper token validation"],commonIssues:[{issue:"State parameter mismatch",solution:"Ensure state parameter is properly generated and validated"},{issue:"Code exchange fails",solution:"Verify client credentials and redirect URI match exactly"}],relatedFlows:["oidc-authorization-code","par","client-credentials"],documentationLinks:[{title:"OAuth 2.0 Authorization Code Flow",url:"https://tools.ietf.org/html/rfc6749#section-4.1"},{title:"PKCE Extension",url:"https://tools.ietf.org/html/rfc7636"}]},"oidc-authorization-code":{flowType:"oidc",flowName:"Authorization Code Flow",flowVersion:"V5",flowCategory:"standard",complexity:"moderate",securityLevel:"high",userInteraction:"required",backendRequired:!0,refreshTokenSupport:!0,idTokenSupport:!0,tokensReturned:"Access Token + ID Token + Refresh Token",purpose:"Authentication + Authorization",specLayer:"Defined in OIDC (OpenID Connect)",nonceRequirement:"Recommended for additional security",validation:"Validate ID Token (signature, issuer, audience, nonce if provided, at_hash), exchange code for tokens",securityNotes:["✅ Most secure OIDC flow","Use PKCE for public clients","ID Token provides verified user identity","Always validate state and optionally nonce parameters"],useCases:["Single sign-on (SSO) applications","Web applications needing user identity","Mobile apps with authentication","Any application requiring both authentication and API access"],recommendedFor:["SSO implementations","Applications requiring user identity","Enterprise applications"],notRecommendedFor:["Simple API-only applications","Machine-to-machine scenarios"],implementationNotes:["Validate ID Token signature and claims","Implement proper nonce validation","Handle token refresh scenarios","Implement user session management"],commonIssues:[{issue:"ID Token validation fails",solution:"Verify signature, issuer, audience, and expiration"},{issue:"Nonce mismatch",solution:"Ensure nonce is properly generated and validated"}],relatedFlows:["oauth-authorization-code","hybrid","par"],documentationLinks:[{title:"OpenID Connect Core",url:"https://openid.net/specs/openid-connect-core-1_0.html"},{title:"OIDC Authorization Code Flow",url:"https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth"}]},"client-credentials":{flowType:"oauth",flowName:"Client Credentials Flow",flowVersion:"V5",flowCategory:"standard",complexity:"simple",securityLevel:"high",userInteraction:"none",backendRequired:!0,refreshTokenSupport:!1,idTokenSupport:!1,tokensReturned:"Access Token only",purpose:"Machine-to-machine authorization",specLayer:"Defined in OAuth 2.0",nonceRequirement:"Not applicable (no user interaction)",validation:"Validate access token with resource server",securityNotes:["✅ Ideal for server-to-server authentication","No user context - application acts on its own behalf","Secure storage of client credentials required","Use appropriate scopes to limit access"],useCases:["Backend services accessing APIs","Microservice authentication","Scheduled jobs and automation","System-to-system integration"],recommendedFor:["Microservices","Automated systems","Backend integrations"],notRecommendedFor:["User-facing applications","Client-side applications"],implementationNotes:["Securely store client credentials","Implement proper scope management","Monitor token usage and expiration","Use least privilege principle"],commonIssues:[{issue:"Invalid client credentials",solution:"Verify client ID and secret are correct and properly encoded"},{issue:"Insufficient scope",solution:"Request appropriate scopes for the required operations"}],relatedFlows:["oauth-authorization-code","device-code"],documentationLinks:[{title:"OAuth 2.0 Client Credentials Flow",url:"https://tools.ietf.org/html/rfc6749#section-4.4"}]},"device-code":{flowType:"oauth",flowName:"Device Authorization Flow",flowVersion:"V5",flowCategory:"standard",complexity:"moderate",securityLevel:"high",userInteraction:"required",backendRequired:!1,refreshTokenSupport:!0,idTokenSupport:!1,tokensReturned:"Access Token + Refresh Token + (optional ID Token)",purpose:"Authorization for input-constrained devices",specLayer:"Defined in OAuth 2.0 (RFC 8628)",nonceRequirement:"Not typically used",validation:"Poll token endpoint until user authorizes on separate device",securityNotes:["✅ Perfect for devices with limited input capabilities","User completes authentication on a separate device","Polling mechanism to check authorization status","Device code and user code have short expiration times"],useCases:["Smart TVs and streaming devices","IoT devices with no keyboard","Gaming consoles","Command-line tools and CLI applications"],recommendedFor:["Input-constrained devices","TV and streaming applications","IoT devices"],notRecommendedFor:["Web applications","Mobile applications with full UI"],implementationNotes:["Implement proper polling intervals","Handle device code expiration","Provide clear user instructions","Implement timeout handling"],commonIssues:[{issue:"Polling timeout",solution:"Implement exponential backoff and proper error handling"},{issue:"User code expired",solution:"Request new device code and restart the flow"}],relatedFlows:["oauth-authorization-code","oidc-ciba-v6"],documentationLinks:[{title:"OAuth 2.0 Device Authorization Grant",url:"https://tools.ietf.org/html/rfc8628"}]},"oidc-hybrid":{flowType:"oidc",flowName:"Hybrid Flow",flowVersion:"V5",flowCategory:"standard",complexity:"complex",securityLevel:"high",userInteraction:"required",backendRequired:!0,refreshTokenSupport:!0,idTokenSupport:!0,tokensReturned:"Access Token + ID Token + Authorization Code",purpose:"Combined authentication with immediate token access",specLayer:"Defined in OIDC (OpenID Connect)",nonceRequirement:"Required when ID Token returned",validation:"Validate ID Token immediately, exchange code for additional tokens, validate at_hash and c_hash",securityNotes:["⚠️ Complex flow - use only when specifically needed","Combines benefits of implicit and authorization code flows","Frontend gets immediate access to ID Token","Backend can securely exchange code for refresh token"],useCases:["Applications needing immediate user identity verification","Scenarios requiring both frontend and backend token access","Advanced SSO implementations"],recommendedFor:["Advanced SSO scenarios","Applications needing immediate ID Token access","Complex authentication requirements"],notRecommendedFor:["Simple applications","Standard authentication scenarios"],implementationNotes:["Implement proper ID Token validation","Handle both immediate and deferred token access","Validate at_hash and c_hash parameters","Consider complexity vs. benefits"],commonIssues:[{issue:"Complex implementation",solution:"Consider using Authorization Code Flow with PKCE instead"},{issue:"Hash validation fails",solution:"Ensure proper at_hash and c_hash calculation and validation"}],relatedFlows:["oidc-authorization-code","oidc-implicit"],documentationLinks:[{title:"OpenID Connect Core",url:"https://openid.net/specs/openid-connect-core-1_0.html"},{title:"OIDC Hybrid Flow",url:"https://openid.net/specs/openid-connect-core-1_0.html#HybridFlowAuth"}]},"oidc-client-credentials":{flowType:"oidc",flowName:"Client Credentials Flow",flowVersion:"V5",flowCategory:"standard",complexity:"simple",securityLevel:"high",userInteraction:"none",backendRequired:!0,refreshTokenSupport:!1,idTokenSupport:!1,tokensReturned:"Access Token only",purpose:"Machine-to-machine authentication with OIDC context",specLayer:"Defined in OIDC (OpenID Connect)",nonceRequirement:"Not applicable (no user interaction)",validation:"Validate access token with resource server",securityNotes:["✅ Ideal for server-to-server authentication","No user context - application acts on its own behalf","Secure storage of client credentials required","Use appropriate scopes to limit access","OIDC context provides additional metadata"],useCases:["Backend services accessing APIs","Microservice authentication","Scheduled jobs and automation","System-to-system integration","OIDC-enabled machine-to-machine scenarios"],recommendedFor:["Microservices with OIDC support","Automated systems","Backend integrations requiring OIDC context"],notRecommendedFor:["User-facing applications","Client-side applications"],implementationNotes:["Securely store client credentials","Implement proper scope management","Monitor token usage and expiration","Use least privilege principle","Leverage OIDC metadata for enhanced security"],commonIssues:[{issue:"Invalid client credentials",solution:"Verify client ID and secret are correct and properly encoded"},{issue:"Insufficient scope",solution:"Request appropriate scopes for the required operations"}],relatedFlows:["client-credentials","oauth-authorization-code"],documentationLinks:[{title:"OAuth 2.0 Client Credentials Flow",url:"https://tools.ietf.org/html/rfc6749#section-4.4"},{title:"OpenID Connect Core",url:"https://openid.net/specs/openid-connect-core-1_0.html"}]},"oidc-implicit":{flowType:"oidc",flowName:"Implicit Flow",flowVersion:"V5",flowCategory:"deprecated",complexity:"simple",securityLevel:"low",userInteraction:"required",backendRequired:!1,refreshTokenSupport:!1,idTokenSupport:!0,tokensReturned:"Access Token + ID Token",purpose:"Authentication + Authorization (deprecated)",specLayer:"Defined in OIDC (OpenID Connect)",nonceRequirement:"Required for security",validation:"Validate ID Token signature, issuer, audience, nonce, and expiry",securityNotes:["⚠️ DEPRECATED - Not recommended for new applications","Tokens exposed in URL fragment","Nonce parameter is mandatory to prevent replay attacks","Consider using Authorization Code Flow with PKCE instead"],useCases:["Legacy single-page applications (migration only)","Simple authentication scenarios (deprecated)"],recommendedFor:[],notRecommendedFor:["New applications","Production systems","Secure applications"],implementationNotes:["Migrate to Authorization Code Flow with PKCE","Implement proper nonce validation","Consider security implications","Plan migration strategy"],commonIssues:[{issue:"Tokens exposed in URL",solution:"Migrate to Authorization Code Flow with PKCE"},{issue:"Nonce validation fails",solution:"Ensure nonce is properly generated and validated"}],relatedFlows:["oidc-authorization-code","oauth-implicit"],documentationLinks:[{title:"OpenID Connect Core",url:"https://openid.net/specs/openid-connect-core-1_0.html"},{title:"OIDC Implicit Flow",url:"https://openid.net/specs/openid-connect-core-1_0.html#ImplicitFlowAuth"}]},"oauth-implicit":{flowType:"oauth",flowName:"Implicit Flow",flowVersion:"V5",flowCategory:"deprecated",complexity:"simple",securityLevel:"low",userInteraction:"required",backendRequired:!1,refreshTokenSupport:!1,idTokenSupport:!1,tokensReturned:"Access Token only",purpose:"Authorization (API access) - Deprecated",specLayer:"Defined in OAuth 2.0",nonceRequirement:"Not required",validation:"Validate access token with resource server",securityNotes:["⚠️ DEPRECATED - Not recommended for new applications","Tokens exposed in URL fragment","No refresh tokens available","Consider using Authorization Code Flow with PKCE instead"],useCases:["Legacy browser-based applications (migration only)","Simple client-side applications (deprecated)"],recommendedFor:[],notRecommendedFor:["New applications","Production systems","Secure applications"],implementationNotes:["Migrate to Authorization Code Flow with PKCE","Implement proper token validation","Consider security implications","Plan migration strategy"],commonIssues:[{issue:"Tokens exposed in URL",solution:"Migrate to Authorization Code Flow with PKCE"},{issue:"No refresh token support",solution:"Use Authorization Code Flow for refresh token support"}],relatedFlows:["oauth-authorization-code","oidc-implicit"],documentationLinks:[{title:"OAuth 2.0 Implicit Flow",url:"https://tools.ietf.org/html/rfc6749#section-4.2"}]},"pingone-worker-token":{flowType:"oauth",flowName:"Worker Token Flow",flowVersion:"V5",flowCategory:"pingone-specific",complexity:"moderate",securityLevel:"high",userInteraction:"none",backendRequired:!0,refreshTokenSupport:!1,idTokenSupport:!1,tokensReturned:"Access Token only",purpose:"PingOne admin access and management operations",specLayer:"PingOne-specific implementation",nonceRequirement:"Not applicable (no user interaction)",validation:"Validate access token with PingOne APIs",securityNotes:["✅ High-privilege flow for PingOne administration","Requires PingOne admin credentials","Use with caution - grants administrative access","Monitor usage and implement proper access controls","Store credentials securely"],useCases:["PingOne environment management","User and group administration","Application configuration","Policy management","System monitoring and reporting"],recommendedFor:["PingOne administrators","System integration scenarios","Automated management tasks"],notRecommendedFor:["End-user applications","Public-facing services"],implementationNotes:["Use PingOne admin credentials","Implement proper scope management","Monitor token usage and expiration","Use least privilege principle","Consider implementing audit logging"],commonIssues:[{issue:"Invalid admin credentials",solution:"Verify PingOne admin credentials are correct and have proper permissions"},{issue:"Insufficient scope",solution:"Request appropriate scopes for the required PingOne operations"}],relatedFlows:["client-credentials","oauth-authorization-code"],documentationLinks:[{title:"PingOne Developer Documentation",url:"https://docs.pingidentity.com/"},{title:"PingOne API Reference",url:"https://apidocs.pingidentity.com/"}]},"token-revocation":{flowType:"oauth",flowName:"Token Revocation Flow",flowVersion:"V5",flowCategory:"standard",complexity:"simple",securityLevel:"high",userInteraction:"none",backendRequired:!0,refreshTokenSupport:!1,idTokenSupport:!1,tokensReturned:"None (revokes existing tokens)",purpose:"Revoke access and refresh tokens for security",specLayer:"Defined in OAuth 2.0 (RFC 7009)",nonceRequirement:"Not applicable",validation:"Confirm token revocation with authorization server",securityNotes:["✅ Essential for security and logout functionality","Revokes tokens immediately upon request","Prevents further use of compromised tokens","Should be called during user logout","Consider revoking both access and refresh tokens"],useCases:["User logout and session termination","Security incident response","Token compromise mitigation","Administrative token revocation","Compliance requirements"],recommendedFor:["All OAuth applications","Security-sensitive applications","Applications with logout functionality"],notRecommendedFor:[],implementationNotes:["Implement proper error handling","Consider revoking both access and refresh tokens","Handle revocation failures gracefully","Implement retry logic for failed revocations","Log revocation attempts for audit purposes"],commonIssues:[{issue:"Token already revoked",solution:"Handle gracefully - token may already be invalid"},{issue:"Invalid token format",solution:"Ensure token is properly formatted and not expired"}],relatedFlows:["token-introspection","oauth-authorization-code"],documentationLinks:[{title:"OAuth 2.0 Token Revocation",url:"https://tools.ietf.org/html/rfc7009"}]},"token-introspection":{flowType:"oauth",flowName:"Token Introspection Flow",flowVersion:"V5",flowCategory:"standard",complexity:"simple",securityLevel:"high",userInteraction:"none",backendRequired:!0,refreshTokenSupport:!1,idTokenSupport:!1,tokensReturned:"Token metadata and claims",purpose:"Validate and inspect access tokens",specLayer:"Defined in OAuth 2.0 (RFC 7662)",nonceRequirement:"Not applicable",validation:"Validate token with authorization server",securityNotes:["✅ Essential for token validation and authorization","Provides detailed token information","Enables fine-grained authorization decisions","Should be used for API endpoint protection","Consider caching results for performance"],useCases:["API endpoint authorization","Token validation and verification","Authorization decision making","Token metadata retrieval","Security monitoring and auditing"],recommendedFor:["All OAuth applications","API gateways and proxies","Resource servers"],notRecommendedFor:[],implementationNotes:["Implement proper caching for performance","Handle introspection failures gracefully","Consider rate limiting for introspection calls","Validate all returned claims","Implement proper error handling"],commonIssues:[{issue:"Token not found",solution:"Handle as invalid token - may be expired or revoked"},{issue:"Introspection endpoint unavailable",solution:"Implement fallback logic or fail securely"}],relatedFlows:["token-revocation","oauth-authorization-code"],documentationLinks:[{title:"OAuth 2.0 Token Introspection",url:"https://tools.ietf.org/html/rfc7662"}]},"jwt-bearer-token":{flowType:"oauth",flowName:"JWT Bearer Token Flow",flowVersion:"V5",flowCategory:"standard",complexity:"complex",securityLevel:"high",userInteraction:"none",backendRequired:!0,refreshTokenSupport:!1,idTokenSupport:!1,tokensReturned:"Access Token only",purpose:"Advanced client authentication using JWT assertions",specLayer:"Defined in OAuth 2.0 (RFC 7523)",nonceRequirement:"Not applicable",validation:"Validate JWT signature and claims",securityNotes:["✅ Enhanced security through JWT assertions","Requires proper JWT signing and validation","More secure than client credentials","Supports advanced authentication scenarios","Private key management is critical"],useCases:["Advanced client authentication","Microservice authentication","System-to-system integration","High-security applications","Federated authentication scenarios"],recommendedFor:["High-security applications","Microservice architectures","Advanced integration scenarios"],notRecommendedFor:["Simple applications","Client-side applications"],implementationNotes:["Implement proper JWT signing and validation","Securely store private keys","Use appropriate JWT claims and expiration","Implement proper error handling","Consider key rotation strategies"],commonIssues:[{issue:"Invalid JWT signature",solution:"Verify private key and signing algorithm"},{issue:"JWT expired or invalid claims",solution:"Check JWT expiration and required claims"}],relatedFlows:["client-credentials","oauth-authorization-code"],documentationLinks:[{title:"OAuth 2.0 JWT Bearer Token Profiles",url:"https://tools.ietf.org/html/rfc7523"}]},"oidc-resource-owner-password":{flowType:"oidc",flowName:"Resource Owner Password Flow",flowVersion:"V5",flowCategory:"deprecated",complexity:"simple",securityLevel:"low",userInteraction:"required",backendRequired:!0,refreshTokenSupport:!0,idTokenSupport:!0,tokensReturned:"Access Token + ID Token + Refresh Token",purpose:"Authentication + Authorization (deprecated)",specLayer:"Defined in OIDC (OpenID Connect)",nonceRequirement:"Not required",validation:"Validate access token and ID token",securityNotes:["⚠️ DEPRECATED - Not recommended for new applications","Username and password exposed to client application","No user consent or authorization screen","Consider using Authorization Code Flow with PKCE instead","Only use for legacy migration scenarios"],useCases:["Legacy OIDC applications (migration only)","Simple authentication scenarios (deprecated)","System-to-system authentication (deprecated)"],recommendedFor:[],notRecommendedFor:["New applications","Production systems","Secure applications","Public-facing applications"],implementationNotes:["Migrate to Authorization Code Flow with PKCE","Implement proper token validation","Consider security implications","Plan migration strategy","Use only for legacy migration"],commonIssues:[{issue:"Credentials exposed to client",solution:"Migrate to Authorization Code Flow with PKCE"},{issue:"No user consent",solution:"Use Authorization Code Flow for proper user consent"}],relatedFlows:["oidc-authorization-code","oauth-resource-owner-password"],documentationLinks:[{title:"OpenID Connect Core",url:"https://openid.net/specs/openid-connect-core-1_0.html"},{title:"OAuth 2.0 Resource Owner Password Credentials",url:"https://tools.ietf.org/html/rfc6749#section-4.3"}]},"oauth-resource-owner-password":{flowType:"oauth",flowName:"Resource Owner Password Flow",flowVersion:"V5",flowCategory:"deprecated",complexity:"simple",securityLevel:"low",userInteraction:"required",backendRequired:!0,refreshTokenSupport:!0,idTokenSupport:!1,tokensReturned:"Access Token + Refresh Token",purpose:"Authentication + Authorization (deprecated)",specLayer:"Defined in OAuth 2.0",nonceRequirement:"Not required",validation:"Validate access token",securityNotes:["⚠️ DEPRECATED - Not recommended for new applications","Username and password exposed to client application","No user consent or authorization screen","Consider using Authorization Code Flow with PKCE instead","Only use for legacy migration scenarios"],useCases:["Legacy OAuth applications (migration only)","Simple authentication scenarios (deprecated)","System-to-system authentication (deprecated)"],recommendedFor:[],notRecommendedFor:["New applications","Production systems","Secure applications","Public-facing applications"],implementationNotes:["Migrate to Authorization Code Flow with PKCE","Implement proper token validation","Consider security implications","Plan migration strategy","Use only for legacy migration"],commonIssues:[{issue:"Credentials exposed to client",solution:"Migrate to Authorization Code Flow with PKCE"},{issue:"No user consent",solution:"Use Authorization Code Flow for proper user consent"}],relatedFlows:["oauth-authorization-code","oidc-resource-owner-password"],documentationLinks:[{title:"OAuth 2.0 Resource Owner Password Credentials",url:"https://tools.ietf.org/html/rfc6749#section-4.3"}]},"user-info":{flowType:"oidc",flowName:"User Info Flow",flowVersion:"V5",flowCategory:"standard",complexity:"simple",securityLevel:"high",userInteraction:"none",backendRequired:!1,refreshTokenSupport:!1,idTokenSupport:!1,tokensReturned:"User information and claims",purpose:"Retrieve user information using access token",specLayer:"Defined in OIDC (OpenID Connect)",nonceRequirement:"Not applicable",validation:"Validate access token with user info endpoint",securityNotes:["✅ Essential for user information retrieval","Requires valid access token","Provides additional user details and claims","Should be used for personalization and authorization","Consider caching for performance"],useCases:["User profile display","Personalization features","User information management","Authorization decisions","User experience enhancement"],recommendedFor:["All OIDC applications","User-facing applications","Personalization scenarios"],notRecommendedFor:[],implementationNotes:["Implement proper access token validation","Handle user info endpoint errors gracefully","Consider caching user information","Respect user privacy and data protection","Implement proper error handling"],commonIssues:[{issue:"Invalid access token",solution:"Ensure access token is valid and has appropriate scopes"},{issue:"User info endpoint unavailable",solution:"Implement fallback logic or fail gracefully"}],relatedFlows:["oidc-authorization-code","oidc-implicit"],documentationLinks:[{title:"OpenID Connect Core",url:"https://openid.net/specs/openid-connect-core-1_0.html"},{title:"OIDC UserInfo Endpoint",url:"https://openid.net/specs/openid-connect-core-1_0.html#UserInfo"}]},"oidc-ciba-v6":{flowType:"oidc",flowName:"OIDC CIBA Flow (Mock)",flowVersion:"V5",flowCategory:"standard",complexity:"complex",securityLevel:"high",userInteraction:"required",backendRequired:!0,refreshTokenSupport:!0,idTokenSupport:!0,tokensReturned:"Access Token + ID Token + Refresh Token",purpose:"Decoupled Authentication + Authorization",specLayer:"Defined in OIDC CIBA (RFC 8628 extension)",nonceRequirement:"Not applicable (backchannel flow)",validation:"Validate ID Token signature, issuer, audience, and expiry. Poll with auth_req_id.",securityNotes:["✅ Secure decoupled authentication flow","Requires CIBA-enabled PingOne environment","User approval happens on secondary device","Respect polling intervals to avoid rate limiting","Use strong client authentication (private_key_jwt recommended)"],useCases:["IoT devices without user interface","Call center authentication scenarios","Smart TV and streaming device authentication","Point-of-sale systems","Any scenario requiring decoupled user approval"],recommendedFor:["Decoupled authentication scenarios","IoT and embedded devices","High-security applications"],notRecommendedFor:["Simple web applications","Direct user interaction scenarios"],implementationNotes:["Implement proper polling with backoff","Handle authentication request expiration","Use strong client authentication","Implement proper error handling"],commonIssues:[{issue:"Authentication request timeout",solution:"Implement proper polling intervals and handle expiration"},{issue:"Client authentication fails",solution:"Verify client credentials and authentication method"}],relatedFlows:["device-code","oidc-authorization-code"],documentationLinks:[{title:"OpenID Connect CIBA",url:"https://openid.net/specs/openid-connect-ciba-1_0.html"},{title:"OAuth 2.0 Device Authorization Grant",url:"https://tools.ietf.org/html/rfc8628"}]},par:{flowType:"oauth",flowName:"Pushed Authorization Request (PAR)",flowVersion:"V5",flowCategory:"standard",complexity:"moderate",securityLevel:"high",userInteraction:"required",backendRequired:!0,refreshTokenSupport:!0,idTokenSupport:!1,tokensReturned:"Same as Authorization Code Flow",purpose:"Secure authorization with server-side request initiation",specLayer:"Defined in OAuth 2.0 (RFC 9126)",nonceRequirement:"Recommended for OIDC",validation:"Push request to server first, then redirect with request_uri",securityNotes:["✅ Enhanced security - Authorization request not exposed in browser","Prevents request tampering and leakage","Requires additional server endpoint","Ideal for high-security applications"],useCases:["Financial applications","Healthcare systems","High-security enterprise applications","Applications handling sensitive data"],recommendedFor:["High-security applications","Financial services","Healthcare systems"],notRecommendedFor:["Simple applications","Applications without security requirements"],implementationNotes:["Implement PAR endpoint on authorization server","Handle request URI generation and validation","Implement proper error handling","Consider request URI expiration"],commonIssues:[{issue:"Request URI not found",solution:"Verify request URI is valid and not expired"},{issue:"PAR endpoint unavailable",solution:"Ensure PAR endpoint is properly configured and accessible"}],relatedFlows:["oauth-authorization-code","oidc-authorization-code"],documentationLinks:[{title:"Custom Flow Implementation",url:"#"}]},"oidc-overview":{flowType:"documentation",flowName:"OpenID Connect Overview",flowVersion:"V7",flowCategory:"educational",complexity:"informational",securityLevel:"informational",userInteraction:"none",backendRequired:!1,refreshTokenSupport:!1,idTokenSupport:!0,tokensReturned:"Educational Content",purpose:"Learn about OIDC authentication flows and concepts",specLayer:"OpenID Connect Core 1.0",nonceRequirement:"Varies by flow",validation:"Educational content - no validation required",securityNotes:["📚 Comprehensive OIDC flow comparison","🎯 Best practice recommendations","🔒 Security level explanations","⚡ Interactive flow navigation"],useCases:["Learning OIDC concepts","Comparing authentication flows","Understanding security implications","Choosing the right flow for your application"],relatedFlows:["oidc-authorization-code","oidc-implicit","oidc-hybrid"],documentationLinks:[{title:"OpenID Connect Core 1.0",url:"https://openid.net/specs/openid-connect-core-1_0.html"},{title:"OIDC Discovery",url:"https://openid.net/specs/openid-connect-discovery-1_0.html"}]}},Vm=e=>{if(!e||"string"!=typeof e)return"unknown";if(Lm[e])return e;const t={"oauth-authorization-code-v7":"oauth-authorization-code","oidc-authorization-code-v7":"oidc-authorization-code","oauth-device-authorization":"device-code","oidc-device-authorization":"device-code","ciba-v7":"oidc-ciba-v6","oidc-ciba-v7":"oidc-ciba-v6"};if(t[e])return t[e];const r=e.replace(/-v\d+$/i,"");return Lm[r]?r:e},Wm=e=>{if(!e||"string"!=typeof e)return null;const t=Vm(e);return Lm[t]||null},Hm=e=>{switch(e){case"standard":return"Standard";case"experimental":return"Experimental";case"deprecated":return"Deprecated";case"pingone-specific":return"PingOne";default:return"Unknown"}},Ym=e=>({"Authorization Code Flow":"🔐","Client Credentials Flow":"🤖","Device Authorization Flow":"📱","OIDC CIBA Flow":"🔗","OpenID Connect Overview":"📚","Pushed Authorization Request (PAR)":"📤","Redirectless Flow":"⚡"}[e]||"🔑"),Jm=e=>{switch(e){case"simple":return"Simple";case"moderate":return"Moderate";case"complex":return"Complex";default:return"Unknown"}},Gm=e=>{switch(e){case"high":return"High Security";case"medium":return"Medium Security";case"low":return"Low Security";default:return"Unknown"}},Km=e=>{switch(e){case"required":return"User Interaction Required";case"optional":return"User Interaction Optional";case"none":return"No User Interaction";default:return"Unknown"}},Xm=e=>{if(!e||"string"!=typeof e)return null;const t=Wm(e);return t?{header:{title:t.flowName,subtitle:t.purpose,badge:Hm(t.flowCategory),icon:Ym(t.flowName)},keyDetails:{tokensReturned:t.tokensReturned,purpose:t.purpose,specLayer:t.specLayer,nonceRequirement:t.nonceRequirement,validation:t.validation},securityNotes:t.securityNotes??[],useCases:t.useCases??[],additionalInfo:{complexity:Jm(t.complexity),securityLevel:Gm(t.securityLevel),userInteraction:Km(t.userInteraction),backendRequired:t.backendRequired}}:null},Zm=e=>{const t=Wm(e);return t?.commonIssues??[]},Qm=e=>{const t=Wm(e);return t?.implementationNotes??[]},eu=e=>{const t=Wm(e);return t?.documentationLinks??[]},tu=ve.div`
	background: ${({$colorScheme:e})=>{switch(e){case"blue":default:return"linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)";case"green":return"linear-gradient(135deg, #10b981 0%, #34d399 100%)";case"purple":return"linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)";case"orange":return"linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)";case"red":return"linear-gradient(135deg, #ef4444 0%, #f87171 100%)"}}};
	border-radius: 12px;
	margin-bottom: 2rem;
	box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
	overflow: hidden;
	font-size: ${({$fontSize:e})=>{switch(e){case"small":return"0.875rem";case"large":return"1.125rem";default:return"1rem"}}};
`,ru=ve.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: transparent;
	border: none;
	padding: 1.5rem;
	cursor: pointer;
	transition: background 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}
`,iu=ve.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`,nu=ve.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: white;
	color: #3b82f6;
	padding: 0.5rem 1rem;
	border-radius: 20px;
	font-weight: 600;
	font-size: 0.875rem;
`,ou=ve.span`
	font-size: 1.2rem;
`,au=ve.span`
	background: ${({$category:e})=>{switch(e){case"Standard":return"#10b981";case"Experimental":return"#f59e0b";case"Deprecated":return"#ef4444";case"PingOne":return"#8b5cf6";default:return"#6b7280"}}};
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 12px;
	font-size: 0.75rem;
	font-weight: 600;
	margin-left: 0.5rem;
`,su=ve.div`
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	transition: transform 0.2s ease;
	transform: ${({$isOpen:e})=>e?"rotate(0deg)":"rotate(-90deg)"};
	flex-shrink: 0;
`,du=ve.div`
	max-height: ${({$isOpen:e})=>e?"2000px":"0"};
	overflow: hidden;
	transition: max-height 0.3s ease;
	padding: ${({$isOpen:e})=>e?"0 1.5rem 1.5rem 1.5rem":"0 1.5rem"};
`,cu=ve.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
`,lu=ve.div`
	background: rgba(255, 255, 255, 0.95);
	border-radius: 8px;
	padding: 1rem;
`,pu=ve.div`
	font-weight: 600;
	font-size: 0.75rem;
	text-transform: uppercase;
	color: #3b82f6;
	margin-bottom: 0.5rem;
	letter-spacing: 0.05em;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,mu=ve.div`
	color: #1f2937;
	font-size: 0.875rem;
	line-height: 1.5;
`,uu=ve.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 0.75rem;
	margin-top: 1rem;
`,fu=ve.div`
	background: rgba(255, 255, 255, 0.9);
	border-radius: 6px;
	padding: 0.75rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,hu=ve.span`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`,gu=ve.span`
	font-size: 0.875rem;
	color: #1f2937;
	font-weight: 500;
`,xu=ve.ul`
	margin: 0;
	padding-left: 1.25rem;
`,bu=ve.li`
	margin-bottom: 0.25rem;
	color: #374151;
`,vu=ve.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
	
	&::before {
		content: ${({$type:e})=>{switch(e){case"success":return'"✅"';case"warning":return'"⚠️"';case"error":return'"❌"';default:return'"ℹ️"'}}};
		flex-shrink: 0;
		font-size: 0.875rem;
	}
`,wu=ve.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
	
	&::before {
		content: '"✨"';
		flex-shrink: 0;
		font-size: 0.875rem;
	}
`,yu=ve.a`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	color: #3b82f6;
	text-decoration: none;
	font-size: 0.875rem;
	
	&:hover {
		text-decoration: underline;
	}
`,ku=({flowType:r,showAdditionalInfo:i=!0,showDocumentation:n=!0,showCommonIssues:o=!1,showImplementationNotes:s=!1})=>{const{settings:d}=Je(),[c,l]=e.useState("expanded"===d.collapsibleDefaultState),[p,m]=e.useState(null);if(e.useEffect(()=>{if(!r)return void m(null);const e=Xm(r);m(e)},[r]),e.useEffect(()=>{const e=e=>{e.detail?.collapsibleDefaultState&&l("expanded"===e.detail.collapsibleDefaultState)};return window.addEventListener("uiSettingsChanged",e),()=>{window.removeEventListener("uiSettingsChanged",e)}},[]),!p)return null;const u=e=>e.includes("✅")?"success":e.includes("⚠️")?"warning":e.includes("❌")?"error":"info";return t.jsxs(tu,{$colorScheme:d.colorScheme,$fontSize:d.fontSize,children:[t.jsxs(ru,{onClick:()=>l(!c),children:[t.jsx(iu,{children:t.jsxs(nu,{children:[t.jsx(ou,{children:p.header.icon}),p.header.title,p.header.badge&&t.jsx(au,{$category:p.header.badge,children:p.header.badge})]})}),t.jsx(su,{$isOpen:c,children:t.jsx(R,{size:18})})]}),t.jsx(du,{$isOpen:c,children:t.jsxs(cu,{children:[t.jsxs(lu,{children:[t.jsxs(pu,{children:[t.jsx(F,{size:14}),"Tokens Returned"]}),t.jsx(mu,{children:p.keyDetails.tokensReturned})]}),t.jsxs(lu,{children:[t.jsxs(pu,{children:[t.jsx(b,{size:14}),"Purpose"]}),t.jsx(mu,{children:p.keyDetails.purpose})]}),t.jsxs(lu,{children:[t.jsxs(pu,{children:[t.jsx(a,{size:14}),"Spec Layer"]}),t.jsx(mu,{children:p.keyDetails.specLayer})]}),t.jsxs(lu,{children:[t.jsxs(pu,{children:[t.jsx(v,{size:14}),"Nonce Requirement"]}),t.jsx(mu,{children:p.keyDetails.nonceRequirement})]}),t.jsxs(lu,{style:{gridColumn:"span 2"},children:[t.jsxs(pu,{children:[t.jsx(v,{size:14}),"Validation"]}),t.jsx(mu,{children:p.keyDetails.validation})]}),p.securityNotes&&p.securityNotes.length>0&&t.jsxs(lu,{style:{gridColumn:"1 / -1"},children:[t.jsxs(pu,{children:[t.jsx(v,{size:14}),"Security Notes"]}),t.jsx(mu,{children:p.securityNotes.map((e,r)=>t.jsx(vu,{$type:u(e),children:e.replace(/[✅⚠️❌ℹ️]/g,"").trim()},r))})]}),p.useCases&&p.useCases.length>0&&t.jsxs(lu,{style:{gridColumn:"1 / -1"},children:[t.jsxs(pu,{children:[t.jsx(de,{size:14}),"Best Use Cases"]}),t.jsx(mu,{children:p.useCases.map((e,r)=>t.jsx(wu,{children:e},r))})]}),i&&p.additionalInfo&&t.jsxs(lu,{style:{gridColumn:"1 / -1"},children:[t.jsxs(pu,{children:[t.jsx(b,{size:14}),"Additional Information"]}),t.jsxs(uu,{children:[p.additionalInfo.complexity&&t.jsxs(fu,{children:[t.jsx(hu,{children:"Complexity:"}),t.jsx(gu,{children:p.additionalInfo.complexity})]}),p.additionalInfo.securityLevel&&t.jsxs(fu,{children:[t.jsx(hu,{children:"Security:"}),t.jsx(gu,{children:p.additionalInfo.securityLevel})]}),p.additionalInfo.userInteraction&&t.jsxs(fu,{children:[t.jsx(hu,{children:"User Interaction:"}),t.jsx(gu,{children:p.additionalInfo.userInteraction})]}),void 0!==p.additionalInfo.backendRequired&&t.jsxs(fu,{children:[t.jsx(hu,{children:"Backend Required:"}),t.jsx(gu,{children:p.additionalInfo.backendRequired?"Yes":"No"})]})]})]}),n&&t.jsxs(lu,{style:{gridColumn:"1 / -1"},children:[t.jsxs(pu,{children:[t.jsx(a,{size:14}),"Documentation"]}),t.jsx(mu,{children:eu(r).map((e,r)=>t.jsx("div",{style:{marginBottom:"0.5rem"},children:t.jsxs(yu,{href:e.url,target:"_blank",rel:"noopener noreferrer",children:[e.title,t.jsx(a,{size:12})]})},r))})]}),o&&t.jsxs(lu,{style:{gridColumn:"1 / -1"},children:[t.jsxs(pu,{children:[t.jsx(b,{size:14}),"Common Issues & Solutions"]}),t.jsx(mu,{children:Zm(r).map((e,r)=>t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsxs("div",{style:{fontWeight:"600",color:"#ef4444",marginBottom:"0.25rem"},children:["Issue: ",e.issue]}),t.jsxs("div",{style:{color:"#10b981"},children:["Solution: ",e.solution]})]},r))})]}),s&&t.jsxs(lu,{style:{gridColumn:"1 / -1"},children:[t.jsxs(pu,{children:[t.jsx(T,{size:14}),"Implementation Notes"]}),t.jsx(mu,{children:t.jsx(xu,{children:Qm(r).map((e,r)=>t.jsx(bu,{children:e},r))})})]})]})})]})},ju={"oauth-authorization-code":{flowType:"oauth",flowName:"Authorization Code Flow",icon:"🌐",steps:[{title:"User clicks login to start the flow",description:"User initiates authentication by clicking the login button in your application"},{title:"App redirects to PingOne with an authorization request",description:"Your application redirects the user to PingOne's authorization server with the required parameters"},{title:"User authenticates and approves scopes",description:"User logs in and grants permission for the requested scopes"},{title:"PingOne returns an authorization code to the redirect URI",description:"PingOne redirects back to your application with an authorization code"},{title:"Backend exchanges the code for tokens securely",description:"Your backend exchanges the authorization code for access and refresh tokens"}]},"oauth-implicit":{flowType:"oauth",flowName:"Implicit Flow",icon:"⚡",steps:[{title:"User clicks login to start the flow",description:"User initiates authentication in your application"},{title:"App redirects to PingOne with an authorization request",description:"Your application redirects the user to PingOne with response_type=token"},{title:"User authenticates and approves scopes",description:"User logs in and grants permission for the requested scopes"},{title:"PingOne returns tokens directly in URL fragment",description:"PingOne redirects back with access token in the URL fragment (not recommended for production)"}]},"oauth-client-credentials":{flowType:"oauth",flowName:"Client Credentials Flow",icon:"🔑",steps:[{title:"Configure client credentials",description:"Set up client ID and client secret for your application"},{title:"Send token request to PingOne",description:"Make a POST request to PingOne's token endpoint with client credentials"},{title:"Receive access token",description:"PingOne returns an access token for server-to-server authentication"},{title:"Use token for API calls",description:"Use the access token to make authenticated calls to protected resources"}]},"oauth-device-authorization":{flowType:"oauth",flowName:"Device Authorization Flow",icon:"📱",steps:[{title:"Request device code from PingOne",description:"Your application requests a device code and user code from PingOne"},{title:"Display user code to user",description:"Show the user code and verification URL to the user on their device"},{title:"User visits verification URL on another device",description:"User goes to the verification URL on a device with a browser"},{title:"User authenticates and approves",description:"User logs in and grants permission for the application"},{title:"Poll for tokens",description:"Your application polls PingOne's token endpoint until tokens are available"}]},"oauth-resource-owner-password":{flowType:"oauth",flowName:"Resource Owner Password Flow",icon:"🔒",steps:[{title:"User enters credentials",description:"User provides username and password in your application"},{title:"Send token request with credentials",description:"Your application sends the credentials directly to PingOne's token endpoint"},{title:"Receive access token",description:"PingOne returns an access token (not recommended for production)"}]},"oauth-jwt-bearer":{flowType:"oauth",flowName:"JWT Bearer Token Flow",icon:"🔐",steps:[{title:"Create JWT assertion",description:"Generate a JWT assertion with client credentials and claims"},{title:"Send token request with JWT",description:"Send the JWT assertion to PingOne's token endpoint"},{title:"Receive access token",description:"PingOne validates the JWT and returns an access token"}]},"oidc-authorization-code":{flowType:"oidc",flowName:"OpenID Connect Authorization Code Flow",icon:"🆔",steps:[{title:"User initiates authentication",description:"User clicks login and is redirected to the OpenID Connect provider"},{title:"User authenticates and consents",description:"User logs in and grants permission for identity and access information"},{title:"Provider returns authorization code",description:"OpenID Connect provider redirects back with an authorization code"},{title:"Exchange code for tokens and ID token",description:"Backend exchanges code for access token, refresh token, and ID token"},{title:"Validate ID token and get user info",description:"Validate the ID token and optionally fetch additional user information"}]},"oidc-implicit":{flowType:"oidc",flowName:"OpenID Connect Implicit Flow",icon:"⚡",steps:[{title:"User initiates authentication",description:"User clicks login and is redirected to the OpenID Connect provider"},{title:"User authenticates and consents",description:"User logs in and grants permission for identity information"},{title:"Provider returns ID token directly",description:"OpenID Connect provider returns ID token in URL fragment (not recommended)"},{title:"Validate ID token",description:"Validate the ID token to ensure it's authentic and not expired"}]},"oidc-hybrid":{flowType:"oidc",flowName:"OpenID Connect Hybrid Flow",icon:"🔀",steps:[{title:"User initiates authentication",description:"User clicks login and is redirected to the OpenID Connect provider"},{title:"User authenticates and consents",description:"User logs in and grants permission for identity and access information"},{title:"Provider returns authorization code and ID token",description:"OpenID Connect provider returns both authorization code and ID token"},{title:"Exchange code for additional tokens",description:"Backend exchanges authorization code for access and refresh tokens"},{title:"Validate all tokens",description:"Validate ID token, access token, and refresh token"}]},"oidc-ciba":{flowType:"oidc",flowName:"OpenID Connect CIBA Flow",icon:"📱",steps:[{title:"Client initiates backchannel authentication",description:"Your application sends an authentication request to PingOne"},{title:"PingOne notifies user device",description:"PingOne sends a notification to the user's registered device"},{title:"User authenticates on device",description:"User authenticates using their registered authenticator"},{title:"Poll for authentication result",description:"Your application polls PingOne for the authentication result"},{title:"Receive tokens",description:"PingOne returns access token, ID token, and refresh token"}]},"ciba-v7":{flowType:"oidc",flowName:"OIDC CIBA Flow (V7)",icon:"🛡️",steps:[{title:"Configure CIBA Parameters",description:"Set up your CIBA configuration with environment details and authentication parameters"},{title:"Initiate Authentication Request",description:"Start the CIBA authentication process and generate the authentication request"},{title:"User Approval Process",description:"Monitor the user approval process and wait for authentication completion"},{title:"Token Exchange & Results",description:"View the authentication results and access tokens with enhanced V7 services"}]},"oidc-ciba-v6":{flowType:"oidc",flowName:"OpenID Connect CIBA Flow (Mock) (V6)",icon:"📱",steps:[{title:"Client initiates backchannel authentication",description:"Your application sends an authentication request to PingOne"},{title:"PingOne notifies user device",description:"PingOne sends a notification to the user's registered device"},{title:"User authenticates on device",description:"User authenticates using their registered authenticator"},{title:"Poll for authentication result",description:"Your application polls PingOne for the authentication result"},{title:"Receive tokens",description:"PingOne returns access token, ID token, and refresh token"}]},"pingone-worker-token":{flowType:"pingone",flowName:"PingOne Worker Token Flow",icon:"🔧",steps:[{title:"Configure PingOne credentials",description:"Set up environment ID, client ID, and client secret for PingOne"},{title:"Request worker token",description:"Send a request to PingOne's token endpoint with client credentials"},{title:"Receive access token",description:"PingOne returns an access token for administrative operations"},{title:"Use token for API calls",description:"Use the access token to make authenticated calls to PingOne APIs"}]},"pingone-par":{flowType:"pingone",flowName:"PingOne PAR Flow",icon:"📤",steps:[{title:"Create pushed authorization request",description:"Build the authorization request parameters"},{title:"Push request to PingOne",description:"Send the authorization request to PingOne's PAR endpoint"},{title:"Receive request URI",description:"PingOne returns a request URI for the authorization request"},{title:"Redirect user to authorization endpoint",description:"Redirect user to PingOne with the request URI"},{title:"Complete authorization flow",description:"User authenticates and returns authorization code"}]},"pingone-redirectless":{flowType:"pingone",flowName:"PingOne Redirectless Flow",icon:"⚡",steps:[{title:"Configure redirectless flow",description:"Set up PingOne environment for redirectless authentication"},{title:"Initiate flow request",description:"Send a request to PingOne to start the redirectless flow"},{title:"Receive flow response",description:"PingOne returns flow information and authentication details"},{title:"Complete authentication",description:"User completes authentication without browser redirects"},{title:"Receive tokens",description:"PingOne returns access and ID tokens directly"}]},"pingone-mfa-v6":{flowType:"pingone",flowName:"PingOne MFA Flow (V6)",icon:"🛡️",steps:[{title:"Obtain worker token for MFA management",description:"Get a management API token using client credentials to register devices and manage MFA challenges"},{title:"Configure user information and MFA method",description:"Set up user details (username, phone, email) and select MFA method (SMS, Email, TOTP, Push)"},{title:"Register MFA device with PingOne",description:"Create a device record in PingOne for the selected MFA method using the management API"},{title:"Initiate MFA challenge",description:"Send an MFA challenge to the registered device (SMS code, email code, push notification)"},{title:"User completes MFA verification",description:"User receives and enters the verification code or approves the push notification"},{title:"Exchange authorization code for MFA-enhanced tokens",description:"Exchange the MFA-verified authorization code for access tokens that include MFA context"},{title:"Review MFA flow results and API interactions",description:"Examine the complete API flow and MFA-enhanced tokens with verification context"}]},"oauth2-resource-owner-password-v6":{flowType:"oauth",flowName:"OAuth 2.0 Resource Owner Password Flow (V6)",icon:"🔒",steps:[{title:"User enters credentials in your application",description:"User provides username and password directly in your application interface"},{title:"Send token request with user credentials",description:"Your application sends the user's credentials directly to PingOne's token endpoint with grant_type=password"},{title:"PingOne validates credentials and returns tokens",description:"PingOne authenticates the user and returns access token and refresh token (not recommended for production)"},{title:"Use access token for API calls",description:"Use the access token to make authenticated calls to protected resources on behalf of the user"}]},"oauth-ropc-v7":{flowType:"oauth",flowName:"OAuth Resource Owner Password Credentials (V7)",icon:"🔒",steps:[{title:"User enters credentials in your application",description:"User provides username and password directly in your application interface with enhanced V7 UI"},{title:"Send token request with user credentials",description:"Your application sends the user's credentials directly to PingOne's token endpoint with grant_type=password"},{title:"PingOne validates credentials and returns tokens",description:"PingOne authenticates the user and returns access token and refresh token (not recommended for production)"},{title:"Use access token for API calls",description:"Use the access token to make authenticated calls to protected resources on behalf of the user"},{title:"Enhanced error handling and user feedback",description:"V7 implementation provides better error handling, visual feedback, and educational content about ROPC security concerns"}]},"oauth-authorization-code-v6":{flowType:"oauth",flowName:"OAuth 2.0 Authorization Code Flow (V6)",icon:"🌐",steps:[{title:"User clicks login to start the flow",description:"User initiates authentication by clicking the login button in your application"},{title:"App redirects to PingOne with an authorization request",description:"Your application redirects the user to PingOne's authorization server with the required parameters including PKCE"},{title:"User authenticates and approves scopes",description:"User logs in and grants permission for the requested scopes"},{title:"PingOne returns an authorization code to the redirect URI",description:"PingOne redirects back to your application with an authorization code"},{title:"Backend exchanges the code for tokens securely",description:"Your backend exchanges the authorization code for access and refresh tokens using PKCE verification"}]},"client-credentials-v6":{flowType:"oauth",flowName:"Client Credentials Flow (V6)",icon:"🔑",steps:[{title:"Configure client credentials",description:"Set up client ID and client secret for your application"},{title:"Send token request to PingOne",description:"Make a POST request to PingOne's token endpoint with client credentials"},{title:"Receive access token",description:"PingOne returns an access token for server-to-server authentication"},{title:"Use token for API calls",description:"Use the access token to make authenticated calls to protected resources"}]},"pingone-par-v6":{flowType:"pingone",flowName:"PingOne PAR Flow (V6)",icon:"📤",steps:[{title:"Create pushed authorization request",description:"Build the authorization request parameters with enhanced security"},{title:"Push request to PingOne PAR endpoint",description:"Send the authorization request to PingOne's PAR endpoint with client authentication"},{title:"Receive request URI",description:"PingOne returns a request URI for the authorization request"},{title:"Redirect user to authorization endpoint",description:"Redirect user to PingOne with the request URI instead of parameters"},{title:"Complete authorization flow",description:"User authenticates and returns authorization code for token exchange"}]},"rar-v6":{flowType:"oidc",flowName:"Rich Authorization Requests (RAR) Flow (V6)",icon:"📋",steps:[{title:"Define rich authorization details",description:"Create detailed authorization request with specific resource access requirements"},{title:"Send authorization request with RAR",description:"Include authorization_details parameter in the authorization request"},{title:"User reviews and approves detailed permissions",description:"User sees granular permission requests and approves specific access"},{title:"Receive authorization code",description:"PingOne returns authorization code with approved authorization details"},{title:"Exchange code for tokens with RAR context",description:"Tokens include the approved authorization details for fine-grained access control"}]},"rar-v7":{flowType:"oauth",flowName:"RAR Flow (V7) - Rich Authorization Requests",icon:"🎯",steps:[{title:"RAR Overview and Configuration",description:"Learn about Rich Authorization Requests (RFC 9396) and configure RAR parameters"},{title:"Set up RAR credentials",description:"Configure environment, client credentials, and RAR-specific authorization details"},{title:"Generate RAR authorization URL",description:"Create authorization request with structured RAR JSON in authorization_details parameter"},{title:"Token exchange with RAR context",description:"Exchange authorization code for tokens, maintaining RAR authorization context"},{title:"Flow completion and review",description:"Review RAR implementation and understand fine-grained authorization benefits"}]},"worker-token-v6":{flowType:"pingone",flowName:"PingOne Worker Token Flow (V6)",icon:"🔧",steps:[{title:"Configure PingOne worker application credentials",description:"Set up environment ID, client ID, and client secret for PingOne worker application"},{title:"Request worker token with required scopes",description:"Send a client credentials request to PingOne's token endpoint with management scopes"},{title:"Receive management access token",description:"PingOne returns an access token for administrative and management operations"},{title:"Use token for PingOne API calls",description:"Use the access token to make authenticated calls to PingOne management APIs"}]},"redirectless-v6-real":{flowType:"pingone",flowName:"PingOne Redirectless Flow V6 (response_mode=pi.flow)",icon:"⚡",steps:[{title:"Learn about response_mode=pi.flow",description:"Understand how PingOne redirectless authentication enables API-driven flows without browser redirects"},{title:"Configure PingOne application for redirectless flow",description:"Set up your PingOne application with proper redirect URIs and response_mode=pi.flow support"},{title:"Initiate authorization request with pi.flow",description:"Send authorization request to PingOne with response_mode=pi.flow parameter"},{title:"Handle API-driven authentication",description:"Process authentication through direct API calls instead of browser redirects"},{title:"Receive tokens directly from API response",description:"Get access tokens and ID tokens directly from the API response without redirect handling"}]},"device-authorization-v6":{flowType:"oauth",flowName:"OAuth 2.0 Device Authorization Flow (V6)",icon:"📱",steps:[{title:"Request device code from PingOne",description:"Your application requests a device code and user code from PingOne for input-constrained devices"},{title:"Display user code to user",description:"Show the user code and verification URL to the user on their device screen"},{title:"User visits verification URL on another device",description:"User goes to the verification URL on a device with a browser (phone, computer)"},{title:"User authenticates and approves",description:"User logs in and grants permission for the application using the user code"},{title:"Poll for tokens",description:"Your application polls PingOne's token endpoint until tokens are available"},{title:"Receive access and refresh tokens",description:"PingOne returns access and refresh tokens for the authenticated user"}]},"oidc-device-authorization-v6":{flowType:"oidc",flowName:"OIDC Device Authorization Flow (V6)",icon:"📱",steps:[{title:"Request device code from PingOne",description:"Your application requests a device code and user code from PingOne with OIDC scopes"},{title:"Display user code to user",description:"Show the user code and verification URL to the user on their device screen"},{title:"User visits verification URL on another device",description:"User goes to the verification URL on a device with a browser (phone, computer)"},{title:"User authenticates and approves OIDC scopes",description:"User logs in and grants permission for identity information (openid, profile, email)"},{title:"Poll for tokens",description:"Your application polls PingOne's token endpoint until tokens are available"},{title:"Receive access, ID, and refresh tokens",description:"PingOne returns access token, ID token with user identity, and refresh token"}]},"oauth-implicit-v6":{flowType:"oauth",flowName:"OAuth 2.0 Implicit Flow (V6)",icon:"⚡",steps:[{title:"User clicks login to start the flow",description:"User initiates authentication in your application (not recommended for production)"},{title:"App redirects to PingOne with an authorization request",description:"Your application redirects the user to PingOne with response_type=token"},{title:"User authenticates and approves scopes",description:"User logs in and grants permission for the requested scopes"},{title:"PingOne returns tokens directly in URL fragment",description:"PingOne redirects back with access token in the URL fragment (security risk)"}]},"oidc-implicit-v6":{flowType:"oidc",flowName:"OIDC Implicit Flow (V6)",icon:"⚡",steps:[{title:"User initiates authentication",description:"User clicks login and is redirected to the OpenID Connect provider (not recommended)"},{title:"User authenticates and consents",description:"User logs in and grants permission for identity information"},{title:"Provider returns ID token directly",description:"OpenID Connect provider returns ID token in URL fragment (security risk)"},{title:"Validate ID token",description:"Validate the ID token to ensure it's authentic and not expired"}]},"oidc-hybrid-v6":{flowType:"oidc",flowName:"OIDC Hybrid Flow (V6)",icon:"🔀",steps:[{title:"User initiates authentication",description:"User clicks login and is redirected to the OpenID Connect provider"},{title:"User authenticates and consents",description:"User logs in and grants permission for identity and access information"},{title:"Provider returns authorization code and ID token",description:"OpenID Connect provider returns both authorization code and ID token"},{title:"Exchange code for additional tokens",description:"Backend exchanges authorization code for access and refresh tokens"},{title:"Validate all tokens",description:"Validate ID token, access token, and refresh token"}]},"token-revocation":{flowType:"oauth",flowName:"Token Revocation Flow",icon:"🗑️",steps:[{title:"Identify token to revoke",description:"Determine which access or refresh token needs to be revoked"},{title:"Send revocation request",description:"Send a POST request to PingOne's revocation endpoint"},{title:"Confirm revocation",description:"PingOne confirms the token has been revoked"}]},"token-introspection":{flowType:"oauth",flowName:"Token Introspection Flow",icon:"🔍",steps:[{title:"Identify token to introspect",description:"Determine which token needs to be validated"},{title:"Send introspection request",description:"Send a POST request to PingOne's introspection endpoint"},{title:"Receive token information",description:"PingOne returns detailed information about the token"}]},"user-info":{flowType:"oidc",flowName:"User Info Flow",icon:"👤",steps:[{title:"Obtain access token",description:"Get a valid access token from an OAuth/OIDC flow"},{title:"Send user info request",description:"Send a GET request to PingOne's userinfo endpoint"},{title:"Receive user information",description:"PingOne returns user profile information"}]},"oidc-device-authorization":{flowType:"oidc",flowName:"OIDC Device Authorization Flow",icon:"📱",steps:[{title:"Client requests device authorization",description:"Client initiates the flow by requesting device authorization from PingOne"},{title:"PingOne returns device code and user code",description:"PingOne provides a device code and user code for the authentication process"},{title:"User visits authorization URL and enters user code",description:"User navigates to the authorization URL and enters the provided user code"},{title:"User authenticates and approves the request",description:"User logs in and grants permission for the requested scopes"},{title:"Client polls for tokens",description:"Client polls the token endpoint until authentication is complete"},{title:"PingOne returns access and ID tokens",description:"PingOne returns the requested tokens to the client"}]},"oidc-authorization-code-v6":{flowType:"oidc",flowName:"OIDC Authorization Code Flow (V6)",icon:"🔐",steps:[{title:"User clicks login to start the OIDC flow",description:"User initiates authentication by clicking the login button in your application"},{title:"App redirects to PingOne with OIDC authorization request",description:"Your application redirects the user to PingOne's authorization server with openid scope and required parameters"},{title:"User authenticates and approves scopes",description:"User logs in and grants permission for the requested OIDC scopes (openid, profile, email)"},{title:"PingOne returns an authorization code to the redirect URI",description:"PingOne redirects back to your application with an authorization code"},{title:"Backend exchanges the code for access and ID tokens",description:"Your backend exchanges the authorization code for access token and ID token containing user identity claims"},{title:"Validate ID token and extract user information",description:"Validate the ID token signature and extract user identity information from the claims"},{title:"Use access token for API calls",description:"Use the access token to make authenticated API calls to protected resources"}]}},Cu=e=>ju[e]??null,zu=ve.div`
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	margin-bottom: 2rem;
	overflow: hidden;
	transition: all 0.3s ease;

	&:hover {
		box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}
`,Su=ve.div`
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border-bottom: 1px solid #e2e8f0;
	padding: 1.5rem;
	cursor: ${({$isCollapsible:e})=>e?"pointer":"default"};
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: all 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
	}
`,$u=ve.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`,Iu=ve.div`
	width: 2.5rem;
	height: 2.5rem;
	background: ${({$flowType:e})=>{switch(e){case"oauth":return"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";case"oidc":return"linear-gradient(135deg, #10b981 0%, #047857 100%)";case"pingone":return"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";default:return"linear-gradient(135deg, #6b7280 0%, #374151 100%)"}}};
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 1.25rem;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`,Tu=ve.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
	margin: 0;
`,Au=ve.button`
	width: 2rem;
	height: 2rem;
	background: #3b82f6;
	border: none;
	border-radius: 50%;
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
	transform: ${({$collapsed:e})=>e?"rotate(-90deg)":"rotate(0deg)"};

	&:hover {
		background: #2563eb;
		transform: ${({$collapsed:e})=>e?"rotate(-90deg) scale(1.05)":"rotate(0deg) scale(1.05)"};
	}
`,Ru=ve.div`
	padding: 1.5rem;
	background: #ffffff;
	display: ${({$collapsed:e})=>e?"none":"block"};
	animation: ${({$collapsed:e})=>e?"none":"slideDown 0.3s ease"};

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`,Ou=ve.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`,Uu=ve.div`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	transition: all 0.2s ease;
	position: relative;

	&:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	&:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 1.25rem;
		top: 3.5rem;
		width: 2px;
		height: 1rem;
		background: ${({$flowType:e})=>{switch(e){case"oauth":return"linear-gradient(to bottom, #3b82f6, #cbd5e1)";case"oidc":return"linear-gradient(to bottom, #10b981, #cbd5e1)";case"pingone":return"linear-gradient(to bottom, #f59e0b, #cbd5e1)";default:return"linear-gradient(to bottom, #6b7280, #cbd5e1)"}}};
	}
`,Pu=ve.div`
	width: 2.5rem;
	height: 2.5rem;
	background: ${({$flowType:e})=>{switch(e){case"oauth":return"linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";case"oidc":return"linear-gradient(135deg, #10b981 0%, #047857 100%)";case"pingone":return"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";default:return"linear-gradient(135deg, #6b7280 0%, #374151 100%)"}}};
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 0.875rem;
	flex-shrink: 0;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`,Du=ve.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`,Fu=ve.div`
	font-size: 0.9375rem;
	font-weight: 600;
	color: #1e293b;
	line-height: 1.4;
`,Eu=ve.div`
	font-size: 0.875rem;
	color: #64748b;
	line-height: 1.5;
`,_u=ve.div`
	padding: 1rem;
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 8px;
	color: #dc2626;
	font-size: 0.875rem;
`,Nu=({flowId:r,customConfig:i,defaultCollapsed:n=!0,className:o})=>{const[a,s]=e.useState(n),d=Cu(r);if(!d)return t.jsx(zu,{$flowType:"oauth",className:o,children:t.jsxs(_u,{children:["No walkthrough configuration found for flow: ",r]})});const c={...d,...i};return t.jsxs(zu,{$flowType:c.flowType,className:o,children:[t.jsxs(Su,{$isCollapsible:!0,onClick:()=>{s(!a)},children:[t.jsxs($u,{children:[t.jsx(Iu,{$flowType:c.flowType,children:c.icon||t.jsx(ce,{size:20})}),t.jsxs(Tu,{children:[c.flowName," Walkthrough"]})]}),t.jsx(Au,{$collapsed:a,children:t.jsx(R,{size:16})})]}),t.jsx(Ru,{$collapsed:a,children:t.jsx(Ou,{children:c.steps.map((e,r)=>t.jsxs(Uu,{$flowType:c.flowType,children:[t.jsx(Pu,{$flowType:c.flowType,children:r+1}),t.jsxs(Du,{children:[t.jsx(Fu,{children:e.title}),e.description&&t.jsx(Eu,{children:e.description})]})]},r))})})]})},Mu=ve.div`
  border: 2px solid ${({$completed:e,theme:t})=>e?t.colors.success:t.colors.gray300};
  border-radius: 0.75rem;
  background: white;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: ${({theme:e})=>e.shadows.sm};

  &:hover {
    box-shadow: ${({theme:e})=>e.shadows.md};
  }
`,qu=ve.div`
  padding: 1.5rem;
  display: flex;
  align-items: center;
  cursor: ${({$clickable:e})=>e?"pointer":"default"};
  border-bottom: 1px solid ${({theme:e})=>e.colors.gray200};

  &:hover {
    background-color: ${({$clickable:e,theme:t})=>e?t.colors.gray50:"transparent"};
  }
`,Bu=ve.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: ${({$completed:e,theme:t})=>e?t.colors.success:t.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 1rem;
  flex-shrink: 0;
`,Lu=ve.div`
  flex: 1;

  h3 {
    margin: 0 0 0.5rem 0;
    color: ${({theme:e})=>e.colors.gray900};
    font-size: 1.25rem;
  }

  p {
    margin: 0;
    color: ${({theme:e})=>e.colors.gray600};
    line-height: 1.6;
  }
`,Vu=ve.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`,Wu=ve.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${({theme:e})=>e.colors.primary};
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({theme:e})=>e.colors.primaryDark};
  }

  &:disabled {
    background-color: ${({theme:e})=>e.colors.gray400};
    cursor: not-allowed;
  }
`,Hu=ve.button`
  background: none;
  border: none;
  color: ${({theme:e})=>e.colors.gray500};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: ${({theme:e})=>e.colors.gray700};
  }
`,Yu=ve.div`
  padding: 1.5rem;
  border-top: 1px solid ${({theme:e})=>e.colors.gray200};
`,Ju=ve.pre`
  background-color: ${({theme:e})=>e.colors.gray900};
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-family: ${({theme:e})=>e.fonts.monospace};
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 1rem 0;

  code {
    font-family: inherit;
  }
`,Gu=({stepNumber:r,title:i,description:n,codeExample:o,completed:a=!1,onToggle:d,children:c,actionButton:l})=>{const[p,m]=e.useState(!1),u=c||o;return t.jsxs(Mu,{$completed:a,children:[t.jsxs(qu,{$clickable:u,onClick:u?()=>m(!p):void 0,children:[t.jsx(Bu,{$completed:a,children:a?t.jsx(s,{size:16}):r}),t.jsxs(Lu,{children:[t.jsx("h3",{children:i}),t.jsx("p",{children:n})]}),t.jsxs(Vu,{children:[l&&t.jsxs(Wu,{onClick:e=>{e.stopPropagation(),l.onClick()},children:[l.icon,l.label]}),u&&t.jsx(Hu,{children:p?t.jsx(le,{size:20}):t.jsx(R,{size:20})})]})]}),p&&u&&t.jsxs(Yu,{children:[c,o&&t.jsx(Ju,{children:t.jsx("code",{children:o})})]})]})},Ku=ve.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin-top: 0.5rem;
`,Xu=ve.div`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 0.75rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	font-size: 0.875rem;
	color: #334155;
	line-height: 1.5;
	transition: all 0.2s ease;

	&:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
	}
`,Zu=ve.div`
	color: #10b981;
	font-size: 1rem;
	margin-top: 0.125rem;
	flex-shrink: 0;
`,Qu=ve.div`
	flex: 1;
`,ef=({steps:e})=>t.jsx(Ku,{children:e.map((e,r)=>t.jsxs(Xu,{children:[t.jsx(Zu,{children:t.jsx(s,{})}),t.jsx(Qu,{children:e})]},r))}),tf=ve.div`
  margin-bottom: 1.5rem;
`,rf=ve.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 2px solid ${({$isActive:e,$isCompleted:t})=>e?"#007bff":t?"#28a745":"#dee2e6"};
  background-color: ${({$isActive:e,$isCompleted:t})=>e?"rgba(0, 123, 255, 0.05)":t?"rgba(40, 167, 69, 0.05)":"#ffffff"};
  transition: all 0.3s ease;
`,nf=ve.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`,of=ve.h4`
  margin: 0;
  color: ${({$isActive:e,$isCompleted:t})=>e?"#007bff":t?"#28a745":"#495057"};
  font-size: 1.1rem;
  font-weight: 600;
`,af=ve.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${({$isActive:e,$isCompleted:t})=>e?"#007bff":t?"#28a745":"#dee2e6"};
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
`,sf=ve.p`
  margin: 0 0 1rem 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
`,df=ve.pre`
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid #374151;
  white-space: pre-wrap;
  position: relative;
`,cf=ve.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
  justify-content: flex-end;
`,lf=ve.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  color: #ffffff;
  font-family: monospace;
  font-size: 0.875rem;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 600;
  }
  
  pre {
    margin: 0;
    background: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    white-space: pre-wrap;
    word-break: break-all;
    overflow: visible;
    color: #ffffff !important;
  }
`,pf=ve.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({$variant:e})=>"primary"===e?"\n        background-color: #007bff;\n        color: white;\n        \n        &:hover:not(:disabled) {\n          background-color: #0056b3;\n        }\n        \n        &:disabled {\n          background-color: #6c757d;\n          cursor: not-allowed;\n        }\n      ":"success"===e?"\n        background-color: #28a745;\n        color: white;\n        \n        &:hover:not(:disabled) {\n          background-color: #1e7e34;\n        }\n        \n        &:disabled {\n          background-color: #6c757d;\n          cursor: not-allowed;\n        }\n      ":"\n        background-color: #6c757d;\n        color: white;\n        \n        &:hover:not(:disabled) {\n          background-color: #545b62;\n        }\n        \n        &:disabled {\n          background-color: #adb5bd;\n          cursor: not-allowed;\n        }\n      "}
`,mf=ve.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
`,uf=ve.h4`
  margin: 0 0 0.5rem 0;
  color: #495057;
`,ff=ve.p`
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
`,hf=ve.div`
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`,gf=ve.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({$current:e,$completed:t})=>e?"#007bff":t?"#28a745":"#dee2e6"};
  border: ${({$current:e})=>e?"2px solid #0056b3":"none"};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.2);
  }
`,xf=ve.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`,bf=ve.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({$variant:e})=>"primary"===e?"\n        background-color: #007bff;\n        color: white;\n        \n        &:hover:not(:disabled) {\n          background-color: #0056b3;\n        }\n        \n        &:disabled {\n          background-color: #6c757d;\n          cursor: not-allowed;\n        }\n      ":"\n        background-color: #6c757d;\n        color: white;\n        \n        &:hover:not(:disabled) {\n          background-color: #545b62;\n        }\n        \n        &:disabled {\n          background-color: #adb5bd;\n          cursor: not-allowed;\n        }\n      "}
`,vf=ve.div`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  
  ${({$status:e})=>{switch(e){case"idle":default:return"background-color: #e9ecef; color: #495057;";case"loading":return"background-color: #fff3cd; color: #856404;";case"success":return"background-color: #d4edda; color: #155724;";case"error":return"background-color: #f8d7da; color: #721c24;"}}}
`,wf=u.memo(({step:r,index:i,isActive:n,isCompleted:o,onExecute:a,onNext:s,isLast:d,disabled:c})=>{const l=e.useCallback(()=>{a()},[a]),p=e.useCallback(()=>{s()},[s]);return t.jsxs(rf,{id:`step-${i}`,$isActive:n,$isCompleted:o,children:[t.jsxs(nf,{children:[t.jsx(of,{$isActive:n,$isCompleted:o,children:r.title}),t.jsx(af,{$isActive:n,$isCompleted:o,children:i+1})]}),t.jsx(sf,{children:r.description}),r.code&&t.jsx(df,{children:r.code}),r.result&&t.jsxs(lf,{children:[t.jsx("h4",{children:"Response:"}),"string"==typeof r.result?t.jsx("pre",{children:r.result}):t.jsx("pre",{children:JSON.stringify(r.result,null,2)})]}),t.jsxs(cf,{children:[n&&r.execute&&t.jsxs(pf,{$variant:"primary",onClick:l,disabled:c,children:["Execute Step ",i+1]}),!d&&t.jsxs(pf,{$variant:"secondary",onClick:p,disabled:!o,children:[t.jsx(y,{}),"Next Step"]}),d&&o&&t.jsx(pf,{$variant:"success",disabled:!0,children:"Complete"})]})]})});wf.displayName="MemoizedStep";const yf=({steps:r,onStart:i,onReset:n,status:o,currentStep:a,onStepChange:s,onStepResult:d,disabled:c=!1,title:l,configurationButton:p})=>{const u=e.useCallback(async()=>{if(a<r.length&&r[a].execute)try{const e=await r[a].execute();d&&d(a,e),setTimeout(()=>{const e=document.getElementById(`step-${a}`);e&&e.scrollIntoView({behavior:"smooth",block:"center"})},100),a<r.length-1&&setTimeout(()=>{s(a+1)},500)}catch(e){d&&d(a,{error:e.message||"Unknown error"})}},[a,r,s,d]),f=e.useCallback(()=>{a<r.length-1&&s(a+1)},[a,r.length,s]),h=e.useCallback(()=>{a>0&&s(a-1)},[a,s]),g=e.useCallback(e=>{e>=0&&e<r.length&&s(e)},[r.length,s]);return t.jsxs(tf,{children:[t.jsxs(xf,{children:[t.jsxs(vf,{$status:o,children:["idle"===o&&"Ready to start","loading"===o&&`Step ${a+1} of ${r.length}`,"success"===o&&"Flow completed successfully","error"===o&&"Flow failed"]}),"idle"===o&&t.jsxs(bf,{$variant:"primary",onClick:i,disabled:c,children:[t.jsx(m,{}),"Start ",l]}),"loading"===o&&t.jsxs(t.Fragment,{children:[t.jsxs(bf,{$variant:"primary",onClick:u,disabled:c,children:["Execute Step ",a+1]}),t.jsxs(bf,{$variant:"secondary",onClick:()=>{f()},disabled:a>=r.length-1,children:[t.jsx(y,{}),a>=r.length-1?"Done!":"Next Step"]}),t.jsxs(bf,{$variant:"secondary",onClick:h,disabled:0===a,children:[t.jsx(P,{}),"Previous Step"]})]}),t.jsxs(bf,{$variant:"secondary",onClick:n,disabled:"idle"===o,children:[t.jsx(S,{}),"Reset"]}),p]}),"loading"===o&&t.jsxs(mf,{children:[t.jsxs(uf,{children:["Step ",a+1," of ",r.length,": ",r[a]?.title]}),t.jsx(ff,{children:r[a]?.description}),t.jsx(hf,{children:r.map((e,i)=>t.jsx(gf,{$current:i===a,$completed:i<a,onClick:()=>g(i),title:`Step ${i+1}: ${r[i]?.title}`},i))})]}),"loading"===o&&t.jsx("div",{children:r.map((e,i)=>t.jsx(wf,{step:e,index:i,isActive:i===a,isCompleted:i<a,onExecute:u,onNext:()=>s(i+1),isLast:i===r.length-1,disabled:c},i))})]})};yf.displayName="StepByStepFlowComponent";const kf=u.memo(yf);const jf=new class{CURRENT_FLOW_KEY="pingone_current_flow";FLOW_HISTORY_KEY="pingone_flow_history";MAX_HISTORY_SIZE=10;setCurrentFlow(e){try{return sessionStorage.setItem(this.CURRENT_FLOW_KEY,JSON.stringify(e)),this.addToHistory(e),!0}catch(t){return!1}}getCurrentFlow(){try{const e=sessionStorage.getItem(this.CURRENT_FLOW_KEY);if(!e)return null;return JSON.parse(e)}catch(e){return null}}clearCurrentFlow(){try{return sessionStorage.removeItem(this.CURRENT_FLOW_KEY),!0}catch(e){return!1}}trackFlowError(e){try{const t=`pingone_flow_error_${Date.now()}`;sessionStorage.setItem(t,JSON.stringify(e));const r=this.getCurrentFlow();if(r){const t={...r,lastError:e,lastErrorTime:Date.now()};sessionStorage.setItem(this.CURRENT_FLOW_KEY,JSON.stringify(t))}return!0}catch(t){return!1}}getFlowReturnUrl(){try{const e=this.getCurrentFlow();if(!e)return null;let t=`${window.location.origin}/flows/${e.flowKey}`;return void 0!==e.currentStep&&(t+=`?step=${e.currentStep}`),t}catch(e){return null}}returnToCurrentFlow(){try{const e=this.getFlowReturnUrl();return!!e&&(window.location.href=e,!0)}catch(e){return!1}}addToHistory(e){try{const t=[e,...this.getFlowHistory()].slice(0,this.MAX_HISTORY_SIZE);sessionStorage.setItem(this.FLOW_HISTORY_KEY,JSON.stringify(t))}catch(t){}}getFlowHistory(){try{const e=sessionStorage.getItem(this.FLOW_HISTORY_KEY);return e?JSON.parse(e):[]}catch(e){return[]}}clearFlowHistory(){try{return sessionStorage.removeItem(this.FLOW_HISTORY_KEY),!0}catch(e){return!1}}getFlowStats(){try{const e=this.getFlowHistory(),t=this.getCurrentFlow();let r=null;return t&&t.lastError&&(r=t.lastError),{totalFlows:e.length,currentFlow:t,lastError:r}}catch(e){return{totalFlows:0,currentFlow:null,lastError:null}}}};ve.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 16px;
	margin: 16px 0;
	font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	font-size: 12px;
`,ve.h3`
	margin: 0 0 12px 0;
	color: #1e293b;
	font-size: 14px;
	font-weight: 600;
`,ve.div`
	margin-bottom: 12px;
`,ve.div`
	font-weight: 600;
	color: #475569;
	margin-bottom: 4px;
`,ve.div`
	color: #64748b;
	margin-left: 8px;
`,ve.div`
	color: #dc2626;
	margin-left: 8px;
`,ve.button`
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 4px;
	padding: 6px 12px;
	font-size: 12px;
	cursor: pointer;
	margin-right: 8px;
	margin-top: 8px;
	
	&:hover {
		background: #2563eb;
	}
`,ve.div`
	background: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 4px;
	padding: 8px;
	margin-top: 8px;
	color: #92400e;
	font-size: 11px;
`;const Cf=(e,...t)=>{(new Date).toISOString().replace("T"," ").substring(0,19)},zf=(e,...t)=>{(new Date).toISOString().replace("T"," ").substring(0,19)},Sf=(e,...t)=>{(new Date).toISOString().replace("T"," ").substring(0,19)};class $f{static buildTokenRequest(e,t="client_secret_post"){const r=`https://auth.pingone.com/${e.environmentId}/as/token`,i={"Content-Type":"application/x-www-form-urlencoded"},n={grant_type:"client_credentials"};switch(e.environmentId&&(n.environment_id=e.environmentId),n.client_auth_method=t,e.scopes&&(n.scope=e.scopes),t){case"client_secret_basic":{const t=btoa(`${e.clientId}:${e.clientSecret}`);i.Authorization=`Basic ${t}`,e.clientId&&(n.client_id=e.clientId);break}case"client_secret_post":n.client_id=e.clientId,n.client_secret=e.clientSecret||"";break;case"private_key_jwt":n.client_id=e.clientId,n.client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",n.client_assertion="PLACEHOLDER_JWT";break;case"none":n.client_id=e.clientId}const o=new URLSearchParams(n).toString();return Cf("Built token request",{url:r,authMethod:t,hasScope:!!e.scopes}),{url:r,headers:i,body:o}}static async executeTokenRequest(e,t="client_secret_post"){const{headers:r,body:i}=$f.buildTokenRequest(e,t);try{Cf("Making token request",{url:"/api/token-exchange",headers:{...r,Authorization:r.Authorization?"[REDACTED]":"NONE"},bodyLength:i.length,bodyPreview:i.substring(0,200)+(i.length>200?"...":"")});const e=await fetch("/api/token-exchange",{method:"POST",headers:r,body:i});if(!e.ok){const t=await e.text();let r;zf("Token request failed",{status:e.status,statusText:e.statusText,errorText:t});try{r=JSON.parse(t)}catch{r={error:"unknown_error",error_description:t}}let i=`Token request failed: ${e.status}`;const n=e=>"object"==typeof e&&null!==e;throw i=401===e.status?n(r)&&"invalid_client"===r.error?`401 Unauthorized: Invalid client credentials - ${r.error_description||"Please check your Client ID, Client Secret, and Environment ID"}`:`401 Unauthorized: ${n(r)?r.error_description||"Authentication failed - please verify your credentials":"Authentication failed"}`:403===e.status?`403 Forbidden: ${n(r)?r.error_description||"Access denied - check your application permissions and scopes":"Access denied"}`:404===e.status?`404 Not Found: ${n(r)?r.error_description||"Environment or endpoint not found - verify your Environment ID":"Environment or endpoint not found"}`:e.status>=500?`${e.status} Server Error: ${n(r)?r.error_description||"PingOne server error - please try again later":"PingOne server error"}`:`${e.status} ${e.statusText}: ${n(r)&&r.error_description||t}`,new Error(i)}const t=await e.json();return Sf("Token request successful",{hasAccessToken:!!t.access_token,tokenType:t.token_type,expiresIn:t.expires_in}),t}catch(n){throw zf("Token request failed",n),n}}}class If{static listeners=[];static currentStatus={online:navigator.onLine,connectionType:"unknown"};static initialize(){window.addEventListener("online",If.handleOnline.bind(If)),window.addEventListener("offline",If.handleOffline.bind(If))}static getNetworkStatus(){return{...If.currentStatus}}static addStatusListener(e){If.listeners.push(e)}static removeStatusListener(e){const t=If.listeners.indexOf(e);t>-1&&If.listeners.splice(t,1)}static addNetworkStatusListener(e){If.addStatusListener(e)}static removeNetworkStatusListener(e){If.removeStatusListener(e)}static handleOnline(){If.currentStatus={...If.currentStatus,online:!0},If.notifyListeners()}static handleOffline(){If.currentStatus={...If.currentStatus,online:!1},If.notifyListeners()}static notifyListeners(){If.listeners.forEach(e=>{try{e(If.currentStatus)}catch(t){}})}}class Tf{static initialize(){}static logSecurityEvent(e){}}const Af="pingone_complete_mfa_v7_credentials",Rf=qe.getStepContentWrapper(),{StepHeader:Of,StepHeaderLeft:Uf,StepHeaderRight:Pf,StepHeaderTitle:Df,StepHeaderSubtitle:Ff,StepNumber:Ef,StepTotal:_f,NavigationButton:Nf}=Be.createStepLayout({theme:"blue",showProgress:!0}),Mf=[{id:"username_login",title:"User Authentication",subtitle:"Enter your credentials to authenticate with PingOne"},{id:"mfa_enrollment",title:"MFA Device Enrollment",subtitle:"Set up your multi-factor authentication device"},{id:"device_pairing",title:"Device Registration",subtitle:"Register your MFA device with PingOne"},{id:"mfa_challenge",title:"MFA Challenge",subtitle:"Complete the multi-factor authentication challenge"},{id:"token_retrieval",title:"Token Retrieval",subtitle:"Obtain your access tokens"},{id:"success",title:"Authentication Complete",subtitle:"You have successfully completed the MFA flow"}],qf=ve.div`
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem 0 6rem;
`,Bf=ve.div`
  max-width: 64rem;
  margin: 0 auto;
  padding: 0 1rem;
`,Lf=ve.div`
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
`,Vf=ve.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  margin: 1rem 0;

  ${e=>{switch(e.$variant){case"success":return"\n          background: #f0fdf4;\n          border: 1px solid #bbf7d0;\n          color: #166534;\n        ";case"warning":return"\n          background: #fffbeb;\n          border: 1px solid #fed7aa;\n          color: #92400e;\n        ";case"error":return"\n          background: #fef2f2;\n          border: 1px solid #fecaca;\n          color: #991b1b;\n        ";default:return"\n          background: #eff6ff;\n          border: 1px solid #bfdbfe;\n          color: #1e40af;\n        "}}}
`,Wf=ve.div`
  flex: 1;
`,Hf=ve.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
`,Yf=ve.div`
  font-size: 0.875rem;
  line-height: 1.5;
`,Jf=ve.div`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`,Gf=ve.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${e=>{switch(e.$variant){case"primary":return"\n          background: #3b82f6;\n          color: white;\n          &:hover:not(:disabled) { background: #2563eb; }\n        ";case"danger":return"\n          background: #ef4444;\n          color: white;\n          &:hover:not(:disabled) { background: #dc2626; }\n        ";default:return"\n          background: #f3f4f6;\n          color: #374151;\n          border: 1px solid #d1d5db;\n          &:hover:not(:disabled) { background: #e5e7eb; }\n        "}}}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`,Kf=({requireMFA:r=!0,maxRetries:i=3,onFlowComplete:n,onFlowError:o,onStepChange:c,showNetworkStatus:l=!0})=>{const[p,m]=e.useState("username_login"),[u,f]=e.useState(1),[h,g]=e.useState(!1),[x,w]=e.useState(null),[k,j]=e.useState(null),[C,z]=e.useState(0),[S,T]=e.useState(!1),[A,R]=e.useState(!1),[O,U]=e.useState(!1),[D,E]=e.useState(!1),[_,N]=e.useState(""),[q,B]=e.useState({phoneNumber:"",email:"",deviceName:"",verificationCode:""}),[L,V]=e.useState("+1"),[W,H]=e.useState(!1),[Y,J]=e.useState(null),[G,K]=e.useState(!1),[X,Z]=e.useState(!1),[Q,ee]=e.useState({}),te=e.useCallback(e=>({username_login:1,mfa_enrollment:2,device_pairing:3,mfa_challenge:4,token_retrieval:5,success:6,error:6}[e]||1),[]),re=e.useCallback(()=>{m("username_login"),c?.("username_login"),ae({flowId:"",authCredentials:{userId:""},mfaCredentials:{userId:"",workerToken:"",environmentId:""},userDevices:[],selectedDevice:void 0,session:void 0,tokens:void 0,networkStatus:{online:!0},error:void 0,resumeUrl:"",flowEnvironment:void 0,flowLinks:void 0,flowEmbedded:void 0,userId:""}),g(!1),w(null),z(0),ze(!1),$e(!1),_e(""),N(""),B({phoneNumber:"",email:"",deviceName:"",verificationCode:""}),ne({}),"undefined"!=typeof window&&(sessionStorage.removeItem("pingone_mfa_v7_session"),sessionStorage.removeItem("pingone_mfa_v7_tokens"),sessionStorage.removeItem("pingone_mfa_v7_pkce"),sessionStorage.removeItem("pingone_mfa_v7_flow_context"))},[c]);e.useEffect(()=>{f(te(p))},[p,te]);const[ie,ne]=e.useState({}),[oe,ae]=e.useState({flowId:"",userDevices:[],networkStatus:{online:!0}}),[se,de]=e.useState(Ve.getDefaultCredentials()),[ce,le]=e.useState({environmentId:"",clientId:"",clientSecret:"",workerToken:"",userId:"",redirectUri:"https://localhost:3000/oauth-callback",username:"",password:"",tokenEndpointAuthMethod:"client_secret_post"}),[ge,xe]=e.useState({environmentId:"",clientId:"",clientSecret:"",workerToken:"",userId:"",redirectUri:"https://localhost:3000/oauth-callback",username:"",password:"",tokenEndpointAuthMethod:"client_secret_post"}),[be,ve]=e.useState(!1),[we,ze]=e.useState(!1),[Se,$e]=e.useState(!1),[Te,_e]=e.useState("");e.useEffect(()=>{const e=`mfa_flow_v7_${Date.now()}_${Math.random().toString(36).slice(2,11)}`;ae(t=>({...t,flowId:e})),If.initialize(),Tf.initialize(),xe(e=>({...e,username:e.username||"curtis7",password:e.password||"Wolverine7&"})),m("username_login"),c?.("username_login");const t=Ve.loadCredentials();if(t)de(t);else{const e={environmentId:"b9817c16-9910-4415-b67e-4ac687da74d9",clientId:"66a4686b-9222-4ad2-91b6-03113711c9aa",clientSecret:"0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a",scopes:["p1:read:user","p1:update:user","p1:read:device","p1:update:device"],region:"us",tokenEndpointAuthMethod:"client_secret_basic"};Ve.saveCredentials(e),de(e)}if("undefined"!=typeof window){const e=ye.loadAuthzFlowCredentials();e&&le(t=>({...t,environmentId:e.environmentId||"",clientId:e.clientId||"",clientSecret:e.clientSecret||"",redirectUri:e.redirectUri||"",region:"us"}));const t=ye.loadCustomData(Af,null);t&&xe(e=>({...e,...t}))}},[c]),e.useEffect(()=>{(()=>{const e=sessionStorage.getItem("mfa_v7_auth_code"),t=sessionStorage.getItem("mfa_v7_state");e&&t&&(sessionStorage.removeItem("mfa_v7_auth_code"),sessionStorage.removeItem("mfa_v7_state"),m("token_retrieval"),c?.("token_retrieval"),ae(r=>({...r,authCode:e,state:t})))})()},[c]),e.useEffect(()=>{const e=e=>{ae(t=>({...t,networkStatus:e}))};return If.addStatusListener(e),()=>If.removeStatusListener(e)},[]);const qe=e.useCallback((e,t,r,i,n,o,a)=>({method:t,url:(r.startsWith("http"),r),headers:i,body:n,...o?{response:o}:{},flowType:"worker-token",stepName:e,educationalNotes:a||[],timestamp:new Date,duration:Math.floor(500*Math.random())+200}),[]),Be=e.useCallback(async()=>{if(!se.environmentId||!se.clientId||!se.clientSecret)return void ke.showError("Please enter Environment ID, Client ID, and Client Secret in the Worker Token Configuration section");if(se.clientId===se.environmentId)return void ke.showError("Client ID cannot be the same as Environment ID. Please check your Worker Token credentials.");const e=window.scrollY,t=t=>{t.preventDefault(),window.scrollTo(0,e)};window.addEventListener("scroll",t,{passive:!1}),window.addEventListener("wheel",t,{passive:!1}),window.addEventListener("touchmove",t,{passive:!1}),g(!0);try{const e={environmentId:se.environmentId,clientId:se.clientId,clientSecret:se.clientSecret,scope:"p1:read:user p1:update:user p1:read:device p1:update:device",tokenEndpoint:`https://auth.pingone.com/${se.environmentId}/as/token`},t=await $f.executeTokenRequest(e,"client_secret_post"),r=qe("workerToken","POST",e.tokenEndpoint,{"Content-Type":"application/x-www-form-urlencoded",Authorization:`Basic ${btoa(`${e.clientId}:${e.clientSecret}`)}`},{grant_type:"client_credentials",scope:"p1:read:user p1:update:user p1:read:device p1:update:device"},{status:200,statusText:"OK",data:t},["Worker tokens are used for server-to-server authentication","This token has permissions to manage MFA devices and challenges","The scope includes device management permissions: p1:read:device, p1:update:device",`Token expires in ${t.expires_in||3600} seconds`]);ne(e=>({...e,workerToken:r})),ae(e=>({...e,workerToken:t.access_token})),ke.showSuccess("✅ Worker token obtained successfully!"),j(null)}catch(r){const e=Ne.parseOAuthError(r,{flowType:"mfa",stepId:"worker-token-request",operation:"getWorkerToken",credentials:{hasClientId:!!se.clientId,hasClientSecret:!!se.clientSecret,hasEnvironmentId:!!se.environmentId},metadata:{scopes:se.scopes,authMethod:se.tokenEndpointAuthMethod}});ke.showError(e.message),j(e)}finally{g(!1),window.removeEventListener("scroll",t),window.removeEventListener("wheel",t),window.removeEventListener("touchmove",t),requestAnimationFrame(()=>{setTimeout(()=>{window.scrollTo({top:e,left:0,behavior:"instant"})},50)})}},[qe,se]),We=e.useCallback(async e=>{if(!ge.environmentId||!ge.clientId)return void ke.showError("Please enter Environment ID and Client ID");const t=window.scrollY;g(!0);try{let t="",i="";try{const e=sessionStorage.getItem("mfa-pkce-codes");if(e){const r=JSON.parse(e);t=r.codeChallenge,i=r.codeVerifier}else{const{generateCodeVerifier:e,generateCodeChallenge:r}=await je(async()=>{const{generateCodeVerifier:e,generateCodeChallenge:t}=await import("./utils-lzKqcxFi.js").then(e=>e.aV);return{generateCodeVerifier:e,generateCodeChallenge:t}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]));i=e(),t=await r(i),sessionStorage.setItem("mfa-pkce-codes",JSON.stringify({codeVerifier:i,codeChallenge:t,codeChallengeMethod:"S256"}))}}catch(r){return void ke.showError("Failed to generate PKCE codes")}let n=`https://auth.pingone.com/${ge.environmentId}/as/authorize?`;n+=new URLSearchParams({client_id:ge.clientId,response_type:"code",scope:"openid profile email p1:read:user p1:update:user",redirect_uri:ge.redirectUri||"https://localhost:3000/authz-callback",state:`mfa-${e}-${Date.now()}`,response_mode:"pi.flow"===e?"pi.flow":e,prompt:"login",acr_values:"mfa",code_challenge:t,code_challenge_method:"S256"}).toString();let o=!0,a="";const s=[];try{const e=new URL(n);e.protocol.startsWith("https:")||s.push("URL must use HTTPS protocol");const t=["client_id","response_type","redirect_uri","code_challenge"];for(const r of t)e.searchParams.has(r)||s.push(`Missing required parameter: ${r}`);"code"!==e.searchParams.get("response_type")&&s.push('response_type must be "code"'),"S256"!==e.searchParams.get("code_challenge_method")&&s.push('code_challenge_method must be "S256"');e.pathname.match(/\/as\/authorize$/)||s.push("Invalid authorization endpoint path"),ge.clientId===ge.environmentId&&s.push("Client ID cannot be the same as Environment ID"),s.length>0&&(o=!1,a=s.join("; "))}catch(r){o=!1,a=`URL validation error: ${r instanceof Error?r.message:"Unknown error"}`}const d={status:o?200:400,statusText:o?"OK":"Bad Request",data:o?{message:"Authorization URL validated successfully",redirect_url:n,flow_type:"pingone_mfa",response_type:e,has_pkce:!0,code_challenge:`${t.substring(0,20)}...`}:{error:a,validation_errors:s}},c=qe("deviceRegistration","GET",n,{Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","User-Agent":"Mozilla/5.0 (compatible; OAuth-Playground/1.0)"},null,d||{status:0,statusText:"No Response",error:"Failed to validate authorization URL"},[`PingOne MFA with response=${e}`,"pi.flow"===e?"Uses PingOne proprietary flow format":`Uses standard ${e} response mode`,"Includes MFA authentication context (acr_values=mfa)","Requires user interaction for MFA challenge","Returns authorization code for token exchange",`PKCE: code_challenge=${t.substring(0,20)}...`]);ne(e=>({...e,deviceRegistration:c})),o?ke.showSuccess(`✅ Authorization URL validated successfully for response=${e}`):ke.showError(`❌ Authorization URL validation failed: ${a}`)}catch(r){const e=r instanceof Error?r.message:"Unknown error";ke.showError(`Failed to validate authorization URL: ${e}`)}finally{g(!1),requestAnimationFrame(()=>{setTimeout(()=>{window.scrollTo({top:t,left:0,behavior:"instant"})},50)})}},[qe,ge]),He=e.useCallback(async()=>{T(!0);try{if(!Ve.saveCredentials(se))throw new Error("Failed to save worker token credentials");R(!1),ke.showSuccess("Worker Token credentials saved successfully")}catch(e){ke.showError("Failed to save worker token credentials")}finally{T(!1)}},[se]);e.useCallback(async()=>{T(!0);try{ye.saveAuthzFlowCredentials({environmentId:ce.environmentId,clientId:ce.clientId,clientSecret:ce.clientSecret,redirectUri:ce.redirectUri||"https://localhost:3000/authz-callback",scopes:["openid","profile","email"],authEndpoint:`https://auth.pingone.com/${ce.environmentId}/as/authorize`,tokenEndpoint:`https://auth.pingone.com/${ce.environmentId}/as/token`,userInfoEndpoint:`https://auth.pingone.com/${ce.environmentId}/as/userinfo`}),ye.savePermanentCredentials({environmentId:ce.environmentId,clientId:ce.clientId,clientSecret:ce.clientSecret,redirectUri:ce.redirectUri||"https://localhost:3000/authz-callback",scopes:["openid","profile","email"]}),ye.clearCache(),window.dispatchEvent(new CustomEvent("pingone-config-changed")),window.dispatchEvent(new CustomEvent("permanent-credentials-changed")),R(!1),ke.showSuccess("Authorization Code credentials saved successfully")}catch(e){ke.showError("Failed to save authorization code credentials")}finally{T(!1)}},[ce]),e.useCallback(async()=>{T(!0);try{if(!ye.saveCustomData(Af,{environmentId:ge.environmentId,clientId:ge.clientId,clientSecret:ge.clientSecret,redirectUri:ge.redirectUri,scopes:["openid","profile","email"]}))throw new Error("Failed to save credentials to credential manager");R(!1),ke.showSuccess("Credentials saved successfully")}catch(e){ke.showError("Failed to save credentials")}finally{T(!1)}},[ge]),e.useCallback(e=>{de(e),U(!0)},[]),e.useCallback(e=>{le(t=>({...t,environmentId:e})),E(!0)},[]),e.useCallback(e=>{le(t=>({...t,clientId:e})),E(!0)},[]),e.useCallback(e=>{le(t=>({...t,clientSecret:e})),E(!0)},[]),e.useCallback(e=>{le(t=>({...t,region:e})),E(!0)},[]),e.useCallback(e=>{le(t=>({...t,redirectUri:e})),E(!0)},[]),e.useCallback(e=>{le(t=>({...t,tokenEndpointAuthMethod:e})),E(!0)},[]),e.useCallback(e=>{xe(t=>({...t,environmentId:e})),R(!0)},[]),e.useCallback(e=>{xe(t=>({...t,clientId:e})),R(!0)},[]),e.useCallback(e=>{xe(t=>({...t,clientSecret:e})),R(!0)},[]),e.useCallback(e=>{xe(t=>({...t,redirectUri:e})),R(!0)},[]);const Ye=e.useCallback(async(e="redirectless")=>{if(ae(e=>({...e,flowId:"",resumeUrl:"",flowEnvironment:void 0,flowLinks:void 0,flowEmbedded:void 0})),"redirectless"===e){if(!ge.username||!ge.password)return void ke.showError("Please enter username and password for redirectless authentication");const e=window.scrollY;g(!0);try{let e="",r="";try{const t=sessionStorage.getItem("pingone_mfa_v7_pkce");if(t){const i=JSON.parse(t);r=i.codeVerifier,e=i.codeChallenge}else{const{generateCodeVerifier:t,generateCodeChallenge:i}=await je(async()=>{const{generateCodeVerifier:e,generateCodeChallenge:t}=await import("./utils-lzKqcxFi.js").then(e=>e.aV);return{generateCodeVerifier:e,generateCodeChallenge:t}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]));r=t(),e=await i(r),sessionStorage.setItem("pingone_mfa_v7_pkce",JSON.stringify({codeVerifier:r,codeChallenge:e,codeChallengeMethod:"S256"}))}}catch(t){return ke.showError("Failed to generate PKCE codes"),void g(!1)}const i=ce.environmentId||ge.environmentId,n=ce.clientId||ge.clientId,o=ce.clientSecret||ge.clientSecret;ce.redirectUri||ge.redirectUri;if(!i||!n)return ke.showError("Please enter Environment ID and Client ID in the Authorization Code Configuration section"),void g(!1);const a=`https://auth.pingone.com/${i}/as/authorize`,s=new URLSearchParams({response_type:"code",client_id:n,scope:"openid profile email",state:`mfa-flow-${Date.now()}`,nonce:`nonce-${Date.now()}`,code_challenge:e,code_challenge_method:"S256",response_mode:"pi.flow",username:ge.username,password:ge.password}),d=await fetch(a,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"},body:s.toString()}),l=d.headers.get("content-type");let p;if(!l?.includes("application/json")){const e=(await d.text()).match(/<title[^>]*>([^<]+)<\/title>/i),t=e?e[1]:"Unknown Error";throw new Error(`PingOne returned HTML instead of JSON. Page title: "${t}". This usually means invalid credentials or unsupported flow.`)}if(p=await d.json(),!d.ok)return void ke.showError(`Redirectless authentication failed: ${p.error||p.message||"Unknown error"}`);const u=qe("authentication","POST",`https://auth.pingone.com/${i}/as/authorize`,{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"},s.toString(),{status:d.status,statusText:d.statusText,data:p},["PingOne pi.flow (redirectless) authentication","POST request to /as/authorize with username/password in body","Returns flow object instead of redirect","Enables embedded authentication without browser redirects","PingOne proprietary extension to OAuth 2.0/OIDC"]);if(ne(e=>({...e,authentication:u})),p.id&&p.resumeUrl){let e;if(ke.showSuccess("Redirectless authentication initiated successfully"),p.userId)e=p.userId;else if(p.user?.id)e=p.user.id;else if(p._embedded?.user?.id)e=p._embedded.user.id;else if(p.id_token)try{const t=JSON.parse(atob(p.id_token.split(".")[1]));e=t.sub||t.user_id||t.id}catch(t){}ae(e?t=>({...t,flowId:p.id,resumeUrl:p.resumeUrl,flowEnvironment:p.environment,flowLinks:p._links,flowEmbedded:p._embedded,userId:e}):e=>({...e,flowId:p.id,resumeUrl:p.resumeUrl,flowEnvironment:p.environment,flowLinks:p._links,flowEmbedded:p._embedded}));try{const e=se||ce,t=e.clientId||n,r=e.clientSecret||ce.clientSecret||ge.clientSecret||"",o=e.environmentId||i,a=btoa(`${t}:${r}`),s=new URLSearchParams({grant_type:"client_credentials",scope:"p1:read:user p1:update:user p1:read:device p1:update:device"}),d=await fetch(`https://auth.pingone.com/${o}/as/token`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json",Authorization:`Basic ${a}`},body:s.toString()});if(d.ok){const e=await d.json();ae(t=>({...t,workerToken:e.access_token})),ke.showSuccess("✅ Worker token obtained! Ready for device registration.")}else{const e=await d.json();ke.showError(`Failed to get worker token: ${e.error_description||e.error||"Unknown error"}`)}}catch(t){}try{const e=await fetch("http://localhost:3001/api/pingone/resume",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({resumeUrl:p.resumeUrl,flowId:p.id,flowState:p.state,clientId:n,clientSecret:o})});if(e.ok){const t=await e.json();if(t.access_token){const e=t.id_token?JSON.parse(atob(t.id_token.split(".")[1])).sub:`real-user-${Date.now()}`;ae(t=>({...t,userId:e}))}else t.userId&&ae(e=>({...e,userId:t.userId}))}else{await e.json().catch(()=>({}))}}catch(t){}m("device_pairing"),c?.("device_pairing"),ke.showSuccess("✅ Redirectless authentication completed! Proceeding to device pairing.")}else if(p.access_token){ke.showSuccess("Redirectless authentication completed successfully");let e="";if(p.id_token)try{const t=JSON.parse(atob(p.id_token.split(".")[1]));e=t.sub||t.user_id||t.id||""}catch(t){}ae(t=>({...t,userId:e,tokens:{access_token:p.access_token,refresh_token:p.refresh_token,id_token:p.id_token,token_type:p.token_type,expires_in:p.expires_in}})),m("success")}else p.id&&p.resumeUrl?(ke.showSuccess("Redirectless authentication initiated successfully"),ae(e=>({...e,flowId:p.id,resumeUrl:p.resumeUrl,flowEnvironment:p.environment,flowLinks:p._links,flowEmbedded:p._embedded})),m("device_pairing"),c?.("device_pairing"),ke.showSuccess("✅ Redirectless authentication successful! Ready for device registration.")):ke.showWarning("Unexpected response format from PingOne")}catch(r){const e=r instanceof Error?r.message:"Unknown error";return void ke.showError(`Authorization request failed: ${e}`)}finally{g(!1),requestAnimationFrame(()=>{window.scrollTo(0,e)})}return}{let e="",r="";try{const t=sessionStorage.getItem("pingone_mfa_v7_pkce");if(t){const i=JSON.parse(t);r=i.codeVerifier,e=i.codeChallenge}else{const{generateCodeVerifier:t,generateCodeChallenge:i}=await je(async()=>{const{generateCodeVerifier:e,generateCodeChallenge:t}=await import("./utils-lzKqcxFi.js").then(e=>e.aV);return{generateCodeVerifier:e,generateCodeChallenge:t}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]));r=t(),e=await i(r),sessionStorage.setItem("pingone_mfa_v7_pkce",JSON.stringify({codeVerifier:r,codeChallenge:e,codeChallengeMethod:"S256"}))}}catch(t){return void ke.showError("Failed to generate PKCE codes")}if(!e||0===e.length)return void ke.showError("Failed to generate PKCE code challenge");if(!r||0===r.length)return void ke.showError("Failed to generate PKCE code verifier");const i=ce.environmentId||ge.environmentId,n=ce.clientId||ge.clientId,o=ce.redirectUri||ge.redirectUri||"https://localhost:3000/oauth-callback";if(!i||!n)return void ke.showError("Please enter Environment ID and Client ID in the Authorization Code Configuration section");const a=`https://auth.pingone.com/${i}/as/authorize?${new URLSearchParams({client_id:n,response_type:"code",response_mode:"query",scope:"openid profile email",redirect_uri:o,state:`mfa-flow-${Date.now()}`,code_challenge:e,code_challenge_method:"S256"}).toString()}`,s={flow:"pingone-complete-mfa-v7",returnPath:"/pingone-authentication",timestamp:Date.now()};sessionStorage.setItem("flowContext",JSON.stringify(s)),sessionStorage.setItem("active_oauth_flow","pingone-complete-mfa-v7"),_e(a)}},[ge,ce,qe,c,se]),Je=e.useCallback(async()=>{ze(!1),g(!0),w(null);try{if(oe.flowId&&oe.resumeUrl){const e=window.open(oe.resumeUrl,"PingOneAuth","width=600,height=700,scrollbars=yes,resizable=yes");if(!e)throw new Error("Failed to open authentication popup. Please allow popups for this site.");const t=setInterval(()=>{e.closed&&(clearInterval(t),m("device_pairing"),c?.("device_pairing"),ke.showSuccess("✅ Authentication completed! Proceeding to device registration."))},1e3)}else await new Promise(e=>setTimeout(e,2e3)),$e(!0),ke.showSuccess("✅ User authenticated successfully!")}catch(e){const t=e instanceof Error?e.message:"Authentication failed";w(t),ke.showError(`Authentication failed: ${t}`)}finally{g(!1)}},[oe.flowId,oe.resumeUrl,c]),Ge=e.useCallback(()=>{$e(!1),m("mfa_enrollment"),c?.("mfa_enrollment")},[c]),Ke=e.useCallback(()=>{z(e=>e+1),w(null),m("username_login")},[]),Xe=e.useCallback(()=>{re()},[re]),Ze=e.useCallback(()=>{if(!_)return!1;if(!q.deviceName.trim())return!1;switch(_){case"sms":return q.phoneNumber.trim().length>0;case"email":return q.email.trim().length>0&&q.email.includes("@");case"totp":return 6===q.verificationCode.trim().length;case"fido2":case"push":return!0;default:return!1}},[_,q]),Qe=e.useCallback(async()=>{if(!Ze())return void ke.showError("Please fill in all required device information");let e=oe.userId;if(!e&&oe.flowEmbedded?.user?.id&&(e=oe.flowEmbedded.user.id,e&&ae(t=>({...t,userId:e}))),!e&&oe.tokens?.id_token)try{const t=JSON.parse(atob(oe.tokens.id_token.split(".")[1])),r=t.sub||t.user_id||t.id;r&&"string"==typeof r&&(e=r,ae(t=>({...t,userId:e})))}catch(t){}if(e){g(!0);try{let t=q.phoneNumber;"sms"===_&&q.phoneNumber&&!q.phoneNumber.startsWith("+")&&(t=L+q.phoneNumber);const r="http://localhost:3001/api/device/register",i={environmentId:ce.environmentId,userId:e,deviceType:_,deviceName:q.deviceName,contactInfo:"sms"===_?t:"email"===_?q.email:void 0,verificationCode:"totp"===_?q.verificationCode:void 0,workerToken:oe.workerToken},n=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)});if(!n.ok){const e=await n.json();throw new Error(`Device registration failed: ${e.message||e.error||"Unknown error"}`)}const o=await n.json(),a=qe("deviceRegistration","POST",r,{"Content-Type":"application/json",Authorization:`Bearer ${oe.workerToken}`},JSON.stringify(i),{status:n.status,statusText:n.statusText,data:o},[`Register ${_.toUpperCase()} device with PingOne`,"Device registration enables MFA for this user","Device must be verified before it can be used for authentication","Multiple devices can be registered for backup options"]);ne(e=>({...e,deviceRegistration:a}));const s={id:o.deviceId||o.id,type:_,deviceName:q.deviceName,status:o.status||"ACTIVE",activationRequired:o.activationRequired||!1};ae(e=>({...e,userDevices:[...e.userDevices,s],selectedDevice:s})),J({deviceId:s.id,deviceType:_,deviceName:q.deviceName,contactInfo:"sms"===_?t:"email"===_?q.email:"totp"===_?"TOTP App":"Device",status:"active",registeredAt:(new Date).toISOString()}),H(!0),ke.showSuccess(`${_.toUpperCase()} device registered successfully!`)}catch(t){const e=t instanceof Error?t.message:"Unknown error";ke.showError(`Device registration failed: ${e}`)}finally{g(!1)}}else ke.showError("Please complete authentication first to get your user ID. Complete the authentication step and wait for the flow to finish before registering devices.")},[_,q,Ze,ce.environmentId,oe.workerToken,qe,L,oe]),et=e.useCallback(()=>{H(!1),J(null)},[]),tt=e.useCallback(()=>{H(!1),J(null),m("mfa_challenge"),c?.("mfa_challenge")},[c]),rt=e.useCallback(()=>{K(!0)},[]),it=e.useCallback(()=>{K(!1)},[]),nt=e.useCallback(()=>{K(!1),ke.showSuccess("Authenticator app setup complete! Now enter the 6-digit code from your app.")},[]),ot=e.useCallback(()=>{Z(!0)},[]),at=e.useCallback(()=>{Z(!1)},[]),st=e.useCallback(async(e,t)=>{Z(!1),sessionStorage.setItem("fido2Credential",JSON.stringify({credentialId:e,publicKey:t})),ke.showSuccess("FIDO2 passkey registered successfully!"),"fido2"!==_&&N("fido2");try{await Qe(),setTimeout(()=>{H(!1),J(null),m("mfa_challenge"),c?.("mfa_challenge"),ke.showSuccess("✅ FIDO2 device registered! Proceeding to MFA challenge.")},1e3)}catch(r){ke.showError("Failed to register FIDO2 device with PingOne")}},[Qe,c,_,q.deviceName]),dt=e.useCallback(async e=>{if(oe.workerToken&&ce.environmentId){g(!0);try{const t=window.scrollY,r=e=>{e.preventDefault(),window.scrollTo(0,t)};window.addEventListener("scroll",r,{passive:!1});try{const t=await fetch("/api/mfa/challenge/initiate",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${oe.workerToken}`},body:JSON.stringify({environmentId:ce.environmentId,userId:oe.userId||"current-user",deviceId:e.id,deviceType:e.type,challengeType:e.type})});if(!t.ok)throw new Error(`MFA challenge initiation failed: ${t.statusText}`);const r=await t.json(),i=qe("mfaChallengeInitiate","POST","/api/mfa/challenge/initiate",{"Content-Type":"application/json",Authorization:`Bearer ${oe.workerToken}`},{environmentId:ce.environmentId,userId:oe.userId||"current-user",deviceId:e.id,deviceType:e.type,challengeType:e.type},{status:200,statusText:"OK",data:r},["Initiates MFA challenge for the selected device",`Challenge type: ${e.type}`,"Requires worker token with MFA permissions","Returns challenge ID and delivery status","User will receive challenge code via selected method"]);ne(e=>({...e,mfaChallengeInitiate:i})),ee(t=>({...t,challengeId:r.challengeId,challengeType:e.type,isChallengeSent:!0,challengeStatus:"pending",selectedDevice:e})),ke.showSuccess(`MFA challenge sent to your ${e.type} device`)}finally{window.removeEventListener("scroll",r)}}catch(t){ke.showError(`Failed to initiate MFA challenge: ${t instanceof Error?t.message:"Unknown error"}`)}finally{g(!1)}}else ke.showError("Worker token and environment ID are required for MFA challenge")},[oe.workerToken,oe.userId,ce.environmentId,qe]),ct=e.useCallback(async e=>{if(Q.challengeId&&oe.workerToken&&ce.environmentId){g(!0);try{const t=window.scrollY,r=e=>{e.preventDefault(),window.scrollTo(0,t)};window.addEventListener("scroll",r,{passive:!1});try{const t=await fetch("/api/mfa/challenge/verify",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${oe.workerToken}`},body:JSON.stringify({environmentId:ce.environmentId,challengeId:Q.challengeId,challengeCode:e,userId:oe.userId||"current-user"})});if(!t.ok)throw new Error(`MFA challenge verification failed: ${t.statusText}`);const r=await t.json(),i=qe("mfaChallengeVerify","POST","/api/mfa/challenge/verify",{"Content-Type":"application/json",Authorization:`Bearer ${oe.workerToken}`},{environmentId:ce.environmentId,challengeId:Q.challengeId,challengeCode:e,userId:oe.userId||"current-user"},{status:200,statusText:"OK",data:r},["Verifies the MFA challenge code entered by user","Challenge code is validated against the initiated challenge","Returns verification status and session token","Successful verification allows token exchange","Failed verification requires retry or new challenge"]);ne(e=>({...e,mfaChallengeVerify:i})),ee(e=>({...e,challengeStatus:r.success?"completed":"failed"})),r.success?(ke.showSuccess("MFA challenge completed successfully!"),m("token_retrieval"),c?.("token_retrieval")):ke.showError("MFA challenge verification failed. Please try again.")}finally{window.removeEventListener("scroll",r)}}catch(t){ke.showError(`Failed to verify MFA challenge: ${t instanceof Error?t.message:"Unknown error"}`)}finally{g(!1)}}else ke.showError("Challenge ID, worker token, and environment ID are required for verification")},[Q.challengeId,oe.workerToken,oe.userId,ce.environmentId,qe,c]),lt=e.useCallback(async()=>{if(oe.authCode&&ce.environmentId&&ce.clientId&&ce.clientSecret){g(!0);try{const t=sessionStorage.getItem("mfa-pkce-codes")||sessionStorage.getItem("pingone_mfa_v7_pkce");if(!t)throw new Error("PKCE code verifier not found");const{codeVerifier:r}=JSON.parse(t),i=`https://auth.pingone.com/${ce.environmentId}/as/token`,n={grant_type:"authorization_code",code:oe.authCode,redirect_uri:ce.redirectUri||"https://localhost:3000/mfa-callback",client_id:ce.clientId,client_secret:ce.clientSecret,code_verifier:r,environment_id:ce.environmentId},o=await fetch("/api/token-exchange",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),a=await o.json();if(!o.ok)throw new Error(a.error_description||"Token exchange failed");let s="";if(a.id_token)try{const e=JSON.parse(atob(a.id_token.split(".")[1]));s=e.sub||e.user_id||e.id||""}catch(e){}ae(e=>({...e,userId:s,tokens:{access_token:a.access_token,refresh_token:a.refresh_token,id_token:a.id_token,token_type:a.token_type,expires_in:a.expires_in}}));const d=qe("tokenExchange","POST",i,{"Content-Type":"application/json"},JSON.stringify(n),{status:200,statusText:"OK",data:{access_token:a.access_token?`${a.access_token.substring(0,20)}...`:null,id_token:a.id_token?`${a.id_token.substring(0,20)}...`:null,refresh_token:a.refresh_token?`${a.refresh_token.substring(0,20)}...`:null,token_type:a.token_type,expires_in:a.expires_in}});ne(e=>({...e,tokenExchange:d})),ke.showSuccess("✅ Tokens retrieved successfully!"),m("success"),c?.("success")}catch(e){const t=e instanceof Error?e.message:"Unknown error";ke.showError(`Token exchange failed: ${t}`)}finally{g(!1)}}else ke.showError("Missing authorization code or credentials for token exchange")},[oe.authCode,ce,qe,c]);return t.jsxs(qf,{children:[t.jsxs(Bf,{children:[t.jsx(Ie,{flowId:"pingone-complete-mfa-v7"}),t.jsx(Me,{flowType:"pingone-complete-mfa-v7",isOIDC:!0,workerToken:localStorage.getItem("worker_token")||"",credentials:{environmentId:ce.environmentId,clientId:ce.clientId,clientSecret:ce.clientSecret,redirectUri:ce.redirectUri||"https://localhost:3000/oauth-callback",scopes:"openid profile email"},onCredentialsChange:e=>{le(t=>({...t,environmentId:e.environmentId||t.environmentId,clientId:e.clientId||t.clientId,clientSecret:e.clientSecret||t.clientSecret,redirectUri:e.redirectUri||t.redirectUri||"https://localhost:3000/oauth-callback"}))},onClientAuthMethodChange:e=>{le(t=>({...t,tokenEndpointAuthMethod:e}))},clientAuthMethod:ce.tokenEndpointAuthMethod||"client_secret_post",onDiscoveryComplete:e=>{if(e.success&&e.document){const t=Ce.extractEnvironmentId(e.document.issuer);t&&le(e=>({...e,environmentId:t}))}},requireClientSecret:!0,showRedirectUri:!0,showConfigChecker:!1,defaultCollapsed:!1,title:"PingOne Complete MFA Flow Configuration",subtitle:"Configure your PingOne environment and client credentials for MFA authentication"}),t.jsx(ku,{flowType:"mfa",showAdditionalInfo:!0,showDocumentation:!0,showCommonIssues:!1,showImplementationNotes:!0}),t.jsxs(Lf,{children:[t.jsxs(Of,{children:[t.jsxs(Uf,{children:[t.jsx(Df,{children:Mf[u-1]?.title||"MFA Authentication"}),t.jsx(Ff,{children:Mf[u-1]?.subtitle||"Complete multi-factor authentication"})]}),t.jsxs(Pf,{children:[t.jsx(Ef,{children:String(u).padStart(2,"0")}),t.jsxs(_f,{children:["of ",Mf.length]})]})]}),t.jsx(Rf,{children:(()=>{if(h&&"username_login"===p)return t.jsxs("div",{style:{textAlign:"center",padding:"3rem"},children:[t.jsx(M,{size:48,color:"#7c3aed",style:{animation:"spin 1s linear infinite"}}),t.jsx("h3",{style:{margin:"1rem 0 0.5rem 0",fontSize:"1.25rem",fontWeight:"600"},children:"Initializing PingOne MFA Flow V7"}),t.jsx("p",{style:{margin:0,color:"#6b7280"},children:"Setting up your secure multi-factor authentication flow..."})]});switch(p){case"username_login":return t.jsxs(t.Fragment,{children:[t.jsxs(xn,{title:"⚠️ Important: PingOne Configuration Requirements",subtitle:"Understanding the two different authentication flows and their requirements",icon:t.jsx(d,{}),theme:"orange",defaultCollapsed:!0,children:[t.jsxs(Vf,{$variant:"warning",children:[t.jsx(d,{size:20,style:{flexShrink:0}}),t.jsxs(Wf,{children:[t.jsx(Hf,{children:"🚨 Common Configuration Issues"}),t.jsxs(Yf,{children:[t.jsx("strong",{children:'Error: "Redirect URI mismatch"'})," - Your PingOne application must have the redirect URI configured.",t.jsx("br",{}),t.jsx("strong",{children:'Error: "unsupported_grant_type: password"'})," - PingOne does not support Resource Owner Password Credentials flow."]})]})]}),t.jsxs("div",{style:{margin:"1rem 0",padding:"1rem",background:"#fef3c7",borderRadius:"0.75rem",border:"1px solid #f59e0b"},children:[t.jsx("h4",{style:{margin:"0 0 0.75rem 0",fontSize:"0.875rem",fontWeight:600,color:"#92400e"},children:"📋 PingOne Application Setup Checklist"}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#92400e",lineHeight:1.6},children:[t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"1. Create/Configure Your PingOne Application:"}),t.jsxs("ul",{style:{margin:"0.25rem 0 0 1rem",padding:0},children:[t.jsx("li",{children:"Go to PingOne Admin Console → Applications"}),t.jsx("li",{children:"Create a new application or edit existing one"}),t.jsxs("li",{children:["Set ",t.jsx("strong",{children:"Grant Types"}),": ✅ Authorization Code, ✅ Client Credentials"]}),t.jsxs("li",{children:["Set ",t.jsx("strong",{children:"Response Types"}),": ✅ Code"]})]})]}),t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"2. Configure Redirect URIs:"}),t.jsxs("ul",{style:{margin:"0.25rem 0 0 1rem",padding:0},children:[t.jsxs("li",{children:["Add: ",t.jsx("code",{children:"https://localhost:3000/oauth-callback"})]}),t.jsxs("li",{children:["Add: ",t.jsx("code",{children:"https://localhost:3000"})," (for redirectless)"]}),t.jsx("li",{children:"These must match exactly what you enter below"})]})]}),t.jsxs("div",{style:{marginBottom:"0.5rem"},children:[t.jsx("strong",{children:"3. Get Your Credentials:"}),t.jsxs("ul",{style:{margin:"0.25rem 0 0 1rem",padding:0},children:[t.jsxs("li",{children:["Copy ",t.jsx("strong",{children:"Client ID"})," and ",t.jsx("strong",{children:"Client Secret"})]}),t.jsxs("li",{children:["Copy ",t.jsx("strong",{children:"Environment ID"})," from your environment"]}),t.jsx("li",{children:"These will be used for both configurations below"})]})]})]})]}),t.jsxs("div",{style:{margin:"1rem 0",padding:"1rem",background:"#f0f9ff",borderRadius:"0.75rem",border:"1px solid #0ea5e9"},children:[t.jsx("h4",{style:{margin:"0 0 0.75rem 0",fontSize:"0.875rem",fontWeight:600,color:"#0c4a6e"},children:"🔄 Two Authentication Flows Explained"}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#0c4a6e",lineHeight:1.6},children:[t.jsxs("div",{style:{marginBottom:"0.75rem"},children:[t.jsx("strong",{children:"🔑 Worker Token (Client Credentials):"}),t.jsxs("ul",{style:{margin:"0.25rem 0 0 1rem",padding:0},children:[t.jsx("li",{children:"Machine-to-machine authentication"}),t.jsx("li",{children:"No user interaction required"}),t.jsx("li",{children:"Used for MFA operations and API calls"}),t.jsx("li",{children:"No redirect URI needed"})]})]}),t.jsxs("div",{children:[t.jsx("strong",{children:"👤 User Authentication (Authorization Code):"}),t.jsxs("ul",{style:{margin:"0.25rem 0 0 1rem",padding:0},children:[t.jsx("li",{children:"User login with username/password"}),t.jsx("li",{children:"Requires redirect URI configuration"}),t.jsx("li",{children:"Used for user authentication flows"}),t.jsx("li",{children:"Supports both redirect and redirectless modes"})]})]})]})]})]}),t.jsx(Me,{flowType:"worker-token-v7",isOIDC:!1,workerToken:oe.workerToken||localStorage.getItem("worker_token")||"",credentials:{environmentId:se.environmentId,clientId:se.clientId,clientSecret:se.clientSecret,scopes:se.scopes.join(" ")||"p1:read:user p1:update:user p1:read:device p1:update:device",region:se.region||"us",redirectUri:""},onCredentialsChange:e=>{de(t=>({...t,environmentId:e.environmentId||t.environmentId,clientId:e.clientId||t.clientId,clientSecret:e.clientSecret||t.clientSecret,scopes:e.scopes?e.scopes.split(" "):t.scopes,region:e.region||t.region})),U(!0)},onClientAuthMethodChange:e=>{de(t=>({...t,tokenEndpointAuthMethod:e})),U(!0)},clientAuthMethod:se.tokenEndpointAuthMethod||"client_secret_post",onDiscoveryComplete:e=>{if(e.success&&e.document){const t=Ce.extractEnvironmentId(e.document.issuer);t&&(de(e=>({...e,environmentId:t})),U(!0))}},onSave:async()=>{await He()},requireClientSecret:!0,showRedirectUri:!1,showConfigChecker:!1,defaultCollapsed:!0,title:"🔑 Worker Token Configuration",subtitle:"Client Credentials Grant • Machine-to-Machine Authentication • No Redirect URI Required"}),k&&t.jsx(Ee,{errorDetails:k,onDismiss:()=>j(null),onClearAndRetry:()=>{j(null),de({environmentId:"",clientId:"",clientSecret:"",scopes:["p1:read:user","p1:update:user","p1:read:device","p1:update:device"],tokenEndpointAuthMethod:"client_secret_post"})},showCorrelationId:!0}),t.jsx(xn,{title:"Step 1: Get Worker Token",subtitle:"Obtain a worker token for MFA operations",icon:t.jsx(I,{}),theme:"blue",children:t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("p",{style:{color:"#6b7280",fontSize:"0.875rem",marginBottom:"1rem"},children:"Before performing MFA operations, we need to obtain a worker token that has the necessary permissions to manage MFA devices and challenges."}),ie.workerToken?t.jsxs("div",{children:[t.jsx(Pe,{apiCall:ie.workerToken,options:{showEducationalNotes:!0,showFlowContext:!0,urlHighlightRules:De.getDefaultHighlightRules("client-credentials")}}),t.jsx("div",{style:{marginTop:"1rem",display:"flex",justifyContent:"center",gap:"1rem"},children:t.jsx("button",{onClick:Be,disabled:h,style:{background:h?"#9ca3af":"#10b981",color:"white",border:"none",padding:"0.5rem 1rem",borderRadius:"6px",cursor:h?"not-allowed":"pointer",fontSize:"0.875rem",fontWeight:"500",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.2s ease"},children:h?t.jsxs(t.Fragment,{children:[t.jsx(Jf,{children:t.jsx(M,{size:16})}),"Getting New Token..."]}):t.jsxs(t.Fragment,{children:[t.jsx(M,{size:16}),"Get New Worker Token"]})})})]}):t.jsxs("div",{style:{padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",textAlign:"center",color:"#6b7280"},children:[t.jsx(I,{size:24,style:{marginBottom:"0.5rem"}}),t.jsx("p",{style:{marginBottom:"1rem"},children:"Worker token API call will be displayed here after authentication"}),t.jsx("button",{onClick:Be,disabled:h,style:{background:h?"#9ca3af":"#3b82f6",color:"white",border:"none",padding:"0.5rem 1rem",borderRadius:"6px",cursor:h?"not-allowed":"pointer",fontSize:"0.875rem",fontWeight:"500",display:"flex",alignItems:"center",gap:"0.5rem",transition:"all 0.2s ease"},children:h?t.jsxs(t.Fragment,{children:[t.jsx(Jf,{children:t.jsx(M,{size:16})}),"Getting Token..."]}):t.jsxs(t.Fragment,{children:[t.jsx(I,{size:16}),"Get Worker Token"]})})]})]})}),t.jsx(xn,{title:"🔐 USER AUTHENTICATION",subtitle:"Choose between Redirect or Redirectless Authentication • Uses Authorization Code Configuration Above",icon:t.jsx(he,{}),theme:"green",defaultCollapsed:!1,children:t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsx("p",{style:{color:"#6b7280",fontSize:"0.875rem",marginBottom:"1rem"},children:"Choose your preferred authentication method. Redirect authentication opens a new window, while redirectless authentication uses response_mode=pi.flow for seamless integration."}),t.jsxs("div",{style:{marginBottom:"1.5rem",padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px"},children:[t.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"0.875rem",fontWeight:"600",color:"#374151"},children:"👤 User Credentials (Required for Redirectless Authentication)"}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"},children:[t.jsxs("div",{children:[t.jsx("label",{style:{display:"block",fontSize:"0.75rem",fontWeight:"500",color:"#374151",marginBottom:"0.25rem"},children:"Username"}),t.jsx("input",{type:"text",value:ge.username||"curtis7",onChange:e=>xe(t=>({...t,username:e.target.value})),placeholder:"Enter your username",style:{width:"100%",padding:"0.5rem",border:"1px solid #d1d5db",borderRadius:"4px",fontSize:"0.875rem",background:"#ffffff"}})]}),t.jsxs("div",{children:[t.jsx("label",{style:{display:"block",fontSize:"0.75rem",fontWeight:"500",color:"#374151",marginBottom:"0.25rem"},children:"Password"}),t.jsx("input",{type:"password",value:ge.password||"Wolverine7&",onChange:e=>xe(t=>({...t,password:e.target.value})),placeholder:"Enter your password",style:{width:"100%",padding:"0.5rem",border:"1px solid #d1d5db",borderRadius:"4px",fontSize:"0.875rem",background:"#ffffff"}})]})]})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))",gap:"1rem",marginBottom:"1.5rem"},children:[t.jsxs("button",{onClick:()=>Ye("redirectless"),disabled:h||!ge.username||!ge.password,style:{padding:"1.25rem",background:ge.username&&ge.password?"#059669":"#9ca3af",color:"white",border:"none",borderRadius:"12px",fontSize:"1rem",fontWeight:"700",cursor:!h&&ge.username&&ge.password?"pointer":"not-allowed",opacity:!h&&ge.username&&ge.password?1:.6,transition:"all 0.2s ease",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.75rem",flexDirection:"column",textAlign:"center",boxShadow:ge.username&&ge.password?"0 4px 12px rgba(5, 150, 105, 0.3)":"none",transform:ge.username&&ge.password?"translateY(-2px)":"none",position:"relative"},children:[t.jsx("div",{style:{position:"absolute",top:"-8px",right:"-8px",background:"#f59e0b",color:"white",fontSize:"0.625rem",fontWeight:"600",padding:"0.25rem 0.5rem",borderRadius:"12px",textTransform:"uppercase",letterSpacing:"0.05em"},children:"Default"}),t.jsx(F,{size:28}),t.jsxs("div",{children:[t.jsx("div",{style:{fontWeight:"700",marginBottom:"0.25rem",fontSize:"1.1rem"},children:"Redirectless Authentication"}),t.jsx("div",{style:{fontSize:"0.8rem",opacity:.9},children:"Uses response_mode=pi.flow"})]})]}),t.jsxs("button",{onClick:()=>Ye("redirect"),disabled:!1,style:{padding:"1rem",background:"#3b82f6",color:"white",border:"none",borderRadius:"8px",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",opacity:1,transition:"all 0.2s ease",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",flexDirection:"column",textAlign:"center"},children:[t.jsx(a,{size:24}),t.jsxs("div",{children:[t.jsx("div",{style:{fontWeight:"700",marginBottom:"0.25rem"},children:"Redirect Authentication"}),t.jsx("div",{style:{fontSize:"0.75rem",opacity:.9},children:"PingOne provides the UI"})]})]})]}),t.jsxs("div",{style:{marginTop:"1.5rem",padding:"1rem",background:"#f0f9ff",border:"1px solid #0ea5e9",borderRadius:"0.5rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[t.jsx(I,{size:16,style:{color:"#0ea5e9"}}),t.jsx("span",{style:{fontSize:"0.875rem",fontWeight:"600",color:"#0c4a6e"},children:"Using Client ID for Authentication:"})]}),t.jsx("div",{style:{fontFamily:"monospace",fontSize:"0.75rem",color:"#0c4a6e",background:"#ffffff",padding:"0.5rem",borderRadius:"0.25rem",border:"1px solid #bae6fd",wordBreak:"break-all"},children:ce.clientId||"No Client ID configured"}),!ce.clientId&&t.jsx("div",{style:{marginTop:"0.5rem",fontSize:"0.75rem",color:"#dc2626",fontStyle:"italic"},children:"⚠️ Please configure the Authorization Code Configuration above before proceeding"})]}),t.jsxs(Vf,{$variant:"info",children:[t.jsx(b,{size:20,style:{flexShrink:0}}),t.jsxs(Wf,{children:[t.jsx(Hf,{children:"🔐 Authentication Methods"}),t.jsxs(Yf,{children:[t.jsx("strong",{children:"Redirect:"})," Traditional OAuth flow where PingOne provides the authentication UI in a new window.",t.jsx("br",{}),t.jsx("strong",{children:"Redirectless:"})," Modern PingOne flow using response_mode=pi.flow. You must provide username/password above as our app handles the authentication directly."]})]})]})]})})]});case"mfa_enrollment":return t.jsxs(xn,{title:"MFA Device Enrollment",subtitle:"Set up your multi-factor authentication device",icon:t.jsx(me,{}),theme:"green",defaultCollapsed:!1,children:[t.jsxs(Vf,{$variant:"info",children:[t.jsx(b,{size:20,style:{flexShrink:0}}),t.jsxs(Wf,{children:[t.jsx(Hf,{children:"📱 MFA Device Setup"}),t.jsx(Yf,{children:"Choose your preferred multi-factor authentication method. This will be used to verify your identity during future logins."})]})]}),t.jsxs("div",{style:{marginTop:"1.5rem"},children:[t.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1rem",fontWeight:"600",color:"#374151"},children:"🔧 PingOne MFA Response Options"}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"1rem",marginBottom:"1.5rem"},children:[t.jsxs("button",{onClick:()=>We("pi.flow"),disabled:h,style:{padding:"0.75rem 1rem",background:"#3b82f6",color:"white",border:"none",borderRadius:"6px",fontSize:"0.875rem",fontWeight:"600",cursor:h?"not-allowed":"pointer",opacity:h?.6:1,transition:"all 0.2s ease",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(y,{size:16}),"response_mode=pi.flow"]}),t.jsxs("button",{onClick:()=>We("redirect"),disabled:h,style:{padding:"0.75rem 1rem",background:"#10b981",color:"white",border:"none",borderRadius:"6px",fontSize:"0.875rem",fontWeight:"600",cursor:h?"not-allowed":"pointer",opacity:h?.6:1,transition:"all 0.2s ease",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(a,{size:16}),"redirect"]}),t.jsxs("button",{onClick:()=>We("form_post"),disabled:h,style:{padding:"0.75rem 1rem",background:"#f59e0b",color:"white",border:"none",borderRadius:"6px",fontSize:"0.875rem",fontWeight:"600",cursor:h?"not-allowed":"pointer",opacity:h?.6:1,transition:"all 0.2s ease",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(ue,{size:16}),"form_post"]}),t.jsxs("button",{onClick:()=>We("fragment"),disabled:h,style:{padding:"0.75rem 1rem",background:"#8b5cf6",color:"white",border:"none",borderRadius:"6px",fontSize:"0.875rem",fontWeight:"600",cursor:h?"not-allowed":"pointer",opacity:h?.6:1,transition:"all 0.2s ease",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem"},children:[t.jsx(fe,{size:16}),"fragment"]})]}),ie.deviceRegistration?t.jsx(Pe,{apiCall:ie.deviceRegistration,options:{showEducationalNotes:!0,showFlowContext:!0,urlHighlightRules:De.getDefaultHighlightRules("mfa")}}):t.jsxs("div",{style:{padding:"1rem",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"8px",textAlign:"center",color:"#6b7280"},children:[t.jsx(me,{size:24,style:{marginBottom:"0.5rem"}}),t.jsx("p",{children:"Click a response option above to see the PingOne MFA API call"})]})]}),t.jsxs("div",{style:{marginTop:"1.5rem",display:"flex",gap:"0.75rem",justifyContent:"space-between"},children:[t.jsxs(Nf,{onClick:()=>{m("username_login"),c?.("username_login")},style:{background:"#6b7280",color:"white"},children:[t.jsx(P,{}),"Back to Login"]}),t.jsxs(Nf,{onClick:()=>{m("device_pairing"),c?.("device_pairing")},children:[t.jsx(y,{}),"Continue to Device Registration"]})]})]});case"device_pairing":return t.jsxs(xn,{title:"Device Registration",subtitle:"Register your MFA device with PingOne",icon:t.jsx(me,{}),theme:"yellow",defaultCollapsed:!1,children:[oe.userId?t.jsxs(Vf,{$variant:"info",children:[t.jsx(b,{size:20,style:{flexShrink:0}}),t.jsxs(Wf,{children:[t.jsx(Hf,{children:"📱 MFA Device Registration"}),t.jsx(Yf,{children:"Select your preferred MFA method and provide the required information to register your device with PingOne."})]})]}):t.jsxs(Vf,{$variant:"warning",children:[t.jsx(d,{size:20,style:{flexShrink:0}}),t.jsxs(Wf,{children:[t.jsx(Hf,{children:"⚠️ Authentication Required"}),t.jsx(Yf,{children:"You need to complete authentication first to get your user ID before registering devices. Please go back to the authentication step and complete the flow."})]})]}),t.jsxs("div",{style:{margin:"1.5rem 0"},children:[t.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1rem",fontWeight:600,color:"#1f2937"},children:"Select MFA Device Type"}),t.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"1rem"},children:[{id:"sms",name:"SMS",icon:"📱",description:"Receive codes via text message"},{id:"email",name:"Email",icon:"📧",description:"Receive codes via email"},{id:"totp",name:"Authenticator App",icon:"🔐",description:"Google Authenticator, Authy, etc."},{id:"fido2",name:"Passkey/FIDO2",icon:"🔑",description:"Touch ID, Face ID, YubiKey, FIDO2 security key"},{id:"push",name:"Push Notification",icon:"🔔",description:"Mobile app push notifications"}].map(e=>t.jsxs("div",{onClick:()=>{N(e.id),B(e=>({...e,deviceName:""}))},style:{padding:"1rem",border:_===e.id?"2px solid #3b82f6":"1px solid #e5e7eb",borderRadius:"0.5rem",cursor:"pointer",backgroundColor:_===e.id?"#eff6ff":"#ffffff",transition:"all 0.2s ease"},children:[t.jsx("div",{style:{fontSize:"1.5rem",marginBottom:"0.5rem"},children:e.icon}),t.jsx("div",{style:{fontWeight:600,marginBottom:"0.25rem"},children:e.name}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280"},children:e.description})]},e.id))})]}),_&&t.jsxs("div",{style:{margin:"1.5rem 0",padding:"1.5rem",background:"#f9fafb",borderRadius:"0.75rem",border:"1px solid #e5e7eb"},children:[t.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1rem",fontWeight:600,color:"#1f2937"},children:"Device Information"}),t.jsxs("div",{style:{marginBottom:"1rem"},children:[t.jsxs("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:500,color:"#374151",fontSize:"0.875rem"},children:["Device Name ",t.jsx("span",{style:{color:"#ef4444"},children:"*"})]}),t.jsx("input",{type:"text",value:q.deviceName,onChange:e=>B(t=>({...t,deviceName:e.target.value})),placeholder:`My ${_.toUpperCase()} Device`,required:!0,style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.375rem",fontSize:"0.875rem",background:"#ffffff"}}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.25rem"},children:'Give your device a friendly name (e.g., "My iPhone", "Work Phone")'})]}),"sms"===_&&t.jsx(Fe,{value:q.phoneNumber,autoConcatenate:!1,onChange:e=>{B(t=>({...t,phoneNumber:e}))},onCountryCodeChange:e=>{V(e)},placeholder:"Enter phone number",required:!0,label:"Phone Number",helpText:"Enter your phone number with country code for SMS-based MFA"}),"email"===_&&t.jsxs("div",{children:[t.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:500,color:"#374151"},children:"Email Address *"}),t.jsx("input",{type:"email",value:q.email,onChange:e=>B(t=>({...t,email:e.target.value})),placeholder:"user@example.com",style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.375rem",fontSize:"0.875rem"}}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.25rem"},children:"Enter your email address for email-based MFA codes"})]}),"totp"===_&&t.jsxs("div",{children:[t.jsxs("div",{style:{marginBottom:"1rem",padding:"1rem",background:"#eff6ff",borderRadius:"0.5rem",border:"1px solid #93c5fd"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#1e40af"},children:"📱 Authenticator App Setup"}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#1e40af",lineHeight:1.5,marginBottom:"1rem"},children:[t.jsx("div",{children:"1. Install an authenticator app (Google Authenticator, Authy, Microsoft Authenticator)"}),t.jsx("div",{children:"2. Scan the QR code or enter the secret key"}),t.jsx("div",{children:"3. Enter the 6-digit code from your app to verify"})]}),t.jsxs("button",{onClick:rt,style:{padding:"0.75rem 1rem",backgroundColor:"#3b82f6",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(I,{size:16}),"Setup Authenticator App"]})]}),t.jsxs("div",{children:[t.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontWeight:500,color:"#374151"},children:"Verification Code *"}),t.jsx("input",{type:"text",value:q.verificationCode,onChange:e=>B(t=>({...t,verificationCode:e.target.value})),placeholder:"123456",maxLength:6,style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.375rem",fontSize:"0.875rem",textAlign:"center",letterSpacing:"0.1em"}}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#6b7280",marginTop:"0.25rem"},children:"Enter the 6-digit code from your authenticator app"})]})]}),"fido2"===_&&t.jsx("div",{children:t.jsxs("div",{style:{marginBottom:"1rem",padding:"1rem",background:"#f0fdf4",borderRadius:"0.5rem",border:"1px solid #86efac"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#166534"},children:"🔑 Passkey & FIDO2 Setup"}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#166534",lineHeight:1.5,marginBottom:"1rem"},children:[t.jsxs("div",{children:["1. ",t.jsx("strong",{children:"Passkeys:"})," Touch ID, Face ID, Windows Hello, Android biometrics"]}),t.jsxs("div",{children:["2. ",t.jsx("strong",{children:"Hardware Keys:"})," YubiKey, FIDO2 security keys"]}),t.jsx("div",{children:"3. Follow the browser prompts to complete setup"})]}),t.jsxs("button",{onClick:ot,style:{padding:"0.75rem 1rem",backgroundColor:"#10b981",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.5rem"},children:[t.jsx(v,{size:16}),"Setup Passkey/FIDO2"]})]})}),"push"===_&&t.jsx("div",{children:t.jsxs("div",{style:{marginBottom:"1rem",padding:"1rem",background:"#fef3c7",borderRadius:"0.5rem",border:"1px solid #f59e0b"},children:[t.jsx("h5",{style:{margin:"0 0 0.5rem 0",fontSize:"0.875rem",fontWeight:600,color:"#92400e"},children:"🔔 Push Notification Setup"}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#92400e",lineHeight:1.5},children:[t.jsx("div",{children:"1. Install the PingOne mobile app on your device"}),t.jsx("div",{children:"2. Sign in to the app with your credentials"}),t.jsx("div",{children:"3. Enable push notifications for MFA"})]})]})})]}),_&&t.jsx("div",{style:{marginTop:"1.5rem",display:"flex",gap:"0.75rem",justifyContent:"flex-end"},children:t.jsx(Gf,{onClick:Qe,disabled:h||!Ze(),style:{background:Ze()?"#10b981":"#9ca3af",color:"white",border:"none",borderRadius:"0.375rem",padding:"0.75rem 1.5rem",fontSize:"0.875rem",fontWeight:"600",cursor:Ze()&&!h?"pointer":"not-allowed",display:"flex",alignItems:"center",gap:"0.5rem"},children:h?t.jsxs(t.Fragment,{children:[t.jsx(M,{className:"animate-spin",size:16}),"Registering Device..."]}):t.jsxs(t.Fragment,{children:[t.jsx(s,{size:16}),"Register Device"]})})}),oe.userDevices.length>0&&t.jsxs("div",{style:{marginTop:"1.5rem",display:"flex",gap:"0.75rem",justifyContent:"space-between"},children:[t.jsxs(Nf,{onClick:()=>{m("mfa_enrollment"),c?.("mfa_enrollment")},style:{background:"#6b7280",color:"white"},children:[t.jsx(P,{}),"Back to MFA Enrollment"]}),t.jsxs(Nf,{onClick:()=>{m("mfa_challenge"),c?.("mfa_challenge")},children:[t.jsx(y,{}),"Continue to MFA Challenge"]})]})]});case"mfa_challenge":return t.jsxs(xn,{title:"MFA Challenge",subtitle:"Complete multi-factor authentication",icon:t.jsx(v,{}),theme:"blue",defaultCollapsed:!1,children:[t.jsxs(Vf,{$variant:"info",children:[t.jsx(b,{size:20,style:{flexShrink:0}}),t.jsxs(Wf,{children:[t.jsx(Hf,{children:"🔐 Multi-Factor Authentication Challenge"}),t.jsx(Yf,{children:"Select your registered MFA device and complete the authentication challenge."})]})]}),!Q.isChallengeSent&&t.jsxs("div",{style:{marginTop:"1.5rem"},children:[t.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1rem",fontWeight:"600",color:"#374151"},children:"Select MFA Device"}),t.jsx("div",{style:{display:"grid",gap:"0.75rem"},children:oe.userDevices.length>0?oe.userDevices.map(e=>t.jsxs("div",{onClick:()=>dt(e),style:{padding:"1rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",cursor:"pointer",transition:"all 0.2s ease",backgroundColor:"#ffffff",display:"flex",alignItems:"center",gap:"0.75rem"},onMouseEnter:e=>{e.currentTarget.style.borderColor="#3b82f6",e.currentTarget.style.backgroundColor="#f8fafc"},onMouseLeave:e=>{e.currentTarget.style.borderColor="#d1d5db",e.currentTarget.style.backgroundColor="#ffffff"},children:[t.jsxs("div",{style:{fontSize:"1.5rem"},children:["SMS"===e.type&&"📱","EMAIL"===e.type&&"📧","TOTP"===e.type&&"🔐","VOICE"===e.type&&"📞","FIDO2"===e.type&&"🔑","MOBILE"===e.type&&"📱"]}),t.jsxs("div",{style:{flex:1},children:[t.jsx("div",{style:{fontWeight:"500",color:"#374151"},children:e.deviceName||`${e.type} Device`}),t.jsxs("div",{style:{fontSize:"0.75rem",color:"#6b7280"},children:[e.type," • ",e.status]})]}),t.jsx("div",{style:{color:"#3b82f6",fontSize:"0.875rem",fontWeight:"500"},children:"Send Challenge"})]},e.id)):t.jsxs("div",{style:{padding:"1rem",textAlign:"center",color:"#6b7280",background:"#f9fafb",borderRadius:"0.5rem",border:"1px solid #e5e7eb"},children:[t.jsx(me,{size:24,style:{marginBottom:"0.5rem"}}),t.jsx("p",{children:"No MFA devices registered. Please register a device first."})]})})]}),Q.isChallengeSent&&"pending"===Q.challengeStatus&&t.jsxs("div",{style:{marginTop:"1.5rem"},children:[t.jsx("h4",{style:{margin:"0 0 1rem 0",fontSize:"1rem",fontWeight:"600",color:"#374151"},children:"Enter Challenge Code"}),t.jsxs("div",{style:{padding:"1rem",background:"#f0f9ff",borderRadius:"0.5rem",border:"1px solid #bae6fd",marginBottom:"1rem"},children:[t.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem"},children:[t.jsx(v,{size:16,color:"#0ea5e9"}),t.jsxs("span",{style:{fontSize:"0.875rem",fontWeight:"500",color:"#0c4a6e"},children:["Challenge sent to"," ",Q.selectedDevice?.deviceName||Q.selectedDevice?.type," ","device"]})]}),t.jsxs("p",{style:{fontSize:"0.75rem",color:"#0369a1",margin:0},children:["Please check your ",Q.challengeType," and enter the verification code below."]})]}),t.jsxs("div",{style:{display:"flex",gap:"0.75rem",alignItems:"flex-end"},children:[t.jsxs("div",{style:{flex:1},children:[t.jsx("label",{style:{display:"block",marginBottom:"0.5rem",fontSize:"0.875rem",fontWeight:"500",color:"#374151"},children:"Verification Code"}),t.jsx("input",{type:"text",value:Q.challengeCode||"",onChange:e=>ee(t=>({...t,challengeCode:e.target.value})),placeholder:"Enter 6-digit code",style:{width:"100%",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.375rem",fontSize:"1rem",textAlign:"center",letterSpacing:"0.1em",fontFamily:"monospace"}})]}),t.jsx("button",{onClick:()=>Q.challengeCode&&ct(Q.challengeCode),disabled:!Q.challengeCode||h,style:{padding:"0.75rem 1.5rem",backgroundColor:Q.challengeCode&&!h?"#10b981":"#9ca3af",color:"white",border:"none",borderRadius:"0.375rem",fontSize:"0.875rem",fontWeight:"500",cursor:Q.challengeCode&&!h?"pointer":"not-allowed",transition:"background-color 0.2s ease"},children:h?"Verifying...":"Verify Code"})]})]}),"completed"===Q.challengeStatus&&t.jsxs("div",{style:{marginTop:"1.5rem",padding:"1rem",background:"#f0fdf4",borderRadius:"0.5rem",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",gap:"0.75rem"},children:[t.jsx(s,{size:20,color:"#16a34a"}),t.jsxs("div",{children:[t.jsx("div",{style:{fontSize:"0.875rem",fontWeight:"500",color:"#166534"},children:"MFA Challenge Completed Successfully!"}),t.jsx("div",{style:{fontSize:"0.75rem",color:"#15803d"},children:"You can now proceed to token retrieval."})]})]}),ie.mfaChallengeInitiate&&t.jsx("div",{style:{marginTop:"1.5rem"},children:t.jsx(Pe,{apiCall:ie.mfaChallengeInitiate,options:{showEducationalNotes:!0,showFlowContext:!0,urlHighlightRules:De.getDefaultHighlightRules("mfa")}})}),ie.mfaChallengeVerify&&t.jsx("div",{style:{marginTop:"1.5rem"},children:t.jsx(Pe,{apiCall:ie.mfaChallengeVerify,options:{showEducationalNotes:!0,showFlowContext:!0,urlHighlightRules:De.getDefaultHighlightRules("mfa")}})}),t.jsxs("div",{style:{marginTop:"1.5rem",display:"flex",gap:"0.75rem",justifyContent:"space-between"},children:[t.jsxs(Nf,{onClick:()=>{m("device_pairing"),c?.("device_pairing")},style:{background:"#6b7280",color:"white"},children:[t.jsx(P,{}),"Back to Device Registration"]}),"completed"===Q.challengeStatus&&t.jsxs(Nf,{onClick:()=>{m("token_retrieval"),c?.("token_retrieval")},children:[t.jsx(y,{}),"Continue to Token Retrieval"]})]})]});case"token_retrieval":return t.jsxs(xn,{title:"Token Retrieval",subtitle:"Retrieve access tokens and complete session",icon:t.jsx(pe,{}),theme:"highlight",defaultCollapsed:!1,children:[oe.tokens?t.jsxs(Vf,{$variant:"success",children:[t.jsx(s,{size:20,style:{flexShrink:0}}),t.jsxs(Wf,{children:[t.jsx(Hf,{children:"🎫 Tokens Retrieved Successfully"}),t.jsx(Yf,{children:"Your access tokens have been retrieved and your secure session is now active with MFA protection."})]})]}):t.jsxs(Vf,{$variant:"info",children:[t.jsx(pe,{size:20,style:{flexShrink:0}}),t.jsxs(Wf,{children:[t.jsx(Hf,{children:"🔄 Ready for Token Exchange"}),t.jsx(Yf,{children:"Authorization code received. Click the button below to exchange it for access tokens."})]})]}),t.jsxs("div",{style:{marginTop:"1.5rem",display:"flex",gap:"0.75rem",justifyContent:"space-between"},children:[t.jsxs(Nf,{onClick:()=>{m("mfa_challenge"),c?.("mfa_challenge")},style:{background:"#6b7280",color:"white"},children:[t.jsx(P,{}),"Back to MFA Challenge"]}),oe.tokens?t.jsxs(Nf,{onClick:()=>{m("success"),c?.("success")},style:{backgroundColor:"#10b981"},children:[t.jsx(y,{}),"Complete Flow"]}):t.jsxs(Nf,{onClick:lt,disabled:h||!oe.authCode,style:{backgroundColor:"#10b981"},children:[t.jsx(M,{className:h?"animate-spin":""}),h?"Exchanging Tokens...":"Exchange Authorization Code for Tokens"]})]})]});case"success":return t.jsxs(xn,{title:"Authentication Complete",subtitle:"MFA authentication successful",icon:t.jsx(s,{}),theme:"green",defaultCollapsed:!1,children:[t.jsxs(Vf,{$variant:"success",children:[t.jsx(s,{size:20,style:{flexShrink:0}}),t.jsxs(Wf,{children:[t.jsx(Hf,{children:"🎉 MFA Authentication Complete!"}),t.jsx(Yf,{children:"You have successfully completed multi-factor authentication. Your session is now secured with MFA verification. You can now access protected resources and applications."})]})]}),t.jsx("div",{style:{marginTop:"2rem",textAlign:"center"},children:t.jsx("p",{style:{color:"#6b7280",marginBottom:"1rem"},children:"Your secure session is now active with MFA protection."})})]});case"error":return t.jsxs("div",{style:{maxWidth:"500px",width:"100%"},children:[t.jsxs(Vf,{$variant:"error",children:[t.jsx($,{size:20,style:{flexShrink:0}}),t.jsxs(Wf,{children:[t.jsx(Hf,{children:"❌ Authentication Error"}),t.jsx(Yf,{children:x||"An unexpected error occurred during authentication."})]})]}),t.jsxs("div",{style:{marginTop:"1.5rem",display:"flex",gap:"0.75rem",flexWrap:"wrap"},children:[C<i&&t.jsxs(Gf,{$variant:"primary",onClick:Ke,children:[t.jsx(M,{size:16}),"Try Again (",i-C," attempts left)"]}),t.jsx(Gf,{onClick:Xe,children:"Start Over"})]})]});default:return null}})()})]}),t.jsx(Fa,{currentStep:u-1,totalSteps:Mf.length,onPrevious:()=>{const e=Math.max(u-2,0),t=Mf[e]?.id;t&&(m(t),c?.(t))},onNext:()=>{switch(p){case"username_login":m("mfa_enrollment"),c?.("mfa_enrollment");break;case"mfa_enrollment":m("device_pairing"),c?.("device_pairing");break;case"device_pairing":m("mfa_challenge"),c?.("mfa_challenge");break;case"mfa_challenge":m("token_retrieval"),c?.("token_retrieval");break;case"token_retrieval":m("success"),c?.("success");break;default:{const e=Math.min(u,Mf.length-1),t=Mf[e]?.id;t&&(m(t),c?.(t));break}}},onReset:re,canNavigateNext:!0,isFirstStep:1===u,nextButtonText:"Next",disabledMessage:""})]}),Le.showModal(we,()=>ze(!1),Je,Te,"oauth","PingOne MFA Authentication",{description:"You're about to be redirected to PingOne for authentication. This will open in a new window for secure authentication before proceeding to MFA setup.",redirectMode:"popup"}),t.jsx(Ae,{isOpen:Se,onClose:Ge,title:"🎉 Authentication Successful!",message:"You have been successfully authenticated with PingOne. You can now proceed to set up your multi-factor authentication devices.",autoCloseDelay:5e3}),Y&&t.jsx(Re,{isOpen:W,onClose:et,deviceData:Y,onContinue:tt}),G&&t.jsx(Oe,{isOpen:G,onClose:it,onContinue:nt,userId:oe.userId||"unknown",deviceName:q.deviceName||"TOTP Device",issuer:"OAuth Playground"}),X&&t.jsx(Ue,{isOpen:X,onClose:at,onSuccess:st,userId:oe.userId||"unknown",deviceName:q.deviceName||"FIDO2 Device",rpId:window.location.hostname,rpName:"OAuth Playground"})]})},Xf=ve.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  min-height: 100vh;
`,Zf=ve.div`
  text-align: center;
  margin-bottom: 3rem;
`,Qf=ve.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`,eh=ve.p`
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 2rem;
`,th=ve.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`,rh=ve.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
`,ih=ve.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  position: relative;
  z-index: 2;
  
  ${e=>{switch(e.$status){case"completed":return"\n          background: #10b981;\n          color: white;\n          border-color: #10b981;\n        ";case"active":return"\n          background: #3b82f6;\n          color: white;\n          border-color: #3b82f6;\n          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);\n        ";case"error":return"\n          background: #ef4444;\n          color: white;\n          border-color: #ef4444;\n        ";default:return"\n          background: white;\n          color: #9ca3af;\n          border-color: #e5e7eb;\n        "}}}
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`,nh=ve.div`
  width: 3rem;
  height: 2px;
  background: ${e=>e.$completed?"#10b981":e.$active?"linear-gradient(to right, #10b981 50%, #e5e7eb 50%)":"#e5e7eb"};
  position: relative;
  z-index: 1;
  transition: background 0.3s ease;
`,oh=ve.div`
  position: absolute;
  top: -2.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  
  ${ih}:hover & {
    opacity: 1;
  }
`,ah=ve.div`
  margin-left: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;ve.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;const sh=ve.div`
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`,dh=ve.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`,ch=ve.div`
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #3b82f6;
`,lh=ve.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`,ph=ve.div`
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  border-left: 4px solid #3b82f6;
`,mh=ve.p`
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
`,uh=ve.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
`,fh=ve.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${e=>{switch(e.$size){case"sm":return"0.5rem 1rem";case"lg":return"1rem 2rem";default:return"0.75rem 1.5rem"}}};
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  ${e=>{switch(e.$variant){case"primary":return"\n          background: #3b82f6;\n          color: white;\n          &:hover:not(:disabled) {\n            background: #2563eb;\n            transform: translateY(-1px);\n            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\n          }\n        ";case"secondary":return"\n          background: white;\n          color: #1f2937;\n          border: 1px solid #e5e7eb;\n          &:hover:not(:disabled) {\n            background: #f9fafb;\n            border-color: #6b7280;\n          }\n        ";case"success":return"\n          background: #10b981;\n          color: white;\n          &:hover:not(:disabled) {\n            background: #059669;\n            transform: translateY(-1px);\n          }\n        ";case"danger":return"\n          background: #ef4444;\n          color: white;\n          &:hover:not(:disabled) {\n            background: #dc2626;\n            transform: translateY(-1px);\n          }\n        ";case"outline":return"\n          background: transparent;\n          color: #3b82f6;\n          border: 1px solid #3b82f6;\n          &:hover:not(:disabled) {\n            background: #3b82f6;\n            color: white;\n          }\n        ";default:return"\n          background: #6b7280;\n          color: white;\n          &:hover:not(:disabled) {\n            background: #4b5563;\n          }\n        "}}}
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${e=>e.$loading&&"\n    color: transparent;\n    cursor: wait;\n    \n    &::after {\n      content: '';\n      position: absolute;\n      width: 1rem;\n      height: 1rem;\n      border: 2px solid transparent;\n      border-top: 2px solid currentColor;\n      border-radius: 50%;\n      animation: spin 1s linear infinite;\n    }\n  "}
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`,hh=ve.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
`,gh=ve.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #e5e7eb;
  }
`,xh=ve.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`,bh=ve.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &.expanded {
    transform: rotate(180deg);
  }
`,vh=ve.div`
  max-height: ${e=>e.$expanded?"1000px":"0"};
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  padding: ${e=>e.$expanded?"1.5rem":"0 1.5rem"};
`,wh=ve.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${e=>{switch(e.type){case"success":return"\n          background: #ecfdf5;\n          color: #10b981;\n        ";case"error":return"\n          background: #fef2f2;\n          color: #ef4444;\n        ";case"warning":return"\n          background: #fffbeb;\n          color: #f59e0b;\n        ";case"info":return"\n          background: #eff6ff;\n          color: #3b82f6;\n        "}}}
`,yh=ve.div`
  background: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
  position: relative;
`,kh=ve.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #e5e7eb;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`,jh=ve.div`
  background: #f0fdf4;
  color: #15803d;
  border: 2px solid #16a34a;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(22, 163, 74, 0.1);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
`;ve.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;const Ch=ve.div`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`,zh=ve.div`
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  margin: 1rem 0;
`,Sh=ve.div`
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
  border-radius: 0.25rem;
  width: ${e=>e.$progress}%;
`,$h=ve.div`
  @media (max-width: 768px) {
    padding: 1rem;
    
    ${rh} {
      flex-direction: column;
      gap: 0.75rem;
    }
    
    ${nh} {
      width: 2px;
      height: 2rem;
    }
    
    ${sh} {
      padding: 1.5rem;
    }
    
    ${uh} {
      flex-direction: column;
      align-items: stretch;
    }
    
    ${fh} {
      width: 100%;
      justify-content: center;
    }
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    
    ${sh} {
      padding: 1rem;
    }
    
    ${dh} {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    ${lh} {
      font-size: 1.25rem;
    }
  }
`,Ih=({steps:i,title:n,onStepComplete:a,onStepError:d,onFlowComplete:l,persistKey:p,autoAdvance:f=!1,showDebugInfo:h=!0,allowStepJumping:g=!0,initialStepIndex:x,onStepChange:b})=>{const[w,y]=e.useState(x||0),[k,j]=e.useState([]),[C,z]=e.useState(!1),[S,T]=e.useState(!1);e.useEffect(()=>{b&&b(w)},[w,b]);const[A,U]=e.useState(!1),[P,D]=e.useState(null);e.useEffect(()=>{if(p)try{const e=localStorage.getItem(`enhanced-flow-${p}`);if(e){const t=JSON.parse(e),r=void 0!==x?x:t.currentStepIndex||0;y(r),j(t.stepHistory||[])}else void 0!==x&&y(x)}catch(e){we.warn("Failed to load persisted flow state",`error: ${e}`),void 0!==x&&y(x)}else void 0!==x&&y(x)},[p,x]),e.useEffect(()=>{const e=e=>{const{stepIndex:t,stepName:r}=e.detail;y(t)};return window.addEventListener("advance-to-step",e),()=>{window.removeEventListener("advance-to-step",e)}},[]);const E=e.useCallback(()=>{if(p)try{const e={currentStepIndex:w,stepHistory:k,timestamp:Date.now()};localStorage.setItem(`enhanced-flow-${p}`,JSON.stringify(e))}catch(e){we.warn("Failed to save flow state",`error: ${e}`)}},[p,w,k]);e.useEffect(()=>{E()},[E]);const _=e.useCallback(e=>{const t=k.find(t=>t.stepId===i[e]?.id);return t?.error?"error":t?.result&&!t?.error?e<w?"completed":"success":e<w?"completed":e===w?"active":"pending"},[w,k,i]),N=e.useCallback(async e=>{const t=i[e];if(!t||!t.execute)return;z(!0);const r=Date.now();try{we.info(`Executing step: ${t.title}`,`stepId: ${t.id}`);const n=await t.execute(),o=Date.now()-r,s={stepId:t.id,timestamp:Date.now(),result:n,duration:o};j(e=>[...e.filter(e=>e.stepId!==t.id),s]),a?.(t.id,n),f&&e<i.length-1&&setTimeout(()=>{y(e+1)},1e3),we.info(`Step completed: ${t.title}`,`duration: ${o}ms, result: ${JSON.stringify(n)}`)}catch(n){const e=Date.now()-r,i=n instanceof Error?n.message:"Unknown error",o={stepId:t.id,timestamp:Date.now(),error:i,duration:e};j(e=>[...e.filter(e=>e.stepId!==t.id),o]),d?.(t.id,i),we.error(`Step failed: ${t.title}`,`error: ${i}, duration: ${e}ms`)}finally{z(!1)}},[i,f,a,d]),M=e.useCallback(e=>{(g||e<=w)&&y(e)},[g,w]),B=e.useCallback(()=>{if(w<i.length-1)y(w+1),setTimeout(()=>{if(window.location.pathname.includes("authorization-code")){const e=document.querySelector('[data-testid="progress-bar"]')||document.querySelector(".progress-bar")||document.querySelector('[role="progressbar"]');if(e)e.scrollIntoView({behavior:"smooth",block:"start"});else{const e=document.querySelector('[data-testid="enhanced-step-flow"]')||document.querySelector(".enhanced-step-flow")||document.querySelector("main");e&&e.scrollIntoView({behavior:"smooth",block:"start"})}}else{window.scrollTo({top:0,behavior:"smooth"});const e=document.querySelector("main");e&&e.scrollTo({top:0,behavior:"smooth"})}},100);else{const e=k.reduce((e,t)=>(t.result&&(e[t.stepId]=t.result),e),{});l?.(e)}},[w,i.length,k,l]),L=e.useCallback(()=>{w>0&&y(w-1)},[w]),V=e.useCallback(async e=>{try{await navigator.clipboard.writeText(e),D(e),setTimeout(()=>D(null),2e3)}catch(t){we.error("Failed to copy to clipboard",`error: ${t}`)}},[]),W=Math.min(w,i.length-1),H=i[W],Y=k.filter(e=>!e.error).length,J=Y/i.length*100,G=k.find(e=>e.stepId===H?.id),K=G&&!G.error||H?.completed;return H?t.jsx($h,{children:t.jsxs(Xf,{"data-testid":"enhanced-step-flow",children:[t.jsxs(Zf,{children:[t.jsx(Qf,{children:n}),t.jsx(eh,{children:"Interactive step-by-step OAuth flow with enhanced debugging"})]}),t.jsxs(th,{"data-testid":"step-progress",children:[t.jsx(rh,{children:i.map((e,r)=>{const n=_(r),o=r===i.length-1;return t.jsxs(u.Fragment,{children:[t.jsxs(ih,{$status:n,onClick:()=>M(r),title:`Step ${r+1}: ${e.title}`,children:["completed"===n||"success"===n?t.jsx(s,{}):"error"===n?t.jsx(c,{}):r+1,t.jsx(oh,{children:e.title})]}),!o&&t.jsx(nh,{$completed:"completed"===n,$active:"active"===n})]},e.id)})}),t.jsxs(ah,{children:[Y," of ",i.length," completed"]})]}),t.jsx(zh,{"data-testid":"progress-bar",children:t.jsx(Sh,{$progress:J})}),t.jsxs(sh,{children:[t.jsxs(dh,{children:[t.jsx(ch,{children:H.icon||t.jsx(F,{})}),t.jsx(lh,{children:H.title})]}),t.jsx(ph,{children:t.jsx(mh,{children:H.description})}),H.content&&t.jsx("div",{style:{marginBottom:"1.5rem"},children:H.content}),H.code&&t.jsxs(yh,{children:[t.jsx(kh,{onClick:()=>V(H.code),children:P===H.code?t.jsx(ge,{}):t.jsx(o,{})}),t.jsx("pre",{children:H.code})]}),H.result&&t.jsxs("div",{style:{marginBottom:"1.5rem"},children:[t.jsx("h4",{children:"Result:"}),t.jsx(jh,{children:JSON.stringify(H.result,null,2)})]}),H.error&&t.jsx("div",{style:{marginBottom:"1.5rem"},children:t.jsxs(wh,{type:"error",children:[t.jsx($,{}),"Error: ",H.error]})}),t.jsxs(uh,{children:[t.jsx(fh,{$variant:"secondary",onClick:L,disabled:0===W||C,$loading:C,style:{opacity:0===W||C?.5:1,cursor:0===W||C?"not-allowed":"pointer"},title:0===W?"No previous step":C?"Please wait...":"",children:C?t.jsxs(t.Fragment,{children:[t.jsx(Ch,{}),"Please wait..."]}):t.jsxs(t.Fragment,{children:[t.jsx(xe,{}),"Back"]})}),H.execute&&!H.hideDefaultButton&&t.jsx(fh,{$variant:"primary",onClick:()=>{N(w)},disabled:C||!H.canExecute,$loading:C,style:{opacity:!H.canExecute||C?.5:1,cursor:!H.canExecute||C?"not-allowed":"pointer"},title:H.canExecute?C?"Please wait...":"":"Complete the previous step first",children:C?t.jsxs(t.Fragment,{children:[t.jsx(Ch,{}),H.buttonText?.includes("...")?H.buttonText:"setup-credentials"===H.id?"Saving...":"generate-pkce"===H.id?"Generating...":"build-auth-url"===H.id?"Building URL...":"exchange-tokens"===H.id?"Exchanging Tokens...":"validate-tokens"===H.id?"Validating...":"Executing..."]}):t.jsxs(t.Fragment,{children:["setup-credentials"===H.id?t.jsx(be,{}):"generate-pkce"===H.id?t.jsx(v,{}):"build-auth-url"===H.id?t.jsx(ce,{}):"exchange-tokens"===H.id?t.jsx(I,{}):"validate-tokens"===H.id?t.jsx(r,{}):t.jsx(m,{}),H.buttonText||("setup-credentials"===H.id?"Save":"generate-pkce"===H.id?"Generate":"build-auth-url"===H.id?"Build URL":"exchange-tokens"===H.id?"Exchange Tokens":"validate-tokens"===H.id?"Get User Info":"Sign On")]})}),H.customButtons?.map(e=>t.jsx(fh,{$variant:e.variant||"secondary",onClick:e.onClick,disabled:e.disabled||C,$loading:e.loading,style:{opacity:e.disabled||C?.5:1,cursor:e.disabled||C?"not-allowed":"pointer"},children:e.loading?t.jsxs(t.Fragment,{children:[t.jsx(Ch,{}),"Loading..."]}):t.jsxs(t.Fragment,{children:[e.icon,e.label]})},e.id)),t.jsx(fh,{$variant:"success",onClick:B,disabled:W===i.length-1||!K||C,$loading:C,style:{opacity:!K&&W<i.length-1||C?.5:1,cursor:!K&&W<i.length-1||C?"not-allowed":"pointer"},title:!K&&W<i.length-1?"Complete the current step first":C?"Please wait...":"",children:C?t.jsxs(t.Fragment,{children:[t.jsx(Ch,{}),"Please wait..."]}):t.jsxs(t.Fragment,{children:["Next",t.jsx(O,{})]})})]})]}),h&&t.jsx(t.Fragment,{children:t.jsxs(hh,{children:[t.jsxs(gh,{onClick:()=>U(!A),children:[t.jsxs(xh,{children:[t.jsx(q,{}),"Debug Information"]}),t.jsx(bh,{className:A?"expanded":"",children:t.jsx(R,{})})]}),t.jsx(vh,{$expanded:A,children:t.jsxs("div",{children:[t.jsx("h4",{children:"Step History:"}),k.map((e,r)=>t.jsx("div",{style:{marginBottom:"0.5rem"},children:t.jsxs(wh,{type:e.error?"error":"success",children:[e.error?t.jsx(c,{}):t.jsx(s,{}),"Step ",i.findIndex(t=>t.id===e.stepId)+1,": ",e.duration,"ms"]})},r)),t.jsx("h4",{children:"Current State:"}),t.jsx(jh,{children:JSON.stringify({currentStep:w+1,totalSteps:i.length,completedSteps:Y,progress:Math.round(J)},null,2)})]})})]})}),t.jsxs(th,{"data-testid":"step-progress-bottom",style:{marginTop:"2rem",paddingTop:"2rem",borderTop:"1px solid #e5e7eb"},children:[t.jsx(rh,{children:i.map((e,r)=>{const n=_(r),o=r===i.length-1;return t.jsxs(u.Fragment,{children:[t.jsxs(ih,{$status:n,onClick:()=>M(r),title:`Step ${r+1}: ${e.title}`,children:["completed"===n||"success"===n?t.jsx(s,{}):"error"===n?t.jsx(c,{}):r+1,t.jsx(oh,{children:e.title})]}),!o&&t.jsx(nh,{$completed:"completed"===n,$active:"active"===n})]},`bottom-${e.id}`)})}),t.jsxs(ah,{children:[Y," of ",i.length," completed"]})]})]})}):t.jsx(Xf,{children:t.jsxs(Zf,{children:[t.jsx(Qf,{children:"Flow Complete!"}),t.jsx(eh,{children:"All steps have been completed successfully."})]})})};export{gn as C,Bm as D,ca as E,da as F,la as I,nn as M,ef as N,Fa as S,Gu as T,Ye as U,ku as a,Ho as b,Co as c,mo as d,kf as e,Nu as f,Kf as g,Ih as h,jf as i,Pn as j,Xn as k,_n as l,$o as t,Je as u};
//# sourceMappingURL=components-flow-core-y1x-SJYd.js.map
