import { Button, haptics, Icon, Surface, Text, TextField } from "@lardon/ui";
import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import * as Linking from "expo-linking";
import { useRef, useState, type ComponentRef } from "react";
import { type TextInput, View } from "react-native";

import { authClient } from "@/lib/auth-client";
import { Email, Name, Password } from "@/lib/credentials";

const signUpSchema = Schema.toStandardSchemaV1(
  Schema.Struct({ name: Name, email: Email, password: Password }),
);

export function SignUp() {
  const emailInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      setAuthError(null);

      await authClient.signUp.email(
        {
          name: value.name.trim(),
          email: value.email.trim(),
          password: value.password,
          callbackURL: Linking.createURL("/"),
        },
        {
          onError(error) {
            haptics.failed();
            setAuthError(
              error.error?.message ||
                "We couldn't create your account. Check your details and try again.",
            );
          },
          onSuccess() {
            haptics.succeeded();
            setConfirmationEmail(value.email.trim());
            formApi.reset();
          },
        },
      );
    },
  });

  if (confirmationEmail) {
    return (
      <Surface className="gap-3 rounded-card p-5">
        <Icon name="envelope.badge" tone="success" size={28} />
        <Text variant="title">Check your inbox</Text>
        <Text tone="muted">
          We sent a confirmation link to {confirmationEmail}. Open it on this phone to finish
          creating your account.
        </Text>
        <Button
          label="Use a different email"
          variant="plain"
          size="compact"
          className="self-start"
          onPress={() => setConfirmationEmail(null)}
        />
      </Surface>
    );
  }

  return (
    <Surface className="gap-4 rounded-card p-5">
      <Text variant="title">Create account</Text>

      <form.Field name="name">
        {(field) => (
          <TextField
            label="Name"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={field.state.meta.errors[0]?.message}
            placeholder="Léa Martin"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => {
              emailInputRef.current?.focus();
            }}
          />
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <TextField
            ref={emailInputRef}
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
            placeholder="At least 8 characters"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
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
              label="Create account"
              loading={isSubmitting}
              onPress={() => void form.handleSubmit()}
            />
          )}
        </form.Subscribe>
      </View>
    </Surface>
  );
}
