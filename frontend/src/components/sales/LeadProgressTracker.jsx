import React from 'react';
import { Check } from 'lucide-react';

const LeadProgressTracker = ({ currentStatus }) => {
  // Define the sales journey stages
  const stages = [
    { id: 'new', label: 'New', color: 'blue' },
    { id: 'contacted', label: 'Contacted', color: 'yellow' },
    { id: 'quoted', label: 'Quoted', color: 'purple' },
    { id: 'negotiation', label: 'Negotiation', color: 'orange' },
    { id: 'won', label: 'Won', color: 'green' }
  ];

  // Get the index of current status
  const currentIndex = stages.findIndex(s => s.id === currentStatus?.toLowerCase());
  const actualIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="w-full py-3 px-2">
      {/* Metro Line Container */}
      <div className="relative flex items-center justify-between">
        {/* Background Line (Track) */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100/50 -translate-y-1/2 z-0" />
        
        {/* Progress Line (Active Track - Green) */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-green-500 to-green-400 -translate-y-1/2 z-0 transition-all duration-1000"
          style={{ 
            width: `${(actualIndex / (stages.length - 1)) * 100}%`,
          }}
        />

        {/* Stations (Status Points) */}
        {stages.map((stage, index) => {
          const isCompleted = index < actualIndex;
          const isCurrent = index === actualIndex;
          const isFuture = index > actualIndex;
          const isLost = currentStatus?.toLowerCase() === 'lost';
          const isWon = currentStatus?.toLowerCase() === 'won' && stage.id === 'won';

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center" style={{ flex: 1 }}>
              {/* Station Circle */}
              <div className={`
                relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-500
                ${isCompleted ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50' : ''}
                ${isCurrent && !isLost ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50 animate-pulse' : ''}
                ${isCurrent && isLost ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50' : ''}
                ${isWon ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50 scale-110' : ''}
                ${isFuture ? 'bg-gray-100 border-slate-600' : ''}
              `}>
                {/* Completed - Show Checkmark */}
                {isCompleted && (
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                )}
                
                {/* Current - Show Pulsing Dot */}
                {isCurrent && !isLost && (
                  <div className="w-3 h-3 bg-white rounded-full animate-ping absolute" />
                )}
                
                {/* Current Lost - Show X */}
                {isCurrent && isLost && (
                  <span className="text-white font-bold text-sm">✕</span>
                )}
                
                {/* Won - Show Star */}
                {isWon && (
                  <span className="text-white text-lg">⭐</span>
                )}
                
                {/* Future - Show Empty Circle */}
                {isFuture && !isWon && (
                  <div className="w-3 h-3 bg-slate-500 rounded-full" />
                )}
              </div>

              {/* Station Label */}
              <span className={`
                mt-2 text-xs font-medium transition-all duration-300 text-center whitespace-nowrap
                ${isCompleted ? 'text-green-400' : ''}
                ${isCurrent && !isLost ? 'text-blue-400 font-semibold' : ''}
                ${isCurrent && isLost ? 'text-red-400 font-semibold' : ''}
                ${isWon ? 'text-green-400 font-bold' : ''}
                ${isFuture ? 'text-slate-500' : ''}
              `}>
                {stage.label}
              </span>

              {/* Connection Line to Next Station (if not last) */}
              {index < stages.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-0.5 z-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Status Info Bar */}
      <div className="mt-3 pt-2 border-t border-gray-300/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {currentStatus?.toLowerCase() === 'lost' ? (
              <span className="text-red-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Lead Lost
              </span>
            ) : (
              <>
                <span className="text-slate-400">Progress:</span>
                <span className="text-white font-semibold">
                  {actualIndex + 1} / {stages.length}
                </span>
              </>
            )}
          </div>
          <div className="text-slate-400">
            {actualIndex === 0 && 'Just Started'}
            {actualIndex === 1 && 'Initial Contact Made'}
            {actualIndex === 2 && 'Quote Provided'}
            {actualIndex === 3 && 'In Discussion'}
            {actualIndex === 4 && '🎉 Deal Closed!'}
            {currentStatus?.toLowerCase() === 'lost' && 'Better luck next time'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadProgressTracker;
