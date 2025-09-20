import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from "@/features/auth/hooks/useAuth"
import { Key, Eye, EyeOff, Shield } from 'lucide-react';

export const ChangePasswordPage: React.FC = () => {
  const { user } = useAuth();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      alert('A nova senha e a confirmação não coincidem!');
      return;
    }

    if (formData.newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulação da alteração de senha
      // Em um sistema real, você faria uma chamada para a API aqui
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Senha alterada com sucesso!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      alert('Erro ao alterar senha. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 'progress-0', label: '', color: '' };
    if (password.length < 6) return { strength: 'progress-25', label: 'Muito fraca', color: 'bg-red-500' };
    if (password.length < 8) return { strength: 'progress-50', label: 'Fraca', color: 'bg-orange-500' };
    if (password.length < 12) return { strength: 'progress-75', label: 'Boa', color: 'bg-yellow-500' };
    return { strength: 'progress-100', label: 'Forte', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-mascate-yellow p-4 rounded-full">
            <Key className="h-8 w-8 text-mascate-green" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-mascate-green">Segurança da Conta</h2>
            <p className="text-gray-600">Altere sua senha de acesso</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Senha atual */}
          <div>
            <label className="form-label">Senha Atual *</label>
            <div className="relative">
              <Input
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Digite sua senha atual"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nova senha */}
          <div>
            <label className="form-label">Nova Senha *</label>
            <div className="relative">
              <Input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Digite sua nova senha"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Indicador de força da senha */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.strength}`}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{passwordStrength.label}</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirmar nova senha */}
          <div>
            <label className="form-label">Confirmar Nova Senha *</label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Digite novamente sua nova senha"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Validação de confirmação */}
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">As senhas não coincidem</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || formData.newPassword !== formData.confirmPassword}
              className="flex-1 bg-mascate-green text-white hover:bg-green-700 border-mascate-green"
            >
              {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>

      {/* Dicas de segurança */}
      <Card>
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-bold text-mascate-green">Dicas de Segurança</h3>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Use pelo menos 8 caracteres</p>
          <p>• Combine letras maiúsculas e minúsculas</p>
          <p>• Inclua números e símbolos</p>
          <p>• Evite informações pessoais óbvias</p>
          <p>• Não use a mesma senha em outros serviços</p>
        </div>
      </Card>
    </div>
  );
};