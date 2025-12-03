/**
 * WelcomeOverlay Component
 * Human-centric onboarding modal for the Civilization Metro Map
 * 
 * Separated from CivMap.jsx to maintain clean separation of concerns:
 * - Provides first-time user guidance
 * - Offers "Start Journey" or "Explore Freely" options
 * - Explains navigation and features
 */

import React, { memo } from 'react';
import { Move, Castle, Filter, Users, Play } from 'lucide-react';
import AccessibleButton from './AccessibleButton';

/**
 * Feature Item Component
 * Displays a single feature with icon and description
 */
const FeatureItem = memo(function FeatureItem({ 
  icon: Icon, 
  iconBgClass, 
  iconColorClass, 
  title, 
  description 
}) {
  return (
    <div className="flex items-start gap-4">
      <div className={`p-2 ${iconBgClass} rounded-lg`}>
        <Icon className={`w-6 h-6 ${iconColorClass}`} />
      </div>
      <div>
        <h3 className="font-bold text-white mb-1">{title}</h3>
        <p className="text-neutral-400 text-sm">{description}</p>
      </div>
    </div>
  );
});

/**
 * WelcomeOverlay Component
 * Main welcome/onboarding modal
 */
const WelcomeOverlay = memo(function WelcomeOverlay({
  // State
  isVisible,
  stations,
  journeyStations,
  
  // Actions
  actions,
  
  // Accessibility hooks
  saveFocus,
  restoreFocus,
  announce,
  
  // Toast notifications
  success,
  showError,
  info
}) {
  if (!isVisible) return null;

  // Handle starting the guided journey
  const handleStartJourney = () => {
    try {
      saveFocus();
      const firstStation = stations.find(s => s.id === journeyStations[0]);
      if (firstStation) {
        actions.startJourney(firstStation);
        announce(`Starting journey at ${firstStation.name}`);
        success('Journey mode activated');
      }
      restoreFocus();
    } catch (err) {
      showError('Failed to start journey. Please try again.');
      console.error('Journey start error:', err);
    }
  };

  // Handle exploring freely (closing the overlay)
  const handleExploreFree = () => {
    actions.setWelcome(false);
    announce('Welcome overlay closed. You can now explore freely.');
    info('Tip: Use search to find specific events');
  };

  // Feature list configuration
  const features = [
    {
      icon: Move,
      iconBgClass: 'bg-cyan-900/30',
      iconColorClass: 'text-cyan-400',
      title: 'Navigate',
      description: 'Click and drag to pan • Scroll to zoom • Use controls for precise navigation'
    },
    {
      icon: Castle,
      iconBgClass: 'bg-purple-900/30',
      iconColorClass: 'text-purple-400',
      title: 'Explore Stations',
      description: 'Click any station to learn about pivotal moments in human civilization'
    },
    {
      icon: Filter,
      iconBgClass: 'bg-amber-900/30',
      iconColorClass: 'text-amber-400',
      title: 'Filter & Focus',
      description: 'Toggle lines, search stations, or take a guided journey through key moments'
    },
    {
      icon: Users,
      iconBgClass: 'bg-green-900/30',
      iconColorClass: 'text-green-400',
      title: 'Five Lines of History',
      description: 'Tech (Blue) • Population (Green) • War (Red) • Empire (Purple) • Philosophy (Orange)'
    }
  ];

  return (
    <div 
      className="absolute inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      aria-describedby="welcome-description"
    >
      <div className="max-w-2xl mx-4 bg-neutral-900/95 border border-cyan-900/50 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 
            id="welcome-title"
            className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500"
          >
            Welcome to the Civilization Map
          </h2>
          <p 
            id="welcome-description"
            className="text-cyan-300/80 text-lg"
          >
            Explore 12,025 years of human history through an interactive transit map
          </p>
        </div>
        
        {/* Features List */}
        <div className="space-y-6 mb-8">
          {features.map((feature, idx) => (
            <FeatureItem key={idx} {...feature} />
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4">
          <AccessibleButton
            onClick={handleStartJourney}
            variant="primary"
            size="lg"
            className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400"
            ariaLabel="Start guided journey through key historical moments"
          >
            <Play className="w-5 h-5 inline mr-2" aria-hidden="true" />
            Start Journey
          </AccessibleButton>
          <AccessibleButton
            onClick={handleExploreFree}
            variant="secondary"
            size="lg"
            className="flex-1"
            ariaLabel="Close welcome overlay and explore freely"
          >
            Explore Freely
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
});

export default WelcomeOverlay;

