import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader, { TextSkeleton, AvatarSkeleton } from './SkeletonLoader';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - 2;

export const FeaturedArticleSkeleton = () => (
  <View style={styles.featuredArticleSkeleton}>
    <SkeletonLoader width={280} height={200} borderRadius={12} />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.7)']}
      style={styles.featuredArticleGradient}
    >
      <View style={styles.featuredArticleContent}>
        <TextSkeleton lines={1} lineHeight={18} width="90%" />
        <TextSkeleton lines={2} lineHeight={14} width="70%" spacing={6} />
        <View style={styles.featuredArticleMeta}>
          <AvatarSkeleton size={24} />
          <TextSkeleton lines={1} lineHeight={12} width="40%" />
        </View>
      </View>
    </LinearGradient>
  </View>
);

export const CategoryChipSkeleton = () => (
  <View style={styles.categoryChipSkeleton}>
    <View style={styles.categoryChipContent}>
      <SkeletonLoader width={16} height={16} borderRadius={8} />
      <SkeletonLoader width={50} height={14} borderRadius={7} />
    </View>
  </View>
);

export const MasonryItemSkeleton = () => (
  <View style={styles.masonryItemSkeleton}>
    <SkeletonLoader width={COLUMN_WIDTH} height={COLUMN_WIDTH * 1.2} borderRadius={12} />
    <View style={styles.masonryOverlaySkeleton}>
      <View style={styles.masonryInfo}>
        <View style={styles.masonryCategory}>
          <SkeletonLoader width="60%" height={20} borderRadius={10} />
        </View>
        <View style={styles.masonryStats}>
          <SkeletonLoader width={16} height={16} borderRadius={8} />
          <SkeletonLoader width={30} height={12} borderRadius={6} />
        </View>
      </View>
    </View>
  </View>
);

export const DiscoverSkeleton = () => (
  <View style={styles.container}>
    {/* Header Section */}
    <View style={styles.headerSection}>
      <View style={styles.headerContent}>
        <TextSkeleton lines={1} lineHeight={24} width="60%" />
        <TextSkeleton lines={1} lineHeight={16} width="40%" />
      </View>
    </View>

    {/* Featured Articles Section */}
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <TextSkeleton lines={1} lineHeight={18} width={120} />
        <SkeletonLoader width={60} height={16} borderRadius={8} />
      </View>
      <View style={styles.featuredStoriesContainer}>
        {[1, 2, 3].map((item) => (
          <FeaturedArticleSkeleton key={item} />
        ))}
      </View>
    </View>

    {/* Category Filter */}
    <View style={styles.categoriesContainer}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <CategoryChipSkeleton key={item} />
      ))}
    </View>

    {/* Masonry Grid */}
    <View style={styles.masonryContainer}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <MasonryItemSkeleton key={item} />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
  },
  headerContent: {
    marginBottom: 8,
  },
  section: {
    marginVertical: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredStoriesContainer: {
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  featuredArticleSkeleton: {
    width: 280,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  featuredArticleGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredArticleContent: {
    marginBottom: 8,
  },
  featuredArticleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryChipSkeleton: {
    backgroundColor: '#F2FFF6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masonryContainer: {
    paddingHorizontal: 2,
    paddingTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  masonryItemSkeleton: {
    flex: 1,
    margin: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  masonryOverlaySkeleton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  masonryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masonryCategory: {
    backgroundColor: 'rgba(45, 106, 79, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  masonryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 