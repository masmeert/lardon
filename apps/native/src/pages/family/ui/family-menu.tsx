import { Stack, router } from "expo-router";

export function familyMenu({
  canRename,
  hasInvite,
  canRevokeInvite,
  onCopyInvite,
  onRevokeInvite,
  onLeave,
}: {
  canRename: boolean;
  hasInvite: boolean;
  canRevokeInvite: boolean;
  onCopyInvite: () => void;
  onRevokeInvite: () => void;
  onLeave: () => void;
}) {
  return (
    <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel="More">
      {canRename && (
        <Stack.Toolbar.MenuAction icon="pencil" onPress={() => router.push("/family/rename")}>
          Rename family
        </Stack.Toolbar.MenuAction>
      )}
      {hasInvite && (
        <Stack.Toolbar.Menu inline>
          <Stack.Toolbar.MenuAction icon="doc.on.doc" onPress={onCopyInvite}>
            Copy invite code
          </Stack.Toolbar.MenuAction>
          {canRevokeInvite && (
            <Stack.Toolbar.MenuAction icon="xmark.circle" onPress={onRevokeInvite}>
              Revoke invite code
            </Stack.Toolbar.MenuAction>
          )}
        </Stack.Toolbar.Menu>
      )}
      <Stack.Toolbar.MenuAction
        icon="rectangle.portrait.and.arrow.right"
        destructive
        onPress={onLeave}
      >
        Leave family
      </Stack.Toolbar.MenuAction>
    </Stack.Toolbar.Menu>
  );
}
