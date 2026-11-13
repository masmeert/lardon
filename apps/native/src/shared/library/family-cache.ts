import { FamilySummary } from "@lardon/api/families";
import { Option, Schema } from "effect";
import Storage from "expo-sqlite/kv-store";

const CachedFamilies = Schema.fromJsonString(Schema.Array(FamilySummary));

export function readCachedFamilies() {
  return Option.getOrElse(
    Schema.decodeUnknownOption(CachedFamilies)(Storage.getItemSync("families")),
    () => [],
  );
}

export function writeCachedFamilies(families: readonly FamilySummary[]) {
  Storage.setItemSync("families", Schema.encodeSync(CachedFamilies)(families));
}

export function clearCachedFamilies() {
  Storage.removeItemSync("families");
}
