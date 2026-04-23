import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineMapPin } from 'react-icons/hi2';
import api from '../../services/api';
import { Avatar } from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { Reveal } from '../../components/animations/Reveal';

export default function NearbySellers() {
  const [sellers, setSellers] = useState([]);
  const [city, setCity] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { loadPopular(); return; }
    navigator.geolocation.getCurrentPosition(
      () => loadPopular(),
      () => loadPopular(),
      { timeout: 4000 }
    );
    // eslint-disable-next-line
  }, []);

  async function loadPopular() {
    try {
      const { data } = await api.get('/products', { params: { sort: 'popular', limit: 30 } });
      const m = new Map();
      for (const p of data.items || []) {
        if (p.seller && !m.has(p.seller._id)) m.set(p.seller._id, p.seller);
      }
      const list = Array.from(m.values()).slice(0, 6);
      setSellers(list);
      setCity(list[0]?.location?.city || 'your city');
    } catch { setSellers([]); }
  }

  if (sellers.length === 0) return null;

  return (
    <Reveal>
      <section className="rounded-3xl bg-gradient-to-br from-mint to-lavender p-5">
        <div className="flex items-center gap-2 text-ink">
          <HiOutlineMapPin className="text-xl" />
          <h3 className="font-fraunces text-xl">Trending near {city}</h3>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto snap-x">
          {sellers.map((s) => (
            <Link
              to={`/profile/${s._id}`}
              key={s._id}
              className="shrink-0 snap-start w-40 rounded-2xl bg-white/70 border border-white p-3 flex flex-col items-center"
            >
              <Avatar src={s.avatar} name={s.name} size="sm" aura={s.trustScore} />
              <div className="mt-2 text-sm font-jakarta font-semibold text-ink text-center line-clamp-1">
                {s.shopName || s.name}
              </div>
              <div className="text-[11px] text-ink/60 text-center">{s.location?.city}</div>
              {s.isVerifiedSeller && <Badge tone="mint" className="mt-1 text-[9px]">verified</Badge>}
            </Link>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
