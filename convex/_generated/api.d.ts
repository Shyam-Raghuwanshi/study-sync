/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiTutor from "../aiTutor.js";
import type * as messages from "../messages.js";
import type * as problems from "../problems.js";
import type * as resources from "../resources.js";
import type * as studyAssistant from "../studyAssistant.js";
import type * as studyGroups from "../studyGroups.js";
import type * as studySessions from "../studySessions.js";
import type * as whiteboards from "../whiteboards.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiTutor: typeof aiTutor;
  messages: typeof messages;
  problems: typeof problems;
  resources: typeof resources;
  studyAssistant: typeof studyAssistant;
  studyGroups: typeof studyGroups;
  studySessions: typeof studySessions;
  whiteboards: typeof whiteboards;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
