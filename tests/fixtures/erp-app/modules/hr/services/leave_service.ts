import { defineService } from '@rangka/shared';

export default defineService({
  name: 'hr.leave_service',
  label: 'Leave Service',
  deps: [],
  factory(ctx) {
    return {
      async getBalance(employeeId: string) {
        const result = await ctx.models
          .query('hr.leave_request')
          .filter({ employee: employeeId, status: 'Approved' })
          .aggregate({ sum: 'days' });
        const used = (result as { sum?: Record<string, number> }).sum?.days ?? 0;
        return { annual: 20, used, remaining: 20 - used };
      },
    };
  },
});
