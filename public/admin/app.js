const API = '/api/admin';
const TOKEN_KEY = 'k21_admin_token';

let challengeToken = null;
let dashboard = null;

function $(id) {
  return document.getElementById(id);
}

function token() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

function show(el, visible) {
  el.classList.toggle('hidden', !visible);
}

function fmtXof(n) {
  return `${Number(n).toLocaleString('fr-FR')} FCFA`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('fr-FR');
}

async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function tableHtml(columns, rows, rowHtml) {
  if (!rows?.length) return '<p style="padding:14px;color:var(--muted)">None</p>';
  return `<table><thead><tr>${columns.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(rowHtml).join('')}</tbody></table>`;
}

function showModal(title, data, actionsHtml = '') {
  $('modal-title').textContent = title;
  $('modal-body').textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  $('modal-actions').innerHTML = actionsHtml;
  show($('modal'), true);
}

function renderStats(d) {
  const k = d.kori;
  $('stats-grid').innerHTML = `
    <div class="stat"><div class="label">Tx today</div><div class="value">${d.transactions.today}</div></div>
    <div class="stat"><div class="label">Tx this week</div><div class="value">${d.transactions.week}</div></div>
    <div class="stat"><div class="label">Tx this month</div><div class="value">${d.transactions.month}</div></div>
    <div class="stat ${k.reserveOk ? '' : 'bad'}"><div class="label">Kori circulation</div><div class="value">${k.circulation}</div></div>
    <div class="stat ${k.reserveOk ? '' : 'warn'}"><div class="label">Reserve XOF</div><div class="value">${fmtXof(k.reserveXof)}</div></div>
    <div class="stat"><div class="label">Signups today</div><div class="value">${d.signupsToday}</div></div>
  `;
}

