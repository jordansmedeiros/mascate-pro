import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '../context/AuthContext';

export const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    const result = await login(formData.email.trim(), formData.password);
    
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
    <div className="min-h-screen bg-mascate-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Form Card */}
        <Card className="shadow-xl border-0 bg-mascate-red backdrop-blur-sm">
          {/* Logo/Identidade Visual */}
          <div className="text-center mb-4">
            <div className="mb-4">
              <img 
                src="/image.png" 
                alt="Logo" 
                className="w-48 h-48 mx-auto object-contain"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-white mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Digite seu email"
                  autoComplete="email"
                  autoFocus
                  className="w-full h-12 px-3 py-2 border border-red-400 rounded-lg focus:ring-2 focus:ring-white focus:border-white bg-white/90 text-base"
                />
              </div>

              <div className="relative space-y-1">
                <label className="block text-sm font-medium text-white mb-1">Senha</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  className="w-full h-12 px-3 py-2 border border-red-400 rounded-lg focus:ring-2 focus:ring-white focus:border-white bg-white/90 text-base pr-12"
                />
                <button
                  type="button"
                  className="absolute right-3 top-10 text-gray-500 hover:text-mascate-red transition-colors z-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-mascate-yellow text-mascate-green hover:bg-yellow-400 hover:text-green-800 border-mascate-yellow text-lg font-bold shadow-lg transition-all duration-200 hover:shadow-xl"
              size="lg"
              isLoading={isLoading}
              disabled={!formData.email.trim() || !formData.password.trim()}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>

      </div>
    </div>
  );
};