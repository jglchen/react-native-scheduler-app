import * as React from 'react';
import { useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';
import { UserContext } from './components/Context';
import LoginScreen from './screens/login';
import UserJoin from './screens/useradd';
import ForgotPasswd from './screens/forgotpasswd';
import SchedulerScreen from './screens/scheduler';
import AddSchedule from './screens/scheduleadd';
import UserInfo from './screens/userinfo';
import LogoutScreen from './screens/logout';
import ActivityDetail from './screens/activitydetail';
import {UserContextType} from './lib/types';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function LoginedStack() {
  return (
    <Tab.Navigator  
      initialRouteName="Scheduler"
      screenOptions={{
        tabBarInactiveTintColor: 'gray',
      }}>
      <Tab.Screen
        name="Scheduler"
        component={SchedulerScreen}
        options={{ headerTitle: 'Appointment Scheduler',
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused ? 'calendar' : 'calendar-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      }} />
      <Tab.Screen
        name="Add"
        component={AddSchedule}
        options={{ headerTitle: 'Add Activity',
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused ? 'ios-add-circle' : 'ios-add-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      }} />
      <Tab.Screen
        name="Personal"
        component={UserInfo}
        options={{ headerTitle: 'Update My Personal Data',
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused ? 'information-circle' : 'information-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      }} />
      <Tab.Screen 
        name="Logout" 
        component={LogoutScreen} 
        options={{ headerTitle: 'Logout', tabBarLabel: 'Logout',
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused ? 'log-out' : 'log-out-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const userContext: UserContextType = useContext(UserContext);
  
  return (userContext &&
    <NavigationContainer>
      <Stack.Navigator>
      {!userContext.isLoggedIn &&
        <Stack.Group>
          <Stack.Screen 
             name="Login" 
             component={LoginScreen} 
             options={{ title: 'Appointment Scheduler' }}
             />
          <Stack.Screen 
             name="UserJoin" 
             component={UserJoin} 
             options={{ title: 'Appointment Scheduler' }}
             />
          <Stack.Screen 
             name="ForgotPasswd" 
             component={ForgotPasswd} 
             options={{ title: 'Appointment Scheduler' }}
             />
        </Stack.Group> 
      }
      {userContext.isLoggedIn &&
        <>
        <Stack.Group>
          <Stack.Screen
            name="LoginedStack"
            component={LoginedStack}
            options={{ headerShown: false, title: 'Scheduler' }}
          />
        </Stack.Group> 
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen name="ActivityDetail" component={ActivityDetail} />
        </Stack.Group>
        </> 
      }
      </Stack.Navigator>
    </NavigationContainer>
  );
}
