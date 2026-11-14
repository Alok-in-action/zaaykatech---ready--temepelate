'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { MenuItem as MenuItemType, MenuSection } from '@/types';
import { applyTheme } from '@/lib/themes/themeUtils';
import { ThemeConfig } from '@/lib/themes/themeTypes';

const MenuItemCard = ({ item }: { item: MenuItemType }) => {
    if (item.isSignature) {
        return (
            <div className={`${item._isSquareMobile ? 'col-span-1 flex-col md:flex-row md:items-center' : 'col-span-2 flex-row items-center'} md:col-span-2 group signature-card p-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex justify-between text-background border border-primary/30`}>
                <div className={`text-left flex-1 ${item._isSquareMobile ? 'mb-3 md:mb-0' : 'mr-2 md:mr-0'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        {item.is_veg !== undefined && (
                            <span className={`inline-block w-3.5 h-3.5 border p-0.5 rounded-sm ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                                <span className={`block w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                            </span>
                        )}
                        <h3 className="font-sans text-sm font-medium text-background leading-snug break-words">{item.name}</h3>
                    </div>
                    {item.description && <p className="text-[10px] text-background/80 mt-1">{item.description}</p>}
                </div>
                <div className="flex flex-col items-end justify-center gap-2">
                    {item.image_url && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20 shrink-0">
                            <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                loading="lazy"
                                sizes="48px"
                                className="object-cover"
                            />
                        </div>
                    )}
                    {item.variant_prices ? (
                        <div className="flex flex-wrap gap-1 justify-end">
                            {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                                <span key={vName} className="text-[10px] font-bold bg-secondary/30 text-background px-2 py-0.5 rounded-md whitespace-nowrap">
                                    {vName}: {vPrice}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-sm font-bold bg-secondary/25 text-background px-3 py-1 rounded-full whitespace-nowrap">{item.price}</span>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={`group bg-secondary p-3 sm:p-4 rounded-xl shadow-sm border border-primary/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full ${item._isForcedRectangular ? 'col-span-2 md:col-span-1' : ''}`}>
            <div>
                {(item.isMostOrdered || item.customTag) && (
                    <span className="inline-block mb-2 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {item.customTag || "Bestseller"}
                    </span>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                        {item.is_veg !== undefined && (
                            <span className={`inline-block mt-0.5 shrink-0 w-3.5 h-3.5 border p-0.5 rounded-sm ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                                <span className={`block w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                            </span>
                        )}
                        <h3 className="font-sans text-sm font-semibold text-foreground break-words leading-snug">
                            {item.name}
                        </h3>
                    </div>
                    {item.image_url && (
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-lg overflow-hidden bg-primary/5">
                            <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                loading="lazy"
                                sizes="56px"
                                className="object-cover"
                            />
                        </div>
                    )}
                </div>
                {item.description && <p className="font-sans text-[10px] text-text/70 leading-relaxed mb-2">{item.description}</p>}
            </div>
            <div className="mt-auto pt-2">
                {item.variant_prices ? (
                    <div className="flex flex-wrap gap-1 justify-end">
                        {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                            <span key={vName} className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {vName}: {vPrice}
                            </span>
                        ))}
                    </div>
                ) : item.price ? (
                    <div className="flex justify-end">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.price}</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const CraftMenuItemCard = ({ item }: { item: MenuItemType }) => {
    return (
        <div className={`group bg-secondary p-3 sm:p-4 rounded-xl shadow-sm border border-primary/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full ${item._isForcedRectangular ? 'col-span-2 md:col-span-1' : ''}`}>
            <div>
                {(item.isMostOrdered || item.customTag) && <span className="inline-block mb-2 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{item.customTag || "Bestseller"}</span>}
                <h4 className="font-sans text-sm font-medium break-words leading-snug mb-2">{item.name}</h4>
                {item.description && <p className="font-sans text-[10px] text-text/70 leading-relaxed mb-2">{item.description}</p>}
            </div>
            <div className="mt-auto pt-2">
                {item.variant_prices ? (
                    <div className="flex flex-wrap gap-1 justify-end">
                        {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                            <span key={vName} className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {vName}: {vPrice}
                            </span>
                        ))}
                    </div>
                ) : item.price ? (
                    <div className="flex justify-end">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.price}</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

const SpecialBlueDreamCard = ({ item }: { item: MenuItemType }) => (
    <div className={`group bg-[#F0F8FF] p-4 rounded-xl shadow-sm border border-[#B0E0E6]/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full ${item._isForcedRectangular ? 'col-span-2 md:col-span-1' : ''}`}>
        <div>
            {(item.isMostOrdered || item.customTag) && <span className="inline-block mb-2 text-[9px] font-bold uppercase tracking-wider text-[#2e4c5a] bg-secondary px-2 py-0.5 rounded">{item.customTag || "Bestseller"}</span>}
            <h4 className="font-sans text-sm font-medium text-[#2e4c5a] break-words mb-2">{item.name}</h4>
            {item.description && <p className="text-[10px] text-[#2e4c5a]/60 mt-1 leading-relaxed mb-2">{item.description}</p>}
        </div>
        <div className="flex justify-end mt-auto pt-2">
            <span className="text-xs font-semibold text-[#2e4c5a] bg-secondary px-2 py-0.5 rounded-full whitespace-nowrap">{item.price}</span>
        </div>
    </div>
);

const WhispersOfLoveCard = ({ item }: { item: MenuItemType }) => (
    <div className="group bg-gradient-to-br from-[#8B4A4A] via-[#7A3B3B] to-[#6B3030] p-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-rose-200/30 flex flex-col justify-between h-full">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <iconify-icon icon="solar:heart-bold" className="text-rose-200/90 text-base flex-shrink-0"></iconify-icon>
                <h4 className="font-sans text-sm font-semibold text-background break-words">{item.name}</h4>
            </div>
            {item.description && <p className="text-[10px] text-background/70 mt-2 leading-relaxed mb-2">{item.description}</p>}
            {(item.isMostOrdered || item.customTag) && (
                <span className="inline-block mt-1 mb-2 text-[10px] font-bold text-background bg-secondary/20 backdrop-blur-sm px-2 py-1 rounded-full uppercase">{item.customTag || "BESTSELLER"}</span>
            )}
        </div>
        <div className="flex justify-end mt-auto pt-2">
            <span className="text-xs font-bold text-background bg-secondary/15 backdrop-blur-sm px-3 py-1.5 rounded-full whitespace-nowrap">{item.price}</span>
        </div>
    </div>
);



const SummerEditCard = ({ item }: { item: MenuItemType }) => (
    <div className="group bg-gradient-to-br from-[#FFF3E0] via-[#FFF8E7] to-[#FFFDE7] p-3 sm:p-4 rounded-2xl shadow-sm border border-[#FFB300]/20 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
        <div>
            {item.customTag && (
                <span className={`inline-block mb-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded self-start ${item.customTag.toLowerCase() === 'trending' ? 'text-[#BF360C] bg-[#FF3D00]/10' : 'text-[#E65100] bg-[#FFB300]/20'}`}>
                    {item.customTag}
                </span>
            )}
            <h4 className="font-sans text-sm font-medium text-[#5D4037] break-words leading-snug mb-2">{item.name}</h4>
            {item.description && <p className="font-sans text-[10px] text-[#5D4037]/70 leading-relaxed mb-2">{item.description}</p>}
        </div>
        <div className="flex justify-end mt-auto pt-2">
            <span className="text-xs font-bold text-[#E65100] bg-[#FFB300]/15 px-2 py-0.5 rounded-full">{item.price}</span>
        </div>
    </div>
);

const MonsoonEditCard = ({ item, withRain = false }: { item: MenuItemType, withRain?: boolean }) => (
    <div className="group relative overflow-hidden bg-secondary/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-sm border border-white/20 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-[#E3F2FD]/80 before:to-[#BBDEFB]/80">
        {withRain && (
            <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-overlay" 
                style={{ backgroundImage: 'url(/img/weather/texture-rain-fg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
            ></div>
        )}
        <div className="relative z-10">
            {item.customTag && (
                <span className="inline-block mb-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded self-start text-[#1565C0] bg-secondary/50 backdrop-blur-sm">
                    {item.customTag}
                </span>
            )}
            <h4 className="font-sans text-sm font-medium text-[#0D47A1] break-words leading-snug mb-2">{item.name}</h4>
            {item.description && <p className="font-sans text-[10px] text-[#1565C0]/80 leading-relaxed mb-2">{item.description}</p>}
        </div>
        <div className="flex justify-end mt-auto pt-2 relative z-10">
            <span className="text-xs font-bold text-[#0D47A1] bg-secondary/40 backdrop-blur-sm px-2 py-0.5 rounded-full">{item.price}</span>
        </div>
    </div>
);

const MatchaCard = ({ item }: { item: MenuItemType }) => (
    <div className="group bg-gradient-to-br from-[#F0F7F0] via-[#F5FAF5] to-[#FAFFF5] p-3 sm:p-4 rounded-xl shadow-sm border border-[#8FBC8F]/10 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
        <div>
            {(item.isMostOrdered || item.customTag) && <span className="inline-block mb-2 text-[9px] font-bold uppercase tracking-wider text-[#4A7C59] bg-[#8FBC8F]/10 px-2 py-0.5 rounded">{item.customTag || "Bestseller"}</span>}
            <h4 className="font-sans text-sm font-medium text-[#3A5A3A] min-w-0 break-words mb-2">
                {item.name}
            </h4>
            {item.description && <p className="font-sans text-[10px] text-text/70 leading-relaxed mb-2">{item.description}</p>}
        </div>
        {item.price && <div className="flex justify-end mt-auto pt-2"><span className="text-xs font-semibold text-[#4A7C59] bg-[#8FBC8F]/10 px-2 py-0.5 rounded-full whitespace-nowrap">{item.price}</span></div>}
    </div>
);


const ColdFrappeItemCard = ({ item }: { item: MenuItemType }) => {
    if (item.isSignature) {
        return (
            <div className={`${item._isSquareMobile ? 'col-span-1 flex-col md:flex-row md:items-center' : 'col-span-2 flex-row items-center'} md:col-span-2 group signature-card p-4 sm:p-5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex justify-between text-background border border-primary/30`}>
                <div className={`text-left flex-1 ${item._isSquareMobile ? 'mb-3 md:mb-0' : 'mr-2 md:mr-0'}`}>
                    <h4 className="font-sans text-sm font-medium text-background leading-snug break-words">{item.name}</h4>
                    {item.description && <p className="text-[10px] text-background/80 mt-1 leading-relaxed">{item.description}</p>}
                </div>
                <div className="flex justify-end md:items-center">
                    {item.variant_prices ? (
                        <div className="flex flex-wrap gap-1 justify-end">
                            {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                                <span key={vName} className="text-[10px] font-bold bg-secondary/30 text-background px-2 py-0.5 rounded-md whitespace-nowrap">
                                    {vName}: {vPrice}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-sm font-bold bg-secondary/25 text-background px-3 py-1 rounded-full whitespace-nowrap">{item.price}</span>
                    )}
                </div>
            </div>
        )
    }

    const category = (item.name.toLowerCase().includes('brew') || item.name.toLowerCase().includes('tonic')) ? 'Brew' : 'Frappe';

    return (
        <div className={`group bg-secondary p-3 sm:p-4 rounded-xl shadow-sm border border-primary/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full ${item._isForcedRectangular ? 'col-span-2 md:col-span-1' : ''}`}>
            <div>
                {(item.isMostOrdered || item.customTag) && <span className="inline-block mb-2 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{item.customTag || "Bestseller"}</span>}
                <h4 className="font-sans text-sm font-medium mb-1 min-w-0 break-words">{item.name}</h4>
                {item.description && <p className="font-sans text-[10px] text-text/70 leading-relaxed mb-2">{item.description}</p>}
            </div>
            <div className="flex justify-between items-center mt-auto pt-3 text-xs text-primary font-semibold">
                <span>{category}</span>
                {item.variant_prices ? (
                    <div className="flex flex-wrap gap-1 justify-end">
                        {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                            <span key={vName} className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {vName}: {vPrice}
                            </span>
                        ))}
                    </div>
                ) : item.price ? (
                    <span className="bg-primary/10 px-2 py-0.5 rounded-full">{item.price}</span>
                ) : null}
            </div>
        </div>
    )
}

const PizzaItemCard = ({ item }: { item: MenuItemType }) => {
    if (item.isSignature) {
        return (
            <div className="group signature-card p-4 sm:p-5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-background border border-primary/30 flex flex-col justify-between h-full">
                <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className="font-sans text-sm font-medium text-background leading-snug break-words flex-1 min-w-0">{item.name}</h4>
                    </div>
                    {item.description && <p className="text-[10px] text-background/80 mb-4 leading-relaxed">{item.description}</p>}
                </div>
                <div className="mt-auto pt-2">
                    {item.prices?.ny && item.prices?.neap ? (
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-[11px] font-bold bg-secondary/25 text-background px-2 py-0.5 rounded">NY: ₹{item.prices.ny}</span>
                            <span className="text-[11px] font-bold bg-secondary/25 text-background px-2 py-0.5 rounded">Neap: ₹{item.prices.neap}</span>
                        </div>
                    ) : item.price && (
                        <div className="flex justify-end">
                            <div className="flex justify-end md:items-center">
                    {item.variant_prices ? (
                        <div className="flex flex-wrap gap-1 justify-end">
                            {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                                <span key={vName} className="text-[10px] font-bold bg-secondary/30 text-background px-2 py-0.5 rounded-md whitespace-nowrap">
                                    {vName}: {vPrice}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-sm font-bold bg-secondary/25 text-background px-3 py-1 rounded-full whitespace-nowrap">{item.price}</span>
                    )}
                </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    let icon = 'solar:pizza-linear';
    if (item.name.toLowerCase().includes('farmville')) icon = 'solar:leaf-linear';
    if (item.name.toLowerCase().includes('four cheese')) icon = 'solar:ruler-pen-linear';

    return (
        <div className="group bg-secondary p-4 sm:p-5 rounded-xl shadow-sm border border-primary/10 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
            <div>
                {(item.isMostOrdered || item.customTag) && <span className="inline-block mb-2 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{item.customTag || "Bestseller"}</span>}
                <div className="flex justify-between items-start mb-2 gap-2">
                    <h4 className="font-sans text-sm sm:text-base font-medium text-primary min-w-0 break-words flex-1">{item.name}</h4>
                    <iconify-icon icon={icon} className="text-primary/40 flex-shrink-0"></iconify-icon>
                </div>
                {item.description && <p className="text-[10px] text-text/70 mb-4 leading-relaxed">{item.description}</p>}
            </div>
            <div className="mt-auto pt-2">
                {item.prices?.ny && item.prices?.neap ? (
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-[11px] font-semibold text-primary">NY: ₹{item.prices.ny}</span>
                        <span className="text-[11px] font-semibold text-primary">Neap: ₹{item.prices.neap}</span>
                    </div>
                ) : item.variant_prices ? (
                    <div className="flex flex-wrap gap-1 justify-end">
                        {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                            <span key={vName} className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {vName}: {vPrice}
                            </span>
                        ))}
                    </div>
                ) : item.price ? (
                    <div className="flex justify-end">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.price}</span>
                    </div>
                ) : null}
            </div>
        </div>
    )
};

const BitesItemCard = ({ item }: { item: MenuItemType }) => {


    if (item.isSignature) {
        return (
            <div className={`${item._isSquareMobile ? 'col-span-1 flex-col md:flex-row md:items-center' : 'col-span-2 flex-row items-center'} md:col-span-2 group signature-card p-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex justify-between text-background border border-primary/30`}>
                <div className={`text-left flex-1 ${item._isSquareMobile ? 'mb-3 md:mb-0' : 'mr-2 md:mr-0'}`}>
                    <h4 className="font-sans text-sm font-medium text-background leading-snug break-words">{item.name}</h4>
                    {item.description && <p className="text-[10px] text-background/80 mt-1 leading-relaxed">{item.description}</p>}
                </div>
                <div className="flex justify-end md:items-center">
                    {item.variant_prices ? (
                        <div className="flex flex-wrap gap-1 justify-end">
                            {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                                <span key={vName} className="text-[10px] font-bold bg-secondary/30 text-background px-2 py-0.5 rounded-md whitespace-nowrap">
                                    {vName}: {vPrice}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-sm font-bold bg-secondary/25 text-background px-3 py-1 rounded-full whitespace-nowrap">{item.price}</span>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={`group bg-secondary p-3 sm:p-4 rounded-xl shadow-sm border border-primary/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full ${item._isForcedRectangular ? 'col-span-2 md:col-span-1' : ''}`}>
            <div>
                {(item.isMostOrdered || item.customTag) && <span className="inline-block mb-2 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{item.customTag || "Bestseller"}</span>}
                <h4 className="font-sans text-sm font-medium text-foreground break-words leading-snug mb-2">
                    {item.name}
                </h4>
                {item.description && <p className="font-sans text-[10px] text-text/70 leading-relaxed mb-2">{item.description}</p>}
            </div>
            <div className="mt-auto pt-2">
                {item.variant_prices ? (
                    <div className="flex flex-wrap gap-1 justify-end">
                        {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                            <span key={vName} className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {vName}: {vPrice}
                            </span>
                        ))}
                    </div>
                ) : item.price ? (
                    <div className="flex justify-end">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.price}</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const ShakeItemCard = ({ item }: { item: MenuItemType }) => {


    if (item.isSignature) {
        return (
            <div className={`${item._isSquareMobile ? 'col-span-1 flex-col md:flex-row md:items-center' : 'col-span-2 flex-row items-center'} md:col-span-3 group signature-card p-3 sm:p-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex justify-between text-background border border-primary/30`}>
                <div className={`text-left flex-1 ${item._isSquareMobile ? 'mb-3 md:mb-0' : 'mr-2 md:mr-0'}`}>
                    <h4 className="font-sans text-sm font-medium text-background leading-snug break-words">{item.name}</h4>
                    {item.description && <p className="text-[10px] text-background/80 mt-1 leading-relaxed">{item.description}</p>}
                </div>
                <div className="flex justify-end md:items-center">
                    {item.variant_prices ? (
                        <div className="flex flex-wrap gap-1 justify-end">
                            {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                                <span key={vName} className="text-[10px] font-bold bg-secondary/30 text-background px-2 py-0.5 rounded-md whitespace-nowrap">
                                    {vName}: {vPrice}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-sm font-bold bg-secondary/25 text-background px-3 py-1 rounded-full whitespace-nowrap">{item.price}</span>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="group bg-[#fff8f0] p-3 sm:p-4 rounded-xl border border-primary/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
            <div>
                {(item.isMostOrdered || item.customTag) && <span className="inline-block mb-2 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{item.customTag || "Bestseller"}</span>}
                <h4 className="font-sans text-sm font-medium min-w-0 break-words mb-1">{item.name}</h4>
                {item.description && (
                    <p className="text-[9px] text-primary/50 mt-1 leading-relaxed">{item.description}</p>
                )}
            </div>
            <div className="mt-auto pt-2">
                {item.variant_prices ? (
                    <div className="flex flex-wrap gap-1 justify-end">
                        {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                            <span key={vName} className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {vName}: {vPrice}
                            </span>
                        ))}
                    </div>
                ) : item.price ? (
                    <div className="flex justify-end">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.price}</span>
                    </div>
                ) : null}
            </div>
        </div>
    )
};

const DessertItemCard = ({ item }: { item: MenuItemType }) => {


    if (item.isSignature) {
        return (
            <div className={`${item._isSquareMobile ? 'col-span-1 flex-col md:flex-row md:items-center' : 'col-span-2 flex-row items-center'} md:col-span-2 group signature-card p-3 sm:p-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex justify-between text-background border border-primary/30`}>
                <div className={`text-left flex-1 ${item._isSquareMobile ? 'mb-3 md:mb-0' : 'mr-2 md:mr-0'}`}>
                    <h4 className="font-sans text-sm font-medium text-background leading-snug break-words">{item.name}</h4>
                    {item.description && <p className="text-[10px] text-background/80 leading-relaxed">{item.description}</p>}
                </div>
                <div className="flex justify-end md:items-center">
                    {item.variant_prices ? (
                        <div className="flex flex-wrap gap-1 justify-end">
                            {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                                <span key={vName} className="text-[10px] font-bold bg-secondary/30 text-background px-2 py-0.5 rounded-md whitespace-nowrap">
                                    {vName}: {vPrice}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-sm font-bold bg-secondary/25 text-background px-3 py-1 rounded-full whitespace-nowrap">{item.price}</span>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={`group bg-secondary p-3 sm:p-4 rounded-xl shadow-sm border border-primary/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full ${item._isForcedRectangular ? 'col-span-2 md:col-span-1' : ''}`}>
            <div>
                {(item.isMostOrdered || item.customTag) && <span className="inline-block mb-2 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{item.customTag || "Bestseller"}</span>}
                <h4 className="font-sans text-sm font-medium mb-1 min-w-0 break-words">{item.name}</h4>
                {item.description && <p className="font-sans text-[10px] text-text/70 leading-relaxed mb-2">{item.description}</p>}
            </div>
            <div className="mt-auto pt-2">
                {item.variant_prices ? (
                    <div className="flex flex-wrap gap-1 justify-end">
                        {Object.entries(item.variant_prices).map(([vName, vPrice]) => (
                            <span key={vName} className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {vName}: {vPrice}
                            </span>
                        ))}
                    </div>
                ) : item.price ? (
                    <div className="flex justify-end">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.price}</span>
                    </div>
                ) : null}
            </div>
        </div>
    )
};


function getSectionConfig(sectionId: string) {
    let CardComponent: any = MenuItemCard;
    let gridCols = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

    switch (sectionId) {
        case 'pizza':
            CardComponent = PizzaItemCard;
            gridCols = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
            break;
        case 'summer-edit':
            CardComponent = SummerEditCard;
            break;
        case 'whispers-of-love':
            CardComponent = WhispersOfLoveCard;
            gridCols = 'grid-cols-1 md:grid-cols-2';
            break;
        case 'classic-espresso-bar':
            CardComponent = MenuItemCard;
            break;
        case 'craft-coffees':
            CardComponent = CraftMenuItemCard;
            break;
        case 'cold-brews':
        case 'frappe-to-go':
            CardComponent = ColdFrappeItemCard;
            break;
        case 'bites-for-sides':
        case 'healthy-salads':
        case 'fries-corner':
        case 'pasta':
        case 'sandwiches':
        case 'burgers':
            CardComponent = BitesItemCard;
            break;
        case 'shakes':
            CardComponent = ShakeItemCard;
            gridCols = 'grid-cols-2 md:grid-cols-3';
            break;
        case 'dessert':
            CardComponent = DessertItemCard;
            break;
        case 'blue-dream':
            CardComponent = SpecialBlueDreamCard;
            gridCols = 'grid-cols-1 md:grid-cols-2';
            break;
        case 'matcha':
            CardComponent = MatchaCard;
            break;
        default:
            CardComponent = MenuItemCard;
            break;
    }

    return { CardComponent, gridCols };
}

const LazySection = ({
    children,
    isPriority = false,
    id,
    title,
}: {
    children: React.ReactNode;
    isPriority?: boolean;
    id: string;
    title: string;
}) => {
    const [isVisible, setIsVisible] = useState(isPriority);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isPriority || isVisible) return;
        const el = containerRef.current;
        if (!el) return;

        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '350px 0px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [isPriority, isVisible]);

    if (isVisible) {
        return <div id={id} ref={containerRef} className="scroll-mt-24">{children}</div>;
    }

    return (
        <div id={id} ref={containerRef} className="scroll-mt-24 min-h-[140px] py-6 my-2 text-center">
            <h2 className="font-script text-3xl text-primary mb-2 opacity-80">{title}</h2>
            <div className="h-20 max-w-md mx-auto rounded-xl bg-primary/5 animate-pulse" />
        </div>
    );
};

const SectionComponent = ({ section: originalSection }: { section: MenuSection }) => {
    let currentCell = 0;
    const itemsCount = originalSection.items.length;
    const processedItems = originalSection.items.map((item, index) => {
        let isSquare = false;
        let isForcedRectangular = false;
        const isLastItem = index === itemsCount - 1;

        if (item.isSignature) {
            if (currentCell % 2 === 1) {
                isSquare = true;
                currentCell += 1;
            } else {
                currentCell += 2;
            }
        } else {
            if (isLastItem && currentCell % 2 === 0) {
                isForcedRectangular = true;
                currentCell += 2;
            } else {
                currentCell += 1;
            }
        }
        return { ...item, _isSquareMobile: isSquare, _isForcedRectangular: isForcedRectangular };
    });
    const section = { ...originalSection, items: processedItems };
    let CardComponent;
    let gridCols = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

    if (section.id === 'summer-edit') {
        return (
            <section id={section.id} className="reveal -mx-4 sm:-mx-6 px-4 sm:px-6 py-10 rounded-2xl shadow-md" style={{ background: 'linear-gradient(135deg, #FFF8E1 0%, #FFE0B2 40%, #FFF9C4 100%)', border: '1.5px solid #FFB30040' }}>
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-[#FF8F00]/10 border border-[#FF8F00]/30 rounded-full px-4 py-1.5 mb-4">
                            <iconify-icon icon="emojione:sun" width="16"></iconify-icon>
                            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#E65100]">Limited Season Special</span>
                            <iconify-icon icon="emojione:sun" width="16"></iconify-icon>
                        </div>
                        <h2 className="font-script text-4xl sm:text-5xl text-[#BF360C] mb-2">{section.title}</h2>
                        {section.subtitle && <p className="font-sans text-xs text-[#6D4C41]/80 italic max-w-sm mx-auto leading-relaxed">{section.subtitle}</p>}
                    </div>
                    {/* Drinks */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <iconify-icon icon="solar:cup-hot-bold" className="text-[#F57F17]" width="16"></iconify-icon>
                            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#F57F17]">Sips</span>
                            <span className="h-px flex-1 bg-[#FFB300]/30"></span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {section.items.slice(0, 8).map((item, index) => <SummerEditCard key={`${item.name}-${index}`} item={item} />)}
                        </div>
                    </div>
                    {/* Desserts */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <iconify-icon icon="solar:ice-cream-linear" className="text-[#F57F17]" width="16"></iconify-icon>
                            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#F57F17]">Sweet Escapes</span>
                            <span className="h-px flex-1 bg-[#FFB300]/30"></span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {section.items.slice(8).map((item, index) => <SummerEditCard key={`${item.name}-${index + 8}`} item={item} />)}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (section.id === 'monsoon-edit') {
        return (
            <section id={section.id} className="reveal -mx-4 sm:-mx-6 px-4 sm:px-6 py-10 rounded-2xl shadow-md relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%)', border: '1.5px solid #64B5F640' }}>
                <div className="absolute inset-0 z-0">
                    <RainEffectCanvas />
                </div>
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-secondary/30 backdrop-blur-sm border border-white/40 rounded-full px-4 py-1.5 mb-4">
                            <iconify-icon icon="meteocons:rain-fill" width="16" className="text-[#1976D2]"></iconify-icon>
                            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#0D47A1]">Monsoon Special</span>
                            <iconify-icon icon="meteocons:rain-fill" width="16" className="text-[#1976D2]"></iconify-icon>
                        </div>
                        <h2 className="font-script text-4xl sm:text-5xl text-[#0D47A1] mb-2">{section.title}</h2>
                        {section.subtitle && <p className="font-sans text-xs text-[#1565C0]/80 italic max-w-sm mx-auto leading-relaxed">{section.subtitle}</p>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {section.items.map((item, index) => <MonsoonEditCard key={`${item.name}-${index}`} item={item} />)}
                    </div>
                </div>
            </section>
        );
    }

    if (section.id === 'pizza') {
        return (
            <section id={section.id} className="reveal -mx-4 sm:-mx-6 px-4 sm:px-6 py-8 bg-gradient-to-br from-[#f5e6d3] via-background to-[#ede0d0] rounded-2xl border border-primary/10 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    {section.preheader && (
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <iconify-icon icon="game-icons:wood-pile" className="text-primary text-lg opacity-70"></iconify-icon>
                            <p className="font-sans text-sm font-medium uppercase tracking-widest text-primary">{section.preheader}</p>
                            <iconify-icon icon="game-icons:wood-pile" className="text-primary text-lg opacity-70"></iconify-icon>
                        </div>
                    )}
                    <div className="flex items-end gap-3 mb-6 px-1">
                        <iconify-icon icon="mdi:fire" className="text-[#D2691E] text-3xl mb-1 opacity-80"></iconify-icon>
                        <h2 className="font-script text-3xl text-primary">{section.title}</h2>
                        <span className="h-px flex-1 bg-primary/20 mb-2"></span>
                        <iconify-icon icon="mdi:fire" className="text-[#D2691E] text-3xl mb-1 opacity-80"></iconify-icon>
                    </div>

                    <div className="text-center -mt-4 mb-8 max-w-2xl mx-auto bg-secondary/50 p-6 rounded-xl border border-primary/10">
                        <p className="font-sans text-sm font-medium uppercase tracking-widest text-primary mb-4">Choice of Base</p>
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-xs text-[#6B3A20]/80">
                            <div>
                                <h4 className="font-sans font-semibold text-sm text-primary mb-1">NEW YORK STYLE</h4>
                                <p>A thin, hand-tossed crust, soft in the center, crisp at the edge, and perfectly foldable.</p>
                            </div>
                            <div>
                                <h4 className="font-sans font-semibold text-sm text-primary mb-1">NEAPOLITAN</h4>
                                <p>Crafted with long-rested dough, giving you a pillowy centre, crispy edges, and that signature smoky char.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {section.items.map((item, index) => <PizzaItemCard key={`${item.name}-${index}`} item={item} />)}
                    </div>
                </div>
            </section>
        );
    }

    switch (section.id) {
        case 'whispers-of-love':
            CardComponent = WhispersOfLoveCard;
            gridCols = 'grid-cols-1 md:grid-cols-2';
            break;

        case 'classic-espresso-bar':
            CardComponent = MenuItemCard;
            break;
        case 'craft-coffees':
            CardComponent = CraftMenuItemCard;
            break;
        case 'cold-brews':
        case 'frappe-to-go':
            CardComponent = ColdFrappeItemCard;
            break;
        case 'bites-for-sides':
        case 'healthy-salads':
        case 'fries-corner':
        case 'pasta':
            CardComponent = BitesItemCard;
            break;
        case 'sandwiches':
        case 'burgers':
            CardComponent = BitesItemCard;
            break;
        case 'shakes':
            CardComponent = ShakeItemCard;
            gridCols = 'grid-cols-2 md:grid-cols-3';
            break;
        case 'dessert':
            CardComponent = DessertItemCard;
            break;
        case 'blue-dream':
            CardComponent = SpecialBlueDreamCard;
            gridCols = 'grid-cols-1 md:grid-cols-2';
            break;
        case 'matcha':
            CardComponent = MatchaCard;
            break;
        case 'affogato':
        case 'hot-teas':
        case 'iced-teas':
        case 'hot-chocolate':
        case 'craft-mocktails':
        case 'healthy-juices':
        case 'smoothies':
        case 'beverage-companions':
        case 'garlic-bread':
        case 'calzone':
        case 'meal-bowls':
        case 'ramen-tales':
        case 'meal-combos':
            CardComponent = MenuItemCard;
            break;
        default:
            CardComponent = MenuItemCard;
    }

    return (
        <section id={section.id} className="reveal">
            {section.preheader && (
                <p className="font-sans text-sm font-medium uppercase tracking-widest text-primary text-center mb-2">{section.preheader}</p>
            )}
            <div className="flex items-end gap-3 mb-6 px-1">
                {section.id === 'ramen-tales' && (
                    <iconify-icon icon="fluent-emoji-high-contrast:chopsticks" className="text-primary text-2xl mb-1 opacity-60"></iconify-icon>
                )}
                <h2 className="font-script text-3xl sm:text-4xl text-primary">{section.title}</h2>
                <span className="h-px flex-1 bg-primary/20 mb-2"></span>
                {section.id === 'ramen-tales' && (
                    <iconify-icon icon="fluent-emoji-high-contrast:steaming-bowl" className="text-primary text-2xl mb-1 opacity-60"></iconify-icon>
                )}
            </div>
            {section.subtitle && (
                <p className="font-sans text-xs text-center text-[#6B3A20]/80 italic -mt-4 mb-6 max-w-lg mx-auto whitespace-pre-line">{section.subtitle}</p>
            )}
            <div className={`grid ${gridCols} gap-3`}>
                {section.items.map((item, index) => <CardComponent key={`${item.name}-${index}`} item={item} />)}
            </div>
            {section.id === 'beverage-companions' && (
                <div className="mt-12 text-center space-y-2 reveal">
                    <p className="font-script text-3xl text-primary">“Impressed by the drinks?<br />scroll the page”</p>
                    <p className="font-sans text-sm font-medium uppercase tracking-widest text-primary">The food's ready to steal the show!</p>
                </div>
            )}
        </section>
    );
};

import dynamic from 'next/dynamic';

const RainEffectCanvas = dynamic(() => import('../components/RainEffectCanvas'), { ssr: false });

export default function MenuClient({ 
    initialSections, 
    initialTheme 
}: { 
    initialSections: MenuSection[], 
    initialTheme: ThemeConfig 
}) {
    const [sections] = useState<MenuSection[]>(initialSections);
    const [theme] = useState<ThemeConfig>(initialTheme);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (theme) {
            const root = (document.querySelector('.public-menu-root') as HTMLElement) || document.documentElement;
            applyTheme(theme, root);
        }
    }, [theme]);

    useEffect(() => {
        if (!sections.length) return;

        let activeObserver: IntersectionObserver | null = null;
        let revealObserver: IntersectionObserver | null = null;

        // Small delay to ensure DOM has updated with the new sections
        const timeoutId = setTimeout(() => {
            const observerOptions = {
                root: null,
                rootMargin: '-100px 0px -60% 0px', // Focus on top-ish part of viewport
                threshold: 0
            };

            activeObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            }, observerOptions);

            const revealElementsSnapshot = document.querySelectorAll('section[id]');
            revealElementsSnapshot.forEach(el => activeObserver?.observe(el));

            // Original reveal observer
            revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        revealObserver?.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            const revealElements = document.querySelectorAll('.reveal');
            revealElements.forEach(el => revealObserver?.observe(el));
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            activeObserver?.disconnect();
            revealObserver?.disconnect();
        };
    }, [sections]);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-scroll nav bar to active item
    useEffect(() => {
        if (activeSection && navRef.current) {
            const activeItem = navRef.current.querySelector(`[data-section="${activeSection}"]`);
            if (activeItem) {
                const navContainer = navRef.current;
                const itemOffset = (activeItem as HTMLElement).offsetLeft;
                const itemWidth = (activeItem as HTMLElement).offsetWidth;
                const containerWidth = navContainer.offsetWidth;

                // Center the active item
                navContainer.scrollTo({
                    left: itemOffset - (containerWidth / 2) + (itemWidth / 2),
                    behavior: 'smooth'
                });
            }
        }
    }, [activeSection]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary/30">
                <div className="text-primary animate-pulse font-script text-3xl">Loading Menu...</div>
            </div>
        );
    }

    if (error || !sections.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary/30">
                <div className="text-primary font-script text-3xl">{error || 'Menu not found'}</div>
            </div>
        );
    }

    const displayedSections = searchQuery
        ? sections.map(section => ({
            ...section,
            items: section.items.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(section => section.items.length > 0)
        : sections;

    const navLinks = sections;

    return (
        <div>
            {/* Hero Section */}
            {theme?.showHeroVideo && theme?.heroVideoUrl ? (
                <div className="w-full h-[80dvh] md:h-[70vh] rounded-b-[2.5rem] overflow-hidden relative">
                    <video 
                        src={theme.heroVideoUrl}
                        poster={theme.heroPosterUrl || undefined}
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover absolute inset-0"
                    />
                    
                    {/* Subtle bottom gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Scroll Down Indicator */}
                    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center gap-2 z-10 text-background/90 drop-shadow-md pointer-events-none">
                        <span className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase animate-pulse">Scroll Down</span>
                        <iconify-icon icon="solar:round-alt-arrow-down-linear" width="24" className="animate-bounce"></iconify-icon>
                    </div>
                </div>
            ) : theme?.heroPosterUrl ? (
                <div className="w-full h-[45dvh] sm:h-[55vh] max-h-[500px] min-h-[250px] rounded-b-[2.5rem] overflow-hidden relative">
                    <Image 
                        src={theme.heroPosterUrl}
                        alt={`${theme?.restaurantName || 'Restaurant'} banner`}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center gap-1 z-10 text-white drop-shadow-md pointer-events-none text-center px-4">
                        {theme?.tagline && (
                            <p className="font-script text-2xl sm:text-3xl text-white drop-shadow">{theme.tagline}</p>
                        )}
                        <span className="font-sans text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-white/80 animate-pulse mt-1">Scroll Down</span>
                    </div>
                </div>
            ) : (
                <div className="w-full py-12 px-4 rounded-b-[2.5rem] bg-gradient-to-b from-secondary/40 via-background to-background text-center flex flex-col items-center justify-center border-b border-primary/10">
                    <h1 className="font-script text-4xl sm:text-5xl text-primary mb-2 drop-shadow-sm">
                        {theme?.restaurantName || 'Welcome'}
                    </h1>
                    {theme?.tagline && (
                        <p className="font-sans text-xs sm:text-sm text-text/80 max-w-md mx-auto italic tracking-wide">
                            {theme.tagline}
                        </p>
                    )}
                </div>
            )}

            <header className="pt-6 sm:pt-8 pb-4 px-4 sm:px-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2 reveal active">
                    {theme?.logoUrl ? (
                        <Image
                            src={theme.logoUrl}
                            alt={`${theme?.restaurantName || 'Restaurant'} Logo`}
                            width={180}
                            height={60}
                            className="h-12 w-auto object-contain"
                            priority
                        />
                    ) : (
                        <span className="font-script text-3xl sm:text-4xl text-primary font-bold">
                            {theme?.restaurantName || 'Menu'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary hover:text-background transition-colors reveal active duration-500 relative z-[101]"
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    >
                        <iconify-icon icon={isMenuOpen ? "solar:close-circle-linear" : "solar:hamburger-menu-linear"} width="20"></iconify-icon>
                    </button>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary hover:text-background transition-colors reveal active duration-500 delay-100"
                        aria-label="Search menu items"
                    >
                        <iconify-icon icon="solar:magnifer-linear" width="20"></iconify-icon>
                    </button>

                    {/* Dropdown Menu Overlay */}
                    {isMenuOpen && (
                        <>
                            {/* Invisible Backdrop for click-outside */}
                            <div 
                                className="fixed inset-0 z-[90]" 
                                onClick={() => setIsMenuOpen(false)}
                            />
                            
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-[calc(100%+0.5rem)] w-64 bg-background rounded-2xl shadow-xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-200 z-[100] p-4">
                                {/* Menu Title */}
                                <h2 className="font-script text-2xl text-primary mb-4">Quick Links</h2>

                                {/* Menu Items */}
                                <nav className="space-y-2">
                                    {theme?.instagramUrl && (
                                        <a
                                            href={theme.instagramUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors group border border-transparent hover:border-primary/20"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center flex-shrink-0 transition-colors">
                                                <iconify-icon icon="hugeicons:instagram" width="20" className="text-primary group-hover:text-background transition-colors"></iconify-icon>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-sans text-sm font-semibold text-primary transition-colors">Instagram</p>
                                                <p className="font-sans text-[10px] text-primary/60 truncate max-w-[140px]">{theme.instagramUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '') || 'Follow Us'}</p>
                                            </div>
                                        </a>
                                    )}

                                    {theme?.mobileNumber && (
                                        <a
                                            href={`tel:${theme.mobileNumber.replace(/\s+/g, '')}`}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors group border border-transparent hover:border-primary/20"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center flex-shrink-0 transition-colors">
                                                <iconify-icon icon="solar:phone-linear" width="20" className="text-primary group-hover:text-background transition-colors"></iconify-icon>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-sans text-sm font-semibold text-primary transition-colors">Call Us</p>
                                                <p className="font-sans text-[10px] text-primary/60">{theme.mobileNumber}</p>
                                            </div>
                                        </a>
                                    )}

                                    {theme?.whatsappNumber && (
                                        <a
                                            href={`https://wa.me/${theme.whatsappNumber.replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors group border border-transparent hover:border-primary/20"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center flex-shrink-0 transition-colors">
                                                <iconify-icon icon="logos:whatsapp-icon" width="20" className="text-primary group-hover:text-background transition-colors"></iconify-icon>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-sans text-sm font-semibold text-primary transition-colors">WhatsApp</p>
                                                <p className="font-sans text-[10px] text-primary/60">Chat with us</p>
                                            </div>
                                        </a>
                                    )}

                                    {(theme?.mapsUrl || theme?.address) && (
                                        <a
                                            href={theme.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(theme.address || '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors group border border-transparent hover:border-primary/20"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center flex-shrink-0 transition-colors">
                                                <iconify-icon icon="solar:map-point-linear" width="20" className="text-primary group-hover:text-background transition-colors"></iconify-icon>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-sans text-sm font-semibold text-primary transition-colors">Directions</p>
                                                <p className="font-sans text-[10px] text-primary/60">Open in Maps</p>
                                            </div>
                                        </a>
                                    )}

                                    {theme?.reviewUrl && (
                                        <a
                                            href={theme.reviewUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors group border border-transparent hover:border-primary/20"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center flex-shrink-0 transition-colors">
                                                <iconify-icon icon="solar:star-linear" width="20" className="text-primary group-hover:text-background transition-colors"></iconify-icon>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-sans text-sm font-semibold text-primary transition-colors">Review Us</p>
                                                <p className="font-sans text-[10px] text-primary/60">Google Reviews</p>
                                            </div>
                                        </a>
                                    )}

                                    <a
                                        href="/owner"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors group border border-transparent hover:border-primary/20"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center flex-shrink-0 transition-colors">
                                            <iconify-icon icon="solar:user-bold-duotone" width="20" className="text-primary group-hover:text-background transition-colors"></iconify-icon>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-sans text-sm font-semibold text-primary transition-colors">Owner Portal</p>
                                            <p className="font-sans text-[10px] text-primary/60">Manage menu</p>
                                        </div>
                                    </a>
                                </nav>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {isSearchOpen && (
                <div className="fixed inset-0 z-[200] bg-background overflow-y-auto animate-in zoom-in-95 fade-in duration-300">
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-primary/10 p-4 sm:p-6 flex items-center gap-4">
                        <div className="relative flex-1 max-w-3xl mx-auto">
                            <iconify-icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70"></iconify-icon>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search for coffee, pizza, desserts..."
                                className="w-full bg-secondary/30 border border-primary/20 rounded-2xl py-3 pl-12 pr-12 font-sans text-base focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-primary placeholder:text-primary/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors"
                                >
                                    <iconify-icon icon="solar:close-circle-bold" width="20"></iconify-icon>
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery('');
                            }}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/50 text-primary flex items-center justify-center hover:bg-primary hover:text-background transition-colors flex-shrink-0"
                        >
                            <iconify-icon icon="solar:close-circle-linear" width="24"></iconify-icon>
                        </button>
                    </div>

                    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-32">
                        {searchQuery ? (
                            displayedSections.length > 0 ? (
                                <div className="space-y-10">
                                    {displayedSections.map(section => {
                                        return (
                                            <div key={`search-${section.id}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <h3 className="font-playfair text-xl sm:text-2xl text-primary font-bold">{section.title}</h3>
                                                    <span className="h-px flex-1 bg-primary/20"></span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {section.items.map((item, index) => {
                                                        // Render appropriate card based on section type
                                                        if (section.id === 'special-blue-dream') return <SpecialBlueDreamCard key={`${item.name}-${index}`} item={item} />;
                                                        if (section.id === 'whispers-of-love') return <WhispersOfLoveCard key={`${item.name}-${index}`} item={item} />;
                                                        if (section.id === 'the-summer-edit' || section.id === 'desserts') return <SummerEditCard key={`${item.name}-${index}`} item={item} />;
                                                        if (section.id === 'the-monsoon-edit') return <MonsoonEditCard key={`${item.name}-${index}`} item={item} />;
                                                        if (section.id === 'the-matcha-edit') return <MatchaCard key={`${item.name}-${index}`} item={item} />;
                                                        if (section.id === 'pizza') return <PizzaItemCard key={`${item.name}-${index}`} item={item} />;
                                                        if (section.id === 'cold-frappe') return <ColdFrappeItemCard key={`${item.name}-${index}`} item={item} />;
                                                        if (section.id === 'bites' || section.id === 'garlic-bread' || section.id === 'calzone' || section.id === 'fries') return <BitesItemCard key={`${item.name}-${index}`} item={item} />;
                                                        if (section.id === 'shakes') return <ShakeItemCard key={`${item.name}-${index}`} item={item} />;
                                                        if (section.id === 'dessert') return <DessertItemCard key={`${item.name}-${index}`} item={item} />;
                                                        if (section.id === 'craft-menu') return <CraftMenuItemCard key={`${item.name}-${index}`} item={item} />;
                                                        return <MenuItemCard key={`${item.name}-${index}`} item={item} />;
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-primary/60 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mb-4">
                                        <iconify-icon icon="solar:ghost-smile-linear" width="40"></iconify-icon>
                                    </div>
                                    <p className="font-sans text-lg">No matches found for "{searchQuery}"</p>
                                    <p className="font-sans text-sm mt-2 opacity-70">Try searching for something else</p>
                                </div>
                            )
                        ) : (
                            <div className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-8">
                                    <iconify-icon icon="solar:magic-stick-3-linear" width="32" className="text-primary/40 mb-3"></iconify-icon>
                                    <h3 className="font-playfair text-xl sm:text-2xl text-primary font-bold">What are you craving today?</h3>
                                    <p className="font-sans text-sm text-primary/60 mt-2">Browse our categories or type above to search</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
                                    {sections.map(section => (
                                        <a
                                            key={`category-${section.id}`}
                                            href={`#${section.id}`}
                                            onClick={() => {
                                                setIsSearchOpen(false);
                                                setSearchQuery('');
                                            }}
                                            className="block px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-secondary/30 border border-primary/15 text-primary font-sans text-sm sm:text-base font-medium hover:bg-primary hover:text-background hover:shadow-md hover:scale-105 transition-all duration-300"
                                        >
                                            {section.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <nav className="sticky top-0 z-40 glass-nav border-b border-primary/10 mb-6 sm:mb-8">
                <div className="max-w-7xl mx-auto px-2 sm:px-4">
                    <ul ref={navRef} className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory py-3 sm:py-4 px-1">
                        {navLinks.map((section) => {
                            const isActive = activeSection === section.id;
                            return (
                                <li key={section.id} className="snap-start" data-section={section.id}>
                                    <a
                                        href={`#${section.id}`}
                                        className={`whitespace-nowrap px-5 sm:px-8 py-3 sm:py-4 rounded-full font-sans text-sm sm:text-base font-semibold transition-all duration-300 active:scale-95 flex items-center justify-center min-w-[100px] sm:min-w-[120px] ${isActive
                                            ? 'bg-primary text-background shadow-lg shadow-primary/30 scale-105'
                                            : 'bg-[#fffefb] border border-primary/15 text-primary hover:bg-primary/5'
                                            }`}
                                    >
                                        {section.title}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-12">
                {sections.length === 0 ? (
                    <div className="text-center py-12 text-primary font-script text-xl">
                        No menu items available
                    </div>
                ) : sections.map((section, index) => {
                    const isPizzaGroup = section.id === 'pizza';
                    if (isPizzaGroup) {
                        const garlicBreadSection = sections.find(s => s.id === 'garlic-bread');
                        const calzoneSection = sections.find(s => s.id === 'calzone');

                        return (
                            <LazySection key={section.id} id="pizza" title={section.title} isPriority={index < 2}>
                                <section id="pizza" className="reveal -mx-4 sm:-mx-6 px-4 sm:px-6 py-8 bg-gradient-to-br from-[#f5e6d3] via-background to-[#ede0d0] rounded-2xl border border-primary/10 shadow-sm">
                                    <div className="max-w-7xl mx-auto space-y-12">
                                        {/* Pizza Section */}
                                        <div>
                                            {section.preheader && (
                                                <div className="flex items-center justify-center gap-3 mb-2">
                                                    <iconify-icon icon="game-icons:wood-pile" className="text-primary text-lg opacity-70"></iconify-icon>
                                                    <p className="font-sans text-sm font-medium uppercase tracking-widest text-primary">{section.preheader}</p>
                                                    <iconify-icon icon="game-icons:wood-pile" className="text-primary text-lg opacity-70"></iconify-icon>
                                                </div>
                                            )}
                                            <div className="flex items-end gap-3 mb-6 px-1">
                                                <iconify-icon icon="mdi:fire" className="text-[#D2691E] text-3xl mb-1 opacity-80"></iconify-icon>
                                                <h2 className="font-script text-3xl text-primary">{section.title}</h2>
                                                <span className="h-px flex-1 bg-primary/20 mb-2"></span>
                                                <iconify-icon icon="mdi:fire" className="text-[#D2691E] text-3xl mb-1 opacity-80"></iconify-icon>
                                            </div>

                                            <div className="text-center -mt-4 mb-8 max-w-2xl mx-auto bg-secondary/50 p-6 rounded-xl border border-primary/10">
                                                <p className="font-sans text-sm font-medium uppercase tracking-widest text-primary mb-4">Choice of Base</p>
                                                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-xs text-[#6B3A20]/80">
                                                    <div>
                                                        <h4 className="font-sans font-semibold text-sm text-primary mb-1">NEW YORK STYLE</h4>
                                                        <p>A thin, hand-tossed crust, soft in the center, crisp at the edge, and perfectly foldable.</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-sans font-semibold text-sm text-primary mb-1">NEAPOLITAN</h4>
                                                        <p>Crafted with long-rested dough, giving you a pillowy centre, crispy edges, and that signature smoky char.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {section.items.map((item, index) => <PizzaItemCard key={`${item.name}-${index}`} item={item} />)}
                                            </div>
                                        </div>

                                        {/* Garlic Bread Section */}
                                        {garlicBreadSection && (
                                            <div id="garlic-bread">
                                                <div className="flex items-end gap-3 mb-6 px-1">
                                                    <h2 className="font-script text-3xl text-primary">{garlicBreadSection.title}</h2>
                                                    <span className="h-px flex-1 bg-primary/20 mb-2"></span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {garlicBreadSection.items.map((item, index) => <MenuItemCard key={`${item.name}-${index}`} item={item} />)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Calzone Section */}
                                        {calzoneSection && (
                                            <div id="calzone">
                                                <div className="flex items-end gap-3 mb-6 px-1">
                                                    <h2 className="font-script text-3xl text-primary">{calzoneSection.title}</h2>
                                                    <span className="h-px flex-1 bg-primary/20 mb-2"></span>
                                                </div>
                                                {calzoneSection.subtitle && (
                                                    <p className="font-sans text-xs text-center text-[#6B3A20]/80 italic -mt-4 mb-6 max-w-lg mx-auto whitespace-pre-line">{calzoneSection.subtitle}</p>
                                                )}
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {calzoneSection.items.map((item, index) => <MenuItemCard key={`${item.name}-${index}`} item={item} />)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </LazySection>
                        );
                    }

                    // Skip garlic-bread and calzone as they're rendered with pizza
                    if (section.id === 'garlic-bread' || section.id === 'calzone') {
                        return null;
                    }

                    return (
                        <LazySection key={section.id} id={section.id} title={section.title} isPriority={index < 2}>
                            <SectionComponent section={section} />
                        </LazySection>
                    );
                })}
                <div className="max-w-7xl mx-auto py-4 text-center reveal">
                    <p className="font-sans text-[10px] sm:text-xs font-medium text-primary bg-primary/5 py-3 px-6 rounded-xl inline-block border border-primary/10">Prices are exclusive of GST. Applicable GST will be added to your bill.</p>
                </div>

            </main>

            <footer className="mt-8 text-center pt-6 pb-4 px-2 sm:px-6 border-t border-primary/10 bg-secondary/40 reveal">
                <div className="flex flex-col items-center">
                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 mb-8 text-primary w-full max-w-3xl px-2">
                        {theme?.instagramUrl && (
                            <a href={theme.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform flex flex-col items-center justify-start gap-1.5 text-center">
                                <iconify-icon icon="hugeicons:instagram" width="22" className="sm:w-[24px]"></iconify-icon>
                                <span className="font-sans text-[9.5px] sm:text-[11px] lowercase tracking-tight">instagram</span>
                            </a>
                        )}
                        {theme?.mobileNumber && (
                            <a href={`tel:${theme.mobileNumber.replace(/\s+/g, '')}`} className="hover:scale-105 transition-transform flex flex-col items-center justify-start gap-1.5 text-center">
                                <iconify-icon icon="solar:phone-linear" width="22" className="sm:w-[24px]"></iconify-icon>
                                <span className="font-sans text-[9.5px] sm:text-[11px] tracking-tight">{theme.mobileNumber}</span>
                            </a>
                        )}
                        {theme?.whatsappNumber && (
                            <a href={`https://wa.me/${theme.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform flex flex-col items-center justify-start gap-1.5 text-center text-green-700">
                                <iconify-icon icon="logos:whatsapp-icon" width="22" className="sm:w-[24px]"></iconify-icon>
                                <span className="font-sans text-[9.5px] sm:text-[11px] tracking-tight">WhatsApp</span>
                            </a>
                        )}
                        {(theme?.mapsUrl || theme?.address) && (
                            <a href={theme.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(theme.address || '')}`} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform flex flex-col items-center justify-start gap-1.5 text-center">
                                <iconify-icon icon="solar:globus-linear" width="22" className="sm:w-[24px]"></iconify-icon>
                                <span className="font-sans text-[9.5px] sm:text-[11px] uppercase tracking-tight">Directions</span>
                            </a>
                        )}
                        {theme?.reviewUrl && (
                            <a href={theme.reviewUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform flex flex-col items-center justify-start gap-1.5 text-center">
                                <iconify-icon icon="solar:star-linear" width="22" className="sm:w-[24px]"></iconify-icon>
                                <span className="font-sans text-[9.5px] sm:text-[11px] lowercase tracking-tight">review us</span>
                            </a>
                        )}
                    </div>

                    {theme?.address && (
                        <div className="max-w-md mx-auto mb-6 text-center px-4">
                            <p className="font-sans text-[10px] text-primary/60 uppercase tracking-[0.2em] mb-2">Visit Us</p>
                            <p className="font-sans text-xs sm:text-sm text-primary leading-relaxed whitespace-pre-line">
                                {theme.address}
                            </p>
                        </div>
                    )}

                    <div className="w-full border-t border-primary/5 pt-6 pb-2">
                        <p className="font-sans text-xs sm:text-sm tracking-[0.2em] uppercase text-primary mb-2 font-semibold">
                            {theme?.restaurantName || 'Digital QR Menu'}
                        </p>
                        <p className="font-sans text-xs sm:text-sm text-primary/60 font-medium">
                            Menu powered by <a href="https://zaaykatech.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline transition-colors font-semibold">ZaaykaTech</a>
                        </p>
                    </div>
                </div>
            </footer>

            {showBackToTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary text-background shadow-lg hover:bg-[#6B3A20] transition-all duration-300 flex items-center justify-center z-50 animate-in fade-in slide-in-from-bottom"
                    aria-label="Back to top"
                >
                    <iconify-icon icon="solar:alt-arrow-up-linear" width="20" class="sm:w-6"></iconify-icon>
                </button>
            )}
        </div>
    );
}
