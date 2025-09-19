import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Users, Plus, Edit3, Trash2, Key, UserCheck, UserX } from 'lucide-react';
import { 
  useUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser, 
  useResetUserPassword 
} from '@/features/users/hooks/useUsers';
import type { User } from '@/types';

interface UserFormData {
  username: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  active: boolean;
}

export const UsersPage: React.FC = () => {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetUserPassword();
  
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    role: 'user',
    active: true
  });

  const [resetResult, setResetResult] = useState<{ username: string; newPassword: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await updateUser.mutateAsync({ 
          id: editingUser.id, 
          updates: formData 
        });
        setEditingUser(null);
      } else {
        await createUser.mutateAsync(formData);
      }
      
      setFormData({
        username: '',
        email: '',
        role: 'user',
        active: true
      });
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar usuário');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      role: user.role,
      active: user.active
    });
    setShowForm(true);
  };

  const handleDelete = async (user: User) => {
    if (confirm(`Tem certeza que deseja desativar o usuário "${user.username}"?`)) {
      try {
        await deleteUser.mutateAsync(user.id);
      } catch (error) {
        console.error('Erro ao desativar usuário:', error);
        alert(error instanceof Error ? error.message : 'Erro ao desativar usuário');
      }
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        updates: { active: !user.active }
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert(error instanceof Error ? error.message : 'Erro ao alterar status do usuário');
    }
  };

  const handleResetPassword = async (user: User) => {
    if (confirm(`Resetar a senha do usuário "${user.username}"? Uma nova senha será gerada.`)) {
      try {
        const result = await resetPassword.mutateAsync(user.id);
        setResetResult(result);
      } catch (error) {
        console.error('Erro ao resetar senha:', error);
        alert(error instanceof Error ? error.message : 'Erro ao resetar senha');
      }
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'superadmin': return '👑 Super Admin';
      case 'admin': return '🔧 Administrador';
      case 'user': return '👤 Usuário';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="Carregando usuários..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mascate-900">👥 Gestão de Usuários</h1>
        <Button
          variant="primary"
          onClick={() => {
            setEditingUser(null);
            setFormData({
              username: '',
              email: '',
              role: 'user',
              active: true
            });
            setShowForm(!showForm);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancelar' : 'Novo Usuário'}
        </Button>
      </div>

      {/* Modal de senha resetada */}
      {resetResult && (
        <Card className="border-green-300 bg-green-50">
          <div className="text-center p-4">
            <h3 className="font-bold text-green-800 mb-2">🔐 Senha Resetada!</h3>
            <p className="text-green-700 mb-2">
              Nova senha para <strong>{resetResult.username}</strong>:
            </p>
            <div className="bg-white p-3 rounded border-2 border-green-300 font-mono text-lg">
              {resetResult.newPassword}
            </div>
            <p className="text-sm text-green-600 mt-2">
              Anote esta senha e repasse ao usuário com segurança.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setResetResult(null)}
              className="mt-3"
            >
              ✅ Entendido
            </Button>
          </div>
        </Card>
      )}

      {/* Formulário */}
      {showForm && (
        <Card title={editingUser ? '✏️ Editar Usuário' : '➕ Novo Usuário'}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome de Usuário *"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Ex: joao.silva"
              required
            />
            
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="joao@empresa.com"
              required
            />
            
            <div>
              <label className="form-label">Nível de Acesso *</label>
              <select
                className="form-input"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  role: e.target.value as 'user' | 'admin' | 'superadmin' 
                }))}
                required
              >
                <option value="user">👤 Usuário - Visualização e operações básicas</option>
                <option value="admin">🔧 Administrador - Gerenciar produtos e estoque</option>
                <option value="superadmin">👑 Super Admin - Acesso total</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="user-active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded border-gray-300 text-mascate-600 focus:ring-mascate-500"
              />
              <label htmlFor="user-active" className="text-sm font-medium text-gray-700">
                Usuário Ativo
              </label>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" variant="primary" className="flex-1">
                {editingUser ? '💾 Salvar Alterações' : '➕ Criar Usuário'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                }}
              >
                ❌ Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de Usuários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {users?.map(user => (
          <Card key={user.id} className={!user.active ? 'bg-gray-50 border-gray-300' : ''}>
            <div className="space-y-3">
              {/* Cabeçalho do usuário */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`font-bold text-lg ${!user.active ? 'text-gray-500' : 'text-gray-900'}`}>
                      {user.username}
                    </h3>
                    {!user.active && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                        INATIVO
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${!user.active ? 'text-gray-400' : 'text-gray-600'}`}>
                    {user.email}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getRoleBadgeClass(user.role)}`}>
                    {getRoleDisplay(user.role)}
                  </span>
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Criado: {new Date(user.created_at).toLocaleDateString('pt-BR')}</div>
                {user.last_login && (
                  <div>Último login: {new Date(user.last_login).toLocaleDateString('pt-BR')} às {new Date(user.last_login).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                )}
                {user.updated_at && (
                  <div>Atualizado: {new Date(user.updated_at).toLocaleDateString('pt-BR')}</div>
                )}
              </div>

              {/* Ações */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(user)}
                  className="hover:bg-blue-100"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(user)}
                  className={user.active ? "hover:bg-red-100" : "hover:bg-green-100"}
                >
                  {user.active ? (
                    <>
                      <UserX className="h-3 w-3 mr-1" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3 w-3 mr-1" />
                      Ativar
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResetPassword(user)}
                  className="hover:bg-orange-100"
                >
                  <Key className="h-3 w-3 mr-1" />
                  Reset Senha
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(user)}
                  className="hover:bg-red-100 text-red-600"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {(!users || users.length === 0) && (
        <Card>
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Clique em "Novo Usuário" para adicionar o primeiro usuário ao sistema
            </p>
          </div>
        </Card>
      )}

      {/* Estatísticas simples */}
      {users && users.length > 0 && (
        <Card title="📊 Estatísticas de Usuários">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-gray-600">Total de usuários</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.active).length}
              </div>
              <div className="text-sm text-gray-600">Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'superadmin').length}
              </div>
              <div className="text-sm text-gray-600">Super Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-mascate-600">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-sm text-gray-600">Administradores</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};