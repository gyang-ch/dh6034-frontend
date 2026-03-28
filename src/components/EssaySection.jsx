export default function EssaySection({ title, id, className = '', children }) {
  return (
    <section
      className={`essay-section mx-auto mb-14 w-full max-w-[88ch] px-1 motion-safe:translate-y-10 motion-safe:opacity-0 ${className}`}
      id={id}
    >
      <h2 className="font-title text-[clamp(1.42rem,2.45vw,1.95rem)] font-semibold leading-tight tracking-tight text-slate-900">
        {title}
      </h2>
      <div className="section-content mt-6 space-y-5 text-[clamp(1.16rem,1.34vw,1.3rem)] leading-8 text-slate-700 [font-family:'Times_New_Roman',Times,serif]">
        {children}
      </div>
    </section>
  )
}
