
import "dotenv/config";

// ==========================================
// 1. PUSH DATA TO POWER BI
// ==========================================

export async function pushToPowerBI(rows) {
  const POWERBI_PUSH_URL = process.env.POWERBI_PUSH_URL;

  if (!POWERBI_PUSH_URL) {
    console.warn("Power BI URL missing. Push skipped.");
    return { skipped: true };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    console.warn("No rows available to push.");
    return { skipped: true };
  }

  try {
    console.log(`Sending ${rows.length} row(s) to Power BI...`);

    const response = await fetch(POWERBI_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ rows })
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Power BI push failed:", response.status);
      console.error("Details:", errorText);

      return {
        ok: false,
        status: response.status
      };
    }

    console.log(
      `Power BI push successful! ${rows.length} row(s) sent.`
    );

    return {
      ok: true,
      count: rows.length
    };

  } catch (error) {
    console.error("Power BI connection error:", error.message);

    return {
      ok: false,
      error: error.message
    };
  }
}

// ==========================================
// 2. CONVERT MONGODB ORDER TO POWER BI ROWS
// ==========================================

export function orderToRows(order) {
  return order.items.map((item) => ({
    timestamp: new Date(order.createdAt).toISOString(),

    orderId: String(order._id),

    customerEmail: order.customerEmail,

    region: order.region,

    channel: order.channel,

    product: item.name,

    collection: item.collection,

    qty: Number(item.qty),

    revenue: Number(item.qty * item.price),

    pointsEarned: Number(order.pointsEarned)
  }));
}
