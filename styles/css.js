import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
       flex: 1
    },
    mainContainer: {
       flex: 1, 
       justifyContent: 'center', 
       paddingBottom: 50, 
       paddingHorizontal: 5
    }, 
    scrollView: {
      paddingTop: 10,
      paddingHorizontal: 5
    },
    listItem: {
      marginBottom: 10,
    },
    itemCenter: {
      flexDirection: 'row', 
      justifyContent: 'center', 
      alignItems: 'center'
    },
    itemLeft: {
      flexDirection: 'row', 
      justifyContent: 'flex-start', 
      alignItems: 'center'
    },
    itemRight: {
      flexDirection: 'row', 
      justifyContent: 'flex-end', 
      alignItems: 'center'
    },
    itemActivity: {
      backgroundColor: 'darkgreen',
      padding: 10,
      borderRadius: 5
    },
    textActivity: {
      color: 'white',
      fontSize: 18,
      lineHeight: 24     
    },
    spaceActivity: {
      height: 50,
    },
    titleText: {
      height: 32,
      fontSize: 22,
      fontWeight: '400'   
    },
    headingText: {
      fontSize: 18,
      lineHeight: 22,
      paddingVertical: 5
    }, 
    subjectText: {
      fontSize: 22,
      lineHeight: 36
    },
    loading: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      opacity: 0.5,
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center'
    } 
});
