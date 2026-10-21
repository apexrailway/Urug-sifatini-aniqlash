import React from 'react';
import { SeedBox } from '../types';

interface SeedTableProps {
  seeds: SeedBox[];
}

export const SeedTable: React.FC<SeedTableProps> = ({ seeds }) => {
  if (!seeds || seeds.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Urug'lar jadvali</h4>
        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-medium">
          {seeds.length} ta don
        </span>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="text-left px-4 py-2 text-gray-500 font-semibold">#</th>
              <th className="text-left px-4 py-2 text-gray-500 font-semibold">Holati</th>
              <th className="text-center px-4 py-2 text-gray-500 font-semibold">Pozitsiya</th>
              <th className="text-center px-4 py-2 text-gray-500 font-semibold">O'lcham</th>
            </tr>
          </thead>
          <tbody>
            {seeds.map((seed, idx) => {
              const isBroken = seed.type === 'broken';
              const [ymin, xmin, ymax, xmax] = seed.box_2d;
              const width = ((xmax - xmin) / 10).toFixed(1);
              const height = ((ymax - ymin) / 10).toFixed(1);
              
              return (
                <tr 
                  key={idx}
                  className={`border-b border-gray-50 transition-colors ${
                    isBroken ? 'hover:bg-red-50/50' : 'hover:bg-green-50/50'
                  }`}
                >
                  <td className="px-4 py-2 text-gray-600 font-mono">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      isBroken 
                        ? 'bg-red-50 text-red-700 border border-red-100' 
                        : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isBroken ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      {isBroken ? 'Yaroqsiz' : "Sog'lom"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-gray-500 font-mono text-[10px]">
                    ({xmin}, {ymin})
                  </td>
                  <td className="px-4 py-2 text-center text-gray-500 font-mono text-[10px]">
                    {width}% × {height}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
