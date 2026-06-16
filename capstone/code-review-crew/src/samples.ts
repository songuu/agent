/**
 * 内置待评审代码样本（埋了已知问题，用于离线确定演示）。
 *
 * 用「内置样本」而非读真实 git diff，是为了让评审结果**可回归**：同一份输入永远得到同一批发现，
 * smoke 才能断言。真实项目把 SAMPLE_FILES 换成 `git diff` 解析出的改动文件即可，评审逻辑不变。
 */

/** 一个待评审文件。 */
export interface CodeFile {
  path: string;
  content: string;
}

/** 三个样本，分别集中暴露安全 / 性能 / 风格问题（也有交叉）。 */
export const SAMPLE_FILES: readonly CodeFile[] = [
  {
    path: "src/auth.ts",
    content: [
      "const apiKey = \"sk-live-AbCd1234567890abcdef\";", // 硬编码密钥（critical）
      "export async function login(name: string, pwd: string) {",
      "  const sql = \"SELECT * FROM users WHERE name = '\" + name + \"'\";", // SQL 拼接（critical）
      "  const row = await db.query(sql);",
      "  if (row.pwd == pwd) {", // 宽松相等（minor）
      "    return eval(row.hook);", // eval（critical）
      "  }",
      "}",
    ].join("\n"),
  },
  {
    path: "src/report.ts",
    content: [
      "export function summarize(users: any[]) {", // any（minor）
      "  var total = 0;", // var（minor）
      "  for (const u of users) {",
      "    for (const o of u.orders) {", // 嵌套循环 O(n^2)（major）
      "      const data = await fetch(o.url);", // await in loop（major）
      "      total += JSON.parse(data).amount;",
      "    }",
      "  }",
      "  console.log(total);", // console.log（minor）
      "  return total;",
      "}",
    ].join("\n"),
  },
  {
    path: "src/util.ts",
    content: [
      "export function clean(input) {", // 缺类型注解（minor）
      "  const out = require('child_process').execSync('rm ' + input);", // 命令注入（critical）
      "  return out;",
      "}",
    ].join("\n"),
  },
];
