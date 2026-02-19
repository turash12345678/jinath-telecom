import { Package } from "lucide-react";

interface ProductStat {
    name: string;
    sold_qty: number;
}

export function TopProducts({ products }: { products: ProductStat[] }) {
    return (
        <div className="w-full overflow-auto">
            <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                    <tr className="text-left">
                        <th className="h-10 px-4 font-medium text-gray-500 w-[70%]">Product Name</th>
                        <th className="h-10 px-4 font-medium text-gray-500 text-right">Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length > 0 ? (
                        products.map((product, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 font-medium text-gray-900">{product.name}</td>
                                <td className="p-4 text-right text-gray-700">{product.sold_qty}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={2} className="p-4 text-center h-24">
                                <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                    <Package className="h-8 w-8 opacity-50" />
                                    <p>No products selling yet.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
