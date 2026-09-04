import type { AnalysisMode } from "./analyze";
import type { AnalysisResult } from "./types";
import type { AnalyzeRequestMessage, AnalyzeResultMessage, AnalyzeErrorMessage, AnalyzeStageMessage } from "./worker";

export type Stage = "parsing" | "analyzing" | "rendering";

export interface RunAnalysisOptions {
    onStage?: (stage: Stage, detail?: string) => void;
}

let worker: Worker | null = null;
let nextRequestId = 1;
let latestRequestId = 0;

function getWorker(): Worker {
    if (!worker) {
        worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    }
    return worker;
}

/**
 * Runs analysis in a dedicated Web Worker so parsing/rule execution never
 * blocks the UI thread. If a new call starts before a previous one resolves,
 * the previous call's eventual response is discarded (best-effort
 * cancellation by ignoring stale results — the worker does not preempt
 * mid-parse, since it processes one message at a time; see docs/architecture.md
 * for why true interruption isn't implemented).
 */
export function runAnalysis(code: string, mode: AnalysisMode | "auto", options: RunAnalysisOptions = {}): Promise<AnalysisResult> {
    const w = getWorker();
    const requestId = nextRequestId++;
    latestRequestId = requestId;

    return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent<AnalyzeResultMessage | AnalyzeErrorMessage | AnalyzeStageMessage>) => {
            const data = event.data;
            if (data.requestId !== requestId) return; // stale response from a superseded request

            if (data.type === "stage") {
                options.onStage?.(data.stage, data.detail);
                return;
            }

            w.removeEventListener("message", handleMessage);
            if (requestId !== latestRequestId) return; // a newer request has since started; drop this result

            if (data.type === "result") {
                resolve(data.result);
            } else {
                reject(new Error(data.error));
            }
        };

        w.addEventListener("message", handleMessage);
        const message: AnalyzeRequestMessage = { type: "analyze", requestId, code, mode };
        w.postMessage(message);
    });
}

/** Terminates and discards the current worker; a fresh one spins up on next use. */
export function resetAnalysisWorker(): void {
    worker?.terminate();
    worker = null;
}