function renderDashboard(d) {
  dashboard = d;
  renderStats(d);

  const mc = d.morningCheck;
  const alertEl = $('morning-alerts');
  if (mc && !mc.healthy) {
    alertEl.innerHTML = `<strong style="color:var(--r)">Morning check — attention needed</strong><ul style="margin:8px 0 0;padding-left:20px">${mc.alerts.map((a) => `<li>${a}</li>`).join('')}</ul>`;
    show(alertEl, true);
  } else {
    show(alertEl, false);
  }

  $('failed-table').innerHTML = tableHtml(
    ['Ref', 'User', 'Reason', 'When'],
    d.failedTransactionsToday,
    (r) => `<tr>
      <td><button class="btn btn-ghost btn-sm" data-tx="${r.reference}">${r.reference.slice(0, 10)}…</button></td>
      <td>${r.user?.name || r.user?.phone || r.userId}</td>
      <td>${r.failureReason || '—'}</td>
      <td>${fmtDate(r.createdAt)}</td>
    </tr>`,
  );

  $('merchants-table').innerHTML = tableHtml(
    ['Merchant', 'Volume'],
    d.topMerchants,
    (m) => `<tr><td>${m.businessName || m.name || m.handle || m.phone}</td><td>${fmtXof(m.volume)}</td></tr>`,
  );

  $('pending-rails').innerHTML = tableHtml(
    ['Ref', 'User', 'Amount', 'Age', ''],
    d.pendingOlderThan15Min.rails,
    (r) => `<tr>
      <td>${r.reference.slice(0, 12)}…</td>
      <td>${r.user?.phone || r.userId}</td>
      <td>${fmtXof(r.amount)}</td>
      <td>${r.ageMinutes}m</td>
      <td>
        <button class="btn btn-sm btn-primary" data-release="${r.id}" data-action="poll">Poll</button>
        <button class="btn btn-sm btn-ghost" data-release="${r.id}" data-action="complete">Complete</button>
        <button class="btn btn-sm btn-danger" data-release="${r.id}" data-action="failed">Fail</button>
      </td>
    </tr>`,
  );

  $('pending-held').innerHTML = tableHtml(
    ['Ref', 'Type', 'Amount', ''],
    d.pendingOlderThan15Min.held,
    (h) => `<tr>
      <td>${h.reference}</td>
      <td>${h.operationType}</td>
      <td>${fmtXof(h.amountNational)}</td>
      <td>
        <button class="btn btn-sm btn-primary" data-held-approve="${h.id}">Approve</button>
        <button class="btn btn-sm btn-danger" data-held-reject="${h.id}">Reject</button>
      </td>
    </tr>`,
  );

  $('fraud-alerts').innerHTML = tableHtml(
    ['Code', 'User', 'Message', ''],
    d.fraudAlerts,
    (a) => `<tr>
      <td><span class="badge badge-high">${a.code}</span></td>
      <td>${a.user?.phone || a.userId}</td>
      <td>${a.message}</td>
      <td><button class="btn btn-sm btn-ghost" data-ack-fraud="${a.id}">Ack</button></td>
    </tr>`,
  );

  $('support-tickets').innerHTML = tableHtml(
    ['Subject', 'User', 'Status', ''],
    d.supportTickets,
    (t) => `<tr>
      <td>${t.subject}</td>
      <td>${t.user?.phone || t.userId}</td>
      <td><span class="badge badge-open">${t.status}</span></td>
      <td><button class="btn btn-sm btn-ghost" data-ticket="${t.id}">Open</button></td>
    </tr>`,
  );

  $('deliveries-table').innerHTML = tableHtml(
    ['Area', 'Status', 'Driver', 'Fee'],
    d.activeDeliveries,
    (x) => `<tr>
      <td>${x.dropoffArea}</td>
      <td>${x.status}</td>
      <td>${x.driver?.name || x.driver?.phone || '—'}</td>
      <td>${fmtXof(x.deliveryFeeNational)}</td>
    </tr>`,
  );

  $('riders-table').innerHTML = tableHtml(
    ['Rider', 'Completed', 'Avg rating'],
    d.riderPerformance,
    (r) => `<tr>
      <td>${r.name || r.handle || r.phone}</td>
      <td>${r.completedDeliveries}</td>
      <td>${r.averageRating ?? 'N/A'}${r.ratedCount ? ` (${r.ratedCount})` : ''}</td>
    </tr>`,
  );
}

async function loadDashboard() {
  const data = await api('/dashboard');
  renderDashboard(data);
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach((p) => show(p, p.id === `tab-${name}`));
}

async function enterApp() {
  show($('login-view'), false);
  show($('app-view'), true);
  await loadDashboard();
}

async function handleLogin(e) {
  e.preventDefault();
  $('login-error').classList.add('hidden');
  try {
    const result = await api('/auth/login', {
      auth: false,
      method: 'POST',
      body: { email: $('email').value, password: $('password').value },
    });
    challengeToken = result.challengeToken;

    if (result.setupRequired) {
      show($('login-form'), false);
      const setup = await api('/auth/setup-2fa', {
        auth: false,
        method: 'POST',
        body: { challengeToken },
      });
      $('totp-secret').textContent = setup.secret;
      show($('setup-form'), true);
      return;
    }

    show($('login-form'), false);
    show($('totp-form'), true);
  } catch (err) {
    $('login-error').textContent = err.message;
    $('login-error').classList.remove('hidden');
  }
}

async function handleTotp(e) {
  e.preventDefault();
  $('login-error').classList.add('hidden');
  try {
    const result = await api('/auth/verify-2fa', {
      auth: false,
      method: 'POST',
      body: { challengeToken, code: $('totp').value },
    });
    setToken(result.accessToken);
    await enterApp();
  } catch (err) {
    $('login-error').textContent = err.message;
    $('login-error').classList.remove('hidden');
  }
}

