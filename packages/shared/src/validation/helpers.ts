export interface TypoWarning {
  path: string;
  widgetType: string;
  suggestion: string;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function findClosest(target: string, candidates: string[]): string | undefined {
  let best: string | undefined;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = levenshtein(target, c);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return bestDist <= 2 ? best : undefined;
}

interface WidgetNode {
  type: string;
  children?: WidgetNode[];
}

export function detectWidgetTypos(body: WidgetNode[], builtInTypes: string[]): TypoWarning[] {
  const warnings: TypoWarning[] = [];

  function walk(nodes: WidgetNode[], path: string) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!builtInTypes.includes(node.type)) {
        const closest = findClosest(node.type, builtInTypes);
        if (closest) {
          warnings.push({
            path: `${path}[${i}].type`,
            widgetType: node.type,
            suggestion: closest,
          });
        }
      }
      if (node.children) walk(node.children, `${path}[${i}].children`);
    }
  }

  walk(body, 'body');
  return warnings;
}
