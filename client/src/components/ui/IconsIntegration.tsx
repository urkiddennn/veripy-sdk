import {
  SiAstro,
  SiExpress,
  SiNextdotjs,
  SiNuxt,
  SiSvelte,
} from "react-icons/si";
import { FaReact, FaVuejs, FaNodeJs } from "react-icons/fa";
const IconIntegration: React.FC = () => {
  return (
    <div className="mb-15 flex flex-col items-center gap-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-center gap-6">
        {[
          {
            name: "Next.js",
            icon: <SiNextdotjs className="fill-white size-8" />,
          },
          {
            name: "React",
            icon: <FaReact className="fill-blue-500 size-8" />,
          },
          {
            name: "Vue",
            icon: <FaVuejs className="fill-green-400 size-8" />,
          },
          {
            name: "Svelte",
            icon: <SiSvelte className="fill-red-400 size-8" />,
          },
          {
            name: "Astro",
            icon: <SiAstro className="size-8" />,
          },
          {
            name: "Express",
            icon: <SiExpress className="size-8" />,
          },
          {
            name: "NodeJs",
            icon: <FaNodeJs className="size-8" />,
          },
          {
            name: "Nuxt",
            icon: <SiNuxt className="fill-green-300 size-8" />,
          },
        ].map((fw) => (
          <div
            key={fw.name}
            title={fw.name}
            className="flex flex-col items-center gap-2 opacity-40 hover:opacity-80 transition-opacity duration-200 cursor-default"
          >
            <div className="text-foreground">{fw.icon}</div>
            <span className="text-[10px] font-medium text-muted-foreground/70">
              {fw.name}
            </span>
          </div>
        ))}
      </div>

      {/* Framework Compatibility Strip */}
    </div>
  );
};

export default IconIntegration;
