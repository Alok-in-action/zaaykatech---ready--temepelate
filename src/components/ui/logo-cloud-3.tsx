import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { cn } from "@/lib/utils";

type Logo = {
    src?: string;
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
                "overflow-hidden py-10 [mask-image:linear-gradient(to_right,transparent,black,transparent)]",
                className
            )}
        >
            <InfiniteSlider gap={60} reverse duration={30} durationOnHover={60}>
                {logos.map((logo) => (
                    <div key={`logo-${logo.alt}`} className="flex items-center justify-center px-4">
                        {logo.src ? (
                            <img
                                src={logo.src}
                                alt={logo.alt}
                                loading="lazy"
                                className="h-8 md:h-10 w-auto object-contain rounded-md opacity-70 hover:opacity-100 transition-opacity"
                                onError={(e) => {
                                    // Graceful fallback to text if image fails to render
                                    e.currentTarget.style.display = 'none';
                                    const nextSibling = e.currentTarget.nextElementSibling;
                                    if (nextSibling) (nextSibling as HTMLElement).style.display = 'inline-block';
                                }}
                            />
                        ) : null}
                        <span
                            className="text-muted-foreground/50 hover:text-primary transition-all duration-500 font-headline font-bold text-2xl md:text-4xl whitespace-nowrap cursor-default px-4 py-2 italic tracking-tight"
                            style={{ display: logo.src ? 'none' : 'inline-block' }}
                        >
                            {logo.alt}
                        </span>
                    </div>
                ))}
            </InfiniteSlider>
        </div>
    );
}
