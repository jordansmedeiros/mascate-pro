import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useProducts, useUpdateProductStock } from '@/features/products/hooks/useProducts';
import { Minus, ShoppingCart, Search } from 'lucide-react';
import type { Product } from '@/types';

export const EstoquePage: React.FC = () => {
  const { data: products, isLoading } = useProducts();
  const updateStock = useUpdateProductStock();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Preparar dados
  const activeProducts = products?.filter(p => p.active) || [];
  
  // Filtrar produtos pela busca
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return activeProducts;
    
    const term = searchTerm.toLowerCase();
    return activeProducts.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  }, [activeProducts, searchTerm]);
  
  const lowStockProducts = filteredProducts.filter(p => p.current_stock <= p.minimum_stock);

  const handleQuickSale = async (product: Product, qty = 1) => {
    if (product.current_stock < qty) {
      alert(`Estoque insuficiente! Disponível: ${product.current_stock}`);
      return;
    }
    
    try {
      await updateStock.mutateAsync({
        productId: product.id,
        newStock: product.current_stock - qty,
        movementType: 'sale',
        notes: `Venda de ${qty} ${product.unit}(s)`
      });
      
      // Reset quantity input for this product
      setQuantities(prev => ({ ...prev, [product.id]: 0 }));
    } catch (error) {
      console.error('Erro ao dar baixa:', error);
      alert('Erro ao processar venda!');
    }
  };

  const handleCustomSale = async (product: Product) => {
    const qty = quantities[product.id] || 0;
    if (qty <= 0) {
      alert('Digite uma quantidade válida!');
      return;
    }
    
    await handleQuickSale(product, qty);
  };

  const setQuantity = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setQuantities(prev => ({ ...prev, [productId]: numValue }));
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
      {/* Header com busca */}
      <div className="space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-mascate-900 mb-2">
            💰 VENDAS
          </h1>
          <p className="text-mascate-600">
            Sistema de controle de saídas - Registre suas vendas rapidamente
          </p>
        </div>
        
        {/* Barra de busca */}
        <div className="max-w-md mx-auto relative">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar produtos por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </div>
      </div>

      {/* Alerta de Estoque Baixo */}
      {lowStockProducts.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <div className="text-center py-4">
            <h3 className="font-bold text-red-800 mb-2">
              ⚠️ {lowStockProducts.length} produto(s) com estoque baixo!
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {lowStockProducts.map(product => (
                <span key={product.id} className="px-2 py-1 bg-red-200 text-red-800 rounded text-sm">
                  {product.name} ({product.current_stock})
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Lista de Produtos em formato de linha */}
      <div className="space-y-3">
        {filteredProducts.map(product => {
          const isLowStock = product.current_stock <= product.minimum_stock;
          const currentQty = quantities[product.id] || 0;
          
          return (
            <Card 
              key={product.id} 
              className={`p-4 ${
                isLowStock ? 'border-red-300 bg-red-50' : 
                product.current_stock === 0 ? 'border-gray-300 bg-gray-50' : 
                'border-gray-200 hover:border-mascate-300 hover:shadow-md transition-all'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Informações do Produto */}
                <div className="flex items-center space-x-4 flex-1">
                  {/* Nome, Preço e Categoria */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-mascate-100 text-mascate-800 rounded-full flex-shrink-0">
                        {product.category}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-green-600 mt-1">
                      R$ {product.sale_price.toFixed(2)}
                    </div>
                  </div>

                  {/* Estoque */}
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      product.current_stock === 0 ? 'bg-gray-100 text-gray-600 border border-gray-300' :
                      isLowStock ? 'bg-red-100 text-red-700 border border-red-300' : 
                      'bg-green-100 text-green-700 border border-green-300'
                    }`}>
                      <span className="font-bold text-base mr-1">{product.current_stock}</span>
                      <span className="text-xs">{product.unit}</span>
                      {isLowStock && product.current_stock > 0 && (
                        <span className="ml-1">⚠️</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações de Venda */}
                {product.current_stock > 0 ? (
                  <div className="flex items-center space-x-2">
                    {/* Botões de Venda Rápida */}
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => handleQuickSale(product, 1)}
                        variant="primary"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 px-3"
                        disabled={product.current_stock < 1 || updateStock.isPending}
                      >
                        -1
                      </Button>
                      {product.current_stock >= 2 && (
                        <Button
                          onClick={() => handleQuickSale(product, 2)}
                          variant="primary"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 px-3"
                          disabled={product.current_stock < 2 || updateStock.isPending}
                        >
                          -2
                        </Button>
                      )}
                      {product.current_stock >= 5 && (
                        <Button
                          onClick={() => handleQuickSale(product, 5)}
                          variant="primary"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 px-3"
                          disabled={product.current_stock < 5 || updateStock.isPending}
                        >
                          -5
                        </Button>
                      )}
                    </div>

                    {/* Quantidade Personalizada */}
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Qtd"
                        value={currentQty || ''}
                        onChange={(e) => setQuantity(product.id, e.target.value)}
                        className="text-center w-20"
                        min="1"
                        max={product.current_stock.toString()}
                      />
                      <Button
                        onClick={() => handleCustomSale(product)}
                        variant="danger"
                        size="sm"
                        disabled={!currentQty || currentQty <= 0 || currentQty > product.current_stock || updateStock.isPending}
                        className="px-4"
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        VENDER
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Produto Esgotado */
                  <div className="text-center py-3 text-gray-500">
                    <div className="font-medium">ESGOTADO</div>
                    <div className="text-sm">🙅‍♂️</div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Estado Vazio / Sem Resultados */}
      {filteredProducts.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            {searchTerm ? (
              <>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-500">
                  Tente buscar por outro nome ou categoria
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Nenhum produto ativo
                </h3>
                <p className="text-gray-500 mb-4">
                  Cadastre produtos na página "Produtos" para começar as vendas
                </p>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
