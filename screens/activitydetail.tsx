import React, {useState, useRef, useContext, useCallback} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import validator from 'email-validator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform, 
         ScrollView,
         View, 
         Text,
         Alert
} from 'react-native';
import { Button, TextInput, Switch, ActivityIndicator, Colors } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import { DOMAIN_URL } from '../lib/constants';
import { timezone, getDateString } from '../lib/utils';
import {UserContextType, Activity, ScheduleStore, User} from '../lib/types';

export default function ActivityDetail({ navigation, route }) {
  const userContext: UserContextType = useContext(UserContext);
  const { activityObj } = route.params || {};
  const [inEditing, setInEditing] = useState(false);
  const [inPost, setInPost] = useState(false);
  const [activity, setActivity] = useState<Activity>(activityObj);
  const [titleerr, setTitleErr] = useState('');
  const titleEl = useRef(null);
  const [startDatePicker, setStartDatePicker] = useState(false);
  const [endDatePicker, setEndDatePicker] = useState(false);
  const [dateserr, setDatesErr] = useState('');
  const [errDescr, setErrDescr] = useState([]);

  useFocusEffect(
    useCallback(() => {
      adjustErrDescr();
    }, [navigation])
  );

  function adjustErrDescr(){
    const errDes = [];
    for (let i = 0; i < activity.meetingTargets.length; i++){
        errDes.push('');
    }
    setErrDescr(errDes);
  }
  
  function changeTitle(text: string) {
    const value = text.replace(/<\/?[^>]*>/g, "");
    setActivity((prevState) => ({...prevState, title: value}));
  }

  function changeStartDate(value: Date) {
    setActivity((prevState) => ({...prevState, startTime: value.getTime()/1000}));
  }

  function changeEndDate(value: Date) {
    setActivity((prevState) => ({...prevState, endTime: value.getTime()/1000}));
  }

  function addMeetingTargets() {
    const mTargets = activity.meetingTargets.slice();
    mTargets.push({name:'', email: ''});
    setActivity((prevState) => ({...prevState, meetingTargets: mTargets}));
    setErrDescr((prevState) => [...prevState, '']);
  }

  function minusMeetingTargets() {
    const mTargets = activity.meetingTargets.slice();
    const errDes = errDescr.slice();
    mTargets.pop();
    setActivity((prevState) => ({...prevState, meetingTargets: mTargets}));
    errDes.pop();
    setErrDescr(errDes);
  }

  function handleMeetingTargetName(text: string, idx: number){
    const mTargets = activity.meetingTargets.slice();
    mTargets[idx].name = text.replace(/<\/?[^>]*>/g, "");
    setActivity((prevState) => ({...prevState, meetingTargets: mTargets}));
  }

  function handleMeetingTargetEmail(text: string, idx: number){
    const mTargets = activity.meetingTargets.slice();
    mTargets[idx].email = text.replace(/<\/?[^>]*>/g, "").trim();
    setActivity((prevState) => ({...prevState, meetingTargets: mTargets}));
  }
 
  function handleSetErrDescr(descr: string, idx: number){
    if (idx>= errDescr.length){
       return;
    }
    const errDes = errDescr.slice();
    errDes[idx] = descr;
    setErrDescr(errDes);
  }
  
  function changeSendConfirm(bol: boolean){
    setActivity((prevState) => ({...prevState, sendConfirm: bol}));
  }

  function changeDescription(text: string){
    const value = text.replace(/<\/?[^>]*>/g, "");
    setActivity((prevState) => ({...prevState, description: value}));
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

  function sortOutMeetingTargets() {
    if (!activity.meetingTargets.length){
       return;
    }
    const mTargets = [];
    const errDes = [];
    for (let i = 0; i < activity.meetingTargets.length; i++){
       if (activity.meetingTargets[i].name.trim()){
          if (!activity.meetingTargets[i].email){
             mTargets.push(activity.meetingTargets[i]);
             errDes.push('');
          }else{
             const target = mTargets.find(item => item.email == activity.meetingTargets[i].email);
             if (!target){
                mTargets.push(activity.meetingTargets[i]);
                errDes.push('');
             }
          }
       }
    }
    setActivity((prevState) => ({...prevState, meetingTargets: mTargets}));
    setErrDescr(errDes);
  }  

  async function updateGo(){
      //Reset all the err messages
      resetErrMsg();
      //Check if Title is filled
      if (!activity.title.trim()){
         setActivity((prevState) => ({...prevState, title: activity.title.trim()}));
         setTitleErr("Please type title, this field is required!");
         titleEl.current.focus();
         return;
      }
      //Check if Dates is selected
      if (activity.startTime >= activity.endTime){
         setDatesErr("Starting time of selected range is later than ending time, please reselect!");
         return;
      } 
      const currTime = (new Date().getTime()) / 1000;
      if (activity.startTime < currTime || activity.endTime < currTime){
         setDatesErr("We can't set the appointment for the previous time.");
         return;
      }
      if (activity.meetingTargets.length > 0){
        for (let i = 0; i < activity.meetingTargets.length; i++) {
            if (activity.sendConfirm && activity.meetingTargets[i].name.trim()){
               //Check if Email is filled
               if (!activity.meetingTargets[i].email){
                  handleSetErrDescr('You want to send confirmation email, please provide the email', i);
                  return;
               }
            }
            //Validate the email
            if (activity.meetingTargets[i].email && !validator.validate(activity.meetingTargets[i].email)){
               handleSetErrDescr('This email is not validated OK, please enter a legal email.', i);
               return;
            }
        }
      }

      sortOutMeetingTargets();
      const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
      setInPost(true);
      const {data} = await axios.put(`${DOMAIN_URL}/api/updateschedule`, {userName: userContext.user.name, timezone, activity, activityObj} , { headers: headers });
      setInPost(false);
      if (data.no_authorization){
         alert("No authorization to update this scheduled activity!");
         return;
      }
      let schedule: ScheduleStore = await AsyncStorage.getItem('schedule');
      schedule = (JSON.parse(schedule) || []) as Activity[];
      const idx = schedule.findIndex(item => item.id == data.id);
      if (idx > -1){
        schedule[idx] = data;
        await AsyncStorage.setItem('schedule', JSON.stringify(schedule));
      }  
      navigation.navigate('Scheduler');
  }

  function confirmDelete(){
    if (!userContext){
      return;
    }
    Alert.alert(
      "Delete Activity",
      "Are you sure to delete this scheduled activity?",
      [
        {
          text: "No",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { text: "Yes", onPress: () => deleteActivity(userContext.user) }
      ]
    );

  }
  
  async function deleteActivity(user: User){
    try {
      const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
      setInPost(true);
      const {data} = await axios.delete(`${DOMAIN_URL}/api/removeschedule/${activityObj.id}`, { data: {...activityObj, userName: user.name, timezone}, headers: headers  });
      setInPost(false);
      if (data.no_authorization){
         return;
      }
      
      //Save the resultant schedule to AsyncStorage
      let schedule: ScheduleStore = await AsyncStorage.getItem('schedule');
      schedule = (JSON.parse(schedule) || []) as Activity[];
      const sch = schedule.filter((item) => item.id != activityObj.id);
      await AsyncStorage.setItem('schedule', JSON.stringify(sch));
      navigation.navigate('Scheduler');
    }catch(e){
      //
    }
  }
  
  const currTime = (new Date().getTime()) / 1000;   
  if (inEditing && activityObj.startTime >= currTime && activityObj.endTime >= currTime){
  return (userContext &&
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps='handled'
        scrollEnabled={true}
        style={styles.scrollView}
        >
          <View style={[styles.listItem, styles.itemRight]}>
            <Button icon="close" mode="outlined" style={{marginLeft: 10}} onPress={() => navigation.navigate('Scheduler')}>
               Close
            </Button>
          </View> 
          <View>
            <TextInput
              mode='outlined'
              label="Title"
              placeholder="Title"
              value={activity.title}
              onChangeText={text => changeTitle(text)}
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
                {getDateString(new Date(activity.startTime*1000))} 
                </Button>
                <Text>--</Text>
                <Button 
                  mode='outlined'
                  color='black'
                  onPress={() => setEndDatePicker(true)}
                  >
                  {getDateString(new Date(activity.endTime*1000))} 
                </Button>
             </View>
             <Text style={{color: 'red'}}>{dateserr}</Text>
             <DateTimePickerModal
                date={new Date(activity.startTime*1000)}
                isVisible={startDatePicker}
                mode="datetime"
                onConfirm={(date) => {changeStartDate(date);setStartDatePicker(false);}}
                onCancel={() => setStartDatePicker(false)}
                />
             <DateTimePickerModal
                date={new Date(activity.endTime*1000)}
                isVisible={endDatePicker}
                mode="datetime"
                onConfirm={(date) => {changeEndDate(date);setEndDatePicker(false);}}
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
                {activity.meetingTargets.length > 0 &&
                 <Button 
                   mode='outlined'
                   icon='minus'
                   onPress={() => minusMeetingTargets()}
                 >
                  Reduce
                 </Button>
                }
             </View>
             {activity.meetingTargets.length > 0 &&
                activity.meetingTargets.map((item, index) => 
                  <View key={index}>
                     <TextInput
                        mode="flat"
                        label="Name"
                        placeholder="Name"
                        value={activity.meetingTargets[index].name}
                        onChangeText={(text) => handleMeetingTargetName(text, index)}
                      />
                     <TextInput
                        mode="flat"
                        label="Email"
                        placeholder="Email"
                        value={activity.meetingTargets[index].email}
                        onChangeText={(text) => handleMeetingTargetEmail(text, index)}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                      />
                     <Text style={{color: 'red'}}>{errDescr[index]}</Text> 
                  </View>
                )
             } 
             {activity.meetingTargets.length > 0 &&
             <View style={styles.itemLeft}>
                <Text>Send Confirmation Emails: </Text>
                <Switch value={activity.sendConfirm} onValueChange={() => changeSendConfirm(!activity.sendConfirm)} /> 
             </View>
             } 
          </View>
          <View style={styles.listItem}>
            <TextInput
              mode='outlined'
              label="Description"
              placeholder="Description"
              value={activity.description}
              multiline={true}
              numberOfLines={5}
              onChangeText={text => changeDescription(text)}
              />
          </View> 
          <View style={[styles.listItem, styles.itemLeft]}>
            <Button mode="contained" style={{marginRight: 20}} onPress={() => updateGo()}>
             Go Update
            </Button>
            <Button mode="contained" style={{marginRight: 20}} onPress={() => setActivity(activityObj)}>
             Reset
            </Button>
          </View> 
      {inPost &&
      <View style={styles.loading}>
        <ActivityIndicator size="large" animating={true} color={Colors.white} />
      </View>
      }
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
  }
  
  return (userContext &&
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView  
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={[styles.listItem, styles.itemRight]}>
            {activityObj.startTime >= currTime && activityObj.endTime >= currTime &&
              <Button icon="pencil" style={{marginLeft: 10}} mode="outlined" onPress={() => {setInEditing(true); navigation.setOptions({ title: 'Update Scheduled Activity' })}}>
               Edit
              </Button>  
            }
            <Button icon="delete" style={{marginLeft: 10}} mode="outlined" onPress={() => confirmDelete()}>
              Delete
            </Button>  
            <Button icon="close" mode="outlined" style={{marginLeft: 10}} onPress={() => navigation.navigate('Scheduler')}>
               Close
            </Button>
          </View> 
          {activityObj &&
          <>
            <View style={styles.listItem}>
              <Text style={{fontSize: 16}}>{activityObj.title}</Text>
            </View>  
            <View style={styles.listItem}>
              <Text style={{fontSize: 16}}>{getDateString(new Date(activityObj.startTime*1000))} -- {getDateString(new Date(activityObj.endTime*1000))}</Text>
            </View>
            {activityObj &&
            <>
            {activityObj.meetingTargets.length > 0 &&
            <> 
            <View style={styles.listItem}>
              <Text style={{fontSize: 16, lineHeight: 24}}>Meeting Targets:</Text>
              {activityObj.meetingTargets.map((item, index) =>
              <View key={index} style={styles.itemLeft}>
                <Text style={{fontSize: 16, lineHeight: 24}}>{item.name}{item.email ? ` - ${item.email}`: ''}    </Text>
                {item.confirm &&
                <>
                  <MaterialIcons name='check' size={20} /><Text style={{fontSize: 16, lineHeight: 24}}>accepted</Text>
                </> 
                }
              </View>  
              )}
              <View style={styles.itemLeft}>
                <Text style={{fontSize: 16, lineHeight: 24}}>Send Confirmation Emails: </Text><MaterialIcons name={activityObj.sendConfirm ? 'check-box':'check-box-outline-blank'} size={20} />
              </View>
            </View>
            </>
            }
            </>
            }
            <View>
               <Text>{activityObj.description}</Text>
            </View> 
          </>  
          }
        </ScrollView>
        {inPost &&
          <View style={styles.loading}>
             <ActivityIndicator size="large" animating={true} color={Colors.white} />
          </View>
        }
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
