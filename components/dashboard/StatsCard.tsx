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
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-[160px] relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start z-10">
                <div className="flex flex-col gap-1">
                    <h3 className="text-[#6B7280] font-medium text-sm tracking-wide uppercase">{title}</h3>
                    <div className="flex items-baseline mt-1">
                        {isMoney && <span className="text-2xl font-extrabold mr-1" style={{ color: color }}>৳</span>}
                        <span className="text-3xl font-bold text-[#111827]" style={{ color: color }}>
                            {displayValue}
                        </span>
                    </div>
                    {description && (
                        <p className="text-xs text-gray-400 mt-2 font-medium">{description}</p>
                    )}
                </div>

                <div
                    className="p-3 rounded-full"
                    style={{ backgroundColor: `${color}15` }} // 15% opacity
                >
                    <Icon size={24} color={color} />
                </div>
            </div>
            {/* Decorative circle */}
            <div
                className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5"
                style={{ backgroundColor: color }}
            />
        </div>
    );
}
