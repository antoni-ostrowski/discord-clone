# My React web stack (BETC Stack Template)

> I was tired of configuring tech stack every time I wanted to start new web app so i created this repo. This is exactly how I would start new web app today.

_**This repo is meant to be cloned and used as a starting point for a your next web app.**_

# Getting Started

You can wire everything up yourself if you like, but I propose you just clone this repo to have my exact setup.

> Remember to delete the .git folder, and init a new repo after cloning :)
> Main branch contains new approach with better-convex, but theres also branch with simpler setup (which has some perf implications thats why i moved to better-convex)

```bash
git clone https://github.com/antoni-ostrowski/BETC-stack.git
cd BETC-stack
rm -rf .git
bun install
bun dev
bun backend
bun backend:env-sync
```

# Technologies

These technologies create in my opinion the best web stack for complex web apps. Everything is fully typesafe and DX is next level.

- [Tanstack (Start & Router & Query & ...)](https://tanstack.com/) (React framework & tools)
- [Convex](https://www.convex.dev/) (Backend)
- [Better-auth](https://www.better-auth.com/) (Auth)
- [EffectTS](https://effect.website/) (Production-grade TypeScript)
- [Better Convex](https://www.better-convex.com/) (convex "framework")

## Tooling

- Package manager / runtime - [Bun](https://bun.com/docs/pm/cli/install)
- Linter - [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)
- Formatter - [Prettier](https://prettier.io/docs/install)
  - Waits to be replaced by [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)

> I'm still experimenting with the best way to make the effect code interact correctly with convex functions. 

```typescript
// full repo pattern (little clunky)
export const toggle = mutation({
  args: { id: v.id("todos") },
  handler: async ({ db }, { id }) => {
    const program = Effect.gen(function* () {
      const todoApi = yield* TodoApi
      const todo = yield* todoApi.getTodo({ db, todoId: id })
      yield* todoApi.toggleTodo({ db, todo })
    }).pipe(Effect.tapError((err) => Effect.logError(err)))

    return await runEffOrThrow(appRuntime, program)
  }
})

// or with a effectful promise wrapper
// (also this is newer approach with better-convex and convex ents)
export const list = authQuery.query(async ({ ctx }) => {
  const program = effectifyPromise(
    () => ctx.table("todo"),
    (cause, message) => new DatabaseError({ cause, message })
  )
  return await appRuntime.runPromise(program)
})
```

# Media

> Its really minimalistic, just a handy starter point

<img src="https://github.com/user-attachments/assets/b6e00cbc-a500-4284-a0ef-4a3c94c2b306" width="60%" height="60%" />

<img src="https://github.com/user-attachments/assets/1d42bafe-57cc-4b96-a312-46a1c93fca96" width="60%" height="60%" />

<img src="https://github.com/user-attachments/assets/503e93ed-d02d-4921-a2f5-5c1bd965f034" width="60%" height="60%" />
