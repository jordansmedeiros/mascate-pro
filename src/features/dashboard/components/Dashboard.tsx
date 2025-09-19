import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  ShoppingCart,
  Users as UsersIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useProducts, useLowStockProducts } from '@/features/products/hooks/useProducts';
import { useAuth } from '@/features/auth/context/AuthContext';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'red' | 'green' | 'yellow';
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600', 
    green: 'from-green-500 to-green-600',
    yellow: 'from-mascate-500 to-mascate-600',
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`bg-gradient-to-r ${colorClasses[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: lowStockProducts, isLoading: lowStockLoading } = useLowStockProducts();

  if (productsLoading || lowStockLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Carregando dashboard..." />
      </div>
    );
  }

  // Calculate stats
  const totalProducts = products?.length || 0;
  const lowStockCount = lowStockProducts?.length || 0;
  
  const totalPurchaseValue = products?.reduce((sum, product) => 
    sum + (product.current_stock * product.purchase_price), 0) || 0;
  
  const totalSaleValue = products?.reduce((sum, product) => 
    sum + (product.current_stock * product.sale_price), 0) || 0;

  const potentialProfit = totalSaleValue - totalPurchaseValue;

  // Prepare chart data
  const chartData = products?.map(product => ({
    name: product.name.length > 10 ? `${product.name.substring(0, 10)}...` : product.name,
    estoque: product.current_stock,
    minimo: product.minimum_stock,
    status: product.current_stock <= product.minimum_stock ? 'low' : 'ok'
  })).slice(0, 8) || []; // Show top 8 products

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Produtos"
          value={totalProducts}
          icon={Package}
          color="blue"
        />
        
        <StatsCard
          title="Estoque Baixo"
          value={lowStockCount}
          icon={AlertTriangle}
          color="red"
          subtitle={lowStockCount > 0 ? "Requer atenção!" : "Tudo ok!"}
        />
        
        <StatsCard
          title="Valor de Compra"
          value={`R$ ${totalPurchaseValue.toFixed(2)}`}
          icon={ShoppingCart}
          color="green"
        />
        
        <StatsCard
          title="Valor de Venda"
          value={`R$ ${totalSaleValue.toFixed(2)}`}
          icon={DollarSign}
          color="yellow"
          subtitle={`Lucro: R$ ${potentialProfit.toFixed(2)}`}
        />
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                ⚠️ Produtos com Estoque Baixo
              </h3>
              <div className="space-y-2">
                {lowStockProducts?.slice(0, 5).map(product => (
                  <div 
                    key={product.id}
                    className="flex justify-between items-center p-2 bg-white rounded border border-red-100"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({product.category})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-red-600">{product.current_stock}</span>
                      <span className="text-sm text-gray-500"> / {product.minimum_stock}</span>
                    </div>
                  </div>
                ))}
                {(lowStockCount > 5) && (
                  <p className="text-sm text-red-600 font-medium">
                    + {lowStockCount - 5} outros produtos precisam de reposição
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stock levels chart */}
      <Card title="📊 Níveis de Estoque" subtitle="Visualização dos produtos e seus estoques">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FEF3C7', 
                  border: '2px solid #F59E0B',
                  borderRadius: '8px',
                  color: '#92400E'
                }}
                formatter={(value, name) => [
                  value, 
                  name === 'estoque' ? 'Estoque Atual' : 'Estoque Mínimo'
                ]}
              />
              <Bar 
                dataKey="estoque" 
                fill="#F59E0B" 
                name="Estoque Atual" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="minimo" 
                fill="#EF4444" 
                name="Estoque Mínimo" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-mascate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gerenciar Produtos</h3>
            <p className="text-gray-600 mb-4">Adicionar, editar ou remover produtos do estoque</p>
          </div>
        </Card>

        <Card>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Movimentações</h3>
            <p className="text-gray-600 mb-4">Registrar vendas, entradas e ajustes de estoque</p>
          </div>
        </Card>

        {user?.role === 'superadmin' && (
          <Card>
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Usuários</h3>
              <p className="text-gray-600 mb-4">Gerenciar usuários e permissões do sistema</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};