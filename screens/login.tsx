import React, {useState, useRef, useContext} from 'react';
import validator from 'email-validator';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform, 
         View, 
         Text
} from 'react-native';
import { Button, TextInput, ActivityIndicator, Colors } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType} from '../lib/types';

export default function LoginScreen({ navigation }: { navigation: any}) {
  const userContext: UserContextType = useContext(UserContext);
  const initialState = {
      email: '',
      password: ''
  };
  const [user, setUser] = useState(initialState);
  const [emailerr, setEmailErr] = useState('');
  const emailEl = useRef(null);
  const [passwderr, setPassWdErr] = useState('');
  const passwdEl = useRef(null);
  const [inPost, setInPost] = useState(false);

  function changeEmail(text: string){
    const value = text.trim().replace(/<\/?[^>]*>/g, "");
    setUser(prevState => ({ ...prevState, email: value }));
  } 
  
  function changePasswd(text: string){
    const value = text.trim().replace(/<\/?[^>]*>/g, "");
    setUser(prevState => ({ ...prevState, password: value }));
  }
  
  function resetErrMsg(){
    setEmailErr('');
    setPassWdErr('');
  }

  async function submitForm(){
    //Reset all the err messages
    resetErrMsg();
    //Check if Email is filled
    if (!user.email){
       setEmailErr("Please type your email, this field is required!");
       (emailEl.current as any).focus();
       return;
    }
    //Validate the email
    if (!validator.validate(user.email)){
        setEmailErr("This email is not a legal email.");
        (emailEl.current as any).focus();
        return;
    }
    //Check if Passwd is filled
    if (!user.password){
        setPassWdErr("Please type your password, this field is required!");
        (passwdEl.current as any).focus();
        return;
    }

    setInPost(true);
    const {data} = await axios.post(`${DOMAIN_URL}/api/login`, user);
    setInPost(false);

    if (data.no_account){
        setEmailErr("Sorry, we can't find this account.");
        (emailEl.current as any).focus();
        return;
    }
    if (data.password_error){
        setPassWdErr("Password error");
        (passwdEl.current as any).focus();
        return;
    }
    const {token, ...others} = data;

    const userData = {...others, logintime: Math.round(new Date().getTime() / 1000)};
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await SecureStore.setItemAsync('token', token);
    userContext.login(userData);
    setUser(initialState);
  }

  function resetForm(){
    setUser(initialState);
    resetErrMsg();
  }
  
  return (userContext &&
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView  
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}>
          <View style={styles.mainContainer}>
             <View style={styles.itemCenter}>
                <Text style={styles.titleText}>Please Login</Text>
             </View>
             <TextInput
               mode='outlined'
               label="Email"
               placeholder="Email"
               value={user.email}
               onChangeText={text => changeEmail(text)}
               autoCapitalize="none"
               autoComplete="email"
               keyboardType="email-address"
               ref={emailEl}
              />
             <Text style={{color: 'red'}}>{emailerr}</Text> 
             <TextInput
               mode='outlined'
               label='Password'
               placeholder='Password'
               secureTextEntry={true}
               value={user.password}
               onChangeText={text => changePasswd(text)}
               ref={passwdEl}
              />
             <Text style={{color: 'red'}}>{passwderr}</Text> 
             <View style={styles.itemCenter}>
                <Button mode="text" uppercase={false} onPress={() => navigation.navigate('ForgotPasswd', {userEmail: user.email})}>
                   Forgot Password?
                 </Button>
              </View>
              <View style={[styles.itemLeft, {marginTop: 15}]}>
                 <Button mode="contained" style={{marginRight: 20}} onPress={() => submitForm()}>
                   Log In
                 </Button>
                 <Button mode="contained" style={{marginRight: 20}} onPress={() => resetForm()}>
                   Reset
                 </Button>
                 <Button mode="outlined" style={{marginRight: 20}} onPress={() => navigation.navigate('UserJoin')}>
                   Sign Up
                 </Button>
              </View>
          </View>
      </KeyboardAvoidingView>
      {inPost &&
        <View style={styles.loading}>
          <ActivityIndicator size="large" animating={true} color={Colors.white} />
        </View>
      }
    </SafeAreaView>
  );
 
}
