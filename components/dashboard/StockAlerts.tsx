import { AlertTriangle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface AlertItem {
    name: string;
    stock_quantity: number;
}

export function StockAlerts({ items }: { items: AlertItem[] }) {
    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[70%]">Product Name</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length > 0 ? (
                        items.map((item, idx) => (
                            <TableRow key={idx} className="bg-destructive/10 hover:bg-destructive/20 transition-colors">
                                <TableCell className="font-medium flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    {item.name}
                                </TableCell>
                                <TableCell className="text-right font-bold text-destructive">{item.stock_quantity}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <p>No stock alerts.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
