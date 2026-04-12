import { useMemo } from 'react';

export default function StarryBackground() {
  const stars = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: `${Math.random() * 3 + 2}s`,
      delay: `${Math.random() * 3}s`,
      maxOpacity: Math.random() * 0.6 + 0.2,
    }));
  }, []);

  return (
    <div className="animated-bg">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            '--duration': star.duration,
            '--max-opacity': star.maxOpacity,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}
