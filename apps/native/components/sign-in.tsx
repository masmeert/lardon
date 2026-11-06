import { Button, haptics, Surface, Text, TextField } from "@lardon/ui";
import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import * as Linking from "expo-linking";
import { useRef, useState, type ComponentRef } from "react";
import { type TextInput, View } from "react-native";

import { authClient } from "@/lib/auth-client";
import { Email, Password } from "@/lib/credentials";

const signInSchema = Schema.toStandardSchemaV1(Schema.Struct({ email: Email, password: Password }));

export function SignIn() {
  const passwordInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setAuthError(null);

      await authClient.signIn.email(
        {
          email: value.email.trim(),
          password: value.password,
          callbackURL: Linking.createURL("/"),
        },
        {
          onError(error) {
            haptics.failed();
            setAuthError(
              error.error?.code === "EMAIL_NOT_VERIFIED"
                ? "Confirm your email address first. We just sent you a new link."
                : error.error?.message ||
                    "We couldn't sign you in. Check your email and password and try again.",
            );
          },
          onSuccess() {
            formApi.reset();
          },
        },
      );
    },
  });

  return (
    <Surface className="gap-4 rounded-card p-5">
      <Text variant="title">Sign in</Text>

      <form.Field name="email">
        {(field) => (
          <TextField
            label="Email"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={field.state.meta.errors[0]?.message}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => {
              passwordInputRef.current?.focus();
            }}
          />
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <TextField
            ref={passwordInputRef}
            label="Password"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={field.state.meta.errors[0]?.message}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void form.handleSubmit()}
          />
        )}
      </form.Field>

      <View className="gap-3">
        {authError ? (
          <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
            {authError}
          </Text>
        ) : null}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button
              label="Sign in"
              loading={isSubmitting}
              onPress={() => void form.handleSubmit()}
            />
          )}
        </form.Subscribe>
      </View>
    </Surface>
  );
}
