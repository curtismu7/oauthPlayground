import{a as e,R as r,j as t,t as i,e as o,F as n,p as a,bc as s,h as d,n as c,m as l,W as u,al as m,l as h}from"./react-vendor-HWZo9XlX.js";import{a as p}from"./styled-vendor-DGSsHzxd.js";import{Y as f}from"./components-oauth-qq-maH2w.js";const g=p.div`
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
`,b=p.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid #e5e7eb;
`,x=p.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s;

    &:hover {
      background-color: #f3f4f6;
      color: #374151;
    }
  }
`,j=p.div`
  padding: 1.5rem 2rem;
`,y=p.div`
  margin-bottom: 2rem;

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`,v=p.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  margin-bottom: 1rem;
`,z=p.div`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`,k=p.div`
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875rem;
  color: #1f2937;
  background-color: #f9fafb;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  word-break: break-all;
`,w=p.div`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`,A=p.div`
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875rem;
  color: #1e293b;
  word-break: break-all;
  line-height: 1.5;
  margin-bottom: 1rem;
`,$=p.button`
  background: ${({$copied:e})=>e?"#10b981":"#3b82f6"};
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: fit-content;

  &:hover {
    background: ${({$copied:e})=>e?"#059669":"#2563eb"};
  }
`,C=p.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
`,_=p.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${({$variant:e})=>"primary"===e?"\n        background-color: #3b82f6;\n        color: white;\n        &:hover {\n          background-color: #2563eb;\n        }\n      ":"\n        background-color: #f3f4f6;\n        color: #374151;\n        &:hover {\n          background-color: #e5e7eb;\n        }\n      "}
`,S=p.div`
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;

  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e40af;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: #1e40af;
    line-height: 1.5;
  }
