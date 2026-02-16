import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ReportView from '../components/ReportView';
import { getAuditById } from '../lib/storage/history';
import { loadLatestReport } from '../lib/storage';
import './AuditTool.css';

export default function ReportPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const id = searchParams.get('id');

    useEffect(() => {
        setIsLoading(true);
        if (id) {
            const historyItem = getAuditById(id);
            if (historyItem) {
                setReport(historyItem.report);
            } else {
                setReport(null);
            }
        } else {
            // Load latest if no ID
            const latest = loadLatestReport();
            setReport(latest);
        }
        setIsLoading(false);
    }, [id]);

    if (isLoading) {
        return (
            <div className="app-container flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-brand-blue"></div>
            </div>
        );
    }

    return (
        <div className="app-container bg-white min-h-screen">
            <Navbar activeView="report" onViewChange={(view) => navigate(view === 'audit' ? '/audit' : '/audit/history')} />

            <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                {report ? (
                    <ReportView
                        reportData={report}
                        onBack={() => navigate('/audit')}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-dots rounded-3xl border-3 border-black border-dashed">
                        <h2 className="text-3xl font-black uppercase italic mb-4">Report Not Found</h2>
                        <p className="text-gray-500 mb-8">This audit might have been deleted or never existed.</p>
                        <button
                            onClick={() => navigate('/audit')}
                            className="bg-black text-white px-8 py-3 rounded-xl font-bold shadow-neo hover:translate-y-[-2px] transition-all"
                        >
                            Go to Auditor
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
