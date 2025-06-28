import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FAQ } from '../../types/notifications';

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, []);

  async function fetchFAQs() {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true })
        .order('helpful_count', { ascending: false });

      if (error) throw error;

      setFaqs(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(faq => faq.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markHelpful(faqId: string, isHelpful: boolean) {
    try {
      if (isHelpful) {
        await supabase
          .from('faqs')
          .update({ helpful_count: faqs.find(f => f.id === faqId)?.helpful_count + 1 })
          .eq('id', faqId);
      }

      // Update view count
      await supabase
        .from('faqs')
        .update({ view_count: faqs.find(f => f.id === faqId)?.view_count + 1 })
        .eq('id', faqId);

      fetchFAQs();
    } catch (error) {
      console.error('Error updating FAQ feedback:', error);
    }
  }

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <HelpCircle className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-600">Find answers to common questions about the Tapee Cement Loyalty Program</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search FAQs..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq) => (
            <div key={faq.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                {expandedFAQ === faq.id ? (
                  <ChevronUp className="text-gray-500 flex-shrink-0" size={20} />
                ) : (
                  <ChevronDown className="text-gray-500 flex-shrink-0" size={20} />
                )}
              </button>
              
              {expandedFAQ === faq.id && (
                <div className="px-6 pb-4">
                  <div className="border-t border-gray-200 pt-4">
                    <div 
                      className="text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                    
                    {/* Tags */}
                    {faq.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {faq.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Feedback */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">Was this helpful?</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => markHelpful(faq.id, true)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
                          >
                            <ThumbsUp size={16} />
                            <span className="text-sm">Yes</span>
                          </button>
                          <button
                            onClick={() => markHelpful(faq.id, false)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                          >
                            <ThumbsDown size={16} />
                            <span className="text-sm">No</span>
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {faq.helpful_count} people found this helpful
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <HelpCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No FAQs Found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No FAQs match your search for "${searchQuery}"`
                : 'No FAQs available in this category'}
            </p>
          </div>
        )}
      </div>

      {/* Contact Support */}
      <div className="mt-12 bg-primary-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h3>
        <p className="text-gray-600 mb-4">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
          Contact Support
        </button>
      </div>
    </div>
  );
}