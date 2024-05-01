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

export default function ForgotPasswd({ route, navigation }: { route: any; navigation: any; }) {
    const { userEmail } = route.params;
    const userContext: UserContextType = useContext(UserContext);
    const [email, setEmail] = useState(userEmail);
    const [emailerr, setEmailErr] = useState('');
    const emailEl = useRef(null);
    const [checkdata, setCheckdata] = useState(null);
    const [numForCheck, setNumForCheck] = useState('');
    const [numchkerr, setNumchkerr] = useState('');
    const numchkEl = useRef(null);
    const [passwd, setPasswd] = useState('');
    const [passwd2, setPasswd2] = useState('');
    const [passwderr, setPassWdErr] = useState('');
    const passwdEl = useRef(null);
    const passwd2El = useRef(null);
    const [inPost, setInPost] = useState(false);
 
    function changeEmail(text: string){
      const value = text.trim().replace(/<\/?[^>]*>/g, "");
      setEmail(value);
      setEmailErr('');
    } 

    function handleNumberChk(text: string){
       //Remove all the markups to prevent Cross-site Scripting attacks
       const value = text.trim().replace(/<\/?[^>]*>/g, "");
       setNumForCheck(value);
       setNumchkerr('');
    }
    
    async function submitEmailCheck(){
      //Reset all the err messages
      setEmailErr('');
      //Check if Email is filled
      if (!email){
          setEmailErr("Please type your email, this field is required!");
          (emailEl.current as any).focus();
          return;
       }
       
       //Validate the email
       if (!validator.validate(email)){
           setEmailErr("This email is not a legal email.");
           (emailEl.current as any).focus();
           return;
       }
       
       setInPost(true);
       const {data} = await axios.post(`${DOMAIN_URL}/api/forgotpasswd`, {email});
       setInPost(false);
       if (data.no_account){
          setEmailErr("Sorry, we can't find this account.");
          (emailEl.current as any).focus();
          return;
       }
       if (data.mail_sent){
          setEmailErr("Email for password reset has been already sent");
       }
       setCheckdata(data);
       setEmailErr('');
    }

    function submitNumberCheck(){
      setNumchkerr('');
      if (checkdata && numForCheck != checkdata['numForCheck']){
         setNumchkerr('The number you typed is not matched to the figure in the email.');
         (numchkEl.current as any).focus();
         return;
      }
    }

    async function submitPasswdReset(){
       //Reset all the err messages
       setPassWdErr('');

       //Check if Passwd is filled
       if (!passwd || !passwd2){
          setPassWdErr("Please type your password, this field is required!");
          if (!passwd){
             (passwdEl.current as any).focus();
          }else{
             (passwd2El.current as any).focus();
          }
          return;
       }
       //Check the passwords typed in the two fields are matched
       if (passwd != passwd2){
          setPassWdErr("Please retype your passwords, the passwords you typed in the two fields are not matched!");
          (passwdEl.current as any).focus();
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
       if (!schema.validate(passwd)){
          setPassWdErr("The password you typed is not enough secured, please retype a new one. The password must have both uppercase and lowercase letters as well as minimum 2 digits.");
          (passwdEl.current as any).focus();
          return;
       }

       const headers = { authorization: `Bearer ${checkdata ? checkdata['token']:''}` };
       setInPost(true);
       const {data} = await axios.post(`${DOMAIN_URL}/api/resetpasswd`, {password: passwd}, { headers: headers });
       setInPost(false);

       if (data.no_authorization){
          setPassWdErr("No authority to reset password, please resend password reset email");
          return;
       }
       const {token, ...others} = data;
       const userData = {...others, logintime: Math.round(new Date().getTime() / 1000)};
       await AsyncStorage.setItem('user', JSON.stringify(userData));
       await SecureStore.setItemAsync('token', token);
       userContext.login(userData);
       resetPasswdForm();
    }

    function resetPasswdForm(){
      setPasswd('');
      setPasswd2('');
      setPassWdErr('');
    }

    return (userContext &&
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView  
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.container}>
              <View style={styles.mainContainer}>
                 <View style={styles.itemCenter}>
                    <Text style={styles.titleText}>Forgot Password</Text>
                 </View>
                 {checkdata &&
                 <>
                 {numForCheck == checkdata['numForCheck'] &&
                 <>
                  <Text style={styles.headingText}>Please reset your password</Text>
                  <TextInput
                    mode='outlined'
                    label='Password'
                    placeholder='Password'
                    secureTextEntry={true}
                    value={passwd}
                    onChangeText={text => setPasswd(text.trim())}
                    ref={passwdEl}
                    />          
                  <Text style={{color: 'red'}}>{passwderr}</Text> 
                  <TextInput
                    mode='outlined'
                    label='Please type password again'
                    placeholder='Please type password again'
                    secureTextEntry={true}
                    value={passwd2}
                    onChangeText={text => setPasswd2(text.trim())}
                    ref={passwd2El}
                    />
                   <View style={[styles.itemLeft, {marginTop: 15}]}>
                    <Button mode="contained" style={{marginRight: 20}} onPress={() => submitPasswdReset()}>
                     Reset Password
                    </Button>
                    <Button mode="outlined" style={{marginRight: 20}} onPress={() => navigation.navigate('Login')}>
                     Log In
                    </Button>
                   </View>
                 </>
                 }
                 {numForCheck != checkdata['numForCheck'] &&
                 <>
                  <Text style={styles.headingText}>Email for password reset has been already sent! Please check the email we sent to you, and type the number in the following.</Text>
                  <TextInput
                    mode='outlined'
                    label="Please type the number you got in the email"
                    placeholder="Please type the number you got in the email"
                    value={numForCheck}
                    onChangeText={text => handleNumberChk(text)}
                    keyboardType="numeric"
                    ref={numchkEl}
                    />
                   <Text style={{color: 'red'}}>{numchkerr}</Text> 
                   <View style={[styles.itemLeft, {marginTop: 5}]}>
                    <Button mode="contained" style={{marginRight: 20}} onPress={() => submitNumberCheck()}>
                     Send
                    </Button>
                    <Button mode="outlined" style={{marginRight: 20}} onPress={() => navigation.navigate('Login')}>
                     Log In
                    </Button>
                   </View>
                 </>
                 }
                 </>
                 }
                 {!checkdata &&
                 <>
                   <TextInput
                    mode='outlined'
                    label='Email'
                    placeholder="Email"
                    value={email}
                    onChangeText={text => changeEmail(text)}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    ref={emailEl}
                   />
                   <Text style={{color: 'red'}}>{emailerr}</Text> 
                   <View style={[styles.itemLeft, {marginTop: 5}]}>
                    <Button mode="contained" style={{marginRight: 20}} onPress={() => submitEmailCheck()}>
                     Send Reset Email
                    </Button>
                    <Button mode="outlined" style={{marginRight: 20}} onPress={() => navigation.navigate('Login')}>
                     Log In
                    </Button>
                   </View>
                 </>  
                 } 
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