`,D=p.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: #3b82f6;
    cursor: pointer;
  }

  label {
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    user-select: none;
  }
`,R=({isOpen:s,onClose:d,onProceed:c,authorizationUrl:l,requestParams:u})=>{const m=e.useId(),[h,p]=r.useState(!1),[R,O]=r.useState(!1);e.useEffect(()=>{const e=e=>{"Escape"===e.key&&s&&d()};if(s)return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)},[s,d]);return s?t.jsx(g,{$isOpen:s,children:t.jsxs(b,{children:[t.jsxs(x,{children:[t.jsx("h2",{children:"OAuth Authorization Request"}),t.jsx("button",{type:"button",className:"close-button",onClick:d,children:t.jsx(i,{})})]}),t.jsxs(j,{children:[t.jsxs(S,{children:[t.jsx("h4",{children:"What happens next?"}),t.jsx("p",{children:"You're about to be redirected to PingOne for authentication. This modal shows the authorization request that will be sent to PingOne. After successful authentication, you'll be redirected back to this application."})]}),t.jsxs(y,{children:[t.jsx("h3",{children:" Request Parameters"}),t.jsx(v,{children:Object.entries(u).map(([e,i])=>t.jsxs(r.Fragment,{children:[t.jsx(z,{children:e}),t.jsx(k,{children:i})]},e))})]}),t.jsxs(y,{children:[t.jsx("h3",{children:" Authorization URL"}),t.jsxs(w,{children:[t.jsx(A,{children:t.jsx(f,{url:l})}),t.jsxs($,{$copied:h,onClick:async()=>{try{await navigator.clipboard.writeText(l),p(!0),setTimeout(()=>p(!1),2e3)}catch(e){}},children:[h?t.jsx(o,{size:14}):t.jsx(n,{size:14}),h?"Copied!":"Copy URL"]})]})]}),t.jsxs(D,{children:[t.jsx("input",{type:"checkbox",id:m,checked:R,onChange:e=>O(e.target.checked)}),t.jsx("label",{htmlFor:m,children:"Do not show this modal again"})]}),t.jsxs(C,{children:[t.jsx(_,{onClick:d,children:"Cancel"}),t.jsxs(_,{$variant:"primary",onClick:()=>{if(R){const e="enhanced-flow-authorization-code",r={...JSON.parse(localStorage.getItem(e)||"{}"),showAuthRequestModal:!1};localStorage.setItem(e,JSON.stringify(r)),window.dispatchEvent(new CustomEvent("uiSettingsChanged",{detail:{showAuthRequestModal:!1}}))}c(),d()},children:[t.jsx(a,{size:16}),"Proceed to PingOne"]})]})]})]})}):null};class O{static generateAuthorizationRequest(e,r){const t=new URLSearchParams({response_type:"code",client_id:e.clientId,redirect_uri:e.redirectUri,scope:e.scope||"",state:O.generateState(),authorization_details:JSON.stringify(r)});return`${e.authorizationEndpoint}?${t.toString()}`}static buildAuthorizationRequest(e){const r=O.validateAuthorizationDetails(e.authorizationDetails);if(!r.valid)return{url:"",validation:r};return{url:O.generateAuthorizationRequest(e.credentials,e.authorizationDetails),validation:r}}static validateAuthorizationDetails(e){const r=[];if(!Array.isArray(e))return r.push("authorization_details must be an array"),{valid:!1,errors:r};for(let t=0;t<e.length;t++){const i=e[t],o=O.validateSingleAuthorizationDetail(i,t);r.push(...o)}return{valid:0===r.length,errors:r}}static validateSingleAuthorizationDetail(e,r){const t=[];e.type||t.push(`authorization_details[${r}]: type field is required`);const i=O.validateAuthorizationDetailType(e,r);return t.push(...i),t}static validateAuthorizationDetailType(e,r){const t=[];switch(e.type){case"payment_initiation":e.instructedAmount?.amount||t.push(`authorization_details[${r}]: instructedAmount.amount is required for payment_initiation`),e.creditorName||t.push(`authorization_details[${r}]: creditorName is required for payment_initiation`),e.creditorAccount||t.push(`authorization_details[${r}]: creditorAccount is required for payment_initiation`);break;case"account_information":e.balances||e.transactions||t.push(`authorization_details[${r}]: account_information should specify balances, transactions, or both`);break;case"customer_information":if(e.actions&&Array.isArray(e.actions)&&0!==e.actions.length||t.push(`authorization_details[${r}]: actions array is required for customer_information`),e.datatypes&&Array.isArray(e.datatypes)&&0!==e.datatypes.length||t.push(`authorization_details[${r}]: datatypes array is required for customer_information`),e.locations&&Array.isArray(e.locations)&&0!==e.locations.length||t.push(`authorization_details[${r}]: locations array is required for customer_information`),e.actions&&Array.isArray(e.actions)){const i=["read","write","delete","update"],o=e.actions.filter(e=>!i.includes(e));o.length>0&&t.push(`authorization_details[${r}]: invalid actions [${o.join(", ")}]. Valid actions: ${i.join(", ")}`)}e.locations&&Array.isArray(e.locations)&&e.locations.forEach((e,i)=>{try{new URL(e)}catch{t.push(`authorization_details[${r}]: locations[${i}] must be a valid URL`)}})}return t}static generateState(){return Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15)}static getTemplates(){return{paymentInitiation:{type:"payment_initiation",instructedAmount:{currency:"USD",amount:"0.00"},creditorName:"",creditorAccount:{iban:""}},accountInformation:{type:"account_information",accounts:[],balances:!0,transactions:{fromBookingDateTime:(new Date).toISOString(),toBookingDateTime:(new Date).toISOString()}},customerInformation:{type:"customer_information",actions:["read","write"],datatypes:["contacts","photos"],locations:["https://api.example.com/customers"]}}}static getExampleAuthorizationDetails(){return[{type:"customer_information",actions:["read","write"],datatypes:["contacts","photos"],locations:["https://api.example.com/customers"]},{type:"payment_initiation",instructedAmount:{currency:"USD",amount:"250.00"},creditorName:"ABC Supplies",creditorAccount:{iban:"DE89370400440532013000"}},{type:"account_information",accounts:["account1","account2"],balances:!0,transactions:{fromBookingDateTime:new Date(Date.now()-2592e6).toISOString(),toBookingDateTime:(new Date).toISOString()}}]}static parseAuthorizationResponse(e){let r;if(e.authorization_details)try{"string"==typeof e.authorization_details?r=JSON.parse(e.authorization_details):Array.isArray(e.authorization_details)&&(r=e.authorization_details)}catch(t){}return{tokens:e,authorizationDetails:r}}static validateScopeCompliance(e,r){const t=[];for(let i=0;i<e.length;i++){const o=e[i];if("customer_information"===o.type){const e=r.includes("profile")||r.includes("openid"),n=r.includes("profile")||o.actions?.includes("read");o.actions?.includes("write")&&!n&&t.push(`authorization_details[${i}]: write action requires appropriate scope`),o.actions?.includes("read")&&!e&&t.push(`authorization_details[${i}]: read action requires appropriate scope`)}}return{valid:0===t.length,errors:t}}static validateIBAN(e){return/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(e)}}const E=p.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
`,N=p.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`,U=p.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`,q=p.div`
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
`,F=p.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: ${e=>e.$active?"#3b82f6":"white"};
  color: ${e=>e.$active?"white":"#6b7280"};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${e=>e.$active?"#2563eb":"#f9fafb"};
  }
`,I=p.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  background: ${e=>e.$isValid?"#f0fdf4":"#fef2f2"};
  border: 1px solid ${e=>e.$isValid?"#bbf7d0":"#fecaca"};
  color: ${e=>e.$isValid?"#166534":"#991b1b"};
  font-size: 0.875rem;
