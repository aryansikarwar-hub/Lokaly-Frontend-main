import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlinePaperAirplane,
  HiOutlineChatBubbleLeftRight,
  HiOutlineSparkles,
  HiOutlinePlus,
} from "react-icons/hi2";
import dayjs from "dayjs";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuthStore } from "../store/authStore";
import { Avatar } from "../components/ui/Avatar";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import StartChatModal from "../components/StartChatModal";
import toast from "react-hot-toast";

export default function Messages() {
  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [faqSuggest, setFaqSuggest] = useState(null);
  const [typingPeer, setTypingPeer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [params] = useSearchParams();
  const scrollRef = useRef(null);
  const user = useAuthStore((s) => s.user);

  const active = useMemo(
    () => convos.find((c) => c.id === activeId),
    [convos, activeId],
  );

  useEffect(() => {
    api
      .get("/chat/conversations")
      .then(({ data }) => setConvos(data.conversations || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const to = params.get("to");
    if (!to) return;
    api.get(`/chat/conversations/with/${to}`).then(({ data }) => {
      const conv = data.conversation;
      setConvos((prev) => {
        if (prev.some((c) => c.id === conv._id)) return prev;
        const other = conv.participants.find(
          (p) => String(p._id) !== String(user?._id),
        );
        return [
          {
            id: conv._id,
            other,
            lastMessage: conv.lastMessage,
            unread: 0,
            updatedAt: conv.updatedAt,
          },
          ...prev,
        ];
      });
      setActiveId(conv._id);
    });
  }, [params, user?._id]);

  useEffect(() => {
    if (!activeId) return;
    api
      .get(`/chat/conversations/${activeId}/messages`)
      .then(({ data }) => setMessages(data.messages || []));
    const s = getSocket();
    s.emit("chat:join", { conversationId: activeId });
    const onMessage = (msg) => {
      if (String(msg.conversation) === String(activeId))
        setMessages((m) => [...m, msg]);
      setConvos((list) =>
        list.map((c) =>
          c.id === msg.conversation
            ? {
                ...c,
                lastMessage: {
                  text: msg.text,
                  at: msg.createdAt,
                  from: msg.from,
                },
              }
            : c,
        ),
      );
    };
    const onTyping = ({ conversationId, isTyping, from }) => {
      if (
        String(conversationId) === String(activeId) &&
        String(from) !== String(user?._id)
      )
        setTypingPeer(!!isTyping);
    };
    s.on("chat:message", onMessage);
    s.on("chat:typing", onTyping);
    return () => {
      s.emit("chat:leave", { conversationId: activeId });
      s.off("chat:message", onMessage);
      s.off("chat:typing", onTyping);
    };
  }, [activeId, user?._id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (!text || !active?.other?._id) {
      setFaqSuggest(null);
      return;
    }
    const h = setTimeout(() => {
      api
        .get("/faq/suggest", {
          params: { query: text, sellerId: active.other._id },
        })
        .then(({ data }) => setFaqSuggest(data.suggestion))
        .catch(() => setFaqSuggest(null));
    }, 500);
    return () => clearTimeout(h);
  }, [text, active]);

  async function send(e) {
    e?.preventDefault?.();
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText("");
    const s = getSocket();
    s.emit("chat:send", { conversationId: active.id, text: body }, (ack) => {
      if (ack?.error) toast.error(ack.error);
      if (ack?.message) setMessages((m) => [...m, ack.message]);
    });
  }

  async function handleNewChatSelected(arg, maybeUser) {
    // StartChatModal may hand us either a user (to open) or an already-opened
    // conversation (its participants array tells us which).
    let conv = null;
    let picked = null;

    if (arg && Array.isArray(arg.participants)) {
      conv = arg;
      picked = maybeUser || null;
    } else if (arg?._id) {
      picked = arg;
      try {
        const { data } = await api.get(
          `/chat/conversations/with/${arg._id}`,
        );
        conv = data?.conversation || data;
      } catch (e) {
        toast.error(e.response?.data?.error || "Could not open conversation");
        return;
      }
    }

    if (!conv?._id) return;

    setConvos((prev) => {
      if (prev.some((c) => c.id === conv._id)) return prev;
      const other =
        conv.participants?.find(
          (p) => String(p._id) !== String(user?._id),
        ) || picked;
      return [
        {
          id: conv._id,
          other,
          lastMessage: conv.lastMessage,
          unread: 0,
          updatedAt: conv.updatedAt,
        },
        ...prev,
      ];
    });
    setActiveId(conv._id);
    setNewChatOpen(false);
  }

  function onTyping(v) {
    setText(v);
    if (!active) return;
    getSocket().emit("chat:typing", {
      conversationId: active.id,
      isTyping: v.length > 0,
    });
  }

  if (loading)
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <div className="mb-5">
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Inbox
        </div>
        <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight flex items-center gap-2">
          <HiOutlineChatBubbleLeftRight className="text-mauve" />
          Messages
        </h1>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-3 min-h-[70vh]">
        {/* Conversations list */}
        <aside className="rounded-2xl bg-white/80 border border-ink/5 overflow-hidden flex flex-col">
          <div className="px-3 py-2.5 border-b border-ink/5 flex items-center justify-between gap-2">
            <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50">
              Conversations
            </div>
            <span className="text-[10px] text-ink/45 font-jakarta">
              {convos.length}
            </span>
          </div>
          <div className="px-2 pt-2">
            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-ink text-cream dark:bg-coral dark:text-white font-jakarta font-semibold text-[11px] py-2 hover:opacity-90 transition"
            >
              <HiOutlinePlus className="text-sm" />
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {convos.length === 0 ? (
              <p className="text-[11px] text-ink/50 font-jakarta italic px-2 py-3 leading-relaxed">
                Say hi to a seller from any product page to start a
                conversation.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {convos.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition ${
                        activeId === c.id ? "bg-peach/80" : "hover:bg-peach/40"
                      }`}
                    >
                      <Avatar
                        src={c.other?.avatar}
                        name={c.other?.name}
                        size="xs"
                        aura={c.other?.trustScore}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-jakarta font-semibold text-ink truncate">
                          {c.other?.shopName || c.other?.name}
                        </div>
                        <div className="text-[11px] text-ink/55 truncate mt-0.5">
                          {c.lastMessage?.text}
                        </div>
                      </div>
                      {c.unread > 0 && (
                        <span className="bg-coral text-white text-[9px] font-bold rounded-full w-4 h-4 grid place-items-center shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Active conversation */}
        <section className="rounded-2xl bg-white/80 border border-ink/5 flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 grid place-items-center">
              <EmptyState
                title="Pick a conversation"
                hint="Start a chat from any product page"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-ink/5">
                <Avatar
                  src={active.other?.avatar}
                  name={active.other?.name}
                  size="xs"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-jakarta font-semibold text-xs text-ink truncate">
                    {active.other?.shopName || active.other?.name}
                  </div>
                  <div className="text-[10px] text-ink/50 font-jakarta flex items-center gap-1">
                    {typingPeer ? (
                      <>
                        <span className="w-1 h-1 rounded-full bg-coral animate-pulse" />
                        Typing...
                      </>
                    ) : (
                      <>
                        <span className="w-1 h-1 rounded-full bg-leaf" />
                        Online
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-auto px-4 py-4 space-y-2"
              >
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => {
                    const mine = String(m.from) === String(user?._id);
                    return (
                      <motion.div
                        key={m._id || i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`max-w-[75%] ${mine ? "ml-auto" : ""}`}
                      >
                        <div
                          className={`rounded-2xl px-3 py-2 text-xs ${
                            mine
                              ? "bg-coral text-white rounded-br-sm"
                              : "bg-cream border border-ink/5 text-ink rounded-bl-sm"
                          } ${m.moderation?.flagged ? "italic opacity-70" : ""}`}
                        >
                          {m.moderation?.flagged
                            ? "Message hidden by Controlled Chats"
                            : m.text}
                        </div>
                        <div
                          className={`text-[9px] text-ink/40 mt-0.5 font-jakarta ${
                            mine ? "text-right" : ""
                          }`}
                        >
                          {m.createdAt
                            ? dayjs(m.createdAt).format("h:mm A")
                            : "now"}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {faqSuggest && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-3 mb-2 rounded-xl bg-lavender/50 border border-lavender/40 p-2.5"
                >
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-mauve font-jakarta font-semibold mb-1">
                    <HiOutlineSparkles className="text-xs" /> Smart FAQ
                    suggestion
                  </div>
                  <div className="text-[11px] text-ink/75 font-jakarta leading-relaxed">
                    {faqSuggest}
                  </div>
                </motion.div>
              )}

              <form
                onSubmit={send}
                className="border-t border-ink/5 p-2 flex gap-2"
              >
                <Input
                  value={text}
                  onChange={(e) => onTyping(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  leftIcon={<HiOutlinePaperAirplane />}
                >
                  Send
                </Button>
              </form>
            </>
          )}
        </section>
      </div>

      <StartChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onSelect={handleNewChatSelected}
      />
    </div>
  );
}
