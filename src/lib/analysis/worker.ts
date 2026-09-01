/// <reference lib="webworker" />
import { analyze, type AnalysisMode, type Stagelistener } from "./analyze";

/**
 * Web Worker entry point. This file never touches `fetch`, `XMLHttpRequest`,
 * `WebSocket`, `importScripts` of a remote URL, or any storage API — it only
 * receives a string over `postMessage` and returns an AnalysisResult. It
 * never evaluates or executes the code it is asked to analyze.
 */

export interface AnalyzeRequestMessage {
    type: "analyze";
    requestId: number;
    code: string;
    mode: AnalysisMode | "auto";
}

export interface AnalyzeStageMessage {
    type: "stage";
    requestId: number;
    stage: "parsing" | "analyzing" | "rendering";
    detail?: string;
}

export interface AnalyzeResultMessage {
    type: "result";
    requestId: number;
    result: ReturnType<typeof analyze>;
}

export interface AnalyzeErrorMessage {
    type: "worker-error";
    requestId: number;
    error: string;
}

self.onmessage = (event: MessageEvent<AnalyzeRequestMessage>) => {
    const { type, requestId, code, mode } = event.data;
    if (type !== "analyze") return;

    const onStage: Stagelistener = (stage, detail) => {
        const message: AnalyzeStageMessage = { type: "stage", requestId, stage, detail };
        (self as unknown as Worker).postMessage(message);
    };

    try {
        const result = analyze(code, mode, onStage);
        const message: AnalyzeResultMessage = { type: "result", requestId, result };
        (self as unknown as Worker).postMessage(message);
    } catch (err) {
        const message: AnalyzeErrorMessage = {
            type: "worker-error",
            requestId,
            error: err instanceof Error ? err.message : String(err),
        };
        (self as unknown as Worker).postMessage(message);
    }
};
