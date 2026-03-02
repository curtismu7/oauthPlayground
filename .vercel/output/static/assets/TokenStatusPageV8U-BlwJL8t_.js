const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/v8-utils-BU6AoW1l.js","assets/utils-lzKqcxFi.js","assets/react-vendor-HWZo9XlX.js","assets/vendor-CvVeuJe7.js","assets/vendor-54DrP_uy.css","assets/components-credentials-T7jmF3zx.js","assets/styled-vendor-DGSsHzxd.js","assets/components-oauth-qq-maH2w.js","assets/v8u-services-CviCpCEt.js","assets/v8-services-DHsPM8a2.js","assets/v8-components-8swtZwHb.js","assets/v8u-components-COnDGHJS.js","assets/components-flow-core-y1x-SJYd.js","assets/components-token-uXxDPBqK.js","assets/oauth-flows-device-CMULWbHZ.js","assets/pages-ai-D2KhTcan.js","assets/pages-DE-6TDOE.js","assets/components-oauth-authorize-sao_-EgS.js","assets/components-oauth-discovery-DYbdhNwI.js","assets/pages-pingone-BLdy8FiO.js","assets/oauth-flows-authcode-ltS0AxHA.js","assets/components-oauth-par-B-NhQsyD.js","assets/oauth-flows-BoQiEZ27.js","assets/oauth-flows-par-DTJ0aZ64.js","assets/oauth-flows-implicit-BlAJpg9o.js","assets/pages-docs-nYnYMLbe.js","assets/components-flow-BH3Bx-YA.js","assets/components-steps-BQ6HbS5x.js","assets/components-ui-DbX9aVva.js","assets/components-oauth-client-BhjYl9xl.js","assets/components-flow-core-DEegsKK7.css","assets/v8-hooks-B7CjPGrP.js","assets/v8-flows-CbgB_G0p.js","assets/v8-flows-Bwbl_h2s.css"])))=>i.map(i=>d[i]);
import{_ as e}from"./utils-lzKqcxFi.js";import{a as o,j as t,Q as n,h as r}from"./react-vendor-HWZo9XlX.js";import{a as s}from"./styled-vendor-DGSsHzxd.js";import{a as i,W as a}from"./v8-components-8swtZwHb.js";import{e as l,d as c}from"./v8-services-DHsPM8a2.js";import{u as d}from"./v8u-components-COnDGHJS.js";import{l as p}from"./v8u-services-CviCpCEt.js";import"./components-credentials-T7jmF3zx.js";import"./components-oauth-qq-maH2w.js";import"./vendor-CvVeuJe7.js";import"./components-flow-core-y1x-SJYd.js";import"./components-token-uXxDPBqK.js";import"./oauth-flows-device-CMULWbHZ.js";import"./pages-ai-D2KhTcan.js";import"./pages-DE-6TDOE.js";import"./components-oauth-authorize-sao_-EgS.js";import"./components-oauth-discovery-DYbdhNwI.js";import"./v8-utils-BU6AoW1l.js";import"./pages-pingone-BLdy8FiO.js";import"./oauth-flows-authcode-ltS0AxHA.js";import"./components-oauth-par-B-NhQsyD.js";import"./oauth-flows-BoQiEZ27.js";import"./oauth-flows-par-DTJ0aZ64.js";import"./oauth-flows-implicit-BlAJpg9o.js";import"./pages-docs-nYnYMLbe.js";import"./components-flow-BH3Bx-YA.js";import"./components-steps-BQ6HbS5x.js";import"./components-ui-DbX9aVva.js";import"./components-oauth-client-BhjYl9xl.js";import"./v8-hooks-B7CjPGrP.js";import"./v8-flows-CbgB_G0p.js";const h=s.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`,u=s.div`
	margin-bottom: 32px;
`,m=s.h1`
	font-size: 32px;
	font-weight: 700;
	color: #1f2937;
	margin: 0 0 8px 0;
`,f=s.p`
	font-size: 16px;
	color: #6b7280;
	margin: 0;
	line-height: 1.6;
`,k=s.div`
	background: white;
	border-radius: 12px;
	padding: 24px;
	margin-bottom: 24px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
`,x=s.div`
	margin-bottom: 16px;
`,g=s.h2`
	font-size: 20px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 8px;
`,w=s.p`
	font-size: 14px;
	color: #6b7280;
	margin: 8px 0 0 0;
	line-height: 1.5;
