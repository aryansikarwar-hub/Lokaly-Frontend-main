import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineSquares2X2,
  HiOutlineShoppingBag,
  HiOutlineClipboardDocumentList,
  HiOutlineVideoCamera,
  HiOutlineChatBubbleLeftRight,
  HiOutlineHeart,
  HiOutlineStar,
  HiOutlineCog6Tooth,
  HiOutlineCurrencyRupee,
  HiOutlineBolt,
  HiOutlineFlag,
  HiOutlineTrophy,
  HiOutlineBars3,
  HiOutlineXMark,
} from 'react-icons/hi2';

const SELLER_ITEMS = [
  { key: 'overview', label: 'Overview', icon: HiOutlineSquares2X2, to: '/dashboard?tab=overview' },
  { key: 'products', label: 'Products', icon: HiOutlineShoppingBag, to: '/dashboard?tab=products' },
  { key: 'orders', label: 'Orders', icon: HiOutlineClipboardDocumentList, to: '/dashboard?tab=orders' },
  { key: 'live', label: 'Live Sessions', icon: HiOutlineVideoCamera, to: '/dashboard?tab=live' },
  { key: 'messages', label: 'Messages', icon: HiOutlineChatBubbleLeftRight, to: '/messages' },
  { key: 'stress', label: 'Stress Radar', icon: HiOutlineBolt, to: '/dashboard?tab=stress' },
  { key: 'flagged', label: 'Flagged Chats', icon: HiOutlineFlag, to: '/dashboard?tab=flagged' },
  { key: 'coins', label: 'Coins', icon: HiOutlineCurrencyRupee, to: '/coins' },
  { key: 'settings', label: 'Settings', icon: HiOutlineCog6Tooth, to: '/dashboard?tab=settings' },
];

const BUYER_ITEMS = [
  { key: 'overview', label: 'Overview', icon: HiOutlineSquares2X2, to: '/buyer/dashboard?tab=overview' },
  { key: 'orders', label: 'My Orders', icon: HiOutlineClipboardDocumentList, to: '/buyer/dashboard?tab=orders' },
  { key: 'wishlist', label: 'Wishlist', icon: HiOutlineHeart, to: '/buyer/dashboard?tab=wishlist' },
  { key: 'messages', label: 'Messages', icon: HiOutlineChatBubbleLeftRight, to: '/messages' },
  { key: 'coins', label: 'Coins', icon: HiOutlineCurrencyRupee, to: '/coins' },
  { key: 'leaderboard', label: 'Leaderboard', icon: HiOutlineTrophy, to: '/leaderboard' },
  { key: 'reviews', label: 'Reviews', icon: HiOutlineStar, to: '/buyer/dashboard?tab=reviews' },
  { key: 'settings', label: 'Settings', icon: HiOutlineCog6Tooth, to: '/buyer/dashboard?tab=settings' },
];

function itemsFor(role) {
  if (role === 'buyer') return BUYER_ITEMS;
  return SELLER_ITEMS;
}

export default function Sidebar({ role = 'seller', active, onNavigate }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const items = itemsFor(role);

  const handleClick = (it) => (e) => {
    setOpen(false);
    if (onNavigate) {
      // Let parent decide; still allow Link default behaviour so URL updates.
      onNavigate(it.key);
    }
    // If the parent wants imperative navigation instead of relying on Link,
    // they can intercept via onNavigate. We still let Link handle routing.
  };

  const renderItem = (it, { iconOnly = false } = {}) => {
    const Icon = it.icon;
    const isActive = active === it.key;
    return (
      <Link
        key={it.key}
        to={it.to}
        onClick={handleClick(it)}
        title={iconOnly ? it.label : undefined}
        aria-label={it.label}
        className={`flex items-center gap-2.5 ${iconOnly ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl font-jakarta font-semibold text-xs transition whitespace-nowrap ${
          isActive
            ? 'bg-peach text-ink dark:bg-coral/80 dark:text-white'
            : 'text-ink/75 hover:bg-peach/50 dark:text-cream/70 dark:hover:bg-white/10'
        }`}
      >
        <Icon className="text-base shrink-0" />
        {!iconOnly && <span>{it.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile top bar (<768px): collapsible icons-only drawer */}
      <div className="md:hidden sticky top-[56px] z-30 bg-cream/90 dark:bg-ink/90 backdrop-blur border-b border-ink/5 dark:border-white/5">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/60 dark:text-cream/60">
            {role === 'buyer' ? 'Buyer' : 'Seller'} panel
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="w-8 h-8 grid place-items-center rounded-full hover:bg-peach/60 dark:hover:bg-white/10 text-ink dark:text-cream"
          >
            {open ? <HiOutlineXMark className="text-lg" /> : <HiOutlineBars3 className="text-lg" />}
          </button>
        </div>
        {/* Collapsed row: icons-only quick access (<768px default) */}
        {!open && (
          <div className="flex items-center gap-1 overflow-x-auto px-2 pb-2">
            {items.map((it) => renderItem(it, { iconOnly: true }))}
          </div>
        )}
        {open && (
          <div className="px-2 pb-3 space-y-0.5 border-t border-ink/5 dark:border-white/5">
            {items.map((it) => renderItem(it))}
          </div>
        )}
      </div>

      {/* Desktop sidebar (md+) */}
      <aside className="hidden md:block w-60 shrink-0 border-r border-ink/5 dark:border-white/5 bg-white/60 dark:bg-ink/60 backdrop-blur">
        <div className="sticky top-[64px] p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 dark:text-cream/50 px-2 mb-2">
            {role === 'buyer' ? 'Buyer' : 'Seller'} panel
          </div>
          <nav className="space-y-0.5">{items.map((it) => renderItem(it))}</nav>
        </div>
      </aside>
    </>
  );
}
