'use strict';var module$1=require('module'),Lo=require('prettier'),babel=require('prettier/plugins/babel'),ko=require('prettier/plugins/estree'),as=require('fs');function _interopDefault(e){return e&&e.__esModule?e:{default:e}}function _interopNamespace(e){if(e&&e.__esModule)return e;var n=Object.create(null);if(e){Object.keys(e).forEach(function(k){if(k!=='default'){var d=Object.getOwnPropertyDescriptor(e,k);Object.defineProperty(n,k,d.get?d:{enumerable:true,get:function(){return e[k]}});}})}n.default=e;return Object.freeze(n)}var Lo__default=/*#__PURE__*/_interopDefault(Lo);var ko__namespace=/*#__PURE__*/_interopNamespace(ko);var as__default=/*#__PURE__*/_interopDefault(as);var Mt=Object.create;var z=Object.defineProperty;var Yt=Object.getOwnPropertyDescriptor;var Wt=Object.getOwnPropertyNames;var zt=Object.getPrototypeOf,Jt=Object.prototype.hasOwnProperty;var o=(r,e)=>z(r,"name",{value:e,configurable:!0});var Kt=(r,e)=>()=>(r&&(e=r(r=0)),e);var y=(r,e)=>()=>(e||r((e={exports:{}}).exports,e),e.exports),Qt=(r,e)=>{for(var t in e)z(r,t,{get:e[t],enumerable:!0});},Zt=(r,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of Wt(e))!Jt.call(r,n)&&n!==t&&z(r,n,{get:()=>e[n],enumerable:!(s=Yt(e,n))||s.enumerable});return r};var Ce=(r,e,t)=>(t=r!=null?Mt(zt(r)):{},Zt(e||!r||!r.__esModule?z(t,"default",{value:r,enumerable:!0}):t,r));var es,h,a=Kt(()=>{es=o(()=>typeof document>"u"?new URL(`file:${__filename}`).href:document.currentScript&&document.currentScript.src||new URL("main.js",document.baseURI).href,"getImportMetaUrl"),h=es();});var De=y((Go,xe)=>{a();xe.exports=o(function(e,t){var s,n;typeof t=="function"?n=t:s=t;var i=Object.keys(e);return (s||[]).concat(i.sort(n)).reduce(function(c,l){return i.indexOf(l)!==-1&&(c[l]=e[l]),c},Object.create(null))},"sortObjectByKeyNameList");});var F=y((Zo,Ue)=>{a();var us="2.0.0",ps=Number.MAX_SAFE_INTEGER||9007199254740991,fs=16,hs=250,Es=["major","premajor","minor","preminor","patch","prepatch","prerelease"];Ue.exports={MAX_LENGTH:256,MAX_SAFE_COMPONENT_LENGTH:fs,MAX_SAFE_BUILD_LENGTH:hs,MAX_SAFE_INTEGER:ps,RELEASE_TYPES:Es,SEMVER_SPEC_VERSION:us,FLAG_INCLUDE_PRERELEASE:1,FLAG_LOOSE:2};});var U=y((ra,Ve)=>{a();var ms=typeof process=="object"&&process.env&&process.env.NODE_DEBUG&&/\bsemver\b/i.test(process.env.NODE_DEBUG)?(...r)=>console.error("SEMVER",...r):()=>{};Ve.exports=ms;});var x=y((P,_e)=>{a();var{MAX_SAFE_COMPONENT_LENGTH:he,MAX_SAFE_BUILD_LENGTH:ds,MAX_LENGTH:ys}=F(),Rs=U();P=_e.exports={};var $s=P.re=[],gs=P.safeRe=[],u=P.src=[],p=P.t={},Is=0,Ee="[a-zA-Z0-9-]",vs=[["\\s",1],["\\d",ys],[Ee,ds]],Os=o(r=>{for(let[e,t]of vs)r=r.split(`${e}*`).join(`${e}{0,${t}}`).split(`${e}+`).join(`${e}{1,${t}}`);return r},"makeSafeRegex"),R=o((r,e,t)=>{let s=Os(e),n=Is++;Rs(r,n,e),p[r]=n,u[n]=e,$s[n]=new RegExp(e,t?"g":void 0),gs[n]=new RegExp(s,t?"g":void 0);},"createToken");R("NUMERICIDENTIFIER","0|[1-9]\\d*");R("NUMERICIDENTIFIERLOOSE","\\d+");R("NONNUMERICIDENTIFIER",`\\d*[a-zA-Z-]${Ee}*`);R("MAINVERSION",`(${u[p.NUMERICIDENTIFIER]})\\.(${u[p.NUMERICIDENTIFIER]})\\.(${u[p.NUMERICIDENTIFIER]})`);R("MAINVERSIONLOOSE",`(${u[p.NUMERICIDENTIFIERLOOSE]})\\.(${u[p.NUMERICIDENTIFIERLOOSE]})\\.(${u[p.NUMERICIDENTIFIERLOOSE]})`);R("PRERELEASEIDENTIFIER",`(?:${u[p.NUMERICIDENTIFIER]}|${u[p.NONNUMERICIDENTIFIER]})`);R("PRERELEASEIDENTIFIERLOOSE",`(?:${u[p.NUMERICIDENTIFIERLOOSE]}|${u[p.NONNUMERICIDENTIFIER]})`);R("PRERELEASE",`(?:-(${u[p.PRERELEASEIDENTIFIER]}(?:\\.${u[p.PRERELEASEIDENTIFIER]})*))`);R("PRERELEASELOOSE",`(?:-?(${u[p.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${u[p.PRERELEASEIDENTIFIERLOOSE]})*))`);R("BUILDIDENTIFIER",`${Ee}+`);R("BUILD",`(?:\\+(${u[p.BUILDIDENTIFIER]}(?:\\.${u[p.BUILDIDENTIFIER]})*))`);R("FULLPLAIN",`v?${u[p.MAINVERSION]}${u[p.PRERELEASE]}?${u[p.BUILD]}?`);R("FULL",`^${u[p.FULLPLAIN]}$`);R("LOOSEPLAIN",`[v=\\s]*${u[p.MAINVERSIONLOOSE]}${u[p.PRERELEASELOOSE]}?${u[p.BUILD]}?`);R("LOOSE",`^${u[p.LOOSEPLAIN]}$`);R("GTLT","((?:<|>)?=?)");R("XRANGEIDENTIFIERLOOSE",`${u[p.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);R("XRANGEIDENTIFIER",`${u[p.NUMERICIDENTIFIER]}|x|X|\\*`);R("XRANGEPLAIN",`[v=\\s]*(${u[p.XRANGEIDENTIFIER]})(?:\\.(${u[p.XRANGEIDENTIFIER]})(?:\\.(${u[p.XRANGEIDENTIFIER]})(?:${u[p.PRERELEASE]})?${u[p.BUILD]}?)?)?`);R("XRANGEPLAINLOOSE",`[v=\\s]*(${u[p.XRANGEIDENTIFIERLOOSE]})(?:\\.(${u[p.XRANGEIDENTIFIERLOOSE]})(?:\\.(${u[p.XRANGEIDENTIFIERLOOSE]})(?:${u[p.PRERELEASELOOSE]})?${u[p.BUILD]}?)?)?`);R("XRANGE",`^${u[p.GTLT]}\\s*${u[p.XRANGEPLAIN]}$`);R("XRANGELOOSE",`^${u[p.GTLT]}\\s*${u[p.XRANGEPLAINLOOSE]}$`);R("COERCEPLAIN",`(^|[^\\d])(\\d{1,${he}})(?:\\.(\\d{1,${he}}))?(?:\\.(\\d{1,${he}}))?`);R("COERCE",`${u[p.COERCEPLAIN]}(?:$|[^\\d])`);R("COERCEFULL",u[p.COERCEPLAIN]+`(?:${u[p.PRERELEASE]})?(?:${u[p.BUILD]})?(?:$|[^\\d])`);R("COERCERTL",u[p.COERCE],!0);R("COERCERTLFULL",u[p.COERCEFULL],!0);R("LONETILDE","(?:~>?)");R("TILDETRIM",`(\\s*)${u[p.LONETILDE]}\\s+`,!0);P.tildeTrimReplace="$1~";R("TILDE",`^${u[p.LONETILDE]}${u[p.XRANGEPLAIN]}$`);R("TILDELOOSE",`^${u[p.LONETILDE]}${u[p.XRANGEPLAINLOOSE]}$`);R("LONECARET","(?:\\^)");R("CARETTRIM",`(\\s*)${u[p.LONECARET]}\\s+`,!0);P.caretTrimReplace="$1^";R("CARET",`^${u[p.LONECARET]}${u[p.XRANGEPLAIN]}$`);R("CARETLOOSE",`^${u[p.LONECARET]}${u[p.XRANGEPLAINLOOSE]}$`);R("COMPARATORLOOSE",`^${u[p.GTLT]}\\s*(${u[p.LOOSEPLAIN]})$|^$`);R("COMPARATOR",`^${u[p.GTLT]}\\s*(${u[p.FULLPLAIN]})$|^$`);R("COMPARATORTRIM",`(\\s*)${u[p.GTLT]}\\s*(${u[p.LOOSEPLAIN]}|${u[p.XRANGEPLAIN]})`,!0);P.comparatorTrimReplace="$1$2$3";R("HYPHENRANGE",`^\\s*(${u[p.XRANGEPLAIN]})\\s+-\\s+(${u[p.XRANGEPLAIN]})\\s*$`);R("HYPHENRANGELOOSE",`^\\s*(${u[p.XRANGEPLAINLOOSE]})\\s+-\\s+(${u[p.XRANGEPLAINLOOSE]})\\s*$`);R("STAR","(<|>)?=?\\s*\\*");R("GTE0","^\\s*>=\\s*0\\.0\\.0\\s*$");R("GTE0PRE","^\\s*>=\\s*0\\.0\\.0-0\\s*$");});var J=y((ia,Xe)=>{a();var Ns=Object.freeze({loose:!0}),Ls=Object.freeze({}),Ss=o(r=>r?typeof r!="object"?Ns:r:Ls,"parseOptions");Xe.exports=Ss;});var me=y((ca,Me)=>{a();var He=/^[0-9]+$/,Be=o((r,e)=>{let t=He.test(r),s=He.test(e);return t&&s&&(r=+r,e=+e),r===e?0:t&&!s?-1:s&&!t?1:r<e?-1:1},"compareIdentifiers"),ks=o((r,e)=>Be(e,r),"rcompareIdentifiers");Me.exports={compareIdentifiers:Be,rcompareIdentifiers:ks};});var O=y((pa,Je)=>{a();var K=U(),{MAX_LENGTH:Ye,MAX_SAFE_INTEGER:Q}=F(),{safeRe:We,t:ze}=x(),As=J(),{compareIdentifiers:D}=me(),Ts=class q{static{o(this,"SemVer");}constructor(e,t){if(t=As(t),e instanceof q){if(e.loose===!!t.loose&&e.includePrerelease===!!t.includePrerelease)return e;e=e.version;}else if(typeof e!="string")throw new TypeError(`Invalid version. Must be a string. Got type "${typeof e}".`);if(e.length>Ye)throw new TypeError(`version is longer than ${Ye} characters`);K("SemVer",e,t),this.options=t,this.loose=!!t.loose,this.includePrerelease=!!t.includePrerelease;let s=e.trim().match(t.loose?We[ze.LOOSE]:We[ze.FULL]);if(!s)throw new TypeError(`Invalid Version: ${e}`);if(this.raw=e,this.major=+s[1],this.minor=+s[2],this.patch=+s[3],this.major>Q||this.major<0)throw new TypeError("Invalid major version");if(this.minor>Q||this.minor<0)throw new TypeError("Invalid minor version");if(this.patch>Q||this.patch<0)throw new TypeError("Invalid patch version");s[4]?this.prerelease=s[4].split(".").map(n=>{if(/^[0-9]+$/.test(n)){let i=+n;if(i>=0&&i<Q)return i}return n}):this.prerelease=[],this.build=s[5]?s[5].split("."):[],this.format();}format(){return this.version=`${this.major}.${this.minor}.${this.patch}`,this.prerelease.length&&(this.version+=`-${this.prerelease.join(".")}`),this.version}toString(){return this.version}compare(e){if(K("SemVer.compare",this.version,this.options,e),!(e instanceof q)){if(typeof e=="string"&&e===this.version)return 0;e=new q(e,this.options);}return e.version===this.version?0:this.compareMain(e)||this.comparePre(e)}compareMain(e){return e instanceof q||(e=new q(e,this.options)),D(this.major,e.major)||D(this.minor,e.minor)||D(this.patch,e.patch)}comparePre(e){if(e instanceof q||(e=new q(e,this.options)),this.prerelease.length&&!e.prerelease.length)return -1;if(!this.prerelease.length&&e.prerelease.length)return 1;if(!this.prerelease.length&&!e.prerelease.length)return 0;let t=0;do{let s=this.prerelease[t],n=e.prerelease[t];if(K("prerelease compare",t,s,n),s===void 0&&n===void 0)return 0;if(n===void 0)return 1;if(s===void 0)return -1;if(s===n)continue;return D(s,n)}while(++t)}compareBuild(e){e instanceof q||(e=new q(e,this.options));let t=0;do{let s=this.build[t],n=e.build[t];if(K("build compare",t,s,n),s===void 0&&n===void 0)return 0;if(n===void 0)return 1;if(s===void 0)return -1;if(s===n)continue;return D(s,n)}while(++t)}inc(e,t,s){switch(e){case"premajor":this.prerelease.length=0,this.patch=0,this.minor=0,this.major++,this.inc("pre",t,s);break;case"preminor":this.prerelease.length=0,this.patch=0,this.minor++,this.inc("pre",t,s);break;case"prepatch":this.prerelease.length=0,this.inc("patch",t,s),this.inc("pre",t,s);break;case"prerelease":this.prerelease.length===0&&this.inc("patch",t,s),this.inc("pre",t,s);break;case"major":(this.minor!==0||this.patch!==0||this.prerelease.length===0)&&this.major++,this.minor=0,this.patch=0,this.prerelease=[];break;case"minor":(this.patch!==0||this.prerelease.length===0)&&this.minor++,this.patch=0,this.prerelease=[];break;case"patch":this.prerelease.length===0&&this.patch++,this.prerelease=[];break;case"pre":{let n=Number(s)?1:0;if(!t&&s===!1)throw new Error("invalid increment argument: identifier is empty");if(this.prerelease.length===0)this.prerelease=[n];else {let i=this.prerelease.length;for(;--i>=0;)typeof this.prerelease[i]=="number"&&(this.prerelease[i]++,i=-2);if(i===-1){if(t===this.prerelease.join(".")&&s===!1)throw new Error("invalid increment argument: identifier already exists");this.prerelease.push(n);}}if(t){let i=[t,n];s===!1&&(i=[t]),D(this.prerelease[0],t)===0?isNaN(this.prerelease[1])&&(this.prerelease=i):this.prerelease=i;}break}default:throw new Error(`invalid increment argument: ${e}`)}return this.raw=this.format(),this.build.length&&(this.raw+=`+${this.build.join(".")}`),this}};Je.exports=Ts;});var C=y((Ea,Qe)=>{a();var Ke=O(),ws=o((r,e,t=!1)=>{if(r instanceof Ke)return r;try{return new Ke(r,e)}catch(s){if(!t)return null;throw s}},"parse");Qe.exports=ws;});var er=y((ya,Ze)=>{a();var qs=C(),Ps=o((r,e)=>{let t=qs(r,e);return t?t.version:null},"valid");Ze.exports=Ps;});var tr=y((ga,rr)=>{a();var Cs=C(),xs=o((r,e)=>{let t=Cs(r.trim().replace(/^[=v]+/,""),e);return t?t.version:null},"clean");rr.exports=xs;});var ir=y((Oa,nr)=>{a();var sr=O(),Ds=o((r,e,t,s,n)=>{typeof t=="string"&&(n=s,s=t,t=void 0);try{return new sr(r instanceof sr?r.version:r,t).inc(e,s,n).version}catch{return null}},"inc");nr.exports=Ds;});var cr=y((Sa,ar)=>{a();var or=C(),bs=o((r,e)=>{let t=or(r,null,!0),s=or(e,null,!0),n=t.compare(s);if(n===0)return null;let i=n>0,c=i?t:s,l=i?s:t,f=!!c.prerelease.length;if(!!l.prerelease.length&&!f)return !l.patch&&!l.minor?"major":c.patch?"patch":c.minor?"minor":"major";let $=f?"pre":"";return t.major!==s.major?$+"major":t.minor!==s.minor?$+"minor":t.patch!==s.patch?$+"patch":"prerelease"},"diff");ar.exports=bs;});var ur=y((Ta,lr)=>{a();var js=O(),Gs=o((r,e)=>new js(r,e).major,"major");lr.exports=Gs;});var fr=y((Pa,pr)=>{a();var Fs=O(),Us=o((r,e)=>new Fs(r,e).minor,"minor");pr.exports=Us;});var Er=y((Da,hr)=>{a();var Vs=O(),_s=o((r,e)=>new Vs(r,e).patch,"patch");hr.exports=_s;});var dr=y((Ga,mr)=>{a();var Xs=C(),Hs=o((r,e)=>{let t=Xs(r,e);return t&&t.prerelease.length?t.prerelease:null},"prerelease");mr.exports=Hs;});var A=y((Va,Rr)=>{a();var yr=O(),Bs=o((r,e,t)=>new yr(r,t).compare(new yr(e,t)),"compare");Rr.exports=Bs;});var gr=y((Ha,$r)=>{a();var Ms=A(),Ys=o((r,e,t)=>Ms(e,r,t),"rcompare");$r.exports=Ys;});var vr=y((Ya,Ir)=>{a();var Ws=A(),zs=o((r,e)=>Ws(r,e,!0),"compareLoose");Ir.exports=zs;});var Z=y((Ja,Nr)=>{a();var Or=O(),Js=o((r,e,t)=>{let s=new Or(r,t),n=new Or(e,t);return s.compare(n)||s.compareBuild(n)},"compareBuild");Nr.exports=Js;});var Sr=y((Za,Lr)=>{a();var Ks=Z(),Qs=o((r,e)=>r.sort((t,s)=>Ks(t,s,e)),"sort");Lr.exports=Qs;});var Ar=y((tc,kr)=>{a();var Zs=Z(),en=o((r,e)=>r.sort((t,s)=>Zs(s,t,e)),"rsort");kr.exports=en;});var V=y((ic,Tr)=>{a();var rn=A(),tn=o((r,e,t)=>rn(r,e,t)>0,"gt");Tr.exports=tn;});var ee=y((cc,wr)=>{a();var sn=A(),nn=o((r,e,t)=>sn(r,e,t)<0,"lt");wr.exports=nn;});var de=y((pc,qr)=>{a();var on=A(),an=o((r,e,t)=>on(r,e,t)===0,"eq");qr.exports=an;});var ye=y((Ec,Pr)=>{a();var cn=A(),ln=o((r,e,t)=>cn(r,e,t)!==0,"neq");Pr.exports=ln;});var re=y((yc,Cr)=>{a();var un=A(),pn=o((r,e,t)=>un(r,e,t)>=0,"gte");Cr.exports=pn;});var te=y((gc,xr)=>{a();var fn=A(),hn=o((r,e,t)=>fn(r,e,t)<=0,"lte");xr.exports=hn;});var Re=y((Oc,Dr)=>{a();var En=de(),mn=ye(),dn=V(),yn=re(),Rn=ee(),$n=te(),gn=o((r,e,t,s)=>{switch(e){case"===":return typeof r=="object"&&(r=r.version),typeof t=="object"&&(t=t.version),r===t;case"!==":return typeof r=="object"&&(r=r.version),typeof t=="object"&&(t=t.version),r!==t;case"":case"=":case"==":return En(r,t,s);case"!=":return mn(r,t,s);case">":return dn(r,t,s);case">=":return yn(r,t,s);case"<":return Rn(r,t,s);case"<=":return $n(r,t,s);default:throw new TypeError(`Invalid operator: ${e}`)}},"cmp");Dr.exports=gn;});var jr=y((Sc,br)=>{a();var In=O(),vn=C(),{safeRe:se,t:ne}=x(),On=o((r,e)=>{if(r instanceof In)return r;if(typeof r=="number"&&(r=String(r)),typeof r!="string")return null;e=e||{};let t=null;if(!e.rtl)t=r.match(e.includePrerelease?se[ne.COERCEFULL]:se[ne.COERCE]);else {let f=e.includePrerelease?se[ne.COERCERTLFULL]:se[ne.COERCERTL],d;for(;(d=f.exec(r))&&(!t||t.index+t[0].length!==r.length);)(!t||d.index+d[0].length!==t.index+t[0].length)&&(t=d),f.lastIndex=d.index+d[1].length+d[2].length;f.lastIndex=-1;}if(t===null)return null;let s=t[2],n=t[3]||"0",i=t[4]||"0",c=e.includePrerelease&&t[5]?`-${t[5]}`:"",l=e.includePrerelease&&t[6]?`+${t[6]}`:"";return vn(`${s}.${n}.${i}${c}${l}`,e)},"coerce");br.exports=On;});var Fr=y((wc,Gr)=>{a();var Nn=class{static{o(this,"LRUCache");}constructor(){this.max=1e3,this.map=new Map;}get(e){let t=this.map.get(e);if(t!==void 0)return this.map.delete(e),this.map.set(e,t),t}delete(e){return this.map.delete(e)}set(e,t){if(!this.delete(e)&&t!==void 0){if(this.map.size>=this.max){let n=this.map.keys().next().value;this.delete(n);}this.map.set(e,t);}return this}};Gr.exports=Nn;});var T=y((Cc,Xr)=>{a();var Ln=/\s+/g,Sn=class ie{static{o(this,"Range");}constructor(e,t){if(t=An(t),e instanceof ie)return e.loose===!!t.loose&&e.includePrerelease===!!t.includePrerelease?e:new ie(e.raw,t);if(e instanceof $e)return this.raw=e.value,this.set=[[e]],this.formatted=void 0,this;if(this.options=t,this.loose=!!t.loose,this.includePrerelease=!!t.includePrerelease,this.raw=e.trim().replace(Ln," "),this.set=this.raw.split("||").map(s=>this.parseRange(s.trim())).filter(s=>s.length),!this.set.length)throw new TypeError(`Invalid SemVer Range: ${this.raw}`);if(this.set.length>1){let s=this.set[0];if(this.set=this.set.filter(n=>!Vr(n[0])),this.set.length===0)this.set=[s];else if(this.set.length>1){for(let n of this.set)if(n.length===1&&Dn(n[0])){this.set=[n];break}}}this.formatted=void 0;}get range(){if(this.formatted===void 0){this.formatted="";for(let e=0;e<this.set.length;e++){e>0&&(this.formatted+="||");let t=this.set[e];for(let s=0;s<t.length;s++)s>0&&(this.formatted+=" "),this.formatted+=t[s].toString().trim();}}return this.formatted}format(){return this.range}toString(){return this.range}parseRange(e){let s=((this.options.includePrerelease&&Cn)|(this.options.loose&&xn))+":"+e,n=Ur.get(s);if(n)return n;let i=this.options.loose,c=i?k[L.HYPHENRANGELOOSE]:k[L.HYPHENRANGE];e=e.replace(c,Bn(this.options.includePrerelease)),v("hyphen replace",e),e=e.replace(k[L.COMPARATORTRIM],wn),v("comparator trim",e),e=e.replace(k[L.TILDETRIM],qn),v("tilde trim",e),e=e.replace(k[L.CARETTRIM],Pn),v("caret trim",e);let l=e.split(" ").map(E=>bn(E,this.options)).join(" ").split(/\s+/).map(E=>Hn(E,this.options));i&&(l=l.filter(E=>(v("loose invalid filter",E,this.options),!!E.match(k[L.COMPARATORLOOSE])))),v("range list",l);let f=new Map,d=l.map(E=>new $e(E,this.options));for(let E of d){if(Vr(E))return [E];f.set(E.value,E);}f.size>1&&f.has("")&&f.delete("");let $=[...f.values()];return Ur.set(s,$),$}intersects(e,t){if(!(e instanceof ie))throw new TypeError("a Range is required");return this.set.some(s=>_r(s,t)&&e.set.some(n=>_r(n,t)&&s.every(i=>n.every(c=>i.intersects(c,t)))))}test(e){if(!e)return !1;if(typeof e=="string")try{e=new Tn(e,this.options);}catch{return !1}for(let t=0;t<this.set.length;t++)if(Mn(this.set[t],e,this.options))return !0;return !1}};Xr.exports=Sn;var kn=Fr(),Ur=new kn,An=J(),$e=_(),v=U(),Tn=O(),{safeRe:k,t:L,comparatorTrimReplace:wn,tildeTrimReplace:qn,caretTrimReplace:Pn}=x(),{FLAG_INCLUDE_PRERELEASE:Cn,FLAG_LOOSE:xn}=F(),Vr=o(r=>r.value==="<0.0.0-0","isNullSet"),Dn=o(r=>r.value==="","isAny"),_r=o((r,e)=>{let t=!0,s=r.slice(),n=s.pop();for(;t&&s.length;)t=s.every(i=>n.intersects(i,e)),n=s.pop();return t},"isSatisfiable"),bn=o((r,e)=>(v("comp",r,e),r=Fn(r,e),v("caret",r),r=jn(r,e),v("tildes",r),r=Vn(r,e),v("xrange",r),r=Xn(r,e),v("stars",r),r),"parseComparator"),S=o(r=>!r||r.toLowerCase()==="x"||r==="*","isX"),jn=o((r,e)=>r.trim().split(/\s+/).map(t=>Gn(t,e)).join(" "),"replaceTildes"),Gn=o((r,e)=>{let t=e.loose?k[L.TILDELOOSE]:k[L.TILDE];return r.replace(t,(s,n,i,c,l)=>{v("tilde",r,s,n,i,c,l);let f;return S(n)?f="":S(i)?f=`>=${n}.0.0 <${+n+1}.0.0-0`:S(c)?f=`>=${n}.${i}.0 <${n}.${+i+1}.0-0`:l?(v("replaceTilde pr",l),f=`>=${n}.${i}.${c}-${l} <${n}.${+i+1}.0-0`):f=`>=${n}.${i}.${c} <${n}.${+i+1}.0-0`,v("tilde return",f),f})},"replaceTilde"),Fn=o((r,e)=>r.trim().split(/\s+/).map(t=>Un(t,e)).join(" "),"replaceCarets"),Un=o((r,e)=>{v("caret",r,e);let t=e.loose?k[L.CARETLOOSE]:k[L.CARET],s=e.includePrerelease?"-0":"";return r.replace(t,(n,i,c,l,f)=>{v("caret",r,n,i,c,l,f);let d;return S(i)?d="":S(c)?d=`>=${i}.0.0${s} <${+i+1}.0.0-0`:S(l)?i==="0"?d=`>=${i}.${c}.0${s} <${i}.${+c+1}.0-0`:d=`>=${i}.${c}.0${s} <${+i+1}.0.0-0`:f?(v("replaceCaret pr",f),i==="0"?c==="0"?d=`>=${i}.${c}.${l}-${f} <${i}.${c}.${+l+1}-0`:d=`>=${i}.${c}.${l}-${f} <${i}.${+c+1}.0-0`:d=`>=${i}.${c}.${l}-${f} <${+i+1}.0.0-0`):(v("no pr"),i==="0"?c==="0"?d=`>=${i}.${c}.${l}${s} <${i}.${c}.${+l+1}-0`:d=`>=${i}.${c}.${l}${s} <${i}.${+c+1}.0-0`:d=`>=${i}.${c}.${l} <${+i+1}.0.0-0`),v("caret return",d),d})},"replaceCaret"),Vn=o((r,e)=>(v("replaceXRanges",r,e),r.split(/\s+/).map(t=>_n(t,e)).join(" ")),"replaceXRanges"),_n=o((r,e)=>{r=r.trim();let t=e.loose?k[L.XRANGELOOSE]:k[L.XRANGE];return r.replace(t,(s,n,i,c,l,f)=>{v("xRange",r,s,n,i,c,l,f);let d=S(i),$=d||S(c),E=$||S(l),I=E;return n==="="&&I&&(n=""),f=e.includePrerelease?"-0":"",d?n===">"||n==="<"?s="<0.0.0-0":s="*":n&&I?($&&(c=0),l=0,n===">"?(n=">=",$?(i=+i+1,c=0,l=0):(c=+c+1,l=0)):n==="<="&&(n="<",$?i=+i+1:c=+c+1),n==="<"&&(f="-0"),s=`${n+i}.${c}.${l}${f}`):$?s=`>=${i}.0.0${f} <${+i+1}.0.0-0`:E&&(s=`>=${i}.${c}.0${f} <${i}.${+c+1}.0-0`),v("xRange return",s),s})},"replaceXRange"),Xn=o((r,e)=>(v("replaceStars",r,e),r.trim().replace(k[L.STAR],"")),"replaceStars"),Hn=o((r,e)=>(v("replaceGTE0",r,e),r.trim().replace(k[e.includePrerelease?L.GTE0PRE:L.GTE0],"")),"replaceGTE0"),Bn=o(r=>(e,t,s,n,i,c,l,f,d,$,E,I)=>(S(s)?t="":S(n)?t=`>=${s}.0.0${r?"-0":""}`:S(i)?t=`>=${s}.${n}.0${r?"-0":""}`:c?t=`>=${t}`:t=`>=${t}${r?"-0":""}`,S(d)?f="":S($)?f=`<${+d+1}.0.0-0`:S(E)?f=`<${d}.${+$+1}.0-0`:I?f=`<=${d}.${$}.${E}-${I}`:r?f=`<${d}.${$}.${+E+1}-0`:f=`<=${f}`,`${t} ${f}`.trim()),"hyphenReplace"),Mn=o((r,e,t)=>{for(let s=0;s<r.length;s++)if(!r[s].test(e))return !1;if(e.prerelease.length&&!t.includePrerelease){for(let s=0;s<r.length;s++)if(v(r[s].semver),r[s].semver!==$e.ANY&&r[s].semver.prerelease.length>0){let n=r[s].semver;if(n.major===e.major&&n.minor===e.minor&&n.patch===e.patch)return !0}return !1}return !0},"testSet");});var _=y((bc,zr)=>{a();var X=Symbol("SemVer ANY"),Yn=class ve{static{o(this,"Comparator");}static get ANY(){return X}constructor(e,t){if(t=Hr(t),e instanceof ve){if(e.loose===!!t.loose)return e;e=e.value;}e=e.trim().split(/\s+/).join(" "),Ie("comparator",e,t),this.options=t,this.loose=!!t.loose,this.parse(e),this.semver===X?this.value="":this.value=this.operator+this.semver.version,Ie("comp",this);}parse(e){let t=this.options.loose?Br[Mr.COMPARATORLOOSE]:Br[Mr.COMPARATOR],s=e.match(t);if(!s)throw new TypeError(`Invalid comparator: ${e}`);this.operator=s[1]!==void 0?s[1]:"",this.operator==="="&&(this.operator=""),s[2]?this.semver=new Yr(s[2],this.options.loose):this.semver=X;}toString(){return this.value}test(e){if(Ie("Comparator.test",e,this.options.loose),this.semver===X||e===X)return !0;if(typeof e=="string")try{e=new Yr(e,this.options);}catch{return !1}return ge(e,this.operator,this.semver,this.options)}intersects(e,t){if(!(e instanceof ve))throw new TypeError("a Comparator is required");return this.operator===""?this.value===""?!0:new Wr(e.value,t).test(this.value):e.operator===""?e.value===""?!0:new Wr(this.value,t).test(e.semver):(t=Hr(t),t.includePrerelease&&(this.value==="<0.0.0-0"||e.value==="<0.0.0-0")||!t.includePrerelease&&(this.value.startsWith("<0.0.0")||e.value.startsWith("<0.0.0"))?!1:!!(this.operator.startsWith(">")&&e.operator.startsWith(">")||this.operator.startsWith("<")&&e.operator.startsWith("<")||this.semver.version===e.semver.version&&this.operator.includes("=")&&e.operator.includes("=")||ge(this.semver,"<",e.semver,t)&&this.operator.startsWith(">")&&e.operator.startsWith("<")||ge(this.semver,">",e.semver,t)&&this.operator.startsWith("<")&&e.operator.startsWith(">")))}};zr.exports=Yn;var Hr=J(),{safeRe:Br,t:Mr}=x(),ge=Re(),Ie=U(),Yr=O(),Wr=T();});var H=y((Fc,Jr)=>{a();var Wn=T(),zn=o((r,e,t)=>{try{e=new Wn(e,t);}catch{return !1}return e.test(r)},"satisfies");Jr.exports=zn;});var Qr=y((_c,Kr)=>{a();var Jn=T(),Kn=o((r,e)=>new Jn(r,e).set.map(t=>t.map(s=>s.value).join(" ").trim().split(" ")),"toComparators");Kr.exports=Kn;});var et=y((Bc,Zr)=>{a();var Qn=O(),Zn=T(),ei=o((r,e,t)=>{let s=null,n=null,i=null;try{i=new Zn(e,t);}catch{return null}return r.forEach(c=>{i.test(c)&&(!s||n.compare(c)===-1)&&(s=c,n=new Qn(s,t));}),s},"maxSatisfying");Zr.exports=ei;});var tt=y((Wc,rt)=>{a();var ri=O(),ti=T(),si=o((r,e,t)=>{let s=null,n=null,i=null;try{i=new ti(e,t);}catch{return null}return r.forEach(c=>{i.test(c)&&(!s||n.compare(c)===1)&&(s=c,n=new ri(s,t));}),s},"minSatisfying");rt.exports=si;});var it=y((Kc,nt)=>{a();var Oe=O(),ni=T(),st=V(),ii=o((r,e)=>{r=new ni(r,e);let t=new Oe("0.0.0");if(r.test(t)||(t=new Oe("0.0.0-0"),r.test(t)))return t;t=null;for(let s=0;s<r.set.length;++s){let n=r.set[s],i=null;n.forEach(c=>{let l=new Oe(c.semver.version);switch(c.operator){case">":l.prerelease.length===0?l.patch++:l.prerelease.push(0),l.raw=l.format();case"":case">=":(!i||st(l,i))&&(i=l);break;case"<":case"<=":break;default:throw new Error(`Unexpected operation: ${c.operator}`)}}),i&&(!t||st(t,i))&&(t=i);}return t&&r.test(t)?t:null},"minVersion");nt.exports=ii;});var at=y((el,ot)=>{a();var oi=T(),ai=o((r,e)=>{try{return new oi(r,e).range||"*"}catch{return null}},"validRange");ot.exports=ai;});var oe=y((sl,pt)=>{a();var ci=O(),ut=_(),{ANY:li}=ut,ui=T(),pi=H(),ct=V(),lt=ee(),fi=te(),hi=re(),Ei=o((r,e,t,s)=>{r=new ci(r,s),e=new ui(e,s);let n,i,c,l,f;switch(t){case">":n=ct,i=fi,c=lt,l=">",f=">=";break;case"<":n=lt,i=hi,c=ct,l="<",f="<=";break;default:throw new TypeError('Must provide a hilo val of "<" or ">"')}if(pi(r,e,s))return !1;for(let d=0;d<e.set.length;++d){let $=e.set[d],E=null,I=null;if($.forEach(m=>{m.semver===li&&(m=new ut(">=0.0.0")),E=E||m,I=I||m,n(m.semver,E.semver,s)?E=m:c(m.semver,I.semver,s)&&(I=m);}),E.operator===l||E.operator===f||(!I.operator||I.operator===l)&&i(r,I.semver))return !1;if(I.operator===f&&c(r,I.semver))return !1}return !0},"outside");pt.exports=Ei;});var ht=y((ol,ft)=>{a();var mi=oe(),di=o((r,e,t)=>mi(r,e,">",t),"gtr");ft.exports=di;});var mt=y((ll,Et)=>{a();var yi=oe(),Ri=o((r,e,t)=>yi(r,e,"<",t),"ltr");Et.exports=Ri;});var Rt=y((fl,yt)=>{a();var dt=T(),$i=o((r,e,t)=>(r=new dt(r,t),e=new dt(e,t),r.intersects(e,t)),"intersects");yt.exports=$i;});var gt=y((ml,$t)=>{a();var gi=H(),Ii=A();$t.exports=(r,e,t)=>{let s=[],n=null,i=null,c=r.sort(($,E)=>Ii($,E,t));for(let $ of c)gi($,e,t)?(i=$,n||(n=$)):(i&&s.push([n,i]),i=null,n=null);n&&s.push([n,null]);let l=[];for(let[$,E]of s)$===E?l.push($):!E&&$===c[0]?l.push("*"):E?$===c[0]?l.push(`<=${E}`):l.push(`${$} - ${E}`):l.push(`>=${$}`);let f=l.join(" || "),d=typeof e.raw=="string"?e.raw:String(e);return f.length<d.length?f:e};});var St=y((yl,Lt)=>{a();var It=T(),Le=_(),{ANY:Ne}=Le,B=H(),Se=A(),vi=o((r,e,t={})=>{if(r===e)return !0;r=new It(r,t),e=new It(e,t);let s=!1;e:for(let n of r.set){for(let i of e.set){let c=Ni(n,i,t);if(s=s||c!==null,c)continue e}if(s)return !1}return !0},"subset"),Oi=[new Le(">=0.0.0-0")],vt=[new Le(">=0.0.0")],Ni=o((r,e,t)=>{if(r===e)return !0;if(r.length===1&&r[0].semver===Ne){if(e.length===1&&e[0].semver===Ne)return !0;t.includePrerelease?r=Oi:r=vt;}if(e.length===1&&e[0].semver===Ne){if(t.includePrerelease)return !0;e=vt;}let s=new Set,n,i;for(let m of r)m.operator===">"||m.operator===">="?n=Ot(n,m,t):m.operator==="<"||m.operator==="<="?i=Nt(i,m,t):s.add(m.semver);if(s.size>1)return null;let c;if(n&&i){if(c=Se(n.semver,i.semver,t),c>0)return null;if(c===0&&(n.operator!==">="||i.operator!=="<="))return null}for(let m of s){if(n&&!B(m,String(n),t)||i&&!B(m,String(i),t))return null;for(let ue of e)if(!B(m,String(ue),t))return !1;return !0}let l,f,d,$,E=i&&!t.includePrerelease&&i.semver.prerelease.length?i.semver:!1,I=n&&!t.includePrerelease&&n.semver.prerelease.length?n.semver:!1;E&&E.prerelease.length===1&&i.operator==="<"&&E.prerelease[0]===0&&(E=!1);for(let m of e){if($=$||m.operator===">"||m.operator===">=",d=d||m.operator==="<"||m.operator==="<=",n){if(I&&m.semver.prerelease&&m.semver.prerelease.length&&m.semver.major===I.major&&m.semver.minor===I.minor&&m.semver.patch===I.patch&&(I=!1),m.operator===">"||m.operator===">="){if(l=Ot(n,m,t),l===m&&l!==n)return !1}else if(n.operator===">="&&!B(n.semver,String(m),t))return !1}if(i){if(E&&m.semver.prerelease&&m.semver.prerelease.length&&m.semver.major===E.major&&m.semver.minor===E.minor&&m.semver.patch===E.patch&&(E=!1),m.operator==="<"||m.operator==="<="){if(f=Nt(i,m,t),f===m&&f!==i)return !1}else if(i.operator==="<="&&!B(i.semver,String(m),t))return !1}if(!m.operator&&(i||n)&&c!==0)return !1}return !(n&&d&&!i&&c!==0||i&&$&&!n&&c!==0||I||E)},"simpleSubset"),Ot=o((r,e,t)=>{if(!r)return e;let s=Se(r.semver,e.semver,t);return s>0?r:s<0||e.operator===">"&&r.operator===">="?e:r},"higherGT"),Nt=o((r,e,t)=>{if(!r)return e;let s=Se(r.semver,e.semver,t);return s<0?r:s>0||e.operator==="<"&&r.operator==="<="?e:r},"lowerLT");Lt.exports=vi;});var wt=y((gl,Tt)=>{a();var ke=x(),kt=F(),Li=O(),At=me(),Si=C(),ki=er(),Ai=tr(),Ti=ir(),wi=cr(),qi=ur(),Pi=fr(),Ci=Er(),xi=dr(),Di=A(),bi=gr(),ji=vr(),Gi=Z(),Fi=Sr(),Ui=Ar(),Vi=V(),_i=ee(),Xi=de(),Hi=ye(),Bi=re(),Mi=te(),Yi=Re(),Wi=jr(),zi=_(),Ji=T(),Ki=H(),Qi=Qr(),Zi=et(),eo=tt(),ro=it(),to=at(),so=oe(),no=ht(),io=mt(),oo=Rt(),ao=gt(),co=St();Tt.exports={parse:Si,valid:ki,clean:Ai,inc:Ti,diff:wi,major:qi,minor:Pi,patch:Ci,prerelease:xi,compare:Di,rcompare:bi,compareLoose:ji,compareBuild:Gi,sort:Fi,rsort:Ui,gt:Vi,lt:_i,eq:Xi,neq:Hi,gte:Bi,lte:Mi,cmp:Yi,coerce:Wi,Comparator:zi,Range:Ji,satisfies:Ki,toComparators:Qi,maxSatisfying:Zi,minSatisfying:eo,minVersion:ro,validRange:to,outside:so,gtr:no,ltr:io,intersects:oo,simplifyRange:ao,subset:co,SemVer:Li,re:ke.re,src:ke.src,tokens:ke.t,SEMVER_SPEC_VERSION:kt.SEMVER_SPEC_VERSION,RELEASE_TYPES:kt.RELEASE_TYPES,compareIdentifiers:At.compareIdentifiers,rcompareIdentifiers:At.rcompareIdentifiers};});a();a();var qe={};Qt(qe,{default:()=>To,languages:()=>_t,options:()=>Vt,parsers:()=>Xt,pluginPackageJson:()=>Ht});a();a();var W=Ce(De(),1);a();var rs=/^(?:( )+|\t+)/,G="space",je="tab";function be(r,e){let t=new Map,s=0,n,i;for(let c of r.split(/\n/g)){if(!c)continue;let l,f,d,$,E,I=c.match(rs);if(I===null)s=0,n="";else {if(l=I[0].length,f=I[1]?G:je,e&&f===G&&l===1)continue;f!==n&&(s=0),n=f,d=1,$=0;let m=l-s;if(s=l,m===0)d=0,$=1;else {let ue=m>0?m:-m;i=ts(f,ue);}E=t.get(i),E=E===void 0?[1,0]:[E[0]+d,E[1]+$],t.set(i,E);}}return t}o(be,"makeIndentsMap");function ts(r,e){return (r===G?"s":"t")+String(e)}o(ts,"encodeIndentsKey");function ss(r){let t=r[0]==="s"?G:je,s=Number(r.slice(1));return {type:t,amount:s}}o(ss,"decodeIndentsKey");function ns(r){let e,t=0,s=0;for(let[n,[i,c]]of r)(i>t||i===t&&c>s)&&(t=i,s=c,e=n);return e}o(ns,"getMostUsedKey");function is(r,e){return (r===G?" ":"	").repeat(e)}o(is,"makeIndentString");function pe(r){if(typeof r!="string")throw new TypeError("Expected a string");let e=be(r,!0);e.size===0&&(e=be(r,!1));let t=ns(e),s,n=0,i="";return t!==void 0&&({type:s,amount:n}=ss(t),i=is(s,n)),{amount:n,type:s,indent:i}}o(pe,"detectIndent");a();function os(r){if(typeof r!="string")throw new TypeError("Expected a string");let e=r.match(/(?:\r?\n)/g)||[];if(e.length===0)return;let t=e.filter(n=>n===`\r
`).length,s=e.length-t;return t>s?`\r
`:`
`}o(os,"detectNewline");function Ge(r){return typeof r=="string"&&os(r)||`
`}o(Ge,"detectNewlineGraceful");a();var cs=new URL("./index.json",h),ls=JSON.parse(as__default.default.readFileSync(cs)),Fe=ls;a();function fe(r){if(typeof r!="object"||r===null)return !1;let e=Object.getPrototypeOf(r);return (e===null||e===Object.prototype||Object.getPrototypeOf(e)===null)&&!(Symbol.toStringTag in r)&&!(Symbol.iterator in r)}o(fe,"isPlainObject");var ce=Ce(wt(),1);var we=Object.hasOwn||((r,e)=>Object.prototype.hasOwnProperty.call(r,e)),b=o(r=>(e,...t)=>r.reduce((s,n)=>n(s,...t),e),"pipe"),Y=o(r=>e=>Array.isArray(e)?r(e):e,"onArray"),jt=o(r=>e=>Array.isArray(e)&&e.every(t=>typeof t=="string")?r(e):e,"onStringArray"),M=jt(r=>[...new Set(r)]),lo=jt(r=>[...r].sort()),ae=b([M,lo]),j=o(r=>(e,...t)=>fe(e)?r(e,...t):e,"onObject"),N=o((r,e)=>{let t=j(s=>(e&&(s=Object.fromEntries(Object.entries(s).map(([n,i])=>[n,t(i)]))),(0, W.default)(s,r)));return t},"sortObjectBy"),g=N(),Ae=N(["type","url"]),Te=N(["name","email","url"]),uo=N(["lib","bin","man","doc","example","test"]),w=o((r,e)=>(t,...s)=>we(t,r)?{...t,[r]:e(t[r],...s)}:t,"overProperty"),qt=N(Fe),Pt=o(r=>{let[e]=r.split(">"),t=[...e.matchAll("@")];if(!t.length||t.length===1&&t[0].index===0)return {name:r};let s=t.pop().index;return {name:e.substring(0,s),range:e.substring(s+1)}},"parseNameAndVersionRange"),po=N((r,e)=>{let{name:t,range:s}=Pt(r),{name:n,range:i}=Pt(e);return t!==n?t.localeCompare(n,"en"):s?i?ce.default.compare(ce.default.minVersion(s),ce.default.minVersion(i)):1:-1}),Ct=o(r=>{let e=r.split("@");return r.startsWith("@")?e.length>2?e.slice(0,-1).join("@"):r:e.length>1?e.slice(0,-1).join("@"):r},"getPackageName"),fo=o((r,e)=>{let t=Ct(r),s=Ct(e);return t<s?-1:t>s?1:0},"sortObjectByIdent"),ho=["files","excludedFiles","env","parser","parserOptions","settings","plugins","extends","rules","overrides","globals","processor","noInlineConfig","reportUnusedDisableDirectives"],Gt=j(b([N(ho),w("env",g),w("globals",g),w("overrides",Y(r=>r.map(Gt))),w("parserOptions",g),w("rules",N((r,e)=>r.split("/").length-e.split("/").length||r.localeCompare(e))),w("settings",g)])),Eo=N(["description","url","href"]),mo=j(b([r=>(0, W.default)(r,[...Object.keys(r).filter(e=>e!=="overrides").sort(),"overrides"]),w("overrides",Y(r=>r.map(b([g,w("options",g)]))))])),yo=N(["node","npm","yarn"]),Ro=["peerDependencyRules","neverBuiltDependencies","onlyBuiltDependencies","onlyBuiltDependenciesFile","allowedDeprecatedVersions","allowNonAppliedPatches","updateConfig","auditConfig","requiredScripts","supportedArchitectures","overrides","patchedDependencies","packageExtensions"],$o=j(b([N(Ro,!0),w("overrides",po)])),go=new Set(["install","pack","prepare","publish","restart","shrinkwrap","start","stop","test","uninstall","version"]),xt=o((r,e)=>we(e,"devDependencies")&&we(e.devDependencies,r),"hasDevDependency"),Dt=j((r,e)=>{let t=Object.keys(r),s=new Set,n=t.map(c=>{let l=c.replace(/^(?:pre|post)/,"");return go.has(l)||t.includes(l)?(s.add(l),l):c});!xt("npm-run-all",e)&&!xt("npm-run-all2",e)&&n.sort();let i=n.flatMap(c=>s.has(c)?[`pre${c}`,c,`post${c}`]:[c]);return (0, W.default)(r,i)}),Ft=[{key:"$schema"},{key:"name"},{key:"displayName"},{key:"version"},{key:"private"},{key:"description"},{key:"categories",over:M},{key:"keywords",over:M},{key:"homepage"},{key:"bugs",over:N(["url","email"])},{key:"repository",over:Ae},{key:"funding",over:Ae},{key:"license",over:Ae},{key:"qna"},{key:"author",over:Te},{key:"maintainers",over:Y(r=>r.map(Te))},{key:"contributors",over:Y(r=>r.map(Te))},{key:"publisher"},{key:"sideEffects"},{key:"type"},{key:"imports"},{key:"exports"},{key:"main"},{key:"svelte"},{key:"umd:main"},{key:"jsdelivr"},{key:"unpkg"},{key:"module"},{key:"source"},{key:"jsnext:main"},{key:"browser"},{key:"react-native"},{key:"types"},{key:"typesVersions"},{key:"typings"},{key:"style"},{key:"example"},{key:"examplestyle"},{key:"assets"},{key:"bin",over:g},{key:"man"},{key:"directories",over:uo},{key:"files",over:M},{key:"workspaces"},{key:"binary",over:N(["module_name","module_path","remote_path","package_name","host"])},{key:"scripts",over:Dt},{key:"betterScripts",over:Dt},{key:"contributes",over:g},{key:"activationEvents",over:M},{key:"husky",over:w("hooks",qt)},{key:"simple-git-hooks",over:qt},{key:"pre-commit"},{key:"commitlint",over:g},{key:"lint-staged"},{key:"nano-staged"},{key:"config",over:g},{key:"nodemonConfig",over:g},{key:"browserify",over:g},{key:"babel",over:g},{key:"browserslist"},{key:"xo",over:g},{key:"prettier",over:mo},{key:"eslintConfig",over:Gt},{key:"eslintIgnore"},{key:"npmpkgjsonlint",over:g},{key:"npmPackageJsonLintConfig",over:g},{key:"npmpackagejsonlint",over:g},{key:"release",over:g},{key:"remarkConfig",over:g},{key:"stylelint"},{key:"ava",over:g},{key:"jest",over:g},{key:"jest-junit",over:g},{key:"jest-stare",over:g},{key:"mocha",over:g},{key:"nyc",over:g},{key:"c8",over:g},{key:"tap",over:g},{key:"oclif",over:N(void 0,!0)},{key:"resolutions",over:g},{key:"dependencies",over:g},{key:"devDependencies",over:g},{key:"dependenciesMeta",over:N(fo,!0)},{key:"peerDependencies",over:g},{key:"peerDependenciesMeta",over:N(void 0,!0)},{key:"optionalDependencies",over:g},{key:"bundledDependencies",over:ae},{key:"bundleDependencies",over:ae},{key:"extensionPack",over:ae},{key:"extensionDependencies",over:ae},{key:"flat"},{key:"packageManager"},{key:"engines",over:g},{key:"engineStrict",over:g},{key:"volta",over:yo},{key:"languageName"},{key:"os"},{key:"cpu"},{key:"preferGlobal",over:g},{key:"publishConfig",over:g},{key:"icon"},{key:"badges",over:Y(r=>r.map(Eo))},{key:"galleryBanner",over:g},{key:"preview"},{key:"markdown"},{key:"pnpm",over:$o}],bt=Ft.map(({key:r})=>r),Io=b(Ft.map(({key:r,over:e})=>e?w(r,e):void 0).filter(Boolean));function vo(r,e){if(typeof r=="string"){let{indent:t,type:s}=pe(r),n=r.slice(-1)===`
`?`
`:"",i=Ge(r);r=JSON.parse(r);let c=JSON.stringify(e(r),null,s==="tab"?"	":t)+n;return i===`\r
`&&(c=c.replace(/\n/g,i)),c}return e(r)}o(vo,"editStringJSON");var Oo=o(r=>r[0]==="_","isPrivateKey"),No=o((r,e)=>r.reduce((t,s)=>(t[e(s)?0:1].push(s),t),[[],[]]),"partition");function Ut(r,e={}){return vo(r,j(t=>{let s=e.sortOrder||bt;if(Array.isArray(s)){let n=Object.keys(t),[i,c]=No(n,Oo);s=[...s,...bt,...c.sort(),...i.sort()];}return Io((0, W.default)(t,s),t)}))}o(Ut,"sortPackageJson");var Vt={sortPackageJsonSortOrder:{category:"Format",type:"string",description:"Custom ordering array.",default:[{value:[]}],array:!0}},{languages:Ao}=ko__namespace,_t=Ao.filter(({name:r})=>r==="JSON.stringify"),le=babel.parsers["json-stringify"],Xt={"json-stringify":{...le,async parse(r,e){let{filepath:t}=e;if(/package.*json$/u.test(t)){r=await Lo__default.default.format(r,{filepath:t}),le.preprocess&&(r=le.preprocess(r,e));let s=e?.sortPackageJsonSortOrder;r=Ut(r,s&&s.length>0?{sortOrder:s}:{});}return le.parse(r,e)}}},Ht={languages:_t,options:Vt,parsers:Xt},To=Ht;var Pe={"@bfra.me/prettier-plugins/package-json":qe};async function Bt(r,e){try{if(!Pe[e]){let t=r(e);Pe[e]=t;}return Pe[e]??e}catch{return e}}o(Bt,"resolve");var qo=module$1.createRequire(h),Po=Bt.bind(null,qo.resolve),{searchParams:Co}=new URL(h),xo={arrowParens:"avoid",bracketSpacing:!1,endOfLine:"auto",printWidth:100,semi:Co.has("semi","true"),singleQuote:!0,overrides:[{files:["**/node_modules/**","**/dist/**","**/coverage/**","**/out/**","**/temp/**","**/.idea/**","**/.next/**","**/.nuxt/**","**/.output/**","**/.tsup/**","**/.vercel/**","**/.vitepress/cache/**","**/.vite-inspect/**","**/__snapshots__/**","**/test/fixtures/**","**/auto-import?(s).d.ts","**/.changeset/*.md","**/CHANGELOG*.md","**/changelog*.md","**/components.d.ts","**/devcontainer-lock.json","**/LICENSE*","**/license*","**/*.min.*","**/package-lock.json","**/pnpm-lock.yaml","**/typed-router.d.ts","**/yarn.lock"],options:{requirePragma:!0}},{files:[".vscode/*.json",".devcontainer/**/devcontainer*.json"],options:{tabWidth:4}},{files:["*.md"],options:{proseWrap:"never",singleQuote:!1}}],plugins:["@bfra.me/prettier-plugins/package-json"].map(Po)};exports.default=xo;module.exports=exports.default;//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map