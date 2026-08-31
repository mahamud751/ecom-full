/** Floating bottom tab bar — one badge glides fluidly to whichever tab is active. */
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
import { colors, radii, shadows } from '../theme';

const BADGE_SIZE = 34;

export function FluidTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth / state.routes.length;

  const indicator = useRef(new Animated.Value(0)).current;
  const bounceRef = useRef(
    state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0)),
  );
  const bounce = bounceRef.current;

  useEffect(() => {
    Animated.spring(indicator, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      speed: 14,
      bounciness: 9,
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
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar} onLayout={onLayout}>
        {barWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.badge,
              {
                left: (tabWidth - BADGE_SIZE) / 2,
                transform: [{ translateX: indicator }],
              },
            ]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? colors.forest : colors.inkMuted;
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

          const scale = bounce[index].interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
            >
              <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
                {options.tabBarIcon?.({ focused, color, size: 21 })}
              </Animated.View>
              <Text numberOfLines={1} style={[styles.label, { color }]}>
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
    backgroundColor: colors.ivory,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: 10,
    ...shadows.card,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconWrap: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 8,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.brandLight,
  },
  label: { fontSize: 11, fontWeight: '700' },
});
