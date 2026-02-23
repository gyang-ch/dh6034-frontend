export default function EssaySection({ title, id, className = '', children }) {
  return (
    <section
      className={`essay-section mx-auto mb-14 w-full max-w-prose px-1 motion-safe:translate-y-10 motion-safe:opacity-0 ${className}`}
      id={id}
    >
      <h2 className="font-title text-[clamp(1.55rem,2.8vw,2.2rem)] font-semibold leading-tight tracking-tight text-slate-900">
        {title}
      </h2>
      <div className="section-content mt-6 space-y-5 text-[clamp(1.02rem,1.08vw,1.12rem)] leading-8 text-slate-700">
        {children}
      </div>
    </section>
  )
}
