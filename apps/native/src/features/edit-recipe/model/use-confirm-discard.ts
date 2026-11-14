import { useNavigation, usePreventRemove } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { useRecipeEditor } from "./recipe-editor";
import { isChanged } from "./recipe-fields";

export function useConfirmDiscard({ title, message }: { title: string; message: string }) {
  const navigation = useNavigation();
  const { base, fields } = useRecipeEditor();
  const [isLeaving, setIsLeaving] = useState(false);
  const navigateAway = useRef<() => void>(undefined);

  function leave(navigate: () => void) {
    navigateAway.current = navigate;
    setIsLeaving(true);
  }

  usePreventRemove(!isLeaving && isChanged(base.fields, fields), ({ data }) =>
    Alert.alert(title, message, [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => leave(() => navigation.dispatch(data.action)),
      },
    ]),
  );

  useEffect(() => {
    if (isLeaving) navigateAway.current?.();
  }, [isLeaving]);

  return leave;
}
