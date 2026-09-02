import { describe, expect, it } from "vitest";
import {
  OUTPUT_STAGE_FALLBACK_HEIGHT_PX,
  OUTPUT_STAGE_WIDTH_PX,
  resolveOutputStageTransform,
} from "./output-stage";

describe("resolveOutputStageTransform", () => {
  it("scales 1:1 at the reference viewport", () => {
    expect(resolveOutputStageTransform(1920, 1080)).toEqual({
      scale: 1,
      stageWidthPx: 1920,
      stageHeightPx: 1080,
    });
  });

  it("produces the SAME stage at 720p, 1080p and 4K — only the scale differs (the whole point)", () => {
    const hd = resolveOutputStageTransform(1280, 720);
    const fullHd = resolveOutputStageTransform(1920, 1080);
    const uhd = resolveOutputStageTransform(3840, 2160);

    for (const t of [hd, fullHd, uhd]) {
      expect(t.stageWidthPx).toBe(OUTPUT_STAGE_WIDTH_PX);
      expect(t.stageHeightPx).toBeCloseTo(1080);
    }
    expect(hd.scale).toBeCloseTo(2 / 3, 5);
    expect(fullHd.scale).toBe(1);
    expect(uhd.scale).toBe(2);
  });

  it("renders the stage at exactly the viewport size for any 16:9 input", () => {
    for (const [w, h] of [
      [1366, 768],
      [1600, 900],
      [1920, 1080],
      [2560, 1440],
      [3840, 2160],
    ] as const) {
      const t = resolveOutputStageTransform(w, h);
      expect(t.stageWidthPx * t.scale).toBeCloseTo(w);
      expect(t.stageHeightPx * t.scale).toBeCloseTo(h);
    }
  });

  it("keeps the real viewport aspect ratio on non-16:9 screens instead of letterboxing", () => {
    const ultrawide = resolveOutputStageTransform(2560, 1080);
    expect(ultrawide.stageWidthPx).toBe(1920);
    expect(ultrawide.stageHeightPx).toBeCloseTo((1920 * 1080) / 2560); // 810
    // still covers the viewport exactly on both axes
    expect(ultrawide.stageWidthPx * ultrawide.scale).toBeCloseTo(2560);
    expect(ultrawide.stageHeightPx * ultrawide.scale).toBeCloseTo(1080);

    const tall = resolveOutputStageTransform(1080, 1920);
    expect(tall.stageHeightPx).toBeCloseTo((1920 * 1920) / 1080);
    expect(tall.stageHeightPx * tall.scale).toBeCloseTo(1920);
  });

  it("falls back to an unscaled 1920x1080 stage for degenerate sizes (SSR / pre-measure / NaN)", () => {
    const fallback = {
      scale: 1,
      stageWidthPx: OUTPUT_STAGE_WIDTH_PX,
      stageHeightPx: OUTPUT_STAGE_FALLBACK_HEIGHT_PX,
    };
    expect(resolveOutputStageTransform(0, 0)).toEqual(fallback);
    expect(resolveOutputStageTransform(1920, 0)).toEqual(fallback);
    expect(resolveOutputStageTransform(-5, 100)).toEqual(fallback);
    expect(resolveOutputStageTransform(Number.NaN, 1080)).toEqual(fallback);
  });
});
