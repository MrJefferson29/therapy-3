import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          color: '#222', // revert to original label color
          fontWeight: 'bold',
          marginBottom: 2,
        },
        tabBarActiveTintColor: "#2E7D32",
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: [
          styles.tabBar,
          colorScheme === 'dark' ? styles.darkTabBar : styles.lightTabBar,
          { minHeight: 60, height: 60, paddingBottom: 2 }, // remove forced bg color
        ],
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "view-dashboard" : "view-dashboard-outline"}
              color={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Therapist",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "account-heart" : "account-heart-outline"}
              color={color}
              size={22}
            />
          ),
          tabBarStyle: { display: 'none' }, // hide tab bar on chat screen
        }}
      />
      <Tabs.Screen
        name="selfCare"
        options={{
          title: "Self Care",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "spa" : "spa-outline"}
              color={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "notebook" : "notebook-outline"}
              color={color}
              size={22}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopColor: "transparent",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    height: 60,
    borderRadius: 20,
    marginHorizontal: 10,
    marginBottom: 10,
    position: "absolute",
  },
  lightTabBar: {
    backgroundColor: "#fff",
  },
  darkTabBar: {
    backgroundColor: "#151718",
  },
  tabBarLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
});
