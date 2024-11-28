var Yt=Object.create;var J=Object.defineProperty;var Wt=Object.getOwnPropertyDescriptor;var zt=Object.getOwnPropertyNames;var Jt=Object.getPrototypeOf,Kt=Object.prototype.hasOwnProperty;var o=(r,e)=>J(r,"name",{value:e,configurable:!0});var Qt=(r,e)=>()=>(r&&(e=r(r=0)),e);var R=(r,e)=>()=>(e||r((e={exports:{}}).exports,e),e.exports),Zt=(r,e)=>{for(var t in e)J(r,t,{get:e[t],enumerable:!0})},es=(r,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of zt(e))!Kt.call(r,n)&&n!==t&&J(r,n,{get:()=>e[n],enumerable:!(s=Wt(e,n))||s.enumerable});return r};var xe=(r,e,t)=>(t=r!=null?Yt(Jt(r)):{},es(e||!r||!r.__esModule?J(t,"default",{value:r,enumerable:!0}):t,r));var a=Qt(()=>{"use strict"});var be=R((Go,De)=>{"use strict";a();De.exports=o(function(e,t){var s,n;typeof t=="function"?n=t:s=t;var i=Object.keys(e);return(s||[]).concat(i.sort(n)).reduce(function(c,l){return i.indexOf(l)!==-1&&(c[l]=e[l]),c},Object.create(null))},"sortObjectByKeyNameList")});var U=R((Zo,Ve)=>{"use strict";a();var us="2.0.0",ps=Number.MAX_SAFE_INTEGER||9007199254740991,fs=16,hs=250,Es=["major","premajor","minor","preminor","patch","prepatch","prerelease"];Ve.exports={MAX_LENGTH:256,MAX_SAFE_COMPONENT_LENGTH:fs,MAX_SAFE_BUILD_LENGTH:hs,MAX_SAFE_INTEGER:ps,RELEASE_TYPES:Es,SEMVER_SPEC_VERSION:us,FLAG_INCLUDE_PRERELEASE:1,FLAG_LOOSE:2}});var V=R((ra,_e)=>{"use strict";a();var ms=typeof process=="object"&&process.env&&process.env.NODE_DEBUG&&/\bsemver\b/i.test(process.env.NODE_DEBUG)?(...r)=>console.error("SEMVER",...r):()=>{};_e.exports=ms});var D=R((C,Xe)=>{"use strict";a();var{MAX_SAFE_COMPONENT_LENGTH:Ee,MAX_SAFE_BUILD_LENGTH:ds,MAX_LENGTH:ys}=U(),Rs=V();C=Xe.exports={};var gs=C.re=[],$s=C.safeRe=[],u=C.src=[],p=C.t={},Is=0,me="[a-zA-Z0-9-]",vs=[["\\s",1],["\\d",ys],[me,ds]],Os=o(r=>{for(let[e,t]of vs)r=r.split(`${e}*`).join(`${e}{0,${t}}`).split(`${e}+`).join(`${e}{1,${t}}`);return r},"makeSafeRegex"),g=o((r,e,t)=>{let s=Os(e),n=Is++;Rs(r,n,e),p[r]=n,u[n]=e,gs[n]=new RegExp(e,t?"g":void 0),$s[n]=new RegExp(s,t?"g":void 0)},"createToken");g("NUMERICIDENTIFIER","0|[1-9]\\d*");g("NUMERICIDENTIFIERLOOSE","\\d+");g("NONNUMERICIDENTIFIER",`\\d*[a-zA-Z-]${me}*`);g("MAINVERSION",`(${u[p.NUMERICIDENTIFIER]})\\.(${u[p.NUMERICIDENTIFIER]})\\.(${u[p.NUMERICIDENTIFIER]})`);g("MAINVERSIONLOOSE",`(${u[p.NUMERICIDENTIFIERLOOSE]})\\.(${u[p.NUMERICIDENTIFIERLOOSE]})\\.(${u[p.NUMERICIDENTIFIERLOOSE]})`);g("PRERELEASEIDENTIFIER",`(?:${u[p.NUMERICIDENTIFIER]}|${u[p.NONNUMERICIDENTIFIER]})`);g("PRERELEASEIDENTIFIERLOOSE",`(?:${u[p.NUMERICIDENTIFIERLOOSE]}|${u[p.NONNUMERICIDENTIFIER]})`);g("PRERELEASE",`(?:-(${u[p.PRERELEASEIDENTIFIER]}(?:\\.${u[p.PRERELEASEIDENTIFIER]})*))`);g("PRERELEASELOOSE",`(?:-?(${u[p.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${u[p.PRERELEASEIDENTIFIERLOOSE]})*))`);g("BUILDIDENTIFIER",`${me}+`);g("BUILD",`(?:\\+(${u[p.BUILDIDENTIFIER]}(?:\\.${u[p.BUILDIDENTIFIER]})*))`);g("FULLPLAIN",`v?${u[p.MAINVERSION]}${u[p.PRERELEASE]}?${u[p.BUILD]}?`);g("FULL",`^${u[p.FULLPLAIN]}$`);g("LOOSEPLAIN",`[v=\\s]*${u[p.MAINVERSIONLOOSE]}${u[p.PRERELEASELOOSE]}?${u[p.BUILD]}?`);g("LOOSE",`^${u[p.LOOSEPLAIN]}$`);g("GTLT","((?:<|>)?=?)");g("XRANGEIDENTIFIERLOOSE",`${u[p.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);g("XRANGEIDENTIFIER",`${u[p.NUMERICIDENTIFIER]}|x|X|\\*`);g("XRANGEPLAIN",`[v=\\s]*(${u[p.XRANGEIDENTIFIER]})(?:\\.(${u[p.XRANGEIDENTIFIER]})(?:\\.(${u[p.XRANGEIDENTIFIER]})(?:${u[p.PRERELEASE]})?${u[p.BUILD]}?)?)?`);g("XRANGEPLAINLOOSE",`[v=\\s]*(${u[p.XRANGEIDENTIFIERLOOSE]})(?:\\.(${u[p.XRANGEIDENTIFIERLOOSE]})(?:\\.(${u[p.XRANGEIDENTIFIERLOOSE]})(?:${u[p.PRERELEASELOOSE]})?${u[p.BUILD]}?)?)?`);g("XRANGE",`^${u[p.GTLT]}\\s*${u[p.XRANGEPLAIN]}$`);g("XRANGELOOSE",`^${u[p.GTLT]}\\s*${u[p.XRANGEPLAINLOOSE]}$`);g("COERCEPLAIN",`(^|[^\\d])(\\d{1,${Ee}})(?:\\.(\\d{1,${Ee}}))?(?:\\.(\\d{1,${Ee}}))?`);g("COERCE",`${u[p.COERCEPLAIN]}(?:$|[^\\d])`);g("COERCEFULL",u[p.COERCEPLAIN]+`(?:${u[p.PRERELEASE]})?(?:${u[p.BUILD]})?(?:$|[^\\d])`);g("COERCERTL",u[p.COERCE],!0);g("COERCERTLFULL",u[p.COERCEFULL],!0);g("LONETILDE","(?:~>?)");g("TILDETRIM",`(\\s*)${u[p.LONETILDE]}\\s+`,!0);C.tildeTrimReplace="$1~";g("TILDE",`^${u[p.LONETILDE]}${u[p.XRANGEPLAIN]}$`);g("TILDELOOSE",`^${u[p.LONETILDE]}${u[p.XRANGEPLAINLOOSE]}$`);g("LONECARET","(?:\\^)");g("CARETTRIM",`(\\s*)${u[p.LONECARET]}\\s+`,!0);C.caretTrimReplace="$1^";g("CARET",`^${u[p.LONECARET]}${u[p.XRANGEPLAIN]}$`);g("CARETLOOSE",`^${u[p.LONECARET]}${u[p.XRANGEPLAINLOOSE]}$`);g("COMPARATORLOOSE",`^${u[p.GTLT]}\\s*(${u[p.LOOSEPLAIN]})$|^$`);g("COMPARATOR",`^${u[p.GTLT]}\\s*(${u[p.FULLPLAIN]})$|^$`);g("COMPARATORTRIM",`(\\s*)${u[p.GTLT]}\\s*(${u[p.LOOSEPLAIN]}|${u[p.XRANGEPLAIN]})`,!0);C.comparatorTrimReplace="$1$2$3";g("HYPHENRANGE",`^\\s*(${u[p.XRANGEPLAIN]})\\s+-\\s+(${u[p.XRANGEPLAIN]})\\s*$`);g("HYPHENRANGELOOSE",`^\\s*(${u[p.XRANGEPLAINLOOSE]})\\s+-\\s+(${u[p.XRANGEPLAINLOOSE]})\\s*$`);g("STAR","(<|>)?=?\\s*\\*");g("GTE0","^\\s*>=\\s*0\\.0\\.0\\s*$");g("GTE0PRE","^\\s*>=\\s*0\\.0\\.0-0\\s*$")});var K=R((ia,He)=>{"use strict";a();var Ns=Object.freeze({loose:!0}),Ls=Object.freeze({}),Ss=o(r=>r?typeof r!="object"?Ns:r:Ls,"parseOptions");He.exports=Ss});var de=R((ca,Ye)=>{"use strict";a();var Be=/^[0-9]+$/,Me=o((r,e)=>{let t=Be.test(r),s=Be.test(e);return t&&s&&(r=+r,e=+e),r===e?0:t&&!s?-1:s&&!t?1:r<e?-1:1},"compareIdentifiers"),ks=o((r,e)=>Me(e,r),"rcompareIdentifiers");Ye.exports={compareIdentifiers:Me,rcompareIdentifiers:ks}});var N=R((pa,Ke)=>{"use strict";a();var Q=V(),{MAX_LENGTH:We,MAX_SAFE_INTEGER:Z}=U(),{safeRe:ze,t:Je}=D(),As=K(),{compareIdentifiers:b}=de(),Ts=class P{static{o(this,"SemVer")}constructor(e,t){if(t=As(t),e instanceof P){if(e.loose===!!t.loose&&e.includePrerelease===!!t.includePrerelease)return e;e=e.version}else if(typeof e!="string")throw new TypeError(`Invalid version. Must be a string. Got type "${typeof e}".`);if(e.length>We)throw new TypeError(`version is longer than ${We} characters`);Q("SemVer",e,t),this.options=t,this.loose=!!t.loose,this.includePrerelease=!!t.includePrerelease;let s=e.trim().match(t.loose?ze[Je.LOOSE]:ze[Je.FULL]);if(!s)throw new TypeError(`Invalid Version: ${e}`);if(this.raw=e,this.major=+s[1],this.minor=+s[2],this.patch=+s[3],this.major>Z||this.major<0)throw new TypeError("Invalid major version");if(this.minor>Z||this.minor<0)throw new TypeError("Invalid minor version");if(this.patch>Z||this.patch<0)throw new TypeError("Invalid patch version");s[4]?this.prerelease=s[4].split(".").map(n=>{if(/^[0-9]+$/.test(n)){let i=+n;if(i>=0&&i<Z)return i}return n}):this.prerelease=[],this.build=s[5]?s[5].split("."):[],this.format()}format(){return this.version=`${this.major}.${this.minor}.${this.patch}`,this.prerelease.length&&(this.version+=`-${this.prerelease.join(".")}`),this.version}toString(){return this.version}compare(e){if(Q("SemVer.compare",this.version,this.options,e),!(e instanceof P)){if(typeof e=="string"&&e===this.version)return 0;e=new P(e,this.options)}return e.version===this.version?0:this.compareMain(e)||this.comparePre(e)}compareMain(e){return e instanceof P||(e=new P(e,this.options)),b(this.major,e.major)||b(this.minor,e.minor)||b(this.patch,e.patch)}comparePre(e){if(e instanceof P||(e=new P(e,this.options)),this.prerelease.length&&!e.prerelease.length)return-1;if(!this.prerelease.length&&e.prerelease.length)return 1;if(!this.prerelease.length&&!e.prerelease.length)return 0;let t=0;do{let s=this.prerelease[t],n=e.prerelease[t];if(Q("prerelease compare",t,s,n),s===void 0&&n===void 0)return 0;if(n===void 0)return 1;if(s===void 0)return-1;if(s===n)continue;return b(s,n)}while(++t)}compareBuild(e){e instanceof P||(e=new P(e,this.options));let t=0;do{let s=this.build[t],n=e.build[t];if(Q("build compare",t,s,n),s===void 0&&n===void 0)return 0;if(n===void 0)return 1;if(s===void 0)return-1;if(s===n)continue;return b(s,n)}while(++t)}inc(e,t,s){switch(e){case"premajor":this.prerelease.length=0,this.patch=0,this.minor=0,this.major++,this.inc("pre",t,s);break;case"preminor":this.prerelease.length=0,this.patch=0,this.minor++,this.inc("pre",t,s);break;case"prepatch":this.prerelease.length=0,this.inc("patch",t,s),this.inc("pre",t,s);break;case"prerelease":this.prerelease.length===0&&this.inc("patch",t,s),this.inc("pre",t,s);break;case"major":(this.minor!==0||this.patch!==0||this.prerelease.length===0)&&this.major++,this.minor=0,this.patch=0,this.prerelease=[];break;case"minor":(this.patch!==0||this.prerelease.length===0)&&this.minor++,this.patch=0,this.prerelease=[];break;case"patch":this.prerelease.length===0&&this.patch++,this.prerelease=[];break;case"pre":{let n=Number(s)?1:0;if(!t&&s===!1)throw new Error("invalid increment argument: identifier is empty");if(this.prerelease.length===0)this.prerelease=[n];else{let i=this.prerelease.length;for(;--i>=0;)typeof this.prerelease[i]=="number"&&(this.prerelease[i]++,i=-2);if(i===-1){if(t===this.prerelease.join(".")&&s===!1)throw new Error("invalid increment argument: identifier already exists");this.prerelease.push(n)}}if(t){let i=[t,n];s===!1&&(i=[t]),b(this.prerelease[0],t)===0?isNaN(this.prerelease[1])&&(this.prerelease=i):this.prerelease=i}break}default:throw new Error(`invalid increment argument: ${e}`)}return this.raw=this.format(),this.build.length&&(this.raw+=`+${this.build.join(".")}`),this}};Ke.exports=Ts});var x=R((Ea,Ze)=>{"use strict";a();var Qe=N(),ws=o((r,e,t=!1)=>{if(r instanceof Qe)return r;try{return new Qe(r,e)}catch(s){if(!t)return null;throw s}},"parse");Ze.exports=ws});var rr=R((ya,er)=>{"use strict";a();var qs=x(),Ps=o((r,e)=>{let t=qs(r,e);return t?t.version:null},"valid");er.exports=Ps});var sr=R(($a,tr)=>{"use strict";a();var Cs=x(),xs=o((r,e)=>{let t=Cs(r.trim().replace(/^[=v]+/,""),e);return t?t.version:null},"clean");tr.exports=xs});var or=R((Oa,ir)=>{"use strict";a();var nr=N(),Ds=o((r,e,t,s,n)=>{typeof t=="string"&&(n=s,s=t,t=void 0);try{return new nr(r instanceof nr?r.version:r,t).inc(e,s,n).version}catch{return null}},"inc");ir.exports=Ds});var lr=R((Sa,cr)=>{"use strict";a();var ar=x(),bs=o((r,e)=>{let t=ar(r,null,!0),s=ar(e,null,!0),n=t.compare(s);if(n===0)return null;let i=n>0,c=i?t:s,l=i?s:t,f=!!c.prerelease.length;if(!!l.prerelease.length&&!f)return!l.patch&&!l.minor?"major":c.patch?"patch":c.minor?"minor":"major";let $=f?"pre":"";return t.major!==s.major?$+"major":t.minor!==s.minor?$+"minor":t.patch!==s.patch?$+"patch":"prerelease"},"diff");cr.exports=bs});var pr=R((Ta,ur)=>{"use strict";a();var js=N(),Gs=o((r,e)=>new js(r,e).major,"major");ur.exports=Gs});var hr=R((Pa,fr)=>{"use strict";a();var Fs=N(),Us=o((r,e)=>new Fs(r,e).minor,"minor");fr.exports=Us});var mr=R((Da,Er)=>{"use strict";a();var Vs=N(),_s=o((r,e)=>new Vs(r,e).patch,"patch");Er.exports=_s});var yr=R((Ga,dr)=>{"use strict";a();var Xs=x(),Hs=o((r,e)=>{let t=Xs(r,e);return t&&t.prerelease.length?t.prerelease:null},"prerelease");dr.exports=Hs});var T=R((Va,gr)=>{"use strict";a();var Rr=N(),Bs=o((r,e,t)=>new Rr(r,t).compare(new Rr(e,t)),"compare");gr.exports=Bs});var Ir=R((Ha,$r)=>{"use strict";a();var Ms=T(),Ys=o((r,e,t)=>Ms(e,r,t),"rcompare");$r.exports=Ys});var Or=R((Ya,vr)=>{"use strict";a();var Ws=T(),zs=o((r,e)=>Ws(r,e,!0),"compareLoose");vr.exports=zs});var ee=R((Ja,Lr)=>{"use strict";a();var Nr=N(),Js=o((r,e,t)=>{let s=new Nr(r,t),n=new Nr(e,t);return s.compare(n)||s.compareBuild(n)},"compareBuild");Lr.exports=Js});var kr=R((Za,Sr)=>{"use strict";a();var Ks=ee(),Qs=o((r,e)=>r.sort((t,s)=>Ks(t,s,e)),"sort");Sr.exports=Qs});var Tr=R((tc,Ar)=>{"use strict";a();var Zs=ee(),en=o((r,e)=>r.sort((t,s)=>Zs(s,t,e)),"rsort");Ar.exports=en});var _=R((ic,wr)=>{"use strict";a();var rn=T(),tn=o((r,e,t)=>rn(r,e,t)>0,"gt");wr.exports=tn});var re=R((cc,qr)=>{"use strict";a();var sn=T(),nn=o((r,e,t)=>sn(r,e,t)<0,"lt");qr.exports=nn});var ye=R((pc,Pr)=>{"use strict";a();var on=T(),an=o((r,e,t)=>on(r,e,t)===0,"eq");Pr.exports=an});var Re=R((Ec,Cr)=>{"use strict";a();var cn=T(),ln=o((r,e,t)=>cn(r,e,t)!==0,"neq");Cr.exports=ln});var te=R((yc,xr)=>{"use strict";a();var un=T(),pn=o((r,e,t)=>un(r,e,t)>=0,"gte");xr.exports=pn});var se=R(($c,Dr)=>{"use strict";a();var fn=T(),hn=o((r,e,t)=>fn(r,e,t)<=0,"lte");Dr.exports=hn});var ge=R((Oc,br)=>{"use strict";a();var En=ye(),mn=Re(),dn=_(),yn=te(),Rn=re(),gn=se(),$n=o((r,e,t,s)=>{switch(e){case"===":return typeof r=="object"&&(r=r.version),typeof t=="object"&&(t=t.version),r===t;case"!==":return typeof r=="object"&&(r=r.version),typeof t=="object"&&(t=t.version),r!==t;case"":case"=":case"==":return En(r,t,s);case"!=":return mn(r,t,s);case">":return dn(r,t,s);case">=":return yn(r,t,s);case"<":return Rn(r,t,s);case"<=":return gn(r,t,s);default:throw new TypeError(`Invalid operator: ${e}`)}},"cmp");br.exports=$n});var Gr=R((Sc,jr)=>{"use strict";a();var In=N(),vn=x(),{safeRe:ne,t:ie}=D(),On=o((r,e)=>{if(r instanceof In)return r;if(typeof r=="number"&&(r=String(r)),typeof r!="string")return null;e=e||{};let t=null;if(!e.rtl)t=r.match(e.includePrerelease?ne[ie.COERCEFULL]:ne[ie.COERCE]);else{let f=e.includePrerelease?ne[ie.COERCERTLFULL]:ne[ie.COERCERTL],y;for(;(y=f.exec(r))&&(!t||t.index+t[0].length!==r.length);)(!t||y.index+y[0].length!==t.index+t[0].length)&&(t=y),f.lastIndex=y.index+y[1].length+y[2].length;f.lastIndex=-1}if(t===null)return null;let s=t[2],n=t[3]||"0",i=t[4]||"0",c=e.includePrerelease&&t[5]?`-${t[5]}`:"",l=e.includePrerelease&&t[6]?`+${t[6]}`:"";return vn(`${s}.${n}.${i}${c}${l}`,e)},"coerce");jr.exports=On});var Ur=R((wc,Fr)=>{"use strict";a();var Nn=class{static{o(this,"LRUCache")}constructor(){this.max=1e3,this.map=new Map}get(e){let t=this.map.get(e);if(t!==void 0)return this.map.delete(e),this.map.set(e,t),t}delete(e){return this.map.delete(e)}set(e,t){if(!this.delete(e)&&t!==void 0){if(this.map.size>=this.max){let n=this.map.keys().next().value;this.delete(n)}this.map.set(e,t)}return this}};Fr.exports=Nn});var w=R((Cc,Hr)=>{"use strict";a();var Ln=/\s+/g,Sn=class oe{static{o(this,"Range")}constructor(e,t){if(t=An(t),e instanceof oe)return e.loose===!!t.loose&&e.includePrerelease===!!t.includePrerelease?e:new oe(e.raw,t);if(e instanceof $e)return this.raw=e.value,this.set=[[e]],this.formatted=void 0,this;if(this.options=t,this.loose=!!t.loose,this.includePrerelease=!!t.includePrerelease,this.raw=e.trim().replace(Ln," "),this.set=this.raw.split("||").map(s=>this.parseRange(s.trim())).filter(s=>s.length),!this.set.length)throw new TypeError(`Invalid SemVer Range: ${this.raw}`);if(this.set.length>1){let s=this.set[0];if(this.set=this.set.filter(n=>!_r(n[0])),this.set.length===0)this.set=[s];else if(this.set.length>1){for(let n of this.set)if(n.length===1&&Dn(n[0])){this.set=[n];break}}}this.formatted=void 0}get range(){if(this.formatted===void 0){this.formatted="";for(let e=0;e<this.set.length;e++){e>0&&(this.formatted+="||");let t=this.set[e];for(let s=0;s<t.length;s++)s>0&&(this.formatted+=" "),this.formatted+=t[s].toString().trim()}}return this.formatted}format(){return this.range}toString(){return this.range}parseRange(e){let s=((this.options.includePrerelease&&Cn)|(this.options.loose&&xn))+":"+e,n=Vr.get(s);if(n)return n;let i=this.options.loose,c=i?A[S.HYPHENRANGELOOSE]:A[S.HYPHENRANGE];e=e.replace(c,Bn(this.options.includePrerelease)),O("hyphen replace",e),e=e.replace(A[S.COMPARATORTRIM],wn),O("comparator trim",e),e=e.replace(A[S.TILDETRIM],qn),O("tilde trim",e),e=e.replace(A[S.CARETTRIM],Pn),O("caret trim",e);let l=e.split(" ").map(h=>bn(h,this.options)).join(" ").split(/\s+/).map(h=>Hn(h,this.options));i&&(l=l.filter(h=>(O("loose invalid filter",h,this.options),!!h.match(A[S.COMPARATORLOOSE])))),O("range list",l);let f=new Map,y=l.map(h=>new $e(h,this.options));for(let h of y){if(_r(h))return[h];f.set(h.value,h)}f.size>1&&f.has("")&&f.delete("");let $=[...f.values()];return Vr.set(s,$),$}intersects(e,t){if(!(e instanceof oe))throw new TypeError("a Range is required");return this.set.some(s=>Xr(s,t)&&e.set.some(n=>Xr(n,t)&&s.every(i=>n.every(c=>i.intersects(c,t)))))}test(e){if(!e)return!1;if(typeof e=="string")try{e=new Tn(e,this.options)}catch{return!1}for(let t=0;t<this.set.length;t++)if(Mn(this.set[t],e,this.options))return!0;return!1}};Hr.exports=Sn;var kn=Ur(),Vr=new kn,An=K(),$e=X(),O=V(),Tn=N(),{safeRe:A,t:S,comparatorTrimReplace:wn,tildeTrimReplace:qn,caretTrimReplace:Pn}=D(),{FLAG_INCLUDE_PRERELEASE:Cn,FLAG_LOOSE:xn}=U(),_r=o(r=>r.value==="<0.0.0-0","isNullSet"),Dn=o(r=>r.value==="","isAny"),Xr=o((r,e)=>{let t=!0,s=r.slice(),n=s.pop();for(;t&&s.length;)t=s.every(i=>n.intersects(i,e)),n=s.pop();return t},"isSatisfiable"),bn=o((r,e)=>(O("comp",r,e),r=Fn(r,e),O("caret",r),r=jn(r,e),O("tildes",r),r=Vn(r,e),O("xrange",r),r=Xn(r,e),O("stars",r),r),"parseComparator"),k=o(r=>!r||r.toLowerCase()==="x"||r==="*","isX"),jn=o((r,e)=>r.trim().split(/\s+/).map(t=>Gn(t,e)).join(" "),"replaceTildes"),Gn=o((r,e)=>{let t=e.loose?A[S.TILDELOOSE]:A[S.TILDE];return r.replace(t,(s,n,i,c,l)=>{O("tilde",r,s,n,i,c,l);let f;return k(n)?f="":k(i)?f=`>=${n}.0.0 <${+n+1}.0.0-0`:k(c)?f=`>=${n}.${i}.0 <${n}.${+i+1}.0-0`:l?(O("replaceTilde pr",l),f=`>=${n}.${i}.${c}-${l} <${n}.${+i+1}.0-0`):f=`>=${n}.${i}.${c} <${n}.${+i+1}.0-0`,O("tilde return",f),f})},"replaceTilde"),Fn=o((r,e)=>r.trim().split(/\s+/).map(t=>Un(t,e)).join(" "),"replaceCarets"),Un=o((r,e)=>{O("caret",r,e);let t=e.loose?A[S.CARETLOOSE]:A[S.CARET],s=e.includePrerelease?"-0":"";return r.replace(t,(n,i,c,l,f)=>{O("caret",r,n,i,c,l,f);let y;return k(i)?y="":k(c)?y=`>=${i}.0.0${s} <${+i+1}.0.0-0`:k(l)?i==="0"?y=`>=${i}.${c}.0${s} <${i}.${+c+1}.0-0`:y=`>=${i}.${c}.0${s} <${+i+1}.0.0-0`:f?(O("replaceCaret pr",f),i==="0"?c==="0"?y=`>=${i}.${c}.${l}-${f} <${i}.${c}.${+l+1}-0`:y=`>=${i}.${c}.${l}-${f} <${i}.${+c+1}.0-0`:y=`>=${i}.${c}.${l}-${f} <${+i+1}.0.0-0`):(O("no pr"),i==="0"?c==="0"?y=`>=${i}.${c}.${l}${s} <${i}.${c}.${+l+1}-0`:y=`>=${i}.${c}.${l}${s} <${i}.${+c+1}.0-0`:y=`>=${i}.${c}.${l} <${+i+1}.0.0-0`),O("caret return",y),y})},"replaceCaret"),Vn=o((r,e)=>(O("replaceXRanges",r,e),r.split(/\s+/).map(t=>_n(t,e)).join(" ")),"replaceXRanges"),_n=o((r,e)=>{r=r.trim();let t=e.loose?A[S.XRANGELOOSE]:A[S.XRANGE];return r.replace(t,(s,n,i,c,l,f)=>{O("xRange",r,s,n,i,c,l,f);let y=k(i),$=y||k(c),h=$||k(l),v=h;return n==="="&&v&&(n=""),f=e.includePrerelease?"-0":"",y?n===">"||n==="<"?s="<0.0.0-0":s="*":n&&v?($&&(c=0),l=0,n===">"?(n=">=",$?(i=+i+1,c=0,l=0):(c=+c+1,l=0)):n==="<="&&(n="<",$?i=+i+1:c=+c+1),n==="<"&&(f="-0"),s=`${n+i}.${c}.${l}${f}`):$?s=`>=${i}.0.0${f} <${+i+1}.0.0-0`:h&&(s=`>=${i}.${c}.0${f} <${i}.${+c+1}.0-0`),O("xRange return",s),s})},"replaceXRange"),Xn=o((r,e)=>(O("replaceStars",r,e),r.trim().replace(A[S.STAR],"")),"replaceStars"),Hn=o((r,e)=>(O("replaceGTE0",r,e),r.trim().replace(A[e.includePrerelease?S.GTE0PRE:S.GTE0],"")),"replaceGTE0"),Bn=o(r=>(e,t,s,n,i,c,l,f,y,$,h,v)=>(k(s)?t="":k(n)?t=`>=${s}.0.0${r?"-0":""}`:k(i)?t=`>=${s}.${n}.0${r?"-0":""}`:c?t=`>=${t}`:t=`>=${t}${r?"-0":""}`,k(y)?f="":k($)?f=`<${+y+1}.0.0-0`:k(h)?f=`<${y}.${+$+1}.0-0`:v?f=`<=${y}.${$}.${h}-${v}`:r?f=`<${y}.${$}.${+h+1}-0`:f=`<=${f}`,`${t} ${f}`.trim()),"hyphenReplace"),Mn=o((r,e,t)=>{for(let s=0;s<r.length;s++)if(!r[s].test(e))return!1;if(e.prerelease.length&&!t.includePrerelease){for(let s=0;s<r.length;s++)if(O(r[s].semver),r[s].semver!==$e.ANY&&r[s].semver.prerelease.length>0){let n=r[s].semver;if(n.major===e.major&&n.minor===e.minor&&n.patch===e.patch)return!0}return!1}return!0},"testSet")});var X=R((bc,Jr)=>{"use strict";a();var H=Symbol("SemVer ANY"),Yn=class Oe{static{o(this,"Comparator")}static get ANY(){return H}constructor(e,t){if(t=Br(t),e instanceof Oe){if(e.loose===!!t.loose)return e;e=e.value}e=e.trim().split(/\s+/).join(" "),ve("comparator",e,t),this.options=t,this.loose=!!t.loose,this.parse(e),this.semver===H?this.value="":this.value=this.operator+this.semver.version,ve("comp",this)}parse(e){let t=this.options.loose?Mr[Yr.COMPARATORLOOSE]:Mr[Yr.COMPARATOR],s=e.match(t);if(!s)throw new TypeError(`Invalid comparator: ${e}`);this.operator=s[1]!==void 0?s[1]:"",this.operator==="="&&(this.operator=""),s[2]?this.semver=new Wr(s[2],this.options.loose):this.semver=H}toString(){return this.value}test(e){if(ve("Comparator.test",e,this.options.loose),this.semver===H||e===H)return!0;if(typeof e=="string")try{e=new Wr(e,this.options)}catch{return!1}return Ie(e,this.operator,this.semver,this.options)}intersects(e,t){if(!(e instanceof Oe))throw new TypeError("a Comparator is required");return this.operator===""?this.value===""?!0:new zr(e.value,t).test(this.value):e.operator===""?e.value===""?!0:new zr(this.value,t).test(e.semver):(t=Br(t),t.includePrerelease&&(this.value==="<0.0.0-0"||e.value==="<0.0.0-0")||!t.includePrerelease&&(this.value.startsWith("<0.0.0")||e.value.startsWith("<0.0.0"))?!1:!!(this.operator.startsWith(">")&&e.operator.startsWith(">")||this.operator.startsWith("<")&&e.operator.startsWith("<")||this.semver.version===e.semver.version&&this.operator.includes("=")&&e.operator.includes("=")||Ie(this.semver,"<",e.semver,t)&&this.operator.startsWith(">")&&e.operator.startsWith("<")||Ie(this.semver,">",e.semver,t)&&this.operator.startsWith("<")&&e.operator.startsWith(">")))}};Jr.exports=Yn;var Br=K(),{safeRe:Mr,t:Yr}=D(),Ie=ge(),ve=V(),Wr=N(),zr=w()});var B=R((Fc,Kr)=>{"use strict";a();var Wn=w(),zn=o((r,e,t)=>{try{e=new Wn(e,t)}catch{return!1}return e.test(r)},"satisfies");Kr.exports=zn});var Zr=R((_c,Qr)=>{"use strict";a();var Jn=w(),Kn=o((r,e)=>new Jn(r,e).set.map(t=>t.map(s=>s.value).join(" ").trim().split(" ")),"toComparators");Qr.exports=Kn});var rt=R((Bc,et)=>{"use strict";a();var Qn=N(),Zn=w(),ei=o((r,e,t)=>{let s=null,n=null,i=null;try{i=new Zn(e,t)}catch{return null}return r.forEach(c=>{i.test(c)&&(!s||n.compare(c)===-1)&&(s=c,n=new Qn(s,t))}),s},"maxSatisfying");et.exports=ei});var st=R((Wc,tt)=>{"use strict";a();var ri=N(),ti=w(),si=o((r,e,t)=>{let s=null,n=null,i=null;try{i=new ti(e,t)}catch{return null}return r.forEach(c=>{i.test(c)&&(!s||n.compare(c)===1)&&(s=c,n=new ri(s,t))}),s},"minSatisfying");tt.exports=si});var ot=R((Kc,it)=>{"use strict";a();var Ne=N(),ni=w(),nt=_(),ii=o((r,e)=>{r=new ni(r,e);let t=new Ne("0.0.0");if(r.test(t)||(t=new Ne("0.0.0-0"),r.test(t)))return t;t=null;for(let s=0;s<r.set.length;++s){let n=r.set[s],i=null;n.forEach(c=>{let l=new Ne(c.semver.version);switch(c.operator){case">":l.prerelease.length===0?l.patch++:l.prerelease.push(0),l.raw=l.format();case"":case">=":(!i||nt(l,i))&&(i=l);break;case"<":case"<=":break;default:throw new Error(`Unexpected operation: ${c.operator}`)}}),i&&(!t||nt(t,i))&&(t=i)}return t&&r.test(t)?t:null},"minVersion");it.exports=ii});var ct=R((el,at)=>{"use strict";a();var oi=w(),ai=o((r,e)=>{try{return new oi(r,e).range||"*"}catch{return null}},"validRange");at.exports=ai});var ae=R((sl,ft)=>{"use strict";a();var ci=N(),pt=X(),{ANY:li}=pt,ui=w(),pi=B(),lt=_(),ut=re(),fi=se(),hi=te(),Ei=o((r,e,t,s)=>{r=new ci(r,s),e=new ui(e,s);let n,i,c,l,f;switch(t){case">":n=lt,i=fi,c=ut,l=">",f=">=";break;case"<":n=ut,i=hi,c=lt,l="<",f="<=";break;default:throw new TypeError('Must provide a hilo val of "<" or ">"')}if(pi(r,e,s))return!1;for(let y=0;y<e.set.length;++y){let $=e.set[y],h=null,v=null;if($.forEach(d=>{d.semver===li&&(d=new pt(">=0.0.0")),h=h||d,v=v||d,n(d.semver,h.semver,s)?h=d:c(d.semver,v.semver,s)&&(v=d)}),h.operator===l||h.operator===f||(!v.operator||v.operator===l)&&i(r,v.semver))return!1;if(v.operator===f&&c(r,v.semver))return!1}return!0},"outside");ft.exports=Ei});var Et=R((ol,ht)=>{"use strict";a();var mi=ae(),di=o((r,e,t)=>mi(r,e,">",t),"gtr");ht.exports=di});var dt=R((ll,mt)=>{"use strict";a();var yi=ae(),Ri=o((r,e,t)=>yi(r,e,"<",t),"ltr");mt.exports=Ri});var gt=R((fl,Rt)=>{"use strict";a();var yt=w(),gi=o((r,e,t)=>(r=new yt(r,t),e=new yt(e,t),r.intersects(e,t)),"intersects");Rt.exports=gi});var It=R((ml,$t)=>{"use strict";a();var $i=B(),Ii=T();$t.exports=(r,e,t)=>{let s=[],n=null,i=null,c=r.sort(($,h)=>Ii($,h,t));for(let $ of c)$i($,e,t)?(i=$,n||(n=$)):(i&&s.push([n,i]),i=null,n=null);n&&s.push([n,null]);let l=[];for(let[$,h]of s)$===h?l.push($):!h&&$===c[0]?l.push("*"):h?$===c[0]?l.push(`<=${h}`):l.push(`${$} - ${h}`):l.push(`>=${$}`);let f=l.join(" || "),y=typeof e.raw=="string"?e.raw:String(e);return f.length<y.length?f:e}});var kt=R((yl,St)=>{"use strict";a();var vt=w(),Se=X(),{ANY:Le}=Se,M=B(),ke=T(),vi=o((r,e,t={})=>{if(r===e)return!0;r=new vt(r,t),e=new vt(e,t);let s=!1;e:for(let n of r.set){for(let i of e.set){let c=Ni(n,i,t);if(s=s||c!==null,c)continue e}if(s)return!1}return!0},"subset"),Oi=[new Se(">=0.0.0-0")],Ot=[new Se(">=0.0.0")],Ni=o((r,e,t)=>{if(r===e)return!0;if(r.length===1&&r[0].semver===Le){if(e.length===1&&e[0].semver===Le)return!0;t.includePrerelease?r=Oi:r=Ot}if(e.length===1&&e[0].semver===Le){if(t.includePrerelease)return!0;e=Ot}let s=new Set,n,i;for(let d of r)d.operator===">"||d.operator===">="?n=Nt(n,d,t):d.operator==="<"||d.operator==="<="?i=Lt(i,d,t):s.add(d.semver);if(s.size>1)return null;let c;if(n&&i){if(c=ke(n.semver,i.semver,t),c>0)return null;if(c===0&&(n.operator!==">="||i.operator!=="<="))return null}for(let d of s){if(n&&!M(d,String(n),t)||i&&!M(d,String(i),t))return null;for(let pe of e)if(!M(d,String(pe),t))return!1;return!0}let l,f,y,$,h=i&&!t.includePrerelease&&i.semver.prerelease.length?i.semver:!1,v=n&&!t.includePrerelease&&n.semver.prerelease.length?n.semver:!1;h&&h.prerelease.length===1&&i.operator==="<"&&h.prerelease[0]===0&&(h=!1);for(let d of e){if($=$||d.operator===">"||d.operator===">=",y=y||d.operator==="<"||d.operator==="<=",n){if(v&&d.semver.prerelease&&d.semver.prerelease.length&&d.semver.major===v.major&&d.semver.minor===v.minor&&d.semver.patch===v.patch&&(v=!1),d.operator===">"||d.operator===">="){if(l=Nt(n,d,t),l===d&&l!==n)return!1}else if(n.operator===">="&&!M(n.semver,String(d),t))return!1}if(i){if(h&&d.semver.prerelease&&d.semver.prerelease.length&&d.semver.major===h.major&&d.semver.minor===h.minor&&d.semver.patch===h.patch&&(h=!1),d.operator==="<"||d.operator==="<="){if(f=Lt(i,d,t),f===d&&f!==i)return!1}else if(i.operator==="<="&&!M(i.semver,String(d),t))return!1}if(!d.operator&&(i||n)&&c!==0)return!1}return!(n&&y&&!i&&c!==0||i&&$&&!n&&c!==0||v||h)},"simpleSubset"),Nt=o((r,e,t)=>{if(!r)return e;let s=ke(r.semver,e.semver,t);return s>0?r:s<0||e.operator===">"&&r.operator===">="?e:r},"higherGT"),Lt=o((r,e,t)=>{if(!r)return e;let s=ke(r.semver,e.semver,t);return s<0?r:s>0||e.operator==="<"&&r.operator==="<="?e:r},"lowerLT");St.exports=vi});var qt=R(($l,wt)=>{"use strict";a();var Ae=D(),At=U(),Li=N(),Tt=de(),Si=x(),ki=rr(),Ai=sr(),Ti=or(),wi=lr(),qi=pr(),Pi=hr(),Ci=mr(),xi=yr(),Di=T(),bi=Ir(),ji=Or(),Gi=ee(),Fi=kr(),Ui=Tr(),Vi=_(),_i=re(),Xi=ye(),Hi=Re(),Bi=te(),Mi=se(),Yi=ge(),Wi=Gr(),zi=X(),Ji=w(),Ki=B(),Qi=Zr(),Zi=rt(),eo=st(),ro=ot(),to=ct(),so=ae(),no=Et(),io=dt(),oo=gt(),ao=It(),co=kt();wt.exports={parse:Si,valid:ki,clean:Ai,inc:Ti,diff:wi,major:qi,minor:Pi,patch:Ci,prerelease:xi,compare:Di,rcompare:bi,compareLoose:ji,compareBuild:Gi,sort:Fi,rsort:Ui,gt:Vi,lt:_i,eq:Xi,neq:Hi,gte:Bi,lte:Mi,cmp:Yi,coerce:Wi,Comparator:zi,Range:Ji,satisfies:Ki,toComparators:Qi,maxSatisfying:Zi,minSatisfying:eo,minVersion:ro,validRange:to,outside:so,gtr:no,ltr:io,intersects:oo,simplifyRange:ao,subset:co,SemVer:Li,re:Ae.re,src:Ae.src,tokens:Ae.t,SEMVER_SPEC_VERSION:At.SEMVER_SPEC_VERSION,RELEASE_TYPES:At.RELEASE_TYPES,compareIdentifiers:Tt.compareIdentifiers,rcompareIdentifiers:Tt.rcompareIdentifiers}});a();import{createRequire as wo}from"node:module";a();var Pe={};Zt(Pe,{default:()=>To,languages:()=>Xt,options:()=>_t,parsers:()=>Ht,pluginPackageJson:()=>Bt});a();import Lo from"prettier";import{parsers as So}from"prettier/plugins/babel";import*as ko from"prettier/plugins/estree";a();var z=xe(be(),1);a();var rs=/^(?:( )+|\t+)/,F="space",Ge="tab";function je(r,e){let t=new Map,s=0,n,i;for(let c of r.split(/\n/g)){if(!c)continue;let l,f,y,$,h,v=c.match(rs);if(v===null)s=0,n="";else{if(l=v[0].length,f=v[1]?F:Ge,e&&f===F&&l===1)continue;f!==n&&(s=0),n=f,y=1,$=0;let d=l-s;if(s=l,d===0)y=0,$=1;else{let pe=d>0?d:-d;i=ts(f,pe)}h=t.get(i),h=h===void 0?[1,0]:[h[0]+y,h[1]+$],t.set(i,h)}}return t}o(je,"makeIndentsMap");function ts(r,e){return(r===F?"s":"t")+String(e)}o(ts,"encodeIndentsKey");function ss(r){let t=r[0]==="s"?F:Ge,s=Number(r.slice(1));return{type:t,amount:s}}o(ss,"decodeIndentsKey");function ns(r){let e,t=0,s=0;for(let[n,[i,c]]of r)(i>t||i===t&&c>s)&&(t=i,s=c,e=n);return e}o(ns,"getMostUsedKey");function is(r,e){return(r===F?" ":"	").repeat(e)}o(is,"makeIndentString");function fe(r){if(typeof r!="string")throw new TypeError("Expected a string");let e=je(r,!0);e.size===0&&(e=je(r,!1));let t=ns(e),s,n=0,i="";return t!==void 0&&({type:s,amount:n}=ss(t),i=is(s,n)),{amount:n,type:s,indent:i}}o(fe,"detectIndent");a();function os(r){if(typeof r!="string")throw new TypeError("Expected a string");let e=r.match(/(?:\r?\n)/g)||[];if(e.length===0)return;let t=e.filter(n=>n===`\r
`).length,s=e.length-t;return t>s?`\r
`:`
`}o(os,"detectNewline");function Fe(r){return typeof r=="string"&&os(r)||`
`}o(Fe,"detectNewlineGraceful");a();import as from"node:fs";var cs=new URL("./index.json",import.meta.url),ls=JSON.parse(as.readFileSync(cs)),Ue=ls;a();function he(r){if(typeof r!="object"||r===null)return!1;let e=Object.getPrototypeOf(r);return(e===null||e===Object.prototype||Object.getPrototypeOf(e)===null)&&!(Symbol.toStringTag in r)&&!(Symbol.iterator in r)}o(he,"isPlainObject");var le=xe(qt(),1);var qe=Object.hasOwn||((r,e)=>Object.prototype.hasOwnProperty.call(r,e)),j=o(r=>(e,...t)=>r.reduce((s,n)=>n(s,...t),e),"pipe"),W=o(r=>e=>Array.isArray(e)?r(e):e,"onArray"),Gt=o(r=>e=>Array.isArray(e)&&e.every(t=>typeof t=="string")?r(e):e,"onStringArray"),Y=Gt(r=>[...new Set(r)]),lo=Gt(r=>[...r].sort()),ce=j([Y,lo]),G=o(r=>(e,...t)=>he(e)?r(e,...t):e,"onObject"),L=o((r,e)=>{let t=G(s=>(e&&(s=Object.fromEntries(Object.entries(s).map(([n,i])=>[n,t(i)]))),(0,z.default)(s,r)));return t},"sortObjectBy"),I=L(),Te=L(["type","url"]),we=L(["name","email","url"]),uo=L(["lib","bin","man","doc","example","test"]),q=o((r,e)=>(t,...s)=>qe(t,r)?{...t,[r]:e(t[r],...s)}:t,"overProperty"),Pt=L(Ue),Ct=o(r=>{let[e]=r.split(">"),t=[...e.matchAll("@")];if(!t.length||t.length===1&&t[0].index===0)return{name:r};let s=t.pop().index;return{name:e.substring(0,s),range:e.substring(s+1)}},"parseNameAndVersionRange"),po=L((r,e)=>{let{name:t,range:s}=Ct(r),{name:n,range:i}=Ct(e);return t!==n?t.localeCompare(n,"en"):s?i?le.default.compare(le.default.minVersion(s),le.default.minVersion(i)):1:-1}),xt=o(r=>{let e=r.split("@");return r.startsWith("@")?e.length>2?e.slice(0,-1).join("@"):r:e.length>1?e.slice(0,-1).join("@"):r},"getPackageName"),fo=o((r,e)=>{let t=xt(r),s=xt(e);return t<s?-1:t>s?1:0},"sortObjectByIdent"),ho=["files","excludedFiles","env","parser","parserOptions","settings","plugins","extends","rules","overrides","globals","processor","noInlineConfig","reportUnusedDisableDirectives"],Ft=G(j([L(ho),q("env",I),q("globals",I),q("overrides",W(r=>r.map(Ft))),q("parserOptions",I),q("rules",L((r,e)=>r.split("/").length-e.split("/").length||r.localeCompare(e))),q("settings",I)])),Eo=L(["description","url","href"]),mo=G(j([r=>(0,z.default)(r,[...Object.keys(r).filter(e=>e!=="overrides").sort(),"overrides"]),q("overrides",W(r=>r.map(j([I,q("options",I)]))))])),yo=L(["node","npm","yarn"]),Ro=["peerDependencyRules","neverBuiltDependencies","onlyBuiltDependencies","onlyBuiltDependenciesFile","allowedDeprecatedVersions","allowNonAppliedPatches","updateConfig","auditConfig","requiredScripts","supportedArchitectures","overrides","patchedDependencies","packageExtensions"],go=G(j([L(Ro,!0),q("overrides",po)])),$o=new Set(["install","pack","prepare","publish","restart","shrinkwrap","start","stop","test","uninstall","version"]),Dt=o((r,e)=>qe(e,"devDependencies")&&qe(e.devDependencies,r),"hasDevDependency"),bt=G((r,e)=>{let t=Object.keys(r),s=new Set,n=t.map(c=>{let l=c.replace(/^(?:pre|post)/,"");return $o.has(l)||t.includes(l)?(s.add(l),l):c});!Dt("npm-run-all",e)&&!Dt("npm-run-all2",e)&&n.sort();let i=n.flatMap(c=>s.has(c)?[`pre${c}`,c,`post${c}`]:[c]);return(0,z.default)(r,i)}),Ut=[{key:"$schema"},{key:"name"},{key:"displayName"},{key:"version"},{key:"private"},{key:"description"},{key:"categories",over:Y},{key:"keywords",over:Y},{key:"homepage"},{key:"bugs",over:L(["url","email"])},{key:"repository",over:Te},{key:"funding",over:Te},{key:"license",over:Te},{key:"qna"},{key:"author",over:we},{key:"maintainers",over:W(r=>r.map(we))},{key:"contributors",over:W(r=>r.map(we))},{key:"publisher"},{key:"sideEffects"},{key:"type"},{key:"imports"},{key:"exports"},{key:"main"},{key:"svelte"},{key:"umd:main"},{key:"jsdelivr"},{key:"unpkg"},{key:"module"},{key:"source"},{key:"jsnext:main"},{key:"browser"},{key:"react-native"},{key:"types"},{key:"typesVersions"},{key:"typings"},{key:"style"},{key:"example"},{key:"examplestyle"},{key:"assets"},{key:"bin",over:I},{key:"man"},{key:"directories",over:uo},{key:"files",over:Y},{key:"workspaces"},{key:"binary",over:L(["module_name","module_path","remote_path","package_name","host"])},{key:"scripts",over:bt},{key:"betterScripts",over:bt},{key:"contributes",over:I},{key:"activationEvents",over:Y},{key:"husky",over:q("hooks",Pt)},{key:"simple-git-hooks",over:Pt},{key:"pre-commit"},{key:"commitlint",over:I},{key:"lint-staged"},{key:"nano-staged"},{key:"config",over:I},{key:"nodemonConfig",over:I},{key:"browserify",over:I},{key:"babel",over:I},{key:"browserslist"},{key:"xo",over:I},{key:"prettier",over:mo},{key:"eslintConfig",over:Ft},{key:"eslintIgnore"},{key:"npmpkgjsonlint",over:I},{key:"npmPackageJsonLintConfig",over:I},{key:"npmpackagejsonlint",over:I},{key:"release",over:I},{key:"remarkConfig",over:I},{key:"stylelint"},{key:"ava",over:I},{key:"jest",over:I},{key:"jest-junit",over:I},{key:"jest-stare",over:I},{key:"mocha",over:I},{key:"nyc",over:I},{key:"c8",over:I},{key:"tap",over:I},{key:"oclif",over:L(void 0,!0)},{key:"resolutions",over:I},{key:"dependencies",over:I},{key:"devDependencies",over:I},{key:"dependenciesMeta",over:L(fo,!0)},{key:"peerDependencies",over:I},{key:"peerDependenciesMeta",over:L(void 0,!0)},{key:"optionalDependencies",over:I},{key:"bundledDependencies",over:ce},{key:"bundleDependencies",over:ce},{key:"extensionPack",over:ce},{key:"extensionDependencies",over:ce},{key:"flat"},{key:"packageManager"},{key:"engines",over:I},{key:"engineStrict",over:I},{key:"volta",over:yo},{key:"languageName"},{key:"os"},{key:"cpu"},{key:"preferGlobal",over:I},{key:"publishConfig",over:I},{key:"icon"},{key:"badges",over:W(r=>r.map(Eo))},{key:"galleryBanner",over:I},{key:"preview"},{key:"markdown"},{key:"pnpm",over:go}],jt=Ut.map(({key:r})=>r),Io=j(Ut.map(({key:r,over:e})=>e?q(r,e):void 0).filter(Boolean));function vo(r,e){if(typeof r=="string"){let{indent:t,type:s}=fe(r),n=r.slice(-1)===`
`?`
`:"",i=Fe(r);r=JSON.parse(r);let c=JSON.stringify(e(r),null,s==="tab"?"	":t)+n;return i===`\r
`&&(c=c.replace(/\n/g,i)),c}return e(r)}o(vo,"editStringJSON");var Oo=o(r=>r[0]==="_","isPrivateKey"),No=o((r,e)=>r.reduce((t,s)=>(t[e(s)?0:1].push(s),t),[[],[]]),"partition");function Vt(r,e={}){return vo(r,G(t=>{let s=e.sortOrder||jt;if(Array.isArray(s)){let n=Object.keys(t),[i,c]=No(n,Oo);s=[...s,...jt,...c.sort(),...i.sort()]}return Io((0,z.default)(t,s),t)}))}o(Vt,"sortPackageJson");var _t={sortPackageJsonSortOrder:{category:"Format",type:"string",description:"Custom ordering array.",default:[{value:[]}],array:!0}},{languages:Ao}=ko,Xt=Ao.filter(({name:r})=>r==="JSON.stringify"),ue=So["json-stringify"],Ht={"json-stringify":{...ue,async parse(r,e){let{filepath:t}=e;if(/package.*json$/u.test(t)){r=await Lo.format(r,{filepath:t}),ue.preprocess&&(r=ue.preprocess(r,e));let s=e?.sortPackageJsonSortOrder;r=Vt(r,s&&s.length>0?{sortOrder:s}:{})}return ue.parse(r,e)}}},Bt={languages:Xt,options:_t,parsers:Ht},To=Bt;var Ce={"@bfra.me/prettier-plugins/package-json":Pe};async function Mt(r,e){try{if(!Ce[e]){let t=r(e);Ce[e]=t}return Ce[e]??e}catch{return e}}o(Mt,"resolve");var qo=wo(import.meta.url),Po=Mt.bind(null,qo.resolve),{searchParams:Co}=new URL(import.meta.url),xo={arrowParens:"avoid",bracketSpacing:!1,endOfLine:"auto",printWidth:100,semi:Co.has("semi","true"),singleQuote:!0,overrides:[{files:["**/node_modules/**","**/dist/**","**/coverage/**","**/out/**","**/temp/**","**/.idea/**","**/.next/**","**/.nuxt/**","**/.output/**","**/.tsup/**","**/.vercel/**","**/.vitepress/cache/**","**/.vite-inspect/**","**/__snapshots__/**","**/test/fixtures/**","**/auto-import?(s).d.ts","**/.changeset/*.md","**/CHANGELOG*.md","**/changelog*.md","**/components.d.ts","**/devcontainer-lock.json","**/LICENSE*","**/license*","**/*.min.*","**/package-lock.json","**/pnpm-lock.yaml","**/typed-router.d.ts","**/yarn.lock"],options:{requirePragma:!0}},{files:[".vscode/*.json",".devcontainer/**/devcontainer*.json"],options:{tabWidth:4}},{files:["*.md"],options:{proseWrap:"never",singleQuote:!1}}],plugins:["@bfra.me/prettier-plugins/package-json"].map(Po)},Gl=xo;export{Gl as default};
//# sourceMappingURL=index.js.map