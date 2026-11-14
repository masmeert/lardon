import { operator, websiteUrl } from "@lardon/brand";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";

import { MemberAvatar, familiesQuery } from "#/entities/family";
import { authClient } from "#/shared/auth";
import { GroupedRow, GroupedSection, InlineError } from "#/shared/ui";

import { UnitsPicker } from "./units-picker";

export function SettingsScreen() {
  const { data: session } = authClient.useSession();
  const { data: families = [] } = useQuery(familiesQuery);
  const family = families.find((candidate) => !candidate.personal);
  const [isMailMissing, setIsMailMissing] = useState(false);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
      {session && (
        <GroupedSection>
          <GroupedRow
            label={session.user.name || "Your account"}
            detail={session.user.email}
            isFirst
            leading={<MemberAvatar member={session.user} sizePt={56} />}
            accessory="chevron"
            onPress={() => router.push("/settings/account")}
          />
        </GroupedSection>
      )}
      {family ? (
        <GroupedSection title="Family">
          <GroupedRow
            label={family.name}
            detail={family.memberCount === 1 ? "Just you" : `${family.memberCount} members`}
            isFirst
            accessory="chevron"
            onPress={() => router.push("/settings/family")}
          />
        </GroupedSection>
      ) : (
        <GroupedSection
          title="Family"
          footer="Share recipes, folders and tags with the people you cook with. You can be in one family at a time."
        >
          <GroupedRow
            label="Create a family"
            tone="accent"
            isFirst
            onPress={() => router.push("/family/new")}
          />
          <GroupedRow
            label="Join with a code"
            tone="accent"
            onPress={() => router.push("/family/join")}
          />
        </GroupedSection>
      )}
      <GroupedSection title="Preferences">
        <GroupedRow label="Units" isFirst>
          <UnitsPicker />
        </GroupedRow>
      </GroupedSection>
      <GroupedSection title="About">
        <GroupedRow
          label="Support"
          isFirst
          accessory="external"
          onPress={() => {
            setIsMailMissing(false);
            Linking.openURL(`mailto:${operator.contactEmail}`).catch(() => setIsMailMissing(true));
          }}
        />
        <GroupedRow
          label="Privacy"
          accessory="external"
          onPress={() => void WebBrowser.openBrowserAsync(`${websiteUrl}/privacy`)}
        />
        <GroupedRow
          label="Terms"
          accessory="external"
          onPress={() => void WebBrowser.openBrowserAsync(`${websiteUrl}/terms`)}
        />
        <GroupedRow label="Version">
          <Text className="text-title text-muted">{Constants.expoConfig?.version}</Text>
        </GroupedRow>
      </GroupedSection>
      {isMailMissing && (
        <View className="items-start px-8 pt-3">
          <InlineError>{`No mail app is set up. Write to us at ${operator.contactEmail}`}</InlineError>
        </View>
      )}
    </ScrollView>
  );
}
