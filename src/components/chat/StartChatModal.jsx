import { useEffect, useRef, useState } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import api from "../../services/api";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import { Avatar } from "../ui/Avatar";
import { Spinner } from "../ui/Spinner";
import VerifiedBadge from "../VerifiedBadge";

/**
 * StartChatModal
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onSelect: (conv) => void   // called with the opened conversation object
 *   role?: 'seller' | 'buyer' | 'admin'  // optional scope for /users/search
 */
export default function StartChatModal({ open, onClose, onSelect, role }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(null);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      setError(null);
      setLoading(false);
      setOpening(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      const params = { q: trimmed, limit: 20 };
      if (role) params.role = role;
      api
        .get("/users/search", { params })
        .then(({ data }) => {
          const items = Array.isArray(data) ? data : data?.users || [];
          setResults(items);
          setError(null);
        })
        .catch((e) => {
          setResults([]);
          setError(
            e.response?.status === 404
              ? "Search endpoint not available yet"
              : "Failed to search users",
          );
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, open, role]);

  async function handleChat(u) {
    if (opening) return;
    setOpening(u._id);
    try {
      const { data } = await api.get(`/chat/conversations/with/${u._id}`);
      const conv = data?.conversation || data;
      onSelect?.(conv, u);
      onClose?.();
    } catch (e) {
      setError(e.response?.data?.error || "Could not open conversation");
    } finally {
      setOpening(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Start a chat"
      title="Find someone to message"
    >
      <div className="space-y-3">
        <Input
          autoFocus
          leftIcon={<HiOutlineMagnifyingGlass />}
          placeholder="Search by name or shop..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {error && (
          <div className="text-[11px] text-coral font-jakarta">{error}</div>
        )}

        <div className="min-h-[120px] max-h-[360px] overflow-auto">
          {loading ? (
            <div className="py-8 grid place-items-center">
              <Spinner />
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-[11px] font-jakarta italic text-ink/50 dark:text-cream/50">
              {q.trim()
                ? "No users found"
                : "Type a name to find people to chat with"}
            </div>
          ) : (
            <ul className="space-y-0.5">
              {results.map((u) => {
                const isVerified = !!u.isVerifiedSeller;
                const busy = opening === u._id;
                return (
                  <li key={u._id}>
                    <div className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-peach/40 dark:hover:bg-white/5 transition">
                      <Avatar src={u.avatar} name={u.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream truncate flex items-center gap-1">
                          <span className="truncate">
                            {u.shopName || u.name}
                          </span>
                          <VerifiedBadge
                            isVerifiedSeller={isVerified}
                            size={12}
                          />
                        </div>
                        <div className="text-[10px] text-ink/50 dark:text-cream/50 mt-0.5 font-jakarta capitalize">
                          {u.role || "user"}
                          {u.shopName && u.name !== u.shopName
                            ? ` · ${u.name}`
                            : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChat(u)}
                        disabled={busy}
                        className="shrink-0 inline-flex items-center gap-1 rounded-full bg-ink text-cream dark:bg-coral dark:text-white font-jakarta font-semibold text-[11px] px-3 py-1.5 hover:opacity-90 transition disabled:opacity-50"
                      >
                        <HiOutlineChatBubbleLeftRight className="text-sm" />
                        {busy ? "Opening..." : "Chat"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
