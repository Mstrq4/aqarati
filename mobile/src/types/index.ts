// Aqarati Mobile — Re-export shared types and add mobile-specific ones
export type {
  User,
  UserProfile,
  Organization,
  OrganizationMember,
  OrgRole,
  Property,
  PropertyLocation,
  PropertyDetails,
  PropertyPrice,
  PropertyMedia,
  PropertyVisibility,
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
  Contact,
  ContactRole,
  PropertyContact,
  Tag,
  Favorite,
  Note,
  Reminder,
  ReminderType,
  SavedSearch,
  SearchFilters,
  ShareTemplate,
  ShareEvent,
  Plan,
  PlanTier,
  Subscription,
  SubscriptionStatus,
  Payment,
  Report,
  Rating,
  PaginatedResponse,
  ApiResponse,
} from '../../shared/types';

export type BottomTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  AddTab: undefined;
  RemindersTab: undefined;
  AccountTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  PropertyDetail: { propertyId: string };
  AddProperty: { propertyId?: string };
  Search: undefined;
  Contacts: undefined;
  Office: undefined;
  Subscription: undefined;
  Settings: undefined;
  ReportProperty: { propertyId: string };
  ReportUser: { userId: string };
  Rating: { propertyId: string };
};

export type ThemeMode = 'dark' | 'light';
export type Language = 'ar' | 'en';
