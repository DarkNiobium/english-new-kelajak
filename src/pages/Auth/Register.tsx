import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Card, CardContent } from '@/shared/ui/Card';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useGoogleLogin } from '@react-oauth/google';
import { useUserStore } from '@/entities/user/store';
import { motion } from 'framer-motion';

const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const RegisterPage = () => {
  const navigate = useNavigate();
  const login = useUserStore(state => state.login);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async () => {
    await new Promise(r => setTimeout(r, 1000));
    navigate('/login');
  };

  const onGoogleSignup = useGoogleLogin({
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
         <div className="h-14 w-14 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100">ENK</div>
         <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">Create Account</h1>
         <p className="text-slate-500 font-medium text-lg leading-tight">Start your journey to English fluency today.</p>
      </div>

      <Card className="border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden p-2 bg-white">
        <CardContent className="p-10 space-y-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => onGoogleSignup()}
            disabled={isGoogleLoading}
            className="w-full h-14 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 shadow-sm transition-all font-bold text-sm text-slate-600 group"
          >
            {isGoogleLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : <GoogleIcon />}
            {isGoogleLoading ? 'Joining...' : 'Join with Google'}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-100" />
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-white px-4 text-slate-300">or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input 
              icon={<User className="h-4 w-4 text-slate-300" />} 
              placeholder="Full Name" 
              {...register('name')}
              className="bg-slate-50 border-none h-14 rounded-2xl text-slate-900 placeholder:text-slate-300 font-medium"
            />
            <Input 
              icon={<Mail className="h-4 w-4 text-slate-300" />} 
              placeholder="Email Address" 
              type="email"
              {...register('email')}
              className="bg-slate-50 border-none h-14 rounded-2xl text-slate-900 placeholder:text-slate-300 font-medium"
            />
            <Input 
              icon={<Lock className="h-4 w-4 text-slate-300" />} 
              placeholder="Create Password" 
              type="password"
              {...register('password')}
              className="bg-slate-50 border-none h-14 rounded-2xl text-slate-900 placeholder:text-slate-300 font-medium"
            />
            
            <Button 
              className="w-full h-16 rounded-[2rem] text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 mt-6 group" 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : (
                <span className="flex items-center gap-2">
                  Create Account <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-10 text-center text-sm font-medium text-slate-500">
         Already have an account?{' '}
         <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
            Sign In
         </Link>
      </div>
    </motion.div>
  );
};
