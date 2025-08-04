import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTheme } from "../../hooks/useTheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { colors, isDark = false } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          color: isDark ? '#E8E8E8' : '#222',
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarActiveTintColor: isDark ? '#4BBE8A' : "#2E7D32",
        tabBarInactiveTintColor: isDark ? '#B0B0B0' : theme.tabIconDefault,
        tabBarStyle: [
          styles.tabBar,
          isDark ? styles.darkTabBar : styles.lightTabBar,
          { 
            minHeight: 60, 
            height: 60, 
            paddingBottom: 2,
            borderTopWidth: 1,
            borderTopColor: isDark ? '#454545' : '#E0E0E0',
          },
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
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    height: 60,
    borderRadius: 20,
    marginHorizontal: 10,
    marginBottom: 10,
    position: "absolute",
  },
  lightTabBar: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  darkTabBar: {
    backgroundColor: "#2A2A2A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabBarLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
});
