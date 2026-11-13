import { useState } from "react";
import { Text, View } from "react-native";

import { authClient } from "#/shared/auth";
import { Button, ButtonLabel } from "#/shared/ui";

export default function Home() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background">
      <Text className="text-body text-foreground">Lardon</Text>
      <Button
        variant="secondary"
        isLoading={isSigningOut}
        onPress={() => {
          setIsSigningOut(true);
          void authClient.signOut().finally(() => setIsSigningOut(false));
        }}
      >
        <ButtonLabel>Sign out</ButtonLabel>
      </Button>
    </View>
  );
}
