import { authQuery } from "../lib"

export const getMe = authQuery({
  handler: async (ctx) => {
    return {
      ...(await ctx.auth.getUserAsync(ctx))
    }
  }
})
