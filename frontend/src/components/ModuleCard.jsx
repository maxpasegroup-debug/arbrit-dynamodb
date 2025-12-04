import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const ModuleCard = ({ module, onClick }) => {
  const Icon = module.icon;

  return (
    <Card
      data-testid={`module-card-${module.id}`}
      onClick={onClick}
      className="group relative overflow-hidden cursor-pointer border-gray-200 bg-white backdrop-blur-sm hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-300"
      style={{
        minHeight: '180px'
      }}
    >
      {/* Gradient Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
      />

      <div className="p-6 relative z-10">
        {/* Icon */}
        <div className={`${module.bgColor} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-7 h-7 ${module.iconColor}`} />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors">
            {module.name}
          </h3>
          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
            {module.description}
          </p>
        </div>

        {/* Arrow Icon */}
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <div className="bg-white p-2 rounded-full">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Bottom Border Accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${module.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
    </Card>
  );
};

export default ModuleCard;