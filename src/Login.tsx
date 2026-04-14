import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/Button';
import { Input } from '@/Input';
import { Card, CardContent } from '@/Card';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useUserStore } from '@/userStore';
import { useGoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useUserStore(state => state.login);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    await new Promise(r => setTimeout(r, 800));
    login({
      id: 'demo-user',
      name: 'Abubakr Pioneer',
      email: data.email,
      xp: 2450,
      streak: 12,
      level: 'B2'
    });
    navigate('/dashboard');
  };

  const onGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());
        
        login({
          id: userInfo.sub,
          name: userInfo.name,
          email: userInfo.email,
          xp: 0,
          streak: 0,
          level: 'A1'
        });
        navigate('/dashboard');
      } catch (err) {
        console.error("Auth Exception", err);
      } finally {
        setIsGoogleLoading(false);
      }
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[440px] px-6"
    >
      <div className="text-center mb-12 space-y-4">
         <div className="h-12 w-12 rounded-lg bg-indigo-600 mx-auto flex items-center justify-center text-white font-bold text-xl">E</div>
         <h1 className="text-4xl font-bold text-slate-900 leading-tight">Welcome Back</h1>
         <p className="text-slate-500 font-medium text-lg leading-tight">Continue your learning journey with E.</p>
      </div>

      <Card className="border border-slate-100 shadow-lg rounded-2xl overflow-hidden p-2 bg-white">
        <CardContent className="p-8 space-y-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onGoogleLogin()}
            disabled={isGoogleLoading}
            className="w-full h-12 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 shadow-sm transition-all font-bold text-sm text-slate-600 group"
          >
            {isGoogleLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : <GoogleIcon />}
            {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-100" />
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-white px-4 text-slate-300">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <Input 
                icon={<Mail className="h-4 w-4 text-slate-300" />} 
                placeholder="Email Address" 
                type="email"
                {...register('email')}
                error={errors.email?.message}
                className="bg-slate-50 border-none h-12 rounded-lg text-slate-900 placeholder:text-slate-300 font-medium"
              />
              <Input 
                icon={<Lock className="h-4 w-4 text-slate-300" />} 
                placeholder="Password" 
                type="password"
                {...register('password')}
                error={errors.password?.message}
                className="bg-slate-50 border-none h-12 rounded-lg text-slate-900 placeholder:text-slate-300 font-medium"
              />
            </div>
            
            <Button 
              className="w-full h-16 rounded-lg text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-50 group" 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-10 text-center text-sm font-medium text-slate-500">
         Don't have an account?{' '}
         <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
            Sign Up
         </Link>
      </div>
    </motion.div>
  );
};
