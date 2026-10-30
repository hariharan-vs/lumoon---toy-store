import React, { useEffect, useState } from "react";

const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const api = (url, opts) =>
  fetch(`${import.meta.env.VITE_API_URL || ""}${url}`, opts).then((r) => r.json());

/* ---------------- Storefront ---------------- */
function Store() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [form, setForm] = useState({ name: "", email: "", region: "India" });
  const [msg, setMsg] = useState("");

  useEffect(() => { api("/api/products").then(setProducts); }, []);

  const add = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const lines = products.filter((p) => cart[p._id]);
  const total = lines.reduce((s, p) => s + p.price * cart[p._id], 0);

  const checkout = async () => {
    const items = lines.map((p) => ({ productId: p._id, qty: cart[p._id] }));
    const res = await api("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items }),
    });
    if (res.error) return setMsg("⚠️ " + res.error);
    setMsg(`Order placed! You earned ${res.pointsEarned} loyalty points. 🧸`);
    setCart({});
    api("/api/products").then(setProducts);
  };

  return (
    <>
      <h2>Meet your companion</h2>
      <p className="sub">Story-driven plush with a collectible card in every box.</p>
      <div className="grid">
        {products.map((p) => (
          <div className="card product" key={p._id}>
            <div className="emoji">{p.emoji}</div>
            <h3>{p.name}</h3>
            <span className="tag">{p.collection}</span>
            <p className="story">{p.story}</p>
            <div className="row">
              <span className="price">{rupee(p.price)}</span>
              <button className="primary" disabled={p.stock <= 0} onClick={() => add(p._id)}>
                {p.stock <= 0 ? "Sold out" : "Add"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card cart">
        <h3>Your cart</h3>
        {lines.length === 0 && <p className="sub">Cart is empty.</p>}
        {lines.map((p) => (
          <div className="row" key={p._id}><span>{p.name} × {cart[p._id]}</span><span>{rupee(p.price * cart[p._id])}</span></div>
        ))}
        {lines.length > 0 && (
          <>
            <p><b>Total: {rupee(total)}</b></p>
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
              {["India", "UAE", "UK", "USA", "Singapore", "Australia", "Germany", "Japan", "Canada", "France"].map((r) => <option key={r}>{r}</option>)}
            </select>
            <button className="primary" disabled={!form.email || !form.name} onClick={checkout}>Place order (demo)</button>
          </>
        )}
        {msg && <div className="msg">{msg}</div>}
      </div>
    </>
  );
}

/* ---------------- Customer dashboard ---------------- */
function CustomerDash() {
  const [email, setEmail] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [rating, setRating] = useState(5);
  const [thanks, setThanks] = useState(false);

  const load = async () => {
    setErr(""); setData(null); setThanks(false);
    const r = await api(`/api/customer/${encodeURIComponent(email)}`);
    r.error ? setErr(r.error) : setData(r);
  };

  const sendFeedback = async () => {
    await api("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerEmail: email, rating: Number(rating) }),
    });
    setThanks(true);
  };

  return (
    <>
      <h2>Customer Dashboard</h2>
      <p className="sub">Track your rewards, orders, and loyalty progress.</p>
      <input placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="primary" onClick={load}>View my dashboard</button>
      {err && <p>{err}</p>}
      {data && (
        <>
          <div className="kpis" style={{ marginTop: 18 }}>
            <div className="card kpi"><div className="v">{data.customer.loyaltyPoints}</div><div className="l">Loyalty points</div></div>
            <div className="card kpi"><div className="v">{data.customer.tier}</div><div className="l">Current tier</div></div>
            <div className="card kpi"><div className="v">{data.orders.length}</div><div className="l">Orders</div></div>
          </div>
          {data.nextTierAt && (
            <div className="card" style={{ marginBottom: 18 }}>
              <div className="row"><span>Progress to next tier</span><span>{data.customer.loyaltyPoints} / {data.nextTierAt}</span></div>
              <div className="bar"><div style={{ width: `${Math.min(100, (data.customer.loyaltyPoints / data.nextTierAt) * 100)}%` }} /></div>
            </div>
          )}
          <div className="card">
            <h3>Order history</h3>
            <table>
              <thead><tr><th>Date</th><th>Items</th><th>Total</th><th>Points</th></tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o._id}>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                    <td>{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</td>
                    <td>{rupee(o.total)}</td>
                    <td>+{o.pointsEarned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card" style={{ marginTop: 18 }}>
            <h3>How was your experience?</h3>
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
            <button className="primary" onClick={sendFeedback}>Submit</button>
            {thanks && <div className="msg">Thank you for your feedback!</div>}
          </div>
        </>
      )}
    </>
  );
}

/* ---------------- Admin dashboard ---------------- */
function AdminDash() {
  const [s, setS] = useState(null);

  useEffect(() => {
    const load = () => api("/api/admin/stats").then(setS);
    load();
    const t = setInterval(load, 3000); // live refresh
    return () => clearInterval(t);
  }, []);

  if (!s) return <p>Loading…</p>;
  const maxRegion = Math.max(1, ...s.byRegion.map((r) => r.revenue));

  return (
    <>
      <div className="row"><h2>Admin Dashboard</h2><span className="live">● LIVE (refreshes every 3s)</span></div>
      <p className="sub">Sales, inventory, customer analytics, and business performance. Full analytics live in Power BI.</p>
      <div className="kpis">
        <div className="card kpi"><div className="v">{rupee(s.revenue)}</div><div className="l">Total revenue</div></div>
        <div className="card kpi"><div className="v">{s.orders}</div><div className="l">Orders</div></div>
        <div className="card kpi"><div className="v">{s.customers}</div><div className="l">Customers</div></div>
        <div className="card kpi"><div className="v">{s.csatPercent ?? "–"}{s.csatPercent != null && "%"}</div><div className="l">CSAT (target 90%)</div></div>
      </div>
      <div className="two">
        <div className="card">
          <h3>Revenue by region</h3>
          {s.byRegion.map((r) => (
            <div key={r._id} style={{ marginBottom: 8 }}>
              <div className="row"><span>{r._id}</span><span>{rupee(r.revenue)}</span></div>
              <div className="bar"><div style={{ width: `${(r.revenue / maxRegion) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>By collection</h3>
          <table>
            <thead><tr><th>Collection</th><th>Units</th><th>Revenue</th></tr></thead>
            <tbody>{s.byCollection.map((c) => <tr key={c._id}><td>{c._id}</td><td>{c.units}</td><td>{rupee(c.revenue)}</td></tr>)}</tbody>
          </table>
          <h3 style={{ marginTop: 18 }}>Low stock</h3>
          {s.lowStock.length === 0 ? <p className="sub">All good.</p> : s.lowStock.map((p) => <div key={p._id}>{p.name}: {p.stock} left</div>)}
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Recent orders</h3>
        <table>
          <thead><tr><th>Time</th><th>Customer</th><th>Region</th><th>Channel</th><th>Total</th></tr></thead>
          <tbody>
            {s.recent.map((o) => (
              <tr key={o._id}><td>{new Date(o.createdAt).toLocaleTimeString()}</td><td>{o.customerName}</td><td>{o.region}</td><td>{o.channel}</td><td>{rupee(o.total)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------------- Shell ---------------- */
export default function App() {
  const [tab, setTab] = useState("store");
  return (
    <>
      <header>
        <div className="logo">LUMOON<small>A Hug That Stays.</small></div>
        <nav>
          {[["store", "Shop"], ["customer", "My Rewards"], ["admin", "Admin"]].map(([k, l]) => (
            <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </nav>
      </header>
      <main>
        {tab === "store" && <Store />}
        {tab === "customer" && <CustomerDash />}
        {tab === "admin" && <AdminDash />}
      </main>
    </>
  );
}
