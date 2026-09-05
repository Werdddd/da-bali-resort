import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (time: string) => void;
  initialTime: string;
  label: string;
}

export const TimePickerModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  initialTime, 
  label 
}: TimePickerModalProps) => {
  const [h, setH] = useState(12);
  const [m, setM] = useState(0);
  const [ampm, setAmpm] = useState('AM');

  useEffect(() => {
    if (isOpen && initialTime) {
      const [h24, m24] = initialTime.split(':').map(Number);
      setAmpm(h24 >= 12 ? 'PM' : 'AM');
      setH(h24 % 12 || 12);
      setM(m24);
    }
  }, [isOpen, initialTime]);

  const handleOK = () => {
    let finalH = h;
    if (ampm === 'PM' && h < 12) finalH += 12;
    if (ampm === 'AM' && h === 12) finalH = 0;
    onSelect(`${finalH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[280px] overflow-hidden border border-coffee-100"
      >
        <div className="bg-coffee-900 p-4 text-white text-center">
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-1">{label}</p>
          <h4 className="text-xl font-serif">Select Time</h4>
        </div>

        <div className="p-6 flex justify-around items-center bg-coffee-50/50">
          {/* Hour */}
          <div className="flex flex-col items-center">
            <button onClick={() => setH(prev => prev >= 12 ? 1 : prev + 1)} className="p-2 text-coffee-300 hover:text-coffee-600 transition-colors"><ChevronUp className="h-6 w-6" /></button>
            <span className="text-2xl font-bold text-coffee-900 w-12 text-center">{h.toString().padStart(2, '0')}</span>
            <button onClick={() => setH(prev => prev <= 1 ? 12 : prev - 1)} className="p-2 text-coffee-300 hover:text-coffee-600 transition-colors"><ChevronDown className="h-6 w-6" /></button>
          </div>

          <span className="text-2xl font-bold text-coffee-300 mb-1">:</span>

          {/* Minute */}
          <div className="flex flex-col items-center">
            <button onClick={() => setM(prev => prev >= 30 ? 0 : 30)} className="p-2 text-coffee-300 hover:text-coffee-600 transition-colors"><ChevronUp className="h-6 w-6" /></button>
            <span className="text-2xl font-bold text-coffee-900 w-12 text-center">{m.toString().padStart(2, '0')}</span>
            <button onClick={() => setM(prev => prev <= 0 ? 30 : 0)} className="p-2 text-coffee-300 hover:text-coffee-600 transition-colors"><ChevronDown className="h-6 w-6" /></button>
          </div>

          {/* AM/PM */}
          <div className="flex flex-col items-center ml-2">
            <button onClick={() => setAmpm(prev => prev === 'AM' ? 'PM' : 'AM')} className="p-2 text-coffee-300 hover:text-coffee-600 transition-colors"><ChevronUp className="h-6 w-6" /></button>
            <span className="text-sm font-black text-coffee-900 bg-white px-2 py-1 rounded-lg border border-coffee-100 shadow-sm">{ampm}</span>
            <button onClick={() => setAmpm(prev => prev === 'AM' ? 'PM' : 'AM')} className="p-2 text-coffee-300 hover:text-coffee-600 transition-colors"><ChevronDown className="h-6 w-6" /></button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 bg-white border-t border-coffee-100">
          <button 
            onClick={onClose} 
            className="py-2 text-sm font-bold text-coffee-400 hover:text-coffee-600 transition-colors uppercase tracking-wider"
          >
            CANCEL
          </button>
          <button 
            onClick={handleOK}
            className="py-2 bg-coffee-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-coffee-800 transition-all active:scale-95 uppercase tracking-wider"
          >
            OK
          </button>
        </div>
      </motion.div>
    </div>
  );
};
