import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Doctors: undefined;
  Cart: undefined;
  Account: undefined;
};

export type RootParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Categories: { hub?: string } | undefined;
  Products:
    | { category?: string; hub?: string; title?: string; section?: string }
    | undefined;
  ProductDetail: { slug: string };
  Search: { mode?: string } | undefined;
  Checkout: undefined;
  OrderSuccess: { orderId?: string; orderNumber?: string };
  TrackOrder: undefined;
  MyOrders: undefined;
  Wishlist: undefined;
  Notifications: undefined;
  Auth: { mode?: 'login' | 'register' } | undefined;
  Profile: undefined;
  DoctorDetail: { slug: string };
  BookConsult: { doctorId: string; doctorName: string; slug?: string };
  MyConsultations: undefined;
  ConsultDetail: { id: string };
  CallRoom: {
    consultationId: string;
    channel: string;
    mode: 'VIDEO' | 'AUDIO';
  };
  Lab: undefined;
  LabBook: { testId?: string; packageId?: string; name: string };
  PrescriptionRequest: undefined;
  PrescriptionView: { id: string };
  RefundRequest: undefined;
  Support: undefined;
  Info: { topic: 'contact' | 'terms' | 'privacy' | 'compliance' };
};

export type RootScreenProps<T extends keyof RootParamList> =
  NativeStackScreenProps<RootParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootParamList>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootParamList {}
  }
}
