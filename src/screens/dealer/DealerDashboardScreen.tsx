import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

interface DealerDashboardScreenProps {
  navigation: any;
}

export default function DealerDashboardScreen({ navigation }: DealerDashboardScreenProps) {
  const { currentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats] = useState({
    totalTransactions: 45,
    pendingApprovals: 8,
    approvedToday: 12,
    totalPointsApproved: 4500,
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const StatCard = ({ title, value, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <LinearGradient
        colors={[color, `${color}CC`]}
        style={styles.statGradient}
      >
        <View style={styles.statContent}>
          <Ionicons name={icon} size={24} color="#fff" />
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const QuickAction = ({ title, subtitle, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.quickActionText}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{currentUser?.firstName}!</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#2979f2" />
          </TouchableOpacity>
        </View>

        {/* Dealer Info Card */}
        <View style={styles.dealerInfoCard}>
          <LinearGradient
            colors={['#2979f2', '#1565c0']}
            style={styles.dealerInfoGradient}
          >
            <View style={styles.dealerInfoContent}>
              <Text style={styles.dealerInfoLabel}>Dealer Code</Text>
              <Text style={styles.dealerInfoValue}>{currentUser?.userCode}</Text>
              <Text style={styles.dealerInfoSubtext}>
                {currentUser?.city}, {currentUser?.district}
              </Text>
            </View>
            <Ionicons name="business" size={40} color="#fff" style={styles.dealerInfoIcon} />
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon="clock-outline"
            color="#f59e0b"
            onPress={() => navigation.navigate('ApprovePoints')}
          />
          <StatCard
            title="Approved Today"
            value={stats.approvedToday}
            icon="checkmark-circle-outline"
            color="#22c55e"
            onPress={() => navigation.navigate('Transactions')}
          />
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            title="Total Transactions"
            value={stats.totalTransactions}
            icon="list-outline"
            color="#2979f2"
            onPress={() => navigation.navigate('Transactions')}
          />
          <StatCard
            title="Points Approved"
            value={stats.totalPointsApproved}
            icon="star-outline"
            color="#8b5cf6"
            onPress={() => navigation.navigate('Transactions')}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <QuickAction
            title="Approve Points"
            subtitle="Review pending point requests"
            icon="checkmark-circle-outline"
            color="#f59e0b"
            onPress={() => navigation.navigate('ApprovePoints')}
          />
          <QuickAction
            title="View Rewards"
            subtitle="Browse available rewards"
            icon="gift-outline"
            color="#22c55e"
            onPress={() => navigation.navigate('Rewards')}
          />
          <QuickAction
            title="Transaction History"
            subtitle="View all transactions"
            icon="list-outline"
            color="#8b5cf6"
            onPress={() => navigation.navigate('Transactions')}
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Approved 100 points</Text>
              <Text style={styles.activitySubtitle}>For John Doe • 2 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="time" size={20} color="#f59e0b" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>New request pending</Text>
              <Text style={styles.activitySubtitle}>From Jane Smith • 4 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Approved 50 points</Text>
              <Text style={styles.activitySubtitle}>For Mike Johnson • 6 hours ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealerInfoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dealerInfoGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dealerInfoContent: {
    flex: 1,
  },
  dealerInfoLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  dealerInfoValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  dealerInfoSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  dealerInfoIcon: {
    opacity: 0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statTitle: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
  quickActionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  recentActivityContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});