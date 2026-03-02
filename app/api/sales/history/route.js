import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search') || '';

        // Build date filter
        let dateFilter = '';
        let args = [];

        if (startDate && endDate) {
            dateFilter = 'WHERE s.sale_date >= ? AND s.sale_date <= ?';
            args = [startDate, endDate];
        } else {
            // Default: current month
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
            dateFilter = 'WHERE s.sale_date >= ? AND s.sale_date <= ?';
            args = [start, end];
        }

        // Fetch all sales (including deleted) with user info
        const salesRes = await db.execute({
            sql: `SELECT 
                    s.id,
                    s.total_amount,
                    s.sale_date as created_at,
                    s.payment_method,
                    s.is_deleted,
                    s.deleted_at,
                    u.name as user_name
                  FROM sales s
                  LEFT JOIN users u ON s.user_id = u.id
                  ${dateFilter}
                  ORDER BY s.sale_date DESC`,
            args
        });

        const sales = salesRes.rows;

        if (sales.length === 0) {
            return new Response(JSON.stringify({ sales: [], summary: { total: 0, amount: 0, deleted: 0 } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fetch items for all sales
        const saleIds = sales.map(s => s.id);
        const placeholders = saleIds.map(() => '?').join(',');

        const itemsRes = await db.execute({
            sql: `SELECT 
                    si.sale_id,
                    si.quantity,
                    si.price_at_sale,
                    si.item_type,
                    p.name as product_name,
                    sv.name as service_name
                  FROM sale_items si
                  LEFT JOIN products p ON si.item_id = p.id AND si.item_type = 'product'
                  LEFT JOIN services sv ON si.item_id = sv.id AND si.item_type = 'service'
                  WHERE si.sale_id IN (${placeholders})`,
            args: saleIds
        });

        // Group items by sale_id
        const itemsMap = {};
        itemsRes.rows.forEach(item => {
            if (!itemsMap[item.sale_id]) itemsMap[item.sale_id] = [];
            itemsMap[item.sale_id].push({
                name: item.item_type === 'product' ? item.product_name : item.service_name,
                quantity: item.quantity,
                price: item.price_at_sale,
                type: item.item_type
            });
        });

        // Attach items to sales
        sales.forEach(sale => {
            sale.items = itemsMap[sale.id] || [];
        });

        // Filter by search if provided
        let filteredSales = sales;
        if (search.trim()) {
            const q = search.toLowerCase();
            filteredSales = sales.filter(sale =>
                sale.items.some(item => item.name && item.name.toLowerCase().includes(q))
            );
        }

        // Summary
        const summary = {
            total: filteredSales.length,
            amount: filteredSales.filter(s => !s.is_deleted).reduce((sum, s) => sum + s.total_amount, 0),
            deleted: filteredSales.filter(s => s.is_deleted).length
        };

        return new Response(JSON.stringify({ sales: filteredSales, summary }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Sales History Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch sales history' }), { status: 500 });
    }
}
