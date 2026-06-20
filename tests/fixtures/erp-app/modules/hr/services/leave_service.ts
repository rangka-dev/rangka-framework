import { defineService } from '@rangka/shared';

export default defineService({
  name: 'hr.leave_service',
  label: 'Leave Service',
  deps: [],
  factory(ctx) {
    return {
      async getBalance(employeeId: string) {
        const result = await ctx.db
          .selectFrom('hr__leave_request')
          .select(ctx.db.fn.sum('days').as('total_days'))
          .where('employee', '=', employeeId)
          .where('status', '=', 'Approved')
          .executeTakeFirst();
        const used = Number((result as Record<string, unknown>)?.total_days ?? 0);
        return { annual: 20, used, remaining: 20 - used };
      },
    };
  },
});
