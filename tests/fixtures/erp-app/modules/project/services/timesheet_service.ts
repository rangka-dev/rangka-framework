import { defineService } from '@rangka/shared';

export default defineService({
  name: 'project.timesheet_service',
  label: 'Timesheet Service',
  deps: ['hr.leave_service'],
  factory(ctx) {
    return {
      async getTotalHours(taskId: string) {
        const result = await ctx.db
          .selectFrom('project__timesheet')
          .select(ctx.db.fn.sum('hours').as('total'))
          .where('task', '=', taskId)
          .executeTakeFirst();
        return Number((result as Record<string, unknown>)?.total ?? 0);
      },
      async isEmployeeOnLeave(employeeId: string, _date: string) {
        const leaveService = ctx.service('hr.leave_service');
        const balance = await leaveService.getBalance(employeeId);
        return balance.remaining <= 0;
      },
    };
  },
});
