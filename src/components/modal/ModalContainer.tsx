import React, { useLayoutEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';

export default function ModalContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
      statusBarStyle: 'light',
    });
  }, [navigation]);

  return (
    <View style={[styles.modalContainer, { paddingTop: top }]}>
      <Pressable style={styles.backdrop} onPress={() => navigation.goBack()} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
});
