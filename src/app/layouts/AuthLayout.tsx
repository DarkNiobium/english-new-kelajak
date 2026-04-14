import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 overflow-hidden relative">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-50/50 blur-[120px] rounded-full" />
      </div>

      {/* Structural Mesh Overlay */}
      <div className="absolute inset-0 bg-grid-slate-50 [mask-image:linear-gradient(to_bottom,white,transparent,transparent,white)] opacity-20 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg z-10 flex flex-col items-center"
      >
        <Outlet />
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">
        English new kelajak (ENK) // Learning Platform
      </div>
    </div>
  );
};
