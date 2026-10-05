/** Root navigation — bottom tabs + full-screen stack. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import type { RootParamList, TabParamList } from './types';

import { HomeScreen } from '../screens/HomeScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import {
  MyOrdersScreen,
  OrderSuccessScreen,
  TrackOrderScreen,
} from '../screens/OrderScreens';
import { AuthScreen } from '../screens/AuthScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { DoctorsScreen } from '../screens/DoctorsScreen';
import {
  BookConsultScreen,
  DoctorDetailScreen,
} from '../screens/DoctorScreens';
import {
  ConsultDetailScreen,
  MyConsultationsScreen,
} from '../screens/ConsultScreens';
import { CallRoomScreen } from '../screens/CallRoomScreen';
import { IncomingCallScreen } from '../screens/IncomingCallScreen';
import { flushPendingNavigation, navigationRef } from '../lib/navigation';
import { LabBookScreen, LabScreen } from '../screens/LabScreens';
import {
  PrescriptionRequestScreen,
  PrescriptionViewScreen,
} from '../screens/PrescriptionScreens';
import {
  NotificationsScreen,
  WishlistScreen,
} from '../screens/WishlistNotifyScreens';
import {
  InfoScreen,
  RefundRequestScreen,
  SupportScreen,
} from '../screens/MiscScreens';
import { useCart } from '../store/cart';
import { AppIcon } from '../components/AppIcon';
import { FluidTabBar } from '../components/FluidTabBar';

const Stack = createNativeStackNavigator<RootParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.forest,
    background: colors.ivory,
    card: colors.surface,
    border: colors.line,
  },
};

const stackOptions = {
  headerTintColor: colors.ink,
  headerStyle: { backgroundColor: colors.ivory },
  headerShadowVisible: false,
  headerBackTitle: 'Back',
  headerTitleAlign: 'center' as const,
  headerTitleStyle: {
    fontWeight: '800' as const,
    fontSize: 17,
    color: colors.ink,
  },
  contentStyle: { backgroundColor: colors.ivory },
  animation: 'slide_from_right' as const,
};

function CartTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const count = useCart(s => s.count());
  return (
    <View>
      <AppIcon name="cart" color={color} filled={focused} />
      {count > 0 ? (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={props => <FluidTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name="home" color={color} filled={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Doctors"
        component={DoctorsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name="doctor" color={color} filled={focused} />
          ),
          title: 'Doctors',
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <CartTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name="account" color={color} filled={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  cartBadge: {
    position: 'absolute',
    right: -9,
    top: -5,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 3,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  cartBadgeText: { fontSize: 9.5, fontWeight: '800', color: colors.forestDeep },
});

export function RootNavigator() {
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={flushPendingNavigation}
    >
      <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen
          name="Tabs"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Categories"
          component={CategoriesScreen}
          options={{ title: 'Categories' }}
        />
        <Stack.Screen
          name="Products"
          component={ProductsScreen}
          options={({ route }) => ({
            title: route.params?.title ?? 'Products',
          })}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'Search' }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ title: 'Checkout' }}
        />
        <Stack.Screen
          name="OrderSuccess"
          component={OrderSuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TrackOrder"
          component={TrackOrderScreen}
          options={{ title: 'Track order' }}
        />
        <Stack.Screen
          name="MyOrders"
          component={MyOrdersScreen}
          options={{ title: 'My orders' }}
        />
        <Stack.Screen
          name="Wishlist"
          component={WishlistScreen}
          options={{ title: 'Wishlist' }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ title: 'Product alerts' }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ title: 'Sign in' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
        <Stack.Screen
          name="DoctorDetail"
          component={DoctorDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BookConsult"
          component={BookConsultScreen}
          options={{ title: 'Book consult' }}
        />
        <Stack.Screen
          name="MyConsultations"
          component={MyConsultationsScreen}
          options={{ title: 'My consultations' }}
        />
        <Stack.Screen
          name="ConsultDetail"
          component={ConsultDetailScreen}
          options={{ title: 'Consultation' }}
        />
        <Stack.Screen
          name="CallRoom"
          component={CallRoomScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="IncomingCall"
          component={IncomingCallScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Lab"
          component={LabScreen}
          options={{ title: 'Lab tests' }}
        />
        <Stack.Screen
          name="LabBook"
          component={LabBookScreen}
          options={{ title: 'Book lab test' }}
        />
        <Stack.Screen
          name="PrescriptionRequest"
          component={PrescriptionRequestScreen}
          options={{ title: 'Prescription' }}
        />
        <Stack.Screen
          name="PrescriptionView"
          component={PrescriptionViewScreen}
          options={{ title: 'Prescription' }}
        />
        <Stack.Screen
          name="RefundRequest"
          component={RefundRequestScreen}
          options={{ title: 'Refund' }}
        />
        <Stack.Screen
          name="Support"
          component={SupportScreen}
          options={{ title: 'Support' }}
        />
        <Stack.Screen
          name="Info"
          component={InfoScreen}
          options={({ route }) => ({ title: route.params.topic })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
