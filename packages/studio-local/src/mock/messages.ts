export type ToolCall = {
  name: string;
  input: Record<string, unknown>;
  output: string;
};

export type SchemaDiff = {
  operations: Array<{
    type: 'create_table' | 'add_column' | 'drop_column' | 'alter_column';
    table: string;
    ddl: string;
  }>;
};

export type Message = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  toolCalls?: ToolCall[];
  schemaDiff?: SchemaDiff;
  timestamp: string;
};

export const mockMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content:
      'Create a sales module with order and customer models. Orders should belong to customers and track total amount, status, and order date.',
    timestamp: '2026-06-17T09:00:00Z',
  },
  {
    id: '2',
    role: 'agent',
    content:
      "I'll create a sales module with two models: `order` and `customer`. The order model will have a foreign key to customer, plus fields for total amount, status, and order date. Let me first check existing models to avoid conflicts.",
    toolCalls: [
      {
        name: 'introspect_models',
        input: { module: 'sales' },
        output: JSON.stringify(
          {
            models: [],
            message: 'No existing models found in sales module.',
          },
          null,
          2,
        ),
      },
    ],
    timestamp: '2026-06-17T09:00:05Z',
  },
  {
    id: '3',
    role: 'agent',
    content:
      "No conflicts found. I've created the sales module with the following structure:\n\n- **sales.customer** — name, email, phone, created_at\n- **sales.order** — customer_id (FK), total_amount, status, order_date, created_at\n\nThis requires a schema change. Please review the DDL operations below.",
    schemaDiff: {
      operations: [
        {
          type: 'create_table',
          table: 'sales__customer',
          ddl: `CREATE TABLE "sales__customer" (\n  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  "name" VARCHAR(255) NOT NULL,\n  "email" VARCHAR(255),\n  "phone" VARCHAR(50),\n  "created_at" TIMESTAMPTZ DEFAULT now()\n);`,
        },
        {
          type: 'create_table',
          table: 'sales__order',
          ddl: `CREATE TABLE "sales__order" (\n  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  "customer_id" UUID NOT NULL REFERENCES "sales__customer"("id"),\n  "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,\n  "status" VARCHAR(50) NOT NULL DEFAULT 'draft',\n  "order_date" DATE NOT NULL DEFAULT CURRENT_DATE,\n  "created_at" TIMESTAMPTZ DEFAULT now()\n);`,
        },
      ],
    },
    timestamp: '2026-06-17T09:00:12Z',
  },
  {
    id: '4',
    role: 'user',
    content: 'Looks good, apply it.',
    timestamp: '2026-06-17T09:00:30Z',
  },
  {
    id: '5',
    role: 'agent',
    content:
      'Schema applied successfully. Both tables are now live. You can start using `sales.order` and `sales.customer` in your app.',
    timestamp: '2026-06-17T09:00:35Z',
  },
];
