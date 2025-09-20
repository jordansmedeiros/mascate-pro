import React from 'react';
import { 
  AlertTriangle, 
  DollarSign,
  Clock,
  Zap,
  TrendingDown,
  Heart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useProducts } from '@/features/products/hooks/useProducts';
import { 
  useStockAnalytics, 
  formatCurrency, 
  getCategoryEmoji
} from '../hooks/useStockAnalytics';

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
  const { data: products, isLoading: productsLoading } = useProducts();
  const analytics = useStockAnalytics();

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Analisando seu estoque..." />
      </div>
    );
  }

  // Preparar dados para gráfico de categorias
  const categoryChartData = analytics.categoryMetrics.map(metric => ({
    name: getCategoryEmoji(metric.category) + ' ' + metric.category.charAt(0).toUpperCase() + metric.category.slice(1),
    valor: metric.totalValue,
    produtos: metric.totalProducts,
    baixo: metric.lowStockCount
  }));

  // Dados para gráfico de pizza (distribuição de produtos por status)
  const statusData = [
    { name: 'Normal', value: products?.filter(p => p.current_stock > p.minimum_stock).length || 0, color: '#22c55e' },
    { name: 'Atenção', value: analytics.needsAttention.length, color: '#f59e0b' },
    { name: 'Crítico', value: products?.filter(p => p.current_stock === 0).length || 0, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Indicadores Principais com Saúde do Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Saúde do Estoque"
          value={`${analytics.healthScore}%`}
          icon={Heart}
          color={analytics.overallHealth === 'excelente' ? 'green' : 
                 analytics.overallHealth === 'boa' ? 'blue' :
                 analytics.overallHealth === 'atencao' ? 'yellow' : 'red'}
          subtitle={analytics.overallHealth.charAt(0).toUpperCase() + analytics.overallHealth.slice(1)}
        />
        <StatsCard
          title="Valor Investido"
          value={formatCurrency(analytics.totalValue)}
          icon={DollarSign}
          color="green"
          subtitle="Total do seu estoque"
        />
        
        <StatsCard
          title="Duração Média"
          value={`${analytics.averageDaysToEmpty} dias`}
          icon={Clock}
          color="blue"
          subtitle="Tempo para acabar"
        />
        
        <StatsCard
          title="Giro Rápido"
          value={analytics.fastMovingCount}
          icon={Zap}
          color="yellow"
          subtitle="Produtos que vendem bem"
        />
        
        <StatsCard
          title="Giro Lento"
          value={analytics.slowMovingCount}
          icon={TrendingDown}
          color="red"
          subtitle="Produtos parados"
        />
      </div>

      {/* Status do Estoque - Gráfico */}
      {statusData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <Card title="🥧 Como está seu estoque?" subtitle="Situação geral dos produtos">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${((percent as number) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} produtos`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Alertas Inteligentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Precisa de Atenção AGORA */}
        {analytics.needsAttention.length > 0 && (
          <Card className="border-red-300 bg-red-50">
            <div className="text-center mb-4">
              <div className="bg-red-500 p-3 rounded-full w-fit mx-auto mb-2">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-red-900">
                Acabando AGORA!
              </h3>
              <p className="text-sm text-red-700">
                {analytics.needsAttention.length} produto(s) crítico(s)
              </p>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {analytics.needsAttention.slice(0, 5).map(product => (
                <div key={product.id} className="bg-white p-2 rounded border border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{product.name}</span>
                    <span className="text-red-600 font-bold text-sm">
                      {product.current_stock} restante(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Comprar em Breve */}
        {analytics.buyingSoon.length > 0 && (
          <Card className="border-yellow-300 bg-yellow-50">
            <div className="text-center mb-4">
              <div className="bg-yellow-500 p-3 rounded-full w-fit mx-auto mb-2">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-yellow-900">
                Comprar em Breve
              </h3>
              <p className="text-sm text-yellow-700">
                {analytics.buyingSoon.length} produto(s) para planejar
              </p>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {analytics.buyingSoon.slice(0, 5).map(product => (
                <div key={product.id} className="bg-white p-2 rounded border border-yellow-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{product.name}</span>
                    <span className="text-yellow-600 font-bold text-sm">
                      {Math.round((product.current_stock / product.minimum_stock) * 7)} dias
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Produtos Parados */}
        {analytics.overstocked.length > 0 && (
          <Card className="border-blue-300 bg-blue-50">
            <div className="text-center mb-4">
              <div className="bg-blue-500 p-3 rounded-full w-fit mx-auto mb-2">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-blue-900">
                Estoque Alto
              </h3>
              <p className="text-sm text-blue-700">
                {analytics.overstocked.length} produto(s) acumulados
              </p>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {analytics.overstocked.slice(0, 5).map(product => (
                <div key={product.id} className="bg-white p-2 rounded border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{product.name}</span>
                    <span className="text-blue-600 font-bold text-sm">
                      {product.current_stock} unidades
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Gráfico de Valor por Categoria */}
      {categoryChartData.length > 0 && (
        <Card title="💰 Onde está seu dinheiro?" subtitle="Valor investido por categoria">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a3522', 
                    border: '2px solid #0a3522',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), 'Valor Investido']}
                />
                <Bar 
                  dataKey="valor" 
                  fill="#0a3522" 
                  name="Valor" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Resumo por Categoria */}
      {analytics.categoryMetrics.length > 0 && (
        <Card title="📊 Resumo por Categoria" subtitle="Visão detalhada do seu estoque">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.categoryMetrics.map(metric => (
              <div key={metric.category} className="bg-gray-50 rounded-lg p-4">
                <div className="text-center mb-3">
                  <div className="text-2xl mb-2">{getCategoryEmoji(metric.category)}</div>
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {metric.category}
                  </h4>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Produtos:</span>
                    <span className="font-medium">{metric.totalProducts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(metric.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Média:</span>
                    <span className="font-medium">{metric.averageStock} un</span>
                  </div>
                  {metric.lowStockCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-red-600">⚠️ Baixo:</span>
                      <span className="font-bold text-red-600">{metric.lowStockCount}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};