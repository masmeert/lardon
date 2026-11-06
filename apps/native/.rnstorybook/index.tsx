import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { view } from "./storybook.requires";

export default view.getStorybookUI({
  storage:
    Platform.OS === "web"
      ? {
          async getItem(key) {
            return localStorage.getItem(key);
          },
          async setItem(key, value) {
            localStorage.setItem(key, value);
          },
        }
      : {
          getItem: SecureStore.getItemAsync,
          setItem: SecureStore.setItemAsync,
        },
});
