/**
 * 极简彩色日志。无第三方依赖，直接用 ANSI 转义码。
 *
 * WHY: 课程中需要清晰区分"用户/助手/工具/系统"的输出，以及调试信息。
 * 不引入 winston/pino 这类生产级日志库，是为了让初学者把注意力放在 agent 逻辑本身。
 */

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
} as const;

type ColorName = keyof typeof COLORS;

/** 给一段文字裹上颜色。 */
export function color(text: string, name: ColorName): string {
  return `${COLORS[name]}${text}${COLORS.reset}`;
}

export const logger = {
  info: (msg: string) => console.log(color("ℹ ", "blue") + msg),
  success: (msg: string) => console.log(color("✓ ", "green") + msg),
  warn: (msg: string) => console.log(color("⚠ ", "yellow") + msg),
  error: (msg: string) => console.error(color("✗ ", "red") + msg),
  debug: (msg: string) => {
    if (process.env.DEBUG) console.log(color("· " + msg, "gray"));
  },
};
