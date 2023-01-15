import React, {useState, useRef, useContext, useCallback} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import passwordValidator from 'password-validator';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform, 
         ScrollView,
         View, 
         Text
} from 'react-native';
import { Button, TextInput, ActivityIndicator, Colors } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType} from '../lib/types';

export default function UserInfo({ navigation }) {
    const userContext: UserContextType = useContext(UserContext);
    const [name, setName] = useState('');
    const [nameerr, setNameErr] = useState('');
    const nameEl = useRef(null);
    const [passwd, setPasswd] = useState('');
    const [passwderr, setPasswdErr] = useState('');
    const passwdEl = useRef(null);
    const [updateName, setUpdateName] = useState(false);
    const [updatePasswd, setUpdatePasswd] = useState(false);
    const [inPost, setInPost] = useState(false);

    useFocusEffect(
      useCallback(() => {
        backToInitial();
      }, [navigation])
    );

    function backToInitial(){
      setName('');
      setNameErr('');
      setPasswd('');
      setPasswdErr('');
      setUpdateName(false);
      setUpdatePasswd(false);
      setInPost(false);
    }

    async function submitNameUpdate(){
      setNameErr('');
      //Check if Name is filled
      if (!name.trim()){
         setNameErr("Please type your name, this field is required!");
         nameEl.current.focus();
         return;
      }
      
      const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
      setInPost(true);
      const {data} = await axios.put(`${DOMAIN_URL}/api/updateuser`, {name: name.trim()}, { headers: headers });
      setInPost(false);
      if (data.no_authorization){
          setNameErr("No authorization to update");
          nameEl.current.focus();
          return;
      }
        
      const user = {...userContext.user, name: name};
      await AsyncStorage.setItem('user', JSON.stringify(user));
      userContext.login(user);
      setUpdateName(false);
    }

    async function submitPasswdUpdate(){
      setPasswdErr('');
      //Check if Passwd is filled
      if (!passwd){
         setPasswdErr("Please type your password, this field is required!");
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
      if (!schema.validate(passwd)){
          setPasswdErr("The password you typed is not enough secured, please retype a new one. The password must have both uppercase and lowercase letters as well as minimum 2 digits.");
          passwdEl.current.focus();
          return;
      }
      
      const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
      setInPost(true);
      const {data} = await axios.put(`${DOMAIN_URL}/api/updateuser`, {password: passwd}, { headers: headers });
      setInPost(false);
      if (data.no_authorization){
          setPasswdErr("No authorization to update");
          passwdEl.current.focus();
          return;
      }
      setUpdatePasswd(false);
    }
  
    return (userContext &&
     <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView  
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}>
            <ScrollView style={styles.scrollView}>
               <View style={styles.listItem}>
                  {!updateName &&
                  <>
                    <Text style={styles.subjectText}>
                      Name: {userContext.user.name}  
                    </Text> 
                    <Button mode="contained" onPress={() => {{setUpdateName(true); setName(userContext.user.name);}}}>
                        Update Name
                     </Button>
                  </>
                  }
                  {updateName &&
                  <>
                    <TextInput
                      mode='outlined'
                      label="Name"
                      placeholder="Name"
                      value={name}
                      onChangeText={text => setName(text.replace(/<\/?[^>]*>/g, ""))}
                      ref={nameEl}
                      />
                    <Text style={{color: 'red'}}>{nameerr}</Text> 
                    <View style={styles.itemLeft}>
                      <Button mode="contained"  style={{marginRight: 20}} onPress={() => submitNameUpdate()}>
                        Go Update Name
                      </Button>
                      <Button mode="contained"  style={{marginRight: 20}} onPress={() => {setName(userContext.user.name);setNameErr('');}}>
                        Reset
                      </Button>
                    </View>
                  </>
                  }
               </View>
               <View style={styles.listItem}>
                  {!updatePasswd &&
                  <>
                    <Text style={styles.subjectText}>
                     Password 
                    </Text> 
                    <Button mode="contained" onPress={() => setUpdatePasswd(true)}>
                        Update Password
                    </Button>
                  </>
                  }
                  {updatePasswd &&
                  <>
                    <TextInput
                      mode='outlined'
                      label='Password'
                      placeholder='Password'
                      secureTextEntry={true}
                      value={passwd}
                      onChangeText={text => setPasswd(text.replace(/<\/?[^>]*>/g, "").trim())}
                      ref={passwdEl}
                      />
                    <Text style={{color: 'red'}}>{passwderr}</Text> 
                    <View style={styles.itemLeft}>
                      <Button mode="contained"  style={{marginRight: 20}} onPress={() => submitPasswdUpdate()}>
                        Go Update Password
                      </Button>
                      <Button mode="contained"  style={{marginRight: 20}} onPress={() => {setPasswd('');setPasswdErr('');}}>
                        Reset
                      </Button>
                    </View>
                  </>
                  }
               </View>
            </ScrollView>
        </KeyboardAvoidingView>
        {inPost &&
        <View style={styles.loading}>
            <ActivityIndicator size="large" animating={true} color={Colors.white} />
        </View>
        }
     </SafeAreaView>
  );
}
