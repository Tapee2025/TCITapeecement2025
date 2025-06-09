import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Plus, Edit, Trash, ArrowUp, ArrowDown, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
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

  async function handleToggleActive(slideId: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('marketing_slides')
        .update({ active: !currentActive })
        .eq('id', slideId);

      if (error) throw error;
      toast.success(`Slide ${!currentActive ? 'activated' : 'deactivated'} successfully`);
      fetchSlides();
    } catch (error) {
      console.error('Error toggling slide status:', error);
      toast.error('Failed to update slide status');
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

  function openAddModal() {
    setEditingSlide(null);
    setFormData({
      title: '',
      image_url: '',
      active: true,
      order_number: slides.length + 1
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Slides</h1>
          <p className="text-gray-600">Manage promotional slides for the dashboard</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add New Slide
        </button>
      </div>

      {/* Slides Grid */}
      <div className="grid grid-cols-1 gap-6">
        {slides.map((slide, index) => (
          <div key={slide.id} className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-64 h-40">
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found';
                  }}
                />
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{slide.title}</h3>
                    <p className="text-sm text-gray-500">Order: {slide.order_number}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(slide.id, slide.active)}
                      className={`p-2 rounded-lg transition-colors ${
                        slide.active 
                          ? 'bg-success-100 text-success-600 hover:bg-success-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={slide.active ? 'Deactivate slide' : 'Activate slide'}
                    >
                      {slide.active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      slide.active ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {slide.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleEdit(slide)}
                    className="btn btn-outline btn-sm"
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                  >
                    <Trash size={16} className="mr-1" />
                    Delete
                  </button>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleMoveSlide(slide.id, 'up')}
                      disabled={index === 0}
                      className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMoveSlide(slide.id, 'down')}
                      disabled={index === slides.length - 1}
                      className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move down"
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
          <div className="text-center py-12 bg-white rounded-lg shadow border">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Marketing Slides</h3>
            <p className="text-gray-500 mb-4">Start by adding your first marketing slide</p>
            <button
              onClick={openAddModal}
              className="btn btn-primary"
            >
              <Plus size={20} className="mr-2" />
              Add First Slide
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    placeholder="Enter slide title"
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
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use high-quality images (recommended: 1200x400px)
                  </p>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers appear first in the slideshow
                  </p>
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
                    Make slide active (visible to users)
                  </label>
                </div>
                
                {/* Preview */}
                {formData.image_url && (
                  <div>
                    <label className="form-label">Preview</label>
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                        }}
                      />
                      {formData.title && (
                        <div className="p-3 bg-gray-50">
                          <p className="font-medium text-gray-900">{formData.title}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
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