import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ReportView from '../components/ReportView';
import './AuditTool.css';

/**
 * This route only renders a report when one was handed to it via router
 * navigation state (`navigate('/audit/report', { state: { report, code } })`).
 * There is no ID-based lookup of a past full report anymore: full reports
 * (including raw code) are never persisted by default — see storage.ts and
 * README "What data is stored locally". A direct visit or reload of this
 * URL with no state is a legitimate "nothing to show" case, not a bug.
 */
export default function ReportPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const report = location.state?.report ?? null;
    const rawCode = location.state?.code ?? '';

    return (
        <div className="app-container bg-white min-h-screen">
            <Navbar activeView="report" onViewChange={(view) => navigate(view === 'audit' ? '/audit' : '/audit/history')} />

            <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                {report ? (
                    <ReportView reportData={report} rawCode={rawCode} onBack={() => navigate('/audit')} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-white/10">
                        <h2 className="text-3xl font-black uppercase italic mb-4 text-white">No Report To Show</h2>
                        <p className="text-gray-500 mb-8 max-w-md text-center">
                            Reports are not saved by default and are not linkable across page reloads. Run a new analysis to see findings.
                        </p>
                        <button onClick={() => navigate('/audit')} className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:translate-y-[-2px] transition-all">
                            Go to Checker
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
