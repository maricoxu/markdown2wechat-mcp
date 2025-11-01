import { readFile, writeFile } from "../utils/fs.js";
import sharp from "sharp";
import { JSDOM } from "jsdom";
import rough from "roughjs/bundled/rough.cjs.js";
import { logger } from "../utils/log.js";

/**
 * 手绘风格选项
 */
export interface HandDrawnOptions {
  enabled: boolean;
  roughness?: number; // 0-3，默认 1.5
  fillStyle?: "hachure" | "cross-hatch" | "dots" | "zigzag" | "solid";
  finalFormat?: "svg" | "png" | "jpg";
  randomizeColors?: boolean; // 是否随机化颜色，默认 true
  randomizeFillStyle?: boolean; // 是否随机化填充样式，默认 true
  groupColorsByBlock?: boolean; // 是否按内容块分组颜色，默认 true
}

/**
 * 随机选择填充样式（排除dots，因为会影响文字可读性）
 */
function randomFillStyle(): "hachure" | "cross-hatch" | "zigzag" | "solid" {
  const styles: Array<"hachure" | "cross-hatch" | "zigzag" | "solid"> = [
    "hachure",
    "cross-hatch",
    "zigzag",
    "solid",
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}

/**
 * 生成随机颜色（用于颜色分组）
 */
function generateGroupColor(groupIndex: number): string {
  // 使用色相环上的均匀分布，每个组分配不同的色相
  const hueStep = 360 / 12; // 12个基础颜色
  const baseHue = (groupIndex * hueStep) % 360;
  // 添加一些随机变化，让颜色更自然
  const hue = (baseHue + (Math.random() - 0.5) * 20) % 360;
  const saturation = 50 + Math.floor(Math.random() * 30); // 50-80%
  const lightness = 45 + Math.floor(Math.random() * 25); // 45-70%
  return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
}

/**
 * 获取元素的组标识（用于颜色分组）
 * 优先按 class、id 前缀或父元素来分组
 */
function getElementGroup(element: Element): string {
  // 1. 优先使用 class（Mermaid 会为相同类型的元素设置相同 class）
  const classAttr = element.getAttribute("class");
  if (classAttr) {
    // 提取主要的 class（去掉辅助类）
    const mainClass = classAttr.split(" ").find(c => 
      c && !c.startsWith("edge") && !c.startsWith("message") && c !== "text"
    );
    if (mainClass) {
      return `class:${mainClass}`;
    }
    return `class:${classAttr}`;
  }
  
  // 2. 使用 id 前缀（如果有）
  const idAttr = element.getAttribute("id");
  if (idAttr) {
    // 提取 id 的前缀部分（例如 "actor0" -> "actor"）
    const prefixMatch = idAttr.match(/^([a-zA-Z]+)\d*/);
    if (prefixMatch) {
      return `id:${prefixMatch[1]}`;
    }
    return `id:${idAttr}`;
  }
  
  // 3. 使用父元素的标识（如果是 <g> 内的元素）
  const parent = element.parentElement;
  if (parent && parent.tagName === "g") {
    const parentId = parent.getAttribute("id");
    if (parentId) {
      return `parent:${parentId}`;
    }
    const parentClass = parent.getAttribute("class");
    if (parentClass) {
      return `parent:${parentClass}`;
    }
  }
  
  // 4. 默认：使用元素类型
  return `type:${element.tagName}`;
}

/**
 * 生成随机颜色（在原有颜色基础上微调，或生成新的随机颜色）
 */
function randomizeColor(originalColor: string, variation: number = 0.3): string {
  // 如果原色是none或transparent，生成随机颜色
  if (!originalColor || originalColor === "none" || originalColor === "transparent") {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 40 + Math.floor(Math.random() * 40); // 40-80%
    const lightness = 45 + Math.floor(Math.random() * 30); // 45-75%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  // 解析颜色并添加随机变化
  // 简化处理：如果是hex颜色，转换为HSL并添加变化
  const hexMatch = originalColor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const r = hex.length === 3 
      ? parseInt(hex[0] + hex[0], 16)
      : parseInt(hex.substring(0, 2), 16);
    const g = hex.length === 3 
      ? parseInt(hex[1] + hex[1], 16)
      : parseInt(hex.substring(2, 4), 16);
    const b = hex.length === 3 
      ? parseInt(hex[2] + hex[2], 16)
      : parseInt(hex.substring(4, 6), 16);
    
    // 转换为HSL
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rNorm) {
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
      } else if (max === gNorm) {
        h = ((bNorm - rNorm) / d + 2) / 6;
      } else {
        h = ((rNorm - gNorm) / d + 4) / 6;
      }
    }
    
    // 添加随机变化
    h = (h * 360 + (Math.random() - 0.5) * variation * 30) % 360;
    if (h < 0) h += 360;
    s = Math.min(100, Math.max(30, s * 100 + (Math.random() - 0.5) * variation * 20));
    l = Math.min(85, Math.max(25, l * 100 + (Math.random() - 0.5) * variation * 15));
    
    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
  }
  
  // 如果已经是HSL格式，直接解析并调整
  const hslMatch = originalColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) {
    let h = parseInt(hslMatch[1]);
    let s = parseInt(hslMatch[2]);
    let l = parseInt(hslMatch[3]);
    h = (h + (Math.random() - 0.5) * variation * 30) % 360;
    if (h < 0) h += 360;
    s = Math.min(100, Math.max(30, s + (Math.random() - 0.5) * variation * 20));
    l = Math.min(85, Math.max(25, l + (Math.random() - 0.5) * variation * 15));
    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
  }
  
  // 如果无法解析，返回原色或生成随机色
  return originalColor || `hsl(${Math.floor(Math.random() * 360)}, 50%, 60%)`;
}

