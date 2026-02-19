import { AlertTriangle } from "lucide-react";

interface AlertItem {
    name: string;
    stock_quantity: number;
}

export function StockAlerts({ items }: { items: AlertItem[] }) {
    return (
        <div className="w-full overflow-auto">
            <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                    <tr className="text-left">
                        <th className="h-10 px-4 font-medium text-gray-500 w-[70%]">Product Name</th>
                        <th className="h-10 px-4 font-medium text-gray-500 text-right">Stock</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length > 0 ? (
                        items.map((item, idx) => (
                            <tr key={idx} className="border-b border-red-50 bg-red-50/30 hover:bg-red-50/50 transition-colors">
                                <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    {item.name}
                                </td>
                                <td className="p-4 text-right font-bold text-red-600">{item.stock_quantity}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={2} className="p-4 text-center h-24">
                                <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                    <p>No stock alerts.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
