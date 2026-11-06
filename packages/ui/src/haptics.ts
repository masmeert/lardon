import * as Haptics from "expo-haptics";

function selectionChanged() {
  void Haptics.selectionAsync();
}

function snapped() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function succeeded() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

function warned() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

function failed() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export const haptics = { selectionChanged, snapped, succeeded, warned, failed };
