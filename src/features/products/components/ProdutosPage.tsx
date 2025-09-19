import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Package, Plus, Edit3, Trash2 } from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/features/products/hooks/useProducts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Product, ProductFormData } from '@/types';

export const ProdutosPage: React.FC = () => {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: 'doce',
    unit: 'unidade',
    packaging: '',
    purchase_price: 0,
    sale_price: 0,
    minimum_stock: 10,
    current_stock: 0
  });

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
      
      setFormData({
        name: '',
        category: 'doce',
        unit: 'unidade', 
        packaging: '',
        purchase_price: 0,
        sale_price: 0,
        minimum_stock: 10,
        current_stock: 0
      });
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
    setShowForm(true);
  };

  const handleDelete = async (product: Product) => {
    if (confirm(`Tem certeza que deseja remover ${product.name}?`)) {
      await deleteProduct.mutateAsync(product.id);
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
            setFormData({
              name: '',
              category: 'doce',
              unit: 'unidade',
              packaging: '',
              purchase_price: 0,
              sale_price: 0,
              minimum_stock: 10,
              current_stock: 0
            });
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
              <label className="form-label">Categoria *</label>
              <select
                className="form-input"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                required
              >
                <option value="doce">🍫 Doce</option>
                <option value="fumo">🚬 Fumo</option>
                <option value="bebida">🥤 Bebida</option>
                <option value="outros">📦 Outros</option>
              </select>
            </div>

            <Input
              label="Preço de Compra *"
              type="number"
              step="0.01"
              value={formData.purchase_price}
              onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              required
            />
            
            <Input
              label="Preço de Venda *"
              type="number"
              step="0.01"
              value={formData.sale_price}
              onChange={(e) => setFormData(prev => ({ ...prev, sale_price: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
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
                    <div className="font-medium">R$ {product.purchase_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Venda:</div>
                    <div className="font-medium text-green-600">R$ {product.sale_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Lucro:</div>
                    <div className="font-medium text-mascate-600">
                      R$ {(product.sale_price - product.purchase_price).toFixed(2)}
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
    </div>
  );
};
