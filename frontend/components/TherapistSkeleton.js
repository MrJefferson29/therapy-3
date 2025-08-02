import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader, { TextSkeleton, AvatarSkeleton, CardSkeleton } from './SkeletonLoader';
import { LinearGradient } from 'expo-linear-gradient';

export const TherapistCardSkeleton = () => (
  <View style={styles.therapistCardSkeleton}>
    <View style={styles.therapistCardHeader}>
      <AvatarSkeleton size={60} />
      <View style={styles.therapistCardInfo}>
        <TextSkeleton lines={1} lineHeight={16} width="80%" />
        <TextSkeleton lines={1} lineHeight={12} width="60%" />
        <View style={styles.therapistCardStats}>
          <SkeletonLoader width={16} height={16} borderRadius={8} />
          <TextSkeleton lines={1} lineHeight={12} width="30%" />
        </View>
      </View>
    </View>
    <View style={styles.therapistCardActions}>
      <SkeletonLoader width="100%" height={32} borderRadius={16} />
    </View>
  </View>
);

export const TherapistSectionSkeleton = () => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <LinearGradient
        colors={['#1B4332', '#4BBE8A']}
        style={styles.headerGradient}
      />
      <View style={styles.headerContent}>
        <View style={styles.headerText}>
          <TextSkeleton lines={1} lineHeight={20} width="60%" />
          <TextSkeleton lines={1} lineHeight={14} width="40%" />
        </View>
        <View style={styles.headerActions}>
          <SkeletonLoader width={60} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
    
    <View style={styles.statusSection}>
      <View style={styles.statusBadge}>
        <View style={styles.statusIcon}>
          <SkeletonLoader width={16} height={16} borderRadius={8} />
        </View>
        <View style={styles.statusContent}>
          <TextSkeleton lines={1} lineHeight={14} width="80%" />
          <TextSkeleton lines={1} lineHeight={12} width="60%" />
        </View>
      </View>
    </View>
    
    <View style={styles.therapistsContainer}>
      <TherapistCardSkeleton />
      <TherapistCardSkeleton />
    </View>
  </View>
);

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    position: 'relative',
    height: 120,
    padding: 16,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    marginTop: 4,
  },
  statusSection: {
    padding: 16,
    paddingTop: 8,
  },
  statusBadge: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  therapistsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  therapistCardSkeleton: {
    width: '50%',
    padding: 8,
  },
  therapistCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  therapistCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  therapistCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  therapistCardActions: {
    marginTop: 8,
  },
}); 