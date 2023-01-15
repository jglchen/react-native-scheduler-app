import React, {useState, useRef, useContext} from 'react';
import validator from 'email-validator';
import passwordValidator from 'password-validator';
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

export default function UserJoin({ navigation }) {
  const userContext: UserContextType = useContext(UserContext);
  const initialState = {
       name: '',
       email: '',
       password: '',
  }
  const [user, setUser] = useState(initialState);
  const [password2, setPassWd2] = useState('');
  const [nameerr, setNameErr] = useState('');
  const nameEl = useRef(null);
  const [emailerr, setEmailErr] = useState('');
  const emailEl = useRef(null);
  const [passwderr, setPassWdErr] = useState('');
  const passwdEl = useRef(null);
  const passwd2El = useRef(null);
  const [inPost, setInPost] = useState(false);

  function changeName(text: string){
    const value = text.replace(/<\/?[^>]*>/g, "");
    setUser(prevState => ({ ...prevState, name: value }));
  } 

  function changeEmail(text: string){
    const value = text.trim().replace(/<\/?[^>]*>/g, "");
    setUser(prevState => ({ ...prevState, email: value }));
  } 
  
  function changePasswd(text: string){
    const value = text.trim().replace(/<\/?[^>]*>/g, "");
    setUser(prevState => ({ ...prevState, password: value }));
  }

  function changePasswd2(text: string){
    const value = text.trim().replace(/<\/?[^>]*>/g, "");
    setPassWd2(value);
  }

  function resetErrMsg(){
    setNameErr('');
    setEmailErr('');
    setPassWdErr('');
  }

  async function submitForm(){
    //Reset all the err messages
    resetErrMsg();	  
    //Check if Name is filled
    if (!user.name.trim()){
      setUser(prevState => ({ ...prevState, name: user.name.trim() })) 
      setNameErr("Please type your name, this field is required!");
      nameEl.current.focus();
      return;
    }
    //Check if Email is filled
    if (!user.email){
      setEmailErr("Please type your email, this field is required!");
      emailEl.current.focus();
      return;
    }
    //Validate the email
    if (!validator.validate(user.email)){
      setEmailErr("This email is not validated OK, please enter a legal email.");
      emailEl.current.focus();
      return;
    }
    //Check if Passwd is filled
    if (!user.password || !password2){
      setPassWdErr("Please type your password, this field is required!");
      if (!user.password){
        passwdEl.current.focus();
      }else{
        passwd2El.current.focus();
      }
      return;
    }
    //Check the passwords typed in the two fields are matched
    if (user.password != password2){
      setPassWdErr("Please retype your passwords, the passwords you typed in the two fields are not matched!");
      passwdEl.current.focus();
      return;
    }
 
    //Check the validity of password
    let schema = new passwordValidator();
    schema
    .is().min(8)                                    // Minimum length 8
    .is().max(100)                                  // Maximum length 100
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits(2)                                // Must have at least 2 digits
    .has().not().spaces();                          // Should not have spaces
    if (!schema.validate(user.password)){
      setPassWdErr("The password you typed is not enough secured, please retype a new one. The password must have both uppercase and lowercase letters as well as minimum 2 digits.");
      passwdEl.current.focus();
      return;
    }

    setInPost(true);
    const {data} = await axios.post(`${DOMAIN_URL}/api/adduser`, {...user, name: user.name.trim()});
    setInPost(false);
    if (data.duplicate_email){
       setEmailErr("This email has been registered as a user, please use a different email to sign up.");
       emailEl.current.focus();
       return;
    }
    const {token, ...others} = data;
    const userData = {...others, logintime: Math.round(new Date().getTime() / 1000)};
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await SecureStore.setItemAsync('token', token);
    userContext.login(userData);
    setUser(initialState);
    setPassWd2('');
  }

  function resetForm(){
    setUser(initialState);
    resetErrMsg();
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView  
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}>
          <View style={styles.mainContainer}>
             <View style={styles.itemCenter}>
                <Text style={styles.titleText}>Please Register</Text>
             </View>
             <TextInput
               mode='outlined'
               label="Name"
               placeholder="Name*"
               value={user.name}
               onChangeText={text => changeName(text)}
               ref={nameEl}
              />
             <Text style={{color: 'red'}}>{nameerr}</Text> 
             <TextInput
               mode='outlined'
               label="Email"
               placeholder="Email*"
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
               placeholder='Password*'
               secureTextEntry={true}
               value={user.password}
               onChangeText={text => changePasswd(text)}
               ref={passwdEl}
              />
             <Text style={{color: 'red'}}>{passwderr}</Text> 
             <TextInput
               mode='outlined'
               label='Please type password again'
               placeholder='Please type password again*'
               secureTextEntry={true}
               value={password2}
               onChangeText={text => changePasswd2(text)}
               ref={passwd2El}
              />
              <View style={[styles.itemLeft, {marginTop: 20}]}>
                 <Button mode="contained" style={{marginRight: 20}} onPress={() => submitForm()}>
                  Sign Up
                 </Button>
                 <Button mode="contained" style={{marginRight: 20}} onPress={() => resetForm()}>
                   Reset
                 </Button>
                 <Button mode="outlined" style={{marginRight: 20}} onPress={() => navigation.navigate('Login')}>
                  Log In
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
