/** Floating bottom tab bar — a forest pill glides to whichever tab is active. */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, gradients, radii, shadows } from '../theme';
import { Gradient } from './ui';

const INSET = 6;

/**
 * Height the floating bar occupies above the safe-area bottom. Tab screens
 * pad their scroll content / lift pinned footers by `tabBarSpace(insets)`.
 */
export const TAB_BAR_HEIGHT = 84;
export const tabBarSpace = (insets: { bottom: number }) =>
  TAB_BAR_HEIGHT + Math.max(insets.bottom, 12);

export function FluidTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = (barWidth - INSET * 2) / state.routes.length;

  const indicator = useRef(new Animated.Value(0)).current;
  const bounceRef = useRef(
    state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0)),
  );
  const bounce = bounceRef.current;

  useEffect(() => {
    Animated.spring(indicator, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
    bounce.forEach((v, i) => {
      Animated.spring(v, {
        toValue: i === state.index ? 1 : 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 10,
      }).start();
    });
  }, [state.index, barWidth, tabWidth, indicator, bounce]);

  function onLayout(e: LayoutChangeEvent) {
    setBarWidth(e.nativeEvent.layout.width);
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.bar} onLayout={onLayout}>
        {barWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              { width: tabWidth, transform: [{ translateX: indicator }] },
            ]}
          >
            <Gradient from={gradients.forestSoft[0]} to={gradients.forest[1]} />
          </Animated.View>
        ) : null}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? colors.white : colors.inkMuted;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const scale = bounce[index].interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.08],
          });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
            >
              <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
                {options.tabBarIcon?.({ focused, color, size: 22 })}
              </Animated.View>
              <Text
                numberOfLines={1}
                style={[styles.label, { color }, focused && styles.labelActive]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: INSET,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.float,
  },
  pill: {
    position: 'absolute',
    top: INSET,
    bottom: INSET,
    left: INSET,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  iconWrap: { height: 24, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600' },
  labelActive: { fontWeight: '800' },
});
