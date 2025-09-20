import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Package, Plus, Edit3, Trash2 } from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/features/products/hooks/useProducts';
import { useCategories, useCreateCategory } from '@/features/categories/hooks/useCategories';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { showToast } from '@/components/ui/Toast';
import type { Product, ProductFormData, CategoryFormData } from '@/types';
import { formatCurrency, parseCurrencyValue, formatCurrencyInput } from '@/utils/currency';

export const ProdutosPage: React.FC = () => {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Categories
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createCategory = useCreateCategory();
  
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: categories?.[0]?.name || 'doce',
    unit: 'unidade',
    packaging: '',
    purchase_price: 0,
    sale_price: 0,
    minimum_stock: 10,
    current_stock: 0
  });

  // Campos separados para formatação de preços
  const [priceInputs, setPriceInputs] = useState({
    purchase_price: '0,00',
    sale_price: '0,00'
  });

  // Category modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: '',
    color: '#3b82f6',
  });

  // Confirm modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories?.[0]?.name || 'doce',
      unit: 'unidade',
      packaging: '',
      purchase_price: 0,
      sale_price: 0,
      minimum_stock: 10,
      current_stock: 0
    });
    setPriceInputs({
      purchase_price: '0,00',
      sale_price: '0,00'
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newCategory = await createCategory.mutateAsync(newCategoryForm);
      showToast.success('Categoria criada com sucesso!');

      // Set the new category as selected in the product form
      setFormData(prev => ({ ...prev, category: newCategory.name }));

      // Reset and close modal
      setNewCategoryForm({
        name: '',
        description: '',
        icon: '',
        color: '#3b82f6',
      });
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      showToast.error('Erro ao criar categoria. Tente novamente.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ 
          id: editingProduct.id, 
          updates: formData 
        });
        setEditingProduct(null);
      } else {
        await createProduct.mutateAsync(formData);
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      unit: product.unit,
      packaging: product.packaging,
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      minimum_stock: product.minimum_stock,
      current_stock: product.current_stock
    });
    setPriceInputs({
      purchase_price: formatCurrencyInput(product.purchase_price.toString()),
      sale_price: formatCurrencyInput(product.sale_price.toString())
    });
    setShowForm(true);
  };

  const handleDelete = (product: Product) => {
    console.log('🗑️ Tentando excluir produto:', product);
    setProductToDelete(product);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    console.log('✅ Confirmando exclusão do produto:', productToDelete);
    if (productToDelete) {
      try {
        console.log('📤 Enviando requisição de exclusão para ID:', productToDelete.id);
        await deleteProduct.mutateAsync(productToDelete.id);
        console.log('✅ Produto excluído com sucesso!');
        setShowConfirmModal(false);
        setProductToDelete(null);
        // Toast é mostrado automaticamente pelo hook useDeleteProduct
      } catch (error) {
        console.error('❌ Erro ao excluir produto:', error);
        // Erro é tratado no hook useDeleteProduct
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="Carregando produtos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Simples */}
      <div className="flex items-center justify-end">
        <Button
          variant="primary"
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-mascate-green text-white hover:bg-green-700 border-mascate-green shadow-md transition-all duration-200 hover:shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancelar' : 'Novo Produto'}
        </Button>
      </div>

      {/* Formulário Simples */}
      {showForm && (
        <Card title={editingProduct ? '✏️ Editar Produto' : '➕ Novo Produto'}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome do Produto *"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Seda, Chocolate, Bala..."
              required
            />
            
            <div>
              <label htmlFor="product-category" className="form-label">Categoria *</label>
              <div className="flex items-center space-x-2">
                <select
                  id="product-category"
                  className="form-input flex-1"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                  disabled={categoriesLoading}
                  aria-label="Selecionar categoria do produto"
                >
                  {categoriesLoading ? (
                    <option>Carregando categorias...</option>
                  ) : (
                    <>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.icon ? `${category.icon} ` : ''}
                          {category.name}
                        </option>
                      ))}
                      {/* Fallback categories if no categories from API */}
                      {(!categories || categories.length === 0) && (
                        <>
                          <option value="doce">🍫 Doce</option>
                          <option value="fumo">🚬 Fumo</option>
                          <option value="bebida">🥤 Bebida</option>
                          <option value="outros">📦 Outros</option>
                        </>
                      )}
                    </>
                  )}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCategoryModal(true)}
                  className="px-3 py-2 border-2 border-dashed border-gray-300 hover:border-mascate-green hover:bg-mascate-50 transition-colors"
                  title="Adicionar nova categoria"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Input
              label="Preço de Compra *"
              type="text"
              value={priceInputs.purchase_price}
              onChange={(e) => {
                const value = e.target.value;
                setPriceInputs(prev => ({ ...prev, purchase_price: value }));
                const numericValue = parseCurrencyValue(value);
                setFormData(prev => ({ ...prev, purchase_price: numericValue }));
              }}
              onBlur={(e) => {
                const formatted = formatCurrencyInput(e.target.value);
                setPriceInputs(prev => ({ ...prev, purchase_price: formatted }));
              }}
              placeholder="0,00"
              required
            />
            
            <Input
              label="Preço de Venda *"
              type="text"
              value={priceInputs.sale_price}
              onChange={(e) => {
                const value = e.target.value;
                setPriceInputs(prev => ({ ...prev, sale_price: value }));
                const numericValue = parseCurrencyValue(value);
                setFormData(prev => ({ ...prev, sale_price: numericValue }));
              }}
              onBlur={(e) => {
                const formatted = formatCurrencyInput(e.target.value);
                setPriceInputs(prev => ({ ...prev, sale_price: formatted }));
              }}
              placeholder="0,00"
              required
            />

            <Input
              label="Estoque Atual"
              type="number"
              value={formData.current_stock}
              onChange={(e) => setFormData(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
              placeholder="0"
            />
            
            <Input
              label="Estoque Mínimo"
              type="number"
              value={formData.minimum_stock}
              onChange={(e) => setFormData(prev => ({ ...prev, minimum_stock: parseInt(e.target.value) || 10 }))}
              placeholder="10"
            />

            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" variant="primary" className="flex-1 bg-mascate-green text-white hover:bg-green-700 border-mascate-green">
                {editingProduct ? '💾 Salvar Alterações' : '➕ Criar Produto'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  resetForm();
                }}
              >
                ❌ Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista Simples de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.map(product => {
          const isLowStock = product.current_stock <= product.minimum_stock;
          
          return (
            <Card key={product.id} className={isLowStock ? 'border-red-300 bg-red-50' : ''}>
              <div className="space-y-3">
                {/* Nome e Categoria */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                    <span className="text-xs px-2 py-1 bg-mascate-100 text-mascate-800 rounded-full">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="hover:bg-blue-100"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product)}
                      className="hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Estoque */}
                <div className={`text-center py-2 rounded-lg ${
                  isLowStock ? 'bg-red-100 border border-red-300' : 'bg-green-100 border border-green-300'
                }`}>
                  <div className={`text-2xl font-bold ${
                    isLowStock ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {product.current_stock} {product.unit}
                  </div>
                  <div className="text-xs text-gray-600">
                    Mínimo: {product.minimum_stock}
                    {isLowStock && <span className="text-red-600 font-bold"> ⚠️ BAIXO!</span>}
                  </div>
                </div>

                {/* Preços */}
                <div className="flex justify-between text-sm">
                  <div>
                    <div className="text-gray-500">Compra:</div>
                    <div className="font-medium">{formatCurrency(product.purchase_price)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Venda:</div>
                    <div className="font-medium text-green-600">{formatCurrency(product.sale_price)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Lucro:</div>
                    <div className="font-medium text-mascate-600">
                      {formatCurrency(product.sale_price - product.purchase_price)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {(!products || products.length === 0) && (
        <Card>
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum produto cadastrado
            </h3>
            <p className="text-gray-500 mb-4">
              Clique em "Novo Produto" para começar
            </p>
          </div>
        </Card>
      )}

      {/* Modal para criar nova categoria */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setNewCategoryForm({
            name: '',
            description: '',
            icon: '',
            color: '#3b82f6',
          });
        }}
        title="Adicionar Nova Categoria"
        size="md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Nome da Categoria *"
            value={newCategoryForm.name}
            onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Eletrônicos, Roupas, Livros..."
            required
          />

          <div>
            <label className="form-label">Descrição</label>
            <textarea
              className="form-input"
              value={newCategoryForm.description}
              onChange={(e) => setNewCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição opcional da categoria"
              rows={3}
            />
          </div>

          <Input
            label="Ícone (Emoji)"
            value={newCategoryForm.icon}
            onChange={(e) => setNewCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
            placeholder="Ex: 📱, 👕, 📚..."
            maxLength={10}
          />

          <div>
            <label className="form-label">Cor</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={newCategoryForm.color}
                onChange={(e) => setNewCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{newCategoryForm.color}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCategoryModal(false);
                setNewCategoryForm({
                  name: '',
                  description: '',
                  icon: '',
                  color: '#3b82f6',
                });
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createCategory.isPending}
              className="bg-mascate-green text-white hover:bg-green-700 border-mascate-green"
            >
              {createCategory.isPending ? 'Criando...' : 'Criar Categoria'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Produto"
        message={`Tem certeza que deseja remover ${productToDelete?.name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteProduct.isPending}
      />
    </div>
  );
};
