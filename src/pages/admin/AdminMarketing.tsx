import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Plus, Edit, Trash, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';

type MarketingSlide = Database['public']['Tables']['marketing_slides']['Row'];

export default function AdminMarketing() {
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<MarketingSlide[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<MarketingSlide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    active: true,
    order_number: 0
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  async function fetchSlides() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_slides')
        .select('*')
        .order('order_number', { ascending: true });

      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      console.error('Error fetching slides:', error);
      toast.error('Failed to load marketing slides');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const slideData = {
        title: formData.title,
        image_url: formData.image_url,
        active: formData.active,
        order_number: formData.order_number || slides.length + 1
      };

      if (editingSlide) {
        const { error } = await supabase
          .from('marketing_slides')
          .update(slideData)
          .eq('id', editingSlide.id);

        if (error) throw error;
        toast.success('Slide updated successfully');
      } else {
        const { error } = await supabase
          .from('marketing_slides')
          .insert([slideData]);

        if (error) throw error;
        toast.success('Slide created successfully');
      }

      setShowAddModal(false);
      setEditingSlide(null);
      setFormData({
        title: '',
        image_url: '',
        active: true,
        order_number: 0
      });
      fetchSlides();
    } catch (error) {
      console.error('Error saving slide:', error);
      toast.error('Failed to save slide');
    }
  }

  async function handleDeleteSlide(slideId: string) {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
      const { error } = await supabase
        .from('marketing_slides')
        .delete()
        .eq('id', slideId);

      if (error) throw error;
      toast.success('Slide deleted successfully');
      fetchSlides();
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast.error('Failed to delete slide');
    }
  }

  async function handleMoveSlide(slideId: string, direction: 'up' | 'down') {
    const currentIndex = slides.findIndex(slide => slide.id === slideId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === slides.length - 1)
    ) return;

    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap order numbers
    const tempOrder = newSlides[currentIndex].order_number;
    newSlides[currentIndex].order_number = newSlides[targetIndex].order_number;
    newSlides[targetIndex].order_number = tempOrder;

    try {
      const { error } = await supabase
        .from('marketing_slides')
        .upsert([
          newSlides[currentIndex],
          newSlides[targetIndex]
        ]);

      if (error) throw error;
      fetchSlides();
    } catch (error) {
      console.error('Error reordering slides:', error);
      toast.error('Failed to reorder slides');
    }
  }

  function handleEdit(slide: MarketingSlide) {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      image_url: slide.image_url,
      active: slide.active,
      order_number: slide.order_number
    });
    setShowAddModal(true);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketing Slides</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add New Slide
        </button>
      </div>

      {/* Slides Grid */}
      <div className="grid grid-cols-1 gap-6">
        {slides.map((slide, index) => (
          <div key={slide.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex">
              <div className="w-64 h-40">
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{slide.title}</h3>
                    <p className="text-sm text-gray-500">Order: {slide.order_number}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    slide.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {slide.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(slide)}
                    className="btn btn-outline btn-sm"
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="btn btn-error btn-sm"
                  >
                    <Trash size={16} className="mr-1" />
                    Delete
                  </button>
                  <div className="ml-4 space-x-1">
                    <button
                      onClick={() => handleMoveSlide(slide.id, 'up')}
                      disabled={index === 0}
                      className="btn btn-ghost btn-sm"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMoveSlide(slide.id, 'down')}
                      disabled={index === slides.length - 1}
                      className="btn btn-ghost btn-sm"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Marketing Slides</h3>
            <p className="text-gray-500">Start by adding your first marketing slide</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingSlide ? 'Edit Slide' : 'Add New Slide'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Order Number</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.order_number || slides.length + 1}
                    onChange={(e) => setFormData({ ...formData, order_number: parseInt(e.target.value) })}
                    required
                    min="1"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    className="mr-2"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <label htmlFor="active" className="text-sm text-gray-700">
                    Make slide active
                  </label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingSlide(null);
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingSlide ? 'Update Slide' : 'Create Slide'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}