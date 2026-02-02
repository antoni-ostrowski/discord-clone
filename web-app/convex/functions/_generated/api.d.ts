/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";
import type { GenericId as Id } from "convex/values";

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: {
  channel: {
    m: {
      create: FunctionReference<"mutation", "public", { name: string }, any>;
      joinOrLeave: FunctionReference<
        "mutation",
        "public",
        { action: "join" | "leave"; channelId: Id<"channel"> },
        any
      >;
      remove: FunctionReference<
        "mutation",
        "public",
        { channelId: Id<"channel"> },
        any
      >;
    };
    q: {
      list: FunctionReference<
        "query",
        "public",
        {},
        Array<{
          channel: {
            _creationTime: number;
            _id: Id<"channel">;
            name: string;
            serverId: Id<"organization">;
          };
          isCurrentUserMember: boolean;
          members: Array<{
            _creationTime: number;
            _id: Id<"user">;
            banExpires?: null | number;
            banReason?: null | string;
            banned?: null | boolean;
            bio?: null | string;
            createdAt: number;
            currentChannelId?: Id<"channel">;
            customerId?: string;
            deletedAt?: number;
            email: string;
            emailVerified: boolean;
            firstName?: null | string;
            github?: null | string;
            image?: null | string;
            lastActiveOrganizationId?: Id<"organization">;
            lastName?: null | string;
            linkedin?: null | string;
            location?: null | string;
            name: string;
            personalOrganizationId?: Id<"organization">;
            role?: null | string;
            updatedAt: number;
            website?: null | string;
            x?: null | string;
          }>;
        }>
      >;
    };
  };
  organization: {
    createOrganization: FunctionReference<
      "mutation",
      "public",
      { name: string },
      { id: Id<"organization">; slug: string }
    >;
    list: FunctionReference<
      "query",
      "public",
      {},
      {
        organizations: Array<{
          id: Id<"organization">;
          isPersonal: boolean;
          logo?: string | null;
          name: string;
          slug: string;
        }>;
      }
    >;
  };
  server: {
    q: {
      get: FunctionReference<
        "query",
        "public",
        { serverId: Id<"organization"> },
        {
          channels: Array<{
            channel: {
              _creationTime: number;
              _id: Id<"channel">;
              name: string;
              serverId: Id<"organization">;
            };
            isCurrentUserMember: boolean;
            members: Array<{
              _creationTime: number;
              _id: Id<"user">;
              banExpires?: null | number;
              banReason?: null | string;
              banned?: null | boolean;
              bio?: null | string;
              createdAt: number;
              currentChannelId?: Id<"channel">;
              customerId?: string;
              deletedAt?: number;
              email: string;
              emailVerified: boolean;
              firstName?: null | string;
              github?: null | string;
              image?: null | string;
              lastActiveOrganizationId?: Id<"organization">;
              lastName?: null | string;
              linkedin?: null | string;
              location?: null | string;
              name: string;
              personalOrganizationId?: Id<"organization">;
              role?: null | string;
              updatedAt: number;
              website?: null | string;
              x?: null | string;
            }>;
          }>;
          server: {
            _creationTime: number;
            _id: Id<"organization">;
            createdAt: number;
            logo?: null | string;
            metadata?: null | string;
            name: string;
            slug: string;
          };
        }
      >;
    };
  };
  user: {
    q: {
      getCurrentChannel: FunctionReference<
        "query",
        "public",
        {},
        {
          _creationTime: number;
          _id: Id<"channel">;
          name: string;
          serverId: Id<"organization">;
        }
      >;
    };
  };
};

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: {
  auth: {
    beforeCreate: FunctionReference<
      "mutation",
      "internal",
      { data: any; model: string },
      any
    >;
    beforeDelete: FunctionReference<
      "mutation",
      "internal",
      { doc: any; model: string },
      any
    >;
    beforeUpdate: FunctionReference<
      "mutation",
      "internal",
      { doc: any; model: string; update: any },
      any
    >;
    create: FunctionReference<
      "mutation",
      "internal",
      {
        beforeCreateHandle?: string;
        input: { data: any; model: string };
        onCreateHandle?: string;
        select?: Array<string>;
      },
      any
    >;
    deleteMany: FunctionReference<
      "mutation",
      "internal",
      {
        beforeDeleteHandle?: string;
        input: { model: string; where?: Array<any> };
        onDeleteHandle?: string;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      any
    >;
    deleteOne: FunctionReference<
      "mutation",
      "internal",
      {
        beforeDeleteHandle?: string;
        input: { model: string; where?: Array<any> };
        onDeleteHandle?: string;
      },
      any
    >;
    findMany: FunctionReference<
      "query",
      "internal",
      {
        join?: any;
        limit?: number;
        model: string;
        offset?: number;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        sortBy?: { direction: "asc" | "desc"; field: string };
        where?: Array<{
          connector?: "AND" | "OR";
          field: string;
          operator?:
            | "lt"
            | "lte"
            | "gt"
            | "gte"
            | "eq"
            | "in"
            | "not_in"
            | "ne"
            | "contains"
            | "starts_with"
            | "ends_with";
          value:
            | string
            | number
            | boolean
            | Array<string>
            | Array<number>
            | null;
        }>;
      },
      any
    >;
    findOne: FunctionReference<
      "query",
      "internal",
      {
        join?: any;
        model: string;
        select?: Array<string>;
        where?: Array<{
          connector?: "AND" | "OR";
          field: string;
          operator?:
            | "lt"
            | "lte"
            | "gt"
            | "gte"
            | "eq"
            | "in"
            | "not_in"
            | "ne"
            | "contains"
            | "starts_with"
            | "ends_with";
          value:
            | string
            | number
            | boolean
            | Array<string>
            | Array<number>
            | null;
        }>;
      },
      any
    >;
    getLatestJwks: FunctionReference<"action", "internal", {}, any>;
    onCreate: FunctionReference<
      "mutation",
      "internal",
      { doc: any; model: string },
      any
    >;
    onDelete: FunctionReference<
      "mutation",
      "internal",
      { doc: any; model: string },
      any
    >;
    onUpdate: FunctionReference<
      "mutation",
      "internal",
      { model: string; newDoc: any; oldDoc: any },
      any
    >;
    rotateKeys: FunctionReference<"action", "internal", {}, any>;
    updateMany: FunctionReference<
      "mutation",
      "internal",
      {
        beforeUpdateHandle?: string;
        input: { model: string; update: any; where?: Array<any> };
        onUpdateHandle?: string;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      any
    >;
    updateOne: FunctionReference<
      "mutation",
      "internal",
      {
        beforeUpdateHandle?: string;
        input: { model: string; update: any; where?: Array<any> };
        onUpdateHandle?: string;
      },
      any
    >;
  };
};

export declare const components: {};
