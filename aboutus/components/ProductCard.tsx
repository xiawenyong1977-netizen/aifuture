
import React from 'react';
import { Product } from '../types';

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  return (
    <div className="glass-card group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/20">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="bg-blue-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md">
            {product.tag}
          </span>
        </div>
      </div>

      <div className="p-8">
        <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{product.name}</h3>
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{product.description}</p>
        
        <div className="space-y-4">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">AI 模型</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {product.models.map(m => (
                <span key={m} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <div className="flex space-x-3">
              {product.platforms.map(p => (
                <span key={p} className="text-[10px] text-slate-500 font-medium">{p}</span>
              ))}
            </div>
            {product.link !== '#' && (
              <a 
                href={product.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 text-sm font-semibold flex items-center hover:text-blue-400"
              >
                立即体验 
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
