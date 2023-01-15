import React, {useState, useRef, useContext, useCallback} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import validator from 'email-validator';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView, 
         View, 
         Text,
         Keyboard
} from 'react-native';
import { Button, TextInput, Switch, ActivityIndicator, Colors } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import { timezone, getDateString } from '../lib/utils';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType, Activity, ScheduleStore} from '../lib/types';

export default function AddSchedule({ navigation }) {
  const userContext: UserContextType = useContext(UserContext);
  const [title, setTitle] = useState('');
  const [titleerr, setTitleErr] = useState('');
  const titleEl = useRef(null);
  const startTime = new Date();
  const endTime = new Date();
  let startMinutes = Math.ceil((startTime.getMinutes() + 1)/30)*30;
  startTime.setMinutes(startMinutes, 0, 0);
  endTime.setHours(endTime.getHours() + 1, startMinutes, 0, 0);
  const [startDate, setStartDate] = useState(startTime);
  const [startDatePicker, setStartDatePicker] = useState(false);
  const [endDate, setEndDate] = useState(endTime);
  const [endDatePicker, setEndDatePicker] = useState(false);
  const [dateserr, setDatesErr] = useState('');
  const [meetingTargets, setMeetingTargets] = useState([]);
  const [errDescr, setErrDescr] = useState([]);
  const [sendConfirm, setSendConfirm] = useState(false);   
  const [description, setDescription] = useState('');
  const [inPost, setInPost] = useState(false);

  useFocusEffect(
    useCallback(() => {
      backToInitial();
    }, [navigation])
  );
  
  function backToInitial(){
    Keyboard.dismiss();
    setTitle('');
    setTitleErr('');
    
    const startTime = new Date();
    const endTime = new Date();
    let startMinutes = Math.ceil((startTime.getMinutes() + 1)/30)*30;
    startTime.setMinutes(startMinutes, 0, 0);
    endTime.setHours(endTime.getHours() + 1, startMinutes, 0, 0);
    setStartDate(startTime); 
    setStartDatePicker(false);
    setEndDate(endTime);
    setEndDatePicker(false);

    setDatesErr('');
    setMeetingTargets([]);
    setErrDescr([]);
    setSendConfirm(false);
    setDescription('');
    setInPost(false);
  }
  
  function addMeetingTargets() {
    setMeetingTargets((prevState) => [...prevState, {name:'', email: ''}]);
    setErrDescr((prevState) => [...prevState, '']);
  }

  function minusMeetingTargets() {
     const mTargets = meetingTargets.slice();
     const errDes = errDescr.slice();
     mTargets.pop();
     setMeetingTargets(mTargets);
     errDes.pop();
     setErrDescr(errDes);
  }

  function handleMeetingTargetName(text: string, idx: number){
     const mTargets = meetingTargets.slice();
     mTargets[idx].name = text.replace(/<\/?[^>]*>/g, "");
     setMeetingTargets(mTargets);
  }

  function handleMeetingTargetEmail(text: string, idx: number){
    const mTargets = meetingTargets.slice();
    mTargets[idx].email = text.replace(/<\/?[^>]*>/g, "").trim();
    setMeetingTargets(mTargets);
  }

  function handleSetErrDescr(descr: string, idx: number){
    if (idx>= errDescr.length){
       return;
    }
    const errDes = errDescr.slice();
    errDes[idx] = descr;
    setErrDescr(errDes);
  }

  function sortOutMeetingTargets() {
    if (!meetingTargets.length){
       return;
    }
    const mTargets = [];
    const errDes = [];
    for (let i = 0; i < meetingTargets.length; i++){
       if (meetingTargets[i].name.trim()){
          if (!meetingTargets[i].email){
              mTargets.push({name: meetingTargets[i].name.trim(), email: meetingTargets[i].email});
              errDes.push('');
          }else{
              const target = mTargets.find(item => item.email == meetingTargets[i].email);
              if (!target){
                 mTargets.push({name: meetingTargets[i].name.trim(), email: meetingTargets[i].email});
                 errDes.push('');
              }
          } 
       }
    }
    setMeetingTargets(mTargets);
    setErrDescr(errDes);
  }  

  function resetErrMsg(){
    setTitleErr('');
    setDatesErr('');
    const errDes = [];
    for (let i = 0; i < errDescr.length; i++){
       errDes.push('');
    }
    setErrDescr(errDes);
  }

  async function submitForm(){
    //Reset all the err messages
    resetErrMsg();
    //Check if Title is filled
    if (!title.trim()){
      setTitle(title.trim());
      setTitleErr("Please type title, this field is required!");
      titleEl.current.focus();
      return;
    }
    //Check if Dates is selected
    if (!startDate || !endDate){
       setDatesErr("Please select datetime range, this field is required!");
       return;
    }
    if (startDate >= endDate){
       setDatesErr("Starting time of selected range is later than ending time, please reselect!");
       return;
    }
    const currTime = new Date();
    if (startDate < currTime || endDate < currTime){
       setDatesErr("We can't set the appointment for the previous time.");
       return;
    }
    if (meetingTargets.length > 0){
       for (let i = 0; i < meetingTargets.length; i++) {
           if (sendConfirm && meetingTargets[i].name.trim()){
              //Check if Email is filled
              if (!meetingTargets[i].email){
                 handleSetErrDescr('You want to send confirmation email, please provide the email', i);
                 return;
              }
           }
           //Validate the email
           if (meetingTargets[i].email && !validator.validate(meetingTargets[i].email)){
              handleSetErrDescr('This email is not validated OK, please enter a legal email.', i);
              return;
           }
       }
    }

    sortOutMeetingTargets();
    const dataObj = {title: title.trim(), startTime: startDate.getTime()/1000, endTime: endDate.getTime()/1000, meetingTargets, sendConfirm, description, timezone};
    const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };

    setInPost(true);
    const {data} = await axios.post(`${DOMAIN_URL}/api/addschedule`, dataObj, { headers: headers });
    setInPost(false);
    let schedule: ScheduleStore = await AsyncStorage.getItem('schedule');
    schedule = (schedule ? JSON.parse(schedule): []) as Activity[];
    schedule.push(data);
    await AsyncStorage.setItem('schedule', JSON.stringify(schedule));
    await AsyncStorage.setItem('schedule_recent', data.created);
    navigation.navigate('Scheduler');
  } 
  
  return (userContext &&
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps='handled'
        scrollEnabled={true}
        style={styles.scrollView}
        >
          <View>
            <TextInput
              mode='outlined'
              label="Add Title"
              placeholder="Add Title"
              value={title}
              onChangeText={text => setTitle(text.replace(/<\/?[^>]*>/g, ""))}
              ref={titleEl}
              />
            <Text style={{color: 'red'}}>{titleerr}</Text> 
          </View>
          <View>
             <Text>You can press the dates to change the time.</Text> 
             <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Button 
                  mode='outlined'
                  color='black'
                  onPress={() => setStartDatePicker(true)}
                  >
                {startDate ? getDateString(startDate):'No date selected'} 
                </Button>
                <Text>--</Text>
                <Button 
                  mode='outlined'
                  color='black'
                  onPress={() => setEndDatePicker(true)}
                  >
                  {endDate ? getDateString(endDate):'No date selected'} 
                </Button>
             </View>
             <Text style={{color: 'red'}}>{dateserr}</Text> 
             <DateTimePickerModal
                date={startDate}
                isVisible={startDatePicker}
                mode="datetime"
                onConfirm={(date) => {setStartDate(date);setStartDatePicker(false);}}
                onCancel={() => setStartDatePicker(false)}
                />
             <DateTimePickerModal
                date={endDate}
                isVisible={endDatePicker}
                mode="datetime"
                onConfirm={(date) => {setEndDate(date);setEndDatePicker(false);}}
                onCancel={() => setEndDatePicker(false)}
                />
          </View>
          <View style={styles.listItem}>
             <View style={styles.itemLeft}>
                <Text style={{fontSize: 20}}>Meeting Targets: </Text>
                <Button 
                  mode='outlined'
                  icon='plus'
                  style={{marginRight: 10}}
                  onPress={() => addMeetingTargets()}
                  >
                Add
                </Button>
                {meetingTargets.length > 0 &&
                 <Button 
                   mode='outlined'
                   icon='minus'
                   onPress={() => minusMeetingTargets()}
                 >
                  Reduce
                 </Button>
                }
             </View>
             {meetingTargets.length > 0 &&
                meetingTargets.map((item, index) => 
                  <View key={index}>
                     <TextInput
                        mode="flat"
                        label="Name"
                        placeholder="Name"
                        value={meetingTargets[index].name}
                        onChangeText={(text) => handleMeetingTargetName(text, index)}
                      />
                     <TextInput
                        mode="flat"
                        label="Email"
                        placeholder="Email"
                        value={meetingTargets[index].email}
                        onChangeText={(text) => handleMeetingTargetEmail(text, index)}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                      />
                     <Text style={{color: 'red'}}>{errDescr[index]}</Text> 
                  </View>
                )
             } 
             {meetingTargets.length > 0 &&
             <View style={styles.itemLeft}>
                <Text>Send Confirmation Emails: </Text>
                <Switch value={sendConfirm} onValueChange={() => setSendConfirm(!sendConfirm)} /> 
             </View>
             } 
          </View>
          <View style={styles.listItem}>
            <TextInput
              mode='outlined'
              label="Description"
              placeholder="Description"
              value={description}
              multiline={true}
              numberOfLines={5}
              onChangeText={text => setDescription(text.replace(/<\/?[^>]*>/g, ""))}
              />
          </View> 
            <Button mode="contained" style={{marginBottom: 20}} onPress={() => submitForm()}>
              Save
            </Button>
      </KeyboardAwareScrollView>
      {inPost &&
      <View style={styles.loading}>
        <ActivityIndicator size="large" animating={true} color={Colors.white} />
      </View>
      }
    </SafeAreaView>
  );
}