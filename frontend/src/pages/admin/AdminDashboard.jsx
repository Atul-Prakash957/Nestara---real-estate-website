import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Building2, Users, Inbox, CheckCircle2, XCircle,
  Star, StarOff, Loader2, Ban, ShieldCheck,
} from 'lucide-react';
import { adminApi } from '../../api/services';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'properties', label: 'Properties', icon: Building2 },
  { key: 'users', label: 'Users', icon: Users },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-700 text-ink">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Manage listings, approvals, and users across the platform.</p>

      <div className="mt-6 flex gap-1 border-b border-line">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === key ? 'border-coral text-coral' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && <Overview />}
        {tab === 'properties' && <PropertiesTab />}
        {tab === 'users' && <UsersTab />}
      </div>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.dashboardStats().then((res) => setStats(res.data.stats)).catch(() => {});
  }, []);

  if (!stats) return <Loading />;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users },
    { label: 'Total Properties', value: stats.totalProperties, icon: Building2 },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Inbox },
    { label: 'Total Leads', value: stats.totalLeads, icon: ShieldCheck },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl2 border border-line bg-surface p-5 shadow-card">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy text-white"><Icon size={16} /></span>
            <p className="mt-3 font-display text-2xl font-700 text-ink">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl2 border border-line bg-surface p-5 shadow-card">
          <p className="mb-3 text-sm font-semibold text-ink">Properties by type</p>
          {stats.propertiesByType.map((t) => <BarRow key={t.name} label={t.name} value={Number(t.count)} max={stats.totalProperties} />)}
        </div>
        <div className="rounded-xl2 border border-line bg-surface p-5 shadow-card">
          <p className="mb-3 text-sm font-semibold text-ink">Top cities</p>
          {stats.propertiesByCity.map((c) => <BarRow key={c.city} label={c.city} value={Number(c.count)} max={stats.totalProperties} />)}
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, value, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex justify-between text-xs text-muted"><span className="capitalize">{label}</span><span>{value}</span></div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-coral" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PropertiesTab() {
  const [status, setStatus] = useState('pending');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    adminApi.properties(status === 'all' ? '' : status).then((res) => setProperties(res.data.properties || [])).finally(() => setLoading(false));
  }

  useEffect(load, [status]);

  async function setPropertyStatus(id, newStatus) {
    await adminApi.updateStatus(id, newStatus);
    load();
  }

  async function toggleFeatured(id, current) {
    await adminApi.toggleFeatured(id, !current);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${status === s ? 'border-coral bg-coral-light text-coral-dark' : 'border-line text-muted'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : properties.length === 0 ? (
        <EmptyRow text="No properties in this category." />
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-line bg-surface shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.title}</p>
                    <p className="text-xs text-muted">{[p.locality, p.city].filter(Boolean).join(', ')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{p.owner_name}</p>
                    <p className="text-xs text-muted">{p.owner_email}</p>
                  </td>
                  <td className="px-4 py-3">₹{Number(p.price).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 capitalize">{p.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {p.status !== 'approved' && (
                        <IconBtn onClick={() => setPropertyStatus(p.id, 'approved')} title="Approve"><CheckCircle2 size={16} className="text-teal" /></IconBtn>
                      )}
                      {p.status !== 'rejected' && (
                        <IconBtn onClick={() => setPropertyStatus(p.id, 'rejected')} title="Reject"><XCircle size={16} className="text-red-500" /></IconBtn>
                      )}
                      <IconBtn onClick={() => toggleFeatured(p.id, p.is_featured)} title="Toggle featured">
                        {p.is_featured ? <Star size={16} className="fill-gold text-gold" /> : <StarOff size={16} className="text-muted" />}
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    adminApi.users().then((res) => setUsers(res.data.users || [])).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function toggleActive(id) {
    await adminApi.toggleUserActive(id);
    load();
  }

  async function toggleRole(u) {
    const nextRole = u.role === 'admin' ? 'user' : 'admin';
    const confirmMsg = nextRole === 'admin'
      ? `Make ${u.name} an admin? They'll get full access to this dashboard.`
      : `Remove admin access from ${u.name}?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await adminApi.updateUserRole(u.id, nextRole);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  }

  if (loading) return <Loading />;
  if (users.length === 0) return <EmptyRow text="No users found." />;

  return (
    <div className="overflow-x-auto rounded-xl2 border border-line bg-surface shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-canvas text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-line">
              <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3 capitalize">
                {u.role === 'admin' ? <span className="rounded-full bg-navy px-2 py-0.5 text-[11px] font-semibold text-white">Admin</span> : u.role}
              </td>
              <td className="px-4 py-3">{u.is_active ? <span className="text-teal">Active</span> : <span className="text-red-500">Banned</span>}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => toggleRole(u)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                      u.role === 'admin' ? 'border-line text-muted hover:bg-canvas' : 'border-navy text-navy hover:bg-navy hover:text-white'
                    }`}
                  >
                    {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                  </button>
                  <IconBtn onClick={() => toggleActive(u.id)} title={u.is_active ? 'Ban user' : 'Unban user'}>
                    <Ban size={16} className={u.is_active ? 'text-red-500' : 'text-muted'} />
                  </IconBtn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IconBtn({ children, ...props }) {
  return <button {...props} className="rounded-lg border border-line p-1.5 hover:bg-canvas">{children}</button>;
}

function Loading() {
  return <div className="py-16 text-center text-muted"><Loader2 className="mx-auto mb-2 animate-spin" /> Loading…</div>;
}

function EmptyRow({ text }) {
  return <div className="rounded-xl2 border border-dashed border-line p-10 text-center text-muted">{text}</div>;
}