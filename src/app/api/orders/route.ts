export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

function getDB() {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    return new Database(path.join(process.cwd(), 'local.db'));
  }
  // Production — Cloudflare D1
  return (globalThis as any).env?.DB ?? (process.env as any).DB;
}

// GET orders - admin gets all, user gets their own
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDB();
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true';
    const isDev = process.env.NODE_ENV === 'development';

    let orders, orderItems;

    if (isDev) {
      orders = isAdmin
        ? db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
        : db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      orderItems = db.prepare('SELECT * FROM order_items').all();
    } else {
      const ordersRes = isAdmin
        ? await db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
        : await db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      orders = ordersRes.results;
      const itemsRes = await db.prepare('SELECT * FROM order_items').all();
      orderItems = itemsRes.results;
    }

    // Attach items to each order
    const ordersWithItems = orders.map((order: Record<string, unknown>) => ({
      ...order,
      items: orderItems.filter((item: Record<string, unknown>) => item.order_id === order.id)
    }));

    return NextResponse.json({ results: ordersWithItems });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST place a new order
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'You must be logged in to place an order' }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const user_name = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || 'Anonymous';
    const user_email = user?.emailAddresses?.[0]?.emailAddress || '';

    const db = getDB();
    const { address, city, phone, items } = await req.json() as {
      address: string;
      city: string;
      phone: string;
      items: { id: number; name: string; price: number; quantity: number }[];
    };

    if (!address || !city || !phone || !items?.length) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const isDev = process.env.NODE_ENV === 'development';

    let orderId: number;

    if (isDev) {
      const result = db.prepare(
        'INSERT INTO orders (user_id, user_name, user_email, address, city, phone, total) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(userId, user_name, user_email, address, city, phone, total);
      orderId = result.lastInsertRowid;

      const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)');
      for (const item of items) {
        stmt.run(orderId, item.id, item.name, item.price, item.quantity);
      }
    } else {
      const result = await db.prepare(
        'INSERT INTO orders (user_id, user_name, user_email, address, city, phone, total) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(userId, user_name, user_email, address, city, phone, total);
      orderId = result.lastInsertRowid as number;

      for (const item of items) {
        await db.prepare('INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)').run(orderId, item.id, item.name, item.price, item.quantity);
      }
    }

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}

// PATCH update order status (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDB();
    const { id, status } = await req.json() as { id: number; status: string };

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'development') {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    } else {
      await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}