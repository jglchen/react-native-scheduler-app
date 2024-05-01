import React, {useState, useEffect, useRef, useContext, useCallback} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform, 
         ScrollView,
         View, 
         Text,
         TouchableHighlight
} from 'react-native';
import { Button, Switch } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import { DOMAIN_URL } from '../lib/constants';
import { getDateString } from '../lib/utils';
import {UserContextType, Activity, User} from '../lib/types';

export default function SchedulerScreen({ navigation, route }: { navigation: any; route: any}) {
  const userContext: UserContextType = useContext(UserContext);
  const [initial, setInitial] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currActivities, setCurrActivities] = useState<Activity[]>([]);
  const currDate = new Date();
  currDate.setHours(0, 0, 0, 0);
  const currNextDate = new Date(currDate.getTime() + 24 * 60 * 60 * 1000 -1);
  const [startDate, setStartDate] = useState(currDate);
  const [startDatePicker, setStartDatePicker] = useState(false);
  const [endDate, setEndDate] = useState(currNextDate);
  const [endDatePicker, setEndDatePicker] = useState(false);
  const [selectRange, setSelectRange] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (userContext && userContext.user){
         retrieveSchedule(userContext.user);
      }
    }, [navigation, userContext])
  );

  async function retrieveSchedule(user: User){
    try {
      const userId = await AsyncStorage.getItem('schedule_userid') || '';
      let schedule: Activity[];
      if (user.id && userId !== user.id){
         await AsyncStorage.removeItem('schedule');
         await AsyncStorage.removeItem('schedule_recent');
         await AsyncStorage.removeItem('fetchtime');
         await AsyncStorage.setItem('schedule_userid', user.id);
         schedule = [];
      }else{
         //Set activites from AsyncStorage.getItem('schedule')
         const scheduleStore: string | null = await AsyncStorage.getItem('schedule');
         schedule = scheduleStore ? JSON.parse(scheduleStore): [];
      }
      setActivities(schedule);
      //Fetch recent data from database
      const currTime = new Date().getTime() / 1000;
      const fetchTimeStore: string | null = await AsyncStorage.getItem('fetchtime');
      const fetchTime = fetchTimeStore ? parseFloat(fetchTimeStore): 0;
      if ((currTime - fetchTime) > 10 * 60){
        fetchSchedule(schedule, user);
      }
    }catch(e){
      console.error(e);
    }
  }
  
  async function fetchSchedule(sch: Activity[], user: User){
    try {
      const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
      const schedule_recent = await AsyncStorage.getItem('schedule_recent') || '';
      const url = `${DOMAIN_URL}/api/getactivities?recent=${schedule_recent ? encodeURIComponent(schedule_recent): ''}`;
      const {data} = await axios.get(url, { headers: headers });
      if (data.no_authorization){
        return; 
      }
      const {result, removedact} = data;
      if (!result.length && !removedact.length){
         return; 
      }
       
      let recent = '';
      for (let item of result){
          let idx = sch.findIndex((itm) => itm.id == item.id);
          if (idx > -1){
            sch[idx] = item;
          }else{
            sch.push(item);
          }
          recent = item.created;
      }
      const schdl = sch.filter((item) => 
          !removedact.includes(item.id)
      );
      setActivities(schdl);
      await AsyncStorage.setItem('schedule', JSON.stringify(schdl));
      if (recent){
         await AsyncStorage.setItem('schedule_recent', recent);
      }
      const fetchTime = new Date().getTime() / 1000;
      await AsyncStorage.setItem('fetchtime', fetchTime.toString());
    }catch(e){
      console.error(e);
    }
  }

  useEffect(() => {
    if (activities.length > 0){
      const startDateTime = startDate.getTime() / 1000;
      const endDateTime = (endDate.getTime() + 1) / 1000;
      const selectedAct = activities.filter((item) => 
         (item.startTime > startDateTime && item.endTime < endDateTime) || 
         (item.startTime == startDateTime && item.endTime == endDateTime) || 
         (item.startTime <= startDateTime && item.endTime >= endDateTime) || 
         (item.startTime < startDateTime && item.endTime < endDateTime && item.endTime > startDateTime) || 
         (item.startTime > startDateTime && item.startTime < endDateTime && item.endTime > endDateTime)
      ).sort(function(a, b): number {
         if (a.startTime > b.startTime) {return 1}
         else if(a.startTime == b.startTime){return 0}
         else{return -1};
      });
      setCurrActivities(selectedAct);
      
      if (initial){
         if (!selectedAct.length){
            setSelectRange(true);
            const endDateTime = new Date(endDate.getTime());
            endDateTime.setMonth(endDateTime.getMonth()+1);
            setEndDate(endDateTime);
         }
         setInitial(false);   
      }
    }
    
  },[startDate, endDate, activities]);

  function changeSelectRange(value: boolean){
     if (value){
        setSelectRange(value); 
     }else{
        setSelectRange(value); 
        setEndDate(new Date(startDate.getTime() + 24 * 60 * 60 * 1000 -1));
     }
  }

  function handleStartDateConfirm(date: Date){
     date.setHours(0, 0, 0, 0);
     if (selectRange){
        if (date > endDate){
           const startTime = new Date(endDate.getTime());
           startTime.setHours(0, 0, 0, 0);
           const endTime = new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1);
           setStartDate(startTime);
           setEndDate(endTime);
        }else{
          setStartDate(date);
        }
    }else{
        setStartDate(date);
        setEndDate(new Date(date.getTime() + 24 * 60 * 60 * 1000 -1));
     }
     setStartDatePicker(false);
  }
  
  function handleEndDateConfirm(date: Date){
    date.setHours(0, 0, 0, 0);
    if (date < startDate){
       const endTime = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
       setStartDate(date);
       setEndDate(endTime);
    }else{
       setEndDate(new Date(date.getTime() + 24 * 60 * 60 * 1000 -1));
    }
    setEndDatePicker(false);
  }
  
  return (userContext &&
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView  
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={[styles.listItem,{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
            <Button icon="plus" mode="contained" onPress={() => navigation.navigate('Add')}>Activity</Button>           
            <View style={styles.itemLeft}>  
              <Switch value={selectRange} onValueChange={() => changeSelectRange(!selectRange)} />
              <Text> Select Date Ranges</Text>
            </View> 
          </View>
          <View style={styles.listItem}>
            {selectRange &&
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Button 
                mode='outlined'
                color='black'
                onPress={() => setStartDatePicker(true)}
                >
                {startDate.toDateString()}              
              </Button>
              <Text>--</Text>          
              <Button 
                mode='outlined'
                color='black'
                onPress={() => setEndDatePicker(true)}
                >
                {endDate.toDateString()}              
              </Button>
            </View>
            }
            {!selectRange &&
            <View style={styles.itemCenter}>
              <Button 
                mode='outlined'
                color='black'
                onPress={() => setStartDatePicker(true)}
                >
                {startDate.toDateString()}              
              </Button>
            </View>
            }
            <DateTimePickerModal
               date={startDate}
               isVisible={startDatePicker}
               mode="date"
               onConfirm={(date) => handleStartDateConfirm(date)}
               onCancel={() => setStartDatePicker(false)}
            />
            <DateTimePickerModal
               date={endDate}
               isVisible={endDatePicker}
               mode="date"
               onConfirm={(date) => handleEndDateConfirm(date)}
               onCancel={() => setEndDatePicker(false)}
            />
          </View>
          {currActivities.length > 0 &&
             currActivities.map((item) =>
             (
              <View key={item.id}>
                <TouchableHighlight onPress={() => navigation.navigate('ActivityDetail',{activityObj: item})}>
                  <View style={styles.itemActivity}>
                    <Text style={styles.textActivity}>{item.title}</Text>
                    <Text style={styles.textActivity}>{getDateString(new Date(item.startTime*1000))} -- {getDateString(new Date(item.endTime*1000))}</Text>
                  </View>
                </TouchableHighlight>
                <View style={styles.spaceActivity}>
                </View>
              </View>
             ))
          }
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
