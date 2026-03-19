type DateRange = { start: Date; end: Date };

type AnalyticsDateBarProps = {
    dateRange: DateRange;
    onChange: (range: DateRange) => void;
    onExport: () => void;
};

export default function AnalyticsDateBar({ dateRange, onChange, onExport }: AnalyticsDateBarProps) {
    return (
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Sales Analytics</h1>
            <div className="flex gap-4 items-center">
                <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium">From:</label>
                    <input
                        type="date"
                        value={dateRange.start.toISOString().split('T')[0]}
                        onChange={(e) =>
                            onChange({ ...dateRange, start: new Date(e.target.value) })
                        }
                        className="border rounded px-3 py-2"
                    />
                    <label className="text-sm font-medium">To:</label>
                    <input
                        type="date"
                        value={dateRange.end.toISOString().split('T')[0]}
                        onChange={(e) => onChange({ ...dateRange, end: new Date(e.target.value) })}
                        className="border rounded px-3 py-2"
                    />
                </div>
                <button
                    onClick={onExport}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <span>📊</span> Export to Excel
                </button>
            </div>
        </div>
    );
}
