import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

it("server action modules export only async functions or erased types", () => {
  const directory = join(process.cwd(), "src", "actions");
  const invalid: string[] = [];
  for (const name of readdirSync(directory).filter(file => file.endsWith(".ts") && !file.endsWith(".test.ts"))) {
    const content = readFileSync(join(directory, name), "utf8");
    const source = ts.createSourceFile(name, content, ts.ScriptTarget.Latest, true);
    if (!source.statements.some(node => ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === "use server")) continue;
    for (const node of source.statements) {
      if (ts.isExportDeclaration(node)) { if (!node.isTypeOnly) invalid.push(name + ": re-export"); continue; }
      const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
      if (!modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
      if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) continue;
      if (!ts.isFunctionDeclaration(node) || !modifiers.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) invalid.push(name + ": " + node.getText(source).slice(0, 100));
    }
  }
  expect(invalid).toEqual([]);
});
