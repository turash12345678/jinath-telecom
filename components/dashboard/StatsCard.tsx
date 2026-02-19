import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: string;
    color?: string; // Hex color for the icon background & value text
}

export function StatsCard({ title, value, icon: Icon, description, trend, color = "#0065F4" }: StatsCardProps) {
    // Extract numeric value and Taka sign if present for styling
    const isMoney = typeof value === 'string' && value.includes('৳');
    const displayValue = isMoney ? value.replace('৳', '') : value;

    return (
        <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex flex-col justify-between h-[110px] relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start z-10">
                <div className="flex flex-col gap-1">
                    <h3 className="text-[#6B7280] font-medium text-xs tracking-wide uppercase">{title}</h3>
                    <div className="flex items-baseline mt-1">
                        {isMoney && <span className="text-2xl font-extrabold mr-1" style={{ color: color }}>৳</span>}
                        <span className="text-3xl font-bold text-[#111827]" style={{ color: color }}>
                            {displayValue}
                        </span>
                    </div>
                </div>

                <div
                    className="p-2.5 rounded-full"
                    style={{ backgroundColor: `${color}15` }} // 15% opacity
                >
                    <Icon size={20} color={color} />
                </div>
            </div>

            {description && (
                <div className="relative z-10">
                    <p className="text-[11px] text-gray-400 font-medium">{description}</p>
                </div>
            )}
        </div>
    );
}
