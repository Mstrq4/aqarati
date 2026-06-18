// Aqarati Mobile — Navigation
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import type { BottomTabParamList, RootStackParamList } from '../types';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import AddPropertyScreen from '../screens/AddPropertyScreen';
import RemindersScreen from '../screens/RemindersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import ContactsScreen from '../screens/ContactsScreen';
import OfficeScreen from '../screens/OfficeScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SplashScreen from '../screens/SplashScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Tab Bar Icon (simple text-based since no icon lib loaded yet) ───
function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    home: '🏠',
    explore: '🔍',
    add: '➕',
    reminders: '🔔',
    account: '👤',
  };
  return (
    <Text style={{ fontSize: focused ? 24 : 20, color }}>
      {icons[name] || '•'}
    </Text>
  );
}

function MainTabs() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'Tajawal',
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t('common.app_name'),
          tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={SearchScreen}
        options={{
          tabBarLabel: t('search.filters'),
          tabBarIcon: ({ focused, color }) => <TabIcon name="explore" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="AddTab"
        component={AddPropertyScreen}
        options={{
          tabBarLabel: t('common.add'),
          tabBarIcon: ({ focused, color }) => <TabIcon name="add" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="RemindersTab"
        component={RemindersScreen}
        options={{
          tabBarLabel: t('reminders.reminders'),
          tabBarIcon: ({ focused, color }) => <TabIcon name="reminders" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="AccountTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('office.office'),
          tabBarIcon: ({ focused, color }) => <TabIcon name="account" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
        <Stack.Screen name="AddProperty" component={AddPropertyScreen} />
        <Stack.Screen name="Contacts" component={ContactsScreen} />
        <Stack.Screen name="Office" component={OfficeScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