`,M=p.ul`
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
  font-size: 0.875rem;
`,L=p.textarea`
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,T=p.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`,V=p.div`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  background: #f9fafb;
`,P=p.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`,B=p.div`
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
`,J=p.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: #ef4444;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #dc2626;
  }
`,W=p.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`,Y=p.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`,Z=p.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`,G=p.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,H=p.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`,K=p.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`,Q=p(G)`
  flex: 1;
`,X=p.button`
  padding: 0.25rem;
  border: none;
  background: #ef4444;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;

  &:hover {
    background: #dc2626;
  }
`,ee=p.button`
  padding: 0.5rem;
  border: 1px dashed #d1d5db;
  background: white;
  color: #6b7280;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`,re=p.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px dashed #d1d5db;
  background: white;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  width: 100%;
  justify-content: center;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`,te=({authorizationDetails:r,onUpdate:i,className:o})=>{const[n,a]=e.useState("visual"),[h,p]=e.useState(""),[f,g]=e.useState({valid:!0,errors:[]});e.useEffect(()=>{p(JSON.stringify(r,null,2))},[r]),e.useEffect(()=>{const e=O.validateAuthorizationDetails(r);g(e)},[r]);const b=e.useCallback(e=>{p(e);try{const r=JSON.parse(e);Array.isArray(r)&&i(r)}catch{}},[i]),x=e.useCallback((e,t,o)=>{const n=[...r];n[e]={...n[e],[t]:o},i(n)},[r,i]),j=e.useCallback(e=>{const t=r.filter((r,t)=>t!==e);i(t)},[r,i]),y=e.useCallback(()=>{const e={...O.getTemplates().customerInformation};i([...r,e])},[r,i]),v=e.useCallback((e,t,o,n)=>{const a=[...r],s={...a[e]},d=[...s[t]||[]];d[o]=n,s[t]=d,a[e]=s,i(a)},[r,i]),z=e.useCallback((e,t)=>{const o=[...r],n={...o[e]},a=[...n[t]||[]];a.push(""),n[t]=a,o[e]=n,i(o)},[r,i]),k=e.useCallback((e,t,o)=>{const n=[...r],a={...n[e]},s=[...a[t]||[]];s.splice(o,1),a[t]=s,n[e]=a,i(n)},[r,i]),w=(e,r,i=[])=>t.jsxs(H,{children:[i.map((i,o)=>t.jsxs(K,{children:[t.jsx(Q,{value:i,onChange:t=>v(e,r,o,t.target.value),placeholder:`${r} item`}),t.jsx(X,{onClick:()=>k(e,r,o),children:"×"})]},o)),t.jsxs(ee,{onClick:()=>z(e,r),children:[t.jsx(m,{size:12}),"Add ",r]})]});return t.jsxs(E,{className:o,children:[t.jsxs(N,{children:[t.jsx(U,{children:"Authorization Details (RAR)"}),t.jsxs(q,{children:[t.jsxs(F,{$active:"visual"===n,onClick:()=>a("visual"),children:[t.jsx(s,{size:14}),"Visual Editor"]}),t.jsxs(F,{$active:"json"===n,onClick:()=>a("json"),children:[t.jsx(d,{size:14}),"JSON Editor"]})]})]}),t.jsx(I,{$isValid:f.valid,children:f.valid?t.jsxs(t.Fragment,{children:[t.jsx(c,{size:16}),"Authorization details are valid"]}):t.jsxs(t.Fragment,{children:[t.jsx(l,{size:16}),t.jsxs("div",{children:["Validation errors found:",t.jsx(M,{children:f.errors.map((e,r)=>t.jsx("li",{children:e},r))})]})]})}),"visual"===n?t.jsxs(T,{children:[r.map((e,r)=>t.jsxs(V,{children:[t.jsxs(P,{children:[t.jsx(B,{children:e.type||"Untitled Authorization Detail"}),t.jsx(J,{onClick:()=>j(r),children:t.jsx(u,{size:14})})]}),t.jsxs(W,{children:[t.jsxs(Y,{children:[t.jsx(Z,{children:"Type"}),t.jsx(G,{value:e.type||"",onChange:e=>x(r,"type",e.target.value),placeholder:"e.g., customer_information"})]}),"customer_information"===e.type&&t.jsxs(t.Fragment,{children:[t.jsxs(Y,{children:[t.jsx(Z,{children:"Actions"}),w(r,"actions",e.actions)]}),t.jsxs(Y,{children:[t.jsx(Z,{children:"Data Types"}),w(r,"datatypes",e.datatypes)]}),t.jsxs(Y,{children:[t.jsx(Z,{children:"Locations"}),w(r,"locations",e.locations)]})]}),"payment_initiation"===e.type&&t.jsxs(t.Fragment,{children:[t.jsxs(Y,{children:[t.jsx(Z,{children:"Amount"}),t.jsx(G,{value:e.instructedAmount?.amount||"",onChange:t=>x(r,"instructedAmount",{...e.instructedAmount,amount:t.target.value}),placeholder:"250.00"})]}),t.jsxs(Y,{children:[t.jsx(Z,{children:"Currency"}),t.jsx(G,{value:e.instructedAmount?.currency||"",onChange:t=>x(r,"instructedAmount",{...e.instructedAmount,currency:t.target.value}),placeholder:"USD"})]}),t.jsxs(Y,{children:[t.jsx(Z,{children:"Creditor Name"}),t.jsx(G,{value:e.creditorName||"",onChange:e=>x(r,"creditorName",e.target.value),placeholder:"ABC Supplies"})]}),t.jsxs(Y,{children:[t.jsx(Z,{children:"Creditor IBAN"}),t.jsx(G,{value:e.creditorAccount?.iban||"",onChange:t=>x(r,"creditorAccount",{...e.creditorAccount,iban:t.target.value}),placeholder:"DE89370400440532013000"})]})]}),"account_information"===e.type&&t.jsxs(t.Fragment,{children:[t.jsxs(Y,{children:[t.jsx(Z,{children:"Accounts"}),w(r,"accounts",e.accounts)]}),t.jsxs(Y,{children:[t.jsx(Z,{children:"Include Balances"}),t.jsx(G,{type:"checkbox",checked:e.balances||!1,onChange:e=>x(r,"balances",e.target.checked)})]})]})]})]},r)),t.jsxs(re,{onClick:y,children:[t.jsx(m,{size:16}),"Add Authorization Detail"]})]}):t.jsx(L,{value:h,onChange:e=>b(e.target.value),placeholder:"Enter authorization details as JSON array..."})]})},ie=p.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: ${e=>e.$isOpen?"flex":"none"};
	align-items: center;
	justify-content: center;
	z-index: 1000;
`,oe=p.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 600px;
	width: 90%;
	max-height: 80vh;
	overflow-y: auto;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`,ne=p.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
`,ae=p.h2`
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,se=p.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	color: #6b7280;
	cursor: pointer;
	padding: 0.25rem;
	border-radius: 0.375rem;
	
	&:hover {
		background: #f3f4f6;
		color: #374151;
	}
`,de=p.div`
	background: #f8f9fa;
	border: 1px solid #e9ecef;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1.5rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	word-break: break-all;
	color: #495057;
`,ce=p.div`
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
	background: ${e=>e.$isValid?"#d1fae5":"#fef2f2"};
	border: 1px solid ${e=>e.$isValid?"#a7f3d0":"#fecaca"};
	color: ${e=>e.$isValid?"#065f46":"#991b1b"};
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`,le=p.div`
	margin-bottom: 1.5rem;
`,ue=p.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.75rem;
`,me=p.div`
	padding: 0.75rem;
	border-radius: 0.375rem;
	margin-bottom: 0.5rem;
	background: ${e=>e.$isError?"#fef2f2":"#fffbeb"};
	border-left: 4px solid ${e=>e.$isError?"#ef4444":"#f59e0b"};
	color: ${e=>e.$isError?"#991b1b":"#92400e"};
	font-size: 0.875rem;
