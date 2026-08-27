/** Root navigation — bottom tabs + full-screen stack. */
import React from 'react';
import { Text } from 'react-native';
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
  headerTintColor: colors.white,
  headerStyle: { backgroundColor: colors.forestDeep },
  headerTitleStyle: { fontWeight: '700' as const },
};

function CartTabIcon() {
  const count = useCart(s => s.count());
  return <Text style={{ fontSize: 20 }}>{count > 0 ? '🛒' : '🛍'}</Text>;
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Doctors"
        component={DoctorsScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🩺</Text>,
          title: 'Doctors',
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ tabBarIcon: () => <CartTabIcon /> }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
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
          options={{ title: 'Product' }}
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
          options={{ title: 'Doctor' }}
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
