import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuth } from '../context/AuthContext';

export const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    const result = await login(formData.username.trim(), formData.password);
    
    if (!result.success) {
      setError(result.error || 'Erro desconhecido');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mascate-50 via-white to-nightclub-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-mascate-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-mascate-500 to-mascate-600 text-white font-bold text-2xl py-3 px-6 rounded-lg mb-4 shadow-lg">
            🏆 MASCATE RUNERIA
          </div>
          <h1 className="text-2xl font-bold text-mascate-900 mb-2">Sistema de Estoque</h1>
          <p className="text-mascate-700">Casa Noturna da Bebida Xequemate</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Usuário"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Digite seu usuário"
            autoComplete="username"
            autoFocus
          />

          <div className="relative">
            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-mascate-600 hover:text-mascate-800 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <div className="alert-danger">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
            disabled={!formData.username.trim() || !formData.password.trim()}
          >
            <LogIn size={20} className="mr-2" />
            Entrar
          </Button>
        </form>

        {/* Credentials hint */}
        <div className="mt-6 text-xs text-mascate-600 bg-mascate-50 p-4 rounded-lg border border-mascate-200">
          <p className="font-semibold mb-1">🔑 Credenciais padrão:</p>
          <p><strong>Usuário:</strong> admin</p>
          <p><strong>Senha:</strong> admin</p>
          <p className="text-xs text-mascate-500 mt-2">
            * Sistema configurado com SQLite local + dados de exemplo
          </p>
        </div>
      </Card>
    </div>
  );
};