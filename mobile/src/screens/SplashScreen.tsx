// Aqarati Mobile — Splash Screen
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { spacing } from '../theme';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onFinish, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.emoji]}>🏠</Text>
        <Text style={[styles.appName, { color: theme.accent }]}>
          {t('common.app_name')}
        </Text>
        <Text style={[styles.tagline, { color: theme.textSecondary }]}>
          {t('common.tagline')}
        </Text>
        <View style={[styles.divider, { backgroundColor: theme.accent }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    fontFamily: 'Tajawal',
    marginBottom: spacing.sm,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Tajawal',
    marginBottom: spacing.xl,
    opacity: 0.7,
  },
  divider: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },
});
