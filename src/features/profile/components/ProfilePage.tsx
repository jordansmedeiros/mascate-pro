import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useUpdateUser } from '@/features/users/hooks/useUsers';
import { AVAILABLE_AVATARS, getAvatarIcon } from '@/constants/avatars';
import { showToast } from '@/components/ui/Toast';
import { User, Mail, Shield } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const updateUser = useUpdateUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    displayName: user?.displayName || '',
    avatarId: user?.avatarId || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      await updateUser.mutateAsync({
        id: user.id,
        updates: formData
      });
      
      setIsEditing(false);
      showToast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showToast.error(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      displayName: user?.displayName || '',
      avatarId: user?.avatarId || '',
    });
    setIsEditing(false);
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'superadmin': return '👑 Super Administrador';
      case 'admin': return '🔧 Administrador';
      case 'user': return '👤 Usuário';
      default: return role;
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Informações do perfil */}
      <Card>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
            <div className="bg-mascate-yellow p-4 rounded-full text-2xl">
              {getAvatarIcon(user?.avatarId)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-mascate-green">Informações Pessoais</h2>
              <p className="text-gray-600">Atualize seus dados básicos</p>
            </div>
          </div>
          
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <span>Editar</span>
            </Button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nome de Usuário (login)"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Digite seu nome de usuário"
              required
              disabled
              className="bg-gray-50"
            />
            
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Digite seu email"
              required
            />

            <Input
              label="Nome de Exibição"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Digite seu nome de exibição"
              required
            />

            <div>
              <label className="form-label">Escolha seu Avatar</label>
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

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={updateUser.isPending}
                className="flex-1 bg-mascate-green text-white hover:bg-green-700 border-mascate-green"
              >
                {updateUser.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={updateUser.isPending}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Nome de Exibição</p>
                  <p className="font-semibold text-gray-900">{user.displayName || user.username}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{user.email || 'Não informado'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-5 w-5 text-xl flex items-center justify-center">{getAvatarIcon(user.avatarId)}</div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Avatar</p>
                  <p className="font-semibold text-gray-900">Avatar selecionado</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Nível de Acesso</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                    {getRoleDisplay(user.role)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-5 w-5 rounded-full bg-green-400"></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="font-semibold text-green-600">Ativo</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Informações da conta */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-mascate-green">Informações da Conta</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Data de Criação</p>
              <p className="font-semibold text-gray-900">
                {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            
            {user.updated_at && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Última Atualização</p>
                <p className="font-semibold text-gray-900">
                  {new Date(user.updated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            
            {user.last_login && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Último Login</p>
                <p className="font-semibold text-gray-900">
                  {new Date(user.last_login).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};