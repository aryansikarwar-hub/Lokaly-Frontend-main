import { useState } from 'react';
import ProductCard from './ProductCard';
import { searchRecommendations } from '../services/api';

function RecommendationSearch({ defaultCity = 'Indore' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    
    try {
      const data = await searchRecommendations(query.trim(), defaultCity);
      // Backend now guarantees results is an array; defensive fallback for nested shape
      const list = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.results?.recommendations)
          ? data.results.recommendations
          : [];
      setResults(list);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="flex gap-2 mb-4">
        <input 
          type="text"
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search local businesses, food, services..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button 
          onClick={handleSearch} 
          disabled={loading || !query.trim()}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 hover:bg-purple-700"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {hasSearched && !loading && results.length === 0 && (
        <p className="text-gray-500 text-center py-4">No results found</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {results.map((item, idx) => (
          <ProductCard key={item.id || item._id || idx} product={item} />
        ))}
      </div>
    </div>
  );
}

export default RecommendationSearch;