`,j=s.button`
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 6px;
	padding: 8px 16px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	transition: all 0.2s;

	&:hover {
		background: #2563eb;
		transform: scale(1.02);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
`,v=()=>{const[,s]=o.useState({isValid:!1,status:"missing",message:"Checking...",expiresAt:null,minutesRemaining:0}),[v,T]=o.useState(()=>{const e=l.loadConfiguration();return e.workerToken?.silentApiRetrieval||!1}),[y,b]=o.useState(()=>{const e=l.loadConfiguration();return e.workerToken?.showTokenAtEnd||!1}),[S,C]=o.useState(!1);o.useEffect(()=>{const e=async()=>{try{const e=await c.checkWorkerTokenStatus();s(e)}catch(e){p.error("[TOKEN-STATUS-V8U] Failed to check token status:",e),s({isValid:!1,status:"error",message:"Failed to check status",expiresAt:null,minutesRemaining:0})}};e();const o=setInterval(e,5e3),t=()=>{const e=l.loadConfiguration();T(e.workerToken?.silentApiRetrieval||!1),b(e.workerToken?.showTokenAtEnd||!1)},n=()=>{e()};return window.addEventListener("mfaConfigurationUpdated",t),window.addEventListener("workerTokenUpdated",n),()=>{clearInterval(o),window.removeEventListener("mfaConfigurationUpdated",t),window.removeEventListener("workerTokenUpdated",n)}},[]);return t.jsxs(h,{children:[t.jsxs(u,{children:[t.jsx(m,{children:"Token Status Monitoring"}),t.jsx(f,{children:"Comprehensive token status monitoring for OAuth flows and API authentication. Track worker tokens, user tokens, and manage OAuth configuration settings in real-time."})]}),t.jsxs(k,{children:[t.jsx(x,{children:t.jsxs(g,{children:[t.jsx(n,{}),"Worker Token Status"]})}),t.jsx(w,{children:"Monitor the worker token used for API authentication and management operations. Check token validity, expiration, and refresh status."}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[t.jsx("div",{style:{display:"flex",gap:"8px"},children:t.jsxs(j,{onClick:async()=>{try{const{handleShowWorkerTokenModal:o}=await e(async()=>{const{handleShowWorkerTokenModal:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.w);return{handleShowWorkerTokenModal:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]));await o(C,s,v,y,!1)}catch(o){p.error("[TOKEN-STATUS-V8U] Error showing worker token modal:",o)}},children:[t.jsx(n,{}),"Get Worker Token"]})}),t.jsxs("div",{style:{marginTop:"16px",display:"flex",flexDirection:"column",gap:"12px"},children:[t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"12px",cursor:"pointer",userSelect:"none",padding:"8px",borderRadius:"6px",transition:"background-color 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.backgroundColor="#f3f4f6"},onMouseLeave:e=>{e.currentTarget.style.backgroundColor="transparent"},children:[t.jsx("input",{type:"checkbox",checked:v,onChange:async o=>{const t=o.target.checked;T(t);const n=l.loadConfiguration();if(n.workerToken.silentApiRetrieval=t,l.saveConfiguration(n),window.dispatchEvent(new CustomEvent("mfaConfigurationUpdated",{detail:{workerToken:n.workerToken}})),t)try{if(!(await c.checkWorkerTokenStatus()).isValid){p.debug("[TOKEN-STATUS-V8U] Silent API retrieval enabled, attempting to fetch token now...");const{handleShowWorkerTokenModal:o}=await e(async()=>{const{handleShowWorkerTokenModal:e}=await import("./v8-utils-BU6AoW1l.js").then(e=>e.w);return{handleShowWorkerTokenModal:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]));await o(C,s,t,y,!1)}}catch(r){p.error("[TOKEN-STATUS-V8U] Error in silent retrieval:",r)}},style:{width:"20px",height:"20px",cursor:"pointer",accentColor:"#6366f1",flexShrink:0}}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"2px"},children:[t.jsx("span",{style:{fontSize:"14px",color:"#374151",fontWeight:"500"},children:"Silent API Token Retrieval"}),t.jsx("span",{style:{fontSize:"12px",color:"#6b7280"},children:"Automatically fetch worker token in the background without showing modals"})]})]}),t.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"12px",cursor:"pointer",userSelect:"none",padding:"8px",borderRadius:"6px",transition:"background-color 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.backgroundColor="#f3f4f6"},onMouseLeave:e=>{e.currentTarget.style.backgroundColor="transparent"},children:[t.jsx("input",{type:"checkbox",checked:y,onChange:e=>{const o=e.target.checked;b(o);const t=l.loadConfiguration();t.workerToken.showTokenAtEnd=o,l.saveConfiguration(t),window.dispatchEvent(new CustomEvent("mfaConfigurationUpdated",{detail:{workerToken:t.workerToken}}))},style:{width:"20px",height:"20px",cursor:"pointer",accentColor:"#6366f1",flexShrink:0}}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"2px"},children:[t.jsx("span",{style:{fontSize:"14px",color:"#374151",fontWeight:"500"},children:"Show Token After Generation"}),t.jsx("span",{style:{fontSize:"12px",color:"#6b7280"},children:"Display the generated worker token in a modal after successful retrieval"})]})]})]}),t.jsx(i,{mode:"compact",showRefresh:!0})]})]}),t.jsxs(k,{children:[t.jsx(x,{children:t.jsxs(g,{children:[t.jsx(r,{}),"User Token Status"]})}),t.jsx(w,{children:"Monitor user authentication tokens (Access, ID, and Refresh tokens) from OAuth flows and unified authentication."}),t.jsx(d,{showRefresh:!0,refreshInterval:10})]}),S&&t.jsx(a,{isOpen:S,onClose:()=>C(!1)})]})};export{v as default};
//# sourceMappingURL=TokenStatusPageV8U-BlwJL8t_.js.map
