import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator color="#2dd4bf" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
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
            tabBarInactiveTintColor: '#4b5563',
            tabBarStyle: {
              backgroundColor: '#0a0a0a',
              borderTopWidth: 0,
              borderTopColor: 'transparent',
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            headerStyle: { backgroundColor: '#000000', elevation: 0, shadowOpacity: 0 },
            headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#ffffff' },
            headerTintColor: '#ffffff',
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
    </SafeAreaProvider>
  );
}
