import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import { HomeScreen, ConversationScreen } from '@/screens/conversation';
import { ProgressScreen } from '@/screens/progress';
import { SubscriptionScreen } from '@/screens/paywall';
import { ExerciseScreen } from '@/screens/exercises/ExerciseScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Conversation: undefined;
  Subscription: undefined;
  Exercise: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Progress: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5E5',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#58CC02',
        tabBarInactiveTintColor: '#AFAFAF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
          tabBarLabel: 'Learn',
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>📊</Text>
          ),
          tabBarLabel: 'Progress',
        }}
      />
    </Tab.Navigator>
  );
};

export const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E5E5',
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: '700',
            color: '#3C3C3C',
          },
          headerTintColor: '#58CC02',
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Conversation" 
          component={ConversationScreen}
          options={{
            title: 'Practice Speaking',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="Subscription" 
          component={SubscriptionScreen}
          options={{
            title: 'Premium',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="Exercise" 
          component={ExerciseScreen}
          options={{
            title: 'Exercise Test',
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
