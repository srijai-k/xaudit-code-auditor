import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import AuditView from '../components/AuditView';
import ReportView from '../components/ReportView';
import './AuditTool.css';

export default function AuditTool() {
    const [activeView, setActiveView] = useState('audit');
    const [reportData, setReportData] = useState(null);
    const [rawCode, setRawCode] = useState('');

    const handleAuditComplete = (report, code) => {
        setReportData(report);
        setRawCode(code || '');
        setActiveView('report');
    };

    return (
        <div className="app-container">
            <Navbar activeView={activeView} onViewChange={setActiveView} />

            <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
            >
                {activeView === 'audit' ? (
                    <AuditView onViewReport={handleAuditComplete} />
                ) : (
                    <ReportView
                        onBack={() => setActiveView('audit')}
                        reportData={reportData}
                        rawCode={rawCode}
                    />
                )}
            </motion.div>
        </div>
    );
}
