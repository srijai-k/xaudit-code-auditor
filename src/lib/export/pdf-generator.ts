import { jsPDF } from "jspdf";
import type { AnalysisResult, Severity } from "../analysis/types";

/**
 * PDF export. Renders only what the report already computed — no grade, no
 * verdict. Every finding snippet rendered here has already been masked at
 * the rule level for secrets (see analysis/rules/secrets.ts maskSecret());
 * this file does not re-derive or unmask anything.
 */

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];
const SEVERITY_COLOR: Record<Severity, [number, number, number]> = {
    critical: [239, 68, 68],
    high: [249, 115, 22],
    medium: [234, 179, 8],
    low: [59, 130, 246],
    info: [156, 163, 175],
};

export const generatePDF = (report: AnalysisResult, logoUrl?: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    const colors = {
        bg: [10, 10, 10] as [number, number, number],
        surface: [23, 23, 23] as [number, number, number],
        border: [40, 40, 40] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
        gray: [156, 163, 175] as [number, number, number],
        darkGray: [75, 85, 99] as [number, number, number],
    };
    const fontSans = "helvetica";
    const fontMono = "courier";

    const drawBackground = () => {
        doc.setFillColor(...colors.bg);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
    };

    const addText = (text: string, x: number, y: number, fontSize: number, font: string, style: string, color: [number, number, number], align: "left" | "center" | "right" = "left", maxWidth?: number) => {
        doc.setFont(font, style);
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
        if (maxWidth) doc.text(String(text), x, y, { align, maxWidth });
        else doc.text(String(text), x, y, { align });
    };

    drawBackground();
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 2, "F");

    let titleOffset = 0;
    if (logoUrl) {
        try {
            doc.addImage(logoUrl, 'PNG', margin, margin + 2, 8, 8);
            titleOffset = 12;
        } catch (e) {
            console.warn("Could not add logo to PDF", e);
        }
    }

    addText("XAUDIT", margin + titleOffset, margin + 8, 16, fontSans, "bold", colors.white);
    addText("STATIC ANALYSIS REPORT", margin + titleOffset + 22, margin + 8, 10, fontSans, "normal", colors.gray);
    addText(new Date(report.timestamp).toLocaleString(), pageWidth - margin, margin + 8, 8, fontMono, "normal", colors.darkGray, "right");

    yPos = 36;
    addText("This report lists pattern matches that require human review.", margin, yPos, 9, fontSans, "italic", colors.gray);
    yPos += 5;
    addText("A clean result does not mean this code is secure.", margin, yPos, 9, fontSans, "bold", [239, 68, 68]);
    yPos += 12;

    // Severity count tiles
    const counts = report.countsBySeverity;
    const tileW = (pageWidth - margin * 2 - 4 * 4) / 5;
    SEVERITY_ORDER.forEach((sev, i) => {
        const x = margin + i * (tileW + 4);
        doc.setFillColor(...colors.surface);
        doc.setDrawColor(...colors.border);
        doc.roundedRect(x, yPos, tileW, 22, 2, 2, "FD");
        addText(sev.toUpperCase(), x + tileW / 2, yPos + 8, 7, fontSans, "bold", colors.gray, "center");
        addText(String(counts[sev] ?? 0), x + tileW / 2, yPos + 18, 14, fontMono, "bold", SEVERITY_COLOR[sev], "center");
    });
    yPos += 32;

    addText(`Language detected: ${report.language}`, margin, yPos, 9, fontSans, "normal", colors.gray);
    yPos += 6;
    addText(`Rules applied: findings are limited to the pattern set documented in the XAUDIT README (DOM XSS, dynamic execution, narrow SQLi heuristic, hardcoded secrets, Node.js command patterns${report.language === "html" ? ", plus basic HTML hygiene checks" : ""}).`, margin, yPos, 8, fontSans, "normal", colors.darkGray, "left", pageWidth - margin * 2);
    yPos += 16;

    doc.addPage();
    drawBackground();
    yPos = margin;
    addText("FINDINGS", margin, yPos, 14, fontSans, "bold", colors.white);
    addText("Each finding includes a safer example and its known limitations — verify before acting.", margin, yPos + 6, 8, fontSans, "normal", colors.gray);
    yPos += 20;

    const sorted = [...report.findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

    if (sorted.length === 0) {
        addText("No findings were reported for this input.", margin, yPos, 10, fontSans, "normal", colors.gray);
    }

    sorted.forEach((finding) => {
        if (yPos > pageHeight - 60) {
            doc.addPage();
            drawBackground();
            yPos = margin;
        }

        doc.setFillColor(...colors.surface);
        doc.setDrawColor(...colors.border);
        doc.rect(margin, yPos, pageWidth - margin * 2, 10, "FD");
        addText(`[${finding.severity.toUpperCase()}]`, margin + 2, yPos + 7, 9, fontMono, "bold", SEVERITY_COLOR[finding.severity]);
        addText(finding.title.substring(0, 60), margin + 35, yPos + 7, 9, fontSans, "bold", colors.white);
        yPos += 12;

        const messageLines = doc.splitTextToSize(finding.message, pageWidth - margin * 2 - 4);
        doc.setFont(fontSans, "normal");
        doc.setFontSize(8);
        doc.setTextColor(...colors.gray);
        doc.text(messageLines, margin + 2, yPos + 4);
        yPos += messageLines.length * 4 + 6;

        const saferLines = doc.splitTextToSize(`SAFER EXAMPLE: ${finding.saferExample}`, pageWidth - margin * 2 - 8);
        const saferH = saferLines.length * 4 + 6;
        doc.setFillColor(20, 20, 20);
        doc.setDrawColor(60, 60, 60);
        doc.roundedRect(margin + 2, yPos, pageWidth - margin * 2 - 4, saferH, 1, 1, "FD");
        doc.setFont(fontMono, "normal");
        doc.setFontSize(7);
        doc.setTextColor(34, 197, 94);
        doc.text(saferLines, margin + 4, yPos + 4);
        yPos += saferH + 3;

        const limitLines = doc.splitTextToSize(`Limitations: ${finding.limitations}`, pageWidth - margin * 2 - 4);
        doc.setFont(fontSans, "italic");
        doc.setFontSize(7);
        doc.setTextColor(...colors.darkGray);
        doc.text(limitLines, margin + 2, yPos + 3);
        yPos += limitLines.length * 3.5 + 10;
    });

    doc.save(`xaudit-report-${Date.now()}.pdf`);
};
