// Generates fake orders against the running API so the Power BI dashboard
// has live data to show. Usage: npm run simulate  (optionally: node simulate.js 2000)
const API = process.env.API_URL || "http://localhost:5000";
const intervalMs = Number(process.argv[2]) || 3000;

const regions = ["India", "UAE", "UK", "USA", "Singapore", "Australia", "Germany", "Japan", "Canada", "France"];
const channels = ["Official Site", "Official Site", "Official Site", "Marketplace", "Pop-up", "Gift Shop"];
const names = ["Aarav", "Meera", "Sana", "Kabir", "Isha", "Rohan", "Anika", "Vikram", "Diya", "Arjun"];

const pick = (a) => a[Math.floor(Math.random() * a.length)];

const products = await (await fetch(`${API}/api/products`)).json();
if (!products.length) throw new Error("No products. Run `npm run seed` first.");

console.log(`Simulating an order every ${intervalMs}ms. Ctrl+C to stop.`);

setInterval(async () => {
  const n = 1 + Math.floor(Math.random() * 3);
  const items = Array.from({ length: n }, () => ({
    productId: pick(products)._id,
    qty: 1 + Math.floor(Math.random() * 2),
  }));
  const name = pick(names);
  const body = {
    name,
    email: `${name.toLowerCase()}${Math.floor(Math.random() * 30)}@example.com`,
    region: pick(regions),
    channel: pick(channels),
    items,
  };
  try {
    const r = await fetch(`${API}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const o = await r.json();
    console.log(`Order ${o._id} ₹${o.total} (${body.region})`);
    if (Math.random() < 0.6) {
      await fetch(`${API}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerEmail: body.email, rating: 3 + Math.floor(Math.random() * 3) }),
      });
    }
  } catch (e) {
    console.error("Simulation error:", e.message);
  }
}, intervalMs);
