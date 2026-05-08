 import { useEffect, useState } from 'react';
 import { Link } from 'react-router-dom';
 import { motion } from 'framer-motion';
 import {
   HiOutlineMapPin,
   HiOutlineShieldCheck,
   HiOutlineFire,
   HiOutlineAdjustmentsHorizontal,
   HiArrowLongRight,
 } from 'react-icons/hi2';
 import api from '../../services/api';
 import { useLocationStore } from '../../store/locationStore';
 import { Avatar } from '../../components/ui/Avatar';
 import Badge from '../../components/ui/Badge';
 import { Reveal } from '../../components/animations/Reveal';
 import { Spinner } from '../../components/ui/Spinner';
 import ProductCard from '../../components/ProductCard';
 import DeliveryBadge from '../../components/DeliveryBadge';
 import LocationPrompt from './LocationPrompt';
 
 /**
  * NearbySellers — homepage hyperlocal rail.
  *
  * Three states:
  *   1. No location yet → shows LocationPrompt
  *   2. Location set, loading → spinner
  *   3. Location set, loaded → seller carousel + trending products
  *
  * Visual style preserved from the original implementation:
  *   - Mint→lavender gradient outer card
  *   - "Trending near {city}" headline
  *   - Centred seller cards with avatar on top, name+city below
  *
  * New functionality on top of that style:
  *   - Real GPS coords + pincode fallback (via LocationPrompt)
  *   - Radius selector (5/10/25/50 km)
  *   - Distance + delivery ETA badges per seller
  *   - Real trending products (locality + 7-day order/view signal)
  *   - "Change location" affordance
  *   - Empty state with link to /products
  *   - Persistent location across sessions (zustand persist)
  */
 export default function NearbySellers() {
   const coords = useLocationStore((s) => s.coords);
   const label = useLocationStore((s) => s.label);
   const radiusKm = useLocationStore((s) => s.radiusKm);
   const setRadius = useLocationStore((s) => s.setRadius);
   const pincode = useLocationStore((s) => s.pincode);
   const clear = useLocationStore((s) => s.clear);
 
   const [sellers, setSellers] = useState([]);
   const [trending, setTrending] = useState([]);
   const [loading, setLoading] = useState(false);
   const [showPrompt, setShowPrompt] = useState(false);
 
   const hasCoords = coords && Number.isFinite(coords.lng) && Number.isFinite(coords.lat);
 
   // Derive a friendly "near {city}" label — prefers the explicit store label,
   // then the city of the closest seller, then a generic fallback.
   const cityLabel =
     label ||
     sellers[0]?.location?.city ||
     trending[0]?.seller?.location?.city ||
     'your area';
 
   useEffect(() => {
     // No location AND no pincode → show the prompt.
     if (!hasCoords && !pincode) {
       setShowPrompt(true);
       return;
     }
     setShowPrompt(false);
 
     let cancelled = false;
     setLoading(true);
 
     const params = hasCoords
       ? { lng: coords.lng, lat: coords.lat, radiusKm }
       : { pincode };
 
     const sellersJob = hasCoords
       ? api.get('/hyperlocal/sellers/nearby', { params: { ...params, limit: 8 } })
           .then(({ data }) => !cancelled && setSellers(data.items || []))
           .catch(() => !cancelled && setSellers([]))
       : Promise.resolve();
 
     const trendingJob = api
       .get('/hyperlocal/products/trending', { params: { ...params, limit: 8 } })
       .then(({ data }) => !cancelled && setTrending(data.items || []))
       .catch(() => !cancelled && setTrending([]));
 
     Promise.allSettled([sellersJob, trendingJob]).finally(() => {
       if (!cancelled) setLoading(false);
     });
 
     return () => { cancelled = true; };
   }, [hasCoords, coords?.lng, coords?.lat, radiusKm, pincode]);
 
   // Location prompt is shown OUTSIDE the gradient wrapper because it has
   // its own gradient (peach→butter→lavender) that would clash.
   if (showPrompt) {
     return <LocationPrompt onResolved={() => setShowPrompt(false)} />;
   }
 
   return (
     <Reveal>
       <section className="rounded-3xl bg-gradient-to-br from-mint to-lavender p-5 md:p-7 space-y-6">
         {/* Header */}
         <div className="flex items-end justify-between gap-4 flex-wrap">
           <div className="flex items-start gap-2 text-ink min-w-0">
             <HiOutlineMapPin className="text-xl shrink-0 mt-1" />
             <div className="min-w-0">
               <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-1">
                 Hyperlocal
               </div>
               <h3 className="font-fraunces text-xl md:text-2xl tracking-tight leading-tight">
                 Trending near <span className="italic">{cityLabel}</span>
               </h3>
               {label && label !== cityLabel && (
                 <p className="mt-0.5 text-[11px] text-ink/55 font-jakarta">{label}</p>
               )}
             </div>
           </div>
 
           <div className="flex items-center gap-2 flex-wrap">
             {hasCoords && (
               <div className="flex items-center gap-1.5 bg-white/70 rounded-full px-3 py-1.5 border border-white">
                 <HiOutlineAdjustmentsHorizontal className="text-ink/50 text-sm" />
                 <span className="text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/50">
                   Radius
                 </span>
                 <select
                   value={radiusKm}
                   onChange={(e) => setRadius(Number(e.target.value))}
                   className="bg-transparent outline-none text-xs font-jakarta font-semibold text-ink cursor-pointer"
                 >
                   <option value={5}>5 km</option>
                   <option value={10}>10 km</option>
                   <option value={25}>25 km</option>
                   <option value={50}>50 km</option>
                 </select>
               </div>
             )}
             <button
               onClick={() => { clear(); setShowPrompt(true); }}
               className="text-[11px] font-jakarta font-semibold text-ink/55 hover:text-coral transition"
             >
               Change location
             </button>
           </div>
         </div>
 
         {loading && (
           <div className="grid place-items-center py-12">
             <Spinner />
           </div>
         )}
 
         {/* Sellers carousel — only with GPS coords (pincode-only mode skips this) */}
         {!loading && hasCoords && sellers.length > 0 && (
           <div>
             <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/60 mb-3">
               Sellers near you
             </div>
             <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
               {sellers.map((seller, i) => (
                 <SellerCard key={seller._id} seller={seller} index={i} />
               ))}
             </div>
           </div>
         )}
 
         {/* Trending in your locality */}
         {!loading && trending.length > 0 && (
           <div>
             <div className="flex items-center justify-between mb-3">
               <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/60 flex items-center gap-1.5">
                 <HiOutlineFire className="text-coral text-sm" />
                 Trending in your locality
               </div>
               <Link
                 to="/products"
                 className="text-[11px] font-jakarta font-semibold text-ink/55 hover:text-coral transition inline-flex items-center gap-1"
               >
                 See all <HiArrowLongRight className="text-xs" />
               </Link>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
               {trending.map((product, i) => (
                 <motion.div
                   key={product._id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.04, duration: 0.35 }}
                 >
                   <ProductCard product={product} />
                 </motion.div>
               ))}
             </div>
           </div>
         )}
 
         {/* Empty state — no sellers in radius */}
         {!loading && sellers.length === 0 && trending.length === 0 && (
           <div className="rounded-2xl bg-white/70 border border-white p-6 text-center">
             <div className="font-fraunces text-lg text-ink tracking-tight">
               No sellers in this area yet
             </div>
             <p className="mt-1.5 text-xs text-ink/65 font-jakarta">
               Try widening the radius, or browse the full bazaar.
             </p>
             <Link
               to="/products"
               className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-xs font-jakarta font-semibold hover:bg-ink/90 transition"
             >
               Browse all products <HiArrowLongRight className="text-sm" />
             </Link>
           </div>
         )}
       </section>
     </Reveal>
   );
 }
 
 /**
  * Single seller card — centred layout (avatar on top, name+city below)
  * matching the original implementation's look, with hyperlocal data
  * (verified badge, delivery tier, sample products) layered on.
  */
 function SellerCard({ seller, index }) {
   return (
     <motion.div
       initial={{ opacity: 0, y: 12 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: index * 0.05, duration: 0.4 }}
       className="snap-start shrink-0 w-44 md:w-48"
     >
       <Link
         to={`/profile/${seller._id}`}
         className="block rounded-2xl bg-white/80 border border-white hover:border-ink/15 p-3 transition-all h-full"
       >
         <div className="flex flex-col items-center text-center">
           <Avatar
             src={seller.avatar}
             name={seller.name}
             size="sm"
             aura={seller.trustScore}
           />
           <div className="mt-2 font-jakarta font-semibold text-sm text-ink line-clamp-1 w-full">
             {seller.shopName || seller.name}
           </div>
           <div className="text-[11px] text-ink/60 font-jakarta line-clamp-1 w-full">
             {seller.location?.city || 'Nearby'}
           </div>
 
           {seller.isVerifiedSeller && (
             <Badge tone="mint" className="mt-1 text-[9px]">
               <HiOutlineShieldCheck className="inline text-[10px] mr-0.5" />
               verified
             </Badge>
           )}
 
           {seller.delivery && (
             <div className="mt-2">
               <DeliveryBadge delivery={seller.delivery} distanceKm={seller.distanceKm} compact />
             </div>
           )}
         </div>
 
         {seller.sampleProducts?.length > 0 && (
           <div className="mt-3 grid grid-cols-3 gap-1">
             {seller.sampleProducts.slice(0, 3).map((p) => (
               <div
                 key={p._id}
                 className="aspect-square rounded-md overflow-hidden bg-peach/30"
               >
                 {p.images?.[0]?.url && (
                   <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                 )}
               </div>
             ))}
           </div>
         )}
       </Link>
     </motion.div>
   );
 }
 