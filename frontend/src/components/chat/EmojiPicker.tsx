import { useState, useRef, useEffect } from 'react';

const EMOJI_CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
    {
        label: 'Smileys', icon: '😊',
        emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🥴','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥳']
    },
    {
        label: 'Gestures', icon: '👋',
        emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃']
    },
    {
        label: 'Animals', icon: '🐶',
        emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔']
    },
    {
        label: 'Food', icon: '🍕',
        emojis: ['🍎','🍊','🍋','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🧄','🧅','🥔','🌽','🥕','🫛','🧆','🥜','🫘','🍞','🥐','🥖','🫓','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫔','🌮','🌯','🥙','🧆','🥚','🍿','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦀','🦞','🦐','🦑','🦪','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🫖','🍵','🧃','🥤','🧋','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🫗','🥴','🧊']
    },
    {
        label: 'Travel', icon: '🚀',
        emojis: ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍','🛵','🛺','🚲','🛴','🛹','🛼','🛷','🚏','🛣','🛤','⛽','🛞','🚨','🚥','🚦','🛑','🚧','⚓','🛟','⛵','🚤','🛥','🛳','⛴','🚢','✈️','🛩','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰','🚀','🛸','🎡','🎢','🎠','🏗','🌁','🗼','🗽','⛲','🎑','⛺','🏕','🏖','🏜','🏝','🏞','🏟','🏛','🏗','🧱','🪨','🪵','🛖','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗻','🌃','🏙','🌄','🌅','🌆','🌇','🌉','🌌','🌠','🎇','🎆','🌈','🌐','🗺']
    },
    {
        label: 'Objects', icon: '💡',
        emojis: ['⌚','📱','💻','⌨','🖥','🖨','🖱','🖲','💽','💾','💿','📀','📷','📸','📹','🎥','📽','🎞','📞','☎','📟','📠','📺','📻','🎙','🎚','🎛','⏱','⏲','⏰','🕰','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯','🪔','🧱','🔮','🪄','💈','🔭','🔬','🩺','🩻','💊','💉','🩹','🩼','🩺','🚪','🪞','🪟','🛏','🛋','🪑','🚿','🛁','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🫧','🧽','🧯','🛒','🚽','🪠','🪤','🧸','🪆','🖼','🧩','♟','🎭','🎨','🧵','🧶','🪢','🔑','🗝','🔨','🪓','⛏','⚒','🛠','🗡','⚔','🛡','🪤','🔧','🔩','⚙','🗜','⚖','🪜','🔗','⛓','🧲','🪝','🧰','🧲','🪜']
    },
    {
        label: 'Symbols', icon: '❤️',
        emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','☮','✝','☪','🕉','☸','✡','🔯','🕎','☯','☦','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛','🉑','☢','☣','📴','📳','🈶','🈚','🈸','🈺','🈷','✴','🆚','💮','🉐','㊙','㊗','🈴','🈵','🈹','🈲','🅰','🅱','🆎','🆑','🅾','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼','⁉','🔅','🔆','〽','⚠','🚸','🔱','⚜','🔰','♻','✅','🈯','💹','❇','✳','❎','🌐','💠','Ⓜ','🌀','💤','🏧','🚾','♿','🅿','🛗','🈳','🈂','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧','🚻','🚮','🎦','📶','🈁','🔣','ℹ','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','▶','⏩','⏭','⏯','◀','⏪','⏮','🔼','⏫','🔽','⏬','⏸','⏹','⏺','🎦','🔅','🔆','📶','🛜','📳','📴']
    },
];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    const [activeCategory, setActiveCategory] = useState(0);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Slight delay so the button click that opened doesn't immediately close it
        const id = setTimeout(() => document.addEventListener('mousedown', handleClick), 100);
        return () => { clearTimeout(id); document.removeEventListener('mousedown', handleClick); };
    }, [onClose]);

    const filteredEmojis = search.trim()
        ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => {
            // Simple search — match the emoji itself or category label  
            return e.includes(search) || search.length === 0;
        })
        : EMOJI_CATEGORIES[activeCategory].emojis;

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute', bottom: '100%', left: 0, marginBottom: 8,
                width: 320, maxHeight: 380,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                boxShadow: 'var(--shadow-lg)',
                display: 'flex', flexDirection: 'column',
                zIndex: 200,
                overflow: 'hidden',
                animation: 'popIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
        >
            {/* Search */}
            <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border)' }}>
                <input
                    autoFocus
                    placeholder="Search emoji…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        width: '100%', padding: '6px 10px',
                        background: 'var(--bg-input)', border: '1px solid var(--border)',
                        borderRadius: 8, fontSize: 13, color: 'var(--text-primary)',
                        outline: 'none',
                    }}
                />
            </div>

            {/* Category tabs */}
            {!search && (
                <div style={{
                    display: 'flex', overflowX: 'auto', padding: '6px 8px 0',
                    gap: 2, borderBottom: '1px solid var(--border)',
                    scrollbarWidth: 'none',
                }}>
                    {EMOJI_CATEGORIES.map((cat, idx) => (
                        <button
                            key={cat.label}
                            title={cat.label}
                            onClick={() => setActiveCategory(idx)}
                            style={{
                                flexShrink: 0, padding: '4px 8px',
                                background: activeCategory === idx ? 'var(--bg-hover)' : 'transparent',
                                border: 'none', borderRadius: '6px 6px 0 0',
                                fontSize: 18, cursor: 'pointer',
                                borderBottom: activeCategory === idx ? '2px solid var(--accent)' : '2px solid transparent',
                                transition: 'all 0.15s',
                            }}
                        >
                            {cat.icon}
                        </button>
                    ))}
                </div>
            )}

            {/* Emoji grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
                gap: 2, padding: '8px', overflowY: 'auto', flex: 1,
            }}>
                {filteredEmojis.map((emoji, i) => (
                    <button
                        key={`${emoji}-${i}`}
                        onClick={() => onSelect(emoji)}
                        title={emoji}
                        style={{
                            fontSize: 22, padding: '4px', border: 'none',
                            background: 'transparent', borderRadius: 6, cursor: 'pointer',
                            lineHeight: 1, transition: 'transform 0.1s, background 0.1s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--bg-hover)';
                            e.currentTarget.style.transform = 'scale(1.2)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
