import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useProducts } from '@/features/products/hooks/useProducts';
import { 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Package
} from 'lucide-react';
import type { Product } from '@/types';

interface ProdutosTableProps {
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export const ProdutosTable: React.FC<ProdutosTableProps> = ({ 
  onEdit = () => {}, 
  onDelete = () => {} 
}) => {
  const { data: products, isLoading, error } = useProducts();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Get unique categories for filter
  const categories = useMemo(() => {
    if (!products) return [];
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return uniqueCategories.map(cat => ({ value: cat, label: cat }));
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      const matchesSearch = search === '' || 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = categoryFilter === '' || product.category === categoryFilter;
      
      const matchesStatus = statusFilter === '' || 
        (statusFilter === 'low' && product.current_stock <= product.minimum_stock) ||
        (statusFilter === 'ok' && product.current_stock > product.minimum_stock);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner text="Carregando produtos..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar produtos</h3>
          <p className="text-red-600">Tente recarregar a página.</p>
        </div>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStockStatus = (product: Product) => {
    if (product.current_stock <= product.minimum_stock) {
      return { status: 'low', color: 'text-red-600', bg: 'bg-red-100' };
    }
    return { status: 'ok', color: 'text-green-600', bg: 'bg-green-100' };
  };

  return (
    <Card>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Buscar produtos"
            placeholder="Nome do produto ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div>
          <Select
            label="Categoria"
            options={categories}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Todas as categorias"
          />
        </div>
        
        <div>
          <Select
            label="Status do Estoque"
            options={[
              { value: 'ok', label: '✅ Estoque Normal' },
              { value: 'low', label: '⚠️ Estoque Baixo' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="Todos os status"
          />
        </div>
      </div>

      {/* Results info */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
        </p>
        
        {(search || categoryFilter || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
              setStatusFilter('');
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {search || categoryFilter || statusFilter ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </h3>
          <p className="text-gray-500">
            {search || categoryFilter || statusFilter 
              ? 'Tente ajustar os filtros de busca.' 
              : 'Clique em "Novo Produto" para adicionar o primeiro produto.'
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Margem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map(product => {
                const stockStatus = getStockStatus(product);
                const profit = product.sale_price - product.purchase_price;
                const margin = profit > 0 ? ((profit / product.purchase_price) * 100) : 0;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.packaging}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mascate-100 text-mascate-800">
                        {product.category}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatCurrency(product.sale_price)}</div>
                        <div className="text-sm text-gray-500">Compra: {formatCurrency(product.purchase_price)}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.current_stock} {product.unit}</div>
                        <div className="text-sm text-gray-500">Mín: {product.minimum_stock}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status === 'low' ? '⚠️ Baixo' : '✅ OK'}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          +{margin.toFixed(1)}%
                        </div>
                        <div className="text-gray-500">
                          {formatCurrency(profit)}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(product)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(product)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};