import React from 'react'
import { ImageBackground,View , Text } from "react-native"
import {TextInput} from "react-native-paper"
export default function LoginScreen(){
    return (
        <ImageBackground source={require("../../../assets/images/login_background.png")} style={{flex:1}}>
            <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
                <Text>Welcome Back</Text>
                <Text>Access premium genetics for your farm</Text>

                <View>
                    <Text>Email or Phone</Text>
                    <TextInput placeholder="Enter Email" style={{width:"80%",margin:10}}/>
                </View>

                <View>
                    <Text>Email or Phone</Text>
                    <TextInput placeholder="Enter Password" style={{width:"80%",margin:10}}/>
                </View>
            </View>
        </ImageBackground>
    )
}