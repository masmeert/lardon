import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { Button, Icon, Surface, Text } from "@lardon/ui";
import { AsyncResult } from "effect/reactivity";
import { useEffect } from "react";
import { View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";
import { familiesAtom, healthAtom } from "@/utils/api";

export default function Home() {
  const health = useAtomValue(healthAtom);
  const families = useAtomValue(familiesAtom);
  const refreshFamilies = useAtomRefresh(familiesAtom);
  const isConnected = AsyncResult.isSuccess(health);
  const isLoading = AsyncResult.isInitial(health) || health.waiting;
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  useEffect(() => {
    refreshFamilies();
  }, [userId, refreshFamilies]);

  return (
    <Container>
      <View className="gap-6 p-5">
        <Text variant="display" className="py-4">
          Lardon
        </Text>

        {session?.user ? (
          <Surface className="gap-1 rounded-card p-5">
            <Text variant="headline">Welcome, {session.user.name}</Text>
            <Text variant="caption" tone="muted">
              {session.user.email}
            </Text>
            <Button
              label="Sign out"
              variant="secondary"
              size="compact"
              className="mt-3 self-start"
              onPress={() => {
                void authClient.signOut();
              }}
            />
          </Surface>
        ) : null}

        <Surface className="flex-row items-center gap-3 rounded-card p-5">
          <Icon
            name={
              isLoading ? "hourglass" : isConnected ? "checkmark.circle.fill" : "xmark.circle.fill"
            }
            tone={isLoading ? "muted" : isConnected ? "success" : "danger"}
            size={22}
          />
          <View className="flex-1 gap-0.5">
            <Text variant="headline">Server</Text>
            <Text variant="caption" tone="muted">
              {isLoading
                ? "Checking the connection…"
                : isConnected
                  ? "Connected"
                  : "Can't reach the server. Check that it's running and that your phone is online."}
            </Text>
          </View>
        </Surface>

        <Surface className="gap-1 rounded-card p-5">
          <Text variant="headline">Families</Text>
          {AsyncResult.isSuccess(families) ? (
            <Text variant="caption" tone="muted">
              {families.value.length} families
            </Text>
          ) : null}
        </Surface>

        {session?.user ? null : (
          <>
            <SignIn />
            <SignUp />
          </>
        )}
      </View>
    </Container>
  );
}
