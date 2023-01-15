import * as React from 'react';
import { useCallback, useContext } from 'react';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserContext} from '../components/Context';
import {UserContextType} from '../lib/types';

export default function LogoutScreen({ navigation }) {
  const userContext: UserContextType = useContext(UserContext);

  useFocusEffect(
    useCallback(() => {
      if (userContext){
          removeData();
      }
    }, [navigation, userContext])
  );
 
  async function removeData() {
    navigation.dispatch(state => {
      // Remove all the routes except for Logout from the stack
      const routes = state.routes.filter(r => r.name === 'Logout');
    
      return CommonActions.reset({
        ...state,
        routes,
        index: routes.length - 1,
      });
    });  
    
    await AsyncStorage.removeItem('user');
    await SecureStore.deleteItemAsync('token');
    userContext.logout();
  }

  return (userContext &&
    <View style={[styles.container,{padding: 10}]}>
        <Button mode="contained" onPress={() => {removeData();}}>
          Log Out
        </Button>
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


