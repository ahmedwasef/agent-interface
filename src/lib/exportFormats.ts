import * as XLSX from 'xlsx';
import { Task, Agent, WeeklyStats } from './types';
import { STATUS_LABELS, STATUS_COLORS, getWeeklyStats } from './utils';

// ── helpers ──────────────────────────────────────────────────────────────────
function esc(s: unknown) { return String(s ?? '').replace(/"/g, '""'); }
function dl(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

const STATUS_HTML_COLORS: Record<string, string> = {
  not_started: '#6B7280',
  in_progress: '#3B82F6',
  on_hold:     '#F59E0B',
  completed:   '#10B981',
};
const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

// ── 1. Excel (XLSX) ──────────────────────────────────────────────────────────
export function exportExcel(tasks: Task[], agents: Agent[]): void {
  const wb = XLSX.utils.book_new();
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const stats = getWeeklyStats(tasks, agents);

  // Sheet 1 — Summary
  const summaryData = [
    ['SWAT TEAM TASK REPORT', '', '', '', '', ''],
    ['Generated:', TODAY, '', '', '', ''],
    ['', '', '', '', '', ''],
    ['TEAM SUMMARY', '', '', '', '', ''],
    ['', 'Total Tasks', 'Completed', 'In Progress', 'On Hold', 'Not Started', 'Completion %'],
    ['ALL AGENTS', tasks.length,
      tasks.filter(t => t.status === 'completed').length,
      tasks.filter(t => t.status === 'in_progress').length,
      tasks.filter(t => t.status === 'on_hold').length,
      tasks.filter(t => t.status === 'not_started').length,
      tasks.length ? `${Math.round(tasks.filter(t => t.status === 'completed').length / tasks.length * 100)}%` : '0%',
    ],
    ['', '', '', '', '', ''],
    ['BY AGENT', '', '', '', '', ''],
    ['Agent', 'Total', 'Completed', 'In Progress', 'On Hold', 'Not Started', 'Rate %'],
    ...stats.map(s => [
      s.agentName, s.totalTasks, s.completed, s.inProgress, s.onHold, s.notStarted, `${s.completionRate}%`
    ]),
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  // Sheet 2 — All Tasks (PowerBI-ready)
  const headers = [
    'SWAT ID','Agent','CODIF','GROUPE','PROJET','AVION','Cahier','RFC',
    'STATUT RV','PERIODE','Date','Day','Priority','Est.Hours','Status',
    'Created At','Updated At','Description','Notes',
    'SC1 Status','SC1 Timestamp','SC1 By',
    'SC2 Status','SC2 Timestamp','SC2 By',
    'SC3 Status','SC3 Timestamp','SC3 By',
    'SC4 Status','SC4 Timestamp','SC4 By',
  ];
  const taskRows = tasks.map(t => {
    const row: (string | number)[] = [
      t.swatId || t.title,
      agentMap.get(t.agentId)?.name || '',
      t.codif || t.category,
      t.groupe || '', t.projet || '', t.avion || '', t.cahier || '', t.rfc || '',
      t.statutRv || '', t.periode || '',
      t.date, t.dayName, t.priority, t.estimatedHours, STATUS_LABELS[t.status],
      t.createdAt, t.updatedAt, t.description, t.notes,
    ];
    for (let i = 0; i < 4; i++) {
      const c = t.statusHistory[i];
      row.push(c ? STATUS_LABELS[c.status] : '', c ? c.timestamp : '', c ? c.changedBy : '');
    }
    return row;
  });
  const ws2 = XLSX.utils.aoa_to_sheet([headers, ...taskRows]);
  ws2['!cols'] = headers.map((_, i) => ({ wch: i < 3 ? 18 : 14 }));
  XLSX.utils.book_append_sheet(wb, ws2, 'All Tasks');

  // Sheet 3 — By Agent
  agents.forEach(agent => {
    const agentTasks = tasks.filter(t => t.agentId === agent.id);
    if (!agentTasks.length) return;
    const agentHeaders = ['SWAT ID','CODIF','GROUPE','Date','Day','Priority','Est.h','Status','Description'];
    const agentRows = agentTasks.map(t => [
      t.swatId || t.title, t.codif || t.category, t.groupe || '',
      t.date, t.dayName, t.priority, t.estimatedHours, STATUS_LABELS[t.status], t.description,
    ]);
    const wsA = XLSX.utils.aoa_to_sheet([agentHeaders, ...agentRows]);
    wsA['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 6 }, { wch: 14 }, { wch: 40 }];
    const sheetName = agent.name.split(' ')[0].slice(0, 31);
    XLSX.utils.book_append_sheet(wb, wsA, sheetName);
  });

  XLSX.writeFile(wb, `SWAT-report-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ── 2. PDF (via jsPDF + AutoTable) ───────────────────────────────────────────
export async function exportPDF(tasks: Task[], agents: Agent[]): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const stats = getWeeklyStats(tasks, agents);
  const total = tasks.length;
  const done  = tasks.filter(t => t.status === 'completed').length;

  // Cover header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 30, 'F');
  doc.setFontSize(18); doc.setTextColor(255, 255, 255);
  doc.text('SWAT Team Task Report', 14, 13);
  doc.setFontSize(9); doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${TODAY}`, 14, 20);
  doc.text(`Total: ${total} tasks  |  Completed: ${done}  |  Rate: ${total ? Math.round(done/total*100) : 0}%`, 14, 26);

  // Team summary table
  doc.setFontSize(11); doc.setTextColor(30, 41, 59);
  doc.text('Team Performance Summary', 14, 40);

  autoTable(doc, {
    startY: 44,
    head: [['Agent', 'Total', 'Completed', 'In Progress', 'On Hold', 'Not Started', 'Rate']],
    body: stats.map(s => [
      s.agentName, s.totalTasks, s.completed, s.inProgress, s.onHold, s.notStarted, `${s.completionRate}%`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 6: { fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });

  // Task detail table (new page)
  doc.addPage();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 16, 'F');
  doc.setFontSize(13); doc.setTextColor(255, 255, 255);
  doc.text('Task Detail List', 14, 11);

  const statusColor = (s: string): [number, number, number] => {
    if (s === 'completed')   return [16, 185, 129];
    if (s === 'in_progress') return [59, 130, 246];
    if (s === 'on_hold')     return [245, 158, 11];
    return [107, 114, 128];
  };

  autoTable(doc, {
    startY: 22,
    head: [['SWAT ID', 'Agent', 'CODIF', 'GROUPE', 'Date', 'Priority', 'Est.h', 'Status']],
    body: tasks.map(t => [
      t.swatId || t.title,
      agentMap.get(t.agentId)?.name || '',
      t.codif || t.category,
      t.groupe || '',
      `${t.dayName?.slice(0,3)}, ${t.date}`,
      t.priority,
      `${t.estimatedHours}h`,
      STATUS_LABELS[t.status],
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 7.5 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 7) {
        const raw = tasks[data.row.index]?.status;
        if (raw) {
          const [r,g,b] = statusColor(raw);
          data.cell.styles.textColor = [r, g, b];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}  —  SWAT Agent Interface`, 14, 207);
  }

  doc.save(`SWAT-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── 3. Outlook / HTML Email ───────────────────────────────────────────────────
export function exportOutlookHTML(tasks: Task[], agents: Agent[]): void {
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const stats = getWeeklyStats(tasks, agents);
  const total = tasks.length;
  const done  = tasks.filter(t => t.status === 'completed').length;
  const rate  = total ? Math.round(done / total * 100) : 0;

  const statusBadge = (status: string) => {
    const color = STATUS_HTML_COLORS[status] || '#6B7280';
    return `<span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;">${STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}</span>`;
  };

  const agentRows = stats.map(s => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-weight:500;">${s.agentName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center;">${s.totalTasks}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center;color:#10B981;font-weight:700;">${s.completed}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center;color:#3B82F6;">${s.inProgress}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center;color:#F59E0B;">${s.onHold}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center;color:#6B7280;">${s.notStarted}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:center;">
        <div style="background:#F1F5F9;border-radius:20px;height:8px;width:80px;display:inline-block;vertical-align:middle;margin-right:6px;">
          <div style="background:${s.completionRate >= 70 ? '#10B981' : s.completionRate >= 40 ? '#F59E0B' : '#EF4444'};height:8px;width:${s.completionRate}%;border-radius:20px;"></div>
        </div>
        <strong style="color:${s.completionRate >= 70 ? '#10B981' : s.completionRate >= 40 ? '#F59E0B' : '#EF4444'};">${s.completionRate}%</strong>
      </td>
    </tr>`).join('');

  const taskRows = tasks.slice(0, 200).map(t => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #F1F5F9;font-family:monospace;font-size:12px;color:#6366F1;">${esc(t.swatId || t.title)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #F1F5F9;font-size:12px;">${esc(agentMap.get(t.agentId)?.name || '')}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #F1F5F9;font-size:12px;">${esc(t.codif || t.category)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #F1F5F9;font-size:12px;">${esc(t.groupe || '')}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #F1F5F9;font-size:12px;">${esc(t.date)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #F1F5F9;font-size:12px;">${statusBadge(t.status)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #F1F5F9;font-size:12px;text-align:right;">${t.estimatedHours}h</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SWAT Team Task Report — ${TODAY}</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Segoe UI,Calibri,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:20px 0;">
<tr><td align="center">
<table width="700" cellpadding="0" cellspacing="0" style="max-width:700px;background:#FFFFFF;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#312E81,#1E3A5F);padding:32px 36px;">
    <table width="100%"><tr>
      <td>
        <div style="color:#A5B4FC;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">SWAT TASK MANAGEMENT</div>
        <div style="color:#FFFFFF;font-size:26px;font-weight:800;margin-bottom:4px;">Team Performance Report</div>
        <div style="color:#94A3B8;font-size:13px;">${TODAY}</div>
      </td>
      <td align="right" style="vertical-align:top;">
        <div style="background:rgba(255,255,255,.1);border-radius:10px;padding:12px 20px;text-align:center;">
          <div style="color:#A5B4FC;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Completion</div>
          <div style="color:#FFFFFF;font-size:36px;font-weight:800;line-height:1;">${rate}%</div>
          <div style="color:#94A3B8;font-size:11px;">${done} / ${total} tasks</div>
        </div>
      </td>
    </tr></table>
  </td></tr>

  <!-- KPI row -->
  <tr><td style="background:#F1F5F9;padding:20px 36px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      ${[
        ['Total Tasks', total, '#6366F1'],
        ['Completed', done, '#10B981'],
        ['In Progress', tasks.filter(t=>t.status==='in_progress').length, '#3B82F6'],
        ['On Hold', tasks.filter(t=>t.status==='on_hold').length, '#F59E0B'],
        ['Not Started', tasks.filter(t=>t.status==='not_started').length, '#6B7280'],
      ].map(([label, value, color]) => `
        <td align="center" style="padding:0 8px;">
          <div style="background:#FFFFFF;border-radius:10px;padding:14px 10px;border-top:3px solid ${color};">
            <div style="font-size:26px;font-weight:800;color:${color};">${value}</div>
            <div style="font-size:11px;color:#64748B;font-weight:500;margin-top:2px;">${label}</div>
          </div>
        </td>`).join('')}
    </tr></table>
  </td></tr>

  <!-- Agent summary table -->
  <tr><td style="padding:28px 36px 16px;">
    <div style="font-size:16px;font-weight:700;color:#1E293B;margin-bottom:14px;border-left:4px solid #6366F1;padding-left:12px;">Agent Performance</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
      <tr style="background:#F8FAFC;">
        <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.5px;">Agent</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">Total</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#10B981;text-transform:uppercase;">Done</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#3B82F6;text-transform:uppercase;">Active</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#F59E0B;text-transform:uppercase;">Hold</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Pending</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">Rate</th>
      </tr>
      ${agentRows}
    </table>
  </td></tr>

  <!-- Task table -->
  <tr><td style="padding:8px 36px 28px;">
    <div style="font-size:16px;font-weight:700;color:#1E293B;margin-bottom:14px;border-left:4px solid #10B981;padding-left:12px;">Task Details${tasks.length > 200 ? ' (first 200)' : ''}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;font-size:12px;">
      <tr style="background:#F8FAFC;">
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748B;font-weight:700;">SWAT ID</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748B;font-weight:700;">Agent</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748B;font-weight:700;">CODIF</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748B;font-weight:700;">GROUPE</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748B;font-weight:700;">Date</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748B;font-weight:700;">Status</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:#64748B;font-weight:700;">Est.h</th>
      </tr>
      ${taskRows}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#F1F5F9;padding:20px 36px;text-align:center;border-top:1px solid #E2E8F0;">
    <div style="color:#94A3B8;font-size:11px;">SWAT Agent Interface · Confidential · Generated ${TODAY}</div>
    <div style="color:#CBD5E1;font-size:10px;margin-top:4px;">This report contains ${total} tasks across ${agents.length} agents.</div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  dl(new Blob([html], { type: 'text/html;charset=utf-8' }), `SWAT-report-${new Date().toISOString().split('T')[0]}.html`);
}

// ── 4. Word-compatible HTML (.doc) ────────────────────────────────────────────
export function exportWord(tasks: Task[], agents: Agent[]): void {
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const stats = getWeeklyStats(tasks, agents);

  const rows = tasks.map(t => `
    <tr>
      <td>${esc(t.swatId || t.title)}</td>
      <td>${esc(agentMap.get(t.agentId)?.name || '')}</td>
      <td>${esc(t.codif || t.category)}</td>
      <td>${esc(t.groupe || '')}</td>
      <td>${esc(t.date)}</td>
      <td>${esc(t.priority)}</td>
      <td>${esc(String(t.estimatedHours))}h</td>
      <td>${esc(STATUS_LABELS[t.status])}</td>
    </tr>`).join('');

  const summaryRows = stats.map(s => `
    <tr>
      <td>${esc(s.agentName)}</td>
      <td>${s.totalTasks}</td>
      <td>${s.completed}</td>
      <td>${s.inProgress}</td>
      <td>${s.onHold}</td>
      <td>${s.notStarted}</td>
      <td>${s.completionRate}%</td>
    </tr>`).join('');

  const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1E293B; }
  h1 { font-size: 20pt; color: #312E81; margin-bottom: 4pt; }
  h2 { font-size: 14pt; color: #1E3A5F; border-bottom: 1.5pt solid #6366F1; padding-bottom: 4pt; margin-top: 18pt; }
  p.meta { color: #64748B; font-size: 9pt; margin-bottom: 16pt; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 16pt; font-size: 9pt; }
  th { background: #312E81; color: white; padding: 6pt 8pt; text-align: left; font-weight: bold; }
  td { padding: 5pt 8pt; border: 0.5pt solid #E2E8F0; vertical-align: top; }
  tr:nth-child(even) td { background: #F8FAFC; }
  .kpi { display: inline-block; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 8pt 14pt; margin: 4pt; text-align: center; }
  .kpi-value { font-size: 20pt; font-weight: bold; color: #312E81; }
  .kpi-label { font-size: 8pt; color: #64748B; }
</style>
</head>
<body>
<h1>SWAT Team Task Report</h1>
<p class="meta">Generated: ${TODAY} | Total Tasks: ${tasks.length} | Completed: ${tasks.filter(t=>t.status==='completed').length} | Rate: ${tasks.length ? Math.round(tasks.filter(t=>t.status==='completed').length/tasks.length*100) : 0}%</p>

<div>
  ${[
    ['Total', tasks.length],
    ['Completed', tasks.filter(t=>t.status==='completed').length],
    ['In Progress', tasks.filter(t=>t.status==='in_progress').length],
    ['On Hold', tasks.filter(t=>t.status==='on_hold').length],
    ['Not Started', tasks.filter(t=>t.status==='not_started').length],
  ].map(([l,v]) => `<div class="kpi"><div class="kpi-value">${v}</div><div class="kpi-label">${l}</div></div>`).join('')}
</div>

<h2>Agent Performance Summary</h2>
<table>
  <tr><th>Agent</th><th>Total</th><th>Completed</th><th>In Progress</th><th>On Hold</th><th>Not Started</th><th>Rate</th></tr>
  ${summaryRows}
</table>

<h2>Task Details</h2>
<table>
  <tr><th>SWAT ID</th><th>Agent</th><th>CODIF</th><th>GROUPE</th><th>Date</th><th>Priority</th><th>Est.h</th><th>Status</th></tr>
  ${rows}
</table>
</body></html>`;

  dl(new Blob([doc], { type: 'application/msword' }), `SWAT-report-${new Date().toISOString().split('T')[0]}.doc`);
}

// ── 5. CSV (PowerBI) — re-export from utils ──────────────────────────────────
export { exportToCSV } from './utils';