`,he=p.div`
	display: flex;
	gap: 1rem;
	justify-content: flex-end;
`,pe=p.button`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 500;
	font-size: 0.875rem;
	cursor: pointer;
	border: none;
	transition: all 0.2s;
	
	${e=>"primary"===e.$variant?"\n\t\tbackground: #3b82f6;\n\t\tcolor: white;\n\t\t\n\t\t&:hover {\n\t\t\tbackground: #2563eb;\n\t\t}\n\t":"\n\t\tbackground: #f3f4f6;\n\t\tcolor: #374151;\n\t\t\n\t\t&:hover {\n\t\t\tbackground: #e5e7eb;\n\t\t}\n\t"}
`,fe=({isOpen:e,onClose:r,validationResult:o,authUrl:n,onProceed:s,onFix:d})=>{if(!e||!o)return null;const l=o.errors.length>0,u=o.warnings.length>0;return t.jsx(ie,{$isOpen:e,children:t.jsxs(oe,{children:[t.jsxs(ne,{children:[t.jsx(ae,{children:l?t.jsxs(t.Fragment,{children:[t.jsx(h,{style:{color:"#ef4444"}}),"Authorization URL Issues"]}):t.jsxs(t.Fragment,{children:[t.jsx(c,{style:{color:"#10b981"}}),"Authorization URL Validation"]})}),t.jsx(se,{onClick:r,children:t.jsx(i,{})})]}),t.jsxs(de,{children:[t.jsx("strong",{children:"Authorization URL:"}),t.jsx("br",{}),n]}),t.jsx(ce,{$isValid:o.isValid,children:l?t.jsxs(t.Fragment,{children:[t.jsx(h,{}),o.errors.length," error",1!==o.errors.length?"s":""," found"]}):u?t.jsxs(t.Fragment,{children:[t.jsx(h,{}),o.warnings.length," warning",1!==o.warnings.length?"s":""," found"]}):t.jsxs(t.Fragment,{children:[t.jsx(c,{}),"URL validation passed"]})}),(l||u)&&t.jsxs(le,{children:[l&&t.jsxs("div",{children:[t.jsx(ue,{style:{color:"#dc2626"},children:"Errors:"}),o.errors.map((e,r)=>t.jsx(me,{$isError:!0,children:e},r))]}),u&&t.jsxs("div",{children:[t.jsx(ue,{style:{color:"#d97706"},children:"Warnings:"}),o.warnings.map((e,r)=>t.jsx(me,{$isError:!1,children:e},r))]})]}),t.jsxs(he,{children:[t.jsx(pe,{$variant:"secondary",onClick:d,children:"Fix Issues"}),t.jsxs(pe,{$variant:"primary",onClick:s,children:[t.jsx(a,{style:{marginRight:"0.5rem"}}),"Proceed Anyway"]})]})]})})};export{R as A,O as R,te as a,fe as b};
//# sourceMappingURL=components-oauth-authorize-sao_-EgS.js.map
