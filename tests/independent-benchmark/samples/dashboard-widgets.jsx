import { useEffect, useMemo, useState } from "react";

// A completely ordinary dashboard widget module — data fetching, memoized
// derived values, event handlers, conditional rendering. No dangerous
// patterns anywhere. This exists to check the noise floor on realistic,
// non-trivial "nothing wrong here" code, not just tiny one-line safe
// fixtures.
export default function RevenueWidget({ range, onRangeChange }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(`/api/revenue?range=${encodeURIComponent(range)}`)
            .then((res) => res.json())
            .then((json) => {
                if (!cancelled) setData(json);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [range]);

    const total = useMemo(() => {
        if (!data) return 0;
        return data.entries.reduce((sum, entry) => sum + entry.amount, 0);
    }, [data]);

    function handleRangeClick(nextRange) {
        onRangeChange(nextRange);
    }

    if (loading) return <div className="widget widget--loading">Loading…</div>;

    return (
        <div className="widget">
            <header>
                <h3>Revenue</h3>
                <div className="range-picker">
                    {["7d", "30d", "90d"].map((r) => (
                        <button
                            key={r}
                            className={r === range ? "active" : ""}
                            onClick={() => handleRangeClick(r)}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </header>
            <p className="widget__total">${total.toLocaleString()}</p>
        </div>
    );
}
