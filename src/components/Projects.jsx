import { projects } from "../data/content"
import FadeIn from "./FadeIn"
import OptimizedImage from "./OptimizedImage"

function ProjectCard({ project, featured = false, delay = 0 }) {
  return (
    <FadeIn delay={delay}>
      <article className="hover-border-beige group h-full overflow-hidden rounded-3xl border border-setu-stone/30 bg-setu-cream transition-all duration-300 hover:border-setu-coral/50 hover:shadow-md">
        <div
          className={`relative w-full overflow-hidden ${
            featured ? "aspect-[16/7] sm:aspect-[21/9]" : "aspect-[4/3] sm:aspect-[16/10]"
          }`}
        >
          <OptimizedImage
            src={project.image}
            alt={project.title}
            sizes={
              featured
                ? "(min-width: 1280px) 1280px, 100vw"
                : "(min-width: 1024px) 640px, 50vw"
            }
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-setu-charcoal/80 via-setu-charcoal/25 to-transparent" />
          <div
            className={`absolute inset-x-0 bottom-0 ${
              featured ? "p-6 sm:p-8 lg:p-10" : "p-5 sm:p-6"
            }`}
          >
            <span className="inline-block rounded-full bg-setu-cream/15 px-3 py-1 text-xs font-medium text-setu-cream backdrop-blur-sm">
              {project.location} · {project.year}
            </span>
            <div
              className={`mt-3 flex flex-wrap items-end justify-between gap-3 ${
                featured ? "mt-4 gap-4" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <h3
                  className={`font-serif text-setu-cream ${
                    featured
                      ? "text-2xl sm:text-3xl lg:text-4xl"
                      : "text-xl sm:text-2xl"
                  }`}
                >
                  {project.title}
                </h3>
                <p
                  className={`mt-2 leading-relaxed text-setu-sand/90 ${
                    featured ? "max-w-2xl text-sm sm:text-base" : "text-sm line-clamp-2"
                  }`}
                >
                  {project.description}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`font-serif font-normal text-setu-coral ${
                    featured ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
                  }`}
                >
                  {project.stat}
                </p>
                <p className="text-xs text-setu-stone/80 sm:text-sm">{project.statLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </FadeIn>
  )
}

export default function Projects() {
  const [featured, ...paired] = projects

  return (
    <section id="projects" className="bg-setu-sand/50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-setu-muted">
            Stories from the Field
          </p>
          <h2 className="mt-3 font-serif text-3xl font-normal text-setu-charcoal sm:text-4xl lg:text-5xl">
            Transforming preventive care across communities
          </h2>
        </FadeIn>

        <div className="mt-16 space-y-8">
          <ProjectCard project={featured} featured delay={0} />

          <div className="grid gap-8 sm:grid-cols-2">
            {paired.map((project, i) => (
              <ProjectCard key={project.id} project={project} delay={(i + 1) * 0.06} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
