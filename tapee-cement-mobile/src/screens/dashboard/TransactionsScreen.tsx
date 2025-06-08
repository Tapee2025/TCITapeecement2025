import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TransactionsScreenProps {
  navigation: any;
}

export default function TransactionsScreen({ navigation }: TransactionsScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const transactions = [
    {
      id: '1',
      type: 'earned',
      amount: 100,
      description: 'Purchased 10 bags from ABC Distributors',
      status: 'approved',
      date: '2024-01-15',
      dealer: 'ABC Distributors',
    },
    {
      id: '2',
      type: 'redeemed',
      amount: 800,
      description: 'Redeemed Premium Toolbox',
      status: 'pending',
      date: '2024-01-14',
      reward: 'Premium Toolbox',
    },
    {
      id: '3',
      type: 'earned',
      amount: 50,
      description: 'Purchased 5 bags from XYZ Cement Store',
      status: 'dealer_approved',
      date: '2024-01-13',
      dealer: 'XYZ Cement Store',
    },
    {
      id: '4',
      type: 'earned',
      amount: 200,
      description: 'Purchased 20 bags from ABC Distributors',
      status: 'pending',
      date: '2024-01-12',
      dealer: 'ABC Distributors',
    },
  ];

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'earned', label: 'Earned' },
    { value: 'redeemed', label: 'Redeemed' },
  ];

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesFilter = selectedFilter === 'all' || transaction.type === selectedFilter;
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'dealer_approved':
        return '#2979f2';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'dealer_approved':
        return 'Pending Admin';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const TransactionCard = ({ transaction }: { transaction: any }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionType}>
          <Ionicons
            name={transaction.type === 'earned' ? 'arrow-up' : 'arrow-down'}
            size={16}
            color={transaction.type === 'earned' ? '#22c55e' : '#ef4444'}
          />
          <Text
            style={[
              styles.transactionTypeText,
              { color: transaction.type === 'earned' ? '#22c55e' : '#ef4444' },
            ]}
          >
            {transaction.type === 'earned' ? 'Earned' : 'Redeemed'}
          </Text>
        </View>
        <Text style={styles.transactionDate}>
          {new Date(transaction.date).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.transactionDescription}>{transaction.description}</Text>

      <View style={styles.transactionFooter}>
        <Text style={styles.transactionAmount}>
          {transaction.type === 'earned' ? '+' : '-'}{transaction.amount} points
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(transaction.status) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(transaction.status) },
            ]}
          >
            {getStatusText(transaction.status)}
          </Text>
        </View>
      </View>

      {transaction.dealer && (
        <Text style={styles.transactionMeta}>Dealer: {transaction.dealer}</Text>
      )}
      {transaction.reward && (
        <Text style={styles.transactionMeta}>Reward: {transaction.reward}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={20} color="#2979f2" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              selectedFilter === filter.value && styles.selectedFilterButton,
            ]}
            onPress={() => setSelectedFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter.value && styles.selectedFilterButtonText,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {filteredTransactions.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
        {filteredTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No transactions found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery
                ? `No transactions match "${searchQuery}"`
                : 'No transactions available for this filter'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedFilterButton: {
    backgroundColor: '#2979f2',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedFilterButtonText: {
    color: '#fff',
  },
  transactionsList: {
    flex: 1,
    padding: 20,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionTypeText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
});