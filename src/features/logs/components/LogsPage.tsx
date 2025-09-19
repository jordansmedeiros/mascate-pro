import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  ScrollText, 
  Filter,
  Download, 
  Calendar,
  User,
  Activity,
  Eye,
  RefreshCw
} from 'lucide-react';
import { 
  useLogs, 
  useLogStats,
  formatActionName,
  getActionColorClass,
  type LogFilters 
} from '@/features/logs/hooks/useLogs';
import { useUsers } from '@/features/users/hooks/useUsers';

export const LogsPage: React.FC = () => {
  const [filters, setFilters] = useState<LogFilters>({
    limit: 50,
    offset: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: logsData, isLoading, refetch } = useLogs(filters);
  const { data: statsData, isLoading: statsLoading } = useLogStats();
  const { data: users } = useUsers();

  // Pagination
  const handleLoadMore = () => {
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 50)
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      limit: 50,
      offset: 0
    });
  };

  // Export functionality
  const handleExportLogs = () => {
    if (!logsData?.logs) return;
    
    const csvContent = [
      // Header
      ['Data/Hora', 'Usuário', 'Ação', 'Detalhes', 'IP'].join(','),
      // Rows
      ...logsData.logs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.user?.username || 'N/A',
        log.action,
        `"${log.details}"`,
        log.ip_address || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_mascate_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Unique actions for filter dropdown
  const uniqueActions = useMemo(() => {
    if (!logsData?.logs) return [];
    const actions = [...new Set(logsData.logs.map(log => log.action))];
    return actions.sort();
  }, [logsData?.logs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="Carregando logs..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Ocultar Filtros' : 'Filtros'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => refetch()}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            variant="primary"
            onClick={handleExportLogs}
            disabled={!logsData?.logs || logsData.logs.length === 0}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {!statsLoading && statsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{statsData.totalLogs}</div>
              <div className="text-sm text-gray-600">Total de logs</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statsData.todayLogs}</div>
              <div className="text-sm text-gray-600">Hoje</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{statsData.yesterdayLogs}</div>
              <div className="text-sm text-gray-600">Ontem</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-mascate-600">{statsData.topUsers.length}</div>
              <div className="text-sm text-gray-600">Usuários ativos</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(statsData.actionCounts).length}
              </div>
              <div className="text-sm text-gray-600">Tipos de ação</div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <Card title="🔍 Filtros de Busca">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por usuário */}
            <div>
              <label className="form-label">
                <User className="h-4 w-4 inline mr-1" />
                Usuário
              </label>
              <select
                className="form-input"
                value={filters.userId || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  userId: e.target.value || undefined,
                  offset: 0 
                }))}
              >
                <option value="">Todos os usuários</option>
                {users?.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por ação */}
            <div>
              <label className="form-label">
                <Activity className="h-4 w-4 inline mr-1" />
                Tipo de Ação
              </label>
              <select
                className="form-input"
                value={filters.action || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  action: e.target.value || undefined,
                  offset: 0 
                }))}
              >
                <option value="">Todas as ações</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>
                    {formatActionName(action)}
                  </option>
                ))}
              </select>
            </div>

            {/* Data início */}
            <div>
              <label className="form-label">
                <Calendar className="h-4 w-4 inline mr-1" />
                Data Início
              </label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  startDate: e.target.value || undefined,
                  offset: 0 
                }))}
              />
            </div>

            {/* Data fim */}
            <div>
              <label className="form-label">
                <Calendar className="h-4 w-4 inline mr-1" />
                Data Fim
              </label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  endDate: e.target.value || undefined,
                  offset: 0 
                }))}
              />
            </div>

            {/* Ações */}
            <div className="md:col-span-2 lg:col-span-4 flex gap-2">
              <Button
                variant="secondary"
                onClick={handleResetFilters}
                className="flex-1"
              >
                🔄 Limpar Filtros
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de Logs */}
      <div className="space-y-3">
        {logsData?.logs.map(log => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between space-x-4">
              {/* Conteúdo principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`font-medium ${getActionColorClass(log.action)}`}>
                    {formatActionName(log.action)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {log.user?.username || 'Usuário desconhecido'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.user?.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                    log.user?.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {log.user?.role}
                  </span>
                </div>
                
                <p className="text-gray-700 text-sm mb-2">
                  {log.details}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>
                    📅 {new Date(log.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span>
                    🕐 {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                  </span>
                  {log.ip_address && (
                    <span>
                      🌐 {log.ip_address}
                    </span>
                  )}
                </div>
              </div>

              {/* Indicador visual da ação */}
              <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-2 ${
                log.action.includes('SUCCESS') || log.action.includes('CREATED') ? 'bg-green-400' :
                log.action.includes('FAILED') || log.action.includes('DELETED') ? 'bg-red-400' :
                log.action.includes('UPDATED') ? 'bg-yellow-400' :
                'bg-blue-400'
              }`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Load More / Estado vazio */}
      {logsData?.logs && logsData.logs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ScrollText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum log encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Não há logs que correspondam aos filtros aplicados.
            </p>
            {(filters.userId || filters.action || filters.startDate || filters.endDate) && (
              <Button
                variant="secondary"
                onClick={handleResetFilters}
              >
                🔄 Limpar Filtros
              </Button>
            )}
          </div>
        </Card>
      ) : logsData?.hasMore ? (
        <div className="text-center">
          <Button
            variant="secondary"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="flex items-center mx-auto"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Carregar Mais Logs
              </>
            )}
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Mostrando {logsData?.logs?.length || 0} de {logsData?.total || 0} logs
          </p>
        </div>
      ) : logsData?.logs && logsData.logs.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            ✅ Todos os logs foram carregados ({logsData.logs.length} total)
          </p>
        </div>
      )}

      {/* Usuários mais ativos */}
      {!statsLoading && statsData?.topUsers && statsData.topUsers.length > 0 && (
        <Card title="👥 Usuários Mais Ativos">
          <div className="space-y-3">
            {statsData.topUsers.slice(0, 5).map((userActivity, index) => (
              <div key={userActivity.user?.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-300 text-orange-900' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{userActivity.user?.username}</div>
                    <div className="text-sm text-gray-500">{userActivity.user?.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-mascate-600">{userActivity.activityCount}</div>
                  <div className="text-xs text-gray-500">ações</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};