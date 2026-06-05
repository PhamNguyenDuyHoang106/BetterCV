import { en } from "./en";

export type DeepNormalize<T> = T extends string
  ? string
  : T extends number
  ? number
  : T extends boolean
  ? boolean
  : T extends Array<infer U>
  ? Array<DeepNormalize<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepNormalize<U>>
  : { [K in keyof T]: DeepNormalize<T[K]> };

export type TranslationSchema = DeepNormalize<typeof en>;
