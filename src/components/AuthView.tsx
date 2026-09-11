import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export const AuthView: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    authError,
    setAuthError,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill name if email is laispsiqueira@gmail.com
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val.toLowerCase().trim() === 'laispsiqueira@gmail.com' && !name) {
      setName('Lais Siqueira');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    try {
      if (mode === 'register') {
        const finalName = email.toLowerCase().trim() === 'laispsiqueira@gmail.com' ? 'Lais Siqueira' : name;
        await registerWithEmail(finalName || 'Usuário', email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      // Error is caught and set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Logo */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-[#EAF2EB] text-[#244E33] border border-[#C5DDCB] text-xs font-semibold tracking-wide mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#2C5F3E]" />
          <span>plan.me • Clareza Operacional</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#242220]">
          {mode === 'login' ? 'Acesse seu Planejamento' : 'Crie sua Conta'}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#69635C] max-w-sm mx-auto">
          Organizamos primeiro, automatizamos depois. Suas tarefas e rotinas salvas no banco de dados e visíveis apenas para você.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#FFFFFF] py-8 px-6 shadow-xs border border-[#E8E2D8] rounded-2xl sm:px-10 space-y-6">
          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl bg-[#F5F1E9] p-1 border border-[#E8E1D5]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#242220] shadow-2xs'
                  : 'text-[#7B746D] hover:text-[#242220]'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setAuthError(null);
                if (email.toLowerCase().trim() === 'laispsiqueira@gmail.com' && !name) {
                  setName('Lais Siqueira');
                }
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#242220] shadow-2xs'
                  : 'text-[#7B746D] hover:text-[#242220]'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="p-3 rounded-xl bg-[#FDF2F0] border border-[#F5C7C1] text-[#9E3426] text-xs leading-relaxed animate-fadeIn">
              {authError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-[#4D4740] mb-1.5 flex items-center space-x-1">
                  <UserIcon className="w-3.5 h-3.5 text-[#7B746D]" />
                  <span>Seu Nome Completo</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs sm:text-sm text-[#242220] placeholder-[#9E978F] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#4D4740] mb-1.5 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-[#7B746D]" />
                <span>E-mail</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="email@dominio.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs sm:text-sm text-[#242220] placeholder-[#9E978F] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4D4740] mb-1.5 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-[#7B746D]" />
                <span>Senha</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs sm:text-sm text-[#242220] placeholder-[#9E978F] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2D332F] text-[#FAF8F5] text-xs sm:text-sm font-semibold hover:bg-[#1E2320] transition-all cursor-pointer shadow-2xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{mode === 'login' ? 'Entrar no Sistema' : 'Finalizar Cadastro'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EAE4D9]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-[#968E84]">Ou continue com</span>
            </div>
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={isLoading || submitting}
            className="w-full py-2.5 px-4 rounded-xl border border-[#D9D1C5] bg-[#FFFFFF] text-[#242220] text-xs sm:text-sm font-medium hover:bg-[#FAF8F5] hover:border-[#385A48] transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Entrar com conta Google</span>
          </button>

          {/* Privacy & Isolation Note */}
          <div className="pt-2 flex items-start space-x-2 text-[11px] text-[#7B746D]">
            <ShieldCheck className="w-4 h-4 text-[#385A48] shrink-0 mt-0.5" />
            <p>
              Segurança por isolamento: Suas tarefas e rotinas pertencem unicamente ao seu usuário e não são compartilhadas com outros usuários do sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
