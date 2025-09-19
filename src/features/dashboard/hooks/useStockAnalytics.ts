import { useMemo } from 'react';
import { useProducts } from '@/features/products/hooks/useProducts';

export interface StockAnalytics {
  // Indicadores principais
  totalValue: number;           // Valor total do estoque
  averageDaysToEmpty: number;   // Média de dias para acabar
  fastMovingCount: number;      // Produtos que giram rápido
  slowMovingCount: number;      // Produtos que giram devagar
  
  // Alertas simples
  needsAttention: Product[];    // Produtos que precisam de atenção
  buyingSoon: Product[];        // Produtos para comprar em breve
  overstocked: Product[];       // Produtos com muito estoque
  
  // Métricas por categoria
  categoryMetrics: CategoryMetric[];
  
  // Status geral
  overallHealth: 'excelente' | 'boa' | 'atencao' | 'critica';
  healthScore: number; // 0-100
}

interface Product {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  sale_price: number;
  purchase_price: number;
}

interface CategoryMetric {
  category: string;
  totalValue: number;
  averageStock: number;
  lowStockCount: number;
  totalProducts: number;
}


export const useStockAnalytics = (): StockAnalytics => {
  const { data: products } = useProducts();

  return useMemo(() => {
    if (!products || products.length === 0) {
      return {
        totalValue: 0,
        averageDaysToEmpty: 0,
        fastMovingCount: 0,
        slowMovingCount: 0,
        needsAttention: [],
        buyingSoon: [],
        overstocked: [],
        categoryMetrics: [],
        overallHealth: 'excelente',
        healthScore: 100
      };
    }

    // Calcular valor total do estoque
    const totalValue = products.reduce((sum, product) => 
      sum + (product.current_stock * product.purchase_price), 0
    );

    // Estimar dias para acabar baseado em estoque atual vs mínimo
    const daysToEmpty = products.map(product => {
      // Estimativa simples: se estoque atual for igual ao mínimo = 7 dias
      // Se for o dobro = 14 dias, etc.
      const ratio = product.current_stock / (product.minimum_stock || 1);
      return Math.max(ratio * 7, 1); // Mínimo 1 dia
    });
    
    const averageDaysToEmpty = daysToEmpty.length > 0 
      ? Math.round(daysToEmpty.reduce((a, b) => a + b, 0) / daysToEmpty.length)
      : 0;

    // Classificar produtos por velocidade de giro
    const fastMovingCount = products.filter(p => 
      p.current_stock <= p.minimum_stock * 1.5 && p.current_stock > 0
    ).length;
    
    const slowMovingCount = products.filter(p => 
      p.current_stock > p.minimum_stock * 3
    ).length;

    // Produtos que precisam de atenção (estoque baixo)
    const needsAttention = products.filter(p => 
      p.current_stock <= p.minimum_stock && p.current_stock > 0
    );

    // Produtos para comprar em breve (estoque baixo mas não crítico)
    const buyingSoon = products.filter(p => 
      p.current_stock > p.minimum_stock && 
      p.current_stock <= p.minimum_stock * 2
    );

    // Produtos com muito estoque
    const overstocked = products.filter(p => 
      p.current_stock > p.minimum_stock * 4
    );

    // Métricas por categoria
    const categoryGroups = products.reduce((acc, product) => {
      const cat = product.category;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(product);
      return acc;
    }, {} as Record<string, typeof products>);

    const categoryMetrics: CategoryMetric[] = Object.entries(categoryGroups).map(([category, prods]) => ({
      category,
      totalValue: prods.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0),
      averageStock: Math.round(prods.reduce((sum, p) => sum + p.current_stock, 0) / prods.length),
      lowStockCount: prods.filter(p => p.current_stock <= p.minimum_stock).length,
      totalProducts: prods.length
    }));

    // Calcular score de saúde geral (0-100)
    const totalProducts = products.length;
    const criticalCount = products.filter(p => p.current_stock === 0).length;
    const lowStockCount = needsAttention.length;
    const normalCount = totalProducts - criticalCount - lowStockCount;
    
    // Score baseado na distribuição dos produtos
    const healthScore = Math.max(0, Math.round(
      (normalCount / totalProducts) * 70 + 
      ((totalProducts - criticalCount) / totalProducts) * 30
    ));

    // Determinar saúde geral
    let overallHealth: StockAnalytics['overallHealth'];
    if (healthScore >= 80) overallHealth = 'excelente';
    else if (healthScore >= 60) overallHealth = 'boa';
    else if (healthScore >= 40) overallHealth = 'atencao';
    else overallHealth = 'critica';

    return {
      totalValue,
      averageDaysToEmpty,
      fastMovingCount,
      slowMovingCount,
      needsAttention,
      buyingSoon,
      overstocked,
      categoryMetrics,
      overallHealth,
      healthScore
    };
  }, [products]);
};

// Utilitário para formatar valores monetários
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

// Utilitário para obter emoji de categoria
export const getCategoryEmoji = (category: string): string => {
  const emojis: Record<string, string> = {
    'doce': '🍫',
    'fumo': '🚬', 
    'bebida': '🥤',
    'outros': '📦'
  };
  return emojis[category] || '📦';
};

// Utilitário para cores do status de saúde
export const getHealthColor = (health: StockAnalytics['overallHealth']): string => {
  const colors = {
    'excelente': 'text-green-600',
    'boa': 'text-blue-600', 
    'atencao': 'text-yellow-600',
    'critica': 'text-red-600'
  };
  return colors[health];
};

export const getHealthBgColor = (health: StockAnalytics['overallHealth']): string => {
  const colors = {
    'excelente': 'bg-green-100',
    'boa': 'bg-blue-100',
    'atencao': 'bg-yellow-100', 
    'critica': 'bg-red-100'
  };
  return colors[health];
};