async function handleSetup(e) {
  e.preventDefault();
  $('login-error').classList.add('hidden');
  try {
    const result = await api('/auth/confirm-2fa', {
      auth: false,
      method: 'POST',
      body: { challengeToken, code: $('setup-code').value },
    });
    setToken(result.accessToken);
    await enterApp();
  } catch (err) {
    $('login-error').textContent = err.message;
    $('login-error').classList.remove('hidden');
  }
}

document.addEventListener('click', async (e) => {
  const tx = e.target.closest('[data-tx]');
  if (tx) {
    const detail = await api(`/transactions/${tx.dataset.tx}`);
    showModal('Transaction', detail);
    return;
  }

  const release = e.target.closest('[data-release]');
  if (release) {
    const note = prompt('Optional note for audit log:') || undefined;
    await api(`/rails/${release.dataset.release}/release`, {
      method: 'POST',
      body: { action: release.dataset.action, note },
    });
    await loadDashboard();
    return;
  }

  const approve = e.target.closest('[data-held-approve]');
  if (approve) {
    await api(`/held-transactions/${approve.dataset.heldApprove}/approve`, { method: 'POST', body: {} });
    await loadDashboard();
    return;
  }

  const reject = e.target.closest('[data-held-reject]');
  if (reject) {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    await api(`/held-transactions/${reject.dataset.heldReject}/reject`, { method: 'POST', body: { reason } });
    await loadDashboard();
    return;
  }

  const ack = e.target.closest('[data-ack-fraud]');
  if (ack) {
    await api(`/fraud-alerts/${ack.dataset.ackFraud}/ack`, { method: 'POST' });
    await loadDashboard();
    return;
  }

  const ticketBtn = e.target.closest('[data-ticket]');
  if (ticketBtn) {
    const ticket = await api(`/support-tickets/${ticketBtn.dataset.ticket}`);
    const reply = prompt('Reply to customer:', '');
    if (reply) {
      await api(`/support-tickets/${ticket.id}`, { method: 'POST', body: { body: reply } });
      await loadDashboard();
    } else {
      showModal(`Ticket: ${ticket.subject}`, ticket);
    }
  }
});

$('login-form').addEventListener('submit', handleLogin);
$('totp-form').addEventListener('submit', handleTotp);
$('setup-form').addEventListener('submit', handleSetup);
$('logout-btn').addEventListener('click', async () => {
  try {
    await api('/auth/logout', { method: 'POST', auth: !!token() });
  } catch {
    /* ignore */
  }
  setToken(null);
  location.reload();
});
$('refresh-btn').addEventListener('click', () => loadDashboard().catch(alert));
$('modal-close').addEventListener('click', () => show($('modal'), false));
$('export-report-btn').addEventListener('click', async () => {
  const date = new Date().toISOString().slice(0, 10);
  const res = await fetch(`${API}/reports/daily?date=${date}&format=json&export=1`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `k21-daily-${date}.json`;
  a.click();
});
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});
$('tx-lookup-btn').addEventListener('click', async () => {
  const id = $('tx-lookup').value.trim();
  if (!id) return;
  const detail = await api(`/transactions/${encodeURIComponent(id)}`);
  showModal('Transaction', detail);
});
$('freeze-btn').addEventListener('click', async () => {
  const id = $('freeze-user-id').value.trim();
  const reason = $('freeze-reason').value.trim();
  if (!id || !reason) return alert('User ID and reason required');
  await api(`/users/${id}/freeze`, { method: 'POST', body: { reason } });
  alert('Account frozen');
});
$('refund-btn').addEventListener('click', async () => {
  const recipientUserId = $('refund-user-id').value.trim();
  const amount = parseInt($('refund-amount').value, 10);
  const reason = $('refund-reason').value.trim();
  if (!recipientUserId || !amount || !reason) return alert('All refund fields required');
  await api('/refunds', { method: 'POST', body: { recipientUserId, amount, reason } });
  alert('Refund issued');
});

if (token()) {
  enterApp().catch(() => {
    setToken(null);
    show($('login-view'), true);
    show($('app-view'), false);
  });
}
