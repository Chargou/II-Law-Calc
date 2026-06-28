(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[{name:`Perception`,tier:`lesser`,materials:[`Lucent`],buffs:{Citizens:1.6}},{name:`Illusion`,tier:`lesser`,materials:[`Ichor`],buffs:{Divinity:1.6}},{name:`Anima`,tier:`lesser`,materials:[`Cindral`],buffs:{Qi:4096}},{name:`Alacrity`,tier:`greater`,materials:[`Kismet`,`Morrow`],buffs:{Citizens:1.8,Divinity:1.8}},{name:`Strength`,tier:`greater`,materials:[`Aster`,`Sable`],buffs:{Qi:2048,Remnants:1.4}},{name:`Darkness`,tier:`greater`,materials:[`Aeon`,`Axiom`],buffs:{"Manual Luck":1.1,"Disciple Luck":1.6}},{name:`Time`,tier:`origin`,materials:[`Solace`,`Grace`],buffs:{Qi:8192,"Breakthrough Cost":.9,Citizens:1.4}},{name:`Life`,tier:`origin`,materials:[`Cindral`,`Morrow`],buffs:{Damage:1.4,"Disciple Luck":2,Citizens:1.7}},{name:`Death`,tier:`origin`,materials:[`Grace`,`Axiom`],buffs:{Divinity:2,Citizens:2,Qi:8192}}],t=[{material:`Lucent`,mark:`Mark of Insight`,ratePerSecond:.035},{material:`Ichor`,mark:`Mark of Essence`,ratePerSecond:.031},{material:`Cindral`,mark:`Mark of Soulfire`,ratePerSecond:.027},{material:`Kismet`,mark:`Mark of Karma`,ratePerSecond:.0235},{material:`Aster`,mark:`Mark of Stars`,ratePerSecond:.0205},{material:`Aeon`,mark:`Mark of Nebulae`,ratePerSecond:.018},{material:`Solace`,mark:`Mark of Quasar`,ratePerSecond:.0155},{material:`Morrow`,mark:`Mark of Miasma`,ratePerSecond:.0135},{material:`Sable`,mark:`Mark of Ash`,ratePerSecond:.0115},{material:`Axiom`,mark:`Mark of Laws`,ratePerSecond:.01},{material:`Grace`,mark:`Mark of Faith`,ratePerSecond:.0085}],n={lesser:{baseMaterial:5,baseCores:25e3},greater:{baseMaterial:10,baseCores:5e4},origin:{baseMaterial:15,baseCores:1e5},coreRatePerSecond:40,maxLevel:10},r=e,i=t,a=n;function o(e){return a[e]}function s(e){let t=i.find(t=>t.material===e);return t?t.ratePerSecond:0}function c(e){let t=i.find(t=>t.material===e);return t?t.mark:e}function l(){return a.coreRatePerSecond}function u(){return a.maxLevel}function d(e={},t={},n=0,a=!1){let o={};for(let t of r)o[t.name]=e[t.name]??0;let s={};for(let e of i)s[e.material]=t[e.material]??0;return{laws:o,materials:s,cores:Math.max(0,n),reincarnation:a}}function f(e,t){return e.laws[t]??0}function p(e,t,n){e.laws[t]=Math.max(0,n)}function m(e,t){return e.materials[t]??0}function h(e){return e.cores}function g(e){return JSON.parse(JSON.stringify(e))}function _(e,t){let n=o(e.tier),r=t+1;return{materials:e.materials.map(e=>({name:e,qty:n.baseMaterial*r})),cores:n.baseCores*r}}function v(e,t){return t>=u()}function y(e,t){return{materials:t.materials.map(({name:t,qty:n})=>{let r=e.materials[t]||0;return{name:t,qty:Math.max(0,n-r)}}),cores:Math.max(0,t.cores-e.cores)}}function b(e,t){let n=y(e,t),r=e.reincarnation?2:1,i=e.reincarnation?3:1,a=0;for(let{name:e,qty:t}of n.materials)t>0&&(a+=t/(s(e)*r));return n.cores>0&&(a+=n.cores/(l()*i)),a}function x(e,t){let n=e.reincarnation?2:1,r=e.reincarnation?3:1,i=0;for(let{name:e,qty:r}of t.materials)i+=r/(s(e)*n);return i+=t.cores/(l()*r),i}function S(e,t){return{actual:b(e,t),total:x(e,t)}}var C=[`Qi`,`Divinity`,`Citizens`,`Damage`,`Manual Luck`,`Disciple Luck`,`Remnants`];function w(e,t){let n=e.buffs[t]??0;return t===`Qi`&&e.buffs[`Breakthrough Cost`]&&(n*=1/e.buffs[`Breakthrough Cost`]),n}function T(e,t){let n=0;for(let r of C){let i=t[r]||0;i<=0||(n+=w(e,r)*i)}return n}function E(e,t,n,r=`total`){let i=null;for(let a of n){let n=f(e,a.name);if(v(a,n))continue;let o=T(a,t);if(o<=0)continue;let s=_(a,n),c=x(e,s),l=b(e,s),u=r===`actual`?l:c,d;d=u<=0?0x38d7ea4c68000*o+o/(c||.001):o/u,(!i||d>i.score)&&(i={law:a,totalGain:o,timeCost:u,cost:s,fromLevel:n,toLevel:n+1,score:d})}return i}function D(e,t){let n=t.cost;for(let{name:t,qty:r}of n.materials){let n=e.materials[t]||0;e.materials[t]=n-r}e.cores-=n.cores,p(e,t.law.name,t.toLevel)}function O(e,t,n,r,i=`total`){let a=g(e),o=[];for(;;){let e=E(a,t,n,i);if(!e||r!==void 0&&e.timeCost>r)break;D(a,e),o.push(e)}return o}function k(e,t){let n={},r=0,i=e.reincarnation?2:1,a=e.reincarnation?3:1;return t.map(t=>{for(let{name:e,qty:r}of t.cost.materials)n[e]=(n[e]||0)+r;r+=t.cost.cores;let o=[],u=t.cost.materials.map(({name:t,qty:r})=>{let a=n[t],l=(e.materials[t]||0)-(a-r),u=Math.max(0,r-Math.max(0,l)),d=s(t)*i,f=c(t);return u>0&&o.push({type:`material`,resource:t,mark:f,deficit:u,rate:d,duration:u/d}),{name:t,needed:r,have:Math.max(0,l),deficit:u,rate:d,mark:f,timeSeconds:u>0?u/d:0}}),d=e.cores-(r-t.cost.cores),f=Math.max(0,t.cost.cores-Math.max(0,d)),p=f>0?f/(l()*a):0;return f>0&&o.push({type:`cores`,deficit:f,duration:p}),{...t,deficits:{materials:u,cores:f,coreTime:p,farmSteps:o}}})}function A(e,t,n){let r={};for(let n=0;n<t.length;n++){let i=t[n],a=_(i.law,i.fromLevel);for(let{name:t,qty:i}of a.materials)if(r[t]||(r[t]={totalQty:0,earliestStep:-1,type:`material`}),r[t].totalQty+=i,r[t].earliestStep===-1){let i=m(e,t);r[t].totalQty>i&&(r[t].earliestStep=n)}if(!r._cores){let i=0;for(let e=0;e<=n;e++)i+=_(t[e].law,t[e].fromLevel).cores;i>e.cores?r._cores={totalQty:i,earliestStep:n,type:`cores`}:n===t.length-1&&(r._cores={totalQty:i,earliestStep:-1,type:`cores`})}}if(!r._cores){let e=0;for(let n of t)e+=_(n.law,n.fromLevel).cores;r._cores={totalQty:e,earliestStep:-1,type:`cores`}}let i=[];for(let[t,n]of Object.entries(r)){if(n.earliestStep===-1)continue;let r;if(r=n.type===`cores`?Math.max(0,n.totalQty-e.cores):Math.max(0,n.totalQty-m(e,t)),r<=0)continue;let a=e.reincarnation?n.type===`cores`?3:2:1,o=(n.type===`cores`?l():s(t))*a,c=r/o;i.push({name:n.type===`cores`?`cores`:t,type:n.type,deficit:r,timeNeeded:c,earliestStep:n.earliestStep})}if(i.length===0)return null;let a=i.reduce((e,t)=>e.timeNeeded<t.timeNeeded?e:t),o;return o=n>=a.timeNeeded?i.reduce((e,t)=>e.timeNeeded>t.timeNeeded?e:t):i.reduce((e,t)=>e.earliestStep<t.earliestStep?e:t),{resource:o.name,type:o.type,deficit:o.deficit,timeNeeded:o.timeNeeded,duration:Math.min(o.timeNeeded,n),reason:`Earliest bottleneck: ${o.name} needed for ${t[o.earliestStep].law.name} (${Math.round(o.timeNeeded)}s needed, ${Math.round(n)}s budget)`}}var j=[`Qi`,`Divinity`,`Citizens`,`Damage`,`Manual Luck`,`Disciple Luck`,`Remnants`];function M(e,t,n){return Math.max(t,Math.min(n,e))}function N(e,t,n,r){return`
    <div class="section" data-section="${e}">
      <div class="section-header">
        <span class="toggle-icon">▼</span>
        <span>${t}</span>
      </div>
      <div class="section-body">${n.map(t=>{let n=t.name||t.material||t,i=t.label||n,a=t.max===void 0?``:` max="${t.max}"`;return`
      <div class="input-group">
        <label>${i}</label>
        <input type="number" data-panel="${e}" data-name="${n}" value="${r(n)}" min="0"${a}>
      </div>
    `}).join(``)}</div>
    </div>
  `}function P(e,t,n){let r=t.dataset.panel,i=t.dataset.name,a=M(parseInt(t.value)||0,0,t.max?parseInt(t.max):1/0);t.value=a,r===`laws`?p(e,i,a):r===`materials`?e.materials[i]=a:r===`cores`&&(e.cores=a),n.onStateChange()}function F(e,t,n){let a=r.map(e=>({name:e.name,label:e.name,max:10})),o=i.map(e=>({name:e.material,label:e.material})),s=n.weights,c=n.advanced;e.innerHTML=`
    ${N(`laws`,`Law Levels`,a,e=>f(t,e))}
    ${N(`materials`,`Materials`,o,e=>m(t,e))}
    ${N(`cores`,`Cores`,[{name:`cores`,label:`Cores`}],()=>h(t))}
    <div class="controls">
      ${c?`
        <div class="weights-grid">
          <div class="weights-title">Weights</div>
          ${j.map(e=>`
            <div class="weight-row">
              <label>${e}</label>
              <input type="number" class="weight-input" data-metric="${e}" value="${s[e]||0}" min="0" step="1">
            </div>
          `).join(``)}
        </div>
      `:`
        <label>
          Metric
          <select id="metric-select">
            ${j.map(e=>`<option value="${e}"${s[e]?` selected`:``}>${e}</option>`).join(``)}
          </select>
        </label>
      `}
      <label>
        AFK hours
        <input type="number" id="afk-hours" value="${n.afkHours}" min="0.5" step="0.5">
      </label>
      <label class="checkbox-label">
        <input type="checkbox" id="time-mode" ${n.timeMode===`actual`?`checked`:``}>
        Use actual time (instead of total)
      </label>
      <label class="checkbox-label">
        <input type="checkbox" id="advanced-mode" ${c?`checked`:``}>
        Advanced mode (weights)
      </label>
      <label class="checkbox-label">
        <input type="checkbox" id="reincarnation" ${t.reincarnation?`checked`:``}>
        First reincarnation done (2× mat rate, 3× core rate)
      </label>
    </div>
  `,e.addEventListener(`input`,e=>{let r=e.target;r.dataset.panel&&P(t,r,n)}),e.addEventListener(`click`,e=>{let t=e.target.closest(`.section-header`);if(!t)return;let n=t.closest(`.section`),r=n.querySelector(`.section-body`),i=t.querySelector(`.toggle-icon`),a=n.dataset.collapsed===`true`;n.dataset.collapsed=String(!a),r.style.display=a?`block`:`none`,i.textContent=a?`▼`:`▶`});let l=e.querySelector(`#metric-select`);l&&l.addEventListener(`change`,e=>{n.onMetricChange(e.target.value)}),e.querySelectorAll(`.weight-input`).forEach(e=>{e.addEventListener(`change`,e=>{let t=e.target.dataset.metric,r=Math.max(0,parseFloat(e.target.value)||0);e.target.value=r,n.onWeightsChange(t,r)})}),e.querySelector(`#afk-hours`).addEventListener(`change`,e=>{n.onAfkHoursChange(parseFloat(e.target.value)||2)}),e.querySelector(`#time-mode`).addEventListener(`change`,e=>{n.onTimeModeChange(e.target.checked?`actual`:`total`)}),e.querySelector(`#advanced-mode`).addEventListener(`change`,e=>{n.onAdvancedChange(e.target.checked)}),e.querySelector(`#reincarnation`).addEventListener(`change`,e=>{n.onReincarnationChange(e.target.checked)})}function I(e){let t=Math.floor(e/3600),n=Math.floor(e%3600/60),r=Math.round(e%60);return t>0?`${t}h ${n}m ${r}s`:n>0?`${n}m ${r}s`:`${r}s`}function L(e){return e==null?`0`:Number.isInteger(e)?e.toLocaleString():e<1?e.toLocaleString(void 0,{maximumFractionDigits:4}):e<100?e.toLocaleString(void 0,{maximumFractionDigits:2}):e.toLocaleString(void 0,{maximumFractionDigits:1})}function R(e){return e.map(e=>`${L(e.qty)} ${e.name}`).join(`, `)}function z(e,t,n){if(!e)return`<div class="card"><h3>Best Next Upgrade</h3><p class="empty-state">No upgrades available — set weights to find upgrades.</p></div>`;let r=S(t,e.cost),i=n===`actual`?`Actual time`:`Total time`,a=n===`actual`?r.actual:r.total;return`
    <div class="card">
      <h3>Best Next Upgrade</h3>
      <div class="upgrade-law">${e.law.name} <span class="upgrade-level">${e.fromLevel} → ${e.toLevel}</span></div>
      <div class="upgrade-cost">${R(e.cost.materials)}, ${L(e.cost.cores)} cores</div>
      <div class="upgrade-stat">Score: <strong class="gain">${L(e.totalGain)}</strong> (weighted gain)</div>
      <div class="upgrade-stat">${i}: <strong>${I(a)}</strong></div>
    </div>
  `}function B(e){return e.type===`cores`?`Farm cores for ${I(e.duration)} (${L(e.deficit)} cores needed)`:`Farm ${e.mark} for ${I(e.duration)} (${L(e.deficit)} ${e.resource} needed)`}function V(e){return e.deficits.farmSteps.length===0?`<div class="detail-empty">No farming needed — you have enough resources.</div>`:e.deficits.farmSteps.map(e=>`
    <div class="detail-farm">${B(e)}</div>
  `).join(``)}function H(e,t,n){if(e.length===0)return`<div class="card"><h3>Full Upgrade Path</h3><p class="empty-state">Enter resources and select a metric to see the upgrade path.</p></div>`;let r=n===`actual`?`Actual`:`Total`,i=k(t,e),a=e=>n===`actual`?e.deficits.farmSteps.reduce((e,t)=>e+t.duration,0):x(t,e.cost),o=i.map((e,t)=>`
      <tr class="path-row" data-step="${t}">
        <td>${t+1}</td>
        <td>${e.law.name}</td>
        <td>${e.fromLevel}→${e.toLevel}</td>
        <td>${R(e.cost.materials)}</td>
        <td>${L(e.cost.cores)}</td>
        <td class="gain">${L(e.totalGain)}</td>
        <td>${I(a(e))}</td>
      </tr>
      <tr class="detail-row" data-step="${t}">
        <td colspan="7">
          <div class="step-detail">${V(e)}</div>
        </td>
      </tr>
    `).join(``),s=i.reduce((e,t)=>e+a(t),0);return`
    <div class="card">
      <h3>Full Upgrade Path (${e.length} steps)</h3>
      <div class="scroll-table">
        <table class="path-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Law</th>
              <th>Level</th>
              <th>Materials</th>
              <th>Cores</th>
              <th>Score</th>
              <th>${r}</th>
            </tr>
          </thead>
          <tbody>${o}</tbody>
        </table>
      </div>
      <div class="path-total">Total ${r.toLowerCase()} time: ${I(s)}</div>
    </div>
  `}function U(e,t,n,r,i=`total`){e.innerHTML=z(t,r,i)+H(n,r,i),e.querySelectorAll(`.path-row`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.dataset.step,r=e.querySelector(`.detail-row[data-step="${n}"]`);r&&r.classList.toggle(`open`)})})}function W(e){let t=Math.floor(e/3600),n=Math.floor(e%3600/60),r=Math.round(e%60);return t>0?`${t}h ${n}m ${r}s`:n>0?`${n}m ${r}s`:`${r}s`}function G(e){return e==null?`0`:Number.isInteger(e)?e.toLocaleString():e<1?e.toLocaleString(void 0,{maximumFractionDigits:4}):e<100?e.toLocaleString(void 0,{maximumFractionDigits:2}):e.toLocaleString(void 0,{maximumFractionDigits:1})}function K(e,t){if(!t){e.innerHTML=`
      <div class="card">
        <h3>Long AFK Recommendation</h3>
        <p class="empty-state">Run the optimizer above to see long AFK recommendations.</p>
      </div>
    `;return}e.innerHTML=`
    <div class="card">
      <h3>Long AFK Recommendation</h3>
      <div class="afk-action">Farm <strong>${t.type===`cores`?`Cores`:`${t.resource}`}</strong> for <strong>${W(t.duration)}</strong></div>
      <div class="upgrade-cost">${G(t.deficit)} ${t.type===`cores`?`cores`:t.resource} needed (${W(t.timeNeeded)} total)</div>
      <div class="afk-reason">${t.reason}</div>
    </div>
  `}var q=`ii-law-calc-state`,J=`ii-law-calc-settings`;function Y(){let e={};for(let t of C)e[t]=0;return e}function X(){try{let e=localStorage.getItem(q);if(e){let t=JSON.parse(e);return d(t.laws,t.materials,t.cores,t.reincarnation)}}catch{}return d()}function Z(e){localStorage.setItem(q,JSON.stringify({laws:e.laws,materials:e.materials,cores:e.cores,reincarnation:e.reincarnation}))}function Q(){try{let e=localStorage.getItem(J);if(e)return JSON.parse(e)}catch{}return{}}function ee(e){localStorage.setItem(J,JSON.stringify(e))}function te(e){let t=X(),n=Q(),i=n.advanced||!1,a=n.weights||{...Y(),...n.metric?{[n.metric]:1}:{Qi:1}},o=n.afkHours||2,s=n.timeMode||`actual`,c=i,l=e.querySelector(`#state-panel`),u=e.querySelector(`#optimizer-panel`),d=e.querySelector(`#afk-panel`);function f(){let e=E(t,a,r,s),n=O(t,a,r,void 0,s),i=n.length>0?A(t,n,o*3600):null;U(u,e,n,t,s),K(d,i)}function p(){ee({weights:a,afkHours:o,timeMode:s,advanced:c})}function m(){Z(t),f()}function h(e){a=Y(),a[e]=1,p(),f()}function g(e,t){a={...a,[e]:t},p(),f()}function _(e){o=e,p(),f()}function v(e){s=e,p(),f()}function y(e){if(c=e,!e){let e=Object.entries(a).find(([,e])=>e>0);a=Y(),a[e?e[0]:`Qi`]=1}F(l,t,{onStateChange:m,onMetricChange:h,onWeightsChange:g,onAfkHoursChange:_,onTimeModeChange:v,onAdvancedChange:y,onReincarnationChange:b,weights:a,afkHours:o,timeMode:s,advanced:c}),p(),f()}function b(e){t.reincarnation=e,m()}F(l,t,{onStateChange:m,onMetricChange:h,onWeightsChange:g,onAfkHoursChange:_,onTimeModeChange:v,onAdvancedChange:y,onReincarnationChange:b,weights:a,afkHours:o,timeMode:s,advanced:c}),f()}var $=document.getElementById(`app`);$&&te($);