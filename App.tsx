import * as React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserContext } from './components/Context';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './AppNavigator';
import {UserContextType, User} from './lib/types';
import { DOMAIN_URL } from './lib/constants';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState<User>({});

  const login = (user?: User) => {
    if (user){
      setUserData(user);
      if (user.id){
        setLoggedIn(true);
      }
    }
  };
 
  const logout = () => {
    setLoggedIn(false);
    setUserData({});
  };
  
  const userContext: UserContextType = {
    isLoggedIn: loggedIn, 
    user: userData, 
    login: login, 
    logout: logout
  };


  useEffect(() => {
    async function fetchUserData() {
      const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
      const { data } = await axios.get(`${DOMAIN_URL}/api/getselfdetail`, { headers: headers });
      const {token, ...others} = data;
      const userData = {...others, logintime: Math.round(new Date().getTime() / 1000)};
      setUserData(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await SecureStore.setItemAsync('token', token);
    }
    
    async function fetchData(){
       const user = await AsyncStorage.getItem('user');
       const userData = user ? JSON.parse(user): {};
       setUserData(userData);
       if (userData.id){
          setLoggedIn(true);
 
          const logintime = userData.logintime || 0;
          const currTime = Math.round(new Date().getTime() / 1000);
          if (currTime > (logintime + 60 * 60 * 24 * 10)){
             fetchUserData();
          }
       }
     }
     fetchData();
  },[]);
  
  return (
    <UserContext.Provider value={userContext}>
       <AppNavigator />
    </UserContext.Provider>
  );
}

/*
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
*/
