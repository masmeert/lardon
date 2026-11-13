import { Option, Schema } from "effect";
import { useSetValueCallback, useValue } from "tinybase/ui-react";

export function usePreference<Value extends string>(
  key: string,
  schema: Schema.Codec<Value>,
  fallback: Value,
) {
  const stored = useValue(key, "preferences");

  const setValue = useSetValueCallback(key, (value: Value) => value, [], "preferences");

  return [
    Option.getOrElse(Schema.decodeUnknownOption(schema)(stored), () => fallback),
    setValue,
  ] as const;
}
