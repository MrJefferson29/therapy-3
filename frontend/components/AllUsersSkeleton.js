import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '../hooks/useTheme';
import SkeletonLoader from './SkeletonLoader';

export const AllUsersSkeleton = () => {
  const { isDark = false } = useTheme();

  const themeColors = {
    background: isDark ? '#1A1A1A' : '#F8F9FA',
    card: isDark ? '#2A2A2A' : '#FFFFFF',
    border: isDark ? '#454545' : '#E0E0E0',
    skeleton: isDark ? '#353535' : '#F0F0F0',
  };

  const renderHeaderSkeleton = () => (
    <View style={[styles.header, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
      <View style={[styles.backButton, { backgroundColor: themeColors.skeleton }]} />
      <View style={[styles.headerTitleSkeleton, { backgroundColor: themeColors.skeleton }]} />
      <View style={[styles.userCountSkeleton, { backgroundColor: themeColors.skeleton }]} />
    </View>
  );

  const renderSearchBarSkeleton = () => (
    <View style={[styles.searchContainer, { backgroundColor: themeColors.skeleton, borderColor: themeColors.border }]}>
      <View style={[styles.searchIconSkeleton, { backgroundColor: themeColors.border }]} />
      <View style={[styles.searchInputSkeleton, { backgroundColor: themeColors.border }]} />
    </View>
  );

  const renderFilterSkeleton = () => (
    <View style={styles.roleFilterContainer}>
      {[1, 2, 3, 4].map((index) => (
        <View
          key={index}
          style={[styles.roleFilterButton, { backgroundColor: themeColors.skeleton, borderColor: themeColors.border }]}
        >
          <View style={[styles.roleFilterIconSkeleton, { backgroundColor: themeColors.border }]} />
          <View style={[styles.roleFilterTextSkeleton, { backgroundColor: themeColors.border }]} />
        </View>
      ))}
    </View>
  );

  const renderUserCardSkeleton = () => (
    <View style={[styles.userCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <View style={[styles.userAvatar, { backgroundColor: themeColors.skeleton, borderColor: themeColors.border }]} />
      <View style={styles.userInfo}>
        <View style={[styles.userNameSkeleton, { backgroundColor: themeColors.skeleton }]} />
        <View style={[styles.userEmailSkeleton, { backgroundColor: themeColors.skeleton }]} />
        <View style={[styles.roleBadgeSkeleton, { backgroundColor: themeColors.skeleton }]} />
      </View>
      <View style={[styles.actionButton, { backgroundColor: themeColors.skeleton }]} />
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {renderHeaderSkeleton()}
      
      <View style={styles.content}>
        {renderSearchBarSkeleton()}
        {renderFilterSkeleton()}
        
        <View style={styles.scrollView}>
          {[1, 2, 3, 4, 5].map((index) => (
            <SkeletonLoader key={index} variant="pulse">
              {renderUserCardSkeleton()}
            </SkeletonLoader>
          ))}
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitleSkeleton: {
    width: 80,
    height: 18,
    borderRadius: 4,
  },
  userCountSkeleton: {
    width: 20,
    height: 12,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchIconSkeleton: {
    width: 18,
    height: 18,
    borderRadius: 2,
    marginRight: 8,
  },
  searchInputSkeleton: {
    flex: 1,
    height: 14,
    borderRadius: 4,
  },
  roleFilterContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 6,
  },
  roleFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
  },
  roleFilterIconSkeleton: {
    width: 14,
    height: 14,
    borderRadius: 2,
    marginRight: 4,
  },
  roleFilterTextSkeleton: {
    width: 30,
    height: 11,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  userNameSkeleton: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    marginBottom: 2,
  },
  userEmailSkeleton: {
    width: '80%',
    height: 12,
    borderRadius: 4,
    marginBottom: 4,
  },
  roleBadgeSkeleton: {
    width: 40,
    height: 16,
    borderRadius: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
}); 