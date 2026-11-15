import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { cn } from "@/lib/utils";

type Logo = {
    alt: string;
};

type LogoCloudProps = React.ComponentProps<"div"> & {
    logos: Logo[];
};

export function LogoCloud({ className, logos, ...props }: LogoCloudProps) {
    return (
        <div
            {...props}
            className={cn(
                "overflow-hidden py-8 [mask-image:linear-gradient(to_right,transparent,black,transparent)]",
                className
            )}
        >
            <InfiniteSlider gap={60} reverse duration={30} durationOnHover={60}>
                {logos.map((logo) => (
                    <div key={`logo-${logo.alt}`} className="flex items-center justify-center px-4">
                        <span
                            className="text-muted-foreground/50 hover:text-primary transition-all duration-500 font-headline font-bold text-2xl md:text-4xl whitespace-nowrap cursor-default px-4 py-2 italic tracking-tight"
                        >
                            {logo.alt}
                        </span>
                    </div>
                ))}
            </InfiniteSlider>
        </div>
    );
}
