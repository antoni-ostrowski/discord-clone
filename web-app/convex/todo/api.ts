import { Effect, flow } from "effect"
import { Doc, Id } from "../_generated/dataModel"
import { DatabaseReader, DatabaseWriter } from "../_generated/server"
import { MyUserId } from "../betterAuth/schema"
import { DatabaseError, NotFound } from "../utils_effect"

// this is just an example structure that I think works nicely, its a simple repo pattern
// for data aceess layer
export class TodoApi extends Effect.Service<TodoApi>()("TodoApi", {
  effect: Effect.gen(function* () {
    return {
      listTodos: flow(
        (args: { db: DatabaseReader }) => args,
        ({ db }) =>
          Effect.tryPromise({
            try: async () => await db.query("todos").collect(),
            catch: (cause) =>
              new DatabaseError({ message: "Failed to fetch todos", cause })
          }),
        Effect.tapError((err) => Effect.logError(err))
      ),

      getTodo: flow(
        (args: { db: DatabaseReader; todoId: Id<"todos"> }) => args,
        ({ db, todoId }) =>
          Effect.tryPromise({
            try: async () => await db.get("todos", todoId),
            catch: (cause) =>
              new DatabaseError({ message: "Failed to get todo", cause })
          }),
        Effect.filterOrFail(
          (a) => a != null,
          (cause) => new NotFound({ cause })
        ),
        Effect.tapError((err) => Effect.logError(err))
      ),

      toggleTodo: flow(
        (args: { db: DatabaseWriter; todo: Doc<"todos"> }) => args,
        ({ db, todo }) =>
          Effect.tryPromise({
            try: async () => {
              await db.patch(todo._id, { completed: !todo.completed })
            },
            catch: (cause) =>
              new DatabaseError({ message: "Failed to update todo", cause })
          }),
        Effect.tapError((err) => Effect.logError(err))
      ),

      create: flow(
        (args: { db: DatabaseWriter; text: string; userId: MyUserId }) => args,
        ({ db, text, userId }) =>
          Effect.tryPromise({
            try: async () =>
              await db.insert("todos", {
                text,
                completed: true,
                userId
              }),
            catch: (cause) =>
              new DatabaseError({ message: "Failed to create todo", cause })
          }),
        Effect.tapError((err) => Effect.logError(err))
      ),
      remove: flow(
        (args: { db: DatabaseWriter; todoId: Id<"todos"> }) => args,
        ({ db, todoId }) =>
          Effect.tryPromise({
            try: async () => {
              await db.delete(todoId)
            },
            catch: (cause) =>
              new DatabaseError({ message: "Failed to remove todo", cause })
          }),
        Effect.tapError((err) => Effect.logError(err))
      )
    }
  })
}) {}
