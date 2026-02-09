import { Tabs } from "expo-router"
export default function TabsLayout(){
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{headerShown:false,tabBarStyle:{display:"none"}}}/>
    </Tabs>
  )
}