import { Button, Typography } from "heroui-native";
import { View } from "react-native";

import { authClient } from "@/lib/auth-client";

export default function HomeScreen() {
  const { data: session } = authClient.useSession();

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-5">
      <Typography className="text-base text-muted">Signed in as {session?.user.email}</Typography>
      <Button variant="secondary" onPress={() => void authClient.signOut()}>
        <Button.Label>Sign out</Button.Label>
      </Button>
    </View>
  );
}
