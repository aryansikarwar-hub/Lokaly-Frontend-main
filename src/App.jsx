import { Suspense, useEffect, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout, {
  Home, Feed, Products, ProductDetail, Cart, Checkout, OrderSuccess, OrderTrack,
  LiveStream, Messages, Profile, Login, Signup, Coins, Leaderboard, Dashboard,
  ARTryOn, VoiceShop, CoHosts, StoryToReel, CollabRoom, NotFound,
} from './routes';

const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
import { Spinner } from './components/ui/Spinner';
import AIShopperPanel from './features/aiShopper/AIShopperPanel';
import api from './services/api';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './context/ThemeContext';
import { bootGoogleTranslate } from './lib/googleTranslate';

function Booting() {
  return (
    <div className="min-h-screen grid place-items-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={48} />
        <div className="font-caveat text-xl text-mauve">loading your local world...</div>
      </div>
    </div>
  );
}

export default function App() {
  const { token, hydrate, logout } = useAuthStore();

  useEffect(() => {
    bootGoogleTranslate();
  }, []);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line no-console
      console.log('[auth] no token in store, skipping /auth/me');
      return;
    }
    // eslint-disable-next-line no-console
    console.log('[auth] have token, fetching /auth/me ...');
    api.get('/auth/me')
      .then(({ data }) => {
        // eslint-disable-next-line no-console
        console.log('[auth] /auth/me OK, hydrating user:', data.user);
        hydrate(token, data.user);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('[auth] /auth/me FAILED', {
          status: e.response?.status,
          data: e.response?.data,
          message: e.message,
        });
        if (e.response?.status === 401) logout();
      });
  }, [token, hydrate, logout]);

  return (
    <ThemeProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#2B2438', color: '#FFF8F0', borderRadius: '9999px', padding: '10px 18px' },
        }}
      />
      <AIShopperPanel />
      <Suspense fallback={<Booting />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderTrack />} />
            <Route path="/order/:id/success" element={<OrderSuccess />} />
            <Route path="/live" element={<LiveStream />} />
            <Route path="/live/:id" element={<LiveStream />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/coins" element={<Coins />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
            <Route path="/ar-tryon" element={<ARTryOn />} />
            <Route path="/voice" element={<VoiceShop />} />
            <Route path="/cohosts" element={<CoHosts />} />
            <Route path="/story-to-reel" element={<StoryToReel />} />
            <Route path="/collab/:id" element={<CollabRoom />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );

  // ignore this 
  
//   return (
//   <>
//     <Toaster
//       position="top-center"
//       toastOptions={{
//         style: { background: '#2B2438', color: '#FFF8F0', borderRadius: '9999px', padding: '10px 18px' },
//       }}
//     />
//     <AIShopperPanel />
//     <Suspense fallback={<Booting />}>
//       <Routes>
//         ...
//       </Routes>
//     </Suspense>
//   </>
// );
}
