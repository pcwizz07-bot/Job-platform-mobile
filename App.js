import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, Text, ActivityIndicator } from 'react-native';
import { api } from './src/services/api';
import { setupNotificationChannel, setupNotificationListener } from './src/services/notifications';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';
import ReportFaultScreen from './src/screens/ReportFaultScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#1a1d27' },
      headerTintColor: '#e4e6f0',
      headerTitleStyle: { fontWeight: '600' },
    }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job' }} />
      <Stack.Screen name="ReportFault" component={ReportFaultScreen} options={{ title: 'Report Fault' }} />
    </Stack.Navigator>
  );
}

function HomeTabs({ user }) {
  return (
    <Tab.Navigator screenOptions={{
      tabBarStyle: { backgroundColor: '#1a1d27', borderTopColor: '#2d3140' },
      tabBarActiveTintColor: '#6366f1',
      tabBarInactiveTintColor: '#8b8fa3',
      headerShown: false,
    }}>
      <Tab.Screen name="Home" options={{ tabBarLabel: 'Dashboard', tabBarIcon: ({ color }) => (
        <Text style={{ fontSize: 20, color }}>📊</Text>
      )}}>
        {() => <DashboardStack />}
      </Tab.Screen>
      <Tab.Screen name="JobsTab" options={{ tabBarLabel: 'Jobs', tabBarIcon: ({ color }) => (
        <Text style={{ fontSize: 20, color }}>📋</Text>
      )}}>
        {() => <DashboardStack />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupNotificationChannel();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedUser = await api.getSavedUser();
      if (savedUser) setUser(savedUser);
    } catch (e) {}
    setLoading(false);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await api.clearAuth();
    setUser(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1117" />
        <Text style={{ fontSize: 32, marginBottom: 16 }}>⚡</Text>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0f1117" />
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main">
            {() => <HomeTabs user={user} />}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={handleLogin} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}