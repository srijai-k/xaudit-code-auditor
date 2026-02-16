import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AuditView from '../components/AuditView';
import ReportView from '../components/ReportView';
import './AuditTool.css';

export default function AuditTool() {
    const [activeView, setActiveView] = useState('audit');
    const [reportData, setReportData] = useState(null);

    const handleAuditComplete = (report) => {
        setReportData(report);
        setActiveView('report');
    };

    return (
        <div className="app-container">
            <Navbar activeView={activeView} onViewChange={setActiveView} />

            {activeView === 'audit' ? (
                <AuditView onViewReport={handleAuditComplete} />
            ) : (
                <ReportView
                    onBack={() => setActiveView('audit')}
                    reportData={reportData}
                />
            )}
        </div>
    );
}
