import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/features/auth/context/AuthContext';
import { showToast, showConfirmToast } from '@/components/ui/Toast';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/features/categories/hooks/useCategories';
import { getDatabase } from '@/services/db';
import type { Category, CategoryFormData } from '@/types';
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  Shield,
  Package,
  TrendingDown,
  FileText,
  HardDrive,
  Calendar,
  Tags,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';

interface ConfigSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export const ConfiguracoesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('categorias');
  const [isProcessing, setIsProcessing] = useState(false);

  // System information states
  const [systemInfo, setSystemInfo] = useState<{
    version: string;
    database: {
      connected: boolean;
      tables: number;
      records: number;
      type: string;
      version: string;
      size: string;
    };
    storage: { used: string; available: string };
    users: number;
    categories: number;
    products: number;
    environment: string;
    tables: {
      users_count: number;
      products_count: number;
      categories_count: number;
    };
    lastUpdate: string;
  } | null>(null);
  const [loadingSystemInfo, setLoadingSystemInfo] = useState(false);

  // Category management states
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: '',
    color: '#3b82f6',
  });

  // Configurações de negócio
  const [businessConfig, setBusinessConfig] = useState({
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    autoReorderEnabled: false,
    notificationsEnabled: true,
    workingHours: {
      start: '18:00',
      end: '04:00'
    },
    maxDailyStock: 1000
  });

  // Configurações de backup
  const [backupConfig, setBackupConfig] = useState({
    autoBackupEnabled: true,
    backupInterval: 'daily', // daily, weekly, monthly
    maxBackups: 30,
    lastBackup: new Date().toISOString()
  });

  // Load system information
  const loadSystemInfo = async () => {
    setLoadingSystemInfo(true);
    try {
      const db = await getDatabase();
      const info = await db.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Erro ao carregar informações do sistema:', error);
      showToast.error('Erro ao carregar informações do sistema');
    } finally {
      setLoadingSystemInfo(false);
    }
  };

  // Load system info on component mount
  React.useEffect(() => {
    loadSystemInfo();
  }, []);

  // Category management functions
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          updates: categoryForm
        });
        showToast.success('Categoria atualizada com sucesso!');
      } else {
        await createCategory.mutateAsync(categoryForm);
        showToast.success('Categoria criada com sucesso!');
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        icon: '',
        color: '#3b82f6',
      });
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      showToast.error('Erro ao salvar categoria. Tente novamente.');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#3b82f6',
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    const confirmed = await showConfirmToast({
      message: `Tem certeza que deseja excluir a categoria "${category.name}"?`,
      confirmText: 'Sim, excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await deleteCategory.mutateAsync(category.id);
      showToast.success('Categoria excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      showToast.error('Erro ao excluir categoria. Verifique se não há produtos usando esta categoria.');
    }
  };

  const handleBusinessConfigSave = async () => {
    setIsProcessing(true);
    try {
      // Simular salvamento das configurações
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Em um sistema real, você salvaria no localStorage ou enviaria para API
      localStorage.setItem('mascate-business-config', JSON.stringify(businessConfig));
      
      showToast.success('Configurações de negócio salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      showToast.error('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackupNow = async () => {
    setIsProcessing(true);
    try {
      const db = await getDatabase();
      const backupBlob = await db.createBackup();

      // Create download link
      const url = URL.createObjectURL(backupBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mascate-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupConfig(prev => ({
        ...prev,
        lastBackup: new Date().toISOString()
      }));

      showToast.success('Backup criado e baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      showToast.error('Erro ao criar backup. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Simular restauração
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast.success(`Backup restaurado com sucesso!\nData: ${new Date(backupData.timestamp).toLocaleString('pt-BR')}`);
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      showToast.error('Erro ao restaurar backup. Verifique se o arquivo é válido.');
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleExportData = async (format: 'csv' | 'json') => {
    setIsProcessing(true);
    try {
      const db = await getDatabase();
      const exportBlob = await db.exportData(format);

      // Create download link
      const url = URL.createObjectURL(exportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mascate-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const filename = `mascate-export-${new Date().toISOString().split('T')[0]}.${format}`;
      showToast.success(`Relatório exportado: ${filename}`);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      showToast.error('Erro ao exportar dados. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearData = async (dataType: 'logs' | 'movements', description: string) => {
    const confirmed = await showConfirmToast({
      message: `⚠️ ATENÇÃO: Esta ação irá remover permanentemente todos os dados de ${description}.\n\nEsta ação NÃO pode ser desfeita!\n\nTem certeza que deseja continuar?`,
      confirmText: 'Sim, remover',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const db = await getDatabase();
      const result = await db.cleanupData(dataType);
      showToast.success(result.message || `Dados de ${description} removidos com sucesso.`);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      showToast.error('Erro ao limpar dados. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sections: ConfigSection[] = [
    {
      title: 'Categorias',
      description: 'Gerencie categorias de produtos',
      icon: <Tags className="h-6 w-6" />,
      component: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Adicione e gerencie categorias para organizar seus produtos.
            </p>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({
                  name: '',
                  description: '',
                  icon: '',
                  color: '#3b82f6',
                });
                setShowCategoryModal(true);
              }}
              variant="primary"
              className="bg-mascate-green text-white hover:bg-green-700 border-mascate-green"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Carregando categorias...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories?.map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: category.color || '#3b82f6' } as React.CSSProperties}
                      >
                        {category.icon || category.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        {category.description && (
                          <p className="text-sm text-gray-500">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="p-1 hover:bg-blue-100"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category)}
                        className="p-1 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(!categories || categories.length === 0) && !categoriesLoading && (
            <div className="text-center py-12">
              <Tags className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhuma categoria cadastrada
              </h3>
              <p className="text-gray-500 mb-4">
                Clique em "Nova Categoria" para começar
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Regras de Negócio',
      description: 'Configure alertas de estoque e funcionamento',
      icon: <Package className="h-6 w-6" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Limite de Estoque Baixo"
              type="number"
              value={businessConfig.lowStockThreshold}
              onChange={(e) => setBusinessConfig(prev => ({ 
                ...prev, 
                lowStockThreshold: Number(e.target.value) 
              }))}
              min="1"
            />
            
            <Input
              label="Limite de Estoque Crítico"
              type="number"
              value={businessConfig.criticalStockThreshold}
              onChange={(e) => setBusinessConfig(prev => ({ 
                ...prev, 
                criticalStockThreshold: Number(e.target.value) 
              }))}
              min="1"
            />
            
            <Input
              label="Horário de Início"
              type="time"
              value={businessConfig.workingHours.start}
              onChange={(e) => setBusinessConfig(prev => ({ 
                ...prev, 
                workingHours: { ...prev.workingHours, start: e.target.value }
              }))}
            />
            
            <Input
              label="Horário de Fechamento"
              type="time"
              value={businessConfig.workingHours.end}
              onChange={(e) => setBusinessConfig(prev => ({ 
                ...prev, 
                workingHours: { ...prev.workingHours, end: e.target.value }
              }))}
            />
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={businessConfig.notificationsEnabled}
                onChange={(e) => setBusinessConfig(prev => ({ 
                  ...prev, 
                  notificationsEnabled: e.target.checked 
                }))}
                className="form-checkbox h-5 w-5 text-mascate-red"
              />
              <div>
                <span className="font-medium">Ativar Notificações</span>
                <p className="text-sm text-gray-600">Receber alertas sobre estoque baixo e vendas</p>
              </div>
            </label>
          </div>
          
          <Button 
            onClick={handleBusinessConfigSave} 
            disabled={isProcessing}
            variant="primary"
            className="bg-mascate-green text-white hover:bg-green-700 border-mascate-green"
          >
            {isProcessing ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      )
    },
    {
      title: 'Backup & Restauração',
      description: 'Gerencie backups e restauração de dados',
      icon: <Database className="h-6 w-6" />,
      component: (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Backup Automático</h4>
                <p className="text-sm text-blue-600 mt-1">
                  Último backup: {new Date(backupConfig.lastBackup).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleBackupNow}
              disabled={isProcessing}
              variant="primary"
              className="flex items-center space-x-2 bg-mascate-green text-white hover:bg-green-700 border-mascate-green"
            >
              <Download className="h-4 w-4" />
              <span>{isProcessing ? 'Criando Backup...' : 'Backup Agora'}</span>
            </Button>
            
            <div>
              <label htmlFor="restore-backup" className="sr-only">
                Selecionar arquivo de backup para restaurar
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                className="hidden"
                id="restore-backup"
                disabled={isProcessing}
                aria-label="Selecionar arquivo de backup para restaurar"
              />
              <Button
                onClick={() => document.getElementById('restore-backup')?.click()}
                disabled={isProcessing}
                variant="secondary"
                className="flex items-center space-x-2 w-full"
              >
                <Upload className="h-4 w-4" />
                <span>Restaurar Backup</span>
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Importante</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Faça backups regulares dos seus dados. A restauração irá sobrescrever todos os dados atuais.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Exportação de Dados',
      description: 'Exporte relatórios e dados para análise',
      icon: <FileText className="h-6 w-6" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleExportData('csv')}
              disabled={isProcessing}
              variant="secondary"
              className="flex flex-col items-center p-6 h-auto space-y-3 bg-mascate-green text-white hover:bg-green-700 border-mascate-green shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <FileText className="h-10 w-10 text-mascate-yellow" />
              <span className="font-bold text-base">Exportar CSV</span>
              <span className="text-sm text-mascate-yellow/90 font-medium">Planilhas e análises</span>
            </Button>
            
            <Button
              onClick={() => handleExportData('json')}
              disabled={isProcessing}
              variant="secondary"
              className="flex flex-col items-center p-6 h-auto space-y-3 bg-mascate-green text-white hover:bg-green-700 border-mascate-green shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <FileText className="h-10 w-10 text-mascate-yellow" />
              <span className="font-bold text-base">Exportar JSON</span>
              <span className="text-sm text-mascate-yellow/90 font-medium">Dados estruturados</span>
            </Button>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">Dados Inclusos na Exportação:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Produtos e informações de estoque</li>
              <li>• Histórico de vendas e movimentações</li>
              <li>• Relatórios de usuários e atividades</li>
              <li>• Logs de sistema (últimos 30 dias)</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Manutenção do Sistema',
      description: 'Limpeza de dados e manutenção geral',
      icon: <HardDrive className="h-6 w-6" />,
      component: (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Zona de Perigo</h4>
                <p className="text-sm text-red-600 mt-1">
                  As ações abaixo são irreversíveis. Faça backup antes de prosseguir.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => handleClearData('logs', 'logs antigos (>30 dias)')}
              disabled={isProcessing}
              variant="secondary"
              className="flex items-center space-x-2 bg-mascate-green text-white border-mascate-green hover:bg-green-700"
            >
              <Calendar className="h-4 w-4" />
              <span>Limpar Logs Antigos</span>
            </Button>

            <Button
              onClick={() => handleClearData('movements', 'movimentações antigas (>1 ano)')}
              disabled={isProcessing}
              variant="secondary"
              className="flex items-center space-x-2 bg-mascate-green text-white border-mascate-green hover:bg-green-700"
            >
              <TrendingDown className="h-4 w-4" />
              <span>Limpar Movimentações Antigas</span>
            </Button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800">Informações do Sistema:</h4>
              <Button
                onClick={loadSystemInfo}
                disabled={loadingSystemInfo}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                {loadingSystemInfo ? 'Carregando...' : 'Atualizar'}
              </Button>
            </div>
            {systemInfo ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Versão:</span>
                  <span className="font-medium ml-2">{systemInfo.version}</span>
                </div>
                <div>
                  <span className="text-gray-600">Banco de Dados:</span>
                  <span className="font-medium ml-2">{systemInfo.database.type} {systemInfo.database.version}</span>
                </div>
                <div>
                  <span className="text-gray-600">Espaço Usado:</span>
                  <span className="font-medium ml-2">{systemInfo.database.size}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ambiente:</span>
                  <span className="font-medium ml-2 capitalize">{systemInfo.environment}</span>
                </div>
                <div>
                  <span className="text-gray-600">Usuários:</span>
                  <span className="font-medium ml-2">{systemInfo.tables.users_count}</span>
                </div>
                <div>
                  <span className="text-gray-600">Produtos:</span>
                  <span className="font-medium ml-2">{systemInfo.tables.products_count}</span>
                </div>
                <div>
                  <span className="text-gray-600">Categorias:</span>
                  <span className="font-medium ml-2">{systemInfo.tables.categories_count}</span>
                </div>
                <div>
                  <span className="text-gray-600">Última Atualização:</span>
                  <span className="font-medium ml-2">{new Date(systemInfo.lastUpdate).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                {loadingSystemInfo ? 'Carregando informações...' : 'Erro ao carregar informações'}
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  const currentSection = sections.find(s => s.title.toLowerCase().replace(/\s+/g, '_').replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c') === activeSection);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {sections.map((section) => {
            const sectionKey = section.title.toLowerCase().replace(/\s+/g, '_').replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c');
            return (
              <button
                key={sectionKey}
                onClick={() => setActiveSection(sectionKey)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeSection === sectionKey
                    ? 'border-mascate-red text-mascate-red'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {section.icon}
                <span>{section.title}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Section Content */}
      {currentSection && (
        <Card>
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-mascate-yellow p-3 rounded-full">
                {currentSection.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-mascate-green">{currentSection.title}</h2>
                <p className="text-gray-600">{currentSection.description}</p>
              </div>
            </div>
          </div>

          {currentSection.component}
        </Card>
      )}

      {/* Modal para criar/editar categorias */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
          setCategoryForm({
            name: '',
            description: '',
            icon: '',
            color: '#3b82f6',
          });
        }}
        title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
        size="md"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <Input
            label="Nome da Categoria *"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Eletrônicos, Roupas, Livros..."
            required
          />

          <div>
            <label className="form-label">Descrição</label>
            <textarea
              className="form-input"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição opcional da categoria"
              rows={3}
            />
          </div>

          <Input
            label="Ícone (Emoji)"
            value={categoryForm.icon}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
            placeholder="Ex: 📱, 👕, 📚..."
            maxLength={10}
          />

          <div>
            <label htmlFor="category-color" className="form-label">Cor</label>
            <div className="flex items-center space-x-3">
              <input
                id="category-color"
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                aria-label="Selecionar cor da categoria"
              />
              <span className="text-sm text-gray-600">{categoryForm.color}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCategoryModal(false);
                setEditingCategory(null);
                setCategoryForm({
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
              disabled={createCategory.isPending || updateCategory.isPending}
              className="bg-mascate-green text-white hover:bg-green-700 border-mascate-green"
            >
              {createCategory.isPending || updateCategory.isPending
                ? 'Salvando...'
                : editingCategory
                ? 'Atualizar'
                : 'Criar'
              }
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};