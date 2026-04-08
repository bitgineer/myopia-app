import{g as h,b as m}from"./storage-XSAGXOmD.js";function i(t){const e=Math.floor(t/1e3),r=Math.floor(e/60),a=Math.floor(r/60);return a>0?`${a}h ${r%60}m ${e%60}s`:r>0?`${r}m ${e%60}s`:`${e}s`}function p(t){return new Date(t).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}function d(){const t=h(),e=document.getElementById("stats-container");e.innerHTML=`
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-primary-500 text-white p-4 rounded-lg shadow">
        <div class="text-3xl font-bold">${t.totalSessions}</div>
        <div class="text-sm opacity-90">Total Sessions</div>
      </div>
      <div class="bg-primary-500 text-white p-4 rounded-lg shadow">
        <div class="text-3xl font-bold">${i(t.totalDurationMs)}</div>
        <div class="text-sm opacity-90">Total Time</div>
      </div>
    </div>
  `}function l(){const t=m(),e=document.getElementById("history-container");if(t.length===0){e.innerHTML=`
      <div class="text-center py-8 text-gray-500">
        <p class="text-lg">No sessions recorded yet.</p>
        <p class="text-sm mt-2">Start exercising to track your progress!</p>
      </div>
    `;return}const r=[...t].sort((o,s)=>s.startTime-o.startTime);e.innerHTML=`
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b-2 border-gray-200">
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Pattern</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Speed</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Duration</th>
          </tr>
        </thead>
        <tbody>
          ${r.map((o,s)=>`
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors ${s>=10?"hidden":""}" data-row>
              <td class="py-3 px-4 text-sm text-gray-700">${p(o.startTime)}</td>
              <td class="py-3 px-4 text-sm">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ${o.pattern}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-gray-700">${o.speed}x</td>
              <td class="py-3 px-4 text-sm text-gray-700">${i(o.durationMs)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ${r.length>10?`
        <div class="text-center mt-4">
          <button id="show-more" class="text-primary-500 hover:text-primary-600 font-medium text-sm">
            Show all ${r.length} sessions
          </button>
        </div>
      `:""}
    </div>
  `;const a=document.getElementById("show-more");a&&a.addEventListener("click",()=>{var o;document.querySelectorAll("[data-row].hidden").forEach(s=>{s.classList.remove("hidden")}),(o=a.parentElement)==null||o.remove()})}function c(){const t=m(),e=document.getElementById("chart-container");if(t.length<2){e.innerHTML=`
      <div class="text-center py-8 text-gray-500">
        <p class="text-sm">Complete more sessions to see progress chart</p>
      </div>
    `;return}const r=t.sort((s,n)=>s.startTime-n.startTime).slice(-14),a=Math.max(...r.map(s=>s.durationMs)),o=200;e.innerHTML=`
    <div class="flex items-end justify-between h-[200px] gap-2 mt-4">
      ${r.map((s,n)=>{const x=a>0?s.durationMs/a*o:0;return`
          <div class="flex-1 flex flex-col items-center group cursor-pointer">
            <div class="relative w-full">
              <div 
                class="bg-primary-500 rounded-t transition-all duration-300 group-hover:bg-primary-600"
                style="height: ${Math.max(x,4)}px; min-height: 4px;"
              ></div>
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                ${i(s.durationMs)}
              </div>
            </div>
            <div class="text-xs text-gray-500 mt-1 truncate w-full text-center">
              ${n%3===0?new Date(s.startTime).toLocaleDateString("en-US",{month:"short",day:"numeric"}):""}
            </div>
          </div>
        `}).join("")}
    </div>
    <div class="text-center text-sm text-gray-600 mt-4">
      Last ${r.length} Sessions
    </div>
  `}document.addEventListener("DOMContentLoaded",()=>{var t;d(),l(),c(),(t=document.getElementById("clear-history"))==null||t.addEventListener("click",()=>{confirm("Are you sure you want to clear all history? This cannot be undone.")&&(localStorage.removeItem("myopiaAppProgress_v2"),d(),l(),c())})});
//# sourceMappingURL=progress-Bjq6xoYl.js.map
