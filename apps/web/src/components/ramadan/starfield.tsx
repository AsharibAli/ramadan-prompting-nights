export function Starfield() {
  const stars = Array.from({ length: 54 }, (_, i) => {
    const left = (i * 37) % 100;
    const top = (i * 19) % 100;
    const delay = (i % 10) * 0.3;
    const duration = 2 + (i % 6) * 0.4;
    return { left, top, delay, duration, id: i };
  });

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {stars.map((star) => (
        <span
          key={star.id}
          className="star-dot"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
