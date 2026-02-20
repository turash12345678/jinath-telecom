import db from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');

        if (!productId) {
            return new Response(JSON.stringify({ error: 'Product ID is required' }), { status: 400 });
        }

        const logsResult = await db.execute({
            sql: `SELECT * FROM stock_logs WHERE product_id = ? ORDER BY created_at DESC`,
            args: [productId]
        });

        const salesResult = await db.execute({
            sql: `SELECT SUM(quantity * price_at_sale) as total_earned FROM sale_items WHERE item_id = ? AND item_type = 'product'`,
            args: [productId]
        });

        const totalEarned = salesResult.rows[0]?.total_earned || 0;

        return new Response(JSON.stringify({
            logs: logsResult.rows,
            total_earned: totalEarned
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Logs GET Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, quantity, buy_price, sell_price, created_at } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: 'Log ID is required' }), { status: 400 });
        }

        await db.execute({
            sql: `UPDATE stock_logs SET quantity = ?, remaining_quantity = ?, buy_price = ?, sell_price = ?, created_at = ? WHERE id = ?`,
            args: [quantity, quantity, buy_price, sell_price, created_at, id]
        });

        return new Response(JSON.stringify({ success: true, message: 'Log updated successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Logs PUT Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const logId = searchParams.get('id');

        if (!logId) {
            return new Response(JSON.stringify({ error: 'Log ID is required' }), { status: 400 });
        }

        // Get the log to know how much to deduct from stock
        const logRes = await db.execute({
            sql: 'SELECT * FROM stock_logs WHERE id = ?',
            args: [logId]
        });

        if (!logRes.rows || logRes.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'Log not found' }), { status: 404 });
        }

        const log = logRes.rows[0];

        // Deduct from product stock
        await db.execute({
            sql: 'UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?',
            args: [log.quantity, log.product_id]
        });

        // Delete the log
        await db.execute({
            sql: 'DELETE FROM stock_logs WHERE id = ?',
            args: [logId]
        });

        return new Response(JSON.stringify({ success: true, message: 'Log deleted' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Logs DELETE Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
