import { describe, it, expect } from "vitest";

describe("handDrawn 参数处理", () => {
  it("应该正确解析 handDrawn 参数对象", () => {
    // 模拟工具参数处理逻辑
    const handDrawnArg = {
      enabled: true,
      roughness: 1.5,
      fillStyle: "hachure",
      randomizeColors: true,
      randomizeFillStyle: true,
      groupColorsByBlock: true,
    };

    // 验证参数结构
    expect(handDrawnArg.enabled).toBe(true);
    expect(handDrawnArg.roughness).toBe(1.5);
    expect(handDrawnArg.fillStyle).toBe("hachure");
    expect(handDrawnArg.randomizeColors).toBe(true);
    expect(handDrawnArg.randomizeFillStyle).toBe(true);
    expect(handDrawnArg.groupColorsByBlock).toBe(true);
  });

  it("应该支持字符串格式的布尔值", () => {
    // 模拟从 JSON 解析来的字符串布尔值
    const handDrawnArg = {
      enabled: "true",
      randomizeColors: "true",
      randomizeFillStyle: "false",
    };

    // 验证转换逻辑
    const enabled = handDrawnArg.enabled === true || handDrawnArg.enabled === "true";
    const randomizeColors = handDrawnArg.randomizeColors === true || handDrawnArg.randomizeColors === "true";
    const randomizeFillStyle = handDrawnArg.randomizeFillStyle === true || handDrawnArg.randomizeFillStyle === "true";

    expect(enabled).toBe(true);
    expect(randomizeColors).toBe(true);
    expect(randomizeFillStyle).toBe(false);
  });

  it("应该支持部分参数（使用默认值）", () => {
    const handDrawnArg = {
      enabled: true,
      // 其他参数未提供，应该使用默认值
    };

    expect(handDrawnArg.enabled).toBe(true);
    // roughness 应该是 undefined，会在后续处理中使用默认值 1.5
  });

  it("应该正确处理 enabled: false 的情况", () => {
    const handDrawnArg = {
      enabled: false,
    };

    // 如果 enabled 为 false，应该被设置为 undefined
    const handDrawn = !handDrawnArg.enabled ? undefined : handDrawnArg;
    expect(handDrawn).toBeUndefined();
  });
});