/**
 * 将 SVG 转换为手绘风格
 */
export async function convertSvgToHandDrawn(
  svgPath: string,
  outputPath: string,
  options: HandDrawnOptions = { enabled: true }
): Promise<void> {
  const {
    roughness = 1.5,
    fillStyle = "hachure",
    finalFormat = "png",
    randomizeColors = true, // 默认启用颜色随机化
    randomizeFillStyle = true, // 默认启用填充样式随机化
    groupColorsByBlock = true, // 默认启用按块分组颜色
  } = options;

  logger.info(`开始应用手绘风格: roughness=${roughness}, fillStyle=${fillStyle}, randomizeColors=${randomizeColors}, randomizeFillStyle=${randomizeFillStyle}, groupColorsByBlock=${groupColorsByBlock}`);

  // 读取 SVG
  const svgContent = readFile(svgPath);

  // 使用 JSDOM 解析 SVG
  const dom = new JSDOM(svgContent, {
    contentType: "image/svg+xml",
    includeNodeLocations: false,
  });
  const document = dom.window.document;
  const svgElement = document.querySelector("svg");

  if (!svgElement) {
    throw new Error("Invalid SVG file: no <svg> element found");
  }

  // 创建 Rough.js 生成器
  const rc = rough.svg(svgElement);

  // 如果启用按块分组颜色，先收集所有元素的组信息并分配颜色
  const groupColorMap = new Map<string, string>();
  const groupFillStyleMap = new Map<string, "hachure" | "cross-hatch" | "zigzag" | "solid">();
  
  if (groupColorsByBlock || randomizeFillStyle) {
    // 收集所有需要处理的元素（path, rect, circle, ellipse, line, polygon, polyline）
    const allElements = [
      ...Array.from(svgElement.querySelectorAll("path")),
      ...Array.from(svgElement.querySelectorAll("rect")),
      ...Array.from(svgElement.querySelectorAll("circle")),
      ...Array.from(svgElement.querySelectorAll("ellipse")),
      ...Array.from(svgElement.querySelectorAll("line")),
      ...Array.from(svgElement.querySelectorAll("polygon")),
      ...Array.from(svgElement.querySelectorAll("polyline")),
    ];
    
    const groups = new Set<string>();
    allElements.forEach(el => {
      const group = getElementGroup(el);
      groups.add(group);
    });
    
    // 为每个组分配颜色和填充样式
    let groupIndex = 0;
    Array.from(groups).forEach(group => {
      if (groupColorsByBlock) {
        groupColorMap.set(group, generateGroupColor(groupIndex));
      }
      if (randomizeFillStyle) {
        groupFillStyleMap.set(group, randomFillStyle());
      }
      groupIndex++;
    });
    
    logger.debug(`识别到 ${groups.size} 个内容块，已分配颜色和样式`);
  }

  // 处理所有路径元素
  const paths = Array.from(svgElement.querySelectorAll("path"));
  paths.forEach((path) => {
    try {
      const pathData = path.getAttribute("d");
      if (!pathData || pathData.trim() === "") return;

      // 获取原有样式属性
      // Mermaid SVG中，路径样式主要通过CSS类设置，需要从样式表中解析
      let stroke = path.getAttribute("stroke");
      if (!stroke) {
        const styleAttr = path.getAttribute("style");
        if (styleAttr) {
          const strokeMatch = styleAttr.match(/stroke:\s*([^;]+)/);
          if (strokeMatch) stroke = strokeMatch[1].trim();
        }
      }
      
      // 如果还是没有，检查CSS类对应的颜色（从SVG的style标签中解析）
      if (!stroke || stroke === "none" || stroke === "transparent") {
        const classAttr = path.getAttribute("class");
        if (classAttr) {
          // 从SVG的style标签中查找对应类的stroke颜色
          const styleTag = svgElement.querySelector("style");
          if (styleTag) {
            const styleText = styleTag.textContent || "";
            // 查找类的stroke定义（Mermaid常用格式）
            const classPattern = new RegExp(`\\.${classAttr.split(" ")[0]}[^{]*\\{[^}]*stroke:\\s*([^;]+)`);
            const match = styleText.match(classPattern);
            if (match && match[1]) {
              stroke = match[1].trim();
            }
          }
        }
      }
      
      // 如果还是没有，使用Mermaid默认颜色
      if (!stroke || stroke === "none" || stroke === "transparent") {
        // Mermaid 默认使用 #333333 作为stroke（深灰色，确保可见）
        stroke = "#333333";
      }

      let strokeWidth = parseFloat(path.getAttribute("stroke-width") || "0");
      if (!strokeWidth || strokeWidth === 0) {
        const styleAttr = path.getAttribute("style");
        if (styleAttr) {
          const widthMatch = styleAttr.match(/stroke-width:\s*([^;]+)/);
          if (widthMatch) strokeWidth = parseFloat(widthMatch[1]) || 2;
        }
      }
      if (!strokeWidth || strokeWidth === 0) {
        strokeWidth = 2; // 默认宽度
      }

      let fill = path.getAttribute("fill");
      if (!fill || fill === "none") {
        const styleAttr = path.getAttribute("style");
        if (styleAttr) {
          const fillMatch = styleAttr.match(/fill:\s*([^;]+)/);
          if (fillMatch) fill = fillMatch[1].trim();
        }
      }
      if (!fill || fill === "none" || fill === "transparent") {
        fill = "none";
      }

      const fillOpacity = path.getAttribute("fill-opacity") || "1";

      // 确定元素的组和对应的颜色/样式
      const elementGroup = groupColorsByBlock ? getElementGroup(path) : null;
      const groupColor = elementGroup && groupColorMap.has(elementGroup) 
        ? groupColorMap.get(elementGroup)! 
        : null;
      const groupFillStyleValue = elementGroup && groupFillStyleMap.has(elementGroup)
        ? groupFillStyleMap.get(elementGroup)!
        : null;

      // 确保stroke颜色不为none和transparent（使用深色确保可见）
      let effectiveStroke = (stroke && stroke !== "none" && stroke !== "transparent") 
        ? stroke 
        : "#333333"; // 深灰色，确保可见
      
      // 如果启用了按块分组颜色，使用组的颜色；否则随机化
      if (groupColorsByBlock && groupColor) {
        effectiveStroke = groupColor;
      } else if (randomizeColors) {
        effectiveStroke = randomizeColor(effectiveStroke);
      }
      
      // 对于fill颜色，也应用分组或随机化（如果启用）
      let effectiveFill = fill;
      if (fill !== "none" && fill !== "transparent") {
        if (groupColorsByBlock && groupColor) {
          effectiveFill = groupColor;
        } else if (randomizeColors) {
          effectiveFill = randomizeColor(fill);
        }
      }
      
      // 确定填充样式：优先使用组的样式，否则使用随机或默认样式
      const effectiveFillStyle = groupFillStyleValue || (randomizeFillStyle ? randomFillStyle() : fillStyle);
      
      // 增加stroke宽度，手绘风格需要更粗的线条（至少3px才能看清）
      const effectiveStrokeWidth = Math.max(strokeWidth > 0 ? strokeWidth * 1.5 : 3, 3); // 最小3px，手绘风格需要更粗

      // 使用 rough.js 生成手绘风格的路径
      // 注意：rc.path() 返回的是 <g> 元素，内部包含实际的 <path>
      const handDrawnGroup = rc.path(pathData, {
        roughness,
        fillStyle: effectiveFill !== "none" && effectiveFill !== "transparent" ? effectiveFillStyle : undefined,
        stroke: effectiveStroke,
        strokeWidth: effectiveStrokeWidth,
        fill: effectiveFill !== "none" && effectiveFill !== "transparent" ? effectiveFill : "none",
        fillOpacity: effectiveFill !== "none" && effectiveFill !== "transparent" ? parseFloat(fillOpacity) : undefined,
        strokeLineDash: undefined, // 移除虚线，更自然
      });

      // rough.js返回的是<g>元素，需要提取内部的<path>元素
      const handDrawnPath = handDrawnGroup.querySelector("path") || handDrawnGroup;
      
      // 如果handDrawnPath就是<g>，则取第一个子<path>
      if (handDrawnPath.tagName === "g") {
        const firstPath = handDrawnPath.querySelector("path");
        if (firstPath && firstPath.getAttribute("d")) {
          // 创建新的path元素，复制所有属性
          const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          
          // 复制rough.js生成的所有属性（包括d属性！）
          firstPath.getAttributeNames().forEach((attr) => {
            const value = firstPath.getAttribute(attr);
            if (value) {
              newPath.setAttribute(attr, value);
            }
          });
          
          // 确保d属性存在
          const dValue = firstPath.getAttribute("d");
          if (dValue) {
            newPath.setAttribute("d", dValue);
          }
          
          // 确保使用有效的stroke和stroke-width
          newPath.setAttribute("stroke", effectiveStroke);
          newPath.setAttribute("stroke-width", effectiveStrokeWidth.toString());
          
          // 保留path元素的marker属性（用于箭头）
          const markerEnd = path.getAttribute("marker-end");
          const markerStart = path.getAttribute("marker-start");
          const markerMid = path.getAttribute("marker-mid");
          if (markerEnd) newPath.setAttribute("marker-end", markerEnd);
          if (markerStart) newPath.setAttribute("marker-start", markerStart);
          if (markerMid) newPath.setAttribute("marker-mid", markerMid);
          
          // 保留fill属性（使用随机化后的颜色）
          if (effectiveFill !== "none" && effectiveFill !== "transparent") {
            newPath.setAttribute("fill", effectiveFill);
          } else {
            newPath.setAttribute("fill", "none");
          }
          
          // 保留原路径的class和id（如果存在）
          const originalClass = path.getAttribute("class");
          if (originalClass) {
            newPath.setAttribute("class", originalClass);
          }
          const originalId = path.getAttribute("id");
          if (originalId) {
            newPath.setAttribute("id", originalId);
          }
          
          // 替换原路径
          path.parentNode?.replaceChild(newPath, path);
        } else {
          // 如果rough.js没有生成路径，保留原路径但更新样式
          logger.debug(`路径 ${path.getAttribute("id") || "unknown"} 没有生成手绘路径，保留原路径`);
        }
      } else {
        // 如果直接返回的是path，直接替换
        const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        handDrawnPath.getAttributeNames().forEach((attr) => {
          const value = handDrawnPath.getAttribute(attr);
          if (value) {
            newPath.setAttribute(attr, value);
          }
        });
        newPath.setAttribute("stroke", effectiveStroke);
        newPath.setAttribute("stroke-width", effectiveStrokeWidth.toString());
        
        // 保留path元素的marker属性（用于箭头）
        const markerEnd = path.getAttribute("marker-end");
        const markerStart = path.getAttribute("marker-start");
        const markerMid = path.getAttribute("marker-mid");
        if (markerEnd) newPath.setAttribute("marker-end", markerEnd);
        if (markerStart) newPath.setAttribute("marker-start", markerStart);
        if (markerMid) newPath.setAttribute("marker-mid", markerMid);
        
        const originalClass = path.getAttribute("class");
        if (originalClass) {
          newPath.setAttribute("class", originalClass);
        }
        const originalId = path.getAttribute("id");
        if (originalId) {
          newPath.setAttribute("id", originalId);
        }
        
        path.parentNode?.replaceChild(newPath, path);
      }
    } catch (error: any) {
      logger.warn(`处理路径时出错，跳过: ${error.message}`);
      // 跳过有问题的路径，继续处理其他路径
    }
  });

  // 处理其他图形元素（rect, circle, ellipse, line, polygon, polyline）
  const shapes = [
    ...Array.from(svgElement.querySelectorAll("rect")),
    ...Array.from(svgElement.querySelectorAll("circle")),
    ...Array.from(svgElement.querySelectorAll("ellipse")),
    ...Array.from(svgElement.querySelectorAll("line")),
    ...Array.from(svgElement.querySelectorAll("polygon")),
    ...Array.from(svgElement.querySelectorAll("polyline")),
  ];

  shapes.forEach((shape) => {
    try {
      const tagName = shape.tagName.toLowerCase();
      const computedStyle = dom.window.getComputedStyle(shape as any);
      const stroke = shape.getAttribute("stroke") || 
                     computedStyle.stroke || 
                     shape.style.stroke || 
                     "#333333";
      const strokeWidth = parseFloat(shape.getAttribute("stroke-width") || 
                                     computedStyle.strokeWidth || 
                                     shape.style.strokeWidth || 
                                     "2");
      const fill = shape.getAttribute("fill") || 
                   computedStyle.fill || 
                   shape.style.fill || 
                   "none";
      const fillOpacity = shape.getAttribute("fill-opacity") || 
                         computedStyle.fillOpacity || 
                         shape.style.fillOpacity || 
                         "1";

      // 确定元素的组和对应的颜色/样式
      const elementGroup = groupColorsByBlock ? getElementGroup(shape) : null;
      const groupColor = elementGroup && groupColorMap.has(elementGroup) 
        ? groupColorMap.get(elementGroup)! 
        : null;
      const groupFillStyleValue = elementGroup && groupFillStyleMap.has(elementGroup)
        ? groupFillStyleMap.get(elementGroup)!
        : null;

      let effectiveStroke = (stroke && stroke !== "none" && stroke !== "transparent") 
        ? stroke 
        : "#333333";
      
      // 如果启用了按块分组颜色，使用组的颜色；否则随机化
      if (groupColorsByBlock && groupColor) {
        effectiveStroke = groupColor;
      } else if (randomizeColors) {
        effectiveStroke = randomizeColor(effectiveStroke);
      }
      
      // 对于fill颜色，也应用分组或随机化（如果启用）
      let effectiveFill = fill;
      if (fill !== "none" && fill !== "transparent") {
        if (groupColorsByBlock && groupColor) {
          effectiveFill = groupColor;
        } else if (randomizeColors) {
          effectiveFill = randomizeColor(fill);
        }
      }
      
      // 确定填充样式：优先使用组的样式，否则使用随机或默认样式
      const effectiveFillStyle = groupFillStyleValue || (randomizeFillStyle ? randomFillStyle() : fillStyle);
      
      // 增加stroke宽度，手绘风格需要更粗的线条（至少3px才能看清）
      const effectiveStrokeWidth = Math.max(strokeWidth > 0 ? strokeWidth * 1.5 : 3, 3); // 最小3px，手绘风格需要更粗

      let handDrawnShape: SVGPathElement | null = null;

      if (tagName === "rect") {
        const x = parseFloat(shape.getAttribute("x") || "0");
        const y = parseFloat(shape.getAttribute("y") || "0");
        const width = parseFloat(shape.getAttribute("width") || "0");
        const height = parseFloat(shape.getAttribute("height") || "0");
        const rx = parseFloat(shape.getAttribute("rx") || "0");
        const ry = parseFloat(shape.getAttribute("ry") || "0");

        handDrawnShape = rc.rectangle(x, y, width, height, {
          roughness,
          fillStyle: effectiveFill !== "none" && effectiveFill !== "transparent" ? effectiveFillStyle : undefined,
          stroke: effectiveStroke,
          strokeWidth: effectiveStrokeWidth,
          fill: effectiveFill !== "none" && effectiveFill !== "transparent" ? effectiveFill : "none",
          fillOpacity: effectiveFill !== "none" && effectiveFill !== "transparent" ? parseFloat(fillOpacity) : undefined,
        });
      } else if (tagName === "circle") {
        const cx = parseFloat(shape.getAttribute("cx") || "0");
        const cy = parseFloat(shape.getAttribute("cy") || "0");
        const r = parseFloat(shape.getAttribute("r") || "0");

        handDrawnShape = rc.circle(cx, cy, r * 2, {
          roughness,
          fillStyle: effectiveFill !== "none" && effectiveFill !== "transparent" ? effectiveFillStyle : undefined,
          stroke: effectiveStroke,
          strokeWidth: effectiveStrokeWidth,
          fill: effectiveFill !== "none" && effectiveFill !== "transparent" ? effectiveFill : "none",
          fillOpacity: effectiveFill !== "none" && effectiveFill !== "transparent" ? parseFloat(fillOpacity) : undefined,
        });
      } else if (tagName === "ellipse") {
        const cx = parseFloat(shape.getAttribute("cx") || "0");
        const cy = parseFloat(shape.getAttribute("cy") || "0");
        const rx = parseFloat(shape.getAttribute("rx") || "0");
        const ry = parseFloat(shape.getAttribute("ry") || "0");

        handDrawnShape = rc.ellipse(cx, cy, rx * 2, ry * 2, {
          roughness,
          fillStyle: effectiveFill !== "none" && effectiveFill !== "transparent" ? effectiveFillStyle : undefined,
          stroke: effectiveStroke,
          strokeWidth: effectiveStrokeWidth,
          fill: effectiveFill !== "none" && effectiveFill !== "transparent" ? effectiveFill : "none",
          fillOpacity: effectiveFill !== "none" && effectiveFill !== "transparent" ? parseFloat(fillOpacity) : undefined,
        });
      } else if (tagName === "line") {
        const x1 = parseFloat(shape.getAttribute("x1") || "0");
        const y1 = parseFloat(shape.getAttribute("y1") || "0");
        const x2 = parseFloat(shape.getAttribute("x2") || "0");
        const y2 = parseFloat(shape.getAttribute("y2") || "0");

        handDrawnShape = rc.line(x1, y1, x2, y2, {
          roughness,
          stroke: effectiveStroke,
          strokeWidth: effectiveStrokeWidth,
        });
      } else if (tagName === "polygon" || tagName === "polyline") {
        const points = shape.getAttribute("points");
        if (points) {
          const pointPairs = points
            .trim()
            .split(/[\s,]+/)
            .map(parseFloat)
            .filter((n) => !isNaN(n));

          // 获取transform（用于决策节点等有变换的元素）
          const transform = shape.getAttribute("transform");
          let transformMatrix: { tx: number; ty: number } | null = null;
          
          if (transform) {
            // 解析translate(x, y)
            const translateMatch = transform.match(/translate\(([^,]+),([^)]+)\)/);
            if (translateMatch) {
              transformMatrix = {
                tx: parseFloat(translateMatch[1].trim()),
                ty: parseFloat(translateMatch[2].trim()),
              };
            }
          }

          const coordinates: [number, number][] = [];
          for (let i = 0; i < pointPairs.length; i += 2) {
            if (i + 1 < pointPairs.length) {
              let x = pointPairs[i];
              let y = pointPairs[i + 1];
              
              // 应用transform偏移（如果有）
              if (transformMatrix) {
                x += transformMatrix.tx;
                y += transformMatrix.ty;
              }
              
              coordinates.push([x, y]);
            }
          }

          if (tagName === "polygon") {
            handDrawnShape = rc.polygon(coordinates, {
              roughness,
              fillStyle: effectiveFill !== "none" && effectiveFill !== "transparent" ? effectiveFillStyle : undefined,
              stroke: effectiveStroke,
              strokeWidth: effectiveStrokeWidth,
              fill: effectiveFill !== "none" && effectiveFill !== "transparent" ? effectiveFill : "none",
              fillOpacity: effectiveFill !== "none" && effectiveFill !== "transparent" ? parseFloat(fillOpacity) : undefined,
            });
          } else {
            handDrawnShape = rc.linearPath(coordinates, {
              roughness,
              stroke: effectiveStroke,
              strokeWidth: effectiveStrokeWidth,
            });
          }
        }
      }

      // 如果成功生成手绘图形，替换原图形
      // 注意：rough.js返回的也是<g>元素，需要提取内部的<path>
      if (handDrawnShape) {
        let actualPath: SVGPathElement | null = null;
        
        // 如果handDrawnShape是<g>，提取内部的<path>
        if (handDrawnShape.tagName === "g") {
          actualPath = handDrawnShape.querySelector("path");
        } else if (handDrawnShape.tagName === "path") {
          actualPath = handDrawnShape as any;
        }
        
        if (actualPath && actualPath.getAttribute("d")) {
          const pathElement = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          
          // 复制所有属性（包括d属性）
          actualPath.getAttributeNames().forEach((attr) => {
            const value = actualPath!.getAttribute(attr);
            if (value) {
              pathElement.setAttribute(attr, value);
            }
          });
          
          // 确保d属性存在
          const dValue = actualPath.getAttribute("d");
          if (dValue) {
            pathElement.setAttribute("d", dValue);
          }

          // 确保使用有效的stroke和stroke-width
          pathElement.setAttribute("stroke", effectiveStroke);
          pathElement.setAttribute("stroke-width", effectiveStrokeWidth.toString());
          
          // 使用随机化后的fill颜色（如果适用）
          if (tagName === "line") {
            // 对于line元素，保留marker属性（用于箭头）
            const markerEnd = shape.getAttribute("marker-end");
            const markerStart = shape.getAttribute("marker-start");
            const markerMid = shape.getAttribute("marker-mid");
            if (markerEnd) pathElement.setAttribute("marker-end", markerEnd);
            if (markerStart) pathElement.setAttribute("marker-start", markerStart);
            if (markerMid) pathElement.setAttribute("marker-mid", markerMid);
            pathElement.setAttribute("fill", "none");
          } else {
            if (effectiveFill !== "none" && effectiveFill !== "transparent") {
              pathElement.setAttribute("fill", effectiveFill);
            } else {
              pathElement.setAttribute("fill", "none");
            }
          }

          // 保留原图形的class和id
          const originalClass = shape.getAttribute("class");
          if (originalClass) {
            pathElement.setAttribute("class", originalClass);
          }
          const originalId = shape.getAttribute("id");
          if (originalId) {
            pathElement.setAttribute("id", originalId);
          }

          // 替换原图形
          shape.parentNode?.replaceChild(pathElement, shape);
        } else {
          logger.debug(`图形 ${shape.tagName} 没有生成有效的手绘路径，保留原图形`);
        }
      }
    } catch (error: any) {
      logger.warn(`处理 ${shape.tagName} 时出错，跳过: ${error.message}`);
    }
  });

  // 获取更新后的 SVG 内容
  const handDrawnSvg = svgElement.outerHTML;

  // 输出结果
  if (finalFormat === "svg") {
    writeFile(outputPath, handDrawnSvg);
    logger.info(`手绘风格 SVG 已保存: ${outputPath}`);
  } else {
    // 同时保存SVG用于调试
    const debugSvgPath = outputPath.replace(/\.(png|jpg)$/, ".hand-drawn.svg");
    writeFile(debugSvgPath, handDrawnSvg);
    logger.debug(`调试：手绘风格 SVG 已保存: ${debugSvgPath}`);
    // 使用 Sharp 转换 SVG 为 PNG/JPG
    // 注意：Sharp 无法正确渲染 foreignObject，但我们先尝试使用 Sharp
    // 如果确实需要完整文字渲染，可以考虑使用 Puppeteer
    const format = finalFormat === "jpg" ? "jpeg" : "png";
    
    // 获取 SVG 的 viewBox 或尺寸
    const viewBox = svgElement.getAttribute("viewBox");
    let svgWidth = 1200;
    let svgHeight = 800;
    
    if (viewBox) {
      const parts = viewBox.split(" ");
      if (parts.length >= 4) {
        svgWidth = parseFloat(parts[2]) || svgWidth;
        svgHeight = parseFloat(parts[3]) || svgHeight;
      }
    }
    
    // 使用白色背景（不透明），确保图片可见
    const background = { r: 255, g: 255, b: 255, alpha: 1 };
    
    try {
      // 尝试使用 Puppeteer 渲染（能正确处理 foreignObject）
      let puppeteer: any = null;
      try {
        puppeteer = await import("puppeteer");
      } catch {
        logger.debug("Puppeteer 未安装，使用 Sharp");
      }
      
      if (puppeteer) {
        try {
          const browser = await puppeteer.launch({ headless: true });
          const page = await browser.newPage();
          
          await page.setViewport({ 
            width: Math.round(svgWidth), 
            height: Math.round(svgHeight) 
          });
          
          // 将 SVG 嵌入 HTML，设置白色背景
          const html = `<!DOCTYPE html><html><head><style>body{margin:0;padding:0;background:white;}svg{display:block;}</style></head><body>${handDrawnSvg}</body></html>`;
          
          await page.setContent(html, { waitUntil: "networkidle0" });
          await page.screenshot({
            path: outputPath,
            type: format,
            fullPage: false,
          });
          
          await browser.close();
          logger.info(`手绘风格图片已保存（使用 Puppeteer）: ${outputPath}`);
          return; // 成功则直接返回
        } catch (puppeteerError: any) {
          logger.warn(`Puppeteer 渲染失败，回退到 Sharp: ${puppeteerError.message}`);
          // 继续执行 Sharp 回退逻辑
        }
      }
      
      // 使用 Sharp 作为回退方案（可能丢失 foreignObject 中的文字）
      {
        // 回退到 Sharp（可能丢失文字）
        await sharp(Buffer.from(handDrawnSvg))
          .resize(Math.round(svgWidth), Math.round(svgHeight), {
            fit: "contain",
            background: background,
          })
          .flatten({ background: background })
          .toFormat(format, {
            quality: 100,
            compressionLevel: 6,
          })
          .toFile(outputPath);
        
        logger.info(`手绘风格图片已保存（使用 Sharp，文字可能丢失）: ${outputPath}`);
      }
    } catch (error: any) {
      logger.error(`转换失败: ${error.message}`);
      throw error;
    }
  }
}

