import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Text } from '../../components/common/Text';
import { RESET_PASSWORD_URL } from '../../config';
import {
  createAccount,
  signInWithEmail,
} from '../../services/accountController';
import { colors, layout, spacing } from '../../theme';

type Mode = 'signIn' | 'signUp';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAccountForm(
  mode: Mode,
  values: { name: string; email: string; password: string },
): string | null {
  if (mode === 'signUp' && values.name.trim() === '') {
    return 'Enter your name.';
  }
  if (!EMAIL.test(values.email.trim())) {
    return 'Enter a valid email address.';
  }
  if (values.password.length < 8) {
    return 'Passwords are at least 8 characters.';
  }
  return null;
}

export default function AccountScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const problem = validateAccountForm(mode, { name, email, password });
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signUp') {
        await createAccount(name.trim(), email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      navigation.goBack();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Something went wrong.',
      );
    } finally {
      setBusy(false);
    }
  };

  const isSignUp = mode === 'signUp';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text tone="muted">
          {isSignUp
            ? 'Create an account to back up your garage and use it on the Garage Forge website.'
            : 'Sign in to back up your garage and use it on the Garage Forge website.'}
        </Text>

        {isSignUp ? (
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            textContentType="name"
            testID="account-name"
          />
        ) : null}
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          testID="account-email"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          textContentType={isSignUp ? 'newPassword' : 'password'}
          testID="account-password"
        />

        {isSignUp ? null : (
          <View style={styles.forgotRow}>
            <Button
              label="Forgot password?"
              variant="ghost"
              size="sm"
              disabled={busy}
              onPress={() => Linking.openURL(RESET_PASSWORD_URL)}
              testID="account-forgot"
            />
          </View>
        )}

        {error ? (
          <Text tone="danger" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <Button
          label={isSignUp ? 'Create account' : 'Sign in'}
          onPress={submit}
          loading={busy}
          testID="account-submit"
        />

        <View style={styles.switchRow}>
          <Button
            label={
              isSignUp ? 'I already have an account' : 'Create a new account'
            }
            variant="ghost"
            disabled={busy}
            onPress={() => {
              setMode(isSignUp ? 'signIn' : 'signUp');
              setError(null);
            }}
          />
        </View>

        <Text size="sm" tone="dim">
          Your current garage is uploaded to the account when you sign in.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  switchRow: {
    alignItems: 'center',
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.sm,
  },
});
