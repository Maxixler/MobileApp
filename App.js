/*

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity,Image } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="Up" onPress={() => alert('Up button pressed!')} style={styles.upButton} />
        <Button title="Left" onPress={() => alert('Left button pressed!')} style={styles.leftButton} />
        <Button title="Right" onPress={() => alert('Right button pressed!')} style={styles.rightButton} />
        <Button title="Down" onPress={() => alert('Down button pressed!')} style={styles.downButton} />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const Button = ({ title, onPress, style }) => (
  <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flex: 1, // Make button container take up entire screen
    flexDirection: 'row', // Arrange buttons horizontally
    justifyContent: 'center', // Center buttons horizontally
    alignItems: 'center', // Center buttons vertically
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  upButton: {
    position: 'absolute', // Position button absolutely within container
    bottom: 150, // Position 20px from top
  },
  leftButton: {
    position: 'absolute',
    left: 50,bottom: 80 // Position 20px from left
  },
  rightButton: {
    position: 'absolute',
    right: 50,bottom: 80  // Position 20px from right
  },
  downButton: {
    position: 'absolute',
    bottom: 10, // Position 20px from bottom
  },
});

*/
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity,Image } from 'react-native';
import Slider from '@react-native-community/slider';


<Slider
  style={{width: 200, height: 40}}
  minimumValue={0}
  maximumValue={1}
  minimumTrackTintColor="#FFFFFF"
  maximumTrackTintColor="#000000"
/>
export default function App() {
  const [sliderValue, setSliderValue] = useState(0);

  return (
    <View style={styles.container}>
    <View style={styles.sliderContainer}>
        <Text>Adjustable Bar: {sliderValue}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={sliderValue}
          onValueChange={setSliderValue}
          minimumTrackTintColor="#007bff"
          maximumTrackTintColor="#000000"
          thumbTintColor="#007bff"
        />
      </View>
      <View style={styles.buttonContainer}>
  <Button imageSource={require('./assets/up.png')} onPress={() => alert('Up button pressed!')} style={styles.upButton} />
  <Button imageSource={require('./assets/left.png')} onPress={() => alert('Left button pressed!')} style={styles.leftButton} />
  <Button imageSource={require('./assets/right.png')} onPress={() => alert('Right button pressed!')} style={styles.rightButton} />
  <Button imageSource={require('./assets/down.png')} onPress={() => alert('Down button pressed!')} style={styles.downButton} />
</View>

      <StatusBar style="auto" />
    </View>
  );
}

const Button = ({ imageSource, onPress, style }) => (
  <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
    <Image source={imageSource} style={styles.buttonImage} />
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flex: 1, // Make button container take up entire screen
    flexDirection: 'row', // Arrange buttons horizontally
    justifyContent: 'center', // Center buttons horizontally
    alignItems: 'center', // Center buttons vertically
  },
  sliderContainer: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  upButton: {
    position: 'absolute', // Position button absolutely within container
    bottom: 150, // Position 20px from top
  },
  downButton: {
    position: 'absolute', // Position button absolutely within container
    bottom: 50, // Position 20px from top
  },
  leftButton: {
    position: 'absolute', // Position button absolutely within container
    bottom: 95,
    left: 50 // Position 20px from top
  },
  rightButton: {
    position: 'absolute', // Position button absolutely within container
    bottom: 95,
    right: 50 // Position 20px from top
  },
  buttonImage: {
    width: 50, // Adjust as needed
    height: 50, // Adjust as needed
    resizeMode: 'contain', // Maintain aspect ratio while fitting within container
  },
});

