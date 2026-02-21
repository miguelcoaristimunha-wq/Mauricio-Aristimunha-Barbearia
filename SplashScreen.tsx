
import React, { useEffect, useState } from 'react';
import { ShopConfig } from './types';
import logoImg from './logo.jpg';

export const SplashScreen: React.FC<{ onFinish: () => void; shopConfig: ShopConfig | null }> = ({ onFinish, shopConfig }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(onFinish, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const appNameParts = shopConfig?.app_name ? shopConfig.app_name.split(' ') : ['Maurício', 'Aristimunha'];
  const firstName = appNameParts[0];
  const restName = appNameParts.slice(1).join(' ');

  return (
    <div
      onClick={onFinish}
      className={`fixed inset-0 z-[100] bg-premium-black flex flex-col items-center justify-center transition-opacity duration-1000 cursor-pointer ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className={`flex flex-col items-center transition-all duration-1000 transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="w-28 h-28 rounded-full overflow-hidden mb-6 shadow-gold-glow-strong border-2 border-gold/50 active:scale-95 transition-transform bg-premium-gray flex items-center justify-center">
          <img
            src={shopConfig?.admin_photo || logoImg}
            alt={shopConfig?.app_name || 'Barbearia'}
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="font-display text-3xl text-gold text-center tracking-widest uppercase mb-2">
          {firstName} <br /> {restName}
        </h1>
        <p className="text-gray-500 text-xs font-bold tracking-[0.3em] uppercase">Barbearia Premium</p>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center">
        <div className="w-1 h-12 bg-premium-gray rounded-full overflow-hidden opacity-20">
          <div className="w-full h-full bg-gold origin-top animate-[scaleY_3s_ease-in-out_infinite]"></div>
        </div>
      </div>

      <style>{`
        @keyframes scaleY {
          0% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          51% { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }
      `}</style>
    </div>
  );
};
