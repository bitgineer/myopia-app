import './style.css';
import { getHistory, getTotalStats } from './utils/storage';
import type { Session } from './utils/storage';

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderStats(): void {
  const stats = getTotalStats();
  const statsContainer = document.getElementById('stats-container')!;
  
  statsContainer.innerHTML = `
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-primary-500 text-white p-4 rounded-lg shadow">
        <div class="text-3xl font-bold">${stats.totalSessions}</div>
        <div class="text-sm opacity-90">Total Sessions</div>
      </div>
      <div class="bg-primary-500 text-white p-4 rounded-lg shadow">
        <div class="text-3xl font-bold">${formatDuration(stats.totalDurationMs)}</div>
        <div class="text-sm opacity-90">Total Time</div>
      </div>
    </div>
  `;
}

function renderHistory(): void {
  const history = getHistory();
  const historyContainer = document.getElementById('history-container')!;
  
  if (history.length === 0) {
    historyContainer.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <p class="text-lg">No sessions recorded yet.</p>
        <p class="text-sm mt-2">Start exercising to track your progress!</p>
      </div>
    `;
    return;
  }
  
  // Sort by date descending
  const sortedHistory = [...history].sort((a, b) => b.startTime - a.startTime);
  
  historyContainer.innerHTML = `
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
          ${sortedHistory.map((session: Session, index: number) => `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors ${index >= 10 ? 'hidden' : ''}" data-row>
              <td class="py-3 px-4 text-sm text-gray-700">${formatDate(session.startTime)}</td>
              <td class="py-3 px-4 text-sm">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ${session.pattern}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-gray-700">${session.speed}x</td>
              <td class="py-3 px-4 text-sm text-gray-700">${formatDuration(session.durationMs)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${sortedHistory.length > 10 ? `
        <div class="text-center mt-4">
          <button id="show-more" class="text-primary-500 hover:text-primary-600 font-medium text-sm">
            Show all ${sortedHistory.length} sessions
          </button>
        </div>
      ` : ''}
    </div>
  `;
  
  // Add show more functionality
  const showMoreBtn = document.getElementById('show-more');
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      document.querySelectorAll('[data-row].hidden').forEach(row => {
        row.classList.remove('hidden');
      });
      showMoreBtn.parentElement?.remove();
    });
  }
}

function renderChart(): void {
  const history = getHistory();
  const chartContainer = document.getElementById('chart-container')!;
  
  if (history.length < 2) {
    chartContainer.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <p class="text-sm">Complete more sessions to see progress chart</p>
      </div>
    `;
    return;
  }
  
  // Get last 14 sessions
  const recentSessions = history
    .sort((a, b) => a.startTime - b.startTime)
    .slice(-14);
  
  const maxDuration = Math.max(...recentSessions.map(s => s.durationMs));
  const chartHeight = 200;
  
  chartContainer.innerHTML = `
    <div class="flex items-end justify-between h-[200px] gap-2 mt-4">
      ${recentSessions.map((session, index) => {
        const height = maxDuration > 0 ? (session.durationMs / maxDuration) * chartHeight : 0;
        const minHeight = 4;
        const barHeight = Math.max(height, minHeight);
        
        return `
          <div class="flex-1 flex flex-col items-center group cursor-pointer">
            <div class="relative w-full">
              <div 
                class="bg-primary-500 rounded-t transition-all duration-300 group-hover:bg-primary-600"
                style="height: ${barHeight}px; min-height: 4px;"
              ></div>
              <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                ${formatDuration(session.durationMs)}
              </div>
            </div>
            <div class="text-xs text-gray-500 mt-1 truncate w-full text-center">
              ${index % 3 === 0 ? new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="text-center text-sm text-gray-600 mt-4">
      Last ${recentSessions.length} Sessions
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderHistory();
  renderChart();
  
  // Clear history button
  document.getElementById('clear-history')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      localStorage.removeItem('myopiaAppProgress_v2');
      renderStats();
      renderHistory();
      renderChart();
    }
  });
});
