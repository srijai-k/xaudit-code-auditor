import { jsPDF } from "jspdf";

interface AuditReport {
    timestamp: string;
    overallScore: number;
    grade: { grade: string; color: string };
    categories: Record<string, any>;
    topFixes: any[];
    summaryText: string;
    rawCode?: string;
    finalReviewerComment?: string;
}

export const generatePDF = (report: AuditReport, logoUrl?: string) => {
    // A4 Size: 210mm x 297mm
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth(); // ~210
    const pageHeight = doc.internal.pageSize.getHeight(); // ~297
    const margin = 15;
    let yPos = margin;

    // --- COLORS (AuditX Dashboard Theme) ---
    const colors = {
        bg: [10, 10, 10] as [number, number, number],
        surface: [23, 23, 23] as [number, number, number],
        border: [40, 40, 40] as [number, number, number],
        blue: [59, 130, 246] as [number, number, number],
        green: [34, 197, 94] as [number, number, number],
        red: [239, 68, 68] as [number, number, number],
        yellow: [234, 179, 8] as [number, number, number],
        purple: [168, 85, 247] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
        gray: [156, 163, 175] as [number, number, number],
        darkGray: [75, 85, 99] as [number, number, number],
    };

    const fontSans = "helvetica";
    const fontMono = "courier";

    // --- HELPERS ---

    const drawBackground = () => {
        doc.setFillColor(...colors.bg);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
    };

    const addText = (text: string, x: number, y: number, fontSize: number, font: string, style: string, color: [number, number, number], align: "left" | "center" | "right" = "left", maxWidth?: number) => {
        doc.setFont(font, style);
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
        if (maxWidth) {
            doc.text(String(text), x, y, { align, maxWidth });
        } else {
            doc.text(String(text), x, y, { align });
        }
    };

    // --- PAGE 1: HUMAN DASHBOARD ---
    drawBackground();

    // 1. Header
    doc.setFillColor(...colors.blue); doc.rect(0, 0, pageWidth, 2, "F");

    // Logo & Title
    let titleOffset = 0;
    if (logoUrl) {
        try {
            // Add Logo
            doc.addImage(logoUrl, 'PNG', margin, margin + 2, 8, 8);
            titleOffset = 12;
        } catch (e) {
            console.warn("Could not add logo to PDF", e);
        }
    }

    addText("XAudit", margin + titleOffset, margin + 8, 16, fontSans, "bold", colors.white);
    addText("REPORT", margin + titleOffset + 22, margin + 8, 16, fontSans, "normal", colors.gray);
    addText(new Date(report.timestamp).toLocaleString(), pageWidth - margin, margin + 8, 8, fontMono, "normal", colors.darkGray, "right");

    yPos = 40;

    // 2. HERO GRADE
    const centerX = pageWidth / 2;

    const gradeColor = report.grade.grade.startsWith('A') ? colors.green :
        report.grade.grade.startsWith('B') ? colors.blue :
            report.grade.grade.startsWith('C') ? colors.yellow : colors.red;

    addText(report.grade.grade, centerX, yPos + 15, 60, fontSans, "bold", gradeColor, "center");
    addText("OVERALL GRADE", centerX, yPos + 35, 10, fontSans, "bold", colors.white, "center");

    doc.setFillColor(20, 20, 20);
    doc.setDrawColor(...gradeColor);
    doc.roundedRect(centerX - 15, yPos + 40, 30, 8, 4, 4, "FD");
    addText(`${report.overallScore}/100`, centerX, yPos + 45.5, 8, fontMono, "bold", gradeColor, "center");

    yPos += 70;

    // 3. STATS ROW
    const statsCols = 4;
    const statW = (pageWidth - (margin * 2) - 30) / statsCols; // 3 gaps of 10
    const statH = 25;

    // Calculate Stats
    const totalIssues = Object.values(report.categories || {}).reduce((acc: number, cat: any) => acc + (cat.issues?.length || 0), 0);
    const criticalCount = report.topFixes.filter(f => f.impactText && (f.impactText.includes('CRITICAL') || f.impactText.includes('HIGH'))).length;
    const techDebt = totalIssues > 10 ? 'High' : totalIssues > 5 ? 'Med' : 'Low';
    const securityScore = report.categories.security?.score || 0;

    const stats = [
        {
            label: "Total Issues",
            value: totalIssues.toString(),
            sub: "Across all categories",
            valColor: colors.white
        },
        {
            label: "Critical Fixes",
            value: criticalCount.toString(),
            sub: criticalCount > 0 ? "Requires immediate attention" : "No critical vulnerabilities", // DYNAMIC
            valColor: colors.red
        },
        {
            label: "Security Score",
            value: `${securityScore}%`,
            sub: "Weighted confidence",
            valColor: securityScore < 70 ? colors.red : colors.green
        },
        {
            label: "Est. Tech Debt",
            value: techDebt,
            sub: "Based on code volume",
            valColor: colors.yellow
        },
    ];

    stats.forEach((stat, i) => {
        const sx = margin + (i * (statW + 10));
        const sy = yPos;

        doc.setFillColor(...colors.surface);
        doc.setDrawColor(...colors.border);
        doc.roundedRect(sx, sy, statW, statH, 2, 2, "FD");

        addText(stat.label, sx + 5, sy + 7, 8, fontSans, "bold", colors.gray);
        addText(stat.value, sx + 5, sy + 16, 14, fontSans, "bold", stat.valColor);
        addText(stat.sub, sx + 5, sy + 21, 6, fontSans, "normal", colors.darkGray);
    });

    yPos += statH + 10;

    // 4. CATEGORY GRID
    const gridCols = 2;
    const cardW = (pageWidth - (margin * 2) - 10) / 2;
    const cardH = 30;

    const categories = [
        { name: "Security", score: report.categories.security.score, color: colors.red },
        { name: "Performance", score: report.categories.performance.score, color: colors.blue },
        { name: "Code Quality", score: report.categories.codeQuality.score, color: colors.yellow },
        { name: "Accessibility", score: report.categories.accessibility.score, color: colors.green },
    ];

    let r = 0, c = 0;
    categories.forEach((cat) => {
        const cx = margin + (c * (cardW + 10));
        const cy = yPos + (r * (cardH + 10));

        doc.setFillColor(...colors.surface);
        doc.setDrawColor(...colors.border);
        doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "FD");

        addText(cat.name, cx + 5, cy + 8, 9, fontSans, "bold", colors.white);

        doc.setFillColor(40, 40, 40);
        doc.roundedRect(cx + 5, cy + 18, cardW - 10, 4, 2, 2, "F");

        doc.setFillColor(...cat.color);
        const fillW = ((cardW - 10) * cat.score) / 100;
        doc.roundedRect(cx + 5, cy + 18, Math.max(2, fillW), 4, 2, 2, "F");

        addText(`${cat.score}%`, cx + cardW - 5, cy + 8, 9, fontMono, "bold", cat.color, "right");

        c++;
        if (c >= gridCols) { c = 0; r++; }
    });

    yPos += (r * (cardH + 10)) + 10;
    if (c > 0) yPos += cardH + 10;

    // 5. SUMMARY
    yPos += 5;
    if (yPos > pageHeight - 50) {
        // prevent footer overlap
    }

    doc.setFillColor(...colors.surface);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 25, 2, 2, "F");

    addText("AI VERDICT", margin + 5, yPos + 8, 8, fontSans, "bold", colors.purple);
    const summaryLines = doc.splitTextToSize(report.summaryText || report.finalReviewerComment || "No summary available.", pageWidth - (margin * 2) - 10);
    const displaySummary = summaryLines.slice(0, 3);

    doc.setFont(fontSans, "italic");
    doc.setFontSize(9);
    doc.setTextColor(...colors.gray);
    doc.text(displaySummary, margin + 5, yPos + 14);

    addText("↓ SCROLL FOR AI-READABLE FIX INSTRUCTIONS ↓", pageWidth / 2, pageHeight - 10, 8, fontMono, "normal", colors.darkGray, "center");


    // --- PAGE 2+: AI OPTIMIZED FINDINGS ---
    doc.addPage();
    drawBackground();
    yPos = margin;

    addText("AI ACTION PLAN", margin, yPos, 14, fontSans, "bold", colors.white);
    addText("Upload this PDF to Cursor/Claude to apply fixes automatically.", margin, yPos + 6, 8, fontSans, "normal", colors.gray);

    yPos += 20;

    const issues = report.topFixes;

    issues.forEach((issue) => {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            drawBackground();
            yPos = margin;
        }

        // ISSUE HEADER
        doc.setFillColor(...colors.surface);
        doc.setDrawColor(...colors.border);
        doc.rect(margin, yPos, pageWidth - (margin * 2), 10, "FD");

        const severity = issue.impactText?.split(" ")[0] || "ISSUE";
        const sevColor = severity === "CRITICAL" ? colors.red : severity === "HIGH" ? colors.yellow : colors.blue;

        addText(`[${severity}]`, margin + 2, yPos + 7, 9, fontMono, "bold", sevColor);
        addText(issue.title.substring(0, 60), margin + 35, yPos + 7, 9, fontSans, "bold", colors.white);

        yPos += 10;

        // CONTEXT
        const contextLines = doc.splitTextToSize(`CONTEXT: ${issue.why}`, pageWidth - (margin * 2) - 4);
        const ctxH = contextLines.length * 4 + 4;

        doc.setFont(fontSans, "normal");
        doc.setFontSize(8);
        doc.setTextColor(...colors.gray);
        doc.text(contextLines, margin + 2, yPos + 4);

        yPos += ctxH;

        // INSTRUCTION
        const promptText = `INSTRUCTION_FOR_AI:\nFix the issue "${issue.title}".\n${issue.howToFix}\nEnsure code style consistency.`;
        const promptLines = doc.splitTextToSize(promptText, pageWidth - (margin * 2) - 8);
        const promptH = promptLines.length * 4 + 8;

        doc.setFillColor(20, 20, 20);
        doc.setDrawColor(60, 60, 60);
        doc.roundedRect(margin + 2, yPos, pageWidth - (margin * 2) - 4, promptH, 1, 1, "FD");

        doc.setFont(fontMono, "normal");
        doc.setFontSize(7);
        doc.setTextColor(...colors.green);
        doc.text(promptLines, margin + 4, yPos + 5);

        yPos += promptH + 10;

    });

    doc.save(`xaudit-report-${Date.now()}.pdf`);
};
