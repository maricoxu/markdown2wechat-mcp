import { readFile } from "../utils/fs.js";

/**
 * Frontmatter 数据
 */
export interface FrontMatter {
  title?: string;
  summary?: string;
  tags?: string[];
  cover?: string;
  [key: string]: any;
}

/**
 * 解析 frontmatter 和正文
 */
export function parseFrontMatter(content: string): {
  frontmatter: FrontMatter;
  body: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    // 没有 frontmatter，返回空对象和全部内容作为正文
    return {
      frontmatter: {},
      body: content,
    };
  }

  const frontmatterText = match[1];
  const body = match[2];

  // 简单的 YAML 解析（仅支持基本的 key: value 格式）
  const frontmatter: FrontMatter = {};
  const lines = frontmatterText.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    let value: any = trimmed.substring(colonIndex + 1).trim();

    // 处理引号
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // 处理数组（简单处理，仅支持单行）
    if (value.startsWith("[") && value.endsWith("]")) {
      const arrayContent = value.slice(1, -1);
      value = arrayContent
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter((v) => v.length > 0);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

/**
 * 从文件路径解析 frontmatter
 */
export function parseFrontMatterFromFile(filePath: string): {
  frontmatter: FrontMatter;
  body: string;
} {
  const content = readFile(filePath);
  return parseFrontMatter(content);
}

/**
 * 合并 frontmatter 和正文
 */
export function mergeFrontMatter(frontmatter: FrontMatter, body: string): string {
  const frontmatterLines: string[] = [];
  
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value === undefined || value === null) continue;
    
    if (Array.isArray(value)) {
      frontmatterLines.push(`${key}: [${value.map((v) => `"${v}"`).join(", ")}]`);
    } else if (typeof value === "string") {
      frontmatterLines.push(`${key}: "${value}"`);
    } else {
      frontmatterLines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }

  if (frontmatterLines.length === 0) {
    return body;
  }

  return `---\n${frontmatterLines.join("\n")}\n---\n\n${body}`;
}


