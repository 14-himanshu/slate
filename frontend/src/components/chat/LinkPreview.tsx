

interface LinkPreviewProps {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string;
}

export function LinkPreview({ title, description, image, url }: LinkPreviewProps) {
    if (!title && !description && !image) return null; // Nothing to show

    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                textDecoration: 'none', 
                color: 'inherit',
                marginTop: 8,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
                maxWidth: 400,
                transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {image && (
                <div style={{ width: '100%', height: 180, overflow: 'hidden', background: 'var(--bg-surface)' }}>
                    <img src={image} alt={title || 'Link preview'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {title && <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>}
                {description && <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</span>}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {url ? (() => { try { return new URL(url).hostname; } catch (e) { return url; } })() : ''}
                </span>
            </div>
        </a>
    );
}
