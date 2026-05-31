import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from './screens/DashboardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';

const Tab = createBottomTabNavigator();

export default function App() {
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
          headerStyle: { backgroundColor: '#ffffff', elevation: 0, shadowOpacity: 0 },
          headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#0f172a' },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Transactions" component={TransactionsScreen} />
        <Tab.Screen name="Add" component={AddTransactionScreen} options={{ title: 'Add Transaction' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
