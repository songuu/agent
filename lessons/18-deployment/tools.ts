/**
 * 第 18 章 · 部署示例用的工具集合。
 *
 * WHY 单独成文件：服务文件（index.ts）应聚焦"HTTP/SSE/错误兜底"这些部署关注点，
 * 业务工具与之正交，拆开后两边都更易读、也方便你把 tools 替换成自己的实现。
 *
 * 这里给两个零外部依赖、确定性强的示例工具（不依赖网络/时钟随机性），
 * 方便你在任意环境下复现，也方便后面写测试。
 */
import { z } from "zod";
import { defineTool, ToolRegistry } from "../../src/shared";

/**
 * 计算器工具：演示"模型把自然语言里的算术，交给确定性代码执行"。
 * 用受限的运算符白名单 + Function 求值，避免直接 eval 整段用户字符串。
 */
const calculator = defineTool({
  name: "calculator",
  description: "计算一个只含数字、+ - * / ( ) 和小数点的算术表达式，返回结果。",
  schema: z.object({
    expression: z
      .string()
      .describe("形如 (3 + 4) * 2 的算术表达式，只允许数字与 + - * / ( ) ."),
  }),
  execute: ({ expression }) => {
    // WHY 白名单校验：服务端永远不信任入参。把表达式限制到安全字符集，
    // 杜绝把任意 JS 注入到求值里（这是真实服务里"输入即攻击面"的最小演示）。
    if (!/^[\d+\-*/().\s]+$/.test(expression)) {
      return "Error: 表达式包含不允许的字符，只能用数字与 + - * / ( ) .";
    }
    try {
      // 受限字符集下用 Function 求值；注意这不是通用安全做法，仅因上面已严格白名单。
      const value = Function(`"use strict"; return (${expression});`)() as unknown;
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return "Error: 表达式无法求出有限数值。";
      }
      return `${expression} = ${value}`;
    } catch (err) {
      return `Error: 表达式求值失败 — ${(err as Error).message}`;
    }
  },
});

/**
 * 假天气工具：演示"工具不必真连外部 API 也能教学"。
 * 真实项目里这里会去调气象服务；课程中返回稳定的伪数据，保证可复现。
 */
const weather = defineTool({
  name: "get_weather",
  description: "查询某城市今天的（演示用）天气，返回温度与天气状况。",
  schema: z.object({
    city: z.string().describe("城市名，如 杭州 / Shanghai"),
  }),
  execute: ({ city }) => {
    // 用城市名长度派生一个稳定的"伪温度"，保证同样输入永远同样输出（便于演示与测试）。
    const fakeTemp = 18 + (city.length % 10);
    return JSON.stringify({ city, condition: "晴", temperatureC: fakeTemp });
  },
});

/**
 * 构建并返回工具注册表。
 * WHY 用函数而非模块级单例：每个请求/每次启动都拿到干净实例，避免隐式共享可变状态——
 * 这与本章强调的"无状态服务"一脉相承。
 */
export function buildRegistry(): ToolRegistry {
  return new ToolRegistry([calculator, weather]);
}
