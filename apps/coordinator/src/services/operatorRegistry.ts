export type OperatorConfig = {
  operatorId: string;
  url: string;
  privateKey: string;
};

function envUrl(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const OPERATORS: Record<string, OperatorConfig> = {
  "operator-1": {
    operatorId: "operator-1",
    url: envUrl("OPERATOR_1_URL", "http://localhost:5001"),
    privateKey: "operator-1-demo-private-key"
  },
  "operator-2": {
    operatorId: "operator-2",
    url: envUrl("OPERATOR_2_URL", "http://localhost:5002"),
    privateKey: "operator-2-demo-private-key"
  },
  "operator-3": {
    operatorId: "operator-3",
    url: envUrl("OPERATOR_3_URL", "http://localhost:5003"),
    privateKey: "operator-3-demo-private-key"
  }
};

