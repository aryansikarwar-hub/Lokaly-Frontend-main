import { lazy } from 'react';
import { Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

export const Home = lazy(() => import('./pages/Home.jsx'));
export const Feed = lazy(() => import('./pages/Feed.jsx'));
export const Products = lazy(() => import('./pages/Products.jsx'));
export const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
export const Cart = lazy(() => import('./pages/Cart.jsx'));
export const Checkout = lazy(() => import('./pages/Checkout.jsx'));
export const OrderSuccess = lazy(() => import('./pages/OrderSuccess.jsx'));
export const OrderTrack = lazy(() => import('./pages/OrderTrack.jsx'));
export const LiveStream = lazy(() => import('./pages/LiveStream.jsx'));
export const Messages = lazy(() => import('./pages/Messages.jsx'));
export const Profile = lazy(() => import('./pages/Profile.jsx'));
export const Login = lazy(() => import('./pages/Login.jsx'));
export const Signup = lazy(() => import('./pages/Signup.jsx'));
export const Coins = lazy(() => import('./pages/Coins.jsx'));
export const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'));
export const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
export const ARTryOn = lazy(() => import('./pages/ARTryOn.jsx'));
export const VoiceShop = lazy(() => import('./pages/VoiceShop.jsx'));
export const CoHosts = lazy(() => import('./pages/CoHosts.jsx'));
export const StoryToReel = lazy(() => import('./pages/StoryToReel.jsx'));
export const CollabRoom = lazy(() => import('./pages/CollabRoom.jsx'));
export const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default MainLayout;
