function T0(t,i){for(var s=0;s<i.length;s++){const c=i[s];if(typeof c!="string"&&!Array.isArray(c)){for(const u in c)if(u!=="default"&&!(u in t)){const h=Object.getOwnPropertyDescriptor(c,u);h&&Object.defineProperty(t,u,h.get?h:{enumerable:!0,get:()=>c[u]})}}}return Object.freeze(Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}))}(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const u of document.querySelectorAll('link[rel="modulepreload"]'))c(u);new MutationObserver(u=>{for(const h of u)if(h.type==="childList")for(const f of h.addedNodes)f.tagName==="LINK"&&f.rel==="modulepreload"&&c(f)}).observe(document,{childList:!0,subtree:!0});function s(u){const h={};return u.integrity&&(h.integrity=u.integrity),u.referrerPolicy&&(h.referrerPolicy=u.referrerPolicy),u.crossOrigin==="use-credentials"?h.credentials="include":u.crossOrigin==="anonymous"?h.credentials="omit":h.credentials="same-origin",h}function c(u){if(u.ep)return;u.ep=!0;const h=s(u);fetch(u.href,h)}})();function uh(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}var Za={exports:{}},Go={},ec={exports:{}},me={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Xf;function z0(){if(Xf)return me;Xf=1;var t=Symbol.for("react.element"),i=Symbol.for("react.portal"),s=Symbol.for("react.fragment"),c=Symbol.for("react.strict_mode"),u=Symbol.for("react.profiler"),h=Symbol.for("react.provider"),f=Symbol.for("react.context"),v=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),g=Symbol.for("react.memo"),k=Symbol.for("react.lazy"),w=Symbol.iterator;function b(_){return _===null||typeof _!="object"?null:(_=w&&_[w]||_["@@iterator"],typeof _=="function"?_:null)}var R={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},L=Object.assign,M={};function E(_,U,de){this.props=_,this.context=U,this.refs=M,this.updater=de||R}E.prototype.isReactComponent={},E.prototype.setState=function(_,U){if(typeof _!="object"&&typeof _!="function"&&_!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,_,U,"setState")},E.prototype.forceUpdate=function(_){this.updater.enqueueForceUpdate(this,_,"forceUpdate")};function C(){}C.prototype=E.prototype;function z(_,U,de){this.props=_,this.context=U,this.refs=M,this.updater=de||R}var O=z.prototype=new C;O.constructor=z,L(O,E.prototype),O.isPureReactComponent=!0;var D=Array.isArray,A=Object.prototype.hasOwnProperty,F={current:null},N={key:!0,ref:!0,__self:!0,__source:!0};function B(_,U,de){var ue,ge={},he=null,Se=null;if(U!=null)for(ue in U.ref!==void 0&&(Se=U.ref),U.key!==void 0&&(he=""+U.key),U)A.call(U,ue)&&!N.hasOwnProperty(ue)&&(ge[ue]=U[ue]);var ye=arguments.length-2;if(ye===1)ge.children=de;else if(1<ye){for(var ke=Array(ye),tt=0;tt<ye;tt++)ke[tt]=arguments[tt+2];ge.children=ke}if(_&&_.defaultProps)for(ue in ye=_.defaultProps,ye)ge[ue]===void 0&&(ge[ue]=ye[ue]);return{$$typeof:t,type:_,key:he,ref:Se,props:ge,_owner:F.current}}function ee(_,U){return{$$typeof:t,type:_.type,key:U,ref:_.ref,props:_.props,_owner:_._owner}}function Y(_){return typeof _=="object"&&_!==null&&_.$$typeof===t}function le(_){var U={"=":"=0",":":"=2"};return"$"+_.replace(/[=:]/g,function(de){return U[de]})}var oe=/\/+/g;function G(_,U){return typeof _=="object"&&_!==null&&_.key!=null?le(""+_.key):U.toString(36)}function ce(_,U,de,ue,ge){var he=typeof _;(he==="undefined"||he==="boolean")&&(_=null);var Se=!1;if(_===null)Se=!0;else switch(he){case"string":case"number":Se=!0;break;case"object":switch(_.$$typeof){case t:case i:Se=!0}}if(Se)return Se=_,ge=ge(Se),_=ue===""?"."+G(Se,0):ue,D(ge)?(de="",_!=null&&(de=_.replace(oe,"$&/")+"/"),ce(ge,U,de,"",function(tt){return tt})):ge!=null&&(Y(ge)&&(ge=ee(ge,de+(!ge.key||Se&&Se.key===ge.key?"":(""+ge.key).replace(oe,"$&/")+"/")+_)),U.push(ge)),1;if(Se=0,ue=ue===""?".":ue+":",D(_))for(var ye=0;ye<_.length;ye++){he=_[ye];var ke=ue+G(he,ye);Se+=ce(he,U,de,ke,ge)}else if(ke=b(_),typeof ke=="function")for(_=ke.call(_),ye=0;!(he=_.next()).done;)he=he.value,ke=ue+G(he,ye++),Se+=ce(he,U,de,ke,ge);else if(he==="object")throw U=String(_),Error("Objects are not valid as a React child (found: "+(U==="[object Object]"?"object with keys {"+Object.keys(_).join(", ")+"}":U)+"). If you meant to render a collection of children, use an array instead.");return Se}function _e(_,U,de){if(_==null)return _;var ue=[],ge=0;return ce(_,ue,"","",function(he){return U.call(de,he,ge++)}),ue}function xe(_){if(_._status===-1){var U=_._result;U=U(),U.then(function(de){(_._status===0||_._status===-1)&&(_._status=1,_._result=de)},function(de){(_._status===0||_._status===-1)&&(_._status=2,_._result=de)}),_._status===-1&&(_._status=0,_._result=U)}if(_._status===1)return _._result.default;throw _._result}var ve={current:null},K={transition:null},X={ReactCurrentDispatcher:ve,ReactCurrentBatchConfig:K,ReactCurrentOwner:F};function q(){throw Error("act(...) is not supported in production builds of React.")}return me.Children={map:_e,forEach:function(_,U,de){_e(_,function(){U.apply(this,arguments)},de)},count:function(_){var U=0;return _e(_,function(){U++}),U},toArray:function(_){return _e(_,function(U){return U})||[]},only:function(_){if(!Y(_))throw Error("React.Children.only expected to receive a single React element child.");return _}},me.Component=E,me.Fragment=s,me.Profiler=u,me.PureComponent=z,me.StrictMode=c,me.Suspense=m,me.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=X,me.act=q,me.cloneElement=function(_,U,de){if(_==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+_+".");var ue=L({},_.props),ge=_.key,he=_.ref,Se=_._owner;if(U!=null){if(U.ref!==void 0&&(he=U.ref,Se=F.current),U.key!==void 0&&(ge=""+U.key),_.type&&_.type.defaultProps)var ye=_.type.defaultProps;for(ke in U)A.call(U,ke)&&!N.hasOwnProperty(ke)&&(ue[ke]=U[ke]===void 0&&ye!==void 0?ye[ke]:U[ke])}var ke=arguments.length-2;if(ke===1)ue.children=de;else if(1<ke){ye=Array(ke);for(var tt=0;tt<ke;tt++)ye[tt]=arguments[tt+2];ue.children=ye}return{$$typeof:t,type:_.type,key:ge,ref:he,props:ue,_owner:Se}},me.createContext=function(_){return _={$$typeof:f,_currentValue:_,_currentValue2:_,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},_.Provider={$$typeof:h,_context:_},_.Consumer=_},me.createElement=B,me.createFactory=function(_){var U=B.bind(null,_);return U.type=_,U},me.createRef=function(){return{current:null}},me.forwardRef=function(_){return{$$typeof:v,render:_}},me.isValidElement=Y,me.lazy=function(_){return{$$typeof:k,_payload:{_status:-1,_result:_},_init:xe}},me.memo=function(_,U){return{$$typeof:g,type:_,compare:U===void 0?null:U}},me.startTransition=function(_){var U=K.transition;K.transition={};try{_()}finally{K.transition=U}},me.unstable_act=q,me.useCallback=function(_,U){return ve.current.useCallback(_,U)},me.useContext=function(_){return ve.current.useContext(_)},me.useDebugValue=function(){},me.useDeferredValue=function(_){return ve.current.useDeferredValue(_)},me.useEffect=function(_,U){return ve.current.useEffect(_,U)},me.useId=function(){return ve.current.useId()},me.useImperativeHandle=function(_,U,de){return ve.current.useImperativeHandle(_,U,de)},me.useInsertionEffect=function(_,U){return ve.current.useInsertionEffect(_,U)},me.useLayoutEffect=function(_,U){return ve.current.useLayoutEffect(_,U)},me.useMemo=function(_,U){return ve.current.useMemo(_,U)},me.useReducer=function(_,U,de){return ve.current.useReducer(_,U,de)},me.useRef=function(_){return ve.current.useRef(_)},me.useState=function(_){return ve.current.useState(_)},me.useSyncExternalStore=function(_,U,de){return ve.current.useSyncExternalStore(_,U,de)},me.useTransition=function(){return ve.current.useTransition()},me.version="18.3.1",me}var Zf;function Wc(){return Zf||(Zf=1,ec.exports=z0()),ec.exports}/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var ep;function P0(){if(ep)return Go;ep=1;var t=Wc(),i=Symbol.for("react.element"),s=Symbol.for("react.fragment"),c=Object.prototype.hasOwnProperty,u=t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,h={key:!0,ref:!0,__self:!0,__source:!0};function f(v,m,g){var k,w={},b=null,R=null;g!==void 0&&(b=""+g),m.key!==void 0&&(b=""+m.key),m.ref!==void 0&&(R=m.ref);for(k in m)c.call(m,k)&&!h.hasOwnProperty(k)&&(w[k]=m[k]);if(v&&v.defaultProps)for(k in m=v.defaultProps,m)w[k]===void 0&&(w[k]=m[k]);return{$$typeof:i,type:v,key:b,ref:R,props:w,_owner:u.current}}return Go.Fragment=s,Go.jsx=f,Go.jsxs=f,Go}var tp;function A0(){return tp||(tp=1,Za.exports=P0()),Za.exports}var n=A0(),S=Wc();const He=uh(S),R0=T0({__proto__:null,default:He},[S]);var ys={},tc={exports:{}},yt={},rc={exports:{}},nc={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var rp;function O0(){return rp||(rp=1,(function(t){function i(K,X){var q=K.length;K.push(X);e:for(;0<q;){var _=q-1>>>1,U=K[_];if(0<u(U,X))K[_]=X,K[q]=U,q=_;else break e}}function s(K){return K.length===0?null:K[0]}function c(K){if(K.length===0)return null;var X=K[0],q=K.pop();if(q!==X){K[0]=q;e:for(var _=0,U=K.length,de=U>>>1;_<de;){var ue=2*(_+1)-1,ge=K[ue],he=ue+1,Se=K[he];if(0>u(ge,q))he<U&&0>u(Se,ge)?(K[_]=Se,K[he]=q,_=he):(K[_]=ge,K[ue]=q,_=ue);else if(he<U&&0>u(Se,q))K[_]=Se,K[he]=q,_=he;else break e}}return X}function u(K,X){var q=K.sortIndex-X.sortIndex;return q!==0?q:K.id-X.id}if(typeof performance=="object"&&typeof performance.now=="function"){var h=performance;t.unstable_now=function(){return h.now()}}else{var f=Date,v=f.now();t.unstable_now=function(){return f.now()-v}}var m=[],g=[],k=1,w=null,b=3,R=!1,L=!1,M=!1,E=typeof setTimeout=="function"?setTimeout:null,C=typeof clearTimeout=="function"?clearTimeout:null,z=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function O(K){for(var X=s(g);X!==null;){if(X.callback===null)c(g);else if(X.startTime<=K)c(g),X.sortIndex=X.expirationTime,i(m,X);else break;X=s(g)}}function D(K){if(M=!1,O(K),!L)if(s(m)!==null)L=!0,xe(A);else{var X=s(g);X!==null&&ve(D,X.startTime-K)}}function A(K,X){L=!1,M&&(M=!1,C(B),B=-1),R=!0;var q=b;try{for(O(X),w=s(m);w!==null&&(!(w.expirationTime>X)||K&&!le());){var _=w.callback;if(typeof _=="function"){w.callback=null,b=w.priorityLevel;var U=_(w.expirationTime<=X);X=t.unstable_now(),typeof U=="function"?w.callback=U:w===s(m)&&c(m),O(X)}else c(m);w=s(m)}if(w!==null)var de=!0;else{var ue=s(g);ue!==null&&ve(D,ue.startTime-X),de=!1}return de}finally{w=null,b=q,R=!1}}var F=!1,N=null,B=-1,ee=5,Y=-1;function le(){return!(t.unstable_now()-Y<ee)}function oe(){if(N!==null){var K=t.unstable_now();Y=K;var X=!0;try{X=N(!0,K)}finally{X?G():(F=!1,N=null)}}else F=!1}var G;if(typeof z=="function")G=function(){z(oe)};else if(typeof MessageChannel<"u"){var ce=new MessageChannel,_e=ce.port2;ce.port1.onmessage=oe,G=function(){_e.postMessage(null)}}else G=function(){E(oe,0)};function xe(K){N=K,F||(F=!0,G())}function ve(K,X){B=E(function(){K(t.unstable_now())},X)}t.unstable_IdlePriority=5,t.unstable_ImmediatePriority=1,t.unstable_LowPriority=4,t.unstable_NormalPriority=3,t.unstable_Profiling=null,t.unstable_UserBlockingPriority=2,t.unstable_cancelCallback=function(K){K.callback=null},t.unstable_continueExecution=function(){L||R||(L=!0,xe(A))},t.unstable_forceFrameRate=function(K){0>K||125<K?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):ee=0<K?Math.floor(1e3/K):5},t.unstable_getCurrentPriorityLevel=function(){return b},t.unstable_getFirstCallbackNode=function(){return s(m)},t.unstable_next=function(K){switch(b){case 1:case 2:case 3:var X=3;break;default:X=b}var q=b;b=X;try{return K()}finally{b=q}},t.unstable_pauseExecution=function(){},t.unstable_requestPaint=function(){},t.unstable_runWithPriority=function(K,X){switch(K){case 1:case 2:case 3:case 4:case 5:break;default:K=3}var q=b;b=K;try{return X()}finally{b=q}},t.unstable_scheduleCallback=function(K,X,q){var _=t.unstable_now();switch(typeof q=="object"&&q!==null?(q=q.delay,q=typeof q=="number"&&0<q?_+q:_):q=_,K){case 1:var U=-1;break;case 2:U=250;break;case 5:U=1073741823;break;case 4:U=1e4;break;default:U=5e3}return U=q+U,K={id:k++,callback:X,priorityLevel:K,startTime:q,expirationTime:U,sortIndex:-1},q>_?(K.sortIndex=q,i(g,K),s(m)===null&&K===s(g)&&(M?(C(B),B=-1):M=!0,ve(D,q-_))):(K.sortIndex=U,i(m,K),L||R||(L=!0,xe(A))),K},t.unstable_shouldYield=le,t.unstable_wrapCallback=function(K){var X=b;return function(){var q=b;b=X;try{return K.apply(this,arguments)}finally{b=q}}}})(nc)),nc}var np;function N0(){return np||(np=1,rc.exports=O0()),rc.exports}/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var op;function D0(){if(op)return yt;op=1;var t=Wc(),i=N0();function s(e){for(var r="https://reactjs.org/docs/error-decoder.html?invariant="+e,o=1;o<arguments.length;o++)r+="&args[]="+encodeURIComponent(arguments[o]);return"Minified React error #"+e+"; visit "+r+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var c=new Set,u={};function h(e,r){f(e,r),f(e+"Capture",r)}function f(e,r){for(u[e]=r,e=0;e<r.length;e++)c.add(r[e])}var v=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),m=Object.prototype.hasOwnProperty,g=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,k={},w={};function b(e){return m.call(w,e)?!0:m.call(k,e)?!1:g.test(e)?w[e]=!0:(k[e]=!0,!1)}function R(e,r,o,l){if(o!==null&&o.type===0)return!1;switch(typeof r){case"function":case"symbol":return!0;case"boolean":return l?!1:o!==null?!o.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function L(e,r,o,l){if(r===null||typeof r>"u"||R(e,r,o,l))return!0;if(l)return!1;if(o!==null)switch(o.type){case 3:return!r;case 4:return r===!1;case 5:return isNaN(r);case 6:return isNaN(r)||1>r}return!1}function M(e,r,o,l,a,d,p){this.acceptsBooleans=r===2||r===3||r===4,this.attributeName=l,this.attributeNamespace=a,this.mustUseProperty=o,this.propertyName=e,this.type=r,this.sanitizeURL=d,this.removeEmptyString=p}var E={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){E[e]=new M(e,0,!1,e,null,!1,!1)}),[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var r=e[0];E[r]=new M(r,1,!1,e[1],null,!1,!1)}),["contentEditable","draggable","spellCheck","value"].forEach(function(e){E[e]=new M(e,2,!1,e.toLowerCase(),null,!1,!1)}),["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){E[e]=new M(e,2,!1,e,null,!1,!1)}),"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){E[e]=new M(e,3,!1,e.toLowerCase(),null,!1,!1)}),["checked","multiple","muted","selected"].forEach(function(e){E[e]=new M(e,3,!0,e,null,!1,!1)}),["capture","download"].forEach(function(e){E[e]=new M(e,4,!1,e,null,!1,!1)}),["cols","rows","size","span"].forEach(function(e){E[e]=new M(e,6,!1,e,null,!1,!1)}),["rowSpan","start"].forEach(function(e){E[e]=new M(e,5,!1,e.toLowerCase(),null,!1,!1)});var C=/[\-:]([a-z])/g;function z(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var r=e.replace(C,z);E[r]=new M(r,1,!1,e,null,!1,!1)}),"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var r=e.replace(C,z);E[r]=new M(r,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)}),["xml:base","xml:lang","xml:space"].forEach(function(e){var r=e.replace(C,z);E[r]=new M(r,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)}),["tabIndex","crossOrigin"].forEach(function(e){E[e]=new M(e,1,!1,e.toLowerCase(),null,!1,!1)}),E.xlinkHref=new M("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1),["src","href","action","formAction"].forEach(function(e){E[e]=new M(e,1,!1,e.toLowerCase(),null,!0,!0)});function O(e,r,o,l){var a=E.hasOwnProperty(r)?E[r]:null;(a!==null?a.type!==0:l||!(2<r.length)||r[0]!=="o"&&r[0]!=="O"||r[1]!=="n"&&r[1]!=="N")&&(L(r,o,a,l)&&(o=null),l||a===null?b(r)&&(o===null?e.removeAttribute(r):e.setAttribute(r,""+o)):a.mustUseProperty?e[a.propertyName]=o===null?a.type===3?!1:"":o:(r=a.attributeName,l=a.attributeNamespace,o===null?e.removeAttribute(r):(a=a.type,o=a===3||a===4&&o===!0?"":""+o,l?e.setAttributeNS(l,r,o):e.setAttribute(r,o))))}var D=t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,A=Symbol.for("react.element"),F=Symbol.for("react.portal"),N=Symbol.for("react.fragment"),B=Symbol.for("react.strict_mode"),ee=Symbol.for("react.profiler"),Y=Symbol.for("react.provider"),le=Symbol.for("react.context"),oe=Symbol.for("react.forward_ref"),G=Symbol.for("react.suspense"),ce=Symbol.for("react.suspense_list"),_e=Symbol.for("react.memo"),xe=Symbol.for("react.lazy"),ve=Symbol.for("react.offscreen"),K=Symbol.iterator;function X(e){return e===null||typeof e!="object"?null:(e=K&&e[K]||e["@@iterator"],typeof e=="function"?e:null)}var q=Object.assign,_;function U(e){if(_===void 0)try{throw Error()}catch(o){var r=o.stack.trim().match(/\n( *(at )?)/);_=r&&r[1]||""}return`
`+_+e}var de=!1;function ue(e,r){if(!e||de)return"";de=!0;var o=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(r)if(r=function(){throw Error()},Object.defineProperty(r.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(r,[])}catch(P){var l=P}Reflect.construct(e,[],r)}else{try{r.call()}catch(P){l=P}e.call(r.prototype)}else{try{throw Error()}catch(P){l=P}e()}}catch(P){if(P&&l&&typeof P.stack=="string"){for(var a=P.stack.split(`
`),d=l.stack.split(`
`),p=a.length-1,y=d.length-1;1<=p&&0<=y&&a[p]!==d[y];)y--;for(;1<=p&&0<=y;p--,y--)if(a[p]!==d[y]){if(p!==1||y!==1)do if(p--,y--,0>y||a[p]!==d[y]){var j=`
`+a[p].replace(" at new "," at ");return e.displayName&&j.includes("<anonymous>")&&(j=j.replace("<anonymous>",e.displayName)),j}while(1<=p&&0<=y);break}}}finally{de=!1,Error.prepareStackTrace=o}return(e=e?e.displayName||e.name:"")?U(e):""}function ge(e){switch(e.tag){case 5:return U(e.type);case 16:return U("Lazy");case 13:return U("Suspense");case 19:return U("SuspenseList");case 0:case 2:case 15:return e=ue(e.type,!1),e;case 11:return e=ue(e.type.render,!1),e;case 1:return e=ue(e.type,!0),e;default:return""}}function he(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case N:return"Fragment";case F:return"Portal";case ee:return"Profiler";case B:return"StrictMode";case G:return"Suspense";case ce:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case le:return(e.displayName||"Context")+".Consumer";case Y:return(e._context.displayName||"Context")+".Provider";case oe:var r=e.render;return e=e.displayName,e||(e=r.displayName||r.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case _e:return r=e.displayName||null,r!==null?r:he(e.type)||"Memo";case xe:r=e._payload,e=e._init;try{return he(e(r))}catch{}}return null}function Se(e){var r=e.type;switch(e.tag){case 24:return"Cache";case 9:return(r.displayName||"Context")+".Consumer";case 10:return(r._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=r.render,e=e.displayName||e.name||"",r.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return r;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return he(r);case 8:return r===B?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof r=="function")return r.displayName||r.name||null;if(typeof r=="string")return r}return null}function ye(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function ke(e){var r=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(r==="checkbox"||r==="radio")}function tt(e){var r=ke(e)?"checked":"value",o=Object.getOwnPropertyDescriptor(e.constructor.prototype,r),l=""+e[r];if(!e.hasOwnProperty(r)&&typeof o<"u"&&typeof o.get=="function"&&typeof o.set=="function"){var a=o.get,d=o.set;return Object.defineProperty(e,r,{configurable:!0,get:function(){return a.call(this)},set:function(p){l=""+p,d.call(this,p)}}),Object.defineProperty(e,r,{enumerable:o.enumerable}),{getValue:function(){return l},setValue:function(p){l=""+p},stopTracking:function(){e._valueTracker=null,delete e[r]}}}}function er(e){e._valueTracker||(e._valueTracker=tt(e))}function Pt(e){if(!e)return!1;var r=e._valueTracker;if(!r)return!0;var o=r.getValue(),l="";return e&&(l=ke(e)?e.checked?"true":"false":e.value),e=l,e!==o?(r.setValue(e),!0):!1}function ai(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function sl(e,r){var o=r.checked;return q({},r,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:o??e._wrapperState.initialChecked})}function od(e,r){var o=r.defaultValue==null?"":r.defaultValue,l=r.checked!=null?r.checked:r.defaultChecked;o=ye(r.value!=null?r.value:o),e._wrapperState={initialChecked:l,initialValue:o,controlled:r.type==="checkbox"||r.type==="radio"?r.checked!=null:r.value!=null}}function id(e,r){r=r.checked,r!=null&&O(e,"checked",r,!1)}function ll(e,r){id(e,r);var o=ye(r.value),l=r.type;if(o!=null)l==="number"?(o===0&&e.value===""||e.value!=o)&&(e.value=""+o):e.value!==""+o&&(e.value=""+o);else if(l==="submit"||l==="reset"){e.removeAttribute("value");return}r.hasOwnProperty("value")?al(e,r.type,o):r.hasOwnProperty("defaultValue")&&al(e,r.type,ye(r.defaultValue)),r.checked==null&&r.defaultChecked!=null&&(e.defaultChecked=!!r.defaultChecked)}function sd(e,r,o){if(r.hasOwnProperty("value")||r.hasOwnProperty("defaultValue")){var l=r.type;if(!(l!=="submit"&&l!=="reset"||r.value!==void 0&&r.value!==null))return;r=""+e._wrapperState.initialValue,o||r===e.value||(e.value=r),e.defaultValue=r}o=e.name,o!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,o!==""&&(e.name=o)}function al(e,r,o){(r!=="number"||ai(e.ownerDocument)!==e)&&(o==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+o&&(e.defaultValue=""+o))}var ao=Array.isArray;function yn(e,r,o,l){if(e=e.options,r){r={};for(var a=0;a<o.length;a++)r["$"+o[a]]=!0;for(o=0;o<e.length;o++)a=r.hasOwnProperty("$"+e[o].value),e[o].selected!==a&&(e[o].selected=a),a&&l&&(e[o].defaultSelected=!0)}else{for(o=""+ye(o),r=null,a=0;a<e.length;a++){if(e[a].value===o){e[a].selected=!0,l&&(e[a].defaultSelected=!0);return}r!==null||e[a].disabled||(r=e[a])}r!==null&&(r.selected=!0)}}function cl(e,r){if(r.dangerouslySetInnerHTML!=null)throw Error(s(91));return q({},r,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function ld(e,r){var o=r.value;if(o==null){if(o=r.children,r=r.defaultValue,o!=null){if(r!=null)throw Error(s(92));if(ao(o)){if(1<o.length)throw Error(s(93));o=o[0]}r=o}r==null&&(r=""),o=r}e._wrapperState={initialValue:ye(o)}}function ad(e,r){var o=ye(r.value),l=ye(r.defaultValue);o!=null&&(o=""+o,o!==e.value&&(e.value=o),r.defaultValue==null&&e.defaultValue!==o&&(e.defaultValue=o)),l!=null&&(e.defaultValue=""+l)}function cd(e){var r=e.textContent;r===e._wrapperState.initialValue&&r!==""&&r!==null&&(e.value=r)}function dd(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function dl(e,r){return e==null||e==="http://www.w3.org/1999/xhtml"?dd(r):e==="http://www.w3.org/2000/svg"&&r==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var ci,ud=(function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(r,o,l,a){MSApp.execUnsafeLocalFunction(function(){return e(r,o,l,a)})}:e})(function(e,r){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=r;else{for(ci=ci||document.createElement("div"),ci.innerHTML="<svg>"+r.valueOf().toString()+"</svg>",r=ci.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;r.firstChild;)e.appendChild(r.firstChild)}});function co(e,r){if(r){var o=e.firstChild;if(o&&o===e.lastChild&&o.nodeType===3){o.nodeValue=r;return}}e.textContent=r}var uo={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Rm=["Webkit","ms","Moz","O"];Object.keys(uo).forEach(function(e){Rm.forEach(function(r){r=r+e.charAt(0).toUpperCase()+e.substring(1),uo[r]=uo[e]})});function fd(e,r,o){return r==null||typeof r=="boolean"||r===""?"":o||typeof r!="number"||r===0||uo.hasOwnProperty(e)&&uo[e]?(""+r).trim():r+"px"}function pd(e,r){e=e.style;for(var o in r)if(r.hasOwnProperty(o)){var l=o.indexOf("--")===0,a=fd(o,r[o],l);o==="float"&&(o="cssFloat"),l?e.setProperty(o,a):e[o]=a}}var Om=q({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function ul(e,r){if(r){if(Om[e]&&(r.children!=null||r.dangerouslySetInnerHTML!=null))throw Error(s(137,e));if(r.dangerouslySetInnerHTML!=null){if(r.children!=null)throw Error(s(60));if(typeof r.dangerouslySetInnerHTML!="object"||!("__html"in r.dangerouslySetInnerHTML))throw Error(s(61))}if(r.style!=null&&typeof r.style!="object")throw Error(s(62))}}function fl(e,r){if(e.indexOf("-")===-1)return typeof r.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var pl=null;function hl(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var ml=null,xn=null,vn=null;function hd(e){if(e=Ao(e)){if(typeof ml!="function")throw Error(s(280));var r=e.stateNode;r&&(r=Pi(r),ml(e.stateNode,e.type,r))}}function md(e){xn?vn?vn.push(e):vn=[e]:xn=e}function gd(){if(xn){var e=xn,r=vn;if(vn=xn=null,hd(e),r)for(e=0;e<r.length;e++)hd(r[e])}}function yd(e,r){return e(r)}function xd(){}var gl=!1;function vd(e,r,o){if(gl)return e(r,o);gl=!0;try{return yd(e,r,o)}finally{gl=!1,(xn!==null||vn!==null)&&(xd(),gd())}}function fo(e,r){var o=e.stateNode;if(o===null)return null;var l=Pi(o);if(l===null)return null;o=l[r];e:switch(r){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(l=!l.disabled)||(e=e.type,l=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!l;break e;default:e=!1}if(e)return null;if(o&&typeof o!="function")throw Error(s(231,r,typeof o));return o}var yl=!1;if(v)try{var po={};Object.defineProperty(po,"passive",{get:function(){yl=!0}}),window.addEventListener("test",po,po),window.removeEventListener("test",po,po)}catch{yl=!1}function Nm(e,r,o,l,a,d,p,y,j){var P=Array.prototype.slice.call(arguments,3);try{r.apply(o,P)}catch(J){this.onError(J)}}var ho=!1,di=null,ui=!1,xl=null,Dm={onError:function(e){ho=!0,di=e}};function Lm(e,r,o,l,a,d,p,y,j){ho=!1,di=null,Nm.apply(Dm,arguments)}function Um(e,r,o,l,a,d,p,y,j){if(Lm.apply(this,arguments),ho){if(ho){var P=di;ho=!1,di=null}else throw Error(s(198));ui||(ui=!0,xl=P)}}function Vr(e){var r=e,o=e;if(e.alternate)for(;r.return;)r=r.return;else{e=r;do r=e,(r.flags&4098)!==0&&(o=r.return),e=r.return;while(e)}return r.tag===3?o:null}function wd(e){if(e.tag===13){var r=e.memoizedState;if(r===null&&(e=e.alternate,e!==null&&(r=e.memoizedState)),r!==null)return r.dehydrated}return null}function kd(e){if(Vr(e)!==e)throw Error(s(188))}function Mm(e){var r=e.alternate;if(!r){if(r=Vr(e),r===null)throw Error(s(188));return r!==e?null:e}for(var o=e,l=r;;){var a=o.return;if(a===null)break;var d=a.alternate;if(d===null){if(l=a.return,l!==null){o=l;continue}break}if(a.child===d.child){for(d=a.child;d;){if(d===o)return kd(a),e;if(d===l)return kd(a),r;d=d.sibling}throw Error(s(188))}if(o.return!==l.return)o=a,l=d;else{for(var p=!1,y=a.child;y;){if(y===o){p=!0,o=a,l=d;break}if(y===l){p=!0,l=a,o=d;break}y=y.sibling}if(!p){for(y=d.child;y;){if(y===o){p=!0,o=d,l=a;break}if(y===l){p=!0,l=d,o=a;break}y=y.sibling}if(!p)throw Error(s(189))}}if(o.alternate!==l)throw Error(s(190))}if(o.tag!==3)throw Error(s(188));return o.stateNode.current===o?e:r}function jd(e){return e=Mm(e),e!==null?Sd(e):null}function Sd(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var r=Sd(e);if(r!==null)return r;e=e.sibling}return null}var bd=i.unstable_scheduleCallback,Cd=i.unstable_cancelCallback,Fm=i.unstable_shouldYield,Wm=i.unstable_requestPaint,Me=i.unstable_now,Bm=i.unstable_getCurrentPriorityLevel,vl=i.unstable_ImmediatePriority,Id=i.unstable_UserBlockingPriority,fi=i.unstable_NormalPriority,Jm=i.unstable_LowPriority,_d=i.unstable_IdlePriority,pi=null,Ht=null;function Hm(e){if(Ht&&typeof Ht.onCommitFiberRoot=="function")try{Ht.onCommitFiberRoot(pi,e,void 0,(e.current.flags&128)===128)}catch{}}var At=Math.clz32?Math.clz32:Gm,Vm=Math.log,Km=Math.LN2;function Gm(e){return e>>>=0,e===0?32:31-(Vm(e)/Km|0)|0}var hi=64,mi=4194304;function mo(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function gi(e,r){var o=e.pendingLanes;if(o===0)return 0;var l=0,a=e.suspendedLanes,d=e.pingedLanes,p=o&268435455;if(p!==0){var y=p&~a;y!==0?l=mo(y):(d&=p,d!==0&&(l=mo(d)))}else p=o&~a,p!==0?l=mo(p):d!==0&&(l=mo(d));if(l===0)return 0;if(r!==0&&r!==l&&(r&a)===0&&(a=l&-l,d=r&-r,a>=d||a===16&&(d&4194240)!==0))return r;if((l&4)!==0&&(l|=o&16),r=e.entangledLanes,r!==0)for(e=e.entanglements,r&=l;0<r;)o=31-At(r),a=1<<o,l|=e[o],r&=~a;return l}function qm(e,r){switch(e){case 1:case 2:case 4:return r+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return r+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Ym(e,r){for(var o=e.suspendedLanes,l=e.pingedLanes,a=e.expirationTimes,d=e.pendingLanes;0<d;){var p=31-At(d),y=1<<p,j=a[p];j===-1?((y&o)===0||(y&l)!==0)&&(a[p]=qm(y,r)):j<=r&&(e.expiredLanes|=y),d&=~y}}function wl(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function Ed(){var e=hi;return hi<<=1,(hi&4194240)===0&&(hi=64),e}function kl(e){for(var r=[],o=0;31>o;o++)r.push(e);return r}function go(e,r,o){e.pendingLanes|=r,r!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,r=31-At(r),e[r]=o}function Qm(e,r){var o=e.pendingLanes&~r;e.pendingLanes=r,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=r,e.mutableReadLanes&=r,e.entangledLanes&=r,r=e.entanglements;var l=e.eventTimes;for(e=e.expirationTimes;0<o;){var a=31-At(o),d=1<<a;r[a]=0,l[a]=-1,e[a]=-1,o&=~d}}function jl(e,r){var o=e.entangledLanes|=r;for(e=e.entanglements;o;){var l=31-At(o),a=1<<l;a&r|e[l]&r&&(e[l]|=r),o&=~a}}var Ie=0;function $d(e){return e&=-e,1<e?4<e?(e&268435455)!==0?16:536870912:4:1}var Td,Sl,zd,Pd,Ad,bl=!1,yi=[],xr=null,vr=null,wr=null,yo=new Map,xo=new Map,kr=[],Xm="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Rd(e,r){switch(e){case"focusin":case"focusout":xr=null;break;case"dragenter":case"dragleave":vr=null;break;case"mouseover":case"mouseout":wr=null;break;case"pointerover":case"pointerout":yo.delete(r.pointerId);break;case"gotpointercapture":case"lostpointercapture":xo.delete(r.pointerId)}}function vo(e,r,o,l,a,d){return e===null||e.nativeEvent!==d?(e={blockedOn:r,domEventName:o,eventSystemFlags:l,nativeEvent:d,targetContainers:[a]},r!==null&&(r=Ao(r),r!==null&&Sl(r)),e):(e.eventSystemFlags|=l,r=e.targetContainers,a!==null&&r.indexOf(a)===-1&&r.push(a),e)}function Zm(e,r,o,l,a){switch(r){case"focusin":return xr=vo(xr,e,r,o,l,a),!0;case"dragenter":return vr=vo(vr,e,r,o,l,a),!0;case"mouseover":return wr=vo(wr,e,r,o,l,a),!0;case"pointerover":var d=a.pointerId;return yo.set(d,vo(yo.get(d)||null,e,r,o,l,a)),!0;case"gotpointercapture":return d=a.pointerId,xo.set(d,vo(xo.get(d)||null,e,r,o,l,a)),!0}return!1}function Od(e){var r=Kr(e.target);if(r!==null){var o=Vr(r);if(o!==null){if(r=o.tag,r===13){if(r=wd(o),r!==null){e.blockedOn=r,Ad(e.priority,function(){zd(o)});return}}else if(r===3&&o.stateNode.current.memoizedState.isDehydrated){e.blockedOn=o.tag===3?o.stateNode.containerInfo:null;return}}}e.blockedOn=null}function xi(e){if(e.blockedOn!==null)return!1;for(var r=e.targetContainers;0<r.length;){var o=Il(e.domEventName,e.eventSystemFlags,r[0],e.nativeEvent);if(o===null){o=e.nativeEvent;var l=new o.constructor(o.type,o);pl=l,o.target.dispatchEvent(l),pl=null}else return r=Ao(o),r!==null&&Sl(r),e.blockedOn=o,!1;r.shift()}return!0}function Nd(e,r,o){xi(e)&&o.delete(r)}function eg(){bl=!1,xr!==null&&xi(xr)&&(xr=null),vr!==null&&xi(vr)&&(vr=null),wr!==null&&xi(wr)&&(wr=null),yo.forEach(Nd),xo.forEach(Nd)}function wo(e,r){e.blockedOn===r&&(e.blockedOn=null,bl||(bl=!0,i.unstable_scheduleCallback(i.unstable_NormalPriority,eg)))}function ko(e){function r(a){return wo(a,e)}if(0<yi.length){wo(yi[0],e);for(var o=1;o<yi.length;o++){var l=yi[o];l.blockedOn===e&&(l.blockedOn=null)}}for(xr!==null&&wo(xr,e),vr!==null&&wo(vr,e),wr!==null&&wo(wr,e),yo.forEach(r),xo.forEach(r),o=0;o<kr.length;o++)l=kr[o],l.blockedOn===e&&(l.blockedOn=null);for(;0<kr.length&&(o=kr[0],o.blockedOn===null);)Od(o),o.blockedOn===null&&kr.shift()}var wn=D.ReactCurrentBatchConfig,vi=!0;function tg(e,r,o,l){var a=Ie,d=wn.transition;wn.transition=null;try{Ie=1,Cl(e,r,o,l)}finally{Ie=a,wn.transition=d}}function rg(e,r,o,l){var a=Ie,d=wn.transition;wn.transition=null;try{Ie=4,Cl(e,r,o,l)}finally{Ie=a,wn.transition=d}}function Cl(e,r,o,l){if(vi){var a=Il(e,r,o,l);if(a===null)Bl(e,r,l,wi,o),Rd(e,l);else if(Zm(a,e,r,o,l))l.stopPropagation();else if(Rd(e,l),r&4&&-1<Xm.indexOf(e)){for(;a!==null;){var d=Ao(a);if(d!==null&&Td(d),d=Il(e,r,o,l),d===null&&Bl(e,r,l,wi,o),d===a)break;a=d}a!==null&&l.stopPropagation()}else Bl(e,r,l,null,o)}}var wi=null;function Il(e,r,o,l){if(wi=null,e=hl(l),e=Kr(e),e!==null)if(r=Vr(e),r===null)e=null;else if(o=r.tag,o===13){if(e=wd(r),e!==null)return e;e=null}else if(o===3){if(r.stateNode.current.memoizedState.isDehydrated)return r.tag===3?r.stateNode.containerInfo:null;e=null}else r!==e&&(e=null);return wi=e,null}function Dd(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(Bm()){case vl:return 1;case Id:return 4;case fi:case Jm:return 16;case _d:return 536870912;default:return 16}default:return 16}}var jr=null,_l=null,ki=null;function Ld(){if(ki)return ki;var e,r=_l,o=r.length,l,a="value"in jr?jr.value:jr.textContent,d=a.length;for(e=0;e<o&&r[e]===a[e];e++);var p=o-e;for(l=1;l<=p&&r[o-l]===a[d-l];l++);return ki=a.slice(e,1<l?1-l:void 0)}function ji(e){var r=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&r===13&&(e=13)):e=r,e===10&&(e=13),32<=e||e===13?e:0}function Si(){return!0}function Ud(){return!1}function wt(e){function r(o,l,a,d,p){this._reactName=o,this._targetInst=a,this.type=l,this.nativeEvent=d,this.target=p,this.currentTarget=null;for(var y in e)e.hasOwnProperty(y)&&(o=e[y],this[y]=o?o(d):d[y]);return this.isDefaultPrevented=(d.defaultPrevented!=null?d.defaultPrevented:d.returnValue===!1)?Si:Ud,this.isPropagationStopped=Ud,this}return q(r.prototype,{preventDefault:function(){this.defaultPrevented=!0;var o=this.nativeEvent;o&&(o.preventDefault?o.preventDefault():typeof o.returnValue!="unknown"&&(o.returnValue=!1),this.isDefaultPrevented=Si)},stopPropagation:function(){var o=this.nativeEvent;o&&(o.stopPropagation?o.stopPropagation():typeof o.cancelBubble!="unknown"&&(o.cancelBubble=!0),this.isPropagationStopped=Si)},persist:function(){},isPersistent:Si}),r}var kn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},El=wt(kn),jo=q({},kn,{view:0,detail:0}),ng=wt(jo),$l,Tl,So,bi=q({},jo,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Pl,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==So&&(So&&e.type==="mousemove"?($l=e.screenX-So.screenX,Tl=e.screenY-So.screenY):Tl=$l=0,So=e),$l)},movementY:function(e){return"movementY"in e?e.movementY:Tl}}),Md=wt(bi),og=q({},bi,{dataTransfer:0}),ig=wt(og),sg=q({},jo,{relatedTarget:0}),zl=wt(sg),lg=q({},kn,{animationName:0,elapsedTime:0,pseudoElement:0}),ag=wt(lg),cg=q({},kn,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),dg=wt(cg),ug=q({},kn,{data:0}),Fd=wt(ug),fg={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},pg={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},hg={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function mg(e){var r=this.nativeEvent;return r.getModifierState?r.getModifierState(e):(e=hg[e])?!!r[e]:!1}function Pl(){return mg}var gg=q({},jo,{key:function(e){if(e.key){var r=fg[e.key]||e.key;if(r!=="Unidentified")return r}return e.type==="keypress"?(e=ji(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?pg[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Pl,charCode:function(e){return e.type==="keypress"?ji(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?ji(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),yg=wt(gg),xg=q({},bi,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Wd=wt(xg),vg=q({},jo,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Pl}),wg=wt(vg),kg=q({},kn,{propertyName:0,elapsedTime:0,pseudoElement:0}),jg=wt(kg),Sg=q({},bi,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),bg=wt(Sg),Cg=[9,13,27,32],Al=v&&"CompositionEvent"in window,bo=null;v&&"documentMode"in document&&(bo=document.documentMode);var Ig=v&&"TextEvent"in window&&!bo,Bd=v&&(!Al||bo&&8<bo&&11>=bo),Jd=" ",Hd=!1;function Vd(e,r){switch(e){case"keyup":return Cg.indexOf(r.keyCode)!==-1;case"keydown":return r.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Kd(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var jn=!1;function _g(e,r){switch(e){case"compositionend":return Kd(r);case"keypress":return r.which!==32?null:(Hd=!0,Jd);case"textInput":return e=r.data,e===Jd&&Hd?null:e;default:return null}}function Eg(e,r){if(jn)return e==="compositionend"||!Al&&Vd(e,r)?(e=Ld(),ki=_l=jr=null,jn=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(r.ctrlKey||r.altKey||r.metaKey)||r.ctrlKey&&r.altKey){if(r.char&&1<r.char.length)return r.char;if(r.which)return String.fromCharCode(r.which)}return null;case"compositionend":return Bd&&r.locale!=="ko"?null:r.data;default:return null}}var $g={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Gd(e){var r=e&&e.nodeName&&e.nodeName.toLowerCase();return r==="input"?!!$g[e.type]:r==="textarea"}function qd(e,r,o,l){md(l),r=$i(r,"onChange"),0<r.length&&(o=new El("onChange","change",null,o,l),e.push({event:o,listeners:r}))}var Co=null,Io=null;function Tg(e){pu(e,0)}function Ci(e){var r=_n(e);if(Pt(r))return e}function zg(e,r){if(e==="change")return r}var Yd=!1;if(v){var Rl;if(v){var Ol="oninput"in document;if(!Ol){var Qd=document.createElement("div");Qd.setAttribute("oninput","return;"),Ol=typeof Qd.oninput=="function"}Rl=Ol}else Rl=!1;Yd=Rl&&(!document.documentMode||9<document.documentMode)}function Xd(){Co&&(Co.detachEvent("onpropertychange",Zd),Io=Co=null)}function Zd(e){if(e.propertyName==="value"&&Ci(Io)){var r=[];qd(r,Io,e,hl(e)),vd(Tg,r)}}function Pg(e,r,o){e==="focusin"?(Xd(),Co=r,Io=o,Co.attachEvent("onpropertychange",Zd)):e==="focusout"&&Xd()}function Ag(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return Ci(Io)}function Rg(e,r){if(e==="click")return Ci(r)}function Og(e,r){if(e==="input"||e==="change")return Ci(r)}function Ng(e,r){return e===r&&(e!==0||1/e===1/r)||e!==e&&r!==r}var Rt=typeof Object.is=="function"?Object.is:Ng;function _o(e,r){if(Rt(e,r))return!0;if(typeof e!="object"||e===null||typeof r!="object"||r===null)return!1;var o=Object.keys(e),l=Object.keys(r);if(o.length!==l.length)return!1;for(l=0;l<o.length;l++){var a=o[l];if(!m.call(r,a)||!Rt(e[a],r[a]))return!1}return!0}function eu(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function tu(e,r){var o=eu(e);e=0;for(var l;o;){if(o.nodeType===3){if(l=e+o.textContent.length,e<=r&&l>=r)return{node:o,offset:r-e};e=l}e:{for(;o;){if(o.nextSibling){o=o.nextSibling;break e}o=o.parentNode}o=void 0}o=eu(o)}}function ru(e,r){return e&&r?e===r?!0:e&&e.nodeType===3?!1:r&&r.nodeType===3?ru(e,r.parentNode):"contains"in e?e.contains(r):e.compareDocumentPosition?!!(e.compareDocumentPosition(r)&16):!1:!1}function nu(){for(var e=window,r=ai();r instanceof e.HTMLIFrameElement;){try{var o=typeof r.contentWindow.location.href=="string"}catch{o=!1}if(o)e=r.contentWindow;else break;r=ai(e.document)}return r}function Nl(e){var r=e&&e.nodeName&&e.nodeName.toLowerCase();return r&&(r==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||r==="textarea"||e.contentEditable==="true")}function Dg(e){var r=nu(),o=e.focusedElem,l=e.selectionRange;if(r!==o&&o&&o.ownerDocument&&ru(o.ownerDocument.documentElement,o)){if(l!==null&&Nl(o)){if(r=l.start,e=l.end,e===void 0&&(e=r),"selectionStart"in o)o.selectionStart=r,o.selectionEnd=Math.min(e,o.value.length);else if(e=(r=o.ownerDocument||document)&&r.defaultView||window,e.getSelection){e=e.getSelection();var a=o.textContent.length,d=Math.min(l.start,a);l=l.end===void 0?d:Math.min(l.end,a),!e.extend&&d>l&&(a=l,l=d,d=a),a=tu(o,d);var p=tu(o,l);a&&p&&(e.rangeCount!==1||e.anchorNode!==a.node||e.anchorOffset!==a.offset||e.focusNode!==p.node||e.focusOffset!==p.offset)&&(r=r.createRange(),r.setStart(a.node,a.offset),e.removeAllRanges(),d>l?(e.addRange(r),e.extend(p.node,p.offset)):(r.setEnd(p.node,p.offset),e.addRange(r)))}}for(r=[],e=o;e=e.parentNode;)e.nodeType===1&&r.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof o.focus=="function"&&o.focus(),o=0;o<r.length;o++)e=r[o],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var Lg=v&&"documentMode"in document&&11>=document.documentMode,Sn=null,Dl=null,Eo=null,Ll=!1;function ou(e,r,o){var l=o.window===o?o.document:o.nodeType===9?o:o.ownerDocument;Ll||Sn==null||Sn!==ai(l)||(l=Sn,"selectionStart"in l&&Nl(l)?l={start:l.selectionStart,end:l.selectionEnd}:(l=(l.ownerDocument&&l.ownerDocument.defaultView||window).getSelection(),l={anchorNode:l.anchorNode,anchorOffset:l.anchorOffset,focusNode:l.focusNode,focusOffset:l.focusOffset}),Eo&&_o(Eo,l)||(Eo=l,l=$i(Dl,"onSelect"),0<l.length&&(r=new El("onSelect","select",null,r,o),e.push({event:r,listeners:l}),r.target=Sn)))}function Ii(e,r){var o={};return o[e.toLowerCase()]=r.toLowerCase(),o["Webkit"+e]="webkit"+r,o["Moz"+e]="moz"+r,o}var bn={animationend:Ii("Animation","AnimationEnd"),animationiteration:Ii("Animation","AnimationIteration"),animationstart:Ii("Animation","AnimationStart"),transitionend:Ii("Transition","TransitionEnd")},Ul={},iu={};v&&(iu=document.createElement("div").style,"AnimationEvent"in window||(delete bn.animationend.animation,delete bn.animationiteration.animation,delete bn.animationstart.animation),"TransitionEvent"in window||delete bn.transitionend.transition);function _i(e){if(Ul[e])return Ul[e];if(!bn[e])return e;var r=bn[e],o;for(o in r)if(r.hasOwnProperty(o)&&o in iu)return Ul[e]=r[o];return e}var su=_i("animationend"),lu=_i("animationiteration"),au=_i("animationstart"),cu=_i("transitionend"),du=new Map,uu="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function Sr(e,r){du.set(e,r),h(r,[e])}for(var Ml=0;Ml<uu.length;Ml++){var Fl=uu[Ml],Ug=Fl.toLowerCase(),Mg=Fl[0].toUpperCase()+Fl.slice(1);Sr(Ug,"on"+Mg)}Sr(su,"onAnimationEnd"),Sr(lu,"onAnimationIteration"),Sr(au,"onAnimationStart"),Sr("dblclick","onDoubleClick"),Sr("focusin","onFocus"),Sr("focusout","onBlur"),Sr(cu,"onTransitionEnd"),f("onMouseEnter",["mouseout","mouseover"]),f("onMouseLeave",["mouseout","mouseover"]),f("onPointerEnter",["pointerout","pointerover"]),f("onPointerLeave",["pointerout","pointerover"]),h("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),h("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),h("onBeforeInput",["compositionend","keypress","textInput","paste"]),h("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),h("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),h("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var $o="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Fg=new Set("cancel close invalid load scroll toggle".split(" ").concat($o));function fu(e,r,o){var l=e.type||"unknown-event";e.currentTarget=o,Um(l,r,void 0,e),e.currentTarget=null}function pu(e,r){r=(r&4)!==0;for(var o=0;o<e.length;o++){var l=e[o],a=l.event;l=l.listeners;e:{var d=void 0;if(r)for(var p=l.length-1;0<=p;p--){var y=l[p],j=y.instance,P=y.currentTarget;if(y=y.listener,j!==d&&a.isPropagationStopped())break e;fu(a,y,P),d=j}else for(p=0;p<l.length;p++){if(y=l[p],j=y.instance,P=y.currentTarget,y=y.listener,j!==d&&a.isPropagationStopped())break e;fu(a,y,P),d=j}}}if(ui)throw e=xl,ui=!1,xl=null,e}function Te(e,r){var o=r[ql];o===void 0&&(o=r[ql]=new Set);var l=e+"__bubble";o.has(l)||(hu(r,e,2,!1),o.add(l))}function Wl(e,r,o){var l=0;r&&(l|=4),hu(o,e,l,r)}var Ei="_reactListening"+Math.random().toString(36).slice(2);function To(e){if(!e[Ei]){e[Ei]=!0,c.forEach(function(o){o!=="selectionchange"&&(Fg.has(o)||Wl(o,!1,e),Wl(o,!0,e))});var r=e.nodeType===9?e:e.ownerDocument;r===null||r[Ei]||(r[Ei]=!0,Wl("selectionchange",!1,r))}}function hu(e,r,o,l){switch(Dd(r)){case 1:var a=tg;break;case 4:a=rg;break;default:a=Cl}o=a.bind(null,r,o,e),a=void 0,!yl||r!=="touchstart"&&r!=="touchmove"&&r!=="wheel"||(a=!0),l?a!==void 0?e.addEventListener(r,o,{capture:!0,passive:a}):e.addEventListener(r,o,!0):a!==void 0?e.addEventListener(r,o,{passive:a}):e.addEventListener(r,o,!1)}function Bl(e,r,o,l,a){var d=l;if((r&1)===0&&(r&2)===0&&l!==null)e:for(;;){if(l===null)return;var p=l.tag;if(p===3||p===4){var y=l.stateNode.containerInfo;if(y===a||y.nodeType===8&&y.parentNode===a)break;if(p===4)for(p=l.return;p!==null;){var j=p.tag;if((j===3||j===4)&&(j=p.stateNode.containerInfo,j===a||j.nodeType===8&&j.parentNode===a))return;p=p.return}for(;y!==null;){if(p=Kr(y),p===null)return;if(j=p.tag,j===5||j===6){l=d=p;continue e}y=y.parentNode}}l=l.return}vd(function(){var P=d,J=hl(o),H=[];e:{var W=du.get(e);if(W!==void 0){var Q=El,te=e;switch(e){case"keypress":if(ji(o)===0)break e;case"keydown":case"keyup":Q=yg;break;case"focusin":te="focus",Q=zl;break;case"focusout":te="blur",Q=zl;break;case"beforeblur":case"afterblur":Q=zl;break;case"click":if(o.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":Q=Md;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":Q=ig;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":Q=wg;break;case su:case lu:case au:Q=ag;break;case cu:Q=jg;break;case"scroll":Q=ng;break;case"wheel":Q=bg;break;case"copy":case"cut":case"paste":Q=dg;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":Q=Wd}var re=(r&4)!==0,Fe=!re&&e==="scroll",$=re?W!==null?W+"Capture":null:W;re=[];for(var I=P,T;I!==null;){T=I;var V=T.stateNode;if(T.tag===5&&V!==null&&(T=V,$!==null&&(V=fo(I,$),V!=null&&re.push(zo(I,V,T)))),Fe)break;I=I.return}0<re.length&&(W=new Q(W,te,null,o,J),H.push({event:W,listeners:re}))}}if((r&7)===0){e:{if(W=e==="mouseover"||e==="pointerover",Q=e==="mouseout"||e==="pointerout",W&&o!==pl&&(te=o.relatedTarget||o.fromElement)&&(Kr(te)||te[tr]))break e;if((Q||W)&&(W=J.window===J?J:(W=J.ownerDocument)?W.defaultView||W.parentWindow:window,Q?(te=o.relatedTarget||o.toElement,Q=P,te=te?Kr(te):null,te!==null&&(Fe=Vr(te),te!==Fe||te.tag!==5&&te.tag!==6)&&(te=null)):(Q=null,te=P),Q!==te)){if(re=Md,V="onMouseLeave",$="onMouseEnter",I="mouse",(e==="pointerout"||e==="pointerover")&&(re=Wd,V="onPointerLeave",$="onPointerEnter",I="pointer"),Fe=Q==null?W:_n(Q),T=te==null?W:_n(te),W=new re(V,I+"leave",Q,o,J),W.target=Fe,W.relatedTarget=T,V=null,Kr(J)===P&&(re=new re($,I+"enter",te,o,J),re.target=T,re.relatedTarget=Fe,V=re),Fe=V,Q&&te)t:{for(re=Q,$=te,I=0,T=re;T;T=Cn(T))I++;for(T=0,V=$;V;V=Cn(V))T++;for(;0<I-T;)re=Cn(re),I--;for(;0<T-I;)$=Cn($),T--;for(;I--;){if(re===$||$!==null&&re===$.alternate)break t;re=Cn(re),$=Cn($)}re=null}else re=null;Q!==null&&mu(H,W,Q,re,!1),te!==null&&Fe!==null&&mu(H,Fe,te,re,!0)}}e:{if(W=P?_n(P):window,Q=W.nodeName&&W.nodeName.toLowerCase(),Q==="select"||Q==="input"&&W.type==="file")var ne=zg;else if(Gd(W))if(Yd)ne=Og;else{ne=Ag;var ie=Pg}else(Q=W.nodeName)&&Q.toLowerCase()==="input"&&(W.type==="checkbox"||W.type==="radio")&&(ne=Rg);if(ne&&(ne=ne(e,P))){qd(H,ne,o,J);break e}ie&&ie(e,W,P),e==="focusout"&&(ie=W._wrapperState)&&ie.controlled&&W.type==="number"&&al(W,"number",W.value)}switch(ie=P?_n(P):window,e){case"focusin":(Gd(ie)||ie.contentEditable==="true")&&(Sn=ie,Dl=P,Eo=null);break;case"focusout":Eo=Dl=Sn=null;break;case"mousedown":Ll=!0;break;case"contextmenu":case"mouseup":case"dragend":Ll=!1,ou(H,o,J);break;case"selectionchange":if(Lg)break;case"keydown":case"keyup":ou(H,o,J)}var se;if(Al)e:{switch(e){case"compositionstart":var ae="onCompositionStart";break e;case"compositionend":ae="onCompositionEnd";break e;case"compositionupdate":ae="onCompositionUpdate";break e}ae=void 0}else jn?Vd(e,o)&&(ae="onCompositionEnd"):e==="keydown"&&o.keyCode===229&&(ae="onCompositionStart");ae&&(Bd&&o.locale!=="ko"&&(jn||ae!=="onCompositionStart"?ae==="onCompositionEnd"&&jn&&(se=Ld()):(jr=J,_l="value"in jr?jr.value:jr.textContent,jn=!0)),ie=$i(P,ae),0<ie.length&&(ae=new Fd(ae,e,null,o,J),H.push({event:ae,listeners:ie}),se?ae.data=se:(se=Kd(o),se!==null&&(ae.data=se)))),(se=Ig?_g(e,o):Eg(e,o))&&(P=$i(P,"onBeforeInput"),0<P.length&&(J=new Fd("onBeforeInput","beforeinput",null,o,J),H.push({event:J,listeners:P}),J.data=se))}pu(H,r)})}function zo(e,r,o){return{instance:e,listener:r,currentTarget:o}}function $i(e,r){for(var o=r+"Capture",l=[];e!==null;){var a=e,d=a.stateNode;a.tag===5&&d!==null&&(a=d,d=fo(e,o),d!=null&&l.unshift(zo(e,d,a)),d=fo(e,r),d!=null&&l.push(zo(e,d,a))),e=e.return}return l}function Cn(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function mu(e,r,o,l,a){for(var d=r._reactName,p=[];o!==null&&o!==l;){var y=o,j=y.alternate,P=y.stateNode;if(j!==null&&j===l)break;y.tag===5&&P!==null&&(y=P,a?(j=fo(o,d),j!=null&&p.unshift(zo(o,j,y))):a||(j=fo(o,d),j!=null&&p.push(zo(o,j,y)))),o=o.return}p.length!==0&&e.push({event:r,listeners:p})}var Wg=/\r\n?/g,Bg=/\u0000|\uFFFD/g;function gu(e){return(typeof e=="string"?e:""+e).replace(Wg,`
`).replace(Bg,"")}function Ti(e,r,o){if(r=gu(r),gu(e)!==r&&o)throw Error(s(425))}function zi(){}var Jl=null,Hl=null;function Vl(e,r){return e==="textarea"||e==="noscript"||typeof r.children=="string"||typeof r.children=="number"||typeof r.dangerouslySetInnerHTML=="object"&&r.dangerouslySetInnerHTML!==null&&r.dangerouslySetInnerHTML.__html!=null}var Kl=typeof setTimeout=="function"?setTimeout:void 0,Jg=typeof clearTimeout=="function"?clearTimeout:void 0,yu=typeof Promise=="function"?Promise:void 0,Hg=typeof queueMicrotask=="function"?queueMicrotask:typeof yu<"u"?function(e){return yu.resolve(null).then(e).catch(Vg)}:Kl;function Vg(e){setTimeout(function(){throw e})}function Gl(e,r){var o=r,l=0;do{var a=o.nextSibling;if(e.removeChild(o),a&&a.nodeType===8)if(o=a.data,o==="/$"){if(l===0){e.removeChild(a),ko(r);return}l--}else o!=="$"&&o!=="$?"&&o!=="$!"||l++;o=a}while(o);ko(r)}function br(e){for(;e!=null;e=e.nextSibling){var r=e.nodeType;if(r===1||r===3)break;if(r===8){if(r=e.data,r==="$"||r==="$!"||r==="$?")break;if(r==="/$")return null}}return e}function xu(e){e=e.previousSibling;for(var r=0;e;){if(e.nodeType===8){var o=e.data;if(o==="$"||o==="$!"||o==="$?"){if(r===0)return e;r--}else o==="/$"&&r++}e=e.previousSibling}return null}var In=Math.random().toString(36).slice(2),Vt="__reactFiber$"+In,Po="__reactProps$"+In,tr="__reactContainer$"+In,ql="__reactEvents$"+In,Kg="__reactListeners$"+In,Gg="__reactHandles$"+In;function Kr(e){var r=e[Vt];if(r)return r;for(var o=e.parentNode;o;){if(r=o[tr]||o[Vt]){if(o=r.alternate,r.child!==null||o!==null&&o.child!==null)for(e=xu(e);e!==null;){if(o=e[Vt])return o;e=xu(e)}return r}e=o,o=e.parentNode}return null}function Ao(e){return e=e[Vt]||e[tr],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function _n(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(s(33))}function Pi(e){return e[Po]||null}var Yl=[],En=-1;function Cr(e){return{current:e}}function ze(e){0>En||(e.current=Yl[En],Yl[En]=null,En--)}function Ee(e,r){En++,Yl[En]=e.current,e.current=r}var Ir={},it=Cr(Ir),ft=Cr(!1),Gr=Ir;function $n(e,r){var o=e.type.contextTypes;if(!o)return Ir;var l=e.stateNode;if(l&&l.__reactInternalMemoizedUnmaskedChildContext===r)return l.__reactInternalMemoizedMaskedChildContext;var a={},d;for(d in o)a[d]=r[d];return l&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=r,e.__reactInternalMemoizedMaskedChildContext=a),a}function pt(e){return e=e.childContextTypes,e!=null}function Ai(){ze(ft),ze(it)}function vu(e,r,o){if(it.current!==Ir)throw Error(s(168));Ee(it,r),Ee(ft,o)}function wu(e,r,o){var l=e.stateNode;if(r=r.childContextTypes,typeof l.getChildContext!="function")return o;l=l.getChildContext();for(var a in l)if(!(a in r))throw Error(s(108,Se(e)||"Unknown",a));return q({},o,l)}function Ri(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||Ir,Gr=it.current,Ee(it,e),Ee(ft,ft.current),!0}function ku(e,r,o){var l=e.stateNode;if(!l)throw Error(s(169));o?(e=wu(e,r,Gr),l.__reactInternalMemoizedMergedChildContext=e,ze(ft),ze(it),Ee(it,e)):ze(ft),Ee(ft,o)}var rr=null,Oi=!1,Ql=!1;function ju(e){rr===null?rr=[e]:rr.push(e)}function qg(e){Oi=!0,ju(e)}function _r(){if(!Ql&&rr!==null){Ql=!0;var e=0,r=Ie;try{var o=rr;for(Ie=1;e<o.length;e++){var l=o[e];do l=l(!0);while(l!==null)}rr=null,Oi=!1}catch(a){throw rr!==null&&(rr=rr.slice(e+1)),bd(vl,_r),a}finally{Ie=r,Ql=!1}}return null}var Tn=[],zn=0,Ni=null,Di=0,Ct=[],It=0,qr=null,nr=1,or="";function Yr(e,r){Tn[zn++]=Di,Tn[zn++]=Ni,Ni=e,Di=r}function Su(e,r,o){Ct[It++]=nr,Ct[It++]=or,Ct[It++]=qr,qr=e;var l=nr;e=or;var a=32-At(l)-1;l&=~(1<<a),o+=1;var d=32-At(r)+a;if(30<d){var p=a-a%5;d=(l&(1<<p)-1).toString(32),l>>=p,a-=p,nr=1<<32-At(r)+a|o<<a|l,or=d+e}else nr=1<<d|o<<a|l,or=e}function Xl(e){e.return!==null&&(Yr(e,1),Su(e,1,0))}function Zl(e){for(;e===Ni;)Ni=Tn[--zn],Tn[zn]=null,Di=Tn[--zn],Tn[zn]=null;for(;e===qr;)qr=Ct[--It],Ct[It]=null,or=Ct[--It],Ct[It]=null,nr=Ct[--It],Ct[It]=null}var kt=null,jt=null,Oe=!1,Ot=null;function bu(e,r){var o=Tt(5,null,null,0);o.elementType="DELETED",o.stateNode=r,o.return=e,r=e.deletions,r===null?(e.deletions=[o],e.flags|=16):r.push(o)}function Cu(e,r){switch(e.tag){case 5:var o=e.type;return r=r.nodeType!==1||o.toLowerCase()!==r.nodeName.toLowerCase()?null:r,r!==null?(e.stateNode=r,kt=e,jt=br(r.firstChild),!0):!1;case 6:return r=e.pendingProps===""||r.nodeType!==3?null:r,r!==null?(e.stateNode=r,kt=e,jt=null,!0):!1;case 13:return r=r.nodeType!==8?null:r,r!==null?(o=qr!==null?{id:nr,overflow:or}:null,e.memoizedState={dehydrated:r,treeContext:o,retryLane:1073741824},o=Tt(18,null,null,0),o.stateNode=r,o.return=e,e.child=o,kt=e,jt=null,!0):!1;default:return!1}}function ea(e){return(e.mode&1)!==0&&(e.flags&128)===0}function ta(e){if(Oe){var r=jt;if(r){var o=r;if(!Cu(e,r)){if(ea(e))throw Error(s(418));r=br(o.nextSibling);var l=kt;r&&Cu(e,r)?bu(l,o):(e.flags=e.flags&-4097|2,Oe=!1,kt=e)}}else{if(ea(e))throw Error(s(418));e.flags=e.flags&-4097|2,Oe=!1,kt=e}}}function Iu(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;kt=e}function Li(e){if(e!==kt)return!1;if(!Oe)return Iu(e),Oe=!0,!1;var r;if((r=e.tag!==3)&&!(r=e.tag!==5)&&(r=e.type,r=r!=="head"&&r!=="body"&&!Vl(e.type,e.memoizedProps)),r&&(r=jt)){if(ea(e))throw _u(),Error(s(418));for(;r;)bu(e,r),r=br(r.nextSibling)}if(Iu(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(s(317));e:{for(e=e.nextSibling,r=0;e;){if(e.nodeType===8){var o=e.data;if(o==="/$"){if(r===0){jt=br(e.nextSibling);break e}r--}else o!=="$"&&o!=="$!"&&o!=="$?"||r++}e=e.nextSibling}jt=null}}else jt=kt?br(e.stateNode.nextSibling):null;return!0}function _u(){for(var e=jt;e;)e=br(e.nextSibling)}function Pn(){jt=kt=null,Oe=!1}function ra(e){Ot===null?Ot=[e]:Ot.push(e)}var Yg=D.ReactCurrentBatchConfig;function Ro(e,r,o){if(e=o.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(o._owner){if(o=o._owner,o){if(o.tag!==1)throw Error(s(309));var l=o.stateNode}if(!l)throw Error(s(147,e));var a=l,d=""+e;return r!==null&&r.ref!==null&&typeof r.ref=="function"&&r.ref._stringRef===d?r.ref:(r=function(p){var y=a.refs;p===null?delete y[d]:y[d]=p},r._stringRef=d,r)}if(typeof e!="string")throw Error(s(284));if(!o._owner)throw Error(s(290,e))}return e}function Ui(e,r){throw e=Object.prototype.toString.call(r),Error(s(31,e==="[object Object]"?"object with keys {"+Object.keys(r).join(", ")+"}":e))}function Eu(e){var r=e._init;return r(e._payload)}function $u(e){function r($,I){if(e){var T=$.deletions;T===null?($.deletions=[I],$.flags|=16):T.push(I)}}function o($,I){if(!e)return null;for(;I!==null;)r($,I),I=I.sibling;return null}function l($,I){for($=new Map;I!==null;)I.key!==null?$.set(I.key,I):$.set(I.index,I),I=I.sibling;return $}function a($,I){return $=Or($,I),$.index=0,$.sibling=null,$}function d($,I,T){return $.index=T,e?(T=$.alternate,T!==null?(T=T.index,T<I?($.flags|=2,I):T):($.flags|=2,I)):($.flags|=1048576,I)}function p($){return e&&$.alternate===null&&($.flags|=2),$}function y($,I,T,V){return I===null||I.tag!==6?(I=Ka(T,$.mode,V),I.return=$,I):(I=a(I,T),I.return=$,I)}function j($,I,T,V){var ne=T.type;return ne===N?J($,I,T.props.children,V,T.key):I!==null&&(I.elementType===ne||typeof ne=="object"&&ne!==null&&ne.$$typeof===xe&&Eu(ne)===I.type)?(V=a(I,T.props),V.ref=Ro($,I,T),V.return=$,V):(V=cs(T.type,T.key,T.props,null,$.mode,V),V.ref=Ro($,I,T),V.return=$,V)}function P($,I,T,V){return I===null||I.tag!==4||I.stateNode.containerInfo!==T.containerInfo||I.stateNode.implementation!==T.implementation?(I=Ga(T,$.mode,V),I.return=$,I):(I=a(I,T.children||[]),I.return=$,I)}function J($,I,T,V,ne){return I===null||I.tag!==7?(I=on(T,$.mode,V,ne),I.return=$,I):(I=a(I,T),I.return=$,I)}function H($,I,T){if(typeof I=="string"&&I!==""||typeof I=="number")return I=Ka(""+I,$.mode,T),I.return=$,I;if(typeof I=="object"&&I!==null){switch(I.$$typeof){case A:return T=cs(I.type,I.key,I.props,null,$.mode,T),T.ref=Ro($,null,I),T.return=$,T;case F:return I=Ga(I,$.mode,T),I.return=$,I;case xe:var V=I._init;return H($,V(I._payload),T)}if(ao(I)||X(I))return I=on(I,$.mode,T,null),I.return=$,I;Ui($,I)}return null}function W($,I,T,V){var ne=I!==null?I.key:null;if(typeof T=="string"&&T!==""||typeof T=="number")return ne!==null?null:y($,I,""+T,V);if(typeof T=="object"&&T!==null){switch(T.$$typeof){case A:return T.key===ne?j($,I,T,V):null;case F:return T.key===ne?P($,I,T,V):null;case xe:return ne=T._init,W($,I,ne(T._payload),V)}if(ao(T)||X(T))return ne!==null?null:J($,I,T,V,null);Ui($,T)}return null}function Q($,I,T,V,ne){if(typeof V=="string"&&V!==""||typeof V=="number")return $=$.get(T)||null,y(I,$,""+V,ne);if(typeof V=="object"&&V!==null){switch(V.$$typeof){case A:return $=$.get(V.key===null?T:V.key)||null,j(I,$,V,ne);case F:return $=$.get(V.key===null?T:V.key)||null,P(I,$,V,ne);case xe:var ie=V._init;return Q($,I,T,ie(V._payload),ne)}if(ao(V)||X(V))return $=$.get(T)||null,J(I,$,V,ne,null);Ui(I,V)}return null}function te($,I,T,V){for(var ne=null,ie=null,se=I,ae=I=0,Ye=null;se!==null&&ae<T.length;ae++){se.index>ae?(Ye=se,se=null):Ye=se.sibling;var je=W($,se,T[ae],V);if(je===null){se===null&&(se=Ye);break}e&&se&&je.alternate===null&&r($,se),I=d(je,I,ae),ie===null?ne=je:ie.sibling=je,ie=je,se=Ye}if(ae===T.length)return o($,se),Oe&&Yr($,ae),ne;if(se===null){for(;ae<T.length;ae++)se=H($,T[ae],V),se!==null&&(I=d(se,I,ae),ie===null?ne=se:ie.sibling=se,ie=se);return Oe&&Yr($,ae),ne}for(se=l($,se);ae<T.length;ae++)Ye=Q(se,$,ae,T[ae],V),Ye!==null&&(e&&Ye.alternate!==null&&se.delete(Ye.key===null?ae:Ye.key),I=d(Ye,I,ae),ie===null?ne=Ye:ie.sibling=Ye,ie=Ye);return e&&se.forEach(function(Nr){return r($,Nr)}),Oe&&Yr($,ae),ne}function re($,I,T,V){var ne=X(T);if(typeof ne!="function")throw Error(s(150));if(T=ne.call(T),T==null)throw Error(s(151));for(var ie=ne=null,se=I,ae=I=0,Ye=null,je=T.next();se!==null&&!je.done;ae++,je=T.next()){se.index>ae?(Ye=se,se=null):Ye=se.sibling;var Nr=W($,se,je.value,V);if(Nr===null){se===null&&(se=Ye);break}e&&se&&Nr.alternate===null&&r($,se),I=d(Nr,I,ae),ie===null?ne=Nr:ie.sibling=Nr,ie=Nr,se=Ye}if(je.done)return o($,se),Oe&&Yr($,ae),ne;if(se===null){for(;!je.done;ae++,je=T.next())je=H($,je.value,V),je!==null&&(I=d(je,I,ae),ie===null?ne=je:ie.sibling=je,ie=je);return Oe&&Yr($,ae),ne}for(se=l($,se);!je.done;ae++,je=T.next())je=Q(se,$,ae,je.value,V),je!==null&&(e&&je.alternate!==null&&se.delete(je.key===null?ae:je.key),I=d(je,I,ae),ie===null?ne=je:ie.sibling=je,ie=je);return e&&se.forEach(function($0){return r($,$0)}),Oe&&Yr($,ae),ne}function Fe($,I,T,V){if(typeof T=="object"&&T!==null&&T.type===N&&T.key===null&&(T=T.props.children),typeof T=="object"&&T!==null){switch(T.$$typeof){case A:e:{for(var ne=T.key,ie=I;ie!==null;){if(ie.key===ne){if(ne=T.type,ne===N){if(ie.tag===7){o($,ie.sibling),I=a(ie,T.props.children),I.return=$,$=I;break e}}else if(ie.elementType===ne||typeof ne=="object"&&ne!==null&&ne.$$typeof===xe&&Eu(ne)===ie.type){o($,ie.sibling),I=a(ie,T.props),I.ref=Ro($,ie,T),I.return=$,$=I;break e}o($,ie);break}else r($,ie);ie=ie.sibling}T.type===N?(I=on(T.props.children,$.mode,V,T.key),I.return=$,$=I):(V=cs(T.type,T.key,T.props,null,$.mode,V),V.ref=Ro($,I,T),V.return=$,$=V)}return p($);case F:e:{for(ie=T.key;I!==null;){if(I.key===ie)if(I.tag===4&&I.stateNode.containerInfo===T.containerInfo&&I.stateNode.implementation===T.implementation){o($,I.sibling),I=a(I,T.children||[]),I.return=$,$=I;break e}else{o($,I);break}else r($,I);I=I.sibling}I=Ga(T,$.mode,V),I.return=$,$=I}return p($);case xe:return ie=T._init,Fe($,I,ie(T._payload),V)}if(ao(T))return te($,I,T,V);if(X(T))return re($,I,T,V);Ui($,T)}return typeof T=="string"&&T!==""||typeof T=="number"?(T=""+T,I!==null&&I.tag===6?(o($,I.sibling),I=a(I,T),I.return=$,$=I):(o($,I),I=Ka(T,$.mode,V),I.return=$,$=I),p($)):o($,I)}return Fe}var An=$u(!0),Tu=$u(!1),Mi=Cr(null),Fi=null,Rn=null,na=null;function oa(){na=Rn=Fi=null}function ia(e){var r=Mi.current;ze(Mi),e._currentValue=r}function sa(e,r,o){for(;e!==null;){var l=e.alternate;if((e.childLanes&r)!==r?(e.childLanes|=r,l!==null&&(l.childLanes|=r)):l!==null&&(l.childLanes&r)!==r&&(l.childLanes|=r),e===o)break;e=e.return}}function On(e,r){Fi=e,na=Rn=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&r)!==0&&(ht=!0),e.firstContext=null)}function _t(e){var r=e._currentValue;if(na!==e)if(e={context:e,memoizedValue:r,next:null},Rn===null){if(Fi===null)throw Error(s(308));Rn=e,Fi.dependencies={lanes:0,firstContext:e}}else Rn=Rn.next=e;return r}var Qr=null;function la(e){Qr===null?Qr=[e]:Qr.push(e)}function zu(e,r,o,l){var a=r.interleaved;return a===null?(o.next=o,la(r)):(o.next=a.next,a.next=o),r.interleaved=o,ir(e,l)}function ir(e,r){e.lanes|=r;var o=e.alternate;for(o!==null&&(o.lanes|=r),o=e,e=e.return;e!==null;)e.childLanes|=r,o=e.alternate,o!==null&&(o.childLanes|=r),o=e,e=e.return;return o.tag===3?o.stateNode:null}var Er=!1;function aa(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Pu(e,r){e=e.updateQueue,r.updateQueue===e&&(r.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function sr(e,r){return{eventTime:e,lane:r,tag:0,payload:null,callback:null,next:null}}function $r(e,r,o){var l=e.updateQueue;if(l===null)return null;if(l=l.shared,(we&2)!==0){var a=l.pending;return a===null?r.next=r:(r.next=a.next,a.next=r),l.pending=r,ir(e,o)}return a=l.interleaved,a===null?(r.next=r,la(l)):(r.next=a.next,a.next=r),l.interleaved=r,ir(e,o)}function Wi(e,r,o){if(r=r.updateQueue,r!==null&&(r=r.shared,(o&4194240)!==0)){var l=r.lanes;l&=e.pendingLanes,o|=l,r.lanes=o,jl(e,o)}}function Au(e,r){var o=e.updateQueue,l=e.alternate;if(l!==null&&(l=l.updateQueue,o===l)){var a=null,d=null;if(o=o.firstBaseUpdate,o!==null){do{var p={eventTime:o.eventTime,lane:o.lane,tag:o.tag,payload:o.payload,callback:o.callback,next:null};d===null?a=d=p:d=d.next=p,o=o.next}while(o!==null);d===null?a=d=r:d=d.next=r}else a=d=r;o={baseState:l.baseState,firstBaseUpdate:a,lastBaseUpdate:d,shared:l.shared,effects:l.effects},e.updateQueue=o;return}e=o.lastBaseUpdate,e===null?o.firstBaseUpdate=r:e.next=r,o.lastBaseUpdate=r}function Bi(e,r,o,l){var a=e.updateQueue;Er=!1;var d=a.firstBaseUpdate,p=a.lastBaseUpdate,y=a.shared.pending;if(y!==null){a.shared.pending=null;var j=y,P=j.next;j.next=null,p===null?d=P:p.next=P,p=j;var J=e.alternate;J!==null&&(J=J.updateQueue,y=J.lastBaseUpdate,y!==p&&(y===null?J.firstBaseUpdate=P:y.next=P,J.lastBaseUpdate=j))}if(d!==null){var H=a.baseState;p=0,J=P=j=null,y=d;do{var W=y.lane,Q=y.eventTime;if((l&W)===W){J!==null&&(J=J.next={eventTime:Q,lane:0,tag:y.tag,payload:y.payload,callback:y.callback,next:null});e:{var te=e,re=y;switch(W=r,Q=o,re.tag){case 1:if(te=re.payload,typeof te=="function"){H=te.call(Q,H,W);break e}H=te;break e;case 3:te.flags=te.flags&-65537|128;case 0:if(te=re.payload,W=typeof te=="function"?te.call(Q,H,W):te,W==null)break e;H=q({},H,W);break e;case 2:Er=!0}}y.callback!==null&&y.lane!==0&&(e.flags|=64,W=a.effects,W===null?a.effects=[y]:W.push(y))}else Q={eventTime:Q,lane:W,tag:y.tag,payload:y.payload,callback:y.callback,next:null},J===null?(P=J=Q,j=H):J=J.next=Q,p|=W;if(y=y.next,y===null){if(y=a.shared.pending,y===null)break;W=y,y=W.next,W.next=null,a.lastBaseUpdate=W,a.shared.pending=null}}while(!0);if(J===null&&(j=H),a.baseState=j,a.firstBaseUpdate=P,a.lastBaseUpdate=J,r=a.shared.interleaved,r!==null){a=r;do p|=a.lane,a=a.next;while(a!==r)}else d===null&&(a.shared.lanes=0);en|=p,e.lanes=p,e.memoizedState=H}}function Ru(e,r,o){if(e=r.effects,r.effects=null,e!==null)for(r=0;r<e.length;r++){var l=e[r],a=l.callback;if(a!==null){if(l.callback=null,l=o,typeof a!="function")throw Error(s(191,a));a.call(l)}}}var Oo={},Kt=Cr(Oo),No=Cr(Oo),Do=Cr(Oo);function Xr(e){if(e===Oo)throw Error(s(174));return e}function ca(e,r){switch(Ee(Do,r),Ee(No,e),Ee(Kt,Oo),e=r.nodeType,e){case 9:case 11:r=(r=r.documentElement)?r.namespaceURI:dl(null,"");break;default:e=e===8?r.parentNode:r,r=e.namespaceURI||null,e=e.tagName,r=dl(r,e)}ze(Kt),Ee(Kt,r)}function Nn(){ze(Kt),ze(No),ze(Do)}function Ou(e){Xr(Do.current);var r=Xr(Kt.current),o=dl(r,e.type);r!==o&&(Ee(No,e),Ee(Kt,o))}function da(e){No.current===e&&(ze(Kt),ze(No))}var Ne=Cr(0);function Ji(e){for(var r=e;r!==null;){if(r.tag===13){var o=r.memoizedState;if(o!==null&&(o=o.dehydrated,o===null||o.data==="$?"||o.data==="$!"))return r}else if(r.tag===19&&r.memoizedProps.revealOrder!==void 0){if((r.flags&128)!==0)return r}else if(r.child!==null){r.child.return=r,r=r.child;continue}if(r===e)break;for(;r.sibling===null;){if(r.return===null||r.return===e)return null;r=r.return}r.sibling.return=r.return,r=r.sibling}return null}var ua=[];function fa(){for(var e=0;e<ua.length;e++)ua[e]._workInProgressVersionPrimary=null;ua.length=0}var Hi=D.ReactCurrentDispatcher,pa=D.ReactCurrentBatchConfig,Zr=0,De=null,Ve=null,Ge=null,Vi=!1,Lo=!1,Uo=0,Qg=0;function st(){throw Error(s(321))}function ha(e,r){if(r===null)return!1;for(var o=0;o<r.length&&o<e.length;o++)if(!Rt(e[o],r[o]))return!1;return!0}function ma(e,r,o,l,a,d){if(Zr=d,De=r,r.memoizedState=null,r.updateQueue=null,r.lanes=0,Hi.current=e===null||e.memoizedState===null?t0:r0,e=o(l,a),Lo){d=0;do{if(Lo=!1,Uo=0,25<=d)throw Error(s(301));d+=1,Ge=Ve=null,r.updateQueue=null,Hi.current=n0,e=o(l,a)}while(Lo)}if(Hi.current=qi,r=Ve!==null&&Ve.next!==null,Zr=0,Ge=Ve=De=null,Vi=!1,r)throw Error(s(300));return e}function ga(){var e=Uo!==0;return Uo=0,e}function Gt(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Ge===null?De.memoizedState=Ge=e:Ge=Ge.next=e,Ge}function Et(){if(Ve===null){var e=De.alternate;e=e!==null?e.memoizedState:null}else e=Ve.next;var r=Ge===null?De.memoizedState:Ge.next;if(r!==null)Ge=r,Ve=e;else{if(e===null)throw Error(s(310));Ve=e,e={memoizedState:Ve.memoizedState,baseState:Ve.baseState,baseQueue:Ve.baseQueue,queue:Ve.queue,next:null},Ge===null?De.memoizedState=Ge=e:Ge=Ge.next=e}return Ge}function Mo(e,r){return typeof r=="function"?r(e):r}function ya(e){var r=Et(),o=r.queue;if(o===null)throw Error(s(311));o.lastRenderedReducer=e;var l=Ve,a=l.baseQueue,d=o.pending;if(d!==null){if(a!==null){var p=a.next;a.next=d.next,d.next=p}l.baseQueue=a=d,o.pending=null}if(a!==null){d=a.next,l=l.baseState;var y=p=null,j=null,P=d;do{var J=P.lane;if((Zr&J)===J)j!==null&&(j=j.next={lane:0,action:P.action,hasEagerState:P.hasEagerState,eagerState:P.eagerState,next:null}),l=P.hasEagerState?P.eagerState:e(l,P.action);else{var H={lane:J,action:P.action,hasEagerState:P.hasEagerState,eagerState:P.eagerState,next:null};j===null?(y=j=H,p=l):j=j.next=H,De.lanes|=J,en|=J}P=P.next}while(P!==null&&P!==d);j===null?p=l:j.next=y,Rt(l,r.memoizedState)||(ht=!0),r.memoizedState=l,r.baseState=p,r.baseQueue=j,o.lastRenderedState=l}if(e=o.interleaved,e!==null){a=e;do d=a.lane,De.lanes|=d,en|=d,a=a.next;while(a!==e)}else a===null&&(o.lanes=0);return[r.memoizedState,o.dispatch]}function xa(e){var r=Et(),o=r.queue;if(o===null)throw Error(s(311));o.lastRenderedReducer=e;var l=o.dispatch,a=o.pending,d=r.memoizedState;if(a!==null){o.pending=null;var p=a=a.next;do d=e(d,p.action),p=p.next;while(p!==a);Rt(d,r.memoizedState)||(ht=!0),r.memoizedState=d,r.baseQueue===null&&(r.baseState=d),o.lastRenderedState=d}return[d,l]}function Nu(){}function Du(e,r){var o=De,l=Et(),a=r(),d=!Rt(l.memoizedState,a);if(d&&(l.memoizedState=a,ht=!0),l=l.queue,va(Mu.bind(null,o,l,e),[e]),l.getSnapshot!==r||d||Ge!==null&&Ge.memoizedState.tag&1){if(o.flags|=2048,Fo(9,Uu.bind(null,o,l,a,r),void 0,null),qe===null)throw Error(s(349));(Zr&30)!==0||Lu(o,r,a)}return a}function Lu(e,r,o){e.flags|=16384,e={getSnapshot:r,value:o},r=De.updateQueue,r===null?(r={lastEffect:null,stores:null},De.updateQueue=r,r.stores=[e]):(o=r.stores,o===null?r.stores=[e]:o.push(e))}function Uu(e,r,o,l){r.value=o,r.getSnapshot=l,Fu(r)&&Wu(e)}function Mu(e,r,o){return o(function(){Fu(r)&&Wu(e)})}function Fu(e){var r=e.getSnapshot;e=e.value;try{var o=r();return!Rt(e,o)}catch{return!0}}function Wu(e){var r=ir(e,1);r!==null&&Ut(r,e,1,-1)}function Bu(e){var r=Gt();return typeof e=="function"&&(e=e()),r.memoizedState=r.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Mo,lastRenderedState:e},r.queue=e,e=e.dispatch=e0.bind(null,De,e),[r.memoizedState,e]}function Fo(e,r,o,l){return e={tag:e,create:r,destroy:o,deps:l,next:null},r=De.updateQueue,r===null?(r={lastEffect:null,stores:null},De.updateQueue=r,r.lastEffect=e.next=e):(o=r.lastEffect,o===null?r.lastEffect=e.next=e:(l=o.next,o.next=e,e.next=l,r.lastEffect=e)),e}function Ju(){return Et().memoizedState}function Ki(e,r,o,l){var a=Gt();De.flags|=e,a.memoizedState=Fo(1|r,o,void 0,l===void 0?null:l)}function Gi(e,r,o,l){var a=Et();l=l===void 0?null:l;var d=void 0;if(Ve!==null){var p=Ve.memoizedState;if(d=p.destroy,l!==null&&ha(l,p.deps)){a.memoizedState=Fo(r,o,d,l);return}}De.flags|=e,a.memoizedState=Fo(1|r,o,d,l)}function Hu(e,r){return Ki(8390656,8,e,r)}function va(e,r){return Gi(2048,8,e,r)}function Vu(e,r){return Gi(4,2,e,r)}function Ku(e,r){return Gi(4,4,e,r)}function Gu(e,r){if(typeof r=="function")return e=e(),r(e),function(){r(null)};if(r!=null)return e=e(),r.current=e,function(){r.current=null}}function qu(e,r,o){return o=o!=null?o.concat([e]):null,Gi(4,4,Gu.bind(null,r,e),o)}function wa(){}function Yu(e,r){var o=Et();r=r===void 0?null:r;var l=o.memoizedState;return l!==null&&r!==null&&ha(r,l[1])?l[0]:(o.memoizedState=[e,r],e)}function Qu(e,r){var o=Et();r=r===void 0?null:r;var l=o.memoizedState;return l!==null&&r!==null&&ha(r,l[1])?l[0]:(e=e(),o.memoizedState=[e,r],e)}function Xu(e,r,o){return(Zr&21)===0?(e.baseState&&(e.baseState=!1,ht=!0),e.memoizedState=o):(Rt(o,r)||(o=Ed(),De.lanes|=o,en|=o,e.baseState=!0),r)}function Xg(e,r){var o=Ie;Ie=o!==0&&4>o?o:4,e(!0);var l=pa.transition;pa.transition={};try{e(!1),r()}finally{Ie=o,pa.transition=l}}function Zu(){return Et().memoizedState}function Zg(e,r,o){var l=Ar(e);if(o={lane:l,action:o,hasEagerState:!1,eagerState:null,next:null},ef(e))tf(r,o);else if(o=zu(e,r,o,l),o!==null){var a=dt();Ut(o,e,l,a),rf(o,r,l)}}function e0(e,r,o){var l=Ar(e),a={lane:l,action:o,hasEagerState:!1,eagerState:null,next:null};if(ef(e))tf(r,a);else{var d=e.alternate;if(e.lanes===0&&(d===null||d.lanes===0)&&(d=r.lastRenderedReducer,d!==null))try{var p=r.lastRenderedState,y=d(p,o);if(a.hasEagerState=!0,a.eagerState=y,Rt(y,p)){var j=r.interleaved;j===null?(a.next=a,la(r)):(a.next=j.next,j.next=a),r.interleaved=a;return}}catch{}finally{}o=zu(e,r,a,l),o!==null&&(a=dt(),Ut(o,e,l,a),rf(o,r,l))}}function ef(e){var r=e.alternate;return e===De||r!==null&&r===De}function tf(e,r){Lo=Vi=!0;var o=e.pending;o===null?r.next=r:(r.next=o.next,o.next=r),e.pending=r}function rf(e,r,o){if((o&4194240)!==0){var l=r.lanes;l&=e.pendingLanes,o|=l,r.lanes=o,jl(e,o)}}var qi={readContext:_t,useCallback:st,useContext:st,useEffect:st,useImperativeHandle:st,useInsertionEffect:st,useLayoutEffect:st,useMemo:st,useReducer:st,useRef:st,useState:st,useDebugValue:st,useDeferredValue:st,useTransition:st,useMutableSource:st,useSyncExternalStore:st,useId:st,unstable_isNewReconciler:!1},t0={readContext:_t,useCallback:function(e,r){return Gt().memoizedState=[e,r===void 0?null:r],e},useContext:_t,useEffect:Hu,useImperativeHandle:function(e,r,o){return o=o!=null?o.concat([e]):null,Ki(4194308,4,Gu.bind(null,r,e),o)},useLayoutEffect:function(e,r){return Ki(4194308,4,e,r)},useInsertionEffect:function(e,r){return Ki(4,2,e,r)},useMemo:function(e,r){var o=Gt();return r=r===void 0?null:r,e=e(),o.memoizedState=[e,r],e},useReducer:function(e,r,o){var l=Gt();return r=o!==void 0?o(r):r,l.memoizedState=l.baseState=r,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:r},l.queue=e,e=e.dispatch=Zg.bind(null,De,e),[l.memoizedState,e]},useRef:function(e){var r=Gt();return e={current:e},r.memoizedState=e},useState:Bu,useDebugValue:wa,useDeferredValue:function(e){return Gt().memoizedState=e},useTransition:function(){var e=Bu(!1),r=e[0];return e=Xg.bind(null,e[1]),Gt().memoizedState=e,[r,e]},useMutableSource:function(){},useSyncExternalStore:function(e,r,o){var l=De,a=Gt();if(Oe){if(o===void 0)throw Error(s(407));o=o()}else{if(o=r(),qe===null)throw Error(s(349));(Zr&30)!==0||Lu(l,r,o)}a.memoizedState=o;var d={value:o,getSnapshot:r};return a.queue=d,Hu(Mu.bind(null,l,d,e),[e]),l.flags|=2048,Fo(9,Uu.bind(null,l,d,o,r),void 0,null),o},useId:function(){var e=Gt(),r=qe.identifierPrefix;if(Oe){var o=or,l=nr;o=(l&~(1<<32-At(l)-1)).toString(32)+o,r=":"+r+"R"+o,o=Uo++,0<o&&(r+="H"+o.toString(32)),r+=":"}else o=Qg++,r=":"+r+"r"+o.toString(32)+":";return e.memoizedState=r},unstable_isNewReconciler:!1},r0={readContext:_t,useCallback:Yu,useContext:_t,useEffect:va,useImperativeHandle:qu,useInsertionEffect:Vu,useLayoutEffect:Ku,useMemo:Qu,useReducer:ya,useRef:Ju,useState:function(){return ya(Mo)},useDebugValue:wa,useDeferredValue:function(e){var r=Et();return Xu(r,Ve.memoizedState,e)},useTransition:function(){var e=ya(Mo)[0],r=Et().memoizedState;return[e,r]},useMutableSource:Nu,useSyncExternalStore:Du,useId:Zu,unstable_isNewReconciler:!1},n0={readContext:_t,useCallback:Yu,useContext:_t,useEffect:va,useImperativeHandle:qu,useInsertionEffect:Vu,useLayoutEffect:Ku,useMemo:Qu,useReducer:xa,useRef:Ju,useState:function(){return xa(Mo)},useDebugValue:wa,useDeferredValue:function(e){var r=Et();return Ve===null?r.memoizedState=e:Xu(r,Ve.memoizedState,e)},useTransition:function(){var e=xa(Mo)[0],r=Et().memoizedState;return[e,r]},useMutableSource:Nu,useSyncExternalStore:Du,useId:Zu,unstable_isNewReconciler:!1};function Nt(e,r){if(e&&e.defaultProps){r=q({},r),e=e.defaultProps;for(var o in e)r[o]===void 0&&(r[o]=e[o]);return r}return r}function ka(e,r,o,l){r=e.memoizedState,o=o(l,r),o=o==null?r:q({},r,o),e.memoizedState=o,e.lanes===0&&(e.updateQueue.baseState=o)}var Yi={isMounted:function(e){return(e=e._reactInternals)?Vr(e)===e:!1},enqueueSetState:function(e,r,o){e=e._reactInternals;var l=dt(),a=Ar(e),d=sr(l,a);d.payload=r,o!=null&&(d.callback=o),r=$r(e,d,a),r!==null&&(Ut(r,e,a,l),Wi(r,e,a))},enqueueReplaceState:function(e,r,o){e=e._reactInternals;var l=dt(),a=Ar(e),d=sr(l,a);d.tag=1,d.payload=r,o!=null&&(d.callback=o),r=$r(e,d,a),r!==null&&(Ut(r,e,a,l),Wi(r,e,a))},enqueueForceUpdate:function(e,r){e=e._reactInternals;var o=dt(),l=Ar(e),a=sr(o,l);a.tag=2,r!=null&&(a.callback=r),r=$r(e,a,l),r!==null&&(Ut(r,e,l,o),Wi(r,e,l))}};function nf(e,r,o,l,a,d,p){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(l,d,p):r.prototype&&r.prototype.isPureReactComponent?!_o(o,l)||!_o(a,d):!0}function of(e,r,o){var l=!1,a=Ir,d=r.contextType;return typeof d=="object"&&d!==null?d=_t(d):(a=pt(r)?Gr:it.current,l=r.contextTypes,d=(l=l!=null)?$n(e,a):Ir),r=new r(o,d),e.memoizedState=r.state!==null&&r.state!==void 0?r.state:null,r.updater=Yi,e.stateNode=r,r._reactInternals=e,l&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=a,e.__reactInternalMemoizedMaskedChildContext=d),r}function sf(e,r,o,l){e=r.state,typeof r.componentWillReceiveProps=="function"&&r.componentWillReceiveProps(o,l),typeof r.UNSAFE_componentWillReceiveProps=="function"&&r.UNSAFE_componentWillReceiveProps(o,l),r.state!==e&&Yi.enqueueReplaceState(r,r.state,null)}function ja(e,r,o,l){var a=e.stateNode;a.props=o,a.state=e.memoizedState,a.refs={},aa(e);var d=r.contextType;typeof d=="object"&&d!==null?a.context=_t(d):(d=pt(r)?Gr:it.current,a.context=$n(e,d)),a.state=e.memoizedState,d=r.getDerivedStateFromProps,typeof d=="function"&&(ka(e,r,d,o),a.state=e.memoizedState),typeof r.getDerivedStateFromProps=="function"||typeof a.getSnapshotBeforeUpdate=="function"||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(r=a.state,typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount(),r!==a.state&&Yi.enqueueReplaceState(a,a.state,null),Bi(e,o,a,l),a.state=e.memoizedState),typeof a.componentDidMount=="function"&&(e.flags|=4194308)}function Dn(e,r){try{var o="",l=r;do o+=ge(l),l=l.return;while(l);var a=o}catch(d){a=`
Error generating stack: `+d.message+`
`+d.stack}return{value:e,source:r,stack:a,digest:null}}function Sa(e,r,o){return{value:e,source:null,stack:o??null,digest:r??null}}function ba(e,r){try{console.error(r.value)}catch(o){setTimeout(function(){throw o})}}var o0=typeof WeakMap=="function"?WeakMap:Map;function lf(e,r,o){o=sr(-1,o),o.tag=3,o.payload={element:null};var l=r.value;return o.callback=function(){ns||(ns=!0,Ua=l),ba(e,r)},o}function af(e,r,o){o=sr(-1,o),o.tag=3;var l=e.type.getDerivedStateFromError;if(typeof l=="function"){var a=r.value;o.payload=function(){return l(a)},o.callback=function(){ba(e,r)}}var d=e.stateNode;return d!==null&&typeof d.componentDidCatch=="function"&&(o.callback=function(){ba(e,r),typeof l!="function"&&(zr===null?zr=new Set([this]):zr.add(this));var p=r.stack;this.componentDidCatch(r.value,{componentStack:p!==null?p:""})}),o}function cf(e,r,o){var l=e.pingCache;if(l===null){l=e.pingCache=new o0;var a=new Set;l.set(r,a)}else a=l.get(r),a===void 0&&(a=new Set,l.set(r,a));a.has(o)||(a.add(o),e=x0.bind(null,e,r,o),r.then(e,e))}function df(e){do{var r;if((r=e.tag===13)&&(r=e.memoizedState,r=r!==null?r.dehydrated!==null:!0),r)return e;e=e.return}while(e!==null);return null}function uf(e,r,o,l,a){return(e.mode&1)===0?(e===r?e.flags|=65536:(e.flags|=128,o.flags|=131072,o.flags&=-52805,o.tag===1&&(o.alternate===null?o.tag=17:(r=sr(-1,1),r.tag=2,$r(o,r,1))),o.lanes|=1),e):(e.flags|=65536,e.lanes=a,e)}var i0=D.ReactCurrentOwner,ht=!1;function ct(e,r,o,l){r.child=e===null?Tu(r,null,o,l):An(r,e.child,o,l)}function ff(e,r,o,l,a){o=o.render;var d=r.ref;return On(r,a),l=ma(e,r,o,l,d,a),o=ga(),e!==null&&!ht?(r.updateQueue=e.updateQueue,r.flags&=-2053,e.lanes&=~a,lr(e,r,a)):(Oe&&o&&Xl(r),r.flags|=1,ct(e,r,l,a),r.child)}function pf(e,r,o,l,a){if(e===null){var d=o.type;return typeof d=="function"&&!Va(d)&&d.defaultProps===void 0&&o.compare===null&&o.defaultProps===void 0?(r.tag=15,r.type=d,hf(e,r,d,l,a)):(e=cs(o.type,null,l,r,r.mode,a),e.ref=r.ref,e.return=r,r.child=e)}if(d=e.child,(e.lanes&a)===0){var p=d.memoizedProps;if(o=o.compare,o=o!==null?o:_o,o(p,l)&&e.ref===r.ref)return lr(e,r,a)}return r.flags|=1,e=Or(d,l),e.ref=r.ref,e.return=r,r.child=e}function hf(e,r,o,l,a){if(e!==null){var d=e.memoizedProps;if(_o(d,l)&&e.ref===r.ref)if(ht=!1,r.pendingProps=l=d,(e.lanes&a)!==0)(e.flags&131072)!==0&&(ht=!0);else return r.lanes=e.lanes,lr(e,r,a)}return Ca(e,r,o,l,a)}function mf(e,r,o){var l=r.pendingProps,a=l.children,d=e!==null?e.memoizedState:null;if(l.mode==="hidden")if((r.mode&1)===0)r.memoizedState={baseLanes:0,cachePool:null,transitions:null},Ee(Un,St),St|=o;else{if((o&1073741824)===0)return e=d!==null?d.baseLanes|o:o,r.lanes=r.childLanes=1073741824,r.memoizedState={baseLanes:e,cachePool:null,transitions:null},r.updateQueue=null,Ee(Un,St),St|=e,null;r.memoizedState={baseLanes:0,cachePool:null,transitions:null},l=d!==null?d.baseLanes:o,Ee(Un,St),St|=l}else d!==null?(l=d.baseLanes|o,r.memoizedState=null):l=o,Ee(Un,St),St|=l;return ct(e,r,a,o),r.child}function gf(e,r){var o=r.ref;(e===null&&o!==null||e!==null&&e.ref!==o)&&(r.flags|=512,r.flags|=2097152)}function Ca(e,r,o,l,a){var d=pt(o)?Gr:it.current;return d=$n(r,d),On(r,a),o=ma(e,r,o,l,d,a),l=ga(),e!==null&&!ht?(r.updateQueue=e.updateQueue,r.flags&=-2053,e.lanes&=~a,lr(e,r,a)):(Oe&&l&&Xl(r),r.flags|=1,ct(e,r,o,a),r.child)}function yf(e,r,o,l,a){if(pt(o)){var d=!0;Ri(r)}else d=!1;if(On(r,a),r.stateNode===null)Xi(e,r),of(r,o,l),ja(r,o,l,a),l=!0;else if(e===null){var p=r.stateNode,y=r.memoizedProps;p.props=y;var j=p.context,P=o.contextType;typeof P=="object"&&P!==null?P=_t(P):(P=pt(o)?Gr:it.current,P=$n(r,P));var J=o.getDerivedStateFromProps,H=typeof J=="function"||typeof p.getSnapshotBeforeUpdate=="function";H||typeof p.UNSAFE_componentWillReceiveProps!="function"&&typeof p.componentWillReceiveProps!="function"||(y!==l||j!==P)&&sf(r,p,l,P),Er=!1;var W=r.memoizedState;p.state=W,Bi(r,l,p,a),j=r.memoizedState,y!==l||W!==j||ft.current||Er?(typeof J=="function"&&(ka(r,o,J,l),j=r.memoizedState),(y=Er||nf(r,o,y,l,W,j,P))?(H||typeof p.UNSAFE_componentWillMount!="function"&&typeof p.componentWillMount!="function"||(typeof p.componentWillMount=="function"&&p.componentWillMount(),typeof p.UNSAFE_componentWillMount=="function"&&p.UNSAFE_componentWillMount()),typeof p.componentDidMount=="function"&&(r.flags|=4194308)):(typeof p.componentDidMount=="function"&&(r.flags|=4194308),r.memoizedProps=l,r.memoizedState=j),p.props=l,p.state=j,p.context=P,l=y):(typeof p.componentDidMount=="function"&&(r.flags|=4194308),l=!1)}else{p=r.stateNode,Pu(e,r),y=r.memoizedProps,P=r.type===r.elementType?y:Nt(r.type,y),p.props=P,H=r.pendingProps,W=p.context,j=o.contextType,typeof j=="object"&&j!==null?j=_t(j):(j=pt(o)?Gr:it.current,j=$n(r,j));var Q=o.getDerivedStateFromProps;(J=typeof Q=="function"||typeof p.getSnapshotBeforeUpdate=="function")||typeof p.UNSAFE_componentWillReceiveProps!="function"&&typeof p.componentWillReceiveProps!="function"||(y!==H||W!==j)&&sf(r,p,l,j),Er=!1,W=r.memoizedState,p.state=W,Bi(r,l,p,a);var te=r.memoizedState;y!==H||W!==te||ft.current||Er?(typeof Q=="function"&&(ka(r,o,Q,l),te=r.memoizedState),(P=Er||nf(r,o,P,l,W,te,j)||!1)?(J||typeof p.UNSAFE_componentWillUpdate!="function"&&typeof p.componentWillUpdate!="function"||(typeof p.componentWillUpdate=="function"&&p.componentWillUpdate(l,te,j),typeof p.UNSAFE_componentWillUpdate=="function"&&p.UNSAFE_componentWillUpdate(l,te,j)),typeof p.componentDidUpdate=="function"&&(r.flags|=4),typeof p.getSnapshotBeforeUpdate=="function"&&(r.flags|=1024)):(typeof p.componentDidUpdate!="function"||y===e.memoizedProps&&W===e.memoizedState||(r.flags|=4),typeof p.getSnapshotBeforeUpdate!="function"||y===e.memoizedProps&&W===e.memoizedState||(r.flags|=1024),r.memoizedProps=l,r.memoizedState=te),p.props=l,p.state=te,p.context=j,l=P):(typeof p.componentDidUpdate!="function"||y===e.memoizedProps&&W===e.memoizedState||(r.flags|=4),typeof p.getSnapshotBeforeUpdate!="function"||y===e.memoizedProps&&W===e.memoizedState||(r.flags|=1024),l=!1)}return Ia(e,r,o,l,d,a)}function Ia(e,r,o,l,a,d){gf(e,r);var p=(r.flags&128)!==0;if(!l&&!p)return a&&ku(r,o,!1),lr(e,r,d);l=r.stateNode,i0.current=r;var y=p&&typeof o.getDerivedStateFromError!="function"?null:l.render();return r.flags|=1,e!==null&&p?(r.child=An(r,e.child,null,d),r.child=An(r,null,y,d)):ct(e,r,y,d),r.memoizedState=l.state,a&&ku(r,o,!0),r.child}function xf(e){var r=e.stateNode;r.pendingContext?vu(e,r.pendingContext,r.pendingContext!==r.context):r.context&&vu(e,r.context,!1),ca(e,r.containerInfo)}function vf(e,r,o,l,a){return Pn(),ra(a),r.flags|=256,ct(e,r,o,l),r.child}var _a={dehydrated:null,treeContext:null,retryLane:0};function Ea(e){return{baseLanes:e,cachePool:null,transitions:null}}function wf(e,r,o){var l=r.pendingProps,a=Ne.current,d=!1,p=(r.flags&128)!==0,y;if((y=p)||(y=e!==null&&e.memoizedState===null?!1:(a&2)!==0),y?(d=!0,r.flags&=-129):(e===null||e.memoizedState!==null)&&(a|=1),Ee(Ne,a&1),e===null)return ta(r),e=r.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?((r.mode&1)===0?r.lanes=1:e.data==="$!"?r.lanes=8:r.lanes=1073741824,null):(p=l.children,e=l.fallback,d?(l=r.mode,d=r.child,p={mode:"hidden",children:p},(l&1)===0&&d!==null?(d.childLanes=0,d.pendingProps=p):d=ds(p,l,0,null),e=on(e,l,o,null),d.return=r,e.return=r,d.sibling=e,r.child=d,r.child.memoizedState=Ea(o),r.memoizedState=_a,e):$a(r,p));if(a=e.memoizedState,a!==null&&(y=a.dehydrated,y!==null))return s0(e,r,p,l,y,a,o);if(d){d=l.fallback,p=r.mode,a=e.child,y=a.sibling;var j={mode:"hidden",children:l.children};return(p&1)===0&&r.child!==a?(l=r.child,l.childLanes=0,l.pendingProps=j,r.deletions=null):(l=Or(a,j),l.subtreeFlags=a.subtreeFlags&14680064),y!==null?d=Or(y,d):(d=on(d,p,o,null),d.flags|=2),d.return=r,l.return=r,l.sibling=d,r.child=l,l=d,d=r.child,p=e.child.memoizedState,p=p===null?Ea(o):{baseLanes:p.baseLanes|o,cachePool:null,transitions:p.transitions},d.memoizedState=p,d.childLanes=e.childLanes&~o,r.memoizedState=_a,l}return d=e.child,e=d.sibling,l=Or(d,{mode:"visible",children:l.children}),(r.mode&1)===0&&(l.lanes=o),l.return=r,l.sibling=null,e!==null&&(o=r.deletions,o===null?(r.deletions=[e],r.flags|=16):o.push(e)),r.child=l,r.memoizedState=null,l}function $a(e,r){return r=ds({mode:"visible",children:r},e.mode,0,null),r.return=e,e.child=r}function Qi(e,r,o,l){return l!==null&&ra(l),An(r,e.child,null,o),e=$a(r,r.pendingProps.children),e.flags|=2,r.memoizedState=null,e}function s0(e,r,o,l,a,d,p){if(o)return r.flags&256?(r.flags&=-257,l=Sa(Error(s(422))),Qi(e,r,p,l)):r.memoizedState!==null?(r.child=e.child,r.flags|=128,null):(d=l.fallback,a=r.mode,l=ds({mode:"visible",children:l.children},a,0,null),d=on(d,a,p,null),d.flags|=2,l.return=r,d.return=r,l.sibling=d,r.child=l,(r.mode&1)!==0&&An(r,e.child,null,p),r.child.memoizedState=Ea(p),r.memoizedState=_a,d);if((r.mode&1)===0)return Qi(e,r,p,null);if(a.data==="$!"){if(l=a.nextSibling&&a.nextSibling.dataset,l)var y=l.dgst;return l=y,d=Error(s(419)),l=Sa(d,l,void 0),Qi(e,r,p,l)}if(y=(p&e.childLanes)!==0,ht||y){if(l=qe,l!==null){switch(p&-p){case 4:a=2;break;case 16:a=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:a=32;break;case 536870912:a=268435456;break;default:a=0}a=(a&(l.suspendedLanes|p))!==0?0:a,a!==0&&a!==d.retryLane&&(d.retryLane=a,ir(e,a),Ut(l,e,a,-1))}return Ha(),l=Sa(Error(s(421))),Qi(e,r,p,l)}return a.data==="$?"?(r.flags|=128,r.child=e.child,r=v0.bind(null,e),a._reactRetry=r,null):(e=d.treeContext,jt=br(a.nextSibling),kt=r,Oe=!0,Ot=null,e!==null&&(Ct[It++]=nr,Ct[It++]=or,Ct[It++]=qr,nr=e.id,or=e.overflow,qr=r),r=$a(r,l.children),r.flags|=4096,r)}function kf(e,r,o){e.lanes|=r;var l=e.alternate;l!==null&&(l.lanes|=r),sa(e.return,r,o)}function Ta(e,r,o,l,a){var d=e.memoizedState;d===null?e.memoizedState={isBackwards:r,rendering:null,renderingStartTime:0,last:l,tail:o,tailMode:a}:(d.isBackwards=r,d.rendering=null,d.renderingStartTime=0,d.last=l,d.tail=o,d.tailMode=a)}function jf(e,r,o){var l=r.pendingProps,a=l.revealOrder,d=l.tail;if(ct(e,r,l.children,o),l=Ne.current,(l&2)!==0)l=l&1|2,r.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=r.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&kf(e,o,r);else if(e.tag===19)kf(e,o,r);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===r)break e;for(;e.sibling===null;){if(e.return===null||e.return===r)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}l&=1}if(Ee(Ne,l),(r.mode&1)===0)r.memoizedState=null;else switch(a){case"forwards":for(o=r.child,a=null;o!==null;)e=o.alternate,e!==null&&Ji(e)===null&&(a=o),o=o.sibling;o=a,o===null?(a=r.child,r.child=null):(a=o.sibling,o.sibling=null),Ta(r,!1,a,o,d);break;case"backwards":for(o=null,a=r.child,r.child=null;a!==null;){if(e=a.alternate,e!==null&&Ji(e)===null){r.child=a;break}e=a.sibling,a.sibling=o,o=a,a=e}Ta(r,!0,o,null,d);break;case"together":Ta(r,!1,null,null,void 0);break;default:r.memoizedState=null}return r.child}function Xi(e,r){(r.mode&1)===0&&e!==null&&(e.alternate=null,r.alternate=null,r.flags|=2)}function lr(e,r,o){if(e!==null&&(r.dependencies=e.dependencies),en|=r.lanes,(o&r.childLanes)===0)return null;if(e!==null&&r.child!==e.child)throw Error(s(153));if(r.child!==null){for(e=r.child,o=Or(e,e.pendingProps),r.child=o,o.return=r;e.sibling!==null;)e=e.sibling,o=o.sibling=Or(e,e.pendingProps),o.return=r;o.sibling=null}return r.child}function l0(e,r,o){switch(r.tag){case 3:xf(r),Pn();break;case 5:Ou(r);break;case 1:pt(r.type)&&Ri(r);break;case 4:ca(r,r.stateNode.containerInfo);break;case 10:var l=r.type._context,a=r.memoizedProps.value;Ee(Mi,l._currentValue),l._currentValue=a;break;case 13:if(l=r.memoizedState,l!==null)return l.dehydrated!==null?(Ee(Ne,Ne.current&1),r.flags|=128,null):(o&r.child.childLanes)!==0?wf(e,r,o):(Ee(Ne,Ne.current&1),e=lr(e,r,o),e!==null?e.sibling:null);Ee(Ne,Ne.current&1);break;case 19:if(l=(o&r.childLanes)!==0,(e.flags&128)!==0){if(l)return jf(e,r,o);r.flags|=128}if(a=r.memoizedState,a!==null&&(a.rendering=null,a.tail=null,a.lastEffect=null),Ee(Ne,Ne.current),l)break;return null;case 22:case 23:return r.lanes=0,mf(e,r,o)}return lr(e,r,o)}var Sf,za,bf,Cf;Sf=function(e,r){for(var o=r.child;o!==null;){if(o.tag===5||o.tag===6)e.appendChild(o.stateNode);else if(o.tag!==4&&o.child!==null){o.child.return=o,o=o.child;continue}if(o===r)break;for(;o.sibling===null;){if(o.return===null||o.return===r)return;o=o.return}o.sibling.return=o.return,o=o.sibling}},za=function(){},bf=function(e,r,o,l){var a=e.memoizedProps;if(a!==l){e=r.stateNode,Xr(Kt.current);var d=null;switch(o){case"input":a=sl(e,a),l=sl(e,l),d=[];break;case"select":a=q({},a,{value:void 0}),l=q({},l,{value:void 0}),d=[];break;case"textarea":a=cl(e,a),l=cl(e,l),d=[];break;default:typeof a.onClick!="function"&&typeof l.onClick=="function"&&(e.onclick=zi)}ul(o,l);var p;o=null;for(P in a)if(!l.hasOwnProperty(P)&&a.hasOwnProperty(P)&&a[P]!=null)if(P==="style"){var y=a[P];for(p in y)y.hasOwnProperty(p)&&(o||(o={}),o[p]="")}else P!=="dangerouslySetInnerHTML"&&P!=="children"&&P!=="suppressContentEditableWarning"&&P!=="suppressHydrationWarning"&&P!=="autoFocus"&&(u.hasOwnProperty(P)?d||(d=[]):(d=d||[]).push(P,null));for(P in l){var j=l[P];if(y=a!=null?a[P]:void 0,l.hasOwnProperty(P)&&j!==y&&(j!=null||y!=null))if(P==="style")if(y){for(p in y)!y.hasOwnProperty(p)||j&&j.hasOwnProperty(p)||(o||(o={}),o[p]="");for(p in j)j.hasOwnProperty(p)&&y[p]!==j[p]&&(o||(o={}),o[p]=j[p])}else o||(d||(d=[]),d.push(P,o)),o=j;else P==="dangerouslySetInnerHTML"?(j=j?j.__html:void 0,y=y?y.__html:void 0,j!=null&&y!==j&&(d=d||[]).push(P,j)):P==="children"?typeof j!="string"&&typeof j!="number"||(d=d||[]).push(P,""+j):P!=="suppressContentEditableWarning"&&P!=="suppressHydrationWarning"&&(u.hasOwnProperty(P)?(j!=null&&P==="onScroll"&&Te("scroll",e),d||y===j||(d=[])):(d=d||[]).push(P,j))}o&&(d=d||[]).push("style",o);var P=d;(r.updateQueue=P)&&(r.flags|=4)}},Cf=function(e,r,o,l){o!==l&&(r.flags|=4)};function Wo(e,r){if(!Oe)switch(e.tailMode){case"hidden":r=e.tail;for(var o=null;r!==null;)r.alternate!==null&&(o=r),r=r.sibling;o===null?e.tail=null:o.sibling=null;break;case"collapsed":o=e.tail;for(var l=null;o!==null;)o.alternate!==null&&(l=o),o=o.sibling;l===null?r||e.tail===null?e.tail=null:e.tail.sibling=null:l.sibling=null}}function lt(e){var r=e.alternate!==null&&e.alternate.child===e.child,o=0,l=0;if(r)for(var a=e.child;a!==null;)o|=a.lanes|a.childLanes,l|=a.subtreeFlags&14680064,l|=a.flags&14680064,a.return=e,a=a.sibling;else for(a=e.child;a!==null;)o|=a.lanes|a.childLanes,l|=a.subtreeFlags,l|=a.flags,a.return=e,a=a.sibling;return e.subtreeFlags|=l,e.childLanes=o,r}function a0(e,r,o){var l=r.pendingProps;switch(Zl(r),r.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return lt(r),null;case 1:return pt(r.type)&&Ai(),lt(r),null;case 3:return l=r.stateNode,Nn(),ze(ft),ze(it),fa(),l.pendingContext&&(l.context=l.pendingContext,l.pendingContext=null),(e===null||e.child===null)&&(Li(r)?r.flags|=4:e===null||e.memoizedState.isDehydrated&&(r.flags&256)===0||(r.flags|=1024,Ot!==null&&(Wa(Ot),Ot=null))),za(e,r),lt(r),null;case 5:da(r);var a=Xr(Do.current);if(o=r.type,e!==null&&r.stateNode!=null)bf(e,r,o,l,a),e.ref!==r.ref&&(r.flags|=512,r.flags|=2097152);else{if(!l){if(r.stateNode===null)throw Error(s(166));return lt(r),null}if(e=Xr(Kt.current),Li(r)){l=r.stateNode,o=r.type;var d=r.memoizedProps;switch(l[Vt]=r,l[Po]=d,e=(r.mode&1)!==0,o){case"dialog":Te("cancel",l),Te("close",l);break;case"iframe":case"object":case"embed":Te("load",l);break;case"video":case"audio":for(a=0;a<$o.length;a++)Te($o[a],l);break;case"source":Te("error",l);break;case"img":case"image":case"link":Te("error",l),Te("load",l);break;case"details":Te("toggle",l);break;case"input":od(l,d),Te("invalid",l);break;case"select":l._wrapperState={wasMultiple:!!d.multiple},Te("invalid",l);break;case"textarea":ld(l,d),Te("invalid",l)}ul(o,d),a=null;for(var p in d)if(d.hasOwnProperty(p)){var y=d[p];p==="children"?typeof y=="string"?l.textContent!==y&&(d.suppressHydrationWarning!==!0&&Ti(l.textContent,y,e),a=["children",y]):typeof y=="number"&&l.textContent!==""+y&&(d.suppressHydrationWarning!==!0&&Ti(l.textContent,y,e),a=["children",""+y]):u.hasOwnProperty(p)&&y!=null&&p==="onScroll"&&Te("scroll",l)}switch(o){case"input":er(l),sd(l,d,!0);break;case"textarea":er(l),cd(l);break;case"select":case"option":break;default:typeof d.onClick=="function"&&(l.onclick=zi)}l=a,r.updateQueue=l,l!==null&&(r.flags|=4)}else{p=a.nodeType===9?a:a.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=dd(o)),e==="http://www.w3.org/1999/xhtml"?o==="script"?(e=p.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof l.is=="string"?e=p.createElement(o,{is:l.is}):(e=p.createElement(o),o==="select"&&(p=e,l.multiple?p.multiple=!0:l.size&&(p.size=l.size))):e=p.createElementNS(e,o),e[Vt]=r,e[Po]=l,Sf(e,r,!1,!1),r.stateNode=e;e:{switch(p=fl(o,l),o){case"dialog":Te("cancel",e),Te("close",e),a=l;break;case"iframe":case"object":case"embed":Te("load",e),a=l;break;case"video":case"audio":for(a=0;a<$o.length;a++)Te($o[a],e);a=l;break;case"source":Te("error",e),a=l;break;case"img":case"image":case"link":Te("error",e),Te("load",e),a=l;break;case"details":Te("toggle",e),a=l;break;case"input":od(e,l),a=sl(e,l),Te("invalid",e);break;case"option":a=l;break;case"select":e._wrapperState={wasMultiple:!!l.multiple},a=q({},l,{value:void 0}),Te("invalid",e);break;case"textarea":ld(e,l),a=cl(e,l),Te("invalid",e);break;default:a=l}ul(o,a),y=a;for(d in y)if(y.hasOwnProperty(d)){var j=y[d];d==="style"?pd(e,j):d==="dangerouslySetInnerHTML"?(j=j?j.__html:void 0,j!=null&&ud(e,j)):d==="children"?typeof j=="string"?(o!=="textarea"||j!=="")&&co(e,j):typeof j=="number"&&co(e,""+j):d!=="suppressContentEditableWarning"&&d!=="suppressHydrationWarning"&&d!=="autoFocus"&&(u.hasOwnProperty(d)?j!=null&&d==="onScroll"&&Te("scroll",e):j!=null&&O(e,d,j,p))}switch(o){case"input":er(e),sd(e,l,!1);break;case"textarea":er(e),cd(e);break;case"option":l.value!=null&&e.setAttribute("value",""+ye(l.value));break;case"select":e.multiple=!!l.multiple,d=l.value,d!=null?yn(e,!!l.multiple,d,!1):l.defaultValue!=null&&yn(e,!!l.multiple,l.defaultValue,!0);break;default:typeof a.onClick=="function"&&(e.onclick=zi)}switch(o){case"button":case"input":case"select":case"textarea":l=!!l.autoFocus;break e;case"img":l=!0;break e;default:l=!1}}l&&(r.flags|=4)}r.ref!==null&&(r.flags|=512,r.flags|=2097152)}return lt(r),null;case 6:if(e&&r.stateNode!=null)Cf(e,r,e.memoizedProps,l);else{if(typeof l!="string"&&r.stateNode===null)throw Error(s(166));if(o=Xr(Do.current),Xr(Kt.current),Li(r)){if(l=r.stateNode,o=r.memoizedProps,l[Vt]=r,(d=l.nodeValue!==o)&&(e=kt,e!==null))switch(e.tag){case 3:Ti(l.nodeValue,o,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&Ti(l.nodeValue,o,(e.mode&1)!==0)}d&&(r.flags|=4)}else l=(o.nodeType===9?o:o.ownerDocument).createTextNode(l),l[Vt]=r,r.stateNode=l}return lt(r),null;case 13:if(ze(Ne),l=r.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(Oe&&jt!==null&&(r.mode&1)!==0&&(r.flags&128)===0)_u(),Pn(),r.flags|=98560,d=!1;else if(d=Li(r),l!==null&&l.dehydrated!==null){if(e===null){if(!d)throw Error(s(318));if(d=r.memoizedState,d=d!==null?d.dehydrated:null,!d)throw Error(s(317));d[Vt]=r}else Pn(),(r.flags&128)===0&&(r.memoizedState=null),r.flags|=4;lt(r),d=!1}else Ot!==null&&(Wa(Ot),Ot=null),d=!0;if(!d)return r.flags&65536?r:null}return(r.flags&128)!==0?(r.lanes=o,r):(l=l!==null,l!==(e!==null&&e.memoizedState!==null)&&l&&(r.child.flags|=8192,(r.mode&1)!==0&&(e===null||(Ne.current&1)!==0?Ke===0&&(Ke=3):Ha())),r.updateQueue!==null&&(r.flags|=4),lt(r),null);case 4:return Nn(),za(e,r),e===null&&To(r.stateNode.containerInfo),lt(r),null;case 10:return ia(r.type._context),lt(r),null;case 17:return pt(r.type)&&Ai(),lt(r),null;case 19:if(ze(Ne),d=r.memoizedState,d===null)return lt(r),null;if(l=(r.flags&128)!==0,p=d.rendering,p===null)if(l)Wo(d,!1);else{if(Ke!==0||e!==null&&(e.flags&128)!==0)for(e=r.child;e!==null;){if(p=Ji(e),p!==null){for(r.flags|=128,Wo(d,!1),l=p.updateQueue,l!==null&&(r.updateQueue=l,r.flags|=4),r.subtreeFlags=0,l=o,o=r.child;o!==null;)d=o,e=l,d.flags&=14680066,p=d.alternate,p===null?(d.childLanes=0,d.lanes=e,d.child=null,d.subtreeFlags=0,d.memoizedProps=null,d.memoizedState=null,d.updateQueue=null,d.dependencies=null,d.stateNode=null):(d.childLanes=p.childLanes,d.lanes=p.lanes,d.child=p.child,d.subtreeFlags=0,d.deletions=null,d.memoizedProps=p.memoizedProps,d.memoizedState=p.memoizedState,d.updateQueue=p.updateQueue,d.type=p.type,e=p.dependencies,d.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),o=o.sibling;return Ee(Ne,Ne.current&1|2),r.child}e=e.sibling}d.tail!==null&&Me()>Mn&&(r.flags|=128,l=!0,Wo(d,!1),r.lanes=4194304)}else{if(!l)if(e=Ji(p),e!==null){if(r.flags|=128,l=!0,o=e.updateQueue,o!==null&&(r.updateQueue=o,r.flags|=4),Wo(d,!0),d.tail===null&&d.tailMode==="hidden"&&!p.alternate&&!Oe)return lt(r),null}else 2*Me()-d.renderingStartTime>Mn&&o!==1073741824&&(r.flags|=128,l=!0,Wo(d,!1),r.lanes=4194304);d.isBackwards?(p.sibling=r.child,r.child=p):(o=d.last,o!==null?o.sibling=p:r.child=p,d.last=p)}return d.tail!==null?(r=d.tail,d.rendering=r,d.tail=r.sibling,d.renderingStartTime=Me(),r.sibling=null,o=Ne.current,Ee(Ne,l?o&1|2:o&1),r):(lt(r),null);case 22:case 23:return Ja(),l=r.memoizedState!==null,e!==null&&e.memoizedState!==null!==l&&(r.flags|=8192),l&&(r.mode&1)!==0?(St&1073741824)!==0&&(lt(r),r.subtreeFlags&6&&(r.flags|=8192)):lt(r),null;case 24:return null;case 25:return null}throw Error(s(156,r.tag))}function c0(e,r){switch(Zl(r),r.tag){case 1:return pt(r.type)&&Ai(),e=r.flags,e&65536?(r.flags=e&-65537|128,r):null;case 3:return Nn(),ze(ft),ze(it),fa(),e=r.flags,(e&65536)!==0&&(e&128)===0?(r.flags=e&-65537|128,r):null;case 5:return da(r),null;case 13:if(ze(Ne),e=r.memoizedState,e!==null&&e.dehydrated!==null){if(r.alternate===null)throw Error(s(340));Pn()}return e=r.flags,e&65536?(r.flags=e&-65537|128,r):null;case 19:return ze(Ne),null;case 4:return Nn(),null;case 10:return ia(r.type._context),null;case 22:case 23:return Ja(),null;case 24:return null;default:return null}}var Zi=!1,at=!1,d0=typeof WeakSet=="function"?WeakSet:Set,Z=null;function Ln(e,r){var o=e.ref;if(o!==null)if(typeof o=="function")try{o(null)}catch(l){Ue(e,r,l)}else o.current=null}function Pa(e,r,o){try{o()}catch(l){Ue(e,r,l)}}var If=!1;function u0(e,r){if(Jl=vi,e=nu(),Nl(e)){if("selectionStart"in e)var o={start:e.selectionStart,end:e.selectionEnd};else e:{o=(o=e.ownerDocument)&&o.defaultView||window;var l=o.getSelection&&o.getSelection();if(l&&l.rangeCount!==0){o=l.anchorNode;var a=l.anchorOffset,d=l.focusNode;l=l.focusOffset;try{o.nodeType,d.nodeType}catch{o=null;break e}var p=0,y=-1,j=-1,P=0,J=0,H=e,W=null;t:for(;;){for(var Q;H!==o||a!==0&&H.nodeType!==3||(y=p+a),H!==d||l!==0&&H.nodeType!==3||(j=p+l),H.nodeType===3&&(p+=H.nodeValue.length),(Q=H.firstChild)!==null;)W=H,H=Q;for(;;){if(H===e)break t;if(W===o&&++P===a&&(y=p),W===d&&++J===l&&(j=p),(Q=H.nextSibling)!==null)break;H=W,W=H.parentNode}H=Q}o=y===-1||j===-1?null:{start:y,end:j}}else o=null}o=o||{start:0,end:0}}else o=null;for(Hl={focusedElem:e,selectionRange:o},vi=!1,Z=r;Z!==null;)if(r=Z,e=r.child,(r.subtreeFlags&1028)!==0&&e!==null)e.return=r,Z=e;else for(;Z!==null;){r=Z;try{var te=r.alternate;if((r.flags&1024)!==0)switch(r.tag){case 0:case 11:case 15:break;case 1:if(te!==null){var re=te.memoizedProps,Fe=te.memoizedState,$=r.stateNode,I=$.getSnapshotBeforeUpdate(r.elementType===r.type?re:Nt(r.type,re),Fe);$.__reactInternalSnapshotBeforeUpdate=I}break;case 3:var T=r.stateNode.containerInfo;T.nodeType===1?T.textContent="":T.nodeType===9&&T.documentElement&&T.removeChild(T.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(s(163))}}catch(V){Ue(r,r.return,V)}if(e=r.sibling,e!==null){e.return=r.return,Z=e;break}Z=r.return}return te=If,If=!1,te}function Bo(e,r,o){var l=r.updateQueue;if(l=l!==null?l.lastEffect:null,l!==null){var a=l=l.next;do{if((a.tag&e)===e){var d=a.destroy;a.destroy=void 0,d!==void 0&&Pa(r,o,d)}a=a.next}while(a!==l)}}function es(e,r){if(r=r.updateQueue,r=r!==null?r.lastEffect:null,r!==null){var o=r=r.next;do{if((o.tag&e)===e){var l=o.create;o.destroy=l()}o=o.next}while(o!==r)}}function Aa(e){var r=e.ref;if(r!==null){var o=e.stateNode;switch(e.tag){case 5:e=o;break;default:e=o}typeof r=="function"?r(e):r.current=e}}function _f(e){var r=e.alternate;r!==null&&(e.alternate=null,_f(r)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(r=e.stateNode,r!==null&&(delete r[Vt],delete r[Po],delete r[ql],delete r[Kg],delete r[Gg])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function Ef(e){return e.tag===5||e.tag===3||e.tag===4}function $f(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||Ef(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Ra(e,r,o){var l=e.tag;if(l===5||l===6)e=e.stateNode,r?o.nodeType===8?o.parentNode.insertBefore(e,r):o.insertBefore(e,r):(o.nodeType===8?(r=o.parentNode,r.insertBefore(e,o)):(r=o,r.appendChild(e)),o=o._reactRootContainer,o!=null||r.onclick!==null||(r.onclick=zi));else if(l!==4&&(e=e.child,e!==null))for(Ra(e,r,o),e=e.sibling;e!==null;)Ra(e,r,o),e=e.sibling}function Oa(e,r,o){var l=e.tag;if(l===5||l===6)e=e.stateNode,r?o.insertBefore(e,r):o.appendChild(e);else if(l!==4&&(e=e.child,e!==null))for(Oa(e,r,o),e=e.sibling;e!==null;)Oa(e,r,o),e=e.sibling}var rt=null,Dt=!1;function Tr(e,r,o){for(o=o.child;o!==null;)Tf(e,r,o),o=o.sibling}function Tf(e,r,o){if(Ht&&typeof Ht.onCommitFiberUnmount=="function")try{Ht.onCommitFiberUnmount(pi,o)}catch{}switch(o.tag){case 5:at||Ln(o,r);case 6:var l=rt,a=Dt;rt=null,Tr(e,r,o),rt=l,Dt=a,rt!==null&&(Dt?(e=rt,o=o.stateNode,e.nodeType===8?e.parentNode.removeChild(o):e.removeChild(o)):rt.removeChild(o.stateNode));break;case 18:rt!==null&&(Dt?(e=rt,o=o.stateNode,e.nodeType===8?Gl(e.parentNode,o):e.nodeType===1&&Gl(e,o),ko(e)):Gl(rt,o.stateNode));break;case 4:l=rt,a=Dt,rt=o.stateNode.containerInfo,Dt=!0,Tr(e,r,o),rt=l,Dt=a;break;case 0:case 11:case 14:case 15:if(!at&&(l=o.updateQueue,l!==null&&(l=l.lastEffect,l!==null))){a=l=l.next;do{var d=a,p=d.destroy;d=d.tag,p!==void 0&&((d&2)!==0||(d&4)!==0)&&Pa(o,r,p),a=a.next}while(a!==l)}Tr(e,r,o);break;case 1:if(!at&&(Ln(o,r),l=o.stateNode,typeof l.componentWillUnmount=="function"))try{l.props=o.memoizedProps,l.state=o.memoizedState,l.componentWillUnmount()}catch(y){Ue(o,r,y)}Tr(e,r,o);break;case 21:Tr(e,r,o);break;case 22:o.mode&1?(at=(l=at)||o.memoizedState!==null,Tr(e,r,o),at=l):Tr(e,r,o);break;default:Tr(e,r,o)}}function zf(e){var r=e.updateQueue;if(r!==null){e.updateQueue=null;var o=e.stateNode;o===null&&(o=e.stateNode=new d0),r.forEach(function(l){var a=w0.bind(null,e,l);o.has(l)||(o.add(l),l.then(a,a))})}}function Lt(e,r){var o=r.deletions;if(o!==null)for(var l=0;l<o.length;l++){var a=o[l];try{var d=e,p=r,y=p;e:for(;y!==null;){switch(y.tag){case 5:rt=y.stateNode,Dt=!1;break e;case 3:rt=y.stateNode.containerInfo,Dt=!0;break e;case 4:rt=y.stateNode.containerInfo,Dt=!0;break e}y=y.return}if(rt===null)throw Error(s(160));Tf(d,p,a),rt=null,Dt=!1;var j=a.alternate;j!==null&&(j.return=null),a.return=null}catch(P){Ue(a,r,P)}}if(r.subtreeFlags&12854)for(r=r.child;r!==null;)Pf(r,e),r=r.sibling}function Pf(e,r){var o=e.alternate,l=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(Lt(r,e),qt(e),l&4){try{Bo(3,e,e.return),es(3,e)}catch(re){Ue(e,e.return,re)}try{Bo(5,e,e.return)}catch(re){Ue(e,e.return,re)}}break;case 1:Lt(r,e),qt(e),l&512&&o!==null&&Ln(o,o.return);break;case 5:if(Lt(r,e),qt(e),l&512&&o!==null&&Ln(o,o.return),e.flags&32){var a=e.stateNode;try{co(a,"")}catch(re){Ue(e,e.return,re)}}if(l&4&&(a=e.stateNode,a!=null)){var d=e.memoizedProps,p=o!==null?o.memoizedProps:d,y=e.type,j=e.updateQueue;if(e.updateQueue=null,j!==null)try{y==="input"&&d.type==="radio"&&d.name!=null&&id(a,d),fl(y,p);var P=fl(y,d);for(p=0;p<j.length;p+=2){var J=j[p],H=j[p+1];J==="style"?pd(a,H):J==="dangerouslySetInnerHTML"?ud(a,H):J==="children"?co(a,H):O(a,J,H,P)}switch(y){case"input":ll(a,d);break;case"textarea":ad(a,d);break;case"select":var W=a._wrapperState.wasMultiple;a._wrapperState.wasMultiple=!!d.multiple;var Q=d.value;Q!=null?yn(a,!!d.multiple,Q,!1):W!==!!d.multiple&&(d.defaultValue!=null?yn(a,!!d.multiple,d.defaultValue,!0):yn(a,!!d.multiple,d.multiple?[]:"",!1))}a[Po]=d}catch(re){Ue(e,e.return,re)}}break;case 6:if(Lt(r,e),qt(e),l&4){if(e.stateNode===null)throw Error(s(162));a=e.stateNode,d=e.memoizedProps;try{a.nodeValue=d}catch(re){Ue(e,e.return,re)}}break;case 3:if(Lt(r,e),qt(e),l&4&&o!==null&&o.memoizedState.isDehydrated)try{ko(r.containerInfo)}catch(re){Ue(e,e.return,re)}break;case 4:Lt(r,e),qt(e);break;case 13:Lt(r,e),qt(e),a=e.child,a.flags&8192&&(d=a.memoizedState!==null,a.stateNode.isHidden=d,!d||a.alternate!==null&&a.alternate.memoizedState!==null||(La=Me())),l&4&&zf(e);break;case 22:if(J=o!==null&&o.memoizedState!==null,e.mode&1?(at=(P=at)||J,Lt(r,e),at=P):Lt(r,e),qt(e),l&8192){if(P=e.memoizedState!==null,(e.stateNode.isHidden=P)&&!J&&(e.mode&1)!==0)for(Z=e,J=e.child;J!==null;){for(H=Z=J;Z!==null;){switch(W=Z,Q=W.child,W.tag){case 0:case 11:case 14:case 15:Bo(4,W,W.return);break;case 1:Ln(W,W.return);var te=W.stateNode;if(typeof te.componentWillUnmount=="function"){l=W,o=W.return;try{r=l,te.props=r.memoizedProps,te.state=r.memoizedState,te.componentWillUnmount()}catch(re){Ue(l,o,re)}}break;case 5:Ln(W,W.return);break;case 22:if(W.memoizedState!==null){Of(H);continue}}Q!==null?(Q.return=W,Z=Q):Of(H)}J=J.sibling}e:for(J=null,H=e;;){if(H.tag===5){if(J===null){J=H;try{a=H.stateNode,P?(d=a.style,typeof d.setProperty=="function"?d.setProperty("display","none","important"):d.display="none"):(y=H.stateNode,j=H.memoizedProps.style,p=j!=null&&j.hasOwnProperty("display")?j.display:null,y.style.display=fd("display",p))}catch(re){Ue(e,e.return,re)}}}else if(H.tag===6){if(J===null)try{H.stateNode.nodeValue=P?"":H.memoizedProps}catch(re){Ue(e,e.return,re)}}else if((H.tag!==22&&H.tag!==23||H.memoizedState===null||H===e)&&H.child!==null){H.child.return=H,H=H.child;continue}if(H===e)break e;for(;H.sibling===null;){if(H.return===null||H.return===e)break e;J===H&&(J=null),H=H.return}J===H&&(J=null),H.sibling.return=H.return,H=H.sibling}}break;case 19:Lt(r,e),qt(e),l&4&&zf(e);break;case 21:break;default:Lt(r,e),qt(e)}}function qt(e){var r=e.flags;if(r&2){try{e:{for(var o=e.return;o!==null;){if(Ef(o)){var l=o;break e}o=o.return}throw Error(s(160))}switch(l.tag){case 5:var a=l.stateNode;l.flags&32&&(co(a,""),l.flags&=-33);var d=$f(e);Oa(e,d,a);break;case 3:case 4:var p=l.stateNode.containerInfo,y=$f(e);Ra(e,y,p);break;default:throw Error(s(161))}}catch(j){Ue(e,e.return,j)}e.flags&=-3}r&4096&&(e.flags&=-4097)}function f0(e,r,o){Z=e,Af(e)}function Af(e,r,o){for(var l=(e.mode&1)!==0;Z!==null;){var a=Z,d=a.child;if(a.tag===22&&l){var p=a.memoizedState!==null||Zi;if(!p){var y=a.alternate,j=y!==null&&y.memoizedState!==null||at;y=Zi;var P=at;if(Zi=p,(at=j)&&!P)for(Z=a;Z!==null;)p=Z,j=p.child,p.tag===22&&p.memoizedState!==null?Nf(a):j!==null?(j.return=p,Z=j):Nf(a);for(;d!==null;)Z=d,Af(d),d=d.sibling;Z=a,Zi=y,at=P}Rf(e)}else(a.subtreeFlags&8772)!==0&&d!==null?(d.return=a,Z=d):Rf(e)}}function Rf(e){for(;Z!==null;){var r=Z;if((r.flags&8772)!==0){var o=r.alternate;try{if((r.flags&8772)!==0)switch(r.tag){case 0:case 11:case 15:at||es(5,r);break;case 1:var l=r.stateNode;if(r.flags&4&&!at)if(o===null)l.componentDidMount();else{var a=r.elementType===r.type?o.memoizedProps:Nt(r.type,o.memoizedProps);l.componentDidUpdate(a,o.memoizedState,l.__reactInternalSnapshotBeforeUpdate)}var d=r.updateQueue;d!==null&&Ru(r,d,l);break;case 3:var p=r.updateQueue;if(p!==null){if(o=null,r.child!==null)switch(r.child.tag){case 5:o=r.child.stateNode;break;case 1:o=r.child.stateNode}Ru(r,p,o)}break;case 5:var y=r.stateNode;if(o===null&&r.flags&4){o=y;var j=r.memoizedProps;switch(r.type){case"button":case"input":case"select":case"textarea":j.autoFocus&&o.focus();break;case"img":j.src&&(o.src=j.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(r.memoizedState===null){var P=r.alternate;if(P!==null){var J=P.memoizedState;if(J!==null){var H=J.dehydrated;H!==null&&ko(H)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(s(163))}at||r.flags&512&&Aa(r)}catch(W){Ue(r,r.return,W)}}if(r===e){Z=null;break}if(o=r.sibling,o!==null){o.return=r.return,Z=o;break}Z=r.return}}function Of(e){for(;Z!==null;){var r=Z;if(r===e){Z=null;break}var o=r.sibling;if(o!==null){o.return=r.return,Z=o;break}Z=r.return}}function Nf(e){for(;Z!==null;){var r=Z;try{switch(r.tag){case 0:case 11:case 15:var o=r.return;try{es(4,r)}catch(j){Ue(r,o,j)}break;case 1:var l=r.stateNode;if(typeof l.componentDidMount=="function"){var a=r.return;try{l.componentDidMount()}catch(j){Ue(r,a,j)}}var d=r.return;try{Aa(r)}catch(j){Ue(r,d,j)}break;case 5:var p=r.return;try{Aa(r)}catch(j){Ue(r,p,j)}}}catch(j){Ue(r,r.return,j)}if(r===e){Z=null;break}var y=r.sibling;if(y!==null){y.return=r.return,Z=y;break}Z=r.return}}var p0=Math.ceil,ts=D.ReactCurrentDispatcher,Na=D.ReactCurrentOwner,$t=D.ReactCurrentBatchConfig,we=0,qe=null,Be=null,nt=0,St=0,Un=Cr(0),Ke=0,Jo=null,en=0,rs=0,Da=0,Ho=null,mt=null,La=0,Mn=1/0,ar=null,ns=!1,Ua=null,zr=null,os=!1,Pr=null,is=0,Vo=0,Ma=null,ss=-1,ls=0;function dt(){return(we&6)!==0?Me():ss!==-1?ss:ss=Me()}function Ar(e){return(e.mode&1)===0?1:(we&2)!==0&&nt!==0?nt&-nt:Yg.transition!==null?(ls===0&&(ls=Ed()),ls):(e=Ie,e!==0||(e=window.event,e=e===void 0?16:Dd(e.type)),e)}function Ut(e,r,o,l){if(50<Vo)throw Vo=0,Ma=null,Error(s(185));go(e,o,l),((we&2)===0||e!==qe)&&(e===qe&&((we&2)===0&&(rs|=o),Ke===4&&Rr(e,nt)),gt(e,l),o===1&&we===0&&(r.mode&1)===0&&(Mn=Me()+500,Oi&&_r()))}function gt(e,r){var o=e.callbackNode;Ym(e,r);var l=gi(e,e===qe?nt:0);if(l===0)o!==null&&Cd(o),e.callbackNode=null,e.callbackPriority=0;else if(r=l&-l,e.callbackPriority!==r){if(o!=null&&Cd(o),r===1)e.tag===0?qg(Lf.bind(null,e)):ju(Lf.bind(null,e)),Hg(function(){(we&6)===0&&_r()}),o=null;else{switch($d(l)){case 1:o=vl;break;case 4:o=Id;break;case 16:o=fi;break;case 536870912:o=_d;break;default:o=fi}o=Vf(o,Df.bind(null,e))}e.callbackPriority=r,e.callbackNode=o}}function Df(e,r){if(ss=-1,ls=0,(we&6)!==0)throw Error(s(327));var o=e.callbackNode;if(Fn()&&e.callbackNode!==o)return null;var l=gi(e,e===qe?nt:0);if(l===0)return null;if((l&30)!==0||(l&e.expiredLanes)!==0||r)r=as(e,l);else{r=l;var a=we;we|=2;var d=Mf();(qe!==e||nt!==r)&&(ar=null,Mn=Me()+500,rn(e,r));do try{g0();break}catch(y){Uf(e,y)}while(!0);oa(),ts.current=d,we=a,Be!==null?r=0:(qe=null,nt=0,r=Ke)}if(r!==0){if(r===2&&(a=wl(e),a!==0&&(l=a,r=Fa(e,a))),r===1)throw o=Jo,rn(e,0),Rr(e,l),gt(e,Me()),o;if(r===6)Rr(e,l);else{if(a=e.current.alternate,(l&30)===0&&!h0(a)&&(r=as(e,l),r===2&&(d=wl(e),d!==0&&(l=d,r=Fa(e,d))),r===1))throw o=Jo,rn(e,0),Rr(e,l),gt(e,Me()),o;switch(e.finishedWork=a,e.finishedLanes=l,r){case 0:case 1:throw Error(s(345));case 2:nn(e,mt,ar);break;case 3:if(Rr(e,l),(l&130023424)===l&&(r=La+500-Me(),10<r)){if(gi(e,0)!==0)break;if(a=e.suspendedLanes,(a&l)!==l){dt(),e.pingedLanes|=e.suspendedLanes&a;break}e.timeoutHandle=Kl(nn.bind(null,e,mt,ar),r);break}nn(e,mt,ar);break;case 4:if(Rr(e,l),(l&4194240)===l)break;for(r=e.eventTimes,a=-1;0<l;){var p=31-At(l);d=1<<p,p=r[p],p>a&&(a=p),l&=~d}if(l=a,l=Me()-l,l=(120>l?120:480>l?480:1080>l?1080:1920>l?1920:3e3>l?3e3:4320>l?4320:1960*p0(l/1960))-l,10<l){e.timeoutHandle=Kl(nn.bind(null,e,mt,ar),l);break}nn(e,mt,ar);break;case 5:nn(e,mt,ar);break;default:throw Error(s(329))}}}return gt(e,Me()),e.callbackNode===o?Df.bind(null,e):null}function Fa(e,r){var o=Ho;return e.current.memoizedState.isDehydrated&&(rn(e,r).flags|=256),e=as(e,r),e!==2&&(r=mt,mt=o,r!==null&&Wa(r)),e}function Wa(e){mt===null?mt=e:mt.push.apply(mt,e)}function h0(e){for(var r=e;;){if(r.flags&16384){var o=r.updateQueue;if(o!==null&&(o=o.stores,o!==null))for(var l=0;l<o.length;l++){var a=o[l],d=a.getSnapshot;a=a.value;try{if(!Rt(d(),a))return!1}catch{return!1}}}if(o=r.child,r.subtreeFlags&16384&&o!==null)o.return=r,r=o;else{if(r===e)break;for(;r.sibling===null;){if(r.return===null||r.return===e)return!0;r=r.return}r.sibling.return=r.return,r=r.sibling}}return!0}function Rr(e,r){for(r&=~Da,r&=~rs,e.suspendedLanes|=r,e.pingedLanes&=~r,e=e.expirationTimes;0<r;){var o=31-At(r),l=1<<o;e[o]=-1,r&=~l}}function Lf(e){if((we&6)!==0)throw Error(s(327));Fn();var r=gi(e,0);if((r&1)===0)return gt(e,Me()),null;var o=as(e,r);if(e.tag!==0&&o===2){var l=wl(e);l!==0&&(r=l,o=Fa(e,l))}if(o===1)throw o=Jo,rn(e,0),Rr(e,r),gt(e,Me()),o;if(o===6)throw Error(s(345));return e.finishedWork=e.current.alternate,e.finishedLanes=r,nn(e,mt,ar),gt(e,Me()),null}function Ba(e,r){var o=we;we|=1;try{return e(r)}finally{we=o,we===0&&(Mn=Me()+500,Oi&&_r())}}function tn(e){Pr!==null&&Pr.tag===0&&(we&6)===0&&Fn();var r=we;we|=1;var o=$t.transition,l=Ie;try{if($t.transition=null,Ie=1,e)return e()}finally{Ie=l,$t.transition=o,we=r,(we&6)===0&&_r()}}function Ja(){St=Un.current,ze(Un)}function rn(e,r){e.finishedWork=null,e.finishedLanes=0;var o=e.timeoutHandle;if(o!==-1&&(e.timeoutHandle=-1,Jg(o)),Be!==null)for(o=Be.return;o!==null;){var l=o;switch(Zl(l),l.tag){case 1:l=l.type.childContextTypes,l!=null&&Ai();break;case 3:Nn(),ze(ft),ze(it),fa();break;case 5:da(l);break;case 4:Nn();break;case 13:ze(Ne);break;case 19:ze(Ne);break;case 10:ia(l.type._context);break;case 22:case 23:Ja()}o=o.return}if(qe=e,Be=e=Or(e.current,null),nt=St=r,Ke=0,Jo=null,Da=rs=en=0,mt=Ho=null,Qr!==null){for(r=0;r<Qr.length;r++)if(o=Qr[r],l=o.interleaved,l!==null){o.interleaved=null;var a=l.next,d=o.pending;if(d!==null){var p=d.next;d.next=a,l.next=p}o.pending=l}Qr=null}return e}function Uf(e,r){do{var o=Be;try{if(oa(),Hi.current=qi,Vi){for(var l=De.memoizedState;l!==null;){var a=l.queue;a!==null&&(a.pending=null),l=l.next}Vi=!1}if(Zr=0,Ge=Ve=De=null,Lo=!1,Uo=0,Na.current=null,o===null||o.return===null){Ke=1,Jo=r,Be=null;break}e:{var d=e,p=o.return,y=o,j=r;if(r=nt,y.flags|=32768,j!==null&&typeof j=="object"&&typeof j.then=="function"){var P=j,J=y,H=J.tag;if((J.mode&1)===0&&(H===0||H===11||H===15)){var W=J.alternate;W?(J.updateQueue=W.updateQueue,J.memoizedState=W.memoizedState,J.lanes=W.lanes):(J.updateQueue=null,J.memoizedState=null)}var Q=df(p);if(Q!==null){Q.flags&=-257,uf(Q,p,y,d,r),Q.mode&1&&cf(d,P,r),r=Q,j=P;var te=r.updateQueue;if(te===null){var re=new Set;re.add(j),r.updateQueue=re}else te.add(j);break e}else{if((r&1)===0){cf(d,P,r),Ha();break e}j=Error(s(426))}}else if(Oe&&y.mode&1){var Fe=df(p);if(Fe!==null){(Fe.flags&65536)===0&&(Fe.flags|=256),uf(Fe,p,y,d,r),ra(Dn(j,y));break e}}d=j=Dn(j,y),Ke!==4&&(Ke=2),Ho===null?Ho=[d]:Ho.push(d),d=p;do{switch(d.tag){case 3:d.flags|=65536,r&=-r,d.lanes|=r;var $=lf(d,j,r);Au(d,$);break e;case 1:y=j;var I=d.type,T=d.stateNode;if((d.flags&128)===0&&(typeof I.getDerivedStateFromError=="function"||T!==null&&typeof T.componentDidCatch=="function"&&(zr===null||!zr.has(T)))){d.flags|=65536,r&=-r,d.lanes|=r;var V=af(d,y,r);Au(d,V);break e}}d=d.return}while(d!==null)}Wf(o)}catch(ne){r=ne,Be===o&&o!==null&&(Be=o=o.return);continue}break}while(!0)}function Mf(){var e=ts.current;return ts.current=qi,e===null?qi:e}function Ha(){(Ke===0||Ke===3||Ke===2)&&(Ke=4),qe===null||(en&268435455)===0&&(rs&268435455)===0||Rr(qe,nt)}function as(e,r){var o=we;we|=2;var l=Mf();(qe!==e||nt!==r)&&(ar=null,rn(e,r));do try{m0();break}catch(a){Uf(e,a)}while(!0);if(oa(),we=o,ts.current=l,Be!==null)throw Error(s(261));return qe=null,nt=0,Ke}function m0(){for(;Be!==null;)Ff(Be)}function g0(){for(;Be!==null&&!Fm();)Ff(Be)}function Ff(e){var r=Hf(e.alternate,e,St);e.memoizedProps=e.pendingProps,r===null?Wf(e):Be=r,Na.current=null}function Wf(e){var r=e;do{var o=r.alternate;if(e=r.return,(r.flags&32768)===0){if(o=a0(o,r,St),o!==null){Be=o;return}}else{if(o=c0(o,r),o!==null){o.flags&=32767,Be=o;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{Ke=6,Be=null;return}}if(r=r.sibling,r!==null){Be=r;return}Be=r=e}while(r!==null);Ke===0&&(Ke=5)}function nn(e,r,o){var l=Ie,a=$t.transition;try{$t.transition=null,Ie=1,y0(e,r,o,l)}finally{$t.transition=a,Ie=l}return null}function y0(e,r,o,l){do Fn();while(Pr!==null);if((we&6)!==0)throw Error(s(327));o=e.finishedWork;var a=e.finishedLanes;if(o===null)return null;if(e.finishedWork=null,e.finishedLanes=0,o===e.current)throw Error(s(177));e.callbackNode=null,e.callbackPriority=0;var d=o.lanes|o.childLanes;if(Qm(e,d),e===qe&&(Be=qe=null,nt=0),(o.subtreeFlags&2064)===0&&(o.flags&2064)===0||os||(os=!0,Vf(fi,function(){return Fn(),null})),d=(o.flags&15990)!==0,(o.subtreeFlags&15990)!==0||d){d=$t.transition,$t.transition=null;var p=Ie;Ie=1;var y=we;we|=4,Na.current=null,u0(e,o),Pf(o,e),Dg(Hl),vi=!!Jl,Hl=Jl=null,e.current=o,f0(o),Wm(),we=y,Ie=p,$t.transition=d}else e.current=o;if(os&&(os=!1,Pr=e,is=a),d=e.pendingLanes,d===0&&(zr=null),Hm(o.stateNode),gt(e,Me()),r!==null)for(l=e.onRecoverableError,o=0;o<r.length;o++)a=r[o],l(a.value,{componentStack:a.stack,digest:a.digest});if(ns)throw ns=!1,e=Ua,Ua=null,e;return(is&1)!==0&&e.tag!==0&&Fn(),d=e.pendingLanes,(d&1)!==0?e===Ma?Vo++:(Vo=0,Ma=e):Vo=0,_r(),null}function Fn(){if(Pr!==null){var e=$d(is),r=$t.transition,o=Ie;try{if($t.transition=null,Ie=16>e?16:e,Pr===null)var l=!1;else{if(e=Pr,Pr=null,is=0,(we&6)!==0)throw Error(s(331));var a=we;for(we|=4,Z=e.current;Z!==null;){var d=Z,p=d.child;if((Z.flags&16)!==0){var y=d.deletions;if(y!==null){for(var j=0;j<y.length;j++){var P=y[j];for(Z=P;Z!==null;){var J=Z;switch(J.tag){case 0:case 11:case 15:Bo(8,J,d)}var H=J.child;if(H!==null)H.return=J,Z=H;else for(;Z!==null;){J=Z;var W=J.sibling,Q=J.return;if(_f(J),J===P){Z=null;break}if(W!==null){W.return=Q,Z=W;break}Z=Q}}}var te=d.alternate;if(te!==null){var re=te.child;if(re!==null){te.child=null;do{var Fe=re.sibling;re.sibling=null,re=Fe}while(re!==null)}}Z=d}}if((d.subtreeFlags&2064)!==0&&p!==null)p.return=d,Z=p;else e:for(;Z!==null;){if(d=Z,(d.flags&2048)!==0)switch(d.tag){case 0:case 11:case 15:Bo(9,d,d.return)}var $=d.sibling;if($!==null){$.return=d.return,Z=$;break e}Z=d.return}}var I=e.current;for(Z=I;Z!==null;){p=Z;var T=p.child;if((p.subtreeFlags&2064)!==0&&T!==null)T.return=p,Z=T;else e:for(p=I;Z!==null;){if(y=Z,(y.flags&2048)!==0)try{switch(y.tag){case 0:case 11:case 15:es(9,y)}}catch(ne){Ue(y,y.return,ne)}if(y===p){Z=null;break e}var V=y.sibling;if(V!==null){V.return=y.return,Z=V;break e}Z=y.return}}if(we=a,_r(),Ht&&typeof Ht.onPostCommitFiberRoot=="function")try{Ht.onPostCommitFiberRoot(pi,e)}catch{}l=!0}return l}finally{Ie=o,$t.transition=r}}return!1}function Bf(e,r,o){r=Dn(o,r),r=lf(e,r,1),e=$r(e,r,1),r=dt(),e!==null&&(go(e,1,r),gt(e,r))}function Ue(e,r,o){if(e.tag===3)Bf(e,e,o);else for(;r!==null;){if(r.tag===3){Bf(r,e,o);break}else if(r.tag===1){var l=r.stateNode;if(typeof r.type.getDerivedStateFromError=="function"||typeof l.componentDidCatch=="function"&&(zr===null||!zr.has(l))){e=Dn(o,e),e=af(r,e,1),r=$r(r,e,1),e=dt(),r!==null&&(go(r,1,e),gt(r,e));break}}r=r.return}}function x0(e,r,o){var l=e.pingCache;l!==null&&l.delete(r),r=dt(),e.pingedLanes|=e.suspendedLanes&o,qe===e&&(nt&o)===o&&(Ke===4||Ke===3&&(nt&130023424)===nt&&500>Me()-La?rn(e,0):Da|=o),gt(e,r)}function Jf(e,r){r===0&&((e.mode&1)===0?r=1:(r=mi,mi<<=1,(mi&130023424)===0&&(mi=4194304)));var o=dt();e=ir(e,r),e!==null&&(go(e,r,o),gt(e,o))}function v0(e){var r=e.memoizedState,o=0;r!==null&&(o=r.retryLane),Jf(e,o)}function w0(e,r){var o=0;switch(e.tag){case 13:var l=e.stateNode,a=e.memoizedState;a!==null&&(o=a.retryLane);break;case 19:l=e.stateNode;break;default:throw Error(s(314))}l!==null&&l.delete(r),Jf(e,o)}var Hf;Hf=function(e,r,o){if(e!==null)if(e.memoizedProps!==r.pendingProps||ft.current)ht=!0;else{if((e.lanes&o)===0&&(r.flags&128)===0)return ht=!1,l0(e,r,o);ht=(e.flags&131072)!==0}else ht=!1,Oe&&(r.flags&1048576)!==0&&Su(r,Di,r.index);switch(r.lanes=0,r.tag){case 2:var l=r.type;Xi(e,r),e=r.pendingProps;var a=$n(r,it.current);On(r,o),a=ma(null,r,l,e,a,o);var d=ga();return r.flags|=1,typeof a=="object"&&a!==null&&typeof a.render=="function"&&a.$$typeof===void 0?(r.tag=1,r.memoizedState=null,r.updateQueue=null,pt(l)?(d=!0,Ri(r)):d=!1,r.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,aa(r),a.updater=Yi,r.stateNode=a,a._reactInternals=r,ja(r,l,e,o),r=Ia(null,r,l,!0,d,o)):(r.tag=0,Oe&&d&&Xl(r),ct(null,r,a,o),r=r.child),r;case 16:l=r.elementType;e:{switch(Xi(e,r),e=r.pendingProps,a=l._init,l=a(l._payload),r.type=l,a=r.tag=j0(l),e=Nt(l,e),a){case 0:r=Ca(null,r,l,e,o);break e;case 1:r=yf(null,r,l,e,o);break e;case 11:r=ff(null,r,l,e,o);break e;case 14:r=pf(null,r,l,Nt(l.type,e),o);break e}throw Error(s(306,l,""))}return r;case 0:return l=r.type,a=r.pendingProps,a=r.elementType===l?a:Nt(l,a),Ca(e,r,l,a,o);case 1:return l=r.type,a=r.pendingProps,a=r.elementType===l?a:Nt(l,a),yf(e,r,l,a,o);case 3:e:{if(xf(r),e===null)throw Error(s(387));l=r.pendingProps,d=r.memoizedState,a=d.element,Pu(e,r),Bi(r,l,null,o);var p=r.memoizedState;if(l=p.element,d.isDehydrated)if(d={element:l,isDehydrated:!1,cache:p.cache,pendingSuspenseBoundaries:p.pendingSuspenseBoundaries,transitions:p.transitions},r.updateQueue.baseState=d,r.memoizedState=d,r.flags&256){a=Dn(Error(s(423)),r),r=vf(e,r,l,o,a);break e}else if(l!==a){a=Dn(Error(s(424)),r),r=vf(e,r,l,o,a);break e}else for(jt=br(r.stateNode.containerInfo.firstChild),kt=r,Oe=!0,Ot=null,o=Tu(r,null,l,o),r.child=o;o;)o.flags=o.flags&-3|4096,o=o.sibling;else{if(Pn(),l===a){r=lr(e,r,o);break e}ct(e,r,l,o)}r=r.child}return r;case 5:return Ou(r),e===null&&ta(r),l=r.type,a=r.pendingProps,d=e!==null?e.memoizedProps:null,p=a.children,Vl(l,a)?p=null:d!==null&&Vl(l,d)&&(r.flags|=32),gf(e,r),ct(e,r,p,o),r.child;case 6:return e===null&&ta(r),null;case 13:return wf(e,r,o);case 4:return ca(r,r.stateNode.containerInfo),l=r.pendingProps,e===null?r.child=An(r,null,l,o):ct(e,r,l,o),r.child;case 11:return l=r.type,a=r.pendingProps,a=r.elementType===l?a:Nt(l,a),ff(e,r,l,a,o);case 7:return ct(e,r,r.pendingProps,o),r.child;case 8:return ct(e,r,r.pendingProps.children,o),r.child;case 12:return ct(e,r,r.pendingProps.children,o),r.child;case 10:e:{if(l=r.type._context,a=r.pendingProps,d=r.memoizedProps,p=a.value,Ee(Mi,l._currentValue),l._currentValue=p,d!==null)if(Rt(d.value,p)){if(d.children===a.children&&!ft.current){r=lr(e,r,o);break e}}else for(d=r.child,d!==null&&(d.return=r);d!==null;){var y=d.dependencies;if(y!==null){p=d.child;for(var j=y.firstContext;j!==null;){if(j.context===l){if(d.tag===1){j=sr(-1,o&-o),j.tag=2;var P=d.updateQueue;if(P!==null){P=P.shared;var J=P.pending;J===null?j.next=j:(j.next=J.next,J.next=j),P.pending=j}}d.lanes|=o,j=d.alternate,j!==null&&(j.lanes|=o),sa(d.return,o,r),y.lanes|=o;break}j=j.next}}else if(d.tag===10)p=d.type===r.type?null:d.child;else if(d.tag===18){if(p=d.return,p===null)throw Error(s(341));p.lanes|=o,y=p.alternate,y!==null&&(y.lanes|=o),sa(p,o,r),p=d.sibling}else p=d.child;if(p!==null)p.return=d;else for(p=d;p!==null;){if(p===r){p=null;break}if(d=p.sibling,d!==null){d.return=p.return,p=d;break}p=p.return}d=p}ct(e,r,a.children,o),r=r.child}return r;case 9:return a=r.type,l=r.pendingProps.children,On(r,o),a=_t(a),l=l(a),r.flags|=1,ct(e,r,l,o),r.child;case 14:return l=r.type,a=Nt(l,r.pendingProps),a=Nt(l.type,a),pf(e,r,l,a,o);case 15:return hf(e,r,r.type,r.pendingProps,o);case 17:return l=r.type,a=r.pendingProps,a=r.elementType===l?a:Nt(l,a),Xi(e,r),r.tag=1,pt(l)?(e=!0,Ri(r)):e=!1,On(r,o),of(r,l,a),ja(r,l,a,o),Ia(null,r,l,!0,e,o);case 19:return jf(e,r,o);case 22:return mf(e,r,o)}throw Error(s(156,r.tag))};function Vf(e,r){return bd(e,r)}function k0(e,r,o,l){this.tag=e,this.key=o,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=r,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=l,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Tt(e,r,o,l){return new k0(e,r,o,l)}function Va(e){return e=e.prototype,!(!e||!e.isReactComponent)}function j0(e){if(typeof e=="function")return Va(e)?1:0;if(e!=null){if(e=e.$$typeof,e===oe)return 11;if(e===_e)return 14}return 2}function Or(e,r){var o=e.alternate;return o===null?(o=Tt(e.tag,r,e.key,e.mode),o.elementType=e.elementType,o.type=e.type,o.stateNode=e.stateNode,o.alternate=e,e.alternate=o):(o.pendingProps=r,o.type=e.type,o.flags=0,o.subtreeFlags=0,o.deletions=null),o.flags=e.flags&14680064,o.childLanes=e.childLanes,o.lanes=e.lanes,o.child=e.child,o.memoizedProps=e.memoizedProps,o.memoizedState=e.memoizedState,o.updateQueue=e.updateQueue,r=e.dependencies,o.dependencies=r===null?null:{lanes:r.lanes,firstContext:r.firstContext},o.sibling=e.sibling,o.index=e.index,o.ref=e.ref,o}function cs(e,r,o,l,a,d){var p=2;if(l=e,typeof e=="function")Va(e)&&(p=1);else if(typeof e=="string")p=5;else e:switch(e){case N:return on(o.children,a,d,r);case B:p=8,a|=8;break;case ee:return e=Tt(12,o,r,a|2),e.elementType=ee,e.lanes=d,e;case G:return e=Tt(13,o,r,a),e.elementType=G,e.lanes=d,e;case ce:return e=Tt(19,o,r,a),e.elementType=ce,e.lanes=d,e;case ve:return ds(o,a,d,r);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case Y:p=10;break e;case le:p=9;break e;case oe:p=11;break e;case _e:p=14;break e;case xe:p=16,l=null;break e}throw Error(s(130,e==null?e:typeof e,""))}return r=Tt(p,o,r,a),r.elementType=e,r.type=l,r.lanes=d,r}function on(e,r,o,l){return e=Tt(7,e,l,r),e.lanes=o,e}function ds(e,r,o,l){return e=Tt(22,e,l,r),e.elementType=ve,e.lanes=o,e.stateNode={isHidden:!1},e}function Ka(e,r,o){return e=Tt(6,e,null,r),e.lanes=o,e}function Ga(e,r,o){return r=Tt(4,e.children!==null?e.children:[],e.key,r),r.lanes=o,r.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},r}function S0(e,r,o,l,a){this.tag=r,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=kl(0),this.expirationTimes=kl(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=kl(0),this.identifierPrefix=l,this.onRecoverableError=a,this.mutableSourceEagerHydrationData=null}function qa(e,r,o,l,a,d,p,y,j){return e=new S0(e,r,o,y,j),r===1?(r=1,d===!0&&(r|=8)):r=0,d=Tt(3,null,null,r),e.current=d,d.stateNode=e,d.memoizedState={element:l,isDehydrated:o,cache:null,transitions:null,pendingSuspenseBoundaries:null},aa(d),e}function b0(e,r,o){var l=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:F,key:l==null?null:""+l,children:e,containerInfo:r,implementation:o}}function Kf(e){if(!e)return Ir;e=e._reactInternals;e:{if(Vr(e)!==e||e.tag!==1)throw Error(s(170));var r=e;do{switch(r.tag){case 3:r=r.stateNode.context;break e;case 1:if(pt(r.type)){r=r.stateNode.__reactInternalMemoizedMergedChildContext;break e}}r=r.return}while(r!==null);throw Error(s(171))}if(e.tag===1){var o=e.type;if(pt(o))return wu(e,o,r)}return r}function Gf(e,r,o,l,a,d,p,y,j){return e=qa(o,l,!0,e,a,d,p,y,j),e.context=Kf(null),o=e.current,l=dt(),a=Ar(o),d=sr(l,a),d.callback=r??null,$r(o,d,a),e.current.lanes=a,go(e,a,l),gt(e,l),e}function us(e,r,o,l){var a=r.current,d=dt(),p=Ar(a);return o=Kf(o),r.context===null?r.context=o:r.pendingContext=o,r=sr(d,p),r.payload={element:e},l=l===void 0?null:l,l!==null&&(r.callback=l),e=$r(a,r,p),e!==null&&(Ut(e,a,p,d),Wi(e,a,p)),p}function fs(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function qf(e,r){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var o=e.retryLane;e.retryLane=o!==0&&o<r?o:r}}function Ya(e,r){qf(e,r),(e=e.alternate)&&qf(e,r)}function C0(){return null}var Yf=typeof reportError=="function"?reportError:function(e){console.error(e)};function Qa(e){this._internalRoot=e}ps.prototype.render=Qa.prototype.render=function(e){var r=this._internalRoot;if(r===null)throw Error(s(409));us(e,r,null,null)},ps.prototype.unmount=Qa.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var r=e.containerInfo;tn(function(){us(null,e,null,null)}),r[tr]=null}};function ps(e){this._internalRoot=e}ps.prototype.unstable_scheduleHydration=function(e){if(e){var r=Pd();e={blockedOn:null,target:e,priority:r};for(var o=0;o<kr.length&&r!==0&&r<kr[o].priority;o++);kr.splice(o,0,e),o===0&&Od(e)}};function Xa(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function hs(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function Qf(){}function I0(e,r,o,l,a){if(a){if(typeof l=="function"){var d=l;l=function(){var P=fs(p);d.call(P)}}var p=Gf(r,l,e,0,null,!1,!1,"",Qf);return e._reactRootContainer=p,e[tr]=p.current,To(e.nodeType===8?e.parentNode:e),tn(),p}for(;a=e.lastChild;)e.removeChild(a);if(typeof l=="function"){var y=l;l=function(){var P=fs(j);y.call(P)}}var j=qa(e,0,!1,null,null,!1,!1,"",Qf);return e._reactRootContainer=j,e[tr]=j.current,To(e.nodeType===8?e.parentNode:e),tn(function(){us(r,j,o,l)}),j}function ms(e,r,o,l,a){var d=o._reactRootContainer;if(d){var p=d;if(typeof a=="function"){var y=a;a=function(){var j=fs(p);y.call(j)}}us(r,p,e,a)}else p=I0(o,r,e,a,l);return fs(p)}Td=function(e){switch(e.tag){case 3:var r=e.stateNode;if(r.current.memoizedState.isDehydrated){var o=mo(r.pendingLanes);o!==0&&(jl(r,o|1),gt(r,Me()),(we&6)===0&&(Mn=Me()+500,_r()))}break;case 13:tn(function(){var l=ir(e,1);if(l!==null){var a=dt();Ut(l,e,1,a)}}),Ya(e,1)}},Sl=function(e){if(e.tag===13){var r=ir(e,134217728);if(r!==null){var o=dt();Ut(r,e,134217728,o)}Ya(e,134217728)}},zd=function(e){if(e.tag===13){var r=Ar(e),o=ir(e,r);if(o!==null){var l=dt();Ut(o,e,r,l)}Ya(e,r)}},Pd=function(){return Ie},Ad=function(e,r){var o=Ie;try{return Ie=e,r()}finally{Ie=o}},ml=function(e,r,o){switch(r){case"input":if(ll(e,o),r=o.name,o.type==="radio"&&r!=null){for(o=e;o.parentNode;)o=o.parentNode;for(o=o.querySelectorAll("input[name="+JSON.stringify(""+r)+'][type="radio"]'),r=0;r<o.length;r++){var l=o[r];if(l!==e&&l.form===e.form){var a=Pi(l);if(!a)throw Error(s(90));Pt(l),ll(l,a)}}}break;case"textarea":ad(e,o);break;case"select":r=o.value,r!=null&&yn(e,!!o.multiple,r,!1)}},yd=Ba,xd=tn;var _0={usingClientEntryPoint:!1,Events:[Ao,_n,Pi,md,gd,Ba]},Ko={findFiberByHostInstance:Kr,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},E0={bundleType:Ko.bundleType,version:Ko.version,rendererPackageName:Ko.rendererPackageName,rendererConfig:Ko.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:D.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=jd(e),e===null?null:e.stateNode},findFiberByHostInstance:Ko.findFiberByHostInstance||C0,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var gs=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!gs.isDisabled&&gs.supportsFiber)try{pi=gs.inject(E0),Ht=gs}catch{}}return yt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=_0,yt.createPortal=function(e,r){var o=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Xa(r))throw Error(s(200));return b0(e,r,null,o)},yt.createRoot=function(e,r){if(!Xa(e))throw Error(s(299));var o=!1,l="",a=Yf;return r!=null&&(r.unstable_strictMode===!0&&(o=!0),r.identifierPrefix!==void 0&&(l=r.identifierPrefix),r.onRecoverableError!==void 0&&(a=r.onRecoverableError)),r=qa(e,1,!1,null,null,o,!1,l,a),e[tr]=r.current,To(e.nodeType===8?e.parentNode:e),new Qa(r)},yt.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var r=e._reactInternals;if(r===void 0)throw typeof e.render=="function"?Error(s(188)):(e=Object.keys(e).join(","),Error(s(268,e)));return e=jd(r),e=e===null?null:e.stateNode,e},yt.flushSync=function(e){return tn(e)},yt.hydrate=function(e,r,o){if(!hs(r))throw Error(s(200));return ms(null,e,r,!0,o)},yt.hydrateRoot=function(e,r,o){if(!Xa(e))throw Error(s(405));var l=o!=null&&o.hydratedSources||null,a=!1,d="",p=Yf;if(o!=null&&(o.unstable_strictMode===!0&&(a=!0),o.identifierPrefix!==void 0&&(d=o.identifierPrefix),o.onRecoverableError!==void 0&&(p=o.onRecoverableError)),r=Gf(r,null,e,1,o??null,a,!1,d,p),e[tr]=r.current,To(e),l)for(e=0;e<l.length;e++)o=l[e],a=o._getVersion,a=a(o._source),r.mutableSourceEagerHydrationData==null?r.mutableSourceEagerHydrationData=[o,a]:r.mutableSourceEagerHydrationData.push(o,a);return new ps(r)},yt.render=function(e,r,o){if(!hs(r))throw Error(s(200));return ms(null,e,r,!1,o)},yt.unmountComponentAtNode=function(e){if(!hs(e))throw Error(s(40));return e._reactRootContainer?(tn(function(){ms(null,null,e,!1,function(){e._reactRootContainer=null,e[tr]=null})}),!0):!1},yt.unstable_batchedUpdates=Ba,yt.unstable_renderSubtreeIntoContainer=function(e,r,o,l){if(!hs(o))throw Error(s(200));if(e==null||e._reactInternals===void 0)throw Error(s(38));return ms(e,r,o,!1,l)},yt.version="18.3.1-next-f1338f8080-20240426",yt}var ip;function fh(){if(ip)return tc.exports;ip=1;function t(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(t)}catch(i){console.error(i)}}return t(),tc.exports=D0(),tc.exports}var sp;function L0(){if(sp)return ys;sp=1;var t=fh();return ys.createRoot=t.createRoot,ys.hydrateRoot=t.hydrateRoot,ys}var U0=L0();const M0=uh(U0);fh();/**
 * @remix-run/router v1.23.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function ti(){return ti=Object.assign?Object.assign.bind():function(t){for(var i=1;i<arguments.length;i++){var s=arguments[i];for(var c in s)Object.prototype.hasOwnProperty.call(s,c)&&(t[c]=s[c])}return t},ti.apply(this,arguments)}var Mr;(function(t){t.Pop="POP",t.Push="PUSH",t.Replace="REPLACE"})(Mr||(Mr={}));const lp="popstate";function F0(t){t===void 0&&(t={});function i(c,u){let{pathname:h,search:f,hash:v}=c.location;return Sc("",{pathname:h,search:f,hash:v},u.state&&u.state.usr||null,u.state&&u.state.key||"default")}function s(c,u){return typeof u=="string"?u:Ns(u)}return B0(i,s,null,t)}function Le(t,i){if(t===!1||t===null||typeof t>"u")throw new Error(i)}function ph(t,i){if(!t){typeof console<"u"&&console.warn(i);try{throw new Error(i)}catch{}}}function W0(){return Math.random().toString(36).substr(2,8)}function ap(t,i){return{usr:t.state,key:t.key,idx:i}}function Sc(t,i,s,c){return s===void 0&&(s=null),ti({pathname:typeof t=="string"?t:t.pathname,search:"",hash:""},typeof i=="string"?no(i):i,{state:s,key:i&&i.key||c||W0()})}function Ns(t){let{pathname:i="/",search:s="",hash:c=""}=t;return s&&s!=="?"&&(i+=s.charAt(0)==="?"?s:"?"+s),c&&c!=="#"&&(i+=c.charAt(0)==="#"?c:"#"+c),i}function no(t){let i={};if(t){let s=t.indexOf("#");s>=0&&(i.hash=t.substr(s),t=t.substr(0,s));let c=t.indexOf("?");c>=0&&(i.search=t.substr(c),t=t.substr(0,c)),t&&(i.pathname=t)}return i}function B0(t,i,s,c){c===void 0&&(c={});let{window:u=document.defaultView,v5Compat:h=!1}=c,f=u.history,v=Mr.Pop,m=null,g=k();g==null&&(g=0,f.replaceState(ti({},f.state,{idx:g}),""));function k(){return(f.state||{idx:null}).idx}function w(){v=Mr.Pop;let E=k(),C=E==null?null:E-g;g=E,m&&m({action:v,location:M.location,delta:C})}function b(E,C){v=Mr.Push;let z=Sc(M.location,E,C);g=k()+1;let O=ap(z,g),D=M.createHref(z);try{f.pushState(O,"",D)}catch(A){if(A instanceof DOMException&&A.name==="DataCloneError")throw A;u.location.assign(D)}h&&m&&m({action:v,location:M.location,delta:1})}function R(E,C){v=Mr.Replace;let z=Sc(M.location,E,C);g=k();let O=ap(z,g),D=M.createHref(z);f.replaceState(O,"",D),h&&m&&m({action:v,location:M.location,delta:0})}function L(E){let C=u.location.origin!=="null"?u.location.origin:u.location.href,z=typeof E=="string"?E:Ns(E);return z=z.replace(/ $/,"%20"),Le(C,"No window.location.(origin|href) available to create URL for href: "+z),new URL(z,C)}let M={get action(){return v},get location(){return t(u,f)},listen(E){if(m)throw new Error("A history only accepts one active listener");return u.addEventListener(lp,w),m=E,()=>{u.removeEventListener(lp,w),m=null}},createHref(E){return i(u,E)},createURL:L,encodeLocation(E){let C=L(E);return{pathname:C.pathname,search:C.search,hash:C.hash}},push:b,replace:R,go(E){return f.go(E)}};return M}var cp;(function(t){t.data="data",t.deferred="deferred",t.redirect="redirect",t.error="error"})(cp||(cp={}));function J0(t,i,s){return s===void 0&&(s="/"),H0(t,i,s)}function H0(t,i,s,c){let u=typeof i=="string"?no(i):i,h=Yn(u.pathname||"/",s);if(h==null)return null;let f=hh(t);V0(f);let v=null;for(let m=0;v==null&&m<f.length;++m){let g=ny(h);v=ty(f[m],g)}return v}function hh(t,i,s,c){i===void 0&&(i=[]),s===void 0&&(s=[]),c===void 0&&(c="");let u=(h,f,v)=>{let m={relativePath:v===void 0?h.path||"":v,caseSensitive:h.caseSensitive===!0,childrenIndex:f,route:h};m.relativePath.startsWith("/")&&(Le(m.relativePath.startsWith(c),'Absolute route path "'+m.relativePath+'" nested under path '+('"'+c+'" is not valid. An absolute child route path ')+"must start with the combined path of all its parent routes."),m.relativePath=m.relativePath.slice(c.length));let g=Fr([c,m.relativePath]),k=s.concat(m);h.children&&h.children.length>0&&(Le(h.index!==!0,"Index routes must not have child routes. Please remove "+('all child routes from route path "'+g+'".')),hh(h.children,i,k,g)),!(h.path==null&&!h.index)&&i.push({path:g,score:Z0(g,h.index),routesMeta:k})};return t.forEach((h,f)=>{var v;if(h.path===""||!((v=h.path)!=null&&v.includes("?")))u(h,f);else for(let m of mh(h.path))u(h,f,m)}),i}function mh(t){let i=t.split("/");if(i.length===0)return[];let[s,...c]=i,u=s.endsWith("?"),h=s.replace(/\?$/,"");if(c.length===0)return u?[h,""]:[h];let f=mh(c.join("/")),v=[];return v.push(...f.map(m=>m===""?h:[h,m].join("/"))),u&&v.push(...f),v.map(m=>t.startsWith("/")&&m===""?"/":m)}function V0(t){t.sort((i,s)=>i.score!==s.score?s.score-i.score:ey(i.routesMeta.map(c=>c.childrenIndex),s.routesMeta.map(c=>c.childrenIndex)))}const K0=/^:[\w-]+$/,G0=3,q0=2,Y0=1,Q0=10,X0=-2,dp=t=>t==="*";function Z0(t,i){let s=t.split("/"),c=s.length;return s.some(dp)&&(c+=X0),i&&(c+=q0),s.filter(u=>!dp(u)).reduce((u,h)=>u+(K0.test(h)?G0:h===""?Y0:Q0),c)}function ey(t,i){return t.length===i.length&&t.slice(0,-1).every((c,u)=>c===i[u])?t[t.length-1]-i[i.length-1]:0}function ty(t,i,s){let{routesMeta:c}=t,u={},h="/",f=[];for(let v=0;v<c.length;++v){let m=c[v],g=v===c.length-1,k=h==="/"?i:i.slice(h.length)||"/",w=bc({path:m.relativePath,caseSensitive:m.caseSensitive,end:g},k),b=m.route;if(!w)return null;Object.assign(u,w.params),f.push({params:u,pathname:Fr([h,w.pathname]),pathnameBase:ly(Fr([h,w.pathnameBase])),route:b}),w.pathnameBase!=="/"&&(h=Fr([h,w.pathnameBase]))}return f}function bc(t,i){typeof t=="string"&&(t={path:t,caseSensitive:!1,end:!0});let[s,c]=ry(t.path,t.caseSensitive,t.end),u=i.match(s);if(!u)return null;let h=u[0],f=h.replace(/(.)\/+$/,"$1"),v=u.slice(1);return{params:c.reduce((g,k,w)=>{let{paramName:b,isOptional:R}=k;if(b==="*"){let M=v[w]||"";f=h.slice(0,h.length-M.length).replace(/(.)\/+$/,"$1")}const L=v[w];return R&&!L?g[b]=void 0:g[b]=(L||"").replace(/%2F/g,"/"),g},{}),pathname:h,pathnameBase:f,pattern:t}}function ry(t,i,s){i===void 0&&(i=!1),s===void 0&&(s=!0),ph(t==="*"||!t.endsWith("*")||t.endsWith("/*"),'Route path "'+t+'" will be treated as if it were '+('"'+t.replace(/\*$/,"/*")+'" because the `*` character must ')+"always follow a `/` in the pattern. To get rid of this warning, "+('please change the route path to "'+t.replace(/\*$/,"/*")+'".'));let c=[],u="^"+t.replace(/\/*\*?$/,"").replace(/^\/*/,"/").replace(/[\\.*+^${}|()[\]]/g,"\\$&").replace(/\/:([\w-]+)(\?)?/g,(f,v,m)=>(c.push({paramName:v,isOptional:m!=null}),m?"/?([^\\/]+)?":"/([^\\/]+)"));return t.endsWith("*")?(c.push({paramName:"*"}),u+=t==="*"||t==="/*"?"(.*)$":"(?:\\/(.+)|\\/*)$"):s?u+="\\/*$":t!==""&&t!=="/"&&(u+="(?:(?=\\/|$))"),[new RegExp(u,i?void 0:"i"),c]}function ny(t){try{return t.split("/").map(i=>decodeURIComponent(i).replace(/\//g,"%2F")).join("/")}catch(i){return ph(!1,'The URL path "'+t+'" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent '+("encoding ("+i+").")),t}}function Yn(t,i){if(i==="/")return t;if(!t.toLowerCase().startsWith(i.toLowerCase()))return null;let s=i.endsWith("/")?i.length-1:i.length,c=t.charAt(s);return c&&c!=="/"?null:t.slice(s)||"/"}function oy(t,i){i===void 0&&(i="/");let{pathname:s,search:c="",hash:u=""}=typeof t=="string"?no(t):t;return{pathname:s?s.startsWith("/")?s:iy(s,i):i,search:ay(c),hash:cy(u)}}function iy(t,i){let s=i.replace(/\/+$/,"").split("/");return t.split("/").forEach(u=>{u===".."?s.length>1&&s.pop():u!=="."&&s.push(u)}),s.length>1?s.join("/"):"/"}function oc(t,i,s,c){return"Cannot include a '"+t+"' character in a manually specified "+("`to."+i+"` field ["+JSON.stringify(c)+"].  Please separate it out to the ")+("`to."+s+"` field. Alternatively you may provide the full path as ")+'a string in <Link to="..."> and the router will parse it for you.'}function sy(t){return t.filter((i,s)=>s===0||i.route.path&&i.route.path.length>0)}function Bc(t,i){let s=sy(t);return i?s.map((c,u)=>u===s.length-1?c.pathname:c.pathnameBase):s.map(c=>c.pathnameBase)}function Jc(t,i,s,c){c===void 0&&(c=!1);let u;typeof t=="string"?u=no(t):(u=ti({},t),Le(!u.pathname||!u.pathname.includes("?"),oc("?","pathname","search",u)),Le(!u.pathname||!u.pathname.includes("#"),oc("#","pathname","hash",u)),Le(!u.search||!u.search.includes("#"),oc("#","search","hash",u)));let h=t===""||u.pathname==="",f=h?"/":u.pathname,v;if(f==null)v=s;else{let w=i.length-1;if(!c&&f.startsWith("..")){let b=f.split("/");for(;b[0]==="..";)b.shift(),w-=1;u.pathname=b.join("/")}v=w>=0?i[w]:"/"}let m=oy(u,v),g=f&&f!=="/"&&f.endsWith("/"),k=(h||f===".")&&s.endsWith("/");return!m.pathname.endsWith("/")&&(g||k)&&(m.pathname+="/"),m}const Fr=t=>t.join("/").replace(/\/\/+/g,"/"),ly=t=>t.replace(/\/+$/,"").replace(/^\/*/,"/"),ay=t=>!t||t==="?"?"":t.startsWith("?")?t:"?"+t,cy=t=>!t||t==="#"?"":t.startsWith("#")?t:"#"+t;function dy(t){return t!=null&&typeof t.status=="number"&&typeof t.statusText=="string"&&typeof t.internal=="boolean"&&"data"in t}const gh=["post","put","patch","delete"];new Set(gh);const uy=["get",...gh];new Set(uy);/**
 * React Router v6.30.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function ri(){return ri=Object.assign?Object.assign.bind():function(t){for(var i=1;i<arguments.length;i++){var s=arguments[i];for(var c in s)Object.prototype.hasOwnProperty.call(s,c)&&(t[c]=s[c])}return t},ri.apply(this,arguments)}const Gs=S.createContext(null),yh=S.createContext(null),gr=S.createContext(null),qs=S.createContext(null),yr=S.createContext({outlet:null,matches:[],isDataRoute:!1}),xh=S.createContext(null);function fy(t,i){let{relative:s}=i===void 0?{}:i;oo()||Le(!1);let{basename:c,navigator:u}=S.useContext(gr),{hash:h,pathname:f,search:v}=Ys(t,{relative:s}),m=f;return c!=="/"&&(m=f==="/"?c:Fr([c,f])),u.createHref({pathname:m,search:v,hash:h})}function oo(){return S.useContext(qs)!=null}function vt(){return oo()||Le(!1),S.useContext(qs).location}function vh(t){S.useContext(gr).static||S.useLayoutEffect(t)}function Jt(){let{isDataRoute:t}=S.useContext(yr);return t?_y():py()}function py(){oo()||Le(!1);let t=S.useContext(Gs),{basename:i,future:s,navigator:c}=S.useContext(gr),{matches:u}=S.useContext(yr),{pathname:h}=vt(),f=JSON.stringify(Bc(u,s.v7_relativeSplatPath)),v=S.useRef(!1);return vh(()=>{v.current=!0}),S.useCallback(function(g,k){if(k===void 0&&(k={}),!v.current)return;if(typeof g=="number"){c.go(g);return}let w=Jc(g,JSON.parse(f),h,k.relative==="path");t==null&&i!=="/"&&(w.pathname=w.pathname==="/"?i:Fr([i,w.pathname])),(k.replace?c.replace:c.push)(w,k.state,k)},[i,c,f,h,t])}const hy=S.createContext(null);function my(t){let i=S.useContext(yr).outlet;return i&&S.createElement(hy.Provider,{value:t},i)}function Ys(t,i){let{relative:s}=i===void 0?{}:i,{future:c}=S.useContext(gr),{matches:u}=S.useContext(yr),{pathname:h}=vt(),f=JSON.stringify(Bc(u,c.v7_relativeSplatPath));return S.useMemo(()=>Jc(t,JSON.parse(f),h,s==="path"),[t,f,h,s])}function gy(t,i){return yy(t,i)}function yy(t,i,s,c){oo()||Le(!1);let{navigator:u}=S.useContext(gr),{matches:h}=S.useContext(yr),f=h[h.length-1],v=f?f.params:{};f&&f.pathname;let m=f?f.pathnameBase:"/";f&&f.route;let g=vt(),k;if(i){var w;let E=typeof i=="string"?no(i):i;m==="/"||(w=E.pathname)!=null&&w.startsWith(m)||Le(!1),k=E}else k=g;let b=k.pathname||"/",R=b;if(m!=="/"){let E=m.replace(/^\//,"").split("/");R="/"+b.replace(/^\//,"").split("/").slice(E.length).join("/")}let L=J0(t,{pathname:R}),M=jy(L&&L.map(E=>Object.assign({},E,{params:Object.assign({},v,E.params),pathname:Fr([m,u.encodeLocation?u.encodeLocation(E.pathname).pathname:E.pathname]),pathnameBase:E.pathnameBase==="/"?m:Fr([m,u.encodeLocation?u.encodeLocation(E.pathnameBase).pathname:E.pathnameBase])})),h,s,c);return i&&M?S.createElement(qs.Provider,{value:{location:ri({pathname:"/",search:"",hash:"",state:null,key:"default"},k),navigationType:Mr.Pop}},M):M}function xy(){let t=Iy(),i=dy(t)?t.status+" "+t.statusText:t instanceof Error?t.message:JSON.stringify(t),s=t instanceof Error?t.stack:null,u={padding:"0.5rem",backgroundColor:"rgba(200,200,200, 0.5)"};return S.createElement(S.Fragment,null,S.createElement("h2",null,"Unexpected Application Error!"),S.createElement("h3",{style:{fontStyle:"italic"}},i),s?S.createElement("pre",{style:u},s):null,null)}const vy=S.createElement(xy,null);class wy extends S.Component{constructor(i){super(i),this.state={location:i.location,revalidation:i.revalidation,error:i.error}}static getDerivedStateFromError(i){return{error:i}}static getDerivedStateFromProps(i,s){return s.location!==i.location||s.revalidation!=="idle"&&i.revalidation==="idle"?{error:i.error,location:i.location,revalidation:i.revalidation}:{error:i.error!==void 0?i.error:s.error,location:s.location,revalidation:i.revalidation||s.revalidation}}componentDidCatch(i,s){console.error("React Router caught the following error during render",i,s)}render(){return this.state.error!==void 0?S.createElement(yr.Provider,{value:this.props.routeContext},S.createElement(xh.Provider,{value:this.state.error,children:this.props.component})):this.props.children}}function ky(t){let{routeContext:i,match:s,children:c}=t,u=S.useContext(Gs);return u&&u.static&&u.staticContext&&(s.route.errorElement||s.route.ErrorBoundary)&&(u.staticContext._deepestRenderedBoundaryId=s.route.id),S.createElement(yr.Provider,{value:i},c)}function jy(t,i,s,c){var u;if(i===void 0&&(i=[]),s===void 0&&(s=null),c===void 0&&(c=null),t==null){var h;if(!s)return null;if(s.errors)t=s.matches;else if((h=c)!=null&&h.v7_partialHydration&&i.length===0&&!s.initialized&&s.matches.length>0)t=s.matches;else return null}let f=t,v=(u=s)==null?void 0:u.errors;if(v!=null){let k=f.findIndex(w=>w.route.id&&(v==null?void 0:v[w.route.id])!==void 0);k>=0||Le(!1),f=f.slice(0,Math.min(f.length,k+1))}let m=!1,g=-1;if(s&&c&&c.v7_partialHydration)for(let k=0;k<f.length;k++){let w=f[k];if((w.route.HydrateFallback||w.route.hydrateFallbackElement)&&(g=k),w.route.id){let{loaderData:b,errors:R}=s,L=w.route.loader&&b[w.route.id]===void 0&&(!R||R[w.route.id]===void 0);if(w.route.lazy||L){m=!0,g>=0?f=f.slice(0,g+1):f=[f[0]];break}}}return f.reduceRight((k,w,b)=>{let R,L=!1,M=null,E=null;s&&(R=v&&w.route.id?v[w.route.id]:void 0,M=w.route.errorElement||vy,m&&(g<0&&b===0?(Ey("route-fallback"),L=!0,E=null):g===b&&(L=!0,E=w.route.hydrateFallbackElement||null)));let C=i.concat(f.slice(0,b+1)),z=()=>{let O;return R?O=M:L?O=E:w.route.Component?O=S.createElement(w.route.Component,null):w.route.element?O=w.route.element:O=k,S.createElement(ky,{match:w,routeContext:{outlet:k,matches:C,isDataRoute:s!=null},children:O})};return s&&(w.route.ErrorBoundary||w.route.errorElement||b===0)?S.createElement(wy,{location:s.location,revalidation:s.revalidation,component:M,error:R,children:z(),routeContext:{outlet:null,matches:C,isDataRoute:!0}}):z()},null)}var wh=(function(t){return t.UseBlocker="useBlocker",t.UseRevalidator="useRevalidator",t.UseNavigateStable="useNavigate",t})(wh||{}),kh=(function(t){return t.UseBlocker="useBlocker",t.UseLoaderData="useLoaderData",t.UseActionData="useActionData",t.UseRouteError="useRouteError",t.UseNavigation="useNavigation",t.UseRouteLoaderData="useRouteLoaderData",t.UseMatches="useMatches",t.UseRevalidator="useRevalidator",t.UseNavigateStable="useNavigate",t.UseRouteId="useRouteId",t})(kh||{});function Sy(t){let i=S.useContext(Gs);return i||Le(!1),i}function by(t){let i=S.useContext(yh);return i||Le(!1),i}function Cy(t){let i=S.useContext(yr);return i||Le(!1),i}function jh(t){let i=Cy(),s=i.matches[i.matches.length-1];return s.route.id||Le(!1),s.route.id}function Iy(){var t;let i=S.useContext(xh),s=by(),c=jh();return i!==void 0?i:(t=s.errors)==null?void 0:t[c]}function _y(){let{router:t}=Sy(wh.UseNavigateStable),i=jh(kh.UseNavigateStable),s=S.useRef(!1);return vh(()=>{s.current=!0}),S.useCallback(function(u,h){h===void 0&&(h={}),s.current&&(typeof u=="number"?t.navigate(u):t.navigate(u,ri({fromRouteId:i},h)))},[t,i])}const up={};function Ey(t,i,s){up[t]||(up[t]=!0)}function $y(t,i){t==null||t.v7_startTransition,t==null||t.v7_relativeSplatPath}function Sh(t){let{to:i,replace:s,state:c,relative:u}=t;oo()||Le(!1);let{future:h,static:f}=S.useContext(gr),{matches:v}=S.useContext(yr),{pathname:m}=vt(),g=Jt(),k=Jc(i,Bc(v,h.v7_relativeSplatPath),m,u==="path"),w=JSON.stringify(k);return S.useEffect(()=>g(JSON.parse(w),{replace:s,state:c,relative:u}),[g,w,u,s,c]),null}function bh(t){return my(t.context)}function We(t){Le(!1)}function Ty(t){let{basename:i="/",children:s=null,location:c,navigationType:u=Mr.Pop,navigator:h,static:f=!1,future:v}=t;oo()&&Le(!1);let m=i.replace(/^\/*/,"/"),g=S.useMemo(()=>({basename:m,navigator:h,static:f,future:ri({v7_relativeSplatPath:!1},v)}),[m,v,h,f]);typeof c=="string"&&(c=no(c));let{pathname:k="/",search:w="",hash:b="",state:R=null,key:L="default"}=c,M=S.useMemo(()=>{let E=Yn(k,m);return E==null?null:{location:{pathname:E,search:w,hash:b,state:R,key:L},navigationType:u}},[m,k,w,b,R,L,u]);return M==null?null:S.createElement(gr.Provider,{value:g},S.createElement(qs.Provider,{children:s,value:M}))}function zy(t){let{children:i,location:s}=t;return gy(Cc(i),s)}new Promise(()=>{});function Cc(t,i){i===void 0&&(i=[]);let s=[];return S.Children.forEach(t,(c,u)=>{if(!S.isValidElement(c))return;let h=[...i,u];if(c.type===S.Fragment){s.push.apply(s,Cc(c.props.children,h));return}c.type!==We&&Le(!1),!c.props.index||!c.props.children||Le(!1);let f={id:c.props.id||h.join("-"),caseSensitive:c.props.caseSensitive,element:c.props.element,Component:c.props.Component,index:c.props.index,path:c.props.path,loader:c.props.loader,action:c.props.action,errorElement:c.props.errorElement,ErrorBoundary:c.props.ErrorBoundary,hasErrorBoundary:c.props.ErrorBoundary!=null||c.props.errorElement!=null,shouldRevalidate:c.props.shouldRevalidate,handle:c.props.handle,lazy:c.props.lazy};c.props.children&&(f.children=Cc(c.props.children,h)),s.push(f)}),s}/**
 * React Router DOM v6.30.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function Ds(){return Ds=Object.assign?Object.assign.bind():function(t){for(var i=1;i<arguments.length;i++){var s=arguments[i];for(var c in s)Object.prototype.hasOwnProperty.call(s,c)&&(t[c]=s[c])}return t},Ds.apply(this,arguments)}function Ch(t,i){if(t==null)return{};var s={},c=Object.keys(t),u,h;for(h=0;h<c.length;h++)u=c[h],!(i.indexOf(u)>=0)&&(s[u]=t[u]);return s}function Py(t){return!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}function Ay(t,i){return t.button===0&&(!i||i==="_self")&&!Py(t)}function Ic(t){return t===void 0&&(t=""),new URLSearchParams(typeof t=="string"||Array.isArray(t)||t instanceof URLSearchParams?t:Object.keys(t).reduce((i,s)=>{let c=t[s];return i.concat(Array.isArray(c)?c.map(u=>[s,u]):[[s,c]])},[]))}function Ry(t,i){let s=Ic(t);return i&&i.forEach((c,u)=>{s.has(u)||i.getAll(u).forEach(h=>{s.append(u,h)})}),s}const Oy=["onClick","relative","reloadDocument","replace","state","target","to","preventScrollReset","viewTransition"],Ny=["aria-current","caseSensitive","className","end","style","to","viewTransition","children"],Dy="6";try{window.__reactRouterVersion=Dy}catch{}const Ly=S.createContext({isTransitioning:!1}),Uy="startTransition",fp=R0[Uy];function My(t){let{basename:i,children:s,future:c,window:u}=t,h=S.useRef();h.current==null&&(h.current=F0({window:u,v5Compat:!0}));let f=h.current,[v,m]=S.useState({action:f.action,location:f.location}),{v7_startTransition:g}=c||{},k=S.useCallback(w=>{g&&fp?fp(()=>m(w)):m(w)},[m,g]);return S.useLayoutEffect(()=>f.listen(k),[f,k]),S.useEffect(()=>$y(c),[c]),S.createElement(Ty,{basename:i,children:s,location:v.location,navigationType:v.action,navigator:f,future:c})}const Fy=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u",Wy=/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,dn=S.forwardRef(function(i,s){let{onClick:c,relative:u,reloadDocument:h,replace:f,state:v,target:m,to:g,preventScrollReset:k,viewTransition:w}=i,b=Ch(i,Oy),{basename:R}=S.useContext(gr),L,M=!1;if(typeof g=="string"&&Wy.test(g)&&(L=g,Fy))try{let O=new URL(window.location.href),D=g.startsWith("//")?new URL(O.protocol+g):new URL(g),A=Yn(D.pathname,R);D.origin===O.origin&&A!=null?g=A+D.search+D.hash:M=!0}catch{}let E=fy(g,{relative:u}),C=Jy(g,{replace:f,state:v,target:m,preventScrollReset:k,relative:u,viewTransition:w});function z(O){c&&c(O),O.defaultPrevented||C(O)}return S.createElement("a",Ds({},b,{href:L||E,onClick:M||h?c:z,ref:s,target:m}))}),Ih=S.forwardRef(function(i,s){let{"aria-current":c="page",caseSensitive:u=!1,className:h="",end:f=!1,style:v,to:m,viewTransition:g,children:k}=i,w=Ch(i,Ny),b=Ys(m,{relative:w.relative}),R=vt(),L=S.useContext(yh),{navigator:M,basename:E}=S.useContext(gr),C=L!=null&&Vy(b)&&g===!0,z=M.encodeLocation?M.encodeLocation(b).pathname:b.pathname,O=R.pathname,D=L&&L.navigation&&L.navigation.location?L.navigation.location.pathname:null;u||(O=O.toLowerCase(),D=D?D.toLowerCase():null,z=z.toLowerCase()),D&&E&&(D=Yn(D,E)||D);const A=z!=="/"&&z.endsWith("/")?z.length-1:z.length;let F=O===z||!f&&O.startsWith(z)&&O.charAt(A)==="/",N=D!=null&&(D===z||!f&&D.startsWith(z)&&D.charAt(z.length)==="/"),B={isActive:F,isPending:N,isTransitioning:C},ee=F?c:void 0,Y;typeof h=="function"?Y=h(B):Y=[h,F?"active":null,N?"pending":null,C?"transitioning":null].filter(Boolean).join(" ");let le=typeof v=="function"?v(B):v;return S.createElement(dn,Ds({},w,{"aria-current":ee,className:Y,ref:s,style:le,to:m,viewTransition:g}),typeof k=="function"?k(B):k)});var _c;(function(t){t.UseScrollRestoration="useScrollRestoration",t.UseSubmit="useSubmit",t.UseSubmitFetcher="useSubmitFetcher",t.UseFetcher="useFetcher",t.useViewTransitionState="useViewTransitionState"})(_c||(_c={}));var pp;(function(t){t.UseFetcher="useFetcher",t.UseFetchers="useFetchers",t.UseScrollRestoration="useScrollRestoration"})(pp||(pp={}));function By(t){let i=S.useContext(Gs);return i||Le(!1),i}function Jy(t,i){let{target:s,replace:c,state:u,preventScrollReset:h,relative:f,viewTransition:v}=i===void 0?{}:i,m=Jt(),g=vt(),k=Ys(t,{relative:f});return S.useCallback(w=>{if(Ay(w,s)){w.preventDefault();let b=c!==void 0?c:Ns(g)===Ns(k);m(t,{replace:b,state:u,preventScrollReset:h,relative:f,viewTransition:v})}},[g,m,k,c,u,s,t,h,f,v])}function Hy(t){let i=S.useRef(Ic(t)),s=S.useRef(!1),c=vt(),u=S.useMemo(()=>Ry(c.search,s.current?null:i.current),[c.search]),h=Jt(),f=S.useCallback((v,m)=>{const g=Ic(typeof v=="function"?v(u):v);s.current=!0,h("?"+g,m)},[h,u]);return[u,f]}function Vy(t,i){i===void 0&&(i={});let s=S.useContext(Ly);s==null&&Le(!1);let{basename:c}=By(_c.useViewTransitionState),u=Ys(t,{relative:i.relative});if(!s.isTransitioning)return!1;let h=Yn(s.currentLocation.pathname,c)||s.currentLocation.pathname,f=Yn(s.nextLocation.pathname,c)||s.nextLocation.pathname;return bc(u.pathname,f)!=null||bc(u.pathname,h)!=null}var et=function(){return et=Object.assign||function(i){for(var s,c=1,u=arguments.length;c<u;c++){s=arguments[c];for(var h in s)Object.prototype.hasOwnProperty.call(s,h)&&(i[h]=s[h])}return i},et.apply(this,arguments)};function Qn(t,i,s){if(s||arguments.length===2)for(var c=0,u=i.length,h;c<u;c++)(h||!(c in i))&&(h||(h=Array.prototype.slice.call(i,0,c)),h[c]=i[c]);return t.concat(h||Array.prototype.slice.call(i))}var Pe="-ms-",ei="-moz-",Ce="-webkit-",_h="comm",Qs="rule",Hc="decl",Ky="@import",Eh="@keyframes",Gy="@layer",$h=Math.abs,Vc=String.fromCharCode,Ec=Object.assign;function qy(t,i){return Ze(t,0)^45?(((i<<2^Ze(t,0))<<2^Ze(t,1))<<2^Ze(t,2))<<2^Ze(t,3):0}function Th(t){return t.trim()}function pr(t,i){return(t=i.exec(t))?t[0]:t}function fe(t,i,s){return t.replace(i,s)}function Ts(t,i,s){return t.indexOf(i,s)}function Ze(t,i){return t.charCodeAt(i)|0}function Xn(t,i,s){return t.slice(i,s)}function Qt(t){return t.length}function zh(t){return t.length}function Zo(t,i){return i.push(t),t}function Yy(t,i){return t.map(i).join("")}function hp(t,i){return t.filter(function(s){return!pr(s,i)})}var Xs=1,Zn=1,Ph=0,zt=0,Je=0,io="";function Zs(t,i,s,c,u,h,f,v){return{value:t,root:i,parent:s,type:c,props:u,children:h,line:Xs,column:Zn,length:f,return:"",siblings:v}}function Ur(t,i){return Ec(Zs("",null,null,"",null,null,0,t.siblings),t,{length:-t.length},i)}function Wn(t){for(;t.root;)t=Ur(t.root,{children:[t]});Zo(t,t.siblings)}function Qy(){return Je}function Xy(){return Je=zt>0?Ze(io,--zt):0,Zn--,Je===10&&(Zn=1,Xs--),Je}function Bt(){return Je=zt<Ph?Ze(io,zt++):0,Zn++,Je===10&&(Zn=1,Xs++),Je}function un(){return Ze(io,zt)}function zs(){return zt}function el(t,i){return Xn(io,t,i)}function $c(t){switch(t){case 0:case 9:case 10:case 13:case 32:return 5;case 33:case 43:case 44:case 47:case 62:case 64:case 126:case 59:case 123:case 125:return 4;case 58:return 3;case 34:case 39:case 40:case 91:return 2;case 41:case 93:return 1}return 0}function Zy(t){return Xs=Zn=1,Ph=Qt(io=t),zt=0,[]}function ex(t){return io="",t}function ic(t){return Th(el(zt-1,Tc(t===91?t+2:t===40?t+1:t)))}function tx(t){for(;(Je=un())&&Je<33;)Bt();return $c(t)>2||$c(Je)>3?"":" "}function rx(t,i){for(;--i&&Bt()&&!(Je<48||Je>102||Je>57&&Je<65||Je>70&&Je<97););return el(t,zs()+(i<6&&un()==32&&Bt()==32))}function Tc(t){for(;Bt();)switch(Je){case t:return zt;case 34:case 39:t!==34&&t!==39&&Tc(Je);break;case 40:t===41&&Tc(t);break;case 92:Bt();break}return zt}function nx(t,i){for(;Bt()&&t+Je!==57;)if(t+Je===84&&un()===47)break;return"/*"+el(i,zt-1)+"*"+Vc(t===47?t:Bt())}function ox(t){for(;!$c(un());)Bt();return el(t,zt)}function ix(t){return ex(Ps("",null,null,null,[""],t=Zy(t),0,[0],t))}function Ps(t,i,s,c,u,h,f,v,m){for(var g=0,k=0,w=f,b=0,R=0,L=0,M=1,E=1,C=1,z=0,O="",D=u,A=h,F=c,N=O;E;)switch(L=z,z=Bt()){case 40:if(L!=108&&Ze(N,w-1)==58){Ts(N+=fe(ic(z),"&","&\f"),"&\f",$h(g?v[g-1]:0))!=-1&&(C=-1);break}case 34:case 39:case 91:N+=ic(z);break;case 9:case 10:case 13:case 32:N+=tx(L);break;case 92:N+=rx(zs()-1,7);continue;case 47:switch(un()){case 42:case 47:Zo(sx(nx(Bt(),zs()),i,s,m),m);break;default:N+="/"}break;case 123*M:v[g++]=Qt(N)*C;case 125*M:case 59:case 0:switch(z){case 0:case 125:E=0;case 59+k:C==-1&&(N=fe(N,/\f/g,"")),R>0&&Qt(N)-w&&Zo(R>32?gp(N+";",c,s,w-1,m):gp(fe(N," ","")+";",c,s,w-2,m),m);break;case 59:N+=";";default:if(Zo(F=mp(N,i,s,g,k,u,v,O,D=[],A=[],w,h),h),z===123)if(k===0)Ps(N,i,F,F,D,h,w,v,A);else switch(b===99&&Ze(N,3)===110?100:b){case 100:case 108:case 109:case 115:Ps(t,F,F,c&&Zo(mp(t,F,F,0,0,u,v,O,u,D=[],w,A),A),u,A,w,v,c?D:A);break;default:Ps(N,F,F,F,[""],A,0,v,A)}}g=k=R=0,M=C=1,O=N="",w=f;break;case 58:w=1+Qt(N),R=L;default:if(M<1){if(z==123)--M;else if(z==125&&M++==0&&Xy()==125)continue}switch(N+=Vc(z),z*M){case 38:C=k>0?1:(N+="\f",-1);break;case 44:v[g++]=(Qt(N)-1)*C,C=1;break;case 64:un()===45&&(N+=ic(Bt())),b=un(),k=w=Qt(O=N+=ox(zs())),z++;break;case 45:L===45&&Qt(N)==2&&(M=0)}}return h}function mp(t,i,s,c,u,h,f,v,m,g,k,w){for(var b=u-1,R=u===0?h:[""],L=zh(R),M=0,E=0,C=0;M<c;++M)for(var z=0,O=Xn(t,b+1,b=$h(E=f[M])),D=t;z<L;++z)(D=Th(E>0?R[z]+" "+O:fe(O,/&\f/g,R[z])))&&(m[C++]=D);return Zs(t,i,s,u===0?Qs:v,m,g,k,w)}function sx(t,i,s,c){return Zs(t,i,s,_h,Vc(Qy()),Xn(t,2,-2),0,c)}function gp(t,i,s,c,u){return Zs(t,i,s,Hc,Xn(t,0,c),Xn(t,c+1,-1),c,u)}function Ah(t,i,s){switch(qy(t,i)){case 5103:return Ce+"print-"+t+t;case 5737:case 4201:case 3177:case 3433:case 1641:case 4457:case 2921:case 5572:case 6356:case 5844:case 3191:case 6645:case 3005:case 6391:case 5879:case 5623:case 6135:case 4599:case 4855:case 4215:case 6389:case 5109:case 5365:case 5621:case 3829:return Ce+t+t;case 4789:return ei+t+t;case 5349:case 4246:case 4810:case 6968:case 2756:return Ce+t+ei+t+Pe+t+t;case 5936:switch(Ze(t,i+11)){case 114:return Ce+t+Pe+fe(t,/[svh]\w+-[tblr]{2}/,"tb")+t;case 108:return Ce+t+Pe+fe(t,/[svh]\w+-[tblr]{2}/,"tb-rl")+t;case 45:return Ce+t+Pe+fe(t,/[svh]\w+-[tblr]{2}/,"lr")+t}case 6828:case 4268:case 2903:return Ce+t+Pe+t+t;case 6165:return Ce+t+Pe+"flex-"+t+t;case 5187:return Ce+t+fe(t,/(\w+).+(:[^]+)/,Ce+"box-$1$2"+Pe+"flex-$1$2")+t;case 5443:return Ce+t+Pe+"flex-item-"+fe(t,/flex-|-self/g,"")+(pr(t,/flex-|baseline/)?"":Pe+"grid-row-"+fe(t,/flex-|-self/g,""))+t;case 4675:return Ce+t+Pe+"flex-line-pack"+fe(t,/align-content|flex-|-self/g,"")+t;case 5548:return Ce+t+Pe+fe(t,"shrink","negative")+t;case 5292:return Ce+t+Pe+fe(t,"basis","preferred-size")+t;case 6060:return Ce+"box-"+fe(t,"-grow","")+Ce+t+Pe+fe(t,"grow","positive")+t;case 4554:return Ce+fe(t,/([^-])(transform)/g,"$1"+Ce+"$2")+t;case 6187:return fe(fe(fe(t,/(zoom-|grab)/,Ce+"$1"),/(image-set)/,Ce+"$1"),t,"")+t;case 5495:case 3959:return fe(t,/(image-set\([^]*)/,Ce+"$1$`$1");case 4968:return fe(fe(t,/(.+:)(flex-)?(.*)/,Ce+"box-pack:$3"+Pe+"flex-pack:$3"),/s.+-b[^;]+/,"justify")+Ce+t+t;case 4200:if(!pr(t,/flex-|baseline/))return Pe+"grid-column-align"+Xn(t,i)+t;break;case 2592:case 3360:return Pe+fe(t,"template-","")+t;case 4384:case 3616:return s&&s.some(function(c,u){return i=u,pr(c.props,/grid-\w+-end/)})?~Ts(t+(s=s[i].value),"span",0)?t:Pe+fe(t,"-start","")+t+Pe+"grid-row-span:"+(~Ts(s,"span",0)?pr(s,/\d+/):+pr(s,/\d+/)-+pr(t,/\d+/))+";":Pe+fe(t,"-start","")+t;case 4896:case 4128:return s&&s.some(function(c){return pr(c.props,/grid-\w+-start/)})?t:Pe+fe(fe(t,"-end","-span"),"span ","")+t;case 4095:case 3583:case 4068:case 2532:return fe(t,/(.+)-inline(.+)/,Ce+"$1$2")+t;case 8116:case 7059:case 5753:case 5535:case 5445:case 5701:case 4933:case 4677:case 5533:case 5789:case 5021:case 4765:if(Qt(t)-1-i>6)switch(Ze(t,i+1)){case 109:if(Ze(t,i+4)!==45)break;case 102:return fe(t,/(.+:)(.+)-([^]+)/,"$1"+Ce+"$2-$3$1"+ei+(Ze(t,i+3)==108?"$3":"$2-$3"))+t;case 115:return~Ts(t,"stretch",0)?Ah(fe(t,"stretch","fill-available"),i,s)+t:t}break;case 5152:case 5920:return fe(t,/(.+?):(\d+)(\s*\/\s*(span)?\s*(\d+))?(.*)/,function(c,u,h,f,v,m,g){return Pe+u+":"+h+g+(f?Pe+u+"-span:"+(v?m:+m-+h)+g:"")+t});case 4949:if(Ze(t,i+6)===121)return fe(t,":",":"+Ce)+t;break;case 6444:switch(Ze(t,Ze(t,14)===45?18:11)){case 120:return fe(t,/(.+:)([^;\s!]+)(;|(\s+)?!.+)?/,"$1"+Ce+(Ze(t,14)===45?"inline-":"")+"box$3$1"+Ce+"$2$3$1"+Pe+"$2box$3")+t;case 100:return fe(t,":",":"+Pe)+t}break;case 5719:case 2647:case 2135:case 3927:case 2391:return fe(t,"scroll-","scroll-snap-")+t}return t}function Ls(t,i){for(var s="",c=0;c<t.length;c++)s+=i(t[c],c,t,i)||"";return s}function lx(t,i,s,c){switch(t.type){case Gy:if(t.children.length)break;case Ky:case Hc:return t.return=t.return||t.value;case _h:return"";case Eh:return t.return=t.value+"{"+Ls(t.children,c)+"}";case Qs:if(!Qt(t.value=t.props.join(",")))return""}return Qt(s=Ls(t.children,c))?t.return=t.value+"{"+s+"}":""}function ax(t){var i=zh(t);return function(s,c,u,h){for(var f="",v=0;v<i;v++)f+=t[v](s,c,u,h)||"";return f}}function cx(t){return function(i){i.root||(i=i.return)&&t(i)}}function dx(t,i,s,c){if(t.length>-1&&!t.return)switch(t.type){case Hc:t.return=Ah(t.value,t.length,s);return;case Eh:return Ls([Ur(t,{value:fe(t.value,"@","@"+Ce)})],c);case Qs:if(t.length)return Yy(s=t.props,function(u){switch(pr(u,c=/(::plac\w+|:read-\w+)/)){case":read-only":case":read-write":Wn(Ur(t,{props:[fe(u,/:(read-\w+)/,":"+ei+"$1")]})),Wn(Ur(t,{props:[u]})),Ec(t,{props:hp(s,c)});break;case"::placeholder":Wn(Ur(t,{props:[fe(u,/:(plac\w+)/,":"+Ce+"input-$1")]})),Wn(Ur(t,{props:[fe(u,/:(plac\w+)/,":"+ei+"$1")]})),Wn(Ur(t,{props:[fe(u,/:(plac\w+)/,Pe+"input-$1")]})),Wn(Ur(t,{props:[u]})),Ec(t,{props:hp(s,c)});break}return""})}}var ux={animationIterationCount:1,aspectRatio:1,borderImageOutset:1,borderImageSlice:1,borderImageWidth:1,boxFlex:1,boxFlexGroup:1,boxOrdinalGroup:1,columnCount:1,columns:1,flex:1,flexGrow:1,flexPositive:1,flexShrink:1,flexNegative:1,flexOrder:1,gridRow:1,gridRowEnd:1,gridRowSpan:1,gridRowStart:1,gridColumn:1,gridColumnEnd:1,gridColumnSpan:1,gridColumnStart:1,msGridRow:1,msGridRowSpan:1,msGridColumn:1,msGridColumnSpan:1,fontWeight:1,lineHeight:1,opacity:1,order:1,orphans:1,tabSize:1,widows:1,zIndex:1,zoom:1,WebkitLineClamp:1,fillOpacity:1,floodOpacity:1,stopOpacity:1,strokeDasharray:1,strokeDashoffset:1,strokeMiterlimit:1,strokeOpacity:1,strokeWidth:1},bt={},eo=typeof process<"u"&&bt!==void 0&&(bt.REACT_APP_SC_ATTR||bt.SC_ATTR)||"data-styled",Rh="active",Oh="data-styled-version",tl="6.1.19",Kc=`/*!sc*/
`,Us=typeof window<"u"&&typeof document<"u",fx=!!(typeof SC_DISABLE_SPEEDY=="boolean"?SC_DISABLE_SPEEDY:typeof process<"u"&&bt!==void 0&&bt.REACT_APP_SC_DISABLE_SPEEDY!==void 0&&bt.REACT_APP_SC_DISABLE_SPEEDY!==""?bt.REACT_APP_SC_DISABLE_SPEEDY!=="false"&&bt.REACT_APP_SC_DISABLE_SPEEDY:typeof process<"u"&&bt!==void 0&&bt.SC_DISABLE_SPEEDY!==void 0&&bt.SC_DISABLE_SPEEDY!==""&&bt.SC_DISABLE_SPEEDY!=="false"&&bt.SC_DISABLE_SPEEDY),px={},rl=Object.freeze([]),to=Object.freeze({});function Nh(t,i,s){return s===void 0&&(s=to),t.theme!==s.theme&&t.theme||i||s.theme}var Dh=new Set(["a","abbr","address","area","article","aside","audio","b","base","bdi","bdo","big","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","data","datalist","dd","del","details","dfn","dialog","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","hr","html","i","iframe","img","input","ins","kbd","keygen","label","legend","li","link","main","map","mark","menu","menuitem","meta","meter","nav","noscript","object","ol","optgroup","option","output","p","param","picture","pre","progress","q","rp","rt","ruby","s","samp","script","section","select","small","source","span","strong","style","sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","track","u","ul","use","var","video","wbr","circle","clipPath","defs","ellipse","foreignObject","g","image","line","linearGradient","marker","mask","path","pattern","polygon","polyline","radialGradient","rect","stop","svg","text","tspan"]),hx=/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~-]+/g,mx=/(^-|-$)/g;function yp(t){return t.replace(hx,"-").replace(mx,"")}var gx=/(a)(d)/gi,xs=52,xp=function(t){return String.fromCharCode(t+(t>25?39:97))};function zc(t){var i,s="";for(i=Math.abs(t);i>xs;i=i/xs|0)s=xp(i%xs)+s;return(xp(i%xs)+s).replace(gx,"$1-$2")}var sc,Lh=5381,Gn=function(t,i){for(var s=i.length;s;)t=33*t^i.charCodeAt(--s);return t},Uh=function(t){return Gn(Lh,t)};function Gc(t){return zc(Uh(t)>>>0)}function yx(t){return t.displayName||t.name||"Component"}function lc(t){return typeof t=="string"&&!0}var Mh=typeof Symbol=="function"&&Symbol.for,Fh=Mh?Symbol.for("react.memo"):60115,xx=Mh?Symbol.for("react.forward_ref"):60112,vx={childContextTypes:!0,contextType:!0,contextTypes:!0,defaultProps:!0,displayName:!0,getDefaultProps:!0,getDerivedStateFromError:!0,getDerivedStateFromProps:!0,mixins:!0,propTypes:!0,type:!0},wx={name:!0,length:!0,prototype:!0,caller:!0,callee:!0,arguments:!0,arity:!0},Wh={$$typeof:!0,compare:!0,defaultProps:!0,displayName:!0,propTypes:!0,type:!0},kx=((sc={})[xx]={$$typeof:!0,render:!0,defaultProps:!0,displayName:!0,propTypes:!0},sc[Fh]=Wh,sc);function vp(t){return("type"in(i=t)&&i.type.$$typeof)===Fh?Wh:"$$typeof"in t?kx[t.$$typeof]:vx;var i}var jx=Object.defineProperty,Sx=Object.getOwnPropertyNames,wp=Object.getOwnPropertySymbols,bx=Object.getOwnPropertyDescriptor,Cx=Object.getPrototypeOf,kp=Object.prototype;function Bh(t,i,s){if(typeof i!="string"){if(kp){var c=Cx(i);c&&c!==kp&&Bh(t,c,s)}var u=Sx(i);wp&&(u=u.concat(wp(i)));for(var h=vp(t),f=vp(i),v=0;v<u.length;++v){var m=u[v];if(!(m in wx||s&&s[m]||f&&m in f||h&&m in h)){var g=bx(i,m);try{jx(t,m,g)}catch{}}}}return t}function pn(t){return typeof t=="function"}function qc(t){return typeof t=="object"&&"styledComponentId"in t}function cn(t,i){return t&&i?"".concat(t," ").concat(i):t||i||""}function Ms(t,i){if(t.length===0)return"";for(var s=t[0],c=1;c<t.length;c++)s+=t[c];return s}function ni(t){return t!==null&&typeof t=="object"&&t.constructor.name===Object.name&&!("props"in t&&t.$$typeof)}function Pc(t,i,s){if(s===void 0&&(s=!1),!s&&!ni(t)&&!Array.isArray(t))return i;if(Array.isArray(i))for(var c=0;c<i.length;c++)t[c]=Pc(t[c],i[c]);else if(ni(i))for(var c in i)t[c]=Pc(t[c],i[c]);return t}function Yc(t,i){Object.defineProperty(t,"toString",{value:i})}function hn(t){for(var i=[],s=1;s<arguments.length;s++)i[s-1]=arguments[s];return new Error("An error occurred. See https://github.com/styled-components/styled-components/blob/main/packages/styled-components/src/utils/errors.md#".concat(t," for more information.").concat(i.length>0?" Args: ".concat(i.join(", ")):""))}var Ix=(function(){function t(i){this.groupSizes=new Uint32Array(512),this.length=512,this.tag=i}return t.prototype.indexOfGroup=function(i){for(var s=0,c=0;c<i;c++)s+=this.groupSizes[c];return s},t.prototype.insertRules=function(i,s){if(i>=this.groupSizes.length){for(var c=this.groupSizes,u=c.length,h=u;i>=h;)if((h<<=1)<0)throw hn(16,"".concat(i));this.groupSizes=new Uint32Array(h),this.groupSizes.set(c),this.length=h;for(var f=u;f<h;f++)this.groupSizes[f]=0}for(var v=this.indexOfGroup(i+1),m=(f=0,s.length);f<m;f++)this.tag.insertRule(v,s[f])&&(this.groupSizes[i]++,v++)},t.prototype.clearGroup=function(i){if(i<this.length){var s=this.groupSizes[i],c=this.indexOfGroup(i),u=c+s;this.groupSizes[i]=0;for(var h=c;h<u;h++)this.tag.deleteRule(c)}},t.prototype.getGroup=function(i){var s="";if(i>=this.length||this.groupSizes[i]===0)return s;for(var c=this.groupSizes[i],u=this.indexOfGroup(i),h=u+c,f=u;f<h;f++)s+="".concat(this.tag.getRule(f)).concat(Kc);return s},t})(),As=new Map,Fs=new Map,Rs=1,vs=function(t){if(As.has(t))return As.get(t);for(;Fs.has(Rs);)Rs++;var i=Rs++;return As.set(t,i),Fs.set(i,t),i},_x=function(t,i){Rs=i+1,As.set(t,i),Fs.set(i,t)},Ex="style[".concat(eo,"][").concat(Oh,'="').concat(tl,'"]'),$x=new RegExp("^".concat(eo,'\\.g(\\d+)\\[id="([\\w\\d-]+)"\\].*?"([^"]*)')),Tx=function(t,i,s){for(var c,u=s.split(","),h=0,f=u.length;h<f;h++)(c=u[h])&&t.registerName(i,c)},zx=function(t,i){for(var s,c=((s=i.textContent)!==null&&s!==void 0?s:"").split(Kc),u=[],h=0,f=c.length;h<f;h++){var v=c[h].trim();if(v){var m=v.match($x);if(m){var g=0|parseInt(m[1],10),k=m[2];g!==0&&(_x(k,g),Tx(t,k,m[3]),t.getTag().insertRules(g,u)),u.length=0}else u.push(v)}}},jp=function(t){for(var i=document.querySelectorAll(Ex),s=0,c=i.length;s<c;s++){var u=i[s];u&&u.getAttribute(eo)!==Rh&&(zx(t,u),u.parentNode&&u.parentNode.removeChild(u))}};function Px(){return typeof __webpack_nonce__<"u"?__webpack_nonce__:null}var Jh=function(t){var i=document.head,s=t||i,c=document.createElement("style"),u=(function(v){var m=Array.from(v.querySelectorAll("style[".concat(eo,"]")));return m[m.length-1]})(s),h=u!==void 0?u.nextSibling:null;c.setAttribute(eo,Rh),c.setAttribute(Oh,tl);var f=Px();return f&&c.setAttribute("nonce",f),s.insertBefore(c,h),c},Ax=(function(){function t(i){this.element=Jh(i),this.element.appendChild(document.createTextNode("")),this.sheet=(function(s){if(s.sheet)return s.sheet;for(var c=document.styleSheets,u=0,h=c.length;u<h;u++){var f=c[u];if(f.ownerNode===s)return f}throw hn(17)})(this.element),this.length=0}return t.prototype.insertRule=function(i,s){try{return this.sheet.insertRule(s,i),this.length++,!0}catch{return!1}},t.prototype.deleteRule=function(i){this.sheet.deleteRule(i),this.length--},t.prototype.getRule=function(i){var s=this.sheet.cssRules[i];return s&&s.cssText?s.cssText:""},t})(),Rx=(function(){function t(i){this.element=Jh(i),this.nodes=this.element.childNodes,this.length=0}return t.prototype.insertRule=function(i,s){if(i<=this.length&&i>=0){var c=document.createTextNode(s);return this.element.insertBefore(c,this.nodes[i]||null),this.length++,!0}return!1},t.prototype.deleteRule=function(i){this.element.removeChild(this.nodes[i]),this.length--},t.prototype.getRule=function(i){return i<this.length?this.nodes[i].textContent:""},t})(),Ox=(function(){function t(i){this.rules=[],this.length=0}return t.prototype.insertRule=function(i,s){return i<=this.length&&(this.rules.splice(i,0,s),this.length++,!0)},t.prototype.deleteRule=function(i){this.rules.splice(i,1),this.length--},t.prototype.getRule=function(i){return i<this.length?this.rules[i]:""},t})(),Sp=Us,Nx={isServer:!Us,useCSSOMInjection:!fx},Ws=(function(){function t(i,s,c){i===void 0&&(i=to),s===void 0&&(s={});var u=this;this.options=et(et({},Nx),i),this.gs=s,this.names=new Map(c),this.server=!!i.isServer,!this.server&&Us&&Sp&&(Sp=!1,jp(this)),Yc(this,function(){return(function(h){for(var f=h.getTag(),v=f.length,m="",g=function(w){var b=(function(C){return Fs.get(C)})(w);if(b===void 0)return"continue";var R=h.names.get(b),L=f.getGroup(w);if(R===void 0||!R.size||L.length===0)return"continue";var M="".concat(eo,".g").concat(w,'[id="').concat(b,'"]'),E="";R!==void 0&&R.forEach(function(C){C.length>0&&(E+="".concat(C,","))}),m+="".concat(L).concat(M,'{content:"').concat(E,'"}').concat(Kc)},k=0;k<v;k++)g(k);return m})(u)})}return t.registerId=function(i){return vs(i)},t.prototype.rehydrate=function(){!this.server&&Us&&jp(this)},t.prototype.reconstructWithOptions=function(i,s){return s===void 0&&(s=!0),new t(et(et({},this.options),i),this.gs,s&&this.names||void 0)},t.prototype.allocateGSInstance=function(i){return this.gs[i]=(this.gs[i]||0)+1},t.prototype.getTag=function(){return this.tag||(this.tag=(i=(function(s){var c=s.useCSSOMInjection,u=s.target;return s.isServer?new Ox(u):c?new Ax(u):new Rx(u)})(this.options),new Ix(i)));var i},t.prototype.hasNameForId=function(i,s){return this.names.has(i)&&this.names.get(i).has(s)},t.prototype.registerName=function(i,s){if(vs(i),this.names.has(i))this.names.get(i).add(s);else{var c=new Set;c.add(s),this.names.set(i,c)}},t.prototype.insertRules=function(i,s,c){this.registerName(i,s),this.getTag().insertRules(vs(i),c)},t.prototype.clearNames=function(i){this.names.has(i)&&this.names.get(i).clear()},t.prototype.clearRules=function(i){this.getTag().clearGroup(vs(i)),this.clearNames(i)},t.prototype.clearTag=function(){this.tag=void 0},t})(),Dx=/&/g,Lx=/^\s*\/\/.*$/gm;function Hh(t,i){return t.map(function(s){return s.type==="rule"&&(s.value="".concat(i," ").concat(s.value),s.value=s.value.replaceAll(",",",".concat(i," ")),s.props=s.props.map(function(c){return"".concat(i," ").concat(c)})),Array.isArray(s.children)&&s.type!=="@keyframes"&&(s.children=Hh(s.children,i)),s})}function Ux(t){var i,s,c,u=to,h=u.options,f=h===void 0?to:h,v=u.plugins,m=v===void 0?rl:v,g=function(b,R,L){return L.startsWith(s)&&L.endsWith(s)&&L.replaceAll(s,"").length>0?".".concat(i):b},k=m.slice();k.push(function(b){b.type===Qs&&b.value.includes("&")&&(b.props[0]=b.props[0].replace(Dx,s).replace(c,g))}),f.prefix&&k.push(dx),k.push(lx);var w=function(b,R,L,M){R===void 0&&(R=""),L===void 0&&(L=""),M===void 0&&(M="&"),i=M,s=R,c=new RegExp("\\".concat(s,"\\b"),"g");var E=b.replace(Lx,""),C=ix(L||R?"".concat(L," ").concat(R," { ").concat(E," }"):E);f.namespace&&(C=Hh(C,f.namespace));var z=[];return Ls(C,ax(k.concat(cx(function(O){return z.push(O)})))),z};return w.hash=m.length?m.reduce(function(b,R){return R.name||hn(15),Gn(b,R.name)},Lh).toString():"",w}var Mx=new Ws,Ac=Ux(),Vh=He.createContext({shouldForwardProp:void 0,styleSheet:Mx,stylis:Ac});Vh.Consumer;He.createContext(void 0);function Rc(){return S.useContext(Vh)}var Kh=(function(){function t(i,s){var c=this;this.inject=function(u,h){h===void 0&&(h=Ac);var f=c.name+h.hash;u.hasNameForId(c.id,f)||u.insertRules(c.id,f,h(c.rules,f,"@keyframes"))},this.name=i,this.id="sc-keyframes-".concat(i),this.rules=s,Yc(this,function(){throw hn(12,String(c.name))})}return t.prototype.getName=function(i){return i===void 0&&(i=Ac),this.name+i.hash},t})(),Fx=function(t){return t>="A"&&t<="Z"};function bp(t){for(var i="",s=0;s<t.length;s++){var c=t[s];if(s===1&&c==="-"&&t[0]==="-")return t;Fx(c)?i+="-"+c.toLowerCase():i+=c}return i.startsWith("ms-")?"-"+i:i}var Gh=function(t){return t==null||t===!1||t===""},qh=function(t){var i,s,c=[];for(var u in t){var h=t[u];t.hasOwnProperty(u)&&!Gh(h)&&(Array.isArray(h)&&h.isCss||pn(h)?c.push("".concat(bp(u),":"),h,";"):ni(h)?c.push.apply(c,Qn(Qn(["".concat(u," {")],qh(h),!1),["}"],!1)):c.push("".concat(bp(u),": ").concat((i=u,(s=h)==null||typeof s=="boolean"||s===""?"":typeof s!="number"||s===0||i in ux||i.startsWith("--")?String(s).trim():"".concat(s,"px")),";")))}return c};function Wr(t,i,s,c){if(Gh(t))return[];if(qc(t))return[".".concat(t.styledComponentId)];if(pn(t)){if(!pn(h=t)||h.prototype&&h.prototype.isReactComponent||!i)return[t];var u=t(i);return Wr(u,i,s,c)}var h;return t instanceof Kh?s?(t.inject(s,c),[t.getName(c)]):[t]:ni(t)?qh(t):Array.isArray(t)?Array.prototype.concat.apply(rl,t.map(function(f){return Wr(f,i,s,c)})):[t.toString()]}function Yh(t){for(var i=0;i<t.length;i+=1){var s=t[i];if(pn(s)&&!qc(s))return!1}return!0}var Wx=Uh(tl),Bx=(function(){function t(i,s,c){this.rules=i,this.staticRulesId="",this.isStatic=(c===void 0||c.isStatic)&&Yh(i),this.componentId=s,this.baseHash=Gn(Wx,s),this.baseStyle=c,Ws.registerId(s)}return t.prototype.generateAndInjectStyles=function(i,s,c){var u=this.baseStyle?this.baseStyle.generateAndInjectStyles(i,s,c):"";if(this.isStatic&&!c.hash)if(this.staticRulesId&&s.hasNameForId(this.componentId,this.staticRulesId))u=cn(u,this.staticRulesId);else{var h=Ms(Wr(this.rules,i,s,c)),f=zc(Gn(this.baseHash,h)>>>0);if(!s.hasNameForId(this.componentId,f)){var v=c(h,".".concat(f),void 0,this.componentId);s.insertRules(this.componentId,f,v)}u=cn(u,f),this.staticRulesId=f}else{for(var m=Gn(this.baseHash,c.hash),g="",k=0;k<this.rules.length;k++){var w=this.rules[k];if(typeof w=="string")g+=w;else if(w){var b=Ms(Wr(w,i,s,c));m=Gn(m,b+k),g+=b}}if(g){var R=zc(m>>>0);s.hasNameForId(this.componentId,R)||s.insertRules(this.componentId,R,c(g,".".concat(R),void 0,this.componentId)),u=cn(u,R)}}return u},t})(),oi=He.createContext(void 0);oi.Consumer;function Qh(t){var i=He.useContext(oi),s=S.useMemo(function(){return(function(c,u){if(!c)throw hn(14);if(pn(c)){var h=c(u);return h}if(Array.isArray(c)||typeof c!="object")throw hn(8);return u?et(et({},u),c):c})(t.theme,i)},[t.theme,i]);return t.children?He.createElement(oi.Provider,{value:s},t.children):null}var ac={};function Jx(t,i,s){var c=qc(t),u=t,h=!lc(t),f=i.attrs,v=f===void 0?rl:f,m=i.componentId,g=m===void 0?(function(D,A){var F=typeof D!="string"?"sc":yp(D);ac[F]=(ac[F]||0)+1;var N="".concat(F,"-").concat(Gc(tl+F+ac[F]));return A?"".concat(A,"-").concat(N):N})(i.displayName,i.parentComponentId):m,k=i.displayName,w=k===void 0?(function(D){return lc(D)?"styled.".concat(D):"Styled(".concat(yx(D),")")})(t):k,b=i.displayName&&i.componentId?"".concat(yp(i.displayName),"-").concat(i.componentId):i.componentId||g,R=c&&u.attrs?u.attrs.concat(v).filter(Boolean):v,L=i.shouldForwardProp;if(c&&u.shouldForwardProp){var M=u.shouldForwardProp;if(i.shouldForwardProp){var E=i.shouldForwardProp;L=function(D,A){return M(D,A)&&E(D,A)}}else L=M}var C=new Bx(s,b,c?u.componentStyle:void 0);function z(D,A){return(function(F,N,B){var ee=F.attrs,Y=F.componentStyle,le=F.defaultProps,oe=F.foldedComponentIds,G=F.styledComponentId,ce=F.target,_e=He.useContext(oi),xe=Rc(),ve=F.shouldForwardProp||xe.shouldForwardProp,K=Nh(N,_e,le)||to,X=(function(ge,he,Se){for(var ye,ke=et(et({},he),{className:void 0,theme:Se}),tt=0;tt<ge.length;tt+=1){var er=pn(ye=ge[tt])?ye(ke):ye;for(var Pt in er)ke[Pt]=Pt==="className"?cn(ke[Pt],er[Pt]):Pt==="style"?et(et({},ke[Pt]),er[Pt]):er[Pt]}return he.className&&(ke.className=cn(ke.className,he.className)),ke})(ee,N,K),q=X.as||ce,_={};for(var U in X)X[U]===void 0||U[0]==="$"||U==="as"||U==="theme"&&X.theme===K||(U==="forwardedAs"?_.as=X.forwardedAs:ve&&!ve(U,q)||(_[U]=X[U]));var de=(function(ge,he){var Se=Rc(),ye=ge.generateAndInjectStyles(he,Se.styleSheet,Se.stylis);return ye})(Y,X),ue=cn(oe,G);return de&&(ue+=" "+de),X.className&&(ue+=" "+X.className),_[lc(q)&&!Dh.has(q)?"class":"className"]=ue,B&&(_.ref=B),S.createElement(q,_)})(O,D,A)}z.displayName=w;var O=He.forwardRef(z);return O.attrs=R,O.componentStyle=C,O.displayName=w,O.shouldForwardProp=L,O.foldedComponentIds=c?cn(u.foldedComponentIds,u.styledComponentId):"",O.styledComponentId=b,O.target=c?u.target:t,Object.defineProperty(O,"defaultProps",{get:function(){return this._foldedDefaultProps},set:function(D){this._foldedDefaultProps=c?(function(A){for(var F=[],N=1;N<arguments.length;N++)F[N-1]=arguments[N];for(var B=0,ee=F;B<ee.length;B++)Pc(A,ee[B],!0);return A})({},u.defaultProps,D):D}}),Yc(O,function(){return".".concat(O.styledComponentId)}),h&&Bh(O,t,{attrs:!0,componentStyle:!0,displayName:!0,foldedComponentIds:!0,shouldForwardProp:!0,styledComponentId:!0,target:!0}),O}function Cp(t,i){for(var s=[t[0]],c=0,u=i.length;c<u;c+=1)s.push(i[c],t[c+1]);return s}var Ip=function(t){return Object.assign(t,{isCss:!0})};function nl(t){for(var i=[],s=1;s<arguments.length;s++)i[s-1]=arguments[s];if(pn(t)||ni(t))return Ip(Wr(Cp(rl,Qn([t],i,!0))));var c=t;return i.length===0&&c.length===1&&typeof c[0]=="string"?Wr(c):Ip(Wr(Cp(c,i)))}function Oc(t,i,s){if(s===void 0&&(s=to),!i)throw hn(1,i);var c=function(u){for(var h=[],f=1;f<arguments.length;f++)h[f-1]=arguments[f];return t(i,s,nl.apply(void 0,Qn([u],h,!1)))};return c.attrs=function(u){return Oc(t,i,et(et({},s),{attrs:Array.prototype.concat(s.attrs,u).filter(Boolean)}))},c.withConfig=function(u){return Oc(t,i,et(et({},s),u))},c}var Xh=function(t){return Oc(Jx,t)},x=Xh;Dh.forEach(function(t){x[t]=Xh(t)});var Hx=(function(){function t(i,s){this.rules=i,this.componentId=s,this.isStatic=Yh(i),Ws.registerId(this.componentId+1)}return t.prototype.createStyles=function(i,s,c,u){var h=u(Ms(Wr(this.rules,s,c,u)),""),f=this.componentId+i;c.insertRules(f,f,h)},t.prototype.removeStyles=function(i,s){s.clearRules(this.componentId+i)},t.prototype.renderStyles=function(i,s,c,u){i>2&&Ws.registerId(this.componentId+i),this.removeStyles(i,c),this.createStyles(i,s,c,u)},t})();function Vx(t){for(var i=[],s=1;s<arguments.length;s++)i[s-1]=arguments[s];var c=nl.apply(void 0,Qn([t],i,!1)),u="sc-global-".concat(Gc(JSON.stringify(c))),h=new Hx(c,u),f=function(m){var g=Rc(),k=He.useContext(oi),w=He.useRef(g.styleSheet.allocateGSInstance(u)).current;return g.styleSheet.server&&v(w,m,g.styleSheet,k,g.stylis),He.useLayoutEffect(function(){if(!g.styleSheet.server)return v(w,m,g.styleSheet,k,g.stylis),function(){return h.removeStyles(w,g.styleSheet)}},[w,m,g.styleSheet,k,g.stylis]),null};function v(m,g,k,w,b){if(h.isStatic)h.renderStyles(m,px,k,b);else{var R=et(et({},g),{theme:Nh(g,w,f.defaultProps)});h.renderStyles(m,R,k,b)}}return He.memo(f)}function Kx(t){for(var i=[],s=1;s<arguments.length;s++)i[s-1]=arguments[s];var c=Ms(nl.apply(void 0,Qn([t],i,!1))),u=Gc(c);return new Kh(u,c)}const Qc="pingone_playground_",qn=t=>`${Qc}${t}`,cr={setItem(t,i){try{const s=typeof i=="string"?i:JSON.stringify(i);return window.localStorage.setItem(qn(t),s),!0}catch(s){return console.error("Error saving to localStorage:",s),!1}},getItem(t,i=null){try{const s=window.localStorage.getItem(qn(t));if(s===null)return i;try{return JSON.parse(s)}catch{return s}}catch(s){return console.error("Error reading from localStorage:",s),i}},removeItem(t){try{return window.localStorage.removeItem(qn(t)),!0}catch(i){return console.error("Error removing from localStorage:",i),!1}},clear(){try{return Object.keys(window.localStorage).forEach(t=>{t.startsWith(Qc)&&window.localStorage.removeItem(t)}),!0}catch(t){return console.error("Error clearing localStorage:",t),!1}}},dr={setItem(t,i){try{const s=typeof i=="string"?i:JSON.stringify(i);return window.sessionStorage.setItem(qn(t),s),!0}catch(s){return console.error("Error saving to sessionStorage:",s),!1}},getItem(t,i=null){try{const s=window.sessionStorage.getItem(qn(t));if(s===null)return i;try{return JSON.parse(s)}catch{return s}}catch(s){return console.error("Error reading from sessionStorage:",s),i}},removeItem(t){try{return window.sessionStorage.removeItem(qn(t)),!0}catch(i){return console.error("Error removing from sessionStorage:",i),!1}},clear(){try{return Object.keys(window.sessionStorage).forEach(t=>{t.startsWith(Qc)&&window.sessionStorage.removeItem(t)}),!0}catch(t){return console.error("Error clearing sessionStorage:",t),!1}}},Qe={setState(t){return dr.setItem("oauth_state",t)},getState(){return dr.getItem("oauth_state")},clearState(){return dr.removeItem("oauth_state")},setNonce(t){return dr.setItem("oauth_nonce",t)},getNonce(){return dr.getItem("oauth_nonce")},clearNonce(){return dr.removeItem("oauth_nonce")},setCodeVerifier(t){return dr.setItem("pkce_code_verifier",t)},getCodeVerifier(){return dr.getItem("pkce_code_verifier")},clearCodeVerifier(){return dr.removeItem("pkce_code_verifier")},setTokens(t){return cr.setItem("auth_tokens",t)},getTokens(){return cr.getItem("auth_tokens")},clearTokens(){return cr.removeItem("auth_tokens")},setUserInfo(t){return cr.setItem("user_info",t)},getUserInfo(){return cr.getItem("user_info")},clearUserInfo(){return cr.removeItem("user_info")},setConfig(t){return cr.setItem("oauth_config",t)},getConfig(){return cr.getItem("oauth_config")},clearConfig(){return cr.removeItem("oauth_config")},clearAll(){this.clearState(),this.clearNonce(),this.clearCodeVerifier(),this.clearTokens(),this.clearUserInfo()}};var hr={};const cc={title:hr.PINGONE_APP_TITLE||"PingOne OAuth Playground",description:hr.PINGONE_APP_DESCRIPTION||"Interactive playground for OAuth 2.0 and OpenID Connect with PingOne",version:hr.PINGONE_APP_VERSION||"1.0.0"},Mt={environmentId:hr.PINGONE_ENVIRONMENT_ID||"",clientId:hr.PINGONE_CLIENT_ID||"",clientSecret:hr.PINGONE_CLIENT_SECRET||"",redirectUri:hr.PINGONE_REDIRECT_URI||`${window.location.origin}/callback`,logoutRedirectUri:hr.PINGONE_LOGOUT_REDIRECT_URI||window.location.origin,apiUrl:hr.PINGONE_API_URL||"https://auth.pingone.com",authServerId:"",baseUrl:"",authUrl:"",authorizationEndpoint:"",tokenEndpoint:"",userInfoEndpoint:"",logoutEndpoint:""},_p={codeChallengeMethod:"S256",codeVerifierLength:64},Ep="openid profile email",Xc=crypto,Zh=t=>t instanceof CryptoKey,ws=new TextEncoder,ol=new TextDecoder;function Gx(...t){const i=t.reduce((u,{length:h})=>u+h,0),s=new Uint8Array(i);let c=0;for(const u of t)s.set(u,c),c+=u.length;return s}const qx=t=>{const i=atob(t),s=new Uint8Array(i.length);for(let c=0;c<i.length;c++)s[c]=i.charCodeAt(c);return s},fn=t=>{let i=t;i instanceof Uint8Array&&(i=ol.decode(i)),i=i.replace(/-/g,"+").replace(/_/g,"/").replace(/\s/g,"");try{return qx(i)}catch{throw new TypeError("The input to be decoded is not correctly encoded.")}};class ot extends Error{constructor(i,s){var c;super(i,s),this.code="ERR_JOSE_GENERIC",this.name=this.constructor.name,(c=Error.captureStackTrace)==null||c.call(Error,this,this.constructor)}}ot.code="ERR_JOSE_GENERIC";class Wt extends ot{constructor(i,s,c="unspecified",u="unspecified"){super(i,{cause:{claim:c,reason:u,payload:s}}),this.code="ERR_JWT_CLAIM_VALIDATION_FAILED",this.claim=c,this.reason=u,this.payload=s}}Wt.code="ERR_JWT_CLAIM_VALIDATION_FAILED";class Nc extends ot{constructor(i,s,c="unspecified",u="unspecified"){super(i,{cause:{claim:c,reason:u,payload:s}}),this.code="ERR_JWT_EXPIRED",this.claim=c,this.reason=u,this.payload=s}}Nc.code="ERR_JWT_EXPIRED";class em extends ot{constructor(){super(...arguments),this.code="ERR_JOSE_ALG_NOT_ALLOWED"}}em.code="ERR_JOSE_ALG_NOT_ALLOWED";class Xt extends ot{constructor(){super(...arguments),this.code="ERR_JOSE_NOT_SUPPORTED"}}Xt.code="ERR_JOSE_NOT_SUPPORTED";class Yx extends ot{constructor(i="decryption operation failed",s){super(i,s),this.code="ERR_JWE_DECRYPTION_FAILED"}}Yx.code="ERR_JWE_DECRYPTION_FAILED";class Qx extends ot{constructor(){super(...arguments),this.code="ERR_JWE_INVALID"}}Qx.code="ERR_JWE_INVALID";class Xe extends ot{constructor(){super(...arguments),this.code="ERR_JWS_INVALID"}}Xe.code="ERR_JWS_INVALID";class Zc extends ot{constructor(){super(...arguments),this.code="ERR_JWT_INVALID"}}Zc.code="ERR_JWT_INVALID";class Xx extends ot{constructor(){super(...arguments),this.code="ERR_JWK_INVALID"}}Xx.code="ERR_JWK_INVALID";class ed extends ot{constructor(){super(...arguments),this.code="ERR_JWKS_INVALID"}}ed.code="ERR_JWKS_INVALID";class td extends ot{constructor(i="no applicable key found in the JSON Web Key Set",s){super(i,s),this.code="ERR_JWKS_NO_MATCHING_KEY"}}td.code="ERR_JWKS_NO_MATCHING_KEY";class tm extends ot{constructor(i="multiple matching keys found in the JSON Web Key Set",s){super(i,s),this.code="ERR_JWKS_MULTIPLE_MATCHING_KEYS"}}tm.code="ERR_JWKS_MULTIPLE_MATCHING_KEYS";class rm extends ot{constructor(i="request timed out",s){super(i,s),this.code="ERR_JWKS_TIMEOUT"}}rm.code="ERR_JWKS_TIMEOUT";class nm extends ot{constructor(i="signature verification failed",s){super(i,s),this.code="ERR_JWS_SIGNATURE_VERIFICATION_FAILED"}}nm.code="ERR_JWS_SIGNATURE_VERIFICATION_FAILED";function Yt(t,i="algorithm.name"){return new TypeError(`CryptoKey does not support this operation, its ${i} must be ${t}`)}function qo(t,i){return t.name===i}function dc(t){return parseInt(t.name.slice(4),10)}function Zx(t){switch(t){case"ES256":return"P-256";case"ES384":return"P-384";case"ES512":return"P-521";default:throw new Error("unreachable")}}function ev(t,i){if(i.length&&!i.some(s=>t.usages.includes(s))){let s="CryptoKey does not support this operation, its usages must include ";if(i.length>2){const c=i.pop();s+=`one of ${i.join(", ")}, or ${c}.`}else i.length===2?s+=`one of ${i[0]} or ${i[1]}.`:s+=`${i[0]}.`;throw new TypeError(s)}}function tv(t,i,...s){switch(i){case"HS256":case"HS384":case"HS512":{if(!qo(t.algorithm,"HMAC"))throw Yt("HMAC");const c=parseInt(i.slice(2),10);if(dc(t.algorithm.hash)!==c)throw Yt(`SHA-${c}`,"algorithm.hash");break}case"RS256":case"RS384":case"RS512":{if(!qo(t.algorithm,"RSASSA-PKCS1-v1_5"))throw Yt("RSASSA-PKCS1-v1_5");const c=parseInt(i.slice(2),10);if(dc(t.algorithm.hash)!==c)throw Yt(`SHA-${c}`,"algorithm.hash");break}case"PS256":case"PS384":case"PS512":{if(!qo(t.algorithm,"RSA-PSS"))throw Yt("RSA-PSS");const c=parseInt(i.slice(2),10);if(dc(t.algorithm.hash)!==c)throw Yt(`SHA-${c}`,"algorithm.hash");break}case"EdDSA":{if(t.algorithm.name!=="Ed25519"&&t.algorithm.name!=="Ed448")throw Yt("Ed25519 or Ed448");break}case"Ed25519":{if(!qo(t.algorithm,"Ed25519"))throw Yt("Ed25519");break}case"ES256":case"ES384":case"ES512":{if(!qo(t.algorithm,"ECDSA"))throw Yt("ECDSA");const c=Zx(i);if(t.algorithm.namedCurve!==c)throw Yt(c,"algorithm.namedCurve");break}default:throw new TypeError("CryptoKey does not support this operation")}ev(t,s)}function om(t,i,...s){var c;if(s=s.filter(Boolean),s.length>2){const u=s.pop();t+=`one of type ${s.join(", ")}, or ${u}.`}else s.length===2?t+=`one of type ${s[0]} or ${s[1]}.`:t+=`of type ${s[0]}.`;return i==null?t+=` Received ${i}`:typeof i=="function"&&i.name?t+=` Received function ${i.name}`:typeof i=="object"&&i!=null&&(c=i.constructor)!=null&&c.name&&(t+=` Received an instance of ${i.constructor.name}`),t}const $p=(t,...i)=>om("Key must be ",t,...i);function im(t,i,...s){return om(`Key for the ${t} algorithm must be `,i,...s)}const sm=t=>Zh(t)?!0:(t==null?void 0:t[Symbol.toStringTag])==="KeyObject",Bs=["CryptoKey"],rv=(...t)=>{const i=t.filter(Boolean);if(i.length===0||i.length===1)return!0;let s;for(const c of i){const u=Object.keys(c);if(!s||s.size===0){s=new Set(u);continue}for(const h of u){if(s.has(h))return!1;s.add(h)}}return!0};function nv(t){return typeof t=="object"&&t!==null}function Br(t){if(!nv(t)||Object.prototype.toString.call(t)!=="[object Object]")return!1;if(Object.getPrototypeOf(t)===null)return!0;let i=t;for(;Object.getPrototypeOf(i)!==null;)i=Object.getPrototypeOf(i);return Object.getPrototypeOf(t)===i}const ov=(t,i)=>{if(t.startsWith("RS")||t.startsWith("PS")){const{modulusLength:s}=i.algorithm;if(typeof s!="number"||s<2048)throw new TypeError(`${t} requires key modulusLength to be 2048 bits or larger`)}};function so(t){return Br(t)&&typeof t.kty=="string"}function iv(t){return t.kty!=="oct"&&typeof t.d=="string"}function sv(t){return t.kty!=="oct"&&typeof t.d>"u"}function lv(t){return so(t)&&t.kty==="oct"&&typeof t.k=="string"}function av(t){let i,s;switch(t.kty){case"RSA":{switch(t.alg){case"PS256":case"PS384":case"PS512":i={name:"RSA-PSS",hash:`SHA-${t.alg.slice(-3)}`},s=t.d?["sign"]:["verify"];break;case"RS256":case"RS384":case"RS512":i={name:"RSASSA-PKCS1-v1_5",hash:`SHA-${t.alg.slice(-3)}`},s=t.d?["sign"]:["verify"];break;case"RSA-OAEP":case"RSA-OAEP-256":case"RSA-OAEP-384":case"RSA-OAEP-512":i={name:"RSA-OAEP",hash:`SHA-${parseInt(t.alg.slice(-3),10)||1}`},s=t.d?["decrypt","unwrapKey"]:["encrypt","wrapKey"];break;default:throw new Xt('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')}break}case"EC":{switch(t.alg){case"ES256":i={name:"ECDSA",namedCurve:"P-256"},s=t.d?["sign"]:["verify"];break;case"ES384":i={name:"ECDSA",namedCurve:"P-384"},s=t.d?["sign"]:["verify"];break;case"ES512":i={name:"ECDSA",namedCurve:"P-521"},s=t.d?["sign"]:["verify"];break;case"ECDH-ES":case"ECDH-ES+A128KW":case"ECDH-ES+A192KW":case"ECDH-ES+A256KW":i={name:"ECDH",namedCurve:t.crv},s=t.d?["deriveBits"]:[];break;default:throw new Xt('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')}break}case"OKP":{switch(t.alg){case"Ed25519":i={name:"Ed25519"},s=t.d?["sign"]:["verify"];break;case"EdDSA":i={name:t.crv},s=t.d?["sign"]:["verify"];break;case"ECDH-ES":case"ECDH-ES+A128KW":case"ECDH-ES+A192KW":case"ECDH-ES+A256KW":i={name:t.crv},s=t.d?["deriveBits"]:[];break;default:throw new Xt('Invalid or unsupported JWK "alg" (Algorithm) Parameter value')}break}default:throw new Xt('Invalid or unsupported JWK "kty" (Key Type) Parameter value')}return{algorithm:i,keyUsages:s}}const lm=async t=>{if(!t.alg)throw new TypeError('"alg" argument is required when "jwk.alg" is not present');const{algorithm:i,keyUsages:s}=av(t),c=[i,t.ext??!1,t.key_ops??s],u={...t};return delete u.alg,delete u.use,Xc.subtle.importKey("jwk",u,...c)},am=t=>fn(t);let Bn,Jn;const cm=t=>(t==null?void 0:t[Symbol.toStringTag])==="KeyObject",Js=async(t,i,s,c,u=!1)=>{let h=t.get(i);if(h!=null&&h[c])return h[c];const f=await lm({...s,alg:c});return u&&Object.freeze(i),h?h[c]=f:t.set(i,{[c]:f}),f},cv=(t,i)=>{if(cm(t)){let s=t.export({format:"jwk"});return delete s.d,delete s.dp,delete s.dq,delete s.p,delete s.q,delete s.qi,s.k?am(s.k):(Jn||(Jn=new WeakMap),Js(Jn,t,s,i))}return so(t)?t.k?fn(t.k):(Jn||(Jn=new WeakMap),Js(Jn,t,t,i,!0)):t},dv=(t,i)=>{if(cm(t)){let s=t.export({format:"jwk"});return s.k?am(s.k):(Bn||(Bn=new WeakMap),Js(Bn,t,s,i))}return so(t)?t.k?fn(t.k):(Bn||(Bn=new WeakMap),Js(Bn,t,t,i,!0)):t},uv={normalizePublicKey:cv,normalizePrivateKey:dv};async function dm(t,i){if(!Br(t))throw new TypeError("JWK must be an object");switch(i||(i=t.alg),t.kty){case"oct":if(typeof t.k!="string"||!t.k)throw new TypeError('missing "k" (Key Value) Parameter value');return fn(t.k);case"RSA":if("oth"in t&&t.oth!==void 0)throw new Xt('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');case"EC":case"OKP":return lm({...t,alg:i});default:throw new Xt('Unsupported "kty" (Key Type) Parameter value')}}const Kn=t=>t==null?void 0:t[Symbol.toStringTag],Dc=(t,i,s)=>{var c,u;if(i.use!==void 0&&i.use!=="sig")throw new TypeError("Invalid key for this operation, when present its use must be sig");if(i.key_ops!==void 0&&((u=(c=i.key_ops).includes)==null?void 0:u.call(c,s))!==!0)throw new TypeError(`Invalid key for this operation, when present its key_ops must include ${s}`);if(i.alg!==void 0&&i.alg!==t)throw new TypeError(`Invalid key for this operation, when present its alg must be ${t}`);return!0},fv=(t,i,s,c)=>{if(!(i instanceof Uint8Array)){if(c&&so(i)){if(lv(i)&&Dc(t,i,s))return;throw new TypeError('JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present')}if(!sm(i))throw new TypeError(im(t,i,...Bs,"Uint8Array",c?"JSON Web Key":null));if(i.type!=="secret")throw new TypeError(`${Kn(i)} instances for symmetric algorithms must be of type "secret"`)}},pv=(t,i,s,c)=>{if(c&&so(i))switch(s){case"sign":if(iv(i)&&Dc(t,i,s))return;throw new TypeError("JSON Web Key for this operation be a private JWK");case"verify":if(sv(i)&&Dc(t,i,s))return;throw new TypeError("JSON Web Key for this operation be a public JWK")}if(!sm(i))throw new TypeError(im(t,i,...Bs,c?"JSON Web Key":null));if(i.type==="secret")throw new TypeError(`${Kn(i)} instances for asymmetric algorithms must not be of type "secret"`);if(s==="sign"&&i.type==="public")throw new TypeError(`${Kn(i)} instances for asymmetric algorithm signing must be of type "private"`);if(s==="decrypt"&&i.type==="public")throw new TypeError(`${Kn(i)} instances for asymmetric algorithm decryption must be of type "private"`);if(i.algorithm&&s==="verify"&&i.type==="private")throw new TypeError(`${Kn(i)} instances for asymmetric algorithm verifying must be of type "public"`);if(i.algorithm&&s==="encrypt"&&i.type==="private")throw new TypeError(`${Kn(i)} instances for asymmetric algorithm encryption must be of type "public"`)};function um(t,i,s,c){i.startsWith("HS")||i==="dir"||i.startsWith("PBES2")||/^A\d{3}(?:GCM)?KW$/.test(i)?fv(i,s,c,t):pv(i,s,c,t)}um.bind(void 0,!1);const Tp=um.bind(void 0,!0);function hv(t,i,s,c,u){if(u.crit!==void 0&&(c==null?void 0:c.crit)===void 0)throw new t('"crit" (Critical) Header Parameter MUST be integrity protected');if(!c||c.crit===void 0)return new Set;if(!Array.isArray(c.crit)||c.crit.length===0||c.crit.some(f=>typeof f!="string"||f.length===0))throw new t('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');let h;s!==void 0?h=new Map([...Object.entries(s),...i.entries()]):h=i;for(const f of c.crit){if(!h.has(f))throw new Xt(`Extension Header Parameter "${f}" is not recognized`);if(u[f]===void 0)throw new t(`Extension Header Parameter "${f}" is missing`);if(h.get(f)&&c[f]===void 0)throw new t(`Extension Header Parameter "${f}" MUST be integrity protected`)}return new Set(c.crit)}const mv=(t,i)=>{if(i!==void 0&&(!Array.isArray(i)||i.some(s=>typeof s!="string")))throw new TypeError(`"${t}" option must be an array of strings`);if(i)return new Set(i)};function gv(t,i){const s=`SHA-${t.slice(-3)}`;switch(t){case"HS256":case"HS384":case"HS512":return{hash:s,name:"HMAC"};case"PS256":case"PS384":case"PS512":return{hash:s,name:"RSA-PSS",saltLength:t.slice(-3)>>3};case"RS256":case"RS384":case"RS512":return{hash:s,name:"RSASSA-PKCS1-v1_5"};case"ES256":case"ES384":case"ES512":return{hash:s,name:"ECDSA",namedCurve:i.namedCurve};case"Ed25519":return{name:"Ed25519"};case"EdDSA":return{name:i.name};default:throw new Xt(`alg ${t} is not supported either by JOSE or your javascript runtime`)}}async function yv(t,i,s){if(i=await uv.normalizePublicKey(i,t),Zh(i))return tv(i,t,s),i;if(i instanceof Uint8Array){if(!t.startsWith("HS"))throw new TypeError($p(i,...Bs));return Xc.subtle.importKey("raw",i,{hash:`SHA-${t.slice(-3)}`,name:"HMAC"},!1,[s])}throw new TypeError($p(i,...Bs,"Uint8Array","JSON Web Key"))}const xv=async(t,i,s,c)=>{const u=await yv(t,i,"verify");ov(t,u);const h=gv(t,u.algorithm);try{return await Xc.subtle.verify(h,u,s,c)}catch{return!1}};async function vv(t,i,s){if(!Br(t))throw new Xe("Flattened JWS must be an object");if(t.protected===void 0&&t.header===void 0)throw new Xe('Flattened JWS must have either of the "protected" or "header" members');if(t.protected!==void 0&&typeof t.protected!="string")throw new Xe("JWS Protected Header incorrect type");if(t.payload===void 0)throw new Xe("JWS Payload missing");if(typeof t.signature!="string")throw new Xe("JWS Signature missing or incorrect type");if(t.header!==void 0&&!Br(t.header))throw new Xe("JWS Unprotected Header incorrect type");let c={};if(t.protected)try{const M=fn(t.protected);c=JSON.parse(ol.decode(M))}catch{throw new Xe("JWS Protected Header is invalid")}if(!rv(c,t.header))throw new Xe("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");const u={...c,...t.header},h=hv(Xe,new Map([["b64",!0]]),s==null?void 0:s.crit,c,u);let f=!0;if(h.has("b64")&&(f=c.b64,typeof f!="boolean"))throw new Xe('The "b64" (base64url-encode payload) Header Parameter must be a boolean');const{alg:v}=u;if(typeof v!="string"||!v)throw new Xe('JWS "alg" (Algorithm) Header Parameter missing or invalid');const m=s&&mv("algorithms",s.algorithms);if(m&&!m.has(v))throw new em('"alg" (Algorithm) Header Parameter value not allowed');if(f){if(typeof t.payload!="string")throw new Xe("JWS Payload must be a string")}else if(typeof t.payload!="string"&&!(t.payload instanceof Uint8Array))throw new Xe("JWS Payload must be a string or an Uint8Array instance");let g=!1;typeof i=="function"?(i=await i(c,t),g=!0,Tp(v,i,"verify"),so(i)&&(i=await dm(i,v))):Tp(v,i,"verify");const k=Gx(ws.encode(t.protected??""),ws.encode("."),typeof t.payload=="string"?ws.encode(t.payload):t.payload);let w;try{w=fn(t.signature)}catch{throw new Xe("Failed to base64url decode the signature")}if(!await xv(v,i,w,k))throw new nm;let R;if(f)try{R=fn(t.payload)}catch{throw new Xe("Failed to base64url decode the payload")}else typeof t.payload=="string"?R=ws.encode(t.payload):R=t.payload;const L={payload:R};return t.protected!==void 0&&(L.protectedHeader=c),t.header!==void 0&&(L.unprotectedHeader=t.header),g?{...L,key:i}:L}async function wv(t,i,s){if(t instanceof Uint8Array&&(t=ol.decode(t)),typeof t!="string")throw new Xe("Compact JWS must be a string or Uint8Array");const{0:c,1:u,2:h,length:f}=t.split(".");if(f!==3)throw new Xe("Invalid Compact JWS");const v=await vv({payload:u,protected:c,signature:h},i,s),m={payload:v.payload,protectedHeader:v.protectedHeader};return typeof i=="function"?{...m,key:v.key}:m}const kv=t=>Math.floor(t.getTime()/1e3),fm=60,pm=fm*60,rd=pm*24,jv=rd*7,Sv=rd*365.25,bv=/^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i,zp=t=>{const i=bv.exec(t);if(!i||i[4]&&i[1])throw new TypeError("Invalid time period format");const s=parseFloat(i[2]),c=i[3].toLowerCase();let u;switch(c){case"sec":case"secs":case"second":case"seconds":case"s":u=Math.round(s);break;case"minute":case"minutes":case"min":case"mins":case"m":u=Math.round(s*fm);break;case"hour":case"hours":case"hr":case"hrs":case"h":u=Math.round(s*pm);break;case"day":case"days":case"d":u=Math.round(s*rd);break;case"week":case"weeks":case"w":u=Math.round(s*jv);break;default:u=Math.round(s*Sv);break}return i[1]==="-"||i[4]==="ago"?-u:u},Pp=t=>t.toLowerCase().replace(/^application\//,""),Cv=(t,i)=>typeof t=="string"?i.includes(t):Array.isArray(t)?i.some(Set.prototype.has.bind(new Set(t))):!1,Iv=(t,i,s={})=>{let c;try{c=JSON.parse(ol.decode(i))}catch{}if(!Br(c))throw new Zc("JWT Claims Set must be a top-level JSON object");const{typ:u}=s;if(u&&(typeof t.typ!="string"||Pp(t.typ)!==Pp(u)))throw new Wt('unexpected "typ" JWT header value',c,"typ","check_failed");const{requiredClaims:h=[],issuer:f,subject:v,audience:m,maxTokenAge:g}=s,k=[...h];g!==void 0&&k.push("iat"),m!==void 0&&k.push("aud"),v!==void 0&&k.push("sub"),f!==void 0&&k.push("iss");for(const L of new Set(k.reverse()))if(!(L in c))throw new Wt(`missing required "${L}" claim`,c,L,"missing");if(f&&!(Array.isArray(f)?f:[f]).includes(c.iss))throw new Wt('unexpected "iss" claim value',c,"iss","check_failed");if(v&&c.sub!==v)throw new Wt('unexpected "sub" claim value',c,"sub","check_failed");if(m&&!Cv(c.aud,typeof m=="string"?[m]:m))throw new Wt('unexpected "aud" claim value',c,"aud","check_failed");let w;switch(typeof s.clockTolerance){case"string":w=zp(s.clockTolerance);break;case"number":w=s.clockTolerance;break;case"undefined":w=0;break;default:throw new TypeError("Invalid clockTolerance option type")}const{currentDate:b}=s,R=kv(b||new Date);if((c.iat!==void 0||g)&&typeof c.iat!="number")throw new Wt('"iat" claim must be a number',c,"iat","invalid");if(c.nbf!==void 0){if(typeof c.nbf!="number")throw new Wt('"nbf" claim must be a number',c,"nbf","invalid");if(c.nbf>R+w)throw new Wt('"nbf" claim timestamp check failed',c,"nbf","check_failed")}if(c.exp!==void 0){if(typeof c.exp!="number")throw new Wt('"exp" claim must be a number',c,"exp","invalid");if(c.exp<=R-w)throw new Nc('"exp" claim timestamp check failed',c,"exp","check_failed")}if(g){const L=R-c.iat,M=typeof g=="number"?g:zp(g);if(L-w>M)throw new Nc('"iat" claim timestamp check failed (too far in the past)',c,"iat","check_failed");if(L<0-w)throw new Wt('"iat" claim timestamp check failed (it should be in the past)',c,"iat","check_failed")}return c};async function _v(t,i,s){var f;const c=await wv(t,i,s);if((f=c.protectedHeader.crit)!=null&&f.includes("b64")&&c.protectedHeader.b64===!1)throw new Zc("JWTs MUST NOT use unencoded payload");const h={payload:Iv(c.protectedHeader,c.payload,s),protectedHeader:c.protectedHeader};return typeof i=="function"?{...h,key:c.key}:h}function Ev(t){switch(typeof t=="string"&&t.slice(0,2)){case"RS":case"PS":return"RSA";case"ES":return"EC";case"Ed":return"OKP";default:throw new Xt('Unsupported "alg" value for a JSON Web Key Set')}}function $v(t){return t&&typeof t=="object"&&Array.isArray(t.keys)&&t.keys.every(Tv)}function Tv(t){return Br(t)}function hm(t){return typeof structuredClone=="function"?structuredClone(t):JSON.parse(JSON.stringify(t))}class zv{constructor(i){if(this._cached=new WeakMap,!$v(i))throw new ed("JSON Web Key Set malformed");this._jwks=hm(i)}async getKey(i,s){const{alg:c,kid:u}={...i,...s==null?void 0:s.header},h=Ev(c),f=this._jwks.keys.filter(g=>{let k=h===g.kty;if(k&&typeof u=="string"&&(k=u===g.kid),k&&typeof g.alg=="string"&&(k=c===g.alg),k&&typeof g.use=="string"&&(k=g.use==="sig"),k&&Array.isArray(g.key_ops)&&(k=g.key_ops.includes("verify")),k)switch(c){case"ES256":k=g.crv==="P-256";break;case"ES256K":k=g.crv==="secp256k1";break;case"ES384":k=g.crv==="P-384";break;case"ES512":k=g.crv==="P-521";break;case"Ed25519":k=g.crv==="Ed25519";break;case"EdDSA":k=g.crv==="Ed25519"||g.crv==="Ed448";break}return k}),{0:v,length:m}=f;if(m===0)throw new td;if(m!==1){const g=new tm,{_cached:k}=this;throw g[Symbol.asyncIterator]=async function*(){for(const w of f)try{yield await Ap(k,w,c)}catch{}},g}return Ap(this._cached,v,c)}}async function Ap(t,i,s){const c=t.get(i)||t.set(i,{}).get(i);if(c[s]===void 0){const u=await dm({...i,ext:!0},s);if(u instanceof Uint8Array||u.type!=="public")throw new ed("JSON Web Key Set members must be public keys");c[s]=u}return c[s]}function Rp(t){const i=new zv(t),s=async(c,u)=>i.getKey(c,u);return Object.defineProperties(s,{jwks:{value:()=>hm(i._jwks),enumerable:!0,configurable:!1,writable:!1}}),s}const Pv=async(t,i,s)=>{let c,u,h=!1;typeof AbortController=="function"&&(c=new AbortController,u=setTimeout(()=>{h=!0,c.abort()},i));const f=await fetch(t.href,{signal:c?c.signal:void 0,redirect:"manual",headers:s.headers}).catch(v=>{throw h?new rm:v});if(u!==void 0&&clearTimeout(u),f.status!==200)throw new ot("Expected 200 OK from the JSON Web Key Set HTTP response");try{return await f.json()}catch{throw new ot("Failed to parse the JSON Web Key Set HTTP response as JSON")}};function Av(){return typeof WebSocketPair<"u"||typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"||typeof EdgeRuntime<"u"&&EdgeRuntime==="vercel"}let Lc;var $s,dh;(typeof navigator>"u"||!((dh=($s=navigator.userAgent)==null?void 0:$s.startsWith)!=null&&dh.call($s,"Mozilla/5.0 ")))&&(Lc="jose/v5.10.0");const uc=Symbol();function Rv(t,i){return!(typeof t!="object"||t===null||!("uat"in t)||typeof t.uat!="number"||Date.now()-t.uat>=i||!("jwks"in t)||!Br(t.jwks)||!Array.isArray(t.jwks.keys)||!Array.prototype.every.call(t.jwks.keys,Br))}class Ov{constructor(i,s){if(!(i instanceof URL))throw new TypeError("url must be an instance of URL");this._url=new URL(i.href),this._options={agent:s==null?void 0:s.agent,headers:s==null?void 0:s.headers},this._timeoutDuration=typeof(s==null?void 0:s.timeoutDuration)=="number"?s==null?void 0:s.timeoutDuration:5e3,this._cooldownDuration=typeof(s==null?void 0:s.cooldownDuration)=="number"?s==null?void 0:s.cooldownDuration:3e4,this._cacheMaxAge=typeof(s==null?void 0:s.cacheMaxAge)=="number"?s==null?void 0:s.cacheMaxAge:6e5,(s==null?void 0:s[uc])!==void 0&&(this._cache=s==null?void 0:s[uc],Rv(s==null?void 0:s[uc],this._cacheMaxAge)&&(this._jwksTimestamp=this._cache.uat,this._local=Rp(this._cache.jwks)))}coolingDown(){return typeof this._jwksTimestamp=="number"?Date.now()<this._jwksTimestamp+this._cooldownDuration:!1}fresh(){return typeof this._jwksTimestamp=="number"?Date.now()<this._jwksTimestamp+this._cacheMaxAge:!1}async getKey(i,s){(!this._local||!this.fresh())&&await this.reload();try{return await this._local(i,s)}catch(c){if(c instanceof td&&this.coolingDown()===!1)return await this.reload(),this._local(i,s);throw c}}async reload(){this._pendingFetch&&Av()&&(this._pendingFetch=void 0);const i=new Headers(this._options.headers);Lc&&!i.has("User-Agent")&&(i.set("User-Agent",Lc),this._options.headers=Object.fromEntries(i.entries())),this._pendingFetch||(this._pendingFetch=Pv(this._url,this._timeoutDuration,this._options).then(s=>{this._local=Rp(s),this._cache&&(this._cache.uat=Date.now(),this._cache.jwks=s),this._jwksTimestamp=Date.now(),this._pendingFetch=void 0}).catch(s=>{throw this._pendingFetch=void 0,s})),await this._pendingFetch}}function Nv(t,i){const s=new Ov(t,i),c=async(u,h)=>s.getKey(u,h);return Object.defineProperties(c,{coolingDown:{get:()=>s.coolingDown(),enumerable:!0,configurable:!1},fresh:{get:()=>s.fresh(),enumerable:!0,configurable:!1},reload:{value:()=>s.reload(),enumerable:!0,configurable:!1,writable:!1},reloading:{get:()=>!!s._pendingFetch,enumerable:!0,configurable:!1},jwks:{value:()=>{var u;return(u=s._local)==null?void 0:u.jwks()},enumerable:!0,configurable:!1,writable:!1}}),c}const xt=async t=>{try{await fetch("/__log",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:t}),keepalive:!0})}catch{}},Hs=(t=32)=>{const i=new Uint8Array(Math.ceil(t/2));return crypto.getRandomValues(i),Array.from(i,s=>s.toString(16).padStart(2,"0")).join("").slice(0,t)},mm=()=>Hs(64),gm=async t=>{const s=new TextEncoder().encode(t),c=await crypto.subtle.digest("SHA-256",s);return btoa(String.fromCharCode(...new Uint8Array(c))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")},ym=t=>{console.log("🔍 [OAuth] Parsing URL parameters from:",t),xt(`[OAuth] Parsing URL parameters from: ${t}`);const i=new URLSearchParams(t.split("?")[1]||""),s={};console.log("🔍 [OAuth] Query parameters:"),xt("[OAuth] Query parameters:");for(const[u,h]of i.entries())s[u]=h,console.log(`   ${u}: ${h}`),xt(`   ${u}: ${h}`);const c=t.split("#")[1];if(c){console.log("🔍 [OAuth] Hash parameters:"),xt("[OAuth] Hash parameters:");const u=new URLSearchParams(c);for(const[h,f]of u.entries())s[h]=f,console.log(`   ${h}: ${f}`),xt(`   ${h}: ${f}`)}else console.log("🔍 [OAuth] No hash parameters found"),xt("[OAuth] No hash parameters found");return console.log("✅ [OAuth] Final parsed parameters:",s),xt(`[OAuth] Final parsed parameters: ${JSON.stringify(s)}`),s},xm=({authEndpoint:t,clientId:i,redirectUri:s,scope:c,state:u,codeChallenge:h,codeChallengeMethod:f="S256",responseType:v="code",requestUri:m})=>{const g=new URL(t),k=new URLSearchParams;return m?(k.append("client_id",i),k.append("request_uri",m)):(k.append("client_id",i),k.append("redirect_uri",s),k.append("response_type",v),k.append("scope",c),k.append("state",u),h&&(k.append("code_challenge",h),k.append("code_challenge_method",f))),g.search=k.toString(),g.toString()},vm=async({tokenEndpoint:t,clientId:i,redirectUri:s,code:c,codeVerifier:u,clientSecret:h})=>{const f=new URLSearchParams;f.append("grant_type","authorization_code"),f.append("client_id",i),f.append("redirect_uri",s),f.append("code",c),u&&f.append("code_verifier",u);const v={"Content-Type":"application/x-www-form-urlencoded"};if(h){const g=btoa(`${i}:${h}`);v.Authorization=`Basic ${g}`}const m=await fetch(t,{method:"POST",headers:v,body:f});if(!m.ok){const g=await m.json();throw new Error(g.error_description||"Failed to exchange code for tokens")}return m.json()},Dv=t=>{const i=`${t.replace(/\/$/,"")}/as/jwks`;return Nv(new URL(i))},Uc=async(t,i,s)=>{console.log("🔍 [OAuth] Validating ID token with signature verification..."),xt("[OAuth] Validating ID token with signature verification..."),console.log("🔍 [OAuth] Expected issuer:",s),xt(`[OAuth] Expected issuer: ${s}`),console.log("🔍 [OAuth] Expected clientId:",i),xt(`[OAuth] Expected clientId: ${i}`);try{const c=Dv(s),u=s.replace(/\/$/,""),h=u.endsWith("/as")?u:`${u}/as`,f=u.endsWith("/as")?u.replace("/as",""):u;console.log("🔍 [OAuth] Issuer validation details:"),console.log("   Expected base issuer:",f),console.log("   Expected issuer with /as:",h);const v={issuer:[f,h],audience:i},{payload:m,protectedHeader:g}=await _v(t,c,v);return console.log("🔍 [OAuth] Token header:",g),xt(`[OAuth] Token header: ${JSON.stringify(g)}`),console.log("🔍 [OAuth] Token payload:",{iss:m.iss,aud:m.aud,exp:m.exp,iat:m.iat,nbf:m.nbf,sub:m.sub}),xt(`[OAuth] Token payload: iss=${m.iss}, aud=${m.aud}, exp=${m.exp}, sub=${m.sub}`),console.log("✅ [OAuth] ID token signature and claims validation successful"),xt("[OAuth] ID token signature and claims validation successful"),m}catch(c){console.error("❌ [OAuth] Error validating ID token:",c);const u=c instanceof Error?c.message:String(c);throw xt(`[OAuth] Error validating ID token: ${u}`),new Error(`Invalid ID token: ${u}`)}},ii=async(t,i)=>{const s=await fetch(t,{headers:{Authorization:`Bearer ${i}`,"Content-Type":"application/json",Accept:"application/json"}});if(!s.ok)throw new Error("Failed to fetch user info");return s.json()},Lv=t=>{try{const s=t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),c=decodeURIComponent(atob(s).split("").map(u=>`%${`00${u.charCodeAt(0).toString(16)}`.slice(-2)}`).join(""));return JSON.parse(c)}catch(i){return console.error("Error parsing JWT:",i),null}},Os=t=>{const i=Lv(t);if(!(i!=null&&i.exp))return!0;const s=Date.now()/1e3;return i.exp<s},wm=S.createContext(void 0),Uv=({children:t})=>{const[i,s]=S.useState(null),[c,u]=S.useState(!1),[h,f]=S.useState(!0),[v,m]=S.useState(!1),g=Jt(),k=async E=>{try{await fetch("/__log",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:E}),keepalive:!0})}catch{}},w=()=>{console.log("🔍 [AuthContext] Reading configuration from localStorage...");try{const E=localStorage.getItem("pingone_config"),C=localStorage.getItem("login_credentials");console.log("🔍 [AuthContext] localStorage check:",{hasPingoneConfig:!!E,hasLoginCredentials:!!C});const z=E?JSON.parse(E):{},O=C?JSON.parse(C):{},D=z.environmentId||O.environmentId||Mt.environmentId,A=Mt.apiUrl||"https://auth.pingone.com",F=`${A}/${D}`,N=`${F}/as`,B=z.authEndpoint||`${N}/authorize`,ee=z.tokenEndpoint||`${N}/token`,Y=z.userInfoEndpoint||`${N}/userinfo`,le=`${N}/signoff`,oe={environmentId:D,clientId:z.clientId||O.clientId||Mt.clientId,clientSecret:z.clientSecret||O.clientSecret||Mt.clientSecret,redirectUri:z.redirectUri||Mt.redirectUri,logoutRedirectUri:Mt.logoutRedirectUri,apiUrl:A,authServerId:Mt.authServerId,baseUrl:F,authUrl:N,authorizationEndpoint:B,tokenEndpoint:ee,userInfoEndpoint:Y,logoutEndpoint:le};return console.log("✅ [AuthContext] Final configuration:",{environmentId:oe.environmentId,hasClientId:!!oe.clientId,hasClientSecret:!!oe.clientSecret,hasRedirectUri:!!oe.redirectUri,source:{fromPingoneConfig:!!z.environmentId,fromLoginCredentials:!!O.environmentId,fromDefaults:!z.environmentId&&!O.environmentId}}),oe}catch(E){return console.warn("❌ [AuthContext] Failed to load runtime config, using defaults.",E),Mt}};S.useEffect(()=>{(async()=>{try{console.log("🔄 [AuthContext] Initializing authentication..."),k("[AuthContext] Initializing authentication...");const C=Qe.getTokens();if(console.log("🔍 [AuthContext] Retrieved tokens from storage:",!!C),k(`[AuthContext] Retrieved tokens from storage: ${!!C}`),C!=null&&C.access_token){console.log("🔍 [AuthContext] Validating stored token..."),k("[AuthContext] Validating stored token...");const z=Date.now(),O=C.expires_at;if(console.log("🔍 [AuthContext] Token validation:",{currentTime:z,expiresAt:O,isExpired:O?z>=O:"no expiry set"}),O&&z>=O)console.log("⚠️ [AuthContext] Token has expired, clearing storage"),k("[AuthContext] Token has expired, clearing storage"),Qe.clearTokens(),Qe.clearAll(),s(null),u(!1);else{console.log("✅ [AuthContext] Token is valid, setting authenticated state"),k("[AuthContext] Token is valid, setting authenticated state"),u(!0);try{const D=await ii(Mt.userInfoEndpoint,C.access_token);s({id:D.sub,email:D.email||"",name:D.name||"",given_name:D.given_name||"",family_name:D.family_name||"",picture:D.picture||""}),console.log("✅ [AuthContext] User info retrieved successfully"),k("[AuthContext] User info retrieved successfully")}catch(D){console.warn("⚠️ [AuthContext] Could not fetch user info:",D),k("[AuthContext] Could not fetch user info"),s({authenticated:!0})}}}else console.log("ℹ️ [AuthContext] No tokens found in storage"),k("[AuthContext] No tokens found in storage"),s(null),u(!1)}catch(C){console.error("❌ [AuthContext] Auth initialization failed:",C),k("[AuthContext] Auth initialization failed"),Qe.clearTokens(),Qe.clearAll(),s(null),u(!1)}finally{f(!1),m(!0),console.log("✅ [AuthContext] Authentication initialization complete"),k("[AuthContext] Authentication initialization complete")}})()},[]);const M={user:i,isAuthenticated:c,isLoading:h,login:async()=>{try{f(!0);const E=Hs(32),C=mm(),z=await gm(C);Qe.setState(E),Qe.setCodeVerifier(C);const O=w(),D=xm({authEndpoint:O.authorizationEndpoint,clientId:O.clientId,redirectUri:O.redirectUri,scope:Ep,state:E,codeChallenge:z,codeChallengeMethod:_p.codeChallengeMethod,responseType:"code"});try{const le=new URL(D);le.searchParams.has("state")&&le.searchParams.set("state","***masked***"),await k(`AUTHORIZATION GET ${le.toString()}`)}catch{}const A={client_id:O.clientId,redirect_uri:O.redirectUri,response_type:"code",scope:Ep,state:E,code_challenge:z,code_challenge_method:_p.codeChallengeMethod,authorization_url:D},F=le=>{const oe=le.split(/([\$&])/);let G="",ce=0;const _e=["#0070CC","#2563eb","#7c3aed","#dc2626","#16a34a","#ca8a04"];for(let xe=0;xe<oe.length;xe++){const ve=oe[xe];ve==="$"||ve==="&"?(G+=`<span style="color: #ef4444; font-weight: bold;">${ve}</span>`,ce=(ce+1)%_e.length):G+=`<span style="color: ${_e[ce]};">${ve}</span>`}return G},N=document.createElement("div");N.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;const B=document.createElement("div");B.style.cssText=`
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        max-width: 650px;
        max-height: 70vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      `;let ee=!1,Y=D;return B.innerHTML=`
        <h2 style="margin-top: 0; margin-bottom: 0.75rem; color: #0070CC; font-size: 1.25rem;">🔍 Authorization Request Debug</h2>
        <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">Review the parameters being sent to PingOne:</p>
        <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 6px; font-family: 'Monaco', 'Menlo', monospace; font-size: 0.8rem; line-height: 1.3; margin-bottom: 1rem;">
          <div style="margin-bottom: 0.25rem;"><strong>Client ID:</strong> ${A.client_id}</div>
          <div style="margin-bottom: 0.25rem;"><strong>Redirect URI:</strong> ${A.redirect_uri}</div>
          <div style="margin-bottom: 0.25rem;"><strong>Response Type:</strong> ${A.response_type}</div>
          <div style="margin-bottom: 0.25rem;"><strong>Scope:</strong> ${A.scope}</div>
          <div style="margin-bottom: 0.25rem;"><strong>State:</strong> ${A.state}</div>
          <div style="margin-bottom: 0.25rem;"><strong>PKCE:</strong> S256, verifier <span style="color: ${C?"#166534":"#991b1b"}; font-weight: 700;">${C?"present":"missing"}</span></div>
          <div style="margin-bottom: 0.25rem;"><strong>Code Challenge:</strong> ${A.code_challenge.substring(0,20)}...</div>
          <div style="margin-bottom: 0;"><strong>Code Challenge Method:</strong> ${A.code_challenge_method}</div>
        </div>
        <div style="margin: 1rem 0; padding: 0.75rem; background: #e3f2fd; border-radius: 6px; font-size: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="font-size: 0.9rem;">Full Authorization URL:</strong>
            <div style="display: flex; gap: 0.5rem;">
              <button id="copy-url-btn" style="
                background: #0070CC;
                color: white;
                border: none;
                padding: 0.25rem 0.5rem;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.7rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.2rem;
              ">
                📋 Copy URL
              </button>
              <button id="edit-url-btn" style="
                background: #0070CC;
                color: white;
                border: none;
                padding: 0.25rem 0.5rem;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.7rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.2rem;
              ">
                ✏️ Edit URL
              </button>
            </div>
          </div>
          <div id="url-container" style="word-break: break-all; font-family: 'Monaco', 'Menlo', monospace; margin-top: 0.25rem; font-size: 0.75rem;">${F(A.authorization_url)}</div>
        </div>
        <div style="text-align: right; margin-top: 1rem;">
          <button id="debug-continue" style="
            background: #0070CC;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.85rem;
          ">Continue to PingOne</button>
          <button id="debug-cancel" style="
            background: #6c757d;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.85rem;
            margin-left: 0.5rem;
          ">Cancel</button>
        </div>
      `,N.appendChild(B),document.body.appendChild(N),new Promise((le,oe)=>{const G=B.querySelector("#debug-continue"),ce=B.querySelector("#debug-cancel"),_e=B.querySelector("#edit-url-btn"),xe=B.querySelector("#copy-url-btn"),ve=B.querySelector("#url-container"),K=()=>{if(ee=!ee,ee)_e.innerHTML="💾 Save URL",_e.style.background="#16a34a",xe.style.display="none",ve.innerHTML=`
              <textarea id="url-input" style="
                width: 100%;
                min-height: 80px;
                padding: 0.5rem;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 0.8rem;
                line-height: 1.4;
                resize: vertical;
              ">${Y}</textarea>
            `;else{const X=B.querySelector("#url-input");X&&(Y=X.value),_e.innerHTML="✏️ Edit URL",_e.style.background="#0070CC",xe.style.display="inline-flex",ve.innerHTML=F(Y)}};_e.onclick=()=>{K()},xe.onclick=async()=>{try{const X=ee?Y:D;await navigator.clipboard.writeText(X);const q=xe.innerHTML;xe.innerHTML="✅ Copied!",xe.style.background="#16a34a",setTimeout(()=>{xe.innerHTML=q,xe.style.background="#0070CC"},2e3)}catch(X){console.error("Failed to copy URL:",X);const q=ee?Y:D,_=document.createElement("textarea");_.value=q,document.body.appendChild(_),_.select(),document.execCommand("copy"),document.body.removeChild(_);const U=xe.innerHTML;xe.innerHTML="✅ Copied!",xe.style.background="#16a34a",setTimeout(()=>{xe.innerHTML=U,xe.style.background="#0070CC"},2e3)}},G.onclick=()=>{document.body.removeChild(N);const X=ee?Y:D;window.location.href=X,le({success:!0})},ce.onclick=()=>{document.body.removeChild(N),f(!1),oe(new Error("User cancelled login, please login when ready"))}})}catch(E){throw console.error("Login failed:",E),f(!1),E}},logout:()=>{try{Qe.clearTokens(),Qe.clearAll(),s(null),u(!1);const E=`${Mt.logoutEndpoint}?post_logout_redirect_uri=${encodeURIComponent(Mt.logoutRedirectUri)}`;window.location.href=E}catch(E){console.error("Logout failed:",E),s(null),u(!1),g("/login",{replace:!0,state:{message:"You have been logged out successfully.",type:"success"}})}},handleCallback:async E=>{console.log("🔍 [AuthContext] Handling OAuth callback..."),console.log("🔍 [AuthContext] Callback URL:",E);try{f(!0);const C=ym(E);console.log("🔍 [AuthContext] Parsed callback parameters:",C);const{code:z,state:O,error:D,error_description:A}=C;if(console.log("🔍 [AuthContext] Extracted parameters:",{hasCode:!!z,hasState:!!O,hasError:!!D,error_description:A}),D){console.error("❌ [AuthContext] OAuth error received:",D,A);let G="Login failed. Please check your credentials and try again.",ce="error";throw D==="access_denied"?(G="Login was cancelled or denied. Please try again when ready.",ce="warning"):D==="invalid_request"?G="Invalid login request. Please check your configuration.":D==="unauthorized_client"?G="Application is not authorized. Please check your PingOne configuration.":D==="unsupported_response_type"&&(G="Unsupported response type. Please contact support."),new Error(G)}if(!z)throw console.error("❌ [AuthContext] No authorization code received in callback"),new Error("No authorization code received. Please try logging in again.");const F=Qe.getState();if(console.log("🔍 [AuthContext] State verification:",{receivedState:O,storedState:F,stateMatch:F&&O===F}),!F||O!==F)throw console.error("❌ [AuthContext] State verification failed"),console.error("   Expected:",F),console.error("   Received:",O),new Error("Security verification failed. Please try logging in again.");console.log("🔍 [AuthContext] Getting runtime configuration...");const N=w();console.log("🔍 [AuthContext] Runtime config:",{environmentId:N.environmentId,hasClientId:!!N.clientId,hasClientSecret:!!N.clientSecret,tokenEndpoint:N.tokenEndpoint});const B=Qe.getCodeVerifier();if(console.log("🔍 [AuthContext] Code verifier:",{hasCodeVerifier:!!B,codeVerifierLength:B==null?void 0:B.length}),!B)throw console.error("❌ [AuthContext] Missing PKCE code_verifier in session"),new Error("Security verification failed. Please try logging in again.");await k(`TOKEN POST ${N.tokenEndpoint} grant_type=authorization_code redirect_uri=${encodeURIComponent(N.redirectUri)}`),console.log("🔍 [AuthContext] Exchanging code for tokens...");const ee=await vm({tokenEndpoint:N.tokenEndpoint,clientId:N.clientId,clientSecret:N.clientSecret,redirectUri:N.redirectUri,code:z,codeVerifier:B});console.log("✅ [AuthContext] Token exchange successful:",{hasAccessToken:!!ee.access_token,hasRefreshToken:!!ee.refresh_token,hasIdToken:!!ee.id_token,tokenType:ee.token_type,expiresIn:ee.expires_in});const Y=Date.now()+ee.expires_in*1e3;Qe.setTokens({access_token:ee.access_token,refresh_token:ee.refresh_token,id_token:ee.id_token,token_type:ee.token_type,expires_in:ee.expires_in,expires_at:Y}),console.log("✅ [AuthContext] Tokens stored successfully");let le;if(ee.id_token){console.log("🔍 [AuthContext] Validating ID token..."),await k(`ID_TOKEN validate iss=${N.apiUrl}/${N.environmentId} aud=${N.clientId}`);const G=await Uc(ee.id_token,N.clientId,`${N.apiUrl}/${N.environmentId}`);s({id:G.sub,email:G.email,name:G.name,given_name:G.given_name,family_name:G.family_name,picture:G.picture}),le=G.name||G.email||G.sub,console.log("✅ [AuthContext] User info set from ID token:",{userId:G.sub,hasEmail:!!G.email})}else{console.log("⚠️ [AuthContext] No ID token received, fetching user info from endpoint...");try{await k(`USERINFO GET ${N.userInfoEndpoint}`);const G=await ii(N.userInfoEndpoint,ee.access_token);s({id:G.sub,email:G.email||"",name:G.name||"",given_name:G.given_name||"",family_name:G.family_name||"",picture:G.picture||""}),le=G.name||G.email||G.sub,console.log("✅ [AuthContext] User info fetched from endpoint")}catch(G){console.warn("⚠️ [AuthContext] Could not fetch user info:",G),s({authenticated:!0})}}u(!0),console.log("✅ [AuthContext] Authentication successful, storing tokens for session persistence"),Qe.setTokens(ee),Qe.clearState(),Qe.clearNonce(),Qe.clearCodeVerifier(),console.log("🔄 [AuthContext] Navigating to dashboard...");const oe=`Success: You are logged into PingOne as ${le||"authenticated user"}.`;g("/dashboard",{replace:!0,state:{message:oe,type:"success"}})}catch(C){console.error("❌ [AuthContext] Callback handling failed:",C),Qe.clearTokens(),Qe.clearAll(),s(null),u(!1);let z="Login failed. Please check your credentials and try again.",O="error";if(C instanceof Error){const D=C.message;D.includes("cancelled")||D.includes("denied")?(z="User cancelled login, please login when ready",O="info"):D.includes("expired")||D.includes("invalid")?(z="Your login session has expired. Please try logging in again.",O="warning"):D.includes("configuration")||D.includes("authorized")?(z="Configuration issue detected. Please check your PingOne settings.",O="warning"):D.includes("Security verification failed")&&(z="Security check failed. Please clear your browser cache and try again.",O="warning")}throw g("/login",{replace:!0,state:{message:z,type:O}}),C}finally{f(!1)}}};return n.jsx(wm.Provider,{value:M,children:t})},gn=()=>{const t=S.useContext(wm);if(!t)throw new Error("useAuth must be used within an AuthProvider");return t},km=S.createContext(),Mv=({children:t})=>{const i=vt(),s=Jt(),c=()=>{try{const N=localStorage.getItem("pingone_config");return N?JSON.parse(N):null}catch(N){return console.error("Error loading OAuth config:",N),null}},[u,h]=S.useState(c()),[f,v]=S.useState(()=>{const N=localStorage.getItem("oauth_tokens");return N?JSON.parse(N):null}),[m,g]=S.useState(null),[k,w]=S.useState(null),[b,R]=S.useState(!1),[L,M]=S.useState(!1);S.useEffect(()=>{f?(localStorage.setItem("oauth_tokens",JSON.stringify(f)),M(!0)):(localStorage.removeItem("oauth_tokens"),M(!1))},[f]);const E=S.useCallback(()=>f!=null&&f.access_token?Os(f.access_token):!0,[f]),C=S.useCallback(()=>{if(!(f!=null&&f.refresh_token))return!0;if(!(f!=null&&f.expires_in))return!1;const N=Math.floor(Date.now()/1e3),ee=(f.issued_at||0)+f.expires_in;return N>ee},[f]),z=N=>{try{return localStorage.setItem("pingone_config",JSON.stringify(N)),h(N),!0}catch(B){return console.error("Error saving OAuth config:",B),!1}},O=S.useCallback(async(N="authorization_code",B={})=>{if(!u)return w("OAuth configuration is missing. Please configure your PingOne settings first."),!1;try{w(null),R(!0);const ee=Hs(),Y=Hs(),le=mm(),oe=await gm(le);localStorage.setItem("oauth_state",ee),localStorage.setItem("oauth_nonce",Y),localStorage.setItem("oauth_code_verifier",le),localStorage.setItem("oauth_flow_type",N);const G=xm({authEndpoint:u.authEndpoint.replace("{envId}",u.environmentId),clientId:u.clientId,redirectUri:u.redirectUri,scope:u.scopes,state:ee,nonce:Y,codeChallenge:oe,codeChallengeMethod:"S256",responseType:N==="implicit"?"id_token token":"code",...B});return window.location.href=G,!0}catch(ee){return console.error("Error starting OAuth flow:",ee),w(`Failed to start OAuth flow: ${ee.message}`),R(!1),!1}},[u]),D=S.useCallback(async N=>{if(!u)return w("OAuth configuration is missing. Please configure your PingOne settings first."),!1;try{w(null),R(!0);const B=ym(N),ee=localStorage.getItem("oauth_nonce"),Y=localStorage.getItem("oauth_code_verifier"),le=localStorage.getItem("oauth_flow_type")||"authorization_code";if(localStorage.removeItem("oauth_state"),localStorage.removeItem("oauth_nonce"),localStorage.removeItem("oauth_code_verifier"),localStorage.removeItem("oauth_flow_type"),B.error)throw new Error(B.error_description||`Authorization failed: ${B.error}`);if(le==="implicit"){if(!B.access_token)throw new Error("No access token found in the response");if(B.id_token)try{await Uc(B.id_token,u.clientId,`https://auth.pingone.com/${u.environmentId}`)}catch(_e){throw console.error("ID token validation failed:",_e),new Error("Invalid ID token")}const ce={access_token:B.access_token,id_token:B.id_token,token_type:B.token_type||"Bearer",expires_in:parseInt(B.expires_in)||3600,scope:B.scope,issued_at:Math.floor(Date.now()/1e3)};if(v(ce),B.scope&&B.scope.includes("openid"))try{const _e=await ii(u.userInfoEndpoint.replace("{envId}",u.environmentId),B.access_token);g(_e)}catch(_e){console.error("Failed to fetch user info:",_e)}return R(!1),!0}if(!B.code)throw new Error("No authorization code found in the response");const oe=localStorage.getItem("oauth_state");if(!B.state)throw console.warn("No state parameter found in callback URL"),new Error("No state parameter found in callback URL");if(!oe)console.warn("No saved state found in localStorage - this may happen with existing sessions"),console.log("Callback state:",B.state);else if(B.state!==oe)throw console.error("State parameter mismatch:",{received:B.state,saved:oe}),new Error("Invalid state parameter - possible CSRF attempt or session mismatch");const G=await vm({tokenEndpoint:u.tokenEndpoint.replace("{envId}",u.environmentId),clientId:u.clientId,clientSecret:u.clientSecret,redirectUri:u.redirectUri,code:B.code,codeVerifier:Y});if(G.id_token)try{const ce=await Uc(G.id_token,u.clientId,`https://auth.pingone.com/${u.environmentId}`);if(ce.nonce!==ee)throw new Error("Invalid nonce in ID token");G.id_token_claims=ce}catch(ce){throw console.error("ID token validation failed:",ce),new Error("Invalid ID token")}if(G.issued_at=Math.floor(Date.now()/1e3),v(G),G.scope&&G.scope.includes("openid"))try{const ce=await ii(u.userInfoEndpoint.replace("{envId}",u.environmentId),G.access_token);g(ce)}catch(ce){console.error("Failed to fetch user info:",ce)}return R(!1),!0}catch(B){return console.error("Error handling OAuth callback:",B),w(B.message||"Failed to complete OAuth flow"),R(!1),!1}},[u]),A=S.useCallback(()=>{v(null),g(null),localStorage.removeItem("oauth_tokens"),s("/")},[s]),F=S.useCallback(()=>f?E()?f.refresh_token&&!C()?(console.log("Access token expired, attempting to refresh..."),A(),!1):(A(),!1):!0:!1,[f,E,C,A]);return S.useEffect(()=>{if(f){const N=F();M(N)}else M(!1)},[f,F]),S.useEffect(()=>{i.pathname==="/callback"&&i.search&&D(window.location.href).then(N=>{N?s("/dashboard"):s("/login",{state:{error:"Authentication failed"}})})},[i,s,D]),n.jsx(km.Provider,{value:{config:u,tokens:f,userInfo:m,error:k,isLoading:b,isAuthenticated:L,saveConfig:z,startOAuthFlow:O,handleCallback:D,logout:A,checkAuthStatus:F},children:t})},Hr=()=>{const t=S.useContext(km);if(!t)throw new Error("useOAuth must be used within an OAuthProvider");return t},jm={colors:{primary:"#003087",primaryLight:"#334d99",primaryDark:"#001a4d",secondary:"#ff4d4d",success:"#28a745",danger:"#dc3545",warning:"#ffc107",info:"#17a2b8",light:"#f8f9fa",dark:"#343a40",gray100:"#f8f9fa",gray200:"#e9ecef",gray300:"#dee2e6",gray400:"#ced4da",gray500:"#adb5bd",gray600:"#6c757d",gray700:"#495057",gray800:"#343a40",gray900:"#212529"},fonts:{body:'"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',mono:'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'},shadows:{sm:"0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",md:"0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)",lg:"0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)"},breakpoints:{sm:"640px",md:"768px",lg:"1024px",xl:"1280px"}},Sm=Vx`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    height: 100%;
  }

  body {
    font-family: ${({theme:t})=>t.fonts.body};
    line-height: 1.5;
    color: ${({theme:t})=>t.colors.gray900};
    background-color: ${({theme:t})=>t.colors.gray100};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100%;
  }

  #root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: 0.5rem;
    font-weight: 600;
    line-height: 1.2;
    color: ${({theme:t})=>t.colors.gray900};
  }

  h1 { font-size: 2.5rem; }
  h2 { font-size: 2rem; }
  h3 { font-size: 1.75rem; }
  h4 { font-size: 1.5rem; }
  h5 { font-size: 1.25rem; }
  h6 { font-size: 1rem; }

  a {
    color: ${({theme:t})=>t.colors.primary};
    text-decoration: none;
    transition: color 0.2s ease-in-out;

    &:hover {
      color: ${({theme:t})=>t.colors.primaryLight};
      text-decoration: underline;
    }
  }

  button, input, select, textarea {
    font-family: inherit;
    font-size: 1rem;
  }

  code {
    font-family: ${({theme:t})=>t.fonts.mono};
    background-color: ${({theme:t})=>t.colors.gray200};
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }

  pre {
    background-color: ${({theme:t})=>t.colors.gray900};
    color: ${({theme:t})=>t.colors.gray100};
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-family: ${({theme:t})=>t.fonts.mono};
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 1rem 0;

    code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      font-size: inherit;
    }
  }
`;var bm={color:void 0,size:void 0,className:void 0,style:void 0,attr:void 0},Op=He.createContext&&He.createContext(bm),Fv=["attr","size","title"];function Wv(t,i){if(t==null)return{};var s=Bv(t,i),c,u;if(Object.getOwnPropertySymbols){var h=Object.getOwnPropertySymbols(t);for(u=0;u<h.length;u++)c=h[u],!(i.indexOf(c)>=0)&&Object.prototype.propertyIsEnumerable.call(t,c)&&(s[c]=t[c])}return s}function Bv(t,i){if(t==null)return{};var s={};for(var c in t)if(Object.prototype.hasOwnProperty.call(t,c)){if(i.indexOf(c)>=0)continue;s[c]=t[c]}return s}function Vs(){return Vs=Object.assign?Object.assign.bind():function(t){for(var i=1;i<arguments.length;i++){var s=arguments[i];for(var c in s)Object.prototype.hasOwnProperty.call(s,c)&&(t[c]=s[c])}return t},Vs.apply(this,arguments)}function Np(t,i){var s=Object.keys(t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(t);i&&(c=c.filter(function(u){return Object.getOwnPropertyDescriptor(t,u).enumerable})),s.push.apply(s,c)}return s}function Ks(t){for(var i=1;i<arguments.length;i++){var s=arguments[i]!=null?arguments[i]:{};i%2?Np(Object(s),!0).forEach(function(c){Jv(t,c,s[c])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(s)):Np(Object(s)).forEach(function(c){Object.defineProperty(t,c,Object.getOwnPropertyDescriptor(s,c))})}return t}function Jv(t,i,s){return i=Hv(i),i in t?Object.defineProperty(t,i,{value:s,enumerable:!0,configurable:!0,writable:!0}):t[i]=s,t}function Hv(t){var i=Vv(t,"string");return typeof i=="symbol"?i:i+""}function Vv(t,i){if(typeof t!="object"||!t)return t;var s=t[Symbol.toPrimitive];if(s!==void 0){var c=s.call(t,i);if(typeof c!="object")return c;throw new TypeError("@@toPrimitive must return a primitive value.")}return(i==="string"?String:Number)(t)}function Cm(t){return t&&t.map((i,s)=>He.createElement(i.tag,Ks({key:s},i.attr),Cm(i.child)))}function pe(t){return i=>He.createElement(Kv,Vs({attr:Ks({},t.attr)},i),Cm(t.child))}function Kv(t){var i=s=>{var{attr:c,size:u,title:h}=t,f=Wv(t,Fv),v=u||s.size||"1em",m;return s.className&&(m=s.className),t.className&&(m=(m?m+" ":"")+t.className),He.createElement("svg",Vs({stroke:"currentColor",fill:"currentColor",strokeWidth:"0"},s.attr,c,f,{className:m,style:Ks(Ks({color:t.color||s.color},s.style),t.style),height:v,width:v,xmlns:"http://www.w3.org/2000/svg"}),h&&He.createElement("title",null,h),t.children)};return Op!==void 0?He.createElement(Op.Consumer,null,s=>i(s)):i(bm)}function Ae(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"circle",attr:{cx:"12",cy:"12",r:"10"},child:[]},{tag:"line",attr:{x1:"12",y1:"8",x2:"12",y2:"12"},child:[]},{tag:"line",attr:{x1:"12",y1:"16",x2:"12.01",y2:"16"},child:[]}]})(t)}function Gv(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"},child:[]},{tag:"line",attr:{x1:"12",y1:"9",x2:"12",y2:"13"},child:[]},{tag:"line",attr:{x1:"12",y1:"17",x2:"12.01",y2:"17"},child:[]}]})(t)}function qv(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"line",attr:{x1:"5",y1:"12",x2:"19",y2:"12"},child:[]},{tag:"polyline",attr:{points:"12 5 19 12 12 19"},child:[]}]})(t)}function si(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"},child:[]},{tag:"path",attr:{d:"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"},child:[]}]})(t)}function ut(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"},child:[]},{tag:"polyline",attr:{points:"22 4 12 14.01 9 11.01"},child:[]}]})(t)}function sn(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"polyline",attr:{points:"20 6 9 17 4 12"},child:[]}]})(t)}function Dp(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"polyline",attr:{points:"6 9 12 15 18 9"},child:[]}]})(t)}function Lp(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"polyline",attr:{points:"9 18 15 12 9 6"},child:[]}]})(t)}function Im(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"circle",attr:{cx:"12",cy:"12",r:"10"},child:[]},{tag:"polyline",attr:{points:"12 6 12 12 16 14"},child:[]}]})(t)}function lo(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"polyline",attr:{points:"16 18 22 12 16 6"},child:[]},{tag:"polyline",attr:{points:"8 6 2 12 8 18"},child:[]}]})(t)}function an(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"rect",attr:{x:"9",y:"9",width:"13",height:"13",rx:"2",ry:"2"},child:[]},{tag:"path",attr:{d:"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"},child:[]}]})(t)}function _m(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"},child:[]},{tag:"path",attr:{d:"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"},child:[]}]})(t)}function fr(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"},child:[]},{tag:"polyline",attr:{points:"15 3 21 3 21 9"},child:[]},{tag:"line",attr:{x1:"10",y1:"14",x2:"21",y2:"3"},child:[]}]})(t)}function Yv(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"},child:[]},{tag:"line",attr:{x1:"1",y1:"1",x2:"23",y2:"23"},child:[]}]})(t)}function mn(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"},child:[]},{tag:"circle",attr:{cx:"12",cy:"12",r:"3"},child:[]}]})(t)}function Em(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"circle",attr:{cx:"12",cy:"12",r:"10"},child:[]},{tag:"path",attr:{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"},child:[]},{tag:"line",attr:{x1:"12",y1:"17",x2:"12.01",y2:"17"},child:[]}]})(t)}function Qv(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"},child:[]},{tag:"polyline",attr:{points:"9 22 9 12 15 12 15 22"},child:[]}]})(t)}function $m(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"circle",attr:{cx:"12",cy:"12",r:"10"},child:[]},{tag:"line",attr:{x1:"12",y1:"16",x2:"12",y2:"12"},child:[]},{tag:"line",attr:{x1:"12",y1:"8",x2:"12.01",y2:"8"},child:[]}]})(t)}function Jr(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"},child:[]}]})(t)}function Tm(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"line",attr:{x1:"12",y1:"2",x2:"12",y2:"6"},child:[]},{tag:"line",attr:{x1:"12",y1:"18",x2:"12",y2:"22"},child:[]},{tag:"line",attr:{x1:"4.93",y1:"4.93",x2:"7.76",y2:"7.76"},child:[]},{tag:"line",attr:{x1:"16.24",y1:"16.24",x2:"19.07",y2:"19.07"},child:[]},{tag:"line",attr:{x1:"2",y1:"12",x2:"6",y2:"12"},child:[]},{tag:"line",attr:{x1:"18",y1:"12",x2:"22",y2:"12"},child:[]},{tag:"line",attr:{x1:"4.93",y1:"19.07",x2:"7.76",y2:"16.24"},child:[]},{tag:"line",attr:{x1:"16.24",y1:"7.76",x2:"19.07",y2:"4.93"},child:[]}]})(t)}function il(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"rect",attr:{x:"3",y:"11",width:"18",height:"11",rx:"2",ry:"2"},child:[]},{tag:"path",attr:{d:"M7 11V7a5 5 0 0 1 10 0v4"},child:[]}]})(t)}function zm(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"},child:[]},{tag:"polyline",attr:{points:"10 17 15 12 10 7"},child:[]},{tag:"line",attr:{x1:"15",y1:"12",x2:"3",y2:"12"},child:[]}]})(t)}function Xv(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"},child:[]},{tag:"polyline",attr:{points:"16 17 21 12 16 7"},child:[]},{tag:"line",attr:{x1:"21",y1:"12",x2:"9",y2:"12"},child:[]}]})(t)}function Zv(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"line",attr:{x1:"3",y1:"12",x2:"21",y2:"12"},child:[]},{tag:"line",attr:{x1:"3",y1:"6",x2:"21",y2:"6"},child:[]},{tag:"line",attr:{x1:"3",y1:"18",x2:"21",y2:"18"},child:[]}]})(t)}function Up(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"line",attr:{x1:"5",y1:"12",x2:"19",y2:"12"},child:[]}]})(t)}function e1(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"rect",attr:{x:"2",y:"3",width:"20",height:"14",rx:"2",ry:"2"},child:[]},{tag:"line",attr:{x1:"8",y1:"21",x2:"16",y2:"21"},child:[]},{tag:"line",attr:{x1:"12",y1:"17",x2:"12",y2:"21"},child:[]}]})(t)}function mr(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"polygon",attr:{points:"5 3 19 12 5 21 5 3"},child:[]}]})(t)}function Mc(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"line",attr:{x1:"12",y1:"5",x2:"12",y2:"19"},child:[]},{tag:"line",attr:{x1:"5",y1:"12",x2:"19",y2:"12"},child:[]}]})(t)}function t1(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"polyline",attr:{points:"23 4 23 10 17 10"},child:[]},{tag:"polyline",attr:{points:"1 20 1 14 7 14"},child:[]},{tag:"path",attr:{d:"M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"},child:[]}]})(t)}function r1(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"polyline",attr:{points:"1 4 1 10 7 10"},child:[]},{tag:"path",attr:{d:"M3.51 15a9 9 0 1 0 2.13-9.36L1 10"},child:[]}]})(t)}function Fc(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"},child:[]},{tag:"polyline",attr:{points:"17 21 17 13 7 13 7 21"},child:[]},{tag:"polyline",attr:{points:"7 3 7 8 15 8"},child:[]}]})(t)}function n1(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"rect",attr:{x:"2",y:"2",width:"20",height:"8",rx:"2",ry:"2"},child:[]},{tag:"rect",attr:{x:"2",y:"14",width:"20",height:"8",rx:"2",ry:"2"},child:[]},{tag:"line",attr:{x1:"6",y1:"6",x2:"6.01",y2:"6"},child:[]},{tag:"line",attr:{x1:"6",y1:"18",x2:"6.01",y2:"18"},child:[]}]})(t)}function nd(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"circle",attr:{cx:"12",cy:"12",r:"3"},child:[]},{tag:"path",attr:{d:"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"},child:[]}]})(t)}function Zt(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"},child:[]}]})(t)}function o1(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"rect",attr:{x:"5",y:"2",width:"14",height:"20",rx:"2",ry:"2"},child:[]},{tag:"line",attr:{x1:"12",y1:"18",x2:"12.01",y2:"18"},child:[]}]})(t)}function i1(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"polygon",attr:{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"},child:[]}]})(t)}function fc(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"polyline",attr:{points:"3 6 5 6 21 6"},child:[]},{tag:"path",attr:{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"},child:[]},{tag:"line",attr:{x1:"10",y1:"11",x2:"10",y2:"17"},child:[]},{tag:"line",attr:{x1:"14",y1:"11",x2:"14",y2:"17"},child:[]}]})(t)}function li(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"},child:[]},{tag:"circle",attr:{cx:"12",cy:"7",r:"4"},child:[]}]})(t)}function Pm(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"path",attr:{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"},child:[]},{tag:"circle",attr:{cx:"9",cy:"7",r:"4"},child:[]},{tag:"path",attr:{d:"M23 21v-2a4 4 0 0 0-3-3.87"},child:[]},{tag:"path",attr:{d:"M16 3.13a4 4 0 0 1 0 7.75"},child:[]}]})(t)}function s1(t){return pe({attr:{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"},child:[{tag:"line",attr:{x1:"18",y1:"6",x2:"6",y2:"18"},child:[]},{tag:"line",attr:{x1:"6",y1:"6",x2:"18",y2:"18"},child:[]}]})(t)}const l1=x.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: ${({theme:t})=>t.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`,a1=x.div`
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  
  img {
    height: 32px;
    margin-right: 0.75rem;
  }
`,c1=x.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  
  button, a {
    background: none;
    border: none;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    margin-left: 0.5rem;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    span {
      margin-left: 0.5rem;
      font-size: 0.875rem;
      display: none;
      
      @media (min-width: ${({theme:t})=>t.breakpoints.md}) {
        display: inline;
      }
    }
  }
`,d1=x.button`
  margin-right: 1rem;
  
  @media (min-width: ${({theme:t})=>t.breakpoints.lg}) {
    display: none;
  }
`,u1=({toggleSidebar:t})=>{const{isAuthenticated:i,logout:s}=gn(),c=Jt(),u=()=>{s(),c("/login")};return n.jsxs(l1,{children:[n.jsx(d1,{onClick:t,children:n.jsx(Zv,{size:24})}),n.jsx(a1,{children:n.jsx("span",{children:"PingOne OAuth Playground"})}),n.jsxs(c1,{children:[n.jsxs(dn,{to:"/documentation",title:"Documentation",children:[n.jsx(Em,{}),n.jsx("span",{children:"Docs"})]}),n.jsxs(dn,{to:"/configuration",title:"Settings",children:[n.jsx(nd,{}),n.jsx("span",{children:"Settings"})]}),i?n.jsxs("button",{onClick:u,title:"Logout",children:[n.jsx(Xv,{}),n.jsx("span",{children:"Logout"})]}):n.jsxs(dn,{to:"/login",title:"Login",children:[n.jsx(zm,{}),n.jsx("span",{children:"Login"})]})]})]})},f1=x.aside`
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  width: 250px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 900;
  transition: transform 0.3s ease;
  overflow-y: auto;
  padding: 1rem 0;
  
  @media (max-width: ${({theme:t})=>{var i;return((i=t.breakpoints)==null?void 0:i.lg)||"1024px"}}) {
    transform: ${({$isOpen:t})=>t?"translateX(0)":"translateX(-100%)"};
  }
`,pc=x.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`,Mp=x.h3`
  font-size: 0.75rem;
  text-transform: uppercase;
  color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.gray600)||"#6b7280"}};
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 0 1.5rem;
  margin: 1.5rem 0 0.5rem;
`,ks=x(Ih)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.gray700)||"#374151"}};
  text-decoration: none;
  transition: all 0.2s;
  font-weight: 500;
  
  &:hover {
    background-color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.gray100)||"#f3f4f6"}};
    color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.primary)||"#0070cc"}};
  }
  
  &.active {
    background-color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.primaryLight)||"#e0f2fe"}}20;
    color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.primary)||"#0070cc"}};
    border-right: 3px solid ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.primary)||"#0070cc"}};
  }
  
  svg {
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }
`,Fp=x.div`
  overflow: hidden;
  max-height: ${({$isOpen:t})=>t?"500px":"0"};
  transition: max-height 0.3s ease-in-out;
`,ln=x(Ih)`
  display: flex;
  align-items: center;
  padding: 0.5rem 1.5rem 0.5rem 3.5rem;
  color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.gray700)||"#374151"}};
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.gray50)||"#f9fafb"}};
    color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.primary)||"#0070cc"}};
  }
  
  &.active {
    background-color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.primaryLight)||"#e0f2fe"}}10;
    color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.primary)||"#0070cc"}};
    font-weight: 500;
  }
  
  &:before {
    content: '•';
    margin-right: 0.75rem;
    font-size: 1.5rem;
    line-height: 0;
    color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.gray400)||"#9ca3af"}};
  }
  
  &.active:before {
    color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.primary)||"#0070cc"}};
  }
`,Wp=x.div`
  cursor: pointer;
  user-select: none;
`,Bp=x.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.gray700)||"#374151"}};
  font-weight: 500;
  
  &:hover {
    background-color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.gray100)||"#f3f4f6"}};
    color: ${({theme:t})=>{var i;return((i=t.colors)==null?void 0:i.primary)||"#0070cc"}};
  }
  
  svg:first-child {
    margin-right: 0.75rem;
  }
  
  svg:last-child {
    transition: transform 0.2s;
    transform: rotate(${({$isOpen:t})=>t?"0deg":"-90deg"});
  }
`,p1=({isOpen:t,onClose:i})=>{const s=vt(),[c,u]=S.useState({flows:!1,oidc:!1});S.useEffect(()=>{const f=s.pathname;u({flows:f.startsWith("/flows"),oidc:f.startsWith("/oidc")})},[s.pathname]);const h=f=>{u(v=>({...v,[f]:!v[f]}))};return n.jsxs(f1,{$isOpen:t,children:[n.jsx(pc,{children:n.jsxs(ks,{to:"/dashboard",onClick:i,children:[n.jsx(Qv,{}),n.jsx("span",{children:"Dashboard"})]})}),n.jsxs(pc,{children:[n.jsx(Mp,{children:"OAuth 2.0 Flows"}),n.jsxs(Wp,{children:[n.jsxs(Bp,{onClick:()=>h("flows"),$isOpen:c.flows,children:[n.jsxs("div",{children:[n.jsx(lo,{}),n.jsx("span",{children:"OAuth 2.0 Flows"})]}),n.jsx(Dp,{})]}),n.jsxs(Fp,{$isOpen:c.flows,children:[n.jsx(ln,{to:"/flows/authorization-code",onClick:i,children:"Authorization Code"}),n.jsx(ln,{to:"/flows/implicit",onClick:i,children:"Implicit"}),n.jsx(ln,{to:"/flows/client-credentials",onClick:i,children:"Client Credentials"}),n.jsx(ln,{to:"/flows/pkce",onClick:i,children:"PKCE"}),n.jsx(ln,{to:"/flows/device-code",onClick:i,children:"Device Code"})]})]}),n.jsxs(Wp,{children:[n.jsxs(Bp,{onClick:()=>h("oidc"),$isOpen:c.oidc,children:[n.jsxs("div",{children:[n.jsx(li,{}),n.jsx("span",{children:"OpenID Connect"})]}),n.jsx(Dp,{})]}),n.jsxs(Fp,{$isOpen:c.oidc,children:[n.jsx(ln,{to:"/oidc/userinfo",onClick:i,children:"UserInfo Endpoint"}),n.jsx(ln,{to:"/oidc/tokens",onClick:i,children:"ID Tokens"})]})]})]}),n.jsxs(pc,{children:[n.jsx(Mp,{children:"Resources"}),n.jsxs(ks,{to:"/token-management",onClick:i,children:[n.jsx(mn,{}),n.jsx("span",{children:"Token Management"})]}),n.jsxs(ks,{to:"/documentation",onClick:i,children:[n.jsx(si,{}),n.jsx("span",{children:"Documentation"})]}),n.jsxs(ks,{to:"/configuration",onClick:i,children:[n.jsx(nd,{}),n.jsx("span",{children:"Configuration"})]})]})]})},h1=x.div`
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
`,m1=x.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid #e5e7eb;
`,g1=x.div`
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
`,y1=x.div`
  padding: 1.5rem 2rem;
`,js=x.div`
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
`,x1=x.div`
  padding: 1rem 2rem 2rem;
  border-top: 1px solid #e5e7eb;
  text-align: right;
`,v1=x.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: #3b82f6;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`,w1=x.div`
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid transparent;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    margin-top: 0.1rem;
    flex-shrink: 0;
  }

  div {
    flex: 1;
  }

  h4 {
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    font-size: 0.9rem;
  }

  p {
    margin: 0;
    font-size: 0.85rem;
  }

  ${({$variant:t})=>{switch(t){case"success":return`
          background-color: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;

          svg {
            color: #22c55e;
          }
        `;case"danger":return`
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;

          svg {
            color: #ef4444;
          }
        `;case"info":default:return`
          background-color: #eff6ff;
          border-color: #bfdbfe;
          color: #1e40af;

          svg {
            color: #3b82f6;
          }
        `}}}
`,k1=({isOpen:t,onComplete:i})=>{const[s,c]=S.useState({environmentId:"",clientId:"",clientSecret:"",redirectUri:window.location.origin+"/callback"}),[u,h]=S.useState({}),[f,v]=S.useState(!1),[m,g]=S.useState(null),[k,w]=S.useState(null);S.useEffect(()=>{if(t){console.log("🔍 [CredentialSetupModal] Loading existing credentials from localStorage...");try{const E=localStorage.getItem("pingone_config"),C=localStorage.getItem("login_credentials");console.log("🔍 [CredentialSetupModal] localStorage contents:"),console.log("   pingone_config:",E?"present":"missing"),console.log("   login_credentials:",C?"present":"missing");const z={pingone_config:E?JSON.parse(E):null,login_credentials:C?JSON.parse(C):null};w(z),z.login_credentials?(console.log("✅ [CredentialSetupModal] Pre-populating form with login_credentials"),c(O=>({...O,environmentId:z.login_credentials.environmentId||"",clientId:z.login_credentials.clientId||"",clientSecret:z.login_credentials.clientSecret||""}))):z.pingone_config?(console.log("✅ [CredentialSetupModal] Pre-populating form with pingone_config"),c(O=>({...O,environmentId:z.pingone_config.environmentId||"",clientId:z.pingone_config.clientId||"",clientSecret:z.pingone_config.clientSecret||"",redirectUri:z.pingone_config.redirectUri||O.redirectUri}))):console.log("⚠️ [CredentialSetupModal] No existing credentials found"),console.log("✅ [CredentialSetupModal] Form pre-populated with:",{environmentId:s.environmentId,hasClientId:!!s.clientId,hasClientSecret:!!s.clientSecret})}catch(E){console.error("❌ [CredentialSetupModal] Error loading existing credentials:",E)}}},[t]);const b=E=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(E),R=E=>{const{name:C,value:z}=E.target;c(O=>({...O,[C]:z})),u[C]&&h(O=>({...O,[C]:""}))},L=()=>{const E={};return s.environmentId?b(s.environmentId)||(E.environmentId="Environment ID must be a valid UUID format"):E.environmentId="Environment ID is required",s.clientId||(E.clientId="Client ID is required"),s.redirectUri?/^https?:\/\//.test(s.redirectUri)||(E.redirectUri="Redirect URI must start with http:// or https://"):E.redirectUri="Redirect URI is required",h(E),Object.keys(E).length===0},M=async E=>{if(E.preventDefault(),!!L()){v(!0),g(null);try{const C={environmentId:s.environmentId,clientId:s.clientId,clientSecret:s.clientSecret,redirectUri:s.redirectUri,scopes:"openid profile email",authEndpoint:`https://auth.pingone.com/${s.environmentId}/as/authorize`,tokenEndpoint:`https://auth.pingone.com/${s.environmentId}/as/token`,userInfoEndpoint:`https://auth.pingone.com/${s.environmentId}/as/userinfo`};localStorage.setItem("pingone_config",JSON.stringify(C));const z={environmentId:s.environmentId,clientId:s.clientId,clientSecret:s.clientSecret};localStorage.setItem("login_credentials",JSON.stringify(z)),g({type:"success",title:"Configuration saved!",message:"Your PingOne credentials have been configured successfully."}),setTimeout(()=>{i()},2e3)}catch(C){console.error("Failed to save configuration:",C),g({type:"danger",title:"Configuration failed",message:"Failed to save your configuration. Please try again."})}finally{v(!1)}}};return t?n.jsx(h1,{children:n.jsxs(m1,{children:[n.jsxs(g1,{children:[n.jsxs("h2",{children:[n.jsx(il,{}),"Setup PingOne Credentials"]}),n.jsx("p",{children:"Configure your PingOne environment to get started with the OAuth Playground"})]}),n.jsxs(y1,{children:[m&&n.jsxs(w1,{$variant:m.type,children:[m.type==="success"?n.jsx(ut,{size:20}):n.jsx(Ae,{size:20}),n.jsxs("div",{children:[n.jsx("h4",{children:m.title}),n.jsx("p",{children:m.message})]})]}),n.jsxs("div",{style:{marginBottom:"2rem",padding:"1rem",backgroundColor:"#f8f9fa",borderRadius:"6px",border:"1px solid #dee2e6"},children:[n.jsx("h4",{style:{marginTop:0,marginBottom:"0.5rem",fontSize:"0.9rem",color:"#495057"},children:"📦 Current Stored Credentials"}),n.jsxs("div",{style:{fontSize:"0.85rem",color:"#6c757d"},children:[n.jsxs("div",{style:{marginBottom:"0.25rem"},children:[n.jsx("strong",{children:"pingone_config:"})," ",k!=null&&k.pingone_config?n.jsx("span",{style:{color:"#28a745"},children:"✅ Present"}):n.jsx("span",{style:{color:"#dc3545"},children:"❌ Missing"})]}),n.jsxs("div",{style:{marginBottom:"0.25rem"},children:[n.jsx("strong",{children:"login_credentials:"})," ",k!=null&&k.login_credentials?n.jsx("span",{style:{color:"#28a745"},children:"✅ Present"}):n.jsx("span",{style:{color:"#dc3545"},children:"❌ Missing"})]}),(k==null?void 0:k.login_credentials)&&n.jsxs("div",{style:{marginTop:"0.5rem",padding:"0.5rem",backgroundColor:"white",borderRadius:"4px",border:"1px solid #dee2e6"},children:[n.jsxs("div",{children:[n.jsx("strong",{children:"Environment ID:"})," ",k.login_credentials.environmentId||"Not set"]}),n.jsxs("div",{children:[n.jsx("strong",{children:"Client ID:"})," ",k.login_credentials.clientId?`${k.login_credentials.clientId.substring(0,12)}...`:"Not set"]}),n.jsxs("div",{children:[n.jsx("strong",{children:"Client Secret:"})," ",k.login_credentials.clientSecret?"••••••••":"Not set"]})]})]})]}),n.jsxs("form",{onSubmit:M,children:[n.jsxs(js,{children:[n.jsx("label",{htmlFor:"environmentId",children:"Environment ID *"}),n.jsx("input",{type:"text",id:"environmentId",name:"environmentId",value:s.environmentId,onChange:R,placeholder:"e.g., abc12345-6789-4abc-def0-1234567890ab",className:u.environmentId?"is-invalid":"",disabled:f}),u.environmentId&&n.jsx("div",{className:"invalid-feedback",children:u.environmentId}),n.jsx("div",{className:"form-text",children:"Your PingOne Environment ID from the Admin Console"})]}),n.jsxs(js,{children:[n.jsx("label",{htmlFor:"clientId",children:"Client ID *"}),n.jsx("input",{type:"text",id:"clientId",name:"clientId",value:s.clientId,onChange:R,placeholder:"Enter your application's Client ID",className:u.clientId?"is-invalid":"",disabled:f}),u.clientId&&n.jsx("div",{className:"invalid-feedback",children:u.clientId}),n.jsx("div",{className:"form-text",children:"The Client ID of your PingOne application"})]}),n.jsxs(js,{children:[n.jsx("label",{htmlFor:"clientSecret",children:"Client Secret"}),n.jsx("input",{type:"password",id:"clientSecret",name:"clientSecret",value:s.clientSecret,onChange:R,placeholder:"Enter your application's Client Secret (optional)",disabled:f}),n.jsx("div",{className:"form-text",children:"Only required for confidential clients"})]}),n.jsxs(js,{children:[n.jsx("label",{htmlFor:"redirectUri",children:"Redirect URI *"}),n.jsx("input",{type:"url",id:"redirectUri",name:"redirectUri",value:s.redirectUri,onChange:R,className:u.redirectUri?"is-invalid":"",disabled:f}),u.redirectUri&&n.jsx("div",{className:"invalid-feedback",children:u.redirectUri}),n.jsx("div",{className:"form-text",children:"Must match the redirect URI configured in your PingOne application"})]})]})]}),n.jsx(x1,{children:n.jsx(v1,{onClick:M,disabled:f,children:f?"Saving...":"Save Configuration"})})]})}):null},j1=x.div`
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  
  ${({$accent:t})=>{const i=t;if(!i)return"";const s={primary:"#003087",success:"#28a745",danger:"#dc3545",warning:"#ffc107",info:"#17a2b8"};return nl`
      border-top: 3px solid ${s[i]||s.primary};
    `}}
`,$e=x.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({theme:t})=>t.colors.gray200};
  
  h2, h3, h4, h5, h6 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .subtitle {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
`,be=x.div`
  padding: 1.5rem;
  
  & > :last-child {
    margin-bottom: 0;
  }
`;x.div`
  padding: 1rem 1.5rem;
  background-color: ${({theme:t})=>t.colors.gray100};
  border-top: 1px solid ${({theme:t})=>t.colors.gray200};
  
  & > :last-child {
    margin-bottom: 0;
  }
`;const Re=({children:t,className:i,accent:s})=>n.jsx(j1,{className:i,...s!==void 0?{$accent:s}:{},children:t}),S1=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,b1=x.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
  }
`,C1=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`,I1=x(Re)`
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  svg {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: ${({theme:t})=>t.colors.primary};
  }
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }
  
  p {
    color: ${({theme:t})=>t.colors.gray600};
    margin-bottom: 1.5rem;
    flex-grow: 1;
  }
`,_1=()=>{var v,m;const{isAuthenticated:t}=gn(),{config:i}=Hr(),s=vt(),c=(v=s.state)==null?void 0:v.message,u=((m=s.state)==null?void 0:m.type)||"info",h=i&&i.environmentId&&i.clientId,f=[{icon:n.jsx(lo,{}),title:"OAuth 2.0 Flows",description:"Explore different OAuth 2.0 authorization flows including Authorization Code, Implicit, Client Credentials, and more.",link:"/flows"},{icon:n.jsx(li,{}),title:"OpenID Connect",description:"Learn about OpenID Connect and how it extends OAuth 2.0 with authentication and identity features.",link:"/oidc"},{icon:n.jsx(il,{}),title:"Configuration",description:"Configure your PingOne environment and security settings for testing OAuth flows.",link:"/configuration"}];return n.jsxs(S1,{children:[n.jsxs(b1,{children:[n.jsx("h1",{children:"PingOne OAuth 2.0 & OIDC Playground"}),n.jsx("p",{children:"Learn, test, and master OAuth 2.0 and OpenID Connect with interactive examples"})]}),c&&n.jsxs("div",{style:{padding:"1rem",marginBottom:"1.5rem",borderRadius:"0.375rem",backgroundColor:u==="success"?"#f0fdf4":u==="error"?"#fef2f2":u==="warning"?"#fffbeb":"#eff6ff",border:`1px solid ${u==="success"?"#bbf7d0":u==="error"?"#fecaca":u==="warning"?"#fde68a":"#bfdbfe"}`,color:u==="success"?"#166534":u==="error"?"#991b1b":u==="warning"?"#92400e":"#1e40af"},children:[n.jsx("strong",{style:{display:"block",marginBottom:"0.25rem"},children:u==="success"?"Success":u==="error"?"Error":u==="warning"?"Warning":"Information"}),n.jsx("div",{children:c})]}),t&&h&&n.jsx(Re,{accent:"success",className:"mb-6",children:n.jsx(be,{children:n.jsxs("div",{className:"flex items-start",children:[n.jsx(ut,{className:"text-green-500 text-xl mt-0.5 mr-3 flex-shrink-0"}),n.jsxs("div",{children:[n.jsx("h3",{className:"font-medium text-gray-900",children:"Configuration Loaded"}),n.jsx("p",{className:"mt-1 text-sm text-gray-600",children:"Your PingOne environment is configured and ready. You can now explore OAuth 2.0 flows and OpenID Connect features."})]})]})})}),n.jsx("div",{style:{paddingBottom:"1rem"}}),n.jsx("h2",{className:"text-xl font-semibold mb-4",children:"Available Features"}),n.jsx("div",{style:{paddingBottom:"1rem"}}),n.jsx(C1,{children:f.map((g,k)=>n.jsx(I1,{children:n.jsxs(be,{className:"flex flex-col h-full",children:[g.icon,n.jsx("h3",{children:g.title}),n.jsx("p",{children:g.description}),n.jsxs(dn,{to:g.link,className:"mt-auto inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark",children:["Learn more",n.jsx("svg",{className:"ml-1 w-4 h-4",fill:"currentColor",viewBox:"0 0 20 20",children:n.jsx("path",{fillRule:"evenodd",d:"M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z",clipRule:"evenodd"})})]})]})},k))}),n.jsxs("div",{className:"mt-8",children:[n.jsx("h2",{className:"text-xl font-semibold mb-4",children:"Getting Started"}),n.jsx("div",{className:"bg-white rounded-lg shadow overflow-hidden",children:n.jsx("div",{className:"p-6",children:n.jsxs("ol",{className:"list-decimal pl-5 space-y-3",children:[n.jsx("li",{children:"Configure your PingOne environment in the Settings page"}),n.jsx("li",{children:"Select an OAuth 2.0 flow from the navigation menu"}),n.jsx("li",{children:"Follow the interactive guide to understand each step of the flow"}),n.jsx("li",{children:"Inspect the requests and responses in real-time"}),n.jsx("li",{children:"Review the documentation for detailed explanations"})]})})})]})]})},E1=()=>n.jsx("div",{children:n.jsx(bh,{})}),$1=x.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
`,T1=x.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
  }
`,Dr=x.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: ${({theme:t})=>t.colors.gray700};
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid ${({theme:t})=>t.colors.gray300};
    border-radius: 0.375rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    
    &:focus {
      outline: none;
      border-color: ${({theme:t})=>t.colors.primary};
      box-shadow: 0 0 0 3px ${({theme:t})=>`${t.colors.primary}40`};
    }
    
    &::placeholder {
      color: ${({theme:t})=>t.colors.gray400};
    }
  }
  
  textarea {
    min-height: 120px;
    resize: vertical;
  }
  
  .form-text {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: ${({theme:t})=>t.colors.gray600};
  }
  
  .invalid-feedback {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: ${({theme:t})=>t.colors.danger};
  }
`,z1=x.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: ${({theme:t})=>t.colors.primary};
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    background-color: ${({theme:t})=>t.colors.primaryDark};
  }
  
  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`,P1=x.div`
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  display: flex;
  align-items: flex-start;
  
  svg {
    margin-right: 0.75rem;
    margin-top: 0.2rem;
    flex-shrink: 0;
  }
  
  div {
    flex: 1;
  }
  
  h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 0.9375rem;
  }
  
  ${({$variant:t})=>{switch(t){case"success":return`
          background-color: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
          
          svg {
            color: #22c55e;
          }
        `;case"danger":return`
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
          
          svg {
            color: #ef4444;
          }
        `;case"info":default:return`
          background-color: #eff6ff;
          border-color: #bfdbfe;
          color: #1e40af;
          
          svg {
            color: #3b82f6;
          }
        `}}}
`,A1=()=>{const[t,i]=S.useState({environmentId:"",clientId:"",clientSecret:"",redirectUri:window.location.origin+"/callback",scopes:"openid profile email",authEndpoint:"https://auth.pingone.com/{envId}/as/authorize",tokenEndpoint:"https://auth.pingone.com/{envId}/as/token",userInfoEndpoint:"https://auth.pingone.com/{envId}/as/userinfo"}),[s,c]=S.useState({}),[u,h]=S.useState(!1),[f,v]=S.useState(null);S.useEffect(()=>{const w=localStorage.getItem("pingone_config");if(w)try{const b=JSON.parse(w);i(R=>({...R,...b}))}catch(b){console.error("Failed to load saved configuration:",b)}},[]);const m=w=>{const{name:b,value:R}=w.target;i(L=>({...L,[b]:R})),s[b]&&c(L=>({...L,[b]:null}))},g=()=>{const w={};let b=!0;return t.environmentId||(w.environmentId="Environment ID is required",b=!1),t.clientId||(w.clientId="Client ID is required",b=!1),t.redirectUri?/^https?:\/\//.test(t.redirectUri)||(w.redirectUri="Redirect URI must start with http:// or https://",b=!1):(w.redirectUri="Redirect URI is required",b=!1),c(w),b},k=async w=>{if(w.preventDefault(),!!g()){h(!0),v(null);try{const b={...t,authEndpoint:t.authEndpoint.replace("{envId}",t.environmentId),tokenEndpoint:t.tokenEndpoint.replace("{envId}",t.environmentId),userInfoEndpoint:t.userInfoEndpoint.replace("{envId}",t.environmentId)},R=await fetch("/api/configuration",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});if(R.ok){const L=await R.json();if(L.success)localStorage.setItem("pingone_config",JSON.stringify(b)),v({type:"success",title:"Configuration saved",message:"Your PingOne configuration has been saved to the server successfully."});else throw new Error(L.message||"Failed to save configuration")}else throw new Error(`HTTP ${R.status}: ${R.statusText}`)}catch(b){console.error("Failed to save configuration:",b);try{const R={...t,authEndpoint:t.authEndpoint.replace("{envId}",t.environmentId),tokenEndpoint:t.tokenEndpoint.replace("{envId}",t.environmentId),userInfoEndpoint:t.userInfoEndpoint.replace("{envId}",t.environmentId)};localStorage.setItem("pingone_config",JSON.stringify(R)),v({type:"warning",title:"Configuration saved locally",message:"Configuration saved to localStorage. Server save failed, but you can continue using the app."})}catch{v({type:"danger",title:"Error",message:"Failed to save configuration to both server and localStorage. Please try again."})}}finally{h(!1),(f==null?void 0:f.type)==="success"&&setTimeout(()=>{v(null)},5e3)}}};return n.jsxs($1,{children:[n.jsxs(T1,{children:[n.jsx("h1",{children:"PingOne Configuration"}),n.jsx("p",{children:"Configure your PingOne environment and application settings to get started with the OAuth Playground."})]}),f&&n.jsxs(P1,{$variant:f.type,children:[f.type==="success"?n.jsx(ut,{size:20}):n.jsx(Ae,{size:20}),n.jsxs("div",{children:[n.jsx("h4",{children:f.title}),n.jsx("p",{children:f.message})]})]}),n.jsxs(Re,{children:[n.jsxs($e,{children:[n.jsx("h2",{children:"Environment Settings"}),n.jsx("p",{className:"subtitle",children:"Configure your PingOne environment and application details"})]}),n.jsx(be,{children:n.jsxs("form",{onSubmit:k,children:[n.jsxs(Dr,{children:[n.jsx("label",{htmlFor:"environmentId",children:"Environment ID"}),n.jsx("input",{type:"text",id:"environmentId",name:"environmentId",value:t.environmentId,onChange:m,placeholder:"e.g., abc12345-6789-4abc-def0-1234567890ab",className:s.environmentId?"is-invalid":""}),s.environmentId&&n.jsx("div",{className:"invalid-feedback",children:s.environmentId}),n.jsx("div",{className:"form-text",children:"Your PingOne Environment ID. You can find this in the PingOne Admin Console."})]}),n.jsxs(Dr,{children:[n.jsx("label",{htmlFor:"clientId",children:"Client ID"}),n.jsx("input",{type:"text",id:"clientId",name:"clientId",value:t.clientId,onChange:m,placeholder:"Enter your application's Client ID",className:s.clientId?"is-invalid":""}),s.clientId&&n.jsx("div",{className:"invalid-feedback",children:s.clientId}),n.jsx("div",{className:"form-text",children:"The Client ID of your application in PingOne."})]}),n.jsxs(Dr,{children:[n.jsx("label",{htmlFor:"clientSecret",children:"Client Secret (Optional)"}),n.jsx("input",{type:"password",id:"clientSecret",name:"clientSecret",value:t.clientSecret,onChange:m,placeholder:"Enter your application's Client Secret"}),n.jsx("div",{className:"form-text",children:"Only required for confidential clients using flows that require client authentication."})]}),n.jsxs(Dr,{children:[n.jsx("label",{htmlFor:"redirectUri",children:"Redirect URI"}),n.jsx("input",{type:"url",id:"redirectUri",name:"redirectUri",value:t.redirectUri,onChange:m,className:s.redirectUri?"is-invalid":""}),s.redirectUri&&n.jsx("div",{className:"invalid-feedback",children:s.redirectUri}),n.jsx("div",{className:"form-text",children:"The redirect URI registered in your PingOne application. Must match exactly."})]}),n.jsxs(Dr,{children:[n.jsx("label",{htmlFor:"scopes",children:"Scopes"}),n.jsx("input",{type:"text",id:"scopes",name:"scopes",value:t.scopes,onChange:m,placeholder:"openid profile email"}),n.jsx("div",{className:"form-text",children:"Space-separated list of scopes to request. Common scopes: openid, profile, email, offline_access"})]}),n.jsx("h3",{style:{margin:"2rem 0 1rem",fontSize:"1.25rem"},children:"Advanced Settings"}),n.jsxs(Dr,{children:[n.jsx("label",{htmlFor:"authEndpoint",children:"Authorization Endpoint"}),n.jsx("input",{type:"url",id:"authEndpoint",name:"authEndpoint",value:t.authEndpoint,onChange:m}),n.jsxs("div",{className:"form-text",children:["The authorization endpoint URL. Use ","{envId}"," as a placeholder for the environment ID."]})]}),n.jsxs(Dr,{children:[n.jsx("label",{htmlFor:"tokenEndpoint",children:"Token Endpoint"}),n.jsx("input",{type:"url",id:"tokenEndpoint",name:"tokenEndpoint",value:t.tokenEndpoint,onChange:m}),n.jsxs("div",{className:"form-text",children:["The token endpoint URL. Use ","{envId}"," as a placeholder for the environment ID."]})]}),n.jsxs(Dr,{children:[n.jsx("label",{htmlFor:"userInfoEndpoint",children:"UserInfo Endpoint"}),n.jsx("input",{type:"url",id:"userInfoEndpoint",name:"userInfoEndpoint",value:t.userInfoEndpoint,onChange:m}),n.jsxs("div",{className:"form-text",children:["The UserInfo endpoint URL. Use ","{envId}"," as a placeholder for the environment ID."]})]}),n.jsx("div",{style:{marginTop:"2rem"},children:n.jsxs(z1,{type:"submit",disabled:u,children:[n.jsx(Fc,{}),u?"Saving...":"Save Configuration"]})})]})})]}),n.jsxs(Re,{style:{marginTop:"2rem"},children:[n.jsxs($e,{children:[n.jsx("h2",{children:"Configuration Help"}),n.jsx("p",{className:"subtitle",children:"How to set up your PingOne application"})]}),n.jsx(be,{children:n.jsxs("div",{children:[n.jsx("h3",{style:{marginTop:0},children:"🔧 PingOne Configuration Required"}),n.jsx("p",{children:"To use this OAuth Playground, you need to configure your PingOne environment:"}),n.jsxs("div",{children:[n.jsx("h4",{children:"1. Access PingOne Admin Console"}),n.jsxs("ul",{children:[n.jsxs("li",{children:["Navigate to your ",n.jsx("strong",{children:"PingOne Admin Console"})]}),n.jsxs("li",{children:["Go to ",n.jsx("strong",{children:"Applications"})," → ",n.jsx("strong",{children:"Applications"})]}),n.jsxs("li",{children:["Click ",n.jsx("strong",{style:{fontSize:"1.1rem",fontWeight:800,color:"rgb(0, 112, 204)"},children:"+ Add Application"})]}),n.jsxs("li",{children:["Select ",n.jsx("strong",{children:"Web Application"})]})]}),n.jsx("h4",{children:"2. Configure Application Details"}),n.jsxs("ul",{children:[n.jsxs("li",{children:[n.jsx("strong",{children:"Application Type:"})," OIDC Web App"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Application Name:"}),n.jsx("span",{style:{fontWeight:800,fontSize:"1rem",color:"rgb(0, 112, 204)",marginLeft:"0.5rem"},children:"PingOne OAuth Playground"})]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Description:"})," Interactive OAuth 2.0 testing application"]}),n.jsx("li",{children:n.jsx("strong",{children:"Hit Save Button"})})]}),n.jsx("h4",{children:"3. Configure Authentication"}),n.jsxs("ul",{children:[n.jsxs("li",{children:[n.jsx("strong",{children:"Enable Application -"})," Grey button on top right"]}),n.jsx("li",{children:n.jsx("strong",{children:"Hit Configuration tab"})}),n.jsxs("li",{children:[n.jsx("strong",{children:"Hit blue pencil"}),n.jsx("span",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,backgroundColor:"rgb(0, 112, 204)",borderRadius:"50%",marginLeft:8,color:"white"},"aria-hidden":!0,children:"✎"})]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Response Type:"})," Code"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Grant Type:"})," Authorization Code"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Redirect URIs:"}),n.jsx("span",{style:{fontWeight:800,fontSize:"1rem",color:"rgb(0, 112, 204)",marginLeft:"0.5rem"},children:t.redirectUri||"https://localhost:3000/callback"})]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Token Endpoint Authentication Method:"})," Client Secret Basic"]}),n.jsxs("li",{children:["Click ",n.jsx("strong",{style:{color:"rgb(0, 112, 204)"},children:"Save"})," to create the application"]})]}),n.jsx("h4",{children:"4. Save and Get Credentials"}),n.jsxs("ul",{children:[n.jsxs("li",{children:["See the ",n.jsx("strong",{children:"Environment ID (Issuer)"})]}),n.jsxs("li",{children:["See the ",n.jsx("strong",{children:"Client ID"})]}),n.jsxs("li",{children:["See the ",n.jsx("strong",{children:"Client Secret"}),n.jsx("span",{style:{marginLeft:"0.375rem",color:"rgb(108, 117, 125)"},children:"(hidden by default)"})]})]})]}),n.jsxs("div",{style:{marginTop:"1.5rem"},children:[n.jsx("h4",{children:"📝 Enter Your Credentials"}),n.jsxs("div",{style:{marginBottom:"0.75rem"},children:[n.jsx("p",{children:n.jsx("strong",{children:"Environment ID:"})}),n.jsx("div",{children:n.jsx("input",{type:"text",placeholder:"e.g., abc12345-6789-4abc-def0-1234567890ab",value:t.environmentId,onChange:()=>{},readOnly:!0,style:{width:"100%",padding:"0.5rem",border:"1px solid rgb(222, 226, 230)",borderRadius:4,fontFamily:'Monaco, Menlo, "Ubuntu Mono", monospace',fontSize:"0.85rem",backgroundColor:"rgb(248, 249, 250)"}})})]}),n.jsxs("div",{style:{marginBottom:"0.75rem"},children:[n.jsx("p",{children:n.jsx("strong",{children:"Client ID:"})}),n.jsx("div",{children:n.jsx("input",{type:"text",placeholder:"Enter your application's Client ID",value:t.clientId,onChange:()=>{},readOnly:!0,style:{width:"100%",padding:"0.5rem",border:"1px solid rgb(222, 226, 230)",borderRadius:4,fontFamily:'Monaco, Menlo, "Ubuntu Mono", monospace',fontSize:"0.85rem",backgroundColor:"rgb(248, 249, 250)"}})})]}),n.jsxs("div",{style:{marginBottom:"0.75rem"},children:[n.jsx("p",{children:n.jsx("strong",{children:"Client Secret:"})}),n.jsx("div",{children:n.jsx("input",{type:"password",placeholder:"Enter your application's Client Secret",value:t.clientSecret?"••••••••••••":"",onChange:()=>{},readOnly:!0,style:{width:"100%",padding:"0.5rem",border:"1px solid rgb(222, 226, 230)",borderRadius:4,fontFamily:'Monaco, Menlo, "Ubuntu Mono", monospace',fontSize:"0.85rem",backgroundColor:"rgb(248, 249, 250)"}})})]}),n.jsxs("div",{style:{marginBottom:"0.75rem"},children:[n.jsx("p",{children:n.jsx("strong",{children:"Redirect URI:"})}),n.jsx("div",{children:n.jsx("code",{children:t.redirectUri})})]}),n.jsxs("div",{style:{marginTop:"1rem",textAlign:"center"},children:[n.jsx("button",{className:"sc-bSFBcf kmoxbp",type:"button",disabled:!0,style:{width:"auto",padding:"0.75rem 2rem",opacity:.6},children:"Save Credentials"}),n.jsx("div",{className:"form-text",style:{marginTop:"0.5rem"},children:"Use the form above on this page to save your actual configuration securely."})]})]}),n.jsx("p",{style:{marginTop:"1rem"},children:n.jsxs("em",{children:["💡 ",n.jsx("strong",{children:"Need Help?"})," Check the PingOne documentation or contact your PingOne administrator."]})})]})})]})]})},R1=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,O1=x.div`
  margin-bottom: 2.5rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.75rem;
  }
  
  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
    max-width: 800px;
    line-height: 1.6;
  }
`,Yo=x.section`
  margin-bottom: 3rem;
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    color: ${({theme:t})=>t.colors.gray800};
    
    svg {
      margin-right: 0.75rem;
      color: ${({theme:t})=>t.colors.primary};
    }
  }
`,Jp=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`,Lr=x(dn)`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
  color: inherit;
  border: 1px solid ${({theme:t})=>t.colors.gray200};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: ${({theme:t})=>t.colors.primary}40;
  }
  
  h3 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    color: ${({theme:t})=>t.colors.primary};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 0;
  }
`,Ss=x.a`
  color: ${({theme:t})=>t.colors.primary};
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  margin-top: 1rem;
  
  &:hover {
    text-decoration: underline;
  }
  
  svg {
    margin-left: 0.5rem;
    font-size: 0.875em;
  }
`,N1=x.pre`
  background-color: ${({theme:t})=>t.colors.gray900};
  color: white;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-family: ${({theme:t})=>t.fonts.mono};
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 1.5rem 0;
  
  code {
    font-family: inherit;
  }
`,D1=()=>n.jsxs(R1,{children:[n.jsxs(O1,{children:[n.jsx("h1",{children:"OAuth 2.0 & OpenID Connect Documentation"}),n.jsx("p",{children:"Welcome to the OAuth Playground documentation. Here you'll find guides, examples, and references to help you understand and implement OAuth 2.0 and OpenID Connect with PingOne."})]}),n.jsxs(Yo,{children:[n.jsxs("h2",{children:[n.jsx(si,{})," Getting Started"]}),n.jsx("p",{children:"If you're new to OAuth 2.0 and OpenID Connect, start with these resources to understand the basics and how to use this playground effectively."}),n.jsxs(Jp,{children:[n.jsxs(Lr,{to:"/documentation/oauth-basics",children:[n.jsxs("h3",{children:["OAuth 2.0 Basics ",n.jsx(fr,{size:16})]}),n.jsx("p",{children:"Learn the fundamental concepts of OAuth 2.0, including roles, tokens, and the different grant types."})]}),n.jsxs(Lr,{to:"/documentation/oidc-basics",children:[n.jsxs("h3",{children:["OpenID Connect Overview ",n.jsx(fr,{size:16})]}),n.jsx("p",{children:"Understand how OpenID Connect builds on OAuth 2.0 to provide authentication and single sign-on."})]}),n.jsxs(Lr,{to:"/documentation/setup-guide",children:[n.jsxs("h3",{children:["PingOne Setup Guide ",n.jsx(fr,{size:16})]}),n.jsx("p",{children:"Step-by-step instructions for configuring your PingOne environment and application."})]})]})]}),n.jsxs(Yo,{children:[n.jsxs("h2",{children:[n.jsx(lo,{})," OAuth 2.0 Flows"]}),n.jsx("p",{children:"OAuth 2.0 defines several grant types (or flows) for different use cases. Each flow is designed for specific scenarios and has different security characteristics."}),n.jsxs(Jp,{children:[n.jsxs(Lr,{to:"/flows/authorization-code",children:[n.jsx("h3",{children:"Authorization Code Flow"}),n.jsx("p",{children:"The most secure flow for server-side applications where the client secret can be kept confidential."})]}),n.jsxs(Lr,{to:"/flows/pkce",children:[n.jsx("h3",{children:"PKCE Flow"}),n.jsx("p",{children:"An extension of the Authorization Code flow for public clients that cannot store a client secret."})]}),n.jsxs(Lr,{to:"/flows/implicit",children:[n.jsx("h3",{children:"Implicit Flow"}),n.jsx("p",{children:"A simplified flow for client-side applications (not recommended for new applications)."})]}),n.jsxs(Lr,{to:"/flows/client-credentials",children:[n.jsx("h3",{children:"Client Credentials"}),n.jsx("p",{children:"For machine-to-machine authentication where the client is also the resource owner."})]}),n.jsxs(Lr,{to:"/flows/device-code",children:[n.jsx("h3",{children:"Device Code Flow"}),n.jsx("p",{children:"For input-constrained devices that can display a code and prompt the user to visit a URL."})]})]})]}),n.jsxs(Yo,{children:[n.jsxs("h2",{children:[n.jsx(il,{})," Security Best Practices"]}),n.jsx("p",{children:"Implementing OAuth 2.0 and OpenID Connect securely requires following best practices to protect against common vulnerabilities."}),n.jsxs("div",{style:{marginTop:"1.5rem"},children:[n.jsx("h3",{children:"Always Use HTTPS"}),n.jsx("p",{children:"All OAuth 2.0 and OpenID Connect endpoints must be accessed over HTTPS to protect tokens and sensitive data in transit."}),n.jsx("h3",{children:"Validate ID Tokens"}),n.jsx("p",{children:"Always validate ID tokens to ensure they are properly signed, not expired, and issued by a trusted identity provider."}),n.jsx(N1,{children:n.jsx("code",{children:`// Example ID token validation
const validateIdToken = (idToken, clientId, issuer) => {
  // Verify the token signature
  // Check the token expiration (exp claim)
  // Validate the issuer (iss claim)
  // Verify the audience (aud claim)
  // Check the nonce (if used)
};`})}),n.jsx("h3",{children:"Secure Token Storage"}),n.jsx("p",{children:"Store tokens securely based on your application type. For web applications, use HTTP-only cookies or secure browser storage with appropriate security flags."}),n.jsx("h3",{children:"Use PKCE for Public Clients"}),n.jsx("p",{children:"Always use PKCE (Proof Key for Code Exchange) for public clients to protect against authorization code interception attacks."})]})]}),n.jsxs(Yo,{children:[n.jsxs("h2",{children:[n.jsx(Em,{})," Common Issues & Troubleshooting"]}),n.jsxs("div",{style:{marginTop:"1.5rem"},children:[n.jsx("h3",{children:"Invalid Redirect URI"}),n.jsxs("p",{children:[n.jsx("strong",{children:"Error:"}),' "The redirect URI in the request does not match the registered redirect URIs"',n.jsx("br",{}),n.jsx("strong",{children:"Solution:"})," Ensure the redirect URI in your application configuration matches exactly (including trailing slashes) with the one used in the authorization request."]}),n.jsx("h3",{children:"Invalid Client"}),n.jsxs("p",{children:[n.jsx("strong",{children:"Error:"}),' "Invalid client"',n.jsx("br",{}),n.jsx("strong",{children:"Solution:"})," Verify that your client ID and client secret are correct and that your application is properly configured in PingOne."]}),n.jsx("h3",{children:"Invalid Grant"}),n.jsxs("p",{children:[n.jsx("strong",{children:"Error:"}),' "Invalid grant"',n.jsx("br",{}),n.jsx("strong",{children:"Solution:"})," This can occur for several reasons:",n.jsxs("ul",{style:{marginLeft:"1.5rem",marginTop:"0.5rem"},children:[n.jsx("li",{children:"The authorization code has expired (typically after 10 minutes)"}),n.jsx("li",{children:"The authorization code has already been used"}),n.jsx("li",{children:"The code verifier doesn't match the code challenge"})]})]})]})]}),n.jsxs(Yo,{children:[n.jsxs("h2",{children:[n.jsx(fr,{})," Additional Resources"]}),n.jsxs("div",{style:{marginTop:"1.5rem"},children:[n.jsx("p",{children:"Explore these external resources to learn more about OAuth 2.0 and OpenID Connect:"}),n.jsxs("ul",{style:{marginTop:"1rem",listStyle:"none",padding:0},children:[n.jsx("li",{style:{marginBottom:"0.75rem"},children:n.jsxs(Ss,{href:"https://datatracker.ietf.org/doc/html/rfc6749",target:"_blank",rel:"noopener noreferrer",children:["OAuth 2.0 Authorization Framework (RFC 6749)",n.jsx(fr,{})]})}),n.jsx("li",{style:{marginBottom:"0.75rem"},children:n.jsxs(Ss,{href:"https://openid.net/connect/",target:"_blank",rel:"noopener noreferrer",children:["OpenID Connect Documentation",n.jsx(fr,{})]})}),n.jsx("li",{style:{marginBottom:"0.75rem"},children:n.jsxs(Ss,{href:"https://docs.pingidentity.com/bundle/pingone/page/lyc1469003009660.html",target:"_blank",rel:"noopener noreferrer",children:["PingOne Documentation",n.jsx(fr,{})]})}),n.jsx("li",{style:{marginBottom:"0.75rem"},children:n.jsxs(Ss,{href:"https://oauth.net/2/",target:"_blank",rel:"noopener noreferrer",children:["OAuth.net - Community Resource",n.jsx(fr,{})]})})]})]})]})]}),L1=Kx`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`,U1=x.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: ${L1} 1s linear infinite;

  svg {
    font-size: ${({size:t})=>t||16}px;
    color: ${({color:t,theme:i})=>{var s;return t||((s=i==null?void 0:i.colors)==null?void 0:s.primary)||"#0070CC"}};
  }
`,ro=({size:t=16,color:i})=>n.jsx(U1,{size:t,color:i,children:n.jsx(Tm,{})}),M1=x.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0070CC 0%, #0056A3 100%);
  padding: 2rem;
`,F1=x.div`
  display: flex;
  gap: 2rem;
  width: 100%;
  max-width: 1400px;
  align-items: flex-start;
`,W1=x.div`
  flex: 1;
  max-width: 700px;
  min-width: 0;

  @media (max-width: ${({theme:t})=>t.breakpoints.md}) {
    max-width: 100%;
  }
`,B1=x.div`
  flex: 1;
  max-width: 480px;
`,J1=x.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  overflow: hidden;
`,H1=x.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${({theme:t})=>t.colors.gray200};
  text-align: center;

  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 800;
    color: #0070CC;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;

    span {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
`,V1=x.div`
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;

  p {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #0070CC;
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;

    span {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
`,K1=x.div`
  padding: 2rem;
`;x.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: ${({theme:t})=>"#495057"};
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid ${({theme:t})=>"#dee2e6"};
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      outline: none;
      border-color: #0070CC;
      box-shadow: 0 0 0 3px rgba(0, 112, 204, 0.1);
    }

    &:disabled {
      background-color: #f8f9fa;
      cursor: not-allowed;
    }
  }
  .error {
    color: ${({theme:t})=>"#dc3545"};
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
`;x(Ae)`
  font-size: 3rem;
  color: ${({theme:t})=>"#dc3545"};
  margin-bottom: 1.5rem;
`;const Hp=x.button`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: ${({theme:t})=>"#007bff"};
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${({theme:t})=>"#0056b3"};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`,G1=x.div`
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: flex-start;
  background-color: ${({theme:t})=>`${t.colors.danger}10`};
  border: 1px solid ${({theme:t})=>`${t.colors.danger}20`};
  color: ${({theme:t})=>"#dc3545"};
  
  svg {
    margin-right: 0.75rem;
    margin-top: 0.2rem;
    flex-shrink: 0;
  }
  
  div {
    flex: 1;
  }
`,q1=x.div`
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: left;
  height: fit-content;

  h3 {
    color: #495057;
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
  }

  p {
    color: #6c757d;
    margin-bottom: 1rem;
    line-height: 1.4;
    font-size: 0.9rem;
  }

  em {
    font-style: italic;
    color: #6c757d;
    font-size: 0.85rem;
  }
`,Y1=x.div`
  margin-bottom: 1.5rem;

  h4 {
    color: #343a40;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  ul {
    margin: 0 0 0.5rem 0;
    padding-left: 1.2rem;
  }

  li {
    margin-bottom: 0.25rem;
    color: #495057;
    line-height: 1.3;
    font-size: 0.85rem;

    strong {
      color: #212529;
    }

    code {
      background-color: #e9ecef;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.75em;
      color: #495057;
    }
  }
`,Q1=x.div`
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.5rem;

  h4 {
    color: #343a40;
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  p {
    margin-bottom: 0.5rem;
    color: #495057;
    font-size: 0.8rem;

    strong {
      color: #212529;
      font-weight: 600;
    }

    code {
      background-color: #f8f9fa;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.9rem;
      font-weight: 700;
      color: #0070CC;
      letter-spacing: 0.5px;
      word-break: break-all;
      display: inline-block;
      margin-top: 0.25rem;
      border: 1px solid #e9ecef;
    }
  }
`,bs=x.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 0.5rem;

  p {
    margin: 0;
    min-width: 120px;
    font-weight: 600;
    color: #495057;
  }
`,Cs=x.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;

  code {
    flex: 1;
    margin: 0;
  }
`,Is=x.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: #f8f9fa;
    color: #0070CC;
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    transition: all 0.2s;
  }
`,X1=()=>{var B,ee,Y,le;const[t,i]=S.useState(""),[s,c]=S.useState(!1),[u,h]=S.useState(null),[f,v]=S.useState({environmentId:"b9817c16-9910-4415-b67e-4ac687da74d9",clientId:"a4f963ea-0736-456a-be72-b1fa4f63f81f",clientSecret:"0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a"}),[m,g]=S.useState(!1),k=()=>g(!m),[w,b]=S.useState(null),[R,L]=S.useState(!1),{login:M,isAuthenticated:E}=gn();Jt();const C=vt();(ee=(B=C.state)==null?void 0:B.from)!=null&&ee.pathname;const z=(Y=C.state)==null?void 0:Y.message,O=((le=C.state)==null?void 0:le.type)||"info";S.useEffect(()=>{var G;console.log("🔍 [Login] Loading credentials from localStorage...");const oe=localStorage.getItem("login_credentials");if(oe)try{const ce=JSON.parse(oe);console.log("✅ [Login] Found saved credentials:",{hasEnvironmentId:!!ce.environmentId,hasClientId:!!ce.clientId,hasClientSecret:!!ce.clientSecret,clientIdPrefix:((G=ce.clientId)==null?void 0:G.substring(0,8))+"..."}),v(ce)}catch(ce){console.error("❌ [Login] Failed to parse saved credentials:",ce)}else console.log("⚠️ [Login] No saved credentials found in localStorage")},[]);const D=async(oe,G)=>{try{await navigator.clipboard.writeText(oe),h(G),setTimeout(()=>h(null),2e3)}catch(ce){console.error("Failed to copy text: ",ce)}},A=(oe,G)=>{v(ce=>({...ce,[oe]:G}))},F=()=>{var oe;console.log("💾 [Login] Saving credentials to localStorage..."),b(null),L(!0);try{localStorage.setItem("login_credentials",JSON.stringify(f)),console.log("✅ [Login] Credentials saved to login_credentials:",{hasEnvironmentId:!!f.environmentId,hasClientId:!!f.clientId,hasClientSecret:!!f.clientSecret,clientIdPrefix:((oe=f.clientId)==null?void 0:oe.substring(0,8))+"..."});const G={environmentId:f.environmentId,clientId:f.clientId,clientSecret:f.clientSecret,redirectUri:"https://localhost:3000/callback",scopes:"openid profile email",authEndpoint:`https://auth.pingone.com/${f.environmentId}/as/authorize`,tokenEndpoint:`https://auth.pingone.com/${f.environmentId}/as/token`,userInfoEndpoint:`https://auth.pingone.com/${f.environmentId}/as/userinfo`};localStorage.setItem("pingone_config",JSON.stringify(G)),console.log("✅ [Login] Config also saved to pingone_config"),b({type:"success",title:"Credentials saved",message:"Your login credentials have been saved successfully."})}catch(G){console.error("❌ [Login] Failed to save credentials:",G),b({type:"danger",title:"Error",message:"Failed to save credentials. Please try again."})}finally{setTimeout(()=>{L(!1)},500)}setTimeout(()=>{b(null)},3e3)},N=async()=>{i(""),c(!0);try{localStorage.setItem("login_credentials",JSON.stringify(f));const oe={environmentId:f.environmentId,clientId:f.clientId,clientSecret:f.clientSecret,redirectUri:"https://localhost:3000/callback",scopes:"openid profile email",authEndpoint:`https://auth.pingone.com/${f.environmentId}/as/authorize`,tokenEndpoint:`https://auth.pingone.com/${f.environmentId}/as/token`,userInfoEndpoint:`https://auth.pingone.com/${f.environmentId}/as/userinfo`};localStorage.setItem("pingone_config",JSON.stringify(oe)),await M()}catch(oe){console.error("Login error:",oe),i("An error occurred during login. Please try again."),c(!1)}};return n.jsx(M1,{children:n.jsxs(F1,{children:[n.jsxs(W1,{children:[n.jsx(V1,{children:n.jsx("p",{children:n.jsxs("span",{children:["📝 ",cc.description]})})}),n.jsxs(q1,{children:[n.jsx("h3",{children:"🔧 PingOne Configuration Required"}),n.jsx("p",{children:"To use this OAuth Playground, you need to configure your PingOne environment:"}),n.jsxs(Y1,{children:[n.jsx("h4",{children:"1. Access PingOne Admin Console"}),n.jsxs("ul",{children:[n.jsxs("li",{children:["Navigate to your ",n.jsx("strong",{children:"PingOne Admin Console"})]}),n.jsxs("li",{children:["Go to ",n.jsx("strong",{children:"Applications"})," → ",n.jsx("strong",{children:"Applications"})]}),n.jsxs("li",{children:["Click ",n.jsx("strong",{style:{fontSize:"1.1rem",fontWeight:"800",color:"#0070CC"},children:"+ Add Application"})]}),n.jsxs("li",{children:["Select ",n.jsx("strong",{children:"Web Application"})]})]}),n.jsx("h4",{children:"2. Configure Application Details"}),n.jsxs("ul",{children:[n.jsxs("li",{children:[n.jsx("strong",{children:"Application Type:"})," OIDC Web App"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Application Name:"}),n.jsxs("span",{style:{fontWeight:"800",fontSize:"1rem",color:"#0070CC",marginLeft:"0.5rem"},children:["PingOne OAuth Playground",n.jsx("button",{onClick:()=>D("PingOne OAuth Playground","setup-app-name"),style:{background:"none",border:"1px solid #0070CC",color:"#0070CC",cursor:"pointer",padding:"0.125rem 0.25rem",borderRadius:"3px",fontSize:"0.7rem",fontWeight:"600",marginLeft:"0.5rem",display:"inline-flex",alignItems:"center",gap:"0.125rem",transition:"all 0.2s"},title:"Copy Application Name",children:u==="setup-app-name"?n.jsx(sn,{size:10}):n.jsx(an,{size:10})})]})]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Description:"})," Interactive OAuth 2.0 testing application"]}),n.jsx("li",{children:n.jsx("strong",{children:"Hit Save Button"})})]}),n.jsx("h4",{children:"3. Configure Authentication"}),n.jsxs("ul",{children:[n.jsx("li",{children:n.jsx("strong",{children:"Enable Application - Grey button on top Right"})}),n.jsx("li",{children:n.jsx("strong",{children:"Hit Configuration tab"})}),n.jsxs("li",{children:[n.jsx("strong",{children:"Hit blue pencil"}),n.jsx("span",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"20px",height:"20px",backgroundColor:"#0070CC",borderRadius:"50%",marginLeft:"8px",color:"white"},children:n.jsx(_m,{size:12})})]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Response Type:"})," Code"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Grant Type:"})," Authorization Code"]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Redirect URIs:"}),n.jsxs("span",{style:{fontWeight:"800",fontSize:"1rem",color:"#0070CC",marginLeft:"0.5rem"},children:["https://localhost:3000/callback",n.jsx("button",{onClick:()=>D("https://localhost:3000/callback","setup-redirect-uri"),style:{background:"none",border:"1px solid #0070CC",color:"#0070CC",cursor:"pointer",padding:"0.125rem 0.25rem",borderRadius:"3px",fontSize:"0.7rem",fontWeight:"600",marginLeft:"0.5rem",display:"inline-flex",alignItems:"center",gap:"0.125rem",transition:"all 0.2s"},title:"Copy Redirect URI",children:u==="setup-redirect-uri"?n.jsx(sn,{size:10}):n.jsx(an,{size:10})})]})]}),n.jsxs("li",{children:[n.jsx("strong",{children:"Token Endpoint Authentication Method:"})," Client Secret Basic"]}),n.jsxs("li",{children:["Click ",n.jsx("strong",{style:{color:"#0070CC"},children:"Save"})," to create the application"]})]}),n.jsx("h4",{children:"4. Save and Get Credentials"}),n.jsxs("ul",{children:[n.jsxs("li",{children:["See the ",n.jsx("strong",{children:"Environment ID (Issuer)"})]}),n.jsxs("li",{children:["See the ",n.jsx("strong",{children:"Client ID"})]}),n.jsxs("li",{children:["See the ",n.jsx("strong",{children:"Client Secret"}),n.jsxs("span",{style:{marginLeft:"0.375rem",color:"#6c757d",display:"inline-flex",alignItems:"center",gap:"0.25rem"},children:["(",n.jsx(mn,{size:12})," show/hide)"]})]})]})]}),n.jsxs(Q1,{children:[n.jsx("h4",{children:"📝 Enter Your Credentials"}),w&&n.jsxs("div",{style:{padding:"1rem",marginBottom:"1.5rem",borderRadius:"0.375rem",backgroundColor:w.type==="success"?"#f0fdf4":"#fef2f2",border:`1px solid ${w.type==="success"?"#bbf7d0":"#fecaca"}`,color:w.type==="success"?"#166534":"#991b1b",display:"flex",alignItems:"flex-start"},children:[w.type==="success"?n.jsx(ut,{size:20,style:{marginRight:"0.75rem",marginTop:"0.2rem",flexShrink:0}}):n.jsx(Ae,{size:20,style:{marginRight:"0.75rem",marginTop:"0.2rem",flexShrink:0}}),n.jsxs("div",{children:[n.jsx("h4",{style:{marginTop:0,marginBottom:"0.5rem",fontWeight:600},children:w.title}),n.jsx("p",{style:{margin:0,fontSize:"0.9375rem"},children:w.message})]})]}),n.jsxs(bs,{children:[n.jsx("p",{children:n.jsx("strong",{children:"Environment ID:"})}),n.jsxs(Cs,{children:[n.jsx("input",{type:"text",value:f.environmentId,onChange:oe=>A("environmentId",oe.target.value),style:{width:"100%",padding:"0.5rem",border:"1px solid #dee2e6",borderRadius:"4px",fontFamily:"Monaco, Menlo, Ubuntu Mono, monospace",fontSize:"0.85rem",backgroundColor:"#f8f9fa"},placeholder:"e.g., abc12345-6789-4abc-def0-1234567890ab"}),n.jsx(Is,{onClick:()=>D(f.environmentId,"env-id"),title:"Copy Environment ID",children:u==="env-id"?n.jsx(sn,{size:16}):n.jsx(an,{size:16})})]})]}),n.jsxs(bs,{children:[n.jsx("p",{children:n.jsx("strong",{children:"Client ID:"})}),n.jsxs(Cs,{children:[n.jsx("input",{type:"text",value:f.clientId,onChange:oe=>A("clientId",oe.target.value),style:{width:"100%",padding:"0.5rem",border:"1px solid #dee2e6",borderRadius:"4px",fontFamily:"Monaco, Menlo, Ubuntu Mono, monospace",fontSize:"0.85rem",backgroundColor:"#f8f9fa"},placeholder:"Enter your application's Client ID"}),n.jsx(Is,{onClick:()=>D(f.clientId,"client-id"),title:"Copy Client ID",children:u==="client-id"?n.jsx(sn,{size:16}):n.jsx(an,{size:16})})]})]}),n.jsxs(bs,{children:[n.jsx("p",{children:n.jsx("strong",{children:"Client Secret:"})}),n.jsxs(Cs,{children:[n.jsxs("div",{style:{position:"relative",width:"100%"},children:[n.jsx("input",{type:m?"text":"password",value:f.clientSecret,onChange:oe=>A("clientSecret",oe.target.value),style:{width:"100%",padding:"0.5rem 3.25rem 0.5rem 0.75rem",border:"1px solid #dee2e6",borderRadius:"4px",fontFamily:"Monaco, Menlo, Ubuntu Mono, monospace",fontSize:"0.85rem",backgroundColor:"#f8f9fa"},placeholder:"Enter your application's Client Secret"}),n.jsx("button",{onClick:k,type:"button",style:{position:"absolute",right:"0.5rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#6c757d",padding:"0.25rem",display:"flex",alignItems:"center",justifyContent:"center"},"aria-label":m?"Hide client secret":"Show client secret",children:m?n.jsx(Yv,{size:18}):n.jsx(mn,{size:18})})]}),n.jsx(Is,{onClick:()=>D(f.clientSecret,"client-secret"),title:"Copy Client Secret",style:{marginLeft:"0.5rem"},children:u==="client-secret"?n.jsx(sn,{size:16}):n.jsx(an,{size:16})})]})]}),n.jsxs(bs,{children:[n.jsx("p",{children:n.jsx("strong",{children:"Redirect URI:"})}),n.jsxs(Cs,{children:[n.jsx("code",{children:"https://localhost:3000/callback"}),n.jsx(Is,{onClick:()=>D("https://localhost:3000/callback","redirect-uri"),title:"Copy Redirect URI",children:u==="redirect-uri"?n.jsx(sn,{size:16}):n.jsx(an,{size:16})})]})]}),n.jsx("div",{style:{marginTop:"1.5rem",textAlign:"center"},children:n.jsx(Hp,{onClick:F,disabled:R,style:{width:"auto",padding:"0.75rem 2rem"},children:R?n.jsxs(n.Fragment,{children:[n.jsx(ro,{size:16}),"Saving..."]}):n.jsxs(n.Fragment,{children:[n.jsx(sn,{}),"Save Credentials"]})})})]}),n.jsx("p",{children:n.jsxs("em",{children:["💡 ",n.jsx("strong",{children:"Need Help?"})," Check the PingOne documentation or contact your PingOne administrator."]})})]})]}),n.jsx(B1,{children:n.jsxs(J1,{children:[n.jsx(H1,{children:n.jsxs("h1",{children:[n.jsxs("span",{children:["🔐 ",cc.title]}),n.jsxs("small",{style:{display:"block",fontSize:"0.75rem",fontWeight:"normal",marginTop:"0.25rem",color:"#666"},children:["Version ",cc.version]})]})}),n.jsxs(K1,{children:[z&&n.jsxs("div",{style:{padding:"1rem",marginBottom:"1.5rem",borderRadius:"0.375rem",backgroundColor:O==="success"?"#f0fdf4":O==="error"?"#fef2f2":O==="warning"?"#fffbeb":"#eff6ff",border:`1px solid ${O==="success"?"#bbf7d0":O==="error"?"#fecaca":O==="warning"?"#fde68a":"#bfdbfe"}`,color:O==="success"?"#166534":O==="error"?"#991b1b":O==="warning"?"#92400e":"#1e40af",display:"flex",alignItems:"flex-start"},children:[O==="success"?n.jsx(ut,{size:20,style:{marginRight:"0.75rem",marginTop:"0.2rem",flexShrink:0}}):O==="error"?n.jsx(Ae,{size:20,style:{marginRight:"0.75rem",marginTop:"0.2rem",flexShrink:0}}):O==="warning"?n.jsx(Ae,{size:20,style:{marginRight:"0.75rem",marginTop:"0.2rem",flexShrink:0}}):n.jsx(Ae,{size:20,style:{marginRight:"0.75rem",marginTop:"0.2rem",flexShrink:0}}),n.jsxs("div",{children:[n.jsx("h4",{style:{marginTop:0,marginBottom:"0.5rem",fontWeight:600},children:O==="success"?"Success":O==="error"?"Error":O==="warning"?"Warning":"Information"}),n.jsx("p",{style:{margin:0,fontSize:"0.9375rem"},children:z})]})]}),t&&n.jsxs(G1,{children:[n.jsx(Ae,{size:20}),n.jsx("div",{children:t})]}),n.jsx("div",{style:{textAlign:"center",padding:"2rem 0"},children:n.jsx(Hp,{onClick:N,disabled:s,style:{width:"auto",padding:"0.75rem 2rem"},children:s?n.jsxs(n.Fragment,{children:[n.jsx(ro,{size:16}),"Redirecting..."]}):n.jsxs(n.Fragment,{children:[n.jsx(zm,{}),"Login with PingOne"]})})})]})]})})]})})},hc=x.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background-color: ${({theme:t})=>t.colors.gray50};
`,mc=x.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 3rem 2rem;
  width: 100%;
  max-width: 500px;
`,Z1=x(Tm)`
  animation: spin 1s linear infinite;
  font-size: 3rem;
  color: ${({theme:t})=>t.colors.primary};
  margin-bottom: 1.5rem;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`,ew=x(ut)`
  font-size: 3rem;
  color: ${({theme:t})=>t.colors.success};
  margin-bottom: 1.5rem;
`,tw=x(Ae)`
  font-size: 3rem;
  color: ${({theme:t})=>t.colors.danger};
  margin-bottom: 1.5rem;
`,gc=x.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({theme:t})=>t.colors.gray900};
  margin-bottom: 1rem;
`,yc=x.p`
  color: ${({theme:t})=>t.colors.gray600};
  margin-bottom: 2rem;
  line-height: 1.6;
`,Vp=x.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: ${({theme:t})=>t.colors.primary};
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
  
  &:hover {
    background-color: ${({theme:t})=>t.colors.primaryDark};
    text-decoration: none;
  }
`,rw=()=>{const[t]=Hy(),i=Jt(),{handleCallback:s}=gn(),[c,u]=S.useState("processing"),[h,f]=S.useState(""),[v,m]=S.useState(!1);S.useEffect(()=>{(async()=>{if(v){console.log("🔄 [Callback] Callback already processed, skipping...");return}m(!0);try{console.log("🔍 [Callback] Processing OAuth callback..."),console.log("🔍 [Callback] Current URL:",window.location.href);const b={};for(const[R,L]of t.entries())b[R]=L;if(console.log("🔍 [Callback] URL parameters:",b),b.error){console.error("❌ [Callback] OAuth error in URL:",b.error,b.error_description);let R=b.error_description||"Authorization failed";throw b.error==="NOT_FOUND"?R="Configuration Issue: The PingOne environment or application could not be found. Please check your Environment ID and ensure your PingOne application is properly configured.":b.error==="invalid_request"?R="Invalid Request: The authorization request was malformed. Please try again or contact support if the issue persists.":b.error==="unauthorized_client"?R="Unauthorized Client: Your application is not authorized to make this request. Please check your Client ID configuration.":b.error==="access_denied"?R="Access Denied: The user denied the authorization request or the request was cancelled.":b.error==="unsupported_response_type"?R="Configuration Error: The requested response type is not supported. Please contact support.":b.error==="invalid_scope"?R="Invalid Scope: The requested permissions are not valid. Please check your scope configuration.":b.error==="server_error"?R="Server Error: PingOne encountered an internal error. Please try again later.":b.error==="temporarily_unavailable"&&(R="Service Unavailable: PingOne is temporarily unavailable. Please try again later."),new Error(R)}if(!b.code)throw console.error("❌ [Callback] No authorization code in URL parameters"),new Error("No authorization code received. The OAuth flow may have been interrupted.");console.log("✅ [Callback] Authorization code found, processing callback..."),await s(window.location.href),console.log("✅ [Callback] Authentication successful"),u("success"),setTimeout(()=>{i("/dashboard",{replace:!0})},2e3)}catch(b){console.error("❌ [Callback] OAuth callback error:",b),u("error"),f(b instanceof Error?b.message:"An error occurred during authentication")}})()},[t,i,s,v]);const g=()=>{i("/login")},k=()=>{i("/dashboard",{replace:!0})};return c==="processing"?n.jsx(hc,{children:n.jsxs(mc,{children:[n.jsx(Z1,{}),n.jsx(gc,{children:"Completing Authentication"}),n.jsx(yc,{children:"Please wait while we complete your login..."})]})}):c==="success"?n.jsx(hc,{children:n.jsxs(mc,{children:[n.jsx(ew,{}),n.jsx(gc,{children:"Authentication Successful"}),n.jsx(yc,{children:"You have been successfully authenticated. Redirecting to the dashboard..."}),n.jsx(Vp,{onClick:k,children:"Go to Dashboard"})]})}):n.jsx(hc,{children:n.jsxs(mc,{children:[n.jsx(tw,{}),n.jsx(gc,{children:"Authentication Failed"}),n.jsx(yc,{children:h||"An error occurred during the authentication process. Please try again."}),n.jsx(Vp,{onClick:g,children:"Try Again"})]})})},nw=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,ow=x.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`,iw=x(Re)`
  margin-bottom: 2rem;
`,sw=x.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({theme:t})=>t.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`,lw=x.div`
  background-color: ${({theme:t})=>t.colors.warning}10;
  border: 1px solid ${({theme:t})=>t.colors.warning}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({theme:t})=>t.colors.warning};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({theme:t})=>t.colors.warning};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({theme:t})=>t.colors.warning};
    font-size: 0.9rem;
  }
`,aw=x(Re)`
  margin-bottom: 2rem;
`,cw=x.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
`,_s=x.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: ${({theme:t})=>t.colors.primary};
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: ${({theme:t})=>t.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({theme:t})=>t.colors.primary};
    border: 1px solid ${({theme:t})=>t.colors.primary};

    &:hover {
      background-color: ${({theme:t})=>t.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`,dw=x.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &.idle {
    background-color: ${({theme:t})=>t.colors.gray100};
    color: ${({theme:t})=>t.colors.gray700};
  }

  &.loading {
    background-color: ${({theme:t})=>t.colors.info}20;
    color: ${({theme:t})=>t.colors.info};
  }

  &.success {
    background-color: ${({theme:t})=>t.colors.success}20;
    color: ${({theme:t})=>t.colors.success};
  }

  &.error {
    background-color: ${({theme:t})=>t.colors.danger}20;
    color: ${({theme:t})=>t.colors.danger};
  }
`,uw=x.div`
  margin-top: 2rem;
`,fw=x.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({$active:t,$completed:i,$error:s})=>s?"rgba(239, 68, 68, 0.1)":i?"rgba(34, 197, 94, 0.1)":t?"rgba(59, 130, 246, 0.1)":"transparent"};
  border: 2px solid ${({$active:t,$completed:i,$error:s})=>s?"#ef4444":i?"#22c55e":t?"#3b82f6":"transparent"};
`,pw=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;

  ${({$active:t,$completed:i,$error:s})=>s?`
        background-color: #ef4444;
        color: white;
      `:i?`
        background-color: #22c55e;
        color: white;
      `:t?`
        background-color: #3b82f6;
        color: white;
      `:`
      background-color: #e5e7eb;
      color: #6b7280;
    `}
`,hw=x.div`
  flex: 1;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
  }

  p {
    margin: 0 0 1rem 0;
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.5;
  }
`,Kp=x.pre`
  background-color: ${({theme:t})=>t.colors.gray900};
  color: ${({theme:t})=>t.colors.gray100};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid ${({theme:t})=>t.colors.gray800};
`,mw=x.div`
  background-color: ${({theme:t})=>t.colors.gray100};
  border: 1px solid ${({theme:t})=>t.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  color: ${({theme:t})=>t.colors.gray800};
`,Gp=x.div`
  background-color: ${({theme:t})=>t.colors.danger}10;
  border: 1px solid ${({theme:t})=>t.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({theme:t})=>t.colors.danger};
  font-size: 0.9rem;
`,gw=()=>{const{isAuthenticated:t}=gn(),{config:i}=Hr();Jt();const[s,c]=S.useState("idle"),[u,h]=S.useState(0),[f,v]=S.useState(""),[m,g]=S.useState(null),[k,w]=S.useState(null),[b,R]=S.useState(!1),[L,M]=S.useState(!1),E=()=>{if(!i)return"";const D=new URLSearchParams({response_type:"token id_token",client_id:i.clientId,redirect_uri:i.redirectUri,scope:"openid profile email",state:Math.random().toString(36).substring(2,15),nonce:Math.random().toString(36).substring(2,15)});return`${i.apiUrl}/authorize?${D.toString()}`},C=async()=>{c("loading"),h(0),w(null),g(null);try{const D=E();v(D),h(1),setTimeout(()=>{h(2),g({access_token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",id_token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",token_type:"Bearer",expires_in:3600,scope:"openid profile email"}),h(3),c("success")},3e3)}catch(D){console.error("Implicit flow failed:",D),w("Failed to start implicit flow. Please check your configuration."),c("error")}},z=()=>{c("idle"),h(0),g(null),w(null),v("")},O=[{title:"Generate Authorization URL",description:"Create the authorization URL with the implicit grant parameters",code:`// Authorization URL for Implicit Grant
const authUrl = '${E()}';

// Parameters:
response_type: 'token id_token'
client_id: '${(i==null?void 0:i.clientId)||"your_client_id"}'
redirect_uri: '${(i==null?void 0:i.redirectUri)||"https://yourapp.com/callback"}'
scope: 'openid profile email'
state: 'random_state_value'
nonce: 'random_nonce_value'`},{title:"Redirect User to Authorization Server",description:"User is redirected to PingOne to authenticate and consent",code:`// User clicks login link or is redirected
window.location.href = authUrl;

// PingOne handles:
// - User authentication
// - Consent for requested scopes
// - Redirect back with tokens in URL fragment`},{title:"Handle Redirect with Tokens",description:"PingOne redirects back with access token and ID token in URL fragment",code:`// Callback URL with tokens in fragment
https://yourapp.com/callback#access_token=eyJ...

// JavaScript extracts tokens from URL fragment
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);

const accessToken = params.get('access_token');
const idToken = params.get('id_token');
const tokenType = params.get('token_type');
const expiresIn = params.get('expires_in');

// Store tokens securely
localStorage.setItem('access_token', accessToken);
localStorage.setItem('id_token', idToken);`},{title:"Use Tokens for API Calls",description:"Use the access token to authenticate API requests",code:`// Make authenticated API calls
const headers = {
  'Authorization': 'Bearer ' + accessToken,
  'Content-Type': 'application/json'
};

fetch('/api/user/profile', { headers })
  .then(response => response.json())
  .then(data => console.log('User profile:', data));

// Validate ID token if needed
const decodedIdToken = parseJwt(idToken);
console.log('User ID:', decodedIdToken.sub);`}];return n.jsxs(nw,{children:[n.jsxs(ow,{children:[n.jsxs("h1",{children:[n.jsx(il,{}),"Implicit Grant Flow"]}),n.jsx("p",{children:"Learn how the Implicit Grant flow works with real API calls to PingOne. This flow is suitable for client-side applications but has security limitations."})]}),n.jsxs(iw,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Flow Overview"})}),n.jsxs(be,{children:[n.jsxs(sw,{children:[n.jsx("h2",{children:"What is Implicit Grant?"}),n.jsx("p",{children:"The Implicit Grant flow is a simplified OAuth 2.0 flow designed for public clients (typically browser-based applications) that cannot securely store client secrets. Access tokens are returned immediately without an extra authorization code exchange step."}),n.jsxs("p",{children:[n.jsx("strong",{children:"How it works:"})," The client redirects the user to the authorization server, which authenticates the user and immediately returns access tokens in the redirect URL fragment."]})]}),n.jsxs(lw,{children:[n.jsx(Ae,{size:20}),n.jsxs("div",{children:[n.jsx("h3",{children:"Security Warning"}),n.jsx("p",{children:"The Implicit Grant flow has security limitations and is generally not recommended for new applications. Consider using the Authorization Code flow with PKCE instead."})]})]})]})]}),n.jsxs(aw,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Interactive Demo"})}),n.jsxs(be,{children:[n.jsxs(cw,{children:[n.jsxs(dw,{className:s,children:[s==="idle"&&"Ready to start",s==="loading"&&"Running implicit flow...",s==="success"&&"Flow completed successfully",s==="error"&&"Flow failed"]}),n.jsxs(_s,{className:"primary",onClick:C,disabled:s==="loading"||!i,children:[n.jsx(mr,{}),"Start Implicit Flow"]}),n.jsx(_s,{className:"secondary",onClick:z,disabled:s==="idle",children:"Reset Demo"})]}),!i&&n.jsxs(Gp,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Configuration Required:"})," Please configure your PingOne settings in the Configuration page before running this demo."]}),k&&n.jsxs(Gp,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Error:"})," ",k]}),f&&n.jsxs("div",{children:[n.jsx("h3",{children:"Authorization URL Generated:"}),n.jsx(Kp,{children:f})]}),m&&n.jsxs("div",{children:[n.jsx("h3",{children:"Tokens Received:"}),n.jsxs(mw,{children:[n.jsx("strong",{children:"Access Token:"}),n.jsx("br",{}),m.access_token,n.jsx("br",{}),n.jsx("br",{}),n.jsx("strong",{children:"ID Token:"}),n.jsx("br",{}),m.id_token,n.jsx("br",{}),n.jsx("br",{}),n.jsx("strong",{children:"Token Type:"})," ",m.token_type,n.jsx("br",{}),n.jsx("strong",{children:"Expires In:"})," ",m.expires_in," seconds",n.jsx("br",{}),n.jsx("strong",{children:"Scope:"})," ",m.scope]})]}),n.jsxs(uw,{children:[n.jsx("h3",{children:"Flow Steps"}),O.map((D,A)=>n.jsxs(fw,{$active:u===A&&s==="loading",$completed:u>A,$error:u===A&&s==="error",children:[n.jsx(pw,{$active:u===A&&s==="loading",$completed:u>A,$error:u===A&&s==="error",children:A+1}),n.jsxs(hw,{children:[n.jsx("h3",{children:D.title}),n.jsx("p",{children:D.description}),n.jsx(Kp,{children:D.code})]})]},A))]}),n.jsxs("div",{style:{display:"flex",gap:"0.75rem",marginTop:"0.5rem"},children:[n.jsx(_s,{className:"secondary",onClick:()=>h(D=>Math.max(0,D-1)),disabled:s!=="loading"||u===0,children:"Previous"}),n.jsx(_s,{className:"primary",onClick:()=>h(D=>Math.min(O.length-1,D+1)),disabled:s!=="loading"||u>=O.length-1,children:"Next"})]})]})]})]})},yw=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,xw=x.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`,vw=x(Re)`
  margin-bottom: 2rem;
`,ww=x.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({theme:t})=>t.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`,kw=x.div`
  background-color: ${({theme:t})=>t.colors.success}10;
  border: 1px solid ${({theme:t})=>t.colors.success}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({theme:t})=>t.colors.success};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({theme:t})=>t.colors.success};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({theme:t})=>t.colors.success};
    font-size: 0.9rem;
  }
`,jw=x(Re)`
  margin-bottom: 2rem;
`,Sw=x.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
`,Qo=x.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: ${({theme:t})=>t.colors.primary};
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: ${({theme:t})=>t.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({theme:t})=>t.colors.primary};
    border: 1px solid ${({theme:t})=>t.colors.primary};

    &:hover {
      background-color: ${({theme:t})=>t.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`,bw=x.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &.idle {
    background-color: ${({theme:t})=>t.colors.gray100};
    color: ${({theme:t})=>t.colors.gray700};
  }

  &.loading {
    background-color: ${({theme:t})=>t.colors.info}20;
    color: ${({theme:t})=>t.colors.info};
  }

  &.success {
    background-color: ${({theme:t})=>t.colors.success}20;
    color: ${({theme:t})=>t.colors.success};
  }

  &.error {
    background-color: ${({theme:t})=>t.colors.danger}20;
    color: ${({theme:t})=>t.colors.danger};
  }
`,Cw=x.div`
  margin-top: 2rem;
`,Iw=x.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({$active:t,$completed:i,$error:s})=>s?"rgba(239, 68, 68, 0.1)":i?"rgba(34, 197, 94, 0.1)":t?"rgba(59, 130, 246, 0.1)":"transparent"};
  border: 2px solid ${({$active:t,$completed:i,$error:s})=>s?"#ef4444":i?"#22c55e":t?"#3b82f6":"transparent"};
`,_w=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;

  ${({$active:t,$completed:i,$error:s})=>s?`
        background-color: #ef4444;
        color: white;
      `:i?`
        background-color: #22c55e;
        color: white;
      `:t?`
        background-color: #3b82f6;
        color: white;
      `:`
      background-color: #e5e7eb;
      color: #6b7280;
    `}
`,Ew=x.div`
  flex: 1;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
  }

  p {
    margin: 0 0 1rem 0;
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.5;
  }
`,$w=x.pre`
  background-color: ${({theme:t})=>t.colors.gray900};
  color: ${({theme:t})=>t.colors.gray100};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid ${({theme:t})=>t.colors.gray800};
`,Tw=x.div`
  background-color: ${({theme:t})=>t.colors.gray100};
  border: 1px solid ${({theme:t})=>t.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  color: ${({theme:t})=>t.colors.gray800};
`,qp=x.div`
  background-color: ${({theme:t})=>t.colors.danger}10;
  border: 1px solid ${({theme:t})=>t.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({theme:t})=>t.colors.danger};
  font-size: 0.9rem;
`,zw=x.div`
  background-color: ${({theme:t})=>t.colors.gray100};
  border: 1px solid ${({theme:t})=>t.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({theme:t})=>t.colors.gray900};
    font-size: 1rem;
  }

  .request {
    background-color: ${({theme:t})=>t.colors.gray100};
    padding: 0.5rem;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
    font-family: monospace;
    font-size: 0.8rem;
    color: ${({theme:t})=>t.colors.gray800};
  }

  .response {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.8rem;
    color: #166534;
  }
`,Pw=()=>{const{config:t}=Hr(),[i,s]=S.useState("idle"),[c,u]=S.useState(0),[h,f]=S.useState(null),[v,m]=S.useState(null),[g,k]=S.useState(null),[w,b]=S.useState(!1),R=async()=>{s("loading"),b(!0),m(null),f(null),k(null);try{u(1);const C=btoa(`${t.clientId}:${t.clientSecret}`);u(2);const z={method:"POST",url:`${t.apiUrl}/token`,headers:{Authorization:`Basic ${C}`,"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials&scope=api:read"};k(z),u(3),setTimeout(()=>{f({access_token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJzY29wZSI6ImFwaTpyZWFkIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNzUwMjJ9.machine_access_token_signature",token_type:"Bearer",expires_in:3600,scope:"api:read"}),u(4),s("success")},2e3)}catch(C){console.error("Client credentials flow failed:",C),m("Failed to execute client credentials flow. Please check your configuration."),s("error"),b(!1)}},L=async()=>{if(h!=null&&h.access_token)try{u(5);const C={method:"GET",url:"https://api.example.com/data",headers:{Authorization:`Bearer ${h.access_token}`,"Content-Type":"application/json"}};k(C),setTimeout(()=>{const z={status:200,data:{message:"Successfully accessed protected resource",timestamp:new Date().toISOString(),scope:h.scope}};k({...C,response:z}),u(6)},1500)}catch(C){console.error("API call failed:",C),m("Failed to make authenticated API call."),s("error")}},M=()=>{s("idle"),u(0),f(null),m(null),k(null)},E=[{title:"Prepare Client Credentials",description:"Server prepares client credentials for authentication",code:`// Base64 encode client credentials
const credentials = btoa(clientId + ':' + clientSecret);

// Example:
const credentials = btoa('${(t==null?void 0:t.clientId)||"your_client_id"}:${(t==null?void 0:t.clientSecret)||"your_client_secret"}');
// Result: ${t?btoa(`${t.clientId}:${t.clientSecret}`).substring(0,20)+"...":"Base64_encoded_credentials"}`},{title:"Request Access Token",description:"Server requests access token using client credentials",code:`// POST request to token endpoint
POST ${(t==null?void 0:t.apiUrl)||"https://auth.pingone.com"}/token
Authorization: Basic ${t?btoa(`${t.clientId}:${t.clientSecret}`).substring(0,20)+"...":"Base64_encoded_credentials"}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=api:read`},{title:"Authorization Server Validates Credentials",description:"Server validates client ID and secret",code:`// Server-side validation
const authHeader = request.headers.authorization;
const [type, credentials] = authHeader.split(' ');

if (type !== 'Basic') {
  return { error: 'invalid_request' };
}

const decoded = atob(credentials);
const [clientId, clientSecret] = decoded.split(':');

// Validate against stored credentials
if (clientId !== storedClientId || clientSecret !== storedClientSecret) {
  return { error: 'invalid_client' };
}

// Generate access token
const accessToken = generateAccessToken(clientId, scope);`},{title:"Receive Access Token",description:"Server receives access token for API calls",code:`{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:read"
}

// Token contains:
// - sub: client_id (for client credentials)
// - scope: granted permissions
// - iat: issued at time
// - exp: expiration time`},{title:"Make Authenticated API Calls",description:"Use access token to authenticate API requests",code:`// Include Bearer token in Authorization header
const headers = {
  'Authorization': 'Bearer ' + accessToken,
  'Content-Type': 'application/json'
};

fetch('/api/protected-resource', {
  method: 'GET',
  headers: headers
})
.then(response => response.json())
.then(data => {
  console.log('API Response:', data);
});`},{title:"Handle API Response",description:"Process the response from the protected resource",code:`// Successful response
{
  "data": "Protected resource content",
  "timestamp": "${new Date().toISOString()}",
  "scope": "api:read",
  "client_id": "${(t==null?void 0:t.clientId)||"your_client_id"}"
}

// Error response (if token invalid)
{
  "error": "invalid_token",
  "error_description": "The access token expired"
}`}];return n.jsxs(yw,{children:[n.jsxs(xw,{children:[n.jsxs("h1",{children:[n.jsx(n1,{}),"Client Credentials Flow"]}),n.jsx("p",{children:"Learn how the Client Credentials flow works for machine-to-machine authentication with real API calls to PingOne."})]}),n.jsxs(vw,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Flow Overview"})}),n.jsxs(be,{children:[n.jsxs(ww,{children:[n.jsx("h2",{children:"What is Client Credentials?"}),n.jsx("p",{children:"The Client Credentials flow is used for machine-to-machine authentication where there is no user interaction. The client application directly requests an access token using its client credentials (ID and secret)."}),n.jsxs("p",{children:[n.jsx("strong",{children:"How it works:"})," The client sends its credentials to the authorization server's token endpoint and receives an access token that can be used to authenticate API requests."]})]}),n.jsxs(kw,{children:[n.jsx(Jr,{size:20}),n.jsxs("div",{children:[n.jsx("h3",{children:"Perfect For"}),n.jsx("p",{children:"Server-to-server communication, background processes, automated API calls, and any scenario where user interaction isn't needed."})]})]})]})]}),n.jsxs(jw,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Interactive Demo"})}),n.jsxs(be,{children:[n.jsxs(Sw,{children:[n.jsxs(bw,{className:i,children:[i==="idle"&&"Ready to start",i==="loading"&&"Executing client credentials flow...",i==="success"&&"Flow completed successfully",i==="error"&&"Flow failed"]}),n.jsx(Qo,{className:"primary",onClick:R,disabled:i==="loading"||!t||w,children:w?n.jsxs(n.Fragment,{children:[n.jsx(ro,{size:16}),"Running Flow..."]}):n.jsxs(n.Fragment,{children:[n.jsx(mr,{}),"Start Client Credentials Flow"]})}),h&&n.jsxs(Qo,{className:"primary",onClick:L,disabled:c<4,children:[n.jsx(lo,{}),"Test API Call"]}),n.jsx(Qo,{className:"secondary",onClick:M,disabled:i==="idle",children:"Reset Demo"})]}),!t&&n.jsxs(qp,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Configuration Required:"})," Please configure your PingOne settings in the Configuration page before running this demo."]}),v&&n.jsxs(qp,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Error:"})," ",v]}),h&&n.jsxs("div",{children:[n.jsx("h3",{children:"Access Token Received:"}),n.jsxs(Tw,{children:[n.jsx("strong",{children:"Access Token:"}),n.jsx("br",{}),h.access_token,n.jsx("br",{}),n.jsx("br",{}),n.jsx("strong",{children:"Token Type:"})," ",h.token_type,n.jsx("br",{}),n.jsx("strong",{children:"Expires In:"})," ",h.expires_in," seconds",n.jsx("br",{}),n.jsx("strong",{children:"Scope:"})," ",h.scope]})]}),g&&n.jsxs(zw,{children:[n.jsx("h4",{children:"API Call Details:"}),n.jsxs("div",{className:"request",children:[n.jsx("strong",{children:g.method})," ",g.url,n.jsx("br",{}),Object.entries(g.headers).map(([C,z])=>n.jsxs("div",{children:[C,": ",C==="Authorization"?z.substring(0,20)+"...":z]},C)),g.body&&n.jsxs("div",{children:[n.jsx("br",{}),g.body]})]}),g.response&&n.jsxs("div",{className:"response",children:["Status: ",g.response.status,n.jsx("br",{}),JSON.stringify(g.response.data,null,2)]})]}),n.jsxs(Cw,{children:[n.jsx("h3",{children:"Flow Steps"}),E.map((C,z)=>n.jsxs(Iw,{$active:c===z&&i==="loading",$completed:c>z,$error:c===z&&i==="error",children:[n.jsx(_w,{$active:c===z&&i==="loading",$completed:c>z,$error:c===z&&i==="error",children:z+1}),n.jsxs(Ew,{children:[n.jsx("h3",{children:C.title}),n.jsx("p",{children:C.description}),n.jsx($w,{children:C.code})]})]},z))]}),n.jsxs("div",{style:{display:"flex",gap:"0.75rem",marginTop:"0.5rem"},children:[n.jsx(Qo,{className:"secondary",onClick:()=>u(C=>Math.max(0,C-1)),disabled:i!=="loading"||c===0,children:"Previous"}),n.jsx(Qo,{className:"primary",onClick:()=>u(C=>Math.min(E.length-1,C+1)),disabled:i!=="loading"||c>=E.length-1,children:"Next"})]})]})]})]})},Aw=({text:t,speed:i=10,instant:s=!1,className:c})=>{const[u,h]=S.useState(s?t:"");return S.useEffect(()=>{if(s){h(t);return}h("");let f=0;const v=setInterval(()=>{f++,h(t.slice(0,f)),f>=t.length&&clearInterval(v)},i);return()=>clearInterval(v)},[t,i,s]),n.jsx("pre",{className:c,style:{whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0},children:u})},Rw=x.span`
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
`,Hn=x.span`
  ${({type:t})=>{switch(t){case"base":return`
          color: #1e40af; /* Blue for base URL */
          font-weight: 500;
        `;case"query":return`
          color: #dc2626; /* Red for ? and query parts */
          font-weight: 600;
        `;case"param":return`
          color: #059669; /* Green for parameter names */
          font-weight: 500;
        `;case"value":return`
          color: #7c3aed; /* Purple for parameter values */
          font-weight: 400;
        `;default:return""}}}
`,Am=({url:t,className:i})=>{if(!t||typeof t!="string")return n.jsx("span",{className:i,children:t});const[s,c]=t.split("?"),u=[];return s&&u.push(n.jsx(Hn,{type:"base",children:s},"base")),c&&(u.push(n.jsx(Hn,{type:"query",children:"?"},"question-mark")),c.split("&").forEach((f,v)=>{v>0&&u.push(n.jsx(Hn,{type:"query",children:"&"},`amp-${v}`));const[m,g]=f.split("=");m&&u.push(n.jsx(Hn,{type:"param",children:m},`key-${v}`)),g&&(u.push(n.jsx(Hn,{type:"query",children:"="},`equals-${v}`)),u.push(n.jsx(Hn,{type:"value",children:g},`value-${v}`)))})),n.jsx(Rw,{className:i,children:u})},Ow=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,Nw=x.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`,Dw=x(Re)`
  margin-bottom: 2rem;
`,Lw=x.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({theme:t})=>t.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`,Uw=x.div`
  background-color: ${({theme:t})=>t.colors.success}10;
  border: 1px solid ${({theme:t})=>t.colors.success}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({theme:t})=>t.colors.success};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({theme:t})=>t.colors.success};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({theme:t})=>t.colors.success};
    font-size: 0.9rem;
  }
`,Mw=x(Re)`
  margin-bottom: 2rem;
`,Fw=x.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
`,Xo=x.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: ${({theme:t})=>t.colors.primary};
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: ${({theme:t})=>t.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({theme:t})=>t.colors.primary};
    border: 1px solid ${({theme:t})=>t.colors.primary};

    &:hover {
      background-color: ${({theme:t})=>t.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`,Ww=x.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &.idle {
    background-color: ${({theme:t})=>t.colors.gray100};
    color: ${({theme:t})=>t.colors.gray700};
  }

  &.loading {
    background-color: ${({theme:t})=>t.colors.info}20;
    color: ${({theme:t})=>t.colors.info};
  }

  &.success {
    background-color: ${({theme:t})=>t.colors.success}20;
    color: ${({theme:t})=>t.colors.success};
  }

  &.error {
    background-color: ${({theme:t})=>t.colors.danger}20;
    color: ${({theme:t})=>t.colors.danger};
  }
`,Bw=x.div`
  margin-top: 2rem;
`,Jw=x.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({$active:t,$completed:i,$error:s})=>s?"rgba(239, 68, 68, 0.1)":i?"rgba(34, 197, 94, 0.1)":t?"rgba(59, 130, 246, 0.1)":"transparent"};
  border: 2px solid ${({$active:t,$completed:i,$error:s})=>s?"#ef4444":i?"#22c55e":t?"#3b82f6":"transparent"};
`,Hw=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;

  ${({$active:t,$completed:i,$error:s})=>s?`
        background-color: #ef4444;
        color: white;
      `:i?`
        background-color: #22c55e;
        color: white;
      `:t?`
        background-color: #3b82f6;
        color: white;
      `:`
      background-color: #e5e7eb;
      color: #6b7280;
    `}
`,Vw=x.div`
  flex: 1;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
  }

  p {
    margin: 0 0 1rem 0;
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.5;
  }
`,Kw=x.div`
  background-color: ${({theme:t})=>t.colors.gray100};
  border: 1px solid ${({theme:t})=>t.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  color: ${({theme:t})=>t.colors.gray800};
`,Gw=x.div`
  background-color: ${({theme:t})=>t.colors.info}10;
  border: 1px solid ${({theme:t})=>t.colors.info}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({theme:t})=>t.colors.info};
    font-size: 1rem;
    font-weight: 600;
  }

  .pkce-values {
    font-family: monospace;
    font-size: 0.8rem;
    color: ${({theme:t})=>t.colors.gray800};
    line-height: 1.4;
  }
`,Yp=x.div`
  background-color: ${({theme:t})=>t.colors.danger}10;
  border: 1px solid ${({theme:t})=>t.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({theme:t})=>t.colors.danger};
  font-size: 0.9rem;
`,qw=()=>{const t=new Uint8Array(32);return crypto.getRandomValues(t),Array.from(t,i=>i.toString(16).padStart(2,"0")).join("")},Yw=async t=>{const s=new TextEncoder().encode(t),c=await crypto.subtle.digest("SHA-256",s),u=new Uint8Array(c);return btoa(String.fromCharCode(...u)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")},Qw=()=>{var F,N,B,ee;const{config:t}=Hr(),[i,s]=S.useState("idle"),[c,u]=S.useState(0),[h,f]=S.useState(null),[v,m]=S.useState(null),[g,k]=S.useState(!1),[w,b]=S.useState(null),[R,L]=S.useState(""),[M,E]=S.useState(!1),C=async()=>{s("loading"),k(!0),u(0),m(null),f(null),b(null),L(""),E(!1);try{const Y=qw(),le=await Yw(Y);b({codeVerifier:Y,codeChallenge:le,codeChallengeMethod:"S256"}),u(1)}catch(Y){console.error("PKCE flow init failed:",Y),m("Failed to initialize PKCE flow."),s("error"),k(!1)}},z=()=>{t&&u(Y=>{if(Y===1&&w){const oe=new URLSearchParams({response_type:"code",client_id:t.clientId,redirect_uri:t.redirectUri,scope:"openid profile email",code_challenge:w.codeChallenge,code_challenge_method:"S256",state:Math.random().toString(36).substring(2,15),nonce:Math.random().toString(36).substring(2,15)}),G=`${t.apiUrl}/authorize?${oe.toString()}`;return L(G),2}if(Y===2)return 3;if(Y===3)return 4;if(Y===4)return f({access_token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.pkce_validated_token_signature",id_token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.pkce_validated_id_token_signature",token_type:"Bearer",expires_in:3600,scope:"openid profile email"}),s("success"),k(!1),5;const le=Math.min(Y+1,A.length-1);return le===A.length-1&&(s("success"),k(!1)),le})},O=()=>{c<=0||u(Y=>Math.max(0,Y-1))},D=()=>{s("idle"),u(0),f(null),m(null),b(null),L(""),E(!1)},A=[{title:"Generate Code Verifier & Challenge",description:"Create a cryptographically secure code verifier and derive the code challenge",code:`// Generate 32-byte random string
const codeVerifier = generateCodeVerifier();
// Result: ${w!=null&&w.codeVerifier?w.codeVerifier.substring(0,32)+"...":"random_32_byte_string"}

// Derive code challenge using SHA-256
const codeChallenge = await generateCodeChallenge(codeVerifier);
// Result: ${w!=null&&w.codeChallenge?w.codeChallenge.substring(0,20)+"...":"SHA256_hash_base64url"}

// Method: S256 (SHA-256)`},{title:"Build Authorization URL",description:"Include code challenge in the authorization request",code:`// Authorization URL with PKCE parameters
const authUrl = '${(t==null?void 0:t.apiUrl)||"https://auth.pingone.com"}/authorize?' +
  new URLSearchParams({
    response_type: 'code',
    client_id: '${(t==null?void 0:t.clientId)||"your_client_id"}',
    redirect_uri: '${(t==null?void 0:t.redirectUri)||"https://yourapp.com/callback"}',
    scope: 'openid profile email',
    code_challenge: '${(w==null?void 0:w.codeChallenge)||"derived_challenge"}',
    code_challenge_method: 'S256',
    state: 'random_state_value',
    nonce: 'random_nonce_value'
  }).toString();`},{title:"User Authentication",description:"User is redirected to PingOne for authentication and consent",code:`// User authenticates and authorizes
// PingOne stores code_challenge for later validation
// User is redirected back with authorization code

// Callback URL:
https://yourapp.com/callback?code=auth_code_123&state=xyz789`},{title:"Receive Authorization Code",description:"Application receives authorization code from PingOne",code:`// Extract code from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const authorizationCode = urlParams.get('code');
const state = urlParams.get('state');

// Validate state parameter for CSRF protection
if (state !== storedState) {
  throw new Error('State parameter mismatch');
}

console.log('Authorization Code:', authorizationCode);`},{title:"Exchange Code for Tokens (with PKCE)",description:"Send authorization code and code verifier to token endpoint",code:`// POST to token endpoint with PKCE validation
POST ${(t==null?void 0:t.apiUrl)||"https://auth.pingone.com"}/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=auth_code_123
&code_verifier=${(w==null?void 0:w.codeVerifier)||"original_code_verifier"}
&redirect_uri=https://yourapp.com/callback
&client_id=${(t==null?void 0:t.clientId)||"your_client_id"}`},{title:"Server Validates PKCE & Returns Tokens",description:"Authorization server validates code verifier matches stored challenge",code:`// Server-side PKCE validation
const storedChallenge = getStoredCodeChallenge(code);
const computedChallenge = SHA256(codeVerifier);

// Validate: computedChallenge === storedChallenge
if (computedChallenge !== storedChallenge) {
  return { error: 'invalid_grant', error_description: 'PKCE validation failed' };
}

// Generate and return tokens
const tokens = {
  access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  id_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  token_type: "Bearer",
  expires_in: 3600,
  scope: "openid profile email"
};

return tokens;`}];return n.jsxs(Ow,{children:[n.jsxs(Nw,{children:[n.jsxs("h1",{children:[n.jsx(Zt,{}),"PKCE Flow"]}),n.jsx("p",{children:"Learn how Proof Key for Code Exchange (PKCE) enhances the Authorization Code flow with real API calls to PingOne."})]}),n.jsxs(Dw,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Flow Overview"})}),n.jsxs(be,{children:[n.jsxs(Lw,{children:[n.jsx("h2",{children:"What is PKCE?"}),n.jsx("p",{children:"Proof Key for Code Exchange (PKCE) is an extension to the Authorization Code flow that prevents authorization code interception attacks. It uses a cryptographically random code verifier that is sent with the authorization request and validated during token exchange."}),n.jsxs("p",{children:[n.jsx("strong",{children:"How it works:"})," The client generates a code verifier, derives a code challenge from it, sends the challenge with the authorization request, and proves ownership by sending the original verifier during token exchange."]})]}),n.jsxs(Uw,{children:[n.jsx(Zt,{size:20}),n.jsxs("div",{children:[n.jsx("h3",{children:"Enhanced Security"}),n.jsx("p",{children:"PKCE prevents authorization code interception attacks by ensuring only the legitimate client can exchange the authorization code for tokens."})]})]})]})]}),n.jsxs(Mw,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Interactive Demo"})}),n.jsxs(be,{children:[n.jsxs(Fw,{children:[n.jsxs(Ww,{className:i,children:[i==="idle"&&"Ready to start",i==="loading"&&"Executing PKCE flow...",i==="success"&&"Flow completed successfully",i==="error"&&"Flow failed"]}),n.jsx(Xo,{className:"primary",onClick:C,disabled:i==="loading"||!t||g,children:g?n.jsxs(n.Fragment,{children:[n.jsx(ro,{size:16}),"Running Flow..."]}):n.jsxs(n.Fragment,{children:[n.jsx(mr,{}),"Start PKCE Flow"]})}),n.jsx(Xo,{className:"secondary",onClick:D,disabled:i==="idle",children:"Reset Demo"})]}),!t&&n.jsxs(Yp,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Configuration Required:"})," Please configure your PingOne settings in the Configuration page before running this demo."]}),v&&n.jsxs(Yp,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Error:"})," ",v]}),w&&n.jsxs(Gw,{children:[n.jsx("h4",{children:"PKCE Values Generated:"}),n.jsxs("div",{className:"pkce-values",children:[n.jsx("strong",{children:"Code Verifier:"}),n.jsx("br",{}),w.codeVerifier,n.jsx("br",{}),n.jsx("br",{}),n.jsx("strong",{children:"Code Challenge:"}),n.jsx("br",{}),w.codeChallenge,n.jsx("br",{}),n.jsx("br",{}),n.jsx("strong",{children:"Method:"})," ",w.codeChallengeMethod]})]}),R&&n.jsxs("div",{children:[n.jsx("h3",{children:"Authorization URL:"}),n.jsx(Am,{url:R})]}),h&&n.jsxs("div",{children:[n.jsx("h3",{children:"Tokens Received:"}),n.jsx("div",{style:{display:"flex",gap:"0.75rem",alignItems:"center",margin:"0.5rem 0"},children:n.jsx(Xo,{className:"secondary",onClick:()=>E(Y=>!Y),children:M?"Hide full tokens":"Reveal full tokens (secure-by-default)"})}),n.jsxs(Kw,{children:[n.jsx("strong",{children:"Access Token:"}),n.jsx("br",{}),M?h.access_token:`${(F=h.access_token)==null?void 0:F.slice(0,12)}…${(N=h.access_token)==null?void 0:N.slice(-12)}`,n.jsx("br",{}),n.jsx("br",{}),n.jsx("strong",{children:"ID Token:"}),n.jsx("br",{}),M?h.id_token:`${(B=h.id_token)==null?void 0:B.slice(0,12)}…${(ee=h.id_token)==null?void 0:ee.slice(-12)}`,n.jsx("br",{}),n.jsx("br",{}),n.jsx("strong",{children:"Token Type:"})," ",h.token_type,n.jsx("br",{}),n.jsx("strong",{children:"Expires In:"})," ",h.expires_in," seconds",n.jsx("br",{}),n.jsx("strong",{children:"Scope:"})," ",h.scope]})]}),n.jsxs(Bw,{children:[n.jsx("h3",{children:"Flow Steps"}),A.map((Y,le)=>n.jsxs(Jw,{$active:c===le&&i==="loading",$completed:c>le,$error:c===le&&i==="error",children:[n.jsx(Hw,{$active:c===le&&i==="loading",$completed:c>le,$error:c===le&&i==="error",children:le+1}),n.jsxs(Vw,{children:[n.jsx("h3",{children:Y.title}),n.jsx("p",{children:Y.description}),n.jsx(Aw,{text:Y.code,speed:8})]})]},le))]}),n.jsxs("div",{style:{display:"flex",gap:"0.75rem",marginTop:"0.5rem"},children:[n.jsx(Xo,{className:"secondary",onClick:O,disabled:i!=="loading"||c===0,children:"Previous"}),n.jsx(Xo,{className:"primary",onClick:z,disabled:i!=="loading"||c>=A.length-1,children:"Next"})]})]})]})]})},Xw=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,Zw=x.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`,ek=x(Re)`
  margin-bottom: 2rem;
`,tk=x.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({theme:t})=>t.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`,rk=x.div`
  background-color: ${({theme:t})=>t.colors.info}10;
  border: 1px solid ${({theme:t})=>t.colors.info}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({theme:t})=>t.colors.info};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({theme:t})=>t.colors.info};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({theme:t})=>t.colors.info};
    font-size: 0.9rem;
  }
`,nk=x(Re)`
  margin-bottom: 2rem;
`,ok=x.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
`,Es=x.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: ${({theme:t})=>t.colors.primary};
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: ${({theme:t})=>t.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({theme:t})=>t.colors.primary};
    border: 1px solid ${({theme:t})=>t.colors.primary};

    &:hover {
      background-color: ${({theme:t})=>t.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`,ik=x.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &.idle {
    background-color: ${({theme:t})=>t.colors.gray100};
    color: ${({theme:t})=>t.colors.gray700};
  }

  &.loading {
    background-color: ${({theme:t})=>t.colors.info}20;
    color: ${({theme:t})=>t.colors.info};
  }

  &.success {
    background-color: ${({theme:t})=>t.colors.success}20;
    color: ${({theme:t})=>t.colors.success};
  }

  &.error {
    background-color: ${({theme:t})=>t.colors.danger}20;
    color: ${({theme:t})=>t.colors.danger};
  }
`,sk=x.div`
  margin-top: 2rem;
`,lk=x.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({$active:t,$completed:i,$error:s})=>s?"rgba(239, 68, 68, 0.1)":i?"rgba(34, 197, 94, 0.1)":t?"rgba(59, 130, 246, 0.1)":"transparent"};
  border: 2px solid ${({$active:t,$completed:i,$error:s})=>s?"#ef4444":i?"#22c55e":t?"#3b82f6":"transparent"};
`,ak=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;

  ${({$active:t,$completed:i,$error:s})=>s?`
        background-color: #ef4444;
        color: white;
      `:i?`
        background-color: #22c55e;
        color: white;
      `:t?`
        background-color: #3b82f6;
        color: white;
      `:`
      background-color: #e5e7eb;
      color: #6b7280;
    `}
`,ck=x.div`
  flex: 1;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
  }

  p {
    margin: 0 0 1rem 0;
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.5;
  }
`,dk=x.pre`
  background-color: ${({theme:t})=>t.colors.gray900};
  color: ${({theme:t})=>t.colors.gray100};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid ${({theme:t})=>t.colors.gray800};
`,uk=x.div`
  background-color: ${({theme:t})=>t.colors.gray100};
  border: 1px solid ${({theme:t})=>t.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  color: ${({theme:t})=>t.colors.gray800};
`,fk=x.div`
  background-color: ${({theme:t})=>t.colors.warning}10;
  border: 1px solid ${({theme:t})=>t.colors.warning}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({theme:t})=>t.colors.warning};
    font-size: 1rem;
    font-weight: 600;
  }

  .device-codes {
    font-family: monospace;
    font-size: 1.2rem;
    font-weight: bold;
    color: ${({theme:t})=>t.colors.warning};
    text-align: center;
    padding: 1rem;
    background-color: white;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .verification-url {
    font-family: monospace;
    font-size: 0.9rem;
    color: ${({theme:t})=>t.colors.gray700};
    word-break: break-all;
  }
`,Qp=x.div`
  background-color: ${({theme:t})=>t.colors.danger}10;
  border: 1px solid ${({theme:t})=>t.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({theme:t})=>t.colors.danger};
  font-size: 0.9rem;
`,pk=()=>{const{config:t}=Hr(),[i,s]=S.useState("idle"),[c,u]=S.useState(0),[h,f]=S.useState(null),[v,m]=S.useState(null),[g,k]=S.useState(null),[w,b]=S.useState(!1),[R,L]=S.useState(null),M=async()=>{s("loading"),b(!0),u(0),m(null),f(null),k(null);try{u(1);const z={method:"POST",url:`${t.apiUrl}/device_authorization`,headers:{"Content-Type":"application/x-www-form-urlencoded"},body:`client_id=${t.clientId}&scope=openid profile email`};u(2),setTimeout(()=>{k({device_code:"GmRhmhcxhwAzkoEqiMEg_DnyE-oqGpZC9yIwBhLJrRgI",user_code:"WDJB-MJHT",verification_uri:"https://pingone.com/device",verification_uri_complete:"https://pingone.com/device?user_code=WDJB-MJHT",expires_in:1800,interval:5}),u(3),u(4);let D=0;const A=setInterval(()=>{D++,D>=3&&(clearInterval(A),L(null),u(5),f({access_token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.device_flow_token_signature",id_token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.device_flow_id_token_signature",token_type:"Bearer",expires_in:3600,scope:"openid profile email"}),u(6),s("success"))},3e3);L(A)},2e3)}catch(z){console.error("Device code flow failed:",z),m("Failed to execute device code flow. Please check your configuration."),s("error"),b(!1),R&&(clearInterval(R),L(null))}},E=()=>{s("idle"),u(0),f(null),m(null),k(null),R&&(clearInterval(R),L(null))},C=[{title:"Device Initiates Flow",description:"Device requests device and user codes from authorization server",code:`// POST to device authorization endpoint
POST ${(t==null?void 0:t.apiUrl)||"https://auth.pingone.com"}/device_authorization
Content-Type: application/x-www-form-urlencoded

client_id=${(t==null?void 0:t.clientId)||"your_client_id"}&scope=openid profile email

// Device sends minimal information:
// - client_id: identifies the device/app
// - scope: requested permissions`},{title:"Server Generates Device & User Codes",description:"Authorization server creates unique codes for device and user authentication",code:`// Server generates and stores device codes
const deviceCode = generateSecureRandomString();
const userCode = generateUserFriendlyCode(); // e.g., "WDJB-MJHT"

// Server response:
{
  "device_code": "${(g==null?void 0:g.device_code)||"GmRhmhcxhwAzkoEqiMEg_DnyE-oqGpZC9yIwBhLJrRgI"}",
  "user_code": "${(g==null?void 0:g.user_code)||"WDJB-MJHT"}",
  "verification_uri": "https://pingone.com/device",
  "verification_uri_complete": "https://pingone.com/device?user_code=${(g==null?void 0:g.user_code)||"WDJB-MJHT"}",
  "expires_in": 1800,
  "interval": 5
}`},{title:"Device Displays User Code",description:"Device shows user-friendly code and verification URL",code:`// Device displays to user:
console.log('Go to: ${(g==null?void 0:g.verification_uri)||"https://pingone.com/device"}');
console.log('Enter code: ${(g==null?void 0:g.user_code)||"WDJB-MJHT"}');

// Device can show:
// - Verification URL
// - User code (formatted nicely)
// - QR code (optional)
// - Instructions for user`},{title:"Device Polls for Authorization",description:"Device repeatedly polls token endpoint until user completes authentication",code:`// Device polls token endpoint
POST ${(t==null?void 0:t.apiUrl)||"https://auth.pingone.com"}/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:device_code
&device_code=${(g==null?void 0:g.device_code)||"GmRhmhcxhwAzkoEqiMEg_DnyE-oqGpZC9yIwBhLJrRgI"}
&client_id=${(t==null?void 0:t.clientId)||"your_client_id"}

// Poll every 5 seconds (interval from device authorization)
// Continue polling until:
// - User completes authentication
// - Device code expires
// - Error occurs`},{title:"User Authenticates on Separate Device",description:"User visits verification URL and enters the code on a different device",code:`// User workflow:
// 1. Visit verification_uri
// 2. Enter user_code
// 3. Authenticate with PingOne
// 4. Grant consent for requested scopes
// 5. Complete authentication

// Server associates user_code with device_code
// Marks device as authorized for token issuance`},{title:"Device Receives Tokens",description:"Once user completes authentication, device receives access tokens",code:`// Server returns tokens to device
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}

// Device can now:
// - Store tokens securely
// - Make authenticated API calls
// - Access protected resources`}];return n.jsxs(Xw,{children:[n.jsxs(Zw,{children:[n.jsxs("h1",{children:[n.jsx(e1,{}),"Device Code Flow"]}),n.jsx("p",{children:"Learn how the Device Code flow works for devices with limited input capabilities with real API calls to PingOne."})]}),n.jsxs(ek,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Flow Overview"})}),n.jsxs(be,{children:[n.jsxs(tk,{children:[n.jsx("h2",{children:"What is Device Code Flow?"}),n.jsx("p",{children:"The Device Code flow is designed for devices that have limited input capabilities (like smart TVs, gaming consoles, or IoT devices). Instead of entering credentials directly on the device, users authenticate on a separate device (like a smartphone or computer) using a user-friendly code."}),n.jsxs("p",{children:[n.jsx("strong",{children:"How it works:"})," The device requests codes from the authorization server, displays a user-friendly code to the user, who then authenticates on a different device using that code. The device polls for tokens until authentication is complete."]})]}),n.jsxs(rk,{children:[n.jsx(o1,{size:20}),n.jsxs("div",{children:[n.jsx("h3",{children:"Perfect For"}),n.jsx("p",{children:"Smart TVs, gaming consoles, IoT devices, printers, and any device without a proper keyboard or secure input method."})]})]})]})]}),n.jsxs(nk,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Interactive Demo"})}),n.jsxs(be,{children:[n.jsxs(ok,{children:[n.jsxs(ik,{className:i,children:[i==="idle"&&"Ready to start",i==="loading"&&"Executing device code flow...",i==="success"&&"Flow completed successfully",i==="error"&&"Flow failed"]}),n.jsx(Es,{className:"primary",onClick:M,disabled:i==="loading"||!t||w,children:w?n.jsxs(n.Fragment,{children:[n.jsx(ro,{size:16}),"Running Flow..."]}):n.jsxs(n.Fragment,{children:[n.jsx(mr,{}),"Start Device Code Flow"]})}),n.jsx(Es,{className:"secondary",onClick:E,disabled:i==="idle",children:"Reset Demo"})]}),!t&&n.jsxs(Qp,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Configuration Required:"})," Please configure your PingOne settings in the Configuration page before running this demo."]}),v&&n.jsxs(Qp,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Error:"})," ",v]}),g&&n.jsxs(fk,{children:[n.jsx("h4",{children:"Device Codes Generated:"}),n.jsx("div",{className:"device-codes",children:g.user_code}),n.jsxs("div",{className:"verification-url",children:["Visit: ",g.verification_uri,n.jsx("br",{}),"Complete URL: ",g.verification_uri_complete]}),n.jsxs("div",{style:{marginTop:"0.5rem",fontSize:"0.8rem",color:"#6b7280"},children:["Device Code: ",g.device_code,n.jsx("br",{}),"Expires in: ",g.expires_in," seconds",n.jsx("br",{}),"Poll interval: ",g.interval," seconds"]})]}),h&&n.jsxs("div",{children:[n.jsx("h3",{children:"Tokens Received:"}),n.jsxs(uk,{children:[n.jsx("strong",{children:"Access Token:"}),n.jsx("br",{}),h.access_token,n.jsx("br",{}),n.jsx("br",{}),n.jsx("strong",{children:"ID Token:"}),n.jsx("br",{}),h.id_token,n.jsx("br",{}),n.jsx("br",{}),n.jsx("strong",{children:"Token Type:"})," ",h.token_type,n.jsx("br",{}),n.jsx("strong",{children:"Expires In:"})," ",h.expires_in," seconds",n.jsx("br",{}),n.jsx("strong",{children:"Scope:"})," ",h.scope]})]}),n.jsxs(sk,{children:[n.jsx("h3",{children:"Flow Steps"}),C.map((z,O)=>n.jsxs(lk,{$active:c===O&&i==="loading",$completed:c>O,$error:c===O&&i==="error",children:[n.jsx(ak,{$active:c===O&&i==="loading",$completed:c>O,$error:c===O&&i==="error",children:O+1}),n.jsxs(ck,{children:[n.jsx("h3",{children:z.title}),n.jsx("p",{children:z.description}),n.jsx(dk,{children:z.code})]})]},O))]}),n.jsxs("div",{style:{display:"flex",gap:"0.75rem",marginTop:"0.5rem"},children:[n.jsx(Es,{className:"secondary",onClick:()=>u(z=>Math.max(0,z-1)),disabled:i!=="loading"||c===0,children:"Previous"}),n.jsx(Es,{className:"primary",onClick:()=>u(z=>Math.min(C.length-1,z+1)),disabled:i!=="loading"||c>=C.length-1,children:"Next"})]})]})]})]})},hk=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,mk=x.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`,gk=x(Re)`
  margin-bottom: 2rem;
`,yk=x.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({theme:t})=>t.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`,xk=x.div`
  background-color: ${({theme:t})=>t.colors.success}10;
  border: 1px solid ${({theme:t})=>t.colors.success}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({theme:t})=>t.colors.success};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({theme:t})=>t.colors.success};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({theme:t})=>t.colors.success};
    font-size: 0.9rem;
  }
`,vk=x(Re)`
  margin-bottom: 2rem;
`,wk=x.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
`,Xp=x.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: ${({theme:t})=>t.colors.primary};
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: ${({theme:t})=>t.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({theme:t})=>t.colors.primary};
    border: 1px solid ${({theme:t})=>t.colors.primary};

    &:hover {
      background-color: ${({theme:t})=>t.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`,kk=x.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &.idle {
    background-color: ${({theme:t})=>t.colors.gray100};
    color: ${({theme:t})=>t.colors.gray700};
  }

  &.loading {
    background-color: ${({theme:t})=>t.colors.info}20;
    color: ${({theme:t})=>t.colors.info};
  }

  &.success {
    background-color: ${({theme:t})=>t.colors.success}20;
    color: ${({theme:t})=>t.colors.success};
  }

  &.error {
    background-color: ${({theme:t})=>t.colors.danger}20;
    color: ${({theme:t})=>t.colors.danger};
  }
`,jk=x.div`
  margin-top: 2rem;
`,Sk=x.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({active:t,completed:i,error:s})=>s?"rgba(239, 68, 68, 0.1)":i?"rgba(34, 197, 94, 0.1)":t?"rgba(59, 130, 246, 0.1)":"transparent"};
  border: 2px solid ${({active:t,completed:i,error:s})=>s?"#ef4444":i?"#22c55e":t?"#3b82f6":"transparent"};
`,bk=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;

  ${({active:t,completed:i,error:s})=>s?`
        background-color: #ef4444;
        color: white;
      `:i?`
        background-color: #22c55e;
        color: white;
      `:t?`
        background-color: #3b82f6;
        color: white;
      `:`
      background-color: #e5e7eb;
      color: #6b7280;
    `}
`,Ck=x.div`
  flex: 1;
`,xc=x.pre`
  background-color: ${({theme:t})=>t.colors.gray50};
  border: 1px solid ${({theme:t})=>t.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`,Ik=x.div`
  background-color: ${({theme:t})=>t.colors.gray50};
  border: 1px solid ${({theme:t})=>t.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  white-space: pre-wrap;
  overflow: visible;
  max-height: none;
  height: auto;
`,Zp=x.div`
  background-color: ${({theme:t})=>t.colors.danger}10;
  border: 1px solid ${({theme:t})=>t.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({theme:t})=>t.colors.danger};
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }
`,_k=()=>{const{isAuthenticated:t}=gn(),{config:i}=Hr(),s=Jt(),[c,u]=S.useState("idle"),[h,f]=S.useState(0),[v,m]=S.useState(!1),[g,k]=S.useState(!1),[w,b]=S.useState(null),[R,L]=S.useState(null),[M,E]=S.useState(""),[C,z]=S.useState(""),O=[{title:"Client Prepares Authorization Request",description:"The client application prepares an authorization request with required parameters.",code:`GET /authorize?
  client_id=${(i==null?void 0:i.clientId)||"your-client-id"}
  &redirect_uri=${(i==null?void 0:i.redirectUri)||"https://your-app.com/callback"}
  &response_type=code
  &scope=${(i==null?void 0:i.scopes)||"openid profile email"}
  &state=xyz123
  &nonce=abc456`,url:i?`${i.authEndpoint.replace("{envId}",i.environmentId)}?client_id=${i.clientId}&redirect_uri=${encodeURIComponent(i.redirectUri)}&response_type=code&scope=${encodeURIComponent(i.scopes)}&state=xyz123&nonce=abc456`:"Configure PingOne settings to see real URL",backgroundColor:"#f0f9ff",borderColor:"#0ea5e9"},{title:"User is Redirected to Authorization Server",description:"The user is redirected to the authorization server where they authenticate and authorize the client.",code:"User authenticates and grants permission",url:i?`${i.authEndpoint.replace("{envId}",i.environmentId)}?client_id=${i.clientId}&redirect_uri=${encodeURIComponent(i.redirectUri)}&response_type=code&scope=${encodeURIComponent(i.scopes)}&state=xyz123&nonce=abc456`:"Configure PingOne settings to see real URL",backgroundColor:"#fef3c7",borderColor:"#f59e0b"},{title:"Authorization Server Redirects Back",description:"After successful authentication, the authorization server redirects back to the client with an authorization code.",code:`GET ${(i==null?void 0:i.redirectUri)||"https://your-app.com/callback"}?
  code=authorization-code-here
  &state=xyz123`,url:i?`${i.redirectUri}?code=auth-code-123&state=xyz123`:"Configure PingOne settings to see real URL",backgroundColor:"#eff6ff",borderColor:"#3b82f6"},{title:"Client Exchanges Code for Tokens",description:"The client sends the authorization code to the token endpoint to receive access and ID tokens.",code:`POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=${(i==null?void 0:i.clientId)||"your-client-id"}
&client_secret=${i!=null&&i.clientSecret?"••••••••":"your-client-secret"}
&code=authorization-code-here
&redirect_uri=${(i==null?void 0:i.redirectUri)||"https://your-app.com/callback"}`,url:i?i.tokenEndpoint.replace("{envId}",i.environmentId):"Configure PingOne settings to see real URL",backgroundColor:"#fef2f2",borderColor:"#ef4444"},{title:"Client Receives Tokens",description:"The authorization server validates the code and returns access token, ID token, and optionally refresh token.",code:`{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "refresh-token-here"
}`,url:"Tokens received in response",backgroundColor:"#f5f3ff",borderColor:"#8b5cf6"}],D=()=>{u("loading"),m(!0),f(0),L(""),E(""),z(""),b(null),A(0)},A=N=>{var B;switch(k(!1),m(!0),N){case 0:setTimeout(()=>{if(i){const ee=`${i.authEndpoint.replace("{envId}",i.environmentId)}?client_id=${i.clientId}&redirect_uri=${encodeURIComponent(i.redirectUri)}&response_type=code&scope=${encodeURIComponent(i.scopes)}&state=xyz123&nonce=abc456`;E(ee),f(1),k(!0),m(!1)}else L("OAuth configuration is missing. Please configure PingOne settings first."),m(!1)},1e3);break;case 1:setTimeout(()=>{f(2),k(!0),m(!1)},1e3);break;case 2:setTimeout(()=>{const ee="auth-code-"+Math.random().toString(36).substr(2,9);z(ee),f(3),k(!0),m(!1)},1e3);break;case 3:if(i&&C){const ee=i.tokenEndpoint.replace("{envId}",i.environmentId);fetch(ee,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"authorization_code",client_id:i.clientId,client_secret:i.clientSecret,code:C,redirect_uri:i.redirectUri})}).then(Y=>{if(!Y.ok)throw new Error(`Token exchange failed: ${Y.status} ${Y.statusText}`);return Y.json()}).then(Y=>{b(Y),f(4),k(!0),m(!1)}).catch(Y=>{console.error("Token exchange error:",Y),L(`Failed to exchange authorization code for tokens: ${Y.message}`),m(!1)})}else L("Missing configuration or authorization code"),m(!1);break;case 4:if(w!=null&&w.access_token){const ee=(B=i==null?void 0:i.userInfoEndpoint)==null?void 0:B.replace("{envId}",i.environmentId);ee?fetch(ee,{method:"GET",headers:{Authorization:`Bearer ${w.access_token}`}}).then(Y=>{if(!Y.ok)throw new Error(`UserInfo call failed: ${Y.status} ${Y.statusText}`);return Y.json()}).then(Y=>{b(le=>({...le,user_info:Y})),f(5),u("success"),m(!1)}).catch(Y=>{console.error("UserInfo call error:",Y),f(5),u("success"),m(!1),L(`Tokens received successfully, but UserInfo call failed: ${Y.message}`)}):(f(5),u("success"),m(!1))}else L("No access token available for API call"),m(!1);break}},F=()=>{u("idle"),f(0),E(""),z(""),b(null),L("")};return n.jsxs(hk,{children:[n.jsxs(mk,{children:[n.jsxs("h1",{children:[n.jsx(Jr,{}),"Authorization Code Flow"]}),n.jsx("p",{children:"The most secure and widely used OAuth 2.0 flow for web applications. Perfect for server-side applications that can securely store client secrets."})]}),n.jsxs(gk,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Flow Overview"})}),n.jsxs(be,{children:[n.jsxs(yk,{children:[n.jsx("h2",{children:"What is the Authorization Code Flow?"}),n.jsx("p",{children:"The Authorization Code flow is the most secure OAuth 2.0 flow for applications that can securely store client secrets. It's designed for web applications with a backend server that can make secure API calls."}),n.jsxs("p",{children:[n.jsx("strong",{children:"How it works:"})," Instead of returning tokens directly in the redirect, the authorization server returns a temporary authorization code. The client then exchanges this code for tokens by making a secure server-to-server request."]})]}),n.jsxs(xk,{children:[n.jsx(Jr,{size:20}),n.jsxs("div",{children:[n.jsx("h3",{children:"Why It's Secure"}),n.jsx("p",{children:"The authorization code is short-lived and can only be used once. The actual token exchange happens server-side, keeping sensitive information away from the user's browser."})]})]})]})]}),n.jsxs(vk,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Interactive Demo"})}),n.jsxs(be,{children:[n.jsxs(wk,{children:[n.jsxs(kk,{className:c,children:[c==="idle"&&"Ready to start",c==="loading"&&"Executing authorization code flow...",c==="success"&&"Flow completed successfully",c==="error"&&"Flow failed"]}),n.jsx(Xp,{className:"primary",onClick:D,disabled:c==="loading"||v,children:v?n.jsxs(n.Fragment,{children:[n.jsx(ro,{size:16}),"Running Flow..."]}):n.jsxs(n.Fragment,{children:[n.jsx(mr,{}),"Start Authorization Code Flow"]})}),n.jsx(Xp,{className:"secondary",onClick:F,disabled:c==="idle",children:"Reset Demo"})]}),!t&&n.jsxs(Zp,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Note:"})," This demo shows the flow conceptually. For a real implementation, configure your PingOne environment first."]}),R&&n.jsxs(Zp,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Error:"})," ",R]}),M&&n.jsxs("div",{children:[n.jsx("h3",{children:"Authorization URL Generated:"}),n.jsx(xc,{children:M}),n.jsx("p",{children:n.jsx("em",{children:"In a real app, the user would be redirected to this URL"})})]}),C&&n.jsxs("div",{children:[n.jsx("h3",{children:"Authorization Code Received:"}),n.jsx(xc,{children:C}),n.jsx("p",{children:n.jsx("em",{children:"This code would be exchanged for tokens server-side"})})]}),w&&n.jsxs("div",{children:[n.jsx("h3",{children:"Tokens Received:"}),n.jsxs("div",{style:{marginBottom:"1rem"},children:[n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"},children:[n.jsx("strong",{children:"Full Token Response (JSON):"}),n.jsx("button",{onClick:()=>{navigator.clipboard.writeText(w.access_token||""),alert("Access token copied to clipboard!")},style:{padding:"0.5rem 0.75rem",backgroundColor:"#3b82f6",color:"white",border:"none",borderRadius:"0.375rem",cursor:"pointer",fontSize:"0.875rem",fontWeight:"500",display:"flex",alignItems:"center",gap:"0.5rem",boxShadow:"0 1px 2px 0 rgba(0, 0, 0, 0.05)"},title:"Copy Access Token",children:"📋 Copy Token"})]}),n.jsx(Ik,{style:{fontSize:"0.85rem",lineHeight:"1.4",overflow:"visible",maxHeight:"none",height:"auto",whiteSpace:"pre-wrap",wordBreak:"break-word"},children:JSON.stringify(w,null,2)})]}),n.jsxs("div",{style:{marginTop:"1.5rem"},children:[n.jsx("h4",{style:{marginBottom:"1rem",color:"#374151"},children:"Individual Tokens:"}),n.jsxs("div",{style:{marginBottom:"1rem",padding:"1rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",backgroundColor:"#f8fafc"},children:[n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"},children:[n.jsx("strong",{style:{color:"#059669"},children:"Access Token:"}),n.jsx("button",{onClick:()=>{navigator.clipboard.writeText(w.access_token||""),alert("Access token copied to clipboard!")},style:{padding:"0.25rem 0.5rem",backgroundColor:"#059669",color:"white",border:"none",borderRadius:"0.25rem",cursor:"pointer",fontSize:"0.75rem",display:"flex",alignItems:"center",gap:"0.25rem"},title:"Copy Access Token",children:"📋 Copy"})]}),n.jsx("div",{style:{fontFamily:"monospace",fontSize:"0.85rem",backgroundColor:"white",padding:"0.5rem",borderRadius:"0.25rem",border:"1px solid #e5e7eb",wordBreak:"break-all",whiteSpace:"pre-wrap"},children:w.access_token})]}),w.id_token&&n.jsxs("div",{style:{marginBottom:"1rem",padding:"1rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",backgroundColor:"#f8fafc"},children:[n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"},children:[n.jsx("strong",{style:{color:"#7c3aed"},children:"ID Token:"}),n.jsx("button",{onClick:()=>{navigator.clipboard.writeText(w.id_token||""),alert("ID token copied to clipboard!")},style:{padding:"0.25rem 0.5rem",backgroundColor:"#7c3aed",color:"white",border:"none",borderRadius:"0.25rem",cursor:"pointer",fontSize:"0.75rem",display:"flex",alignItems:"center",gap:"0.25rem"},title:"Copy ID Token",children:"📋 Copy"})]}),n.jsx("div",{style:{fontFamily:"monospace",fontSize:"0.85rem",backgroundColor:"white",padding:"0.5rem",borderRadius:"0.25rem",border:"1px solid #e5e7eb",wordBreak:"break-all",whiteSpace:"pre-wrap"},children:w.id_token})]}),w.refresh_token&&n.jsxs("div",{style:{marginBottom:"1rem",padding:"1rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",backgroundColor:"#f8fafc"},children:[n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"},children:[n.jsx("strong",{style:{color:"#dc2626"},children:"Refresh Token:"}),n.jsx("button",{onClick:()=>{navigator.clipboard.writeText(w.refresh_token||""),alert("Refresh token copied to clipboard!")},style:{padding:"0.25rem 0.5rem",backgroundColor:"#dc2626",color:"white",border:"none",borderRadius:"0.25rem",cursor:"pointer",fontSize:"0.75rem",display:"flex",alignItems:"center",gap:"0.25rem"},title:"Copy Refresh Token",children:"📋 Copy"})]}),n.jsx("div",{style:{fontFamily:"monospace",fontSize:"0.85rem",backgroundColor:"white",padding:"0.5rem",borderRadius:"0.25rem",border:"1px solid #e5e7eb",wordBreak:"break-all",whiteSpace:"pre-wrap"},children:w.refresh_token})]}),n.jsxs("div",{style:{padding:"1rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",backgroundColor:"#f8fafc"},children:[n.jsx("h4",{style:{marginBottom:"0.5rem",color:"#374151"},children:"Token Metadata:"}),n.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:"0.5rem"},children:[n.jsxs("div",{children:[n.jsx("strong",{style:{fontSize:"0.875rem"},children:"Token Type:"}),n.jsx("div",{style:{fontFamily:"monospace",fontSize:"0.85rem",marginTop:"0.25rem"},children:w.token_type})]}),n.jsxs("div",{children:[n.jsx("strong",{style:{fontSize:"0.875rem"},children:"Expires In:"}),n.jsxs("div",{style:{fontFamily:"monospace",fontSize:"0.85rem",marginTop:"0.25rem"},children:[w.expires_in," seconds"]})]})]})]})]}),n.jsxs("div",{style:{marginTop:"1rem",display:"flex",gap:"1rem"},children:[n.jsxs("button",{onClick:()=>s("/token-management"),style:{padding:"0.5rem 1rem",backgroundColor:"#3b82f6",color:"white",border:"none",borderRadius:"0.375rem",cursor:"pointer",fontSize:"0.875rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[n.jsx(mn,{size:16}),"View Token Management"]}),w.id_token&&n.jsxs("button",{onClick:()=>s("/token-management"),style:{padding:"0.5rem 1rem",backgroundColor:"#059669",color:"white",border:"none",borderRadius:"0.375rem",cursor:"pointer",fontSize:"0.875rem",display:"flex",alignItems:"center",gap:"0.5rem"},children:[n.jsx(mn,{size:16}),"View ID Token in Management"]})]})]}),n.jsxs(jk,{children:[n.jsx("h3",{children:"Flow Steps"}),O.map((N,B)=>n.jsxs(Sk,{active:h===B&&c==="loading",completed:h>B,error:h===B&&c==="error",style:{backgroundColor:N.backgroundColor,borderColor:N.borderColor,border:`2px solid ${N.borderColor}`},children:[n.jsx(bk,{active:h===B&&c==="loading",completed:h>B,error:h===B&&c==="error",children:B+1}),n.jsxs(Ck,{children:[n.jsx("h3",{children:N.title}),n.jsx("p",{children:N.description}),n.jsxs("div",{style:{marginTop:"1rem"},children:[n.jsx("strong",{children:"URL:"}),n.jsxs("div",{style:{backgroundColor:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"0.375rem",padding:"0.5rem",fontSize:"0.875rem",fontFamily:"monospace",wordBreak:"break-all",whiteSpace:"pre-wrap",overflow:"visible",textOverflow:"clip",marginTop:"0.5rem",maxWidth:"none",width:"100%"},children:[n.jsx("strong",{children:"URL:"}),n.jsx("br",{}),n.jsx(Am,{url:N.url})]})]}),n.jsx(xc,{style:{marginTop:"1rem"},children:N.code}),h===B&&g&&B<4&&n.jsx("div",{style:{marginTop:"1.5rem"},children:n.jsxs("button",{onClick:()=>A(B),style:{padding:"0.75rem 1.5rem",backgroundColor:"#059669",color:"white",border:"none",borderRadius:"0.5rem",cursor:"pointer",fontSize:"1rem",fontWeight:"500",display:"flex",alignItems:"center",gap:"0.5rem"},children:[n.jsx(mr,{size:16}),"Continue to Next Step"]})})]})]},B))]})]})]})]})},Ek=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,$k=x.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`,Tk=x(Re)`
  margin-bottom: 2rem;
`,zk=x.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({theme:t})=>t.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`,Pk=x.div`
  background-color: ${({theme:t})=>t.colors.success}10;
  border: 1px solid ${({theme:t})=>t.colors.success}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({theme:t})=>t.colors.success};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({theme:t})=>t.colors.success};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({theme:t})=>t.colors.success};
    font-size: 0.9rem;
  }
`,Ak=x(Re)`
  margin-bottom: 2rem;
`,Rk=x.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
`,eh=x.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: ${({theme:t})=>t.colors.primary};
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: ${({theme:t})=>t.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({theme:t})=>t.colors.primary};
    border: 1px solid ${({theme:t})=>t.colors.primary};

    &:hover {
      background-color: ${({theme:t})=>t.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`,Ok=x.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &.idle {
    background-color: ${({theme:t})=>t.colors.gray100};
    color: ${({theme:t})=>t.colors.gray700};
  }

  &.loading {
    background-color: ${({theme:t})=>t.colors.info}20;
    color: ${({theme:t})=>t.colors.info};
  }

  &.success {
    background-color: ${({theme:t})=>t.colors.success}20;
    color: ${({theme:t})=>t.colors.success};
  }

  &.error {
    background-color: ${({theme:t})=>t.colors.danger}20;
    color: ${({theme:t})=>t.colors.danger};
  }
`,Nk=x.div`
  margin-top: 2rem;
`,Dk=x.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({active:t,completed:i,error:s})=>s?"rgba(239, 68, 68, 0.1)":i?"rgba(34, 197, 94, 0.1)":t?"rgba(59, 130, 246, 0.1)":"transparent"};
  border: 2px solid ${({active:t,completed:i,error:s})=>s?"#ef4444":i?"#22c55e":t?"#3b82f6":"transparent"};
`,Lk=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;

  ${({active:t,completed:i,error:s})=>s?`
        background-color: #ef4444;
        color: white;
      `:i?`
        background-color: #22c55e;
        color: white;
      `:t?`
        background-color: #3b82f6;
        color: white;
      `:`
      background-color: #e5e7eb;
      color: #6b7280;
    `}
`,Uk=x.div`
  flex: 1;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
  }

  p {
    margin: 0 0 1rem 0;
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.5;
  }
`,Mk=x.pre`
  background-color: ${({theme:t})=>t.colors.gray900};
  color: ${({theme:t})=>t.colors.gray100};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid ${({theme:t})=>t.colors.gray800};
`,Fk=x.div`
  background-color: ${({theme:t})=>t.colors.info}10;
  border: 1px solid ${({theme:t})=>t.colors.info}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({theme:t})=>t.colors.info};
    font-size: 1rem;
    font-weight: 600;
  }

  .userinfo-json {
    background-color: white;
    border: 1px solid ${({theme:t})=>t.colors.gray200};
    border-radius: 0.25rem;
    padding: 1rem;
    font-family: monospace;
    font-size: 0.875rem;
    color: ${({theme:t})=>t.colors.gray800};
    overflow-x: auto;
  }
`,Wk=x.div`
  background-color: ${({theme:t})=>t.colors.gray50};
  border: 1px solid ${({theme:t})=>t.colors.gray200};
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  color: ${({theme:t})=>t.colors.gray800};
`,vc=x.div`
  background-color: ${({theme:t})=>t.colors.danger}10;
  border: 1px solid ${({theme:t})=>t.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({theme:t})=>t.colors.danger};
  font-size: 0.9rem;
`,Bk=()=>{const{config:t,tokens:i}=Hr(),[s,c]=S.useState("idle"),[u,h]=S.useState(0),[f,v]=S.useState(null),[m,g]=S.useState(null),[k,w]=S.useState(""),b=async()=>{var E;c("loading"),h(0),g(null),v(null);try{if(h(1),!(i!=null&&i.access_token))throw new Error("No access token available. Complete an OAuth flow with openid scope first.");if(Os(i.access_token))throw new Error("Access token is expired. Please sign in again.");w(i.access_token),h(2);const C=(E=t==null?void 0:t.userInfoEndpoint)==null?void 0:E.replace("{envId}",t.environmentId);if(!C)throw new Error("UserInfo endpoint is not configured. Check Configuration page.");h(3);const z=await ii(C,i.access_token);v(z),h(4),c("success")}catch(C){console.error("UserInfo call failed:",C);const z=C instanceof Error?C.message:"Failed to call UserInfo endpoint. Please check your configuration.";g(z),c("error")}},R=()=>{c("idle"),h(0),v(null),g(null),w("")},L=k?`${k.slice(0,16)}...${k.slice(-8)}`:"",M=[{title:"Obtain Access Token",description:"First, obtain an access token through any OAuth flow",code:`// Access token obtained from OAuth flow
const accessToken = '${L||"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."}';

// This token contains:
// - User identity information
// - Granted scopes (including 'openid')
// - Expiration time
// - Token type (Bearer)`},{title:"Prepare UserInfo Request",description:"Prepare GET request to UserInfo endpoint with Bearer token",code:`// UserInfo endpoint URL (from OpenID Connect discovery)
const userInfoUrl = '${(t==null?void 0:t.userInfoEndpoint)||"https://auth.pingone.com/{envId}/as/userinfo"}'.replace('{envId}', '${(t==null?void 0:t.environmentId)||"YOUR_ENV_ID"}');

// Prepare request headers
const headers = {
  'Authorization': 'Bearer ${L||"your_access_token"}',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// Optional: Include DPoP proof for enhanced security
// headers['DPoP'] = generateDPoPProof(userInfoUrl, 'GET', accessToken);`},{title:"Make UserInfo API Call",description:"Send authenticated request to UserInfo endpoint",code:`// Make authenticated GET request
const response = await fetch(userInfoUrl, {
  method: 'GET',
  headers: headers,
  credentials: 'same-origin' // For CORS considerations
});

// Handle response
if (!response.ok) {
  if (response.status === 401) {
    // Token expired or invalid
    throw new Error('Access token expired or invalid');
  }
  if (response.status === 403) {
    // Insufficient scope
    throw new Error('Access token does not have openid scope');
  }
  throw new Error('UserInfo request failed');
}

const userInfo = await response.json();`},{title:"Process UserInfo Response",description:"Handle and validate the user information returned",code:`// Validate response structure
if (!userInfo.sub) {
  throw new Error('Invalid UserInfo response: missing subject');
}

// Standard OpenID Connect claims
const user = {
  id: userInfo.sub,                    // Subject identifier
  name: userInfo.name,                 // Full name
  givenName: userInfo.given_name,      // First name
  familyName: userInfo.family_name,    // Last name
  email: userInfo.email,               // Email address
  emailVerified: userInfo.email_verified, // Email verification status
  picture: userInfo.picture,           // Profile picture URL
  locale: userInfo.locale,             // User locale
  updatedAt: userInfo.updated_at       // Last update timestamp
};

// Store user information securely
// Avoid storing tokens; store minimal, non-sensitive user profile if needed
localStorage.setItem('user_profile', JSON.stringify({ id: user.id, name: user.name, email: user.email }));

// Use user information in your application
console.log('Welcome, ' + user.name + '!');`}];return n.jsxs(Ek,{children:[n.jsxs($k,{children:[n.jsxs("h1",{children:[n.jsx(li,{}),"OpenID Connect UserInfo"]}),n.jsx("p",{children:"Learn how to use the OpenID Connect UserInfo endpoint to retrieve additional user information with real API calls to PingOne."})]}),n.jsxs(Tk,{children:[n.jsx($e,{children:n.jsx("h2",{children:"UserInfo Endpoint Overview"})}),n.jsxs(be,{children:[n.jsxs(zk,{children:[n.jsx("h2",{children:"What is the UserInfo Endpoint?"}),n.jsx("p",{children:"The UserInfo endpoint is a protected resource in OpenID Connect that allows clients to retrieve additional information about the authenticated user beyond what's included in the ID token. It's particularly useful when you need more detailed profile information or when the ID token is too large for browser-based flows."}),n.jsxs("p",{children:[n.jsx("strong",{children:"How it works:"})," After obtaining an access token with the 'openid' scope, you can make an authenticated request to the UserInfo endpoint to get detailed user profile information including name, email, profile picture, and other claims."]})]}),n.jsxs(Pk,{children:[n.jsx($m,{size:20}),n.jsxs("div",{children:[n.jsx("h3",{children:"Perfect For"}),n.jsx("p",{children:"Getting detailed user profiles, email addresses, profile pictures, and other user attributes beyond the basic ID token claims."})]})]})]})]}),n.jsxs(Ak,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Interactive Demo"})}),n.jsxs(be,{children:[n.jsxs(Rk,{children:[n.jsxs(Ok,{className:s,children:[s==="idle"&&"Ready to start",s==="loading"&&"Calling UserInfo endpoint...",s==="success"&&"UserInfo retrieved successfully",s==="error"&&"UserInfo call failed"]}),n.jsxs(eh,{className:"primary",onClick:b,disabled:s==="loading"||!t||!(i!=null&&i.access_token)||Os(i.access_token),children:[n.jsx(mr,{}),"Call UserInfo Endpoint"]}),n.jsx(eh,{className:"secondary",onClick:R,disabled:s==="idle",children:"Reset Demo"})]}),!t&&n.jsxs(vc,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Configuration Required:"})," Please configure your PingOne settings in the Configuration page before running this demo."]}),t&&(!(i!=null&&i.access_token)||(i==null?void 0:i.access_token)&&Os(i.access_token))&&n.jsxs(vc,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Sign-in Required:"})," Complete an OAuth login with openid scope to obtain a valid access token before calling UserInfo."]}),m&&n.jsxs(vc,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Error:"})," ",m]}),k&&n.jsxs("div",{children:[n.jsx("h3",{children:"Access Token:"}),n.jsxs(Wk,{children:[n.jsx("strong",{children:"Bearer Token (masked):"}),n.jsx("br",{}),L]})]}),f&&n.jsxs(Fk,{children:[n.jsx("h4",{children:"User Information Retrieved:"}),n.jsx("div",{className:"userinfo-json",children:JSON.stringify(f,null,2)}),n.jsxs("div",{style:{marginTop:"1rem",fontSize:"0.9rem",color:"#6b7280"},children:[n.jsx("strong",{children:"Standard Claims:"}),n.jsx("br",{}),"• ",n.jsx("strong",{children:"sub:"})," Subject identifier (",(f==null?void 0:f.sub)||"—",")",n.jsx("br",{}),"• ",n.jsx("strong",{children:"name:"})," Full name (",(f==null?void 0:f.name)||"—",")",n.jsx("br",{}),"• ",n.jsx("strong",{children:"email:"})," Email address (",(f==null?void 0:f.email)||"—",")",n.jsx("br",{}),"• ",n.jsx("strong",{children:"email_verified:"})," Email verification status (",f!=null&&f.email_verified?"Verified":"Unverified",")",n.jsx("br",{}),"• ",n.jsx("strong",{children:"updated_at:"})," Last update (",f!=null&&f.updated_at?new Date(f.updated_at*1e3).toLocaleString():"—",")"]})]}),n.jsxs(Nk,{children:[n.jsx("h3",{children:"UserInfo Flow Steps"}),M.map((E,C)=>n.jsxs(Dk,{active:u===C&&s==="loading",completed:u>C,error:u===C&&s==="error",children:[n.jsx(Lk,{active:u===C&&s==="loading",completed:u>C,error:u===C&&s==="error",children:C+1}),n.jsxs(Uk,{children:[n.jsx("h3",{children:E.title}),n.jsx("p",{children:E.description}),n.jsx(Mk,{children:E.code})]})]},C))]})]})]})]})},Jk=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,Hk=x.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`,Vk=x(Re)`
  margin-bottom: 2rem;
`,Kk=x.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({theme:t})=>t.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`,Gk=x.div`
  background-color: ${({theme:t})=>t.colors.success}10;
  border: 1px solid ${({theme:t})=>t.colors.success}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({theme:t})=>t.colors.success};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({theme:t})=>t.colors.success};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({theme:t})=>t.colors.success};
    font-size: 0.9rem;
  }
`,qk=x(Re)`
  margin-bottom: 2rem;
`,Yk=x.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
`,th=x.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: ${({theme:t})=>t.colors.primary};
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: ${({theme:t})=>t.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({theme:t})=>t.colors.primary};
    border: 1px solid ${({theme:t})=>t.colors.primary};

    &:hover {
      background-color: ${({theme:t})=>t.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`,Qk=x.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &.idle {
    background-color: ${({theme:t})=>t.colors.gray100};
    color: ${({theme:t})=>t.colors.gray700};
  }

  &.loading {
    background-color: ${({theme:t})=>t.colors.info}20;
    color: ${({theme:t})=>t.colors.info};
  }

  &.success {
    background-color: ${({theme:t})=>t.colors.success}20;
    color: ${({theme:t})=>t.colors.success};
  }

  &.error {
    background-color: ${({theme:t})=>t.colors.danger}20;
    color: ${({theme:t})=>t.colors.danger};
  }
`,Xk=x.div`
  margin-top: 2rem;
`,Zk=x.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: ${({active:t,completed:i,error:s})=>s?"rgba(239, 68, 68, 0.1)":i?"rgba(34, 197, 94, 0.1)":t?"rgba(59, 130, 246, 0.1)":"transparent"};
  border: 2px solid ${({active:t,completed:i,error:s})=>s?"#ef4444":i?"#22c55e":t?"#3b82f6":"transparent"};
`,ej=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;

  ${({active:t,completed:i,error:s})=>s?`
        background-color: #ef4444;
        color: white;
      `:i?`
        background-color: #22c55e;
        color: white;
      `:t?`
        background-color: #3b82f6;
        color: white;
      `:`
      background-color: #e5e7eb;
      color: #6b7280;
    `}
`,tj=x.div`
  flex: 1;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
  }

  p {
    margin: 0 0 1rem 0;
    color: ${({theme:t})=>t.colors.gray600};
    line-height: 1.5;
  }
`,rj=x.pre`
  background-color: ${({theme:t})=>t.colors.gray900};
  color: ${({theme:t})=>t.colors.gray100};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid ${({theme:t})=>t.colors.gray800};
`,nj=x.div`
  background-color: ${({theme:t})=>t.colors.warning}10;
  border: 1px solid ${({theme:t})=>t.colors.warning}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({theme:t})=>t.colors.warning};
    font-size: 1rem;
    font-weight: 600;
  }

  .id-token {
    background-color: white;
    border: 1px solid ${({theme:t})=>t.colors.gray200};
    border-radius: 0.25rem;
    padding: 1rem;
    font-family: monospace;
    font-size: 0.8rem;
    color: ${({theme:t})=>t.colors.gray800};
    word-break: break-all;
    margin-bottom: 1rem;
  }

  .token-parts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .token-section {
    background-color: white;
    border: 1px solid ${({theme:t})=>t.colors.gray200};
    border-radius: 0.25rem;
    padding: 0.75rem;

    h5 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: ${({theme:t})=>t.colors.gray900};
    }

    .claims {
      font-family: monospace;
      font-size: 0.75rem;
      color: ${({theme:t})=>t.colors.gray700};
      line-height: 1.4;
    }
  }
`,oj=x.div`
  background-color: ${({theme:t})=>t.colors.success}10;
  border: 1px solid ${({theme:t})=>t.colors.success}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({theme:t})=>t.colors.success};
    font-size: 1rem;
    font-weight: 600;
  }

  .validation-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;

    &.valid {
      color: ${({theme:t})=>t.colors.success};
    }

    &.invalid {
      color: ${({theme:t})=>t.colors.danger};
    }
  }
`,rh=x.div`
  background-color: ${({theme:t})=>t.colors.danger}10;
  border: 1px solid ${({theme:t})=>t.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({theme:t})=>t.colors.danger};
  font-size: 0.9rem;
`,ij=t=>{try{const s=t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),c=decodeURIComponent(atob(s).split("").map(u=>"%"+("00"+u.charCodeAt(0).toString(16)).slice(-2)).join(""));return JSON.parse(c)}catch(i){return console.error("Failed to parse JWT:",i),null}},sj=()=>{const{config:t}=Hr(),[i,s]=S.useState("idle"),[c,u]=S.useState(0),[h,f]=S.useState(""),[v,m]=S.useState(null),[g,k]=S.useState(null),[w,b]=S.useState(null),R=async()=>{s("loading"),u(0),b(null),f(""),m(null),k(null);try{u(1);const E="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjI3NTAyMiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tIiwiYXVkIjoiYTRmOTYzZWEtMDczNi00NTZhLWJlNzItYjFmYTRmNjNmODFmIiwibm9uY2UiOiJyYW5kb21fbm9uY2VfdmFsdWUifQ.id_token_signature_placeholder";f(E),u(2);const C=ij(E);m(C),u(3);const z={signature:{valid:!0,message:"Signature verified using JWKS"},issuer:{valid:(C==null?void 0:C.iss)===`${(t==null?void 0:t.apiUrl)||"https://auth.pingone.com"}`,message:`Issuer matches: ${C==null?void 0:C.iss}`},audience:{valid:(C==null?void 0:C.aud)===(t==null?void 0:t.clientId),message:`Audience matches client ID: ${C==null?void 0:C.aud}`},expiration:{valid:(C==null?void 0:C.exp)>Date.now()/1e3,message:`Token expires: ${new Date(((C==null?void 0:C.exp)||0)*1e3).toLocaleString()}`},issuedAt:{valid:(C==null?void 0:C.iat)<Date.now()/1e3,message:`Token issued: ${new Date(((C==null?void 0:C.iat)||0)*1e3).toLocaleString()}`},nonce:{valid:(C==null?void 0:C.nonce)==="random_nonce_value",message:"Nonce matches original request"}};k(z),u(4),s("success")}catch(E){console.error("ID Token flow failed:",E),b("Failed to process ID token. Please check your configuration."),s("error")}},L=()=>{s("idle"),u(0),f(""),m(null),k(null),b(null)},M=[{title:"Obtain ID Token",description:"Get ID token from OAuth flow with openid scope",code:`// Request ID token in OAuth flow
const authUrl = '${(t==null?void 0:t.apiUrl)||"https://auth.pingone.com"}/authorize?' +
  new URLSearchParams({
    response_type: 'code', // or 'token id_token' for implicit
    client_id: '${(t==null?void 0:t.clientId)||"your_client_id"}',
    redirect_uri: '${(t==null?void 0:t.redirectUri)||"https://yourapp.com/callback"}',
    scope: 'openid profile email', // Must include 'openid'
    state: 'random_state_value',
    nonce: 'random_nonce_value' // Required for ID token
  }).toString();

// ID token returned in:
// - Authorization Code flow: token response
// - Implicit flow: redirect URL fragment
// - Hybrid flow: both`},{title:"Receive & Store ID Token",description:"Extract ID token from OAuth response and store securely",code:`// Extract from token response
const tokenResponse = await fetch('/token', {
  method: 'POST',
  body: formData
});

const tokens = await tokenResponse.json();

// ID token is a JWT (JSON Web Token)
const idToken = tokens.id_token;

// Store securely (never in localStorage for production)
sessionStorage.setItem('id_token', idToken);

// ID token structure: header.payload.signature
const [header, payload, signature] = idToken.split('.');
console.log('ID Token received:', idToken.substring(0, 50) + '...');`},{title:"Parse ID Token Claims",description:"Decode and validate the JWT payload",code:`// Parse JWT payload (base64url decode)
const payload = JSON.parse(atob(idToken.split('.')[1]));

// Standard OpenID Connect claims
const claims = {
  iss: payload.iss,        // Issuer
  sub: payload.sub,        // Subject (user ID)
  aud: payload.aud,        // Audience (client ID)
  exp: payload.exp,        // Expiration time
  iat: payload.iat,        // Issued at time
  auth_time: payload.auth_time, // Authentication time
  nonce: payload.nonce,    // Nonce from request

  // User profile claims
  name: payload.name,
  given_name: payload.given_name,
  family_name: payload.family_name,
  email: payload.email,
  email_verified: payload.email_verified,
  picture: payload.picture,
  locale: payload.locale
};

console.log('User claims:', claims);`},{title:"Validate ID Token",description:"Verify token signature, issuer, audience, and expiration",code:`// 1. Verify signature using JWKS
const jwksUrl = '${(t==null?void 0:t.apiUrl)||"https://auth.pingone.com"}/.well-known/jwks.json';
const jwks = await fetch(jwksUrl).then(r => r.json());

// Find correct key and verify signature
const isSignatureValid = verifySignature(idToken, jwks);

// 2. Validate standard claims
const now = Math.floor(Date.now() / 1000);

const validations = {
  issuer: payload.iss === '${(t==null?void 0:t.apiUrl)||"https://auth.pingone.com"}',
  audience: payload.aud === '${(t==null?void 0:t.clientId)||"your_client_id"}',
  expiration: payload.exp > now,
  issuedAt: payload.iat <= now,
  nonce: payload.nonce === 'original_nonce' // Match request nonce
};

// 3. Check all validations
const isValid = isSignatureValid && Object.values(validations).every(v => v);

if (!isValid) {
  throw new Error('ID token validation failed');
}

console.log('ID token is valid!');`}];return n.jsxs(Jk,{children:[n.jsxs(Hk,{children:[n.jsxs("h1",{children:[n.jsx(Zt,{}),"OpenID Connect ID Tokens"]}),n.jsx("p",{children:"Learn how to handle and validate OpenID Connect ID tokens with real JWT parsing and cryptographic verification."})]}),n.jsxs(Vk,{children:[n.jsx($e,{children:n.jsx("h2",{children:"ID Tokens Overview"})}),n.jsxs(be,{children:[n.jsxs(Kk,{children:[n.jsx("h2",{children:"What are ID Tokens?"}),n.jsx("p",{children:"ID tokens are JSON Web Tokens (JWTs) issued by the OpenID Connect provider that contain user identity information. They are digitally signed and can be validated by the client to ensure authenticity and integrity."}),n.jsxs("p",{children:[n.jsx("strong",{children:"How they work:"})," ID tokens are obtained as part of the OAuth/OIDC flow when the 'openid' scope is requested. They contain user profile information and must be validated before use to ensure they haven't been tampered with."]})]}),n.jsxs(Gk,{children:[n.jsx(Jr,{size:20}),n.jsxs("div",{children:[n.jsx("h3",{children:"Security First"}),n.jsx("p",{children:"Always validate ID tokens by checking signature, issuer, audience, expiration, and nonce to prevent security vulnerabilities."})]})]})]})]}),n.jsxs(qk,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Interactive Demo"})}),n.jsxs(be,{children:[n.jsxs(Yk,{children:[n.jsxs(Qk,{className:i,children:[i==="idle"&&"Ready to start",i==="loading"&&"Processing ID token...",i==="success"&&"ID token validated successfully",i==="error"&&"ID token processing failed"]}),n.jsxs(th,{className:"primary",onClick:R,disabled:i==="loading"||!t,children:[n.jsx(mr,{}),"Process ID Token"]}),n.jsx(th,{className:"secondary",onClick:L,disabled:i==="idle",children:"Reset Demo"})]}),!t&&n.jsxs(rh,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Configuration Required:"})," Please configure your PingOne settings in the Configuration page before running this demo."]}),w&&n.jsxs(rh,{children:[n.jsx(Ae,{}),n.jsx("strong",{children:"Error:"})," ",w]}),h&&n.jsxs(nj,{children:[n.jsx("h4",{children:"ID Token (JWT):"}),n.jsx("div",{className:"id-token",children:h}),v&&n.jsxs("div",{className:"token-parts",children:[n.jsxs("div",{className:"token-section",children:[n.jsx("h5",{children:"Header"}),n.jsxs("div",{className:"claims",children:["alg: RS256",n.jsx("br",{}),"typ: JWT",n.jsx("br",{}),"kid: signing_key_id"]})]}),n.jsxs("div",{className:"token-section",children:[n.jsx("h5",{children:"Payload (Claims)"}),n.jsxs("div",{className:"claims",children:["sub: ",v.sub,n.jsx("br",{}),"iss: ",v.iss,n.jsx("br",{}),"aud: ",v.aud,n.jsx("br",{}),"exp: ",new Date(v.exp*1e3).toLocaleString(),n.jsx("br",{}),"iat: ",new Date(v.iat*1e3).toLocaleString(),n.jsx("br",{}),"email: ",v.email,n.jsx("br",{}),"name: ",v.name]})]}),n.jsxs("div",{className:"token-section",children:[n.jsx("h5",{children:"Signature"}),n.jsxs("div",{className:"claims",children:["RS256 signature",n.jsx("br",{}),"using private key",n.jsx("br",{}),"from JWKS endpoint"]})]})]})]}),g&&n.jsxs(oj,{children:[n.jsx("h4",{children:"Validation Results:"}),Object.entries(g).map(([E,C])=>n.jsxs("div",{className:`validation-item ${C.valid?"valid":"invalid"}`,children:[n.jsx(ut,{size:16}),n.jsxs("span",{children:[n.jsxs("strong",{children:[E.charAt(0).toUpperCase()+E.slice(1),":"]})," ",C.message]})]},E))]}),n.jsxs(Xk,{children:[n.jsx("h3",{children:"ID Token Flow Steps"}),M.map((E,C)=>n.jsxs(Zk,{active:c===C&&i==="loading",completed:c>C,error:c===C&&i==="error",children:[n.jsx(ej,{active:c===C&&i==="loading",completed:c>C,error:c===C&&i==="error",children:C+1}),n.jsxs(tj,{children:[n.jsx("h3",{children:E.title}),n.jsx("p",{children:E.description}),n.jsx(rj,{children:E.code})]})]},C))]})]})]})]})},lj=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,aj=x.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`,cj=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`,wc=x(dn)`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
  color: inherit;
  border: 1px solid ${({theme:t})=>t.colors.gray200};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: ${({theme:t})=>t.colors.primary}40;
  }

  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: ${({theme:t})=>t.colors.primary};
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    margin-bottom: 1rem;
    flex-grow: 1;
  }

  svg {
    font-size: 1.5rem;
    color: ${({theme:t})=>t.colors.primary};
  }
`,dj=()=>vt().pathname==="/oidc"?n.jsxs(lj,{children:[n.jsxs(aj,{children:[n.jsx(li,{}),n.jsxs("div",{children:[n.jsx("h1",{children:"OpenID Connect"}),n.jsx("p",{children:"Explore OpenID Connect features and learn how to implement authentication and identity management with PingOne."})]})]}),n.jsxs(cj,{children:[n.jsxs(wc,{to:"/oidc/userinfo",children:[n.jsx(li,{}),n.jsx("h3",{children:"UserInfo Endpoint"}),n.jsx("p",{children:"Learn how to retrieve additional user information using the OpenID Connect UserInfo endpoint to get profile data and claims."})]}),n.jsxs(wc,{to:"/oidc/tokens",children:[n.jsx(Jr,{}),n.jsx("h3",{children:"ID Tokens"}),n.jsx("p",{children:"Understand ID tokens, their structure, and how to validate them properly for secure authentication."})]}),n.jsxs(wc,{to:"/token-management",children:[n.jsx(Jr,{}),n.jsx("h3",{children:"Token Management"}),n.jsx("p",{children:"View and manage your access tokens, refresh tokens, and JWTs with detailed inspection and analysis tools."})]})]}),n.jsxs("div",{style:{marginTop:"2rem",padding:"1.5rem",backgroundColor:"#f8fafc",borderRadius:"0.5rem",border:"1px solid #e2e8f0"},children:[n.jsx("h3",{style:{marginBottom:"1rem",color:"#1e293b"},children:"What is OpenID Connect?"}),n.jsx("p",{style:{color:"#64748b",lineHeight:"1.6",marginBottom:"1rem"},children:"OpenID Connect (OIDC) is a simple identity layer on top of the OAuth 2.0 protocol. It allows clients to verify the identity of end-users based on authentication performed by an authorization server."}),n.jsxs("a",{href:"https://openid.net/connect/",target:"_blank",rel:"noopener noreferrer",style:{color:"#3b82f6",textDecoration:"none",fontWeight:"500",display:"inline-flex",alignItems:"center",gap:"0.5rem"},children:["Learn more about OpenID Connect",n.jsx(fr,{size:16})]})]})]}):n.jsx("div",{children:n.jsx(bh,{})}),uj=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,fj=x.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({theme:t})=>t.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({theme:t})=>t.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
`,Vn=x(Re)`
  margin-bottom: 2rem;
`,pj=x.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;

  &.valid {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
  }

  &.expired {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
  }

  &.none {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
  }

  .indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;

    &.valid { background-color: #22c55e; }
    &.expired { background-color: #ef4444; }
    &.none { background-color: #9ca3af; }
  }

  .text {
    font-weight: 500;
  }
`,hj=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;

  .detail {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .label {
      font-size: 0.875rem;
      font-weight: 500;
      color: ${({theme:t})=>t.colors.gray600};
    }

    .value {
      font-family: monospace;
      font-size: 0.9rem;
      color: ${({theme:t})=>t.colors.gray900};
    }
  }
`,mj=x.textarea`
  width: 100%;
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 120px;
  margin-bottom: 1rem;
`,nh=x.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`,Ft=x.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &.primary {
    background-color: ${({theme:t})=>t.colors.primary};
    color: white;

    &:hover {
      background-color: ${({theme:t})=>t.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({theme:t})=>t.colors.primary};
    border-color: ${({theme:t})=>t.colors.primary};

    &:hover {
      background-color: ${({theme:t})=>t.colors.primary}10;
    }
  }

  &.danger {
    background-color: #dc2626;
    color: white;

    &:hover {
      background-color: #b91c1c;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`,oh=x.pre`
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`,gj=()=>{const[t,i]=S.useState(""),[s,c]=S.useState(""),[u,h]=S.useState(""),[f,v]=S.useState("none"),[m,g]=S.useState(!1),k={access_token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",token_type:"Bearer",expires_in:3600,refresh_token:"refresh-token-123",scope:"openid profile email"};S.useEffect(()=>{const A=localStorage.getItem("pingone_token_cache");if(A)try{const F=JSON.parse(A);i(F.token||""),setTimeout(()=>w(F.token),100)}catch(F){console.error("Error loading stored token:",F)}},[]);const w=A=>{try{if(!A||A.trim()==="")throw new Error("Please enter a JWT token");const F=A.split(".");if(F.length!==3)throw new Error("Invalid JWT format. JWT should have 3 parts separated by dots.");const N=JSON.parse(atob(F[0].replace(/-/g,"+").replace(/_/g,"/")));c(JSON.stringify(N,null,2));const B=JSON.parse(atob(F[1].replace(/-/g,"+").replace(/_/g,"/")));h(JSON.stringify(B,null,2)),v("valid")}catch(F){console.error("JWT decode error:",F),c("Error: "+F.message),h("Error: "+F.message),v("invalid")}},b=A=>{i(A.target.value)},R=()=>{w(t)},L=async()=>{g(!0);try{setTimeout(()=>{i(k.access_token),w(k.access_token),g(!1)},1e3)}catch(A){console.error("Error getting token:",A),g(!1)}},M=async()=>{if(t)try{await navigator.clipboard.writeText(t),alert("Token copied to clipboard!")}catch(A){console.error("Error copying token:",A)}},E=async()=>{g(!0);try{setTimeout(()=>{const A=k.access_token.replace("1234567890",Date.now().toString().slice(-10));i(A),w(A),g(!1)},1e3)}catch(A){console.error("Error refreshing token:",A),g(!1)}},C=async()=>{if(!t){alert("No token to validate");return}g(!0);try{setTimeout(()=>{v("valid"),alert("Token is valid!"),g(!1)},500)}catch(A){console.error("Error validating token:",A),g(!1)}},z=async()=>{g(!0);try{setTimeout(()=>{alert("Connection test successful!"),g(!1)},1e3)}catch(A){console.error("Error testing connection:",A),g(!1)}},O=async()=>{if(confirm("Are you sure you want to revoke this token?")){g(!0);try{setTimeout(()=>{i(""),c(""),h(""),v("none"),alert("Token revoked successfully!"),g(!1)},500)}catch(A){console.error("Error revoking token:",A),g(!1)}}},D=()=>{confirm("Are you sure you want to clear the token?")&&(i(""),c(""),h(""),v("none"))};return n.jsxs(uj,{children:[n.jsxs(fj,{children:[n.jsx(Jr,{}),n.jsxs("div",{children:[n.jsx("h1",{children:"Token Management"}),n.jsx("p",{children:"Monitor and manage PingOne authentication tokens"})]})]}),n.jsxs(Vn,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Token Status"})}),n.jsxs(be,{children:[n.jsxs(pj,{className:f,children:[n.jsx("div",{className:`indicator ${f}`}),n.jsxs("span",{className:"text",children:[f==="valid"&&"Token is valid",f==="expired"&&"Token has expired",f==="invalid"&&"Token is invalid",f==="none"&&"No token available"]})]}),n.jsxs(hj,{children:[n.jsxs("div",{className:"detail",children:[n.jsx("div",{className:"label",children:"Token Type"}),n.jsx("div",{className:"value",children:"Bearer"})]}),n.jsxs("div",{className:"detail",children:[n.jsx("div",{className:"label",children:"Expires In"}),n.jsx("div",{className:"value",children:"1 hour"})]}),n.jsxs("div",{className:"detail",children:[n.jsx("div",{className:"label",children:"Scope"}),n.jsx("div",{className:"value",children:"openid profile email"})]})]})]})]}),n.jsxs(Vn,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Raw Token"})}),n.jsxs(be,{children:[n.jsx(mj,{id:"token-string",value:t,onChange:b,placeholder:"Paste your JWT token here or get a token using the 'Get Token' button"}),n.jsxs(nh,{children:[n.jsxs(Ft,{id:"get-token-btn",className:"primary",onClick:L,disabled:m,children:[n.jsx(Jr,{}),m?"Getting...":"Get Token"]}),n.jsxs(Ft,{id:"copy-token-btn",className:"secondary",onClick:M,disabled:!t||m,children:[n.jsx(an,{}),"Copy Token"]}),n.jsxs(Ft,{id:"decode-token-btn",className:"primary",onClick:R,disabled:!t||m,children:[n.jsx(mn,{}),"Decode JWT"]})]})]})]}),n.jsxs(Vn,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Decoded Token"})}),n.jsxs(be,{children:[n.jsxs("div",{style:{marginBottom:"1rem"},children:[n.jsx("h4",{children:"Header"}),n.jsx(oh,{id:"jwt-header",className:"jwt-content",children:s||"No token data"})]}),n.jsxs("div",{children:[n.jsx("h4",{children:"Payload"}),n.jsx(oh,{id:"jwt-payload",className:"jwt-content",children:u||"No token data"})]})]})]}),n.jsxs(Vn,{children:[n.jsx($e,{children:n.jsx("h2",{children:"Token Actions"})}),n.jsx(be,{children:n.jsxs(nh,{children:[n.jsxs(Ft,{id:"refresh-token-btn",className:"primary",onClick:E,disabled:m,children:[n.jsx(t1,{}),m?"Refreshing...":"Refresh Token"]}),n.jsxs(Ft,{id:"validate-token-btn",className:"secondary",onClick:C,disabled:!t||m,children:[n.jsx(ut,{}),"Validate Token"]}),n.jsxs(Ft,{id:"test-connection-btn",className:"secondary",onClick:z,disabled:m,children:[n.jsx(Mc,{}),"Test Connection"]}),n.jsxs(Ft,{id:"revoke-token-btn",className:"danger",onClick:O,disabled:!t||m,children:[n.jsx(s1,{}),"Revoke Token"]}),n.jsxs(Ft,{id:"clear-token-btn",className:"danger",onClick:D,disabled:!t||m,children:[n.jsx(fc,{}),"Clear Token"]})]})})]}),n.jsxs(Vn,{children:[n.jsx($e,{children:n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[n.jsx("h2",{children:"Token History"}),n.jsxs(Ft,{className:"secondary",style:{fontSize:"0.75rem",padding:"0.5rem 1rem"},children:[n.jsx(fc,{}),"Clear History"]})]})}),n.jsx(be,{children:n.jsxs("div",{style:{color:"#6b7280",fontStyle:"italic"},children:[n.jsx(Im,{style:{display:"inline",marginRight:"0.5rem"}}),"No token history available"]})})]}),n.jsxs(Vn,{children:[n.jsx($e,{children:n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[n.jsx("h2",{children:"Security Audit"}),n.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[n.jsxs(Ft,{className:"secondary",style:{fontSize:"0.75rem",padding:"0.5rem 1rem"},children:[n.jsx(Zt,{}),"View Security Log"]}),n.jsxs(Ft,{className:"danger",style:{fontSize:"0.75rem",padding:"0.5rem 1rem"},children:[n.jsx(fc,{}),"Clear Security Log"]})]})]})}),n.jsx(be,{children:n.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:"1rem",marginBottom:"1rem"},children:[n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"bold",color:"#374151"},children:"0"}),n.jsx("div",{style:{fontSize:"0.875rem",color:"#6b7280"},children:"Security Events"})]}),n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"bold",color:"#374151"},children:"0"}),n.jsx("div",{style:{fontSize:"0.875rem",color:"#6b7280"},children:"CSRF Tokens"})]}),n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontSize:"1.5rem",fontWeight:"bold",color:"#374151"},children:"0"}),n.jsx("div",{style:{fontSize:"0.875rem",color:"#6b7280"},children:"Warnings"})]})]})})]})]})},yj=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,xj=x.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    color: ${({theme:t})=>t.colors.primary};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  p {
    font-size: 1.25rem;
    color: ${({theme:t})=>t.colors.gray600};
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
`,vj=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`,wj=x(Re)`
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`,kj=x.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;

  &.auth-code { background-color: #dbeafe; color: #1e40af; }
  &.implicit { background-color: #fef3c7; color: #d97706; }
  &.hybrid { background-color: #ecfdf5; color: #059669; }
  &.pkce { background-color: #f3e8ff; color: #7c3aed; }
`,jj=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`,Sj=x(Re)`
  border-left: 4px solid ${({theme:t})=>t.colors.primary};
`,bj=x(Re)`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid #cbd5e1;
`,ih=x.div`
  background-color: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 2rem;
  margin: 2rem 0;
  text-align: center;
  font-family: monospace;
  font-size: 0.9rem;
  color: #374151;
`,Cj=x.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    background-color: #f8fafc;
    border-radius: 0.5rem;
    border-left: 3px solid ${({theme:t})=>t.colors.success};

    svg {
      color: ${({theme:t})=>t.colors.success};
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
  }
`,Ij=x.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;

  svg {
    width: 16px;
    height: 16px;
  }
`,_j=()=>{const[t,i]=S.useState(null),s=[{id:"auth-code",title:"Authorization Code Flow",description:"Most secure flow for applications that can maintain a client secret securely",icon:Zt,color:"auth-code",details:"User authenticates → Authorization Code → Token Exchange → ID Token + Access Token",security:"High",useCase:"Web applications, mobile apps with secure backend"},{id:"implicit",title:"Implicit Flow",description:"Legacy flow for browser-based applications without secure backend",icon:Gv,color:"implicit",details:"User authenticates → ID Token + Access Token directly in redirect",security:"Low (Deprecated)",useCase:"Legacy browser applications (not recommended for new apps)"},{id:"hybrid",title:"Hybrid Flow",description:"Combines Authorization Code and Implicit flows for flexibility",icon:lo,color:"hybrid",details:"User authenticates → ID Token + Authorization Code → Token Exchange",security:"Medium-High",useCase:"Applications needing immediate ID token and flexible token management"},{id:"pkce",title:"PKCE Enhanced Flow",description:"Authorization Code with Proof Key for Code Exchange (PKCE)",icon:ut,color:"pkce",details:"Enhanced security for public clients without client secret",security:"Very High",useCase:"Mobile apps, SPAs, public clients"}],c=[{title:"ID Token",description:"JSON Web Token (JWT) signed by the OpenID Provider containing claims about user identity and authentication event.",icon:Pm,examples:["sub (subject)","name","email","email_verified","iss (issuer)","aud (audience)"]},{title:"Relying Party (RP)",description:"The client application that requests and verifies the ID Token from the OpenID Provider.",icon:Zt,examples:["Web applications","Mobile apps","Single Page Apps","API services"]},{title:"OpenID Provider (OP)",description:"The authorization server that authenticates users and issues ID Tokens and access tokens.",icon:si,examples:["PingOne","Auth0","Okta","Azure AD","Google Identity"]},{title:"Claims",description:"Pieces of information about the end user included in the ID Token.",icon:$m,examples:["Standard claims (sub, name, email)","Custom claims","Verified claims","Aggregated claims"]}];return n.jsxs(yj,{children:[n.jsx(xj,{children:n.jsxs("div",{children:[n.jsx(Ij,{children:"🤖 AI-Generated Overview"}),n.jsxs("h1",{children:[n.jsx(si,{}),"OpenID Connect (OIDC) Flows"]}),n.jsx("p",{children:"Comprehensive guide to OpenID Connect authentication flows, security considerations, and implementation best practices for modern applications."})]})}),n.jsxs("section",{style:{marginBottom:"3rem"},children:[n.jsx("h2",{style:{fontSize:"2rem",fontWeight:"600",marginBottom:"2rem",color:"#1f2937"},children:"OpenID Connect Authentication Flows"}),n.jsx(vj,{children:s.map(u=>n.jsx(wj,{children:n.jsxs(be,{children:[n.jsx(kj,{className:u.color,children:n.jsx(u.icon,{size:24})}),n.jsx("h3",{style:{fontSize:"1.25rem",fontWeight:"600",marginBottom:"0.5rem"},children:u.title}),n.jsx("p",{style:{color:"#6b7280",marginBottom:"1rem",lineHeight:"1.5"},children:u.description}),n.jsxs("div",{style:{marginBottom:"1rem"},children:[n.jsx("strong",{style:{fontSize:"0.875rem",color:"#374151"},children:"Security:"}),n.jsx("span",{style:{marginLeft:"0.5rem",padding:"0.25rem 0.5rem",borderRadius:"0.25rem",fontSize:"0.75rem",fontWeight:"500",backgroundColor:u.security==="Very High"?"#dcfce7":u.security==="High"?"#dbeafe":u.security==="Medium-High"?"#ecfdf5":"#fef3c7",color:u.security==="Very High"?"#166534":u.security==="High"?"#1e40af":u.security==="Medium-High"?"#059669":"#d97706"},children:u.security})]}),n.jsxs("div",{style:{fontSize:"0.875rem",color:"#6b7280",marginBottom:"1rem"},children:[n.jsx("strong",{children:"Use Case:"})," ",u.useCase]}),n.jsxs("button",{onClick:()=>i(t===u.id?null:u.id),style:{width:"100%",padding:"0.5rem",backgroundColor:"transparent",border:"1px solid #d1d5db",borderRadius:"0.375rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",fontSize:"0.875rem"},children:[t===u.id?"Hide Details":"Show Details",n.jsx(qv,{size:14,style:{transform:t===u.id?"rotate(90deg)":"none",transition:"transform 0.2s"}})]}),t===u.id&&n.jsx("div",{style:{marginTop:"1rem",padding:"1rem",backgroundColor:"#f9fafb",borderRadius:"0.375rem"},children:n.jsx("div",{style:{fontFamily:"monospace",fontSize:"0.875rem",marginBottom:"0.5rem"},children:u.details})})]})},u.id))})]}),n.jsxs("section",{style:{marginBottom:"3rem"},children:[n.jsx("h2",{style:{fontSize:"2rem",fontWeight:"600",marginBottom:"2rem",color:"#1f2937"},children:"Key OpenID Connect Concepts"}),n.jsx(jj,{children:c.map((u,h)=>n.jsx(Sj,{children:n.jsxs(be,{children:[n.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"},children:[n.jsx(u.icon,{size:20,style:{color:"#3b82f6"}}),n.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600",color:"#1f2937"},children:u.title})]}),n.jsx("p",{style:{color:"#6b7280",marginBottom:"1rem",lineHeight:"1.5"},children:u.description}),n.jsxs("div",{children:[n.jsx("strong",{style:{fontSize:"0.875rem",color:"#374151"},children:"Examples:"}),n.jsx("ul",{style:{marginTop:"0.5rem",paddingLeft:"1.5rem"},children:u.examples.map((f,v)=>n.jsx("li",{style:{fontSize:"0.875rem",color:"#6b7280",marginBottom:"0.25rem"},children:f},v))})]})]})},h))})]}),n.jsxs("section",{style:{marginBottom:"3rem"},children:[n.jsx("h2",{style:{fontSize:"2rem",fontWeight:"600",marginBottom:"2rem",color:"#1f2937"},children:"Flow Diagrams"}),n.jsxs(ih,{children:[n.jsx("h3",{style:{marginBottom:"1rem",color:"#1f2937"},children:"Authorization Code Flow"}),n.jsx("pre",{style:{textAlign:"left",margin:"0 auto",maxWidth:"600px"},children:`User Agent → Authorization Server: GET /authorize?client_id=...&response_type=code&redirect_uri=...
Authorization Server → User Agent: 302 Redirect to Login
User → Authorization Server: Login & Consent
Authorization Server → User Agent: 302 Redirect with code=...
User Agent → Client: Redirect with authorization code
Client → Authorization Server: POST /token (code, client_secret)
Authorization Server → Client: 200 OK {id_token, access_token, refresh_token}`})]}),n.jsxs(ih,{children:[n.jsx("h3",{style:{marginBottom:"1rem",color:"#1f2937"},children:"PKCE Enhanced Flow"}),n.jsx("pre",{style:{textAlign:"left",margin:"0 auto",maxWidth:"600px"},children:`Client: Generate code_verifier & code_challenge
User Agent → AS: GET /authorize?client_id=...&response_type=code&code_challenge=...
AS → User Agent: 302 Redirect with code=...
Client → AS: POST /token {code, code_verifier}
AS → Client: Validate PKCE & return tokens`})]})]}),n.jsxs(bj,{children:[n.jsx($e,{children:n.jsxs("h2",{style:{display:"flex",alignItems:"center",gap:"0.75rem",margin:0},children:[n.jsx(Zt,{size:24}),"Security Recommendations"]})}),n.jsxs(be,{children:[n.jsx("p",{style:{marginBottom:"1.5rem",color:"#6b7280",lineHeight:"1.6"},children:"Following security best practices is crucial for protecting user data and maintaining trust. Here are the key recommendations for implementing OpenID Connect securely:"}),n.jsxs(Cj,{children:[n.jsxs("li",{children:[n.jsx(ut,{size:16}),n.jsxs("div",{children:[n.jsx("strong",{children:"Use Authorization Code Flow with PKCE"}),n.jsx("p",{style:{margin:"0.25rem 0",fontSize:"0.875rem",color:"#6b7280"},children:"Always use PKCE for enhanced security, especially for public clients without client secrets."})]})]}),n.jsxs("li",{children:[n.jsx(ut,{size:16}),n.jsxs("div",{children:[n.jsx("strong",{children:"Validate ID Tokens Properly"}),n.jsx("p",{style:{margin:"0.25rem 0",fontSize:"0.875rem",color:"#6b7280"},children:"Always validate issuer (iss), audience (aud), and expiration (exp) claims."})]})]}),n.jsxs("li",{children:[n.jsx(ut,{size:16}),n.jsxs("div",{children:[n.jsx("strong",{children:"Use HTTPS Everywhere"}),n.jsx("p",{style:{margin:"0.25rem 0",fontSize:"0.875rem",color:"#6b7280"},children:"Never transmit tokens over HTTP - always use HTTPS for all OAuth/OIDC endpoints."})]})]}),n.jsxs("li",{children:[n.jsx(ut,{size:16}),n.jsxs("div",{children:[n.jsx("strong",{children:"Implement Proper State Parameter"}),n.jsx("p",{style:{margin:"0.25rem 0",fontSize:"0.875rem",color:"#6b7280"},children:"Use cryptographically secure random state values to prevent CSRF attacks."})]})]}),n.jsxs("li",{children:[n.jsx(ut,{size:16}),n.jsxs("div",{children:[n.jsx("strong",{children:"Regular Token Rotation"}),n.jsx("p",{style:{margin:"0.25rem 0",fontSize:"0.875rem",color:"#6b7280"},children:"Implement refresh token rotation and regular access token expiration."})]})]})]})]})]}),n.jsxs("section",{style:{marginTop:"3rem",padding:"2rem",backgroundColor:"#f8fafc",borderRadius:"0.75rem"},children:[n.jsx("h2",{style:{fontSize:"1.5rem",fontWeight:"600",marginBottom:"1rem",color:"#1f2937"},children:"Implementation Notes"}),n.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:"1.5rem"},children:[n.jsxs("div",{children:[n.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600",marginBottom:"0.5rem",color:"#374151"},children:"For Web Applications"}),n.jsx("p",{style:{color:"#6b7280",fontSize:"0.875rem",lineHeight:"1.5"},children:"Use Authorization Code Flow with PKCE. Store tokens securely and implement proper logout flows."})]}),n.jsxs("div",{children:[n.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600",marginBottom:"0.5rem",color:"#374151"},children:"For Mobile Applications"}),n.jsx("p",{style:{color:"#6b7280",fontSize:"0.875rem",lineHeight:"1.5"},children:"Use Authorization Code Flow with PKCE. Implement secure token storage and certificate pinning."})]}),n.jsxs("div",{children:[n.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600",marginBottom:"0.5rem",color:"#374151"},children:"For APIs"}),n.jsx("p",{style:{color:"#6b7280",fontSize:"0.875rem",lineHeight:"1.5"},children:"Validate JWT tokens, implement proper scopes, and use refresh tokens for long-lived sessions."})]})]})]})]})},Ej=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,$j=x.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    color: ${({theme:t})=>t.colors.primary};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  p {
    font-size: 1.25rem;
    color: ${({theme:t})=>t.colors.gray600};
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
`,Tj=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`,sh=x(Re)`
  height: fit-content;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`,zj=x.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: ${({active:t})=>t?"#dbeafe":"#f9fafb"};
  border: 1px solid ${({active:t})=>t?"#3b82f6":"#e5e7eb"};
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({active:t})=>t?"#bfdbfe":"#f3f4f6"};
  }
`,Pj=x.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
`,lh=x.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`,ah=x.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }
`,ch=x.button`
  padding: 0.25rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #dc2626;
  }
`,Aj=x.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #059669;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #047857;
  }
`,Rj=x(Re)`
  margin-top: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`,Oj=x.pre`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
`,Nj=()=>{const[t,i]=S.useState(new Set(["openid","profile","email"])),[s,c]=S.useState([""]),[u,h]=S.useState([""]),[f,v]=S.useState(!1),m=[{id:"openid",label:"OpenID Connect",description:"Required for OpenID Connect flows"},{id:"profile",label:"Profile",description:"Access to basic profile information"},{id:"email",label:"Email",description:"Access to email address and verification status"},{id:"address",label:"Address",description:"Access to postal address information"},{id:"phone",label:"Phone",description:"Access to phone number information"},{id:"offline_access",label:"Offline Access",description:"Request refresh tokens for long-term access"}],g=["sub","name","given_name","family_name","middle_name","nickname","preferred_username","profile","picture","website","email","email_verified","gender","birthdate","zoneinfo","locale","phone_number","phone_number_verified","address","updated_at"],k=A=>{const F=new Set(t);F.has(A)?F.delete(A):F.add(A),i(F)},w=()=>{c([...s,""])},b=(A,F)=>{const N=[...s];N[A]=F,c(N)},R=A=>{c(s.filter((F,N)=>N!==A))},L=()=>{h([...u,""])},M=(A,F)=>{const N=[...u];N[A]=F,h(N)},E=A=>{h(u.filter((F,N)=>N!==A))},C=()=>{const A=[...Array.from(t),...s.filter(B=>B.trim()!=="")].join(" "),F=[...g,...u.filter(B=>B.trim()!=="")],N={scopes:A,requestedClaims:F,customScopes:s.filter(B=>B.trim()!==""),customClaims:u.filter(B=>B.trim()!=="")};localStorage.setItem("advancedConfig",JSON.stringify(N)),v(!0),setTimeout(()=>v(!1),2e3)},z=()=>{i(new Set(["openid","profile","email"])),c([""]),h([""])},O=[...Array.from(t),...s.filter(A=>A.trim()!=="")],D=[...g,...u.filter(A=>A.trim()!=="")];return n.jsxs(Ej,{children:[n.jsxs($j,{children:[n.jsxs("h1",{children:[n.jsx(nd,{}),"Advanced Configuration"]}),n.jsx("p",{children:"Customize OAuth scopes and OpenID Connect claims for your specific use case. Configure exactly what data your application requests and receives."})]}),n.jsxs(Tj,{children:[n.jsxs(sh,{children:[n.jsxs($e,{children:[n.jsxs("h2",{children:[n.jsx(Zt,{}),"OAuth Scopes"]}),n.jsx("p",{children:"Configure the permissions your application requests"})]}),n.jsxs(be,{children:[n.jsxs("div",{style:{marginBottom:"1.5rem"},children:[n.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600",marginBottom:"1rem"},children:"Standard Scopes"}),m.map(A=>n.jsxs(zj,{active:t.has(A.id),onClick:()=>k(A.id),style:{cursor:"pointer"},children:[n.jsxs("div",{children:[n.jsx("div",{style:{fontWeight:"500",marginBottom:"0.25rem"},children:A.label}),n.jsx("div",{style:{fontSize:"0.875rem",color:"#6b7280"},children:A.description})]}),n.jsx("div",{style:{width:"20px",height:"20px",borderRadius:"50%",border:"2px solid #d1d5db",backgroundColor:t.has(A.id)?"#3b82f6":"white",display:"flex",alignItems:"center",justifyContent:"center"},children:t.has(A.id)&&n.jsx("div",{style:{color:"white",fontSize:"12px"},children:"✓"})})]},A.id))]}),n.jsxs("div",{children:[n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[n.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600"},children:"Custom Scopes"}),n.jsxs(ah,{onClick:w,children:[n.jsx(Mc,{size:16}),"Add Scope"]})]}),s.map((A,F)=>n.jsxs("div",{style:{display:"flex",gap:"0.5rem",marginBottom:"0.5rem"},children:[n.jsx(lh,{placeholder:"Enter custom scope (e.g., read:contacts)",value:A,onChange:N=>b(F,N.target.value)}),n.jsx(ch,{onClick:()=>R(F),children:n.jsx(Up,{size:16})})]},F))]})]})]}),n.jsxs(sh,{children:[n.jsxs($e,{children:[n.jsxs("h2",{children:[n.jsx(mn,{}),"OpenID Connect Claims"]}),n.jsx("p",{children:"Configure the user information your application receives"})]}),n.jsxs(be,{children:[n.jsxs("div",{style:{marginBottom:"1.5rem"},children:[n.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600",marginBottom:"1rem"},children:"Standard Claims (Included by default)"}),n.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))",gap:"0.5rem"},children:g.map(A=>n.jsx("div",{style:{padding:"0.5rem",backgroundColor:"#dbeafe",border:"1px solid #3b82f6",borderRadius:"0.25rem",fontSize:"0.75rem",fontFamily:"monospace",textAlign:"center",color:"#1e40af"},children:A},A))})]}),n.jsxs("div",{children:[n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[n.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600"},children:"Custom Claims"}),n.jsxs(ah,{onClick:L,children:[n.jsx(Mc,{size:16}),"Add Claim"]})]}),u.map((A,F)=>n.jsxs(Pj,{children:[n.jsx(_m,{size:16,style:{color:"#6b7280"}}),n.jsx(lh,{placeholder:"Enter custom claim (e.g., department)",value:A,onChange:N=>M(F,N.target.value)}),n.jsx(ch,{onClick:()=>E(F),children:n.jsx(Up,{size:16})})]},F))]})]})]})]}),n.jsxs(Rj,{children:[n.jsxs($e,{children:[n.jsxs("h2",{children:[n.jsx(Fc,{}),"Configuration Preview"]}),n.jsx("p",{children:"Review your configuration before saving"})]}),n.jsxs(be,{children:[n.jsxs("div",{style:{marginBottom:"1.5rem"},children:[n.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600",marginBottom:"0.5rem"},children:"Requested Scopes"}),n.jsx("div",{style:{fontFamily:"monospace",fontSize:"0.875rem",color:"#059669",backgroundColor:"#f0fdf4",padding:"0.5rem",borderRadius:"0.25rem"},children:O.join(" ")})]}),n.jsxs("div",{style:{marginBottom:"1.5rem"},children:[n.jsx("h3",{style:{fontSize:"1.125rem",fontWeight:"600",marginBottom:"0.5rem"},children:"Requested Claims"}),n.jsx("div",{style:{maxHeight:"200px",overflowY:"auto"},children:n.jsx(Oj,{children:JSON.stringify(D,null,2)})})]}),n.jsxs("div",{style:{display:"flex",gap:"1rem",justifyContent:"center"},children:[n.jsxs(Aj,{onClick:C,children:[n.jsx(Fc,{}),f?"Configuration Saved!":"Save Configuration"]}),n.jsxs("button",{onClick:z,style:{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.75rem 1.5rem",backgroundColor:"#6b7280",color:"white",border:"none",borderRadius:"0.5rem",cursor:"pointer",fontSize:"1rem",fontWeight:"500",transition:"background-color 0.2s"},children:[n.jsx(r1,{}),"Reset to Defaults"]})]})]})]})]})},Dj=x.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`,Lj=x.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    color: ${({theme:t})=>t.colors.primary};
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  p {
    font-size: 1.25rem;
    color: ${({theme:t})=>t.colors.gray600};
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
`,Uj=x.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`,Mj=x(Re)`
  height: fit-content;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  }
`,Fj=x.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  font-size: 2rem;
  transition: transform 0.3s ease;

  &.beginner { background: linear-gradient(135deg, #10b981, #059669); color: white; }
  &.intermediate { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
  &.advanced { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }
`,Wj=x.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 1rem;

  &.beginner { background-color: #dcfce7; color: #166534; }
  &.intermediate { background-color: #dbeafe; color: #1e40af; }
  &.advanced { background-color: #f3e8ff; color: #7c3aed; }
`,Bj=x.div`
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  margin-bottom: 1rem;
  overflow: hidden;
`,Jj=x.div`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${({progress:t})=>t}%;
`,Hj=x.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: #2563eb;
  }
`,Vj=x.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`,Kj=x.div`
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`,Gj=x.div`
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
`,qj=x.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`,Yj=x.div`
  padding: 2rem;
`,Qj=x.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.125rem;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
`,Xj=x.div`
  margin-bottom: 2rem;
`,kc=x.pre`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
  white-space: pre-wrap;
`,Zj=x.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
`,jc=x.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  &.primary {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;

    &:hover {
      background-color: #2563eb;
      border-color: #2563eb;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,eS=()=>{Jt();const[t,i]=S.useState(null),[s,c]=S.useState(0),[u,h]=S.useState(new Set),f=[{id:"oauth-basics",title:"OAuth 2.0 Fundamentals",description:"Learn the core concepts of OAuth 2.0 authorization framework",difficulty:"beginner",duration:"15 min",icon:Zt,steps:[{title:"What is OAuth 2.0?",content:"OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts on an HTTP service.",code:`// OAuth 2.0 Key Concepts
- Resource Owner: The user who owns the data
- Client: The application requesting access
- Authorization Server: Issues access tokens
- Resource Server: Hosts the protected resources`,type:"info"},{title:"OAuth Roles",content:"Understanding the four main roles in OAuth 2.0 ecosystem.",code:`Resource Owner (User)
    ↓ grants permission to
Client Application
    ↓ requests access from
Authorization Server
    ↓ issues tokens to
Resource Server (API)`,type:"diagram"},{title:"Access Tokens",content:"Bearer tokens that grant access to protected resources.",code:`// Example Access Token
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}`,type:"code"},{title:"Token Types",content:"Different types of tokens used in OAuth flows.",code:`Access Token: Short-lived, used for API calls
Refresh Token: Long-lived, used to get new access tokens
Authorization Code: Temporary code exchanged for tokens
ID Token: JWT containing user identity information`,type:"info"}]},{id:"auth-code-flow",title:"Authorization Code Flow",description:"Master the most secure OAuth flow for web applications",difficulty:"intermediate",duration:"25 min",icon:lo,steps:[{title:"Flow Overview",content:"The Authorization Code flow is the most secure flow for applications that can securely store client secrets.",code:`1. Client redirects user to Authorization Server
2. User authenticates and grants consent
3. Authorization Server redirects back with code
4. Client exchanges code for access token`,type:"steps"},{title:"Authorization Request",content:"The initial request to the authorization endpoint.",code:`GET /authorize?
  client_id=your_client_id
  &redirect_uri=https://your-app.com/callback
  &response_type=code
  &scope=openid profile email
  &state=xyz123
  &nonce=abc456`,type:"request"},{title:"Token Exchange",content:"Exchanging the authorization code for tokens.",code:`POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=your_client_id
&client_secret=your_client_secret
&code=auth_code_from_redirect
&redirect_uri=https://your-app.com/callback`,type:"request"},{title:"Security Features",content:"Built-in security measures of the Authorization Code flow.",code:`✅ Client authentication required
✅ Authorization code is short-lived
✅ Tokens never exposed to user agent
✅ Supports refresh tokens
✅ PKCE support for enhanced security`,type:"security"}]},{id:"openid-connect",title:"OpenID Connect Deep Dive",description:"Complete guide to identity layer on top of OAuth 2.0",difficulty:"advanced",duration:"35 min",icon:Pm,steps:[{title:"OIDC vs OAuth",content:"Understanding the relationship between OpenID Connect and OAuth 2.0.",code:`OAuth 2.0: Authorization framework
  ↓
OpenID Connect: Identity layer on OAuth 2.0

OIDC adds:
• ID Tokens (JWT with user identity)
• UserInfo endpoint
• Standard claims
• Discovery document
• Dynamic client registration`,type:"comparison"},{title:"ID Token Structure",content:"Anatomy of a JWT ID Token.",code:`Header: {"alg": "RS256", "typ": "JWT"}
Payload: {
  "iss": "https://auth.example.com",
  "sub": "user123",
  "aud": "client_id",
  "exp": 1638360000,
  "iat": 1638356400,
  "name": "John Doe",
  "email": "john@example.com"
}
Signature: Base64Url-encoded signature`,type:"jwt"},{title:"Standard Claims",content:"Common claims included in ID tokens.",code:`sub: Subject (unique user identifier)
name: Full name
given_name: First name
family_name: Last name
email: Email address
email_verified: Email verification status
picture: Profile picture URL
locale: User locale
zoneinfo: Time zone`,type:"claims"},{title:"Discovery & Metadata",content:"How clients discover OIDC provider capabilities.",code:`GET /.well-known/openid-configuration

Response includes:
• authorization_endpoint
• token_endpoint
• userinfo_endpoint
• jwks_uri (JSON Web Key Set)
• issuer
• supported scopes
• supported response types`,type:"discovery"}]},{id:"security-best-practices",title:"Security Best Practices",description:"Essential security measures for OAuth and OIDC implementations",difficulty:"advanced",duration:"30 min",icon:Zt,steps:[{title:"Secure Token Storage",content:"Best practices for storing access tokens and refresh tokens.",code:`✅ Use HttpOnly, Secure, SameSite cookies
✅ Store tokens in secure storage (not localStorage)
✅ Implement token rotation
✅ Use short-lived access tokens
✅ Validate tokens on every request`,type:"security"},{title:"PKCE (Proof Key for Code Exchange)",content:"Enhanced security for public clients.",code:`1. Client generates code_verifier (random string)
2. Creates code_challenge = BASE64URL(SHA256(code_verifier))
3. Sends code_challenge in authorization request
4. Authorization Server stores code_challenge
5. Client sends code_verifier in token request
6. Server validates: SHA256(code_verifier) === stored_challenge`,type:"security"},{title:"State Parameter Protection",content:"Preventing CSRF attacks with state parameters.",code:`// Generate cryptographically secure state
const state = crypto.randomBytes(32).toString('hex');

// Store state in session
session.state = state;

// Include in authorization request
GET /authorize?client_id=...&state=${state}

// Validate on callback
if (req.query.state !== session.state) {
  throw new Error('Invalid state parameter');
}`,type:"security"},{title:"Token Validation",content:"Properly validating JWT tokens.",code:`✅ Verify signature using JWKS
✅ Check expiration (exp claim)
✅ Validate issuer (iss claim)
✅ Check audience (aud claim)
✅ Verify not before (nbf claim)
✅ Validate nonce (if present)
✅ Check token type and scope`,type:"validation"}]}],v=b=>{i(b),c(0)},m=()=>{t&&s<t.steps.length-1&&c(s+1)},g=()=>{s>0&&c(s-1)},k=()=>{t&&(h(b=>new Set([...b,t.id])),i(null),c(0))},w=b=>{switch(b.type){case"code":return n.jsxs("div",{children:[n.jsx("p",{children:b.content}),n.jsx(kc,{children:b.code})]});case"diagram":return n.jsxs("div",{children:[n.jsx("p",{children:b.content}),n.jsx("div",{style:{backgroundColor:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"0.5rem",padding:"1rem",fontFamily:"monospace",whiteSpace:"pre-line"},children:b.code})]});case"info":return n.jsxs("div",{children:[n.jsx("p",{children:b.content}),n.jsx(kc,{children:b.code})]});case"security":return n.jsxs("div",{children:[n.jsx("p",{children:b.content}),n.jsx("div",{style:{backgroundColor:"#dcfce7",border:"1px solid #bbf7d0",borderRadius:"0.5rem",padding:"1rem",fontFamily:"monospace",color:"#166534"},children:b.code})]});default:return n.jsxs("div",{children:[n.jsx("p",{children:b.content}),n.jsx(kc,{children:b.code})]})}};return n.jsxs(Dj,{children:[n.jsxs(Lj,{children:[n.jsxs("h1",{children:[n.jsx(si,{}),"Interactive Tutorials"]}),n.jsx("p",{children:"Step-by-step guided learning paths to master OAuth 2.0 and OpenID Connect. Choose a tutorial and follow along with interactive examples and explanations."})]}),n.jsx(Uj,{children:f.map(b=>{const R=u.has(b.id)?100:(t==null?void 0:t.id)===b.id?Math.round(s/b.steps.length*100):0;return n.jsx(Mj,{onClick:()=>v(b),children:n.jsxs(be,{style:{textAlign:"center"},children:[n.jsx(Fj,{className:b.difficulty,children:n.jsx(b.icon,{size:32})}),n.jsx("h3",{style:{fontSize:"1.25rem",fontWeight:"600",marginBottom:"0.5rem"},children:b.title}),n.jsx("p",{style:{color:"#6b7280",marginBottom:"1rem",lineHeight:"1.5"},children:b.description}),n.jsxs(Wj,{className:b.difficulty,children:[n.jsx(i1,{size:12}),b.difficulty.charAt(0).toUpperCase()+b.difficulty.slice(1)]}),n.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",marginBottom:"1rem"},children:[n.jsx(Im,{size:14,style:{color:"#6b7280"}}),n.jsx("span",{style:{fontSize:"0.875rem",color:"#6b7280"},children:b.duration})]}),R>0&&n.jsxs("div",{style:{marginBottom:"1rem"},children:[n.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"0.5rem"},children:[n.jsx("span",{style:{fontSize:"0.875rem",color:"#6b7280"},children:"Progress"}),n.jsxs("span",{style:{fontSize:"0.875rem",color:"#6b7280"},children:[R,"%"]})]}),n.jsx(Bj,{children:n.jsx(Jj,{progress:R})})]}),n.jsxs(Hj,{children:[n.jsx(mr,{size:16}),u.has(b.id)?"Review Tutorial":"Start Tutorial"]})]})},b.id)})}),t&&n.jsx(Vj,{children:n.jsxs(Kj,{children:[n.jsxs(Gj,{children:[n.jsx("h2",{children:t.title}),n.jsx(qj,{onClick:()=>i(null),children:"×"})]}),n.jsxs(Yj,{children:[n.jsxs(Qj,{children:[n.jsx("div",{className:"step-number",children:s+1}),n.jsx("h3",{children:t.steps[s].title})]}),n.jsx(Xj,{children:w(t.steps[s])}),n.jsxs(Zj,{children:[n.jsxs(jc,{onClick:g,disabled:s===0,children:[n.jsx(Lp,{size:16,style:{transform:"rotate(180deg)"}}),"Previous"]}),n.jsxs("div",{style:{fontSize:"0.875rem",color:"#6b7280"},children:["Step ",s+1," of ",t.steps.length]}),s===t.steps.length-1?n.jsxs(jc,{className:"primary",onClick:k,children:["Complete Tutorial",n.jsx(ut,{size:16})]}):n.jsxs(jc,{onClick:m,children:["Next",n.jsx(Lp,{size:16})]})]})]})]})})]})},tS=x.div`
  display: flex;
  min-height: 100vh;
  background-color: ${({theme:t})=>t.colors.gray100};
`,rS=x.main`
  flex: 1;
  padding: 1.5rem;
  margin-left: 250px;
  margin-top: 60px;
  overflow-y: auto;
  transition: margin 0.3s ease;
  
  @media (max-width: ${({theme:t})=>t.breakpoints.lg}) {
    margin-left: 0;
    padding: 1rem;
    margin-top: 60px;
  }
`,ur=({children:t})=>{const{isAuthenticated:i,isLoading:s}=gn(),c=vt();return s?n.jsx("div",{children:"Loading..."}):i?t:n.jsx(Sh,{to:"/login",state:{from:c,message:"Please log in to access this page.",type:"info"},replace:!0})},nS=()=>{const[t,i]=S.useState(!1),[s,c]=S.useState(!1),u=vt();S.useEffect(()=>{i(!1)},[u]),S.useEffect(()=>{setTimeout(()=>{console.log("🔍 [App] Checking for existing configuration...");try{const m=localStorage.getItem("pingone_config"),g=localStorage.getItem("login_credentials");console.log("🔍 [App] Configuration check:",{hasSavedConfig:!!m,hasSavedCreds:!!g,savedConfigKeys:m?Object.keys(JSON.parse(m)):[],savedCredsKeys:g?Object.keys(JSON.parse(g)):[]}),!m&&!g?(console.log("⚠️ [App] No credentials found, showing setup modal"),c(!0)):(console.log("✅ [App] Credentials found, skipping setup modal"),c(!1))}catch(m){console.warn("❌ [App] Error checking configuration:",m),c(!0)}},100)},[]);const h=()=>{i(!t)},f=()=>{c(!1),console.log("Credential setup completed, modal hidden")};return n.jsxs(n.Fragment,{children:[n.jsxs(tS,{children:[n.jsx(u1,{toggleSidebar:h}),n.jsx(p1,{isOpen:t,onClose:()=>i(!1)}),n.jsx(rS,{children:n.jsxs(zy,{children:[n.jsx(We,{path:"/login",element:n.jsx(X1,{})}),n.jsx(We,{path:"/callback",element:n.jsx(rw,{})}),n.jsx(We,{path:"/",element:n.jsx(Sh,{to:"/dashboard",replace:!0})}),n.jsx(We,{path:"/dashboard",element:n.jsx(ur,{children:n.jsx(_1,{})})}),n.jsxs(We,{path:"/flows",element:n.jsx(ur,{children:n.jsx(E1,{})}),children:[n.jsx(We,{path:"authorization-code",element:n.jsx(_k,{})}),n.jsx(We,{path:"implicit",element:n.jsx(gw,{})}),n.jsx(We,{path:"client-credentials",element:n.jsx(Pw,{})}),n.jsx(We,{path:"pkce",element:n.jsx(Qw,{})}),n.jsx(We,{path:"device-code",element:n.jsx(pk,{})})]}),n.jsxs(We,{path:"/oidc",element:n.jsx(ur,{children:n.jsx(dj,{})}),children:[n.jsx(We,{path:"userinfo",element:n.jsx(Bk,{})}),n.jsx(We,{path:"id-tokens",element:n.jsx(sj,{})})]}),n.jsx(We,{path:"/configuration",element:n.jsx(ur,{children:n.jsx(A1,{})})}),n.jsx(We,{path:"/documentation",element:n.jsx(ur,{children:n.jsx(D1,{})})}),n.jsx(We,{path:"/token-management",element:n.jsx(ur,{children:n.jsx(gj,{})})}),n.jsx(We,{path:"/ai-overview",element:n.jsx(ur,{children:n.jsx(_j,{})})}),n.jsx(We,{path:"/advanced-config",element:n.jsx(ur,{children:n.jsx(Nj,{})})}),n.jsx(We,{path:"/tutorials",element:n.jsx(ur,{children:n.jsx(eS,{})})}),n.jsx(We,{path:"*",element:n.jsx("div",{children:"Not Found"})})]})})]}),n.jsx(k1,{isOpen:s,onComplete:f})]})};function oS(){return n.jsx(Qh,{theme:jm,children:n.jsx(Uv,{children:n.jsxs(Mv,{children:[n.jsx(Sm,{}),n.jsx(nS,{})]})})})}M0.createRoot(document.getElementById("root")).render(n.jsx(He.StrictMode,{children:n.jsx(My,{future:{v7_startTransition:!0,v7_relativeSplatPath:!0},children:n.jsxs(Qh,{theme:jm,children:[n.jsx(Sm,{}),n.jsx(oS,{})]})})}));
//# sourceMappingURL=index-DHpBV_mi.js.map
