import { useEffect, useRef, useState } from "react";
import { HiOutlineMagnifyingGlass, HiOutlineUserPlus } from "react-icons/hi2";
import api from "../../services/api";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import { Avatar } from "../ui/Avatar";
import { Spinner } from "../ui/Spinner";
import VerifiedBadge from "../VerifiedBadge";

export default function NewChatModal({ open, onClose, onSelect }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(null);
  const debouncedRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debouncedRef.current) clearTimeout(debouncedRef.current);
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debouncedRef.current = setTimeout(() => {
      api
        .get("/users/search", { params: { q: q.trim(), limit: 20 } })
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
      if (debouncedRef.current) clearTimeout(debouncedRef.current);
    };
  }, [q, open]);

  async function handlePick(u) {
    if (opening) return;
    setOpening(true);
    try {
      const { data } = await api.get(`/chat/conversations/with/${u._id}`);
      const conv = data.conversation;
      onSelect?.(conv, u);
      onClose?.();
    } catch (e) {
      setError(e.response?.data?.error || "Could not open conversation");
    } finally {
      setOpening(false);
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
            <div className="py-6 text-center text-[11px] font-jakarta text-ink/50 dark:text-cream/50 italic">
              {q.trim()
                ? "No users found"
                : "Type a name to find people to chat with"}
            </div>
          ) : (
            <ul className="space-y-0.5">
              {results.map((u) => (
                <li key={u._id}>
                  <button
                    onClick={() => handlePick(u)}
                    disabled={opening}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition hover:bg-peach/40 dark:hover:bg-white/5 disabled:opacity-50"
                  >
                    <Avatar src={u.avatar} name={u.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream truncate flex items-center gap-1">
                        <span className="truncate">
                          {u.shopName || u.name}
                        </span>
                        <VerifiedBadge
                          isVerifiedSeller={!!u.isVerifiedSeller}
                          size={12}
                        />
                      </div>
                      <div className="text-[10px] text-ink/50 dark:text-cream/50 mt-0.5 capitalize font-jakarta">
                        {u.role || "user"}
                        {u.shopName && u.name !== u.shopName
                          ? ` · ${u.name}`
                          : ""}
                      </div>
                    </div>
                    <HiOutlineUserPlus className="text-ink/40 dark:text-cream/40 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
