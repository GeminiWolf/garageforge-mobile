import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout } from '../../theme';

type Props = {
  children?: ReactNode;
  scroll?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

const KEYBOARD_BEHAVIOR = Platform.OS === 'ios' ? 'padding' : undefined;
const KEYBOARD_DISMISS_MODE = Platform.OS === 'ios' ? 'interactive' : 'on-drag';

export function Screen({
  children,
  scroll,
  loading,
  style,
  contentStyle,
}: Props) {
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, style]} edges={['left', 'right']}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]} edges={['left', 'right']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={KEYBOARD_DISMISS_MODE}
          automaticallyAdjustKeyboardInsets
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={KEYBOARD_BEHAVIOR}
        enabled={Platform.OS === 'ios'}
      >
        <View style={[styles.content, contentStyle]}>{children}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: layout.gutter,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
