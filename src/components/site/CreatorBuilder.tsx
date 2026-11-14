import { Check, Building2 } from "lucide-react";

export function CreatorBuilder() {
  const companies = [
    {
      name: "Apple",
      tagline: "Innovation & Design",
      desc: "Apple revolutionized personal technology with the Macintosh in 1984. Today, Apple leads the world in innovation with its M series silicon, bringing unprecedented power and efficiency to creative professionals.",
      img: "https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786033609/apple_comany_2K_202608062151_l0u0de.jpg",
      stats: [
        "Founded: April 1, 1976",
        "Headquarters: Cupertino, California",
        "Focus: Premium Consumer & Pro Hardware",
        "Key Lineup: MacBook Pro, Mac Studio",
      ],
      link: "https://www.apple.com",
    },
    {
      name: "Dell Technologies",
      tagline: "Enterprise & Workstation Leader",
      desc: "Dell provides the essential infrastructure for organizations to build their digital future. Their Precision workstation line is the trusted standard for heavy engineering, AI, and professional 3D rendering.",
      img: "https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786033610/dell_company_view_2K_202608062153_nayk6a.jpg",
      stats: [
        "Founded: February 1, 1984",
        "Headquarters: Round Rock, Texas",
        "Focus: Enterprise IT & Workstations",
        "Key Lineup: Precision, XPS, Alienware",
      ],
      link: "https://www.dell.com"
    },
    {
      name: "Lenovo",
      tagline: "Global PC Powerhouse",
      desc: "Lenovo is a global technology powerhouse driving computing innovation to deliver smarter technology for all. Renowned for their ThinkPad durability and Yoga versatility in the mobile creator space.",
      img: "https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786033610/Lenovo_company._2K_202608062152_qj4zhk.jpg",
      stats: [
        "Founded: November 1, 1984",
        "Headquarters: Beijing & Morrisville",
        "Focus: Business & Mainstream Computing",
        "Key Lineup: ThinkPad, Legion, Yoga",
      ],
      link: "https://www.lenovo.com"
    },
  ];

  return (
    <section id="creator" className="relative py-24 md:py-32 border-t border-glass-border">
      <div className="mx-auto w-full max-w-full px-4 sm:px-8 md:px-12">

        {/* Simple Clean Header */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neon-purple/40 bg-neon-purple/10 px-3.5 py-1 text-[10px] font-mono font-bold tracking-[0.25em] text-neon-purple uppercase">
            <Building2 className="h-3 w-3" /> Industry Partners
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            Our Brand <span className="text-gradient">Ecosystem</span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            We partner with the world's most innovative technology companies to bring you purpose-built machines for 3D rendering, AI engineering, and cinematic editing.
          </p>
        </div>

        {/* 3 Streamlined Company Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {companies.map((company) => {
            return (
              <div
                key={company.name}
                className="group flex flex-col rounded-3xl border border-glass-border bg-card/60 overflow-hidden backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:shadow-elevated"
              >
                {/* Image - Clean, natural and balanced */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/10">
                  <img
                    src={company.img}
                    alt={company.name}
                    className="h-full w-full object-cover brightness-105 transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                  />
                  <span className="absolute bottom-3 left-4 font-mono text-[10px] font-bold uppercase tracking-wider text-neon-cyan bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-md">
                    {company.tagline}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-2xl font-bold text-foreground tracking-tight">{company.name}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed min-h-[80px]">
                    {company.desc}
                  </p>

                  {/* Company Stats List */}
                  <ul className="mt-6 space-y-3 border-t border-glass-border pt-6 text-xs text-muted-foreground">
                    {company.stats.map((stat) => (
                      <li key={stat} className="flex items-start gap-3">
                        <span className="flex h-5 w-5 mt-0.5 shrink-0 items-center justify-center rounded-full bg-neon-cyan/10 text-neon-cyan">
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-foreground/90 font-medium leading-relaxed">{stat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
