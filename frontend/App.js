import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from './screens/DashboardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator color="#2a9d8f" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Dashboard: focused ? 'home' : 'home-outline',
              Transactions: focused ? 'list' : 'list-outline',
              Add: focused ? 'add-circle' : 'add-circle-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2dd4bf',
          tabBarInactiveTintColor: '#475569',
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopWidth: 0,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          headerStyle: { backgroundColor: '#ffffff', elevation: 0, shadowOpacity: 0 },
          headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#0f172a' },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Transactions" component={TransactionsScreen} />
        <Tab.Screen
          name="Add"
          component={AddTransactionScreen}
          options={{ title: 'Add Transaction', tabBarLabel: 'Add' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
