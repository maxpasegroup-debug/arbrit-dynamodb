import { CheckCircle, Circle, FileText, Package, Truck, MapPin, Image as ImageIcon } from 'lucide-react';

const CertificateProgressTracker = ({ currentStatus, deliveryNotePhoto, onViewDeliveryNote }) => {
  const stages = [
    { key: 'initiated', label: 'Initiated', icon: FileText },
    { key: 'prepared', label: 'Prepared', icon: CheckCircle },
    { key: 'dispatched', label: 'Dispatched', icon: Package },
    { key: 'in_transit', label: 'In Transit', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: MapPin }
  ];

  const currentIndex = stages.findIndex(stage => stage.key === currentStatus);
  const isDelivered = currentStatus === 'delivered';

  return (
    <div className="relative py-4">
      {/* Progress Line */}
      <div className="absolute top-8 left-0 right-0 h-1 bg-slate-700">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
          style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        />
      </div>

      {/* Stages */}
      <div className="relative flex justify-between items-center">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10">
              {/* Stage Circle */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50'
                    : isCurrent
                    ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50 animate-pulse'
                    : 'bg-slate-700 border-slate-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <Icon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-slate-400'}`} />
                )}
              </div>

              {/* Stage Label */}
              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-semibold ${
                    isCompleted || isCurrent ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {stage.label}
                </p>
                {isCurrent && (
                  <div className="flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Info */}
      <div className="mt-4 text-center">
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-blue-400">{currentIndex + 1}</span> / {stages.length}
          {' - '}
          <span className="text-slate-300">{stages[currentIndex]?.label || 'Unknown'}</span>
        </p>
      </div>
    </div>
  );
};

export default CertificateProgressTracker;
