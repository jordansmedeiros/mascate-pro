import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AVAILABLE_AVATARS, getAvatarIcon } from '@/constants/avatars';
import { showToast, showConfirmToast } from '@/components/ui/Toast';
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
  email: string;
  displayName: string;
  password?: string;
  avatarId: string;
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
    email: '',
    displayName: '',
    password: '',
    avatarId: AVAILABLE_AVATARS[0].id,
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
        displayName: '',
        avatarId: AVAILABLE_AVATARS[0].id,
        role: 'user',
        active: true
      });
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      showToast.error(error instanceof Error ? error.message : 'Erro ao salvar usuário');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      displayName: user.displayName || '',
      avatarId: user.avatarId || AVAILABLE_AVATARS[0].id,
      role: user.role,
      active: user.active
    });
    setShowForm(true);
  };

  const handleDelete = async (user: User) => {
    const confirmed = await showConfirmToast({
      message: `Tem certeza que deseja desativar o usuário "${user.displayName || user.username}"?`,
      confirmText: 'Desativar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await deleteUser.mutateAsync(user.id);
        showToast.success('Usuário desativado com sucesso!');
      } catch (error) {
        console.error('Erro ao desativar usuário:', error);
        showToast.error(error instanceof Error ? error.message : 'Erro ao desativar usuário');
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
      showToast.error(error instanceof Error ? error.message : 'Erro ao alterar status do usuário');
    }
  };

  const handleResetPassword = async (user: User) => {
    const confirmed = await showConfirmToast({
      message: `Resetar a senha do usuário "${user.displayName || user.username}"? Uma nova senha será gerada.`,
      confirmText: 'Resetar',
      cancelText: 'Cancelar',
      type: 'warning'
    });

    if (confirmed) {
      try {
        const result = await resetPassword.mutateAsync(user.id);
        setResetResult(result);
        showToast.success('Senha resetada com sucesso!');
      } catch (error) {
        console.error('Erro ao resetar senha:', error);
        showToast.error(error instanceof Error ? error.message : 'Erro ao resetar senha');
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
      <div className="flex items-center justify-end">
        <Button
          variant="primary"
          onClick={() => {
            setEditingUser(null);
            setFormData({
              username: '',
              email: '',
              displayName: '',
              avatarId: AVAILABLE_AVATARS[0].id,
              role: 'user',
              active: true
            });
            setShowForm(!showForm);
          }}
          className="bg-mascate-green text-white hover:bg-green-700 border-mascate-green shadow-md transition-all duration-200 hover:shadow-lg"
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

      {/* Estatísticas de Usuários - Movido para o topo */}
      {users && users.length > 0 && (
        <Card title="📊 Estatísticas de Usuários">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-blue-600 mb-2">{users.length}</div>
              <div className="text-sm text-gray-600 font-medium">Total de usuários</div>
            </div>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {users.filter(u => u.active).length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Ativos</div>
            </div>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {users.filter(u => u.role === 'superadmin').length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Super Admins</div>
            </div>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-mascate-600 mb-2">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Administradores</div>
            </div>
          </div>
        </Card>
      )}

      {/* Formulário */}
      {showForm && (
        <Card title={editingUser ? '✏️ Editar Usuário' : '➕ Novo Usuário'}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome de Usuário (login) *"
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
              
              <Input
                label="Nome de Exibição *"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Ex: João Silva"
                required
              />
            </div>

            <div>
              <label className="form-label">Avatar *</label>
              <div className="grid grid-cols-6 gap-3 mt-2">
                {AVAILABLE_AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatarId: avatar.id }))}
                    className={`p-3 rounded-lg text-2xl transition-all duration-200 ${
                      formData.avatarId === avatar.id
                        ? 'bg-mascate-yellow border-2 border-mascate-green shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                    title={avatar.description}
                  >
                    {avatar.icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" variant="primary" className="flex-1 bg-mascate-green text-white hover:bg-green-700 border-mascate-green">
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

      {/* Lista de Usuários com altura padronizada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {users?.map(user => (
          <Card key={user.id} className={`h-full flex flex-col ${!user.active ? 'bg-gray-50 border-gray-300' : ''}`}>
            <div className="flex flex-col h-full space-y-3">
              {/* Cabeçalho do usuário */}
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-mascate-yellow p-2 rounded-full text-xl">
                    {getAvatarIcon(user.avatarId)}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg truncate ${!user.active ? 'text-gray-500' : 'text-gray-900'}`}>
                      {user.displayName || user.username}
                    </h3>
                    <p className={`text-sm truncate ${!user.active ? 'text-gray-400' : 'text-gray-600'}`}>
                      @{user.username}
                    </p>
                  </div>
                  {!user.active && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium flex-shrink-0">
                      INATIVO
                    </span>
                  )}
                </div>
                <p className={`text-sm truncate ${!user.active ? 'text-gray-400' : 'text-gray-600'}`} title={user.email}>
                  {user.email}
                </p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getRoleBadgeClass(user.role)}`}>
                  {getRoleDisplay(user.role)}
                </span>
              </div>

              {/* Informações adicionais */}
              <div className="flex-grow">
                <div className="text-xs text-gray-500 space-y-1">
                  <div>📅 Criado: {new Date(user.created_at).toLocaleDateString('pt-BR')}</div>
                  {user.last_login && (
                    <div>🕐 Último login: {new Date(user.last_login).toLocaleDateString('pt-BR')}</div>
                  )}
                  {user.updated_at && (
                    <div>✏️ Atualizado: {new Date(user.updated_at).toLocaleDateString('pt-BR')}</div>
                  )}
                </div>
              </div>

              {/* Ações - sempre no final do card */}
              <div className="flex-shrink-0 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(user)}
                    className="hover:bg-blue-100 justify-center"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(user)}
                    className={`justify-center ${user.active ? "hover:bg-red-100" : "hover:bg-green-100"}`}
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
                    className="hover:bg-orange-100 justify-center"
                  >
                    <Key className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(user)}
                    className="hover:bg-red-100 text-red-600 justify-center"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                </div>
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
    </div>
  );
};